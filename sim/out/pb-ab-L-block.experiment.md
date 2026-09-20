# Rule A/B — pb-ab-L-block

`paladinJumpsFriends=false` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-L-block.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.544 | 0.526 | -0.018 ± 0.020 | no |
| decisive | 0.714 | 0.674 | -0.039 ± 0.026 | yes |
| draw rate | 0.274 | 0.313 | +0.038 ± 0.025 | yes |
| capped | 0.012 | 0.013 | +0.001 ± 0.004 | no |
| mean plies | 118.0 | 119.4 | +1.4 ± 2.5 | no |
| branching factor | 32.6 | 31.8 | -0.7 ± 0.4 | yes |
| killer move | 0.325 | 0.330 | +0.004 ± 0.012 | no |
| lead change | 0.064 | 0.079 | +0.015 ± 0.006 | yes |
| uncertainty late | 0.648 | 0.662 | +0.014 ± 0.006 | yes |
| drama | 0.127 | 0.131 | +0.004 ± 0.009 | no |
| permanence | 0.962 | 0.961 | -0.000 ± 0.001 | no |
| min utilisation | 0.45 | 0.45 | +0.00 ± 0.01 | no |
| interest | 0.482 | 0.482 | +0.001 ± 0.004 | no |
| interest (min-use) | 0.482 | 0.482 | -0.001 ± 0.007 | no |
| killerMove (resid.) | -0.008 | 0.008 | +0.016 ± 0.012 | yes |
| leadChange (resid.) | -0.006 | 0.006 | +0.011 ± 0.005 | yes |
| uncertaintyLate (resid.) | -0.004 | 0.004 | +0.009 ± 0.004 | yes |
| drama (resid.) | -0.005 | 0.005 | +0.009 ± 0.008 | yes |
| permanence (resid.) | 0.001 | -0.001 | -0.001 ± 0.001 | yes |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | -0.008 | 0.009 | +0.035 ± 0.008 | yes |
| interest (resid.) | -0.002 | 0.002 | +0.006 ± 0.003 | yes |
| interestMinFairy (resid.) | 0.006 | 0.013 | +0.006 ± 0.006 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 24 (1.5%) | 30 (1.9%) |
| games where a king never moved | 289 (18.1%) | 295 (18.4%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 26.41 | 26.90 | 4.54 | 4.64 | 41.3% | 40.5% |
| M | 16.21 | 16.34 | 1.72 | 1.72 | 36.7% | 36.5% |
| K | 13.26 | 13.90 | 0.93 | 0.99 | 100.0% | 100.0% |
| A | 12.40 | 12.33 | 2.09 | 2.08 | 44.3% | 43.6% |
| R | 11.04 | 11.28 | 1.74 | 1.80 | 40.6% | 42.7% |
| S | 9.85 | 9.96 | 1.25 | 1.31 | 32.9% | 32.7% |
| N | 8.29 | 8.28 | 1.69 | 1.67 | 9.7% | 10.8% |
| Q | 6.30 | 6.22 | 1.02 | 0.96 | 76.5% | 74.9% |
| B | 6.21 | 6.36 | 1.42 | 1.46 | 23.8% | 22.1% |
| L | 4.42 | 4.26 | 1.27 | 1.08 | 6.1% | 17.8% |
| G | 3.63 | 3.61 | 0.00 | 0.00 | 96.7% | 96.3% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.09 | 2.08 |
| beastChainMoves | 0.99 | 1.01 |
| beastChainCaptures | 1.25 | 1.31 |
| maesterSwaps | 7.26 | 7.26 |
| maesterLongSwaps | 0.81 | 0.81 |
| paladinSacrifices | 0.62 | 0.59 |
| promotions | 0.31 | 0.32 |
| checks | 4.27 | 4.38 |
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
