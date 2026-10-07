/**
 * Static evaluation for the King Down AI.
 *
 * Terms: material, piece-square tables, slider mobility, beast targets, king shield, maester
 * proximity, tempo. All from White's point of view internally, negated for Black at the end.
 * No file-indexed opening knowledge anywhere: the back rank is randomised, so tables are
 * left-right symmetric and encode only centrality and advancement.
 */
import { A, B, C, Color, G, K, L, M, N, O, P, PieceType, Position, Q, R, S, T, V, WHITE, canCapture, colorOf, typeOf } from '../rules/engine';
import { NetKind, RESIDUAL_MAX, loadNet, loadedNetB64, netHasOgre, netKind, netLoaded, nnueEval } from './nnue/net';

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
// ARCHER_V re-priced 337 -> 505 with `archerShots: 'plusDiagFwd2'` (adopted 2026-09-17): the odds
// match vs a rook puts it at 5.05 ± 0.44 pawns (docs/research/sim-piece-balance-2026-09-17.md).
// Refreshed 2026-09-17 under the adopted `plusDiagFwd2` archer (odds match vs a knight, 500
// games an arm, depth 3). Two passes: L 2.87 -> 3.74 -> 4.08, M 3.20 -> 2.82 -> 3.18,
// S 3.08 -> 3.68 -> 3.77; each second-pass move is inside its error bar, so this is the fixed
// point (`sim/out/pb-values-refresh{,2}.experiment.md`). The guard measures out of band below
// 1.66; its 96 stays (a wall's worth is positional, and the material scan is not the instrument).
export const ARCHER_V = 505, PALADIN_V = 408, GUARD_V = 96, MAESTER_V = 318, BEAST_V = 434;
// BEAST_V 377 -> 434 with the blind spot removed (2026-09-17): captures +29%, odds match 4.34 ± 0.42
// (inside the old error bar, but it is the best estimate under the shipped rule).
/** Ogre push retains the adopted 318 value from the September 17 study. Catapult stays a lab seed. */
export const OGRE_V = 318, CATAPULT_V = 400;
/**
 * The reaver (V, lab, 2026-09-17), orthogonal escape step (the `reaverStep` default). Measured by
 * odds match: 4.04 ± 0.56 pawns against a knight at 2.96, converging (next seed 404). The full
 * eight-direction step did not converge (overpowered: +188 Elo even at a 5.04-pawn price), so the
 * shipped lab reading is the orthogonal one. `docs/research/sim-reaver-2026-09-17.md`.
 */
export const REAVER_V = 400;
/**
 * **Untuned seed** — the templar (T, lab, 2026-09-17). A king-step off the capital, a queen on it;
 * the proposal expects "2.5 off, queen-class on, perhaps 3.5–4 on average". Seeded at 350; a zero
 * PST means the search discovers the capital from the move list, not from a location bonus
 * (docs/PIECES-PROPOSED.md #4).
 */
export const TEMPLAR_V = 350;
/**
 * The Templar's location bonus, in centipawns, while it stands on a capital square (d4 e4 d5 e5).
 * Hand-set, lab-only, and the experiment that decides the piece: at zero the search never parks the
 * Templar on a capital (4% of its moves), so the queen mode never happens and the piece plays as a
 * weak king-stepper (docs/research/sim-templar-2026-09-17.md). Only boards that contain a Templar
 * can ever read it, so nothing shipped changes.
 */
export const TEMPLAR_ON_CAPITAL = 120;
/** The four capital squares, shared with the engine's Templar branch (`CAPITAL` in engine.ts). */
const CAPITAL_SQ = new Set([27, 28, 35, 36]);

const VAL = new Int32Array(16);
VAL[P] = PAWN_V; VAL[N] = KNIGHT_V; VAL[B] = BISHOP_V; VAL[R] = ROOK_V; VAL[Q] = QUEEN_V; VAL[K] = 0;
VAL[A] = ARCHER_V; VAL[L] = PALADIN_V; VAL[G] = GUARD_V; VAL[M] = MAESTER_V; VAL[S] = BEAST_V;
VAL[O] = OGRE_V; VAL[C] = CATAPULT_V; VAL[V] = REAVER_V; VAL[T] = TEMPLAR_V;

/** Piece value by type; kept as a record for compatibility with the tier-1 API. */
export const VALUES: Record<number, number> = {
  [P]: PAWN_V, [N]: KNIGHT_V, [B]: BISHOP_V, [R]: ROOK_V, [Q]: QUEEN_V, [K]: 0,
  [A]: ARCHER_V, [L]: PALADIN_V, [G]: GUARD_V, [M]: MAESTER_V, [S]: BEAST_V,
  [O]: OGRE_V, [C]: CATAPULT_V, [V]: REAVER_V, [T]: TEMPLAR_V,
};

/** The shipped values by letter, so `setPieceValues()` with no argument restores them exactly. */
const DEFAULT_V: Readonly<Record<string, number>> = Object.freeze({
  P: PAWN_V, N: KNIGHT_V, B: BISHOP_V, R: ROOK_V, Q: QUEEN_V, K: 0,
  A: ARCHER_V, L: PALADIN_V, G: GUARD_V, M: MAESTER_V, S: BEAST_V, O: OGRE_V, C: CATAPULT_V, V: REAVER_V, T: TEMPLAR_V,
});
const TYPE_BY_LETTER: Readonly<Record<string, PieceType>> = Object.freeze({ P, N, B, R, Q, K, A, L, G, M, S, O, C, V, T });

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
PST[V] = new Int16Array(64);
PST[T] = new Int16Array(64);

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

// ---------------------------------------------------------------------------------------------
// Guard-strategy probes (lab only, docs/research/guard-strategies-2026-10-06.md, Part 1).
//
// Six pattern terms E1–E6, each a weight in centipawns, and E7, a flag that flattens `PST[G]`.
// Every weight is 0 and the flag is off in the shipped eval, and `evaluateBoard` then skips the
// whole block, so the shipped eval and its search are unchanged (src/ai/guard-probes.test.ts).

/** Bit per pattern in `guardPatterns` (E7's bit: the Guard stands beyond its own second rank). */
export const GP = { E1: 1, E2: 2, E3: 4, E4: 8, E5: 16, E6: 32, E7: 64 } as const;
export const GP_NAMES = ['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7'] as const;
/** E1..E6 weights; 0 = off. */
const GW = new Int32Array(6);
let GUARD_ON = false;

const isSlider = (t: PieceType): boolean => t === B || t === R || t === Q || t === L;
/** Whether a slider of type `t` moves along direction index `d` of `DIRS` (0–3 straight, 4–7 diagonal). */
const slidesOn = (t: PieceType, d: number): boolean => (t === B ? d >= 4 : t === R ? d < 4 : t === Q || t === L);
const unit = (x: number): number => (x > 0 ? 1 : x < 0 ? -1 : 0);

/** Own pawn is passed: no enemy pawn ahead of it on its file or the next files. */
function passed(board: Uint8Array, s: number, c: Color): boolean {
  const f = s & 7, r = s >> 3, dr = c === WHITE ? 1 : -1, enemyPawn = c === WHITE ? P | 16 : P;
  for (let rr = r + dr; rr >= 0 && rr <= 7; rr += dr) {
    for (let ff = Math.max(0, f - 1); ff <= Math.min(7, f + 1); ff++) if (board[(rr << 3) | ff] === enemyPawn) return false;
  }
  return true;
}

/**
 * E3: the Guard on `g` is the only piece between `target` and an enemy slider that attacks along
 * that line. Walks the ray from the target through the Guard to the first piece beyond it.
 */
function interposes(board: Uint8Array, g: number, target: number, c: Color): boolean {
  if (target < 0 || g === target) return false;
  const df = (g & 7) - (target & 7), dr = (g >> 3) - (target >> 3);
  if (df !== 0 && dr !== 0 && Math.abs(df) !== Math.abs(dr)) return false;
  const uf = unit(df), ur = unit(dr), d = DIRS.findIndex(([a, b]) => a === uf && b === ur);
  let s = step(target, uf, ur);
  for (; s >= 0 && s !== g; s = step(s, uf, ur)) if (board[s]) return false; // something else blocks first
  for (s = step(g, uf, ur); s >= 0; s = step(s, uf, ur)) {
    const p = board[s];
    if (!p) continue;
    return colorOf(p) !== c && isSlider(typeOf(p)) && slidesOn(typeOf(p), d);
  }
  return false;
}

/**
 * E2: the square next to the queen on `q`, on the line to the nearest enemy slider that is aligned
 * with the queen along one of its own move lines (other pieces ignored). -1 when there is none.
 */
function frontSquare(board: Uint8Array, q: number, c: Color): number {
  let best = -1, bestD = 99;
  for (let s = 0; s < 64; s++) {
    const p = board[s];
    if (!p || colorOf(p) === c || !isSlider(typeOf(p))) continue;
    const df = (q & 7) - (s & 7), dr = (q >> 3) - (s >> 3);
    if (df !== 0 && dr !== 0 && Math.abs(df) !== Math.abs(dr)) continue;
    const d = DIRS.findIndex(([a, b]) => a === unit(df) && b === unit(dr));
    if (!slidesOn(typeOf(p), d)) continue;
    const dist = cheb(s, q);
    if (dist < bestD) { bestD = dist; best = step(q, -unit(df), -unit(dr)); }
  }
  return best;
}

/**
 * The patterns the Guard on `g` (colour `c`) makes, as `GP` bits, and the E1/E4 strength (1 = full
 * weight, 0.5 = half). `q` is c's queen (-1 if none), `k` c's king, `ek` the enemy king.
 */
function guardPattern(board: Uint8Array, g: number, c: Color, q: number, k: number, ek: number, half: { e1: number; e4: number }): number {
  let bits = 0;
  half.e1 = half.e4 = 1;
  const fwd = c === WHITE ? 8 : -8;
  if (q >= 0 && cheb(g, q) === 1) {
    bits |= GP.E1;
    if (c === WHITE ? q >> 3 < 4 : q >> 3 > 3) half.e1 = 0.5; // queen still in its own half
  }
  if (q >= 0 && frontSquare(board, q, c) === g) bits |= GP.E2;
  if (interposes(board, g, q, c) || interposes(board, g, k, c)) bits |= GP.E3;
  const ahead = g + fwd; // an enemy pawn here walks towards our side and meets the Guard
  if (ahead >= 0 && ahead < 64 && board[ahead] === (P | ((c ^ 1) << 4))) {
    bits |= GP.E4;
    if (!passed(board, ahead, (c ^ 1) as Color)) half.e4 = 0.5;
  }
  for (let d = 0; d < 8; d++) {
    const s = step(g, DIRS[d][0], DIRS[d][1]);
    if (s >= 0 && board[s] === (P | (c << 4)) && passed(board, s, c)) { bits |= GP.E5; break; }
  }
  if (ek >= 0 && cheb(g, ek) === 1) bits |= GP.E6;
  if ((c === WHITE ? g >> 3 : 7 - (g >> 3)) >= 2) bits |= GP.E7;
  return bits;
}

const HALF = { e1: 1, e4: 1 };

/** OR of the patterns over `c`'s Guards on `board` (`GP` bits), for counting how often a probe fires. */
export function guardPatterns(board: Uint8Array, c: Color): number {
  let q = -1, k = -1, ek = -1, bits = 0;
  for (let s = 0; s < 64; s++) {
    const p = board[s];
    if (!p) continue;
    const t = typeOf(p);
    if (t === K) { if (colorOf(p) === c) k = s; else ek = s; } else if (t === Q && colorOf(p) === c && q < 0) q = s;
  }
  for (let s = 0; s < 64; s++) if (board[s] && typeOf(board[s]) === G && colorOf(board[s]) === c) bits |= guardPattern(board, s, c, q, k, ek, HALF);
  return bits;
}

/** The E1–E6 bonus for both sides' Guards, White's point of view. Only runs with a weight on. */
function guardTerms(board: Uint8Array): number {
  let v = 0;
  const q = [-1, -1];
  for (let s = 0; s < 64; s++) { const p = board[s]; if (p && typeOf(p) === Q && q[colorOf(p)] < 0) q[colorOf(p)] = s; }
  for (let s = 0; s < 64; s++) {
    const p = board[s];
    if (!p || typeOf(p) !== G) continue;
    const c = colorOf(p);
    const bits = guardPattern(board, s, c, q[c], kingSq[c], kingSq[c ^ 1], HALF);
    let b = 0;
    if (bits & GP.E1) b += GW[0] * HALF.e1;
    if (bits & GP.E2) b += GW[1];
    if (bits & GP.E3) b += GW[2];
    if (bits & GP.E4) b += GW[3] * HALF.e4;
    if (bits & GP.E5) b += GW[4];
    if (bits & GP.E6) b += GW[5];
    v += c === WHITE ? b : -b;
  }
  return Math.round(v);
}

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
    else if (t === T && CAPITAL_SQ.has(s)) v += TEMPLAR_ON_CAPITAL;
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
    // Rounded per king, so the total is a whole number and a position and its mirror score alike.
    score += c === WHITE ? Math.round(v) : -Math.round(v);
  }
  if (GUARD_ON) score += guardTerms(board);
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

/**
 * The first net has 11 piece types; the lab pieces (ogre, catapult, reaver, templar) are type 12+. A
 * net trained since 2026-10-02 also sees the Ogre, which joined the random-army pool. A board that
 * contains a piece the loaded net cannot see plays the linear evaluation instead of throwing: those pieces reach a game only
 * through a `?fen=` or a lab spec, and the browser adopted the residual net, so a lab position must
 * not break the AI.
 */
const hasNetTypes = (board: Uint8Array): boolean => {
  // Since 2026-10-02 a net can have Ogre inputs (type 12); one without them falls back as before.
  const max = netHasOgre() ? 12 : 11;
  for (let s = 0; s < 64; s++) if ((board[s] & 15) > max) return true; // low nibble = type (bit 4 is colour)
  return false;
};

/**
 * What `src/ai/search.ts` calls at every leaf. Centipawns, side-to-move's point of view. `pw` / `pb`
 * are White's and Black's live king powers for the net (index in `NET_POWERS`, -1 for none or spent);
 * the linear evaluation does not read them.
 */
export const evalBoard = (board: Uint8Array, turn: Color, pw = -1, pb = -1): number => {
  const net = EVALUATOR !== 'linear' && !hasNetTypes(board);
  if (!net) return evaluateBoard(board, turn);
  if (EVALUATOR === 'nnue') return nnueEval(board, turn, pw, pb);
  const linear = evaluateBoard(board, turn);
  const r = nnueEval(board, turn, pw, pb);
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
  /**
   * The net the evaluator needs, by value. A match arm that names a file **and** the blob it was
   * scored with can be reproduced anywhere; without this, `--tuned eval-residual.json` silently
   * played whatever `src/ai/nnue/weights.ts` happened to hold (docs/TAKEOVER-PLAN.md §2/§3).
   * Absent means "keep the net already loaded", which is how every file written before this field
   * existed keeps working.
   */
  net?: { b64: string; kind: NetKind };
  /**
   * Guard-strategy probes (lab): E1–E6 weights in centipawns and E7, a flat `PST[G]`. Absent or
   * all zero = the shipped eval. See `guardPatterns` and docs/research/guard-strategies-2026-10-06.md.
   */
  guard?: { e1?: number; e2?: number; e3?: number; e4?: number; e5?: number; e6?: number; e7?: boolean };
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
  const gp = p.guard ?? {};
  [gp.e1, gp.e2, gp.e3, gp.e4, gp.e5, gp.e6].forEach((w, i) => { GW[i] = w ?? 0; });
  GUARD_ON = GW.some(w => w !== 0);
  if (gp.e7) PST[G].fill(0); // E7: no home-rank pull; the next load restores the table from `p.pst`
  // The blob is a string compare away from already loaded: swapping arms between plies must not
  // re-parse it each time.
  if (p.net && p.net.b64 !== loadedNetB64()) loadNet(p.net.b64, p.net.kind);
  setEvaluator(p.evaluator ?? 'linear');
}
