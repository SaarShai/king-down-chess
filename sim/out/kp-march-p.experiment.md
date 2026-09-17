# Rule A/B — kp-march-p

`kings=[object Object],[object Object]` against today's defaults.
200 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `kp-march-p.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.537 | 0.535 | -0.002 ± 0.092 | no |
| decisive | 0.745 | 0.820 | +0.075 ± 0.075 | no |
| draw rate | 0.245 | 0.170 | -0.075 ± 0.074 | yes |
| capped | 0.010 | 0.010 | +0.000 ± 0.014 | no |
| mean plies | 117.5 | 102.8 | -14.7 ± 8.4 | yes |
| branching factor | 31.7 | 33.7 | +2.0 ± 0.8 | yes |
| killer move | 0.302 | 0.393 | +0.091 ± 0.039 | yes |
| lead change | 0.067 | 0.068 | +0.001 ± 0.012 | no |
| uncertainty late | 0.648 | 0.648 | +0.001 ± 0.010 | no |
| drama | 0.121 | 0.174 | +0.053 ± 0.030 | yes |
| permanence | 0.961 | 0.949 | -0.012 ± 0.003 | yes |
| min utilisation | 0.45 | 0.50 | +0.03 ± 0.04 | no |
| interest | 0.477 | 0.502 | +0.022 ± 0.012 | yes |
| interest (min-use) | 0.477 | 0.486 | +0.009 ± 0.019 | no |
| killerMove (resid.) | -0.038 | 0.038 | +0.076 ± 0.038 | yes |
| leadChange (resid.) | -0.003 | 0.003 | +0.006 ± 0.012 | no |
| uncertaintyLate (resid.) | -0.004 | 0.004 | +0.007 ± 0.008 | no |
| drama (resid.) | -0.020 | 0.020 | +0.040 ± 0.026 | yes |
| permanence (resid.) | 0.006 | -0.006 | -0.011 ± 0.003 | yes |
| fairyUse (resid.) | 0.002 | 0.004 | -0.005 ± 0.012 | no |
| excessDecisiveness (resid.) | 0.062 | 0.012 | -0.067 ± 0.018 | yes |
| interest (resid.) | -0.005 | 0.011 | +0.014 ± 0.010 | yes |
| interestMinFairy (resid.) | 0.028 | 0.027 | -0.000 ± 0.017 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 4 (2.0%) | 4 (2.0%) |
| games where a king never moved | 30 (15.0%) | 56 (28.0%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 26.25 | 25.89 | 4.61 | 4.74 | 39.8% | 38.9% |
| M | 14.43 | 12.88 | 1.71 | 1.52 | 28.3% | 43.9% |
| A | 13.39 | 11.14 | 2.21 | 1.89 | 42.7% | 58.4% |
| K | 13.23 | 9.71 | 1.04 | 0.81 | 100.0% | 100.0% |
| R | 12.71 | 9.58 | 1.87 | 1.72 | 42.1% | 46.9% |
| S | 9.79 | 8.76 | 1.42 | 1.21 | 28.2% | 41.1% |
| N | 9.02 | 8.62 | 1.74 | 1.69 | 9.8% | 14.0% |
| B | 6.96 | 5.92 | 1.73 | 1.63 | 18.3% | 28.3% |
| Q | 4.30 | 3.81 | 0.88 | 0.78 | 83.1% | 101.5% |
| L | 4.27 | 3.96 | 1.16 | 1.21 | 6.3% | 11.1% |
| G | 3.13 | 2.52 | 0.00 | 0.00 | 97.6% | 97.6% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.21 | 1.89 |
| beastChainMoves | 1.11 | 0.98 |
| beastChainCaptures | 1.42 | 1.21 |
| maesterSwaps | 6.74 | 5.57 |
| maesterLongSwaps | 0.73 | 0.72 |
| paladinSacrifices | 0.59 | 0.52 |
| promotions | 0.32 | 0.52 |
| checks | 4.34 | 3.69 |
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
