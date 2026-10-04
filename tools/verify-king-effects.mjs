// The kings' idle effects in the game's painted look (docs/2d-first-pieces/board/king-effects.mjs).
// Needs a running build: PLAYABLE_URL=http://127.0.0.1:5205/ PLAYABLE_BROWSER=chromium node tools/verify-king-effects.mjs
// Checks: a default game shows Spirit's and Shadow's effects at about 30 frames a second and its 16 pawns
// rest (now and then one acts); with Animations Off or reduced motion nothing extra is drawn and the
// board stops redrawing; a hidden tab stops the loop and a visible one starts it again; the king that
// falls (King Down) loses his effect; a king's capture plays his own death for the victim, half as long
// at Fast, not at all at Off. Then it measures the main-thread time of a frame with the kings' effects
// and the 16 resting pawns, at desktop size and on a 390 px phone.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const url = new URL(process.env.PLAYABLE_URL || 'http://127.0.0.1:5189/');
url.searchParams.set('players', 'human,human');
url.searchParams.set('army', 'RNBQKBNR'); // the chess army: 16 pawns
const browser = await chromium.launch({ headless: true, channel: process.env.PLAYABLE_BROWSER || 'chrome' });
const errors = [];
const wait = ms => new Promise(r => setTimeout(r, ms));
async function open(page, fen) {
  const u = new URL(url); if (fen) u.searchParams.set('fen', fen);
  await page.goto(u.href);
  await page.waitForFunction(() => window.view?.scene && document.getElementById('asset-status')?.textContent === '');
  await page.evaluate(() => window.view.ready());
  await wait(1200); // the effects on a king's square grow in
}
const effects = page => page.evaluate(() => window.view.scene.effects.slice().sort());
const pawns = page => page.evaluate(() => window.view.scene.pawns);
// Waits for the last frame to have drawn this many effects (a setting reaches the board within a frame or two).
const drawn = (page, n) => page.waitForFunction(n => window.view.scene.effects.length === n, n, { timeout: 5000 });
const frames = page => page.evaluate(() => window.view.scene.frames);
const pixels = page => page.evaluate(() => document.querySelector('#board canvas').toDataURL());
const pace = (page, value) => page.evaluate(v => { const s = document.getElementById('pace'); s.value = v; s.dispatchEvent(new Event('change')); }, value);
const framesIn = async (page, ms) => { const f = await frames(page); await wait(ms); return await frames(page) - f; };
async function newPage(options) {
  const page = await browser.newPage(options);
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.addInitScript(() => {
    sessionStorage.setItem('kingdown.title-seen', '1');
    // Main-thread time of each animation frame (the board draws inside it).
    const raf = window.requestAnimationFrame.bind(window);
    window.__frameMs = [];
    window.requestAnimationFrame = cb => raf(t => { const a = performance.now(); cb(t); window.__frameMs.push(performance.now() - a); });
  });
  return page;
}
try {
  const page = await newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await page.goto(url.href); await page.evaluate(() => localStorage.clear());
  await open(page);

  // 1. A game without powers: Spirit (White) and Shadow (Black), both effects, about 30 frames a second.
  assert.deepEqual(await effects(page), ['shadow', 'spirit']);
  const fps = await framesIn(page, 2000) / 2;
  assert.ok(fps >= 12 && fps <= 40, `idle effects redraw at ~30 fps (got ${fps})`);
  const a = await pixels(page); await wait(400);
  assert.notEqual(await pixels(page), a, 'the effects move');
  assert.equal((await pawns(page)).resting, 16, 'the 16 pawns rest');
  let acted = 0; for (let i = 0; i < 40 && !acted; i++) { acted = (await pawns(page)).acting; await wait(100); }
  assert.ok(acted > 0, 'a resting pawn acts within 4 s');
  console.log(`ok default game: Spirit and Shadow effects at ${fps.toFixed(1)} fps; 16 pawns resting, ${acted} acting`);

  // 2. Animations Off: no effect is drawn (the board equals one drawn with the effects switched off), no redraw loop.
  await pace(page, 'off'); await drawn(page, 0);
  assert.deepEqual(await effects(page), []);
  assert.equal((await pawns(page)).resting, 0, 'Animations Off: the pawns stand still');
  assert.ok(await framesIn(page, 1000) <= 1, 'Animations Off: the board stops redrawing');
  const off = await pixels(page);
  await pace(page, 'normal'); await page.evaluate(() => window.view.scene.setLively({ kings: false, pawns: false })); await wait(200);
  assert.equal(await pixels(page), off, 'Animations Off draws nothing extra');
  await pace(page, 'normal'); await drawn(page, 2);
  assert.deepEqual(await effects(page), ['shadow', 'spirit']);
  console.log('ok Animations Off: nothing extra drawn, no redraw loop; Normal brings the effects back');

  // 3. Reduced motion: the same.
  await page.emulateMedia({ reducedMotion: 'reduce' }); await drawn(page, 0);
  assert.deepEqual(await effects(page), []);
  assert.equal((await pawns(page)).resting, 0, 'reduced motion: the pawns stand still');
  assert.ok(await framesIn(page, 1000) <= 1, 'reduced motion: no redraw loop');
  await page.emulateMedia({ reducedMotion: 'no-preference' }); await drawn(page, 2);
  assert.deepEqual(await effects(page), ['shadow', 'spirit']);
  console.log('ok reduced motion: no effects, no redraw loop');

  // 4. A hidden tab stops the loop; a visible one starts it again.
  const visibility = hidden => page.evaluate(h => {
    if (h) { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); }
    else { delete document.hidden; delete document.visibilityState; }
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);
  await visibility(true); await wait(150);
  const hiddenFrames = await framesIn(page, 1500);
  assert.ok(hiddenFrames <= 1, `hidden tab: the loop stops (${hiddenFrames} frames in 1.5 s)`);
  await visibility(false);
  const back = await framesIn(page, 1000);
  assert.ok(back >= 10, `visible again: the loop runs (${back} frames in 1 s)`);
  console.log(`ok hidden tab: ${hiddenFrames} frames in 1.5 s; visible again: ${back} frames in 1 s`);

  // 5. King Down: Ra1-a8 mates; the Shadow king falls and his effect goes with him; Spirit's stays.
  await open(page, '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1');
  assert.deepEqual(await effects(page), ['shadow', 'spirit']);
  const rook = await page.evaluate(() => window.view.screenOf(0)), mate = await page.evaluate(() => window.view.screenOf(56));
  await page.mouse.click(rook.x, rook.y); await page.mouse.click(mate.x, mate.y);
  await page.waitForFunction(() => document.getElementById('over').open, null, { timeout: 10000 });
  await wait(900);
  assert.deepEqual(await effects(page), ['spirit'], 'the fallen king has no effect');
  await page.click('#over button[value="close"]');
  console.log('ok King Down: the fallen king\'s effect stops, the winner\'s stays');

  // 6. A king's move: his effect follows him and his square's effects grow back there.
  await open(page, '4k3/p7/8/8/8/8/P7/4K3 w - - 0 1'); // pawns, or two bare kings are a draw at once
  const from = await page.evaluate(() => window.view.screenOf(4)), to = await page.evaluate(() => window.view.screenOf(12));
  await page.mouse.click(from.x, from.y); await page.mouse.click(to.x, to.y);
  await page.waitForFunction(() => !window.view.scene.animating && window.view.scene.position.board[12] !== 0, null, { timeout: 5000 });
  await wait(1000);
  assert.deepEqual(await effects(page), ['shadow', 'spirit']);
  console.log('ok a king\'s move keeps both effects');

  // 6a. A king's capture: Spirit takes a pawn with his own death for it (the silhouette implodes); Fast
  // plays it in half the time, Off not at all.
  async function capture(paceValue) {
    await open(page, '4k3/8/8/4p3/4K3/8/8/7R w - - 0 1');
    await pace(page, paceValue);
    const from = await page.evaluate(() => window.view.screenOf(28)), to = await page.evaluate(() => window.view.screenOf(36));
    await page.mouse.click(from.x, from.y);
    const timing = page.evaluate(() => new Promise(done => {
      let start = null, kind = null;
      const look = () => { const s = window.view.scene; if (s.animating && start == null) { start = performance.now(); kind = s.playing; }
        if (start != null && !s.animating) return done({ ms: performance.now() - start, kind });
        if (start == null && window.view.scene.position.board[36] && window.view.scene.position.board[28] === 0) return done({ ms: 0, kind: null });
        requestAnimationFrame(look); };
      look();
    }));
    await page.mouse.click(to.x, to.y);
    return timing;
  }
  const normal = await capture('normal'), fast = await capture('fast'), none = await capture('off');
  assert.equal(normal.kind, 'blow'); assert.ok(normal.ms > 1450 && normal.ms < 2100, `normal ${normal.ms}`);
  assert.ok(fast.ms > 650 && fast.ms < 1150, `fast ${fast.ms}`); assert.equal(none.kind, null);
  await pace(page, 'normal');
  console.log(`ok king captures: normal ${Math.round(normal.ms)} ms, fast ${Math.round(fast.ms)} ms, off none`);

  // 7. Frame cost: main-thread ms per frame of the start position (16 pawns), the still board redrawn each
  // frame against each pair of kings with the resting pawns.
  // every: redraw every display frame (as during a move), so a frame that cost too much would show as lost frames.
  async function measure(p, kings, every = false) {
    return p.evaluate(async ([kings, every]) => {
      const s = window.view.scene, pause = ms => new Promise(r => setTimeout(r, ms));
      s.setLively({ kings: !!kings, pawns: !!kings }); if (kings) s.setKings(kings);
      await pause(1200);
      window.__frameMs.length = 0; const f0 = s.frames, t0 = performance.now();
      if (every) s.keepAwake(4000);
      let acting = 0, looks = 0; const look = setInterval(() => { acting += s.pawns.acting; looks++; }, 50);
      await pause(4000); clearInterval(look);
      const ms = [...window.__frameMs].sort((x, y) => x - y), n = s.frames - f0;
      return { fps: n / ((performance.now() - t0) / 1000), mean: ms.reduce((x, y) => x + y, 0) / ms.length, p95: ms[Math.floor(ms.length * .95)], max: ms.at(-1), acting: acting / looks, effects: s.effects };
    }, [kings, every]);
  }
  const report = [];
  const phone = await newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  for (const [name, p] of [['desktop 1440×900 @2x', page], ['phone 390×844 @3x', phone]]) {
    await open(p, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1');
    assert.equal((await pawns(p)).resting, 16, `${name}: the start position's 16 pawns rest`);
    for (const [kings, every] of [[null, true], [['spirit', 'shadow']], [['flame', 'frost']], [['mud', 'stratus']], [['flame', 'frost'], true]]) {
      const r = await measure(p, kings, every);
      if (kings) assert.deepEqual([...r.effects].sort(), [...kings].sort());
      report.push(`${name} ${kings ? `${kings.join('+')} and 16 resting pawns (${r.acting.toFixed(1)} acting on average)` : 'no effects, pawns still'}${every ? ', redrawn every display frame' : ''}: ${r.mean.toFixed(2)} ms mean, ${r.p95.toFixed(2)} ms p95, ${r.max.toFixed(2)} ms max, ${r.fps.toFixed(1)} fps`);
    }
  }
  console.log(report.map(l => `  ${l}`).join('\n'));
} finally { await browser.close(); }
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('ok all king-effect checks');
