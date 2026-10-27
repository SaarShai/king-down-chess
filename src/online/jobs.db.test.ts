/**
 * Opt-in database tests of the jobs, with a fake clock (Date only). PLUGIN_TEST_DATABASE_URL must
 * name a disposable loopback database; the tests make and use their own copy of it (the name with "_jobs" before
 * "_test"), because a job acts on every game: a sweep in the shared database would end the games of
 * src/match/service.db.test.ts, which runs at the same time.
 */
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { PluginService } from '../plugin/service';
import { DEFAULT_OPTIONS } from '../match/setup';
import { MAX_REVISION } from '../match/protocol';
import { GameService, TURN_DAYS } from '../match/service';
import { PostgresMatchStore } from '../match/store';
import { cleanup, runDeletions, sweepDeadlines } from './jobs';
import { ownTestDatabase } from '../../tools/plugin-db/own-test-db';
import { withRoleLock } from '../../tools/plugin-db/role-lock.mjs';

const CLASSIC_OPTIONS = { ...DEFAULT_OPTIONS, fairy: false, arrangement: false, classic: true };
const url = process.env.PLUGIN_TEST_DATABASE_URL, DAY = 86_400_000, MINUTE = 60_000;
const suite = url ? describe : describe.skip;

suite('online jobs (real PostgreSQL, fake clock)', () => {
 let own: URL, admin: pg.Pool, pools: pg.Pool[], games: GameService[];
 let clock = Date.now() + MINUTE;
 /** Moves the fake clock forward; the service and the jobs both read it. */
 const at = (ms = 0) => { clock += ms; vi.setSystemTime(clock); return new Date(clock); };
 const users: string[] = [], address = (id: string) => `${id}@example.com`;
 const rows = async (sql: string, params: unknown[] = []) => (await admin.query(sql, params)).rows;
 const game = async (id: string) => (await rows('select status,result,end_reason from public.games where id=$1', [id]))[0];
 async function user(name: string) {
  const id = randomUUID(); users.push(id);
  await admin.query('insert into auth.users(id,email) values($1,$2)', [id, address(id)]);
  await admin.query('update public.profiles set handle=$2 where id=$1', [id, `${name}${id.slice(0, 8)}`]);
  return id;
 }
 /** A friend game: host White, guest Black, joined now. */
 async function friend(host: string, guest: string, options: object = {}) {
  const created = await games[0].create(host, { kind: 'friend', options: CLASSIC_OPTIONS, colour: 'white', ...options });
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

 it('cleans up boards older than seven days and keeps their games: the owner reads BOARD_EXPIRED, another account FORBIDDEN', async () => {
  const actor = await user('boards'), plugin = new PluginService(games[0].store);
  const game = await games[0].create(actor, {kind:'solo'});
  const empty = await plugin.openBoard(actor), selected = await plugin.openBoard(actor, game.game_id), fresh = await plugin.openBoard(actor, game.game_id);
  const now = at();
  await admin.query('update public.plugin_boards set created_at=$2 where id=any($1)', [[empty, selected], new Date(now.getTime()-7*DAY-1)]);
  await admin.query('update public.plugin_boards set created_at=$2 where id=$1', [fresh, new Date(now.getTime()-7*DAY)]);
  await cleanup(games[0], now);
  for (const board of [empty, selected]) await expect(plugin.board(actor, board)).rejects.toMatchObject({code:'BOARD_EXPIRED'});
  await expect(plugin.board(await user('stranger'), fresh)).rejects.toMatchObject({code:'FORBIDDEN'});
  expect(await plugin.board(actor, fresh)).toBe(game.game_id);
  expect(await plugin.view(actor, game.game_id)).toMatchObject({status:'playing'});
 });

 it('ends a missed Daily deadline and a waiting game whose invitation ran out, once with two sweeps at once', async () => {
  const [a, b] = [await user('ann'), await user('bob')], start = at().getTime();
  const late = await friend(a, b);
  await admin.query('update public.games set days_per_move=1 where id=$1', [late]); // a game made before F-031 keeps its 1 day
  await move(a, late); await move(b, late); // White to move by start + 1 day
  const open = await games[0].create(a, { kind: 'friend', options: CLASSIC_OPTIONS }); await games[0].invite(a, open.game_id);
  await admin.query('update public.game_invites set expires_at=$2 where game_id=$1', [open.game_id, new Date(start + DAY)]);
  await sweepDeadlines(games[0], new Date(start + DAY - 1000));
  expect([(await game(late)).status, (await game(open.game_id)).status]).toEqual(['playing', 'waiting']);
  const after = at(DAY + 1000);
  // Invitation expiry uses database time, apart from the fake Daily deadline clock.
  await admin.query("update public.game_invites set expires_at=statement_timestamp()-interval '1 second' where game_id=$1", [open.game_id]);
  await Promise.all([sweepDeadlines(games[0], after), sweepDeadlines(games[1], after)]);
  expect(await game(late)).toEqual({ status: 'finished', result: 'black', end_reason: 'timeout' });
  expect(await game(open.game_id)).toEqual({ status: 'aborted', result: null, end_reason: 'no_start' });
  for (const id of [late, open.game_id]) expect((await rows(`select (select count(*)::int from public.game_commands where game_id=$1 and kind='expire') as expired,
   (select count(*)::int from public.outbox where kind='game_finished' and payload->>'game_id'=$1::text) as finished`, [id]))[0]).toEqual({ expired: 1, finished: 1 });
  // The cleanup deletes the invitation of the ended game and the outbox rows done or made more than 30 days ago:
  // the MVP sends no email, so a row that nobody sends must not stay for ever.
  const old = (await rows(`insert into public.outbox(kind,payload,done_at,created_at) values('test','{}',$1,$1),('test','{}',$2,$2),('test','{}',null,$1) returning id`, [new Date(after.getTime() - 31 * DAY), new Date(after.getTime() - 29 * DAY)])).map(row => row.id);
  expect(await cleanup(games[0], after)).toMatchObject({ outbox: 2 });
  expect((await rows('select id from public.outbox where id=any($1)', [old])).map(row => row.id)).toEqual([old[1]]);
  expect((await rows('select game_id from public.game_invites where game_id=any($1)', [[late, open.game_id]])).map(row => row.game_id)).toEqual([late]);
 }, 60_000);

 it('ends the other due games when one game cannot end', async () => {
  const [a, b] = [await user('ora'), await user('pip')];
  const stuck = await friend(a, b), late = await friend(a, b);
  // The schema stops at MAX_REVISION, so this game cannot take its expire event; its deadline is the first, so the sweep meets it first.
  await admin.query(`update public.games set revision=$2,deadline_at=now()-interval '2 minutes' where id=$1`, [stuck, MAX_REVISION]);
  await admin.query(`update public.games set deadline_at=now()-interval '1 minute' where id=$1`, [late]);
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
   await sweepDeadlines(games[0], at());
   expect([(await game(stuck)).status, (await game(late)).status]).toEqual(['playing', 'aborted']);
   expect(error).toHaveBeenCalledWith('King Down sweep failed', { game_id: stuck, name: 'Error', code: '23514' });
  } finally { error.mockRestore(); await admin.query('delete from public.games where id=$1', [stuck]); }
 }, 60_000);

 it('deletes an account after the grace: the opponent keeps the game; a report hold waits; a cancelled request stays', async () => {
  const [x, y, z, b] = [await user('xan'), await user('yul'), await user('zed'), await user('opp')];
  const handle = (await rows('select handle from public.profiles where id=$1', [x]))[0].handle;
  const kept = await friend(x, b); await move(x, kept);
  const solo = (await games[0].create(x, { kind: 'solo' })).game_id, waiting = (await games[0].create(x, { kind: 'friend', options: CLASSIC_OPTIONS })).game_id;
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
  // q's game cannot take another revision (the schema stops at MAX_REVISION), so the job cannot end it.
  const stuck = await friend(q, opp); await admin.query('update public.games set revision=$2 where id=$1', [stuck, MAX_REVISION]);
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

 it('deletes a report 12 months after it was made unless a hold covers it; the runtime role can delete no other report', async () => {
  const role = `jobs_reports_${randomUUID().replaceAll('-', '')}`, password = randomUUID();
  const runtimeUrl = new URL(own.href); runtimeUrl.username = role; runtimeUrl.password = password;
  await withRoleLock(own.href, async () => admin.query(`${(await readFile(new URL('../../plugin-deploy/runtime-role.sql', import.meta.url), 'utf8')).replaceAll('kingdown_plugin_runtime', role)}; alter role ${role} password '${password}'`));
  const runtime = new pg.Pool({ connectionString: runtimeUrl.href, max: 1 });
  try {
   const [a, b] = [await user('reporter'), await user('reported')];
   // Ages and holds on the database clock, which the cleanup and the role's delete policy use.
   const report = async (age: string, hold: string | null) => (await rows(`insert into public.reports(reporter_id,reported_id,target,category,created_at,hold_until)
    values($1,$2,'player','other',now()-$3::interval,now()+$4::interval) returning id`, [a, b, age, hold]))[0].id;
   const [old, expired, held, recent] = [await report('12 months 1 day', null), await report('13 months', '-1 day'), await report('13 months', '30 days'), await report('11 months', null)];
   const action = (await rows(`insert into public.mod_actions(user_id,action,statement,by,report_id) values($1,'warning','test','test',$2) returning id`, [b, old]))[0].id;
   expect((await cleanup(new GameService(new PostgresMatchStore(runtime)), at())).reports).toBe(2);
   expect((await rows('select id from public.reports where id=any($1) order by id', [[old, expired, held, recent]])).map(row => row.id)).toEqual([held, recent]);
   expect((await rows('select report_id from public.mod_actions where id=$1', [action]))[0].report_id).toBeNull();
   expect((await runtime.query('delete from public.reports where id=any($1)', [[held, recent]])).rowCount).toBe(0);
   await admin.query('delete from public.reports where id=any($1)', [[held, recent]]);
   await admin.query('delete from public.mod_actions where id=$1', [action]);
  } finally {
   await runtime.end();
   await withRoleLock(own.href, () => admin.query(`drop owned by ${role}; drop role ${role}`));
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
   const id = await friend(h, p);
   await move(h, id); at(MINUTE); await move(p, id);
   await admin.query(`insert into public.account_deletions(user_id,run_after) values($1,now()-interval '1 minute')`, [gone]);
   await sweepDeadlines(service, at(MINUTE));
   expect(await runDeletions(service)).toBe(1);
   await cleanup(service, at());
   expect(await sweepDeadlines(service, at(TURN_DAYS * DAY))).toBeGreaterThanOrEqual(1);
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
