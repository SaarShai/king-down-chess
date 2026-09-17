/**
 * Read a run's JSONL, write `<id>.report.md` + `<id>.report.json`.
 * Statistics ported from docs/research/sim-methodology.md §2 (Fishtest / normalized Elo / Wilson).
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameRecord } from './game';
import { OUT_DIR, parseFlags, paths } from './spec';
import { Rules, ruleDiff } from '../rules/rules';
import { WHITE, moverAt } from '../rules/engine';
import { KNIGHT_V } from '../ai/eval';
import { mulberry32 } from './rng';
import { CP_CLAMP, CP_SCALE, DEAD_BAND, DECISION_CP, GATES, INTEREST, LEAD_CHANGE_SCALE, UNSURE, WEIGHTS } from './weights';

const Z = 1.959964;              // 95%
const C = 800 / Math.log(10);    // 347.4356, normalized-Elo constant
/** d(Elo)/d(mu) at mu = 0.5, for the err95 rule of thumb. */
const ELO_SLOPE = 694.9;

const mean = (xs: readonly number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/** Abramowitz & Stegun 7.1.26; plenty for a LOS readout. */
function erf(x: number): number {
  const s = Math.sign(x), a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a);
  return s * y;
}
export const phi = (x: number): number => 0.5 * (1 + erf(x / Math.SQRT2));

/** Wilson score interval. `s` may be fractional (a chess score sum: win 1, draw 0.5). */
export function wilson(s: number, n: number): [number, number] {
  if (n <= 0) return [0, 1];
  const p = s / n, a = Z * Z / n;
  const centre = (p + a / 2) / (1 + a);
  const half = (Z / (1 + a)) * Math.sqrt((p * (1 - p)) / n + a / (4 * n));
  return [Math.max(0, centre - half), Math.min(1, centre + half)];
}

/** Score -> Elo difference. Clamped so a clean sweep does not return Infinity. */
export function elo(score: number): number {
  const s = Math.min(1 - 1e-6, Math.max(1e-6, score));
  return -400 * Math.log10(1 / s - 1);
}

export interface MatchStats {
  n: number; mu: number; variance: number; sigmaPg: number;
  elo: number; err95: number; nElo: number; los: number;
}

/**
 * `counts` = 5 pentanomial pair counts, or 3 trinomial game counts [L, D, W].
 * Pairs take sigma_pg = sqrt(2 * var) (sim-methodology.md §2 [11 §2][12]).
 */
export function matchStats(counts: readonly number[], games = 0): MatchStats {
  const c = counts.map(x => x || 1e-3);
  const n = c.reduce((a, b) => a + b, 0), k = c.length - 1;
  const mu = c.reduce((a, x, i) => a + (x / n) * (i / k), 0);
  const variance = c.reduce((a, x, i) => a + (x / n) * (i / k - mu) ** 2, 0);
  const sigmaPg = Math.sqrt(k === 4 ? 2 * variance : variance);
  const se = Math.sqrt(variance / n);
  return {
    n, mu, variance, sigmaPg,
    elo: elo(mu),
    err95: (ELO_SLOPE * Z * sigmaPg) / Math.sqrt(games || (k === 4 ? 2 * n : n)),
    nElo: (C * (mu - 0.5)) / sigmaPg,
    los: phi((mu - 0.5) / se),
  };
}

/** SPRT bounds at alpha = beta = 0.05: accept H1 above +2.944, H0 below -2.944. */
export const SPRT_BOUND = Math.log((1 - 0.05) / 0.05);

export interface Sprt { llr: number; bound: number; nElo: number; verdict: 'H0' | 'H1' | 'continue'; expectedGames: number }

/**
 * GSPRT in normalized Elo, Van den Bergh's approximation (4.14) (sim-methodology.md §2 [11 §4]).
 * `counts` = 5 pentanomial pair counts or 3 trinomial game counts; `games` = games played.
 * H0 is `nelo0` (default 0, no difference), H1 is `nelo1` (default +4).
 *
 * Known limit of the approximation: it is a second-order expansion, so it flattens when the
 * variance collapses. A clean sweep (every pair won) reads as "continue", not H1. Real runs never
 * reach that, and the clamp is there so early noise cannot end a test either.
 */
export function sprt(counts: readonly number[], games: number, nelo0 = 0, nelo1 = 4): Sprt {
  const { mu, sigmaPg, nElo } = matchStats(counts, games);
  const t = (mu - 0.5) / sigmaPg, t0 = nelo0 / C, t1 = nelo1 / C;
  const raw = (games / 2) * Math.log((1 + (t - t0) ** 2) / (1 + (t - t1) ** 2));
  const cap = (games * Math.abs(t1 - t0)) / 2;   // regularize early noise [11 Rem 4.2]
  const llr = Math.max(-cap, Math.min(cap, raw));
  return {
    llr, bound: SPRT_BOUND, nElo,
    verdict: llr >= SPRT_BOUND ? 'H1' : llr <= -SPRT_BOUND ? 'H0' : 'continue',
    expectedGames: Math.round(1_046_535 / (nelo1 - nelo0) ** 2),
  };
}

/** Complete colour-swapped pairs -> [LL, LD, DD/WL, WD, WW] from game A's side. */
export function pentanomial(recs: readonly GameRecord[]): { counts: number[]; pairs: number } | null {
  const byPair = new Map<number, GameRecord[]>();
  for (const r of recs) (byPair.get(r.pairId) ?? byPair.set(r.pairId, []).get(r.pairId)!).push(r);
  const counts = [0, 0, 0, 0, 0];
  let pairs = 0;
  for (const g of byPair.values()) {
    const a = g.find(x => !x.colourSwapped), b = g.find(x => x.colourSwapped);
    if (!a || !b || g.length !== 2) continue;
    counts[Math.round((a.result + (1 - b.result)) * 2)]++;
    pairs++;
  }
  return pairs ? { counts, pairs } : null;
}

export interface Trajectory {
  leadChanges: number; volatility: number; uncertainty: number;
  drama: number; stability: number; branchingFactor: number;
}

/**
 * Lead changes = sign flips of the white-POV eval after ply 10, with a +-DEAD_BAND neutral zone.
 * Volatility = mean |delta eval|. Uncertainty = last ply with |eval| < UNSURE, over the length.
 * Drama (Browne [22]) = the eventual winner's worst eval, in cp. Stability (Ludii) = 1 - mean
 * |delta| of tanh(cp/400), so it lives in [0, 1] and mate scores cannot dominate it.
 */
export function trajectory(rec: GameRecord): Trajectory {
  const clamp = (c: number): number => Math.max(-CP_CLAMP, Math.min(CP_CLAMP, c));
  let changes = 0, side = 0, sum = 0, tanhSum = 0, deltas = 0;
  let prev: number | null = null, lastUnsure = 0, worst = 0;
  const winner = rec.result === 1 ? 1 : rec.result === 0 ? -1 : 0;
  rec.moves.forEach((m, i) => {
    if (m.cp === undefined) return;
    const cp = clamp(m.cp);
    if (prev !== null) { sum += Math.abs(cp - prev); tanhSum += Math.abs(Math.tanh(cp / 400) - Math.tanh(prev / 400)); deltas++; }
    prev = cp;
    if (Math.abs(cp) < UNSURE) lastUnsure = i + 1;
    if (winner !== 0) worst = Math.min(worst, cp * winner);
    if (i < 10) return;
    const s = cp > DEAD_BAND ? 1 : cp < -DEAD_BAND ? -1 : 0;
    if (s !== 0) { if (side !== 0 && s !== side) changes++; side = s; }
  });
  return {
    leadChanges: changes,
    volatility: deltas ? sum / deltas : 0,
    uncertainty: rec.plies ? lastUnsure / rec.plies : 0,
    drama: Math.max(0, -worst),
    stability: deltas ? 1 - tanhSum / deltas : 1,
    branchingFactor: mean(rec.moves.map(m => m.legal ?? 0)),
  };
}

/**
 * Browne's criteria on the squashed lead signal (docs/research/variant-balance.md §3.0-3.1).
 * `p_t = 1/(1 + exp(-cp/CP_SCALE))` is white's win belief and `L_t = 2 p_t - 1` is the lead in
 * [-1, 1]. Squashing first keeps every metric bounded and stops one mate score dominating.
 * Every value here is in [0, 1] and the opening's random plies are skipped, as Browne skips his.
 */
export interface Lead {
  killerMove: number; leadChange: number; uncertaintyLate: number; permanence: number; drama: number;
  /** Decision cost in bits, per side, and its asymmetry (needs `multiPv`; 0 without it). */
  decisionCost: [number, number]; decisionAsymmetry: number;
}

/**
 * `rules` is the rule set the game was played under, because `secondPlayerDoubleFirstTurn` changes
 * who moves at a given ply (`moverAt`). Fallback order: the record's own stamp, then whatever the
 * caller knows (the run summary, via `group`), then `{}` — and `{}` means the defaults, since a
 * rule diff omits every rule at its default.
 */
export function leadMetrics(rec: GameRecord, rules: Partial<Rules> = rec.rules ?? {}): Lead {
  const idx: number[] = [], lead: number[] = [];
  const cost: [number, number] = [0, 0];
  rec.moves.forEach((m, i) => {
    if (m.gap !== undefined) cost[moverAt(i, rules)] += Math.log2(1 + Math.exp(-m.gap / DECISION_CP));
    if (m.cp === undefined) return;
    idx.push(i);
    lead.push(2 / (1 + Math.exp(-Math.max(-CP_CLAMP, Math.min(CP_CLAMP, m.cp)) / CP_SCALE)) - 1);
  });
  const T = lead.length;
  const z = rec.result === 1 ? 1 : rec.result === 0 ? -1 : 0;
  const empty: Lead = { killerMove: 0, leadChange: 0, uncertaintyLate: 0.5, permanence: 1, drama: 0, decisionCost: cost, decisionAsymmetry: cost[1] - cost[0] };
  if (T < 2) return empty;

  // Killer move: the largest single swing in the mover's own favour. `moverAt` gives the mover:
  // plain ply parity is wrong under `secondPlayerDoubleFirstTurn` (LESSONS.md 2026-09-14).
  let killer = 0, changes = 0, jerk = 0, dramaSum = 0, dramaN = 0;
  for (let i = 1; i < T; i++) {
    const d = lead[i] - lead[i - 1];
    killer = Math.max(killer, (moverAt(idx[i], rules) === WHITE ? 1 : -1) * d);
    if (Math.sign(lead[i]) !== 0 && Math.sign(lead[i]) !== Math.sign(lead[i - 1]) && Math.sign(lead[i - 1]) !== 0) changes++;
    if (i >= 2) jerk += Math.abs(d - (lead[i - 1] - lead[i - 2]));
  }
  for (const l of lead) if (z !== 0 && z * l < 0) { dramaSum += Math.sqrt(-z * l); dramaN++; }

  // Uncertainty (late): sample |L| at 100 points of the game; a game still open late scores high.
  let u = 0;
  for (let k = 0; k < 100; k++) {
    const tau = k / 100;
    u += tau - Math.abs(lead[Math.min(T - 1, Math.floor(tau * T))]);
  }
  return {
    killerMove: Math.max(0, Math.min(1, killer)),
    leadChange: changes / (T - 1),
    uncertaintyLate: (u / 100 + 1) / 2,
    permanence: T >= 3 ? Math.max(0, 1 - jerk / (T - 2)) : 1,
    drama: dramaN ? dramaSum / dramaN : 0,
    decisionCost: cost,
    decisionAsymmetry: cost[1] - cost[0],
  };
}

/**
 * Piece utilisation (docs/research/balancing-frameworks.md §5): a type's share of all moves over
 * its share of the starting material. 1 = pulls its weight, 0 = ornamental. Pooled over both sides.
 */
export function utilisation(recs: readonly GameRecord[]): Record<string, number> {
  const moves: Record<string, number> = {}, start: Record<string, number> = {};
  let totalMoves = 0, totalStart = 0;
  for (const r of recs) for (const side of r.stats) {
    for (const [k, n] of Object.entries(side.moves)) { moves[k] = (moves[k] ?? 0) + n; totalMoves += n; }
    for (const [k, n] of Object.entries(side.start)) { start[k] = (start[k] ?? 0) + n; totalStart += n; }
  }
  const out: Record<string, number> = {};
  for (const [k, n] of Object.entries(start)) if (n > 0) out[k] = ((moves[k] ?? 0) / (totalMoves || 1)) / (n / (totalStart || 1));
  return out;
}

/** Placeholder blend; kept for the legacy funScore column. */
export function funScore(decisiveness: number, leadChanges: number, uncertainty: number): number {
  return WEIGHTS.decisiveness * decisiveness
    + WEIGHTS.leadChanges * Math.min(1, leadChanges / LEAD_CHANGE_SCALE)
    + WEIGHTS.uncertainty * uncertainty;
}

export interface Group {
  key: string; games: number; wins: number; draws: number; losses: number;
  score: number; ci: [number, number];
  elo: number; eloLo: number; eloHi: number;
  /** Pentanomial when complete pairs exist, else trinomial. */
  match: MatchStats; pentanomial: number[] | null; pairs: number;
  sprt: Sprt;
  /** A capped game is not a draw (cutechess scores it as one; we do not). Three shares, summing to 1. */
  drawRate: number; timeouts: number; decisiveness: number;
  meanPlies: number; medianPlies: number; sdPlies: number; durationDeviation: number;
  leadChanges: number; volatility: number; uncertainty: number;
  drama: number; stability: number; boardCoverage: number; branchingFactor: number;
  /** Browne set (docs/SIM-PLAN.md §5), each in [0, 1]. */
  lead: Lead;
  utilisation: Record<string, number>; minUse: number;
  /** Fairy utilisation: the mean over the fairy types on the board, and the old minimum. */
  meanFairyUse: number; minFairyUse: number;
  /** Filled by `analyze` once the whole pool is known: the two need a regression over all groups. */
  excessDecisiveness: number; interest: number;
  /** The same score with the superseded minimum-fairy-use term, so the two are comparable. */
  interestMinFairy: number; gatesFailed: string[];
  /** Each interest term minus what this group's draw rate predicts for it (`residualiseInterest`). */
  interestResiduals: Record<string, number>;
  funScore: number;
}

const FAIRY = ['A', 'L', 'G', 'M', 'S'];
const meanOf = <T>(xs: readonly T[], f: (x: T) => number): number => mean(xs.map(f));

/** `rules`: what this run played, for the metrics that need to know who moved (see `leadMetrics`). */
export function group(key: string, recs: readonly GameRecord[], rules: Partial<Rules> = {}): Group {
  const n = recs.length;
  const wins = recs.filter(r => r.result === 1).length;
  const draws = recs.filter(r => r.result === 0.5).length;
  const losses = n - wins - draws;
  const s = recs.reduce((a, r) => a + r.result, 0);
  const score = n ? s / n : 0;
  // A match score with draws is trinomial, so Wilson does not apply (variant-balance.md §4).
  // Use the normal interval on the per-game score; `wilson` stays for genuine rates below.
  const sd = Math.sqrt(mean(recs.map(r => (r.result - score) ** 2)));
  const half = n ? Z * sd / Math.sqrt(n) : 0.5;
  const ci: [number, number] = [Math.max(0, score - half), Math.min(1, score + half)];
  const plies = recs.map(r => r.plies).sort((a, b) => a - b);
  const mp = mean(plies);
  const tr = recs.map(trajectory);
  const lm = recs.map(r => leadMetrics(r, r.rules ?? rules));
  const pen = pentanomial(recs);
  const capped = recs.filter(r => r.reason === 'plyCap').length;
  const timeouts = n ? capped / n : 0;
  const drawRate = n ? (draws - capped) / n : 0;
  const decisiveness = n ? (wins + losses) / n : 0;
  const leadChanges = mean(tr.map(t => t.leadChanges));
  const uncertainty = mean(tr.map(t => t.uncertainty));
  const counts = pen ? pen.counts : [losses, draws, wins];
  const use = utilisation(recs);
  const present = Object.entries(use).filter(([k]) => k !== 'K');
  const fairy = present.filter(([k]) => FAIRY.includes(k));
  const prefPlies = 150;   // half the default ply cap (docs/research/variant-balance.md §3.1)
  return {
    key, games: n, wins, draws, losses,
    score, ci, elo: elo(score), eloLo: elo(ci[0]), eloHi: elo(ci[1]),
    match: matchStats(counts, n), pentanomial: pen?.counts ?? null, pairs: pen?.pairs ?? 0,
    sprt: sprt(counts, n),
    drawRate, timeouts, decisiveness,
    meanPlies: mp, medianPlies: plies[plies.length >> 1] ?? 0,
    sdPlies: Math.sqrt(mean(plies.map(p => (p - mp) ** 2))),
    durationDeviation: Math.abs(prefPlies - mp) / prefPlies,
    leadChanges, volatility: mean(tr.map(t => t.volatility)), uncertainty,
    drama: mean(tr.map(t => t.drama)), stability: mean(tr.map(t => t.stability)),
    boardCoverage: mean(recs.map(r => r.coverage ?? 0)),
    branchingFactor: mean(tr.map(t => t.branchingFactor)),
    lead: {
      killerMove: meanOf(lm, x => x.killerMove), leadChange: meanOf(lm, x => x.leadChange),
      uncertaintyLate: meanOf(lm, x => x.uncertaintyLate), permanence: meanOf(lm, x => x.permanence),
      drama: meanOf(lm, x => x.drama),
      decisionCost: [meanOf(lm, x => x.decisionCost[0]), meanOf(lm, x => x.decisionCost[1])],
      decisionAsymmetry: meanOf(lm, x => x.decisionAsymmetry),
    },
    utilisation: use,
    minUse: present.length ? Math.min(...present.map(([, v]) => v)) : 1,
    meanFairyUse: fairy.length ? mean(fairy.map(([, v]) => v)) : 1,
    minFairyUse: fairy.length ? Math.min(...fairy.map(([, v]) => v)) : 1,
    excessDecisiveness: 0, interest: 0, interestMinFairy: 0, gatesFailed: [], interestResiduals: {},
    funScore: funScore(decisiveness, leadChanges, uncertainty),
  };
}

/**
 * The decisiveness correction (docs/research/variant-balance.md §7). Across 960 Chess960 positions
 * `corr(draw rate, White points) = -0.92`: a decisive arrangement is usually only an arrangement
 * that is good for White. So fit `decisive ~ a + b * |score - 0.5|` over the pool of this round and
 * keep the **residual**. That residual is what "this arrangement produces fights" means once the
 * confound is out. Raw decisiveness must never be a reward term.
 */
export function excessDecisiveness(fit: Group[], apply: Group[] = fit): void {
  const line = lineFit(fit.map(g => Math.abs(g.score - 0.5)), fit.map(g => g.decisiveness));
  for (const g of apply) g.excessDecisiveness = g.decisiveness - line(Math.abs(g.score - 0.5));
}

/** Least squares `y ~ a + b x`, returned as the fitted line. `b = 0` when `x` has no spread. */
function lineFit(xs: readonly number[], ys: readonly number[]): (x: number) => number {
  const mx = mean(xs), my = mean(ys);
  const sxx = xs.reduce((a, x) => a + (x - mx) ** 2, 0);
  const b = sxx > 1e-12 ? xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0) / sxx : 0;
  return (x: number) => my + b * (x - mx);
}

/** The interest terms, in the units `interestScore` weighs. `fairyUse` is clamped as it is there. */
export const INTEREST_TERMS: Record<string, (g: Group) => number> = {
  killerMove: g => g.lead.killerMove,
  leadChange: g => g.lead.leadChange,
  uncertaintyLate: g => g.lead.uncertaintyLate,
  drama: g => g.lead.drama,
  permanence: g => g.lead.permanence,
  fairyUse: g => Math.min(1, g.meanFairyUse),
  excessDecisiveness: g => g.excessDecisiveness,
  interest: g => g.interest,
  interestMinFairy: g => g.interestMinFairy,
};

/**
 * Residualise every interest term on the **draw rate** (batch-2 finding: the interest axis tracks
 * draw rate, so a rule that moves draws moves every term with it, and a "more interesting" verdict
 * can be nothing but "fewer draws"). Fit `term ~ a + b * drawRate` over `fit` and store the residual
 * for each group in `apply`.
 *
 * Read a *difference*, never a level: the mean residual over `fit` is 0 by construction. Two
 * populations are compared by fitting one line on their union (`fit` = both pools' arrangements) and
 * comparing the per-arm mean residual, which is the part of the gap the draw rate does not explain.
 */
export function residualiseInterest(fit: Group[], apply: Group[] = fit): void {
  const lines = Object.entries(INTEREST_TERMS)
    .map(([k, f]) => [k, lineFit(fit.map(g => g.drawRate), fit.map(f))] as const);
  for (const g of apply) {
    g.interestResiduals = {};
    for (const [k, line] of lines) g.interestResiduals[k] = INTEREST_TERMS[k](g) - line(g.drawRate);
  }
}

/**
 * Counters for the abuse patterns a buffed rule set can introduce (docs/research/sim-results §18.4
 * flagged the guard as the one to watch). All four are read straight off the stored games.
 * `kingNeverMoved` counts a game where **either** king never left its start square.
 */
export interface Degeneracy {
  guardCapturesPerGame: number;
  guardRampages: number;
  guardRampageShare: number;
  deadMaterial: number;
  deadMaterialShare: number;
  kingNeverMoved: number;
  kingNeverMovedShare: number;
}

export function degeneracy(recs: readonly GameRecord[]): Degeneracy {
  let caps = 0, rampages = 0, dead = 0, still = 0;
  for (const r of recs) {
    let rampage = false, frozen = false;
    for (const side of r.stats) {
      const g = side.captures.G ?? 0;
      caps += g;
      if (g >= 3) rampage = true;
      if (side.start.K && !side.moves.K) frozen = true;
    }
    if (rampage) rampages++;
    if (frozen) still++;
    if (r.reason === 'draw50' || r.reason === 'drawMaterial') dead++;
  }
  const n = recs.length || 1;
  return {
    guardCapturesPerGame: caps / n,
    guardRampages: rampages, guardRampageShare: rampages / n,
    deadMaterial: dead, deadMaterialShare: dead / n,
    kingNeverMoved: still, kingNeverMovedShare: still / n,
  };
}

/** Browne's viability gates: reject, do not score (variant-balance.md §7 stage 1). */
export function gates(g: Group, drawRateCut = 0): string[] {
  const out: string[] = [];
  if (Math.abs(g.score - 0.5) > GATES.balance) out.push('balance');
  if (g.timeouts > GATES.timeouts) out.push('timeouts');
  if (g.durationDeviation > GATES.durationDeviation) out.push('duration');
  if (g.minUse < GATES.fairyUse) out.push('utilisation');
  if (drawRateCut > 0 && g.drawRate > drawRateCut) out.push('drawRate');
  return out;
}

/**
 * Interest score: Browne's fitted signs, renormalised (src/sim/weights.ts). Lead change carries a
 * negative weight on purpose. The residual decisiveness is mapped from [-1, 1] to [0, 1] first.
 * Rank on it; never read it as a percentage. It is the second axis, not a verdict: report it next
 * to balance, never merged with it.
 */
export function interestScore(g: Group, fairyUse = g.meanFairyUse): number {
  return INTEREST.killerMove * g.lead.killerMove
    + INTEREST.leadChange * g.lead.leadChange
    + INTEREST.uncertaintyLate * g.lead.uncertaintyLate
    + INTEREST.drama * g.lead.drama
    + INTEREST.permanence * g.lead.permanence
    + INTEREST.fairyUse * Math.min(1, fairyUse)
    + INTEREST.excessDecisiveness * ((Math.max(-1, Math.min(1, g.excessDecisiveness)) + 1) / 2);
}

export interface PieceRow {
  piece: string; moves: number; captures: number; taken: number;
  started: number; survived: number; survival: number;
}

function pieceRows(recs: readonly GameRecord[]): PieceRow[] {
  const acc: Record<string, PieceRow> = {};
  const row = (p: string): PieceRow => (acc[p] ??= { piece: p, moves: 0, captures: 0, taken: 0, started: 0, survived: 0, survival: 0 });
  for (const r of recs) for (const side of r.stats) {
    for (const [p, n] of Object.entries(side.moves)) row(p).moves += n;
    for (const [p, n] of Object.entries(side.captures)) row(p).captures += n;
    for (const [p, n] of Object.entries(side.taken)) row(p).taken += n;
    for (const [p, n] of Object.entries(side.start)) row(p).started += n;
    for (const [p, n] of Object.entries(side.survived)) row(p).survived += n;
  }
  for (const r of Object.values(acc)) r.survival = r.started ? r.survived / r.started : 0;
  return Object.values(acc).sort((a, b) => b.moves - a.moves);
}

export function eventTotals(recs: readonly GameRecord[]): Record<string, number> {
  const t = {
    archerShots: 0, beastChainMoves: 0, beastChainCaptures: 0, maesterSwaps: 0, maesterLongSwaps: 0,
    paladinSacrifices: 0, promotions: 0, checks: 0,
    ogreShoves: 0, ogreShovesFriend: 0, ogreShovesGuard: 0, catapultChecks: 0,
  };
  // The lab-piece counters landed on 2026-09-14; a game recorded before that carries none.
  const pair = (x: [number, number] | undefined): number => (x ? x[0] + x[1] : 0);
  for (const r of recs) {
    const e = r.events;
    t.ogreShoves += pair(e.ogreShoves);
    t.ogreShovesFriend += pair(e.ogreShovesFriend);
    t.ogreShovesGuard += pair(e.ogreShovesGuard);
    t.catapultChecks += pair(e.catapultChecks);
    t.archerShots += e.archerShots[0] + e.archerShots[1];
    for (const side of e.beastChains) { t.beastChainMoves += side.length; t.beastChainCaptures += side.reduce((a, b) => a + b, 0); }
    t.maesterSwaps += e.maesterSwaps[0] + e.maesterSwaps[1];
    t.maesterLongSwaps += e.maesterLongSwaps[0] + e.maesterLongSwaps[1];
    t.paladinSacrifices += e.paladinSacrifices[0] + e.paladinSacrifices[1];
    t.promotions += e.promotions[0] + e.promotions[1];
    t.checks += e.checks[0] + e.checks[1];
  }
  return t;
}

export interface Report {
  id: string; games: number; overall: Group;
  reasons: Record<string, number>;
  degeneracy: Degeneracy;
  pieces: PieceRow[];
  events: Record<string, number>;
  byConfig: Group[];
  mostBalanced: Group[]; mostFun: Group[];
  /** Rule toggles that differ from the defaults, from the run's summary file. */
  rules: Partial<Rules>;
  weights: typeof WEIGHTS; interest: typeof INTEREST;
}

export function analyze(id: string, recs: readonly GameRecord[], rules: Partial<Rules> = {}): Report {
  const reasons: Record<string, number> = {};
  for (const r of recs) reasons[r.reason] = (reasons[r.reason] ?? 0) + 1;
  const buckets = new Map<string, GameRecord[]>();
  for (const r of recs) {
    const k = r.configId ?? (r.backRankWhite === r.backRankBlack ? r.backRankWhite : `${r.backRankWhite} vs ${r.backRankBlack}`);
    (buckets.get(k) ?? buckets.set(k, []).get(k)!).push(r);
  }
  const byConfig = [...buckets].map(([k, rs]) => group(k, rs, rules)).sort((a, b) => b.games - a.games);
  const overall = group('ALL', recs, rules);
  // The residual needs the whole pool, so it is fitted after the groups exist. The pool is the
  // configurations; the overall row gets the same line applied, but never joins the fit.
  excessDecisiveness(byConfig, [...byConfig, overall]);
  const drawRates = byConfig.map(g => g.drawRate).sort((a, b) => a - b);
  const worstDecile = drawRates.length >= 10 ? drawRates[Math.floor(drawRates.length * 0.9)] : 0;
  for (const g of [...byConfig, overall]) {
    g.interest = interestScore(g);
    g.interestMinFairy = interestScore(g, g.minFairyUse);
    g.gatesFailed = gates(g, worstDecile);
  }
  // The interest axis tracks draw rate, so every term is residualised on it, on the same pool.
  residualiseInterest(byConfig, [...byConfig, overall]);
  return {
    id, games: recs.length, overall, reasons, degeneracy: degeneracy(recs),
    pieces: pieceRows(recs), events: eventTotals(recs), byConfig,
    mostBalanced: [...byConfig].sort((a, b) => Math.abs(a.score - 0.5) - Math.abs(b.score - 0.5)),
    mostFun: [...byConfig].sort((a, b) => b.interest - a.interest),
    rules: ruleDiff(rules), weights: WEIGHTS, interest: INTEREST,
  };
}

// ---------------------------------------------------------------------------------------------

export interface ConfirmRow { key: string; a: number; b: number; delta: number; flipped: boolean }

/**
 * Second-depth confirmation (docs/SIM-PLAN.md §9). Balance depends on the agent, so a headline
 * finding has to repeat at a second depth; a metric that changes sign between the two budgets is
 * unresolved. `pick` selects the number to compare (default: white score minus 0.5).
 */
export function confirmDepths(a: Report, b: Report, pick: (g: Group) => number = g => g.score - 0.5): ConfirmRow[] {
  const other = new Map(b.byConfig.map(g => [g.key, g]));
  const rows: ConfirmRow[] = [];
  for (const g of a.byConfig) {
    const h = other.get(g.key);
    if (!h) continue;
    const [x, y] = [pick(g), pick(h)];
    rows.push({ key: g.key, a: x, b: y, delta: y - x, flipped: Math.sign(x) !== Math.sign(y) });
  }
  return rows.sort((p, q) => Math.abs(q.delta) - Math.abs(p.delta));
}

// ---------------------------------------------------------------------------------------------

const pct = (x: number): string => `${(100 * x).toFixed(1)}%`;
const f1 = (x: number): string => x.toFixed(1);
const signed = (x: number): string => `${x >= 0 ? '+' : ''}${x.toFixed(0)}`;

function table(head: string[], rows: (string | number)[][]): string {
  return [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`,
    ...rows.map(r => `| ${r.join(' | ')} |`)].join('\n');
}

const GROUP_HEAD = ['key', 'n', 'W', 'D', 'L', 'score', 'score 95%', 'white Elo ±', 'decisive', 'draw', 'capped', 'plies', 'killer', 'leadΔ', 'unc', 'drama', 'perm', 'minUse', 'fairyUse', 'xDec', 'interest', 'interest(min)', 'gates'];
const groupRow = (g: Group): (string | number)[] => [
  g.key, g.games, g.wins, g.draws, g.losses, g.score.toFixed(3),
  `${g.ci[0].toFixed(3)}–${g.ci[1].toFixed(3)}`,
  `${signed(g.elo)} ±${g.match.err95.toFixed(0)}`,
  pct(g.decisiveness), pct(g.drawRate), pct(g.timeouts), `${f1(g.meanPlies)}±${f1(g.sdPlies)}`,
  g.lead.killerMove.toFixed(2), g.lead.leadChange.toFixed(3), g.lead.uncertaintyLate.toFixed(3),
  g.lead.drama.toFixed(2), g.lead.permanence.toFixed(2), g.minUse.toFixed(2), g.meanFairyUse.toFixed(2),
  g.excessDecisiveness.toFixed(3), g.interest.toFixed(3), g.interestMinFairy.toFixed(3), g.gatesFailed.join(',') || '-',
];

export function toMarkdown(r: Report): string {
  const o = r.overall, m = o.match;
  const pen = o.pentanomial ? `Pentanomial over ${o.pairs} colour-swapped pairs: [${o.pentanomial.join(', ')}] (LL, LD, DD/WL, WD, WW).` : 'No complete colour-swapped pairs in this run.';
  const ruleLine = Object.keys(r.rules).length
    ? `Rules changed from the defaults: \`${Object.entries(r.rules).map(([k, v]) => `${k}=${v}`).join(' ')}\`.`
    : 'Rules: all defaults.';
  const cost = o.lead.decisionCost[0] + o.lead.decisionCost[1] > 0
    ? `\nDecision cost (MultiPV=2): white ${f1(o.lead.decisionCost[0])} bits, black ${f1(o.lead.decisionCost[1])} bits, asymmetry ${signed(o.lead.decisionAsymmetry)}.`
    : '';
  return `# Sim report — ${r.id}

${r.games} games. White score **${o.score.toFixed(3)}** (95% ${o.ci[0].toFixed(3)}–${o.ci[1].toFixed(3)}),
white advantage **${signed(o.elo)} ± ${m.err95.toFixed(0)} Elo**.
Decisive ${pct(o.decisiveness)} · draws ${pct(o.drawRate)} · capped ${pct(o.timeouts)} (counted apart, never as draws).
Plies: mean ${f1(o.meanPlies)} ± ${f1(o.sdPlies)}, median ${o.medianPlies}. ${ruleLine}

${pen}
σ_pg ${m.sigmaPg.toFixed(4)} · normalized Elo ${signed(m.nElo)} · LOS ${pct(m.los)} ·
SPRT LLR ${o.sprt.llr.toFixed(2)} against ±${o.sprt.bound.toFixed(2)} (nElo 0 vs 4) → **${o.sprt.verdict}**.${cost}

## Overall
${table(GROUP_HEAD, [groupRow(o)])}

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
${table(['piece', ...Object.keys(o.utilisation)], [['use', ...Object.values(o.utilisation).map(v => v.toFixed(2))]])}

## End reasons
${table(['reason', 'games', 'share'], Object.entries(r.reasons).sort((a, b) => b[1] - a[1])
    .map(([k, n]) => [k, n, pct(n / (r.games || 1))]))}

## Pieces
${table(['piece', 'moves', 'captures made', 'times captured', 'started', 'survived', 'survival'],
    r.pieces.map(p => [p.piece, p.moves, p.captures, p.taken, p.started, p.survived, pct(p.survival)]))}

## Fairy events (both sides, whole run)
${table(['event', 'total', 'per game'], Object.entries(r.events)
    .map(([k, n]) => [k, n, (n / (r.games || 1)).toFixed(2)]))}

## Degeneracy counters
${table(['counter', 'value'], [
    ['guard captures per game', r.degeneracy.guardCapturesPerGame.toFixed(3)],
    ['games with a guard rampage (≥ 3 captures)', `${r.degeneracy.guardRampages} (${pct(r.degeneracy.guardRampageShare)})`],
    ['dead-material endings (draw50 + drawMaterial)', `${r.degeneracy.deadMaterial} (${pct(r.degeneracy.deadMaterialShare)})`],
    ['games where a king never moved', `${r.degeneracy.kingNeverMoved} (${pct(r.degeneracy.kingNeverMovedShare)})`],
  ])}

## Interest terms, residualised on draw rate
Each term minus what this run's \`term ~ a + b·drawRate\` line predicts from the arrangement's draw
rate. The mean over the arrangements is 0 by construction, so read differences between pools, never
levels. Overall row, fitted on the ${r.byConfig.length} arrangements:
${table(Object.keys(INTEREST_TERMS), [Object.keys(INTEREST_TERMS).map(k => (r.overall.interestResiduals[k] ?? 0).toFixed(3))])}

## Balance axis — back ranks by |white score − 0.5| (ascending)
${table(GROUP_HEAD, r.mostBalanced.slice(0, 25).map(groupRow))}

## Interest axis — back ranks by interest score (descending)
${table(GROUP_HEAD, r.mostFun.slice(0, 25).map(groupRow))}

---
**Two axes, reported apart.** Balance = |white score − 0.5|; interest = the Browne-fitted sum below.
Never merge them: the research shows the two objectives fight (variant-balance.md §7).

interest = ${Object.entries(INTEREST).map(([k, v]) => `${v >= 0 ? '+' : '−'}${Math.abs(v)}·${k}`).join(' ')}
— Browne's fitted signs (docs/research/variant-balance.md §7). **Lead change is negative**: churn
reads as chaos, not tension. "xDec" = decisiveness minus what |white score − 0.5| predicts for it,
fitted over the configurations of this run; raw decisiveness is never a reward term, because
corr(draw rate, white points) = −0.92 in Chess960.
"gates" lists failed viability gates (balance ${GATES.balance}, timeouts ${GATES.timeouts}, duration ${GATES.durationDeviation}, utilisation ${GATES.fairyUse}, draw-rate worst decile); a gated
arrangement is rejected, not scored down.
"killer", "unc", "drama", "perm" use the squashed lead L = 2·σ(cp/${CP_SCALE}) − 1 (variant-balance.md §3.0).
"capped" games hit the ply cap: their own class, never counted as draws (cutechess counts them as draws).
Survival counts pieces on the board at the end, so a promotion target can exceed 100%.
Statistics follow docs/research/sim-methodology.md §2.
`;
}

export function readRecords(file: string): GameRecord[] {
  return readFileSync(file, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l) as GameRecord);
}

/** Rule toggles of a finished run, from its summary file (the runner writes the whole spec). */
export function runRules(id: string): Partial<Rules> {
  try {
    return (JSON.parse(readFileSync(paths(id).summary, 'utf8')) as { spec?: { rules?: Partial<Rules> } }).spec?.rules ?? {};
  } catch { return {}; }
}

export function writeReport(id: string, file = paths(id).jsonl): Report {
  const report = analyze(id, readRecords(file), runRules(id));
  writeFileSync(`${OUT_DIR}/${id}.report.json`, JSON.stringify(report, null, 2) + '\n');
  writeFileSync(`${OUT_DIR}/${id}.report.md`, toMarkdown(report));
  return report;
}

// ---------------------------------------------------------------------------------------------
// Material regression (docs/SIM-PLAN.md §6; variant-balance.md §3.2 [S1]).

/** Kings are one a side in every game, so that column is always zero; leave it out. */
export const REG_PIECES = 'PNBRQALGMS';

/** Starting material difference, white minus black, over `REG_PIECES`. */
export function materialDelta(rec: GameRecord): number[] {
  const [w, b] = rec.stats;
  return [...REG_PIECES].map(k => (w.start[k] ?? 0) - (b.start[k] ?? 0));
}

/** A resampling unit is one colour-reversed pair (or a lone game): `[designRow, z]` per game. */
export type Unit = [number, number][];

/**
 * Distinct material-difference vectors ("design rows") plus the games grouped into bootstrap
 * units. `z = 2 * result - 1` in {-1, 0, +1}, always from White's side, so the colour-swapped game
 * of a pair lands on the negated design row and needs no folding.
 */
export function design(recs: readonly GameRecord[], unitKey: (r: GameRecord) => string): { rows: number[][]; units: Unit[] } {
  const index = new Map<string, number>(), rows: number[][] = [], units = new Map<string, Unit>();
  for (const r of recs) {
    const d = materialDelta(r), k = d.join(',');
    let i = index.get(k);
    if (i === undefined) { i = rows.length; index.set(k, i); rows.push(d); }
    const u = unitKey(r);
    (units.get(u) ?? units.set(u, []).get(u)!).push([i, 2 * r.result - 1]);
  }
  return { rows, units: [...units.values()] };
}

/**
 * Minimise `mean (z - tanh(w·d + b))^2` by plain gradient descent with momentum, from `w = 0`.
 *
 * Not Adam, on purpose. Our corpus only ever moves two counts together (an arm swaps one knight
 * for one fairy piece), so the design is rank-deficient: `w_A` and `w_N` are identified only
 * through their difference. Gradient descent started at zero never leaves the row space of the
 * design, so it lands on the minimum-norm solution and the identified contrasts are exact;
 * Adam's per-coordinate rescaling breaks that invariance and lets the null space wander.
 * `counts[r]` and `sums[r]` are the game count and the sum of `z` on design row `r`, which is all
 * a squared loss needs: `sum_i (z_i - t)^2 = sum_i z_i^2 - 2 t sum_i z_i + n t^2`.
 */
export function fitTanh(rows: readonly number[][], counts: readonly number[], sums: readonly number[], steps = 3000, lr = 1, mom = 0.9): number[] {
  const k = rows[0]?.length ?? 0;
  const w = new Array<number>(k + 1).fill(0), vel = new Array<number>(k + 1).fill(0), g = new Array<number>(k + 1).fill(0);
  const n = counts.reduce((a, b) => a + b, 0) || 1;
  for (let s = 0; s < steps; s++) {
    g.fill(0);
    for (let r = 0; r < rows.length; r++) {
      if (!counts[r]) continue;
      let u = w[k];
      for (let j = 0; j < k; j++) u += w[j] * rows[r][j];
      const t = Math.tanh(u);
      const c = (-2 * (1 - t * t) * (sums[r] - counts[r] * t)) / n;
      for (let j = 0; j < k; j++) g[j] += c * rows[r][j];
      g[k] += c;
    }
    for (let j = 0; j <= k; j++) { vel[j] = mom * vel[j] - lr * g[j]; w[j] += vel[j]; }
  }
  return w;
}

const accumulate = (rows: readonly number[][], units: readonly Unit[], pick: readonly number[]): [number[], number[]] => {
  const counts = new Array<number>(rows.length).fill(0), sums = new Array<number>(rows.length).fill(0);
  for (const u of pick) for (const [r, z] of units[u]) { counts[r]++; sums[r] += z; }
  return [counts, sums];
};

export interface ValueFit {
  games: number; units: number; designRows: number;
  /** Tanh weight per piece, in the same order as `REG_PIECES`, plus the white-to-move bias. */
  w: number[]; bias: number; pawnWeight: number;
  /** Per fairy letter: value in pawns against a fixed knight, with a bootstrap 95% interval. */
  implied: Record<string, { pawns: number; lo: number; hi: number; identified: boolean }>;
}

/**
 * Implied piece values from every recorded game at once. The corpus only varies material at the
 * *start* of a game, and every value arm swaps one knight for one fairy piece, so what this fit
 * identifies is the contrast `w_X - w_N` per fairy piece and `w_P` from the pawn-odds arm — not
 * `N`, `B`, `R`, `Q` separately, which never differ between the two sides in any game we played.
 * Values are therefore quoted against a knight held at `KNIGHT_V`, exactly like the odds match.
 *
 * What the fit buys over the odds match is the link function: `tanh` saturates the way the score
 * does, so an arm outside Muller's +-1.5 pawn linear band reads as a number instead of a bound.
 * Error bars are a percentile bootstrap over pairs (the pair is the independent unit, not the game).
 */
export function fitValues(recs: readonly GameRecord[], unitKey: (r: GameRecord) => string, knightPawns: number, boots = 200, seed = 7): ValueFit {
  const { rows, units } = design(recs, unitKey);
  const [counts, sums] = accumulate(rows, units, units.map((_, i) => i));
  const w = fitTanh(rows, counts, sums);
  const iP = REG_PIECES.indexOf('P'), iN = REG_PIECES.indexOf('N');
  const pawns = (v: number[], j: number): number => knightPawns + (v[j] - v[iN]) / (v[iP] || 1e-9);

  // A piece is identified only if some game actually started with an imbalance in it.
  const varies = [...REG_PIECES].map((_, j) => rows.some((d, r) => counts[r] > 0 && d[j] !== 0));
  const boot: Record<string, number[]> = {};
  const rng = mulberry32(seed);
  for (let b = 0; b < boots; b++) {
    const pick = Array.from({ length: units.length }, () => Math.floor(rng() * units.length));
    const [c, sm] = accumulate(rows, units, pick);
    const wb = fitTanh(rows, c, sm);
    for (const L of 'ALGMS') (boot[L] ??= []).push(pawns(wb, REG_PIECES.indexOf(L)));
  }
  const pctile = (xs: number[], q: number): number => xs.slice().sort((a, b) => a - b)[Math.min(xs.length - 1, Math.floor(q * xs.length))];
  const implied: ValueFit['implied'] = {};
  for (const L of 'ALGMS') {
    const j = REG_PIECES.indexOf(L);
    implied[L] = { pawns: pawns(w, j), lo: pctile(boot[L], 0.025), hi: pctile(boot[L], 0.975), identified: varies[j] };
  }
  return { games: counts.reduce((a, b) => a + b, 0), units: units.length, designRows: rows.filter((_, r) => counts[r] > 0).length, w, bias: w[w.length - 1], pawnWeight: w[iP], implied };
}

const NAME: Record<string, string> = { A: 'archer', L: 'paladin', G: 'guard', M: 'maester', S: 'beast' };

export function valuesMarkdown(ids: readonly string[], fit: ValueFit, knightPawns: number): string {
  return `# Material regression — implied piece values

\`z = tanh(w·Δcounts + b)\` fitted by least squares to the game result over **${fit.games} games**
(${fit.units} colour-reversed pairs / lone games, ${fit.designRows} distinct starting imbalances) from
\`${ids.join('\`, \`')}\`. Δcounts is the *starting* material difference, white − black; z is +1, 0, −1.
Bootstrap: pairs resampled with replacement, 95% percentile interval.

${table(['piece', 'implied value (pawns)', 'bootstrap 95%'],
  [...'ALGMS'].map(L => [`${L} (${NAME[L]})`, fit.implied[L].identified ? fit.implied[L].pawns.toFixed(2) : 'not identified',
    fit.implied[L].identified ? `${fit.implied[L].lo.toFixed(2)} – ${fit.implied[L].hi.toFixed(2)}` : '—']))}

White-to-move term ${fit.bias >= 0 ? '+' : ''}${fit.bias.toFixed(4)}, pawn weight ${fit.pawnWeight.toFixed(4)} (tanh units).
Every value is quoted against a knight held at ${knightPawns.toFixed(2)} pawns: each arm swaps one knight for one
fairy piece, so the fit identifies \`w_X − w_N\`, and no game we played ever started with a knight,
bishop, rook or queen imbalance, so those four are not separately identified by this corpus.
Games with two identical back ranks carry Δ = 0; they contribute only to the white-to-move term.
`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolvePath(process.argv[1])) {
  const f = parseFlags(process.argv.slice(2));
  if (f.values) {
    const ids = typeof f.ids === 'string'
      ? f.ids.split(',')
      : readdirSync(OUT_DIR).filter(n => n.endsWith('.jsonl')).map(n => n.slice(0, -6)).sort();
    // Only the starting census and the result are needed, so each line is reduced to those and
    // the parsed record is dropped: the whole corpus is ~100 MB of JSONL with every ply in it.
    const recs: GameRecord[] = [];
    const unit = new WeakMap<GameRecord, string>();
    for (const rid of ids) {
      for (const line of readFileSync(paths(rid).jsonl, 'utf8').split('\n')) {
        if (!line) continue;
        const r = JSON.parse(line) as GameRecord;
        const slim = { pairId: r.pairId, result: r.result, stats: [{ start: r.stats[0].start }, { start: r.stats[1].start }] } as unknown as GameRecord;
        unit.set(slim, `${rid}|${r.pairId}`);
        recs.push(slim);
      }
    }
    const fit = fitValues(recs, r => unit.get(r)!, KNIGHT_V / 100, typeof f.boots === 'string' ? +f.boots : 200);
    const md = valuesMarkdown(ids, fit, KNIGHT_V / 100);
    writeFileSync(`${OUT_DIR}/material-fit.md`, md);
    console.log(md);
    console.log(`-> ${OUT_DIR}/material-fit.md`);
  } else {
  const id = typeof f.id === 'string' ? f.id : 'run';
  const report = writeReport(id, typeof f.file === 'string' ? f.file : paths(id).jsonl);
  console.log(`[${id}] ${report.games} games -> ${OUT_DIR}/${id}.report.md + .report.json`);
  if (typeof f.confirm === 'string') {
    const other = analyze(f.confirm, readRecords(paths(f.confirm).jsonl), runRules(f.confirm));
    const rows = confirmDepths(report, other);
    console.log(`[${id}] confirmation against ${f.confirm}: ${rows.filter(r => r.flipped).length}/${rows.length} configurations changed sign`);
    for (const r of rows.slice(0, 20)) console.log(`  ${r.key}  ${r.a.toFixed(3)} -> ${r.b.toFixed(3)}  ${r.flipped ? 'FLIPPED' : ''}`);
  }
  }
}
