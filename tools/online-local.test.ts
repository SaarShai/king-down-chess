import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Pool } from 'pg';
import viteConfig from '../vite.config';
import { publicAccountConfig, allowedAvatarUrl } from '../src/account/public-config';
import { userOf } from '../src/account/account';
import { createCurrentUserCheck } from '../src/api/current-user';
import { sessionVerifier } from '../src/api/http';
import { websiteConfig } from '../src/plugin/consent-config';
import { readLocalAccounts, validateLocalAuthEnv } from './online-local-auth.mjs';
import { configurePlugin } from './plugin-server.mjs';

vi.mock('pg', () => ({ Pool: vi.fn() }));
vi.mock('./plugin-db-check.mjs', () => ({ checkPluginDatabase: vi.fn() }));
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules(); vi.clearAllMocks(); });

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const VALID_ENV = {
  databaseUrl: 'postgresql://postgres@127.0.0.1:55432/local_online_test',
  authOrigin: 'http://127.0.0.1:55440',
  pageOrigin: 'http://127.0.0.1:55441',
  nodeEnv: 'development',
};

describe('local online stack safety guards and seed fixture', () => {
  it('refuses non-loopback, non-_test databases and production mode in the local auth stand-in', () => {
    expect(validateLocalAuthEnv(VALID_ENV)).toEqual({
      databaseUrl: VALID_ENV.databaseUrl,
      authOrigin: VALID_ENV.authOrigin,
      pageOrigin: VALID_ENV.pageOrigin,
    });
    expect(() => validateLocalAuthEnv({ ...VALID_ENV, nodeEnv: 'production' })).toThrow(/production/i);
    expect(() => validateLocalAuthEnv({ ...VALID_ENV, databaseUrl: 'postgresql://postgres@127.0.0.1:55432/postgres' })).toThrow(/_test/i);
    expect(() => validateLocalAuthEnv({ ...VALID_ENV, databaseUrl: 'postgresql://postgres@db.example.com:55432/local_online_test' })).toThrow(/loopback/i);
    expect(() => validateLocalAuthEnv({ ...VALID_ENV, authOrigin: 'https://auth.example.com' })).toThrow(/loopback HTTP/i);
    expect(() => validateLocalAuthEnv({ ...VALID_ENV, pageOrigin: 'http://example.com:5173' })).toThrow(/loopback HTTP/i);
  });

  it('seeds four test-only @example.test accounts with expected handles, providers and local picture asset', () => {
    const accounts = readLocalAccounts();
    expect(accounts.map(a => a.handle)).toEqual(['test-a', 'test-b', 'test-c', 'test-d']);
    for (const account of accounts) {
      expect(account.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(account.email).toMatch(/^test-[a-d]@example\.test$/);
    }
    const testC = accounts.find(a => a.handle === 'test-c')!;
    expect(testC.provider).not.toBe('email');
    expect(testC.raw_user_meta_data.avatar_url).toMatch(/^\/[^/]/);
    expect(existsSync(join(ROOT, 'public', testC.raw_user_meta_data.avatar_url.slice(1)))).toBe(true);
    const testD = accounts.find(a => a.handle === 'test-d')!;
    expect(testD.provider).toBe('email');
    expect(testD.raw_user_meta_data.avatar_url).toBeUndefined();
  });

  it('keeps production validators strict unless loopback mode is explicitly requested', () => {
    const localUrl = 'http://127.0.0.1:55440';
    expect(() => publicAccountConfig({ VITE_SUPABASE_URL: localUrl, VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_x' })).toThrow(/HTTPS/i);
    expect(() => websiteConfig({ SUPABASE_URL: localUrl, SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_x' })).toThrow(/HTTPS/i);
    expect(() => sessionVerifier(localUrl)).toThrow(/HTTPS/i);
    expect(() => createCurrentUserCheck({ supabaseUrl: localUrl, publishableKey: 'sb_publishable_x' })).toThrow(/HTTPS/i);
    expect(allowedAvatarUrl('/interface/computer-king-1-96.webp')).toBe(false);
    expect(userOf({ app_metadata: { provider: 'google' }, user_metadata: { avatar_url: '/interface/computer-king-1-96.webp' } })?.avatar).toBeNull();

    expect(websiteConfig({ SUPABASE_URL: localUrl, SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_x' }, { localLoopback: true }).supabaseUrl).toBe(localUrl);
    expect(() => websiteConfig({ SUPABASE_URL: 'http://example.com', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_x' }, { localLoopback: true })).toThrow(/HTTPS/i);
    expect(() => sessionVerifier('http://example.com', undefined, { localLoopback: true })).toThrow(/HTTPS/i);
  });

  it('keeps the production server out of local online mode even with its environment flag set', async () => {
    const pool = { on: vi.fn(), end: vi.fn(), query: vi.fn() };
    vi.mocked(Pool).mockImplementation(function () { return pool as unknown as Pool; });
    const env = {
      KINGDOWN_LOCAL_ONLINE: '1',
      KINGDOWN_PLUGIN_ORIGIN: 'https://kingdown.dev',
      KINGDOWN_PLUGIN_DATABASE_URL: 'postgresql://kingdown_plugin_runtime.utqzovjmclfyojedmwok:fake@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require',
      SUPABASE_URL: 'https://utqzovjmclfyojedmwok.supabase.co',
      SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
    };
    const app = await configurePlugin(env, { localDev: false, chatgpt: false, muse: false });
    expect(app.localOnline).toBe(false);
    await expect(configurePlugin({ ...env, SUPABASE_URL: VALID_ENV.authOrigin }, { localDev: false, chatgpt: false, muse: false })).rejects.toThrow('Production requires its Supabase project');
  });

  it('allows same-origin pictures in local mode and rejects cross-site relative forms', async () => {
    vi.stubGlobal('__KINGDOWN_LOCAL_ONLINE__', true);
    vi.resetModules();
    const { allowedAvatarUrl: localAvatar } = await import('../src/account/public-config');
    expect(localAvatar('/interface/computer-king-1-96.webp')).toBe(true);
    expect(localAvatar('https://example.test/avatar.png')).toBe(true);
    for (const value of ['/\\evil.example/a.png', '//evil.example/a.png', '/a\\b.png', '/a b.png', '/"a.png', "/'a.png", '/<a>.png', 'http://evil.example/a.png', null]) {
      expect(localAvatar(value), String(value)).toBe(false);
    }
  });
});

describe('local online Vite configuration', () => {
  function localEnv() {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('KINGDOWN_LOCAL_ONLINE', '1');
    vi.stubEnv('KINGDOWN_STAGE', undefined);
    vi.stubEnv('VITE_KINGDOWN_STAGE', undefined);
    vi.stubEnv('VITE_SUPABASE_URL', VALID_ENV.authOrigin);
    vi.stubEnv('KINGDOWN_LOCAL_API_ORIGIN', VALID_ENV.pageOrigin);
  }

  it('refuses a build with the local flag even when NODE_ENV is development', () => {
    localEnv();
    expect(() => viteConfig({ command: 'build', mode: 'production' })).toThrow('Local online stack refuses builds');
  });

  it('defines local mode as off in a normal build', () => {
    vi.stubEnv('KINGDOWN_LOCAL_ONLINE', undefined);
    expect(viteConfig({ command: 'build', mode: 'production' }).define?.__KINGDOWN_LOCAL_ONLINE__).toBe('false');
  });

  it('enables local mode only for the dev server with valid origins', () => {
    localEnv();
    const config = viteConfig({ command: 'serve', mode: 'development' });
    expect(config.define?.__KINGDOWN_LOCAL_ONLINE__).toBe('true');
    expect(config.server?.proxy?.['/api']).toEqual({ target: VALID_ENV.pageOrigin, changeOrigin: false });
  });

  it.each(['NODE_ENV', 'KINGDOWN_STAGE', 'VITE_KINGDOWN_STAGE'])('refuses production or staging from %s', name => {
    localEnv();
    vi.stubEnv(name, name === 'NODE_ENV' ? 'production' : 'staging');
    expect(() => viteConfig({ command: 'serve', mode: 'development' })).toThrow(/production or staging/);
  });

  it.each(['VITE_SUPABASE_URL', 'KINGDOWN_LOCAL_API_ORIGIN'])('requires a bare loopback HTTP origin for %s', name => {
    localEnv();
    for (const value of ['https://127.0.0.1:5173', 'http://example.test:5173', 'http://user@127.0.0.1:5173', 'http://user:pass@127.0.0.1:5173', 'http://127.0.0.1:5173/path', 'http://127.0.0.1:5173?x=1', 'http://127.0.0.1:5173#x']) {
      vi.stubEnv(name, value);
      expect(() => viteConfig({ command: 'serve', mode: 'development' }), value).toThrow(/bare loopback HTTP origins/);
    }
  });
});
