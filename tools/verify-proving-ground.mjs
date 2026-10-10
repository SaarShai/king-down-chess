// The Proving Ground, the Workshop's view A behind ?workshop=a (docs/specs/workshop-proving-ground, tickets 01 and 02).
// Groups: opens (the menu door, ‹ Menu and Esc, the focus back on the menu), poolPieces (each pool piece opens;
// the Pawn's and the Paladin's marks equal src/workshop/scene.test.ts), yours (the shelf designs in the ledge),
// link (a design link opens read only; a bad code shows the toast), keys (one tab stop, the arrow keys, the square
// labels, Enter and Space on a ledge slot keep the focus), layouts (six sizes: no sideways scroll, the top bar and the board in view, no cut text, 44 px targets and
// 24 px squares), oldDefault (no ?workshop=a: the old Workshop opens), and the editor of ticket 02: paint (the brushes,
// the keys, Shot, Eraser, the three Mirror modes, the same paint twice, the reach and rule toasts, the nubs, the targets),
// firstCopy (the first paint makes "My Pawn" in Yours; a reload keeps it; the pool Pawn stays), undo (the scope, Ctrl or
// Cmd+Z, nothing under a sheet, back before the first edit), saveAlerts (a full shelf, a storage that throws, Copy link),
// shareLink (the copied ?design= link opens the same design; a refused clipboard opens the copy sheet) and weigh.
// Run it with `npm run check:browser proving-ground`.
import assert from 'node:assert/strict';
import { pressMenu } from './app-ui.mjs';
import { assertNoErrors, env, imageIs, insideViewport, launch, minTarget, noSidewaysScroll, shot, textNotCut, trapErrors } from './lib/checks.mjs';

const base = env('PLAYABLE_URL');
const POOL = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'archer', 'paladin', 'guard', 'maester', 'beast', 'ogre'];
/** The marks of the scene test (src/workshop/scene.test.ts, the hand scenes of the mockup). */
const PAWN = ['c5 take', 'd5 move', 'd6 move asleep', 'e5 take'];
const PALADIN = [
  ...'d6 e5 f6 e4 f4 g4 h4 e3 f2 g1 d3 d2 d1 c3 a1 c4 b4 a4 c5'.split(' ').map(q => `${q} move`), 'd7 take', 'b6 take',
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
async function has(p, want, why) {
  const m = await marks(p);
  for (const w of want) assert.ok(m.includes(w), `${why}: no ${w} in ${m.join(', ')}`);
  return m;
}

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
      await minTarget(p, '#workshop button:not(.sq)', 44);
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
  await q.evaluate(() => {
    const set = Storage.prototype.setItem;
    window.unbreak = () => { Storage.prototype.setItem = set; };
    Storage.prototype.setItem = () => { throw new Error('refused'); };
  });
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
  await p.click('.pg-share');
  await copied(p, 'Share copies the link');
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
  const q = await open(`?workshop=a&design=${code}`);
  await q.locator('#workshop.pg[open]').waitFor();
  assert.equal(await name(q), 'My Pawn', 'the link opens the same design');
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
  await q.click('[data-act="more"]');
  await q.click('.pg-morepop [data-act="weigh"]');
  assert.equal(await toast(q), `${head} ${like}`, 'on the phone, Weigh from ⋯ is a toast');
  await q.context().close();
}

try {
  await opens();
  await poolPieces();
  await yours();
  await link();
  await keys();
  await layouts();
  await oldDefault();
  await paint();
  await firstCopy();
  await undo();
  await saveAlerts();
  await shareLink();
  await weigh();
  assertNoErrors();
  console.log('proving-ground: all groups pass');
} finally {
  await browser.close();
}
