/** The HTTP boundary of /api and /internal with stub services: who gets in, what a browser may send, and the bounds. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createServer, request, type Server } from 'node:http';
import { once } from 'node:events';
import { createLocalJWKSet, errors, exportJWK, generateKeyPair, SignJWT, type JWTPayload } from 'jose';
import { MatchServiceError } from '../match/service';
import { createApiHandler, createInternalHandler, MAX_ACTIVE_ENGINE, MAX_API_BODY, sessionVerifier, type ApiOptions } from './http';

const alice = '11111111-1111-4111-8111-111111111111', gameId = '33333333-3333-4333-8333-333333333333';
const supabase = 'https://project.supabase.co', issuer = `${supabase}/auth/v1`, secret = 'x'.repeat(40);
const view = { game_id: gameId, revision: 1, kind: 'solo' };
let address: string, sign: (claims?: JWTPayload, key?: CryptoKey) => Promise<string>, games: Record<string, ReturnType<typeof vi.fn>>, accounts: Record<string, ReturnType<typeof vi.fn>>;
let other: CryptoKey, server: Server;
async function serve(options: Partial<ApiOptions> = {}, internal: { secret?: string; sender?: () => never } = {}) {
 server = createServer(); server.listen(0, '127.0.0.1'); await once(server, 'listening');
 address = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
 const pair = await generateKeyPair('ES256'); other = (await generateKeyPair('ES256')).privateKey;
 const keys = createLocalJWKSet({ keys: [{ ...await exportJWK(pair.publicKey), kid: 'test', alg: 'ES256' }] });
 // A Supabase session's claims; a test changes one of them.
 sign = (claims = {}, key = pair.privateKey) => { const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ iss: issuer, aud: 'authenticated', sub: alice, role: 'authenticated', is_anonymous: false, session_id: 's', iat: now, exp: now + 300, ...claims }).setProtectedHeader({ alg: 'ES256', kid: 'test' }).sign(key); };
 games = { create: vi.fn(async () => view), view: vi.fn(async () => view), command: vi.fn(async () => view), inbox: vi.fn(async () => []), invite: vi.fn(), join: vi.fn(async () => view), sweep: vi.fn(async () => 0) };
 accounts = { profile: vi.fn(async () => ({ user_id: alice })), relate: vi.fn(async () => undefined) };
 const api = createApiHandler({ games: games as never, accounts: accounts as never, safety: {} as never, publicOrigin: address, verify: sessionVerifier(supabase, keys), ...options });
 const jobs = createInternalHandler({ games: games as never, publicOrigin: address, secret, sender: () => { throw new Error('no email'); }, ...internal });
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
  };
  for (const [name, token] of Object.entries(refused)) {
   const response = await call('/api/me/games', { token });
   expect([name, response.status, (await response.json()).code, response.headers.get('WWW-Authenticate')]).toEqual([name, 401, 'UNAUTHENTICATED', 'Bearer']);
  }
  expect(games.inbox).toHaveBeenCalledTimes(1);
 });
 it('answers 503, not 401, when the key set cannot load, and when sign-in is not configured', async () => {
  const down = createApiHandler({ games: games as never, accounts: accounts as never, safety: {} as never, publicOrigin: address, verify: sessionVerifier(supabase, async () => { throw new errors.JWKSTimeout(); }) });
  server.removeAllListeners('request'); server.on('request', (req, res) => { void down(req, res); });
  const response = await call('/api/me/games', { token: await sign() });
  expect([response.status, response.headers.get('Retry-After'), (await response.json()).code]).toEqual([503, '5', 'UNAVAILABLE']);
  const off = createApiHandler({ games: games as never, accounts: accounts as never, safety: {} as never, publicOrigin: address });
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
  const created = await call('/api/games', { token, method: 'POST', body: { kind: 'solo', actor: 'someone' } });
  expect([created.status, await created.json()]).toEqual([201, { view }]);
  expect(games.create).toHaveBeenCalledWith(alice, { kind: 'solo', actor: 'someone' });
  await call(`/api/games/${gameId}?since=4`, { token }); expect(games.view).toHaveBeenLastCalledWith(alice, gameId, 4);
  await call(`/api/games/${gameId}`, { token }); expect(games.view).toHaveBeenLastCalledWith(alice, gameId, undefined);
  expect((await call(`/api/games/${gameId}?since=-1`, { token })).status).toBe(400);
  const related = await call('/api/relations', { token, method: 'POST', body: { kind: 'block', handle: 'bob' } });
  expect(related.status).toBe(204); expect(accounts.relate).toHaveBeenCalledWith(alice, { kind: 'block', handle: 'bob' });
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
 it(`bounds engine work to ${MAX_ACTIVE_ENGINE} requests for each instance; reads still pass`, async () => {
  let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
  games.command.mockImplementation(async () => { await gate; return view; });
  const token = await sign(), path = `/api/games/${gameId}/commands`;
  const pending = Array.from({ length: MAX_ACTIVE_ENGINE }, (_, i) => call(path, { token, method: 'POST', body: { command_id: `c${i}` } }));
  await vi.waitFor(() => expect(games.command).toHaveBeenCalledTimes(MAX_ACTIVE_ENGINE));
  const busy = await call(path, { token, method: 'POST', body: {} });
  expect([busy.status, busy.headers.get('Retry-After')]).toEqual([503, '1']);
  expect((await call(`/api/games/${gameId}`, { token })).status).toBe(200);
  release(); for (const response of await Promise.all(pending)) expect(response.status).toBe(200);
  expect((await call(path, { token, method: 'POST', body: {} })).status).toBe(200);
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
  const mail = await fetch(`${address}/internal/outbox`, { method: 'POST', headers: { 'X-Kingdown-Internal': secret } });
  expect([mail.status, (await mail.json()).message]).toEqual([503, 'Email is not configured']);
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
