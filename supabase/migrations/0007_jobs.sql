-- Two helpers for the jobs of src/online/jobs.ts (report part 03, sections 5.3, 5.8 and 8.8). Run after 0006 with a
-- privileged connection. It is safe to run again. They live in a private schema that the Data API does not expose;
-- only the server role may call them (plugin-deploy/runtime-role.sql, fourth block).

begin;

create schema if not exists kingdown_jobs;
revoke all on schema kingdown_jobs from public, anon, authenticated;

-- The address for an alert email. Email addresses stay in auth.users; profiles never hold one.
create or replace function kingdown_jobs.user_email(uid uuid) returns text
language sql stable security definer set search_path = '' as $$
  select email from auth.users where id = uid
$$;

-- Runs one account deletion whose 7-day grace has ended. It checks again, under the row lock, that the deletion is due,
-- not cancelled and not done, that no report hold covers the player, and that the player has no active game (the job
-- ends those through the game service first). The checks use the database clock, so no caller can shorten the grace
-- or a hold. The handle becomes reserved; solo games go; the opponents keep their games (on delete set null).
create or replace function kingdown_jobs.delete_account(uid uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  perform from public.account_deletions
    where user_id = uid and run_after <= now() and cancelled_at is null and done_at is null for update;
  if not found
    or exists (select from public.reports where uid in (reported_id, reporter_id) and hold_until > now())
    or exists (select from public.game_players where user_id = uid and active) then
    return false;
  end if;
  insert into public.reserved_handles (handle, reason, user_id)
    select handle, 'deleted', id from public.profiles where id = uid and handle is not null
    on conflict (handle) do nothing;
  delete from public.games g using public.game_players p where p.game_id = g.id and p.user_id = uid and g.kind = 'solo';
  delete from auth.users where id = uid;
  update public.account_deletions set done_at = now() where user_id = uid;
  return true;
end $$;

revoke all on function kingdown_jobs.user_email(uuid), kingdown_jobs.delete_account(uuid) from public, anon, authenticated;

commit;
