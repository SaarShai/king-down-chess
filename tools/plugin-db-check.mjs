/** Check the runtime role against the required schema before accepting requests. */
export async function checkPluginDatabase(pool, config, resource) {
  await pool.query('select id,actor_id,match_id from public.plugin_boards limit 0');
  const constraint = await pool.query("select confdeltype from pg_constraint where conrelid='public.plugin_boards'::regclass and conname='plugin_boards_match_id_fkey'");
  if (constraint.rows[0]?.confdeltype !== 'n') throw Object.assign(new Error('Apply plugin migration 0004 before starting the server'), {code:'SCHEMA_REQUIRED'});
  if (config) {
    const allowed = await pool.query('select client_id::text from kingdown_oauth.client_resources where client_id=any($1::uuid[]) and resource=$2', [config.clientIds, resource]);
    if (allowed.rows.length !== config.clientIds.length) throw Object.assign(new Error('Configure the OAuth audience hook allowlist for this resource'), {code:'CONFIG_REQUIRED'});
  }
}
