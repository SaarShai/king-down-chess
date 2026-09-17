# Rule A/B — kp-leap-d4

`kings=[object Object],[object Object]` against today's defaults.
400 games per population, depth 4, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `kp-leap-d4.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.585 | 0.590 | +0.005 ± 0.059 | no |
| decisive | 0.670 | 0.775 | +0.105 ± 0.063 | yes |
| draw rate | 0.310 | 0.200 | -0.110 ± 0.065 | yes |
| capped | 0.020 | 0.025 | +0.005 ± 0.014 | no |
| mean plies | 126.3 | 117.5 | -8.8 ± 9.1 | no |
| branching factor | 30.4 | 31.9 | +1.5 ± 1.0 | yes |
| killer move | 0.189 | 0.176 | -0.013 ± 0.017 | no |
| lead change | 0.040 | 0.025 | -0.015 ± 0.009 | yes |
| uncertainty late | 0.626 | 0.578 | -0.048 ± 0.017 | yes |
| drama | 0.099 | 0.103 | +0.004 ± 0.025 | no |
| permanence | 0.971 | 0.973 | +0.002 ± 0.002 | yes |
| min utilisation | 0.41 | 0.41 | -0.00 ± 0.02 | no |
| interest | 0.454 | 0.448 | -0.006 ± 0.007 | no |
| interest (min-use) | 0.454 | 0.448 | -0.007 ± 0.016 | no |
| killerMove (resid.) | 0.007 | -0.007 | -0.015 ± 0.017 | no |
| leadChange (resid.) | 0.004 | -0.004 | -0.008 ± 0.009 | no |
| uncertaintyLate (resid.) | 0.012 | -0.012 | -0.024 ± 0.016 | yes |
| drama (resid.) | 0.002 | -0.002 | -0.003 ± 0.025 | no |
| permanence (resid.) | -0.001 | 0.001 | +0.002 ± 0.002 | yes |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.070 | -0.032 | -0.088 ± 0.021 | yes |
| interest (resid.) | 0.007 | -0.004 | -0.010 ± 0.007 | yes |
| interestMinFairy (resid.) | 0.032 | 0.017 | -0.015 ± 0.016 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 20 (5.0%) | 20 (5.0%) |
| games where a king never moved | 62 (15.5%) | 77 (19.3%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 25.70 | 23.82 | 4.58 | 4.38 | 33.3% | 36.7% |
| K | 20.07 | 19.33 | 1.64 | 1.63 | 100.0% | 100.0% |
| A | 15.07 | 13.80 | 2.54 | 2.25 | 42.0% | 47.2% |
| S | 12.91 | 11.87 | 1.57 | 1.45 | 37.7% | 45.1% |
| M | 12.79 | 12.17 | 1.54 | 1.65 | 32.0% | 30.1% |
| R | 9.48 | 7.22 | 1.58 | 1.42 | 38.3% | 28.8% |
| B | 8.32 | 6.96 | 2.04 | 1.89 | 20.4% | 17.9% |
| N | 7.09 | 6.87 | 1.54 | 1.54 | 6.2% | 13.8% |
| Q | 6.14 | 5.85 | 1.03 | 1.07 | 45.0% | 38.3% |
| L | 5.00 | 4.63 | 1.50 | 1.52 | 8.5% | 12.6% |
| G | 3.73 | 5.00 | 0.00 | 0.00 | 87.9% | 92.9% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.54 | 2.25 |
| beastChainMoves | 1.33 | 1.21 |
| beastChainCaptures | 1.57 | 1.45 |
| maesterSwaps | 5.00 | 4.61 |
| maesterLongSwaps | 0.71 | 0.61 |
| paladinSacrifices | 0.56 | 0.57 |
| promotions | 0.15 | 0.15 |
| checks | 7.37 | 6.59 |
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
