/**
 * The Supabase client, loaded only when a player signs in or already is (account.ts imports it
 * on demand, so the first paint never waits for it). The publishable key is meant for browsers;
 * Row Level Security in supabase/migrations/ is what protects each player's data.
 */
import { createClient, type Session } from '@supabase/supabase-js';
import type { Remote, Row } from './sync';

const SUPABASE_URL = 'https://utqzovjmclfyojedmwok.supabase.co';
const PUBLISHABLE_KEY = 'sb_publishable_8jB5OXiSB56JSJBfPjLvbQ_cKIemhX9';

export type Provider = 'google' | 'github' | 'facebook';

export function connect(storageKey: string) {
  // PKCE: the sign-in page sends back a one-time code; this browser exchanges it with a verifier it kept.
  const sb = createClient(SUPABASE_URL, PUBLISHABLE_KEY, { auth: { flowType: 'pkce', persistSession: true, storageKey } });
  const signOut = async (): Promise<void> => {
    const { error } = await sb.auth.signOut({ scope: 'local' });
    // Offline with an expired session, the library keeps the session (it could not refresh it to sign
    // out with): forget it here anyway, or the next visit would be signed in again.
    if (error) for (const k of [storageKey, `${storageKey}-code-verifier`]) localStorage.removeItem(k);
  };
  return {
    /** Called with the session now and on every change (null when signed out). */
    onSession(cb: (s: Session | null) => void): void {
      // Supabase asks that the callback not await its own calls: run ours after it returns.
      sb.auth.onAuthStateChange((_event, s) => { setTimeout(() => cb(s)); });
    },
    async signIn(provider: Provider): Promise<void> {
      const { error } = await sb.auth.signInWithOAuth({ provider, options: { redirectTo: location.origin + location.pathname } });
      if (error) throw error;
    },
    signOut,
    /** public.delete_my_account() removes the account with its profile and saved data. */
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
