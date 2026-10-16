/** Opt-in: the ChatGPT tools over in-memory MCP against a disposable real PostgreSQL database (PLUGIN_TEST_DATABASE_URL).
 * The tests use their own copy of it (the name with "_chatgpt" before "_test"): a claim needs a deadline in the past,
 * and a sweep of src/match/service.db.test.ts, which runs at the same time, would end that game first. */
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { DEFAULT_OPTIONS } from '../match/setup';
import type { View } from '../match/protocol';
import { GameService } from '../match/service';
import { PostgresMatchStore } from '../match/store';
import { createPluginServer } from './server';
import { PluginService } from './service';
import { ownTestDatabase } from '../../tools/plugin-db/own-test-db';
const suite = process.env.PLUGIN_TEST_DATABASE_URL ? describe : describe.skip;
type Result = { isError?: boolean; content: { type: string; text: string }[]; structuredContent?: any; _meta?: any };
const SUMMARY = [ 'screen', 'colour', 'days_per_move', 'deadline_at', 'draw_offer', 'game_id', 'kind', 'move', 'speed', 'status', 'your_turn'];

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
  const call = async (name: string, args: Record<string, unknown> = {}) => {
   const result = await client.callTool({ name, arguments: args }) as Result;
   const model = JSON.stringify([result.content,result.structuredContent]);
   expect(model).not.toMatch(/"(?:fen|legal|handle|icon|choices|draw|deal|board_id|revision|created_at)"\s*:/);
   const meta = result._meta;
   for (const opponent of [meta?.view?.opponent,meta?.preview?.creator,...(meta?.games ?? []).map((g:any)=>g.opponent),...(meta?.lobby?.games ?? []).map((g:any)=>g.creator),...(meta?.history ?? []).map((g:any)=>g.opponent)])
    if (opponent?.handle) expect(model).not.toContain(opponent.handle);
   if (meta?.view?.fen) expect(model).not.toContain(meta.view.fen.split(' ')[0]);
   for (const lan of meta?.view?.legal ?? []) expect(model).not.toContain(JSON.stringify(lan));
   if (name === 'kingdown_open' && args.code) expect(model).not.toContain(meta.preview.code);
   if (meta?.view?.ready && !meta.view.ready.every(Boolean)) { expect(meta.view.choices[1-meta.view.seat]).toBeNull(); expect(meta.view.last_commands.some((c:any)=>c.seat !== meta.view.seat && c.action.type === 'choose')).toBe(false); }
   return result;
  };
  const ok = async (name: string, args: Record<string, unknown> = {}) => { const result = await call(name, args); if (result.isError) throw new Error(`${name}: ${result.content[0]?.text} (${result._meta?.code})`); return result; };
  return { client, call, ok };
 }
 const view = (result: Result) => result._meta.view as View;
 const plain = (result: Result) => view(result).legal.find(lan => !lan.includes('!'))!; // a move with no power
 const move = (result: Result, lan?: string) => ({ game_id: view(result).game_id, command_id: randomUUID(), expected_revision: view(result).revision, ...(lan && { lan }) });
 /** What the model reads: a short summary, never the position, the moves or a handle. */
 function summary(result: Result, ...secrets: string[]) {
  expect(Object.keys(result.structuredContent).filter(key => !['result', 'your_turn_count'].includes(key)).sort()).toEqual([...SUMMARY].sort());
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

 it('reuses one open random game for two create calls', async () => {
  const actor = await user('random-retry'), player = await connect(actor);
  const [first, second] = await Promise.all([player.ok('kingdown_create',{kind:'random'}), player.ok('kingdown_create',{kind:'random'})]);
  expect(view(first)).toMatchObject({kind:'random',status:'waiting',game_id:view(second).game_id});
  expect((await player.ok('kingdown_games'))._meta.games.map((game:View)=>game.game_id)).toEqual([view(first).game_id]);
  await player.ok('kingdown_cancel',{game_id:view(first).game_id});
 });

 it('gives a resent Create or Find with the same command ID its first game', async () => {
  const [a, b] = [await user('resend-a'), await user('resend-b')], host = await connect(a), guest = await connect(b);
  const options = { ...DEFAULT_OPTIONS, arrangement: false };
  for (const kind of ['solo', 'friend'] as const) {
   const args = { kind, options, command_id: `resend-${kind}-${tag}` };
   // The resend can come while the first send still runs.
   const [first, second] = await Promise.all([host.ok('kingdown_create', args), host.ok('kingdown_create', args)]);
   expect(view(second).game_id).toBe(view(first).game_id);
   expect(view(await host.ok('kingdown_create', args)).game_id).toBe(view(first).game_id);
  }
  expect((await rows('select kind from public.games where created_by=$1 order by kind', [a])).map(row => row.kind)).toEqual(['friend', 'solo']);
  // A Find that took an open seat gets that game again: no second seat and no new open game.
  await host.ok('kingdown_create', { kind: 'random', options });
  const args = { options, command_id: `resend-find-${tag}` }, joined = await guest.ok('kingdown_find', args);
  expect(view(await guest.ok('kingdown_find', args)).game_id).toBe(view(joined).game_id);
  expect((await rows('select game_id from public.game_players where user_id=$1', [b])).map(row => row.game_id)).toEqual([view(joined).game_id]);
 });

 it('keeps old games working through open, board reads, moves, inbox and history', async () => {
  const actor = await user('legacy'), player = await connect(actor);
  const legacy = await new GameService(new PostgresMatchStore(admin)).create(actor,{kind:'solo',colour:'white',setup:{backRank:'RNBQKBNR',kings:'none,none'}});
  const opened = await player.ok('kingdown_open',{game_id:legacy.game_id}), board_id = opened._meta.board_id;
  expect(view(opened).options).toBeUndefined();
  expect(view(await player.ok('kingdown_get',{board_id})).game_id).toBe(legacy.game_id);
  const moved = await player.ok('kingdown_move',move(opened,'e2-e4'));
  expect(view(moved).revision).toBe(1);
  expect((await player.ok('kingdown_games'))._meta.games[0]).toMatchObject({game_id:legacy.game_id,options:null,move:1});
  await player.ok('kingdown_resign',{game_id:legacy.game_id});
  expect((await player.ok('kingdown_profile'))._meta.history[0].game_id).toBe(legacy.game_id);
 });

 it('accepts revision 1100 and refuses 1101 without changing a game', async () => {
  const actor = await user('bounds'), player = await connect(actor);
  const created = await player.ok('kingdown_create',{kind:'solo',options:{...DEFAULT_OPTIONS,arrangement:false}});
  const game_id = view(created).game_id;
  expect(view(await player.ok('kingdown_get',{game_id,since_revision:1100})).revision).toBe(0);
  const opened = await player.ok('kingdown_open',{game_id});
  expect(view(await player.ok('kingdown_get',{board_id:opened._meta.board_id,since_revision:1100})).rules).toBeUndefined();
  expect((await player.call('kingdown_move',{game_id,command_id:'bounds',expected_revision:1100,lan:plain(created)}))._meta.code).toBe('STALE_REVISION');
  expect((await player.call('kingdown_get',{game_id,since_revision:1101})).isError).toBe(true);
  expect((await player.call('kingdown_move',{game_id,command_id:'bounds',expected_revision:1101,lan:plain(created)})).isError).toBe(true);
  expect((await rows('select revision from public.games where id=$1',[game_id]))[0].revision).toBe(0);
 });

 it('opens home with no game and reads that board by ID alone', async () => {
  const actor = await user('home'), player = await connect(actor);
  const opened = await player.ok('kingdown_open');
  expect(opened.structuredContent).toEqual({screen:'home',your_turn_count:0});
  expect(opened._meta.board_id).toEqual(expect.any(String));
  expect((await player.ok('kingdown_open',{screen:'board'})).structuredContent.screen).toBe('home');
  expect(opened._meta.view).toBeUndefined();
  expect(await rows('select count(*)::int as n from public.games where created_by=$1', [actor])).toEqual([{ n: 0 }]);
  const board_id = opened._meta.board_id;
  const read = await player.ok('kingdown_get', {board_id});
  expect(read.structuredContent).toEqual({screen:'home'}); expect(read._meta.board_id).toBe(board_id);
  expect((await player.ok('kingdown_open', { game_id: 'next' }))._meta.view).toBeUndefined();
 });

 it('lists, finds, accepts and cancels open games without exposing the lobby to the model', async () => {
  const [a, b] = [await user('lobby-a'), await user('lobby-b')], host = await connect(a), guest = await connect(b);
  const home = await host.ok('kingdown_open'), board_id = home._meta.board_id;
  const options = { ...DEFAULT_OPTIONS, arrangement: false };
  const found = await host.ok('kingdown_find', { options, board_id }), game_id = found.structuredContent.game_id;
  expect(view(await host.ok('kingdown_find', { options, board_id })).game_id).toBe(game_id);
  expect((await rows("select count(*)::int as n from public.games where created_by=$1 and kind='random' and status='waiting'", [a]))[0].n).toBe(1);
  const lobby = await guest.ok('kingdown_lobby');
  expect(lobby._meta.lobby).toMatchObject({ games: [expect.objectContaining({ game_id, creator: { handle: `lobby-a-${tag}`, icon: null } })], server_now: expect.any(String) });
  expect(lobby.structuredContent).toEqual({ count: 1 });
  expect(JSON.stringify([lobby.content, lobby.structuredContent])).not.toContain(`lobby-a-${tag}`);
  const guestBoard = (await guest.ok('kingdown_open'))._meta.board_id;
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
  const game_id = view(created).game_id, board_id = (await host.ok('kingdown_open', { game_id }))._meta.board_id;
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
  expect(view(resumed)).toMatchObject({ game_id: view(offered).rematch_game_id, seat: 0 });
  expect(view(await host.ok('kingdown_get', { board_id })).game_id).toBe(view(resumed).game_id);
 });

 it('reads no seat activity, and records it through kingdown_seen at most once each 30 seconds', async () => {
  const [a, b] = [await user('seen-a'), await user('seen-b')], host = await connect(a), guest = await connect(b);
  const created = await host.ok('kingdown_create', { kind: 'friend', options: { ...DEFAULT_OPTIONS, arrangement: false } });
  const game_id = view(created).game_id;
  await guest.ok('kingdown_join', { code: (await host.ok('kingdown_invite', { game_id })).structuredContent.code });
  const board_id = (await host.ok('kingdown_open', { game_id }))._meta.board_id;
  await admin.query("update public.profiles set online_visible_to='everyone' where id=$1", [a]);
  const seen = async () => (await rows('select last_seen_at from public.game_players where game_id=$1 and user_id=$2', [game_id, a]))[0].last_seen_at;
  await admin.query("update public.game_players set last_seen_at=now()-interval '3 minutes' where game_id=$1 and user_id=$2", [game_id, a]);
  const old = await seen();
  // kingdown_get has readOnlyHint: no read writes, also not the open and resume reads.
  for (const [name, args] of [
   ['kingdown_get', { board_id }], ['kingdown_get', { board_id, since_revision: 1 }],
   ['kingdown_open', { game_id }], ['kingdown_resume', { board_id, game_id }], ['kingdown_get', { game_id }],
  ] as const) { await host.ok(name, args); expect(await seen()).toEqual(old); }
  await host.ok('kingdown_seen', { game_id });
  expect(view(await guest.ok('kingdown_get', { game_id })).opponent!.last_seen_ms).toBeLessThan(120000);
  const first = await seen();
  await host.ok('kingdown_seen', { game_id }); expect(await seen()).toEqual(first);
  await admin.query("update public.profiles set online_visible_to='nobody' where id=$1", [a]);
  expect(view(await guest.ok('kingdown_get', { game_id })).opponent!.last_seen_ms).toBeNull();
 });

 it('keeps an active reader recent when the server clock is two days ahead', async () => {
  const [a, b] = [await user('clock-a'), await user('clock-b')], host = await connect(a), guest = await connect(b);
  const game_id = view(await host.ok('kingdown_create', { kind: 'friend', options: { ...DEFAULT_OPTIONS, arrangement: false } })).game_id;
  await guest.ok('kingdown_join', { code: (await host.ok('kingdown_invite', { game_id })).structuredContent.code });
  await admin.query("update public.profiles set online_visible_to='everyone' where id=$1", [a]);
  await admin.query("update public.game_players set last_seen_at=now()-interval '3 minutes' where game_id=$1 and user_id=$2", [game_id, a]);
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(Date.now() + 2 * 86_400_000);
  try {
   for (const since_revision of [undefined, 1]) {
    await admin.query("update public.game_players set last_seen_at=now()-interval '3 minutes' where game_id=$1 and user_id=$2", [game_id, a]);
    await host.ok('kingdown_seen', { game_id });
    const age = view(await guest.ok('kingdown_get', { game_id, ...(since_revision !== undefined && { since_revision }) })).opponent!.last_seen_ms;
    expect.soft(age).toBeGreaterThanOrEqual(0); expect.soft(age).toBeLessThan(120000);
   }
   const age = (await guest.ok('kingdown_games'))._meta.games.find((g: View) => g.game_id === game_id).opponent.last_seen_ms;
   expect.soft(age).toBeGreaterThanOrEqual(0); expect.soft(age).toBeLessThan(120000);
  } finally { vi.useRealTimers(); }
 });

 it('starts a fresh account with the approved game defaults', async () => {
  const actor = await user('defaults'), player = await connect(actor);
  expect((await player.ok('kingdown_settings'))._meta.settings).toEqual({ symbols_only: false, show_threats: false, last_setup: null });
  expect(view(await player.ok('kingdown_create', { kind: 'solo' }))).toMatchObject({ status: 'setup', level: 'club', options: { fairy: true, arrangement: true, classic: false, cards: false, kingPowers: false } });
 });

 it('uses the setup and first-move end words in the tool reply', async () => {
  const [a, b] = [await user('end-a'), await user('end-b')], host = await connect(a), guest = await connect(b);
  for (const [arrangement, words] of [[true, 'The setup time ran out. No result.'], [false, 'No first move. No result.']] as const) {
   const game_id = view(await host.ok('kingdown_create', { kind: 'friend', options: { ...DEFAULT_OPTIONS, arrangement } })).game_id;
   await guest.ok('kingdown_join', { code: (await host.ok('kingdown_invite', { game_id })).structuredContent.code });
   await admin.query(`update public.games set ${arrangement ? 'setup_deadline_at' : 'deadline_at'}=now()-interval '1 second' where id=$1`, [game_id]);
   await new GameService(new PostgresMatchStore(admin)).sweep();
   const ended = await host.ok('kingdown_get', { game_id });
   expect(ended.content).toEqual([{ type: 'text', text: `Game over: ${words}` }]); expect(ended.structuredContent.result).toBe(words);
  }
 });

 it('keeps the retry hints for each tool', async () => {
  const player = await connect(await user('retry-hints')), tools = (await player.client.listTools()).tools;
  expect(tools).toHaveLength(25);
  expect(tools.filter(tool => tool.annotations?.idempotentHint === false).map(tool => tool.name).sort()).toEqual(['kingdown_create', 'kingdown_find', 'kingdown_invite', 'kingdown_join', 'kingdown_open', 'kingdown_report', 'kingdown_resume', 'kingdown_seen']);
  for (const tool of tools) expect(typeof tool.annotations?.idempotentHint).toBe('boolean');
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
  const before = await rows('select updated_at from public.profiles where id=$1',[actor]);
  await reader.ok('kingdown_handle',{icon:'mud'});
  expect(await rows('select updated_at from public.profiles where id=$1',[actor])).toEqual(before);
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

 it('gives the page icons, ratings, outcomes, abort state and inbox time, with distinct no-start words', async () => {
  const [a, b] = [await user('fields-a'), await user('fields-b')], host = await connect(a), guest = await connect(b);
  await guest.ok('kingdown_handle', { icon: 'frost' });
  const options = { ...DEFAULT_OPTIONS, arrangement: false };
  const created = await host.ok('kingdown_create', { kind: 'friend', options });
  const game_id = view(created).game_id;
  expect(view(created)).toMatchObject({ created_at: expect.any(String), abort_open: true });
  const invite = await host.ok('kingdown_invite', { game_id });
  const games = await host.ok('kingdown_games');
  expect(games._meta.games[0]).toMatchObject({ options, level: 'club', created_at: view(created).created_at, open_until: invite.structuredContent.expires_at, move: null });
  await guest.ok('kingdown_join', { code: invite.structuredContent.code });
  const start = await host.ok('kingdown_get', { game_id });
  expect(view(start)).toMatchObject({ opponent: { icon: 'frost', rating: { rating: 1500, provisional: true } }, abort_open: true });
  expect(view(await host.ok('kingdown_get', { game_id, since_revision: 1 })).opponent?.rating).toBeUndefined();
  await host.ok('kingdown_move', move(start, plain(start)));
  const black = await guest.ok('kingdown_get', { game_id });
  await guest.ok('kingdown_move', move(black, plain(black)));
  const both = await host.ok('kingdown_get', { game_id });
  expect(view(both).abort_open).toBe(false);
  expect((await host.ok('kingdown_games'))._meta.games[0]).toMatchObject({ move: 2, opponent: { icon: 'frost' } });
  await guest.ok('kingdown_resign', { game_id });
  const finished = await host.ok('kingdown_get', { game_id });
  expect(view(finished).outcome).toMatchObject({ rating_before: 1500, rating: expect.any(Number), provisional: true, badges: expect.arrayContaining([expect.objectContaining({ badge: 'first_win' })]) });
  expect(view(finished).outcome!.rating).toBeGreaterThan(1500);
  expect(view(await host.ok('kingdown_get', { game_id, since_revision: view(finished).revision })).outcome).toBeUndefined();
  const board = await host.ok('kingdown_open',{game_id});
  const poll = await host.ok('kingdown_get',{board_id:board._meta.board_id,since_revision:view(finished).revision});
  expect(view(poll).outcome).toBeUndefined(); expect(view(poll).opponent?.rating).toBeUndefined();
  for (const kind of ['friend', 'random'] as const) {
   const waiting = await host.ok('kingdown_create', { kind, options }), id = view(waiting).game_id;
   if (kind === 'friend') { await host.ok('kingdown_invite', { game_id: id }); await admin.query("update public.game_invites set expires_at=now()-interval '1 minute' where game_id=$1", [id]); }
   else await admin.query("update public.games set created_at=now()-interval '25 hours' where id=$1", [id]);
   await new GameService(new PostgresMatchStore(admin)).sweep();
   const expired = await host.ok('kingdown_get', { game_id: id });
   expect(view(expired).opponent).toBeNull();
   expect(expired.structuredContent.result).toBe(kind === 'friend' ? 'The invitation expired. No result.' : 'No one took your open game. No result.');
  }
 });

 it('previews a friend code without taking a seat and requires a handle for human games', async () => {
  const a = await user('preview-a'), b = await user('preview-b'), host = await connect(a), guest = await connect(b);
  await admin.query('update public.profiles set handle=null where id=$1', [b]);
  await host.ok('kingdown_handle', { icon: 'mud' });
  const options = { ...DEFAULT_OPTIONS, arrangement: false };
  const game_id = view(await host.ok('kingdown_create', { kind: 'friend', colour: 'black', options })).game_id;
  const { code, expires_at } = (await host.ok('kingdown_invite', { game_id })).structuredContent;
  const preview = await guest.ok('kingdown_join', { code, preview: true });
  const opened = await guest.ok('kingdown_open', { code });
  for (const result of [preview, opened]) {
   expect(result.structuredContent.screen).toBe('join');
   expect(result._meta.preview).toEqual({ code, options, colour: 'white', kind: 'friend', creator: { handle: `preview-a-${tag}`, icon: 'mud' }, expires_at });
   for (const secret of [code, `preview-a-${tag}`, 'mud']) expect(JSON.stringify([result.content, result.structuredContent])).not.toContain(secret);
  }
  expect(view(await host.ok('kingdown_get', { game_id })).status).toBe('waiting');
  expect((await rows('select tries from public.invite_code_tries where user_id=$1', [b]))[0].tries).toBe(2);
  expect((await guest.call('kingdown_create', { kind: 'friend', options }))._meta.code).toBe('HANDLE_NEEDED');
  expect((await guest.call('kingdown_join', { code }))._meta.code).toBe('HANDLE_NEEDED');
  await guest.ok('kingdown_handle', { handle: `preview-new-${tag}`, icon: 'spirit' });
  expect(view(await guest.ok('kingdown_join', { code, board_id: opened._meta.board_id })).status).toBe('playing');
  expect((await guest.call('kingdown_join', { code, preview: true }))._meta.code).toBe('INVITE_UNAVAILABLE');
 });

 it('allows Switch now only after the waiting random game gets an opponent after the solo start', async () => {
  const a = await user('switch-a'), b = await user('switch-b'), host = await connect(a), guest = await connect(b);
  const options = { ...DEFAULT_OPTIONS, arrangement: false };
  const playBoth = async () => {
   const solo = await host.ok('kingdown_create', { kind: 'solo', options, level: 'beginner' });
   const moved = await host.ok('kingdown_move', move(solo, plain(solo)));
   return host.ok('kingdown_computer', move(moved));
  };
  const ordinary = await playBoth();
  expect((await host.call('kingdown_abort', move(ordinary)))._meta.code).toBe('NOT_ALLOWED');
  const open = await host.ok('kingdown_find', { options });
  const waitingSolo = await playBoth();
  expect(view(waitingSolo).abort_open).toBe(false);
  await guest.ok('kingdown_accept', { game_id: view(open).game_id });
  expect(view(await host.ok('kingdown_get', { game_id: view(waitingSolo).game_id })).abort_open).toBe(true);
  const switched = await host.ok('kingdown_abort', move(waitingSolo));
  expect(view(switched)).toMatchObject({ status: 'aborted', result: { winner: null, reason: 'abort' } });
  expect((await host.ok('kingdown_profile'))._meta.record.totals.played).toBe(0);
  const later = await playBoth();
  expect((await host.call('kingdown_abort', move(later)))._meta.code).toBe('NOT_ALLOWED');
  // Opening a random game after a computer game starts does not erase that computer game.
  const older = await playBoth();
  const newOpen = await host.ok('kingdown_create', { kind: 'random', options });
  await guest.ok('kingdown_accept', { game_id: view(newOpen).game_id });
  expect((await host.call('kingdown_abort', move(older)))._meta.code).toBe('NOT_ALLOWED');
 }, 60000);

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
  expect((await rows('select reporter_id,reported_id,target,content from public.reports where id=$1', [report._meta.id]))[0]).toEqual({ reporter_id: ann, reported_id: bob, target: 'message', content: 'good_luck' });
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
  const opened = await player.ok('kingdown_open', {game_id:solo.structuredContent.game_id}), {game_id} = opened.structuredContent, {board_id} = opened._meta;
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
  const first = await d.ok('kingdown_open', { game_id: initial.structuredContent.game_id }), board: string = first._meta.board_id, firstGame: string = first.structuredContent.game_id;
  const other = await d.ok('kingdown_open', { game_id: firstGame });
  expect(other.structuredContent).toMatchObject({ game_id: firstGame }); expect(other._meta.board_id).not.toBe(board);
  // White: with no colour the seat is random, and Black has no legal move before the computer plays.
  const created = await d.ok('kingdown_create', { options: { ...DEFAULT_OPTIONS, arrangement: false }, kind: 'solo', colour: 'white', board_id: board }), second: string = created.structuredContent.game_id;
  expect(created.structuredContent).toMatchObject({kind:'solo',speed:'live',colour:'white'}); expect(created._meta.board_id).toBe(board);
  expect((await d.ok('kingdown_get', { game_id: firstGame, board_id: board })).structuredContent.game_id).toBe(second);
  expect((await d.ok('kingdown_get', { game_id: firstGame, board_id: other._meta.board_id })).structuredContent.game_id).toBe(firstGame);
  for (const [name, args] of [['kingdown_get', { game_id: firstGame, board_id: board }], ['kingdown_get', { game_id: firstGame }], ['kingdown_create', { options: { ...DEFAULT_OPTIONS, arrangement: false }, kind: 'solo', board_id: board }], ['kingdown_open', { game_id: firstGame }]] as const)
   expect((await e.call(name, args))._meta.code, name).toBe('FORBIDDEN');
  expect((await rows('select count(*)::int as n from public.games where created_by=$1', [eve]))[0].n).toBe(0);
  // A solo move and the computer's reply; then the first game is the most urgent.
  const played = await d.ok('kingdown_move', move(created, plain(created)));
  expect(view(await d.ok('kingdown_computer', move(played))).revision).toBe(2);
  await admin.query('delete from public.games where id=$1', [second]);
  expect((await d.call('kingdown_get', { game_id: second, board_id: board }))._meta.code).toBe('MATCH_REMOVED');
  const resumed = await d.ok('kingdown_resume', { board_id: board });
  expect(resumed.structuredContent).toMatchObject({game_id:firstGame}); expect(resumed._meta.board_id).toBe(board);
  expect((await d.ok('kingdown_get', { game_id: second, board_id: board })).structuredContent.game_id).toBe(firstGame);
 }, 60000);
});
