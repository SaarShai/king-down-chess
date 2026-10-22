import { AuthenticationError, AuthenticationUnavailable } from '../plugin/auth';

export function createCurrentUserCheck({ supabaseUrl, publishableKey }: { supabaseUrl: string; publishableKey: string }, request: typeof fetch = fetch): (token: string, actor: string) => Promise<void> {
 if (!publishableKey) throw new Error('Supabase publishable key is required');
 const base = new URL(supabaseUrl);
 if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash || base.pathname !== '/') throw new Error('Expected a fixed HTTPS Supabase origin');
 const endpoint = `${base.origin}/auth/v1/user`;
 return async (token, actor) => {
  let response: Response;
  try {
   response = await request(endpoint, {
    headers: { apikey: publishableKey, Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(5000), redirect: 'error',
   });
  } catch { throw new AuthenticationUnavailable(); }
  if (response.status === 401 || response.status === 403) throw new AuthenticationError();
  if (!response.ok) throw new AuthenticationUnavailable();
  let user;
  try { user = await response.json(); } catch { throw new AuthenticationUnavailable(); }
  if (typeof user?.id !== 'string' || user.id.toLowerCase() !== actor) throw new AuthenticationError();
 };
}
