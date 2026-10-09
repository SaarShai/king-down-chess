// W10: the new seal dot and the Tricks page, from a real bite chain and press.
import { endTurn, openTricks } from '../../../../tools/app-ui.mjs';
const save = { back: '', fen: '7k/8/8/3p4/3Sp3/8/8/K7 w - - 0 1', moves: [], white: 'human', black: 'human', sound: false };
const find = async ({ page, tap }) => {
  for (const square of [27, 35, 28]) await tap(square);
  await endTurn(page);
  await page.locator('#menu-seal-dot').waitFor({ state: 'visible' });
};
export default {
  sizes: ['phone', 'desktop'],
  states: [
    { name: 'new-seal-dot', save, controls: '#menu-btn, #undo, #end-turn', steps: find },
    { name: 'tricks', save, controls: '#menu-back, #menu-close', steps: async context => { await find(context); await openTricks(context.page); } },
  ],
};
