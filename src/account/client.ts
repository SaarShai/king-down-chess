/**
 * The Supabase client, loaded only when a player signs in or already is (account.ts imports it
 * on demand, so the first paint never waits for it). The publishable key is meant for browsers;
 * Row Level Security in supabase/migrations/ is what protects each player's data.
 */
import { createClient, isAuthApiError, type Session } from '@supabase/supabase-js';
import type { Remote, Row } from './sync';
import { sessionKey, type AccountSession } from './session';
import { authStorage } from './auth-storage';
import { publicAccountConfig, stagingPasswordSignInEnabled } from './public-config';
import { availableProviders, type Provider } from './providers';
import { inApp } from '../platform';
import { appleSignInEnabled, nativeAppleToken, type AppleBridge } from './apple';
declare const __KINGDOWN_LOCAL_ONLINE__: boolean;
const LOCAL_ONLINE = typeof __KINGDOWN_LOCAL_ONLINE__ === 'boolean' && __KINGDOWN_LOCAL_ONLINE__;

export type { Provider, SignInOption } from './providers';

const flowIdValid = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9_-]{8,64}$/.test(value);
function accountSession(session: Session | null): AccountSession | null {
  const userId = session?.user?.id, accessToken = session?.access_token;
  return typeof userId === 'string' && userId && typeof accessToken === 'string' && accessToken ? { userId, accessToken } : null;
}

export function connect(storageKey: string, { manualCallback = false, apple = false }: { manualCallback?: boolean; apple?: boolean } = {}) {
  const useApple = () => apple && appleSignInEnabled(import.meta.env);
  // PKCE: the sign-in page sends back a one-time code; this browser exchanges it with a verifier it kept.
  const { url, publishableKey } = publicAccountConfig(import.meta.env);
  const credentials = authStorage(storageKey, {
    getItem: key => localStorage.getItem(key), setItem: (key, value) => localStorage.setItem(key, value), removeItem: key => localStorage.removeItem(key),
    get length() { return localStorage.length; }, key: i => localStorage.key(i),
  });
  const listeners = new Set<(s: Session | null) => void>();
  const sb = createClient(url, publishableKey, { auth: {
    flowType: 'pkce', persistSession: true, storageKey, storage: credentials.storage,
    ...(manualCallback ? { detectSessionInUrl: false, experimental: { appendPkceFlowIdToRedirects: true } } : {}),
  } });
  const signOutSession = async (expected: AccountSession): Promise<boolean> => {
    await sb.auth.initialize();
    const removed = await credentials.remove(expected, () => {
      // Match the auth client's cross-tab event. Send it before a later auth write can take the lock.
      if (typeof BroadcastChannel !== 'undefined') {
        try {
          const channel = new BroadcastChannel(storageKey);
          channel.postMessage({ event: 'SIGNED_OUT', session: null }); channel.close();
        } catch { /* The shared storage still closes writers in other tabs. */ }
      }
      for (const cb of listeners) setTimeout(() => { void sb.auth.getSession().then(({ data }) => cb(data.session)).catch(() => {}); });
    });
    if (!removed) return false;
    // This request cannot read or remove the stored session, even on a late error.
    const { error } = await sb.auth.admin.signOut(removed, 'local');
    // Deletion can remove the user first. Match the library's already-gone statuses.
    if (error && !(isAuthApiError(error) && [401, 403, 404].includes(error.status))) throw error;
    return true;
  };
  // A request for the confirmed account: throws when another tab has changed the stored session.
  const boundSession = async (expected?: AccountSession): Promise<AccountSession> => {
    const current = accountSession((await sb.auth.getSession()).data.session);
    if (!current || (expected && sessionKey(current) !== sessionKey(expected))) throw new Error('The account changed. Reload the page.');
    return current;
  };
  const signOut = async (): Promise<void> => {
    const { data, error } = await sb.auth.getSession();
    // An expired offline session can fail refresh. Still remove only its stored identity.
    const expected = accountSession(error ? JSON.parse(await credentials.storage.getItem(storageKey) ?? 'null') : data.session);
    if (expected) await signOutSession(expected);
  };
  return {
    providers: async () => (await availableProviders(url, publishableKey, { apple: useApple() })).filter(option => !inApp || option === 'email' || option === 'apple'),
    /** Called with the session now and on every change (null when signed out). */
    onSession(cb: (s: Session | null) => void): () => void {
      let active = true;
      const notify = (s: Session | null) => { if (active) cb(s); };
      listeners.add(notify);
      // Supabase asks that the callback not await its own calls: run ours after it returns.
      const { data: { subscription } } = sb.auth.onAuthStateChange((_event, s) => { setTimeout(() => { if (active) cb(s); }); });
      return () => { if (active) { active = false; listeners.delete(notify); subscription.unsubscribe(); } };
    },
    async readSession(): Promise<AccountSession | null> {
      const { data, error } = await sb.auth.getSession();
      if (error) throw error;
      return accountSession(data.session);
    },
    async startAccountSignIn(provider: Provider, options: { entryPath?: '/next.html' } = {}): Promise<{ url: string; flowId: string }> {
      if (inApp || provider !== 'google' && provider !== 'github' && !(provider === 'facebook' && options.entryPath === '/next.html') && !(provider === 'apple' && options.entryPath === '/next.html' && useApple())) throw new TypeError('Invalid sign-in provider');
      const as = LOCAL_ONLINE ? new URLSearchParams(location.search).get('as') ?? '' : '';
      const queryParams = LOCAL_ONLINE && /^[a-z][a-z0-9_-]{1,18}[a-z0-9]$/.test(as) ? { as } : undefined;
      const { data, error } = await sb.auth.signInWithOAuth({ provider, options: { redirectTo: location.origin + (options.entryPath ?? '/play/'), skipBrowserRedirect: true, ...(queryParams && { queryParams }) } });
      if (error) throw error;
      if (!data.url || !flowIdValid(data.flowId)) throw new TypeError('Sign-in did not start');
      return { url: data.url, flowId: data.flowId };
    },
    async finishAccountSignIn(code: string, flowId: string): Promise<AccountSession> {
      if (!code || !flowIdValid(flowId)) throw new TypeError('Invalid sign-in return');
      const { data, error } = await sb.auth.exchangeCodeForSession(code, { flowId });
      if (error) throw error;
      const session = accountSession(data.session);
      if (!session) throw new TypeError('Sign-in did not finish');
      return session;
    },
    async signInWithApple(): Promise<AccountSession> {
      if (!inApp || !useApple()) throw new Error('Apple sign-in is off');
      const { registerPlugin } = await import('@capacitor/core');
      const result = await nativeAppleToken(registerPlugin<AppleBridge>('KingDownAppleSignIn'));
      const { data, error } = await sb.auth.signInWithIdToken({ provider: 'apple', ...result });
      if (error) throw error;
      const current = accountSession(data.session);
      if (!current) throw new Error('Sign-in did not finish');
      return current;
    },
    async signInWithPassword(email: string, password: string): Promise<AccountSession> {
      if (!stagingPasswordSignInEnabled(import.meta.env)) throw new Error('Test sign-in is available only in staging');
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const session = accountSession(data.session);
      if (!session) throw new Error('Sign-in did not finish');
      return session;
    },
    async sendEmailCode(email: string): Promise<void> {
      const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
      if (error) throw error;
    },
    async verifyEmailCode(email: string, token: string): Promise<AccountSession> {
      const { data, error } = await sb.auth.verifyOtp({ email, token, type: 'email' });
      if (error) throw error;
      const session = accountSession(data.session);
      if (!session) throw new Error('Sign-in did not finish');
      return session;
    },
    async signIn(provider: Provider): Promise<void> {
      if (provider === 'apple') throw new Error('Use the new sign-in page');
      const { error } = await sb.auth.signInWithOAuth({ provider, options: { redirectTo: location.origin + location.pathname } });
      if (error) throw error;
    },
    signOut, signOutSession,
    /** public.delete_my_account() asks for the deletion (migration 0008): it runs after a 7-day grace, and a sign-in in the grace cancels it. */
    async deleteAccount(expected?: AccountSession): Promise<void> {
      const target = await boundSession(expected);
      const { error } = await sb.rpc('delete_my_account');
      if (error) throw error;
      await signOutSession(target);
    },
    /** Settings → Disconnect Muse (migration 0024): revokes each Muse grant at Supabase, which ends the Muse sessions, then
     *  public.delete_my_muse_games() deletes the games played through Muse. A grant that is gone already is no fault.
     *  Returns the number of games deleted, or null when a Muse session still exists or no Muse client is registered (the
     *  database then deletes nothing; the daily sweep deletes the games 30 days after the last use of the link). */
    async disconnectMuse(expected?: AccountSession): Promise<number | null> {
      const target = await boundSession(expected);
      const clients = await sb.rpc('muse_client_ids');
      if (clients.error) throw clients.error;
      for (const clientId of (clients.data ?? []) as string[]) {
        await boundSession(target);
        const { error } = await sb.auth.oauth.revokeGrant({ clientId });
        if (error && error.status !== 404) throw error;
      }
      await boundSession(target);
      const { data, error } = await sb.rpc('delete_my_muse_games');
      if (error) throw error;
      return data as number | null;
    },
    remote(userId: string): Remote {
      return {
        userId,
        async pull() {
          const { data, error } = await sb.from('user_data').select('settings, lessons, saved_game').eq('user_id', userId).maybeSingle();
          if (error) throw error;
          return data as Row | null;
        },
        async push(row) {
          // The reply is the row as kept: the database keeps a section only when the one sent is newer.
          const { data, error } = await sb.from('user_data').upsert({ user_id: userId, ...row }).select('settings, lessons, saved_game').single();
          if (error) throw error;
          return data as Row | null;
        },
      };
    },
  };
}
export type Client = ReturnType<typeof connect>;
