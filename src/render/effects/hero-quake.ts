import { PAD, TILE, type PaintedScene } from '../painted/scene.mjs';
import type { CardFrame, CardLayer, Point } from './card-types';
import { quakeStamps, rand, stamp } from './hero-stamps';

const TAU = Math.PI * 2;
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const ease = (t: number) => { t = clamp(t); return t * t * (3 - 2 * t); };
// Card clock. The shoved figures start to slide at .22, so the ground breaks on that beat.
const BEAT = .2, SETTLE = .7;
const SQUASH = .86;

/** How far a shoved figure jumps at the beat: damped hops inside its slide, zero at both ends. */
export function quakeJolt(t: number): number {
  const k = (t - .22) / .4;
  return k <= 0 || k >= 1 ? 0 : 30 * Math.abs(Math.sin(k * Math.PI * 3)) * (1 - k) ** 1.4;
}

// One broken pattern for all casts. Geometry only; it costs nothing per frame beyond the paths.
interface Crack { x: number[]; y: number[]; w: number[]; delay: number }
function spine(x0: number, y0: number, angle: number, length: number, width: number, seed: number, delay: number): Crack {
  const n = Math.max(4, Math.round(length / 17)), c: Crack = { x: [x0], y: [y0], w: [width * .7], delay };
  // The heading walks: a crack zigzags and bends, so the whole never reads as a drawn star.
  let drift = 0;
  for (let j = 1; j <= n; j++) {
    const s = j / n;
    drift = drift * .55 + (rand(j, seed) - .5) * .95;
    const heading = angle + drift + (j % 2 ? .34 : -.34) * (.4 + rand(j, seed + 2));
    c.x.push(c.x[j - 1] + Math.cos(heading) * length / n); c.y.push(c.y[j - 1] + Math.sin(heading) * length / n * SQUASH);
    c.w.push(width * (.3 + .7 * (1 - s)) * Math.min(1, (1 - s) * 3.4) * (.62 + rand(j, seed + 1) * .76));
  }
  return c;
}
const MAIN = 7;
const CRACKS: Crack[] = Array.from({ length: MAIN }, (_, i) => {
  const angle = i / MAIN * TAU + (rand(i, 51) - .5) * .6, start = 5 + rand(i, 59) * 12;
  return spine(Math.cos(angle + .9) * start, Math.sin(angle + .9) * start * SQUASH, angle, 100 + rand(i, 52) ** 1.5 * 84, 15 + rand(i, 53) * 15, i + 60, rand(i, 54) * .035);
});
for (const i of [0, 1, 3, 4, 6]) {
  const from = CRACKS[i], at = 3 + (i % 3), side = i % 2 ? 1 : -1;
  CRACKS.push(spine(from.x[at], from.y[at], i / MAIN * TAU + side * .95, 46 + rand(i, 55) * 34, 9 + rand(i, 56) * 4, i + 80, .05));
}
// A wedge of the tile between two neighbouring main cracks.
interface Slab { points: Point[]; pivot: Point; cx: number; cy: number; tilt: number; rise: number; angle: number }
const SLABS: Slab[] = Array.from({ length: MAIN }, (_, i) => {
  const a = CRACKS[i], b = CRACKS[(i + 1) % MAIN], reach = 4, raw: Point[] = [];
  for (let j = 1; j <= reach; j++) raw.push({ x: a.x[j], y: a.y[j] });
  for (let j = reach; j >= 1; j--) raw.push({ x: b.x[j], y: b.y[j] });
  const cx = raw.reduce((n, p) => n + p.x, 0) / raw.length, cy = raw.reduce((n, p) => n + p.y, 0) / raw.length, inset = .86;
  const points = raw.map(p => ({ x: cx + (p.x - cx) * inset, y: cy + (p.y - cy) * inset }));
  const out = Math.hypot(cx, cy) || 1;
  return { points, pivot: { x: cx * 1.5, y: cy * 1.5 }, cx: cx / out, cy: cy / out, tilt: (i % 2 ? 1 : -1) * (.1 + rand(i, 57) * .1), rise: 15 + rand(i, 58) * 13, angle: i };
});
function trace(ctx: CanvasRenderingContext2D, c: Crack, reach: number, wide: number, dx: number, dy: number) {
  const n = c.x.length - 1, last = reach * n, top = Math.min(n, Math.floor(last)), frac = last - top;
  const tipX = top < n ? c.x[top] + (c.x[top + 1] - c.x[top]) * frac : c.x[n], tipY = top < n ? c.y[top] + (c.y[top + 1] - c.y[top]) * frac : c.y[n];
  const width = (j: number) => c.w[j] * wide * Math.min(1, (last - j) / 2) * .5;
  ctx.moveTo(c.x[0] + dx, c.y[0] + dy);
  for (let j = 0; j <= top; j++) {
    const px = j < n ? -(c.y[j + 1] - c.y[j]) : -(c.y[j] - c.y[j - 1]), py = j < n ? c.x[j + 1] - c.x[j] : c.x[j] - c.x[j - 1], l = Math.hypot(px, py) || 1, h = width(j);
    ctx.lineTo(c.x[j] + px / l * h + dx, c.y[j] + py / l * h + dy);
  }
  ctx.lineTo(tipX + dx, tipY + dy);
  for (let j = top; j >= 0; j--) {
    const px = j < n ? -(c.y[j + 1] - c.y[j]) : -(c.y[j] - c.y[j - 1]), py = j < n ? c.x[j + 1] - c.x[j] : c.x[j] - c.x[j - 1], l = Math.hypot(px, py) || 1, h = width(j);
    ctx.lineTo(c.x[j] - px / l * h + dx, c.y[j] - py / l * h + dy);
  }
  ctx.closePath();
}
/** Fills all cracks as one shape, so overlaps at the centre do not double. */
function layer(ctx: CanvasRenderingContext2D, t: number, wide: number, dx: number, dy: number, colour: string) {
  ctx.beginPath();
  for (const c of CRACKS) {
    const reach = 1 - (1 - clamp((t - .07 - c.delay) / .17)) ** 2;
    if (reach > 0) trace(ctx, c, reach, wide, dx, dy);
  }
  ctx.fillStyle = colour; ctx.fill('nonzero');
}
const outline = (ctx: CanvasRenderingContext2D, points: Point[], dx = 0, dy = 0) => {
  ctx.beginPath();
  points.forEach((p, i) => i ? ctx.lineTo(p.x + dx, p.y + dy) : ctx.moveTo(p.x + dx, p.y + dy));
  ctx.closePath();
};

// The painted floor under the cast, copied once when the cast begins. The slabs are that same floor.
const FLOOR_R = 118, FLOOR_DENSITY = 2;
let floor: { canvas: HTMLCanvasElement; owner: CardFrame | null } | undefined;
function floorUnder(ctx: CanvasRenderingContext2D, event: CardFrame, c: Point) {
  const size = FLOOR_R * 2 * FLOOR_DENSITY;
  floor ??= { canvas: Object.assign(document.createElement('canvas'), { width: size, height: size }), owner: null };
  if (floor.owner !== event) {
    floor.owner = event;
    const m = ctx.getTransform(), g = floor.canvas.getContext('2d')!;
    g.clearRect(0, 0, size, size);
    g.drawImage(ctx.canvas, (c.x - FLOOR_R) * m.a + m.e, (c.y - FLOOR_R) * m.d + m.f, FLOOR_R * 2 * m.a, FLOOR_R * 2 * m.d, 0, 0, size, size);
  }
  return floor.canvas;
}
function groundDust(ctx: CanvasRenderingContext2D, x: number, y: number, k: number, i: number, size: number) {
  if (k <= 0 || k >= 1) return;
  const dust = quakeStamps().dust;
  stamp(ctx, dust[i % 3], x, y - ease(k) * 26, size * (.5 + k * .8), i + k, ease(k / .14) * (1 - ease((k - .35) / .65)) * .95, .8);
}

export function drawQuake(ctx: CanvasRenderingContext2D, scene: PaintedScene, event: CardFrame, side: CardLayer) {
  const { t, move, travel: u } = event, foot = scene.foot(move.from), c = { x: foot.x, y: foot.y - 40 }, set = quakeStamps();
  const alive = 1 - ease((t - .84) / .16), wide = ease((t - .07) / .11) * (1 - ease((t - SETTLE) / .24) * .55);
  if (side === 'under') {
    const image = floorUnder(ctx, event, c);
    ctx.save();
    ctx.beginPath(); ctx.rect(PAD, PAD, 8 * TILE, 8 * TILE); ctx.clip();
    ctx.translate(c.x, c.y); ctx.globalAlpha = alive;
    if (t > .06) {
      // Depth: a lit lower lip, a dark wall, a lit far wall, and a black core.
      layer(ctx, t, wide * 1.06, 2, 4.5, '#efdcae');
      layer(ctx, t, wide * 1.12, 0, 0, '#2c1a0f');
      layer(ctx, t, wide * .86, 0, 1.6, '#6a4c33');
      layer(ctx, t, wide * .68, -.4, -1, '#0d0603');
    }
    // Slabs of the real floor lift on the beat, tremble, and settle back flat into their places.
    for (const [i, s] of SLABS.entries()) {
      const lift = ease((t - BEAT - i * .004) / .045) * (1 - ease((t - SETTLE + i * .006) / .17)), shake = Math.sin(t * 74 + i * 2) * (1 - ease((t - BEAT) / .4));
      const before = t < BEAT ? ease((t - .02) / .16) * .07 : 0, a = lift * (1 + Math.sin((t - BEAT) * 60 + i) * .07 * (1 - ease((t - BEAT) / .25))) + before;
      if (a <= .002) continue;
      const up = s.rise * a, thick = 3 + a * 11, ox = s.cx * a * 5 + shake * a * 1.2, oy = -up + s.cy * a * 3;
      outline(ctx, s.points, 0, 2); ctx.fillStyle = `rgba(13,6,3,${Math.min(.82, a * 1.5)})`; ctx.fill();
      ctx.save(); ctx.translate(ox + s.pivot.x, oy + s.pivot.y); ctx.rotate(s.tilt * a); ctx.transform(1, 0, s.tilt * a * .5, 1 - .1 * a, 0, 0); ctx.translate(-s.pivot.x, -s.pivot.y);
      outline(ctx, s.points, 0, thick); ctx.fillStyle = '#5a3f28'; ctx.fill();
      ctx.save(); outline(ctx, s.points); ctx.clip(); ctx.drawImage(image, -FLOOR_R, -FLOOR_R, FLOOR_R * 2, FLOOR_R * 2);
      ctx.fillStyle = `rgba(255,236,196,${(s.tilt > 0 ? .3 : .12) * Math.min(1, a)})`; ctx.fillRect(-FLOOR_R, -FLOOR_R, FLOOR_R * 2, FLOOR_R * 2); ctx.restore();
      outline(ctx, s.points); ctx.lineJoin = 'round'; ctx.lineWidth = 2.2; ctx.strokeStyle = `rgba(240,220,172,${.8 * clamp((a - .1) * 2.5)})`; ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
    // Rock shadows, then far dust.
    for (let i = 0; i < 12; i++) { const r = rockAt(i, t, c); if (r) stamp(ctx, set.soft, r.x, r.floor, r.size * 1.1, 0, r.alpha * .8, .4); }
    for (let i = 0; i < 18; i++) { const d = dustAt(i, t, c); if (d.y < c.y) groundDust(ctx, d.x, d.y, d.k, i, d.size); }
    // A shoved figure drags dust across the floor and lands in it.
    for (const push of move.pushes ?? []) {
      const a = scene.foot(push.from), b = scene.foot(push.to);
      for (let i = 0; i < 6; i++) {
        const k = (t - .24 - i * .05) / .3, at = ease((.24 + i * .05 - .22) / .4);
        groundDust(ctx, a.x + (b.x - a.x) * at + (rand(i, 71) - .5) * 26, a.y + (b.y - a.y) * at - 4, k, i, .4 + rand(i, 72) * .14);
      }
      if (u > 0) for (let i = 0; i < 5; i++) groundDust(ctx, b.x + (rand(i, 73) - .5) * 58, b.y - 2 + (rand(i, 74) - .5) * 16, (t - .58 - i * .012) / .3, i + 2, .44 + rand(i, 75) * .16);
    }
    return;
  }
  // Near dust rolls in front of the figures; the rocks fly over everything.
  for (let i = 0; i < 18; i++) { const d = dustAt(i, t, c); if (d.y >= c.y) groundDust(ctx, d.x, d.y, d.k, i, d.size); }
  for (let i = 0; i < 26; i++) {
    const r = rockAt(i, t, c);
    if (r) stamp(ctx, set.rocks[i % 5], r.x, r.y, r.size, r.spin, r.alpha);
  }
}
function dustAt(i: number, t: number, c: Point) {
  const crack = CRACKS[i % CRACKS.length], at = Math.min(crack.x.length - 1, Math.floor(crack.x.length * (.45 + rand(i, 61) * .55)));
  return { x: c.x + crack.x[at], y: c.y + crack.y[at], k: (t - BEAT - rand(i, 62) * .1) / (.42 + rand(i, 63) * .14), size: .78 + rand(i, 64) * .5 };
}
/** A rock thrown out of the break: a high arc, one small bounce, then it rests and fades. */
function rockAt(i: number, t: number, c: Point) {
  const k = (t - BEAT - rand(i, 65) * .05) / (.3 + rand(i, 66) * .12);
  if (k <= 0) return null;
  const angle = rand(i, 67) * TAU, reach = 30 + rand(i, 68) * 128, flight = Math.min(k, 1), rest = clamp((k - 1) / .4);
  const r = reach * (1 - (1 - flight) ** 1.3) + rest * 10;
  const height = (i < 12 ? 150 : 74) * (.45 + rand(i, 69) * .55) * 4 * flight * (1 - flight) + 13 * 4 * rest * (1 - rest);
  const alpha = ease(k / .05) * (1 - ease((t - .78) / .17));
  if (alpha <= 0) return null;
  const x = c.x + Math.cos(angle) * r, ground = c.y + Math.sin(angle) * r * SQUASH;
  return { x, y: ground - height, floor: ground, size: i < 8 ? .62 + rand(i, 70) * .34 : .28 + rand(i, 70) * .3, spin: i * 2 + (flight + rest * .2) * (rand(i, 71) - .5) * 14, alpha };
}
