// D-2: Hint suggests only a move that the board takes now. The probe taps the hinted squares, and the
// move must play: the Maester swap in lesson 3 (also with the Maester selected first), a plain move while
// Strike is not armed, a Strike move while it is armed, and the second move of a Haste turn. When End turn
// is best, Hint says so. Esc during the search keeps the power off. With Always promote to queen, Hint does
// not suggest an underpromotion, because the board plays the queen there.
import assert from 'node:assert/strict';
import { boardHelp, contextText, lanMoves, pressMenu, waitForUi } from '../app-ui.mjs';

const STRIKE = '?kings=flame:strike,none&fen=' + encodeURIComponent('2b4k/2P3pp/2R5/8/8/8/8/K7 w - - 0 1'); // Strike Rc6-e8 mates
const HASTE = '?kings=flame:haste,none&fen=';
const PASS = HASTE + encodeURIComponent('7k/8/8/1p6/8/8/P7/K7 w - - 0 1'); // after a2-a3, a3-a4 loses the pawn to b5xa4
const ROOK = HASTE + encodeURIComponent('7k/8/8/8/8/8/8/K2R4 w - - 0 1');
const QUEEN = '?fen=' + encodeURIComponent('8/2q1P1k1/8/8/6n1/8/6P1/7K w - - 0 1'); // e7-e8=N forks; after e7-e8=Q, Qc7-h2 mates

/** Press Hint and wait for its search to end; returns Hint's squares: the piece, then the squares to tap. */
async function hint(page) {
  await page.click('#hint');
  await page.waitForFunction(() => !document.getElementById('hint').disabled, null, { timeout: 10000 });
  return page.evaluate(() => window.view.marks.hint);
}

/** Whether `test(ui, arg)` becomes true within 5 s (waitForUi in tools/app-ui.mjs). */
const soon = (page, test, arg) => waitForUi(page, test, arg, { timeout: 5000 }).then(() => true, () => false);
const played = async page => (await lanMoves(page)).length;

/** Tap the hinted squares; the board must play a move that `re` matches. */
async function follow(page, tap, squares, re, what) {
  assert.ok(squares.length, `${what}: Hint marks nothing (${await contextText(page)})`);
  const n = await played(page);
  for (const sq of squares) await tap(sq);
  const ok = await soon(page, (ui, k) => ui.lan.length > k, n);
  assert.ok(ok, `${what}: the board refused the hinted squares ${squares} (${await contextText(page)})`);
  assert.match((await lanMoves(page))[n], re, `${what}: the hint is not the expected move`);
}

/** Open lesson 3 (the Maester): the lessons before it are one move each. */
async function lesson3(open) {
  const { page, tap, close } = await open();
  await pressMenu(page, 'Guide'); await page.click('#learn');
  for (const squares of [[27, 36], [11, 12]]) { // lessons 1 and 2: the Archer's shot, the Guard's block
    for (const sq of squares) await tap(sq);
    await waitForUi(page, ui => /^Well done\./m.test(ui.context));
    await page.click('#next-lesson');
  }
  assert.match(await page.textContent('#turn'), /Lesson 3 of 6: Maester/);
  return { page, tap, close };
}

/** Arm the power and play the first move of a Haste turn. */
async function haste(page, tap, from, to) {
  await page.click('#power-btn');
  await tap(from); await tap(to);
  await page.waitForFunction(() => !document.getElementById('end-haste').hidden);
}

export default async function ({ open }) {
  for (const first of [[], [27]]) { // nothing selected, and the Maester selected as the task says
    const { page, tap, close } = await lesson3(open);
    for (const sq of first) await tap(sq);
    const squares = await hint(page);
    for (const sq of squares) await tap(sq);
    const done = await soon(page, ui => /^Well done\./m.test(ui.context));
    assert.ok(done, `lesson 3, selected [${first}]: the hint ${squares} does not play the Maester swap (${await contextText(page)})`);
    await close();
  }
  {
    const { page, tap, close } = await open({ query: STRIKE });
    await follow(page, tap, await hint(page), /^[^!]+$/, 'Strike not armed'); // no power move (a Strike ends in !)
    await close();
  }
  {
    const { page, tap, close } = await open({ query: STRIKE });
    await page.click('#power-btn');
    // The power stays armed through the search: the button and its live status line do not change.
    await page.evaluate(() => {
      window.powerTrail = [];
      new MutationObserver(() => window.powerTrail.push(document.getElementById('power-btn').textContent))
        .observe(document.getElementById('powers'), { subtree: true, childList: true, characterData: true, attributes: true });
    });
    const squares = await hint(page);
    const trail = await page.evaluate(() => window.powerTrail);
    assert.ok(trail.every(t => t === 'Cancel Strike'), `Strike armed: the power button changed during the search: ${trail.join(' | ')}`);
    await follow(page, tap, squares, /^R\w+-\w+!$/, 'Strike armed');
    await close();
  }
  {
    const { page, close } = await open({ query: STRIKE });
    await page.click('#power-btn');
    // Hint, then Esc in the same task: Esc runs while the search is still on.
    await page.evaluate(() => {
      document.getElementById('hint').click();
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    await page.waitForFunction(() => !document.getElementById('hint').disabled, null, { timeout: 10000 });
    const btn = await page.textContent('#power-btn'), marks = await page.evaluate(() => window.view.marks.hint);
    assert.ok(btn.startsWith('Use Strike') && !marks.length, `Esc during the Hint search: the power button says "${btn}", Hint marks [${marks}]`);
    await close();
  }
  {
    const { page, tap, close } = await open({ query: PASS });
    await haste(page, tap, 8, 16); // a2-a3 with Haste
    const marks = await hint(page), help = await contextText(page);
    assert.ok(/^Hint: end the turn\.$/m.test(help) && !marks.length, `Haste with End turn best: Hint marks [${marks}] and says "${help}"`);
    await close();
  }
  {
    const { page, tap, close } = await open({ query: ROOK });
    await haste(page, tap, 3, 19); // Rd1-d3 with Haste; the rook stays selected for its second move
    await follow(page, tap, await hint(page), /^R/, 'Haste second move');
    await close();
  }
  {
    const { page, tap, close } = await open({ query: QUEEN });
    assert.deepEqual(await hint(page), [52, 60], 'promotion: Hint does not mark the e7-e8 fork'); // e7-e8=N, and the picker offers the knight
    await boardHelp(page, () => page.check('#queen'));
    const squares = await hint(page);
    assert.notEqual(squares[0], 52, `Always promote to queen: Hint marks [${squares}], and the board plays e7-e8=Q there`);
    await follow(page, tap, squares, /^[^=]+$/, 'Always promote to queen');
    await close();
  }
}
