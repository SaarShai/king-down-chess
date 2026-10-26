import { drawFreeze, drawIceWall } from '../../../../../../src/render/effects/materials';
import { drawShelter } from '../../../../../../src/render/effects/state-flare';
const clamp = n => Math.max(0, Math.min(1, n));
const smooth = n => { n = clamp(n); return n * n * (3 - 2 * n); };
const hash = n => { const v = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
const W = 200, H = 220, X = 100, Y = 165;
function noise(x, y) {
  const a = Math.floor(x), b = Math.floor(y), u = smooth(x - a), v = smooth(y - b);
  const row = j => hash(a + j * 71) * (1 - u) + hash(a + 1 + j * 71) * u;
  return row(b) * (1 - v) + row(b + 1) * v;
}
const field = new Float32Array(W * H);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) field[y * W + x] = .08 + .65 * noise(x / 19, y / 21) + .2 * noise(x / 6, y / 6) + .07 * hash(x + y * W);
const cache = new Map();
function material(kind, front) {
  const key = `${kind}:${front}`;
  if (cache.has(key)) return cache.get(key);
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  (kind === 'freeze' ? drawFreeze : drawIceWall)(ctx, { x: X, y: Y, front, progress: .42, seed: kind === 'freeze' ? 35 : 24 });
  const data = ctx.getImageData(0, 0, W, H);
  const value = { canvas, data, work: ctx.createImageData(W, H) }; cache.set(key, value); return value;
}
function frost(ctx, foot, front, t) {
  const src = material('freeze', front), data = src.work.data, original = src.data.data;
  data.set(original);
  for (let i = 0; i < field.length; i++) data[i * 4 + 3] = original[i * 4 + 3] * (1 - smooth((t - field[i] * .78) / .22));
  const c = src.canvas.getContext('2d'); c.putImageData(src.work, 0, 0);
  ctx.drawImage(src.canvas, foot.x - X, foot.y - Y);
  if (front) for (let i = 0; i < 45; i++) {
    const x = 64 + Math.floor(hash(i + 5) * 74), y = 111 + Math.floor(hash(i + 81) * 70), index = y * W + x;
    if (original[index * 4 + 3] < 60) continue;
    const age = clamp((t - field[index] * .55) / .45);
    ctx.save(); ctx.globalAlpha = Math.sin(age * Math.PI) * .85; ctx.fillStyle = '#ddf9ff';
    ctx.beginPath(); ctx.ellipse(foot.x + x - X + (hash(i + 23) - .5) * age * 15, foot.y + y - Y + age * age * 43, .7 + hash(i + 6) * 1.4, 1.6 + hash(i + 44) * 1.5, age + i, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
}
function wall(ctx, foot, front, t) {
  const src = material('ward', front);
  // Each strip follows one real plate. It keeps the production paint and cap.
  for (let i = 0; i < 8; i++) {
    const start = front ? 0 : Math.PI, a = start + i * Math.PI / 8, b = start + (i + 1) * Math.PI / 8;
    const x0 = Math.cos(a) * 62, x1 = Math.cos(b) * 62, left = Math.min(x0, x1), width = Math.abs(x1 - x0), center = (x0 + x1) / 2;
    const local = smooth((t - hash(i + (front ? 3 : 8)) * .12) / .88);
    ctx.save(); ctx.translate(foot.x + center + center * local * .35, foot.y + (hash(i + 71) - .5) * local * 14);
    ctx.scale(1 - local * .8, 1); ctx.globalAlpha = 1 - smooth(local);
    ctx.drawImage(src.canvas, X + left, 0, width, H, -width / 2, -Y, width, H); ctx.restore();
  }
}
export function drawRelease(ctx, scene, sample, front, t) {
  if (t >= 1) return;
  const foot = scene.foot(sample.target);
  if (sample.kind === 'freeze') frost(ctx, foot, front, t);
  else if (sample.kind === 'ward') wall(ctx, foot, front, t);
  else {
    const old = scene.foot(sample.source), gather = smooth(t / .42), lift = smooth((t - .19) / .81);
    const dx = old.x - foot.x, dy = old.y - foot.y, key = `shelter:${front}:${dx}:${dy}`;
    if (!cache.has(key)) {
      const image = document.createElement('canvas'); image.width = image.height = 600;
      drawShelter(image.getContext('2d'), { x: 300 + dx, y: 300 + dy }, { x: 300, y: 300 }, { progress: 1, front, reduced: false });
      cache.set(key, image);
    }
    ctx.save(); ctx.translate(foot.x, foot.y - lift * 64); ctx.scale(1 - gather * .55, 1 - gather * .18);
    ctx.globalAlpha = 1 - smooth((t - .15) / .85);
    ctx.drawImage(cache.get(key), -300, -300); ctx.restore();
  }
}
