/** The HTTP boundary of /api and /internal with stub services: who gets in, what a browser may send, and the bounds. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createServer, request, type Server } from 'node:http';
import { once } from 'node:events';
import { createLocalJWKSet, errors, exportJWK, generateKeyPair, SignJWT, type JWTPayload } from 'jose';
import { DEFAULT_OPTIONS } from '../match/setup';
import { createArguments, readSetup } from '../plugin/screens/setup-model';
import { MatchServiceError } from '../match/service';
import { AuthenticationError, AuthenticationUnavailable } from '../plugin/auth';
import { createApiHandler, createInternalHandler, MAX_ACTIVE_ENGINE, MAX_API_BODY, sessionVerifier, type ApiOptions } from './http';
import type { Pool } from 'pg';
import { createWebAccountAccess } from './account-access';
import { readWebAccountAccess } from '../online/account-access';
afterEach(() => { vi.unstubAllEnvs(); });

const alice = '11111111-1111-4111-8111-111111111111', gameId = '33333333-3333-4333-8333-333333333333';
const supabase = 'https://project.supabase.co', issuer = `${supabase}/auth/v1`, secret = 'x'.repeat(40);
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
const commandId = '44444444-4444-4444-8444-444444444444';
const view = { game_id: gameId, revision: 1, kind: 'solo' };
let address: string, sign: (claims?: JWTPayload, key?: CryptoKey) => Promise<string>, games: Record<string, ReturnType<typeof vi.fn>>, accounts: Record<string, ReturnType<typeof vi.fn>>, safety: Record<string, ReturnType<typeof vi.fn>>, players: Record<string, ReturnType<typeof vi.fn>>;
let other: CryptoKey, server: Server, defaults: ApiOptions;
const webAccountAccess = async () => ({ enabled: true, expiresAt: performance.now() + 5000 });
function useApi(options: Partial<ApiOptions>) {
 const api = createApiHandler({ ...defaults, ...options });
 server.removeAllListeners('request'); server.on('request', (req, res) => { void api(req, res); });
}
async function serve(options: Partial<ApiOptions> = {}, internal: { secret?: string } = {}) {
 server = createServer(); server.listen(0, '127.0.0.1'); await once(server, 'listening');
 address = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
 const pair = await generateKeyPair('ES256'); other = (await generateKeyPair('ES256')).privateKey;
 const keys = createLocalJWKSet({ keys: [{ ...await exportJWK(pair.publicKey), kid: 'test', alg: 'ES256' }] });
 // A Supabase session's claims; a test changes one of them.
 sign = (claims = {}, key = pair.privateKey) => { const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ iss: issuer, aud: 'authenticated', sub: alice, role: 'authenticated', is_anonymous: false, session_id: 's', iat: now, exp: now + 300, ...claims }).setProtectedHeader({ alg: 'ES256', kid: 'test' }).sign(key); };
 games = { friends: vi.fn(async () => ({ friends: [], next_after: null })), invitations: vi.fn(async () => ({ invitations: [], next_before: null })), declineInvite: vi.fn(async () => ({ state: 'declined' })), create: vi.fn(async () => view), view: vi.fn(async () => view), command: vi.fn(async () => view), inbox: vi.fn(async () => []), invite: vi.fn(), join: vi.fn(async () => view), preview: vi.fn(async () => ({ code: 'ABC234', options: DEFAULT_OPTIONS, kind: 'friend', colour: 'black', creator: { handle: 'host', icon: null }, expires_at: 'soon' })), find: vi.fn(async () => view), accept: vi.fn(async () => view), cancel: vi.fn(async () => view), lobby: vi.fn(async () => ({ games: [] })), record: vi.fn(async () => ({ total: 3 })), history: vi.fn(async () => ({ games: [], next_before: null })), seen: vi.fn(), sweep: vi.fn(async () => 0) };
 accounts = { notices: vi.fn(async () => ({ notices: [], next_notices_before: null })), profile: vi.fn(async () => ({ user_id: alice })), relate: vi.fn(async () => undefined), ...Object.fromEntries(['updateSettings', 'setHandle', 'requestDeletion', 'cancelDeletion', 'notificationPrefs', 'setNotificationPrefs', 'relations', 'unrelate'].map(name => [name, vi.fn()])) };
 safety = { report: vi.fn() };
 players = { profile: vi.fn(async () => ({ user_id: alice, handle: 'alice', icon: null })), settings: vi.fn(async () => ({ symbols_only: false, show_threats: true, online_visible_to: 'mutual', last_setup: null })), handle: vi.fn(async () => ({ user_id: alice, handle: 'alice', icon: null })), block: vi.fn(async () => true), blocks: vi.fn(async () => []), toolTry: vi.fn() };
 defaults = { games: games as never, accounts: accounts as never, safety: safety as never, players: players as never, publicOrigin: address, operations, webAccountAccess, admit: () => () => {}, currentUser: async () => {}, verify: sessionVerifier(supabase, keys), ...options };
 const api = createApiHandler(defaults);
 const jobs = createInternalHandler({ games: games as never, publicOrigin: address, secret, ...internal });
 server.on('request', (req, res) => { void (req.url!.startsWith('/internal') ? jobs : api)(req, res); });
}
beforeEach(() => serve());
afterEach(async () => { server.closeAllConnections(); await new Promise(done => server.close(done)); });
const call = (path: string, { token, method = 'GET', body, headers = {} }: { token?: string; method?: string; body?: unknown; headers?: Record<string, string> } = {}) =>
 fetch(address + path, { method, headers: { ...(token && { Authorization: `Bearer ${token}` }), ...(body !== undefined && { 'Content-Type': 'application/json' }), ...headers }, ...(body !== undefined && { body: typeof body === 'string' ? body : JSON.stringify(body) }) });
const raw = (path: string, headers: Record<string, string>, body?: string) => new Promise<number>((resolve, reject) => {
 const req = request(address + path, { method: 'POST', headers }, response => { response.resume(); response.on('end', () => resolve(response.statusCode!)); });
 req.on('error', reject); if (body) req.write(body); req.end();
});

describe('website API boundary', () => {
 it('keeps page startup open when status starts at the end of a cached open proof', async () => {
  let now = 100; vi.spyOn(performance, 'now').mockImplementation(() => now);
  const query = vi.fn(async () => ({ rows: [{ singleton: true, enabled: true }] }));
  const access = createWebAccountAccess({ query } as unknown as Pool);
  await access();
  now = 5099;
  useApi({ webAccountAccess: access });
  const send = globalThis.fetch;
  vi.stubGlobal('fetch', vi.fn(async (path: string, init?: RequestInit) => {
   const response = await send(address + path, init);
   now += 2;
   return response;
  }));
  try {
   expect((await readWebAccountAccess()).enabled).toBe(true);
   expect(query).toHaveBeenCalledTimes(2);
   expect(games.view).not.toHaveBeenCalled();
  } finally { vi.restoreAllMocks(); vi.unstubAllGlobals(); }
 });
 it('serves signed-out status with only the remaining switch lease and no private work', async () => {
  let now = 100; vi.spyOn(performance, 'now').mockImplementation(() => now);
  const access = vi.fn(async () => ({ enabled: true, expiresAt: 1100.8 })), verify = vi.fn(), admit = vi.fn(), currentUser = vi.fn();
  useApi({ webAccountAccess: access, verify, admit, currentUser });
  try {
   for (const [time, expected] of [[100, 1000], [900, 200], [1100, 0]] as const) {
    now = time;
    const response = await call('/api/status?probe=1');
    expect([response.status, response.headers.get('Content-Type'), response.headers.get('Cache-Control'), response.headers.get('Referrer-Policy'), response.headers.get('WWW-Authenticate')]).toEqual([200, 'application/json; charset=utf-8', 'no-store', 'no-referrer', null]);
    expect(await response.json()).toEqual({ account_access: expected ? 'open' : 'closed', valid_for_ms: expected });
   }
   for (const spy of [verify, admit, currentUser, ...Object.values(games), ...Object.values(accounts), ...Object.values(safety), ...Object.values(players)]) expect(spy).not.toHaveBeenCalled();
   expect(access).toHaveBeenCalledTimes(3);
   useApi({ webAccountAccess: access, verify: undefined, admit: undefined, currentUser: undefined });
   expect((await call('/api/status')).status).toBe(200);
  } finally { vi.restoreAllMocks(); }
 });
 it.each([undefined, false, 'error', 'expired', 'invalid', 'long'])('bounds status or closes it for switch %s', async state => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  useApi({ webAccountAccess: state === undefined ? undefined : async () => {
   if (state === 'error') throw new Error('switch query failed');
   return { enabled: state !== false, expiresAt: state === 'expired' ? performance.now() - 1 : state === 'invalid' ? NaN : performance.now() + (state === 'long' ? 9000 : 5000) };
  } });
  try {
   const response = await call('/api/status'); expect(response.status).toBe(200);
   expect(await response.json()).toEqual(state === 'long' ? { account_access: 'open', valid_for_ms: 5000 } : { account_access: 'closed', valid_for_ms: 0 });
   expect(log).toHaveBeenCalledTimes(['error', 'expired', 'invalid'].includes(String(state)) ? 1 : 0);
  } finally { log.mockRestore(); }
 });
 it.each([{ extra: [] }, { extra: ['POST /api/games'] }, { extra: ['GET /api/unknown'] }])('keeps status closed without a private read ($extra) and guards untrusted requests', async ({ extra }) => {
  const access = vi.fn(webAccountAccess); useApi({ operations: new Set(['GET /api/status', ...extra]), webAccountAccess: access });
  expect(await (await call('/api/status')).json()).toEqual({ account_access: 'closed', valid_for_ms: 0 });
  expect(access).not.toHaveBeenCalled();
  useApi({ webAccountAccess: access });
  expect(await raw('/api/status', { Host: 'evil.example' })).toBe(403);
  const untrusted: Record<string, string>[] = [{ Origin: 'null' }, { Origin: 'https://evil.example' }, { 'Sec-Fetch-Site': 'cross-site' }];
  for (const headers of untrusted) expect((await call('/api/status', { headers })).status).toBe(403);
  const wrong = await call('/api/status', { method: 'POST', body: '{broken' });
  expect([wrong.status, wrong.headers.get('Allow'), (await wrong.json()).code]).toEqual([405, 'GET', 'NOT_ALLOWED']);
  expect(access).not.toHaveBeenCalled();
 });
 it.each([undefined, new Set<string>()])('closes all operations before request work with operations=%s', async closedOperations => {
  const verify = vi.fn(async () => alice), read = vi.fn(() => { throw new Error('Closed request reads its body'); });
  const access = vi.fn(webAccountAccess), closed = createApiHandler({ ...defaults, verify, webAccountAccess: access, operations: closedOperations });
  server.removeAllListeners('request'); server.on('request', (req, res) => { vi.spyOn(req, 'iterator').mockImplementation(read); void closed(req, res); });
  const token = await sign();
  const paths = [
   ...Array.from(operations, key => { const [method, path] = key.split(' '); return { method, path: path.replace(':id', gameId) }; }),
   ...['/api', '/api/', '/api/unknown', `/api/games/${gameId}?since=-1`].map(path => ({ method: 'GET', path })),
   { method: 'OPTIONS', path: '/api/games' }, { method: 'HEAD', path: '/api/me/games' },
  ];
  for (const { path, method } of paths) for (const identity of [undefined, token]) {
   const response = await call(path, { method, token: identity, ...(!['GET', 'HEAD'].includes(method) && { body: '{broken' }) });
   expect([path, method, response.status, response.headers.get('Content-Type'), response.headers.get('Cache-Control'), response.headers.get('X-Content-Type-Options'), response.headers.get('Allow')]).toEqual([path, method, 404, 'application/json; charset=utf-8', 'no-store', 'nosniff', null]);
   expect(method === 'HEAD' ? await response.text() : await response.json()).toEqual(method === 'HEAD' ? '' : { code: 'NOT_FOUND', message: 'Not found' });
  }
  expect((await call('/api/games', { method: 'POST', token, body: 'x'.repeat(MAX_API_BODY + 1), headers: { Host: 'evil.example', Origin: 'null' } })).status).toBe(404);
  expect(await raw('/api/games', { Authorization: `Bearer ${token}` }, 'x'.repeat(MAX_API_BODY + 1))).toBe(404);
  for (const spy of [access, verify, read, ...Object.values(games), ...Object.values(accounts), ...Object.values(safety), ...Object.values(players)]) expect(spy).not.toHaveBeenCalled();
 });
 it('opens only exact operation keys and lists only enabled methods', async () => {
  const verify = vi.fn(async () => alice), read = vi.fn(() => { throw new Error('Closed request reads its body'); });
  const enabled = new Set(['GET /api/me/profile']);
  const access = vi.fn(webAccountAccess), partial = createApiHandler({ ...defaults, verify, operations: enabled, webAccountAccess: access });
  server.removeAllListeners('request'); server.on('request', (req, res) => { if (req.method !== 'GET' || req.url !== '/api/me/profile') vi.spyOn(req, 'iterator').mockImplementation(read); void partial(req, res); });
  const token = await sign();
  for (const key of operations) {
   if (enabled.has(key)) continue;
   const [method, path] = key.split(' '), response = await call(path.replace(':id', gameId), { method, token, ...(method !== 'GET' && { body: 'x'.repeat(MAX_API_BODY + 1) }) });
   expect([key, response.status, (await response.json()).code, response.headers.get('Allow')]).toEqual([key, 404, 'NOT_FOUND', null]);
  }
  for (const spy of [access, verify, read, ...Object.values(games), ...Object.values(accounts), ...Object.values(safety), ...Object.values(players)]) expect(spy).not.toHaveBeenCalled();
  for (const method of ['DELETE', 'HEAD', 'OPTIONS']) {
   const response = await call('/api/me/profile', { method, token });
   expect([method, response.status, response.headers.get('Allow')]).toEqual([method, 405, 'GET']);
  }
  expect(verify).not.toHaveBeenCalled();
  expect((await call('/api/me/profile', { token, headers: { Origin: 'null' } })).status).toBe(403);
  expect((await call('/api/me/profile', { token })).status).toBe(200);
  expect(verify).toHaveBeenCalledTimes(1); expect(accounts.profile).toHaveBeenCalledWith(alice);
 });
 it.each([{ aud: 'authenticated' }, { aud: ['authenticated'] }])('reads settings with the website audience $aud', async ({ aud }) => {
  const response = await call('/api/me/settings', { token: await sign({ aud }) });
  expect(response.status).toBe(200);
  expect(players.settings).toHaveBeenCalledWith(alice, {});
 });
 it('admits a website session and refuses every other token before any service call', async () => {
  const ok = await call('/api/me/games', { token: await sign() });
  expect([ok.status, ok.headers.get('Cache-Control'), ok.headers.get('Access-Control-Allow-Origin')]).toEqual([200, 'no-store', null]);
  expect(games.inbox).toHaveBeenCalledWith(alice);
  const refused = {
   'no token': undefined,
   'wrong audience (the /mcp resource)': await sign({ aud: `${address}/mcp` }),
   'an MCP token (OAuth client_id)': await sign({ client_id: 'chatgpt' }),
   'a guest (anonymous)': await sign({ is_anonymous: true }),
   'no anonymous claim': await sign({ is_anonymous: undefined }),
   'the anon role': await sign({ role: 'anon' }),
   'another issuer': await sign({ iss: 'https://other.supabase.co/auth/v1' }),
   'another key': await sign({}, other),
   'expired': await sign({ exp: Math.floor(Date.now() / 1000) - 60 }),
   'not a user ID': await sign({ sub: 'not-a-user' }),
   'a mixed audience': await sign({ aud: ['authenticated', `${address}/mcp`] }),
   'an empty audience': await sign({ aud: [] }),
   'another audience in an array': await sign({ aud: [`${address}/mcp`] }),
   'a repeated website audience': await sign({ aud: ['authenticated', 'authenticated'] }),
   'an MCP token with an array audience': await sign({ aud: ['authenticated'], client_id: 'chatgpt' }),
  };
  for (const [name, token] of Object.entries(refused)) {
   const response = await call('/api/me/games', { token });
   expect([name, response.status, (await response.json()).code, response.headers.get('WWW-Authenticate')]).toEqual([name, 401, 'UNAUTHENTICATED', 'Bearer']);
  }
  expect(games.inbox).toHaveBeenCalledTimes(1);
 });
 it('answers 503, not 401, when the key set cannot load, and when sign-in is not configured', async () => {
  const down = createApiHandler({ ...defaults, verify: sessionVerifier(supabase, async () => { throw new errors.JWKSTimeout(); }) });
  server.removeAllListeners('request'); server.on('request', (req, res) => { void down(req, res); });
  const response = await call('/api/me/games', { token: await sign() });
  expect([response.status, response.headers.get('Retry-After'), (await response.json()).code]).toEqual([503, '5', 'UNAVAILABLE']);
  const off = createApiHandler({ ...defaults, verify: undefined });
  server.removeAllListeners('request'); server.on('request', (req, res) => { void off(req, res); });
  expect((await call('/api/me/games', { token: await sign() })).status).toBe(503);
  expect(games.inbox).not.toHaveBeenCalled();
  expect(() => sessionVerifier('http://project.supabase.co')).toThrow('HTTPS');
 });
 it('serves the same origin only: no CORS, no other host, no cross-site call', async () => {
  const token = await sign();
  for (const headers of [{ Origin: 'https://evil.example' }, { Origin: 'null' }, { 'Sec-Fetch-Site': 'cross-site' }, { 'Sec-Fetch-Site': 'same-site' }] as Record<string, string>[]) {
   const response = await call('/api/me/games', { token, headers });
   expect([JSON.stringify(headers), response.status, response.headers.get('Access-Control-Allow-Origin')]).toEqual([JSON.stringify(headers), 403, null]);
  }
  const preflight = await fetch(`${address}/api/games`, { method: 'OPTIONS', headers: { Origin: 'https://evil.example', 'Access-Control-Request-Method': 'POST' } });
  expect([preflight.status, preflight.headers.get('Access-Control-Allow-Origin')]).toEqual([403, null]);
  expect((await call('/api/me/games', { token, headers: { Origin: address, 'Sec-Fetch-Site': 'same-origin' } })).status).toBe(200);
  expect(await raw('/api/me/games', { Host: 'evil.example', Authorization: `Bearer ${token}` })).toBe(403);
  expect(games.inbox).toHaveBeenCalledTimes(1);
 });
 it('answers 404 and 405 for unknown routes and methods, bounds the body and refuses malformed JSON', async () => {
  const token = await sign();
  expect([(await call('/api/nothing', { token })).status, (await call('/api', { token })).status]).toEqual([404, 404]);
  const wrong = await call('/api/games', { token }); expect([wrong.status, wrong.headers.get('Allow')]).toEqual([405, 'POST']);
  expect((await call('/api/me/profile', { token, method: 'DELETE' })).headers.get('Allow')).toBe('GET, PATCH');
  expect((await call('/api/games', { token, method: 'POST', body: 'x'.repeat(MAX_API_BODY + 1) })).status).toBe(413);
  expect(await raw('/api/games', { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, `"${'x'.repeat(MAX_API_BODY)}"`)).toBe(413);
  const broken = await call('/api/games', { token, method: 'POST', body: '{broken' }); expect([broken.status, (await broken.json()).code]).toEqual([400, 'INVALID_INPUT']);
  expect(games.create).not.toHaveBeenCalled();
 });
 it('passes the verified actor, the path ID and `since`, and never an actor from input', async () => {
  const token = await sign();
  const created = await call('/api/games', { token, method: 'POST', body: { kind: 'solo', command_id: commandId } });
  expect([created.status, await created.json()]).toEqual([201, { view }]);
  expect(games.create).toHaveBeenCalledWith(alice, { kind: 'solo' }, commandId);
  await call(`/api/games/${gameId}?since=4`, { token }); expect(games.view).toHaveBeenLastCalledWith(alice, gameId, 4);
  await call(`/api/games/${gameId}`, { token }); expect(games.view).toHaveBeenLastCalledWith(alice, gameId, undefined);
  expect((await call(`/api/games/${gameId}?since=-1`, { token })).status).toBe(400);
  const related = await call('/api/relations', { token, method: 'POST', body: { kind: 'block', handle: 'bob' } });
  expect(related.status).toBe(204); expect(accounts.relate).toHaveBeenCalledWith(alice, { kind: 'block', handle: 'bob' });
 });
 it('keeps Find reserved when its method is wrong or the operation is closed', async () => {
  const token = await sign(), wrong = await call('/api/games/find', { token });
  expect([wrong.status, wrong.headers.get('Allow')]).toEqual([405, 'POST']); expect(games.view).not.toHaveBeenCalled();
  useApi({ operations: new Set(['GET /api/games/:id']) });
  expect((await call('/api/games/find', { token })).status).toBe(404); expect(games.view).not.toHaveBeenCalled();
 });
 it('rejects invalid start IDs, fields and local-only options before game work', async () => {
  const token = await sign();
  for (const body of [
   { kind: 'solo' },
   { kind: 'solo', command_id: '' },
   { kind: 'solo', command_id: 'x'.repeat(201) },
   { kind: 'solo', command_id: 'line\nbreak' },
   { kind: 'solo', command_id: commandId, actor: alice },
   { kind: 'solo', command_id: commandId, level: 'no' },
   { kind: 'solo', command_id: commandId, options: { ...DEFAULT_OPTIONS, design: { code: 'local-only-design' } } },
   { kind: 'solo', command_id: commandId, options: { ...DEFAULT_OPTIONS, pool: ['T'] } },
  ]) {
   const response = await call('/api/games', { token, method: 'POST', body });
   expect([response.status, (await response.json()).code]).toEqual([400, 'INVALID_INPUT']);
  }
  expect(games.create).not.toHaveBeenCalled(); expect(players.toolTry).not.toHaveBeenCalled();
 });
 it('passes the stable start ID on retries and returns a changed-input conflict', async () => {
  const token = await sign(), startId = commandId.replaceAll('-', ''), input = { kind: 'solo', command_id: startId };
  expect(startId).toMatch(/^[a-f0-9]{32}$/);
  for (let attempt = 0; attempt < 2; attempt++) {
   const response = await call('/api/games', { token, method: 'POST', body: input });
   expect([response.status, await response.json()]).toEqual([201, { view }]);
   expect(games.create).toHaveBeenLastCalledWith(alice, { kind: 'solo' }, startId);
  }
  games.create.mockRejectedValueOnce(new MatchServiceError('COMMAND_CONFLICT', 409, 'Command ID was used with different input'));
  const mismatch = await call('/api/games', { token, method: 'POST', body: { ...input, colour: 'black' } });
  expect([mismatch.status, (await mismatch.json()).code]).toEqual([409, 'COMMAND_CONFLICT']);
 });
 it('returns the newly issued invitation identity in the created friend view', async () => {
  const waiting = { ...view, kind: 'friend', status: 'waiting', invite_id: 'fresh-id' };
  games.create.mockResolvedValueOnce({ ...waiting, invite: { token: 'private-link', code: 'ABC234', expires_at: 'soon', invite_id: 'fresh-id' } });
  const response = await call('/api/games', { token: await sign(), method: 'POST', body: { kind: 'friend', options: DEFAULT_OPTIONS, command_id: commandId } });
  expect(response.status).toBe(201);
  const body = await response.json();
  expect(body.view).toEqual({ ...waiting, invite_id: 'fresh-id' });
  expect(body.invite.invite_id).toBe(body.view.invite_id);
  expect(games.invite).not.toHaveBeenCalled(); expect(games.view).not.toHaveBeenCalled();
 });
 it('validates named sends, ID acceptance, decline and independent invitation paging', async () => {
  const token = await sign(), invite_id = 'a'.repeat(64), recipient_id = gameId;
  expect((await call('/api/games', { token, method: 'POST', body: { kind: 'friend', options: DEFAULT_OPTIONS, recipient_id, command_id: commandId } })).status).toBe(201);
  expect(games.create).toHaveBeenLastCalledWith(alice, { kind: 'friend', options: DEFAULT_OPTIONS, recipient_id }, commandId);
  expect((await call('/api/invites/redeem', { token, method: 'POST', body: { invite_id } })).status).toBe(200);
  expect(games.join).toHaveBeenLastCalledWith(alice, { invite_id });
  expect((await call(`/api/invites/${invite_id}/decline`, { token, method: 'POST', body: {} })).status).toBe(200);
  expect(games.declineInvite).toHaveBeenLastCalledWith(alice, invite_id);
  expect((await call('/api/me/games?invitations=1&limit=2', { token })).status).toBe(200);
  expect(games.invitations).toHaveBeenCalledWith(alice, { limit: 2 });
  expect((await call('/api/friends?handle=rowan&limit=1', { token })).status).toBe(200);
  expect(games.friends).toHaveBeenCalledWith(alice, { handle: 'rowan', limit: 1 });
  for (const body of [{ kind: 'friend', recipient_id: 'bad' }, { kind: 'friend', recipient_id, open_link: true }, { kind: 'solo', recipient_id }])
   expect((await call('/api/games', { token, method: 'POST', body: { ...body, options: DEFAULT_OPTIONS, command_id: commandId } })).status).toBe(400);
  for (const body of [{ invite_id, token: 'token' }, { invite_id, actor: recipient_id }])
   expect((await call('/api/invites/redeem', { token, method: 'POST', body })).status).toBe(400);
  expect((await call('/api/friends?limit=51', { token })).status).toBe(400);
 });
 it.each(['FRIEND_GAME_LIMIT', 'FRIEND_INVITE_LIMIT', 'OPEN_INVITE_LIMIT'] as const)('returns safe count fields with HTTP 409 for %s', async code => {
  games.create.mockRejectedValueOnce(new MatchServiceError(code, 409, 'Limit notice.', { count: 5, handle: 'rowan' }));
  const response = await call('/api/games', { token: await sign(), method: 'POST', body: { kind: 'friend', recipient_id: gameId, options: DEFAULT_OPTIONS, command_id: commandId } });
  expect(response.status).toBe(409); expect(await response.json()).toEqual({ code, message: 'Limit notice.', count: 5, handle: 'rowan' });
 });
 it('returns only the service invite preview and never joins or reads a game', async () => {
  const token = await sign();
  for (const body of [{ token: 'private-link' }, { code: 'ABC234' }]) {
   const response = await call('/api/invites/preview', { token, method: 'POST', body });
   expect([response.status, await response.json()]).toEqual([200, await games.preview.mock.results[0].value]);
   expect(games.preview).toHaveBeenLastCalledWith(alice, 'token' in body ? body.token : body.code);
  }
  for (const body of [{}, { token: 't', code: 'c' }, { code: 'c', actor: alice }]) expect((await call('/api/invites/preview', { token, method: 'POST', body })).status).toBe(400);
  for (const spy of [games.join, games.view, games.seen]) expect(spy).not.toHaveBeenCalled();
 });
 it('uses shared settings, handle validation and exact profile pagination', async () => {
  const token = await sign(), me = { handle: 'alice', icon: null };
  for (const method of ['GET', 'PATCH']) {
   const response = await call('/api/me/settings', { token, method, ...(method === 'PATCH' && { body: { symbols_only: true } }) });
   expect(await response.json()).toEqual({ settings: await players.settings.mock.results[0].value, me });
  }
  expect(players.settings).toHaveBeenLastCalledWith(alice, { symbols_only: true });
  const available = await call('/api/me/handle', { token, method: 'POST', body: { handle: 'alice', check: true } });
  expect(await available.json()).toEqual({ me, available: true }); expect(players.handle).toHaveBeenLastCalledWith(alice, { handle: 'alice', check: true });
  for (const [path, method, body] of [['/api/me/settings', 'PATCH', { actor: alice }], ['/api/me/handle', 'POST', { handle: 'alice', actor: alice }]] as const) expect((await call(path, { token, method, body })).status).toBe(400);
  const blocks = Array.from({ length: 51 }, (_, i) => ({ user_id: `player-${i}`, handle: null })); players.blocks.mockResolvedValueOnce(blocks);
  const response = await call(`/api/me/record?before=cursor&blocks_after=${gameId}&notices_before=9007199254740993`, { token });
  expect(await response.json()).toEqual({ ...me, record: { total: 3 }, blocks: blocks.slice(0, 50), next_blocks_after: blocks[49].user_id, history: [], next_before: null, notices: [], next_notices_before: null });
  expect(accounts.notices).toHaveBeenLastCalledWith(alice, '9007199254740993');
  expect(players.blocks).toHaveBeenLastCalledWith(alice, gameId); expect(games.history).toHaveBeenLastCalledWith(alice, 'cursor');
  for (const query of ['blocks_after=bad', 'actor=a', '__proto__=bad', 'before=a&before=b', 'notices_before=0', 'notices_before=9223372036854775808', 'notices_before=1&notices_before=2']) expect((await call('/api/me/record?' + query, { token })).status).toBe(400);
 });
 it('validates block targets and reads state without write admission', async () => {
  const token = await sign(), admit = vi.fn(() => () => {}); useApi({ admit });
  const response = await call(`/api/blocks?game_id=${gameId}`, { token });
  expect(await response.json()).toEqual({ blocked: true }); expect(admit).not.toHaveBeenCalled(); expect(players.block).toHaveBeenLastCalledWith(alice, { game_id: gameId }, undefined);
  for (const query of ['', 'game_id=bad', `game_id=${gameId}&user_id=${alice}`, `game_id=${gameId}&blocked=true`, `game_id=${gameId}&game_id=${gameId}`, `user_id=${alice}&actor=a`]) expect((await call('/api/blocks?' + query, { token })).status).toBe(400);
  const changed = await call('/api/blocks', { token, method: 'POST', body: { game_id: gameId, blocked: false } });
  expect(await changed.json()).toEqual({ blocked: true, view }); expect(players.block).toHaveBeenLastCalledWith(alice, { game_id: gameId }, false); expect(admit).toHaveBeenCalledOnce();
  expect((await call('/api/blocks', { token, method: 'POST', body: { user_id: alice, blocked: 'false' } })).status).toBe(400);
 });
 it('routes Find, Accept, Cancel and lobby through game service and start quota', async () => {
  const token = await sign(), body = { options: DEFAULT_OPTIONS, colour: 'random', any_rules: true, command_id: commandId.replaceAll('-', '') };
  expect((await call('/api/games/find', { token, method: 'POST', body })).status).toBe(200);
  expect(games.find).toHaveBeenCalledWith(alice, DEFAULT_OPTIONS, 'random', body.command_id, true, undefined); expect(players.toolTry).toHaveBeenCalledWith(alice, 'kingdown_create');
  for (const operation of ['accept', 'cancel']) {
   expect((await call(`/api/games/${gameId}/${operation}`, { token, method: 'POST', body: {} })).status).toBe(200);
   expect(games[operation]).toHaveBeenCalledWith(alice, gameId, ...(operation === 'accept' ? [undefined] : []));
   expect((await call(`/api/games/${gameId}/${operation}`, { token, method: 'POST', body: { actor: alice } })).status).toBe(400);
  }
  expect(await (await call('/api/lobby', { token })).json()).toEqual({ games: [], server_now: expect.any(String) });
 });
 it('forwards Ranked without saved custom options and admits only declared acceptance policies', async () => {
  vi.stubEnv('VITE_KINGDOWN_STAGE', 'staging'); // Ranked is offered only in staging (ticket 67).
  const token = await sign();
  expect((await call('/api/games/find', { token, method:'POST', body:{ mode:'ranked',command_id:commandId } })).status).toBe(200);
  expect(games.find).toHaveBeenCalledExactlyOnceWith(alice,undefined,undefined,commandId,undefined,'ranked');
  const setup=createArguments(readSetup({kind:'random',mode:'ranked'}));
  expect((await call('/api/games/find',{token,method:'POST',body:{...setup,command_id:commandId}})).status).toBe(200);
  expect(games.find).toHaveBeenLastCalledWith(alice,setup.options,'random',commandId,undefined,'ranked');
  for (const rating_policy of ['legacy','casual','ranked-v1']) {
   expect((await call(`/api/games/${gameId}/accept`, { token,method:'POST',body:{rating_policy} })).status).toBe(200);
   expect(games.accept).toHaveBeenLastCalledWith(alice,gameId,rating_policy);
  }
  games.find.mockClear(); games.accept.mockClear();
  for (const mode of ['ranked-v1',null,{},true]) expect((await call('/api/games/find',{token,method:'POST',body:{mode,command_id:commandId}})).status).toBe(400);
  for (const rating_policy of ['ranked',null,{},true]) expect((await call(`/api/games/${gameId}/accept`,{token,method:'POST',body:{rating_policy}})).status).toBe(400);
  expect(games.find).not.toHaveBeenCalled(); expect(games.accept).not.toHaveBeenCalled();
 });
 it('shares computer and report quotas and fails closed without the account service', async () => {
  const token = await sign();
  await call(`/api/games/${gameId}/commands`, { token, method: 'POST', body: { action: { type: 'computer' } } });
  expect(players.toolTry).toHaveBeenLastCalledWith(alice, 'kingdown_computer');
  await call('/api/reports', { token, method: 'POST', body: {} }); expect(players.toolTry).toHaveBeenLastCalledWith(alice, 'kingdown_report');
  players.toolTry.mockRejectedValueOnce(new MatchServiceError('RATE_LIMITED', 429, 'Wait'));
  expect((await call('/api/games', { token, method: 'POST', body: { kind: 'solo', command_id: commandId } })).status).toBe(429); expect(games.create).not.toHaveBeenCalled();
  useApi({ players: undefined }); expect((await call('/api/me/settings', { token })).status).toBe(503);
 });
 it('counts a rematch offer or accept on the Create quota, and a resign or decline on none', async () => {
  const token = await sign(), command = (action: object) => call(`/api/games/${gameId}/commands`, { token, method: 'POST', body: { command_id: commandId, expected_revision: 0, action } });
  for (const choice of ['offer', 'accept']) {
   players.toolTry.mockClear();
   await command({ type: 'rematch', choice }); expect(players.toolTry).toHaveBeenCalledExactlyOnceWith(alice, 'kingdown_create');
  }
  players.toolTry.mockClear();
  await command({ type: 'resign' }); await command({ type: 'rematch', choice: 'decline' }); expect(players.toolTry).not.toHaveBeenCalled();
  games.command.mockClear(); players.toolTry.mockRejectedValueOnce(new MatchServiceError('RATE_LIMITED', 429, 'Too many new games. Wait one minute, then try again.'));
  expect((await command({ type: 'rematch', choice: 'offer' })).status).toBe(429); expect(games.command).not.toHaveBeenCalled();
 });
 it('keeps full, zero, delta and equal-revision reads free of activity and write checks', async () => {
  const admit = vi.fn(), currentUser = vi.fn(); useApi({ admit, currentUser });
  const token = await sign();
  for (const since of [undefined, 0, 1, 4]) {
   expect((await call(`/api/games/${gameId}${since === undefined ? '' : `?since=${since}`}`, { token })).status).toBe(200);
   expect(games.view).toHaveBeenLastCalledWith(alice, gameId, since);
  }
  for (const since of ['-1', '1.5', '10000', 'x']) expect((await call(`/api/games/${gameId}?since=${since}`, { token })).status).toBe(400);
  expect(games.view).toHaveBeenCalledTimes(4);
  for (const spy of [games.seen, admit, currentUser]) expect(spy).not.toHaveBeenCalled();
 });
 it('records only explicit activity with the verified actor and path ID, with no body or an empty object', async () => {
  const token = await sign(), path = `/api/games/${gameId}/seen`;
  for (const body of [undefined, {}]) {
   const response = await call(path, { token, method: 'POST', body });
   expect([response.status, response.headers.get('Cache-Control'), await response.text()]).toEqual([204, 'no-store', '']);
   expect(games.seen).toHaveBeenLastCalledWith(alice, gameId);
  }
  for (const body of [null, [], true, 1, '"text"', { actor: alice }, { user_id: alice }, { seat: 0 }, { timestamp: 0 }, { game_id: gameId }, '{broken']) {
   const response = await call(path, { token, method: 'POST', body });
   expect([body, response.status, (await response.json()).code]).toEqual([body, 400, 'INVALID_INPUT']);
  }
  expect((await call(path, { token, method: 'POST', body: 'x'.repeat(MAX_API_BODY + 1) })).status).toBe(413);
  expect(games.seen).toHaveBeenCalledTimes(2); expect(games.command).not.toHaveBeenCalled();
  for (const [code, status] of [['NOT_FOUND', 404], ['FORBIDDEN', 403]] as const) {
   games.seen.mockRejectedValueOnce(new MatchServiceError(code, status, 'Refused'));
   expect((await call(path, { token, method: 'POST' })).status).toBe(status);
  }
 });
 it('closes enabled private operations before token, input and service work when switch proof is absent, off or invalid', async () => {
  const verify = vi.fn(async () => alice), admit = vi.fn(), currentUser = vi.fn();
  const switches: ApiOptions['webAccountAccess'][] = [undefined, async () => ({ enabled: false, expiresAt: performance.now() + 5000 }), async () => { throw new Error('database'); }, () => { throw new Error('pool'); }, async () => ({ enabled: true, expiresAt: performance.now() - 1 }), async () => ({ enabled: true, expiresAt: NaN })];
  const read = vi.fn(() => { throw new Error('Closed request reads its body'); });
  for (const access of switches) {
   const api = createApiHandler({ ...defaults, verify, admit, currentUser, webAccountAccess: access });
   server.removeAllListeners('request'); server.on('request', (req, res) => { vi.spyOn(req, 'iterator').mockImplementation(read); void api(req, res); });
   for (const key of operations) {
    if (key === 'GET /api/status') continue;
    const [method, path] = key.split(' '), response = await call(path.replace(':id', gameId), { method, token: await sign(), ...(method !== 'GET' && { body: '{broken' }) });
    expect([key, response.status, response.headers.get('Retry-After'), response.headers.get('Cache-Control'), await response.json()]).toEqual([key, 503, '5', 'no-store', { ...(key === 'POST /api/games/:id/commands' && { type: 'reject', command_id: '' }), code: 'UNAVAILABLE', message: 'Account play is temporarily unavailable. Try again or play on this device.' }]);
   }
  }
  for (const spy of [verify, admit, currentUser, read, ...Object.values(games), ...Object.values(accounts), ...Object.values(safety), ...Object.values(players)]) expect(spy).not.toHaveBeenCalled();
 });
 it.each(['admit', 'currentUser', 'both'])('refuses every enabled mutation when %s is missing', async missing => {
  const admit = vi.fn(() => () => {}), currentUser = vi.fn(async () => {});
  useApi({ admit: missing === 'currentUser' ? admit : undefined, currentUser: missing === 'admit' ? currentUser : undefined });
  for (const key of operations) {
   const [method, path] = key.split(' '); if (method === 'GET') continue;
   const response = await call(path.replace(':id', gameId), { token: await sign(), method, body: '{broken' });
   expect([key, response.status, response.headers.get('Retry-After'), (await response.json()).code]).toEqual([key, 503, '5', 'UNAVAILABLE']);
  }
  for (const spy of [admit, currentUser, ...Object.values(games), ...Object.values(accounts), ...Object.values(safety), ...Object.values(players)]) expect(spy).not.toHaveBeenCalled();
 });
 it('checks the switch, token, slot, current user and bounded input in order, then releases after service work', async () => {
  const order: string[] = [], token = await sign();
  const api = createApiHandler({ ...defaults,
   webAccountAccess: async () => { order.push('access'); return webAccountAccess(); },
   verify: async bearer => { expect(bearer).toBe(token); order.push('verify'); return alice; },
   admit: actor => { expect(actor).toBe(alice); order.push('admit'); return () => { order.push('release'); }; },
   currentUser: async (bearer, actor) => { expect([bearer, actor]).toEqual([token, alice]); order.push('currentUser'); },
  });
  server.removeAllListeners('request'); server.on('request', (req, res) => {
   const iterator = req.iterator.bind(req); vi.spyOn(req, 'iterator').mockImplementation(options => { order.push('body'); return iterator(options); }); void api(req, res);
  });
  games.seen.mockImplementation(async () => { order.push('service'); });
  expect((await call(`/api/games/${gameId}/seen`, { token, method: 'POST', body: {} })).status).toBe(204);
  expect(order).toEqual(['access', 'verify', 'access', 'admit', 'currentUser', 'access', 'body', 'access', 'service', 'release']);
 });
 it('refuses a bad token or a full slot before provider, input and service work', async () => {
  const release = vi.fn(), admit = vi.fn(() => release), currentUser = vi.fn(async () => {});
  useApi({ admit, currentUser });
  expect((await call(`/api/games/${gameId}/seen`, { method: 'POST', body: '{broken' })).status).toBe(401);
  expect(admit).not.toHaveBeenCalled();
  admit.mockImplementationOnce(() => { throw new MatchServiceError('RATE_LIMITED', 429, 'Busy'); });
  expect((await call(`/api/games/${gameId}/seen`, { token: await sign(), method: 'POST', body: '{broken' })).status).toBe(429);
  for (const spy of [currentUser, release, games.seen]) expect(spy).not.toHaveBeenCalled();
 });
 it.each(['provider', 'provider unavailable', 'provider fault', 'input', 'large input', 'service'])('releases the write slot after %s failure', async stage => {
  const release = vi.fn(), currentUser = vi.fn(async () => {});
  if (stage.startsWith('provider')) currentUser.mockRejectedValueOnce(stage === 'provider' ? new AuthenticationError() : stage === 'provider unavailable' ? new AuthenticationUnavailable() : new Error('private fault'));
  if (stage === 'service') games.seen.mockRejectedValueOnce(new MatchServiceError('FORBIDDEN', 403, 'No seat'));
  useApi({ admit: () => release, currentUser });
  const response = await call(`/api/games/${gameId}/seen`, { token: await sign(), method: 'POST', body: stage === 'input' ? '{broken' : stage === 'large input' ? 'x'.repeat(MAX_API_BODY + 1) : {} });
  expect(response.status).toBe(stage === 'provider' ? 401 : stage.startsWith('provider') ? 503 : stage === 'input' ? 400 : stage === 'large input' ? 413 : 403);
  expect(release).toHaveBeenCalledOnce(); expect(games.seen).toHaveBeenCalledTimes(stage === 'service' ? 1 : 0);
 });
 it.each([['verify', 'POST'], ['currentUser', 'POST'], ['body', 'POST'], ['verify', 'GET'], ['body', 'GET']])('checks switch proof again after the %s wait on %s', async (stage, method) => {
  let enabled = true, unblock!: () => void, entered!: () => void;
  const gate = new Promise<void>(resolve => { unblock = resolve; }), started = new Promise<void>(resolve => { entered = resolve; }), release = vi.fn(), admit = vi.fn(() => release), currentUser = vi.fn(async () => { if (stage === 'currentUser') { entered(); await gate; } });
  const api = createApiHandler({ ...defaults, admit, currentUser, webAccountAccess: async () => ({ enabled, expiresAt: performance.now() + 5000 }), verify: async () => { if (stage === 'verify') { entered(); await gate; } return alice; } });
  server.removeAllListeners('request'); server.on('request', (req, res) => {
   if (stage === 'body') {
    const iterator = req.iterator.bind(req); vi.spyOn(req, 'iterator').mockImplementation(options => (async function* () { entered(); await gate; yield* iterator(options); return undefined; })());
   }
   void api(req, res);
  });
  const pending = call(`/api/games/${gameId}${method === 'POST' ? '/seen' : ''}`, { token: await sign(), method, ...(method === 'POST' && { body: {} }) });
  await started; enabled = false; unblock();
  const response = await pending; expect([response.status, response.headers.get('Retry-After')]).toEqual([503, '5']);
  expect(games.seen).not.toHaveBeenCalled(); expect(games.view).not.toHaveBeenCalled(); expect(admit).toHaveBeenCalledTimes(stage === 'verify' || method === 'GET' ? 0 : 1); expect(release).toHaveBeenCalledTimes(stage === 'verify' || method === 'GET' ? 0 : 1);
 });
 it('holds the write slot after disconnect until service work ends', async () => {
  let unblock!: () => void, entered!: () => void, ended!: () => void;
  const gate = new Promise<void>(resolve => { unblock = resolve; }), started = new Promise<void>(resolve => { entered = resolve; }), done = new Promise<void>(resolve => { ended = resolve; });
  const release = vi.fn(() => { ended(); }); useApi({ admit: () => release });
  games.seen.mockImplementation(async () => { entered(); await gate; });
  const req = request(`${address}/api/games/${gameId}/seen`, { method: 'POST', headers: { Authorization: `Bearer ${await sign()}` } });
  req.on('error', () => {}); req.end();
  await started; const closed = new Promise<void>(resolve => { req.once('close', resolve); }); req.destroy(); await closed;
  expect(release).not.toHaveBeenCalled(); unblock(); await done; expect(release).toHaveBeenCalledOnce();
 });
 it('answers a command with the protocol reply: ack, or reject with the code and the command ID', async () => {
  const token = await sign(), path = `/api/games/${gameId}/commands`, command = { command_id: 'c1', expected_revision: 0, action: { type: 'resign' } };
  expect(await (await call(path, { token, method: 'POST', body: command })).json()).toEqual({ type: 'ack', command_id: 'c1', revision: 1, view });
  expect(games.command).toHaveBeenCalledWith(alice, gameId, command, 'web');
  games.command.mockRejectedValueOnce(new MatchServiceError('STALE_REVISION', 409, 'The game changed'));
  const stale = await call(path, { token, method: 'POST', body: command });
  expect([stale.status, await stale.json()]).toEqual([409, { type: 'reject', command_id: 'c1', code: 'STALE_REVISION', message: 'The game changed' }]);
  games.command.mockRejectedValueOnce(new Error('postgres://secret@host'));
  const crash = await call(path, { token, method: 'POST', body: command });
  expect([crash.status, JSON.stringify(await crash.json()).includes('secret')]).toEqual([500, false]);
 });
 it.each([
  ['/api/games', 'create', { kind: 'solo', command_id: commandId }],
  ['/api/games/find', 'find', { options: DEFAULT_OPTIONS, command_id: commandId }],
  [`/api/games/${gameId}/accept`, 'accept', {}],
  ['/api/invites/redeem', 'join', { token: 'invite' }],
 ] as const)('bounds engine work for %s while reads stay available', async (path, operation, body) => {
  let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
  games[operation].mockImplementation(async () => { await gate; return view; });
  const token = await sign(), pending = Array.from({ length: MAX_ACTIVE_ENGINE }, () => call(path, { token, method: 'POST', body }));
  try {
   await vi.waitFor(() => expect(games[operation]).toHaveBeenCalledTimes(MAX_ACTIVE_ENGINE));
   expect((await call(path, { token, method: 'POST', body })).status).toBe(503);
   expect((await call(`/api/games/${gameId}`, { token })).status).toBe(200);
  } finally { release(); }
  for (const response of await Promise.all(pending)) expect(response.status).toBe(operation === 'create' ? 201 : 200);
 });
 it(`bounds engine work to ${MAX_ACTIVE_ENGINE} requests for each instance; reads still pass`, async () => {
  const slot = vi.fn(); useApi({ admit: () => slot });
  let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
  games.command.mockImplementation(async () => { await gate; return view; });
  const token = await sign(), path = `/api/games/${gameId}/commands`;
  const pending = Array.from({ length: MAX_ACTIVE_ENGINE }, (_, i) => call(path, { token, method: 'POST', body: { command_id: `c${i}` } }));
  await vi.waitFor(() => expect(games.command).toHaveBeenCalledTimes(MAX_ACTIVE_ENGINE));
  expect(slot).not.toHaveBeenCalled();
  const busy = await call(path, { token, method: 'POST', body: {} });
  expect([busy.status, busy.headers.get('Retry-After')]).toEqual([503, '1']);
  expect((await call(`/api/games/${gameId}`, { token })).status).toBe(200);
  expect(slot).toHaveBeenCalledOnce();
  release(); for (const response of await Promise.all(pending)) expect(response.status).toBe(200);
  expect((await call(path, { token, method: 'POST', body: {} })).status).toBe(200);
  expect(slot).toHaveBeenCalledTimes(MAX_ACTIVE_ENGINE + 2);
 });
});

describe('internal job endpoints', () => {
 it('run a job only with the exact secret, compared in constant time', async () => {
  for (const headers of [{}, { 'X-Kingdown-Internal': 'wrong' }, { 'X-Kingdown-Internal': `${secret}x` }, { 'X-Kingdown-Internal': secret.slice(1) }] as Record<string, string>[])
   expect((await fetch(`${address}/internal/tick`, { method: 'POST', headers })).status).toBe(403);
  expect(games.sweep).not.toHaveBeenCalled();
  const tick = await fetch(`${address}/internal/tick`, { method: 'POST', headers: { 'X-Kingdown-Internal': secret } });
  expect([tick.status, tick.headers.get('Cache-Control'), await tick.json()]).toEqual([200, 'no-store', { ended: 0 }]);
  expect((await fetch(`${address}/internal/tick`, { headers: { 'X-Kingdown-Internal': secret } })).status).toBe(405);
  expect((await fetch(`${address}/internal/other`, { method: 'POST', headers: { 'X-Kingdown-Internal': secret } })).status).toBe(404);
  for (const path of ['outbox', 'reminders']) {
   const response = await fetch(`${address}/internal/${path}`, { method: 'POST', headers: { 'X-Kingdown-Internal': secret } });
   expect([response.status, (await response.json()).code]).toEqual([404, 'NOT_FOUND']);
  }
 });
 it('stay closed without a secret of at least 32 characters', async () => {
  for (const short of [undefined, '', 'x'.repeat(31)]) {
   server.closeAllConnections(); await new Promise(done => server.close(done));
   await serve({}, { secret: short });
   expect((await fetch(`${address}/internal/tick`, { method: 'POST', headers: { 'X-Kingdown-Internal': short ?? '' } })).status).toBe(503);
  }
  expect(games.sweep).not.toHaveBeenCalled();
 });
});

it('authenticates and bounds a private draft preview without a command or activity write', async () => {
 const engine_fingerprint = 'sha256:'+'a'.repeat(64), input = {expected_revision:3,engine_fingerprint,actions:['Ra1-a4!H']};
 const draft = {game_id:gameId,revision:3,engine_fingerprint,actions:input.actions,positions:[{fen:'private draft',status:'playing',turn:0,in_check:false,moves:[]}]};
 games.previewDraft = vi.fn(async()=>draft);
 expect((await call(`/api/games/${gameId}/preview`,{method:'POST',body:input})).status).toBe(401);
 expect(games.previewDraft).not.toHaveBeenCalled();
 const token = await sign();
 const response = await call(`/api/games/${gameId}/preview`,{token,method:'POST',body:input});
 expect(response.status).toBe(200); expect(response.headers.get('cache-control')).toBe('no-store');
 expect(await response.json()).toEqual(draft);
 expect(games.previewDraft).toHaveBeenCalledExactlyOnceWith(alice,gameId,input);
 for (const extra of [{actor_id:alice},{actions:Array(5).fill('e2-e4')},{engine_fingerprint:'unknown'}]) expect((await call(`/api/games/${gameId}/preview`,{token,method:'POST',body:{...input,...extra}})).status).toBe(400);
 expect(games.previewDraft).toHaveBeenCalledOnce(); expect(games.command).not.toHaveBeenCalled(); expect(games.seen).not.toHaveBeenCalled();
});
