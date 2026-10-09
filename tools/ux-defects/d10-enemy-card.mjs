// D-10: with no piece selected, a tap on an enemy piece shows its card, with no refusal. With a piece selected,
// a tap on an enemy piece that it cannot take shows the card, clears the selection and keeps the reason
// (pick D10: only the "That is Black's …" line changes). A tap on an enemy piece that it can take still captures.
// Enter on the keyboard cursor does the same; a drag onto an enemy piece keeps the reason. While the player cannot move (the computer thinks, the game is
// over, a game link waits for the friend), a tap on a piece shows its card too, beside the reason.
import assert from 'node:assert/strict';
import { endTurn, contextWordsInView, contextText, focusBoard, leaveBoard, refusalText, waitForUi } from '../app-ui.mjs';

// White: king e1, pawn e4. Black: king e8, knight a6, pawn d5. The pawn can take d5, not the knight.
const save = { back: '', fen: '4k3/8/n7/3p4/4P3/8/8/4K3 w - - 0 1', moves: [], white: 'human', black: 'ai', sound: false, skill: 'club' };
const E2 = 12, E4 = 28, E5 = 36, D5 = 35, A6 = 40, E7 = 52, F7 = 53, B8 = 57;
const cannot = /^The pawn cannot take the knight on a6\./m;

export default async function ({ open }) {
  for (const size of ['desktop', 'phone']) {
    const { page, tap, close } = await open({ size, save });
    const text = id => id === '#info' ? contextText(page) : page.textContent(id);
    const selecting = () => page.evaluate(() => window.view.marks.selected != null);

    await tap(A6);
    assert.match(await text('#info'), /Black knight/, `${size}: a tap on an enemy piece shows its card`);
    assert.equal(await refusalText(page), '', `${size}: with no piece selected, a tap on an enemy piece gives no refusal`);

    await tap(E4);
    assert.match(await text('#info'), /White pawn/);
    assert.equal(await selecting(), true);
    await tap(A6);
    assert.match(await text('#info'), /Black knight/, `${size}: an enemy that the pawn cannot take shows its card`);
    assert.match(await contextText(page), cannot, `${size}: the help line still says why the pawn cannot take it`);
    assert.equal(await selecting(), false, `${size}: the tap clears the selection`);

    if (size === 'desktop') {
      // The keyboard: Enter on an enemy piece shows and says its card; with the pawn selected, the reason stays.
      await tap(E4); await tap(E4); // select the pawn, then clear it: no piece selected, no card chosen
      const board = await page.locator('#board canvas').boundingBox();
      await page.mouse.move(board.x / 2, board.y + board.height / 2); // the pointer leaves the board, to its left
      await focusBoard(page); // the cursor starts on e2
      const keys = async (...list) => { for (const key of list) await page.keyboard.press(key); };
      await keys('ArrowLeft', 'ArrowLeft', 'ArrowLeft', 'ArrowLeft', 'ArrowUp', 'ArrowUp', 'ArrowUp', 'ArrowUp');
      assert.match(await text('#cursor-say'), /^a6, black knight$/);
      await page.keyboard.press('Enter');
      assert.match(await text('#info'), /Black knight/, 'keyboard: Enter on an enemy piece shows its card');
      assert.equal(await refusalText(page), '', 'keyboard: with no piece selected, no refusal');
      assert.match(await text('#cursor-say'), /^a6, black knight\. Moves in an L/, 'keyboard: the card is said');
      await keys('ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowDown', 'ArrowDown', 'Enter'); // select the pawn on e4
      assert.match(await text('#cursor-say'), /^e4 selected\./);
      await keys('ArrowLeft', 'ArrowLeft', 'ArrowLeft', 'ArrowLeft', 'ArrowUp', 'ArrowUp', 'Enter');
      assert.match(await text('#info'), /Black knight/, 'keyboard: Enter on an enemy that the pawn cannot take shows its card');
      assert.match(await contextText(page), cannot, 'keyboard: the reason stays');
      assert.equal(await selecting(), false, 'keyboard: Enter clears the selection');
      assert.match(await text('#cursor-say'), /^a6, black knight\. Moves in an L/);
      await leaveBoard(page); // the cursor goes
    }

    await tap(E4); await tap(D5);
    await waitForUi(page, ui => /e4xd5/.test(ui.lan.join(' ')));
    await close();
  }

  // A drag is a move attempt: a drop on an enemy piece that the piece cannot take keeps the reason.
  const drops = [
    ['4k3/p7/8/8/8/2n5/P7/2B1K3 w - - 0 1', 2, 18, /^The bishop cannot take the knight on c3\./m],
    ['4k3/4r3/8/8/8/3n4/4B3/4K3 w - - 0 1', 12, 19, /^That leaves your king in check\./m],
  ];
  for (const [fen, from, to, why] of drops) {
    const { page, close } = await open({ save: { ...save, fen } });
    const at = sq => page.evaluate(s => window.view.screenOf(s), sq);
    const [a, b] = [await at(from), await at(to)];
    await page.mouse.move(a.x, a.y); await page.mouse.down();
    await page.mouse.move(b.x, b.y, { steps: 8 }); await page.mouse.up();
    assert.match(await contextText(page), why, 'a drop on an enemy piece that the piece cannot take says why');
    await close();
  }

  // While the player cannot move, a tap on a piece shows its card, and the help line keeps its reason.
  for (const size of ['desktop', 'phone']) {
    // The computer thinks: Strong with a long thinking time, so the tap comes during the search.
    let { page, tap, close } = await open({ size, save: { back: 'RNBQKBNR', fen: '', moves: [], white: 'human', black: 'ai', sound: false, skill: 'strong', think: 4000 } });
    await tap(E2); await tap(E4);
    await endTurn(page);
    await waitForUi(page, ui => ui.thinking);
    await tap(B8);
    assert.match(await contextText(page), /Black knight/, `${size}: a tap while the computer thinks shows the card`);
    assert.ok(await contextWordsInView(page, 'Moves in an L'), 'the read keeps knight rules during search');
    assert.match(await contextText(page), /^The computer is thinking\. Wait for its move\.$/m);
    await close();

    // The game is over: Ra1-a8 mates.
    ({ page, tap, close } = await open({ size, save: { back: '', fen: '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1', moves: [], white: 'human', black: 'ai', sound: false, skill: 'club' } }));
    await tap(0); await tap(56);
    await endTurn(page);
    await page.waitForFunction(() => document.getElementById('over').open);
    await page.click('#over button[value="close"]');
    await tap(F7);
    assert.match(await contextText(page), /Black pawn/, `${size}: a tap after the game ends shows the card`);
    assert.ok(await contextWordsInView(page, 'Moves 1 square forward'), 'the read keeps pawn rules after the end');
    assert.match(await contextText(page), /wins|Checkmate/i);
    await close();

    // A game link: this device plays Black and waits for the friend's move.
    ({ page, tap, close } = await open({ size, query: '?army=RNBQKBNR&moves=e2-e4' }));
    await tap(E7); await tap(E5);
    await waitForUi(page, ui => /e7-e5/.test(ui.lan.join(' ')));
    await tap(E4);
    assert.match(await contextText(page), /White pawn/, `${size}: a tap while a game link waits for the friend shows the card`);
    assert.ok(await contextWordsInView(page, 'Moves 1 square forward'), 'the read keeps pawn rules while the link waits');
    assert.equal(await page.textContent('#end-turn'), 'Send your turn');
    assert.equal(await page.locator('#end-turn').getAttribute('aria-disabled'), 'false');
    await close();
  }
}
