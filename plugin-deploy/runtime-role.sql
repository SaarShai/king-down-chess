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

-- Apply after migration 0007: jobs read report holds, clean old rows, and call delete_account.
-- Migration 0015 removes the email helper. This role cannot read or delete auth.users itself.
begin;
grant select, delete, update (attempts, available_at, done_at) on public.outbox to kingdown_plugin_runtime;
grant select (id, user_id, kind, payload, created_at) on public.notifications to kingdown_plugin_runtime;
grant select on public.notification_prefs to kingdown_plugin_runtime;
grant select, insert (user_id), update (turn_email_sent_at) on public.alert_state to kingdown_plugin_runtime;
grant select (quiet_mode) on public.profiles to kingdown_plugin_runtime;
grant select (user_id, run_after, cancelled_at, done_at) on public.account_deletions to kingdown_plugin_runtime;
grant select (reported_id, reporter_id, hold_until) on public.reports to kingdown_plugin_runtime;
grant usage on schema kingdown_jobs to kingdown_plugin_runtime;
grant execute on function kingdown_jobs.delete_account(uuid) to kingdown_plugin_runtime;
do $$
declare t text;
begin
  foreach t in array array['notification_prefs', 'alert_state', 'account_deletions', 'reports'] loop
    execute format('drop policy if exists kingdown_plugin_runtime on public.%I', t);
    execute format('create policy kingdown_plugin_runtime on public.%I for all to kingdown_plugin_runtime using (true) with check (true)', t);
  end loop;
end $$;
commit;

-- Apply after migration 0008 to the existing restricted runtime role: the account and safety services
-- (src/online/accounts.ts, src/online/safety.ts) read and change a player's own handle, settings, follows,
-- blocks, deletion request and alert choices, and add player reports. The deletion check reads report
-- holds. A deletion request goes through kingdown_jobs.request_deletion, which sets its dates: this role
-- writes no date, so it cannot shorten the 7-day grace. It may only cancel a request.
-- The owner's moderation (tools/mod.ts) uses the admin connection: no queue, no mod_actions here.
begin;
grant select (id, handle, handle_changed_at, icon, challenge_from, online_visible_to, quiet_mode, accepting_games, on_leaderboards),
  update (handle, handle_changed_at, icon, challenge_from, online_visible_to, quiet_mode, accepting_games, on_leaderboards)
  on public.profiles to kingdown_plugin_runtime;
grant insert, delete on public.relations to kingdown_plugin_runtime;
grant select, update (cancelled_at) on public.account_deletions to kingdown_plugin_runtime;
grant execute on function kingdown_jobs.request_deletion(uuid) to kingdown_plugin_runtime;
grant select, insert, update (email, push) on public.notification_prefs to kingdown_plugin_runtime;
grant select (id, created_at, reported_id, hold_until),
  insert (reporter_id, reported_id, game_id, target, category, intimate_image, note, content)
  on public.reports to kingdown_plugin_runtime;
grant usage on sequence public.reports_id_seq to kingdown_plugin_runtime;
do $$
declare t text;
begin
  foreach t in array array['profiles', 'relations', 'account_deletions', 'notification_prefs', 'reports'] loop
    execute format('drop policy if exists kingdown_plugin_runtime on public.%I', t);
    execute format('create policy kingdown_plugin_runtime on public.%I for all to kingdown_plugin_runtime using (true) with check (true)', t);
  end loop;
end $$;
commit;

-- Apply after migration 0009 to the existing restricted runtime role: the game service counts each player's
-- invitation-code tries (GameService.join, at most 10 in one hour).
begin;
grant select, insert (user_id), update (window_start, tries) on public.invite_code_tries to kingdown_plugin_runtime;
drop policy if exists kingdown_plugin_runtime on public.invite_code_tries;
create policy kingdown_plugin_runtime on public.invite_code_tries for all to kingdown_plugin_runtime using (true) with check (true);
commit;

-- Apply after migration 0010: choices stay in the service until both seats are ready.
begin;
grant update (setup, rules, engine_fingerprint, setup_deadline_at, rematch_offer, rematch_game_id) on public.games to kingdown_plugin_runtime;
grant update (choice, ready, power) on public.game_players to kingdown_plugin_runtime;
commit;

-- Apply after migration 0012: ratings and result history. Result rows cannot change after the game ends.
begin;
grant select, insert, update (rating, rd, volatility, last_game_at) on public.player_ratings to kingdown_plugin_runtime;
grant select, insert on public.rating_history, public.player_badges to kingdown_plugin_runtime;
drop policy if exists kingdown_plugin_runtime on public.player_ratings;
create policy kingdown_plugin_runtime on public.player_ratings for all to kingdown_plugin_runtime using (true) with check (true);
drop policy if exists kingdown_plugin_runtime on public.rating_history;
create policy kingdown_plugin_runtime on public.rating_history for all to kingdown_plugin_runtime using (true) with check (true);
drop policy if exists kingdown_plugin_runtime on public.player_badges;
create policy kingdown_plugin_runtime on public.player_badges for all to kingdown_plugin_runtime using (true) with check (true);
commit;

-- Apply after migration 0013: home boards, board cleanup and account settings.
begin;
grant insert (game_selected), update (game_selected) on public.plugin_boards to kingdown_plugin_runtime;
grant delete on public.plugin_boards to kingdown_plugin_runtime;
grant select (handle) on public.reserved_handles to kingdown_plugin_runtime;
drop policy if exists kingdown_plugin_runtime on public.reserved_handles;
create policy kingdown_plugin_runtime on public.reserved_handles for select to kingdown_plugin_runtime using (true);
grant select, insert, update (symbols_only, show_threats, last_setup) on public.player_settings to kingdown_plugin_runtime;
drop policy if exists kingdown_plugin_runtime on public.player_settings;
create policy kingdown_plugin_runtime on public.player_settings for all to kingdown_plugin_runtime using (true) with check (true);
commit;

-- Apply after the ninth block: the daily cleanup (src/online/jobs.ts cleanup) deletes a report 12 months after it was
-- made, unless a report hold covers it (privacy policy, approval D9 a). The restrictive policy uses the database clock,
-- so this role can delete no newer or held report.
begin;
grant delete on public.reports to kingdown_plugin_runtime;
drop policy if exists kingdown_plugin_runtime_old_reports on public.reports;
create policy kingdown_plugin_runtime_old_reports on public.reports as restrictive for delete to kingdown_plugin_runtime
  using (created_at < now() - interval '12 months' and (hold_until is null or hold_until <= now()));
commit;

-- 11. Per-user tool counters (0014). Browser roles have no access.
begin;
grant select, insert (user_id,tool), update (window_start,tries) on public.plugin_tool_tries to kingdown_plugin_runtime;
drop policy if exists kingdown_plugin_runtime on public.plugin_tool_tries;
create policy kingdown_plugin_runtime on public.plugin_tool_tries for all to kingdown_plugin_runtime using (true) with check (true);
commit;

-- 12. Web account access (0016). The runtime can read the operator's switch only.
begin;
grant select on public.web_account_access to kingdown_plugin_runtime;
drop policy if exists kingdown_plugin_runtime on public.web_account_access;
create policy kingdown_plugin_runtime on public.web_account_access for select to kingdown_plugin_runtime using (true);
commit;
