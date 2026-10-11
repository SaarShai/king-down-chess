// W13: the move legend (docs/specs/move-legend ticket 01) on the painted board, the clay look and the Workshop.
// A green tile moves; a white tile with a red target takes only; a green tile with the target moves or takes;
// the target with an arrow is a shot; a take on a figure is a red edge and the badge at the top-left.
// The threats states (move-legend ticket 04) show Settings → Show threats: the Workshop's red threat arrows and the red glow.
// Ticket 03: the painted board has the Workshop's coordinates, the gold glow under the selected piece and the rails of its lines;
// workshop-queen shows the Workshop's own rails, which stay as they were.
// Run: SAMPLE=W13 node docs/specs/web-ux/capture.mjs <base-url> <out-dir>. Renders stay outside Git.
import { keepWorkshopCopy, pressMenu, usePower } from '../../../../tools/app-ui.mjs';

const save = fen => ({ back: '', fen, moves: [], white: 'human', black: 'human', sound: false });
// The queen on d4 (dark); enemies on b6 and f2 (dark), d7 and g4 (light).
const QUEEN = save('k7/3p4/1n6/8/3Q2b1/8/5r2/7K w - - 0 1');
// The same, turned: Black's queen on d5 with enemies on b3, f7, d2 and g5; White is the computer, so the board turns.
const BLACK = { ...save('7K/5R2/8/3q2N1/8/1B6/3P4/k7 b - - 0 1'), white: 'ai' };
const KNIGHT = save('k7/8/2p1p3/8/3N4/8/8/7K w - - 0 1');
// The Archer on d4 shoots b6 and f6 (dark); on e4 it shoots c6 and g6 (light).
const ARCHER = save('4k3/8/1p3r2/8/3A4/8/8/4K3 w - - 0 1');
const ARCHER_LIGHT = save('4k3/8/2p3r1/8/4A3/8/8/4K3 w - - 0 1');
// White's king on e1 is in check from the rook on e4; its four moves stand next to the check ring.
const CHECK = save('4k3/8/8/8/4r3/8/8/4K3 w - - 0 1');
const POWER = `?kings=stratus:flight,none&fen=${encodeURIComponent('4k3/p7/8/8/8/8/P7/1N2K3 w - - 0 1')}`;
// Haste on the rook a1 under the 2017 rules (as printed, Haste may take): a5 is a power take on a figure, and its two
// blue frames reach past the square. The game's own rules have no power that takes.
const HASTE = `?rules=2017&kings=flame:haste,none&fen=${encodeURIComponent('7k/8/8/r3r3/8/8/8/R5K1 w - - 0 1')}`;
// The rook a5 takes the knight e5, and the queen e4 stands in front of e5.
const DEPTH = save('4k3/8/8/R3n3/4Q3/8/8/4K3 w - - 0 1');
// Show threats on (ticket 02): the rook d5 attacks the knight d2 and covers d3 and b5, where the queen b3 can move.
const THREATS = { ...save('4k3/8/8/3r4/8/1Q6/3N4/4K3 w - - 0 1'), threats: true };
const START = save('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
/** The Workshop from the menu, with the pool Queen open. */
const workshopQueen = async ({ page }) => {
  await pressMenu(page, 'Workshop');
  await page.locator('#workshop.pg[open]').waitFor();
  if (await page.isHidden('.pg-ledge')) await page.click('[data-act="pieces"]');
  await page.click('.slot[data-piece="queen"]');
  await page.locator('.slot[data-piece="queen"][aria-current="true"]').waitFor({ state: 'attached' });
};

/** Taps a square and checks the engine's marks (moves and captures of the selected piece) before the shot. */
const select = (sq, want) => async ({ page, tap }) => {
  await tap(sq);
  const got = await page.evaluate(() => {
    const h = window.view.marks ?? window.view.highlights, sorted = l => [...l ?? []].sort((a, b) => a - b);
    return { moves: sorted(h.moves).length, captures: sorted(h.captures), shots: sorted(h.shots), powerMoves: !!h.powers?.length && h.powers.length === h.moves?.length,
      powerCaptures: sorted(h.captures).filter(sq => h.powers?.includes(sq)) };
  });
  for (const [key, value] of Object.entries(want)) {
    if (JSON.stringify(got[key]) !== JSON.stringify(value)) throw new Error(`W13: ${key} is ${JSON.stringify(got[key])}, not ${JSON.stringify(value)}`);
  }
};
const threatQueen = select(17, { captures: [35] });
// A tap on the enemy rook reads it: its half-strength take mark lands on the threatened knight d2.
const readRook = ({ tap }) => tap(35);
const queen = select(27, { moves: 19, captures: [13, 30, 41, 51], shots: [] });
const hover = sq => async context => {
  await queen(context);
  const p = await context.page.evaluate(s => window.view.screenOf(s), sq);
  await context.page.mouse.move(p.x, p.y);
};
const hasteTake = async context => { await usePower(context.page); await select(0, { powerCaptures: [32] })(context); };
// The clay camera at the lowest angle a player can tilt it to: a figure then stands in front of the badge of the square behind it.
const tilt = ({ page }) => page.evaluate(() => {
  const { camera, controls } = window.view, t = controls.target, o = camera.position.clone().sub(t), r = o.length();
  const phi = controls.maxPolarAngle, theta = Math.atan2(o.x, o.z);
  camera.position.set(t.x + r * Math.sin(phi) * Math.sin(theta), t.y + r * Math.cos(phi), t.z + r * Math.sin(phi) * Math.cos(theta));
  controls.update();
});
const deuteranopia = steps => async context => {
  await (await context.page.context().newCDPSession(context.page)).send('Emulation.setEmulatedVisionDeficiency', { type: 'deuteranopia' });
  await steps(context);
};

// A Workshop design with each legend mark: c5 moves; e5 and c6 move or take; d6 and e6 take; f5 and b6 shoot; f6 and b5
// move or shoot; and an east line. Alone on d4, each mark stands on an empty square of the Workshop board.
const design = {
  kind: 'piece', name: 'Legend Tester',
  look: { figure: 'antler-guardian', body: 'token', auto: true, glow: null, army: 0 }, letter: 'D',
  squares: [
    { x: 1, y: 1, mark: 'both' }, { x: -1, y: 1, mark: 'move' }, { x: 0, y: 2, mark: 'take' },
    { x: 2, y: 1, mark: 'shoot' }, { x: 2, y: 2, mark: 'moveShoot' },
    { x: -1, y: 2, mark: 'both' }, { x: 1, y: 2, mark: 'take' }, { x: -2, y: 2, mark: 'shoot' }, { x: -2, y: 1, mark: 'moveShoot' },
  ],
  lines: ['e'], rules: [],
};
const WORKSHOP = `?design=${Buffer.from(JSON.stringify(design)).toString('base64url')}`;
// The board squares are 24 px or more (Workshop spec, decision 9), so the touch test leaves them out, as in W14.
const targets = 'button:not(.sq, .nub, .knot), select, summary, label';
/** Keep a copy from the card face that the link opens; then each legend mark shows on the Workshop board. */
const editor = async ({ page }) => {
  await keepWorkshopCopy(page).click();
  for (const k of ['move', 'take', 'both', 'shot', 'moveshot']) await page.locator(`.pg-board [data-k="${k}"]`).first().waitFor({ state: 'attached' });
};

export default {
  sizes: ['phone', 'desktop'],
  states: [
    { name: 'painted-queen', save: QUEEN, steps: queen },
    { name: 'painted-start', save: START, steps: select(6, { moves: 2, captures: [] }) },
    { name: 'workshop-queen', targets, steps: workshopQueen },
    { name: 'painted-knight', save: KNIGHT, steps: select(27, { moves: 6, captures: [42, 44] }) },
    { name: 'painted-archer', save: ARCHER, steps: select(27, { captures: [41, 45], shots: [41, 45] }) },
    { name: 'painted-archer-light', save: ARCHER_LIGHT, steps: select(28, { captures: [42, 46], shots: [42, 46] }) },
    { name: 'painted-hover-move', save: QUEEN, steps: hover(35) },
    { name: 'painted-hover-take', save: QUEEN, steps: hover(41) },
    { name: 'painted-power-take', query: HASTE, steps: hasteTake },
    { name: 'painted-power', query: POWER, steps: async context => { await usePower(context.page); await select(1, { powerMoves: true })(context); } },
    { name: 'clay-queen', query: '?look=clay', save: QUEEN, steps: queen },
    { name: 'clay-archer', query: '?look=clay', save: ARCHER, steps: select(27, { captures: [41, 45], shots: [41, 45] }) },
    { name: 'clay-power', query: `${POWER}&look=clay`, steps: async context => { await usePower(context.page); await select(1, { powerMoves: true })(context); } },
    { name: 'clay-power-take', query: `${HASTE}&look=clay`, steps: hasteTake },
    { name: 'clay-depth', query: '?look=clay', save: DEPTH, steps: async context => { await select(32, { moves: 10, captures: [36] })(context); await tilt(context); } },
    { name: 'clay-black', query: '?look=clay', save: BLACK, steps: select(35, { moves: 19, captures: [11, 17, 38, 53] }) },
    { name: 'clay-check', query: '?look=clay', save: CHECK, steps: select(4, { moves: 4, captures: [] }) },
    { name: 'workshop-editor', query: WORKSHOP, targets, steps: editor },
    { name: 'workshop-read', query: WORKSHOP, targets, steps: async ({ page }) => { await page.locator('#workshop .pg-face').waitFor(); } },
    { name: 'painted-queen-deut', save: QUEEN, steps: deuteranopia(queen) },
    { name: 'clay-queen-deut', query: '?look=clay', save: QUEEN, steps: deuteranopia(queen) },
    { name: 'painted-threats', save: THREATS },
    { name: 'painted-threats-queen', save: THREATS, steps: threatQueen },
    { name: 'painted-threats-read', save: THREATS, steps: readRook },
    { name: 'painted-threats-dark', save: THREATS, steps: threatQueen, scheme: 'dark' },
    { name: 'clay-threats-queen', query: '?look=clay', save: THREATS, steps: threatQueen },
    { name: 'clay-threats-read', query: '?look=clay', save: THREATS, steps: readRook },
    { name: 'painted-threats-queen-deut', save: THREATS, steps: deuteranopia(threatQueen) },
    { name: 'clay-threats-queen-deut', query: '?look=clay', save: THREATS, steps: deuteranopia(threatQueen) },
    { name: 'workshop-editor-deut', query: WORKSHOP, targets, steps: deuteranopia(editor) },
  ],
};
