/** The old account screen binds sign-out to the session it shows (review of PR 361, round 5). */
import { afterEach, expect, it, vi } from 'vitest';
import { memoryStorage } from '../interface/people/fake-server';

const harness = vi.hoisted(() => ({ fetch: vi.fn<typeof fetch>(), auth: null as any, syncs: [] as {user: string; stopped: boolean; changes: number}[] }));
vi.mock('@supabase/supabase-js', async importOriginal => {
  const actual = await importOriginal<typeof import('@supabase/supabase-js')>();
  return { ...actual, createClient: (_url: string, _key: string, options: Parameters<typeof actual.createClient>[2]) => {
    const sb = actual.createClient('https://fixture-auth.invalid', 'fixture-publishable', {
    ...options, auth: { ...options?.auth, autoRefreshToken: false, detectSessionInUrl: false }, global: { fetch: harness.fetch },
  }); harness.auth = sb.auth; return sb; } };
});
const tokenExpiry = Math.floor(Date.now() / 1000) + 3600;
const jwt = (id: string, iat = 1, exp = tokenExpiry) => 'fixture.' + btoa(JSON.stringify({ session_id: id, iat, exp })) + '.signature';
const session = (id: string, user = id, iat = 1) => ({ access_token: jwt(id, iat), refresh_token: 'fixture-refresh-' + id, token_type: 'bearer', expires_in: 3600, expires_at: Date.now() / 1000 + 3600, user: { id: user } });
function setup(store = memoryStorage()) {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://project.supabase.co'); vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_fixture');
  vi.stubGlobal('location', new URL('https://kingdown.test/next.html'));
  vi.stubGlobal('history', { state: {}, replaceState() {} });
  vi.stubGlobal('localStorage', store); vi.stubGlobal('sessionStorage', memoryStorage());
  vi.stubGlobal('caches', { keys: async () => [] });
  vi.stubGlobal('navigator', { onLine: true }); vi.stubGlobal('matchMedia', () => ({ matches: false }));
  store.setItem('fixture-auth', JSON.stringify(session('alice')));
  return store;
}
afterEach(async () => { await new Promise(r => setTimeout(r, 60)); await harness.auth?.dispose(); harness.syncs.length = 0; vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetModules(); });

vi.mock('./sync', async importOriginal => {
  const actual = await importOriginal<typeof import('./sync')>();
  return { ...actual, Sync: class extends actual.Sync {
    record: { user: string; stopped: boolean; changes: number };
    constructor(...args: ConstructorParameters<typeof actual.Sync>) {
      super(...args);
      this.record = { user: args[1].userId, stopped: false, changes: 0 };
      harness.syncs.push(this.record);
    }
    stop() { this.record.stopped = true; super.stop(); }
    changed() { this.record.changes++; super.changed(); }
  } };
});


function screen() {
  const handlers = new Map<string, (event: any) => Promise<void>>();
  const elements = new Map<string, any>();
  const element = (id: string): any => {
    if (!elements.has(id)) elements.set(id, {
      innerHTML: '', textContent: '', hidden: false,
      contains() { return false; }, querySelector() { return null; }, insertAdjacentHTML() {},
      addEventListener(event: string, fn: (event: any) => Promise<void>) { handlers.set(id + ':' + event, fn); },
      showModal() {}, returnValue: '',
    });
    return elements.get(id);
  };
  vi.stubGlobal('document', { getElementById: element, querySelector: () => element('entry'), addEventListener() {}, activeElement: null });
  vi.stubGlobal('addEventListener', () => {});
  return { elements, openAccount: () => handlers.get('entry:click')!({}), click: () => handlers.get('account-body:click')!({ target: { closest: () => ({ dataset: { act: 'sign-out' } }) } }),
    act: (act: string) => handlers.get('account-body:click')!({ target: { closest: () => ({ dataset: { act } }) } }),
    closeDelete: () => { element('delete-account').returnValue = 'delete'; return handlers.get('delete-account:close')!({}); } };
}
function latch() { let release!: () => void; const promise = new Promise<void>(r => { release = r; }); return { promise, release }; }


it('Disconnect Muse stays with the account that the player confirms', async () => {
  const store = setup(); store.setItem('kingdown.auth', JSON.stringify(session('first', 'alice')));
  const ui = screen(), started = latch(), release = latch();
  const actions: {path: string; token: string|null}[] = [];
  const windowFixture: any = { addEventListener() {}, removeEventListener() {} };
  windowFixture.top = windowFixture; windowFixture.self = windowFixture;
  vi.stubGlobal('window', windowFixture); vi.stubGlobal('confirm', () => true);
  harness.fetch.mockImplementation(async (input, init) => {
    const path = String(input);
    if (path.includes('/rpc/muse_client_ids')) { started.release(); await release.promise; return Response.json(['00000000-0000-4000-8000-000000000001']); }
    if (path.includes('/oauth/grants') || path.includes('/rpc/delete_my_muse_games')) {
      actions.push({path, token: new Headers(init?.headers).get('Authorization')}); return Response.json(path.includes('/rpc/') ? 2 : {});
    }
    if (path.endsWith('/verify')) return Response.json(session('later', 'bob'));
    return Response.json(path.includes('/rest/') ? null : {});
  });
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ account_access: 'closed', valid_for_ms: 0, muse: true })));
  const { startAccount } = await import('./account');
  startAccount(() => {}, { blocked: () => false, accepts: () => true });
  ui.openAccount();
  await vi.waitFor(() => expect(harness.syncs.length).toBe(1));
  await vi.waitFor(() => expect(ui.elements.get('account-body').innerHTML).toContain('data-act="disconnect-muse"'));
  const pending = ui.act('disconnect-muse'); await started.promise;
  await harness.auth.verifyOtp({ email: 'bob@example.test', token: '123456', type: 'email' });
  await vi.waitFor(() => expect(harness.syncs.some(s => s.user === 'bob')).toBe(true));
  release.release(); await pending;
  // The confirmed account changed: the remaining steps stop, and none uses the later account.
  expect(actions.filter(a => a.path.includes('/oauth/grants'))).toHaveLength(0);
  expect(actions.filter(a => a.path.includes('/rpc/delete_my_muse_games'))).toHaveLength(0);
  expect(actions.map(a => a.token)).not.toContain('Bearer ' + jwt('later'));
});


it.each([undefined, false, true])('shows Disconnect Muse only for server muse=%s', async muse => {
  const store = setup(); store.setItem('kingdown.auth', JSON.stringify(session('first', 'alice')));
  const ui = screen();
  harness.fetch.mockImplementation(async () => Response.json(null));
  const status = vi.fn(async () => Response.json({ account_access: 'closed', valid_for_ms: 0, ...(muse !== undefined && { muse }) }));
  vi.stubGlobal('fetch', status);
  const { startAccount } = await import('./account');
  startAccount(() => {}, { blocked: () => false, accepts: () => true });
  ui.openAccount();
  await vi.waitFor(() => expect(status).toHaveBeenCalledOnce());
  expect(status).toHaveBeenCalledWith('/api/status?muse=1', expect.objectContaining({ cache: 'no-store' }));
  await vi.waitFor(() => expect(ui.elements.get('account-body').innerHTML.includes('data-act="disconnect-muse"')).toBe(muse === true));
});
