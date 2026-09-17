/**
 * Interest-score weights. These are **Browne's fitted signs and relative magnitudes** (best-17 fit
 * against human rankings of 79 games), renormalised over the criteria we compute, plus one term of
 * our own — see docs/research/variant-balance.md §7 and docs/SIM-PLAN.md §5.
 *
 * Do not refit these on our own simulation output. Browne's 0.82 correlation was fitted and scored
 * on the same games and fell to 0.65 held out. Refit only against human rankings of arrangements.
 *
 * Two signs matter more than the numbers: **lead change is negative** (churn reads as chaos, not
 * tension) and uncertainty-late dominates the ablation (48.8 % error increase when removed).
 */
/**
 * `fairyUse` was the **minimum** over the fairy types, as SIM-PLAN §4 wrote it. The data-mining
 * pass (docs/research/sim-mining-2026-09-13.md) showed a minimum is the wrong statistic here: one
 * inert beast pins the term for the whole arrangement (corr −0.77 with beast count), which drowns
 * every other difference. It is now the **mean** over the fairy types that start on the board.
 * Reports print the old minimum-based score beside the new one so the two stay comparable.
 */
export const INTEREST: Record<string, number> = {
  killerMove: 0.20,
  leadChange: -0.16,
  uncertaintyLate: 0.13,
  drama: 0.12,
  permanence: 0.07,
  fairyUse: 0.20,
  excessDecisiveness: 0.12,
};

/** Centipawn scale of the logistic lead signal `p = 1/(1 + exp(-cp/CP_SCALE))` (expect 300-400). */
export const CP_SCALE = 350;

/** Decision cost (Barthelemy): `sum_t log2(1 + exp(-gap_t / DECISION_CP))`, gap in cp. */
export const DECISION_CP = 10;

/** Gates (reject, do not score). docs/research/variant-balance.md §7 stage 1. */
export const GATES = {
  /** |white score - 0.5|; about +-21 Elo. */
  balance: 0.03,
  /** Share of games that hit the ply cap. */
  timeouts: 0.05,
  /** |T_pref - T| / T_pref with T_pref = half the ply cap. */
  durationDeviation: 0.5,
  /** Lowest utilisation over the piece types that start on the board. */
  fairyUse: 0.25,
};

/**
 * Legacy `funScore` weights, kept so old reports still parse. The two-axis report (balance and
 * interest) replaces them; see `INTEREST`.
 */
export const WEIGHTS = { decisiveness: 0.4, leadChanges: 0.35, uncertainty: 0.25 };

/** Lead changes per game treated as "maximally dramatic"; the term is capped at 1 here. */
export const LEAD_CHANGE_SCALE = 4;

/** Eval trajectory thresholds, in centipawns. */
export const DEAD_BAND = 50;   // |eval| below this does not establish a leader
export const UNSURE = 100;     // |eval| below this still counts as "undecided"
export const CP_CLAMP = 1000;  // mate scores are clamped before volatility / lead changes
