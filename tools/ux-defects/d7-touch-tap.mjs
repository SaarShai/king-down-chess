// D-7: a finger tap that moves up to 12 px selects the piece, in the painted and the clay look.
// A tap acts on the square under the press, also when the finger slips over the square's edge
// or (clay) the camera turns during the tap.
// A touch drag still moves a piece, and a mouse keeps the 6 px limit (past it, the press is a drag).
import assert from 'node:assert/strict';
import { endTurn, lanMoves, waitForUi } from '../app-ui.mjs';

const SAVE = { back: 'RNBQKBNR', fen: '', moves: [], white: 'human', black: 'human', sound: false };
const G1 = 6, E2 = 12, E3 = 20, G3 = 22, H3 = 23, E4 = 28, H4 = 31, D5 = 35, D7 = 51;

const centre = (page, sq) => page.evaluate(s => window.view.screenOf(s), sq);

/** Presses at point p, moves (dx, dy) px in three steps and lets go: a finger on a phone (a frame a step), else the mouse. */
async function slide(page, phone, p, dx, dy = 0) {
  const steps = [1, 2, 3].map(i => ({ x: p.x + dx * i / 3, y: p.y + dy * i / 3 }));
  if (!phone) {
    await page.mouse.move(p.x, p.y); await page.mouse.down();
    for (const s of steps) await page.mouse.move(s.x, s.y);
    return page.mouse.up();
  }
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [p] });
  for (const s of steps) {
    await page.waitForTimeout(16);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [s] });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
}

/** A finger press on square `sq`, 4 px inside its edge with square `edge`, that slips 10 px toward square `to`. */
async function slip(page, sq, edge, to = edge) {
  const [a, b, c] = [await centre(page, sq), await centre(page, edge), await centre(page, to)];
  const unit = q => { const n = Math.hypot(q.x - a.x, q.y - a.y); return { x: (q.x - a.x) / n, y: (q.y - a.y) / n }; };
  const u = unit(b), v = unit(c);
  await slide(page, true, { x: (a.x + b.x) / 2 - 4 * u.x, y: (a.y + b.y) / 2 - 4 * u.y }, 10 * v.x, 10 * v.y);
}

const isSelected = page => page.evaluate(() => !document.getElementById('selection-actions').hidden);
const moves = async page => (await lanMoves(page)).join(' ');

export default async function ({ open }) {
  for (const look of ['painted', 'clay']) {
    const { page, close } = await open({ size: 'phone', save: SAVE, query: `?look=${look}` });
    await slide(page, true, await centre(page, E2), 10);
    assert.equal(await isSelected(page), true, `${look}: a finger tap that moves 10 px selects the pawn`);
    await page.keyboard.press('Escape');
    await slip(page, E2, E3);
    assert.equal(await isSelected(page), true, `${look}: a finger tap on e2 that slips into e3 selects the pawn`);
    await slip(page, E4, E3);
    assert.match(await moves(page), /e2-e4/, `${look}: a finger tap on e4 that slips into e3 plays e2-e4`);
    await endTurn(page);
    const [a, b] = [await centre(page, D7), await centre(page, D5)];
    await slide(page, true, a, b.x - a.x, b.y - a.y);
    await waitForUi(page, ui => /d7-d5/.test(ui.lan.join(' ')));
    await endTurn(page);
    if (look === 'clay') {
      // A press on an empty square turns the camera: a sideways slip moves h3 about 10 px on the screen.
      await slide(page, true, await centre(page, G1), 0);
      await slip(page, H3, H4, G3);
      assert.match(await moves(page), /g1-h3/, 'clay: a finger tap on h3 that turns the camera plays Ng1-h3');
    }
    await close();
  }
  const { page, close } = await open({ save: SAVE });
  const e2 = await centre(page, E2);
  await slide(page, false, e2, 4);
  assert.equal(await isSelected(page), true, 'a mouse click that moves 4 px selects the pawn');
  await page.keyboard.press('Escape');
  await slide(page, false, e2, 9);
  assert.equal(await isSelected(page), false, 'a mouse press that moves 9 px is a drag back to its own square');
  await close();
}
