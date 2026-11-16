import { afterEach, expect, it, vi } from 'vitest';
import { onlineHost, onlineOptions } from './index';
import { memoryStorage, fakeServer } from '../fake-server';
import { fixtureService } from '../../../../tools/plugin-protocol-fixture';
import { DEFAULT_OPTIONS } from '../../play/new-game';
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
function latch() { let release!: () => void; const promise = new Promise<void>(r => { release = r; }); return { promise, release }; }
function globals() {
  vi.stubGlobal('location', new URL('https://kingdown.test/next.html#online=setup'));
  vi.stubGlobal('history', { state: {}, replaceState() {} });
  vi.stubGlobal('sessionStorage', memoryStorage()); vi.stubGlobal('navigator', { onLine: true });
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  vi.stubGlobal('addEventListener', () => {}); vi.stubGlobal('removeEventListener', () => {});
}
it.each(['none', 'signout', 'bob', 'stop'])('Ready held by cache safety then %s', async replacement => {
  globals();
  let actor: string | null = 'alice', changed = (_s: any) => {};
  const service = fixtureService(), blocked = latch(), release = latch();
  let host: ReturnType<typeof onlineHost> | undefined;
  try {
    await service.handle('alice', { handle: 'alice' }); await service.handle('bob', { handle: 'bob' });
    const first = await service.create('alice', { kind: 'friend', options: onlineOptions('both', { ...DEFAULT_OPTIONS, arrangement: 'manual' }) });
    const link = await service.invite('alice', first.game_id); await service.join('bob', link.token);
    const server = fakeServer(service), saved = memoryStorage(), home = vi.fn();
    host = onlineHost({ storage: saved, fetch: server.fetch,
      auth: async () => ({ onSession(callback: typeof changed) { changed = callback; }, readSession: async () => actor && ({ userId: actor, accessToken: actor }) }) as never,
      rules: () => 'both', setRules() {}, changed() {}, open() {}, home, toast() {} });
    await host.signIn(); await host.open(first.game_id, () => {});
    // Drain seen() from the initial read before enabling the real browser cache gate.
    await new Promise(r => setTimeout(r, 0)); server.calls.length = 0;
    vi.stubGlobal('window', {});
    vi.stubGlobal('caches', { keys: async () => { blocked.release(); await release.promise; return []; }, delete: async () => true });
    const old = host.controller!, pending = old.ready();
    await blocked.promise;
    expect(server.calls.filter(c => c.path.endsWith('/commands'))).toHaveLength(0);
    expect(saved.getItem('kingdown.account-command.alice')).not.toBeNull();
    if (replacement === 'stop') host.stopGame();
    else if (replacement !== 'none') { actor = replacement === 'bob' ? 'bob' : null; changed(actor ? { user: { id: actor }, access_token: actor } : null); }
    release.release(); const result = await pending;
    const commands = server.calls.filter(c => c.path.endsWith('/commands'));
    const after = await service.view('alice', first.game_id);
    console.log(JSON.stringify({ replacement, result, commands, ready: after.ready, homeCalls: home.mock.calls.length }));
    expect(commands).toHaveLength(replacement === 'none' ? 1 : 0);
    expect(after.ready).toEqual(replacement === 'none' ? [true, false] : [false, false]);
  } finally { release.release(); host?.stopGame(); await service.close(); }
});

it('same-account refresh, reload and second game keep Ready working; sign-out and switch call Home', async () => {
  globals();
  const jwt = (id: string, n: number) => 'fixture.' + btoa(JSON.stringify({ session_id: id, iat: n })) + '.signature';
  let actor = 'alice', token = jwt('alice-session', 1), changed = (_s: any) => {};
  const service = fixtureService(), saved = memoryStorage(), home = vi.fn();
  let host: ReturnType<typeof onlineHost> | undefined;
  const server = fakeServer(service);
  const makeHost = () => onlineHost({ storage: saved,
    fetch: (input, init) => { const headers = new Headers(init?.headers); headers.set('Authorization', 'Bearer ' + actor); return server.fetch(input, { ...init, headers }); },
    auth: async () => ({ onSession(callback: typeof changed) { changed = callback; callback({ user: { id: actor }, access_token: token }); }, readSession: async () => ({ userId: actor, accessToken: token }) }) as never,
    rules: () => 'both', setRules() {}, changed() {}, open() {}, home, toast() {} });
  try {
    await service.handle('alice', { handle: 'alice' }); await service.handle('bob', { handle: 'bob' });
    const create = async () => { const v = await service.create('alice', { kind: 'friend', options: onlineOptions('both', { ...DEFAULT_OPTIONS, arrangement: 'manual' }) }); const link = await service.invite('alice', v.game_id); await service.join('bob', link.token); return v.game_id; };
    const first = await create(), second = await create();
    host = makeHost(); await host.signIn(); await host.open(first, () => {});
    expect(home).not.toHaveBeenCalled();
    const current = host.controller;
    token = jwt('alice-session', 2); changed({ user: { id: actor }, access_token: token });
    expect(host.controller).toBe(current); expect(home).not.toHaveBeenCalled();
    host.stopGame(); host = makeHost(); await host.signIn(); await host.open(first, () => {});
    expect(home).not.toHaveBeenCalled(); expect(await host.controller!.ready()).toBe(true);
    await host.open(second, () => {}); expect(await host.controller!.ready()).toBe(true);
    changed(null); expect(home).toHaveBeenCalledTimes(1); expect(host.controller).toBeUndefined();
    await host.signIn(); await host.open(second, () => {});
    actor = 'bob'; token = jwt('bob-session', 1); changed({ user: { id: actor }, access_token: token });
    expect(home).toHaveBeenCalledTimes(2); expect(host.controller).toBeUndefined();
  } finally { host?.stopGame(); await service.close(); }
});

it.each(['signout', 'bob', 'new-session', 'stop'] as const)('Ready loses %s during its token read', async replacement => {
  globals();
  let actor: string | null = 'alice', token = 'alice', reads = 0, changed = (_s: any) => {}, armed = false;
  const service = fixtureService(), blocked = latch(), release = latch(), saved = memoryStorage();
  let host: ReturnType<typeof onlineHost> | undefined;
  try {
    await service.handle('alice', { handle: 'alice' }); await service.handle('bob', { handle: 'bob' });
    const first = await service.create('alice', { kind: 'friend', options: onlineOptions('both', { ...DEFAULT_OPTIONS, arrangement: 'manual' }) });
    await service.join('bob', (await service.invite('alice', first.game_id)).token);
    const server = fakeServer(service);
    host = onlineHost({ storage: saved, fetch: server.fetch,
      auth: async () => ({ onSession(callback: typeof changed) { changed = callback; }, readSession: async () => {
        const captured = actor && { userId: actor, accessToken: token };
        // King check, command check, receipt check, saved-receipt check, then token.
        if (armed && ++reads === 5) { blocked.release(); await release.promise; }
        return captured;
      } }) as never, rules: () => 'both', setRules() {}, changed() {}, open() {}, home() {}, toast() {} });
    await host.signIn(); await host.open(first.game_id, () => {}); await new Promise(r => setTimeout(r, 0));
    const old = host.controller!, notices = vi.fn(); old.subscribe(notices); server.calls.length = 0;
    armed = true; const pending = old.ready(); await blocked.promise;
    const writes = vi.spyOn(saved, 'setItem'), receipt = saved.getItem('kingdown.account-command.alice');
    if (replacement === 'stop') host.stopGame();
    else { actor = replacement === 'signout' ? null : replacement === 'bob' ? 'bob' : 'alice'; token = replacement; changed(actor ? { user: { id: actor }, access_token: token } : null); }
    notices.mockClear(); release.release(); expect(await pending).toBe(false);
    expect(server.calls).toHaveLength(0); expect(writes).not.toHaveBeenCalled(); expect(notices).not.toHaveBeenCalled();
    expect(saved.getItem('kingdown.account-command.alice')).toBe(receipt);
    expect((await service.view('alice', first.game_id)).ready).toEqual([false, false]);
  } finally { release.release(); host?.stopGame(); await service.close(); }
});

it('sign-out cancels Ready before the auth library returns', async () => {
  globals();
  const service = fixtureService(), blocked = latch(), release = latch(), signingOut = latch(), finishSignOut = latch();
  let host: ReturnType<typeof onlineHost> | undefined;
  try {
    await service.handle('alice', { handle: 'alice' }); await service.handle('bob', { handle: 'bob' });
    const first = await service.create('alice', { kind: 'friend', options: onlineOptions('both', { ...DEFAULT_OPTIONS, arrangement: 'manual' }) });
    await service.join('bob', (await service.invite('alice', first.game_id)).token);
    const server = fakeServer(service);
    host = onlineHost({ storage: memoryStorage(), fetch: server.fetch,
      auth: async () => ({ onSession() {}, readSession: async () => ({ userId: 'alice', accessToken: 'alice' }), signOutSession: async () => { signingOut.release(); await finishSignOut.promise; } }) as never,
      rules: () => 'both', setRules() {}, changed() {}, open() {}, home() {}, toast() {} });
    await host.signIn(); await host.open(first.game_id, () => {}); await new Promise(r => setTimeout(r, 0)); server.calls.length = 0;
    vi.stubGlobal('window', {}); vi.stubGlobal('caches', { keys: async () => { blocked.release(); await release.promise; return []; }, delete: async () => true });
    const old = host.controller!, ready = old.ready(); await blocked.promise;
    const out = host.signOut(); await signingOut.promise; release.release();
    expect(await ready).toBe(false); expect(server.calls).toHaveLength(0);
    expect((await service.view('alice', first.game_id)).ready).toEqual([false, false]);
    finishSignOut.release(); await out;
  } finally { release.release(); finishSignOut.release(); host?.stopGame(); await service.close(); }
});
