import type { Rules } from '../rules/rules';
import { POOL, randomBackRank } from '../rules/setup';
import { mulberry32 } from './rng';
/** `powerPlies`: how deep in the tree the search offers king powers (`SearchOptions.powerPlies`). */
export interface AiSide { depth?: number; timeMs?: number; powerPlies?: number }

/** Fishtest-style live adjudication (docs/research/sim-methodology.md §3). */
export interface Adjudicate {
  resignCp: number; resignPlies: number;
  drawCp: number; drawPlies: number; drawAfterPly: number;
}
export const ADJUDICATE: Adjudicate = { resignCp: 600, resignPlies: 3, drawCp: 20, drawPlies: 8, drawAfterPly: 68 };

export interface RunSpec {
  id: string;
  games: number;
  /** Explicit list, or sample n back ranks from a pool (default: the project pool). */
  backRanks?: string[] | { sample: number; pool?: string };
  /**
   * White and black get different back ranks (piece-value experiments). Overrides backRanks.
   * `fen` replaces the built start position (pawn odds, for the value calibration arm); the
   * colour-swapped game of the pair uses `fenSwapped`, which must hand the handicap to the
   * other side and keep White to move.
   */
  asymmetric?: { white: string; black: string; fen?: string; fenSwapped?: string }[];
  /**
   * Common random numbers: every configuration of the run gets the *same* list of opening seeds,
   * so a comparison between configurations is paired. Cuts variance far more than extra games
   * (docs/research/sim-methodology.md §6).
   */
  commonSeeds?: boolean;
  ai: AiSide & { white?: AiSide; black?: AiSide };
  /** Rule toggles for this run; anything left out keeps today's default (`src/rules/rules.ts`). */
  rules?: Partial<Rules>;
  /**
   * The control arm of a rule A/B (`--baseRule`, `--baseValues`). Empty means today's game, which
   * is what every earlier A/B measured. A campaign that buffs a piece first and then asks "which
   * toggle matters *on top of that*" needs the control moved: without these, every arm would be
   * scored against a base nobody is proposing to ship. `rules` is layered over `baseRules`.
   */
  baseRules?: Partial<Rules>;
  baseValues?: Record<string, number>;
  /**
   * Name of the A/B control arm's output (default `<id>.base`). Several A/Bs that share one base
   * — same games, sample, seed, depth and base rules — can name it once: `run()` resumes from the
   * stored JSONL, so the control is played once instead of once per variant.
   */
  baseId?: string;
  /**
   * Engine material values in centipawns, by piece letter (`--values A=270,G=180`). Anything left
   * out keeps the shipped constant. A buffed rule set makes a piece worth more than `src/ai/eval.ts`
   * says, and a search that prices it at the old value trades it away too cheaply, so a rule
   * experiment needs its own values without touching the defaults the browser plays.
   */
  values?: Record<string, number>;
  /**
   * Two evaluations in one match: a JSON file of `EvalParams` per side, as `src/sim/tune.ts`
   * writes them; a side left out plays the shipped evaluation. The tables are module state, so the
   * sides are swapped between plies and the transposition table is cleared with them — which is
   * also why this costs about a third of the speed. Overrides `values`; use one or the other.
   */
  evalParams?: { white?: string; black?: string };
  /** Ask the search for the second-best root score, for the decision-cost metric. Costs ~2x. */
  multiPv?: boolean;
  /**
   * What the search holds an unspent king-power use to be worth, in centipawns, by power name
   * (`setPowerHold` in src/ai/search.ts); anything left out keeps the search's default.
   */
  powerHold?: Partial<Record<string, number>>;
  /**
   * Per board colour, layered over `powerHold` for that side's searches only (a holding-value
   * calibration match). The search's tables are swapped between plies, so the transposition table
   * is cleared with them, as for `evalParams`.
   */
  powerHoldSides?: [Partial<Record<string, number>> | undefined, Partial<Record<string, number>> | undefined];
  openingRandomPlies?: number;
  maxPlies?: number;
  /**
   * Colour-swapped pairs: games 2k and 2k+1 share a config and an opening seed, and the two AI
   * configs (plus any asymmetric back ranks) change sides. Default: on only when the two sides
   * actually differ -- see `usePairs`.
   */
  pairs?: boolean;
  adjudicate?: Partial<Adjudicate> & { evalCp?: number; plies?: number } | false;
  seed: number;
}

/**
 * `openingRandomPlies` is 4 by default on purpose: the search is deterministic at fixed depth, so
 * without a randomised opening every game of a configuration replays the first one exactly and the
 * run samples nothing. `--openingRandomPlies 0` turns it off.
 */
export const DEFAULTS = { maxPlies: 300, openingRandomPlies: 4 };

/** One game: which back ranks, which colour carries the "white" AI config, which RNG stream. */
export interface Job {
  gameId: number;
  pairId: number;
  /** Second game of the pair: the two AI configs (and any asymmetric ranks) change sides. */
  colourSwapped: boolean;
  configId: string;
  seed: number;
  backRankWhite: string;
  backRankBlack: string;
  /** Explicit start position (asymmetric handicaps); overrides the back ranks. */
  fen?: string;
}

/** `randomBackRank` with a caller-supplied pool (at least 7 letters); its constraints apply. */
export function sampleBackRank(rng: () => number, pool?: string): string {
  if (pool && pool.length < 7) throw new Error(`pool needs >= 7 letters, got "${pool}"`);
  return randomBackRank(rng, pool || POOL);
}

export function adjudication(spec: RunSpec): Adjudicate | null {
  if (spec.adjudicate === false) return null;
  const a = spec.adjudicate ?? {};
  return {
    ...ADJUDICATE,
    ...(a.evalCp !== undefined ? { resignCp: a.evalCp } : {}),
    ...(a.plies !== undefined ? { resignPlies: a.plies } : {}),
    ...Object.fromEntries(Object.entries(a).filter(([k, v]) => v !== undefined && k in ADJUDICATE)),
  };
}

/**
 * Search options per board colour, with the pair's colour swap applied.
 * A fixed-depth run gets `timeMs: Infinity` so the wall clock cannot make a run unrepeatable
 * (docs/research/sim-methodology.md §7.1); an explicit timeMs still wins.
 */
export function sideOptions(spec: RunSpec, colourSwapped = false): [SideSearch, SideSearch] {
  const mk = (s?: AiSide): SideSearch => {
    const depth = s?.depth ?? spec.ai.depth;
    const timeMs = s?.timeMs ?? spec.ai.timeMs;
    const powerPlies = s?.powerPlies ?? spec.ai.powerPlies;
    return {
      ...(depth === undefined ? {} : { maxDepth: depth }), timeMs: timeMs ?? (depth === undefined ? 1000 : Infinity),
      ...(powerPlies === undefined ? {} : { powerPlies }),
    };
  };
  const [a, b] = [mk(spec.ai.white), mk(spec.ai.black)];
  return colourSwapped ? [b, a] : [a, b];
}

export interface SideSearch { maxDepth?: number; timeMs: number; powerPlies?: number }

/**
 * Pairs cancel the opening bias between two *different* sides. With one engine, equal settings and
 * a mirrored back rank, the swapped game replays the first one move for move (the search is
 * deterministic at fixed depth), so pairing would halve the sample for nothing. Default it on only
 * where it pays: asymmetric back ranks, or different AI settings per side. `pairs: true` forces it.
 */
export function usePairs(spec: RunSpec): boolean {
  if (spec.pairs !== undefined) return spec.pairs;
  const w = spec.ai.white ?? {}, b = spec.ai.black ?? {};
  return !!spec.asymmetric?.length
    || w.depth !== b.depth || w.timeMs !== b.timeMs;
}

/** One job per game. Deterministic in `spec.seed`; both games of a pair share an opening stream. */
export function buildJobs(spec: RunSpec): Job[] {
  const rng = mulberry32(spec.seed);
  const paired = usePairs(spec);
  const nConfigs = paired ? Math.ceil(spec.games / 2) : spec.games;
  let configs: NonNullable<RunSpec['asymmetric']>;
  if (spec.asymmetric?.length) configs = spec.asymmetric;
  else if (Array.isArray(spec.backRanks)) configs = spec.backRanks.map(r => ({ white: r, black: r }));
  else {
    const n = Math.max(1, Math.min(spec.backRanks?.sample ?? nConfigs, nConfigs));
    const pool = spec.backRanks && !Array.isArray(spec.backRanks) ? spec.backRanks.pool : undefined;
    configs = Array.from({ length: n }, () => {
      const r = sampleBackRank(rng, pool);
      return { white: r, black: r };
    });
  }
  return Array.from({ length: spec.games }, (_, i) => {
    const pairId = paired ? i >> 1 : i;
    const colourSwapped = paired && (i & 1) === 1;
    const c = configs[pairId % configs.length];
    // Common random numbers: the seed follows the repetition index, not the configuration, so
    // every configuration plays the same openings.
    const stream = spec.commonSeeds ? Math.floor(pairId / configs.length) : pairId;
    const fen = colourSwapped ? c.fenSwapped ?? c.fen : c.fen;
    return {
      gameId: i, pairId, colourSwapped,
      configId: c.white === c.black ? c.white : `${c.white} vs ${c.black}`,
      seed: (spec.seed * 1_000_003 + stream * 7919) >>> 0,
      backRankWhite: colourSwapped ? c.black : c.white,
      backRankBlack: colourSwapped ? c.white : c.black,
      ...(fen ? { fen } : {}),
    };
  });
}
