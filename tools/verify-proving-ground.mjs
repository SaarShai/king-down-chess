// The Proving Ground, the Workshop's view A behind ?workshop=a (docs/specs/workshop-proving-ground, tickets 01 to 05).
// Groups: opens (the menu door, ‹ Menu and Esc, the focus back on the menu), poolPieces (each pool piece opens;
// the Pawn's and the Paladin's marks equal src/workshop/scene.test.ts), yours (the shelf designs in the ledge),
// link (a design link opens read only; a bad code shows the toast), keys (one tab stop, the arrow keys, the square
// labels, Enter and Space on a ledge slot keep the focus), refused (grey barred marks and their stamps), isolate (hover, a tap and
// Esc; the phone's stamps), knots (gold and cracked; a tap on each of three knots and the desktop toast), layouts (six sizes: no sideways scroll, the
// top bar and the board in view, no cut text, 44 px targets, 24 px squares and knots), oldDefault (no ?workshop=a: the old Workshop opens), and the editor of ticket 02: paint (the brushes,
// the keys, Shot, Eraser, the three Mirror modes, the same paint twice, the reach and rule toasts, the nubs, the targets),
// firstCopy (the first paint makes "My Pawn" in Yours; a reload keeps it; the pool Pawn stays), undo (the scope, Ctrl or
// Cmd+Z, nothing under a sheet, a refused delete, back before the first edit), saveAlerts (a full shelf, a storage that
// throws, Copy link), shareLink (Share by the Enter key; the copied ?design= link, unchanged, opens the same design; a
// refused clipboard opens the copy sheet) and weigh (the words; on the phone, ⋯ by the keys gives the focus back to ⋯);
// then the rules of ticket 03: shelf (S, Esc, Tab skips what the shelf covers, the groups, ✓ and dim seals, the preview,
// Stamp; the phone's bottom sheet), threeOfThree (the Add row, the dotted rows, the limit words), pill (no two 44 px buttons
// of the lines overlap, the row, the arrows, the preview, Esc, Enter, a refused choice), whenChip (the When choices, More
// choices, an asleep seal, "Always" for "moves like" with the queen's lines in the design, no choices for
// "takes again") and removeRule (the × of a line, Undo; the phone's rule card from a tap on the kept seal). The keys group also opens and closes the shelf with S.
// Then ticket 05: whyTag (a tap on d7 of the Paladin opens the Why tag with its parts; g7 says refused; a second tap, Esc and ×
// close it; Enter opens it; the frame, the rim notch and the pointer; a brush closes it and a tap in brush mode paints; the
// phone's bottom sheet stays inside the screen) and hoverOnly (hover or focus on the Beast's e5 shows f6, the barred g7 and
// their pips; hover on the Archer's d6 shows its sight line; hover on the Ogre's d6 shows the follow; a tap on e5 keeps them
// under the tag; on the phone a tap shows them).
// Run it with `npm run check:browser proving-ground`.
import assert from 'node:assert/strict';
import { pressMenu } from './app-ui.mjs';
import { assertNoErrors, env, imageIs, insideViewport, launch, minTarget, noSidewaysScroll, shot, textNotCut, trapErrors } from './lib/checks.mjs';

const base = env('PLAYABLE_URL');
const POOL = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'archer', 'paladin', 'guard', 'maester', 'beast', 'ogre'];
/** The marks of the scene test (src/workshop/scene.test.ts, the hand scenes of the mockup). */
const PAWN = ['c5 take', 'd5 move', 'd6 move asleep', 'e5 take'];
const PALADIN = [
  ...'d6 e5 f6 e4 f4 g4 h4 e3 f2 g1 d3 d2 d1 c3 a1 c4 b4 a4 c5'.split(' ').map(q => `${q} move`), 'd7 take', 'b6 take', 'g7 blocked',
].sort();
/** The W12 sample design (docs/specs/web-redesign/samples/W12.mjs) as a ?design= link. */
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

/** A page at `query` with the game ready; `shelf` seeds the Workshop shelf. */
async function open(query = '?workshop=a', { width = 1440, height = 900, shelf } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, hasTouch: width < 721 });
  await ctx.addInitScript(() => sessionStorage.setItem('kingdown.title-seen', '1'));
  if (shelf) await ctx.addInitScript(v => localStorage.setItem('kingdown.workshop', v), shelf);
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
/** The isolate class of the mark on each square: kdm-iso, kdm-dim or null. */
const iso = (p, ...sqs) => Promise.all(sqs.map(sq => p.getAttribute(`.pg-board [data-sq="${sq}"]`, 'class')));
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

async function opens() {
  const p = await open();
  await door(p);
  assert.equal(await p.locator('.ws-door').count(), 0, 'with ?workshop=a the old Workshop does not open');
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
  const p = await open('?workshop=a', { shelf: SHELF });
  await door(p);
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
  const p = await open(`?workshop=a&design=${code}`);
  await p.locator('#workshop.pg[open]').waitFor();
  assert.equal(await name(p), 'Rook Rider', 'a design link opens that design');
  assert.equal(new URL(p.url()).searchParams.has('design'), false, 'the link leaves the address');
  assert.equal(await p.locator('.slot[aria-current]').count(), 0, 'no ledge slot is open');
  assert.equal(await p.locator('#workshop :is(input, textarea, select, [contenteditable])').count(), 0, 'a linked design is read only');
  assert.equal(await p.locator('#workshop button.brush').count(), 0, 'a linked design has no brush to arm');
  const before = await marks(p);
  assert.ok(before.includes('e6 both') && before.includes('c6 both'), 'the board shows its painted squares');
  await p.click('.sq[data-sq="d8"]');
  assert.deepEqual(await marks(p), before, 'a tap on the board changes nothing');
  await p.context().close();
  const bad = await open('?workshop=a&design=not-a-design');
  await bad.locator('#workshop.pg[open]').waitFor();
  assert.equal(await bad.locator('.pg-toast').textContent(), 'This design link could not be read.', 'a bad code shows the toast');
  assert.equal(await name(bad), 'Pawn', 'a bad code opens the Pawn');
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
  const ph = await open('?workshop=a', { width: 390, height: 844 });
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
  const p = await open('?workshop=a', { shelf: KNOTTED });
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
  for (const [width, height] of [[1440, 900], [1280, 800], [1024, 768], [768, 1024], [390, 844], [320, 568]]) {
    const p = await open('?workshop=a', { width, height });
    await door(p);
    for (const piece of ['pawn', 'paladin']) {
      await p.click(`.slot[data-piece="${piece}"]`);
      await noSidewaysScroll(p, '#workshop');
      await noSidewaysScroll(p);
      await insideViewport(p, '.pg-top');
      await insideViewport(p, '.pg-field');
      await textNotCut(p, '.pg-title, .pg-name h3, .slot .nm, .brush .w, .ltab');
      if (width >= 1000) await textNotCut(p, '.sline .l2');
      await minTarget(p, '#workshop button:not(.sq, .knot)', 44);
      if (piece === 'paladin' && width >= 1000) await minTarget(p, '#workshop .knot', 24);
      await minTarget(p, '#workshop .sq', width <= 320 ? 36 : 24);
      assert.equal(await p.locator('.pg-keyrow').isVisible(), width >= 1000, `${width}x${height}: the key row shows on the wide layout only`);
      await shot(p, `${piece}-${width}x${height}`);
    }
    await p.context().close();
  }
}

async function oldDefault() {
  const p = await open('');
  await pressMenu(p, 'Workshop');
  await p.locator('#workshop .ws-door').first().waitFor();
  assert.equal(await p.locator('#workshop.pg').count(), 0, 'with no ?workshop=a the old Workshop opens');
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
  const q = await open('?workshop=a', { width: 390, height: 844 });
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
  const p = await open('?workshop=a', { shelf: full });
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
  await copied(p, 'Share copies the link');
  assert.equal(await p.evaluate(() => document.activeElement?.className), 'pg-share', 'the focus stays on Share');
  const link = new URL(await p.evaluate(() => navigator.clipboard.readText()));
  const here = new URL(p.url());
  assert.equal(`${link.origin}${link.pathname}`, `${here.origin}${here.pathname}`, 'the link is this page');
  const code = link.searchParams.get('design');
  assert.ok(code, 'with a ?design= code');
  await p.evaluate(() => { navigator.clipboard.writeText = () => Promise.reject(new Error('refused')); });
  await p.click('.pg-share');
  await p.locator('.pg-sheet[open]').waitFor();
  assert.equal(await p.locator('.pg-sheet h2').textContent(), 'Copy this', 'a refused clipboard opens the copy sheet');
  assert.equal(await p.locator('.pg-sheet textarea').inputValue(), link.href, 'the sheet holds the link');
  await p.context().close();
  // The copied link, unchanged: with no ?workshop=a, the old Workshop opens the same design (until the cutover).
  const r = await open(link.href);
  await r.locator('#workshop[open] .ws-piece-card').waitFor();
  assert.equal(await r.locator('#workshop .ws-name-t').first().innerText(), 'My Pawn', 'the copied link opens the same design');
  assert.deepEqual(await r.$$eval('.ws-grid[data-grid="move"] .c-move', c => c.map(e => `${e.dataset.x},${e.dataset.y}`).sort()), ['-1,1', '0,1', '1,1'], 'with its paint: c5, d5 and e5 are moves');
  await r.context().close();
  // The same code in the Proving Ground shows the same marks.
  const q = await open(`?workshop=a&design=${code}`);
  await q.locator('#workshop.pg[open]').waitFor();
  assert.equal(await name(q), 'My Pawn', 'the Proving Ground opens the same design');
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
  const q = await open('?workshop=a', { width: 390, height: 844 });
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
  await copied(q, 'on the phone, Share from ⋯ copies the link');
  assert.equal(await more.evaluate(b => b === document.activeElement), true, 'Share closes ⋯ and gives the focus back to it');
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
  await shot(p, 'stamp-preview-1440x900');
  await p.click('[data-act="stamp"]');
  assert.equal(await sheet.isVisible(), false, 'Stamp closes the shelf');
  assert.equal(await name(p), 'My Pawn', 'Stamp makes the copy');
  assert.deepEqual(await lines(p), ['steps 2 straight ahead', 'also moves like a queen', 'becomes a piece you choose'], 'and adds the rule');
  assert.equal(await p.getAttribute('[data-act="undo"]', 'aria-label'), 'Undo rule', 'Undo names the rule');
  assert.equal(await previewed(p), 0, 'the preview ends');
  assert.deepEqual((await stored(p))[0].rules.map(r => r.does.a).sort(), ['becomes', 'movesLike', 'step2'], 'the copy is saved with the rule');
  await shot(p, 'stamped-1440x900');
  await p.context().close();
  // The phone: + opens a bottom sheet with 64 px seal buttons; Stamp adds a seal to the plinth strip.
  const q = await open('?workshop=a', { width: 390, height: 844 });
  await door(q);
  await q.click('.padd');
  const b = await q.locator('.pg-shelf').boundingBox();
  assert.deepEqual([b.x, b.width, Math.round(b.y + b.height)], [0, 390, 844], 'on the phone the shelf is a bottom sheet');
  assert.equal(await q.$eval('.sbtn', e => e.getBoundingClientRect().width), 64, 'with 64 px seal buttons');
  await minTarget(q, '#workshop .pg-shelf button', 44);
  await noSidewaysScroll(q, '#workshop');
  await q.click('[data-sealitem="movesLike"]');
  await shot(q, 'stamp-preview-390x844');
  await q.focus('[data-act="stamp"]');
  await q.keyboard.press('Tab');
  assert.equal(await q.evaluate(() => !!document.activeElement.closest('.pg-right, .pg-ledge')), false, 'on the phone, Tab skips the brushes and the ledge under the sheet');
  await q.click('[data-act="stamp"]');
  assert.deepEqual(await q.$$eval('.pg-pseals [data-card]', e => e.map(x => x.dataset.card)), ['step2', 'movesLike', 'becomes'], 'Stamp adds the seal to the plinth strip');
  await q.context().close();
}

async function threeOfThree() {
  const p = await open('?workshop=a', { shelf: SHELF });
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
  const q = await open('?workshop=a', { width: 390, height: 844 });
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
  const q = await open('?workshop=a', { shelf: JSON.stringify({ v: 1, designs: [sniper] }) });
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
  const q = await open('?workshop=a', { width: 390, height: 844 });
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
  assert.deepEqual(await tag(p), { sq: 'd7', occ: 'Black knight', count: '3', parts: ['line', 'lines pass', 'removed too', 'takes, then leaves'], foot: 'On b6 it takes a pawn and stays.' },
    'd7 on the Paladin: the line, + its two rules, = a take that leaves');
  assert.equal(await p.getAttribute('.pg-board [data-select]', 'data-select'), 'd7', 'a frame marks the square of the tag');
  assert.deepEqual(await marks(p), before, 'the tag changes no mark');
  assert.ok(Math.abs(await middle(p, '.pg-notch') - await middle(p, '.sq[data-sq="d7"]')) < 2, 'the rim notch is at the row of d7');
  await textNotCut(p, '.pg-why .part small, .pg-why .why-foot, .pg-why .occ');
  await shot(p, 'why-d7-1440');
  await tap(p, 'g7');
  assert.deepEqual(await tag(p), { sq: 'g7', occ: 'Black king', count: '2', parts: ['line', "can't take a king", 'refused'], foot: '' }, 'g7 says refused, by "cannot take"');
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
    const q = await open('?workshop=a', { width, height });
    await door(q);
    await q.click('.slot[data-piece="paladin"]');
    await tap(q, 'd7');
    assert.deepEqual((await tag(q))?.parts, ['line', 'lines pass', 'removed too', 'takes, then leaves'], `${width}x${height}: the sheet shows the parts of d7`);
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
  const CHAIN = ['e5: blocked g7', 'e5: hop f6', 'e5: pip f6', 'e5: pip g7', 'e5: stamp f6', 'e5: stamp g7', 'e5: take f6'];
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
  await p.keyboard.press('ArrowDown');
  assert.deepEqual(await onParts(p), [], 'and they go with the focus');
  await tap(p, 'e5');
  await p.hover('.sq[data-sq="a1"]');
  assert.deepEqual(await onParts(p), CHAIN, 'a tap on e5 keeps them under its tag, wherever the pointer goes');
  assert.deepEqual(await tag(p), { sq: 'e5', occ: 'Black pawn', count: '2', parts: ['move or take', 'takes again', 'then f6'], foot: 'Then it may take f6. Never the king on g7.' },
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
  const q = await open('?workshop=a', { width: 390, height: 844 });
  await door(q);
  await q.click('.slot[data-piece="beast"]');
  await tap(q, 'e5');
  assert.deepEqual(await onParts(q), CHAIN.filter(x => !x.includes('stamp')), 'on the phone a tap on e5 shows its chain (the stamps wait for a kept rule)');
  await shot(q, 'beast-why-390x844');
  await q.context().close();
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
  await oldDefault();
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
  assertNoErrors();
  console.log('proving-ground: all groups pass');
} finally {
  await browser.close();
}
