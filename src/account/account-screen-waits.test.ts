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
  vi.stubGlobal('location', new URL('https://kingdown.test/index.html'));
  vi.stubGlobal('history', { state: {}, replaceState() {} });
  vi.stubGlobal('fetch', harness.fetch); vi.stubGlobal('localStorage', store); vi.stubGlobal('sessionStorage', memoryStorage());
  vi.stubGlobal('navigator', { onLine: true }); vi.stubGlobal('matchMedia', () => ({ matches: false }));
  store.setItem('fixture-auth', JSON.stringify(session('alice')));
  return store;
}
afterEach(() => { harness.auth?.stopAutoRefresh(); harness.syncs.length = 0; vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetModules(); });

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

it.each(['alice', 'bob'])('cloud-wait sign-out keeps a new session for %s', async laterUser => {
  const store = setup();
  store.setItem('kingdown.auth', JSON.stringify(session('first', 'alice')));
  const handlers = new Map<string, (event: any) => Promise<void>>();
  const elements = new Map<string, any>();
  const element = (id: string): any => {
    if (!elements.has(id)) elements.set(id, {
      innerHTML: '', textContent: '', hidden: false,
      contains() { return false; }, querySelector() { return null; }, insertAdjacentHTML() {},
      addEventListener(event: string, fn: (event: any) => Promise<void>) { handlers.set(id + ':' + event, fn); },
    });
    return elements.get(id);
  };
  vi.stubGlobal('document', { getElementById: element, querySelector: () => element('entry'), addEventListener() {}, activeElement: null });
  vi.stubGlobal('addEventListener', () => {});
  let release!: () => void, sent!: () => void, first = true;
  const started = new Promise<void>(resolve => { sent = resolve; });
  const revoked: (string|null)[] = [];
  harness.fetch.mockImplementation(async (input, init) => {
    if (String(input).includes('/logout')) {
      revoked.push(new Headers(init?.headers).get('Authorization'));
      return Response.json({});
    }
    if (String(input).endsWith('/verify')) return Response.json(session('later', laterUser));
    if (String(input).includes('/rest/')) {
      if (first) { first = false; sent(); await new Promise<void>(resolve => { release = resolve; }); }
      return Response.json(null);
    }
    return Response.json({ external: { github: true } });
  });
  const { startAccount } = await import('./account');
  startAccount(() => {}, { blocked: () => false, accepts: () => true });
  await started;
  const pending = handlers.get('account-body:click')!({ target: { closest: () => ({ dataset: { act: 'sign-out' } }) } });
  await harness.auth.verifyOtp({ email: 'bob@example.test', token: '123456', type: 'email' });
  await new Promise(r => setTimeout(r, 30));
  expect(JSON.parse(store.getItem('kingdown.auth')!).user.id).toBe(laterUser);
  release(); await pending;
  expect(revoked).not.toContain('Bearer ' + jwt('later'));
  expect(JSON.parse(store.getItem('kingdown.auth')!).user.id).toBe(laterUser);
  expect(harness.syncs.find(s => s.user === laterUser)!.stopped).toBe(false);
});

it.each(['alice', 'bob'])('late success keeps a new session for %s', async laterUser => {
  const store = setup();
  store.setItem('kingdown.auth', JSON.stringify(session('first', 'alice')));
  const handlers = new Map<string, (event: any) => Promise<void>>();
  const elements = new Map<string, any>();
  const element = (id: string): any => {
    if (!elements.has(id)) elements.set(id, {
      innerHTML: '', textContent: '', hidden: false,
      contains() { return false; }, querySelector() { return null; }, insertAdjacentHTML() {},
      addEventListener(event: string, fn: (event: any) => Promise<void>) { handlers.set(id + ':' + event, fn); },
    });
    return elements.get(id);
  };
  vi.stubGlobal('document', { getElementById: element, querySelector: () => element('entry'), addEventListener() {}, activeElement: null });
  vi.stubGlobal('addEventListener', () => {});
  let release!: () => void, sent!: () => void;
  const started = new Promise<void>(resolve => { sent = resolve; });
  harness.fetch.mockImplementation(async input => {
    if (String(input).includes('/logout')) {
      sent(); await new Promise<void>(resolve => { release = resolve; });
      return Response.json({});
    }
    if (String(input).endsWith('/verify')) return Response.json(session('later', laterUser));
    if (String(input).includes('/rest/')) return Response.json(null);
    return Response.json({ external: { github: true } });
  });
  const { startAccount, changed } = await import('./account');
  startAccount(() => {}, { blocked: () => false, accepts: () => true });
  await vi.waitFor(() => expect(harness.syncs.some(s => s.user === 'alice')).toBe(true));
  const pending = handlers.get('account-body:click')!({ target: { closest: () => ({ dataset: { act: 'sign-out' } }) } });
  await started;
  await harness.auth.verifyOtp({ email: 'bob@example.test', token: '123456', type: 'email' });
  await new Promise(r => setTimeout(r, 30));
  const bob = harness.syncs.find(s => s.user === laterUser)!;
  expect(bob.stopped).toBe(false);
  expect(elements.get('account-body').innerHTML).toContain('data-act="sign-out"');
  release(); await pending;
  expect(JSON.parse(store.getItem('kingdown.auth')!).user.id).toBe(laterUser);
  expect(bob.stopped).toBe(false);
  expect(elements.get('account-body').innerHTML).toContain('data-act="sign-out"');
  changed();
  expect(bob.changes).toBe(1);
});
