/**
 * The Supabase client, loaded only when a player signs in or already is (account.ts imports it
 * on demand, so the first paint never waits for it). The publishable key is meant for browsers;
 * Row Level Security in supabase/migrations/ is what protects each player's data.
 */
import { createClient, type Session } from '@supabase/supabase-js';
import type { Remote, Row } from './sync';
import type { AccountSession } from './session';
import { publicAccountConfig } from './public-config';
import { availableProviders, type Provider } from './providers';

export type { Provider } from './providers';

const flowIdValid = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9_-]{8,64}$/.test(value);
function accountSession(session: Session | null): AccountSession | null {
  const userId = session?.user?.id, accessToken = session?.access_token;
  return typeof userId === 'string' && userId && typeof accessToken === 'string' && accessToken ? { userId, accessToken } : null;
}

export function connect(storageKey: string, { manualCallback = false }: { manualCallback?: boolean } = {}) {
  // PKCE: the sign-in page sends back a one-time code; this browser exchanges it with a verifier it kept.
  const { url, publishableKey } = publicAccountConfig(import.meta.env);
  const sb = createClient(url, publishableKey, { auth: {
    flowType: 'pkce', persistSession: true, storageKey,
    ...(manualCallback ? { detectSessionInUrl: false, experimental: { appendPkceFlowIdToRedirects: true } } : {}),
  } });
  const signOut = async (): Promise<void> => {
    const { error } = await sb.auth.signOut({ scope: 'local' });
    // Offline with an expired session, the library keeps the session (it could not refresh it to sign
    // out with): forget it here anyway, or the next visit would be signed in again.
    if (error) for (const k of [storageKey, `${storageKey}-code-verifier`]) localStorage.removeItem(k);
  };
  return {
    providers: () => availableProviders(url, publishableKey),
    /** Called with the session now and on every change (null when signed out). */
    onSession(cb: (s: Session | null) => void): () => void {
      let active = true;
      // Supabase asks that the callback not await its own calls: run ours after it returns.
      const { data: { subscription } } = sb.auth.onAuthStateChange((_event, s) => { setTimeout(() => { if (active) cb(s); }); });
      return () => { if (active) { active = false; subscription.unsubscribe(); } };
    },
    async readSession(): Promise<AccountSession | null> {
      const { data, error } = await sb.auth.getSession();
      if (error) throw error;
      return accountSession(data.session);
    },
    async startAccountSignIn(provider: 'google' | 'github'): Promise<{ url: string; flowId: string }> {
      if (provider !== 'google' && provider !== 'github') throw new TypeError('Invalid sign-in provider');
      const { data, error } = await sb.auth.signInWithOAuth({ provider, options: { redirectTo: location.origin + '/play/', skipBrowserRedirect: true } });
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
    async signIn(provider: Provider): Promise<void> {
      const { error } = await sb.auth.signInWithOAuth({ provider, options: { redirectTo: location.origin + location.pathname } });
      if (error) throw error;
    },
    signOut,
    /** public.delete_my_account() asks for the deletion (migration 0008): it runs after a 7-day grace, and a sign-in in the grace cancels it. */
    async deleteAccount(): Promise<void> {
      const { error } = await sb.rpc('delete_my_account');
      if (error) throw error;
      await signOut();
    },
    remote(userId: string): Remote {
      return {
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
