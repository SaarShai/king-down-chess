import type { PaintedScene } from '../../docs/2d-first-pieces/board/scene.mjs';
import type { Highlights } from './renderer';

/**
 * Move and capture markers for the painted board, drawn on its canvas (no DOM).
 *
 * Each kind has its own shape, so colour is never the only cue:
 * - move: a gold gem floating over a glow on the ground where the feet will stand;
 * - capture: a crimson ring at the enemy's feet and four corner brackets that breathe inwards;
 * - shot (the Archer shoots without moving): a turning sight over the target's body;
 * - swap (Maester): two violet arrows chasing round the friend's feet;
 * - shove (Ogre): a teal ring and chevrons on the side the piece will be pushed to;
 * - power (a king's power): a blue rune circle with a six-point star, under any of the above.
 * When a piece is selected the markers pop in, rippling out from it. While motion is allowed they
 * keep a slow pulse (riding the selected figure's ~30 fps idle); otherwise they are drawn still.
 * The square under the pointer (or the keyboard cursor) grows its marker; on a move it also
 * shows a faint copy of the piece standing there.
 */
export interface MarkState {
  marks: Highlights;
  /** The selected piece's code (for the preview), or 0. */
  piece: number;
  /** Pointer or keyboard square. */
  preview: number | null;
  /** Size factor for small boards (>= 1). */
  k: number;
  /** Animate (pop-in, pulse, turn); false draws the settled markers. */
  motion: boolean;
  /** When the current markers appeared (performance.now()). */
  since: number;
}

export const POP_MS = 300;
export const RIPPLE_MS = 38;

const TAU = Math.PI * 2;
const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
/** Overshoots a little, then settles: the pop. */
const backOut = (t: number) => { t = clamp(t, 0, 1); const s = 1.9; return 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2; };

/** Glow discs, made once per colour (a radial gradient drawn into an ellipse each frame costs more). */
const glows = new Map<string, HTMLCanvasElement>();
function glow(rgb: string): HTMLCanvasElement {
  let c = glows.get(rgb);
  if (c) return c;
  c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d')!, r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, `rgba(${rgb},0.9)`); r.addColorStop(0.45, `rgba(${rgb},0.45)`); r.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  glows.set(rgb, c);
  return c;
}
function groundGlow(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, rgb: string, alpha: number): void {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha; ctx.drawImage(glow(rgb), x - rx, y - rx * 0.38, rx * 2, rx * 0.76); ctx.restore();
}

/** A stroke twice: a wide light or dark halo, then the colour, so it reads on light and dark stone. */
function stroke2(ctx: CanvasRenderingContext2D, colour: string, width: number, halo = 'rgba(251,246,232,0.85)'): void {
  ctx.lineWidth = width + 3; ctx.strokeStyle = halo; ctx.stroke();
  ctx.lineWidth = width; ctx.strokeStyle = colour; ctx.stroke();
}

const COLOURS = {
  move: '255,214,128', capture: '214,52,40', shot: '214,52,40', swap: '160,120,220', shove: '64,190,176', power: '96,160,255',
};

/** `row`: for the 'over' layer, draw only that screen row's squares (the scene calls it row by row). */
export function drawMarks(ctx: CanvasRenderingContext2D, scene: PaintedScene, layer: 'under' | 'over', s: MarkState, row?: number): void {
  const { PAD, TILE } = scene, m = s.marks, k = s.k;
  const now = performance.now();
  const from = m.selected != null ? scene.cell(m.selected) : null;
  // Appear: 0 → 1 with a small overshoot, later the further a square is from the piece.
  const appear = (sq: number): number => {
    if (!s.motion) return 1;
    const c = scene.cell(sq), d = from ? Math.hypot(c.col - from.col, c.row - from.row) : 0;
    return backOut((now - s.since - d * RIPPLE_MS) / POP_MS);
  };
  const time = s.motion ? now / 1000 : 0.6;
  const pulse = (sq: number, rate = 2.4) => 0.5 + 0.5 * Math.sin(time * rate * TAU / 2.4 - sq * 0.7);
  const box = (sq: number) => { const c = scene.cell(sq); return { x: PAD + c.col * TILE, y: PAD + c.row * TILE }; };
  const ground = (sq: number) => { const f = scene.foot(sq); return { x: f.x, y: f.y - 4 }; };
  const powers = new Set(m.powers ?? []), shots = new Set(m.shots ?? []);
  const hover = (sq: number) => s.preview === sq;
  const inRow = (sq: number) => row == null || scene.cell(sq).row === row;

  ctx.save();
  if (layer === 'under') {
    if (m.read) {
      const takes = new Set([...m.read.take, ...m.read.shot]);
      const squares = new Set([...m.read.step, ...takes, ...m.read.swap, ...m.read.push.map(p => p.from)]);
      for (const sq of squares) {
        const g = ground(sq);
        ctx.beginPath(); ctx.ellipse(g.x, g.y, 38, 14, 0, 0, TAU);
        stroke2(ctx, takes.has(sq) ? '#b3261e' : '#68583d', 2.2);
      }
    }
    // The selected piece stands in warm light.
    if (m.selected != null) {
      const g = ground(m.selected);
      groundGlow(ctx, g.x, g.y, 50 + 4 * pulse(m.selected, 1.6), '255,206,120', 0.75);
      ctx.beginPath(); ctx.ellipse(g.x, g.y, 40, 14, 0, 0, TAU); stroke2(ctx, 'rgba(233,192,113,0.95)', 2, 'rgba(40,28,10,0.45)');
    }
    for (const sq of m.powers ?? []) {
      const a = appear(sq); if (a <= 0) continue;
      const g = ground(sq); rune(ctx, g.x, g.y, 46 * a, time, pulse(sq), hover(sq));
    }
    for (const sq of m.moves ?? []) {
      const a = appear(sq); if (a <= 0) continue;
      const g = ground(sq), h = hover(sq);
      groundGlow(ctx, g.x, g.y, (h ? 48 : 32) * k * a, COLOURS.move, (0.55 + 0.35 * pulse(sq)) * Math.min(1, a));
      if (h && s.piece) {
        // Preview: the piece, see-through, standing where it would go, on a gold ring.
        ctx.beginPath(); ctx.ellipse(g.x, g.y, 40, 14, 0, 0, TAU); stroke2(ctx, '#e9b44c', 2.5, 'rgba(40,28,10,0.5)');
        scene.ghost(ctx, s.piece, sq, 0.5);
      }
    }
    for (const sq of m.captures ?? []) {
      const a = appear(sq); if (a <= 0) continue;
      const g = ground(sq), h = hover(sq), p = pulse(sq, 3);
      groundGlow(ctx, g.x, g.y, (48 + 6 * p) * a, COLOURS.capture, 0.5 + 0.3 * p);
      ctx.beginPath(); ctx.ellipse(g.x, g.y, 44 * a, 15 * a, 0, 0, TAU);
      stroke2(ctx, h ? '#f0c060' : '#b3261e', (h ? 3.5 : 3) * Math.min(k, 1.5));
      if (shots.has(sq)) { ctx.setLineDash([6, 6]); ctx.lineDashOffset = -time * 20; ctx.beginPath(); ctx.ellipse(g.x, g.y, 54 * a, 19 * a, 0, 0, TAU); stroke2(ctx, '#b3261e', 1.5); ctx.setLineDash([]); }
    }
    for (const sq of m.swaps ?? []) {
      const a = appear(sq); if (a <= 0) continue;
      const g = ground(sq); groundGlow(ctx, g.x, g.y, 46 * a, COLOURS.swap, 0.6);
      chase(ctx, g.x, g.y, 42 * a, time, hover(sq));
    }
    for (const sq of m.shoves ?? []) {
      const a = appear(sq); if (a <= 0) continue;
      const g = ground(sq), f = from ? scene.cell(sq) : null;
      // Push direction on screen: from the Ogre to the target.
      const dir = from && f ? { x: f.col - from.col, y: f.row - from.row } : { x: 1, y: 0 };
      groundGlow(ctx, g.x, g.y, 46 * a, COLOURS.shove, 0.55);
      ctx.beginPath(); ctx.ellipse(g.x, g.y, 42 * a, 14 * a, 0, 0, TAU); stroke2(ctx, hover(sq) ? '#f0c060' : '#2f7f75', 2.5);
      if (m.shoveTo === undefined) chevrons(ctx, g.x, g.y, dir, a, time, k);
    }
    for (const shove of m.shoveTo ?? []) {
      const a = appear(shove.to); if (a <= 0) continue;
      const g = ground(shove.to), target = scene.cell(shove.from), landing = scene.cell(shove.to);
      shoveArrow(ctx, g.x, g.y, landing.col - target.col, landing.row - target.row, a, k);
    }
  } else {
    for (const sq of m.read?.shot ?? []) {
      if (!inRow(sq)) continue;
      const g = ground(sq); sight(ctx, g.x, g.y - 58, 16 * Math.max(1, k * 0.8), time, false);
    }
    for (const [i, sq] of (m.bites ?? []).entries()) {
      if (!inRow(sq)) continue;
      const b = box(sq), size = Math.min(k, 1.8), x = b.x + 18 * size, y = b.y + 18 * size;
      ctx.beginPath(); ctx.arc(x, y, 11 * size, 0, TAU);
      ctx.fillStyle = '#ece7dd'; ctx.fill(); stroke2(ctx, '#706b63', 1.5);
      ctx.fillStyle = '#4b4741'; ctx.font = `bold ${16 * size}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(i + 1), x, y);
    }
    for (const sq of m.moves ?? []) {
      const a = appear(sq); if (a <= 0 || !inRow(sq)) continue;
      const g = ground(sq), bob = s.motion ? Math.sin(time * 2.6 + sq) * 2.2 : 0;
      if (hover(sq) && s.piece) continue; // the preview figure stands there instead
      gem(ctx, g.x, g.y - 22 * Math.min(k, 1.6) - bob, Math.min(k, 1.6) * a, time + sq * 0.37, powers.has(sq));
    }
    for (const sq of m.captures ?? []) {
      const a = appear(sq); if (a <= 0 || !inRow(sq)) continue;
      const b = box(sq), h = hover(sq), p = pulse(sq, 3);
      brackets(ctx, b.x, b.y, TILE, (h ? 13 : 6 + 4 * p) + (1 - Math.min(1, a)) * 18, Math.min(a, 1), h, k, powers.has(sq));
      if (shots.has(sq)) sight(ctx, b.x + TILE / 2, ground(sq).y - 58, (h ? 19 : 16) * Math.max(1, k * 0.8) * a, time, h);
    }
    for (const sq of m.hint ?? []) { if (!inRow(sq)) continue; const b = box(sq); ctx.strokeStyle = '#c99a2e'; ctx.lineWidth = 4 * k; ctx.strokeRect(b.x + 4, b.y + 4, TILE - 8, TILE - 8); }
    const p = s.preview;
    const marked = p != null && [m.moves, m.captures, m.swaps, m.shoves, m.powers].some(l => l?.includes(p));
    if (p != null && !marked && inRow(p)) { const b = box(p); ctx.strokeStyle = '#ffffffaa'; ctx.lineWidth = 2; ctx.strokeRect(b.x + 1, b.y + 1, TILE - 2, TILE - 2); }
  }
  ctx.restore();
}

/** A cut gem: four facets, a dark outline and a glint that sweeps across now and then. */
function gem(ctx: CanvasRenderingContext2D, x: number, y: number, k: number, t: number, power: boolean): void {
  if (k <= 0) return;
  const w = 10 * k, h = 15 * k, girdle = y - h * 0.18;
  const [light, mid, dark] = power ? ['#e3f0ff', '#7fb2ff', '#2f5ea8'] : ['#fff4cf', '#f0bf52', '#9a6418'];
  ctx.save();
  // A small shadow on the ground under the gem anchors it.
  ctx.fillStyle = 'rgba(30,20,8,0.28)'; ctx.beginPath(); ctx.ellipse(x, y + h + 10 * k, w * 0.8, w * 0.28, 0, 0, TAU); ctx.fill();
  const top = { x, y: y - h }, bottom = { x, y: y + h }, left = { x: x - w, y: girdle }, right = { x: x + w, y: girdle };
  const face = (pts: { x: number; y: number }[], colour: string) => { ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for (const q of pts.slice(1)) ctx.lineTo(q.x, q.y); ctx.closePath(); ctx.fillStyle = colour; ctx.fill(); };
  // Outline first (wide, dark), then the facets.
  ctx.beginPath(); ctx.moveTo(top.x, top.y); ctx.lineTo(right.x, right.y); ctx.lineTo(bottom.x, bottom.y); ctx.lineTo(left.x, left.y); ctx.closePath();
  ctx.lineJoin = 'round'; ctx.lineWidth = 3.2 * Math.min(k, 1.6); ctx.strokeStyle = power ? '#0f2244' : '#3a2408'; ctx.stroke();
  face([top, { x, y: girdle }, left], light);
  face([top, right, { x, y: girdle }], mid);
  face([left, { x, y: girdle }, bottom], mid);
  face([{ x, y: girdle }, right, bottom], dark);
  // Glint: a bright sliver crossing the upper facets once every few seconds.
  const g = (t * 0.45) % 1;
  if (g < 0.25) {
    const u = g / 0.25;
    ctx.save(); ctx.beginPath(); ctx.moveTo(top.x, top.y); ctx.lineTo(right.x, right.y); ctx.lineTo(bottom.x, bottom.y); ctx.lineTo(left.x, left.y); ctx.closePath(); ctx.clip();
    ctx.globalAlpha = Math.sin(u * Math.PI) * 0.9; ctx.fillStyle = '#ffffff';
    ctx.translate(x - w * 1.6 + u * w * 3.2, y); ctx.rotate(0.5); ctx.fillRect(-1.6 * k, -h * 2, 3.2 * k, h * 4); ctx.restore();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(x - w * 0.38, y - h * 0.5, 1.4 * k, 0, TAU); ctx.fill();
  ctx.restore();
}

/** Four L-shaped corners round the square, pulled in by `inset`; crimson (gold on hover, blue for a power). */
function brackets(ctx: CanvasRenderingContext2D, x: number, y: number, tile: number, inset: number, alpha: number, hover: boolean, k: number, power: boolean): void {
  const l = tile * 0.22, w = (hover ? 4.5 : 3.6) * Math.min(k, 1.6);
  ctx.save(); ctx.globalAlpha = alpha; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const [cx, cy, sx, sy] of [[x, y, 1, 1], [x + tile, y, -1, 1], [x, y + tile, 1, -1], [x + tile, y + tile, -1, -1]]) {
    const px = cx + sx * inset, py = cy + sy * inset;
    ctx.beginPath(); ctx.moveTo(px, py + sy * l); ctx.lineTo(px, py); ctx.lineTo(px + sx * l, py);
    stroke2(ctx, hover ? '#f0c060' : power ? '#3f7fd0' : '#c0281c', w, 'rgba(24,14,8,0.7)');
  }
  ctx.restore();
}

/** A gun-sight over the target's body: a ring, four ticks and a centre dot, turning slowly. */
function sight(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, t: number, hover: boolean): void {
  if (r <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.8);
  const colour = hover ? '#f0c060' : '#e0392b';
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); stroke2(ctx, colour, 2.4, 'rgba(24,14,8,0.65)');
  ctx.beginPath();
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; ctx.moveTo(Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.45); ctx.lineTo(Math.cos(a) * r * 1.45, Math.sin(a) * r * 1.45); }
  stroke2(ctx, colour, 2.4, 'rgba(24,14,8,0.65)');
  ctx.fillStyle = colour; ctx.beginPath(); ctx.arc(0, 0, 2.2, 0, TAU); ctx.fill();
  ctx.restore();
}

/** Two arrows chasing each other round an ellipse on the ground: trade places. */
function chase(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, t: number, hover: boolean): void {
  if (r <= 0) return;
  const colour = hover ? '#f0c060' : '#7d5ba6', ry = r * 0.36, spin = t * 1.2;
  ctx.save(); ctx.lineCap = 'round';
  for (let i = 0; i < 2; i++) {
    const a0 = spin + i * Math.PI, a1 = a0 + Math.PI * 0.72;
    ctx.beginPath(); ctx.ellipse(x, y, r, ry, 0, a0, a1); stroke2(ctx, colour, 3);
    // Arrowhead at the leading end, along the ellipse's tangent.
    const hx = x + Math.cos(a1) * r, hy = y + Math.sin(a1) * ry, tx = -Math.sin(a1) * r, ty = Math.cos(a1) * ry, n = Math.hypot(tx, ty) || 1;
    const ux = tx / n, uy = ty / n, s = 8;
    ctx.beginPath(); ctx.moveTo(hx + ux * s, hy + uy * s); ctx.lineTo(hx - uy * s * 0.7, hy + ux * s * 0.7); ctx.lineTo(hx + uy * s * 0.7, hy - ux * s * 0.7); ctx.closePath();
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(251,246,232,0.85)'; ctx.stroke(); ctx.fillStyle = colour; ctx.fill();
  }
  ctx.restore();
}

/** Three chevrons on the ground past the target, pointing where the Ogre pushes it; they march outwards. */
function chevrons(ctx: CanvasRenderingContext2D, x: number, y: number, dir: { x: number; y: number }, a: number, t: number, k: number): void {
  const n = Math.hypot(dir.x, dir.y) || 1, ux = dir.x / n, uy = dir.y / n;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let i = 0; i < 3; i++) {
    const phase = ((t * 0.9 + i / 3) % 1), d = (40 + phase * 34) * a, s = 11 * Math.min(k, 1.4);
    const cx = x + ux * d, cy = y + uy * d * 0.4; // flattened onto the ground plane
    ctx.globalAlpha = Math.sin(phase * Math.PI) * Math.min(a, 1);
    ctx.beginPath(); ctx.moveTo(cx - ux * s - uy * s, cy - (uy * s - ux * s) * 0.5); ctx.lineTo(cx, cy); ctx.lineTo(cx - ux * s + uy * s, cy - (uy * s + ux * s) * 0.5);
    stroke2(ctx, '#2f7f75', 3);
  }
  ctx.restore();
}

/** A rune circle on the ground: two rings, six turning ticks and a six-point star. */
function rune(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, t: number, p: number, hover: boolean): void {
  if (r <= 0) return;
  groundGlow(ctx, x, y, r * 1.1, COLOURS.power, 0.5 + 0.3 * p);
  const colour = hover ? '#f0c060' : '#3f7fd0', sy = 0.36;
  ctx.save(); ctx.translate(x, y); ctx.scale(1, sy);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); stroke2(ctx, colour, 2.4 / sy * 0.5, 'rgba(240,246,255,0.8)');
  ctx.beginPath(); ctx.arc(0, 0, r * 0.78, 0, TAU); ctx.lineWidth = 1.2 / sy * 0.5; ctx.strokeStyle = colour; ctx.stroke();
  ctx.rotate(t * 0.5);
  ctx.beginPath();
  for (let i = 0; i < 6; i++) { const a = i * TAU / 6; ctx.moveTo(Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.82); ctx.lineTo(Math.cos(a) * r * 0.96, Math.sin(a) * r * 0.96); }
  for (const off of [0, Math.PI / 3]) for (let i = 0; i <= 3; i++) { const a = off + i * TAU / 3, px = Math.cos(a) * r * 0.74, py = Math.sin(a) * r * 0.74; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
  ctx.lineWidth = 1.6 / sy * 0.5; ctx.strokeStyle = colour; ctx.stroke();
  ctx.restore();
}

/** A still arrow on the landing square, in the screen's shove direction. */
function shoveArrow(ctx: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number, a: number, k: number): void {
  const angle = Math.atan2(dy, dx), length = 20 * Math.min(k, 1.6) * a;
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-length, 0); ctx.lineTo(length, 0);
  ctx.moveTo(length - 10 * a, -9 * a); ctx.lineTo(length, 0); ctx.lineTo(length - 10 * a, 9 * a);
  stroke2(ctx, '#2f7f75', 3); ctx.restore();
}
