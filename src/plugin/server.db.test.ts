/** Opt-in: the ChatGPT tools over in-memory MCP against a disposable real PostgreSQL database (PLUGIN_TEST_DATABASE_URL).
 * The tests use their own copy of it (the name with "_chatgpt" before "_test"): a claim needs a deadline in the past,
 * and a sweep of src/match/service.db.test.ts, which runs at the same time, would end that game first. */
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { DEFAULT_OPTIONS } from '../match/setup';
import type { View } from '../match/protocol';
import { PostgresMatchStore } from '../match/store';
import { createPluginServer } from './server';
import { PluginService } from './service';
import { ownTestDatabase } from '../../tools/plugin-db/own-test-db';
const suite = process.env.PLUGIN_TEST_DATABASE_URL ? describe : describe.skip;
type Result = { isError?: boolean; content: { type: string; text: string }[]; structuredContent?: any; _meta?: any };
const SUMMARY = ['board_id', 'screen', 'colour', 'days_per_move', 'deadline_at', 'draw_offer', 'game_id', 'kind', 'move', 'speed', 'status', 'your_turn'];

suite('ChatGPT tools on PostgreSQL', () => {
 // Every transaction on readOnly is read-only: any write fails (25006), so a tool that succeeds on it wrote nothing.
 let admin: pg.Pool, readOnly: pg.Pool;
 const users: string[] = [], closers: (() => Promise<void>)[] = [], tag = randomUUID().slice(0, 6);
 const rows = async (sql: string, params: unknown[] = []) => (await admin.query(sql, params)).rows;
 async function user(name: string) {
  const id = randomUUID(); users.push(id);
  await admin.query('insert into auth.users(id) values($1)', [id]);
  await admin.query('update public.profiles set handle=$2 where id=$1', [id, `${name}-${tag}`]);
  return id;
 }
 async function connect(actor: string, pool: pg.Pool = admin) {
  const server = createPluginServer({ service: new PluginService(new PostgresMatchStore(pool)), actorId: actor, resourceHtml: '<html>board</html>', publicOrigin: 'https://kingdown.example' });
  const client = new Client({ name: 'db-test', version: '1' }), [a, b] = InMemoryTransport.createLinkedPair();
  await server.connect(a); await client.connect(b); closers.push(async () => { await client.close(); await server.close(); });
  const call = async (name: string, args: Record<string, unknown> = {}) => await client.callTool({ name, arguments: args }) as Result;
  const ok = async (name: string, args: Record<string, unknown> = {}) => { const result = await call(name, args); if (result.isError) throw new Error(`${name}: ${result.content[0]?.text} (${result._meta?.code})`); return result; };
  return { client, call, ok };
 }
 const view = (result: Result) => result._meta.view as View;
 const plain = (result: Result) => view(result).legal.find(lan => !lan.includes('!'))!; // a move with no power
 const move = (result: Result, lan?: string) => ({ game_id: view(result).game_id, command_id: randomUUID(), expected_revision: view(result).revision, ...(lan && { lan }) });
 /** What the model reads: a short summary, never the position, the moves or a handle. */
 function summary(result: Result, ...secrets: string[]) {
  expect(Object.keys(result.structuredContent).filter(key => !['result', 'your_turn_count'].includes(key)).sort()).toEqual(SUMMARY.filter(key => key !== 'board_id' || 'board_id' in result.structuredContent).sort());
  const seen = JSON.stringify([result.content, result.structuredContent]);
  for (const secret of [view(result).fen.split(' ')[0], ...secrets]) expect(seen).not.toContain(secret);
 }
 let ann: string, bob: string;
 beforeAll(async () => {
  const own = await ownTestDatabase('chatgpt');
  admin = new pg.Pool({ connectionString: own.href, max: 2 }); readOnly = new pg.Pool({ connectionString: own.href, max: 1, options: '-c default_transaction_read_only=on' });
  [ann, bob] = [await user('ann'), await user('bob')];
 }, 60000);
 afterAll(async () => {
  for (const close of closers) await close();
  if (!admin) return;
  await readOnly.end();
  await admin.query('delete from public.reports where reporter_id=any($1) or reported_id=any($1)', [users]);
  await admin.query('delete from public.games g where created_by=any($1) or exists(select from public.game_players p where p.game_id=g.id and p.user_id=any($1))', [users]);
  await admin.query('delete from auth.users where id=any($1)', [users]);
  await admin.end();
 });

 it('opens home with no game and reads that board by ID alone', async () => {
  const actor = await user('home'), player = await connect(actor);
  const opened = await player.ok('kingdown_open');
  expect(opened.structuredContent).toMatchObject({ screen: 'home', board_id: expect.any(String), your_turn_count: 0 });
  expect(opened._meta.view).toBeUndefined();
  expect(await rows('select count(*)::int as n from public.games where created_by=$1', [actor])).toEqual([{ n: 0 }]);
  const board_id = opened.structuredContent.board_id;
  expect((await player.ok('kingdown_get', { board_id })).structuredContent).toMatchObject({ screen: 'home', board_id });
  expect((await player.ok('kingdown_open', { game_id: 'next' }))._meta.view).toBeUndefined();
 });

 it('lists, finds, accepts and cancels open games without exposing the lobby to the model', async () => {
  const [a, b] = [await user('lobby-a'), await user('lobby-b')], host = await connect(a), guest = await connect(b);
  const home = await host.ok('kingdown_open'), board_id = home.structuredContent.board_id;
  const options = { ...DEFAULT_OPTIONS, arrangement: false };
  const found = await host.ok('kingdown_find', { options, board_id }), game_id = found.structuredContent.game_id;
  expect(view(await host.ok('kingdown_find', { options, board_id })).game_id).toBe(game_id);
  expect((await rows("select count(*)::int as n from public.games where created_by=$1 and kind='random' and status='waiting'", [a]))[0].n).toBe(1);
  const lobby = await guest.ok('kingdown_lobby');
  expect(lobby._meta.lobby).toMatchObject({ games: [expect.objectContaining({ game_id, creator: { handle: `lobby-a-${tag}`, icon: null } })], server_now: expect.any(String) });
  expect(lobby.structuredContent).toEqual({ count: 1 });
  expect(JSON.stringify([lobby.content, lobby.structuredContent])).not.toContain(`lobby-a-${tag}`);
  const guestBoard = (await guest.ok('kingdown_open')).structuredContent.board_id;
  expect(view(await guest.ok('kingdown_accept', { game_id, board_id: guestBoard }))).toMatchObject({ status: 'playing', seat: 1 });
  expect(view(await guest.ok('kingdown_accept', { game_id, board_id: guestBoard })).revision).toBe(1);
  expect((await guest.ok('kingdown_get', { board_id: guestBoard })).structuredContent.game_id).toBe(game_id);
  const open = await host.ok('kingdown_create', { kind: 'random', options });
  const cancelled = await host.ok('kingdown_cancel', { game_id: view(open).game_id });
  expect(view(cancelled)).toMatchObject({ status: 'aborted', result: { winner: null, reason: 'abort' } });
  expect(view(await host.ok('kingdown_cancel', { game_id: view(open).game_id })).revision).toBe(view(cancelled).revision);
 });

 it('hides each setup choice through commands and abort, then keeps rematch on the old board until resume', async () => {
  const [a, b] = [await user('choice-a'), await user('choice-b')], host = await connect(a), guest = await connect(b);
  const options = { ...DEFAULT_OPTIONS, pool: ['Q', 'R', 'B', 'N'], kingPowers: true };
  const created = await host.ok('kingdown_create', { kind: 'friend', options });
  const game_id = view(created).game_id, board_id = (await host.ok('kingdown_open', { game_id })).structuredContent.board_id;
  const code = (await host.ok('kingdown_invite', { game_id })).structuredContent.code;
  await guest.ok('kingdown_join', { code });
  const chosen = await guest.ok('kingdown_choose', { game_id, command_id: randomUUID(), expected_revision: 1, king: { king: 'Flame', power: 'Haste' }, order: 'RNBQKBNR', ready: true });
  expect(chosen.content[0].text).toBe('Waiting for the other player to choose.');
  const read = await host.ok('kingdown_get', { board_id });
  const aborted = await host.ok('kingdown_abort', { game_id, command_id: randomUUID(), expected_revision: 2 });
  for (const result of [read, aborted]) {
   expect(view(result).choices?.[1]).toBeNull();
   expect(view(result).last_commands.at(-2)?.action.type === 'hidden' || view(result).last_commands.at(-1)?.action.type === 'hidden').toBe(true);
   expect(JSON.stringify(result)).not.toContain('Flame');
  }
  const solo = await host.ok('kingdown_create', { kind: 'solo', options: { ...DEFAULT_OPTIONS, arrangement: false }, board_id });
  const old = view(solo).game_id;
  const ended = await host.ok('kingdown_resign', { game_id: old });
  const offered = await host.ok('kingdown_rematch', { ...move(ended), choice: 'offer' });
  expect(view(offered).game_id).toBe(old); expect(view(offered).rematch_game_id).toEqual(expect.any(String));
  expect(view(await host.ok('kingdown_get', { board_id })).game_id).toBe(old);
  const resumed = await host.ok('kingdown_resume', { board_id, game_id: view(offered).rematch_game_id });
  expect(view(resumed)).toMatchObject({ game_id: view(offered).rematch_game_id, seat: 1 });
  expect(view(await host.ok('kingdown_get', { board_id })).game_id).toBe(view(resumed).game_id);
 });

 it('reads default settings and preserves partial writes and saved setup across remounts', async () => {
  const actor = await user('settings'), player = await connect(actor), reader = await connect(actor, readOnly);
  const initial = await reader.ok('kingdown_settings');
  expect(initial._meta).toMatchObject({ settings: { symbols_only: false, show_threats: false, last_setup: null }, me: { handle: `settings-${tag}`, icon: null } });
  const last_setup = { kind: 'solo', options: { ...DEFAULT_OPTIONS, arrangement: false }, colour: 'black', level: 'beginner', king: { king: 'Mud', power: 'March' } };
  await player.ok('kingdown_settings', { symbols_only: true, last_setup });
  await player.ok('kingdown_settings', { show_threats: true });
  const reopened = await player.ok('kingdown_open');
  expect(reopened._meta.settings).toEqual({ symbols_only: true, show_threats: true, last_setup });
  expect(view(await player.ok('kingdown_create', { kind: 'solo' })).options).toEqual(last_setup.options);
  for (const input of [{ last_setup: { ...last_setup, options: { ...DEFAULT_OPTIONS, pool: [] } } }, { last_setup: { ...last_setup, king: { king: 'Flame', power: 'Mercy' } } }]) expect((await player.call('kingdown_settings', input)).isError).toBe(true);
  expect((await reader.ok('kingdown_settings'))._meta.settings).toEqual(reopened._meta.settings);
  expect((await reader.call('kingdown_settings', { symbols_only: false }))._meta.code).toBe('INTERNAL_ERROR');
 });

 it('checks a handle without a write and exposes the record and history only in profile metadata', async () => {
  const actor = await user('profile'), player = await connect(actor), reader = await connect(actor, readOnly);
  await admin.query('update public.profiles set handle=null where id=$1', [actor]);
  const handle = `picked-${tag}`;
  expect((await reader.ok('kingdown_handle', { handle, check: true })).structuredContent).toEqual({ available: true });
  expect((await reader.ok('kingdown_profile')).structuredContent).toEqual({ id: actor });
  const changed = await player.ok('kingdown_handle', { handle, icon: 'mud' });
  expect(changed._meta.me).toEqual({ handle, icon: 'mud' });
  expect((await reader.ok('kingdown_handle', { handle, check: true })).structuredContent).toEqual({ available: true });
  expect((await player.call('kingdown_handle', { handle: 'ab', check: true }))._meta.code).toBe('INVALID_INPUT');
  expect((await player.call('kingdown_handle', { icon: 'photo' })).isError).toBe(true);
  const other = await connect(await user('profile-other'));
  expect((await other.call('kingdown_handle', { handle, check: true }))._meta.code).toBe('HANDLE_TAKEN');
  await player.ok('kingdown_handle', { handle: `renamed-${tag}` });
  expect((await other.call('kingdown_handle', { handle, check: true }))._meta.code).toBe('HANDLE_TAKEN');
  const game = await player.ok('kingdown_create', { kind: 'solo', options: { ...DEFAULT_OPTIONS, arrangement: false } });
  await player.ok('kingdown_resign', { game_id: view(game).game_id });
  const profile = await reader.ok('kingdown_profile');
  expect(profile.structuredContent).toEqual({ id: actor, name: `renamed-${tag}` });
  expect(profile._meta).toMatchObject({ handle: `renamed-${tag}`, icon: 'mud', record: { totals: { played: 1, lost: 1 }, rating: { provisional: true } }, history: [expect.objectContaining({ game_id: view(game).game_id })], next_before: null });
  expect(profile.content[0].text).toMatch(/Rating 1500.*1 played.*1 lost/);
  expect((await reader.call('kingdown_profile', { before: 'bad' }))._meta.code).toBe('INVALID_INPUT');
  expect((await player.ok('kingdown_games'))._meta.games).toEqual([]);
 });

 it('plays a Daily friend game between two ChatGPT players and shows the model no position and no opponent text', async () => {
  const host = await connect(ann), guest = await connect(bob), handles = [`ann-${tag}`, `bob-${tag}`];
  const created = await host.ok('kingdown_create', { options: { ...DEFAULT_OPTIONS, arrangement: false }, kind: 'friend', colour: 'white' });
  expect(created.structuredContent).toMatchObject({ kind: 'friend', speed: 'daily', days_per_move: 3, status: 'waiting', colour: 'white', your_turn: false });
  expect(created.content[0].text).toBe('Waiting for the other player to join.');
  const game: string = created.structuredContent.game_id, invite = await host.ok('kingdown_invite', { game_id: game });
  expect(invite.structuredContent.code).toMatch(/^[A-HJKMNP-Z2-9]{6}$/);
  const joined = await guest.ok('kingdown_join', { code: invite.structuredContent.code });
  expect(joined.structuredContent).toMatchObject({ game_id: game, colour: 'black', status: 'playing', your_turn: false });
  // "next" opens the most urgent game: Ann's turn in this one.
  const opened = await host.ok('kingdown_open', { game_id: 'next' });
  expect(opened.structuredContent).toMatchObject({ game_id: game, your_turn: true, move: 1 }); expect(opened.content[0].text).toBe('Your move, move 1.');
  expect(view(opened)).toMatchObject({ opponent: { handle: `bob-${tag}` }, rules: expect.any(Object) }); expect(view(opened).legal.length).toBeGreaterThan(0);
  summary(opened, ...handles);
  const first = move(opened, plain(opened));
  const moved = await host.ok('kingdown_move', first);
  expect(view(moved).revision).toBe(view(opened).revision + 1); expect(view(moved).rules).toBeUndefined(); summary(moved, ...handles);
  expect(view(await host.ok('kingdown_move', first)).revision).toBe(view(moved).revision); // a retry applies once
  expect((await host.call('kingdown_move', { ...first, command_id: randomUUID() }))._meta.code).toBe('STALE_REVISION');
  const games = await guest.ok('kingdown_games');
  expect(games.structuredContent.games[0]).toMatchObject({ game_id: game, your_turn: true, colour: 'black', opponent: 'player' });
  expect(JSON.stringify([games.content, games.structuredContent])).not.toContain(`ann-${tag}`);
  const said = await guest.ok('kingdown_say', { ...move(await guest.ok('kingdown_get', { game_id: game })), preset: 'good_luck' });
  const polled = await host.ok('kingdown_get', { game_id: game, since_revision: view(moved).revision });
  expect(view(polled).last_commands.map(entry => entry.action)).toEqual([{ type: 'say', preset: 'good_luck' }]); expect(view(polled).rules).toBeUndefined();
  summary(polled, ...handles, 'good_luck');
  expect((await guest.ok('kingdown_draw', { ...move(said), choice: 'offer' })).structuredContent.draw_offer).toBe('yours');
  // The model sees the other side's offer, and answers it with no command ID.
  const offered = await host.ok('kingdown_open', { game_id: game });
  expect([offered.structuredContent.draw_offer, offered.content[0].text]).toEqual(['opponent', `The other side moves, move ${offered.structuredContent.move}. The other side offers a draw.`]);
  const declined = await host.ok('kingdown_draw', { game_id: game, choice: 'decline' });
  expect([view(declined).draw_offer, declined.structuredContent.draw_offer]).toEqual([null, null]);
  const report = await host.ok('kingdown_report', { game_id: game, target: 'message', category: 'harassment', preset: 'good_luck', note: 'Test report' });
  expect((await rows('select reporter_id,reported_id,target,content from public.reports where id=$1', [report.structuredContent.id]))[0]).toEqual({ reporter_id: ann, reported_id: bob, target: 'message', content: 'good_luck' });
  expect((await host.ok('kingdown_profile')).structuredContent).toEqual({ id: ann, name: `ann-${tag}` });
  // The model resigns with no command: the server takes the current revision.
  const resigned = await guest.ok('kingdown_resign', { game_id: game });
  expect(resigned.structuredContent).toMatchObject({ status: 'finished', result: 'White wins · Resignation' }); expect(resigned.content[0].text).toBe('Game over: White wins · Resignation.');
  expect((await rows("select surface,count(*)::int as n from public.game_commands where game_id=$1 and surface is not null group by surface", [game]))).toEqual([{ surface: 'chatgpt', n: 5 }]);
 }, 60000);

 it('aborts by short code before the first turns and claims a missed Daily deadline', async () => {
  const host = await connect(ann), guest = await connect(bob);
  const start = async () => {
   const game = (await host.ok('kingdown_create', { options: { ...DEFAULT_OPTIONS, arrangement: false }, kind: 'friend', colour: 'white' })).structuredContent.game_id;
   const { code } = (await host.ok('kingdown_invite', { game_id: game })).structuredContent;
   await guest.ok('kingdown_join', { code: `${code.slice(0, 3).toLowerCase()}-${code.slice(3)}` });
   return game as string;
  };
  const aborted = await host.ok('kingdown_abort', { game_id: await start() });
  expect(aborted.structuredContent).toMatchObject({ status: 'aborted', result: 'Game aborted' });
  // Each side plays a first turn, then Black misses a move deadline: White claims the win.
  const game = await start();
  for (const player of [host, guest, host]) { const state = await player.ok('kingdown_get', { game_id: game }); await player.ok('kingdown_move', move(state, plain(state))); }
  const waiting = await host.ok('kingdown_get', { game_id: game });
  expect((await host.call('kingdown_claim', move(waiting)))._meta.code).toBe('NOT_ALLOWED');
  await admin.query("update public.games set deadline_at=now()-interval '1 minute' where id=$1", [game]);
  const claimed = await host.ok('kingdown_claim', move(waiting));
  expect(claimed.structuredContent).toMatchObject({ status: 'finished', result: 'White wins · Time' });
 }, 60000);

 it('runs the read-only tools on a read-only connection, and only those', async () => {
  const cy = await user('cy'), player = await connect(cy), reader = await connect(cy, readOnly);
  const tools = (await reader.client.listTools()).tools;
  expect(tools.filter(tool => tool.annotations?.readOnlyHint).map(tool => tool.name).sort()).toEqual(['kingdown_games', 'kingdown_get', 'kingdown_lobby', 'kingdown_profile']);
  const solo = await player.ok('kingdown_create', { kind: 'solo', options: { ...DEFAULT_OPTIONS, arrangement: false } });
  const opened = await player.ok('kingdown_open', { game_id: solo.structuredContent.game_id }), { game_id, board_id } = opened.structuredContent;
  expect(view(opened)).toMatchObject({ kind: 'solo', revision: 0, action: 'ready' });
  for (const args of [{ game_id }, { game_id, since_revision: 0 }, { game_id, board_id }, { game_id, since_revision: 0, board_id }]) await reader.ok('kingdown_get', args);
  expect((await reader.ok('kingdown_games')).structuredContent.games.map((game: { game_id: string }) => game.game_id)).toEqual([game_id]);
  expect((await reader.ok('kingdown_profile')).structuredContent).toEqual({ id: cy, name: `cy-${tag}` });
  // The control: a write on the same connection fails and changes nothing.
  expect((await reader.call('kingdown_move', move(opened, view(opened).legal[0])))._meta.code).toBe('INTERNAL_ERROR');
  expect(view(await player.ok('kingdown_get', { game_id })).revision).toBe(0);
 }, 60000);

 it('keeps board selections: a switch, another player’s board, the next game and recovery after a deleted game', async () => {
  const [dee, eve] = [await user('dee'), await user('eve')], d = await connect(dee), e = await connect(eve);
  const initial = await d.ok('kingdown_create', { kind: 'solo', options: { ...DEFAULT_OPTIONS, arrangement: false } });
  const first = await d.ok('kingdown_open', { game_id: initial.structuredContent.game_id }), board: string = first.structuredContent.board_id, firstGame: string = first.structuredContent.game_id;
  const other = await d.ok('kingdown_open', { game_id: firstGame });
  expect(other.structuredContent).toMatchObject({ game_id: firstGame }); expect(other.structuredContent.board_id).not.toBe(board);
  // White: with no colour the seat is random, and Black has no legal move before the computer plays.
  const created = await d.ok('kingdown_create', { options: { ...DEFAULT_OPTIONS, arrangement: false }, kind: 'solo', colour: 'white', board_id: board }), second: string = created.structuredContent.game_id;
  expect(created.structuredContent).toMatchObject({ board_id: board, kind: 'solo', speed: 'live', colour: 'white' });
  expect((await d.ok('kingdown_get', { game_id: firstGame, board_id: board })).structuredContent.game_id).toBe(second);
  expect((await d.ok('kingdown_get', { game_id: firstGame, board_id: other.structuredContent.board_id })).structuredContent.game_id).toBe(firstGame);
  for (const [name, args] of [['kingdown_get', { game_id: firstGame, board_id: board }], ['kingdown_get', { game_id: firstGame }], ['kingdown_create', { options: { ...DEFAULT_OPTIONS, arrangement: false }, kind: 'solo', board_id: board }], ['kingdown_open', { game_id: firstGame }]] as const)
   expect((await e.call(name, args))._meta.code, name).toBe('FORBIDDEN');
  expect((await rows('select count(*)::int as n from public.games where created_by=$1', [eve]))[0].n).toBe(0);
  // A solo move and the computer's reply; then the first game is the most urgent.
  const played = await d.ok('kingdown_move', move(created, plain(created)));
  expect(view(await d.ok('kingdown_computer', move(played))).revision).toBe(2);
  await admin.query('delete from public.games where id=$1', [second]);
  expect((await d.call('kingdown_get', { game_id: second, board_id: board }))._meta.code).toBe('MATCH_REMOVED');
  const resumed = await d.ok('kingdown_resume', { board_id: board });
  expect(resumed.structuredContent).toMatchObject({ game_id: firstGame, board_id: board });
  expect((await d.ok('kingdown_get', { game_id: second, board_id: board })).structuredContent.game_id).toBe(firstGame);
 }, 60000);
});
