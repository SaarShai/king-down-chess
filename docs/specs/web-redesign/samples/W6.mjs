// The real board: a capture rewind, then an Archer shot mate.
import { endTurn, usePower } from '../../../../tools/app-ui.mjs';
const base = { back: '', white: 'human', black: 'human', sound: false, skill: 'beginner' };
const rest = page => page.waitForFunction(() => !window.view.scene.animating && document.getElementById('end-turn').getAttribute('aria-disabled') === 'false');
export default {
  sizes: ['phone', 'desktop'],
  states: [
    { name: 'flight-tile', query: '?kings=stratus:flight,none', save: { ...base, fen: '7k/6pp/1p6/8/8/R7/8/2N4K w - - 0 1', moves: ['Nc1~c3', 'b6-b5'] }, controls: '#over button',
      steps: async ({ page, tap }) => { await tap(16); await tap(56); await rest(page); await endTurn(page); await page.locator('#over').waitFor({ state: 'visible' }); } },
    { name: 'haste-final-pass', query: '?kings=flame:haste,none', save: { ...base, fen: '7k/6pp/8/8/8/R7/8/7K w - - 0 1', moves: [] }, controls: '#over button',
      steps: async ({ page, tap }) => { await usePower(page); await tap(16); await tap(56); await rest(page); await endTurn(page); await page.locator('#over').waitFor({ state: 'visible' }); } },
    { name: 'freeze-tile', query: '?kings=frost:freeze,none', save: { ...base, fen: '7k/6pp/8/8/8/2n5/8/R6K w - - 0 1', moves: [] }, controls: '#over button',
      steps: async ({ page, tap }) => { await usePower(page); await tap(18); await tap(0); await tap(56); await rest(page); await endTurn(page); await page.locator('#over').waitFor({ state: 'visible' }); } },
    { name: 'computer-tell', video: true, clock: true, stillPace: 'normal', settleMs: 0, query: '?think=50',
      save: { ...base, back: 'RNBQKBNR', fen: '', moves: [], black: 'ai' }, controls: '#end-turn, #menu-btn',
      steps: async ({ page, tap, video }) => {
        await tap(12); await tap(28); await rest(page); await endTurn(page);
        await page.waitForFunction(() => window.view.scene.lifted != null, null, { polling: 10 });
        if (video) await page.waitForTimeout(1000);
        else {
          await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now() + 32)));
          if (await page.evaluate(() => window.view.scene.lifted == null)) throw new Error('The tell ended before the still.');
        }
      } },
    { name: 'quiet-loss', query: '?think=50', save: { ...base, black: 'ai', skill: 'club', fen: '4r1k1/8/8/8/8/8/5PPP/R5K1 w - - 0 1', moves: ['Ra1-a7', 'Re8-e1'] }, controls: '#over button',
      steps: async ({ page }) => { await page.locator('#over').waitFor({ state: 'visible' }); } },
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
