import type { PaintedScene } from '../painted/scene.mjs';
import type { CardFrame, CardLayer, Point } from './card-types';
import { fireBurst, flameAt, ignite } from './travel-material';
import { cloudAt, cloudRing, clodFall, dustAt, earthPush, groundShade, stomp, windAt, type CloudTint } from './travel-material';

// Material follows the same intact figure motion as the study player.
const TAU = Math.PI * 2;
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const ease = (n: number) => { const t = clamp(n); return t * t * (3 - 2 * t); };
const rand = (i: number, seed = 0) => { const n = Math.sin(i * 127.1 + seed * 311.7 + .5) * 43758.5453; return n - Math.floor(n); };
const mix = (a: Point, b: Point, u: number) => ({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u });
const pulse = (t: number, start: number, span: number) => Math.sin(clamp((t - start) / span) * Math.PI);
const GOLD = ['#fff4cce8', '#f8cf7b91', '#dba44136', '#dba44100'];
const DUST = ['#c3a88494', '#a0846385', '#785b3e49', '#785b3e00'];
function bloom(ctx: CanvasRenderingContext2D, p: Point, radius: number, colour: string[], opacity: number, flat = 1) {
  if (opacity <= 0 || radius <= 0) return;
  ctx.save(); ctx.globalAlpha *= opacity; ctx.translate(p.x, p.y); ctx.scale(1, flat);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
  g.addColorStop(0, colour[0]); g.addColorStop(.25, colour[1]); g.addColorStop(.65, colour[2]); g.addColorStop(1, colour[3]);
  ctx.fillStyle = g; ctx.fillRect(-radius, -radius, radius * 2, radius * 2); ctx.restore();
}
// Filled, tapered wisps have uneven edges; they never outline the route.
function wisp(ctx: CanvasRenderingContext2D, root: Point, tip: Point, width: number, colour: string[], opacity: number, bend = .6) {
  if (opacity <= 0 || width <= 0) return;
  const dx = tip.x - root.x, dy = tip.y - root.y, length = Math.hypot(dx, dy) || 1, nx = -dy / length, ny = dx / length;
  ctx.save(); ctx.globalAlpha *= opacity;
  const g = ctx.createLinearGradient(root.x, root.y, tip.x, tip.y);
  g.addColorStop(0, colour[2]); g.addColorStop(.3, colour[1]); g.addColorStop(.63, colour[0]); g.addColorStop(1, colour[3]);
  ctx.beginPath(); ctx.moveTo(root.x - nx * width, root.y - ny * width);
  ctx.bezierCurveTo(root.x + dx * .3 - nx * width * 1.5, root.y + dy * .3 - ny * width * 1.5, tip.x - dx * .3 + nx * width * bend, tip.y - dy * .3 + ny * width * bend, tip.x, tip.y);
  ctx.bezierCurveTo(tip.x - dx * .5 - nx * width * bend, tip.y - dy * .5 - ny * width * bend, root.x + dx * .3 + nx * width, root.y + dy * .3 + ny * width, root.x + nx * width, root.y + ny * width);
  ctx.closePath(); ctx.fillStyle = g; ctx.fill(); ctx.restore();
}
function fleck(ctx: CanvasRenderingContext2D, p: Point, size: number, angle: number, colour: string, opacity: number) {
  if (opacity <= 0) return;
  ctx.save(); ctx.globalAlpha *= opacity; ctx.translate(p.x, p.y); ctx.rotate(angle);
  ctx.beginPath(); ctx.moveTo(-size, -.3 * size); ctx.lineTo(-.15 * size, -size); ctx.lineTo(size, .1 * size); ctx.lineTo(.35 * size, .65 * size); ctx.lineTo(-.6 * size, .7 * size); ctx.closePath(); ctx.fillStyle = colour; ctx.fill(); ctx.restore();
}
function puff(ctx: CanvasRenderingContext2D, p: Point, time: number, colour = DUST, size = 1, seed = 0) {
  if (time <= 0 || time >= 1) return;
  const open = 1 - (1 - time) ** 2.6, alpha = ease(time / .12) * (1 - time);
  for (let i = 0; i < 12; i++) {
    const angle = rand(i, seed) * TAU, reach = (22 + rand(i, seed + 1) * 43) * size * open;
    bloom(ctx, { x: p.x + Math.cos(angle) * reach, y: p.y + Math.sin(angle) * reach * .32 - time * 9 }, (14 + rand(i, seed + 2) * 16 + time * 17) * size, colour, alpha * .7, .57);
  }
}
function spray(ctx: CanvasRenderingContext2D, p: Point, time: number, colour: string, reach = 65, seed = 0, count = 21) {
  if (time <= 0 || time >= 1) return;
  const open = 1 - (1 - time) ** 2, alpha = ease(time / .07) * (1 - time);
  for (let i = 0; i < count; i++) {
    const angle = rand(i, seed) * TAU, r = (reach * .35 + rand(i, seed + 1) * reach) * open;
    const at = { x: p.x + Math.cos(angle) * r, y: p.y + Math.sin(angle) * r * .48 - Math.sin(time * Math.PI) * (13 + rand(i, seed + 2) * 30) + time * time * 22 };
    fleck(ctx, at, 1 + rand(i, seed + 3) * 3 * (1 - time), angle + time * 3, colour, alpha * (.4 + rand(i, seed + 4) * .6));
  }
}
function footAt(a: Point, b: Point, u: number, lift = 0, sway = 0) {
  const p = mix(a, b, u), height = Math.sin(u * Math.PI);
  p.y -= height * lift; p.x += height * sway; return p;
}
function wake(ctx: CanvasRenderingContext2D, a: Point, b: Point, u: number, t: number, colour: string[], size: number, lift = 0, sway = 0, seed = 0) {
  const fade = ease((t - .22) / .07) * (1 - ease((t - .55) / .1));
  if (fade <= 0) return;
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
  const length = Math.min(.24, 105 / len);
  const air = lift > 0;
  for (let i = 0; i < 15; i++) {
    const age = i / 15, v = Math.max(0, u - age * length), p = footAt(a, b, v, lift, sway);
    const spread = (rand(i, seed) - .5) * size * (1 + age), drift = Math.sin(t * 12 + i) * 6;
    p.x += nx * spread; p.y += ny * spread * .5 - 12 + drift;
    const reach = (air ? 48 : 25) + age * (air ? 48 : 30);
    const tail = { x: p.x - dx / len * reach, y: p.y - dy / len * reach - 8 - age * 12 };
    wisp(ctx, p, tail, size * (.12 + rand(i, seed + 1) * .13) * (air ? 1.55 : 1) * (1 - age * .7), colour, fade * (1 - age) * (air ? .95 : .72), rand(i, seed + 2));
    if (i % 4 === 0) bloom(ctx, p, size * (air ? .85 : .65), colour, fade * (1 - age) * (air ? .25 : .14), .7);
  }
}
function liftCloud(ctx: CanvasRenderingContext2D, p: Point, t: number, colour: string[], seed: number, strength = 1) {
  const amount = pulse(t, .05, .37);
  if (amount <= 0) return;
  for (let i = 0; i < 7; i++) {
    const side = i % 2 ? -1 : 1, r = 20 + rand(i, seed) * 25;
    const root = { x: p.x + side * r, y: p.y - 3 + rand(i, seed + 1) * 9 };
    const tip = { x: root.x + side * (12 + amount * 18), y: root.y - (35 + rand(i, seed + 2) * 40) * amount };
    wisp(ctx, root, tip, 7 + rand(i, seed + 3) * 8, colour, amount * .6 * strength);
  }
}
/** A Mirror copy of Fire Starter: the same painted fire as the real walk, read from the card clock of the copy. */
function fireCopy(ctx: CanvasRenderingContext2D, a: Point, b: Point, t: number, u: number, layer: CardLayer) {
  const ms = t * 1300, leave = .22 * 1300;
  ignite(ctx, a, ms, leave, layer, 14);
  const count = Math.max(4, Math.min(30, Math.round(Math.hypot(b.x - a.x, b.y - a.y) / 30)));
  if (layer === 'under') for (let i = 1; i < count; i++) {
    const k = i / count, at = mix(a, b, k), side = (i & 1 ? 1 : -1) * (6 + rand(i, 16) * 18);
    if (u >= k) flameAt(ctx, at.x + side, at.y + rand(i, 17) * 6, .56 + rand(i, 18) ** 2 * .6, ms - leave - k * 520, 620, 16 + i);
  }
  fireBurst(ctx, b, (t - .62) / .38 * 1000, layer, 61, 1.3);
}
/** Air moves are not a slide: the figure crouches, leaves the ground, leans into a real arc, lands and absorbs it. */
export const AIR_IDS = new Set(['Flight', 'Leap', 'Vault', 'SkyLift', 'MercyHop']);
export const AIR_LEAVES = .22, AIR_LANDS = .62, AIR_SETTLED = .8;
const AIR_LIFT: Record<string, number> = { Flight: 138, Leap: 124, Vault: 118, SkyLift: 142, MercyHop: 112 };
/** A heavy landing squashes the body more; cloud carries the figure down. */
const AIR_THUD: Record<string, number> = { Flight: .1, Leap: .22, Vault: .18, SkyLift: .1, MercyHop: .08 };
/** How much the rise and fall ease at the two ends: cloud carries softly, a jump keeps some speed for its thud. */
const AIR_SOFT: Record<string, number> = { Flight: .85, Leap: .45, Vault: .45, SkyLift: .85, MercyHop: .85 };
export interface AirPose { x: number; y: number; groundX: number; groundY: number; lift: number; tilt: number; sx: number; sy: number }
export function airPose(id: string, a: Point, b: Point, t: number, sway = 0): AirPose {
  const w = clamp((t - AIR_LEAVES) / (AIR_LANDS - AIR_LEAVES)), u = .6 * ease(w) + .4 * w, arc = Math.sin((w + (ease(w) - w) * AIR_SOFT[id]) * Math.PI);
  const lift = arc * AIR_LIFT[id], dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
  const groundX = a.x + dx * u + arc * sway, groundY = a.y + dy * u;
  // Weight first: a crouch, a stretch off the ground, then the landing the legs absorb.
  const crouch = ease(t / .17) * (1 - ease((t - .19) / .06)), stretch = pulse(t, .2, .18), landed = clamp((t - AIR_LANDS) / (AIR_SETTLED - AIR_LANDS));
  const squash = Math.sin(landed * Math.PI) * (1 - landed * .35) * AIR_THUD[id];
  const lean = (Math.abs(dx) > 1 ? Math.sign(dx) : 1) * (.14 + .24 * Math.abs(dx) / len);
  return {
    x: groundX, y: groundY - lift, groundX, groundY, lift,
    tilt: lean * arc - lean * .32 * crouch + lean * .28 * pulse(t, AIR_LANDS - .06, .2),
    sx: 1 + .09 * crouch - .05 * stretch + squash * .55,
    sy: 1 - .15 * crouch + .1 * stretch - squash,
  };
}
const AIR_TRAIL = 13;
const airMaterial = (id: string, unit: number): CloudTint => id === 'MercyHop' ? 'gold' : id === 'Vault' ? 'slate' : id === 'SkyLift' && !unit ? 'lilac' : id === 'SkyLift' ? 'slate' : 'cloud';
function drawAir(ctx: CanvasRenderingContext2D, id: string, event: CardFrame, layer: CardLayer, a: Point, b: Point, sway: number, unit: number) {
  const { t } = event, duration = MOVEMENT_DURATIONS[id], seed = 60 + unit * 40, leap = id === 'Leap', tint = airMaterial(id, unit), puff = id === 'MercyHop' ? .55 : 1;
  const up = (t - .1) * duration, down = (t - AIR_LANDS) * duration, back = Math.atan2(a.y - b.y, a.x - b.x), angle = back + Math.PI;
  const flying = t > AIR_LEAVES && t < AIR_LANDS, at = airPose(id, a, b, t, sway);
  if (leap) earthPush(ctx, a, up, layer, back, seed);
  else cloudRing(ctx, a, up, layer, seed, (id === 'Vault' ? .66 : .82) * puff, tint);
  if (layer === 'under' && t < AIR_SETTLED) groundShade(ctx, at.groundX, at.groundY, at.lift);
  // The gust that lifts the figure: short bands that rise round it and thin out.
  if (layer === 'under' && !leap) for (let i = 0; i < 5; i++) {
    const side = i % 2 ? -1 : 1, r = 34 + rand(i, seed) * 30, age = up - 110 - i * 26;
    windAt(ctx, a.x + side * r, a.y - 34 - age * .13, -Math.PI / 2 + side * .16, .62 * puff, age, 460, tint);
  }
  for (let i = 0; i < AIR_TRAIL; i++) {
    // Each point of the arc sheds material when the figure passes it; the material then lives on its own clock.
    const passed = AIR_LEAVES + (AIR_LANDS - AIR_LEAVES) * (i + .5) / AIR_TRAIL, age = (t - passed) * duration;
    if (age <= 0 || age > 1000) continue;
    const p = airPose(id, a, b, passed, sway);
    if (leap) {
      if (layer === 'over') {
        if (i % 2 === 0) dustAt(ctx, p.x + (rand(i, seed) - .5) * 34, p.y + 4 + age * .06, .44 + rand(i, seed + 1) * .2, age, 480, seed + i);
        clodFall(ctx, p, age, 640, 2, seed + i * 3);
      }
    } else if (layer === 'over') {
      cloudAt(ctx, p.x + (rand(i, seed) - .5) * 42 * puff, p.y + 8, (.4 + rand(i, seed + 1) * .3) * puff, age, 660, seed + i, tint);
      if (i % 2) windAt(ctx, p.x + (rand(i, seed + 2) - .5) * 56, p.y - 24 - rand(i, seed + 3) * 64, angle + (rand(i, seed + 4) - .5) * .2, .46 + rand(i, seed + 5) * .4, age - 20, 400, tint);
    }
  }
  // The cloud that carries the figure grows under him as he leaves and lets go when he lands, so it never pops.
  if (t > AIR_LEAVES && layer === 'over' && !leap) cloudAt(ctx, at.x, at.y + 14, .74 * puff, flying ? Math.min(260, (t - AIR_LEAVES) * duration) : 260 + (t - AIR_LANDS) * duration, 660, seed + 90, tint);
  // A card has no tail: the landing runs fast enough to finish inside the card's own clock.
  const left = (1 - AIR_LANDS) * duration;
  if (leap || id === 'Vault') stomp(ctx, b, down * 1000 / left, layer, seed + 30, leap ? 1.1 : .84);
  else cloudRing(ctx, b, down * 900 / left, layer, seed + 30, .86 * puff, tint);
}
export const MOVEMENT_DURATIONS: Record<string, number> = { Strike: 1500, FireStarter: 1700, Haste: 2600, Rally: 2700, March: 1650, Flight: 1750, Leap: 1600, Vault: 1750, SkyLift: 1850, MercyHop: 1350 };
export const MOVEMENT_IDS = new Set(Object.keys(MOVEMENT_DURATIONS));
export function drawMovement(ctx: CanvasRenderingContext2D, scene: PaintedScene, id: string, event: CardFrame, layer: CardLayer) {
  const { move, t, travel: u, index = 0 } = event;
  if (!MOVEMENT_IDS.has(id) || t <= 0 || t >= 1) return;
  const a = scene.foot(move.from), b = scene.foot(move.from === move.to && move.captures.length ? move.captures.at(-1)! : move.to), p = mix(a, b, u);
  const launch = clamp((t - .1) / .34), land = clamp((t - .62) / .35);
  const moving = t > .22 && t < .62;
  ctx.save();
  if (AIR_IDS.has(id)) {
    if (id === 'SkyLift') { drawAir(ctx, id, event, layer, a, b, 24, 0); drawAir(ctx, id, event, layer, b, a, -24, 1); }
    else drawAir(ctx, id, event, layer, a, b, 0, 0);
  } else if (id === 'Strike') {
    if (layer === 'under') {
      bloom(ctx, a, 65, GOLD, pulse(t, .03, .34) * .3, .32);
      if (moving) bloom(ctx, p, 43, GOLD, pulse(t, .22, .4) * .23, .3);
      puff(ctx, b, land, GOLD, .55, 1);
    } else {
      if (moving) wake(ctx, a, b, u, t, GOLD, 23, 0, 0, 2);
      // A quiet arrival sheds a few motes, without a blow or a flame.
      spray(ctx, b, land, '#e2bd74', 30, 4, 9);
    }
  } else if (id === 'FireStarter') {
    fireCopy(ctx, a, b, t, u, layer);
  } else if (id === 'Haste') {
    if (layer === 'under') {
      puff(ctx, a, launch, GOLD, .65, 20 + index);
      if (moving) bloom(ctx, p, 54, GOLD, pulse(t, .22, .4) * .4, .27);
      puff(ctx, b, land, DUST, .7, 22 + index);
    } else {
      if (moving) {
        wake(ctx, a, b, u, t, GOLD, 44, 0, 0, 24 + index);
        const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
        for (let i = 0; i < 8; i++) {
          const life = (u * 1.8 + rand(i, 27)) % 1, at = footAt(a, b, Math.max(0, u - life * Math.min(.2, 85 / len)));
          at.y -= 10 + rand(i, 28) * 48; at.x += (rand(i, 29) - .5) * 44;
          wisp(ctx, at, { x: at.x - dx / len * 28, y: at.y - dy / len * 28 }, 1.5, GOLD, Math.sin(life * Math.PI) * pulse(t, .22, .4));
        }
      }
      spray(ctx, { x: b.x, y: b.y - 12 }, land, '#f4ca73', 58, 30, 18);
    }
  } else if (id === 'Rally') {
    if (layer === 'under') {
      puff(ctx, a, launch, GOLD, .8, 34 + index);
      if (moving) bloom(ctx, p, 56, GOLD, pulse(t, .22, .4) * .27, .35);
      puff(ctx, b, land, GOLD, .65, 36 + index);
    } else {
      liftCloud(ctx, a, t, GOLD, 38 + index, .8);
      if (moving) {
        wake(ctx, a, b, u, t, GOLD, 32, 0, 0, 40 + index);
        for (let i = 0; i < 6; i++) {
          const side = i % 2 ? -1 : 1, at = { x: p.x + side * (27 + rand(i, 41) * 15), y: p.y - 8 - rand(i, 42) * 20 };
          wisp(ctx, at, { x: at.x + side * 17, y: at.y - 32 - rand(i, 43) * 32 }, 5, GOLD, pulse(t, .22, .4) * .55);
        }
      }
      spray(ctx, b, land, '#dfcb9a', 38, 44 + index, 13);
    }
  } else if (id === 'March') {
    if (layer === 'under') {
      // Two footfalls follow the pawn through its intermediate square.
      puff(ctx, a, clamp((t - .18) / .31), DUST, .85, 48);
      puff(ctx, mix(a, b, .5), clamp((t - .42) / .3), DUST, .95, 49);
      puff(ctx, b, land, DUST, .8, 50);
      if (moving) wake(ctx, a, b, u, t, DUST, 25, 0, 0, 51);
    } else {
      spray(ctx, a, clamp((t - .18) / .3), '#907653', 32, 53, 10);
      spray(ctx, mix(a, b, .5), clamp((t - .42) / .3), '#ac9164', 36, 54, 12);
      spray(ctx, b, land, '#a78b60', 31, 55, 10);
    }
  }
  ctx.restore();
}
