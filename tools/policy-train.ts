#!/usr/bin/env -S npx tsx
/**
 * Train a move-ranking (policy) net on distilled search data (tools/policy-data.ts).
 *
 * Model: position summary (23) + per-move features (58) -> hidden 64 (ReLU) -> one score per legal
 * move; listwise softmax over the legal moves of each position, cross-entropy against the teacher's
 * move. It is deliberately small and cheap: the first gate is whether it can rank the teacher's move
 * highly at all, not whether it is strong.
 *
 *   tsx tools/policy-train.ts [--epochs 30] [--hidden 64] [--lr 0.01]
 *
 * Writes sim/nnue/policy-net.json (float weights + metrics + the data manifest hash) and
 * sim/nnue/policy-train.json (curve). No source file changes: integration is a separate, gated step.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { Color, Position, legalMoves, typeOf } from '../src/rules/engine';
import { featureIndex } from '../src/ai/nnue/net';
import type { Move } from '../src/rules/engine';

const flag = (name: string, dflt: string): string => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
};
const EPOCHS = Number(flag('epochs', '30'));
const HIDDEN = Number(flag('hidden', '16')); // small on purpose: 5k-100k samples, 1.4k features
const LR = Number(flag('lr', '0.01'));
const BATCH = Number(flag('batch', '64'));
const DATA = 'sim/nnue/policy.bin';
const META = 'sim/nnue/policy.json';
const OUT = 'sim/nnue/policy-net.json';
const REC = 70;

const P_FEATURES = 1408; // the NNUE layout: 2 relations x 11 types x 64 squares
const M_DIM = 58;

/** Active NNUE-layout features for a position, both perspectives (mirrors `net.ts`). */
const posIndices = (pos: Position, out: Int32Array): number => {
  let n = 0;
  for (let s = 0; s < 64; s++) {
    const p = pos.board[s];
    if (!p) continue;
    const t = typeOf(p), c = ((p >> 4) & 1) as Color;
    out[n++] = featureIndex(t, c, s, pos.turn);
    out[n++] = featureIndex(t, c, s, (pos.turn ^ 1) as Color);
  }
  return n;
};

const moveFeat = (pos: Position, m: Move, out: Float32Array): void => {
  out.fill(0);
  const t = typeOf(pos.board[m.from]) - 1;
  out[t] = 1;                                    // 0..10 piece type
  out[11 + (m.from & 7)] = 1; out[19 + (m.from >> 3)] = 1;   // from file/rank
  out[27 + (m.to & 7)] = 1; out[35 + (m.to >> 3)] = 1;       // to file/rank
  out[43] = m.captures.length ? 1 : 0;
  out[44] = Math.min(3, m.captures.length) / 3;
  if (m.promo) out[45 + m.promo - 1] = 1;        // 45..53 promotion targets
  out[54] = m.swap ? 1 : 0;
  out[55] = m.shove ? 1 : 0;
  out[56] = m.to === m.from ? 1 : 0;             // rifle shot / lob / death touch
  out[57] = m.selfRemove ? 1 : 0;
};

interface Sample { pos: Position; moves: Move[]; target: number }
const raw = readFileSync(DATA);
const n = Math.floor(raw.length / REC);
const samples: Sample[] = [];
let unfound = 0;
for (let i = 0; i < n; i++) {
  const off = i * REC;
  const board = new Uint8Array(raw.buffer, raw.byteOffset + off, 64);
  const pos: Position = { board, turn: raw[off + 64] as 0 | 1, halfmove: 0, ply: 0 };
  const from = raw[off + 65], to = raw[off + 66], promo = raw[off + 67];
  const moves = legalMoves(pos);
  const target = moves.findIndex(m => m.from === from && m.to === to && (m.promo ?? 0) === promo);
  if (target < 0) { unfound++; continue; }
  samples.push({ pos, moves, target });
}
console.log(`policy-train: ${samples.length}/${n} records usable (${unfound} teacher moves not legal now — data/timestamp mismatch), ${EPOCHS} epochs, hidden ${HIDDEN}`);

const isVal = (i: number): boolean => i % 5 === 0; // every fifth position held out
const train = samples.map((s, i) => ({ s, i })).filter(x => !isVal(x.i));
const val = samples.map((s, i) => ({ s, i })).filter(x => isVal(x.i));

// Weights.
const rng = (() => { let seed = 7; return (): number => ((seed = (Math.imul(seed, 48271) >>> 0) % 2147483647) / 2147483647); })();
const init = (n2: number, scale: number): Float32Array => Float32Array.from({ length: n2 }, () => (rng() * 2 - 1) * scale);
const W1p = init(HIDDEN * P_FEATURES, 0.1), W1m = init(HIDDEN * M_DIM, 0.1), b1 = new Float32Array(HIDDEN);
const W2 = init(HIDDEN, 0.1); let b2 = 0;
const mW1p = new Float32Array(W1p.length), vW1p = new Float32Array(W1p.length);
const mW1m = new Float32Array(W1m.length), vW1m = new Float32Array(W1m.length);
const mb1 = new Float32Array(HIDDEN), vb1 = new Float32Array(HIDDEN);
const mW2 = new Float32Array(HIDDEN), vW2 = new Float32Array(HIDDEN);
let mb2 = 0, vb2 = 0, step = 0;

const pIdx = new Int32Array(64), mF = new Float32Array(M_DIM);
const h = new Float32Array(HIDDEN), dh = new Float32Array(HIDDEN);
const scores = new Float32Array(256), probs = new Float32Array(256);

/** Forward one sample; returns the teacher's log-probability and fills `probs`/`scores`. */
const forward = (s: Sample): number => {
  const np = posIndices(s.pos, pIdx);
  const n2 = Math.min(s.moves.length, scores.length);
  for (let j = 0; j < n2; j++) {
    moveFeat(s.pos, s.moves[j], mF);
    for (let k = 0; k < HIDDEN; k++) {
      let a = b1[k];
      const base = k * P_FEATURES;
      for (let x = 0; x < np; x++) a += W1p[base + pIdx[x]];
      const mb = k * M_DIM;
      for (let x = 0; x < M_DIM; x++) if (mF[x]) a += W1m[mb + x] * mF[x];
      h[k] = a > 0 ? a : 0;
    }
    let sc = b2;
    for (let k = 0; k < HIDDEN; k++) sc += W2[k] * h[k];
    scores[j] = sc;
  }
  let max = -Infinity;
  for (let j = 0; j < n2; j++) max = Math.max(max, scores[j]);
  let sum = 0;
  for (let j = 0; j < n2; j++) { probs[j] = Math.exp(scores[j] - max); sum += probs[j]; }
  for (let j = 0; j < n2; j++) probs[j] /= sum;
  return Math.log(probs[s.target] + 1e-12);
};

const zero = (): void => { mW1p.fill(0); vW1p.fill(0); mW1m.fill(0); vW1m.fill(0); mb1.fill(0); vb1.fill(0); mW2.fill(0); vW2.fill(0); mb2 = 0; vb2 = 0; };
zero();

/** One minibatch of listwise cross-entropy: dL/dscore_j = (p_j - 1{j=target}) / batch. */
const trainBatch = (batch: Sample[]): number => {
  const gW1p = new Float32Array(W1p.length), gW1m = new Float32Array(W1m.length);
  const gb1 = new Float32Array(HIDDEN), gW2 = new Float32Array(HIDDEN); let gb2 = 0;
  let loss = 0;
  for (const s of batch) {
    const lp = forward(s);
    const np = posIndices(s.pos, pIdx); // forward() left pIdx filled; recompute for clarity
    loss += -lp;
    const scale = 1 / batch.length;
    for (let j = 0; j < s.moves.length; j++) {
      const d = probs[j] - (j === s.target ? 1 : 0);
      moveFeat(s.pos, s.moves[j], mF);
      // Recompute h for this move (forward() overwrote it with the last move's).
      for (let k = 0; k < HIDDEN; k++) {
        let a = b1[k];
        const base = k * P_FEATURES;
        for (let x = 0; x < np; x++) a += W1p[base + pIdx[x]];
        const mb = k * M_DIM;
        for (let x = 0; x < M_DIM; x++) if (mF[x]) a += W1m[mb + x] * mF[x];
        h[k] = a > 0 ? a : 0;
      }
      const d2 = d * scale;
      for (let k = 0; k < HIDDEN; k++) {
        gW2[k] += d2 * h[k];
        dh[k] = h[k] > 0 ? d2 * W2[k] : 0;
      }
      gb2 += d2;
      for (let k = 0; k < HIDDEN; k++) gb1[k] += dh[k];
      for (let k = 0; k < HIDDEN; k++) {
        const base = k * M_DIM;
        for (let x = 0; x < M_DIM; x++) if (mF[x]) gW1m[base + x] += dh[k] * mF[x];
      }
      for (let k = 0; k < HIDDEN; k++) {
        const base = k * P_FEATURES;
        for (let x = 0; x < np; x++) gW1p[base + pIdx[x]] += dh[k];
      }
    }
  }
  step++;
  const adam = (w: Float32Array, g: Float32Array, m: Float32Array, v: Float32Array, i: number): void => {
    m[i] = 0.9 * m[i] + 0.1 * g[i];
    v[i] = 0.999 * v[i] + 0.001 * g[i] * g[i];
    w[i] -= (LR * (m[i] / (1 - 0.9 ** step))) / (Math.sqrt(v[i] / (1 - 0.999 ** step)) + 1e-8);
  };
  for (let i = 0; i < W1p.length; i++) adam(W1p, gW1p, mW1p, vW1p, i);
  for (let i = 0; i < W1m.length; i++) adam(W1m, gW1m, mW1m, vW1m, i);
  for (let i = 0; i < HIDDEN; i++) { adam(b1, gb1, mb1, vb1, i); adam(W2, gW2, mW2, vW2, i); }
  mb2 = 0.9 * mb2 + 0.1 * gb2; vb2 = 0.999 * vb2 + 0.001 * gb2 * gb2;
  b2 -= (LR * (mb2 / (1 - 0.9 ** step))) / (Math.sqrt(vb2 / (1 - 0.999 ** step)) + 1e-8);
  return loss / batch.length;
};

const evaluate = (rows: { s: Sample }[]): { loss: number; top1: number; top3: number } => {
  let loss = 0, top1 = 0, top3 = 0;
  for (const { s } of rows) {
    loss += -forward(s);
    const n2 = s.moves.length;
    const order = Array.from({ length: n2 }, (_, j) => j).sort((a, b) => probs[b] - probs[a]);
    if (order[0] === s.target) top1++;
    if (order.slice(0, 3).includes(s.target)) top3++;
  }
  return { loss: loss / (rows.length || 1), top1: top1 / (rows.length || 1), top3: top3 / (rows.length || 1) };
};

const curve: { epoch: number; train: number; val: number; top1: number; top3: number }[] = [];
let bestVal = Infinity, bestEpoch = 0;
let bestW: { w1p: Float32Array; w1m: Float32Array; b1: Float32Array; w2: Float32Array; b2: number } | null = null;
const t0 = Date.now();
for (let epoch = 1; epoch <= EPOCHS; epoch++) {
  for (let i = train.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [train[i], train[j]] = [train[j], train[i]]; }
  let trainLoss = 0, batches = 0;
  for (let b = 0; b < train.length; b += BATCH) {
    trainLoss += trainBatch(train.slice(b, b + BATCH).map(x => x.s));
    batches++;
  }
  const v = evaluate(val);
  if (v.loss < bestVal) {
    bestVal = v.loss; bestEpoch = epoch;
    bestW = { w1p: Float32Array.from(W1p), w1m: Float32Array.from(W1m), b1: Float32Array.from(b1), w2: Float32Array.from(W2), b2 };
  }
  curve.push({ epoch, train: trainLoss / batches, val: v.loss, top1: v.top1, top3: v.top3 });
  console.log(`policy-train: epoch ${String(epoch).padStart(3)} train ${(trainLoss / batches).toFixed(3)} val ${v.loss.toFixed(3)} top1 ${(100 * v.top1).toFixed(1)}% top3 ${(100 * v.top3).toFixed(1)}%`);
}

const meta = JSON.parse(readFileSync(META, 'utf8')) as { sha256: string; positions: number; depth: number };
const best = bestW!;
const bestRow = curve.find(c => c.epoch === bestEpoch)!;
const bW1p = best.w1p, bW1m = best.w1m, bB1 = best.b1, bW2 = best.w2;
writeFileSync(OUT, JSON.stringify({
  note: 'Policy net (NNUE-layout position features 1408 + move features 58 -> hidden -> 1 per legal move). Trained on distilled search moves.',
  data: { file: DATA, sha256: meta.sha256, positions: meta.positions, teacherDepth: meta.depth },
  opts: { epochs: EPOCHS, hidden: HIDDEN, lr: LR, batch: BATCH },
  metrics: bestRow, bestEpoch, finalEpoch: curve.at(-1), curve,
  model: { pFeatures: P_FEATURES, mDim: M_DIM, hidden: HIDDEN, w1p: [...bW1p], w1m: [...bW1m], b1: [...bB1], w2: [...bW2], b2: best.b2 },
}, null, 1) + '\n');
writeFileSync('sim/nnue/policy-train.json', JSON.stringify({ data: meta, opts: { EPOCHS, HIDDEN, LR, BATCH }, bestEpoch, curve }, null, 2) + '\n');
console.log(`policy-train: wrote ${OUT} in ${((Date.now() - t0) / 1000).toFixed(0)}s; best epoch ${bestEpoch} val top1 ${(100 * bestRow.top1).toFixed(1)}% top3 ${(100 * bestRow.top3).toFixed(1)}%`);
