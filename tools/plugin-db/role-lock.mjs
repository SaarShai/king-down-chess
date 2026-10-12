import pg from 'pg';
export async function withRoleLock(url, work) {
  // Roles span databases; every caller holds the lock on postgres until this client closes.
  const server = new URL(url); server.pathname = '/postgres';
  const client = new pg.Client({ connectionString: server.href });
  try { await client.connect(); await client.query('select pg_advisory_lock(7007007)'); return await work(); }
  finally { await client.end(); }
}
