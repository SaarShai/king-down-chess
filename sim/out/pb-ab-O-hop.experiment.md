# Rule A/B — pb-ab-O-hop

`ogreHop=true` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-O-hop.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.532 | 0.541 | +0.008 ± 0.041 | no |
| decisive | 0.795 | 0.808 | +0.013 ± 0.030 | no |
| draw rate | 0.198 | 0.189 | -0.009 ± 0.029 | no |
| capped | 0.007 | 0.003 | -0.004 ± 0.005 | no |
| mean plies | 105.0 | 101.8 | -3.3 ± 3.1 | yes |
| branching factor | 32.2 | 33.9 | +1.7 ± 0.6 | yes |
| killer move | 0.363 | 0.371 | +0.008 ± 0.017 | no |
| lead change | 0.066 | 0.069 | +0.003 ± 0.004 | no |
| uncertainty late | 0.636 | 0.635 | -0.001 ± 0.004 | no |
| drama | 0.161 | 0.160 | -0.001 ± 0.012 | no |
| permanence | 0.955 | 0.953 | -0.001 ± 0.002 | no |
| min utilisation | 0.41 | 0.41 | +0.01 ± 0.01 | yes |
| interest | 0.492 | 0.492 | +0.001 ± 0.006 | no |
| interest (min-use) | 0.449 | 0.445 | -0.001 ± 0.010 | no |
| killerMove (resid.) | -0.003 | 0.003 | +0.005 ± 0.015 | no |
| leadChange (resid.) | -0.002 | 0.002 | +0.003 ± 0.004 | no |
| uncertaintyLate (resid.) | -0.000 | 0.000 | +0.000 ± 0.005 | no |
| drama (resid.) | 0.002 | -0.002 | -0.003 ± 0.011 | no |
| permanence (resid.) | 0.000 | -0.000 | -0.001 ± 0.002 | no |
| fairyUse (resid.) | 0.001 | 0.001 | -0.001 ± 0.003 | no |
| excessDecisiveness (resid.) | 0.030 | 0.002 | -0.008 ± 0.009 | no |
| interest (resid.) | 0.002 | 0.000 | -0.001 ± 0.004 | no |
| interestMinFairy (resid.) | -0.015 | -0.021 | -0.003 ± 0.009 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 8 (0.5%) | 20 (1.3%) |
| games where a king never moved | 430 (26.9%) | 463 (28.9%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 21.39 | 21.00 | 3.54 | 3.50 | 42.4% | 43.5% |
| A | 14.22 | 14.07 | 3.37 | 3.34 | 55.2% | 53.0% |
| O | 11.57 | 11.18 | 0.81 | 1.03 | 66.8% | 54.3% |
| K | 10.18 | 9.44 | 0.80 | 0.74 | 100.0% | 100.0% |
| M | 9.94 | 9.40 | 0.92 | 0.88 | 34.8% | 36.7% |
| N | 8.34 | 7.81 | 1.40 | 1.35 | 15.3% | 14.5% |
| S | 7.21 | 7.12 | 1.45 | 1.48 | 43.1% | 47.1% |
| R | 6.33 | 6.04 | 1.27 | 1.29 | 33.1% | 35.9% |
| B | 5.87 | 5.87 | 1.23 | 1.22 | 30.5% | 31.8% |
| Q | 4.72 | 4.83 | 0.90 | 0.88 | 70.2% | 72.4% |
| L | 2.83 | 2.69 | 0.87 | 0.81 | 6.9% | 7.7% |
| G | 2.45 | 2.31 | 0.00 | 0.00 | 97.5% | 96.7% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 3.37 | 3.34 |
| beastChainMoves | 0.91 | 0.90 |
| beastChainCaptures | 1.45 | 1.48 |
| maesterSwaps | 4.58 | 4.40 |
| maesterLongSwaps | 0.51 | 0.47 |
| paladinSacrifices | 0.48 | 0.47 |
| promotions | 0.22 | 0.22 |
| checks | 3.65 | 3.64 |
| ogreShoves | 2.84 | 2.58 |
| ogreShovesFriend | 2.67 | 2.38 |
| ogreShovesGuard | 0.02 | 0.01 |
| catapultChecks | 0.00 | 0.00 |

The pooled columns describe each whole population; the difference column is the mean over the
40 shared arrangements of (rule − base) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
