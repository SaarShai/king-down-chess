// Sample 00 (ticket 00): today's game screen at the five sizes, as a test of the sample tool.
// Run: SAMPLE=00 node docs/specs/web-ux/capture.mjs <base-url> [out-dir]. The format is in README.md.
import { pressMenu } from '../../../../tools/app-ui.mjs';

// Two legal plies for this army (the app drops a saved move that is not legal, and the moves after it).
const save = { back: 'SQBKRSML', fen: '', moves: ['e2-e4', 'e7-e5'], white: 'human', black: 'ai', sound: false, skill: 'club' };
// Today's menu row and action row (New game, Guide, Workshop, Settings; Hint, Undo, Resign).
const controls = '#panel .menu button, #panel .actions button';

export default {
  sizes: ['phone', 'desktop', 'laptop', 'tablet', 'landscape'],
  states: [
    { name: 'rest', save, controls },
    { name: 'selected', save, controls, steps: ({ tap }) => tap(11) }, // the piece on d2
    { name: 'settings', save, controls: '#settings', steps: ({ page }) => pressMenu(page, 'Settings') },
  ],
};
