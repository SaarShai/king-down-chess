import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const origin = 'https://kingdown.test';
const version = 'test-build';
const current = `kingdown-${version}`;
const files = ['./', 'index.html', 'assets/main.js', 'assets/main.css', 'assets/workshop.js', 'assets/worker.js', 'ui/pawn.webp'];
const url = (path: string) => new URL(path, `${origin}/`).href;
const template = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');
const script = template.replace("const VERSION = 'dev';", `const VERSION = '${version}';`)
  .replace('const ALLOWLIST = [];', `const ALLOWLIST = ${JSON.stringify(files)};`)
  .replace('const PRECACHE = [];', `const PRECACHE = ${JSON.stringify(files.filter(file => file !== 'index.html'))};`);

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

/** Node responses have no network URL or basic type. Keep the real body and headers. */
function response(path: string, init: ResponseInit & { type?: ResponseType; redirected?: boolean } = {}) {
  const decorate = (result: Response): Response => {
    const clone = result.clone.bind(result);
    Object.defineProperties(result, {
      url: { value: url(path) }, type: { value: init.type ?? 'basic' }, redirected: { value: init.redirected ?? false },
      clone: { value: () => decorate(clone()) },
    });
    return result;
  };
  return decorate(new Response('public bytes', init));
}

class MemoryCache {
  entries = new Map<string, Response>();
  match = vi.fn(async (request: Request | string) => this.entries.get(typeof request === 'string' ? url(request) : request.url)?.clone());
  put = vi.fn(async (request: Request | string, value: Response) => { this.entries.set(typeof request === 'string' ? url(request) : request.url, value); });
  keys = vi.fn(async () => [...this.entries.keys()].map(key => new Request(key)));
}

function storage() {
  const entries = new Map<string, MemoryCache>();
  return {
    entries,
    keys: vi.fn(async () => [...entries.keys()]),
    delete: vi.fn(async (key: string) => entries.delete(key)),
    open: vi.fn(async (key: string) => {
      if (!entries.has(key)) entries.set(key, new MemoryCache());
      return entries.get(key)!;
    }),
  };
}

function worker(caches = storage()) {
  const listeners = new Map<string, (event: any) => void>();
  const fetch = vi.fn(async (request: Request) => response(request.url));
  const claim = vi.fn(async () => {}), skipWaiting = vi.fn(async () => {});
  const timerStarted = deferred();
  const timers = new Map<number, () => void>();
  const saved = { 'kingdown.save': 'saved move', 'kingdown.lessons': 'lesson progress', 'kingdown.workshop': 'design', 'kingdown.sync': 'cloud stamp' };
  const storageAccess = vi.fn(() => { throw new Error('Other storage must stay closed'); });
  runInNewContext(script, {
    Request, Response, URL, caches, fetch,
    self: { location: new URL(`${origin}/sw.js`), registration: { scope: `${origin}/` }, clients: { claim }, skipWaiting, addEventListener: (type: string, listener: (event: any) => void) => listeners.set(type, listener) },
    localStorage: { ...saved, clear: storageAccess, removeItem: storageAccess, setItem: storageAccess },
    sessionStorage: { clear: storageAccess }, indexedDB: { deleteDatabase: storageAccess, open: storageAccess },
    setTimeout: (callback: (value: null) => void, _ms: number, value: null) => {
      const id = timers.size + 1; timers.set(id, () => callback(value)); timerStarted.resolve(); return id;
    },
    clearTimeout: (id: number) => timers.delete(id),
  });
  const fire = (type: string, fields = {}) => {
    const waits: Promise<unknown>[] = [];
    let result: Promise<Response> | undefined;
    listeners.get(type)!({ ...fields, waitUntil: (promise: Promise<unknown>) => waits.push(promise), respondWith: (promise: Promise<Response>) => { result = promise; } });
    return { response: result, waits, done: async () => { if (result) await result; await Promise.all(waits); } };
  };
  const request = (path: string, init: RequestInit & { mode?: string } = {}) => {
    const req = new Request(url(path), { ...init, mode: init.mode === 'navigate' ? undefined : init.mode as RequestMode });
    if (init.mode === 'navigate') Object.defineProperty(req, 'mode', { value: 'navigate' });
    return fire('fetch', { request: req });
  };
  const message = (fields = {}) => {
    const postMessage = vi.fn();
    const event = fire('message', { data: { type: 'kingdown-cache-policy', requestId: 'fresh-request' }, source: { type: 'window', url: `${origin}/play/` }, ports: [{ postMessage }], ...fields });
    return { ...event, postMessage };
  };
  return { caches, fetch, claim, skipWaiting, fire, request, message, timers, timerStarted, saved, storageAccess };
}

const privatePaths = ['/api', '/mcp', '/authorize', '/auth', '/oauth', '/consent', '/login', '/logout', '/signin', '/signout', '/callback', '/.well-known', '/internal', '/play', '/g', '/j'];

describe('public request boundary', () => {
  it.each([...privatePaths.flatMap(path => [path, `${path}/child`]), '/play.html', '/consent.mjs', '/privacy.html', '/terms.html', '/delete-data.html', '/support.html', '/assets/unknown.js', '/sw.js'])('bypasses %s with queries and navigation', async path => {
    const w = worker();
    for (const suffix of ['', '?probe=1']) for (const mode of ['navigate', 'cors']) {
      expect(w.request(path + suffix, { mode }).response).toBeUndefined();
    }
    expect(w.caches.open).not.toHaveBeenCalled();
    expect(w.fetch).not.toHaveBeenCalled();
  });

  it.each([
    { headers: { Authorization: 'Bearer test' } }, { headers: { authorization: '' } },
    { cache: 'no-store' }, { headers: { 'Cache-Control': 'max-age=0, NO-STORE' } },
    { method: 'POST' }, { method: 'PUT' }, { method: 'DELETE' }, { method: 'HEAD' },
  ] satisfies RequestInit[])('bypasses a public file with %j before cache access', init => {
    const w = worker();
    for (const path of ['/assets/main.js', '/?fen=local', '/index.html?fen=local']) {
      expect(w.request(path, init).response).toBeUndefined();
    }
    expect(w.caches.open).not.toHaveBeenCalled();
    expect(w.fetch).not.toHaveBeenCalled();
  });

  it('bypasses foreign URLs and asset queries without a canonical cache read', () => {
    const w = worker();
    for (const path of ['https://other.test/assets/main.js', '/assets/main.js?v=1', '/ui/pawn.webp?code=secret']) {
      expect(w.request(path).response).toBeUndefined();
    }
    expect(w.caches.open).not.toHaveBeenCalled();
  });

  it('installs all local files, then takes over, with no other storage change', async () => {
    const w = worker();
    const unrelated = await w.caches.open('other-app');
    unrelated.entries.set(url('/private'), response('/private'));
    await w.fire('install').done();
    const cache = w.caches.entries.get(current)!;
    expect([...cache.entries.keys()]).toEqual(files.filter(file => file !== 'index.html').map(url));
    expect(w.skipWaiting).toHaveBeenCalledOnce();
    expect(w.caches.entries.get('other-app')).toBe(unrelated);
    expect(w.saved).toEqual({ 'kingdown.save': 'saved move', 'kingdown.lessons': 'lesson progress', 'kingdown.workshop': 'design', 'kingdown.sync': 'cloud stamp' });
    expect(w.storageAccess).not.toHaveBeenCalled();
  });

  it('serves an exact cached asset with Vary ignored and Search kept', async () => {
    const w = worker(), cache = await w.caches.open(current);
    cache.entries.set(url('/assets/main.js'), response('/assets/main.js', { headers: { Vary: 'Origin' } }));
    const event = w.request('/assets/main.js'); await event.done();
    expect(await event.response).toBeInstanceOf(Response);
    expect(cache.match).toHaveBeenCalledWith(expect.any(Request), { ignoreVary: true });
    expect(w.fetch).not.toHaveBeenCalled();
    expect(cache.put).not.toHaveBeenCalled();
  });

  it.each(['/', '/index.html', '/?game=local#board', '/index.html?game=local#board'])('fetches the actual local URL and caches only the root: %s', async path => {
    const w = worker();
    w.fetch.mockImplementation(async request => response(request.url.replace(/#.*$/, '')));
    await w.request(path, { mode: 'navigate' }).done();
    expect(w.fetch.mock.calls[0][0].url).toBe(url(path));
    expect([...w.caches.entries.get(current)!.entries.keys()]).toEqual([url('/')]);
    w.fetch.mockRejectedValue(new Error('offline'));
    const offline = w.request(path, { mode: 'navigate' }); await offline.done();
    expect(await (await offline.response)!.text()).toBe('public bytes');
  });

  it.each(['code', 'state', 'error', 'error_code', 'error_description', 'sb_flow_id', 'access_token', 'refresh_token', 'id_token', 'token', 'token_hash'])('does not save a root callback with %s', async key => {
    const w = worker();
    await w.request(`/?${key}=private`, { mode: 'navigate' }).done();
    expect(w.caches.entries.get(current)!.put).not.toHaveBeenCalled();
  });
});

const badResponses: [string, (path: string) => Response][] = [
  ['no-store', path => response(path, { headers: { 'Cache-Control': 'public, NO-StOrE, max-age=60' } })],
  ['failed status', path => response(path, { status: 500 })],
  ['non-basic type', path => response(path, { type: 'cors' })],
  ['redirect', path => response(path, { redirected: true })],
  ['private destination', () => response('/play.html')],
  ['different public destination', () => response('/assets/workshop.js')],
];

describe('cache writes', () => {
  it.each(badResponses)('refuses %s on install, page and asset writes', async (_name, make) => {
    for (const path of [null, '/', '/assets/main.js']) {
      const w = worker();
      const old = await w.caches.open('kingdown-old'); old.entries.set(url('/api/private?one'), response('/api/private?one'));
      w.fetch.mockImplementation(async request => make(request.url));
      const event = path === null ? w.fire('install') : w.request(path, { mode: path === '/' ? 'navigate' : 'cors' });
      if (path === null) await expect(event.done()).rejects.toThrow('Unsafe offline response');
      else { await event.done(); expect(await event.response).toBeInstanceOf(Response); }
      expect(w.caches.entries.get(current)!.put).not.toHaveBeenCalled();
      expect(w.skipWaiting).not.toHaveBeenCalled();
      expect(w.caches.entries.get('kingdown-old')).toBe(old);
    }
  });

  it('fails install if a required file is missing, with no purge or takeover', async () => {
    const w = worker(); await w.caches.open('kingdown-old');
    w.fetch.mockImplementation(async request => request.url.endsWith('worker.js') ? response(request.url, { status: 404 }) : response(request.url));
    await expect(w.fire('install').done()).rejects.toThrow('Unsafe offline response');
    expect(w.caches.entries.get(current)!.entries.has(url('/assets/main.js'))).toBe(true);
    expect(w.skipWaiting).not.toHaveBeenCalled();
    expect(w.caches.delete).not.toHaveBeenCalled();
    expect(w.caches.entries.has('kingdown-old')).toBe(true);
  });

  it('fails install on network or cache-write failure', async () => {
    for (const failure of ['network', 'write']) {
      const w = worker(), cache = await w.caches.open(current);
      if (failure === 'network') w.fetch.mockRejectedValue(new Error('network failed'));
      else cache.put.mockRejectedValue(new Error('quota'));
      await expect(w.fire('install').done()).rejects.toThrow();
      expect(w.skipWaiting).not.toHaveBeenCalled();
    }
  });

  it.each(['/', '/assets/main.js'])('keeps a successful network response when a runtime write fails: %s', async path => {
    const w = worker(), cache = await w.caches.open(current);
    cache.put.mockRejectedValue(new Error('quota'));
    const event = w.request(path); await event.done();
    expect((await event.response)!.status).toBe(200);
    expect(cache.put).toHaveBeenCalledOnce();
  });

  it.each(['/', '/assets/main.js'])('keeps a successful network response when cache access fails: %s', async path => {
    const w = worker(); w.caches.open.mockRejectedValue(new Error('storage blocked'));
    const event = w.request(path); await event.done();
    expect((await event.response)!.status).toBe(200);
  });

  it('waits for asset writes before it completes the fetch', async () => {
    const w = worker(), cache = await w.caches.open(current), write = deferred(), started = deferred();
    cache.put.mockImplementation(async () => { started.resolve(); await write.promise; });
    const event = w.request('/assets/main.js');
    await started.promise;
    let finished = false; event.response!.then(() => { finished = true; });
    await Promise.resolve(); expect(finished).toBe(false);
    write.resolve(); await event.done(); expect(finished).toBe(true);
  });

  it('returns a cached local link on timeout and keeps the late write alive', async () => {
    const w = worker(), cache = await w.caches.open(current), network = deferred<Response>();
    cache.entries.set(url('/'), response('/'));
    w.fetch.mockReturnValue(network.promise);
    const event = w.request('/index.html?game=local', { mode: 'navigate' });
    await w.timerStarted.promise;
    for (const timeout of w.timers.values()) timeout();
    expect((await event.response)!.status).toBe(200);
    expect(event.waits).toHaveLength(1);
    expect(cache.put).not.toHaveBeenCalled();
    network.resolve(response('/index.html?game=local')); await event.done();
    expect([...cache.entries.keys()]).toEqual([url('/')]);
    expect(cache.put).toHaveBeenCalledOnce();
  });
});

describe('purge and policy proof', () => {
  it('purges all old application caches, then claims, without other storage access', async () => {
    const w = worker();
    for (const key of ['kingdown-old', 'kingdown-older', 'other-app']) await w.caches.open(key);
    await w.fire('activate').done();
    expect([...w.caches.entries.keys()].sort()).toEqual([current, 'other-app'].sort());
    expect(w.caches.keys).toHaveBeenCalledTimes(2);
    expect(w.claim).toHaveBeenCalledOnce();
    expect(w.storageAccess).not.toHaveBeenCalled();
  });

  it('holds activation and concurrent policy replies until deletion and final checks end', async () => {
    const w = worker(), deletion = deferred<boolean>(), started = deferred();
    await w.caches.open('kingdown-old');
    w.caches.delete.mockImplementation(async key => { started.resolve(); await deletion.promise; return w.caches.entries.delete(key); });
    const activation = w.fire('activate'), first = w.message(), second = w.message({ data: { type: 'kingdown-cache-policy', requestId: 'second-request' } });
    await started.promise;
    expect(w.claim).not.toHaveBeenCalled();
    expect(first.postMessage).not.toHaveBeenCalled(); expect(second.postMessage).not.toHaveBeenCalled();
    expect(w.caches.delete).toHaveBeenCalledOnce();
    deletion.resolve(true); await activation.done(); await first.done(); await second.done();
    expect(first.postMessage).toHaveBeenCalledExactlyOnceWith({ type: 'kingdown-cache-policy', requestId: 'fresh-request', policy: 'public-build-v1', version });
    expect(second.postMessage.mock.calls[0][0].requestId).toBe('second-request');
    expect(w.claim).toHaveBeenCalledOnce();
  });

  it.each(['throw', 'false', 'new cache'])('gives no success on a failed purge (%s), then can try again', async failure => {
    const w = worker(); await w.caches.open('kingdown-old');
    w.caches.delete.mockImplementationOnce(async key => {
      if (failure === 'throw') throw new Error('delete failed');
      if (failure === 'new cache') { w.caches.entries.delete(key); w.caches.entries.set('kingdown-late', new MemoryCache()); return true; }
      return false;
    });
    const first = w.message(), activation = w.fire('activate');
    await expect(first.done()).rejects.toThrow(); await expect(activation.done()).rejects.toThrow();
    expect(first.postMessage).not.toHaveBeenCalled(); expect(w.claim).not.toHaveBeenCalled();
    const retry = w.message(); await retry.done();
    expect(retry.postMessage).toHaveBeenCalledOnce();
    expect([...w.caches.entries.keys()]).toEqual([current]);
  });

  it('accepts a false delete only when a fresh enumeration proves absence', async () => {
    const w = worker(); await w.caches.open('kingdown-old');
    w.caches.delete.mockImplementationOnce(async key => { w.caches.entries.delete(key); return false; });
    const event = w.message(); await event.done();
    expect(w.caches.keys).toHaveBeenCalledTimes(2);
    expect(event.postMessage).toHaveBeenCalledOnce();
  });

  it.each(['/api/game?one', '/api/game?two', '/play.html', '/assets/unknown.js', '/assets/main.js?code=private', '/index.html?game=local'])('refuses a current cache with a forbidden key: %s', async path => {
    const w = worker(), cache = await w.caches.open(current);
    cache.entries.set(url(path), response(path));
    const event = w.message(); await expect(event.done()).rejects.toThrow('Forbidden application cache key');
    expect(event.postMessage).not.toHaveBeenCalled();
  });

  it('holds success until the current cache enumeration ends', async () => {
    const w = worker(), cache = await w.caches.open(current), keys = deferred<Request[]>(), started = deferred();
    cache.keys.mockImplementationOnce(async () => { started.resolve(); return keys.promise; });
    const event = w.message(); await started.promise;
    expect(event.postMessage).not.toHaveBeenCalled();
    keys.resolve([new Request(url('/api/private'))]);
    await expect(event.done()).rejects.toThrow(); expect(event.postMessage).not.toHaveBeenCalled();
  });

  it.each(['cache names', 'current keys'])('refuses proof when enumeration fails: %s', async failure => {
    const w = worker(), cache = await w.caches.open(current);
    if (failure === 'cache names') w.caches.keys.mockRejectedValue(new Error('storage blocked'));
    else cache.keys.mockRejectedValue(new Error('storage blocked'));
    const event = w.message(); await expect(event.done()).rejects.toThrow('storage blocked');
    expect(event.postMessage).not.toHaveBeenCalled();
  });

  it('checks cache names again after the current cache check', async () => {
    const w = worker(), cache = await w.caches.open(current);
    cache.keys.mockImplementationOnce(async () => { await w.caches.open('kingdown-late'); return []; });
    const event = w.message(); await expect(event.done()).rejects.toThrow('Old application cache remains');
    expect(event.postMessage).not.toHaveBeenCalled();
  });

  it('enumerates on each request and after a worker restart', async () => {
    const w = worker(); const first = w.message(); await first.done();
    await w.caches.open('kingdown-after-success');
    const second = w.message(); await second.done();
    expect(w.caches.entries.has('kingdown-after-success')).toBe(false);
    await w.caches.open('kingdown-after-restart');
    const restarted = worker(w.caches), third = restarted.message(); await third.done();
    expect(w.caches.entries.has('kingdown-after-restart')).toBe(false);
    expect(third.postMessage).toHaveBeenCalledOnce();
  });

  it('gives no reply to an interrupted purge; a new global proves the retained caches again', async () => {
    const w = worker(), blocked = deferred<boolean>(), started = deferred();
    await w.caches.open('kingdown-old');
    w.caches.delete.mockImplementationOnce(async () => { started.resolve(); return blocked.promise; });
    const interrupted = w.message(); await started.promise;
    expect(interrupted.postMessage).not.toHaveBeenCalled();
    const restarted = worker(w.caches), next = restarted.message(); await next.done();
    expect(next.postMessage).toHaveBeenCalledOnce();
    blocked.reject(new Error('worker stopped'));
    await expect(interrupted.done()).rejects.toThrow('worker stopped');
    expect(interrupted.postMessage).not.toHaveBeenCalled();
  });

  it.each([
    { data: undefined }, { data: { type: 'other', requestId: 'id' } },
    { data: { type: 'kingdown-cache-policy' } }, { data: { type: 'kingdown-cache-policy', requestId: '' } },
    { data: { type: 'kingdown-cache-policy', requestId: 42 } }, { source: null },
    { source: { type: 'worker', url: `${origin}/` } }, { source: { type: 'window', url: 'https://other.test/' } },
    { source: { type: 'window', url: 'invalid' } }, { ports: [] }, { ports: [{}] },
  ])('ignores an invalid policy request: %j', async fields => {
    const w = worker(), event = w.message(fields); await event.done();
    expect(event.waits).toHaveLength(0); expect(event.postMessage).not.toHaveBeenCalled();
    expect(w.caches.keys).not.toHaveBeenCalled(); expect(w.caches.open).not.toHaveBeenCalled();
  });
});
