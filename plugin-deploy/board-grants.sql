-- Apply after migration 0003 to the existing restricted runtime role.
begin;
grant select on public.plugin_boards to kingdown_plugin_runtime;
grant insert (id,actor_id,match_id), update (match_id) on public.plugin_boards to kingdown_plugin_runtime;
drop policy if exists kingdown_plugin_runtime on public.plugin_boards;
create policy kingdown_plugin_runtime on public.plugin_boards
 for all to kingdown_plugin_runtime using (true) with check (true);
commit;
