/**
 * Zobrist keys for the AI's transposition table and repetition detection.
 *
 * JS has no 64-bit integer XOR without BigInt, so a key is two halves: a full 32-bit `lo` and a
 * 20-bit `hi`. `combine()` packs them into `hi * 2**32 + lo`, which stays below 2**53 and is
 * therefore an exact double — usable as a plain number key for equality tests and Float64Array
 * storage. 52 bits of entropy is far more than a few hundred thousand nodes need.
 *
 * The generator is a fixed-seed xorshift, so keys are identical in every worker and every test run.
 */
import { Color, SPENT, colorOf, typeOf } from '../rules/engine';

let seed = 0x9e3779b9;
const next = (): number => {
  seed ^= seed << 13;
  seed ^= seed >>> 17;
  seed ^= seed << 5;
  return seed >>> 0;
};

/**
 * Index = ((spent * 2 + colour) * SLOTS + type) * 64 + square; `SLOTS` is the type count (slot 0
 * per colour is unused), so adding a piece type is one constant here. `spent` is the guard's
 * used-up-capture flag (`SPENT`), which is part of the position.
 */
const SLOTS = 16; // types 1…15 (P N B R Q K A L G M S O C V T), plus the unused slot 0
export const Z_LO = new Int32Array(2 * 2 * SLOTS * 64);
export const Z_HI = new Int32Array(2 * 2 * SLOTS * 64);
/** Draw the 64 keys of one (spent, colour, type) block. */
const fill = (spent: number, c: number, t: number): void => {
  const base = ((spent * 2 + c) * SLOTS + t) << 6;
  for (let i = base; i < base + 64; i++) {
    Z_LO[i] = next() | 0;
    Z_HI[i] = next() & 0xfffff; // 20 bits keeps combine() exact
  }
};
/*
 * The draw order is history, not layout. It reproduces the stream of the 12-slot table exactly —
 * the unspent half of types 0…11, the turn key, then their spent half — and only then the lab
 * types, in the order they were added (O, C, V, then T). So every key a board without those pieces
 * uses keeps the value it had before they existed, and a stored simulation run still replays move
 * for move.
 */
for (let c = 0; c < 2; c++) for (let t = 0; t < 12; t++) fill(0, c, t);
export const Z_TURN_LO = next() | 0;
export const Z_TURN_HI = next() & 0xfffff;
for (let c = 0; c < 2; c++) for (let t = 0; t < 12; t++) fill(1, c, t);
for (let spent = 0; spent < 2; spent++) for (let c = 0; c < 2; c++) for (let t = 12; t < SLOTS; t++) fill(spent, c, t);

/** Table slot for piece byte `p` (type | colour<<4 | SPENT) on square `s`. */
export const zIndex = (p: number, s: number): number =>
  (((((p & SPENT ? 2 : 0) + colorOf(p)) * SLOTS + typeOf(p)) << 6) | s);

/** Exact 52-bit key from the two halves. */
export const combine = (lo: number, hi: number): number => hi * 4294967296 + (lo >>> 0);

/** Full hash of a board from scratch; writes [lo, hi] into `out` to avoid allocating. */
export function hashBoard(board: Uint8Array, turn: Color, out: Int32Array): void {
  let lo = 0, hi = 0;
  for (let s = 0; s < 64; s++) {
    const p = board[s];
    if (!p) continue;
    const i = zIndex(p, s);
    lo ^= Z_LO[i];
    hi ^= Z_HI[i];
  }
  if (turn) { lo ^= Z_TURN_LO; hi ^= Z_TURN_HI; }
  out[0] = lo;
  out[1] = hi;
}

/*
 * King powers (2026-10-02), appended after every earlier draw so no historic key moves:
 * a Freeze/Ice Wall mark per marking side and square (2 × 64), a pending Haste square (64), uses
 * spent per side (2 × 8, index 0 unused), the Sacrifice reserve per side and type at counts 1…3
 * (2 × 16 × 4; index 0 of each count group unused, a count of 3 or more shares the last key), the
 * turns a mark still covers when more than one (index 2…3), and a pending free-mark move.
 */
const draw = (n: number): [Int32Array, Int32Array] => {
  const lo = new Int32Array(n), hi = new Int32Array(n);
  for (let i = 0; i < n; i++) { lo[i] = next() | 0; hi[i] = next() & 0xfffff; }
  return [lo, hi];
};
export const [Z_MARK_LO, Z_MARK_HI] = draw(2 * 64);
export const [Z_HASTE_LO, Z_HASTE_HI] = draw(64);
export const [Z_USED_LO, Z_USED_HI] = draw(2 * 8);
export const [Z_LOST_LO, Z_LOST_HI] = draw(2 * 16 * 4);
export const [Z_LEFT_LO, Z_LEFT_HI] = draw(4);
export const [Z_FREE_LO, Z_FREE_HI] = draw(1);
/** Card mode: the mark is an Ice Wall (a hand can hold Freeze and Ice Wall both). */
export const [Z_WARD_LO, Z_WARD_HI] = draw(1);
/** Slot of "side `c` has spent `u` uses" (u ≥ 1, capped at 7). */
export const usedIndex = (c: number, u: number): number => c * 8 + Math.min(u, 7);
/** Slot of "reserve index `i` (= colour * 16 + type) holds `n` pieces" (n ≥ 1, capped at 3). */
export const lostIndex = (i: number, n: number): number => i * 4 + Math.min(n, 3);
