/**
 * The Proving Ground's marks: the part of the approved mockup's mark module
 * (docs/research/rules-ui-2026-10-10/mockups/shared/marks.js, its line numbers in the comments) that tickets 01 to
 * 08 draw. The tiles, targets, shots, occupied takes and badges come from src/render/legend.ts; the blocks and
 * When words from vocab.ts. The refused forms, the stamps, the knots and the zone chalk stay here: the legend has
 * none. The mockup's looks `wash` and `familyWax` are always on. Later tickets port the rest.
 */
import { DEFS as LEG_DEFS, LEG, badge, occupied, target, tile as legendTile, toSvg, type Shape } from '../render/legend';
import { DIR, likeSquares, type Ability, type Dir, type PaintOn, type PieceDesign, type When, type Zone } from './model';
import type { Scene, ScenePiece } from './scene';
import { esc } from './text';
import { BODY, blockOf, whenWords, type Group } from './vocab';
import { KIND, type Why } from './why';

/** The colours that the legend does not hold (marks.js:73-86): the stone greys of a refused mark, the wax red of a stamp, the chalk, the diagram's squares. */
const C = { goldI: '#7a5712', push: '#2f7f75', swap: '#7a58c0', acc: '#842c21', bFill: '#c9bfac', bX: '#8a8072', bBar: '#4d453c', chalk: 'rgba(251,247,238,.95)', chalkSh: 'rgba(43,38,33,.55)', dLight: '#e2d3b2', dDark: '#4a4036' };
type MarkKind = Scene['marks'][number]['k'];

/** 24 × 24 stroked sigils (marks.js:88-124): the 10 blocks with the G11 replacements, and the extras in use. */
const SIGILS: Record<Ability['a'] | 'quill' | 'moon' | 'near' | 'card' | 'lock' | 'lockOpen' | 'eraser' | 'scale' | 'eye' | 'die' | 'broom', string> = {
  step2: 'M7 13l5-5 5 5M7 19l5-5 5 5',
  movesLike: 'M4 7c3-2 13-2 16 0 0 6-3 10-8 10S4 13 4 7zM8.5 10.5h2M13.5 10.5h2',
  linesPass: 'M3 18c3-9 15-9 18 0M12 15v4',
  chain: 'M9.5 14.5l5-5M8 11l-2.5 2.5a3.5 3.5 0 0 0 5 5L13 16M16 13l2.5-2.5a3.5 3.5 0 0 0-5-5L11 8',
  cannotBeTaken: 'M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z',
  push: 'M3 12h11M10 8l4 4-4 4M19 5v14',
  swap: 'M4 9h15l-4-4M20 15H5l4 4',
  becomes: 'M12 21V10M8 14l4-4 4 4M6 7l3 2 3-5 3 5 3-2',
  cannotTake: 'M5 5l14 14M12 3a9 9 0 1 0 .01 0',
  removedAfter: 'M12 2.5v3.5M7.5 8h9M10.4 8v9.5L12 21.5l1.6-4V8',
  quill: 'M20 3.5C12 4 6.5 9.5 5 20.5M5 20.5l3.2-1.2M9 13.5h5.5M7.5 17h4',
  moon: 'M15.5 4a8.5 8.5 0 1 0 4.8 13.6A7 7 0 0 1 15.5 4z',
  near: 'M12 3.5a8.5 8.5 0 1 0 .01 0M12 8a1.8 1.8 0 1 0 .01 0M9.5 16.5l1-4.5h3l1 4.5z',
  card: 'M7 3.5h10a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 19V5A1.5 1.5 0 0 1 7 3.5z',
  lock: 'M7.5 11V8a4.5 4.5 0 0 1 9 0v3M5.5 11h13v9.5h-13z',
  lockOpen: 'M7.5 11V8a4.5 4.5 0 0 1 8.7-1.6M5.5 11h13v9.5h-13z',
  eraser: 'M14.5 4.5l5 5-9 9H6l-2.5-2.5zM9 10l5 5M6 18.5h14',
  scale: 'M12 3.5v17M7 20.5h10M4 7h16M6.5 7l-3 6.5h6zM17.5 7l-3 6.5h6zM10.5 4.5h3',
  eye: 'M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12zM12 9.3a2.7 2.7 0 1 0 .01 0',
  die: 'M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM8.5 8.5h.01M15.5 15.5h.01M12 12h.01M15.5 8.5h.01M8.5 15.5h.01',
  broom: 'M15 3l-4.5 9M7 12h8.5l2 8.5H5zM9 16v4.5M13 16v4.5',
};

/** The hover names (marks.js:145-151): the square labels and the key. */
export const NAMES = {
  move: 'Move', take: 'Take only', both: 'Move or take', shot: 'Shot: takes from here', moveshot: 'Move or shot',
  line: 'Line', arch: 'Passes over', cond: 'Only sometimes', asleep: 'Asleep here', push: 'Pushes', swap: 'Swaps',
  blocked: 'Refused', 'blocked-move': 'Refused', removed: 'Removed too', threat: 'Can hit this piece', tstop: 'Threat stopped',
};

const n = (v: number) => Math.round(v * 100) / 100;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
type P = readonly [number, number];
const line = (x1: number, y1: number, x2: number, y2: number, stroke: string, w: number, extra = '') =>
  `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${stroke}" stroke-width="${n(w)}" ${extra}/>`;
const tri = (t: P, u: P, l: number, hw: number) => {
  const b = [t[0] - u[0] * l, t[1] - u[1] * l];
  return `M${n(t[0])} ${n(t[1])}L${n(b[0] - u[1] * hw)} ${n(b[1] + u[0] * hw)}L${n(b[0] + u[1] * hw)} ${n(b[1] - u[0] * hw)}z`;
};

/* ---- the shared defs (marks.js:167-197) ---- */

const WAX = (id: string, a: string, b: string, c: string) =>
  `<radialGradient id="kdm-wax${id}" cx=".38" cy=".3" r=".78"><stop offset="0" stop-color="${a}"/><stop offset=".45" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></radialGradient>`;
const DEFS = LEG_DEFS
  + `<radialGradient id="kdm-wax" cx=".38" cy=".3" r=".78"><stop offset="0" stop-color="#b24a3a"/><stop offset=".35" stop-color="#9c3a2d"/><stop offset=".72" stop-color="#842c21"/><stop offset="1" stop-color="#5a1c14"/></radialGradient>`
  + WAX('-taking', '#6b2a22', '#4a1712', '#22090a') + WAX('-safe', '#7d9cbc', '#4f6f93', '#2a405c') + WAX('-others', '#4fa197', '#2f7f75', '#174c46')
  + WAX('-changing', '#f1cf7e', '#d0a046', '#8a6418') + WAX('-holding', '#77706a', '#4c4640', '#26221f')
  + '<filter id="kdm-arc-shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1" stdDeviation="1.2" flood-color="#1d1915" flood-opacity=".55"/></filter>'
  + `<radialGradient id="kdm-glow-gold"><stop offset="0" stop-color="${LEG.gold}" stop-opacity=".95"/><stop offset=".55" stop-color="${LEG.gold}" stop-opacity=".55"/><stop offset="1" stop-color="${LEG.gold}" stop-opacity="0"/></radialGradient>`
  + '<filter id="kdm-rim" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="0" stdDeviation=".75" flood-color="#2b2621" flood-opacity=".7"/></filter>'
  + '<filter id="kdm-seal-shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="2.5" stdDeviation="2.2" flood-color="#1d1915" flood-opacity=".42"/></filter>'
  + '<pattern id="kdm-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="rgba(251,247,238,.18)" stroke-width="1"/><line x1="1" y1="0" x2="1" y2="8" stroke="rgba(43,38,33,.10)" stroke-width="1"/></pattern>';

/** Puts the gradients and filters that the marks name into the page once. */
export function ensureDefs(): void {
  if (document.getElementById('kdm-defs')) return;
  const d = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  d.id = 'kdm-defs';
  d.setAttribute('aria-hidden', 'true');
  d.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden');
  d.innerHTML = `<defs>${DEFS}</defs>`;
  document.body.prepend(d);
}

/* ---- rails, line ends and arches (marks.js:386-464) ---- */

type Style = 'asleep' | 'awake';
/** A rail from p0 to p1. On the board (wash) it is thin; asleep and awake rails have stitched edges. */
function rail(p0: P, p1: P, s: number, o: { style?: Style; wash?: boolean } = {}): string {
  const w = o.wash ? Math.max(3, 0.04 * s) : Math.max(4, 0.1 * s), e = o.wash ? 0.9 : s < 48 ? 1 : 1.5;
  const l = (stroke: string, lw: number, extra = '') => line(p0[0], p0[1], p1[0], p1[1], stroke, lw, extra);
  if (!o.style && o.wash) return `<g opacity=".85">${l(LEG.halo, w + 2 * e + 1.5, 'stroke-opacity=".6"') + l(LEG.navy, w + 2 * e, 'stroke-opacity=".75"') + l(LEG.green, w)}</g>`;
  if (!o.style) return l(LEG.halo, w + 2 * e + 2) + l(LEG.navy, w + 2 * e) + l(LEG.green, w);
  // The stitched edges: two dashed lines beside the rail.
  const dx = p1[0] - p0[0], dy = p1[1] - p0[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, off = w / 2 + e / 2;
  const dash = `stroke-dasharray="${s < 40 ? '3 2' : '4 3'}"`, asleep = o.style === 'asleep';
  let out = asleep ? '' : l(LEG.halo, w + 2 * e + 2) + l(LEG.green, w);
  out += `<g${asleep ? ' opacity=".4"' : ''}>${asleep ? l(LEG.halo, w + 2 * e + 2, 'stroke-opacity=".5"') : ''}`;
  for (const k of [1, -1]) out += line(p0[0] + nx * off * k, p0[1] + ny * off * k, p1[0] + nx * off * k, p1[1] + ny * off * k, LEG.navy, e + (asleep ? 0.5 : 0), dash);
  return `${out}</g>`;
}
function arrowHead(tip: P, u: P, s: number, o: { style?: Style; wash?: boolean } = {}): string {
  const d = tri(tip, u, (o.wash ? 0.17 : 0.22) * s, (o.wash ? 0.11 : 0.15) * s), asleep = o.style === 'asleep';
  return `<path d="${d}" fill="none" stroke="${LEG.halo}" stroke-width="${s < 48 ? 4 : 5}" stroke-linejoin="round"/>`
    + `<path d="${d}" fill="${asleep ? 'none' : LEG.green}" stroke="${LEG.navy}" stroke-width="${s < 48 ? 1.25 : 1.5}" stroke-linejoin="round"${asleep ? ' opacity=".4"' : ''}/>`;
}
function stopBar(pt: P, u: P, s: number): string {
  const h = 0.25 * s, a = [pt[0] - u[1] * h, pt[1] + u[0] * h], b = [pt[0] + u[1] * h, pt[1] - u[0] * h];
  return line(a[0], a[1], b[0], b[1], LEG.halo, 6, 'stroke-linecap="round"') + line(a[0], a[1], b[0], b[1], LEG.navy, 3, 'stroke-linecap="round"');
}
/** "Passes over": a dashed gold-ink arc with an arrowhead, bulging up (marks.js:441-464, the gold look); a shot's sight
 *  line is a flatter one. `ink`: a chain's hop, a solid ink arc. `left`: it bulges to the left of its way (a diagram's bridge). */
function arch(p0: P, p1: P, s: number, o: { bulge?: number; ink?: boolean; left?: boolean } = {}): string {
  const mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2, vx = p1[0] - p0[0], vy = p1[1] - p0[1], L = Math.hypot(vx, vy) || 1, k = 2 * (o.bulge ?? 0.45) * s;
  let nx = -vy / L, ny = vx / L;
  if (o.left) { nx = -nx; ny = -ny; } else if (Math.abs(vx) < 1e-6) { if (nx < 0) { nx = -nx; ny = -ny; } } else if (ny > 0) { nx = -nx; ny = -ny; }
  const c = [mx + nx * k, my + ny * k], d = `M${n(p0[0])} ${n(p0[1])}Q${n(c[0])} ${n(c[1])} ${n(p1[0])} ${n(p1[1])}`;
  const sw = o.ink ? 2 : s >= 40 ? 2.5 : 1.8, [col, halo] = o.ink ? [LEG.ink, LEG.halo] : [C.goldI, LEG.gold];
  let g = o.ink ? `<path d="${d}" fill="none" stroke="${halo}" stroke-width="${sw + 3}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round"/>`
    : `<g filter="url(#kdm-arc-shadow)"><path d="${d}" fill="none" stroke="${halo}" stroke-width="${n(sw + 2.5)}" stroke-linecap="round" stroke-opacity=".75"/>`
      + `<path d="${d}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="6 4"/></g>`;
  if (s >= 24) {
    const ul = Math.hypot(p1[0] - c[0], p1[1] - c[1]), hl = Math.max(5, 0.12 * s);
    g += `<path d="${tri(p1, [(p1[0] - c[0]) / ul, (p1[1] - c[1]) / ul], hl, hl * 0.6)}" fill="${col}" stroke="${halo}" stroke-width="1"/>`;
  }
  return g;
}
/** A chain's order pip: an ink disc with the take's number (pip, marks.js:606-609). */
const pip = (cx: number, cy: number, d: number, num: number) =>
  `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(d / 2 + 1.5)}" fill="${LEG.halo}"/><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(d / 2)}" fill="${LEG.ink}"/>`
  + `<text x="${n(cx)}" y="${n(cy + d * 0.3)}" text-anchor="middle" font-family="Alegreya Sans, sans-serif" font-weight="700" font-size="${n(d * 0.78)}" fill="${LEG.white}">${num}</text>`;

/* ---- the push and swap arrows (marks.js:533-555) ---- */

function arrowLine(p0: P, p1: P, color: string, w: number, o: { trim0?: number; trim1?: number; head: number; both?: boolean }): string {
  const L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) || 1, u: P = [(p1[0] - p0[0]) / L, (p1[1] - p0[1]) / L], back: P = [-u[0], -u[1]];
  const a: P = [p0[0] + u[0] * (o.trim0 ?? 0), p0[1] + u[1] * (o.trim0 ?? 0)], b: P = [p1[0] - u[0] * (o.trim1 ?? 0), p1[1] - u[1] * (o.trim1 ?? 0)];
  const hl = o.head, heads: [P, P][] = o.both ? [[b, u], [a, back]] : [[b, u]];
  const s0 = o.both ? [a[0] + u[0] * hl * 0.7, a[1] + u[1] * hl * 0.7] : a, s1 = [b[0] - u[0] * hl * 0.7, b[1] - u[1] * hl * 0.7];
  let g = line(s0[0], s0[1], s1[0], s1[1], LEG.halo, w + 3, 'stroke-linecap="round"');
  for (const [t, uu] of heads) g += `<path d="${tri(t, uu, hl, hl * 0.62)}" fill="${LEG.halo}" stroke="${LEG.halo}" stroke-width="3" stroke-linejoin="round"/>`;
  g += line(s0[0], s0[1], s1[0], s1[1], color, w, 'stroke-linecap="round"');
  for (const [t, uu] of heads) g += `<path d="${tri(t, uu, hl, hl * 0.62)}" fill="${color}"/>`;
  return `<g>${g}</g>`;
}

/** A threat (marks.js:1139-1148): a faint red arrow from the attacker; a stopped one is grey, with a bar across its middle
 *  and the stamp of "cannot be taken" beside it. */
function threat(c0: P, c1: P, s: number, stopped?: boolean, trim = s * 0.25): string {
  const o = { trim0: trim * 0.88, trim1: trim * 1.12, head: 9 };
  if (!stopped) return `<g opacity=".6">${arrowLine(c0, c1, LEG.red, 2, o)}</g>`;
  const mx = (c0[0] + c1[0]) / 2, my = (c0[1] + c1[1]) / 2, L = Math.hypot(c1[0] - c0[0], c1[1] - c0[1]) || 1, px = (c0[1] - c1[1]) / L, py = (c1[0] - c0[0]) / L, h = s * 0.13;
  return arrowLine(c0, c1, C.bX, 2, o) + line(mx + px * h, my + py * h, mx - px * h, my - py * h, LEG.halo, 6, 'stroke-linecap="round"')
    + line(mx + px * h, my + py * h, mx - px * h, my - py * h, C.bBar, 3, 'stroke-linecap="round"') + stamp('cannotBeTaken', mx - px * s * 0.32, my - py * s * 0.32, clamp(Math.round(s * 0.225), 12, 20));
}

/* ---- sigils, the moon pip, When chips, seals and tags (marks.js:296, :467-471, :666-697, :701-752, :805) ---- */

const sigilInline = (name: keyof typeof SIGILS, x: number, y: number, size: number, color: string, width: number) =>
  `<svg x="${n(x)}" y="${n(y)}" width="${n(size)}" height="${n(size)}" viewBox="0 0 24 24" overflow="visible"><path d="${SIGILS[name]}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
/** The asleep pip: a small vellum disc with a moon. */
const moonPip = (cx: number, cy: number, d: number) =>
  `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(d / 2 + 1.2)}" fill="${LEG.halo}"/><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(d / 2)}" fill="${LEG.white}" stroke="${LEG.navy}" stroke-width="1.2" stroke-opacity=".7"/>`
  + sigilInline('moon', cx - d * 0.33, cy - d * 0.33, d * 0.66, LEG.navy, 2.6);
/** The pip of a painted change: a small vellum disc with a quill (quillPip, marks.js:343-346). */
const quillPip = (cx: number, cy: number, d: number) =>
  `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(d / 2 + 1.2)}" fill="${LEG.halo}"/><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(d / 2)}" fill="${LEG.white}" stroke="${C.goldI}" stroke-width="1.3"/>`
  + sigilInline('quill', cx - d * 0.34, cy - d * 0.34, d * 0.68, C.goldI, 2.4);

/* ---- the refused forms (marks.js:242, :300-342, :519-531, :1080-1093): the legend's take in stone grey, with a bar ---- */

const GREY: Record<string, string> = { [LEG.white]: C.bFill, [LEG.navy]: C.bBar, green: C.bFill, 'rgba(214,52,40,.08)': 'rgba(201,191,172,.18)' };
/** The shapes in grey, with no red glow; red becomes `red`. */
const grey = (shapes: Shape[], red = C.bX): Shape[] => {
  const tint = (c?: string) => (c === LEG.red ? red : c && (GREY[c] ?? c));
  return shapes.filter(sh => sh.fill !== 'glow-red').map(sh => ({ ...sh, fill: tint(sh.fill), stroke: tint(sh.stroke) }));
};
const bar = (cx: number, cy: number, len: number, w: number) =>
  line(cx - len / 2, cy, cx + len / 2, cy, LEG.white, w + 2, 'stroke-linecap="round"') + line(cx - len / 2, cy, cx + len / 2, cy, C.bBar, w, 'stroke-linecap="round"');
/** The refused badge with its bar, and the bar under the figure's feet. */
function refusedBadge(x: number, y: number, s: number): string {
  const b = grey(badge(x, y, s, 'take')), f = b[0] as Extract<Shape, { k: 'rect' }>;
  return toSvg(b) + bar(f.x + f.w / 2, f.y + f.h / 2, f.w * 0.78, 2) + bar(x + s / 2, y + s * 0.955, s * 0.56, clamp(0.0375 * s, 1.5, 3));
}

/** A legend tile as SVG; an asleep tile gets the moon pip in its lower right corner (marks.js:337). A refused tile is grey
 *  with a bar. The paint diff (marks.js:310, :340): '+' adds the quill pip in the lower left corner; '-' draws the dashed outline only. */
function tileSvg(kind: MarkKind, x: number, y: number, s: number, o: { solid?: boolean; cond?: Style; diff?: '+' | '-' } = {}): string {
  const refused = kind === 'blocked' || kind === 'blocked-move';
  const shapes = legendTile(refused ? 'take' : kind, x, y, s, { ...o, cond: o.diff === '-' ? 'awake' : o.cond }), f = shapes.find(sh => sh.dash) as Extract<Shape, { k: 'rect' }> | undefined;
  if (o.diff === '-' && f) return toSvg([{ ...f, stroke: LEG.halo, lw: (f.lw ?? 1) + 2, a: 0.6, dash: undefined }, { ...f, a: 0.6 }]);
  if (refused) {
    const g = grey(shapes).filter(sh => kind === 'blocked' || sh.k !== 'circle'), r = g[0] as Extract<Shape, { k: 'rect' }>;
    return toSvg(g) + bar(r.x + r.w / 2, r.y + r.h / 2, r.w * 0.78, clamp(0.0375 * s, 1.5, 3.5)) + diffPip(x, y, s, o.diff);
  }
  return toSvg(shapes) + (o.cond === 'asleep' && f && s >= 24 ? moonPip(f.x + f.w - 0.13 * s, f.y + f.h - 0.13 * s, clamp(0.2 * s, 10, 16)) : '') + diffPip(x, y, s, o.diff);
}
/** The quill pip of a '+' mark, in the lower left corner of its tile. */
function diffPip(x: number, y: number, s: number, diff?: '+' | '-'): string {
  const f = legendTile('move', x, y, s).find(sh => sh.k === 'rect') as Extract<Shape, { k: 'rect' }>;
  return diff === '+' && s >= 24 ? quillPip(f.x + 0.13 * s, f.y + f.h - 0.13 * s, clamp(0.2 * s, 12, 16)) : '';
}
/** A small four-point star (the event spark). */
function sparkPath(cx: number, cy: number, r: number): string {
  const k = r * 0.32;
  return `M${n(cx)} ${n(cy - r)}L${n(cx + k)} ${n(cy - k)}L${n(cx + r)} ${n(cy)}L${n(cx + k)} ${n(cy + k)}L${n(cx)} ${n(cy + r)}L${n(cx - k)} ${n(cy + k)}L${n(cx - r)} ${n(cy)}L${n(cx - k)} ${n(cy - k)}z`;
}

export function sigil(name: keyof typeof SIGILS, size = 24): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><path d="${SIGILS[name]}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

const ZONE_ROWS: Record<string, number[][]> = { startRank: [[0, 6, 8, 1]], ownHalf: [[0, 4, 8, 4]], enemyHalf: [[0, 0, 8, 4]], lastRank: [[0, 0, 8, 1]], capital: [[3, 3, 2, 2]] };
const strokeP = (d: string, w = 2) => `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const numText = (t: string | number, x: number, y: number, fs: number) =>
  `<text x="${x}" y="${y}" text-anchor="middle" font-family="Alegreya Sans, sans-serif" font-weight="800" font-size="${fs}" fill="currentColor" stroke="${LEG.white}" stroke-width="2.4" paint-order="stroke">${t}</text>`;
/** The When's pictogram, drawn in currentColor. */
function pictoInner(w: When): string {
  switch (w.on) {
    case 'zone': return '<rect x="2" y="2" width="20" height="20" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M7 2v20M12 2v20M17 2v20M2 7h20M2 12h20M2 17h20" stroke="currentColor" stroke-width=".5" opacity=".45"/>'
      + ZONE_ROWS[w.zone].map(([f, r, x, y]) => `<rect x="${2 + f * 2.5}" y="${2 + r * 2.5}" width="${x * 2.5}" height="${y * 2.5}" fill="currentColor"/>`).join('');
    case 'near': return strokeP(SIGILS.near, 1.8);
    case 'fromMove': case 'beforeMove': return strokeP('M6 2.5h9M6 19.5h9M7 2.5c0 4.5 6.5 5.8 6.5 8.5S7 15 7 19.5M14 2.5c0 4.5-6.5 5.8-6.5 8.5S14 15 14 19.5', 1.9) + numText(w.n, 18.5, 23, 10.5);
    case 'afterFirstCapture': return '<circle cx="9.5" cy="9.5" r="6.8" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="9.5" cy="9.5" r="2.6" fill="currentColor"/>' + numText(1, 19, 23, 12);
    case 'afterCard': return strokeP(SIGILS.card, 1.9) + '<path d="M12.5 3.5h4a1.5 1.5 0 0 1 1.5 1.5v4z" fill="#842c21"/>';
    case 'takes': return `<path d="${sparkPath(12, 12, 10)}" fill="currentColor"/>`;
    case 'firstTake': return `<path d="${sparkPath(10, 11, 9)}" fill="currentColor"/>` + numText(1, 19, 23, 12);
    case 'reaches': return `<path d="${sparkPath(6.5, 7, 5.5)}" fill="currentColor"/>` + strokeP('M3 21h18M7 17l-.5-6 3.5 2.5 2-4.5 2 4.5 3.5-2.5-.5 6z', 1.7);
    default: return '';
  }
}
export const picto = (w: When, size = 14): string => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${pictoInner(w)}</svg>`;
/** The When chip: a plate for a state, a flag for an event; hollow while it does not hold. None for "always". */
export function chip(w: When, o: { hollow?: boolean } = {}): string {
  if (w.on === 'always') return '';
  const cls = w.on === 'takes' || w.on === 'firstTake' || w.on === 'reaches' ? 'flag' : 'plate';
  return `<span class="${cls}${o.hollow ? ' is-hollow' : ''}"><span>${picto(w)}${esc(whenWords(w))}</span></span>`;
}

const SCALLOP = (() => {
  const N = 12, R = 42.5, pts = Array.from({ length: N + 1 }, (_, i) => { const a = (i / N) * Math.PI * 2 - Math.PI / 2; return [50 + Math.cos(a) * R, 50 + Math.sin(a) * R]; });
  const rl = 2 * R * Math.sin(Math.PI / N) * 0.6;
  return `M${n(pts[0][0])} ${n(pts[0][1])}${pts.slice(1).map(([x, y]) => `A${n(rl)} ${n(rl)} 0 0 1 ${n(x)} ${n(y)}`).join('')}z`;
})();
/** One wax colour for each family: the gradient, the edge, the glyph and its deboss (marks.js:731-738). */
const FAMILY_WAX: Record<Group, readonly [string, string, string, string]> = {
  Moving: ['kdm-wax', '#5a1c14', '#f3d58e', 'rgba(40,10,6,.6)'],
  Taking: ['kdm-wax-taking', '#1a0706', '#f0cf86', 'rgba(0,0,0,.7)'],
  Safe: ['kdm-wax-safe', '#22364e', '#f5dc9e', 'rgba(12,24,40,.6)'],
  'Moving others': ['kdm-wax-others', '#123d38', '#f5dc9e', 'rgba(6,30,27,.6)'],
  Changing: ['kdm-wax-changing', '#6f4f12', '#4a3208', 'rgba(255,240,200,.75)'],
  'Holding back': ['kdm-wax-holding', '#1e1b18', '#ecc97d', 'rgba(0,0,0,.65)'],
};
/** A rule's wax seal in its family's colour with the embossed gold glyph; grey and faint while asleep. */
export function seal(a: Ability['a'], size = 44, o: { asleep?: boolean; label?: string } = {}): string {
  const b = blockOf(a), [grad, edge, glyph, deboss] = FAMILY_WAX[b.group], label = esc(o.label ?? b.title);
  const g = (y: number, stroke: string, w: number) =>
    `<svg x="25" y="${y}" width="50" height="50" viewBox="0 0 24 24"><path d="${SIGILS[a]}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return `<svg class="kd-seal" width="${size}" height="${size}" viewBox="0 0 100 100" role="img" aria-label="${label}"${o.asleep ? ' style="filter:grayscale(1);opacity:.5"' : ''}><title>${label}</title>`
    + `<g filter="url(#kdm-seal-shadow)"><path d="${SCALLOP}" fill="url(#${grad})" stroke="${edge}" stroke-width="1.2"/></g>`
    + '<circle cx="50" cy="50" r="33.5" fill="none" stroke="rgba(0,0,0,.32)" stroke-width="2.4"/><circle cx="50" cy="51.2" r="33.5" fill="none" stroke="rgba(255,236,210,.22)" stroke-width="1.2"/>'
    + '<ellipse cx="38" cy="30" rx="16" ry="8" fill="rgba(255,240,226,.16)" transform="rotate(-30 38 30)"/>'
    + g(26.4, deboss, 2.9) + g(24.2, 'rgba(255,250,235,.35)', 2.6) + g(25, glyph, 2.3) + '</svg>';
}
/** A value capsule with a caret (G14, marks.js:698); a choice has no caret, and `on` rings the chosen one. */
export const pill = (text: string, o: { choice?: boolean; on?: boolean } = {}): string =>
  `<span class="pill${o.choice ? ' is-choice' : ''}${o.on ? ' is-on' : ''}">${esc(text)}</span>`;
export const tagYours = (): string => `<span class="tag-yours">${sigil('quill', 13)}Yours</span>`;
/** The Try board plaque (marks.js:809). */
export const plaque = (): string => `<span class="plaque" title="An example board. No check test. The other side does not move.">${sigil('lockOpen', 13)}Try board</span>`;

/* ---- stamps (marks.js:476-511) and knots (:758-797) ---- */

/** A rule's stamp: its sigil in wax red on a vellum disc; an event rule adds a gold spark. */
function stamp(a: Ability['a'], cx: number, cy: number, d: number): string {
  const R = d / 2, g = (d * 12) / 18, k = Math.PI * 0.75;
  return `<circle cx="${n(cx)}" cy="${n(cy + 0.6)}" r="${n(R)}" fill="rgba(29,25,21,.28)"/><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(R - 0.75)}" fill="${LEG.white}" stroke="${C.acc}" stroke-width="1.5"/>`
    + sigilInline(a, cx - g / 2, cy - g / 2, g, C.acc, d >= 30 ? 2 : 2.4)
    + (blockOf(a).event ? `<path d="${sparkPath(cx + Math.cos(k) * (R - 0.5), cy + Math.sin(k) * (R - 0.5), Math.max(3, d * 0.2))}" fill="${C.goldI}" stroke="${LEG.white}" stroke-width=".8" stroke-linejoin="round"/>` : '');
}
/** A stamp alone, for the key row. */
export const impression = (a: Ability['a'], size: number): string =>
  `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" overflow="visible" aria-hidden="true">${stamp(a, size / 2, size / 2, size)}</svg>`;
/** The stamps at a square's top right, from the right: two, then "+N". */
function stamps(list: readonly Ability['a'][], x: number, y: number, s: number): string {
  const d = clamp(Math.round(s * 0.225), 12, 20), cy = y + 3 + d / 2, px = x + s - 3 - 2 * (d + 2) - d * 0.75;
  return list.slice(0, 2).map((a, i) => stamp(a, x + s - 3 - d / 2 - i * (d + 2), cy, d)).join('') + (list.length > 2
    ? `<rect x="${n(px - d * 0.55)}" y="${n(cy - d * 0.38)}" width="${n(d * 1.1)}" height="${n(d * 0.76)}" rx="${n(d * 0.38)}" fill="${LEG.white}" stroke="${C.bX}"/>`
      + `<text x="${n(px)}" y="${n(cy + d * 0.2)}" text-anchor="middle" font-family="Alegreya Sans, sans-serif" font-weight="700" font-size="${n(d * 0.5)}" fill="${LEG.ink}">+${list.length - 2}</text>` : '');
}
/** A knot that stands between two rule lines, `len` px long: gold when the rules combine, cracked when one stops the other. */
export function knot(type: 'gold' | 'cracked', len: number): string {
  const w = 18, pad = 4, mx = len / 2, my = w * 0.24, ink = type === 'gold' ? C.goldI : C.bX, d = `M${pad} ${w - 3}Q${n(mx)} ${n(-w * 0.55)} ${n(len - pad)} ${w - 3}`;
  // Drawn lying down, then stood up; the gold knot's glyph turns back, so it stays level.
  const g = type === 'gold'
    ? `<path d="${d}" fill="none" stroke="${LEG.gold}" stroke-width="4" stroke-linecap="round" opacity=".5"/><path d="${d}" fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>`
      + `<g transform="translate(${n(mx)} ${n(my)}) rotate(90)"><ellipse rx="8.5" ry="6" fill="${LEG.white}"/><path d="M-7 1.5c2-5 5-5 7-1.5s5 3.5 7-1.5M-7-1.5c2 5 5 5 7 1.5s5-3.5 7 1.5" fill="none" stroke="${ink}" stroke-width="1.8" stroke-linecap="round"/></g>`
    : `<path d="${d}" fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round" stroke-dasharray="${n(len * 0.56 - 7)} 15.4 999"/>`
      + `<path d="M${n(mx - 6)} ${n(my - 6)}l3 4-3 3 4 3-2 3M${n(mx + 3)} ${n(my - 7)}l-2 4 3 3-3 3 3 3" fill="none" stroke="${ink}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`;
  return `<svg width="${w}" height="${n(len)}" viewBox="0 0 ${w} ${n(len)}" overflow="visible" aria-hidden="true"><g transform="translate(0 ${n(len)}) rotate(-90)">${g}`
    + [pad, len - pad].map(cx => `<circle cx="${n(cx)}" cy="${w - 3}" r="2.4" fill="${ink}"/>`).join('') + '</g></svg>';
}

/* ---- single tiles and effects for the key and the Why tag (marks.js:852-918) ---- */

/** A full-strength legend tile in an SVG of `size` px; 'empty' is its frame alone. `rail` adds a rail stub through it with
 *  its arrowhead in that direction; `tags`, the stamps at the top right. */
export function tile(kind: MarkKind | 'empty', size: number, o: { cond?: Style; rail?: Dir; tags?: readonly Ability['a'][] } = {}): string {
  const s = size, c = s / 2, [dx, dy] = DIR[o.rail ?? 'e'], L = Math.hypot(dx, dy), u: P = [dx / L, -dy / L];
  const at = (k: number): P => [c + u[0] * s * k, c + u[1] * s * k];
  const inner = (o.rail ? rail(at(-0.5), at(0.28), s) : '')
    + (kind === 'empty' ? toSvg(legendTile('move', 0, 0, s, { solid: true }).filter(sh => sh.k === 'rect' && !sh.fill)) : tileSvg(kind, 0, 0, s, { solid: true, cond: o.cond }))
    + (o.rail ? arrowHead(at(0.46), u, s * 0.8) : '') + (o.tags?.length ? stamps(o.tags, 0, 0, s) : '');
  return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" overflow="visible" aria-hidden="true">${inner}</svg>`;
}
/** The Why tag's sum (whySum, marks.js:909-919): the base, + the stamp of each rule, = the mark now; a caption under each part. */
export function whySum(w: NonNullable<Why['sum']>, T: number, I: number): string {
  const part = (svg: string, i: number): string => `<span class="part">${svg}<small>${esc(w.captions[i])}</small></span>`;
  return `<span class="why-sum">${part(tile(w.base, T, { rail: w.rail }), 0)}`
    + w.stamps.map((a, i) => `<span class="op">+</span>${part(`<span class="imp" style="height:${T}px">${impression(a, I)}</span>`, i + 1)}`).join('')
    + `<span class="op">=</span>${part(tile(w.result, T, { cond: w.cond, tags: w.tags }), w.stamps.length + 1)}</span>`;
}
/** The count ring: the number of parts that make the mark (grammar.css:178). */
export const countRing = (k: number): string => `<span class="count-ring" title="${k} part${k > 1 ? 's make' : ' makes'} this mark">${k}</span>`;
export function effect(kind: 'arch' | 'push' | 'swap' | 'threat' | 'tstop', s: number): string {
  const c = s / 2, head = Math.max(7, s * 0.125);
  const g = kind === 'arch' ? arch([s * 0.08, s * 0.85], [s * 0.92, s * 0.85], s * 0.9)
    : kind === 'threat' || kind === 'tstop' ? threat([s * 0.1, s * 0.9], [s * 0.9, s * 0.1], s, kind === 'tstop', 0)
    : kind === 'push' ? arrowLine([s * 0.12, c], [s * 0.92, c], C.push, 3, { head }) : arrowLine([s * 0.1, c], [s * 0.9, c], C.swap, 3, { both: true, head });
  return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" overflow="visible" aria-hidden="true">${g}</svg>`;
}

/* ---- the 7 × 7 reach diagram (diagram and chevronT, marks.js:425-439, :923-985) ---- */

/** A line's end on the diagram: a chevron with a small red target past its tip (it slides on and takes the first enemy). */
function chevron(tip: P, u: P, s: number): string {
  const L = Math.max(4, 0.26 * s), hw = Math.max(3, 0.2 * s), b = [tip[0] - u[0] * L, tip[1] - u[1] * L], tr = Math.max(2.6, 0.12 * s);
  const d = `M${n(b[0] - u[1] * hw)} ${n(b[1] + u[0] * hw)}L${n(tip[0])} ${n(tip[1])}L${n(b[0] + u[1] * hw)} ${n(b[1] - u[0] * hw)}`;
  const path = (stroke: string, w: number) => `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${n(w)}" stroke-linejoin="round" stroke-linecap="round"/>`;
  return path(LEG.navy, Math.max(3.5, 0.1 * s) + 2) + path(LEG.green, Math.max(2, 0.1 * s)) + toSvg(target(tip[0] + u[0] * tr * 1.55, tip[1] + u[1] * tr * 1.55, tr, { rw: Math.max(1.2, 0.045 * s) }));
}
/**
 * The reach diagram of a design on 7 × 7 squares of side s, forward up, the piece in the centre (the card face and the
 * ledge's reach popover). Its squares and lines; "steps 2" and "also moves like" add theirs as "only sometimes" (a dashed
 * frame, stitched rails; designPattern, binder-and-table.html:769-781); "passes over" adds a bridge on the first square of
 * each line. `cells`: the light and dark squares (the popover); else the page draws the grid (the card). The centre is the
 * icon of the body, or a gold-ringed disc for a token. A tile's group has data-xy and data-k, a rail's data-k="line" and data-dir; "only sometimes" adds data-cond.
 */
export function diagram(d: Pick<PieceDesign, 'squares' | 'lines' | 'rules' | 'look'>, o: { s: number; cells?: boolean }): string {
  const s = o.s, W = n(7 * s), cc = (x: number, y: number): P => [(x + 3) * s + s / 2, (3 - y) * s + s / 2], has = (a: Ability['a']) => d.rules.find(r => r.does.a === a)?.does;
  const like = has('movesLike') as Extract<Ability, { a: 'movesLike' }> | undefined, add = like ? likeSquares(like.as) : { squares: [], lines: [] };
  const extra = [...add.squares, ...(has('step2') ? [{ x: 0, y: 2, mark: 'move' as const }] : [])].filter(a => !d.squares.some(q => q.x === a.x && q.y === a.y));
  const cond = !d.lines.length && add.lines.length > 0, lines = cond ? add.lines : d.lines;
  const way = (l: Dir) => { const [dx, dy] = DIR[l], L = Math.hypot(dx, dy), e = cc(dx * 3, dy * 3); return { dx, dy, u: [dx / L, -dy / L] as P, tip: [e[0] + dx * s * 0.08, e[1] - dy * s * 0.08] as P }; };
  let g = '';
  if (o.cells) for (let r = 0; r < 7; r++) for (let f = 0; f < 7; f++) g += `<rect x="${n(f * s)}" y="${n(r * s)}" width="${n(s)}" height="${n(s)}" fill="${(f + r) % 2 ? C.dDark : C.dLight}"/>`;
  const c0 = cc(0, 0), k = 0.6 * Math.max(4, 0.26 * s);
  for (const l of lines) {
    const { dx, dy, u, tip } = way(l);
    g += `<g data-k="line" data-dir="${l}"${cond ? ' data-cond="1"' : ''}>${rail([c0[0] + dx * s * 0.42, c0[1] - dy * s * 0.42], [tip[0] - u[0] * k, tip[1] - u[1] * k], s, { style: cond ? 'awake' : undefined })}</g>`;
  }
  for (const [q, sometimes] of [...d.squares.map(q => [q, false] as const), ...extra.map(q => [q, true] as const)]) {
    g += `<g data-xy="${q.x},${q.y}" data-k="${KIND[q.mark]}"${sometimes ? ' data-cond="1"' : ''}>${tileSvg(KIND[q.mark], (q.x + 3) * s, (3 - q.y) * s, s, { solid: true, cond: sometimes ? 'awake' : undefined })}</g>`;
  }
  for (const l of lines) {
    const { dx, dy, u, tip } = way(l), c = cc(dx, dy), h = (dx && dy ? 0.3 : 0.32) * s;
    g += chevron(tip, u, s) + (!has('linesPass') ? '' : `<circle cx="${n(c[0])}" cy="${n(c[1])}" r="${n(Math.max(2, 0.09 * s))}" fill="${LEG.navy}" stroke="${LEG.halo}" stroke-width="1.2"/>`
      + arch([c[0] - u[0] * h, c[1] - u[1] * h], [c[0] + u[0] * h, c[1] + u[1] * h], s, { bulge: 0.24, left: true }));
  }
  const body = d.look.body, i = s * 0.84;
  g += body === 'token' ? `<circle cx="${n(c0[0])}" cy="${n(c0[1])}" r="${n(s * 0.3)}" fill="${LEG.ink}" stroke="${LEG.gold}" stroke-width="2"/>`
    : `<image href="${import.meta.env?.BASE_URL ?? './'}ui/icons/${BODY[body].name}.svg" x="${n(c0[0] - i / 2)}" y="${n(c0[1] - i / 2)}" width="${n(i)}" height="${n(i)}"/>`;
  return `<svg width="${W}" height="${W}" viewBox="0 0 ${W} ${W}" overflow="visible" role="img" aria-label="Reach diagram">${g}</svg>`;
}

/* ---- brush mode: the Mirror tool's icon and the line nubs (proving-ground.html:1227-1240, :1281-1286) ---- */

/** The Mirror tool's icon for "Paint on": both sides of the file (Mirror), all 8 (All 8), or one square (One). */
export function mirrorIcon(on: PaintOn): string {
  const sq = (x: number, y: number, w: number) => `<rect x="${x}" y="${y}" width="${w}" height="${w}" rx="${w > 7 ? 2 : 1.5}" fill="${LEG.green}" stroke="${LEG.navy}"/>`;
  const inner = on === 'lr' ? `<path d="M13 2v22" stroke="${C.goldI}" stroke-width="1.5"/>${sq(3, 9, 7)}${sq(16, 9, 7)}`
    : on === 'all' ? `${[[2, 2], [10, 2], [18, 2], [2, 10], [18, 10], [2, 18], [10, 18], [18, 18]].map(([x, y]) => sq(x, y, 6)).join('')}<circle cx="13" cy="13" r="2.5" fill="${LEG.ink}"/>`
    : sq(8, 8, 10);
  return `<svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">${inner}</svg>`;
}
/** A line nub: a green arrowhead that points along its line, dark green while the line is on. */
export function nub(on: boolean, deg: number): string {
  const fill = on ? LEG.green : LEG.hi, d = 'M-5 -7L5 0L-5 7z';
  return `<svg viewBox="-11 -11 22 22" aria-hidden="true"><g transform="rotate(${n(deg)})"><path d="${d}" fill="${fill}" stroke="${LEG.white}" stroke-width="4" stroke-linejoin="round"/>`
    + `<path d="${d}" fill="${fill}" stroke="${LEG.navy}" stroke-width="1.5" stroke-linejoin="round"/></g></svg>`;
}

/* ---- the board (marks.js:990-1175) ---- */

const FILES = 'abcdefgh';
/** The top-left corner of square `q` on a board of square side s. */
export const squareXY = (q: string, s: number): { x: number; y: number } => ({ x: FILES.indexOf(q[0]) * s, y: (8 - +q.slice(1)) * s });
export const viewBox = (s: number): string => `0 0 ${n(8 * s)} ${n(8 * s)}`;

/** A When's zone in chalk (ZONES and chalkMarkup, marks.js:605-647): hatched squares, one outline, and the When's picture on its top-left square. */
function chalk(z: Zone, side: 'w' | 'b', s: number): string {
  const ranks = (q: string) => (side === 'b' ? 9 - +q[1] : +q[1]);
  const set = new Set([...FILES].flatMap(f => [1, 2, 3, 4, 5, 6, 7, 8].map(r => f + r)).filter(q => (z === 'capital' ? /^[de][45]$/.test(q)
    : z === 'startRank' ? ranks(q) === 2 : z === 'lastRank' ? ranks(q) === 8 : z === 'ownHalf' ? ranks(q) <= 4 : ranks(q) >= 5)));
  let fills = '', edges = '';
  for (const q of set) {
    const { x, y } = squareXY(q, s), f = FILES.indexOf(q[0]), r = +q[1], i = 2;
    fills += `<rect x="${n(x)}" y="${n(y)}" width="${n(s)}" height="${n(s)}" fill="url(#kdm-hatch)"/>`;
    if (!set.has(FILES[f] + (r + 1))) edges += `M${n(x + i)} ${n(y + i)}H${n(x + s - i)}`;
    if (!set.has(FILES[f] + (r - 1))) edges += `M${n(x + i)} ${n(y + s - i)}H${n(x + s - i)}`;
    if (!set.has(FILES[f - 1] + r)) edges += `M${n(x + i)} ${n(y + i)}V${n(y + s - i)}`;
    if (!set.has(FILES[f + 1] + r)) edges += `M${n(x + s - i)} ${n(y + i)}V${n(y + s - i)}`;
  }
  const { x, y } = squareXY([...set].reduce((a, q) => (+q[1] > +a[1] || (q[1] === a[1] && q < a) ? q : a)), s);
  return `${fills}<path d="${edges}" fill="none" stroke="${C.chalkSh}" stroke-width="5" stroke-linecap="round" transform="translate(.6 .9)"/><path d="${edges}" fill="none" stroke="${C.chalk}" stroke-width="3" stroke-linecap="round"/>`
    + `<rect x="${n(x + 4)}" y="${n(y + 4)}" width="20" height="20" rx="4" fill="${LEG.white}" stroke="${C.goldI}"/><svg x="${n(x + 6)}" y="${n(y + 6)}" width="16" height="16" viewBox="0 0 24 24" color="${LEG.ink}">${pictoInner({ on: 'zone', zone: z })}</svg>`;
}

/**
 * The scene as SVG in four layers: the chalk of the isolated rule's zone, under (rails, marks, line ends, glows), the
 * pieces, and over (arches, take badges, swaps, pushes and the hover-only effects, stamps, the Why tag's square). The
 * board image is the field's background. `art` gives each piece's image. `focus` isolates (drawString's o.focus,
 * marks.js:1014-1020): each part whose `by` it keeps glows, and every other part is dim. `stamps` keeps the stamps of
 * some rules only (the phone). A hover-only part (its `on`) shows only when `hover` is its square (marks.js:1020);
 * `select` frames the square of the open Why tag (marks.js:1167-1170); `lift` draws the open piece raised and faint (Try with:
 * the player lifts it). An open threat glows red under its target (marks.js:1100). Only a mark's group has data-sq (with data-k,
 * data-cond, data-diff and data-on; a '-' mark has the class kdm-ghost); a rail, an arch and an effect have data-k,
 * data-from and data-to (a pip: data-at and data-n); a badge has data-badge, and the stamps of a square data-stamp and
 * data-a (the rules' abilities). A part that a preview adds (the scene's `pv`) has data-pv.
 */
export function drawString(scene: Scene, o: {
  s: number; art: (p: ScenePiece) => string; focus?: (by: readonly number[]) => boolean; stamps?: (by?: number) => boolean; hover?: string | null; select?: string | null; lift?: boolean;
}): string {
  const s = o.s, XY = (q: string) => squareXY(q, s), CTR = (q: string): P => { const { x, y } = XY(q); return [x + s / 2, y + s / 2]; };
  const shown = <T extends { on?: string }>(l: readonly T[]): T[] => l.filter(x => !x.on || x.on === o.hover);
  const open = scene.pieces.find(p => p.open), side = open?.side ?? 'w';
  const enemy = (q: string) => scene.pieces.some(p => p.sq === q && p.side !== side);
  const group = (attrs: Record<string, string | undefined>, svg: string, by?: readonly number[]) => {
    const cls = [o.focus && (by && o.focus(by) ? 'kdm-iso' : 'kdm-dim'), attrs.class].filter(Boolean).join(' ');
    return `<g${cls && ` class="${cls}"`}${Object.entries(attrs).filter(([k, v]) => v && k !== 'class').map(([k, v]) => ` data-${k}="${v}"`).join('')}>${svg}</g>`;
  };
  const zones = o.focus ? scene.chalk.filter(z => z.by && o.focus!(z.by)).map(z => `<g data-k="chalk" data-zone="${z.zone}">${chalk(z.zone, side, s)}</g>`).join('') : '';
  let under = '', ends = '', over = '';
  for (const rl of scene.rails) {
    const a = XY(rl.from), b = XY(rl.to), dx = Math.sign(b.x - a.x), dy = Math.sign(a.y - b.y);
    const u: P = [dx, -dy], L = Math.hypot(...u), uu: P = [u[0] / L, u[1] / L], diag = dx && dy, c0 = CTR(rl.from), c1 = CTR(rl.to);
    const p0: P = [c0[0] + u[0] * s * 0.42, c0[1] + u[1] * s * 0.42];
    let p1 = c1, end = '';
    if (rl.end === 'stop') { p1 = [c1[0] - u[0] * s * 0.5, c1[1] - u[1] * s * 0.5]; end = stopBar(p1, uu, s); }
    else if (rl.end === 'arrow') {
      const k = diag ? 0.4 : 0.44, tip: P = [c1[0] + u[0] * s * k, c1[1] + u[1] * s * k];
      p1 = [tip[0] - uu[0] * s * 0.16, tip[1] - uu[1] * s * 0.16];
      end = arrowHead(tip, uu, s, { style: rl.style, wash: true });
    } else if (rl.end === 'edge') p1 = [c1[0] + u[0] * s * (diag ? 0.4 : 0.44), c1[1] + u[1] * s * (diag ? 0.4 : 0.44)];
    under += group({ k: 'line', from: rl.from, to: rl.to, end: rl.end, pv: rl.pv && '1' }, rail(p0, p1, s, { style: rl.style, wash: true }), rl.by);
    if (end) ends += group({ k: 'line-end', to: rl.to }, end, rl.by);
  }
  for (const m of shown(scene.marks)) {
    const { x, y } = XY(m.sq), foe = enemy(m.sq) && m.diff !== '-', foot = y + 0.9 * s;
    // A refused take is the grey occupied take; a refused push or swap is a grey tile under the king.
    const svg = !foe || m.k === 'blocked-move' ? tileSvg(m.k, x, y, s, { cond: m.cond, diff: m.diff })
      : toSvg(m.k === 'blocked' ? grey(occupied('take', x, y, s, foot, { cond: m.cond }), C.bBar) : occupied(m.k, x, y, s, foot, { cond: m.cond })) + diffPip(x, y, s, m.diff);
    under += group({ sq: m.sq, k: m.k, cond: m.cond, diff: m.diff, on: m.on, pv: m.pv && '1', class: m.diff === '-' ? 'kdm-ghost' : undefined }, svg, m.by);
    if (foe && m.k !== 'blocked-move') over += group({ badge: m.sq }, m.k === 'blocked' ? refusedBadge(x, y, s) : toSvg(badge(x, y, s, m.k)), m.by);
  }
  under += ends;
  for (const q of new Set(scene.effects.flatMap(e => (e.k === 'threat' && !e.stopped ? [e.to] : [])))) {
    const { x, y } = XY(q);
    under += `<ellipse cx="${n(x + s / 2)}" cy="${n(y + s * 0.9)}" rx="${n(s * 0.4)}" ry="${n(s * 0.13)}" fill="url(#leg-glow-red)"/>`;
  }
  if (open) { const { x, y } = XY(open.sq); under += `<ellipse cx="${n(x + s / 2)}" cy="${n(y + s * 0.9)}" rx="${n(s * 0.36)}" ry="${n(s * 0.11)}" fill="url(#kdm-glow-gold)"/>`; }
  const pieces = scene.pieces.map(p => {
    const { x, y } = XY(p.sq), h = 0.9 * s, up = p.open && o.lift ? 0.12 * s : 0;
    return `<image href="${esc(o.art(p))}" x="${n(x + (s - h) / 2)}" y="${n(y + s - 0.075 * s - h - up)}" width="${n(h)}" height="${n(h)}" preserveAspectRatio="xMidYMax meet" filter="url(#kdm-rim)"${up ? ' opacity=".6"' : ''}/>`;
  }).join('');
  for (const ar of scene.arches) over += group({ k: 'arch', from: ar.from, over: ar.over, to: ar.to, pv: ar.pv && '1' }, arch(CTR(ar.from), CTR(ar.to), s), ar.by);
  const head = clamp(s * 0.125, 7, 10);
  // The effects (marks.js:1133-1160); a follow is a thin push arrow, a sight line a flat gold arc, a hop an ink arc.
  for (const e of shown(scene.effects)) {
    const svg = e.k === 'swap' ? arrowLine(CTR(e.a), CTR(e.b), C.swap, 3, { both: true, trim0: s * 0.12, trim1: s * 0.12, head })
      : e.k === 'pip' ? pip(XY(e.sq).x + s - 10, XY(e.sq).y + s - 10, 14, e.n)
      : e.k === 'push' ? arrowLine(CTR(e.from), CTR(e.to), C.push, 3, { trim0: s * 0.16, trim1: s * 0.18, head })
      : e.k === 'follow' ? arrowLine(CTR(e.from), CTR(e.to), C.push, 1.5, { trim0: s * 0.2, trim1: s * 0.24, head: clamp(s * 0.1, 6, 8) })
      : e.k === 'threat' ? threat(CTR(e.from), CTR(e.to), s, e.stopped)
      : arch(CTR(e.from), CTR(e.to), s, e.k === 'sight' ? { bulge: 0.2 } : { bulge: 0.25, ink: true });
    const ends = e.k === 'swap' ? { from: e.a, to: e.b } : e.k === 'pip' ? { at: e.sq, n: String(e.n) } : { from: e.from, to: e.to, stopped: e.k === 'threat' && e.stopped ? '1' : undefined };
    over += group({ k: e.k, ...ends, on: e.on, pv: e.pv && '1' }, svg, e.by);
  }
  for (const im of shown(scene.impressions)) {
    const list = im.list.filter(x => !o.stamps || o.stamps(x.by)), { x, y } = XY(im.sq);
    if (list.length) over += group({ stamp: im.sq, a: list.map(i => i.a).join(' '), on: im.on }, stamps(list.map(i => i.a), x, y, s), list.flatMap(i => i.by ?? []));
  }
  if (o.select) {
    const { x, y } = XY(o.select), frame = (i: number, stroke: string, w: number) =>
      `<rect x="${n(x + i)}" y="${n(y + i)}" width="${n(s - 2 * i)}" height="${n(s - 2 * i)}" rx="${n(0.07 * s)}" fill="none" stroke="${stroke}" stroke-width="${w}"/>`;
    over += `<g data-select="${o.select}">${frame(1, LEG.ink, 5)}${frame(1.5, LEG.gold, 3)}</g>`;
  }
  return `<g class="kdm-chalk">${zones}</g><g class="kdm-under">${under}</g><g class="kdm-pieces">${pieces}</g><g class="kdm-over">${over}</g>`;
}
