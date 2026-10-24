import type { PaintedScene } from '../../../docs/2d-first-pieces/board/scene.mjs';
import type { Checker } from '../../move-text';
import kingIcon from '../../../public/ui/icons/king.svg?raw';
import { link } from './indications';

// Check (motion concepts, ticket 86): a warm edge marks each real checker, a rust wash presses in under the king and a
// seal lands beside him, all in one 440 ms onset. The cause lines stay still. The result holds with no idle motion.
// A legal move that ends check withdraws the wash in 220 ms; the seal and cause lines go at once.
export const CHECK_ONSET_MS = 440, CHECK_WITHDRAW_MS = 220;
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const ease = (n: number) => 1 - (1 - clamp(n)) ** 4;
const smooth = (n: number) => { n = clamp(n); return n * n * (3 - 2 * n); };

// Fixed bristle strokes leave dry gaps. The stamp never changes between frames.
let wash: HTMLCanvasElement | undefined;
function paint() {
  if (wash) return wash;
  wash = document.createElement('canvas'); wash.width = 320; wash.height = 180;
  const ctx = wash.getContext('2d')!;
  let seed = 71;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  ctx.lineCap = 'round';
  for (let i = 0; i < 190; i++) {
    const y = 29 + random() * 111, belly = Math.sin((y - 23) / 128 * Math.PI);
    const x = 34 + (1 - belly) * 43 + random() * 19, right = 282 - (1 - belly) * 37 - random() * 21;
    ctx.globalAlpha = .1 + random() * .23;
    ctx.strokeStyle = ['#692821', '#873126', '#9d402e', '#ae5b3e'][i % 4];
    ctx.lineWidth = 2 + random() * 10;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(100, y - 9 + random() * 11, 205, y + random() * 13, right, y - 3 + random() * 6); ctx.stroke();
  }
  for (let i = 0; i < 160; i++) {
    const x = 26 + random() * 270, y = 23 + random() * 125;
    ctx.globalCompositeOperation = i % 4 ? 'destination-out' : 'source-over';
    ctx.globalAlpha = .12 + random() * .25; ctx.strokeStyle = '#e6a373'; ctx.lineWidth = .4 + random() * 1.3;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 4 + random() * 26, y - 1 + random() * 3); ctx.stroke();
  }
  return wash;
}
let glyphs: Path2D[] | undefined;
const king = () => glyphs ??= [...kingIcon.matchAll(/<path d="([^"]+)"/g)].map(match => new Path2D(match[1]));

/** The rust wash under the king's feet. `press` 1 is the held size. */
export function drawWash(ctx: CanvasRenderingContext2D, foot: { x: number; y: number }, life: number, press: number, withdrawing = false): void {
  if (life <= 0) return;
  const image = paint(), spread = withdrawing ? 1 - press * .16 : 1.24 - .24 * press;
  ctx.save(); ctx.translate(foot.x, foot.y - 4); ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = life * .85; ctx.drawImage(image, -75 * spread, -53, 150 * spread, 78);
  ctx.globalAlpha = life * .54; ctx.drawImage(image, -57 * spread + (1 - press) * 12, -38, 110 * spread, 54);
  ctx.restore();
}

function drawSeal(ctx: CanvasRenderingContext2D, foot: { x: number; y: number }, ms: number, pixel: number) {
  const impression = ease((ms - 175) / 150);
  if (impression <= 0) return;
  const size = Math.max(42, 23 * pixel), scale = 1.12 - .12 * impression;
  ctx.save();
  ctx.translate(foot.x + 33, foot.y - 34 - (1 - impression) * 12); ctx.scale(scale, scale); ctx.globalAlpha *= impression;
  ctx.drawImage(paint(), -size * .75, -size * .84, size * 1.5, size * 1.72);
  ctx.scale(size / 48, size / 48); ctx.translate(-24, -24); ctx.fillStyle = '#f9e7bf';
  for (const path of king()) ctx.fill(path, 'evenodd');
  ctx.restore();
}

// The checkers' silhouettes in warm gold, cached per check. Drawn three times, a few pixels out, under the figures.
const edge = { key: '', canvas: undefined as HTMLCanvasElement | undefined, scale: 1 };
function checkerEdge(scene: PaintedScene, board: ArrayLike<number>, checkers: readonly Checker[], flipped: string) {
  const scale = Math.max(1, Math.min(2, globalThis.devicePixelRatio || 1)), key = `${flipped}:${scale}:${checkers.map(c => `${c.sq}:${board[c.sq]}`)}`;
  if (edge.key === key && edge.canvas) return edge;
  const canvas = edge.canvas ?? document.createElement('canvas');
  canvas.width = Math.round(960 * scale); canvas.height = Math.round((960 + scene.headroom) * scale);
  const ctx = canvas.getContext('2d')!;
  // Board units, as the scene draws them: the headroom above the board keeps a back-rank head.
  ctx.setTransform(scale, 0, 0, scale, 0, scale * scene.headroom); ctx.clearRect(0, -scene.headroom, 960, 960 + scene.headroom);
  ctx.globalCompositeOperation = 'source-over';
  for (const checker of checkers) scene.ghost(ctx, board[checker.sq], checker.sq, 1);
  ctx.globalCompositeOperation = 'source-in'; ctx.fillStyle = '#e5aa59'; ctx.fillRect(0, -scene.headroom, 960, 960 + scene.headroom);
  Object.assign(edge, { key, canvas, scale });
  return edge;
}

export interface CheckDraw {
  /** The checked king's square, and the real checkers from the shown position. */
  king: number;
  checkers: readonly Checker[];
  /** The shown board, for the checkers' edge; without it the onset has no edge. */
  board?: ArrayLike<number>;
  /** Milliseconds since the onset; Infinity for a held check (reduced motion, resync). */
  ms: number;
  /** Scene units per CSS pixel. */
  pixel: number;
}

/** One layer of a check: the wash and checker edge under the figures, the seal in the king's row, the cause lines last. */
export function drawCheck(ctx: CanvasRenderingContext2D, scene: PaintedScene, layer: 'under' | 'over', row: number | undefined, check: CheckDraw): void {
  const foot = scene.foot(check.king), ms = check.ms;
  if (layer === 'under') {
    drawWash(ctx, foot, smooth(ms / 85), ease((ms - 45) / 290));
    const shine = smooth(ms / 55) * (1 - smooth((ms - 110) / 160));
    if (shine > 0 && check.checkers.length && check.board) {
      // The board's flip decides each silhouette's place; the cache follows it.
      const flipped = String(scene.foot(0).y > scene.foot(63).y), cached = checkerEdge(scene, check.board, check.checkers, flipped);
      ctx.save(); ctx.globalAlpha *= shine * .85;
      const offset = Math.max(3, check.pixel), width = cached.canvas!.width / cached.scale, height = cached.canvas!.height / cached.scale;
      ctx.translate(0, -scene.headroom);
      for (const [x, y] of [[-offset, 0], [offset, 0], [0, -offset]]) ctx.drawImage(cached.canvas!, x, y, width, height);
      ctx.restore();
    }
    return;
  }
  if (row === scene.cell(check.king).row) drawSeal(ctx, foot, ms, check.pixel);
  if (row === 7) {
    ctx.save(); ctx.globalAlpha *= .9;
    // The full cause stays still: no travelling attack or growing path.
    for (const checker of check.checkers) link(ctx, scene, checker.sq, checker.king, '#b84d25', checker.path === 'arc');
    ctx.restore();
  }
}

/** The wash of a check that a legal move just ended, on the king's old square. `progress` runs 0..1 over CHECK_WITHDRAW_MS. */
export function drawWithdrawal(ctx: CanvasRenderingContext2D, scene: PaintedScene, king: number, progress: number): void {
  if (progress < 1) drawWash(ctx, scene.foot(king), 1 - ease(progress), smooth(progress), true);
}
