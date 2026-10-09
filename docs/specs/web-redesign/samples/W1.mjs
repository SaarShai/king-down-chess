// W1: turn states, lesson Show me and the two link labels.
import { startLesson, endTurn } from '../../../../tools/app-ui.mjs';
const controls = '#panel .actions button:not([hidden])';
const save = { back: 'RNBQKBNR', fen: '', moves: [], white: 'human', black: 'human', sound: false, skill: 'club' };
const ready = page => page.waitForFunction(() => document.getElementById('end-turn').getAttribute('aria-disabled') === 'false');
export default {
  sizes: ['phone', 'desktop'],
  states: [
    { name: 'turn-off', save, controls },
    { name: 'turn-ready', save, controls, steps: async ({ page, tap }) => { await tap(12); await tap(28); await ready(page); } },
    { name: 'haste', query: '?kings=flame:haste,none&fen=7k/p7/8/8/8/8/8/R5K1%20w%20-%20-%200%201', controls,
      steps: async ({ page, tap }) => { await page.click('#power-btn'); await tap(0); await tap(24); await ready(page); } },
    { name: 'staged-mate', query: '?fen=6k1/5ppp/8/8/8/8/8/R5K1%20w%20-%20-%200%201', controls,
      steps: async ({ page, tap }) => { await tap(0); await tap(56); await ready(page); } },
    { name: 'show-me', save, controls: '#show-me,#return-game',
      steps: async ({ page }) => { await startLesson(page); await page.click('#show-me'); await page.waitForFunction(() => window.view.marks.hint.length > 0 && !document.getElementById('show-me').disabled); } },
    { name: 'send-your-turn', query: '?army=RNBQKBNR&moves=e2-e4', controls,
      steps: async ({ page, tap }) => { await tap(52); await tap(36); await ready(page); } },
    { name: 'send-again', query: '?army=RNBQKBNR&moves=e2-e4', controls,
      steps: async ({ page, tap }) => {
        await page.evaluate(() => {
          Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
          Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => {} }, configurable: true });
        });
        await tap(52); await tap(36); await ready(page); await endTurn(page);
        await page.waitForFunction(() => document.getElementById('end-turn').textContent === 'Send again');
      } },
  ],
};
