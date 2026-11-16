/** Each delayed command keeps the controller's cancel signal through its last send boundary. */
import { afterEach, expect, it, vi } from 'vitest';
import { fixtureService } from '../../../tools/plugin-protocol-fixture';
import { DEFAULT_OPTIONS } from '../../match/setup';
import { onlineClient } from '../../online/client';
import { parseSq } from '../../rules/engine';
import { peopleController, type PeopleController } from './controller';
import { fakeServer, memoryStorage } from './fake-server';
import { receiptKey, receiptOf } from './receipt';
import { ObsoleteAction, peopleServer } from './server';
import { seatKingKey } from './seat-king';

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
function latch() { let release!: () => void; const promise = new Promise<void>(done => { release = done; }); return { promise, release }; }
const waits = ['king-current', 'command-current', 'receipt-current', 'saved-current', 'token', 'cache', 'cache-final', 'cache-delete', 'cache-lookup', 'cache-register', 'cache-delete-lookup', 'cache-final-lookup', 'cache-proof', 'cache-active-proof', 'cache-activation', 'cache-active-registration', 'cache-install-proof', 'cache-install-keys', 'cache-install-delete', 'cache-install-final', 'fetch', 'body', 'backoff-1', 'backoff-2', 'backoff-3', 'retry-token', 'retry-cache'] as const;
it.each(waits)('Stop closes Ready at the %s wait', async stage => {
  const games = fixtureService(), storage = memoryStorage(), blocked = latch(), release = latch();
  let controller: PeopleController | undefined, armed = false, checks = 0, tokens = 0, attempts = 0, backoffs = 0, cacheReads = 0;
  let requestSignal: AbortSignal | null | undefined;
  const hold = async () => { blocked.release(); await release.promise; };
  try {
    for (const name of ['alice', 'bob']) await games.handle(name, { handle: name });
    const created = await games.create('alice', { kind: 'friend', colour: 'white', options: { ...DEFAULT_OPTIONS, arrangement: true, kingPowers: true, cards: true } });
    await games.join('bob', (await games.invite('alice', created.game_id)).token);
    const server = fakeServer(games);
    const api = onlineClient({ token: async () => {
      if (armed && (++tokens === 1 && stage === 'token' || tokens === 2 && stage === 'retry-token')) await hold();
      return 'alice';
    }, fetch: async (input, init) => {
      if (armed && String(input).endsWith('/commands')) {
        attempts++; requestSignal = init?.signal;
        if (stage === 'fetch') { await hold(); init?.signal?.throwIfAborted(); }
        if (stage.startsWith('backoff') || stage.startsWith('retry-')) throw new TypeError('The test holds the retry.');
        if (stage === 'body') {
          const response = new Response(null, { status: 503 });
          vi.spyOn(response, 'json').mockImplementation(async () => { await hold(); throw new TypeError('The reply ends.'); });
          return response;
        }
      }
      return server.fetch(input, init);
    }, wait: async () => { backoffs++; if (stage === `backoff-${backoffs}`) await hold(); } });
    controller = peopleController({ userId: 'alice', server: peopleServer(api), storage, current: async () => {
      if (armed && stage === ['king-current', 'command-current', 'receipt-current', 'saved-current'][checks++]) await hold();
    } });
    await controller.open(created.game_id); await new Promise(done => setTimeout(done, 0));
    const view = controller.state().view!;
    storage.removeItem(seatKingKey('alice', view));
    const writes = vi.spyOn(storage, 'setItem'), notices = vi.fn(); controller.subscribe(notices);
    if (stage.startsWith('cache') || stage === 'retry-cache') {
      vi.stubGlobal('window', {});
      vi.stubGlobal('location', new URL('https://kingdown.test/next.html'));
      const installing = stage.startsWith('cache-install');
      const worker = Object.assign(new EventTarget(), {
        state: installing ? 'installing' : stage === 'cache-activation' || stage === 'cache-active-registration' ? 'activating' : 'activated',
        scriptURL: 'https://kingdown.test/sw.js',
        postMessage: async (request: { installing?: boolean }, ports: MessagePort[]) => {
          if (stage === 'cache-proof' || stage === 'cache-active-proof' || stage === 'cache-install-proof') await hold();
          ports[0].postMessage({ ...request, policy: request.installing ? 'public-install-v1' : 'public-build-v1', version: 'test' });
        },
      });
      const usesWorker = installing || ['cache-proof', 'cache-active-proof', 'cache-activation', 'cache-active-registration'].includes(stage);
      const workers = Object.assign(new EventTarget(), {
        controller: usesWorker && !installing && stage !== 'cache-active-proof' && stage !== 'cache-active-registration' ? worker : null,
        getRegistration: async () => {
          lookups++;
          if (stage === 'cache-register') throw new Error('The lookup fails.');
          if (stage === 'cache-lookup' || stage === 'cache-delete-lookup' && lookups === 2 || stage === 'cache-final-lookup' && lookups === 2) await hold();
          return usesWorker ? registration : undefined;
        },
        register: async () => { await hold(); return undefined; },
      });
      const registration = Object.assign(new EventTarget(), { scope: 'https://kingdown.test/', updateViaCache: 'none', installing: installing ? worker : null, waiting: null, active: installing ? null : worker, update: async () => {} });
      let lookups = 0;
      if (stage === 'cache-activation' || stage === 'cache-active-registration') {
        const add = worker.addEventListener.bind(worker); let activationQueued = false;
        vi.spyOn(worker, 'addEventListener').mockImplementation((...args) => {
          add(...args); if (!activationQueued && args[0] === 'statechange') { activationQueued = true; blocked.release(); void release.promise.then(() => { worker.state = 'activated'; worker.dispatchEvent(new Event('statechange')); }); }
        });
      }
      vi.stubGlobal('navigator', { onLine: true, ...(stage !== 'cache' && stage !== 'cache-final' && stage !== 'cache-delete' && stage !== 'retry-cache' && { serviceWorker: workers }) });
      vi.stubGlobal('caches', { keys: async () => {
        cacheReads++;
        if (stage === 'cache' || stage === 'cache-final' && cacheReads === 2 || stage === 'retry-cache' && cacheReads === 3 || stage === 'cache-install-keys' && cacheReads === 1 || stage === 'cache-install-final' && cacheReads === 2) await hold();
        return cacheReads === 1 && ['cache-delete', 'cache-delete-lookup', 'cache-install-delete'].includes(stage) ? ['kingdown-old'] : [];
      }, delete: async () => { if (stage === 'cache-delete' || stage === 'cache-install-delete') await hold(); return true; } });
    }
    armed = true; const pending = controller.ready(); await blocked.promise;
    const before = server.calls.length, saved = storage.getItem(receiptKey('alice'));
    controller.stop(); writes.mockClear(); notices.mockClear(); release.release();
    expect(await pending).toBe(false);
    expect(server.calls).toHaveLength(before);
    expect((await games.view('alice', created.game_id)).ready).toEqual([false, false]);
    expect(writes).not.toHaveBeenCalled(); expect(notices).not.toHaveBeenCalled();
    expect(controller.state().notice).toBeUndefined();
    expect(storage.getItem(receiptKey('alice'))).toBe(saved);
    if (stage === 'fetch' || stage === 'body' || stage.startsWith('backoff') || stage.startsWith('retry-')) {
      expect(requestSignal?.aborted).toBe(true); expect(requestSignal?.reason).toBeInstanceOf(ObsoleteAction);
      expect(attempts).toBe(stage.startsWith('backoff') ? Number(stage.at(-1)) : 1);
    } else expect(attempts).toBe(0);
  } finally { release.release(); controller?.stop(); await games.close(); }
});

it.each(['send', 'local-send', 'check', 'check-resend', 'refresh', 'open', 'join', 'preview', 'seen', 'draw', 'resign', 'abort'] as const)('Stop closes %s during cache safety', async action => {
  const games = fixtureService(), storage = memoryStorage(), blocked = latch(), release = latch();
  let controller: PeopleController | undefined;
  try {
    for (const name of ['alice', 'bob']) await games.handle(name, { handle: name });
    const created = await games.create('alice', { kind: 'friend', colour: 'white', options: { ...DEFAULT_OPTIONS, fairy: false, arrangement: false, classic: true } });
    const token = (await games.invite('alice', created.game_id)).token;
    await games.join('bob', token);
    const server = fakeServer(games), api = onlineClient({ token: async () => 'alice', fetch: server.fetch, wait: async () => {} });
    controller = peopleController({ userId: 'alice', storage, server: peopleServer(api), pageEngine: action === 'local-send' ? (await games.view('alice', created.game_id)).engine_fingerprint ?? undefined : undefined });
    if (action !== 'open' && action !== 'seen') await controller.open(created.game_id);
    await new Promise(done => setTimeout(done, 0));
    if (action === 'send' || action === 'local-send') {
      const draft = controller.state().draft!;
      controller.stage(draft.at(parseSq('e2'), parseSq('e4'))[0]);
    }
    if (action === 'check' || action === 'check-resend') storage.setItem(receiptKey('alice'), JSON.stringify(receiptOf(created.game_id, controller.state().view!.revision, { type: 'resign' }, 'saved-command')));
    server.calls.length = 0;
    vi.stubGlobal('window', {}); vi.stubGlobal('navigator', { onLine: true });
    vi.stubGlobal('caches', { keys: async () => { blocked.release(); await release.promise; return []; }, delete: async () => true });
    const before = await games.view('alice', created.game_id);
    let pending: Promise<unknown>;
    if (action === 'send' || action === 'local-send') pending = controller.send();
    else if (action === 'check' || action === 'check-resend') {
      if (action === 'check-resend') {
        const keys = globalThis.caches.keys; let reads = 0;
        vi.stubGlobal('caches', { keys: async () => ++reads <= 2 ? [] : keys(), delete: async () => true });
      }
      pending = controller.check();
    }
    else if (action === 'refresh') pending = controller.refresh();
    else if (action === 'open' || action === 'seen') {
      // The first read completes; seen() must still keep the same lifetime signal.
      if (action === 'seen') {
        const keys = globalThis.caches.keys; let reads = 0;
        vi.stubGlobal('caches', { keys: async () => ++reads <= 2 ? [] : keys(), delete: async () => true });
      }
      pending = controller.open(created.game_id);
    } else if (action === 'join') pending = controller.join({ token });
    else if (action === 'preview') pending = controller.preview({ token }).catch(error => error);
    else if (action === 'draw') pending = controller.offerDraw();
    else if (action === 'resign') pending = controller.resign();
    else pending = controller.abort();
    await blocked.promise;
    const calls = server.calls.length;
    controller.stop(); const notify = vi.fn(); controller.subscribe(notify); release.release(); await pending;
    await new Promise(done => setTimeout(done, 0));
    expect(server.calls).toHaveLength(calls); expect(notify).not.toHaveBeenCalled();
    expect(await games.view('alice', created.game_id)).toMatchObject({ revision: before.revision, status: before.status, ready: before.ready });
  } finally { release.release(); controller?.stop(); await games.close(); }
});

it.each(['read-fetch', 'read-body', 'receipt-drop', 'draft-fetch', 'draft-body'] as const)('Stop closes a follow-up request after the %s wait', async stage => {
  const games = fixtureService(), storage = memoryStorage(), blocked = latch(), release = latch();
  let controller: PeopleController | undefined, armed = false;
  const hold = async () => { blocked.release(); await release.promise; };
  try {
    for (const name of ['alice', 'bob']) await games.handle(name, { handle: name });
    const created = await games.create('alice', { kind: 'friend', colour: 'white', options: { ...DEFAULT_OPTIONS, fairy: false, arrangement: false, classic: true } });
    await games.join('bob', (await games.invite('alice', created.game_id)).token);
    const server = fakeServer(games);
    const api = onlineClient({ token: async () => 'alice', fetch: async (input, init) => {
      if (!armed) return server.fetch(input, init);
      const draft = String(input).endsWith('/preview');
      if (stage.startsWith('draft') !== draft) return server.fetch(input, init);
      if (stage.endsWith('fetch')) { await hold(); init?.signal?.throwIfAborted(); }
      const response = await server.fetch(input, init);
      if (stage.endsWith('body')) { const json = response.json.bind(response); vi.spyOn(response, 'json').mockImplementation(async () => { await hold(); return json(); }); }
      return response;
    } });
    controller = peopleController({ userId: 'alice', storage, server: peopleServer(api), locks: { request: async (_name, run) => { if (armed && stage === 'receipt-drop') await hold(); return run(); } } });
    await controller.open(created.game_id); await new Promise(done => setTimeout(done, 0));
    const before = await games.view('alice', created.game_id);
    if (stage.startsWith('draft')) controller.stage(controller.state().draft!.at(parseSq('e2'), parseSq('e4'))[0]);
    else storage.setItem(receiptKey('alice'), JSON.stringify(receiptOf(created.game_id, stage === 'receipt-drop' ? before.revision - 1 : before.revision, { type: 'resign' }, 'saved-command')));
    armed = true; const pending = stage.startsWith('draft') ? controller.send() : controller.check();
    await blocked.promise; const calls = server.calls.length; controller.stop(); release.release();
    expect(await pending).toBe(false); expect(server.calls).toHaveLength(calls);
    expect(await games.view('alice', created.game_id)).toMatchObject({ revision: before.revision, status: before.status, ready: before.ready });
    expect(controller.state().notice).toBeUndefined();
  } finally { release.release(); controller?.stop(); await games.close(); }
});

it('Stop closes the opening account-data wait before a king write or seen request', async () => {
  const games = fixtureService(), storage = memoryStorage(), blocked = latch(), release = latch();
  let controller: PeopleController | undefined, first = true;
  try {
    for (const name of ['alice', 'bob']) await games.handle(name, { handle: name });
    const created = await games.create('alice', { kind: 'friend', options: { ...DEFAULT_OPTIONS, arrangement: true, kingPowers: true } });
    await games.join('bob', (await games.invite('alice', created.game_id)).token);
    const server = fakeServer(games), api = onlineClient({ token: async () => 'alice', fetch: server.fetch });
    controller = peopleController({ userId: 'alice', storage, server: peopleServer(api), locks: { request: async (_name, run) => {
      if (first) { first = false; blocked.release(); await release.promise; } return run();
    } } });
    const opening = controller.open(created.game_id); await blocked.promise;
    // The full read ends before its king write asks for the opening gate.
    await vi.waitFor(() => expect(server.calls).toHaveLength(1));
    const writes = vi.spyOn(storage, 'setItem'), notify = vi.fn(); controller.subscribe(notify);
    controller.stop(); release.release(); await opening;
    expect(writes).not.toHaveBeenCalled(); expect(notify).not.toHaveBeenCalled();
    expect(server.calls).toHaveLength(1); expect((await games.view('alice', created.game_id)).ready).toEqual([false, false]);
    expect(storage.getItem(receiptKey('alice'))).toBeNull();
  } finally { release.release(); controller?.stop(); await games.close(); }
});

it('Stop closes the second receipt hold after another tab frees a busy receipt', async () => {
  const games = fixtureService(), storage = memoryStorage(), blocked = latch(), release = latch();
  let controller: PeopleController | undefined, armed = false, holds = 0;
  try {
    for (const name of ['alice', 'bob']) await games.handle(name, { handle: name });
    const created = await games.create('alice', { kind: 'friend', colour: 'white', options: { ...DEFAULT_OPTIONS, fairy: false, arrangement: false, classic: true } });
    await games.join('bob', (await games.invite('alice', created.game_id)).token);
    const server = fakeServer(games), api = onlineClient({ token: async () => 'alice', fetch: server.fetch });
    controller = peopleController({ userId: 'alice', storage, server: peopleServer(api), locks: { request: async (_name, run) => {
      if (armed && ++holds === 2) { blocked.release(); await release.promise; }
      try { return await run(); } catch (error) { storage.removeItem(receiptKey('alice')); throw error; }
    } } });
    await controller.open(created.game_id); await new Promise(done => setTimeout(done, 0));
    storage.setItem(receiptKey('alice'), JSON.stringify(receiptOf('another-game', 0, { type: 'resign' }, 'old-command')));
    server.calls.length = 0; armed = true; const pending = controller.resign(); await blocked.promise;
    controller.stop(); const writes = vi.spyOn(storage, 'setItem'); release.release();
    expect(await pending).toBe(false); expect(writes).not.toHaveBeenCalled(); expect(server.calls).toHaveLength(0);
    expect(storage.getItem(receiptKey('alice'))).toBeNull(); expect((await games.view('alice', created.game_id)).status).toBe('playing');
  } finally { release.release(); controller?.stop(); await games.close(); }
});
