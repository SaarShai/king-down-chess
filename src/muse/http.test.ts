import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createServer, request, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { once } from 'node:events';
import { createLocalJWKSet, decodeJwt, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { Client, StreamableHTTPClientTransport, type VersionNegotiationOptions } from '@modelcontextprotocol/client';
import { createTokenVerifier, type PluginAuth } from '../plugin/auth';
import { MAX_MCP_BODY } from '../plugin/http';
import { fixtureService } from '../../tools/plugin-protocol-fixture';
import { createMuseHandler } from './http';
import type { MuseGames } from './tools';

const alice = '11111111-1111-4111-8111-111111111111';
const servers: Server[] = [];
const provider = vi.fn<typeof fetch>();
let auth: PluginAuth, address: string, privateKey: CryptoKey, games: MuseGames;
function museGames(): MuseGames {
  const fixture = fixtureService();
  return { create: fixture.create, command: fixture.command, view: fixture.view, inbox: fixture.inbox, previewDraft: fixture.previewDraft, toolTry: vi.fn(async () => {}) };
}
async function listen(handler: (req: IncomingMessage, res: ServerResponse) => Promise<void>) {
  const server = createServer((req, res) => { void handler(req, res).catch(() => { res.statusCode = 500; res.end(); }); });
  servers.push(server); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  return `http://127.0.0.1:${(server.address() as { port: number }).port}`;
}
beforeEach(async () => {
  provider.mockReset();
  provider.mockImplementation(async (_url, options) => Response.json({ id: decodeJwt(new Headers(options?.headers).get('Authorization')!.slice(7)).sub }));
  const pair = await generateKeyPair('ES256'); privateKey = pair.privateKey;
  const keys = createLocalJWKSet({ keys: [{ ...await exportJWK(pair.publicKey), kid: 'test', alg: 'ES256' }] });
  games = museGames();
  // The origin is known only after listen, so the handler is made on the first request.
  let handler: ((req: IncomingMessage, res: ServerResponse) => Promise<void>) | undefined;
  address = await listen((req, res) => handler!(req, res));
  auth = createTokenVerifier({ supabaseUrl: 'https://project.supabase.co', publicOrigin: address, publishableKey: 'sb_publishable_test', resourcePath: '/muse/mcp' }, keys, provider);
  handler = createMuseHandler({ games, auth, publicOrigin: address });
});
afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => new Promise<void>((resolve, reject) => { server.closeAllConnections(); server.close(error => error ? reject(error) : resolve()); })));
});
const token = (actor = alice) => new SignJWT({ role: 'authenticated', client_id: 'oauth-client', scope: 'openid' }).setProtectedHeader({ alg: 'ES256', kid: 'test' }).setIssuer(auth.issuer).setAudience(auth.resource).setSubject(actor).setExpirationTime('5m').sign(privateKey);
async function post(body: unknown, bearer?: string, headers: Record<string, string> = {}) {
  return fetch(`${address}/muse/mcp`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', 'MCP-Protocol-Version': '2025-11-25', ...(bearer && { Authorization: `Bearer ${bearer}` }), ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) });
}
const list = { jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} };
async function connect(bearer: string, versionNegotiation?: VersionNegotiationOptions) {
  const client = new Client({ name: 'muse-test', version: '1.0.0' }, versionNegotiation && { versionNegotiation });
  await client.connect(new StreamableHTTPClientTransport(new URL(`${address}/muse/mcp`), { requestInit: { headers: { Authorization: `Bearer ${bearer}` } } }));
  return client;
}

describe('Muse MCP over HTTP', () => {
  it('challenges a missing token with the Muse resource metadata and serves that metadata', async () => {
    const response = await post(list);
    expect(response.status).toBe(401);
    expect(response.headers.get('WWW-Authenticate')).toBe(`Bearer resource_metadata="${address}/.well-known/oauth-protected-resource/muse/mcp", scope="openid"`);
    const metadata = await fetch(`${address}/.well-known/oauth-protected-resource/muse/mcp`);
    expect(metadata.status).toBe(200);
    expect(await metadata.json()).toEqual({ resource: `${address}/muse/mcp`, authorization_servers: ['https://project.supabase.co/auth/v1'], scopes_supported: ['openid'], bearer_methods_supported: ['header'], resource_name: 'King Down Chess' });
    // A token for the ChatGPT resource does not open the Muse resource.
    const plugin = await new SignJWT({ role: 'authenticated', client_id: 'oauth-client' }).setProtectedHeader({ alg: 'ES256', kid: 'test' }).setIssuer(auth.issuer).setAudience(`${address}/mcp`).setSubject(alice).setExpirationTime('5m').sign(privateKey);
    expect((await post(list, plugin)).status).toBe(401);
    for (const path of ['/mcp', '/.well-known/oauth-protected-resource', '/muse']) expect((await fetch(address + path)).status).toBe(404);
    expect((await fetch(`${address}/muse/mcp`)).status).toBe(405);
  });
  it('refuses untrusted hosts and origins and allows the Muse origins', async () => {
    const bearer = await token();
    for (const origin of ['https://evil.example', 'null', 'https://muse.ai.evil.example']) expect((await post(list, bearer, { Origin: origin })).status).toBe(403);
    const hostStatus = await new Promise<number>((resolve, reject) => {
      const req = request(`${address}/muse/mcp`, { method: 'POST', headers: { Host: 'evil.example' } }, response => { response.resume(); response.on('end', () => resolve(response.statusCode!)); });
      req.on('error', reject); req.end();
    });
    expect(hostStatus).toBe(403);
    for (const origin of [address, 'https://muse.ai', 'https://platform.muse.ai']) {
      const response = await fetch(`${address}/muse/mcp`, { method: 'OPTIONS', headers: { Origin: origin } });
      expect(response.status).toBe(204); expect(response.headers.get('Access-Control-Allow-Origin')).toBe(origin);
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Authorization, Content-Type, MCP-Protocol-Version, Mcp-Method, Mcp-Name');
    }
  });
  it('bounds the body and refuses JSON-RPC batches before any game work', async () => {
    const bearer = await token();
    expect((await post('x'.repeat(MAX_MCP_BODY + 1), bearer)).status).toBe(413);
    const batch = await post([list, { ...list, id: 2 }], bearer);
    expect(batch.status).toBe(400); expect(await batch.json()).toEqual({ error: 'JSON-RPC batches are not supported' });
    expect(provider).toHaveBeenCalledTimes(2);
  });
  it('serves a 2025-era client through initialize and tools/list', async () => {
    const client = await connect(await token());
    try {
      expect(client.getServerVersion()?.name).toBeTruthy();
      expect((await client.listTools()).tools.length).toBeGreaterThan(0);
    } finally { await client.close(); }
  });
  it('serves a 2026-07-28 client with the per-request envelope', async () => {
    const client = await connect(await token(), { mode: { pin: '2026-07-28' } });
    try {
      expect((await client.listTools()).tools.length).toBeGreaterThan(0);
    } finally { await client.close(); }
    // The raw request: the version, capabilities and client in _meta and the version header; no initialize first.
    const raw = await post({ jsonrpc: '2.0', id: 7, method: 'tools/list', params: { _meta: { 'io.modelcontextprotocol/protocolVersion': '2026-07-28', 'io.modelcontextprotocol/clientCapabilities': {}, 'io.modelcontextprotocol/clientInfo': { name: 'muse-test', version: '1.0.0' } } } }, await token(), { 'MCP-Protocol-Version': '2026-07-28', 'Mcp-Method': 'tools/list' });
    expect(raw.status).toBe(200); expect(raw.headers.get('Content-Type')).toContain('application/json');
    expect((await raw.json()).result.tools.length).toBeGreaterThan(0);
  });
});
describe('Muse local development mode', () => {
  it('refuses production, auth and a public origin', () => {
    expect(() => createMuseHandler({ games, publicOrigin: address })).toThrow('OAuth');
    expect(() => createMuseHandler({ games, publicOrigin: 'https://public.example', localDev: true })).toThrow('loopback');
    expect(() => createMuseHandler({ games, publicOrigin: address, localDev: true, auth })).toThrow('loopback');
    const prior = process.env.NODE_ENV; process.env.NODE_ENV = 'production';
    try { expect(() => createMuseHandler({ games, publicOrigin: address, localDev: true })).toThrow('loopback'); }
    finally { process.env.NODE_ENV = prior; }
  });
  it('takes the actor header from a loopback peer and refuses another peer', async () => {
    let handler: ((req: IncomingMessage, res: ServerResponse) => Promise<void>) | undefined;
    const local = await listen((req, res) => handler!(req, res));
    handler = createMuseHandler({ games, publicOrigin: local, localDev: true });
    const call = (actor?: string) => fetch(`${local}/muse/mcp`, { method: 'POST', headers: { ...(actor && { 'x-kingdown-dev-actor': actor }), 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', 'MCP-Protocol-Version': '2025-11-25' }, body: JSON.stringify(list) });
    const served = await call(alice); expect(served.status).toBe(200); await served.text();
    expect((await call()).status).toBe(401);
    // A peer that is not loopback, as a proxy would forward it.
    let status = 0;
    const res = { setHeader() {}, writeHead(code: number) { status = code; return res; }, end() {} } as unknown as ServerResponse;
    await handler({ headers: { host: new URL(local).host, 'x-kingdown-dev-actor': alice }, socket: { remoteAddress: '10.0.0.7' }, url: '/muse/mcp', method: 'POST' } as unknown as IncomingMessage, res);
    expect(status).toBe(403);
  });
});
