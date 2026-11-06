import type { GameRules } from '../../game-rules';
import { TAG_POWER, colorOf, typeOf, K, L, N, P, type Move, type Position } from '../../rules/engine';
import { RELEASED_CARDS } from '../../content/cards';
import type { PaintedScene, SceneEffect } from '../../../docs/2d-first-pieces/board/scene.mjs';
import { HEROES, drawFreezeCast, drawHero, quakeJolt } from './card-hero';
import { AIR_IDS, AIR_LANDS, AIR_SETTLED, MOVEMENT_IDS, MOVEMENT_DURATIONS, airPose, drawMovement } from './card-movement';
import { SPELL_DURATIONS, drawRising, drawSpell } from './card-spell';
import { drawFreeze, drawIceWall, drawFirewall } from './materials';
import type { CardFrame, CardLayer } from './card-types';

const released = new Set(RELEASED_CARDS.map(card => card.id));
/**
 * The local release (motion concepts, ticket 86): Freeze and Firewall prepare at their card for CAST_PREPARE_MS, then the
 * approved material grows on the board where it acts. No light crosses the board, so the cast never reads as an attack.
 */
export const CAST_PREPARE_MS = 125;
const LOCAL = new Set(['Freeze', 'Firewall']);
const durations: Record<string, number> = { Burn: 1500, Freeze: 1600, EarthQuake: 1650, ...MOVEMENT_DURATIONS, ...SPELL_DURATIONS };
const clamp = (t: number) => Math.max(0, Math.min(1, t));
const ease = (t: number) => { t = clamp(t); return t * t * (3 - 2 * t); };

/** Tags describe the copied action. Only via describes the card Mirror spends. */
function actionOf(before: Position, move: Move): { id: string; mirror: boolean; index: number } | null {
  if (move.pass) return null;
  if (move.power) {
    const id = TAG_POWER[move.power];
    return released.has(id) ? { id, mirror: !!move.via, index: 0 } : null;
  }
  if (before.haste !== undefined) {
    if (before.rage === 3) return { id: 'Rally', mirror: false, index: 1 };
    if (before.rage === undefined) return { id: 'Haste', mirror: false, index: 1 };
  }
  if (before.free && before.marks?.[before.turn]?.all) return { id: 'Firewall', mirror: false, index: 1 };
  return null;
}

/** These keep the figure's real walk or attack; the material is an overlay (power-overlays.ts), so the figure never slides. */
const WALKS = new Set(['Strike', 'FireStarter', 'Haste', 'Rally', 'March']);
const keepsRealMotion = (before: Position, move: Move, action: { id: string; mirror: boolean }) => !action.mirror
  && (WALKS.has(action.id) || (action.id === 'Flight' && [N, L].includes(typeOf(before.board[move.from]))));

export function cardAction(_context: GameRules, before: Position, move: Move): ReturnType<typeof actionOf> {
  const action = actionOf(before, move);
  return action && !keepsRealMotion(before, move, action) ? action : null;
}

export function walkAction(_context: GameRules, before: Position, move: Move): ReturnType<typeof actionOf> {
  const action = actionOf(before, move);
  return action && keepsRealMotion(before, move, action) ? action : null;
}

interface Unit { from: number; to: number; value: number }
function movingUnits(before: Position, move: Move): Unit[] {
  const steps = move.pushes ? [...move.pushes]
    : move.swap ? [{ from: move.from, to: move.to }, { from: move.to, to: move.from }]
    : move.from !== move.to ? [{ from: move.from, to: move.to }] : [];
  if (move.shove) steps.push(move.shove);
  if (move.castle) steps.push(move.castle);
  return steps.map(step => ({ ...step, value: before.board[step.from] }));
}

export function cardLender(context: GameRules, before: Position, move: Move): number | undefined {
  if (move.power !== 'control' && move.power !== 'mimic') return;
  const own = before.board[move.from];
  for (let sq = 0; sq < 64; sq++) {
    const value = before.board[sq];
    if (!value || colorOf(value) !== before.turn || [K, P, typeOf(own)].includes(typeOf(value))) continue;
    if (move.power === 'control' && Math.max(Math.abs((sq & 7) - (move.from & 7)), Math.abs((sq >> 3) - (move.from >> 3))) !== 1) continue;
    const board = new Uint8Array(before.board), borrowed: Move[] = [];
    board[move.from] = value;
    context.genPiece(board, move.from, 'all', borrowed);
    if (borrowed.some(m => m.to === move.to && m.captures.length === move.captures.length && m.captures.every((s, i) => s === move.captures[i]))) return sq;
  }
}

/** Height above the foot that an air move turns about: the middle of a figure's body. */
const BODY_PIVOT = 52;
/** A context that skips the figure's contact shadow: an airborne figure's shadow lies on the ground, in the under layer. */
const withoutShadow = (ctx: CanvasRenderingContext2D) => new Proxy(ctx, {
  get(target, key: keyof CanvasRenderingContext2D) {
    const value = target[key];
    if (key === 'drawImage' || key === 'fill') return (...args: unknown[]) => {
      if (target.globalCompositeOperation !== 'multiply') (value as (...a: unknown[]) => void).apply(target, args);
    };
    return typeof value === 'function' ? value.bind(target) : value;
  },
  set(target, key, value) { Reflect.set(target, key, value); return true; },
});

/** One engine action. No timers, fixture data, or rule state lives in this drawing. */
export class CardPlayback implements SceneEffect {
  readonly duration: number;
  readonly after: Position;
  /** Freeze or Firewall cast with the local release: no hero, trail or spell drawing; the material grows in place. */
  readonly local: boolean;
  shown: Position;
  private frame: CardFrame;
  private units: Unit[];
  private travelBoard: Uint8Array;
  private replaceBoard: Uint8Array;
  /** An air move draws its figure from the crouch to the settled landing, so the scene must not draw it. */
  private air: boolean;
  private landBoard: Uint8Array;
  private noShadow?: CanvasRenderingContext2D;

  constructor(readonly before: Position, readonly move: Move, readonly action: NonNullable<ReturnType<typeof cardAction>>, context: GameRules) {
    this.after = context.makeMove(before, move);
    this.shown = before;
    this.frame = { before, after: this.after, move, index: action.index, t: 0, travel: 0, lender: cardLender(context, before, move) };
    // The approved multi-action studies divide their duration equally over their two actions.
    this.duration = action.mirror ? SPELL_DURATIONS.MirrorB / 2
      : durations[action.id] / (['Haste', 'Rally', 'Firewall'].includes(action.id) ? 2 : 1);
    this.local = !action.mirror && action.index === 0 && LOCAL.has(action.id);
    this.units = movingUnits(before, move);
    this.travelBoard = new Uint8Array(before.board);
    for (const unit of this.units) this.travelBoard[unit.from] = 0;
    this.replaceBoard = new Uint8Array(this.travelBoard);
    if (move.promo || move.drop) this.replaceBoard[move.from] = 0;
    this.air = AIR_IDS.has(action.id) && !action.mirror;
    this.landBoard = new Uint8Array(this.after.board);
    for (const unit of this.units) this.landBoard[unit.to] = 0;
  }

  position(t: number): Position {
    // The local release shows the result board from the release; the new mark's own state starts at the end.
    if (this.local && t < 1) t = t * this.duration < CAST_PREPARE_MS ? 0 : .62 + .38 * clamp((t * this.duration - CAST_PREPARE_MS) / (this.duration - CAST_PREPARE_MS));
    this.frame.t = t;
    this.frame.travel = ease((t - .22) / .4);
    const board = this.air
      ? (t >= AIR_SETTLED ? this.after.board : t >= AIR_LANDS ? this.landBoard : t > 0 ? this.travelBoard : this.before.board)
      : t >= .62 ? this.after.board : t > .35 ? this.replaceBoard : t > .22 ? this.travelBoard : this.before.board;
    // The card draws its new material through the onset. Other states follow the displayed figures.
    const newMark = ['freeze', 'ward', 'firewall'].includes(this.move.power ?? '');
    const base = t >= .62 ? this.after : this.before;
    this.shown = { ...base, board };
    if (newMark && t >= .62 && t < 1) {
      this.shown.marks = this.before.turn === 0 ? [undefined, base.marks?.[1]] : [base.marks?.[0], undefined];
    }
    return this.shown;
  }

  draw(ctx: CanvasRenderingContext2D, scene: PaintedScene, layer: CardLayer, row: number | undefined, t: number): void {
    if (t >= 1) return;
    if (this.local) { this.drawRelease(ctx, scene, layer, row, t * this.duration); if (this.move.power === 'freeze') drawFreezeCast(ctx, scene, this.move.to, layer, row, t * this.duration); return; }
    const { id, mirror } = this.action, event = this.frame;
    if (this.air && layer === 'over') this.drawAirborne(ctx, scene, row);
    if (layer === 'under' || row === 7) {
      if (HEROES.has(id)) drawHero(ctx, scene, id, event, layer);
      else if (MOVEMENT_IDS.has(id)) drawMovement(ctx, scene, id, event, layer);
      else drawSpell(ctx, scene, id, event, layer);
      if (mirror) drawSpell(ctx, scene, 'MirrorB', event, layer);
    }
    if (layer === 'over' && row === 7 && !this.air) this.drawActors(ctx, scene);
    this.drawMaterial(ctx, scene, layer, row);
  }

  /** The approved material grows from the release to its held strength (.42) in 450 ms (Freeze) or 480 ms (Firewall). */
  releaseProgress(ms: number): number {
    return .42 * ease((ms - CAST_PREPARE_MS) / (this.move.power === 'freeze' ? 450 : 480));
  }

  private drawRelease(ctx: CanvasRenderingContext2D, scene: PaintedScene, layer: CardLayer, row: number | undefined, ms: number): void {
    const progress = this.releaseProgress(ms), mark = this.after.marks?.[this.before.turn], front = layer === 'over';
    if (progress <= 0 || !mark) return;
    const draw = this.move.power === 'freeze' ? drawFreeze : drawFirewall;
    for (let sq = 0; sq < 64; sq++) {
      if (!this.after.board[sq] || (mark.all ? colorOf(this.after.board[sq]) !== this.before.turn : mark.sq !== sq)) continue;
      if (front && scene.cell(sq).row !== row) continue;
      draw(ctx, { ...scene.foot(sq), progress, front, seed: sq });
    }
  }

  private drawMaterial(ctx: CanvasRenderingContext2D, scene: PaintedScene, layer: CardLayer, row: number | undefined): void {
    const { t } = this.frame, tag = this.move.power;
    if (t > .22 && t < .62 && (layer === 'under' || row === 7)) {
      for (const [by, mark] of (this.before.marks ?? []).entries()) {
        if (!mark?.all || mark.left === 0) continue;
        for (const unit of this.units) {
          if (colorOf(unit.value) !== by) continue;
          const a = scene.foot(unit.from), b = scene.foot(unit.to), u = this.frame.travel;
          drawFirewall(ctx, { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, progress: .42, front: layer === 'over', seed: unit.from });
        }
      }
    }
    if (tag !== 'freeze' && tag !== 'ward' && tag !== 'firewall') return;
    const frost = tag === 'freeze', mark = this.after.marks?.[this.before.turn];
    if (!mark) return;
    const progress = .42 * ease(frost ? (t - .57) / .27 : (t - .14) / .48);
    const front = layer === 'over', draw = frost ? drawFreeze : tag === 'ward' ? drawIceWall : drawFirewall;
    for (let sq = 0; sq < 64; sq++) {
      if (!this.after.board[sq] || (mark.all ? colorOf(this.after.board[sq]) !== this.before.turn : mark.sq !== sq)) continue;
      if (front && scene.cell(sq).row !== row) continue;
      draw(ctx, { ...scene.foot(sq), progress, front, seed: sq });
    }
  }

  /** The real scene owns the figure at both ends; here the crouch and landing stand in their own rows, the arc over all. */
  private drawAirborne(ctx: CanvasRenderingContext2D, scene: PaintedScene, row: number | undefined): void {
    const { t } = this.frame, { id } = this.action;
    if (t <= 0 || t >= AIR_SETTLED) return;
    const out = this.noShadow ??= withoutShadow(ctx);
    for (const [index, unit] of this.units.entries()) {
      const a = scene.foot(unit.from), b = scene.foot(unit.to);
      if (row !== (t < .2 ? scene.cell(unit.from).row : t > AIR_LANDS + .02 ? scene.cell(unit.to).row : 7)) continue;
      const pose = airPose(id, a, b, t, id === 'SkyLift' ? (index ? -24 : 24) : 0);
      ctx.save();
      ctx.translate(pose.x, pose.y - BODY_PIVOT); ctx.rotate(pose.tilt); ctx.translate(0, BODY_PIVOT);
      ctx.scale(pose.sx, pose.sy); ctx.translate(-a.x, -a.y);
      scene.ghost(out, unit.value, unit.from, 1);
      ctx.restore();
    }
  }

  private drawActors(ctx: CanvasRenderingContext2D, scene: PaintedScene): void {
    const { t, travel: u } = this.frame, { id } = this.action;
    if (t <= .22 || t >= .62) return;
    if (id === 'Salvation') drawRising(ctx, scene, this.after.board[this.move.to], this.move.to, u);
    for (const unit of this.units) {
      const a = scene.foot(unit.from), b = scene.foot(unit.to);
      const airborne = AIR_IDS.has(id), lift = airborne ? Math.sin(u * Math.PI) * 100 : 0;
      const dx = (b.x - a.x) * u;
      let dy = (b.y - a.y) * u - lift;
      if (id === 'EarthQuake') dy -= quakeJolt(t);
      if (id === 'Haste' || id === 'Strike') for (let j = 3; j >= 1; j--) {
        const trail = Math.max(0, u - j * .055);
        ctx.save(); ctx.translate((b.x - a.x) * trail, (b.y - a.y) * trail); scene.ghost(ctx, unit.value, unit.from, .08); ctx.restore();
      }
      ctx.save(); ctx.translate(dx, dy);
      scene.ghost(airborne ? (this.noShadow ??= withoutShadow(ctx)) : ctx, unit.value, unit.from, 1);
      ctx.restore();
    }
  }
}

export function cardPlayback(context: GameRules, before: Position, move: Move): CardPlayback | null {
  const action = cardAction(context, before, move);
  return action ? new CardPlayback(before, move, action, context) : null;
}
