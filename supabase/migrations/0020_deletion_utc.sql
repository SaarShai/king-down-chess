-- Keep the deletion grace at 168 hours when a caller selects another time zone.
-- Run after 0019 with a privileged connection. It is safe to run again.
begin;

alter function kingdown_jobs.request_deletion(uuid) set timezone to 'UTC';
alter table public.account_deletions alter column run_after set default now() + interval '168 hours';

commit;
