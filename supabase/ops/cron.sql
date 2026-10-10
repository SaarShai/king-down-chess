-- The schedules of the online-play jobs (report part 03, section 5.3; src/online/jobs.ts). Not a migration: the
-- local test database has no pg_cron or pg_net. The owner pastes it into the Supabase SQL editor once, after the
-- deploy that serves /internal/* (ticket 08). It is safe to run again: cron.schedule replaces a job of the same name.
--
-- Before you run it:
--   1. Database -> Extensions: turn on pg_cron and pg_net.
--   2. Store the internal secret in Vault (the same value as the server's internal secret; never in this file):
--        select vault.create_secret('<the internal secret>', 'kingdown_internal_secret');
--   3. pg_cron runs a schedule of seconds only on Postgres 15.1.1.61 or later (Settings -> Infrastructure). On an
--      older version, change '10 seconds' below to '* * * * *'.
--
-- pg_net sends after the commit, waits at most the timeout and never retries; each job is idempotent, so the next
-- run repeats a lost call. Each job runs as the user who scheduled it, which reads the Vault secret.

begin;

create schema if not exists kingdown_jobs;
revoke all on schema kingdown_jobs from public, anon, authenticated;

-- POST https://kingdown.dev<path> with the secret header. Returns the pg_net request id.
create or replace function kingdown_jobs.call(path text) returns bigint
language sql set search_path = '' as $$
  select net.http_post(
    url := 'https://kingdown.dev' || path,
    headers := jsonb_build_object('content-type', 'application/json', 'x-kingdown-internal',
      (select decrypted_secret from vault.decrypted_secrets where name = 'kingdown_internal_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 25000)
$$;
revoke all on function kingdown_jobs.call(text) from public, anon, authenticated;

-- Daily deadlines, the 3-day first-turn cancel and invitations that ran out.
select cron.schedule('kingdown-tick', '* * * * *', $$select kingdown_jobs.call('/internal/tick')$$);
-- Alerts: only when the outbox has a row that is due, so an idle site gets no calls.
select cron.schedule('kingdown-outbox', '10 seconds', $$select kingdown_jobs.call('/internal/outbox')
  where exists (select from public.outbox where done_at is null and available_at <= now())$$);
-- "Time almost up" at 80% of the turn time.
select cron.schedule('kingdown-reminders', '*/10 * * * *', $$select kingdown_jobs.call('/internal/reminders')$$);
-- Account deletions after the grace, then the cleanup (03:17 UTC).
select cron.schedule('kingdown-daily', '17 3 * * *', $$select kingdown_jobs.call('/internal/daily')$$);
-- pg_cron does not delete its own run history.
select cron.schedule('kingdown-cron-history', '47 3 * * *', $$delete from cron.job_run_details where end_time < now() - interval '7 days'$$);

commit;
