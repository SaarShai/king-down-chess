#!/usr/bin/env -S npx tsx
/**
 * Piece activity against the piece-balance criteria the owner adopted on 2026-10-03
 * (docs/research/piece-balance-criteria-2026-10-03.md, criteria 2–6; criterion 1, worth, is the
 * values experiment of src/sim/run.ts).
 *
 *   npx tsx tools/piece-activity.ts <id | file.jsonl> ... [--dir sim/out] [--withPowers]
 *       [--withRandomOpening] [--boot 500]
 *
 * An id is a tournament (`<dir>/<id>.tournament.json`: its main file and its shard files) or a run
 * of src/sim/run.ts (`<dir>/<id>.jsonl`). Every game is replayed with the engine under the rules it
 * played (the run's stamp, or the tournament spec through `gameSpec`), so each move is known by the
 * piece that made it and by what it took.
 *
 * What counts: ordinary piece moves and their captures. A king power or a card (a move with a power
 * tag, or a Haste pass) is not counted, and games with a king power or cards are left out unless
 * `--withPowers` (always-on powers such as Darkness still change how some pieces move there). The
 * random opening plies are not counted unless `--withRandomOpening`. The pieces are the types that
 * start on the back ranks; pawns and kings are not reported and not in the averages. A promoted
 * pawn is a new piece of its new type: its moves count for that type, but it is not a starting
 * piece (starting count, first move, never moved). Under `guardReserve` a guard waiting beside the
 * board is a starting piece: it counts in the exposure while it waits, and its entry (`G@b1`) is its
 * first move. A Salvation card's returned piece is a new piece, like a promoted pawn.
 *
 * Intervals: 95%, from `--boot` resamples of the games (a game is the independent unit).
 */
import { createReadStream, existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, join, resolve as resolvePath } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { G, K, LETTERS, NAMES, P, PieceType, colorOf, legalMoves, typeOf } from '../src/rules/engine';
import { RULES, Rules, setRules } from '../src/rules/rules';
import { POOL, fromFen, startPosition, toFen, toLan } from '../src/rules/setup';
import type { GameRecord } from '../src/sim/game';
import { replayRecord } from '../src/sim/replay';
import { mulberry32 } from '../src/sim/rng';
import { type TRecord, type TournamentSpec, gameSpec } from '../src/sim/tournament';

/** One stored game, whatever file it came from. */
export interface StoredGame {
  /** File and game id, for messages. */
  key: string;
  gameId: number;
  startFen: string;
  lans: readonly string[];
  /** The rules it played: a full set (a run's stamp) or a diff over the defaults. */
  rules: Partial<Rules>;
  /** Random opening plies at the start of the game. */
  openingPlies: number;
  /** White's score. */
  result: number;
  /** No king power and no cards. */
  ordinary: boolean;
}

const ordinaryRules = (r: Partial<Rules>): boolean =>
  !r.kings?.[0] && !r.kings?.[1] && !r.hands?.[0]?.length && !r.hands?.[1]?.length;

export function fromRun(rec: GameRecord, file: string, fallback: Partial<Rules> = {}): StoredGame {
  const rules = rec.rules ?? fallback;
  return {
    key: `${basename(file)}#${rec.gameId}`, gameId: rec.gameId, startFen: rec.startFen, lans: rec.moves.map(m => m.lan), rules,
    openingPlies: rec.openingPlies, result: rec.result, ordinary: ordinaryRules(rules),
  };
}

export function fromTournament(rec: TRecord, t: TournamentSpec, file: string): StoredGame {
  const rules = gameSpec(t, rec).rules ?? {};
  setRules(rules); // the start position follows the rules (`guardReserve` takes the guards off)
  return {
    key: `${basename(file)}#${rec.gameId}`, gameId: rec.gameId, startFen: rec.fen ?? toFen(startPosition(rec.backRank)), lans: rec.lans, rules,
    openingPlies: t.openingRandomPlies, result: rec.result, ordinary: ordinaryRules(rules),
  };
}

// ---------------------------------------------------------------------------------------------
// Counting. One row of sums per game, so that every statistic below is a function of summed rows
// and the bootstrap can resample games.

/** Phases by ply number (1-based): opening 1–30 (moves 1–15), middle 31–80, end 81+. */
export const phaseOf = (ply: number): 0 | 1 | 2 => (ply <= 30 ? 0 : ply <= 80 ? 1 : 2);
export const PHASES = ['opening (plies 1–30)', 'middle (31–80)', 'end (81+)'] as const;

/** Fields per piece type. `ev` and `exp` take three slots each, one per phase. */
export const F = {
  start: 0, moves: 1, caps: 2, moved: 3, present: 4, used: 5, ev: 6, exp: 9, drawP: 12, whiteP: 13, pliesP: 14,
} as const;
const NF = 15, NT = 16;
/** Per game: 1, drawn, White's score, plies. */
export const GAME = NT * NF;
const LEN = GAME + 4;
export const at = (t: number, f: number): number => t * NF + f;

export interface Tally {
  rows: Float64Array[];
  /** Ply of the first counted move of each starting piece that moved, by type. */
  first: number[][];
  /** Games left out: with a king power or cards; and the messages of games that did not replay. */
  powers: number;
  failed: string[];
  /** Every game played the guard as a piece that captures nothing (`guardCaptures: 'none'`). */
  guardNone: boolean;
  countOpening: boolean;
}

export const newTally = (countOpening = false): Tally =>
  ({ rows: [], first: Array.from({ length: NT }, () => []), powers: 0, failed: [], guardNone: true, countOpening });

/** Replay one game: its row of sums and its first-move plies. Throws if a move does not replay or a piece is lost track of. */
export function countGame(g: StoredGame, countOpening = false): { row: Float64Array; first: number[][] } {
  setRules(g.rules);
  const v = new Float64Array(LEN);
  const first: number[][] = Array.from({ length: NT }, () => []);
  // Every piece on the board: its type now, whether it started the game, its first counted move.
  const pieces: { type: PieceType; start: boolean; first: number }[] = [];
  const ids = new Int32Array(64).fill(-1);
  const start = fromFen(g.startFen), board0 = start.board;
  for (let s = 0; s < 64; s++) if (board0[s]) { ids[s] = pieces.length; pieces.push({ type: typeOf(board0[s]), start: true, first: 0 }); }
  // Guards waiting beside the board (`guardReserve`) start the game too: they count in the exposure
  // while they wait, and the move that brings one in is its first move.
  const waiting: number[][] = [[], []];
  start.waiting?.forEach((n, c) => { for (let k = 0; k < n; k++) { waiting[c].push(pieces.length); pieces.push({ type: G, start: true, first: 0 }); } });
  replayRecord({ gameId: g.gameId, startFen: g.startFen, moves: g.lans.map(lan => ({ lan })) }, (pos, m, next, i) => {
    // The replay parses ordinary moves without generating them. A move the game's rules do not allow
    // (a record of another engine or rule set) is a record of another game: refuse it.
    if (!m.power && !m.pass) {
      const lan = toLan(pos, m);
      if (!legalMoves(pos).some(x => x.from === m.from && x.to === m.to && toLan(pos, x) === lan)) throw new Error(`ply ${i + 1}: ${lan} is not legal under the game's rules`);
    }
    if (countOpening || i >= g.openingPlies) {
      const ph = phaseOf(i + 1);
      // Exposure: the mover's pieces on the board, once per turn. A turn that holds (a Haste's first
      // move, a free Freeze mark) is counted at the ply that ends it.
      if (next.turn !== pos.turn) {
        for (let s = 0; s < 64; s++) { const p = pos.board[s]; if (p && colorOf(p) === pos.turn) v[at(typeOf(p), F.exp + ph)]++; }
        v[at(G, F.exp + ph)] += waiting[pos.turn].length;
      }
      if (!m.power && !m.pass) {
        const t = m.drop ?? typeOf(pos.board[m.from]);
        v[at(t, F.moves)]++;
        v[at(t, F.caps)] += m.captures.length;
        v[at(t, F.ev + ph)] += 1 + m.captures.length;
        const p = pieces[m.drop ? waiting[pos.turn][waiting[pos.turn].length - 1] : ids[m.from]];
        if (p.start && !p.first) p.first = i + 1;
      }
    }
    // Follow every piece to its new square, as makeMove moves it. A waiting guard takes its place on
    // the board; a Salvation card's piece is a new piece, like a promotion.
    if (m.drop) {
      if (m.power) { ids[m.to] = pieces.length; pieces.push({ type: m.drop, start: false, first: 0 }); }
      else ids[m.to] = waiting[pos.turn].pop()!;
    } else if (!(m.power === 'freeze' || m.power === 'ward' || m.pass)) {
      for (const s of m.captures) ids[s] = -1;
      if (m.shove) { ids[m.shove.to] = ids[m.shove.from]; ids[m.shove.from] = -1; }
      const mover = ids[m.from], other = ids[m.to];
      ids[m.from] = m.swap ? other : -1;
      ids[m.to] = m.selfRemove ? -1 : mover;
    }
    for (let s = 0; s < 64; s++) {
      const p = next.board[s];
      if (!p !== (ids[s] < 0)) throw new Error(`ply ${i + 1}: lost track of the piece on square ${s}`);
      if (p && pieces[ids[s]].type !== typeOf(p)) {
        if (s !== m.to) throw new Error(`ply ${i + 1}: the piece on square ${s} changed type`);
        ids[s] = pieces.length; // a promotion (or a Sacrifice): a new piece
        pieces.push({ type: typeOf(p), start: false, first: 0 });
      }
    }
  });
  for (const p of pieces) {
    if (!p.start) continue;
    v[at(p.type, F.start)]++;
    if (p.first) { v[at(p.type, F.moved)]++; first[p.type].push(p.first); }
  }
  const draw = g.result === 0.5 ? 1 : 0;
  for (let t = 1; t < NT; t++) {
    if (!v[at(t, F.start)]) continue;
    v[at(t, F.present)] = 1;
    v[at(t, F.used)] = v[at(t, F.moved)] ? 1 : 0;
    v[at(t, F.drawP)] = draw;
    v[at(t, F.whiteP)] = g.result;
    v[at(t, F.pliesP)] = g.lans.length;
  }
  v[GAME] = 1; v[GAME + 1] = draw; v[GAME + 2] = g.result; v[GAME + 3] = g.lans.length;
  return { row: v, first };
}

/** Add one game to the tally (or count it as left out). */
export function addGame(tally: Tally, g: StoredGame, withPowers = false): void {
  if (!g.ordinary && !withPowers) { tally.powers++; return; }
  try {
    const { row, first } = countGame(g, tally.countOpening);
    tally.guardNone &&= RULES.guardCaptures === 'none';
    tally.rows.push(row);
    first.forEach((xs, t) => tally.first[t].push(...xs));
  } catch (e) {
    tally.failed.push(`${g.key}: ${(e as Error).message}`);
  }
}

// ---------------------------------------------------------------------------------------------
// Statistics.

export interface PieceStats {
  start: number; games: number; without: number;
  movesPer: number; capsPer: number; movesX: number; capsX: number;
  act: [number, number, number]; actX: [number, number, number]; whole: number;
  /** Best phase over the piece's own whole-game activity (criterion 4 as written). */
  ownBest: number;
  /** Best phase over the average piece's activity in that phase (criterion 4b). */
  fieldBest: number;
  instUsed: number; gameUsed: number;
  dDraws: number; dWhite: number; dLength: number;
}

/** Every statistic from summed rows. `types` are the pieces reported; `noCapture` cannot capture by rule. */
export function summarise(sum: Float64Array, types: readonly number[], noCapture: ReadonlySet<number>): Map<number, PieceStats> {
  const s = (t: number, f: number): number => sum[at(t, f)];
  const tot = (f: number, ts: readonly number[] = types): number => ts.reduce((a, t) => a + s(t, f), 0);
  const capturers = types.filter(t => !noCapture.has(t));
  const avgMoves = tot(F.moves) / tot(F.start);
  const avgCaps = tot(F.caps, capturers) / tot(F.start, capturers);
  const avgAct = [0, 1, 2].map(ph => tot(F.ev + ph) / tot(F.exp + ph));
  const [n, draws, white, plies] = [sum[GAME], sum[GAME + 1], sum[GAME + 2], sum[GAME + 3]];
  const out = new Map<number, PieceStats>();
  for (const t of types) {
    const act = [0, 1, 2].map(ph => s(t, F.ev + ph) / s(t, F.exp + ph)) as [number, number, number];
    const actX = act.map((a, ph) => a / avgAct[ph]) as [number, number, number];
    const whole = (s(t, F.ev) + s(t, F.ev + 1) + s(t, F.ev + 2)) / (s(t, F.exp) + s(t, F.exp + 1) + s(t, F.exp + 2));
    const best = (xs: number[]): number => Math.max(...xs.filter(Number.isFinite));
    const games = s(t, F.present), without = n - games;
    const movesPer = s(t, F.moves) / s(t, F.start), capsPer = s(t, F.caps) / s(t, F.start);
    out.set(t, {
      start: s(t, F.start), games, without,
      movesPer, capsPer, movesX: movesPer / avgMoves, capsX: noCapture.has(t) ? NaN : capsPer / avgCaps,
      act, actX, whole, ownBest: best(act) / whole, fieldBest: best(actX),
      instUsed: s(t, F.moved) / s(t, F.start), gameUsed: s(t, F.used) / games,
      dDraws: s(t, F.drawP) / games - (draws - s(t, F.drawP)) / without,
      dWhite: s(t, F.whiteP) / games - (white - s(t, F.whiteP)) / without,
      dLength: (s(t, F.pliesP) / games) / ((plies - s(t, F.pliesP)) / without) - 1,
    });
  }
  return out;
}

type Key = keyof PieceStats;
type Ci = Map<number, Partial<Record<Key | `act${number}` | `actX${number}`, [number, number]>>>;

/** 95% percentile intervals over `B` resamples of the games (fixed seed: a report reads the same each time). */
export function bootstrap(rows: readonly Float64Array[], types: readonly number[], noCapture: ReadonlySet<number>, B: number, seed = 11): Ci {
  const idx: number[] = [GAME, GAME + 1, GAME + 2, GAME + 3];
  for (const t of types) for (let f = 0; f < NF; f++) idx.push(at(t, f));
  const draws = new Map<number, Map<string, number[]>>(types.map(t => [t, new Map()]));
  const rng = mulberry32(seed), acc = new Float64Array(LEN), n = rows.length;
  for (let b = 0; b < B; b++) {
    acc.fill(0);
    for (let g = 0; g < n; g++) { const r = rows[Math.floor(rng() * n)]; for (const j of idx) acc[j] += r[j]; }
    for (const [t, st] of summarise(acc, types, noCapture)) {
      const d = draws.get(t)!;
      const put = (k: string, x: number): void => { if (Number.isFinite(x)) (d.get(k) ?? d.set(k, []).get(k)!).push(x); };
      for (const [k, x] of Object.entries(st)) {
        if (Array.isArray(x)) x.forEach((y, ph) => put(`${k}${ph}`, y)); else put(k, x as number);
      }
    }
  }
  const out: Ci = new Map();
  for (const [t, d] of draws) {
    const m: Partial<Record<string, [number, number]>> = {};
    for (const [k, xs] of d) { xs.sort((a, b) => a - b); m[k] = [xs[Math.floor(0.025 * (xs.length - 1))], xs[Math.ceil(0.975 * (xs.length - 1))]]; }
    out.set(t, m);
  }
  return out;
}

export type Verdict = 'PASS' | 'pass?' | 'fail?' | 'FAIL' | 'n/a';
/**
 * Inside [min, max]? `PASS` / `FAIL` when the whole interval agrees with the point, `pass?` / `fail?`
 * when the point is on that side but the interval crosses the line, or when there is no interval
 * (`--boot 0`).
 */
export function verdict(x: number, ci: [number, number] | undefined, min: number, max = Infinity): Verdict {
  if (!Number.isFinite(x)) return 'n/a';
  const inside = x >= min && x <= max;
  if (!ci) return inside ? 'pass?' : 'fail?';
  const [lo, hi] = ci;
  if (inside) return lo >= min && hi <= max ? 'PASS' : 'pass?';
  return hi < min || lo > max ? 'FAIL' : 'fail?';
}
const RANK: Verdict[] = ['FAIL', 'fail?', 'pass?', 'PASS'];
const worst = (vs: Verdict[]): Verdict => vs.reduce((a, b) => (RANK.indexOf(b) < RANK.indexOf(a) ? b : a));

export const median = (xs: readonly number[]): number => {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b), h = s.length >> 1;
  return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2;
};

// ---------------------------------------------------------------------------------------------
// Report.

export function total(rows: readonly Float64Array[]): Float64Array {
  const sum = new Float64Array(LEN);
  for (const r of rows) for (let j = 0; j < LEN; j++) sum[j] += r[j];
  return sum;
}

/** The piece types that started on the board, in pool order. */
export function reported(sum: Float64Array): number[] {
  const order = (t: number): number => { const i = POOL.indexOf(LETTERS[t]); return i < 0 ? 100 + t : i; };
  return [...Array(NT).keys()].filter(t => t !== P && t !== K && t > 0 && sum[at(t, F.start)] > 0).sort((a, b) => order(a) - order(b));
}

export function reportText(tally: Tally, B = 500, head: string[] = []): string {
  const sum = total(tally.rows), types = reported(sum);
  const noCapture = new Set<number>(tally.guardNone ? [G] : []);
  const st = summarise(sum, types, noCapture);
  const ci = B > 0 ? bootstrap(tally.rows, types, noCapture, B) : new Map() as Ci;
  const n = sum[GAME];
  const f = (x: number, d = 2): string => (Number.isFinite(x) ? x.toFixed(d) : '-');
  const pc = (x: number, d = 1): string => (Number.isFinite(x) ? `${(100 * x).toFixed(d)}%` : '-');
  const pts = (x: number): string => (Number.isFinite(x) ? `${x >= 0 ? '+' : ''}${(100 * x).toFixed(1)}` : '-');
  const range = (t: number, k: string, fmt: (x: number) => string): string => {
    const c = ci.get(t)?.[k as Key];
    return c ? ` [${fmt(c[0])}, ${fmt(c[1])}]` : '';
  };
  const name = (t: number): string => `${LETTERS[t]} ${NAMES[t]}`;
  const lines = [
    ...head,
    `${n} games counted. Left out: ${tally.powers} with a king power or cards, ${tally.failed.length} that did not replay${tally.failed.length ? ` (first: ${tally.failed[0]})` : ''}.`,
    `Counted: ordinary piece moves and their captures only (no king power or card move). Random opening plies: ${tally.countOpening ? 'counted' : 'not counted'}.`,
    `Pawns and kings are not reported and not in the averages. The capture average leaves out ${noCapture.size ? 'the guard (it captures nothing by rule)' : 'nothing'}. ${B > 0 ? `Intervals: 95%, ${B} resamples of the games.` : 'No intervals (`--boot 0`): no verdict is settled.'}`,
    '',
    '## Moves, captures and use',
    '',
    '| piece | games with it | pieces (start) | moves / piece | × average | captures / piece | × average | never moved | moved in the game | first move (median ply) |',
    '|---|---|---|---|---|---|---|---|---|---|',
  ];
  for (const t of types) {
    const s = st.get(t)!;
    lines.push(`| ${name(t)} | ${s.games} | ${s.start} | ${f(s.movesPer)} | ${f(s.movesX)}${range(t, 'movesX', f)} | ${f(s.capsPer)} | ${noCapture.has(t) ? 'cannot capture' : `${f(s.capsX)}${range(t, 'capsX', f)}`} | ${pc(1 - s.instUsed)} | ${pc(s.gameUsed)} | ${f(median(tally.first[t]), 1)} |`);
  }
  lines.push('', 'Per piece = over the pieces that started on the board. "Never moved": share of starting pieces that made no counted move. "Moved in the game": share of the games with the piece where at least one of them moved (either side). First move: the ply of each starting piece\'s first counted move, among those that moved.');
  lines.push('', '## Activity by phase', '', 'Activity = (moves + captures) per piece on the board per turn of its side, in that phase.', '');
  lines.push(`| piece | ${PHASES.map(p => `${p} | × average`).join(' | ')} | whole game | best phase / own whole game |`);
  lines.push(`|---|${PHASES.map(() => '---|---').join('|')}|---|---|`);
  for (const t of types) {
    const s = st.get(t)!;
    lines.push(`| ${name(t)} | ${s.act.map((a, ph) => `${f(a, 3)} | ${f(s.actX[ph])}`).join(' | ')} | ${f(s.whole, 3)} | ${f(s.ownBest)} |`);
  }
  const avg = [0, 1, 2].map(ph => types.reduce((a, t) => a + sum[at(t, F.ev + ph)], 0) / types.reduce((a, t) => a + sum[at(t, F.exp + ph)], 0));
  lines.push(`| average piece | ${avg.map(a => `${f(a, 3)} | 1.00`).join(' | ')} | | |`);
  lines.push('', '## With and without the piece in the army', '', 'Games whose army includes the piece minus games whose army does not.', '');
  lines.push('| piece | games with | without | draws Δ (points) | White\'s score Δ (points) | length Δ |', '|---|---|---|---|---|---|');
  for (const t of types) {
    const s = st.get(t)!;
    lines.push(`| ${name(t)} | ${s.games} | ${s.without} | ${pts(s.dDraws)}${range(t, 'dDraws', pts)} | ${pts(s.dWhite)}${range(t, 'dWhite', pts)} | ${pc(s.dLength)}${range(t, 'dLength', x => pc(x))} |`);
  }
  lines.push(`| all games | ${n} | | draws ${pc(sum[GAME + 1] / n)} | White ${pc(sum[GAME + 2] / n)} | ${f(sum[GAME + 3] / n, 1)} plies |`);
  lines.push('', '## Criteria 2–6', '',
    'PASS / FAIL: the whole 95% interval is on that side of the line; pass? / fail?: the point is, the interval crosses it.', '',
    '| piece | 2 captures 0.5–1.5× | 3 moves ≥ 0.5× | 4 a phase ≥ own whole game | 4b a phase ≥ average piece | 5 moved ≥ 85% | 6 draws ±3, White ±2, length ±10% |',
    '|---|---|---|---|---|---|---|');
  for (const t of types) {
    const s = st.get(t)!, c = ci.get(t) ?? {};
    const six: [string, Verdict][] = [['draws', verdict(s.dDraws, c.dDraws, -0.03, 0.03)], ['White', verdict(s.dWhite, c.dWhite, -0.02, 0.02)], ['length', verdict(s.dLength, c.dLength, -0.1, 0.1)]];
    // Name the measures whose point is outside their band.
    const v6 = worst(six.map(x => x[1])), off = six.filter(x => x[1] === 'FAIL' || x[1] === 'fail?').map(x => x[0]);
    const c6 = `${v6}${off.length ? ` (${off.join(', ')})` : ''}`;
    lines.push(`| ${name(t)} | ${noCapture.has(t) ? 'n/a (cannot capture; flagged)' : `${verdict(s.capsX, c.capsX, 0.5, 1.5)} ${f(s.capsX)}${range(t, 'capsX', f)}`} | ${verdict(s.movesX, c.movesX, 0.5)} ${f(s.movesX)}${range(t, 'movesX', f)} | ${verdict(s.ownBest, c.ownBest, 1 - 1e-9)} ${f(s.ownBest)} | ${verdict(s.fieldBest, c.fieldBest, 1)} ${f(s.fieldBest)}${range(t, 'fieldBest', f)} | ${verdict(s.instUsed, c.instUsed, 0.85)} ${pc(s.instUsed)}${range(t, 'instUsed', x => pc(x))} | ${c6} |`);
  }
  lines.push('', 'Criterion 4 as written cannot fail: the whole-game activity is a weighted mean of the three phases, so one phase is always at or above it. 4b reads it against the average piece in each phase.');
  return lines.join('\n') + '\n';
}

// ---------------------------------------------------------------------------------------------
// Reading files.

export async function* lines(file: string): AsyncGenerator<string> {
  const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity });
  for await (const l of rl) if (l) yield l;
}

/** The files and the tournament spec (if any) behind one argument. */
export function sources(arg: string, dir: string): { files: string[]; spec?: TournamentSpec; summary?: string } {
  const isFile = arg.endsWith('.jsonl');
  const d = isFile ? dirname(arg) : dir;
  const id = isFile ? basename(arg, '.jsonl').replace(/\.shard\d+of\d+$/, '') : arg;
  const specFile = join(d, `${id}.tournament.json`);
  if (existsSync(specFile)) {
    const spec = JSON.parse(readFileSync(specFile, 'utf8')) as TournamentSpec;
    const files = isFile ? [arg] : [join(d, `${id}.jsonl`), ...readdirSync(d).filter(f => f.startsWith(`${id}.shard`) && f.endsWith('.jsonl')).map(f => join(d, f))];
    return { files: files.filter(existsSync), spec };
  }
  const file = isFile ? arg : join(d, `${id}.jsonl`);
  if (!existsSync(file)) throw new Error(`piece-activity: ${file} is missing`);
  return { files: [file], summary: join(d, `${id}.summary.json`) };
}

async function main(argv: readonly string[]): Promise<void> {
  const args: string[] = [];
  let dir = 'sim/out', B = 500, withPowers = false, countOpening = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dir') dir = argv[++i];
    else if (a === '--boot') B = Number(argv[++i]);
    else if (a === '--withPowers') withPowers = true;
    else if (a === '--withRandomOpening') countOpening = true;
    else if (a.startsWith('--')) throw new Error(`unknown flag ${a}`);
    else args.push(a);
  }
  if (!args.length) throw new Error('usage: npx tsx tools/piece-activity.ts <id | file.jsonl> ... [--dir sim/out] [--withPowers] [--withRandomOpening] [--boot 500]');
  const tally = newTally(countOpening);
  const pools = new Set<string>();
  const read: string[] = [];
  for (const arg of args) {
    const src = sources(arg, dir);
    const seen = new Set<number>(); // a tournament's games are unique by id over its main and shard files
    let fallback: Partial<Rules> | undefined;
    for (const file of src.files) {
      read.push(file);
      for await (const line of lines(file)) {
        const rec = JSON.parse(line) as (GameRecord & { pool?: string }) | TRecord;
        if (src.spec) {
          const r = rec as TRecord;
          if (seen.has(r.gameId)) continue;
          seen.add(r.gameId);
          addGame(tally, fromTournament(r, src.spec, file), withPowers);
        } else {
          const r = rec as GameRecord & { pool?: string };
          if (r.pool) pools.add(r.pool);
          if (!r.rules && fallback === undefined) {
            // An unstamped record: the run's summary, else the defaults (LESSONS.md 2026-09-13).
            fallback = src.summary && existsSync(src.summary) ? (JSON.parse(readFileSync(src.summary, 'utf8')).spec?.rules ?? {}) : {};
          }
          addGame(tally, fromRun(r, file, fallback), withPowers);
        }
      }
    }
  }
  const head = [
    `# Piece activity: ${args.join(' + ')}`, '',
    `Files: ${read.map(f => `\`${f}\``).join(', ')}. Pool${pools.size ? `: ${[...pools].join(', ')}` : ' not stamped in the records'} (today's: ${POOL}).`,
  ];
  process.stdout.write(reportText(tally, B, head));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolvePath(process.argv[1])) {
  main(process.argv.slice(2)).catch(e => { console.error(e instanceof Error ? e.message : e); process.exitCode = 1; });
}
