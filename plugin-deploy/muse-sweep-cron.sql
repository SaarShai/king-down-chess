-- INSTALLATION TEMPLATE ONLY: the owner pastes it into the Supabase SQL editor (docs/MUSE.md, "Disconnect and deletion").
-- The daily sweep of the games played through Muse (migration 0024): each day at 03:37 UTC it deletes the Muse games of
-- each user whose Muse link had no use in 30 days. It runs in the database and calls no server.
-- Before you run it: migration 0024 is applied, and pg_cron is on (Database -> Extensions; supabase/ops/cron.sql).
-- It is safe to run again: cron.schedule replaces a job of the same name.
-- To stop the sweep: select cron.unschedule('kingdown-muse-sweep');
begin;
select cron.schedule('kingdown-muse-sweep', '37 3 * * *', $$select kingdown_jobs.sweep_muse_games()$$);
commit;
