import { afterEach, expect, it, vi } from 'vitest';
import { Pool } from 'pg';
import { attachDatabasePool } from '@vercel/functions';
import { checkPluginDatabase } from './plugin-db-check.mjs';
import { configurePlugin, ENABLED_WEB_OPERATIONS } from './plugin-server.mjs';
import { createServer, request } from 'node:http';
import type { AddressInfo } from 'node:net';
import { STAGING_ORIGIN, STAGING_SUPABASE_URL } from './staging-config.mjs';
import { CHATGPT_PLUGIN, PARKED_PATHS } from './chatgpt-plugin.mjs';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
vi.mock('pg', () => ({ Pool: vi.fn() }));
vi.mock('@vercel/functions', () => ({ attachDatabasePool: vi.fn() }));
vi.mock('./plugin-db-check.mjs', () => ({ checkPluginDatabase: vi.fn() }));
vi.mock('node:fs/promises', () => ({ readFile: vi.fn(async () => '__KINGDOWN_CONSENT_CONFIG__') }));
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });
const settings = { KINGDOWN_STAGE: 'staging', SUPABASE_URL: STAGING_SUPABASE_URL, KINGDOWN_PLUGIN_ORIGIN: STAGING_ORIGIN, KINGDOWN_PLUGIN_DATABASE_URL: 'postgresql://kingdown_plugin_runtime:fake@db.puhspsyjyzaghmgtkzqd.supabase.co/postgres?sslmode=require' };
it('rejects wrong staging targets before provider or database access', async () => {
  const request = vi.fn(); vi.stubGlobal('fetch', request);
  for (const changes of [{ SUPABASE_URL: 'https://utqzovjmclfyojedmwok.supabase.co' }, { KINGDOWN_PLUGIN_ORIGIN: 'https://kingdown.dev' }, { KINGDOWN_PLUGIN_DATABASE_URL: settings.KINGDOWN_PLUGIN_DATABASE_URL.replace('puhspsyjyzaghmgtkzqd', 'another') }, { KINGDOWN_PLUGIN_DATABASE_URL: settings.KINGDOWN_PLUGIN_DATABASE_URL.replace('kingdown_plugin_runtime:', 'postgres:') }]) await expect(configurePlugin({ ...settings, ...changes })).rejects.toThrow(/production project|isolated/);
  expect(request).not.toHaveBeenCalled(); expect(Pool).not.toHaveBeenCalled();
});
it('keeps test keys and current-user hooks on loopback only', async () => {
  const websiteKeys = async () => { throw new Error('unused'); };
  await expect(configurePlugin(settings, { websiteKeys })).rejects.toThrow('Website test keys require');
  await expect(configurePlugin(settings, { websiteCurrentUser: async () => {} })).rejects.toThrow('requires website test keys');
  await expect(configurePlugin(settings, { localDev: true })).rejects.toThrow('local personas');
  expect(Pool).not.toHaveBeenCalled();
});
it.each([false, true])('configures the real runtime pool for serverless=%s', async serverless => {
  const pool = { on: vi.fn(), end: vi.fn() };
  vi.mocked(Pool).mockImplementation(function () { return pool as unknown as Pool; });
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ issuer: `${STAGING_SUPABASE_URL}/auth/v1`, scopes_supported: ['openid'] })));
  const app = await configurePlugin({ ...settings,
    KINGDOWN_PLUGIN_DATABASE_URL: 'postgresql://kingdown_plugin_runtime.puhspsyjyzaghmgtkzqd:fake@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require',
    KINGDOWN_PLUGIN_OAUTH_READY: '1', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
    KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS: '00000000-0000-4000-8000-000000000001',
  }, { serverless, chatgpt: false });
  expect(app.pool).toBe(pool);
  expect(Pool).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
    port: serverless ? 6543 : 5432, max: 5, connectionTimeoutMillis: 5000, idleTimeoutMillis: 10000,
    ssl: expect.objectContaining({ rejectUnauthorized: true, servername: 'aws-0-eu-west-1.pooler.supabase.com' }),
  }));
  // Without a connector: no OAuth client allowlist and no resource to check.
  expect(checkPluginDatabase).toHaveBeenCalledWith(pool, undefined, []);
  if (serverless) expect(attachDatabasePool).toHaveBeenCalledExactlyOnceWith(pool);
  else expect(attachDatabasePool).not.toHaveBeenCalled();
});

const production: Record<string, string | undefined> = { SUPABASE_URL: 'https://utqzovjmclfyojedmwok.supabase.co', KINGDOWN_PLUGIN_ORIGIN: 'https://kingdown.dev', KINGDOWN_PLUGIN_OAUTH_READY: '1', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test', KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS: '00000000-0000-4000-8000-000000000001',
  KINGDOWN_PLUGIN_DATABASE_URL: 'postgresql://kingdown_plugin_runtime.utqzovjmclfyojedmwok:fake@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require' };
/** Configure the production profile with the switch row `enabled`, and serve its handler on loopback. */
async function productionServer(enabled: boolean, chatgpt?: boolean) {
  const query = vi.fn(async () => ({ rows: [{ singleton: true, enabled }] }));
  vi.mocked(Pool).mockImplementation(function () { return { on: vi.fn(), end: vi.fn(), query } as unknown as Pool; });
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ issuer: `${production.SUPABASE_URL}/auth/v1`, scopes_supported: ['openid'] })));
  const app = await configurePlugin(production, { serverless: true, ...(chatgpt !== undefined && { chatgpt }) });
  const server = createServer(app.handler);
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
  const call = (key: string) => new Promise<{ status: number; body: { code?: string; account_access?: string } }>((done, fail) => {
    const [method, path] = key.split(' ');
    const req = request({ host: '127.0.0.1', port: (server.address() as AddressInfo).port, method, path: path.replace(':id', '00000000-0000-4000-8000-000000000002'), headers: { host: 'kingdown.dev' } }, res => {
      let data = ''; res.on('data', chunk => { data += chunk; }); res.on('end', () => done({ status: res.statusCode!, body: JSON.parse(data) }));
    });
    req.on('error', fail); req.end();
  });
  return { call, query, close: () => new Promise(done => server.close(done)) };
}
it.each([undefined, ''])('starts the production profile with KINGDOWN_STAGE=%s and keeps every web operation closed while the switch is off', async KINGDOWN_STAGE => {
  production.KINGDOWN_STAGE = KINGDOWN_STAGE;
  const { call, query, close } = await productionServer(false);
  try {
    expect(await call('GET /api/status')).toEqual({ status: 200, body: { account_access: 'closed', valid_for_ms: 0 } });
    expect(query).toHaveBeenCalledWith(expect.stringContaining('web_account_access'));
    const operations = [...ENABLED_WEB_OPERATIONS].filter(key => key !== 'GET /api/status');
    expect(operations).toHaveLength(31);
    for (const key of operations) expect([key, await call(key)]).toEqual([key, { status: 503, body: expect.objectContaining({ code: 'UNAVAILABLE' }) }]);
  } finally { await close(); delete production.KINGDOWN_STAGE; }
});
it('opens the production web API only when the switch row is on', async () => {
  const { call, close } = await productionServer(true);
  try {
    expect(await call('GET /api/status')).toEqual({ status: 200, body: { account_access: 'open', valid_for_ms: expect.any(Number) } });
    expect(await call('GET /api/me/games')).toEqual({ status: 401, body: expect.objectContaining({ code: 'UNAUTHENTICATED' }) });
  } finally { await close(); }
});
it('production refuses staging targets before provider or database access', async () => {
  const request = vi.fn(); vi.stubGlobal('fetch', request);
  for (const changes of [{ SUPABASE_URL: STAGING_SUPABASE_URL }, { KINGDOWN_PLUGIN_ORIGIN: STAGING_ORIGIN }, { KINGDOWN_PLUGIN_DATABASE_URL: settings.KINGDOWN_PLUGIN_DATABASE_URL }]) await expect(configurePlugin({ ...production, ...changes })).rejects.toThrow('Production refuses the staging project');
  expect(request).not.toHaveBeenCalled(); expect(Pool).not.toHaveBeenCalled();
});

it('serves the ChatGPT plugin by default; without it each plugin path answers 404 and the website API stays', async () => {
  expect(CHATGPT_PLUGIN).toBe(true);
  const { call, close } = await productionServer(true, false);
  try {
    for (const path of [...PARKED_PATHS, '/plugin-art/scroll-0123abcd.webp', '/unknown']) for (const method of ['GET', 'POST']) {
      expect([method, path, await call(`${method} ${path}`)]).toEqual([method, path, { status: 404, body: { code: 'NOT_FOUND', message: 'Not found' } }]);
    }
    expect(await call('GET /api/status')).toEqual({ status: 200, body: { account_access: 'open', valid_for_ms: expect.any(Number) } });
  } finally { await close(); }
});
it('starts the parked production server without the ChatGPT OAuth setup', async () => {
  // The owner can turn off the Supabase OAuth server, delete the OAuth client and unset KINGDOWN_PLUGIN_OAUTH_READY: the
  // website API still starts, and it makes no provider call at start.
  const { KINGDOWN_PLUGIN_OAUTH_READY: _ready, KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS: _clients, ...parked } = production;
  const query = vi.fn(async () => ({ rows: [{ singleton: true, enabled: false }] })), pool = { on: vi.fn(), end: vi.fn(), query };
  vi.mocked(Pool).mockImplementation(function () { return pool as unknown as Pool; });
  const provider = vi.fn(async () => new Response('OAuth server is off', { status: 404 })); vi.stubGlobal('fetch', provider);
  const app = await configurePlugin(parked, { serverless: true, chatgpt: false });
  expect(app.chatgpt).toBe(false);
  expect(provider).not.toHaveBeenCalled();
  expect(checkPluginDatabase).toHaveBeenCalledExactlyOnceWith(pool, undefined, []);
  // The website API still needs its public Supabase settings.
  for (const name of ['SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY']) await expect(configurePlugin({ ...parked, [name]: undefined }, { chatgpt: false })).rejects.toThrow(/supabase/i);
  // The plugin path keeps its OAuth gate.
  await expect(configurePlugin(parked, { chatgpt: true })).rejects.toThrow('Enable Supabase OAuth');
});
it('serves the plugin metadata again with chatgpt: true', async () => {
  const { call, close } = await productionServer(true, true);
  try {
    expect(await call('GET /.well-known/oauth-protected-resource/mcp')).toEqual({ status: 200, body: expect.objectContaining({ resource: 'https://kingdown.dev/mcp' }) });
  } finally { await close(); }
});

it('serves both connectors in one build: each path accepts only a token for its own resource and client', async () => {
  const chatgptClient = '00000000-0000-4000-8000-000000000001', museClient = '00000000-0000-4000-8000-000000000003', actor = '00000000-0000-4000-8000-000000000004';
  const issuer = `${production.SUPABASE_URL}/auth/v1`, pair = await generateKeyPair('ES256');
  const jwks = { keys: [{ ...await exportJWK(pair.publicKey), kid: 'oauth', alg: 'ES256' }] };
  const query = vi.fn(async () => ({ rows: [{ singleton: true, enabled: true }] })), pool = { on: vi.fn(), end: vi.fn(), query };
  vi.mocked(Pool).mockImplementation(function () { return pool as unknown as Pool; });
  vi.mocked(checkPluginDatabase).mockResolvedValueOnce([{ client_id: chatgptClient, resource: 'https://kingdown.dev/mcp' }, { client_id: museClient, resource: 'https://kingdown.dev/muse/mcp' }]);
  vi.stubGlobal('fetch', vi.fn(async (url: string | URL) => {
    const path = new URL(url).pathname;
    if (path.endsWith('/jwks.json')) return Response.json(jwks);
    if (path.endsWith('/user')) return Response.json({ id: actor });
    return Response.json({ issuer, scopes_supported: ['openid'] });
  }));
  const app = await configurePlugin({ ...production, KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS: `${chatgptClient},${museClient}` }, { serverless: true, chatgpt: true, muse: true });
  expect([app.chatgpt, app.muse]).toEqual([true, true]);
  // The start check accepts each listed client whose resource is one of the two served resources.
  expect(checkPluginDatabase).toHaveBeenCalledExactlyOnceWith(pool, expect.objectContaining({ clientIds: [chatgptClient, museClient] }), ['https://kingdown.dev/mcp', 'https://kingdown.dev/muse/mcp']);
  const server = createServer(app.handler);
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
  const call = (method: string, path: string, headers: Record<string, string> = {}, body?: string) => new Promise<{ status: number; headers: Record<string, unknown>; text: string }>((done, fail) => {
    const req = request({ host: '127.0.0.1', port: (server.address() as AddressInfo).port, method, path, headers: { host: 'kingdown.dev', ...headers } }, res => {
      let text = ''; res.on('data', chunk => { text += chunk; }); res.on('end', () => done({ status: res.statusCode!, headers: res.headers, text }));
    });
    req.on('error', fail); req.end(body);
  });
  const token = (aud: string, client_id: string) => new SignJWT({ iss: issuer, aud, sub: actor, role: 'authenticated', client_id, scope: 'openid', exp: Math.floor(Date.now() / 1000) + 300 }).setProtectedHeader({ alg: 'ES256', kid: 'oauth' }).sign(pair.privateKey);
  const list = async (path: string, aud: string, client: string) => (await call('POST', path, { Authorization: `Bearer ${await token(`https://kingdown.dev${aud}`, client)}`, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', 'MCP-Protocol-Version': '2025-11-25' }, JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }))).status;
  try {
    for (const [path, aud, client, status] of [
      ['/mcp', '/mcp', chatgptClient, 200], ['/muse/mcp', '/muse/mcp', museClient, 200],
      // A token for the other connector's resource.
      ['/muse/mcp', '/mcp', chatgptClient, 401], ['/mcp', '/muse/mcp', museClient, 401],
      // The right resource, but a client that maps to the other one (a fault in the audience hook).
      ['/mcp', '/mcp', museClient, 401], ['/muse/mcp', '/muse/mcp', chatgptClient, 401],
    ] as const) expect([path, aud, client, await list(path, aud, client)]).toEqual([path, aud, client, status]);
    for (const path of ['/mcp', '/muse/mcp']) {
      const metadata = await call('GET', `/.well-known/oauth-protected-resource${path}`);
      expect(JSON.parse(metadata.text)).toMatchObject({ resource: `https://kingdown.dev${path}`, authorization_servers: [issuer] });
      expect((await call('POST', path, { 'Content-Type': 'application/json' }, '{}')).headers['www-authenticate']).toBe(`Bearer resource_metadata="https://kingdown.dev/.well-known/oauth-protected-resource${path}", scope="openid"`);
    }
    // The consent page gets the Muse clients, so that it names Muse for them (src/plugin/consent.ts).
    expect(JSON.parse((await call('GET', '/authorize?authorization_id=x')).text)).toMatchObject({ clientIds: [chatgptClient, museClient], museClientIds: [museClient] });
  } finally { await new Promise(done => server.close(done)); }
});
it('starts a one-connector build with a client of the other connector in the list refused', async () => {
  vi.mocked(Pool).mockImplementation(function () { return { on: vi.fn(), end: vi.fn(), query: vi.fn() } as unknown as Pool; });
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ issuer: `${production.SUPABASE_URL}/auth/v1`, scopes_supported: ['openid'] })));
  await configurePlugin(production, { serverless: true, chatgpt: false, muse: true });
  // Muse only: the check reads only the Muse resource, so a listed ChatGPT client fails the start (CONFIG_REQUIRED).
  expect(checkPluginDatabase).toHaveBeenCalledExactlyOnceWith(expect.anything(), expect.anything(), ['https://kingdown.dev/muse/mcp']);
});
