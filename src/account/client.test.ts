import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { connect } from './client';
import { AUTH_KEY } from './session';

const sdk = vi.hoisted(() => ({ auth: {
  getSession: vi.fn(), onAuthStateChange: vi.fn(), signInWithOAuth: vi.fn(), signInWithPassword: vi.fn(), exchangeCodeForSession: vi.fn(), signOut: vi.fn(),
} }));
const createClient = vi.hoisted(() => vi.fn((_url: string, _key: string, _options: unknown) => sdk));
vi.mock('@supabase/supabase-js', () => ({ createClient }));
const session = (id: unknown = 'user-a', token: unknown = 'token-a') => ({ user: { id }, access_token: token } as Session);
const flowId = 'flow_12345678';
let emit: (event: AuthChangeEvent, value: Session | null) => void;
const unsubscribe = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('VITE_SUPABASE_URL', 'https://project.supabase.co');
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test');
  vi.useFakeTimers();
  vi.stubGlobal('location', new URL('https://kingdown.test/?local=1'));
  sdk.auth.onAuthStateChange.mockImplementation(cb => { emit = cb; return { data: { subscription: { unsubscribe } } }; });
  sdk.auth.getSession.mockResolvedValue({ data: { session: session() }, error: null });
  sdk.auth.signInWithOAuth.mockResolvedValue({ data: { url: 'https://provider.test/start', flowId }, error: null });
  sdk.auth.exchangeCodeForSession.mockResolvedValue({ data: { session: session() }, error: null });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('account identity client', () => {
  // A build outside staging cannot open the staging project (public-config.test.ts), so it uses the production one here.
  it.each([undefined, ''])('refuses password sign-in outside staging (stage %s)', async stage => {
    if (stage !== undefined) vi.stubEnv('VITE_KINGDOWN_STAGE', stage);
    vi.stubEnv('VITE_SUPABASE_URL', 'https://utqzovjmclfyojedmwok.supabase.co');
    await expect(connect(AUTH_KEY).signInWithPassword('player-one@kingdown.example', 'fixture-password')).rejects.toThrow('only in staging');
    expect(sdk.auth.signInWithPassword).not.toHaveBeenCalled();
  });
  it('passes four entered staging accounts to normal password auth and requires a complete session', async () => {
    vi.stubEnv('VITE_KINGDOWN_STAGE', 'staging');
    vi.stubEnv('VITE_SUPABASE_URL', 'https://puhspsyjyzaghmgtkzqd.supabase.co');
    const client = connect(AUTH_KEY);
    const emails = ['privacy-check@kingdown.example', 'player-two@kingdown.example', 'player-three@kingdown.example', 'player-four@kingdown.example'];
    for (const [index, email] of emails.entries()) {
      const userId = `test-user-${index}`, accessToken = `test-token-${index}`;
      sdk.auth.signInWithPassword.mockResolvedValueOnce({ data: { session: session(userId, accessToken) }, error: null });
      expect(await client.signInWithPassword(email, 'fixture-password')).toEqual({ userId, accessToken });
      expect(sdk.auth.signInWithPassword).toHaveBeenNthCalledWith(index + 1, { email, password: 'fixture-password' });
    }
    sdk.auth.signInWithPassword.mockResolvedValueOnce({ data: { session: null }, error: new Error('invalid credentials') });
    await expect(client.signInWithPassword(emails[0], 'wrong')).rejects.toThrow('invalid credentials');
    sdk.auth.signInWithPassword.mockResolvedValueOnce({ data: { session: null }, error: null });
    await expect(client.signInWithPassword(emails[0], 'fixture-password')).rejects.toThrow('Sign-in did not finish');
    expect(sdk.auth.getSession).not.toHaveBeenCalled();
  });
  it('refuses missing public config before it creates an SDK client', () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    expect(() => connect(AUTH_KEY)).toThrow('VITE_SUPABASE_URL');
    expect(createClient).not.toHaveBeenCalled();
  });
  it('A01 reads token and user together, keeps the user on refresh and returns null without a complete session', async () => {
    const client = connect(AUTH_KEY);
    expect(await client.readSession()).toEqual({ userId: 'user-a', accessToken: 'token-a' });
    sdk.auth.getSession.mockResolvedValueOnce({ data: { session: session('user-a', 'refreshed') }, error: null });
    expect(await client.readSession()).toEqual({ userId: 'user-a', accessToken: 'refreshed' });
    for (const value of [null, session('', 'token'), session('user-a', ''), session(null, 'token'), session('user-a', 7)]) {
      sdk.auth.getSession.mockResolvedValueOnce({ data: { session: value }, error: null });
      expect(await client.readSession()).toBeNull();
    }
    sdk.auth.getSession.mockResolvedValueOnce({ data: { session: null }, error: new Error('unavailable') });
    await expect(client.readSession()).rejects.toThrow('unavailable');
  });

  it('A02 defers initial, refresh, switch and sign-out events, then stops queued and later delivery on cleanup', () => {
    const receive = vi.fn(), cleanup = connect(AUTH_KEY).onSession(receive);
    const initial = session(), refreshed = session('user-a', 'refreshed'), switched = session('user-b', 'token-b');
    for (const [event, value] of [['INITIAL_SESSION', initial], ['TOKEN_REFRESHED', refreshed], ['SIGNED_IN', switched], ['SIGNED_OUT', null]] as const) emit(event, value);
    expect(receive).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(receive.mock.calls).toEqual([[initial], [refreshed], [switched], [null]]);
    emit('SIGNED_IN', initial); cleanup(); cleanup(); emit('SIGNED_IN', switched); vi.runAllTimers();
    expect(receive).toHaveBeenCalledTimes(4);
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it('A03 keeps local sign-in settings and its current-path redirect', async () => {
    const client = connect(AUTH_KEY);
    expect(createClient.mock.calls[0][2]).toEqual({ auth: { flowType: 'pkce', persistSession: true, storageKey: AUTH_KEY } });
    await client.signIn('facebook');
    expect(sdk.auth.signInWithOAuth).toHaveBeenCalledExactlyOnceWith({ provider: 'facebook', options: { redirectTo: 'https://kingdown.test/' } });
  });

  it.each(['google', 'github'] as const)('A03 starts %s with a fixed callback, manual detection and a flow ID', async provider => {
    const client = connect(AUTH_KEY, { manualCallback: true });
    expect(createClient.mock.calls[0][2]).toEqual({ auth: { flowType: 'pkce', persistSession: true, storageKey: AUTH_KEY,
      detectSessionInUrl: false, experimental: { appendPkceFlowIdToRedirects: true } } });
    expect(await client.startAccountSignIn(provider)).toEqual({ url: 'https://provider.test/start', flowId });
    expect(sdk.auth.signInWithOAuth).toHaveBeenCalledExactlyOnceWith({ provider, options: { redirectTo: 'https://kingdown.test/play/', skipBrowserRedirect: true } });
  });

  it('A03 rejects other providers, missing flow data and provider errors', async () => {
    const client = connect(AUTH_KEY, { manualCallback: true });
    await expect(client.startAccountSignIn('facebook' as 'google')).rejects.toThrow('Invalid sign-in provider');
    expect(sdk.auth.signInWithOAuth).not.toHaveBeenCalled();
    for (const data of [{ url: null, flowId }, { url: 'https://provider.test', flowId: null }, { url: 'https://provider.test', flowId: '../flow' }]) {
      sdk.auth.signInWithOAuth.mockResolvedValueOnce({ data, error: null });
      await expect(client.startAccountSignIn('google')).rejects.toThrow('Sign-in did not start');
    }
    sdk.auth.signInWithOAuth.mockResolvedValueOnce({ data: {}, error: new Error('provider unavailable') });
    await expect(client.startAccountSignIn('google')).rejects.toThrow('provider unavailable');
  });

  it('A04 exchanges only the explicit flow ID and returns the exchanged user', async () => {
    const client = connect(AUTH_KEY, { manualCallback: true });
    sdk.auth.exchangeCodeForSession.mockResolvedValueOnce({ data: { session: session('user-b', 'token-b') }, error: null });
    expect(await client.finishAccountSignIn('one-use-code', flowId)).toEqual({ userId: 'user-b', accessToken: 'token-b' });
    expect(sdk.auth.exchangeCodeForSession).toHaveBeenCalledExactlyOnceWith('one-use-code', { flowId });
    for (const bad of ['', 'short', '../verifier']) await expect(client.finishAccountSignIn('code', bad)).rejects.toThrow('Invalid sign-in return');
    await expect(client.finishAccountSignIn('', flowId)).rejects.toThrow('Invalid sign-in return');
    expect(sdk.auth.exchangeCodeForSession).toHaveBeenCalledOnce();
  });

  it('A04 never uses a stored session after exchange failure or an incomplete exchange', async () => {
    const client = connect(AUTH_KEY, { manualCallback: true });
    sdk.auth.exchangeCodeForSession.mockResolvedValueOnce({ data: { session: null }, error: new Error('missing verifier') });
    await expect(client.finishAccountSignIn('code', flowId)).rejects.toThrow('missing verifier');
    sdk.auth.exchangeCodeForSession.mockResolvedValueOnce({ data: { session: null }, error: null });
    await expect(client.finishAccountSignIn('code', flowId)).rejects.toThrow('Sign-in did not finish');
    expect(sdk.auth.getSession).not.toHaveBeenCalled();
  });
});
