import { afterEach, expect, it, vi } from 'vitest';
import type { PaintedScene } from '../../../docs/2d-first-pieces/board/scene.mjs';
import { A } from '../../rules/engine';
import { drawBoardEffects } from './board-effects';
import { StateEffects } from './states';
import { drawFreeze } from './materials';
import { drawArcherFocus } from './archer-flare';
import { drawSwap } from './state-flare';
import { link, pips } from './indications';
import { drawCheck, drawWithdrawal } from './check';
import { fixtures } from '../../../docs/specs/effects-animation/preview/signals/fixtures';
vi.mock('./materials', () => ({ drawFreeze: vi.fn(), drawIceWall: vi.fn(), drawFirewall: vi.fn() }));
vi.mock('./archer-flare', () => ({ drawArcherFocus: vi.fn() }));
vi.mock('./state-flare', () => ({ drawGuard: vi.fn(), drawShelter: vi.fn(), drawSwap: vi.fn() }));
vi.mock('./indications', () => ({ SIGNAL_DURATION_MS: 4800, ring: vi.fn(), link: vi.fn(), pips: vi.fn(), checkImpact: vi.fn() }));
vi.mock('./check', () => ({ CHECK_WITHDRAW_MS: 220, drawCheck: vi.fn(), drawWithdrawal: vi.fn() }));
afterEach(() => vi.clearAllMocks());
const ctx = { save() {}, restore() {}, translate() {}, scale() {} } as unknown as CanvasRenderingContext2D;
const sceneAt = (flipped: boolean) => ({ cell: (sq: number) => ({ col: flipped ? 7 - sq % 8 : sq % 8, row: flipped ? sq >> 3 : 7 - (sq >> 3) }), foot: (sq: number) => ({ x: sq * 10, y: sq * 20 }) }) as unknown as PaintedScene;

it.each([false, true])('puts material backs under figures and fronts/pips only after their screen row (%s)', flipped => {
  const f = fixtures.freeze, effects = new StateEffects(), scene = sceneAt(flipped);
  effects.sync(f.rules, f.after, 0, true);
  const draw = (layer: 'under' | 'over', row?: number) => drawBoardEffects(ctx, scene, layer, row, effects, {}, 390, 100, true, false, null, 0);
  draw('under');
  expect(drawFreeze).toHaveBeenCalledExactlyOnceWith(ctx, expect.objectContaining({ front: false, progress: .42 }));
  expect(pips).not.toHaveBeenCalled();
  vi.mocked(drawFreeze).mockClear();
  for (let row = 0; row < 8; row++) {
    draw('over', row);
    expect(drawFreeze).toHaveBeenCalledTimes(row < scene.cell(35).row ? 0 : 1);
  }
  expect(drawFreeze).toHaveBeenLastCalledWith(ctx, expect.objectContaining({ front: true }));
  expect(pips).toHaveBeenCalledExactlyOnceWith(ctx, scene, 390, 35, '#316d89', 1, false, undefined);
});

it('uses the selected Archer type for focus in symbols mode and never animates generic targets', () => {
  const effects = new StateEffects(), scene = sceneAt(false);
  effects.signal('archer', '18:34', 0, true);
  const draw = (piece: number) => drawBoardEffects(ctx, scene, 'under', undefined, effects, { selected: 18, shots: [34], captures: [34] }, 430, 960, true, true, null, piece);
  draw(A);
  expect(drawArcherFocus).toHaveBeenCalledTimes(2);
  vi.mocked(drawArcherFocus).mockClear();
  draw(1); expect(drawArcherFocus).not.toHaveBeenCalled();
});

it('draws Swap front once after both rows and settles its onset', () => {
  const effects = new StateEffects(), scene = sceneAt(false);
  effects.signal('swap', '0:60', 0, true);
  for (let row = 0; row < 8; row++) drawBoardEffects(ctx, scene, 'over', row, effects, { selected: 0, swaps: [60] }, 390, 5000, true, false, null, 0);
  expect(drawSwap).toHaveBeenCalledExactlyOnceWith(ctx, scene.foot(0), scene.foot(60), { progress: 1, front: true, reduced: false });
});

it('keeps Shove, Hint and Check traces above the last row without changing destinations', () => {
  const effects = new StateEffects(), scene = sceneAt(false);
  const marks = { shoveTo: [{ from: 34, to: 42 }], hint: [27, 35, 43], check: 4, checkers: [{ sq: 60, king: 4, path: 'arc' as const }] };
  for (let row = 0; row < 7; row++) drawBoardEffects(ctx, scene, 'over', row, effects, marks, 390, 5000, false, false, null, 0);
  expect(link).not.toHaveBeenCalled();
  drawBoardEffects(ctx, scene, 'over', 7, effects, marks, 390, 5000, false, false, null, 0);
  expect(vi.mocked(link).mock.calls.map(call => call.slice(2, 4))).toEqual([[34, 42], [27, 35], [27, 43]]);
  // The check's still cause lines and seal draw in check.ts, in every row pass; it chooses the row.
  expect(drawCheck).toHaveBeenCalledTimes(8);
  expect(drawCheck).toHaveBeenLastCalledWith(ctx, scene, 'over', 7, { king: 4, checkers: marks.checkers, board: undefined, ms: Infinity, pixel: 960 / 390 });
});

it('times the check onset from its live signal and holds it without motion', () => {
  const effects = new StateEffects(), scene = sceneAt(false), board = new Uint8Array(64);
  const marks = { check: 4, checkers: [{ sq: 60, king: 4, path: 'straight' as const }] };
  effects.signal('check', '4:60', 1000, true);
  drawBoardEffects(ctx, scene, 'under', undefined, effects, marks, 960, 1200, true, false, null, 0, undefined, board);
  expect(drawCheck).toHaveBeenLastCalledWith(ctx, scene, 'under', undefined, expect.objectContaining({ ms: 200, board, pixel: 1 }));
  effects.rate = 2;
  drawBoardEffects(ctx, scene, 'under', undefined, effects, marks, 960, 1200, true, false, null, 0, undefined, board);
  expect(drawCheck).toHaveBeenLastCalledWith(ctx, scene, 'under', undefined, expect.objectContaining({ ms: 400 }));
  drawBoardEffects(ctx, scene, 'under', undefined, effects, marks, 960, 1200, false, false, null, 0, undefined, board);
  expect(drawCheck).toHaveBeenLastCalledWith(ctx, scene, 'under', undefined, expect.objectContaining({ ms: Infinity }));
});

it('withdraws an ended check under the figures for 220 ms, and not at all without motion', () => {
  const effects = new StateEffects(), scene = sceneAt(false);
  effects.withdraw(4, 1000, true);
  drawBoardEffects(ctx, scene, 'over', 7, effects, {}, 960, 1110, true, false, null, 0);
  expect(drawWithdrawal).not.toHaveBeenCalled();
  drawBoardEffects(ctx, scene, 'under', undefined, effects, {}, 960, 1110, true, false, null, 0);
  expect(drawWithdrawal).toHaveBeenCalledExactlyOnceWith(ctx, scene, 4, .5);
  expect(effects.remaining(1110)).toBeCloseTo(110);
  drawBoardEffects(ctx, scene, 'under', undefined, effects, {}, 960, 1220, true, false, null, 0);
  expect(drawWithdrawal).toHaveBeenCalledOnce();
  expect(effects.withdrawn).toBeUndefined();
  effects.withdraw(4, 2000, false);
  drawBoardEffects(ctx, scene, 'under', undefined, effects, {}, 960, 2001, true, false, null, 0);
  expect(drawWithdrawal).toHaveBeenCalledOnce();
});


it('keeps material faces and badge edges behind symbolic piece identity', () => {
  const f = fixtures.freeze, effects = new StateEffects(), scene = sceneAt(false);
  effects.sync(f.rules, f.after, 0, false);
  drawBoardEffects(ctx, scene, 'under', undefined, effects, {}, 390, 1, false, true, null, 0);
  expect(vi.mocked(drawFreeze).mock.calls.map(call => call[1].front)).toEqual([false, true]);
  expect(pips).toHaveBeenCalledOnce();
  vi.mocked(drawFreeze).mockClear();
  vi.mocked(pips).mockClear();
  drawBoardEffects(ctx, scene, 'over', scene.cell(35).row, effects, {}, 390, 1, false, true, null, 0);
  expect(drawFreeze).not.toHaveBeenCalled();
  expect(pips).not.toHaveBeenCalled();
});
