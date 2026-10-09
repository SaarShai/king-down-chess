// The fixed table at the three W2 sizes, through real board input.
import assert from 'node:assert/strict';
import { endTurn, openMoves } from './app-ui.mjs';
import { assertNoErrors, env, insideViewport, launch, minTarget, noSidewaysScroll, shot, trapErrors } from './lib/checks.mjs';
const browser = await launch();
const FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1';
try {
  for (const [width, height, touch] of [[390, 844, true], [844, 390, true], [1440, 900, false]]) {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: touch, isMobile: touch, reducedMotion: 'reduce' });
    await context.addInitScript(fen => {
      sessionStorage.setItem('kingdown.title-seen', '1');
      localStorage.setItem('kingdown.save', JSON.stringify({ fen, back: 'RNBQKBNR', moves: [], white: 'human', black: 'human', pace: 'off', sound: false }));
    }, FEN);
    const page = await context.newPage(); trapErrors(page);
    await page.goto(env('PLAYABLE_URL')); await page.waitForFunction(() => window.view?.ready); await page.evaluate(() => window.view.ready());
    const boxes = () => page.evaluate(() => ['board', 'undo', 'menu-btn', 'end-turn'].filter(id => document.getElementById(id)).map(id => ({ id, ...document.getElementById(id).getBoundingClientRect().toJSON() })));
    const rest = await boxes();
    const same = async state => assert.deepEqual(await boxes(), rest, `${width}×${height}: the table stays fixed at ${state}`);
    const tap = async square => { const p = await page.evaluate(s => window.view.screenOf(s), square); await (touch ? page.touchscreen.tap(p.x, p.y) : page.mouse.click(p.x, p.y)); };
    if (width === 390) {
      const tile = await page.evaluate(() => window.view.screenOf(1).x - window.view.screenOf(0).x);
      assert.ok(tile >= 44.3, `phone squares: ${tile.toFixed(2)} px`);
    }
    await noSidewaysScroll(page); await insideViewport(page, '#board, #undo, #menu-btn');
    if (touch) await minTarget(page, '#undo, #menu-btn, #moves-line');
    await tap(12); await same('selected'); await tap(28);
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('kingdown.save')).moves.length === 1);
    await same('staged turn');
    await openMoves(page); await same('Moves open');
    assert.equal(await page.locator('#moves [data-ply] .pi').count(), 1);
    await page.keyboard.press('Escape');
    await endTurn(page); await tap(52); await tap(36); await endTurn(page); await tap(3); await tap(39); await endTurn(page); await tap(57); await tap(42); await endTurn(page); await tap(5); await tap(26); await endTurn(page); await tap(62); await tap(45); await endTurn(page); await tap(39); await tap(53);
    await page.waitForFunction(() => window.view.marks?.check === 60);
    await same('check');
    const red = await page.evaluate(() => [...document.querySelectorAll('#game-table button')].filter(b => b.checkVisibility() && getComputedStyle(b).backgroundColor === 'rgb(132, 44, 33)').length);
    assert.ok(red <= 1, 'one crimson control at most');
    assert.equal(await page.locator('#undo').getAttribute('aria-disabled') !== null, true);
    await shot(page, `table-${width}x${height}`);
    console.log(`ok game-screen ${width}×${height}: fixed board and bar, targets, Moves, check, no sideways scroll`);
    await context.close();
  }
  assertNoErrors();
} finally { await browser.close(); }
