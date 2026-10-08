import { readFileSync } from 'node:fs';

/** Use separate fields so pg URL options cannot replace the verified TLS settings. */
export function pluginDatabaseConfig(db, { localDev = false } = {}) {
  if (db.hash || db.search !== (localDev ? '' : '?sslmode=require')) throw new Error('Database URL must use only sslmode=require in production and no query in local development');
  return {
    host: db.hostname.replace(/^\[(.+)\]$/, '$1'), port: Number(db.port || 5432),
    user: decodeURIComponent(db.username), password: decodeURIComponent(db.password), database: decodeURIComponent(db.pathname.slice(1)),
    ssl: localDev ? false : { ca: readFileSync(new URL('./supabase-ca.crt', import.meta.url), 'utf8'), rejectUnauthorized: true, servername: db.hostname },
  };
}
