// W4: piece reads, guide text, and verb marks.
import { openPieceRules, usePower } from '../../../../tools/app-ui.mjs';
const save = fen => ({ back: '', fen, moves: [], white: 'human', black: 'human', sound: false, pace: 'off' });
const controls = '#undo, #menu-btn, #moves-line, #all-rules';
export default {
  sizes: ['phone', 'desktop', 'smallPhone'],
  states: [
    { name: 'read-enemy-maester', save: save('7k/8/8/8/3m4/8/8/K7 w - - 0 1'), controls, steps: ({ tap }) => tap(27) },
    { name: 'read-archer', save: save('7k/8/2a5/8/2P5/8/8/K7 w - - 0 1'), controls, steps: ({ tap }) => tap(42) },
    { name: 'archer-all-rules', save: save('7k/8/2a5/8/2P5/8/8/K7 w - - 0 1'), controls: '#rules-rows .piece-card[data-piece=archer]', steps: async ({ page, tap }) => { await tap(42); await openPieceRules(page); } },
    { name: 'beast-all-rules', save: save('7k/8/8/8/3s4/8/8/K7 w - - 0 1'), controls: '#rules-rows .piece-card[data-piece=beast]', steps: async ({ page, tap }) => { await tap(27); await openPieceRules(page); } },
    { name: 'read-ogre', save: save('7k/8/8/2P5/2o5/8/8/K7 w - - 0 1'), controls, steps: ({ tap }) => tap(26) },
    { name: 'ogre-all-rules', save: save('7k/8/8/2P5/2o5/8/8/K7 w - - 0 1'), controls: '#rules-rows .piece-card[data-piece=ogre]', steps: async ({ page, tap }) => { await tap(26); await openPieceRules(page); } },
    { name: 'read-frozen', query: '?kings=frost:freeze,none', save: save('4k3/p7/8/3n4/8/8/P7/4K3 w - - 0 1'), controls, steps: async ({ page, tap }) => { await usePower(page); await tap(35); await page.waitForFunction(() => !document.getElementById('power-cancel').checkVisibility()); await tap(35); } },
    { name: 'shove', save: save('7k/8/8/2p5/2O5/8/P7/K7 w - - 0 1'), controls, steps: ({ tap }) => tap(26) },
    { name: 'take-or-shove', save: save('7k/8/8/2p5/2O5/8/P7/K7 w - - 0 1'), controls: '#move-choice-title, #choose-capture, #choose-push, #cancel-choice', steps: async ({ page, tap }) => { await tap(26); await tap(34); await page.locator('#move-choice').waitFor({ state: 'visible' }); } },
    { name: 'read-paladin', save: save('7k/p7/8/8/3l4/8/P7/K7 w - - 0 1'), controls, steps: ({ tap }) => tap(27) },
    { name: 'read-guard', save: save('7k/p7/8/8/3g4/8/P7/K7 w - - 0 1'), controls, steps: ({ tap }) => tap(27) },
    { name: 'read-beast', save: save('7k/8/8/8/3s4/8/8/K7 w - - 0 1'), controls, steps: ({ tap }) => tap(27) },
    { name: 'bites-1-and-2', save: save('7k/8/5p2/3pp3/2nS4/8/8/K7 w - - 0 1'), controls: `${controls}, #stop-chain`, steps: async ({ tap }) => { await tap(27); await tap(26); await tap(35); } },
    { name: 'four-bites', save: save('7k/6p1/5p2/3pp3/2nS4/8/8/K7 w - - 0 1'), controls: `${controls}, #stop-chain`, steps: async ({ tap }) => { await tap(27); await tap(26); await tap(35); await tap(36); await tap(45); } },
    { name: 'swap', save: save('7k/8/8/8/8/8/P7/MN5K w - - 0 1'), controls, steps: ({ tap }) => tap(0) },
    { name: 'shot', save: save('7k/8/8/8/2p5/8/2A5/K7 w - - 0 1'), controls, steps: ({ tap }) => tap(10) },
  ],
};
