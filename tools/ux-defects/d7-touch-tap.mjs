// D-7: a finger tap that moves up to 12 px selects the piece, in the painted and the clay look.
// A touch drag still moves a piece, and a mouse keeps the 6 px limit (past it, the press is a drag).
import assert from 'node:assert/strict';

const SAVE = { back: 'RNBQKBNR', fen: '', moves: [], white: 'human', black: 'human', sound: false };
const E2 = 12, E4 = 28;

/** Presses on square `sq`, moves (dx, dy) px in three steps and lets go: a finger on a phone, else the mouse. */
async function slide(page, phone, sq, dx, dy = 0) {
  const p = await page.evaluate(s => window.view.screenOf(s), sq);
  const steps = [1, 2, 3].map(i => ({ x: p.x + dx * i / 3, y: p.y + dy * i / 3 }));
  if (!phone) {
    await page.mouse.move(p.x, p.y); await page.mouse.down();
    for (const s of steps) await page.mouse.move(s.x, s.y);
    return page.mouse.up();
  }
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [p] });
  for (const s of steps) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [s] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
}

const isSelected = page => page.evaluate(() => !document.getElementById('selection-actions').hidden);

export default async function ({ open }) {
  for (const look of ['painted', 'clay']) {
    const { page, close } = await open({ size: 'phone', save: SAVE, query: `?look=${look}` });
    await slide(page, true, E2, 10);
    assert.equal(await isSelected(page), true, `${look}: a finger tap that moves 10 px selects the pawn`);
    await page.click('#cancel-selection');
    const [a, b] = await page.evaluate(s => s.map(q => window.view.screenOf(q)), [E2, E4]);
    await slide(page, true, E2, b.x - a.x, b.y - a.y);
    await page.waitForFunction(() => /e2-e4/.test(document.getElementById('moves').textContent));
    await close();
  }
  const { page, close } = await open({ save: SAVE });
  await slide(page, false, E2, 4);
  assert.equal(await isSelected(page), true, 'a mouse click that moves 4 px selects the pawn');
  await page.click('#cancel-selection');
  await slide(page, false, E2, 9);
  assert.equal(await isSelected(page), false, 'a mouse press that moves 9 px is a drag back to its own square');
  await close();
}
