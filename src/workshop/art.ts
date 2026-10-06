/**
 * The Workshop's art as SVG and HTML strings (docs/WORKSHOP.md §5.1, §5.2, §5.4): the floor with
 * the design's marks, the plinth with its letter and cracks, the figure, the gauge and the still
 * pattern picture. No new art files: the figures are the UI crops, the rest is drawn here. An SVG
 * holds no text, every gradient id is unique, and the decoration is aria-hidden.
 */
import { DIR, type Dir, type PieceDesign } from './model';
import { type StageLook } from './look';
import { halves } from './text';
import { BAND_WORD, presetWorths, type Verdict } from './judge';

let uid = 0;
const id = (s: string): string => `ws-${s}-${++uid}`;
const BASE = import.meta.env?.BASE_URL ?? './';
const NAME: Record<string, string> = { P: 'pawn', N: 'knight', B: 'bishop', R: 'rook', Q: 'queen', A: 'archer', L: 'paladin', G: 'guard', M: 'maester', S: 'beast', O: 'ogre' };
/** The UI crop of a body, or of the plain king for 'K'. */
export const cropOf = (body: string, army: 0 | 1 = 0): string =>
  body === 'K' ? `${BASE}ui/kings/spirit${army ? '-b' : ''}.webp` : `${BASE}ui/pieces/${NAME[body]}-${army ? 'b' : 'w'}.webp`;
export const MOVE = '#e9b44c', TAKE = '#b3261e', SWAP = '#7d5ba6', SHOVE = '#2f7f75';

/* ---- the floor: a 7 × 7 patch, tilted by CSS ---- */

const C = 10; // one cell
const at = (x: number, y: number): [number, number] => [35 + x * C, 35 - y * C];
const gem = (cx: number, cy: number, fill: string, cls = ''): string =>
  `<path${cls ? ` class="${cls}"` : ''} d="M${cx} ${cy - 3.4}l3 3.4-3 3.4-3-3.4z" fill="url(#${fill})" stroke="#9a6418" stroke-width=".4"/>`;
const ring = (cx: number, cy: number, dashed: boolean, cls = ''): string =>
  `<circle${cls ? ` class="${cls}"` : ''} cx="${cx}" cy="${cy}" r="4.1" fill="none" stroke="${TAKE}" stroke-width="1.2"${dashed ? ' stroke-dasharray="1.6 1.2"' : ''}/>`;

/** The floor under the figure: the design's squares, its lines (3 gems and a chevron that says "goes on"), and the props. */
export function floorSvg(l: StageLook): string {
  const g = id('gem');
  let cells = '';
  for (let x = -3; x <= 3; x++) for (let y = -3; y <= 3; y++) {
    const [cx, cy] = at(x, y), rim = Math.max(Math.abs(x), Math.abs(y)) === 3;
    cells += `<rect x="${cx - 5}" y="${cy - 5}" width="10" height="10" fill="${(x + y) & 1 ? '#5b5045' : '#6c6257'}"${rim ? ' opacity=".85"' : ''}/>`;
  }
  let marks = '';
  const lineMarks = (dirs: readonly Dir[], cls: string) => {
    for (const d of dirs) {
      const [dx, dy] = DIR[d];
      for (let i = 1; i <= 3; i++) { const [cx, cy] = at(dx * i, dy * i); marks += gem(cx, cy, g, cls); }
      const [ex, ey] = at(dx * 3.45, dy * 3.45), a = Math.atan2(-dy, dx) * 180 / Math.PI;
      marks += `<path class="chev${cls ? ` ${cls}` : ''}" d="M-1.6 -2.4L1.4 0-1.6 2.4" fill="none" stroke="${MOVE}" stroke-width="1" opacity=".7" transform="translate(${ex} ${ey}) rotate(${a})"/>`;
    }
  };
  lineMarks(l.lines, '');
  lineMarks(l.ghostLines, 'h');
  for (const m of l.marks) {
    const [cx, cy] = at(m.x, m.y), cls = m.hatched ? 'h' : '';
    if (m.mark === 'both' || m.mark === 'move' || m.mark === 'moveShoot') marks += gem(cx, cy, g, cls);
    if (m.mark === 'both' || m.mark === 'take') marks += ring(cx, cy, false, cls);
    if (m.mark === 'shoot' || m.mark === 'moveShoot') marks += ring(cx, cy, true, cls) + `<path d="M35 35L${cx} ${cy}" stroke="${TAKE}" stroke-width=".35" opacity=".5"/>`;
  }
  let props = '';
  if (l.footprints) props += '<g fill="#fff4cf" opacity=".8"><ellipse cx="33.6" cy="24.5" rx="1" ry="1.6"/><ellipse cx="36.4" cy="23.5" rx="1" ry="1.6"/><ellipse cx="33.6" cy="14.5" rx="1" ry="1.6"/><ellipse cx="36.4" cy="13.5" rx="1" ry="1.6"/></g>';
  if (l.passOver) {
    const d = l.lines.includes('n') ? 'n' : l.lines[0] ?? 'n', [dx, dy] = DIR[d], [px, py] = at(dx, dy), [qx, qy] = at(dx * 2, dy * 2);
    props += `<path d="M${px - 2} ${py + 3}a2 2 0 1 1 4 0z" fill="${l.passOver === 'own' ? '#f3ead7' : '#2b2621'}" stroke="#4d453c" stroke-width=".4"/>`
      + `<path d="M35 33Q${(35 + qx) / 2 + dy * 4} ${(33 + qy) / 2 - 5} ${qx} ${qy}" fill="none" stroke="${MOVE}" stroke-width=".8" stroke-dasharray="1.4 1"/>`;
  }
  if (l.chain) props += `<path d="M42 30L48 22" stroke="${TAKE}" stroke-width=".8" stroke-dasharray="1.2 1"/>${ring(48, 22, false)}`;
  if (l.push) for (const d of ['n', 'e', 's', 'w'] as Dir[]) {
    const [dx, dy] = DIR[d], [cx, cy] = at(dx, dy), a = Math.atan2(-dy, dx) * 180 / Math.PI;
    props += `<path d="M-1.4 -2.2L1.4 0-1.4 2.2" fill="none" stroke="${SHOVE}" stroke-width="1.3" transform="translate(${cx + dx * 2} ${cy - dy * 2}) rotate(${a})"/>`;
  }
  if (l.push === 'stay') props += `<path d="M35 39v4M32.5 41.5q2.5 2 5 0" fill="none" stroke="${SHOVE}" stroke-width="1"/>`;
  if (l.swap) for (const d of ['ne', 'nw', 'se', 'sw'] as Dir[]) {
    const [dx, dy] = DIR[d], a = Math.atan2(-dy, dx) * 180 / Math.PI;
    props += `<path d="M2 -1.2h4l-1.2-1M6 1.2H2l1.2 1" fill="none" stroke="${SWAP}" stroke-width=".8" transform="translate(35 35) rotate(${a})"/>`;
  }
  return `<svg class="ws-floor-svg" viewBox="0 0 70 70" aria-hidden="true" focusable="false"><defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1">`
    + `<stop offset="0" stop-color="#fff4cf"/><stop offset=".5" stop-color="#f0bf52"/><stop offset="1" stop-color="#9a6418"/></linearGradient></defs>`
    + `${cells}<rect x="30" y="30" width="10" height="10" fill="none" stroke="#e9c071" stroke-width=".8"/>${marks}${props}</svg>`;
}

/** The capital (d4 e4 d5 e5) or another zone on a small map of the board. */
export function zoneSvg(zone: StageLook['zone']): string {
  if (!zone) return '';
  let cells = '';
  for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) {
    const lit = zone === 'capital' ? (f === 3 || f === 4) && (r === 3 || r === 4) : zone === 'ownHalf' ? r < 4 : zone === 'enemyHalf' ? r >= 4 : zone === 'startRank' ? r === 1 : r === 7;
    cells += `<rect x="${f * 8}" y="${(7 - r) * 8}" width="8" height="8" fill="${lit ? '#e9c071' : (f + r) & 1 ? '#5b5045' : '#6c6257'}"/>`;
  }
  return `<svg class="ws-zone" viewBox="0 0 64 64" aria-hidden="true" focusable="false">${cells}</svg>`;
}

/* ---- cracks, the plinth ---- */

/** Cracks in the plinth's band, clear of the letter in the middle: a dark split with an ember seam inside;
 *  the seam is dashed for an untested shape. A hairline is one thin split. */
export function cracksSvg(kind: StageLook['cracks']): string {
  if (kind === 'none') return '';
  // Each crack runs down from the top edge and splits once; the strokes keep their width at every model size.
  const left = 'M13 0l2.5 7-2 5 2.5 6-1 6M15 12l5 4', right = 'M87 0l-2 6 2.5 6-3 6 1 6M85 6l-5 3';
  const paths = kind === 'hairline' ? [left.split('M').slice(0, 2).join('M')] : [left, right, ...(kind === 'wide' ? ['M27 0l-2 9 3 15', 'M73 0l2 10-3 14'] : [])];
  const seam = kind === 'hairline' ? '' : kind === 'wide' ? '#ff4a2a' : '#ff8a1c';
  const line = (d: string, color: string, w: number, extra = ''): string =>
    `<path pathLength="1" d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"${extra}/>`;
  return `<svg class="ws-cracks ws-cracks-${kind}" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true" focusable="false">`
    + paths.map(d => line(d, '#3a2410', kind === 'hairline' ? 1 : 2.2) + (seam ? line(d, seam, 0.9, kind === 'dashed' ? ' class="seam" stroke-dasharray=".08 .06"' : ' class="seam"') : '')).join('') + '</svg>';
}

/** The figure: the body's crop, or the lettered token disc. */
export const figureHtml = (l: Pick<StageLook, 'body' | 'army' | 'letter'>, cls = 'ws-fig'): string =>
  l.body === 'token' ? `<span class="${cls} ws-token pc-medallion">${l.letter || 'D'}</span>`
    : `<img class="${cls}" src="${cropOf(l.body, l.army)}" alt="" decoding="async" />`;

/** The whole model, back to front (§5.1). The caller wraps it in an aria-hidden stage. */
export function modelHtml(l: StageLook): string {
  const crop = l.body === 'token' ? '' : cropOf(l.body, l.army);
  return `<div class="ws-model${l.dim ? ' dim' : ''}${l.glow ? ' glow' : ''}" style="--rim:${l.rim};--fig-scale:${l.scale}">`
    + `<div class="ws-floor">${floorSvg(l)}</div>${zoneSvg(l.zone)}`
    + (l.partner ? `<span class="ws-partner">${l.partner === 'king' ? `<img src="${cropOf('K')}" alt="" />` : l.partner.length === 1 ? `<img src="${cropOf(l.partner)}" alt="" />` : ''}</span>` : '')
    + (l.ghost ? `<img class="ws-ghost" src="${cropOf(l.ghost, l.army)}" alt="" />` : '')
    + (l.hourglass ? '<svg class="ws-hourglass" viewBox="0 0 16 22" aria-hidden="true" focusable="false"><path d="M3 2h10M3 20h10M4 2c0 6 8 6 8 11v7M12 2c0 6-8 6-8 11v7" fill="none" stroke="#e9c071" stroke-width="1.4"/></svg>' : '')
    + (l.cardBack ? '<svg class="ws-cardback" viewBox="0 0 20 28" aria-hidden="true" focusable="false"><rect x="1" y="1" width="18" height="26" rx="2" fill="#5a1c14" stroke="#e9c071"/><path d="M10 7l3 7-3 7-3-7z" fill="#e9c071"/></svg>' : '')
    + (crop ? `<div class="ws-rim" style="-webkit-mask-image:url(${crop});mask-image:url(${crop})"></div>` : '<div class="ws-rim ws-rim-disc"></div>')
    + (l.afterImage && crop ? `<img class="ws-after" src="${crop}" alt="" />` : '')
    + figureHtml(l)
    + (l.shield ? `<span class="ws-shield ws-shield-${l.shield}"></span>` : '')
    + `<div class="ws-plinth m-${l.metal}">${cracksSvg(l.cracks)}<span class="ws-letter">${l.letter}</span></div>`
    + '</div>';
}

/* ---- the gauge (§2.4 W3): 0–10 pawns, the fair band shaded, a gem in a soft pill as wide as the band ---- */

export function gaugeHtml(v: Verdict, landmarks: boolean): string {
  const pc = (w: number): number => +(Math.min(10, Math.max(0, w)) * 10).toFixed(1), out = v.label !== 'fair' && v.label !== 'untestedOP' ? ' out' : '';
  const pw = presetWorths(), marks = landmarks ? (['pawn', 'knight', 'rook', 'queen'] as const).map((k, i) =>
    `<span class="g-mark" aria-hidden="true" style="left:${pc(pw[k])}%">${'PNRQ'[i]}</span>`).join('') : '';
  const words = `about ${halves(v.worth.point)} pawns, ${BAND_WORD[v.label].toLowerCase()}`;
  return `<div class="ws-gauge${out}" role="meter" aria-label="Worth" aria-valuemin="0" aria-valuemax="10" aria-valuenow="${Math.min(10, +v.worth.point.toFixed(1))}" aria-valuetext="${words}">`
    + `<span class="g-track"><span class="g-band" style="left:25%;width:25%"></span>`
    + `<span class="g-fuzz" style="left:${pc(v.worth.lo)}%;width:${(pc(v.worth.hi) - pc(v.worth.lo)).toFixed(1)}%"></span>`
    + `<span class="g-gem" style="left:${pc(v.worth.point)}%"></span></span>${marks}<span class="g-end" aria-hidden="true">10+</span></div>`;
}

/* ---- the still pattern picture (SAVED, the shelf) ---- */

export function patternSvg(d: Pick<PieceDesign, 'squares' | 'lines'>): string {
  const g = id('pg');
  let cells = '', marks = '';
  for (let x = -3; x <= 3; x++) for (let y = -3; y <= 3; y++) {
    const [cx, cy] = at(x, y);
    cells += `<rect x="${cx - 5}" y="${cy - 5}" width="10" height="10" fill="${(x + y) & 1 ? '#d8cfbd' : '#ebe6da'}" stroke="#c9bfac" stroke-width=".3"/>`;
  }
  for (const l of d.lines) {
    const [dx, dy] = DIR[l], [ex, ey] = at(dx * 3.4, dy * 3.4);
    marks += `<path d="M35 35L${ex} ${ey}" stroke="${MOVE}" stroke-width="2.4" stroke-linecap="round" opacity=".85"/>`;
  }
  for (const s of d.squares) {
    const [cx, cy] = at(s.x, s.y);
    if (s.mark !== 'take' && s.mark !== 'shoot') marks += gem(cx, cy, g);
    if (s.mark === 'both' || s.mark === 'take') marks += ring(cx, cy, false);
    if (s.mark === 'shoot' || s.mark === 'moveShoot') marks += ring(cx, cy, true);
  }
  return `<svg class="ws-pattern" viewBox="0 0 70 70" aria-hidden="true" focusable="false"><defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1">`
    + `<stop offset="0" stop-color="#fff4cf"/><stop offset=".5" stop-color="#f0bf52"/><stop offset="1" stop-color="#9a6418"/></linearGradient></defs>`
    + `${cells}<circle cx="35" cy="35" r="3.6" fill="#4d453c"/>${marks}</svg>`;
}
