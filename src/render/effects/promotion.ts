import type { PaintedScene, SceneEffect } from '../../../docs/2d-first-pieces/board/scene.mjs';
import type { Move, Position } from '../../rules/engine';

// The owner-approved promotion reveal (motion concepts, ticket 86): after the pawn arrives, gold dust from the painted
// board's own pigment rises round its feet, the chosen piece resolves in it before the midpoint, and three flakes fall.
// The feet stay fixed and no figure is stretched. Reduced motion and Animations Off show the chosen piece at once.
export const ASCENSION_MS = 740;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t); };

/** The reveal at `t` (0..1 of ASCENSION_MS): the new figure is opaque at 42%, before the midpoint. */
export function ascension(t: number) {
  t = clamp(t);
  return { t, reveal: ease((t - .13) / .29), pawn: 1 - ease((t - .27) / .18), material: ease(t / .16) * (1 - ease((t - .42) / .34)) };
}
type Frame = ReturnType<typeof ascension>;
type Brush = -1 | 1 | 'fold' | 'flake';

const STONE = new URL('../../../docs/2d-first-pieces/board-art/stone-board.webp', import.meta.url).href;
const brushes = new Map<Brush, HTMLCanvasElement>();
let loading: Promise<void> | undefined;
/** Makes the gold brushes once, from the stone board's pigment. Until they exist the reveal shows without dust. */
export function loadAscension(): Promise<void> {
  return loading ??= (async () => {
    const image = new Image(); image.src = STONE; await image.decode();
    const pigment = document.createElement('canvas'); pigment.width = pigment.height = 160;
    const ctx = pigment.getContext('2d', { willReadFrequently: true })!, tile = image.naturalWidth / 8;
    ctx.drawImage(image, tile * .12, tile * .12, tile * .7, tile * .7, 0, 0, 160, 160);
    const pixels = ctx.getImageData(0, 0, 160, 160);
    for (let i = 0; i < pixels.data.length; i += 4) {
      const tone = pixels.data[i] / 255;
      pixels.data[i] = 150 + 105 * tone; pixels.data[i + 1] = 74 + 141 * tone; pixels.data[i + 2] = 16 + 128 * tone;
      // Static pigment breaks up the mass. It is texture, never a particle simulation.
      const x = (i / 4) % 160, y = Math.floor(i / 640), noise = Math.sin(x * 127.1 + y * 311.7) * 43758.5453, grain = noise - Math.floor(noise);
      pixels.data[i + 3] = 255 * clamp((tone - .67) * 5) * (.06 + .94 * grain * grain);
    }
    ctx.putImageData(pixels, 0, 0);
    for (const key of [-1, 1, 'fold', 'flake'] as const) brushes.set(key, brush(key, pigment));
  })().catch(() => { loading = undefined; });
}

function dustPath(ctx: CanvasRenderingContext2D, side: number) {
  ctx.beginPath();
  if (side < 0) {
    ctx.moveTo(-35, 3);
    ctx.bezierCurveTo(-53, -15, -50, -36, -39, -48); ctx.bezierCurveTo(-58, -62, -35, -76, -38, -93);
    ctx.bezierCurveTo(-43, -110, -28, -109, -28, -119); ctx.bezierCurveTo(-16, -130, -8, -121, -12, -112);
    ctx.bezierCurveTo(0, -114, 0, -102, -3, -97); ctx.bezierCurveTo(10, -79, -16, -67, -7, -48);
    ctx.bezierCurveTo(6, -34, -2, -14, 7, 2); ctx.bezierCurveTo(-5, -4, -25, 10, -35, 3);
  } else {
    ctx.moveTo(-6, 2);
    ctx.bezierCurveTo(10, -11, -6, -27, 8, -45); ctx.bezierCurveTo(23, -61, 8, -73, 15, -90);
    ctx.bezierCurveTo(20, -104, 8, -113, 15, -120); ctx.bezierCurveTo(25, -125, 33, -115, 28, -108);
    ctx.bezierCurveTo(44, -110, 45, -99, 37, -94); ctx.bezierCurveTo(28, -77, 55, -72, 43, -55);
    ctx.bezierCurveTo(37, -42, 56, -23, 39, -6); ctx.bezierCurveTo(29, 4, 6, 12, -6, 2);
  }
  ctx.closePath();
}
// Texture is clipped inside a few broad, uneven brush forms; the edges remain soft pigment.
function brush(key: Brush, pigment: HTMLCanvasElement) {
  const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 340;
  const ctx = canvas.getContext('2d')!; ctx.scale(2, 2); ctx.translate(64, 154);
  if (typeof key === 'number') dustPath(ctx, key);
  else if (key === 'fold') {
    ctx.beginPath(); ctx.moveTo(-43, 9);
    ctx.bezierCurveTo(-44, -8, -29, -5, -27, -17); ctx.bezierCurveTo(-17, -8, -12, -23, 1, -16);
    ctx.bezierCurveTo(17, -23, 22, -8, 38, -13); ctx.bezierCurveTo(47, -2, 36, 11, 24, 9);
    ctx.bezierCurveTo(6, 20, -2, 5, -18, 15); ctx.bezierCurveTo(-26, 20, -36, 12, -43, 9); ctx.closePath();
  } else {
    ctx.beginPath(); ctx.moveTo(-10, 0);
    ctx.bezierCurveTo(-4.5, -8, 5, -2.5, 10, -5); ctx.bezierCurveTo(6, 6, -1, 6.5, -10, 0); ctx.closePath();
  }
  ctx.clip();
  const gold = ctx.createLinearGradient(-34, 2, 22, -133);
  gold.addColorStop(0, '#dfb557'); gold.addColorStop(.3, '#ffe4a8'); gold.addColorStop(.65, '#f8d27e'); gold.addColorStop(1, '#d29b35');
  ctx.fillStyle = gold; ctx.fillRect(-64, -154, 128, 170);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.fillStyle = ctx.createPattern(pigment, 'repeat')!; ctx.fillRect(-64, -154, 128, 170);
  return canvas;
}
function paint(ctx: CanvasRenderingContext2D, key: Brush, opacity: number) {
  const image = brushes.get(key);
  if (opacity <= 0 || !image) return;
  ctx.save(); ctx.globalAlpha *= opacity; ctx.drawImage(image, -64, -154, 128, 170); ctx.restore();
}

function veil(ctx: CanvasRenderingContext2D, foot: { x: number; y: number }, { t, material }: Frame, front: boolean) {
  if (material <= 0 || t >= 1) return;
  ctx.save(); ctx.translate(foot.x, foot.y);
  if (!front) {
    // The rear masses rise from the soles and open apart as the chosen silhouette resolves.
    for (const side of [-1, 1] as const) {
      ctx.save();
      ctx.translate(side * ease((t - .3) / .32) * 7, 24 * (1 - ease(t / .3)) - 8 * ease(t / .6));
      ctx.filter = 'blur(3px)'; paint(ctx, side, material * 1.1); ctx.filter = 'none';
      ctx.translate(side * 3, -3); paint(ctx, side, material * .8);
      ctx.restore();
    }
  } else {
    // One soft front fold climbs across the pawn, then drops below the new face.
    ctx.translate(0, -20 - 73 * ease(t / .42));
    ctx.filter = 'blur(1.3px)'; paint(ctx, 'fold', material * (1 - ease((t - .29) / .17)) * 1.4); ctx.filter = 'none';
  }
  ctx.restore();
}
const FLAKES = [{ x: -33, top: -105, drift: -6, size: 10, delay: .38, turn: -.6 }, { x: 31, top: -84, drift: 8, size: 8, delay: .43, turn: .6 }, { x: 13, top: -132, drift: 12, size: 11, delay: .48, turn: -.4 }];
function flakes(ctx: CanvasRenderingContext2D, foot: { x: number; y: number }, { t }: Frame) {
  for (const flake of FLAKES) {
    const u = clamp((t - flake.delay) / (1 - flake.delay));
    if (u <= 0 || u >= 1) continue;
    ctx.save();
    ctx.translate(foot.x + flake.x + flake.drift * u + Math.sin(u * Math.PI * 2) * 3, foot.y + flake.top * (1 - u * u));
    ctx.rotate(flake.turn + Math.sin(u * 5) * .45); ctx.scale(flake.size / 10, flake.size / 10);
    paint(ctx, 'flake', ease(u / .14) * (1 - ease((u - .55) / .45)));
    ctx.restore();
  }
}

/** The reveal on the promotion square, after the scene's own move brought the pawn there (the arrival). */
export class PromotionPlayback implements SceneEffect {
  readonly duration = ASCENSION_MS;
  /** The scene sees an empty promotion square; this effect draws the pawn and the chosen piece there. */
  readonly scene: { from: number; to: number; captures: number[] };
  private shown: Position;
  constructor(readonly before: Position, readonly move: Move, readonly after: Position) {
    const board = new Uint8Array(after.board); board[move.to] = 0;
    this.shown = { ...after, board };
    this.scene = { from: move.to, to: move.to, captures: [] };
  }
  position(t: number): Position { return t >= 1 ? this.after : this.shown; }
  draw(ctx: CanvasRenderingContext2D, scene: PaintedScene, layer: 'under' | 'over', row: number | undefined, t: number): void {
    if (t >= 1) return;
    const frame = ascension(t), foot = scene.foot(this.move.to);
    if (layer === 'under') { veil(ctx, foot, frame, false); return; }
    // The figures stay in their board row, under any figure in front of them.
    if (row !== scene.cell(this.move.to).row) return;
    if (frame.pawn > 0) scene.ghost(ctx, this.before.board[this.move.from], this.move.to, frame.pawn);
    if (frame.reveal > 0) scene.ghost(ctx, this.after.board[this.move.to], this.move.to, frame.reveal);
    veil(ctx, foot, frame, true);
    flakes(ctx, foot, frame);
  }
}
