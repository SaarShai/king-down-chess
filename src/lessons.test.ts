import { describe, expect, it } from 'vitest';
import { LESSONS } from './lessons';
import { legalMoves } from './rules/engine';
import { fromFen } from './rules/setup';

describe('lessons', () => {
  it.each(LESSONS.map(l => [l.name, l] as const))('%s: a legal move reaches the goal, and a wrong one does not', (_, l) => {
    const pos = fromFen(l.fen), moves = legalMoves(pos);
    expect(moves.some(m => l.goal(pos, m))).toBe(true);
    expect(moves.some(m => !l.goal(pos, m))).toBe(true);
  });
});

it('keeps lesson boards in the shelf order', () => {
  expect(LESSONS.map(l => l.name)).toEqual(['Archer', 'Beast', 'Maester', 'Ogre', 'Guard', 'Paladin']);
});
