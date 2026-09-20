# Rule A/B — kp-strike2-p

`kings=[object Object],[object Object] strikeMode=capture` against today's defaults.
200 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `kp-strike2-p.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.537 | 0.410 | -0.128 ± 0.070 | yes |
| decisive | 0.745 | 0.610 | -0.135 ± 0.103 | yes |
| draw rate | 0.245 | 0.390 | +0.145 ± 0.103 | yes |
| capped | 0.010 | 0.000 | -0.010 ± 0.020 | no |
| mean plies | 117.5 | 89.6 | -27.9 ± 9.0 | yes |
| branching factor | 31.7 | 34.2 | +2.5 ± 1.1 | yes |
| killer move | 0.302 | 0.325 | +0.022 ± 0.044 | no |
| lead change | 0.067 | 0.057 | -0.010 ± 0.015 | no |
| uncertainty late | 0.648 | 0.602 | -0.046 ± 0.014 | yes |
| drama | 0.121 | 0.107 | -0.013 ± 0.028 | no |
| permanence | 0.961 | 0.938 | -0.023 ± 0.013 | yes |
| min utilisation | 0.45 | 0.51 | +0.04 ± 0.03 | yes |
| interest | 0.477 | 0.473 | -0.003 ± 0.014 | no |
| interest (min-use) | 0.477 | 0.427 | -0.016 ± 0.022 | no |
| killerMove (resid.) | -0.021 | 0.021 | +0.041 ± 0.040 | yes |
| leadChange (resid.) | 0.005 | -0.005 | -0.010 ± 0.015 | no |
| uncertaintyLate (resid.) | 0.023 | -0.023 | -0.046 ± 0.014 | yes |
| drama (resid.) | -0.003 | 0.003 | +0.007 ± 0.024 | no |
| permanence (resid.) | 0.012 | -0.012 | -0.024 ± 0.012 | yes |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | -0.032 | 0.074 | +0.122 ± 0.027 | yes |
| interest (resid.) | -0.003 | 0.006 | +0.010 ± 0.010 | yes |
| interestMinFairy (resid.) | 0.026 | -0.005 | +0.003 ± 0.020 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 4 (2.0%) | 2 (1.0%) |
| games where a king never moved | 30 (15.0%) | 63 (31.5%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 26.25 | 22.63 | 4.61 | 5.12 | 39.8% | 47.3% |
| M | 14.43 | 11.47 | 1.71 | 1.29 | 28.3% | 46.1% |
| A | 13.39 | 10.44 | 2.21 | 1.80 | 42.7% | 55.4% |
| K | 13.23 | 8.78 | 1.04 | 0.71 | 100.0% | 100.0% |
| R | 12.71 | 7.88 | 1.87 | 1.32 | 42.1% | 56.7% |
| S | 9.79 | 7.83 | 1.42 | 0.91 | 28.2% | 48.2% |
| N | 9.02 | 7.31 | 1.74 | 1.54 | 9.8% | 22.0% |
| B | 6.96 | 5.12 | 1.73 | 1.24 | 18.3% | 39.2% |
| Q | 4.30 | 3.44 | 0.88 | 0.57 | 83.1% | 80.0% |
| L | 4.27 | 2.85 | 1.16 | 0.98 | 6.3% | 12.1% |
| G | 3.13 | 1.83 | 0.00 | 0.00 | 97.6% | 97.6% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.21 | 1.80 |
| beastChainMoves | 1.11 | 0.76 |
| beastChainCaptures | 1.42 | 0.91 |
| maesterSwaps | 6.74 | 5.04 |
| maesterLongSwaps | 0.73 | 0.63 |
| paladinSacrifices | 0.59 | 0.34 |
| promotions | 0.32 | 0.20 |
| checks | 4.34 | 2.91 |
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
