// The King Down board for the showcase demos: the app's painted look (src/render/PaintedView.ts and
// docs/2d-first-pieces/board/scene.mjs) rebuilt with DOM and CSS, so a demo can animate it with CSS
// and the Web Animations API.
//
//   import { createBoard } from '../../kit/board.js';
//   import KD from '../../kit/kd.js';
//   const board = createBoard(document.querySelector('#board'), { play: { level: 'beginner' } });
//   board.setState(KD.newGame({ army: 'random', seed: 3 }));
//
// The README lists the whole API. Geometry, in board units as the app draws it (one square = 112):
// the painted stone fills the 8 x 8 squares exactly; a slate frame 26 units wide holds the coordinates;
// each figure stands with its feet at 96 units down its square (centre + 40) and rises above it.
import KD from './kd.js';
import { prefersReducedMotion, sfx, haptic, openSheet, closeSheet } from './ui.js';

const ASSETS = new URL('../assets/', import.meta.url).href;
const FRAME = 26 / 112; // frame width in squares
const FOOT = 96 / 112; // where the feet stand, from the top of the square
const GROUND = 92 / 112; // where the app draws ground marks (foot - 4)
const FILES = 'abcdefgh';

/**
 * Where each painted figure's image sits in its square, in squares: [left, top, width, height, mirror].
 * Measured from the game's own canvas (scene.mjs): each figure was drawn alone on the board, and its
 * image in assets/ (a tight cut of the same sheet, docs/visual-design/make-ui-art.py) was fitted to it.
 * mirror = 1: the board shows the image flipped, as the game does.
 */
const FIG = {
  'pawn-w': [0.223, 0.068, 0.839, 0.994, 0], 'pawn-b': [-0.084, -0.093, 0.872, 1.098, 1],
  'knight-w': [0.022, -0.200, 0.760, 1.058, 0], 'knight-b': [0.258, -0.210, 0.715, 1.106, 1],
  'bishop-w': [0.235, -0.307, 0.669, 1.157, 1], 'bishop-b': [0.064, -0.307, 0.703, 1.184, 0],
  'rook-w': [0.009, -0.440, 1.072, 1.305, 1], 'rook-b': [-0.018, -0.449, 1.028, 1.331, 0],
  'queen-w': [-0.002, -0.191, 0.779, 1.052, 0], 'queen-b': [0.138, -0.200, 0.725, 1.079, 1],
  'archer-w': [0.123, -0.158, 0.779, 1.057, 0], 'archer-b': [0.111, -0.152, 0.810, 1.058, 1],
  'paladin-w': [0.150, -0.204, 0.867, 1.165, 0], 'paladin-b': [0.014, -0.234, 0.879, 1.218, 1],
  'guard-w': [0.086, -0.266, 0.859, 1.165, 0], 'guard-b': [0.068, -0.251, 0.867, 1.124, 1],
  'maester-w': [0.215, -0.006, 0.711, 0.885, 1], 'maester-b': [0.149, -0.041, 0.728, 0.943, 0],
  'beast-w': [0.068, -0.137, 0.783, 0.982, 0], 'beast-b': [0.131, -0.128, 0.800, 1.000, 1],
  'ogre-w': [0.016, -0.387, 1.066, 1.354, 0], 'ogre-b': [-0.076, -0.386, 1.080, 1.411, 1],
  'king-frost-w': [-0.009, -0.347, 0.897, 1.217, 0], 'king-frost-b': [-0.021, -0.372, 0.923, 1.251, 1],
  'king-flame-w': [0.031, -0.365, 0.860, 1.240, 0], 'king-flame-b': [0.124, -0.352, 0.736, 1.226, 1],
  'king-stratus-w': [-0.053, -0.373, 0.936, 1.243, 0], 'king-stratus-b': [0.103, -0.365, 0.922, 1.230, 1],
  'king-mud-w': [-0.055, -0.378, 0.934, 1.245, 0], 'king-mud-b': [0.016, -0.369, 0.907, 1.251, 1],
  'king-spirit-w': [0.009, -0.361, 0.865, 1.252, 0], 'king-spirit-b': [0.099, -0.361, 0.764, 1.235, 1],
  'king-shadow-w': [0.121, -0.361, 0.856, 1.223, 0], 'king-shadow-b': [-0.000, -0.370, 0.902, 1.244, 1],
};

const figKey = c => (c.type === 'king' ? `king-${c.design ?? (c.color === 'b' ? 'shadow' : 'spirit')}-${c.color}` : `${c.type}-${c.color}`);
const figSrc = c => (c.type === 'king'
  ? `${ASSETS}kings/${c.design ?? (c.color === 'b' ? 'shadow' : 'spirit')}${c.color === 'b' ? '-b' : ''}.webp`
  : `${ASSETS}pieces/${c.type}-${c.color}.webp`);
const idx = sq => (typeof sq === 'number' ? sq : (sq.charCodeAt(1) - 49) * 8 + (sq.charCodeAt(0) - 97));
const nameOf = i => FILES[i & 7] + ((i >> 3) + 1);
const sideName = c => (c === 'w' ? 'White' : 'Black');
/** Marks that belong to a selection or a moment; redrawMarks rebuilds them its own way. */
const TRANSIENT = new Set(['focus', 'selected', 'move', 'capture', 'shot', 'swap', 'shove', 'power', 'hover', 'burst']);

// ---- styles (injected once) -------------------------------------------------------------------

const CSS = `
.kdb-host { position: relative; }
/* In normal flow: it gives a host with no set height the board's own height, and never overflows a host that has one. */
.kdb-sizer { display: block; width: 100%; aspect-ratio: var(--kdb-aspect); max-height: 100%; visibility: hidden; pointer-events: none; }
.kdb { position: absolute; inset: 0; touch-action: none; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; outline: none; }
.kdb[data-interactive='false'] { pointer-events: none; }
.kdb-box { position: absolute; }
.kdb-frame {
  position: absolute; left: 0; bottom: 0; border-radius: calc(var(--u) * 7);
  background-color: #3b352c;
  background-image: linear-gradient(135deg, rgba(255,238,205,.2), rgba(255,238,205,0) 50%, rgba(16,10,4,0) 50%, rgba(16,10,4,.28)),
    linear-gradient(rgba(120,84,40,.16), rgba(120,84,40,.16)), var(--kdb-slate, none);
  background-size: auto, auto, calc(var(--u) * 144) calc(var(--u) * 144);
  box-shadow: 0 calc(var(--u) * 5) calc(var(--u) * 16) rgba(46,32,14,.38), inset 0 0 0 1px rgba(20,14,6,.55), inset 0 0 0 calc(1px + var(--u) * 1.5) rgba(236,224,196,.5);
}
.kdb-coord { position: absolute; display: grid; place-items: center; font: 500 var(--kdb-coord) system-ui, sans-serif; color: #e4d8bb; line-height: 1; pointer-events: none; }
.kdb-sq { position: absolute; isolation: isolate; box-shadow: 0 0 0 calc(var(--u) * 3) #3a3528; }
.kdb-sq::before { content: ''; position: absolute; inset: calc(var(--u) * -5); border: calc(var(--u) * 1.5) solid rgba(236,224,196,.35); pointer-events: none; }
.kdb-stone { position: absolute; inset: 0; background: #8c8676 center / 100% 100% no-repeat; z-index: 0; }
.kdb[data-flipped='true'] .kdb-stone { transform: rotate(180deg); }
.kdb-light { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
.kdb-light.a { background: radial-gradient(95% 95% at 30% 22%, rgba(255,190,110,.55), rgba(255,190,110,0)); mix-blend-mode: soft-light; }
.kdb-light.b { background: radial-gradient(80% 80% at 42% 40%, rgba(120,90,60,0) 48%, rgba(120,90,60,.2)); mix-blend-mode: multiply; }
.kdb-light.c { background: linear-gradient(rgba(24,16,6,.32), rgba(24,16,6,0) 1.4%), linear-gradient(90deg, rgba(24,16,6,.32), rgba(24,16,6,0) 1.4%); }
.kdb-fig, .kdb-m { position: absolute; width: 12.5%; height: 12.5%; pointer-events: none; }
.kdb-fig::before {
  content: ''; position: absolute; left: 21%; width: 58%; top: calc(${(FOOT * 100).toFixed(2)}% - 8%); height: 14%;
  border-radius: 50%; background: radial-gradient(closest-side, rgba(28,20,8,.42), rgba(28,20,8,.18) 60%, rgba(28,20,8,0));
}
.kdb-fig img { position: absolute; display: block; max-width: none; transform-origin: 50% 90%; transition: translate 160ms cubic-bezier(.2,.8,.2,1), filter 160ms; }
.kdb-fig img.mirror { scale: -1 1; }
.kdb-fig.is-selected img { translate: 0 -3%; filter: drop-shadow(0 0 calc(var(--u) * 6) rgba(255,214,128,.55)); }
.kdb-fig.is-ghost { opacity: .5; }
.kdb-fig.is-fallen img { rotate: 78deg; translate: 18% 6%; filter: grayscale(.25) brightness(.9); transition: rotate 520ms cubic-bezier(.5,0,.75,0), translate 520ms; }
.kdb-fig .kdb-token { position: absolute; left: 18%; top: 22%; width: 64%; height: 64%; border-radius: 50%; display: grid; place-items: center;
  font: 700 calc(var(--tile) * .34) Georgia, serif; border: calc(var(--u) * 2.5) solid; }
.kdb-fig .kdb-token.w { background: #efe9d8; color: #4b4a3c; border-color: #4b4a3c; }
.kdb-fig .kdb-token.b { background: #34383a; color: #c9cdc8; border-color: #c9cdc8; }
.kdb-m svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.kdb-m.pop { animation: kdb-pop 300ms cubic-bezier(.34,1.56,.64,1) both; animation-delay: calc(var(--d, 0) * 38ms); transform-origin: 50% ${(GROUND * 100).toFixed(1)}%; }
@keyframes kdb-pop { from { transform: scale(0); opacity: 0; } 40% { opacity: 1; } }
.kdb-m.kdb-m-last { background: rgba(230,184,74,.43); border-radius: 8%; }
.kdb-m.kdb-m-glow { background: radial-gradient(closest-side, rgba(var(--c),.9), rgba(var(--c),.45) 45%, rgba(var(--c),0)); }
.kdb-m.kdb-m-cover::after { content: ''; position: absolute; left: 40%; top: 40%; width: 20%; height: 20%; border-radius: 50%; background: rgba(176,37,27,.62); box-shadow: 0 0 0 2px rgba(251,247,238,.75); }
.kdb-m.kdb-m-focus { display: none; border: 3px solid var(--focus, #1c5bb0); border-radius: 8%; box-shadow: 0 0 0 2px #fbf7ee, inset 0 0 0 2px #fbf7ee; }
.kdb:focus-visible .kdb-m.kdb-m-focus { display: block; }
.kdb-m.kdb-m-hint { border: calc(var(--u) * 4 * var(--k)) solid #c99a2e; border-radius: 6%; box-sizing: border-box; }
.kdb-m.kdb-m-hover { border: 2px solid rgba(255,255,255,.67); }
.kdb-m.pulse { animation: kdb-pulse 300ms ease-in-out 2; transform-origin: 50% ${(FOOT * 100).toFixed(1)}%; }
@keyframes kdb-pulse { 50% { transform: scale(1.28); } }
.kdb-fx { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; z-index: 400; }
.kdb-live { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@media (prefers-reduced-motion: reduce) {
  :root:not([data-motion='full']) .kdb-m.pop, :root:not([data-motion='full']) .kdb-m.pulse { animation: none; }
  :root:not([data-motion='full']) .kdb-fig img { transition: none; }
}
:root[data-motion='reduce'] .kdb-m.pop, :root[data-motion='reduce'] .kdb-m.pulse { animation: none; }
:root[data-motion='reduce'] .kdb-fig img { transition: none; }
`;
let styled = false;
function injectStyles() {
  if (styled) return;
  styled = true;
  const s = document.createElement('style');
  s.dataset.kit = 'board';
  s.textContent = CSS;
  document.head.prepend(s);
}

// The slate frame: a mirrored 2 x 2 crop from inside one dark tile of the board art (scene.mjs drawFrame).
let slate = null;
function slateFrom(img) {
  if (slate) return slate;
  try {
    const n = img.naturalWidth / 8, crop = n * 0.6, c = document.createElement('canvas');
    c.width = c.height = 288;
    const g = c.getContext('2d');
    for (const [mx, my] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      g.save(); g.translate(mx * 288, my * 288); g.scale(mx ? -1 : 1, my ? -1 : 1);
      g.drawImage(img, n + n * 0.2, n * 0.2, crop, crop, 0, 0, 144, 144); g.restore();
    }
    slate = `url(${c.toDataURL('image/webp', 0.8)})`;
  } catch { slate = 'none'; }
  return slate;
}

// ---- mark shapes (SVG in square units: one square = 112, as in src/render/marks.ts) -----------

const halo = (d, colour, w, glow = 'rgba(251,246,232,0.85)', extra = '') =>
  `<path d="${d}" fill="none" stroke="${glow}" stroke-width="${w + 3}" stroke-linecap="round" stroke-linejoin="round" ${extra}/><path d="${d}" fill="none" stroke="${colour}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const ellipse = (cx, cy, rx, ry) => `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${rx * 2} 0a${rx} ${ry} 0 1 0 ${-rx * 2} 0`;
const G = GROUND * 112, F = FOOT * 112;
const svg = (body, k = 1, oy = G) => `<svg viewBox="0 0 112 112" aria-hidden="true"><g transform="translate(56 ${oy}) scale(${k}) translate(-56 ${-oy})">${body}</g></svg>`;

function gemSvg(k, power) {
  const [light, mid, dark, line] = power ? ['#e3f0ff', '#7fb2ff', '#2f5ea8', '#0f2244'] : ['#fff4cf', '#f0bf52', '#9a6418', '#3a2408'];
  const x = 56, y = G - 22, w = 10, h = 15, gi = y - h * 0.18;
  return svg(`<ellipse cx="${x}" cy="${y + h + 10}" rx="${w * 0.8}" ry="${w * 0.28}" fill="rgba(30,20,8,0.28)"/>
    <path d="M${x} ${y - h}L${x + w} ${gi}L${x} ${y + h}L${x - w} ${gi}Z" fill="none" stroke="${line}" stroke-width="3.2" stroke-linejoin="round"/>
    <path d="M${x} ${y - h}L${x} ${gi}L${x - w} ${gi}Z" fill="${light}"/><path d="M${x} ${y - h}L${x + w} ${gi}L${x} ${gi}Z" fill="${mid}"/>
    <path d="M${x - w} ${gi}L${x} ${gi}L${x} ${y + h}Z" fill="${mid}"/><path d="M${x} ${gi}L${x + w} ${gi}L${x} ${y + h}Z" fill="${dark}"/>
    <circle cx="${x - w * 0.38}" cy="${y - h * 0.5}" r="1.4" fill="rgba(255,255,255,0.9)"/>`, k, G - 22);
}
function bracketsSvg(k, power) {
  const l = 112 * 0.22, i = 8, w = 3.6 * Math.min(k, 1.6), c = power ? '#3f7fd0' : '#c0281c';
  let d = '';
  for (const [cx, cy, sx, sy] of [[0, 0, 1, 1], [112, 0, -1, 1], [0, 112, 1, -1], [112, 112, -1, -1]]) {
    const px = cx + sx * i, py = cy + sy * i;
    d += `M${px} ${py + sy * l}L${px} ${py}L${px + sx * l} ${py}`;
  }
  return `<svg viewBox="0 0 112 112" aria-hidden="true">${halo(d, c, w, 'rgba(24,14,8,0.7)')}</svg>`;
}
function sightSvg(k) {
  const y = G - 58, r = 16 * Math.max(1, k * 0.8), c = '#e0392b';
  let ticks = '';
  for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) ticks += `M${56 + dx * r * 0.45} ${y + dy * r * 0.45}L${56 + dx * r * 1.45} ${y + dy * r * 1.45}`;
  return `<svg viewBox="0 0 112 112" aria-hidden="true">${halo(ellipse(56, y, r, r), c, 2.4, 'rgba(24,14,8,0.65)')}${halo(ticks, c, 2.4, 'rgba(24,14,8,0.65)')}<circle cx="56" cy="${y}" r="2.2" fill="${c}"/></svg>`;
}
function runeSvg(k) {
  const r = 46, sy = 0.36;
  let star = '', ticks = '';
  for (const off of [0, Math.PI / 3]) {
    for (let i = 0; i <= 3; i++) { const a = off + i * Math.PI * 2 / 3; star += `${i ? 'L' : 'M'}${(56 + Math.cos(a) * r * 0.74).toFixed(1)} ${(G + Math.sin(a) * r * 0.74 * sy).toFixed(1)}`; }
  }
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; ticks += `M${(56 + Math.cos(a) * r * 0.82).toFixed(1)} ${(G + Math.sin(a) * r * 0.82 * sy).toFixed(1)}L${(56 + Math.cos(a) * r * 0.96).toFixed(1)} ${(G + Math.sin(a) * r * 0.96 * sy).toFixed(1)}`; }
  return svg(`${halo(ellipse(56, G, r, r * sy), '#3f7fd0', 2.4, 'rgba(240,246,255,0.8)')}
    <path d="${ellipse(56, G, r * 0.78, r * 0.78 * sy)}" fill="none" stroke="#3f7fd0" stroke-width="1.2"/>
    <path d="${ticks}${star}" fill="none" stroke="#3f7fd0" stroke-width="1.6"/>`, k);
}
function chaseSvg(k) {
  const r = 42, ry = r * 0.36, c = '#7d5ba6';
  let body = '';
  for (let i = 0; i < 2; i++) {
    const a0 = 0.4 + i * Math.PI, a1 = a0 + Math.PI * 0.72;
    const p = a => [56 + Math.cos(a) * r, G + Math.sin(a) * ry];
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    body += halo(`M${x0.toFixed(1)} ${y0.toFixed(1)}A${r} ${ry} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`, c, 3);
    const tx = -Math.sin(a1) * r, ty = Math.cos(a1) * ry, n = Math.hypot(tx, ty), ux = tx / n, uy = ty / n, s = 8;
    body += `<path d="M${x1 + ux * s} ${y1 + uy * s}L${x1 - uy * s * 0.7} ${y1 + ux * s * 0.7}L${x1 + uy * s * 0.7} ${y1 - ux * s * 0.7}Z" fill="${c}" stroke="rgba(251,246,232,0.85)" stroke-width="2"/>`;
  }
  return svg(body, k);
}
function shoveSvg(k, dir) {
  const n = Math.hypot(dir.x, dir.y) || 1, ux = dir.x / n, uy = dir.y / n;
  let chev = '';
  for (let i = 0; i < 3; i++) {
    const d = 44 + i * 12, s = 9, cx = 56 + ux * d, cy = G + uy * d * 0.4;
    chev += `M${(cx - ux * s - uy * s).toFixed(1)} ${(cy - (uy * s - ux * s) * 0.5).toFixed(1)}L${cx.toFixed(1)} ${cy.toFixed(1)}L${(cx - ux * s + uy * s).toFixed(1)} ${(cy - (uy * s + ux * s) * 0.5).toFixed(1)}`;
  }
  return svg(halo(ellipse(56, G, 42, 14), '#2f7f75', 2.5) + halo(chev, '#2f7f75', 3), k);
}
const ringSvg = (k, colour, rx = 44, ry = 15, w = 3, dashed = false) =>
  svg(halo(ellipse(56, G, rx, ry), colour, w, 'rgba(251,246,232,0.85)', dashed ? 'stroke-dasharray="6 6"' : ''), k);
const selectedSvg = () => svg(halo(ellipse(56, G, 40, 14), 'rgba(233,192,113,0.95)', 2, 'rgba(40,28,10,0.45)'));
const checkSvg = () => `<svg viewBox="0 0 112 112" aria-hidden="true"><path d="${ellipse(56, F - 2, 44, 15)}" fill="rgba(192,57,43,0.33)" stroke="#b3261e" stroke-width="3"/></svg>`;
const threatSvg = () => svg(halo(ellipse(56, G, 40, 14), '#b0251b', 3, 'rgba(251,247,238,0.8)'));

// ---- the board --------------------------------------------------------------------------------

/**
 * Create a board in `container`. The board fills the container's width; when the container has a height
 * (a grid or flex area, or a CSS height) the board fits inside it, else the container takes the board's height.
 * options:
 *   play: { level, human: 'w' | 'b' | 'both' | 'none', ms, pause } - make it playable through KD
 *   state: a KD state to show at once        orientation: 'w' | 'b' (who sits at the bottom)
 *   coords: true      headroom: 0.2 (squares of space above the frame for tall figures)
 *   interactive: true (false: a picture, no input)      sound: true      speed: 1 (2 = twice as fast)
 *   label: the board's accessible name       choose(moves): Promise of the move to play when a tap has two
 *   onTap(sq, cell), onInspect(sq, cell), onMove(story), onSelect(sq|null)
 */
export function createBoard(container, options = {}) {
  injectStyles();
  return new Board(container, options);
}

class Board {
  constructor(host, o) {
    this.host = host;
    this.o = { coords: true, headroom: 0.2, interactive: true, sound: true, speed: 1, ...o };
    this.play = o.play ? { level: 'beginner', human: 'w', ms: 500, pause: 350, ...o.play } : null;
    this.onTap = o.onTap ?? null;
    this.onInspect = o.onInspect ?? null;
    this.onMove = o.onMove ?? null;
    this.onSelect = o.onSelect ?? null;
    this.state = null;
    this.cells = new Array(64).fill(null);
    this.figs = new Map(); // square index -> figure element
    this.marks = new Map(); // kind -> elements
    this.flipped = o.orientation ? o.orientation === 'b' : this.play?.human === 'b';
    this.selected = null;
    this.pending = [];
    this.targets = [];
    this.armed = null;
    this.busy = false;
    this.gen = 0;
    this.cursor = idx('e2');
    this.tile = 40;
    this.build();
    if (o.state) this.setState(o.state);
  }

  // ---- building and sizing ----
  build() {
    const host = this.host;
    // The board is absolute inside the host: give the host a position unless it has one (or is not in the page yet).
    if (!['relative', 'absolute', 'fixed', 'sticky'].includes(getComputedStyle(host).position)) host.classList.add('kdb-host');
    const root = this.el = document.createElement('div');
    root.className = 'kdb';
    root.dataset.interactive = String(this.o.interactive);
    root.dataset.flipped = String(this.flipped);
    if (this.o.interactive) {
      root.tabIndex = 0;
      root.setAttribute('role', 'application');
      root.setAttribute('aria-roledescription', 'board');
      root.setAttribute('aria-label', this.o.label ?? 'King Down board. Arrow keys move, Enter or Space chooses, Escape cancels.');
    } else root.setAttribute('aria-hidden', 'true');
    this.sizer = document.createElement('div');
    this.sizer.className = 'kdb-sizer';
    this.sizer.setAttribute('aria-hidden', 'true');
    host.style.setProperty('--kdb-aspect', String(1 / this.ratio()));
    host.appendChild(this.sizer);
    root.innerHTML = `<div class="kdb-box"><div class="kdb-frame"></div><div class="kdb-sq"><div class="kdb-stone"></div>
      <div class="kdb-light a"></div><div class="kdb-light b"></div><div class="kdb-light c"></div>
      <svg class="kdb-fx" viewBox="0 0 800 800" preserveAspectRatio="none" aria-hidden="true"></svg></div></div><div class="kdb-live" aria-live="polite"></div>`;
    host.appendChild(root);
    this.box = root.querySelector('.kdb-box');
    this.frame = root.querySelector('.kdb-frame');
    this.sq = root.querySelector('.kdb-sq');
    this.fx = root.querySelector('.kdb-fx');
    this.live = root.querySelector('.kdb-live');
    // The stone: the game's own 1024 px board when it is there, else the 640 px copy.
    const stone = root.querySelector('.kdb-stone'), img = new Image();
    img.decoding = 'async';
    img.onload = () => { stone.style.backgroundImage = `url(${img.src})`; this.frame.style.setProperty('--kdb-slate', slateFrom(img)); };
    img.onerror = () => { if (!img.src.endsWith('/stone-board.webp')) img.src = `${ASSETS}stone-board.webp`; };
    img.src = `${ASSETS}stone-board-hd.webp`;
    this.coordEls = [];
    for (let i = 0; i < 16; i++) { const c = document.createElement('span'); c.className = 'kdb-coord'; c.setAttribute('aria-hidden', 'true'); this.frame.appendChild(c); this.coordEls.push(c); }
    this.cursorMark = this.addMark(this.cursor, 'focus', { layer: 'over' });
    this.ro = new ResizeObserver(() => this.layout());
    this.ro.observe(host);
    this.layout();
    if (this.o.interactive) this.wireInput();
  }

  /** The board's height over its width: the frame, plus headroom for tall figures on the far rank. */
  ratio() { return 1 + this.o.headroom / (8 + 2 * FRAME); }

  layout() {
    const cw = this.host.clientWidth, ch = this.host.clientHeight;
    if (cw < 2 || ch < 2) return; // not laid out yet: the ResizeObserver calls again
    const ratio = this.ratio();
    const S = Math.max(0, Math.floor(Math.min(cw, ch / ratio + 0.5)));
    const H = Math.round(S * ratio) - S;
    const tile = S / (8 + 2 * FRAME), u = tile / 112;
    this.tile = tile;
    const k = Math.max(1, 700 / Math.max(1, S)); // the app's marker factor: larger marks on a small board
    const box = this.box.style;
    box.width = `${S}px`; box.height = `${S + H}px`;
    box.left = `${Math.max(0, (cw - S) / 2)}px`;
    box.top = `${Math.max(0, (ch - S - H) / 2)}px`;
    const r = this.el.style;
    r.setProperty('--u', `${u}px`); r.setProperty('--tile', `${tile}px`); r.setProperty('--k', String(Math.min(k, 1.6)));
    r.setProperty('--kdb-coord', `${Math.max(9.5, 13 * u * k).toFixed(2)}px`);
    Object.assign(this.frame.style, { width: `${S}px`, height: `${S}px`, top: `${H}px` });
    Object.assign(this.sq.style, { left: `${FRAME * tile}px`, top: `${H + FRAME * tile}px`, width: `${8 * tile}px`, height: `${8 * tile}px` });
    this.k = k;
    this.placeCoords();
    if (this.lastK !== Math.round(k * 10)) { this.lastK = Math.round(k * 10); this.redrawMarks(); }
  }

  placeCoords() {
    if (!this.coordEls) return;
    const t = this.tile, f = FRAME * t;
    for (let i = 0; i < 8; i++) {
      const file = this.coordEls[i], rank = this.coordEls[8 + i];
      file.hidden = rank.hidden = !this.o.coords;
      file.textContent = FILES[this.flipped ? 7 - i : i];
      rank.textContent = String(this.flipped ? i + 1 : 8 - i);
      Object.assign(file.style, { left: `${f + i * t}px`, width: `${t}px`, bottom: '0', height: `${f}px` });
      Object.assign(rank.style, { left: '0', width: `${f}px`, top: `${f + i * t}px`, height: `${t}px` });
    }
  }

  /** Screen column and row (0 = top) of a square. */
  colRow(sq) {
    const i = idx(sq), f = i & 7, r = i >> 3;
    return this.flipped ? { col: 7 - f, row: r } : { col: f, row: 7 - r };
  }

  squareAtPoint(x, y) {
    const r = this.sq.getBoundingClientRect();
    const col = Math.floor((x - r.left) / (r.width / 8)), row = Math.floor((y - r.top) / (r.height / 8));
    if (col < 0 || col > 7 || row < 0 || row > 7) return null;
    return this.flipped ? row * 8 + (7 - col) : (7 - row) * 8 + col;
  }

  /** The square's box on screen (a DOMRect), to place a callout or a tooltip by it. */
  squareRect(sq) {
    const r = this.sq.getBoundingClientRect(), { col, row } = this.colRow(sq), t = r.width / 8;
    return new DOMRect(r.left + col * t, r.top + row * t, t, t);
  }

  /** The figure element on a square (a div holding an <img>), or null: animate it as you like. */
  figure(sq) { return this.figs.get(idx(sq)) ?? null; }

  /** The layer over the squares, in square units of 12.5 %: add your own overlays here. */
  get layer() { return this.sq; }

  place(el, sq, extra = 0) {
    const { col, row } = this.colRow(sq);
    el.style.left = `${col * 12.5}%`;
    el.style.top = `${row * 12.5}%`;
    el.style.zIndex = String(10 + row * 3 + extra);
  }

  // ---- figures ----
  makeFig(cell) {
    const el = document.createElement('div');
    el.className = 'kdb-fig';
    this.dressFig(el, cell);
    return el;
  }

  dressFig(el, cell) {
    const key = figKey(cell);
    el.dataset.key = key;
    el.dataset.piece = `${cell.color} ${cell.type}`;
    const g = FIG[key];
    if (!g) {
      el.innerHTML = `<span class="kdb-token ${cell.color}">${cell.type[0].toUpperCase()}</span>`;
      return;
    }
    let img = el.querySelector('img');
    if (!img) { img = document.createElement('img'); img.alt = ''; img.decoding = 'async'; img.draggable = false; el.replaceChildren(img); }
    img.src = figSrc(cell);
    Object.assign(img.style, { left: `${g[0] * 100}%`, top: `${g[1] * 100}%`, width: `${g[2] * 100}%`, height: `${g[3] * 100}%` });
    img.classList.toggle('mirror', !!g[4]);
  }

  /** Show a KD state (from KD.newGame, KD.play ...). Marks the last move and a check. */
  setState(state) {
    this.gen++;
    this.state = state;
    this.busy = false;
    this.closeChoice();
    this.clearSelection(false);
    this.setBoard(KD.board(state), { keepMarks: true });
    this.markLastAndCheck();
    if (this.play && !this.o.orientation && this.play.human === 'b' && !this.flipped) this.flip(true);
    this.maybeAi();
    return this;
  }

  /** Show 64 cells (KD.board) without a game: a picture or a scripted position. */
  setBoard(cells, { keepMarks = false } = {}) {
    if (!keepMarks) { this.gen++; this.busy = false; this.closeChoice(); this.state = null; this.clearMarks(); }
    for (let i = 0; i < 64; i++) {
      const cell = cells[i] ?? null, el = this.figs.get(i);
      if (!cell) { if (el) { el.remove(); this.figs.delete(i); } continue; }
      if (!el) { const n = this.makeFig(cell); this.place(n, i); this.sq.appendChild(n); this.figs.set(i, n); continue; }
      if (el.dataset.key !== figKey(cell)) this.dressFig(el, cell);
      el.classList.remove('is-fallen');
      el.getAnimations?.().forEach(a => a.cancel());
      el.style.transform = ''; // a figure left mid-drag
      this.place(el, i);
    }
    this.cells = cells.map(c => c ?? null);
    return this;
  }

  /** Turn the board (true: Black at the bottom). No argument: turn it over. */
  flip(on = !this.flipped) {
    this.flipped = !!on;
    this.el.dataset.flipped = String(this.flipped);
    for (const [i, el] of this.figs) this.place(el, i);
    this.placeCoords();
    this.redrawMarks();
    return this;
  }

  // ---- marks ----
  /**
   * Mark squares. kind: 'last', 'check', 'selected', 'move', 'capture', 'shot', 'swap', 'shove', 'power',
   * 'hint', 'threat', 'cover', 'glow', 'focus'. options: { pop: true (appear with a ripple from `from`), from: sq, power: true }
   */
  mark(squares, kind, opts = {}) {
    const list = Array.isArray(squares) ? squares : [squares];
    for (const sq of list) if (sq != null) this.addMarks(idx(sq), kind, opts);
    return this;
  }

  /** Remove marks: all of them, or one kind ('move', 'last' ...). The keyboard cursor always stays. */
  clearMarks(kind) {
    for (const [k, els] of this.marks) {
      if (kind && k !== kind) continue;
      const keep = els.filter(el => el === this.cursorMark);
      for (const el of els) if (el !== this.cursorMark) el.remove();
      if (keep.length) this.marks.set(k, keep); else this.marks.delete(k);
    }
    return this;
  }

  addMarks(i, kind, opts) {
    const k = this.k ?? 1, mk = Math.min(k, 1.6);
    const from = opts.from != null ? this.colRow(opts.from) : null, at = this.colRow(i);
    const d = from ? Math.hypot(at.col - from.col, at.row - from.row) : 0;
    const add = (html, cls, layer, colour) => {
      const el = this.addMark(i, kind, { layer, cls, html, colour, pop: opts.pop, d });
      el.kdbOpts = { power: opts.power, colour: opts.colour }; // redrawMarks draws it again the same way
      return el;
    };
    switch (kind) {
      case 'last': add('', 'kdb-m-last', 'under'); break;
      case 'check': add(checkSvg(), '', 'under'); break;
      case 'selected': add('', 'kdb-m-glow', 'under', '255,206,120'); add(selectedSvg(), '', 'under'); break;
      case 'move': {
        add('', 'kdb-m-glow', 'under', opts.power ? '96,160,255' : '255,214,128');
        add(gemSvg(mk, !!opts.power), '', 'over');
        break;
      }
      case 'capture': add('', 'kdb-m-glow', 'under', '214,52,40'); add(ringSvg(1, '#b3261e', 44, 15, 3 * Math.min(k, 1.5)), '', 'under'); add(bracketsSvg(k, !!opts.power), '', 'over'); break;
      case 'shot': add(ringSvg(1, '#b3261e', 54, 19, 1.5, true), '', 'under'); add(sightSvg(k), '', 'over'); break;
      case 'swap': add('', 'kdb-m-glow', 'under', '160,120,220'); add(chaseSvg(1), '', 'under'); break;
      case 'shove': {
        const f = this.selected != null ? this.colRow(this.selected) : null, t = this.colRow(i);
        add('', 'kdb-m-glow', 'under', '64,190,176');
        add(shoveSvg(1, f ? { x: t.col - f.col, y: t.row - f.row } : { x: 1, y: 0 }), '', 'under');
        break;
      }
      case 'power': add(runeSvg(1), '', 'under'); break;
      case 'hint': add('', 'kdb-m-hint', 'over'); break;
      case 'threat': add(threatSvg(), '', 'under'); break;
      case 'cover': add('', 'kdb-m-cover', 'over'); break;
      case 'glow': add('', 'kdb-m-glow', 'under', opts.colour ?? '255,214,128'); break;
      case 'focus': add('', 'kdb-m-focus', 'over'); break;
      case 'hover': add('', 'kdb-m-hover', 'over'); break;
      default: throw new Error(`board.mark: unknown kind "${kind}"`);
    }
  }

  addMark(i, kind, { layer = 'under', cls = '', html = '', colour, pop, d = 0 } = {}) {
    const el = document.createElement('div');
    el.className = `kdb-m kdb-m-${kind}${cls ? ' ' + cls : ''}${pop && !prefersReducedMotion() ? ' pop' : ''}`;
    el.dataset.sq = nameOf(i);
    el.dataset.layer = layer;
    if (colour) el.style.setProperty('--c', colour);
    el.style.setProperty('--d', d.toFixed(2));
    el.innerHTML = html;
    const { row } = this.colRow(i);
    this.place(el, i);
    if (layer === 'under') el.style.zIndex = String(kind === 'last' ? 2 : kind === 'check' ? 3 : 4);
    else el.style.zIndex = String(11 + row * 3);
    if (cls === 'kdb-m-glow') {
      // A glow is an ellipse on the ground: as wide as the app's (rx 32 to 50), flattened 0.38.
      const rx = kind === 'move' ? 32 * Math.min(this.k ?? 1, 1.6) : kind === 'capture' ? 48 : kind === 'selected' ? 50 : 46;
      const w = (2 * rx) / 112, h = 0.76 * rx / 112;
      Object.assign(el.style, { width: `${w * 12.5}%`, height: `${h * 12.5}%`, marginLeft: `${(1 - w) / 2 * 12.5}%`, marginTop: `${(GROUND - h / 2) * 12.5}%` });
      el.style.transformOrigin = '50% 50%';
    }
    this.sq.appendChild(el);
    if (!this.marks.has(kind)) this.marks.set(kind, []);
    this.marks.get(kind).push(el);
    return el;
  }

  /** Rebuild every mark (after a flip or a resize: their shapes depend on the board size). */
  redrawMarks() {
    const kept = new Map();
    for (const [kind, els] of this.marks) {
      if (TRANSIENT.has(kind)) continue;
      for (const el of els) kept.set(kind + el.dataset.sq, [kind, el.dataset.sq, el.kdbOpts ?? {}]);
    }
    for (const els of this.marks.values()) for (const el of els) el.remove();
    this.marks.clear();
    for (const [kind, sq, opts] of kept.values()) this.addMarks(idx(sq), kind, opts);
    this.cursorMark = this.addMark(this.cursor, 'focus', { layer: 'over' });
    this.moveCursorMark();
    if (this.selected != null) this.select(nameOf(this.selected));
    if (this.targets.length) this.showTargets(this.targets, { pending: this.pending, pop: false });
  }

  markLastAndCheck() {
    this.clearMarks('last'); this.clearMarks('check');
    const s = this.state;
    if (!s) return;
    const last = s.history.at(-1)?.move;
    if (last) {
      // The owner's rule (2026-10-04): mark where the piece went or what it hit, not the square it left.
      const sqs = last.shove ? [last.shove.from, last.shove.to] : last.to === last.from && last.captures.length ? last.captures : [last.to];
      this.mark(sqs.map(nameOf), 'last');
    }
    const st = KD.status(s);
    if (st.check) {
      const king = KD.board(s).find(c => c && c.type === 'king' && c.color === st.turn);
      if (king) this.mark(king.sq, 'check');
    }
  }

  // ---- selection and targets ----
  /** Select a square: a gold ring at the feet and a small lift. null clears it. */
  select(sq) {
    this.clearMarks('selected');
    for (const el of this.figs.values()) el.classList.remove('is-selected');
    this.selected = sq == null ? null : idx(sq);
    if (this.selected != null) {
      this.mark(nameOf(this.selected), 'selected');
      this.figs.get(this.selected)?.classList.add('is-selected');
    }
    return this;
  }

  /**
   * Mark where moves go (KD.legal moves). Empty squares get a gem, enemies a ring and corner brackets,
   * an Archer's shot a sight, a Maester's swap violet arrows, an Ogre's push teal chevrons, a power a blue rune.
   * pending: squares already tapped in a multi-step move (a Beast chain).
   */
  showTargets(moves, { pending = [], pop = true } = {}) {
    for (const k of ['move', 'capture', 'shot', 'swap', 'shove', 'power']) this.clearMarks(k);
    const step = m => m.path[pending.length];
    const next = moves.map(step).filter(Boolean);
    const swaps = moves.filter(m => m.swap).map(m => m.to);
    const shoves = moves.filter(m => m.push).map(m => m.push.from);
    const named = moves.filter(m => m.power === 'freeze' || m.power === 'ward' || m.power === 'sacrifice').map(m => m.to);
    const powers = new Set(moves.filter(m => m.power && !m.pass).map(step).filter(Boolean));
    const shots = new Set(moves.filter(m => m.shot && step(m) === m.captures[0]).map(m => m.captures[0]));
    const from = this.selected != null ? nameOf(this.selected) : moves[0]?.from;
    const opts = sq => ({ pop, from, power: powers.has(sq) });
    for (const sq of new Set(next)) {
      const cell = this.cells[idx(sq)];
      if (swaps.includes(sq)) this.mark(sq, 'swap', opts(sq));
      else if (shoves.includes(sq)) this.mark(sq, 'shove', opts(sq));
      else if (named.includes(sq)) this.mark(sq, 'power', opts(sq));
      else if (!cell) this.mark(sq, 'move', opts(sq));
      else { this.mark(sq, 'capture', opts(sq)); if (shots.has(sq)) this.mark(sq, 'shot', opts(sq)); }
    }
    this.targets = moves;
    return this;
  }

  clearSelection(announce = true) {
    this.select(null);
    this.pending = [];
    this.targets = [];
    for (const k of ['move', 'capture', 'shot', 'swap', 'shove', 'power']) this.clearMarks(k);
    this.hideGhost();
    if (announce) this.onSelect?.(null);
  }

  // ---- animation ----
  motion() { return !prefersReducedMotion() && this.o.speed > 0; }
  ms(n) { return n / (this.o.speed || 1); }

  /** Slide a figure from one square to another along a slight arc. Resolves when it lands. */
  async slide(el, fromSq, toSq, { dur, lift } = {}) {
    if (!el) return;
    const a = this.colRow(fromSq), b = this.colRow(toSq), t = this.tile;
    const dist = Math.hypot(b.col - a.col, b.row - a.row);
    const dx = (b.col - a.col) * t, dy = (b.row - a.row) * t;
    const h = lift ?? Math.min(0.32, 0.1 + 0.035 * dist) * t;
    const frames = [];
    for (let s = 0; s <= 10; s++) {
      const p = s / 10;
      frames.push({ transform: `translate(${(dx * p).toFixed(2)}px, ${(dy * p - 4 * h * p * (1 - p)).toFixed(2)}px)` });
    }
    const gen = this.gen;
    el.style.zIndex = '300';
    const anim = el.animate(frames, { duration: this.ms(dur ?? Math.min(360, 230 + 16 * dist)), easing: 'cubic-bezier(.45,.05,.3,1)', fill: 'forwards' });
    await anim.finished.catch(() => {});
    // setState or setBoard during the slide has put the figure where the new position wants it.
    if (gen === this.gen) this.place(el, toSq);
    anim.cancel();
  }

  /** A taken figure dips into the board and fades. */
  async dip(el, delay = 0) {
    if (!el) return;
    const anim = el.animate([
      { transform: 'none', opacity: 1 },
      { transform: `translateY(${(this.tile * 0.1).toFixed(1)}px) scale(.9)`, opacity: 0 },
    ], { duration: this.ms(220), delay: this.ms(delay), easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' });
    await anim.finished.catch(() => {});
  }

  /** An Archer's shot: a quick streak from the shooter to the target, and a small ring where it hits. */
  async shoot(fromSq, toSq) {
    const a = this.colRow(fromSq), b = this.colRow(toSq);
    const x1 = (a.col + 0.5) * 100, y1 = (a.row + 0.45) * 100, x2 = (b.col + 0.5) * 100, y2 = (b.row + 0.55) * 100;
    const len = Math.hypot(x2 - x1, y2 - y1);
    const ns = 'http://www.w3.org/2000/svg';
    const g = document.createElementNS(ns, 'g');
    g.innerHTML = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="rgba(255,248,230,.95)" stroke-width="5" stroke-linecap="round"/>
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#6e4e2d" stroke-width="1.8" stroke-linecap="round"/>`;
    for (const line of g.querySelectorAll('line')) { line.style.strokeDasharray = `${len}`; line.style.strokeDashoffset = `${len}`; }
    this.fx.appendChild(g);
    await Promise.all([...g.querySelectorAll('line')].map(l => l.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: this.ms(130), easing: 'ease-in', fill: 'forwards' }).finished));
    const ring = document.createElementNS(ns, 'circle');
    Object.entries({ cx: x2, cy: y2, r: 6, fill: 'none', stroke: '#c18d4f', 'stroke-width': 2.5 }).forEach(([k, v]) => ring.setAttribute(k, v));
    this.fx.appendChild(ring);
    const fade = g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: this.ms(200), fill: 'forwards' });
    await ring.animate([{ r: 6, opacity: 0.9 }, { r: 26, opacity: 0 }], { duration: this.ms(280), easing: 'ease-out', fill: 'forwards' }).finished.catch(() => {});
    await fade.finished.catch(() => {});
    g.remove(); ring.remove();
  }

  /** A ring on the ground that swells once and fades: a power lands, a figure appears. */
  async burst(sq, colour = '96,160,255') {
    const el = this.addMark(idx(sq), 'burst', { layer: 'under', cls: 'kdb-m-glow', colour });
    await el.animate([{ transform: 'scale(.4)', opacity: 1 }, { transform: 'scale(1.6)', opacity: 0 }], { duration: this.ms(480), easing: 'ease-out', fill: 'forwards' }).finished.catch(() => {});
    this.clearMarks('burst');
  }

  /**
   * Play a move story (KD.describe) on the board: slides, captures, shots, chains, pushes, swaps, powers,
   * a check pulse and a fallen king on mate. The board then shows story.after and, if it holds a game,
   * story.next. With reduced motion the board jumps to the result. Resolves when it is done.
   */
  async animate(story, { dragged = false } = {}) {
    if (!story) return;
    const gen = this.gen;
    this.clearSelection(false);
    this.clearMarks('last'); this.clearMarks('check');
    const fromI = idx(story.from), toI = idx(story.to);
    const mover = this.figs.get(fromI);
    const simple = ['move', 'capture', 'promote', 'power'].includes(story.kind) && story.from !== story.to;
    if (dragged && mover && (!simple || !this.motion())) { mover.style.transform = ''; mover.style.zIndex = ''; dragged = false; }
    if (this.motion()) {
      const victims = story.capturedOn.map(s => this.figs.get(idx(s)));
      const k = story.kind;
      if (k === 'shoot') {
        await this.shoot(story.from, story.capturedOn[0]);
        if (gen !== this.gen) return;
        await Promise.all(victims.map(v => this.dip(v)));
      } else if (k === 'chain') {
        let at = story.from;
        for (let n = 0; n < story.capturedOn.length; n++) {
          const sq = story.capturedOn[n];
          await this.slide(mover, at, sq, { dur: 210 });
          if (gen !== this.gen) return;
          this.sound('capture');
          void this.dip(victims[n]);
          at = sq;
        }
        if (at !== story.to && gen === this.gen) await this.slide(mover, at, story.to);
      } else if (k === 'push') {
        const pushed = this.figs.get(idx(story.push.from));
        await Promise.all([
          this.slide(pushed, story.push.from, story.push.to, { lift: 0, dur: 240 }),
          story.from !== story.to ? new Promise(r => setTimeout(r, this.ms(50))).then(() => (gen === this.gen ? this.slide(mover, story.from, story.to, { dur: 220 }) : null)) : null,
          story.capturedOn.length ? this.dip(victims[0], 120) : null,
        ]);
      } else if (k === 'swap') {
        const other = this.figs.get(toI);
        await Promise.all([this.slide(mover, story.from, story.to), this.slide(other, story.to, story.from, { lift: -0.12 * this.tile })]);
      } else if (k === 'drop') {
        // a piece enters from beside the board: drawn by the reconcile below, then it settles in
      } else if (k === 'pass') {
        // nothing moves
      } else if (story.from === story.to) {
        void this.burst(story.to, story.powerTag ? '96,160,255' : '255,214,128');
        if (victims.length) await Promise.all(victims.map(v => this.dip(v)));
      } else {
        // move, capture, promote, and the powers that move a piece (Strike, Haste, Flight)
        const flight = story.powerTag === 'flight';
        const reaver = victims.length === 1 && story.capturedOn[0] !== story.to;
        const slid = dragged ? Promise.resolve() : this.slide(mover, story.from, story.to, flight ? { lift: 0.9 * this.tile, dur: 420 } : {});
        const contact = victims.length ? this.dip(victims[0], dragged ? 0 : reaver ? 80 : 150) : null;
        await Promise.all([slid, contact]);
        if (gen !== this.gen) return;
        if (dragged && mover) { mover.style.transform = ''; this.place(mover, story.to); }
        if (story.leaves) await this.dip(mover);
      }
      if (gen !== this.gen) return;
    }
    // Re-home the figures that moved, then match the board to the result.
    this.rehome(story);
    if (story.next && (this.state || this.play)) this.state = story.next;
    this.setBoard(story.after, { keepMarks: true });
    if (story.kind === 'drop' && this.motion()) {
      const el = this.figs.get(idx(story.to));
      el?.animate([{ transform: `translateY(${-0.35 * this.tile}px)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: this.ms(260), easing: 'cubic-bezier(.2,.8,.2,1)' });
    }
    const sqs = story.push ? [story.push.from, story.push.to] : story.kind === 'shoot' ? story.capturedOn : [story.to];
    if (story.kind !== 'pass') this.mark(sqs, 'last');
    this.sound(story.mate ? 'win' : story.check ? 'check' : story.capturedOn.length ? 'capture' : story.powerTag ? 'power' : 'move');
    if (story.capturedOn.length) haptic(12);
    if (story.checkSq) {
      const [ring] = this.addMarksReturn(story.checkSq, 'check');
      if (ring && this.motion()) ring.classList.add('pulse');
    }
    if (story.mate) {
      const loser = story.after.find(c => c && c.type === 'king' && c.color !== story.side);
      if (loser) this.figs.get(idx(loser.sq))?.classList.add('is-fallen');
    }
    this.say(story.text);
  }

  addMarksReturn(sq, kind) {
    const before = this.marks.get(kind)?.length ?? 0;
    this.mark(sq, kind);
    return (this.marks.get(kind) ?? []).slice(before);
  }

  /** After a story's motion: key the moved figures by their new squares, so the reconcile keeps them. */
  rehome(story) {
    const take = sq => { const i = idx(sq), el = this.figs.get(i); this.figs.delete(i); return el; };
    for (const sq of story.capturedOn) take(sq)?.remove();
    if (story.kind === 'swap') {
      const a = take(story.from), b = take(story.to);
      if (a) this.figs.set(idx(story.to), a);
      if (b) this.figs.set(idx(story.from), b);
      return;
    }
    if (story.push) { const p = take(story.push.from); if (p) this.figs.set(idx(story.push.to), p); }
    if (story.from !== story.to && story.kind !== 'drop' && story.kind !== 'pass') {
      const m = take(story.from);
      if (m) { take(story.to)?.remove(); this.figs.set(idx(story.to), m); }
    }
  }

  sound(name) { if (this.o.sound) sfx.play(name); }
  say(text) { if (text && this.o.interactive) { this.live.textContent = ''; setTimeout(() => { this.live.textContent = text; }, 30); } }

  // ---- playing through KD ----
  isHuman(turn) {
    const h = this.play?.human;
    return h === 'both' || h === turn;
  }

  /** The selected piece's moves that match the taps so far (main.ts candidates). */
  candidates() {
    if (this.selected == null || !this.state) return [];
    const from = nameOf(this.selected);
    return KD.legal(this.state, from).filter(m =>
      this.pending.every((s, i) => m.path[i] === s) && (this.armed ? m.power === this.armed : !m.needsArming));
  }

  selectSquare(sq) {
    this.select(sq);
    this.pending = [];
    const moves = this.candidates();
    this.showTargets(moves);
    const cell = this.cells[idx(sq)];
    this.say(`${sideName(cell.color)} ${cell.type} on ${sq}. ${moves.length ? `${moves.length} move${moves.length === 1 ? '' : 's'}.` : 'No legal move.'}`);
    this.onSelect?.(sq);
  }

  /** Arm a power for the side to move ('freeze', 'ward', 'strike', 'haste', 'flight', 'sacrifice'); null disarms. */
  arm(tag) {
    this.armed = tag || null;
    this.clearSelection(false);
    if (!this.armed || !this.state) return this;
    const named = KD.legal(this.state).filter(m => m.power === this.armed && (m.power === 'freeze' || m.power === 'ward' || m.power === 'sacrifice'));
    if (named.length) this.showTargets(named);
    return this;
  }

  /** End a Haste turn without its second move (when that is legal). */
  async pass() {
    const m = this.state && KD.legal(this.state).find(x => x.pass);
    if (m && !this.busy) await this.playMove(m);
  }

  async handleTap(sqIndex, { dragged = false } = {}) {
    const sq = nameOf(sqIndex), cell = this.cells[sqIndex];
    this.cursor = sqIndex; this.moveCursorMark();
    if (this.onTap && this.onTap(sq, cell) === false) return;
    if (!this.play || !this.state || this.busy) return;
    const st = KD.status(this.state);
    if (st.over || !this.isHuman(st.turn)) return;
    // An armed Freeze, Ice Wall or Sacrifice names a piece: tap it.
    if (this.armed && ['freeze', 'ward', 'sacrifice'].includes(this.armed)) {
      const here = KD.legal(this.state).filter(m => m.power === this.armed && m.to === sq);
      this.armed = null;
      if (here.length) return this.commit(here);
      this.clearSelection(); return;
    }
    const cands = this.candidates();
    // Tapping the last chain square again finishes the shorter capture there.
    if (this.pending.length && sq === this.pending.at(-1)) {
      const done = cands.filter(m => m.path.length === this.pending.length);
      if (done.length) return this.commit(done);
    }
    const next = cands.filter(m => m.path[this.pending.length] === sq);
    if (this.selected == null || !next.length) {
      const own = cell && cell.color === st.turn;
      if (own && sqIndex !== this.selected) { this.sound('tap'); this.selectSquare(sq); } else this.clearSelection();
      return;
    }
    const complete = next.filter(m => m.path.length === this.pending.length + 1);
    if (complete.length && complete.length === next.length) return this.commit(complete, { dragged });
    this.pending.push(sq);
    this.showTargets(this.candidates(), { pending: this.pending });
    this.say(`Chain: ${this.pending.join(', ')}. Tap the next marked enemy, or ${sq} again to stop here.`);
  }

  async commit(moves, { dragged = false } = {}) {
    let m = moves[0];
    if (moves.length > 1) {
      // One tap, more than one move: Capture or Push (an Ogre), a promotion, a Sacrifice. Ask, as the app does.
      const from = this.selected, gen = this.gen;
      this.busy = true;
      m = await (this.o.choose ?? (list => chooseMove(list, this)))(moves);
      if (gen !== this.gen) return;
      this.busy = false;
      if (!m) { if (dragged && from != null) this.snapBack(from); this.clearSelection(); return; }
    }
    this.armed = null;
    await this.playMove(m, { dragged });
  }

  /** Play a move (a KD.legal move or a LAN string) with its animation; the computer answers in play mode. */
  async playMove(move, { dragged = false } = {}) {
    if (!this.state) throw new Error('board.playMove needs a state: call setState first');
    const gen = this.gen;
    this.busy = true;
    const story = KD.describe(this.state, move);
    await this.animate(story, { dragged });
    if (gen !== this.gen) return story;
    this.state = story.next;
    this.busy = false;
    this.onMove?.(story);
    const st = KD.status(this.state);
    if (st.over) this.say(st.text);
    this.maybeAi();
    return story;
  }

  async maybeAi() {
    if (!this.play || !this.state || this.busy) return;
    const st = KD.status(this.state);
    if (st.over || this.isHuman(st.turn)) return;
    const gen = this.gen;
    this.busy = true;
    await new Promise(r => setTimeout(r, this.play.pause));
    if (gen !== this.gen) return;
    const m = await KD.think(this.state, { level: this.play.level, ms: this.play.ms });
    if (gen !== this.gen) return;
    this.busy = false;
    if (m) await this.playMove(m);
  }

  // ---- input ----
  wireInput() {
    const root = this.el;
    let down = null, pressTimer = 0, hoverTimer = 0, hoverSq = null;
    const clearPress = () => { clearTimeout(pressTimer); pressTimer = 0; };

    root.addEventListener('pointerdown', e => {
      if (e.button !== 0 || down) return;
      const sq = this.squareAtPoint(e.clientX, e.clientY);
      if (sq == null) return;
      // Touch and pen: no emulated mouse events after the tap (they would move the focus out of a sheet the tap opens).
      if (e.pointerType !== 'mouse') e.preventDefault();
      down = { id: e.pointerId, x: e.clientX, y: e.clientY, sq, drag: false, inspected: false };
      clearTimeout(hoverTimer);
      // Long press: inspect the piece (a touch has no hover).
      if (this.cells[sq]) pressTimer = setTimeout(() => { if (down && !down.drag && this.cells[sq]) { down.inspected = true; this.onInspect?.(nameOf(sq), this.cells[sq]); } }, 500);
      try { root.setPointerCapture(e.pointerId); } catch { /* not capturable */ }
    });

    root.addEventListener('pointermove', e => {
      if (down && e.pointerId === down.id) {
        const dist = Math.hypot(e.clientX - down.x, e.clientY - down.y);
        if (dist > 8) clearPress();
        if (!down.drag && dist > 6 && this.canDrag(down.sq)) {
          down.drag = true;
          if (this.selected !== down.sq) this.selectSquare(nameOf(down.sq));
          const el = this.figs.get(down.sq);
          if (el) { el.style.zIndex = '500'; el.getAnimations().forEach(a => a.cancel()); }
        }
        if (down.drag) {
          const el = this.figs.get(down.sq);
          if (el) el.style.transform = `translate(${e.clientX - down.x}px, ${e.clientY - down.y}px) scale(1.06)`;
        }
        return;
      }
      if (e.pointerType !== 'mouse') return;
      const sq = this.squareAtPoint(e.clientX, e.clientY);
      if (sq === hoverSq) return;
      hoverSq = sq;
      clearTimeout(hoverTimer);
      this.hover(sq);
      if (sq != null && this.cells[sq] && this.onInspect) hoverTimer = setTimeout(() => { if (!down && hoverSq === sq && this.cells[sq]) this.onInspect?.(nameOf(sq), this.cells[sq]); }, 650);
    });

    // The browser sends a click after a tap. A tap or a long press can open a sheet (a move choice, a
    // demo's panel): that click must not land in it and pick or close something. The board never uses clicks.
    const bustClick = () => {
      const bust = ev => { ev.preventDefault(); ev.stopPropagation(); };
      window.addEventListener('click', bust, { capture: true, once: true });
      setTimeout(() => window.removeEventListener('click', bust, { capture: true }), 600);
    };
    const end = e => {
      if (!down || e.pointerId !== down.id) return;
      clearPress();
      const d = down; down = null;
      try { root.releasePointerCapture(e.pointerId); } catch { /* released */ }
      if (e.type === 'pointercancel') { this.snapBack(d.sq); return; }
      if (d.inspected) { bustClick(); return; }
      const sq = this.squareAtPoint(e.clientX, e.clientY);
      if (d.drag) {
        const next = sq == null || sq === d.sq ? [] : this.candidates().filter(m => m.path[this.pending.length] === nameOf(sq));
        if (!next.length) { this.snapBack(d.sq); return; }
        // A drop that plays at once keeps the figure where it was dropped; else it goes home first.
        const plays = next.every(m => m.path.length === this.pending.length + 1);
        if (!plays) this.snapBack(d.sq);
        void this.handleTap(sq, { dragged: plays });
        return;
      }
      if (sq == null || (sq !== d.sq && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 8)) return;
      bustClick();
      void this.handleTap(sq);
    };
    root.addEventListener('pointerup', end);
    root.addEventListener('pointercancel', end);
    root.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { hoverSq = null; clearTimeout(hoverTimer); this.hover(null); } });
    root.addEventListener('contextmenu', e => e.preventDefault());

    root.addEventListener('keydown', e => {
      const moves = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
      if (moves[e.key]) {
        e.preventDefault();
        const { col, row } = this.colRow(this.cursor), [dx, dy] = moves[e.key];
        const c = Math.max(0, Math.min(7, col + dx)), r = Math.max(0, Math.min(7, row + dy));
        this.cursor = this.flipped ? r * 8 + (7 - c) : (7 - r) * 8 + c;
        this.moveCursorMark();
        const cell = this.cells[this.cursor];
        this.say(`${nameOf(this.cursor)}${cell ? `, ${sideName(cell.color).toLowerCase()} ${cell.type}` : ', empty'}${this.targets.some(m => m.path[this.pending.length] === nameOf(this.cursor)) ? ', a move' : ''}`);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        void this.handleTap(this.cursor);
      } else if (e.key === 'Escape') {
        if (this.selected != null || this.armed) { e.preventDefault(); this.armed = null; this.clearSelection(); this.say('Cancelled.'); }
      } else if (e.key === 'i' || e.key === 'I') {
        if (this.cells[this.cursor]) this.onInspect?.(nameOf(this.cursor), this.cells[this.cursor]);
      }
    });
  }

  canDrag(sq) {
    if (!this.play || !this.state || this.busy) return false;
    const cell = this.cells[sq], st = KD.status(this.state);
    return !!cell && !st.over && this.isHuman(st.turn) && cell.color === st.turn && !this.armed;
  }

  snapBack(sq) {
    const el = this.figs.get(sq);
    if (!el) return;
    const t = el.style.transform;
    el.style.transform = '';
    this.place(el, sq);
    if (t && this.motion()) el.animate([{ transform: t }, { transform: 'none' }], { duration: this.ms(160), easing: 'cubic-bezier(.2,.8,.2,1)' });
  }

  moveCursorMark() {
    if (!this.cursorMark) return;
    this.cursorMark.dataset.sq = nameOf(this.cursor);
    this.place(this.cursorMark, this.cursor, 2);
  }

  /** Pointer over a square: on an empty move target, the selected figure shows there, see-through. */
  hover(sq) {
    this.clearMarks('hover');
    this.hideGhost();
    if (sq == null || this.selected == null) return;
    const name = nameOf(sq);
    const target = this.targets.find(m => m.path[this.pending.length] === name);
    if (!target) return;
    if (!this.cells[sq] && this.cells[this.selected]) {
      const g = this.ghost ??= this.makeFig(this.cells[this.selected]);
      this.dressFig(g, this.cells[this.selected]);
      g.classList.add('is-ghost');
      this.place(g, sq, 1);
      this.sq.appendChild(g);
    } else this.mark(name, 'hover');
  }

  hideGhost() { this.ghost?.remove(); }

  /** Take back plies (default: 1; against the computer, 2 gives the player's move back). */
  undo(plies = 1) {
    if (!this.state) return this;
    let s = this.state;
    for (let n = 0; n < plies && s.history.length; n++) s = KD.undo(s);
    return this.setState(s);
  }

  /** Close the board's own move-choice sheet, if it is open (setState and setBoard do this). */
  closeChoice() { if (this.choice?.open) this.choice.close(); }

  /** Stop the board: remove it and its listeners. */
  destroy() { this.gen++; this.closeChoice(); this.ro.disconnect(); this.el.remove(); this.sizer.remove(); }
}

/** A short name for a move in a choice: 'Capture on d5', 'Push to d6', 'Promote to queen'. */
export function moveLabel(m) {
  if (m.push) return `Push to ${m.push.to}`;
  if (m.power === 'sacrifice' && m.promo) return `${m.powerName}: bring back the ${m.promo}`;
  if (m.promo) return `Promote to ${m.promo}`;
  if (m.powerName) return `${m.powerName} on ${m.to}`;
  if (m.captures.length) return `Capture on ${m.captures.join(', ')}`;
  return `Move to ${m.to}`;
}

/** The board's own choice sheet (options.choose replaces it): one button per move, and Cancel. */
function chooseMove(moves, board) {
  const dlg = document.createElement('dialog');
  if (board) board.choice = dlg;
  const id = `kdb-choice-${Math.random().toString(36).slice(2, 8)}`;
  dlg.className = 'sheet kdb-choice';
  dlg.setAttribute('aria-labelledby', id);
  dlg.innerHTML = `<div class="sheet-grip"></div><div class="sheet-head"><h2 id="${id}">Choose a move</h2></div>
    <div class="sheet-body stack">${moves.map((m, i) => `<button type="button" class="btn${i ? '' : ' btn-primary'} btn-wide" data-i="${i}">${moveLabel(m)}</button>`).join('')}
    <button type="button" class="btn btn-quiet btn-wide" data-close>Cancel</button></div>`;
  document.body.appendChild(dlg);
  return new Promise(resolve => {
    let chosen = null;
    dlg.addEventListener('click', e => {
      const b = e.target.closest?.('[data-i]');
      if (b) { chosen = moves[+b.dataset.i] ?? null; void closeSheet(dlg); }
    });
    dlg.addEventListener('close', () => { if (board?.choice === dlg) board.choice = null; dlg.remove(); resolve(chosen); });
    openSheet(dlg);
  });
}

/** The figure image URL and its fitted box for a cell ({ type, color, design }), for a demo's own figure. */
export function figureArt(cell) {
  const g = FIG[figKey(cell)];
  return { src: figSrc(cell), box: g ? { left: g[0], top: g[1], width: g[2], height: g[3], mirror: !!g[4] } : null };
}

export { KD };
