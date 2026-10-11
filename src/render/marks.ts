import type { PaintedScene } from '../../docs/2d-first-pieces/board/scene.mjs';
import type { boardInk } from './board-ink';
import { badge, kindOf, occupied, paint, tile, type Kind, type Shape } from './legend';
import type { Highlights } from './renderer';

/**
 * Move and take marks for the painted board, drawn on its canvas (no DOM), in the owner's legend (legend.ts).
 * Each kind has its own shape, so colour is never the only cue:
 * - move: a green tile;
 * - take on an empty square: a white tile with a red target; move or take: a green tile with the target;
 * - take on a figure: a thin red edge, a ring and a red glow under its feet, and the badge (a small white tile
 *   with the target) at the square's top-left, over the figure;
 * - shot (the piece takes from where it stands): the target pierced by an arrow, on the tile or the badge;
 * - power (a king's power): two blue frames round the mark, over a blue rune circle with a six-point star;
 * - swap (Maester): two violet arrows chasing round the friend's feet;
 * - shove (Ogre): a teal ring and chevrons on the side the piece will be pushed to.
 * The read of an enemy piece shows the same legend marks at half strength.
 * When a piece is selected the marks grow in, rippling out from it. The legend marks then stand still; while
 * motion is allowed the swap, shove and rune marks keep moving (riding the selected figure's ~30 fps idle).
 * The square under the pointer (or the keyboard cursor) gets a gold-bright edge and a larger badge; on a move
 * it also shows a faint copy of the piece standing there.
 */
export interface MarkState {
  marks: Highlights;
  /** The selected piece's code (for the preview), or 0. */
  piece: number;
  /** Pointer or keyboard square. */
  preview: number | null;
  /** Size factor for small boards (>= 1). */
  k: number;
  /** Scene units for one CSS pixel: the legend's widths and thresholds are CSS pixels. */
  px: number;
  /** The shown position's squares: a take on a figure is the occupied take. */
  board?: ArrayLike<number>;
  /** Animate (pop-in, pulse, turn); false draws the settled markers. */
  motion: boolean;
  /** When the current markers appeared (performance.now()). */
  since: number;
  /** Web text and strokes use CSS size; omitted keeps the plugin drawing. */
  ink?: ReturnType<typeof boardInk>;
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

const COLOURS = { swap: '160,120,220', shove: '64,190,176', power: '96,160,255' };

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
  const hover = (sq: number) => s.preview === sq;
  const inRow = (sq: number) => row == null || scene.cell(sq).row === row;
  const figure = (sq: number) => !!s.board?.[sq];
  const readKind = (sq: number): Kind => m.read?.shot.has(sq) ? 'shot' : 'take';
  /** A legend mark grows from 0.6 of its size round the square's centre as it appears; a read mark is at half strength. */
  const legend = (sq: number, shapes: Shape[], alpha = 1): void => {
    const a = appear(sq); if (a <= 0) return;
    const b = box(sq), c = 0.6 + 0.4 * a, cx = b.x + TILE / 2, cy = b.y + TILE / 2;
    ctx.save(); ctx.globalAlpha = Math.min(1, a) * alpha;
    ctx.translate(cx, cy); ctx.scale(c, c); ctx.translate(-cx, -cy);
    paint(ctx, shapes); ctx.restore();
  };
  /** The under part of a mark: the tile, or the occupied take on a figure. */
  const under = (sq: number, kind: Kind, alpha = 1, power = false): void => {
    const b = box(sq), o = { px: s.px, power, hover: alpha === 1 && hover(sq) };
    legend(sq, kind !== 'move' && figure(sq) ? occupied(kind, b.x, b.y, TILE, ground(sq).y, o) : tile(kind, b.x, b.y, TILE, o), alpha);
  };
  /** The badge of a take on a figure, after its row's figures. */
  const over = (sq: number, kind: Kind, alpha = 1): void => {
    if (!inRow(sq) || !figure(sq)) return;
    const b = box(sq); legend(sq, badge(b.x, b.y, TILE, kind, { px: s.px, hover: alpha === 1 && hover(sq) }), alpha);
  };
  const readTakes = m.read ? new Set([...m.read.take, ...m.read.shot]) : new Set<number>();

  const pointerFrame = (): void => {
    const p = s.preview;
    const marked = p != null && [m.moves, m.captures, m.swaps, m.shoves, m.powers].some(l => l?.includes(p));
    if (p != null && !marked && inRow(p)) { const b = box(p); ctx.strokeStyle = '#ffffffaa'; ctx.lineWidth = 2; ctx.strokeRect(b.x + 1, b.y + 1, TILE - 2, TILE - 2); }
  };

  ctx.save();
  if (layer === 'under') {
    if (m.read) {
      for (const sq of m.read.step) under(sq, 'move', 0.5);
      for (const sq of readTakes) under(sq, readKind(sq), 0.5);
      for (const sq of new Set([...m.read.swap, ...m.read.push.map(p => p.from)])) {
        const g = ground(sq);
        ctx.beginPath(); ctx.ellipse(g.x, g.y, 38, 14, 0, 0, TAU); stroke2(ctx, '#68583d', 2.2);
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
    for (const sq of new Set([...m.moves ?? [], ...m.captures ?? []])) {
      under(sq, kindOf(sq, m), 1, m.powers?.includes(sq));
      // Preview: the piece, see-through, standing where it would go.
      if (m.moves?.includes(sq) && hover(sq) && s.piece && appear(sq) > 0) scene.ghost(ctx, s.piece, sq, 0.5);
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
      shoveArrow(ctx, g.x, s.ink ? PAD + (landing.row + 0.5) * TILE : g.y, landing.col - target.col, landing.row - target.row, a, k, s.ink ? Math.max(3, s.ink.causeCore * 1.7) : 3);
    }
  } else {
    for (const sq of readTakes) over(sq, readKind(sq), 0.5);
    // The web board draws the bite badges last, so no frame covers a number; the plugin keeps its old order.
    const bites = (): void => { for (const [i, sq] of (m.bites ?? []).entries()) {
      if (!inRow(sq)) continue;
      const b = box(sq), size = Math.min(k, 1.8), radius = s.ink?.biteRadius ?? 11 * size;
      const x = s.ink ? b.x + TILE - radius - s.ink.biteInset : b.x + 18 * size;
      const y = s.ink ? b.y + TILE - radius - s.ink.biteInset : b.y + 18 * size;
      ctx.beginPath(); ctx.arc(x, y, radius, 0, TAU);
      ctx.fillStyle = '#ece7dd'; ctx.fill(); stroke2(ctx, '#706b63', 1.5);
      ctx.fillStyle = '#4b4741'; ctx.font = `bold ${s.ink?.biteFont ?? 16 * size}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(i + 1), x, y);
    } };
    if (!s.ink) bites();
    for (const sq of m.captures ?? []) over(sq, kindOf(sq, m));
    for (const sq of m.hint ?? []) { if (!inRow(sq)) continue; const b = box(sq); ctx.strokeStyle = '#c99a2e'; ctx.lineWidth = 4 * k; ctx.strokeRect(b.x + 4, b.y + 4, TILE - 8, TILE - 8); }
    pointerFrame();
    if (s.ink) bites();
  }
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
function shoveArrow(ctx: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number, a: number, k: number, width = 3): void {
  const angle = Math.atan2(dy, dx), length = 20 * Math.min(k, 1.6) * a;
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-length, 0); ctx.lineTo(length, 0);
  ctx.moveTo(length - 10 * a, -9 * a); ctx.lineTo(length, 0); ctx.lineTo(length - 10 * a, 9 * a);
  stroke2(ctx, '#2f7f75', width); ctx.restore();
}
