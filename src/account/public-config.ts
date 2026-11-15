const STAGING_URL = 'https://puhspsyjyzaghmgtkzqd.supabase.co', PRODUCTION_URL = 'https://utqzovjmclfyojedmwok.supabase.co';
declare const __KINGDOWN_LOCAL_ONLINE__: boolean;
const LOCAL_ONLINE = typeof __KINGDOWN_LOCAL_ONLINE__ === 'boolean' && __KINGDOWN_LOCAL_ONLINE__;

/** Public account settings are supplied by the build; an offline build needs neither value. */
export function publicAccountConfig(env: Record<string, unknown>): { url: string; publishableKey: string } {
  const value = env.VITE_SUPABASE_URL, publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;
  let url: URL;
  try { if (typeof value !== 'string') throw new Error(); url = new URL(value); }
  catch { throw new Error('VITE_SUPABASE_URL must be a fixed HTTPS Supabase origin'); }
  const local = LOCAL_ONLINE && url.protocol === 'http:' && (url.hostname === '127.0.0.1' || url.hostname === 'localhost');
  if ((!local && url.protocol !== 'https:') || url.username || url.password || url.pathname !== '/' || url.search || url.hash || (!local && !/^[a-z0-9-]+\.supabase\.co$/.test(url.hostname))) throw new Error('VITE_SUPABASE_URL must be a fixed HTTPS Supabase origin');
  // Production (stage unset) refuses the staging project; staging refuses the production project.
  const stage = env.VITE_KINGDOWN_STAGE;
  if (stage !== undefined && stage !== '' && stage !== 'staging') throw new Error('VITE_KINGDOWN_STAGE must be staging or unset');
  if (LOCAL_ONLINE && stage === 'staging') throw new Error('Local online stack refuses staging mode');
  if (stage !== 'staging' && url.origin === STAGING_URL) throw new Error('Production refuses the staging account project');
  if (stage === 'staging' && url.origin === PRODUCTION_URL) throw new Error('Staging refuses the production account project');
  if (stage === 'staging' && url.origin !== STAGING_URL) throw new Error('Staging requires its isolated Supabase project');
  if (typeof publishableKey !== 'string' || !/^sb_publishable_[A-Za-z0-9_-]+$/.test(publishableKey)) throw new Error('VITE_SUPABASE_PUBLISHABLE_KEY must be a publishable key');
  return { url: url.origin, publishableKey };
}

/** Picture URLs come from HTTPS providers in builds, plus local same-origin files in the local stack. */
export function allowedAvatarUrl(value: unknown): value is string {
  return typeof value === 'string' && (/^https:\/\//.test(value) || (LOCAL_ONLINE && /^\/(?![/\\])[^\s"'<>\\]+$/.test(value)));
}

/** The server's password allowlist controls which staging accounts can sign in. */
export function stagingPasswordSignInEnabled(env: Record<string, unknown>): boolean {
  return env.VITE_KINGDOWN_STAGE === 'staging' && env.VITE_SUPABASE_URL === STAGING_URL;
}
