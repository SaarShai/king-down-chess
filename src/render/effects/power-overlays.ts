import type { GameRules } from '../../game-rules';
import { P, colorOf, typeOf, type Move, type Position } from '../../rules/engine';
import type { PaintedScene } from '../../../docs/2d-first-pieces/board/scene.mjs';
import { walkAction } from './card';
import type { CardLayer, Point } from './card-types';
import type { MoveOverlay } from './move-overlay';
import { paintStreak } from './fire-art';
import { clamp, cloudAt, cloudRing, clodThrow, dustAt, earthPush, ease, emberRise, fireBurst, flameAt, ignite, rand, rootAt, scorchAt, smokeAt, stomp, windAt } from './travel-material';

/** An overlay whose landing outlives the move. PaintedView keeps drawing it for this many ms after the arrival. */
export interface TailedOverlay extends MoveOverlay { readonly tailMs: number }

type Kind = 'Strike' | 'FireStarter' | 'Haste' | 'Rally' | 'March' | 'Flight';
const TAIL: Record<Kind, number> = { Strike: 1050, FireStarter: 1050, Haste: 640, Rally: 640, March: 1000, Flight: 900 };
const MAX_TRAIL = 64;
/** Board px between two trail points, sparse enough that each piece of material stays one readable shape. */
const SPACING: Record<Kind, number> = { Strike: 25, FireStarter: 25, Haste: 26, Rally: 26, March: 22, Flight: 30 };

/** Always-on March has no tag: the double step from a rank where a plain pawn has none is the power. */
function marches(context: GameRules, before: Position, move: Move): boolean {
  const piece = before.board[move.from];
  if (move.power || move.pass || move.captures.length || !piece || typeOf(piece) !== P) return false;
  if (context.rules.kings[before.turn]?.power !== 'March' || context.rules.marchUses !== 0) return false;
  return Math.abs((move.to >> 3) - (move.from >> 3)) === 2 && (move.from >> 3) !== (colorOf(piece) === 0 ? 1 : 6);
}

/** Material over a move that keeps its real walk, read from the live foot. */
class WalkOverlay implements TailedOverlay {
  readonly tailMs: number;
  private a: Point = { x: 0, y: 0 };
  private b: Point = { x: 0, y: 0 };
  private foot: Point = { x: 0, y: 0 };
  private dirX = 0;
  private dirY = 0;
  private angle = 0;
  private started = false;
  private launch: number | null = null;
  private land: number | null = null;
  private lastMs = 0;
  /** x, y and birth ms of each point the foot passed. */
  private trail = new Float32Array(MAX_TRAIL * 3);
  private count = 0;
  private spacing = 25;
  private travelled = 0;
  private seed: number;

  constructor(private kind: Kind, private move: Move, index: number) {
    this.tailMs = TAIL[kind];
    this.seed = move.from * 3 + move.to + index * 7;
  }

  draw(ctx: CanvasRenderingContext2D, scene: PaintedScene, layer: CardLayer, row: number | undefined, ms: number): void {
    if (layer === 'over' && row !== 7) return;
    this.follow(scene, ms);
    ctx.save();
    if (this.kind === 'Strike' || this.kind === 'FireStarter') this.drawFire(ctx, layer, ms);
    else if (this.kind === 'Haste' || this.kind === 'Rally') this.drawSpeed(ctx, layer, ms);
    else if (this.kind === 'March') this.drawMarch(ctx, layer, ms);
    else this.drawFlight(ctx, layer, ms);
    ctx.restore();
  }

  private follow(scene: PaintedScene, ms: number): void {
    if (!this.started) {
      const { from, to, captures } = this.move;
      this.a = scene.foot(from); this.b = scene.foot(from === to && captures.length ? captures[captures.length - 1] : to);
      this.foot = { ...this.a };
      const dx = this.b.x - this.a.x, dy = this.b.y - this.a.y, len = Math.hypot(dx, dy) || 1;
      this.dirX = dx / len; this.dirY = dy / len; this.angle = Math.atan2(dy, dx);
      this.spacing = Math.max(SPACING[this.kind], len / (MAX_TRAIL - 2));
      this.started = true; this.lastMs = ms;
    }
    const running = scene.actionElapsed != null;
    let x = this.b.x, y = this.b.y;
    if (running) {
      let found = false;
      for (const frame of scene.characterFrames) if (frame.square === this.move.from) { x = frame.foot.x; y = frame.foot.y; found = true; break; }
      // A page without painted banks: the plain slide takes about this long.
      if (!found) { const u = ease(ms / 700); x = this.a.x + (this.b.x - this.a.x) * u; y = this.a.y + (this.b.y - this.a.y) * u; }
    }
    const step = Math.hypot(x - this.foot.x, y - this.foot.y), dt = Math.max(1, ms - this.lastMs);
    if (this.launch == null && Math.hypot(x - this.a.x, y - this.a.y) > 3) this.launch = ms;
    const here = Math.hypot(x - this.b.x, y - this.b.y) < 8;
    if (this.land == null && (!running || (this.launch != null && here && step / dt < .16))) this.land = ms;
    if (this.land == null && step > 0) {
      // Points between two frames share the frames' clock, so a slow phone leaves the same trail.
      const from = this.foot, was = this.travelled;
      this.travelled += step;
      for (let at = (Math.floor(was / this.spacing) + 1) * this.spacing; at <= this.travelled && this.count < MAX_TRAIL; at += this.spacing) {
        const k = (at - was) / step, i = this.count++ * 3;
        this.trail[i] = from.x + (x - from.x) * k; this.trail[i + 1] = from.y + (y - from.y) * k; this.trail[i + 2] = this.lastMs + (ms - this.lastMs) * k;
      }
    }
    this.foot.x = x; this.foot.y = y; this.lastMs = ms;
  }

  private get leave(): number { return this.launch ?? this.lastMs; }

  private drawFire(ctx: CanvasRenderingContext2D, layer: CardLayer, ms: number): void {
    const size = this.kind === 'FireStarter' ? 1.3 : 1, seed = this.seed;
    ignite(ctx, this.a, ms, this.leave, layer, seed);
    for (let n = 0; n < this.count; n++) {
      const i = n * 3, x = this.trail[i], y = this.trail[i + 1], age = ms - this.trail[i + 2], turn = n & 1 ? 1 : -1;
      if (layer === 'under') {
        // The figure leaves burnt, cracked stone and one flame per point, to alternate sides of the path: a burning track.
        if (n % 2 === 0) scorchAt(ctx, x, y, .78 * size, ease(age / 110) * (1 - ease((age - 460) / 560)), seed + n);
        if (n % 4 === 1) smokeAt(ctx, x, y - 34, .76, age - 240, 780, seed + n);
        const side = (6 + rand(n, seed) * 18) * turn;
        flameAt(ctx, x - this.dirY * side, y + this.dirX * side * .5 + rand(n, seed + 7) * 6, (.56 + rand(n, seed + 2) ** 2 * .6) * size, age, 620 + rand(n, seed + 3) * 300, seed + n);
      } else if (n % 3 === 0) emberRise(ctx, { x, y }, age, 620, 2, 26, seed + n);
    }
    if (this.land != null) fireBurst(ctx, this.b, ms - this.land, layer, seed + 60, size);
  }

  private drawSpeed(ctx: CanvasRenderingContext2D, layer: CardLayer, ms: number): void {
    const flame = this.kind === 'Haste', seed = this.seed;
    if (layer === 'under') {
      for (let i = 0; i < 6; i++) dustAt(ctx, this.a.x - this.dirX * (8 + i * 10) + (i - 2.5) * 12, this.a.y - this.dirY * (8 + i * 8), .62, ms - this.leave + 170 - i * 22, 560, seed + i);
      if (flame) for (let i = 0; i < 3; i++) flameAt(ctx, this.a.x + (i - 1) * 34, this.a.y - 2 + Math.abs(i - 1) * 4, .5, ms - i * 30, Math.max(this.leave + 300, 520), seed + i);
      for (let n = 0; n < this.count; n++) {
        const i = n * 3, x = this.trail[i], y = this.trail[i + 1], age = ms - this.trail[i + 2];
        // Bands fill the figure's height and width, so the speed has volume and shows round the body.
        for (let j = 0; j < 2; j++) {
          const r = n * 2 + j, high = 10 + rand(r, seed) * 84, side = (rand(r, seed + 1) - .5) * 104, size = .52 + rand(r, seed + 2) ** 2 * .84;
          const bx = x - this.dirY * side, by = y + this.dirX * side * .4 - high, turn = this.angle + (rand(r, seed + 4) - .5) * .24, life = 280 + rand(r, seed + 3) * 240;
          if (flame) this.streak(ctx, bx, by, turn, .7 + size * .5, age - j * 30, life + 160, r);
          else windAt(ctx, bx, by, turn, size * .86, age - j * 30, life, 'gold');
        }
        if (flame && n % 2 === 0) flameAt(ctx, x + (n & 2 ? 14 : -14), y + 2, .42, age, 460, seed + n);
        if (n % 2 === 0) dustAt(ctx, x, y - 2, .62, age, 520, seed + n);
      }
    } else if (flame) for (let n = 0; n < this.count; n += 2) {
      const i = n * 3;
      emberRise(ctx, { x: this.trail[i], y: this.trail[i + 1] - 26 }, ms - this.trail[i + 2], 560, 3, 40, seed + n);
    }
    if (this.land != null) {
      const age = ms - this.land;
      if (layer === 'under') for (let i = 0; i < 7; i++) {
        const a = Math.PI * 2 * i / 7 + rand(i, seed), r = 16 + clamp(age / 240) * 50;
        dustAt(ctx, this.b.x + Math.cos(a) * r, this.b.y + Math.sin(a) * r * .4, .72, age - i * 10, 560, seed + 30 + i);
      } else if (flame) emberRise(ctx, this.b, age, 620, 10, 72, seed + 40);
    }
  }

  /** Haste's painted flame streak: the tail draws out behind the head, thins and goes. */
  private streak(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, size: number, age: number, life: number, seed: number): void {
    if (age <= 0 || age >= life) return;
    const k = age / life;
    paintStreak(ctx, x, y, angle, 150 * size * (.4 + ease(k * 3) * .8), 1.25 * size * (1 - k * .5), seed, ease(age / 50) * (1 - ease((k - .5) / .5)));
  }

  private drawMarch(ctx: CanvasRenderingContext2D, layer: CardLayer, ms: number): void {
    const seed = this.seed, back = this.angle + Math.PI;
    // Roots break the stone behind the pawn and lean into it; soil heaves under each footfall.
    if (layer === 'under') {
      const lean = this.dirX * .42;
      const mid = { x: (this.a.x + this.b.x) / 2, y: (this.a.y + this.b.y) / 2 };
      for (let i = 0; i < 3; i++) {
        const side = (i - 1) * 42;
        rootAt(ctx, this.a.x - this.dirX * 26 - this.dirY * side, this.a.y - this.dirY * 26 + this.dirX * side * .5, 1.02 - Math.abs(i - 1) * .14, lean + (i - 1) * .2, ms - i * 44, Math.max(820, this.leave + 640), seed + i);
      }
      for (let i = 0; i < 2; i++) {
        const side = i ? 44 : -44, born = this.bornNear(mid);
        if (born != null) rootAt(ctx, mid.x - this.dirY * side, mid.y + this.dirX * side * .5, .8, lean + (i ? .18 : -.18), ms - born - i * 40, 700, seed + 5 + i);
      }
      for (let n = 0; n < this.count; n++) {
        const i = n * 3, age = ms - this.trail[i + 2];
        dustAt(ctx, this.trail[i] + (rand(n, seed) - .5) * 40, this.trail[i + 1] + (rand(n, seed + 1) - .5) * 12, .72 + rand(n, seed + 2) * .34, age, 560, seed + n);
      }
      earthPush(ctx, this.a, ms - this.leave + 90, layer, back, seed + 10);
    } else {
      earthPush(ctx, this.a, ms - this.leave + 90, layer, back, seed + 10);
      for (let n = 0; n < this.count; n += 4) {
        const i = n * 3;
        clodThrow(ctx, { x: this.trail[i], y: this.trail[i + 1] }, ms - this.trail[i + 2], 520, 2, 58, seed + n, back);
      }
    }
    if (this.land != null) stomp(ctx, this.b, ms - this.land, layer, seed + 20, 1.08);
  }

  private bornNear(p: Point): number | null {
    for (let n = 0; n < this.count; n++) {
      const i = n * 3;
      if (Math.hypot(this.trail[i] - p.x, this.trail[i + 1] - p.y) <= this.spacing) return this.trail[i + 2];
    }
    return null;
  }

  /** Cloud round a figure that plays its own painted leap: the bank owns the jump and the lift. */
  private drawFlight(ctx: CanvasRenderingContext2D, layer: CardLayer, ms: number): void {
    const seed = this.seed;
    cloudRing(ctx, this.a, ms - Math.max(0, this.leave - 170), layer, seed, .82);
    for (let n = 0; n < this.count; n++) {
      const i = n * 3, x = this.trail[i], y = this.trail[i + 1], age = ms - this.trail[i + 2];
      if (layer === 'under') cloudAt(ctx, x + (rand(n, seed) - .5) * 34, y + 6, .56 + rand(n, seed + 1) * .3, age, 620, seed + n);
      else if (n % 2 === 0) windAt(ctx, x, y - 26 - rand(n, seed + 2) * 58, this.angle, .68, age, 380, 'cloud');
    }
    if (this.land != null) cloudRing(ctx, this.b, ms - this.land, layer, seed + 30, .86);
  }
}

/** King powers and cards that keep the real walk or painted leap: Strike, Fire Starter, Haste, Rally, March. */
export function powerOverlay(context: GameRules, before: Position, move: Move): MoveOverlay | null {
  if (marches(context, before, move)) return new WalkOverlay('March', move, 0);
  const action = walkAction(context, before, move);
  return action ? new WalkOverlay(action.id as Kind, move, action.index) : null;
}
