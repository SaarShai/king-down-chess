// The character clips in the game's painted look (docs/2d-first-pieces/clips/clips.mjs).
// Run: npm run check:browser character-clips (it builds and serves the app; the settings are in tools/lib/checks.mjs).
// Checks: a selected Knight (lance tap) and Rook (slam, crack and heal) of each army play their clip once, through
// every drawing, and end on the still figure; with reduced motion or Animations Off no clip shows. A page-side
// recorder reads the scene each animation frame, so a slow browser call cannot miss a short clip. Then, with the
// page's clock under the check's control, it saves each clip's key drawings (PLAYABLE_OUT) and a short video.
import assert from 'node:assert/strict';
import { endTurn } from './app-ui.mjs';
import { assertNoErrors, env, launch, shot, trapErrors } from './lib/checks.mjs';
import { CLIPS } from '../docs/2d-first-pieces/clips/clips.mjs';

const url = new URL(env('PLAYABLE_URL'));
url.searchParams.set('players', 'human,human');
// White Knight b1, Rook h1; Black Knight g8, Rook a8.
const FEN = 'r3k1n1/8/8/8/8/8/8/1N2K2R w - - 0 1';
const browser = await launch();
// Ends when both clip sheets finish loading.
const sheets = page => Promise.all(['tap', 'slam'].map(name =>
  page.waitForEvent('requestfinished', { predicate: request => new URL(request.url()).pathname.includes('/' + name + '-') })));
const pace = (page, value) => page.evaluate(v => { const s = document.getElementById('pace'); s.value = v; s.dispatchEvent(new Event('change')); }, value);
async function open(options = {}, { clock = false, fen = FEN } = {}) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, ...options });
  const clipRequests = [];
  context.on('request', request => { if (/\/(?:tap|slam)-[\w-]+\.webp$/.test(new URL(request.url()).pathname)) clipRequests.push(request.url()); });
  const page = await context.newPage();
  trapErrors(page);
  const clipsLoaded = options.reducedMotion !== 'reduce' && sheets(page);
  await page.addInitScript(() => {
    sessionStorage.setItem('kingdown.title-seen', '1');
    // The clip each drawn frame showed: [name, drawing] or null, with the frame's time.
    window.clipLog = [];
    const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = fn => raf(t => { fn(t); const c = window.view?.scene?.clip; window.clipLog.push([t, c && [c.name, c.frame]]); });
  });
  if (clock) await page.clock.install();
  const u = new URL(url); u.searchParams.set('fen', fen);
  await page.goto(u.href);
  if (clock) await page.clock.runFor(2000);
  await page.waitForFunction(() => window.view?.scene && document.getElementById('asset-status')?.textContent === '');
  await page.evaluate(() => window.view.ready());
  // Board readiness excludes clips. Clip playback checks wait for the optional sheets.
  if (clipsLoaded) {
    await clipsLoaded;
    if (clock) await page.clock.runFor(32);
    else await page.evaluate(() => new Promise(requestAnimationFrame));
  }
  return { context, page, clipRequests };
}
// A copy of the canvas pixels near the figure on `sq` (key: its name), and how much of two copies differs.
const grab = (page, sq, key) => page.evaluate(([sq, key]) => {
  const c = document.querySelector('#board canvas'), r = c.getBoundingClientRect(), p = window.view.screenOf(sq), k = c.width / r.width;
  const x = Math.round((p.x - r.left - 60) * k), y = Math.round((p.y - r.top - 140) * k), w = Math.round(120 * k), d = c.getContext('2d').getImageData(x, y, w, Math.round(180 * k)).data;
  // Chrome 155 returns stray colours outside the canvas (the top-row figures reach above it); count them as blank.
  for (let i = 0; i < d.length; i += 4) { const px = x + i / 4 % w, py = y + Math.floor(i / 4 / w); if (px < 0 || py < 0 || px >= c.width || py >= c.height) d.fill(0, i, i + 4); }
  (window.snaps ??= {})[key] = d;
}, [sq, key]);
const diff = (page, a, b) => page.evaluate(([a, b]) => {
  // The share of pixels (%) whose colour differs by more than 48 in a channel.
  const A = window.snaps[a], B = window.snaps[b]; let n = 0;
  for (let i = 0; i < A.length; i += 4) if (Math.max(Math.abs(A[i] - B[i]), Math.abs(A[i + 1] - B[i + 1]), Math.abs(A[i + 2] - B[i + 2])) > 48) n++;
  return n / (A.length / 4) * 100;
}, [a, b]);
const select = async (page, sq) => { const p = await page.evaluate(s => window.view.screenOf(s), sq); await page.mouse.click(p.x, p.y); };
// Shares (%) of changed pixels near the figure (part 3). Measured: rest 1.8–2.1 (Knight), 0.2–0.6 (Rook: the board
// sheet is his rest drawing); raised 1.2–1.5 (Knight), 6.3–7.3 (Rook). With the atlas draw removed, raised is 0 and rest 2.6–9.9.
const LIMITS = { knight: { rest: 3, raised: .6 }, rook: { rest: 2, raised: 3 } };
const RAISED = { knight: 8, rook: 8 };
const SQUARES = { knight: [1, 62], rook: [7, 56] };
// Ends when the selected figure's clip has played and the scene has drawn its still figure after it.
async function played(page, sq) {
  await page.evaluate(() => { window.clipLog.length = 0; });
  await select(page, sq);
  await page.waitForFunction(() => { const l = window.clipLog, i = l.findIndex(e => e[1]); return i >= 0 && l.slice(i).some(e => !e[1]); }, null, { timeout: 8000 });
  await page.waitForTimeout(1500); // it must not start again
  return page.evaluate(() => window.clipLog);
}
try {
  // 1. Motion on: each clip plays once, for each army (Black's figures are selectable in a two-player game after White moves).
  {
    const { context, page } = await open();
    for (const side of [0, 1]) {
      if (side) {
        // White moves (Ke1-d1), so Black's figures are selectable.
        await select(page, 4); await select(page, 3);
        await page.waitForFunction(() => !window.view.scene.animating);
        await endTurn(page);
        await page.waitForFunction(() => window.view.scene.position.turn === 1, null, { timeout: 8000 });
      }
      for (const [name, squares] of Object.entries(SQUARES)) {
        const log = await played(page, squares[side]), c = CLIPS[name];
        const shown = log.filter(e => e[1]), first = log.findIndex(e => e[1]), last = log.findLastIndex(e => e[1]);
        assert.ok(shown.every(e => e[1][0] === name), `${name}: only his clip plays`);
        assert.ok(log.slice(first, last + 1).every(e => e[1]), `${name}: the clip plays without a break`);
        // (A slow browser may skip drawings here; part 3 checks every drawing on a controlled clock.)
        const drawings = new Set(shown.map(e => e[1][1]));
        assert.equal(shown[0][1][1], c.sequence[0], `${name}: starts on his first drawing`);
        const ms = log[last][0] - log[first][0];
        assert.ok(ms > c.duration * .85 && ms < c.duration * 1.3, `${name}: plays for about ${c.duration} ms (${Math.round(ms)})`);
        assert.ok(log.slice(last + 1).length > 0 && log.slice(last + 1).every(e => !e[1]), `${name}: plays once, then the still figure shows`);
        console.log(`ok ${['Ivory', 'Charcoal'][side]} ${name}: ${drawings.size} drawings in ${Math.round(ms)} ms, then still`);
        await select(page, squares[side]); // clear the selection
      }
    }
    await context.close();
  }
  // 2. Reduced motion, then Animations Off: no clip shows; the selected figure is still at once.
  for (const [label, options, off] of [['reduced motion', { reducedMotion: 'reduce' }, false], ['Animations Off', {}, true]]) {
    const { context, page, clipRequests } = await open(options);
    if (off) await pace(page, 'off');
    for (const [name, [sq]] of Object.entries(SQUARES)) {
      await page.evaluate(() => { window.clipLog.length = 0; });
      await select(page, sq); await page.waitForTimeout(2500);
      const log = await page.evaluate(() => window.clipLog);
      assert.ok(log.every(e => !e[1]), `${label}: no ${name} clip`);
      assert.equal(await page.evaluate(() => window.view.scene.clip), null);
      await select(page, sq);
    }
    console.log(`ok ${label}: no clip, the still figure shows at once`);
    if (options.reducedMotion === 'reduce') {
      await page.evaluate(() => navigator.serviceWorker.ready);
      assert.equal(clipRequests.length, 0, 'reduced motion: board and offline install request no clips');
    }
    await context.close();
  }
  // 3. On a stopped clock, for each army: every drawing shows in order; the canvas shows the painted drawings (pixels
  // near the figure: the clip's rest drawing stands where the still figure stands, its raised drawing differs from
  // it); the key drawings are saved for the owner. The scene is selected directly, so no move markers cover the figure.
  for (const side of [0, 1]) {
    const { context, page } = await open({ viewport: { width: 900, height: 900 }, deviceScaleFactor: 2 }, { clock: true, fen: side ? FEN.replace(' w ', ' b ') : FEN });
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
    for (const [name, squares] of Object.entries(SQUARES)) {
      const sq = squares[side], c = CLIPS[name], keys = name === 'knight' ? [0, 250, 375, 540, 700] : [0, 300, 450, 560, 900, 1400, 1900];
      await grab(page, sq, 'before');
      await page.evaluate(s => window.view.scene.setSelected(s), sq);
      const seen = [], grabbed = {};
      for (let t = 0; t < c.duration + 300; t += 1000 / 60) {
        await page.clock.runFor(1000 / 60);
        const clip = await page.evaluate(() => window.view.scene.clip);
        seen.push(clip ? clip.frame : null);
        // The raised drawing (lance up; stone arm overhead), then the rest drawing that ends the clip.
        if (clip?.frame === RAISED[name] && !grabbed.raised) { grabbed.raised = true; await grab(page, sq, 'raised'); }
        if (clip?.frame === c.sequence[0] && grabbed.raised && !grabbed.rest) { grabbed.rest = true; await grab(page, sq, 'rest'); }
        const key = keys.find(k => k <= t && k > t - 1000 / 60);
        if (key !== undefined) {
          const p = await page.evaluate(s => window.view.screenOf(s), sq);
          await shot(page, `${['ivory', 'charcoal'][side]}-${name}-${String(key).padStart(4, '0')}ms`, { clip: { x: p.x - 90, y: p.y - 150, width: 180, height: 190 } });
        }
      }
      const played = seen.filter(f => f !== null);
      assert.deepEqual(new Set(played), new Set(c.sequence), `${name}: every drawing shows`);
      assert.deepEqual([...new Set(played)], [...new Set(c.sequence)], `${name}: the drawings show in order`);
      assert.equal(seen.at(-1), null, `${name}: ended on the stopped clock`);
      const rest = await diff(page, 'rest', 'before'), raised = await diff(page, 'raised', 'rest');
      console.log(`ok ${['Ivory', 'Charcoal'][side]} ${name}: ${played.length} ticks; ${rest.toFixed(1)}% of pixels near him differ between the rest drawing and the still figure, ${raised.toFixed(1)}% between the raised and the rest drawing`);
      assert.ok(rest < LIMITS[name].rest, `${name}: the rest drawing stands where the still figure stands (${rest.toFixed(1)})`);
      assert.ok(raised > LIMITS[name].raised, `${name}: the raised drawing differs from the rest drawing on the board (${raised.toFixed(1)})`);
      await page.evaluate(() => window.view.scene.setSelected(null));
    }
    await context.close();
  }
  // 4. A video of both clips at normal speed.
  {
    const video = await browser.newContext({ viewport: { width: 900, height: 900 }, recordVideo: { dir: env('PLAYABLE_OUT'), size: { width: 900, height: 900 } } });
    const page2 = await video.newPage();
    await page2.addInitScript(() => sessionStorage.setItem('kingdown.title-seen', '1'));
    const u = new URL(url); u.searchParams.set('fen', FEN);
    const clipsLoaded = sheets(page2);
    await page2.goto(u.href);
    await page2.waitForFunction(() => window.view?.scene && document.getElementById('asset-status')?.textContent === '');
    await page2.evaluate(() => window.view.ready()); await clipsLoaded; await page2.evaluate(() => new Promise(requestAnimationFrame));
    for (const sq of [1, 7, 1, 7]) { await select(page2, sq); await page2.waitForTimeout(sq === 1 ? 1300 : 2600); await select(page2, sq); await page2.waitForTimeout(400); }
    await video.close();
    console.log(`ok key drawings and video in ${env('PLAYABLE_OUT')}`);
  }
  assertNoErrors();
  console.log('ok character clips');
} finally {
  await browser.close();
}
