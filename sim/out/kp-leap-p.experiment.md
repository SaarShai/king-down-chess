# Rule A/B — kp-leap-p

`kings=[object Object],[object Object]` against today's defaults.
200 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `kp-leap-p.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.537 | 0.550 | +0.012 ± 0.074 | no |
| decisive | 0.745 | 0.820 | +0.075 ± 0.074 | yes |
| draw rate | 0.245 | 0.170 | -0.075 ± 0.073 | yes |
| capped | 0.010 | 0.010 | +0.000 ± 0.014 | no |
| mean plies | 117.5 | 103.7 | -13.7 ± 9.1 | yes |
| branching factor | 31.7 | 34.5 | +2.8 ± 1.2 | yes |
| killer move | 0.302 | 0.311 | +0.008 ± 0.037 | no |
| lead change | 0.067 | 0.045 | -0.022 ± 0.015 | yes |
| uncertainty late | 0.648 | 0.595 | -0.052 ± 0.020 | yes |
| drama | 0.121 | 0.142 | +0.022 ± 0.034 | no |
| permanence | 0.961 | 0.961 | -0.000 ± 0.003 | no |
| min utilisation | 0.45 | 0.45 | +0.00 ± 0.04 | no |
| interest | 0.477 | 0.477 | +0.001 ± 0.012 | no |
| interest (min-use) | 0.477 | 0.477 | -0.003 ± 0.019 | no |
| killerMove (resid.) | 0.002 | -0.002 | -0.003 ± 0.035 | no |
| leadChange (resid.) | 0.009 | -0.009 | -0.017 ± 0.014 | yes |
| uncertaintyLate (resid.) | 0.021 | -0.021 | -0.043 ± 0.017 | yes |
| drama (resid.) | -0.007 | 0.007 | +0.014 ± 0.032 | no |
| permanence (resid.) | -0.000 | 0.000 | +0.001 ± 0.003 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.062 | -0.031 | -0.067 ± 0.018 | yes |
| interest (resid.) | 0.005 | -0.003 | -0.006 ± 0.010 | no |
| interestMinFairy (resid.) | 0.034 | 0.024 | -0.012 ± 0.017 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 4 (2.0%) | 2 (1.0%) |
| games where a king never moved | 30 (15.0%) | 49 (24.5%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 26.25 | 23.43 | 4.61 | 3.94 | 39.8% | 46.2% |
| M | 14.43 | 12.30 | 1.71 | 1.44 | 28.3% | 38.0% |
| A | 13.39 | 12.16 | 2.21 | 2.00 | 42.7% | 52.4% |
| K | 13.23 | 11.61 | 1.04 | 1.01 | 100.0% | 100.0% |
| R | 12.71 | 10.57 | 1.87 | 1.98 | 42.1% | 33.1% |
| S | 9.79 | 8.54 | 1.42 | 1.13 | 28.2% | 40.3% |
| N | 9.02 | 8.19 | 1.74 | 1.69 | 9.8% | 20.3% |
| B | 6.96 | 6.44 | 1.73 | 1.65 | 18.3% | 22.5% |
| Q | 4.30 | 3.65 | 0.88 | 0.76 | 83.1% | 83.1% |
| L | 4.27 | 3.58 | 1.16 | 1.04 | 6.3% | 11.6% |
| G | 3.13 | 3.27 | 0.00 | 0.00 | 97.6% | 98.8% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.21 | 2.00 |
| beastChainMoves | 1.11 | 0.91 |
| beastChainCaptures | 1.42 | 1.13 |
| maesterSwaps | 6.74 | 5.65 |
| maesterLongSwaps | 0.73 | 0.64 |
| paladinSacrifices | 0.59 | 0.52 |
| promotions | 0.32 | 0.30 |
| checks | 4.34 | 3.71 |
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
