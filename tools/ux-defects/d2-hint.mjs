// D-2: Hint suggests only a move that the board takes now. The probe taps the hinted squares, and the
// move must play: the Maester swap in lesson 3, a plain move while Strike is not armed, a Strike move
// while it is armed. With no move to play (a Haste turn with only End turn left), Hint says so.
import assert from 'node:assert/strict';

const STRIKE = '?kings=flame:strike,none&fen=' + encodeURIComponent('2b4k/2P3pp/2R5/8/8/8/8/K7 w - - 0 1'); // Strike Rc6-e8 mates
const HASTE = '?kings=flame:haste,none&fen=' + encodeURIComponent('7k/8/8/8/p7/8/P7/K7 w - - 0 1'); // after a2-a3, the pawn is stuck

/** Hint's squares: the piece, then the squares to tap. */
async function hint(page) {
  await page.click('#hint');
  await page.waitForFunction(() => window.view.marks.hint?.length > 0, null, { timeout: 10000 });
  return page.evaluate(() => window.view.marks.hint);
}

/** Whether `fn` becomes true within 5 s. */
const soon = (page, fn) => page.waitForFunction(fn, null, { timeout: 5000 }).then(() => true, () => false);

/** Tap the hinted squares; the board must play a move that `re` matches. */
async function follow(page, tap, squares, re, what) {
  for (const sq of squares) await tap(sq);
  const played = await soon(page, () => document.querySelector('#moves button'));
  assert.ok(played, `${what}: the board refused the hinted squares ${squares} (${await page.textContent('#move-help')})`);
  assert.match(await page.textContent('#moves button'), re, `${what}: the hint is not the expected move`);
}

export default async function ({ open }) {
  {
    const { page, tap, close } = await open();
    await page.click('#rules-btn'); await page.click('#learn');
    for (const squares of [[27, 36], [11, 12]]) { // lessons 1 and 2: the Archer's shot, the Guard's block
      for (const sq of squares) await tap(sq);
      await page.waitForFunction(() => document.getElementById('moment').textContent.startsWith('Well done.'));
      await page.click('#next-lesson');
    }
    assert.match(await page.textContent('#turn'), /Lesson 3 of 6: Maester/);
    const squares = await hint(page);
    for (const sq of squares) await tap(sq);
    const done = await soon(page, () => document.getElementById('moment').textContent.startsWith('Well done.'));
    assert.ok(done, `lesson 3: the hint ${squares} is not the Maester swap (${await page.textContent('#moment')})`);
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
    await follow(page, tap, await hint(page), /^R\w+-\w+!$/, 'Strike armed');
    await close();
  }
  {
    const { page, tap, close } = await open({ query: HASTE });
    await page.click('#power-btn');
    await tap(8); await tap(16); // a2-a3 with Haste
    await page.waitForFunction(() => !document.getElementById('end-haste').hidden);
    await page.click('#hint');
    const said = await soon(page, () => /no move/.test(document.getElementById('move-help').textContent));
    const marks = await page.evaluate(() => window.view.marks.hint);
    assert.ok(said && !marks.length, `Haste with only End turn left: Hint marks [${marks}] and says "${await page.textContent('#move-help')}"`);
    await close();
  }
}
