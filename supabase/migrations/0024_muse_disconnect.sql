-- Deletes the games played through Muse when the user disconnects Muse (docs/specs/muse-connector/data-processing.md,
-- section 5). A Muse game is a game against the computer whose start receipt has the surface 'muse'. A game that
-- started on the website stays, also when the user moved in it through Muse.
--
-- Two paths, one function (kingdown_jobs.delete_muse_games):
--   1. Settings -> Account -> Disconnect Muse: the browser revokes the Muse grant at Supabase (revokeGrant, which
--      deletes the Muse sessions), then calls public.delete_my_muse_games().
--   2. A daily pg_cron job (plugin-deploy/muse-sweep-cron.sql) calls the procedure kingdown_jobs.sweep_muse_games():
--      it deletes the Muse games of each user whose Muse link has no session, or no use in the last 30 days, also
--      when the user is still connected. It also repairs path 1 when the revoke worked but the deletion failed.
-- No trigger on the auth schema: the functions only read auth.sessions. The Muse OAuth clients are the rows of
-- kingdown_oauth.client_resources with the resource /muse/mcp (plugin-deploy/oauth-audience-hook.sql).
-- Run after 0023 with a privileged connection. It is safe to run again.
begin;
set local lock_timeout = '5s';

-- Muse start receipts from before this migration have a null surface and the start command ID muse:<request_id>.
-- The seat of the starter must also show a move through Muse, so that a website or ChatGPT start whose client chose a
-- 'muse:' command ID stays unmarked. An old Muse game with no Muse move after its start stays unmarked too.
-- Run this file again after the first deploy whose server writes the surface (docs/MUSE.md): an older server writes
-- unmarked Muse starts until then.
update public.game_commands c set surface = 'muse' where c.kind = 'start' and c.surface is null and c.command_id like 'muse:%'
  and exists(select from public.game_players p where p.game_id = c.game_id and p.seat = c.seat and p.last_surface = 'muse');

-- The Muse OAuth client IDs. None when the audience hook is not installed or has no Muse row.
create or replace function kingdown_jobs.muse_clients() returns setof uuid
language plpgsql stable security definer set search_path = '' as $$
begin
  if to_regclass('kingdown_oauth.client_resources') is null then return; end if;
  return query select c.client_id from kingdown_oauth.client_resources c where c.resource like '%/muse/mcp';
end $$;

-- The last use of the Muse link of uid: the newest refresh (or start) of a Supabase session of a Muse client.
-- Supabase writes sessions.refreshed_at in UTC without a time zone. Null when no Muse session exists.
-- PL/pgSQL, so that the body is checked at the call, not at the creation (test stand-ins of auth.sessions lack columns).
create or replace function kingdown_jobs.muse_last_use(uid uuid) returns timestamptz
language plpgsql stable security definer set search_path = '' as $$
begin
  return (select max(coalesce(s.refreshed_at at time zone 'UTC', s.created_at)) from auth.sessions s
    where s.user_id = uid and s.oauth_client_id in (select kingdown_jobs.muse_clients()));
end $$;

-- Deletes the Muse games of uid, unless the Muse link had a use at or after `since`. Returns the number of games
-- deleted, or null when a use keeps them. Same lock order as kingdown_jobs.delete_account: the account, then the games.
-- Idempotent: a second call finds no Muse game and returns 0. A lock wait longer than 5 seconds is an error.
create or replace function kingdown_jobs.delete_muse_games(uid uuid, since timestamptz) returns integer
language plpgsql security definer set search_path = '' set lock_timeout = '5s' as $$
declare deleted integer;
begin
  perform pg_advisory_xact_lock(hashtextextended('account:'||uid::text,0));
  if kingdown_jobs.muse_last_use(uid) >= since then return null; end if;
  perform from public.games g where g.kind = 'solo'
    and exists(select from public.game_players p where p.game_id = g.id and p.user_id = uid)
    and exists(select from public.game_commands c where c.game_id = g.id and c.kind = 'start' and c.surface = 'muse')
    order by g.id for update;
  -- The commands and the seats go with the game (on delete cascade), as in delete_account.
  delete from public.games g where g.kind = 'solo'
    and exists(select from public.game_players p where p.game_id = g.id and p.user_id = uid)
    and exists(select from public.game_commands c where c.game_id = g.id and c.kind = 'start' and c.surface = 'muse');
  get diagnostics deleted = row_count;
  return deleted;
end $$;

-- True when a Muse game had a Muse command in the last 24 hours, but its player has no Muse session. That means the
-- session match is broken (for example, Supabase stores another client ID), and a sweep would delete every Muse game.
create or replace function kingdown_jobs.muse_sweep_unsafe() returns boolean
language plpgsql stable security definer set search_path = '' as $$
begin
  return exists(select from public.game_commands c
    join public.games g on g.id = c.game_id and g.kind = 'solo'
    where c.surface = 'muse' and c.received_at > statement_timestamp() - interval '24 hours' and c.actor_id is not null
      and exists(select from public.game_commands s where s.game_id = g.id and s.kind = 'start' and s.surface = 'muse')
      and kingdown_jobs.muse_last_use(c.actor_id) is null);
end $$;

-- The users who have a Muse game.
create or replace function kingdown_jobs.muse_game_users() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select distinct p.user_id from public.game_commands c
    join public.games g on g.id = c.game_id and g.kind = 'solo'
    join public.game_players p on p.game_id = g.id and p.user_id is not null
    where c.kind = 'start' and c.surface = 'muse' order by p.user_id;
$$;

-- The daily sweep: the Muse games of each user whose Muse link had no use in the last 30 days. `deleted` gives the
-- number of games deleted, or -1 when the guard stopped the sweep (a warning in the database log says why).
-- With no Muse client row (not set up, or removed in an incident), it deletes nothing.
-- A procedure, so that each user has a transaction of its own: one failure (a lock wait, for example) goes to the log
-- and does not stop the others, and each user's locks end with that user. A procedure that commits cannot be a
-- security definer or set the search path, so each name has its schema, and the work is in the definer functions.
-- pg_cron runs it as the owner (postgres). Call it outside a transaction block: call kingdown_jobs.sweep_muse_games();
create or replace procedure kingdown_jobs.sweep_muse_games(inout deleted integer default null)
language plpgsql as $$
declare uid uuid; n integer;
begin
  deleted := 0;
  if not exists(select from kingdown_jobs.muse_clients()) then return; end if;
  if kingdown_jobs.muse_sweep_unsafe() then
    raise warning 'King Down Muse sweep stopped: a Muse game had a Muse move in the last 24 hours, but its player has no Muse session. Check the Muse client ID in kingdown_oauth.client_resources and auth.sessions.oauth_client_id.';
    deleted := -1;
    return;
  end if;
  commit;
  for uid in select u from kingdown_jobs.muse_game_users() u loop
    begin
      n := kingdown_jobs.delete_muse_games(uid, statement_timestamp() - interval '30 days');
      deleted := deleted + coalesce(n, 0);
    exception when others then
      raise warning 'King Down Muse sweep: one account failed (%), the next run tries again', sqlstate;
    end;
    commit;
  end loop;
end $$;

-- The Settings button. A Muse session that still exists (the revoke did not happen) keeps the games: null.
-- With no Muse client row, the revoke cannot have happened either: null, and the button shows an error.
create or replace function public.delete_my_muse_games() returns integer
language sql security definer set search_path = '' as $$
  select kingdown_jobs.delete_muse_games(auth.uid(), '-infinity')
  where auth.uid() is not null and exists(select from kingdown_jobs.muse_clients());
$$;

-- The browser needs the Muse client IDs for revokeGrant. A client ID is public: it is in each sign-in address.
create or replace function public.muse_client_ids() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select kingdown_jobs.muse_clients() where auth.uid() is not null;
$$;

revoke all on function kingdown_jobs.muse_clients() from public, anon, authenticated;
revoke all on function kingdown_jobs.muse_last_use(uuid) from public, anon, authenticated;
revoke all on function kingdown_jobs.delete_muse_games(uuid, timestamptz) from public, anon, authenticated;
revoke all on function kingdown_jobs.muse_sweep_unsafe() from public, anon, authenticated;
revoke all on function kingdown_jobs.muse_game_users() from public, anon, authenticated;
revoke all on procedure kingdown_jobs.sweep_muse_games(integer) from public, anon, authenticated;
revoke all on function public.delete_my_muse_games() from public, anon, authenticated;
revoke all on function public.muse_client_ids() from public, anon, authenticated;
grant execute on function public.delete_my_muse_games() to authenticated;
grant execute on function public.muse_client_ids() to authenticated;

commit;
