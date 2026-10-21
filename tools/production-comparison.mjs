// A read-only comparison of two local static artifacts. No account or remote service is used.
// Run through check:browser production-comparison with both comparison artifact paths set.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, statSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { cpus, platform, release, totalmem } from 'node:os';
import { resolve, join, extname, sep } from 'node:path';
import { gzipSync } from 'node:zlib';
import { env, launch, noSidewaysScroll, shot } from './lib/checks.mjs';
import { arriveContinue, endTurn, lanMoves } from './app-ui.mjs';

const base = process.env.KINGDOWN_COMPARISON_BASE_DIST;
const stage = process.env.KINGDOWN_COMPARISON_STAGE_DIST;
assert.ok(base, 'KINGDOWN_COMPARISON_BASE_DIST must identify the isolated production rebuild');
assert.ok(stage, 'KINGDOWN_COMPARISON_STAGE_DIST must identify the saved staging artifact');
const roots = { production: resolve(base), staging: resolve(stage) };
const out = env('PLAYABLE_OUT'); mkdirSync(out, { recursive: true });
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const walk = root => readdirSync(root).flatMap(name => statSync(join(root, name)).isDirectory() ? walk(join(root, name)) : [join(root, name)]);
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2' };
const save = { back: 'RNBQKBNR', fen: '', moves: ['e2-e4', 'e7-e5'], white: 'human', black: 'human', skill: 'club', sound: false, pace: 'off' };
const report = {
  complete: false, started: new Date().toISOString(),
  conditions: { platform: platform(), release: release(), cpu: cpus()[0].model, logicalCpus: cpus().length, memoryBytes: totalmem(), viewport: { width: 1440, height: 900 }, samplesPerBuildAndCache: 30,
    network: 'loopback; same static server and gzip; no throttling', cache: 'cold fresh browser context; warm same-context HTTP cache; service workers blocked',
    ready: 'saved classic two-ply position, board artwork ready, then two animation frames; no AI or authentication; reduced motion',
    scope: 'Desktop render-opportunity proxy, not hosted latency, phone speed, first-ever ceremony, INP or account/ChatGPT startup. Alternating build order. No request routing (it would disable HTTP caching). CSP denies remote connections.' },
  artifacts: {}, rows: [], journeys: [],
};
function inventory(root) {
  const files = walk(root), js = files.filter(p => p.endsWith('.js'));
  const allow = JSON.parse(readFileSync(join(root, 'sw.js'), 'utf8').match(/const ALLOWLIST = (.*?);/)[1]);
  const offline = [...new Set(allow.map(p => p === './' ? 'index.html' : p))];
  return { indexSha256: hash(readFileSync(join(root, 'index.html'))), swSha256: hash(readFileSync(join(root, 'sw.js'))),
    javascriptFiles: js.length, javascriptBytes: js.reduce((n, p) => n + statSync(p).size, 0), javascriptGzipBytes: js.reduce((n, p) => n + gzipSync(readFileSync(p)).length, 0),
    offlineFiles: offline.length, offlineBytes: offline.reduce((n, p) => n + statSync(join(root, p)).size, 0) };
}
async function serve(root) {
  const buffers = new Map();
  const server = createServer((req, res) => {
    assert.ok(['GET', 'HEAD'].includes(req.method), 'The comparison sends no write requests');
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    try {
      let bytes = buffers.get(file); if (!bytes) { bytes = gzipSync(readFileSync(file)); buffers.set(file, bytes); }
      res.writeHead(200, { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream', 'Content-Encoding': 'gzip',
        'Cache-Control': pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
        'Content-Security-Policy': "default-src 'self' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self'" });
      res.end(req.method === 'HEAD' ? undefined : bytes);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  return { server, url: `http://127.0.0.1:${server.address().port}/` };
}
const servers = {}, browser = await launch(); report.conditions.browser = browser.version();
async function context(viewport = report.conditions.viewport, measure = false) {
  const c = await browser.newContext({ viewport, serviceWorkers: 'block', reducedMotion: 'reduce' });
  await c.addInitScript(({ save, measure }) => {
    if (!localStorage.getItem('kingdown.save')) localStorage.setItem('kingdown.save', JSON.stringify(save));
    if (measure) {
      const wait = () => new Promise(done => requestAnimationFrame(done));
      void (async () => {
        while (!window.view?.ready || !window.home) await wait();
        await window.view.ready(); await wait(); await wait();
        window.__comparisonReady = { milliseconds: performance.now(), resources: performance.getEntriesByType('resource').map(r => ({ path: new URL(r.name).pathname, transferBytes: r.transferSize, encodedBytes: r.encodedBodySize, decodedBytes: r.decodedBodySize })) };
      })();
    }
  }, { save, measure });
  return c;
}
try {
  for (const [name, root] of Object.entries(roots)) { report.artifacts[name] = inventory(root); servers[name] = await serve(root); }
  for (let sample = 0; sample < 30; sample++) {
    for (const name of sample % 2 ? ['staging', 'production'] : ['production', 'staging']) {
      const c = await context(undefined, true), page = await c.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      for (const cache of ['cold', 'warm']) {
        if (cache === 'cold') await page.goto(servers[name].url); else await page.reload();
        await page.waitForFunction(() => window.__comparisonReady);
        assert.equal(await page.locator('#home-progress').innerText(), 'Move 2');
        assert.deepEqual(await lanMoves(page), save.moves);
        assert.deepEqual(errors, []);
        report.rows.push({ build: name, sample: sample + 1, cache, ...await page.evaluate(() => window.__comparisonReady) });
      }
      await c.close();
    }
  }
  for (const name of Object.keys(roots)) for (const viewport of [{ width: 390, height: 844 }, report.conditions.viewport]) {
    const c = await context(viewport), page = await c.newPage();
    await page.goto(servers[name].url); await page.waitForFunction(() => window.view?.ready); await page.evaluate(() => window.view.ready());
    await noSidewaysScroll(page); await shot(page, `${name}-${viewport.width}-home`);
    await arriveContinue(page).click();
    for (const square of [6, 21]) { const p = await page.evaluate(s => window.view.screenOf(s), square); await page.mouse.click(p.x, p.y); }
    await endTurn(page);
    assert.deepEqual(await lanMoves(page), [...save.moves, 'Ng1-f3']);
    await page.reload(); await page.waitForFunction(() => window.view?.ready); await page.evaluate(() => window.view.ready());
    assert.deepEqual(await lanMoves(page), [...save.moves, 'Ng1-f3']);
    await noSidewaysScroll(page); await shot(page, `${name}-${viewport.width}-continued`);
    report.journeys.push({ build: name, viewport, savedGameContinuation: true, committedTurn: 'Ng1-f3', reloadRetainsTurn: true, noHorizontalOverflow: true });
    await c.close();
  }
  const percentile = (rows, p) => rows.map(r => r.milliseconds).sort((a, b) => a - b)[Math.ceil(rows.length * p) - 1];
  report.summary = Object.fromEntries(Object.keys(roots).map(build => [build, Object.fromEntries(['cold', 'warm'].map(cache => {
    const rows = report.rows.filter(r => r.build === build && r.cache === cache);
    return [cache, { samples: rows.length, p50Ms: percentile(rows, 0.5), p95Ms: percentile(rows, 0.95) }];
  }))]));
  report.complete = true; console.log(JSON.stringify({ artifacts: report.artifacts, summary: report.summary, journeys: report.journeys }));
} catch (error) { report.error = String(error.stack ?? error); throw error; }
finally {
  report.finished = new Date().toISOString(); writeFileSync(join(out, 'comparison.json'), JSON.stringify(report, null, 2));
  await browser.close(); for (const { server } of Object.values(servers)) await new Promise(done => server.close(done));
}
