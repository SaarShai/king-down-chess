#!/usr/bin/env -S npx tsx
/**
 * Start positions for the king-defence runs (docs/research/guard-strategies-2026-10-06.md, Part 2):
 * the defender's king under attack, the attacker to move, in four arms that differ only in the
 * Guard square.
 *
 *   npx tsx tools/king-threat-fens.ts rand --n 3000 [--seed 1] --out sim/probes/kd-rand.fens
 *   npx tsx tools/king-threat-fens.ts real --n 1500 [--seed 1] --out sim/probes/kd-real.fens <id | file.jsonl> ... [--dir sim/out]
 *
 * Output: one line per arm, `FEN<TAB>p<i>:<arm>:<variant>`, the four arms of position i on lines
 * 4i..4i+3 in the order gin, gout, pawn, none. `tournament.ts run --fens <file> --powers none
 * --mirror --openingRandomPlies 0 --pairs <4n>` plays each line once with the defender as White
 * and once mirrored; `tools/guard-probes.ts kd` reads the result.
 *
 * Arms: gin = the Guard next to the king; gout = the same Guard on the free home-rank square
 * farthest from the king; pawn = a pawn on the gin square; none = no Guard. Variants of gin: front
 * (the rank ahead of the king), beside (same rank, never rank 1), interpose (the square next to the
 * king on the line to the nearest enemy slider).
 *
 * `rand`: random positions as the design says. `real`: replays stored games (run.ts or tournament
 * records without king powers) to a ply in 30–60 where the side to move has 2+ pieces (not pawns,
 * not the king) within Chebyshev 3 of the other king, then sets the four arms on that position.
 * Real positions keep their own material (not made equal).
 *
 * Self-check (assert) on every emitted position: each arm parses back to itself, one king a side,
 * no side in check, the side to move has a legal move; in `rand` the material is equal without the
 * Guard (within 25 cp); and the defender's depth-3 eval of the gin arm is in [-300, +100] cp.
 */
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve as resolvePath } from 'node:path';
import { A, B, BLACK, Color, G, K, N, P, PieceType, Position, Q, R, WHITE, colorOf, findKing, inCheck, isAttacked, legalMoves, piece, setRules, typeOf } from '../src/rules/engine';
import { fromFen, toFen } from '../src/rules/setup';
import { VALUES, setEvalParams } from '../src/ai/eval';
import { resetSearchState, search } from '../src/ai/search';
import { mulberry32 } from '../src/sim/rng';
import { replayRecord } from '../src/sim/replay';
import { type StoredGame, fromRun, fromTournament, lines, sources } from './piece-activity';
import type { GameRecord } from '../src/sim/game';
import type { TRecord } from '../src/sim/tournament';

export const ARMS = ['gin', 'gout', 'pawn', 'none'] as const;
export type Arm = typeof ARMS[number];
const EVAL_LO = -300, EVAL_HI = 100, MAT_TOL = 25;

const cheb = (a: number, b: number): number => Math.max(Math.abs((a & 7) - (b & 7)), Math.abs((a >> 3) - (b >> 3)));
const at = (f: number, r: number): number => (f < 0 || f > 7 || r < 0 || r > 7 ? -1 : r * 8 + f);
const relRank = (s: number, c: Color): number => (c === WHITE ? s >> 3 : 7 - (s >> 3));
const SLIDER_DIRS: Record<number, [number, number][]> = {
  [B]: [[1, 1], [1, -1], [-1, 1], [-1, -1]], [R]: [[1, 0], [-1, 0], [0, 1], [0, -1]],
  [Q]: [[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]],
};

/** Material by the shipped values, not counting kings and Guards. */
function material(board: Uint8Array, c: Color): number {
  let v = 0;
  for (const p of board) if (p && colorOf(p) === c && typeOf(p) !== G && typeOf(p) !== K) v += VALUES[typeOf(p)];
  return v;
}

/**
 * The free square next to king `k` (colour c) that lies on the line of the nearest enemy slider
 * (the slider reaches it along one of its own directions, nothing in between), or -1.
 */
function interposeSquare(board: Uint8Array, k: number, c: Color): number {
  let best = -1, bestD = 99;
  for (let df = -1; df <= 1; df++) for (let dr = -1; dr <= 1; dr++) {
    const s = at((k & 7) + df, (k >> 3) + dr);
    if ((!df && !dr) || s < 0 || board[s]) continue;
    for (const [uf, ur] of SLIDER_DIRS[Q]) {
      let d = 0;
      for (let t = at((s & 7) + uf, (s >> 3) + ur); t >= 0; t = at((t & 7) + uf, (t >> 3) + ur)) {
        d++;
        const p = board[t];
        if (!p) continue;
        if (colorOf(p) !== c && SLIDER_DIRS[typeOf(p)]?.some(([a, b]) => a === -uf && b === -ur) && d < bestD) { bestD = d; best = s; }
        break;
      }
    }
  }
  return best;
}

/** A Guard square next to king `k` for variant `v`, or -1. Never on the defender's first or last rank. */
function guardSquare(board: Uint8Array, k: number, c: Color, v: string, rng: () => number): number {
  const dr = c === WHITE ? 1 : -1, kf = k & 7, kr = k >> 3;
  let cands: number[] = [];
  if (v === 'front') cands = [-1, 0, 1].map(df => at(kf + df, kr + dr));
  else if (v === 'beside') cands = [-1, 1].map(df => at(kf + df, kr));
  else { const s = interposeSquare(board, k, c); cands = s >= 0 ? [s] : []; }
  cands = cands.filter(s => s >= 0 && !board[s] && relRank(s, c) >= 1 && relRank(s, c) <= 6);
  return cands.length ? cands[Math.floor(rng() * cands.length)] : -1;
}

/** The free square on the defender's home rank farthest from its king (rank 2 if rank 1 is full). */
function farHomeSquare(board: Uint8Array, k: number, c: Color): number {
  for (const rr of [0, 1]) {
    const r = c === WHITE ? rr : 7 - rr;
    let best = -1;
    for (let f = 0; f < 8; f++) { const s = at(f, r); if (!board[s] && (best < 0 || cheb(s, k) > cheb(best, k))) best = s; }
    if (best >= 0 && cheb(best, k) >= 3) return best;
  }
  return -1;
}

/** Whether the position is one a game can start from: kings, no checks, a legal move, no pawn on rank 1/8. */
function sane(pos: Position): string | null {
  const b = pos.board;
  let kw = 0, kb = 0;
  for (let s = 0; s < 64; s++) {
    const p = b[s];
    if (!p) continue;
    if (typeOf(p) === K) colorOf(p) === WHITE ? kw++ : kb++;
    if (typeOf(p) === P && (s >> 3 === 0 || s >> 3 === 7)) return 'pawn on the first or last rank';
  }
  if (kw !== 1 || kb !== 1) return 'not one king a side';
  if (cheb(findKing(b, WHITE), findKing(b, BLACK)) < 2) return 'kings touch';
  if (inCheck(pos, WHITE) || inCheck(pos, BLACK)) return 'a side is in check';
  if (!legalMoves(pos).length) return 'no legal move';
  return null;
}

/** The defender's depth-3 eval (centipawns, defender's view); the attacker is to move. */
function defenderEval(pos: Position): number {
  resetSearchState();
  return -search(pos, { maxDepth: 3 }).score;
}

/**
 * The four arms of a base position: `board` holds no defender Guard; `g` is the gin square.
 * Null if an arm fails the sanity check.
 */
function arms(board: Uint8Array, turn: Color, c: Color, g: number, k: number): Record<Arm, Position> | null {
  const out = {} as Record<Arm, Position>;
  const far = farHomeSquare(board, k, c);
  if (far < 0 || (c === WHITE ? g >> 3 : 7 - (g >> 3)) === 0) return null;
  for (const arm of ARMS) {
    const b = board.slice();
    if (arm === 'gin') b[g] = piece(G, c);
    else if (arm === 'gout') b[far] = piece(G, c);
    else if (arm === 'pawn') b[g] = piece(P, c);
    const pos: Position = { board: b, turn, halfmove: 0, ply: turn, move: 1 };
    if (sane(pos)) return null;
    out[arm] = pos;
  }
  return out;
}

/** Self-check of one emitted set (the asserts the design asks for). */
function check(a: Record<Arm, Position>, c: Color, equalMaterial: boolean): void {
  for (const arm of ARMS) {
    const fen = toFen(a[arm]);
    assert.equal(toFen(fromFen(fen)), fen, `${arm}: FEN round-trip`);
    assert.equal(sane(fromFen(fen)), null, `${arm}: ${sane(fromFen(fen))} in ${fen}`);
    assert.equal(a[arm].turn, (c ^ 1) as Color, `${arm}: the attacker is to move`);
  }
  if (equalMaterial) {
    const b = a.gin.board;
    assert.ok(Math.abs(material(b, WHITE) - material(b, BLACK)) <= MAT_TOL, `material ${material(b, WHITE)} v ${material(b, BLACK)}`);
  }
  const e = defenderEval(a.gin);
  assert.ok(e >= EVAL_LO && e <= EVAL_HI, `defender eval ${e}`);
}

// ---------------------------------------------------------------------------------------------
// Random positions (Part 2, steps 1–6). The defender is White; the mirrored game gives Black's side.

const PIECES: PieceType[] = [R, B, N, A];

function randomPosition(rng: () => number): { arms: Record<Arm, Position>; variant: string } | null {
  const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rng() * xs.length)];
  const b = new Uint8Array(64);
  const free = (s: number): boolean => s >= 0 && !b[s];
  // 1. The defender's king.
  const k = rng() < 0.75 ? pick([6, 2, 4]) : Math.floor(rng() * 16);
  b[k] = piece(K, WHITE);
  // The attacker's king: far away, on ranks 6–8.
  let ek = -1;
  for (let i = 0; i < 50 && ek < 0; i++) { const s = 40 + Math.floor(rng() * 24); if (free(s) && cheb(s, k) >= 4) ek = s; }
  if (ek < 0) return null;
  b[ek] = piece(K, BLACK);
  // 4 (first, so the attack sees them). 2–4 pawns in front of the king.
  const shieldSq = [-1, 0, 1].flatMap(df => [1, 2].map(dr => at((k & 7) + df, (k >> 3) + dr))).filter(s => free(s) && s >> 3 >= 1 && s >> 3 <= 6);
  const nPawns = 2 + Math.floor(rng() * 3);
  for (let i = 0; i < nPawns && shieldSq.length; i++) {
    const s = shieldSq.splice(Math.floor(rng() * shieldSq.length), 1)[0];
    b[s] = piece(P, WHITE);
  }
  // 3. The attack: the queen and 1–2 pieces within 3 of the king, not checking, not hanging for free.
  const place = (t: PieceType, c: Color, near: number, maxD: number, minRank = 0, maxRank = 7): boolean => {
    for (let i = 0; i < 60; i++) {
      const s = Math.floor(rng() * 64);
      if (!free(s) || cheb(s, near) > maxD || cheb(s, near) < 1 || s >> 3 < minRank || s >> 3 > maxRank) continue;
      if (t === P && (s >> 3 === 0 || s >> 3 === 7)) continue;
      b[s] = piece(t, c);
      const checks = isAttacked(b, findKing(b, (c ^ 1) as Color), c);
      const hangs = c === BLACK && isAttacked(b, s, WHITE) && !isAttacked(b, s, BLACK);
      if (!checks && !hangs) return true;
      b[s] = 0;
    }
    return false;
  };
  if (!place(Q, BLACK, k, 3, 1)) return null;
  for (let i = 0, n = 1 + Math.floor(rng() * 2); i < n; i++) if (!place(pick(PIECES), BLACK, k, 3, 1)) return null;
  // 4. The defence: 1–3 pieces near the king.
  for (let i = 0, n = 1 + Math.floor(rng() * 3); i < n; i++) if (!place(pick(PIECES), WHITE, k, 3)) return null;
  // 5. Random pawns, then pieces to the poorer side until the material is equal (Guard excluded).
  for (let i = 0, n = Math.floor(rng() * 4); i < n; i++) place(P, WHITE, k, 7, 1, 4);
  for (let i = 0, n = 2 + Math.floor(rng() * 4); i < n; i++) place(P, BLACK, ek, 7, 3, 6);
  for (let guard = 0; guard < 12; guard++) {
    const d = material(b, WHITE) - material(b, BLACK);
    if (Math.abs(d) <= MAT_TOL) break;
    const poor: Color = d > 0 ? BLACK : WHITE, need = Math.abs(d) + MAT_TOL;
    const t = ([Q, A, R, B, N, P] as PieceType[]).find(x => VALUES[x] <= need) ?? P;
    const home = poor === WHITE ? k : ek;
    if (!place(t, poor, home, 7, poor === WHITE ? (t === P ? 1 : 0) : (t === P ? 3 : 4), poor === WHITE ? (t === P ? 4 : 3) : (t === P ? 6 : 7))) return null;
  }
  if (Math.abs(material(b, WHITE) - material(b, BLACK)) > MAT_TOL) return null;
  // 2. The Guard square, by variant (after the attack, so `interpose` sees the sliders).
  const variant = pick(['front', 'beside', 'interpose']);
  const g = guardSquare(b, k, WHITE, variant, rng);
  if (g < 0) return null;
  const a = arms(b, BLACK, WHITE, g, k);
  if (!a) return null;
  // 6. A real threat, not lost already.
  const e = defenderEval(a.gin);
  if (e < EVAL_LO || e > EVAL_HI) return null;
  return { arms: a, variant };
}

// ---------------------------------------------------------------------------------------------
// Positions from stored games.

/** Non-pawn, non-king pieces of colour `by` within Chebyshev 3 of square `k`. */
const attackers = (b: Uint8Array, k: number, by: Color): number => {
  let n = 0;
  for (let s = 0; s < 64; s++) { const p = b[s]; if (p && colorOf(p) === by && typeOf(p) !== P && typeOf(p) !== K && cheb(s, k) <= 3) n++; }
  return n;
};

function realPosition(g: StoredGame, rng: () => number): { arms: Record<Arm, Position>; variant: string } | null {
  setRules(g.rules);
  const cands: Position[] = [];
  try {
    replayRecord({ gameId: g.gameId, startFen: g.startFen, moves: g.lans.map(lan => ({ lan })) }, (_pos, _m, next, i) => {
      const ply = i + 1;
      if (ply < 30 || ply > 60) return;
      const att = next.turn, def = (att ^ 1) as Color, k = findKing(next.board, def);
      if (k >= 0 && attackers(next.board, k, att) >= 2) cands.push(next);
    });
  } catch { return null; }
  setRules();
  if (!cands.length) return null;
  const pos = cands[Math.floor(rng() * cands.length)];
  const def = (pos.turn ^ 1) as Color;
  const b = pos.board.slice();
  for (let s = 0; s < 64; s++) if (b[s] && typeOf(b[s]) === G && colorOf(b[s]) === def) b[s] = 0; // the arms place the Guard
  const k = findKing(b, def);
  const variant = ['front', 'beside', 'interpose'][Math.floor(rng() * 3)];
  const sq = guardSquare(b, k, def, variant, rng);
  if (sq < 0) return null;
  const a = arms(b, pos.turn, def, sq, k);
  if (!a) return null;
  const e = defenderEval(a.gin);
  if (e < EVAL_LO || e > EVAL_HI) return null;
  return { arms: a, variant };
}

async function* storedGames(args: readonly string[], dir: string): AsyncGenerator<StoredGame> {
  for (const arg of args) {
    const src = sources(arg, dir);
    for (const file of src.files) {
      for await (const line of lines(file)) {
        const rec = JSON.parse(line) as GameRecord | TRecord;
        const g = src.spec ? fromTournament(rec as TRecord, src.spec, file) : fromRun(rec as GameRecord, file);
        if (g.ordinary) yield g;
      }
    }
  }
}

// ---------------------------------------------------------------------------------------------

async function main(argv: readonly string[]): Promise<void> {
  const [mode, ...rest] = argv;
  let n = 100, seed = 1, out = '', dir = 'sim/out';
  const ids: string[] = [];
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === '--n') n = Number(rest[++i]);
    else if (a === '--seed') seed = Number(rest[++i]);
    else if (a === '--out') out = rest[++i];
    else if (a === '--dir') dir = rest[++i];
    else if (a.startsWith('--')) throw new Error(`unknown flag ${a}`);
    else ids.push(a);
  }
  if ((mode !== 'rand' && mode !== 'real') || !out || (mode === 'real' && !ids.length)) {
    throw new Error('usage: king-threat-fens.ts rand --n 3000 --out f.fens [--seed 1] | real --n 1500 --out f.fens [--seed 1] <id | file.jsonl> ... [--dir sim/out]');
  }
  setRules();
  setEvalParams();
  const rng = mulberry32(seed);
  const lines_: string[] = [`# king-threat-fens ${mode} --n ${n} --seed ${seed}${ids.length ? ` ${ids.join(' ')}` : ''}`];
  const t0 = performance.now();
  let tried = 0, kept = 0;
  const emit = (r: { arms: Record<Arm, Position>; variant: string }): void => {
    check(r.arms, (r.arms.gin.turn ^ 1) as Color, mode === 'rand');
    for (const arm of ARMS) lines_.push(`${toFen(r.arms[arm])}\tp${kept}:${arm}:${r.variant}`);
    kept++;
  };
  if (mode === 'rand') {
    while (kept < n) {
      tried++;
      const r = randomPosition(rng);
      if (r) emit(r);
      if (tried > n * 500) throw new Error(`only ${kept} of ${n} positions after ${tried} tries`);
    }
  } else {
    for await (const g of storedGames(ids, dir)) {
      if (kept >= n) break;
      tried++;
      const r = realPosition(g, rng);
      if (r) emit(r);
    }
  }
  writeFileSync(out, lines_.join('\n') + '\n');
  console.log(`${out}: ${kept} positions (${kept * 4} lines) from ${tried} ${mode === 'rand' ? 'tries' : 'games'}, ${((performance.now() - t0) / 1000).toFixed(1)} s; self-check passed`);
  if (kept < n) console.log(`warning: asked for ${n}, the games gave ${kept}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolvePath(process.argv[1])) {
  main(process.argv.slice(2)).catch(e => { console.error(e instanceof Error ? e.message : e); process.exitCode = 1; });
}
