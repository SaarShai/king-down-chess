import { describe, expect, it } from 'vitest';
import { keyMoments } from './moment';

describe('keyMoments', () => {
  it('finds the moves that gave away the most, in game order', () => {
    // Ply 1 (Black, −20) leaves White +300; ply 3 lets White mate (loss capped at 1500 − 300);
    // ply 4 is White's mate.
    const before = [20, -20, 300, -300, 99_990], after = [-20, 300, -300, 99_990, -99_998];
    expect(keyMoments(before, after)).toEqual([
      { ply: 1, loss: 280, kind: 'loss' },
      { ply: 3, loss: 1200, kind: 'allowedMate' },
    ]);
  });
  it('a mating move and small drifts are not moments; a missed mate is', () => {
    expect(keyMoments([99_995], [-99_996])).toEqual([]); // the mover kept the mate
    expect(keyMoments([10, 50], [50, -30])).toEqual([]);
    expect(keyMoments([99_995], [0])[0]).toMatchObject({ ply: 0, kind: 'missedMate' });
  });
  it('keeps the largest `limit`', () => {
    expect(keyMoments([0, 0, 0, 0], [300, 0, 500, 250], 2).map(m => m.ply)).toEqual([0, 2]);
  });
});
