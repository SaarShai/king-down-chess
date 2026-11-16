/** The old account screen binds sign-out to the session it shows (review of PR 361, round 5). */
import { afterEach, expect, it, vi } from 'vitest';
import { memoryStorage } from '../interface/people/fake-server';

const harness = vi.hoisted(() => ({ fetch: vi.fn<typeof fetch>(), auth: null as any, events: [] as {event: string; user: string | null}[], syncs: [] as {user: string; stopped: boolean; changes: number}[] }));
vi.mock('@supabase/supabase-js', async importOriginal => {
  const actual = await importOriginal<typeof import('@supabase/supabase-js')>();
  return { ...actual, createClient: (_url: string, _key: string, options: Parameters<typeof actual.createClient>[2]) => {
    const sb = actual.createClient('https://fixture-auth.invalid', 'fixture-publishable', {
    ...options, auth: { ...options?.auth, autoRefreshToken: false, detectSessionInUrl: false }, global: { fetch: harness.fetch },
  }); harness.auth = sb.auth; sb.auth.onAuthStateChange((event, s) => { harness.events.push({event, user: s?.user?.id ?? null}); }); return sb; } };
});
const tokenExpiry = Math.floor(Date.now() / 1000) + 3600;
const jwt = (id: string, iat = 1, exp = tokenExpiry) => 'fixture.' + btoa(JSON.stringify({ session_id: id, iat, exp })) + '.signature';
const session = (id: string, user = id, iat = 1) => ({ access_token: jwt(id, iat), refresh_token: 'fixture-refresh-' + id, token_type: 'bearer', expires_in: 3600, expires_at: Date.now() / 1000 + 3600, user: { id: user } });
function setup(store = memoryStorage()) {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://project.supabase.co'); vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_fixture');
  vi.stubGlobal('location', new URL('https://kingdown.test/next.html'));
  vi.stubGlobal('history', { state: {}, replaceState() {} });
  vi.stubGlobal('localStorage', store); vi.stubGlobal('sessionStorage', memoryStorage());
  vi.stubGlobal('navigator', { onLine: true }); vi.stubGlobal('matchMedia', () => ({ matches: false }));
  store.setItem('fixture-auth', JSON.stringify(session('alice')));
  return store;
}
afterEach(async () => { await new Promise(r => setTimeout(r, 60)); await harness.auth?.dispose(); harness.syncs.length = 0; harness.events.length = 0; vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetModules(); });

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
  return { elements, click: () => handlers.get('account-body:click')!({ target: { closest: () => ({ dataset: { act: 'sign-out' } }) } }),
    act: (act: string) => handlers.get('account-body:click')!({ target: { closest: () => ({ dataset: { act } }) } }),
    closeDelete: () => { element('delete-account').returnValue = 'delete'; return handlers.get('delete-account:close')!({}); } };
}

const settle = () => new Promise(r => setTimeout(r, 60));
const access = { blocked: () => false, accepts: () => true };


it('an open old-account deletion dialog cannot delete a later account', async () => {
  const store = setup(), ui = screen(); store.setItem('kingdown.auth', JSON.stringify(session('first', 'alice')));
  const sameWindow = { location, addEventListener() {}, removeEventListener() {} };
  Object.assign(sameWindow, { self: sameWindow, top: sameWindow }); vi.stubGlobal('window', sameWindow);
  const sent: {path: string; token: string | null}[] = [];
  harness.fetch.mockImplementation(async (input, init) => {
    const path = String(input); sent.push({path, token: new Headers(init?.headers).get('Authorization')});
    if (path.endsWith('/verify')) return Response.json(session('later', 'bob'));
    return Response.json(path.includes('/rest/') ? null : {});
  });
  const { startAccount } = await import('./account'); startAccount(() => {}, access);
  await vi.waitFor(() => expect(harness.syncs).toHaveLength(1)); await settle();
  const firstAuth = harness.auth;
  const modal = ui.elements.get('delete-account'); modal.showModal = () => { modal.open = true; };
  await ui.act('delete'); expect(modal.open).toBe(true);
  const { connect } = await import('./client'); const other = connect('kingdown.auth'), otherAuth = harness.auth;
  try {
    await other.readSession(); expect(firstAuth.broadcastChannel).toBeTruthy();
    await other.verifyEmailCode('bob@example.test', '123456');
    await vi.waitFor(() => expect(harness.syncs.some(s => s.user === 'bob')).toBe(true)); await settle();
    // HTML dialog.showModal does not pause auth events. The generic prompt stays on top.
    expect(modal.open).toBe(true);
    expect(JSON.parse(store.getItem('kingdown.auth')!).user.id).toBe('bob');
    await ui.closeDelete(); await settle();
    expect(sent.filter(s => s.path.includes('/rpc/delete_my_account')).map(s => s.token)).not.toContain('Bearer ' + jwt('later'));
  } finally { await firstAuth.dispose(); await otherAuth.dispose(); }
});
