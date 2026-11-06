import type { PaintedScene } from '../../../docs/2d-first-pieces/board/scene.mjs';
import type { CardFrame, CardLayer, Point } from './card-types';
import { fireStamps, rand, stamp, type FireStamps } from './hero-stamps';

const TAU = Math.PI * 2;
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const ease = (t: number) => { t = clamp(t); return t * t * (3 - 2 * t); };
// Card clock. The actor slides .22 to .62 and the board changes at .62, which is also the scene's contact beat.
const LAUNCH = .2, HIT = .4, ERUPT = .62;
const body = (foot: Point) => ({ x: foot.x, y: foot.y - 66 });

function ballAt(a: Point, b: Point, k: number): Point {
  const u = clamp(k) ** 1.7; // A heavy ball leaves slowly and arrives fast.
  return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u - Math.sin(clamp(k) * Math.PI) * 38 };
}
function ball(ctx: CanvasRenderingContext2D, set: FireStamps, p: Point, radius: number, t: number) {
  const scale = radius / 48;
  stamp(ctx, set.hot, p.x, p.y, radius * 2.5 / 80, 0, .55);
  stamp(ctx, set.fire[0], p.x, p.y, scale * 1.2, t * 9, 1);
  stamp(ctx, set.fire[1], p.x, p.y, scale, -t * 14 + 2, 1);
  stamp(ctx, set.fire[2], p.x, p.y, scale * .72, t * 21 + 4, 1);
  stamp(ctx, set.hot, p.x, p.y, radius * .9 / 80, 0, .95);
}
// Stable victim silhouette, cut once per playback: a burned figure goes dark before the fire takes it.
let char: { canvas: HTMLCanvasElement; owner: CardFrame | null } | undefined;
const CHAR_W = 240, CHAR_H = 260, CHAR_X = 120, CHAR_Y = 215;
function charred(scene: PaintedScene, event: CardFrame, square: number, foot: Point) {
  char ??= { canvas: Object.assign(document.createElement('canvas'), { width: CHAR_W, height: CHAR_H }), owner: null };
  if (char.owner !== event) {
    char.owner = event;
    const g = char.canvas.getContext('2d')!;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, CHAR_W, CHAR_H);
    g.translate(CHAR_X - foot.x, CHAR_Y - foot.y); scene.ghost(g, event.before.board[square], square, 1);
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = '#1d0f08'; g.fillRect(0, 0, CHAR_W, CHAR_H);
    g.globalCompositeOperation = 'source-over';
  }
  return char.canvas;
}
function tongues(ctx: CanvasRenderingContext2D, set: FireStamps, foot: Point, t: number, amount: number, back: boolean) {
  if (amount <= 0) return;
  for (let i = 0; i < 26; i++) {
    if ((i % 2 === 0) !== back) continue;
    const across = rand(i, 2) * 2 - 1, x = foot.x + across * 60, depth = rand(i, 7) * 26;
    const age = (t * (5.2 + rand(i, 4) * 2) + rand(i, 5)) % 1, centre = 1 - Math.abs(across) * .5, tall = .55 + rand(i, 6) ** 2 * .85;
    const height = (back ? 1.4 : 1.05) * tall * centre * amount * (.55 + Math.sin(age * Math.PI) * .6), wide = (.62 + rand(i, 8) * .4) * (.72 + height * .34);
    stamp(ctx, set.flames[i % 4], x + Math.sin(age * 7 + i) * 5, foot.y + (back ? -22 : 14) - depth - age * 14, wide, 0, Math.sin(clamp(age * 1.05) * Math.PI) ** .5 * Math.min(1, amount * 2.2), height / wide);
  }
}
function smoke(ctx: CanvasRenderingContext2D, set: FireStamps, foot: Point, t: number) {
  for (let i = 0; i < 18; i++) {
    const k = (t - (ERUPT - .05) - rand(i, 21) * .2) / .34;
    if (k <= 0 || k >= 1) continue;
    const up = ease(k) ** .8 * (120 + rand(i, 22) * 95), side = (rand(i, 23) - .5) * 130 + Math.sin(k * 4 + i) * 14;
    stamp(ctx, set.smoke[i % 3], foot.x + side * (.45 + k * .55), foot.y - 60 - up, .5 + k * (.75 + rand(i, 24) * .35), i + k * .8, ease(k / .18) * (1 - ease((k - .3) / .7)) * .72 * (1 - ease((t - .86) / .13)));
  }
}

export function drawBurn(ctx: CanvasRenderingContext2D, scene: PaintedScene, event: CardFrame, layer: CardLayer) {
  const { t, move } = event, set = fireStamps(), footA = scene.foot(move.from), square = move.captures.at(-1) ?? move.to, footB = scene.foot(square);
  const aim = body(footB), out = { x: footB.x - footA.x, y: footB.y - footA.y }, len = Math.hypot(out.x, out.y) || 1;
  const start = { x: footA.x + out.x / len * 30, y: footA.y - 74 + out.y / len * 14 };
  const flight = (t - LAUNCH) / (HIT - LAUNCH), hit = (t - HIT) / .15, erupt = (t - ERUPT) / .38;
  const column = t < ERUPT ? ease(hit / .7) * .72 : (.72 + .28 * ease(erupt / .1)) * (1 - ease((erupt - .28) / .5));
  if (layer === 'under') {
    // The floor lights under the gather, the ball throws a shadow in flight, and the target square scorches.
    if (t < LAUNCH + .05) stamp(ctx, set.hot, footA.x + out.x / len * 20, footA.y - 2, .5 + ease(t / LAUNCH) * .5, 0, ease(t / LAUNCH) * (1 - ease(flight / .2)) * .7, .4);
    if (flight > 0 && flight < 1) { const g = { x: footA.x + (footB.x - footA.x) * clamp(flight) ** 1.7, y: footA.y + (footB.y - footA.y) * clamp(flight) ** 1.7 }; stamp(ctx, set.scorch, g.x, g.y, .32 + flight * .1, 0, .5, .36); stamp(ctx, set.hot, g.x, g.y, .55, 0, .34, .34); }
    if (t > HIT) {
      stamp(ctx, set.scorch, footB.x, footB.y - 26, .5 + ease(hit / .4) * .36, 0, ease(hit / .3) * (1 - ease((t - .88) / .12)) * .95, .72);
      stamp(ctx, set.hot, footB.x, footB.y - 4, 1.1, 0, ease(hit / .3) * (1 - ease(erupt / .75)) * .75, .5);
    }
    tongues(ctx, set, footB, t, column, true);
    return;
  }
  if (t < LAUNCH + .03) {
    // Gather: tufts of fire draw into the ball at the actor's chest.
    const g = ease(t / LAUNCH);
    for (let i = 0; i < 12; i++) {
      const a = i * 2.399, k = clamp(t / LAUNCH * 1.3 - rand(i, 31) * .3), r = (92 - 84 * ease(k)) * (.8 + rand(i, 32) * .4), turn = a + k * 1.8;
      stamp(ctx, set.fire[i % 3], start.x + Math.cos(turn) * r, start.y + Math.sin(turn) * r * .8, .2 + rand(i, 33) * .14, a + k * 3, ease(k / .3) * (1 - ease((flight - .0) / .12)));
    }
    if (flight <= 0) ball(ctx, set, start, 8 + g * 32, t);
  }
  if (flight > 0 && flight < 1) {
    // The wake is the ball's own fire falling behind it: older samples are smaller, darker, then smoke.
    for (let i = 16; i >= 1; i--) {
      const k = flight - i * .036;
      if (k <= -.03) continue;
      const p = ballAt(start, aim, k), age = i / 16, jig = Math.sin(t * 34 + i * 2) * 6 * age;
      if (age > .4) stamp(ctx, set.smoke[i % 3], p.x + jig, p.y - age * 14, .3 + age * .28, i + t * 3, (1 - age) * 1.1);
      stamp(ctx, set.fire[i % 3], p.x - jig, p.y + jig * .5, (.86 - age * .6) * (.7 + flight * .3), i * 1.3 + t * 8, 1 - age * .5);
    }
    for (let i = 0; i < 14; i++) {
      const life = (t * 6 + rand(i, 36)) % 1, p = ballAt(start, aim, flight - life * .34);
      stamp(ctx, set.ember, p.x + (rand(i, 37) - .5) * 46 * life, p.y + life * life * 42 + (rand(i, 38) - .5) * 24, .3 + rand(i, 39) * .4, 0, 1 - life);
    }
    ball(ctx, set, ballAt(start, aim, flight), 40 + flight * 5, t);
  }
  if (t > HIT - .02 && t < ERUPT + .02) {
    // The victim burns on its own square through the hit. It goes dark, then the board removes it inside the eruption.
    const image = charred(scene, event, square, footB);
    ctx.save(); ctx.globalAlpha *= ease((t - HIT) / .15) * .9 * (1 - ease((t - ERUPT + .005) / .025)); ctx.drawImage(image, footB.x - CHAR_X, footB.y - CHAR_Y); ctx.restore();
  }
  tongues(ctx, set, footB, t, column, false);
  smoke(ctx, set, footB, t);
  if (hit > 0 && hit < 1) {
    // Impact: the ball breaks into a body of fire larger than the tile.
    for (let i = 0; i < 16; i++) {
      const a = i * 2.399, k = 1 - (1 - hit) ** 2.2, r = (20 + rand(i, 41) * 86) * k;
      stamp(ctx, set.fire[i % 3], aim.x + Math.cos(a) * r, aim.y + Math.sin(a) * r * .74 - hit * 14, (.5 + rand(i, 42) * .5) * (.75 + hit * .5), a + hit * 2, ease(hit / .06) * (1 - ease((hit - .3) / .6)));
    }
    stamp(ctx, set.hot, aim.x, aim.y, 1.05 + ease(hit / .3) * .75, 0, ease(hit / .05) * (1 - ease((hit - .1) / .6)));
  }
  const blast = (t - ERUPT + .035) / .2;
  if (blast > 0 && blast < 1) {
    // Eruption, full just as the contact beat arrives: it covers the instant when the board removes the victim.
    for (let i = 0; i < 14; i++) {
      const a = i * 2.399 + 1, r = (24 + rand(i, 43) * 70) * (1 - (1 - blast) ** 2), up = ease(blast) * (20 + rand(i, 44) * 62);
      stamp(ctx, set.fire[i % 3], footB.x + Math.cos(a) * r, footB.y - 50 + Math.sin(a) * r * .42 - up, (.66 + rand(i, 45) * .5) * (.8 + blast * .5), a + blast * 2, ease(blast / .16) * (1 - ease((blast - .28) / .72)));
    }
    stamp(ctx, set.hot, footB.x, footB.y - 58, 1 + blast * .6, 0, ease(blast / .16) * (1 - ease((blast - .1) / .5)) * .95);
  }
  for (let i = 0; i < 26; i++) {
    // Sparks from the hit, then ash rising from the consumed figure.
    const k = (t - HIT - rand(i, 46) * .3) / .36;
    if (k <= 0 || k >= 1) continue;
    const a = rand(i, 47) * TAU, r = (30 + rand(i, 48) * 110) * (1 - (1 - k) ** 2);
    stamp(ctx, set.ember, aim.x + Math.cos(a) * r, aim.y + Math.sin(a) * r * .6 - k * (24 + rand(i, 49) * 60), .3 + rand(i, 50) * .5, 0, Math.sin(k * Math.PI) ** .6 * (1 - ease((t - .88) / .11)));
  }
}
