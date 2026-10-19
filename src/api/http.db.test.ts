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
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { DEFAULT_OPTIONS, type Choice } from '../match/setup';
import type { View } from '../match/protocol';
import { GameService } from '../match/service';
import { PostgresMatchStore } from '../match/store';
import { AccountService } from '../online/accounts';
import { onlineClient, type OnlineClient } from '../online/client';
import { fakeSender } from '../online/mail';
import { SafetyService } from '../online/safety';
import { createWebAccountAccess } from './account-access';
import { createApiHandler, createInternalHandler, MAX_API_BODY, sessionVerifier, type ApiOptions } from './http';
import { ownTestDatabase } from '../../tools/plugin-db/own-test-db';
import { withRoleLock } from '../../tools/plugin-db/role-lock.mjs';

const operations = new Set([
 'POST /api/games',
 'GET /api/games/:id',
 'POST /api/games/:id/seen',
 'POST /api/games/:id/commands',
 'POST /api/games/:id/invite',
 'POST /api/invites/redeem',
 'GET /api/me/games',
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
]);
const CLASSIC_OPTIONS = { ...DEFAULT_OPTIONS, fairy: false, arrangement: false, classic: true };
const url = process.env.PLUGIN_TEST_DATABASE_URL, supabase = 'https://project.supabase.co', secret = randomUUID() + randomUUID();
const suite = url ? describe : describe.skip;
const plain = (view: View) => view.legal.find(lan => !lan.includes('!'))!;

suite('website API and jobs on PostgreSQL (runtime role, website sessions)', () => {
 let own: URL, admin: pg.Pool, runtime: pg.Pool, runtimeUrl: URL, server: Server, address: string, sign: (sub: string) => Promise<string>;
 let api: ReturnType<typeof createApiHandler>, options: ApiOptions;
 const role = `api_test_${randomUUID().replaceAll('-', '')}`, users: string[] = [], tag = randomUUID().slice(0, 6), sender = fakeSender();
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
  const store = new PostgresMatchStore(runtime), games = new GameService(store);
  const pair = await generateKeyPair('ES256'), keys = createLocalJWKSet({ keys: [{ ...await exportJWK(pair.publicKey), kid: 'local', alg: 'ES256' }] });
  sign = sub => { const now = Math.floor(Date.now() / 1000); return new SignJWT({ iss: `${supabase}/auth/v1`, aud: 'authenticated', sub, role: 'authenticated', is_anonymous: false, iat: now, exp: now + 600 }).setProtectedHeader({ alg: 'ES256', kid: 'local' }).sign(pair.privateKey); };
  server = createServer(); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  address = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  options = { games, accounts: new AccountService(store), safety: new SafetyService(store), publicOrigin: address, operations, verify: sessionVerifier(supabase, keys), webAccountAccess: async () => ({ enabled: true, expiresAt: performance.now() + 5000 }), admit: () => () => {}, currentUser: async () => {} };
  api = createApiHandler(options);
  const jobs = createInternalHandler({ games, publicOrigin: address, secret, sender: () => sender });
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

 it('makes no stored change or write attempt on full and since reads in each game state', async () => {
  const [ann, bob] = [await player('read-ann'), await player('read-bob')];
  const waiting = (await ann.api.create({ kind: 'friend', options: CLASSIC_OPTIONS })).view;
  const setup = await ann.api.create({ kind: 'friend', options: { ...DEFAULT_OPTIONS, kingPowers: true, cardPool: ['Flight', 'March', 'Leap', 'Salvation'] } });
  await bob.api.redeem({ token: setup.invite!.token });
  const choice: Choice = { king: { king: 'Flame', power: 'Haste' }, order: [...setup.view.draw!].reverse().join('') };
  const hidden = (await ann.api.command(setup.view.game_id, 1, { type: 'choose', choice, ready: true })).view;
  const game = await ann.api.create({ kind: 'friend', options: CLASSIC_OPTIONS, colour: 'white' });
  await bob.api.redeem({ token: game.invite!.token });
  const playing = (await ann.api.command(game.view.game_id, 1, { type: 'turn', actions: [plain(await ann.api.game(game.view.game_id))] })).view;
  const end = await ann.api.create({ kind: 'friend', options: CLASSIC_OPTIONS });
  await bob.api.redeem({ token: end.invite!.token });
  const finished = (await ann.api.command(end.view.game_id, 1, { type: 'resign' })).view;
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
     for (const secret of [choice.king!.king, choice.king!.power, choice.order]) expect(JSON.stringify(result)).not.toContain(secret);
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
  const { view: created, invite } = await ann.api.create({ kind: 'friend', options: CLASSIC_OPTIONS, speed: 'daily', days_per_move: 1, colour: 'white' });
  expect([created.status, created.seat, created.days_per_move, invite!.url]).toEqual(['waiting', 0, 1, `${address}/j/${invite!.token}`]);
  const id = created.game_id;
  const joined = await bob.api.redeem({ code: `${invite!.code.slice(0, 3).toLowerCase()}-${invite!.code.slice(3)}` });
  expect([joined.game_id, joined.seat, joined.status, joined.opponent?.handle]).toEqual([id, 1, 'playing', ann.handle]);
  expect((await ann.api.games()).map(entry => [entry.game_id, entry.action])).toEqual([[id, 'ready']]);
  let view = await ann.api.game(id);
  expect([view.revision, view.rules !== undefined, view.legal.length > 0]).toEqual([1, true, true]);

  // A lost reply: the server applied the turn, the client sends it again with the same ID, and it applies once.
  let lost = true;
  const flaky = onlineClient({ token: () => sign(ann.id), origin: address, wait: async () => {}, fetch: async (...args) => { const response = await fetch(...args); if (lost) { lost = false; throw new TypeError('network'); } return response; } });
  const first = plain(view), ack = await flaky.command(id, 1, { type: 'turn', actions: [first] }, 'ann-1');
  expect([ack.type, ack.command_id, ack.revision, ack.view.turn, ack.view.action]).toEqual(['ack', 'ann-1', 2, 1, 'waiting']);
  expect((await ann.api.command(id, 1, { type: 'turn', actions: [first] }, 'ann-1')).revision).toBe(2);
  expect((await rows("select count(*)::int as n from public.game_commands where game_id=$1 and command_id='ann-1'", [id]))[0].n).toBe(1);
  await expect(ann.api.command(id, 1, { type: 'resign' }, 'ann-1')).rejects.toMatchObject({ code: 'COMMAND_CONFLICT', status: 409 });
  // The turn email to Black is queued in the same transaction.
  expect(await rows("select payload->>'revision' as revision from public.outbox where kind='turn' and payload->>'user_id'=$1 and payload->>'game_id'=$2", [bob.id, id])).toEqual([{ revision: '2' }]);

  const since = await bob.api.game(id, 1);
  expect([since.rules, since.last_commands.map(c => [c.seq, c.seat, c.action.type])]).toEqual([undefined, [[2, 0, 'turn']]]);
  await expect(bob.api.command(id, 1, { type: 'turn', actions: [plain(since)] })).rejects.toMatchObject({ code: 'STALE_REVISION' });
  await expect(ann.api.command(id, 2, { type: 'turn', actions: [first] })).rejects.toMatchObject({ code: 'WRONG_TURN', status: 403 });
  await bob.api.command(id, 2, { type: 'say', preset: 'good_luck' });
  await bob.api.command(id, 3, { type: 'draw', choice: 'offer' });
  view = (await ann.api.command(id, 4, { type: 'draw', choice: 'decline' })).view;
  expect([view.draw_offer, view.last_commands.at(-3)?.action]).toEqual([null, { type: 'say', preset: 'good_luck' }]);
  view = (await bob.api.command(id, 5, { type: 'turn', actions: [plain(await bob.api.game(id))] })).view;
  view = (await ann.api.command(id, 6, { type: 'turn', actions: [plain(await ann.api.game(id))] })).view;
  const done = (await bob.api.command(id, 7, { type: 'resign' })).view;
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
  await expect(dan.api.redeem({ token: next!.token })).rejects.toMatchObject({ code: 'FORBIDDEN' });
  await expect(dan.api.create({ kind: 'friend', options: CLASSIC_OPTIONS, days_per_move: 3, speed: 'live' })).rejects.toMatchObject({ code: 'INVALID_INPUT' });
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
  await jo.api.redeem({ token: invite!.token }); // the turn passes to White: a turn email for Ida
  for (const key of ['', 'wrong', secret.slice(1)]) expect((await internal('tick', key)).status).toBe(403);
  // Ida was here when she made the game; an hour later the 60-second rule lets the email go.
  await admin.query("update public.game_players set last_seen_at=now()-interval '1 hour' where game_id=$1", [view.game_id]);
  const outbox = await internal('outbox');
  expect([outbox.status, (await outbox.json()).sent >= 1]).toEqual([200, true]);
  expect(sender.sent.filter(mail => mail.to === `${ida.id}@example.com`).map(mail => mail.text.includes(`/g/${view.game_id}`))).toEqual([true]);
  expect(await (await internal('reminders')).json()).toEqual({ queued: 0 });
  await admin.query("update public.games set deadline_at=now()-interval '1 minute' where id=$1", [view.game_id]);
  expect(await (await internal('tick')).json()).toEqual({ ended: 1 });
  expect((await jo.api.game(view.game_id)).result).toEqual({ winner: null, reason: 'no_start' });
  expect(await (await internal('daily')).json()).toMatchObject({ deleted: 0, invites: expect.any(Number), outbox: expect.any(Number) });
  expect((await fetch(`${address}/internal/tick`, { headers: { 'X-Kingdown-Internal': secret } })).status).toBe(405);
 }, 60_000);
});
