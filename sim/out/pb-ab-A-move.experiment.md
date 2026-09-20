# Rule A/B — pb-ab-A-move

`archerMove=fwdBack` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-A-move.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.544 | 0.542 | -0.002 ± 0.016 | no |
| decisive | 0.714 | 0.674 | -0.040 ± 0.028 | yes |
| draw rate | 0.274 | 0.302 | +0.028 ± 0.026 | yes |
| capped | 0.012 | 0.024 | +0.012 ± 0.011 | yes |
| mean plies | 118.0 | 123.7 | +5.7 ± 4.1 | yes |
| branching factor | 32.6 | 30.7 | -1.9 ± 0.6 | yes |
| killer move | 0.325 | 0.321 | -0.004 ± 0.015 | no |
| lead change | 0.064 | 0.065 | +0.001 ± 0.004 | no |
| uncertainty late | 0.648 | 0.652 | +0.004 ± 0.003 | yes |
| drama | 0.127 | 0.119 | -0.008 ± 0.010 | no |
| permanence | 0.962 | 0.963 | +0.001 ± 0.001 | yes |
| min utilisation | 0.45 | 0.45 | +0.00 ± 0.01 | no |
| interest | 0.482 | 0.481 | -0.001 ± 0.005 | no |
| interest (min-use) | 0.482 | 0.444 | -0.026 ± 0.010 | yes |
| killerMove (resid.) | -0.002 | 0.002 | +0.005 ± 0.013 | no |
| leadChange (resid.) | 0.001 | -0.001 | -0.002 ± 0.004 | no |
| uncertaintyLate (resid.) | 0.000 | -0.000 | -0.000 ± 0.003 | no |
| drama (resid.) | 0.002 | -0.002 | -0.004 ± 0.007 | no |
| permanence (resid.) | -0.000 | 0.000 | +0.000 ± 0.001 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | -0.005 | 0.021 | +0.029 ± 0.011 | yes |
| interest (resid.) | -0.001 | 0.002 | +0.002 ± 0.003 | no |
| interestMinFairy (resid.) | 0.019 | -0.012 | -0.020 ± 0.010 | yes |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 24 (1.5%) | 27 (1.7%) |
| games where a king never moved | 289 (18.1%) | 238 (14.9%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 26.41 | 27.83 | 4.54 | 4.76 | 41.3% | 42.1% |
| M | 16.21 | 18.88 | 1.72 | 1.92 | 36.7% | 35.4% |
| K | 13.26 | 17.17 | 0.93 | 1.10 | 100.0% | 100.0% |
| A | 12.40 | 5.38 | 2.09 | 1.05 | 44.3% | 62.0% |
| R | 11.04 | 12.30 | 1.74 | 1.79 | 40.6% | 39.8% |
| S | 9.85 | 10.22 | 1.25 | 1.35 | 32.9% | 30.4% |
| N | 8.29 | 8.46 | 1.69 | 1.70 | 9.7% | 9.7% |
| Q | 6.30 | 6.87 | 1.02 | 1.03 | 76.5% | 76.1% |
| B | 6.21 | 6.24 | 1.42 | 1.44 | 23.8% | 23.4% |
| L | 4.42 | 5.01 | 1.27 | 1.28 | 6.1% | 8.3% |
| G | 3.63 | 5.31 | 0.00 | 0.00 | 96.7% | 95.3% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.09 | 1.05 |
| beastChainMoves | 0.99 | 1.06 |
| beastChainCaptures | 1.25 | 1.35 |
| maesterSwaps | 7.26 | 8.54 |
| maesterLongSwaps | 0.81 | 0.93 |
| paladinSacrifices | 0.62 | 0.54 |
| promotions | 0.31 | 0.33 |
| checks | 4.27 | 3.89 |
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
