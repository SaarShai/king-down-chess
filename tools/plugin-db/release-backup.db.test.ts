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
  await pool.query(`drop schema if exists ${B} cascade; truncate public.games cascade; delete from auth.users`);
  await pool.query('insert into auth.users(id) select unnest($1::uuid[])', [users]);
  await game(a, 2, [users[0], users[1]]);
  await game(b, 1, [users[2], null]);
 });

 /** A friend game at `revision` with commands 1..revision, two seats and one invite. */
 async function game(id: string, revision: number, seats: (string | null)[]) {
  await pool.query(`insert into public.games(id,kind,speed,category,colour_rule,setup,rules,engine_fingerprint,status,turn,revision,state,snapshot,created_by)
   values($1,'friend','daily','standard','white','{}','{}','sha256:${'0'.repeat(64)}','playing',$2,$3,'{}','{}',$4)`, [id, revision % 2, revision, seats[0]]);
  for (const [seat, user] of seats.entries()) await pool.query(`insert into public.game_players(game_id,seat,user_id,action) values($1,$2,$3,'waiting')`, [id, seat, user]);
  for (let seq = 1; seq <= revision; seq++) await command(pool, id, seq, seats[(seq - 1) % 2]);
  await pool.query(`insert into public.game_invites(token_hash,code_hash,game_id,seat,created_by,expires_at) values($1,$2,$3,1,$4,now()+interval '1 day')`, [randomUUID(), randomUUID(), id, seats[0]]);
 }
 const command = (client: pg.Pool | pg.PoolClient, id: string, seq: number, actor: string | null) => client.query(`insert into public.game_commands(game_id,seq,seat,actor_id,command_id,kind,payload,turn_after,status_after,received_at)
  values($1,$2,$3,$4,$5,'move','{}',$6,'playing',now())`, [id, seq, (seq - 1) % 2, actor, randomUUID(), seq % 2]);
 /** One move of game `id`, as the game service writes it. */
 async function move(client: pg.Pool | pg.PoolClient, id: string) {
  const { rows: [{ revision }] } = await client.query('update public.games set revision=revision+1, turn=1-turn, updated_at=now() where id=$1 returning revision', [id]);
  await command(client, id, revision, null);
  await client.query("update public.game_players set action='done', turns_played=turns_played+1 where game_id=$1 and seat=$2", [id, (revision - 1) % 2]);
 }
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

 it('nulls the seat of an account deleted since the backup and drops the invite that it made', async () => {
  await run(backupSql);
  await pool.query('delete from auth.users where id=$1', [users[2]]);
  await run(restoreSql);
  expect((await games())[b]).toMatchObject({ revision: 1, seqs: [1], seats: ['-:waiting', '-:waiting'], invites: 0 });
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
