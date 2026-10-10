// W7: the New game sheet. The warn line reads the handed-over turn.
import { openExtra, startLesson } from '../../../../tools/app-ui.mjs';
import { setUpGame } from '../../../../tools/new-game-ui.mjs';
const save = { back: 'RNBQKBNR', fen: '', moves: [], white: 'human', black: 'human', skill: 'club', sound: false };
const controls = '#start-game, #new-game .new-game-head button';
export default {
  sizes: ['phone', 'desktop'],
  states: [
    ...[0, 1, 2].map(i => ({ name: `catapult-example-${i + 1}`, save, controls, steps: async ({ page }) => {
      const codes = await page.locator('#army-examples option').evaluateAll(options => options.filter(o => o.value.includes('C')).map(o => o.value));
      await setUpGame(page, { mode: 'computer', army: codes[i] });
    } })),
    ...['computer', 'powers', 'two'].map(mode => ({
      name: mode, save, controls,
      steps: ({ page }) => setUpGame(page, { mode, army: null }),
    })),
    ...['casual', 'strong'].map(level => ({
      name: `computer-${level}`, save, controls,
      steps: ({ page }) => setUpGame(page, { mode: 'computer', level, army: null }),
    })),
    ...[false, true].map(lesson => ({
      name: lesson ? 'today-kept-game-warn' : 'today-warn',
      save: { ...save, moves: ['e2-e4', 'e7-e5'] }, controls,
      steps: async ({ page }) => {
        if (lesson) await startLesson(page);
        await openExtra(page); await page.click('#today-army');
      },
    })),
    {
      name: 'more', save, controls,
      steps: ({ page }) => setUpGame(page, { mode: 'computer', army: 'MMSSNBNK' }),
    },
    {
      name: 'warn', save: { ...save, moves: ['e2-e4', 'e7-e5'] }, controls,
      steps: ({ page }) => setUpGame(page, { mode: 'computer', army: null }),
    },
  ],
};
