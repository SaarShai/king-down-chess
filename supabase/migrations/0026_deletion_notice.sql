-- The address for the deletion notice (Apple guideline 5.1.1(v)). The deletion job (src/online/jobs.ts) reads it just
-- before kingdown_jobs.delete_account removes the account, then sends one email after the deletion. The helper gives an
-- address only for a due deletion: the grace is over, not cancelled, not done, and no report hold covers the player.
-- It uses the database clock, as delete_account does. Browser roles keep no access. Safe to run again.
begin;

create schema if not exists kingdown_jobs;
revoke all on schema kingdown_jobs from public, anon, authenticated;

create or replace function kingdown_jobs.deletion_email(uid uuid) returns text
language sql stable security definer set search_path = '' as $$
  select u.email from auth.users u join public.account_deletions d on d.user_id = u.id
  where u.id = uid and d.run_after <= statement_timestamp() and d.cancelled_at is null and d.done_at is null
    and not exists(select from public.reports r where uid in (r.reported_id, r.reporter_id) and r.hold_until > statement_timestamp())
$$;

revoke all on function kingdown_jobs.deletion_email(uuid) from public, anon, authenticated;

do $$ begin
  if exists(select from pg_roles where rolname = 'kingdown_plugin_runtime') then
    grant usage on schema kingdown_jobs to kingdown_plugin_runtime;
    grant execute on function kingdown_jobs.deletion_email(uuid) to kingdown_plugin_runtime;
  end if;
end $$;

commit;
