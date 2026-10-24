export const STAGING_SUPABASE_REF = 'puhspsyjyzaghmgtkzqd';
export const STAGING_ORIGIN = 'https://kingdown-staging.vercel.app';
export const STAGING_PROJECT_ID = 'prj_6iNibe34pA8ZSblH8DPAHyDTuz3j';
export const STAGING_TEAM_ID = 'team_mIlANWWDRbX1NT4jgJn9jAna';
export const STAGING_SUPABASE_URL = `https://${STAGING_SUPABASE_REF}.supabase.co`;
export const PRODUCTION_SUPABASE_REF = 'utqzovjmclfyojedmwok';
export const PRODUCTION_ORIGINS = ['https://kingdown.dev', 'https://kingdown.vercel.app', 'https://kingdown-plugin.vercel.app'];

export const PRODUCTION_SUPABASE_URL = `https://${PRODUCTION_SUPABASE_REF}.supabase.co`;

/** Decode a URL part the way pg does, then fold case and one trailing dot (DNS treats both as the same host). */
const decoded = value => { try { return decodeURIComponent(value); } catch { throw new Error('Expected a PostgreSQL connection URL'); } };
const host = value => decoded(value).toLowerCase().replace(/\.$/, '');
const origin = value => { if (!URL.canParse(value ?? '')) return ''; const url = new URL(value); url.hostname = host(url.hostname); return url.origin; };
const supabaseOrigin = value => { if (!URL.canParse(value ?? '')) return ''; const url = new URL(value); return url.pathname === '/' && !url.username && !url.password && !url.search && !url.hash ? origin(value) : ''; };

const poolerHost = dbHost => /^[a-z0-9-]+\.pooler\.supabase\.com$/.test(dbHost);
const userRefOf = database => { const user = decoded(database.username); return user.includes('.') ? user.slice(user.lastIndexOf('.') + 1).toLowerCase() : ''; };

/** Accept only the production project's database: its direct host, or a Supabase pooler with a user of that project.
 *  A loopback, staging or other host is refused. The errors never hold the URL. */
export function productionDatabase(database) {
  const dbHost = host(database.hostname);
  if (dbHost !== `db.${PRODUCTION_SUPABASE_REF}.supabase.co` && !(poolerHost(dbHost) && userRefOf(database) === PRODUCTION_SUPABASE_REF)) throw new Error('Production requires its Supabase database');
}

/** Check the stage before any remote discovery, database connection or public operation.
 *  Each stage requires its own Supabase project, database and public origin; the other stage's targets are refused first.
 *  A local development server (the caller then requires a loopback origin and database) skips the production targets. */
export function stagingConfig(env, { publicOrigin, database, localDev = false }) {
  const supabase = supabaseOrigin(env.SUPABASE_URL);
  const supabaseHost = URL.canParse(env.SUPABASE_URL ?? '') ? host(new URL(env.SUPABASE_URL).hostname) : '';
  const dbHost = host(database.hostname);
  const dbUser = decoded(database.username);
  const userRef = userRefOf(database);
  const appOrigin = origin(publicOrigin);
  const targets = ref => supabaseHost === `${ref}.supabase.co` || dbHost === `db.${ref}.supabase.co` || userRef === ref;
  const pooler = poolerHost(dbHost);
  if (env.KINGDOWN_STAGE === undefined || env.KINGDOWN_STAGE === '') {
    if (targets(STAGING_SUPABASE_REF) || appOrigin === STAGING_ORIGIN) throw new Error('Production refuses the staging project');
    if (localDev) return false;
    if (supabase !== PRODUCTION_SUPABASE_URL) throw new Error('Production requires its Supabase project');
    if (!PRODUCTION_ORIGINS.includes(appOrigin)) throw new Error('Production requires a production origin');
    productionDatabase(database);
    return false;
  }
  if (env.KINGDOWN_STAGE !== 'staging') throw new Error('KINGDOWN_STAGE must be staging or unset');
  if (targets(PRODUCTION_SUPABASE_REF) || PRODUCTION_ORIGINS.includes(appOrigin)) throw new Error('Staging refuses the production project');
  if (env.SUPABASE_URL !== STAGING_SUPABASE_URL) throw new Error('Staging requires its isolated Supabase project');
  if (publicOrigin !== STAGING_ORIGIN) throw new Error('Staging requires an isolated Vercel preview origin');
  const direct = dbHost === `db.${STAGING_SUPABASE_REF}.supabase.co` && dbUser === 'kingdown_plugin_runtime';
  const pooled = pooler && dbUser === `kingdown_plugin_runtime.${STAGING_SUPABASE_REF}`;
  if ((!direct && !pooled) || database.pathname !== '/postgres') throw new Error('Staging requires its isolated Supabase database and restricted runtime user');
  if (database.search !== '?sslmode=require' || database.hash) throw new Error('Staging database requires only sslmode=require');
  return true;
}
