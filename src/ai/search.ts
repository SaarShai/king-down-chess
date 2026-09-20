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
  Color, GenMode, K, Move, P, Position, RULES, WHITE, canCapture, colorOf, file, genPiece, isAttacked, landed, piece, rank, sq, typeOf,
} from '../rules/engine';
import { VALUES, evalBoard } from './eval';
import { Z_HI, Z_LO, Z_TURN_HI, Z_TURN_LO, combine, hashBoard, zIndex } from './zobrist';

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
let gameHistory: number[] = [];
/** Strike (Flame A) use per side during the current search, mirroring `Position.strike`. */
let strikeUsed: [boolean, boolean] = [false, false];
let strikeUndo: { sp: number; c: Color }[] = [];
/** Incremental-hash constants for a spent Strike, so `path` sees the state the way `positionKey` does. */
const Z_STRIKE_LO = [0x1f123bb5, 0x7b1d477a], Z_STRIKE_HI = [0x5c8a1b3d, 0x2ea9c6f1];
/** Queen directions, local because `engine.DIRS8` is private and `genPiece` is not being changed. */
const SLIDE8: readonly (readonly [number, number])[] = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

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

/** Same writes, in the same order, as engine.makeMove. Returns the undo mark. */
function apply(m: Move): number {
  const base = sp;
  const mover = board[m.from], other = board[m.to];
  for (let i = 0; i < m.captures.length; i++) write(m.captures[i], 0);
  if (m.shove) { write(m.shove.to, board[m.shove.from]); write(m.shove.from, 0); }
  write(m.from, m.swap ? other : 0);
  write(m.to, m.selfRemove ? 0 : landed(mover, m));
  hLo ^= Z_TURN_LO;
  hHi ^= Z_TURN_HI;
  if (m.strike) {
    const c = colorOf(mover);
    strikeUsed[c] = true;
    strikeUndo.push({ sp, c });
    hLo ^= Z_STRIKE_LO[c];
    hHi ^= Z_STRIKE_HI[c];
  }
  return base;
}

function undo(base: number): void {
  while (strikeUndo.length && strikeUndo[strikeUndo.length - 1].sp > base) {
    const e = strikeUndo.pop()!;
    strikeUsed[e.c] = false;
    hLo ^= Z_STRIKE_LO[e.c];
    hHi ^= Z_STRIKE_HI[e.c];
  }
  while (sp > base) {
    sp--;
    const s = undoSq[sp], old = undoPc[sp], cur = board[s];
    if (cur) { const i = zIndex(cur, s); hLo ^= Z_LO[i]; hHi ^= Z_HI[i]; }
    if (old) { const i = zIndex(old, s); hLo ^= Z_LO[i]; hHi ^= Z_HI[i]; }
    board[s] = old;
  }
  hLo ^= Z_TURN_LO;
  hHi ^= Z_TURN_HI;
}

/**
 * The same writes without the hash, for the legality probe. That probe runs for every pseudo-legal
 * move at every node — ~40x more often than a real make — and it throws the position away again,
 * so maintaining the key there is pure cost. Measured: it is what made the first in-place version
 * slower than the engine's allocating `makeMove`.
 */
function applyQuiet(m: Move): number {
  const base = sp;
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

const attacked = (c: Color): boolean => {
  const k = board.indexOf(piece(K, c));
  return k >= 0 && isAttacked(board, k, (c ^ 1) as Color);
};

/** Legal moves into a reused buffer: pseudo-legal, then make/unmake and look at our own king. */
function genLegal(out: Move[], c: Color, mode: GenMode): Move[] {
  out.length = 0;
  for (let s = 0; s < 64; s++) {
    const p = board[s];
    if (p && colorOf(p) === c) genPiece(board, s, mode, out);
  }
  // Strike (Flame A), mirroring `pseudoMoves`: once per side, an own non-king piece moves as a
  // queen. Kept out of `genPiece`, which is also the attack generator.
  if (mode === 'all' && RULES.kings[c]?.power === 'Strike' && !strikeUsed[c]) {
    const capture = RULES.strikeMode === 'capture';
    for (let s = 0; s < 64; s++) {
      const p = board[s];
      if (!p || colorOf(p) !== c || typeOf(p) === K) continue;
      for (const [df, dr] of SLIDE8) {
        for (let f = file(s) + df, r = rank(s) + dr; f >= 0 && f < 8 && r >= 0 && r < 8; f += df, r += dr) {
          const to = sq(f, r), v = board[to];
          if (!v) {
            if (!capture) out.push({ from: s, to, captures: [], strike: true });
            continue;
          }
          if (colorOf(v) !== c && typeOf(v) !== K && canCapture(p, typeOf(v))) {
            out.push(capture ? { from: s, to: s, captures: [to], strike: true } : { from: s, to, captures: [to], strike: true });
          }
          break;
        }
      }
    }
  }
  let n = 0;
  for (let i = 0; i < out.length; i++) {
    const m = out[i];
    const base = applyQuiet(m);
    const ok = !attacked(c);
    undoQuiet(base);
    if (ok) out[n++] = m;
  }
  out.length = n;
  return out;
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
 * Nothing before the last irreversible move can repeat, so `hm` bounds both scans.
 */
function repeated(ply: number, hm: number, key: number): boolean {
  for (let i = ply - 2; i >= 0 && i >= ply - hm; i -= 2) if (path[i] === key) return true;
  const n = gameHistory.length;
  for (let i = n - 1; i >= 0 && i >= n - (hm - ply); i--) if (gameHistory[i] === key) return true;
  return false;
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

function quiesce(alpha: number, beta: number, ply: number, qdepth: number): number {
  const c = (rootTurn ^ (ply & 1)) as Color;
  if (timeUp() || ply >= MAX_PLY + QMAX) return evalBoard(board, c);
  const inChk = attacked(c);
  let best: number;
  if (inChk) {
    best = -INF; // no stand-pat while in check: every evasion has to be looked at
  } else {
    best = evalBoard(board, c);
    if (best >= beta || qdepth === 0) return best;
    if (best > alpha) alpha = best;
  }
  const moves = genLegal(bufs[ply], c, inChk ? 'all' : 'captures');
  if (inChk && moves.length === 0) return -MATE + ply;
  const s = score(moves, ply, 0);
  const stand = best;
  for (let i = 0; i < moves.length; i++) {
    pick(moves, s, i);
    const m = moves[i];
    // Delta pruning: even winning this material would not reach alpha. Rifle shots are safe to
    // prune here too — the gain is the whole story, there is no recapture to discover.
    if (!inChk && stand + gain(m) + DELTA < alpha) continue;
    const base = apply(m);
    const v = -quiesce(-beta, -alpha, ply + 1, qdepth - 1);
    undo(base);
    if (stop) break;
    if (v > best) best = v;
    if (v > alpha) alpha = v;
    if (alpha >= beta) break;
  }
  return best;
}

function negamax(depth: number, alpha: number, beta: number, ply: number, hm: number): number {
  const c = (rootTurn ^ (ply & 1)) as Color;
  if (timeUp() || ply >= MAX_PLY) return evalBoard(board, c);

  const key = combine(hLo, hHi);
  if (hm >= 100 || repeated(ply, hm, key)) return 0;
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
  if (depth <= 0) return quiesce(alpha, beta, ply, QMAX);

  const moves = genLegal(bufs[ply], c, 'all');
  if (moves.length === 0) return inChk ? -MATE + ply : 0;
  const s = score(moves, ply, ttEnc);

  let best = -INF, bestEnc = 0, bound = UPPER;
  for (let i = 0; i < moves.length; i++) {
    pick(moves, s, i);
    const m = moves[i];
    const quiet = m.captures.length === 0 && !m.promo;
    const nhm = m.captures.length || typeOf(board[m.from]) === P ? 0 : hm + 1;
    const base = apply(m);
    let v = -negamax(depth - 1, i === 0 ? -beta : -alpha - 1, -alpha, ply + 1, nhm);
    if (i > 0 && v > alpha && v < beta) v = -negamax(depth - 1, -beta, -alpha, ply + 1, nhm);
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
  board.set(pos.board);
  rootTurn = pos.turn;
  sp = 0;
  nodes = 0;
  stop = false;
  hardDeadline = Infinity;
  return quiesce(-INF, INF, 0, QMAX);
}

/** Key of a position, for `SearchOptions.history`. */
export function positionKey(pos: Position): number {
  hashBoard(pos.board, pos.turn, hashOut);
  if (pos.strike?.[0]) { hashOut[0] ^= Z_STRIKE_LO[0]; hashOut[1] ^= Z_STRIKE_HI[0]; }
  if (pos.strike?.[1]) { hashOut[0] ^= Z_STRIKE_LO[1]; hashOut[1] ^= Z_STRIKE_HI[1]; }
  return combine(hashOut[0], hashOut[1]);
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

  board.set(pos.board);
  rootTurn = pos.turn;
  hashBoard(board, pos.turn, hashOut);
  hLo = hashOut[0];
  hHi = hashOut[1];
  sp = 0;
  nodes = 0;
  stop = false;
  rootDepth = 1;
  gameHistory = opts.history ? (opts.history as readonly (number | bigint)[]).map(Number) : [];
  strikeUsed = [pos.strike?.[0] ?? false, pos.strike?.[1] ?? false];
  strikeUndo = [];
  killers.fill(0);
  for (let i = 0; i < history.length; i++) history[i] >>= 3; // fade, do not forget
  path[0] = combine(hLo, hHi);

  const temperature = opts.temperature ?? 0;
  const multi = opts.multiPv === 2 || temperature > 0;
  const rootMoves = genLegal(bufs[0], pos.turn, 'all');
  const result: SearchResult = { move: rootMoves[0] ?? null, score: 0, depth: 0, nodes: 0 };
  if (rootMoves.length === 0) return result;

  let prevElapsed = 0;
  let lastScores: { move: Move; score: number }[] = [];
  for (let depth = 1; depth <= maxDepth; depth++) {
    rootDepth = depth;
    let bestScore = -INF, secondScore = -INF, bestIdx = -1, alpha = -INF;
    const scores: { move: Move; score: number }[] = [];
    for (let i = 0; i < rootMoves.length; i++) {
      const m = rootMoves[i];
      const nhm = m.captures.length || typeOf(board[m.from]) === P ? 0 : pos.halfmove + 1;
      const base = apply(m);
      // MultiPV needs every root move's true score, so it cannot use the null window.
      let v = -negamax(depth - 1, multi || i === 0 ? -INF : -alpha - 1, multi ? INF : -alpha, 1, nhm);
      if (!multi && i > 0 && v > alpha) v = -negamax(depth - 1, -INF, -alpha, 1, nhm);
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


