// The live check (secrets-and-public-gates/10, tools/deploy-live-check.mjs), against a local site
// (tools/lib/deploy-site-kit.ts).
import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.setConfig({ testTimeout: 60_000 }); // each case runs a real script or hook in a child process; under load one takes more than vitest's 5 s
import { apiClosure, apiProbes, appPages, buildFolder, check, closedPages, closeSites, googleVerification, pages, site } from './lib/deploy-site-kit';

afterEach(closeSites);

describe('deploy-live-check.mjs', () => {
  const challenge = '.well-known/openai-apps-challenge';

  it('passes when the live site serves the build, and sends no cookie', async () => {
    const files = pages();
    const live = await site(() => files);
    const result = await check(buildFolder(files), live.url);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('index-Abc123_x.js');
    expect(live.requests.map(r => `${r.method} ${r.path}`).sort()).toEqual([
      ...Object.keys(files).map(file => `GET /${file}`), 'GET /', ...[...appPages, ...closedPages].map(path => `GET ${path}`), ...apiProbes,
    ].sort());
    expect(result.stdout).toContain('sw.js version build-v1, policy public-build-v1, sha256');
    expect(result.stdout).toContain("7 app pages serve the build's index.html; 3 closed paths answer 404; account_access closed; 5 API probes pass");
    expect(live.requests.filter(r => r.cookie !== undefined)).toEqual([]);
  });

  it('fails within the time limit when the live site loads a different bundle, and names both bundles', async () => {
    const live = await site(() => ({ ...pages(), 'index.html': pages('index-Old999')['index.html'] }));
    const result = await check(buildFolder(pages()), live.url, 1500);
    expect(result.status).toBe(1);
    expect(result.seconds).toBeLessThan(1.5 + 5);
    expect(result.stderr).toMatch(/bundle: .*index-Old999\.js.*index-Abc123_x\.js/);
    expect(result.stderr).not.toMatch(/terms\.html|privacy\.html|delete-data\.html|support\.html/);
    expect(live.requests.filter(r => r.cookie !== undefined)).toEqual([]);
  });

  it('checks runtime bytes and immutable cache headers', async () => {
    const asset = `character-runtime/assets/${'a'.repeat(64)}.webp`;
    const files = {...pages(), 'character-runtime/manifest.json':'{}', [asset]:'frame bytes'};
    const good = await site(() => files);
    const pass = await check(buildFolder(files), good.url, 0);
    expect(pass.status, pass.stderr).toBe(0);
    expect(good.requests.map(request=>request.path)).toEqual(expect.arrayContaining(['/character-runtime/manifest.json', `/${asset}`]));
    const badAsset = await site(() => files, {path:`/${asset}`,type:'image/webp',cache:'public, max-age=0'});
    const assetResult = await check(buildFolder(files), badAsset.url, 0);
    expect(assetResult.status).toBe(1); expect(assetResult.stderr).toContain('wrong immutable cache policy');
    const shortAsset = await site(() => files, {path:`/${asset}`,type:'image/webp',cache:'public, max-age=60, immutable'});
    const shortResult = await check(buildFolder(files), shortAsset.url, 0);
    expect(shortResult.status).toBe(1); expect(shortResult.stderr).toContain('wrong immutable cache policy');
    const badManifest = await site(() => files, {path:'/character-runtime/manifest.json',type:'application/json',cache:'public, immutable'});
    const manifestResult = await check(buildFolder(files), badManifest.url, 0);
    expect(manifestResult.status).toBe(1); expect(manifestResult.stderr).toContain('wrong immutable cache policy');
  });

  it('checks the character sounds of the worker lists for their bytes and the audio/wav type', async () => {
    const sound = 'audio/armour/select-armour-A.wav', base = pages();
    const files = { ...base, [sound]: 'RIFF sound', 'sw.js': base['sw.js'].replaceAll('"manifest.webmanifest"', `"manifest.webmanifest","${sound}"`) };
    const good = await site(() => files);
    const pass = await check(buildFolder(files), good.url, 0);
    expect(pass.status, pass.stderr).toBe(0); expect(good.requests.map(request => request.path)).toContain(`/${sound}`);
    const wrong = await site(() => files, { path: `/${sound}`, type: 'audio/wave' });
    const result = await check(buildFolder(files), wrong.url, 0);
    expect(result.status).toBe(1); expect(result.stderr).toContain(`/${sound}: expected audio/wav, got audio/wave`);
  });

  it('fails within the time limit when the live terms page differs, and names only that page', async () => {
    const live = await site(() => pages(undefined, 'Terms v2'));
    const result = await check(buildFolder(pages()), live.url, 1500);
    expect(result.status).toBe(1);
    expect(result.seconds).toBeLessThan(1.5 + 5);
    expect(result.stderr).toMatch(/terms\.html: the live page differs/);
    expect(result.stderr).not.toMatch(/bundle:|privacy\.html|delete-data\.html|support\.html/);
    expect(live.requests.filter(r => r.cookie !== undefined)).toEqual([]);
  });

  it.each(['missing', 'stale'])('refuses a %s support page within the time limit', async fault => {
    const files = pages(), served: Record<string,string> = {...files};
    if (fault === 'missing') delete served['support.html']; else served['support.html'] = 'Old support';
    const live = await site(() => served);
    const result = await check(buildFolder(files), live.url, 1500);
    expect(result.status).toBe(1);
    expect(result.seconds).toBeLessThan(1.5 + 5);
    expect(result.stderr).toContain('support.html');
  });

  it('tries again until the live site serves the build, inside the time limit', async () => {
    let served = 0;
    const live = await site(() => (served++ === 0 ? { ...pages(), 'index.html': pages('index-Old999')['index.html'] } : pages()));
    const result = await check(buildFolder(pages()), live.url, 7000);
    expect(result.status, result.stderr).toBe(0);
    expect(live.requests.filter(r => r.path === '/').length).toBe(2);
  });

  it('keeps the whole-check limit when requests and queued probes are slow', async () => {
    const files = pages(), live = await site(() => files, { delayMs: 500 });
    const result = await check(buildFolder(files), live.url, 250);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('GET /: fetch failed');
    expect(result.stderr).not.toContain('repeat');
    expect(live.requests.length).toBeLessThanOrEqual(8);
    expect(live.peak).toBeLessThanOrEqual(8);
    expect(result.seconds).toBeLessThan(3);
  });

  it.each(['sw.js', googleVerification, 'assets/index-Abc123_x.js', 'assets/lazy.js', 'assets/ai-worker.js', 'assets/style.css', 'fonts/game.woff2', 'icons/game.png', 'ui/board.webp', 'ui/piece.svg', 'manifest.webmanifest'])('rejects stale public bytes at %s', async path => {
    const files = pages();
    const live = await site(() => ({ ...files, [path]: 'stale bytes' }));
    const result = await check(buildFolder(files), live.url, 0);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(`${path}: the live page differs`);
  });

  it('compares every file under assets/, also one that no worker list names', async () => {
    const files = { ...pages(), 'assets/chunk-OldB1234.js': 'old chunk' };
    const live = await site(() => files);
    const pass = await check(buildFolder(files), live.url);
    expect(pass.status, pass.stderr).toBe(0);
    expect(live.requests.some(r => r.path === '/assets/chunk-OldB1234.js')).toBe(true);
    expect(pass.stdout).toContain('public files match bytes and types (5 under /assets/)');
    const stale = await site(() => ({ ...files, 'assets/chunk-OldB1234.js': 'other bytes' }));
    const changed = await check(buildFolder(files), stale.url, 0);
    expect(changed.status).toBe(1);
    expect(changed.stderr).toContain('assets/chunk-OldB1234.js: the live page differs');
    const missing = await site(() => pages());
    const fail = await check(buildFolder(files), missing.url, 0);
    expect(fail.status).toBe(1);
    expect(fail.stderr).toContain('/assets/chunk-OldB1234.js: HTTP 404');
  });

  it('rejects a missing offline asset', async () => {
    const files = pages(), served: Record<string, string> = { ...files };
    delete served['assets/lazy.js'];
    const live = await site(() => served);
    const result = await check(buildFolder(files), live.url, 0);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('/assets/lazy.js: HTTP 404');
  });

  it.each(['sw.js', 'assets/index-Abc123_x.js', 'assets/style.css', 'fonts/game.woff2', 'icons/game.png', 'ui/board.webp', 'ui/piece.svg', 'manifest.webmanifest'])('rejects an HTML fallback type for %s', async path => {
    const files = pages(), live = await site(() => files, { path: `/${path}`, type: 'text/html' });
    const result = await check(buildFolder(files), live.url, 0);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(`/${path}: expected `);
  });

  it.each(closedPages)('rejects an open route at %s', async path => {
    const files = pages(), live = await site(() => ({ ...files, [path.slice(1)]: '<html>unexpected</html>' }));
    const result = await check(buildFolder(files), live.url, 0);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(`GET ${path}: expected 404 without redirect, got HTTP 200`);
  });

  it.each(appPages)('requires the build\'s index.html at the app page %s', async path => {
    const files = pages();
    for (const served of [{ ...files, [path.slice(1)]: 'stale shell' }, undefined]) {
      const live = served ? await site(() => served) : await site(() => files, { path, status: 404, type: 'text/html', body: 'not found' });
      const result = await check(buildFolder(files), live.url, 0);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(served ? `${path.slice(1)} (app page): the live page differs` : `${path}: HTTP 404`);
    }
  });

  it('passes with the switch open and prints the account state', async () => {
    const files = pages(), live = await site(() => files, {}, 'open');
    const result = await check(buildFolder(files), live.url);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('account_access open; 5 API probes pass');
  });

  it.each([
    { name: 'HTML 404', type: 'text/html', body: '<html>Not found</html>' },
    { name: 'missing JSON type', type: null, body: apiClosure },
    { name: 'empty 404', body: '' },
    { name: 'malformed JSON', body: '{broken' },
    { name: 'wrong code', body: JSON.stringify({ code: 'UNAVAILABLE' }) },
    { name: 'missing no-store', body: apiClosure, cache: null },
    { name: 'cacheable closure', body: apiClosure, cache: 'max-age=60' },
    { name: 'verifier 503', status: 503, body: JSON.stringify({ code: 'UNAVAILABLE' }) },
  ])('rejects $name for GET and POST /api', async fault => {
    const live = await site(() => pages(), { path: '/api', ...fault });
    const result = await check(buildFolder(pages()), live.url, 0);
    expect(result.status).toBe(1);
    for (const method of ['GET', 'POST']) expect(result.stderr).toContain(`${method} /api:`);
  });

  it.each([
    { name: 'a missing status', status: 404, body: apiClosure, message: 'GET /api/status: expected JSON HTTP 200' },
    { name: 'an unknown state', status: 200, body: JSON.stringify({ account_access: 'maybe', valid_for_ms: 0 }), message: 'expected account_access closed (valid_for_ms 0) or open (valid_for_ms > 0)' },
    { name: 'a cacheable status', status: 200, body: JSON.stringify({ account_access: 'closed', valid_for_ms: 0 }), cache: 'max-age=60', message: 'GET /api/status: expected JSON HTTP 200' },
    // src/api/http.ts: a closed state has no lease; an open state has a positive lease.
    { name: 'a closed state with a lease', status: 200, body: JSON.stringify({ account_access: 'closed', valid_for_ms: 5000 }), message: 'expected account_access closed (valid_for_ms 0) or open (valid_for_ms > 0)' },
    { name: 'an open state without a lease', status: 200, body: JSON.stringify({ account_access: 'open', valid_for_ms: 0 }), message: 'expected account_access closed (valid_for_ms 0) or open (valid_for_ms > 0)' },
    { name: 'an open state with a negative lease', status: 200, body: JSON.stringify({ account_access: 'open', valid_for_ms: -1 }), message: 'expected account_access closed (valid_for_ms 0) or open (valid_for_ms > 0)' },
  ])('rejects $name at /api/status', async ({ message, ...fault }) => {
    const live = await site(() => pages(), { path: '/api/status', ...fault });
    const result = await check(buildFolder(pages()), live.url, 0);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(message);
  });

  it.each([
    { path: '/api/me/games', status: 200, body: '[]', message: 'GET /api/me/games: expected JSON HTTP 503 UNAVAILABLE' },
    { path: '/api/me/games', status: 401, body: JSON.stringify({ code: 'UNAUTHENTICATED' }), message: 'GET /api/me/games: expected JSON HTTP 503 UNAVAILABLE' },
    { path: '/api/games', status: 201, body: '{}', message: 'POST /api/games: expected JSON HTTP 503 UNAVAILABLE' },
  ])('rejects an account call that does not refuse while the switch is closed ($path HTTP $status)', async ({ message, ...fault }) => {
    const live = await site(() => pages(), fault);
    const result = await check(buildFolder(pages()), live.url, 0);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(message);
  });

  it('rejects an unsigned account call that succeeds while the switch is open', async () => {
    const live = await site(() => pages(), { path: '/api/me/games', status: 200, body: '[]' }, 'open');
    const result = await check(buildFolder(pages()), live.url, 0);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('GET /api/me/games: expected JSON HTTP 401 UNAUTHENTICATED');
  });

  it.each([302, 404])('rejects a closed-route redirect header with HTTP %s and does not follow it', async status => {
    const live = await site(() => pages(), { path: '/deploy-check-unknown', status, location: '/redirect-target' });
    const result = await check(buildFolder(pages()), live.url, 0);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('GET /deploy-check-unknown: expected 404 without redirect');
    expect(live.requests.some(request => request.path === '/redirect-target')).toBe(false);
  });

  it('rejects a redirect for the worker and does not follow it', async () => {
    const live = await site(() => pages(), { path: '/sw.js', status: 307, location: '/redirect-target' });
    const result = await check(buildFolder(pages()), live.url, 0);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('/sw.js: HTTP 307');
    expect(live.requests.some(request => request.path === '/redirect-target')).toBe(false);
  });

  it('rejects an incomplete local build before it sends a probe', async () => {
    const files: Record<string, string> = { ...pages() }, live = await site(() => pages());
    delete files['assets/lazy.js'];
    const result = await check(buildFolder(files), live.url, 0);
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('the build has no assets/lazy.js');
    expect(live.requests).toEqual([]);
  });

  it('checks the exact domain challenge bytes as plain text with no cookie', async () => {
    const files = { ...pages(), [challenge]: randomUUID() };
    const live = await site(() => files);
    const result = await check(buildFolder(files), live.url, 0);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain(`${challenge} are identical to the build`);
    expect(live.requests.filter(r => r.path === `/${challenge}`)).toHaveLength(1);
    expect(live.requests.filter(r => r.cookie !== undefined)).toEqual([]);
  });

  it('skips a live domain challenge when the build has no file', async () => {
    const live = await site(() => ({ ...pages(), [challenge]: randomUUID() }));
    const result = await check(buildFolder(pages()), live.url, 0);
    expect(result.status, result.stderr).toBe(0);
    expect(live.requests.some(r => r.path === `/${challenge}`)).toBe(false);
  });

  it.each(['application/json', 'text/html', 'text/plainly', null])('rejects a domain challenge with type %s', async type => {
    const files = { ...pages(), [challenge]: randomUUID() };
    const live = await site(() => files, { type });
    const result = await check(buildFolder(files), live.url, 0);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(`${challenge}: expected text/plain`);
  });

  it.each([201, 301, 302, 307, 308])('rejects domain challenge status %s and follows no redirect', async status => {
    const files = { ...pages(), [challenge]: randomUUID() };
    const live = await site(() => files, { status, location: '/token' });
    const result = await check(buildFolder(files), live.url, 0);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(`${challenge}: HTTP ${status}`);
    expect(live.requests.some(r => r.path === '/token')).toBe(false);
  });

  it('rejects a missing live domain challenge', async () => {
    const live = await site(() => pages());
    const result = await check(buildFolder({ ...pages(), [challenge]: randomUUID() }), live.url, 0);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(`${challenge}: HTTP 404`);
  });

  it('rejects a domain challenge that differs by one byte', async () => {
    const files = { ...pages(), [challenge]: randomUUID() };
    const live = await site(() => ({ ...files, [challenge]: files[challenge].slice(0, -1) }));
    const result = await check(buildFolder(files), live.url, 0);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(`${challenge}: the live page differs`);
  });
});

it('checks the launch root against the new page and keeps the old online page byte check', async () => {
  const files = { ...pages(), 'solo-launch.json': '{"soloLaunch":true}', 'next.html': pages()['index.html'] + '<p>New solo page</p>' };
  const live = await site(() => files);
  const result = await check(buildFolder(files), live.url);
  expect(result.status, result.stderr).toBe(0);
  const wrong = await site(() => files, { path: '/play', status: 200, type: 'text/html', body: files['next.html'] });
  const refused = await check(buildFolder(files), wrong.url, 0);
  expect(refused.status).toBe(1); expect(refused.stderr).toContain('play (app page)');
  // A build with the invite page: /j must serve it, not the old page.
  const invite = await check(buildFolder({ ...files, 'join.html': '<!doctype html><title>Join</title>' }), live.url, 0);
  expect(invite.status).toBe(1); expect(invite.stderr).toContain('j (app page)');
});
