# Rule A/B — kp-strike2-d4

`kings=[object Object],[object Object] strikeMode=capture` against today's defaults.
400 games per population, depth 4, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `kp-strike2-d4.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.585 | 0.605 | +0.020 ± 0.053 | no |
| decisive | 0.670 | 0.375 | -0.295 ± 0.073 | yes |
| draw rate | 0.310 | 0.625 | +0.315 ± 0.074 | yes |
| capped | 0.020 | 0.000 | -0.020 ± 0.013 | yes |
| mean plies | 126.3 | 88.8 | -37.5 ± 7.0 | yes |
| branching factor | 30.4 | 32.9 | +2.5 ± 0.7 | yes |
| killer move | 0.189 | 0.145 | -0.044 ± 0.019 | yes |
| lead change | 0.040 | 0.037 | -0.003 ± 0.009 | no |
| uncertainty late | 0.626 | 0.621 | -0.005 ± 0.011 | no |
| drama | 0.099 | 0.037 | -0.062 ± 0.016 | yes |
| permanence | 0.971 | 0.972 | +0.001 ± 0.002 | no |
| min utilisation | 0.41 | 0.48 | +0.04 ± 0.02 | yes |
| interest | 0.454 | 0.438 | -0.016 ± 0.007 | yes |
| interest (min-use) | 0.454 | 0.363 | -0.032 ± 0.015 | yes |
| killerMove (resid.) | 0.005 | -0.005 | -0.010 ± 0.018 | no |
| leadChange (resid.) | 0.003 | -0.003 | -0.007 ± 0.009 | no |
| uncertaintyLate (resid.) | 0.009 | -0.009 | -0.017 ± 0.010 | yes |
| drama (resid.) | 0.007 | -0.007 | -0.014 ± 0.016 | no |
| permanence (resid.) | 0.000 | -0.000 | -0.001 ± 0.002 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | -0.034 | 0.084 | +0.119 ± 0.040 | yes |
| interest (resid.) | 0.000 | 0.003 | +0.002 ± 0.006 | no |
| interestMinFairy (resid.) | 0.023 | -0.033 | +0.004 ± 0.015 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 20 (5.0%) | 2 (0.5%) |
| games where a king never moved | 62 (15.5%) | 108 (27.0%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 25.70 | 21.15 | 4.58 | 5.21 | 33.3% | 43.8% |
| K | 20.07 | 9.17 | 1.64 | 0.83 | 100.0% | 100.0% |
| A | 15.07 | 11.23 | 2.54 | 1.90 | 42.0% | 53.0% |
| S | 12.91 | 8.99 | 1.57 | 1.06 | 37.7% | 51.5% |
| M | 12.79 | 9.46 | 1.54 | 1.12 | 32.0% | 49.2% |
| R | 9.48 | 5.30 | 1.58 | 1.04 | 38.3% | 44.5% |
| B | 8.32 | 6.65 | 2.04 | 1.78 | 20.4% | 30.4% |
| N | 7.09 | 6.64 | 1.54 | 1.26 | 6.2% | 17.9% |
| Q | 6.14 | 4.82 | 1.03 | 0.83 | 45.0% | 54.7% |
| L | 5.00 | 3.90 | 1.50 | 1.32 | 8.5% | 13.9% |
| G | 3.73 | 1.48 | 0.00 | 0.00 | 87.9% | 95.6% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.54 | 1.90 |
| beastChainMoves | 1.33 | 0.91 |
| beastChainCaptures | 1.57 | 1.06 |
| maesterSwaps | 5.00 | 3.88 |
| maesterLongSwaps | 0.71 | 0.50 |
| paladinSacrifices | 0.56 | 0.54 |
| promotions | 0.15 | 0.07 |
| checks | 7.37 | 4.13 |
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
