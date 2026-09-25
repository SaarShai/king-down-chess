import { afterEach, beforeEach, expect, it } from 'vitest';
import { Game } from '../game';
import { inCheck, legalMoves, makeMove, setRules } from '../rules/engine';
import { fromFen, toLan } from '../rules/setup';
import { positionKey, quiesceScore, resetSearchState, search } from './search';

// Preserve the original baseline-failing cycle under the historical repel reading.
beforeEach(() => setRules({ ogreMode: 'repel' }));
afterEach(() => { setRules(); resetSearchState(); });

const CYCLE = '7k/8/8/8/3p4/2BOK3/8/8 w - - 0 1';

it('an Ogre/pawn check cycle repeats despite resetting the halfmove clock', () => {
  const game = new Game();
  game.load(fromFen(CYCLE));
  const key = positionKey(game.pos);
  for (let cycle = 0; cycle < 2; cycle++) {
    for (const lan of ['Od3>d4-d5', 'd5-d4']) {
      expect(inCheck(game.pos)).toBe(true);
      const move = game.legal.find(m => toLan(game.pos, m) === lan);
      expect(move).toBeDefined();
      game.play(move!);
    }
    expect(positionKey(game.pos)).toBe(key);
    expect(game.pos.halfmove).toBe(0);
  }
  expect(game.status).toBe('drawRepetition');
});

it('search respects prior positions even when the halfmove clock is zero', () => {
  const pos = fromFen(CYCLE);
  // All possible successors occurred earlier. Each must be valued as a repetition;
  // the search's twofold policy must not discard history at a pawn-clock reset.
  const history = legalMoves(pos).map(m => positionKey(makeMove(pos, m)));
  resetSearchState();
  const result = search(pos, { maxDepth: 1, history });
  expect(result.score === 0).toBe(true);
  expect(result.nodes).toBeLessThanOrEqual(legalMoves(pos).length);
});

it('includes spent Strike state in the search repetition key', () => {
  const pos = { ...fromFen(CYCLE), strike: [true, false] as [boolean, boolean] };
  const history = legalMoves(pos).map(m => positionKey(makeMove(pos, m)));
  resetSearchState();
  expect(search(pos, { maxDepth: 1, history }).score === 0).toBe(true);
});

it('quiescence applies the fifty-move draw and starts from its own history/state', () => {
  const pos = fromFen(CYCLE);
  const quiet = quiesceScore(pos);
  search(pos, { maxDepth: 1, history: [positionKey(pos)] });
  expect(quiesceScore(pos)).toBe(quiet);
  expect(quiesceScore({ ...pos, halfmove: 100 })).toBe(0);
});

it('cuts the reversible Ogre/pawn check cycle during search', () => {
  resetSearchState();
  const pos = fromFen(CYCLE);
  const result = search(pos, { maxDepth: 1 });
  expect(legalMoves(pos).some(m => toLan(pos, m) === toLan(pos, result.move!))).toBe(true);
  expect(result.score).toBeGreaterThan(500);
  // Baseline visits 448 nodes by revisiting the two-ply checked position. A legal
  // cycle should be cut on recurrence, not searched repeatedly until ply 72.
  expect(result.nodes).toBeLessThan(150);
});
