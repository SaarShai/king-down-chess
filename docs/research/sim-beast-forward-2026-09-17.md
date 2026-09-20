# `beastCaptureForward` — depth-4 confirmation and use counters (2026-09-17)

## Method

The depth-3 sweep (`pb-ab-S-fwd`) played `beastCaptureForward=true` against today's defaults:
1,600 self-play games per population, depth 3, seed 71, 40 arrangements, common random numbers
(`sim/out/pb-ab-S-fwd.experiment.md`). It read mean plies **−10.7 ± 3.5** (the only significant
effect) and no balance change (decisive +0.018 ± 0.021, draws −0.019 ± 0.021, white score
+0.008 ± 0.025).

The depth-4 confirmation (`pb-ab-S-fwd-d4`) repeats the same two populations under the same rule,
the same 40 arrangements and common random numbers, at depth 4, seed 72, 400 games per population
(`sim/out/pb-ab-S-fwd-d4.experiment.md`).

The pre-set gate for the larger 1,600/arm arm (`pb-ab-S-fwd-d4b`) was that the depth-4 mean-plies
interval still excludes zero while decisive, draws and white score stay inside theirs. **The gate
failed**: mean plies reads −1.7 ± 7.2. `pb-ab-S-fwd-d4b` was not run.

## Depth 4 (400 games per population, depth 4, seed 72)

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.535 | 0.546 | +0.011 ± 0.058 | no |
| decisive | 0.750 | 0.762 | +0.012 ± 0.039 | no |
| draw rate | 0.233 | 0.212 | -0.020 ± 0.038 | no |
| capped | 0.018 | 0.025 | +0.008 ± 0.022 | no |
| mean plies | 113.9 | 112.2 | -1.7 ± 7.2 | no |
| branching factor | 30.5 | 30.6 | +0.1 ± 0.4 | no |
| killer move | 0.214 | 0.233 | +0.019 ± 0.022 | no |
| lead change | 0.037 | 0.039 | +0.002 ± 0.006 | no |
| uncertainty late | 0.618 | 0.619 | +0.001 ± 0.005 | no |
| drama | 0.138 | 0.130 | -0.008 ± 0.017 | no |
| permanence | 0.966 | 0.965 | -0.002 ± 0.002 | no |
| min utilisation | 0.39 | 0.38 | -0.00 ± 0.02 | no |
| interest | 0.462 | 0.465 | +0.003 ± 0.005 | no |
| interest (min-use) | 0.460 | 0.465 | +0.009 ± 0.014 | no |
| killerMove (resid.) | -0.010 | 0.010 | +0.019 ± 0.022 | no |
| leadChange (resid.) | -0.001 | 0.001 | +0.003 ± 0.006 | no |
| uncertaintyLate (resid.) | -0.002 | 0.002 | +0.004 ± 0.005 | no |
| drama (resid.) | 0.006 | -0.006 | -0.011 ± 0.015 | no |
| permanence (resid.) | 0.001 | -0.001 | -0.001 ± 0.002 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.021 | 0.018 | -0.019 ± 0.021 | no |
| interest (resid.) | 0.000 | 0.002 | +0.001 ± 0.005 | no |
| interestMinFairy (resid.) | 0.024 | 0.027 | +0.006 ± 0.014 | no |

Degeneracy counters: guard captures 0.000/0.000; guard rampages 0/0; dead-material endings 15
(3.8%) base vs 12 (3.0%) rule; kings never moved 114 (28.5%) vs 125 (31.3%).

The depth-4 point estimate keeps the depth-3 sign but the interval covers zero, so the pace effect
is **not confirmed**. The decision metrics side by side:

| metric (paired, rule − base) | depth 3, 1,600/arm | depth 4, 400/arm |
|---|---|---|
| decisive | +0.018 ± 0.021 | +0.012 ± 0.039 |
| draw rate | -0.019 ± 0.021 | -0.020 ± 0.038 |
| white score | +0.008 ± 0.025 | +0.011 ± 0.058 |
| mean plies | **-10.7 ± 3.5** | -1.7 ± 7.2 |
| interest (min-use) | +0.002 ± 0.007 | +0.009 ± 0.014 |

## Use counters

Counted from the stored depth-3 games (`sim/out/pb-ab-S-fwd.base.jsonl`, `.var.jsonl`; 1,600 games
per arm) by parsing each beast move's LAN. A straight-ahead capture step is a capture whose file
letter does not change and whose rank step is in the mover's forward direction (white +1, black −1;
mover colour from the ply and the run's `secondPlayerDoubleFirstTurn`). A chain `Sd4xe5xf6` is read
step by step. The control arm returns exactly zero, which is the parser's sanity check: the blind
spot was real.

| counter (depth 3, per game) | base | with the rule |
|---|---|---|
| beast capture steps | 1.221 | 1.839 |
| forward straight-ahead capture steps | 0.000 (0 of 1,600 games) | 0.483 ± 0.041 (504 of 1,600 = 31.5% of games) |
| — as the first capture of the move | 0.000 | 0.361 |
| — inside a chain | 0.000 | 0.278 |

Depth-4 check with the same parser (400 games per arm): base 0.000 (0 of 400 games), rule
0.393 ± 0.073 per game, at least one in 27.0% of games.

The new capture is 26.3% of the rule arm's beast capture steps at depth 3 (0.483/1.839) and 31.3%
at depth 4 (0.393/1.255). The rule is used in roughly a third of games at both depths, so the
depth-4 negative is about the effect of the capture, not about a dead rule.

## Verdict

**Reject on current evidence; keep `beastCaptureForward=false`.** The only significant depth-3
effect — shorter games — fails its depth-4 confirmation: −10.7 ± 3.5 plies at depth 3 against
−1.7 ± 7.2 at depth 4, an interval that covers zero and cannot exclude the depth-3 value. The sign
is not contradicted, but the effect is not reproduced at this sample. Balance never moves at either
depth: decisive, draws and white score include zero in both runs (depth 4: +0.012 ± 0.039,
−0.020 ± 0.038, +0.011 ± 0.058). Interest (min-use) likewise stays inside its interval both times
(+0.002 ± 0.007 and +0.009 ± 0.014). The counters show the rule fires (0.483 captures a game at
depth 3, 0.393 at depth 4; base exactly zero in 2,000 control games), so the null is not a dead
lever. The pre-registered gate for the larger 1,600/arm `d4b` arm was not met, so it was not run;
the pace question is left open at ±7.2 plies, and `pb-ab-S-fwd-d4b` is the next step if the pace
lever is wanted later.
