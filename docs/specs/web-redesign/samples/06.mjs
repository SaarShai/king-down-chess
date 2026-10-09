// W7 phase 1: the New game sheet. W1 connects the end state in phase 2.
import { setUpGame } from '../../../../tools/new-game-ui.mjs';
const save = { back: 'RNBQKBNR', fen: '', moves: [], white: 'human', black: 'human', skill: 'club', sound: false };
const controls = '#start-game, #new-game .new-game-head button';
export default {
  sizes: ['phone', 'desktop'],
  states: [
    ...['computer', 'powers', 'two'].map(mode => ({
      name: mode, save, controls,
      steps: ({ page }) => setUpGame(page, { mode, army: null }),
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
