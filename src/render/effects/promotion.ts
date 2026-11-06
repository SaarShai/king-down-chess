import type { PaintedScene, SceneEffect } from '../../../docs/2d-first-pieces/board/scene.mjs';
import type { Move, Position } from '../../rules/engine';

// The promotion: after the pawn arrives, a column of gold light rises from its feet and a burst fills the square. Both
// are opaque at the swap, so the pawn and the chosen piece never show together. The column then narrows and clears to the
// new piece, and gold motes fall. Reduced motion and Animations Off show the chosen piece at once.
export const ASCENSION_MS = 740;
/** The fraction of ASCENSION_MS at which the figures change, behind the opaque burst. */
export const ASCENSION_SWAP = .36;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t); };

/** The reveal at `t` (0..1 of ASCENSION_MS). Exactly one figure shows; the change happens at the opaque peak. */
export function ascension(t: number) {
  t = clamp(t);
  const reveal = t >= ASCENSION_SWAP ? 1 : 0;
  return { t, reveal, pawn: 1 - reveal, material: ease(t / .24) * (1 - ease((t - .46) / .5)) };
}
type Frame = ReturnType<typeof ascension>;

interface Sprites { column: HTMLCanvasElement; burst: HTMLCanvasElement; pool: HTMLCanvasElement; mote: HTMLCanvasElement }
let sprites: Sprites | undefined;
let loading: Promise<void> | undefined;
const sheet = (w: number, h: number) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')!] as const; };

function makeSprites(): Sprites {
  // The column: an opaque core with an amber edge that reads on both square colours; the top fades out.
  const [column, a] = sheet(128, 256), across = a.createLinearGradient(0, 0, 128, 0);
  for (const [at, colour] of [[0, 'rgba(214,132,18,0)'], [.12, 'rgba(226,142,22,.75)'], [.2, '#f2b02e'], [.32, '#ffdf7e'], [.44, '#fff8dc'], [.56, '#fff8dc'], [.68, '#ffdf7e'], [.8, '#f2b02e'], [.88, 'rgba(226,142,22,.75)'], [1, 'rgba(214,132,18,0)']] as const) across.addColorStop(at, colour);
  a.fillStyle = across; a.fillRect(0, 0, 128, 256);
  a.globalCompositeOperation = 'destination-in';
  const up = a.createLinearGradient(0, 0, 0, 256);
  up.addColorStop(0, 'rgba(0,0,0,0)'); up.addColorStop(.3, '#000'); up.addColorStop(.95, '#000'); up.addColorStop(1, 'rgba(0,0,0,.4)');
  a.fillStyle = up; a.fillRect(0, 0, 128, 256);
  // The burst: opaque to two thirds of its radius, then amber.
  const [burst, b] = sheet(256, 256), round = b.createRadialGradient(128, 128, 0, 128, 128, 128);
  for (const [at, colour] of [[0, '#ffffff'], [.42, '#fffbe6'], [.66, '#ffe48c'], [.78, 'rgba(244,176,48,.8)'], [.9, 'rgba(226,142,22,.28)'], [1, 'rgba(214,132,18,0)']] as const) round.addColorStop(at, colour);
  b.fillStyle = round; b.fillRect(0, 0, 256, 256);
  // The pool of light on the floor.
  const [pool, c] = sheet(256, 128); c.scale(1, .5);
  const floor = c.createRadialGradient(128, 128, 0, 128, 128, 128);
  for (const [at, colour] of [[0, 'rgba(255,240,180,1)'], [.45, 'rgba(250,196,72,.9)'], [.75, 'rgba(226,142,22,.5)'], [1, 'rgba(214,132,18,0)']] as const) floor.addColorStop(at, colour);
  c.fillStyle = floor; c.fillRect(0, 0, 256, 256);
  // A mote with body: a white heart in amber.
  const [mote, d] = sheet(32, 32), spark = d.createRadialGradient(16, 16, 0, 16, 16, 16);
  for (const [at, colour] of [[0, '#ffffff'], [.35, '#ffe48c'], [.7, 'rgba(236,158,30,.85)'], [1, 'rgba(214,132,18,0)']] as const) spark.addColorStop(at, colour);
  d.fillStyle = spark; d.fillRect(0, 0, 32, 32);
  return { column, burst, pool, mote };
}

/** Makes the light sprites once. Until they exist the reveal changes the figure with no light. */
export function loadAscension(): Promise<void> {
  return loading ??= (async () => { sprites = makeSprites(); })().catch(() => { loading = undefined; });
}

function under(ctx: CanvasRenderingContext2D, foot: { x: number; y: number }, { t }: Frame) {
  if (!sprites) return;
  const grow = ease(t / .3), size = 150 + 110 * ease((t - ASCENSION_SWAP) / .4), alpha = grow * (1 - ease((t - .55) / .43));
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha *= alpha;
  ctx.drawImage(sprites.pool, foot.x - size / 2, foot.y + 4 - size / 4, size, size / 2);
  ctx.restore();
}

function light(ctx: CanvasRenderingContext2D, foot: { x: number; y: number }, { t, material }: Frame) {
  if (!sprites || material <= 0) return;
  const open = ease((t - .44) / .42), width = 176 * (.42 + .58 * ease(t / .2)) * (1 - .88 * open), height = 350 * ease(t / .24) + 60 * open;
  ctx.save();
  // The column clears from the feet up as it narrows.
  ctx.globalAlpha *= 1 - ease((t - .74) / .24);
  ctx.drawImage(sprites.column, foot.x - width / 2, foot.y + 20 - height - 90 * open, width, height);
  ctx.restore();
  const radius = 120 * (.34 + .66 * ease((t - .05) / .23)), alpha = ease((t - .04) / .16) * (1 - ease((t - .42) / .3));
  if (alpha > 0) {
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.drawImage(sprites.burst, foot.x - radius, foot.y - 64 - radius, radius * 2, radius * 2);
    ctx.restore();
  }
}

// Each mote: where it leaves the burst, how far it flies out, how high it rises, its size and start.
const MOTES = [[-44, -62, 44, 13, .44], [44, 58, 58, 12, .46], [-58, -44, 96, 10, .49], [56, 42, 108, 11, .47], [-30, -24, 146, 12, .52], [26, 26, 132, 10, .5], [-62, -70, 8, 9, .45], [60, 76, 20, 9, .48]] as const;
function motes(ctx: CanvasRenderingContext2D, foot: { x: number; y: number }, { t }: Frame) {
  if (!sprites) return;
  for (const [x, out, rise, size, start] of MOTES) {
    const u = clamp((t - start) / (1 - start));
    if (u <= 0 || u >= 1) continue;
    const fly = 1 - (1 - u) * (1 - u), s = size * ease(u / .12) * (1 - .35 * u);
    ctx.save(); ctx.globalAlpha *= 1 - ease((u - .6) / .4);
    ctx.drawImage(sprites.mote, foot.x + x + out * fly - s, foot.y - 66 - rise * fly + 90 * u * u - s, s * 2, s * 2);
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
    if (layer === 'under') { under(ctx, foot, frame); return; }
    // The figures stay in their board row, under any figure in front of them.
    if (row !== scene.cell(this.move.to).row) return;
    if (frame.pawn) scene.ghost(ctx, this.before.board[this.move.from], this.move.to, 1);
    else scene.ghost(ctx, this.after.board[this.move.to], this.move.to, 1);
    light(ctx, foot, frame);
    motes(ctx, foot, frame);
  }
}
