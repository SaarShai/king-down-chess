# Rule A/B — kp-deathtouch

`kings=[object Object],[object Object]` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `kp-deathtouch.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.534 | 0.525 | -0.009 ± 0.022 | no |
| decisive | 0.721 | 0.671 | -0.050 ± 0.027 | yes |
| draw rate | 0.264 | 0.306 | +0.041 ± 0.026 | yes |
| capped | 0.014 | 0.023 | +0.009 ± 0.008 | yes |
| mean plies | 121.3 | 127.7 | +6.5 ± 2.3 | yes |
| branching factor | 32.1 | 31.9 | -0.2 ± 0.2 | no |
| killer move | 0.332 | 0.314 | -0.018 ± 0.012 | yes |
| lead change | 0.068 | 0.066 | -0.002 ± 0.002 | yes |
| uncertainty late | 0.648 | 0.648 | -0.000 ± 0.002 | no |
| drama | 0.138 | 0.127 | -0.011 ± 0.009 | yes |
| permanence | 0.961 | 0.962 | +0.001 ± 0.001 | yes |
| min utilisation | 0.44 | 0.42 | -0.02 ± 0.01 | yes |
| interest | 0.484 | 0.480 | -0.004 ± 0.005 | no |
| interest (min-use) | 0.484 | 0.480 | -0.002 ± 0.008 | no |
| killerMove (resid.) | 0.003 | -0.003 | -0.007 ± 0.010 | no |
| leadChange (resid.) | 0.002 | -0.002 | -0.005 ± 0.002 | yes |
| uncertaintyLate (resid.) | 0.003 | -0.003 | -0.007 ± 0.004 | yes |
| drama (resid.) | 0.003 | -0.003 | -0.005 ± 0.008 | no |
| permanence (resid.) | -0.000 | 0.000 | +0.000 ± 0.001 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | -0.003 | 0.032 | +0.038 ± 0.011 | yes |
| interest (resid.) | 0.001 | 0.001 | +0.000 ± 0.003 | no |
| interestMinFairy (resid.) | 0.010 | 0.012 | +0.004 ± 0.007 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 30 (1.9%) | 56 (3.5%) |
| games where a king never moved | 259 (16.2%) | 224 (14.0%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 26.54 | 26.95 | 4.41 | 4.54 | 40.7% | 37.6% |
| M | 14.65 | 15.47 | 1.61 | 1.61 | 34.1% | 32.2% |
| A | 14.46 | 14.89 | 2.49 | 2.47 | 46.9% | 44.9% |
| K | 14.32 | 16.20 | 1.04 | 1.64 | 100.0% | 100.0% |
| R | 12.87 | 14.38 | 1.81 | 1.94 | 42.3% | 39.9% |
| S | 10.48 | 10.76 | 1.40 | 1.28 | 32.9% | 31.3% |
| B | 7.34 | 7.63 | 1.65 | 1.63 | 23.5% | 22.0% |
| N | 6.66 | 6.79 | 1.35 | 1.36 | 10.4% | 11.0% |
| Q | 5.93 | 6.34 | 0.99 | 1.02 | 76.3% | 73.0% |
| G | 4.98 | 5.14 | 0.00 | 0.00 | 96.7% | 94.3% |
| L | 3.05 | 3.18 | 0.85 | 0.84 | 6.2% | 6.0% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.49 | 2.47 |
| beastChainMoves | 1.08 | 1.03 |
| beastChainCaptures | 1.40 | 1.28 |
| maesterSwaps | 6.56 | 6.94 |
| maesterLongSwaps | 0.75 | 0.90 |
| paladinSacrifices | 0.39 | 0.39 |
| promotions | 0.32 | 0.31 |
| checks | 4.42 | 3.88 |
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
