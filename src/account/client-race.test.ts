import { afterEach, expect, it, vi } from 'vitest';
import { connect, type Client } from './client';
import { accountData } from './data';
import { onlineHost } from '../interface/people/host';
import { deletedAccountKey } from './local';
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

// The two review cases use the real auth client and its configured storage adapter.
for (const order of ['after final read', 'before sign-out lock'] as const) it(`keeps B when the session changes ${order} of A`, async () => {
  const authStore = setup(), memory = memoryStorage();
  const saved = { ...memory, key: (i: number) => [...memory.records.keys()][i] ?? null, get length() { return memory.records.size; } };
  const tokens: (string | null)[] = [];
  harness.fetch.mockImplementation(async (_input, init) => { tokens.push(new Headers(init?.headers).get('Authorization')); return Response.json({}); });
  const client = connect('fixture-auth'), opening = (await client.readSession())!;
  let switched = false;
  const switchSession = () => { switched = true; authStore.setItem('fixture-auth', JSON.stringify(session('bob'))); };
  const host = onlineHost({ storage: saved, auth: async () => ({ ...client, onSession() { return () => {}; }, readSession: async () => {
    const value = await client.readSession();
    if (order === 'after final read' && JSON.parse(saved.getItem(deletedAccountKey('alice')) ?? 'null')?.deleted && !switched) queueMicrotask(switchSession);
    return value;
  }, signOutSession: async expected => { if (order === 'before sign-out lock') switchSession(); return client.signOutSession(expected); } }),
  fetch: async input => Response.json(String(input).endsWith('/deletion') ? { deletion: { run_after: '2026-12-01T00:00:00Z' } } : { me: { handle: 'alice', icon: null } }),
  rules: () => 'pieces', setRules() {}, changed() {}, open() {}, home() {}, toast() {}, });
  await host.signIn(); await host.deletion.remove().catch(() => {});
  expect(switched).toBe(true);
  expect(tokens).not.toContain('Bearer ' + jwt('bob'));
  expect(JSON.parse(authStore.getItem('fixture-auth')!).user.id).toBe('bob');
  // Exercise the bound client even if the host catches the changed session first.
  expect(await client.signOutSession(opening)).toBe(false);
  expect(JSON.parse(authStore.getItem('fixture-auth')!).user.id).toBe('bob');
});

it.each([false, true])('a late logout reply keeps a new stored session (error: %s)', async fail => {
  const saved = setup();
  let release!: () => void, sent!: () => void;
  const started = new Promise<void>(resolve => { sent = resolve; });
  harness.fetch.mockImplementation(async (input, init) => {
    if (String(input).endsWith('/verify')) return Response.json(session('later', 'alice'));
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer ' + jwt('alice'));
    sent(); await new Promise<void>(resolve => { release = resolve; });
    return fail ? Response.json({ message: 'logout failed' }, { status: 400 }) : Response.json({});
  });
  const client = connect('fixture-auth'), opening = (await client.readSession())!;
  const pending = client.signOutSession(opening); await started;
  await client.verifyEmailCode('alice@example.test', '123456');
  release();
  if (fail) await expect(pending).rejects.toThrow('logout failed');
  else expect(await pending).toBe(true);
  expect(JSON.parse(saved.getItem('fixture-auth')!).access_token).toBe(jwt('later'));
});

it('signs out the expected session after a token refresh with the same session ID', async () => {
  const saved = setup(); harness.fetch.mockResolvedValue(Response.json({}));
  const client = connect('fixture-auth'), opening = (await client.readSession())!;
  saved.setItem('fixture-auth', JSON.stringify(session('alice', 'alice', 2)));
  expect(await client.signOutSession(opening)).toBe(true);
  expect(saved.getItem('fixture-auth')).toBeNull();
  expect(new Headers(harness.fetch.mock.calls.at(-1)![1]?.headers).get('Authorization')).toBe('Bearer ' + jwt('alice', 2));
});

it('review6: sign-out prevents a refresh from writing after its final stored-session check', async () => {
  const memory = memoryStorage(); let arm = false, signedOut: Promise<boolean> | undefined;
  let client!: Client, expected!: Awaited<ReturnType<Client['readSession']>>;
  const events: string[] = [];
  let snapshot = false, tail: Promise<unknown> = Promise.resolve();
  const locks = { request<T>(_name: string, run: () => Promise<T>): Promise<T> {
    let after: Promise<unknown> | undefined;
    const result = tail.then(async () => {
      const value = await run();
      if (snapshot) { snapshot = false; after = signedOut; }
      return value;
    });
    // Release the lock before the caller consumes its old read. Another tab
    // can complete sign-out in that interval. No request overtakes a holder.
    tail = result.then(() => {}, () => {});
    return result.then(async value => { if (after) await after; return value; });
  } };
  const store = { ...memory, getItem(key: string) {
    const value = memory.getItem(key);
    if (key === 'fixture-auth' && arm) { arm = false; snapshot = true; events.push('refresh-check'); signedOut = client.signOutSession(expected!); }
    return value;
  }, setItem(key: string, value: string) { if (key === 'fixture-auth') events.push('save'); memory.setItem(key, value); },
  removeItem(key: string) { if (key === 'fixture-auth') events.push('remove'); memory.removeItem(key); } };
  setup(store); vi.stubGlobal('navigator', { onLine: true, locks });
  harness.fetch.mockImplementation(async input => {
    if (String(input).includes('/token')) { arm = true; return Response.json(session('alice')); }
    return Response.json(String(input).endsWith('/verify') ? session('new-sign-in', 'alice') : {});
  });
  client = connect('fixture-auth'); expected = await client.readSession(); events.length = 0;
  await harness.auth.refreshSession();
  expect(signedOut).toBeDefined(); expect(await signedOut).toBe(true);
  expect(events).toContain('remove');
  expect(memory.getItem('fixture-auth'), JSON.stringify(events)).toBeNull();
  expect(events.indexOf('refresh-check')).toBeLessThan(events.indexOf('remove'));
  expect(events).not.toContain('save');
  await client.verifyEmailCode('alice@example.test', '123456');
  expect(JSON.parse(memory.getItem('fixture-auth')!).access_token).toBe(jwt('new-sign-in'));
});

it('review6: sign-out removes indexed PKCE verifiers as the auth library does', async () => {
  const store = setup();
  let release!: () => void, sent!: () => void;
  const started = new Promise<void>(resolve => { sent = resolve; });
  harness.fetch.mockImplementation(async () => {
    sent(); await new Promise<void>(resolve => { release = resolve; }); return Response.json({});
  });
  const client = connect('fixture-auth'), opening = (await client.readSession())!;
  const flows = [await client.startAccountSignIn('google'), await client.startAccountSignIn('github')];
  for (const flow of flows) expect(store.getItem(`fixture-auth-flow-${flow.flowId}-code-verifier`)).not.toBeNull();
  store.setItem('fixture-auth-user', JSON.stringify({ user: { id: 'alice' } }));
  const pending = client.signOutSession(opening); await started;
  for (const flow of flows) expect(store.getItem(`fixture-auth-flow-${flow.flowId}-code-verifier`)).toBeNull();
  expect(store.getItem('fixture-auth-flows-code-verifier')).toBeNull();
  expect(store.getItem('fixture-auth-code-verifier')).toBeNull();
  expect(store.getItem('fixture-auth-user')).toBeNull();
  const later = await client.startAccountSignIn('google');
  release(); expect(await pending).toBe(true);
  expect(store.getItem(`fixture-auth-flow-${later.flowId}-code-verifier`)).not.toBeNull();
  expect(JSON.parse(store.getItem('fixture-auth-flows-code-verifier')!)).toEqual([later.flowId]);
});

it('review6: sign-out revokes the current token of the expected session after refresh', async () => {
  const store = setup(); harness.fetch.mockResolvedValue(Response.json({}));
  const client = connect('fixture-auth'), opening = (await client.readSession())!;
  const later = Date.now() + 7200_000;
  vi.spyOn(Date, 'now').mockReturnValue(later);
  expect(JSON.parse(atob(opening.accessToken.split('.')[1])).exp).toBeLessThan(Date.now() / 1000);
  const fresh = jwt('alice', 2, Date.now() / 1000 + 3600);
  store.setItem('fixture-auth', JSON.stringify({ ...session('alice'), access_token: fresh }));
  await client.signOutSession(opening);
  expect(new Headers(harness.fetch.mock.calls.at(-1)![1]?.headers).get('Authorization')).toBe('Bearer ' + fresh);
});


it.each([401, 403, 404, 400])('checks the revoke error after local removal (status: %s)', async status => {
  const store = setup();
  harness.fetch.mockResolvedValue(Response.json({ message: 'logout refused' }, { status }));
  const client = connect('fixture-auth'), opening = (await client.readSession())!;
  const pending = client.signOutSession(opening);
  if (status === 400) await expect(pending).rejects.toThrow('logout refused');
  else expect(await pending).toBe(true);
  expect(store.getItem('fixture-auth')).toBeNull();
});

it('review6: a real new sign-in opens the current deletion mark', async () => {
  const store = setup(); harness.fetch.mockResolvedValue(Response.json(session('new-sign-in', 'alice')));
  const client = connect('fixture-auth'), opening = (await client.readSession())!;
  await accountData('alice', store).confirm(async () => opening);
  await accountData('alice', store).close(() => {}, async () => opening);
  const fresh = await client.verifyEmailCode('alice@example.test', '123456');
  await accountData('alice', store).confirm(async () => fresh);
  await accountData('alice', store).write(() => store.setItem('draft', 'new-turn'));
  expect(store.getItem('draft')).toBe('new-turn');
});
