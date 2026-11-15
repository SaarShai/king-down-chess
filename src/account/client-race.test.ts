import { afterEach, expect, it, vi } from 'vitest';
import { connect } from './client';
import { onlineHost } from '../interface/people/host';
import { deletedAccountKey } from './local';
import { memoryStorage } from '../interface/people/fake-server';

const harness = vi.hoisted(() => ({ fetch: vi.fn<typeof fetch>() }));
vi.mock('@supabase/supabase-js', async importOriginal => {
  const actual = await importOriginal<typeof import('@supabase/supabase-js')>();
  return { ...actual, createClient: (_url: string, _key: string, options: Parameters<typeof actual.createClient>[2]) => actual.createClient('https://fixture-auth.invalid', 'fixture-publishable', {
    ...options, auth: { ...options?.auth, autoRefreshToken: false, detectSessionInUrl: false }, global: { fetch: harness.fetch },
  }) };
});
const jwt = (id: string, iat = 1) => 'fixture.' + btoa(JSON.stringify({ session_id: id, iat })) + '.signature';
const session = (id: string, user = id, iat = 1) => ({ access_token: jwt(id, iat), refresh_token: 'fixture-refresh-' + id, token_type: 'bearer', expires_in: 3600, expires_at: Date.now() / 1000 + 3600, user: { id: user } });
function setup() {
  const store = memoryStorage();
  vi.stubEnv('VITE_SUPABASE_URL', 'https://project.supabase.co'); vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_fixture');
  vi.stubGlobal('location', new URL('https://kingdown.test/next.html'));
  vi.stubGlobal('history', { state: {}, replaceState() {} });
  vi.stubGlobal('localStorage', store); vi.stubGlobal('sessionStorage', memoryStorage());
  vi.stubGlobal('navigator', { onLine: true }); vi.stubGlobal('matchMedia', () => ({ matches: false }));
  store.setItem('fixture-auth', JSON.stringify(session('alice')));
  return store;
}
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

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
  release(); expect(await pending).toBe(true);
  expect(JSON.parse(saved.getItem('fixture-auth')!).access_token).toBe(jwt('later'));
});

it('signs out the expected session after a token refresh with the same session ID', async () => {
  const saved = setup(); harness.fetch.mockResolvedValue(Response.json({}));
  const client = connect('fixture-auth'), opening = (await client.readSession())!;
  saved.setItem('fixture-auth', JSON.stringify(session('alice', 'alice', 2)));
  expect(await client.signOutSession(opening)).toBe(true);
  expect(saved.getItem('fixture-auth')).toBeNull();
  expect(new Headers(harness.fetch.mock.calls.at(-1)![1]?.headers).get('Authorization')).toBe('Bearer ' + opening.accessToken);
});
