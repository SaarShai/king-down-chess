-- Run once through the admin connection, after 0002–0004 and the audience hook.
-- Set the password with psql's interactive \password prompt, never in this file.
begin;
create role kingdown_plugin_runtime login noinherit nosuperuser nocreatedb
  nocreaterole noreplication nobypassrls;
do $$ begin
  execute format('grant connect on database %I to kingdown_plugin_runtime', current_database());
end $$;
grant usage on schema public, kingdown_oauth to kingdown_plugin_runtime;
grant select, delete on public.plugin_matches to kingdown_plugin_runtime;
grant insert (id, white_id, black_id, mode, revision, save, snapshot),
  update (black_id, revision, save, snapshot, updated_at)
  on public.plugin_matches to kingdown_plugin_runtime;
grant select, insert on public.plugin_match_commands to kingdown_plugin_runtime;
grant select, delete on public.plugin_match_invites to kingdown_plugin_runtime;
grant insert (token_hash, match_id, expires_at), update (joined_by)
  on public.plugin_match_invites to kingdown_plugin_runtime;
grant select on kingdown_oauth.client_resources to kingdown_plugin_runtime;
create policy kingdown_plugin_runtime on public.plugin_matches
  for all to kingdown_plugin_runtime using (true) with check (true);
create policy kingdown_plugin_runtime on public.plugin_match_commands
  for all to kingdown_plugin_runtime using (true) with check (true);
create policy kingdown_plugin_runtime on public.plugin_match_invites
  for all to kingdown_plugin_runtime using (true) with check (true);
create policy kingdown_plugin_runtime on kingdown_oauth.client_resources
  for select to kingdown_plugin_runtime using (true);
commit;

-- Apply after migration 0003 to the existing restricted runtime role.
begin;
grant select on public.plugin_boards to kingdown_plugin_runtime;
grant insert (id,actor_id,match_id), update (match_id) on public.plugin_boards to kingdown_plugin_runtime;
drop policy if exists kingdown_plugin_runtime on public.plugin_boards;
create policy kingdown_plugin_runtime on public.plugin_boards
 for all to kingdown_plugin_runtime using (true) with check (true);
commit;

-- Apply after migrations 0005 and 0006 to the existing restricted runtime role: the game service
-- (src/match/service.ts) reads and writes games, reads handles, blocks and challenge settings, and
-- queues alerts. No delete on game rows: a deleted account leaves its games to the opponent.
begin;
grant select, insert on public.games, public.game_players, public.game_commands to kingdown_plugin_runtime;
grant insert on public.notifications, public.outbox to kingdown_plugin_runtime;
grant update (status, result, end_reason, turn, revision, draw_offer, state, snapshot, deadline_at, deadline_kind,
  moves, started_at, finished_at, updated_at) on public.games to kingdown_plugin_runtime;
grant update (user_id, handle_at_start, action, turns_played, draw_offers, said, last_seen_at, last_surface,
  active, ended_at) on public.game_players to kingdown_plugin_runtime;
grant select, insert, delete on public.game_invites to kingdown_plugin_runtime;
grant update (used_by, used_at) on public.game_invites to kingdown_plugin_runtime;
grant select on public.relations to kingdown_plugin_runtime;
grant select (id, handle, challenge_from) on public.profiles to kingdown_plugin_runtime;
grant usage on sequence public.notifications_id_seq, public.outbox_id_seq to kingdown_plugin_runtime;
do $$
declare t text;
begin
  foreach t in array array['games', 'game_players', 'game_commands', 'game_invites', 'notifications', 'outbox'] loop
    execute format('drop policy if exists kingdown_plugin_runtime on public.%I', t);
    execute format('create policy kingdown_plugin_runtime on public.%I for all to kingdown_plugin_runtime using (true) with check (true)', t);
  end loop;
end $$;
drop policy if exists kingdown_plugin_runtime on public.relations;
create policy kingdown_plugin_runtime on public.relations for select to kingdown_plugin_runtime using (true);
drop policy if exists kingdown_plugin_runtime on public.profiles;
create policy kingdown_plugin_runtime on public.profiles for select to kingdown_plugin_runtime using (true);
commit;
