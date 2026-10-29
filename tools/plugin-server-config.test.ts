import { afterEach, expect, it, vi } from 'vitest';
import { Pool } from 'pg';
import { attachDatabasePool } from '@vercel/functions';
import { checkPluginDatabase } from './plugin-db-check.mjs';
import { configurePlugin, ENABLED_WEB_OPERATIONS } from './plugin-server.mjs';
import { createServer, request } from 'node:http';
import type { AddressInfo } from 'node:net';
import { STAGING_ORIGIN, STAGING_SUPABASE_URL } from './staging-config.mjs';
import { CHATGPT_PLUGIN, PARKED_PATHS } from './chatgpt-plugin.mjs';
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
  }, { serverless });
  expect(app.pool).toBe(pool);
  expect(Pool).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
    port: serverless ? 6543 : 5432, max: 5, connectionTimeoutMillis: 5000, idleTimeoutMillis: 10000,
    ssl: expect.objectContaining({ rejectUnauthorized: true, servername: 'aws-0-eu-west-1.pooler.supabase.com' }),
  }));
  expect(checkPluginDatabase).toHaveBeenCalledWith(pool, expect.any(Object), `${STAGING_ORIGIN}/mcp`);
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

it('parks the ChatGPT plugin by default: each plugin path answers 404 and the website API stays', async () => {
  expect(CHATGPT_PLUGIN).toBe(false);
  const { call, close } = await productionServer(true);
  try {
    for (const path of [...PARKED_PATHS, '/plugin-art/scroll-0123abcd.webp', '/unknown']) for (const method of ['GET', 'POST']) {
      expect([method, path, await call(`${method} ${path}`)]).toEqual([method, path, { status: 404, body: { code: 'NOT_FOUND', message: 'Not found' } }]);
    }
    expect(await call('GET /api/status')).toEqual({ status: 200, body: { account_access: 'open', valid_for_ms: expect.any(Number) } });
  } finally { await close(); }
});
it('serves the plugin metadata again with chatgpt: true', async () => {
  const { call, close } = await productionServer(true, true);
  try {
    expect(await call('GET /.well-known/oauth-protected-resource/mcp')).toEqual({ status: 200, body: expect.objectContaining({ resource: 'https://kingdown.dev/mcp' }) });
  } finally { await close(); }
});
