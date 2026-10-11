// W14: the Workshop, the Proving Ground (docs/specs/workshop-proving-ground tickets 01 to 11).
// The open piece on its example board with its marks, the plinth with its rules, the key and the Pieces ledge;
// a rule kept by a tap (hero-i1 to hero-i3) and a cracked knot (beast-cancel: My Beast, its pill changed from "a piece, not a
// pawn" to "anything", so the top bar says Undo rule; a tap on e5 opens its Why tag) (ticket 04); then
// the editor (ticket 02): paint (Both armed), painted (My Pawn with its paint diff), weigh (the popover; on the phone,
// the toast from ⋯) and phone-tools (the tools popover; on the desktop it is the paint state); then the rules (ticket 03):
// stamp-preview (My Pawn, painted, with the Rules shelf open and "Moves like" picked: the board previews it), stamped (Stamp), pill-open and when-open
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
// design-menu (⋯ of My Pawn after one paint, with Look; on the phone also Share, Weigh and Rename); then ticket 08: share (the Share
// sheet of My Pawn with a device share: Send link, Copy link and Copy as text; on the phone from ⋯), phone-share (the longest
// card: My Paladin from Make a copy, with its 3 rules, on a device with no share: one Copy link), link-card (the Rook Rider
// link opens its card face first), phone-link-card (a link to a piece with 3 rules: the longest card) and reach-popover (the
// pointer on the Paladin in the ledge shows its reach; the phone has no popover). The state `link` opens that link on the board.
// Ticket 09 renders open-pawn, paint, stamp-preview, why-d7 and tray also on a phone held sideways (landscape, 844 x 390): the
// board on the left, the plinth strip, the brush row and the tray in one column, the shelf and the Why tag as side sheets, and the
// pieces from the sheet that Pieces opens. The mockup has no landscape state.
// Ticket 10 records painted (the first paint: the copy flies to Yours), stamped (the stamp) and moved (Move here) also as phone
// videos with Motion Normal. In a video, each step's motion plays out (700 ms) before the next step.
// Mockup states to set beside them: open, hero, hero-i1, hero-i2, hero-i3, archer, beast, beast-cancel, maester, ogre, guard,
// phone-open, phone-hero, why-g7, paint, painted, stamp-preview, stamped, asleep-b4, awake-e2, rook-leap; for new-piece, the
// open state and a tap on NEW; for design-menu, painted and ⋯ (the phone's ⋯; the mockup's desktop has no ⋯); for the card
// face, card-paladin and phone-card of mockup B (binder-and-table.html); for reach-popover, open with the pointer on the Paladin
// (docs/research/rules-ui-2026-10-10/mockups/proving-ground.html?state=<id>, served, never file://).
// The targets leave out the board squares (24 px or more, spec decision 9) and the later nubs and knots.
// Run: SAMPLE=W14 node docs/specs/web-ux/capture.mjs <base-url> <out-dir>. Renders stay outside Git.
import { pressMenu } from '../../../../tools/app-ui.mjs';

const save = { back: 'SQBKRSML', fen: '', moves: [], white: 'human', black: 'human', sound: false, pace: 'off' };
const targets = 'button:not(.sq, .nub, .knot), select, summary, label';
const controls = '#workshop .pg-menu, #workshop .pg-field';
/** The Rook Rider of the old W12 sample as a link; a piece with the Paladin's moves and 3 rules as a link. */
const rider = { kind: 'piece', name: 'Rook Rider', look: { figure: 'antler-guardian', body: 'token', auto: true, glow: null, army: 0 }, letter: 'D',
  squares: [{ x: 1, y: 2, mark: 'both' }, { x: -1, y: 2, mark: 'both' }], lines: ['n', 'e', 's', 'w'], rules: [] };
const lancer = { kind: 'piece', name: 'Holy Lancer', look: { body: 'L', auto: false, glow: null, army: 0 }, letter: 'H', squares: [], lines: ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'],
  rules: [{ when: { on: 'always' }, does: { a: 'linesPass', over: 'own' } }, { when: { on: 'always' }, does: { a: 'cannotTake', what: 'king' } }, { when: { on: 'takes' }, does: { a: 'removedAfter', what: 'piece' } }] };
const linkTo = d => `?design=${Buffer.from(JSON.stringify(d)).toString('base64url')}`;
/** Ticket 08: a device share (`on`) or none, then Share: the top bar's on the desktop, ⋯ on the phone. */
const shareOn = async (page, phone, on) => {
  await page.evaluate(on => Object.defineProperty(navigator, 'share', { configurable: true, value: on ? async () => {} : undefined }), on);
  await menu(page, phone, 'share', '.pg-share');
};
/** Ticket 10: in a video, the motion of a step plays to its end before the next step (the next action stops a motion). */
const playOut = (page, video) => video && page.waitForTimeout(700);
/** In short landscape the ledge is in the sheet that Pieces opens. */
const ledge = async page => { if (await page.isHidden('.pg-ledge')) await page.click('[data-act="pieces"]'); };
/** A phone, upright or held sideways, has the narrow controls: ⋯, the rule cards and no pointer. */
const narrow = size => size !== 'desktop';
/** Opens the Workshop from the menu, then the pool piece `key` from the ledge. */
const piece = key => async ({ page, video }) => {
  await pressMenu(page, 'Workshop');
  await page.locator('#workshop.pg[open]').waitFor();
  if (key !== 'pawn') { await ledge(page); await page.click(`.slot[data-piece="${key}"]`); }
  await page.locator(`.slot[data-piece="${key}"][aria-current="true"]`).waitFor({ state: 'attached' });
  await playOut(page, video);
};
const state = (name, key) => ({ name, save, targets, controls, steps: piece(key) });
/** Ticket 09: the state also on a phone held sideways (landscape, 844 × 390). */
const turned = s => ({ ...s, sizes: ['phone', 'desktop', 'landscape'] });
/** The Paladin with rule i kept by a tap on its seal. */
const kept = i => ({ ...state(`hero-i${i + 1}`, 'paladin'), steps: async a => { await piece('paladin')(a); await a.page.click(`.sline[data-seal="${i}"] .sl-seal, .pg-pseal[data-seal="${i}"]`); } });
/** The Why tag of square `sq` on pool piece `key`: a tap opens it (`how` 'tap'), or Enter on the focused square ('key'), or the pointer rests on it on the desktop ('hover'). */
const why = (name, key, sq, how = 'tap') => ({ ...state(name, key), steps: async ({ page, size, video }) => {
  await piece(key)({ page, video });
  const at = `.sq[data-sq="${sq}"]`;
  if (how === 'key') { await page.focus(at); await page.keyboard.press('Enter'); } else if (how === 'hover' && !narrow(size)) await page.hover(at); else await page.click(at);
  await playOut(page, video);
} });
/** My Beast of the mockup, removed after a piece (scenes.js:201-207), on the shelf. */
const beastPiece = JSON.stringify({ v: 1, designs: [{ v: 1, kind: 'piece', id: 'mybeast', name: 'My Beast', named: true, look: { body: 'S', auto: false, glow: null, army: 0 }, letter: 'Y',
  ownLetter: false, squares: [[-1, 1], [0, 1], [1, 1], [-1, 0], [1, 0], [-1, -1], [0, -1], [1, -1]].map(([x, y]) => ({ x, y, mark: 'both' })), lines: [],
  rules: [{ when: { on: 'takes' }, does: { a: 'chain' } }, { when: { on: 'takes' }, does: { a: 'removedAfter', what: 'piece' } }], from: ['beast'], updated: 1760000000000 }] });
/** Both armed, c5 painted (and e5, its mirror), and out of brush mode: My Pawn of the mockup. */
const paintBoth = async (page, video) => {
  await page.click('.brush[data-brush="both"]');
  await page.click('.sq[data-sq="c5"]');
  await playOut(page, video);
  await page.keyboard.press('Escape');
  await playOut(page, video);
};
/** The Pawn with Both armed; `paint` paints c5 (and e5, its mirror) and leaves brush mode; `then` acts on the phone or the desktop. */
const brush = (name, paint, then) => ({ ...state(name, 'pawn'), steps: async ({ page, size, video }) => {
  await piece('pawn')({ page, video });
  if (paint) await paintBoth(page, video);
  else await page.click('.brush[data-brush="both"]');
  await then?.(page, narrow(size));
} });

/** My Pawn with the Rules shelf open and "Moves like" picked, as the mockup's states; `stamp` stamps it; `then` acts on the phone or the desktop. */
const seals = (name, stamp, then) => ({ ...state(name, 'pawn'), steps: async ({ page, size, video }) => {
  await piece('pawn')({ page, video });
  await paintBoth(page, video);
  await page.click('[data-act="shelf"]');
  await page.click('[data-sealitem="movesLike"]');
  await playOut(page, video);
  if (stamp) await page.click('[data-act="stamp"]');
  await then?.(page, narrow(size));
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
const myPawnOn = (name, sq) => ({ ...state(name, 'pawn'), steps: async a => {
  await seals('', true).steps(a);
  const { page } = a;
  await page.click('.sq[data-sq="d4"]');
  await page.click(`.sq[data-sq="${sq}"]`);
} });

export default {
  states: [
    turned(state('open-pawn', 'pawn')),
    state('paladin', 'paladin'),
    why('hero', 'paladin', 'd7'),
    kept(0), kept(1), kept(2),
    state('archer', 'archer'),
    state('beast', 'beast'),
    state('maester', 'maester'),
    state('ogre', 'ogre'),
    state('guard', 'guard'),
    { name: 'beast-cancel', save, targets, controls, steps: async ({ page, size }) => {
      const phone = narrow(size);
      await page.evaluate(v => localStorage.setItem('kingdown.workshop', v), beastPiece);
      await pressMenu(page, 'Workshop');
      await ledge(page);
      await page.click('.slot[data-design="mybeast"]');
      await page.locator('.slot[data-design="mybeast"][aria-current="true"]').waitFor({ state: 'attached' });
      if (phone) await card(page, 'removedAfter');
      await page.click(`${phone ? '.pg-card ' : ''}[data-pill="removedAfter"]`);
      await page.click('[data-choice="any"]');
      if (phone) await page.keyboard.press('Escape');
      await page.click('.sq[data-sq="e5"]');
    } },
    { name: 'link', query: linkTo(rider), save, targets, controls, steps: async ({ page }) => { await page.click('.pg-sheet [data-board]'); } },
    turned(brush('paint', false)),
    { ...brush('painted', true), video: true },
    brush('weigh', true, async (page, phone) => {
      if (!phone) return page.click('.pg-weigh');
      await page.click('[data-act="more"]');
      await page.click('.pg-morepop [data-act="weigh"]');
    }),
    brush('phone-tools', false, async (page, phone) => { if (phone) await page.click('[data-act="tools"]'); }),
    turned(seals('stamp-preview', false)),
    { ...seals('stamped', true), video: true },
    seals('pill-open', true, row('data-pill')),
    seals('when-open', true, row('data-when')),
    seals('three-of-three', true, page => page.keyboard.press('s')),
    seals('phone-sentence', true, (page, phone) => (phone ? card(page, 'movesLike') : page.hover('.sline:has([data-rm="movesLike"])'))),
    turned(why('why-d7', 'paladin', 'd7', 'key')),
    why('why-g7', 'paladin', 'g7'),
    why('beast-hover', 'beast', 'e5', 'hover'),
    why('phone-why', 'pawn', 'd6'),
    myPawnOn('asleep-b4', 'b4'),
    myPawnOn('awake-e2', 'e2'),
    { ...why('moved', 'beast', 'e5'), video: true, steps: async a => { await why('', 'beast', 'e5').steps(a); await a.page.click('[data-try="take"]'); } },
    { ...state('guard-threats', 'guard'), steps: async ({ page, size }) => {
      await piece('guard')({ page });
      await tray(page, size === 'phone');
      await page.click('[data-tok="enemy"]');
      await page.click('.sq[data-sq="c5"]');
    } },
    turned({ ...state('tray', 'archer'), steps: async ({ page, size }) => {
      await piece('archer')({ page });
      await tray(page, size === 'phone');
      await page.click('[data-act="threats"]');
    } }),
    { ...state('phone-board-tab', 'guard'), steps: async ({ page, size }) => { await piece('guard')({ page }); await tray(page, size === 'phone'); } },
    { ...state('new-piece', 'pawn'), steps: async ({ page }) => { await piece('pawn')({ page }); await ledge(page); await page.click('.newtile'); } },
    { ...state('look-more', 'pawn'), steps: async ({ page, size }) => {
      await piece('pawn')({ page });
      await ledge(page);
      await page.click('.newtile');
      await menu(page, narrow(size), 'looks', '.pg-lookmore');
    } },
    { ...state('rename', 'pawn'), steps: async ({ page, size }) => {
      await piece('pawn')({ page });
      await menu(page, narrow(size), 'rename', '.pg-pen');
      await page.keyboard.type('Lancer');
    } },
    brush('design-menu', true, page => page.click('[data-act="more"]')),
    brush('share', true, (page, phone) => shareOn(page, phone, true)),
    { ...state('phone-share', 'paladin'), steps: async ({ page, size }) => {
      await piece('paladin')({ page });
      await page.click('[data-act="more"]');
      await page.click('.pg-morepop [data-act="copydesign"]');
      await shareOn(page, narrow(size), false);
    } },
    { name: 'link-card', query: linkTo(rider), save, targets, controls, steps: async ({ page }) => { await page.locator('.pg-sheet[open] .pg-face').waitFor(); } },
    { name: 'phone-link-card', query: linkTo(lancer), save, targets, controls, steps: async ({ page }) => { await page.locator('.pg-sheet[open] .pg-face').waitFor(); } },
    { ...state('reach-popover', 'pawn'), steps: async ({ page, size }) => { await piece('pawn')({ page }); if (!narrow(size)) await page.hover('.slot[data-piece="paladin"]'); } },
  ],
};
