// The real board: a capture rewind, then an Archer shot mate.
import { endTurn } from '../../../../tools/app-ui.mjs';
const base = { back: '', white: 'human', black: 'human', sound: false, skill: 'beginner' };
const rest = page => page.waitForFunction(() => !window.view.scene.animating && document.getElementById('end-turn').getAttribute('aria-disabled') === 'false');
export default {
  sizes: ['phone', 'desktop'],
  states: [
    { name: 'end-tiles', save: { ...base, fen: '7k/6pp/8/8/8/p7/8/R5MK w - - 0 1', moves: ['Ra1xa3', 'Kh8-g8', 'Mg1<>h1', 'Kg8-h8'] }, controls: '#over button',
      steps: async ({ page, tap }) => {
        await tap(16); await tap(56); await rest(page); await endTurn(page);
        await page.locator('#over').waitFor({ state: 'visible' });
      } },
    { name: 'archer-ceremony', video: true, save: { ...base, fen: 'R3n2k/6pp/4A3/8/8/p7/8/R6K w - - 0 1', moves: [] }, controls: '#over button',
      steps: async ({ page, tap }) => {
        await tap(0); await tap(16); await rest(page);
        await page.waitForTimeout(300); await page.click('#undo');
        await page.waitForFunction(() => !window.view.scene.animating && window.view.pos.board[0] === 4);
        await page.waitForTimeout(400);
        await tap(44); await tap(60); await rest(page); await endTurn(page);
        await page.locator('#over').waitFor({ state: 'visible' });
      } },
  ],
};
