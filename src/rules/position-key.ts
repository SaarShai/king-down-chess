/**
 * Stable position keys for game repetition and the AI's transposition table.
 *
 * JS has no 64-bit integer XOR without BigInt, so a key is two halves: a full 32-bit `lo` and a
 * 20-bit `hi`. `combine()` packs them into `hi * 2**32 + lo`, which stays below 2**53 and is
 * therefore an exact double — usable as a plain number key for equality tests and Float64Array
 * storage. 52 bits of entropy is far more than a few hundred thousand nodes need.
 *
 * The generator is a fixed-seed xorshift, so keys are identical in every worker and every test run.
 */
import { Color, P, SPENT, colorOf, drawsOnLost, handOf, legalMoves, powerUses, tracksLast, typeOf, type Position } from './engine';
import { ALL_CARDS } from './rules';

let seed = 0x9e3779b9;
const next = (): number => {
  seed ^= seed << 13;
  seed ^= seed >>> 17;
  seed ^= seed << 5;
  return seed >>> 0;
};
/**
 * A `hi` half from its own (mulberry32) stream. xorshift is linear over GF(2), so a `hi` taken from
 * the `lo` stream was a fixed function of `lo` and added no bits: keys carried 32, not 52 (review,
 * 2026-10-03). `next()` still advances, so every `lo` keeps its value and the table index too.
 */
let hiSeed = 0x6a09e667;
const nextHi = (): number => {
  next();
  let t = (hiSeed = (hiSeed + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), 1 | t);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) & 0xfffff; // 20 bits keeps combine() exact
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
    Z_HI[i] = nextHi();
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
export const Z_TURN_HI = nextHi();
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
  for (let i = 0; i < n; i++) { lo[i] = next() | 0; hi[i] = nextHi(); }
  return [lo, hi];
};
export const [Z_MARK_LO, Z_MARK_HI] = draw(2 * 64);
export const [Z_HASTE_LO, Z_HASTE_HI] = draw(64);
export const [Z_USED_LO, Z_USED_HI] = draw(2 * 8);
export const [Z_LOST_LO, Z_LOST_HI] = draw(2 * 16 * 4);
export const [Z_LEFT_LO, Z_LEFT_HI] = draw(4);
export const [Z_FREE_LO, Z_FREE_HI] = draw(1);
/** Card mode: a side's mark is an Ice Wall (a hand can hold Freeze and Ice Wall both); one key per marking side. */
export const [Z_WARD_LO, Z_WARD_HI] = draw(2);
/** Turns left above 1 on Black's mark (White's use `Z_LEFT`), so two live marks never cancel. */
export const [Z_LEFTB_LO, Z_LEFTB_HI] = draw(4);
/** `guardReserve` (2026-10-04): guards waiting beside the board per side at counts 1…3 (`waitIndex`). */
export const [Z_WAIT_LO, Z_WAIT_HI] = draw(2 * 4);
/** Slot of "side `c` has `n` guards waiting" (n ≥ 1, capped at 3). */
export const waitIndex = (c: number, n: number): number => c * 4 + Math.min(n, 3);
/** Slot of "side `c` has spent `u` uses" (u ≥ 1, capped at 7). */
export const usedIndex = (c: number, u: number): number => c * 8 + Math.min(u, 7);
/** Slot of "reserve index `i` (= colour * 16 + type) holds `n` pieces" (n ≥ 1, capped at 3). */
export const lostIndex = (i: number, n: number): number => i * 4 + Math.min(n, 3);
/*
 * The 2014 cards (2026-10-04), appended after every earlier draw: a Firewall mark per marking side,
 * a pending Rage (index 0) or RageB (index 1) second move, the card each side played last (Mirror;
 * 32 slots per side by `ALL_CARDS` order, `lastIndex`), and the cards each side has drawn at counts 1…7
 * (Growth). A mark that has just ended (`left: 0`, for a Rescue) uses index 0 of `Z_LEFT` /
 * `Z_LEFTB`, drawn before and never used until now.
 */
export const [Z_ALL_LO, Z_ALL_HI] = draw(2);
const [rageLo, rageHi] = draw(2);
const [lastLo, lastHi] = draw(2 * 32);
export const [Z_DRAWN_LO, Z_DRAWN_HI] = draw(2 * 8);
/** Slot of "side `c` has drawn `n` cards" (n ≥ 1, capped at 7). */
export const drawnIndex = (c: number, n: number): number => c * 8 + Math.min(n, 7);
/** A pending Rally second move (2026-10-05), appended: index 2 of `Z_RAGE`, after the Rage and RageB keys drawn above. */
const [rallyLo, rallyHi] = draw(1);
export const Z_RAGE_LO = Int32Array.of(...rageLo, ...rallyLo), Z_RAGE_HI = Int32Array.of(...rageHi, ...rallyHi);
/**
 * Mirror's last-card keys for cards 32…63 of `ALL_CARDS` (the Spawn cards, 2026-10-06, took it past
 * 32), appended: 32 more a side after the 32 a side drawn above, so no earlier card's key moves.
 */
const [lastLo2, lastHi2] = draw(2 * 32);
export const Z_LAST_LO = Int32Array.of(...lastLo, ...lastLo2), Z_LAST_HI = Int32Array.of(...lastHi, ...lastHi2);
/** Slot in `Z_LAST` of "side `c` played card `k` last" (`k`: the card's index in `ALL_CARDS`, below 64). */
export const lastIndex = (c: number, k: number): number => (k < 32 ? c * 32 + k : 64 + c * 32 + (k - 32));
/** Classic chess (`Rules.classicChess`, 2026-10-11), appended: one key per castling right (K Q k q) and one per en-passant file. */
export const [Z_CASTLE_LO, Z_CASTLE_HI] = draw(4);
export const [Z_EP_LO, Z_EP_HI] = draw(8);

const hashOut = new Int32Array(2);

/** Keep the stored right for free actions; count it in the key only when a legal capture exists. */
export function epForKey(pos: Position): number {
  const ep = pos.ep;
  if (ep === undefined || pos.haste !== undefined) return -1;
  return legalMoves(pos, 'captures').some(m => m.to === ep && typeOf(pos.board[m.from]) === P
    && m.captures.length === 1 && m.captures[0] !== ep) ? ep : -1;
}

/**
 * Key of a position, for `SearchOptions.history` and `Game`'s repetition count: the board, the side
 * to move and the king-power state that changes the legal moves — uses spent of a counted power,
 * a Freeze/Ice Wall mark, a pending Haste, the reserve of a side that plays Sacrifice or holds a
 * Sacrifice or Salvation card, and the guards waiting beside the board; in card mode also a
 * Firewall, an ended mark a Rescue may renew, a Rage's second move, the cards drawn and (while a
 * hand holds a Mirror) each side's last card. The
 * search keeps the same key incrementally (`apply`/`undo`), so the two are one definition.
 */
export function positionKey(pos: Position, out = hashOut): number {
  hashBoard(pos.board, pos.turn, out);
  let lo = out[0], hi = out[1];
  for (let c = 0; c < 2; c++) {
    const u = pos.used?.[c] ?? 0;
    if (handOf(c as Color).length) { for (let k = 0; k < 8; k++) if (u >> k & 1) { lo ^= Z_USED_LO[c * 8 + k]; hi ^= Z_USED_HI[c * 8 + k]; } }
    else if (u > 0 && powerUses(c as Color) > 0) { const i = usedIndex(c, u); lo ^= Z_USED_LO[i]; hi ^= Z_USED_HI[i]; }
    if (pos.lost && drawsOnLost(c as Color)) {
      for (let t = 1; t < 16; t++) {
        const n = pos.lost[c * 16 + t];
        if (n > 0) { const k = lostIndex(c * 16 + t, n); lo ^= Z_LOST_LO[k]; hi ^= Z_LOST_HI[k]; }
      }
    }
    const w = pos.waiting?.[c] ?? 0;
    if (w > 0) { const i = waitIndex(c, w); lo ^= Z_WAIT_LO[i]; hi ^= Z_WAIT_HI[i]; }
    const l = pos.last?.[c];
    if (l && tracksLast()) { const i = lastIndex(c, ALL_CARDS.indexOf(l)); lo ^= Z_LAST_LO[i]; hi ^= Z_LAST_HI[i]; }
    const d = pos.drawn?.[c] ?? 0;
    if (d > 0) { const i = drawnIndex(c, d); lo ^= Z_DRAWN_LO[i]; hi ^= Z_DRAWN_HI[i]; }
  }
  for (let by = 0; by < 2; by++) {
    const k = pos.marks?.[by];
    if (!k) continue;
    const i = by * 64 + k.sq, left = k.left ?? 1;
    lo ^= Z_MARK_LO[i]; hi ^= Z_MARK_HI[i];
    if (left !== 1) { lo ^= by ? Z_LEFTB_LO[left] : Z_LEFT_LO[left]; hi ^= by ? Z_LEFTB_HI[left] : Z_LEFT_HI[left]; }
    if (k.ward) { lo ^= Z_WARD_LO[by]; hi ^= Z_WARD_HI[by]; }
    if (k.all) { lo ^= Z_ALL_LO[by]; hi ^= Z_ALL_HI[by]; }
  }
  if (pos.free) { lo ^= Z_FREE_LO[0]; hi ^= Z_FREE_HI[0]; }
  if (pos.haste !== undefined) { lo ^= Z_HASTE_LO[pos.haste]; hi ^= Z_HASTE_HI[pos.haste]; }
  if (pos.rage) { lo ^= Z_RAGE_LO[pos.rage - 1]; hi ^= Z_RAGE_HI[pos.rage - 1]; }
  for (let i = 0; i < 4; i++) if ((pos.castle ?? 0) & (1 << i)) { lo ^= Z_CASTLE_LO[i]; hi ^= Z_CASTLE_HI[i]; }
  const ep = epForKey(pos);
  if (ep >= 0) { lo ^= Z_EP_LO[ep & 7]; hi ^= Z_EP_HI[ep & 7]; }
  out[0] = lo;
  out[1] = hi;
  return combine(lo, hi);
}
