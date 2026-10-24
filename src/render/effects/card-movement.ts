import type { PaintedScene } from '../../../docs/2d-first-pieces/board/scene.mjs';
import type { CardFrame, CardLayer, Point } from './card-types';

// Material follows the same intact figure motion as the study player.
const TAU = Math.PI * 2;
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const ease = (n: number) => { const t = clamp(n); return t * t * (3 - 2 * t); };
const rand = (i: number, seed = 0) => { const n = Math.sin(i * 127.1 + seed * 311.7 + .5) * 43758.5453; return n - Math.floor(n); };
const mix = (a: Point, b: Point, u: number) => ({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u });
const pulse = (t: number, start: number, span: number) => Math.sin(clamp((t - start) / span) * Math.PI);
const GOLD = ['#fff4cce8', '#f8cf7b91', '#dba44136', '#dba44100'];
const FIRE = ['#fff0b4f0', '#ffb440c4', '#df481b69', '#d6350800'];
const AIR = ['#f3ffffec', '#b5e4e8c4', '#5babb568', '#5babb500'];
const SAGE = ['#edf9cce8', '#b4cf85bf', '#779c4d66', '#779c4d00'];
const BLUE = ['#eafafff2', '#99cff4d4', '#438dd580', '#438dd500'];
const LILAC = ['#f3e6fff2', '#cba4f4d4', '#9164d780', '#9164d700'];
const DUST = ['#c3a88494', '#a0846385', '#785b3e49', '#785b3e00'];
const SMOKE = ['#40332894', '#62513e69', '#8c72533b', '#8c725300'];
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
function flameArrival(ctx: CanvasRenderingContext2D, p: Point, time: number) {
  if (time <= 0 || time >= 1) return;
  const open = ease(time / .12), flame = open * (1 - ease((time - .22) / .58));
  for (let i = 0; i < 9; i++) {
    const side = (rand(i, 80) - .5) * 2;
    bloom(ctx, { x: p.x + side * (20 + time * 58), y: p.y - 12 - time * (35 + rand(i, 81) * 45) }, 21 + time * 31, SMOKE, open * (1 - time) * .65, .9);
  }
  for (let i = 0; i < 11; i++) {
    const spread = (rand(i, 84) - .5) * 2, root = { x: p.x + spread * 32, y: p.y - 5 - rand(i, 85) * 15 };
    const tip = { x: root.x + spread * (45 + open * 30), y: root.y - (48 + rand(i, 86) * 88) * (.55 + open * .45) };
    wisp(ctx, root, tip, 9 + rand(i, 87) * 15, FIRE, flame * .85, .9);
  }
  bloom(ctx, { x: p.x, y: p.y - 24 }, 74, FIRE, flame * .7, .72);
  spray(ctx, { x: p.x, y: p.y - 28 }, time, '#ffd788', 105, 89, 35);
}
export const MOVEMENT_DURATIONS: Record<string, number> = { Strike: 1500, FireStarter: 1700, Haste: 2600, Rally: 2700, March: 1650, Flight: 1750, Leap: 1600, Vault: 1750, SkyLift: 1850 };
export const MOVEMENT_IDS = new Set(Object.keys(MOVEMENT_DURATIONS));
export function drawMovement(ctx: CanvasRenderingContext2D, scene: PaintedScene, id: string, event: CardFrame, layer: CardLayer) {
  const { move, t, travel: u, index = 0 } = event;
  if (!MOVEMENT_IDS.has(id) || t <= 0 || t >= 1) return;
  const a = scene.foot(move.from), b = scene.foot(move.from === move.to && move.captures.length ? move.captures.at(-1)! : move.to), p = mix(a, b, u);
  const launch = clamp((t - .1) / .34), land = clamp((t - .62) / .35);
  const moving = t > .22 && t < .62;
  ctx.save();
  if (id === 'Strike') {
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
    if (layer === 'under') {
      puff(ctx, a, launch, SMOKE, .75, 10);
      if (moving) bloom(ctx, p, 56, FIRE, pulse(t, .22, .4) * .45, .34);
      puff(ctx, b, land, SMOKE, 1.25, 12);
      bloom(ctx, b, 87, FIRE, pulse(t, .62, .3) * .55, .33);
    } else {
      liftCloud(ctx, a, t, FIRE, 14, .65);
      if (moving) wake(ctx, a, b, u, t, FIRE, 50, 0, 0, 16);
      flameArrival(ctx, b, land);
    }
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
  } else {
    const sky = id === 'SkyLift', leap = id === 'Leap', vault = id === 'Vault';
    const units = sky ? [{ a, b, sway: 24, colour: LILAC }, { a: b, b: a, sway: -24, colour: BLUE }] : [{ a, b, sway: 0, colour: leap ? SAGE : vault ? BLUE : AIR }];
    for (const [i, unit] of units.entries()) {
      const { a: from, b: to, sway, colour } = unit, lift = sky ? 105 : 88, at = footAt(from, to, u, lift, sway);
      if (layer === 'under') {
        puff(ctx, from, launch, leap ? DUST : colour, sky ? 1.05 : .9, 58 + i);
        if (moving) {
          const ground = mix(from, to, u); ground.x += Math.sin(u * Math.PI) * sway;
          bloom(ctx, ground, 31 - Math.sin(u * Math.PI) * 7, ['#30291f51', '#30291f36', '#30291f12', '#30291f00'], .8, .23);
        }
        puff(ctx, to, land, leap || vault ? DUST : colour, vault ? 1.05 : .85, 62 + i);
      } else {
        liftCloud(ctx, from, t, colour, 65 + i, sky ? 1.35 : 1.05);
        if (moving) {
          const amount = pulse(t, .22, .4);
          wake(ctx, from, to, u, t, colour, sky ? 60 : vault ? 53 : 46, lift, sway, 68 + i);
          // Broad side volumes and upright feather jets remain visible on a full board.
          for (const side of [-1, 1]) bloom(ctx, { x: at.x + side * 40, y: at.y - 29 }, sky ? 49 : 40, colour, amount * (sky ? .48 : .35), 1.05);
          for (let j = 0; j < (sky || vault ? 8 : 6); j++) {
            const side = j % 2 ? -1 : 1, spread = 25 + rand(j, 71) * 20;
            const root = { x: at.x + side * spread, y: at.y + 8 - rand(j, 72) * 18 };
            const tip = { x: root.x + side * (8 + rand(j, 73) * 25), y: root.y - (60 + rand(j, 74) * 45) };
            wisp(ctx, root, tip, (sky ? 16 : 12) + rand(j, 75) * 7, colour, amount * (sky ? .94 : .8), side * 1.8);
          }
        }
        if (leap) spray(ctx, to, land, '#c4cb91', 48, 76, 15);
        else if (vault) spray(ctx, to, land, '#b8d6e6', 75, 78, 24);
        else {
          const amount = pulse(t, .62, .35);
          for (let j = 0; j < 5; j++) {
            const side = j % 2 ? -1 : 1, root = { x: to.x + side * (16 + land * 32), y: to.y - 4 - rand(j, 79) * 10 };
            wisp(ctx, root, { x: root.x + side * 38, y: root.y - 39 - land * 30 }, 14 * (1 - land), colour, amount * .85);
          }
        }
      }
    }
  }
  ctx.restore();
}
