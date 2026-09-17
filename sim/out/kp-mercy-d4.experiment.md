# Rule A/B — kp-mercy-d4

`kings=[object Object],[object Object]` against today's defaults.
400 games per population, depth 4, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `kp-mercy-d4.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.585 | 0.576 | -0.009 ± 0.048 | no |
| decisive | 0.670 | 0.682 | +0.013 ± 0.075 | no |
| draw rate | 0.310 | 0.297 | -0.013 ± 0.072 | no |
| capped | 0.020 | 0.020 | -0.000 ± 0.019 | no |
| mean plies | 126.3 | 118.2 | -8.2 ± 8.4 | no |
| branching factor | 30.4 | 32.8 | +2.4 ± 0.6 | yes |
| killer move | 0.189 | 0.208 | +0.019 ± 0.017 | yes |
| lead change | 0.040 | 0.038 | -0.002 ± 0.008 | no |
| uncertainty late | 0.626 | 0.630 | +0.004 ± 0.009 | no |
| drama | 0.099 | 0.119 | +0.019 ± 0.019 | yes |
| permanence | 0.971 | 0.969 | -0.002 ± 0.002 | yes |
| min utilisation | 0.41 | 0.39 | -0.04 ± 0.03 | yes |
| interest | 0.454 | 0.461 | +0.007 ± 0.007 | no |
| interest (min-use) | 0.454 | 0.376 | -0.018 ± 0.016 | yes |
| killerMove (resid.) | -0.009 | 0.009 | +0.018 ± 0.017 | yes |
| leadChange (resid.) | 0.001 | -0.001 | -0.002 ± 0.008 | no |
| uncertaintyLate (resid.) | -0.003 | 0.003 | +0.005 ± 0.008 | no |
| drama (resid.) | -0.009 | 0.009 | +0.018 ± 0.016 | yes |
| permanence (resid.) | 0.001 | -0.001 | -0.002 ± 0.002 | yes |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.031 | 0.013 | -0.011 ± 0.024 | no |
| interest (resid.) | -0.001 | 0.004 | +0.006 ± 0.005 | yes |
| interestMinFairy (resid.) | 0.034 | -0.045 | -0.019 ± 0.016 | yes |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 20 (5.0%) | 15 (3.8%) |
| games where a king never moved | 62 (15.5%) | 52 (13.0%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 25.70 | 23.06 | 4.58 | 4.15 | 33.3% | 37.8% |
| K | 20.07 | 18.88 | 1.64 | 0.21 | 100.0% | 100.0% |
| A | 15.07 | 14.20 | 2.54 | 2.33 | 42.0% | 50.3% |
| S | 12.91 | 11.37 | 1.57 | 1.47 | 37.7% | 45.1% |
| M | 12.79 | 13.27 | 1.54 | 1.79 | 32.0% | 38.4% |
| R | 9.48 | 8.71 | 1.58 | 1.69 | 38.3% | 42.0% |
| B | 8.32 | 8.14 | 2.04 | 2.13 | 20.4% | 22.2% |
| N | 7.09 | 7.98 | 1.54 | 1.65 | 6.2% | 10.4% |
| Q | 6.14 | 6.26 | 1.03 | 1.14 | 45.0% | 65.3% |
| L | 5.00 | 4.49 | 1.50 | 1.58 | 8.5% | 9.3% |
| G | 3.73 | 1.81 | 0.00 | 0.00 | 87.9% | 75.3% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.54 | 2.33 |
| beastChainMoves | 1.33 | 1.26 |
| beastChainCaptures | 1.57 | 1.47 |
| maesterSwaps | 5.00 | 5.13 |
| maesterLongSwaps | 0.71 | 0.80 |
| paladinSacrifices | 0.56 | 0.57 |
| promotions | 0.15 | 0.15 |
| checks | 7.37 | 9.34 |
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
