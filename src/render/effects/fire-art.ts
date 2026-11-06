// Painted fire from one atlas (fire-fx.webp, prompts in fire-fx-prompt.txt): a flame loop, a fireball loop, a burst, char, smoke,
// streaks and embers. Every piece is one drawImage from the atlas. Before the atlas loads, these draw nothing.
const SPRITES = {
  burst: [[3, 3, 238, 225], [244, 3, 238, 225], [485, 3, 238, 225], [726, 3, 238, 225], [3, 231, 238, 225], [244, 231, 238, 225], [485, 231, 238, 225], [726, 231, 238, 225]],
  ball: [[3, 459, 298, 94], [304, 459, 298, 94], [605, 459, 298, 94], [3, 556, 298, 94], [304, 556, 298, 94], [605, 556, 298, 94]],
  flame: [[906, 556, 104, 162], [3, 721, 104, 162], [110, 721, 104, 162], [217, 721, 104, 162], [324, 721, 104, 162], [431, 721, 104, 162], [538, 721, 104, 162], [645, 721, 104, 162]],
  char: [[752, 721, 250, 64], [3, 886, 250, 65]],
  streak: [[256, 886, 210, 45], [469, 886, 210, 48], [682, 886, 210, 40]],
  smoke: [[895, 886, 104, 71], [3, 960, 104, 72], [110, 960, 104, 48]],
  ember: [[217, 960, 30, 25], [250, 960, 30, 18], [283, 960, 30, 26], [316, 960, 30, 17], [349, 960, 30, 19], [382, 960, 30, 22]],
} as const;
type Rect = readonly [number, number, number, number];

let atlas: HTMLImageElement | null = null;
if (typeof Image !== 'undefined') {
  const image = new Image();
  image.onload = () => { atlas = image; };
  image.src = new URL('./fire-fx.webp', import.meta.url).href;
}

const FLAME_MS = 80, BALL_MS = 55;

function put(ctx: CanvasRenderingContext2D, r: Rect, x: number, y: number, w: number, h: number, alpha: number, ax: number, ay: number) {
  if (!atlas || alpha <= .004 || w <= .5 || h <= .5) return;
  const base = ctx.globalAlpha;
  ctx.globalAlpha = base * Math.min(1, alpha);
  ctx.drawImage(atlas, r[0], r[1], r[2], r[3], x - w * ax, y - h * ay, w, h);
  ctx.globalAlpha = base;
}
function turned(ctx: CanvasRenderingContext2D, r: Rect, x: number, y: number, w: number, h: number, angle: number, flipX: boolean, flipY: boolean, alpha: number, ax: number, ay: number) {
  if (!atlas || alpha <= .004 || w <= .5 || h <= .5) return;
  ctx.save();
  ctx.translate(x, y); if (angle) ctx.rotate(angle); if (flipX || flipY) ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
  put(ctx, r, 0, 0, w, h, alpha, ax, ay);
  ctx.restore();
}
/** A sprite that flies along `angle` stays lit from above: going left it is mirrored, not stood on its head. */
const headsLeft = (angle: number) => Math.cos(angle) < 0;

/** One flame of the loop on the ground at x, y, where `clock` picks the frame and an odd seed mirrors it. */
export function paintFlame(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, clock: number, seed: number, alpha: number) {
  const frame = SPRITES.flame[Math.floor(Math.max(0, clock) / FLAME_MS + seed * 3) % 8];
  if (seed & 1) turned(ctx, frame, x, y, w, h, 0, true, false, alpha, .5, .99);
  else put(ctx, frame, x, y, w, h, alpha, .5, .99);
}
/** The fireball with its head at x, y and its tail streaming back against `angle`. `stretch` draws the tail out of the head. */
export function paintBall(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, scale: number, stretch: number, clock: number, alpha: number) {
  const frame = SPRITES.ball[Math.floor(Math.max(0, clock) / BALL_MS) % 6];
  turned(ctx, frame, x, y, 203 * scale * stretch, 64 * scale, angle, false, headsLeft(angle), alpha, .866, .625);
}
/** The burst at `k` (0 to 1) of its life, standing on x, y. Each frame dissolves in over the last, which then goes, so the large steps do not pop. */
export function paintBurst(ctx: CanvasRenderingContext2D, x: number, y: number, k: number, size: number, alpha: number) {
  const at = Math.max(0, Math.min(.999, k)) * 8, i = Math.floor(at), mix = at - i, w = 170 * size, h = 161 * size;
  put(ctx, SPRITES.burst[i], x, y, w, h, alpha * (i === 7 ? 1 - mix : Math.min(1, 2 - mix * 2)), .5, .99);
  if (i < 7) put(ctx, SPRITES.burst[i + 1], x, y, w, h, alpha * Math.min(1, mix * 2), .5, .99);
}
/** Burnt stone with molten cracks, flat on the ground. */
export function paintChar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, seed: number, alpha: number) {
  const r = SPRITES.char[seed & 1];
  put(ctx, r, x, y, w, w * r[3] / r[2], alpha, .5, .5);
}
export function paintSmoke(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, seed: number, alpha: number) {
  const r = SPRITES.smoke[seed % 3];
  put(ctx, r, x, y, 88 * size, 88 * size * r[3] / r[2], alpha, .5, .5);
}
/** A long thin flame with its head at x, y. `length` draws the tail out behind it. */
export function paintStreak(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, length: number, thick: number, seed: number, alpha: number) {
  const r = SPRITES.streak[seed % 3];
  turned(ctx, r, x, y, length, thick * r[3] / r[2] * 150, angle, false, headsLeft(angle), alpha, .94, .5);
}
/** A hot lump or an ash chip, `size` board px across. */
export function paintEmber(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, spin: number, seed: number, alpha: number) {
  const r = SPRITES.ember[seed % 6];
  turned(ctx, r, x, y, size, size * r[3] / r[2], spin, false, false, alpha, .5, .5);
}
