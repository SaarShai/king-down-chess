// D-3: in review, the piece card, the keyboard cursor and the captured rows read the viewed move;
// back at the live move they read the live game again.
import assert from 'node:assert/strict';
import { menuItem, moveRow, openMenu, openMoves, waitForUi } from '../app-ui.mjs';

// White takes on d5 at ply 3. Review at ply 2 shows the white pawn on e4 and the black pawn on d5.
const save = { back: 'RNBQKBNR', fen: '', moves: ['e2-e4', 'd7-d5', 'e4xd5', 'Ng8-f6'], white: 'human', black: 'ai', sound: false, skill: 'club' };
const E4 = 28, D5 = 35;
const turn = (page, re) => page.waitForFunction(re => new RegExp(re).test(document.getElementById('turn').textContent), re.source);

export default async function ({ open }) {
  for (const size of ['desktop', 'phone']) {
    const { page, tap, close } = await open({ size, save });
    const took = () => page.$$eval('#took-w .took, #took-b .took', s => s.length);
    const card = async sq => {
      const p = await page.evaluate(s => window.view.screenOf(s), sq);
      await page.mouse.move(p.x, p.y);
      return page.textContent('#info');
    };
    const say = () => page.textContent('#cursor-say');

    assert.equal(await took(), 1, `${size}: the live game shows the one captured pawn`);
    await openMoves(page); await moveRow(page, 2).click();
    await turn(page, /^Reviewing after 1… d7-d5/);
    assert.equal(await took(), 0, `${size}: review before the capture shows no captured piece`);

    if (size === 'desktop') {
      assert.match(await card(D5), /Black pawn/, 'review: the card of d5 reads the viewed board');
      assert.match(await card(E4), /White pawn/, 'review: the card of e4 reads the viewed board');
      const board = await page.locator('#board canvas').boundingBox();
      await page.mouse.move(board.x / 2, board.y + board.height / 2); // the pointer leaves the board, to its left
      // Shift+Tab from the first menu button moves the keyboard focus to the board: the cursor shows on e2.
      await openMenu(page); await menuItem(page, 'New game').focus();
      await page.keyboard.press('Shift+Tab');
      assert.match(await say(), /^e2, empty/);
      await page.keyboard.press('ArrowUp'); await page.keyboard.press('ArrowUp');
      assert.match(await say(), /^e4, white pawn/, 'review: the cursor reads the viewed board on e4');
      await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowUp');
      assert.match(await say(), /^d5, black pawn/, 'review: the cursor reads the viewed board on d5');
      await page.keyboard.press('Enter'); // a board action ends the review
      await turn(page, /^White to move/);
      assert.match(await say(), /^d5, white pawn/, 'live: the end of the review makes the cursor read the live board');
      await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowUp');
      assert.match(await say(), /^d5, white pawn/, 'live: the cursor reads the live board again');
      // Escape ends a review too: the cursor reads the live board at once, with no arrow key.
      await openMoves(page); await moveRow(page, 2).click(); // the click takes the focus from the board, and the cursor goes
      await turn(page, /^Reviewing after 1… d7-d5/);
      await page.mouse.move(board.x / 2, board.y + board.height / 2);
      await openMenu(page); await menuItem(page, 'New game').focus();
      await page.keyboard.press('Shift+Tab');
      for (const key of ['ArrowUp', 'ArrowUp', 'ArrowLeft', 'ArrowUp']) await page.keyboard.press(key);
      assert.match(await say(), /^d5, black pawn/, 'review: the cursor reads the viewed board on d5');
      await page.keyboard.press('Escape');
      await turn(page, /^White to move/);
      assert.match(await say(), /^d5, white pawn/, 'live: Escape ends the review, and the cursor reads the live board');
      assert.match(await card(D5), /White pawn/, 'live: the card of d5 reads the live board again');
      assert.doesNotMatch(await card(E4), /pawn/, 'live: e4 is empty again');
    } else {
      await tap(E4); // a tap on the board ends the review
      await turn(page, /^White to move/);
    }
    assert.equal(await took(), 1, `${size}: back at the live move the captured pawn shows again`);
    await close();
  }

  // The card's kings' line counts the power uses at the viewed move too.
  const { page, tap, close } = await open({ query: '?kings=frost:freeze,none&fen=' + encodeURIComponent('4k3/p7/8/3n4/8/8/P7/4K3 w - - 0 1') });
  await page.click('#power-btn'); await tap(D5);
  await waitForUi(page, ui => /!F:d5/.test(ui.lan.join(' ')));
  assert.match(await page.textContent('#info'), /White's king: Freeze, 0 left/, 'live: the Freeze is spent');
  await page.keyboard.press('ArrowLeft');
  await turn(page, /^Reviewing the start/);
  assert.match(await page.textContent('#info'), /White's king: Freeze, 1 left/, 'review: the Freeze is not spent yet');
  await close();
}
