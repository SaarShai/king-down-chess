import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { assertProbeOrder, buildWorkerProbe, recoveryOutput, siteRoute } from './web-online-check.mjs';
import { vercelRoutes } from './plugin-server-build.mjs';
import { ART_HEADERS } from './plugin-art-headers.mjs';

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

describe('worker probe order', () => {
  it('requires a fresh reply before one probe, after old-cache deletion', () => {
    const events = [{ event: 'deleted' }, { event: 'reply' }, { event: 'probe', marker: 'one' }];
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
});

describe('recovery output', () => {
  let root: string;
  beforeEach(async () => { root = await mkdtemp(join(tmpdir(), 'web-recovery-test-')); });
  afterEach(async () => { await rm(root, { recursive: true, force: true }); });
  const complete = async () => {
    const files: Record<string, string> = {
      'config.json': '{"version":3,"routes":[]}', 'static/index.html': '<html></html>',
      'static/sw.js': "const VERSION = 'built';\nconst POLICY = 'public-build-v1';\nconst ALLOWLIST = [\"./\",\"assets/local.js\"];\nconst PRECACHE = [\"./\"];",
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
  it('keeps the frozen predecessor byte for byte', async () => {
    const old = await readFile(new URL('./fixtures/web-worker/old-sw.js', import.meta.url));
    expect(createHash('sha256').update(old).digest('hex')).toBe('f0b151cd7cb703053d22fa9e9ec970ba7c95f080330e8ef5d5fee695983df8b7');
  });
});

it('builds the browser probe with the real private-send boundary', async () => {
  const code = await buildWorkerProbe();
  expect(code).toContain('kingdown-cache-policy');
  expect(code).toContain('X-Fixture-Tab');
  expect(code).not.toContain('configurePlugin');
});

it('holds page receipt without keeping a worker event open and drops a closed port reply', async () => {
  const surface = { MessageChannel: globalThis.MessageChannel };
  vi.stubGlobal('window', surface); vi.stubGlobal('location', { href: 'http://fixture/one' });
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const send = vi.fn(async (url: string) => { if (url.startsWith('/fixture/reply')) await gate; return new Response('ok'); });
  vi.stubGlobal('fetch', send);
  await import('./fixtures/web-worker/page');
  const old = new surface.MessageChannel(), fresh = new surface.MessageChannel();
  const stale = vi.fn(), received = vi.fn();
  try {
    old.port1.onmessage = stale; fresh.port1.onmessage = received;
    old.port2.postMessage({ requestId: 'old', version: 'old' });
    fresh.port2.postMessage({ requestId: 'fresh', version: 'fresh' });
    await vi.waitFor(() => expect(send.mock.calls.filter(([url]) => url.startsWith('/fixture/reply'))).toHaveLength(2));
    expect(stale).not.toHaveBeenCalled(); expect(received).not.toHaveBeenCalled();
    old.port1.onmessage = null; old.port1.close(); release();
    await vi.waitFor(() => expect(received).toHaveBeenCalledOnce());
    expect(stale).not.toHaveBeenCalled();
    expect(received.mock.calls[0][0].data.requestId).toBe('fresh');
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
