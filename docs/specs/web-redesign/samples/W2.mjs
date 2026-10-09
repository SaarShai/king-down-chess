// W2: three layout sizes, the five table states and the four Menu pages.
import { endTurn, openExtra, openMenu, openMoves, pressMenu } from '../../../../tools/app-ui.mjs';
const save = { back: 'RNBQKBNR', fen: '', moves: ['e2-e4', 'e7-e5'], white: 'human', black: 'human', sound: false };
const frost = { ...save, back: '', fen: '4k3/p7/8/3n4/8/8/P7/4K3 w - - 0 1', moves: [] };
const lesson = async page => { await pressMenu(page, 'Guide'); await page.click('#learn'); };
const controls = '#undo, #menu-btn, #moves-line';
export default {
  sizes: ['smallPhone', 'phone', 'desktop', 'landscape'],
  states: [
    { name: 'rest', save, controls },
    { name: 'computer-rest', save: { ...save, white: 'human', black: 'ai', skill: 'club' }, controls },
    { name: 'computer-thinking', save: { ...save, moves: [], white: 'human', black: 'ai', skill: 'strong' }, controls,
      steps: async ({ page, tap }) => {
        // Hold the search reply at the browser worker boundary for a stable still.
        await page.evaluate(() => { Worker.prototype.postMessage = () => {}; });
        await tap(12); await tap(28); await endTurn(page);
        await page.waitForFunction(() => document.querySelector('#strip-them small').textContent === 'thinking…');
      } },
    { name: 'selected', save, controls, steps: ({ tap }) => tap(6) },
    { name: 'staged-turn', save, controls, steps: async ({ tap }) => { await tap(6); await tap(21); } },
    { name: 'check', save: { ...save, fen: '4k3/8/8/8/4r3/8/8/4K3 w - - 0 1', back: '', moves: [] }, controls },
    { name: 'moves', save, controls: '#sheet-moves .sheet-head button', steps: ({ page }) => openMoves(page) },
    { name: 'menu', save, controls: '#menu-close', steps: ({ page }) => openMenu(page) },
    { name: 'board-help', save, controls: '#menu-back, #menu-close', steps: async ({ page }) => { await openMenu(page); await page.locator('[data-go="help"]').click(); } },
    { name: 'extra', save, controls: '#menu-back, #menu-close', steps: ({ page }) => openExtra(page) },
    { name: 'resign', save, controls: '#menu-back, #menu-close, #resign-confirm', steps: async ({ page }) => { await openMenu(page); await page.locator('[data-go="resign"]').click(); } },
    { name: 'review', save, controls: '#back-to-game', steps: async ({ page }) => { await openMoves(page); await page.locator('#moves [data-ply="1"]').click(); } },
    { name: 'lesson-task', save, controls: '#return-game, #show-me, #menu-btn', steps: ({ page }) => lesson(page) },
    { name: 'lesson-done', save, controls: '#return-game, #next-lesson, #menu-btn', steps: async ({ page, tap }) => { await lesson(page); await tap(27); await tap(36); } },
    { name: 'freeze-armed', save: frost, query: '?kings=frost:freeze,none', controls, steps: ({ page }) => page.click('#power-btn') },
    { name: 'freeze-mark', save: frost, query: '?kings=frost:freeze,none', controls, steps: async ({ page, tap }) => { await page.click('#power-btn'); await tap(35); } },
    { name: 'free-pass', save: frost, query: '?kings=frost:freeze,none', controls, steps: async ({ page, tap }) => { await page.click('#power-btn'); await tap(35); await endTurn(page); } },
  ],
};
