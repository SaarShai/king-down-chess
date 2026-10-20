import { afterEach, expect, it, vi } from 'vitest';
import { Pool } from 'pg';
import { configurePlugin } from './plugin-server.mjs';
import { STAGING_ORIGIN, STAGING_SUPABASE_URL } from './staging-config.mjs';
vi.mock('pg', () => ({ Pool: vi.fn() }));
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
