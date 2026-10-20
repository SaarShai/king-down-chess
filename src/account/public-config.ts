/** Public account settings are supplied by the build; an offline build needs neither value. */
export function publicAccountConfig(env: Record<string, unknown>): { url: string; publishableKey: string } {
  const value = env.VITE_SUPABASE_URL, publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;
  let url: URL;
  try { if (typeof value !== 'string') throw new Error(); url = new URL(value); }
  catch { throw new Error('VITE_SUPABASE_URL must be a fixed HTTPS Supabase origin'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash || !/^[a-z0-9-]+\.supabase\.co$/.test(url.hostname)) throw new Error('VITE_SUPABASE_URL must be a fixed HTTPS Supabase origin');
  if (url.hostname === 'utqzovjmclfyojedmwok.supabase.co') throw new Error('The production account project is disabled in this repository');
  if (env.VITE_KINGDOWN_STAGE === 'staging' && url.origin !== 'https://puhspsyjyzaghmgtkzqd.supabase.co') throw new Error('Staging requires its isolated Supabase project');
  if (typeof publishableKey !== 'string' || !/^sb_publishable_[A-Za-z0-9_-]+$/.test(publishableKey)) throw new Error('VITE_SUPABASE_PUBLISHABLE_KEY must be a publishable key');
  return { url: url.origin, publishableKey };
}
