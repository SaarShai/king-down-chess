# Rule A/B — kp-march

`kings=[object Object],[object Object]` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `kp-march.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.534 | 0.538 | +0.004 ± 0.036 | no |
| decisive | 0.721 | 0.854 | +0.132 ± 0.030 | yes |
| draw rate | 0.264 | 0.142 | -0.122 ± 0.030 | yes |
| capped | 0.014 | 0.004 | -0.011 ± 0.006 | yes |
| mean plies | 121.3 | 101.6 | -19.7 ± 3.2 | yes |
| branching factor | 32.1 | 33.7 | +1.6 ± 0.3 | yes |
| killer move | 0.332 | 0.380 | +0.048 ± 0.018 | yes |
| lead change | 0.068 | 0.072 | +0.004 ± 0.004 | no |
| uncertainty late | 0.648 | 0.642 | -0.006 ± 0.004 | yes |
| drama | 0.138 | 0.165 | +0.028 ± 0.011 | yes |
| permanence | 0.961 | 0.950 | -0.011 ± 0.001 | yes |
| min utilisation | 0.44 | 0.51 | +0.06 ± 0.02 | yes |
| interest | 0.484 | 0.494 | +0.011 ± 0.006 | yes |
| interest (min-use) | 0.484 | 0.463 | -0.004 ± 0.012 | no |
| killerMove (resid.) | -0.003 | 0.003 | +0.006 ± 0.014 | no |
| leadChange (resid.) | -0.003 | 0.003 | +0.007 ± 0.004 | yes |
| uncertaintyLate (resid.) | -0.004 | 0.004 | +0.008 ± 0.003 | yes |
| drama (resid.) | -0.005 | 0.005 | +0.010 ± 0.011 | no |
| permanence (resid.) | 0.002 | -0.002 | -0.004 ± 0.002 | yes |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.051 | -0.032 | -0.071 ± 0.014 | yes |
| interest (resid.) | 0.002 | -0.001 | -0.002 ± 0.004 | no |
| interestMinFairy (resid.) | 0.018 | -0.011 | -0.012 ± 0.011 | yes |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 30 (1.9%) | 27 (1.7%) |
| games where a king never moved | 259 (16.2%) | 464 (29.0%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 26.54 | 25.82 | 4.41 | 4.47 | 40.7% | 38.8% |
| M | 14.65 | 11.51 | 1.61 | 1.48 | 34.1% | 44.0% |
| A | 14.46 | 11.73 | 2.49 | 2.19 | 46.9% | 53.0% |
| K | 14.32 | 9.42 | 1.04 | 0.85 | 100.0% | 100.0% |
| R | 12.87 | 9.88 | 1.81 | 1.90 | 42.3% | 43.4% |
| S | 10.48 | 9.57 | 1.40 | 1.36 | 32.9% | 41.7% |
| B | 7.34 | 6.30 | 1.65 | 1.56 | 23.5% | 28.4% |
| N | 6.66 | 6.65 | 1.35 | 1.40 | 10.4% | 14.1% |
| Q | 5.93 | 5.06 | 0.99 | 1.07 | 76.3% | 92.9% |
| G | 4.98 | 3.08 | 0.00 | 0.00 | 96.7% | 97.7% |
| L | 3.05 | 2.60 | 0.85 | 0.84 | 6.2% | 7.1% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.49 | 2.19 |
| beastChainMoves | 1.08 | 1.08 |
| beastChainCaptures | 1.40 | 1.36 |
| maesterSwaps | 6.56 | 4.98 |
| maesterLongSwaps | 0.75 | 0.62 |
| paladinSacrifices | 0.39 | 0.37 |
| promotions | 0.32 | 0.54 |
| checks | 4.42 | 3.62 |
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
