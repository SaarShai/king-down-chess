import type { PaintedScene } from '../../../docs/2d-first-pieces/board/scene.mjs';
import { A, typeOf } from '../../rules/engine';
import type { Highlights } from '../marks';
import { drawFreeze, drawIceWall, drawFirewall } from './materials';
import { drawGuard, drawShelter, drawSwap } from './state-flare';
import { drawArcherFocus } from './archer-flare';
import { link, pips, ring } from './indications';
import { drawCheck, drawWithdrawal } from './check';
import type { StateEffects } from './states';

/** Production decoration only. All positions and indications come from the real board. */
export function drawBoardEffects(ctx: CanvasRenderingContext2D, scene: PaintedScene, layer: 'under' | 'over', row: number | undefined,
  effects: StateEffects, marks: Highlights, width: number, now: number, motion: boolean, symbols: boolean, preview: number | null, selectedPiece: number, moving?: ReadonlySet<number>, board?: ArrayLike<number>): void {
  const front = layer === 'over', inRow = (sq: number) => !front || row == null || row === scene.cell(sq).row;
  const last = front && (row == null || row === 7), reduced = !motion;
  for (const state of effects.frames) {
    if (!inRow(state.sq) || moving?.has(state.sq) || (state.source != null && moving?.has(state.source))) continue;
    const foot = scene.foot(state.sq), material = state.kind === 'freeze' || state.kind === 'ward' || state.kind === 'firewall';
    const progress = material ? effects.materialProgress(state, now, motion) : effects.elapsed(state.since, now, motion);
    const draw = (front: boolean) => {
      ctx.save();
      if (material) {
        (state.kind === 'freeze' ? drawFreeze : state.kind === 'ward' ? drawIceWall : drawFirewall)(ctx, { ...foot, progress, front, seed: state.sq });
      } else {
        if (!front) ring(ctx, scene, state.sq, '#a57d2f');
        const frame = { progress, front, reduced };
        if (state.kind === 'guard') drawGuard(ctx, foot, frame);
        else if (state.source != null) drawShelter(ctx, scene.foot(state.source), foot, frame, state.kind === 'mercy');
      }
      ctx.restore();
    };
    // Symbols draw above both material faces, so no surface covers the piece's identity.
    if (!symbols || !front) { draw(front); if (symbols) draw(true); }
    if ((symbols ? !front : front) && state.clear == null) {
      ctx.save();
      // Symbol badges sit in the gap between rows; all piece icons draw above their edges.
      if (symbols) ctx.translate(0, -10);
      pips(ctx, scene, width, state.sq, material ? state.kind === 'firewall' ? '#a73c12' : '#316d89' : '#87611e', state.turns, state.kind !== 'freeze', state.exception);
      ctx.restore();
    }
  }
  const selected = marks.selected;
  const progress = (name: string) => effects.progress(name, now, motion);
  if (selected != null) {
    const source = scene.foot(selected);
    if (marks.shots?.length && typeOf(selectedPiece) === A) {
      if (!front) ring(ctx, scene, selected, '#bd8d2c');
      for (const sq of [selected, ...marks.shots]) if (inRow(sq)) drawArcherFocus(ctx, scene.foot(sq), source, progress('archer'), front, reduced, sq === selected);
    }
    for (const sq of marks.swaps ?? []) {
      // Each foot's ground wisps draw under figures; crossing light draws once after both rows.
      if (!front || row == null || row === Math.max(scene.cell(selected).row, scene.cell(sq).row)) drawSwap(ctx, source, scene.foot(sq), { progress: progress('swap'), front, reduced });
    }
  }
  const withdrawal = front ? undefined : effects.withdrawal(now, motion);
  if (withdrawal) drawWithdrawal(ctx, scene, withdrawal.king, withdrawal.progress);
  if (marks.check != null) drawCheck(ctx, scene, layer, row, { king: marks.check, checkers: marks.checkers ?? [], board, ms: effects.age('check', now, motion), pixel: 960 / Math.max(1, width) });
  if (!front) {
    const ghost = effects.progress('ghost', now, motion);
    const target = preview;
    if (target != null && marks.moves?.includes(target)) {
      const t = Math.max(0, Math.min(1, (ghost - .1) / .65));
      ring(ctx, scene, target, '#6d8145', motion ? 1 - t * t * (3 - 2 * t) : 1);
    }
  }
  if (!last) return;
  const enter = (name: string) => { const t = Math.min(1, progress(name) / .24); return t * t * (3 - 2 * t); };
  for (const shove of marks.shoveTo ?? []) link(ctx, scene, shove.from, shove.to, '#2f7f75', false, enter('shove'));
  if (marks.hint && marks.hint.length > 1) {
    for (const to of marks.hint.slice(1)) link(ctx, scene, marks.hint[0], to, '#a77b25', false, enter('hint'), true);
  }
}
