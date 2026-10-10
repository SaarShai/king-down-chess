/**
 * The scheduled jobs of online play (report part 03, sections 5.3 and 5.8). pg_cron and pg_net call `/internal/*`
 * (supabase/ops/cron.sql), and each endpoint calls one job here. pg_net does not retry, so the next run repeats a lost
 * one: each job is idempotent and safe to run twice at once. Game rows change only through the game service.
 * `now` is a parameter for tests; the account deletions use the database clock instead (see runDeletions).
 */
import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import type { GameService } from '../match/service';
import { diagnostic } from '../plugin/diagnostics';
import { DEADLINE, nextDeadline } from './deadline';
import { alertMail, type Mail, type Sender } from './mail';

const ACTIVE_MS = 60_000, TRIES = 5;

/** Ends the Daily games past their deadline (loss on time, or the 3-day first-turn cancel) and the waiting games whose invitation ran out. */
export async function sweepDeadlines(games: GameService, now = new Date()): Promise<number> {
 let ended = 0;
 for (let batch; (batch = await games.sweep(now)) > 0;) ended += batch;
 return ended;
}

/**
 * Queues "time almost up" (a notification and an outbox `reminder`) at 80% of the turn time, after both sides have
 * played a turn, once for each turn. nextDeadline (ticket 04) decides; a reminder row for the same deadline means "reminded".
 */
export async function queueReminders(games: GameService, now = new Date()): Promise<number> {
 return games.store.transaction(async client => {
  // One run at a time: a second run waits here, then sees the first run's reminders.
  await client.query("select pg_advisory_xact_lock(hashtext('kingdown_reminders'))");
  // ponytail: reads every Daily game in play each run; bound deadline_at in SQL when there are thousands
  const { rows } = await client.query(`select g.id,g.revision,g.turn,g.days_per_move,g.deadline_at,p.user_id,
    array(select q.turns_played from public.game_players q where q.game_id=g.id order by q.seat) as turns,
    exists(select from public.notifications n where n.user_id=p.user_id and n.kind='reminder' and n.payload->>'game_id'=g.id::text
     and (n.payload->>'deadline_at')::timestamptz=g.deadline_at) as reminded
   from public.games g join public.game_players p on p.game_id=g.id and p.seat=g.turn
   where g.status='playing' and g.speed='daily' and g.deadline_kind='move' and g.deadline_at>$1 and p.user_id is not null`, [now]);
  let queued = 0;
  for (const g of rows) {
   const due = g.deadline_at.getTime(), next = nextDeadline({ speed: 'daily', turn: g.turn, turnStartedAt: due - g.days_per_move * DEADLINE.dayMs,
    turnsPlayed: g.turns, daysPerMove: g.days_per_move, reminded: g.reminded }, now.getTime());
   if (next.kind !== 'reminder' || next.at > now.getTime()) continue;
   // The service writes deadline_at from a JS date (whole milliseconds), so this ISO text compares exactly.
   const payload = { game_id: g.id, revision: g.revision, deadline_at: g.deadline_at.toISOString() };
   await client.query("insert into public.notifications(user_id,kind,payload) values($1,'reminder',$2)", [g.user_id, payload]);
   await client.query("insert into public.outbox(kind,payload) values('reminder',$1)", [{ user_id: g.user_id, ...payload }]);
   queued++;
  }
  return queued;
 });
}

interface Alert { user_id: string; game_id: string; deadline_at: string }
/**
 * The email for a `turn` or `reminder` row, or null when the rules say no alert: the turn has passed or the game ended,
 * the recipient used the game in the last 60 s, email alerts are off for this kind, quiet mode is on, or (for `turn`)
 * a turn email went out and the player has not come back since. "Came back" is a command in any game, or
 * `alert_state.returned_at`. A `turn` row locks the player's alert_state row, so two drains cannot both send it.
 */
async function alert(client: PoolClient, kind: 'turn' | 'reminder', { user_id, game_id, deadline_at }: Alert, now: Date): Promise<Mail | null> {
 // The deadline moves only when the turn passes, so another deadline means the turn has passed since this row.
 // A deleted account has no seat and no profile: no row.
 const r = (await client.query(`select p.last_seen_at,pr.quiet_mode,coalesce(np.email,true) as email,op.handle as opponent,kingdown_jobs.user_email(p.user_id) as address
  from public.games g join public.game_players p on p.game_id=g.id and p.user_id=$1 join public.profiles pr on pr.id=p.user_id
  left join public.notification_prefs np on np.user_id=p.user_id and np.kind=$3
  left join public.game_players o on o.game_id=g.id and o.seat<>p.seat left join public.profiles op on op.id=o.user_id
  where g.id=$2 and g.status='playing' and g.deadline_at=$4::timestamptz`, [user_id, game_id, kind, deadline_at])).rows[0];
 if (!r?.address || !r.email || r.quiet_mode) return null;
 if (r.last_seen_at && now.getTime() - r.last_seen_at.getTime() < ACTIVE_MS) return null;
 if (kind === 'turn') {
  await client.query('insert into public.alert_state(user_id) values($1) on conflict do nothing', [user_id]);
  const state = (await client.query(`select turn_email_sent_at,greatest(returned_at,(select max(last_seen_at) from public.game_players where user_id=$1)) as returned_at
   from public.alert_state where user_id=$1 for update`, [user_id])).rows[0];
  if (state.turn_email_sent_at && !(state.returned_at > state.turn_email_sent_at)) return null;
 }
 return alertMail(kind, { to: r.address, gameId: game_id, opponent: r.opponent, deadline: new Date(deadline_at), now });
}

/**
 * Sends the outbox alerts: one row for each transaction, taken with "for update skip locked", so two drains never take
 * the same row. A sent or skipped row is done; other kinds (game_finished) have no sender yet and are done too. A row
 * that fails (the send, or a bad row) tries again after 2, 4, 8 and 16 minutes, then it is closed, so one bad row never
 * stops the queue. Returns the number of emails sent.
 */
export async function drainOutbox(games: GameService, sender: Sender, now = new Date(), limit = 50): Promise<number> {
 let sent = 0;
 for (let taken = 0; taken < limit; taken++) {
  const more = await games.store.transaction(async client => {
   const event = (await client.query(`select id,kind,payload,attempts from public.outbox where done_at is null and available_at<=$1
    order by available_at,id limit 1 for update skip locked`, [now])).rows[0];
   if (!event) return false;
   let mail: Mail | null = null;
   await client.query('savepoint alert');
   try {
    if (event.kind === 'turn' || event.kind === 'reminder') mail = await alert(client, event.kind, event.payload, now);
    if (mail) await sender({ ...mail, key: `kingdown-outbox-${event.id}` });
   } catch (error) {
    await client.query('rollback to savepoint alert');
    const attempts = event.attempts + 1;
    console.warn(`outbox ${event.id}: failed (${attempts} of ${TRIES}): ${(error as Error).message}`);
    await client.query('update public.outbox set attempts=$2,available_at=$3,done_at=$4 where id=$1',
     [event.id, attempts, new Date(now.getTime() + 2 ** attempts * 60_000), attempts >= TRIES ? now : null]);
    return true;
   }
   if (mail) { sent++; if (event.kind === 'turn') await client.query('update public.alert_state set turn_email_sent_at=$2 where user_id=$1', [event.payload.user_id, now]); }
   await client.query('update public.outbox set done_at=$2 where id=$1', [event.id, now]);
   return true;
  });
  if (!more) break;
 }
 return sent;
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
  for (const g of active.rows) await games.command(user_id, g.id, { command_id: randomUUID(), expected_revision: g.revision, action: { type: g.status === 'waiting' ? 'abort' : 'resign' } })
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

/** Deletes the invitations that ran out (once the sweep has ended their waiting game) and the outbox rows done more than 30 days ago. */
export async function cleanup(games: GameService, now = new Date()): Promise<{ invites: number; outbox: number }> {
 const pool = games.store.pool;
 const invites = await pool.query(`delete from public.game_invites i where i.expires_at<=$1
  and not exists(select from public.games g where g.id=i.game_id and g.status='waiting')`, [now]);
 const outbox = await pool.query(`delete from public.outbox where done_at<=$1::timestamptz-interval '30 days'`, [now]);
 return { invites: invites.rowCount ?? 0, outbox: outbox.rowCount ?? 0 };
}
