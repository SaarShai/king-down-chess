# Rule A/B — kp-mercy-p

`kings=[object Object],[object Object]` against today's defaults.
200 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `kp-mercy-p.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.537 | 0.535 | -0.003 ± 0.089 | no |
| decisive | 0.745 | 0.780 | +0.035 ± 0.070 | no |
| draw rate | 0.245 | 0.195 | -0.050 ± 0.079 | no |
| capped | 0.010 | 0.025 | +0.015 ± 0.029 | no |
| mean plies | 117.5 | 117.3 | -0.2 ± 9.8 | no |
| branching factor | 31.7 | 33.4 | +1.7 ± 1.0 | yes |
| killer move | 0.302 | 0.368 | +0.066 ± 0.041 | yes |
| lead change | 0.067 | 0.066 | -0.002 ± 0.014 | no |
| uncertainty late | 0.648 | 0.641 | -0.006 ± 0.013 | no |
| drama | 0.121 | 0.146 | +0.026 ± 0.030 | no |
| permanence | 0.961 | 0.957 | -0.004 ± 0.002 | yes |
| min utilisation | 0.45 | 0.42 | -0.02 ± 0.03 | no |
| interest | 0.477 | 0.495 | +0.015 ± 0.013 | yes |
| interest (min-use) | 0.477 | 0.490 | +0.010 ± 0.019 | no |
| killerMove (resid.) | -0.028 | 0.028 | +0.056 ± 0.035 | yes |
| leadChange (resid.) | -0.000 | 0.000 | +0.001 ± 0.013 | no |
| uncertaintyLate (resid.) | 0.001 | -0.001 | -0.002 ± 0.011 | no |
| drama (resid.) | -0.010 | 0.010 | +0.019 ± 0.029 | no |
| permanence (resid.) | 0.002 | -0.002 | -0.003 ± 0.002 | yes |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.050 | 0.043 | -0.043 ± 0.032 | yes |
| interest (resid.) | -0.003 | 0.009 | +0.010 ± 0.009 | yes |
| interestMinFairy (resid.) | 0.026 | 0.032 | +0.003 ± 0.016 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 4 (2.0%) | 2 (1.0%) |
| games where a king never moved | 30 (15.0%) | 32 (16.0%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 26.25 | 24.76 | 4.61 | 4.34 | 39.8% | 41.2% |
| M | 14.43 | 14.60 | 1.71 | 1.67 | 28.3% | 37.1% |
| A | 13.39 | 13.70 | 2.21 | 2.37 | 42.7% | 51.9% |
| K | 13.23 | 16.05 | 1.04 | 0.18 | 100.0% | 100.0% |
| R | 12.71 | 12.17 | 1.87 | 2.08 | 42.1% | 45.9% |
| S | 9.79 | 9.45 | 1.42 | 1.27 | 28.2% | 35.8% |
| N | 9.02 | 8.73 | 1.74 | 1.75 | 9.8% | 14.2% |
| B | 6.96 | 6.85 | 1.73 | 1.75 | 18.3% | 23.6% |
| Q | 4.30 | 3.92 | 0.88 | 0.81 | 83.1% | 96.2% |
| L | 4.27 | 4.01 | 1.16 | 1.25 | 6.3% | 5.8% |
| G | 3.13 | 3.04 | 0.00 | 0.00 | 97.6% | 78.8% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.21 | 2.37 |
| beastChainMoves | 1.11 | 1.03 |
| beastChainCaptures | 1.42 | 1.27 |
| maesterSwaps | 6.74 | 6.46 |
| maesterLongSwaps | 0.73 | 0.97 |
| paladinSacrifices | 0.59 | 0.57 |
| promotions | 0.32 | 0.30 |
| checks | 4.34 | 6.28 |
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
