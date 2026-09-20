# archerChecks off under the widened archer — 2026-09-17

The archer now shoots `plusDiagFwd2` and is priced at 5.05 pawns. `archerChecks` (default `true`,
RULES.md §6 decision 2) decides whether an archer may shoot a king. This arm removes that right and
measures what the widening loses. Both arms run the widened, re-priced defaults; the only rule
difference is `archerChecks=false` on the variant side.

Method: `node_modules/.bin/tsx src/sim/run.ts --id pb-ab-A-nochecks --experiment ab --games 1600
--sample 40 --depth 3 --seed 71 --workers 4 --rule "archerChecks=false"`. The depth-3 reading was
consequential (decisive and draws), so a depth-4 arm followed:
`--id pb-ab-A-nochecks-d4 --experiment ab --games 400 --sample 40 --depth 4 --seed 72 --workers 4
--rule "archerChecks=false"`. The arms share arrangements and opening seeds (common random numbers);
the interval is a 95% normal approximation on the mean paired difference over the 40 arrangements.
Tables: `sim/out/pb-ab-A-nochecks.experiment.md`, `sim/out/pb-ab-A-nochecks-d4.experiment.md`.

## Depth 3 (1,600 games per arm, seed 71)

| metric | base (checks on) | checks off | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.561 | 0.560 | -0.001 ± 0.017 | no |
| decisive | 0.792 | 0.774 | **-0.018 ± 0.012** | yes |
| draw rate | 0.198 | 0.216 | **+0.018 ± 0.011** | yes |
| capped | 0.010 | 0.010 | +0.000 ± 0.005 | no |
| mean plies | 110.3 | 115.8 | **+5.5 ± 2.3** | yes |
| interest | 0.483 | 0.487 | +0.004 ± 0.002 | yes (tiny) |
| interest (min-use) | 0.483 | 0.487 | +0.005 ± 0.005 | borderline |

By the reading rule (|difference| > interval on decisive, draws or white score), decisive and draws
are consequential. White score holds (fairness), capped games do not move, and games run 5.5 plies
longer. Interest does not fall; it edges up by +0.004. The degeneracy table agrees with the drawish
shift: dead-material endings (draw50 + drawMaterial) rise 14 (0.9%) to 29 (1.8%), while games where a
king never moved fall 423 (26.4%) to 387 (24.2%).

## Depth 4 (400 games per arm, seed 72)

| metric | base (checks on) | checks off | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.540 | 0.534 | -0.006 ± 0.030 | no |
| decisive | 0.760 | 0.738 | -0.023 ± 0.038 | no |
| draw rate | 0.212 | 0.240 | +0.028 ± 0.041 | no |
| capped | 0.028 | 0.022 | -0.005 ± 0.016 | no |
| mean plies | 117.2 | 121.3 | +4.1 ± 4.4 | no |
| interest | 0.466 | 0.462 | -0.001 ± 0.004 | no |
| interest (min-use) | 0.466 | 0.462 | -0.003 ± 0.012 | no |

Every point estimate repeats the depth-3 direction (less decisive, more draws, longer games,
interest flat), and no interval excludes zero at 400 games. The depth-4 arm confirms the direction,
not the size.

## Check counter

`checks` counts plies that leave a king in check, from any piece (`src/sim/replay.ts:40`). Depth 3:
6,218 checks over 1,600 games (3.89 per game) with checks on, 5,383 (3.36) with checks off — 835
checks removed, 13.4% of all checks. Depth 4: 2,479 (6.20) to 2,189 (5.47), 11.7% removed. The
variant games contain zero archer checks by construction, so the drop is the archer's check
contribution plus second-order play changes. Archer shots do not drop: 3.38 to 3.48 per game at
depth 3, 4.43 to 4.49 at depth 4. The archer shoots as often; it can no longer aim at the king.

## Verdict

The shot set does most of the work. The widening bought decisive +8.2 ± 2.7 points, draws -7.3, and
-7.8 plies at depth 3 (`pb-ab-A-fwd2`; its widened arm reads decisive 0.796 and 110.2 plies against
0.792 and 110.3 in this run's base, so the two controls agree despite the re-price). Removing
checks gives back 1.8 of the 8.2 decisive points — about a fifth — 1.8 of the 7.3 draw points, and
5.5 of the 7.8 plies, about 70% of the tempo gain. The check ability is therefore load-bearing for a
slice of the sharpening and for most of the ply shortening, but it is not the engine of the
widening: without it, games stay clearly more decisive than the pre-widening 0.714 and 118.0 plies,
and interest does not fall. Rule decision 2 stands on identity grounds and on this slice; it is not
what carries the widening's headline number.
