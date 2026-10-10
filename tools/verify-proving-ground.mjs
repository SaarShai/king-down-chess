// The Proving Ground, the Workshop's view A behind ?workshop=a (docs/specs/workshop-proving-ground, ticket 01).
// Groups: opens (the menu door, ‹ Menu and Esc, the focus back on the menu), poolPieces (each pool piece opens;
// the Pawn's and the Paladin's marks equal src/workshop/scene.test.ts), yours (the shelf designs in the ledge),
// link (a design link opens read only; a bad code shows the toast), keys (one tab stop, the arrow keys, the square
// labels, Enter and Space on a ledge slot keep the focus), layouts (six sizes: no sideways scroll, the top bar and the board in view, no cut text, 44 px targets and
// 24 px squares) and oldDefault (no ?workshop=a: the old Workshop opens).
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
const marks = p => p.$$eval('.pg-board [data-sq]', gs => gs.map(g => [g.dataset.sq, g.dataset.k, g.dataset.cond].filter(Boolean).join(' ')).sort());
const name = p => p.locator('.pg-name h3').textContent();
const focused = p => p.evaluate(() => document.activeElement?.dataset.sq ?? document.activeElement?.id ?? '');

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

try {
  await opens();
  await poolPieces();
  await yours();
  await link();
  await keys();
  await layouts();
  await oldDefault();
  assertNoErrors();
  console.log('proving-ground: all groups pass');
} finally {
  await browser.close();
}
