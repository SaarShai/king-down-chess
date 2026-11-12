/**
 * Opt-in database tests of the Muse disconnect (migration 0024): which games are Muse games, the Settings button path,
 * the daily sweep at 29 and 31 days, and a reconnect. PLUGIN_TEST_DATABASE_URL must name a disposable loopback database;
 * the tests use their own copy of it (the name with "_muse" before "_test"), because the sweep acts on every account.
 * The auth.sessions rows stand in for Supabase: revokeGrant deletes the sessions of the client, as the sweep sees them.
 */
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { GameService } from '../match/service';
import { PostgresMatchStore } from '../match/store';
import { ownTestDatabase } from '../../tools/plugin-db/own-test-db';

const url = process.env.PLUGIN_TEST_DATABASE_URL, DAY = 86_400_000;
const suite = url ? describe : describe.skip;
const MUSE_CLIENT = randomUUID(), CHATGPT_CLIENT = randomUUID();

suite('Muse disconnect (real PostgreSQL)', () => {
 let admin: pg.Pool, games: GameService;
 const users: string[] = [];
 const rows = async (sql: string, params: unknown[] = []) => (await admin.query(sql, params)).rows;
 const exists = async (gameId: string) => (await rows('select 1 from public.games where id=$1', [gameId])).length === 1;
 async function user() {
  const id = randomUUID(); users.push(id);
  await admin.query('insert into auth.users(id,email) values($1,$2)', [id, `${id}@example.com`]);
  return id;
 }
 /** A game against the computer, started on the website (no surface) or in Muse. */
 const solo = async (actor: string, surface?: 'muse') => (await games.create(actor, { kind: 'solo' }, surface ? `muse:${randomUUID()}` : randomUUID(), surface ?? null)).game_id;
 /** A Supabase session: of the Muse client, of another client, or of the website (no client). `refreshed` is days ago. */
 async function session(actor: string, client: string | null, createdDaysAgo: number, refreshedDaysAgo: number | null = null) {
  const now = Date.now();
  await admin.query(`insert into auth.sessions(user_id,oauth_client_id,created_at,refreshed_at) values($1,$2,$3,($4::timestamptz at time zone 'UTC'))`,
   [actor, client, new Date(now - createdDaysAgo * DAY), refreshedDaysAgo === null ? null : new Date(now - refreshedDaysAgo * DAY)]);
 }
 /** revokeGrant at Supabase: the consent is revoked and the sessions of that client end. */
 const revoke = (actor: string, client: string) => admin.query('delete from auth.sessions where user_id=$1 and oauth_client_id=$2', [actor, client]);
 /** The Settings button: public.delete_my_muse_games() as the signed-in user (role authenticated). */
 async function button(actor: string | null): Promise<number | null> {
  const client = await admin.connect();
  try {
   await client.query('begin');
   await client.query("select set_config('request.jwt.claim.sub',$1,true)", [actor ?? '']);
   await client.query('set local role authenticated');
   const done = (await client.query('select public.delete_my_muse_games() as n')).rows[0].n;
   await client.query('commit');
   return done;
  } catch (error) { await client.query('rollback'); throw error; } finally { client.release(); }
 }
 const sweep = async () => (await rows('select kingdown_jobs.sweep_muse_games() as n'))[0].n as number;

 beforeAll(async () => {
  admin = new pg.Pool({ connectionString: (await ownTestDatabase('muse')).href, max: 2 });
  games = new GameService(new PostgresMatchStore(admin));
 }, 60_000);
 beforeEach(async () => {
  await admin.query('delete from kingdown_oauth.client_resources');
  await admin.query("insert into kingdown_oauth.client_resources(client_id,resource) values($1,'https://kingdown.test/muse/mcp'),($2,'https://kingdown.test/mcp')", [MUSE_CLIENT, CHATGPT_CLIENT]);
 });
 afterAll(async () => {
  if (!admin) return;
  await admin.query('delete from public.games g where exists(select from public.game_players p where p.game_id=g.id and p.user_id=any($1))', [users]);
  await admin.query('delete from auth.users where id=any($1)', [users]);
  await admin.query('delete from kingdown_oauth.client_resources');
  await admin.end();
 });

 it('a Muse game is one that started in Muse: a website game moved in Muse stays, and so do the games of others', async () => {
  const me = await user(), other = await user();
  const museGame = await solo(me, 'muse'), webGame = await solo(me), othersMuseGame = await solo(other, 'muse');
  // A move through Muse in the website game.
  const view = await games.view(me, webGame);
  await games.command(me, webGame, { command_id: randomUUID(), expected_revision: view.revision, action: { type: 'turn', actions: [view.legal[0]] } }, 'muse');
  expect(await rows("select surface from public.game_commands where game_id=$1 and kind='start'", [museGame])).toEqual([{ surface: 'muse' }]);
  expect(await rows("select count(*)::int as n from public.game_commands where game_id=$1 and surface='muse'", [webGame])).toEqual([{ n: 1 }]);
  expect((await rows("select kingdown_jobs.delete_muse_games($1,'-infinity') as n", [me]))[0].n).toBe(1);
  expect([await exists(museGame), await exists(webGame), await exists(othersMuseGame)]).toEqual([false, true, true]);
  expect(await rows('select 1 from public.game_commands where game_id=$1', [museGame])).toEqual([]);
 });

 it('marks a Muse start from before 0024 by its start command ID when the migration runs again', async () => {
  const me = await user(), game = await solo(me, 'muse');
  await admin.query("update public.game_commands set surface=null where game_id=$1 and kind='start'", [game]);
  const { readFile } = await import('node:fs/promises');
  const sql = await readFile(new URL('../../supabase/migrations/0024_muse_disconnect.sql', import.meta.url), 'utf8');
  await admin.query(sql);
  expect(await rows("select surface from public.game_commands where game_id=$1 and kind='start'", [game])).toEqual([{ surface: 'muse' }]);
 });

 it('the button deletes the Muse games after the revoke, keeps them while Muse is connected, and is safe to repeat', async () => {
  const me = await user(), game = await solo(me, 'muse');
  await session(me, MUSE_CLIENT, 2, 0);
  await session(me, null, 0); // the website session of the button itself
  // The revoke did not happen (or failed): the Muse session keeps the games.
  expect(await button(me)).toBeNull();
  expect(await exists(game)).toBe(true);
  await revoke(me, MUSE_CLIENT);
  expect(await button(me)).toBe(1);
  expect(await exists(game)).toBe(false);
  expect(await button(me)).toBe(0);
  // No user, no deletion; anon may not call it.
  expect(await button(null)).toBeNull();
  const client = await admin.connect();
  try {
   await client.query('begin'); await client.query('set local role anon');
   await expect(client.query('select public.delete_my_muse_games()')).rejects.toThrow(/permission denied/);
  } finally { await client.query('rollback'); client.release(); }
 });

 it('gives a signed-in user the Muse client IDs for revokeGrant, and nothing else', async () => {
  const me = await user(), client = await admin.connect();
  try {
   await client.query('begin');
   await client.query("select set_config('request.jwt.claim.sub',$1,true)", [me]);
   await client.query('set local role authenticated');
   expect((await client.query('select public.muse_client_ids() as id')).rows).toEqual([{ id: MUSE_CLIENT }]);
   await expect(client.query('select kingdown_jobs.sweep_muse_games()')).rejects.toThrow(/permission denied/);
  } finally { await client.query('rollback'); client.release(); }
 });

 it('the sweep keeps a link used 29 days ago and deletes after 31 days, with no Muse session, and on a revoke the button missed', async () => {
  const recent = await user(), old = await user(), never = await user(), revoked = await user(), otherClient = await user(), created = await user();
  const games29 = await solo(recent, 'muse'), games31 = await solo(old, 'muse'), gamesNone = await solo(never, 'muse'), gamesRevoked = await solo(revoked, 'muse');
  const gamesOther = await solo(otherClient, 'muse'), gamesCreated = await solo(created, 'muse'), web31 = await solo(old);
  await session(recent, MUSE_CLIENT, 60, 29);
  await session(old, MUSE_CLIENT, 60, 31);
  await session(old, null, 0); // a website sign-in today does not keep the Muse games
  await session(revoked, MUSE_CLIENT, 10, 1); await revoke(revoked, MUSE_CLIENT);
  await session(otherClient, CHATGPT_CLIENT, 1, 0); // a ChatGPT link is no Muse link
  await session(created, MUSE_CLIENT, 29); // never refreshed: the start of the session counts
  expect(await sweep()).toBeGreaterThanOrEqual(4);
  expect(Object.fromEntries(await Promise.all(Object.entries({ games29, games31, gamesNone, gamesRevoked, gamesOther, gamesCreated, web31 }).map(async ([name, id]) => [name, await exists(id)]))))
   .toEqual({ games29: true, games31: false, gamesNone: false, gamesRevoked: false, gamesOther: false, gamesCreated: true, web31: true });
  expect(await sweep()).toBe(0);
 });

 it('the sweep deletes nothing while no Muse client is registered', async () => {
  const me = await user(), game = await solo(me, 'muse');
  await admin.query("delete from kingdown_oauth.client_resources where resource like '%/muse/mcp'");
  expect(await sweep()).toBe(0);
  expect(await exists(game)).toBe(true);
 });

 it('a reconnect after a disconnect makes a new link: its new games stay until the next disconnect', async () => {
  const me = await user(), first = await solo(me, 'muse');
  await session(me, MUSE_CLIENT, 5, 0);
  await revoke(me, MUSE_CLIENT);
  expect(await button(me)).toBe(1);
  // Connect again: Supabase makes a new session (and un-revokes the consent).
  await session(me, MUSE_CLIENT, 0);
  const second = await solo(me, 'muse');
  await sweep();
  expect(await button(me)).toBeNull();
  expect([await exists(first), await exists(second)]).toEqual([false, true]);
  await revoke(me, MUSE_CLIENT);
  expect(await button(me)).toBe(1);
  expect(await exists(second)).toBe(false);
 });
});
