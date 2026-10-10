// Sample 00 (ticket 00): today's game screen at the five sizes, as a test of the sample tool.
// Run: SAMPLE=00 node docs/specs/web-ux/capture.mjs <base-url> [out-dir]. The format is in README.md.
import { pressMenu } from '../../../../tools/app-ui.mjs';

// Two legal plies for this army (the tool checks that the app keeps each saved move).
const save = { back: 'SQBKRSML', fen: '', moves: ['e2-e4', 'e7-e5'], white: 'human', black: 'ai', sound: false, skill: 'club' };
// Today's table bar: Menu, Undo and End turn (the redesign replaced the menu and action rows).
const controls = '#menu-btn, #undo, #end-turn';

export default {
  sizes: ['phone', 'desktop', 'laptop', 'tablet', 'landscape'],
  states: [
    { name: 'rest', save, controls },
    { name: 'selected', save, controls, steps: ({ tap }) => tap(11) }, // the piece on d2
    { name: 'settings', save, controls: '#menu-back, #menu-close', steps: ({ page }) => pressMenu(page, 'Settings') }, // the Board help page of the menu
    // Two players, so no reply comes: d2-d3, with a phone video of the move.
    { name: 'move', save: { ...save, black: 'human' }, controls, video: true, steps: async ({ tap }) => { await tap(11); await tap(19); } },
  ],
};
