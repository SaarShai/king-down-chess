// W5: the check marks at landing, staged words, and Undo through real board input.
import assert from 'node:assert/strict';
import { contextText, contextWordsInView, endTurn, lanMoves } from './app-ui.mjs';
import { assertNoErrors, env, launch, trapErrors } from './lib/checks.mjs';

const browser = await launch();
const fen = '4k3/8/8/8/8/8/7r/4K3 b - - 0 1';
const checker = [{ sq: 7, king: 4, path: 'straight' }];
try {
  for (const [width, height, touch] of [[390, 844, true], [1440, 900, false]]) {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: touch, isMobile: touch });
    await context.addInitScript(() => {
      sessionStorage.setItem('kingdown.title-seen', '1');
      localStorage.removeItem('kingdown.save');
    });
    const page = await context.newPage(); trapErrors(page);
    const open = async () => {
      await page.goto(new URL(`?fen=${encodeURIComponent(fen)}&players=human,human`, env('PLAYABLE_URL')).href);
      await page.waitForFunction(() => window.view?.ready);
      await page.evaluate(() => window.view.ready());
    };
    const tap = async square => {
      const p = await page.evaluate(s => window.view.screenOf(s), square);
      await (touch ? page.touchscreen.tap(p.x, p.y) : page.mouse.click(p.x, p.y));
    };
    const land = () => page.waitForFunction(() => !window.view.scene.animating && window.view.marks.check === 4);
    const marks = () => page.evaluate(() => ({ check: window.view.marks.check, checkers: window.view.marks.checkers }));

    await open(); await tap(15); await tap(7);
    await page.waitForFunction(() => window.view.scene.animating);
    assert.deepEqual(await marks(), { check: null, checkers: [] }, 'no check line during the move');
    assert.equal(await page.locator('#board').evaluate(b => b.classList.contains('king-in-check')), false);
    await land();
    assert.deepEqual(await marks(), { check: 4, checkers: checker }, 'landing shows the ring and cause line');
    assert.equal(await page.locator('#board').evaluate(b => b.classList.contains('king-in-check')), true);
    await endTurn(page);
    assert.equal(await contextText(page), "Check! White to move.\nBlack's rook attacks the white king.");
    assert.ok(await contextWordsInView(page, "Black's rook attacks the white king."), 'the cause fits its row');
    await tap(4);
    assert.deepEqual(await marks(), { check: 4, checkers: checker }, 'selection keeps the check marks');
    console.log(`ok their-turn ${width}×${height}: ring and line at landing; cause after the press`);

    await open(); await tap(15); await tap(7); await land();
    assert.equal(await contextText(page), "Check. Black's turn is ready. Tap End turn.");
    assert.equal(await page.locator('#context-text').getAttribute('data-rank'), 'waiting');
    assert.equal(await page.locator('#end-turn').getAttribute('aria-disabled'), 'false');
    console.log(`ok their-turn ${width}×${height}: staged check keeps the turn words`);

    await page.click('#undo');
    assert.deepEqual(await lanMoves(page), []);
    assert.deepEqual(await marks(), { check: null, checkers: [] }, 'Undo clears the ring and cause line');
    assert.equal(await page.locator('#board').evaluate(b => b.classList.contains('king-in-check')), false);
    assert.equal(await contextText(page), 'Black to move.');
    console.log(`ok their-turn ${width}×${height}: Undo clears the check`);
    await context.close();
  }
  for (const mode of ['computer', 'link']) for (const viewer of [0, 1]) for (const turn of [0, 1]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    const save = { back: '', fen: turn === 0 ? '7k/8/p7/8/8/8/8/4K2r w - - 0 1' : '4k2R/8/8/8/8/P7/8/7K b - - 0 1', moves: [],
      white: mode === 'computer' && viewer === 1 ? 'ai' : 'human', black: mode === 'computer' && viewer === 0 ? 'ai' : 'human',
      ...(mode === 'link' ? { link: viewer } : {}), sound: false, pace: 'off' };
    await context.addInitScript(save => {
      sessionStorage.setItem('kingdown.title-seen', '1');
      localStorage.setItem('kingdown.save', JSON.stringify(save));
      Worker.prototype.postMessage = () => {};
    }, save);
    const page = await context.newPage(); trapErrors(page);
    await page.goto(env('PLAYABLE_URL')); await page.waitForFunction(() => window.view?.ready); await page.evaluate(() => window.view.ready());
    const cause = viewer === turn ? 'Their rook attacks your king.' : 'Your rook attacks their king.';
    assert.ok((await contextText(page)).includes(cause), `${mode}, viewer ${viewer}, checked side ${turn}: ${cause}`);
    assert.equal(await page.evaluate(() => window.view.marks.check), turn === 0 ? 4 : 60, 'the checked king keeps its ring while the computer thinks');
    assert.equal(await page.evaluate(() => window.view.marks.checkers.length), 1, 'the board keeps the check cause');
    if (viewer !== turn) assert.ok(!(await contextText(page)).includes('Your move.'), 'their checked king does not make it your move');
    await context.close();
  }
  assertNoErrors();
} finally { await browser.close(); }
