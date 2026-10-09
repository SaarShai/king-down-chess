// D-1: Resign gives up this device's side, never the computer's or the friend's, and it is off while the computer thinks.
import assert from 'node:assert/strict';
import { waitForUi } from '../app-ui.mjs';

/** Presses Resign and accepts its question; returns the question and the result's title. */
async function resign(page) {
  let asked = null;
  page.once('dialog', d => { asked = d.message(); void d.accept(); });
  await page.click('#resign');
  await page.waitForFunction(() => document.getElementById('over').open);
  return { asked, result: await page.textContent('#over-title') };
}

export default async function ({ open }) {
  // Against the computer: while it thinks, Resign is off and its handler does nothing; then it resigns your side.
  {
    const { page, tap, close } = await open({ save: { back: 'RNBQKBNR', fen: '', moves: [], white: 'human', black: 'ai', skill: 'club', sound: false } });
    await tap(12); await tap(28); // e2-e4; the computer then thinks for Black
    const during = await (await waitForUi(page, ui => {
      if (!/^thinking…$/m.test(ui.context)) return false;
      const button = document.getElementById('resign'), asked = [], ask = window.confirm;
      window.confirm = m => { asked.push(m); return false; };
      try { button.onclick?.(new MouseEvent('click')); } finally { window.confirm = ask; }
      return { disabled: button.disabled, asked };
    })).jsonValue();
    assert.deepEqual(during, { disabled: true, asked: [] }, 'Resign is off while the computer thinks');
    await waitForUi(page, ui => ui.lan.length === 2 && !document.getElementById('resign').disabled);
    assert.deepEqual(await resign(page), { asked: 'Resign as White?', result: 'White resigns — Black wins' }, 'against the computer');
    await close();
  }
  // Two players on one device: the side to move resigns.
  {
    const { page, close } = await open({ save: { back: 'RNBQKBNR', fen: '', moves: ['e2-e4'], white: 'human', black: 'human', sound: false } });
    assert.deepEqual(await resign(page), { asked: 'Resign as Black?', result: 'Black resigns — White wins' }, 'two players');
    await close();
  }
  // A game link: this device resigns its own side, also on the friend's turn.
  {
    const { page, tap, close } = await open({ query: '?army=RNBQKBNR&moves=e2-e4' });
    await tap(52); await tap(36); // e7-e5: this device plays Black
    await waitForUi(page, ui => ui.lan.length === 2);
    assert.deepEqual(await resign(page), { asked: 'Resign as Black?', result: 'Black resigns — White wins' }, 'a game link, on the friend\'s turn');
    await close();
  }
}
