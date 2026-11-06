import { GameRules } from '../../game-rules';
import { K, P, colorOf, typeOf, type Move, type Position } from '../../rules/engine';
import type { PaintedScene } from '../../../docs/2d-first-pieces/board/scene.mjs';
import type { CardLayer } from './card-types';
import { DarkGrip } from './dark-gate';
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
function travelOf(scene: PaintedScene, move: { from: number; to: number }): { foot: Point; travel: number; start: Point; end: Point } {
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

// Dust: a soft tan puff, darker at the rim on a light square and paler than a dark one.
let dustSprite: HTMLCanvasElement | undefined;
const dust = () => dustSprite ??= ball(96, [[0, 'rgba(226,204,164,.96)'], [.42, 'rgba(204,176,132,.9)'], [.72, 'rgba(146,116,78,.55)'], [1, 'rgba(120,94,60,0)']]);
const DUST = [[-46, 0, 1], [46, 2, 1.05], [-24, 8, .85], [24, 8, .9], [-66, -3, .7], [66, -2, .75], [0, 10, .8]] as const;
const DUST_LIFE = 420;
function dustBeat(ctx: CanvasRenderingContext2D, at: Point, u: number, scale: number) {
  if (u <= 0 || u >= 1) return;
  const sprite = dust(), out = 1 - (1 - u) * (1 - u);
  for (const [dx, dy, size] of DUST) {
    const s = 58 * scale * size * (.5 + .75 * out);
    ctx.globalAlpha = ease(u / .12) * (1 - ease((u - .4) / .6));
    ctx.drawImage(sprite, at.x + dx * scale * (.35 + .65 * out) - s / 2, at.y + dy - s * .5 - 22 * u, s, s * .66);
  }
}
/** Castling: dust where the rook and the king land. The scene walks both figures. */
class CastleDust implements MoveOverlay {
  private rookAt = -1;
  private kingAt = -1;
  constructor(private move: Move & { castle: NonNullable<Move['castle']> }) {}
  draw(ctx: CanvasRenderingContext2D, scene: PaintedScene, layer: CardLayer, row: number | undefined, ms: number): void {
    if (layer === 'under') {
      if (this.rookAt < 0 && travelOf(scene, this.move.castle).travel >= .95) this.rookAt = ms;
      if (this.kingAt < 0 && travelOf(scene, this.move).travel >= .95) this.kingAt = ms;
      return;
    }
    if (row !== 7) return;
    ctx.save();
    if (this.rookAt >= 0) dustBeat(ctx, scene.foot(this.move.castle.to), (ms - this.rookAt) / DUST_LIFE, 1);
    if (this.kingAt >= 0) dustBeat(ctx, scene.foot(this.move.to), (ms - this.kingAt) / DUST_LIFE, .7);
    ctx.restore();
  }
}

// En passant: the victim is beside the target square, so the strike lands on the victim's own square at the contact beat.
let strikeSprite: HTMLCanvasElement | undefined;
/** A hot flash with broad, soft points: a white heart in gold, with an orange edge for both square colours. */
function strikeStar(): HTMLCanvasElement {
  if (strikeSprite) return strikeSprite;
  const canvas = ball(192, [[0, '#ffffff'], [.3, '#fff3c4'], [.52, 'rgba(255,190,70,.9)'], [.76, 'rgba(238,120,26,.42)'], [1, 'rgba(226,96,20,0)']]);
  const ctx = canvas.getContext('2d')!; ctx.translate(96, 96);
  const star = (outer: number, inner: number) => {
    ctx.beginPath();
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6 + .2, r = i % 2 ? inner : outer * (i % 4 ? .78 : 1); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    ctx.closePath(); ctx.fill();
  };
  ctx.fillStyle = 'rgba(244,128,28,.9)'; star(88, 30); ctx.fillStyle = '#ffd25e'; star(68, 26); ctx.fillStyle = '#fffbe8'; star(46, 20);
  return strikeSprite = canvas;
}
const SHARDS = [[-.7, 92, 13], [-.25, 112, 11], [.2, 104, 14], [.65, 88, 10], [-1.3, 70, 9], [1.25, 74, 9]] as const;
const STRIKE_MS = 300;
class EnPassantStrike implements MoveOverlay {
  private hitAt = -1;
  constructor(private move: Move) {}
  draw(ctx: CanvasRenderingContext2D, scene: PaintedScene, layer: CardLayer, row: number | undefined, ms: number): void {
    const victim = this.move.captures[0];
    if (layer === 'under') {
      // The contact beat is the frame the scene starts to take the victim away.
      const frame = scene.characterFrames?.find(f => f.square === victim);
      if (this.hitAt < 0 && frame && frame.opacity < 1) this.hitAt = ms;
      return;
    }
    if (row !== 7 || this.hitAt < 0) return;
    const at = scene.foot(victim), from = scene.foot(this.move.from), angle = Math.atan2(at.y - from.y, at.x - from.x), u = (ms - this.hitAt) / STRIKE_MS, center = { x: at.x, y: at.y - 58 };
    ctx.save();
    dustBeat(ctx, at, (ms - this.hitAt) / DUST_LIFE, .9);
    if (u > 0 && u < 1) {
      const size = 158 * (.45 + .55 * ease(u / .22)) * (1 - .3 * ease((u - .4) / .6));
      ctx.globalAlpha = ease(u / .08) * (1 - ease((u - .3) / .6));
      ctx.translate(center.x, center.y); ctx.rotate(angle + u * .5);
      ctx.drawImage(strikeStar(), -size / 2, -size / 2, size, size);
      ctx.rotate(-u * .5);
      const shard = strikeStar();
      for (const [turn, far, s] of SHARDS) {
        const out = far * (1 - (1 - u) * (1 - u));
        ctx.globalAlpha = 1 - ease((u - .55) / .45);
        ctx.drawImage(shard, Math.cos(turn) * out - s, Math.sin(turn) * out - s, s * 2, s * 2);
      }
    }
    ctx.restore();
  }
}

/** Special moves that keep their real walk or attack: castling, en passant, always-on powers. */
export function specialOverlay(context: GameRules, before: Position, move: Move): MoveOverlay | null {
  const value = before.board[move.from];
  if (!value || move.pass || move.power) return null;
  if (move.castle) return new CastleDust({ ...move, castle: move.castle });
  const power = context.rules.kings[colorOf(value)]?.power, type = typeOf(value);
  if (type === P && move.captures.length === 1 && move.captures[0] !== move.to) return new EnPassantStrike(move);
  if (power === 'Darkness' && (type === P || type === K) && needsPower(context, before, move)) return new DarkGrip(move);
  if (power === 'Mercy' && type === K && needsPower(context, before, move)) return new HolyLift(move);
  return null;
}
