/**
 * The Proving Ground's marks: the part of the approved mockup's mark module
 * (docs/research/rules-ui-2026-10-10/mockups/shared/marks.js, its line numbers in the comments) that ticket 01
 * draws. The tiles, targets, shots, occupied takes and badges come from src/render/legend.ts; the blocks and
 * When words from vocab.ts. The mockup's looks `wash` and `familyWax` are always on. Later tickets port the rest.
 */
import { DEFS as LEG_DEFS, LEG, badge, occupied, tile as legendTile, toSvg, type Kind, type Shape } from '../render/legend';
import type { Ability, PaintOn, When } from './model';
import type { Scene, ScenePiece } from './scene';
import { esc } from './text';
import { blockOf, whenWords, type Group } from './vocab';

/** The colours that the legend does not hold (marks.js:73-86). */
const C = { goldI: '#7a5712', push: '#2f7f75', swap: '#7a58c0' };

/** 24 × 24 stroked sigils (marks.js:88-124): the 10 blocks with the G11 replacements, and the extras in use. */
const SIGILS: Record<Ability['a'] | 'quill' | 'moon' | 'near' | 'card' | 'lock' | 'lockOpen' | 'eraser' | 'scale', string> = {
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
};

/** The hover names (marks.js:145-151): the square labels and the key. */
export const NAMES = {
  move: 'Move', take: 'Take only', both: 'Move or take', shot: 'Shot: takes from here', moveshot: 'Move or shot',
  line: 'Line', arch: 'Passes over', cond: 'Only sometimes', asleep: 'Asleep here', push: 'Pushes', swap: 'Swaps',
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
  + '<filter id="kdm-seal-shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="2.5" stdDeviation="2.2" flood-color="#1d1915" flood-opacity=".42"/></filter>';

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
/** "Passes over": a dashed gold-ink arc with an arrowhead, bulging up (marks.js:441-464, the gold look). */
function arch(p0: P, p1: P, s: number): string {
  const mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2, vx = p1[0] - p0[0], vy = p1[1] - p0[1], L = Math.hypot(vx, vy) || 1;
  let nx = -vy / L, ny = vx / L;
  if (Math.abs(vx) < 1e-6) { if (nx < 0) { nx = -nx; ny = -ny; } } else if (ny > 0) { nx = -nx; ny = -ny; }
  const c = [mx + nx * 0.9 * s, my + ny * 0.9 * s], d = `M${n(p0[0])} ${n(p0[1])}Q${n(c[0])} ${n(c[1])} ${n(p1[0])} ${n(p1[1])}`;
  const sw = s >= 40 ? 2.5 : 1.8;
  let g = `<g filter="url(#kdm-arc-shadow)"><path d="${d}" fill="none" stroke="${LEG.gold}" stroke-width="${n(sw + 2.5)}" stroke-linecap="round" stroke-opacity=".75"/>`
    + `<path d="${d}" fill="none" stroke="${C.goldI}" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="6 4"/></g>`;
  if (s >= 24) {
    const ul = Math.hypot(p1[0] - c[0], p1[1] - c[1]), hl = Math.max(5, 0.12 * s);
    g += `<path d="${tri(p1, [(p1[0] - c[0]) / ul, (p1[1] - c[1]) / ul], hl, hl * 0.6)}" fill="${C.goldI}" stroke="${LEG.gold}" stroke-width="1"/>`;
  }
  return g;
}

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
/** A legend tile as SVG; an asleep tile gets the moon pip in its lower right corner (marks.js:337). The paint diff
 *  (marks.js:310, :340): '+' adds the quill pip in the lower left corner; '-' draws the dashed outline only. */
function tileSvg(kind: Kind, x: number, y: number, s: number, o: { solid?: boolean; cond?: Style; diff?: '+' | '-' } = {}): string {
  const shapes = legendTile(kind, x, y, s, { ...o, cond: o.diff === '-' ? 'awake' : o.cond }), f = shapes.find(sh => sh.dash) as Extract<Shape, { k: 'rect' }> | undefined;
  if (o.diff === '-' && f) return toSvg([{ ...f, stroke: LEG.halo, lw: (f.lw ?? 1) + 2, a: 0.6, dash: undefined }, { ...f, a: 0.6 }]);
  return toSvg(shapes) + (o.cond === 'asleep' && f && s >= 24 ? moonPip(f.x + f.w - 0.13 * s, f.y + f.h - 0.13 * s, clamp(0.2 * s, 10, 16)) : '') + diffPip(kind, x, y, s, o.diff);
}
/** The quill pip of a '+' mark, in the lower left corner of its tile. */
function diffPip(kind: Kind, x: number, y: number, s: number, diff?: '+' | '-'): string {
  const f = legendTile(kind, x, y, s).find(sh => sh.k === 'rect') as Extract<Shape, { k: 'rect' }>;
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
export function chip(w: When, o: { hollow?: boolean; words?: string } = {}): string {
  if (w.on === 'always') return '';
  const cls = w.on === 'takes' || w.on === 'firstTake' || w.on === 'reaches' ? 'flag' : 'plate';
  return `<span class="${cls}${o.hollow ? ' is-hollow' : ''}"><span>${picto(w)}${esc(o.words ?? whenWords(w))}</span></span>`;
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
export const tagYours = (): string => `<span class="tag-yours">${sigil('quill', 13)}Yours</span>`;

/* ---- single tiles and effects for the key (marks.js:852-918) ---- */

/** A full-strength legend tile in an SVG of `size` px; `rail` adds a rail stub to the right with its arrowhead. */
export function tile(kind: Kind, size: number, o: { cond?: Style; rail?: boolean } = {}): string {
  const s = size, c = s / 2;
  const inner = (o.rail ? rail([0, c], [c + s * 0.28, c], s) : '') + tileSvg(kind, 0, 0, s, { solid: true, cond: o.cond })
    + (o.rail ? arrowHead([c + s * 0.46, c], [1, 0], s * 0.8) : '');
  return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" overflow="visible" aria-hidden="true">${inner}</svg>`;
}
export function effect(kind: 'arch' | 'push' | 'swap', s: number): string {
  const c = s / 2, head = Math.max(7, s * 0.125);
  const g = kind === 'arch' ? arch([s * 0.08, s * 0.85], [s * 0.92, s * 0.85], s * 0.9)
    : kind === 'push' ? arrowLine([s * 0.12, c], [s * 0.92, c], C.push, 3, { head }) : arrowLine([s * 0.1, c], [s * 0.9, c], C.swap, 3, { both: true, head });
  return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" overflow="visible" aria-hidden="true">${g}</svg>`;
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

/**
 * The scene as SVG in three layers: under (rails, marks, line ends, glows), the pieces, and over (arches, take
 * badges, swaps and pushes). The board image is the field's background. `art` gives each piece's image. Only a
 * mark's group has data-sq (with data-k, data-cond and data-diff; a '-' mark has the class kdm-ghost); a rail, an arch and an effect have data-k, data-from and data-to.
 */
export function drawString(scene: Scene, o: { s: number; art: (p: ScenePiece) => string }): string {
  const s = o.s, XY = (q: string) => squareXY(q, s), CTR = (q: string): P => { const { x, y } = XY(q); return [x + s / 2, y + s / 2]; };
  const open = scene.pieces.find(p => p.open), side = open?.side ?? 'w';
  const enemy = (q: string) => scene.pieces.some(p => p.sq === q && p.side !== side);
  const group = (attrs: Record<string, string | undefined>, svg: string) =>
    `<g${Object.entries(attrs).filter(([, v]) => v).map(([k, v]) => (k === 'class' ? ` class="${v}"` : ` data-${k}="${v}"`)).join('')}>${svg}</g>`;
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
    }
    under += group({ k: 'line', from: rl.from, to: rl.to, end: rl.end }, rail(p0, p1, s, { style: rl.style, wash: true }));
    if (end) ends += group({ k: 'line-end', to: rl.to }, end);
  }
  for (const m of scene.marks) {
    const { x, y } = XY(m.sq), ring = enemy(m.sq) && m.diff !== '-';
    const svg = ring ? toSvg(occupied(m.k, x, y, s, y + 0.9 * s, { cond: m.cond })) + diffPip(m.k, x, y, s, m.diff) : tileSvg(m.k, x, y, s, { cond: m.cond, diff: m.diff });
    under += group({ sq: m.sq, k: m.k, cond: m.cond, diff: m.diff, class: m.diff === '-' ? 'kdm-ghost' : undefined }, svg);
    if (ring) over += group({ badge: m.sq }, toSvg(badge(x, y, s, m.k)));
  }
  under += ends;
  if (open) { const { x, y } = XY(open.sq); under += `<ellipse cx="${n(x + s / 2)}" cy="${n(y + s * 0.9)}" rx="${n(s * 0.36)}" ry="${n(s * 0.11)}" fill="url(#kdm-glow-gold)"/>`; }
  const pieces = scene.pieces.map(p => {
    const { x, y } = XY(p.sq), h = 0.9 * s;
    return `<image href="${esc(o.art(p))}" x="${n(x + (s - h) / 2)}" y="${n(y + s - 0.075 * s - h)}" width="${n(h)}" height="${n(h)}" preserveAspectRatio="xMidYMax meet" filter="url(#kdm-rim)"/>`;
  }).join('');
  for (const ar of scene.arches) over += group({ k: 'arch', from: ar.from, over: ar.over, to: ar.to }, arch(CTR(ar.from), CTR(ar.to), s));
  const head = clamp(s * 0.125, 7, 10);
  for (const e of scene.effects) {
    over += e.k === 'push'
      ? group({ k: 'push', from: e.from, to: e.to }, arrowLine(CTR(e.from), CTR(e.to), C.push, 3, { trim0: s * 0.16, trim1: s * 0.18, head }))
      : group({ k: 'swap', from: e.a, to: e.b }, arrowLine(CTR(e.a), CTR(e.b), C.swap, 3, { both: true, trim0: s * 0.12, trim1: s * 0.12, head }));
  }
  return `<g class="kdm-under">${under}</g><g class="kdm-pieces">${pieces}</g><g class="kdm-over">${over}</g>`;
}
