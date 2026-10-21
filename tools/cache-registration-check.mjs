/** A real browser registration job blocked by its actual loopback script fetch. */
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from './lib/checks.mjs';
import { buildWorkerProbe } from './web-online-check.mjs';

export async function checkCacheRegistration({ holdMs = 12_000 } = {}) {
  const probe = await buildWorkerProbe();
  const template = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8');
  const worker = template.replace("const VERSION = 'dev';", "const VERSION = 'registration-diagnostic';")
    .replace('const ALLOWLIST = [];', "const ALLOWLIST = ['index.html'];");
  let browser, heldResponse, releaseTimer, holdNext = false, privateSends = 0, held;
  const requested = new Promise(done => { held = done; });
  const release = () => { if (heldResponse) { heldResponse.end(worker); heldResponse = undefined; } };
  const server = createServer((req, res) => {
    const path = new URL(req.url, 'http://fixture').pathname;
    if (path === '/sw.js') {
      res.setHeader('Content-Type', 'text/javascript'); res.setHeader('Cache-Control', 'no-store');
      if (holdNext) { holdNext = false; heldResponse = res; held(); releaseTimer = setTimeout(release, holdMs); }
      else res.end(worker);
    } else if (path === '/probe.js') { res.setHeader('Content-Type', 'text/javascript'); res.end(probe); }
    else if (path.startsWith('/api/')) { privateSends++; res.setHeader('Content-Type', 'application/json'); res.end('[]'); }
    else if (path.startsWith('/fixture/')) res.end('{}');
    else { res.setHeader('Content-Type', 'text/html'); res.end('<script>window.recordWorkerEvent=()=>Promise.resolve();</script><script type="module" src="/probe.js"></script>'); }
  });
  try {
    server.listen(0, '127.0.0.1'); await once(server, 'listening');
    const origin = `http://127.0.0.1:${server.address().port}`;
    browser = await launch({ headless: true, channel: 'chromium' });
    const context = await browser.newContext(), page = await context.newPage(), failures = [];
    await context.route('**/*', route => {
      assert.equal(new URL(route.request().url()).origin, origin, 'Diagnostic traffic stays on loopback');
      return route.continue();
    });
    page.on('console', message => {
      const prefix = '[King Down cache safety] ';
      if (message.type() === 'warning' && message.text().startsWith(prefix)) failures.push(JSON.parse(message.text().slice(prefix.length)));
    });
    await page.goto(origin);
    await page.waitForFunction(() => typeof window.privateProbe === 'function');
    await page.evaluate(async () => {
      await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' });
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) await new Promise(done => navigator.serviceWorker.addEventListener('controllerchange', done, { once: true }));
    });
    assert.deepEqual(await page.evaluate(() => window.privateProbe('safe-entry')), { status: 200, code: '' });
    await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration()).update(); });
    privateSends = 0; holdNext = true;
    // This is a native update and script request, not a replacement register() promise.
    await page.evaluate(() => { window.registrationJob = navigator.serviceWorker.getRegistration().then(registration => registration.update()); });
    await requested;
    const stateBefore = await page.evaluate(() => navigator.serviceWorker.controller?.state);
    const began = performance.now();
    const result = await page.evaluate(() => window.privateProbe('blocked-registration'));
    const beforeRelease = { elapsed_ms: Math.round(performance.now() - began), fetch_held: !!heldResponse, private_sends: privateSends };
    if (holdMs >= 8000 && result.status === 200) {
      assert(beforeRelease.fetch_held, 'Fresh proof sends while the native update fetch is still held');
      assert(beforeRelease.elapsed_ms < 8000, 'Safe proof does not wait for the native registration job deadline');
      assert.equal(beforeRelease.private_sends, 1, 'The private request follows proof before script-fetch release');
    }
    release(); clearTimeout(releaseTimer);
    await page.evaluate(async () => { await window.registrationJob; await (await navigator.serviceWorker.getRegistration()).update(); });
    const continuedSends = privateSends;
    const afterRelease = await page.evaluate(() => window.privateProbe('fresh-after-release'));
    assert.deepEqual(afterRelease, { status: 200, code: '' }, 'The real worker gives fresh policy proof after the native fetch completes');
    assert.equal(privateSends, continuedSends + 1, 'Only the explicit fresh gate sends after release');
    const report = { hold_ms: holdMs, result, failures, controller_before: stateBefore, before_release: beforeRelease, private_sends: continuedSends, after_release: afterRelease };
    console.log('Cache registration diagnostic ' + JSON.stringify(report));
    if (result.status !== 200) {
      assert.equal(continuedSends, 0, 'A refused gate must not send, even after late registration completion');
      assert.equal(failures.at(-1)?.phase, 'register', 'The loop must reach the observed register phase');
      assert.equal(failures.at(-1)?.reason, 'deadline');
      assert.equal(failures.at(-1)?.controller, 'activated');
    }
    assert.deepEqual(result, { status: 200, code: '' }, 'A bounded native script job can complete safely after the proof-only eight-second interval');
    assert.equal(continuedSends, 1, 'Safe continuation sends exactly once');
    return report;
  } finally {
    release(); clearTimeout(releaseTimer); await browser?.close();
    server.closeAllConnections(); await new Promise(done => server.close(done));
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await checkCacheRegistration();
