import type { GameRecord } from './game';
import type { Rules } from '../rules/rules';
import { WHITE, moverAt } from '../rules/engine';
import { CP_CLAMP, CP_SCALE, DEAD_BAND, DECISION_CP, UNSURE } from './weights';

const mean = (xs: readonly number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

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
 * Use the recorded player (`by`). For old records without it, infer the player with `moverAt`.
 * The rules come from the record, then the caller (the run summary, via `group`), then defaults.
 */
export function leadMetrics(rec: GameRecord, rules: Partial<Rules> = rec.rules ?? {}): Lead {
  const idx: number[] = [], lead: number[] = [];
  const cost: [number, number] = [0, 0];
  rec.moves.forEach((m, i) => {
    if (m.gap !== undefined) cost[m.by ?? moverAt(i, rules)] += Math.log2(1 + Math.exp(-m.gap / DECISION_CP));
    if (m.cp === undefined) return;
    idx.push(i);
    lead.push(2 / (1 + Math.exp(-Math.max(-CP_CLAMP, Math.min(CP_CLAMP, m.cp)) / CP_SCALE)) - 1);
  });
  const T = lead.length;
  const z = rec.result === 1 ? 1 : rec.result === 0 ? -1 : 0;
  const empty: Lead = { killerMove: 0, leadChange: 0, uncertaintyLate: 0.5, permanence: 1, drama: 0, decisionCost: cost, decisionAsymmetry: cost[1] - cost[0] };
  if (T < 2) return empty;

  // Killer move: the largest single swing in the mover's own favour.
  let killer = 0, changes = 0, jerk = 0, dramaSum = 0, dramaN = 0;
  for (let i = 1; i < T; i++) {
    const d = lead[i] - lead[i - 1];
    killer = Math.max(killer, ((rec.moves[idx[i]].by ?? moverAt(idx[i], rules)) === WHITE ? 1 : -1) * d);
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
