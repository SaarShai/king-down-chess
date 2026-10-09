import { afterEach, expect, it } from 'vitest';
import { legalMoves, setRules, type Move, type Position } from './rules/engine';
import { fromFen, toLan } from './rules/setup';
import { trickOf } from './tricks';

const find = (pos: Position, lan: string): Move => {
  const move = legalMoves(pos).find(m => toLan(pos, m) === lan);
  if (!move) throw new Error(`${lan} is not legal`);
  return move;
};

afterEach(() => setRules());

it('finds a bite chain, but not one bite', () => {
  const pos = fromFen('7k/8/5p2/3pp3/2nS4/8/8/K7 w - - 0 1');
  expect(trickOf(pos, find(pos, 'Sd4xd5xe5'))).toBe('chain');
  expect(trickOf(pos, find(pos, 'Sd4xd5'))).toBeNull();
});

it('finds a shot over a piece, but not over an empty square', () => {
  const blocked = fromFen('7k/8/8/2p5/2P5/2A5/8/K7 w - - 0 1');
  const clear = fromFen('7k/8/8/2p5/8/2A5/8/K7 w - - 0 1');
  expect(trickOf(blocked, find(blocked, 'Ac3*c5'))).toBe('shot-over');
  expect(trickOf(clear, find(clear, 'Ac3*c5'))).toBeNull();
});

it('finds a shove of a guard, but not a pawn', () => {
  const guard = fromFen('k7/8/8/8/2Og4/8/8/7K w - - 0 1');
  const pawn = fromFen('k7/8/8/8/2Op4/8/8/7K w - - 0 1');
  expect(trickOf(guard, find(guard, 'Oc4>d4-e4'))).toBe('shove-guard');
  expect(trickOf(pawn, find(pawn, 'Oc4>d4-e4'))).toBeNull();
});

it('finds a far swap with the king, but not a swap beside it', () => {
  const far = fromFen('7k/8/8/8/8/8/8/M3K3 w - - 0 1');
  const near = fromFen('7k/8/8/8/8/8/8/3MK3 w - - 0 1');
  expect(trickOf(far, find(far, 'Ma1<>e1'))).toBe('far-swap');
  expect(trickOf(near, find(near, 'Md1<>e1'))).toBeNull();
});

it('finds a king taking a guard, but not a pawn', () => {
  const guard = fromFen('7k/8/8/8/8/8/3g4/4K3 w - - 0 1');
  const pawn = fromFen('7k/8/8/8/8/8/3p4/4K3 w - - 0 1');
  expect(trickOf(guard, find(guard, 'Ke1xd2'))).toBe('king-guard');
  expect(trickOf(pawn, find(pawn, 'Ke1xd2'))).toBeNull();
});

it('finds Sacrifice, but not a pawn move', () => {
  setRules({ kings: [{ king: 'Stratus', power: 'Sacrifice' }, null] });
  const pos = fromFen('4k3/8/8/8/3b4/8/P1N5/4K3 w - - 0 1 lQr');
  const sacrifice = legalMoves(pos).find(m => m.power === 'sacrifice');
  if (!sacrifice) throw new Error('Sacrifice is not legal');
  expect(trickOf(pos, sacrifice)).toBe('second-life');
  expect(trickOf(pos, find(pos, 'a2-a3'))).toBeNull();
});
