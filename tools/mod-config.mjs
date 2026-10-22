import { testDatabase, pluginDatabaseConfig } from './plugin-db-config.mjs';
import { STAGING_SUPABASE_REF } from './staging-config.mjs';

/** The compiled operator accepts disposable checks or the one separate staging project. */
export function stagingOperatorDatabase(value) {
  let db;
  try { db = new URL(value); }
  catch { throw new Error('Expected a PostgreSQL connection URL'); }
  if (['localhost', '127.0.0.1', '[::1]'].includes(db.hostname)) return { connectionString: testDatabase(value) };
  const direct = db.hostname === `db.${STAGING_SUPABASE_REF}.supabase.co` && db.username === 'postgres';
  const pooler = /^[a-z0-9-]+\.pooler\.supabase\.com$/.test(db.hostname) && db.username === `postgres.${STAGING_SUPABASE_REF}`;
  if (!['postgres:', 'postgresql:'].includes(db.protocol) || (!direct && !pooler) || db.pathname !== '/postgres'
    || db.search !== '?sslmode=require' || db.hash || !['', '5432', '6543'].includes(db.port)) {
    throw new Error('Compiled moderation requires the isolated staging admin database with verified TLS');
  }
  return pluginDatabaseConfig(db);
}
