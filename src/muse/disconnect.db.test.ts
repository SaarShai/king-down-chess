/**
 * Opt-in database tests of the Muse disconnect (migration 0024): which games are Muse games, the Settings button path,
 * the daily sweep at 29 and 31 days, its guard and its per-user transactions, and a reconnect. PLUGIN_TEST_DATABASE_URL
 * must name a disposable loopback database; the tests use their own copy of it (the name with "_muse" before "_test"),
 * because the sweep acts on every account.
 * The auth.sessions rows stand in for Supabase: revokeGrant deletes the sessions of the client, as the sweep sees them.
 */
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_OPTIONS } from '../match/setup';
import { GameService } from '../match/service';
import { PostgresMatchStore } from '../match/store';
import { ownTestDatabase } from '../../tools/plugin-db/own-test-db';

const url = process.env.PLUGIN_TEST_DATABASE_URL, DAY = 86_400_000;
const suite = url ? describe : describe.skip;
const MUSE_CLIENT = randomUUID(), CHATGPT_CLIENT = randomUUID();
const CLASSIC_OPTIONS = { ...DEFAULT_OPTIONS, fairy: false, arrangement: false, classic: true };

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
 const solo = async (actor: string, surface?: 'muse', commandId = surface ? `muse:${randomUUID()}` : randomUUID()) =>
  (await games.create(actor, { kind: 'solo' }, commandId, surface ?? null)).game_id;
 /** One move of the player, through Muse or the website. */
 async function move(actor: string, gameId: string, surface: 'muse' | 'web') {
  const view = await games.view(actor, gameId);
  await games.command(actor, gameId, { command_id: randomUUID(), expected_revision: view.revision, action: { type: 'turn', actions: [view.legal[0]] } }, surface);
 }
 /** A Supabase session: of the Muse client, of another client, or of the website (no client). `refreshed` is days ago. */
 async function session(actor: string, client: string | null, createdDaysAgo: number, refreshedDaysAgo: number | null = null) {
  const now = Date.now();
  await admin.query(`insert into auth.sessions(user_id,oauth_client_id,created_at,refreshed_at) values($1,$2,$3,($4::timestamptz at time zone 'UTC'))`,
   [actor, client, new Date(now - createdDaysAgo * DAY), refreshedDaysAgo === null ? null : new Date(now - refreshedDaysAgo * DAY)]);
 }
 /** revokeGrant at Supabase: the consent is revoked and the sessions of that client end. */
 const revoke = (actor: string, client: string) => admin.query('delete from auth.sessions where user_id=$1 and oauth_client_id=$2', [actor, client]);
 /** Runs one statement as a signed-in user (role authenticated) and gives its rows; null signs in no one. */
 async function asUser(actor: string | null, sql: string, params: unknown[] = []) {
  const client = await admin.connect();
  try {
   await client.query('begin');
   await client.query("select set_config('request.jwt.claim.sub',$1,true)", [actor ?? '']);
   await client.query('set local role authenticated');
   const result = (await client.query(sql, params)).rows;
   await client.query('commit');
   return result;
  } catch (error) { await client.query('rollback'); throw error; } finally { client.release(); }
 }
 /** The Settings button: public.delete_my_muse_games(). */
 const button = async (actor: string | null): Promise<number | null> => (await asUser(actor, 'select public.delete_my_muse_games() as n'))[0].n;
 /** Moves every command 2 days back, out of the 24-hour window of the guard. */
 const age = () => admin.query("update public.game_commands set received_at=received_at-interval '2 days'");
 /** The daily sweep, as pg_cron calls it (or by hand with force): the number deleted, or -1 when a guard stopped it. */
 async function sweep({ aged = true, force = false } = {}): Promise<number> {
  if (aged) await age();
  return (await rows(`call kingdown_jobs.sweep_muse_games(force => ${force})`))[0].deleted;
 }

 beforeAll(async () => {
  admin = new pg.Pool({ connectionString: (await ownTestDatabase('muse')).href, max: 3 });
  games = new GameService(new PostgresMatchStore(admin));
  // Sessions of OAuth clients from a run that stopped early would stop the sweep (its unknown-client guard).
  await admin.query('delete from auth.sessions where oauth_client_id is not null');
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
  await move(me, webGame, 'muse');
  expect(await rows("select surface from public.game_commands where game_id=$1 and kind='start'", [museGame])).toEqual([{ surface: 'muse' }]);
  expect(await rows("select count(*)::int as n from public.game_commands where game_id=$1 and surface='muse'", [webGame])).toEqual([{ n: 1 }]);
  expect((await rows("select kingdown_jobs.delete_muse_games($1,'-infinity') as n", [me]))[0].n).toBe(1);
  expect([await exists(museGame), await exists(webGame), await exists(othersMuseGame)]).toEqual([false, true, true]);
  expect(await rows('select 1 from public.game_commands where game_id=$1', [museGame])).toEqual([]);
 });

 it('keeps a game against a person, also with a Muse start receipt', async () => {
  const me = await user();
  await admin.query('update public.profiles set handle=$2 where id=$1', [me, `muse${me.slice(0, 8)}`]);
  const friend = (await games.create(me, { kind: 'friend', options: CLASSIC_OPTIONS, colour: 'white' }, `muse:${randomUUID()}`, 'muse')).game_id;
  expect(await rows("select surface from public.game_commands where game_id=$1 and kind='start'", [friend])).toEqual([{ surface: 'muse' }]);
  expect((await rows("select kingdown_jobs.delete_muse_games($1,'-infinity') as n", [me]))[0].n).toBe(0);
  expect(await exists(friend)).toBe(true);
 });

 it('marks an older Muse start when the migration runs again, but not a website start with a muse: command ID', async () => {
  const me = await user(), museGame = await solo(me, 'muse'), crafted = await solo(me, undefined, `muse:${randomUUID()}`);
  await move(me, museGame, 'muse');
  await move(me, crafted, 'web');
  await admin.query("update public.game_commands set surface=null where game_id=$1 and kind='start'", [museGame]);
  await admin.query(await readFile(new URL('../../supabase/migrations/0024_muse_disconnect.sql', import.meta.url), 'utf8'));
  expect(await rows("select surface from public.game_commands where game_id=$1 and kind='start'", [museGame])).toEqual([{ surface: 'muse' }]);
  expect(await rows("select surface from public.game_commands where game_id=$1 and kind='start'", [crafted])).toEqual([{ surface: null }]);
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

 it('the button deletes nothing while no Muse client is registered', async () => {
  const me = await user(), game = await solo(me, 'muse');
  await admin.query("delete from kingdown_oauth.client_resources where resource like '%/muse/mcp'");
  expect(await button(me)).toBeNull();
  expect(await exists(game)).toBe(true);
 });

 it('gives a signed-in user the Muse client IDs, and no job function', async () => {
  const me = await user(), other = await user(), game = await solo(other, 'muse');
  expect(await asUser(me, 'select public.muse_client_ids() as id')).toEqual([{ id: MUSE_CLIENT }]);
  await expect(asUser(me, "select kingdown_jobs.delete_muse_games($1,'-infinity')", [other])).rejects.toThrow(/permission denied/);
  await expect(asUser(me, 'call kingdown_jobs.sweep_muse_games()')).rejects.toThrow(/permission denied/);
  expect(await exists(game)).toBe(true);
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

 it('the guard stops the sweep when a Muse game had a Muse move in 24 hours but its player has no Muse session', async () => {
  // A broken session match: Muse plays, but no session carries the Muse client ID.
  const me = await user(), other = await user(), mine = await solo(me, 'muse'), others = await solo(other, 'muse');
  await age();
  await move(me, mine, 'muse');
  await session(me, CHATGPT_CLIENT, 0);
  expect(await sweep({ aged: false })).toBe(-1);
  expect([await exists(mine), await exists(others)]).toEqual([true, true]);
  // With a Muse session the match works again, and the sweep runs.
  await session(me, MUSE_CLIENT, 0);
  expect(await sweep({ aged: false })).toBeGreaterThanOrEqual(1);
  expect([await exists(mine), await exists(others)]).toEqual([true, false]);
 });

 it('the guard stops the sweep while a session has an OAuth client that the client table does not list', async () => {
  // For example, the Muse row was added again with a wrong client ID: the real Muse sessions then look unknown.
  const me = await user(), unknown = await user(), game = await solo(me, 'muse');
  await session(unknown, randomUUID(), 3, 1);
  expect(await sweep()).toBe(-1);
  expect(await exists(game)).toBe(true);
  await admin.query('delete from auth.sessions where user_id=$1', [unknown]);
  expect(await sweep()).toBeGreaterThanOrEqual(1);
  expect(await exists(game)).toBe(false);
 });

 it('the cap stops a sweep that would delete for more than 20 users (or 10 percent), until the owner forces it', async () => {
  const many = await Promise.all(Array.from({ length: 22 }, async () => solo(await user(), 'muse')));
  expect(await sweep()).toBe(-1);
  for (const game of many) expect(await exists(game)).toBe(true);
  expect(await sweep({ force: true })).toBeGreaterThanOrEqual(22);
  for (const game of many) expect(await exists(game)).toBe(false);
 }, 30_000);

 it('one account that fails (a lock held too long) does not stop the sweep for the others', async () => {
  const stuck = await user(), free = await user(), stuckGame = await solo(stuck, 'muse'), freeGame = await solo(free, 'muse');
  const holder = await admin.connect();
  try {
   await holder.query('begin');
   await holder.query('select pg_advisory_xact_lock(hashtextextended($1,0))', [`account:${stuck}`]);
   expect(await sweep()).toBeGreaterThanOrEqual(1);
  } finally { await holder.query('rollback'); holder.release(); }
  expect([await exists(stuckGame), await exists(freeGame)]).toEqual([true, false]);
  // The next run deletes the game of the account that failed.
  expect(await sweep()).toBe(1);
  expect(await exists(stuckGame)).toBe(false);
 }, 30_000);

 it('a reconnect after a disconnect makes a new link: its new games stay until the next disconnect', async () => {
  const me = await user(), first = await solo(me, 'muse');
  await session(me, MUSE_CLIENT, 5, 0);
  await revoke(me, MUSE_CLIENT);
  expect(await button(me)).toBe(1);
  // Connect again: Supabase makes a new session (and un-revokes the consent).
  await session(me, MUSE_CLIENT, 0);
  const second = await solo(me, 'muse');
  expect(await sweep()).toBeGreaterThanOrEqual(0);
  expect(await button(me)).toBeNull();
  expect([await exists(first), await exists(second)]).toEqual([false, true]);
  await revoke(me, MUSE_CLIENT);
  expect(await button(me)).toBe(1);
  expect(await exists(second)).toBe(false);
 });
});
