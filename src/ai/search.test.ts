import { describe, expect, it } from 'vitest';
import {
  BLACK, Color, Move, Position, Q, WHITE, colorOf, isAttacked, legalMoves, makeMove, parseSq, piece, setRules, status, typeOf,
} from '../rules/engine';
import { fromFen, randomBackRank, startPosition, toLan } from '../rules/setup';
import { MATE, evaluate, positionKey, resetSearchState, search } from './search';

const MID = '1sakg1l1/1p1pppq1/3b4/r1p3p1/p1PPB1Pp/4P2P/PP1GQP2/RSAKL3 w - - 0 13';

const same = (a: Move, b: Move): boolean =>
  a.from === b.from && a.to === b.to && !!a.swap === !!b.swap && !!a.selfRemove === !!b.selfRemove &&
  a.promo === b.promo && a.captures.length === b.captures.length && a.captures.every((c, i) => c === b.captures[i]) &&
  // Under `ogreMode: 'repel'` every shove from one square shares `from` and `to`, so the shove is
  // the only thing that tells two of them apart.
  a.shove?.from === b.shove?.from && a.shove?.to === b.shove?.to;

const best = (fen: string, timeMs = 500) => {
  const pos = fromFen(fen);
  const res = search(pos, { timeMs });
  expect(res.move, `no move for ${fen}`).not.toBeNull();
  expect(legalMoves(pos).some(m => same(m, res.move!)), `illegal move ${toLan(pos, res.move!)}`).toBe(true);
  return { pos, res, after: makeMove(pos, res.move!), lan: toLan(pos, res.move!) };
};

describe('mate finding', () => {
  it('mates in one with a queen', () => {
    const { res, after, lan } = best('7k/8/6K1/8/8/8/8/1Q6 w - - 0 1');
    expect([lan, status(after)]).toEqual(['Qb1-b8', 'checkmate']);
    expect(res.score).toBeGreaterThanOrEqual(MATE - 1);
  });

  it('mates in one with an archer, whose check cannot be blocked', () => {
    const { res, after, lan } = best('7k/8/5N2/7A/8/8/8/K7 w - - 0 1');
    expect([lan, status(after)]).toEqual(['Ah5-h6', 'checkmate']);
    expect(res.score).toBeGreaterThanOrEqual(MATE - 1);
  });

  it('mates in two and prefers the shorter mate', () => {
    const { res, after } = best('7k/8/6K1/8/8/8/8/6Q1 w - - 0 1');
    // MATE - 3 is "mate on my second move"; anything longer would score lower.
    expect(res.score).toBe(MATE - 3);
    expect(status(after)).toBe('playing');
    const reply = search(after, { timeMs: 300 });
    const mate = search(makeMove(after, reply.move!), { timeMs: 300 });
    expect(status(makeMove(makeMove(after, reply.move!), mate.move!))).toBe('checkmate');
  });

  it('wins a beast chain instead of a single capture', () => {
    const { res, lan } = best('k7/8/5p2/3pp3/2nS4/8/8/6K1 w - - 0 1');
    expect(lan).toBe('Sd4xc4xd5xe5xf6');
    expect(res.move!.captures.length).toBe(4);
  });
});

describe('does not hang the queen', () => {
  it('leaves a king-defended pawn alone', () => {
    const { res, after } = best('4k3/3p4/8/8/8/8/3Q4/4K3 w - - 0 1');
    expect(res.move!.captures).not.toContain(parseSq('d7'));
    expect(after.board.indexOf(piece(Q, WHITE))).toBeGreaterThanOrEqual(0);
    expect(res.score).toBeGreaterThan(500);
  });

  it('moves an attacked queen somewhere safe', () => {
    const { after } = best('4k3/8/8/8/8/2n5/8/3QK3 w - - 0 1');
    const q = after.board.indexOf(piece(Q, WHITE));
    expect(q).toBeGreaterThanOrEqual(0);
    expect(isAttacked(after.board, q, BLACK)).toBe(false);
  });

  it('takes a free rook when there is one', () => {
    const { lan } = best('3r3k/8/8/8/8/8/3Q4/4K3 w - - 0 1');
    expect(lan).toBe('Qd2xd8');
  });
});

describe('evaluation', () => {
  it('is mirror-symmetric: the same position with the colours and ranks flipped scores the same', () => {
    const flip = (pos: Position): Position => {
      const board = new Uint8Array(64);
      for (let s = 0; s < 64; s++) {
        const p = pos.board[s];
        if (p) board[s ^ 56] = typeOf(p) | ((colorOf(p) ^ 1) << 4);
      }
      return { board, turn: (pos.turn ^ 1) as Color, halfmove: pos.halfmove, ply: pos.ply };
    };
    const fens = [
      MID,
      'k7/8/5p2/3pp3/2nS4/8/8/6K1 w - - 0 1',
      '4k3/3p4/8/8/8/8/3Q4/4K3 b - - 0 1',
      'r1bq1rk1/pp2ppbp/2np1np1/8/2BNP3/2N1B3/PPP2PPP/R2Q1RK1 w - - 0 1',
    ];
    for (const fen of fens) {
      const pos = fromFen(fen);
      expect([fen, evaluate(flip(pos))]).toEqual([fen, evaluate(pos)]);
    }
  });
});

describe('draw awareness', () => {
  it('avoids a repetition while it is winning', () => {
    const pos = fromFen('7k/8/8/8/8/8/6Q1/K7 w - - 10 1');
    const plain = search(pos, { timeMs: 300 });
    // Tell the search that the position this move reaches has already been on the board.
    const repeat = positionKey(makeMove(pos, plain.move!));
    const avoid = search(pos, { timeMs: 300, history: [repeat] });
    expect(same(avoid.move!, plain.move!)).toBe(false);
    expect(positionKey(makeMove(pos, avoid.move!))).not.toBe(repeat);
    expect(avoid.score).toBeGreaterThan(500); // still playing for the win, not settling for 0
  });
});

describe('fixed depth', () => {
  it('ignores the clock and repeats itself exactly after resetSearchState', () => {
    const pos = fromFen(MID);
    resetSearchState();
    const a = search(pos, { maxDepth: 4 });
    resetSearchState();
    const b = search(pos, { maxDepth: 4 });
    expect([toLan(pos, b.move!), b.score, b.depth, b.nodes]).toEqual([toLan(pos, a.move!), a.score, a.depth, a.nodes]);
    expect(a.depth).toBe(4);
  });
});

describe('self-play', () => {
  it('plays 40 games of up to 120 plies without an illegal move or an exception', () => {
    let seed = 20260913;
    const rng = () => ((seed = (seed * 48271) % 2147483647) / 2147483647);
    let plies = 0;
    for (let game = 0; game < 40; game++) {
      let pos = startPosition(randomBackRank(rng));
      const seen: number[] = [positionKey(pos)];
      for (let ply = 0; ply < 120 && status(pos) === 'playing'; ply++) {
        const res = search(pos, { timeMs: 15, history: seen });
        expect(res.move, `game ${game} ply ${ply}: no move`).not.toBeNull();
        const legal = legalMoves(pos);
        expect(legal.some(m => same(m, res.move!)), `game ${game} ply ${ply}: ${toLan(pos, res.move!)} is not legal`).toBe(true);
        pos = makeMove(pos, res.move!);
        seen.push(positionKey(pos));
        plies++;
      }
    }
    expect(plies).toBeGreaterThan(40 * 20); // games should not be dying instantly
  }, 300_000);
});


describe('MultiPV', () => {
  it('reports a second-best root score without changing the best move', () => {
    const pos = fromFen('7k/8/8/8/8/8/PPP5/K1R4r w - - 0 1');
    resetSearchState();
    const plain = search(pos, { maxDepth: 3 });
    resetSearchState();
    const multi = search(pos, { maxDepth: 3, multiPv: 2 });
    expect(multi.move && toLan(pos, multi.move)).toBe(plain.move && toLan(pos, plain.move));
    expect(multi.score).toBe(plain.score);
    expect(typeof multi.second).toBe('number');
    expect(multi.second!).toBeLessThanOrEqual(multi.score);
    expect(plain.second).toBeUndefined();          // off by default
  });

  it('gives no second score when there is only one legal move', () => {
    resetSearchState();
    const only = search(fromFen('7k/8/8/8/8/8/5PPP/6rK w - - 0 1'), { maxDepth: 2, multiPv: 2 });
    expect(only.second).toBeUndefined();
  });
});


/**
 * The lab pieces (2026-09-14). Both smokes are one-movers for a human and need the search to look
 * past a quiet move, which is what makes them worth running at all.
 */
describe('ogre and catapult', () => {
  it('lobs over the pawn screen to win the queen', () => {
    const { lan, res } = best('7k/8/q7/8/8/p7/8/C6K w - - 0 1');
    expect(lan).toBe('Ca1*a6');
    // A queen up and a pawn down, so the score is positive; the absolute value is mostly king table.
    expect(res.score).toBeGreaterThan(100);
  });

  it('repels its own pawn aside to discover a check and fork the rook with it', () => {
    setRules({ ogreMode: 'repel' });
    try {
    // Od4>e4-f4 opens the e-file onto the black king and the pawn lands attacking g5. Every answer
    // to the check loses the rook, and nothing else in the position wins material at all.
    const { lan, res } = best('4k3/8/8/6r1/3OP3/8/8/4R2K w - - 0 1', 1500);
    expect(lan).toBe('Od4>e4-f4');
    expect(res.score).toBeGreaterThan(300);
    } finally { setRules(); resetSearchState(); }
  });
});

describe('root temperature (opening variety)', () => {
  it('changes nothing when off, and samples inside the band when on', () => {
    const pos = fromFen(MID);
    resetSearchState();
    const a = search(pos, { maxDepth: 3 });
    resetSearchState();
    const b = search(pos, { maxDepth: 3 });
    expect(toLan(pos, a.move!)).toBe(toLan(pos, b.move!)); // deterministic without temperature

    // Sampling picks uniformly among the moves within the band, so rng 0 is the first candidate in
    // generation order, not necessarily the best move: the guarantee is the score, not the index.
    for (const r of [0, 0.5, 0.999]) {
      resetSearchState();
      const sampled = search(pos, { maxDepth: 3, temperature: 40, rng: () => r });
      expect(sampled.move).not.toBeNull();
      expect(legalMoves(pos).some(m => toLan(pos, m) === toLan(pos, sampled.move!))).toBe(true);
      expect(sampled.score).toBeGreaterThanOrEqual(a.score - 40); // never leaves the band
      expect(sampled.score).toBeLessThanOrEqual(a.score);
    }
  }, 20_000);
});
