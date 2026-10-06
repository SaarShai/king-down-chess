/** Play one game headless (AI vs AI) and record everything the analyser needs. */
import { LETTERS, Move, Position, PowerTag, WHITE, colorOf, status, typeOf } from '../rules/engine';
import { RULES, Rules, setRules } from '../rules/rules';
import { fromFen, toFen, toLan, waitGuards } from '../rules/setup';
import { readFileSync } from 'node:fs';
import { Game } from '../game';
import { EvalParams, setEvalParams, setPieceValues } from '../ai/eval';
import * as AI from '../ai/search';
import { setPowerHold } from '../ai/search';
import { Adjudicate, Job, RunSpec, adjudication, sideOptions } from './spec';
import { countMove, emptyEvents } from './replay';
import { mulberry32 } from './rng';

export type EndReason =
  | 'checkmate' | 'stalemate' | 'draw50' | 'drawRepetition' | 'drawMaterial'
  | 'adjudicatedResign' | 'adjudicatedDraw' | 'plyCap';

export interface PlyRecord {
  lan: string;
  /** Mover's search score converted to white's point of view. Absent for opening-random plies. */
  cp?: number;
  depth?: number;
  nodes?: number;
  /** Legal moves available to the mover (branching factor). */
  legal: number;
  /** Best root score minus second best, in cp (mover's view). Only with `multiPv` (decision cost). */
  gap?: number;
  ms: number;
  /**
   * Who moved (0 white, 1 black). Written since 2026-10-02 because a Haste turn takes two plies,
   * after which the mover no longer follows the ply's parity (`moverAt` cannot know it).
   */
  by?: 0 | 1;
}

/** Per piece letter. `captures` is keyed by the mover, `taken` by the victim. */
export interface SideStats {
  moves: Record<string, number>;
  captures: Record<string, number>;
  taken: Record<string, number>;
  survived: Record<string, number>;
  start: Record<string, number>;
}

/**
 * Every counter is `[white, black]`. The four lab-piece counters at the end are absent from every
 * run recorded before 2026-09-14, so a reader has to tolerate `undefined` (`analyze.eventTotals`
 * does). What the per-piece table already answers is not repeated here: a catapult's *lobs* are its
 * captures (it has no other way of taking anything) and its survival is its survival row.
 */
export interface Events {
  archerShots: [number, number];
  beastChains: [number[], number[]];
  maesterSwaps: [number, number];
  maesterLongSwaps: [number, number];
  paladinSacrifices: [number, number];
  promotions: [number, number];
  checks: [number, number];
  /** Ogre shoves, in total and split by what was shoved (a friend; a guard of either colour). */
  ogreShoves: [number, number];
  ogreShovesFriend: [number, number];
  ogreShovesGuard: [number, number];
  /** Checks a catapult gave — always through a screen, since that is its only way of attacking. */
  catapultChecks: [number, number];
  /** Strike (Flame A): the one-use queen-like action, per side. */
  strikes: [number, number];
  /**
   * Every king power spent, by tag (`Move.power`; `pass` = a Haste turn that ended without its
   * second move), per side. Absent from records written before 2026-10-02.
   */
  powers: Partial<Record<PowerTag | 'pass' | 'mirror' | 'mirrorb', [number, number]>>;
}

export interface GameRecord {
  gameId: number;
  pairId: number;
  colourSwapped: boolean;
  configId: string;
  seed: number;
  backRankWhite: string;
  backRankBlack: string;
  openingPlies: number;
  startFen: string;
  /** White's score. */
  result: 1 | 0.5 | 0;
  reason: EndReason;
  plies: number;
  ms: number;
  firstCapturePly: number | null;
  /** Distinct squares touched (moved from, landed on, or emptied) over 64. */
  coverage: number;
  moves: PlyRecord[];
  events: Events;
  stats: [SideStats, SideStats];
  /**
   * The run's rule diff, stamped on every JSONL line by `run.ts` (`Stamp`) since 2026-09-14.
   * `playGame` never sets it; a file written before the stamp existed carries none, and a reader
   * then falls back to the run summary and finally to the defaults. It is here so that anything
   * reading a stored game can ask what rules it played — `moverAt` is the first thing that has to.
   */
  rules?: Partial<Rules>;
}

const emptyStats = (): SideStats => ({ moves: {}, captures: {}, taken: {}, survived: {}, start: {} });
const bump = (r: Record<string, number>, k: string, n = 1): void => { r[k] = (r[k] ?? 0) + n; };

/** The pieces of each side: on the board, and the guards waiting beside it (`guardReserve`). */
function census(pos: Position, into: [Record<string, number>, Record<string, number>]): void {
  for (const p of pos.board) if (p) bump(into[colorOf(p)], LETTERS[typeOf(p)]);
  pos.waiting?.forEach((n, c) => { if (n) bump(into[c], 'G', n); });
}

/**
 * search() keeps its transposition table, killers and history between calls, so game n would
 * otherwise depend on games 1..n-1 in the same worker (sim-methodology.md §7.2). The AI agent is
 * adding a reset; call it when it lands, under either name, and carry on without it until then.
 */
function resetSearch(): void {
  const m = AI as unknown as Record<string, unknown>;
  const fn = m.resetSearchState ?? m.resetSearch;
  if (typeof fn === 'function') (fn as () => void)();
}

/**
 * `SearchOptions.history` lets the search see repetitions it would otherwise walk into. Optional in
 * the same defensive way: without it the smoke run drew 55% of its games by repetition.
 */
const positionKey = (AI as unknown as Record<string, unknown>).positionKey as ((p: Position) => number) | undefined;

/**
 * `Game` always applies threefold repetition and `src/game.ts` is owned by the UI agent, so the
 * `threefold: false` toggle is undone here: recompute the status without the repetition rule.
 * `status()` is the same call `Game.setStatus` makes, minus the repetition test.
 */
export function applyDrawRules(game: Game): void {
  if (!RULES.threefold && game.status === 'drawRepetition') game.status = status(game.pos);
}

/**
 * Per-side evaluation parameters (`RunSpec.evalParams`), read once per worker and swapped in
 * before each search. `null` when the run plays one evaluation, which is every run but a tuning
 * match — and the swap costs a transposition table, so it stays off by default.
 */
const paramFiles = new Map<string, EvalParams>();
function evalSides(spec: RunSpec, colourSwapped: boolean): [EvalParams | undefined, EvalParams | undefined] | null {
  const e = spec.evalParams;
  if (!e?.white && !e?.black) return null;
  const load = (f?: string): EvalParams | undefined => {
    if (!f) return undefined;
    const hit = paramFiles.get(f);
    if (hit) return hit;
    const p = JSON.parse(readFileSync(f, 'utf8')) as EvalParams;
    paramFiles.set(f, p);
    return p;
  };
  const [a, b] = [load(e.white), load(e.black)];
  return colourSwapped ? [b, a] : [a, b];
}

/**
 * Asymmetric pairs need a hand-built position; `startPosition` mirrors one rank onto both sides.
 * Every start, a FEN one included, takes the guards off under `guardReserve` (`waitGuards`).
 */
export function startGame(white: string, black: string, fen?: string): Game {
  const g = new Game(white);
  if (fen) g.load(waitGuards(fromFen(fen)));
  else if (black !== white) g.load(waitGuards(fromFen(`${black.toLowerCase()}/pppppppp/8/8/8/8/PPPPPPPP/${white} w - - 0 1`)));
  return g;
}

/** search() returns another Move object; match it back to this Game's legal list by notation. */
function resolve(pos: Position, legal: readonly Move[], m: Move | null | undefined): Move | null {
  if (!m) return null;
  const lan = toLan(pos, m);
  return legal.find(x => toLan(pos, x) === lan) ?? null;
}

export function playGame(spec: RunSpec, job: Job): GameRecord {
  const t0 = performance.now();
  setRules(spec.rules); // per game: cheap, and an A/B run changes rules between sub-runs
  setPieceValues(spec.values); // same reason; with no `values` this restores the shipped constants
  setPowerHold(spec.powerHold as Parameters<typeof setPowerHold>[0]); // likewise: none = the search's defaults
  const rng = mulberry32(job.seed);
  const game = startGame(job.backRankWhite, job.backRankBlack, job.fen);
  const startFen = toFen(game.pos);
  const opts = sideOptions(spec, job.colourSwapped);
  const evals = evalSides(spec, job.colourSwapped);
  const adj: Adjudicate | null = adjudication(spec);
  const maxPlies = spec.maxPlies ?? 300;
  const openingPlies = spec.openingRandomPlies ?? 0;
  resetSearch();

  const stats: [SideStats, SideStats] = [emptyStats(), emptyStats()];
  census(game.pos, [stats[0].start, stats[1].start]);
  const events = emptyEvents();
  const moves: PlyRecord[] = [];
  const history: number[] = [];
  const touched = new Uint8Array(64);
  let firstCapturePly: number | null = null;

  let reason: EndReason | null = null;
  let result: 1 | 0.5 | 0 = 0.5;
  let winStreak = 0, winSign = 0, quietStreak = 0;

  while (game.status === 'playing') {
    if (moves.length >= maxPlies) { reason = 'plyCap'; break; }
    const pos = game.pos, legal = game.legal, c = pos.turn;
    if (positionKey) history.push(positionKey(pos));
    const t = performance.now();
    let move: Move | null, cp: number | undefined, nodes: number | undefined, depth: number | undefined;
    let gap: number | undefined;

    if (moves.length < openingPlies) {
      // A random opening move is one of the pieces' own moves, never a king power: Flight alone
      // adds ~200 moves a position, so a uniform pick would spend the powers by chance. With no
      // powers in play the list is unchanged, so earlier runs replay exactly.
      const own = legal.some(m => m.power || m.pass) ? legal.filter(m => !m.power && !m.pass) : legal;
      move = own[Math.floor(rng() * own.length)] ?? null;
    } else {
      // Two evaluations in one process: swap the tables, and drop the transposition table with
      // them — an entry stored by one side's evaluation is not a score the other side may read.
      if (evals) { setEvalParams(evals[c]); resetSearch(); }
      if (spec.powerHoldSides) {
        setPowerHold({ ...spec.powerHold, ...spec.powerHoldSides[c] } as Parameters<typeof setPowerHold>[0]);
        resetSearch();
      }
      const r = AI.search(pos, { ...opts[c], history, ...(spec.multiPv ? { multiPv: 2 as const } : {}) }) as Partial<AI.SearchResult>;
      move = resolve(pos, legal, r?.move) ?? legal[0] ?? null;
      if (typeof r?.score === 'number') cp = c === WHITE ? r.score : -r.score;
      if (typeof r?.nodes === 'number') nodes = r.nodes;
      if (typeof r?.depth === 'number') depth = r.depth;
      if (typeof r?.second === 'number' && typeof r?.score === 'number') gap = Math.max(0, r.score - r.second);
    }
    if (!move) break; // status would not be 'playing' if this happened; belt and braces

    const mt = move.drop ?? typeOf(pos.board[move.from]); // a drop's square is empty
    const letter = LETTERS[mt];
    if (mt) bump(stats[c].moves, letter); // an Earth Quake's square may be empty
    touched[move.from] = 1;
    touched[move.to] = 1;
    if (move.drop2 !== undefined) touched[move.drop2] = 1; // a Spawn2's second pawn
    if (move.captures.length) {
      if (firstCapturePly === null) firstCapturePly = moves.length + 1;
      bump(stats[c].captures, letter, move.captures.length);
      for (const v of move.captures) { touched[v] = 1; bump(stats[c ^ 1].taken, LETTERS[typeOf(pos.board[v])]); }
    }
    moves.push({
      lan: toLan(pos, move),
      ...(cp === undefined ? {} : { cp }), ...(depth === undefined ? {} : { depth }),
      ...(nodes === undefined ? {} : { nodes }),
      ...(gap === undefined ? {} : { gap }),
      legal: legal.length, ms: +(performance.now() - t).toFixed(2), by: c,
    });
    game.play(move);
    applyDrawRules(game);
    // The one event counter, shared with `replayRecord`, so a stored game can be re-read and checked.
    countMove(events, pos, move, game.pos);

    // Fishtest-style live adjudication: resign on a lasting big eval, draw on a lasting dead one.
    if (cp !== undefined && adj) {
      const sign = cp >= adj.resignCp ? 1 : cp <= -adj.resignCp ? -1 : 0;
      winStreak = sign !== 0 && sign === winSign ? winStreak + 1 : sign === 0 ? 0 : 1;
      winSign = sign;
      if (winStreak >= adj.resignPlies) { reason = 'adjudicatedResign'; result = sign > 0 ? 1 : 0; break; }
      quietStreak = Math.abs(cp) <= adj.drawCp ? quietStreak + 1 : 0;
      if (moves.length > adj.drawAfterPly && quietStreak >= adj.drawPlies) { reason = 'adjudicatedDraw'; break; }
    }
  }

  if (!reason) reason = game.status === 'playing' ? 'plyCap' : (game.status as EndReason);
  if (reason === 'checkmate') result = game.pos.turn === WHITE ? 0 : 1;
  census(game.pos, [stats[0].survived, stats[1].survived]);

  return {
    gameId: job.gameId, pairId: job.pairId, colourSwapped: job.colourSwapped, configId: job.configId,
    seed: job.seed, backRankWhite: job.backRankWhite, backRankBlack: job.backRankBlack,
    openingPlies, startFen, result, reason, plies: moves.length,
    ms: Math.round(performance.now() - t0), firstCapturePly,
    coverage: touched.reduce<number>((a, b) => a + b, 0) / 64,
    moves, events, stats,
  };
}
