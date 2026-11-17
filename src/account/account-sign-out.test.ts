import { afterEach, expect, it, vi } from 'vitest';
import { memoryStorage } from '../interface/people/fake-server';

const harness = vi.hoisted(() => ({ fetch: vi.fn<typeof fetch>(), auth: null as any }));
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
  vi.stubGlobal('navigator', { onLine: true }); vi.stubGlobal('matchMedia', () => ({ matches: false }));
  store.setItem('fixture-auth', JSON.stringify(session('alice')));
  return store;
}
afterEach(() => { harness.auth?.stopAutoRefresh(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

vi.mock('./sync', () => ({ stamp() {}, Sync: class {
  stop() {} changed() {} pull() { return Promise.resolve(); } flush() { return Promise.resolve(); }
} }));

it.each(['alice', 'bob'])('the account screen keeps a later sign-in for %s after an old revoke error', async laterUser => {
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
      return Response.json({ message: 'logout failed' }, { status: 400 });
    }
    if (String(input).endsWith('/verify')) return Response.json(session('later', laterUser));
    return Response.json({});
  });
  const { startAccount } = await import('./account');
  startAccount(() => {}, {} as never);
  const pending = handlers.get('account-body:click')!({ target: { closest: () => ({ dataset: { act: 'sign-out' } }) } });
  await started;
  expect(store.getItem('kingdown.auth')).toBeNull();
  await harness.auth.verifyOtp({ email: 'bob@example.test', token: '123456', type: 'email' });
  expect(JSON.parse(store.getItem('kingdown.auth')!).user.id).toBe(laterUser);
  await vi.waitFor(() => expect(elements.get('account-body').innerHTML).toContain('data-act="sign-out"'));
  release(); await pending;
  expect(store.getItem('kingdown.auth')).not.toBeNull();
  expect(JSON.parse(store.getItem('kingdown.auth')!).user.id).toBe(laterUser);
  expect(elements.get('account-note').textContent).toBe('Could not finish sign-out. Check your connection and try again.');
});


it('the account screen keeps credentials and reports failure when the client cannot load offline', async () => {
  const store = setup();
  const saved = JSON.stringify(session('first', 'alice'));
  store.setItem('kingdown.auth', saved);
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
  vi.doMock('./client', () => { throw new Error('offline module load'); });
  try {
    const { startAccount } = await import('./account');
    startAccount(() => {}, {} as never);
    await handlers.get('account-body:click')!({ target: { closest: () => ({ dataset: { act: 'sign-out' } }) } });
    expect(store.getItem('kingdown.auth')).toBe(saved);
    expect(elements.get('account-body').innerHTML).toContain('data-act="sign-out"');
    expect(elements.get('account-note').textContent).toBe('Could not finish sign-out. Check your connection and try again.');
  } finally { vi.doUnmock('./client'); }
});
