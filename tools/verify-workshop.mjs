// The Workshop: the Proving Ground (docs/WORKSHOP.md; docs/specs/workshop-proving-ground, tickets 01 to 11).
// Groups: opens (the menu door, ‹ Menu and Esc, the focus back on the menu), poolPieces (each pool piece opens;
// the Pawn's and the Paladin's marks equal src/workshop/scene.test.ts), yours (the shelf designs in the ledge; a damaged entry's toast),
// link (a design link opens read only; a bad code shows the toast and no card face), keys (one tab stop, the arrow keys, the square
// labels, Enter and Space on a ledge slot keep the focus), refused (grey barred marks and their stamps), isolate (hover, a tap and
// Esc; the phone's stamps), knots (gold and cracked; a tap on each of three knots and the desktop toast), layouts (nine sizes: no sideways scroll, the
// top bar and the board in view, no cut text, 44 px targets, 24 px squares and knots; at 844 x 390, 667 x 375 and 568 x 320 of ticket 09, the
// short landscape form: the board as high as the screen less the top bar, the ledge's sheet from Pieces, the Why tag and the
// shelf as side sheets (from 375 px high, each seal in full above the sentence card), and 24 px nubs that keep most of their hit area), turnRefits (ticket 09: a turn from 390 x 844 to 844 x 390
// and back refits the board and keeps the design, the brush, an open Why tag, an open shelf and the Board tab), and the editor of ticket 02: paint (the brushes,
// the keys, Shot, Eraser, the three Mirror modes, the same paint twice, the reach and rule toasts, the nubs, the targets),
// firstCopy (the first paint makes "My Pawn" in Yours; a reload keeps it; the pool Pawn stays), undo (the scope, Ctrl or
// Cmd+Z, nothing under a sheet, a refused delete, back before the first edit), saveAlerts (a full shelf, a storage that
// throws, Copy link), shareLink (Share by the Enter key, then Copy link; the copied ?design= link, unchanged, opens the same design; a
// refused clipboard opens the copy sheet; fix 27: a press in it released on the backdrop keeps it, a tap there closes it) and weigh (the words; on the phone, ⋯ by the keys gives the focus back to ⋯);
// then the rules of ticket 03: shelf (S, Esc, Tab skips what the shelf covers, the groups, ✓ and dim seals, the preview,
// Stamp; the phone's bottom sheet), threeOfThree (the Add row, the dotted rows, the limit words), pill (no two 44 px buttons
// of the lines overlap, the row, the arrows, the preview, Esc, Enter, a refused choice), whenChip (the When choices, More
// choices, an asleep seal, "Always" for "moves like" with the queen's lines in the design, no choices for
// "takes again") and removeRule (the × of a line, Undo; the phone's rule card from a tap on the kept seal). The keys group also opens and closes the shelf with S.
// Then ticket 05: whyTag (a tap on d7 of the Paladin opens the Why tag with its parts; g7 says refused; a second tap, Esc and ×
// close it; Enter opens it; the frame, the rim notch and the pointer; a brush closes it and a tap in brush mode paints; the
// phone's bottom sheet stays inside the screen) and hoverOnly (hover or focus on the Beast's e5 shows f6, the barred g7 and
// their pips, and the pointer on another square keeps them while e5 has the focus; hover on the Archer's d6 shows its sight
// line; hover on the Ogre's d6 shows the follow; a tap on e5 keeps them under the tag; on the phone a tap shows them).
// Then ticket 06: tryWith (the tray and the plaque wait on the first open of a pool piece; the Pawn lifted to b4, where step 2
// sleeps, and to e2, where it wakes, by a tap, a drag and the keys; Esc puts it back; "Show on d2" from d6; Move here and
// Take back; Put an enemy here; the tokens; the promotion choice; the Guard's stopped threat and the eye; the die and the
// broom; the Beast's chain with Finish; a chain that a When starts keeps its next take; the Paladin removed too, and an enemy
// on its square; the Ogre's two actions; Undo after a promotion; "+5 moves" on a design that reads the move number only; the card
// box keeps the focus; the phone's Board tab and a real touch drag that does not scroll).
// Then ticket 07: newPiece (NEW makes a blank piece alone on d4 in brush mode, named by autoName; it saves on its first
// change, and Undo takes it back; it paints with Mirror; the phone), rename (the pen; a bad name is refused with its words; Esc;
// " (yours)" and the letter; a blur; a click on a brush or a piece keeps the name and acts once; on the phone, Rename in ⋯; an
// 18-letter name at 320 px), look (the look row of a piece made with NEW, none for a pool piece and its copy, which have Look
// in ⋯; a pool piece keeps its pool art until a figure; More with the 34 figures, the tag filter and the army; Esc and ×
// after a change give the focus back to More, else to ⋯; a reload keeps them; on the phone, Look in ⋯)
// and designMenu (⋯ of a pool piece, a copy and a link; Copy as text; Make a copy with the next free number; Delete asks
// first, then opens the pool piece the design came from, else the Pawn; a refused delete; the phone's items).
// Then ticket 08: shareSheet (the card face in the Share sheet: its name, figure, seals and sentences, worth and band word,
// no control in it; Send link with a device share, a cancel and a failure; Copy link; Copy as text; a refused clipboard; Esc;
// with no device share one Copy link; the phone's ⋯), linkCard (a link opens its face first; Keep a copy saves it and opens it,
// Yours; Open on the board saves nothing until the first edit, which keeps a copy with the next free name; Esc; the phone)
// and reachPopover (hover or focus on a ledge figure shows its 96 px reach diagram over it; away hides it; a resize to the
// phone layout hides it; none on the phone).
// Since ticket 08, link, shareLink, weigh and designMenu go through the card face and the Share sheet.
// Then ticket 10: motion (each motion of an action, on the desktop and the phone: the entry from the ledge, the kept rule's pill,
// the tag, Move here with its puffs, the lines at 3 of 3, the paint's ripple, the copy's flight to Yours, the lock, the
// seal's pulse and the stamp; each ends by 600 ms, by 300 ms at Fast, and 100 ms after that limit none runs; the still pose
// equals the pose with Animations Off and with reduced motion, which show none; the next tap, Fast, reduced motion and a
// close stop a running motion).
// Then ticket 12: rulesTab (the Rules tab: the 10 seals in their 6 groups, the laws in force as read-only words and the Fixed
// plaque; a seal opens at 168 px with its example, MATRIX row and Seen on, and the board shows its example piece with that rule
// kept; no editor keys there; Seen on opens the pool piece with the rule kept; the phone has no laws and a 56 px seal).
// Then ticket 15: seeAll (See all at the end of Yours, and none with an empty shelf; a full-screen grid of the 11 pool pieces
// and the designs, each a 44 px face; the All / Pool / Yours filter; Esc; a tap opens the design on the board with the focus
// on its slot; the phone's two columns; in short landscape the grid opens over the ledge's sheet; a full shelf's "Choose one
// to delete" shows only the designs, each with Delete, and a delete saves the open copy).
// Then ticket 13: kings (the Kings tab's six kings; the Mud king on the plinth with his two powers, their coins and words, and no
// mini boards; Leap armed on the Rook: the power marks of G22 rook-leap with the arch, the stamp and the line; a tap on d5 plays it,
// spends a notch, and Take back gives it back; the King socket's SEAT A KING and Esc; Freeze on the Paladin's d7: the frost with
// one turn, then "No Freeze uses left."; Leap on the Paladin is an echo, "="; a copy's socket says that powers wait; the phone's
// Board tab and Kings tab).
// Then ticket 14: labCards (the Cards tab (LAB): the fan of the 10 cards with art, the "+15" stack that spreads and "‹ Back"; the
// Freeze card on the plinth with its art, words and LAB ribbon, its king, the burgundy plaque; its picks as runes on the Paladin's
// board, the king's rune barred and the piece's own marks stepped back; d7 plays it: frost, and Take back gives it back; a second
// form; LAY A LAB CARD and Esc; Leap laid on the Rook; one power or one card at a time; a copy's slot waits; the phone).
// Run it with `npm run check:browser workshop`.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pressMenu } from './app-ui.mjs';
import { assertNoErrors, env, imageIs, insideViewport, launch, minTarget, noRunningAnimations, noSidewaysScroll, shot, textNotCut, trapErrors } from './lib/checks.mjs';

const base = env('PLAYABLE_URL');
const POOL = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'archer', 'paladin', 'guard', 'maester', 'beast', 'ogre'];
/** The marks of the scene test (src/workshop/scene.test.ts, the hand scenes of the mockup). */
const PAWN = ['c5 take', 'd5 move', 'd6 move asleep', 'e5 take'];
const PALADIN = [
  ...'d6 e5 f6 e4 f4 g4 h4 e3 f2 g1 d3 d2 d1 c3 a1 c4 b4 a4 c5'.split(' ').map(q => `${q} move`), 'd7 take', 'b6 take', 'g7 blocked',
].sort();
/** The Rook Rider of the old W12 sample as a ?design= link. */
const RIDER = { kind: 'piece', name: 'Rook Rider', look: { figure: 'antler-guardian', body: 'token', auto: true, glow: null, army: 0 }, letter: 'D',
  squares: [{ x: 1, y: 2, mark: 'both' }, { x: -1, y: 2, mark: 'both' }], lines: ['n', 'e', 's', 'w'], rules: [] };
const code = Buffer.from(JSON.stringify(RIDER)).toString('base64url');
/** Two shelf designs as saveDesign writes them (src/workshop/compat.test.ts): a Knight copy and a token that moves like a queen on d4. */
const SHELF = JSON.stringify({ v: 1, designs: [
  { v: 1, kind: 'piece', id: 'golden-a', name: 'Jumper', named: true, look: { body: 'N', auto: false, glow: null, army: 0 }, letter: 'J', ownLetter: true,
    squares: [[1, 2], [-1, 2], [1, -2], [-1, -2], [2, 1], [-2, 1], [2, -1], [-2, -1]].map(([x, y]) => ({ x, y, mark: 'both' })), lines: [], rules: [], from: ['knight'], updated: 1760000000000 },
  { v: 1, kind: 'piece', id: 'golden-b', name: 'Old Ward', named: false, look: { body: 'token', auto: true, glow: 'Shadow', army: 1, figure: 'ram-bastion' }, letter: 'U',
    squares: [{ x: 0, y: 1, mark: 'move' }], lines: ['ne', 'nw'], rules: [{ when: { on: 'zone', zone: 'capital' }, does: { a: 'movesLike', as: 'queen' } }], from: [], updated: 1759000000000 },
] });
/** My Beast of the mockup (scenes.js:200-214): the Beast, removed too after a piece, and after anything. */
const beast = (id, what) => ({ v: 1, kind: 'piece', id, name: `My Beast ${what}`, named: true, look: { body: 'S', auto: false, glow: null, army: 0 }, letter: 'Y', ownLetter: false,
  squares: [[-1, 1], [0, 1], [1, 1], [-1, 0], [1, 0], [-1, -1], [0, -1], [1, -1]].map(([x, y]) => ({ x, y, mark: 'both' })), lines: [],
  rules: [{ when: { on: 'takes' }, does: { a: 'chain' } }, { when: { on: 'takes' }, does: { a: 'removedAfter', what } }], from: ['beast'], updated: 1760000000000 });
/** A Paladin copy with three knots (I-II, I-III, II-III): it moves like a queen on a center square, its lines pass, it is removed too. */
const PALADIN3 = { v: 1, kind: 'piece', id: 'paladin3', name: 'Three Knots', named: true, look: { body: 'L', auto: false, glow: null, army: 0 }, letter: 'Y', ownLetter: false,
  squares: [], lines: [], rules: [{ when: { on: 'zone', zone: 'capital' }, does: { a: 'movesLike', as: 'queen' } }, { when: { on: 'always' }, does: { a: 'linesPass', over: 'own' } },
    { when: { on: 'takes' }, does: { a: 'removedAfter', what: 'piece' } }], from: ['paladin'], updated: 1760000000000 };
const KNOTTED = JSON.stringify({ v: 1, designs: [beast('mybeast', 'piece'), beast('mybeast-any', 'any'), PALADIN3] });

const browser = await launch();

/** A page at `query` with the game ready; `shelf` seeds the Workshop shelf; `motion` records the motions (ticket 10). */
async function open(query = '', { width = 1440, height = 900, shelf, motion, reducedMotion } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, hasTouch: width < 721 || height <= 500, reducedMotion });
  await ctx.addInitScript(() => sessionStorage.setItem('kingdown.title-seen', '1'));
  if (shelf) await ctx.addInitScript(v => localStorage.setItem('kingdown.workshop', v), shelf);
  if (motion) await ctx.addInitScript(recordMotion);
  const p = await ctx.newPage();
  trapErrors(p);
  await p.goto(new URL(query, base).href);
  await p.waitForFunction(() => window.view?.ready);
  await p.evaluate(() => window.view.ready());
  return p;
}
const door = async p => { await pressMenu(p, 'Workshop'); await p.locator('#workshop.pg[open]').waitFor(); };
/** The marks on the board as "square kind [cond]", sorted. */
const marks = p => p.$$eval('.pg-board [data-sq]:not(.kdm-ghost)', gs => gs.map(g => [g.dataset.sq, g.dataset.k, g.dataset.cond].filter(Boolean).join(' ')).sort());
const name = p => p.locator('.pg-name h3').textContent();
const focused = p => p.evaluate(() => document.activeElement?.dataset.sq ?? document.activeElement?.id ?? '');
/** Brush mode (ticket 02): arm a brush or tool, tap a square, read the toast, the lines, the nubs and the shelf. */
const arm = (p, k) => p.click(`[data-brush="${k}"]`);
const tap = (p, q) => p.click(`.sq[data-sq="${q}"]`);
const toast = p => p.locator('.pg-toast').textContent();
/** A copy ends after a promise: the toast gets up to 3 s to say `text`. */
async function copied(p, why) {
  await p.locator('.pg-toast', { hasText: 'Link copied.' }).waitFor({ timeout: 3000 }).catch(() => {});
  assert.equal(await toast(p), 'Link copied.', why);
}
/** Ticket 08: the open sheet and the card face in it. */
const SHEET = '.pg-sheet[open]', FACE = `${SHEET} .pg-face`;
const rails = p => p.$$eval('.pg-board [data-k="line"]', gs => gs.map(g => `${g.dataset.to} ${g.dataset.end}`).sort());
const nubsOn = p => p.$$eval('.nub[aria-pressed="true"]', b => b.map(n => n.dataset.nub).sort());
const stored = p => p.evaluate(() => JSON.parse(localStorage.getItem('kingdown.workshop') ?? '{"designs":[]}').designs);
/** The storage refuses each write until `window.unbreak()`. */
const refuse = p => p.evaluate(() => {
  const set = Storage.prototype.setItem;
  window.unbreak = () => { Storage.prototype.setItem = set; };
  Storage.prototype.setItem = () => { throw new Error('refused'); };
});
/** Ticket 03: the short lines on the plinth, the focus on `sel`, the preview parts, and a rule stamped from the shelf. */
const lines = p => p.$$eval('.pg-lines .sline:not(.add, .empty) .l2', ls => ls.map(l => l.textContent));
const focusOn = (p, sel) => p.$eval(sel, e => e === document.activeElement);
const previewed = p => p.locator('.pg-board [data-pv]').count();
/** The pairs of targets in `sel` whose boxes overlap: each 44 px button has its own area (decision 9). */
const overlaps = (p, sel) => p.$$eval(sel, bs => bs.flatMap((b, i) => bs.slice(i + 1).filter(c => {
  const r = b.getBoundingClientRect(), s = c.getBoundingClientRect();
  return Math.min(r.bottom, s.bottom) - Math.max(r.top, s.top) > 0.5 && Math.min(r.right, s.right) - Math.max(r.left, s.left) > 0.5;
}).map(c => `${b.textContent} and ${c.textContent}`)));
async function stampRule(p, a) {
  await p.click('[data-act="shelf"]');
  await p.click(`[data-sealitem="${a}"]`);
  await p.click('[data-act="stamp"]');
}
async function has(p, want, why) {
  const m = await marks(p);
  for (const w of want) assert.ok(m.includes(w), `${why}: no ${w} in ${m.join(', ')}`);
  return m;
}
/** The isolate class of the mark on each square: kdm-iso, kdm-dim or null (the ripple's class of ticket 10 does not count). */
const iso = (p, ...sqs) => Promise.all(sqs.map(sq => p.$eval(`.pg-board [data-sq="${sq}"]`, g => ['kdm-iso', 'kdm-dim'].find(c => g.classList.contains(c)) ?? null)));
const clearToast = p => p.$eval('.pg-toast', t => { t.textContent = ''; });
/** Ticket 05: the open Why tag (its square, occupant, count ring, the captions of its parts and its note), or null. */
const tag = p => p.evaluate(() => {
  const t = document.querySelector('.pg-why:not([hidden]) .tag');
  return t && { sq: t.querySelector('.sqn').textContent, occ: t.querySelector('.occ').textContent, count: t.querySelector('.count-ring')?.textContent ?? '',
    parts: [...t.querySelectorAll('.part small')].map(x => x.textContent), foot: t.querySelector('.why-foot')?.textContent ?? '' };
});
/** The hover-only parts on the board, as "on-square: kind square". */
const onParts = p => p.$$eval('.pg-board [data-on]', gs => gs.map(g => `${g.dataset.on}: ${g.dataset.k ?? 'stamp'} ${g.dataset.sq ?? g.dataset.at ?? g.dataset.to ?? g.dataset.stamp}`).sort());
const middle = async (p, sel) => { const b = await p.locator(sel).boundingBox(); return b.y + b.height / 2; };
/** Ticket 06: the buttons at the foot of the Why tag, the open piece's square, the pieces on the board, and a drag from square a to b. */
const acts = p => p.$$eval('.pg-why .why-act button', bs => bs.map(b => b.textContent));
const openSq = p => p.$eval('.pg-hits .sq.is-open', b => b.dataset.sq).catch(() => null);
const figures = p => p.locator('.pg-board image[filter="url(#kdm-rim)"]').count();
async function drag(p, a, b, touch = false) {
  const at = async q => { const r = await p.locator(`.sq[data-sq="${q}"]`).boundingBox(); return [r.x + r.width / 2, r.y + r.height / 2]; };
  const [[x0, y0], [x1, y1]] = [await at(a), await at(b)];
  if (touch) {
    // Real touch events (as verify-cursor-adoption.mjs sends them): the browser decides between a drag and a scroll.
    const cdp = await p.context().newCDPSession(p), go = (type, i) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: x0 + (x1 - x0) * i / 8, y: y0 + (y1 - y0) * i / 8 }] });
    await go('touchStart', 0);
    for (let i = 1; i <= 8; i++) await go('touchMove', i);
    return go('touchEnd');
  }
  await p.mouse.move(x0, y0);
  await p.mouse.down();
  await p.mouse.move(x1, y1, { steps: 8 });
  await p.mouse.up();
}

async function opens() {
  const p = await open();
  await door(p);
  assert.equal(await p.getAttribute('#workshop', 'aria-labelledby'), 'pg-h', 'the dialog is named by its title');
  assert.equal(await name(p), 'Pawn', 'the Workshop opens on the Pawn');
  await p.click('.pg-menu');
  assert.equal(await p.locator('#workshop[open]').count(), 0, '‹ Menu closes the Workshop');
  assert.equal(await focused(p), 'menu-btn', '‹ Menu gives the focus back to the menu');
  await door(p);
  await p.keyboard.press('Escape');
  assert.equal(await p.locator('#workshop[open]').count(), 0, 'Esc closes the Workshop');
  assert.equal(await focused(p), 'menu-btn', 'Esc gives the focus back to the menu');
  await p.context().close();
}

async function poolPieces() {
  const p = await open();
  await door(p);
  assert.deepEqual(await p.$$eval('.slot[data-piece]', s => s.map(b => b.dataset.piece)), POOL, 'the ledge holds the 11 pool pieces in order');
  assert.equal(await p.locator('.lhead').count(), 0, 'an empty shelf shows no Yours divider');
  for (const key of POOL) {
    await p.click(`.slot[data-piece="${key}"]`);
    assert.equal((await name(p)).toLowerCase(), key, `${key}: the plinth names it`);
    assert.equal(await p.getAttribute('.slot[aria-current="true"]', 'data-piece'), key, `${key}: its slot is the open one`);
    await imageIs(p, '.pg-figure img', `ui/pieces/${key}-w.webp`);
    assert.ok((await marks(p)).length > 0, `${key}: the board shows its marks`);
    if (key === 'pawn') assert.deepEqual(await marks(p), PAWN, 'the Pawn marks equal the scene test');
    if (key !== 'paladin') continue;
    assert.deepEqual(await marks(p), PALADIN, 'the Paladin marks equal the scene test');
    assert.equal(await p.locator('.sline').count(), 3, 'the Paladin has 3 rule lines');
    assert.deepEqual(await p.$$eval('.pg-board [data-k="arch"]', gs => gs.map(g => g.dataset.over).sort()), ['b2', 'd5'], 'the Paladin hops its own pieces on b2 and d5');
  }
  await p.click('.slot[data-piece="maester"]');
  assert.deepEqual(await p.$$eval('.pg-board [data-k="swap"]', gs => gs.map(g => g.dataset.to).sort()), ['d3', 'e4'], 'the Maester swaps with its friends');
  await p.click('.slot[data-piece="ogre"]');
  assert.ok(await p.locator('.pg-board [data-k="push"]').count() > 0, 'the Ogre pushes');
  await shot(p, 'ogre-1440');
  await p.context().close();
}

async function yours() {
  const p = await open('', { shelf: SHELF.replace(/]}$/, ',{"id":"damaged","y":4}]}') });
  await door(p);
  assert.equal(await toast(p), '1 saved entry could not be read. It stays on this device; the other designs work.', 'a damaged entry: the toast tells that it stays');
  assert.equal(await p.locator('.lhead').textContent(), 'Yours', 'the shelf designs follow a Yours divider');
  assert.deepEqual(await p.$$eval('.slot[data-design]', s => s.map(b => b.dataset.design)), ['golden-a', 'golden-b'], 'the ledge holds the shelf designs');
  await p.click('.slot[data-design="golden-a"]');
  assert.equal(await name(p), 'Jumper', 'a tap opens the shelf design');
  assert.equal(await p.locator('.pg-name .tag-yours').count(), 1, 'a shelf design is Yours');
  assert.equal(await p.locator('.pg-name .from').textContent(), 'from Knight', 'a copy names its pool piece');
  await p.click('.slot[data-design="golden-b"]');
  await imageIs(p, '.pg-figure img', 'ui/workshop/ram-bastion-b.webp');
  assert.ok((await marks(p)).some(m => m.endsWith(' awake')), 'a rule whose When holds on d4 shows awake marks');
  await p.context().close();
}

async function link() {
  const p = await open(`?design=${code}`);
  await p.locator(FACE).waitFor();
  await p.click('.pg-sheet [data-board]');
  assert.equal(await name(p), 'Rook Rider', 'a design link opens that design');
  assert.equal(new URL(p.url()).searchParams.has('design'), false, 'the link leaves the address');
  assert.equal(await p.locator('.slot[aria-current]').count(), 0, 'no ledge slot is open');
  assert.equal(await p.locator('#workshop :is(input, textarea, select, [contenteditable])').count(), 0, 'a linked design is read only');
  const before = await marks(p);
  assert.ok(before.includes('e6 both') && before.includes('c6 both'), 'the board shows its painted squares');
  await p.click('.sq[data-sq="d8"]');
  assert.deepEqual(await marks(p), before, 'a tap on the board changes nothing');
  await p.context().close();
  const bad = await open('?design=not-a-design');
  await bad.locator('#workshop.pg[open]').waitFor();
  assert.equal(await bad.locator('.pg-toast').textContent(), 'This design link could not be read.', 'a bad code shows the toast');
  assert.equal(await name(bad), 'Pawn', 'a bad code opens the Pawn');
  assert.equal(await bad.locator('.pg-sheet').count(), 0, 'a bad code opens no card face');
  await bad.context().close();
}

async function keys() {
  const p = await open();
  await door(p);
  assert.equal(await p.locator('.pg-hits[role="grid"] [role="row"] .sq[role="gridcell"]').count(), 64, 'the board is a grid of 64 squares');
  assert.deepEqual(await p.$$eval('.sq[tabindex="0"]', s => s.map(b => b.dataset.sq)), ['d4'], 'one tab stop, on the open piece');
  const label = sq => p.getAttribute(`.sq[data-sq="${sq}"]`, 'aria-label');
  assert.deepEqual(await Promise.all(['d4', 'd5', 'c5', 'd6', 'a1'].map(label)),
    ['d4: white pawn.', 'd5: move.', 'c5: take only.', 'd6: asleep here.', 'a1: empty.'], 'each square names its mark and its piece');
  await p.focus('.sq[data-sq="d4"]');
  for (const [key, want] of [['ArrowUp', 'd5'], ['ArrowRight', 'e5'], ['ArrowDown', 'e4'], ['ArrowLeft', 'd4']]) {
    await p.keyboard.press(key);
    assert.equal(await focused(p), want, `${key} moves to ${want}`);
  }
  await p.focus('.sq[data-sq="a1"]');
  await p.keyboard.press('ArrowLeft');
  await p.keyboard.press('ArrowDown');
  assert.equal(await focused(p), 'a1', 'the arrows stop at the edge');
  assert.deepEqual(await p.$$eval('.sq[tabindex="0"]', s => s.map(b => b.dataset.sq)), ['a1'], 'the tab stop follows the arrows');
  await p.keyboard.press('Tab');
  assert.equal(await p.evaluate(() => document.activeElement?.classList.contains('sq')), false, 'Tab leaves the board');
  const slot = () => p.evaluate(() => document.activeElement?.dataset.piece);
  await p.focus('.slot[data-piece="knight"]');
  await p.keyboard.press('Enter');
  assert.equal(await name(p), 'Knight', 'Enter on a ledge slot opens its piece');
  assert.equal(await slot(), 'knight', 'the focus stays on the slot that Enter opens');
  await p.keyboard.press('Tab');
  assert.equal(await slot(), 'bishop', 'Tab goes on to the next slot');
  await p.keyboard.press('Space');
  assert.equal(await name(p), 'Bishop', 'Space on a ledge slot opens its piece');
  assert.equal(await slot(), 'bishop', 'the focus stays on the slot that Space opens');
  await p.keyboard.press('s');
  assert.equal(await p.locator('.pg-shelf').isVisible(), true, 'S opens the Rules shelf');
  await p.keyboard.press('s');
  assert.equal(await p.locator('.pg-shelf').isVisible(), false, 'S again closes it');
  assert.equal(await focusOn(p, '[data-act="shelf"]'), true, 'and the focus goes to the Add row');
  await p.context().close();
}

async function refused() {
  const p = await open();
  await door(p);
  await p.click('.slot[data-piece="paladin"]');
  const g7 = await p.$eval('.pg-board [data-sq="g7"]', g => g.innerHTML);
  assert.ok(g7.includes('#4d453c') && !g7.includes('#d63428'), 'the refused king on g7 is grey, not red');
  assert.equal(await p.locator('.pg-board [data-badge="g7"] line[stroke="#4d453c"]').count(), 2, 'the refused badge and the feet have a bar');
  assert.equal(await p.getAttribute('.pg-board [data-k="line"][data-to="g7"]', 'data-end'), 'blocked', 'the line to g7 ends in a bar');
  assert.equal(await p.getAttribute('.pg-board [data-stamp="g7"]', 'data-a'), 'cannotTake', 'g7 has the stamp of "cannot take"');
  assert.equal(await p.getAttribute('.pg-board [data-stamp="d7"]', 'data-a'), 'linesPass removedAfter', 'd7 has the stamps of both rules that shape it');
  assert.equal(await p.getAttribute('.sq[data-sq="g7"]', 'aria-label'), 'g7: refused, cannot take a king, black king.', 'the label names the rule that refuses g7');
  assert.ok((await p.locator('.pg-keyrow').textContent()).includes('Refused'), 'the key row names the refused mark');
  await p.click('.slot[data-piece="ogre"]');
  assert.ok((await marks(p)).includes('c3 blocked'), 'the Ogre cannot take the guard on c3');
  assert.equal(await p.getAttribute('.pg-board [data-stamp="c3"]', 'data-a'), 'cannotBeTaken', 'c3 has the stamp of the table rule');
  assert.equal(await p.getAttribute('.sq[data-sq="c3"]', 'aria-label'), 'c3: refused, only a king takes a guard, black guard.', 'the label names the table rule');
  await p.context().close();
}

async function isolate() {
  const p = await open();
  await door(p);
  await p.hover('.sline[data-seal="0"] .l2');
  assert.equal(await p.locator('.pg-board [data-k="chalk"][data-zone="startRank"]').count(), 1, 'the Pawn\'s rule I shows its zone in chalk');
  await p.click('.slot[data-piece="paladin"]');
  assert.deepEqual(await iso(p, 'd6', 'g7'), [null, null], 'with no isolate, no mark steps back');
  await p.hover('.sline[data-seal="1"] .l2');
  assert.deepEqual(await iso(p, 'g7', 'd6'), ['kdm-iso', 'kdm-dim'], 'hover on rule II shows only its marks');
  await p.mouse.move(1430, 450);
  assert.deepEqual(await iso(p, 'g7', 'd6'), [null, null], 'the isolate ends when the pointer goes');
  await p.click('.sline[data-seal="0"] .l2');
  assert.equal(await p.getAttribute('.sline[data-seal="0"] .sl-seal', 'aria-pressed'), 'true', 'a tap keeps rule I');
  assert.deepEqual(await p.$$eval('.sline', ls => ls.map(l => l.className)), ['sline is-focus', 'sline is-other', 'sline is-other'], 'the other lines step back');
  await p.hover('.sline[data-seal="1"] .l2');
  assert.deepEqual(await iso(p, 'd6', 'g7'), ['kdm-iso', 'kdm-dim'], 'the kept rule stays under a hover on another rule');
  await p.keyboard.press('Escape');
  assert.equal(await p.locator('#workshop[open]').count(), 1, 'Esc stops the isolate and keeps the Workshop open');
  assert.equal(await p.getAttribute('.sline[data-seal="0"] .sl-seal', 'aria-pressed'), 'false', 'Esc lets rule I go');
  // The last control of rule II's line is its × (ticket 03); Tab goes on to the seal of rule III.
  await p.focus('.sline[data-seal="1"] [data-rm]');
  await p.keyboard.press('Tab');
  assert.deepEqual(await iso(p, 'd7', 'g7'), ['kdm-iso', 'kdm-dim'], 'Tab to the seal of rule III shows only its marks');
  await p.keyboard.press('Enter');
  assert.equal(await p.getAttribute('.sline[data-seal="2"] .sl-seal', 'aria-pressed'), 'true', 'Enter keeps rule III');
  assert.equal(await p.evaluate(() => document.activeElement?.closest('.sline')?.dataset.seal), '2', 'the focus stays on the seal of rule III');
  await p.keyboard.press('Enter');
  assert.equal(await p.getAttribute('.sline[data-seal="2"] .sl-seal', 'aria-pressed'), 'false', 'a second Enter lets it go');
  assert.deepEqual(await iso(p, 'd7', 'g7'), [null, null], 'a second Enter shows all marks again');
  await p.keyboard.press('Enter');
  await p.keyboard.press('Escape');
  assert.equal(await p.getAttribute('.sline[data-seal="2"] .sl-seal', 'aria-pressed'), 'false', 'Esc lets the kept rule III go');
  assert.deepEqual(await iso(p, 'd7', 'g7'), [null, null], 'Esc shows all marks again');
  await p.context().close();
  // The phone: the seals are the buttons; the stamps show for the kept rule only, and no knot toast.
  const ph = await open('', { width: 390, height: 844 });
  await door(ph);
  await ph.click('.slot[data-piece="paladin"]');
  assert.equal(await ph.locator('.pg-board [data-stamp]').count(), 0, 'the phone shows no stamps until a rule is kept');
  await ph.click('.pg-pseals [data-seal="1"]');
  assert.equal(await ph.getAttribute('.pg-pseals [data-seal="1"]', 'aria-pressed'), 'true', 'a tap on a seal keeps its rule');
  assert.deepEqual(await ph.$$eval('.pg-board [data-stamp]', gs => gs.map(g => `${g.dataset.stamp} ${g.dataset.a}`)), ['g7 cannotTake'], 'the phone shows the stamps of the kept rule only');
  await ph.click('.pg-pseals [data-seal="2"]');
  assert.equal(await toast(ph), '', 'the phone shows no knot words on an isolate');
  await ph.context().close();
}

async function knots() {
  const p = await open('', { shelf: KNOTTED });
  await door(p);
  assert.equal(await p.locator('.knot').count(), 0, 'two rules that never meet have no knot (the Pawn)');
  await p.click('.slot[data-piece="paladin"]');
  const k = p.locator('.knot');
  assert.equal(await k.getAttribute('aria-label'), 'Both shape d7.', 'the Paladin has a gold knot');
  await minTarget(p, '#workshop .knot', 24);
  await p.click('.sline[data-seal="2"] .l2');
  assert.equal(await toast(p), 'Both shape d7.', 'on the desktop, isolating rule III shows its gold knot\'s words');
  await clearToast(p);
  await p.click('.sline[data-seal="1"] .l2');
  assert.equal(await toast(p), '', 'a rule with no gold knot shows no words');
  await k.click();
  assert.equal(await toast(p), 'Both shape d7.', 'a tap on the knot shows its words');
  assert.equal(await k.getAttribute('aria-pressed'), 'true', 'a tap keeps the knot');
  assert.deepEqual(await iso(p, 'd7', 'd6'), ['kdm-iso', 'kdm-dim'], 'the knot shows the squares that need both rules');
  assert.equal(await p.locator('.sline.is-focus').count(), 0, 'a knot keeps no rule');
  await k.click();
  assert.deepEqual(await iso(p, 'd7', 'd6'), [null, null], 'a second tap lets the knot go');
  await p.click('.slot[data-design="mybeast"]');
  assert.deepEqual(await p.$$eval('.knot', ks => ks.map(x => x.ariaLabel)), ['Both shape f6.'], 'My Beast, removed after a piece: a gold knot');
  await p.click('.slot[data-design="mybeast-any"]');
  assert.deepEqual(await p.$$eval('.knot', ks => ks.map(x => x.ariaLabel)), ['Removed too stops Takes again.'], 'My Beast, removed after anything: a cracked knot');
  await shot(p, 'beast-cancel-1440');
  // Three knots: the knot from rule I to rule III has its own gutter, so a pointer reaches each knot.
  await p.click('.slot[data-design="paladin3"]');
  const words = await p.$$eval('.knot', ks => ks.map(x => x.ariaLabel));
  assert.deepEqual(words, ['Both shape d6, a1 and d7.', 'Both shape d7 and g7.', 'Both shape d7.'], 'the Paladin copy has three gold knots');
  await minTarget(p, '#workshop .knot', 24);
  for (const [i, w] of words.entries()) {
    await p.click(`.knot[data-knot="${i}"]`, { timeout: 2000 });
    assert.equal(await p.getAttribute(`.knot[data-knot="${i}"]`, 'aria-pressed'), 'true', `a tap keeps knot ${i}`);
    assert.equal(await toast(p), w, `a tap on knot ${i} shows its words`);
  }
  await shot(p, 'three-knots-1440');
  await p.context().close();
}

async function layouts() {
  for (const [width, height] of [[1440, 900], [1280, 800], [1024, 768], [768, 1024], [390, 844], [320, 568], [844, 390], [667, 375], [568, 320]]) {
    const p = await open('', { width, height }), side = height <= 500, size = `${width}x${height}`;
    await door(p);
    assert.equal(await p.locator('[data-act="pieces"]').isVisible(), side, `${size}: Pieces shows in short landscape only`);
    for (const piece of ['pawn', 'paladin']) {
      // Short landscape (ticket 09): Pieces opens the ledge as a sheet, and a choice closes it.
      if (side) await p.click('[data-act="pieces"]');
      await p.click(`.slot[data-piece="${piece}"]`);
      await noSidewaysScroll(p, '#workshop');
      await noSidewaysScroll(p);
      await insideViewport(p, '.pg-top');
      await insideViewport(p, '.pg-field');
      await textNotCut(p, '.pg-title, .pg-name h3, .slot .nm, .brush .w, .ltab, .pg-pieces');
      if (width >= 1000) await textNotCut(p, '.sline .l2');
      await minTarget(p, '#workshop button:not(.sq, .knot)', 44);
      if (piece === 'paladin' && width >= 1000) await minTarget(p, '#workshop .knot', 24);
      await minTarget(p, '#workshop .sq', width <= 320 ? 36 : 24);
      assert.equal(await p.locator('.pg-keyrow').isVisible(), width >= 1000, `${size}: the key row shows on the wide layout only`);
      if (side) {
        assert.equal(await p.isHidden('.pg-ledge'), true, `${size}: a choice in the ledge's sheet closes it`);
        const f = await p.locator('.pg-field').boundingBox(), c = await p.locator('.pg-plinth').boundingBox();
        assert.ok(Math.abs(f.height - (height - 56)) < 1 && f.x + f.width < c.x, `${size}: the board is on the left of the column, ${height - 56} px high (${f.height})`);
        // The second open shows the tray: the plinth strip, the brush row and the tray fit the column with no scroll.
        await insideViewport(p, `.pg-plinth, .pg-brushes, .pg-pieces${piece === 'paladin' ? ', .pg-tray' : ''}`);
        await textNotCut(p, '.pg-right');
      }
      await shot(p, `${piece}-${size}`);
    }
    if (side) await landscape(p, size);
    await p.context().close();
  }
}

/** Short landscape (ticket 09), on the Paladin: the ledge's sheet (the focus, the keys, Esc, a tap outside it), the Why tag and
 *  the Rules shelf as side sheets beside the board, and brush mode: 24 px nubs that keep most of their hit area, the squares
 *  round d4 free for paint, and the tools inside the screen. */
async function landscape(p, size) {
  await p.click('[data-act="pieces"]');
  await insideViewport(p, '.pg-ledge');
  await minTarget(p, '.pg-ledge button', 44);
  assert.equal(await p.evaluate(() => document.activeElement?.dataset.piece), 'paladin', `${size}: the focus goes to the open slot of the sheet`);
  assert.equal(await p.getAttribute('.pg-pieces', 'aria-expanded'), 'true', `${size}: Pieces says that the sheet is open`);
  await shot(p, `ledge-${size}`);
  await p.keyboard.press('s');
  assert.equal(await p.isHidden('.pg-shelf'), true, `${size}: under the sheet S does nothing`);
  await p.keyboard.press('Escape');
  assert.equal(await p.isHidden('.pg-ledge'), true, `${size}: Esc closes the sheet`);
  assert.equal(await p.locator('#workshop[open]').count(), 1, `${size}: Esc closes the sheet, not the Workshop`);
  assert.equal(await focusOn(p, '.pg-pieces'), true, `${size}: the focus goes back to Pieces`);
  await p.click('[data-act="pieces"]');
  const d7 = await p.locator('.sq[data-sq="d7"]').boundingBox();
  await p.mouse.click(d7.x + d7.width / 2, d7.y + d7.height / 2);
  assert.equal(await p.isHidden('.pg-ledge'), true, `${size}: a tap outside the sheet closes it`);
  assert.equal(await tag(p), null, `${size}: and does nothing else`);
  await p.click('[data-act="pieces"]');
  await p.click('.pg-menu');
  assert.deepEqual([await p.isHidden('.pg-ledge'), await p.locator('#workshop[open]').count()], [true, 1], `${size}: a tap on ‹ Menu closes the sheet, not the Workshop`);
  // The Why tag: a side sheet over the column, beside the board.
  await tap(p, 'd7');
  assert.equal((await tag(p))?.sq, 'd7', `${size}: a tap on d7 opens its tag`);
  const f = await p.locator('.pg-field').boundingBox(), w = await p.locator('.pg-why .tag').boundingBox();
  assert.ok(w.x >= f.x + f.width && w.y < f.y + 8, `${size}: the tag is a side sheet beside the board`);
  await insideViewport(p, '.pg-why .tag, .pg-why button');
  await textNotCut(p, '.why-sum small, .why-foot');
  await minTarget(p, '.pg-why button', 44);
  assert.equal(await p.evaluate(() => document.querySelector('.pg-plinth').inert && document.querySelector('.pg-tray').inert), true, `${size}: the plinth strip and the tray under the tag leave the Tab order`);
  await shot(p, `why-${size}`);
  // Pieces opens its sheet over the tag, and Esc closes the sheet only.
  await p.click('[data-act="pieces"]');
  assert.equal(await p.evaluate(() => !document.querySelector('.pg-ledge').closest('[inert]') && !!document.activeElement?.closest('.pg-ledge')), true, `${size}: the sheet over the tag takes the focus and taps`);
  await p.keyboard.press('Escape');
  assert.equal((await tag(p))?.sq, 'd7', `${size}: the tag stays open under the closed sheet`);
  await p.keyboard.press('Escape');
  // The Rules shelf of the Pawn, with "Moves like" picked: a side sheet with its sentence card and Stamp in the screen.
  await p.click('[data-act="pieces"]');
  await p.click('.slot[data-piece="pawn"]');
  await p.click('[data-act="shelf"]');
  await p.click('[data-sealitem="movesLike"]');
  assert.ok(await previewed(p) > 0, `${size}: the board beside the shelf previews the rule`);
  assert.ok((await p.locator('.pg-shelf').boundingBox()).x >= f.x + f.width, `${size}: the shelf is a side sheet beside the board`);
  await insideViewport(p, '.pg-shelf, .pg-shelf .sentence, .pg-stamp');
  await minTarget(p, '.pg-shelf button', 44);
  // From 375 px high, each seal shows in full above the sentence card, with no scroll (owner, 2026-10-11).
  if (parseInt(size.split('x')[1]) >= 375) {
    const hid = await p.$$eval('.pg-shelf .sbtn', bs => bs.filter(b => {
      const r = b.getBoundingClientRect(), g = b.closest('.groups').getBoundingClientRect(), s = document.querySelector('.pg-shelf .sentence').getBoundingClientRect();
      return r.top < g.top || r.bottom > Math.min(g.bottom, s.top) + 0.5;
    }).map(b => b.dataset.sealitem));
    assert.deepEqual(hid, [], `${size}: each seal of the shelf shows in full above the sentence card`);
    assert.deepEqual(await overlaps(p, '.pg-shelf button, .pg-shelf h4'), [], `${size}: no seal, group name or Stamp covers another`);
  }
  await shot(p, `shelf-${size}`);
  await p.keyboard.press('Escape');
  // Brush mode: each nub keeps 24 px and most of its hit area (the 390 px phone's ring), and the 8 squares round d4 take paint.
  await arm(p, 'both');
  await minTarget(p, '#workshop .nub', 24);
  const hits = await p.$$eval('.nub', ns => ns.map(n => {
    const r = n.getBoundingClientRect(), cx = r.x + r.width / 2, cy = r.y + r.height / 2;
    let own = 0, all = 0;
    for (let x = r.x + 0.5; x < r.right; x++) for (let y = r.y + 0.5; y < r.bottom; y++) {
      if ((x - cx) ** 2 + (y - cy) ** 2 > 144) continue;
      all++;
      if (document.elementFromPoint(x, y)?.closest('.nub') === n) own++;
    }
    return [n.dataset.nub, own / all];
  }));
  for (const [l, own] of hits) assert.ok(own >= 0.6, `${size}: the ${l} nub takes a tap on ${Math.round(own * 100)}% of its 24 px circle, not 60%`);
  const free = await p.$$eval('.sq', bs => bs.filter(b => ['c5', 'd5', 'e5', 'c4', 'e4', 'c3', 'd3', 'e3'].includes(b.dataset.sq))
    .map(b => { const r = b.getBoundingClientRect(); return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) === b; }));
  assert.deepEqual(free, Array(8).fill(true), `${size}: no nub covers the centre of a square round d4`);
  await p.click('[data-act="tools"]');
  await insideViewport(p, '.pg-tools');
  await minTarget(p, '#workshop button:not(.sq, .nub)', 44);
  await shot(p, `paint-${size}`);
  // Enter on a card in the sheet opens it and closes the sheet: the focus goes back to Pieces (review 14).
  await p.keyboard.press('Escape');
  await p.click('[data-act="pieces"]');
  await p.click('[data-tab="cards"]');
  await p.focus('.cface[data-lab="Freeze"]');
  await p.keyboard.press('Enter');
  assert.equal(await p.isHidden('.pg-ledge'), true, `${size}: a card in the sheet closes it`);
  assert.equal(await focusOn(p, '.pg-pieces'), true, `${size}: the focus goes back to Pieces after a card`);
}

/** Ticket 09: a turn of the phone, from 390 x 844 to 844 x 390 and back, refits the board and keeps the open design, the brush,
 *  an open Why tag, an open Rules shelf with its preview, and the Board tab; the ledge stays closed in landscape. */
async function turnRefits() {
  const p = await open('', { width: 390, height: 844 });
  await door(p);
  const turn = async (width, height) => {
    await p.setViewportSize({ width, height });
    await p.waitForFunction(w => innerWidth === w, width);
    await p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  };
  /** Both ways: the board's size and its drawing, the ledge, and `keep` (what must stay, read the same each way). */
  const both = async (why, keep) => {
    const was = await keep();
    for (const [width, height] of [[844, 390], [390, 844]]) {
      await turn(width, height);
      const at = `${why}, at ${width}x${height}`, want = height <= 500 ? height - 56 : width - 32, f = await p.locator('.pg-field').boundingBox();
      assert.ok(Math.abs(f.width - want) < 1, `${at}: the board is ${want} px wide, not ${f.width}`);
      const cw = await p.$eval('.pg-field', e => e.clientWidth);
      assert.equal(await p.getAttribute('.pg-board', 'viewBox'), `0 0 ${cw} ${cw}`, `${at}: the board draws its squares for its new size`);
      await insideViewport(p, '.pg-field');
      await noSidewaysScroll(p);
      assert.equal(await p.locator('.pg-ledge').isVisible(), height > 500, `${at}: the ledge shows only on the upright phone`);
      assert.deepEqual(await keep(), was, `${at}: the turn keeps it`);
      await shot(p, `turn-${why.replace(/\W+/g, '-')}-${width}x${height}`);
    }
  };
  await arm(p, 'both');
  await tap(p, 'c5');
  await both('the brush', async () => [await name(p), await p.getAttribute('[data-brush="both"]', 'aria-pressed'), await p.locator('.nub').count(), await marks(p)]);
  await p.keyboard.press('Escape');
  await tap(p, 'd6');
  await both('the Why tag', async () => { await insideViewport(p, '.pg-why .tag'); return [await name(p), await tag(p), await marks(p)]; });
  await p.keyboard.press('Escape');
  await p.click('[data-act="shelf"]');
  await p.click('[data-sealitem="movesLike"]');
  await both('the shelf', async () => {
    await insideViewport(p, '.pg-shelf .pg-stamp');
    return [await name(p), await p.getAttribute('[data-sealitem="movesLike"]', 'aria-pressed'), await previewed(p), await marks(p)];
  });
  await p.keyboard.press('Escape');
  await p.click('[data-tab="board"]');
  await both('the Board tab', async () => [await name(p), await p.locator('.pg-tray .tok').count(), await p.isVisible('.pg-tray')]);
  assert.equal(await p.getAttribute('[data-tab="board"]', 'aria-selected'), 'true', 'back upright, the Board tab is still open');
  await p.context().close();
}

async function paint() {
  const p = await open();
  await door(p);
  await p.click('.slot[data-piece="rook"]');
  await p.keyboard.press('b');
  assert.equal(await p.getAttribute('.brush.armed', 'data-brush'), 'move', 'B arms Move; the armed tile has the ring');
  assert.deepEqual(await rails(p), ['a4 arrow', 'd1 arrow', 'd7 arrow', 'g4 arrow'], 'in brush mode a line shows 3 squares out, then an arrow');
  await p.keyboard.press('Escape');
  assert.equal(await p.locator('#workshop[open] .brush.armed').count(), 0, 'Esc leaves brush mode; the Workshop stays open');
  assert.equal(await p.locator('.pg-tools').isVisible(), false, 'the tools go with brush mode');
  await p.click('.slot[data-piece="pawn"]');
  await p.keyboard.press('3');
  assert.equal(await p.getAttribute('.brush.armed', 'data-brush'), 'both', 'the key 3 arms Both');
  assert.equal(await p.locator('.pg-hint').textContent(), 'Tap a square to paint it.', 'the hint line names the tap');
  await shot(p, 'paint-1440x900');
  for (const [k, key] of [['move', '1'], ['take', '2'], ['both', '3']]) {
    await p.keyboard.press(key);
    await tap(p, 'c3');
    await has(p, [`c3 ${k}`, `e3 ${k}`], `${k} paints c3 and its mirror e3`);
  }
  await p.keyboard.press('1');
  await tap(p, 'b2');
  await arm(p, 'shot');
  await tap(p, 'b2');
  await has(p, ['b2 moveshot', 'f2 moveshot'], 'Shot on a move gives move or shot');
  await arm(p, 'erase');
  assert.equal(await p.locator('.pg-hint').textContent(), 'Tap a square to clear it.', 'the hint line names the Eraser');
  await tap(p, 'b2');
  assert.ok(!(await marks(p)).some(m => /^[bf]2 /.test(m)), 'the Eraser clears b2 and f2');
  const mirror = () => p.locator('[data-act="mirror"] small').textContent();
  assert.equal(await mirror(), 'Mirror', 'the Pawn paints with Mirror (its paintOn)');
  await p.click('[data-act="mirror"]');
  assert.equal(await mirror(), 'All 8', 'Mirror, then All 8');
  await p.keyboard.press('1');
  await tap(p, 'f5');
  await has(p, ['b3', 'b5', 'c2', 'c6', 'e2', 'e6', 'f3', 'f5'].map(q => `${q} move`), 'All 8 paints the 8 mirror squares');
  await p.click('[data-act="mirror"]');
  assert.equal(await mirror(), 'One', 'All 8, then One');
  await tap(p, 'g7');
  const before = await has(p, ['g7 move'], 'One paints one square');
  assert.ok(!before.some(m => /^(a7|a1|g1) /.test(m)), 'One paints no mirror square');
  await tap(p, 'g7');
  assert.deepEqual(await marks(p), before, 'the same paint again changes nothing');
  assert.equal(await p.locator('.pg-board [data-sq="g7"].kdm-ripple').count(), 1, 'the same paint again pulses the tile');
  await tap(p, 'h8');
  assert.equal(await toast(p), 'Reach ends 3 squares out.', 'a tap more than 3 squares out shows the reach toast');
  assert.equal(await p.locator('.pg-lock').count(), 1, 'and the lock');
  assert.ok(!(await marks(p)).some(m => m.startsWith('h8 ')), 'and paints nothing');
  await tap(p, 'd6');
  assert.equal(await toast(p), 'A rule makes this mark. Tap its seal.', 'a tap on a mark that only a rule makes shows the rule toast');
  await p.click('.nub[data-nub="n"]');
  assert.deepEqual(await nubsOn(p), ['n'], 'with One, a nub switches its line alone');
  assert.ok((await rails(p)).includes('d7 arrow'), 'the line shows on the board');
  await p.click('[data-act="mirror"]');
  await p.click('.nub[data-nub="ne"]');
  assert.deepEqual(await nubsOn(p), ['n', 'ne', 'nw'], 'with Mirror, a nub switches its line and the mirror line');
  await p.click('[data-act="mirror"]');
  await p.click('.nub[data-nub="e"]');
  assert.deepEqual(await nubsOn(p), ['e', 'n', 'ne', 'nw', 's', 'w'], 'with All 8, a nub switches the four lines of its kind');
  await p.click('[data-act="done"]');
  assert.equal(await p.locator('.brush.armed, .nub').count(), 0, 'Done leaves brush mode');
  await p.context().close();
  // The phone: the brush row (40 px tiles on 48 px buttons), the tools in a popover behind ⋯, the targets.
  const q = await open('', { width: 390, height: 844 });
  await door(q);
  await arm(q, 'both');
  assert.deepEqual(await q.$eval('.brush', b => [b.getBoundingClientRect().width, b.querySelector('svg').getBoundingClientRect().width]), [48, 40], 'the phone brushes');
  assert.equal(await q.locator('.pg-tools').isVisible(), false, 'on the phone the tools wait behind ⋯');
  await minTarget(q, '#workshop .nub', 24);
  await minTarget(q, '#workshop button:not(.sq, .nub)', 44);
  await q.click('[data-act="tools"]');
  assert.equal(await q.locator('.pg-tools').isVisible(), true, '⋯ opens the tools');
  await minTarget(q, '#workshop .pg-tools button', 44);
  await noSidewaysScroll(q, '#workshop');
  await shot(q, 'phone-tools-390x844');
  await q.context().close();
}

async function firstCopy() {
  const p = await open();
  await door(p);
  await p.click('.slot[data-piece="knight"]');
  await p.click('.slot[data-piece="pawn"]');
  assert.deepEqual(await stored(p), [], 'a pool piece that is only looked at is not saved');
  assert.equal(await p.locator('[data-act="undo"], [data-act="share"], .pg-weigh').count(), 0, 'no Undo, Share or Weigh before the first edit');
  await arm(p, 'both');
  await tap(p, 'c5');
  assert.equal(await name(p), 'My Pawn', 'the first paint makes the copy My Pawn');
  assert.equal(await p.locator('.pg-name .from').textContent(), 'from Pawn', 'the copy names its pool piece');
  assert.equal(await p.locator('.pg-name .tag-yours').count(), 1, 'the copy is Yours');
  assert.deepEqual(await p.$$eval('.slot[data-design] .nm', s => s.map(e => e.textContent)), ['My Pawn'], 'the copy joins Yours on the ledge');
  assert.deepEqual((await stored(p)).map(d => [d.name, d.named, d.letter.length, d.from.join()]), [['My Pawn', true, 1, 'pawn']], 'the copy is saved, named, with a letter');
  await p.keyboard.press('Escape');
  await shot(p, 'painted-1440x900');
  await p.reload();
  await p.waitForFunction(() => window.view?.ready);
  await p.evaluate(() => window.view.ready());
  await door(p);
  await p.click('.slot[data-design]');
  assert.equal(await name(p), 'My Pawn', 'a reload keeps the copy');
  await has(p, ['c5 both', 'e5 both'], 'the copy keeps its paint');
  assert.deepEqual(await p.$$eval('.pg-board [data-diff="+"]', gs => gs.map(g => g.dataset.sq).sort()), ['c5', 'e5'], 'the new marks have the quill pip');
  await p.click('.slot[data-piece="pawn"]');
  assert.deepEqual(await marks(p), PAWN, 'the pool Pawn stays the same');
  await arm(p, 'both');
  await tap(p, 'e5');
  assert.equal(await name(p), 'My Pawn 2', 'a second copy of the Pawn is My Pawn 2');
  await p.context().close();
}

async function undo() {
  const p = await open();
  await door(p);
  await arm(p, 'both');
  await tap(p, 'c5');
  const label = () => p.getAttribute('[data-act="undo"]', 'aria-label');
  assert.equal(await label(), 'Undo paint', 'the Undo button names its scope');
  assert.equal((await p.locator('[data-act="undo"]').textContent()).trim(), '↶ Undo paint', 'the Undo button shows its scope');
  await p.click('.nub[data-nub="n"]');
  assert.equal(await label(), 'Undo line', 'a nub is a line step');
  await p.keyboard.press('ControlOrMeta+z');
  assert.equal(await toast(p), 'Undone: line.', 'Ctrl or Cmd+Z undoes, with the toast');
  assert.deepEqual(await nubsOn(p), [], 'the line is gone');
  assert.equal(await label(), 'Undo paint', 'the next step is the paint');
  await p.evaluate(() => { navigator.clipboard.writeText = () => Promise.reject(new Error('refused')); });
  await p.click('.pg-share');
  await p.locator('.pg-sheet[open]').waitFor();
  const before = await marks(p);
  await p.keyboard.press('ControlOrMeta+z');
  assert.deepEqual(await marks(p), before, 'Ctrl or Cmd+Z does nothing under a sheet');
  await p.keyboard.press('Escape');
  await p.locator('.pg-sheet').waitFor({ state: 'detached', timeout: 2000 }); // Esc closes the sheet
  assert.equal(await p.locator('#workshop[open]').count(), 1, 'and the Workshop stays open');
  await refuse(p);
  await p.click('[data-act="undo"]');
  assert.equal(await toast(p), 'Could not undo: this device refused.', 'a refused delete stops the undo, with the toast');
  assert.deepEqual([await name(p), await label(), (await stored(p)).map(d => d.name)], ['My Pawn', 'Undo paint', ['My Pawn']], 'the copy and its undo step stay');
  await p.evaluate(() => window.unbreak());
  await p.click('[data-act="undo"]');
  assert.equal(await toast(p), 'Undone: paint.', 'Undo names the step it undid');
  assert.equal(await name(p), 'Pawn', 'back before the first edit: the pool Pawn');
  assert.deepEqual(await stored(p), [], 'and the copy goes from the shelf');
  assert.equal(await p.locator('.slot[data-design], [data-act="undo"]').count(), 0, 'and from the ledge and the top bar');
  await p.context().close();
}

async function saveAlerts() {
  const seed = JSON.parse(SHELF).designs[0];
  const full = JSON.stringify({ v: 1, designs: Array.from({ length: 50 }, (_, i) => ({ ...seed, id: `seed-${i}`, name: `Seed ${i}` })) });
  const p = await open('', { shelf: full });
  await door(p);
  await arm(p, 'both');
  await tap(p, 'c5');
  const alert = p.locator('.pg-alert');
  assert.equal(await alert.locator('p').textContent(), 'Not saved: your shelf is full (50 designs). Delete one to keep this piece.', 'a full shelf shows the alert');
  assert.deepEqual(await alert.locator('button').allTextContents(), ['Choose one to delete', 'Copy link'], 'with its two actions');
  await alert.getByRole('button', { name: 'Choose one to delete' }).click();
  await p.click('.pg-sheet [aria-label="Delete Seed 0"]');
  assert.equal(await toast(p), 'Deleted Seed 0. My Pawn is saved.', 'a delete makes room and saves the copy');
  assert.equal(await alert.isVisible(), false, 'the alert goes');
  const names = (await stored(p)).map(d => d.name);
  assert.ok(names.length === 50 && names.includes('My Pawn') && !names.includes('Seed 0'), 'the shelf holds the copy in place of Seed 0');
  await p.context().close();
  const q = await open();
  await q.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await door(q);
  await refuse(q);
  await arm(q, 'both');
  await tap(q, 'c5');
  const alert2 = q.locator('.pg-alert');
  assert.equal(await alert2.locator('p').textContent(), 'Not saved: this device did not keep the design.', 'a refused save shows the alert');
  assert.deepEqual(await alert2.locator('button').allTextContents(), ['Try again', 'Copy link'], 'with Try again and Copy link');
  await alert2.getByRole('button', { name: 'Copy link' }).click();
  await copied(q, 'Copy link copies');
  assert.match(await q.evaluate(() => navigator.clipboard.readText()), /\?design=/, 'the clipboard holds the design link');
  await q.evaluate(() => window.unbreak());
  await alert2.getByRole('button', { name: 'Try again' }).click();
  assert.equal(await toast(q), 'Saved on this device.', 'Try again saves');
  assert.equal(await alert2.isVisible(), false, 'the alert goes');
  assert.deepEqual((await stored(q)).map(d => d.name), ['My Pawn'], 'the shelf holds the copy');
  await q.context().close();
}

async function shareLink() {
  const p = await open();
  await p.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await door(p);
  await arm(p, 'both');
  await tap(p, 'c5');
  await p.keyboard.press('Escape');
  const want = await marks(p);
  await p.focus('.pg-share');
  await p.keyboard.press('Enter');
  await p.click(`${SHEET} [data-copy]`);
  await copied(p, 'Share, then Copy link, copies the link');
  assert.equal(await p.evaluate(() => document.activeElement?.className), 'pg-share', 'the focus goes back to Share');
  const link = new URL(await p.evaluate(() => navigator.clipboard.readText()));
  const here = new URL(p.url());
  assert.equal(`${link.origin}${link.pathname}`, `${here.origin}${here.pathname}`, 'the link is this page');
  const code = link.searchParams.get('design');
  assert.ok(code, 'with a ?design= code');
  await p.evaluate(() => { navigator.clipboard.writeText = () => Promise.reject(new Error('refused')); });
  await p.click('.pg-share');
  await p.click(`${SHEET} [data-copy]`);
  await p.locator(`${SHEET} textarea`).waitFor();
  assert.equal(await p.locator(`${SHEET} h2`).textContent(), 'Copy this', 'a refused clipboard opens the copy sheet');
  assert.equal(await p.locator(`${SHEET} textarea`).inputValue(), link.href, 'the sheet holds the link');
  // Fix 27: a press in the sheet released on the backdrop keeps it open; a tap on the backdrop closes it.
  const box = await p.locator(SHEET).boundingBox(), out = [box.x + box.width / 2, Math.max(2, box.y - 12)];
  await p.mouse.move(box.x + box.width / 2, box.y + 6);
  await p.mouse.down();
  await p.mouse.move(...out, { steps: 4 });
  await p.mouse.up();
  assert.equal(await p.locator(SHEET).count(), 1, 'fix 27: a press in the sheet released on the backdrop keeps it open');
  await p.mouse.click(...out);
  assert.equal(await p.locator(SHEET).count(), 0, 'fix 27: a tap on the backdrop closes the sheet');
  await p.context().close();
  // The copied link, unchanged, opens the same design with the same marks.
  const q = await open(link.href);
  await q.locator(FACE).waitFor();
  assert.equal(await name(q), 'My Pawn', 'the copied link opens the same design');
  assert.deepEqual(await marks(q), want, 'with the same marks');
  await q.context().close();
}

async function weigh() {
  const p = await open();
  await door(p);
  await arm(p, 'both');
  await tap(p, 'c5');
  await p.click('.pg-weigh');
  const head = await p.locator('.pg-weighpop b').textContent(), like = await p.locator('.pg-weighpop small').textContent();
  assert.match(head, /^About \d+(\.\d+)? pawns? \(estimate\)\. (Fair|Possibly overpowered|Likely overpowered|Possibly too weak|Likely too weak|The unit of worth|The queen’s worth)\.$/, 'Weigh: the worth and the band word');
  assert.ok(like.length > 0, 'Weigh: the like line');
  await shot(p, 'weigh-1440x900');
  await p.keyboard.press('Escape');
  assert.equal(await p.locator('.pg-weighpop').count(), 0, 'Esc closes the Weigh popover');
  await p.context().close();
  const q = await open('', { width: 390, height: 844 });
  await door(q);
  await arm(q, 'both');
  await tap(q, 'c5');
  assert.equal(await q.locator('.pg-weigh').isVisible(), false, 'on the phone, Weigh is not in the name band');
  const more = q.locator('[data-act="more"]');
  await more.focus();
  for (const key of ['Enter', 'Tab', 'Tab', 'Enter']) await q.keyboard.press(key); // ⋯, then its second item: Weigh
  assert.equal(await toast(q), `${head} ${like}`, 'on the phone, Weigh from ⋯ is a toast');
  assert.deepEqual([await more.evaluate(b => b === document.activeElement), await q.locator('.pg-morepop').isVisible()], [true, false], 'Weigh closes ⋯ and gives the focus back to it');
  await q.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  for (const key of ['Enter', 'Tab', 'Enter']) await q.keyboard.press(key); // ⋯, then its first item: Share
  await q.click(`${SHEET} [data-copy]`);
  await copied(q, 'on the phone, Share from ⋯, then Copy link, copies the link');
  assert.equal(await more.evaluate(b => b === document.activeElement), true, 'Share closes ⋯, and its sheet gives the focus back to ⋯');
  await q.context().close();
}

async function shelf() {
  const p = await open();
  await door(p);
  assert.deepEqual(await lines(p), ['steps 2 straight ahead', 'becomes a piece you choose'], 'a rule line is the short line with its pill (spec decision 38)');
  assert.deepEqual([await p.locator('.sline.add').count(), await p.locator('.sline.empty').count()], [1, 0], 'a pool piece with room: the Add row, no dotted row');
  await p.keyboard.press('s');
  const sheet = p.locator('.pg-shelf');
  assert.equal(await sheet.isVisible(), true, 'S opens the Rules shelf');
  assert.deepEqual(await p.$$eval('.pg-shelf .grp h4', h => h.map(e => e.textContent)), ['Moving', 'Taking', 'Safe', 'Moving others', 'Changing', 'Holding back'], 'the shelf shows the six groups');
  assert.equal(await focusOn(p, '.pg-shelf .sbtn'), true, 'the focus goes to the first seal');
  assert.deepEqual(await p.$$eval('.sbtn.has', b => b.map(e => e.dataset.sealitem)), ['step2', 'becomes'], 'a ✓ on each block the Pawn has');
  assert.ok((await p.$$eval('.sbtn.dim', b => b.map(e => e.dataset.sealitem))).includes('linesPass'), 'a seal whose needs are not met is dim');
  assert.equal(await p.locator('.pg-shint').textContent(), 'Tap a seal. The board shows what it does.', 'the shelf shows the hint');
  const box = await sheet.boundingBox();
  assert.deepEqual([Math.round(box.width), Math.round(box.height)], [336, 672], 'the shelf covers the right column, 336 × 672');
  await p.keyboard.press('Shift+Tab');
  await p.keyboard.press('Shift+Tab');
  assert.equal(await focusOn(p, '.pg-hits .sq[tabindex="0"]'), true, 'Tab skips the brushes under the shelf');
  await p.keyboard.press('Escape');
  assert.equal(await sheet.isVisible(), false, 'Esc closes the shelf');
  assert.equal(await focusOn(p, '[data-act="shelf"]'), true, 'and gives the focus back to the Add row');
  assert.equal(await p.locator('#workshop[open]').count(), 1, 'and the Workshop stays open');
  await p.click('.sline.add');
  await p.click('[data-sealitem="linesPass"]');
  assert.equal(await p.locator('.sentence .needs').textContent(), 'Paint a line first.', 'a dim seal names its need');
  assert.equal(await p.locator('.pg-stamp').isDisabled(), true, 'and Stamp waits');
  await p.click('[data-sealitem="step2"]');
  assert.equal(await p.locator('.sentence .needs').textContent(), 'Already in this piece.', 'a seal with a ✓ says so');
  const before = await marks(p);
  await p.click('[data-sealitem="movesLike"]');
  assert.equal(await p.getAttribute('[data-sealitem="movesLike"]', 'aria-pressed'), 'true', 'a tap picks the seal');
  assert.equal(await p.locator('.sentence .l1').textContent(), 'on a center square', 'the sentence card has the When chip');
  assert.equal(await p.locator('.sentence .say').evaluate(e => e.textContent.replace(e.querySelector('.l1').textContent, '')), 'It also moves and takes like a queen.', 'and the sentence with its default pill');
  assert.ok(await previewed(p) > 0 && (await marks(p)).length > before.length, 'the board previews what the rule adds');
  assert.equal(await p.locator('.pg-board [data-k="chalk"][data-pv]').getAttribute('data-zone'), 'capital', 'and the center squares of its When in chalk (proving-ground.html:1147)');
  assert.deepEqual(await p.$$eval('.pg-board [data-k="becomes"]', gs => gs.map(g => g.dataset.at).sort()), ['d8', 'h8'], 'and the fan of "becomes" on d8 and h8');
  await shot(p, 'stamp-preview-1440x900');
  await p.click('[data-act="stamp"]');
  assert.equal(await sheet.isVisible(), false, 'Stamp closes the shelf');
  assert.equal(await name(p), 'My Pawn', 'Stamp makes the copy');
  assert.deepEqual(await lines(p), ['steps 2 straight ahead', 'also moves like a queen', 'becomes a piece you choose'], 'and adds the rule');
  assert.equal(await p.getAttribute('[data-act="undo"]', 'aria-label'), 'Undo rule', 'Undo names the rule');
  assert.equal(await previewed(p), 0, 'the preview ends');
  assert.deepEqual(await p.$$eval('.pg-board [data-stamp]', gs => gs.map(g => `${g.dataset.stamp} ${g.dataset.a}`).sort()), ['d4 movesLike', 'd8 movesLike becomes', 'h8 movesLike becomes'],
    'the rule stamps the piece and the line ends beside "becomes" (scenes.js, mypawn-queen)');
  assert.ok((await p.locator('.pg-keyrow').textContent()).includes('Becomes'), 'the key row names the fan');
  assert.equal(await p.locator('.pg-plaque').isVisible(), true, 'after the first edit the plaque shows');
  assert.deepEqual((await stored(p))[0].rules.map(r => r.does.a).sort(), ['becomes', 'movesLike', 'step2'], 'the copy is saved with the rule');
  await shot(p, 'stamped-1440x900');
  await p.context().close();
  // The phone: + opens a bottom sheet with 64 px seal buttons; Stamp adds a seal to the plinth strip.
  const q = await open('', { width: 390, height: 844 });
  await door(q);
  await q.click('.padd');
  const b = await q.locator('.pg-shelf').boundingBox();
  assert.deepEqual([b.x, b.width, Math.round(b.y + b.height)], [0, 390, 844], 'on the phone the shelf is a bottom sheet');
  assert.equal(await q.$eval('.sbtn', e => e.getBoundingClientRect().width), 64, 'with 64 px seal buttons');
  await minTarget(q, '#workshop .pg-shelf button', 44);
  await noSidewaysScroll(q, '#workshop');
  await q.click('[data-sealitem="movesLike"]');
  assert.equal(await q.locator('.pg-board [data-k="chalk"][data-pv]').getAttribute('data-zone'), 'capital', 'on the phone the preview shows the center squares in chalk too');
  await shot(q, 'stamp-preview-390x844');
  await q.focus('[data-act="stamp"]');
  await q.keyboard.press('Tab');
  assert.equal(await q.evaluate(() => !!document.activeElement.closest('.pg-right, .pg-ledge')), false, 'on the phone, Tab skips the brushes and the ledge under the sheet');
  await q.click('[data-act="stamp"]');
  assert.deepEqual(await q.$$eval('.pg-pseals [data-card]', e => e.map(x => x.dataset.card)), ['step2', 'movesLike', 'becomes'], 'Stamp adds the seal to the plinth strip');
  await q.context().close();
}

async function threeOfThree() {
  const p = await open('', { shelf: SHELF });
  await door(p);
  await p.click('.slot[data-design="golden-b"]');
  assert.deepEqual([await p.locator('.sline.add').count(), await p.locator('.sline.empty').count()], [1, 1], 'a design of yours with 1 rule: the Add row and dotted rows up to 3');
  await p.click('.slot[data-piece="pawn"]');
  await stampRule(p, 'movesLike');
  assert.equal(await p.locator('.sline.add, .sline.empty').count(), 0, 'at 3 rules: no Add row and no dotted row');
  await p.keyboard.press('s');
  assert.equal(await toast(p), '3 of 3 rules. Remove one to add another.', 'S at 3 rules shows the limit words');
  assert.equal(await p.locator('.pg-shelf').isVisible(), false, 'and the shelf stays closed');
  await shot(p, 'three-of-three-1440x900');
  await p.context().close();
  const q = await open('', { width: 390, height: 844 });
  await door(q);
  await stampRule(q, 'movesLike');
  assert.equal(await q.locator('.padd').count(), 0, 'on the phone, no + at 3 rules');
  await q.context().close();
}

async function pill() {
  const p = await open();
  await door(p);
  await stampRule(p, 'movesLike');
  assert.deepEqual(await overlaps(p, '.pg-lines .pg-hit'), [], 'the 44 px buttons of the three lines do not overlap');
  const at = '[data-pill="movesLike"]';
  await p.click(at);
  assert.equal(await p.getAttribute(at, 'aria-expanded'), 'true', 'a tap on a pill opens its row');
  assert.deepEqual(await p.$$eval('.choices [data-choice]', b => b.map(e => e.textContent)), ['a king', 'a knight', 'a bishop', 'a rook', 'a queen'], 'the row holds its choices');
  assert.equal(await focusOn(p, '[data-choice="queen"]'), true, 'the focus is on the choice that the rule has');
  for (const want of ['rook', 'bishop', 'knight']) {
    await p.keyboard.press('ArrowLeft');
    assert.equal(await focusOn(p, `[data-choice="${want}"]`), true, `ArrowLeft moves to ${want}`);
  }
  assert.ok(await previewed(p) > 0, 'the focused choice previews on the board');
  await shot(p, 'pill-open-1440x900');
  await p.keyboard.press('Escape');
  assert.equal(await p.locator('.choices').count(), 0, 'Esc closes only the row');
  assert.equal(await focusOn(p, at), true, 'and gives the focus back to the pill');
  assert.deepEqual([await p.locator('#workshop[open]').count(), await previewed(p)], [1, 0], 'the Workshop stays open and the preview ends');
  await p.keyboard.press('Enter');
  for (let i = 0; i < 3; i++) await p.keyboard.press('ArrowLeft');
  await p.keyboard.press('Enter');
  assert.equal((await lines(p))[1], 'also moves like a knight', 'Enter commits the choice');
  assert.equal(await focusOn(p, at), true, 'the focus goes back to the pill');
  assert.equal((await stored(p))[0].rules.find(r => r.does.a === 'movesLike').does.as, 'knight', 'and the copy is saved');
  await p.click(at);
  await p.hover('[data-choice="king"]');
  assert.ok(await previewed(p) > 0, 'a choice under the pointer previews on the board');
  await p.context().close();
  // A choice that the limits refuse: the Rook takes, so only a king taking it is refused.
  const q = await open();
  await door(q);
  await q.click('.slot[data-piece="rook"]');
  await stampRule(q, 'cannotBeTaken');
  await q.click('[data-pill="cannotBeTaken"]');
  const off = 'Only a king can take this piece, so it cannot take. Remove that rule first.';
  assert.equal(await q.getAttribute('[data-choice="allButKing"]', 'aria-disabled'), 'true', 'a refused choice is faint');
  assert.equal(await q.locator('.pg-off').textContent(), off, 'and its words show under the row');
  await q.focus('[data-choice="allButKing"]');
  await q.keyboard.press('Enter');
  assert.equal(await toast(q), off, 'Enter on it shows its words');
  assert.equal((await stored(q))[0].rules[0].does.by, 'pawns', 'and changes nothing');
  await q.context().close();
}

async function whenChip() {
  const p = await open();
  await door(p);
  await stampRule(p, 'movesLike');
  const at = '[data-when="movesLike"]', choices = () => p.$$eval('.choices button', b => b.map(e => e.textContent));
  await p.click(at);
  assert.deepEqual(await choices(), ['Always (adds it to Moves)', 'On a center square (d4 e4 d5 e5)', 'In the enemy half', 'Next to your king', 'From move 10', 'After its first capture', 'More choices'], 'the chip opens the When choices');
  assert.equal(await p.$eval('.choices .is-on', e => e.closest('button') === document.activeElement), true, 'on the choice that the rule has');
  await shot(p, 'when-open-1440x900');
  await p.click('[data-act="morewhen"]');
  assert.equal(await p.locator('.choices select[data-near]').count(), 1, 'More choices shows the piece list of "Next to your …"');
  assert.deepEqual(await p.$$eval('.pg-nums button', b => b.map(e => e.getAttribute('aria-label'))),
    ['From move 5', 'From move 15', 'From move 20', 'Before move 5', 'Before move 10', 'Before move 15', 'Before move 20'], 'and the move numbers');
  await p.getByRole('button', { name: 'In the enemy half' }).click();
  const line = p.locator('.sline:has([data-when="movesLike"])');
  assert.equal(await p.locator(at).textContent(), 'in the enemy half', 'a choice changes the chip');
  assert.equal(await line.locator('.is-hollow').count(), 1, 'a rule that does not hold on d4 has a hollow chip');
  assert.match(await line.locator('.kd-seal').getAttribute('style'), /grayscale/, 'and a dim seal');
  await p.click(at);
  await p.click('[data-act="morewhen"]');
  await p.selectOption('[data-near]', { index: 1 });
  assert.match(await p.locator(at).textContent(), /^next to your /, 'the piece list sets "Next to your …"');
  const { squares } = (await stored(p))[0];
  await p.click(at);
  await p.getByRole('button', { name: 'Always (adds it to Moves)' }).click();
  assert.equal(await toast(p), "Added to Moves: the queen's lines.", '"Always" for "moves like" adds its squares to Moves');
  assert.deepEqual(await lines(p), ['steps 2 straight ahead', 'becomes a piece you choose'], 'and takes the rule away');
  const saved = (await stored(p))[0];
  assert.deepEqual([saved.lines, saved.squares], [['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'], squares], "the queen's eight lines join the Pawn's squares in the design");
  await has(p, ['h4 move'], 'the board shows a square that only the queen reaches');
  await p.click('[data-when="becomes"]');
  assert.equal((await choices()).length, 2, '"becomes" has its two events');
  await p.keyboard.press('Escape');
  assert.equal(await focusOn(p, '[data-when="becomes"]'), true, 'Esc gives the focus back to the chip');
  await p.click('.slot[data-piece="paladin"]');
  assert.equal(await p.getAttribute('.acts [data-when="cannotTake"]', 'aria-label'), 'When: always', 'a rule with no chip has a When button');
  await p.click('.slot[data-piece="beast"]');
  assert.equal(await p.locator('[data-when="chain"]').count(), 0, '"takes again" has no When choices');
  await p.context().close();
  // A shot on c5 (1, 1) and "moves like a king": the king's square c5 cannot hold a take and a shot, so "Always" is refused.
  const sniper = { ...JSON.parse(SHELF).designs[1], id: 'golden-c', name: 'Sniper', squares: [{ x: 1, y: 1, mark: 'shoot' }], lines: [],
    rules: [{ when: { on: 'zone', zone: 'capital' }, does: { a: 'movesLike', as: 'king' } }] };
  const q = await open('', { shelf: JSON.stringify({ v: 1, designs: [sniper] }) });
  await door(q);
  await q.click('.slot[data-design="golden-c"]');
  await q.click(at);
  assert.equal(await q.getByRole('button', { name: 'Always (adds it to Moves)' }).getAttribute('aria-disabled'), 'true', 'with a shot in the way, "Always" is refused');
  assert.equal(await q.locator('.pg-off').textContent(), 'Its shots and these moves meet on a square, and a square cannot hold both. Keep it as a rule.', 'with its words');
  await q.context().close();
}

async function removeRule() {
  const p = await open();
  await door(p);
  await p.click('.slot[data-piece="paladin"]');
  const rm = '[data-rm="cannotTake"]', shown = () => p.$eval(rm, b => getComputedStyle(b.closest('.acts')).opacity);
  assert.equal(await p.getAttribute(rm, 'aria-label'), "Remove Can't take", 'the × names its rule');
  assert.equal(await shown(), '0', 'the × waits for the pointer or the focus');
  await p.hover(`.sline:has(${rm})`);
  assert.equal(await shown(), '1', 'the × shows on the line under the pointer');
  await p.click(rm);
  assert.equal(await name(p), 'My Paladin', 'Remove makes the copy');
  assert.equal(await lines(p).then(l => l.includes('cannot take a king')), false, 'and takes the rule away');
  assert.equal(await p.locator('.sline.add').count(), 1, 'the Add row comes back');
  await p.click('[data-act="undo"]');
  assert.equal(await toast(p), 'Undone: rule.', 'Undo gives the rule back');
  assert.equal(await lines(p).then(l => l.includes('cannot take a king')), true, 'with its line');
  await p.context().close();
  // The phone: a tap on a seal in the plinth strip keeps the rule; a tap on the kept seal opens the rule's card with Remove.
  const q = await open('', { width: 390, height: 844 });
  await door(q);
  await q.click('.slot[data-piece="paladin"]');
  const seal = '[data-card="cannotTake"]', cards = () => q.$$eval('.pg-pseals [data-card]', e => e.map(x => x.dataset.card));
  await q.click(seal);
  assert.deepEqual([await q.getAttribute(seal, 'aria-pressed'), await q.locator('.pg-card').count()], ['true', 0], 'a tap on a seal keeps its rule');
  await q.click(seal);
  assert.equal(await q.locator('.pg-card').isVisible(), true, 'a tap on the kept seal opens its card');
  assert.equal(await q.locator('.pg-card .l2').textContent(), 'cannot take a king', 'with its line');
  assert.equal(await focusOn(q, '.pg-card .pg-x'), true, 'the focus goes to its ×');
  await minTarget(q, '#workshop .pg-card button', 44);
  await shot(q, 'phone-sentence-390x844');
  await q.keyboard.press('Escape');
  assert.equal(await q.locator('.pg-card').count(), 0, 'Esc closes the card');
  assert.equal(await focusOn(q, seal), true, 'and gives the focus back to the seal');
  const three = await cards();
  await q.click(seal);
  assert.equal(await q.locator('.pg-card').isVisible(), true, 'the rule stays kept: a tap on its seal opens the card again');
  await q.click('.pg-card [data-rm="cannotTake"]');
  assert.deepEqual(await cards(), three.filter(a => a !== 'cannotTake'), 'Remove takes the seal away');
  await q.click('[data-act="undo"]');
  assert.deepEqual(await cards(), three, 'Undo gives it back');
  await q.context().close();
}

async function whyTag() {
  const p = await open();
  await door(p);
  await p.click('.slot[data-piece="paladin"]');
  const before = await marks(p);
  assert.equal(await tag(p), null, 'look mode opens with no tag');
  await tap(p, 'd7');
  assert.deepEqual(await tag(p), { sq: 'd7', occ: 'Black knight', count: '3', parts: ['line', 'passes own pieces', 'removed too', 'takes, then leaves'], foot: 'On b6 it takes a pawn and stays.' },
    'd7 on the Paladin: the line, + its two rules, = a take that leaves');
  assert.equal(await p.getAttribute('.pg-board [data-select]', 'data-select'), 'd7', 'a frame marks the square of the tag');
  assert.deepEqual(await marks(p), before, 'the tag changes no mark');
  assert.ok(Math.abs(await middle(p, '.pg-notch') - await middle(p, '.sq[data-sq="d7"]')) < 2, 'the rim notch is at the row of d7');
  await textNotCut(p, '.pg-why .part small, .pg-why .why-foot, .pg-why .occ');
  await shot(p, 'why-d7-1440');
  await tap(p, 'g7');
  assert.deepEqual(await tag(p), { sq: 'g7', occ: 'Black king', count: '2', parts: ['line', 'cannot take a king', 'refused'], foot: '' }, 'g7 says refused, by "cannot take"');
  await tap(p, 'g7');
  assert.equal(await tag(p), null, 'a second tap on its square closes the tag');
  await tap(p, 'a4');
  assert.ok(Math.abs(await middle(p, '.pg-why .pointer') - await middle(p, '.sq[data-sq="a4"]')) < 2, 'the pointer of the tag looks at the row of a4');
  await p.keyboard.press('Escape');
  assert.equal(await tag(p), null, 'Esc closes the tag');
  assert.equal(await p.locator('#workshop[open]').count(), 1, 'and the Workshop stays open');
  assert.equal(await focused(p), 'a4', 'the focus goes back to the square of the tag');
  await p.focus('.sq[data-sq="d7"]');
  await p.keyboard.press('Enter');
  assert.equal((await tag(p))?.sq, 'd7', 'Enter on the focused square opens its tag');
  await p.click('.pg-why [data-act="closewhy"]');
  assert.equal(await tag(p), null, '× closes the tag');
  assert.equal(await focused(p), 'd7', 'and the focus goes back to d7');
  await p.click('.sline[data-seal="0"] .l2');
  await tap(p, 'b6');
  assert.deepEqual([(await tag(p))?.foot, await p.locator('.sline.is-focus').count()], ['It takes a pawn and stays.', 0], 'a tap on b6 opens its tag and lets the kept rule go');
  await p.click('.sline[data-seal="0"] .l2');
  assert.equal(await tag(p), null, 'a tap on a rule line closes the tag');
  await tap(p, 'b6');
  await p.keyboard.press('1');
  assert.equal(await tag(p), null, 'a brush closes the tag');
  await tap(p, 'e5');
  assert.deepEqual([await tag(p), await name(p)], [null, 'My Paladin'], 'in brush mode a tap paints, and no tag opens');
  await p.context().close();
  // The phone: a bottom sheet over the brushes and the ledge, inside the screen, with no cut caption.
  for (const [width, height] of [[390, 844], [320, 568]]) {
    const q = await open('', { width, height });
    await door(q);
    await q.click('.slot[data-piece="paladin"]');
    await tap(q, 'd7');
    assert.deepEqual((await tag(q))?.parts, ['line', 'passes own pieces', 'removed too', 'takes, then leaves'], `${width}x${height}: the sheet shows the parts of d7`);
    await insideViewport(q, '.pg-why .tag');
    await noSidewaysScroll(q, '.pg-why .tag');
    await textNotCut(q, '.pg-why .part small, .pg-why .why-foot, .pg-why .occ');
    await minTarget(q, '#workshop .pg-why button', 44);
    assert.deepEqual(await q.$$eval('.pg-brushes, .pg-ledge', es => es.map(e => e.inert)), [true, true], `${width}x${height}: the covered brushes and ledge leave the Tab order`);
    await shot(q, `why-d7-${width}x${height}`);
    await tap(q, 'g7');
    assert.equal((await tag(q))?.sq, 'g7', `${width}x${height}: a tap on the board over the sheet opens that square`);
    await q.keyboard.press('Escape');
    assert.deepEqual([await tag(q), await q.$eval('.pg-brushes', e => e.inert)], [null, false], `${width}x${height}: Esc closes the sheet`);
    await q.context().close();
  }
}

async function hoverOnly() {
  const p = await open();
  await door(p);
  await p.click('.slot[data-piece="beast"]');
  const CHAIN = ['e5: blocked g7', 'e5: hop f6', 'e5: pip f6', 'e5: pip g7', 'e5: stamp g7', 'e5: take f6'];
  await p.mouse.move(1430, 450);
  assert.deepEqual(await onParts(p), [], 'the next takes of the chain wait for their square');
  await p.hover('.sq[data-sq="e5"]');
  assert.deepEqual(await onParts(p), CHAIN, 'hover on e5 shows the next take f6, the barred g7 and their order pips');
  assert.deepEqual(await p.$$eval('.pg-board [data-k="pip"]', gs => gs.map(g => `${g.dataset.at} ${g.dataset.n}`).sort()), ['f6 2', 'g7 3'], 'f6 is the second take, g7 the third');
  await p.mouse.move(1430, 450);
  assert.deepEqual(await onParts(p), [], 'they go with the pointer');
  await p.focus('.sq[data-sq="d4"]');
  for (const key of ['ArrowUp', 'ArrowRight']) await p.keyboard.press(key);
  assert.deepEqual(await onParts(p), CHAIN, 'the keyboard focus on e5 shows them too');
  await p.hover('.sq[data-sq="a1"]');
  assert.deepEqual(await onParts(p), CHAIN, 'the pointer on another square leaves them while e5 has the keyboard focus');
  await p.mouse.move(1430, 450);
  assert.deepEqual(await onParts(p), CHAIN, 'and the pointer off the board too');
  await p.keyboard.press('ArrowDown');
  assert.deepEqual(await onParts(p), [], 'and they go with the focus');
  await tap(p, 'e5');
  await p.hover('.sq[data-sq="a1"]');
  assert.deepEqual(await onParts(p), CHAIN, 'a tap on e5 keeps them under its tag, wherever the pointer goes');
  assert.deepEqual(await tag(p), { sq: 'e5', occ: 'Black pawn', count: '2', parts: ['step', 'takes again', 'then f6'], foot: 'It takes e5, then f6. Never the king on g7.' },
    'the tag of e5 names the chain');
  await shot(p, 'beast-hover-1440');
  await p.click('.slot[data-piece="archer"]');
  await p.hover('.sq[data-sq="d6"]');
  assert.deepEqual(await onParts(p), ['d6: sight d6'], 'hover on the Archer\'s d6 shows its sight line');
  assert.equal(await p.getAttribute('.pg-board [data-k="sight"]', 'data-from'), 'd4', 'from the Archer');
  await p.hover('.sq[data-sq="b6"]');
  assert.deepEqual(await onParts(p), ['b6: sight b6'], 'the empty b6 has its sight line too');
  await p.click('.slot[data-piece="ogre"]');
  await p.hover('.sq[data-sq="d6"]');
  assert.deepEqual(await onParts(p), ['d6: follow d5'], 'hover on the Ogre\'s d6, where it pushes the pawn, shows that it follows to d5');
  assert.equal(await p.getAttribute('.pg-board [data-k="follow"]', 'data-from'), 'd4', 'from the Ogre');
  await shot(p, 'ogre-follow-1440');
  await p.context().close();
  // The phone has no hover: a tap opens the tag, and the tag shows them.
  const q = await open('', { width: 390, height: 844 });
  await door(q);
  await q.click('.slot[data-piece="beast"]');
  await tap(q, 'e5');
  assert.deepEqual(await onParts(q), CHAIN.filter(x => !x.includes('stamp')), 'on the phone a tap on e5 shows its chain (the stamps wait for a kept rule)');
  await shot(q, 'beast-why-390x844');
  await q.context().close();
}

async function tryWith() {
  const late = { v: 1, kind: 'piece', id: 'late', name: 'Late Queen', named: true, look: { body: 'P', auto: false, glow: null, army: 0 }, letter: 'Y', ownLetter: false,
    squares: [{ x: 0, y: 1, mark: 'move' }], lines: [], rules: [{ when: { on: 'fromMove', n: 10 }, does: { a: 'movesLike', as: 'queen' } }], from: [], updated: 1760000000000 };
  // On a center square it moves like a queen, and it takes again; after a card it moves like a queen.
  const center = { ...late, id: 'center', name: 'Center Chain', rules: [{ when: { on: 'zone', zone: 'capital' }, does: { a: 'movesLike', as: 'queen' } }, { when: { on: 'takes' }, does: { a: 'chain' } }] };
  const card = { ...late, id: 'card', name: 'Card Queen', rules: [{ when: { on: 'afterCard', card: 'any' }, does: { a: 'movesLike', as: 'queen' } }] };
  const p = await open('', { shelf: JSON.stringify({ v: 1, designs: [late, center, card] }) });
  await door(p);
  assert.deepEqual(await p.$$eval('.pg-tray, .pg-plaque', es => es.map(e => e.hidden)), [true, true], 'the first open of a pool piece shows no tray and no plaque');
  // Lift and place: a tap, then a tap.
  await tap(p, 'd4');
  assert.equal(await p.getAttribute('.pg-board [data-select]', 'data-select'), 'd4', 'a tap on the open piece lifts it: a frame marks its square');
  assert.equal(await p.locator('.pg-plaque').isVisible(), true, 'the first tap on a square shows the plaque');
  assert.equal(await p.getAttribute('.pg-plaque .plaque', 'title'), 'An example board. No check test. The other side does not move.', 'the plaque says what the Try board is');
  await tap(p, 'b4');
  assert.deepEqual([await openSq(p), await marks(p)], ['b4', ['a5 take', 'b5 move', 'b6 move asleep', 'c5 take']], 'on b4 the Pawn\'s step 2 sleeps');
  await shot(p, 'try-b4-1440');
  // A drag.
  await drag(p, 'b4', 'e2');
  assert.deepEqual([await openSq(p), await marks(p)], ['e2', ['d3 take', 'e3 move', 'e4 move awake', 'f3 take']], 'a drag to e2: the step 2 wakes');
  assert.equal(await tag(p), null, 'a drag opens no tag');
  await shot(p, 'try-e2-1440');
  // The keys: Enter on the piece lifts it, the arrows move, Enter places it; Esc puts a lifted piece back.
  await p.focus('.sq[data-sq="e2"]');
  for (const key of ['Enter', 'ArrowLeft', 'ArrowUp', 'ArrowUp', 'Enter']) await p.keyboard.press(key);
  assert.deepEqual([await openSq(p), await marks(p), await tag(p)], ['d4', PAWN, null], 'Enter, the arrows and Enter take the Pawn back to d4, with no tag');
  await p.keyboard.press('Enter');
  await p.keyboard.press('Escape');
  assert.deepEqual([await openSq(p), await p.locator('.pg-board [data-select]').count(), await p.locator('#workshop[open]').count()], ['d4', 0, 1], 'Esc puts the lifted piece back, and the Workshop stays open');
  // "Show on": the asleep d6 shows on d2, and the tag opens on the woken mark.
  await tap(p, 'd6');
  assert.deepEqual(await acts(p), ['Show on d2'], 'the asleep d6 offers to show it on d2');
  await p.click('[data-act="showon"]');
  assert.deepEqual([await openSq(p), (await tag(p))?.sq, (await marks(p)).includes('d4 move awake')], ['d2', 'd4', true], 'Show on d2 puts the Pawn on d2 and opens the tag on its woken d4');
  // Move here and Take back.
  assert.deepEqual(await acts(p), ['Move here'], 'the tag of a move has Move here');
  await p.click('[data-try="move"]');
  assert.deepEqual([await openSq(p), await toast(p), await acts(p)], ['d4', 'Moved to d4.', ['Take back']], 'Move here plays the move with the engine');
  await p.click('[data-act="takeback"]');
  assert.deepEqual([await openSq(p), await acts(p)], ['d2', ['Move here']], 'Take back puts the board back');
  // Put an enemy here: an empty take square.
  await tap(p, 'c3');
  assert.deepEqual(await acts(p), ['Put an enemy here'], 'an empty take square offers an enemy');
  await p.click('[data-act="putenemy"]');
  assert.deepEqual([(await tag(p))?.occ, await acts(p)], ['Black pawn', ['Move here']], 'the enemy stands there, and the take is ready');
  await p.click('[data-try="take"]');
  assert.deepEqual([await openSq(p), await toast(p)], ['c3', 'Took the enemy pawn on c3.'], 'Move here on a take takes it');
  await p.click('[data-act="takeback"]');
  await p.click('[data-act="closewhy"]');
  // The tokens wait for the tray: they show from the second item. The eye is on for the Guard, whose rule stops the pawn.
  await p.click('.slot[data-piece="guard"]');
  assert.deepEqual(await p.$$eval('.pg-tray, .pg-plaque', es => es.map(e => e.hidden)), [false, false], 'the second item shows the tray and the plaque');
  assert.deepEqual(await p.$$eval('.pg-board [data-k="threat"]', gs => gs.map(g => `${g.dataset.from} ${g.dataset.to} ${g.dataset.stopped}`)), ['e5 d4 1'], 'the eye shows the pawn\'s threat on e5, stopped');
  assert.equal(await p.locator('.pg-keyrow .k', { hasText: 'Stopped' }).count(), 1, 'the key row names the stopped threat');
  assert.equal(await p.locator('[data-act="plus5"], .pg-cardon').count(), 0, 'the Guard reads no move number and no card: no +5 moves, no card box');
  await shot(p, 'try-guard-1440');
  await p.click('[data-act="threats"]');
  assert.deepEqual([await p.getAttribute('[data-act="threats"]', 'aria-pressed'), await p.locator('.pg-board [data-k="threat"]').count()], ['false', 0], 'the eye takes the threats away');
  await p.click('[data-act="threats"]');
  await p.click('[data-tok="enemy"]');
  assert.equal(await p.getAttribute('[data-tok="enemy"]', 'aria-pressed'), 'true', 'a tap arms the Enemy token');
  await tap(p, 'c5');
  assert.deepEqual([await marks(p), await p.locator('.pg-board [data-k="threat"]').count()], [['c3 move', 'c4 move', 'd5 move', 'e3 move', 'e4 move'], 2], 'its pawn on c5 takes c5 from the marks and threatens the Guard');
  await tap(p, 'd3');
  assert.equal((await marks(p)).includes('d3 move'), true, 'a tap on a piece takes it away');
  await p.keyboard.press('Escape');
  assert.equal(await p.getAttribute('[data-tok="enemy"]', 'aria-pressed'), 'false', 'Esc lets the token go');
  await p.click('[data-tok="friend"]');
  await tap(p, 'c4');
  await p.click('[data-tok="friend"]');
  assert.equal((await marks(p)).includes('c4 move'), false, 'a friend on c4 takes the mark away');
  // The broom and the die.
  await p.click('[data-act="clear"]');
  assert.deepEqual([await figures(p), await p.locator('.pg-board [data-k="threat"]').count()], [1, 0], 'the broom leaves the piece alone');
  await p.click('[data-act="stir"]');
  assert.equal(await figures(p), 7, 'the die puts six enemies on the board');
  // The Beast's chain, with Finish.
  await p.click('.slot[data-piece="beast"]');
  const start = await marks(p);
  await tap(p, 'e5');
  await p.click('[data-try="take"]');
  assert.deepEqual([await openSq(p), await marks(p), await acts(p)], ['e5', ['f6 take'], ['Finish', 'Take back']], 'after e5 the chain shows its next take, f6, and Finish');
  await p.click('[data-act="finish"]');
  assert.equal((await marks(p)).length > 1, true, 'Finish ends the chain: all its marks show from e5');
  await p.click('[data-act="takeback"]');
  await p.click('[data-act="closewhy"]');
  assert.deepEqual([await openSq(p), await marks(p)], ['d4', start], 'Take back goes back before the chain');
  // A chain that a When starts: on d4 its queen lines take f4 and then h4; on f4 they sleep, but h4 is still its next take.
  await p.click('.slot[data-design="center"]');
  await p.click('[data-tok="enemy"]');
  for (const q of ['f4', 'h4']) await tap(p, q);
  await p.click('[data-tok="enemy"]');
  await tap(p, 'f4');
  await p.click('[data-try="take"]');
  assert.deepEqual([await openSq(p), await marks(p)], ['f4', ['h4 take']], 'after f4 the chain shows its next take, h4');
  await p.click('[data-act="closewhy"]');
  // The Paladin takes d7 and is removed too.
  await p.click('.slot[data-piece="paladin"]');
  await tap(p, 'd7');
  await p.click('[data-try="take"]');
  assert.deepEqual([await openSq(p), await marks(p), await acts(p)], [null, [], ['Take back']], 'the Paladin takes the knight on d7 and goes too');
  await p.click('[data-tok="enemy"]');
  await tap(p, 'd7');
  await p.click('[data-tok="enemy"]');
  assert.deepEqual([await p.getAttribute('.sq[data-sq="d7"]', 'aria-label'), (await tag(p))?.occ, await p.locator('.pg-board image[href*="paladin"]').count()], ['d7: black pawn.', 'Black pawn', 0],
    'an enemy on the square of the removed Paladin is a black pawn, not the Paladin');
  // The Ogre's d5: two actions.
  await p.click('.slot[data-piece="ogre"]');
  await tap(p, 'd5');
  assert.deepEqual(await acts(p), ['Move here', 'Push'], 'a square with two actions asks which one');
  await p.click('[data-try="push"]');
  assert.equal(await toast(p), 'Pushed the enemy pawn from d5 to d6.', 'Push pushes the pawn');
  // The Pawn's promotion asks which piece. A paint first, for Undo below.
  await p.click('.slot[data-piece="pawn"]');
  await arm(p, 'move');
  await tap(p, 'b5');
  await p.click('[data-act="done"]');
  await tap(p, 'd4');
  await tap(p, 'd7');
  await tap(p, 'd8');
  await p.click('[data-try="move"]');
  assert.deepEqual([await p.locator('.why-ask').textContent(), await acts(p)], ['It becomes which piece?', ['Queen', 'Rook', 'Bishop', 'Knight']], 'a promotion asks which piece');
  await shot(p, 'try-promotion-1440');
  await p.click('[data-promo="3"]');
  assert.deepEqual([await openSq(p), await marks(p)], ['d8', ['b7 both', 'c6 both', 'e6 both', 'f7 both']], 'the Pawn becomes a knight on d8');
  // Undo takes the paint away, and the Try board goes back to the design, as an edit does: no knight, no Take back.
  await p.keyboard.press('ControlOrMeta+z');
  assert.deepEqual([await name(p), await openSq(p), await p.locator('.pg-board image[href*="knight"]').count(), await marks(p), await acts(p)], ['Pawn', 'd8', 0, [], []],
    'Undo after a promotion: the Pawn stands on d8 again');
  // "+5 moves" on a design whose rule reads the move number.
  await p.click('.slot[data-design="late"]');
  assert.equal(await p.locator('.pg-moven').textContent(), 'Move 1', 'a design that reads the move number shows it');
  const ends = async () => [...new Set((await rails(p)).map(r => r.split(' ')[1]))];
  assert.deepEqual(await ends(), ['edge'], 'on move 1 its queen lines sleep: faint rails with no arrow');
  await p.click('[data-act="plus5"]');
  await p.click('[data-act="plus5"]');
  assert.deepEqual([await p.locator('.pg-moven').textContent(), await ends()], ['Move 11', ['arrow']], '+5 moves twice: move 11 wakes its queen lines');
  // The card box: Space checks it and wakes the queen lines; the box keeps the focus, and Tab goes on to the ledge.
  await p.click('.slot[data-design="card"]');
  const asleep = await ends();
  await p.focus('[data-cardon]');
  await p.keyboard.press('Space');
  assert.deepEqual([asleep, await ends(), await p.$eval('[data-cardon]', b => [b.checked, b === document.activeElement])], [['edge'], ['arrow'], [true, true]],
    'Space checks the card box, the queen lines wake, and the box keeps the focus');
  await p.keyboard.press('Tab');
  assert.equal(await focused(p), 'pg-tab-pieces', 'Tab goes on from the card box to the ledge');
  await minTarget(p, '#workshop .pg-tray button', 44);
  await p.context().close();
  // A short screen: the tray waits while the tag is open, so nothing goes under the ledge.
  const r = await open('', { width: 1024, height: 768 });
  await door(r);
  await r.click('.slot[data-piece="paladin"]');
  await tap(r, 'd7');
  assert.deepEqual([await r.locator('.pg-tray').isVisible(), await r.$eval('.pg-right', c => c.scrollHeight <= c.clientHeight)], [false, true], '1024x768: the tag has the column, and the tray waits');
  await r.click('[data-act="closewhy"]');
  assert.equal(await r.locator('.pg-tray').isVisible(), true, '1024x768: the tray comes back when the tag closes');
  await r.context().close();
  // The phone: the tray is in the Board tab, the lock in the name row, and the open piece takes a drag with no scroll.
  const q = await open('', { width: 390, height: 844 });
  await door(q);
  assert.equal(await q.locator('.pg-name .plock').isVisible(), true, 'the phone shows the lock in the name row');
  assert.equal(await q.locator('.pg-plaque').isVisible(), false, 'and no plaque on the rim');
  assert.equal(await q.$eval('.sq.is-open', b => getComputedStyle(b).touchAction), 'none', 'a drag on the open piece does not scroll the page');
  await q.click('[data-tab="board"]');
  assert.deepEqual([await q.getAttribute('[data-tab="board"]', 'aria-selected'), await q.locator('.lrow').isVisible(), await q.locator('.pg-boardtab .pg-tray').isVisible()], ['true', false, true],
    'the Board tab holds the tray');
  await minTarget(q, '#workshop .pg-tray button, #workshop .ltab', 44);
  await noSidewaysScroll(q, '#workshop');
  await shot(q, 'try-board-390x844');
  await drag(q, 'd4', 'e2', true);
  assert.deepEqual([await openSq(q), (await marks(q)).includes('e4 move awake')], ['e2', true], 'on the phone a touch drag places the Pawn too');
  // A short phone, where the dialog scrolls: a touch drag up the board places the Pawn and does not scroll.
  await q.setViewportSize({ width: 375, height: 667 });
  const scroll = () => q.$eval('#workshop', d => [d.scrollHeight > d.clientHeight, d.scrollTop, scrollY]);
  assert.deepEqual(await scroll(), [true, 0, 0], '375x667: the dialog can scroll');
  await drag(q, 'e2', 'e5', true);
  assert.deepEqual([await openSq(q), await scroll()], ['e5', [true, 0, 0]], 'a touch drag up the board places the Pawn, and nothing scrolls');
  await q.context().close();
}

/** Ticket 07: the cast (src/workshop/figures.ts), the ⋯ menu's items, and a copy of the clipboard. */
const CAST = JSON.parse(readFileSync(new URL('../src/workshop/figures.ts', import.meta.url), 'utf8').match(/FIGURES: readonly Figure\[\] = (\[[\s\S]*?\n\]);/)[1]);
const menuItems = async p => { await p.click('[data-act="more"]'); return p.$$eval('.pg-morepop button', bs => bs.map(b => b.textContent)); };
const pick = (p, act) => p.click(`.pg-morepop [data-act="${act}"]`);
const clipboard = p => p.evaluate(() => navigator.clipboard.readText());
/** The figures in view have loaded (a shot after an army change). */
const loaded = p => p.waitForFunction(() => [...document.querySelectorAll('.pg-figure img, .pg-sheet img')].filter(i => i.getBoundingClientRect().bottom < innerHeight).every(i => i.complete && i.naturalWidth));
const reopen = async p => { await p.reload(); await p.waitForFunction(() => window.view?.ready); await p.evaluate(() => window.view.ready()); await door(p); };

async function newPiece() {
  const p = await open();
  await door(p);
  await p.click('.newtile');
  assert.match(await name(p), /^(Ash|Moss|Iron|Amber|Night|Dawn) Spirit$/, 'NEW names the blank piece by autoName');
  assert.equal(await p.getAttribute('.brush.armed', 'data-brush'), 'move', 'NEW opens in brush mode, Move armed');
  assert.deepEqual([await marks(p), await figures(p)], [[], 1], 'the blank piece stands alone on d4 with no marks');
  assert.equal(await p.getAttribute('.newtile', 'aria-current'), 'true', 'NEW is the open slot');
  assert.equal(await p.locator('.pg-name .tag-yours').count(), 1, 'the new piece is Yours');
  assert.equal(await p.locator('[data-act="undo"], [data-act="share"], .pg-weigh, [data-act="more"]').count(), 0, 'no Undo, Share, Weigh or ⋯ before its first change');
  assert.deepEqual(await stored(p), [], 'it is not saved before its first change');
  await shot(p, 'new-piece-1440x900');
  assert.equal(await p.getAttribute('[data-act="mirror"]', 'aria-label'), 'Paint on: Mirror', 'a piece with no pool piece paints with Mirror (the mockup\'s S0)');
  await tap(p, 'c6');
  await has(p, ['c6 move', 'e6 move'], 'Move paints c6 and its mirror e6');
  const saved = await stored(p);
  assert.deepEqual(saved.map(d => [d.name, d.named, d.from.length, d.letter.length]), [[await name(p), false, 0, 1]], 'the first change saves it; its name follows the design');
  assert.match(saved[0].name, / Spirit$/, 'the name is still the auto name');
  assert.deepEqual([await p.getAttribute('.slot[data-design]', 'aria-current'), await p.getAttribute('.newtile', 'aria-current')], ['true', null], 'it joins Yours on the ledge');
  await p.keyboard.press('ControlOrMeta+z');
  assert.deepEqual([await stored(p), await p.getAttribute('.newtile', 'aria-current')], [[], 'true'], 'Undo before its first change: the shelf drops it, NEW is open again');
  await p.context().close();
  const q = await open('', { width: 390, height: 844 });
  await door(q);
  await q.locator('.newtile').scrollIntoViewIfNeeded();
  await q.tap('.newtile');
  assert.equal(await q.getAttribute('.brush.armed', 'data-brush'), 'move', 'on the phone NEW opens brush mode too');
  await minTarget(q, '#workshop button:not(.sq, .nub)', 44);
  await noSidewaysScroll(q, '#workshop');
  await q.context().close();
}

async function rename() {
  const p = await open();
  await door(p);
  const field = p.locator('.pg-name-in');
  await p.click('.pg-pen');
  assert.deepEqual([await field.inputValue(), await focusOn(p, '.pg-name-in')], ['Pawn', true], 'the pen opens the name field, with the focus');
  await field.fill('Bad!name');
  await p.keyboard.press('Enter');
  assert.equal(await toast(p), "A name uses letters, digits, spaces, - and ', up to 18.", 'a bad name is refused with its words');
  assert.deepEqual([await name(p), await stored(p), await focusOn(p, '.pg-pen')], ['Pawn', [], true], 'the name stays, nothing is saved, and the focus is on the pen');
  await p.click('.pg-pen');
  await field.fill('Lancer');
  await p.keyboard.press('Escape');
  assert.deepEqual([await name(p), await p.locator('#workshop[open]').count()], ['Pawn', 1], 'Esc keeps the old name, and the Workshop stays open');
  await p.click('.pg-pen');
  await field.fill('Lancer');
  await p.keyboard.press('Enter');
  assert.equal(await name(p), 'Lancer', 'Enter keeps a good name');
  assert.deepEqual((await stored(p)).map(d => [d.name, d.named, d.letter, d.from.join()]), [['Lancer', true, 'D', 'pawn']], 'a name on the pool Pawn makes the copy with that name; the letter follows the name');
  assert.equal(await p.getAttribute('[data-act="undo"]', 'aria-label'), 'Undo name', 'the Undo button names the step');
  await p.click('.pg-pen');
  await field.fill('Knight');
  await p.keyboard.press('Enter');
  assert.deepEqual((await stored(p)).map(d => [d.name, d.letter]), [['Knight (yours)', 'I']], 'a pool name gets " (yours)"; the letter follows');
  await p.click('.pg-pen');
  await field.fill('Swift Fox');
  await p.click('#pg-h');
  assert.equal(await name(p), 'Swift Fox', 'a blur keeps the name');
  // A click on a brush or a piece ends the field: the name is kept, and the click acts once.
  await p.click('.pg-pen');
  await field.fill('Lancer');
  await arm(p, 'move');
  assert.deepEqual([await name(p), await p.getAttribute('[data-brush="move"]', 'aria-pressed')], ['Lancer', 'true'], 'a click on a brush keeps the name and arms the brush');
  await p.click('.pg-pen');
  await field.fill('Lancer Two');
  await p.click('.slot[data-piece="knight"]');
  assert.deepEqual([await name(p), (await stored(p)).map(d => d.name)], ['Knight', ['Lancer Two']], 'a click on a piece keeps the name and opens the piece');
  await p.context().close();
  // The phone: Rename in ⋯; the focus goes back to ⋯.
  const q = await open('', { width: 390, height: 844 });
  await door(q);
  assert.equal(await q.locator('.pg-pen').count(), 0, 'on the phone the name band has no pen');
  await menuItems(q);
  await pick(q, 'rename');
  await q.locator('.pg-name-in').fill('Lancer');
  await q.keyboard.press('Enter');
  assert.deepEqual([await name(q), await focusOn(q, '[data-act="more"]')], ['Lancer', true], 'on the phone ⋯ renames; the focus goes back to ⋯');
  // An 18-letter name at 320 px stays in the name band.
  await q.setViewportSize({ width: 320, height: 568 });
  await menuItems(q);
  await pick(q, 'rename');
  await q.locator('.pg-name-in').fill('Wandering Champion');
  await q.keyboard.press('Enter');
  assert.equal(await name(q), 'Wandering Champion', 'an 18-letter name');
  await textNotCut(q, '.pg-name h3');
  await noSidewaysScroll(q, '#workshop');
  await insideViewport(q, '.pg-plinth');
  await shot(q, 'long-name-320x568');
  await q.context().close();
}

async function look() {
  const p = await open();
  await door(p);
  await imageIs(p, '.pg-figure img', 'ui/pieces/pawn-w.webp');
  assert.equal(await p.locator('.pg-looks').count(), 0, 'a pool piece has no look row (proving-ground.html:1052): its Look is in ⋯');
  await p.click('.newtile');
  const row = await p.$$eval('.pg-looks button', bs => bs.map(b => [b.dataset.figure ?? b.textContent, b.getAttribute('aria-pressed')]));
  assert.deepEqual([row.length, row.at(-1)[0], row.filter(([, on]) => on === 'true').length], [4, 'More', 1], 'the look row of a piece made with NEW: 3 suggested figures, one of them its own, and More');
  const first = row.find(([, on]) => on === 'false')[0], auto = await name(p);
  await p.click(`.pg-looks [data-figure="${first}"]`);
  assert.deepEqual([await name(p), (await stored(p)).length], [auto, 1], 'a figure is the first change: the new piece is saved');
  await imageIs(p, '.pg-figure img', `ui/workshop/${first}-w.webp`);
  assert.deepEqual([await p.getAttribute(`.pg-looks [data-figure="${first}"]`, 'aria-pressed'), await p.getAttribute('[data-act="undo"]', 'aria-label')], ['true', 'Undo look'], 'the figure is pressed; the step is a look step');
  await p.click('.pg-lookmore');
  const sheet = '.pg-sheet[open]';
  await p.locator(sheet).waitFor();
  assert.equal(await p.locator(`${sheet} .pg-fig`).count(), CAST.length, `More shows the ${CAST.length} figures`);
  await p.selectOption(`${sheet} [data-tag]`, 'Ranged');
  assert.deepEqual(await p.$$eval(`${sheet} .pg-fig`, bs => bs.map(b => b.dataset.figure)), CAST.filter(f => f.tags.includes('Ranged')).map(f => f.id), 'the tag filter shows the Ranged figures');
  await p.selectOption(`${sheet} [data-tag]`, 'All');
  await p.click(`${sheet} [data-figure="clay-golem"]`);
  assert.equal(await p.getAttribute(`${sheet} [data-figure="clay-golem"]`, 'aria-pressed'), 'true', 'a figure in the sheet is pressed, and the sheet stays open');
  await p.click(`${sheet} .pg-army label:has-text("Charcoal")`);
  await imageIs(p, '.pg-figure img', 'ui/workshop/clay-golem-b.webp');
  await imageIs(p, `${sheet} [data-figure="clay-golem"] img`, 'ui/workshop/clay-golem-b.webp');
  await loaded(p);
  await shot(p, 'look-more-1440x900');
  await p.keyboard.press('Escape');
  await p.locator('.pg-sheet').waitFor({ state: 'detached', timeout: 2000 });
  assert.deepEqual([await p.locator('#workshop[open]').count(), await focusOn(p, '.pg-lookmore')], [1, true], 'Esc closes the sheet; the Workshop stays open; the focus is on the new More');
  await reopen(p);
  await p.click('.slot[data-design]');
  await imageIs(p, '.pg-figure img', 'ui/workshop/clay-golem-b.webp');
  assert.deepEqual((await stored(p)).map(d => [d.look.figure, d.look.army]), [['clay-golem', 1]], 'a reload keeps the figure and the army');
  // The army alone on a pool piece, from Look in ⋯: its pool art in charcoal (decision 18).
  await p.click('.slot[data-piece="knight"]');
  await menuItems(p);
  await pick(p, 'looks');
  await p.click(`${sheet} .pg-army label:has-text("Charcoal")`);
  await imageIs(p, '.pg-figure img', 'ui/pieces/knight-b.webp');
  assert.equal(await name(p), 'My Knight', 'the army is the first change too');
  await p.click(`${sheet} .pg-x`);
  await p.locator('.pg-sheet').waitFor({ state: 'detached', timeout: 2000 });
  assert.deepEqual([await p.locator('.pg-looks').count(), await focusOn(p, '[data-act="more"]')], [0, true], 'its copy has no look row either; × after a change gives the focus to the new ⋯');
  await p.context().close();
  // The phone: Look in ⋯.
  const q = await open('', { width: 390, height: 844 });
  await door(q);
  assert.equal(await q.locator('.pg-looks').count(), 0, 'on the phone the plinth has no look row');
  await menuItems(q);
  await pick(q, 'looks');
  await q.locator(sheet).waitFor();
  await minTarget(q, `${sheet} :is(button, select, label)`, 44);
  await noSidewaysScroll(q, sheet);
  // After a change, Esc and × give the focus back to the new ⋯.
  for (const [i, end] of [[0, () => q.keyboard.press('Escape')], [1, () => q.click(`${sheet} .pg-x`)]]) {
    if (i) { await menuItems(q); await pick(q, 'looks'); }
    await q.click(`${sheet} .pg-fig >> nth=${i}`);
    await end();
    await q.locator('.pg-sheet').waitFor({ state: 'detached', timeout: 2000 });
    assert.equal(await focusOn(q, '[data-act="more"]'), true, `${i ? '×' : 'Esc'} after a change on the phone gives the focus to the new ⋯`);
  }
  await q.context().close();
}

async function designMenu() {
  const p = await open();
  await p.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await door(p);
  assert.deepEqual(await menuItems(p), ['Look', 'Copy as text', 'Make a copy'], 'the unchanged Pawn: Look (no look row for a pool piece), Copy as text and Make a copy');
  await pick(p, 'astext');
  await p.locator('.pg-toast', { hasText: 'Copied as text.' }).waitFor({ timeout: 3000 });
  assert.equal(await focusOn(p, '[data-act="more"]'), true, 'the focus goes back to ⋯');
  const text = (await clipboard(p)).split('\n');
  assert.deepEqual(text.slice(0, 3), ['Pawn', 'Moves: like a pawn.', 'Takes: 1 square diagonally forward.'], 'Copy as text gives the sentences');
  assert.match(text.at(-3), /^\| Pawn \| piece \| squares: moves like a pawn; takes 1 square diagonally forward · .* \| \d+\.\d\d \| the unit of worth \|$/, 'Copy as text gives a MATRIX row');
  assert.match(text.at(-1), /\?design=[\w-]+$/, 'Copy as text ends with the link');
  await menuItems(p);
  await pick(p, 'copydesign');
  assert.deepEqual([await name(p), await toast(p), (await stored(p)).map(d => d.name)], ['My Pawn', 'A copy is on your shelf.', ['My Pawn']], 'Make a copy of the Pawn: My Pawn, saved and opened');
  assert.equal(await p.getAttribute('.slot[data-design]', 'aria-current'), 'true', 'the copy is the open slot');
  assert.deepEqual(await menuItems(p), ['Look', 'Copy as text', 'Make a copy', 'Delete'], 'a design on the shelf adds Delete');
  await pick(p, 'copydesign');
  assert.deepEqual((await stored(p)).map(d => d.name), ['My Pawn 2', 'My Pawn'], 'a copy of My Pawn is My Pawn 2');
  await menuItems(p);
  await pick(p, 'delete');
  const sheet = '.pg-sheet[open]';
  assert.deepEqual([await p.locator(`${sheet} h2`).textContent(), await p.locator(`${sheet} p`).textContent()], ['Delete My Pawn 2?', 'This cannot be undone.'], 'Delete asks first');
  await p.click(`${sheet} [data-no]`);
  assert.deepEqual((await stored(p)).map(d => d.name), ['My Pawn 2', 'My Pawn'], 'Keep keeps it');
  await menuItems(p);
  await pick(p, 'delete');
  await p.click(`${sheet} [data-yes]`);
  assert.deepEqual([await name(p), await toast(p), (await stored(p)).map(d => d.name)], ['Pawn', 'Deleted My Pawn 2.', ['My Pawn']], 'Delete drops it and opens the Pawn it came from');
  assert.deepEqual(await p.$$eval('.slot[data-design] .nm', s => s.map(e => e.textContent)), ['My Pawn'], 'and the ledge drops it');
  assert.equal(await focusOn(p, '[data-act="more"]'), true, 'the focus goes to ⋯');
  await p.context().close();
  // A design from the Knight opens the Knight; one with no pool piece opens the Pawn; a refused delete keeps it.
  const r = await open('', { shelf: SHELF });
  await door(r);
  for (const [id, after] of [['golden-a', 'Knight'], ['golden-b', 'Pawn']]) {
    await r.click(`.slot[data-design="${id}"]`);
    await menuItems(r);
    await pick(r, 'delete');
    await r.click(`${sheet} [data-yes]`);
    assert.equal(await name(r), after, `deleting ${id} opens the ${after}`);
  }
  await r.click('.newtile');
  await tap(r, 'd6');
  await refuse(r);
  await menuItems(r);
  await pick(r, 'delete');
  await r.click(`${sheet} [data-yes]`);
  assert.equal(await toast(r), 'Could not delete: this device refused.', 'a refused delete says so');
  assert.equal((await stored(r)).length, 1, 'and the design stays');
  await r.context().close();
  // A design from a link: Copy as text and Make a copy, which keeps it on the shelf.
  const l = await open(`?design=${code}`);
  await l.locator(FACE).waitFor();
  await l.click('.pg-sheet [data-board]');
  assert.deepEqual(await menuItems(l), ['Copy as text', 'Make a copy'], 'a linked design: Copy as text and Make a copy');
  await pick(l, 'copydesign');
  assert.deepEqual([await name(l), (await stored(l)).map(d => [d.name, d.letter])], ['Rook Rider', [['Rook Rider', 'D']]], 'Make a copy keeps the linked design on the shelf');
  await l.context().close();
  // The phone: Share and Weigh after the first edit, then Rename, Look and the design menu.
  const q = await open('', { width: 390, height: 844 });
  await door(q);
  assert.deepEqual(await menuItems(q), ['Rename', 'Look', 'Copy as text', 'Make a copy'], 'the phone\'s ⋯ on the Pawn');
  await q.keyboard.press('Escape');
  await arm(q, 'both');
  await tap(q, 'c5');
  assert.deepEqual(await menuItems(q), ['Share', 'Weigh', 'Rename', 'Look', 'Copy as text', 'Make a copy', 'Delete'], 'the phone\'s ⋯ on My Pawn');
  await minTarget(q, '.pg-morepop button', 44);
  await insideViewport(q, '.pg-morepop');
  await shot(q, 'design-menu-390x844');
  await q.context().close();
}

/** The device's share as a stub (ticket 08): `on` keeps what it gets in window.shared, a string throws an error of that name,
 *  and false leaves the device with no share. Share reads navigator.share each time it opens its sheet. */
const deviceShare = (p, on) => p.evaluate(on => Object.defineProperty(navigator, 'share', { configurable: true,
  value: on === false ? undefined : async data => { if (typeof on === 'string') throw Object.assign(new Error('no'), { name: on }); window.shared = data; } }), on);
const askButtons = p => p.$$eval(`${SHEET} .pg-ask button`, bs => bs.map(b => `${b.textContent}${b.classList.contains('primary') ? ' (primary)' : ''}`));
/** The face holds no control, and the sheet, its buttons and their 44 px fit the screen. */
async function faceFits(p, why) {
  assert.equal(await p.locator(`${FACE} :is(button, input, select, textarea, a[href], [tabindex])`).count(), 0, `${why}: no control in the face`);
  assert.equal(await p.locator(`${FACE} svg[aria-label="Reach diagram"]`).count(), 1, `${why}: the face shows the reach diagram`);
  await minTarget(p, `${SHEET} button`, 44);
  await insideViewport(p, SHEET);
  await insideViewport(p, `${SHEET} .pg-ask button`);
  await noSidewaysScroll(p, SHEET);
  await loaded(p);
}

async function shareSheet() {
  const p = await open();
  await p.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await door(p);
  await arm(p, 'both');
  await tap(p, 'c5');
  await p.keyboard.press('Escape');
  await deviceShare(p, true);
  await p.click('.pg-share');
  await p.locator(FACE).waitFor();
  assert.deepEqual([await p.locator(`${SHEET} h2`).textContent(), await p.locator(`${SHEET} .pg-note`).textContent()],
    ['Share this piece', 'Your friend opens this card. It opens read only.'], 'the Share sheet and its note');
  assert.equal(await p.locator(`${FACE} .ct b`).textContent(), 'My Pawn', 'the face names the piece');
  await imageIs(p, `${FACE} .cart img`, 'ui/pieces/pawn-w.webp');
  assert.deepEqual(await p.$$eval(`${FACE} .cseals li`, ls => ls.map(l => [l.querySelectorAll('.kd-seal').length, l.lastElementChild.textContent])), [
    [1, 'On its start rank, it may also step 2 squares straight ahead, over an empty square, to an empty square.'],
    [1, 'When it reaches the last rank, it becomes a piece you choose: queen, rook, bishop or knight.']], 'a seal and its sentence for each rule');
  assert.match(await p.locator(`${FACE} .cworth`).textContent(), /^About (half a pawn|\d+½? pawns?) · (Fair|Possibly overpowered|Likely overpowered|Possibly too weak|Likely too weak|The unit of worth|The queen’s worth)$/, 'the worth and the band word');
  assert.deepEqual(await askButtons(p), ['Send link (primary)', 'Copy link', 'Copy as text'], 'with a device share: Send link, Copy link and Copy as text');
  await faceFits(p, 'the Share sheet at 1440 × 900');
  await shot(p, 'share-sheet-1440x900');
  await p.click(`${SHEET} [data-send]`);
  await p.waitForFunction(() => window.shared);
  const sent = await p.evaluate(() => window.shared), url = new URL(sent.url);
  assert.deepEqual([sent.title, sent.text, url.searchParams.has('design')], ['My Pawn', 'My Pawn: a King Down piece.', true], 'Send link gives the device share the name and the ?design= link');
  assert.deepEqual([await p.locator(SHEET).count(), await focusOn(p, '.pg-share')], [0, true], 'the sheet closes and gives the focus back to Share');
  await clearToast(p);
  await deviceShare(p, 'AbortError');
  await p.click('.pg-share');
  await p.click(`${SHEET} [data-send]`);
  await p.waitForTimeout(300);
  assert.equal(await toast(p), '', 'a share the player cancels does nothing');
  await deviceShare(p, 'NotAllowedError');
  await p.click('.pg-share');
  await p.click(`${SHEET} [data-send]`);
  await copied(p, 'a device share that fails copies the link');
  assert.equal(await clipboard(p), url.href, 'the same link');
  await p.click('.pg-share');
  await p.click(`${SHEET} [data-text]`);
  await p.locator('.pg-toast', { hasText: 'Copied as text.' }).waitFor({ timeout: 3000 });
  const text = (await clipboard(p)).split('\n');
  assert.deepEqual([text[0], text.at(-1)], ['My Pawn', url.href], 'Copy as text gives the sentences and ends with the link');
  await p.click('.pg-share');
  await p.keyboard.press('Escape');
  assert.deepEqual([await p.locator(SHEET).count(), await focusOn(p, '.pg-share')], [0, true], 'Esc closes the Share sheet and gives the focus back to Share');
  await deviceShare(p, false);
  await p.click('.pg-share');
  assert.deepEqual(await askButtons(p), ['Copy link (primary)', 'Copy as text'], 'with no device share: one Copy link');
  await p.click(`${SHEET} [data-copy]`);
  await copied(p, 'Copy link copies the link');
  await p.evaluate(() => { navigator.clipboard.writeText = () => Promise.reject(new Error('refused')); });
  await p.click('.pg-share');
  await p.click(`${SHEET} [data-copy]`);
  await p.locator(`${SHEET} textarea`).waitFor();
  assert.deepEqual([await p.locator(`${SHEET} h2`).textContent(), await p.locator(`${SHEET} textarea`).inputValue()], ['Copy this', url.href], 'a refused clipboard opens the copy sheet with the link');
  await p.context().close();
  // The phone: Share is in ⋯, and the face sits beside its diagram.
  const q = await open('', { width: 390, height: 844 });
  await door(q);
  await arm(q, 'both');
  await tap(q, 'c5');
  await deviceShare(q, false);
  await menuItems(q);
  await pick(q, 'share');
  await q.locator(FACE).waitFor();
  assert.deepEqual(await askButtons(q), ['Copy link (primary)', 'Copy as text'], 'the phone with no device share: one Copy link');
  await faceFits(q, 'the Share sheet at 390 × 844');
  await shot(q, 'share-sheet-390x844');
  await q.keyboard.press('Escape');
  assert.equal(await focusOn(q, '[data-act="more"]'), true, 'Esc gives the focus back to ⋯');
  await q.context().close();
}

async function linkCard() {
  // Keep a copy: the face first, read only, then the copy on the shelf and on the board.
  const p = await open(`?design=${code}`);
  await p.locator(FACE).waitFor();
  assert.deepEqual([await p.locator(`${SHEET} h2`).textContent(), await p.locator(`${SHEET} .pg-note`).textContent(), await p.locator(`${FACE} .ct b`).textContent()],
    ['A shared piece', 'It opens read only. Keep a copy to change it.', 'Rook Rider'], 'a design link opens its card face first');
  assert.equal(await p.locator(`${FACE} .cseals.none`).textContent(), 'No rules. Only its moves.', 'a design with no rule says so');
  assert.deepEqual(await askButtons(p), ['Keep a copy (primary)', 'Open on the board'], 'with Keep a copy and Open on the board');
  assert.deepEqual(await stored(p), [], 'the link saves nothing by itself');
  await faceFits(p, 'the link card at 1440 × 900');
  await shot(p, 'link-card-1440x900');
  await p.click(`${SHEET} [data-keep]`);
  assert.equal(await p.locator(SHEET).count(), 0, 'Keep a copy closes the face');
  assert.deepEqual([await name(p), await toast(p), (await stored(p)).map(d => d.name)], ['Rook Rider', 'A copy is on your shelf.', ['Rook Rider']], 'Keep a copy saves it');
  assert.equal(await p.locator('.pg-name .tag-yours').count(), 1, 'the copy on the board is Yours');
  assert.equal(await p.locator('.slot[data-design][aria-current="true"] .nm').textContent(), 'Rook Rider', 'its ledge slot is the open one');
  await p.context().close();
  // Open on the board: read only until the first edit, which keeps a copy; a shelf that has the name gets the next number.
  const shelf = JSON.stringify({ v: 1, designs: [{ ...JSON.parse(SHELF).designs[0], id: 'rider-1', name: 'Rook Rider' }] });
  const q = await open(`?design=${code}`, { shelf });
  await q.locator(FACE).waitFor();
  await q.click(`${SHEET} [data-board]`);
  assert.deepEqual([await q.locator(SHEET).count(), await name(q), await q.locator('.pg-name .tag-yours').count()], [0, 'Rook Rider', 0], 'Open on the board shows the design, not yet Yours');
  assert.deepEqual((await stored(q)).map(d => d.name), ['Rook Rider'], 'and saves nothing');
  await arm(q, 'both');
  await tap(q, 'c5');
  assert.ok((await marks(q)).includes('c5 both'), 'the first edit paints');
  assert.deepEqual([await name(q), (await stored(q)).map(d => d.name).sort()], ['Rook Rider 2', ['Rook Rider', 'Rook Rider 2']], 'the first edit keeps a copy, with the next free name');
  assert.equal(await q.locator('.pg-name .tag-yours').count(), 1, 'the copy is Yours');
  await q.context().close();
  // Esc shows the board too; the phone.
  const r = await open(`?design=${code}`, { width: 390, height: 844 });
  await r.locator(FACE).waitFor();
  await faceFits(r, 'the link card at 390 × 844');
  await shot(r, 'link-card-390x844');
  await r.keyboard.press('Escape');
  assert.deepEqual([await r.locator(SHEET).count(), await name(r), (await stored(r)).length], [0, 'Rook Rider', 0], 'Esc shows the design on the board and saves nothing');
  await r.context().close();
}

async function reachPopover() {
  const pop = '.pg-reachpop.on';
  const p = await open('', { shelf: SHELF });
  await door(p);
  assert.equal(await p.getAttribute('.pg-reachpop', 'aria-hidden'), 'true', 'the popover is for the eye; the slot keeps its name');
  assert.equal(await p.locator(pop).count(), 0, 'no popover at first');
  await p.hover('.slot[data-piece="paladin"]');
  await p.locator(pop).waitFor();
  assert.deepEqual([await p.getAttribute(`${pop} svg`, 'width'), await p.locator(`${pop} [data-k="line"]`).count(), await p.locator(`${pop} rect[width="13.71"]`).count()], ['96', 8, 49],
    'hover on the Paladin: a 96 px diagram on its 49 squares, with its 8 lines');
  const [b, s] = [await p.locator(pop).boundingBox(), await p.locator('.slot[data-piece="paladin"]').boundingBox()];
  assert.ok(b.y + b.height <= s.y + 1 && Math.abs(b.x + b.width / 2 - (s.x + s.width / 2)) < 2, 'the popover sits over the figure, centred');
  await insideViewport(p, pop);
  await p.waitForFunction(() => getComputedStyle(document.querySelector('.pg-reachpop')).opacity === '1');
  await shot(p, 'reach-popover-1440x900');
  await p.mouse.move(700, 300);
  assert.equal(await p.locator(pop).count(), 0, 'the pointer away hides it');
  await p.focus('.slot[data-design="golden-a"]');
  assert.equal(await p.locator(`${pop} [data-k="both"]`).count(), 8, 'focus on a shelf design shows its reach: Jumper\'s 8 squares');
  await p.focus('#pg-h');
  assert.equal(await p.locator(pop).count(), 0, 'the focus away hides it');
  await p.hover('.slot[data-piece="rook"]');
  await p.keyboard.press('Escape');
  await door(p);
  assert.equal(await p.locator(pop).count(), 0, 'a Workshop that opens again shows no old popover');
  // WebKit sends no pointer event on a resize. The check stops the pointer and focus events, so only the layout change can hide it.
  await p.focus('.slot[data-piece="pawn"]');
  await p.locator(pop).waitFor();
  await p.evaluate(() => { for (const t of ['pointerover', 'pointerleave', 'focusin', 'focusout']) addEventListener(t, e => e.stopImmediatePropagation(), true); });
  await p.setViewportSize({ width: 390, height: 844 });
  await p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  assert.equal(await p.locator(pop).count(), 0, 'focus on a figure, then a resize to the phone layout: no popover');
  await p.context().close();
  const q = await open('', { width: 390, height: 844 });
  await door(q);
  await q.focus('.slot[data-piece="paladin"]');
  await q.hover('.slot[data-piece="rook"]');
  assert.equal(await q.locator(pop).count(), 0, 'the phone shows no reach popover');
  await q.context().close();
}

/** Ticket 10: each animation in the Workshop as { name, end }: a CSS animation by its name, a transition as "transition
 *  <property>", a script motion by its element ("img.pg-fly"). A press or a key of the check starts a new list (the next action). */
function recordMotion() {
  window.motions = [];
  const seen = new WeakSet(), name = a => a.animationName ?? (a.transitionProperty ? `transition ${a.transitionProperty}`
    : `${a.effect.target.localName}${[...a.effect.target.classList].map(c => `.${c}`).join('')}`);
  const look = () => {
    for (const a of document.getAnimations()) {
      if (seen.has(a) || !a.effect?.target?.closest?.('#workshop')) continue;
      seen.add(a);
      window.motions.push({ name: name(a), end: a.effect.getComputedTiming().endTime });
    }
    requestAnimationFrame(look);
  };
  requestAnimationFrame(look);
  for (const k of ['pointerdown', 'keydown']) addEventListener(k, e => { if (e.isTrusted) window.motions = []; }, true);
}
/** The still pose: the look and the place of each element that shows in the Workshop (the toast has its own timer). */
const pose = p => p.$$eval('#workshop *:not(.pg-toast, .pg-toast *)', es => es.filter(e => e.getClientRects().length).map(e => {
  const s = getComputedStyle(e), r = e.getBoundingClientRect();
  return [e.localName, e.getAttribute('class'), s.transform, s.opacity, s.filter, s.clipPath, s.boxShadow, Math.round(r.x), Math.round(r.y)].join(' ');
}));
/** The actions of the motion check: [what, action, the motions that it plays]. The entry: the piece from its slot, the
 *  board's open piece hidden while it flies, the plinth figure and the ripple. */
const ENTRY = ['img.pg-fly', 'image', 'img', 'kdm-pop'];
const WIDE = [
  ['the Workshop opens', door, ENTRY],
  ['the Paladin from the ledge', p => p.click('.slot[data-piece="paladin"]'), ENTRY],
  ['a tap keeps rule III', p => p.click('.sline[data-seal="2"] .sl-seal'), ['span.pill']],
  ['a tap on d7', p => tap(p, 'd7'), ['pg-tagin']],
  ['Move here', p => p.click('[data-try="take"]'), ['img.pg-fly']],
  ['S at 3 of 3', p => p.keyboard.press('s'), ['div.pg-lines']],
  ['the Pawn from the ledge', p => p.click('.slot[data-piece="pawn"]'), ENTRY],
  ['the first paint', async p => { await p.keyboard.press('3'); await tap(p, 'c5'); }, ['kdm-pop', 'h3', 'img.pg-fly', 'img.fig']],
  ['a paint out of reach', p => tap(p, 'h8'), ['span.pg-lock']],
  ['Done', p => p.click('[data-act="done"]'), ['kdm-pop']],
  ['a seal on the shelf', async p => { await p.keyboard.press('s'); await p.click('[data-sealitem="movesLike"]'); }, ['svg.kd-seal', 'kdm-pulse']],
  ['Stamp', p => p.click('[data-act="stamp"]'), ['button.sl-seal', 'span.pg-wax', 'div.front', 'span.txt', 'kdm-pop']],
  ['the piece placed on e3', async p => { await tap(p, 'd4'); await tap(p, 'e3'); }, ['kdm-pop']],
];
const PHONE = [
  ['the Workshop opens', door, ENTRY],
  ['the Paladin from the ledge', p => p.click('.slot[data-piece="paladin"]'), ENTRY],
  ['Move here', async p => { await tap(p, 'd7'); await p.click('[data-try="take"]'); }, ['img.pg-fly']],
  ['the Pawn from the ledge', async p => { await p.keyboard.press('Escape'); await p.click('.slot[data-piece="pawn"]'); }, ENTRY],
  ['the first paint', async p => { await arm(p, 'both'); await tap(p, 'c5'); }, ['kdm-pop', 'h3', 'img.pg-fly', 'img.fig']],
  ['Esc leaves brush mode', p => p.keyboard.press('Escape'), ['kdm-pop']],
  ['a seal on the shelf', async p => { await p.click('.padd'); await p.click('[data-sealitem="movesLike"]'); }, ['svg.kd-seal', 'kdm-pulse']],
  ['Stamp', p => p.click('[data-act="stamp"]'), ['button.pg-pseal', 'span.pg-wax', 'kdm-pop']],
];
async function rulesTab() {
  const p = await open();
  await door(p);
  await p.click('[data-tab="rules"]');
  assert.equal(await p.getAttribute('[data-tab="rules"]', 'aria-selected'), 'true', 'Rules is the selected tab');
  assert.deepEqual(await p.$$eval('.rgrp h4', hs => hs.map(h => h.textContent)), ['Moving', 'Taking', 'Safe', 'Moving others', 'Changing', 'Holding back'], 'the 6 groups');
  assert.equal(await p.locator('[data-openseal]').count(), 10, 'the 10 seals');
  await minTarget(p, '#workshop [data-openseal]');
  // The laws follow RULES in force (the defaults in the browser), as words and not as switches.
  assert.deepEqual(await p.$$eval('.law', ls => ls.map(l => l.textContent)), ['PromotionQ R B Nqueen, rook, bishop or knight', '50-move drawOn', 'ThreefoldOn', 'MaterialOn', 'Guard by its kingOn', 'Bishops on two coloursOn',
    ' Fixed8×8 board · check and checkmate · no castling · no en passant · a power never takes a king.'], 'the laws and the Fixed plaque');
  assert.equal(await p.locator('.laws :is(button, input, [role="switch"])').count(), 0, 'the laws are read only');
  await p.click('[data-openseal="linesPass"]');
  assert.equal(await name(p), 'Lines pass', 'the plinth names the seal');
  assert.equal(await p.$eval('.pg-bigseal .kd-seal', s => Math.round(s.getBoundingClientRect().width)), 168, 'the seal is 168 px');
  assert.deepEqual(await p.$$eval('.pg-info > *', es => es.map(e => e.textContent)),
    ['It slides past its own pieces, as the Paladin does.', 'Matrix row', '4d Hop — over friends only', 'Seen on', 'Paladin'], 'the example, the MATRIX row and Seen on');
  assert.equal(await p.getAttribute('[data-openseal="linesPass"]', 'aria-pressed'), 'true', 'the open seal is pressed');
  assert.equal(await p.locator('[data-openseal="linesPass"]').evaluate(e => e === document.activeElement), true, 'the focus stays on the seal');
  assert.deepEqual(await marks(p), PALADIN, 'the board shows the Paladin on its example board');
  assert.deepEqual(await iso(p, 'd6', 'g7'), ['kdm-iso', 'kdm-dim'], 'the board keeps the rule: only its marks stand out');
  assert.equal(await p.locator('.pg-brushes').isVisible(), false, 'no brushes in the seal view');
  assert.equal(await p.locator('.pg-tray').isVisible(), false, 'no tray in the seal view');
  assert.equal(await p.locator('.pg-acts button').count(), 0, 'no Undo, Share or ⋯ in the seal view');
  await p.keyboard.press('1');
  await p.keyboard.press('s');
  assert.equal(await p.locator('.brush.armed, .pg-shelf:not([hidden])').count(), 0, 'the keys arm no brush and open no shelf in the seal view');
  // A rule that no pool piece has: the Pawn with it, on the Pawn's board.
  await p.click('[data-openseal="movesLike"]');
  assert.equal(await p.locator('.pg-info .seen').count(), 0, 'no pool piece has "moves like"');
  assert.equal(await p.locator('.pg-info p').last().textContent(), 'No pool piece has it yet.', 'Seen on says so');
  assert.ok((await marks(p)).some(m => m.startsWith('h4 move')), 'the board shows the queen\'s line on the Pawn');
  // Seen on opens the pool piece with the rule kept.
  await p.click('[data-openseal="cannotTake"]');
  await p.click('[data-seenon="paladin"]');
  assert.equal(await name(p), 'Paladin', 'Seen on opens the Paladin');
  assert.equal(await p.getAttribute('[data-tab="pieces"]', 'aria-selected'), 'true', 'the Pieces tab shows again');
  assert.equal(await p.locator('.slot[data-piece="paladin"]').evaluate(e => e === document.activeElement), true, 'the focus goes to the Paladin\'s slot');
  assert.equal(await p.locator('.sline.is-focus').getAttribute('data-seal'), '1', 'its rule II ("cannot take") is kept');
  assert.equal(await p.locator('.pg-brushes').isVisible(), true, 'the brushes are back');
  await shot(p, 'rules-tab-1440x900');
  await p.context().close();

  const ph = await open('', { width: 390, height: 844 });
  await door(ph);
  await ph.click('[data-tab="rules"]');
  assert.equal(await ph.locator('.laws').isVisible(), false, 'the phone hides the laws');
  await minTarget(ph, '#workshop [data-openseal]');
  await noSidewaysScroll(ph);
  await ph.click('[data-openseal="chain"]');
  assert.equal(await ph.$eval('.pg-bigseal .kd-seal', s => Math.round(s.getBoundingClientRect().width)), 56, 'the phone\'s seal is 56 px');
  assert.equal(await ph.locator('.pg-info .pg-ex').textContent(), 'After a take by moving, it may take again from there.', 'the phone shows the example');
  await ph.click('[data-tab="board"]');
  assert.equal(await ph.locator('.pg-tray').isVisible(), true, 'the Board tab still holds the tray');
  await shot(ph, 'rules-tab-390x844');
  await ph.context().close();
}

/** Ticket 13: the kings and their powers on the pool pieces. */
async function kings() {
  const p = await open();
  await door(p);
  await p.click('.slot[data-piece="rook"]');
  await p.click('[data-tab="kings"]');
  assert.deepEqual(await p.$$eval('.lrow .slot', bs => bs.map(b => b.dataset.king)), ['Flame', 'Frost', 'Mud', 'Shadow', 'Spirit', 'Stratus'], 'the Kings tab shows the six kings');
  await p.click('.slot[data-king="Mud"]');
  assert.equal(await name(p), 'Mud King', 'an open king stands on the plinth with his name');
  assert.match(await p.getAttribute('.pg-figure img', 'src'), /kings\/mud\.webp$/, 'the plinth shows his figure');
  assert.deepEqual(await p.$$eval('.pline', ls => ls.map(l => [l.dataset.power, l.querySelector('b').textContent, l.querySelector('.pt').textContent, !!l.querySelector('.coin img')])), [
    ['March', 'March', 'Any pawn may step two squares from any rank.', true], ['Leap', 'Leap', 'A rook, bishop or queen passes over your own pawns.', true]], 'his two powers, each with its coin and its words');
  assert.equal(await p.locator('.mini3, .pg-brushes .brush').count(), 0, 'no mini boards (decision 29), and no brushes');
  const plain = await marks(p);
  assert.deepEqual(plain, ['a1 move', 'b1 move', 'c1 move'], 'seated, the king adds no mark before a power is armed');
  await p.click('.pline[data-power="Leap"]');
  assert.deepEqual(await p.$$eval('.pg-board [data-sq][data-emblem="mud"]', gs => gs.map(g => `${g.dataset.sq} ${g.dataset.k}`).sort()), ['d3 move', 'd4 move', 'd5 move', 'd6 move', 'd7 take'], 'Leap\'s marks have the power edge');
  assert.deepEqual(await marks(p), [...plain, 'd3 move', 'd4 move', 'd5 move', 'd6 move', 'd7 take'].sort(), 'with Leap the Rook\'s marks are G22 rook-leap (scenes.js:367)');
  assert.deepEqual(await p.$$eval('.pg-board [data-emblem]:is([data-k="arch"], [data-stamp])', gs => gs.map(g => g.dataset.over ?? `stamp ${g.dataset.stamp}`).sort()), ['d2', 'stamp d7'], 'an arch over the pawn, and the emblem stamp on d7');
  assert.deepEqual(await p.$$eval('.pg-board [data-k="line"]', gs => gs.map(g => `${g.dataset.from} ${g.dataset.to} ${g.dataset.end}`).sort()), ['d1 a1 arrow', 'd1 e1 stop', 'd2 d7 x'], 'the line goes on past the pawn to the take');
  assert.equal(await p.getAttribute('.pg-tray [data-power="Leap"]', 'aria-label'), 'Leap, 3 left', 'the socket\'s Leap coin has three uses');
  await shot(p, 'kings-mud-1440');
  await tap(p, 'd5');
  assert.deepEqual([await openSq(p), await toast(p), await p.getAttribute('.pg-tray [data-power="Leap"]', 'aria-label')], ['d5', 'Leap: moved to d5.', 'Leap, 2 left'], 'a tap on a power mark plays it and spends a notch');
  assert.equal(await p.locator('.pg-tray [data-power="Leap"] .notch.is-spent').count(), 1, 'one notch is spent');
  await tap(p, 'd4');
  await p.click('[data-act="takeback"]');
  assert.deepEqual([await openSq(p), await p.getAttribute('.pg-tray [data-power="Leap"]', 'aria-label')], ['d1', 'Leap, 3 left'], 'Take back gives the move and the use back');
  // The King socket on the Paladin: SEAT A KING, Esc, the Frost king, Freeze.
  await p.click('[data-tab="pieces"]');
  await p.click('.slot[data-piece="paladin"]');
  await p.click('.pg-kingfig');
  assert.equal(await p.locator('.picker h4').textContent(), 'SEAT A KING', 'the socket opens SEAT A KING');
  await p.keyboard.press('Escape');
  assert.deepEqual([await p.locator('.picker').count(), await p.evaluate(() => document.activeElement?.dataset.act)], [0, 'seat'], 'Esc closes it, and the focus goes back to the socket');
  await p.click('.pg-kingfig');
  await p.click('[data-seat="Frost"]');
  assert.equal(await p.evaluate(() => document.activeElement?.dataset.act), 'seat', 'a king chosen in SEAT A KING: the focus goes to the king figure');
  await p.click('.pg-tray [data-power="Freeze"]');
  assert.deepEqual(await p.$$eval('.pg-board [data-sq][data-emblem="frost"]', gs => gs.map(g => g.dataset.sq).sort()), ['b6', 'd7'], 'Freeze marks each enemy piece but the king');
  await tap(p, 'd7');
  assert.deepEqual([await toast(p), await p.getAttribute('.pg-board [data-k="frost"]', 'data-at'), await p.getAttribute('.pg-board [data-k="frost"]', 'data-n')], ['Freeze: the enemy knight on d7.', 'd7', '1'], 'Freeze on d7: frost with one turn');
  assert.equal(await p.getAttribute('.pg-tray [data-power="Freeze"]', 'aria-pressed'), 'false', 'with no use left, Freeze lets go');
  await p.click('.pg-tray [data-power="Freeze"]');
  assert.equal(await toast(p), 'No Freeze uses left.', 'a coin with no use left says so');
  assert.equal(await p.getAttribute('.pg-tray [data-power="IceWall"]', 'aria-label'), 'Ice Wall, 2 left', 'each power of a king counts its own uses');
  await shot(p, 'kings-freeze-1440');
  await p.click('[data-act="clear"]');
  assert.deepEqual([await p.locator('.pg-board [data-k="frost"]').count(), await p.locator('.pg-board image[href*="kings/frost"]').count()], [0, 1], 'the broom: the frost goes, the seated king stays');
  await p.click('[data-tab="pieces"]');
  await p.click('.slot[data-piece="paladin"]');
  // Echo: Leap on the Paladin.
  await p.click('.pg-kingfig');
  await p.click('[data-seat="Mud"]');
  await p.click('.pg-tray [data-power="Leap"]');
  assert.deepEqual([await p.locator('.echo-note').textContent(), await p.locator('.pg-tray [data-power="Leap"] .echo-eq').textContent(), await marks(p)],
    ['= Leap adds nothing to the Paladin. No mark changes.', '=', PALADIN], 'Leap on the Paladin is an echo');
  // A copy: the powers wait.
  await arm(p, 'move');
  await tap(p, 'f6');
  await p.click('[data-act="done"]');
  assert.deepEqual([await name(p), await p.getAttribute('.pg-socket', 'aria-disabled'), await p.locator('.pg-kingnote').textContent(), await p.locator('.pg-board [data-emblem]').count()],
    ['My Paladin', 'true', 'Powers work on the pool pieces for now.', 0], 'on a copy the socket says that powers work on the pool pieces for now');
  await p.click('[data-tab="kings"]');
  await p.click('.slot[data-king="Mud"]');
  await p.click('.pline[data-power="Leap"]', { force: true });
  assert.deepEqual([await p.getAttribute('.pline[data-power="Leap"]', 'aria-disabled'), await p.getAttribute('.pline[data-power="Leap"]', 'aria-pressed'), await toast(p)], ['true', 'false', 'Powers work on the pool pieces for now.'], 'on a copy the king\'s power lines wait');
  await minTarget(p, '#workshop .pg-tray button', 44);
  await p.context().close();
  // The phone: the socket in the Board tab; an open king shows the board only.
  const f = await open('', { width: 390, height: 844 });
  await door(f);
  await f.click('.slot[data-piece="rook"]');
  await f.click('[data-tab="board"]');
  await f.click('.pg-socket');
  await f.click('[data-seat="Mud"]');
  await f.click('.pg-tray [data-power="Leap"]');
  assert.ok((await marks(f)).includes('d7 take'), 'the phone: Leap from the Board tab');
  await f.click('[data-tab="kings"]');
  await f.click('.slot[data-king="Mud"]');
  assert.deepEqual([await name(f), await f.locator('.pline').count(), (await marks(f)).includes('d7 take')], ['Mud King', 0, true], 'the phone: an open king shows his name and the board');
  await minTarget(f, '#workshop .pg-ledge button', 44);
  await shot(f, 'kings-390x844');
  await f.context().close();
}
async function labCards() {
  const p = await open();
  await door(p);
  await p.click('.slot[data-piece="paladin"]');
  await p.click('[data-tab="cards"]');
  const fan = p => p.$$eval('.cfan .cface', bs => bs.map(b => b.dataset.lab));
  assert.match(await p.locator('[data-tab="cards"]').textContent(), /^Cards LAB$/, 'the Cards tab has the LAB label');
  assert.deepEqual(await fan(p), ['Freeze', 'IceWall', 'Sacrifice', 'March', 'Leap', 'Mimic', 'Vault', 'SkyLift', 'Salvation', 'Rescue'], 'the cards with art make the fan');
  assert.equal(await p.locator('.cstack b').textContent(), '+15', 'the others wait in a "+15" stack');
  await p.click('.cstack');
  assert.equal((await fan(p)).length, 15, 'a tap spreads the stack');
  assert.ok(!(await fan(p)).some(c => ['FirewallB', 'EarthQuakeB', 'GrowthB', 'SpawnK2'].includes(c)), 'a second form is not a card of its own');
  await p.click('[data-act="cardsback"]');
  assert.equal((await fan(p)).length, 10, '‹ Back closes it');
  await p.click('.cface[data-lab="Freeze"]');
  assert.deepEqual([await name(p), (await p.getAttribute('.pg-bigcard .art', 'src')).replace(/^\./, ''), await p.locator('.pg-bigcard p').textContent(), await p.locator('.pg-bigcard .lab-ribbon').textContent()],
    ['Freeze', '/ui/cards/freeze.webp', 'As your move, freeze an enemy piece (not the king): it cannot move on its next turn.', 'LAB'], 'an open card stands on the plinth with its art, words and LAB ribbon');
  assert.deepEqual([await p.locator('.lab-note').textContent(), await p.locator('.twin').textContent(), await p.locator('.info-p').textContent()],
    ['LABTest deck. Not in the game.', 'Freeze, a power of the Frost king.', 'Tap a blue ring on the board.'], 'its words: the LAB note, its king, what to do');
  assert.deepEqual([await p.locator('.cardslot.on .cs.filled').count(), await p.locator('.pg-plaque .plaque.lab').textContent()], [1, 'LAB card'], 'the card is in the slot, and the plaque turns burgundy');
  const runes = p => p.$$eval('.pg-board [data-k="rune"]', gs => gs.map(g => `${g.dataset.at}${g.dataset.barred ? ' barred' : ''}`).sort());
  assert.deepEqual(await runes(p), ['b6', 'd7', 'g7 barred'], 'its picks are runes on each enemy piece, barred on the king');
  assert.deepEqual(await p.$$eval('.pg-board [data-sq]', gs => [...new Set(gs.map(g => g.classList.contains('kdm-dim')))]), [true], 'the piece\'s own marks step back');
  await shot(p, 'cards-freeze-1440');
  await tap(p, 'g7');
  assert.equal(await toast(p), 'Not the king.', 'a tap on the barred king says why');
  await tap(p, 'd7');
  assert.deepEqual([await toast(p), await p.getAttribute('.pg-board [data-k="frost"]', 'data-at'), await runes(p), await p.locator('.info-p').textContent()],
    ['Freeze: the enemy knight on d7.', 'd7', [], 'Freeze is played.'], 'a tap on a rune plays the card: frost on d7, no more picks');
  await p.click('.pg-tray [data-act="takeback"]');
  assert.deepEqual([await p.locator('.pg-board [data-k="frost"]').count(), await runes(p)], [0, ['b6', 'd7', 'g7 barred']], 'Take back gives the card back');
  await p.click('.twin button');
  assert.deepEqual([await name(p), await p.getAttribute('[data-tab="kings"]', 'aria-selected')], ['Frost King', 'true'], 'its coin opens its king');
  // A second form, and a card with no test board.
  await p.click('[data-tab="cards"]');
  await p.click('.cstack');
  await p.click('.cface[data-lab="EarthQuake"]');
  assert.deepEqual([await p.locator('.variant b').textContent(), await p.locator('.info-p').textContent(), (await p.getAttribute('.pg-bigcard .art', 'src')).replace(/^\./, ''), await runes(p)],
    ['Earth Quake B', 'No test board for this card yet.', '/ui/cards/back.webp', []], 'a B form shows inside its parent; a card with no art has the card back');
  await p.click('[data-act="cardsback"]');
  await p.click('.cface[data-lab="Salvation"]');
  assert.match(await p.getAttribute('.pg-bigcard .art', 'src'), /\/ui\/cards\/salvation\.webp$/, 'Salvation has the graveyard art');
  await p.click('.cface[data-lab="Rescue"]');
  assert.match(await p.getAttribute('.pg-bigcard .art', 'src'), /\/ui\/cards\/rescue\.webp$/, 'Rescue has the hands art');
  // LAY A LAB CARD on the Rook; one power or one card at a time.
  await p.click('[data-tab="pieces"]');
  await p.click('.slot[data-piece="rook"]');
  await p.click('.cardslot');
  assert.deepEqual([await p.locator('.picker h4').textContent(), await p.$$eval('[data-lay]', bs => bs.map(b => b.dataset.lay))], ['LAY A LAB CARD', ['Freeze', 'IceWall', 'Leap', 'March', 'Mimic', 'Vault']], 'the slot opens LAY A LAB CARD with six cards');
  await p.keyboard.press('Escape');
  assert.deepEqual([await p.locator('.picker').count(), await p.evaluate(() => document.activeElement?.dataset.act)], [0, 'lay'], 'Esc closes it, and the focus goes back to the slot');
  await p.click('.cardslot');
  await p.click('[data-lay="Leap"]');
  assert.deepEqual([await runes(p), await p.evaluate(() => document.activeElement?.dataset.act)], [['d3', 'd4', 'd5', 'd6', 'd7'], 'lay'], 'Leap laid on the Rook: its picks pass the pawn');
  await tap(p, 'd5');
  assert.deepEqual([await openSq(p), await toast(p)], ['d5', 'Leap: moved to d5.'], 'a tap on a rune plays the move');
  await p.click('.pg-tray [data-act="takeback"]');
  // The Frost king sits since his coin opened him: the socket shows his figure.
  await p.click('.pg-kingfig');
  await p.click('[data-seat="Mud"]');
  await p.click('.pg-tray [data-power="Leap"]');
  assert.deepEqual([await p.locator('.cs.filled').count(), await runes(p)], [0, []], 'an armed power takes the card away');
  await p.click('.cardslot');
  await p.click('[data-lay="Vault"]');
  assert.equal(await p.getAttribute('.pg-tray [data-power="Leap"]', 'aria-pressed'), 'false', 'a laid card lets the armed power go');
  await minTarget(p, '#workshop .pg-tray button, #workshop .pg-ledge button', 44);
  // A copy: the slot waits.
  await arm(p, 'move');
  await tap(p, 'f3');
  await p.click('[data-act="done"]');
  await p.click('.cardslot', { force: true });
  assert.deepEqual([await name(p), await p.getAttribute('.cardslot', 'aria-disabled'), await toast(p), await runes(p)], ['My Rook', 'true', 'Cards work on the pool pieces for now.', []], 'on a copy the slot waits');
  await p.context().close();
  // The phone: an open card shows its art in the window, its name and the board.
  const f = await open('', { width: 390, height: 844 });
  await door(f);
  await f.click('.slot[data-piece="paladin"]');
  await f.click('[data-tab="cards"]');
  await f.click('.cface[data-lab="Freeze"]');
  assert.deepEqual([await name(f), await f.$eval('.pg-bigcard', c => c.offsetWidth), await f.locator('.lab-note').count(), await runes(f)], ['Freeze', 56, 0, ['b6', 'd7', 'g7 barred']], 'the phone: the card in the 56 px window, and the board');
  await minTarget(f, '#workshop .pg-ledge button', 44);
  await shot(f, 'cards-390x844');
  await f.context().close();
}
/** Plays `steps` at `pace` (normal, fast or off; `reduce` emulates reduced motion): after each action the motions that it
 *  plays, none past `limit` ms, the board in its place, and 100 ms after the limit (700 ms at Normal) none running. With no
 *  motion the check looks 100 ms after the action. Gives the still pose after each action. */

async function motionRun(steps, { pace = 'normal', reduce = false, width = 1440, height = 900 } = {}) {
  const p = await open('', { width, height, motion: true, reducedMotion: reduce ? 'reduce' : undefined });
  // The toast fades out on its own timer (3.6 s), not on an action: its fade is off here.
  await p.addStyleTag({ content: '.pg-toast { transition: none !important; }' });
  await p.evaluate(v => { document.documentElement.dataset.pace = v; }, pace);
  const none = pace === 'off' || reduce, limit = pace === 'fast' ? 300 : 600, wait = none ? 100 : limit + 100, poses = [];
  for (const [what, act, want] of steps) {
    const why = `${width} x ${height}, ${reduce ? 'reduced motion' : `pace ${pace}`}: ${what}`;
    await act(p);
    // The board stays still while the motions run (the stone's shake moves only the stone).
    const box = await p.locator('.pg-board').boundingBox();
    await p.waitForTimeout(wait);
    // The still pose waits for the fonts and the images that show, not for a motion.
    await p.waitForFunction(() => document.fonts.status === 'loaded' && [...document.querySelectorAll('#workshop img')].every(i => i.complete || !i.getClientRects().length));
    assert.deepEqual(await p.locator('.pg-board').boundingBox(), box, `${why}: the board does not move`);
    const m = await p.evaluate(() => window.motions);
    if (none) assert.deepEqual(m, [], `${why}: no motion`);
    for (const w of none ? [] : want) assert.ok(m.some(x => x.name === w || (w.includes('.') && x.name.startsWith(`${w}.`))), `${why}: plays ${w}; it played ${m.map(x => x.name).join(', ')}`);
    for (const x of m) assert.ok(x.end <= limit, `${why}: ${x.name} ends at ${x.end} ms, after ${limit} ms`);
    await noRunningAnimations(p, '#workshop');
    assert.deepEqual(await p.evaluate(() => [document.querySelector('#workshop').getAnimations({ subtree: true }).length, document.querySelectorAll('.pg-fly, .pg-wax').length]), [0, 0],
      `${why}: ${wait} ms on, no motion and no flight is left`);
    poses.push(await pose(p));
  }
  await p.context().close();
  return poses;
}
async function motion() {
  const still = await motionRun(WIDE);
  for (const [i, p] of (await motionRun(WIDE, { pace: 'off' })).entries()) assert.deepEqual(p, still[i], `${WIDE[i][0]}: the still pose of Animations Off`);
  for (const [i, p] of (await motionRun(WIDE, { reduce: true })).entries()) assert.deepEqual(p, still[i], `${WIDE[i][0]}: the still pose of reduced motion`);
  await motionRun(WIDE, { pace: 'fast' });
  await motionRun(PHONE, { width: 390, height: 844 });
  await motionRun(PHONE, { width: 390, height: 844, pace: 'fast' });

  // The next action, Fast, reduced motion and a close stop a running motion: the check holds the motions of an entry, then acts.
  const p = await open('', { motion: true });
  const hold = async piece => {
    await p.waitForTimeout(700);
    await p.click(`.slot[data-piece="${piece}"]`);
    assert.ok(await p.evaluate(() => {
      window.held = document.querySelector('#workshop').getAnimations({ subtree: true }).filter(a => !(a instanceof CSSTransition));
      for (const a of window.held) a.pause();
      return window.held.length >= 4;
    }), `the ${piece} enters with its motions`);
  };
  const stopped = why => p.waitForFunction(() => window.held.every(a => a.playState === 'idle') && !document.querySelector('.pg-fly'), null, { timeout: 1000 })
    .catch(() => assert.fail(`${why} stops the running motions`));
  await door(p);
  await hold('paladin');
  await tap(p, 'e6');
  await stopped('a tap on the board');
  await hold('pawn');
  await p.evaluate(() => { document.documentElement.dataset.pace = 'fast'; });
  await stopped('Fast');
  await hold('paladin');
  await p.emulateMedia({ reducedMotion: 'reduce' });
  await stopped('reduced motion');
  await p.emulateMedia({ reducedMotion: 'no-preference' });
  await hold('pawn');
  await p.evaluate(() => document.querySelector('#workshop').close());
  await stopped('a close');
  await p.context().close();
}

async function seeAll() {
  const ALL = '.pg-sheet.pg-all[open]', shown = p => p.$$eval(`${ALL} .pg-thumb:not([hidden])`, ts => ts.map(t => t.dataset.key));
  const p = await open('', { shelf: SHELF });
  await door(p);
  assert.deepEqual(await p.$$eval('.lrow .slot', s => s.slice(-4).map(b => b.dataset.design ?? b.textContent)), ['golden-a', 'golden-b', 'See all', 'New'], 'See all ends the Yours row');
  await p.click('[data-act="seeall"]');
  assert.deepEqual(await p.$eval(ALL, s => { const r = s.getBoundingClientRect(); return [r.width, r.height]; }), [1440, 900], 'the grid fills the screen');
  assert.deepEqual(await shown(p), [...POOL.map(k => `piece:${k}`), 'design:golden-a', 'design:golden-b'], 'the grid holds the pool pieces, then the designs');
  assert.equal(await p.getAttribute(`${ALL} [data-key="piece:pawn"]`, 'aria-current'), 'true', 'the open piece is marked');
  assert.equal(await p.locator(`${ALL} [data-key="design:golden-a"]`).getAttribute('aria-label'), 'Jumper', 'a face is named');
  assert.equal(await p.locator(`${ALL} [data-key^="design:"] .tag-yours`).count(), 2, 'a design is Yours');
  assert.equal(await p.locator(`${ALL} [data-key="piece:paladin"] .kd-seal`).count(), 3, 'a face shows its seals');
  await minTarget(p, `${ALL} button`);
  await p.click(`${ALL} [data-show="Pool"]`);
  assert.deepEqual(await shown(p), POOL.map(k => `piece:${k}`), 'Pool shows the pool pieces');
  await p.click(`${ALL} [data-show="Yours"]`);
  assert.deepEqual(await shown(p), ['design:golden-a', 'design:golden-b'], 'Yours shows the designs');
  assert.deepEqual(await p.$$eval(`${ALL} [data-show]`, bs => bs.map(b => b.getAttribute('aria-pressed'))), ['false', 'false', 'true'], 'the chosen filter is pressed');
  await shot(p, 'see-all-1440x900');
  await p.keyboard.press('Escape');
  assert.equal(await p.locator(ALL).count(), 0, 'Esc closes the grid');
  assert.equal(await focusOn(p, '[data-act="seeall"]'), true, 'the focus goes back to See all');
  await p.click('[data-act="seeall"]');
  await p.click(`${ALL} [data-key="design:golden-a"]`);
  assert.equal(await p.locator(ALL).count(), 0, 'a tap closes the grid');
  assert.equal(await name(p), 'Jumper', 'and opens the design on the board');
  await p.locator('.slot[data-design="golden-a"]:focus').waitFor({ timeout: 1000 }).catch(() => assert.fail('the focus goes to its slot'));
  await p.context().close();
  const none = await open();
  await door(none);
  assert.equal(await none.locator('[data-act="seeall"]').count(), 0, 'an empty shelf has no See all');
  await none.context().close();

  const ph = await open('', { width: 390, height: 844, shelf: SHELF });
  await door(ph);
  await ph.click('[data-act="seeall"]');
  assert.equal(new Set(await ph.$$eval(`${ALL} .pg-thumb`, ts => ts.map(t => Math.round(t.getBoundingClientRect().left)))).size, 2, 'the phone shows two columns');
  await noSidewaysScroll(ph, ALL);
  await minTarget(ph, `${ALL} button`);
  await shot(ph, 'see-all-390x844');
  await ph.click(`${ALL} [data-key="piece:ogre"]`);
  assert.equal(await name(ph), 'Ogre', 'the phone opens a pool piece');
  await ph.context().close();

  // Short landscape: See all is in the ledge's sheet; a tap in the grid does not close that sheet under it.
  const ls = await open('', { width: 844, height: 390, shelf: SHELF });
  await door(ls);
  await ls.click('[data-act="pieces"]');
  await ls.click('[data-act="seeall"]');
  await ls.click(`${ALL} [data-show="Yours"]`);
  assert.equal(await ls.getAttribute(`${ALL} [data-show="Yours"]`, 'aria-pressed'), 'true', 'the filter works over the ledge\'s sheet');
  assert.equal(await ls.isVisible('.pg-ledge'), true, 'the ledge\'s sheet stays open under the grid');
  await ls.click(`${ALL} [data-key="design:golden-b"]`);
  assert.equal(await name(ls), 'Old Ward', 'a tap opens the design');
  await ls.locator('.pg-pieces:focus').waitFor({ timeout: 1000 }).catch(() => assert.fail('the focus goes back to Pieces'));
  await ls.context().close();

  // A full shelf: "Choose one to delete" opens the grid with only the designs, each with Delete.
  const seed = JSON.parse(SHELF).designs[0];
  const f = await open('', { shelf: JSON.stringify({ v: 1, designs: Array.from({ length: 50 }, (_, i) => ({ ...seed, id: `seed-${i}`, name: `Seed ${i}` })) }) });
  await door(f);
  await arm(f, 'both');
  await tap(f, 'c5');
  await f.click('.pg-alert [data-act="room"]');
  assert.equal(await f.locator(`${ALL} h2`).textContent(), 'Delete one design', 'the grid asks for one design');
  assert.deepEqual([await f.locator(`${ALL} .pg-thumb`).count(), await f.locator(`${ALL} .pg-thumb .pg-room-del`).count()], [50, 50], 'each design has Delete');
  assert.equal(await f.locator(`${ALL} :is([data-show], [data-key])`).count(), 0, 'no filter and no pool piece');
  await minTarget(f, `${ALL} .pg-room-del`);
  await f.click(`${ALL} [aria-label="Delete Seed 3"]`);
  assert.equal(await toast(f), 'Deleted Seed 3. My Pawn is saved.', 'a delete makes room and saves the copy');
  const names = (await stored(f)).map(d => d.name);
  assert.ok(names.length === 50 && names.includes('My Pawn') && !names.includes('Seed 3'), 'the shelf holds the copy in place of Seed 3');
  await f.context().close();
}

try {
  await opens();
  await poolPieces();
  await yours();
  await link();
  await keys();
  await refused();
  await isolate();
  await knots();
  await layouts();
  await turnRefits();
  await paint();
  await firstCopy();
  await undo();
  await saveAlerts();
  await shareLink();
  await weigh();
  await shelf();
  await threeOfThree();
  await pill();
  await whenChip();
  await removeRule();
  await whyTag();
  await hoverOnly();
  await tryWith();
  await newPiece();
  await rename();
  await look();
  await designMenu();
  await shareSheet();
  await linkCard();
  await reachPopover();
  await kings();
  await labCards();
  await motion();
  await rulesTab();
  await seeAll();
  assertNoErrors();
  console.log('workshop: all groups pass');
} finally {
  await browser.close();
}
