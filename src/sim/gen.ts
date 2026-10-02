/**
 * NNUE data and training: recorded games -> quiet labelled positions -> one small net.
 *
 *   sample  replay runs, keep quiet positions with their search score  -> sim/nnue/positions.bin
 *   train   fit `1408 -> 32x2 -> 1` on them, quantise, write the blob  -> src/ai/nnue/weights.ts
 *
 * `train --loss res` fits the **residual**: the net's output is added to the linear evaluation and
 * the pair is fitted to the search score, so material never passes through the net. That is the
 * cure `docs/research/ai-nnue-2026-09-13.md` §7.2 prescribes for the −129 Elo the first net lost,
 * and `docs/research/ai-residual-plan-2026-09-14.md` is the run plan.
 *
 * The trainer is TypeScript, not PyTorch, for one reason that is worth more than the framework:
 * it imports `featureIndex` from `src/ai/nnue/net.ts`, so the forward pass it fits and the forward
 * pass the engine runs cannot disagree about what an input means. What is left to check is only
 * the quantisation, which `net.test.ts` measures on 1,000 positions. The net is small enough that
 * a plain Float32 minibatch Adam over 16k positions a second is not the bottleneck; the data is.
 */
import { createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { resolve as resolvePath } from 'node:path';
import { Color, Position, WHITE, inCheck, makeMove } from '../rules/engine';
import { setRules } from '../rules/rules';
import { fromFen, toLan } from '../rules/setup';
import { evaluate, evaluateBoard, setEvaluator } from '../ai/eval';
import { quiesceScore, resetSearchState } from '../ai/search';
import { BOARD_INPUTS, HIDDEN, INPUTS, N_WEIGHTS, NetKind, QA, QB, RESIDUAL_MAX, SCALE, W_MAX, featureIndex, packNet, powerFeature } from '../ai/nnue/net';
import { parseFlags, paths } from './spec';
import { parseLan } from './tune';
import { readRun } from './run';
import { countMove, emptyEvents, eventsMatch } from './replay';
import { sourceId } from './identity';
import { mulberry32 } from './rng';
import type { GameRecord } from './game';

export const NNUE_DIR = 'sim/nnue';
const POSITIONS = `${NNUE_DIR}/positions.bin`;
/**
 * The candidate is written **beside the source it may one day replace**, never into it: an active
 * worker's bundle must not change because a training run finished (`docs/TAKEOVER-PLAN.md` §2).
 * Adoption copies the blob into `src/ai/nnue/weights.ts` as a deliberate, reviewable step.
 */
const CANDIDATE_TS = `${NNUE_DIR}/weights-candidate.ts`;

/** 64 board bytes, side to move, flags (result*2 | validation bit), Int16 score. */
export const REC = 68;
/**
 * The kings' powers record (tools/powers-net.ts): `REC`, then White's and Black's live power row + 1
 * (0 = none or spent), then the search's unspent-power term (Int16, side to move's view), which the
 * residual sits on together with the linear evaluation.
 */
export const REC_P = 72;
export const VAL_BIT = 4;
const VAL_EVERY = 10;
/** Past this the position is decided and the score is a mate count, not an evaluation. */
const CP_CAP = 2000;
/** Same definition of "quiet" as the Texel sampler: the static score survives a quiescence search. */
const QUIET_CP = 50;

const K_SIG = 0.667 * Math.LN10 / 400; // the tuner's fitted logistic slope, per centipawn
const sig = (cp: number): number => 1 / (1 + Math.exp(-K_SIG * cp));

// -----------------------------------------------------------------------------------------------
// 1. Sampling.

export interface SampleStats { games: number; kept: number; noScore: number; inCheck: number; noisy: number; decided: number; val: number }

function sampleGame(rec: GameRecord, isVal: boolean, out: number[], st: SampleStats): void {
  let pos: Position = fromFen(rec.startFen);
  const events = emptyEvents();
  for (let i = 0; i < rec.moves.length; i++) {
    const ply = rec.moves[i];
    const m = parseLan(pos.board, ply.lan);
    if (toLan(pos, m) !== ply.lan) throw new Error(`game ${rec.gameId} ply ${i}: parsed ${toLan(pos, m)} from ${ply.lan}`);
    if (ply.cp === undefined) st.noScore++;
    else if (Math.abs(ply.cp) > CP_CAP) st.decided++;
    else if (inCheck(pos)) st.inCheck++;
    else if (Math.abs(evaluate(pos) - quiesceScore(pos)) > QUIET_CP) st.noisy++;
    else {
      const mover = pos.turn === WHITE ? 1 : -1;
      for (let s = 0; s < 64; s++) out.push(pos.board[s]);
      out.push(pos.turn);
      out.push(Math.round((mover > 0 ? rec.result : 1 - rec.result) * 2) | (isVal ? VAL_BIT : 0));
      const cp = mover * ply.cp;
      out.push(cp & 0xff, (cp >> 8) & 0xff);
      st.kept++;
      if (isVal) st.val++;
    }
    const next = makeMove(pos, m);
    countMove(events, pos, m, next);
    pos = next;
  }
  // The moves must replay to the same events the run recorded, or this is a game of another rule set.
  const mismatch = eventsMatch(events, rec.events ?? {});
  if (mismatch) throw new Error(`game ${rec.gameId}: replay disagrees with the stored record (${mismatch})`);
}

export interface RunManifest {
  id: string; games: number; bytes: number; rulesKey: string; specKey: string; src: string;
}

async function sample(ids: string[], limitPerRun: number, cap: number): Promise<SampleStats> {
  mkdirSync(NNUE_DIR, { recursive: true });
  setEvaluator('linear'); // the quiet test compares the *linear* eval with its own quiescence search
  resetSearchState();
  // Validate every named run *before* touching the corpus: a refused sample must leave the old
  // positions.bin in place, not truncate it on the way to an exception.
  const scans = ids.map(id => {
    const file = paths(id).jsonl;
    const scan = readRun(file);
    if (scan.bad) throw new Error(`[nnue] ${id}: ${scan.bad} torn or unreadable line(s); repair the file before sampling`);
    if (scan.mixed) throw new Error(`[nnue] ${id}: the file mixes stamps; it cannot train anything`);
    if (!scan.stamp) throw new Error(`[nnue] ${id}: no rule/source stamp (written before stamping existed), so the rules it played are unknown. Sample a stamped run; see docs/takeover/BASELINE.md`);
    return { id, file, stamp: scan.stamp };
  });
  const tmp = `${POSITIONS}.tmp`;
  const out = createWriteStream(tmp);
  const st: SampleStats = { games: 0, kept: 0, noScore: 0, inCheck: 0, noisy: 0, decided: 0, val: 0 };
  const runs: RunManifest[] = [];
  try {
    for (const { id, file, stamp } of scans) {
      if (st.kept >= cap) break;
      // The rules the run actually played, from the record itself. `setRules()` would let today's
      // defaults reinterpret a past paladin capture (LESSONS.md 2026-09-13).
      setRules(stamp.rules);
      let inRun = 0;
      const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity });
      const rows: number[] = [];
      for await (const line of rl) {
        if (!line) continue;
        if (inRun >= limitPerRun || st.kept >= cap) { rl.close(); break; }
        sampleGame(JSON.parse(line) as GameRecord, st.games % VAL_EVERY === 0, rows, st);
        inRun++;
        st.games++;
        if (rows.length > 1e6) { out.write(Buffer.from(rows)); rows.length = 0; }
      }
      if (rows.length) out.write(Buffer.from(rows));
      runs.push({ id, games: inRun, bytes: statSync(file).size, rulesKey: stamp.rulesKey, specKey: stamp.specKey, src: stamp.src });
      console.log(`[nnue] ${id.padEnd(20)} ${String(inRun).padStart(7)} games, ${String(st.kept).padStart(8)} positions so far`);
    }
    await new Promise<void>(res => out.end(res));
  } catch (e) {
    out.destroy();
    rmSync(tmp, { force: true });
    throw e;
  }
  renameSync(tmp, POSITIONS);
  setRules(); // leave the module as found: the CLI may continue in one process
  writeFileSync(`${NNUE_DIR}/positions.json`, JSON.stringify({
    ...st, runs, sampledBy: sourceId(), bytesPerPosition: REC, quietCp: QUIET_CP, cpCap: CP_CAP, valEvery: VAL_EVERY,
  }, null, 2) + '\n');
  return st;
}

// -----------------------------------------------------------------------------------------------
// 2. Training.

/**
 * Active feature indices for both perspectives. Returns how many features are active: the pieces on
 * the board, plus the live powers when the record is a `REC_P` one.
 */
export function features(buf: Uint8Array, off: number, turn: Color, mine: Int32Array, theirs: Int32Array, rec = REC): number {
  let n = 0;
  for (let s = 0; s < 64; s++) {
    const p = buf[off + s];
    if (!p) continue;
    const t = p & 15, c = ((p >> 4) & 1) as Color;
    mine[n] = featureIndex(t, c, s, turn);
    theirs[n] = featureIndex(t, c, s, (turn ^ 1) as Color);
    n++;
  }
  if (rec >= REC_P) {
    for (let c = 0 as Color; c < 2; c = (c + 1) as Color) {
      const row = buf[off + 68 + c] - 1;
      if (row < 0) continue;
      mine[n] = powerFeature(row, c, turn);
      theirs[n] = powerFeature(row, c, (turn ^ 1) as Color);
      n++;
    }
  }
  return n;
}

export interface Net { w1: Float32Array; b1: Float32Array; w2: Float32Array; b2: number }

function initNet(rng: () => number): Net {
  const w1 = new Float32Array(INPUTS * HIDDEN), w2 = new Float32Array(2 * HIDDEN);
  const b1 = new Float32Array(HIDDEN).fill(0.5); // start every neuron inside the clipped ReLU's live band
  // The board rows only, so the random stream (and a board-only training run) is what it was before
  // the power rows existed; the power rows start at zero and stay there unless power records train them.
  for (let i = 0; i < BOARD_INPUTS * HIDDEN; i++) w1[i] = (rng() * 2 - 1) * 0.09;
  for (let i = 0; i < w2.length; i++) w2[i] = (rng() * 2 - 1) * 0.1;
  return { w1, b1, w2, b2: 0 };
}

/**
 * Net output in `SCALE` units (x SCALE for centipawns). `acc` keeps the pre-activation — the
 * backward pass needs it to know which neurons the clipped ReLU flattened — and `h` the clamped
 * output. `[0…HIDDEN)` is the side to move's accumulator, `[HIDDEN…2*HIDDEN)` the opponent's.
 */
export function forward(net: Net, mine: Int32Array, theirs: Int32Array, n: number, acc: Float32Array, h: Float32Array): number {
  for (let i = 0; i < HIDDEN; i++) { acc[i] = net.b1[i]; acc[HIDDEN + i] = net.b1[i]; }
  for (let j = 0; j < n; j++) {
    const a = mine[j] * HIDDEN, b = theirs[j] * HIDDEN;
    for (let i = 0; i < HIDDEN; i++) acc[i] += net.w1[a + i];
    for (let i = 0; i < HIDDEN; i++) acc[HIDDEN + i] += net.w1[b + i];
  }
  let y = net.b2;
  for (let i = 0; i < 2 * HIDDEN; i++) {
    h[i] = acc[i] < 0 ? 0 : acc[i] > 1 ? 1 : acc[i];
    y += h[i] * net.w2[i];
  }
  return y;
}

/**
 * `loss: 'wdl'` is Texel's: `(sigmoid(y) - [lambda*result + (1-lambda)*sigmoid(score)])^2`.
 * `loss: 'cp'` fits the search score in centipawns directly, `((y - score/SCALE))^2`, and ignores
 * `lambda`. The sigmoid squashes everything past about +-400 cp into the same target, so a net
 * fitted through it reads a missing queen as 550 cp instead of 930 — measured, §4 of the write-up.
 *
 * `loss: 'res'` is the same sigmoid loss, shifted: the net's output is added to the position's
 * **linear** evaluation before the sigmoid, and the label is the search score pulled to within
 * `RESIDUAL_MAX` of that evaluation. So the net fits only what the hand evaluation gets wrong, in
 * the band where moves are actually chosen, and the best fit is inside the clip the engine applies
 * — which is the whole point: material never passes through the net.
 */
export interface TrainOpts { epochs: number; batch: number; lr: number; lambda: number; seed: number; loss: 'wdl' | 'cp' | 'res' }

/**
 * `evaluateBoard` over the whole corpus, mover's point of view — the term a residual sits on.
 * Computed here rather than stored in the record: it is a pure function of the 64 board bytes and
 * the side to move that the record already carries, and computing it with the engine's own
 * function is the only way it cannot drift from what the engine adds at run time.
 */
function linearBases(buf: Uint8Array, n: number, rec = REC): Float32Array {
  setRules(); // the beast-target term reads the rules
  const out = new Float32Array(n);
  let clipped = 0;
  for (let i = 0; i < n; i++) {
    const off = i * rec;
    out[i] = evaluateBoard(buf.subarray(off, off + 64), buf[off + 64] as Color);
    // A powers record: the search adds the unspent-power term to the board too, so the net sits on both.
    if (rec >= REC_P) out[i] += ((buf[off + 70] | (buf[off + 71] << 8)) << 16) >> 16;
    if (Math.abs((((buf[off + 66] | (buf[off + 67] << 8)) << 16) >> 16) - out[i]) > RESIDUAL_MAX) clipped++;
  }
  // If this is large the bound is wrong, and the net is being asked to fit a target it cannot
  // reach. It was 150 cp because that is the span of the hand evaluation's positional terms.
  console.log(`[nnue] residual target: |search - linear| > ${RESIDUAL_MAX} cp on ${((100 * clipped) / n).toFixed(1)}% of positions (clipped)`);
  return out;
}

/**
 * `init` starts from a given net (fine-tuning; epoch 0 is then a candidate for the best checkpoint) and
 * `rec` is the record size (`REC`, or `REC_P` for the kings' powers corpus).
 */
export function trainNet(buf: Uint8Array, n: number, opts: TrainOpts, init?: Net, rec = REC): { net: Net; curve: { epoch: number; train: number; val: number }[]; bestEpoch: number; bestVal: number } {
  const REC = rec; // shadows the module constant: every offset below is in records of this size
  const rng = mulberry32(opts.seed);
  const net = initNet(rng);
  if (init) { net.w1.set(init.w1); net.b1.set(init.b1); net.w2.set(init.w2); net.b2 = init.b2; }
  const NW = INPUTS * HIDDEN;
  const gw1 = new Float32Array(NW), gb1 = new Float32Array(HIDDEN), gw2 = new Float32Array(2 * HIDDEN);
  const mw1 = new Float32Array(NW), vw1 = new Float32Array(NW);
  const mb1 = new Float32Array(HIDDEN), vb1 = new Float32Array(HIDDEN);
  const mw2 = new Float32Array(2 * HIDDEN), vw2 = new Float32Array(2 * HIDDEN);
  let mb2 = 0, vb2 = 0, gb2 = 0;
  const acc = new Float32Array(2 * HIDDEN), h = new Float32Array(2 * HIDDEN), dh = new Float32Array(2 * HIDDEN);
  const mine = new Int32Array(66), theirs = new Int32Array(66);

  // Train / validation split, by the bit the sampler set (whole games, never a straddle).
  const train = new Int32Array(n), val = new Int32Array(n);
  let nt = 0, nv = 0;
  for (let i = 0; i < n; i++) {
    if (buf[i * REC + 65] & VAL_BIT) val[nv++] = i; else train[nt++] = i;
  }
  const trainIdx = train.subarray(0, nt), valIdx = val.subarray(0, nv);
  console.log(`[nnue] ${nt} training positions, ${nv} held out`);

  const cpOf = (off: number): number => ((buf[off + 66] | (buf[off + 67] << 8)) << 16) >> 16;
  /** Non-null only for `--loss res`; zero everywhere else leaves the other two losses untouched. */
  const bases = opts.loss === 'res' ? linearBases(buf, n, rec) : null;
  const baseOf = (i: number): number => (bases ? bases[i] : 0);
  const target = (i: number): number => {
    const off = i * REC;
    if (opts.loss === 'cp') return cpOf(off) / SCALE;
    let cp = cpOf(off);
    if (bases) { // the residual target only: pull the score to within the clip of the linear eval
      const b = bases[i], d = cp - b;
      cp = b + (d > RESIDUAL_MAX ? RESIDUAL_MAX : d < -RESIDUAL_MAX ? -RESIDUAL_MAX : d);
    }
    return opts.lambda * ((buf[off + 65] & 3) / 2) + (1 - opts.lambda) * sig(cp);
  };

  /** Loss and d(loss)/dy for one position, in one place so the report and the gradient agree. */
  const dLoss = (y: number, t: number, b: number): [number, number] => {
    if (opts.loss === 'cp') { const d = y - t; return [d * d, 2 * d]; }
    const p = 1 / (1 + Math.exp(-(b + y * SCALE) * K_SIG));
    const d = p - t;
    return [d * d, 2 * d * p * (1 - p) * K_SIG * SCALE];
  };

  const loss = (idx: Int32Array): number => {
    let sum = 0;
    for (let k = 0; k < idx.length; k++) {
      const i = idx[k], off = i * REC;
      const cnt = features(buf, off, buf[off + 64] as Color, mine, theirs, rec);
      sum += dLoss(forward(net, mine, theirs, cnt, acc, h), target(i), baseOf(i))[0];
    }
    return sum / Math.max(1, idx.length);
  };

  // A batch of 8k positions touches nearly all 1,408 features, so a sparse optimiser would save
  // nothing: 45k dense Adam updates a batch is 1% of the forward pass. Dense, and no bookkeeping.
  const lim1 = (W_MAX - 1) / QA, lim2 = (W_MAX - 1) / QB;
  const curve: { epoch: number; train: number; val: number }[] = [];
  // Keep the best-validation net, as `src/sim/tune.ts` does. With ~1,000 distinct random back
  // ranks and one game result per game, the WDL half of the target is memorisable from the back
  // rank alone, and held-out error turns up again after the first epoch or two.
  let best = { w1: Float32Array.from(net.w1), b1: Float32Array.from(net.b1), w2: Float32Array.from(net.w2), b2: net.b2 };
  let bestVal = Infinity, bestEpoch = 0;
  if (init) {
    bestVal = +loss(valIdx).toFixed(6);
    console.log(`[nnue] epoch   0  (the starting net)  val ${bestVal.toFixed(6)}`);
  }
  let step = 0;
  const t0 = Date.now();
  for (let e = 1; e <= opts.epochs; e++) {
    for (let i = nt - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = trainIdx[i]; trainIdx[i] = trainIdx[j]; trainIdx[j] = t; }
    const lr = opts.lr * (0.05 + 0.95 * 0.5 * (1 + Math.cos((Math.PI * (e - 1)) / opts.epochs)));
    for (let b = 0; b < nt; b += opts.batch) {
      const end = Math.min(nt, b + opts.batch);
      gw1.fill(0); gb1.fill(0); gw2.fill(0); gb2 = 0;
      for (let k = b; k < end; k++) {
        const i = trainIdx[k], off = i * REC;
        const cnt = features(buf, off, buf[off + 64] as Color, mine, theirs, rec);
        const dy = dLoss(forward(net, mine, theirs, cnt, acc, h), target(i), baseOf(i))[1];
        for (let i2 = 0; i2 < 2 * HIDDEN; i2++) {
          gw2[i2] += dy * h[i2];
          dh[i2] = acc[i2] > 0 && acc[i2] < 1 ? dy * net.w2[i2] : 0;
        }
        gb2 += dy;
        for (let i2 = 0; i2 < HIDDEN; i2++) gb1[i2] += dh[i2] + dh[HIDDEN + i2];
        for (let j = 0; j < cnt; j++) {
          const ao = mine[j] * HIDDEN, to = theirs[j] * HIDDEN;
          for (let i2 = 0; i2 < HIDDEN; i2++) gw1[ao + i2] += dh[i2];
          for (let i2 = 0; i2 < HIDDEN; i2++) gw1[to + i2] += dh[HIDDEN + i2];
        }
      }
      step++;
      const scale = 1 / (end - b);
      const bc1 = 1 - 0.9 ** step, bc2 = 1 - 0.999 ** step;
      // Int16 headroom is enforced *during* training, not after: a clamp applied at pack time
      // would be a different net from the one the curve measured.
      const adam = (w: Float32Array, g: Float32Array, m: Float32Array, v: Float32Array, i: number, lim: number): void => {
        const gi = g[i] * scale;
        m[i] = 0.9 * m[i] + 0.1 * gi;
        v[i] = 0.999 * v[i] + 0.001 * gi * gi;
        const x = w[i] - (lr * (m[i] / bc1)) / (Math.sqrt(v[i] / bc2) + 1e-8);
        w[i] = x > lim ? lim : x < -lim ? -lim : x;
      };
      for (let i = 0; i < NW; i++) adam(net.w1, gw1, mw1, vw1, i, lim1);
      for (let i = 0; i < HIDDEN; i++) adam(net.b1, gb1, mb1, vb1, i, lim1);
      for (let i = 0; i < 2 * HIDDEN; i++) adam(net.w2, gw2, mw2, vw2, i, lim2);
      const gi = gb2 * scale;
      mb2 = 0.9 * mb2 + 0.1 * gi;
      vb2 = 0.999 * vb2 + 0.001 * gi * gi;
      net.b2 -= (lr * (mb2 / bc1)) / (Math.sqrt(vb2 / bc2) + 1e-8);
    }
    const row = { epoch: e, train: +loss(trainIdx.subarray(0, Math.min(nt, 100_000))).toFixed(6), val: +loss(valIdx).toFixed(6) };
    curve.push(row);
    if (row.val < bestVal) {
      bestVal = row.val; bestEpoch = e;
      best = { w1: Float32Array.from(net.w1), b1: Float32Array.from(net.b1), w2: Float32Array.from(net.w2), b2: net.b2 };
    }
    console.log(`[nnue] epoch ${String(e).padStart(3)}  lr ${lr.toFixed(4)}  train ${row.train.toFixed(6)}  val ${row.val.toFixed(6)}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  console.log(`[nnue] best validation ${bestVal.toFixed(6)} at epoch ${bestEpoch}`);
  return { net: best, curve, bestEpoch, bestVal };
}

// -----------------------------------------------------------------------------------------------
// 3. Quantisation and the blob.

export function quantise(net: Net): Int16Array {
  const w = new Int16Array(N_WEIGHTS);
  let o = 0;
  const put = (x: number): void => {
    const q = Math.round(x);
    if (q > W_MAX || q < -W_MAX) throw new Error(`nnue: weight ${x} leaves Int16 range`);
    w[o++] = q;
  };
  // `?? 0`: a float net saved before the power rows existed is shorter; its power rows are zero.
  for (let i = 0; i < INPUTS * HIDDEN; i++) put((net.w1[i] ?? 0) * QA);
  for (let i = 0; i < HIDDEN; i++) put(net.b1[i] * QA);
  for (let i = 0; i < 2 * HIDDEN; i++) put(net.w2[i] * QB);
  put(net.b2 * QB);
  return w;
}

function writeWeights(w: Int16Array, kind: NetKind): string {
  const b64 = packNet(w);
  writeFileSync(CANDIDATE_TS, `/**
 * The trained net, base64 little-endian Int16 (see \`net.ts\` for the layout).
 * ${INPUTS} x ${HIDDEN} x 2 -> 1, QA=${QA} QB=${QB} SCALE=${SCALE}. ${(b64.length / 1024).toFixed(0)} kB.
 * Written by \`npm run nnue -- train\`; do not edit by hand. This is a **candidate**: adoption copies
 * the blob into src/ai/nnue/weights.ts as a reviewed step (docs/TAKEOVER-PLAN.md §3).
 */

/** What the blob predicts: the whole evaluation, or a bounded residual on the linear one. */
export const NET_KIND = '${kind}';

export const NET_B64: string = '${b64}';
`);
  console.log(`[nnue] ${CANDIDATE_TS}: ${kind} net, ${w.length} weights, ${(b64.length / 1024).toFixed(1)} kB of base64 (candidate, not adopted)`);
  return b64;
}

/** The trained candidate blob, from the float net on disk. Null when nothing has been trained. */
function candidateNet(): string | null {
  if (!existsSync(`${NNUE_DIR}/net.json`)) return null;
  const j = JSON.parse(readFileSync(`${NNUE_DIR}/net.json`, 'utf8')) as { w1: number[]; b1: number[]; w2: number[]; b2: number };
  return packNet(quantise({ w1: Float32Array.from(j.w1), b1: Float32Array.from(j.b1), w2: Float32Array.from(j.w2), b2: j.b2 }));
}

// -----------------------------------------------------------------------------------------------
// 4. CLI.

async function main(argv: string[]): Promise<void> {
  const cmd = argv[0]?.startsWith('--') ? 'help' : argv[0] ?? 'help';
  const f = parseFlags(argv);
  const num = (k: string, d: number): number => (typeof f[k] === 'string' ? Number(f[k]) : d);

  if (cmd === 'sample') {
    // `--runs` is required, and the runs are named by hand. A stored `rules: {}` means "the
    // defaults on the day it played", not today's, so no filter over stored specs can tell a run
    // of today's game from a run of an older one (LESSONS.md, 2026-09-13).
    if (typeof f.runs !== 'string') throw new Error('nnue sample: --runs a,b is required (a stored spec does not say which rules a run played)');
    const ids = f.runs.split(',');
    console.log(`[nnue] runs: ${ids.join(', ')}`);
    const st = await sample(ids, num('perRun', Infinity), num('cap', Infinity));
    console.log(`[nnue] ${st.games} games -> ${st.kept} positions (${st.val} held out); skipped ${st.noScore} unscored, ${st.decided} decided, ${st.inCheck} in check, ${st.noisy} noisy`);
    return;
  }

  if (cmd === 'train') {
    const raw = readFileSync(POSITIONS);
    const buf = new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength);
    const n = Math.floor(buf.length / REC);
    console.log(`[nnue] ${n} positions (${(buf.length / 2 ** 20).toFixed(0)} MB)`);
    const opts: TrainOpts = {
      epochs: num('epochs', 12), batch: num('batch', 8192), lr: num('lr', 0.01),
      lambda: num('lambda', 0.5), seed: num('seed', 20260913),
      // the sigmoid target measured 58 Elo better than plain cp; see the write-up
      loss: f.loss === 'cp' ? 'cp' : f.loss === 'res' ? 'res' : 'wdl',
    };
    const { net, curve, bestEpoch, bestVal } = trainNet(buf, n, opts);
    mkdirSync(NNUE_DIR, { recursive: true });
    writeFileSync(`${NNUE_DIR}/net.json`, JSON.stringify({ opts, positions: n, bestEpoch, bestVal, curve, w1: [...net.w1], b1: [...net.b1], w2: [...net.w2], b2: net.b2 }));
    const b64 = writeWeights(quantise(net), opts.loss === 'res' ? 'residual' : 'full');
    // Source, dataset and model hashes travel together with the training parameters, so a candidate
    // can be checked against the corpus it learned from (docs/TAKEOVER-PLAN.md §3).
    const meta = existsSync(`${NNUE_DIR}/positions.json`)
      ? JSON.parse(readFileSync(`${NNUE_DIR}/positions.json`, 'utf8')) as { runs?: unknown; sampledBy?: string }
      : {};
    writeFileSync(`${NNUE_DIR}/train.json`, JSON.stringify({
      opts, positions: n, bestEpoch, bestVal, curve,
      dataset: {
        file: POSITIONS, sha256: createHash('sha256').update(raw).digest('hex'),
        runs: meta.runs ?? [], sampledBy: meta.sampledBy ?? null,
      },
      trainedBy: sourceId(),
      model: { file: CANDIDATE_TS, kind: opts.loss === 'res' ? 'residual' : 'full', sha256: createHash('sha256').update(b64).digest('hex') },
    }, null, 2) + '\n');
    return;
  }

  if (cmd === 'pack') { // re-quantise the float net on disk, without training again
    const j = JSON.parse(readFileSync(`${NNUE_DIR}/net.json`, 'utf8')) as { w1: number[]; b1: number[]; w2: number[]; b2: number; opts?: TrainOpts };
    writeWeights(quantise({ w1: Float32Array.from(j.w1), b1: Float32Array.from(j.b1), w2: Float32Array.from(j.w2), b2: j.b2 }),
      j.opts?.loss === 'res' ? 'residual' : 'full');
    return;
  }

  if (cmd === 'arms') {
    // The two sides of an nnue-vs-linear match, as the files `RunSpec.evalParams` already takes.
    // `src/sim/game.ts` loads one per side and calls `setEvalParams` between plies, dropping the
    // transposition table with it — which is exactly the protocol the Texel match used, for free.
    //
    // Each file pins everything the arm needs **including the net blob**: a match that merely names
    // `eval-residual.json` would otherwise play whichever `weights.ts` happens to be in the tree,
    // and the recorded result could not be reproduced (docs/TAKEOVER-PLAN.md §2/§3).
    const { evalParams } = await import('../ai/eval');
    const { netBlob } = await import('../ai/nnue/net');
    mkdirSync(NNUE_DIR, { recursive: true });
    const live = evalParams();
    const candidate = candidateNet();
    if (!candidate) throw new Error(`arms: ${NNUE_DIR}/net.json is missing — train the residual candidate first`);
    const nnue = netBlob();
    writeFileSync(`${NNUE_DIR}/eval-linear.json`, JSON.stringify({ ...live, evaluator: 'linear' }, null, 1) + '\n');
    writeFileSync(`${NNUE_DIR}/eval-residual.json`, JSON.stringify({ ...live, evaluator: 'residual', net: { b64: candidate, kind: 'residual' } }, null, 1) + '\n');
    writeFileSync(`${NNUE_DIR}/eval-nnue.json`, JSON.stringify({
      ...live, evaluator: nnue?.kind === 'residual' ? 'residual' : 'nnue', net: nnue ?? undefined,
    }, null, 1) + '\n');
    console.log(`[nnue] wrote eval-{nnue,linear,residual}.json in ${NNUE_DIR}; the residual arm pins the trained candidate`);
    return;
  }

  if (cmd === 'bench') {
    // Speed, both evaluations, on the same positions: nodes/s at a fixed depth, and the depth a
    // one-second search reaches. Node here is the browser's proxy — same code, no worker hop.
    const { search, resetSearchState: reset } = await import('../ai/search');
    const { startPosition, randomBackRank } = await import('../rules/setup');
    const { legalMoves, makeMove } = await import('../rules/engine');
    setRules();
    const rng = mulberry32(num('seed', 4242));
    const depth = num('depth', 5), nPos = num('positions', 12), plies = num('plies', 8);
    const positions: Position[] = [];
    for (let i = 0; i < nPos; i++) {
      let pos = startPosition(randomBackRank(rng));
      for (let k = 0; k < plies; k++) {
        const ms = legalMoves(pos);
        if (!ms.length) break;
        pos = makeMove(pos, ms[Math.floor(rng() * ms.length)]);
      }
      positions.push(pos);
    }
    const { netKind } = await import('../ai/nnue/net');
    const out: Record<string, unknown>[] = [];
    // Whichever net is in `weights.ts`: a residual net cannot be run as a whole evaluation.
    for (const e of ['linear', netKind() === 'residual' ? 'residual' : 'nnue'] as const) {
      setEvaluator(e);
      let nodes = 0, ms = 0, depthSum = 0, oneSecNodes = 0;
      for (const pos of positions) {
        reset();
        const t = performance.now();
        const r = search(pos, { maxDepth: depth });
        ms += performance.now() - t;
        nodes += r.nodes;
      }
      for (const pos of positions) {
        reset();
        const r = search(pos, { timeMs: 1000 });
        depthSum += r.depth;
        oneSecNodes += r.nodes;
      }
      const row = {
        evaluator: e, depth, positions: nPos,
        nodes, seconds: +(ms / 1000).toFixed(2), nodesPerSec: Math.round(nodes / (ms / 1000)),
        meanDepthIn1s: +(depthSum / nPos).toFixed(2), nodesIn1s: Math.round(oneSecNodes / nPos),
      };
      out.push(row);
      console.log(`[nnue] ${e.padEnd(6)} depth ${depth}: ${(row.nodesPerSec / 1000).toFixed(0)}k nodes/s over ${row.seconds}s   1s search reaches depth ${row.meanDepthIn1s}`);
    }
    setEvaluator('linear');
    mkdirSync(NNUE_DIR, { recursive: true });
    writeFileSync(`${NNUE_DIR}/bench.json`, JSON.stringify(out, null, 2) + '\n');
    return;
  }

  console.log('usage: tsx src/sim/gen.ts <sample|train|pack|bench|arms> --runs a,b [--cap n] [--epochs n] [--batch n] [--lr x] [--loss res|wdl|cp] [--lambda x]');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolvePath(process.argv[1])) {
  main(process.argv.slice(2)).catch(e => { console.error(e); process.exitCode = 1; });
}
