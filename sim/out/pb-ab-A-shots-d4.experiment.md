# Rule A/B — pb-ab-A-shots-d4

`archerShots=plusDiag2` against today's defaults.
400 games per population, depth 4, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-A-shots-d4.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.505 | 0.566 | +0.061 ± 0.046 | yes |
| decisive | 0.670 | 0.733 | +0.063 ± 0.056 | yes |
| draw rate | 0.297 | 0.247 | -0.050 ± 0.057 | no |
| capped | 0.033 | 0.020 | -0.013 ± 0.022 | no |
| mean plies | 125.3 | 115.2 | -10.2 ± 7.2 | yes |
| branching factor | 30.6 | 30.4 | -0.2 ± 0.4 | no |
| killer move | 0.213 | 0.209 | -0.004 ± 0.022 | no |
| lead change | 0.039 | 0.039 | +0.001 ± 0.007 | no |
| uncertainty late | 0.631 | 0.617 | -0.014 ± 0.007 | yes |
| drama | 0.111 | 0.130 | +0.019 ± 0.017 | yes |
| permanence | 0.969 | 0.967 | -0.002 ± 0.002 | yes |
| min utilisation | 0.41 | 0.39 | -0.02 ± 0.02 | yes |
| interest | 0.460 | 0.458 | -0.001 ± 0.008 | no |
| interest (min-use) | 0.460 | 0.458 | -0.012 ± 0.015 | no |
| killerMove (resid.) | 0.004 | -0.004 | -0.009 ± 0.020 | no |
| leadChange (resid.) | -0.001 | 0.001 | +0.002 ± 0.007 | no |
| uncertaintyLate (resid.) | 0.005 | -0.005 | -0.010 ± 0.006 | yes |
| drama (resid.) | -0.004 | 0.004 | +0.009 ± 0.012 | no |
| permanence (resid.) | 0.001 | -0.001 | -0.001 ± 0.001 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.037 | -0.038 | -0.045 ± 0.023 | yes |
| interest (resid.) | 0.003 | -0.003 | -0.005 ± 0.005 | yes |
| interestMinFairy (resid.) | 0.032 | 0.024 | -0.018 ± 0.013 | yes |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 13 (3.3%) | 19 (4.8%) |
| games where a king never moved | 62 (15.5%) | 90 (22.5%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 25.71 | 22.45 | 4.54 | 3.56 | 34.2% | 35.3% |
| K | 18.00 | 16.36 | 1.56 | 1.36 | 100.0% | 100.0% |
| A | 17.73 | 17.56 | 3.05 | 4.35 | 44.6% | 45.2% |
| M | 14.43 | 12.87 | 1.71 | 1.46 | 30.7% | 39.2% |
| S | 10.62 | 9.77 | 1.25 | 1.12 | 37.4% | 41.4% |
| R | 10.04 | 9.05 | 1.60 | 1.50 | 34.4% | 35.3% |
| N | 9.13 | 8.41 | 1.83 | 1.77 | 8.7% | 10.4% |
| B | 6.31 | 6.28 | 1.70 | 1.63 | 16.4% | 20.3% |
| Q | 5.08 | 4.70 | 0.86 | 0.81 | 53.2% | 48.6% |
| G | 4.18 | 4.01 | 0.00 | 0.00 | 90.3% | 92.1% |
| L | 4.08 | 3.71 | 1.28 | 1.21 | 5.3% | 8.3% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 3.05 | 4.35 |
| beastChainMoves | 1.04 | 0.94 |
| beastChainCaptures | 1.25 | 1.12 |
| maesterSwaps | 5.76 | 5.04 |
| maesterLongSwaps | 0.83 | 0.93 |
| paladinSacrifices | 0.55 | 0.57 |
| promotions | 0.17 | 0.12 |
| checks | 7.92 | 6.55 |
| ogreShoves | 0.00 | 0.00 |
| ogreShovesFriend | 0.00 | 0.00 |
| ogreShovesGuard | 0.00 | 0.00 |
| catapultChecks | 0.00 | 0.00 |

The pooled columns describe each whole population; the difference column is the mean over the
40 shared arrangements of (rule − base) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
