/**
 * What holds the quantised engine net to the float net the trainer fitted.
 *
 * The two share `featureIndex` — that is the reason the trainer is TypeScript — so the only thing
 * left that can differ is the rounding, and this measures it in centipawns on 1,000 positions.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { A, B, Color, G, K, L, M, N, P, PieceType, Q, R, S, SPENT, WHITE, colorOf, makeMove, piece, status, typeOf } from '../../rules/engine';
import { fromFen, shuffle, toLan } from '../../rules/setup';
import { mulberry32 } from '../../sim/rng';
import { Net, REC, TrainOpts, VAL_BIT, features, forward, quantise, trainNet } from '../../sim/gen';
import { MATE, resetSearchState, search } from '../search';
import { evalBoard, evaluateBoard, setEvaluator } from '../eval';
import { HIDDEN, INPUTS, N_WEIGHTS, RESIDUAL_MAX, SCALE, loadNet, nnueEval, packNet } from './net';
import { NET_B64 } from './weights';

const TYPES: PieceType[] = [P, N, B, R, Q, A, L, G, M, S];

function randomBoard(rng: () => number): { board: Uint8Array; turn: Color } {
  const board = new Uint8Array(64);
  const free = shuffle([...Array(64).keys()], rng);
  let i = 0;
  board[free[i++]] = piece(K, WHITE);
  board[free[i++]] = piece(K, 1);
  const n = 2 + Math.floor(rng() * 26);
  for (let j = 0; j < n; j++) {
    const t = TYPES[Math.floor(rng() * TYPES.length)];
    board[free[i++]] = piece(t, rng() < 0.5 ? WHITE : 1) | (t === G && rng() < 0.3 ? SPENT : 0);
  }
  return { board, turn: (rng() < 0.5 ? 0 : 1) as Color };
}

/** The float net's own answer, in centipawns. */
function floatCp(net: Net, board: Uint8Array, turn: Color): number {
  const mine = new Int32Array(64), theirs = new Int32Array(64);
  const acc = new Float32Array(2 * HIDDEN), h = new Float32Array(2 * HIDDEN);
  const cnt = features(board, 0, turn, mine, theirs);
  return forward(net, mine, theirs, cnt, acc, h) * SCALE;
}

/** Worst and mean |quantised - float| over 1,000 random boards. */
function quantisationError(net: Net): { max: number; mean: number } {
  loadNet(packNet(quantise(net)));
  const rng = mulberry32(20260913);
  let max = 0, sum = 0;
  for (let i = 0; i < 1000; i++) {
    const { board, turn } = randomBoard(rng);
    const d = Math.abs(nnueEval(board, turn) - floatCp(net, board, turn));
    if (d > max) max = d;
    sum += d;
  }
  return { max, mean: sum / 1000 };
}

describe('the nnue net', () => {
  it('matches the trainer forward pass within 1 cp on 1000 positions (random weights)', () => {
    const rng = mulberry32(7);
    const net: Net = {
      w1: Float32Array.from({ length: INPUTS * HIDDEN }, () => (rng() * 2 - 1) * 0.2),
      b1: Float32Array.from({ length: HIDDEN }, () => (rng() * 2 - 1) * 0.5),
      w2: Float32Array.from({ length: 2 * HIDDEN }, () => (rng() * 2 - 1) * 1.0),
      b2: 0.13,
    };
    const e = quantisationError(net);
    console.log(`[nnue] random net: max ${e.max.toFixed(3)} cp, mean ${e.mean.toFixed(3)} cp`);
    expect(e.max).toBeLessThanOrEqual(1);
    if (NET_B64) loadNet(NET_B64);
  });

  it('matches the trainer forward pass within 1 cp on 1000 positions (the shipped net)', () => {
    const file = 'sim/nnue/net.json';
    if (!existsSync(file) || !NET_B64) { console.log('[nnue] no trained net on disk; random-weight test covers the rounding'); return; }
    const j = JSON.parse(readFileSync(file, 'utf8')) as { w1: number[]; b1: number[]; w2: number[]; b2: number };
    const net: Net = { w1: Float32Array.from(j.w1), b1: Float32Array.from(j.b1), w2: Float32Array.from(j.w2), b2: j.b2 };
    const e = quantisationError(net);
    console.log(`[nnue] shipped net: max ${e.max.toFixed(3)} cp, mean ${e.mean.toFixed(3)} cp`);
    expect(e.max).toBeLessThanOrEqual(1);
    loadNet(NET_B64);
  });

  it('is exactly colour-symmetric, and deterministic', () => {
    if (!NET_B64) return;
    loadNet(NET_B64);
    const rng = mulberry32(99);
    for (let i = 0; i < 200; i++) {
      const { board, turn } = randomBoard(rng);
      const flipped = new Uint8Array(64);
      for (let s = 0; s < 64; s++) {
        const p = board[s];
        if (p) flipped[s ^ 56] = piece(typeOf(p), (colorOf(p) ^ 1) as Color) | (p & SPENT);
      }
      const a = nnueEval(board, turn);
      expect([i, nnueEval(flipped, (turn ^ 1) as Color)]).toEqual([i, a]);
      expect([i, nnueEval(board, turn)]).toEqual([i, a]); // same board, same answer, every time
    }
  });

  it('round-trips the weight blob', () => {
    const w = Int16Array.from({ length: N_WEIGHTS }, (_, i) => ((i * 2654435761) % 65535) - 32767);
    const b64 = packNet(w);
    expect(b64.length).toBe(Math.ceil((N_WEIGHTS * 2) / 3) * 4);
    loadNet(b64);
    const rng = mulberry32(3);
    const { board, turn } = randomBoard(rng);
    const before = nnueEval(board, turn);
    loadNet(b64);
    expect(nnueEval(board, turn)).toBe(before);
    if (NET_B64) loadNet(NET_B64);
  });
});

/**
 * The material + residual evaluator: `linear + clip(net, ±RESIDUAL_MAX)`.
 *
 * The net that shipped on 2026-09-13 predicts the whole evaluation, so these tests load a
 * deliberately hostile *residual* net instead — weights spread over the whole Int16 range, raw
 * output in the thousands of centipawns. Nothing but the clip then stands between it and the
 * material term, which is the one property the design exists for.
 */
describe('the residual evaluator', () => {
  const HOSTILE = Int16Array.from({ length: N_WEIGHTS }, (_, i) => ((i * 2654435761) % 65535) - 32767);
  const hostile = (): void => { loadNet(packNet(HOSTILE), 'residual'); setEvaluator('residual'); };

  afterEach(() => {
    setEvaluator('linear');
    if (NET_B64) loadNet(NET_B64, 'full');
  });

  it('never moves the linear evaluation by more than RESIDUAL_MAX, and clips when it must', () => {
    hostile();
    const rng = mulberry32(20260914);
    let clipped = 0;
    for (let i = 0; i < 200; i++) {
      const { board, turn } = randomBoard(rng);
      const d = evalBoard(board, turn) - evaluateBoard(board, turn);
      expect([i, Math.abs(d) <= RESIDUAL_MAX]).toEqual([i, true]);
      if (Math.abs(d) === RESIDUAL_MAX) clipped++;
    }
    // Without this the test would pass just as well on a net that returns zero.
    expect(clipped).toBeGreaterThan(0);
  });

  it('refuses the wrong kind of net rather than counting material twice', () => {
    if (!NET_B64) return;
    loadNet(NET_B64, 'full');
    expect(() => setEvaluator('residual')).toThrow(/residual net/);
    loadNet(packNet(HOSTILE), 'residual');
    expect(() => setEvaluator('nnue')).toThrow(/full net/);
  });

  it('is mirror-symmetric within a centipawn', () => {
    hostile();
    const rng = mulberry32(101);
    for (let i = 0; i < 200; i++) {
      const { board, turn } = randomBoard(rng);
      const flipped = new Uint8Array(64);
      for (let s = 0; s < 64; s++) {
        const p = board[s];
        if (p) flipped[s ^ 56] = piece(typeOf(p), (colorOf(p) ^ 1) as Color) | (p & SPENT);
      }
      // The net half is exact; the linear half blends the two king tables by a fractional phase
      // and rounds, which is the same 1 cp the evaluation's own mirror test allows.
      const d = Math.abs(evalBoard(flipped, (turn ^ 1) as Color) - evalBoard(board, turn));
      expect([i, d <= 1]).toEqual([i, true]);
    }
  });

  it('still takes a free rook: 2 x RESIDUAL_MAX cannot outweigh a piece', () => {
    hostile();
    const pos = fromFen('3r3k/8/8/8/8/8/3Q4/4K3 w - - 0 1');
    resetSearchState();
    const res = search(pos, { maxDepth: 4 });
    expect(toLan(pos, res.move!)).toBe('Qd2xd8');
  });

  it('still mates in one', () => {
    hostile();
    const pos = fromFen('7k/8/6K1/8/8/8/8/1Q6 w - - 0 1');
    resetSearchState();
    const res = search(pos, { maxDepth: 3 });
    expect(res.score).toBeGreaterThanOrEqual(MATE - 1);
    expect(status(makeMove(pos, res.move!))).toBe('checkmate');
  });
});

/**
 * The trainer's half of the same idea: `--loss res` adds the net's output to the position's linear
 * evaluation *before* the sigmoid, so the net fits only what the hand evaluation gets wrong.
 *
 * The check is a comparison, not a threshold. The corpus below is labelled `linear + 60 cp`
 * everywhere, so the residual trainer has a constant to find and the plain `wdl` trainer has the
 * whole evaluation to find from nothing. If the base ever stops reaching the target or the
 * gradient, the two become the same fit and the gap disappears.
 */
describe('training a residual net', () => {
  /** `n` quiet-looking positions whose search score is the linear evaluation plus 60 cp. */
  function corpus(n: number): Uint8Array {
    const rng = mulberry32(613);
    const buf = new Uint8Array(n * REC);
    for (let i = 0; i < n; i++) {
      let board: Uint8Array, turn: Color, base: number;
      // Inside the band where the sigmoid still has a gradient; past ±400 cp every label is 1 or 0.
      do { ({ board, turn } = randomBoard(rng)); base = evaluateBoard(board, turn); } while (Math.abs(base) > 250);
      const off = i * REC, cp = Math.round(base) + 60;
      buf.set(board, off);
      buf[off + 64] = turn;
      buf[off + 65] = 2 | (i % 5 === 0 ? VAL_BIT : 0); // a drawn game; every fifth position held out
      buf[off + 66] = cp & 0xff;
      buf[off + 67] = (cp >> 8) & 0xff;
    }
    return buf;
  }

  it('fits the gap to the linear evaluation, not the score', () => {
    const n = 400, buf = corpus(n);
    const opts: TrainOpts = { epochs: 6, batch: 8192, lr: 0.05, lambda: 0, seed: 5, loss: 'res' };
    const res = trainNet(buf, n, opts);
    const wdl = trainNet(buf, n, { ...opts, loss: 'wdl' });
    // Measured 0.0049 against 0.0134. Drop the base from both sides and the two are identical.
    expect(res.bestVal).toBeLessThan(wdl.bestVal / 2);
  });
});
