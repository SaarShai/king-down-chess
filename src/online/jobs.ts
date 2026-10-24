/**
 * The scheduled jobs of online play (report part 03, sections 5.3 and 5.8). pg_cron and pg_net call `/internal/*`
 * (supabase/ops/cron.sql), and each endpoint calls one job here. pg_net does not retry, so the next run repeats a lost
 * one: each job is idempotent and safe to run twice at once. Game rows change only through the game service.
 * `now` is a parameter for tests; the account deletions use the database clock instead (see runDeletions).
 */
import { randomUUID } from 'node:crypto';
import type { GameService } from '../match/service';
import { diagnostic } from '../plugin/diagnostics';

/** Ends the Daily games past their deadline (loss on time, or the 3-day first-turn cancel) and the waiting games whose invitation ran out. */
export async function sweepDeadlines(games: GameService, now = new Date()): Promise<number> {
 let ended = 0;
 for (let batch; (batch = await games.sweep(now)) > 0;) ended += batch;
 return ended;
}

/**
 * Runs the account deletions whose 7-day grace has ended (report part 03, section 8.8), except while a report hold
 * covers the player. It ends the player's active games through the game service (the opponent wins; a waiting game is
 * aborted), then kingdown_jobs.delete_account checks again under a lock and deletes the account. The grace and the hold
 * use the database clock: they are a trust boundary, so no caller's clock can shorten them. A sign-in that cancels
 * the deletion while this runs keeps the account, but the games it ended stay ended. Returns the number deleted.
 */
export async function runDeletions(games: GameService): Promise<number> {
 const pool = games.store.pool;
 const due = await pool.query(`select d.user_id from public.account_deletions d where d.run_after<=now() and d.cancelled_at is null and d.done_at is null
  and not exists(select from public.reports r where d.user_id in (r.reported_id,r.reporter_id) and r.hold_until>now()) order by d.run_after limit 50`);
 let deleted = 0;
 for (const { user_id } of due.rows) try {
  const active = await pool.query('select g.id,g.status,g.revision from public.game_players p join public.games g on g.id=p.game_id where p.user_id=$1 and p.active', [user_id]);
  // A new command ID each time: the player's own client could send a fixed one first, and the receipt would refuse the job (COMMAND_CONFLICT).
  for (const g of active.rows) await games.command(user_id, g.id, { command_id: randomUUID(), expected_revision: g.revision, action: { type: g.status === 'waiting' || g.status === 'setup' ? 'abort' : 'resign' } })
   // Ended on time meanwhile, or another run already deleted the account (no seat, no solo game): nothing to end.
   // A move that came first (STALE_REVISION) keeps the game active, so delete_account refuses and the next run tries again.
   .catch(error => { if (!['MATCH_TERMINAL', 'FORBIDDEN', 'NOT_FOUND', 'STALE_REVISION'].includes(error?.code)) throw error; });
  if ((await pool.query('select kingdown_jobs.delete_account($1) as done', [user_id])).rows[0].done) deleted++;
 } catch (error) {
  // One player whose deletion fails must not stop the others. The row stays due, so each run tries it again.
  // ponytail: 50 such players, the oldest, would hold back the rest; the log shows each failure.
  console.error('King Down deletion failed', diagnostic(error));
 }
 return deleted;
}

/**
 * The periods in public/privacy.html: deletes expired invitations after the sweep, boards older than 7 days, outbox rows
 * made or done more than 30 days ago (the MVP sends no email, so most rows are never done), and reports older than
 * 12 months that no hold covers. The report delete uses the database clock: runtime-role.sql (tenth block) lets this
 * role delete no newer or held report.
 */
export async function cleanup(games: GameService, now = new Date()): Promise<{ invites: number; outbox: number; boards: number; reports: number }> {
 const pool = games.store.pool;
 const invites = await pool.query(`delete from public.game_invites i where i.expires_at<=$1
  and not exists(select from public.games g where g.id=i.game_id and g.status='waiting')`, [now]);
 const outbox = await pool.query(`delete from public.outbox where done_at<=$1::timestamptz-interval '30 days' or created_at<=$1::timestamptz-interval '30 days'`, [now]);
 const boards = await pool.query("delete from public.plugin_boards where created_at<$1::timestamptz-interval '7 days'", [now]);
 // Fault cleanup must not stop report cleanup or account deletion.
 let client;
 try {
  client = await pool.connect();
  for (;;) {
   await client.query('begin');
   await client.query("set local statement_timeout = '500ms'; set local lock_timeout = '500ms'");
   const batch = await client.query(`delete from public.client_errors where id in
    (select id from public.client_errors where last_seen<now()-interval '30 days'
     order by last_seen limit 100 for update skip locked)`);
   await client.query('commit');
   if ((batch.rowCount ?? 0) < 100) break;
  }
 } catch {
  if (client) try { await client.query('rollback'); } catch { client.release(true); client = undefined; }
 } finally { client?.release(); }
 const reports = await pool.query("delete from public.reports where created_at<now()-interval '12 months' and (hold_until is null or hold_until<=now())");
 return { invites: invites.rowCount ?? 0, outbox: outbox.rowCount ?? 0, boards: boards.rowCount ?? 0, reports: reports.rowCount ?? 0 };
}
