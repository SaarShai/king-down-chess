import { afterEach, describe, expect, it } from 'vitest';
import {
  A, B, BLACK, C, G, K, L, M, N, O, P, Q, R, S, SPENT, T, V, WHITE, colorOf, genPiece, inCheck, insufficientMaterial, isAttacked, legalMoves, makeMove,
  parseSq, perft, piece, status, typeOf, Move, PieceType, Position, file, sqName,
} from './engine';
import { parseLan } from '../sim/tune';
import { CLASSIC_CHESS, POOL, fromFen, randomBackRank, startPosition, toFen, toLan } from './setup';
import { DEFAULT_RULES, RULES, RULES_2017, RULES_2021, Rules, parseKing, parseKings, parseRule, ruleDiff, setRules } from './rules';
import { Game } from '../game';
import { resetSearchState, search } from '../ai/search';

const at = (pos: Position, name: string) => pos.board[parseSq(name)];
const movesFrom = (pos: Position, name: string) => legalMoves(pos).filter(m => m.from === parseSq(name));
const lan = (pos: Position, ms: Move[]) => ms.map(m => toLan(pos, m)).sort();
/** Pseudo-legal moves of one piece, whatever the side to move is (move-generation checks, not legality). */
const genAt = (pos: Position, name: string) => {
  const out: Move[] = [];
  genPiece(pos.board, parseSq(name), 'all', out);
  return lan(pos, out);
};

describe('standard chess sanity', () => {
  it('perft from the classic start position (no castling / en passant reachable at these depths)', () => {
    const pos = startPosition(CLASSIC_CHESS);
    expect(perft(pos, 1)).toBe(20);
    expect(perft(pos, 2)).toBe(400);
    expect(perft(pos, 3)).toBe(8902);
  });
  it('fen round-trips', () => {
    const pos = startPosition(CLASSIC_CHESS);
    expect(toFen(pos)).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1');
    expect(toFen(fromFen(toFen(pos)))).toBe(toFen(pos));
  });
  it('detects mate and stalemate', () => {
    expect(status(fromFen('7k/6Q1/6K1/8/8/8/8/8 b - - 0 1'))).toBe('checkmate');
    expect(status(fromFen('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1'))).toBe('stalemate');
    expect(status(fromFen('7k/8/5K2/8/8/8/8/8 w - - 100 1'))).toBe('draw50');
  });
  it('promotes to any non-king piece but the guard (docs/RULES.md §6.13)', () => {
    const pos = fromFen('7k/P7/8/8/8/8/8/K7 w - - 0 1');
    const promos = movesFrom(pos, 'a7');
    expect(promos.map(m => m.promo).sort()).toEqual([Q, R, B, N, A, L, M, S].sort());
    expect(typeOf(at(makeMove(pos, promos.find(m => m.promo === S)!), 'a8'))).toBe(S);
  });
});

describe('archer', () => {
  const pos = fromFen('7k/8/8/2p5/2Pp4/2A5/8/K7 w - - 0 1');
  it('steps 1 in any direction, shoots diagonal-adjacent and 2-away orthogonal targets through blockers', () => {
    expect(lan(pos, movesFrom(pos, 'c3')))
      .toEqual(['Ac3*c5', 'Ac3*d4', 'Ac3-b2', 'Ac3-b3', 'Ac3-b4', 'Ac3-c2', 'Ac3-d2', 'Ac3-d3']);
    const shot = movesFrom(pos, 'c3').find(m => m.to === m.from)!;
    const after = makeMove(pos, shot);
    expect(typeOf(at(after, 'c3'))).toBe(A);
    expect(at(after, sqName(shot.captures[0]))).toBe(0);
  });
  it('gives check through blockers; king may not step onto a shot square', () => {
    const p2 = fromFen('8/8/8/4k3/4P3/4A3/8/K7 b - - 0 1');
    expect(inCheck(p2)).toBe(true);
    expect(lan(p2, legalMoves(p2))).toEqual(['Ke5-d6', 'Ke5-e6', 'Ke5-f6', 'Ke5xe4']);
  });
});

describe('guard double step from home (lab)', () => {
  afterEach(() => setRules());
  // White guard on d1 behind its pawn on d2, c2 open; Black guard already out on d6.
  const pos = fromFen('4k3/8/3g4/8/8/8/3P4/3G3K w - - 0 1');
  it('off: one step only', () => {
    expect(lan(pos, movesFrom(pos, 'd1'))).toEqual(['Gd1-c1', 'Gd1-c2', 'Gd1-e1', 'Gd1-e2']);
  });
  it('slide: two squares through an empty middle square, only from the home rank', () => {
    setRules({ guardDoubleFirst: 'slide' });
    expect(lan(pos, movesFrom(pos, 'd1'))).toEqual(['Gd1-b1', 'Gd1-b3', 'Gd1-c1', 'Gd1-c2', 'Gd1-e1', 'Gd1-e2', 'Gd1-f1', 'Gd1-f3']);
    const black = { ...pos, turn: BLACK };
    expect(movesFrom(black, 'd6')).toHaveLength(8); // off its home rank: the plain eight neighbours
  });
  it('leap: over the pawn in front, and never a capture', () => {
    setRules({ guardDoubleFirst: 'leap' });
    const ms = movesFrom(pos, 'd1');
    expect(lan(pos, ms)).toContain('Gd1-d3');
    expect(ms.every(m => m.captures.length === 0)).toBe(true);
    expect(isAttacked(pos.board, parseSq('d3'), WHITE)).toBe(false); // move-only: no new attacks
  });
});

describe('paladin', () => {
  const pos = fromFen('7k/8/r7/8/p7/2g5/P7/L6K w - - 0 1');
  it('jumps friendlies, is blocked by enemies, cannot take a guard; survives a pawn, dies on anything bigger', () => {
    const ms = movesFrom(pos, 'a1');
    expect(lan(pos, ms)).toEqual(['La1-a3', 'La1-b1', 'La1-b2', 'La1-c1', 'La1-d1', 'La1-e1', 'La1-f1', 'La1-g1', 'La1xa4']);
    const cap = ms.find(m => m.captures.length)!;
    expect(cap.selfRemove).toBeUndefined(); // a4 is a pawn: the paladin lives (docs/RULES.md §6.15)
    const after = makeMove(pos, cap);
    expect(at(after, 'a1')).toBe(0);
    expect(typeOf(at(after, 'a4'))).toBe(L);
    const rook = fromFen('7k/8/8/8/r7/8/8/L6K w - - 0 1');
    const big = movesFrom(rook, 'a1').find(m => m.captures.length)!;
    expect(big.selfRemove).toBe(true);
    const gone = makeMove(rook, big);
    expect([at(gone, 'a1'), at(gone, 'a4')]).toEqual([0, 0]);
  });
  it('never gives check', () => {
    expect(inCheck(fromFen('4k3/8/8/8/8/8/8/4L2K b - - 0 1'))).toBe(false);
    expect(inCheck(fromFen('4k3/8/8/8/8/8/8/4Q2K b - - 0 1'))).toBe(true);
  });
});

describe('guard', () => {
  const pos = fromFen('3r4/8/8/4k3/3G4/8/8/K7 b - - 0 1');
  it('cannot be captured except by a king, and blocks sliders', () => {
    const ms = legalMoves(pos);
    const onGuard = ms.filter(m => m.captures.includes(parseSq('d4')));
    expect(lan(pos, onGuard)).toEqual(['Ke5xd4']);
    expect(lan(pos, movesFrom(pos, 'd8').filter(m => file(m.to) === 3))).toEqual(['Rd8-d5', 'Rd8-d6', 'Rd8-d7']);
  });
  // The shipped guard is the immortal wall (docs/RULES.md §6.9): it walks one square and takes
  // nothing, so an adjacent enemy is only a blocked square.
  it('never captures: an adjacent enemy pawn is a blocked square, not a target', () => {
    const p2 = fromFen('7k/8/8/8/3p4/3G4/8/K7 w - - 0 1');
    expect(movesFrom(p2, 'd3').every(m => m.captures.length === 0)).toBe(true);
    expect(movesFrom(p2, 'd3')).toHaveLength(7); // the 8 neighbours less the pawn on d4
    expect(isAttacked(p2.board, parseSq('d4'), WHITE)).toBe(false);
    expect(toFen(p2).split(' ')[0]).not.toContain('H'); // no guard can ever be spent
  });

  it('the 2017 preset changes nothing about it', () => {
    setRules(RULES_2017);
    const p2 = fromFen('7k/8/8/8/3p4/3G4/8/K7 w - - 0 1');
    expect(movesFrom(p2, 'd3').every(m => m.captures.length === 0)).toBe(true);
    expect(movesFrom(p2, 'd3')).toHaveLength(7);
    setRules();
  });
});

describe('maester', () => {
  const pos = fromFen('7k/8/8/8/8/8/pN6/M3K3 w - - 0 1');
  it('captures adjacent enemies, swaps with adjacent friends, swaps with the king along the first rank', () => {
    const ms = movesFrom(pos, 'a1');
    expect(lan(pos, ms)).toEqual(['Ma1-b1', 'Ma1<>b2', 'Ma1<>e1', 'Ma1xa2']);
    const kingSwap = makeMove(pos, ms.find(m => m.swap && m.to === parseSq('e1'))!);
    expect(typeOf(at(kingSwap, 'a1'))).toBe(K);
    expect(typeOf(at(kingSwap, 'e1'))).toBe(M);
  });
});

describe('beast', () => {
  it('moves 1 in any direction, captures on the 7 squares that are not straight ahead, and may chain', () => {
    const pos = fromFen('7k/8/5p2/3pp3/2nS4/8/8/K7 w - - 0 1');
    expect(lan(pos, movesFrom(pos, 'd4'))).toEqual([
      'Sd4-c3', 'Sd4-c5', 'Sd4-d3', 'Sd4-e3', 'Sd4-e4',
      'Sd4xc4', 'Sd4xc4xd5', 'Sd4xc4xd5xe5', 'Sd4xc4xd5xe5xf6',
      'Sd4xe5', 'Sd4xe5xd5', 'Sd4xe5xd5xc4', 'Sd4xe5xf6',
    ]);
    const chain = movesFrom(pos, 'd4').find(m => m.captures.length === 4)!;
    const after = makeMove(pos, chain);
    expect(typeOf(at(after, 'f6'))).toBe(S);
    expect(['d4', 'c4', 'd5', 'e5'].map(s => at(after, s))).toEqual([0, 0, 0, 0]);
  });
  it('attacks adjacent kings except straight ahead', () => {
    expect(inCheck(fromFen('8/8/8/4k3/3S4/8/8/K7 b - - 0 1'))).toBe(true);
    expect(inCheck(fromFen('8/8/8/3k4/3S4/8/8/K7 b - - 0 1'))).toBe(false);
  });
});

describe('setup', () => {
  it('random back rank draws 7 from the pool plus a king, bishops on opposite colours', () => {
    let seed = 42;
    const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 200; i++) {
      const row = randomBackRank(rng);
      expect(row).toHaveLength(8);
      expect(row.split('K')).toHaveLength(2);
      const pool = POOL.split('');
      for (const ch of row.replace('K', '')) expect(pool.splice(pool.indexOf(ch), 1)).toEqual([ch]);
      const bishops = [...row].flatMap((p, i) => (p === 'B' ? [i] : []));
      if (bishops.length === 2) expect((bishops[0] + bishops[1]) % 2).toBe(1);
    }
    const pos = startPosition(randomBackRank(rng));
    expect([...pos.board].filter(Boolean)).toHaveLength(32);
    for (let f = 0; f < 8; f++) expect(typeOf(pos.board[f])).toBe(typeOf(pos.board[56 + f]));
  });
});

/**
 * `isAttacked` is a reverse lookup, so it must return exactly what `genPiece('attacks')` generates.
 * Every rule that changes a capture pattern has to keep the two in step; each toggle test below
 * calls this under its own rule set.
 */
function crossCheckAttacks(seed: number, trials = 200): void {
  const rng = () => ((seed = (seed * 48271) % 2147483647) / 2147483647);
  const types: PieceType[] = [P, N, B, R, Q, K, A, L, G, M, S, O, C, V, T];
  for (let trial = 0; trial < trials; trial++) {
    const board = new Uint8Array(64);
    for (let s = 0; s < 64; s++) {
      if (rng() < 0.75) continue;
      const t = types[Math.floor(rng() * types.length)];
      if (t === P && (s < 8 || s >= 56)) continue;
      // Half the guards have spent their one capture, so the flag is exercised on every rule set.
      board[s] = piece(t, rng() < 0.5 ? WHITE : BLACK) | (t === G && rng() < 0.5 ? SPENT : 0);
    }
    for (const by of [WHITE, BLACK]) {
      const attacked = new Set<number>();
      const out: Move[] = [];
      for (let s = 0; s < 64; s++) if (board[s] && colorOf(board[s]) === by) genPiece(board, s, 'attacks', out);
      for (const m of out) attacked.add(m.captures[0]);
      for (let s = 0; s < 64; s++) {
        if (!board[s] || colorOf(board[s]) === by) continue;
        expect(isAttacked(board, s, by), `trial ${trial} ${sqName(s)} by ${by}`).toBe(attacked.has(s));
      }
    }
  }
}

describe('isAttacked agrees with generated captures on random boards', () => {
  it('cross-checks the reverse lookup against genPiece("attacks")', () => { crossCheckAttacks(7, 300); });
});

describe('draws', () => {
  const insuf = (fen: string) => insufficientMaterial(fromFen(fen).board);
  it('counts only material that can mate; guards and paladins never can', () => {
    expect(insuf('7k/8/8/8/8/8/8/K7 w - - 0 1')).toBe(true); // K vs K
    expect(insuf('7k/8/8/8/8/8/8/KN6 w - - 0 1')).toBe(true); // K+N vs K
    expect(insuf('6nk/8/8/8/8/8/8/KB6 w - - 0 1')).toBe(true); // K+B vs K+N
    expect(insuf('7k/8/8/8/8/8/8/KGL5 w - - 0 1')).toBe(true); // K+G+L vs K
    expect(insuf('7k/8/8/8/8/8/8/KM6 w - - 0 1')).toBe(false);
    expect(insuf('7k/8/8/8/8/8/8/KA6 w - - 0 1')).toBe(false);
    expect(insuf('7k/8/8/8/8/P7/8/K7 w - - 0 1')).toBe(false);
    expect(insuf('7k/8/8/8/8/8/8/KNN5 w - - 0 1')).toBe(false);
    expect(insuf('7k/8/8/8/8/8/8/KS6 w - - 0 1')).toBe(false);
  });
  it('reports a material draw while legal moves remain', () => {
    expect(status(fromFen('7k/8/8/8/8/8/8/KG6 w - - 0 1'))).toBe('drawMaterial');
  });
  it('draws a game on the third occurrence of the start position', () => {
    const game = new Game(CLASSIC_CHESS);
    const play = (from: string, to: string) => {
      const m = game.legal.find(mv => mv.from === parseSq(from) && mv.to === parseSq(to));
      game.play(m!);
    };
    const outAndBack = () => { play('b1', 'c3'); play('b8', 'c6'); play('c3', 'b1'); play('c6', 'b8'); };
    outAndBack(); // start position seen twice
    play('b1', 'c3'); play('b8', 'c6'); play('c3', 'b1');
    expect(game.status).toBe('playing');
    play('c6', 'b8'); // third time
    expect(game.status).toBe('drawRepetition');
  });
});

it('archer never captures by displacement: an orthogonally adjacent enemy king is neither in check nor capturable', () => {
  // White archer e4, black king e5 (adjacent, orthogonal); black pawn d3 is diagonal-adjacent → shootable.
  const pos = fromFen('8/8/8/4k3/4A3/3p4/8/4K3 w - - 0 1');
  const moves = legalMoves(pos);
  const kingSq = 4 * 8 + 4, pawnSq = 2 * 8 + 3, archerSq = 3 * 8 + 4;
  expect(moves.some(m => m.captures.includes(kingSq))).toBe(false);
  expect(moves.some(m => m.from === archerSq && m.to === kingSq)).toBe(false);
  expect(moves.some(m => m.from === archerSq && m.to === archerSq && m.captures.includes(pawnSq))).toBe(true);
  expect(isAttacked(pos.board, kingSq, 0)).toBe(false);
  // Black to move next to the archer: the king is not in check, so a quiet king move is legal.
  const black = fromFen('8/8/8/4k3/4A3/3p4/8/4K3 b - - 0 1');
  expect(legalMoves(black).length).toBeGreaterThan(0);
});


// -----------------------------------------------------------------------------------------------
// Rule toggles (src/rules/rules.ts). One consequence per switch; the defaults are today's game.

/** The maximal buff set of research §18: the shipped rules plus the two toggles they left out. */
const BUFFED: Partial<Rules> = { archerShots: 'plusDiag2', beastCaptureForward: true };

/** The 2021 "Chess Expansion Concept" archer and beast, as one rule set. */
const CONCEPT_2021: Partial<Rules> = {
  archerMove: 'fwdBack', archerShots: 'forward3', beastMove: 'diagFwdBack', beastCapture: 'diagForward',
};

describe('rule toggles', () => {
  afterEach(() => { setRules(); });

  it('the presets name the older games, and parseRule rejects nonsense', () => {
    expect(RULES).toEqual(DEFAULT_RULES);
    // The shipped game is the 2017 rulebook plus the two adopted buffs (docs/RULES.md §6.8); the
    // guard keeps its rulebook identity (§6.9), so the preset is exactly those two fields turned
    // back and the three guard toggles are lab-only.
    expect(ruleDiff(RULES_2017)).toEqual({ archerMove: 'ortho', archerShots: 'classic', beastMove: 'forward', paladinKamikaze: 'always', promotionSet: 'anyNonKing' });
    expect(DEFAULT_RULES.promotionSet).toBe('anyNonKingNoGuard'); // a pawn never becomes a wall
    expect(DEFAULT_RULES.guardCaptures).toBe('none');
    expect(DEFAULT_RULES.guardStep).toBe(1);
    expect(DEFAULT_RULES.guardCaptureLimit).toBe(0);
    expect(ruleDiff(RULES_2021)).toEqual({
      ...ruleDiff(RULES_2017),
      archerMove: 'fwdBack', archerShots: 'forward3', beastMove: 'diagFwdBack', beastCapture: 'diagForward',
    });
    expect(parseRule('beastChains=false')).toEqual({ beastChains: false });
    expect(parseRule('guardCaptures=pawns')).toEqual({ guardCaptures: 'pawns' });
    expect(parseRule('guardStep=2')).toEqual({ guardStep: 2 });
    expect(DEFAULT_RULES.guardDoubleFirst).toBe('off');
    expect(parseRule('guardDoubleFirst=leap')).toEqual({ guardDoubleFirst: 'leap' });
    expect(() => parseRule('archerShots=lasers')).toThrow(/bad archerShots/);
    expect(() => parseRule('guardStep=3')).toThrow(/bad guardStep/);
    expect(parseRule('promotionSet=standard')).toEqual({ promotionSet: 'standard' });
    expect(parseRule('archerShots=forward3')).toEqual({ archerShots: 'forward3' });
    expect(parseRule('archerMove=fwdBack')).toEqual({ archerMove: 'fwdBack' });
    expect(parseRule('beastCapture=diagForward')).toEqual({ beastCapture: 'diagForward' });
    expect(parseRule('guardCaptureLimit=1')).toEqual({ guardCaptureLimit: 1 });
    expect(parseRule('paladinKamikaze=nonPawn')).toEqual({ paladinKamikaze: 'nonPawn' });
    expect(parseRule('maesterStep=2')).toEqual({ maesterStep: 2 });
    expect(parseRule('paladinReturn')).toEqual({ paladinReturn: true });
    expect(() => parseRule('paladinKamikaze=sometimes')).toThrow(/bad paladinKamikaze/);
    expect(() => parseRule('maesterStep=3')).toThrow(/bad maesterStep/);
    expect(() => parseRule('guardCaptureLimit=2')).toThrow(/bad guardCaptureLimit/);
    expect(() => parseRule('nosuchrule=false')).toThrow(/unknown rule/);
    expect(() => parseRule('beastChains=maybe')).toThrow(/true or false/);
    expect(() => parseRule('promotionSet=everything')).toThrow(/bad promotionSet/);
    setRules({ beastChains: false });
    expect(ruleDiff()).toEqual({ beastChains: false });
  });

  it('archerChecks=false: the archer neither checks nor shoots a king', () => {
    const black = '8/8/8/4k3/4P3/4A3/8/K7 b - - 0 1', white = '8/8/8/4k3/4P3/4A3/8/K7 w - - 0 1';
    expect(inCheck(fromFen(black))).toBe(true);
    expect(movesFrom(fromFen(white), 'e3').some(m => m.captures.includes(parseSq('e5')))).toBe(true);
    setRules({ archerChecks: false });
    expect(inCheck(fromFen(black))).toBe(false);
    expect(movesFrom(fromFen(white), 'e3').some(m => m.captures.includes(parseSq('e5')))).toBe(false);
  });

  it('beastChains=false: a beast captures once per turn', () => {
    const pos = fromFen('7k/8/5p2/3pp3/2nS4/8/8/K7 w - - 0 1');
    expect(movesFrom(pos, 'd4').some(m => m.captures.length > 1)).toBe(true);
    setRules({ beastChains: false });
    expect(lan(pos, movesFrom(pos, 'd4').filter(m => m.captures.length))).toEqual(['Sd4xc4', 'Sd4xe5']);
  });

  it('guardImmune=false: any piece may capture a guard', () => {
    const pos = fromFen('3r4/8/8/4k3/3G4/8/8/K7 b - - 0 1');
    expect(lan(pos, legalMoves(pos).filter(m => m.captures.includes(parseSq('d4'))))).toEqual(['Ke5xd4']);
    setRules({ guardImmune: false });
    expect(lan(pos, legalMoves(pos).filter(m => m.captures.includes(parseSq('d4'))))).toEqual(['Ke5xd4', 'Rd8xd4']);
  });

  it('guardCaptures=any: the guard becomes a commoner and gives check', () => {
    const pos = fromFen('7k/8/8/8/3n4/3G4/8/K7 w - - 0 1'), chk = '8/8/8/8/8/3k4/3G4/K7 b - - 0 1';
    expect(movesFrom(pos, 'd3').some(m => m.captures.length)).toBe(false); // the default wall takes nothing
    expect(inCheck(fromFen(chk))).toBe(false);
    setRules({ guardCaptures: 'any' });
    expect(movesFrom(pos, 'd3').some(m => m.captures.includes(parseSq('d4')))).toBe(true);
    expect(inCheck(fromFen(chk))).toBe(true);
  });

  it('maesterLongSwap=false: the maester and the king no longer trade places across the rank', () => {
    const pos = fromFen('7k/8/8/8/8/8/pN6/M3K3 w - - 0 1');
    expect(lan(pos, movesFrom(pos, 'a1'))).toContain('Ma1<>e1');
    setRules({ maesterLongSwap: false });
    expect(lan(pos, movesFrom(pos, 'a1'))).toEqual(['Ma1-b1', 'Ma1<>b2', 'Ma1xa2']);
  });

  it('paladinKamikaze=never: the paladin survives its own capture', () => {
    const pos = fromFen('7k/8/r7/8/p7/2g5/P7/L6K w - - 0 1');
    setRules({ paladinKamikaze: 'never' });
    const cap = movesFrom(pos, 'a1').find(m => m.captures.length)!;
    expect(cap.selfRemove).toBeUndefined();
    expect(typeOf(at(makeMove(pos, cap), 'a4'))).toBe(L);
    crossCheckAttacks(120);
  });

  it('paladinKamikaze=nonPawn: it survives a pawn and dies on anything else', () => {
    const pos = fromFen('7k/8/8/8/p7/8/8/L2n3K w - - 0 1'); // a pawn on a4, a knight on d1
    const dies = (to: string) => movesFrom(pos, 'a1').find(m => m.captures.includes(parseSq(to)))!.selfRemove === true;
    setRules({ paladinKamikaze: 'always' }); // the 2017 rule
    expect([dies('a4'), dies('d1')]).toEqual([true, true]);
    setRules({ paladinKamikaze: 'nonPawn' }); // shipped since 2026-09-14
    expect([dies('a4'), dies('d1')]).toEqual([false, true]);
    const after = makeMove(pos, movesFrom(pos, 'a1').find(m => m.captures.includes(parseSq('a4')))!);
    expect(typeOf(at(after, 'a4'))).toBe(L);
    crossCheckAttacks(121);
  });

  it('paladinChecks=true: the paladin may take a king, so it checks, mates and is mating material', () => {
    const chk = '4k3/8/8/8/8/8/8/4L2K b - - 0 1';
    expect(inCheck(fromFen(chk))).toBe(false);
    expect(insufficientMaterial(fromFen('7k/8/8/8/8/8/8/KL6 w - - 0 1').board)).toBe(true);
    setRules({ paladinChecks: true });
    expect(inCheck(fromFen(chk))).toBe(true);
    expect(insufficientMaterial(fromFen('7k/8/8/8/8/8/8/KL6 w - - 0 1').board)).toBe(false);
    // It jumps friends, so a pawn in front of the king does not screen it.
    expect(inCheck(fromFen('4k3/4p3/8/8/8/8/8/4L2K b - - 0 1'))).toBe(false); // an *enemy* pawn blocks
    expect(inCheck(fromFen('4k3/8/8/8/8/8/4P3/4L2K b - - 0 1'))).toBe(true);  // its own pawn does not
    crossCheckAttacks(122);
  });

  it('paladinReturn=true: the charge — it comes home instead of dying, and the victim is gone', () => {
    const pos = fromFen('7k/8/r7/8/p7/2g5/P7/L6K w - - 0 1');
    expect(lan(pos, movesFrom(pos, 'a1'))).toContain('La1xa4');
    setRules({ paladinReturn: true });
    const cap = movesFrom(pos, 'a1').find(m => m.captures.length)!;
    expect([lan(pos, [cap])[0], cap.selfRemove, cap.to === cap.from]).toEqual(['La1*a4', undefined, true]);
    const after = makeMove(pos, cap);
    expect([typeOf(at(after, 'a1')), at(after, 'a4')]).toEqual([L, 0]);
    crossCheckAttacks(123);
  });

  it('maesterSwapAny=true: it trades places with any friendly piece, the king excepted', () => {
    const pos = fromFen('7k/8/8/8/8/5R2/pN6/M3K3 w - - 0 1');
    expect(lan(pos, movesFrom(pos, 'a1'))).toEqual(['Ma1-b1', 'Ma1<>b2', 'Ma1<>e1', 'Ma1xa2']);
    setRules({ maesterSwapAny: true });
    expect(lan(pos, movesFrom(pos, 'a1'))).toEqual(['Ma1-b1', 'Ma1<>b2', 'Ma1<>e1', 'Ma1<>f3', 'Ma1xa2']);
    const far = makeMove(pos, movesFrom(pos, 'a1').find(m => m.to === parseSq('f3'))!);
    expect([typeOf(at(far, 'f3')), typeOf(at(far, 'a1'))]).toEqual([M, R]);
    // The king is reached only through maesterLongSwap, so turning that off leaves it behind.
    setRules({ maesterSwapAny: true, maesterLongSwap: false });
    expect(lan(pos, movesFrom(pos, 'a1'))).not.toContain('Ma1<>e1');
    crossCheckAttacks(124);
  });

  it('maesterSwapEnemy=true: it trades places with an adjacent enemy, but never with a king', () => {
    const pos = fromFen('7K/8/8/8/8/8/pk6/M7 w - - 0 1'); // black pawn a2, black king b2
    expect(lan(pos, movesFrom(pos, 'a1'))).toEqual(['Ma1-b1', 'Ma1xa2', 'Ma1xb2']);
    setRules({ maesterSwapEnemy: true });
    expect(lan(pos, movesFrom(pos, 'a1'))).toEqual(['Ma1-b1', 'Ma1<>a2', 'Ma1xa2', 'Ma1xb2']);
    const swapped = makeMove(pos, movesFrom(pos, 'a1').find(m => m.swap)!);
    expect([typeOf(at(swapped, 'a2')), typeOf(at(swapped, 'a1'))]).toEqual([M, P]);
    expect(colorOf(at(swapped, 'a1'))).toBe(BLACK); // the enemy pawn is still the enemy's
    crossCheckAttacks(125);
  });

  it('maesterStep=2: it gains the second square of each ray, move-only', () => {
    const pos = fromFen('7k/8/8/8/3M4/8/8/K7 w - - 0 1');
    expect(movesFrom(pos, 'd4')).toHaveLength(8);
    setRules({ maesterStep: 2 });
    const two = movesFrom(pos, 'd4');
    expect(two).toHaveLength(16);
    expect(lan(pos, two)).toContain('Md4-d6');
    expect(two.every(m => m.captures.length === 0)).toBe(true);
    // A capture stays adjacent, so the attack set does not move.
    const blocked = fromFen('7k/8/8/3p4/3M4/8/8/K7 w - - 0 1');
    expect(lan(blocked, movesFrom(blocked, 'd4'))).not.toContain('Md4-d6');
    expect(isAttacked(blocked.board, parseSq('d6'), WHITE)).toBe(false);
    crossCheckAttacks(126);
  });

  it('maesterKingSwapAnywhere=true: the long swap stops asking for the first rank', () => {
    const pos = fromFen('7k/8/8/8/8/8/M7/4K3 w - - 0 1'); // the maester has left rank 1
    expect(lan(pos, movesFrom(pos, 'a2'))).not.toContain('Ma2<>e1');
    setRules({ maesterKingSwapAnywhere: true });
    expect(lan(pos, movesFrom(pos, 'a2'))).toContain('Ma2<>e1');
    const after = makeMove(pos, movesFrom(pos, 'a2').find(m => m.to === parseSq('e1'))!);
    expect([typeOf(at(after, 'e1')), typeOf(at(after, 'a1'))]).toEqual([M, 0]);
    expect(typeOf(at(after, 'a2'))).toBe(K);
    // Still not a duplicate of the adjacent swap the 8 neighbours already make.
    const near = fromFen('7k/8/8/8/8/8/M7/1K6 w - - 0 1');
    expect(lan(near, movesFrom(near, 'a2')).filter(x => x === 'Ma2<>b1')).toHaveLength(1);
    crossCheckAttacks(127);
  });

  it('paladinJumpsFriends=false: a friendly piece stops the ray, and screens the king it would check', () => {
    const pos = fromFen('7k/8/8/8/8/8/P7/L6K w - - 0 1'); // its own pawn on a2, directly in the way
    expect(lan(pos, movesFrom(pos, 'a1'))).toContain('La1-a3');
    setRules({ paladinJumpsFriends: false });
    expect(lan(pos, movesFrom(pos, 'a1')).filter(x => x.startsWith('La1-a'))).toEqual([]);
    // Both flags off at once: it jumps enemies but not friends, which isAttacked tracks separately.
    setRules({ paladinJumpsFriends: false, paladinBlockedByEnemies: false, paladinChecks: true });
    expect(inCheck(fromFen('4k3/8/8/8/4p3/8/8/4L2K b - - 0 1'))).toBe(true);  // an enemy pawn is jumped
    expect(inCheck(fromFen('4k3/8/8/8/8/8/4P3/4L2K b - - 0 1'))).toBe(false); // its own pawn is not
    crossCheckAttacks(129);
    setRules({ paladinJumpsFriends: false, paladinChecks: true });
    crossCheckAttacks(130);
  });

  it('promotionSet=anyNonKingNoGuard: every non-king piece but the guard', () => {
    const pos = fromFen('8/P6k/8/8/8/8/8/K7 w - - 0 1');
    setRules({ promotionSet: 'anyNonKingNoGuard' });
    expect(lan(pos, movesFrom(pos, 'a7')))
      .toEqual(['a7-a8=A', 'a7-a8=B', 'a7-a8=L', 'a7-a8=M', 'a7-a8=N', 'a7-a8=Q', 'a7-a8=R', 'a7-a8=S']);
    expect(movesFrom(pos, 'a7').some(m => m.promo === G)).toBe(false);
    setRules({ promotionSet: 'anyNonKing' });
    expect(movesFrom(pos, 'a7').some(m => m.promo === G)).toBe(true);
    expect(parseRule('promotionSet=anyNonKingNoGuard')).toEqual({ promotionSet: 'anyNonKingNoGuard' });
  });

  it('secondPlayerDoubleFirstTurn=true: Black moves twice to open, and that first move may not check', () => {
    const start = () => startPosition(CLASSIC_CHESS);
    const turns = (): number[] => {
      let pos = start();
      const seen: number[] = [];
      for (let i = 0; i < 5; i++) { seen.push(pos.turn); pos = makeMove(pos, legalMoves(pos)[0]); }
      return seen;
    };
    expect(turns()).toEqual([WHITE, BLACK, WHITE, BLACK, WHITE]);
    setRules({ secondPlayerDoubleFirstTurn: true });
    expect(turns()).toEqual([WHITE, BLACK, BLACK, WHITE, BLACK]);
    // The no-check constraint: a black queen that could check on its first move may not.
    const check = fromFen('3qk3/8/8/8/8/8/8/3K4 b - - 0 1'); // ply 1, Black to move, Qd8xd1+ style checks
    const checks = (pos: Position) => legalMoves(pos).filter(m => inCheck(makeMove(pos, m), WHITE));
    setRules();
    expect(checks(check).length).toBeGreaterThan(0);
    setRules({ secondPlayerDoubleFirstTurn: true });
    expect(checks(check)).toEqual([]);                       // …none of them survive the filter
    expect(legalMoves(check).length).toBeGreaterThan(0);      // …but the queen still has moves
    // The constraint is the first move only: after it, Black's second move may check as usual.
    const second = makeMove(check, legalMoves(check)[0]);
    expect([second.turn, second.ply]).toEqual([BLACK, 2]);
    expect(checks(second).length).toBeGreaterThan(0);
  });

  it('guardNoSecondRank=true: a guard may not finish a move on its own second rank, swaps included', () => {
    const pos = fromFen('7k/8/8/8/8/3G4/8/K7 w - - 0 1'); // a white guard on d3; d2 is its second rank
    expect(lan(pos, movesFrom(pos, 'd3'))).toContain('Gd3-d2');
    setRules({ guardNoSecondRank: true });
    const ms = lan(pos, movesFrom(pos, 'd3'));
    expect(ms.filter(x => x.endsWith('2'))).toEqual([]);   // c2, d2, e2 all gone
    expect(ms).toContain('Gd3-d4');                        // forward is untouched
    // A maester swap may not drop a guard there either: the friend lands on the maester's square.
    const swap = fromFen('7k/8/8/8/8/8/3M4/3G4 w - - 0 1'); // maester d2, guard d1 -> the swap would put G on d2
    setRules();
    expect(lan(swap, movesFrom(swap, 'd2'))).toContain('Md2<>d1');
    setRules({ guardNoSecondRank: true });
    expect(lan(swap, movesFrom(swap, 'd2'))).not.toContain('Md2<>d1');
    setRules({ guardNoSecondRank: true, maesterSwapAny: true });
    expect(lan(swap, movesFrom(swap, 'd2'))).not.toContain('Md2<>d1');
    // With the lab's capturing guard on, a square it may not reach is a square it does not attack.
    const cap = fromFen('7k/8/8/8/8/3G4/3p4/K7 w - - 0 1');
    setRules({ guardCaptures: 'pawns' });
    expect(isAttacked(cap.board, parseSq('d2'), WHITE)).toBe(true);
    setRules({ guardCaptures: 'pawns', guardNoSecondRank: true });
    expect(isAttacked(cap.board, parseSq('d2'), WHITE)).toBe(false);
    crossCheckAttacks(131);
    setRules({ guardCaptures: 'any', guardStep: 2, guardNoSecondRank: true });
    crossCheckAttacks(132);
  });

  it('guardNoCapital=true: a guard may not enter the capital, d4 e4 d5 e5', () => {
    const pos = fromFen('7k/8/8/8/8/3G4/8/K7 w - - 0 1'); // a white guard on d3, beside the capital
    expect(lan(pos, movesFrom(pos, 'd3')))
      .toEqual(['Gd3-c2', 'Gd3-c3', 'Gd3-c4', 'Gd3-d2', 'Gd3-d4', 'Gd3-e2', 'Gd3-e3', 'Gd3-e4']);
    setRules({ guardNoCapital: true });
    expect(lan(pos, movesFrom(pos, 'd3')))
      .toEqual(['Gd3-c2', 'Gd3-c3', 'Gd3-c4', 'Gd3-d2', 'Gd3-e2', 'Gd3-e3']); // d4 and e4 gone, the rest untouched
    // The ban is on landing, not on standing: a guard already inside the capital still moves out.
    const inside = fromFen('7k/8/8/8/3G4/8/8/K7 w - - 0 1');
    expect(lan(inside, movesFrom(inside, 'd4'))).toContain('Gd4-d3');
    expect(lan(inside, movesFrom(inside, 'd4'))).not.toContain('Gd4-d5');
    // With the lab's capturing guard on, a square it may not enter is a square it does not attack.
    setRules({ guardCaptures: 'any', guardNoCapital: true });
    crossCheckAttacks(133);
  });

  it('the pool holds one guard per army', () => {
    expect(POOL).toBe('QLRRBBNNAAGMMSS');
    expect(POOL.split('G')).toHaveLength(2);
    expect(POOL).toHaveLength(15);
  });

  it('isAttacked still agrees with genPiece("attacks") under every paladin and maester buff at once', () => {
    setRules({
      paladinKamikaze: 'nonPawn', paladinChecks: true, paladinReturn: true, paladinBlockedByEnemies: false,
      paladinJumpsFriends: false,
      maesterSwapAny: true, maesterSwapEnemy: true, maesterStep: 2, maesterKingSwapAnywhere: true,
    });
    crossCheckAttacks(128);
  });

  it('paladinBlockedByEnemies=false: the paladin jumps enemies too, and checks through them', () => {
    const pos = fromFen('7k/8/r7/8/p7/2g5/P7/L6K w - - 0 1');
    expect(lan(pos, movesFrom(pos, 'a1'))).not.toContain('La1xa6');
    setRules({ paladinBlockedByEnemies: false });
    expect(lan(pos, movesFrom(pos, 'a1'))).toContain('La1xa6');
    // It still cannot take a king, so it still cannot check, blocked or not.
    expect(inCheck(fromFen('4k3/8/8/8/4p3/8/8/4L2K b - - 0 1'))).toBe(false);
  });

  it('bishopsOppositeColours=false: same-colour bishop pairs appear', () => {
    const draw = (n: number) => {
      let seed = 11;
      const rng = () => ((seed = (seed * 48271) % 2147483647) / 2147483647);
      return Array.from({ length: n }, () => randomBackRank(rng));
    };
    const sameColour = (rows: string[]) => rows.filter(r => {
      const b = [...r].flatMap((p, i) => (p === 'B' ? [i] : []));
      return b.length === 2 && (b[0] + b[1]) % 2 === 0;
    }).length;
    expect(sameColour(draw(200))).toBe(0);
    setRules({ bishopsOppositeColours: false });
    expect(sameColour(draw(200))).toBeGreaterThan(0);
  });

  it('promotionSet=standard: no fairy promotions', () => {
    const pos = fromFen('8/P6k/8/8/8/8/8/K7 w - - 0 1');
    expect(movesFrom(pos, 'a7')).toHaveLength(8); // the default bars the guard
    setRules({ promotionSet: 'standard' });
    expect(lan(pos, movesFrom(pos, 'a7'))).toEqual(['a7-a8=B', 'a7-a8=N', 'a7-a8=Q', 'a7-a8=R']);
    setRules({ promotionSet: 'anyNonKingNoFairy' });
    expect(movesFrom(pos, 'a7')).toHaveLength(4);
  });

  it('fiftyMove=false and insufficientMaterial=false: the game keeps going', () => {
    const fifty = '7k/8/8/8/8/8/P7/K7 w - - 100 60', bare = '7k/8/8/8/8/8/8/KG6 w - - 0 1';
    expect(status(fromFen(fifty))).toBe('draw50');
    expect(status(fromFen(bare))).toBe('drawMaterial');
    setRules({ fiftyMove: false, insufficientMaterial: false });
    expect(status(fromFen(fifty))).toBe('playing');
    expect(status(fromFen(bare))).toBe('playing');
  });

  // ---------------------------------------------------------------------------------------------
  // Buff candidates for the three pieces that measured far below a knight (research §18).

  it('archerMove=ortho (2017): the archer loses the diagonal step, and still never captures by displacement', () => {
    const pos = fromFen('7k/8/8/2p5/2Pp4/2A5/8/K7 w - - 0 1');
    expect(lan(pos, movesFrom(pos, 'c3')))
      .toEqual(['Ac3*c5', 'Ac3*d4', 'Ac3-b2', 'Ac3-b3', 'Ac3-b4', 'Ac3-c2', 'Ac3-d2', 'Ac3-d3']);
    setRules({ archerMove: 'ortho' });
    expect(lan(pos, movesFrom(pos, 'c3'))).toEqual(['Ac3*c5', 'Ac3*d4', 'Ac3-b3', 'Ac3-c2', 'Ac3-d3']);
    crossCheckAttacks(101);
  });

  it('archerShots: plusDiag2 adds the diagonal-2 squares, ring2 the whole Chebyshev-2 ring', () => {
    const pos = fromFen('7k/8/8/4p3/4p3/2A5/8/K7 w - - 0 1'); // e5 is (+2,+2), e4 is (+2,+1)
    const shots = () => lan(pos, movesFrom(pos, 'c3')).filter(s => s.includes('*'));
    setRules({ archerShots: 'classic' }); // the shipped default widened on 2026-09-17; this test is about the others
    expect(shots()).toEqual([]);
    setRules({ archerShots: 'plusDiag2' });
    expect(shots()).toEqual(['Ac3*e5']);
    crossCheckAttacks(102);
    setRules({ archerShots: 'ring2' });
    expect(shots()).toEqual(['Ac3*e4', 'Ac3*e5']);
    expect(inCheck(fromFen('8/8/8/4k3/8/2A5/8/K7 b - - 0 1'))).toBe(true); // shoots a king at (+2,+2)
    crossCheckAttacks(103);
  });

  it('archerShots: plusDiagFwd2 widens only the forward two-square diagonals, mirrored for Black', () => {
    setRules({ archerShots: 'plusDiagFwd2' });
    const w = fromFen('7k/8/8/p3p3/8/2A5/8/K3p3 w - - 0 1'); // a5 and e5 are forward for White; e1 is not
    expect(lan(w, movesFrom(w, 'c3')).filter(s => s.includes('*'))).toEqual(['Ac3*a5', 'Ac3*e5']);
    const b = fromFen('P6k/8/2a5/8/P3P3/8/8/K7 b - - 0 1'); // a4 and e4 are forward for Black; a8 is not
    expect(lan(b, movesFrom(b, 'c6')).filter(s => s.includes('*'))).toEqual(['Ac6*a4', 'Ac6*e4']);
    crossCheckAttacks(104);
  });

  it('guardCaptures=pawns (lab): it clears pawns only, gives no check either way and still cannot mate', () => {
    const pos = fromFen('7k/8/8/8/3pn3/3G4/8/K7 w - - 0 1');
    expect(movesFrom(pos, 'd3').some(m => m.captures.length)).toBe(false); // the shipped wall
    setRules({ guardCaptures: 'pawns' });
    expect(lan(pos, movesFrom(pos, 'd3').filter(m => m.captures.length))).toEqual(['Gd3xd4']); // …not the knight
    expect(inCheck(fromFen('8/8/8/8/8/3k4/3G4/K7 b - - 0 1'))).toBe(false);
    expect(insufficientMaterial(fromFen('7k/8/8/8/8/8/8/KG6 w - - 0 1').board)).toBe(true);
    crossCheckAttacks(104);
  });

  it('guardStep=2 (lab): the guard gains the second square of each ray', () => {
    const pos = fromFen('7k/8/8/3p4/3G4/3P4/8/K7 w - - 0 1');
    const ms = movesFrom(pos, 'd4');
    expect(ms).toHaveLength(6); // the 8 neighbours less the two pawns; neither is a target
    expect(lan(pos, ms)).not.toContain('Gd4-b2');
    setRules({ guardStep: 2 });
    const two = movesFrom(pos, 'd4');
    expect(two).toHaveLength(12); // 6 steps + the second square of the 6 unblocked rays
    expect(lan(pos, two)).toContain('Gd4-b2');
    expect(lan(pos, two)).not.toContain('Gd4-d6'); // the enemy pawn on d5 blocks the ray
    crossCheckAttacks(105);
  });

  it('beastMove=forward (2017): the beast may only step straight ahead', () => {
    const pos = fromFen('7k/8/8/3p4/3S4/8/8/K7 w - - 0 1'); // the pawn ahead is the blind spot
    const ms = movesFrom(pos, 'd4');
    expect(ms).toHaveLength(7);
    expect(ms.every(m => m.captures.length === 0)).toBe(true);
    crossCheckAttacks(106);
    setRules({ beastMove: 'forward' });
    expect(movesFrom(pos, 'd4')).toHaveLength(0);
  });

  it('beastCaptureForward=true: the blind spot goes, so the beast takes and checks straight ahead', () => {
    const pos = fromFen('7k/8/8/3p4/3S4/8/8/K7 w - - 0 1');
    const kingAhead = '8/8/8/3k4/3S4/8/8/K7 b - - 0 1';
    expect(movesFrom(pos, 'd4').some(m => m.captures.length)).toBe(false);
    expect(inCheck(fromFen(kingAhead))).toBe(false);
    setRules({ beastCaptureForward: true });
    expect(lan(pos, movesFrom(pos, 'd4').filter(m => m.captures.length))).toEqual(['Sd4xd5']);
    expect(inCheck(fromFen(kingAhead))).toBe(true);
    crossCheckAttacks(107);
  });


  // -------------------------------------------------------------------------------------------
  // A guard on a budget (research: the pawn harvester of the buffed set). Lab-only since §6.9:
  // under the defaults `guardCaptures: 'none'` means no guard move ever carries a capture, so no
  // guard can become spent and the SPENT bit never appears in a shipped game.

  it('guardCaptureLimit=1 (lab): one capture per guard for its whole life, and its twin keeps its own', () => {
    // The promoted-guard clause below needs a promotion set that still offers one (§6.13 bars it by default).
    setRules({ guardCaptures: 'pawns', guardCaptureLimit: 1, promotionSet: 'anyNonKing' });
    const pos = fromFen('7k/8/8/8/2pppp2/3G2G1/8/K7 w - - 0 1');
    expect(lan(pos, movesFrom(pos, 'd3').filter(m => m.captures.length))).toEqual(['Gd3xc4', 'Gd3xd4', 'Gd3xe4']);
    expect(isAttacked(pos.board, parseSq('d4'), WHITE)).toBe(true);

    const after = makeMove(pos, movesFrom(pos, 'd3').find(m => m.captures.includes(parseSq('d4')))!);
    expect(at(after, 'd4') & SPENT).toBe(SPENT);          // the flag rides in the piece byte
    expect(typeOf(at(after, 'd4'))).toBe(G);              // …and typeOf masks it off
    expect(toFen(after).split(' ')[0]).toContain('H');    // …and a FEN round-trip keeps it
    expect(at(fromFen(toFen(after)), 'd4')).toBe(at(after, 'd4'));
    const spent = { ...after, turn: WHITE } as Position; // let the same side move again
    expect(movesFrom(spent, 'd4').some(m => m.captures.length)).toBe(false);
    expect(isAttacked(spent.board, parseSq('e4'), WHITE)).toBe(false); // the spent guard stops attacking
    expect(isAttacked(spent.board, parseSq('f4'), WHITE)).toBe(true);  // …its twin on g3 does not
    expect(movesFrom(spent, 'd4').length).toBeGreaterThan(0);         // it is still a wall that walks
    expect(lan(spent, movesFrom(spent, 'g3').filter(m => m.captures.length))).toEqual(['Gg3xf4']);

    // A promoted guard is a new guard: the flag is not inherited from anything.
    const promo = fromFen('7k/P7/8/3p4/8/8/8/K7 w - - 0 1');
    const toGuard = movesFrom(promo, 'a7').find(m => m.promo === G)!;
    expect(makeMove(promo, toGuard).board[parseSq('a8')] & SPENT).toBe(0);

    crossCheckAttacks(108); // spent and unspent guards on the same board: isAttacked must follow both
    setRules({ guardCaptures: 'pawns', guardCaptureLimit: 0 });
    expect(movesFrom(spent, 'd4').some(m => m.captures.length)).toBe(true); // the cap off: it eats again
    setRules(); // the shipped wall: the spent flag on the board is inert, because nothing may capture
    expect(movesFrom(spent, 'd4').some(m => m.captures.length)).toBe(false);
  });

  // -------------------------------------------------------------------------------------------
  // The designer's 2021 "Chess Expansion Concept" archer and beast (drive-remaining-folders.md §9).

  it('archerMove=fwdBack (2021): the archer steps 1 ahead or 1 back, and still never captures by displacement', () => {
    const pos = fromFen('7k/8/8/8/2p5/2A5/8/K7 w - - 0 1');
    setRules({ archerMove: 'fwdBack' });
    expect(lan(pos, movesFrom(pos, 'c3'))).toEqual(['Ac3-c2']); // c4 holds the pawn; steps never take
    crossCheckAttacks(109);
  });

  it('archerShots=forward3 (2021): the two forward diagonals and the square two ahead, per side', () => {
    const w = fromFen('k7/8/8/2p5/1p1p4/2A5/1p1p4/2p4K w - - 0 1');
    const shots = (pos: Position, from: string) => lan(pos, movesFrom(pos, from)).filter(x => x.includes('*'));
    expect(shots(w, 'c3')).toEqual(['Ac3*b2', 'Ac3*b4', 'Ac3*c1', 'Ac3*c5', 'Ac3*d2', 'Ac3*d4']);
    setRules({ archerShots: 'forward3' });
    expect(shots(w, 'c3')).toEqual(['Ac3*b4', 'Ac3*c5', 'Ac3*d4']);
    // "Forward" is the shooting side's own direction, so Black shoots the other way.
    const b = fromFen('7k/1P1P4/2a5/1P1P4/2P5/8/8/7K b - - 0 1');
    expect(shots(b, 'c6')).toEqual(['Ac6*b5', 'Ac6*c4', 'Ac6*d5']);
    expect(inCheck(fromFen('2K5/8/2a5/8/8/8/8/7k w - - 0 1'))).toBe(false); // c8 is 2 *behind* a black archer on c6
    expect(inCheck(fromFen('7k/8/2a5/8/2K5/8/8/8 w - - 0 1'))).toBe(true); // c4 is 2 ahead of it
    crossCheckAttacks(110);
  });

  it('beastMove=diagFwdBack (2021): the beast steps on the four diagonals', () => {
    const pos = fromFen('7k/8/8/8/3S4/8/8/K7 w - - 0 1');
    expect(movesFrom(pos, 'd4')).toHaveLength(8); // the default steps everywhere
    setRules({ beastMove: 'diagFwdBack' });
    expect(lan(pos, movesFrom(pos, 'd4'))).toEqual(['Sd4-c3', 'Sd4-c5', 'Sd4-e3', 'Sd4-e5']);
    crossCheckAttacks(111);
  });

  it('beastCapture=diagForward (2021): the two forward diagonals only, chains along the same two', () => {
    const pos = fromFen('7k/8/3p4/2p1p3/2pSp3/2p1p3/8/K7 w - - 0 1');
    expect(movesFrom(pos, 'd4').filter(m => m.captures.length).length).toBeGreaterThan(4);
    setRules({ beastCapture: 'diagForward' });
    expect(lan(pos, movesFrom(pos, 'd4')))
      .toEqual(['Sd4-d3', 'Sd4-d5', 'Sd4xc5', 'Sd4xc5xd6', 'Sd4xe5', 'Sd4xe5xd6']);
    expect(inCheck(fromFen('7k/8/8/2k5/3S4/8/8/K7 b - - 0 1'))).toBe(true); // forward diagonal
    expect(inCheck(fromFen('7k/8/8/8/3S4/2k5/8/K7 b - - 0 1'))).toBe(false); // the maul is gone
    crossCheckAttacks(112);
  });

  it('isAttacked still agrees with genPiece("attacks") under the whole 2021 concept set', () => {
    setRules(CONCEPT_2021);
    crossCheckAttacks(31);
  });

  it('isAttacked still agrees with genPiece("attacks") under flipped rules', () => {
    setRules({ guardCaptures: 'any', guardImmune: false, paladinBlockedByEnemies: false, archerChecks: false });
    crossCheckAttacks(13);
  });

  it('isAttacked still agrees with genPiece("attacks") under the whole buff set', () => {
    setRules(BUFFED);
    crossCheckAttacks(23);
  });
});

/**
 * The two lab pieces (2026-09-14). Neither is in `POOL`: a game holds one only through `--pool` or
 * an explicit back rank, so nothing below can change the shipped game. Report:
 * `docs/research/sim-new-pieces-2026-09-14.md`.
 */
describe('ogre (lab)', () => {
  afterEach(() => setRules());
  // White ogre c4. b4 and c5 are black pawns (take them or shove them), d4 is a white pawn whose
  // shove square e4 is occupied by a knight.
  const pos = fromFen('k7/8/8/2p5/1pOPn3/8/8/7K w - - 0 1');

  it('steps and captures like a king, and shoves a neighbour one square straight away', () => {
    expect(lan(pos, movesFrom(pos, 'c4'))).toEqual([
      'Oc4-b3', 'Oc4-b5', 'Oc4-c3', 'Oc4-d3', 'Oc4-d5', // the 5 empty neighbours
      'Oc4>b4-a4', 'Oc4>c5-c6',                         // shoves: an enemy either way
      'Oc4xb4', 'Oc4xc5',                               // and the same two as captures
    ]);
    // d4 is a friend and could be shoved, but e4 is occupied, so that shove is not generated.
    expect(lan(pos, movesFrom(pos, 'c4')).some(s => s.includes('d4'))).toBe(false);
  });

  it('repel (default) leaves the ogre where it stood; push follows the piece', () => {
    const shove = () => movesFrom(pos, 'c4').find(m => m.shove && m.shove.from === parseSq('c5'))!;
    const repel = makeMove(pos, shove());
    expect([typeOf(at(repel, 'c4')), at(repel, 'c5'), typeOf(at(repel, 'c6'))]).toEqual([O, 0, P]);
    setRules({ ogreMode: 'push' });
    expect(lan(pos, movesFrom(pos, 'c4'))).toContain('Oc4>c5-c6'); // the notation does not change
    const push = makeMove(pos, shove());
    expect([at(push, 'c4'), typeOf(at(push, 'c5')), typeOf(at(push, 'c6'))]).toEqual([0, O, P]);
  });

  it('shoves a guard — the one piece nothing else can move', () => {
    const g = fromFen('k7/8/8/8/2Og4/8/8/7K w - - 0 1');
    expect(lan(g, movesFrom(g, 'c4'))).toContain('Oc4>d4-e4');
    expect(lan(g, movesFrom(g, 'c4'))).not.toContain('Oc4xd4'); // immortal, as always
    expect(typeOf(at(makeMove(g, movesFrom(g, 'c4').find(m => m.shove)!), 'e4'))).toBe(G);
  });

  it('never shoves a king of either colour, though it may still capture one', () => {
    const k = fromFen('8/8/8/8/1KOk4/8/8/8 w - - 0 1');
    expect(lan(k, movesFrom(k, 'c4')))
      .toEqual(['Oc4-b3', 'Oc4-b5', 'Oc4-c3', 'Oc4-c5', 'Oc4-d3', 'Oc4-d5', 'Oc4xd4']);
  });

  it('refuses a target off the board or already occupied', () => {
    // Ogre b3: a4 would be shoved off the left edge, b4 onto the black pawn already on b5.
    const e = fromFen('k7/8/8/1p6/Pn6/1O6/8/7K w - - 0 1');
    expect(lan(e, movesFrom(e, 'b3')))
      .toEqual(['Ob3-a2', 'Ob3-a3', 'Ob3-b2', 'Ob3-c2', 'Ob3-c3', 'Ob3-c4', 'Ob3xb4']);
  });

  it('a shove obeys ordinary legality, and a shove that unmasks a check is legal', () => {
    // Shoving the e4 pawn aside would open the e-file onto White's own king: illegal.
    const pin = fromFen('4r2k/8/8/8/3OP3/8/8/4K3 w - - 0 1');
    expect(lan(pin, movesFrom(pin, 'd4'))).not.toContain('Od4>e4-f4');
    // The mirror: the same shove opens the file onto the *enemy* king, which is a discovered check.
    const disc = fromFen('4k3/8/8/3Op3/8/8/8/4R2K w - - 0 1');
    const m = movesFrom(disc, 'd5').find(x => x.shove)!;
    expect(toLan(disc, m)).toBe('Od5>e5-f5');
    expect(inCheck(makeMove(disc, m))).toBe(true);
  });

  it('an ogre attacks its 8 neighbours and nothing else; a shove creates no attack', () => {
    expect(inCheck(fromFen('8/8/8/3k4/3O4/8/8/7K b - - 0 1'))).toBe(true);
    expect(inCheck(fromFen('8/8/8/4k3/8/3O4/8/7K b - - 0 1'))).toBe(false);
    crossCheckAttacks(140);
    setRules({ ogreMode: 'push' });
    crossCheckAttacks(141);
  });
});

describe('catapult (lab)', () => {
  afterEach(() => setRules());
  // White catapult c1; black pawn c3 is the screen, black knight c5 the piece behind it.
  const pos = fromFen('7k/8/8/2n5/8/2p5/8/2C4K w - - 0 1');

  it('slides like a rook through empty squares and takes only by lobbing over an enemy screen', () => {
    expect(lan(pos, movesFrom(pos, 'c1'))).toEqual([
      'Cc1*c5',                                                   // the lob, fired from c1
      'Cc1-a1', 'Cc1-b1', 'Cc1-c2', 'Cc1-d1', 'Cc1-e1', 'Cc1-f1', 'Cc1-g1',
    ]);
    const after = makeMove(pos, movesFrom(pos, 'c1').find(m => m.captures.length)!);
    expect([typeOf(at(after, 'c1')), at(after, 'c5'), typeOf(at(after, 'c3'))]).toEqual([C, 0, P]);
  });

  it('land: the same shot, but it moves onto the square it cleared', () => {
    setRules({ catapultCapture: 'land' });
    expect(lan(pos, movesFrom(pos, 'c1'))).toContain('Cc1xc5');
    const after = makeMove(pos, movesFrom(pos, 'c1').find(m => m.captures.length)!);
    expect([at(after, 'c1'), typeOf(at(after, 'c5'))]).toEqual([0, C]);
  });

  it('a friendly screen is no shot, and a friend behind an enemy screen is no target', () => {
    const friendScreen = fromFen('7k/8/8/2n5/8/2P5/8/2C4K w - - 0 1');
    const friendBeyond = fromFen('7k/8/8/2N5/8/2p5/8/2C4K w - - 0 1');
    for (const p of [friendScreen, friendBeyond]) {
      expect(movesFrom(p, 'c1').filter(m => m.captures.length)).toEqual([]);
    }
  });

  it('the target may be any distance beyond the screen, and may never be a guard', () => {
    const far = fromFen('2n4k/8/8/8/8/8/2p5/2C4K w - - 0 1');
    expect(lan(far, movesFrom(far, 'c1'))).toContain('Cc1*c8');
    const guard = fromFen('7k/8/8/2g5/8/2p5/8/2C4K w - - 0 1');
    expect(movesFrom(guard, 'c1').filter(m => m.captures.length)).toEqual([]);
  });

  it('gives check through the screen, and the king may not stay on the lobbed line', () => {
    const chk = fromFen('8/8/8/2k5/8/2p5/8/2C4K b - - 0 1');
    expect(inCheck(chk)).toBe(true);
    // c4 and c6 are still behind the same screen; the pawn's only move keeps the line open too.
    expect(lan(chk, legalMoves(chk)))
      .toEqual(['Kc5-b4', 'Kc5-b5', 'Kc5-b6', 'Kc5-d4', 'Kc5-d5', 'Kc5-d6']);
  });

  it('isAttacked agrees with the generated lobs, in both capture modes', () => {
    crossCheckAttacks(142);
    setRules({ catapultCapture: 'land' });
    crossCheckAttacks(143);
  });
});

describe('ogre and catapult: notation, FEN and the pool', () => {
  afterEach(() => setRules());

  it('FEN round-trips both letters in both colours', () => {
    const fen = 'roc1k3/8/8/8/8/8/8/ROC1K3 w - - 0 1';
    expect(toFen(fromFen(fen))).toBe(fen);
    const board = fromFen(fen).board;
    expect([typeOf(board[parseSq('b8')]), typeOf(board[parseSq('c1')])]).toEqual([O, C]);
  });

  it('neither piece is in the shipped pool, and a pawn never promotes to one', () => {
    expect(POOL).not.toMatch(/[OC]/);
    const promo = fromFen('7k/P7/8/8/8/8/8/K7 w - - 0 1');
    expect(movesFrom(promo, 'a7').map(m => m.promo)).not.toContain(O);
    expect(movesFrom(promo, 'a7').map(m => m.promo)).not.toContain(C);
  });

  it('both pieces count as mating material', () => {
    expect(insufficientMaterial(fromFen('7k/8/8/8/8/8/8/KO6 w - - 0 1').board)).toBe(false);
    expect(insufficientMaterial(fromFen('7k/8/8/8/8/8/8/KC6 w - - 0 1').board)).toBe(false);
  });
});

// ---------------------------------------------------------------------------------------------
// Tier-1 kings' powers (docs/KINGS-POWERS-PLAN.md §1.7–§1.12, docs/TAKEOVER-PLAN.md §5).
// The choice is a rule, not a square, so every case starts with `setRules({ kings: … })`.

describe('kings powers: parsing and defaults', () => {
  afterEach(() => setRules());

  it('parses symmetric and asymmetric choices, and refuses tier 2', () => {
    expect(parseKings('spirit:mercy')).toEqual([{ king: 'Spirit', power: 'Mercy' }, { king: 'Spirit', power: 'Mercy' }]);
    expect(parseKings('spirit:mercy,mud:march')).toEqual([
      { king: 'Spirit', power: 'Mercy' }, { king: 'Mud', power: 'March' },
    ]);
    expect(parseKings('none')).toEqual([null, null]);
    expect(parseKing('-')).toBeNull();
    expect(() => parseKing('frost:freeze')).toThrow(/not built yet/);
    expect(() => parseKing('frost:nope')).toThrow(/no power/);
    expect(RULES.kings).toEqual([null, null]); // powers stay off by default
  });

  it('an explicit null pair plays exactly the default game', () => {
    setRules();
    const fens = ['7k/8/8/8/8/4P3/8/K7 w - - 0 1', 'r3k2r/8/8/8/8/8/8/R3K2R w - - 0 1', '4k3/8/3P4/3K4/8/8/8/8 w - - 0 1'];
    const before = fens.map(f => lan(fromFen(f), legalMoves(fromFen(f))));
    setRules({ kings: [null, null] });
    const after = fens.map(f => lan(fromFen(f), legalMoves(fromFen(f))));
    expect(after).toEqual(before);
  });
});

describe('Holy Light (Spirit A)', () => {
  afterEach(() => setRules());
  const spirit: Rules['kings'] = [{ king: 'Spirit', power: 'HolyLight' }, null];

  it('a pawn gives this king no check, and this king takes no pawn', () => {
    const fen = '7k/8/8/4p3/3K4/8/8/8 w - - 0 1'; // black pawn e5 attacks d4
    expect(inCheck(fromFen(fen))).toBe(true);
    expect(isAttacked(fromFen(fen).board, parseSq('d4'), BLACK)).toBe(true);
    setRules({ kings: spirit });
    const pos = fromFen(fen);
    expect(inCheck(pos)).toBe(false);
    expect(isAttacked(pos.board, parseSq('d4'), BLACK)).toBe(false);
    expect(lan(pos, movesFrom(pos, 'd4'))).not.toContain('Kd4xe5');
  });

  it('the king still takes a guard', () => {
    setRules({ kings: spirit });
    const pos = fromFen('7k/8/8/8/3Kg3/8/8/8 w - - 0 1');
    expect(lan(pos, movesFrom(pos, 'd4'))).toContain('Kd4xe4');
  });

  it('is asymmetric: only the protected side\u2019s king is shielded', () => {
    const fen = '8/8/8/3k4/2P5/8/8/K7 b - - 0 1'; // white pawn c4 attacks the black king d5
    setRules({ kings: [{ king: 'Spirit', power: 'HolyLight' }, null] });
    expect(genAt(fromFen(fen), 'c4')).toContain('c4xd5');
    setRules({ kings: [null, { king: 'Spirit', power: 'HolyLight' }] });
    expect(genAt(fromFen(fen), 'c4')).not.toContain('c4xd5');
  });

  it('agrees with the generated attacks', () => { crossCheckAttacks(201); });
});

describe('Mercy (Spirit B)', () => {
  afterEach(() => setRules());
  const mercy: Rules['kings'] = [{ king: 'Spirit', power: 'Mercy' }, null];

  it('steps 1 or 2, jumps friends, is stopped by enemies and captures nothing but a guard', () => {
    setRules({ kings: mercy });
    const open = fromFen('k7/8/8/3P4/3K4/8/8/8 w - - 0 1'); // black king a8, out of reach
    expect(lan(open, movesFrom(open, 'd4'))).toContain('Kd4-d6'); // over its own pawn
    expect(lan(open, movesFrom(open, 'd4'))).not.toContain('Kd4xd5'); // a friend is jumped, never taken
    const blocked = fromFen('k7/8/8/3p4/3K4/8/8/8 w - - 0 1'); // ENEMY pawn d5 stops the north ray
    expect(lan(blocked, movesFrom(blocked, 'd4'))).not.toContain('Kd4-d6');
    expect(lan(blocked, movesFrom(blocked, 'd4'))).not.toContain('Kd4xd5');
    expect(lan(blocked, movesFrom(blocked, 'd4'))).toContain('Kd4-f6'); // the diagonal e5 is empty
    const guard = fromFen('k7/8/8/8/3Kg3/8/8/8 w - - 0 1');
    expect(lan(guard, movesFrom(guard, 'd4'))).toContain('Kd4xe4'); // decision 15: a guard is not impossible
  });

  it('attacks only an adjacent guard; the two-square reach adds no attacked square', () => {
    setRules({ kings: mercy });
    const guard = fromFen('k7/8/8/8/3Kg3/8/8/8 w - - 0 1').board;
    expect(isAttacked(guard, parseSq('e4'), WHITE)).toBe(true);
    const pawn = fromFen('k7/8/8/8/3Kp3/8/8/8 w - - 0 1').board;
    expect(isAttacked(pawn, parseSq('e4'), WHITE)).toBe(false);
    // The two-square squares are move-only. (An EMPTY adjacent square still counts as attacked, so
    // the two kings may never stand next to each other — plan §1.10 open question (c), answered
    // "no" by the engine; the report lists it as a designer choice.)
    const reach = fromFen('k7/8/8/8/3K4/8/8/8 w - - 0 1').board;
    expect(isAttacked(reach, parseSq('b6'), WHITE)).toBe(false);
  });

  it('agrees with the generated attacks', () => { crossCheckAttacks(202); });
});

describe('Death Touch (Shadow A)', () => {
  afterEach(() => setRules());
  const touch: Rules['kings'] = [{ king: 'Shadow', power: 'DeathTouch' }, null];

  it('shoots without moving and gives up the displacement capture', () => {
    setRules({ kings: touch });
    const pos = fromFen('7k/8/8/3r4/3K4/8/8/8 w - - 0 1');
    const moves = lan(pos, movesFrom(pos, 'd4'));
    expect(moves).toContain('Kd4*d5'); // to === from
    expect(moves).not.toContain('Kd4xd5');
  });

  it('eats a defended piece, which the ordinary king may not', () => {
    const fen = '7k/8/4p3/3r4/3K4/8/8/8 w - - 0 1'; // pawn e6 defends the rook d5
    const plain = fromFen(fen);
    expect(lan(plain, movesFrom(plain, 'd4'))).not.toContain('Kd4xd5');
    setRules({ kings: touch });
    const dt = fromFen(fen);
    expect(lan(dt, movesFrom(dt, 'd4'))).toContain('Kd4*d5');
  });

  it('agrees with the generated attacks', () => { crossCheckAttacks(203); });
});

describe('Darkness (Shadow B)', () => {
  afterEach(() => setRules());
  const dark: Rules['kings'] = [{ king: 'Shadow', power: 'Darkness' }, null];

  it('swaps the pawn\u2019s verbs and drops the double step', () => {
    setRules({ kings: dark });
    const out = fromFen('7k/8/8/8/3P4/8/8/K7 w - - 0 1');
    const moves = lan(out, movesFrom(out, 'd4'));
    expect(moves).toEqual(['d4-c5', 'd4-e5'].sort());
    const home = fromFen('7k/8/8/8/8/8/3P4/K7 w - - 0 1');
    expect(lan(home, movesFrom(home, 'd2'))).not.toContain('d2-d4');
    expect(lan(home, movesFrom(home, 'd2'))).toContain('d2-e3');
  });

  it('captures straight ahead, promotion included', () => {
    setRules({ kings: dark });
    const cap = fromFen('7k/8/8/3p4/3P4/8/8/K7 w - - 0 1');
    expect(lan(cap, movesFrom(cap, 'd4'))).toContain('d4xd5');
    const promo = fromFen('1r5k/1P6/8/8/8/8/8/K7 w - - 0 1');
    expect(movesFrom(promo, 'b7').some(m => m.captures.length === 1 && m.promo)).toBe(true);
  });

  it('agrees with the generated attacks', () => { crossCheckAttacks(204); });
});

describe('March (Mud A)', () => {
  afterEach(() => setRules());
  const march: Rules['kings'] = [{ king: 'Mud', power: 'March' }, null];

  it('steps two from any rank, both squares empty, promotion included', () => {
    setRules({ kings: march });
    const mid = fromFen('7k/8/8/8/8/4P3/8/K7 w - - 0 1');
    expect(lan(mid, movesFrom(mid, 'e3'))).toContain('e3-e5');
    const blocked = fromFen('7k/8/8/8/4p3/4P3/8/K7 w - - 0 1');
    expect(lan(blocked, movesFrom(blocked, 'e3'))).not.toContain('e3-e5');
    expect(lan(blocked, movesFrom(blocked, 'e3'))).not.toContain('e3xe4');
    const rankSix = fromFen('7k/8/P7/8/8/8/8/K7 w - - 0 1');
    expect(movesFrom(rankSix, 'a6').some(m => m.to === parseSq('a8') && m.promo)).toBe(true);
  });
});

describe('Leap (Mud B)', () => {
  afterEach(() => setRules());
  const leap: Rules['kings'] = [{ king: 'Mud', power: 'Leap' }, null];

  it('slides over its own pawns, and only those', () => {
    const fen = '7k/8/8/p7/8/8/P7/R6K w - - 0 1'; // own pawn a2, enemy pawn a5
    const plain = fromFen(fen);
    expect(lan(plain, movesFrom(plain, 'a1'))).not.toContain('Ra1-a3'); // the own pawn a2 blocks
    setRules({ kings: leap });
    const leaping = fromFen(fen);
    const moves = lan(leaping, movesFrom(leaping, 'a1'));
    expect(moves).toContain('Ra1-a3');
    expect(moves).toContain('Ra1-a4');
    expect(moves).toContain('Ra1xa5'); // the enemy beyond the jumped pawn is the first blocker again
  });

  it('is asymmetric and changes the attack set, unlike the other powers', () => {
    const fen = 'r7/p7/k7/8/8/8/7P/1K5R w - - 0 1';
    setRules({ kings: [leap[0], null] });
    const pos = fromFen(fen);
    expect(lan(pos, movesFrom(pos, 'h1'))).toContain('Rh1-h3');
    expect(lan(pos, movesFrom(pos, 'a8'))).toEqual([]); // Black has no power: its own pawn still blocks
    expect(isAttacked(pos.board, parseSq('h3'), WHITE)).toBe(true);
    expect(isAttacked(pos.board, parseSq('a3'), BLACK)).toBe(false);
  });

  it('agrees with the generated attacks', () => { crossCheckAttacks(205); });
});

describe('kings powers: lifecycle', () => {
  afterEach(() => setRules());

  it('undo restores a Death Touch shot exactly', () => {
    setRules({ kings: [{ king: 'Shadow', power: 'DeathTouch' }, null] });
    const g = new Game();
    g.load(fromFen('7k/8/8/3r4/3K4/8/8/8 w - - 0 1'));
    const before = toFen(g.pos);
    const shot = g.legal.find(m => toLan(g.pos, m) === 'Kd4*d5')!;
    expect(shot).toBeTruthy();
    g.play(shot);
    expect(at(g.pos, 'd5')).toBe(0);
    expect(at(g.pos, 'd4')).not.toBe(0);
    expect(g.undo()).toBe(true);
    expect(toFen(g.pos)).toBe(before);
  });

  it('search plays the shot a plain king cannot play (the worker runs the same search)', () => {
    const fen = '7k/8/4p3/3r4/3K4/8/8/8 w - - 0 1'; // rook d5 defended by pawn e6
    setRules({ kings: [{ king: 'Shadow', power: 'DeathTouch' }, null] });
    resetSearchState();
    const dt = search(fromFen(fen), { maxDepth: 4 });
    expect(dt.move && toLan(fromFen(fen), dt.move)).toBe('Kd4*d5');
    setRules();
    resetSearchState();
    const plain = fromFen(fen);
    expect(legalMoves(plain).some(m => m.captures.includes(parseSq('d5')))).toBe(false);
  }, 30_000);
});


// ---------------------------------------------------------------------------------------------
// The Reaver (V, lab piece; docs/PIECES-PROPOSED.md #5): a knight that may step one square in any
// direction onto an empty square as part of the same move after a capture.

describe('reaver (V, lab)', () => {
  afterEach(() => setRules());

  it('moves and captures like a knight', () => {
    const pos = fromFen('7k/8/8/8/3V4/8/8/K7 w - - 0 1');
    expect(lan(pos, movesFrom(pos, 'd4'))).toEqual(
      ['Vd4-b3', 'Vd4-b5', 'Vd4-c2', 'Vd4-c6', 'Vd4-e2', 'Vd4-e6', 'Vd4-f3', 'Vd4-f5'].sort());
  });

  it('after a capture it may step one square onto an empty square, or stay', () => {
    setRules({ reaverStep: 'any' }); // the full reading: all 8 directions
    const pos = fromFen('7k/8/4p3/8/3V4/8/8/K7 w - - 0 1'); // black pawn e6
    const moves = movesFrom(pos, 'd4');
    const lans = lan(pos, moves);
    expect(lans).toContain('Vd4xe6');            // the plain capture
    expect(lans).toContain('Vd4xe6-d5');         // capture, then step away diagonally
    expect(lans).toContain('Vd4xe6-f6');
    const steps = moves.filter(m => m.captures.includes(parseSq('e6')) && m.to !== parseSq('e6'));
    expect(steps.length).toBeGreaterThan(0);
    for (const m of steps) expect(m.captures).toEqual([parseSq('e6')]); // the step never captures
  });

  it('the shipped lab default is orthogonal-only (the measured reading)', () => {
    expect(RULES.reaverStep).toBe('ortho');
    const pos = fromFen('7k/8/4p3/8/3V4/8/8/K7 w - - 0 1'); // black pawn e6
    const lans = lan(pos, movesFrom(pos, 'd4'));
    expect(lans).toContain('Vd4xe6-d6');  // orthogonal steps stay
    expect(lans).toContain('Vd4xe6-f6');
    expect(lans).not.toContain('Vd4xe6-d5'); // diagonals are gone
    expect(lans).not.toContain('Vd4xe6-f7');
  });

  it('the step never lands on an occupied square', () => {
    const pos = fromFen('7k/8/4p3/3p4/3V4/8/8/K7 w - - 0 1'); // e6 victim, d5 occupied
    const lans = lan(pos, movesFrom(pos, 'd4'));
    expect(lans).toContain('Vd4xe6');
    expect(lans).not.toContain('Vd4xe6-d5');
    for (const l of lans) expect(l).not.toMatch(/x.*x/); // one capture at most, ever
  });

  it('LAN round-trips the capture-and-step notation', () => {
    const pos = fromFen('7k/8/4p3/8/3V4/8/8/K7 w - - 0 1');
    for (const m of movesFrom(pos, 'd4')) {
      const notation = toLan(pos, m);
      const back = parseLan(pos.board, notation);
      expect(toLan(pos, back), notation).toBe(notation);
      expect(back.to).toBe(m.to);
      expect(back.captures).toEqual(m.captures);
    }
  });

  it('attacks like a knight, and agrees with its own generated captures', () => {
    const pos = fromFen('7k/8/4p3/8/3V4/8/8/K7 w - - 0 1');
    expect(isAttacked(pos.board, parseSq('e6'), WHITE)).toBe(true);
    expect(isAttacked(pos.board, parseSq('d5'), WHITE)).toBe(false); // the step is move-only
    crossCheckAttacks(206);
  });

  it('round-trips in FEN, is outside the pool and promotion list, and a lone reaver is a material draw', () => {
    const fen = '7k/8/8/8/3v4/8/8/K7 w - - 0 1';
    expect(toFen(fromFen(fen))).toBe(fen);
    expect(typeOf(fromFen(fen).board[parseSq('d4')])).toBe(V);
    expect(POOL).not.toMatch(/V/);
    const promo = fromFen('7k/P7/8/8/8/8/8/K7 w - - 0 1');
    expect(movesFrom(promo, 'a7').map(m => m.promo)).not.toContain(V);
    expect(insufficientMaterial(fromFen('7k/8/8/8/8/8/8/KV6 w - - 0 1').board)).toBe(true);
  });
});

// ---------------------------------------------------------------------------------------------
// The Templar (T, lab piece; docs/PIECES-PROPOSED.md #4): a king-step anywhere, a queen on a
// capital square (d4 e4 d5 e5).

describe('templar (T, lab)', () => {
  afterEach(() => setRules());

  it('steps like a king off the capital and slides like a queen on it', () => {
    const off = fromFen('k7/8/8/8/2T5/8/8/K7 w - - 0 1'); // c4: not a capital
    expect(lan(off, movesFrom(off, 'c4'))).toEqual(
      ['Tc4-b3', 'Tc4-b4', 'Tc4-b5', 'Tc4-c3', 'Tc4-c5', 'Tc4-d3', 'Tc4-d4', 'Tc4-d5'].sort());
    const on = fromFen('k7/8/8/8/3T4/8/8/K7 w - - 0 1'); // d4: capital
    const moves = lan(on, movesFrom(on, 'd4'));
    for (const l of ['Td4-d8', 'Td4-h4', 'Td4-a4', 'Td4-d1', 'Td4-h8', 'Td4-a7']) expect(moves, l).toContain(l);
    expect(moves.length).toBeGreaterThan(20);
  });

  it('attacks like a queen only from a capital', () => {
    const off = fromFen('k7/8/1p6/8/2T5/8/8/K7 w - - 0 1'); // T c4, pawn b6 two diagonal steps away
    expect(isAttacked(off.board, parseSq('b6'), WHITE)).toBe(false);
    expect(isAttacked(off.board, parseSq('b5'), WHITE)).toBe(true); // adjacent is still an attack
    const on = fromFen('k7/8/1p6/8/3T4/8/8/K7 w - - 0 1'); // same pawn, T on the d4 capital
    expect(isAttacked(on.board, parseSq('b6'), WHITE)).toBe(true);
    crossCheckAttacks(207);
  });

  it('round-trips in FEN, is outside the pool and promotion list, and counts as mating material', () => {
    const fen = 'k7/8/8/8/3t4/8/8/K7 w - - 0 1';
    expect(toFen(fromFen(fen))).toBe(fen);
    expect(typeOf(fromFen(fen).board[parseSq('d4')])).toBe(T);
    expect(POOL).not.toMatch(/T/);
    const promo = fromFen('7k/P7/8/8/8/8/8/K7 w - - 0 1');
    expect(movesFrom(promo, 'a7').map(m => m.promo)).not.toContain(T);
    expect(insufficientMaterial(fromFen('k7/8/8/8/8/8/8/KT6 w - - 0 1').board)).toBe(false);
  });
});

describe('Death Touch second reading (lab toggle)', () => {
  afterEach(() => setRules());
  const touch: Rules['kings'] = [{ king: 'Shadow', power: 'DeathTouch' }, null];
  const pos = () => fromFen('7k/8/4p3/3r4/3K4/8/8/8 w - - 0 1'); // rook d5 defended by pawn e6

  it('off (delivered): the shot replaces the displacement capture', () => {
    setRules({ kings: touch });
    const moves = lan(pos(), movesFrom(pos(), 'd4'));
    expect(moves).toContain('Kd4*d5');
    expect(moves).not.toContain('Kd4xd5');
  });

  it('on: the displacement capture is generated as well (the defended case stays a shot)', () => {
    setRules({ kings: touch, deathTouchMoves: true });
    // Generation: both move shapes exist for the defended rook...
    expect(genAt(pos(), 'd4')).toContain('Kd4*d5');
    expect(genAt(pos(), 'd4')).toContain('Kd4xd5');
    // ...but legality keeps only the shot: moving onto d5 walks into the pawn's attack.
    const legal = lan(pos(), movesFrom(pos(), 'd4'));
    expect(legal).toContain('Kd4*d5');
    expect(legal).not.toContain('Kd4xd5');
    // An undefended enemy is taken either way, and both shapes are legal there.
    const loose = fromFen('7k/8/8/3r4/3K4/8/8/8 w - - 0 1');
    setRules({ kings: touch, deathTouchMoves: true });
    const both = lan(loose, movesFrom(loose, 'd4'));
    expect(both).toContain('Kd4*d5');
    expect(both).toContain('Kd4xd5');
  });
});

describe('king power: Strike (Flame A, tier 2)', () => {
  const flame = { kings: [{ king: 'Flame', power: 'Strike' }, { king: 'Flame', power: 'Strike' }] as const };
  afterEach(() => setRules({ kings: [null, null] }));
  const strikes = (pos: Position) => legalMoves(pos).filter(m => m.strike);

  it('is accepted by parseKing only now that it is built', () => {
    expect(parseKing('flame:strike')).toEqual({ king: 'Flame', power: 'Strike' });
    expect(() => parseKing('frost:freeze')).toThrow(/not built/);
  });

  it('gives each own non-king piece a queen-like action, once', () => {
    setRules(flame);
    const pos = fromFen('4k3/8/8/8/7p/8/3P4/4K3 w - - 0 1');
    const d2 = strikes(pos).filter(m => m.from === parseSq('d2'));
    expect(lan(pos, d2)).toContain('d2-d8!');
    expect(d2.every(m => m.from !== parseSq('e1'))).toBe(true);
    expect(strikes(pos).some(m => m.from === parseSq('e1'))).toBe(false); // the king never strikes

    const after = makeMove(pos, d2.find(m => toLan(pos, m) === 'd2-d8!')!);
    expect(after.strike).toEqual([true, false]);
    expect(strikes(after).length).toBeGreaterThan(0);  // Black's is still live
    expect(strikes(makeMove(after, legalMoves(after)[0]))).toHaveLength(0); // White's is spent
  });

  it('never takes a king and never promotes', () => {
    setRules(flame);
    const rook = fromFen('4k3/8/8/8/8/8/8/4R1K1 w - - 0 1');
    expect(strikes(rook).some(m => m.to === parseSq('e8'))).toBe(false);
    const pawn = fromFen('6k1/P7/8/8/8/8/8/4K3 w - - 0 1');
    const s = strikes(pawn).find(m => m.from === parseSq('a7') && m.to === parseSq('a8'));
    expect(s).toBeDefined();
    expect(typeOf(at(makeMove(pawn, s!), 'a8'))).toBe(P);
  });

  it('can block a check, and its use survives FEN and the LAN parser', () => {
    setRules(flame);
    const pos = fromFen('4r3/8/8/8/8/8/P7/4K3 w - - 0 1');
    const block = legalMoves(pos).find(m => m.strike && toLan(pos, m) === 'a2-e2!');
    expect(block).toBeDefined();
    const after = makeMove(pos, block!);
    expect(after.strike).toEqual([true, false]);
    expect(inCheck(after, WHITE)).toBe(false);
    const round = fromFen(toFen(after));
    expect(round.strike).toEqual([true, false]);
    expect(toFen(after).split(' ')).toHaveLength(7);
    expect(parseLan(after.board, 'a2-e2!').strike).toBe(true);
  });
});

describe('Strike, capture reading (strikeMode=capture)', () => {
  const flame = { kings: [{ king: 'Flame', power: 'Strike' }, { king: 'Flame', power: 'Strike' }] as const };
  afterEach(() => setRules({ kings: [null, null], strikeMode: 'move' }));

  it('takes a queen-reach victim without moving, once', () => {
    setRules({ ...flame, strikeMode: 'capture' });
    const pos = fromFen('4k3/8/8/8/8/2r5/8/R3K3 w - - 0 1'); // black rook c3, white rook a1: a1-c3 is empty
    const shot = legalMoves(pos).find(m => m.strike && m.from === parseSq('a1') && m.to === parseSq('a1'));
    expect(shot).toBeDefined();
    expect(shot!.captures).toEqual([parseSq('c3')]);
    expect(toLan(pos, shot!)).toBe('Ra1*c3!');
    const after = makeMove(pos, shot!);
    expect(at(after, 'a1')).toBe(piece(R, WHITE));   // never moved
    expect(at(after, 'c3')).toBe(0);                 // victim gone
    expect(after.strike).toEqual([true, false]);
    expect(fromFen(toFen(after)).strike).toEqual([true, false]);
    // A blocked line is not a target: a white pawn on b2 hides everything behind it.
    const blocked = fromFen('4k3/8/8/8/8/2r5/1P6/R3K3 w - - 0 1');
    expect(legalMoves(blocked).some(m => m.strike && m.from === parseSq('a1') && m.captures.includes(parseSq('c3')))).toBe(false);
  });
});
