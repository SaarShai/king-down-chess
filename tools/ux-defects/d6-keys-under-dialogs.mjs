// D-6: no game key (Z, R, the arrows) acts while a dialog is open, or while the focus is in a field that
// takes typing. Escape still closes the dialog. With no dialog and no field, the keys work.
import assert from 'node:assert/strict';
import { confirmResign, lanMoves } from '../app-ui.mjs';

// White: king a1, pawns a2 and g7, ogre c4. Black: king a8, pawn c5. After a2-a3 Ka8-b8 White can promote
// on g8 (the promotion picker), and the ogre can take or push the pawn on c5 (the move choice).
const FEN = 'k7/6P1/8/2p5/2O5/8/P7/K7 w - - 0 1';
const KEYS = ['z', 'r', 'ArrowLeft', 'ArrowRight'];

export default async function ({ open }) {
  const { page, tap, close } = await open({ save: { back: '', fen: FEN, moves: ['a2-a3', 'Ka8-b8'], white: 'human', black: 'human', queen: false, sound: false } });
  await page.evaluate(() => { window.resets = 0; window.view.resetView = () => { window.resets++; }; }); // R calls it
  const state = async () => ({
    plies: (await lanMoves(page)).length,
    ...await page.evaluate(() => ({
      saved: JSON.parse(localStorage.getItem('kingdown.save')).moves.length,
      review: /^Reviewing/.test(document.getElementById('turn').textContent),
      resets: window.resets,
    })),
  });
  const still = { plies: 2, saved: 2, review: false, resets: 0 };
  assert.deepEqual(await state(), still, 'the game opens on its two moves');
  /** Presses each game key with dialog `id` open: nothing changes and the dialog stays open. Then Escape closes it. */
  const keysDoNothing = async id => {
    for (const key of KEYS) await page.keyboard.press(key);
    assert.deepEqual(await state(), still, `no game key acts under #${id}`);
    assert.equal(await page.evaluate(id => document.getElementById(id).open, id), true, `#${id} stays open`);
    await page.keyboard.press('Escape');
    await page.waitForFunction(id => !document.getElementById(id).open, id);
  };

  await tap(54); await tap(62); // g7-g8
  await page.waitForFunction(() => document.getElementById('promo').open);
  await keysDoNothing('promo');
  await tap(26); await tap(34); // the ogre on c4 onto the pawn on c5
  await page.waitForFunction(() => document.getElementById('move-choice').open);
  await keysDoNothing('move-choice');
  await page.evaluate(() => document.getElementById('delete-account').showModal());
  await keysDoNothing('delete-account');
  await page.waitForFunction(() => document.activeElement.id === 'menu-btn'); // The close event returns focus before typing starts.
  // A field that takes typing, outside any dialog, keeps its keys.
  for (const html of ['<div contenteditable="true"></div>', '<input type="text">']) {
    await page.evaluate(html => { document.body.insertAdjacentHTML('beforeend', `<div id="probe-field">${html}</div>`); document.querySelector('#probe-field > *').focus(); }, html);
    for (const key of KEYS) await page.keyboard.press(key);
    assert.deepEqual(await state(), still, `no game key acts in ${html}`);
    await page.evaluate(() => document.getElementById('probe-field').remove());
  }
  // The result dialog (two players: White, to move, resigns).
  await confirmResign(page);
  await page.waitForFunction(() => document.getElementById('over').open);
  await keysDoNothing('over');
  // No dialog and no field: Z keeps the final resignation, R resets the view, ← opens the review.
  for (const key of ['z', 'r', 'ArrowLeft']) await page.keyboard.press(key);
  assert.deepEqual(await state(), { plies: 2, saved: 2, review: true, resets: 1 }, 'the keys work with no dialog open');
  await close();
}
