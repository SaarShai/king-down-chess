import type { CardLayer, Point } from './card-types';
import { paintBurst, paintChar, paintEmber, paintFlame, paintSmoke } from './fire-art';

// The kings' travel materials: flame, wind and embers, cloud, earth. Every part is a sprite painted once and stamped;
// each function takes an age in ms, so it grows, travels and fades over many frames at any clock.
export const clamp = (n: number) => Math.max(0, Math.min(1, n));
export const ease = (n: number) => { const t = clamp(n); return t * t * (3 - 2 * t); };
export const rand = (i: number, seed = 0) => { const n = Math.sin(i * 127.1 + seed * 311.7 + .5) * 43758.5453; return n - Math.floor(n); };
const TAU = Math.PI * 2;
/** Backing pixels per board pixel, for a 2x board. */
const DENSITY = 2;
interface Sprite { canvas: HTMLCanvasElement; w: number; h: number }
type Paint = (g: CanvasRenderingContext2D) => void;
function paint(w: number, h: number, draw: Paint): Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = w * DENSITY; canvas.height = h * DENSITY;
  const g = canvas.getContext('2d')!;
  g.scale(DENSITY, DENSITY); draw(g);
  return { canvas, w, h };
}
const once = <T>(make: () => T) => { let value: T | undefined; return () => value ??= make(); };
function soft(g: CanvasRenderingContext2D, x: number, y: number, r: number, inner: string, outer: string, hold = .55) {
  const f = g.createRadialGradient(x, y, 0, x, y, r);
  f.addColorStop(0, inner); f.addColorStop(hold, inner); f.addColorStop(1, outer);
  g.fillStyle = f; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
}
function stamp(ctx: CanvasRenderingContext2D, s: Sprite, x: number, y: number, sx: number, sy: number, alpha: number, ay = .5) {
  if (alpha <= .004 || sx <= .01 || sy <= .01) return;
  const w = s.w * sx, h = s.h * sy;
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.drawImage(s.canvas, x - w / 2, y - h * ay, w, h);
}
function stampTurned(ctx: CanvasRenderingContext2D, s: Sprite, x: number, y: number, sx: number, sy: number, angle: number, alpha: number, ax = .5, ay = .5) {
  if (alpha <= .004 || sx <= .01 || sy <= .01) return;
  ctx.save(); ctx.globalAlpha = Math.min(1, alpha); ctx.translate(x, y); ctx.rotate(angle);
  ctx.drawImage(s.canvas, -s.w * sx * ax, -s.h * sy * ay, s.w * sx, s.h * sy); ctx.restore();
}

// Flame -------------------------------------------------------------------------------------------------------------
/** One painted flame on the ground at x, y that rises from the stone, stands and sinks back over its life. */
export function flameAt(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, age: number, life: number, seed: number) {
  if (age <= 0 || age >= life) return;
  const grow = ease(age / (life * .22)), die = ease((age - life * .5) / (life * .5));
  paintFlame(ctx, x, y, 72 * size * (.6 + grow * .4) * (1 - die * .3), 112 * size * grow * (1 - die * .78), age + rand(seed, 7) * 640, seed, 1 - ease((age - life * .8) / (life * .2)));
}
export function smokeAt(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, age: number, life: number, seed: number) {
  if (age <= 0 || age >= life) return;
  const k = age / life;
  paintSmoke(ctx, x + (rand(seed, 9) - .5) * 22 * k, y - k * 62, size * (.45 + k * .6), seed, ease(age / 110) * (1 - ease((k - .35) / .65)) * .85);
}
export function scorchAt(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, alpha: number, seed = 0) {
  paintChar(ctx, x, y, 128 * size, seed, alpha);
}
/** Embers and ash that rise from a point and cool; `count` sets the density and a seed keeps each path fixed. */
export function emberRise(ctx: CanvasRenderingContext2D, p: Point, age: number, life: number, count: number, reach: number, seed: number) {
  for (let i = 0; i < count; i++) {
    const own = age - rand(i, seed) * life * .25, span = life * (.6 + rand(i, seed + 1) * .4);
    if (own <= 0 || own >= span) continue;
    const k = own / span, open = 1 - (1 - k) ** 2, angle = rand(i, seed + 2) * TAU;
    paintEmber(ctx, p.x + Math.cos(angle) * reach * open * (.4 + rand(i, seed + 3) * .6), p.y - 8 + Math.sin(angle) * reach * .3 * open - (40 + rand(i, seed + 4) * 70) * open + k * k * 22,
      7 + rand(i, seed + 5) * 8, k * 5 * (rand(i, seed + 6) - .5), i + seed, ease(own / 40) * (1 - k * k));
  }
}
/** Ignition at a start foot: the stone cracks, flames rise round the figure and sink when it leaves. */
export function ignite(ctx: CanvasRenderingContext2D, p: Point, age: number, leave: number, layer: CardLayer, seed: number) {
  const fade = 1 - ease((age - leave) / 340);
  if (fade <= 0 || age <= 0) return;
  const life = Math.max(leave + 340, 500);
  if (layer === 'under') {
    scorchAt(ctx, p.x, p.y, 1.05, ease(age / 200) * (1 - ease((age - leave - 320) / 620)), seed);
    for (let i = 0; i < 5; i++) {
      const angle = TAU * i / 5 + rand(i, seed) + Math.PI, own = age - rand(i, seed + 1) * 70;
      flameAt(ctx, p.x + Math.cos(angle) * 42, p.y + Math.sin(angle) * 14 - 3, .6 + rand(i, seed + 2) * .28, own, life, seed + i);
    }
  } else {
    for (let i = 0; i < 2; i++) flameAt(ctx, p.x + (i ? 34 : -34), p.y + 14, .34, age - i * 30, life, seed + 20 + i);
    emberRise(ctx, p, age, life + 240, 6, 46, seed + 30);
  }
}
/** A flame-charged landing: a painted burst stands up round the figure, the stone stays burnt, embers fly. `size` scales the blast. */
export function fireBurst(ctx: CanvasRenderingContext2D, p: Point, age: number, layer: CardLayer, seed: number, size = 1) {
  if (age <= 0 || age > 1050) return;
  const open = 1 - (1 - clamp(age / 300)) ** 2;
  if (layer === 'under') {
    scorchAt(ctx, p.x, p.y + 2, 1.5 * size, ease(age / 70) * (1 - ease((age - 620) / 430)), seed);
    paintBurst(ctx, p.x, p.y + 16 * size, age / 700, 1.28 * size, ease(age / 40));
    for (let i = 0; i < 3; i++) smokeAt(ctx, p.x + (i - 1) * 40 * size, p.y - 64 * size, 1.1 * size, age - 320 - i * 50, 720, seed + i);
  } else {
    for (let i = 0; i < 3; i++) {
      const side = i - 1;
      flameAt(ctx, p.x + side * 52 * size * (.45 + open * .55), p.y + (22 - Math.abs(side) * 9) * size, (.46 - Math.abs(side) * .06) * size, age - Math.abs(side) * 40, 520, seed + 40 + i);
    }
    emberRise(ctx, p, age, 950, Math.round(14 * size), 118 * size, seed + 50);
  }
}

const shade = once(() => paint(96, 40, g => {
  const f = g.createRadialGradient(48, 20, 0, 48, 20, 48);
  f.addColorStop(0, '#1d150dc4'); f.addColorStop(.55, '#1d150d7a'); f.addColorStop(1, '#1d150d00');
  g.save(); g.translate(0, 10); g.scale(1, .42); g.fillStyle = f; g.fillRect(0, -24, 96, 96); g.restore();
}));
/** The shadow an airborne figure throws on the stone. */
export function groundShade(ctx: CanvasRenderingContext2D, x: number, y: number, lift: number) {
  const k = 1 - clamp(lift / 190) * .42;
  stamp(ctx, shade(), x, y, k, k, .35 + k * .55);
}

// Wind --------------------------------------------------------------------------------------------------------------
const WINDS = { flame: ['#fffdf4', '#ffdf9e', '#ff9a3c'], cloud: ['#ffffff', '#e4f1f8', '#8fb3cf'], gold: ['#fff8dc', '#f7d98a', '#c8912a'], lilac: ['#fbf4ff', '#dcc5f8', '#8f68d2'], slate: ['#f3f9ff', '#bcd7ee', '#4f86ba'] } as const;
export type WindTint = keyof typeof WINDS;
const winds = new Map<WindTint, Sprite>();
function windSprite(tint: WindTint) {
  let s = winds.get(tint);
  if (s) return s;
  const [core, mid, edge] = WINDS[tint];
  s = paint(150, 48, g => {
    // The head is on the right and thick; the tail thins to nothing with a soft curl.
    const band = (w: number, y: number, fill: string) => { g.fillStyle = fill; g.beginPath(); g.moveTo(0, y + 3); g.bezierCurveTo(46, y - w * .34, 104, y - w * .86, 134, y - w * .3); g.bezierCurveTo(150, y + w * .12, 140, y + w * .54, 118, y + w * .54); g.bezierCurveTo(84, y + w * .62, 40, y + w * .34, 0, y + 3); g.fill(); };
    band(40, 25, edge); band(28, 23, mid); band(14, 21, core);
    g.globalCompositeOperation = 'destination-in';
    const fade = g.createLinearGradient(0, 0, 150, 0);
    fade.addColorStop(0, '#0000'); fade.addColorStop(.42, '#000b'); fade.addColorStop(.8, '#000'); fade.addColorStop(1, '#000');
    g.fillStyle = fade; g.fillRect(0, 0, 150, 48);
  });
  winds.set(tint, s);
  return s;
}
/** A body of wind whose head is at x, y and whose tail streams back against `angle`, stretching as it ages. */
export function windAt(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, size: number, age: number, life: number, tint: WindTint) {
  if (age <= 0 || age >= life) return;
  const k = age / life, s = windSprite(tint);
  stampTurned(ctx, s, x, y, size * (.5 + ease(k * 3) * .75), size * (1 - k * .55), angle, ease(age / 55) * (1 - ease((k - .25) / .75)) * .86, .9, .5);
}

// Cloud -------------------------------------------------------------------------------------------------------------
const CLOUDS = { cloud: ['#7f99b4', '#b9cede', '#fbfdff'], lilac: ['#7b5fb0', '#bfa2e6', '#fbf4ff'], slate: ['#44739f', '#92bce0', '#f2f9ff'], gold: ['#b08238', '#efcf85', '#fff8df'] } as const;
export type CloudTint = keyof typeof CLOUDS;
const clouds = new Map<CloudTint, Sprite>();
function cloudSprite(tint: CloudTint) {
  let s = clouds.get(tint);
  if (s) return s;
  const [shade, mid, light] = CLOUDS[tint];
  s = paint(120, 84, g => {
    const lumps = [[60, 48, 30], [30, 54, 23], [90, 55, 23], [43, 32, 20], [76, 30, 21], [60, 22, 15]];
    for (const [x, y, r] of lumps) soft(g, x, y + 6, r, shade, `${shade}00`, .78);
    for (const [x, y, r] of lumps) soft(g, x, y + 1, r * .92, mid, `${mid}00`, .78);
    for (const [x, y, r] of lumps) soft(g, x - 2, y - 4, r * .76, light, `${light}00`, .62);
  });
  clouds.set(tint, s);
  return s;
}
/** One puff that swells, drifts and thins out. */
export function cloudAt(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, age: number, life: number, seed: number, tint: CloudTint = 'cloud') {
  if (age <= 0 || age >= life) return;
  // Cloud thins by shrinking, then goes: a long see-through fade over a dark square reads as smoke.
  const k = age / life, s = size * (.35 + ease(k * 2.2) * .65 + k * .3) * (1 - ease((k - .5) / .5) * .5);
  stamp(ctx, cloudSprite(tint), x + (rand(seed, 11) - .5) * 26 * k, y - k * 16, s * (rand(seed, 12) > .5 ? 1 : .92), s, ease(age / 70) * (1 - ease((k - .68) / .32)));
}
/** Cloud gathers under the feet and rolls out to the sides: a lift-off or a soft landing. */
export function cloudRing(ctx: CanvasRenderingContext2D, p: Point, age: number, layer: CardLayer, seed: number, size = 1, tint: CloudTint = 'cloud') {
  if (age <= 0 || age > 900) return;
  const open = 1 - (1 - clamp(age / 520)) ** 2;
  if (layer === 'under') {
    for (let i = 0; i < 9; i++) {
      const angle = TAU * i / 9 + rand(i, seed), r = (12 + open * (66 + rand(i, seed + 1) * 22)) * size;
      cloudAt(ctx, p.x + Math.cos(angle) * r, p.y + Math.sin(angle) * r * .36 - 8, (.72 + rand(i, seed + 2) * .3) * size, age - rand(i, seed + 3) * 70, 840, seed + i, tint);
    }
  } else for (let i = 0; i < 3; i++) {
    const side = i - 1, r = (10 + open * 62) * size;
    cloudAt(ctx, p.x + side * r, p.y + (24 - Math.abs(side) * 9) * size, .56 * size, age - i * 26, 700, seed + 12 + i, tint);
  }
}

// Earth -------------------------------------------------------------------------------------------------------------
const clods = once(() => [0, 1, 2, 3].map(seed => paint(34, 30, g => {
  const shape = (scale: number, x: number, y: number, fill: string) => {
    g.fillStyle = fill; g.beginPath();
    for (let i = 0; i < 7; i++) { const a = TAU * i / 7, r = (11 + rand(i, seed + 20) * 5) * scale; g[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r, y + Math.sin(a) * r * .84); }
    g.closePath(); g.fill();
  };
  shape(1, 17, 16, '#2e1e10'); shape(.82, 16, 14, '#5a3d22'); shape(.42, 13, 11, '#8b6a42');
})));
const dust = once(() => paint(84, 72, g => {
  for (const [x, y, r] of [[42, 42, 26], [24, 46, 18], [60, 47, 19], [33, 28, 17], [53, 27, 16]]) soft(g, x, y, r, '#6b4d2dcf', '#6b4d2d00', .5);
  for (const [x, y, r] of [[38, 34, 18], [24, 42, 10], [56, 40, 11]]) soft(g, x, y, r, '#a98a5e8c', '#a98a5e00', .25);
}));
const crater = once(() => paint(150, 78, g => {
  g.save(); g.translate(75, 39); g.scale(1, .5);
  soft(g, 0, 4, 70, '#20140ad0', '#20140a00', .5);
  soft(g, 0, 0, 44, '#120b05e8', '#120b0500', .68);
  for (let i = 0; i < 14; i++) {
    const a = TAU * i / 14 + rand(i, 41) * .4, r = 46 + rand(i, 42) * 12;
    soft(g, Math.cos(a) * r, Math.sin(a) * r, 8 + rand(i, 43) * 8, '#6b4a2b', '#6b4a2b00', .7);
    soft(g, Math.cos(a) * r - 1, Math.sin(a) * r - 4, 4 + rand(i, 43) * 5, '#987449', '#98744900', .55);
  }
  g.restore();
}));
const roots = once(() => [0, 1, 2].map(seed => paint(84, 124, g => {
  const stem = (w: number, bend: number, fill: string, x0: number) => {
    g.fillStyle = fill; g.beginPath(); g.moveTo(x0 - w, 122);
    g.bezierCurveTo(x0 - w * .95 + bend * .3, 96, x0 - w * .35 - bend, 52, x0 - w * .12 + bend * .6, 6);
    g.quadraticCurveTo(x0 + bend * .6, 0, x0 + w * .14 + bend * .6, 7);
    g.bezierCurveTo(x0 + w * .5 - bend, 52, x0 + w * .95 + bend * .3, 96, x0 + w, 122); g.closePath(); g.fill();
  };
  const bend = (seed - 1) * 8 + 7, x = 42;
  // A thick trunk with a side branch: a root with force in it, never a thin thorn.
  g.save(); g.translate(x, 82); g.rotate((seed % 2 ? -1 : 1) * .72); g.fillStyle = '#2a1a0d'; g.beginPath(); g.moveTo(-10, 8); g.quadraticCurveTo(-3, -24, 2, -52); g.quadraticCurveTo(9, -24, 11, 8); g.closePath(); g.fill();
  g.fillStyle = '#5c3e23'; g.beginPath(); g.moveTo(-6, 6); g.quadraticCurveTo(-2, -22, 2, -44); g.quadraticCurveTo(5, -22, 6, 6); g.closePath(); g.fill(); g.restore();
  stem(23, bend, '#2a1a0d', x); stem(18.5, bend, '#5c3e23', x); stem(8, bend, '#8f6d44', x - 5);
  soft(g, x - 9, 92, 13, '#5f7f33e0', '#5f7f3300', .5); soft(g, x + 8, 64, 9, '#6f9040d8', '#6f904000', .4); soft(g, x + 11, 108, 11, '#4e6d2ad8', '#4e6d2a00', .45);
})));
export function clodAt(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, spin: number, alpha: number, seed: number) {
  stampTurned(ctx, clods()[seed & 3], x, y, size, size, spin, alpha);
}
export function dustAt(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, age: number, life: number, seed: number) {
  if (age <= 0 || age >= life) return;
  const k = age / life, s = size * (.42 + (1 - (1 - k) ** 2) * .82);
  stamp(ctx, dust(), x + (rand(seed, 13) - .5) * 24 * k, y - k * 22, s, s * .9, ease(age / 55) * (1 - ease((k - .35) / .65)));
}
/** A root that breaks the stone, leans toward `lean` and sinks back. */
export function rootAt(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, lean: number, age: number, life: number, seed: number) {
  if (age <= 0 || age >= life) return;
  const up = ease(age / (life * .3)), down = ease((age - life * .55) / (life * .45)), h = size * up * (1 - down * .96);
  stampTurned(ctx, roots()[seed % 3], x, y, size * (.72 + up * .28), h, lean, Math.min(1, age / 40) * (1 - down * down * .5), .5, .98);
}
/** Clods thrown from a point on real arcs, the near ones larger. `away` (radians) biases them; null throws a full ring. */
export function clodThrow(ctx: CanvasRenderingContext2D, p: Point, age: number, life: number, count: number, reach: number, seed: number, away: number | null = null, high = 42) {
  for (let i = 0; i < count; i++) {
    const own = age - rand(i, seed) * 50, span = life * (.72 + rand(i, seed + 1) * .28);
    if (own <= 0 || own >= span) continue;
    const k = own / span, a = away == null ? rand(i, seed + 2) * TAU : away + (rand(i, seed + 2) - .5) * 1.5, r = reach * (.4 + rand(i, seed + 3) * .6) * k;
    const hop = Math.sin(Math.min(1, k * 1.05) * Math.PI) * high * (1 + rand(i, seed + 4) * 1.3);
    clodAt(ctx, p.x + Math.cos(a) * r, p.y + Math.sin(a) * r * .42 - hop - 6, (.55 + rand(i, seed + 5) * .75) * (1 - k * .25), k * 7 * (rand(i, seed + 6) - .5), ease(own / 30) * (1 - ease((k - .8) / .2)), i + seed);
  }
}
/** Clods shaken off a figure in the air: they only fall. */
export function clodFall(ctx: CanvasRenderingContext2D, p: Point, age: number, life: number, count: number, seed: number) {
  if (age <= 0 || age >= life) return;
  const k = age / life;
  for (let i = 0; i < count; i++) {
    const drift = (rand(i, seed) - .5) * 58, drop = 6 + age * age * (.00042 + rand(i, seed + 1) * .00028);
    clodAt(ctx, p.x + drift * (k + .2), p.y + drop, (.42 + rand(i, seed + 2) * .46), k * 6 * (rand(i, seed + 3) - .5), ease(age / 40) * (1 - ease((k - .7) / .3)), i + seed);
  }
}
/** The earth heaves at a start foot, thrown back against the direction of travel. */
export function earthPush(ctx: CanvasRenderingContext2D, p: Point, age: number, layer: CardLayer, back: number, seed: number) {
  if (age <= 0 || age > 900) return;
  if (layer === 'under') {
    stamp(ctx, crater(), p.x, p.y + 2, .68 + ease(age / 240) * .2, .68 + ease(age / 240) * .2, ease(age / 110) * (1 - ease((age - 420) / 480)));
    for (let i = 0; i < 6; i++) dustAt(ctx, p.x + (i - 2.5) * 16 + Math.cos(back) * 20, p.y - 2 + Math.sin(back) * 9, .86, age - i * 18, 760, seed + i);
    clodThrow(ctx, p, age, 720, 11, 130, seed + 10, back);
  }
}
/** One strong stomp: a crater opens, the soil ring lifts, clods fly. */
export function stomp(ctx: CanvasRenderingContext2D, p: Point, age: number, layer: CardLayer, seed: number, size = 1) {
  if (age <= 0 || age > 1000) return;
  const open = 1 - (1 - clamp(age / 170)) ** 3;
  if (layer === 'under') {
    stamp(ctx, crater(), p.x, p.y + 3, (.58 + open * .62) * size, (.58 + open * .62) * size, ease(age / 45) * (1 - ease((age - 560) / 440)));
    for (let i = 0; i < 10; i++) {
      const a = TAU * i / 10 + rand(i, seed), r = (24 + open * (54 + rand(i, seed + 1) * 20)) * size;
      dustAt(ctx, p.x + Math.cos(a) * r, p.y + Math.sin(a) * r * .4 - 4, (.66 + rand(i, seed + 2) * .34) * size, age - rand(i, seed + 3) * 40, 760, seed + i);
    }
    clodThrow(ctx, p, age, 800, Math.round(12 * size), 150 * size, seed + 40);
  } else {
    for (let i = 0; i < 3; i++) dustAt(ctx, p.x + (i - 1) * 50 * size * open, p.y + 16 * size, .54 * size, age - i * 18, 560, seed + 30 + i);
    // In front of the figure only low and to the sides, so the body stays clear.
    for (const side of [0, Math.PI]) clodThrow(ctx, { x: p.x + Math.cos(side) * 26, y: p.y + 12 }, age, 620, Math.round(4 * size), 112 * size, seed + 60 + side, side, 26);
  }
}
