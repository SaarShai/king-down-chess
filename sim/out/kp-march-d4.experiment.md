# Rule A/B — kp-march-d4

`kings=[object Object],[object Object]` against today's defaults.
400 games per population, depth 4, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `kp-march-d4.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.585 | 0.545 | -0.040 ± 0.050 | no |
| decisive | 0.670 | 0.745 | +0.075 ± 0.061 | yes |
| draw rate | 0.310 | 0.242 | -0.067 ± 0.063 | yes |
| capped | 0.020 | 0.013 | -0.008 ± 0.015 | no |
| mean plies | 126.3 | 108.8 | -17.5 ± 7.1 | yes |
| branching factor | 30.4 | 31.8 | +1.5 ± 0.7 | yes |
| killer move | 0.189 | 0.198 | +0.009 ± 0.020 | no |
| lead change | 0.040 | 0.049 | +0.009 ± 0.007 | yes |
| uncertainty late | 0.626 | 0.628 | +0.002 ± 0.009 | no |
| drama | 0.099 | 0.131 | +0.031 ± 0.020 | yes |
| permanence | 0.971 | 0.965 | -0.005 ± 0.001 | yes |
| min utilisation | 0.41 | 0.46 | +0.03 ± 0.03 | no |
| interest | 0.454 | 0.459 | +0.004 ± 0.008 | no |
| interest (min-use) | 0.454 | 0.459 | -0.010 ± 0.016 | no |
| killerMove (resid.) | -0.002 | 0.002 | +0.004 ± 0.019 | no |
| leadChange (resid.) | -0.007 | 0.007 | +0.014 ± 0.007 | yes |
| uncertaintyLate (resid.) | -0.005 | 0.005 | +0.010 ± 0.007 | yes |
| drama (resid.) | -0.011 | 0.011 | +0.021 ± 0.015 | yes |
| permanence (resid.) | 0.002 | -0.002 | -0.005 ± 0.001 | yes |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.055 | 0.014 | -0.058 ± 0.023 | yes |
| interest (resid.) | 0.002 | 0.002 | -0.001 ± 0.005 | no |
| interestMinFairy (resid.) | 0.034 | 0.030 | -0.018 ± 0.014 | yes |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 20 (5.0%) | 9 (2.3%) |
| games where a king never moved | 62 (15.5%) | 89 (22.3%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 25.70 | 25.08 | 4.58 | 4.60 | 33.3% | 33.1% |
| K | 20.07 | 14.06 | 1.64 | 1.39 | 100.0% | 100.0% |
| A | 15.07 | 13.10 | 2.54 | 2.37 | 42.0% | 47.3% |
| S | 12.91 | 11.37 | 1.57 | 1.52 | 37.7% | 43.7% |
| M | 12.79 | 10.70 | 1.54 | 1.49 | 32.0% | 42.4% |
| R | 9.48 | 6.84 | 1.58 | 1.49 | 38.3% | 30.7% |
| B | 8.32 | 7.42 | 2.04 | 1.96 | 20.4% | 23.4% |
| N | 7.09 | 7.21 | 1.54 | 1.57 | 6.2% | 12.1% |
| Q | 6.14 | 5.77 | 1.03 | 1.16 | 45.0% | 48.3% |
| L | 5.00 | 4.34 | 1.50 | 1.50 | 8.5% | 8.3% |
| G | 3.73 | 2.89 | 0.00 | 0.00 | 87.9% | 93.2% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.54 | 2.37 |
| beastChainMoves | 1.33 | 1.24 |
| beastChainCaptures | 1.57 | 1.52 |
| maesterSwaps | 5.00 | 4.30 |
| maesterLongSwaps | 0.71 | 0.66 |
| paladinSacrifices | 0.56 | 0.57 |
| promotions | 0.15 | 0.30 |
| checks | 7.37 | 6.13 |
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
