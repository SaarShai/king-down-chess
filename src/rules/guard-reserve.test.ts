/**
 * `guardReserve` (lab, 2026-10-04): "Your Guard starts beside the board; as a move, place it on any
 * empty square of your first rank" (`rank1`), or of your first two ranks (`rank12`). The start
 * position, FEN, the drop move and its notation, legality, the search's key, replay and the sims.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { BLACK, G, Position, WHITE, inCheck, legalMoves, makeMove, materialDraw, parseSq, status, typeOf } from './engine';
import { fromFen, randomBackRank, startPosition, toFen, toLan } from './setup';
import { parseRule, setRules } from './rules';
import { positionKey, probeApply, resetSearchState, search, searchLegal } from '../ai/search';
import { mulberry32 } from '../sim/rng';
import { replayRecord } from '../sim/replay';
import { startGame } from '../sim/game';

afterEach(() => { setRules(); resetSearchState(); });

const lans = (pos: Position): string[] => legalMoves(pos).map(m => toLan(pos, m)).sort();
const drops = (pos: Position): string[] => lans(pos).filter(l => l.startsWith('G@'));
const play = (pos: Position, lan: string): Position => {
  const m = legalMoves(pos).find(x => toLan(pos, x) === lan);
  if (!m) throw new Error(`${lan} is not legal in ${toFen(pos)}: ${lans(pos).join(' ')}`);
  return makeMove(pos, m);
};
const legalSame = (pos: Position): void => { expect(searchLegal(pos).map(m => toLan(pos, m)).sort()).toEqual(lans(pos)); };

describe('guard reserve', () => {
  it('parses as a rule', () => {
    expect(parseRule('guardReserve=rank1')).toEqual({ guardReserve: 'rank1' });
    expect(parseRule('guardReserve=rank12')).toEqual({ guardReserve: 'rank12' });
    expect(() => parseRule('guardReserve=rank3')).toThrow(/bad guardReserve/);
  });

  it('the start: the guard\'s square is empty and the guard waits; FEN says so; the back ranks are drawn as before', () => {
    setRules({ guardReserve: 'rank1' });
    const pos = startPosition('RNBGKBNR');
    expect(toFen(pos)).toBe('rnb1kbnr/pppppppp/8/8/8/8/PPPPPPPP/RNB1KBNR w - - 0 1 g1.1');
    expect(fromFen(toFen(pos))).toEqual(pos);
    // An army without a guard is unaffected.
    expect(toFen(startPosition('RNBQKBNR'))).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1');
    const ranks = (): string[] => { const rng = mulberry32(5); return Array.from({ length: 50 }, () => randomBackRank(rng)); };
    const on = ranks();
    setRules();
    expect(ranks()).toEqual(on);
    expect(toFen(startPosition('RNBGKBNR'))).toBe('rnbgkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBGKBNR w - - 0 1');
  });

  it('enters on an empty square of the own first rank (rank1) or first two ranks (rank12), as a move', () => {
    const fen = '4k3/8/8/8/8/8/1PPPPPP1/RN2K2R w - - 5 9 g1.1';
    setRules({ guardReserve: 'rank1' });
    expect(drops(fromFen(fen))).toEqual(['G@c1', 'G@d1', 'G@f1', 'G@g1']);
    setRules({ guardReserve: 'rank12' });
    const pos = fromFen(fen);
    expect(drops(pos)).toEqual(['G@a2', 'G@c1', 'G@d1', 'G@f1', 'G@g1', 'G@h2']);
    const next = play(pos, 'G@h2');
    expect([typeOf(next.board[parseSq('h2')]), next.board[parseSq('h2')] >> 4, next.turn, next.halfmove, next.used]).toEqual([G, WHITE, BLACK, 6, undefined]);
    expect(toFen(next)).toBe('4k3/8/8/8/8/8/1PPPPPPG/RN2K2R b - - 6 9 g0.1');
    expect(fromFen(toFen(next))).toEqual(next);
    const m = legalMoves(pos).find(x => toLan(pos, x) === 'G@h2')!;
    expect(probeApply(pos, m)).toEqual({ after: positionKey(next), back: positionKey(pos) });
    expect(positionKey(next)).not.toBe(positionKey({ ...next, waiting: [0, 0] }));
    // Black's guard enters on its own side; White has no guard left to place, and the placed one is a guard.
    expect(drops(next).filter(l => /[12]$/.test(l))).toEqual([]);
    expect(drops(next).length).toBe(15); // ranks 7 and 8 but the king's square
    const after = play(next, 'G@e7');
    expect(drops(after)).toEqual([]);
    expect(lans(after).filter(l => l.startsWith('Gh2'))).toEqual(['Gh2-g1', 'Gh2-g3', 'Gh2-h3']);
    legalSame(pos);
    legalSame(next);
  });

  it('off, a waiting guard never enters; guardNoSecondRank keeps it off the second rank', () => {
    expect(drops(fromFen('4k3/8/8/8/8/8/8/4K3 w - - 0 1 g1.1'))).toEqual([]);
    setRules({ guardReserve: 'rank12', guardNoSecondRank: true });
    expect(drops(fromFen('4k3/8/8/8/8/8/8/4K3 w - - 0 1 g1.1'))).toEqual(['a1', 'b1', 'c1', 'd1', 'f1', 'g1', 'h1'].map(s => `G@${s}`));
  });

  it('may block a check (the point of a wall), and never leaves the king in check', () => {
    setRules({ guardReserve: 'rank12' });
    // The rook checks along the first rank: only b1-d1 answer it.
    const checked = fromFen('4k3/8/8/8/8/8/8/r3K3 w - - 0 1 g1.0');
    expect(drops(checked)).toEqual(['G@b1', 'G@c1', 'G@d1']);
    expect(inCheck(play(checked, 'G@d1'))).toBe(false);
    legalSame(checked);
    // Between an enemy catapult and the king the guard is its screen: no square of that line.
    const screen = fromFen('4k3/8/8/8/8/8/8/K6c w - - 0 1 g1.0');
    expect(drops(screen).filter(l => l.endsWith('1'))).toEqual([]);
    legalSame(screen);
    // The search blocks the mate threat of the rook rather than lose the king.
    const mate = fromFen('4k3/8/8/8/8/8/PPP5/1K5r w - - 0 1 g1.0');
    expect(toLan(mate, search(mate, { maxDepth: 3 }).move!)).toMatch(/^G@[c-g]1$/);
  });

  it('a waiting guard: no stalemate while it may enter; mating material only when guards may take a king', () => {
    setRules({ guardReserve: 'rank1' });
    const lone = fromFen('7k/8/8/8/8/8/8/K7 w - - 0 1 g1.0');
    expect(status(lone)).toBe('drawMaterial'); // a guard captures nothing, so it cannot mate
    setRules({ guardReserve: 'rank1', guardCaptures: 'any' });
    expect(materialDraw(lone.board, lone.used, lone.lost, lone.waiting)).toBe(false);
    expect(status(lone)).toBe('playing');
    setRules({ guardReserve: 'rank1', insufficientMaterial: false });
    // Boxed in: the king has no square, but the guard may still enter.
    const boxed = fromFen('8/8/8/8/8/1q6/2k5/K7 w - - 0 1 g1.0');
    expect(lans(boxed)).toEqual(['G@b1', 'G@c1', 'G@d1', 'G@e1', 'G@f1', 'G@g1', 'G@h1']);
    expect(status(boxed)).toBe('playing');
  });

  it('a recorded drop replays by its notation, and the sims start every game with the guards off', () => {
    setRules({ guardReserve: 'rank1' });
    const startFen = toFen(startPosition('RNBGKBNR'));
    const { end } = replayRecord({ gameId: 1, startFen, moves: ['d2-d4', 'd7-d5', 'Bc1-f4', 'Bc8-f5', 'G@c1', 'G@d8'].map(lan => ({ lan })) });
    expect(toFen(end)).toBe('rn1gkbnr/ppp1pppp/8/3p1b2/3P1B2/8/PPP1PPPP/RNG1KBNR w - - 4 4');
    expect(() => replayRecord({ gameId: 2, startFen, moves: [{ lan: 'G@e4' }] })).toThrow(/parsed nothing/);
    // The values experiment's asymmetric armies: only the side with the guard has one waiting.
    expect(toFen(startGame('RGBQKBNR', 'RNBQKBNR').pos)).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/R1BQKBNR w - - 0 1 g1.0');
    expect(startGame('RNBGKBNR', 'RNBGKBNR', 'rnbgkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBGKBNR w - - 0 1').pos.waiting).toEqual([1, 1]);
  });
});
