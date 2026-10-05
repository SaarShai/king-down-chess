/**
 * Tier-2 computer player: iterative-deepening PVS over one scratch board.
 *
 * Features: Zobrist transposition table (depth + bound + best move), move ordering
 * (TT move → MVV-LVA captures → killers → history), quiescence with stand-pat, delta pruning and
 * check evasions, mate-distance scores and pruning, a capped check extension, repetition and
 * 50-move draw detection, and a soft/hard time budget.
 *
 * Rules never move: every move comes from the engine's own `genPiece`, and legality is still
 * "make it, then look at your king". The only local trick is that make/unmake happens in place on
 * one `Uint8Array`, instead of `makeMove` allocating a fresh Position per node. See `apply`/`undo`
 * — they mirror `makeMove` exactly, including its write order.
 *
 * Runs inside a Web Worker (worker.ts).
 */
import {
  A, Color, GenMode, K, Move, P, Position, RULES, WHITE, colorOf, filterFree, filterHeld, filterMarks, freePass, genHasteFollowUp, genPiece, genPowerMoves, isAttacked,
  handOf, keepsLost, landed, materialDraw, overShots, piece, powerOf, powerUses, spend, typeOf,
} from '../rules/engine';
import type { CardName, PowerName } from '../rules/rules';
import { VALUES, evalBoard } from './eval';
import { NET_POWERS } from './nnue/net';
import {
  Z_FREE_HI, Z_FREE_LO, Z_HASTE_HI, Z_HASTE_LO, Z_HI, Z_LEFTB_HI, Z_LEFTB_LO, Z_LEFT_HI, Z_LEFT_LO, Z_LO, Z_LOST_HI, Z_LOST_LO, Z_MARK_HI, Z_MARK_LO,
  Z_TURN_HI, Z_TURN_LO, Z_USED_HI, Z_USED_LO, Z_WARD_HI, Z_WARD_LO,
  combine, hashBoard, lostIndex, usedIndex, zIndex,
} from './zobrist';

export { VALUES, evaluate, evaluatorName, setEvaluator } from './eval';

export const MATE = 100_000;
/** Scores at or beyond this are mate scores; used to fold ply distance in and out of the TT. */
const MATE_BOUND = MATE - 1000;
const INF = MATE * 2;
const MAX_PLY = 64;
/** Quiescence plies after the main search runs out of depth. */
const QMAX = 8;
/** A capture has to get within this of alpha to be worth searching in quiescence. */
const DELTA = 120;

// ---------------------------------------------------------------------------------------------
// Scratch state. All of it is module-level and reused between calls: the search allocates nothing
// per node except the Move objects that genPiece itself creates.

const board = new Uint8Array(64);
let rootTurn: Color = WHITE;
let hLo = 0, hHi = 0;
const hashOut = new Int32Array(2);

/** Undo log: one (square, previous byte) pair per write. Beast chains write up to ~17 per ply. */
const undoSq = new Int32Array(MAX_PLY * 32);
const undoPc = new Uint8Array(MAX_PLY * 32);
let sp = 0;

const bufs: Move[][] = Array.from({ length: MAX_PLY + QMAX + 2 }, () => []);
const orderBufs: Int32Array[] = Array.from({ length: MAX_PLY + QMAX + 2 }, () => new Int32Array(96));
/** Zobrist key of every position on the current search path, for repetition detection. */
const path = new Float64Array(MAX_PLY + QMAX + 2);
const killers = new Int32Array((MAX_PLY + 2) * 2);
const history = new Int32Array(64 * 64);

const TT_BITS = 17, TT_SIZE = 1 << TT_BITS, TT_MASK = TT_SIZE - 1;
const EXACT = 0, LOWER = 1, UPPER = 2;
const ttKey = new Float64Array(TT_SIZE);
const ttScore = new Int32Array(TT_SIZE);
const ttMove = new Int32Array(TT_SIZE);
/** depth << 2 | bound. */
const ttMeta = new Int32Array(TT_SIZE);

let nodes = 0, stop = false, hardDeadline = 0, rootDepth = 1;
let gameHistory = new Set<number>();

// ---------------------------------------------------------------------------------------------
// King powers (docs/RULES.md §4): the position state `Position` carries for them, mirrored here and
// kept in the incremental hash exactly as `positionKey` folds it in. One frame per `apply`.

/** The side to move at each ply. Not `root ^ (ply & 1)`: after a Haste's first move the same side moves again. */
const sideAt = new Uint8Array(MAX_PLY + QMAX + 2);
/** Uses spent per side (`Position.used`); a mutable pair, so `materialDraw` reads it with no allocation. */
const usedPair: [number, number] = [0, 0];
/** A pending free-mark move (`Position.free`), and the pending Haste square (-1 = none). */
let hasteSq = -1;
/** Freeze/Ice Wall marks, one slot per marking side (`Position.marks`): square (-1 = none), turns left, card-mode Ice Wall. */
const markSq = new Int32Array([-1, -1]), markLeft = new Int32Array([1, 1]), markWard = new Uint8Array(2);
let free = false;
/** Sacrifice reserve (`Position.lost`), kept only when `trackLost`. */
const lost = new Int32Array(32);
let trackLost = false;
/** Per side, for this search: is the uses count hashed (a counted power), is the reserve hashed (Sacrifice). */
const usedHashed = [false, false], lostHashed = [false, false];
/** Undo log of reserve changes: index and delta. */
const lostLogIdx = new Int32Array(MAX_PLY * 64), lostLogDelta = new Int8Array(MAX_PLY * 64);
let lostTop = 0;
/** One frame per `apply`: what `undo` restores. */
const FRAMES = MAX_PLY + QMAX + 8;
const fBase = new Int32Array(FRAMES), fUsed0 = new Int32Array(FRAMES), fUsed1 = new Int32Array(FRAMES);
const fMark = new Int32Array(FRAMES), fHaste = new Int32Array(FRAMES), fLostTop = new Int32Array(FRAMES), fFlip = new Uint8Array(FRAMES);
const fMark1 = new Int32Array(FRAMES), fMarkLeft = new Uint8Array(FRAMES), fMarkLeft1 = new Uint8Array(FRAMES), fFree = new Uint8Array(FRAMES), fWard = new Uint8Array(FRAMES);
let fsp = 0;
/**
 * Power moves are offered only at plies 0…`powerPlyMax` (root, reply, own next move by default);
 * below that the search plays the pieces' own moves. A search heuristic, not a rule: Flight alone
 * adds ~200 moves a node while unspent. Marks and a pending Haste bind at every ply.
 */
let powerPlyMax = 2;

/**
 * What one unspent use is worth to its owner, in centipawns, so the search spends it only for more
 * than that. Without this term the search would burn a one-use power on the first move that scores a
 * centipawn better. Sacrifice is priced by its reserve instead (`powerTerm`). Unlimited powers
 * (0 uses) hold nothing. `setPowerHold` overrides these for an experiment.
 */
const HOLD_DEFAULT: Readonly<Partial<Record<CardName, number>>> = Object.freeze({
  Freeze: 40, IceWall: 30, Strike: 120, Haste: 150, Flight: 60, March: 15, Leap: 20,
  // The card-only cards: starting guesses, not yet measured.
  Mimic: 60, Vault: 30, Curse: 40, SkyLift: 60,
});
const hold: Partial<Record<CardName, number>> = { ...HOLD_DEFAULT };
/** Share of the best returnable piece's gain (piece − pawn) an unspent Sacrifice is worth. */
let sacrificeHoldShare = 0.5;
export function setPowerHold(over?: Partial<Record<CardName, number>> & { sacrificeShare?: number }): void {
  for (const k of Object.keys(hold) as CardName[]) delete hold[k];
  Object.assign(hold, HOLD_DEFAULT, over);
  delete (hold as Record<string, unknown>).sacrificeShare;
  sacrificeHoldShare = over?.sacrificeShare ?? 0.5;
}
/** Per side for this search: uses allowed (-1 not spendable, 0 unlimited) and the power's name. */
const usesMax = [-1, -1];
const powerAt: (PowerName | '')[] = ['', ''];
/** Per side: its card hand (`Rules.hands`); empty outside card mode. */
const handAt: (readonly CardName[])[] = [[], []];
/** Per side: the power's row in the net (`NET_POWERS`), or -1. */
const powerRow = [-1, -1];

function setUsed(c: Color, v: number): void {
  if (usedHashed[c]) {
    const old = usedPair[c];
    if (handAt[c].length) {
      // Card mode: one key per played card (bit k of `used`).
      for (let d = old ^ v, k = 0; d; d >>= 1, k++) if (d & 1) { hLo ^= Z_USED_LO[c * 8 + k]; hHi ^= Z_USED_HI[c * 8 + k]; }
    } else {
      if (old > 0) { const i = usedIndex(c, old); hLo ^= Z_USED_LO[i]; hHi ^= Z_USED_HI[i]; }
      if (v > 0) { const i = usedIndex(c, v); hLo ^= Z_USED_LO[i]; hHi ^= Z_USED_HI[i]; }
    }
  }
  usedPair[c] = v;
}
/** The keys of side `by`'s mark on `sq`: square, turns left above 1, a card-mode Ice Wall. */
function markKey(by: number, sq: number, left: number, ward: boolean): void {
  const i = by * 64 + sq;
  hLo ^= Z_MARK_LO[i]; hHi ^= Z_MARK_HI[i];
  if (left > 1) { hLo ^= by ? Z_LEFTB_LO[left] : Z_LEFT_LO[left]; hHi ^= by ? Z_LEFTB_HI[left] : Z_LEFT_HI[left]; }
  if (ward) { hLo ^= Z_WARD_LO[by]; hHi ^= Z_WARD_HI[by]; }
}
/** Set side `by`'s mark (-1 clears it), with its keys. */
function setMark(by: number, v: number, left: number, ward = false): void {
  if (markSq[by] >= 0) markKey(by, markSq[by], markLeft[by], markWard[by] === 1);
  if (v >= 0) markKey(by, v, left, ward);
  markSq[by] = v; markLeft[by] = left; markWard[by] = v >= 0 && ward ? 1 : 0;
}
function setFree(v: boolean): void {
  if (v !== free) { hLo ^= Z_FREE_LO[0]; hHi ^= Z_FREE_HI[0]; free = v; }
}
function setHaste(v: number): void {
  if (hasteSq >= 0) { hLo ^= Z_HASTE_LO[hasteSq]; hHi ^= Z_HASTE_HI[hasteSq]; }
  if (v >= 0) { hLo ^= Z_HASTE_LO[v]; hHi ^= Z_HASTE_HI[v]; }
  hasteSq = v;
}
/** Change one reserve count, with its hash, without logging (the log is `lostAdd`'s job). */
function lostSet(i: number, v: number): void {
  if (lostHashed[i >> 4]) {
    const old = lost[i];
    if (old > 0) { const k = lostIndex(i, old); hLo ^= Z_LOST_LO[k]; hHi ^= Z_LOST_HI[k]; }
    if (v > 0) { const k = lostIndex(i, v); hLo ^= Z_LOST_LO[k]; hHi ^= Z_LOST_HI[k]; }
  }
  lost[i] = v;
}
function lostAdd(i: number, d: number): void {
  lostSet(i, lost[i] + d);
  lostLogIdx[lostTop] = i;
  lostLogDelta[lostTop] = d;
  lostTop++;
}

/** The unspent-power term for side `c`: what keeping its remaining uses is worth (see `hold`). */
function powerTerm(c: Color): number {
  const hand = handAt[c];
  if (hand.length) {
    // Card mode: each unplayed card holds what one use of its power holds.
    // Two Sacrifice cards share one reserve, so they hold what one does (as in king mode).
    let t = 0, sacrifice = false;
    for (let k = 0; k < hand.length; k++) if (!(usedPair[c] >> k & 1)) { if (hand[k] === 'Sacrifice') sacrifice = true; else t += hold[hand[k]] ?? 0; }
    return sacrifice ? t + sacrificeTerm(c) : t;
  }
  const n = usesMax[c];
  if (n <= 0) return 0; // no spendable power, or unlimited uses
  const left = n - usedPair[c];
  if (left <= 0) return 0;
  const p = powerAt[c];
  if (p === 'Sacrifice') return sacrificeTerm(c);
  return (p ? hold[p] ?? 0 : 0) * left;
}
/** An unspent Sacrifice: a share of what the best returnable piece gains over the pawn it replaces. */
function sacrificeTerm(c: Color): number {
  let best = 0;
  for (let t = 1; t < 16; t++) if (lost[c * 16 + t] > 0 && t !== P && t !== K && t !== 9 /* G */) best = Math.max(best, VALUES[t]);
  return best > VALUES[P] ? Math.round(sacrificeHoldShare * (best - VALUES[P])) : 0;
}

/**
 * The power side `c` shows the net: its row while the power can still act (always-on, unlimited, or
 * uses left), else -1. A spent one-use power is no longer part of the position.
 */
function livePower(c: Color): number {
  const r = powerRow[c];
  // ponytail: the net has no card inputs, so card mode shows it none (tournaments use the linear evaluation).
  if (r < 0 || handAt[c].length) return -1;
  const n = usesMax[c];
  return n <= 0 || usedPair[c] < n ? r : -1;
}

/** The leaf score: the board's evaluation plus both sides' unspent powers, from `c`'s point of view. */
const evaluateNode = (c: Color): number => evalBoard(board, c, livePower(WHITE), livePower(1)) + powerTerm(c) - powerTerm((c ^ 1) as Color);

// ---------------------------------------------------------------------------------------------
// Make / unmake on the scratch board, with an incremental hash.

function write(s: number, v: number): void {
  const old = board[s];
  undoSq[sp] = s;
  undoPc[sp] = old;
  sp++;
  if (old) { const i = zIndex(old, s); hLo ^= Z_LO[i]; hHi ^= Z_HI[i]; }
  if (v) { const i = zIndex(v, s); hLo ^= Z_LO[i]; hHi ^= Z_HI[i]; }
  board[s] = v;
}

/**
 * Same writes, in the same order, as engine.makeMove, plus the power state it updates. Returns the
 * undo mark. `c` is the side moving: a Freeze names an *enemy* square, so the board cannot say.
 */
function apply(m: Move, c: Color): number {
  const base = sp;
  fBase[fsp] = base; fUsed0[fsp] = usedPair[0]; fUsed1[fsp] = usedPair[1];
  fMark[fsp] = markSq[0]; fMark1[fsp] = markSq[1]; fHaste[fsp] = hasteSq; fLostTop[fsp] = lostTop;
  fMarkLeft[fsp] = markLeft[0]; fMarkLeft1[fsp] = markLeft[1]; fFree[fsp] = free ? 1 : 0; fWard[fsp] = markWard[0] | markWard[1] << 1;
  const still = m.power === 'freeze' || m.power === 'ward' || m.pass === true;
  if (!still) {
    const mover = board[m.from], other = board[m.to];
    if (trackLost) {
      for (let i = 0; i < m.captures.length; i++) { const v = board[m.captures[i]]; lostAdd(colorOf(v) * 16 + typeOf(v), 1); }
      if (m.selfRemove) lostAdd(c * 16 + typeOf(mover), 1);
      if (m.power === 'sacrifice' && m.promo) lostAdd(c * 16 + m.promo, -1);
    }
    for (let i = 0; i < m.captures.length; i++) write(m.captures[i], 0);
    if (m.shove) { write(m.shove.to, board[m.shove.from]); write(m.shove.from, 0); }
    write(m.from, m.swap ? other : 0);
    write(m.to, m.selfRemove ? 0 : landed(mover, m));
  }
  if (m.power) setUsed(c, spend(c, usedPair[c], m.power));
  const isMark = m.power === 'freeze' || m.power === 'ward';
  const holdTurn = m.power === 'haste' || (isMark && RULES.markFree);
  // Mirror of makeMove: the opponent's mark uses up a turn when this move passes the turn; a new
  // mark replaces only the mover's own slot.
  const o = c ^ 1;
  if (markSq[o] >= 0 && !holdTurn) { const left = markLeft[o] - 1; setMark(o, left > 0 ? markSq[o] : -1, left, markWard[o] === 1); }
  if (isMark) setMark(c, m.to, RULES.markTurns, m.power === 'ward' && handAt[c].length > 0);
  setFree(isMark && RULES.markFree);
  setHaste(m.power === 'haste' ? m.to : -1);
  fFlip[fsp] = holdTurn ? 0 : 1;
  if (!holdTurn) { hLo ^= Z_TURN_LO; hHi ^= Z_TURN_HI; }
  fsp++;
  return base;
}

function undo(base: number): void {
  fsp--;
  if (fFlip[fsp]) { hLo ^= Z_TURN_LO; hHi ^= Z_TURN_HI; }
  setHaste(fHaste[fsp]);
  setFree(fFree[fsp] === 1);
  setMark(0, fMark[fsp], fMarkLeft[fsp], (fWard[fsp] & 1) === 1);
  setMark(1, fMark1[fsp], fMarkLeft1[fsp], (fWard[fsp] & 2) === 2);
  setUsed(0, fUsed0[fsp]);
  setUsed(1, fUsed1[fsp]);
  while (lostTop > fLostTop[fsp]) { lostTop--; const i = lostLogIdx[lostTop]; lostSet(i, lost[i] - lostLogDelta[lostTop]); }
  while (sp > base) {
    sp--;
    const s = undoSq[sp], old = undoPc[sp], cur = board[s];
    if (cur) { const i = zIndex(cur, s); hLo ^= Z_LO[i]; hHi ^= Z_HI[i]; }
    if (old) { const i = zIndex(old, s); hLo ^= Z_LO[i]; hHi ^= Z_HI[i]; }
    board[s] = old;
  }
}

/**
 * The same writes without the hash, for the legality probe. That probe runs for every pseudo-legal
 * move at every node — ~40x more often than a real make — and it throws the position away again,
 * so maintaining the key there is pure cost. Measured: it is what made the first in-place version
 * slower than the engine's allocating `makeMove`.
 */
function applyQuiet(m: Move): number {
  const base = sp;
  if (m.power === 'freeze' || m.power === 'ward' || m.pass) return base; // they change no square
  const mover = board[m.from], other = board[m.to];
  for (let i = 0; i < m.captures.length; i++) {
    undoSq[sp] = m.captures[i];
    undoPc[sp] = board[m.captures[i]];
    sp++;
    board[m.captures[i]] = 0;
  }
  if (m.shove) {
    undoSq[sp] = m.shove.to; undoPc[sp] = board[m.shove.to]; sp++;
    board[m.shove.to] = board[m.shove.from];
    undoSq[sp] = m.shove.from; undoPc[sp] = board[m.shove.from]; sp++;
    board[m.shove.from] = 0;
  }
  undoSq[sp] = m.from; undoPc[sp] = mover; sp++;
  board[m.from] = m.swap ? other : 0;
  undoSq[sp] = m.to; undoPc[sp] = board[m.to]; sp++;
  board[m.to] = m.selfRemove ? 0 : landed(mover, m);
  return base;
}

function undoQuiet(base: number): void {
  while (sp > base) {
    sp--;
    board[undoSq[sp]] = undoPc[sp];
  }
}

/**
 * `LINE[k * 64 + s]` is 1 when `s` lies on one of the eight lines through `k`, at any distance. A
 * move can expose its own king only along such a line, so `genLegal` tests the others for nothing.
 */
const LINE = ((): Uint8Array => {
  const t = new Uint8Array(64 * 64);
  const D8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  for (let k = 0; k < 64; k++) for (const [df, dr] of D8) {
    for (let f = (k & 7) + df, r = (k >> 3) + dr; f >= 0 && f < 8 && r >= 0 && r < 8; f += df, r += dr) t[k * 64 + r * 8 + f] = 1;
  }
  return t;
})();
/** Off for the cross-check test only: then every move is made and the king looked at. */
let fastLegality = true;
export function setFastLegality(on: boolean): void { fastLegality = on; }

const attacked = (c: Color): boolean => {
  const k = board.indexOf(piece(K, c));
  return k >= 0 && isAttacked(board, k, (c ^ 1) as Color);
};

/**
 * Legal moves into a reused buffer: pseudo-legal, then make/unmake and look at our own king. The
 * power moves come from the engine's own `genPowerMoves`, offered while `ply <= powerPlyMax`; a
 * pending Haste allows only the hasted piece and `pass`; a mark filters what it forbids.
 */
function genLegal(out: Move[], c: Color, mode: GenMode, ply: number, inCheckKnown?: boolean): Move[] {
  out.length = 0;
  if (hasteSq >= 0) genHasteFollowUp(board, hasteSq, mode, out);
  else {
    for (let s = 0; s < 64; s++) {
      const p = board[s];
      if (p && colorOf(p) === c) genPiece(board, s, mode, out);
    }
    if (free) { filterFree(c, true, out); if (mode === 'all') out.push(freePass(board, c)); }
    else if (mode === 'all' && ply <= powerPlyMax && usesMax[c] >= 0) genPowerMoves(board, c, usedPair[c], trackLost ? lost : undefined, out, 0, out.length);
  }
  // Only the opponent's mark binds the side to move; its own Freeze only keeps a Curse off its piece.
  if (markSq[c ^ 1] >= 0) filterMarks(c, markSq[c ^ 1], (c ^ 1) as Color, out, 0, markWard[c ^ 1] === 1);
  if (markSq[c] >= 0) filterHeld(c, markSq[c], markWard[c] === 1, out);
  // Legality is "make it, then look at our king" — but only a move that could expose the king needs
  // the look: we are in check; the king itself moves (Death Touch, Mercy and the Darkness step
  // included); a swap or a shove moves a second piece (a SkyLift is a swap); the mover leaves a line
  // through the king (a slider's ray opens); a capture removes a piece on such a line; or an enemy
  // catapult could use the arriving piece as its screen. The shelters and the Darkness pawn armour
  // change which pieces may be taken, never the king, so they add nothing here. The two-square
  // reaches (Death Touch's, the Darkness king's take) pass over a square next to our king, and a
  // move that empties it leaves a line through the king, so it is tested.
  // A `plusDiagFwd2Clear` archer shot two squares diagonally is blocked by the square between,
  // which is diagonally next to our king: a move that empties it leaves a line through the king, and
  // one that fills it only blocks. An `overShots` archer shoots only over a piece on the square between, which
  // is next to our king: a move that fills it can open the shot, so, like a catapult's screen, a move
  // arriving on a line through the king is tested while an enemy archer stands on the board. The other archer shots ignore blockers and the leapers are never blocked,
  // so nothing else can change an attack on the king — except a Curse, which moves an *enemy* piece
  // that may arrive attacking it. `setFastLegality(false)` turns this off for the cross-check test.
  const k = board.indexOf(piece(K, c));
  const inChk = k < 0 || (inCheckKnown ?? attacked(c));
  const lines = k * 64;
  const lob = board.includes(piece(13 /* C */, (c ^ 1) as Color)) || (overShots() && board.includes(piece(A, (c ^ 1) as Color)));
  let n = 0;
  for (let i = 0; i < out.length; i++) {
    const m = out[i];
    let test: boolean;
    if (!fastLegality || inChk) test = true;
    else if (m.power === 'freeze' || m.power === 'ward' || m.pass) test = false; // no square changes
    else {
      test = m.power === 'curse' || m.from === k || m.swap === true || m.shove !== undefined || LINE[lines + m.from] === 1 || (lob && LINE[lines + m.to] === 1);
      for (let j = 0; !test && j < m.captures.length; j++) if (LINE[lines + m.captures[j]] === 1) test = true;
    }
    if (test) {
      const base = applyQuiet(m);
      const ok = !attacked(c);
      undoQuiet(base);
      if (!ok) continue;
    }
    out[n++] = m;
  }
  out.length = n;
  return out;
}

/** Test probe: the search's own legal list for `pos` at the root (power moves included). */
export function searchLegal(pos: Position): Move[] {
  initPosition(pos);
  return [...genLegal([], pos.turn, 'all', 0)];
}

// ---------------------------------------------------------------------------------------------
// Ordering.

/** Material won by a move: every victim, the promotion delta, minus the paladin's own life. */
function gain(m: Move): number {
  let g = 0;
  for (let i = 0; i < m.captures.length; i++) g += VALUES[typeOf(board[m.captures[i]])];
  if (m.promo) g += VALUES[m.promo] - VALUES[P];
  if (m.selfRemove) g -= VALUES[typeOf(board[m.from])];
  return g;
}

/** Compact move signature for TT / killer slots. Distinct chains can collide; ordering only. */
const encode = (m: Move): number =>
  (m.from | (m.to << 6) | ((m.promo ?? 0) << 12) | (Math.min(m.captures.length, 15) << 16)) + 1;

function score(moves: Move[], ply: number, ttEnc: number): Int32Array {
  if (orderBufs[ply].length < moves.length) orderBufs[ply] = new Int32Array(moves.length * 2);
  const s = orderBufs[ply];
  const k0 = killers[ply * 2], k1 = killers[ply * 2 + 1];
  for (let i = 0; i < moves.length; i++) {
    const m = moves[i], enc = encode(m);
    if (enc === ttEnc) s[i] = 1 << 28;
    else if (m.captures.length || m.promo) s[i] = (1 << 24) + gain(m) * 16 - VALUES[typeOf(board[m.from])];
    else if (enc === k0) s[i] = (1 << 23) + 1;
    else if (enc === k1) s[i] = 1 << 23;
    else s[i] = Math.min(history[(m.from << 6) | m.to], (1 << 22) - 1);
  }
  return s;
}

/** Selection sort, one pick per iteration: no allocation, and cutoffs skip the rest of the work. */
function pick(moves: Move[], s: Int32Array, i: number): void {
  let b = i;
  for (let j = i + 1; j < moves.length; j++) if (s[j] > s[b]) b = j;
  if (b === i) return;
  const m = moves[i]; moves[i] = moves[b]; moves[b] = m;
  const v = s[i]; s[i] = s[b]; s[b] = v;
}

// ---------------------------------------------------------------------------------------------
// Draws and the transposition table.

/**
 * Two-fold inside the search (and against the supplied game history) counts as a draw.
 * Pawn moves reset the halfmove clock but need not be irreversible here: an Ogre
 * can shove a pawn backward (and a Maester can swap it). Scan the whole path — every ply, not every
 * second one: a Haste turn takes two plies, and the key carries the side to move anyway.
 */
function repeated(ply: number, key: number): boolean {
  for (let i = ply - 1; i >= 0; i--) if (path[i] === key) return true;
  return gameHistory.has(key);
}

const toTT = (s: number, ply: number): number => (s >= MATE_BOUND ? s + ply : s <= -MATE_BOUND ? s - ply : s);
const fromTT = (s: number, ply: number): number => (s >= MATE_BOUND ? s - ply : s <= -MATE_BOUND ? s + ply : s);

function ttStore(key: number, idx: number, depth: number, s: number, bound: number, enc: number, ply: number): void {
  const meta = (depth << 2) | bound;
  if (ttKey[idx] === key && (ttMeta[idx] >> 2) > depth && bound !== EXACT) return;
  ttKey[idx] = key;
  ttScore[idx] = toTT(s, ply);
  ttMeta[idx] = meta;
  ttMove[idx] = enc || ttMove[idx];
}

// ---------------------------------------------------------------------------------------------
// Search.

const timeUp = (): boolean => {
  if ((++nodes & 1023) === 0 && performance.now() > hardDeadline) stop = true;
  return stop;
};

/** Terminal rules shared by root, full search and capture continuations. */
function terminalScore(c: Color, ply: number, hm: number): number | null {
  if (board.indexOf(piece(K, c)) < 0) return -MATE + ply;
  if (board.indexOf(piece(K, (c ^ 1) as Color)) < 0) return MATE - ply;
  if ((RULES.fiftyMove && hm >= 100) || (RULES.threefold && ply > 0 && repeated(ply, combine(hLo, hHi)))) {
    // Mate ends the game before a draw-clock/history condition can claim it.
    return attacked(c) && genLegal(bufs[ply], c, 'all', ply).length === 0 ? -MATE + ply : 0;
  }
  return materialDraw(board, usedPair) ? 0 : null;
}

function quiesce(alpha: number, beta: number, ply: number, qdepth: number, hm: number): number {
  const c = sideAt[ply] as Color;
  const terminal = terminalScore(c, ply, hm);
  if (terminal != null) return terminal;
  if (timeUp() || ply >= MAX_PLY + QMAX) return evaluateNode(c);
  const key = combine(hLo, hHi);
  path[ply] = key;
  const inChk = attacked(c);
  // Stalemate is terminal even at the capture-search horizon, before stand-pat. No power is started
  // here (`ply` past `powerPlyMax`), so a capture continuation never holds the turn.
  const moves = genLegal(bufs[ply], c, 'all', MAX_PLY, inChk);
  if (!moves.length) return inChk ? -MATE + ply : 0;
  let best: number;
  if (inChk) {
    best = -INF; // no stand-pat while in check: every evasion has to be looked at
  } else {
    best = evaluateNode(c);
    if (best >= beta || qdepth === 0) return best;
    if (best > alpha) alpha = best;
  }
  if (!inChk) {
    let n = 0;
    for (const m of moves) if (m.captures.length) moves[n++] = m;
    moves.length = n;
  }
  const s = score(moves, ply, 0);
  const stand = best;
  for (let i = 0; i < moves.length; i++) {
    pick(moves, s, i);
    const m = moves[i];
    // Delta pruning: even winning this material would not reach alpha. Rifle shots are safe to
    // prune here too — the gain is the whole story, there is no recapture to discover.
    if (!inChk && stand + gain(m) + DELTA < alpha) continue;
    const nhm = m.captures.length || typeOf(board[m.from]) === P ? 0 : hm + 1;
    const base = apply(m, c);
    sideAt[ply + 1] = c ^ 1;
    const v = -quiesce(-beta, -alpha, ply + 1, qdepth - 1, nhm);
    undo(base);
    if (stop) break;
    if (v > best) best = v;
    if (v > alpha) alpha = v;
    if (alpha >= beta) break;
  }
  return best;
}

function negamax(depth: number, alpha: number, beta: number, ply: number, hm: number): number {
  const c = sideAt[ply] as Color;
  const terminal = terminalScore(c, ply, hm);
  if (terminal != null) return terminal;
  if (timeUp() || ply >= MAX_PLY) return evaluateNode(c);

  const key = combine(hLo, hHi);
  path[ply] = key;

  // Mate-distance pruning: a shorter mate already found elsewhere beats anything below here.
  if (alpha < -MATE + ply) alpha = -MATE + ply;
  if (beta > MATE - ply - 1) beta = MATE - ply - 1;
  if (alpha >= beta) return alpha;

  const idx = hLo & TT_MASK;
  let ttEnc = 0;
  if (ttKey[idx] === key) {
    ttEnc = ttMove[idx];
    const meta = ttMeta[idx];
    if ((meta >> 2) >= depth) {
      const s = fromTT(ttScore[idx], ply), bound = meta & 3;
      if (bound === EXACT || (bound === LOWER && s >= beta) || (bound === UPPER && s <= alpha)) return s;
    }
  }

  const inChk = attacked(c);
  if (inChk && ply < rootDepth * 2) depth++; // check extension, capped at twice the nominal depth
  if (depth <= 0 && hasteSq < 0 && !free) return quiesce(alpha, beta, ply, QMAX, hm);

  const moves = genLegal(bufs[ply], c, 'all', ply, inChk);
  if (moves.length === 0) return inChk ? -MATE + ply : 0;
  const s = score(moves, ply, ttEnc);

  let best = -INF, bestEnc = 0, bound = UPPER;
  for (let i = 0; i < moves.length; i++) {
    pick(moves, s, i);
    const m = moves[i];
    const quiet = m.captures.length === 0 && !m.promo;
    const nhm = moveResets(m) ? 0 : hm + 1;
    const holdTurn = m.power === 'haste' || (RULES.markFree && (m.power === 'freeze' || m.power === 'ward'));
    const base = apply(m, c);
    let v: number;
    if (holdTurn) {
      // Haste, or a free mark: the same side moves again — same depth (the turn is not over), same
      // sign, full window.
      sideAt[ply + 1] = c;
      v = negamax(depth, alpha, beta, ply + 1, nhm);
    } else {
      sideAt[ply + 1] = c ^ 1;
      v = -negamax(depth - 1, i === 0 ? -beta : -alpha - 1, -alpha, ply + 1, nhm);
      if (i > 0 && v > alpha && v < beta) v = -negamax(depth - 1, -beta, -alpha, ply + 1, nhm);
    }
    undo(base);
    if (stop) return best === -INF ? alpha : best;
    if (v > best) { best = v; bestEnc = encode(m); }
    if (v > alpha) { alpha = v; bound = EXACT; }
    if (alpha >= beta) {
      bound = LOWER;
      if (quiet) {
        const enc = encode(m);
        if (killers[ply * 2] !== enc) { killers[ply * 2 + 1] = killers[ply * 2]; killers[ply * 2] = enc; }
        history[(m.from << 6) | m.to] += depth * depth;
      }
      break;
    }
  }
  ttStore(key, idx, depth, best, bound, bestEnc, ply);
  return best;
}

export interface SearchOptions {
  /** Wall-clock budget. Omit it together with `maxDepth` for a fixed-depth, clock-free search. */
  timeMs?: number;
  maxDepth?: number;
  /** Zobrist keys of earlier game positions (see `positionKey`) so the search can see repetitions. */
  history?: number[] | bigint[];
  /**
   * 2 = also report the second-best root move's score (`SearchResult.second`), for the decision-cost
   * metric in docs/SIM-PLAN.md. It searches every root move with a full window, so the root loses
   * its alpha-beta cutoffs and the search costs roughly twice as much. Default 1: off.
   */
  multiPv?: 1 | 2;
  /**
   * Root sampling band in centipawns (docs/research/ai-players.md, stage 1): after the search, pick
   * uniformly among root moves whose score is within `temperature` of the best. Opens vary between
   * games without weakening play by more than the band. 0/undefined is the untouched deterministic
   * choice. Implies the full-window root scan (`multiPv` cost), so use it where that is cheap — the
   * browser uses it for the first few plies only.
   */
  temperature?: number;
  /** Random source for `temperature`; defaults to `Math.random`. Pass a seeded one for tests. */
  rng?: () => number;
  /** King powers are offered at plies 0…`powerPlies` of the tree (default 2); see `powerPlyMax`. */
  powerPlies?: number;
}
export interface SearchResult {
  move: Move | null; score: number; depth: number; nodes: number;
  /** Second-best root score, mover's point of view. Only with `multiPv: 2` and 2+ root moves. */
  second?: number;
}

/**
 * Quiescence score of `pos`, mover's point of view — the static evaluation with every capture
 * sequence played out. The Texel data sampler (`src/sim/tune.ts`) keeps a position only when this
 * agrees with `evaluate()`, which is what "quiet" means here. No clock, no transposition table:
 * same board, same answer.
 */
export function quiesceScore(pos: Position): number {
  initPosition(pos);
  gameHistory.clear();
  hardDeadline = Infinity;
  return quiesce(-INF, INF, 0, QMAX, pos.halfmove);
}

/**
 * Key of a position, for `SearchOptions.history` and `Game`'s repetition count: the board, the side
 * to move and the king-power state that changes the legal moves — uses spent of a counted power,
 * a Freeze/Ice Wall mark, a pending Haste, and the reserve of a side that plays Sacrifice. The
 * search keeps the same key incrementally (`apply`/`undo`), so the two are one definition.
 */
export function positionKey(pos: Position): number {
  hashBoard(pos.board, pos.turn, hashOut);
  let lo = hashOut[0], hi = hashOut[1];
  for (let c = 0; c < 2; c++) {
    const u = pos.used?.[c] ?? 0;
    if (handOf(c as Color).length) { for (let k = 0; k < 8; k++) if (u >> k & 1) { lo ^= Z_USED_LO[c * 8 + k]; hi ^= Z_USED_HI[c * 8 + k]; } }
    else if (u > 0 && powerUses(c as Color) > 0) { const i = usedIndex(c, u); lo ^= Z_USED_LO[i]; hi ^= Z_USED_HI[i]; }
    if (pos.lost && (powerOf(c as Color) === 'Sacrifice' || handOf(c as Color).includes('Sacrifice'))) {
      for (let t = 1; t < 16; t++) {
        const n = pos.lost[c * 16 + t];
        if (n > 0) { const k = lostIndex(c * 16 + t, n); lo ^= Z_LOST_LO[k]; hi ^= Z_LOST_HI[k]; }
      }
    }
  }
  for (let by = 0; by < 2; by++) {
    const k = pos.marks?.[by];
    if (!k) continue;
    const i = by * 64 + k.sq, left = k.left ?? 1;
    lo ^= Z_MARK_LO[i]; hi ^= Z_MARK_HI[i];
    if (left > 1) { lo ^= by ? Z_LEFTB_LO[left] : Z_LEFT_LO[left]; hi ^= by ? Z_LEFTB_HI[left] : Z_LEFT_HI[left]; }
    if (k.ward) { lo ^= Z_WARD_LO[by]; hi ^= Z_WARD_HI[by]; }
  }
  if (pos.free) { lo ^= Z_FREE_LO[0]; hi ^= Z_FREE_HI[0]; }
  if (pos.haste !== undefined) { lo ^= Z_HASTE_LO[pos.haste]; hi ^= Z_HASTE_HI[pos.haste]; }
  hashOut[0] = lo;
  hashOut[1] = hi;
  return combine(lo, hi);
}

function initPosition(pos: Position): void {
  board.set(pos.board);
  rootTurn = pos.turn;
  sideAt[0] = pos.turn;
  positionKey(pos); // fills hashOut, including the power state
  hLo = hashOut[0];
  hHi = hashOut[1];
  sp = 0;
  fsp = 0;
  lostTop = 0;
  nodes = 0;
  stop = false;
  usedPair[0] = pos.used?.[0] ?? 0;
  usedPair[1] = pos.used?.[1] ?? 0;
  for (let by = 0; by < 2; by++) {
    const k = pos.marks?.[by];
    markSq[by] = k ? k.sq : -1; markLeft[by] = k?.left ?? 1; markWard[by] = k?.ward ? 1 : 0;
  }
  free = !!pos.free;
  hasteSq = pos.haste ?? -1;
  trackLost = keepsLost();
  lost.fill(0);
  if (pos.lost) for (let i = 0; i < 32; i++) lost[i] = pos.lost[i] ?? 0;
  for (let c = 0; c < 2; c++) {
    handAt[c] = handOf(c as Color);
    if (handAt[c].length > 8) throw new Error('a hand holds at most 8 cards (one hash key per card)');
    usesMax[c] = handAt[c].length || powerUses(c as Color);
    powerAt[c] = powerOf(c as Color);
    powerRow[c] = powerAt[c] ? NET_POWERS.indexOf(powerAt[c] as PowerName) : -1;
    usedHashed[c] = usesMax[c] > 0;
    lostHashed[c] = powerAt[c] === 'Sacrifice' || handAt[c].includes('Sacrifice');
  }
}

/**
 * For the net's training data (tools/powers-net.ts): the live power rows `[white, black]` the search
 * shows the net in `pos`, and the unspent-power term it adds to the board evaluation there, from the
 * side to move's point of view. Under the current rules (`RULES.kings`). Not for use inside a search:
 * it resets the search's scratch position.
 */
export function leafPowers(pos: Position): { rows: [number, number]; term: number } {
  initPosition(pos);
  return { rows: [livePower(WHITE), livePower(1)], term: powerTerm(pos.turn) - powerTerm((pos.turn ^ 1) as Color) };
}

/** A move that resets the 50-move clock: a capture or a pawn move (never a mark or a pass). */
const moveResets = (m: Move): boolean =>
  m.captures.length > 0 || (!m.pass && m.power !== 'freeze' && m.power !== 'ward' && typeOf(board[m.from]) === P);

/**
 * Test probe: apply `m` to `pos` the way the search does and return the incremental key after it and
 * after the undo, to compare with `positionKey(makeMove(pos, m))` and `positionKey(pos)`.
 */
export function probeApply(pos: Position, m: Move): { after: number; back: number } {
  initPosition(pos);
  const base = apply(m, pos.turn);
  const after = combine(hLo, hHi);
  undo(base);
  return { after, back: combine(hLo, hHi) };
}

/**
 * Forget the transposition table, killers and history heuristic.
 *
 * The tables are module-level and survive between calls on purpose — inside one game that is free
 * strength. Between games (or between runs of a simulation in the same worker) call this, so game
 * n cannot be shaped by games 1…n-1. `resetSearchState()` plus `search(pos, { maxDepth: n })` with
 * no `timeMs` is fully deterministic: no clock, no randomness, same answer every time.
 */
export function resetSearchState(): void {
  ttKey.fill(0);
  ttScore.fill(0);
  ttMove.fill(0);
  ttMeta.fill(0);
  killers.fill(0);
  history.fill(0);
  path.fill(0);
}

export function search(pos: Position, opts: SearchOptions = {}): SearchResult {
  // A fixed-depth search must not depend on how fast the machine is: no budget, no clock.
  const timeMs = opts.timeMs ?? (opts.maxDepth ? Infinity : 1000);
  const start = performance.now();
  const maxDepth = Math.min(opts.maxDepth ?? MAX_PLY, MAX_PLY - QMAX);
  hardDeadline = start + timeMs;

  initPosition(pos);
  powerPlyMax = opts.powerPlies ?? 2;
  rootDepth = 1;
  gameHistory = new Set(opts.history?.map(Number));
  killers.fill(0);
  for (let i = 0; i < history.length; i++) history[i] >>= 3; // fade, do not forget
  path[0] = combine(hLo, hHi);

  const terminal = terminalScore(pos.turn, 0, pos.halfmove);
  if (terminal != null) return { move: null, score: terminal, depth: 0, nodes: 0 };

  const temperature = opts.temperature ?? 0;
  const multi = opts.multiPv === 2 || temperature > 0;
  const rootMoves = genLegal(bufs[0], pos.turn, 'all', 0);
  const result: SearchResult = { move: rootMoves[0] ?? null, score: 0, depth: 0, nodes: 0 };
  if (rootMoves.length === 0) { result.score = attacked(pos.turn) ? -MATE : 0; return result; }

  let prevElapsed = 0;
  let lastScores: { move: Move; score: number }[] = [];
  for (let depth = 1; depth <= maxDepth; depth++) {
    rootDepth = depth;
    let bestScore = -INF, secondScore = -INF, bestIdx = -1, alpha = -INF;
    const scores: { move: Move; score: number }[] = [];
    for (let i = 0; i < rootMoves.length; i++) {
      const m = rootMoves[i];
      const nhm = moveResets(m) ? 0 : pos.halfmove + 1;
      const holdTurn = m.power === 'haste' || (RULES.markFree && (m.power === 'freeze' || m.power === 'ward'));
      const base = apply(m, pos.turn);
      let v: number;
      if (holdTurn) {
        // Haste or a free mark: the next move belongs to this same turn — same depth, same sign.
        sideAt[1] = pos.turn;
        v = negamax(depth, multi ? -INF : alpha, INF, 1, nhm);
      } else {
        sideAt[1] = pos.turn ^ 1;
        // MultiPV needs every root move's true score, so it cannot use the null window.
        v = -negamax(depth - 1, multi || i === 0 ? -INF : -alpha - 1, multi ? INF : -alpha, 1, nhm);
        if (!multi && i > 0 && v > alpha) v = -negamax(depth - 1, -INF, -alpha, 1, nhm);
      }
      undo(base);
      if (stop) break;
      scores.push({ move: m, score: v });
      if (v > bestScore) { secondScore = bestScore; bestScore = v; bestIdx = i; }
      else if (v > secondScore) secondScore = v;
      if (v > alpha) alpha = v;
    }
    if (bestIdx >= 0) {
      result.move = rootMoves[bestIdx];
      result.score = bestScore;
      result.depth = depth;
      if (opts.multiPv === 2 && secondScore > -INF) result.second = secondScore;
      lastScores = scores;
      rootMoves.unshift(...rootMoves.splice(bestIdx, 1)); // search the best move first next time
    }
    if (stop || Math.abs(bestScore) >= MATE_BOUND) break;
    const elapsed = performance.now() - start;
    // Stop between iterations when the next one cannot finish. With this ordering an iteration
    // costs roughly 1.4x the one before it; the flat cap catches a bad estimate from a fast start.
    if (elapsed + (elapsed - prevElapsed) * 1.4 > timeMs || elapsed > timeMs * 0.75) break;
    prevElapsed = elapsed;
  }
  // Root sampling: within the band, pick uniformly. Only after a completed iteration with scores.
  if (temperature > 0 && lastScores.length) {
    const cut = result.score - temperature;
    const candidates = lastScores.filter(s => s.score >= cut);
    const rng = opts.rng ?? Math.random;
    const pick = candidates[Math.min(candidates.length - 1, Math.floor(rng() * candidates.length))];
    result.move = pick.move;
    result.score = pick.score;
  }
  result.nodes = nodes;
  return result;
}

