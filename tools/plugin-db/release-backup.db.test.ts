/** Opt-in (PLUGIN_TEST_DATABASE_URL): the release backup and the games restore (release-safety ticket 01). On the test's own
 * copy (the name with "_releasebackup" before "_test"), because the test makes and drops the backup schema and empties the
 * game tables. A move is a games update (revision + 1), one game_commands row and a seat update, as in PostgresMatchStore.save. */
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ownTestDatabase } from './own-test-db';

const backupSql = readFileSync('plugin-deploy/release-backup.sql', 'utf8');
const restoreSql = readFileSync('plugin-deploy/release-restore-games.sql', 'utf8');
const B = 'release_backup_20261022';
const suite = process.env.PLUGIN_TEST_DATABASE_URL ? describe : describe.skip;

suite('the release backup and games restore', () => {
 let own: URL, pool: pg.Pool;
 const users = [randomUUID(), randomUUID(), randomUUID()];
 const [a, b, c] = [randomUUID(), randomUUID(), randomUUID()];
 beforeAll(async () => {
  own = await ownTestDatabase('releasebackup');
  pool = new pg.Pool({ connectionString: own.href, max: 4 });
 }, 120_000);
 afterAll(async () => { await pool?.end(); });
 beforeEach(async () => {
  await pool.query(`drop schema if exists ${B} cascade; truncate public.games cascade; delete from auth.users; delete from public.account_deletions`);
  await pool.query('insert into auth.users(id) select unnest($1::uuid[])', [users]);
  await game(a, 2, [users[0], users[1]]);
  await game(b, 1, [users[2], null]);
 });

 /** A friend game at `revision` with commands 1..revision, two seats and one invite; or a solo game, whose empty seat is the computer and which has no invite. */
 async function game(id: string, revision: number, seats: (string | null)[], kind: 'friend' | 'solo' = 'friend') {
  await pool.query(`insert into public.games(id,kind,speed,category,colour_rule,setup,rules,engine_fingerprint,status,turn,revision,state,snapshot,created_by)
   values($1,$5,'daily','standard','white','{}','{}','sha256:${'0'.repeat(64)}','playing',$2,$3,'{}','{}',$4)`, [id, revision % 2, revision, seats[0], kind]);
  for (const [seat, user] of seats.entries()) await pool.query(`insert into public.game_players(game_id,seat,user_id,computer,action) values($1,$2,$3,$4,'waiting')`, [id, seat, user, kind === 'solo' && !user]);
  for (let seq = 1; seq <= revision; seq++) await command(pool, id, seq, seats[(seq - 1) % 2]);
  if (kind === 'friend') await pool.query(`insert into public.game_invites(token_hash,code_hash,game_id,seat,created_by,expires_at) values($1,$2,$3,1,$4,now()+interval '1 day')`, [randomUUID(), randomUUID(), id, seats[0]]);
 }
 const command = (client: pg.Pool | pg.PoolClient, id: string, seq: number, actor: string | null) => client.query(`insert into public.game_commands(game_id,seq,seat,actor_id,command_id,kind,payload,turn_after,status_after,received_at)
  values($1,$2,$3,$4,$5,'move','{}',$6,'playing',now())`, [id, seq, (seq - 1) % 2, actor, randomUUID(), seq % 2]);
 /** One move of game `id`, as the game service writes it. */
 async function move(client: pg.Pool | pg.PoolClient, id: string) {
  const { rows: [{ revision }] } = await client.query('update public.games set revision=revision+1, turn=1-turn, updated_at=now() where id=$1 returning revision', [id]);
  await command(client, id, revision, null);
  await client.query("update public.game_players set action='done', turns_played=turns_played+1 where game_id=$1 and seat=$2", [id, (revision - 1) % 2]);
 }
 /** `seat` resigns game `id` (the other seat wins) or aborts it, as runDeletions does through the game service: the end, one command row, both seats done,
  * and for a finished legacy or ranked-v1 game of two accounts one rating_history row for each, as recordResult (src/match/results.ts) writes. */
 async function end(id: string, seat: number, reason: 'resignation' | 'abort') {
  const status = reason === 'abort' ? 'aborted' : 'finished';
  const { rows: [{ revision, turn }] } = await pool.query(`update public.games set revision=revision+1, status=$2, result=$3, end_reason=$4, finished_at=now(), updated_at=now()
   where id=$1 returning revision, turn`, [id, status, reason === 'abort' ? null : ['white', 'black'][1 - seat], reason]);
  await pool.query(`insert into public.game_commands(game_id,seq,seat,actor_id,command_id,kind,payload,turn_after,status_after,received_at)
   select $1,$2,$3,user_id,$4,$5,'{}',$6,$7,now() from public.game_players where game_id=$1 and seat=$3`, [id, revision, seat, randomUUID(), reason === 'abort' ? 'abort' : 'resign', turn, status]);
  await pool.query("update public.game_players set action='done', active=false, ended_at=now() where game_id=$1", [id]);
  await pool.query(`insert into public.rating_history(game_id,user_id,rating_before,rd_before,volatility_before,rating,rd,volatility,created_at)
   select g.id,p.user_id,1500,350,0.06,1500,300,0.06,now() from public.games g join public.game_players p on p.game_id=g.id
   where g.id=$1 and g.status='finished' and g.rating_policy in ('legacy','ranked-v1') and g.kind<>'solo'
    and not exists (select from public.game_players q where q.game_id=g.id and (q.user_id is null or q.computer))`, [id]);
 }
 const outcome = async (id: string) => (await pool.query('select status, result, end_reason from public.games where id=$1', [id])).rows[0];
 /** Each game with its revision, its command seqs, its seat actions and its invite count. */
 async function games(schema = 'public') {
  const { rows } = await pool.query(`select g.id, g.revision,
   (select coalesce(array_agg(seq order by seq), '{}') from ${schema}.game_commands c where c.game_id=g.id) as seqs,
   (select array_agg(coalesce(user_id::text, '-') || ':' || action order by seat) from ${schema}.game_players p where p.game_id=g.id) as seats,
   (select count(*)::int from ${schema}.game_invites i where i.game_id=g.id) as invites
   from ${schema}.games g order by g.id`);
  return Object.fromEntries(rows.map(({ id, ...row }) => [id, row]));
 }
 /** Run a file as the SQL Editor does: one text, and a rollback when a statement fails. */
 async function run(sql: string, client?: pg.PoolClient) {
  const own = client ?? await pool.connect();
  try { return await own.query(sql); }
  catch (error) { await own.query('rollback'); throw error; }
  finally { if (!client) own.release(); }
 }
 const lockWait = async (pid: number) => {
  for (let i = 0; i < 200; i++) {
   if ((await pool.query("select from pg_stat_activity where pid=$1 and wait_event_type='Lock'", [pid])).rowCount) return;
   await new Promise(resolve => setTimeout(resolve, 25));
  }
  throw new Error('the backup never waited for the games lock');
 };

 /** A move commits while the backup waits between its game_commands copy and its games copy (the copy is in name order). */
 async function backupDuringMove(sql: string, change: (client: pg.PoolClient) => Promise<void>) {
  const writer = await pool.connect(), copier = await pool.connect();
  try {
   await writer.query('begin');
   await writer.query('lock table public.games in access exclusive mode');
   await change(writer);
   const pid = (await copier.query('select pg_backend_pid() as pid')).rows[0].pid;
   const copy = run(sql, copier).then(() => null, (error: Error) => error);
   await lockWait(pid);
   await writer.query('commit');
   return await copy;
  } finally { writer.release(); copier.release(); }
 }

 it('copies one snapshot: a move that commits during the copy is in no backup table', async () => {
  const before = await games();
  expect(await backupDuringMove(backupSql, client => move(client, a))).toBeNull();
  expect(await games(B)).toEqual(before);
  expect((await games())[a]).toMatchObject({ revision: 3, seqs: [1, 2, 3] });
 });

 it('control: with a plain begin, the same wait gives a backup whose games and seats disagree', async () => {
  const plain = backupSql.replace('begin isolation level repeatable read;', 'begin;');
  expect(plain).not.toBe(backupSql);
  // A seat and game update with no new command row: every count agrees, so only the snapshot can catch it.
  expect(await backupDuringMove(plain, async client => {
   await client.query("update public.game_players set action='ready' where game_id=$1", [a]);
   await client.query('update public.games set turn=1-turn where id=$1', [a]);
  })).toBeNull();
  const copy = (await pool.query(`select g.turn, (select array_agg(action order by seat) from ${B}.game_players p where p.game_id=g.id) as actions from ${B}.games g where id=$1`, [a])).rows[0];
  expect(copy).toEqual({ turn: 1, actions: ['waiting', 'waiting'] });
 });

 it('the old instruction (insert the backup rows) cannot bring back a changed game', async () => {
  await run(backupSql);
  await move(pool, a);
  await expect(run(`begin; insert into public.games select * from ${B}.games; commit;`)).rejects.toMatchObject({ code: '23505' });
  expect((await games())[a]).toMatchObject({ revision: 3 });
 });

 it('restores a changed game and a deleted game, keeps a newer game, and gives the same result on a second run', async () => {
  await run(backupSql);
  const backup = await games();
  await move(pool, a);
  await pool.query('delete from public.games where id=$1', [b]);
  await game(c, 1, [users[1], users[0]]);
  // A report on the changed game keeps its link through the restore (an update in place).
  await pool.query(`insert into public.reports(reporter_id,reported_id,game_id,target,category) values($1,$2,$3,'player','other')`, [users[1], users[0], a]);
  const newer = (await games())[c];
  const result = (await run(restoreSql)) as unknown as pg.QueryResult[];
  expect(result.at(-1)!.rows[0]).toMatchObject({ backup_games: '2', restored_games: '2', newer_games_kept: '1' });
  const after = await games();
  expect(after).toEqual({ ...backup, [c]: newer });
  expect((await pool.query('select game_id from public.reports')).rows).toEqual([{ game_id: a }]);
  await run(restoreSql);
  expect(await games()).toEqual(after);
 });

 it('brings back a game that ended before the backup with the seat of an account deleted since null and without the invite that it made', async () => {
  await end(b, 0, 'abort');
  await run(backupSql);
  // An owner's delete in auth.users, then a fault deletes the game: only the backup copy can bring it back.
  await pool.query('delete from auth.users where id=$1', [users[2]]);
  await pool.query('delete from public.games where id=$1', [b]);
  await run(restoreSql);
  expect((await games())[b]).toMatchObject({ revision: 2, seqs: [1, 2], seats: ['-:done', '-:done'], invites: 0 });
 });

 it('keeps the solo game of an account that delete_account erased since the backup erased, and keeps its shared game as the deletion left it', async () => {
  // users[1] has a solo game and a seat in friend game a with users[0]. Each seat keeps the handle at the game start.
  const solo = randomUUID();
  await game(solo, 1, [users[1], null], 'solo');
  await pool.query("update public.game_players set handle_at_start='erased-handle' where user_id=$1", [users[1]]);
  await run(backupSql);
  // The deletion job ends the active games (src/online/jobs.ts runDeletions), then delete_account erases the account.
  await end(solo, 0, 'resignation');
  await end(a, 1, 'resignation');
  await pool.query("insert into public.account_deletions(user_id,requested_at,run_after) values($1,now()-interval '8 days',now()-interval '1 day')", [users[1]]);
  expect((await pool.query('select kingdown_jobs.delete_account($1) as done', [users[1]])).rows[0].done).toBe(true);
  const erased = await games(), handles = async () => (await pool.query('select game_id,seat,handle_at_start from public.game_players where handle_at_start is not null order by game_id')).rows;
  expect(erased[solo]).toBeUndefined();
  const shared = await handles();
  expect(shared).toEqual([{ game_id: a, seat: 1, handle_at_start: 'erased-handle' }]);
  const result = (await run(restoreSql)) as unknown as pg.QueryResult[];
  expect(result.at(-1)!.rows[0]).toMatchObject({ backup_games: '3', restored_games: '1', newer_games_kept: '0', erased_games_left_out: '1', ended_games_kept: '1' });
  const after = await games();
  expect(after[solo]).toBeUndefined();
  for (const table of ['game_players', 'game_commands', 'game_invites']) expect((await pool.query(`select count(*)::int as n from public.${table} where game_id=$1`, [solo])).rows[0].n).toBe(0);
  // The shared game stays as the deletion left it (the next test), with the deleted seat null and the handle that delete_account kept.
  expect(after[a]).toEqual(erased[a]);
  expect(await handles()).toEqual(shared);
  await run(restoreSql);
  expect(await games()).toEqual(after);
 });

 it('keeps the live end of each shared game that the deletion job ended, not a backup game in play with a seat that nobody can play', async () => {
  // users[1] plays Black in friend game a; w is a friend game that users[1] made and that nobody joined.
  const w = randomUUID();
  await game(w, 0, [users[1], null]);
  await pool.query("update public.games set status='waiting' where id=$1", [w]);
  await run(backupSql);
  // runDeletions resigns a (users[0] wins) and aborts w, then delete_account erases the account.
  await end(a, 1, 'resignation');
  await end(w, 0, 'abort');
  await pool.query("insert into public.account_deletions(user_id,requested_at,run_after) values($1,now()-interval '8 days',now()-interval '1 day')", [users[1]]);
  expect((await pool.query('select kingdown_jobs.delete_account($1) as done', [users[1]])).rows[0].done).toBe(true);
  const live = await games();
  const result = (await run(restoreSql)) as unknown as pg.QueryResult[];
  // A backup copy would put a in play again, and the sweep could then end it on time against users[0].
  expect(await outcome(a)).toEqual({ status: 'finished', result: 'white', end_reason: 'resignation' });
  expect(await outcome(w)).toEqual({ status: 'aborted', result: null, end_reason: 'abort' });
  expect(await games()).toEqual(live);
  // The rated game keeps its live rating row: users[0]'s, as delete_account deleted users[1]'s. The restore does not refuse it.
  expect((await pool.query('select user_id from public.rating_history where game_id=$1', [a])).rows).toEqual([{ user_id: users[0] }]);
  expect(result.at(-1)!.rows[0]).toMatchObject({ backup_games: '3', restored_games: '1', erased_games_left_out: '0', ended_games_kept: '2' });
  await run(restoreSql);
  expect(await games()).toEqual(live);
 });

 it('refuses a backup whose games and commands disagree, and rating rows that changed, and changes nothing', async () => {
  await run(backupSql);
  await move(pool, a);
  const live = await games();
  await pool.query(`delete from ${B}.game_commands where game_id=$1 and seq=2`, [a]);
  await expect(run(restoreSql)).rejects.toThrow('backup refused: 1 game(s) disagree with their command rows');
  expect(await games()).toEqual(live);
  await pool.query(`drop schema ${B} cascade`);
  await run(backupSql);
  await pool.query('insert into public.rating_history(game_id,user_id,rating_before,rd_before,volatility_before,rating,rd,volatility,created_at) values($1,$2,1500,350,0.06,1510,300,0.06,now())', [a, users[0]]);
  await expect(run(restoreSql)).rejects.toThrow('restore refused: 1 rating row(s) of backup games changed since the backup');
  expect(await games()).toEqual(live);
 });

 it('refuses a backup game without both seats, as a plain-begin copy can make for a game that starts mid-copy, and changes nothing', async () => {
  await run(backupSql);
  // A revision-0 game in the games copy but not in the earlier game_players copy: no commands, so the command check passes.
  const d = randomUUID();
  await pool.query(`insert into ${B}.games select (jsonb_populate_record(g, '{"revision":0,"turn":0,"status":"waiting"}'::jsonb || jsonb_build_object('id', $2::uuid))).* from ${B}.games g where id=$1`, [a, d]);
  await pool.query(`delete from ${B}.game_players where game_id=$1 and seat=1`, [b]);
  const live = await games();
  await expect(run(restoreSql)).rejects.toThrow('backup refused: 2 game(s) lack seat 0 or seat 1');
  expect(await games()).toEqual(live);
 });

 it('refuses a backup child row whose game is not in the backup, so a newer game keeps its rows', async () => {
  await run(backupSql);
  await game(c, 1, [users[1], users[0]]);
  // A backup invite that points at newer game c: without the check, its foreign key passes and c gets a second invite.
  await pool.query(`insert into ${B}.game_invites select (jsonb_populate_record(i, jsonb_build_object('token_hash', $2::text, 'code_hash', $3::text, 'game_id', $4::uuid))).* from ${B}.game_invites i where game_id=$1`, [a, randomUUID(), randomUUID(), c]);
  const live = await games();
  await expect(run(restoreSql)).rejects.toThrow('backup refused: 1 row(s) of game_invites have no backup game');
  expect(await games()).toEqual(live);
 });
});
