/**
 * Opt-in tests of /api and /internal over real HTTP and PostgreSQL, driven by the website client, with session tokens
 * from a local key set. The services run as a copy of the reviewed runtime role. PLUGIN_TEST_DATABASE_URL must name a
 * disposable loopback database; the tests make and use their own copy of it (the name with "_api" before "_test"),
 * because the jobs act on every game in the database.
 */
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { createServer, request, type Server } from 'node:http';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import pg from 'pg';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createPluginServer } from '../plugin/server';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { DEFAULT_OPTIONS, type Choice } from '../match/setup';
import type { View } from '../match/protocol';
import { GameService, TURN_DAYS } from '../match/service';
import { PostgresMatchStore } from '../match/store';
import { AccountService } from '../online/accounts';
import { onlineClient, type OnlineClient } from '../online/client';
import { PluginService } from '../plugin/service';
import { SafetyService } from '../online/safety';
import { createWebAccountAccess } from './account-access';
import { createApiHandler, createInternalHandler, MAX_API_BODY, sessionVerifier, type ApiOptions } from './http';
import { ownTestDatabase } from '../../tools/plugin-db/own-test-db';
import { withRoleLock } from '../../tools/plugin-db/role-lock.mjs';

const operations = new Set([
 'GET /api/status',
 'POST /api/games',
 'GET /api/games/:id',
 'POST /api/games/:id/seen',
 'POST /api/games/:id/commands',
 'POST /api/games/:id/preview',
 'POST /api/games/:id/invite',
 'POST /api/invites/redeem',
 'GET /api/me/games',
 'GET /api/friends',
 'POST /api/invites/:id/decline',
 'GET /api/me/profile',
 'PATCH /api/me/profile',
 'POST /api/me/handle',
 'POST /api/me/deletion',
 'DELETE /api/me/deletion',
 'GET /api/me/notifications',
 'PUT /api/me/notifications',
 'GET /api/relations',
 'POST /api/relations',
 'DELETE /api/relations',
 'POST /api/reports',
 'POST /api/invites/preview',
 'GET /api/lobby',
 'POST /api/games/find',
 'POST /api/games/:id/accept',
 'POST /api/games/:id/cancel',
 'GET /api/me/settings',
 'PATCH /api/me/settings',
 'GET /api/me/record',
 'GET /api/blocks',
 'POST /api/blocks',
]);
const CLASSIC_OPTIONS = { ...DEFAULT_OPTIONS, fairy: false, arrangement: false, classic: true };
const url = process.env.PLUGIN_TEST_DATABASE_URL, supabase = 'https://project.supabase.co', secret = randomUUID() + randomUUID();
const suite = url ? describe : describe.skip;
const plain = (view: View) => view.legal.find(lan => !lan.includes('!'))!;

suite('website API and jobs on PostgreSQL (runtime role, website sessions)', () => {
 let own: URL, admin: pg.Pool, runtime: pg.Pool, runtimeUrl: URL, server: Server, address: string, sign: (sub: string) => Promise<string>;
 let api: ReturnType<typeof createApiHandler>, options: ApiOptions;
 const role = `api_test_${randomUUID().replaceAll('-', '')}`, users: string[] = [], tag = randomUUID().slice(0, 6);
 const rows = async (sql: string, params: unknown[] = []) => (await admin.query(sql, params)).rows;
 const locked = (sql: string) => withRoleLock(own.href, () => admin.query(sql));
 /** A website identity: a signed-in user with a handle, and the client the website would use. */
 async function player(name: string): Promise<{ id: string; api: OnlineClient; handle: string }> {
  const id = randomUUID(), handle = `${name}-${tag}`; users.push(id);
  await admin.query('insert into auth.users(id,email) values($1,$2)', [id, `${id}@example.com`]);
  await admin.query('update public.profiles set handle=$2 where id=$1', [id, handle]);
  return { id, handle, api: onlineClient({ token: () => sign(id), origin: address, wait: async () => {} }) };
 }
 const internal = (path: string, key = secret) => fetch(`${address}/internal/${path}`, { method: 'POST', headers: { 'X-Kingdown-Internal': key, 'Content-Type': 'application/json' }, body: '{}' });
 const raw = (path: string, headers: Record<string, string>, body?: string) => new Promise<{ status: number; cors: string | string[] | undefined }>((resolve, reject) => {
  const req = request(address + path, { method: 'POST', headers }, res => { res.resume(); res.on('end', () => resolve({ status: res.statusCode!, cors: res.headers['access-control-allow-origin'] })); });
  req.on('error', reject); if (body) req.write(body); req.end();
 });

 beforeAll(async () => {
  own = await ownTestDatabase('api');
  admin = new pg.Pool({ connectionString: own.href, max: 2 });
  const password = randomUUID();
  await locked(`${(await readFile(new URL('../../plugin-deploy/runtime-role.sql', import.meta.url), 'utf8')).replaceAll('kingdown_plugin_runtime', role)}; alter role ${role} password '${password}'`);
  runtimeUrl = new URL(own.href); runtimeUrl.username = role; runtimeUrl.password = password;
  runtime = new pg.Pool({ connectionString: runtimeUrl.href, max: 4 });
  const store = new PostgresMatchStore(runtime), games = new GameService(store, secret);
  const pair = await generateKeyPair('ES256'), keys = createLocalJWKSet({ keys: [{ ...await exportJWK(pair.publicKey), kid: 'local', alg: 'ES256' }] });
  sign = sub => { const now = Math.floor(Date.now() / 1000); return new SignJWT({ iss: `${supabase}/auth/v1`, aud: 'authenticated', sub, role: 'authenticated', is_anonymous: false, iat: now, exp: now + 600 }).setProtectedHeader({ alg: 'ES256', kid: 'local' }).sign(pair.privateKey); };
  server = createServer(); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  address = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  options = { games, players: new PluginService(store, secret), accounts: new AccountService(store), safety: new SafetyService(store), publicOrigin: address, operations, verify: sessionVerifier(supabase, keys), webAccountAccess: async () => ({ enabled: true, expiresAt: performance.now() + 5000 }), admit: () => () => {}, currentUser: async () => {} };
  api = createApiHandler(options);
  const jobs = createInternalHandler({ games, publicOrigin: address, secret });
  // This listener checks the handlers. The compiled check covers the function entry.
  server.on('request', (req, res) => { void (/^\/internal(\/|$)/.test(req.url!) ? jobs : api)(req, res); });
 }, 60_000);
 afterAll(async () => {
  server?.closeAllConnections(); await new Promise(done => server?.close(done));
  await runtime?.end();
  if (!admin) return;
  await admin.query('delete from public.reports where reporter_id=any($1) or reported_id=any($1)', [users]);
  await admin.query('delete from public.games g where created_by=any($1) or exists(select from public.game_players p where p.game_id=g.id and p.user_id=any($1))', [users]);
  await admin.query('delete from public.account_deletions where user_id=any($1)', [users]);
  await admin.query('delete from auth.users where id=any($1)', [users]);
  await admin.query('delete from public.outbox'); // this database is the suite's own
  await locked(`drop owned by ${role}; drop role ${role}`);
  await admin.end();
 });

 it('keeps closed operations clear of the runtime pool and stored data', async () => {
  const actor = await player('closed'), token = await sign(actor.id);
  const tables = await rows("select tablename from pg_tables where schemaname='public' order by tablename");
  const snapshot = () => Promise.all(tables.map(({ tablename }) => rows(`select to_jsonb(t) as row from public."${tablename}" t order by to_jsonb(t)::text`)));
  const before = await snapshot(), query = vi.spyOn(runtime, 'query'), connect = vi.spyOn(runtime, 'connect'), verify = vi.fn(options.verify!);
  try {
   for (const closed of [undefined, new Set<string>()]) {
    api = createApiHandler({ ...options, operations: closed, verify });
    for (const key of operations) {
     const [method, path] = key.split(' ');
     const response = await fetch(address + path.replace(':id', randomUUID()), { method, headers: { Authorization: `Bearer ${token}` }, ...(method !== 'GET' && { body: '{broken' }) });
     expect([key, response.status, response.headers.get('Cache-Control'), await response.json()]).toEqual([key, 404, 'no-store', { code: 'NOT_FOUND', message: 'Not found' }]);
    }
    for (const path of ['/api', '/api/unknown', `/api/games/${randomUUID()}?since=0`]) {
     const response = await fetch(address + path); expect(response.status).toBe(404); await response.arrayBuffer();
    }
   }
   expect(verify).not.toHaveBeenCalled(); expect(query).not.toHaveBeenCalled(); expect(connect).not.toHaveBeenCalled();
   expect(await snapshot()).toEqual(before);
  } finally { api = createApiHandler(options); query.mockRestore(); connect.mockRestore(); }
 });

 it('keeps identity, origin, method and input bounds on enabled real-service routes', async () => {
  const actor = await player('bounds'), token = await sign(actor.id), query = vi.spyOn(runtime, 'query'), connect = vi.spyOn(runtime, 'connect');
  try {
   for (const headers of [{}, { 'X-Kingdown-Dev-Actor': actor.id }] as Record<string, string>[]) {
    const response = await fetch(`${address}/api/me/games`, { headers });
    expect([response.status, response.headers.get('WWW-Authenticate'), response.headers.get('Cache-Control'), (await response.json()).code]).toEqual([401, 'Bearer', 'no-store', 'UNAUTHENTICATED']);
   }
   for (const headers of [{ Origin: 'https://evil.example' }, { Origin: 'null' }, { 'Sec-Fetch-Site': 'cross-site' }] as Record<string, string>[]) {
    const response = await fetch(`${address}/api/me/games`, { headers: { Authorization: `Bearer ${token}`, ...headers } });
    expect([headers, response.status, response.headers.get('Access-Control-Allow-Origin')]).toEqual([headers, 403, null]); await response.arrayBuffer();
   }
   expect(await raw('/api/me/games', { Host: 'evil.example', Authorization: `Bearer ${token}` })).toEqual({ status: 403, cors: undefined });
   const wrong = await fetch(`${address}/api/me/profile`, { method: 'DELETE' });
   expect([wrong.status, wrong.headers.get('Allow')]).toEqual([405, 'GET, PATCH']); await wrong.arrayBuffer();
   for (const path of ['/api', '/api/unknown']) {
    const response = await fetch(address + path); expect([response.status, (await response.json()).code]).toEqual([404, 'NOT_FOUND']);
   }
   for (const [body, status] of [['{broken', 400], ['x'.repeat(MAX_API_BODY + 1), 413]] as const) {
    const response = await fetch(`${address}/api/games`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body });
    expect([response.status, (await response.json()).code]).toEqual([status, 'INVALID_INPUT']);
   }
   expect((await raw('/api/games', { Authorization: `Bearer ${token}` }, 'x'.repeat(MAX_API_BODY + 1))).status).toBe(413);
   expect(query).not.toHaveBeenCalled(); expect(connect).not.toHaveBeenCalled();
  } finally { query.mockRestore(); connect.mockRestore(); }
  expect((await actor.api.profile()).user_id).toBe(actor.id);
 });

 it('keeps one game for a repeated HTTP start and rejects changed input', async () => {
  const host = await player('retry-host'), guest = await player('retry-guest'), command_id = randomUUID().replaceAll('-', ''), token = await sign(host.id);
  const body = { kind: 'friend', options: CLASSIC_OPTIONS, command_id };
  const start = (input = body) => fetch(`${address}/api/games`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  const first = await start(), made = await first.json(); expect(first.status).toBe(201);
  const second = await start(), retry = await second.json(); expect(second.status).toBe(201); expect(retry.view.game_id).toBe(made.view.game_id);
  expect((await rows('select id from public.games where created_by=$1', [host.id])).map(row => row.id)).toEqual([made.view.game_id]);
  const changed = await start({ ...body, options: DEFAULT_OPTIONS }); expect([changed.status, (await changed.json()).code]).toEqual([409, 'COMMAND_CONFLICT']);
  expect(retry.invite).toBeUndefined(); expect(retry.view.invite_id).toBe(made.invite.invite_id);
  await guest.api.redeem({ token: made.invite.token });
  const joined = await start(); expect(joined.status).toBe(201); expect(await joined.json()).toMatchObject({ view: { game_id: made.view.game_id, status: 'playing' } });
 }, 60_000);

 it('previews an invitation without a seat or hidden game data', async () => {
  const host = await player('preview-host'), guest = await player('preview-guest');
  const made = await host.api.create({ kind: 'friend', options: { ...DEFAULT_OPTIONS, kingPowers: true } });
  const preview = await fetch(`${address}/api/invites/preview`, { method: 'POST', headers: { Authorization: `Bearer ${await sign(guest.id)}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ token: made.invite!.token }) });
  expect(preview.status).toBe(200);
  const value = await preview.json();
  expect(Object.keys(value).sort()).toEqual(['code', 'colour', 'creator', 'expires_at', 'invite_id', 'kind', 'options', 'recipient_handle', 'recipient_id']);
  expect(value.creator.handle).toBe(host.handle);
  expect((await rows('select user_id from public.game_players where game_id=$1 and user_id is not null', [made.view.game_id])).map(row => row.user_id)).toEqual([host.id]);
  await expect(guest.api.game(made.view.game_id)).rejects.toMatchObject({ code: 'FORBIDDEN' });
  expect((await rows('select used_by from public.game_invites where game_id=$1', [made.view.game_id]))[0].used_by).toBeNull();
 }, 60_000);

 it('shares actor-only notice pages between the private HTTP and MCP profile reads', async () => {
  const actor = await player('notice-owner'), other = await player('notice-other');
  await admin.query(`insert into public.notifications(user_id,kind,payload) select $1,'moderation',$2 from generate_series(1,23)`, [actor.id, { action_id: 7, action: 'warning', statement: 'Private decision text.', ends_at: null, report_id: 88, evidence: 'private evidence', private_mark: 'private mark', user_id: other.id }]);
  const mcp = createPluginServer({ service: new PluginService(new PostgresMatchStore(runtime), secret), actorId: actor.id, resourceHtml: '<html>board</html>', publicOrigin: address });
  const client = new Client({ name: 'http-notice-test', version: '1' }), [a,b] = InMemoryTransport.createLinkedPair();
  await mcp.connect(a); await client.connect(b);
  try {
   const first = await actor.api.record(), result = await client.callTool({name:'kingdown_profile',arguments:{}});
   expect(result.isError).not.toBe(true);
   expect(result._meta).toMatchObject({notices:first.notices,next_notices_before:first.next_notices_before});
   expect(first.notices).toHaveLength(20); expect(first.next_notices_before).toBe(first.notices[19].id);
   const last = await actor.api.record({notices_before:first.next_notices_before!}), mcpLast = await client.callTool({name:'kingdown_profile',arguments:{notices_before:first.next_notices_before}});
   expect(last.notices).toHaveLength(3); expect(last.next_notices_before).toBeNull();
   expect(mcpLast._meta).toMatchObject({notices:last.notices,next_notices_before:null});
   expect((await other.api.record()).notices).toEqual([]);
   for (const secret of ['Private decision text.', 'private evidence', 'private mark']) expect(JSON.stringify([result.content,result.structuredContent])).not.toContain(secret);
   for (const secret of ['private evidence','private mark','report_id',other.id]) expect(JSON.stringify(first.notices)).not.toContain(secret);
   expect((await client.callTool({name:'kingdown_profile',arguments:{notices_before:'9223372036854775808'}})).isError).toBe(true);
   await expect(actor.api.record({notices_before:'0'})).rejects.toMatchObject({code:'INVALID_INPUT'});
  } finally { await client.close(); await mcp.close(); }
 }, 30000);

 it('shares one HTTP and MCP game with private setup and one effect for a lost turn reply', async () => {
  const host = await player('cross-host'), guest = await player('cross-guest'), startId = randomUUID().replaceAll('-', '');
  const gameOptions = { ...CLASSIC_OPTIONS, kingPowers: true }, store = new PostgresMatchStore(runtime);
  const connect = async (actorId: string) => {
   const server = createPluginServer({ service: new PluginService(store, secret), actorId, resourceHtml: '<html>board</html>', publicOrigin: address });
   const client = new Client({ name: 'http-cross-test', version: '1' }), [a, b] = InMemoryTransport.createLinkedPair();
   await server.connect(a); await client.connect(b);
   return { call: async (name: string, args: Record<string, unknown>) => {
    const result = await client.callTool({ name, arguments: args });
    expect(result.isError).not.toBe(true);
    return result as typeof result & { _meta: { view: View } };
   }, close: async () => { await client.close(); await server.close(); } };
  };
  const hostMcp = await connect(host.id), guestMcp = await connect(guest.id);
  try {
   const start = await fetch(`${address}/api/games`, { method: 'POST', headers: { Authorization: `Bearer ${await sign(host.id)}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'friend', options: gameOptions, colour: 'white', command_id: startId }) });
   expect(start.status).toBe(201); const made = await start.json(), game_id = made.view.game_id;
   const retried = await hostMcp.call('kingdown_create', { kind: 'friend', options: gameOptions, colour: 'white', command_id: startId });
   expect(retried._meta.view.game_id).toBe(game_id);
   const joined = await guestMcp.call('kingdown_join', { code: made.invite.code }); expect(joined._meta.view.status).toBe('setup');
   const secretChoice: Choice = { king: { king: 'Flame', power: 'Haste' }, order: 'RNBQKBNR' };
   await host.api.command(game_id, joined._meta.view.revision, { type: 'choose', choice: secretChoice, ready: true });
   const hidden = await guestMcp.call('kingdown_get', { game_id });
   expect(hidden._meta.view.choices?.[0]).toBeNull(); expect(hidden._meta.view.last_commands.at(-1)?.action).toEqual({ type: 'hidden' }); expect(JSON.stringify(hidden, (key, value) => key === 'setup_admission' ? undefined : value)).not.toContain('Flame');
   const ready = await guestMcp.call('kingdown_choose', { game_id, command_id: randomUUID(), expected_revision: hidden._meta.view.revision, king: { king: 'Shadow', power: 'Darkness' }, order: 'RNBQKBNR', ready: true });
   const before = await host.api.game(game_id), command_id = randomUUID(), actions = [plain(before)];
   expect(ready._meta.view.status).toBe('playing');
   const moved = (await host.api.command(game_id, before.revision, { type: 'turn', actions }, command_id)).view;
   const retry = await hostMcp.call('kingdown_move', { game_id, command_id, expected_revision: before.revision, actions });
   expect(retry._meta.view.revision).toBe(moved.revision); expect(retry._meta.view.fen).toBe(moved.fen);
   const model = JSON.stringify([retry.content, retry.structuredContent]); expect(model).not.toContain(moved.fen!.split(' ')[0]); expect(model).not.toContain(host.handle);
   expect((await rows('select count(*)::int as n from public.game_commands where game_id=$1 and command_id=$2', [game_id, command_id]))[0].n).toBe(1);
   const end = await guestMcp.call('kingdown_resign', { game_id, command_id: randomUUID(), expected_revision: moved.revision });
   expect((await host.api.game(game_id)).result).toEqual(end._meta.view.result); expect(end._meta.view.status).toBe('finished');
  } finally { await hostMcp.close(); await guestMcp.close(); }
 }, 60_000);

 it('shares the last friend request slot across HTTP lookup and MCP send', async () => {
  const actor = await player('friend-quota');
  const mcp = createPluginServer({ service: new PluginService(new PostgresMatchStore(runtime), secret), actorId: actor.id, resourceHtml: '<html>board</html>', publicOrigin: address });
  const client = new Client({ name: 'friend-quota-test', version: '1' }), [a, b] = InMemoryTransport.createLinkedPair();
  await mcp.connect(a); await client.connect(b);
  try {
   await admin.query("insert into public.plugin_tool_tries(user_id,tool,tries) values($1,'kingdown_friends',59)", [actor.id]);
   const [http, tool] = await Promise.all([
    fetch(`${address}/api/friends`, { headers: { Authorization: `Bearer ${await sign(actor.id)}` } }),
    client.callTool({ name: 'kingdown_create', arguments: { kind: 'friend', options: DEFAULT_OPTIONS, open_link: true, command_id: randomUUID() } }),
   ]);
   if (http.status === 200) expect(tool).toMatchObject({ isError: true, _meta: { code: 'RATE_LIMITED' } });
   else { expect(http.status).toBe(429); expect(tool.isError).not.toBe(true); }
   expect(await rows("select tries from public.plugin_tool_tries where user_id=$1 and tool='kingdown_friends'", [actor.id])).toEqual([{ tries: 61 }]);
  } finally { await client.close(); await mcp.close(); }
 });
 it('shares the last Create quota slot atomically across HTTP and MCP', async () => {
  const actor = await player('quota-cross'), token = await sign(actor.id);
  const mcp = createPluginServer({ service: new PluginService(new PostgresMatchStore(runtime), secret), actorId: actor.id, resourceHtml: '<html>board</html>', publicOrigin: address });
  const client = new Client({ name: 'http-quota-test', version: '1' }), [a, b] = InMemoryTransport.createLinkedPair();
  await mcp.connect(a); await client.connect(b);
  try {
   await admin.query("insert into public.plugin_tool_tries(user_id,tool,tries) values($1,'kingdown_create',59)", [actor.id]);
   const input = { kind: 'friend', options: CLASSIC_OPTIONS, colour: 'white' };
   const [http, tool] = await Promise.all([
    fetch(`${address}/api/games`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...input, command_id: randomUUID() }) }),
    client.callTool({ name: 'kingdown_create', arguments: { ...input, command_id: randomUUID() } }),
   ]);
   const body = await http.json(), meta = tool._meta as { code?: string; view?: View };
   let gameId: string;
   if (http.status === 201) {
    expect(tool).toMatchObject({ isError: true, _meta: { code: 'RATE_LIMITED' } });
    gameId = body.view.game_id;
   } else {
    expect([http.status, body.code]).toEqual([429, 'RATE_LIMITED']);
    expect(tool.isError).not.toBe(true);
    expect(meta.view?.status).toBe('waiting');
    gameId = meta.view!.game_id;
   }
   expect(await rows('select id from public.games where created_by=$1', [actor.id])).toEqual([{ id: gameId }]);
   expect(await rows("select tool,tries from public.plugin_tool_tries where user_id=$1 and tool='kingdown_create'", [actor.id])).toEqual([{ tool: 'kingdown_create', tries: 61 }]);
  } finally { await client.close(); await mcp.close(); }
 }, 60_000);

 it('makes no stored change or write attempt on full and since reads in each game state', async () => {
  const [ann, bob] = [await player('read-ann'), await player('read-bob')];
  const waiting = (await ann.api.create({ kind: 'friend', options: CLASSIC_OPTIONS })).view;
  const setup = await ann.api.create({ kind: 'friend', options: { ...DEFAULT_OPTIONS, kingPowers: true, cardPool: ['Flight', 'March', 'Leap', 'Salvation'] } });
  const joinedSetup = await bob.api.redeem({ token: setup.invite!.token });
  expect([joinedSetup.status, joinedSetup.revision]).toEqual(['setup', setup.view.revision + 1]);
  const choice: Choice = { king: { king: 'Flame', power: 'Haste' }, order: [...setup.view.draw!].reverse().join('') };
  const hidden = (await ann.api.command(setup.view.game_id, joinedSetup.revision, { type: 'choose', choice, ready: true })).view;
  const game = await ann.api.create({ kind: 'friend', options: CLASSIC_OPTIONS, colour: 'white' });
  const joinedGame = await bob.api.redeem({ token: game.invite!.token });
  expect([joinedGame.status, joinedGame.revision]).toEqual(['playing', game.view.revision + 1]);
  const playing = (await ann.api.command(game.view.game_id, joinedGame.revision, { type: 'turn', actions: [plain(await ann.api.game(game.view.game_id))] })).view;
  const end = await ann.api.create({ kind: 'friend', options: CLASSIC_OPTIONS });
  const joinedEnd = await bob.api.redeem({ token: end.invite!.token });
  expect(joinedEnd.revision).toBe(end.view.revision + 1);
  const finished = (await ann.api.command(end.view.game_id, joinedEnd.revision, { type: 'resign' })).view;
  const fixtures = [{ view: waiting, actor: ann }, { view: hidden, actor: bob }, { view: playing, actor: bob }, { view: finished, actor: bob }];
  await admin.query("update public.game_players set last_seen_at=now()-interval '1 hour' where game_id=any($1)", [fixtures.map(({ view }) => view.game_id)]);
  const tables = await rows("select tablename from pg_tables where schemaname='public' order by tablename");
  const snapshot = () => Promise.all(tables.map(({ tablename }) => rows(`select to_jsonb(t) as row from public."${tablename}" t order by to_jsonb(t)::text`)));
  const readOnly = new pg.Pool({ connectionString: runtimeUrl.href, max: 2, options: '-c default_transaction_read_only=on' });
  const clients: pg.PoolClient[] = [];
  readOnly.on('connect', client => { clients.push(client); vi.spyOn(client, 'query'); });
  try {
   expect((await readOnly.query('show transaction_read_only')).rows).toEqual([{ transaction_read_only: 'on' }]);
   const access = createWebAccountAccess(readOnly);
   // Open only the suite's switch. Every request reads it with the runtime role.
   await admin.query('update public.web_account_access set enabled=true where singleton=true');
   const before = await snapshot();
   clients.forEach(client => vi.mocked(client.query).mockClear());
   const admit = vi.fn(), currentUser = vi.fn();
   api = createApiHandler({ ...options, games: new GameService(new PostgresMatchStore(readOnly)), webAccountAccess: access, admit, currentUser });
   for (const { view, actor } of fixtures) for (const since of [undefined, 0, 1, view.revision]) {
    const result = await actor.api.game(view.game_id, since);
    expect(result).toMatchObject({ game_id: view.game_id, revision: view.revision, status: view.status, seat: actor === ann ? 0 : 1 });
    if (since === view.revision) expect(result.last_commands).toEqual([]);
    if (view.status === 'setup') {
     expect(result.choices?.[0]).toBeNull(); expect(result.kings).toBeUndefined();
     for (const secret of [choice.king!.king, choice.king!.power, choice.order]) expect(JSON.stringify(result, (key, value) => key === 'setup_admission' ? undefined : value)).not.toContain(secret);
     if (since !== view.revision) expect(result.last_commands.at(-1)?.action).toEqual({ type: 'hidden' });
    }
    if (view.status === 'playing') expect(result.legal.length).toBeGreaterThan(0);
    if (view.status === 'finished') expect(result.result).toEqual(view.result);
   }
   const sql = clients.flatMap(client => vi.mocked(client.query).mock.calls.map(([query]) => typeof query === 'string' ? query : (query as pg.QueryConfig).text));
   expect(sql.length).toBeGreaterThan(50);
   // These reads use only SELECT and these built-in expressions. A helper call needs a review.
   const expressions = new Set(['extract', 'statement_timestamp', 'coalesce', 'exists', 'select', 'not', 'and', 'or', 'in']);
   for (const statement of sql) {
    const text = statement.replace(/'(?:[^']|'')*'/g, "''");
    expect(text).toMatch(/^select\s/i); expect(text).not.toMatch(/[";]|\b(insert|update|delete|merge|call|copy|create|alter|drop|truncate|set|lock|into)\b/i);
    for (const [, name] of text.matchAll(/\b([a-z_][a-z0-9_.]*)\s*\(/gi)) expect(expressions.has(name.toLowerCase()), name).toBe(true);
   }
   expect(admit).not.toHaveBeenCalled(); expect(currentUser).not.toHaveBeenCalled();
   expect(await snapshot()).toEqual(before);
  } finally {
   api = createApiHandler(options); await readOnly.end();
   await admin.query('update public.web_account_access set enabled=false where singleton=true');
  }
 }, 60_000);

 it('stops real-service requests when the database switch is off or closes during current-user work', async () => {
  const actor = await player('switch'), verify = vi.fn(options.verify!), admit = vi.fn(() => () => {}), currentUser = vi.fn(async () => {});
  await admin.query('update public.web_account_access set enabled=false where singleton=true');
  const access = createWebAccountAccess(runtime);
  api = createApiHandler({ ...options, webAccountAccess: access, verify, admit, currentUser });
  try {
   const response = await fetch(`${address}/api/me/games`, { headers: { Authorization: `Bearer ${await sign(actor.id)}` } });
   expect([response.status, response.headers.get('Retry-After'), (await response.json()).code]).toEqual([503, '5', 'UNAVAILABLE']);
   for (const spy of [verify, admit, currentUser]) expect(spy).not.toHaveBeenCalled();
   const game = await options.games.create(actor.id, { kind: 'friend', options: CLASSIC_OPTIONS });
   const before = await rows('select * from public.game_players where game_id=$1 order by seat', [game.game_id]);
   await admin.query('update public.web_account_access set enabled=true where singleton=true');
   const open = createWebAccountAccess(runtime);
   let unblock!: () => void, entered!: () => void;
   const gate = new Promise<void>(resolve => { unblock = resolve; }), started = new Promise<void>(resolve => { entered = resolve; }), release = vi.fn();
   api = createApiHandler({ ...options, webAccountAccess: open, admit: () => release, currentUser: async () => { entered(); await gate; } });
   const pending = actor.api.seen(game.game_id); await started;
   await admin.query('update public.web_account_access set enabled=false where singleton=true');
   // Move only the monotonic proof clock. No wall-clock wait is needed.
   const now = performance.now(), clock = vi.spyOn(performance, 'now').mockReturnValue(now + 5001);
   try { unblock(); await expect(pending).rejects.toMatchObject({ code: 'UNAVAILABLE', status: 503 }); }
   finally { clock.mockRestore(); }
   expect(release).toHaveBeenCalledOnce();
   expect(await rows('select * from public.game_players where game_id=$1 order by seat', [game.game_id])).toEqual(before);
  } finally { api = createApiHandler(options); await admin.query('update public.web_account_access set enabled=false where singleton=true'); }
 }, 60_000);

 it('refreshes public status across two caches and shares each new proof with private calls', async () => {
  const actor = await player('status'), token = await sign(actor.id);
  let now = 100; const clock = vi.spyOn(performance, 'now').mockImplementation(() => now);
  const caches = [createWebAccountAccess(runtime), createWebAccountAccess(runtime)];
  const query = vi.spyOn(runtime, 'query');
  const switchQueries = () => query.mock.calls.filter(([sql]) => String(sql).includes('from public.web_account_access')).length;
  const status = async () => {
   const response = await fetch(`${address}/api/status`);
   expect([response.status, response.headers.get('Cache-Control'), response.headers.get('Referrer-Policy')]).toEqual([200, 'no-store', 'no-referrer']);
   return response.json();
  };
  const direct = () => fetch(`${address}/api/me/profile`, { headers: { Authorization: `Bearer ${token}` } });
  try {
   await admin.query('update public.web_account_access set enabled=true where singleton=true');
   for (const access of caches) {
    api = createApiHandler({ ...options, webAccountAccess: access });
    expect(await status()).toEqual({ account_access: 'open', valid_for_ms: 5000 });
    expect((await direct()).status).toBe(200);
   }
   expect(switchQueries()).toBe(2);
   await admin.query('update public.web_account_access set enabled=false where singleton=true');
   now = 5099;
   for (const access of caches) {
    api = createApiHandler({ ...options, webAccountAccess: access });
    expect((await direct()).status).toBe(200);
    expect(await status()).toEqual({ account_access: 'closed', valid_for_ms: 0 });
    expect((await direct()).status).toBe(503);
   }
   expect(switchQueries()).toBe(4);
   await admin.query('update public.web_account_access set enabled=true where singleton=true');
   now = 5100;
   for (const access of caches) {
    api = createApiHandler({ ...options, webAccountAccess: access });
    expect((await direct()).status).toBe(503);
    expect(await status()).toEqual({ account_access: 'open', valid_for_ms: 5000 });
    expect((await direct()).status).toBe(200);
   }
   expect(switchQueries()).toBe(6);
   await admin.query('delete from public.web_account_access where singleton=true');
   api = createApiHandler({ ...options, webAccountAccess: caches[0] });
   expect(await status()).toEqual({ account_access: 'closed', valid_for_ms: 0 });
   expect((await direct()).status).toBe(503);
   expect(switchQueries()).toBe(8);
  } finally {
   query.mockRestore(); clock.mockRestore(); api = createApiHandler(options);
   await admin.query('insert into public.web_account_access(singleton,enabled) values(true,false) on conflict(singleton) do update set enabled=false');
  }
 }, 60_000);

 it('records explicit HTTP activity only for a seat and keeps the store throttle', async () => {
  const [ann, bob, stranger] = [await player('seen-ann'), await player('seen-bob'), await player('seen-cy')];
  const game = await ann.api.create({ kind: 'friend', options: CLASSIC_OPTIONS });
  await bob.api.redeem({ token: game.invite!.token });
  const id = game.view.game_id;
  await admin.query("update public.game_players set last_seen_at=now()-interval '1 hour' where game_id=$1", [id]);
  const state = () => rows('select * from public.game_players where game_id=$1 order by seat', [id]);
  const before = await state();
  await ann.api.seen(id);
  const after = await state();
  expect(after[0].last_seen_at.getTime()).toBeGreaterThan(before[0].last_seen_at.getTime());
  expect(after).toEqual([{ ...before[0], last_seen_at: after[0].last_seen_at }, before[1]]);
  await ann.api.seen(id); expect(await state()).toEqual(after);
  await expect(stranger.api.seen(id)).rejects.toMatchObject({ code: 'FORBIDDEN', status: 403 });
  await expect(ann.api.seen(randomUUID())).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
  expect(await state()).toEqual(after);
 }, 60_000);

 it('plays a Daily friend game between two website identities, with retries that apply once', async () => {
  const [ann, bob] = [await player('ann'), await player('bob')];
  const { view: created, invite } = await ann.api.create({ kind: 'friend', options: CLASSIC_OPTIONS, colour: 'white' });
  expect([created.status, created.seat, created.days_per_move, invite!.url]).toEqual(['waiting', 0, TURN_DAYS, `${address}/j#${invite!.token}`]);
  const id = created.game_id;
  const joined = await bob.api.redeem({ code: `${invite!.code.slice(0, 3).toLowerCase()}-${invite!.code.slice(3)}` });
  expect([joined.game_id, joined.seat, joined.status, joined.opponent?.handle]).toEqual([id, 1, 'playing', ann.handle]);
  expect((await ann.api.games()).map(entry => [entry.game_id, entry.action])).toEqual([[id, 'ready']]);
  let view = await ann.api.game(id);
  // The start receipt and the join each advance the authoritative game revision.
  expect(joined.revision).toBe(created.revision + 1);
  expect([view.revision, view.rules !== undefined, view.legal.length > 0]).toEqual([joined.revision, true, true]);
  const beforeRevision = view.revision;

  // A lost reply: the server applied the turn, the client sends it again with the same ID, and it applies once.
  let lost = true;
  const flaky = onlineClient({ token: () => sign(ann.id), origin: address, wait: async () => {}, fetch: async (...args) => { const response = await fetch(...args); if (lost) { lost = false; throw new TypeError('network'); } return response; } });
  const first = plain(view), ack = await flaky.command(id, beforeRevision, { type: 'turn', actions: [first] }, 'ann-1');
  expect([ack.type, ack.command_id, ack.revision, ack.view.turn, ack.view.action]).toEqual(['ack', 'ann-1', beforeRevision + 1, 1, 'waiting']);
  expect((await ann.api.command(id, beforeRevision, { type: 'turn', actions: [first] }, 'ann-1')).revision).toBe(ack.revision);
  expect((await rows("select count(*)::int as n from public.game_commands where game_id=$1 and command_id='ann-1'", [id]))[0].n).toBe(1);
  await expect(ann.api.command(id, beforeRevision, { type: 'resign' }, 'ann-1')).rejects.toMatchObject({ code: 'COMMAND_CONFLICT', status: 409 });
  // The turn is saved without an unused delivery event.
  expect(await rows("select payload->>'revision' as revision from public.outbox where kind='turn' and payload->>'user_id'=$1 and payload->>'game_id'=$2", [bob.id, id])).toEqual([]);

  const since = await bob.api.game(id, beforeRevision);
  expect([since.rules, since.last_commands.map(c => [c.seq, c.seat, c.action.type])]).toEqual([undefined, [[ack.revision, 0, 'turn']]]);
  await expect(bob.api.command(id, beforeRevision, { type: 'turn', actions: [plain(since)] })).rejects.toMatchObject({ code: 'STALE_REVISION' });
  await expect(ann.api.command(id, ack.revision, { type: 'turn', actions: [first] })).rejects.toMatchObject({ code: 'WRONG_TURN', status: 403 });
  view = (await bob.api.command(id, ack.revision, { type: 'say', preset: 'good_luck' })).view;
  view = (await bob.api.command(id, view.revision, { type: 'draw', choice: 'offer' })).view;
  view = (await ann.api.command(id, view.revision, { type: 'draw', choice: 'decline' })).view;
  expect([view.draw_offer, view.last_commands.at(-3)?.action]).toEqual([null, { type: 'say', preset: 'good_luck' }]);
  view = (await bob.api.command(id, view.revision, { type: 'turn', actions: [plain(await bob.api.game(id))] })).view;
  view = (await ann.api.command(id, view.revision, { type: 'turn', actions: [plain(await ann.api.game(id))] })).view;
  const done = (await bob.api.command(id, view.revision, { type: 'resign' })).view;
  expect(done.revision).toBe(ack.revision + 6);
  expect([done.status, done.result, done.action]).toEqual(['finished', { winner: 0, reason: 'resignation' }, 'done']);
  expect([(await ann.api.game(id)).result, await ann.api.games(), await bob.api.games()]).toEqual([{ winner: 0, reason: 'resignation' }, [], []]);
  await expect(bob.api.game(randomUUID())).rejects.toMatchObject({ code: 'NOT_FOUND' });
  await expect((await player('cy')).api.game(id)).rejects.toMatchObject({ code: 'FORBIDDEN' });
 }, 60_000);

 it('gives a new invitation, joins by link, and allows 10 short-code tries in an hour', async () => {
  const [dan, eve, fay] = [await player('dan'), await player('eve'), await player('fay')];
  const { view, invite } = await dan.api.create({ kind: 'friend', options: CLASSIC_OPTIONS, colour: 'white' });
  const again = await dan.api.invite(view.game_id);
  await expect(eve.api.redeem({ token: invite!.token })).rejects.toMatchObject({ code: 'INVITE_UNAVAILABLE' });
  for (let i = 0; i < 10; i++) await expect(eve.api.redeem({ code: 'ZZZZZZ' })).rejects.toMatchObject({ code: 'INVITE_UNAVAILABLE' });
  await expect(eve.api.redeem({ code: again.code })).rejects.toMatchObject({ code: 'RATE_LIMITED', status: 429 });
  await expect(eve.api.redeem({ code: 'abc' })).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  // The link token cannot be guessed, so it is not counted; another player has their own count.
  expect((await eve.api.redeem({ token: again.token })).status).toBe('playing');
  expect((await eve.api.redeem({ token: again.token })).seat).toBe(1); // a retry returns the game
  await expect(fay.api.redeem({ code: again.code })).rejects.toMatchObject({ code: 'INVITE_UNAVAILABLE' });
  await admin.query("update public.invite_code_tries set window_start=now()-interval '61 minutes' where user_id=$1", [eve.id]);
  await expect(eve.api.redeem({ code: 'ZZZZZZ' })).rejects.toMatchObject({ code: 'INVITE_UNAVAILABLE' });
  expect((await rows('select tries from public.invite_code_tries where user_id=$1', [eve.id]))[0].tries).toBe(1);
  // A block refuses the join both ways.
  const { invite: next } = await fay.api.create({ kind: 'friend', options: CLASSIC_OPTIONS });
  await dan.api.relate('block', { handle: fay.handle });
  await expect(dan.api.redeem({ token: next!.token })).rejects.toMatchObject({ code: 'INVITE_UNAVAILABLE' });
  // No speed or days choice (F-031).
  for (const choice of [{ speed: 'live' }, { speed: 'daily' }, { days_per_move: 3 }])
   await expect(dan.api.create({ kind: 'friend', options: CLASSIC_OPTIONS, ...choice } as Parameters<typeof dan.api.create>[0])).rejects.toMatchObject({ code: 'INVALID_INPUT' });
 }, 60_000);

 it('serves the account, relation and report routes for the signed-in player only', async () => {
  const [gus, hal] = [await player('gus'), await player('hal')];
  expect((await gus.api.profile())).toMatchObject({ user_id: gus.id, handle: gus.handle, quiet_mode: false, deletion: null });
  expect((await gus.api.updateProfile({ quiet_mode: true, icon: 'rook' }))).toMatchObject({ quiet_mode: true, icon: 'rook' });
  expect((await gus.api.setHandle(`gus2-${tag}`)).handle).toBe(`gus2-${tag}`);
  await expect(hal.api.setHandle(`gus-${tag}`)).rejects.toMatchObject({ code: 'HANDLE_TAKEN', status: 409 });
  expect((await gus.api.requestDeletion()).deletion).not.toBeNull();
  expect((await gus.api.cancelDeletion()).deletion).toBeNull();
  expect((await gus.api.setNotifications({ turn: { email: false } })).turn).toEqual({ email: false, push: false });
  expect((await gus.api.notifications()).reminder).toEqual({ email: true, push: false });
  const { view, invite } = await gus.api.create({ kind: 'friend', options: CLASSIC_OPTIONS });
  await hal.api.redeem({ token: invite!.token });
  await gus.api.relate('follow', { game_id: view.game_id });
  expect((await gus.api.relations()).map(r => [r.kind, r.handle])).toEqual([['follow', hal.handle]]);
  await gus.api.unrelate('follow', { handle: hal.handle });
  expect(await gus.api.relations()).toEqual([]);
  expect(await hal.api.relations()).toEqual([]);
  // A report reaches the owner's queue with the reporter from the session, never from input.
  const report = await hal.api.report({ target: 'handle', category: 'offensive_handle', game_id: view.game_id, note: 'rude' });
  expect(await rows('select reporter_id,reported_id,content,status from public.reports where id=$1', [report.id])).toEqual([{ reporter_id: hal.id, reported_id: gus.id, content: `gus2-${tag}`, status: 'open' }]);
  await expect(hal.api.report({ target: 'player', category: 'other', handle: gus.handle, reporter_id: gus.id } as never)).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  expect((await new SafetyService(new PostgresMatchStore(admin)).queue()).some(row => row.id === report.id)).toBe(true);
 }, 60_000);

 it('runs the jobs through /internal with the secret only', async () => {
  const [ida, jo] = [await player('ida'), await player('jo')];
  const { view, invite } = await ida.api.create({ kind: 'friend', options: CLASSIC_OPTIONS, colour: 'white' });
  await jo.api.redeem({ token: invite!.token });
  for (const key of ['', 'wrong', secret.slice(1)]) expect((await internal('tick', key)).status).toBe(403);
  for (const path of ['outbox', 'reminders']) {
   const response = await internal(path);
   expect([response.status, (await response.json()).code]).toEqual([404, 'NOT_FOUND']);
  }
  await admin.query("update public.games set deadline_at=now()-interval '1 minute' where id=$1", [view.game_id]);
  expect(await (await internal('tick')).json()).toEqual({ ended: 1 });
  expect((await jo.api.game(view.game_id)).result).toEqual({ winner: null, reason: 'no_start' });
  expect(await (await internal('daily')).json()).toMatchObject({ deleted: 0, invites: expect.any(Number), outbox: expect.any(Number) });
  expect((await fetch(`${address}/internal/tick`, { headers: { 'X-Kingdown-Internal': secret } })).status).toBe(405);
 }, 60_000);
});
