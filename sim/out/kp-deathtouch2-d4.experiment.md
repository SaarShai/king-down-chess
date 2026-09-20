# Rule A/B — kp-deathtouch2-d4

`kings=[object Object],[object Object] deathTouchMoves=true` against today's defaults.
400 games per population, depth 4, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `kp-deathtouch2-d4.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.585 | 0.591 | +0.006 ± 0.041 | no |
| decisive | 0.670 | 0.608 | -0.062 ± 0.060 | yes |
| draw rate | 0.310 | 0.367 | +0.057 ± 0.058 | no |
| capped | 0.020 | 0.025 | +0.005 ± 0.016 | no |
| mean plies | 126.3 | 129.9 | +3.6 ± 7.0 | no |
| branching factor | 30.4 | 30.2 | -0.1 ± 0.4 | no |
| killer move | 0.189 | 0.200 | +0.011 ± 0.017 | no |
| lead change | 0.040 | 0.042 | +0.002 ± 0.004 | no |
| uncertainty late | 0.626 | 0.626 | +0.000 ± 0.004 | no |
| drama | 0.099 | 0.096 | -0.003 ± 0.018 | no |
| permanence | 0.971 | 0.971 | -0.000 ± 0.001 | no |
| min utilisation | 0.41 | 0.39 | -0.02 ± 0.02 | yes |
| interest | 0.454 | 0.455 | +0.001 ± 0.006 | no |
| interest (min-use) | 0.454 | 0.455 | -0.006 ± 0.013 | no |
| killerMove (resid.) | -0.006 | 0.006 | +0.012 ± 0.017 | no |
| leadChange (resid.) | 0.001 | -0.001 | -0.001 ± 0.005 | no |
| uncertaintyLate (resid.) | 0.003 | -0.003 | -0.007 ± 0.007 | no |
| drama (resid.) | -0.001 | 0.001 | +0.002 ± 0.015 | no |
| permanence (resid.) | 0.000 | -0.000 | -0.000 ± 0.001 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | -0.001 | 0.039 | +0.053 ± 0.021 | yes |
| interest (resid.) | -0.001 | 0.003 | +0.005 ± 0.004 | yes |
| interestMinFairy (resid.) | 0.026 | 0.029 | -0.003 ± 0.012 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 20 (5.0%) | 38 (9.5%) |
| games where a king never moved | 62 (15.5%) | 55 (13.8%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 25.70 | 25.54 | 4.58 | 4.42 | 33.3% | 30.5% |
| K | 20.07 | 21.62 | 1.64 | 2.82 | 100.0% | 100.0% |
| A | 15.07 | 15.01 | 2.54 | 2.49 | 42.0% | 39.9% |
| S | 12.91 | 12.97 | 1.57 | 1.43 | 37.7% | 34.0% |
| M | 12.79 | 14.15 | 1.54 | 1.57 | 32.0% | 33.4% |
| R | 9.48 | 9.56 | 1.58 | 1.47 | 38.3% | 38.0% |
| B | 8.32 | 7.92 | 2.04 | 1.97 | 20.4% | 18.8% |
| N | 7.09 | 7.37 | 1.54 | 1.54 | 6.2% | 6.9% |
| Q | 6.14 | 6.53 | 1.03 | 1.07 | 45.0% | 38.1% |
| L | 5.00 | 5.27 | 1.50 | 1.48 | 8.5% | 8.3% |
| G | 3.73 | 4.01 | 0.00 | 0.00 | 87.9% | 79.7% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.54 | 2.49 |
| beastChainMoves | 1.33 | 1.24 |
| beastChainCaptures | 1.57 | 1.43 |
| maesterSwaps | 5.00 | 5.42 |
| maesterLongSwaps | 0.71 | 0.89 |
| paladinSacrifices | 0.56 | 0.54 |
| promotions | 0.15 | 0.14 |
| checks | 7.37 | 6.01 |
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
