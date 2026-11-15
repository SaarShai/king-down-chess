/**
 * The scheduled jobs of online play (report part 03, sections 5.3 and 5.8). pg_cron and pg_net call `/internal/*`
 * (supabase/ops/cron.sql), and each endpoint calls one job here. pg_net does not retry, so the next run repeats a lost
 * one: each job is idempotent and safe to run twice at once. Game rows change only through the game service.
 * `now` is a parameter for tests; invitation expiry and account deletions use the database clock instead.
 */
import { randomUUID } from 'node:crypto';
import type { GameService } from '../match/service';
import { Budget, OutOfTime, STEP_MS } from './budget';
import { diagnostic } from '../plugin/diagnostics';
import { deletionMail, type Mail, type Sender } from './mail';

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
 * With `send`, each deleted account gets one email that confirms the deletion (Apple guideline 5.1.1(v)). The address
 * is read just before the account goes (migration 0026), and only for a due deletion. The emails go after the
 * deletions, so a slow mail service cannot hold back a deletion, and they stop at `deadline` (see sendNotices).
 * `deadline` is the end of the request's budget. Each step (a database call or a game command) follows the rule in
 * budget.ts and keeps NOTICE_RESERVE_MS for the emails (when there are emails to send). The account that a step finds
 * no time for, and the accounts after it, stay due for the next run; so does an account whose step fails or times out.
 * The email is best effort (decision 106): one that fails or does not go in this run is lost, because the server keeps
 * no address after the deletion. The log counts it, with no address.
 */
export async function runDeletions(games: GameService, send?: Sender, deadline = Date.now() + DAILY_BUDGET_MS): Promise<number> {
 const budget = new Budget(deadline).keep(send ? NOTICE_RESERVE_MS : 0), pool = budget.pool(games.store.pool);
 // The game commands use the same rule for each of their database calls.
 const bounded = games.withStore(budget.store(games.store.pool));
 let due;
 try {
  due = await pool.query(`select d.user_id from public.account_deletions d where d.run_after<=now() and d.cancelled_at is null and d.done_at is null
   and not exists(select from public.reports r where d.user_id in (r.reported_id,r.reporter_id) and r.hold_until>now()) order by d.run_after limit 50`);
 } catch (error) {
  if (!(error instanceof OutOfTime)) throw error;
  console.warn('King Down deletions left for the next run');
  return 0;
 }
 let deleted = 0, finished = 0;
 const notices: Mail[] = [];
 for (const { user_id } of due.rows) try {
  const to: string | null = send ? await pool.query('select kingdown_jobs.deletion_email($1) as address', [user_id])
   .then(result => result.rows[0]?.address ?? null, error => {
    if (error instanceof OutOfTime) throw error;
    console.error('King Down deletion notice failed', diagnostic(error)); return null;
   }) : null;
  const active = await pool.query('select g.id,g.status,g.revision from public.game_players p join public.games g on g.id=p.game_id where p.user_id=$1 and p.active', [user_id]);
  for (const g of active.rows) {
   budget.step(STEP_MS);
   // A new command ID each time: the player's own client could send a fixed one first, and the receipt would refuse the job (COMMAND_CONFLICT).
   await bounded.command(user_id, g.id, { command_id: randomUUID(), expected_revision: g.revision, action: { type: g.status === 'waiting' || g.status === 'setup' ? 'abort' : 'resign' } })
    // Ended on time meanwhile, or another run already deleted the account (no seat, no solo game): nothing to end.
    // A move that came first (STALE_REVISION) keeps the game active, so delete_account refuses and the next run tries again.
    .catch(error => { if (!['MATCH_TERMINAL', 'FORBIDDEN', 'NOT_FOUND', 'STALE_REVISION'].includes(error?.code)) throw error; });
  }
  const done = (await pool.query('select kingdown_jobs.delete_account($1) as done', [user_id])).rows[0].done;
  finished++;
  if (!done) continue;
  deleted++;
  // The key makes a repeated send in the same day one email.
  if (to) notices.push({ ...deletionMail(to), key: `kingdown-deletion-${user_id}` });
 } catch (error) {
  if (error instanceof OutOfTime) break;
  // One player whose deletion fails must not stop the others. The row stays due, so each run tries it again.
  // ponytail: 50 such players, the oldest, would hold back the rest; the log shows each failure.
  finished++;
  console.error('King Down deletion failed', diagnostic(error));
 }
 if (finished < due.rows.length) console.warn('King Down deletions left for the next run', { count: due.rows.length - finished });
 if (notices.length) await sendNotices(send!, notices, new Budget(deadline));
 return deleted;
}

/**
 * The daily request's budget, from the request start (tools/plugin-server.mjs passes it through startup): the deployed
 * function stops at 30 s (tools/plugin-server-build.mjs, maxDuration).
 */
export const DAILY_BUDGET_MS = 25_000;
/** No deletion step starts with less time left than this and its bound: it is the time for the emails. */
export const NOTICE_RESERVE_MS = 10_000;
/** No cleanup step starts with less time left than this and its bound: it is the time for the deletions and the emails. */
const CLEANUP_RESERVE_MS = 15_000;
/** The bound of one fault-cleanup batch (100 rows), its connection wait, statement and lock waits included. */
const FAULT_STEP_MS = 500;

/**
 * Sends the notices one at a time (Resend limits the request rate) until the budget's deadline. At the deadline the job
 * stops waiting: the signal aborts the send in progress, and the log counts the notices that did not go (no addresses).
 */
async function sendNotices(send: Sender, notices: Mail[], budget: Budget): Promise<void> {
 const stop = new AbortController(), timer = setTimeout(() => stop.abort(), Math.max(0, budget.deadline - Date.now()));
 const stopped = new Promise<void>(resolve => stop.signal.addEventListener('abort', () => resolve(), { once: true }));
 let done = 0;
 try {
  await Promise.race([stopped, (async () => {
   for (const mail of notices) {
    // The timer can fire late, so the clock decides: a send starts only before the deadline, and the abort bounds it.
    if (stop.signal.aborted || !budget.fits(1)) return;
    await send(mail, stop.signal).catch(error => console.error('King Down deletion notice failed', diagnostic(error)));
    done++;
   }
  })()]);
 } finally { clearTimeout(timer); }
 if (done < notices.length) console.error('King Down deletion notices not sent', { count: notices.length - done });
}

/**
 * The periods in public/privacy.html: deletes expired invitations after the sweep, boards older than 7 days, outbox rows
 * made or done more than 30 days ago (the MVP sends no email, so most rows are never done), reports older than
 * 12 months that no hold covers, and faults older than 30 days. The report delete uses the database clock:
 * runtime-role.sql (tenth block) lets this role delete no newer or held report.
 * Each statement is one step under the rule in budget.ts and keeps CLEANUP_RESERVE_MS for the deletions and the emails.
 * A step that fails or times out is logged and the next one runs; at the first step with no time, cleanup stops, and
 * the next daily run does the rest.
 */
export async function cleanup(games: GameService, now = new Date(), deadline = Infinity): Promise<{ invites: number; outbox: number; boards: number; reports: number }> {
 const budget = new Budget(deadline).keep(CLEANUP_RESERVE_MS), pool = budget.pool(games.store.pool);
 const counts = { invites: 0, outbox: 0, boards: 0, reports: 0 };
 const steps: [keyof typeof counts, string, unknown[]][] = [
  ['invites', `delete from public.game_invites i where i.expires_at<=$1
   and not exists(select from public.games g where g.id=i.game_id and g.status='waiting')`, [now]],
  ['outbox', `delete from public.outbox where done_at<=$1::timestamptz-interval '30 days' or created_at<=$1::timestamptz-interval '30 days'`, [now]],
  ['boards', "delete from public.plugin_boards where created_at<$1::timestamptz-interval '7 days'", [now]],
  ['reports', "delete from public.reports where created_at<now()-interval '12 months' and (hold_until is null or hold_until<=now())", []],
 ];
 try {
  for (const [name, text, values] of steps) {
   try { counts[name] = (await pool.query(text, values)).rowCount ?? 0; }
   catch (error) { if (error instanceof OutOfTime) throw error; console.error('King Down cleanup failed', { step: name, ...diagnostic(error) }); }
  }
  // Fault cleanup that fails stops only itself (it logs nothing: the fault recorder may be the part that fails).
  if (import.meta.env?.KINGDOWN_ERROR_RECORDER !== false) try {
   for (let batch = 100; batch === 100;) batch = await budget.transaction(games.store.pool, async client => {
    await client.query("set local timezone = 'UTC'");
    return (await client.query(`delete from public.client_errors where id in
     (select id from public.client_errors where last_seen<now()-interval '30 days'
      order by last_seen limit 100 for update skip locked)`)).rowCount ?? 0;
   }, FAULT_STEP_MS);
  } catch (error) { if (error instanceof OutOfTime) throw error; }
 } catch (error) {
  if (!(error instanceof OutOfTime)) throw error;
  console.warn('King Down cleanup left for the next run');
 }
 return counts;
}
