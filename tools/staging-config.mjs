export const STAGING_SUPABASE_REF = 'puhspsyjyzaghmgtkzqd';
export const STAGING_ORIGIN = 'https://kingdown-staging.vercel.app';
export const STAGING_PROJECT_ID = 'prj_6iNibe34pA8ZSblH8DPAHyDTuz3j';
export const STAGING_TEAM_ID = 'team_mIlANWWDRbX1NT4jgJn9jAna';
export const STAGING_SUPABASE_URL = `https://${STAGING_SUPABASE_REF}.supabase.co`;
export const PRODUCTION_SUPABASE_REF = 'utqzovjmclfyojedmwok';
export const PRODUCTION_ORIGINS = ['https://kingdown.dev', 'https://kingdown.vercel.app', 'https://kingdown-plugin.vercel.app'];

/** Check the stage before any remote discovery, database connection or public operation.
 *  Production (KINGDOWN_STAGE unset) refuses every staging target; staging refuses every production target. */
export function stagingConfig(env, { publicOrigin, database }) {
  const supabaseHost = URL.canParse(env.SUPABASE_URL ?? '') ? new URL(env.SUPABASE_URL).hostname : '';
  const targets = ref => supabaseHost === `${ref}.supabase.co` || database.hostname === `db.${ref}.supabase.co` || decodeURIComponent(database.username).endsWith(`.${ref}`);
  if (env.KINGDOWN_STAGE === undefined || env.KINGDOWN_STAGE === '') {
    if (targets(STAGING_SUPABASE_REF) || publicOrigin === STAGING_ORIGIN) throw new Error('Production refuses the staging project');
    return false;
  }
  if (env.KINGDOWN_STAGE !== 'staging') throw new Error('KINGDOWN_STAGE must be staging or unset');
  if (targets(PRODUCTION_SUPABASE_REF) || PRODUCTION_ORIGINS.includes(publicOrigin)) throw new Error('Staging refuses the production project');
  if (env.SUPABASE_URL !== STAGING_SUPABASE_URL) throw new Error('Staging requires its isolated Supabase project');
  if (publicOrigin !== STAGING_ORIGIN) throw new Error('Staging requires an isolated Vercel preview origin');
  const direct = database.hostname === `db.${STAGING_SUPABASE_REF}.supabase.co` && decodeURIComponent(database.username) === 'kingdown_plugin_runtime';
  const pooler = /^[a-z0-9-]+\.pooler\.supabase\.com$/.test(database.hostname) && decodeURIComponent(database.username) === `kingdown_plugin_runtime.${STAGING_SUPABASE_REF}`;
  if ((!direct && !pooler) || database.pathname !== '/postgres') throw new Error('Staging requires its isolated Supabase database and restricted runtime user');
  if (database.search !== '?sslmode=require' || database.hash) throw new Error('Staging database requires only sslmode=require');
  return true;
}
