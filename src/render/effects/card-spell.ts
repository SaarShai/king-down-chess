import type { PaintedScene } from '../painted/scene.mjs';
import type { CardFrame, CardLayer, Point } from './card-types';

// Local spell material. The caller owns the figures, board state and persistent wards.
const TAU = Math.PI * 2;
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const ease = (n: number) => { n = clamp(n); return n * n * (3 - 2 * n); };
const hash = (i: number, seed = 0) => { const n = Math.sin(i * 127.1 + seed * 311.7 + .5) * 43758.5453; return n - Math.floor(n); };
const mix = (a: Point, b: Point, t: number) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const body = (p: Point) => ({ x: p.x, y: p.y - 69 });
const life = (t: number, start: number, end: number) => Math.sin(clamp((t - start) / (end - start)) * Math.PI);
const LILAC = ['#f5e6ffe8', '#cbb3f8ad', '#9461c44d', '#7c3dae00'];
const ICE = ['#f6ffffed', '#b6eeffb0', '#6bbbd950', '#4c99bd00'];
const FIRE = ['#fff2bcdf', '#ffcb6d9c', '#e86a2c52', '#c4421700'];

function bloom(ctx: CanvasRenderingContext2D, p: Point, radius: number, colours: string[], opacity: number, flat = 1) {
  if (opacity <= 0 || radius <= 0) return;
  ctx.save(); ctx.globalAlpha *= opacity; ctx.translate(p.x, p.y); ctx.scale(1, flat);
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
  [0, .24, .65, 1].forEach((stop, i) => gradient.addColorStop(stop, colours[i]));
  ctx.fillStyle = gradient; ctx.fillRect(-radius, -radius, radius * 2, radius * 2); ctx.restore();
}
function mote(ctx: CanvasRenderingContext2D, p: Point, size: number, colour: string, opacity: number, angle = 0, stretch = 1.7) {
  if (opacity <= 0 || size <= 0) return;
  ctx.save(); ctx.globalAlpha *= opacity; ctx.fillStyle = colour;
  ctx.beginPath(); ctx.ellipse(p.x, p.y, size, size * stretch, angle, 0, TAU); ctx.fill(); ctx.restore();
}
function petal(ctx: CanvasRenderingContext2D, p: Point, size: number, angle: number, colour: string, opacity: number) {
  if (opacity <= 0 || size <= 0) return;
  ctx.save(); ctx.globalAlpha *= opacity; ctx.translate(p.x, p.y); ctx.rotate(angle);
  ctx.beginPath(); ctx.moveTo(-size, 0); ctx.bezierCurveTo(-size * .4, -size * .8, size * .7, -size * .55, size, 0);
  ctx.bezierCurveTo(size * .5, size * .2, -size * .3, size * .75, -size, 0);
  ctx.fillStyle = colour; ctx.fill(); ctx.restore();
}
function ground(ctx: CanvasRenderingContext2D, p: Point, t: number, colours: string[], seed: number, spread = 1) {
  const amount = life(t, .03, .96);
  bloom(ctx, p, 83 * spread, colours, amount * .43, .32);
  for (let i = 0; i < 17; i++) {
    const angle = i * 2.399, radius = (18 + hash(i, seed) * 47) * spread;
    const at = { x: p.x + Math.cos(angle + t * .55) * radius, y: p.y + Math.sin(angle + t * .55) * radius * .29 };
    petal(ctx, at, 1.5 + hash(i, seed + 1) * 3, angle + t, colours[i % 2], amount * .4);
  }
}
function spray(ctx: CanvasRenderingContext2D, p: Point, t: number, colours: string[], seed: number, count = 30, reach = 100, falling = false) {
  if (t <= 0 || t >= 1) return;
  const expand = 1 - (1 - t) ** 2, opacity = (1 - t) * ease(t / .09);
  for (let i = 0; i < count; i++) {
    const angle = hash(i, seed) * TAU, distance = (18 + hash(i, seed + 1) * reach) * expand;
    const at = { x: p.x + Math.cos(angle) * distance, y: p.y + Math.sin(angle) * distance * .6 - Math.sin(t * Math.PI) * 28 + (falling ? t * t * 80 : 0) };
    petal(ctx, at, 2 + hash(i, seed + 2) * 5, angle + t * (i % 2 ? 5 : -4), colours[i % 2], opacity * (.4 + hash(i, seed + 3) * .6));
  }
}
function kingFoot(scene: PaintedScene, event: CardFrame) {
  const sq = event.before.board.findIndex(p => !!p && (p & 15) === 6 && (p >> 4) === event.before.turn);
  return scene.foot(sq >= 0 ? sq : event.move.from);
}
// Painted opaque lumps, cached once per palette. A stack of them hides a figure completely: no figure ever shows through another.
const CLOUDS = { storm: ['#f6f9fc', '#a9b9cc', '#5d6d88', '#1c2740'], silk: ['#fdf5ff', '#c9b0ee', '#7f5fb8', '#2e1a58'], ink: ['#7d5f9c', '#46325f', '#261b3b', '#0d0818'] };
type Cloud = keyof typeof CLOUDS;
const LUMP = 128, lumpCache = new Map<string, HTMLCanvasElement>();
/** shade: 0 lit front, 1 middle, 2 far side. Depth comes from the shade, so the column reads as one body. */
function lump(cloud: Cloud, variant: number, shade: number) {
  const key = `${cloud}${variant}:${shade}`, cached = lumpCache.get(key);
  if (cached) return cached;
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = LUMP;
  const g = canvas.getContext('2d')!, [high, mid, low, far] = CLOUDS[cloud], half = LUMP / 2;
  g.fillStyle = low; g.beginPath(); g.arc(half, half, half * .72, 0, TAU); g.fill();
  for (let i = 0; i < 8; i++) {
    const angle = hash(i, variant + 90) * TAU, reach = half * (i < 5 ? .42 : .12), r = half * (.38 + hash(i, variant + 92) * .14);
    const x = half + Math.cos(angle) * reach, y = half + Math.sin(angle) * reach - (i < 5 ? 0 : half * .1);
    const paint = g.createRadialGradient(x - r * .3, y - r * .4, r * .1, x, y, r);
    paint.addColorStop(0, high); paint.addColorStop(.6, mid); paint.addColorStop(1, low);
    g.fillStyle = paint; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  }
  if (shade) { g.globalCompositeOperation = 'source-atop'; g.globalAlpha = shade * .27; g.fillStyle = far; g.fillRect(0, 0, LUMP, LUMP); }
  lumpCache.set(key, canvas);
  return canvas;
}
function drawLump(ctx: CanvasRenderingContext2D, cloud: Cloud, i: number, shade: number, x: number, y: number, r: number, opacity: number) {
  if (r <= 0 || opacity <= 0) return;
  const before = ctx.globalAlpha; ctx.globalAlpha = before * opacity;
  ctx.drawImage(lump(cloud, i % 3, shade), x - r, y - r, r * 2, r * 2);
  ctx.globalAlpha = before;
}
// A bright centre for dark squares and a dark rim for light squares. One cached sprite per palette.
const ORBS = { teal: ['#effffb', '#5fe6cf', '#0f8380'], ice: ['#ffffff', '#a4d8f5', '#2c6aa6'], violet: ['#f1d6ff', '#9a4fd8', '#2b1147'], gold: ['#fffbe6', '#ffd978', '#e0981f'] };
type Orb = keyof typeof ORBS;
const orbCache = new Map<Orb, HTMLCanvasElement>();
function drawOrb(ctx: CanvasRenderingContext2D, kind: Orb, p: Point, r: number, opacity: number) {
  if (r <= 0 || opacity <= 0) return;
  let image = orbCache.get(kind);
  if (!image) {
    image = document.createElement('canvas'); image.width = image.height = 64;
    const g = image.getContext('2d')!, [core, body, rim] = ORBS[kind], paint = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    paint.addColorStop(0, core); paint.addColorStop(.32, body); paint.addColorStop(.68, rim); paint.addColorStop(.8, rim + '88'); paint.addColorStop(1, rim + '00');
    g.fillStyle = paint; g.fillRect(0, 0, 64, 64); orbCache.set(kind, image);
  }
  const before = ctx.globalAlpha; ctx.globalAlpha = before * opacity;
  ctx.drawImage(image, p.x - r, p.y - r, r * 2, r * 2);
  ctx.globalAlpha = before;
}
/** A filled crescent on the front of an orbit. It tapers to nothing at both ends and at the sides of the column. */
function band(ctx: CanvasRenderingContext2D, c: Point, rx: number, ry: number, start: number, length: number, width: number, colour: string, opacity: number) {
  const a = Math.max(.08, start), b = Math.min(Math.PI - .08, start + length);
  if (b <= a || opacity <= 0) return;
  const steps = 10;
  ctx.save(); ctx.globalAlpha *= opacity; ctx.fillStyle = colour; ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const v = a + (b - a) * i / steps, w = width * Math.sin(i / steps * Math.PI) * Math.sin(v);
    const x = c.x + Math.cos(v) * rx, y = c.y + Math.sin(v) * ry - w / 2;
    if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
  }
  for (let i = steps; i >= 0; i--) {
    const v = a + (b - a) * i / steps, w = width * Math.sin(i / steps * Math.PI) * Math.sin(v);
    ctx.lineTo(c.x + Math.cos(v) * rx, c.y + Math.sin(v) * ry + w / 2);
  }
  ctx.closePath(); ctx.fill(); ctx.restore();
}
/**
 * The figure change. The column rises from the ground and is fully opaque by SHROUD_COVER. The board removes the old
 * figure at .35 and shows the new one at .62, both behind the column. The column then lifts off from the feet up.
 */
const SHROUD_COVER = .33, SHROUD_CLEAR = .62, SHROUD_HEIGHT = 112;
function shroud(ctx: CanvasRenderingContext2D, p: Point, t: number, cloud: Cloud, spinRate: number, liftRate: number) {
  const spin = t * spinRate;
  const arrive = (h: number, jitter: number) => ease((t - (.02 + h * (SHROUD_COVER - .16) + jitter * .03)) / .11);
  const leave = (h: number, jitter: number) => clamp((t - (SHROUD_CLEAR + h * .17 + jitter * .04)) / .15);
  const puff = (i: number, front: boolean) => {
    const h = i / 29, jitter = hash(i, 101), a = arrive(h, jitter), l = leave(h, jitter);
    if (a <= 0 || l >= 1) return;
    const angle = i * 2.399 + spin, depth = Math.sin(angle);
    if (depth >= 0 !== front) return;
    const width = 50 - h * 14, radius = width * (1 + (1 - a) * .8) + l * l * 70, level = 8 + h * SHROUD_HEIGHT * a;
    drawLump(ctx, cloud, i, front ? (h < .4 ? 1 : 0) : 2, p.x + Math.cos(angle) * radius, p.y - level + depth * radius * .26 - l * (26 + h * liftRate), (28 + jitter * 12) * a * (1 - l * .5), 1 - ease((l - .3) / .7));
  };
  for (let i = 0; i < 30; i++) puff(i, false);
  for (let i = 0; i < 8; i++) {
    const h = i / 7, jitter = hash(i, 102), a = arrive(h, jitter), l = leave(h, jitter);
    if (a <= 0 || l >= 1) continue;
    drawLump(ctx, cloud, i + 1, 1, p.x + (jitter - .5) * 10, p.y - 6 - h * SHROUD_HEIGHT * a - l * (20 + h * liftRate), (60 - h * 15) * a * (1 - l * .6), 1 - ease((l - .25) / .75));
  }
  for (let i = 0; i < 30; i++) puff(i, true);
  // The wind: wide bright bands that wrap the figure before the cloud closes, then spin up and away with it.
  for (let i = 0; i < 7; i++) {
    const h = i / 6, a = ease((t - .05 - h * .15) / .13), l = clamp((t - (SHROUD_CLEAR - .04 + h * .16)) / .2);
    if (a <= 0 || l >= 1) continue;
    const rx = (64 - h * 12) * (1 + (1 - a) * .22) + l * 44, ry = rx * .34;
    const at = { x: p.x, y: p.y - 4 - h * (SHROUD_HEIGHT + 12) * a - l * (30 + h * 34) };
    const start = ((i * 1.9 + spin * 1.5) % (Math.PI * 2)) - .9, opacity = a * (1 - ease((l - .2) / .8));
    band(ctx, { x: at.x, y: at.y + 5 }, rx, ry, start, 2.4, 22, CLOUDS[cloud][2], opacity * .8);
    band(ctx, { x: at.x, y: at.y + 2 }, rx, ry, start, 2.4, 19, CLOUDS[cloud][1], opacity);
    band(ctx, { x: at.x, y: at.y - 2 }, rx, ry, start + .2, 2, 10, CLOUDS[cloud][0], opacity);
  }
  // The peak: the column flares at the moment the new figure stands behind it.
  const flare = life(t, SHROUD_CLEAR - .1, SHROUD_CLEAR + .08);
  if (flare > 0) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    bloom(ctx, { x: p.x, y: p.y - 70 }, 112, cloud === 'storm' ? STORM_FLARE : SILK_FLARE, flare * .85, 1.05);
    ctx.restore();
  }
}
const STORM_FLARE = ['#ffffffd0', '#cfe4ff90', '#6f93c840', '#6f93c800'];
const SILK_FLARE = ['#ffffffc8', '#e6ccff88', '#a070e040', '#a070e000'];
const STORM_FLOOR = ['#1c2436d8', '#232d44b8', '#2c374f66', '#2c374f00'];
const SILK_FLOOR = ['#2c1a4ec8', '#3a2464a8', '#4c2f8058', '#4c2f8000'];
function figureChange(ctx: CanvasRenderingContext2D, p: Point, id: string, t: number, layer: CardLayer) {
  const storm = id === 'Sacrifice';
  if (layer === 'under') { bloom(ctx, p, 104, storm ? STORM_FLOOR : SILK_FLOOR, life(t, 0, .98) ** .6, .34); return; }
  shroud(ctx, p, t, storm ? 'storm' : 'silk', storm ? 15 : -10, storm ? 62 : 34);
}
const SHAFT_TOP = '#ffe9a800', SHAFT_BODY = '#ffcf6a90', SALVATION_POOL = ['#fff0bcd0', '#ffd070b0', '#e5a94460', '#d5943000'];
/** Called Home: a pool of light opens on the floor, a shaft climbs from it, and the piece rises out of the floor inside it. */
function salvation(ctx: CanvasRenderingContext2D, p: Point, t: number, layer: CardLayer) {
  const open = ease(t / .2) * (1 - ease((t - .6) / .34));
  if (layer === 'under') { bloom(ctx, p, 96, SALVATION_POOL, open, .34); return; }
  // Gone before the real figure replaces the rising one, so the light never washes it out.
  const shaft = ease((t - .06) / .22) * (1 - ease((t - .4) / .2)), height = 190 * ease((t - .06) / .3);
  if (shaft > 0) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= shaft;
    const light = ctx.createLinearGradient(0, p.y - height, 0, p.y);
    light.addColorStop(0, SHAFT_TOP); light.addColorStop(.55, '#ffcf6a48'); light.addColorStop(1, SHAFT_BODY);
    ctx.fillStyle = light; ctx.beginPath(); ctx.moveTo(p.x - 62, p.y); ctx.lineTo(p.x - 38, p.y - height); ctx.lineTo(p.x + 38, p.y - height); ctx.lineTo(p.x + 62, p.y);
    ctx.ellipse(p.x, p.y, 62, 19, 0, 0, Math.PI); ctx.fill(); ctx.restore();
  }
  for (let i = 0; i < 26; i++) {
    const v = clamp((t - .05 - hash(i, 14) * .42) / .46);
    if (v <= 0 || v >= 1) continue;
    const angle = i * 2.399 + v * 2.6, r = 26 + hash(i, 15) * 36;
    drawOrb(ctx, 'gold', { x: p.x + Math.cos(angle) * r, y: p.y + Math.sin(angle) * 10 - v * (70 + hash(i, 16) * 100) }, (6 + hash(i, 17) * 6) * (1 - v * .5), Math.sin(v * Math.PI) ** .5 * (1 - ease((t - .52) / .1)));
  }
}
/** The returned piece climbs from below the floor line, whole and opaque, and meets the real figure at the end of its rise. */
export function drawRising(ctx: CanvasRenderingContext2D, scene: PaintedScene, value: number, square: number, u: number) {
  const p = scene.foot(square), depth = (1 - u) * 170;
  ctx.save(); ctx.beginPath(); ctx.rect(p.x - 140, p.y - 280, 280, 284); ctx.ellipse(p.x, p.y + 2, 74, 22, 0, 0, TAU); ctx.clip();
  ctx.translate(0, depth); scene.ghost(ctx, value, square, 1); ctx.restore();
  // The lip of the pool stays in front of the rising body, so the cut edge reads as the floor of light.
  const lip = Math.sin(clamp(u) * Math.PI) ** .5;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; bloom(ctx, { x: p.x, y: p.y + 4 }, 84, SALVATION_POOL, lip * .75, .3); ctx.restore();
}
/** Control and Mimic: the lender's power pours into the receiver, wraps it through the move and breaks out at the target. */
function borrow(ctx: CanvasRenderingContext2D, scene: PaintedScene, id: string, event: CardFrame, layer: CardLayer) {
  const { t, travel, move } = event, from = scene.foot(move.from), to = scene.foot(move.from === move.to && move.captures.length ? move.captures.at(-1)! : move.to), current = mix(from, to, travel), mimic = id === 'Mimic';
  const lender = body(scene.foot(event.lender ?? move.from)), receiver = body(from), kind: Orb = mimic ? 'ice' : 'teal';
  const wrap = ease((t - .1) / .14) * (1 - ease((t - .6) / .12)), front = layer === 'over';
  if (!front) {
    bloom(ctx, t < .22 ? from : current, 92, mimic ? BORROW_FLOOR_ICE : BORROW_FLOOR_TEAL, life(t, 0, .9) ** .5, .34);
    if (t < .3 && event.lender !== undefined) bloom(ctx, scene.foot(event.lender), 84, mimic ? BORROW_FLOOR_ICE : BORROW_FLOOR_TEAL, life(t, .0, .3), .34);
  } else {
    // The pour: a dense comet from the lender's body to the receiver's.
    const take = clamp((t - .01) / .24);
    for (let i = 0; i < 30; i++) {
      const v = clamp(take * 1.3 - hash(i, 31) * .3);
      if (v <= 0 || v >= 1) continue;
      const at = mix(lender, receiver, ease(v));
      at.x += Math.sin(v * Math.PI) * (hash(i, 32) - .5) * 44;
      at.y -= Math.sin(v * Math.PI) * (20 + hash(i, 33) * 30);
      if (mimic && i % 2) shard(ctx, at, 4 + hash(i, 34) * 5, i + t * 9, '#ffffff', '#6fa8d8', ease(v / .15));
      else drawOrb(ctx, kind, at, (10 + hash(i, 34) * 10) * (1 - v * .35), ease(v / .15));
    }
    // The break at the target.
    if (t >= .6) for (let i = 0; i < 22; i++) {
      const v = clamp((t - .6 - hash(i, 41) * .05) / .33), angle = i * 2.399, r = 16 + (1 - (1 - v) ** 2) * (42 + hash(i, 42) * 56), at = { x: to.x + Math.cos(angle) * r, y: to.y - 62 + Math.sin(angle) * r * .7 + v * v * 24 };
      if (v <= 0 || v >= 1) continue;
      if (mimic && i % 2) shard(ctx, at, 5 + hash(i, 43) * 4, angle + v * 5, '#ffffff', '#6fa8d8', 1 - ease((v - .4) / .6));
      else drawOrb(ctx, kind, at, (11 + hash(i, 43) * 7) * (1 - v * .6), 1 - ease((v - .4) / .6));
    }
  }
  // The wrap: a spiral of orbs round the figure, far side behind it and near side in front of it.
  for (let i = 0; i < 18; i++) {
    const angle = i * 2.399 + t * 15, depth = Math.sin(angle);
    if (depth >= 0 !== front) continue;
    const at = { x: current.x + Math.cos(angle) * (50 + (i % 3) * 3), y: current.y - 10 - (i / 17) * 106 + depth * 15 };
    drawOrb(ctx, kind, at, (11 + hash(i, 35) * 7) * (.82 + depth * .18) * wrap, wrap);
  }
}
const BORROW_FLOOR_TEAL = ['#0d6f70c8', '#16908cb0', '#37b7a858', '#37b7a800'];
const BORROW_FLOOR_ICE = ['#1f5d94c0', '#3a86bfa8', '#7dbde058', '#7dbde000'];
/** Curse: ink climbs the figure from a dark pool, with violet embers in it. It rises round the body and leaves the figure clear. */
function curse(ctx: CanvasRenderingContext2D, scene: PaintedScene, event: CardFrame, layer: CardLayer) {
  const { t, travel, move } = event, p = mix(scene.foot(move.from), scene.foot(move.from === move.to && move.captures.length ? move.captures.at(-1)! : move.to), travel), amount = life(t, .015, .97) ** .6, front = layer === 'over';
  if (!front) bloom(ctx, p, 98, CURSE_FLOOR, amount, .34);
  for (let i = 0; i < 22; i++) {
    const rise = (t * 1.5 + hash(i, 51)) % 1, angle = i * 2.399 + t * 5, depth = Math.sin(angle);
    if (depth >= 0 !== front) continue;
    const at = { x: p.x + Math.cos(angle) * (42 + rise * 20), y: p.y - 4 - rise * 124 + depth * 13 };
    drawLump(ctx, 'ink', i, front ? 0 : 2, at.x, at.y, (13 + hash(i, 52) * 10) * Math.sin(rise * Math.PI) ** .7 * amount, amount);
    if (i % 2) drawOrb(ctx, 'violet', { x: at.x + depth * 8, y: at.y - 12 }, (6 + hash(i, 53) * 5) * Math.sin(rise * Math.PI) * amount, amount);
  }
}
const CURSE_FLOOR = ['#150c26e8', '#21123cd0', '#33205468', '#33205400'];
const COLD = ['#fbffffff', '#d8f6fff0', '#9fdcf09c', '#7cc4e200'];
const COLD_FLOOR = ['#17476ec0', '#2a6f9ca8', '#4e9cc560', '#4c99bd00'];
function shard(ctx: CanvasRenderingContext2D, p: Point, size: number, angle: number, light: string, dark: string, opacity: number) {
  if (size <= 0 || opacity <= 0) return;
  ctx.save(); ctx.globalAlpha *= opacity; ctx.translate(p.x, p.y); ctx.rotate(angle);
  ctx.beginPath(); ctx.moveTo(-size * 1.5, 0); ctx.lineTo(-size * .2, -size * .62); ctx.lineTo(size * 1.5, 0); ctx.lineTo(0, size * .62); ctx.closePath();
  ctx.fillStyle = dark; ctx.fill();
  ctx.beginPath(); ctx.moveTo(-size * 1.5, 0); ctx.lineTo(-size * .2, -size * .62); ctx.lineTo(size * 1.5, 0); ctx.closePath();
  ctx.fillStyle = light; ctx.fill(); ctx.restore();
}
/** The cold gathers along the floor into the ring; the wall (materials.ts) then grows from it, and the chips and the breath follow. */
function iceWall(ctx: CanvasRenderingContext2D, p: Point, t: number, layer: CardLayer) {
  const gather = ease(t / .3), held = 1 - ease((t - .55) / .42);
  if (layer === 'under') {
    bloom(ctx, p, 56 + gather * 34, COLD_FLOOR, ease(t / .16) * held, .34);
    for (let i = 0; i < 14; i++) {
      const angle = i * 2.399 + t * 1.4, r = 104 - gather * 44;
      bloom(ctx, { x: p.x + Math.cos(angle) * r, y: p.y + Math.sin(angle) * r * .32 }, 22 + hash(i, 60) * 10, COLD, ease(t / .1) * held * .9, .55);
    }
    return;
  }
  // Cold is drawn in: shards fly low and fast to the ring and vanish into it as the wall starts.
  for (let i = 0; i < 26; i++) {
    const v = clamp((t - hash(i, 62) * .14) / .17);
    if (v <= 0 || v >= 1) continue;
    const angle = i * 2.399, r = 150 - ease(v) * 92, height = (6 + hash(i, 63) * 92) * (1 - ease(v));
    const at = { x: p.x + Math.cos(angle) * r, y: p.y + Math.sin(angle) * r * .32 - height };
    shard(ctx, at, (4 + hash(i, 64) * 5) * (1 - v * v * .7), Math.atan2(p.y - at.y, p.x - at.x), '#f4ffff', '#5fb2d8', ease(v / .2));
  }
  // The wall breaks the floor: chips thrown up from the ring, falling back over many frames.
  for (let i = 0; i < 30; i++) {
    const v = clamp((t - .27 - hash(i, 65) * .16) / .36);
    if (v <= 0 || v >= 1) continue;
    const angle = i * 2.399, r = 58 + v * (22 + hash(i, 66) * 34);
    const at = { x: p.x + Math.cos(angle) * r, y: p.y + Math.sin(angle) * r * .32 - Math.sin(v * Math.PI * .85) * (58 + hash(i, 67) * 74) };
    shard(ctx, at, 3 + hash(i, 68) * 5, angle + v * (i % 2 ? 7 : -7), '#eaffff', '#6fbfe0', 1 - ease((v - .55) / .45));
  }
  // The wall's cold breath rolls down its front and out over the floor.
  const breath = ease((t - .4) / .14) * (1 - ease((t - .62) / .35));
  for (let i = 0; i < 8; i++) {
    const side = (i + .5) / 8 * 2 - 1, drift = ease((t - .4) / .55);
    bloom(ctx, { x: p.x + side * (46 + drift * 16), y: p.y + 14 + (1 - side * side) * 8 + drift * 5 }, 22 + drift * 8, COLD, breath * .7, .5);
  }
}
function firewall(ctx: CanvasRenderingContext2D, scene: PaintedScene, event: CardFrame, layer: CardLayer) {
  const { t, move, travel } = event;
  const squares = event.index === 0 ? [...event.before.board.keys()].filter(sq => event.before.board[sq] && (event.before.board[sq] >> 4) === event.before.turn) : [move.from];
  for (const sq of squares) {
    const p = event.index === 0 ? scene.foot(sq) : mix(scene.foot(move.from), scene.foot(move.from === move.to && move.captures.length ? move.captures.at(-1)! : move.to), travel);
    const onset = ease((t - .05 - hash(sq, 70) * .08) / .23), fade = 1 - ease((t - .55) / .45), amount = onset * fade;
    if (layer === 'under') { bloom(ctx, p, 81, FIRE, amount * .46, .35); continue; }
    // Only the outer edge throws embers. The shared material supplies the protective flames.
    for (let i = 0; i < 14; i++) {
      const rise = clamp((t - hash(i, sq) * .18) / .8), side = i % 2 ? -1 : 1;
      const at = { x: p.x + side * (44 + hash(i, 72) * 22) + Math.sin(rise * 7 + i) * 5, y: p.y + 4 - rise * (51 + hash(i, 73) * 78) };
      mote(ctx, at, 1.3 + hash(i, 74) * 1.8, i % 3 ? '#ffc353' : '#fff2ae', amount * Math.sin(rise * Math.PI), side * .2, 2);
    }
  }
}
function glass(ctx: CanvasRenderingContext2D, p: Point, size: number, angle: number, opacity: number) {
  ctx.save(); ctx.globalAlpha *= opacity; ctx.translate(p.x, p.y); ctx.rotate(angle);
  ctx.beginPath(); ctx.moveTo(-size * .75, -size * .65); ctx.lineTo(size * .3, -size); ctx.lineTo(size * .7, size * .7); ctx.lineTo(-size * .35, size); ctx.closePath();
  const gradient = ctx.createLinearGradient(-size, 0, size, 0);
  gradient.addColorStop(0, '#9989c953'); gradient.addColorStop(.34, '#f2ffffbc'); gradient.addColorStop(.48, '#b8e6f42e'); gradient.addColorStop(.8, '#b1a6eb9c'); gradient.addColorStop(1, '#fff2ffbd');
  ctx.fillStyle = gradient; ctx.fill();
  ctx.beginPath(); ctx.moveTo(-size * .75, -size * .65); ctx.lineTo(size * .3, -size); ctx.lineTo(-size * .1, size * .55); ctx.closePath(); ctx.fillStyle = '#f5ffff8c'; ctx.fill(); ctx.restore();
}
function mirror(ctx: CanvasRenderingContext2D, scene: PaintedScene, event: CardFrame, layer: CardLayer) {
  if (event.index > 0) return;
  const { t, move } = event, foot = kingFoot(scene, event), from = body(foot), target = body(scene.foot(move.from === move.to && move.captures.length ? move.captures.at(-1)! : move.to));
  if (layer === 'under') {
    if (t < .45) ground(ctx, foot, t * 2, LILAC, 81, .85);
    if (t > .56) bloom(ctx, scene.foot(move.from === move.to && move.captures.length ? move.captures.at(-1)! : move.to), 86, ICE, life(t, .56, 1) * .35, .32);
    return;
  }
  const open = life(t, .02, .58);
  for (let i = 0; i < 7; i++) {
    const angle = i * 2.399 + t * 1.5, radius = 36 + hash(i, 80) * 25;
    glass(ctx, { x: from.x + Math.cos(angle) * radius, y: from.y - 14 + Math.sin(angle) * radius * .8 }, 10 + hash(i, 81) * 13, angle * .3 + t, open * .82);
  }
  if (t > .2 && t < .65) {
    const u = ease((t - .2) / .42), amount = ease((t - .2) / .045) * (1 - ease((t - .6) / .05));
    for (const side of [-1, 1]) for (let i = 0; i < 21; i++) {
      const age = i / 21, v = clamp(u - age * .16), at = mix(from, target, v);
      at.x += side * Math.sin(v * Math.PI) * 29 + Math.sin(i * 2.4 + t * 20) * age * 6;
      at.y -= Math.sin(v * Math.PI) * (52 + side * 9);
      drawOrb(ctx, side < 0 ? 'violet' : 'ice', at, 5 + (1 - age) * 10, amount * (1 - age * .6));
    }
  }
  if (t > .6) spray(ctx, target, (t - .6) / .4, ICE, 83, 40, 91);
}

export const SPELL_IDS = new Set(['Sacrifice', 'Salvation', 'MorphP', 'Control', 'Mimic', 'Curse', 'IceWall', 'Firewall', 'MirrorB']);
export const SPELL_DURATIONS: Record<string, number> = { Sacrifice: 1850, Salvation: 1800, MorphP: 1750, Control: 1700, Mimic: 1700, Curse: 1700, IceWall: 1800, Firewall: 2600, MirrorB: 2600 };
export function drawSpell(ctx: CanvasRenderingContext2D, scene: PaintedScene, id: string, event: CardFrame, layer: CardLayer) {
  if (event.t <= 0 || event.t >= 1 || !SPELL_IDS.has(id)) return;
  if (id === 'Sacrifice' || id === 'MorphP') figureChange(ctx, scene.foot(event.move.to), id, event.t, layer);
  else if (id === 'Salvation') salvation(ctx, scene.foot(event.move.to), event.t, layer);
  else if (id === 'Control' || id === 'Mimic') borrow(ctx, scene, id, event, layer);
  else if (id === 'Curse') curse(ctx, scene, event, layer);
  else if (id === 'IceWall') iceWall(ctx, scene.foot(event.move.to), event.t, layer);
  else if (id === 'Firewall') firewall(ctx, scene, event, layer);
  else if (id === 'MirrorB') mirror(ctx, scene, event, layer);
}
