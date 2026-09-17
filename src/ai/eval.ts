/**
 * Static evaluation for the King Down AI.
 *
 * Terms: material, piece-square tables, slider mobility, beast targets, king shield, maester
 * proximity, tempo. All from White's point of view internally, negated for Black at the end.
 * No file-indexed opening knowledge anywhere: the back rank is randomised, so tables are
 * left-right symmetric and encode only centrality and advancement.
 */
import { A, B, C, Color, G, K, L, M, N, O, P, PieceType, Position, Q, R, S, WHITE, canCapture, colorOf, typeOf } from '../rules/engine';
import { NetKind, RESIDUAL_MAX, netKind, netLoaded, nnueEval } from './nnue/net';

/*
 * Material values (centipawns). **Every number in this file is fitted, not reasoned** — and every
 * number below the values too: the tables, the weights, the phase point.
 *
 * Texel's method on 583,868 quiet positions from 28,600 of our own games under the shipped rules,
 * minimising (result - sigmoid(K x eval))^2; the fit is `src/sim/tune.ts`, the pass is
 * docs/research/sim-tuning-2026-09-13.md, and `npm run tune:apply` is what wrote the numbers here.
 * It bought +113 +- 27 Elo at depth 3 and +117 +- 33 at depth 4 against the hand-set evaluation it
 * replaced. **The pawn is the anchor at 100** and the fit is not allowed to move it: a centipawn
 * has to keep meaning what delta pruning, the adjudication thresholds and Elo-per-pawn assume.
 *
 * The previous values came from Muller's fixed-point iteration — one odds arm per fairy piece
 * against a knight (docs/research/sim-buffed-2026-09-13.md §2). That method reads a piece only
 * through the games it decides, so it never closed on the guard (a bound, "under 1.70 pawns") and
 * it costs an hour of play per pass; the fit sees every piece in every position and costs a minute.
 * Re-run under the tuned engine the odds arms now read A 3.43 +- 0.54 · L 2.21 +- 0.52 · G < 1.46
 * · M 2.18 +- 0.53 · S 2.67 +- 0.54 pawns, against a knight that is itself 2.96 pawns: the two
 * methods agree on the direction for the guard and the beast and not yet on the maester, and the
 * fixed point is **not** converged under this engine (sim-tuning §6). The prose below is unchanged
 * — it says what each piece does, which is why the numbers land where they do.
 *
 * ARCHER  — a 1-step walker in any direction, but it captures *without moving*, through blockers,
 *           on the four diagonal neighbours and the four squares two away orthogonally. There is no
 *           recapture square, so "defended" is no defence against it and it can never be traded
 *           off by the piece it takes. It also checks unblockably. Against that: its shooting set
 *           keeps square colour and its own orthogonal neighbours are a blind spot. Worth a minor
 *           once it can leave the back rank; its survival halves (73% -> 50%) because it can now
 *           be met in the open, which is what makes it priceable at all.
 * PALADIN — queen lines that ignore friendly pieces, yet every capture removes it as well and it
 *           can never take a king (so it neither checks nor mates). Practically: enormous board
 *           control plus one guaranteed 1-for-1 trade with the best piece it can reach. Measured
 *           just below a bishop: the cash-in is worth a piece, the threat a little more, and it
 *           contributes nothing to mating.
 * GUARD   — only an enemy king can capture it, and it captures nothing but one pawn in its whole
 *           life. A wall that walks: it can block a check line forever and shelter a king. Almost
 *           never lost, which is exactly why it is not worth a minor — an army that cannot be
 *           taken also cannot trade. The one capture is where its value sits: the cap kept 55% of
 *           the uncapped pair's Elo for 30% of the captures.
 * MAESTER — a commoner (king-move attacker, ~a knight in the endgame) plus two utilities: it swaps
 *           with any friendly neighbour, and it swaps with its own king across the first rank,
 *           which is this game's only way to evacuate a king in one move. The one piece the first
 *           pass left where its prior put it.
 * BEAST   — 1 step in any direction to an empty square, captures on the seven neighbours that are
 *           not straight ahead, and may chain. Stepping sideways and backwards triples its
 *           activity (3.6 -> 10.8 moves a game) and lifts it from "often simply stuck" to a real
 *           minor; chains of four or more are still rare (0.8% of games), so they are a highlight,
 *           not the value.
 */
export const PAWN_V = 100, KNIGHT_V = 316, BISHOP_V = 322, ROOK_V = 449, QUEEN_V = 933;
export const ARCHER_V = 337, PALADIN_V = 326, GUARD_V = 96, MAESTER_V = 320, BEAST_V = 308;
/**
 * **Untuned seeds, not fitted numbers** — the only two in this file. The ogre and the catapult are
 * lab pieces (2026-09-14): they are not in `POOL`, no game in the Texel corpus contains one, and
 * their tables are all zero. 300 is "a shade under a minor, like the other one-steppers"; 400 is
 * "between a minor and a rook", the middle of the 3.5–4.5 pawn guess in `docs/PIECES-PROPOSED.md`.
 * The odds arms in `docs/research/sim-new-pieces-2026-09-14.md` price them; re-seed from there
 * before either piece is ever played for real.
 */
export const OGRE_V = 300, CATAPULT_V = 400;

const VAL = new Int32Array(14);
VAL[P] = PAWN_V; VAL[N] = KNIGHT_V; VAL[B] = BISHOP_V; VAL[R] = ROOK_V; VAL[Q] = QUEEN_V; VAL[K] = 0;
VAL[A] = ARCHER_V; VAL[L] = PALADIN_V; VAL[G] = GUARD_V; VAL[M] = MAESTER_V; VAL[S] = BEAST_V;
VAL[O] = OGRE_V; VAL[C] = CATAPULT_V;

/** Piece value by type; kept as a record for compatibility with the tier-1 API. */
export const VALUES: Record<number, number> = {
  [P]: PAWN_V, [N]: KNIGHT_V, [B]: BISHOP_V, [R]: ROOK_V, [Q]: QUEEN_V, [K]: 0,
  [A]: ARCHER_V, [L]: PALADIN_V, [G]: GUARD_V, [M]: MAESTER_V, [S]: BEAST_V,
  [O]: OGRE_V, [C]: CATAPULT_V,
};

/** The shipped values by letter, so `setPieceValues()` with no argument restores them exactly. */
const DEFAULT_V: Readonly<Record<string, number>> = Object.freeze({
  P: PAWN_V, N: KNIGHT_V, B: BISHOP_V, R: ROOK_V, Q: QUEEN_V, K: 0,
  A: ARCHER_V, L: PALADIN_V, G: GUARD_V, M: MAESTER_V, S: BEAST_V, O: OGRE_V, C: CATAPULT_V,
});
const TYPE_BY_LETTER: Readonly<Record<string, PieceType>> = Object.freeze({ P, N, B, R, Q, K, A, L, G, M, S, O, C });

/**
 * Runtime material values, for the balance lab only (`--values A=270,G=180`). Two tables are
 * derived from the constants above — the hot `VAL` array and the exported `VALUES` record — so both
 * are rebuilt **in place**, which keeps every importer's binding (`src/ai/search.ts` reads `VALUES`
 * in its move ordering). Resets to the shipped defaults first, so a call with no argument restores
 * today's engine and no call at all changes nothing.
 *
 * Module-level state, like `setRules` in `src/rules/rules.ts`, and for the same reason: the hot
 * paths take a bare `Uint8Array`, not a carrier for per-run options. One value set per thread is
 * enough — each simulation worker is its own module instance and sets the values before it plays;
 * the browser never calls this.
 */
export function setPieceValues(over?: Readonly<Record<string, number>>): void {
  for (const letter of Object.keys(TYPE_BY_LETTER)) {
    const t = TYPE_BY_LETTER[letter];
    const v = over?.[letter] ?? DEFAULT_V[letter];
    VAL[t] = v;
    VALUES[t] = v;
  }
}

/**
 * Weights for the non-material terms, all in centipawns.
 *
 * `let`, not `const`, for the same reason as `VAL`: `setEvalParams()` at the bottom of this file
 * swaps the whole set at runtime, which is how a tuned-against-untuned match plays both sides in
 * one process. Nothing reassigns them in the browser.
 */
export let TEMPO = 0;
const MOB = new Int32Array(12); // per pseudo-legal slider destination
MOB[B] = 0; MOB[R] = 2; MOB[Q] = -1; MOB[L] = 1;
let BEAST_TARGET = 10, BEAST_TARGET_MAX = 18;
let SHIELD_PAWN = 9, SHIELD_GUARD = 25, SHIELD_OTHER = 5, SHIELD_OPEN = 3;
const MAESTER_NEAR_KING = [0, 8, 7]; // by Chebyshev distance 0/1/2
/** Non-pawn material (both sides) at which the king table is fully "middlegame". */
let PHASE_MAX = 5681;

/** Rows are written rank 8 first so the table reads like a board; flipped into a1=0 indexing. */
const table = (rows: number[]): Int16Array => {
  const t = new Int16Array(64);
  for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) t[(7 - r) * 8 + f] = rows[r * 8 + f];
  return t;
};

const PST: Int16Array[] = [];

PST[P] = table([
   0,  0,  0,  0,  0,  0,  0,  0,
 108,101, 95, 95, 95, 95,101,108,
  48, 53, 49, 52, 52, 49, 53, 48,
  32, 16, 14, 15, 15, 14, 16, 32,
  24, 11, -3,  6,  6, -3, 11, 24,
  26, 12,  3, -1, -1,  3, 12, 26,
  20,  3, -7, -7, -7, -7,  3, 20,
   0, -2, -1,  4,  4, -1, -2,  0,
]);

PST[N] = table([
 -49,-35,-25,-25,-25,-25,-35,-49,
 -35,-15,  1,  6,  6,  1,-15,-35,
 -24,  5, 14, 21, 21, 14,  5,-24,
 -21, 12, 16, 23, 23, 16, 12,-21,
 -27,  3, 19, 24, 24, 19,  3,-27,
 -22, -3, 11, 10, 10, 11, -3,-22,
 -35,-15, -2,  6,  6, -2,-15,-35,
 -46,-33,-21,-10,-10,-21,-33,-46,
]);

PST[B] = table([
 -19,-11,-10,-10,-10,-10,-11,-19,
 -12,  5, -2,  0,  0, -2,  5,-12,
 -11,  8,  7, 10, 10,  7,  8,-11,
 -11, -2,  7, 13, 13,  7, -2,-11,
  -8,  4,  3, 11, 11,  3,  4, -8,
 -12,  1,  4, 16, 16,  4,  1,-12,
 -11, -4,  5,  0,  0,  5, -4,-11,
 -19, -4, -6, -6, -6, -6, -4,-19,
]);

PST[R] = table([
  -1, -1,  0,  4,  4,  0, -1, -1,
   8, 13, 15, 16, 16, 15, 13,  8,
   2,  0,  1,  3,  3,  1,  0,  2,
   0,  1,  1,  2,  2,  1,  1,  0,
  -4, -2, -1,  0,  0, -1, -2, -4,
  -1,  1,  0,  1,  1,  0,  1, -1,
  -6, -1,  0,  0,  0,  0, -1, -6,
  -2,  2,  8, 12, 12,  8,  2, -2,
]);

PST[Q] = table([
 -20,-10,-10, -6, -6,-10,-10,-20,
 -10,  0,  1,  0,  0,  1,  0,-10,
 -10,  1,  6,  5,  5,  6,  1,-10,
  -4, -1,  3,  6,  6,  3, -1, -4,
  -7, -4,  5,  3,  3,  5, -4, -7,
 -11, -3,  1,  7,  7,  1, -3,-11,
  -9, -1,  2,  2,  2,  2, -1, -9,
 -19, -5, -5, -2, -2, -5, -5,-19,
]);

/** Archer: central and advanced posts put the most enemies inside its eight rifle squares. */
PST[A] = table([
   0,  5, 10, 12, 12, 10,  5,  0,
   5, 15, 23, 26, 26, 23, 15,  5,
   9, 23, 31, 35, 35, 31, 23,  9,
  11, 27, 29, 34, 34, 29, 27, 11,
   9, 22, 33, 31, 31, 33, 22,  9,
   4, 20, 21, 20, 20, 21, 20,  4,
   4, 10,  9, 15, 15,  9, 10,  4,
 -18, -7,  0, -1, -1,  0, -7,-18,
]);

/** Paladin: it jumps friends and is stopped by enemies, so it belongs behind its own army. */
PST[L] = table([
 -15,-15,-15,-15,-15,-15,-15,-15,
 -10,-10,-10,-10,-10,-10,-10,-10,
  -6, -6, -5, -6, -6, -5, -6, -6,
   0, -1,  1,  1,  1,  1, -1,  0,
   2,  3,  7,  5,  5,  7,  3,  2,
   3, 11, 11, 11, 11, 11, 11,  3,
   5, 11, 12, 15, 15, 12, 11,  5,
   7, 12, 13, 14, 14, 13, 12,  7,
]);

/** Guard: a wall, not a raider. Home ranks only; the real bonus is the king-shield term. */
PST[G] = table([
 -30,-30,-30,-30,-30,-30,-30,-30,
 -25,-25,-25,-25,-25,-25,-25,-25,
 -20,-20,-20,-20,-20,-20,-20,-20,
 -12,-13,-11,-14,-14,-11,-13,-12,
  -4, -5, -7, -7, -7, -7, -5, -4,
  -1, -2,  5,  5,  5,  5, -2, -1,
  -3,  4,  7,  3,  3,  7,  4, -3,
   9,  5, 11, -2, -2, 11,  5,  9,
]);

/** Maester: slow, so keep it in its own half; the proximity term pulls it towards its king. */
PST[M] = table([
 -20,-15,-12,-10,-10,-12,-15,-20,
 -15, -8, -5, -1, -1, -5, -8,-15,
 -10, -1,  4,  7,  7,  4, -1,-10,
  -4,  5, 11, 14, 14, 11,  5, -4,
   1,  8, 14, 21, 21, 14,  8,  1,
   3, 10, 10, 15, 15, 10, 10,  3,
  10,  4,  3,  6,  6,  3,  4, 10,
   0,  2, -3,  3,  3, -3,  2,  0,
]);

/** Beast: forward posts. It cannot retreat, so the last rank (nothing left to eat) is not a prize. */
PST[S] = table([
   5,  9, 12, 14, 14, 12,  9,  5,
  13, 24, 29, 33, 33, 29, 24, 13,
  10, 25, 30, 35, 35, 30, 25, 10,
   5, 18, 27, 34, 34, 27, 18,  5,
   4, 14, 22, 30, 30, 22, 14,  4,
  -2,  5, 16, 23, 23, 16,  5, -2,
  -5, -5,  4,  4,  4,  4, -5, -5,
 -23,-14, -9,-10,-10, -9,-14,-23,
]);

/**
 * Ogre and catapult: no table at all. Untuned lab pieces (see `OGRE_V`), and a zero table is an
 * honest "the fit has never seen one" — they are also left out of `PST_LETTERS`, so the tuner does
 * not fit them and an `EvalParams` file written before they existed still loads.
 */
PST[O] = new Int16Array(64);
PST[C] = new Int16Array(64);

/** King: hide behind the army while the board is full, walk to the centre once it empties. */
const KING_MG = table([
 -40,-40,-40,-40,-40,-40,-40,-40,
 -40,-40,-40,-40,-40,-40,-40,-40,
 -35,-35,-35,-35,-35,-35,-35,-35,
 -30,-30,-30,-30,-30,-30,-30,-30,
 -25,-25,-25,-26,-26,-25,-25,-25,
 -12,-16,-18,-22,-22,-18,-16,-12,
   0,  1, -5,-16,-16, -5,  1,  0,
  12, 13, -1, -5, -5, -1, 13, 12,
]);

const KING_EG = table([
 -40,-25,-15,-10,-10,-15,-25,-40,
 -25, -9,  0,  6,  6,  0, -9,-25,
 -14,  1, 13, 21, 21, 13,  1,-14,
  -9,  9, 22, 21, 21, 22,  9, -9,
 -10,  7, 19, 17, 17, 19,  7,-10,
 -14,  0, 12, 17, 17, 12,  0,-14,
 -24,-11, -1,  2,  2, -1,-11,-24,
 -38,-26,-19,-12,-12,-19,-26,-38,
]);

const DIRS: readonly (readonly [number, number])[] = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
const step = (s: number, df: number, dr: number): number => {
  const f = (s & 7) + df, r = (s >> 3) + dr;
  return f < 0 || f > 7 || r < 0 || r > 7 ? -1 : (r << 3) | f;
};

/** Pseudo-legal destinations for a slider, x its weight. The paladin slides through friends. */
function mobility(board: Uint8Array, from: number, t: PieceType, c: Color): number {
  const lo = t === B ? 4 : 0, hi = t === R ? 4 : 8;
  let n = 0;
  for (let d = lo; d < hi; d++) {
    const [df, dr] = DIRS[d];
    for (let to = step(from, df, dr); to >= 0; to = step(to, df, dr)) {
      const v = board[to];
      if (!v) { n++; continue; }
      if (t === L) { if (colorOf(v) === c) continue; n++; break; } // jumps friends, stopped by enemies
      if (colorOf(v) !== c) n++;
      break;
    }
  }
  return n * MOB[t];
}

/** A beast is only as good as what stands next to it. */
function beastTargets(board: Uint8Array, from: number, c: Color): number {
  const ahead = c === WHITE ? 1 : -1;
  let n = 0;
  for (let d = 0; d < 8; d++) {
    const [df, dr] = DIRS[d];
    if (df === 0 && dr === ahead) continue; // straight ahead is move-only
    const to = step(from, df, dr);
    if (to < 0) continue;
    const v = board[to];
    if (v && colorOf(v) !== c && canCapture(S, typeOf(v))) n++;
  }
  return Math.min(n * BEAST_TARGET, BEAST_TARGET_MAX);
}

/** Pawns and guards in front of the king. A guard there is a wall nothing but a king can remove. */
function shield(board: Uint8Array, k: number, c: Color): number {
  const dr = c === WHITE ? 1 : -1;
  let v = 0;
  for (let df = -1; df <= 1; df++) {
    const s = step(k, df, dr);
    if (s < 0) continue;
    const p = board[s];
    if (!p || colorOf(p) !== c) { v -= SHIELD_OPEN; continue; }
    const t = typeOf(p);
    v += t === G ? SHIELD_GUARD : t === P ? SHIELD_PAWN : SHIELD_OTHER;
  }
  return v;
}

const cheb = (a: number, b: number): number => Math.max(Math.abs((a & 7) - (b & 7)), Math.abs((a >> 3) - (b >> 3)));

const kingSq = [-1, -1];
const maesters: number[] = [];

/** Score of `board` in centipawns from `turn`'s point of view. */
export function evaluateBoard(board: Uint8Array, turn: Color): number {
  let score = 0, npm = 0;
  kingSq[0] = kingSq[1] = -1;
  maesters.length = 0;
  for (let s = 0; s < 64; s++) {
    const p = board[s];
    if (!p) continue;
    const t = typeOf(p), c = colorOf(p);
    if (t === K) { kingSq[c] = s; continue; }
    let v = VAL[t] + PST[t][c === WHITE ? s : s ^ 56];
    if (t !== P) npm += VAL[t];
    if (t === B || t === R || t === Q || t === L) v += mobility(board, s, t, c);
    else if (t === S) v += beastTargets(board, s, c);
    else if (t === M) maesters.push(s);
    score += c === WHITE ? v : -v;
  }
  const phase = Math.min(1, npm / PHASE_MAX); // 1 = middlegame, 0 = bare endgame
  for (let ci = 0; ci < 2; ci++) {
    const c = ci as Color, k = kingSq[ci];
    if (k < 0) continue;
    const rel = c === WHITE ? k : k ^ 56;
    let v = KING_MG[rel] * phase + KING_EG[rel] * (1 - phase) + shield(board, k, c) * phase;
    for (let i = 0; i < maesters.length; i++) {
      const m = maesters[i];
      if (colorOf(board[m]) !== c) continue;
      const d = cheb(m, k);
      if (d <= 2) v += MAESTER_NEAR_KING[d];
    }
    score += c === WHITE ? v : -v;
  }
  return Math.round(turn === WHITE ? score : -score) + TEMPO;
}

/**
 * Static evaluation from the side-to-move's perspective (centipawns), **always linear**.
 *
 * The tuner's second implementation is held to this one bit for bit (`src/sim/tune.test.ts`) and
 * the balance lab prices pieces through it, so it is not a switch. The search reads `evalBoard`.
 */
export const evaluate = (pos: Position): number => evaluateBoard(pos.board, pos.turn);

// ---------------------------------------------------------------------------------------------
// Which evaluation the search runs.

/**
 * `linear` is the shipped evaluation. `nnue` replaces it with the net. `residual` **adds** the net
 * to it, clipped to ±`RESIDUAL_MAX`: the material term stays outside the net, so the net never has
 * to learn what a queen is worth and can never forget — the failure
 * `docs/research/ai-nnue-2026-09-13.md` §5 measured and §7.2 prescribes the cure for.
 */
export type Evaluator = 'linear' | 'nnue' | 'residual';
let EVALUATOR: Evaluator = 'linear';

export const evaluatorName = (): Evaluator => EVALUATOR;

/**
 * Throws rather than play a blank net (an unpacked `weights.ts` evaluates every position as 0) or
 * the wrong *kind* of net: a full net added to the linear evaluation would count every piece
 * twice, and a residual net used alone would play a 1.5-pawn-wide evaluation with no material in
 * it. Both are silent disasters, so the pairing is checked here, once, at the switch.
 */
export function setEvaluator(e: Evaluator = 'nnue'): void {
  if (e !== 'linear') {
    if (!netLoaded) throw new Error(`setEvaluator("${e}"): src/ai/nnue/weights.ts holds no net`);
    const want: NetKind = e === 'residual' ? 'residual' : 'full';
    if (netKind() !== want) throw new Error(`setEvaluator("${e}") wants a ${want} net; the loaded one is ${netKind()}`);
  }
  EVALUATOR = e;
}

/** What `src/ai/search.ts` calls at every leaf. Centipawns, side-to-move's point of view. */
export const evalBoard = (board: Uint8Array, turn: Color): number => {
  if (EVALUATOR === 'nnue') return nnueEval(board, turn);
  const linear = evaluateBoard(board, turn);
  if (EVALUATOR === 'linear') return linear;
  const r = nnueEval(board, turn);
  return linear + (r > RESIDUAL_MAX ? RESIDUAL_MAX : r < -RESIDUAL_MAX ? -RESIDUAL_MAX : r);
};

// ---------------------------------------------------------------------------------------------
// The whole evaluation as data, for the tuner (`src/sim/tune.ts`) and for a match that plays two
// evaluations against each other in one process.

/** Every number `evaluateBoard` reads. Squares are a1 = 0, always from White's point of view. */
export interface EvalParams {
  /** By piece letter. The king has no material term (it is never traded), so `K` stays 0. */
  values: Record<string, number>;
  /** 64 entries per letter. */
  pst: Record<string, number[]>;
  kingMg: number[];
  kingEg: number[];
  /** Per pseudo-legal destination, by letter (B, R, Q, L). */
  mob: Record<string, number>;
  beastTarget: number;
  beastTargetMax: number;
  shield: { pawn: number; guard: number; other: number; open: number };
  /** By Chebyshev distance 0/1/2. Distance 0 is unreachable and stays 0. */
  maesterNearKing: number[];
  tempo: number;
  phaseMax: number;
  /**
   * Which evaluation the *search* runs (`evalBoard`). Absent means the linear one, so every file
   * the Texel tuner ever wrote keeps meaning what it meant. It rides here because it is the one
   * per-side knob `src/sim/game.ts` already swaps between plies, which is how an nnue-vs-linear
   * match is played in one process with the transposition table dropped on every swap.
   */
  evaluator?: Evaluator;
}

/** The letters with a table of their own; the king has two, blended by phase. */
export const PST_LETTERS = 'PNBRQALGMS';

/** The live parameters, copied out. */
export function evalParams(): EvalParams {
  const pst: Record<string, number[]> = {}, values: Record<string, number> = {};
  for (const l of Object.keys(TYPE_BY_LETTER)) values[l] = VAL[TYPE_BY_LETTER[l]];
  for (const l of PST_LETTERS) pst[l] = [...PST[TYPE_BY_LETTER[l]]];
  return {
    values, pst, kingMg: [...KING_MG], kingEg: [...KING_EG],
    mob: { B: MOB[B], R: MOB[R], Q: MOB[Q], L: MOB[L] },
    beastTarget: BEAST_TARGET, beastTargetMax: BEAST_TARGET_MAX,
    shield: { pawn: SHIELD_PAWN, guard: SHIELD_GUARD, other: SHIELD_OTHER, open: SHIELD_OPEN },
    maesterNearKing: [...MAESTER_NEAR_KING], tempo: TEMPO, phaseMax: PHASE_MAX,
    evaluator: EVALUATOR,
  };
}

/** The constants above, read once at module load, so `setEvalParams()` restores the shipped eval. */
const SHIPPED: EvalParams = evalParams();

/**
 * Load a whole parameter set. Module-level state for the same reason as `setPieceValues` — the hot
 * paths take a bare `Uint8Array` — and it overwrites the material values too, so a run uses either
 * this or `--values`, not both. Call with no argument to restore the shipped evaluation.
 */
export function setEvalParams(p: EvalParams = SHIPPED): void {
  for (const l of Object.keys(TYPE_BY_LETTER)) {
    // `?? DEFAULT_V[l]` and not `?? 0`: every `EvalParams` file written before the ogre and the
    // catapult existed is missing those two letters, and zeroing a piece's material is silent ruin.
    const t = TYPE_BY_LETTER[l], v = p.values[l] ?? DEFAULT_V[l];
    VAL[t] = v;
    VALUES[t] = v;
  }
  for (const l of PST_LETTERS) PST[TYPE_BY_LETTER[l]].set(p.pst[l]);
  KING_MG.set(p.kingMg);
  KING_EG.set(p.kingEg);
  MOB[B] = p.mob.B; MOB[R] = p.mob.R; MOB[Q] = p.mob.Q; MOB[L] = p.mob.L;
  BEAST_TARGET = p.beastTarget; BEAST_TARGET_MAX = p.beastTargetMax;
  SHIELD_PAWN = p.shield.pawn; SHIELD_GUARD = p.shield.guard;
  SHIELD_OTHER = p.shield.other; SHIELD_OPEN = p.shield.open;
  for (let i = 0; i < 3; i++) MAESTER_NEAR_KING[i] = p.maesterNearKing[i];
  TEMPO = p.tempo;
  PHASE_MAX = p.phaseMax;
  setEvaluator(p.evaluator ?? 'linear');
}
