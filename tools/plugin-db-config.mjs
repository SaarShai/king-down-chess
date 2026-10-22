import { readFileSync } from 'node:fs';

/** Accept only a disposable loopback PostgreSQL database. The errors never hold the URL. */
export function testDatabase(connectionString) {
  if (!connectionString) throw new Error('Set PLUGIN_TEST_DATABASE_URL to a disposable loopback database');
  let db;
  try { db = new URL(connectionString); }
  catch { throw new Error('Expected a PostgreSQL connection URL'); }
  if (!['postgres:', 'postgresql:'].includes(db.protocol) || !['127.0.0.1', 'localhost', '[::1]'].includes(db.hostname) || !db.pathname.endsWith('_test')) throw new Error('Source tools and checks require a disposable loopback database ending in _test');
  if (db.search || db.hash) throw new Error('Test database URLs must have no query or fragment');
  return connectionString;
}

/** Use separate fields so pg URL options cannot replace the verified TLS settings. */
export function pluginDatabaseConfig(db, { localDev = false, serverless = false } = {}) {
  if (db.hash || db.search !== (localDev ? '' : '?sslmode=require')) throw new Error('Database URL must use only sslmode=require in production and no query in local development');
  // Supabase session mode reserves a database connection for every idle function client.
  // The request runtime uses explicit transactions, so serverless clients use transaction mode.
  const transactionPool = serverless && !localDev && /^[a-z0-9-]+\.pooler\.supabase\.com$/.test(db.hostname);
  return {
    host: db.hostname.replace(/^\[(.+)\]$/, '$1'), port: transactionPool ? 6543 : Number(db.port || 5432),
    user: decodeURIComponent(db.username), password: decodeURIComponent(db.password), database: decodeURIComponent(db.pathname.slice(1)),
    ssl: localDev ? false : { ca: readFileSync(new URL('./supabase-ca.crt', import.meta.url), 'utf8'), rejectUnauthorized: true, servername: db.hostname },
  };
}
