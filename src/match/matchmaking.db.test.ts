/** Ticket 07: matchmaking on a separate disposable database with the runtime role. */
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { GameService } from './service';
import { PostgresMatchStore } from './store';
import { DEFAULT_OPTIONS } from './setup';
import { PluginService } from '../plugin/service';
import { AccountService } from '../online/accounts';
import { ownTestDatabase } from '../../tools/plugin-db/own-test-db';
import { withRoleLock } from '../../tools/plugin-db/role-lock.mjs';

const suite = process.env.PLUGIN_TEST_DATABASE_URL ? describe : describe.skip;
suite('matchmaking through PostgreSQL', () => {
 let admin: pg.Pool, runtime: pg.Pool, service: GameService, plugin: PluginService, own: URL, login: URL, role: string;
 const users: string[] = [], handles: string[] = [];
 beforeAll(async () => {
  own = await ownTestDatabase('match');
  admin = new pg.Pool({ connectionString: own.href, max: 2 });
  role = `match_${randomUUID().replaceAll('-', '')}`;
  const password = randomUUID(), grants = await readFile(new URL('../../plugin-deploy/runtime-role.sql', import.meta.url), 'utf8');
  await withRoleLock(own.href, () => admin.query(`${grants.replaceAll('kingdown_plugin_runtime', role)}; alter role ${role} password '${password}'`));
  login = new URL(own.href); login.username = role; login.password = password;
  runtime = new pg.Pool({ connectionString: login.href, max: 2 });
  const store = new PostgresMatchStore(runtime); service = new GameService(store); plugin = new PluginService(store);
  for (let n = 0; n < 22; n++) {
   const id = randomUUID(), handle = `match-${id.slice(0, 8)}`; users.push(id); handles.push(handle);
   await admin.query('insert into auth.users(id) values($1)', [id]);
   await admin.query("update public.profiles set handle=$2,icon='flame' where id=$1", [id, handle]);
  }
 }, 120_000);
 afterEach(async () => {
  if (!admin) return;
  await admin.query('delete from public.games where created_by=any($1)', [users]);
  await admin.query('delete from public.relations where user_id=any($1) or other_id=any($1)', [users]);
 });
 afterAll(async () => {
  if (!admin) return;
  await admin.query('delete from auth.users where id=any($1)', [users]);
  await runtime?.end();
  await withRoleLock(own.href, () => admin.query(`drop owned by ${role}; drop role ${role}`));
  await admin.end();
 });
 it('lists other open random games oldest first with their features, handle and picture', async () => {
  const old = await service.create(users[1], { kind: 'random', options: DEFAULT_OPTIONS, colour: 'black' });
  const options = { ...DEFAULT_OPTIONS, kingPowers: true };
  const next = await service.create(users[2], { kind: 'random', options });
  await service.create(users[0], { kind: 'random', options: DEFAULT_OPTIONS });
  await service.create(users[3], { kind: 'friend', options: DEFAULT_OPTIONS });
  await service.create(users[4], { kind: 'solo', options: DEFAULT_OPTIONS });
  const lobby = await plugin.lobby(users[0]);
  expect(lobby.games).toEqual([
   { game_id: old.game_id, options: DEFAULT_OPTIONS, colour: 'white', creator: { handle: handles[1], icon: 'flame' }, created_at: expect.any(String) },
   { game_id: next.game_id, options, colour: 'black', creator: { handle: handles[2], icon: 'flame' }, created_at: expect.any(String) },
  ]);
  expect(JSON.stringify(lobby)).not.toContain(users[1]);
 });
 it('hides and refuses open games across a block in either direction', async () => {
  const one = await service.create(users[1], { kind: 'random', options: DEFAULT_OPTIONS });
  const two = await service.create(users[2], { kind: 'random', options: DEFAULT_OPTIONS });
  const allowed = await service.create(users[3], { kind: 'random', options: DEFAULT_OPTIONS });
  await admin.query("insert into public.relations(user_id,other_id,kind) values($1,$2,'block'),($3,$1,'block')", [users[0], users[1], users[2]]);
  expect((await plugin.lobby(users[0])).games.map(g => g.game_id)).toEqual([allowed.game_id]);
  for (const game of [one, two]) {
   await expect(plugin.accept(users[0], game.game_id)).rejects.toMatchObject({ code: 'FORBIDDEN' });
   expect(await service.view(users[game === one ? 1 : 2], game.game_id)).toMatchObject({ status: 'waiting', revision: 0, opponent: null });
  }
 });
 it('creates on an empty lobby and finds the oldest eligible game with its creator’s features', async () => {
  const options = { ...DEFAULT_OPTIONS, kingPowers: true };
  const created = await plugin.find(users[0], options, 'black');
  expect(created).toMatchObject({ status: 'waiting', kind: 'random', seat: 1, revision: 0, options });
  const newer = await service.create(users[2], { kind: 'random', options: DEFAULT_OPTIONS });
  const blocked = await service.create(users[3], { kind: 'random', options: DEFAULT_OPTIONS });
  await admin.query("update public.games set created_at=now()-interval '1 hour' where id=$1", [blocked.game_id]);
  await admin.query("insert into public.relations(user_id,other_id,kind) values($1,$2,'block')", [users[1], users[3]]);
  // Any rules: the oldest game, whatever its switches.
  const found = await plugin.find(users[1], DEFAULT_OPTIONS, 'white', undefined, true);
  expect(found).toMatchObject({ game_id: created.game_id, status: 'setup', seat: 0, revision: 1, options });
  expect((await plugin.lobby(users[1])).games.map(g => g.game_id)).toEqual([newer.game_id]);
  await expect(plugin.find(users[4], { ...DEFAULT_OPTIONS, pool: [] }, 'white')).rejects.toMatchObject({ code: 'INVALID_INPUT' });
 });
 it('takes an open game with the same five switches, else opens a table; any rules takes the oldest (D1 a)', async () => {
  const powers = await service.create(users[0], { kind: 'random', options: { ...DEFAULT_OPTIONS, kingPowers: true } });
  const fewer = { ...DEFAULT_OPTIONS, pool: ['Q', 'R', 'B', 'N'] }, plain = await service.create(users[2], { kind: 'random', options: fewer });
  // The same switches with another piece pool: the newer game. The older powers game stays open.
  expect(await plugin.find(users[1], DEFAULT_OPTIONS, 'black')).toMatchObject({ game_id: plain.game_id, seat: 1, options: fewer });
  // No open game with Cards on: a new table, where the asked colour applies.
  const cards = { ...DEFAULT_OPTIONS, cards: true }, own = await plugin.find(users[3], cards, 'black');
  expect(own).toMatchObject({ status: 'waiting', seat: 1, options: cards });
  expect(await plugin.find(users[4], DEFAULT_OPTIONS, 'white', undefined, true)).toMatchObject({ game_id: powers.game_id, seat: 1 });
  // Your own open game comes back only for the same switches, or with any rules.
  expect((await plugin.find(users[3], cards, 'black')).game_id).toBe(own.game_id);
  const second = await plugin.find(users[3], DEFAULT_OPTIONS);
  expect(second).toMatchObject({ status: 'waiting', options: DEFAULT_OPTIONS }); expect(second.game_id).not.toBe(own.game_id);
  expect((await plugin.find(users[3], DEFAULT_OPTIONS, 'white', undefined, true)).game_id).toBe(own.game_id);
 });
 it('gives a resent Find from before start receipts its first game: the old join row, and the old table after another player took the seat', async () => {
  // Before start receipts, a Find's join row kept {} as its payload.
  const table = await service.create(users[0], { kind: 'random', options: DEFAULT_OPTIONS });
  const joined = await plugin.find(users[1], DEFAULT_OPTIONS, 'white', 'old-join');
  expect(joined.game_id).toBe(table.game_id);
  await admin.query("update public.game_commands set payload='{}' where game_id=$1 and kind='join'", [table.game_id]);
  expect(await plugin.find(users[1], DEFAULT_OPTIONS, 'white', 'old-join')).toMatchObject({ game_id: table.game_id, seat: joined.seat });
  // Before start receipts, a Find that opened a table wrote no row; the table has the derived ID. Another player takes the seat, and a third opens a table with the same switches.
  const made = await plugin.find(users[2], DEFAULT_OPTIONS, 'white', 'old-table');
  expect(made.status).toBe('waiting');
  await admin.query("delete from public.game_commands where game_id=$1 and kind='start'", [made.game_id]);
  expect((await plugin.find(users[3], DEFAULT_OPTIONS)).game_id).toBe(made.game_id);
  const other = await service.create(users[4], { kind: 'random', options: DEFAULT_OPTIONS });
  expect(await plugin.find(users[2], DEFAULT_OPTIONS, 'white', 'old-table')).toMatchObject({ game_id: made.game_id, status: 'setup' });
  expect((await admin.query('select game_id from public.game_players where user_id=$1', [users[2]])).rows).toEqual([{ game_id: made.game_id }]);
  expect(await service.view(users[4], other.game_id)).toMatchObject({ status: 'waiting', opponent: null });
 });
 it('caps the start receipts on your own open game, so its play keeps its revisions', async () => {
  const table = await plugin.find(users[0], DEFAULT_OPTIONS, 'white', 'cap-0');
  for (let n = 1; n < 20; n++) await plugin.find(users[0], DEFAULT_OPTIONS, 'white', `cap-${n}`);
  await expect(plugin.find(users[0], DEFAULT_OPTIONS, 'white', 'cap-20')).rejects.toMatchObject({ code: 'RATE_LIMITED', status: 429 });
  // A sent command ID still gets its game, and a Find with no command ID still shows it.
  expect(await plugin.find(users[0], DEFAULT_OPTIONS, 'white', 'cap-19')).toMatchObject({ game_id: table.game_id, revision: 20 });
  expect(await plugin.find(users[0], DEFAULT_OPTIONS)).toMatchObject({ game_id: table.game_id, revision: 20 });
  expect(await plugin.find(users[1], DEFAULT_OPTIONS)).toMatchObject({ game_id: table.game_id, status: 'setup', revision: 21 });
 });
 it('gives a resent Create the move history of the first reply', async () => {
  const first = await service.create(users[0], { kind: 'solo' }, 'history');
  expect(first.history?.initial_fen).toEqual(expect.any(String));
  expect(await service.create(users[0], { kind: 'solo' }, 'history')).toMatchObject({ game_id: first.game_id, revision: first.revision, history: first.history });
 });
 it('gives one start to one command ID when a Create and a Find with that ID run at once', async () => {
  const table = await service.create(users[0], { kind: 'random', options: DEFAULT_OPTIONS });
  const insert = service.store.insert.bind(service.store);
  let reached!: () => void, open!: () => void, ended = false;
  const atInsert = new Promise<void>(resolve => { reached = resolve; }), gate = new Promise<void>(resolve => { open = resolve; });
  const held = vi.spyOn(service.store, 'insert').mockImplementation(async (game, client) => { reached(); await gate; return insert(game, client); });
  try {
   // The Create stops before its insert. The Find then waits for the start lock; before the fix, it took the open table at once.
   const made = service.create(users[1], { kind: 'friend', options: DEFAULT_OPTIONS }, 'both'); void made.catch(() => {});
   await atInsert;
   const found = plugin.find(users[1], DEFAULT_OPTIONS, 'white', 'both'); void found.then(() => { ended = true; }, () => { ended = true; });
   await expect.poll(async () => ended || !!(await admin.query("select 1 from pg_stat_activity where datname=current_database() and wait_event='advisory'")).rowCount).toBe(true);
   open();
   const [create, find] = await Promise.allSettled([made, found]);
   expect(create).toMatchObject({ status: 'fulfilled', value: { kind: 'friend', status: 'waiting' } });
   expect(find).toMatchObject({ status: 'rejected', reason: { code: 'COMMAND_CONFLICT' } });
   expect(await service.view(users[0], table.game_id)).toMatchObject({ status: 'waiting', opponent: null });
  } finally { open(); held.mockRestore(); }
 });
 it('uses the database clock when the server clock is ahead', async () => {
  const open = await service.create(users[0], { kind: 'random', options: DEFAULT_OPTIONS });
  const realLobby = service.store.lobby.bind(service.store);
  let reads = 0;
  const guard = vi.spyOn(service.store, 'lobby').mockImplementation((...args) => {
   if (++reads > 2) throw new Error('Find repeats the same candidate');
   return realLobby(...args);
  });
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(Date.now() + 2 * 86_400_000);
  try { expect(await service.find(users[1], DEFAULT_OPTIONS)).toMatchObject({ game_id: open.game_id, status: 'setup' }); }
  finally { vi.useRealTimers(); guard.mockRestore(); }
 });
 it('pairs two finds on an empty lobby in one game', async () => {
  const clients = await Promise.all([runtime.connect(), runtime.connect()]);
  for (const client of clients) client.release();
  // Hold the first insert long enough for the other client to search the empty lobby.
  await admin.query(`create function public.slow_seek() returns trigger language plpgsql as $$ begin perform pg_sleep(0.1); return new; end $$;
   create trigger slow_seek before insert on public.games for each row execute function public.slow_seek()`);
  try {
   const found = await Promise.all([plugin.find(users[0], DEFAULT_OPTIONS, 'white'), plugin.find(users[1], DEFAULT_OPTIONS, 'black')]);
   expect(new Set(found.map(game => game.game_id)).size).toBe(1);
   expect(found.map(game => game.status).sort()).toEqual(['setup', 'waiting']);
   expect(await service.view(users[0], found[0].game_id)).toMatchObject({ status: 'setup', revision: 1, opponent: { handle: handles[1] } });
  } finally { await admin.query('drop trigger slow_seek on public.games; drop function public.slow_seek()'); }
 });
 it('finds a fresh game after the oldest expires during the search lock wait', async () => {
  const late = await service.create(users[0], { kind: 'random', options: DEFAULT_OPTIONS });
  const fresh = await service.create(users[1], { kind: 'random', options: DEFAULT_OPTIONS });
  await admin.query("update public.games set created_at=now()-interval '1 hour' where id=$1", [late.game_id]);
  const blocker = await admin.connect();
  await blocker.query('begin');
  await blocker.query('select pg_advisory_xact_lock(7007008)');
  const found = plugin.find(users[2], DEFAULT_OPTIONS); void found.catch(() => {});
  try {
   await expect.poll(async () => (await admin.query("select xact_start from pg_stat_activity where datname=current_database() and query='select pg_advisory_xact_lock(7007008)' and wait_event='advisory'")).rows.length).toBe(1);
   await admin.query("update public.games set created_at=(select xact_start from pg_stat_activity where datname=current_database() and wait_event='advisory')-interval '24 hours'+interval '1 millisecond' where id=$1", [late.game_id]);
   await blocker.query('commit');
   await expect(found).resolves.toMatchObject({ game_id: fresh.game_id, status: 'setup' });
   expect(await service.view(users[0], late.game_id)).toMatchObject({ status: 'waiting', revision: 0, opponent: null });
  } finally { await blocker.query('rollback'); blocker.release(); await found.catch(() => {}); }
 });
 it('finds the next open game while the oldest game is locked for acceptance', async () => {
  const oldest = await service.create(users[0], { kind: 'random', options: DEFAULT_OPTIONS });
  const fresh = await service.create(users[1], { kind: 'random', options: DEFAULT_OPTIONS });
  await admin.query("update public.games set created_at=now()-interval '1 hour' where id=$1", [oldest.game_id]);
  const blocker = await admin.connect();
  await blocker.query('begin');
  await blocker.query('select id from public.games where id=$1 for update', [oldest.game_id]);
  let selected: string | undefined;
  const found = plugin.find(users[2], DEFAULT_OPTIONS).then(view => { selected = view.game_id; return view; }); void found.catch(() => {});
  try {
   await expect.poll(() => selected, {timeout:1000}).toBe(fresh.game_id);
   await expect(found).resolves.toMatchObject({status:'setup'});
  } finally { await blocker.query('rollback'); blocker.release(); await found.catch(() => {}); }
  expect(await service.view(users[0], oldest.game_id)).toMatchObject({status:'waiting',revision:0});
 });
 it('lets only the creator cancel a waiting random game with no result', async () => {
  const game = await service.create(users[0], { kind: 'random', options: DEFAULT_OPTIONS });
  await expect(plugin.cancel(users[1], game.game_id)).rejects.toMatchObject({ code: 'FORBIDDEN' });
  const cancelled = await plugin.cancel(users[0], game.game_id);
  expect(cancelled).toMatchObject({ status: 'aborted', revision: 1, result: { winner: null, reason: 'abort' }, action: 'done' });
  expect(cancelled.last_commands.at(-1)?.action).toEqual({ type: 'abort' });
  expect(await plugin.cancel(users[0], game.game_id)).toMatchObject({ status: 'aborted', revision: 1 });
  expect(await service.inbox(users[0])).toEqual([]);
  expect((await plugin.lobby(users[1])).games).toEqual([]);
  await expect(plugin.accept(users[1], game.game_id)).rejects.toMatchObject({ code: 'NOT_ALLOWED' });
  const joined = await plugin.find(users[0], DEFAULT_OPTIONS);
  await plugin.accept(users[1], joined.game_id);
  await expect(plugin.cancel(users[0], joined.game_id)).rejects.toMatchObject({ code: 'NOT_ALLOWED' });
  const friend = await service.create(users[0], { kind: 'friend', options: DEFAULT_OPTIONS });
  await expect(plugin.cancel(users[0], friend.game_id)).rejects.toMatchObject({ code: 'NOT_ALLOWED' });
 });
 it('hides and refuses games at 24 hours, then sweeps them once with no result', async () => {
  const late = await service.create(users[0], { kind: 'random', options: DEFAULT_OPTIONS });
  const fresh = await service.create(users[1], { kind: 'random', options: DEFAULT_OPTIONS });
  const friend = await service.create(users[2], { kind: 'friend', options: DEFAULT_OPTIONS });
  const now = new Date();
  await admin.query("update public.games set created_at=$2::timestamptz-interval '24 hours' where id=any($1)", [[late.game_id, friend.game_id], now]);
  expect((await plugin.lobby(users[3])).games.map(g => g.game_id)).toEqual([fresh.game_id]);
  await expect(plugin.accept(users[3], late.game_id)).rejects.toMatchObject({ code: 'NOT_ALLOWED' });
  expect(await plugin.find(users[3], DEFAULT_OPTIONS)).toMatchObject({ game_id: fresh.game_id, status: 'setup' });
  const sweeps = await Promise.all([service.sweep(now), service.sweep(now)]);
  expect(sweeps.reduce((n, value) => n + value, 0)).toBe(1);
  expect(await service.sweep(now)).toBe(0);
  const ended = await service.view(users[0], late.game_id);
  expect(ended).toMatchObject({ status: 'aborted', revision: 1, action: 'done', result: { winner: null, reason: 'no_start' } });
  expect(ended.last_commands).toHaveLength(1);
  expect(ended.last_commands[0].action).toEqual({ type: 'expire' });
  expect(await service.inbox(users[0])).toEqual([]);
  expect(await service.view(users[2], friend.game_id)).toMatchObject({ status: 'waiting', revision: 0 });
 });
 it('ends a friend game after seven days with no invitation, once', async () => {
  const open = await service.create(users[0], { kind: 'friend', options: DEFAULT_OPTIONS });
  const invited = await service.create(users[1], { kind: 'friend', options: DEFAULT_OPTIONS });
  const now = new Date();
  await admin.query("update public.games set created_at=$2::timestamptz-interval '7 days' where id=any($1)", [[open.game_id, invited.game_id], now]);
  await service.invite(users[1], invited.game_id);
  expect(await service.sweep(new Date(now.getTime()-1))).toBe(0);
  expect(await service.view(users[0], open.game_id)).toMatchObject({status:'waiting'});
  expect(await service.sweep(now)).toBe(1);
  expect(await service.view(users[0], open.game_id)).toMatchObject({status:'aborted',revision:1,result:{winner:null,reason:'no_start'}});
  expect(await service.view(users[1], invited.game_id)).toMatchObject({status:'waiting'});
  expect(await service.sweep(now)).toBe(0);
  expect(await service.inbox(users[0])).toEqual([]);
 });
 it('saves cancel and expiry with no result or rating change', async () => {
  const cancelled = await service.create(users[0], { kind: 'random', options: DEFAULT_OPTIONS });
  const expired = await service.create(users[1], { kind: 'random', options: DEFAULT_OPTIONS });
  const people = users.slice(0, 2);
  await admin.query("insert into public.player_ratings(user_id,rating,rd,volatility,last_game_at) values($1,1620,85,0.05,$3),($2,1380,120,0.07,$3)", [...people, '2026-10-01T12:00:00.000Z']);
  const ratings = (await runtime.query('select * from public.player_ratings where user_id=any($1) order by user_id', [people])).rows;
  expect(ratings).toHaveLength(2);
  await plugin.cancel(users[0], cancelled.game_id);
  const now = new Date();
  await admin.query("update public.games set created_at=$2::timestamptz-interval '24 hours' where id=$1", [expired.game_id, now]);
  expect(await service.sweep(now)).toBe(1);
  const games = [cancelled.game_id, expired.game_id];
  expect((await runtime.query('select * from public.player_ratings where user_id=any($1) order by user_id', [people])).rows).toEqual(ratings);
  expect((await runtime.query('select * from public.rating_history where user_id=any($1)', [people])).rows).toEqual([]);
  expect((await runtime.query('select status,result,end_reason from public.games where id=any($1) order by end_reason', [games])).rows).toEqual([
   { status: 'aborted', result: null, end_reason: 'abort' }, { status: 'aborted', result: null, end_reason: 'no_start' },
  ]);
  expect((await runtime.query("select payload from public.outbox where kind='game_finished' and payload->>'game_id'=any($1) order by payload->>'reason'", [games])).rows.map(row => row.payload)).toEqual([
   { game_id: cancelled.game_id, result: null, reason: 'abort' }, { game_id: expired.game_id, result: null, reason: 'no_start' },
  ]);
 });
 it.each(['accept', 'find'] as const)('%s starts play with no seat choice and saves the first move and deadline', async method => {
  const options = { ...DEFAULT_OPTIONS, arrangement: false };
  const created = await service.create(users[0], { kind: 'random', options, colour: method === 'accept' ? 'black' : 'white' });
  const joined = method === 'accept' ? await plugin.accept(users[1], created.game_id) : await plugin.find(users[1], options, 'black');
  expect(joined).toMatchObject({ game_id: created.game_id, status: 'playing', revision: 1, ready: [true, true], setup_deadline_at: null, options });
  const start = (await runtime.query('select started_at,deadline_kind from public.games where id=$1', [created.game_id])).rows[0];
  expect(start.deadline_kind).toBe('first_turn');
  expect(joined.deadline_at).toBe(new Date(start.started_at.getTime() + 3 * 86_400_000).toISOString());
  const white = method === 'accept' ? users[1] : users[0], black = method === 'accept' ? users[0] : users[1];
  const playing = await plugin.view(white, created.game_id);
  expect(playing).toMatchObject({ action: 'ready', turn: 0, kings: [null, null] });
  expect(playing.legal.length).toBeGreaterThan(0);
  const move = playing.legal[0];
  const moved = await plugin.command(white, created.game_id, { command_id: randomUUID(), expected_revision: 1, action: { type: 'turn', actions: [move] } });
  const saved = await plugin.view(black, created.game_id);
  expect(saved).toMatchObject({ status: 'playing', revision: 2, turn: 1, action: 'ready', fen: moved.fen });
  expect(saved.fen).not.toBe(playing.fen);
  expect(saved.last_commands.at(-1)?.action).toEqual({ type: 'turn', actions: [move] });
  const received = (await runtime.query("select received_at from public.game_commands where game_id=$1 and kind='turn'", [created.game_id])).rows[0].received_at;
  expect(saved.deadline_at).toBe(new Date(received.getTime() + 3 * 86_400_000).toISOString());
  expect(await plugin.command(black, created.game_id, { command_id: randomUUID(), expected_revision: 2, action: { type: 'turn', actions: [saved.legal[0]] } })).toMatchObject({ revision: 3, turn: 0 });
 });
 it('requires a handle before creating, finding or accepting a random game', async () => {
  const actor = randomUUID(); users.push(actor);
  await admin.query('insert into auth.users(id) values($1)', [actor]);
  const game = await service.create(users[0], { kind: 'random', options: DEFAULT_OPTIONS });
  await expect(plugin.create(actor, { kind: 'random', options: DEFAULT_OPTIONS })).rejects.toMatchObject({ code: 'HANDLE_NEEDED' });
  await expect(plugin.find(actor, DEFAULT_OPTIONS)).rejects.toMatchObject({ code: 'HANDLE_NEEDED' });
  await expect(plugin.accept(actor, game.game_id)).rejects.toMatchObject({ code: 'HANDLE_NEEDED' });
  expect(await service.inbox(actor)).toEqual([]);
  expect((await plugin.lobby(actor)).games.map(g => g.game_id)).toEqual([game.game_id]);
  expect(await plugin.create(actor, { kind: 'solo', options: DEFAULT_OPTIONS })).toMatchObject({ kind: 'solo', status: 'setup' });
  await new AccountService(new PostgresMatchStore(runtime)).setHandle(actor, { handle: `new-${actor.slice(0, 8)}` });
  expect(await plugin.accept(actor, game.game_id)).toMatchObject({ game_id: game.game_id, status: 'setup' });
 });
 it('counts distinct players seen in 10 minutes and returns the count only at 10 or more', async () => {
  for (const actor of users.slice(0, 9)) await service.create(actor, { kind: 'solo', options: DEFAULT_OPTIONS });
  await service.create(users[0], { kind: 'solo', options: DEFAULT_OPTIONS });
  await service.create(users[10], { kind: 'solo', options: DEFAULT_OPTIONS });
  await admin.query("update public.game_players set last_seen_at=now()-interval '10 minutes 1 second' where user_id=$1", [users[10]]);
  const game = await service.create(users[0], { kind: 'random', options: { ...DEFAULT_OPTIONS, arrangement: false } });
  expect(await plugin.lobby(users[21])).toEqual({ games: [
   { game_id: game.game_id, options: { ...DEFAULT_OPTIONS, arrangement: false }, colour: 'black', creator: { handle: handles[0], icon: 'flame' }, created_at: expect.any(String) },
  ] });
  await plugin.accept(users[9], game.game_id);
  const readOnly = new pg.Pool({ connectionString: login.href, max: 1, options: '-c default_transaction_read_only=on' });
  try {
   const reader = new PluginService(new PostgresMatchStore(readOnly));
   expect(await reader.lobby(users[21])).toEqual({ games: [], active_count: 10 });
   await admin.query("update public.game_players set last_seen_at=now()-interval '10 minutes 1 second' where user_id=$1", [users[0]]);
   expect(await reader.lobby(users[21])).toEqual({ games: [] });
   const playing = await plugin.view(users[0], game.game_id);
   await plugin.command(users[0], game.game_id, { command_id: randomUUID(), expected_revision: playing.revision, action: { type: 'turn', actions: [playing.legal[0]] } });
   expect(await reader.lobby(users[21])).toEqual({ games: [], active_count: 10 });
  } finally { await readOnly.end(); }
  await admin.query("update public.game_players set last_seen_at=now()-interval '10 minutes 1 second' where user_id=$1", [users[9]]);
  expect(await plugin.lobby(users[21])).toEqual({ games: [] });
 });
 it('gives one open seat to one of 20 clients and lets the winner retry', async () => {
  const created = await service.create(users[0], { kind: 'random', options: DEFAULT_OPTIONS, colour: 'black' });
  const pools = Array.from({ length: 20 }, () => new pg.Pool({ connectionString: login.href, max: 1 }));
  try {
   const clients = await Promise.all(pools.map(pool => pool.connect()));
   try {
    const pids = await Promise.all(clients.map(async client => (await client.query('select pg_backend_pid() as pid')).rows[0].pid));
    expect(new Set(pids).size).toBe(20);
   } finally { for (const client of clients) client.release(); }
   const racers = pools.map(pool => new PluginService(new PostgresMatchStore(pool)));
   const results = await Promise.allSettled(racers.map((racer, n) => racer.accept(users[n + 1], created.game_id)));
   const winners = results.flatMap((result, n) => result.status === 'fulfilled' ? [n] : []);
   expect(winners).toHaveLength(1);
   for (const result of results) if (result.status === 'rejected') expect(result.reason).toMatchObject({ code: 'NOT_ALLOWED' });
   const winner = winners[0], actor = users[winner + 1];
   const joined = await racers[winner].accept(actor, created.game_id);
   expect(joined).toMatchObject({ game_id: created.game_id, status: 'setup', seat: 0, revision: 1, action: 'ready', opponent: { handle: handles[0] } });
   expect(joined.setup_deadline_at).toEqual(expect.any(String));
   expect(joined.last_commands).toHaveLength(1);
   expect(joined.last_commands[0].action).toEqual({ type: 'join' });
   expect((await service.view(users[0], created.game_id)).opponent?.handle).toBe(handles[winner + 1]);
   expect((await plugin.lobby(users[21])).games).toEqual([]);
  } finally { await Promise.all(pools.map(pool => pool.end())); }
 }, 30_000);
});
