// W2: three layout sizes, the five table states and the four Menu pages.
import { openExtra, openMenu, openMoves } from '../../../../tools/app-ui.mjs';
const save = { back: 'RNBQKBNR', fen: '', moves: ['e2-e4', 'e7-e5'], white: 'human', black: 'human', sound: false };
const controls = '#undo, #menu-btn, #moves-line';
export default {
  sizes: ['phone', 'desktop', 'landscape'],
  states: [
    { name: 'rest', save, controls },
    { name: 'selected', save, controls, steps: ({ tap }) => tap(6) },
    { name: 'staged-turn', save, controls, steps: async ({ tap }) => { await tap(6); await tap(21); } },
    { name: 'check', save: { ...save, fen: '4k3/8/8/8/4r3/8/8/4K3 w - - 0 1', back: '', moves: [] }, controls },
    { name: 'moves', save, controls: '#sheet-moves .sheet-head button', steps: ({ page }) => openMoves(page) },
    { name: 'menu', save, controls: '#menu-close', steps: ({ page }) => openMenu(page) },
    { name: 'board-help', save, controls: '#menu-back, #menu-close', steps: async ({ page }) => { await openMenu(page); await page.locator('[data-go="help"]').click(); } },
    { name: 'extra', save, controls: '#menu-back, #menu-close', steps: ({ page }) => openExtra(page) },
    { name: 'resign', save, controls: '#menu-back, #menu-close, #resign-confirm', steps: async ({ page }) => { await openMenu(page); await page.locator('[data-go="resign"]').click(); } },
    { name: 'review', save, controls: '#back-to-game', steps: async ({ page }) => { await openMoves(page); await page.locator('#moves [data-ply="1"]').click(); } },
  ],
};
