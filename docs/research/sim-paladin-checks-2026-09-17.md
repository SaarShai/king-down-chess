# paladinChecks on: paired 1,600-game A/B under current rules (2026-09-17)

`paladinChecks` (default `false`, `src/rules/rules.ts:301`) lets a paladin attack the king: with
the flag on the paladin gives check and mate (`src/rules/engine.ts:190`) and counts as mating
material (`src/rules/engine.ts:714`). The 2026-09-17 balance pass re-priced the paladin to 4.08
pawns (`PALADIN_V = 408`, `src/ai/eval.ts:68`), but no A/B has measured the flag under those rules.
This run turns it on for both sides at once and compares populations.

## Method

- Exact command, from the repo root on 4 workers:
  `node_modules/.bin/tsx src/sim/run.ts --id pb-ab-L-checks --experiment ab --games 1600 --sample 40 --depth 3 --seed 71 --workers 4 --rule "paladinChecks=true"`.
  Base arm: today's defaults (`paladinChecks=false`). 1,600 games per population, depth 3, ply cap
  300, 40 sampled back-rank arrangements, seed 71, common random numbers — the same 40 arrangements
  and the same opening seeds in both arms.
- A symmetric rule changes both sides, so there is no match to run and no SPRT. The report is a
  paired two-population comparison: the third column is the mean of the 40 arrangement-level
  (rule − base) differences, with a 95% normal-approximation interval. Read "significant" as "worth
  a second run", not as a test.
- Pre-registered trigger: consequential if |paired difference| > its interval on decisive, draws or
  white score. None of the three cleared it (table below), so the depth-4 arm was not run.
- Cost: base 1,600 games in 12m10s (2.2 games/s), rule arm 1,600 games in 11m50s (2.3 games/s),
  about 24 minutes total. Outputs: `sim/out/pb-ab-L-checks.experiment.md`,
  `sim/out/pb-ab-L-checks.base.jsonl`, `sim/out/pb-ab-L-checks.var.jsonl` and the two
  `.summary.json` files.

## Paired result

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.561 | 0.562 | +0.001 ± 0.015 | no |
| decisive | 0.792 | 0.797 | +0.006 ± 0.012 | no |
| draw rate | 0.198 | 0.193 | -0.006 ± 0.012 | no |
| capped | 0.010 | 0.010 | +0.000 ± 0.003 | no |
| mean plies | 110.3 | 107.5 | -2.8 ± 1.8 | yes |
| branching factor | 32.7 | 32.6 | -0.1 ± 0.2 | no |
| killer move | 0.331 | 0.330 | -0.002 ± 0.007 | no |
| lead change | 0.059 | 0.059 | +0.000 ± 0.002 | no |
| uncertainty late | 0.631 | 0.629 | -0.002 ± 0.002 | no |
| drama | 0.145 | 0.143 | -0.002 ± 0.006 | no |
| permanence | 0.959 | 0.958 | -0.000 ± 0.000 | no |
| min utilisation | 0.43 | 0.43 | +0.00 ± 0.00 | no |
| interest | 0.483 | 0.483 | -0.001 ± 0.002 | no |
| interest (min-use) | 0.483 | 0.475 | -0.001 ± 0.006 | no |
| killerMove (resid.) | 0.002 | -0.002 | -0.004 ± 0.008 | no |
| leadChange (resid.) | -0.000 | 0.000 | +0.000 ± 0.002 | no |
| uncertaintyLate (resid.) | 0.001 | -0.001 | -0.001 ± 0.001 | no |
| drama (resid.) | 0.001 | -0.001 | -0.003 ± 0.005 | no |
| permanence (resid.) | 0.000 | -0.000 | -0.000 ± 0.001 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.003 | 0.000 | -0.006 ± 0.004 | yes |
| interest (resid.) | 0.001 | -0.001 | -0.002 ± 0.002 | no |
| interestMinFairy (resid.) | 0.013 | 0.004 | -0.002 ± 0.006 | no |

Supporting pooled counters (whole populations, both colours; not paired):

| reading | base | with the rule |
|---|---|---|
| checks per game | 3.89 | 3.99 |
| paladin sacrifices per game | 0.60 | 0.57 |
| paladin moves per game | 4.34 | 4.14 |
| paladin survival | 7.1% | 9.6% |
| games where a king never moved | 423 (26.4%) | 455 (28.4%) |
| dead-material endings (draw50 + drawMaterial) | 14 (0.9%) | 10 (0.6%) |
| guard captures per game | 0.000 | 0.000 |

The pooled columns describe each whole population; the difference column is the mean over the 40
shared arrangements of (rule − base) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

## Verdict

**The flag is inert on outcomes at this sample: it neither sharpens games nor costs fairness.**
Decisive share 79.2% → 79.7% (+0.6 ± 1.2 points), draw rate 19.8% → 19.3% (−0.6 ± 1.2 points) and
white score 56.1% → 56.2% (+0.1 ± 1.5 points). Every point estimate is at most half its interval,
and the half-widths (1.2–1.5 points) would have shown a true shift of that size. Fairness
specifically: white score moves +0.1 points with an interval of ±1.5, so no first-move advantage
from paladin checks is measurable here. The interestingness read is flat too: interest
0.483 → 0.483 (−0.001 ± 0.002), interest (min-use) 0.483 → 0.475 (−0.001 ± 0.006).

**One paired metric moved: mean plies 110.3 → 107.5 (−2.8 ± 1.8), about 2.5% shorter games.**
Games end sooner with the flag on, but they do not end more decisively (+0.6 ± 1.2 points), so the
shortened games do not turn into extra wins or losses beyond noise. The mechanics counters agree
that the ability is rarely the deciding device at depth 3: total checks per game rise only
3.89 → 3.99 (+0.10) and paladin sacrifices per game fall 0.60 → 0.57. The only other flagged row is
the excessDecisiveness residual — decisive share above the level predicted by the score distance:
0.003 → 0.000 (−0.006 ± 0.004) — a diagnostic among 18 residual metrics, not an outcome.

**Reading.** Turning the flag on shortens games slightly without changing their results or the
first-move balance. The pre-registered trigger did not fire, so no depth-4 arm was run; if one is
wanted later, the −2.8-ply shift is its justification, not decisive share, draws or fairness. The
shipped default (`false`) is not contradicted by this measurement.

Data: `sim/out/pb-ab-L-checks.experiment.md`, `sim/out/pb-ab-L-checks.base.jsonl`,
`sim/out/pb-ab-L-checks.var.jsonl`, `sim/out/pb-ab-L-checks.base.summary.json`,
`sim/out/pb-ab-L-checks.var.summary.json`.
