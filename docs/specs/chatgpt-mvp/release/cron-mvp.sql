-- Private MVP schedules. Copy of supabase/ops/cron.sql with no alert schedule.
-- The owner gives the word before this file runs in the SQL Editor.
-- Enable pg_cron and pg_net. Store kingdown_internal_secret in Vault.
-- Use the same secret as KINGDOWN_INTERNAL_SECRET. Put no secret in this file.
-- Run only after the release serves /internal/* at the new origin.
-- cron.schedule replaces a job with the same name. This file is safe to repeat.
-- pg_net sends after commit. It does not retry. The next job run repeats a lost call.
-- Unsent outbox rows keep done_at null. The daily cleanup deletes each row made or done more than 30 days ago.

begin;

-- Remove an old alert job only if it exists. An absent job returns no row.
select cron.unschedule(jobid) from cron.job
where jobname in ('kingdown-outbox', 'kingdown-reminders');

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

-- End due setups, friend codes, open games, and first-turn waits.
select cron.schedule('kingdown-tick', '* * * * *', $$select kingdown_jobs.call('/internal/tick')$$);
-- Account deletions after the grace, then the cleanup (03:17 UTC).
select cron.schedule('kingdown-daily', '17 3 * * *', $$select kingdown_jobs.call('/internal/daily')$$);
-- pg_cron does not delete its own run history.
select cron.schedule('kingdown-cron-history', '47 3 * * *', $$delete from cron.job_run_details where end_time < now() - interval '7 days'$$);

commit;
