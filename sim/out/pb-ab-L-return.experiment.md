# Rule A/B — pb-ab-L-return

`paladinReturn=true` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-L-return.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.541 | 0.564 | +0.023 ± 0.020 | yes |
| decisive | 0.791 | 0.792 | +0.001 ± 0.019 | no |
| draw rate | 0.204 | 0.205 | +0.001 ± 0.019 | no |
| capped | 0.004 | 0.003 | -0.001 ± 0.002 | no |
| mean plies | 110.8 | 86.5 | -24.3 ± 8.0 | yes |
| branching factor | 32.3 | 32.7 | +0.4 ± 0.4 | yes |
| killer move | 0.345 | 0.270 | -0.075 ± 0.026 | yes |
| lead change | 0.059 | 0.048 | -0.011 ± 0.004 | yes |
| uncertainty late | 0.634 | 0.595 | -0.040 ± 0.013 | yes |
| drama | 0.146 | 0.139 | -0.007 ± 0.009 | no |
| permanence | 0.958 | 0.953 | -0.005 ± 0.002 | yes |
| min utilisation | 0.43 | 0.36 | -0.09 ± 0.03 | yes |
| interest | 0.487 | 0.467 | -0.020 ± 0.007 | yes |
| interest (min-use) | 0.480 | 0.430 | -0.046 ± 0.018 | yes |
| killerMove (resid.) | 0.037 | -0.037 | -0.075 ± 0.026 | yes |
| leadChange (resid.) | 0.005 | -0.005 | -0.011 ± 0.004 | yes |
| uncertaintyLate (resid.) | 0.020 | -0.020 | -0.040 ± 0.013 | yes |
| drama (resid.) | 0.003 | -0.003 | -0.006 ± 0.009 | no |
| permanence (resid.) | 0.003 | -0.003 | -0.005 ± 0.002 | yes |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.002 | 0.001 | +0.001 ± 0.003 | no |
| interest (resid.) | 0.010 | -0.010 | -0.020 ± 0.007 | yes |
| interestMinFairy (resid.) | 0.028 | -0.021 | -0.046 ± 0.018 | yes |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 18 (1.1%) | 89 (5.6%) |
| games where a king never moved | 380 (23.8%) | 677 (42.3%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 23.79 | 15.71 | 3.84 | 2.43 | 40.3% | 43.0% |
| A | 15.17 | 10.20 | 3.57 | 2.34 | 55.0% | 56.4% |
| M | 15.10 | 10.02 | 1.49 | 0.89 | 37.3% | 43.7% |
| K | 11.43 | 9.00 | 0.82 | 0.57 | 100.0% | 100.0% |
| S | 9.51 | 6.52 | 1.22 | 0.78 | 31.9% | 40.0% |
| R | 9.38 | 6.91 | 1.74 | 1.35 | 36.6% | 42.5% |
| N | 7.86 | 5.85 | 1.54 | 1.14 | 11.8% | 24.7% |
| B | 5.83 | 4.26 | 1.35 | 1.02 | 26.7% | 38.4% |
| Q | 5.70 | 3.67 | 0.99 | 0.61 | 74.3% | 74.8% |
| L | 4.18 | 12.45 | 1.16 | 5.40 | 6.7% | 50.5% |
| G | 2.84 | 1.88 | 0.00 | 0.00 | 97.3% | 97.2% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 3.57 | 2.34 |
| beastChainMoves | 0.95 | 0.60 |
| beastChainCaptures | 1.22 | 0.78 |
| maesterSwaps | 6.64 | 4.52 |
| maesterLongSwaps | 0.82 | 0.76 |
| paladinSacrifices | 0.57 | 0.00 |
| promotions | 0.29 | 0.17 |
| checks | 4.25 | 3.23 |
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
