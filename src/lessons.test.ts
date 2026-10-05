import { describe, expect, it } from 'vitest';
import { LESSONS } from './lessons';
import { legalMoves } from './rules/engine';
import { fromFen, toLan } from './rules/setup';

describe('lessons', () => {
  it.each(LESSONS.map(l => [l.name, l] as const))('%s: a legal move reaches the goal, and a wrong one does not', (_, l) => {
    const pos = fromFen(l.fen), moves = legalMoves(pos);
    expect(moves.some(m => l.goal(pos, m))).toBe(true);
    expect(moves.some(m => !l.goal(pos, m))).toBe(true);
  });
  it('the Archer lesson teaches the official shot: over a piece, never over an empty square', () => {
    const l = LESSONS.find(x => x.name === 'Archer')!, pos = fromFen(l.fen);
    expect(legalMoves(pos).filter(m => l.goal(pos, m)).map(m => toLan(pos, m))).toEqual(['Ad4*f4']);
  });
});
