-- Deletes the games played through Muse when the user disconnects Muse (docs/specs/muse-connector/data-processing.md,
-- section 5). A Muse game is a game against the computer whose start receipt has the surface 'muse'. A game that
-- started on the website stays, also when the user moved in it through Muse.
--
-- Two paths, one function (kingdown_jobs.delete_muse_games):
--   1. Settings -> Account -> Disconnect Muse: the browser revokes the Muse grant at Supabase (revokeGrant, which
--      deletes the Muse sessions), then calls public.delete_my_muse_games().
--   2. A daily pg_cron job (supabase/ops/cron.sql) calls kingdown_jobs.sweep_muse_games(): it deletes the Muse games
--      of each user whose Muse link has no session, or no use in the last 30 days. It also repairs path 1 when the
--      revoke worked but the deletion failed.
-- No trigger on the auth schema: the functions only read auth.sessions. The Muse OAuth clients are the rows of
-- kingdown_oauth.client_resources with the resource /muse/mcp (plugin-deploy/oauth-audience-hook.sql).
-- Run after 0023 with a privileged connection. It is safe to run again.
begin;
set local lock_timeout = '5s';

-- Muse start receipts from before this migration have a null surface and the start command ID muse:<request_id>.
update public.game_commands set surface = 'muse' where kind = 'start' and surface is null and command_id like 'muse:%';

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
-- Idempotent: a second call finds no Muse game and returns 0.
create or replace function kingdown_jobs.delete_muse_games(uid uuid, since timestamptz) returns integer
language plpgsql security definer set search_path = '' as $$
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

-- The daily sweep: the Muse games of each user whose Muse link had no use in the last 30 days.
-- With no Muse client row (not set up, or removed in an incident), it deletes nothing.
create or replace function kingdown_jobs.sweep_muse_games() returns integer
language plpgsql security definer set search_path = '' as $$
declare uid uuid; total integer := 0;
begin
  if not exists(select from kingdown_jobs.muse_clients()) then return 0; end if;
  for uid in select distinct p.user_id from public.game_commands c
      join public.games g on g.id = c.game_id and g.kind = 'solo'
      join public.game_players p on p.game_id = g.id and p.user_id is not null
      where c.kind = 'start' and c.surface = 'muse' order by p.user_id loop
    total := total + coalesce(kingdown_jobs.delete_muse_games(uid, statement_timestamp() - interval '30 days'), 0);
  end loop;
  return total;
end $$;

-- The Settings button. A Muse session that still exists (the revoke did not happen) keeps the games: null.
create or replace function public.delete_my_muse_games() returns integer
language sql security definer set search_path = '' as $$
  select kingdown_jobs.delete_muse_games(auth.uid(), '-infinity') where auth.uid() is not null;
$$;

-- The browser needs the Muse client IDs for revokeGrant. A client ID is public: it is in each sign-in address.
create or replace function public.muse_client_ids() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select kingdown_jobs.muse_clients() where auth.uid() is not null;
$$;

revoke all on function kingdown_jobs.muse_clients() from public, anon, authenticated;
revoke all on function kingdown_jobs.muse_last_use(uuid) from public, anon, authenticated;
revoke all on function kingdown_jobs.delete_muse_games(uuid, timestamptz) from public, anon, authenticated;
revoke all on function kingdown_jobs.sweep_muse_games() from public, anon, authenticated;
revoke all on function public.delete_my_muse_games() from public, anon, authenticated;
revoke all on function public.muse_client_ids() from public, anon, authenticated;
grant execute on function public.delete_my_muse_games() to authenticated;
grant execute on function public.muse_client_ids() to authenticated;

commit;
