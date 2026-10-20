import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { assertInterruptedPurge, assertLocalData, assertProbeOrder, buildWorkerProbe, checkAccountOff, localData, PERSISTENT_OPTIONS, recoveryOutput, restoreLocalSave, savedGameSynced, serveSite, siteRoute, WORKSHOP_SHELF } from './web-online-check.mjs';
import { vercelRoutes } from './plugin-server-build.mjs';
import { ART_HEADERS } from './plugin-art-headers.mjs';
import { loadShelf } from '../src/workshop/store';
import { readLocal, stamp } from '../src/account/sync';
import { readWebAccountAccess } from '../src/online/account-access';
import { createWebAccountAccess } from '../src/api/account-access';
import type { Pool } from 'pg';

describe('web check site routes', () => {
  const config = { routes: vercelRoutes() };

  it.each(['/', '/assets/app.js', '/play/', '/g/game-id', '/j', '/api', '/api/games'])('preserves %s when the build has no rewrite', path => {
    expect(siteRoute(config, path)).toEqual({ dest: path, headers: {} });
  });

  it('uses the build headers for board art', () => {
    expect(siteRoute(config, '/plugin-art/pawn.svg')).toEqual({
      dest: '/plugin-art/pawn.svg', headers: { ...ART_HEADERS, 'Content-Type': 'image/svg+xml' },
    });
  });

  it('uses a build rewrite and its continued headers', () => {
    const routes = [
      { src: '^/internal/.+$', headers: { 'Cache-Control': 'no-store' }, continue: true },
      { src: '^/internal/.+$', dest: '/internal' },
    ];
    expect(siteRoute({ routes }, '/internal/tick')).toEqual({ dest: '/internal', headers: { 'Cache-Control': 'no-store' } });
  });
});

it('serves each selected output with its own files, API routes and function', async () => {
  const work = await mkdtemp(join(tmpdir(), 'web-output-test-'));
  const output = async (name: string, dest: string, src: string) => {
    const root = join(work, name);
    await mkdir(join(root, 'static'), { recursive: true });
    await writeFile(join(root, 'static/index.html'), name);
    await mkdir(join(root, 'functions', `${dest}.func`), { recursive: true });
    const handler = vi.fn(async (req: IncomingMessage, res: ServerResponse) => {
      let body = ''; for await (const part of req) body += part;
      res.writeHead(404, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }).end(JSON.stringify({ code: 'NOT_FOUND', output: name, url: req.url, method: req.method, body }));
    });
    return { root, config: { routes: [{ src, dest: `/${dest}` }] }, handler };
  };
  const release = await output('release', 'mcp', '^/api(?:/.*)?$');
  const recovery = await output('recovery', 'recovery', '^/api/recovery$');
  let selected = release;
  const server = createServer((req, res) => { void serveSite(selected, req, res).catch(() => res.writeHead(500).end()); });
  try {
    await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
    const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    for (const current of [release, recovery]) {
      selected = current;
      expect(await (await fetch(origin)).text()).toBe(current === release ? 'release' : 'recovery');
      expect(await (await fetch(origin, { method: 'HEAD' })).text()).toBe('');
      expect((await fetch(origin, { method: 'POST' })).status).toBe(404);
      const path = '/api/recovery?keep=a%2Bb&since=0';
      const response = await fetch(origin + path, { method: 'POST', body: '{broken' });
      expect(response.status).toBe(404); expect(response.headers.get('cache-control')).toBe('no-store');
      expect(await response.json()).toEqual({ code: 'NOT_FOUND', output: current === release ? 'release' : 'recovery', url: path, method: 'POST', body: '{broken' });
      const closed = await fetch(origin + '/api/me/games');
      expect(closed.status).toBe(404);
      expect(closed.headers.get('content-type')).toBe(current === release ? 'application/json' : null);
    }
    expect(release.handler).toHaveBeenCalledTimes(2); expect(recovery.handler).toHaveBeenCalledOnce();
  } finally {
    server.closeAllConnections(); await new Promise<void>(done => server.close(() => done()));
    await rm(work, { recursive: true, force: true });
  }
});

describe('worker probe order', () => {
  it('checks terminal refusal and catches a late reply or send during an interrupted purge', () => {
    const refusal = [{ event: 'request' }, { event: 'refused', marker: 'interrupted' }];
    expect(() => assertInterruptedPurge(refusal)).not.toThrow();
    for (const events of [refusal.slice(0, 1), [{ event: 'refused', marker: 'other' }], ...['reply', 'probe'].map(event => [...refusal, { event }])]) {
      expect(() => assertInterruptedPurge(events)).toThrow();
    }
  });
  it('requires a fresh reply before one probe, after old-cache deletion', () => {
    const events = [{ event: 'deleted' }, { event: 'reply', version: 'current', applicationCaches: ['kingdown-current'] }, { event: 'probe', marker: 'one', version: 'current' }];
    expect(() => assertProbeOrder(events, 'one')).not.toThrow();
    for (const trace of [events.slice(2), [...events.slice(1), events[0]], events.slice(0, 2)]) {
      expect(() => assertProbeOrder(trace, 'one')).toThrow();
    }
    expect(() => assertProbeOrder(events, 'one', 2)).toThrow();
    expect(() => assertProbeOrder([...events, events[2]], 'one')).toThrow();
    expect(() => assertProbeOrder([{ event: 'reply' }, { event: 'deleted' }, events[2]], 'one')).toThrow();
    for (const mismatch of [{ client: 'other-tab' }, { version: 'old' }]) {
      expect(() => assertProbeOrder([events[0], { event: 'reply', ...mismatch }, events[2]], 'one')).toThrow();
    }
  });
  it('refuses a reply while the stale cache remains, even if deletion ends before inspection', () => {
    expect(() => assertProbeOrder([
      { event: 'reply', version: 'current', applicationCaches: ['kingdown-current', 'kingdown-stale'] },
      { event: 'probe', marker: 'early', version: 'current' },
    ], 'early')).toThrow();
    expect(() => assertProbeOrder([{ event: 'reply' }, { event: 'probe', marker: 'missing' }], 'missing')).toThrow();
  });
});

describe('recovery output', () => {
  let root: string;
  beforeEach(async () => { root = await mkdtemp(join(tmpdir(), 'web-recovery-test-')); });
  afterEach(async () => { await rm(root, { recursive: true, force: true }); });
  const complete = async () => {
    const files: Record<string, string> = {
      'config.json': '{"version":3,"routes":[]}', 'static/index.html': '<html></html>',
      'static/sw.js': "const VERSION = 'built';\nconst POLICY = 'public-build-v1';\nconst ALLOWLIST = [\"./\",\"assets/local.js\"];\nconst PRECACHE = [\"./\",\"assets/local.js\"];",
      'static/assets/local.js': '// local', 'functions/mcp.func/server.mjs': '// server',
      'functions/mcp.func/.vc-config.json': '{}', 'functions/mcp.func/board.html': '<html></html>',
      'functions/mcp.func/runtime/index.mjs': '// runtime', 'functions/mcp.func/runtime/worker.mjs': '// worker',
      'functions/mcp.func/runtime/engines/archive.mjs': '// archive',
    };
    for (const [file, data] of Object.entries(files)) { await mkdir(dirname(join(root, file)), { recursive: true }); await writeFile(join(root, file), data); }
  };
  it('hashes the complete public graph, server and engines', async () => {
    await complete(); const first = await recoveryOutput(root);
    expect(first.root).toBe(root); expect(Object.keys(first.hashes)).toHaveLength(10);
    await writeFile(join(root, 'static/assets/local.js'), '// changed');
    expect((await recoveryOutput(root)).hashes['static/assets/local.js']).not.toBe(first.hashes['static/assets/local.js']);
  });
  it.each(['config.json', 'static/assets/local.js', 'functions/mcp.func/server.mjs', 'functions/mcp.func/runtime/engines/archive.mjs'])('refuses missing %s', async file => {
    await complete(); await rm(join(root, file)); await expect(recoveryOutput(root)).rejects.toThrow();
  });
  it.each(["const POLICY = 'old';", "const POLICY = 'public-build-v1';\nconst VERSION = 'dev';\nconst ALLOWLIST = [];\nconst PRECACHE = [];"])('refuses an unsafe or unbuilt worker', async worker => {
    await complete(); await writeFile(join(root, 'static/sw.js'), worker); await expect(recoveryOutput(root)).rejects.toThrow();
  });
  it('refuses a Workshop chunk that is allowed but absent from precache', async () => {
    await complete();
    const path = join(root, 'static/sw.js'), worker = await readFile(path, 'utf8');
    await writeFile(join(root, 'static/assets/workshop.js'), '// Workshop');
    await writeFile(path, worker.replace('const ALLOWLIST = ["./","assets/local.js"];', 'const ALLOWLIST = ["./","assets/local.js","assets/workshop.js"];'));
    await expect(recoveryOutput(root)).rejects.toThrow('precaches every public asset');
    await writeFile(path, (await readFile(path, 'utf8')).replace('const PRECACHE = ["./","assets/local.js"];', 'const PRECACHE = ["./","assets/local.js","assets/workshop.js"];'));
    await expect(recoveryOutput(root)).resolves.toHaveProperty('root', root);
    const driver = await readFile(new URL('./web-online-check.mjs', import.meta.url), 'utf8');
    const journey = driver.slice(driver.indexOf("// Use unmodified emitted workers"));
    expect(journey.indexOf("offline = true")).toBeLessThan(journey.indexOf("pressMenu(active, 'Workshop')"));
  });
  it('keeps the frozen predecessor byte for byte', async () => {
    const old = await readFile(new URL('./fixtures/web-worker/old-sw.js', import.meta.url));
    expect(createHash('sha256').update(old).digest('hex')).toBe('f0b151cd7cb703053d22fa9e9ec970ba7c95f080330e8ef5d5fee695983df8b7');
  });
});

it('builds the browser probe with the real private-send boundary', async () => {
  const code = await buildWorkerProbe();
  expect(code).toContain('kingdown-cache-policy');
  expect(code).toContain('X-Fixture-Tab');
  expect(code).toContain('/api/status');
  expect(code).toContain('readWebAccountAccess');
  expect(code).toContain('credentials: "omit"');
  expect(code).not.toContain('configurePlugin');
});

it('compares save, lesson, Workshop and sync stores, including absent data', async () => {
  const stored = { 'kingdown.save': 'saved', 'kingdown.lessons': 'lessons', 'kingdown.workshop': 'designs', 'kingdown.sync': null };
  vi.stubGlobal('localStorage', { getItem: (key: keyof typeof stored) => stored[key] });
  try {
    const page = { evaluate: (read: () => unknown) => Promise.resolve(read()) };
    expect(await localData(page)).toEqual(stored);
    expect(() => assertLocalData(stored, { ...stored })).not.toThrow();
    for (const key of Object.keys(stored)) expect(() => assertLocalData(stored, { ...stored, [key]: 'changed' })).toThrow('keep local data');
    expect(() => assertLocalData(stored, {})).toThrow();
  } finally { vi.unstubAllGlobals(); }
});

it.each([true, false])('checks closed status on the release and older recovery (release: %s)', async release => {
  const send = vi.fn(async () => new Response(release ? JSON.stringify({ account_access: 'closed', valid_for_ms: 0 }) : '{"code":"NOT_FOUND"}', {
    status: release ? 200 : 404, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' },
  }));
  vi.stubGlobal('fetch', send); vi.stubGlobal('navigator', {}); vi.stubGlobal('caches', { keys: async () => [] }); vi.stubGlobal('window', { readWebAccountAccess });
  const page = {
    request: { get: async (url: string) => {
      const response = url.endsWith('/api/status') ? await send() : new Response('{}', { status: release ? 503 : 404 });
      return { status: () => response.status, headers: () => Object.fromEntries(response.headers), json: () => response.json() };
    } },
    evaluate: (read: () => unknown) => read(),
  };
  try {
    await expect(checkAccountOff(page, 'http://fixture', release)).resolves.toBeUndefined();
    expect(send).toHaveBeenCalledTimes(2);
    expect(send).toHaveBeenLastCalledWith('/api/status', expect.objectContaining({ credentials: 'omit' }));
  } finally { vi.unstubAllGlobals(); }
});

it('waits for the held account import to stamp the complete normalized game', async () => {
  const data = new Map<string, string>();
  const store = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
  vi.stubGlobal('localStorage', store);
  let release!: () => void;
  const held = new Promise<void>(done => { release = done; });
  const startup = held.then(() => import('../src/account/account')).then(account => account.changed());
  try {
    const seed = { back: 'RNBQKBNR', fen: '', moves: ['e2-e4'], white: 'human', black: 'human', sound: false, pace: 'off' };
    store.setItem('kingdown.save', JSON.stringify(seed)); stamp(store, 3);
    expect(savedGameSynced()).toBe(false);
    const save = { ...seed, fen: 'normalized FEN', rules: { classic: true }, link: null, resigned: null, daily: null };
    store.setItem('kingdown.save', JSON.stringify(save));
    expect(savedGameSynced()).toBe(false);
    release(); await startup;
    expect(savedGameSynced()).toBe(true);
    expect(JSON.parse(JSON.parse(store.getItem('kingdown.sync')!).saved_game.json)).toEqual(readLocal(store).saved_game);
    for (const [key, value] of Object.entries({ fen: 'changed FEN', rules: { classic: false }, link: 1, daily: 'changed', resigned: 1 })) {
      store.setItem('kingdown.save', JSON.stringify({ ...save, [key]: value }));
      expect(savedGameSynced(), key).toBe(false);
    }
  } finally { release(); await startup; vi.unstubAllGlobals(); }
});

it('enables touch in the persistent profile used by offline board taps', () => {
  expect(PERSISTENT_OPTIONS.hasTouch).toBe(true);
});

it('restores the one-move save before the offline link can ask to replace it', async () => {
  const one = { back: 'RNBQKBNR', fen: 'normalized FEN', moves: ['e2-e4'], white: 'human', black: 'human' };
  let saved = JSON.stringify({ ...one, moves: ['e2-e4', 'e7-e5'] });
  vi.stubGlobal('localStorage', { setItem: (key: string, value: string) => { expect(key).toBe('kingdown.save'); saved = value; } });
  try {
    const continues = () => JSON.parse(saved).moves.every((move: string, index: number) => ['e2-e4'][index] === move);
    expect(continues()).toBe(false);
    await restoreLocalSave({ evaluate: (write: (value: string) => void, value: string) => write(value) }, JSON.stringify(one));
    expect(JSON.parse(saved)).toEqual(one); expect(continues()).toBe(true);
    const driver = await readFile(new URL('./web-online-check.mjs', import.meta.url), 'utf8');
    expect(driver).toContain('await restoreLocalSave(active, saved);\n      await active.goto(`${origin}/?army=RNBQKBNR&moves=e2-e4&players=human,ai`)');
  } finally { vi.unstubAllGlobals(); }
});

it.each([0, 5001])('checks the compiled switch with %s ms between requests', async delay => {
  const source = await readFile(new URL('./vercel-check.mjs', import.meta.url), 'utf8');
  const start = source.indexOf('  // One compiled getter'), end = source.indexOf("  const status = await api('/api/status');", start);
  expect(start).toBeGreaterThan(0); expect(end).toBeGreaterThan(start);
  const drill = source.slice(start, end);
  let now = 100, enabled = true;
  const clock = vi.spyOn(performance, 'now').mockImplementation(() => now);
  const pool = { query: async (sql: string, params?: boolean[]) => {
    if (sql.startsWith('update')) { enabled = params![0]; return { rows: [] }; }
    return { rows: [{ singleton: true, enabled }] };
  } };
  const app = { pool: { query: pool.query } }, query = app.pool.query;
  const access = createWebAccountAccess(app.pool as unknown as Pool);
  const api = async (path: string) => {
    const proof = await access(), remaining = Math.max(0, Math.floor(proof.expiresAt - now));
    const response = path === '/api/status' ? new Response(JSON.stringify({ account_access: proof.enabled && remaining > 0 ? 'open' : 'closed', valid_for_ms: proof.enabled ? remaining : 0 }))
      : new Response('{}', { status: proof.enabled ? 200 : 503 });
    now += delay; return response;
  };
  try {
    await runInNewContext(`(async () => { ${drill} })()`, { app, api, pool, signed: {}, performance,
      assert: Object.assign((value: unknown, message?: string) => assert(value, message), { equal: assert.equal, deepEqual: (actual: unknown, expected: unknown, message?: string) => expect(actual, message).toEqual(expected) }),
      setTimeout: (done: () => void, ms: number) => { now += ms; done(); },
    });
    expect(enabled).toBe(true); expect(app.pool.query).toBe(query);
  } finally { clock.mockRestore(); }
});

it('seeds a stored design that the local Workshop can read', () => {
  const shelf = loadShelf({ getItem: () => WORKSHOP_SHELF, setItem: () => {} });
  expect(shelf.bad).toBe(0); expect(shelf.designs).toHaveLength(1);
  expect(shelf.designs[0]).toMatchObject({ id: 'local-knight', name: 'My Knight', letter: 'X' });
});

it('holds page receipt without keeping a worker event open and drops a closed port reply', async () => {
  const surface = { MessageChannel: globalThis.MessageChannel };
  vi.stubGlobal('window', surface); vi.stubGlobal('location', { href: 'http://fixture/one' });
  const names = new Set(['kingdown-stale', 'unrelated-app']);
  const keys = vi.fn(async () => [...names]); vi.stubGlobal('caches', { keys });
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const send = vi.fn(async (url: string, _init?: RequestInit) => { if (url.startsWith('/fixture/reply')) await gate; return new Response('ok'); });
  vi.stubGlobal('fetch', send);
  await import('./fixtures/web-worker/page');
  const old = new surface.MessageChannel(), fresh = new surface.MessageChannel();
  const stale = vi.fn(), received = vi.fn();
  try {
    old.port1.onmessage = stale; fresh.port1.onmessage = received;
    old.port2.postMessage({ requestId: 'old', version: 'old' });
    fresh.port2.postMessage({ requestId: 'fresh', version: 'fresh' });
    await vi.waitFor(() => expect(send.mock.calls.filter(([url]) => url.startsWith('/fixture/reply'))).toHaveLength(2));
    expect(keys).toHaveBeenCalledTimes(2); names.delete('kingdown-stale');
    expect(stale).not.toHaveBeenCalled(); expect(received).not.toHaveBeenCalled();
    old.port1.onmessage = null; old.port1.close(); release();
    await vi.waitFor(() => expect(received).toHaveBeenCalledOnce());
    expect(stale).not.toHaveBeenCalled();
    expect(received.mock.calls[0][0].data.requestId).toBe('fresh');
    const events = send.mock.calls.filter(([url]) => url === '/fixture/event');
    expect(JSON.parse(events[0][1]!.body as string).applicationCaches).toEqual(['kingdown-stale']);
  } finally {
    release(); old.port1.close(); old.port2.close(); fresh.port1.close(); fresh.port2.close(); vi.unstubAllGlobals();
  }
});

it('finishes the worker message before the page holds receipt', async () => {
  const listeners = new Map<string, (event: any) => void>(), lifetimes: Promise<unknown>[] = [];
  const send = vi.fn(async (_url: string) => new Response('ok')), post = vi.fn();
  const realm = {
    caches: { delete: async () => true },
    self: { fetch: send, addEventListener: (type: string, listener: (event: any) => void) => { listeners.set(type, listener); } },
  };
  runInNewContext(await readFile(new URL('./fixtures/web-worker/faults.js', import.meta.url), 'utf8'), realm);
  const reply = { requestId: 'one', policy: 'public-build-v1', version: 'built' };
  realm.self.addEventListener('message', event => { event.waitUntil(Promise.resolve().then(() => event.ports[0].postMessage(reply))); });
  listeners.get('message')!({ data: { requestId: 'one' }, source: { url: 'http://fixture/one' }, ports: [{ postMessage: post }], waitUntil: (promise: Promise<unknown>) => { lifetimes.push(promise); } });
  await Promise.all(lifetimes);
  expect(post).toHaveBeenCalledWith(reply);
  expect(send.mock.calls.map(([url]) => url)).toEqual(['/fixture/event', '/fixture/event']);
});

it('reports refusal without a fetch that can wait behind activation', async () => {
  const record = vi.fn().mockResolvedValue(undefined), send = vi.fn();
  const surface = { MessageChannel: globalThis.MessageChannel, recordWorkerEvent: record, privateProbe: undefined as unknown as Window['privateProbe'] };
  vi.stubGlobal('window', surface); vi.stubGlobal('location', { href: 'http://fixture/one' });
  vi.stubGlobal('navigator', {}); vi.stubGlobal('caches', { keys: async () => { throw new Error('Blocked storage'); } }); vi.stubGlobal('fetch', send);
  vi.resetModules();
  try {
    await import('./fixtures/web-worker/page');
    expect(await surface.privateProbe('interrupted')).toEqual({ status: 503, code: 'UNAVAILABLE' });
    expect(record).toHaveBeenCalledWith({ event: 'refused', marker: 'interrupted', client: 'http://fixture/one' });
    expect(send).not.toHaveBeenCalled();
  } finally { vi.unstubAllGlobals(); vi.resetModules(); }
});

it('cleans the work tree when the event log cannot be written', async () => {
  const remove = vi.fn().mockResolvedValue(undefined);
  const listeners = ['SIGINT', 'SIGTERM', 'SIGHUP'].map(name => ({ name, before: process.listeners(name) }));
  vi.stubEnv('PLUGIN_TEST_DATABASE_URL', 'postgresql://kingdown_test@127.0.0.1:55432/kingdown_web_test');
  vi.resetModules();
  vi.doMock('node:fs/promises', async () => ({
    ...await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises'),
    mkdtemp: vi.fn().mockResolvedValue('/fixture/work'), mkdir: vi.fn().mockResolvedValue(undefined), rm: remove,
    writeFile: vi.fn().mockRejectedValue(new Error('ENOSPC')),
  }));
  vi.doMock('./plugin-server-build.mjs', () => ({ buildPluginServer: async () => { throw new Error('Build fails before launch'); } }));
  try {
    const { main } = await import('./web-online-check.mjs');
    await expect(main()).rejects.toThrow('ENOSPC');
    expect(remove).toHaveBeenCalledWith('/fixture/work', { recursive: true, force: true });
  } finally {
    for (const { name, before } of listeners) for (const listener of process.listeners(name)) if (!before.includes(listener)) process.removeListener(name, listener);
    vi.doUnmock('node:fs/promises'); vi.doUnmock('./plugin-server-build.mjs'); vi.unstubAllEnvs(); vi.resetModules();
  }
});
