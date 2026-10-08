-- Run once through the admin connection, after 0002, 0003 and the audience hook.
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
