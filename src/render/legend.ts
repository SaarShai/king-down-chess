/**
 * The move legend (docs/specs/move-legend): the owner's mark language for the game and the Workshop.
 * - A green tile: the piece can move there.
 * - A white tile with a red target: it can take there only.
 * - A green tile with a red target: it can move or take there.
 * - A red target with an arrow: a shot (it takes from where it stands).
 * A take on an enemy figure is the "occupied take": a thin red edge, a ring and a glow under the feet, and the
 * badge (a small white tile with the target) at the square's top-left.
 *
 * Ported from docs/research/rules-ui-2026-10-10/mockups/shared/marks.js in its "wash" look (the marks.js line
 * numbers are in the comments). Each function returns plain shapes; toSvg() and paint() draw them, so the SVG
 * (the Proving Ground) and the canvas (the painted board, the clay textures) show one drawing.
 * Units: x, y, s and R are drawing units; o.px is the drawing units of one CSS pixel. Every width and each
 * threshold (16 and 48 px) is in CSS pixels.
 */

/** The legend colours (marks.js:73-86; the tokens --leg-* in src/style.css). */
export const LEG = {
  green: '#7cb342', hi: '#9ccc65', lo: '#6a9a36', navy: '#1c2e5c', red: '#d63428', white: '#fbf7ee',
  halo: 'rgba(251,247,238,.92)', ink: '#2b2621', power: '#2f5ea8', powerMid: '#7fb2ff', gold: '#e9c071',
};
/** Target sizes as a share of the tile side: the take radius; the shot radius and its shift up-right (marks.js:163). */
export const TR = 0.32, SR = 0.27, SO = 0.07;

export type Kind = 'move' | 'take' | 'both' | 'shot' | 'moveshot';
/**
 * px: drawing units for one CSS pixel (default 1); power: a king's power (two blue frames); hover: the gold-bright edge.
 * solid: the key's full-strength tile (the Workshop brushes and key row); cond: the Workshop's "only sometimes" (a
 * dashed frame; asleep is pale too).
 */
export interface Opts { px?: number; power?: boolean; hover?: boolean; solid?: boolean; cond?: 'asleep' | 'awake' }
interface TargetOpts extends Opts { color?: string; halo?: string | null; rw?: number; len?: number }

/** fill: a colour, 'green' (the tile gradient, marks.js:168) or 'glow-red' (the radial glow, marks.js:178). a: opacity. dash: the stroke's dash and gap. */
interface Ink { fill?: string; stroke?: string; lw?: number; a?: number; dash?: number[] }
export type Shape = Ink & (
  | { k: 'rect'; x: number; y: number; w: number; h: number; r: number }
  | { k: 'circle'; x: number; y: number; r: number }
  | { k: 'ellipse'; x: number; y: number; rx: number; ry: number }
  | { k: 'line'; pts: number[] });

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const shoots = (kind: Kind) => kind === 'shot' || kind === 'moveshot';

/** The kind of a marked square of the game (src/render/renderer.ts Highlights): a square in moves and captures is both. */
export const kindOf = (sq: number, h: { moves?: number[]; captures?: number[]; shots?: number[] }): Kind =>
  !h.captures?.includes(sq) ? 'move' : h.moves?.includes(sq) ? h.shots?.includes(sq) ? 'moveshot' : 'both' : h.shots?.includes(sq) ? 'shot' : 'take';

/** The take target (targetMark, marks.js:204-219): a red ring and dot, a middle ring from R = 16 px, a thin halo. */
export function target(cx: number, cy: number, R: number, o: TargetOpts = {}): Shape[] {
  const p = o.px ?? 1, col = o.color ?? LEG.red, halo = o.halo === undefined ? LEG.white : o.halo;
  const rw = o.rw ?? Math.max(1.2 * p, 0.2 * R), mid = R >= 16 * p;
  const mr = 0.6 * R, mw = rw * 0.72, dr = Math.max(p, (mid ? 0.25 : 0.36) * R);
  const ring = (r: number, stroke: string, lw: number): Shape => ({ k: 'circle', x: cx, y: cy, r, stroke, lw });
  const out: Shape[] = [];
  if (halo) {
    out.push(ring(R, halo, rw + 2 * p));
    if (mid) out.push(ring(mr, halo, mw + 2 * p));
    out.push({ k: 'circle', x: cx, y: cy, r: dr + p, fill: halo });
  }
  out.push(ring(R, col, rw));
  if (mid) out.push(ring(mr, col, mw));
  return [...out, { k: 'circle', x: cx, y: cy, r: dr, fill: col }];
}

/** The shot (shotMark, marks.js:220-241): the target, pierced by an ink arrow from the lower left, with two fletching chevrons. */
export function shot(cx: number, cy: number, R: number, o: TargetOpts = {}): Shape[] {
  const p = o.px ?? 1, halo = o.halo === undefined ? LEG.white : o.halo, u = Math.SQRT1_2;
  const sw = Math.max(1.5 * p, 0.18 * R), L = (o.len ?? 1.75) * R, d = 2 * u * 0.7 * Math.max(2.2 * p, 0.36 * R), fw = Math.max(1.2 * p, sw * 0.8);
  const shaft = [cx - u * L, cy + u * L, cx + u * 0.08 * R, cy - u * 0.08 * R];
  // Each chevron: one arm along the shaft's lower side, the corner on the shaft, one arm to the left.
  const chevrons = [0.8, 1].map(k => { const x = cx - u * L * k, y = cy + u * L * k; return [x, y + d, x, y, x - d, y]; });
  const lines = (stroke: string, more: number): Shape[] =>
    [{ k: 'line', pts: shaft, stroke, lw: sw + more }, ...chevrons.map((pts): Shape => ({ k: 'line', pts, stroke, lw: fw + more }))];
  return [...target(cx, cy, R, o), ...(halo ? lines(halo, 2 * p) : []), ...lines(LEG.ink, 0)];
}

/** The two blue frames of a king's power round a box (marks.js:314-317). */
function power(x: number, y: number, t: number, r: number, p: number): Shape[] {
  const d = Math.max(1.5 * p, 0.045 * t) + 2 * p;
  const frame = (stroke: string, lw: number): Shape => ({ k: 'rect', x: x - d, y: y - d, w: t + 2 * d, h: t + 2 * d, r: r + d, stroke, lw });
  return [frame(LEG.power, 3 * p), frame(LEG.powerMid, 1.5 * p)];
}

/** The frame width of a tile on a square of s CSS px (fw, marks.js:146). */
const fw = (s: number) => (s < 24 ? 1 : s < 40 ? 1.5 : 2);
/** The dash of a frame that holds only sometimes (marks.js:313). */
const condDash = (s: number, p: number) => (s < 40 * p ? [3 * p, 2 * p] : [4 * p, 3 * p]);

/**
 * One legend tile on the square (x, y) of side s (tileWash, marks.js:300-342, :380-383). On the board, the wash:
 * 0.67 s, centred, a 60% green. o.solid: the key's tile, 0.8 s, full strength, with a bevel. o.cond: a dashed frame;
 * asleep is a pale green too (marks.js:325-326). The Workshop draws the asleep moon pip over it.
 */
export function tile(kind: Kind, x: number, y: number, s: number, o: Opts = {}): Shape[] {
  const p = o.px ?? 1, solid = !!o.solid, asleep = o.cond === 'asleep', t = (solid ? 0.8 : 0.67) * s, x0 = x + (s - t) / 2, y0 = y + (s - t) / 2;
  const cx = x0 + t / 2, cy = y0 + t / 2, r = Math.max(3 * p, 0.06 * s), w = (solid ? fw(s / p) : 1.5) * p;
  const green = kind === 'move' || kind === 'both' || kind === 'moveshot';
  const box = (ink: Ink): Shape => ({ k: 'rect', x: x0, y: y0, w: t, h: t, r, ...ink });
  const halo = solid ? LEG.white : 'rgba(251,247,238,.8)', b = w / 2 + 0.75 * p;
  const bevel = (ly: number, stroke: string): Shape => ({ k: 'line', pts: [x0 + r, ly, x0 + t - r, ly], stroke, lw: p });
  return [
    ...(o.power ? power(x0, y0, t, r, p) : []),
    box({ stroke: LEG.halo, lw: w + (solid ? 3 : 1.5) * p, a: solid ? (asleep ? 0.6 : undefined) : 0.55 }),
    box({ fill: asleep ? LEG.hi : green ? 'green' : LEG.white, a: asleep ? (solid ? 0.45 : 0.32) : solid ? undefined : green ? 0.6 : 0.94 }),
    // The laid-tile bevel of the key's tile: a light top edge and a dark bottom edge (marks.js:327-331).
    ...(solid && !asleep ? [bevel(y0 + b, 'rgba(255,255,255,.35)'), bevel(y0 + t - b, 'rgba(28,46,92,.25)')] : []),
    box(o.hover ? { stroke: LEG.gold, lw: 2.5 * p }
      : { stroke: LEG.navy, lw: w, a: solid ? (asleep ? 0.6 : undefined) : 0.7, dash: o.cond ? condDash(s, p) : undefined }),
    ...(kind === 'take' || kind === 'both' ? target(cx, cy, TR * t, { px: p, halo }) : []),
    ...(shoots(kind) ? shot(cx + SO * t, cy - SO * t, SR * t, { px: p, halo }) : []),
  ];
}

/**
 * A take on an enemy figure (ringTake and the base glow, marks.js:1080-1090, :1095-1099): a red edge inset 0.06 s,
 * a faint red fill, and a ring and a red glow under the feet. footY is the figure's foot line. Both and moveshot
 * put the green move tile under the edge. The badge (badge()) goes over the figure. o.cond dashes the edge (marks.js:1084).
 */
export function occupied(kind: Kind, x: number, y: number, s: number, footY: number, o: Opts = {}): Shape[] {
  const p = o.px ?? 1, i = 0.06 * s, cx = x + s / 2;
  const edge = (ink: Ink): Shape => ({ k: 'rect', x: x + i, y: y + i, w: s - 2 * i, h: s - 2 * i, r: 0.06 * s, ...ink });
  return [
    ...(kind === 'both' || kind === 'moveshot' ? tile('move', x, y, s, { px: p }) : []),
    ...(o.power ? power(x + i, y + i, s - 2 * i, 0.06 * s, p) : []),
    edge({ stroke: LEG.halo, lw: 4 * p, a: 0.5 }),
    edge({ fill: 'rgba(214,52,40,.08)', stroke: o.hover ? LEG.gold : LEG.red, lw: (o.hover ? 2.5 : 2) * p, dash: o.cond ? [4 * p, 3 * p] : undefined }),
    { k: 'ellipse', x: cx, y: footY, rx: 0.34 * s, ry: 0.1 * s, stroke: LEG.red, lw: 2.5 * p, a: 0.6 },
    { k: 'ellipse', x: cx, y: footY, rx: 0.38 * s, ry: 0.12 * s, fill: 'glow-red' },
  ];
}

/** The take badge (takeBadge, marks.js:519-531): a small white tile with the target, or the shot, 3 px in from the square's top-left. */
export function badge(x: number, y: number, s: number, kind: Kind, o: Opts = {}): Shape[] {
  const p = o.px ?? 1, g = (s < 48 * p ? 15 * p : clamp(0.27 * s, 15 * p, 22 * p)) * (o.hover ? 1.15 : 1);
  const x0 = x + 3 * p, y0 = y + 3 * p, cx = x0 + g / 2, cy = y0 + g / 2, rw = Math.max(1.3 * p, g * 0.09);
  const box = (stroke: string, lw: number): Shape => ({ k: 'rect', x: x0, y: y0, w: g, h: g, r: 3 * p, fill: LEG.white, stroke, lw });
  return [
    box(LEG.halo, 3 * p), box(o.hover ? LEG.gold : LEG.navy, 1.5 * p),
    ...(shoots(kind) ? shot(cx + g * 0.08, cy - g * 0.08, g * 0.28, { px: p, halo: null, rw, len: 1.6 }) : target(cx, cy, g * 0.34, { px: p, halo: null, rw })),
  ];
}

/** The gradients that toSvg() names: put them once in the page's <defs> (marks.js:168, :178). */
export const DEFS = `<linearGradient id="leg-green" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${LEG.hi}"/><stop offset=".55" stop-color="${LEG.green}"/><stop offset="1" stop-color="${LEG.lo}"/></linearGradient>`
  + '<radialGradient id="leg-glow-red"><stop offset="0" stop-color="rgb(214,52,40)" stop-opacity=".55"/><stop offset=".6" stop-color="rgb(214,52,40)" stop-opacity=".3"/><stop offset="1" stop-color="rgb(214,52,40)" stop-opacity="0"/></radialGradient>';

const n = (v: number) => Math.round(v * 100) / 100;

/** The shapes as SVG elements (one element for each shape); the gradients are in DEFS. */
export function toSvg(shapes: Shape[]): string {
  return shapes.map(sh => {
    const fill = sh.fill === 'green' || sh.fill === 'glow-red' ? `url(#leg-${sh.fill})` : sh.fill ?? 'none';
    const ink = `fill="${fill}"${sh.stroke ? ` stroke="${sh.stroke}" stroke-width="${n(sh.lw ?? 1)}"` : ''}${sh.dash ? ` stroke-dasharray="${sh.dash.map(n).join(' ')}"` : ''}${sh.a != null ? ` opacity="${sh.a}"` : ''}`;
    if (sh.k === 'rect') return `<rect x="${n(sh.x)}" y="${n(sh.y)}" width="${n(sh.w)}" height="${n(sh.h)}" rx="${n(sh.r)}" ${ink}/>`;
    if (sh.k === 'circle') return `<circle cx="${n(sh.x)}" cy="${n(sh.y)}" r="${n(sh.r)}" ${ink}/>`;
    if (sh.k === 'ellipse') return `<ellipse cx="${n(sh.x)}" cy="${n(sh.y)}" rx="${n(sh.rx)}" ry="${n(sh.ry)}" ${ink}/>`;
    return `<polyline points="${sh.pts.map(n).join(' ')}" ${ink} stroke-linecap="round" stroke-linejoin="round"/>`;
  }).join('');
}

/** The shapes on a canvas, at the context's alpha. It sets round caps and joins. */
export function paint(ctx: CanvasRenderingContext2D, shapes: Shape[]): void {
  const base = ctx.globalAlpha;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const sh of shapes) {
    ctx.globalAlpha = base * (sh.a ?? 1);
    ctx.beginPath();
    if (sh.k === 'rect') ctx.roundRect(sh.x, sh.y, sh.w, sh.h, sh.r);
    else if (sh.k === 'circle') ctx.arc(sh.x, sh.y, sh.r, 0, Math.PI * 2);
    else if (sh.k === 'ellipse') ctx.ellipse(sh.x, sh.y, sh.rx, sh.ry, 0, 0, Math.PI * 2);
    else { ctx.moveTo(sh.pts[0], sh.pts[1]); for (let i = 2; i < sh.pts.length; i += 2) ctx.lineTo(sh.pts[i], sh.pts[i + 1]); }
    if (sh.fill === 'green' && sh.k === 'rect') {
      const g = ctx.createLinearGradient(0, sh.y, 0, sh.y + sh.h);
      g.addColorStop(0, LEG.hi); g.addColorStop(0.55, LEG.green); g.addColorStop(1, LEG.lo);
      ctx.fillStyle = g; ctx.fill();
    } else if (sh.fill === 'glow-red' && sh.k === 'ellipse') {
      // A radial gradient is round: draw it in a space squashed to the ellipse.
      ctx.save(); ctx.translate(sh.x, sh.y); ctx.scale(1, sh.ry / sh.rx);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, sh.rx);
      g.addColorStop(0, 'rgba(214,52,40,.55)'); g.addColorStop(0.6, 'rgba(214,52,40,.3)'); g.addColorStop(1, 'rgba(214,52,40,0)');
      ctx.fillStyle = g; ctx.fill(); ctx.restore();
    } else if (sh.fill) { ctx.fillStyle = sh.fill; ctx.fill(); }
    if (sh.stroke) {
      ctx.lineWidth = sh.lw ?? 1; ctx.strokeStyle = sh.stroke;
      if (sh.dash) ctx.setLineDash(sh.dash);
      ctx.stroke();
      if (sh.dash) ctx.setLineDash([]);
    }
  }
  ctx.globalAlpha = base;
}
