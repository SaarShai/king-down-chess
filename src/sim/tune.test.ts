/**
 * The tuner's evaluation is a second implementation of `src/ai/eval.ts`. These tests are what stop
 * the two from drifting: same numbers in, same centipawns out, on 1,000 positions.
 */
import { describe, expect, it } from 'vitest';
import {
  A, B, BLACK, Color, G, K, L, M, N, P, PieceType, Position, Q, R, S, SPENT, WHITE, piece,
} from '../rules/engine';
import { setRules } from '../rules/rules';
import { evalParams, evaluate, setEvalParams } from '../ai/eval';
import { fromFen, shuffle, toLan } from '../rules/setup';
import { legalMoves, makeMove } from '../rules/engine';
import { evalVector, fromVector, moverCp, parseLan, toVector } from './tune';
import { mulberry32 } from './rng';

const TYPES: PieceType[] = [P, N, B, R, Q, A, L, G, M, S];

/** A legal-looking board, not a legal position: the evaluation reads squares, not move history. */
function randomPosition(rng: () => number): Position {
  const board = new Uint8Array(64);
  const free = shuffle([...Array(64).keys()], rng);
  let i = 0;
  board[free[i++]] = piece(K, WHITE);
  board[free[i++]] = piece(K, BLACK);
  const n = 2 + Math.floor(rng() * 24);
  for (let j = 0; j < n; j++) {
    const t = TYPES[Math.floor(rng() * TYPES.length)];
    const c: Color = rng() < 0.5 ? WHITE : BLACK;
    board[free[i++]] = piece(t, c) | (t === G && rng() < 0.3 ? SPENT : 0);
  }
  return { board, turn: rng() < 0.5 ? WHITE : BLACK, halfmove: 0, ply: 0 };
}

describe('the evaluation', () => {
  it('scores 5000 random positions exactly like their colour-and-rank mirrors', () => {
    setRules();
    const rng = mulberry32(20261003);
    for (let i = 0; i < 5000; i++) {
      const pos = randomPosition(rng);
      const board = new Uint8Array(64);
      for (let s = 0; s < 64; s++) if (pos.board[s]) board[s ^ 56] = pos.board[s] ^ 16; // flip colour, keep flags
      const mirror: Position = { ...pos, board, turn: (pos.turn ^ 1) as Color };
      expect([i, evaluate(mirror)]).toEqual([i, evaluate(pos)]);
    }
  });
});

describe('the tuner evaluation', () => {
  it('matches evaluate() bit for bit on 1000 random positions with the live parameters', () => {
    setRules();
    const p = evalParams();
    const v = toVector(p);
    const rng = mulberry32(20260913);
    for (let i = 0; i < 1000; i++) {
      const pos = randomPosition(rng);
      const mine = moverCp(evalVector(pos.board, pos.turn, v, undefined, 1, true), pos.turn, p.tempo);
      expect([i, mine]).toEqual([i, evaluate(pos)]);
    }
  });

  it('round-trips the parameter vector through EvalParams', () => {
    const v = toVector(evalParams());
    expect([...toVector(fromVector(v))]).toEqual([...v]);
  });

  it('setEvalParams loads a vector and restores the shipped one', () => {
    const shipped = evalParams();
    const v = toVector(shipped);
    v[0] = 123; // pawn
    setEvalParams(fromVector(v));
    expect(evalParams().values.P).toBe(123);
    setEvalParams();
    expect(evalParams()).toEqual(shipped);
  });

  it('has a gradient that agrees with a finite difference', () => {
    const v = toVector(evalParams());
    const rng = mulberry32(7);
    // One value per group: material, two tables, mobility, beast cap, shield, maester, tempo, phase.
    const probes = [1, 4, 20, 200, 340, 394, 395, 398, 399, 400, 403, 404, 406, 407];
    let checked = 0;
    for (let n = 0; n < 25; n++) {
      const pos = randomPosition(rng);
      const g = new Float64Array(v.length);
      evalVector(pos.board, pos.turn, v, g);
      const f0 = evalVector(pos.board, pos.turn, v);
      for (const i of probes) {
        const h = i === 407 ? 1 : 0.01;
        const up = Float64Array.from(v), down = Float64Array.from(v);
        up[i] += h; down[i] -= h;
        // One-sided both ways: the beast's capped target bonus has a kink, and at the kink the
        // gradient is a subgradient — it has to sit between the two sides, not on a midpoint.
        const fwd = (evalVector(pos.board, pos.turn, up) - f0) / h;
        const back = (f0 - evalVector(pos.board, pos.turn, down)) / h;
        const tol = 1e-5 + Math.max(Math.abs(fwd), Math.abs(back)) * 1e-6;
        expect([i, g[i] >= Math.min(fwd, back) - tol && g[i] <= Math.max(fwd, back) + tol])
          .toEqual([i, true]);
        if (g[i] !== 0) checked++;
      }
    }
    expect(checked).toBeGreaterThan(100); // a test of all-zero gradients would prove nothing
  });
});

describe('the game replay', () => {
  it('parses every notation the recorder writes back into the same move', () => {
    setRules();
    const rng = mulberry32(99);
    let plies = 0;
    for (let game = 0; game < 12; game++) {
      let pos = fromFen('rsakgqlb/pppppppp/8/8/8/8/PPPPPPPP/RSAKGQLB w - - 0 1');
      for (let ply = 0; ply < 60; ply++) {
        const legal = legalMoves(pos);
        if (!legal.length) break;
        const m = legal[Math.floor(rng() * legal.length)];
        const lan = toLan(pos, m);
        expect([lan, toLan(pos, parseLan(pos.board, lan))]).toEqual([lan, lan]);
        pos = makeMove(pos, m);
        plies++;
      }
    }
    expect(plies).toBeGreaterThan(400);
  });
});

describe('the lab pieces round-trip through the notation too', () => {
  /**
   * `Oe4>f5-f6` is the one notation whose meaning depends on a rule: it prints where the *shoved*
   * piece went, and the ogre's own square follows from `ogreMode`, the way `selfRemove` follows
   * from `paladinKamikaze`. So every combination of the two toggles is replayed here.
   */
  it('parses ogre shoves and catapult lobs back into the same move, in all four variants', () => {
    const rng = mulberry32(77);
    let shoves = 0, lobs = 0;
    for (const ogreMode of ['repel', 'push'] as const) {
      for (const catapultCapture of ['stay', 'land'] as const) {
        setRules({ ogreMode, catapultCapture });
        for (let game = 0; game < 14; game++) {
          let pos = fromFen('rockqbns/pppppppp/8/8/8/8/PPPPPPPP/ROCKQBNS w - - 0 1');
          for (let ply = 0; ply < 70; ply++) {
            const legal = legalMoves(pos);
            if (!legal.length) break;
            const m = legal[Math.floor(rng() * legal.length)];
            const lan = toLan(pos, m);
            expect([lan, toLan(pos, parseLan(pos.board, lan))]).toEqual([lan, lan]);
            if (m.shove) shoves++;
            if (lan[0] === 'C' && m.captures.length) lobs++;
            pos = makeMove(pos, m);
          }
        }
      }
    }
    expect(shoves).toBeGreaterThan(20); // a round-trip test that never met a shove proves nothing
    expect(lobs).toBeGreaterThan(5);
    setRules();
  });
});
