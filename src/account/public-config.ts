const STAGING_URL = 'https://puhspsyjyzaghmgtkzqd.supabase.co', PRODUCTION_URL = 'https://utqzovjmclfyojedmwok.supabase.co';

/** Public account settings are supplied by the build; an offline build needs neither value. */
export function publicAccountConfig(env: Record<string, unknown>): { url: string; publishableKey: string } {
  const value = env.VITE_SUPABASE_URL, publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;
  let url: URL;
  try { if (typeof value !== 'string') throw new Error(); url = new URL(value); }
  catch { throw new Error('VITE_SUPABASE_URL must be a fixed HTTPS Supabase origin'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash || !/^[a-z0-9-]+\.supabase\.co$/.test(url.hostname)) throw new Error('VITE_SUPABASE_URL must be a fixed HTTPS Supabase origin');
  // Production (stage unset) refuses the staging project; staging refuses the production project.
  const stage = env.VITE_KINGDOWN_STAGE;
  if (stage !== undefined && stage !== '' && stage !== 'staging') throw new Error('VITE_KINGDOWN_STAGE must be staging or unset');
  if (stage !== 'staging' && url.origin === STAGING_URL) throw new Error('Production refuses the staging account project');
  if (stage === 'staging' && url.origin === PRODUCTION_URL) throw new Error('Staging refuses the production account project');
  if (stage === 'staging' && url.origin !== STAGING_URL) throw new Error('Staging requires its isolated Supabase project');
  if (typeof publishableKey !== 'string' || !/^sb_publishable_[A-Za-z0-9_-]+$/.test(publishableKey)) throw new Error('VITE_SUPABASE_PUBLISHABLE_KEY must be a publishable key');
  return { url: url.origin, publishableKey };
}

/** The server's password allowlist remains the authority for this staging test account. */
export function stagingTestEmail(env: Record<string, unknown>): string | null {
  return env.VITE_KINGDOWN_STAGE === 'staging' && env.VITE_SUPABASE_URL === STAGING_URL
    ? 'privacy-check@kingdown.example' : null;
}
