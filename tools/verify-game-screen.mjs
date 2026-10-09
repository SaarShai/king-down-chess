// The fixed table at the four W2 sizes, through real board input.
import assert from 'node:assert/strict';
import { recordBoardText, boardText } from './board-ink-check.mjs';
import { usePower, startLesson, contextWordsInView, endTurn, openMoves } from './app-ui.mjs';
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
    await recordBoardText(page);
    await page.goto(env('PLAYABLE_URL')); await page.waitForFunction(() => window.view?.ready); await page.evaluate(() => window.view.ready());
    const boxes = () => page.evaluate(() => ['board', 'undo', 'menu-btn', 'end-turn'].filter(id => document.getElementById(id)).map(id => ({ id, ...document.getElementById(id).getBoundingClientRect().toJSON() })));
    const rest = await boxes();
    const fixedRows = () => page.evaluate(() => ['strip-them', 'strip-me', 'context-line', 'moves-line', 'table-bar'].map(id => ({ id, ...document.getElementById(id).getBoundingClientRect().toJSON() })));
    const restRows = await fixedRows();
    const stripsClear = async state => {
      const layout = await page.evaluate(() => {
        const box = id => document.getElementById(id).getBoundingClientRect().toJSON();
        return { board: box('board'), strips: ['strip-them', 'strip-me'].map(box) };
      });
      assert.ok(layout.strips.every(strip => strip.right <= layout.board.left || strip.left >= layout.board.right || strip.bottom <= layout.board.top || strip.top >= layout.board.bottom), `${width}×${height}: both player strips clear the board at ${state}: ${JSON.stringify(layout)}`);
    };
    await stripsClear('rest');
    if (width === 320) {
      const canvas = await page.locator('#board canvas').boundingBox();
      assert.ok(canvas.width >= 290, `short phone board: ${canvas.width.toFixed(2)} px`);
      assert.equal(restRows.find(row => row.id === 'moves-line').height, 44);
    }
    if (width === 320 || width === 390) {
      const file = await boardText(page, 'a'), rank = await boardText(page, '8');
      assert.ok(file.size >= 11.99 && rank.size >= 11.99, 'board labels draw at 12 CSS px');
      assert.ok(file.bottom <= file.height - 1, 'file letters clear the canvas edge');
    }
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
    await same('review'); await stripsClear('review');
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
    await startLesson(page);
    await visibleWords(page, 'marked enemy pawn');
    assert.ok((await page.locator('#context-text > span').first().innerText()).split(/\s+/).length <= 8, 'the first lesson sentence has at most eight words');
    assert.equal(await page.locator('#lesson-progress .now').first().getAttribute('aria-label'), 'Lesson 1 of 6 current', 'lesson progress names its current state');
    assert.ok(await page.evaluate(() => [...document.querySelectorAll('#context-text > span')].every(row => row.scrollHeight <= row.clientHeight + 1)), 'the whole lesson task fits');
    await tap(27); await tap(45);
    await page.waitForFunction(() => document.getElementById('context-text').textContent.includes('Archer learned.'));
    await visibleWords(page, 'Archer learned.');
    await stripsClear('lesson done');
    assert.deepEqual(await fixedRows(), restRows, `${width}×${height}: strips, context, Moves and bar stay fixed with the lesson words`);
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
  const opened = async (save, query = '', width = 390, height = 844) => {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
    await context.addInitScript(save => { sessionStorage.setItem('kingdown.title-seen', '1'); localStorage.setItem('kingdown.save', JSON.stringify({ sound: false, pace: 'off', white: 'human', black: 'human', ...save })); }, save);
    const page = await context.newPage(); trapErrors(page);
    await recordBoardText(page);
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
    await usePower(page);
    assert.ok((await page.locator('#context-text > span').first().innerText()).split(/\s+/).length <= 8, 'the armed power instruction has at most eight words');
    const p = await page.evaluate(() => window.view.screenOf(35)); await page.mouse.click(p.x, p.y);
    assert.equal(await page.locator('#last-move .pi-b').count(), 1, 'Freeze names the black knight');
    assert.equal(await page.locator('#moves [data-ply="1"] .pi-b').count(), 1, 'the Freeze row names the black knight');
    await endTurn(page);
    assert.equal(await page.locator('#last-move').innerText(), 'White ends the turn after the mark.');
    await context.close();
  }
  {
    const { page, context } = await opened({ back: '', fen: '7k/8/2a5/8/2P5/8/8/K7 w - - 0 1', moves: [] }, '', 320, 568);
    const p = await page.evaluate(() => window.view.screenOf(42)); await page.mouse.click(p.x, p.y);
    assert.equal(await page.locator('#context-text > span').nth(1).innerText(), 'Shoots 2 squares straight or diagonally forward.');
    assert.ok(await page.locator('#context-text').evaluate(el => {
      const area = document.getElementById('context-line').getBoundingClientRect();
      return el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1
        && [...el.children].every(row => {
          const range = document.createRange(); range.selectNodeContents(row);
          return row.scrollHeight <= row.clientHeight + 1 && row.scrollWidth <= row.clientWidth + 1
            && [...range.getClientRects()].every(r => r.bottom <= area.bottom && r.top >= area.top);
        });
    }), 'the Archer rule is whole at 320x568, with no ellipsis or cut glyphs');
    await context.close();
  }
  {
    const { page, context } = await opened({ back: '', fen: '4k3/p7/8/3n4/8/8/P7/4K3 w - - 0 1', moves: [] }, '?kings=frost:freeze,none', 320, 568);
    const ringClear = async () => {
      const spill = await page.locator('#power-w').evaluate(coin => {
        const style = getComputedStyle(coin), box = coin.getBoundingClientRect();
        let ring = style.outlineStyle === 'none' ? 0 : Math.max(0, parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset));
        for (const shadow of style.boxShadow.match(/(?:inset\s+)?rgba?\([^)]*\)\s+[^,]+/g) ?? []) {
          if (shadow.includes('inset')) continue;
          const [x, y, blur = 0, spread = 0] = shadow.replace(/rgba?\([^)]*\)/, '').trim().split(/\s+/).map(parseFloat);
          ring = Math.max(ring, Math.abs(x) + blur + spread, Math.abs(y) + blur + spread);
        }
        const board = document.getElementById('board').getBoundingClientRect(), strip = coin.closest('.player-strip').getBoundingClientRect();
        return { ring, top: box.top - ring, bottom: box.bottom + ring, board: board.bottom, stripTop: strip.top, stripBottom: strip.bottom };
      });
      assert.ok(spill.top >= spill.board && spill.top >= spill.stripTop && spill.bottom <= spill.stripBottom, `320x568: the coin grown by its ring clears the board and stays in its strip: ${JSON.stringify(spill)}`);
    };
    await usePower(page); await ringClear();
    await page.click('#power-cancel'); await page.click('#power-w'); await ringClear();
    await context.close();
  }
  assertNoErrors();
} finally { await browser.close(); }
