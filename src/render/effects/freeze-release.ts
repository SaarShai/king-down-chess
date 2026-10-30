import { drawFreeze } from './materials';

export const FREEZE_RELEASE_MS = 620;
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const smooth = (n: number) => { n = clamp(n); return n * n * (3 - 2 * n); };
const hash = (n: number) => { const v = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
const W = 200, H = 220, X = 100, Y = 165;
function noise(x: number, y: number) {
  const a = Math.floor(x), b = Math.floor(y), u = smooth(x - a), v = smooth(y - b);
  const row = (j: number) => hash(a + j * 71) * (1 - u) + hash(a + 1 + j * 71) * u;
  return row(b) * (1 - v) + row(b + 1) * v;
}
const field = new Float32Array(W * H);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) field[y * W + x] = .08 + .65 * noise(x / 19, y / 21) + .2 * noise(x / 6, y / 6) + .07 * hash(x + y * W);
const cache = new Map<string, { canvas: HTMLCanvasElement; data: ImageData; work: ImageData }>();

/** The approved frost retreat uses the held material, with uneven loss and falling grains. */
export function drawFreezeRelease(ctx: CanvasRenderingContext2D, foot: { x: number; y: number }, front: boolean, t: number, seed: number): void {
  if (t >= 1) return;
  const key = `${seed}:${front}`;
  let src = cache.get(key);
  if (!src) {
    const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
    const paint = canvas.getContext('2d')!;
    drawFreeze(paint, { x: X, y: Y, front, progress: .42, seed });
    src = { canvas, data: paint.getImageData(0, 0, W, H), work: paint.createImageData(W, H) }; cache.set(key, src);
  }
  const data = src.work.data, original = src.data.data;
  data.set(original);
  for (let i = 0; i < field.length; i++) data[i * 4 + 3] = original[i * 4 + 3] * (1 - smooth((t - field[i] * .78) / .22));
  src.canvas.getContext('2d')!.putImageData(src.work, 0, 0);
  ctx.drawImage(src.canvas, foot.x - X, foot.y - Y);
  if (front) for (let i = 0; i < 45; i++) {
    const x = 64 + Math.floor(hash(i + 5) * 74), y = 111 + Math.floor(hash(i + 81) * 70), index = y * W + x;
    if (original[index * 4 + 3] < 60) continue;
    const age = clamp((t - field[index] * .55) / .45);
    ctx.save(); ctx.globalAlpha = Math.sin(age * Math.PI) * .85; ctx.fillStyle = '#ddf9ff';
    ctx.beginPath(); ctx.ellipse(foot.x + x - X + (hash(i + 23) - .5) * age * 15, foot.y + y - Y + age * age * 43, .7 + hash(i + 6) * 1.4, 1.6 + hash(i + 44) * 1.5, age + i, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
}
