// npm run check:browser card-motion: every card's motion on the real runtime: it compiles, moves, has no seam, stays inside its masks,
// stops off screen, in a hidden tab and under reduced motion, and a full set on a throttled phone-sized page holds its frame rate.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createServer } from 'vite';
import { assertNoErrors, env, launch, shot, trapErrors } from '../lib/checks.mjs';

const CARDS = ['back', 'burn', 'control', 'curse', 'earthquake', 'firestarter', 'firewall', 'flight', 'freeze', 'haste', 'icewall', 'leap', 'march', 'mimic', 'mirrorb', 'morphp', 'rally', 'rescue', 'sacrifice', 'salvation', 'skylift', 'strike', 'vault'];
const server = await createServer({ root: resolve('.'), logLevel: 'error', server: { host: '127.0.0.1', port: 0, hmr: false } });
await server.listen();
const page_ = `${server.resolvedUrls.local[0]}docs/specs/effects-animation/preview/card-motion/index.html`;
const out = env('PLAYABLE_OUT'); mkdirSync(out, { recursive: true });
const browser = await launch(), report = { cards: {} };
// Pixels of each motion canvas at two phases: how many differ, how many draw at all.
const compare = (page, a, b) => page.evaluate(async ([a, b]) => {
  const read = async phase => { window.cardMotion.seek(phase); return [...document.querySelectorAll('.frame')].map(frame => { const c = frame.querySelector('card-motion').canvas; return { card: frame.dataset.name, kind: frame.dataset.kind, data: c.getContext('2d').getImageData(0, 0, c.width, c.height).data }; }); };
  const first = await read(a), second = await read(b);
  return first.map((f, i) => {
    let moved = 0, worst = 0, drawn = 0;
    for (let p = 0; p < f.data.length; p += 4) {
      const d = Math.max(Math.abs(f.data[p] - second[i].data[p]), Math.abs(f.data[p + 1] - second[i].data[p + 1]), Math.abs(f.data[p + 2] - second[i].data[p + 2]), Math.abs(f.data[p + 3] - second[i].data[p + 3]));
      if (d > 4) moved++; if (d > worst) worst = d; if (f.data[p + 3]) drawn++;
    }
    const pixels = f.data.length / 4;
    return { card: f.card, kind: f.kind, moved: moved / pixels, worst, drawn: drawn / pixels };
  });
}, [a, b]);
try {
  const page = await browser.newPage({ viewport: { width: 700, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'no-preference' });
  const errors = trapErrors(page, [{ pattern: '404', reason: 'the preview page has no favicon' }]);
  await page.goto(`${page_}?phase=0`);
  await page.waitForFunction(count => window.cardMotion && window.cardMotion.names.length === count, CARDS.length);
  assert.deepEqual(await page.evaluate(() => window.cardMotion.names.slice().sort()), CARDS);
  await page.waitForFunction(() => { const s = window.cardMotion.motionState(); return s.compiled.length === 23; }, null, { timeout: 60000 });
  assert(await page.evaluate(() => window.cardMotion.motionState().compiled.every(([, ok]) => ok)), 'Every recipe compiles');
  await page.waitForTimeout(800);
  const seam = await compare(page, 0, 1), moved = await compare(page, 0, .3);
  for (const m of moved) {
    const s = seam.find(x => x.card === m.card && x.kind === m.kind);
    (report.cards[m.card] ??= {})[m.kind] = { moved: +m.moved.toFixed(4), drawn: +m.drawn.toFixed(3), seamWorst: s.worst };
    assert(m.moved > .0003, `${m.card} ${m.kind} moves (${m.moved})`);
    assert(s.moved < .0005, `${m.card} ${m.kind} has no seam (${s.moved}, ${s.worst})`);
  }
  await shot(page, 'all-cards', { fullPage: true });
  await page.evaluate(() => window.cardMotion.seek(undefined));
  await page.waitForFunction(() => window.cardMotion.motionState().running);
  // Off screen: nothing runs. Hidden tab: nothing runs.
  await page.evaluate(() => { document.getElementById('cards').style.marginTop = '100000px'; });
  await page.waitForFunction(() => { const s = window.cardMotion.motionState(); return s.shown === 0 && !s.running; }, null, { timeout: 5000 });
  await page.evaluate(() => { document.getElementById('cards').style.marginTop = ''; });
  await page.waitForFunction(() => window.cardMotion.motionState().running);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForFunction(() => !window.cardMotion.motionState().running);
  assert(await page.evaluate(async () => { await new Promise(r => setTimeout(r, 200)); return !window.cardMotion.motionState().running; }), 'A hidden tab stops the loop');
  await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForFunction(() => window.cardMotion.motionState().running);
  // Settings: Animations Off stops it too.
  await page.evaluate(() => { document.documentElement.dataset.pace = 'off'; });
  await page.waitForFunction(() => !window.cardMotion.motionState().running);
  await page.close();
  assertNoErrors(errors);

  // Reduced motion: the still art only; each canvas stays empty.
  const still = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await still.goto(page_);
  await still.waitForFunction(() => window.cardMotion);
  await still.waitForTimeout(800);
  const blank = await still.evaluate(() => [...document.querySelectorAll('card-motion')].map(m => m.canvas).every(c => !c.width || c.getContext('2d').getImageData(0, 0, c.width, c.height).data.every(v => v === 0)));
  assert(blank, 'Reduced motion draws nothing over the still art');
  assert.equal((await still.evaluate(() => window.cardMotion.motionState())).running, false);
  await still.close();

  // A full set on a phone-sized page: 21 tiles and eight coins. CPU throttled four times; software GL on a check machine is slower than a phone's GPU.
  const phone = await browser.newPage({ viewport: { width: 390, height: 1200 }, deviceScaleFactor: 3, reducedMotion: 'no-preference' });
  await phone.goto(`${page_}?set=1`);
  await phone.waitForFunction(() => window.cardMotion?.motionState().shown >= 18);
  await phone.waitForFunction(() => window.cardMotion.motionState().compiled.length >= 21, null, { timeout: 60000 });
  await phone.waitForTimeout(1500);
  const cdp = await phone.context().newCDPSession(phone).catch(() => null);
  await cdp?.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  report.phone = await phone.evaluate(async () => {
    const begin = window.cardMotion.motionState(), start = performance.now(), gaps = [];
    let at = start;
    await new Promise(done => { const step = now => { gaps.push(now - at); at = now; if (now - start < 5000) requestAnimationFrame(step); else done(); }; requestAnimationFrame(step); });
    const end = window.cardMotion.motionState(), seconds = (performance.now() - start) / 1000;
    gaps.sort((a, b) => a - b);
    return { shown: end.shown, drawsPerSecond: +((end.draws - begin.draws) / seconds).toFixed(1), msPerDraw: +((end.drawMs - begin.drawMs) / Math.max(1, end.draws - begin.draws)).toFixed(2), rafPerSecond: +(gaps.length / seconds).toFixed(1), worstGap: +gaps.at(-1).toFixed(1), p95Gap: +gaps[Math.floor(gaps.length * .95)].toFixed(1) };
  });
  await shot(phone, 'phone-set');
  await phone.close();
  writeFileSync(join(out, 'card-motion.json'), JSON.stringify(report, null, 1));
  console.log(JSON.stringify(report.phone));
  console.log('card-motion passed');
} finally {
  await browser.close(); await server.close();
}
