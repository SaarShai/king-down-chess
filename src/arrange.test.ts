import { describe, expect, it } from 'vitest';
import { swapAt } from './arrange';
import { mulberry32 } from './sim/rng';
import { arrangementError, randomArrangement, startPosition, toFen } from './rules/setup';

const ARMY = 'RNBQKBNR';

describe('arrange mode', () => {
  it('accepts a reordering of the army with bishops on opposite colours', () => {
    expect(arrangementError('RNBQKBNR', ARMY)).toBeNull();
    expect(arrangementError('BBNNRRQK', ARMY)).toBeNull();
  });

  it('refuses same-colour bishops, other pieces and a missing king', () => {
    expect(arrangementError('BNBQKRNR', ARMY)).toMatch(/opposite colours/);
    expect(arrangementError('RNBQKBNQ', ARMY)).toMatch(/same pieces/);
    expect(arrangementError('RNBQQBNR', 'RNBQQBNR')).toMatch(/one king/);
  });

  it('Randomize gives legal orders of the same pieces', () => {
    const rng = mulberry32(7);
    for (const army of [ARMY, 'MMSANBBK', 'QORGBBAK']) for (let i = 0; i < 200; i++) {
      expect(arrangementError(randomArrangement(army, rng), army)).toBeNull();
    }
  });

  it('swaps two squares', () => {
    expect(swapAt(ARMY, 0, 4)).toBe('KNBQRBNR');
  });

  it('gives each side its own back rank, pawns as usual', () => {
    const fen = toFen(startPosition('RNBQKBNR', 'BBNNRRQK'));
    expect(fen).toBe('bbnnrrqk/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1');
    expect(toFen(startPosition(ARMY))).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1');
  });
});
