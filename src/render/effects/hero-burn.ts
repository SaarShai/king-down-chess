import type { PaintedScene } from '../../../docs/2d-first-pieces/board/scene.mjs';
import type { CardFrame, CardLayer, Point } from './card-types';
import { paintBall, paintBurst, paintChar, paintEmber, paintFlame, paintSmoke } from './fire-art';
import { rand } from './hero-stamps';
import { groundShade } from './travel-material';

const TAU = Math.PI * 2;
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const ease = (t: number) => { t = clamp(t); return t * t * (3 - 2 * t); };
// Card clock. The actor slides .22 to .62 and the board changes at .62, which is also the scene's contact beat.
const LAUNCH = .2, HIT = .4, ERUPT = .62, DURATION = 1500;
const body = (foot: Point) => ({ x: foot.x, y: foot.y - 66 });

function ballAt(a: Point, b: Point, k: number): Point {
  const u = clamp(k) ** 1.7; // A heavy ball leaves slowly and arrives fast.
  return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u - Math.sin(clamp(k) * Math.PI) * 38 };
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
function tongues(ctx: CanvasRenderingContext2D, foot: Point, t: number, amount: number, back: boolean) {
  if (amount <= 0) return;
  for (let i = 0; i < 12; i++) {
    if (back ? i % 2 !== 0 : i % 4 !== 1) continue;
    const across = rand(i, 2) * 2 - 1, depth = rand(i, 7) * 22, centre = 1 - Math.abs(across) * .45, tall = (.7 + rand(i, 6) * .5) * centre * amount * (back ? 1.3 : .62);
    paintFlame(ctx, foot.x + across * 58, foot.y + (back ? -16 : 18) - depth, 72 * (.72 + tall * .3), 112 * tall, t * DURATION + rand(i, 5) * 640, i, Math.min(1, amount * 3));
  }
}
function smoke(ctx: CanvasRenderingContext2D, foot: Point, t: number) {
  for (let i = 0; i < 3; i++) {
    const k = (t - (ERUPT + .14) - rand(i, 21) * .1) / .26;
    if (k <= 0 || k >= 1) continue;
    const up = ease(k) ** .8 * (90 + rand(i, 22) * 80), side = (rand(i, 23) - .5) * 120;
    paintSmoke(ctx, foot.x + side * (.45 + k * .55), foot.y - 80 - up, .8 + k * (.5 + rand(i, 24) * .3), i, ease(k / .2) * (1 - ease((k - .35) / .65)) * .9 * (1 - ease((t - .88) / .12)));
  }
}

function eruption(ctx: CanvasRenderingContext2D, foot: Point, t: number) {
  const blast = (t - ERUPT + .035) / .32;
  if (blast > 0 && blast < 1) paintBurst(ctx, foot.x, foot.y + 20, .25 + blast * .75, 1.5, ease(blast / .08));
}

export function drawBurn(ctx: CanvasRenderingContext2D, scene: PaintedScene, event: CardFrame, layer: CardLayer) {
  const { t, move } = event, ms = t * DURATION, footA = scene.foot(move.from), square = move.captures.at(-1) ?? move.to, footB = scene.foot(square);
  const aim = body(footB), out = { x: footB.x - footA.x, y: footB.y - footA.y }, len = Math.hypot(out.x, out.y) || 1;
  const start = { x: footA.x + out.x / len * 30, y: footA.y - 74 + out.y / len * 14 };
  const flight = (t - LAUNCH) / (HIT - LAUNCH), hit = (t - HIT) / .15, erupt = (t - ERUPT) / .38;
  const column = t < ERUPT ? ease(hit / .7) * .72 : (.72 + .28 * ease(erupt / .1)) * (1 - ease((erupt - .28) / .5));
  if (layer === 'under') {
    // The ball throws a shadow in flight, and the target square burns with molten cracks.
    if (flight > 0 && flight < 1) { const u = clamp(flight) ** 1.7; groundShade(ctx, footA.x + (footB.x - footA.x) * u, footA.y + (footB.y - footA.y) * u, 90); }
    if (t > HIT) paintChar(ctx, footB.x, footB.y, 118 + ease(hit / .4) * 70, square, ease(hit / .3) * (1 - ease((t - .88) / .12)));
    tongues(ctx, footB, t, column, true);
    // The actor stands on the square from the contact beat, as a real figure above this layer. The picture does not change.
    if (t >= ERUPT) eruption(ctx, footB, t);
    return;
  }
  if (t < LAUNCH + .03) {
    // Gather: sparks draw in, and a knot of fire swells at the actor's chest until the ball leaves it.
    const g = ease(t / LAUNCH);
    for (let i = 0; i < 10; i++) {
      const a = i * 2.399, k = clamp(t / LAUNCH * 1.3 - rand(i, 31) * .3), r = (88 - 80 * ease(k)) * (.8 + rand(i, 32) * .4), turn = a + k * 1.8;
      paintEmber(ctx, start.x + Math.cos(turn) * r, start.y + Math.sin(turn) * r * .8, 8 + rand(i, 33) * 7, a + k * 3, i, ease(k / .3) * (1 - ease(k - .7) ) * (1 - ease(flight / .12)));
    }
    paintBurst(ctx, start.x, start.y + 16 * (.4 + g * .7), .03 + g * .085, .4 + g * .7, ease(t / .05) * (1 - ease(flight / .15)));
  }
  if (flight > 0 && flight < 1) {
    // Older samples of the path leave smoke and falling embers. The ball's own tail is the wake.
    for (let i = 0; i < 4; i++) {
      const own = flight - .14 - i * .17;
      if (own < 0) continue;
      const p = ballAt(start, aim, own), age = (flight - own) / .7;
      paintSmoke(ctx, p.x, p.y - age * 16, .24 + age * .3, i, ease(age * 4) * (1 - ease(age)) * .8);
    }
    for (let i = 0; i < 10; i++) {
      const life = (t * 6 + rand(i, 36)) % 1, p = ballAt(start, aim, flight - life * .34);
      paintEmber(ctx, p.x + (rand(i, 37) - .5) * 40 * life, p.y + life * life * 42 + (rand(i, 38) - .5) * 22, 6 + rand(i, 39) * 7, life * 4 + i, i, (1 - life) * ease(flight / .1));
    }
    const p = ballAt(start, aim, flight), q = ballAt(start, aim, flight + .02);
    paintBall(ctx, p.x, p.y, Math.atan2(q.y - p.y, q.x - p.x), .8 + flight * .25, .5 + ease(flight / .22) * .5, ms, ease(flight / .07));
  }
  if (t > HIT - .02 && t < ERUPT + .02) {
    // The victim burns on its own square through the hit. It goes dark, then the board removes it inside the eruption.
    const image = charred(scene, event, square, footB);
    ctx.save(); ctx.globalAlpha *= ease((t - HIT) / .15) * .9 * (1 - ease((t - ERUPT + .005) / .025)); ctx.drawImage(image, footB.x - CHAR_X, footB.y - CHAR_Y); ctx.restore();
  }
  // Front flames sink under the arriving actor and rise again at its feet, because the actor changes layer at the contact beat.
  tongues(ctx, footB, t, column * (1 - ease((t - ERUPT + .06) / .06) + ease((t - ERUPT) / .06)), false);
  smoke(ctx, footB, t);
  // Impact: the ball breaks into a body of fire at the victim's chest, then the eruption stands up from the floor.
  const impact = (t - HIT + .012) / .2;
  if (impact > 0 && impact < 1) paintBurst(ctx, aim.x, aim.y + 58, .02 + impact * .42, 1.02, ease(impact / .06) * (1 - ease((impact - .78) / .22)));
  // Eruption, full just as the contact beat arrives: it covers the victim until the board removes it.
  if (t < ERUPT) eruption(ctx, footB, t);
  for (let i = 0; i < 16; i++) {
    // Embers from the hit, then ash rising from the consumed figure.
    const k = (t - HIT - rand(i, 46) * .3) / .36;
    if (k <= 0 || k >= 1) continue;
    const a = rand(i, 47) * TAU, r = (30 + rand(i, 48) * 110) * (1 - (1 - k) ** 2);
    paintEmber(ctx, aim.x + Math.cos(a) * r, aim.y + Math.sin(a) * r * .6 - k * (24 + rand(i, 49) * 60), 7 + rand(i, 50) * 9, k * 5 * (rand(i, 51) - .5), i, Math.sin(k * Math.PI) ** .6 * (1 - ease((t - .88) / .11)));
  }
}
