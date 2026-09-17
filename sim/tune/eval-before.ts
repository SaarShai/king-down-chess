/**
 * Static evaluation for the King Down AI.
 *
 * Terms: material, piece-square tables, slider mobility, beast targets, king shield, maester
 * proximity, tempo. All from White's point of view internally, negated for Black at the end.
 * No file-indexed opening knowledge anywhere: the back rank is randomised, so tables are
 * left-right symmetric and encode only centrality and advancement.
 */
import { A, B, Color, G, K, L, M, N, P, PieceType, Position, Q, R, S, WHITE, canCapture, colorOf, typeOf } from '../rules/engine';

/*
 * Material values (centipawns). The four standard ones are the usual 100/320/330/500/900.
 *
 * The fairy values are **measured**, not reasoned: Muller's fixed-point iteration, one arm per
 * piece against a knight plus a pawn-odds calibration arm (docs/SIM-PLAN.md §6,
 * docs/research/sim-buffed-2026-09-13.md §2). The prose below says what each piece does and why the
 * measurement lands where it does; the number comes from the games.
 *
 * These are the fixed point at depth 3 **under the shipped rules** (`DEFAULT_RULES`), where the
 * archer and the beast step in any direction and the guard clears one pawn:
 *
 *   A 2.82 +- 0.44 · L 3.10 +- 0.45 · G < 1.70 (bound) · M 3.28 +- 0.44 · S 2.17 +- 0.41 pawns
 *
 * No piece moved by more than its own error bar in that pass, so one pass closed the point. The
 * guard is the one row that stays a *bound*: it measures below the +-1.5-pawn band the method
 * needs, so all the games prove is "under 1.70 pawns", and it is priced at that bound — the
 * largest value the data allows. It read the same -100 and -114 Elo at seeds of 1.80 and 1.70
 * pawns, so the arm is nearly blind to its own seed: the bound is the answer, not a way-station.
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
export const PAWN_V = 100, KNIGHT_V = 320, BISHOP_V = 330, ROOK_V = 500, QUEEN_V = 900;
export const ARCHER_V = 280, PALADIN_V = 310, GUARD_V = 170, MAESTER_V = 330, BEAST_V = 215;

const VAL = new Int32Array(12);
VAL[P] = PAWN_V; VAL[N] = KNIGHT_V; VAL[B] = BISHOP_V; VAL[R] = ROOK_V; VAL[Q] = QUEEN_V; VAL[K] = 0;
VAL[A] = ARCHER_V; VAL[L] = PALADIN_V; VAL[G] = GUARD_V; VAL[M] = MAESTER_V; VAL[S] = BEAST_V;

/** Piece value by type; kept as a record for compatibility with the tier-1 API. */
export const VALUES: Record<number, number> = {
  [P]: PAWN_V, [N]: KNIGHT_V, [B]: BISHOP_V, [R]: ROOK_V, [Q]: QUEEN_V, [K]: 0,
  [A]: ARCHER_V, [L]: PALADIN_V, [G]: GUARD_V, [M]: MAESTER_V, [S]: BEAST_V,
};

/** The shipped values by letter, so `setPieceValues()` with no argument restores them exactly. */
const DEFAULT_V: Readonly<Record<string, number>> = Object.freeze({
  P: PAWN_V, N: KNIGHT_V, B: BISHOP_V, R: ROOK_V, Q: QUEEN_V, K: 0,
  A: ARCHER_V, L: PALADIN_V, G: GUARD_V, M: MAESTER_V, S: BEAST_V,
});
const TYPE_BY_LETTER: Readonly<Record<string, PieceType>> = Object.freeze({ P, N, B, R, Q, K, A, L, G, M, S });

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
export let TEMPO = 10;
const MOB = new Int32Array(12); // per pseudo-legal slider destination
MOB[B] = 4; MOB[R] = 3; MOB[Q] = 2; MOB[L] = 2;
let BEAST_TARGET = 6, BEAST_TARGET_MAX = 18;
let SHIELD_PAWN = 12, SHIELD_GUARD = 26, SHIELD_OTHER = 5, SHIELD_OPEN = 8;
const MAESTER_NEAR_KING = [0, 14, 7]; // by Chebyshev distance 0/1/2
/** Non-pawn material (both sides) at which the king table is fully "middlegame". */
let PHASE_MAX = 5600;

/** Rows are written rank 8 first so the table reads like a board; flipped into a1=0 indexing. */
const table = (rows: number[]): Int16Array => {
  const t = new Int16Array(64);
  for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) t[(7 - r) * 8 + f] = rows[r * 8 + f];
  return t;
};

const PST: Int16Array[] = [];

PST[P] = table([
   0,  0,  0,  0,  0,  0,  0,  0,
  90, 90, 90, 90, 90, 90, 90, 90,
  40, 45, 50, 55, 55, 50, 45, 40,
  15, 20, 28, 35, 35, 28, 20, 15,
   5, 10, 15, 25, 25, 15, 10,  5,
   2,  4,  6, 10, 10,  6,  4,  2,
   0,  0,  0,  0,  0,  0,  0,  0,
   0,  0,  0,  0,  0,  0,  0,  0,
]);

PST[N] = table([
 -50,-35,-25,-25,-25,-25,-35,-50,
 -35,-15,  0,  5,  5,  0,-15,-35,
 -25,  5, 15, 20, 20, 15,  5,-25,
 -25, 10, 20, 25, 25, 20, 10,-25,
 -25,  5, 20, 25, 25, 20,  5,-25,
 -25,  0, 15, 20, 20, 15,  0,-25,
 -35,-15,  0,  5,  5,  0,-15,-35,
 -50,-35,-25,-20,-20,-25,-35,-50,
]);

PST[B] = table([
 -20,-10,-10,-10,-10,-10,-10,-20,
 -10,  5,  0,  0,  0,  0,  5,-10,
 -10, 10, 10, 10, 10, 10, 10,-10,
 -10,  0, 10, 15, 15, 10,  0,-10,
 -10,  5,  5, 15, 15,  5,  5,-10,
 -10,  0,  5, 10, 10,  5,  0,-10,
 -10,  0,  0,  0,  0,  0,  0,-10,
 -20,-10,-10,-10,-10,-10,-10,-20,
]);

PST[R] = table([
   0,  0,  0,  5,  5,  0,  0,  0,
  10, 15, 15, 15, 15, 15, 15, 10,
   0,  0,  0,  2,  2,  0,  0,  0,
   0,  0,  0,  2,  2,  0,  0,  0,
   0,  0,  0,  2,  2,  0,  0,  0,
   0,  0,  0,  2,  2,  0,  0,  0,
  -5,  0,  0,  2,  2,  0,  0, -5,
   0,  0,  5,  8,  8,  5,  0,  0,
]);

PST[Q] = table([
 -20,-10,-10, -5, -5,-10,-10,-20,
 -10,  0,  0,  0,  0,  0,  0,-10,
 -10,  0,  5,  5,  5,  5,  0,-10,
  -5,  0,  5,  8,  8,  5,  0, -5,
  -5,  0,  5,  8,  8,  5,  0, -5,
 -10,  0,  5,  5,  5,  5,  0,-10,
 -10,  0,  0,  0,  0,  0,  0,-10,
 -20,-10,-10, -5, -5,-10,-10,-20,
]);

/** Archer: central and advanced posts put the most enemies inside its eight rifle squares. */
PST[A] = table([
   0,  5, 10, 12, 12, 10,  5,  0,
   5, 15, 22, 26, 26, 22, 15,  5,
  10, 22, 30, 34, 34, 30, 22, 10,
  10, 24, 32, 38, 38, 32, 24, 10,
   8, 20, 28, 32, 32, 28, 20,  8,
   4, 12, 18, 22, 22, 18, 12,  4,
   0,  5,  8, 10, 10,  8,  5,  0,
  -5,  0,  0,  0,  0,  0,  0, -5,
]);

/** Paladin: it jumps friends and is stopped by enemies, so it belongs behind its own army. */
PST[L] = table([
 -15,-15,-15,-15,-15,-15,-15,-15,
 -10,-10,-10,-10,-10,-10,-10,-10,
  -6, -6, -6, -6, -6, -6, -6, -6,
   0,  0,  0,  0,  0,  0,  0,  0,
   2,  4,  6,  6,  6,  6,  4,  2,
   4,  8, 10, 12, 12, 10,  8,  4,
   6, 10, 14, 16, 16, 14, 10,  6,
   5, 10, 14, 16, 16, 14, 10,  5,
]);

/** Guard: a wall, not a raider. Home ranks only; the real bonus is the king-shield term. */
PST[G] = table([
 -30,-30,-30,-30,-30,-30,-30,-30,
 -25,-25,-25,-25,-25,-25,-25,-25,
 -20,-20,-20,-20,-20,-20,-20,-20,
 -12,-12,-12,-12,-12,-12,-12,-12,
  -6, -6, -6, -6, -6, -6, -6, -6,
   0,  0,  0,  0,  0,  0,  0,  0,
   8,  8,  8,  8,  8,  8,  8,  8,
   4,  4,  4,  4,  4,  4,  4,  4,
]);

/** Maester: slow, so keep it in its own half; the proximity term pulls it towards its king. */
PST[M] = table([
 -20,-15,-12,-10,-10,-12,-15,-20,
 -15, -8, -5, -2, -2, -5, -8,-15,
 -10, -2,  2,  4,  4,  2, -2,-10,
  -5,  2,  6,  8,  8,  6,  2, -5,
   0,  5,  8, 10, 10,  8,  5,  0,
   2,  8, 12, 14, 14, 12,  8,  2,
   4, 10, 14, 16, 16, 14, 10,  4,
   0,  6, 10, 12, 12, 10,  6,  0,
]);

/** Beast: forward posts. It cannot retreat, so the last rank (nothing left to eat) is not a prize. */
PST[S] = table([
   5, 10, 12, 14, 14, 12, 10,  5,
  15, 25, 30, 34, 34, 30, 25, 15,
  12, 22, 28, 32, 32, 28, 22, 12,
   8, 16, 22, 26, 26, 22, 16,  8,
   4, 10, 14, 18, 18, 14, 10,  4,
   0,  4,  8, 10, 10,  8,  4,  0,
  -4,  0,  2,  4,  4,  2,  0, -4,
  -8, -4, -2,  0,  0, -2, -4, -8,
]);

/** King: hide behind the army while the board is full, walk to the centre once it empties. */
const KING_MG = table([
 -40,-40,-40,-40,-40,-40,-40,-40,
 -40,-40,-40,-40,-40,-40,-40,-40,
 -35,-35,-35,-35,-35,-35,-35,-35,
 -30,-30,-30,-30,-30,-30,-30,-30,
 -25,-25,-25,-25,-25,-25,-25,-25,
 -12,-15,-18,-20,-20,-18,-15,-12,
   0, -2, -8,-12,-12, -8, -2,  0,
   8, 10,  4,  0,  0,  4, 10,  8,
]);

const KING_EG = table([
 -40,-25,-15,-10,-10,-15,-25,-40,
 -25,-10,  0,  5,  5,  0,-10,-25,
 -15,  0, 12, 18, 18, 12,  0,-15,
 -10,  5, 18, 25, 25, 18,  5,-10,
 -10,  5, 18, 25, 25, 18,  5,-10,
 -15,  0, 12, 18, 18, 12,  0,-15,
 -25,-10,  0,  5,  5,  0,-10,-25,
 -40,-25,-15,-10,-10,-15,-25,-40,
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

/** Static evaluation from the side-to-move's perspective (centipawns). */
export const evaluate = (pos: Position): number => evaluateBoard(pos.board, pos.turn);

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
    const t = TYPE_BY_LETTER[l], v = p.values[l] ?? 0;
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
}
