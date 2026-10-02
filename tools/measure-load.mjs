/** Cold-load timing of the built game on a slow phone, both looks, plus a repeat visit and an offline reload.
 *
 *   npm run build && npx vite preview --host 127.0.0.1 --port 5189 --strictPort &
 *   PLAYABLE_URL=http://127.0.0.1:5189/ PLAYABLE_BROWSER=chromium node tools/measure-load.mjs [--runs 3] [--out file.json]
 *
 * Each run is a fresh browser profile (empty cache, no service worker) at 390×844, CPU slowed 4×,
 * network 1.6 Mbps down / 750 kbps up / 150 ms round trip (Chrome's "slow 4G" class).
 * "Board ready" is when the game has drawn its pieces (view.ready() resolved and "Loading pieces…" is gone);
 * "first move" is when a tap on e2 then e4 (300 ms apart), made right then, shows in the move list.
 * Bytes are what crossed the network (compressed size) until the first move.
 * The repeat visit reloads in the same profile; the offline check then cuts the network and reloads again.
 */
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const url = process.env.PLAYABLE_URL || 'http://127.0.0.1:5189/';
const argv = process.argv.slice(2);
const arg = (name, dflt) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : dflt; };
const runs = +arg('--runs', 3);
const outFile = arg('--out', null);
const NET = { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 0.75e6 / 8 };
const CPU = 4;
const log = (...a) => { if (process.env.DEBUG) console.error(new Date().toISOString().slice(11, 19), ...a); };

const browser = await chromium.launch({ headless: true, channel: process.env.PLAYABLE_BROWSER });

/** Waits for the board, plays e2-e4 and returns times (ms since navigation start) and bytes. */
async function measureVisit(page, net, look) {
  const errors = [];
  const onError = e => errors.push(String(e.message ?? e));
  page.on('pageerror', onError);
  net.bytes = 0; net.requests = 0;
  const t0 = Date.now();
  log(look, 'goto');
  await page.goto(url, { waitUntil: 'commit' });
  await page.waitForFunction(() => window.view && document.getElementById('asset-status')?.textContent !== 'Loading pieces…', null, { timeout: 180000, polling: 50 });
  log(look, 'board drawn');
  const readyAt = await page.evaluate(async () => { await window.view.ready(); return performance.now(); });
  const bytesAtReady = net.bytes;
  log(look, 'ready', bytesAtReady);
  const at = sq => page.evaluate(sq => window.view.screenOf(sq), sq);
  const e2 = await at(12), e4 = await at(28);
  // Tap the pawn, give the selection a moment to register (as a player would), tap its target;
  // retry while the page is still too busy to take the taps.
  for (let attempt = 0; ; attempt++) {
    await page.mouse.click(e2.x, e2.y); await page.waitForTimeout(300); await page.mouse.click(e4.x, e4.y);
    try { await page.waitForFunction(() => /e2-e4/.test(document.getElementById('moves')?.textContent ?? ''), null, { timeout: 5000, polling: 50 }); break; }
    catch (e) { log(look, 'move retry', attempt); if (attempt >= 10) throw e; }
  }
  const moveAt = await page.evaluate(() => performance.now());
  const actualLook = await page.evaluate(() => document.getElementById('look').value);
  if (actualLook !== look) throw new Error(`expected the ${look} look, got ${actualLook}`);
  page.off('pageerror', onError);
  return { look, boardReadyMs: Math.round(readyAt), firstMoveMs: Math.round(moveAt), bytesAtReady, bytesAtMove: net.bytes, requests: net.requests, wallMs: Date.now() - t0, errors };
}

async function freshPage(look) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: false });
  await context.addInitScript(look => {
    try { if (!localStorage.getItem('kingdown.look')) localStorage.setItem('kingdown.look', look); } catch { /* storage blocked */ }
  }, look);
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  const net = { bytes: 0, requests: 0 };
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', NET);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
  cdp.on('Network.loadingFinished', e => { net.bytes += e.encodedDataLength; net.requests++; });
  return { context, page, cdp, net };
}

const median = xs => [...xs].sort((a, b) => a - b)[xs.length >> 1];
const results = { url, network: '1.6 Mbps down, 750 kbps up, 150 ms RTT', cpu: `${CPU}x slowdown`, viewport: '390x844', runs, looks: {} };

for (const look of ['painted', 'clay']) {
  const cold = [];
  let repeat = null, offline = null;
  for (let r = 0; r < runs; r++) {
    const { context, page, cdp, net } = await freshPage(look);
    cold.push(await measureVisit(page, net, look));
    if (r === runs - 1) {
      // Repeat visit in the same profile: what a returning player sees.
      repeat = await measureVisit(page, net, look);
      // Offline: give a service worker a moment to finish caching, then cut the network and reload.
      // (A page with no service worker never becomes "ready", so wait at most 20 s.)
      log(look, 'offline check');
      await page.evaluate(() => Promise.race([
        navigator.serviceWorker?.ready.then(() => new Promise(r => setTimeout(r, 3000))),
        new Promise(r => setTimeout(r, 20000)),
      ])).catch(() => {});
      await context.setOffline(true);
      await cdp.send('Network.emulateNetworkConditions', { ...NET, offline: true });
      try { offline = { ok: true, ...await measureVisit(page, net, look) }; }
      catch (e) { offline = { ok: false, error: String(e.message ?? e).split('\n')[0] }; }
    }
    await context.close();
  }
  results.looks[look] = {
    cold,
    median: {
      boardReadyMs: median(cold.map(c => c.boardReadyMs)),
      firstMoveMs: median(cold.map(c => c.firstMoveMs)),
      bytesAtMove: median(cold.map(c => c.bytesAtMove)),
    },
    repeat, offline,
  };
  const m = results.looks[look].median;
  console.log(`${look}: board ready ${(m.boardReadyMs / 1000).toFixed(1)} s, first move ${(m.firstMoveMs / 1000).toFixed(1)} s, `
    + `${(m.bytesAtMove / 1e6).toFixed(2)} MB transferred (median of ${runs}); `
    + `repeat visit ${(repeat.boardReadyMs / 1000).toFixed(1)} s, ${(repeat.bytesAtMove / 1e6).toFixed(2)} MB; `
    + `offline reload ${offline.ok ? `ok, board in ${(offline.boardReadyMs / 1000).toFixed(1)} s` : `FAILED (${offline.error})`}`);
  for (const c of [...cold, repeat]) if (c.errors.length) console.log(`  page errors: ${c.errors.join(' | ')}`);
}

await browser.close();
if (outFile) writeFileSync(outFile, JSON.stringify(results, null, 2) + '\n');
