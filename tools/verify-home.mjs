// Five Home cases use the live board and the same controls as play.
import assert from 'node:assert/strict';
import { arriveContinue, contextText, endTurn, lanMoves, waitForUi } from './app-ui.mjs';
import { assertNoErrors, env, launch, trapErrors } from './lib/checks.mjs';
const browser = await launch();
const SAVE = { back: 'RNBQKBNR', fen: '', moves: ['e2-e4', 'e7-e5'], white: 'human', black: 'ai', skill: 'club', sound: false, pace: 'off' };
const MATE = { ...SAVE, moves: ['f2-f3', 'e7-e5', 'g2-g4', 'Qd8-h4'], black: 'human' };
async function open(save = SAVE, query = '', viewport = { width: 390, height: 844 }) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  await context.addInitScript(save => { localStorage.setItem('kingdown.save', JSON.stringify(save)); }, save);
  const page = await context.newPage(); trapErrors(page);
  await page.goto(new URL(query, env('PLAYABLE_URL')).href);
  await page.waitForFunction(() => window.view?.ready); await page.evaluate(() => window.view.ready());
  await page.waitForFunction(() => window.home);
  return { page, context };
}
async function tap(page, square) {
  const p = await page.evaluate(s => window.view.screenOf(s), square);
  await page.mouse.click(p.x, p.y);
}
try {
  {
    const { page, context } = await open();
    assert.equal(await page.locator('#home-head').isVisible(), true, 'Home shows for a save');
    assert.equal(await page.locator('#home-progress').innerText(), 'Move 2');
    assert.equal(await page.locator('#home-opponent').innerText(), 'vs Computer · Club');
    assert.equal(await page.locator('#home-main .label').innerText(), 'Continue');
    assert.equal(await page.locator('#last-move').innerText(), 'Black pawn e7 to e5.');
    assert.deepEqual(await lanMoves(page), SAVE.moves);
    await page.click('#home-new');
    assert.equal(await page.locator('#new-game-warn').isVisible(), true, 'New game keeps the existing warning');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#home-head').isVisible(), true, 'Cancel returns to Home');
    await page.click('#home-today');
    assert.equal(await page.locator('#army').inputValue(), 'daily', 'Today chooses the daily army in the same sheet');
    await page.keyboard.press('Escape');
    await context.close();
    const ended = await open(MATE);
    assert.equal(await ended.page.locator('#home-main .label').innerText(), 'Rematch');
    assert.equal(await ended.page.locator('#home-progress').innerText(), 'Finished');
    assert.equal(await ended.page.locator('#home-result').innerText(), 'Black wins by checkmate');
    assert.equal(await ended.page.locator('#over').isVisible(), false, 'a finished save opens no result dialog');
    await ended.page.click('#home-review');
    assert.equal(await ended.page.locator('#back-to-game').isVisible(), true, 'Review opens the saved game');
    await ended.context.close();
    const rematch = await open({ ...MATE, black: 'ai' });
    assert.equal(await rematch.page.locator('#home-detail').innerText(), 'Same army. You play Black.');
    await rematch.page.click('#home-main');
    await waitForUi(rematch.page, ui => ui.lan.length === 1, null, { timeout: 15000 });
    const next = await rematch.page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.save')));
    assert.equal(next.back, MATE.back, 'Rematch keeps the army');
    assert.deepEqual([next.white, next.black], ['ai', 'human'], 'Rematch swaps your side');
    await rematch.context.close();
    console.log('ok home: the saved board, move number and last move; New game, Today, finished game and Rematch');
  }
  {
    const { page, context } = await open({ ...SAVE, moves: ['e2-e4'], skill: 'beginner' }, '?think=50');
    await page.waitForTimeout(1500);
    assert.deepEqual(await lanMoves(page), ['e2-e4'], 'the computer waits on Home');
    await arriveContinue(page).click();
    await waitForUi(page, ui => ui.lan.length === 2, null, { timeout: 15000 });
    await context.close();
    console.log('ok home: the computer waits for Continue, then moves');
  }
  {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
      const { page, context } = await open({ ...SAVE, black: 'human' }, '', viewport);
      const before = await page.locator('#board').boundingBox();
      await arriveContinue(page).click();
      assert.deepEqual(await page.locator('#board').boundingBox(), before, 'Continue moves the board by 0 px');
      assert.deepEqual(await lanMoves(page), SAVE.moves, 'Continue keeps the saved plies');
      await page.evaluate(() => window.home.open());
      await tap(page, 6);
      assert.equal(await page.locator('#home-head').isVisible(), false, 'a board tap enters play');
      assert.match(await contextText(page), /White knight/, 'the same tap selects your piece');
      await tap(page, 21);
      assert.deepEqual(await lanMoves(page), [...SAVE.moves, 'Ng1-f3']);
      await page.reload(); await page.waitForFunction(() => window.view?.ready);
      assert.equal(await page.locator('#home-head').isVisible(), false, 'Home shows once in a tab');
      await context.close();
    }
    console.log('ok home: Continue keeps the board in place at both sizes; a board tap selects your piece');
  }
  {
    for (const stagedMate of [false, true]) {
      const save = stagedMate ? { ...SAVE, back: '', fen: '7k/8/5KQ1/8/8/8/8/8 w - - 0 1', moves: [], black: 'human' } : { ...SAVE, black: 'human' };
      const { page, context } = await open(save, '?title=0');
      await tap(page, stagedMate ? 46 : 6); await tap(page, stagedMate ? 54 : 21);
      const plies = await lanMoves(page);
      await page.evaluate(() => window.home.open());
      assert.equal(await page.locator('#home-detail').innerText(), 'Your turn is ready');
      assert.equal(await page.locator('#home-main .label').innerText(), 'Continue', 'a staged end is not finished');
      await arriveContinue(page).click();
      assert.deepEqual(await lanMoves(page), plies, 'Continue keeps the staged turn');
      assert.equal(await page.locator('#undo').getAttribute('aria-disabled'), 'false');
      await page.click('#undo');
      assert.deepEqual(await lanMoves(page), save.moves, 'Undo takes back the staged turn');
      await context.close();
    }
    console.log('ok home: a staged turn and staged mate show Your turn is ready; Continue keeps plies and Undo');
  }
  {
    for (const query of ['?army=RNBQKBNR&moves=e2-e4&side=1', '?army=RNBQKBNR', '?fen=4k3/8/8/8/8/8/P7/4K3%20w%20-%20-%200%201', '?design=invalid']) {
      const { page, context } = await open(SAVE, query);
      assert.equal(await page.locator('#home-head').isVisible(), false, 'a link or position URL skips Home');
      assert.equal(await page.locator('#title-screen').isVisible(), false, 'a link skips the first deal');
      await context.close();
    }
    console.log('ok home: links, army, position and design URLs skip Home');
  }
  assertNoErrors();
} finally { await browser.close(); }
