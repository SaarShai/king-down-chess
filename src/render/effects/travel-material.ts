import type { CardLayer, Point } from './card-types';

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
function tongue(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, lean: number, low: string, high: string) {
  const f = g.createLinearGradient(0, y, 0, y - h);
  f.addColorStop(0, low); f.addColorStop(1, high);
  g.fillStyle = f; g.beginPath(); g.moveTo(x - w / 2, y);
  g.bezierCurveTo(x - w * .66, y - h * .36, x - w * .16 + lean * .5, y - h * .66, x + lean, y - h);
  g.bezierCurveTo(x + w * .2 + lean * .4, y - h * .62, x + w * .66, y - h * .32, x + w / 2, y);
  g.bezierCurveTo(x + w * .3, y + h * .1, x - w * .3, y + h * .1, x - w / 2, y); g.fill();
}
const flames = once(() => [-11, 6, 15, -3].map((lean, v) => paint(72, 112, g => {
  const x = 36 + (v - 1.5) * 1.5, y = 106, wide = v === 2 ? 40 : 46, tall = 100 - v * 7;
  // Side licks break the outline. The base dissolves, so tongues merge into one fire instead of standing as separate cones.
  tongue(g, x - 14, y - 6, 22, tall * .52, lean * .5 - 5, '#f4470a', '#c32103');
  tongue(g, x + 14, y - 8, 20, tall * .42, lean * .4 + 6, '#f4470a', '#c32103');
  tongue(g, x, y, wide, tall, lean, '#f4470a', '#b51c02');
  tongue(g, x + lean * .1, y, wide * .7, tall * .7, lean * .72, '#ff8a12', '#f6490a');
  tongue(g, x + lean * .12, y - 4, wide * .4, tall * .46, lean * .5, '#ffcc3c', '#ff8d14');
  tongue(g, x + lean * .1, y - 8, wide * .17, tall * .24, lean * .24, '#fff2b0', '#ffd65a');
  g.globalCompositeOperation = 'destination-out';
  const base = g.createLinearGradient(0, y + 6, 0, y - 26);
  base.addColorStop(0, '#000'); base.addColorStop(.35, '#000a'); base.addColorStop(1, '#0000');
  g.fillStyle = base; g.fillRect(0, y - 26, 72, 40);
})));
const smoke = once(() => paint(72, 72, g => {
  for (const [x, y, r] of [[36, 40, 26], [22, 44, 17], [50, 45, 18], [29, 27, 16], [45, 28, 15]]) soft(g, x, y, r, '#2d241cc2', '#2d241c00', .35);
}));
const glowFire = once(() => paint(128, 128, g => {
  const f = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  f.addColorStop(0, '#ffd25cf0'); f.addColorStop(.35, '#ff8a1cb4'); f.addColorStop(.7, '#e5420a4c'); f.addColorStop(1, '#d6350800');
  g.fillStyle = f; g.fillRect(0, 0, 128, 128);
}));
const scorch = once(() => paint(112, 60, g => {
  for (let i = 0; i < 9; i++) soft(g, 56 + (rand(i, 3) - .5) * 58, 30 + (rand(i, 4) - .5) * 16, 13 + rand(i, 5) * 8, '#17100ab4', '#17100a00', .25);
}));
const emberDot = once(() => paint(16, 16, g => { soft(g, 8, 8, 8, '#ff9a1c', '#ff5a0c00', .25); soft(g, 8, 8, 3.4, '#fff4c0', '#ffd25c', .55); }));
function ember(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, alpha: number) {
  stamp(ctx, emberDot(), x, y, size, size, alpha);
}
const flicker = (ms: number, seed: number) => 1 + Math.sin(ms * .021 + seed * 5.1) * .1 + Math.sin(ms * .047 + seed * 2.3) * .05;

/** One tongue on the ground at x, y that grows, stands and dies over its life. */
export function flameAt(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, age: number, life: number, seed: number) {
  if (age <= 0 || age >= life) return;
  const grow = ease(age / (life * .22)), die = ease((age - life * .42) / (life * .58)), s = size * grow * (1 - die * .45);
  const f = flames(), fl = flicker(age, seed);
  stamp(ctx, f[Math.floor(rand(seed, 7) * 4)], x, y - die * 22 * size, s * (2 - fl), s * fl * (1 - die * .25), Math.min(1, age / 50) * (1 - die * die), .95);
}
export function smokeAt(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, age: number, life: number, seed: number) {
  if (age <= 0 || age >= life) return;
  const k = age / life, s = size * (.5 + k * .9);
  stamp(ctx, smoke(), x + (rand(seed, 9) - .5) * 22 * k, y - k * 62, s, s, ease(age / 90) * (1 - k) * .85);
}
export function scorchAt(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, alpha: number) {
  stamp(ctx, scorch(), x, y, size, size, alpha);
}
export function fireGlow(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, alpha: number, flat = .5) {
  stamp(ctx, glowFire(), x, y, radius / 64, radius / 64 * flat, alpha);
}
/** Embers that rise from a point and cool; `count` sets the density and a seed keeps each path fixed. */
export function emberRise(ctx: CanvasRenderingContext2D, p: Point, age: number, life: number, count: number, reach: number, seed: number) {
  for (let i = 0; i < count; i++) {
    const own = age - rand(i, seed) * life * .25, span = life * (.6 + rand(i, seed + 1) * .4);
    if (own <= 0 || own >= span) continue;
    const k = own / span, open = 1 - (1 - k) ** 2, angle = rand(i, seed + 2) * TAU;
    ember(ctx, p.x + Math.cos(angle) * reach * open * (.4 + rand(i, seed + 3) * .6), p.y - 8 + Math.sin(angle) * reach * .3 * open - (40 + rand(i, seed + 4) * 70) * open + k * k * 22,
      .34 + rand(i, seed + 5) * .5, ease(own / 40) * (1 - k * k));
  }
}
/** Ignition at a start foot: a ring of tongues that grows out of the stone and falls when the figure leaves. */
export function ignite(ctx: CanvasRenderingContext2D, p: Point, age: number, leave: number, layer: CardLayer, seed: number) {
  const fade = 1 - ease((age - leave) / 340), g = ease(age / 170) * fade;
  if (g <= 0) return;
  const life = Math.max(leave + 340, 500);
  if (layer === 'under') {
    scorchAt(ctx, p.x, p.y, 1.05, ease(age / 200) * (1 - ease((age - leave - 320) / 620)));
    fireGlow(ctx, p.x, p.y - 8, 92, g * .85);
    for (let i = 0; i < 7; i++) {
      const angle = TAU * i / 7 + rand(i, seed), own = age - rand(i, seed + 1) * 60;
      flameAt(ctx, p.x + Math.cos(angle) * 40, p.y + Math.sin(angle) * 15 - 3, .62 + rand(i, seed + 2) * .3, own, life, seed + i);
    }
  } else {
    for (let i = 0; i < 3; i++) flameAt(ctx, p.x + (i - 1) * 30, p.y + 16 - Math.abs(i - 1) * 5, .42, age - i * 30, life, seed + 20 + i);
    emberRise(ctx, p, age, life + 240, 9, 46, seed + 30);
  }
}
/** A flame-charged landing: ground fire bursts out in a ring, smoke climbs, embers fly. `size` scales the blast. */
export function fireBurst(ctx: CanvasRenderingContext2D, p: Point, age: number, layer: CardLayer, seed: number, size = 1) {
  if (age <= 0 || age > 1050) return;
  const open = 1 - (1 - clamp(age / 300)) ** 2;
  if (layer === 'under') {
    scorchAt(ctx, p.x, p.y, 1.45 * size, ease(age / 90) * (1 - ease((age - 500) / 520)));
    fireGlow(ctx, p.x, p.y - 12, 150 * size * (.65 + open * .35), ease(age / 60) * (1 - ease((age - 150) / 450)), .62);
    for (let i = 0; i < 6; i++) smokeAt(ctx, p.x + (i - 2.5) * 22 * size, p.y - 22, 1.1 * size, age - 90 - i * 20, 900, seed + i);
    for (let i = 0; i < 11; i++) {
      const angle = TAU * i / 11 + rand(i, seed + 1), r = (22 + open * (34 + rand(i, seed + 2) * 24)) * size;
      flameAt(ctx, p.x + Math.cos(angle) * r, p.y + Math.sin(angle) * r * .42, (.66 + rand(i, seed + 3) * .44) * size, age - rand(i, seed + 4) * 50, 640, seed + 3 + i);
    }
  } else {
    for (let i = 0; i < 5; i++) {
      const side = (i - 2) / 2;
      flameAt(ctx, p.x + side * 64 * size * (.4 + open * .6), p.y + (22 - Math.abs(side) * 10) * size, (.5 + (1 - Math.abs(side)) * .08) * size, age - Math.abs(side) * 40, 560, seed + 40 + i);
    }
    emberRise(ctx, p, age, 950, Math.round(26 * size), 118 * size, seed + 50);
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
export function clodAt(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, spin: number, alpha: number, seed: number) {
  stampTurned(ctx, clods()[seed & 3], x, y, size, size, spin, alpha);
}
export function dustAt(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, age: number, life: number, seed: number) {
  if (age <= 0 || age >= life) return;
  const k = age / life, s = size * (.42 + (1 - (1 - k) ** 2) * .82);
  stamp(ctx, dust(), x + (rand(seed, 13) - .5) * 24 * k, y - k * 22, s, s * .9, ease(age / 55) * (1 - ease((k - .35) / .65)));
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
