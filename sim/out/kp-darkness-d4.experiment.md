# Rule A/B — kp-darkness-d4

`kings=[object Object],[object Object]` against today's defaults.
400 games per population, depth 4, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `kp-darkness-d4.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.585 | 0.596 | +0.011 ± 0.058 | no |
| decisive | 0.670 | 0.802 | +0.133 ± 0.054 | yes |
| draw rate | 0.310 | 0.185 | -0.125 ± 0.053 | yes |
| capped | 0.020 | 0.013 | -0.008 ± 0.015 | no |
| mean plies | 126.3 | 101.0 | -25.3 ± 7.7 | yes |
| branching factor | 30.4 | 30.7 | +0.4 ± 0.6 | no |
| killer move | 0.189 | 0.225 | +0.036 ± 0.024 | yes |
| lead change | 0.040 | 0.051 | +0.011 ± 0.010 | yes |
| uncertainty late | 0.626 | 0.618 | -0.008 ± 0.010 | no |
| drama | 0.099 | 0.131 | +0.031 ± 0.019 | yes |
| permanence | 0.971 | 0.960 | -0.010 ± 0.002 | yes |
| min utilisation | 0.41 | 0.44 | -0.02 ± 0.04 | no |
| interest | 0.454 | 0.461 | +0.007 ± 0.007 | yes |
| interest (min-use) | 0.454 | 0.348 | -0.024 ± 0.019 | yes |
| killerMove (resid.) | -0.014 | 0.014 | +0.028 ± 0.024 | yes |
| leadChange (resid.) | -0.008 | 0.008 | +0.016 ± 0.009 | yes |
| uncertaintyLate (resid.) | -0.003 | 0.003 | +0.006 ± 0.008 | no |
| drama (resid.) | -0.009 | 0.009 | +0.017 ± 0.019 | no |
| permanence (resid.) | 0.004 | -0.004 | -0.008 ± 0.002 | yes |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.072 | -0.038 | -0.094 ± 0.024 | yes |
| interest (resid.) | 0.002 | 0.000 | -0.000 ± 0.006 | no |
| interestMinFairy (resid.) | 0.042 | -0.075 | -0.035 ± 0.018 | yes |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 20 (5.0%) | 10 (2.5%) |
| games where a king never moved | 62 (15.5%) | 106 (26.5%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 25.70 | 22.54 | 4.58 | 2.24 | 33.3% | 45.4% |
| K | 20.07 | 13.23 | 1.64 | 1.52 | 100.0% | 100.0% |
| A | 15.07 | 12.91 | 2.54 | 2.57 | 42.0% | 47.3% |
| S | 12.91 | 11.73 | 1.57 | 2.17 | 37.7% | 40.2% |
| M | 12.79 | 9.54 | 1.54 | 1.38 | 32.0% | 39.5% |
| R | 9.48 | 5.34 | 1.58 | 1.32 | 38.3% | 27.3% |
| B | 8.32 | 6.91 | 2.04 | 1.85 | 20.4% | 25.3% |
| N | 7.09 | 7.37 | 1.54 | 1.40 | 6.2% | 12.5% |
| Q | 6.14 | 6.27 | 1.03 | 1.30 | 45.0% | 53.6% |
| L | 5.00 | 3.96 | 1.50 | 1.44 | 8.5% | 5.0% |
| G | 3.73 | 1.17 | 0.00 | 0.00 | 87.9% | 91.5% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.54 | 2.57 |
| beastChainMoves | 1.33 | 1.61 |
| beastChainCaptures | 1.57 | 2.17 |
| maesterSwaps | 5.00 | 3.25 |
| maesterLongSwaps | 0.71 | 0.61 |
| paladinSacrifices | 0.56 | 0.59 |
| promotions | 0.15 | 0.24 |
| checks | 7.37 | 6.76 |
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
