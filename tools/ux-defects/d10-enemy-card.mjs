// D-10: a tap on an enemy piece shows its card, with no refusal, and clears the selection; a tap on an
// enemy piece that the selected piece can take still captures. Enter on the keyboard cursor does the same.
import assert from 'node:assert/strict';

// White: king e1, pawn e4. Black: king e8, knight a6, pawn d5. The pawn can take d5, not the knight.
const save = { back: '', fen: '4k3/8/n7/3p4/4P3/8/8/4K3 w - - 0 1', moves: [], white: 'human', black: 'ai', sound: false, skill: 'club' };
const E4 = 28, D5 = 35, A6 = 40;

export default async function ({ open }) {
  for (const size of ['desktop', 'phone']) {
    const { page, tap, close } = await open({ size, save });
    const text = id => page.textContent(id);
    const selecting = () => page.locator('#selection-actions').isVisible();

    await tap(A6);
    assert.match(await text('#info'), /Black knight/, `${size}: a tap on an enemy piece shows its card`);
    assert.equal(await text('#move-help'), '', `${size}: a tap on an enemy piece gives no refusal`);

    await tap(E4);
    assert.match(await text('#info'), /White pawn/);
    assert.equal(await selecting(), true);
    await tap(A6);
    assert.match(await text('#info'), /Black knight/, `${size}: an enemy that the pawn cannot take shows its card`);
    assert.equal(await text('#move-help'), '', `${size}: no refusal for an enemy that the pawn cannot take`);
    assert.equal(await selecting(), false, `${size}: the tap clears the selection`);

    if (size === 'desktop') {
      // The keyboard: Enter on an enemy piece shows and says its card, and clears the selection.
      await tap(E4); // the selected pawn: the keyboard cursor starts on it
      const board = await page.locator('#board canvas').boundingBox();
      await page.mouse.move(board.x / 2, board.y + board.height / 2); // the pointer leaves the board, to its left
      await page.focus('#new-game-btn');
      await page.keyboard.press('Shift+Tab');
      assert.match(await text('#cursor-say'), /^e4, white pawn, selected$/);
      for (const key of ['ArrowLeft', 'ArrowLeft', 'ArrowLeft', 'ArrowLeft', 'ArrowUp', 'ArrowUp']) await page.keyboard.press(key);
      assert.match(await text('#cursor-say'), /^a6, black knight$/);
      await page.keyboard.press('Enter');
      assert.match(await text('#info'), /Black knight/, 'keyboard: Enter on an enemy piece shows its card');
      assert.equal(await text('#move-help'), '', 'keyboard: no refusal');
      assert.equal(await selecting(), false, 'keyboard: Enter clears the selection');
      assert.match(await text('#cursor-say'), /^a6, black knight\. Moves in an L/, 'keyboard: the card is said');
      await page.locator('#new-game-btn').focus(); // the board loses the focus, and the cursor goes
    }

    await tap(E4); await tap(D5);
    await page.waitForFunction(() => /e4xd5/.test(document.getElementById('moves').textContent));
    await close();
  }
}
