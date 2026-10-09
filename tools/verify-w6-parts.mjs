// Phase 1 parts use the real painted board, with no W1 or W2 calls.
import assert from 'node:assert/strict';
import { build, preview } from 'vite';
import { copyFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { assertNoErrors, launch, shot, minTarget, noSidewaysScroll, trapErrors } from './lib/checks.mjs';

const out = await mkdtemp(join(tmpdir(), 'kingdown-w6-'));
let server, browser, page;
try {
  await build({ configFile: false, root: process.cwd(), publicDir: resolve('public'), build: { outDir: out, emptyOutDir: true, rolldownOptions: { input: resolve('tools/w6-parts.html') } } });
  server = await preview({ configFile: false, root: process.cwd(), publicDir: false, build: { outDir: out }, preview: { host: '127.0.0.1', port: 0 } });
  browser = await launch();
  page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  trapErrors(page);
  await page.addInitScript(() => {
    let time = 1e6, queue = [];
    performance.now = () => time;
    window.requestAnimationFrame = fn => { queue.push(fn); return queue.length; };
    window.step = ms => { time += ms; const due = queue; queue = []; due.forEach(fn => fn(time)); };
  });
  await page.goto(`${server.resolvedUrls.local[0]}tools/w6-parts.html`);
  // State waits use wall time; only step() advances the scene clock.
  console.log('check harness ready');
  await page.waitForFunction(() => window.parts, null, { polling: 20 });

  // A captured piece returns at the end of the backward move.
  const reverse = await page.evaluate(async () => {
    const { view, fromFen, makeMove, parseSq } = window.parts;
    const pre = fromFen('7k/8/8/8/8/r7/8/R6K w - - 0 1');
    const move = { from: parseSq('a1'), to: parseSq('a3'), captures: [parseSq('a3')] };
    const post = makeMove(pre, move);
    view.sync(post);
    const playing = view.animateBack(pre, move, post);
    const during = view.scene.animating;
    window.step(10000);
    await playing;
    window.step(16);
    return { during, ended: !view.scene.animating, board: Array.from(view.scene.position.board), before: Array.from(pre.board) };
  });
  assert.equal(reverse.during, true, 'the capture rewinds');
  assert.equal(reverse.ended, true, 'the rewind ends');
  assert.deepEqual(reverse.board, reverse.before, 'the taken piece returns');
  console.log('ok rewind: capture restores the board and ends');
  // The opt-in lift changes pixels, then returns to the same rest frame.
  await page.evaluate(() => { const { view } = window.parts; view.scene.setLively({ moves: false, atmosphere: false }); view.scene.redraw(); });
  await page.evaluate(() => window.step(16));
  const rest = await page.locator('canvas').evaluate(c => c.toDataURL());
  await page.evaluate(() => window.parts.view.setLifted(window.parts.parseSq('a1')));
  await page.evaluate(() => window.step(16));
  const lifted = await page.locator('canvas').evaluate(c => c.toDataURL());
  assert.notEqual(lifted, rest, 'the tell lifts the figure');
  await page.evaluate(() => window.parts.view.setLifted(null));
  await page.evaluate(() => window.step(16));
  assert.equal(await page.locator('canvas').evaluate(c => c.toDataURL()), rest, 'the figure returns to rest');
  console.log('ok tell: opt-in lift and clear');
  // Swaps and shoves also restore the whole board; other kinds sync at once.
  const reverseCases = await page.evaluate(async () => {
    const { view, fromFen, makeMove, parseSq } = window.parts;
    const sq = parseSq;
    const cases = [
      ['swap', '7k/8/8/8/8/8/8/MN5K w - - 0 1', { from: sq('a1'), to: sq('b1'), captures: [], swap: true }, true],
      ['shove', '7k/8/8/8/8/r7/8/O6K w - - 0 1', { from: sq('a1'), to: sq('a3'), captures: [], shove: { from: sq('a3'), to: sq('a4') } }, true],
      ['shot', '7k/8/8/8/8/r7/8/A6K w - - 0 1', { from: sq('a1'), to: sq('a1'), captures: [sq('a3')] }, false],
      ['promotion', '7k/P7/8/8/8/8/8/7K w - - 0 1', { from: sq('a7'), to: sq('a8'), captures: [], promo: 5 }, false],
      ['pass', '7k/8/8/8/8/8/8/R6K w - - 0 1', { from: 0, to: 0, captures: [], pass: true }, false],
      ['removed Paladin', '7k/8/8/8/8/r7/8/L6K w - - 0 1', { from: 0, to: sq('a3'), captures: [sq('a3')], selfRemove: true }, false],
      ['Freeze', '7k/8/8/8/8/r7/8/R6K w - - 0 1', { from: sq('a3'), to: sq('a3'), captures: [], power: 'freeze' }, false],
    ];
    const results = [];
    for (const [name, fen, move, expectedMotion] of cases) {
      const pre = fromFen(fen), post = makeMove(pre, move);
      const pending = view.animateBack(pre, move, post);
      const animated = view.scene.animating;
      window.step(10000); await pending; window.step(16);
      results.push({ name, animated, expectedMotion, ended: !view.scene.animating, board: Array.from(view.scene.position.board), before: Array.from(pre.board) });
    }
    return results;
  });
  for (const r of reverseCases) {
    assert.equal(r.animated, r.expectedMotion, `${r.name}: rewind path`);
    assert.equal(r.ended, true, `${r.name}: no move animation remains`);
    assert.deepEqual(r.board, r.before, `${r.name}: original board`);
  }
  console.log('ok rewind: swap, shove, shot, promotion, pass, removed Paladin and Freeze');

  const motion = await page.evaluate(async () => {
    const { view, fromFen } = window.parts;
    const pre = fromFen('7k/8/8/8/8/8/8/R6K w - - 0 1');
    const move = { from: 0, to: 8, captures: [] };
    view.sync(pre);
    const normal = view.animateMove(pre, move);
    window.step(420); const normalEnd = !view.scene.animating; await normal;
    view.sync(pre);
    const slow = view.animateMove(pre, move, undefined, 0.5);
    window.step(420); const slowMid = view.scene.animating;
    window.step(420); const slowEnd = !view.scene.animating; await slow;
    view.sync(pre); view.setPace('off'); view.setLifted(0);
    const off = view.scene.lifted === null;
    view.setPace('normal'); view.setLifted(0); view.sync(pre);
    const cleared = view.scene.lifted === null;
    const stale = view.animateBack(pre, move, window.parts.makeMove(pre, move));
    const fresh = fromFen('7k/8/8/8/8/8/8/6K1 w - - 0 1');
    view.sync(fresh); await stale;
    return { normalEnd, slowMid, slowEnd, off, cleared, fresh: Array.from(fresh.board), board: Array.from(view.scene.position.board) };
  });
  assert.equal(motion.normalEnd, true, 'normal speed ends at 420 ms');
  assert.equal(motion.slowMid, true, 'half speed still runs at 420 ms');
  assert.equal(motion.slowEnd, true, 'half speed ends at 840 ms');
  assert.equal(motion.off, true, 'Off has no tell');
  assert.equal(motion.cleared, true, 'a new position clears the tell');
  assert.deepEqual(motion.board, motion.fresh, 'a cancelled rewind does not replace a new game');
  console.log('ok playback speed: 0.5 doubles the duration; Off and new positions clear the tell');

  // The final blow skips a trailing pass; no search makes these three review tiles.
  await page.evaluate(() => {
    const { view, fromFen, makeMove, parseSq, startCeremony, board, moments } = window.parts;
    let pos = fromFen('7k/6pp/8/8/8/r7/8/R5MK w - - 0 1');
    const sq = parseSq, history = [];
    const moves = [
      { from: sq('a1'), to: sq('a3'), captures: [sq('a3')] },
      { from: sq('h8'), to: sq('g8'), captures: [] },
      { from: sq('g1'), to: sq('h1'), captures: [], swap: true },
      { from: sq('g8'), to: sq('h8'), captures: [] },
      { from: sq('a3'), to: sq('a8'), captures: [], power: 'haste' },
      { from: 0, to: 0, captures: [], pass: true },
    ];
    for (const move of moves) { history.push({ pos, move, lan: 'test' }); pos = makeMove(pos, move); }
    window.parts.fixture = { view, board, moments, history, final: pos, king: sq('h8'), showPly: ply => { window.reviewPly = ply; }, motion: true, live: () => true };
    view.scene.setLively({ moves: false, atmosphere: false, kings: false, pawns: false, idle: false });
    view.sync(pos);
    window.control = startCeremony(window.parts.fixture);
  });
  console.log('check Ceremony replay');
  await page.waitForFunction(() => window.parts.view.scene.animating, null, { polling: 20 });
  assert.equal(await page.evaluate(() => window.parts.view.scene.animating), true, 'the final blow replays');
  await page.evaluate(() => window.step(840));
  await page.evaluate(() => window.control.done);
  await page.evaluate(() => window.step(1200));
  assert.equal(await page.locator('.kd-words').textContent(), 'King Down');
  assert.equal(await page.locator('.ceremony-tile').count(), 3, 'three review tiles');
  assert.deepEqual(await page.locator('.ceremony-tile').evaluateAll(bs => bs.map(b => +b.dataset.ply)), [4, 0, 2], 'final blow and the winner’s special moves');
  await page.locator('.ceremony-tile').nth(1).click();
  assert.equal(await page.evaluate(() => window.reviewPly), 0, 'the tile opens its review ply');
  await minTarget(page, '.ceremony-tile');
  await noSidewaysScroll(page);
  await page.locator('.ceremony-tile').evaluateAll(bs => bs.forEach(b => b.getAnimations().forEach(a => a.finish())));
  const fallen = await page.locator('canvas').evaluate(c => c.toDataURL());
  await page.evaluate(() => { window.parts.view.setFallen(null); window.step(16); });
  assert.notEqual(await page.locator('canvas').evaluate(c => c.toDataURL()), fallen, 'the end frame draws the fallen king');
  await page.evaluate(() => { window.parts.view.setFallen(window.parts.fixture.king, false); window.step(16); });
  assert.equal(await page.locator('canvas').evaluate(c => c.toDataURL()), fallen, 'the skip frame draws the same fallen king');
  const samples = join(tmpdir(), 'kingdown-w6-phase1');
  await mkdir(samples, { recursive: true });
  await copyFile(await shot(page, 'ceremony-phone'), join(samples, 'ceremony-phone.png'));
  await page.setViewportSize({ width: 1440, height: 900 });
  await copyFile(await shot(page, 'ceremony-desktop'), join(samples, 'ceremony-desktop.png'));
  console.log(`samples: ${samples}`);
  console.log('ok Ceremony: half-speed blow, King Down, three tiles and review');

  for (const key of ['Escape', 'Space', 'Enter']) {
    await page.evaluate(() => { window.control.cancel(); window.control = window.parts.startCeremony(window.parts.fixture); });
    await page.keyboard.press(key);
    assert.equal(await page.evaluate(() => window.control.done), true, `${key}: skips to the end`);
    assert.equal(await page.locator('.ceremony-tile').count(), 3, `${key}: tiles ready`);
    assert.equal(await page.evaluate(() => window.parts.view.scene.animating), false, `${key}: no move runs`);
  }
  await page.evaluate(() => { window.control.cancel(); window.control = window.parts.startCeremony(window.parts.fixture); window.control.cancel(); });
  assert.equal(await page.evaluate(() => window.control.done), false, 'a new game cancels the sequence');
  assert.equal(await page.locator('.kd-words').count(), 0, 'a cancelled sequence leaves no words');
  await page.evaluate(() => { window.control = window.parts.startCeremony({ ...window.parts.fixture, motion: false }); });
  assert.equal(await page.evaluate(() => window.control.done), true, 'Off shows the end frame at once');
  assert.equal(await page.evaluate(() => window.parts.view.scene.animating), false, 'Off plays no replay');
  await page.evaluate(() => {
    window.control.cancel();
    const f = window.parts.fixture;
    const frozen = { ...f.history[0], move: { from: window.parts.parseSq('a3'), to: window.parts.parseSq('a3'), captures: [], power: 'freeze' } };
    window.control = window.parts.startCeremony({ ...f, history: [frozen, f.history[4]], motion: false });
  });
  assert.equal(await page.locator('.ceremony-tile').nth(1).locator('span').textContent(), 'White Freeze', 'Freeze names the acting power');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => { window.control.cancel(); window.control = window.parts.startCeremony(window.parts.fixture); });
  assert.equal(await page.evaluate(() => window.control.done), true, 'reduced motion shows the end frame at once');
  assert.equal(await page.evaluate(() => window.parts.view.scene.animating), false, 'reduced motion plays no replay');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const staleEnd = await page.evaluate(async () => {
    window.control.cancel();
    let live = true;
    const { view, fromFen, startCeremony } = window.parts;
    const old = startCeremony({ ...window.parts.fixture, live: () => live });
    live = false;
    const fresh = fromFen('7k/8/8/8/8/8/8/R6K w - - 0 1');
    view.sync(fresh);
    view.scene.setLively({ moves: false, atmosphere: false, kings: false, pawns: false, idle: false });
    const move = view.animateMove(fresh, { from: 0, to: 8, captures: [] });
    old.cancel();
    const stillPlaying = view.scene.animating;
    window.step(420); await move;
    return { stillPlaying, completed: await old.done };
  });
  assert.equal(staleEnd.stillPlaying, true, 'a stale Ceremony does not stop a new move');
  assert.equal(staleEnd.completed, false, 'a stale Ceremony does not open the result');
  const skippedReset = await page.evaluate(async () => {
    let live = true;
    const old = window.parts.startCeremony({ ...window.parts.fixture, live: () => live });
    old.skip(); live = false; old.cancel();
    return old.done;
  });
  assert.equal(skippedReset, false, 'a new game after a skip does not open the old result');
  console.log('ok Ceremony: each skip key, cancellation, stale game and Off');
  assertNoErrors();
} catch (error) {
  if (page) assertNoErrors();
  throw error;
} finally {
  await browser?.close();
  await new Promise(resolve => server ? server.httpServer.close(resolve) : resolve());
  await rm(out, { recursive: true, force: true });
}
