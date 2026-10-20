export const STAGING_SUPABASE_REF = 'puhspsyjyzaghmgtkzqd';
export const STAGING_ORIGIN = 'https://kingdown-staging.vercel.app';
export const STAGING_PROJECT_ID = 'prj_6iNibe34pA8ZSblH8DPAHyDTuz3j';
export const STAGING_TEAM_ID = 'team_mIlANWWDRbX1NT4jgJn9jAna';
export const STAGING_SUPABASE_URL = `https://${STAGING_SUPABASE_REF}.supabase.co`;

/** Check the stage before any remote discovery, database connection or public operation. */
export function stagingConfig(env, { publicOrigin, database }) {
  const productionRef = 'utqzovjmclfyojedmwok';
  const supabaseHost = URL.canParse(env.SUPABASE_URL ?? '') ? new URL(env.SUPABASE_URL).hostname : '';
  if (supabaseHost === `${productionRef}.supabase.co` || database.hostname === `db.${productionRef}.supabase.co` || decodeURIComponent(database.username) === `postgres.${productionRef}` || ['https://kingdown.dev', 'https://kingdown.vercel.app', 'https://kingdown-plugin.vercel.app'].includes(publicOrigin)) throw new Error('The production project is disabled in this repository');
  if (env.KINGDOWN_STAGE === undefined || env.KINGDOWN_STAGE === '') return false;
  if (env.KINGDOWN_STAGE !== 'staging') throw new Error('KINGDOWN_STAGE must be staging or unset');
  if (env.SUPABASE_URL !== STAGING_SUPABASE_URL) throw new Error('Staging requires its isolated Supabase project');
  if (publicOrigin !== STAGING_ORIGIN) throw new Error('Staging requires an isolated Vercel preview origin');
  const direct = database.hostname === `db.${STAGING_SUPABASE_REF}.supabase.co` && database.username === 'postgres';
  const pooler = /^[a-z0-9-]+\.pooler\.supabase\.com$/.test(database.hostname) && decodeURIComponent(database.username) === `postgres.${STAGING_SUPABASE_REF}`;
  if ((!direct && !pooler) || database.pathname !== '/postgres') throw new Error('Staging requires its isolated Supabase database');
  if (database.search !== '?sslmode=require' || database.hash) throw new Error('Staging database requires only sslmode=require');
  return true;
}
