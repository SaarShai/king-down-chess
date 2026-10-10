// W14: the Proving Ground, the Workshop's view A behind ?workshop=a (docs/specs/workshop-proving-ground tickets 01 and 02).
// The open piece on its example board with its marks, the plinth with its rules, the key and the Pieces ledge; then
// the editor (ticket 02): paint (Both armed), painted (My Pawn with its paint diff), weigh (the popover; on the phone,
// the toast from ⋯) and phone-tools (the tools popover; on the desktop it is the paint state); then the rules (ticket 03):
// stamp-preview (the Rules shelf, "Moves like" picked, the board previews it), stamped (Stamp), pill-open and when-open
// (the row of the new rule's pill and chip; on the phone, in its card), three-of-three (S at 3 rules) and phone-sentence
// (the rule card; on the desktop, the × bar of the line under the pointer).
// Mockup states to set beside them: open, hero, archer, beast, maester, ogre, guard, phone-open, paint, painted,
// stamp-preview, stamped (docs/research/rules-ui-2026-10-10/mockups/proving-ground.html?state=<id>, served, never file://).
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
/** The Pawn with Both armed; `paint` paints c5 (and e5, its mirror) and leaves brush mode; `then` acts on the phone or the desktop. */
const brush = (name, paint, then) => ({ ...state(name, 'pawn'), steps: async ({ page, size }) => {
  await piece('pawn')({ page });
  await page.click('.brush[data-brush="both"]');
  if (paint) { await page.click('.sq[data-sq="c5"]'); await page.keyboard.press('Escape'); }
  await then?.(page, size === 'phone');
} });

/** The Pawn with the Rules shelf open and "Moves like" picked; `stamp` stamps it; `then` acts on the phone or the desktop. */
const seals = (name, stamp, then) => ({ ...state(name, 'pawn'), steps: async ({ page, size }) => {
  await piece('pawn')({ page });
  await page.click('[data-act="shelf"]');
  await page.click('[data-seal="movesLike"]');
  if (stamp) await page.click('[data-act="stamp"]');
  await then?.(page, size === 'phone');
} });
/** Opens the row of the "moves like" line's pill or chip (`attr`); on the phone the line is in the rule's card. */
const row = attr => async (page, phone) => {
  if (phone) await page.click('[data-card="movesLike"]');
  await page.click(`${phone ? '.pg-card ' : ''}[${attr}="movesLike"]`);
};

export default {
  states: [
    state('open-pawn', 'pawn'),
    state('paladin', 'paladin'),
    state('archer', 'archer'),
    state('beast', 'beast'),
    state('maester', 'maester'),
    state('ogre', 'ogre'),
    state('guard', 'guard'),
    { name: 'link', query: `?workshop=a&design=${Buffer.from(JSON.stringify(rider)).toString('base64url')}`, save, targets, controls,
      steps: async ({ page }) => { await page.locator('#workshop.pg[open]').waitFor(); } },
    brush('paint', false),
    brush('painted', true),
    brush('weigh', true, async (page, phone) => {
      if (!phone) return page.click('.pg-weigh');
      await page.click('[data-act="more"]');
      await page.click('.pg-morepop [data-act="weigh"]');
    }),
    brush('phone-tools', false, async (page, phone) => { if (phone) await page.click('[data-act="tools"]'); }),
    seals('stamp-preview', false),
    seals('stamped', true),
    seals('pill-open', true, row('data-pill')),
    seals('when-open', true, row('data-when')),
    seals('three-of-three', true, page => page.keyboard.press('s')),
    seals('phone-sentence', true, (page, phone) => (phone ? page.click('[data-card="movesLike"]') : page.hover('.sline:has([data-rm="movesLike"])'))),
  ],
};
