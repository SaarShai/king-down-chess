import { GameRules } from '../../game-rules';
import { K, P, colorOf, typeOf, type Move, type Position } from '../../rules/engine';
import type { PaintedScene } from '../../../docs/2d-first-pieces/board/scene.mjs';
import type { CardLayer } from './card-types';
import type { MoveOverlay } from './move-overlay';

const clamp = (t: number) => Math.max(0, Math.min(1, t));
const ease = (t: number) => { t = clamp(t); return t * t * (3 - 2 * t); };
type Point = { x: number; y: number };

const plainGames = new WeakMap<GameRules, GameRules>();
/** The same game with powerless kings: the engine's own answer to what any king or pawn can do. */
function plainGame(context: GameRules): GameRules {
  let plain = plainGames.get(context);
  if (!plain) plainGames.set(context, plain = new GameRules({ ...context.rules, kings: [null, null] }));
  return plain;
}
/** Does this move exist only because of the mover's king power? */
export function needsPower(context: GameRules, before: Position, move: Move): boolean {
  const moves: Move[] = [];
  plainGame(context).genPiece(before.board as Uint8Array, move.from, 'all', moves);
  return !moves.some(m => m.to === move.to && m.captures.length === move.captures.length && m.captures.every((sq, i) => sq === move.captures[i]));
}

// Sprites: made once, the first time an overlay draws.
const ball = (size: number, stops: readonly (readonly [number, string])[], squash = 1) => {
  const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = Math.round(size * squash);
  const ctx = canvas.getContext('2d')!; ctx.scale(1, squash);
  const fill = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [at, colour] of stops) fill.addColorStop(at, colour);
  ctx.fillStyle = fill; ctx.fillRect(0, 0, size, size);
  return canvas;
};
let smokeSprite: HTMLCanvasElement | undefined;
/** A puff with volume: a near-black body, a violet edge and a pale crown, so it reads on both square colours. */
function puff(): HTMLCanvasElement {
  if (smokeSprite) return smokeSprite;
  const canvas = ball(96, [[0, 'rgba(14,10,24,.94)'], [.36, 'rgba(24,16,40,.86)'], [.66, 'rgba(50,34,80,.52)'], [1, 'rgba(70,48,108,0)']]);
  const ctx = canvas.getContext('2d')!; ctx.globalCompositeOperation = 'source-atop';
  const crown = ctx.createRadialGradient(36, 30, 0, 36, 30, 34);
  crown.addColorStop(0, 'rgba(150,126,190,.62)'); crown.addColorStop(1, 'rgba(150,126,190,0)');
  ctx.fillStyle = crown; ctx.fillRect(0, 0, 96, 96);
  return smokeSprite = canvas;
}
let holySprites: { lift: HTMLCanvasElement; floor: HTMLCanvasElement; mote: HTMLCanvasElement } | undefined;
function holy() {
  if (holySprites) return holySprites;
  // A column of warm light with an amber edge, which fades upward.
  const lift = document.createElement('canvas'); lift.width = 96; lift.height = 192;
  const g = lift.getContext('2d')!, across = g.createLinearGradient(0, 0, 96, 0);
  for (const [at, colour] of [[0, 'rgba(226,150,30,0)'], [.14, 'rgba(236,166,44,.7)'], [.3, 'rgba(255,224,140,.95)'], [.5, 'rgba(255,252,236,1)'], [.7, 'rgba(255,224,140,.95)'], [.86, 'rgba(236,166,44,.7)'], [1, 'rgba(226,150,30,0)']] as const) across.addColorStop(at, colour);
  g.fillStyle = across; g.fillRect(0, 0, 96, 192);
  g.globalCompositeOperation = 'destination-in';
  const up = g.createLinearGradient(0, 0, 0, 192);
  up.addColorStop(0, 'rgba(0,0,0,0)'); up.addColorStop(.55, 'rgba(0,0,0,.75)'); up.addColorStop(.92, '#000'); up.addColorStop(1, 'rgba(0,0,0,.2)');
  g.fillStyle = up; g.fillRect(0, 0, 96, 192);
  return holySprites = {
    lift,
    floor: ball(192, [[0, 'rgba(255,250,224,1)'], [.42, 'rgba(255,214,110,.92)'], [.74, 'rgba(232,154,36,.55)'], [1, 'rgba(214,132,18,0)']], .5),
    mote: ball(32, [[0, '#ffffff'], [.35, '#ffeeb4'], [.7, 'rgba(240,170,44,.85)'], [1, 'rgba(214,132,18,0)']]),
  };
}

/** Where the actor's feet are now, and how far along the move (0..1). */
function travelOf(scene: PaintedScene, move: Move): { foot: Point; travel: number; start: Point; end: Point } {
  const start = scene.foot(move.from), end = scene.foot(move.to);
  const foot = scene.characterFrames?.find(frame => frame.square === move.from)?.foot ?? start;
  const whole = Math.hypot(end.x - start.x, end.y - start.y) || 1;
  return { foot, start, end, travel: clamp(((foot.x - start.x) * (end.x - start.x) + (foot.y - start.y) * (end.y - start.y)) / (whole * whole)) };
}
/** Fades drawing out in the last moments of the scene's action, so nothing is cut when the overlay ends. */
const endFade = (scene: PaintedScene, ms: number) => {
  const total = scene.actionTotal;
  return total == null ? 1 : ease((total - ms) / 130);
};

// Darkness: shadow smoke at the feet, only on a move that needs the power.
const SMOKE_LIFE = 620, SMOKE_COUNT = 26;
const BURST = [[-34, 2], [32, 4], [-14, 12], [16, -8], [-46, -6], [46, -4]] as const;
class ShadowSmoke implements MoveOverlay {
  private x = new Float32Array(SMOKE_COUNT);
  private y = new Float32Array(SMOKE_COUNT);
  private born = new Float32Array(SMOKE_COUNT).fill(-1);
  private next = 0;
  private trail = 0;
  private opened = false;
  private landed = false;
  constructor(private move: Move) {}
  private emit(x: number, y: number, ms: number) {
    const i = this.next; this.next = (this.next + 1) % SMOKE_COUNT;
    this.x[i] = x; this.y[i] = y; this.born[i] = ms;
  }
  private burst(at: Point, ms: number) {
    BURST.forEach(([dx, dy], i) => this.emit(at.x + dx, at.y + dy, ms + i * 22));
  }
  private update(scene: PaintedScene, ms: number) {
    const { foot, travel, start, end } = travelOf(scene, this.move);
    if (!this.opened) { this.opened = true; this.burst(start, ms); }
    // A puff each time the feet cross a fifth of a square.
    const crossed = Math.hypot(foot.x - start.x, foot.y - start.y);
    while (travel > 0 && crossed - this.trail > 24) {
      this.trail += 24;
      const u = this.trail / crossed;
      // Puffs fall to either side of the path, so the trail is a mass and not a row.
      const side = (this.next * 37 % 29) - 14;
      this.emit(start.x + (foot.x - start.x) * u + side, start.y + (foot.y - start.y) * u + side * .3, ms);
    }
    // Timed to bloom as he arrives, so a move with no turn afterwards still shows it.
    if (!this.landed && travel >= .8) { this.landed = true; this.burst(end, ms); }
  }
  draw(ctx: CanvasRenderingContext2D, scene: PaintedScene, layer: CardLayer, row: number | undefined, ms: number): void {
    if (layer === 'under') this.update(scene, ms);
    else if (row !== 7) return;
    const sprite = puff(), fade = endFade(scene, ms);
    ctx.save();
    for (let i = 0; i < SMOKE_COUNT; i++) {
      // Even puffs lie behind the figures; odd puffs wrap the front of the feet.
      if ((i % 2 === 0) !== (layer === 'under')) continue;
      const u = (ms - this.born[i]) / SMOKE_LIFE;
      if (this.born[i] < 0 || u <= 0 || u >= 1) continue;
      const size = (58 + (i % 3) * 16) * (.5 + .9 * ease(u / .6));
      ctx.globalAlpha = ease(u / .14) * (1 - ease((u - .45) / .55)) * fade;
      ctx.drawImage(sprite, this.x[i] - size / 2 + (i % 2 ? 8 : -8) * u, this.y[i] - size * .5 - 30 * u, size, size * .7);
    }
    ctx.restore();
  }
}

// Mercy: a lift of holy light where the king leaves and where he lands.
const LIFT_MS = 560;
const LIFT_MOTES = [[-34, 12, 0], [30, 10, .06], [-16, 9, .14], [20, 11, .2], [-44, 8, .26], [44, 8, .3]] as const;
class HolyLift implements MoveOverlay {
  private openAt = -1;
  private landAt = -1;
  constructor(private move: Move) {}
  private lift(ctx: CanvasRenderingContext2D, at: Point, u: number, fade: number, layer: CardLayer) {
    if (u <= 0 || u >= 1) return;
    const { lift, floor, mote } = holy(), alpha = ease(u / .2) * (1 - ease((u - .5) / .5)) * fade;
    if (layer === 'under') {
      const size = 150 + 70 * ease(u / .7);
      ctx.globalAlpha = alpha; ctx.drawImage(floor, at.x - size / 2, at.y + 4 - size / 4, size, size / 2);
      return;
    }
    const height = 170 * ease(u / .45), width = 104 * (1 - .55 * ease((u - .35) / .65));
    ctx.globalAlpha = alpha * .86; ctx.drawImage(lift, at.x - width / 2, at.y + 10 - height, width, height);
    for (const [x, size, delay] of LIFT_MOTES) {
      const v = clamp((u - delay) / (1 - delay));
      if (v <= 0 || v >= 1) continue;
      const s = size * ease(v / .15) * (1 - .3 * v);
      ctx.globalAlpha = (1 - ease((v - .6) / .4)) * fade;
      ctx.drawImage(mote, at.x + x - s, at.y - 10 - 130 * (1 - (1 - v) * (1 - v)) - s, s * 2, s * 2);
    }
  }
  draw(ctx: CanvasRenderingContext2D, scene: PaintedScene, layer: CardLayer, row: number | undefined, ms: number): void {
    if (layer === 'over' && row !== 7) return;
    const { travel, start, end } = travelOf(scene, this.move), fade = endFade(scene, ms);
    if (this.openAt < 0 && travel > .01) this.openAt = ms - 120;
    if (this.landAt < 0 && travel >= .78) this.landAt = ms;
    ctx.save();
    if (this.openAt >= 0) this.lift(ctx, start, (ms - this.openAt) / LIFT_MS, fade, layer);
    if (this.landAt >= 0) this.lift(ctx, end, (ms - this.landAt) / LIFT_MS, fade, layer);
    ctx.restore();
  }
}

/** Special moves that keep their real walk or attack: castling, en passant, always-on powers. */
export function specialOverlay(context: GameRules, before: Position, move: Move): MoveOverlay | null {
  const value = before.board[move.from];
  if (!value || move.pass || move.power || move.castle) return null;
  const power = context.rules.kings[colorOf(value)]?.power, type = typeOf(value);
  if (power === 'Darkness' && (type === P || type === K) && needsPower(context, before, move)) return new ShadowSmoke(move);
  if (power === 'Mercy' && type === K && needsPower(context, before, move)) return new HolyLift(move);
  return null;
}
