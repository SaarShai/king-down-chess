/** Each marked phase is one query. Concurrent indexes must run outside a transaction. */
export async function applyMigration(client, sql) {
  for (const phase of sql.split(/^-- migrate:next\s*$/m)) {
    if (phase.trim()) await client.query(phase);
  }
}
