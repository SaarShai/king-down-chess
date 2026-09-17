# Rule A/B — pb-ab-L-nonPawn-d4

`` against the base `paladinKamikaze=always`.
800 games per population, depth 4, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-base24-d4`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.506 | 0.534 | +0.027 ± 0.025 | yes |
| decisive | 0.642 | 0.627 | -0.015 ± 0.036 | no |
| draw rate | 0.333 | 0.350 | +0.018 ± 0.034 | no |
| capped | 0.025 | 0.022 | -0.003 ± 0.005 | no |
| mean plies | 125.5 | 126.4 | +0.8 ± 3.7 | no |
| branching factor | 30.0 | 29.7 | -0.2 ± 0.3 | no |
| killer move | 0.188 | 0.187 | -0.002 ± 0.007 | no |
| lead change | 0.043 | 0.041 | -0.002 ± 0.001 | yes |
| uncertainty late | 0.639 | 0.640 | +0.002 ± 0.004 | no |
| drama | 0.107 | 0.112 | +0.004 ± 0.013 | no |
| permanence | 0.971 | 0.971 | -0.000 ± 0.001 | no |
| min utilisation | 0.42 | 0.41 | -0.01 ± 0.01 | no |
| interest | 0.455 | 0.458 | +0.001 ± 0.003 | no |
| interest (min-use) | 0.417 | 0.458 | +0.010 ± 0.006 | yes |
| killerMove (resid.) | -0.000 | 0.000 | +0.000 ± 0.009 | no |
| leadChange (resid.) | 0.002 | -0.002 | -0.003 ± 0.002 | yes |
| uncertaintyLate (resid.) | 0.000 | -0.000 | -0.000 ± 0.003 | no |
| drama (resid.) | -0.004 | 0.004 | +0.007 ± 0.009 | no |
| permanence (resid.) | 0.000 | -0.000 | -0.000 ± 0.001 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | -0.009 | 0.046 | +0.017 ± 0.014 | yes |
| interest (resid.) | -0.001 | 0.003 | +0.002 ± 0.002 | yes |
| interestMinFairy (resid.) | -0.016 | 0.027 | +0.013 ± 0.008 | yes |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 36 (4.5%) | 39 (4.9%) |
| games where a king never moved | 146 (18.3%) | 140 (17.5%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 26.25 | 25.94 | 4.81 | 4.62 | 32.8% | 32.2% |
| K | 18.48 | 18.77 | 1.49 | 1.50 | 100.0% | 100.0% |
| A | 16.80 | 17.44 | 2.94 | 2.95 | 42.6% | 43.6% |
| R | 11.95 | 12.03 | 2.01 | 2.03 | 33.8% | 36.7% |
| M | 11.79 | 11.72 | 1.49 | 1.46 | 32.7% | 31.2% |
| S | 11.06 | 11.32 | 1.41 | 1.39 | 37.8% | 37.3% |
| N | 8.22 | 8.28 | 1.80 | 1.77 | 10.1% | 11.0% |
| Q | 7.35 | 6.43 | 1.25 | 1.17 | 45.4% | 41.4% |
| B | 7.02 | 6.91 | 1.66 | 1.62 | 20.3% | 20.7% |
| G | 4.24 | 4.42 | 0.00 | 0.00 | 91.5% | 91.3% |
| L | 2.38 | 3.12 | 0.53 | 1.03 | 8.2% | 6.2% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.94 | 2.95 |
| beastChainMoves | 1.20 | 1.18 |
| beastChainCaptures | 1.41 | 1.39 |
| maesterSwaps | 4.60 | 4.68 |
| maesterLongSwaps | 0.57 | 0.54 |
| paladinSacrifices | 0.53 | 0.48 |
| promotions | 0.15 | 0.16 |
| checks | 7.93 | 7.73 |

The pooled columns describe each whole population; the difference column is the mean over the
40 shared arrangements of (rule − base) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
