/**
 * Guard-strategy probe terms (docs/research/guard-strategies-2026-10-06.md, Part 1): weight 0 by
 * default must leave the shipped eval and its search output unchanged, and each pattern must fire
 * where it should.
 */
import { afterEach, beforeEach, expect, it } from 'vitest';
import { BLACK, WHITE, setRules } from '../rules/engine';
import { fromFen, toLan } from '../rules/setup';
import { GP, evalParams, evaluateBoard, guardPatterns, setEvalParams } from './eval';
import { resetSearchState, search } from './search';

beforeEach(() => { setRules(); setEvalParams(); resetSearchState(); });
afterEach(() => { setEvalParams(); resetSearchState(); });

/** [fen, static eval, depth-3 score, best move, nodes], recorded with the eval before the probe terms existed. */
const BASELINE: [string, number, number, string, number][] = [
  ['rgbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RGBQKBNR w - - 0 1', 0, 13, 'Ng1-f3', 1157],
  ['r1b1k2r/pp1g1ppp/2n2q2/3pp3/1b1P4/2NGPN2/PPQ2PPP/R3KB1R b - - 3 9', 19, 118, 'e5xd4', 5398],
  ['6k1/5pg1/4p1p1/3q4/2G5/1Q2B3/5PPP/6K1 w - - 0 30', 339, 347, 'Qb3-c2', 3719],
  ['4k3/1g6/8/3pP3/2G5/8/8/4K3 w - - 0 50', -2, 13, 'Ke1-e2', 909],
  ['r3k2r/ppp1gppp/2a5/3Q4/4G3/2N5/PPP2PPP/R3K1MR w - - 0 12', 1014, 1089, 'Qd5-e5', 5455],
  ['2r3k1/5Gpp/8/8/8/8/g4PPP/2R3K1 b - - 0 40', -96, 99999, 'Rc8xc1', 80],
];

it('the default eval and its depth-3 search are unchanged', () => {
  for (const params of [undefined, { ...evalParams(), guard: { e1: 0, e2: 0, e3: 0, e4: 0, e5: 0, e6: 0, e7: false } }]) {
    setEvalParams(params);
    for (const [fen, ev, score, move, nodes] of BASELINE) {
      const p = fromFen(fen);
      resetSearchState();
      const r = search(p, { maxDepth: 3 });
      expect([evaluateBoard(p.board, p.turn), r.score, r.move ? toLan(p, r.move) : null, r.nodes]).toEqual([ev, score, move, nodes]);
    }
  }
});

it('each pattern fires on its own position', () => {
  const bits = (fen: string, c = WHITE) => guardPatterns(fromFen(fen).board, c);
  expect(bits('7k/8/8/8/3QG3/8/8/K7 w - - 0 1') & GP.E1).toBeTruthy();                // escort
  expect(bits('3r3k/8/8/8/8/3G4/3Q4/K7 w - - 0 1') & GP.E2).toBeTruthy();             // front shield
  expect(bits('4r2k/8/8/8/8/8/4G3/4K3 w - - 0 1') & GP.E3).toBeTruthy();              // interpose king
  expect(bits('4r2k/8/8/8/4P3/8/4G3/4K3 w - - 0 1') & GP.E3).toBeFalsy();             // a pawn blocks first
  expect(bits('7k/8/8/3p4/3G4/8/8/K7 w - - 0 1') & GP.E4).toBeTruthy();               // blockade
  expect(bits('7k/8/8/3PG3/8/8/8/K7 w - - 0 1') & GP.E5).toBeTruthy();                // escort a passed pawn
  expect(bits('7k/8/2p5/3PG3/8/8/8/K7 w - - 0 1') & GP.E5).toBeFalsy();                // c6 pawn: d5 is not passed
  expect(bits('6k1/5G2/8/8/8/8/8/K7 w - - 0 1') & GP.E6).toBeTruthy();                // king net
  expect(bits('6k1/8/8/8/8/8/8/KG6 w - - 0 1')).toBe(0);                              // home rank, nothing
  expect(bits('k7/1g6/8/8/8/8/8/7K b - - 0 1', BLACK) & GP.E7).toBeFalsy();           // black's own second rank
  expect(bits('k7/8/1g6/8/8/8/8/7K b - - 0 1', BLACK) & GP.E7).toBeTruthy();
});

it('a weight changes the eval by that much, and the default restores it', () => {
  const p = fromFen('6k1/5G2/8/8/8/8/8/K7 w - - 0 1');
  const base = evaluateBoard(p.board, p.turn);
  setEvalParams({ ...evalParams(), guard: { e6: 80 } });
  expect(evaluateBoard(p.board, p.turn)).toBe(base + 80);
  setEvalParams({ ...evalParams(), guard: { e7: true } });
  expect(evalParams().pst.G.every(x => x === 0)).toBe(true);
  setEvalParams();
  expect(evaluateBoard(p.board, p.turn)).toBe(base);
  expect(evalParams().pst.G.some(x => x !== 0)).toBe(true);
});
