# Rule A/B — pb-ab-A-ring2

`archerShots=ring2` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-A-ring2.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.544 | 0.531 | -0.013 ± 0.022 | no |
| decisive | 0.714 | 0.791 | +0.077 ± 0.026 | yes |
| draw rate | 0.274 | 0.198 | -0.076 ± 0.026 | yes |
| capped | 0.012 | 0.011 | -0.001 ± 0.006 | no |
| mean plies | 118.0 | 100.9 | -17.1 ± 4.6 | yes |
| branching factor | 32.6 | 33.2 | +0.6 ± 0.3 | yes |
| killer move | 0.325 | 0.298 | -0.028 ± 0.012 | yes |
| lead change | 0.064 | 0.061 | -0.003 ± 0.003 | no |
| uncertainty late | 0.648 | 0.629 | -0.019 ± 0.006 | yes |
| drama | 0.127 | 0.147 | +0.020 ± 0.008 | yes |
| permanence | 0.962 | 0.957 | -0.004 ± 0.001 | yes |
| min utilisation | 0.45 | 0.43 | -0.02 ± 0.01 | yes |
| interest | 0.482 | 0.477 | -0.005 ± 0.004 | yes |
| interest (min-use) | 0.482 | 0.477 | -0.007 ± 0.008 | no |
| killerMove (resid.) | 0.016 | -0.016 | -0.031 ± 0.012 | yes |
| leadChange (resid.) | -0.002 | 0.002 | +0.004 ± 0.003 | yes |
| uncertaintyLate (resid.) | 0.003 | -0.003 | -0.005 ± 0.004 | yes |
| drama (resid.) | -0.004 | 0.004 | +0.009 ± 0.006 | yes |
| permanence (resid.) | 0.001 | -0.001 | -0.002 ± 0.001 | yes |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.039 | -0.021 | -0.060 ± 0.010 | yes |
| interest (resid.) | 0.006 | -0.005 | -0.010 ± 0.003 | yes |
| interestMinFairy (resid.) | 0.016 | 0.004 | -0.013 ± 0.008 | yes |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 24 (1.5%) | 17 (1.1%) |
| games where a king never moved | 289 (18.1%) | 514 (32.1%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 26.41 | 21.67 | 4.54 | 3.33 | 41.3% | 46.7% |
| M | 16.21 | 15.06 | 1.72 | 1.22 | 36.7% | 48.7% |
| K | 13.26 | 10.57 | 0.93 | 0.65 | 100.0% | 100.0% |
| A | 12.40 | 11.35 | 2.09 | 3.74 | 44.3% | 56.7% |
| R | 11.04 | 9.34 | 1.74 | 1.46 | 40.6% | 44.0% |
| S | 9.85 | 8.83 | 1.25 | 0.97 | 32.9% | 40.4% |
| N | 8.29 | 7.32 | 1.69 | 1.35 | 9.7% | 17.7% |
| Q | 6.30 | 5.39 | 1.02 | 0.79 | 76.5% | 75.0% |
| B | 6.21 | 4.73 | 1.42 | 1.21 | 23.8% | 30.2% |
| L | 4.42 | 3.83 | 1.27 | 1.14 | 6.1% | 8.7% |
| G | 3.63 | 2.79 | 0.00 | 0.00 | 96.7% | 97.4% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.09 | 3.74 |
| beastChainMoves | 0.99 | 0.79 |
| beastChainCaptures | 1.25 | 0.97 |
| maesterSwaps | 7.26 | 7.45 |
| maesterLongSwaps | 0.81 | 0.85 |
| paladinSacrifices | 0.62 | 0.60 |
| promotions | 0.31 | 0.20 |
| checks | 4.27 | 3.31 |
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
