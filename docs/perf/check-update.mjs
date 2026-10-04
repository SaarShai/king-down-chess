/** Offline and update check for the built game (run after `npm run build`):
 *    PLAYABLE_BROWSER=chromium node docs/perf/check-update.mjs
 *  Serves a copy of dist/ itself, visits it, then "deploys" a new version (new page content and a
 *  new service-worker version) and checks that the next load shows the new page, the new worker
 *  replaces the old cache, and an offline reload right after works. Exits non-zero on failure. */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../../dist', import.meta.url));
const dir = mkdtempSync(join(tmpdir(), 'kingdown-update-'));
cpSync(dist, dir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp', '.glb': 'model/gltf-binary' };
// Like most static hosts (and vite preview): revalidate everything, and send `Vary: Origin`.
const server = createServer((req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  try {
    const body = readFileSync(join(dir, path.endsWith('/') ? `${path}index.html` : path));
    res.writeHead(200, { 'Content-Type': TYPES[extname(path)] ?? (path.endsWith('/') ? 'text/html' : 'application/octet-stream'), 'Cache-Control': 'no-cache', Vary: 'Origin' });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch({ headless: true, channel: process.env.PLAYABLE_BROWSER });
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const caches = () => page.evaluate(() => caches.keys());
  const until = async (fn, what, ms = 60000) => { const t = Date.now(); while (!(await fn())) { if (Date.now() - t > ms) throw new Error(`timed out: ${what}`); await page.waitForTimeout(250); } };
  const ready = async () => { await page.waitForFunction(() => window.view, null, { timeout: 30000 }); await page.evaluate(() => window.view.ready()); };

  await page.goto(url); await ready();
  await until(() => page.evaluate(() => !!navigator.serviceWorker.controller), 'the service worker takes over');
  const [first] = await caches();
  console.log(`ok first visit cached as ${first}`);

  writeFileSync(join(dir, 'index.html'), readFileSync(join(dir, 'index.html'), 'utf8').replace('<html lang="en">', '<html lang="en" data-deploy="v2">'));
  writeFileSync(join(dir, 'sw.js'), readFileSync(join(dir, 'sw.js'), 'utf8').replace(/const VERSION = '([0-9a-f]+)'/, "const VERSION = '$1v2'"));
  await page.reload(); await ready();
  assert.equal(await page.evaluate(() => document.documentElement.dataset.deploy), 'v2', 'the next load shows the new page');
  await until(async () => { const k = await caches(); return k.length === 1 && k[0] === `${first}v2`; }, 'the new version replaces the old cache');
  console.log('ok next load shows the new version; the old cache is gone');

  await context.setOffline(true);
  await page.reload(); await ready();
  assert.equal(await page.evaluate(() => document.documentElement.dataset.deploy), 'v2');
  console.log('ok offline reload right after the update');

  // Another page of the site (Privacy, from Settings → Account) never takes the game's place offline.
  await context.setOffline(false);
  writeFileSync(join(dir, 'privacy.html'), '<!doctype html><title>Privacy policy</title><p>Privacy</p>');
  const other = await context.newPage();
  await other.goto(`${url}privacy.html`);
  assert.equal(await other.title(), 'Privacy policy');
  await other.close();
  // Signed in, offline, the account's code never downloaded: the game loads and plays as before.
  const exp = Math.floor(Date.now() / 1000) + 3600;
  await page.evaluate(exp => {
    sessionStorage.setItem('kingdown.title-seen', '1');
    localStorage.setItem('kingdown.auth', JSON.stringify({ access_token: 'x.y.z', refresh_token: 'r', token_type: 'bearer', expires_in: 3600, expires_at: exp,
      user: { id: '0a7c1d2e-3f40-4b5c-8d6e-7f8091a2b3c4', user_metadata: { full_name: 'Ada' }, app_metadata: { provider: 'google' } } }));
  }, exp);
  await context.route('https://utqzovjmclfyojedmwok.supabase.co/**', r => r.abort('internetdisconnected'));
  await context.setOffline(true);
  await page.reload(); await ready();
  assert.equal(await page.evaluate(() => document.documentElement.dataset.deploy), 'v2', 'the game, not the other page');
  await page.waitForFunction(() => document.querySelector('#account-body b')?.textContent === 'Ada');
  for (const sq of [12, 28]) { const p = await page.evaluate(s => window.view.screenOf(s), sq); await page.mouse.click(p.x, p.y); } // e2-e4
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('kingdown.save')).moves.length >= 1);
  console.log('ok after opening another page of the site, an offline start is still the game; signed in and offline, it plays and saves');
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
  server.close();
  rmSync(dir, { recursive: true, force: true });
}
