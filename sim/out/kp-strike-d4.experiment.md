# Rule A/B — kp-strike-d4

`kings=[object Object],[object Object]` against today's defaults.
400 games per population, depth 4, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `kp-strike-d4.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.585 | 0.571 | -0.014 ± 0.056 | no |
| decisive | 0.670 | 0.468 | -0.202 ± 0.058 | yes |
| draw rate | 0.310 | 0.532 | +0.223 ± 0.058 | yes |
| capped | 0.020 | 0.000 | -0.020 ± 0.013 | yes |
| mean plies | 126.3 | 86.3 | -40.0 ± 7.9 | yes |
| branching factor | 30.4 | 36.2 | +5.8 ± 1.1 | yes |
| killer move | 0.189 | 0.141 | -0.048 ± 0.020 | yes |
| lead change | 0.040 | 0.027 | -0.013 ± 0.008 | yes |
| uncertainty late | 0.626 | 0.595 | -0.031 ± 0.011 | yes |
| drama | 0.099 | 0.048 | -0.051 ± 0.017 | yes |
| permanence | 0.971 | 0.973 | +0.003 ± 0.002 | yes |
| min utilisation | 0.41 | 0.47 | +0.02 ± 0.03 | no |
| interest | 0.454 | 0.436 | -0.018 ± 0.007 | yes |
| interest (min-use) | 0.454 | 0.343 | -0.038 ± 0.017 | yes |
| killerMove (resid.) | 0.012 | -0.012 | -0.024 ± 0.019 | yes |
| leadChange (resid.) | 0.007 | -0.007 | -0.014 ± 0.008 | yes |
| uncertaintyLate (resid.) | 0.018 | -0.018 | -0.036 ± 0.010 | yes |
| drama (resid.) | 0.011 | -0.011 | -0.023 ± 0.017 | yes |
| permanence (resid.) | -0.001 | 0.001 | +0.001 ± 0.002 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | -0.036 | 0.078 | +0.123 ± 0.029 | yes |
| interest (resid.) | 0.003 | -0.000 | -0.003 ± 0.006 | no |
| interestMinFairy (resid.) | 0.031 | -0.055 | -0.013 ± 0.017 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 20 (5.0%) | 4 (1.0%) |
| games where a king never moved | 62 (15.5%) | 122 (30.5%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 25.70 | 20.18 | 4.58 | 4.19 | 33.3% | 45.2% |
| K | 20.07 | 9.28 | 1.64 | 0.99 | 100.0% | 100.0% |
| A | 15.07 | 10.37 | 2.54 | 1.80 | 42.0% | 55.7% |
| S | 12.91 | 8.97 | 1.57 | 1.16 | 37.7% | 56.1% |
| M | 12.79 | 9.65 | 1.54 | 1.32 | 32.0% | 48.0% |
| R | 9.48 | 5.61 | 1.58 | 1.12 | 38.3% | 45.3% |
| B | 8.32 | 6.32 | 2.04 | 1.76 | 20.4% | 30.7% |
| N | 7.09 | 6.40 | 1.54 | 1.38 | 6.2% | 20.9% |
| Q | 6.14 | 4.52 | 1.03 | 0.82 | 45.0% | 55.3% |
| L | 5.00 | 3.76 | 1.50 | 1.32 | 8.5% | 21.5% |
| G | 3.73 | 1.22 | 0.00 | 0.00 | 87.9% | 93.8% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.54 | 1.80 |
| beastChainMoves | 1.33 | 0.95 |
| beastChainCaptures | 1.57 | 1.16 |
| maesterSwaps | 5.00 | 3.69 |
| maesterLongSwaps | 0.71 | 0.45 |
| paladinSacrifices | 0.56 | 0.53 |
| promotions | 0.15 | 0.28 |
| checks | 7.37 | 4.23 |
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
