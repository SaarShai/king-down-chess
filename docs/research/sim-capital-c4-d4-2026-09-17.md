# Capital C4, pawn-only: depth-4 confirmation at 1,600 games (2026-09-17)

`docs/research/sim-capital-c4-2026-09-17.md` measured the lab rule `pawnCapitalCapture` (a pawn
standing in the capital d4 e4 d5 e5 may capture the square straight ahead) at depth 3, called the
outcome metrics null, confirmed the interest-axis moves, and named a depth-4 confirmation as the way
to settle the decisive/draw direction "if the rule is ever shortlisted". This report runs that
confirmation: 1,600 games per arm at depth 4, new seed, same 40 arrangements and common random
numbers.

## Measurement

    node_modules/.bin/tsx src/sim/run.ts --id pb-ab-cap-pawn-d4b --experiment ab --games 1600 \
    --sample 40 --depth 4 --seed 72 --workers 4 --rule "pawnCapitalCapture=true"

Control arm `pb-ab-cap-pawn-d4b.base` with `rules {}` (today's defaults); 1,600 games per population,
depth 4, seed 72, the same 40 arrangements and the same opening seeds in both (common random
numbers). The difference column is the mean of (rule − base) over the 40 shared arrangements with a
95% normal interval. Raw table: `sim/out/pb-ab-cap-pawn-d4b.experiment.md`. Depth-3 comparator
(seed 71, depth 3, also 1,600 games per arm): `sim/out/pb-ab-cap-pawn.experiment.md`.

## Depth-3 context (seed 71, depth 3, 1,600 games per arm)

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.561 | 0.543 | −0.018 ± 0.034 | no |
| decisive | 0.792 | 0.816 | +0.024 ± 0.030 | no |
| draw rate | 0.198 | 0.179 | −0.019 ± 0.030 | no |
| capped | 0.010 | 0.006 | −0.004 ± 0.005 | no |
| mean plies | 110.3 | 112.3 | +2.0 ± 3.3 | no |
| killer move | 0.331 | 0.355 | +0.023 ± 0.014 | yes |
| drama | 0.145 | 0.160 | +0.015 ± 0.009 | yes |
| interest | 0.483 | 0.490 | +0.007 ± 0.004 | yes |
| interest (min-use) | 0.483 | 0.486 | +0.006 ± 0.008 | no |
| excessDecisiveness (resid.) | 0.010 | −0.009 | −0.020 ± 0.005 | yes |
| min utilisation | 0.43 | 0.43 | +0.01 ± 0.01 | yes |
| permanence | 0.959 | 0.958 | −0.001 ± 0.001 | yes |

## Depth-4 result (seed 72, depth 4, 1,600 games per arm)

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.541 | 0.539 | −0.002 ± 0.022 | no |
| decisive | 0.756 | 0.739 | −0.018 ± 0.031 | no |
| draw rate | 0.227 | 0.246 | +0.019 ± 0.032 | no |
| capped | 0.017 | 0.015 | −0.002 ± 0.013 | no |
| mean plies | 116.3 | 113.8 | −2.6 ± 3.7 | no |
| killer move | 0.223 | 0.218 | −0.005 ± 0.012 | no |
| drama | 0.145 | 0.134 | −0.011 ± 0.011 | yes |
| interest | 0.464 | 0.462 | −0.002 ± 0.004 | no |
| interest (min-use) | 0.464 | 0.451 | −0.001 ± 0.013 | no |
| excessDecisiveness (resid.) | −0.002 | +0.013 | +0.019 ± 0.013 | yes |
| min utilisation | 0.38 | 0.40 | +0.02 ± 0.01 | yes |
| permanence | 0.967 | 0.967 | +0.000 ± 0.001 | no |

## Do the depth-3 directions hold at depth 4?

| metric | depth-3 difference ±95% | depth-4 difference ±95% | direction holds? |
|---|---|---|---|
| decisive | +0.024 ± 0.030 | −0.018 ± 0.031 | no: reverses |
| draw rate | −0.019 ± 0.030 | +0.019 ± 0.032 | no: reverses |
| drama | +0.015 ± 0.009 | −0.011 ± 0.011 | no: reverses |
| killer move | +0.023 ± 0.014 | −0.005 ± 0.012 | no: reverses to flat |
| white score | −0.018 ± 0.034 | −0.002 ± 0.022 | sign kept, null in both |
| mean plies | +2.0 ± 3.3 | −2.6 ± 3.7 | no: reverses |
| interest | +0.007 ± 0.004 | −0.002 ± 0.004 | no: reverses |
| interest (min-use) | +0.006 ± 0.008 | −0.001 ± 0.013 | no: reverses |
| excessDecisiveness (resid.) | −0.020 ± 0.005 | +0.019 ± 0.013 | no: reverses |
| min utilisation | +0.01 ± 0.01 | +0.02 ± 0.01 | yes |
| permanence | −0.001 ± 0.001 | +0.000 ± 0.001 | no |

No. All four of the depth-3 directions reverse at depth 4: decisive +0.024 ± 0.030 → −0.018 ± 0.031,
draw rate −0.019 ± 0.030 → +0.019 ± 0.032, killer move +0.023 ± 0.014 → −0.005 ± 0.012, drama
+0.015 ± 0.009 → −0.011 ± 0.011. The interest reading reverses with them: interest +0.007 ± 0.004 →
−0.002 ± 0.004, and the residualised excess decisiveness −0.020 ± 0.005 → +0.019 ± 0.013. The only
depth-3 row that keeps both its sign and its exclusion of zero is min utilisation (+0.01 ± 0.01 →
+0.02 ± 0.01), a usage diagnostic, not an outcome.

## Is the effect large enough to matter?

No at this sample, and the run excludes the depth-3 effect sizes. Every deciding metric's depth-4
interval contains 0: decisive [−0.049, +0.013], draw rate [−0.013, +0.051], white score [−0.024,
+0.020]. At 95%, the depth-4 run admits a true decisive gain of at most +0.013 and a true draw
reduction of at most 0.013 — below the depth-3 point estimates (+0.024 decisive, −0.019 draws),
which lie outside these intervals. The two point estimates straddle zero and differ by 0.042; their
intervals overlap only in [−0.006, +0.013], and the equal-weight average of the two runs is +0.003.

The pooled baselines move with depth, which is why the paired column carries the verdict: the
depth-4 control arm is less decisive (0.756 vs 0.792) and draws more (0.227 vs 0.198) than the
depth-3 control, and the variant follows (0.739 decisive, 0.246 draws). A deeper search defends the
extra decisive tries better.

## The rule still bites at depth 4

The rule is not a dead toggle: counting each straight capital pawn capture by LAN shape (both
colours, all eight from-to pairs; the same count reproduces the depth-3 report's 792 captures in 686
games) finds **652 straight captures in 564 of 1,600 games (35.3%), 0.41 per game**, against 792 in
686 games (42.9%), 0.50 per game, at depth 3 — about 18% fewer in both captures and games. Pawn
captures rise 3.59 → 3.97 per game (5,740 → 6,352 over the arms), against 3.84 → 4.25 (6,146 →
6,806) at depth 3. Straight captures are 10.3% of the depth-4 variant arm's pawn captures (652 of
6,352), against 11.6% (792 of 6,806) at depth 3. The base arms have 0 straight captures in 1,600
games each.

Safety rows stay clean at depth 4: guard captures 0.000 in both arms and no guard rampage; capped
1.7% base vs 1.5% rule (depth 3: 1.0% vs 0.6%); dead-material endings 71 (4.4%) vs 63 (3.9%);
games where a king never moved 409 (25.6%) vs 430 (26.9%).

## Verdict

The depth-3 outcome directions do not hold at depth 4. The rule still bites in 35.3% of games
(652 straight captures, 0.41 per game), but with the deeper search the decisive effect reverses to
−0.018 ± 0.031, the draw effect reverses to +0.019 ± 0.032, killer move falls flat at −0.005 ± 0.012,
and drama turns negative at −0.011 ± 0.011 — the one significant play metric at depth 4, in the
opposite direction to the depth-3 claim. The effect is not large enough to matter: every deciding
interval contains 0 and bounds any true decisive gain to at most +0.013, while the significant rows,
drama and the residualised excess decisiveness, do not establish a benefit. The depth-3 point
estimates for decisive and draws lie outside the depth-4 intervals, so the two runs disagree in
sign; with the depth-4 run the better-powered of the two, `pawnCapitalCapture` stays off.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
