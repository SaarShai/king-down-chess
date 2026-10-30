import { describe, expect, it } from 'vitest';
import { refusal, withDesign } from './play-design';
import { PRESETS, fromPreset } from './model';
import { CLASSIC_CHESS } from '../rules/setup';

describe('Bring a design (ticket 17)', () => {
  const rook = { ...fromPreset(PRESETS.find(p => p.key === 'rook')!), name: 'My Rook', letter: 'Y' };
  const late = { ...rook, name: 'Late Rook', rules: [{ when: { on: 'fromMove' as const, n: 10 as const }, does: { a: 'movesLike' as const, as: 'knight' as const } }] };

  it('says why a design cannot play yet: a When that counts moves or cards', () => {
    expect(refusal(rook)).toBe('');
    expect(refusal(late)).toBe('a rule counts moves or cards');
    expect(refusal({ ...rook, lines: [], squares: [] })).toBe('it has no move'); // review 17, item 1: its code does not parse
  });

  it('puts the design in place of the piece nearest its worth, never the king, the left one on a tie', () => {
    expect(withDesign(CLASSIC_CHESS, 3.2)).toBe('RNTQKBNR');
    expect(withDesign(CLASSIC_CHESS, 9)).toBe('RNBTKBNR');
    expect(withDesign(CLASSIC_CHESS, 4.5)).toBe('TNBQKBNR');
    expect(withDesign('KQQQQQQQ', 0)).toBe('KTQQQQQQ');
    expect(withDesign('RTBQKBNR', 3)).toBe('RTBQKBNR'); // one design: a custom back rank that holds it already
  });
});
