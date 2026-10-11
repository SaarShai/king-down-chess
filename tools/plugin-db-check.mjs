// One read for each migration and runtime-role block that the server uses, as the runtime role. A missing one stops
// the start here (the function answers 503 and tries again on the next request), not at a player's first move.
const PROBES = `select id,actor_id,match_id,game_selected from public.plugin_boards limit 0;
 select id,state,deadline_at,options,draw,deal,level,setup_deadline_at,rematch_offer,rematch_game_id from public.games limit 0;
 select choice,ready from public.game_players limit 0;
 select kingdown_jobs.user_email(null);
 select handle_changed_at,quiet_mode from public.profiles limit 0;
 select requested_at from public.account_deletions limit 0;
 select user_id,tries from public.invite_code_tries limit 0;
 select user_id,rating,rd,volatility,last_game_at from public.player_ratings limit 0;
 select game_id,user_id,rating_before,rd_before,volatility_before,rating,rd,volatility,created_at from public.rating_history limit 0;
 select user_id,badge,earned_at,game_id from public.player_badges limit 0;
 select user_id,symbols_only,show_threats,last_setup from public.player_settings limit 0;
 select has_function_privilege('kingdown_jobs.request_deletion(uuid)','execute')
  and (select bool_and(has_column_privilege('public.games',name,'update')) from unnest(array['setup','rules','engine_fingerprint','setup_deadline_at','rematch_offer','rematch_game_id']) as columns(name))
  and (select bool_and(has_column_privilege('public.game_players',name,'update')) from unnest(array['choice','ready','power']) as columns(name))
  and has_table_privilege('public.player_ratings','insert')
  and (select bool_and(has_column_privilege('public.player_ratings',name,'update')) from unnest(array['rating','rd','volatility','last_game_at']) as columns(name))
  and has_table_privilege('public.rating_history','insert') and has_table_privilege('public.player_badges','insert')
  and has_table_privilege('public.player_settings','insert')
  and (select bool_and(has_column_privilege('public.player_settings',name,'update')) from unnest(array['symbols_only','show_threats','last_setup']) as columns(name))
  and has_column_privilege('public.plugin_boards','game_selected','insert') and has_column_privilege('public.plugin_boards','game_selected','update') as allowed`;
// A missing table, column, function or schema, or a missing grant.
const SCHEMA = ['42P01', '42703', '42883', '3F000', '42501'];
const required = message => Object.assign(new Error(message), { code: 'SCHEMA_REQUIRED' });
/** Check the runtime role against the required schema before accepting requests. */
export async function checkPluginDatabase(pool, config, resource) {
  let probes;
  try { probes = await pool.query(PROBES); }
  catch (error) { if (SCHEMA.includes(error?.code)) throw required('Apply migrations 0005-0013 (including 0010, 0011 and 0012), then plugin-deploy/runtime-role.sql, before starting the server'); throw error; }
  if (!probes.at(-1).rows[0]?.allowed) throw required('Apply the runtime grants in plugin-deploy/runtime-role.sql before starting the server');
  // Boards keep their owner when a game goes (0004), and they point at the online games (0006).
  const constraint = await pool.query("select confdeltype,confrelid=to_regclass('public.games') as games from pg_constraint where conrelid='public.plugin_boards'::regclass and conname='plugin_boards_match_id_fkey'");
  if (constraint.rows[0]?.confdeltype !== 'n' || !constraint.rows[0].games) throw required('Apply plugin migrations 0004 and 0006 before starting the server');
  if (config) {
    const allowed = await pool.query('select client_id::text from kingdown_oauth.client_resources where client_id=any($1::uuid[]) and resource=$2', [config.clientIds, resource]);
    if (allowed.rows.length !== config.clientIds.length) throw Object.assign(new Error('Configure the OAuth audience hook allowlist for this resource'), {code:'CONFIG_REQUIRED'});
  }
}
