/**
 * Motion art for the New game king picker (src/new-game.ts): a looping board vignette for each of
 * the twelve kings' powers, and a live element effect for each king's emblem. Inline SVG, moved by
 * the CSS animations in power-motion.css (transform and opacity, plus one stroke draw), so nothing
 * here runs a script per frame and nothing changes layout.
 *
 * Each vignette is a 5 × 3 patch of board (16 units a square), our side at the bottom moving up,
 * our pieces ivory and the enemy's dark. The markup with no animation is the still frame that best
 * shows the power: an idle button and `prefers-reduced-motion` show it; every loop starts and ends
 * on it. The scenes follow the official readings (powerText in src/powers-ui.ts).
 *
 * Markup carries no text and no whitespace between tags, so a button's text is still its label.
 */
import './power-motion.css';
import type { KingName, PowerName } from './rules/engine';

type Kind = 'pawn' | 'king' | 'rook' | 'knight' | 'bishop';
type Side = 'w' | 'b';

/** Piece silhouettes in a 16-unit square, standing on y ≈ 14.6. */
const SHAPE: Record<Kind, string> = {
  pawn: 'M5 14.6h6c0-1.4-.9-2.1-1.8-2.5-.4-.8-.6-1.9-.6-3h.9V8h-.7a2.4 2.4 0 1 0-1.6 0h-.7v1.1h.9c0 1.1-.2 2.2-.6 3-.9.4-1.8 1.1-1.8 2.5z',
  king: 'M3.8 14.6h8.4v-1.4H3.8zM4.6 12.8h6.8l.9-5c-1.3-.9-2.7-1.3-4.3-1.3s-3 .4-4.3 1.3zM7.3 1.2h1.4v1.5h1.5V4H8.7v2.3H7.3V4H5.8V2.7h1.5z',
  rook: 'M3.9 14.6h8.2V13h-1.1l-.6-5.2h1.3V4h-1.8v1.4H8.8V4H7.2v1.4H6.1V4H4.3v3.8h1.3L5 13H3.9z',
  knight: 'M4.4 14.6h7.7c.2-3.2-.3-6.4-2-8.6-1-1.3-2.3-2.1-3.6-2.3l.3 1.2c-1 .5-2 1.6-2.8 3-.3.6 0 1.2.6 1.3l1.3-.4c.5-.4 1.2-.6 1.9-.7-.3 1.5-1.5 2.4-2.4 3.5-.6.8-.9 1.8-1 3z',
  bishop: 'M4.4 14.6h7.2v-1.4H4.4zM5.4 12.8h5.2c.5-1.5.6-3.2-.2-4.8L8.8 10l-.7-.6 1.5-2.1c-.5-.6-1-1-1.6-1.3-1.6.9-2.7 2.6-2.9 4.5-.1.8 0 1.6.3 2.3zM8 2.1a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z',
};
const LEAF = 'M0-3.6C2.6-2.8 2.8 2 0 3.8-2.8 2-2.6-2.8 0-3.6z';
const STAR = 'M0-5L1.1-1.1 5 0 1.1 1.1 0 5-1.1 1.1-5 0-1.1-1.1z';

let uid = 0;
const at = (c: number, r: number): string => `translate(${c * 16} ${r * 16})`;
const ground = '<ellipse class="gs" cx="8" cy="14.6" rx="4.6" ry="1.3"/>';
const shape = (k: Kind, side: Side, cls = ''): string => `<path class="${side}${cls ? ' ' + cls : ''}" d="${SHAPE[k]}"/>`;
/** A piece on square (c, r); `cls` names its animation. `inner` is drawn over it and moves with it. */
const piece = (k: Kind, side: Side, c: number, r: number, cls = '', inner = '', shadow = true): string =>
  `<g transform="${at(c, r)}"><g${cls ? ` class="a ${cls}"` : ''}>${shadow ? ground : ''}${shape(k, side)}${inner}</g></g>`;
/** A group at (x, y) whose inner group carries the animation class. */
const put = (x: number, y: number, cls: string, body: string): string =>
  `<g transform="translate(${x} ${y})"><g class="a ${cls}">${body}</g></g>`;

/**
 * A piece that hops or flies: the outer group (`move`) carries the path over the board and the
 * ground shadow, the inner one (`lift`) the height, so the arc is a smooth curve.
 */
const hopper = (k: Kind, side: Side, c: number, r: number, move: string, lift: string, under = '', over = ''): string =>
  `<g transform="${at(c, r)}"><g class="a ${move}">${under}<g class="a ${lift}">${over}${shape(k, side)}</g></g></g>`;

const board = (id: string): string => {
  let sq = '';
  for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) if ((c + r) % 2 === 0) sq += `<rect x="${c * 16}" y="${r * 16}" width="16" height="16"/>`;
  return `<defs><radialGradient id="${id}l" cx=".5" cy=".38" r=".62"><stop offset="0" stop-color="#ffe7b8" stop-opacity=".2"/><stop offset="1" stop-color="#ffe7b8" stop-opacity="0"/></radialGradient></defs>`
    + `<rect class="sq-d" width="80" height="48"/><g class="sq-l">${sq}</g><rect width="80" height="48" fill="url(#${id}l)"/>`;
};
const grad = (id: string, color: string, a0 = 1, a1 = 0): string =>
  `<radialGradient id="${id}"><stop offset="0" stop-color="${color}" stop-opacity="${a0}"/><stop offset="1" stop-color="${color}" stop-opacity="${a1}"/></radialGradient>`;

/** The scene of each power, drawn over the board. `g` makes gradient ids unique to this copy. */
const SCENES: Record<PowerName, (g: string) => string> = {
  // Freeze: an ice shard from the king; the enemy rook frosts over and only shakes when it would move.
  Freeze: g => `<defs>${grad(g + 'a', '#bfe8ff', .55)}</defs><circle cx="24" cy="40" r="9" fill="url(#${g}a)"/>`
    + piece('king', 'w', 1, 2)
    + piece('rook', 'b', 3, 0, 'fz-rook', `<path class="a fz-tint" d="${SHAPE.rook}"/>`)
    + put(48, 0, 'fz-ice', '<path class="ice" d="M1.6 15.4 1 6.6 4.6 1.6 11 1l4 4.4-.4 10z"/><path class="facet" d="M4.6 1.6 6.6 8 1 6.6M6.6 8 11 1M6.6 8l2.8 7.4M11 1l1 8 3-3.6M12 9l-2.6 6.4"/>')
    + put(61.5, 3.2, 'c fz-flake', '<path class="flake" d="M0-3v6M-2.6-1.5l5.2 3M-2.6 1.5l5.2-3"/>')
    + put(24, 37, 'c fz-bolt', '<path class="bolt-tail" d="M0 0-6 5.2"/><path class="bolt" d="M0-2.4 1.6 0 0 2.4-1.6 0z" transform="rotate(41)"/>')
    + put(56, 9, 'c fz-ring', '<circle class="ring-ice" r="5"/>'),

  // Ice Wall: an ice dome rises over our knight; the enemy bishop strikes it and bounces off.
  IceWall: () => piece('bishop', 'b', 3, 0, 'iw-bishop')
    + piece('knight', 'w', 1, 2)
    + put(16, 32, 'iw-wall', '<path class="ice" d="M1 15.6V7.4Q1 1 8 1t7 6.4v8.2z"/><path class="facet" d="M1 7.4 5 4.6l3 2.2 3-2.2 4 2.8M5 4.6v11M11 4.6v11M8 6.8v8.8"/><path class="glint" d="M2.6 13V7.8Q2.8 3.6 6.4 2.7"/>')
    + put(30.5, 33.5, 'c iw-spark', '<path class="spark" d="M0-4v8M-4 0h8M-2.8-2.8l5.6 5.6M-2.8 2.8l5.6-5.6"/>'),

  // Strike: our knight dashes like a queen, four squares along a line, trailing fire.
  Strike: g => `<defs><linearGradient id="${g}t"><stop offset="0" stop-color="#ff7a1a" stop-opacity="0"/><stop offset=".7" stop-color="#ff8c2a" stop-opacity=".75"/><stop offset="1" stop-color="#ffd27a"/></linearGradient></defs>`
    + piece('pawn', 'b', 3, 0) + piece('pawn', 'w', 1, 2)
    + put(9, 24, 'l st-trail', `<path d="M0-.5 57-3.6v7.2L0 .5z" fill="url(#${g}t)"/>`)
    + piece('knight', 'w', 4, 1, 'st-knight')
    + put(70, 24, 'c st-burst', '<circle class="ember" cx="-3" cy="-6" r="1.1"/><circle class="ember" cx="2" cy="6" r=".9"/><circle class="ember" cx="-6" cy="3" r=".8"/><circle class="ember" cx="4" cy="-3" r=".7"/>'),

  // Haste: one rook moves twice in a turn, up then across; a pip lights for each move.
  Haste: () => '<path class="a hs-path trace-fire" d="M8 41V9h45"/>'
    + piece('pawn', 'w', 2, 2)
    + `<g transform="${at(0, 2)}"><path class="a hs-g1 ghost-fire" d="${SHAPE.rook}"/></g>`
    + `<g transform="${at(0, 0)}"><path class="a hs-g2 ghost-fire" d="${SHAPE.rook}"/></g>`
    + piece('rook', 'w', 3, 0, 'hs-rook')
    + '<circle class="a c hs-p1 pip" cx="67" cy="41" r="2.3"/><circle class="a c hs-p2 pip" cx="74" cy="41" r="2.3"/>',

  // Flight: a bishop is lifted on the wind, over its own pawns, to an empty square of our half. Its
  // shadow is drawn first, so it passes under the pawns it flies over.
  Flight: () => '<path class="trace-air" d="M8 45Q40-10 72 45"/>'
    + `<g transform="${at(4, 2)}"><g class="a fl-piece"><ellipse class="a c fl-shadow gs" cx="8" cy="14.6" rx="4.6" ry="1.4"/></g></g>`
    + piece('pawn', 'w', 1, 1) + piece('pawn', 'w', 3, 1) + piece('pawn', 'w', 2, 2)
    + hopper('bishop', 'w', 4, 2, 'fl-piece', 'fl-lift', '',
      '<g class="a fl-gust"><path class="gust" d="M1.5 16.4q3.2 2.2 6.5 0t6.5 0"/><path class="gust" d="M4 19q2-1.4 4 0t4 0"/></g>'),

  // Sacrifice: a captured rook's spirit comes back down into one of our pawns, which becomes it.
  Sacrifice: g => `<defs><linearGradient id="${g}b" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffe9a8" stop-opacity=".95"/><stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/></linearGradient></defs>`
    + piece('pawn', 'w', 1, 2) + piece('pawn', 'w', 3, 2)
    + put(32, 0, 'sc-beam', `<rect x="3.5" y="-2" width="9" height="33" rx="4.5" fill="url(#${g}b)"/>`)
    + piece('pawn', 'w', 2, 1, 'sc-pawn')
    + piece('rook', 'w', 2, 1, 'sc-rook')
    + `<g transform="${at(2, 1)}"><g class="a sc-ghost"><path class="ghost" d="${SHAPE.rook}"/></g></g>`
    + put(40, 28, 'c sc-flash', '<circle class="ring-gold" r="6"/>'),

  // March: two pawns, one after the other, step two squares at once.
  March: () => '<g class="a mr-pa"><circle class="print" cx="22.5" cy="41" r=".9"/><circle class="print" cx="25.5" cy="38.5" r=".9"/><circle class="print" cx="22.5" cy="25" r=".9"/><circle class="print" cx="25.5" cy="22.5" r=".9"/></g>'
    + '<g class="a mr-pb"><circle class="print" cx="54.5" cy="41" r=".9"/><circle class="print" cx="57.5" cy="38.5" r=".9"/><circle class="print" cx="54.5" cy="25" r=".9"/><circle class="print" cx="57.5" cy="22.5" r=".9"/></g>'
    + piece('pawn', 'w', 0, 2) + piece('pawn', 'w', 4, 2)
    + piece('pawn', 'w', 1, 0, 'mr-a') + piece('pawn', 'w', 3, 2, 'mr-b')
    + put(24, 15, 'c mr-da', '<circle class="dust" cx="-4" r="1.6"/><circle class="dust" cx="4" r="1.6"/><circle class="dust" cy="-1" r="1.2"/>')
    + put(56, 15, 'c mr-db', '<circle class="dust" cx="-4" r="1.6"/><circle class="dust" cx="4" r="1.6"/><circle class="dust" cy="-1" r="1.2"/>'),

  // Leap: a rook vaults its own pawns along its line.
  Leap: () => '<path class="trace-leaf" d="M8 30Q32 2 56 30"/>'
    + piece('pawn', 'w', 1, 1) + piece('pawn', 'w', 2, 1)
    + hopper('rook', 'w', 3, 1, 'lp-rook', 'lp-lift', ground)
    + put(24, 10, 'c lp-leaf lp-l1', `<path class="leaf" d="${LEAF}"/>`)
    + put(37, 8, 'c lp-leaf lp-l2', `<path class="leaf leaf-2" d="${LEAF}"/>`)
    + put(45, 14, 'c lp-leaf lp-l3', `<path class="leaf" d="${LEAF}"/>`),

  // Holy Light: the king's light covers the squares beside, in front and behind; an enemy pawn's
  // capture of the king is turned back.
  HolyLight: g => {
    let rays = '';
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6, d = .07, R = 22;
      const p = (t: number) => `${(R * Math.cos(t)).toFixed(1)} ${(R * Math.sin(t)).toFixed(1)}`;
      rays += `M0 0L${p(a - d)}L${p(a + d)}z`;
    }
    return `<defs><radialGradient id="${g}r" gradientUnits="userSpaceOnUse" r="22"><stop offset=".15" stop-color="#ffe7a0" stop-opacity=".9"/><stop offset="1" stop-color="#ffe7a0" stop-opacity="0"/></radialGradient>${grad(g + 'h', '#fff2c4', .85)}</defs>`
      + '<g class="a hl-cross"><rect class="holy" x="16" y="16" width="16" height="16"/><rect class="holy" x="48" y="16" width="16" height="16"/><rect class="holy" x="32" y="0" width="16" height="16"/><rect class="holy" x="32" y="32" width="16" height="16"/></g>'
      + put(40, 23, 'c hl-rays', `<path d="${rays}" fill="url(#${g}r)"/>`)
      + `<circle class="a c hl-halo" cx="40" cy="23" r="9" fill="url(#${g}h)"/>`
      + piece('pawn', 'w', 1, 1) + piece('pawn', 'w', 3, 1) + piece('rook', 'w', 2, 2)
      + piece('king', 'w', 2, 1)
      + piece('pawn', 'b', 1, 0, 'hl-pawn')
      + put(32, 16, 'c hl-flash', '<path class="spark-gold" d="M0-4.5v9M-4.5 0h9M-3 -3l6 6M-3 3l6-6"/>');
  },

  // Mercy: the king steps two squares, over its own pawn; the pieces next to it are sheltered.
  Mercy: g => `<defs>${grad(g + 's', '#fff1c8', .55, .1)}</defs>`
    + '<path class="a mc-arc trace-gold" d="M8 30Q24 6 40 30"/>'
    + `<g transform="${at(2, 1)}"><g class="a mc-king"><rect class="a c mc-aura" x="-15" y="-15" width="46" height="46" rx="7" fill="url(#${g}s)"/></g></g>`
    + `<g transform="${at(1, 1)}"><ellipse class="shield" cx="8" cy="14.6" rx="5.6" ry="2"/></g>${piece('pawn', 'w', 1, 1)}`
    + `<g transform="${at(3, 2)}"><ellipse class="a mc-sh shield" cx="8" cy="14.6" rx="5.6" ry="2"/></g>${piece('knight', 'w', 3, 2)}`
    + hopper('king', 'w', 2, 1, 'mc-king', 'mc-lift', ground),

  // Death Touch: the king does not move; its touch takes the enemy knight two squares away.
  DeathTouch: g => `<defs>${grad(g + 'a', '#7b4bb3', .55)}${grad(g + 's', '#2a1838', .8)}</defs>`
    + `<circle class="a c dt-aura" cx="24" cy="23" r="10" fill="url(#${g}a)"/>`
    + piece('king', 'w', 1, 1)
    + piece('knight', 'b', 3, 1, 'dt-enemy')
    + '<path class="a dt-tendril tendril-glow" d="M29 21c3-5 7 4 11 0s8-5 12 0" pathLength="100"/><path class="a dt-tendril tendril" d="M29 21c3-5 7 4 11 0s8-5 12 0" pathLength="100"/>'
    + `<circle class="a c dt-s1" cx="53" cy="20" r="4" fill="url(#${g}s)"/><circle class="a c dt-s2" cx="58" cy="22" r="3.4" fill="url(#${g}s)"/><circle class="a c dt-s3" cx="56" cy="17" r="3" fill="url(#${g}s)"/>`,

  // Darkness: a pawn steps diagonally; another takes only straight ahead.
  Darkness: g => `<defs><radialGradient id="${g}d" cx=".5" cy=".5" r=".7"><stop offset=".35" stop-color="#140c1c" stop-opacity="0"/><stop offset="1" stop-color="#140c1c" stop-opacity=".7"/></radialGradient>${grad(g + 's', '#2a1838', .85)}</defs>`
    + `<rect width="80" height="48" fill="url(#${g}d)"/>`
    + '<path class="a dk-ta wisp" d="M9 41Q11 31 23 26"/><path class="a dk-tb wisp" d="M56 29V14"/>'
    + piece('pawn', 'w', 1, 1, 'dk-a')
    + piece('pawn', 'b', 3, 0, 'dk-e')
    + piece('pawn', 'w', 3, 1, 'dk-b')
    + `<circle class="a c dk-sm" cx="56" cy="9" r="5" fill="url(#${g}s)"/>`,
};

/** A power's vignette (or the plain king of "No power"), for inside its button. */
export function powerArt(power: PowerName | null): string {
  const g = `pm${++uid}`;
  const scene = power ? SCENES[power](g) : piece('king', 'w', 2, 1);
  return `<span class="pm pm-${power ?? 'none'}" aria-hidden="true"><svg viewBox="0 0 80 48" focusable="false">${board(g)}${scene}</svg></span>`;
}

/* ---- the emblems' element effects: a layer behind the emblem and one in front, in a 100-unit box ---- */

const sparkle = (x: number, y: number, s: number, n: number): string =>
  `<g transform="translate(${x} ${y}) scale(${s})"><path class="a c kx-tw kx-d${n} star" d="${STAR}"/></g>`;
const dot = (cls: string, x: number, y: number, r: number, n: number): string =>
  `<circle class="a c ${cls} kx-d${n}" cx="${x}" cy="${y}" r="${r}"/>`;

/**
 * A gust from (x, y), `len` long to the right (`dir` 1) or left (-1), bending by `bend`, ending in a
 * curl up (`curl` 1) or down (-1). Drawn and erased along its length (pathLength 100) by CSS.
 */
function gust(x: number, y: number, len: number, bend: number, curl: number, cls: string, width: 1 | 2): string {
  const d = (dx: number) => (dx * (x > 50 ? -1 : 1) * (Math.abs(dx) < 10 ? 1.35 : 1)).toFixed(1), c = (dy: number) => (dy * curl * 1.35).toFixed(1);
  const path = `M${x} ${y}c${d(len * .3)} ${-bend} ${d(len * .62)} ${bend} ${d(len)} ${c(-1.5)}`
    + `c${d(5)} ${c(-1)} ${d(8)} ${c(-5)} ${d(5)} ${c(-8)}c${d(-2.6)} ${c(-2.6)} ${d(-6.4)} ${c(-.6)} ${d(-5)} ${c(2.4)}c${d(.9)} ${c(1.8)} ${d(3.4)} ${c(1.4)} ${d(3.6)} ${c(-.2)}`;
  return `<path class="a kx-gust ${cls} gust-${width}" d="${path}" pathLength="100"/>`;
}

/**
 * `arms` spiral arms around (50, 50), each turning inward counter-clockwise from radius `r` to 4 and
 * narrowing from `w` radians; `turn0` rotates the whole set. Turned clockwise, the arms seem to flow in.
 */
function vortex(arms: number, r: number, w: number, turn0: number): string {
  const T = 1.7 * Math.PI, N = 26, k = Math.log(r / 4) / T;
  const pt = (t: number, a: number) => {
    const rad = r * Math.exp(-k * t);
    return `${(50 + rad * Math.cos(a)).toFixed(1)} ${(50 + rad * Math.sin(a)).toFixed(1)}`;
  };
  let d = '';
  for (let i = 0; i < arms; i++) {
    const base = turn0 + i * 2 * Math.PI / arms, edge: string[] = [], back: string[] = [];
    for (let j = 0; j <= N; j++) {
      const t = T * j / N, a = base - t;
      edge.push(pt(t, a));
      back.push(pt(t, a + w * (1 - .7 * j / N)));
    }
    d += `M${edge.join('L')}L${back.reverse().join('L')}z`;
  }
  return d;
}

const FX: Record<KingName, (g: string) => [back: string, front: string]> = {
  Frost: g => [
    `<defs>${grad(g, '#9fd8ff', .75)}</defs><circle class="a c kx-glow" cx="50" cy="56" r="48" fill="url(#${g})"/>`,
    sparkle(26, 30, 1.45, 0) + sparkle(70, 18, 1.1, 1) + sparkle(84, 60, 1.3, 2) + sparkle(16, 72, 1.1, 3) + sparkle(52, 8, .95, 4) + sparkle(62, 84, 1.2, 5)
      + dot('kx-snow snow', 34, 10, 1.4, 1) + dot('kx-snow snow', 76, 34, 1.1, 3) + dot('kx-snow snow', 12, 44, 1.2, 5),
  ],
  Flame: g => [
    `<defs>${grad(g, '#ff8a2a', .7)}</defs><ellipse class="a c kx-heat" cx="50" cy="60" rx="44" ry="46" fill="url(#${g})"/>`,
    dot('kx-ember ember', 44, 34, 2.6, 0) + dot('kx-ember ember', 58, 18, 2.1, 1) + dot('kx-ember ember', 36, 8, 1.8, 2) + dot('kx-ember ember', 66, 42, 2.3, 3)
      + dot('kx-ember ember', 28, 26, 2, 4) + dot('kx-ember ember ember-hot', 52, 4, 1.7, 5) + dot('kx-ember ember ember-hot', 72, 22, 1.6, 6)
      + dot('kx-ember ember ember-hot', 40, 50, 1.5, 3) + dot('kx-ember ember', 62, 58, 1.8, 5),
  ],
  // Stratus: wind gusts behind the emblem, each a curved streak with a curled tip that sweeps across
  // and fades, at its own speed. The emblem has its own painted clouds.
  Stratus: g => [
    `<defs>${grad(g, '#cfe6ff', .7)}</defs><circle class="a c kx-glow" cx="50" cy="50" r="48" fill="url(#${g})"/>`
      + gust(-12, 8, 82, 8, 1, 'kx-g1', 1) + gust(112, 20, 70, -8, -1, 'kx-g2', 2) + gust(-14, 66, 60, 7, -1, 'kx-g3', 1)
      + gust(114, 86, 76, 8, 1, 'kx-g4', 2) + gust(-10, 94, 66, -6, 1, 'kx-g5', 1) + gust(110, 36, 46, 6, -1, 'kx-g6', 2),
    '',
  ],
  Mud: g => [
    `<defs><radialGradient id="${g}"><stop offset="0" stop-color="#9aae4a" stop-opacity=".7"/><stop offset=".6" stop-color="#8a6a32" stop-opacity=".3"/><stop offset="1" stop-color="#8a6a32" stop-opacity="0"/></radialGradient></defs><circle class="a c kx-glow" cx="50" cy="56" r="48" fill="url(#${g})"/>`,
    `<g transform="translate(18 26) scale(1.6)"><path class="a c kx-leaf kx-d0 leaf" d="${LEAF}"/></g>`
      + `<g transform="translate(80 16) scale(1.4)"><path class="a c kx-leaf kx-d2 leaf leaf-2" d="${LEAF}"/></g>`
      + `<g transform="translate(70 70) scale(1.3)"><path class="a c kx-leaf kx-d4 leaf leaf-3" d="${LEAF}"/></g>`
      + dot('kx-mote mote', 30, 84, 2.2, 1) + dot('kx-mote mote', 58, 90, 1.8, 3) + dot('kx-mote mote', 44, 78, 1.6, 5),
  ],
  Spirit: g => {
    let rays = '';
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6, d = .09, R = 58;
      const p = (t: number) => `${(50 + R * Math.cos(t)).toFixed(1)} ${(48 + R * Math.sin(t)).toFixed(1)}`;
      rays += `M50 48L${p(a - d)}L${p(a + d)}z`;
    }
    return [
      `<defs><radialGradient id="${g}" gradientUnits="userSpaceOnUse" cx="50" cy="48" r="58"><stop offset=".2" stop-color="#f3cd6a" stop-opacity=".75"/><stop offset="1" stop-color="#f3cd6a" stop-opacity="0"/></radialGradient></defs>`
        + `<path class="a c kx-rays" d="${rays}" fill="url(#${g})"/>`
        + '<circle class="a c kx-halo kx-d0 halo" cx="50" cy="48" r="30"/><circle class="a c kx-halo kx-d3 halo" cx="50" cy="48" r="30"/>',
      dot('kx-rise light', 30, 70, 1.4, 1) + dot('kx-rise light', 70, 66, 1.2, 4) + dot('kx-rise light', 54, 80, 1.1, 2),
    ];
  },
  // Shadow: a dark purple vortex behind the emblem, turning slowly; fainter arms and motes of light are
  // drawn into its eye.
  Shadow: g => {
    const ink = `<radialGradient id="${g}a" gradientUnits="userSpaceOnUse" cx="50" cy="50" r="62"><stop offset="0" stop-color="#050307" stop-opacity=".97"/>`
      + '<stop offset=".45" stop-color="#170a24" stop-opacity=".92"/><stop offset=".78" stop-color="#3a1863" stop-opacity=".72"/><stop offset="1" stop-color="#4a2380" stop-opacity="0"/></radialGradient>';
    const disc = `<radialGradient id="${g}d"><stop offset="0" stop-color="#050307" stop-opacity=".95"/><stop offset=".55" stop-color="#1f0e30" stop-opacity=".65"/><stop offset="1" stop-color="#2e1546" stop-opacity="0"/></radialGradient>`;
    return [
      `<defs>${ink}${disc}</defs><circle class="a c kx-eye" cx="50" cy="50" r="56" fill="url(#${g}d)"/>`
        + `<g class="a kx-vx kx-turn"><path d="${vortex(5, 62, .34, 0)}" fill="url(#${g}a)"/></g>`
        + `<g class="a kx-vx kx-pull kx-p0"><path class="vx-light" d="${vortex(5, 58, .16, .6)}"/></g>`
        + `<g class="a kx-vx kx-pull kx-p1"><path class="vx-light" d="${vortex(5, 58, .16, .6)}"/></g>`
        + [0, 1, 2, 3].map(n => `<circle class="a c kx-mote-in kx-m${n} vx-mote" cx="50" cy="50" r="1.5"/>`).join(''),
      '',
    ];
  },
};

/**
 * A king's emblem with its element effect: the effect layers sit behind and in front of the image
 * and show (and move) only while the emblem's button is pressed.
 */
export function emblemArt(king: KingName, img: string): string {
  const [back, front] = FX[king](`kx${++uid}`);
  const layer = (where: string, body: string) =>
    `<svg class="kx kx-${where}" viewBox="-15 -15 130 130" aria-hidden="true" focusable="false">${body}</svg>`;
  return `<span class="em-art kx-${king.toLowerCase()}">${layer('back', back)}${img}${layer('front', front)}</span>`;
}
