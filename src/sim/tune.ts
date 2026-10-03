/**
 * Texel tuning: fit `src/ai/eval.ts`'s numbers to the results of games we already played.
 *
 * Four steps, one command each (`npm run tune -- <step>`):
 *
 *   sample  replay the recorded v0.6 games, keep quiet positions   -> sim/tune/positions.bin
 *   fit     minimise (result - sigmoid(K x eval))^2 over them      -> sim/tune/params.json
 *   apply   write the fitted numbers back into src/ai/eval.ts      (`npm run tune:apply`)
 *   match   play the tuned evaluation against the untuned one      -> sim/out/<id>.jsonl
 *
 * The evaluation is re-implemented here as `evalVector`, a function of one 408-number parameter
 * vector, because the tuner needs the *derivative* with respect to every number and the shipped
 * `evaluateBoard` computes only the value. Two implementations of one evaluation is a bug factory,
 * so `tune.test.ts` holds them together: with the live parameters loaded they agree bit for bit on
 * 1,000 random positions, and the apply step re-reads the file it wrote and checks it round-trips.
 */
import { copyFileSync, createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { availableParallelism } from 'node:os';
import { type Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { tsWorker } from './ts-worker';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve as resolvePath } from 'node:path';
import {
  A, B, Color, G, K, L, LETTERS, M, Move, N, P, PieceType, Position, Q, R, S, WHITE,
  canCapture, colorOf, inCheck, makeMove, typeOf,
} from '../rules/engine';
import { RULES, Rules, setRules } from '../rules/rules';
import { fromFen, toLan } from '../rules/setup';
import { EvalParams, PST_LETTERS, evalParams, evaluate } from '../ai/eval';
import { quiesceScore, resetSearchState } from '../ai/search';
import type { GameRecord } from './game';
import { DEFAULTS, OUT_DIR, RunSpec, parseFlags, paths } from './spec';
import { readRun } from './run';
import { countMove, emptyEvents, eventsMatch } from './replay';
import { sourceId } from './identity';

export const TUNE_DIR = 'sim/tune';
const POSITIONS = `${TUNE_DIR}/positions.bin`;
const PARAMS = `${TUNE_DIR}/params.json`;
const BASE = `${TUNE_DIR}/base.json`;
const FIT = `${TUNE_DIR}/fit.json`;
const EVAL_SRC = 'src/ai/eval.ts';

// -----------------------------------------------------------------------------------------------
// 1. The parameter vector.

const TYPE: Record<string, PieceType> = { P, N, B, R, Q, K, A, L, G, M, S };
/** Tables in vector order: one per letter, then the king's two. */
const NMAT = PST_LETTERS.length, NPST = 32, NTABLE = PST_LETTERS.length + 2;
const PST0 = NMAT;
const MOB0 = PST0 + NTABLE * NPST;
const BEAST0 = MOB0 + 4, SHIELD0 = BEAST0 + 2, MAE0 = SHIELD0 + 4;
const TEMPO_I = MAE0 + 2, PHASE_I = TEMPO_I + 1;
export const NPARAM = PHASE_I + 1;

const KING_MG_SLOT = PST_LETTERS.length, KING_EG_SLOT = KING_MG_SLOT + 1;
/** type -> material index, type -> table slot, type -> mobility index (-1 where there is none). */
const MATI = new Int32Array(12).fill(-1), SLOT = new Int32Array(12).fill(-1), MOBI = new Int32Array(12).fill(-1);
for (let i = 0; i < PST_LETTERS.length; i++) { const t = TYPE[PST_LETTERS[i]]; MATI[t] = i; SLOT[t] = i; }
MOBI[B] = MOB0; MOBI[R] = MOB0 + 1; MOBI[Q] = MOB0 + 2; MOBI[L] = MOB0 + 3;
/** Left-right mirrored square index: 8 ranks x 4 files. */
const MIR = new Int32Array(64);
for (let s = 0; s < 64; s++) MIR[s] = (s >> 3) * 4 + Math.min(s & 7, 7 - (s & 7));
const pstI = (slot: number, rel: number): number => PST0 + slot * NPST + MIR[rel];

/** The half-table the vector stores, expanded back to 64 squares. */
const expand = (v: Float64Array, slot: number): number[] =>
  Array.from({ length: 64 }, (_, s) => v[pstI(slot, s)]);

/** Half a table, from a 64-entry one. Throws if the table is not left-right symmetric. */
function fold(table: readonly number[], name: string): number[] {
  const out = new Array<number>(NPST);
  for (let s = 0; s < 64; s++) {
    const m = (s & ~7) | (7 - (s & 7));
    if (table[s] !== table[m]) throw new Error(`${name} is not left-right symmetric at ${s}: ${table[s]} vs ${table[m]}`);
    out[MIR[s]] = table[s];
  }
  return out;
}

export function toVector(p: EvalParams): Float64Array {
  const v = new Float64Array(NPARAM);
  for (let i = 0; i < NMAT; i++) v[i] = p.values[PST_LETTERS[i]];
  const tables: [number[], string][] = [
    ...[...PST_LETTERS].map((l, i): [number[], string] => [fold(p.pst[l], `PST[${l}]`), String(i)]),
    [fold(p.kingMg, 'KING_MG'), 'kmg'], [fold(p.kingEg, 'KING_EG'), 'keg'],
  ];
  tables.forEach(([half], slot) => { for (let i = 0; i < NPST; i++) v[PST0 + slot * NPST + i] = half[i]; });
  v[MOBI[B]] = p.mob.B; v[MOBI[R]] = p.mob.R; v[MOBI[Q]] = p.mob.Q; v[MOBI[L]] = p.mob.L;
  v[BEAST0] = p.beastTarget; v[BEAST0 + 1] = p.beastTargetMax;
  v[SHIELD0] = p.shield.pawn; v[SHIELD0 + 1] = p.shield.guard;
  v[SHIELD0 + 2] = p.shield.other; v[SHIELD0 + 3] = p.shield.open;
  v[MAE0] = p.maesterNearKing[1]; v[MAE0 + 1] = p.maesterNearKing[2];
  v[TEMPO_I] = p.tempo; v[PHASE_I] = p.phaseMax;
  return v;
}

export function fromVector(v: Float64Array): EvalParams {
  const values: Record<string, number> = { K: 0 }, pst: Record<string, number[]> = {};
  for (let i = 0; i < NMAT; i++) { values[PST_LETTERS[i]] = v[i]; pst[PST_LETTERS[i]] = expand(v, i); }
  return {
    values, pst, kingMg: expand(v, KING_MG_SLOT), kingEg: expand(v, KING_EG_SLOT),
    mob: { B: v[MOBI[B]], R: v[MOBI[R]], Q: v[MOBI[Q]], L: v[MOBI[L]] },
    beastTarget: v[BEAST0], beastTargetMax: v[BEAST0 + 1],
    shield: { pawn: v[SHIELD0], guard: v[SHIELD0 + 1], other: v[SHIELD0 + 2], open: v[SHIELD0 + 3] },
    maesterNearKing: [0, v[MAE0], v[MAE0 + 1]], tempo: v[TEMPO_I], phaseMax: v[PHASE_I],
  };
}

// -----------------------------------------------------------------------------------------------
// 2. The evaluation as a function of the vector, with its gradient.
//
// Ported from `src/ai/eval.ts` (`mobility`, `beastTargets`, `shield`, `evaluateBoard`) and held to
// it by `tune.test.ts`. Keep the two in step: a change there is a change here.

const DIRS: readonly (readonly [number, number])[] = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
const step = (s: number, df: number, dr: number): number => {
  const f = (s & 7) + df, r = (s >> 3) + dr;
  return f < 0 || f > 7 || r < 0 || r > 7 ? -1 : (r << 3) | f;
};
const cheb = (a: number, b: number): number => Math.max(Math.abs((a & 7) - (b & 7)), Math.abs((a >> 3) - (b >> 3)));

/** Pseudo-legal slider destinations (the weight is applied by the caller). */
function mobilityCount(board: Uint8Array, from: number, t: PieceType, c: Color): number {
  const lo = t === B ? 4 : 0, hi = t === R ? 4 : 8;
  let n = 0;
  for (let d = lo; d < hi; d++) {
    const [df, dr] = DIRS[d];
    for (let to = step(from, df, dr); to >= 0; to = step(to, df, dr)) {
      const v = board[to];
      if (!v) { n++; continue; }
      if (t === L) { if (colorOf(v) === c) continue; n++; break; }
      if (colorOf(v) !== c) n++;
      break;
    }
  }
  return n;
}

function beastTargetCount(board: Uint8Array, from: number, c: Color): number {
  const ahead = c === WHITE ? 1 : -1;
  let n = 0;
  for (let d = 0; d < 8; d++) {
    const [df, dr] = DIRS[d];
    if (df === 0 && dr === ahead) continue;
    const to = step(from, df, dr);
    if (to < 0) continue;
    const v = board[to];
    if (v && colorOf(v) !== c && canCapture(S, typeOf(v))) n++;
  }
  return n;
}

const kingSq = [-1, -1];
const maesters: number[] = [];
const nonPawn = new Int32Array(12);
/** Squares in front of a king holding a guard / pawn / other friend, and the open ones. */
const shieldN = new Int32Array(4);

function shieldCount(board: Uint8Array, k: number, c: Color): void {
  shieldN.fill(0);
  const dr = c === WHITE ? 1 : -1;
  for (let df = -1; df <= 1; df++) {
    const s = step(k, df, dr);
    if (s < 0) continue;
    const p = board[s];
    if (!p || colorOf(p) !== c) { shieldN[3]++; continue; }
    const t = typeOf(p);
    shieldN[t === G ? 1 : t === P ? 0 : 2]++;
  }
}

/**
 * Score of `board` from **White's** point of view, tempo included, unrounded. With `g`, adds
 * `w * d(score)/d(parameter)` to every entry — the only thing the fit needs from the evaluation.
 */
export function evalVector(board: Uint8Array, turn: Color, v: Float64Array, g?: Float64Array, w = 1, exact = false): number {
  let score = 0, npm = 0;
  kingSq[0] = kingSq[1] = -1;
  maesters.length = 0;
  nonPawn.fill(0);
  for (let s = 0; s < 64; s++) {
    const p = board[s];
    if (!p) continue;
    const t = typeOf(p), c = colorOf(p);
    if (t === K) { kingSq[c] = s; continue; }
    const sign = c === WHITE ? 1 : -1, rel = c === WHITE ? s : s ^ 56;
    const mi = MATI[t], pi = pstI(SLOT[t], rel);
    score += sign * (v[mi] + v[pi]);
    if (g) { g[mi] += w * sign; g[pi] += w * sign; }
    if (t !== P) { npm += v[mi]; nonPawn[t]++; }
    if (t === B || t === R || t === Q || t === L) {
      const n = mobilityCount(board, s, t, c), wi = MOBI[t];
      score += sign * n * v[wi];
      if (g) g[wi] += w * sign * n;
    } else if (t === S) {
      const n = beastTargetCount(board, s, c), raw = n * v[BEAST0];
      if (raw <= v[BEAST0 + 1]) { score += sign * raw; if (g) g[BEAST0] += w * sign * n; }
      else { score += sign * v[BEAST0 + 1]; if (g) g[BEAST0 + 1] += w * sign; }
    } else if (t === M) maesters.push(s);
  }

  const phaseMax = v[PHASE_I], full = npm >= phaseMax;
  const phase = full ? 1 : npm / phaseMax;
  let dPhase = 0; // d(score)/d(phase), for the material and phaseMax gradients below
  for (let ci = 0; ci < 2; ci++) {
    const k = kingSq[ci];
    if (k < 0) continue;
    const c = ci as Color, sign = c === WHITE ? 1 : -1, rel = c === WHITE ? k : k ^ 56;
    const mg = pstI(KING_MG_SLOT, rel), eg = pstI(KING_EG_SLOT, rel);
    shieldCount(board, k, c);
    const shield = shieldN[0] * v[SHIELD0] + shieldN[1] * v[SHIELD0 + 1] + shieldN[2] * v[SHIELD0 + 2] - shieldN[3] * v[SHIELD0 + 3];
    // With `exact`, rounded per king as `evaluateBoard` does, so the two agree to the last bit: the
    // phase blend is the one float in the whole evaluation. Training keeps it smooth.
    let val = v[mg] * phase + v[eg] * (1 - phase) + shield * phase;
    dPhase += sign * (v[mg] - v[eg] + shield);
    if (g) {
      g[mg] += w * sign * phase;
      g[eg] += w * sign * (1 - phase);
      for (let i = 0; i < 4; i++) g[SHIELD0 + i] += w * sign * phase * (i === 3 ? -shieldN[3] : shieldN[i]);
    }
    for (let i = 0; i < maesters.length; i++) {
      const m = maesters[i];
      if (colorOf(board[m]) !== c) continue;
      const d = cheb(m, k);
      if (d === 1 || d === 2) { val += v[MAE0 + d - 1]; if (g) g[MAE0 + d - 1] += w * sign; }
    }
    score += sign * (exact ? Math.round(val) : val);
  }
  // The phase is non-pawn material over phaseMax, so every material value pulls on the king tables.
  if (g && !full) {
    const inv = 1 / phaseMax;
    for (let t = 1; t < 12; t++) if (nonPawn[t]) g[MATI[t]] += w * dPhase * nonPawn[t] * inv;
    g[PHASE_I] -= w * dPhase * npm * inv * inv;
  }
  const tempo = turn === WHITE ? 1 : -1;
  score += tempo * v[TEMPO_I];
  if (g) g[TEMPO_I] += w * tempo;
  return score;
}

/** What `evaluate()` returns for the same position: mover's point of view, rounded. */
export const moverCp = (white: number, turn: Color, tempo: number): number =>
  Math.round(turn === WHITE ? white - tempo : -(white + tempo)) + tempo;

// -----------------------------------------------------------------------------------------------
// 3. Sampling: recorded games -> quiet positions.

/** 64 board bytes, side to move, then the result (0/1/2) with bit 2 set on a validation position. */
const REC = 66;
const VAL_BIT = 4;
/** Every tenth game is held out. */
const VAL_EVERY = 10;
/** A position is quiet when the static evaluation and the quiescence score agree this closely. */
const QUIET_CP = 50;
const PER_GAME = 30, MIN_GAP = 4;

/** `Sd4xe5xf6`, `Ae4*d5`, `Ma1<>e1`, `Oe4>f5-f6` (shove), `d7xe8=Q` -> the move the recorder made. */
export function parseLan(board: Uint8Array, lan: string): Move {
  const sq = (n: string): number => ((n.charCodeAt(1) - 49) << 3) | (n.charCodeAt(0) - 97);
  let text = lan;
  let promo: PieceType | undefined;
  const eq = text.indexOf('=');
  if (eq >= 0) { promo = LETTERS.indexOf(text.slice(eq + 1)) as PieceType; text = text.slice(0, eq); }
  if (/^[PNBRQKALGMSOCV]/.test(text)) text = text.slice(1);
  // Strike (Flame A): a trailing `!` marks the one queen-like action, so replay spends the flag.
  let strike = false;
  if (text.endsWith('!')) { strike = true; text = text.slice(0, -1); }
  const mark = (m: Move): Move => (strike ? { ...m, power: 'strike' } : m);
  const from = sq(text.slice(0, 2)), rest = text.slice(2);
  if (rest.startsWith('>')) {
    // Mirror engine.ts: under `ogreMode: 'push'` the ogre follows onto the square it emptied.
    const shove = { from: sq(rest.slice(1, 3)), to: sq(rest.slice(4)) };
    return mark({ from, to: RULES.ogreMode === 'push' ? shove.from : from, captures: [], shove });
  }
  if (rest.startsWith('<>')) return mark({ from, to: sq(rest.slice(2)), captures: [], swap: true });
  if (rest.startsWith('*')) return mark({ from, to: from, captures: [sq(rest.slice(1))] });
  // Reaver: `xc3-d3` is one capture then a step onto the landing square; `-d3` alone is a quiet move.
  if (/^x/.test(rest) && rest.includes('-')) {
    const [caps, land] = rest.split('-');
    return mark({ from, to: sq(land), captures: caps.split('x').filter(Boolean).map(sq) });
  }
  if (rest.startsWith('-')) return mark({ from, to: sq(rest.slice(1)), captures: [], ...(promo ? { promo } : {}) });
  const captures = rest.split('x').filter(Boolean).map(sq);
  const m: Move = mark({ from, to: captures[captures.length - 1], captures, ...(promo ? { promo } : {}) });
  if (typeOf(board[from]) === L) {
    // Mirror engine.ts: 'always' dies on any capture, 'nonPawn' survives pawn captures, 'never' never dies.
    const k = RULES.paladinKamikaze as string, victim = typeOf(board[m.to]);
    if (k === 'always' || (k === 'nonPawn' && victim !== P)) m.selfRemove = true;
  }
  return m;
}

export interface SampleStats { runs: number; games: number; kept: number; inCheck: number; noisy: number; val: number }

/** Replay one game and append its quiet positions. Throws if a move does not round-trip or the events disagree. */
function sampleGame(rec: GameRecord, isVal: boolean, out: number[][], st: SampleStats): void {
  let pos: Position = fromFen(rec.startFen);
  const events = emptyEvents();
  const open = rec.openingPlies ?? 0, total = rec.moves.length;
  const stride = Math.max(MIN_GAP, Math.ceil(Math.max(1, total - open) / PER_GAME));
  const result = Math.round(rec.result * 2); // 0 | 1 | 2
  for (let i = 0; i < total; i++) {
    const lan = rec.moves[i].lan;
    const m = parseLan(pos.board, lan);
    if (toLan(pos, m) !== lan) throw new Error(`game ${rec.gameId} ply ${i}: parsed ${toLan(pos, m)} from ${lan}`);
    if (i >= open && (i - open) % stride === 0) {
      if (inCheck(pos)) st.inCheck++;
      else if (Math.abs(evaluate(pos) - quiesceScore(pos)) > QUIET_CP) st.noisy++;
      else {
        const row = new Array<number>(REC);
        for (let s = 0; s < 64; s++) row[s] = pos.board[s];
        row[64] = pos.turn;
        row[65] = result | (isVal ? VAL_BIT : 0);
        out.push(row);
        st.kept++;
        if (isVal) st.val++;
      }
    }
    const next = makeMove(pos, m);
    countMove(events, pos, m, next);
    pos = next;
  }
  const mismatch = eventsMatch(events, rec.events ?? {});
  if (mismatch) throw new Error(`game ${rec.gameId}: replay disagrees with the stored record (${mismatch})`);
}

async function sample(ids: string[], limitPerRun: number): Promise<SampleStats> {
  mkdirSync(TUNE_DIR, { recursive: true });
  resetSearchState();
  // Validate first, write second, then rename: a refused sample must not truncate the corpus.
  const scans = ids.map(id => {
    const file = paths(id).jsonl;
    const scan = readRun(file);
    if (scan.bad) throw new Error(`[tune] ${id}: ${scan.bad} torn or unreadable line(s); repair the file before sampling`);
    if (scan.mixed) throw new Error(`[tune] ${id}: the file mixes stamps; it cannot fit anything`);
    if (!scan.stamp) throw new Error(`[tune] ${id}: no rule/source stamp (written before stamping existed). Sample a stamped run; see docs/takeover/BASELINE.md`);
    return { id, file, stamp: scan.stamp };
  });
  const tmp = `${POSITIONS}.tmp`;
  const out = createWriteStream(tmp);
  const st: SampleStats = { runs: ids.length, games: 0, kept: 0, inCheck: 0, noisy: 0, val: 0 };
  const fingerprints: { id: string; games: number; rulesKey: string; specKey: string; src: string }[] = [];
  try {
    for (const { id, file, stamp } of scans) {
      // The rules the run actually played, not today's defaults (LESSONS.md 2026-09-13).
      setRules(stamp.rules);
      let inRun = 0;
      const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity });
      const rows: number[][] = [];
      for await (const line of rl) {
        if (!line) continue;
        if (inRun >= limitPerRun) { rl.close(); break; }
        const rec = JSON.parse(line) as GameRecord;
        sampleGame(rec, st.games % VAL_EVERY === 0, rows, st);
        inRun++;
        st.games++;
        if (rows.length > 20000) { out.write(Buffer.from(rows.flat())); rows.length = 0; }
      }
      if (rows.length) out.write(Buffer.from(rows.flat()));
      fingerprints.push({ id, games: inRun, rulesKey: stamp.rulesKey, specKey: stamp.specKey, src: stamp.src });
      console.log(`[tune] ${id.padEnd(20)} ${String(inRun).padStart(6)} games, ${String(st.kept).padStart(7)} positions so far`);
    }
    await new Promise<void>(res => out.end(res));
  } catch (e) {
    out.destroy();
    rmSync(tmp, { force: true });
    throw e;
  }
  renameSync(tmp, POSITIONS);
  setRules();
  writeFileSync(`${TUNE_DIR}/positions.json`, JSON.stringify({
    ...st, runs: fingerprints, sampledBy: sourceId(), file: POSITIONS, bytesPerPosition: REC,
    quietCp: QUIET_CP, perGame: PER_GAME, valEvery: VAL_EVERY,
  }, null, 2) + '\n');
  return st;
}

// -----------------------------------------------------------------------------------------------
// 4. The fit.

const LN10_400 = Math.LN10 / 400;

/** Mean squared error of one slice, and (with `g`) the gradient of the *sum* over it. */
function pass(buf: Uint8Array, k: number, v: Float64Array, g: Float64Array | null, wantVal: boolean): [number, number] {
  let loss = 0, n = 0;
  for (let off = 0; off + REC <= buf.length; off += REC) {
    const flags = buf[off + 65];
    if ((flags >= VAL_BIT) !== wantVal) continue;
    const board = buf.subarray(off, off + 64);
    const turn = buf[off + 64] as Color;
    const r = (flags & 3) / 2;
    const e = evalVector(board, turn, v);
    const sig = 1 / (1 + Math.exp(-k * e * LN10_400));
    const d = sig - r;
    loss += d * d;
    n++;
    if (g) evalVector(board, turn, v, g, 2 * d * sig * (1 - sig) * k * LN10_400);
  }
  return [loss, n];
}

interface Job { v: Float64Array; k: number; grad: boolean }
interface Reply { trainLoss: number; trainN: number; valLoss: number; valN: number; grad: Float64Array | null }

if (!isMainThread && (workerData as { role?: string } | null)?.role === 'tune') {
  setRules();
  const buf = new Uint8Array((workerData as { buf: ArrayBuffer }).buf);
  parentPort!.on('message', (job: Job) => {
    const g = job.grad ? new Float64Array(NPARAM) : null;
    const [trainLoss, trainN] = pass(buf, job.k, job.v, g, false);
    const [valLoss, valN] = pass(buf, job.k, job.v, null, true);
    const reply: Reply = { trainLoss, trainN, valLoss, valN, grad: g };
    parentPort!.postMessage(reply, g ? [g.buffer] : []);
  });
}

/** A pool of workers, each holding a slice of the positions. */
class Pool {
  private readonly workers: Worker[];
  constructor(buf: Uint8Array, n: number) {
    const per = Math.ceil(buf.length / REC / n) * REC;
    this.workers = Array.from({ length: n }, (_, i) => {
      const slice = buf.slice(i * per, Math.min(buf.length, (i + 1) * per));
      const w = tsWorker(new URL(import.meta.url), { workerData: { role: 'tune', buf: slice.buffer }, transferList: [slice.buffer] });
      // Once, not per epoch: a few hundred epochs of `once('error')` is a listener leak.
      w.on('error', e => { console.error(e); process.exit(1); });
      return w;
    });
  }
  /** Mean squared error on both splits; `grad` collects the *sum* of the training gradient. */
  run(v: Float64Array, k: number, grad: Float64Array | null): Promise<{ train: number; val: number; trainN: number }> {
    return new Promise(res => {
      let left = this.workers.length, trainLoss = 0, trainN = 0, valLoss = 0, valN = 0;
      for (const w of this.workers) {
        w.once('message', (r: Reply) => {
          trainLoss += r.trainLoss; trainN += r.trainN; valLoss += r.valLoss; valN += r.valN;
          if (grad && r.grad) for (let i = 0; i < NPARAM; i++) grad[i] += r.grad[i];
          if (--left === 0) res({ train: trainLoss / Math.max(1, trainN), val: valLoss / Math.max(1, valN), trainN });
        });
        w.postMessage({ v, k, grad: !!grad } satisfies Job);
      }
    });
  }
  close(): void { for (const w of this.workers) void w.terminate(); }
}

/**
 * The pawn anchors the scale. K is fitted once and then held, so nothing else stops the whole
 * vector from drifting bigger or smaller, and a centipawn is a unit the rest of the project uses:
 * delta pruning, the adjudication thresholds, Elo per pawn. Texel's own anchor.
 */
const PAWN_ANCHOR = 0;
/** `--freeze weights`: material and the tables only, every hand-set weight left alone. */
const frozenSet = (freeze?: string): Set<number> => {
  const f = new Set([PAWN_ANCHOR]);
  if (freeze === 'weights') for (let i = MOB0; i < NPARAM; i++) f.add(i);
  return f;
};

/** Per-parameter regularisation scale: how far a group may drift before the penalty bites. */
function scales(): Float64Array {
  const s = new Float64Array(NPARAM).fill(10);
  for (let i = 0; i < NMAT; i++) s[i] = 100;
  for (let i = PST0; i < MOB0; i++) s[i] = 30;
  s[PHASE_I] = 1000;
  return s;
}

export interface FitResult {
  tag: string; k: number; lambda: number; epochs: number;
  before: { train: number; val: number };
  after: { train: number; val: number };
  v: Float64Array;
}

async function fit(pool: Pool, v0: Float64Array, k: number, lambda: number, epochs: number, lr0: number, frozen: Set<number>, tag: string): Promise<FitResult> {
  const sc = scales();
  const lrScale = new Float64Array(NPARAM).fill(1);
  lrScale[PHASE_I] = 20; // phaseMax lives at ~5600; one Adam step is one unit
  const v = Float64Array.from(v0);
  const m = new Float64Array(NPARAM), s = new Float64Array(NPARAM), grad = new Float64Array(NPARAM);
  const before = await pool.run(v, k, null);
  let best = Float64Array.from(v), bestVal = before.val, last = before;
  for (let e = 1; e <= epochs; e++) {
    grad.fill(0);
    const loss = await pool.run(v, k, grad);
    const lr = 0.05 * lr0 + 0.95 * lr0 * 0.5 * (1 + Math.cos((Math.PI * e) / epochs));
    for (let i = 0; i < NPARAM; i++) {
      if (frozen.has(i)) continue;
      const gi = grad[i] / loss.trainN + (2 * lambda * (v[i] - v0[i])) / (sc[i] * sc[i]);
      m[i] = 0.9 * m[i] + 0.1 * gi;
      s[i] = 0.999 * s[i] + 0.001 * gi * gi;
      v[i] -= (lr * lrScale[i] * (m[i] / (1 - 0.9 ** e))) / (Math.sqrt(s[i] / (1 - 0.999 ** e)) + 1e-8);
    }
    last = loss;
    if (loss.val < bestVal) { bestVal = loss.val; best = Float64Array.from(v); }
    if (e % 25 === 0 || e === 1) console.log(`[tune] epoch ${String(e).padStart(4)}  lr ${lr.toFixed(3)}  train ${loss.train.toFixed(6)}  val ${loss.val.toFixed(6)}`);
  }
  best = best.map(x => Math.round(x));
  const after = await pool.run(best, k, null);
  console.log(`[tune] ${tag}: train ${before.train.toFixed(6)} -> ${after.train.toFixed(6)}, val ${before.val.toFixed(6)} -> ${after.val.toFixed(6)} (last epoch val ${last.val.toFixed(6)})`);
  return { tag, k, lambda, epochs, before, after, v: best };
}

/** Grid then golden-section on K, with the parameters held at today's values. */
async function fitK(pool: Pool, v: Float64Array): Promise<number> {
  let lo = 0.2, hi = 3.0;
  const at = async (k: number): Promise<number> => (await pool.run(v, k, null)).train;
  for (let i = 0; i < 24; i++) {
    const a = lo + (hi - lo) * 0.382, b = lo + (hi - lo) * 0.618;
    if (await at(a) < await at(b)) hi = b; else lo = a;
    if (hi - lo < 0.002) break;
  }
  return +((lo + hi) / 2).toFixed(3);
}

// -----------------------------------------------------------------------------------------------
// 5. Apply: the fitted numbers, back into src/ai/eval.ts.

const ints = (xs: readonly number[]): number[] => xs.map(x => Math.round(x));

/** The file writes rank 8 first, so the table reads like a board; `table()` flips it back. */
function tableText(t: readonly number[]): string {
  const rounded = ints(t);
  const w = Math.max(3, ...rounded.map(x => String(x).length));
  const rows: string[] = [];
  for (let r = 7; r >= 0; r--) {
    rows.push(' ' + rounded.slice(r * 8, r * 8 + 8).map(x => String(x).padStart(w)).join(',') + ',');
  }
  return rows.join('\n');
}

function rewrite(src: string, p: EvalParams): string {
  const v = (l: string): number => Math.round(p.values[l]);
  const sub = (re: RegExp, text: string): void => {
    if (!re.test(src)) throw new Error(`tune apply: ${EVAL_SRC} has no match for ${re}`);
    src = src.replace(re, text);
  };
  sub(/export const PAWN_V = .*?;/,
    `export const PAWN_V = ${v('P')}, KNIGHT_V = ${v('N')}, BISHOP_V = ${v('B')}, ROOK_V = ${v('R')}, QUEEN_V = ${v('Q')};`);
  sub(/export const ARCHER_V = .*?;/,
    `export const ARCHER_V = ${v('A')}, PALADIN_V = ${v('L')}, GUARD_V = ${v('G')}, MAESTER_V = ${v('M')}, BEAST_V = ${v('S')};`);
  for (const l of PST_LETTERS) sub(new RegExp(`PST\\[${l}\\] = table\\(\\[[\\s\\S]*?\\]\\);`), `PST[${l}] = table([\n${tableText(p.pst[l])}\n]);`);
  sub(/const KING_MG = table\(\[[\s\S]*?\]\);/, `const KING_MG = table([\n${tableText(p.kingMg)}\n]);`);
  sub(/const KING_EG = table\(\[[\s\S]*?\]\);/, `const KING_EG = table([\n${tableText(p.kingEg)}\n]);`);
  sub(/export let TEMPO = \d+;/, `export let TEMPO = ${Math.round(p.tempo)};`);
  sub(/MOB\[B\] = .*?;$/m,
    `MOB[B] = ${Math.round(p.mob.B)}; MOB[R] = ${Math.round(p.mob.R)}; MOB[Q] = ${Math.round(p.mob.Q)}; MOB[L] = ${Math.round(p.mob.L)};`);
  sub(/let BEAST_TARGET = .*?;/, `let BEAST_TARGET = ${Math.round(p.beastTarget)}, BEAST_TARGET_MAX = ${Math.round(p.beastTargetMax)};`);
  sub(/let SHIELD_PAWN = .*?;/,
    `let SHIELD_PAWN = ${Math.round(p.shield.pawn)}, SHIELD_GUARD = ${Math.round(p.shield.guard)}, SHIELD_OTHER = ${Math.round(p.shield.other)}, SHIELD_OPEN = ${Math.round(p.shield.open)};`);
  sub(/const MAESTER_NEAR_KING = \[.*?\];/, `const MAESTER_NEAR_KING = [0, ${Math.round(p.maesterNearKing[1])}, ${Math.round(p.maesterNearKing[2])}];`);
  sub(/let PHASE_MAX = \d+;/, `let PHASE_MAX = ${Math.round(p.phaseMax)};`);
  return src;
}

/** Write `params.json` into eval.ts, then re-import the file and check it reads back the same. */
async function apply(): Promise<void> {
  const p = JSON.parse(readFileSync(PARAMS, 'utf8')) as EvalParams;
  if (!existsSync(BASE)) throw new Error(`tune apply: ${BASE} is missing — run the fit first, it saves the untuned evaluation`);
  if (!existsSync(`${TUNE_DIR}/eval-before.ts`)) copyFileSync(EVAL_SRC, `${TUNE_DIR}/eval-before.ts`);
  writeFileSync(EVAL_SRC, rewrite(readFileSync(EVAL_SRC, 'utf8'), p));
  const fresh = await import(`${pathToFileURL(resolvePath(EVAL_SRC)).href}?t=${Date.now()}`) as typeof import('../ai/eval');
  const got = toVector(fresh.evalParams()), want = toVector(p);
  for (let i = 0; i < NPARAM; i++) {
    if (got[i] !== Math.round(want[i])) throw new Error(`tune apply: parameter ${i} read back as ${got[i]}, wrote ${Math.round(want[i])}`);
  }
  console.log(`[tune] ${EVAL_SRC} written and verified (${NPARAM} parameters); the untuned copy is in ${TUNE_DIR}/eval-before.ts`);
}

// -----------------------------------------------------------------------------------------------
// 6. The match: tuned against untuned, colour-swapped pairs, one process, one table each ply.

async function match(id: string, games: number, depth: number, seed: number, workers: number, tuned = PARAMS, base = BASE): Promise<void> {
  const { run } = await import('./run');
  const { armStats } = await import('./experiments');
  const { readRecords } = await import('./analyze');
  const spec: RunSpec = {
    id, games, seed, ai: { depth }, pairs: true,
    backRanks: { sample: Math.ceil(games / 2) },
    openingRandomPlies: DEFAULTS.openingRandomPlies, maxPlies: DEFAULTS.maxPlies,
    evalParams: { white: tuned, black: base },
  };
  await run(spec, workers);
  const a = armStats('tuned', readRecords(paths(id).jsonl));
  console.log(`\n[tune] ${id}: ${a.games} games, ${a.pairs} pairs, pentanomial [${a.counts.join(', ')}]`);
  console.log(`[tune] tuned score ${a.mu.toFixed(3)}  Elo ${a.elo >= 0 ? '+' : ''}${a.elo.toFixed(0)} ± ${a.err95.toFixed(0)}  nElo ${a.nElo.toFixed(0)}  LOS ${(100 * a.los).toFixed(1)}%  draws ${(100 * a.draws).toFixed(1)}%  plies ${a.plies.toFixed(0)}\n`);
  writeFileSync(`${OUT_DIR}/${id}.tuned.json`, JSON.stringify(a, null, 2) + '\n');
}

// -----------------------------------------------------------------------------------------------
// 7. CLI.

async function main(argv: string[]): Promise<void> {
  const cmd = argv[0]?.startsWith('--') ? 'help' : argv[0] ?? 'help';
  const f = parseFlags(argv);
  const num = (k: string, d: number): number => (typeof f[k] === 'string' ? Number(f[k]) : d);
  const workers = num('workers', availableParallelism());

  if (cmd === 'sample') {
    // `--runs` is required for the same reason as in `gen.ts`: a stored spec's `rules: {}` is the
    // defaults of the day, not today's, so no filter over specs can name a run of this game. The
    // old `v06Runs()` heuristic was exactly that filter and was removed (LESSONS.md 2026-09-13).
    if (typeof f.runs !== 'string') throw new Error('tune sample: --runs a,b is required (a stored spec cannot say which rules a run played)');
    const ids = f.runs.split(',');
    console.log(`[tune] runs: ${ids.join(', ')}`);
    const st = await sample(ids, num('perRun', Infinity));
    console.log(`[tune] ${st.games} games -> ${st.kept} positions (${st.val} held out), skipped ${st.inCheck} in check and ${st.noisy} noisy`);
    return;
  }

  if (cmd === 'fit') {
    const buf = readFileSync(POSITIONS);
    const all = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    console.log(`[tune] ${all.length / REC} positions, ${workers} workers`);
    const v0 = toVector(evalParams());
    writeFileSync(BASE, JSON.stringify(fromVector(v0), null, 1) + '\n');
    const pool = new Pool(all, workers);
    const t0 = Date.now();
    const k = typeof f.k === 'string' ? Number(f.k) : await fitK(pool, v0);
    console.log(`[tune] K = ${k} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
    const lambdas = typeof f.lambda === 'string' ? f.lambda.split(',').map(Number) : [0, 1e-5, 1e-4];
    const epochs = num('epochs', 400), lr = num('lr', 2);
    const freeze = typeof f.freeze === 'string' ? f.freeze : undefined;
    const runs: FitResult[] = [];
    for (const l of lambdas) {
      const tag = `l${l}${freeze ? `-${freeze}` : ''}`;
      const r = await fit(pool, v0, k, l, epochs, lr, frozenSet(freeze), tag);
      // Kept per lambda as well as the best: validation error ranks them, a match decides.
      writeFileSync(`${TUNE_DIR}/params-${tag}.json`, JSON.stringify(fromVector(r.v), null, 1) + '\n');
      runs.push(r);
    }
    const best = runs.reduce((a, b) => (b.after.val < a.after.val ? b : a));
    pool.close();
    writeFileSync(PARAMS, JSON.stringify(fromVector(best.v), null, 1) + '\n');
    writeFileSync(FIT, JSON.stringify({
      k, epochs, lr, positions: all.length / REC, workers, seconds: +((Date.now() - t0) / 1000).toFixed(1),
      chosen: best.tag,
      runs: runs.map(r => ({ tag: r.tag, lambda: r.lambda, before: r.before, after: r.after })),
    }, null, 2) + '\n');
    console.log(`[tune] chose ${best.tag}; wrote ${PARAMS} and ${FIT} in ${((Date.now() - t0) / 1000 / 60).toFixed(1)} min`);
    return;
  }

  if (cmd === 'apply') return apply();
  if (cmd === 'match') {
    return match(typeof f.id === 'string' ? f.id : `tuned-d${num('depth', 3)}`, num('games', 400), num('depth', 3), num('seed', 3001), workers,
      typeof f.tuned === 'string' ? f.tuned : PARAMS, typeof f.base === 'string' ? f.base : BASE);
  }
  console.log('usage: tsx src/sim/tune.ts <sample|fit|apply|match> [--workers n] [--games n] [--depth n] [--epochs n] [--lambda a,b,c]');
}

if (isMainThread && process.argv[1] && fileURLToPath(import.meta.url) === resolvePath(process.argv[1])) {
  main(process.argv.slice(2)).catch(e => { console.error(e); process.exitCode = 1; });
}
