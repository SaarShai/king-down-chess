// W8: Home uses the saved board. No move replays on open.
import { arriveContinue } from '../../../../tools/app-ui.mjs';
const save = { back: 'RNBQKBNR', fen: '', moves: ['e2-e4', 'e7-e5'], white: 'human', black: 'human', skill: 'club', sound: false };
const controls = '#home-main, #home-new, #home-today, #menu-btn, #moves-line';
export default {
  sizes: ['phone', 'desktop'],
  states: [
    { name: 'first-visit', title: true, controls: '#title-start' },
    { name: 'first-deal', title: true, controls: '#end-turn, #menu-btn', steps: async ({ page }) => { await page.click('#title-start'); } },
    { name: 'saved-game', title: true, save: { ...save, black: 'ai' }, controls },
    {
      name: 'staged-turn', title: true, save, controls,
      steps: async ({ page, tap }) => {
        await arriveContinue(page).click();
        await tap(6); await tap(21);
        await page.evaluate(() => window.home.open());
      },
    },
    { name: 'finished-game', title: true, save: { ...save, moves: ['f2-f3', 'e7-e5', 'g2-g4', 'Qd8-h4'] }, controls: `${controls}, #home-review` },
  ],
};
