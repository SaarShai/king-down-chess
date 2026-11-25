// The request limits and repeats of both live tools (tools/deploy-keep-assets.mjs and
// tools/deploy-live-check.mjs) over a slow link, against a local site (tools/lib/deploy-site-kit.ts).
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.setConfig({ testTimeout: 60_000 }); // each case runs a real script or hook in a child process; under load one takes more than vitest's 5 s
import { buildFolder, closeSites, keepAssets, liveCheck, pages, runAsync, site } from './lib/deploy-site-kit';

afterEach(closeSites);

describe.each([['keep-assets', keepAssets], ['live-check', liveCheck]])('%s over a slow link', (name, tool) => {
  const path = '/assets/index-Abc123_x.js';
  const run = (folder: string, url: string, requestTimeout?: string) => runAsync(process.execPath, [tool, folder], {
    env: { ...process.env, DEPLOY_LIVE_URL: url, DEPLOY_LIVE_TIMEOUT_MS: '0', DEPLOY_REQUEST_TIMEOUT_MS: requestTimeout },
  });

  it('passes a slow response after 16 s with the default request limit', async () => {
    const files = pages(), live = await site(() => files, { path, type: 'text/javascript', delayMs: 16_000 });
    const result = await run(buildFolder(files), live.url);
    expect(result.status, result.stderr).toBe(0);
    expect(live.requests.filter(r => r.path === path)).toHaveLength(1);
    expect(result.stderr).not.toContain('repeat');
  });

  it('passes on a repeat after a dropped connection and logs the repeat', async () => {
    const files = pages(), live = await site(() => files, { path, type: 'text/javascript', drop: 1 });
    const result = await run(buildFolder(files), live.url);
    expect(result.status, result.stderr).toBe(0);
    expect(live.requests.filter(r => r.path === path)).toHaveLength(2);
    expect(result.stderr).toContain(`${name}: repeat 1/2 GET ${path}: fetch failed`);
    expect(result.stderr.match(/repeat /g)).toHaveLength(1);
  });

  it.each(['network fault', 'timeout'])('stops after three attempts on a %s', async fault => {
    const files = pages(), live = await site(() => files, { path, type: 'text/javascript', ...(fault === 'timeout' ? { delayMs: 3000 } : { drop: 3 }) });
    // A 1 s limit: a loaded machine must not time out the other files.
    const result = await run(buildFolder(files), live.url, fault === 'timeout' ? '1000' : undefined);
    expect(result.status).toBe(1);
    expect(live.requests.filter(r => r.path === path)).toHaveLength(3);
    expect(result.stderr).toContain(`GET ${path}: fetch failed`);
    expect(result.stderr).toContain(`${name}: repeat 2/2 GET ${path}: fetch failed`);
    expect(result.stderr.split('\n').filter(line => line.includes('repeat ') && line.includes(`GET ${path}:`))).toHaveLength(2);
    expect(result.seconds).toBeLessThan(15);
  });

  it('rejects a wrong status at once with the old message and no repeat', async () => {
    const files = pages(), live = await site(() => files, { path, status: 503 });
    const result = await run(buildFolder(files), live.url);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(name === 'keep-assets' ? `keep-assets: GET ${path}: expected HTTP 200, got 503` : `${path}: HTTP 503`);
    expect(live.requests.filter(r => r.path === path)).toHaveLength(1);
    expect(result.stderr).not.toContain('repeat');
  });

  it('keeps at most eight requests open at once', async () => {
    const assets = Object.fromEntries(Array.from({ length: 24 }, (_, i) => [`assets/image-${String(i).padStart(8, '0')}.png`, 'image']));
    const files = { ...pages(), ...assets, 'index.html': pages()['index.html'] + Object.keys(assets).map(file => `<img src="/${file}">`).join('') };
    const live = await site(() => files, { delayMs: 50 });
    const result = await run(buildFolder(files), live.url);
    expect(result.status, result.stderr).toBe(0);
    expect(live.peak).toBe(8);
    for (const file of Object.keys(assets)) expect(live.requests.filter(r => r.path === `/${file}`)).toHaveLength(1);
  });

  it.each(['', '0', '-1', '1.5', 'Infinity', 'invalid', '2147483648'])('rejects request limit %j before any request', async timeout => {
    const files = pages(), live = await site(() => files);
    const result = await run(buildFolder(files), live.url, timeout);
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('DEPLOY_REQUEST_TIMEOUT_MS must be a whole number from 1 to 2147483647 milliseconds');
    expect(live.requests).toEqual([]);
  });
});
