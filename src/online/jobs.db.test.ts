/**
 * Opt-in database tests of the jobs, with a fake clock (Date only) and the fake sender. PLUGIN_TEST_DATABASE_URL must
 * name a disposable loopback database; the tests make and use their own copy of it (the name with "_jobs" before
 * "_test"), because a job acts on every game: a sweep in the shared database would end the games of
 * src/match/service.db.test.ts, which runs at the same time.
 */
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { GameService } from '../match/service';
import { PostgresMatchStore } from '../match/store';
import { cleanup, drainOutbox, queueReminders, runDeletions, sweepDeadlines } from './jobs';
import { fakeSender, type Mail, type Sender } from './mail';
import { ownTestDatabase } from '../../tools/plugin-db/own-test-db';
import { withRoleLock } from '../../tools/plugin-db/role-lock.mjs';

const url = process.env.PLUGIN_TEST_DATABASE_URL, DAY = 86_400_000, MINUTE = 60_000;
const suite = url ? describe : describe.skip;

suite('online jobs (real PostgreSQL, fake clock)', () => {
 let own: URL, admin: pg.Pool, pools: pg.Pool[], games: GameService[];
 let clock = Date.now() + MINUTE;
 /** Moves the fake clock forward; the service and the jobs both read it. */
 const at = (ms = 0) => { clock += ms; vi.setSystemTime(clock); return new Date(clock); };
 const users: string[] = [], address = (id: string) => `${id}@example.com`;
 const rows = async (sql: string, params: unknown[] = []) => (await admin.query(sql, params)).rows;
 const to = (sender: { sent: Mail[] }, id: string) => sender.sent.filter(mail => mail.to === address(id));
 const game = async (id: string) => (await rows('select status,result,end_reason from public.games where id=$1', [id]))[0];
 async function user(name: string) {
  const id = randomUUID(); users.push(id);
  await admin.query('insert into auth.users(id,email) values($1,$2)', [id, address(id)]);
  await admin.query('update public.profiles set handle=$2 where id=$1', [id, `${name}${id.slice(0, 8)}`]);
  return id;
 }
 /** A Daily friend game: host White, guest Black, joined now. */
 async function friend(host: string, guest: string, options: object = {}) {
  const created = await games[0].create(host, { kind: 'friend', colour: 'white', ...options });
  await games[1].join(guest, (await games[0].invite(host, created.game_id)).code);
  return created.game_id;
 }
 async function move(actor: string, gameId: string) {
  const view = await games[0].view(actor, gameId);
  return games[0].command(actor, gameId, { command_id: randomUUID(), expected_revision: view.revision, action: { type: 'turn', actions: [view.legal[0]] } });
 }

 beforeAll(async () => {
  own = await ownTestDatabase('jobs');
  admin = new pg.Pool({ connectionString: own.href, max: 2 });
  pools = [0, 1].map(() => new pg.Pool({ connectionString: own.href, max: 1 }));
  games = pools.map(pool => new GameService(new PostgresMatchStore(pool)));
  vi.useFakeTimers({ toFake: ['Date'] }); at();
 }, 60_000);
 afterAll(async () => {
  vi.useRealTimers();
  if (!admin) return;
  await admin.query('delete from public.games g where created_by=any($1) or exists(select from public.game_players p where p.game_id=g.id and p.user_id=any($1))', [users]);
  await admin.query('delete from public.account_deletions where user_id=any($1)', [users]);
  await admin.query('delete from auth.users where id=any($1)', [users]);
  await admin.query('delete from public.outbox'); // this database is the suite's own
  await Promise.all([admin, ...pools].map(pool => pool.end()));
 });

 it('ends a missed Daily deadline and a waiting game whose invitation ran out, once with two sweeps at once', async () => {
  const [a, b] = [await user('ann'), await user('bob')], start = at().getTime();
  const late = await friend(a, b, { days_per_move: 1 });
  await move(a, late); await move(b, late); // White to move by start + 1 day
  const open = await games[0].create(a, { kind: 'friend', speed: 'live' }); await games[0].invite(a, open.game_id); // runs out in 1 day
  await sweepDeadlines(games[0], new Date(start + DAY - 1000));
  expect([(await game(late)).status, (await game(open.game_id)).status]).toEqual(['playing', 'waiting']);
  const after = at(DAY + 1000);
  await Promise.all([sweepDeadlines(games[0], after), sweepDeadlines(games[1], after)]);
  expect(await game(late)).toEqual({ status: 'finished', result: 'black', end_reason: 'timeout' });
  expect(await game(open.game_id)).toEqual({ status: 'aborted', result: null, end_reason: 'no_start' });
  for (const id of [late, open.game_id]) expect((await rows(`select (select count(*)::int from public.game_commands where game_id=$1 and kind='expire') as expired,
   (select count(*)::int from public.outbox where kind='game_finished' and payload->>'game_id'=$1::text) as finished`, [id]))[0]).toEqual({ expired: 1, finished: 1 });
  // The cleanup deletes the invitation of the ended game and the outbox rows done more than 30 days ago.
  const old = (await rows(`insert into public.outbox(kind,payload,done_at) values('test','{}',$1),('test','{}',$2) returning id`, [new Date(after.getTime() - 31 * DAY), new Date(after.getTime() - 29 * DAY)])).map(row => row.id);
  expect(await cleanup(games[0], after)).toMatchObject({ outbox: 1 });
  expect((await rows('select id from public.outbox where id=any($1)', [old])).map(row => row.id)).toEqual([old[1]]);
  expect((await rows('select game_id from public.game_invites where game_id=any($1)', [[late, open.game_id]])).map(row => row.game_id)).toEqual([late]);
 }, 60_000);

 it('ends the other due games when one game cannot end', async () => {
  const [a, b] = [await user('ora'), await user('pip')];
  const stuck = await friend(a, b), late = await friend(a, b);
  // The schema stops at revision 1000, so this game cannot take its expire event; its deadline is the first, so the sweep meets it first.
  await admin.query(`update public.games set revision=1000,deadline_at=now()-interval '2 minutes' where id=$1`, [stuck]);
  await admin.query(`update public.games set deadline_at=now()-interval '1 minute' where id=$1`, [late]);
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
   await sweepDeadlines(games[0], at());
   expect([(await game(stuck)).status, (await game(late)).status]).toEqual(['playing', 'aborted']);
   expect(error).toHaveBeenCalledWith('King Down sweep failed', { game_id: stuck, name: 'Error', code: '23514' });
  } finally { error.mockRestore(); await admin.query('delete from public.games where id=$1', [stuck]); }
 }, 60_000);

 it('sends no alert while the recipient is in the game', async () => {
  const [h, p] = [await user('hal'), await user('pia')];
  const id = await friend(h, p);
  at(20_000); await move(h, id); // the turn passes to Black 20 s after Black joined
  const sender = fakeSender();
  await drainOutbox(games[0], sender, at(20_000), 500);
  expect(to(sender, p)).toEqual([]);
  expect(await rows(`select done_at is not null as done from public.outbox where kind='turn' and payload->>'user_id'=$1`, [p])).toEqual([{ done: true }]);
 }, 60_000);

 it('sends one turn email, then no more until the player returns', async () => {
  const [h1, h2, p] = [await user('ivy'), await user('jon'), await user('kim')];
  const one = await friend(h1, p), two = await friend(h2, p);
  at(10 * MINUTE); await move(h1, one); await move(h2, two);
  const sender = fakeSender();
  await drainOutbox(games[0], sender, at(MINUTE), 500);
  expect(to(sender, p).map(mail => [mail.subject.startsWith('Your move against @ivy'), mail.text.includes(`/g/${one}`)])).toEqual([[true, true]]);
  at(MINUTE); await move(p, one); // the player comes back
  at(10 * MINUTE); await move(h1, one);
  await drainOutbox(games[0], sender, at(MINUTE), 500);
  expect(to(sender, p).map(mail => mail.text.includes(`/g/${one}`))).toEqual([true, true]);
 }, 60_000);

 it('queues the 80% reminder once, after both sides have played, with two runs at once', async () => {
  const [h, p] = [await user('lea'), await user('max')];
  const id = await friend(h, p, { days_per_move: 1 });
  const reminders = async () => (await rows(`select (select count(*)::int from public.notifications where kind='reminder' and payload->>'game_id'=$1) as notices,
   (select count(*)::int from public.outbox where kind='reminder' and payload->>'game_id'=$1) as events`, [id]))[0];
  await move(h, id);
  await queueReminders(games[0], at(0.81 * 3 * DAY)); // Black's first turn (3 days): no reminder before both sides have played
  expect(await reminders()).toEqual({ notices: 0, events: 0 });
  await move(p, id); const turn = clock; // White to move by turn + 1 day
  await queueReminders(games[0], at(0.79 * DAY));
  expect(await reminders()).toEqual({ notices: 0, events: 0 });
  const due = at(0.02 * DAY);
  await Promise.all([queueReminders(games[0], due), queueReminders(games[1], due)]);
  await queueReminders(games[0], at(MINUTE));
  expect(await reminders()).toEqual({ notices: 1, events: 1 });
  expect((await rows(`select payload->>'deadline_at' as deadline from public.outbox where kind='reminder' and payload->>'game_id'=$1`, [id]))[0].deadline).toBe(new Date(turn + DAY).toISOString());
  // A reminder for an older deadline of this game is out of date: the turn has passed since.
  await admin.query(`insert into public.outbox(kind,payload) values('reminder',$1)`, [{ user_id: h, game_id: id, revision: 1, deadline_at: new Date(turn - 2 * DAY).toISOString() }]);
  const sender = fakeSender();
  await drainOutbox(games[0], sender, at(), 500);
  expect(to(sender, h).filter(mail => mail.subject.startsWith('Time almost up against @max'))).toHaveLength(1);
 }, 60_000);

 it('sends each message once with two drains at once, and tries a failed send again later, at most 5 times', async () => {
  const guests: string[] = [];
  for (let i = 0; i < 4; i++) { const [h, g] = [await user('host'), await user('guest')]; guests.push(g); await move(h, await friend(h, g)); }
  // One more guest, with the turn in two games and an alert_state row already: one turn email between both drains.
  const both = await user('both');
  await admin.query('insert into public.alert_state(user_id) values($1)', [both]);
  for (let i = 0; i < 2; i++) { const h = await user('host'); await move(h, await friend(h, both)); }
  // The first email to that guest is slow, so the other drain reaches the guest's second row meanwhile.
  const sender = fakeSender(), slow: Sender = async mail => { await new Promise(resolve => setTimeout(resolve, mail.to === address(both) ? 200 : 5)); await sender(mail); };
  const now = at(10 * MINUTE);
  await Promise.all([drainOutbox(games[0], slow, now, 500), drainOutbox(games[1], slow, now, 500)]);
  expect([...guests, both].map(g => to(sender, g).length)).toEqual([1, 1, 1, 1, 1]);
  expect(new Set(sender.sent.map(mail => mail.key)).size).toBe(sender.sent.length);
  // A send that fails, or a bad row, waits 2, 4, 8 and 16 minutes, then the row is closed; the rows after it still go.
  const [q, r] = [await user('quin'), await user('rae')], bad = randomUUID();
  await admin.query(`insert into public.outbox(kind,payload) values('turn',$1)`, [{ user_id: bad, game_id: bad, deadline_at: 'not a time' }]);
  await move(q, await friend(q, r));
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const down = fakeSender(), failing: Sender = async mail => { if (mail.to === address(r)) throw new Error('down'); await down(mail); };
  const state = async (user: string) => (await rows(`select attempts,done_at is not null as done,available_at from public.outbox where kind='turn' and payload->>'user_id'=$1`, [user]))[0];
  const first = at(10 * MINUTE);
  await drainOutbox(games[0], failing, first, 500);
  for (const user of [r, bad]) expect(await state(user)).toEqual({ attempts: 1, done: false, available_at: new Date(first.getTime() + 2 * MINUTE) });
  await drainOutbox(games[0], failing, at(MINUTE), 500);
  expect((await state(r)).attempts).toBe(1);
  for (const wait of [MINUTE, 4 * MINUTE, 8 * MINUTE, 16 * MINUTE]) await drainOutbox(games[0], failing, at(wait), 500);
  for (const user of [r, bad]) expect(await state(user)).toMatchObject({ attempts: 5, done: true });
  expect(warn).toHaveBeenCalledTimes(10); warn.mockRestore();
  // The same failure, then a working sender: the email goes once.
  const [s, t] = [await user('sam'), await user('tom')];
  await move(s, await friend(s, t));
  const later = fakeSender(), flaky: Sender = async mail => { if (mail.to === address(t)) throw new Error('down'); };
  vi.spyOn(console, 'warn').mockImplementationOnce(() => {});
  await drainOutbox(games[0], flaky, at(10 * MINUTE), 500);
  await drainOutbox(games[0], later, at(2 * MINUTE), 500);
  expect(to(later, t)).toHaveLength(1);
 }, 60_000);

 it('deletes an account after the grace: the opponent keeps the game; a report hold waits; a cancelled request stays', async () => {
  const [x, y, z, b] = [await user('xan'), await user('yul'), await user('zed'), await user('opp')];
  const handle = (await rows('select handle from public.profiles where id=$1', [x]))[0].handle;
  const kept = await friend(x, b); await move(x, kept);
  const solo = (await games[0].create(x, { kind: 'solo' })).game_id, waiting = (await games[0].create(x, { kind: 'friend' })).game_id;
  // The grace uses the database clock, so the rows say when.
  await admin.query(`insert into public.account_deletions(user_id,requested_at,run_after,cancelled_at) values
   ($1,now()-interval '8 days',now()-interval '1 minute',null),($2,now()-interval '8 days',now()-interval '1 minute',null),($3,now()-interval '8 days',now()-interval '1 minute',now()-interval '2 days')`, [x, y, z]);
  await admin.query(`insert into public.reports(reporter_id,reported_id,target,category,hold_until) values($1,$2,'player','child_safety_or_illegal',now()+interval '1 day')`, [b, y]);
  // The helper checks again under its lock: not for a held, cancelled or early request, nor with an active game.
  await admin.query(`insert into public.account_deletions(user_id) values($1)`, [b]);
  for (const id of [y, z, b, x]) expect((await rows('select kingdown_jobs.delete_account($1) as done', [id]))[0].done, id).toBe(false);
  const runs = await Promise.all([runDeletions(games[0]), runDeletions(games[1])]);
  expect(runs[0] + runs[1]).toBe(1);
  expect((await rows('select id from auth.users where id=any($1)', [[x, y, z]])).map(row => row.id).sort()).toEqual([y, z].sort());
  expect(await game(kept)).toEqual({ status: 'finished', result: 'black', end_reason: 'resignation' });
  const view = await games[1].view(b, kept);
  expect([view.revision, view.opponent?.deleted, view.opponent?.handle]).toEqual([3, true, null]);
  expect(await game(waiting)).toMatchObject({ status: 'aborted', end_reason: 'abort' });
  expect(await game(solo)).toBeUndefined();
  expect(await rows('select reason,user_id from public.reserved_handles where handle=$1', [handle])).toEqual([{ reason: 'deleted', user_id: null }]);
  expect((await rows('select user_id from public.account_deletions where user_id=any($1) and done_at is not null', [[x, y, z]])).map(row => row.user_id)).toEqual([x]);
  await admin.query(`update public.reports set hold_until=now()-interval '1 second' where reported_id=$1`, [y]);
  expect(await runDeletions(games[0])).toBe(1);
  expect((await rows('select id from auth.users where id=any($1)', [[y, z]])).map(row => row.id)).toEqual([z]);
 }, 60_000);

 it('runs the other deletions when one fails, and no command ID of the player blocks one', async () => {
  const [p, q, r, opp] = [await user('pam'), await user('qin'), await user('rex'), await user('opa')];
  // p sent the job's old fixed command ID first, in a solo game (no deadline ends it).
  const solo = await games[0].create(p, { kind: 'solo', colour: 'white' });
  await games[0].command(p, solo.game_id, { command_id: 'account-deletion', expected_revision: 0, action: { type: 'turn', actions: [solo.legal[0]] } });
  // q's game cannot take another revision (the schema stops at 1000), so the job cannot end it.
  const stuck = await friend(q, opp); await admin.query('update public.games set revision=1000 where id=$1', [stuck]);
  await admin.query(`insert into public.account_deletions(user_id,run_after) values($1,now()-interval '3 minutes'),($2,now()-interval '2 minutes'),($3,now()-interval '1 minute')`, [p, q, r]);
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
   expect(await runDeletions(games[0])).toBe(2);
   expect(error.mock.calls).toEqual([['King Down deletion failed', { name: 'Error', code: '23514' }]]);
   expect((await rows('select id from auth.users where id=any($1)', [[p, q, r]])).map(row => row.id)).toEqual([q]);
  } finally {
   error.mockRestore();
   await admin.query('delete from public.games where id=$1', [stuck]);
   await admin.query('update public.account_deletions set cancelled_at=now() where user_id=$1', [q]);
  }
 }, 60_000);

 it('runs every job with the reviewed runtime role, which cannot read or delete accounts itself', async () => {
  const role = `jobs_test_${randomUUID().replaceAll('-', '')}`, password = randomUUID();
  const runtimeUrl = new URL(own.href); runtimeUrl.username = role; runtimeUrl.password = password;
  await withRoleLock(own.href, async () => admin.query(`${(await readFile(new URL('../../plugin-deploy/runtime-role.sql', import.meta.url), 'utf8')).replaceAll('kingdown_plugin_runtime', role)}; alter role ${role} password '${password}'`));
  const runtime = new pg.Pool({ connectionString: runtimeUrl.href, max: 1 });
  try {
   const service = new GameService(new PostgresMatchStore(runtime));
   const [h, p, gone] = [await user('uma'), await user('val'), await user('wes')];
   const id = await friend(h, p, { days_per_move: 1 });
   await move(h, id); at(MINUTE); await move(p, id);
   await admin.query(`insert into public.account_deletions(user_id,run_after) values($1,now()-interval '1 minute')`, [gone]);
   const sender = fakeSender();
   await sweepDeadlines(service, at(MINUTE));
   expect(await queueReminders(service, at(0.81 * DAY))).toBeGreaterThanOrEqual(1);
   await drainOutbox(service, sender, at(), 500);
   expect(to(sender, h).map(mail => mail.subject.split(' ')[0])).toEqual(['Your', 'Time']);
   expect(await runDeletions(service)).toBe(1);
   await cleanup(service, at());
   expect(await sweepDeadlines(service, at(DAY))).toBeGreaterThanOrEqual(1);
   for (const statement of [
    'select email from auth.users',
    'delete from auth.users',
    'update public.account_deletions set done_at=now()',
    'update public.alert_state set returned_at=now()',
    'select note from public.reports',
    "update public.outbox set payload='{}'",
   ]) await expect(runtime.query(statement), statement).rejects.toMatchObject({ code: '42501' });
  } finally {
   await runtime.end();
   await withRoleLock(own.href, () => admin.query(`drop owned by ${role}; drop role ${role}`));
  }
 }, 60_000);
});
