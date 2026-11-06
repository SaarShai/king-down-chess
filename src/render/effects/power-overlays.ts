import type { GameRules } from '../../game-rules';
import { P, colorOf, typeOf, type Move, type Position } from '../../rules/engine';
import type { PaintedScene } from '../../../docs/2d-first-pieces/board/scene.mjs';
import { walkAction } from './card';
import type { CardLayer, Point } from './card-types';
import type { MoveOverlay } from './move-overlay';
import { MarchCracks } from './march-cracks';
import { clamp, cloudAt, cloudRing, dustAt, ease, emberRise, fireBurst, fireGlow, flameAt, ignite, rand, scorchAt, smokeAt, windAt, type WindTint } from './travel-material';

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
    else if (this.kind === 'March') this.drawMarch(ctx, scene, layer, ms);
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
      const i = n * 3, x = this.trail[i], y = this.trail[i + 1], age = ms - this.trail[i + 2];
      if (layer === 'under') {
        scorchAt(ctx, x, y, .62, ease(age / 130) * (1 - ease((age - 300) / 620)) * .34);
        if (n % 3 === 0) smokeAt(ctx, x, y - 30, .72, age - 180, 780, seed + n);
        // Two tongues per point, to both sides of the path: a long burning track, not one stacked column.
        const side = 6 + rand(n, seed) * 22, far = 6 + rand(n, seed + 6) * 26;
        if (n % 2 === 0) fireGlow(ctx, x, y - 6, 64, ease(age / 90) * (1 - ease((age - 240) / 460)) * .75);
        flameAt(ctx, x - this.dirY * side, y + this.dirX * side * .5 + rand(n, seed + 7) * 7, .5 + rand(n, seed + 2) ** 2 * .75, age, 620 + rand(n, seed + 3) * 300, seed + n);
        flameAt(ctx, x + this.dirY * far, y - this.dirX * far * .5 - rand(n, seed + 8) * 7, .46 + rand(n, seed + 4) ** 2 * .7, age - 40, 560 + rand(n, seed + 5) * 340, seed + n + 31);
      } else if (n % 2 === 0) emberRise(ctx, { x, y }, age, 620, 2, 26, seed + n);
    }
    // The charged foot: a heat pool that travels under the figure until the landing takes over.
    if (layer === 'under' && this.launch != null && this.land == null) fireGlow(ctx, this.foot.x, this.foot.y - 6, 68, ease((ms - this.launch) / 120) * .62);
    if (this.land != null) fireBurst(ctx, this.b, ms - this.land, layer, seed + 60, size);
  }

  private drawSpeed(ctx: CanvasRenderingContext2D, layer: CardLayer, ms: number): void {
    const flame = this.kind === 'Haste', tint: WindTint = flame ? 'flame' : 'gold', seed = this.seed;
    const gust = ease(ms / 150) * (1 - ease((ms - this.leave - 120) / 260));
    if (layer === 'under') {
      if (flame) fireGlow(ctx, this.a.x, this.a.y - 4, 74, gust * .75);
      for (let i = 0; i < 6; i++) dustAt(ctx, this.a.x - this.dirX * (8 + i * 10) + (i - 2.5) * 12, this.a.y - this.dirY * (8 + i * 8), .62, ms - this.leave + 170 - i * 22, 560, seed + i);
      for (let n = 0; n < this.count; n++) {
        const i = n * 3, x = this.trail[i], y = this.trail[i + 1], age = ms - this.trail[i + 2];
        // Bands fill the figure's height and width, so the speed has volume and shows round the body.
        for (let j = 0; j < 2; j++) {
          const r = n * 2 + j, high = 10 + rand(r, seed) * 84, side = (rand(r, seed + 1) - .5) * 104, size = .52 + rand(r, seed + 2) ** 2 * .84;
          windAt(ctx, x - this.dirY * side, y + this.dirX * side * .4 - high, this.angle + (rand(r, seed + 4) - .5) * .24, size * .86, age - j * 30, 280 + rand(r, seed + 3) * 240, tint);
        }
        if (n % 2 === 0) dustAt(ctx, x, y - 2, .62, age, 520, seed + n);
      }
    } else {
      if (flame) for (let n = 0; n < this.count; n++) {
        const i = n * 3;
        emberRise(ctx, { x: this.trail[i], y: this.trail[i + 1] - 26 }, ms - this.trail[i + 2], 560, 4, 40, seed + n);
      }
    }
    if (this.land != null) {
      const age = ms - this.land;
      if (layer === 'under') for (let i = 0; i < 7; i++) {
        const a = Math.PI * 2 * i / 7 + rand(i, seed), r = 16 + clamp(age / 240) * 50;
        dustAt(ctx, this.b.x + Math.cos(a) * r, this.b.y + Math.sin(a) * r * .4, .72, age - i * 10, 560, seed + 30 + i);
      } else if (flame) emberRise(ctx, this.b, age, 620, 15, 72, seed + 40);
    }
  }

  private cracks: MarchCracks | null = null;

  private drawMarch(ctx: CanvasRenderingContext2D, scene: PaintedScene, layer: CardLayer, ms: number): void {
    if (layer !== 'under') return;
    this.cracks ??= new MarchCracks(this.a, this.b, this.move.from, this.seed);
    this.cracks.follow(scene, this.foot, this.land != null, ms);
    this.cracks.draw(ctx, ms);
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
