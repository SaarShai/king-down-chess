import { K, colorOf, typeOf, type Move } from '../../rules/engine';
import type { PaintedScene } from '../../../docs/2d-first-pieces/board/scene.mjs';
import type { CardLayer, Point } from './card-types';
import type { TailedOverlay } from './power-overlays';

// Darkness: the floor cracks and opens into a pool of ink. Bone hands take the piece, drag him under, and a second pool
// gives him back on his square. All painted: dark-gate.webp (prompt beside it) and the Shadow king's own hand film.
export const DARK_SINK_MS = 1500;
const ATLAS_URL = new URL('./dark-gate.webp', import.meta.url).href;
const HANDS_URL = new URL('../../../docs/2d-first-pieces/king-shadow/hands/film-poses.webp', import.meta.url).href;
type Rect = readonly [number, number, number, number];
const RIM: Rect = [0, 0, 300, 289], CRACK: Rect = [302, 0, 275, 280], SWIRL: Rect = [579, 0, 200, 200];
const TENDRILS: readonly Rect[] = [[0, 291, 110, 120], [112, 291, 109, 120], [223, 291, 102, 120], [327, 291, 120, 81]];
const COLLARS: readonly Rect[] = [[449, 291, 170, 64], [621, 291, 170, 66], [0, 413, 170, 56], [172, 413, 170, 60]];
// The hand film: 65 frames in 192 px cells, 8 to a row and 9 rows to an army, ivory first. Frame 0 is open, 16 reach, 32 half clutch, 48 clutch.
const CELL = 192, COLS = 8, ARMY_ROWS = 9, WRIST_X = 96, WRIST_Y = 176;
const OPEN = 0, REACH = 16, CLUTCH = 48;

const clamp = (t: number) => Math.max(0, Math.min(1, t));
const ease = (t: number) => { t = clamp(t); return t * t * (3 - 2 * t); };
const between = (t: number, a: number, b: number) => ease((t - a) / (b - a));

let atlas: HTMLImageElement | null = null, hands: HTMLImageElement | null = null, loading = false;
/** Loads once, when a Shadow king comes into play. Until then the pool is a plain dark oval and the hands stay away. */
export function loadDarkGate(): void {
  if (loading || typeof Image === 'undefined') return;
  loading = true;
  const load = (url: string, done: (image: HTMLImageElement) => void) => { const image = new Image(); image.src = url; image.decode().then(() => done(image), () => {}); };
  load(ATLAS_URL, image => { atlas = image; });
  load(HANDS_URL, image => { hands = image; });
}

const FLOOR = .54, POOL_R = 62;
const sprite = (ctx: CanvasRenderingContext2D, r: Rect, x: number, y: number, w: number, h: number) => {
  if (atlas) ctx.drawImage(atlas, r[0], r[1], r[2], r[3], x, y, w, h);
};
/** The floor under one gate. `crack` runs the cracks out from the centre; `open` opens the pool; `gone` fades the cracks. */
function drawPool(ctx: CanvasRenderingContext2D, at: Point, size: number, open: number, crack: number, gone: number, ms: number) {
  if (crack <= 0) return;
  ctx.save();
  ctx.translate(at.x, at.y + 2); ctx.scale(size, size * FLOOR);
  if (gone < 1) {
    const reach = 88 * crack;
    ctx.save();
    ctx.globalAlpha *= 1 - gone;
    ctx.beginPath(); ctx.arc(0, 0, reach, 0, Math.PI * 2); ctx.clip();
    ctx.rotate(.4);
    sprite(ctx, CRACK, -88, -88, 176, 176);
    ctx.restore();
  }
  if (open > 0) {
    const r = POOL_R * open;
    if (atlas) {
      // The ink turns slowly, so the open pool never stands still.
      ctx.save(); ctx.rotate(ms * .00035); sprite(ctx, RIM, -r, -r, r * 2, r * 2); ctx.restore();
      ctx.save(); ctx.rotate(ms * -.0016); const s = r * .74; sprite(ctx, SWIRL, -s, -s, s * 2, s * 2); ctx.restore();
    } else {
      ctx.fillStyle = 'rgb(14,10,18)'; ctx.beginPath(); ctx.arc(0, 0, r * .86, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

// Each tendril: side, depth on the floor, sprite, height, how far along the pool's life it starts.
const REACH_OUT = [[-52, -8, 0, 1, 0], [50, -6, 1, .92, .1], [-34, 14, 3, .7, .16], [38, 16, 2, .72, .06]] as const;
function drawTendrils(ctx: CanvasRenderingContext2D, at: Point, size: number, grow: number, ms: number, front: boolean) {
  if (grow <= 0 || !atlas) return;
  for (let i = 0; i < REACH_OUT.length; i++) {
    const [x, y, which, tall, late] = REACH_OUT[i];
    if ((y > 0) !== front) continue;
    const k = ease((grow - late) / (1 - late));
    if (k <= 0) continue;
    const r = TENDRILS[which], w = 56 * size * tall, h = w * r[3] / r[2];
    ctx.save();
    ctx.translate(at.x + x * size, at.y + y * size);
    ctx.rotate(Math.sin(ms * .006 + i * 1.7) * .09 + (x < 0 ? -.08 : .08));
    ctx.scale(.55 + .45 * k, k);
    sprite(ctx, r, -w / 2, -h, w, h);
    ctx.restore();
  }
}

/** One bone hand of the other colour, so it reads on the figure it takes, its wrist on the ink at (x, surface). `rise`, 0..1, is how far it stands out. */
function drawHand(ctx: CanvasRenderingContext2D, value: number, x: number, surface: number, size: number, rise: number, frame: number, lean: number, flip: boolean) {
  if (!hands || rise <= .01) return;
  const k = .4 * size, f = Math.round(frame), sx = (f % COLS) * CELL, sy = (Math.floor(f / COLS) + (colorOf(value) === 0 ? ARMY_ROWS : 0)) * CELL;
  ctx.save();
  ctx.beginPath(); ctx.rect(x - 90, surface - 200, 180, 202); ctx.clip();
  ctx.translate(x, surface + (1 - rise) * CELL * k * .95); ctx.rotate(lean); ctx.scale(flip ? -k : k, k);
  ctx.drawImage(hands, sx, sy, CELL, CELL, -WRIST_X, -WRIST_Y, CELL, CELL);
  ctx.restore();
}

/** The splash where a body meets the ink: it hides the cut and grows with the depth. */
function drawCollar(ctx: CanvasRenderingContext2D, at: Point, size: number, grow: number, which: number, ms: number) {
  if (grow <= 0) return;
  const r = COLLARS[which], w = 118 * size * (.7 + .3 * grow), h = w * r[3] / r[2] * grow * (1 + Math.sin(ms * .013) * .1);
  ctx.save(); ctx.translate(at.x, at.y + 12 * size);
  sprite(ctx, r, -w / 2, -h, w, h);
  ctx.restore();
}

// The figure in ink: one small canvas, made once, redrawn each frame while he is in the pool.
const SOAK_W = 260, SOAK_H = 300, SOAK_FOOT = 20, SOAK_DENSITY = 2;
let soak: CanvasRenderingContext2D | null = null, soakOut: CanvasRenderingContext2D | null = null, inkEdge: Path2D | null = null;
/** The top edge of the ink on a figure, ragged with runs. y 0 is the ink line and all below it is ink. */
function makeInkEdge(): Path2D {
  const path = new Path2D();
  path.moveTo(-140, 500); path.lineTo(-140, 0);
  for (const [x, up] of [[-96, 8], [-74, 34], [-58, 4], [-42, 22], [-28, 2], [-14, 40], [0, 6], [12, 26], [26, 3], [40, 46], [56, 8], [70, 20], [92, 4]]) {
    path.quadraticCurveTo(x - 4, 0, x - 2, -up + 3); path.quadraticCurveTo(x, -up - 3, x + 2, -up + 3); path.quadraticCurveTo(x + 4, 0, x + 8, 0);
  }
  path.lineTo(140, 0); path.lineTo(140, 500); path.closePath();
  return path;
}
/**
 * One figure cut off at the ink, dark up to `ink` px above his feet. Standing clear he is the scene's own figure and keeps
 * his floor shadow, so the hand-over to the scene does not show.
 */
function drawBody(ctx: CanvasRenderingContext2D, shadowless: (c: CanvasRenderingContext2D) => CanvasRenderingContext2D, scene: PaintedScene, value: number, square: number, at: Point, depth: number, ink: number) {
  if (depth <= 0 && ink <= 0) { scene.ghost(ctx, value, square, 1); return; }
  if (!soak) {
    const canvas = document.createElement('canvas'); canvas.width = SOAK_W * SOAK_DENSITY; canvas.height = SOAK_H * SOAK_DENSITY;
    soak = canvas.getContext('2d')!; soakOut = shadowless(soak); inkEdge = makeInkEdge();
  }
  const g = soak;
  g.setTransform(SOAK_DENSITY, 0, 0, SOAK_DENSITY, 0, 0);
  g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, SOAK_W, SOAK_H);
  g.save(); g.translate(SOAK_W / 2 - at.x, SOAK_H - SOAK_FOOT - at.y); scene.ghost(soakOut!, value, square, 1); g.restore();
  if (ink > 0) {
    g.globalCompositeOperation = 'source-atop';
    g.translate(SOAK_W / 2, SOAK_H - SOAK_FOOT - ink);
    g.fillStyle = 'rgba(13,9,17,.97)'; g.fill(inkEdge!);
    g.globalCompositeOperation = 'source-over';
  }
  ctx.save();
  if (depth > 0) { ctx.beginPath(); ctx.rect(at.x - SOAK_W / 2, at.y - SOAK_H, SOAK_W, SOAK_H + 10); ctx.clip(); }
  ctx.drawImage(g.canvas, at.x - SOAK_W / 2, at.y - SOAK_H + SOAK_FOOT + depth, SOAK_W, SOAK_H);
  ctx.restore();
}

/**
 * The whole move, a pure function of t. Before .8 this draws the figure: down at the first square, up at the second. From
 * .8 on the scene owns the figure on its square (AIR_SETTLED) and only the second pool, under him, is left to close.
 */
export function drawDarkSink(ctx: CanvasRenderingContext2D, shadowless: (c: CanvasRenderingContext2D) => CanvasRenderingContext2D, scene: PaintedScene, value: number, from: number, to: number, layer: CardLayer, row: number | undefined, t: number): void {
  const a = scene.foot(from), b = scene.foot(to), ms = t * DARK_SINK_MS, big = typeOf(value) === K, size = big ? 1 : .8, tall = big ? 168 : 124;
  // First gate. A short tug when the hands close, then the pull.
  const pull = (t - .2) / .26, down = tall * (.2 * ease(pull / .22) + .8 * ease((pull - .3) / .7));
  const aOpen = between(t, .04, .2) * (1 - between(t, .5, .66)), aCrack = between(t, 0, .12), aGone = between(t, .62, .78);
  const aGrow = between(t, .08, .24) * (1 - between(t, .44, .58));
  const aHandUp = between(t, .07, .2), aFrame = t < .14 ? OPEN : t < .2 ? OPEN + (REACH - OPEN) * between(t, .14, .2) : REACH + (CLUTCH - REACH) * between(t, .18, .25);
  // Second gate. The hands bring him up and open as he clears the ink.
  const lift = (t - .46) / .28, up = tall * (1 - clamp(lift)) ** 2.4;
  const bOpen = between(t, .32, .46) * (1 - between(t, .76, .94)), bCrack = between(t, .28, .4), bGone = between(t, .86, 1);
  const bGrow = between(t, .4, .52) * (1 - between(t, .68, .82));
  const bHandUp = between(t, .42, .52) * (1 - between(t, .62, .76)), bFrame = CLUTCH * (1 - between(t, .56, .68));
  const sunk = down >= tall - .5, atFrom = t < .47, atB = t >= .46 && t < .8;

  if (layer === 'under') {
    drawPool(ctx, a, size, aOpen, aCrack, aGone, ms);
    drawPool(ctx, b, size, bOpen, bCrack, bGone, ms);
    drawTendrils(ctx, a, size, aGrow, ms, false);
    drawTendrils(ctx, b, size, bGrow, ms, false);
    return;
  }
  if (row === scene.cell(from).row && atFrom) {
    if (!sunk) drawBody(ctx, shadowless, scene, value, from, a, down, down > 0 ? down + 34 * between(down, 0, 18) : 0);
    const grip = Math.min(down, 90);
    for (const side of [-1, 1]) drawHand(ctx, value, a.x + side * 24 * size, a.y + 8 * size, size, aHandUp * (1 - clamp(grip / 130)), side < 0 ? aFrame : Math.max(0, aFrame - 4), -side * .22, side > 0);
    drawCollar(ctx, a, size, between(down, 0, 26) * (1 - between(down, tall - 22, tall - 2)), 0, ms);
    drawTendrils(ctx, a, size, aGrow, ms, true);
  }
  if (row === scene.cell(to).row) {
    if (atB && up < tall - .5) drawBody(ctx, shadowless, scene, value, to, b, up, tall * (1 - between(t, .5, .78)));
    if (t < .8) for (const side of [-1, 1]) drawHand(ctx, value, b.x + side * 27 * size, b.y + 8 * size, size, bHandUp * .9, side < 0 ? bFrame : Math.max(0, bFrame - 4), -side * .18, side > 0);
    if (atB) drawCollar(ctx, b, size, between(up, 0, 26) * (1 - between(up, tall - 22, tall - 2)), 1, ms);
    drawTendrils(ctx, b, size, bGrow, ms, true);
  }
}

/** A Darkness move that keeps its real walk or attack (a capture, a promotion): a gate at each end, a grip on the far one. */
export class DarkGrip implements TailedOverlay {
  readonly tailMs = 520;
  private travel = 0;
  private arrivedAt = -1;
  constructor(private move: Move, private value: number) {}
  draw(ctx: CanvasRenderingContext2D, scene: PaintedScene, layer: CardLayer, row: number | undefined, ms: number): void {
    const a = scene.foot(this.move.from), b = scene.foot(this.move.to), size = .8;
    if (layer === 'under') {
      const foot = scene.characterFrames?.find(frame => frame.square === this.move.from)?.foot;
      if (foot) {
        const whole = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        this.travel = Math.max(this.travel, clamp(((foot.x - a.x) * (b.x - a.x) + (foot.y - a.y) * (b.y - a.y)) / (whole * whole)));
      }
      if (this.arrivedAt < 0 && this.travel >= .8) this.arrivedAt = ms;
    }
    const left = clamp(this.travel / .5), closing = this.arrivedAt < 0 ? 0 : clamp((ms - this.arrivedAt) / 520);
    const aOpen = ease(ms / 170) * (1 - left), aCrack = ease(ms / 120), aGone = this.arrivedAt < 0 ? left * .5 : .5 + closing * .5;
    const bOpen = ease((this.travel - .1) / .45) * (1 - ease((closing - .2) / .7)), bCrack = ease(this.travel / .35), bGone = ease((closing - .5) / .5);
    if (layer === 'under') {
      drawPool(ctx, a, size, aOpen, aCrack, aGone, ms);
      drawPool(ctx, b, size, bOpen, bCrack, bGone, ms);
      drawTendrils(ctx, b, size, bOpen, ms, false);
      return;
    }
    if (row !== scene.cell(this.move.to).row) return;
    const rise = ease((this.travel - .35) / .35) * (1 - ease(closing / .55)), frame = CLUTCH * ease((this.travel - .4) / .5);
    for (const side of [-1, 1]) drawHand(ctx, this.value, b.x + side * 30 * size, b.y + 10 * size, size, rise * .8, side < 0 ? frame : Math.max(0, frame - 4), -side * .2, side > 0);
    drawTendrils(ctx, b, size, bOpen, ms, true);
  }
}
