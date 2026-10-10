// Sample 01 (ticket 01): the Quiet Table look. Today's layout on the parchment floor: the game at rest, a
// piece selected, the first-visit title and the Workshop. Each state renders with the device in light and
// in dark mode (the `-dark` states): the page is light only, so the two must look the same.
// Run: SAMPLE=01 node docs/specs/web-ux/capture.mjs <base-url> [out-dir]. The format is in README.md.
import { pressMenu } from '../../../../tools/app-ui.mjs';

// Two legal plies for this army (the tool checks that the app keeps each saved move).
const save = { back: 'SQBKRSML', fen: '', moves: ['e2-e4', 'e7-e5'], white: 'human', black: 'ai', sound: false, skill: 'club' };
// Today's menu row and action row (New game, Guide, Workshop, Settings; Hint, Undo, Resign).
const controls = '#panel .menu button, #panel .actions button';

const light = [
  { name: 'rest', save, controls },
  { name: 'selected', save, controls, steps: ({ tap }) => tap(11) }, // the piece on d2
  // A first visit: no save, and the title opens.
  { name: 'title', title: true, controls: '#title-screen .title-actions button:not([hidden])' },
  {
    name: 'workshop', save, controls: '#workshop .ws-bar button',
    steps: async ({ page }) => { await pressMenu(page, 'Workshop'); await page.locator('#workshop').waitFor({ state: 'visible' }); },
  },
];

export default {
  sizes: ['phone', 'desktop'],
  states: light.flatMap(state => [state, { ...state, name: `${state.name}-dark`, scheme: 'dark' }]),
};
