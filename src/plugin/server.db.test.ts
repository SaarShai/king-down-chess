/** Opt-in: the ChatGPT tools over in-memory MCP against a disposable real PostgreSQL database (PLUGIN_TEST_DATABASE_URL).
 * The tests use their own copy of it (the name with "_chatgpt" before "_test"): a claim needs a deadline in the past,
 * and a sweep of src/match/service.db.test.ts, which runs at the same time, would end that game first. */
import { createHash, createHmac, randomUUID } from 'node:crypto';
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
const SUMMARY = [ 'rating_policy', 'screen', 'colour', 'days_per_move', 'deadline_at', 'draw_offer', 'game_id', 'kind', 'move', 'status', 'your_turn'];

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
   for (const opponent of [meta?.view?.opponent,meta?.preview?.creator,...(meta?.games ?? []).map((g:any)=>g.opponent),...(meta?.lobby?.games ?? []).map((g:any)=>g.creator),...(meta?.history ?? []).map((g:any)=>g.opponent),...(meta?.blocks ?? [])])
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

 it.each([
  ['kingdown_computer', 120, 60], ['kingdown_create', 60, 60], ['kingdown_open', 60, 60], ['kingdown_report', 30, 3600],
 ] as const)('limits %s for each user and resets its window', async (tool, count, seconds) => {
  const actor = await user(`cap-${tool.slice(9)}`), player = await connect(actor);
  const made = await player.ok('kingdown_create', { kind: 'solo', colour: 'black', level: 'beginner', options: { ...DEFAULT_OPTIONS, fairy: false, arrangement: false, classic: true } });
  let reportGame: string | undefined;
  if (tool === 'kingdown_report') {
   const games = new GameService(new PostgresMatchStore(admin));
   reportGame = (await games.create(actor, { kind: 'friend', options: DEFAULT_OPTIONS })).game_id;
   await games.join(await user('cap-peer'), (await games.invite(actor, reportGame)).token);
  }
  const args = tool === 'kingdown_computer' ? move(made) : tool === 'kingdown_create' ? { kind: 'solo' }
   : tool === 'kingdown_report' ? { game_id: reportGame, target: 'player', category: 'harassment' } : {};
  await admin.query(`insert into public.plugin_tool_tries(user_id,tool,tries) values($1,$2,$3)
   on conflict (user_id,tool) do update set tries=$3`, [actor, tool, count - 1]);
  await player.ok(tool, args);
  const before = (await rows(`select (select count(*) from public.games where created_by=$1) as games,
   (select count(*) from public.plugin_boards where actor_id=$1) as boards,
   (select count(*) from public.reports where reporter_id=$1) as reports,
   (select sum(revision) from public.games where created_by=$1) as revisions`, [actor]))[0];
  const limited = await (await connect(actor)).call(tool, args);
  expect(limited).toMatchObject({ isError: true, _meta: { code: 'RATE_LIMITED' } });
  expect(limited.content[0].text).toMatch(tool === 'kingdown_report' ? /Wait one hour/ : /Wait one minute/);
  expect((await rows(`select (select count(*) from public.games where created_by=$1) as games,
   (select count(*) from public.plugin_boards where actor_id=$1) as boards,
   (select count(*) from public.reports where reporter_id=$1) as reports,
   (select sum(revision) from public.games where created_by=$1) as revisions`, [actor]))[0]).toEqual(before);
  const other = await user(`peer-${tool.slice(9)}`);
  await new PluginService(new PostgresMatchStore(admin)).toolTry(other, tool);
  expect((await rows('select tries from public.plugin_tool_tries where user_id=$1 and tool=$2', [other, tool]))[0].tries).toBe(1);
  await player.ok('kingdown_games');
  await new PluginService(new PostgresMatchStore(admin)).toolTry(actor, tool === 'kingdown_open' ? 'kingdown_create' : 'kingdown_open');
  await admin.query("update public.plugin_tool_tries set window_start=now()-$3*interval '1 second' where user_id=$1 and tool=$2", [actor, tool, seconds + 1]);
  const reset = await player.call(tool, args);
  expect(reset._meta?.code).not.toBe('RATE_LIMITED');
  expect((await rows('select tries from public.plugin_tool_tries where user_id=$1 and tool=$2', [actor, tool]))[0].tries).toBe(1);
 });

 it('counts refused tools and admits only one of two calls at the last slot', async () => {
  const actor = await user('limit-race'), player = await connect(actor);
  const args = { game_id: randomUUID(), command_id: randomUUID(), expected_revision: 0 };
  expect((await player.call('kingdown_computer', args)).isError).toBe(true);
  expect((await rows('select tries from public.plugin_tool_tries where user_id=$1', [actor]))[0].tries).toBe(1);
  await admin.query("insert into public.plugin_tool_tries(user_id,tool,tries) values($1,'kingdown_open',59)", [actor]);
  const other = await connect(actor);
  const results = await Promise.all([player.call('kingdown_open'), other.call('kingdown_open')]);
  expect(results.filter(result => result.isError)).toHaveLength(1);
  expect(results.find(result => result.isError)?._meta.code).toBe('RATE_LIMITED');
  expect((await rows('select count(*)::int as n from public.plugin_boards where actor_id=$1', [actor]))[0].n).toBe(1);
 });

 it('counts kingdown_find on the Create limit, so Find and Cancel cannot make games past it', async () => {
  const actor = await user('cap-find'), player = await connect(actor), options = { ...DEFAULT_OPTIONS, fairy: false, arrangement: false, classic: true };
  await admin.query("insert into public.plugin_tool_tries(user_id,tool,tries) values($1,'kingdown_create',59)", [actor]);
  const found = view(await player.ok('kingdown_find', { options }));
  if (found.status === 'waiting') await player.ok('kingdown_cancel', { game_id: found.game_id });
  expect((await rows("select tries from public.plugin_tool_tries where user_id=$1 and tool='kingdown_create'", [actor]))[0].tries).toBe(60);
  const games = async () => (await rows('select count(*)::int as n from public.games where created_by=$1', [actor]))[0].n;
  const before = await games(), limited = await player.call('kingdown_find', { options, any_rules: true });
  expect(limited).toMatchObject({ isError: true, _meta: { code: 'RATE_LIMITED' } }); expect(limited.content[0].text).toMatch(/Too many new games/);
  expect(await games()).toBe(before);
 });

 it('counts a rematch offer on the Create limit, so resign and rematch cannot make games past it, and leaves resign free', async () => {
  const actor = await user('cap-rematch'), player = await connect(actor), options = { ...DEFAULT_OPTIONS, fairy: false, arrangement: false, classic: true };
  const games = async () => (await rows('select count(*)::int as n from public.games where created_by=$1', [actor]))[0].n;
  const tries = async () => (await rows("select tries from public.plugin_tool_tries where user_id=$1 and tool='kingdown_create'", [actor]))[0].tries;
  const first = view(await player.ok('kingdown_create', { kind: 'solo', colour: 'white', level: 'beginner', options }));
  // One slot left: a solo rematch offer makes the next game at once and takes it.
  await admin.query("update public.plugin_tool_tries set tries=59 where user_id=$1 and tool='kingdown_create'", [actor]);
  const resigned = view(await player.ok('kingdown_resign', { game_id: first.game_id, command_id: randomUUID(), expected_revision: first.revision }));
  const offered = view(await player.ok('kingdown_rematch', { game_id: first.game_id, command_id: randomUUID(), expected_revision: resigned.revision, choice: 'offer' }));
  expect(offered.rematch_game_id).toBeTruthy(); expect(await tries()).toBe(60);
  // The limit is spent: resign still works, the next rematch makes no game.
  const second = view(await player.ok('kingdown_get', { game_id: offered.rematch_game_id! }));
  const ended = view(await player.ok('kingdown_resign', { game_id: second.game_id, command_id: randomUUID(), expected_revision: second.revision }));
  expect(ended.status).toBe('finished');
  const before = await games(), limited = await player.call('kingdown_rematch', { game_id: second.game_id, command_id: randomUUID(), expected_revision: ended.revision, choice: 'offer' });
  expect(limited).toMatchObject({ isError: true, _meta: { code: 'RATE_LIMITED' } }); expect(limited.content[0].text).toMatch(/Too many new games/);
  expect(await games()).toBe(before);
  expect((await rows('select rematch_game_id from public.games where id=$1', [second.game_id]))[0].rematch_game_id).toBeNull();
 });

 it('stores an HMAC for short codes and joins with the same code after a server restart', async () => {
  const actor = await user('hmac-host'), guestId = await user('hmac-guest'), host = await connect(actor), guest = await connect(guestId);
  const game = view(await host.ok('kingdown_create', { kind: 'friend', options: DEFAULT_OPTIONS })).game_id;
  const { code, token } = await new PluginService(new PostgresMatchStore(admin)).invite(actor, game);
  const stored = (await rows('select code_hash,token_hash from public.game_invites where game_id=$1', [game]))[0];
  expect(stored.code_hash).not.toBe(createHash('sha256').update(code).digest('hex'));
  expect(stored.code_hash).toBe(createHmac('sha256', process.env.KINGDOWN_INTERNAL_SECRET!).update('kingdown:invite-code:').update(code).digest('hex'));
  expect(stored.token_hash).toBe(createHash('sha256').update(token).digest('hex'));
  const changed = new GameService(new PostgresMatchStore(admin), 'another-test-secret-for-invite-codes');
  await expect(changed.preview(guestId, code)).rejects.toMatchObject({ code: 'INVITE_UNAVAILABLE' });
  expect((await guest.ok('kingdown_join', { code: code.toLowerCase().replace(/^(...)/, '$1-'), preview: true }))._meta.preview.code).toBe(code);
  expect(view(await (await connect(guestId)).ok('kingdown_join', { code })).game_id).toBe(game);
 });

 it('previews and joins a legacy SHA-256 short code', async () => {
  const actor = await user('legacy-host'), guest = await user('legacy-guest'), games = new GameService(new PostgresMatchStore(admin));
  const game = (await games.create(actor, { kind: 'friend', options: DEFAULT_OPTIONS, colour: 'white' })).game_id, code = 'K7QX2M';
  await admin.query('insert into public.game_invites(token_hash,code_hash,game_id,seat,created_by,expires_at) values($1,$2,$3,1,$4,now()+interval \'7 days\')',
   [createHash('sha256').update(randomUUID()).digest('hex'), createHash('sha256').update(code).digest('hex'), game, actor]);
  expect(await games.preview(guest, 'k7q-x2m')).toMatchObject({ code, colour: 'black', creator: { handle: `legacy-host-${tag}` } });
  expect(await games.join(guest, 'k7q-x2m')).toMatchObject({ game_id: game, seat: 1, revision: 1 });
  expect(await games.join(guest, code)).toMatchObject({ game_id: game, seat: 1, revision: 1 });
  await expect(games.preview(await user('legacy-late'), code)).rejects.toMatchObject({ code: 'INVITE_UNAVAILABLE' });
 });

 it('prefers the HMAC game when a legacy row has the same short code and leaves that row unlocked', async () => {
  const actor = await user('prefer-host'), oldActor = await user('prefer-old'), guest = await user('prefer-guest');
  const games = new GameService(new PostgresMatchStore(admin));
  const oldGame = (await games.create(oldActor, { kind: 'friend', options: DEFAULT_OPTIONS, colour: 'black' })).game_id;
  const game = (await games.create(actor, { kind: 'friend', options: DEFAULT_OPTIONS, colour: 'white' })).game_id;
  const { code } = await games.invite(actor, game);
  await admin.query('insert into public.game_invites(token_hash,code_hash,game_id,seat,created_by,expires_at) values($1,$2,$3,0,$4,now()+interval \'7 days\')',
   [createHash('sha256').update(randomUUID()).digest('hex'), createHash('sha256').update(code).digest('hex'), oldGame, oldActor]);
  const lock = await admin.connect(), pool = new pg.Pool({ connectionString: admin.options.connectionString, max: 1, options: '-c lock_timeout=1000' });
  try {
   await lock.query('begin');
   await lock.query('select from public.games where id=$1 for update', [oldGame]);
   await lock.query('select from public.game_invites where game_id=$1 for update', [oldGame]);
   const joining = new GameService(new PostgresMatchStore(pool));
   expect(await joining.preview(guest, code)).toMatchObject({ code, colour: 'black', creator: { handle: `prefer-host-${tag}` } });
   expect(await joining.join(guest, code)).toMatchObject({ game_id: game, seat: 1, revision: 1 });
   expect(await joining.join(guest, code)).toMatchObject({ game_id: game, seat: 1, revision: 1 });
   await expect(joining.preview(oldActor, code)).rejects.toMatchObject({ code: 'INVITE_UNAVAILABLE' });
   await expect(joining.join(oldActor, code)).rejects.toMatchObject({ code: 'INVITE_UNAVAILABLE' });
   expect((await lock.query('select used_by,used_at from public.game_invites where game_id=$1', [oldGame])).rows[0]).toEqual({ used_by: null, used_at: null });
   expect((await lock.query('select user_id from public.game_players where game_id=$1 and seat=0', [oldGame])).rows[0]).toEqual({ user_id: null });
   expect((await lock.query('select status,revision from public.games where id=$1', [oldGame])).rows[0]).toEqual({ status: 'waiting', revision: 0 });
   expect((await lock.query("select count(*)::int as n from public.game_commands where game_id=$1 and kind='join'", [oldGame])).rows[0].n).toBe(0);
  } finally { await lock.query('rollback'); lock.release(); await pool.end(); }
 });

 it('checks the code-try limit before any invitation lookup', async () => {
  const guest = await user('code-limit');
  await admin.query('insert into public.invite_code_tries(user_id,tries) values($1,10)', [guest]);
  const lock = await admin.connect(), pool = new pg.Pool({ connectionString: admin.options.connectionString, max: 1, options: '-c lock_timeout=1000' });
  try {
   await lock.query('begin');
   await lock.query('lock table public.game_invites in access exclusive mode');
   const games = new GameService(new PostgresMatchStore(pool));
   await expect(games.preview(guest, 'K7QX2M')).rejects.toMatchObject({ code: 'RATE_LIMITED', status: 429 });
   await expect(games.join(guest, 'K7QX2M')).rejects.toMatchObject({ code: 'RATE_LIMITED', status: 429 });
  } finally { await lock.query('rollback'); lock.release(); await pool.end(); }
 });

 it('refuses short codes without a valid secret and keeps old long links usable', async () => {
  const actor = await user('hmac-old'), guest = await user('old-guest'), store = new PostgresMatchStore(admin), games = new GameService(store);
  const game = (await games.create(actor, { kind: 'friend', options: DEFAULT_OPTIONS })).game_id;
  const { code, token } = await games.invite(actor, game);
  await admin.query('update public.game_invites set code_hash=$2 where game_id=$1', [game, createHash('sha256').update(code).digest('hex')]);
  for (const secret of ['', 'too-short']) {
   const missing = new GameService(store, secret);
   await expect(missing.invite(actor, game)).rejects.toMatchObject({ code: 'UNAVAILABLE', status: 503 });
   await expect(missing.preview(guest, code)).rejects.toMatchObject({ code: 'UNAVAILABLE', status: 503 });
   await expect(missing.join(guest, code)).rejects.toMatchObject({ code: 'UNAVAILABLE', status: 503 });
  }
  expect((await new GameService(store, '').join(guest, token)).game_id).toBe(game);
 });

 it('keeps a long invitation token through Open, preview and Join', async () => {
  const actor = await user('token-host'), guest = await connect(await user('token-guest'));
  const games = new GameService(new PostgresMatchStore(admin));
  const game = (await games.create(actor, { kind: 'friend', options: DEFAULT_OPTIONS })).game_id;
  await games.invite(actor, game);
  const token = 'aB-cD_'.repeat(7) + 'z';
  await admin.query('update public.game_invites set token_hash=$2 where game_id=$1', [game, createHash('sha256').update(token).digest('hex')]);
  const opened = await guest.ok('kingdown_open', { code: token });
  expect(opened._meta.preview.code).toBe(token);
  const previewed = await guest.ok('kingdown_join', { code: opened._meta.preview.code, preview: true });
  expect(previewed._meta.preview.code).toBe(token);
  expect(view(await guest.ok('kingdown_join', { code: previewed._meta.preview.code })).game_id).toBe(game);
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

 it('refuses a start command ID that comes again with other input, on each start path (RV5-3, RV7-1)', async () => {
  const [a, b] = [await user('conflict-a'), await user('conflict-b')], host = await connect(a), guest = await connect(b);
  // Classic switches, which no other test here opens, so the guest's Find takes the host's table.
  const options = { ...DEFAULT_OPTIONS, fairy: false, arrangement: false, classic: true }, cards = { ...options, cards: true };
  const starts = [
   { kind: 'friend', options, command_id: `made-${tag}` }, // a new game
   { kind: 'random', options, command_id: `joined-${tag}` }, // the host's open table
   { kind: 'random', options: cards, command_id: `reused-${tag}` }, // the guest's own open table
  ];
  const table = await host.ok('kingdown_create', { kind: 'random', options }), games = [];
  for (const args of starts.slice(0, 2)) games.push(view(await guest.ok('kingdown_create', args)).game_id);
  const mine = await guest.ok('kingdown_create', { kind: 'random', options: cards });
  games.push(view(await guest.ok('kingdown_create', starts[2])).game_id);
  expect(games.slice(1)).toEqual([view(table).game_id, view(mine).game_id]);
  await guest.ok('kingdown_abort', { game_id: games[1] });
  for (const [n, args] of starts.entries()) {
   for (const other of [{ kind: 'solo' }, { colour: 'black' }, { options: { ...args.options, kingPowers: true } }, ...args.kind === 'random' ? [{ any_rules: true }] : []])
    expect((await guest.call('kingdown_create', { ...args, ...other }))._meta.code).toBe('COMMAND_CONFLICT');
   expect(view(await guest.ok('kingdown_create', args)).game_id).toBe(games[n]);
  }
  expect((await guest.call('kingdown_find', { options, command_id: `made-${tag}` }))._meta.code).toBe('COMMAND_CONFLICT');
  expect((await rows('select count(*)::int as n from public.games where created_by=$1', [b]))[0].n).toBe(2);
  await guest.ok('kingdown_cancel', { game_id: view(mine).game_id });
 });

 it('gives a resent Find its own open game after another player takes the seat, and shows no Find times (RV5-4, RV7-2)', async () => {
  const [a, b] = [await user('own-find-a'), await user('own-find-b')], host = await connect(a), guest = await connect(b);
  const options = { ...DEFAULT_OPTIONS, fairy: false, arrangement: false, classic: true, kingPowers: true }, args = { options, command_id: `own-find-${tag}` };
  const open = await host.ok('kingdown_create', { kind: 'random', options });
  // The first Find reuses the host's open game, and its reply is lost. A second Find reuses it again. Then the guest takes the seat.
  expect(view(await host.ok('kingdown_find', args)).game_id).toBe(view(open).game_id);
  await host.ok('kingdown_find', { options, command_id: `own-find-2-${tag}` });
  const accepted = view(await guest.ok('kingdown_accept', { game_id: view(open).game_id, rating_policy:view(open).rating_policy }));
  // The Find receipts are not moves: the guest sees only the join, so no time shows when the host chose Find.
  expect(accepted).toMatchObject({ revision: 3, last_commands: [{ seq: 3, seat: accepted.seat, action: { type: 'join' } }] });
  expect(view(await host.ok('kingdown_find', args)).game_id).toBe(view(open).game_id);
  expect((await rows('select id from public.games where created_by=$1', [a])).map(row => row.id)).toEqual([view(open).game_id]);
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

 it('saves Haste and its second move in one revision and one command row', async () => {
  const actor = await user('whole-turn'), player = await connect(actor);
  const created = await new GameService(new PostgresMatchStore(admin)).create(actor,{kind:'solo',colour:'white',setup:{kings:'Flame:Haste,none',fen:'7k/8/8/r3r3/8/8/8/R5K1 w - - 0 1'}});
  const args = {game_id:created.game_id,command_id:randomUUID(),expected_revision:created.revision,actions:['Ra1-a2!H','Ra2-a3']};
  const moved = await player.ok('kingdown_move',args);
  expect(view(moved)).toMatchObject({revision:1,turn:1,action:'waiting',status:'playing'});
  expect(view(moved).last_commands).toMatchObject([{seq:1,seat:0,action:{type:'turn',actions:args.actions}}]);
  expect(view(await player.ok('kingdown_move',args)).revision).toBe(1);
  expect(await rows('select revision from public.games where id=$1',[created.game_id])).toEqual([{revision:1}]);
  expect(await rows('select seq,command_id,actions from public.game_commands where game_id=$1',[created.game_id])).toEqual([{seq:1,command_id:args.command_id,actions:args.actions}]);
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
  expect(view(await guest.ok('kingdown_accept', { game_id, board_id: guestBoard, rating_policy:view(found).rating_policy }))).toMatchObject({ status: 'playing', seat: 1 });
  expect(view(await guest.ok('kingdown_accept', { game_id, board_id: guestBoard, rating_policy:view(found).rating_policy })).revision).toBe(1);
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
   expect(JSON.stringify(result, (key, value) => key === 'setup_admission' ? undefined : value)).not.toContain('Flame');
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

 it('keeps Friends only as the default and checks all three online values through the tools', async () => {
  const [a, b] = [await user('online-a'), await user('online-b')], host = await connect(a), guest = await connect(b);
  const game_id = view(await host.ok('kingdown_create', { kind: 'friend', options: { ...DEFAULT_OPTIONS, arrangement: false } })).game_id;
  await guest.ok('kingdown_join', { code: (await host.ok('kingdown_invite', { game_id })).structuredContent.code });
  const state = async () => [(await rows('select online_visible_to from public.profiles where id=$1', [a]))[0].online_visible_to, view(await guest.ok('kingdown_get', { game_id })).opponent!.last_seen_ms];
  expect((await host.ok('kingdown_settings'))._meta.settings.online_visible_to).toBe('mutual');
  expect(await state()).toEqual(['mutual', null]);
  await admin.query("insert into public.relations(user_id,other_id,kind) values($1,$2,'follow')", [b,a]);
  expect(await state()).toEqual(['mutual', null]);
  await admin.query("insert into public.relations(user_id,other_id,kind) values($1,$2,'follow')", [a,b]);
  for (const online_visible_to of ['everyone', 'nobody', 'mutual']) {
   expect((await host.ok('kingdown_settings', { online_visible_to }))._meta.settings).toMatchObject({ online_visible_to, symbols_only: false });
   expect(await state()).toEqual([online_visible_to, online_visible_to === 'nobody' ? null : expect.any(Number)]);
   expect((await host.ok('kingdown_open'))._meta.settings.online_visible_to).toBe(online_visible_to);
  }
  for (const input of [{ online_visible_to: true }, { online_visible_to: 'friends' }, { show_online: true }]) expect((await host.call('kingdown_settings', input))._meta.code).toBe('INVALID_INPUT');
 });

 it('blocks and unblocks through account relations, Find, joins and hidden messages', async () => {
  const [a,b] = [await user('block-a'), await user('block-b')], host = await connect(a), guest = await connect(b);
  const options = { ...DEFAULT_OPTIONS, arrangement: false, kingPowers: false, cards: false };
  const game_id = view(await host.ok('kingdown_create', { kind: 'friend', options })).game_id;
  const joined = await guest.ok('kingdown_join', { code: (await host.ok('kingdown_invite', { game_id })).structuredContent.code });
  const said = await guest.ok('kingdown_say', { ...move(joined), preset: 'hello' });
  expect(view(await host.ok('kingdown_get', { game_id })).last_commands.at(-1)!.action.type).toBe('say');
  await admin.query("insert into public.relations(user_id,other_id,kind) values($1,$2,'follow'),($2,$1,'follow')", [a,b]);
  expect((await host.ok('kingdown_block', { game_id }))._meta.blocked).toBe(false);
  for (let n=0;n<2;n++) {
   const blocked = await host.ok('kingdown_block', { game_id, blocked: true });
   expect(blocked._meta.blocked).toBe(true);
   expect(blocked.content[0].text).toBe('Player blocked. Your current game continues.');
   expect(view(blocked).status).toBe('playing');
   expect(view(blocked).last_commands.at(-1)!.action.type).toBe('hidden');
  }
  expect(await rows('select user_id,other_id,kind from public.relations where user_id=$1 or user_id=$2', [a,b])).toEqual([{user_id:a,other_id:b,kind:'block'}]);
  expect((await (await connect(a)).ok('kingdown_block', { game_id }))._meta.blocked).toBe(true);
  expect((await guest.ok('kingdown_block', { game_id }))._meta.blocked).toBe(false);
  await guest.ok('kingdown_say', { ...move(said), preset: 'thanks' });
  expect(view(await host.ok('kingdown_get', { game_id })).last_commands.slice(-2).map(c=>c.action.type)).toEqual(['hidden','hidden']);
  // Seed an open table: the Create tool may join a table from an earlier test.
  const waiting = (await new GameService(new PostgresMatchStore(admin)).create(a, { kind: 'random', options })).game_id;
  expect((await guest.ok('kingdown_lobby'))._meta.lobby.games.some((g:any)=>g.game_id===waiting)).toBe(false);
  expect((await guest.call('kingdown_accept', { game_id: waiting, rating_policy:'casual' }))._meta.code).toBe('FORBIDDEN');
  const found = view(await guest.ok('kingdown_find', { options }));
  expect(found.game_id).not.toBe(waiting);
  await guest.ok('kingdown_abort', { game_id: found.game_id });
  const friend = view(await host.ok('kingdown_create', { kind: 'friend', options })).game_id;
  const code = (await host.ok('kingdown_invite', { game_id: friend })).structuredContent.code;
  expect((await guest.call('kingdown_join', { code })).isError).toBe(true);
  const unblocked = await host.ok('kingdown_block', { game_id, blocked: false });
  expect(unblocked._meta.blocked).toBe(false);
  expect(view(unblocked).last_commands.at(-1)!.action.type).toBe('say');
  expect(await rows('select kind from public.relations where user_id=$1 or user_id=$2', [a,b])).toEqual([]);
  expect((await guest.ok('kingdown_lobby'))._meta.lobby.games.some((g:any)=>g.game_id===waiting)).toBe(true);
  expect(view(await guest.ok('kingdown_accept', { game_id: waiting, rating_policy:'casual' })).game_id).toBe(waiting);
  expect(view(await guest.ok('kingdown_join', { code })).game_id).toBe(friend);
 });

 it('reads block status without a write and refuses other accounts, solo games and bad input', async () => {
  const [a,b,c] = [await user('target-a'),await user('target-b'),await user('target-c')], host = await connect(a), guest = await connect(b), stranger = await connect(c), reader = await connect(a,readOnly);
  const game_id = view(await host.ok('kingdown_create', { kind:'friend', options:{...DEFAULT_OPTIONS,arrangement:false} })).game_id;
  await guest.ok('kingdown_join', { code:(await host.ok('kingdown_invite',{game_id})).structuredContent.code });
  expect((await reader.ok('kingdown_block',{game_id}))._meta.blocked).toBe(false);
  expect((await stranger.call('kingdown_block',{game_id,blocked:true}))._meta.code).toBe('NOT_FOUND');
  const solo = view(await host.ok('kingdown_create',{kind:'solo'})).game_id;
  expect((await host.call('kingdown_block',{game_id:solo,blocked:true}))._meta.code).toBe('NOT_FOUND');
  for (const input of [{ blocked:true },{ game_id,blocked:'yes' },{game_id,user_id:b},{game_id,actorId:c},{game_id:'bad',blocked:true}]) expect((await host.call('kingdown_block',input))._meta.code).toBe('INVALID_INPUT');
  await host.ok('kingdown_block',{game_id,blocked:true});
  await host.ok('kingdown_resign',{game_id});
  expect((await host.ok('kingdown_block',{game_id,blocked:true})).content[0].text).toBe('Player blocked.');
  expect((await host.ok('kingdown_profile'))._meta.blocks).toEqual([{user_id:b,handle:`target-b-${tag}`}]);
  expect((await stranger.ok('kingdown_profile'))._meta.blocks).toEqual([]);
  expect((await host.ok('kingdown_block',{user_id:b,blocked:false}))._meta.blocked).toBe(false);
  expect((await host.ok('kingdown_profile'))._meta.blocks).toEqual([]);
  expect(await rows("select from public.relations where kind='block' and user_id=$1",[a])).toEqual([]);
 });

 it('refuses rematch offers and accepts across a block in either direction', async () => {
  const [a,b] = [await user('rematch-a'), await user('rematch-b')], host = await connect(a), guest = await connect(b);
  for (const blocker of [host, guest]) {
   const game_id = view(await host.ok('kingdown_create', { kind:'friend', options:{...DEFAULT_OPTIONS,arrangement:false,kingPowers:false,cards:false} })).game_id;
   await guest.ok('kingdown_join', { code:(await host.ok('kingdown_invite',{game_id})).structuredContent.code });
   const ended = await host.ok('kingdown_resign', { game_id });
   const offered = await host.ok('kingdown_rematch', { ...move(ended), choice:'offer' });
   await blocker.ok('kingdown_block', { game_id, blocked:true });
   for (const player of [host, guest]) expect(view(await player.ok('kingdown_get',{game_id})).rematch_allowed).toBe(false);
   expect((await guest.call('kingdown_rematch',{...move(offered),choice:'accept'}))._meta.code).toBe('NOT_ALLOWED');
   const declined = await guest.ok('kingdown_rematch',{...move(offered),choice:'decline'});
   for (const player of [host, guest]) expect((await player.call('kingdown_rematch',{...move(declined),choice:'offer'}))._meta.code).toBe('NOT_ALLOWED');
   expect((await rows('select rematch_game_id from public.games where id=$1',[game_id]))[0].rematch_game_id).toBeNull();
   await blocker.ok('kingdown_block',{game_id,blocked:false});
   expect(view(await host.ok('kingdown_get',{game_id})).rematch_allowed).toBe(true);
   const nextOffer = await host.ok('kingdown_rematch',{...move(declined),choice:'offer'});
   expect(view(await guest.ok('kingdown_rematch',{...move(nextOffer),choice:'accept'})).rematch_game_id).toEqual(expect.any(String));
  }
 });

 it('keeps old blocks reachable after 1000 newer follows and pages every block', async () => {
  const a = await user('paged-blocks'), host = await connect(a), targets = Array.from({length:1052},()=>randomUUID()).sort();
  users.push(...targets);
  await admin.query('insert into auth.users(id) select unnest($1::uuid[])',[targets]);
  await admin.query("insert into public.relations(user_id,other_id,kind,created_at) select $1,id,'block',now()-interval '1 day' from unnest($2::uuid[]) id",[a,targets.slice(0,52)]);
  await admin.query("insert into public.relations(user_id,other_id,kind) select $1,id,'follow' from unnest($2::uuid[]) id",[a,targets.slice(52)]);
  const first = (await host.ok('kingdown_profile'))._meta;
  expect(first.blocks.map((row:any)=>row.user_id)).toEqual(targets.slice(0,50));
  expect(first.next_blocks_after).toBe(targets[49]);
  // Removing the cursor's row must not hide the next page.
  await host.ok('kingdown_block',{user_id:targets[49],blocked:false});
  const last = (await host.ok('kingdown_profile',{blocks_after:first.next_blocks_after}))._meta;
  expect(last.blocks.map((row:any)=>row.user_id)).toEqual(targets.slice(50,52));
  expect(last.next_blocks_after).toBeNull();
  for (const {user_id} of last.blocks) await host.ok('kingdown_block',{user_id,blocked:false});
  expect((await host.ok('kingdown_profile',{blocks_after:first.next_blocks_after}))._meta.blocks).toEqual([]);
  expect((await host.call('kingdown_profile',{blocks_after:'bad'}))._meta.code).toBe('INVALID_INPUT');
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
  expect((await player.ok('kingdown_settings'))._meta.settings).toEqual({ symbols_only: false, show_threats: false, online_visible_to: 'mutual', last_setup: null });
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
  expect(tools).toHaveLength(27);
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
  expect(reopened._meta.settings).toEqual({ symbols_only: true, show_threats: true, online_visible_to: 'mutual', last_setup });
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
  expect(view(finished).outcome).toMatchObject({ rating_before: null, rating: null, provisional: true, badges: expect.arrayContaining([expect.objectContaining({ badge: 'first_win' })]) });
  expect(view(finished).rating_policy).toBe('casual');
  expect(await rows('select * from public.rating_history where game_id=$1',[game_id])).toEqual([]);
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
  await guest.ok('kingdown_accept', { game_id: view(open).game_id, rating_policy:view(open).rating_policy });
  expect(view(await host.ok('kingdown_get', { game_id: view(waitingSolo).game_id })).abort_open).toBe(true);
  const switched = await host.ok('kingdown_abort', move(waitingSolo));
  expect(view(switched)).toMatchObject({ status: 'aborted', result: { winner: null, reason: 'abort' } });
  expect((await host.ok('kingdown_profile'))._meta.record.totals.played).toBe(0);
  const later = await playBoth();
  expect((await host.call('kingdown_abort', move(later)))._meta.code).toBe('NOT_ALLOWED');
  // Opening a random game after a computer game starts does not erase that computer game.
  const older = await playBoth();
  const newOpen = await host.ok('kingdown_create', { kind: 'random', options });
  await guest.ok('kingdown_accept', { game_id: view(newOpen).game_id, rating_policy:view(newOpen).rating_policy });
  expect((await host.call('kingdown_abort', move(older)))._meta.code).toBe('NOT_ALLOWED');
 }, 60000);

 it('plays a Daily friend game between two ChatGPT players and shows the model no position and no opponent text', async () => {
  const host = await connect(ann), guest = await connect(bob), handles = [`ann-${tag}`, `bob-${tag}`];
  const created = await host.ok('kingdown_create', { options: { ...DEFAULT_OPTIONS, arrangement: false }, kind: 'friend', colour: 'white' });
  expect(created.structuredContent).toMatchObject({ kind: 'friend', days_per_move: 3, status: 'waiting', colour: 'white', your_turn: false });
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
  expect(tools.filter(tool => tool.annotations?.readOnlyHint).map(tool => tool.name).sort()).toEqual(['kingdown_games', 'kingdown_get', 'kingdown_lobby', 'kingdown_preview', 'kingdown_profile']);
  const solo = await player.ok('kingdown_create', { kind: 'solo', options: { ...DEFAULT_OPTIONS, arrangement: false } });
  const opened = await player.ok('kingdown_open', {game_id:solo.structuredContent.game_id}), {game_id} = opened.structuredContent, {board_id} = opened._meta;
  expect(view(opened)).toMatchObject({ kind: 'solo', revision: 0, action: 'ready' });
  for (const args of [{ game_id }, { game_id, since_revision: 0 }, { game_id, board_id }, { game_id, since_revision: 0, board_id }]) await reader.ok('kingdown_get', args);
  for (const actions of [[], [view(opened).legal[0]]]) {
   const preview = await reader.ok('kingdown_preview', { game_id, expected_revision: 0, engine_fingerprint: view(opened).engine_fingerprint, actions });
   expect(preview._meta.draft).toMatchObject({ game_id, revision: 0, engine_fingerprint: view(opened).engine_fingerprint, actions });
   expect(preview._meta.draft.positions).toHaveLength(actions.length + 1);
   expect(preview._meta.draft.positions[0].fen).toBe(view(opened).fen);
  }
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
  expect(created.structuredContent).toMatchObject({kind:'solo',days_per_move:null,colour:'white'}); expect(created._meta.board_id).toBe(board);
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
 it('opens a new board after the cleanup deletes a board record, and never brings back the old ID (server audit F3)', async () => {
  const [fay, gus] = [await user('fay'), await user('gus')], f = await connect(fay), g = await connect(gus), options = { ...DEFAULT_OPTIONS, arrangement: false };
  const boards = async (where: string, value: unknown) => (await rows(`select count(*)::int as n from public.plugin_boards where ${where}`, [value]))[0].n;
  const game: string = (await f.ok('kingdown_create', { kind: 'solo', options })).structuredContent.game_id;
  const board: string = (await f.ok('kingdown_open', { game_id: game }))._meta.board_id, home: string = (await f.ok('kingdown_open'))._meta.board_id;
  const live: string = (await f.ok('kingdown_open', { game_id: game }))._meta.board_id;
  await admin.query('delete from public.plugin_boards where id=any($1)', [[board, home]]); // as the 7-day cleanup does
  expect((await f.call('kingdown_get', { board_id: board }))._meta.code).toBe('BOARD_EXPIRED');
  expect((await g.call('kingdown_get', { board_id: live }))._meta.code).toBe('FORBIDDEN');
  expect((await g.call('kingdown_resume', { board_id: board, game_id: game }))._meta.code).toBe('FORBIDDEN');
  expect(await boards('actor_id=$1', gus)).toBe(0);
  const resumed = await f.ok('kingdown_resume', { board_id: board, game_id: game });
  expect(resumed.structuredContent.game_id).toBe(game); expect(resumed._meta.board_id).not.toBe(board);
  expect((await f.ok('kingdown_get', { board_id: resumed._meta.board_id })).structuredContent.game_id).toBe(game);
  const created = await f.ok('kingdown_create', { kind: 'solo', options, board_id: home });
  expect(created._meta.board_id).not.toBe(home);
  expect((await f.ok('kingdown_get', { board_id: created._meta.board_id })).structuredContent.game_id).toBe(created.structuredContent.game_id);
  expect(await boards('id=any($1)', [board, home])).toBe(0);
  // A recovery counts as an Open, so made-up board IDs make no boards past that limit.
  await admin.query("insert into public.plugin_tool_tries(user_id,tool,tries) values($1,'kingdown_open',60) on conflict (user_id,tool) do update set tries=60", [fay]);
  const before = await boards('actor_id=$1', fay);
  expect((await f.call('kingdown_resume', { board_id: randomUUID(), game_id: game }))._meta.code).toBe('RATE_LIMITED');
  expect(await boards('actor_id=$1', fay)).toBe(before);
 }, 60000);
});
