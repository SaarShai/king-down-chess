// The fixed table at the four W2 sizes, through real board input.
import assert from 'node:assert/strict';
import { contextWordsInView, endTurn, openMoves, pressMenu } from './app-ui.mjs';
import { assertNoErrors, env, insideViewport, launch, minTarget, noSidewaysScroll, shot, trapErrors } from './lib/checks.mjs';
const browser = await launch();
const visibleWords = async (page, words) => assert.ok(await contextWordsInView(page, words), `the drawn context shows ${words}`);
const FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1';
try {
  for (const [width, height, touch] of [[320, 568, true], [390, 844, true], [844, 390, true], [1440, 900, false]]) {
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
    await tap(28); await visibleWords(page, 'Moves 1 square forward');
    await openMoves(page); await same('Moves open');
    assert.equal(await page.locator('#moves [data-ply] .pi').count(), 1);
    await page.locator('#moves [data-ply="1"]').click();
    assert.equal(await page.locator('#back-to-game').isVisible(), true, 'the last row stays in Review');
    assert.equal(await page.locator('#context-text > span').first().innerText(), 'Review. Move 1, White.', 'Review uses the Moves list number and side');
    await page.click('#back-to-game');
    await endTurn(page); await tap(52); await tap(36); await endTurn(page);
    await openMoves(page); await page.locator('#moves [data-ply="1"]').click();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#back-to-game').isVisible(), true, 'ArrowRight to the last ply stays in Review');
    await tap(6);
    assert.equal(await page.locator('#context-text').getAttribute('data-rank'), 'review', 'a read at the last ply stays in Review');
    assert.equal(JSON.parse(await page.evaluate(() => localStorage.getItem('kingdown.save'))).moves.length, 2);
    await page.click('#back-to-game');
    await tap(3); await tap(39); await endTurn(page); await tap(57); await tap(42); await endTurn(page); await tap(5); await tap(26); await endTurn(page); await tap(62); await tap(45); await endTurn(page); await tap(39); await tap(53);
    await page.waitForFunction(() => window.view.marks?.check === 60);
    await same('check');
    const red = await page.evaluate(() => [...document.querySelectorAll('#game-table button')].filter(b => b.checkVisibility() && getComputedStyle(b).backgroundColor === 'rgb(132, 44, 33)').length);
    assert.ok(red <= 1, 'one crimson control at most');
    assert.equal(await page.locator('#undo').getAttribute('aria-disabled') !== null, true);
    await shot(page, `table-${width}x${height}`);
    console.log(`ok game-screen ${width}×${height}: fixed board and bar, targets, Moves, check, no sideways scroll`);
    await pressMenu(page, 'Guide'); await page.click('#learn');
    await visibleWords(page, 'marked enemy pawn');
    assert.ok((await page.locator('#context-text > span').first().innerText()).split(/\s+/).length <= 8, 'the first lesson sentence has at most eight words');
    assert.equal(await page.locator('#lesson-progress .now').first().getAttribute('aria-label'), 'Lesson 1 of 6 current', 'lesson progress names its current state');
    assert.ok(await page.evaluate(() => [...document.querySelectorAll('#context-text > span')].every(row => row.scrollHeight <= row.clientHeight + 1)), 'the whole lesson task fits');
    await tap(27); await tap(36);
    await page.waitForFunction(() => document.getElementById('context-text').textContent.includes('Well done.'));
    await visibleWords(page, 'Well done.');
    await visibleWords(page, 'An archer never captures');
    await visibleWords(page, 'also over other pieces.');
    assert.equal(await page.locator('#lesson-progress .done').first().getAttribute('aria-label'), 'Lesson 1 of 6 done', 'lesson progress names its done state');
    assert.ok(await page.evaluate(() => document.getElementById('context-text').getBoundingClientRect().bottom <= document.getElementById('moves-line').getBoundingClientRect().top), 'the lesson words do not cover Moves');
    if (width === 844) {
      const tile = await page.evaluate(() => window.view.screenOf(1).x - window.view.screenOf(0).x);
      assert.ok(tile >= 40, `landscape squares: ${tile.toFixed(2)} px`);
      console.log(`ok landscape square ${tile.toFixed(2)} px`);
    }
    await minTarget(page, '#next-lesson, #return-game');
    await context.close();
  }
  const opened = async (save, query = '') => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    await context.addInitScript(save => { sessionStorage.setItem('kingdown.title-seen', '1'); localStorage.setItem('kingdown.save', JSON.stringify({ sound: false, pace: 'off', white: 'human', black: 'human', ...save })); }, save);
    const page = await context.newPage(); trapErrors(page);
    await page.goto(new URL(query, env('PLAYABLE_URL')).href); await page.waitForFunction(() => window.view?.ready); await page.evaluate(() => window.view.ready());
    return { page, context };
  };
  {
    const { page, context } = await opened({ back: 'RNBQKBNR', fen: '', moves: ['e2-e4'], link: 0 });
    await visibleWords(page, "Wait for your friend's link.");
    await context.close();
  }
  {
    const { page, context } = await opened({ back: '', fen: '4k3/p7/8/3n4/8/8/P7/4K3 w - - 0 1', moves: [] }, '?kings=frost:freeze,none');
    await page.click('#power-btn');
    assert.ok((await page.locator('#context-text > span').first().innerText()).split(/\s+/).length <= 8, 'the armed power instruction has at most eight words');
    const p = await page.evaluate(() => window.view.screenOf(35)); await page.mouse.click(p.x, p.y);
    assert.equal(await page.locator('#last-move .pi-b').count(), 1, 'Freeze names the black knight');
    assert.equal(await page.locator('#moves [data-ply="1"] .pi-b').count(), 1, 'the Freeze row names the black knight');
    await endTurn(page);
    assert.equal(await page.locator('#last-move').innerText(), 'White ends the turn after the mark.');
    await context.close();
  }
  assertNoErrors();
} finally { await browser.close(); }
