-- The weekly count of games. Read-only. Not a migration. The owner can paste it into the Supabase SQL editor, or
-- run `tools/release/live.sh games` (tools/games-weekly.mjs runs the same select).
-- It counts games by UTC week (Monday start) and kind for the current week and the 11 weeks before it.
-- "started": the game started in that week. "finished": of those games, the games with the status finished now.
-- It shows no account or game identifier. See the header of tools/games-weekly.mjs for what it cannot count.
begin transaction isolation level repeatable read read only;
select to_char(date_trunc('week', started_at at time zone 'UTC'), 'YYYY-MM-DD') as week_utc, kind,
       count(*)::int as started, (count(*) filter (where status = 'finished'))::int as finished
from public.games
where started_at >= (date_trunc('week', now() at time zone 'UTC') - interval '11 weeks') at time zone 'UTC'
group by 1, 2
order by 1 desc, 2;
rollback;
