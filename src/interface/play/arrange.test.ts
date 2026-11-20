import { expect, it } from 'vitest';
import { Game } from '../../game';
import { toFen } from '../../rules/setup';
import { dealArmy } from './new-game';
import { ARRANGE_KEY, Arrangement, savedArrangement } from './arrange';
import { PLAIN } from '../../render/plain-marks';

it('picks and swaps only the own back rank, including the same piece', () => {
  const a = new Arrangement('RNBQKBNR', 0);
  expect(a.pick(8)).toBe(false);
  a.pick(0); expect(a.selected).toBe(0); a.pick(7);
  expect(a.order).toBe('RNBQKBNR'); expect(a.selected).toBeNull();
  a.pick(1); a.pick(3); expect(a.order).toBe('RQBNKBNR');
  a.pick(3); a.pick(3); expect(a.order).toBe('RQBNKBNR');
  const b = new Arrangement('RNBQKBNR', 1); b.pick(57); b.pick(59);
  expect(b.order).toBe(a.order); expect(b.pick(0)).toBe(false);
});

it('keeps a bishop fault, names the rule and uses the warning mark until it is legal', () => {
  const a = new Arrangement('RNBQKBNR', 0); a.pick(5); a.pick(6);
  expect(a.order).toBe('RNBQKNBR'); expect(a.canReady).toBe(false);
  expect(a.error).toBe('Bishops must stand on opposite colours.'); expect(a.faults).toEqual([2, 6]);
  expect(a.marks().rings.filter(r => r.color === PLAIN.enemy).map(r => r.square)).toEqual([2, 6]);
  a.pick(6); a.pick(5); expect(a.canReady).toBe(true); expect(a.faults).toEqual([]);
});

it('marks the Guard and king on a broken adjacency rule', () => {
  const a = new Arrangement('RNBQKGRB', 1); expect(a.canReady).toBe(true);
  a.pick(61); a.pick(56);
  expect(a.error).toBe('The guard must stand next to the king.'); expect(a.faults).toEqual([56, 60]);
  expect(new Arrangement('RNBQKGRB', 0, 'RNBQKKBR').error).toBe('Use the same pieces as the army.');
});

it('every dealt row is legal', () => {
  for (let i = 0; i < 150; i++) expect(new Arrangement(dealArmy(), i % 2 as 0 | 1).canReady).toBe(true);
});

it.each([0, 1] as const)('changes only side %s and starts an asymmetric game through FEN', side => {
  const game = new Game('RNBQKBNR'), before = toFen(game.pos), a = new Arrangement(game.backRank, side);
  a.pick(side * 56 + 1); a.pick(side * 56 + 3);
  expect(a.canReady).toBe(true); const pos = a.position(game.pos);
  expect(toFen(game.pos)).toBe(before);
  expect(pos.board.slice((side ^ 1) * 56, (side ^ 1) * 56 + 8)).toEqual(game.pos.board.slice((side ^ 1) * 56, (side ^ 1) * 56 + 8));
  game.load(game.context.fromFen(toFen(pos))); expect(game.backRank).toBe('');
  expect(game.legal.length).toBeGreaterThan(0); game.play(game.legal[0]); expect(game.history).toHaveLength(1);
});

it('restarts only the matching unfinished saved deal', () => {
  const game = new Game('RNBQKBNR');
  const storage = { getItem: (key: string) => key === ARRANGE_KEY ? JSON.stringify({ army: game.backRank, side: 0, fen: toFen(game.pos) }) : null };
  expect(savedArrangement(storage, game, 0)?.draft.order).toBe(game.backRank);
  expect(savedArrangement(storage, game, 1)).toBeUndefined();
  expect(savedArrangement(storage, new Game('RQBNKBNR'), 0)).toBeUndefined();
  game.play(game.legal[0]); expect(savedArrangement(storage, game, 0)).toBeUndefined();
});

it('names both broken rules when both sets of pieces have warning marks', () => {
  const b = new Arrangement('RNBQKGBR', 0);
  expect(b.error).toBe('Bishops must stand on opposite colours.');
  b.pick(5); b.pick(0);
  expect(b.error).toBe('Bishops must stand on opposite colours. The guard must stand next to the king.');
  expect(b.faults).toEqual([2, 6, 0, 4]);
});

it('reads the Ready flag of a confirmed unchanged legacy order', () => {
  const game = new Game('RNBQKBNR'), marker = JSON.stringify({ army: game.backRank, side: 0, fen: toFen(game.pos), ready: true });
  game.load(game.pos);
  expect(savedArrangement({ getItem: () => marker }, game, 0)?.ready).toBe(true);
  expect(savedArrangement({ getItem: () => null }, game, 0)).toBeUndefined();
});

it.each([0, 1] as const)('an unfinished FEN rematch keeps Ready for side %s', side => {
  const game = new Game('RNBQKBNR'); game.load(game.pos);
  const marker = JSON.stringify({ army: 'RNBQKBNR', side, fen: toFen(game.pos) });
  expect(game.backRank).toBe('');
  expect(savedArrangement({ getItem: () => marker }, game, side)?.draft.order).toBe('RNBQKBNR');
});
