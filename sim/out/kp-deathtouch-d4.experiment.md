# Rule A/B — kp-deathtouch-d4

`kings=[object Object],[object Object]` against today's defaults.
400 games per population, depth 4, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `kp-deathtouch-d4.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.585 | 0.581 | -0.004 ± 0.044 | no |
| decisive | 0.670 | 0.573 | -0.097 ± 0.050 | yes |
| draw rate | 0.310 | 0.390 | +0.080 ± 0.050 | yes |
| capped | 0.020 | 0.037 | +0.017 ± 0.021 | no |
| mean plies | 126.3 | 134.1 | +7.8 ± 8.7 | no |
| branching factor | 30.4 | 29.9 | -0.5 ± 0.6 | no |
| killer move | 0.189 | 0.196 | +0.007 ± 0.017 | no |
| lead change | 0.040 | 0.042 | +0.002 ± 0.005 | no |
| uncertainty late | 0.626 | 0.628 | +0.001 ± 0.005 | no |
| drama | 0.099 | 0.090 | -0.009 ± 0.014 | no |
| permanence | 0.971 | 0.971 | +0.001 ± 0.001 | no |
| min utilisation | 0.41 | 0.38 | -0.03 ± 0.02 | yes |
| interest | 0.454 | 0.455 | +0.000 ± 0.006 | no |
| interest (min-use) | 0.454 | 0.455 | +0.001 ± 0.011 | no |
| killerMove (resid.) | -0.005 | 0.005 | +0.010 ± 0.017 | no |
| leadChange (resid.) | 0.001 | -0.001 | -0.003 ± 0.005 | no |
| uncertaintyLate (resid.) | 0.003 | -0.003 | -0.006 ± 0.006 | no |
| drama (resid.) | -0.001 | 0.001 | +0.002 ± 0.012 | no |
| permanence (resid.) | 0.000 | -0.000 | -0.000 ± 0.001 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | -0.007 | 0.067 | +0.065 ± 0.030 | yes |
| interest (resid.) | -0.001 | 0.005 | +0.006 ± 0.004 | yes |
| interestMinFairy (resid.) | 0.020 | 0.028 | +0.009 ± 0.011 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 20 (5.0%) | 40 (10.0%) |
| games where a king never moved | 62 (15.5%) | 60 (15.0%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 25.70 | 25.40 | 4.58 | 4.47 | 33.3% | 29.9% |
| K | 20.07 | 24.09 | 1.64 | 2.67 | 100.0% | 100.0% |
| A | 15.07 | 15.54 | 2.54 | 2.53 | 42.0% | 41.1% |
| S | 12.91 | 13.32 | 1.57 | 1.46 | 37.7% | 36.5% |
| M | 12.79 | 13.69 | 1.54 | 1.55 | 32.0% | 32.2% |
| R | 9.48 | 9.98 | 1.58 | 1.42 | 38.3% | 36.5% |
| B | 8.32 | 8.09 | 2.04 | 1.96 | 20.4% | 18.6% |
| N | 7.09 | 7.58 | 1.54 | 1.56 | 6.2% | 8.4% |
| Q | 6.14 | 6.40 | 1.03 | 1.11 | 45.0% | 41.9% |
| L | 5.00 | 5.26 | 1.50 | 1.50 | 8.5% | 9.6% |
| G | 3.73 | 4.71 | 0.00 | 0.00 | 87.9% | 80.0% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.54 | 2.53 |
| beastChainMoves | 1.33 | 1.28 |
| beastChainCaptures | 1.57 | 1.46 |
| maesterSwaps | 5.00 | 5.38 |
| maesterLongSwaps | 0.71 | 0.86 |
| paladinSacrifices | 0.56 | 0.57 |
| promotions | 0.15 | 0.15 |
| checks | 7.37 | 6.31 |
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
