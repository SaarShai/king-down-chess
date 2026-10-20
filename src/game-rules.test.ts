import { expect, it, vi } from 'vitest';
import { GameRules } from './game-rules';
import { RULES } from './rules/rules';

it('draws with owned setup laws while entropy runs outside the rules scope', () => {
  const before = structuredClone(RULES);
  const context = new GameRules({ guardNextToKing: !before.guardNextToKing, bishopsOppositeColours: false });
  const rng = vi.fn(() => { expect(RULES).toEqual(before); return 0.25; });
  expect(context.randomBackRank(rng)).toHaveLength(8);
  expect(rng).toHaveBeenCalled();
  expect(RULES).toEqual(before);
});

it('rejects search callbacks before entering the owned rules scope', () => {
  const before = structuredClone(RULES), context = new GameRules({ classicChess: true });
  const pos = context.startPosition('RNBQKBNR'), rng = vi.fn(() => 0.5);
  expect(() => context.search({}, pos, { maxDepth: 1, rng } as never)).toThrow('entropy callback');
  expect(rng).not.toHaveBeenCalled();
  expect(RULES).toEqual(before);
});
