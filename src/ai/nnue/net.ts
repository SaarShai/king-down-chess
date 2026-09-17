/**
 * NNUE inference: a small perspective net, Int16 weights, integer arithmetic only.
 *
 * Shape `1408 -> 32x2 -> 1`. The input is the board as seen by the side to move: for each of the
 * 2 relations (mine / theirs) x 11 piece types x 64 squares, one bit. Black's view is the board
 * mirrored top-to-bottom (`s ^ 56`), so one net plays both colours and the evaluation is exactly
 * colour-symmetric by construction. **No king buckets**, so nothing ever forces a refresh
 * (docs/research/ai-players.md §1).
 *
 * Both perspectives are accumulated, concatenated `[mine, theirs]` and read by one output row.
 * `crelu` is `clamp(x, 0, QA)`.
 *
 * Quantisation: `w1_int = round(w1 * QA)`, `w2_int = round(w2 * QB)`, accumulator in Int32 (the
 * *weights* are Int16; the running sum is not, which costs nothing in JS and removes every
 * overflow question). `QA = QB = 1024`, not the hobby 255/64 [CPW NNUE]: those are sized for an
 * int8 output layer, and at 255/64 the round-off of this net is about 10 cp — the trainer-parity
 * test in `net.test.ts` asks for 1.
 *
 * Deterministic: integers in, integers out, no clock, no randomness.
 */
import { Color, WHITE } from '../../rules/engine';
import { NET_B64, NET_KIND } from './weights';

export const HIDDEN = 32;
/** 2 relations x 11 piece types x 64 squares. */
export const INPUTS = 2 * 11 * 64;
export const QA = 16384, QB = 4096, SCALE = 400;
/** Int16 headroom: a weight may not leave this range once scaled. */
export const W_MAX = 32767;

/**
 * What a loaded net predicts: the whole evaluation (`full`, the 2026-09-13 net) or a bounded
 * correction to the linear one (`residual`). The two are not interchangeable — adding a `full` net
 * to the linear evaluation counts every piece twice — so the kind rides with the blob and
 * `setEvaluator` refuses the wrong pairing instead of playing nonsense.
 */
export type NetKind = 'full' | 'residual';

/**
 * How far a residual net may move the evaluation, in centipawns, either way.
 *
 * 150 is about the span of the *whole* positional part of the hand evaluation (tables, mobility,
 * shield, king), and a sixth of a queen: the net can add judgement and can never outvote a piece.
 * Two leaves can differ by at most 2 x this on the net's account, so every piece above the pawn
 * keeps its ordering by construction — which is the failure `docs/research/ai-nnue-2026-09-13.md`
 * §5 measured (the first net priced a queen at 60% and traded into losses). The trainer reads the
 * same constant, so the target it fits is one the engine can express.
 */
export const RESIDUAL_MAX = 150;

/** Feature-transformer weights, feature-major: `FT[f * HIDDEN + i]`. */
const FT = new Int16Array(INPUTS * HIDDEN);
const FT_BIAS = new Int16Array(HIDDEN);
/** `[mine (HIDDEN), theirs (HIDDEN)]`. */
const OUT_W = new Int16Array(2 * HIDDEN);
let OUT_B = 0;

/** Feature index for a piece of type `t` (1…11), colour `c`, on square `s`, seen by `us`. */
export const featureIndex = (t: number, c: Color, s: number, us: Color): number =>
  (((c === us ? 0 : 11) + t - 1) << 6) | (us === WHITE ? s : s ^ 56);

const accMine = new Int32Array(HIDDEN);
const accTheirs = new Int32Array(HIDDEN);

/**
 * Centipawns from `turn`'s point of view. Full refresh per call: 32 pieces x 32 weights x 2
 * perspectives is about 2k integer adds, and at fixed depth — which is how every match here is
 * played — a slower evaluation costs no strength at all. The incremental version only buys nodes
 * per second; see the speed section of docs/research/ai-nnue-2026-09-13.md.
 */
export function nnueEval(board: Uint8Array, turn: Color): number {
  for (let i = 0; i < HIDDEN; i++) { accMine[i] = FT_BIAS[i]; accTheirs[i] = FT_BIAS[i]; }
  for (let s = 0; s < 64; s++) {
    const p = board[s];
    if (!p) continue;
    const t = (p & 15) - 1, c = ((p >> 4) & 1) as Color;
    // The net has 11 types. A type it was never trained on would silently alias onto another one's
    // features (type 12 lands on "their pawn"), so say so instead: this net cannot play the lab
    // pieces, and `setEvaluator('linear')` — the default — is how a run with them is played.
    if (t >= 11) throw new Error(`nnueEval: piece type ${t + 1} is outside the net's ${11} types (retrain, or use the linear evaluator)`);
    const mine = c === turn ? 0 : 11;
    const relUs = turn === WHITE ? s : s ^ 56;
    let o = (((mine + t) << 6) | relUs) * HIDDEN;
    for (let i = 0; i < HIDDEN; i++) accMine[i] += FT[o + i];
    o = ((((11 - mine) + t) << 6) | (relUs ^ 56)) * HIDDEN;
    for (let i = 0; i < HIDDEN; i++) accTheirs[i] += FT[o + i];
  }
  let sum = OUT_B * QA; // the bias is stored at QB scale; the sum lives at QA*QB
  for (let i = 0; i < HIDDEN; i++) {
    const a = accMine[i] < 0 ? 0 : accMine[i] > QA ? QA : accMine[i];
    const b = accTheirs[i] < 0 ? 0 : accTheirs[i] > QA ? QA : accTheirs[i];
    sum += a * OUT_W[i] + b * OUT_W[HIDDEN + i];
  }
  return Math.round((sum * SCALE) / (QA * QB));
}

// ---------------------------------------------------------------------------------------------
// The weight blob. One base64 line of little-endian Int16, in the order FT, FT_BIAS, OUT_W, OUT_B.

export const N_WEIGHTS = INPUTS * HIDDEN + HIDDEN + 2 * HIDDEN + 1;

export function packNet(w: Int16Array): string {
  if (w.length !== N_WEIGHTS) throw new Error(`net: expected ${N_WEIGHTS} weights, got ${w.length}`);
  const bytes = new Uint8Array(w.buffer, w.byteOffset, w.byteLength);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

/** Load a base64 blob into the live tables, and say what its output means. */
export function loadNet(b64: string, kind: NetKind = 'full'): void {
  const bin = atob(b64);
  if (bin.length !== N_WEIGHTS * 2) throw new Error(`net: blob is ${bin.length} bytes, expected ${N_WEIGHTS * 2}`);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const w = new Int16Array(bytes.buffer);
  let o = 0;
  FT.set(w.subarray(o, o += INPUTS * HIDDEN));
  FT_BIAS.set(w.subarray(o, o += HIDDEN));
  OUT_W.set(w.subarray(o, o += 2 * HIDDEN));
  OUT_B = w[o];
  KIND = kind;
  CURRENT_B64 = b64;
}

let KIND: NetKind = 'full';
/** What the net now in memory predicts. */
export const netKind = (): NetKind => KIND;

/**
 * The blob now loaded, or null when none is. `setEvalParams` compares against it, so a per-ply
 * evaluation swap does not re-parse a 118 kB base64 string at every move; `arms` embeds it in each
 * arm file so a recorded match can be reproduced from the files alone.
 */
let CURRENT_B64: string | null = null;
export const loadedNetB64 = (): string | null => CURRENT_B64;
export const netBlob = (): { b64: string; kind: NetKind } | null => (CURRENT_B64 ? { b64: CURRENT_B64, kind: KIND } : null);

/** True once a real net is loaded; an all-zero blob is the "not trained yet" placeholder. */
export let netLoaded = false;

if (NET_B64) { loadNet(NET_B64, NET_KIND); netLoaded = true; }
