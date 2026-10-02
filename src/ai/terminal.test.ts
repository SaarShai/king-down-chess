import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Game } from '../game';
import { legalMoves, makeMove, parseKings, setRules, status } from '../rules/engine';
import { CLASSIC_CHESS, fromFen, startPosition, toLan } from '../rules/setup';
import { MATE, positionKey, quiesceScore, resetSearchState, search } from './search';

beforeEach(() => { setRules(); resetSearchState(); });
afterEach(() => { setRules(); resetSearchState(); });

describe('terminal rules agree in the game and search', () => {
  it.each([
    ['missing king', '8/8/8/8/8/8/7p/K7 b - - 0 1', 'checkmate', -MATE],
    ['checkmate before the fifty-move draw', '7k/6Q1/6K1/8/8/8/8/8 b - - 100 1', 'checkmate', -MATE],
    ['fifty-move draw', '7k/8/8/8/8/8/8/R3K3 w - - 100 1', 'draw50', 0],
    ['material draw', '7k/8/8/8/8/8/8/KN6 w - - 0 1', 'drawMaterial', 0],
    ['stalemate', '7k/5K2/6Q1/8/8/8/8/8 b - - 0 1', 'stalemate', 0],
  ] as const)('%s', (_name, fen, outcome, score) => {
    const pos = fromFen(fen);
    expect(status(pos)).toBe(outcome);
    const result = search(pos, { maxDepth: 1 });
    expect(result.move).toBeNull();
    expect(result.score === score).toBe(true);
    expect(quiesceScore(pos) === score).toBe(true);
  });

  it('scores capturing the king as a win, including at the capture horizon', () => {
    const pos = fromFen('7k/6Q1/8/8/8/8/8/K7 w - - 0 1');
    const result = search(pos, { maxDepth: 1 });
    expect(toLan(pos, result.move!)).toBe('Qg7xh8');
    expect(result.score).toBe(MATE - 1);
    expect(status(makeMove(pos, result.move!))).toBe('checkmate');
    expect(quiesceScore(pos)).toBe(MATE - 1);
  });

  it('does not value a stalemate at the horizon as won material', () => {
    const start = fromFen('4r2k/8/8/8/2n3n1/2n3n1/8/M1P1K3 w - - 0 1');
    const play = (pos: typeof start, lan: string) => makeMove(pos, legalMoves(pos).find(m => toLan(pos, m) === lan)!);
    const afterSwap = play(start, 'Ma1<>e1');
    const stale = play(afterSwap, 'Re8xe1');
    expect(status(stale)).toBe('stalemate');
    expect(quiesceScore(stale)).toBe(0);
    const result = search(afterSwap, { maxDepth: 1 });
    if (toLan(afterSwap, result.move!) === 'Re8xe1') expect(result.score === 0).toBe(true);
    else expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it('honors disabled draw rules and unspent Strike mating potential', () => {
    const minor = fromFen('7k/8/8/8/8/8/8/KN6 w - - 0 1');
    setRules({ insufficientMaterial: false });
    expect(status(minor)).toBe('playing');
    expect(search(minor, { maxDepth: 1 }).move).not.toBeNull();
    setRules({ kings: parseKings('flame:strike') });
    expect(status(minor)).toBe('playing');
    expect(search(minor, { maxDepth: 1 }).move).not.toBeNull();
    const spent = { ...minor, used: [1, 1] as [number, number] };
    expect(status(spent)).toBe('drawMaterial');
    expect(search(spent, { maxDepth: 1 }).move).toBeNull();
    setRules({ fiftyMove: false });
    const old = fromFen('7k/8/8/8/8/8/8/R3K3 w - - 100 1');
    expect(status(old)).toBe('playing');
    expect(search(old, { maxDepth: 1 }).move).not.toBeNull();
    setRules({ threefold: false });
    const g = new Game(CLASSIC_CHESS);
    const cycle = ['Ng1-f3', 'Ng8-f6', 'Nf3-g1', 'Nf6-g8'];
    expect(g.playLan([...cycle, ...cycle])).toBe(8);
    expect(g.status).toBe('playing');
  });

  it('the shipped push reading can also return to an earlier board after a pawn-clock reset', () => {
    const g = new Game(); g.load(fromFen('7k/8/8/2p5/2O5/8/8/K7 w - - 0 1'));
    const key = positionKey(g.pos);
    const cycle = ['Oc4>c5-c6', 'Kh8-h7', 'Oc5-c4', 'c6-c5', 'Oc4>c5-c6', 'Kh7-h8', 'Oc5-c4', 'c6-c5'];
    expect(g.playLan(cycle)).toBe(8);
    expect(g.pos.halfmove).toBe(0);
    expect(positionKey(g.pos)).toBe(key);
    expect(g.playLan(cycle)).toBe(8);
    expect(g.status).toBe('drawRepetition');
  });
});

it.each([0, 1])('returns a legal fallback with a %i ms budget', timeMs => {
  const pos = startPosition('QORKBNMS');
  const result = search(pos, { timeMs });
  expect(result.move).not.toBeNull();
  expect(legalMoves(pos).map(m => toLan(pos, m))).toContain(toLan(pos, result.move!));
});
