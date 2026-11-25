// The plugin live check (tools/deploy-plugin-live-check.mjs), against a local plugin site
// (tools/lib/deploy-site-kit.ts).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.setConfig({ testTimeout: 60_000 }); // each case runs a real script or hook in a child process; under load one takes more than vitest's 5 s
import { PARKED_PATHS } from './chatgpt-plugin.mjs';
import { MUSE_PATHS } from './muse-connector.mjs';
import { buildFolder, closeSites, pluginFolder, pluginLiveCheck, pluginSite, runAsync } from './lib/deploy-site-kit';

afterEach(closeSites);

describe('deploy-plugin-live-check.mjs', () => {
  const passingEnv = { ...process.env, DEPLOY_LIVE_TIMEOUT_MS: '10000' };
  const parkedFolder = () => { const folder = join(buildFolder({}), 'functions/mcp.func'); mkdirSync(folder, { recursive: true }); return folder; };
  const parkedRequests = [...PARKED_PATHS, ...MUSE_PATHS, '/plugin-art/deploy-check-0000.webp'].flatMap(path => [`GET ${path}`, `POST ${path}`]).sort();
  // A ChatGPT build checks that the Muse paths answer 404 to GET and POST.
  const museParked = MUSE_PATHS.flatMap(path => [path, path]);
  const authorizePath = '/authorize?authorization_id=deploy-check%2Bquery&state=keep%20me';
  /** A tree with the Muse route; `chatgpt` adds the board widget and the ChatGPT art. */
  const museFolder = (chatgpt: boolean) => {
    const folder = chatgpt ? pluginFolder() : join(buildFolder({}), 'functions/mcp.func');
    mkdirSync(folder, { recursive: true }); writeFileSync(join(folder, 'consent.mjs'), 'consent-v1');
    if (chatgpt) writeFileSync(join(folder, 'board.html'), 'board');
    const configFile = join(folder, '../../config.json'), routes = chatgpt ? JSON.parse(readFileSync(configFile, 'utf8')).routes : [];
    writeFileSync(configFile, JSON.stringify({ version: 3, routes: [...routes, ...MUSE_PATHS.map(path => ({ src: `^${path.replace(/[.]/g, '\\.')}$`, dest: '/mcp' }))] }));
    return folder;
  };

  it('checks a Muse build: its metadata, its challenge and the consent page; each ChatGPT path answers 404', async () => {
    const live = await pluginSite('muse');
    const result = await runAsync(process.execPath, [pluginLiveCheck, museFolder(false), live.url], { env: passingEnv });
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('Muse connector: metadata and unsigned challenge');
    const parked = [...PARKED_PATHS.filter(path => !['/authorize', '/consent.mjs'].includes(path)), '/plugin-art/deploy-check-0000.webp'].flatMap(path => [path, path]);
    expect(live.requests.map(request => request.path).sort()).toEqual(['/.well-known/oauth-protected-resource/muse/mcp', '/muse/mcp', authorizePath, '/consent.mjs', ...parked].sort());
    expect(live.requests.every(request => !request.cookie && !request.authorization)).toBe(true);
  });

  it('checks a build with both connectors when Muse is served or parked by the live server', async () => {
    const live = await pluginSite('both');
    const result = await runAsync(process.execPath, [pluginLiveCheck, museFolder(true), live.url], { env: passingEnv });
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('ChatGPT plugin: both metadata paths');
    expect(result.stdout).toContain('Muse connector: metadata and unsigned challenge');
    expect(live.requests.map(request => request.path).sort()).toEqual(['/.well-known/oauth-protected-resource', '/.well-known/oauth-protected-resource/mcp', '/mcp', ...MUSE_PATHS, authorizePath, '/consent.mjs', '/plugin-art/test-art.webp'].sort());
    const old = await runAsync(process.execPath, [pluginLiveCheck, museFolder(true), (await pluginSite()).url], { env: passingEnv });
    expect(old.status, old.stderr).toBe(0);
    expect(old.stdout).toContain('2 parked paths answer 404 to GET and POST');
    expect(old.stdout).not.toContain('Muse connector:');
    expect(old.stdout).toContain('Muse connector parked');
  });

  /** A staging Muse build: the build records the staging account (tools/plugin-server-build.mjs). */
  const stagingFolder = () => {
    const folder = museFolder(false);
    writeFileSync(join(folder, '../../staging.json'), JSON.stringify({ stage: 'staging', supabaseUrl: 'https://puhspsyjyzaghmgtkzqd.supabase.co' }));
    return folder;
  };

  it('checks a staging Muse build against the staging issuer from the staging record', async () => {
    const result = await runAsync(process.execPath, [pluginLiveCheck, stagingFolder(), (await pluginSite('staging')).url], { env: passingEnv });
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('Muse connector: metadata and unsigned challenge');
  });

  it('rejects a staging Muse endpoint that answers 404 or names the production issuer', async () => {
    for (const [fault, reason] of [['parked', 'Muse metadata must be served on staging'], ['muse', '/muse/mcp discovery issuer']]) {
      const result = await runAsync(process.execPath, [pluginLiveCheck, stagingFolder(), (await pluginSite(fault)).url], { env: { ...process.env, DEPLOY_LIVE_TIMEOUT_MS: '250' } });
      expect(result.status, fault).toBe(1);
      expect(result.stderr).toContain(`plugin-live-check: FAIL: ${reason}`);
    }
    // A staging build without the Muse route fails, though the server parks each path.
    const folder = parkedFolder();
    writeFileSync(join(folder, '../../staging.json'), JSON.stringify({ stage: 'staging', supabaseUrl: 'https://puhspsyjyzaghmgtkzqd.supabase.co' }));
    const result = await runAsync(process.execPath, [pluginLiveCheck, folder, (await pluginSite('parked')).url], { env: { ...process.env, DEPLOY_LIVE_TIMEOUT_MS: '250' } });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('plugin-live-check: FAIL: Muse must be built on staging');
  });

  it('checks that each parked plugin path answers 404 when the build has no consent script', async () => {
    const live = await pluginSite('parked');
    const result = await runAsync(process.execPath, [pluginLiveCheck, parkedFolder(), live.url], { env: passingEnv });
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('ChatGPT plugin parked');
    expect(live.requests.map(request => `${request.method} ${request.path}`).sort()).toEqual(parkedRequests);
    expect(live.requests.every(request => !request.cookie && !request.authorization)).toBe(true);
  });

  it('rejects a parked build while the live site still serves the plugin', async () => {
    const live = await pluginSite();
    const result = await runAsync(process.execPath, [pluginLiveCheck, parkedFolder(), live.url], { env: { ...process.env, DEPLOY_LIVE_TIMEOUT_MS: '1500' } });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('plugin-live-check: FAIL');
    expect(live.requests.some(request => request.method === 'POST' && request.path === '/mcp')).toBe(true);
  });

  it('checks discovery, an unsigned challenge and the built consent script without account credentials', async () => {
    const live = await pluginSite();
    const result = await runAsync(process.execPath, [pluginLiveCheck, buildFolder({ 'consent.mjs': 'consent-v1' }), live.url], { env: passingEnv });
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('plugin-live-check: pass');
    expect(live.requests.map(request => request.path).sort()).toEqual(['/.well-known/oauth-protected-resource', '/.well-known/oauth-protected-resource/mcp', '/authorize?authorization_id=deploy-check%2Bquery&state=keep%20me', '/consent.mjs', '/mcp', ...museParked].sort());
    expect(live.requests.every(request => !request.cookie && !request.authorization)).toBe(true);
  });

  it('checks both metadata paths, the consent query and built art policy with the migration timeout', async () => {
    const live = await pluginSite();
    const result = await runAsync(process.execPath, [pluginLiveCheck, pluginFolder(), live.url], { env: { ...process.env, DEPLOY_LIVE_TIMEOUT_MS: '900000' } });
    expect(result.status, result.stderr).toBe(0);
    expect(live.requests.map(request => request.path).sort()).toEqual(['/.well-known/oauth-protected-resource', '/.well-known/oauth-protected-resource/mcp', '/authorize?authorization_id=deploy-check%2Bquery&state=keep%20me', '/consent.mjs', '/mcp', ...museParked, '/plugin-art/test-art.webp'].sort());
    expect(live.requests.every(request => !request.cookie && !request.authorization)).toBe(true);
  });

  it('rejects missing metadata, a lost consent query, unsigned access and stale scripts or art policies', async () => {
    for (const fault of ['issuer', 'challenge', 'script', 'metadata-root', 'query', 'art', 'csp', 'cors']) {
      const live = await pluginSite(fault);
      const timeoutMs = fault === 'cors' ? '2000' : '250';
      const result = await runAsync(process.execPath, [pluginLiveCheck, pluginFolder(), live.url], { env: { ...process.env, DEPLOY_LIVE_TIMEOUT_MS: timeoutMs } });
      expect(result.status, fault).toBe(1);
      expect(result.stderr).toContain('plugin-live-check: FAIL');
      // The report names the check that failed, not the last short request.
      if (fault === 'cors') expect(result.stderr).toContain('/plugin-art/test-art.webp Access-Control-Allow-Origin');
      expect(result.seconds).toBeLessThan(5);
    }
  });

  it('accepts a slow art response with a charset that the host adds', async () => {
    const result = await runAsync(process.execPath, [pluginLiveCheck, pluginFolder(), (await pluginSite('charset')).url], { env: passingEnv });
    expect(result.status, result.stderr).toBe(0);
  });
});
