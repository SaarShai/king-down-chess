// W14: the Proving Ground, the Workshop's view A behind ?workshop=a (docs/specs/workshop-proving-ground tickets 01 and 04).
// The open piece on its example board with its marks, the plinth with its rules, the key and the Pieces ledge;
// a rule kept by a tap (hero-i1 to hero-i3) and a cracked knot (beast-cancel).
// Mockup states to set beside them: open, hero, hero-i1, hero-i2, hero-i3, archer, beast, beast-cancel, maester, ogre, guard, phone-open
// (docs/research/rules-ui-2026-10-10/mockups/proving-ground.html?state=<id>, served, never file://).
// The targets leave out the board squares (24 px or more, spec decision 9) and the later nubs and knots.
// Run: SAMPLE=W14 node docs/specs/web-ux/capture.mjs <base-url> <out-dir>. Renders stay outside Git.
import { pressMenu } from '../../../../tools/app-ui.mjs';

const save = { back: 'SQBKRSML', fen: '', moves: [], white: 'human', black: 'human', sound: false, pace: 'off' };
const targets = 'button:not(.sq, .nub, .knot), select, summary, label';
const controls = '#workshop .pg-menu, #workshop .pg-field';
/** The W12 design (samples/W12.mjs) as a link. */
const rider = { kind: 'piece', name: 'Rook Rider', look: { figure: 'antler-guardian', body: 'token', auto: true, glow: null, army: 0 }, letter: 'D',
  squares: [{ x: 1, y: 2, mark: 'both' }, { x: -1, y: 2, mark: 'both' }], lines: ['n', 'e', 's', 'w'], rules: [] };
/** Opens the Workshop from the menu, then the pool piece `key` from the ledge. */
const piece = key => async ({ page }) => {
  await pressMenu(page, 'Workshop');
  await page.locator('#workshop.pg[open]').waitFor();
  if (key !== 'pawn') await page.click(`.slot[data-piece="${key}"]`);
  await page.locator(`.slot[data-piece="${key}"][aria-current="true"]`).waitFor();
};
const state = (name, key) => ({ name, query: '?workshop=a', save, targets, controls, steps: piece(key) });
/** The Paladin with rule i kept by a tap (on the phone, its seal). */
const kept = i => ({ ...state(`hero-i${i + 1}`, 'paladin'), steps: async a => { await piece('paladin')(a); await a.page.click(`[data-seal="${i}"]:visible`); } });
/** My Beast of the mockup, removed after anything (scenes.js:208-214), on the shelf. */
const beastAny = JSON.stringify({ v: 1, designs: [{ v: 1, kind: 'piece', id: 'mybeast-any', name: 'My Beast', named: true, look: { body: 'S', auto: false, glow: null, army: 0 }, letter: 'Y',
  ownLetter: false, squares: [[-1, 1], [0, 1], [1, 1], [-1, 0], [1, 0], [-1, -1], [0, -1], [1, -1]].map(([x, y]) => ({ x, y, mark: 'both' })), lines: [],
  rules: [{ when: { on: 'takes' }, does: { a: 'chain' } }, { when: { on: 'takes' }, does: { a: 'removedAfter', what: 'any' } }], from: ['beast'], updated: 1760000000000 }] });

export default {
  states: [
    state('open-pawn', 'pawn'),
    state('paladin', 'paladin'),
    state('hero', 'paladin'),
    kept(0), kept(1), kept(2),
    state('archer', 'archer'),
    state('beast', 'beast'),
    state('maester', 'maester'),
    state('ogre', 'ogre'),
    state('guard', 'guard'),
    { name: 'beast-cancel', query: '?workshop=a', save, targets, controls, steps: async ({ page }) => {
      await page.evaluate(v => localStorage.setItem('kingdown.workshop', v), beastAny);
      await pressMenu(page, 'Workshop');
      await page.click('.slot[data-design="mybeast-any"]');
      await page.locator('.slot[data-design="mybeast-any"][aria-current="true"]').waitFor();
    } },
    { name: 'link', query: `?workshop=a&design=${Buffer.from(JSON.stringify(rider)).toString('base64url')}`, save, targets, controls,
      steps: async ({ page }) => { await page.locator('#workshop.pg[open]').waitFor(); } },
  ],
};
