// W14: the Proving Ground, the Workshop's view A behind ?workshop=a (docs/specs/workshop-proving-ground tickets 01 to 07).
// The open piece on its example board with its marks, the plinth with its rules, the key and the Pieces ledge;
// a rule kept by a tap (hero-i1 to hero-i3) and a cracked knot (beast-cancel) (ticket 04); then
// the editor (ticket 02): paint (Both armed), painted (My Pawn with its paint diff), weigh (the popover; on the phone,
// the toast from ⋯) and phone-tools (the tools popover; on the desktop it is the paint state); then the rules (ticket 03):
// stamp-preview (the Rules shelf, "Moves like" picked, the board previews it), stamped (Stamp), pill-open and when-open
// (the row of the new rule's pill and chip; on the phone, in its card), three-of-three (S at 3 rules) and phone-sentence
// (the rule card; on the desktop, the × bar of the line under the pointer); then the Why tag (ticket 05): hero (a tap on the
// Paladin's d7), why-d7 (Enter on d7), why-g7 (refused), beast-hover (the pointer on the Beast's e5 shows its chain; on the
// phone, a tap opens the sheet) and phone-why (the Pawn's d6, the longest caption, in the phone's sheet); then Try with
// (ticket 06): asleep-b4 and awake-e2 (My Pawn of the mockup, painted and with "moves like a queen", lifted to b4 and e2),
// moved (the Beast takes e5 by Move here: its chain goes on), guard-threats (the eye on the Guard, and an enemy pawn on c5
// from the Enemy token: two stopped threats), tray (the Archer with the eye on: two threats) and phone-board-tab (the Guard
// in the phone's Board tab; on the desktop, the tray in the right column); then ticket 07: new-piece (NEW on the ledge: a
// blank piece alone on d4, Move armed), look-more (the Look sheet of the new piece: More under the rule lines; on the
// phone, Look in ⋯), rename (the name field of the Pawn with a typed name: the pen; on the phone, Rename in ⋯) and
// design-menu (⋯ of My Pawn after one paint; on the phone with Share, Weigh, Rename and Look).
// Mockup states to set beside them: open, hero, hero-i1, hero-i2, hero-i3, archer, beast, beast-cancel, maester, ogre, guard,
// phone-open, phone-hero, why-g7, paint, painted, stamp-preview, stamped, asleep-b4, awake-e2, rook-leap; for new-piece, the
// open state and a tap on NEW; for design-menu, painted and ⋯ (the phone's ⋯; the mockup's desktop has no ⋯)
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
/** The Paladin with rule i kept by a tap on its seal. */
const kept = i => ({ ...state(`hero-i${i + 1}`, 'paladin'), steps: async a => { await piece('paladin')(a); await a.page.click(`.sline[data-seal="${i}"] .sl-seal, .pg-pseal[data-seal="${i}"]`); } });
/** The Why tag of square `sq` on pool piece `key`: a tap opens it (`how` 'tap'), or Enter on the focused square ('key'), or the pointer rests on it on the desktop ('hover'). */
const why = (name, key, sq, how = 'tap') => ({ ...state(name, key), steps: async ({ page, size }) => {
  await piece(key)({ page });
  const at = `.sq[data-sq="${sq}"]`;
  if (how === 'key') { await page.focus(at); await page.keyboard.press('Enter'); } else if (how === 'hover' && size !== 'phone') await page.hover(at); else await page.click(at);
} });
/** My Beast of the mockup, removed after anything (scenes.js:208-214), on the shelf. */
const beastAny = JSON.stringify({ v: 1, designs: [{ v: 1, kind: 'piece', id: 'mybeast-any', name: 'My Beast', named: true, look: { body: 'S', auto: false, glow: null, army: 0 }, letter: 'Y',
  ownLetter: false, squares: [[-1, 1], [0, 1], [1, 1], [-1, 0], [1, 0], [-1, -1], [0, -1], [1, -1]].map(([x, y]) => ({ x, y, mark: 'both' })), lines: [],
  rules: [{ when: { on: 'takes' }, does: { a: 'chain' } }, { when: { on: 'takes' }, does: { a: 'removedAfter', what: 'any' } }], from: ['beast'], updated: 1760000000000 }] });
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
  await page.click('[data-sealitem="movesLike"]');
  if (stamp) await page.click('[data-act="stamp"]');
  await then?.(page, size === 'phone');
} });
/** On the phone, a tap keeps the rule's seal and a second tap opens its card. */
const card = async (page, a) => { await page.click(`[data-card="${a}"]`); await page.click(`[data-card="${a}"]`); };
/** Opens the row of the "moves like" line's pill or chip (`attr`); on the phone the line is in the rule's card. */
const row = attr => async (page, phone) => {
  if (phone) await card(page, 'movesLike');
  await page.click(`${phone ? '.pg-card ' : ''}[${attr}="movesLike"]`);
};
/** Ticket 07: on the phone ⋯ holds the item `act`; the wide layout has its own control `wide`. */
const menu = async (page, phone, act, wide) => {
  if (!phone) return page.click(wide);
  await page.tap('[data-act="more"]');
  await page.tap(`.pg-morepop [data-act="${act}"]`);
};
/** Ticket 06: on the phone the tray is in the ledge's Board tab. */
const tray = async (page, phone) => { if (phone) await page.click('[data-tab="board"]'); };
/** My Pawn of the mockup: Both painted on c5 and e5 and "moves like a queen" on a center square, lifted to `sq`. */
const myPawnOn = (name, sq) => ({ ...state(name, 'pawn'), steps: async ({ page }) => {
  await piece('pawn')({ page });
  await page.click('.brush[data-brush="both"]');
  await page.click('.sq[data-sq="c5"]');
  await page.keyboard.press('Escape');
  await page.click('[data-act="shelf"]');
  await page.click('[data-sealitem="movesLike"]');
  await page.click('[data-act="stamp"]');
  await page.click('.sq[data-sq="d4"]');
  await page.click(`.sq[data-sq="${sq}"]`);
} });

export default {
  states: [
    state('open-pawn', 'pawn'),
    state('paladin', 'paladin'),
    why('hero', 'paladin', 'd7'),
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
    seals('phone-sentence', true, (page, phone) => (phone ? card(page, 'movesLike') : page.hover('.sline:has([data-rm="movesLike"])'))),
    why('why-d7', 'paladin', 'd7', 'key'),
    why('why-g7', 'paladin', 'g7'),
    why('beast-hover', 'beast', 'e5', 'hover'),
    why('phone-why', 'pawn', 'd6'),
    myPawnOn('asleep-b4', 'b4'),
    myPawnOn('awake-e2', 'e2'),
    { ...why('moved', 'beast', 'e5'), steps: async a => { await why('', 'beast', 'e5').steps(a); await a.page.click('[data-try="take"]'); } },
    { ...state('guard-threats', 'guard'), steps: async ({ page, size }) => {
      await piece('guard')({ page });
      await tray(page, size === 'phone');
      await page.click('[data-tok="enemy"]');
      await page.click('.sq[data-sq="c5"]');
    } },
    { ...state('tray', 'archer'), steps: async ({ page, size }) => {
      await piece('archer')({ page });
      await tray(page, size === 'phone');
      await page.click('[data-act="threats"]');
    } },
    { ...state('phone-board-tab', 'guard'), steps: async ({ page, size }) => { await piece('guard')({ page }); await tray(page, size === 'phone'); } },
    { ...state('new-piece', 'pawn'), steps: async ({ page }) => { await piece('pawn')({ page }); await page.click('.newtile'); } },
    { ...state('look-more', 'pawn'), steps: async ({ page, size }) => {
      await piece('pawn')({ page });
      await page.click('.newtile');
      await menu(page, size === 'phone', 'looks', '.pg-lookmore');
    } },
    { ...state('rename', 'pawn'), steps: async ({ page, size }) => {
      await piece('pawn')({ page });
      await menu(page, size === 'phone', 'rename', '.pg-pen');
      await page.keyboard.type('Lancer');
    } },
    brush('design-menu', true, page => page.click('[data-act="more"]')),
  ],
};
