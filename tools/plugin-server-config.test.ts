import { afterEach, expect, it, vi } from 'vitest';
import { Pool } from 'pg';
import { attachDatabasePool } from '@vercel/functions';
import { checkPluginDatabase } from './plugin-db-check.mjs';
import { configurePlugin } from './plugin-server.mjs';
import { STAGING_ORIGIN, STAGING_SUPABASE_URL } from './staging-config.mjs';
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
