// W3: the coin reads, arms, shows a use, or stays on.
import { readPower, usePower } from '../../../../tools/app-ui.mjs';
const save = { back: '', fen: '4k3/p7/8/3n4/8/8/P7/4K3 w - - 0 12', moves: [], white: 'human', black: 'human', sound: false };
const query = '?kings=frost:freeze,flame:haste';
const controls = '.coin, #undo, #end-turn, #menu-btn';
export default {
  sizes: ['phone', 'desktop'],
  states: [
    { name: 'ready', save, query, controls: `${controls}, #power-use`, steps: ({ page }) => readPower(page, 'w') },
    { name: 'armed', save, query, controls: `${controls}, #power-cancel`, steps: ({ page }) => usePower(page) },
    { name: 'used', save, query, controls, steps: async ({ page, tap }) => {
      await usePower(page); await tap(35);
      await page.waitForFunction(() => document.querySelector('#power-w').dataset.state === 'used');
      await readPower(page, 'w');
    } },
    { name: 'always-on', save, query: '?kings=spirit:holylight,none', controls,
      steps: ({ page }) => readPower(page, 'w') },
  ],
};
