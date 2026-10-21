import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createServer, request, type Server } from 'node:http';
import { once } from 'node:events';
import { createLocalJWKSet, decodeJwt, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { createTokenVerifier, type PluginAuth } from './auth';
import { MatchServiceError } from '../match/service';
import type { View } from '../match/protocol';
import { createPluginHandler, MAX_MCP_BODY, type PluginHttpOptions } from './http';
const alice = '11111111-1111-4111-8111-111111111111', bob = '22222222-2222-4222-8222-222222222222';
const matchId = '33333333-3333-4333-8333-333333333333';
const view: View = { rating_policy: 'legacy', game_id: matchId, revision: 0, created_at: '2030-01-01T00:00:00.000Z', abort_open: true, seat: 0, kind: 'solo', speed: 'live', days_per_move: null, status: 'playing', turn: 0, action: 'ready', fen: '7k/8/8/8/8/8/8/K7 w - - 0 1',
  in_check: false, legal: [], last_commands: [], opponent: null, draw_offer: null, deadline_at: null, server_now: '2030-01-01T00:00:00.000Z' };
const servers: Server[] = [];
const provider = vi.fn<typeof fetch>();
let service: PluginHttpOptions['service'], auth: PluginAuth, address: string, privateKey: CryptoKey;
beforeEach(async () => {
  provider.mockReset();
  provider.mockImplementation(async (_url, options) => Response.json({ id: decodeJwt(new Headers(options?.headers).get('Authorization')!.slice(7)).sub }));
  service = { toolTry: vi.fn(async () => {}), openBoard: vi.fn(async () => matchId), board: vi.fn(async () => matchId), selectBoard: vi.fn(async () => {}), seen: vi.fn(async () => {}), inbox: vi.fn(async () => [{ ...view, options: null, move: 1, open_until: null, level: 'club' as const, status: 'playing' as const, updated_at: view.server_now }]), create: vi.fn(async () => view), previewDraft: vi.fn(), view: vi.fn(async () => view), command: vi.fn(async () => view),
    invite: vi.fn(async () => ({ token: 'test', code: 'ABCDEF', expires_at: '2030-01-01' })), join: vi.fn(async () => view), lobby: vi.fn(async () => ({ games: [] })), accept: vi.fn(async () => view), find: vi.fn(async () => view), cancel: vi.fn(async () => view), report: vi.fn(async () => ({ id: 1, created_at: '2030-01-01' })), profile: vi.fn(async () => ({ user_id: alice, handle: null, icon: null })),
    notices: vi.fn(async () => ({notices:[],next_notices_before:null})), blocks: vi.fn(async () => []), block: vi.fn(async () => false), preview: vi.fn(async () => ({ code: 'ABCDEF', options: null, kind: 'friend' as const, colour: 'black' as const, creator: { handle: null, icon: null }, expires_at: '2030-01-01' })), handle: vi.fn(async () => ({ user_id: alice, handle: null, icon: null })), settings: vi.fn(async () => ({ symbols_only: false, show_threats: false, online_visible_to: 'mutual' as const, last_setup: null })), history: vi.fn(async () => ({ games: [], next_before: null })), record: vi.fn(async () => ({ totals: { played: 0, won: 0, drawn: 0, lost: 0 }, rating: { rating: 1500, rd: 350, volatility: 0.06, provisional: true }, badges: [] })) };
  const pair = await generateKeyPair('ES256'); privateKey = pair.privateKey;
  const server = createServer(); servers.push(server); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  address = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  auth = createTokenVerifier({ supabaseUrl: 'https://project.supabase.co', publicOrigin: address, publishableKey: 'sb_publishable_test' }, createLocalJWKSet({ keys: [{ ...await exportJWK(pair.publicKey), kid: 'test', alg: 'ES256' }] }), provider);
  const handler = createPluginHandler({ service, auth, resourceHtml: '<html>board</html>', publicOrigin: address, consent: { html: '<html>consent</html>', script: 'console.log(1)', supabaseOrigin: 'https://project.supabase.co' } });
  server.on('request', (req, res) => { void handler(req, res).catch(() => { res.statusCode = 500; res.end(); }); });
});
afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => new Promise<void>((resolve, reject) => { server.closeAllConnections(); server.close(error => error ? reject(error) : resolve()); })));
});
async function token(actor = alice, aud = auth.resource) {
  return new SignJWT({ role: 'authenticated', client_id: 'oauth-client', scope: 'openid' }).setProtectedHeader({ alg: 'ES256', kid: 'test' }).setIssuer(auth.issuer).setAudience(aud).setSubject(actor).setExpirationTime('5m').sign(privateKey);
}
async function post(body: unknown, bearer?: string, headers: Record<string, string> = {}, signal?: AbortSignal) {
  return fetch(`${address}/mcp`, { method: 'POST', signal, headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', 'MCP-Protocol-Version': '2025-11-25', ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}), ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) });
}
const list = { jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} };
const get = { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'kingdown_get', arguments: { game_id: matchId } } };
describe('stateless authenticated MCP HTTP', () => {
  it('rejects the same signed token after provider revocation before service access', async () => {
    const bearer = await token();
    const first = await post(get, bearer); expect(first.status).toBe(200); await first.json();
    provider.mockResolvedValue(new Response('{}', { status: 401 }));
    const revoked = await post(get, bearer); expect(revoked.status).toBe(401);
    expect(service.view).toHaveBeenCalledTimes(1);
  });
  it('returns retryable provider failure without an OAuth challenge or service access', async () => {
    provider.mockResolvedValueOnce(new Response('{}', {status:503}));
    const result = await post(get, await token());
    expect(result.status).toBe(503); expect(result.headers.has('WWW-Authenticate')).toBe(false); expect(result.headers.get('Retry-After')).toBe('5');
    expect(service.view).not.toHaveBeenCalled();
    expect((await post(get, await token())).status).toBe(200);
  });
  it.each(['kingdown_create','kingdown_resume','kingdown_join'])('recovers a deleted selection for %s but rejects another actor board', async name => {
    const args = name === 'kingdown_create' ? {kind:'solo'} : name === 'kingdown_join' ? {code:'ABCDEF'} : {};
    const request = {...get,params:{name,arguments:{...args,board_id:matchId}}};
    vi.mocked(service.board).mockRejectedValueOnce(new MatchServiceError('MATCH_REMOVED',404,'Deleted'));
    expect((await (await post(request,await token())).json()).result.isError).not.toBe(true);
    expect(service.selectBoard).toHaveBeenCalledWith(alice,matchId,matchId);
    vi.mocked(service.selectBoard).mockClear(); vi.mocked(service.create).mockClear(); vi.mocked(service.join).mockClear(); vi.mocked(service.inbox).mockClear();
    vi.mocked(service.board).mockRejectedValueOnce(new MatchServiceError('FORBIDDEN',403,'Foreign board'));
    expect((await (await post(request,await token())).json()).result._meta.code).toBe('FORBIDDEN');
    expect(service.selectBoard).not.toHaveBeenCalled(); expect(service.create).not.toHaveBeenCalled(); expect(service.join).not.toHaveBeenCalled(); expect(service.inbox).not.toHaveBeenCalled();
  });
  it('serves public consent assets with a restricted CSP before OAuth authentication', async () => {
    const response = await fetch(`${address}/authorize?authorization_id=test`);
    expect(response.status).toBe(200); expect(await response.text()).toBe('<html>consent</html>');
    expect(response.headers.get('Content-Security-Policy')).toContain("script-src 'self'");
    expect(response.headers.get('Content-Security-Policy')).toContain("frame-ancestors 'none'");
    expect(response.headers.get('Content-Security-Policy')).toContain('connect-src https://project.supabase.co');
    expect(response.headers.get('Referrer-Policy')).toBe('no-referrer');
    const script = await fetch(`${address}/consent.mjs`); expect(script.status).toBe(200); expect(script.headers.get('Content-Type')).toContain('text/javascript');
    expect(service.view).not.toHaveBeenCalled();
  });
  it('advertises protected resource discovery and challenges missing or broad session tokens', async () => {
    for (const path of ['/.well-known/oauth-protected-resource', '/.well-known/oauth-protected-resource/mcp']) {
      const response = await fetch(address + path); expect(response.status).toBe(200); expect(await response.json()).toEqual(auth.metadata);
    }
    for (const bearer of [undefined, await token(alice, 'authenticated')]) {
      const response = await post(list, bearer); expect(response.status).toBe(401);
      expect(response.headers.get('WWW-Authenticate')).toContain(`${address}/.well-known/oauth-protected-resource/mcp`);
    }
    expect(service.view).not.toHaveBeenCalled();
  });
  it('serves JSON MCP responses and isolates verified actors across concurrent requests', async () => {
    const listing = await post(list, await token()); expect(listing.status).toBe(200);
    expect(listing.headers.get('Content-Type')).toContain('application/json');
    expect(listing.headers.has('Mcp-Session-Id')).toBe(false);
    expect((await listing.json()).result.tools.some((t: { name: string }) => t.name === 'kingdown_open')).toBe(true);
    const responses = await Promise.all([post(get, await token(alice)), post(get, await token(bob))]);
    for (const response of responses) { expect(response.status).toBe(200); expect((await response.json()).result.structuredContent.game_id).toBe(matchId); }
    expect(service.view).toHaveBeenCalledWith(alice, matchId, undefined); expect(service.view).toHaveBeenCalledWith(bob, matchId, undefined);
    const spoof = await post({ ...get, params: { ...get.params, arguments: { game_id: matchId, actorId: bob } } }, await token(alice));
    expect((await spoof.json()).result.isError).toBe(true); expect(service.view).toHaveBeenCalledTimes(2);
  });
  it('rejects untrusted hosts and origins, including null and misleading ChatGPT subdomains', async () => {
    for (const origin of ['https://evil.example', 'null', 'https://chatgpt.com.evil.example']) expect((await post(list, await token(), { Origin: origin })).status).toBe(403);
    const hostStatus = await new Promise<number>((resolve, reject) => {
      const req = request(`${address}/mcp`, { method: 'POST', headers: { Host: 'evil.example' } }, response => { response.resume(); response.on('end', () => resolve(response.statusCode!)); });
      req.on('error', reject); req.end();
    });
    expect(hostStatus).toBe(403);
    expect(service.view).not.toHaveBeenCalled();
  });
  it('permits only exact allowed browser origins and never sends credentialed wildcard CORS', async () => {
    for (const origin of [address, 'https://chatgpt.com', 'https://chat.openai.com']) {
      const response = await fetch(`${address}/mcp`, { method: 'OPTIONS', headers: { Origin: origin } });
      expect(response.status).toBe(204); expect(response.headers.get('Access-Control-Allow-Origin')).toBe(origin);
      expect(response.headers.has('Access-Control-Allow-Credentials')).toBe(false);
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Authorization');
    }
    expect((await fetch(`${address}/mcp`)).status).toBe(405);
  });
  it('bounds declared and streamed bodies before parsing and rejects malformed JSON', async () => {
    const bearer = await token();
    expect((await post('x'.repeat(MAX_MCP_BODY + 1), bearer)).status).toBe(413);
    const streamed = await new Promise<number>((resolve, reject) => {
      const req = request(`${address}/mcp`, { method: 'POST', headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' } }, response => { response.resume(); response.on('end', () => resolve(response.statusCode!)); });
      req.on('error', reject); req.write('x'.repeat(MAX_MCP_BODY)); req.end('overflow');
    });
    expect(streamed).toBe(413);
    expect((await post('{broken', bearer)).status).toBe(400);
    expect(service.view).not.toHaveBeenCalled();
  });
  it('rejects JSON-RPC batches before a single request can fan out service work', async () => {
    const batch = Array.from({ length: 20 }, (_, id) => ({ jsonrpc: '2.0', id, method: 'tools/call', params: { name: 'kingdown_create', arguments: { kind: 'solo' } } }));
    expect(Buffer.byteLength(JSON.stringify(batch))).toBeLessThan(MAX_MCP_BODY);
    const response = await post(batch, await token()); expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'JSON-RPC batches are not supported' });
    expect(service.create).not.toHaveBeenCalled();
    const single = await post(list, await token()); expect(single.status).toBe(200); await single.json();
  });
  it('retains abandoned work slots and admits new requests after that work settles', async () => {
    let release!: () => void, entered!: () => void, running = 0, peak = 0, count = 0;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const ready = new Promise<void>(resolve => { entered = resolve; });
    vi.mocked(service.view).mockImplementation(async () => {
      running++; peak = Math.max(peak, running); if (++count === 4) entered();
      try { await gate; return view; } finally { running--; }
    });
    const bearers = [await token(alice), await token(bob)], controllers = Array.from({ length: 4 }, () => new AbortController());
    const abandoned = controllers.map((controller, i) => post(get, bearers[i % 2], {}, controller.signal).catch(() => undefined));
    try {
      await ready; controllers.forEach(controller => controller.abort()); await Promise.all(abandoned);
      expect(running).toBe(4);
      const busy = await post(get, bearers[0], {}, AbortSignal.timeout(1000)); expect(busy.status).toBe(503); await busy.json();
      expect(service.view).toHaveBeenCalledTimes(4);
    } finally { release(); }
    await new Promise(resolve => setImmediate(resolve));
    expect(running).toBe(0);
    const fresh = await post(get, bearers[0]); expect(fresh.status).toBe(200); await fresh.json(); expect(peak).toBe(4);
  });
  it('bounds active MCP requests per handler and admits retries after completion', async () => {
    let release!: () => void, entered!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const ready = new Promise<void>(resolve => { entered = resolve; });
    let count = 0;
    vi.mocked(service.view).mockImplementation(async () => { if (++count === 4) entered(); await gate; return view; });
    const bearers = [await token(alice), await token(bob)];
    const pending = Array.from({ length: 4 }, (_, i) => post(get, bearers[i % 2]));
    try {
      await ready;
      const busy = await post(get, bearers[0]); expect(busy.status).toBe(503); expect(busy.headers.get('Retry-After')).toBe('1');
      expect(service.view).toHaveBeenCalledTimes(4);
    } finally { release(); }
    for (const response of await Promise.all(pending)) { expect(response.status).toBe(200); await response.json(); }
    const retry = await post(get, bearers[0]); expect(retry.status).toBe(200); await retry.json();
  });
  it('admits three overlapping board reads from one user', async () => {
    let release!: () => void, entered!: () => void, count = 0;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const ready = new Promise<void>(resolve => { entered = resolve; });
    const wait = async () => { if (++count === 2) entered(); await gate; };
    vi.mocked(service.view).mockImplementation(async () => { await wait(); return view; });
    vi.mocked(service.profile).mockImplementation(async () => { await wait(); return { user_id: alice, handle: null, icon: null }; });
    const bearer = await token();
    const pending = [post(get, bearer), post({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'kingdown_profile', arguments: {} } }, bearer)];
    try {
      await ready;
      const games = await post({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'kingdown_games', arguments: {} } }, bearer);
      const result = await games.json(); expect(games.status).toBe(200); expect(result.result.isError).not.toBe(true);
    } finally { release(); for (const response of await Promise.all(pending)) await response.json(); }
  });
  it('keeps one slot for another user after a user disconnects', async () => {
    let release!: () => void, entered!: () => void, count = 0;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const ready = new Promise<void>(resolve => { entered = resolve; });
    vi.mocked(service.view).mockImplementation(async actor => {
      if (actor === alice) { if (++count === 3) entered(); await gate; }
      return view;
    });
    const bearer = await token(alice), other = await token(bob), controllers = Array.from({ length: 3 }, () => new AbortController());
    const pending = controllers.map(controller => post(get, bearer, {}, controller.signal).catch(() => undefined));
    try {
      await ready; controllers.forEach(controller => controller.abort()); await Promise.all(pending);
      const limited = await post(get, bearer);
      expect(limited.status).toBe(429); expect(limited.headers.get('Retry-After')).toBe('1');
      expect(await limited.json()).toMatchObject({ code: 'RATE_LIMITED' });
      const free = await post(get, other); expect(free.status).toBe(200); await free.json();
      expect(service.view).toHaveBeenCalledTimes(4);
    } finally { release(); }
    await new Promise(resolve => setImmediate(resolve));
    const retry = await post(get, bearer); expect(retry.status).toBe(200); await retry.json();
  });
  it('counts sign-in waits against the user cap, so one user cannot hold the last server slot', async () => {
    let release!: () => void, entered!: () => void, waiting = 0;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const ready = new Promise<void>(resolve => { entered = resolve; });
    provider.mockImplementation(async (_url, options) => {
      const sub = decodeJwt(new Headers(options?.headers).get('Authorization')!.slice(7)).sub;
      if (sub === alice) { if (++waiting === 3) entered(); await gate; }
      return Response.json({ id: sub });
    });
    const bearer = await token(alice);
    const pending = Array.from({ length: 3 }, () => post(get, bearer));
    try {
      await ready;
      const limited = await post(get, bearer, {}, AbortSignal.timeout(1000));
      expect(limited.status).toBe(429); expect(await limited.json()).toMatchObject({ code: 'RATE_LIMITED' });
      expect(waiting).toBe(3);
      const other = await post(get, await token(bob), {}, AbortSignal.timeout(1000)); expect(other.status).toBe(200); await other.json();
    } finally { release(); }
    for (const response of await Promise.all(pending)) { expect(response.status).toBe(200); await response.json(); }
  });
  it('rejects local persona headers in OAuth mode and fails closed without production auth', async () => {
    expect((await post(list, undefined, { 'x-kingdown-dev-actor': alice })).status).toBe(401);
    expect(() => createPluginHandler({ service, resourceHtml: '', publicOrigin: address })).toThrow('OAuth');
    expect(() => createPluginHandler({ service, resourceHtml: '', publicOrigin: 'https://public.example', localDev: true })).toThrow('loopback');
    expect(() => createPluginHandler({ service, resourceHtml: '', publicOrigin: address, localDev: true, auth })).toThrow('loopback');
    const prior = process.env.NODE_ENV; process.env.NODE_ENV = 'production';
    try { expect(() => createPluginHandler({ service, resourceHtml: '', publicOrigin: address, localDev: true })).toThrow('loopback'); }
    finally { process.env.NODE_ENV = prior; }
  });
  it('supports explicit local personas only in a loopback development server', async () => {
    const server = createServer(); servers.push(server); server.listen(0, '127.0.0.1'); await once(server, 'listening');
    const local = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
    const handler = createPluginHandler({ service, resourceHtml: '', publicOrigin: local, localDev: true });
    server.on('request', (req, res) => { void handler(req, res); });
    const response = await fetch(`${local}/mcp`, { method: 'POST', headers: { 'x-kingdown-dev-actor': alice, 'Content-Type': 'application/json', Accept: 'application/json,text/event-stream' }, body: JSON.stringify(get) });
    expect(response.status).toBe(200); await response.json(); expect(service.view).toHaveBeenCalledWith(alice, matchId, undefined);
  });
});
