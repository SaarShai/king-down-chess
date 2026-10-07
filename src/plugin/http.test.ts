import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createServer, request, type Server } from 'node:http';
import { once } from 'node:events';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { createTokenVerifier, type PluginAuth } from './auth';
import { createPluginHandler, MAX_MCP_BODY, type PluginHttpOptions } from './http';
const alice = '11111111-1111-4111-8111-111111111111', bob = '22222222-2222-4222-8222-222222222222';
const matchId = '33333333-3333-4333-8333-333333333333';
const view = { matchId, playerColor: 0 as const, mode: 'solo' as const, waiting: false, snapshot: {} as any };
const servers: Server[] = [];
let service: PluginHttpOptions['service'], auth: PluginAuth, address: string, privateKey: CryptoKey;
beforeEach(async () => {
  service = { resume: vi.fn(async () => null), create: vi.fn(async () => view), get: vi.fn(async () => view), move: vi.fn(async () => view), computer: vi.fn(async () => view), invite: vi.fn(async () => ({ token: 'test', expiresAt: '2030-01-01' })), join: vi.fn(async () => view) };
  const pair = await generateKeyPair('ES256'); privateKey = pair.privateKey;
  const server = createServer(); servers.push(server); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  address = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  auth = createTokenVerifier({ supabaseUrl: 'https://project.supabase.co', publicOrigin: address }, createLocalJWKSet({ keys: [{ ...await exportJWK(pair.publicKey), kid: 'test', alg: 'ES256' }] }));
  const handler = createPluginHandler({ service, auth, resourceHtml: '<html>board</html>', publicOrigin: address });
  server.on('request', (req, res) => { void handler(req, res).catch(() => { res.statusCode = 500; res.end(); }); });
});
afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => new Promise<void>((resolve, reject) => { server.closeAllConnections(); server.close(error => error ? reject(error) : resolve()); })));
});
async function token(actor = alice, aud = auth.resource) {
  return new SignJWT({ role: 'authenticated', client_id: 'oauth-client', scope: 'openid' }).setProtectedHeader({ alg: 'ES256', kid: 'test' }).setIssuer(auth.issuer).setAudience(aud).setSubject(actor).setExpirationTime('5m').sign(privateKey);
}
async function post(body: unknown, bearer?: string, headers: Record<string, string> = {}) {
  return fetch(`${address}/mcp`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', 'MCP-Protocol-Version': '2025-11-25', ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}), ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) });
}
const list = { jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} };
const get = { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'kingdown_get', arguments: { matchId } } };
describe('stateless authenticated MCP HTTP', () => {
  it('advertises protected resource discovery and challenges missing or broad session tokens', async () => {
    for (const path of ['/.well-known/oauth-protected-resource', '/.well-known/oauth-protected-resource/mcp']) {
      const response = await fetch(address + path); expect(response.status).toBe(200); expect(await response.json()).toEqual(auth.metadata);
    }
    for (const bearer of [undefined, await token(alice, 'authenticated')]) {
      const response = await post(list, bearer); expect(response.status).toBe(401);
      expect(response.headers.get('WWW-Authenticate')).toContain(`${address}/.well-known/oauth-protected-resource/mcp`);
    }
    expect(service.get).not.toHaveBeenCalled();
  });
  it('serves JSON MCP responses and isolates verified actors across concurrent requests', async () => {
    const listing = await post(list, await token()); expect(listing.status).toBe(200);
    expect(listing.headers.get('Content-Type')).toContain('application/json');
    expect(listing.headers.has('Mcp-Session-Id')).toBe(false);
    expect((await listing.json()).result.tools.some((t: { name: string }) => t.name === 'kingdown_open')).toBe(true);
    const responses = await Promise.all([post(get, await token(alice)), post(get, await token(bob))]);
    for (const response of responses) { expect(response.status).toBe(200); expect((await response.json()).result.structuredContent.matchId).toBe(matchId); }
    expect(service.get).toHaveBeenCalledWith(alice, matchId); expect(service.get).toHaveBeenCalledWith(bob, matchId);
    const spoof = await post({ ...get, params: { ...get.params, arguments: { matchId, actorId: bob } } }, await token(alice));
    expect((await spoof.json()).result.isError).toBe(true); expect(service.get).toHaveBeenCalledTimes(2);
  });
  it('rejects untrusted hosts and origins, including null and misleading ChatGPT subdomains', async () => {
    for (const origin of ['https://evil.example', 'null', 'https://chatgpt.com.evil.example']) expect((await post(list, await token(), { Origin: origin })).status).toBe(403);
    const hostStatus = await new Promise<number>((resolve, reject) => {
      const req = request(`${address}/mcp`, { method: 'POST', headers: { Host: 'evil.example' } }, response => { response.resume(); response.on('end', () => resolve(response.statusCode!)); });
      req.on('error', reject); req.end();
    });
    expect(hostStatus).toBe(403);
    expect(service.get).not.toHaveBeenCalled();
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
    expect(service.get).not.toHaveBeenCalled();
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
    expect(response.status).toBe(200); await response.json(); expect(service.get).toHaveBeenCalledWith(alice, matchId);
  });
});
