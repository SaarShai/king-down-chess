# Rule A/B — pb-ab-O-step2

`ogreStep2=true` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-O-step2.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.532 | 0.537 | +0.004 ± 0.029 | no |
| decisive | 0.795 | 0.785 | -0.010 ± 0.028 | no |
| draw rate | 0.198 | 0.210 | +0.012 ± 0.028 | no |
| capped | 0.007 | 0.005 | -0.002 ± 0.005 | no |
| mean plies | 105.0 | 101.4 | -3.6 ± 2.5 | yes |
| branching factor | 32.2 | 33.2 | +1.1 ± 0.3 | yes |
| killer move | 0.363 | 0.362 | -0.000 ± 0.013 | no |
| lead change | 0.066 | 0.067 | +0.001 ± 0.003 | no |
| uncertainty late | 0.636 | 0.638 | +0.002 ± 0.002 | no |
| drama | 0.161 | 0.155 | -0.005 ± 0.011 | no |
| permanence | 0.955 | 0.954 | -0.000 ± 0.001 | no |
| min utilisation | 0.41 | 0.41 | +0.01 ± 0.01 | no |
| interest | 0.492 | 0.490 | -0.001 ± 0.005 | no |
| interest (min-use) | 0.449 | 0.437 | -0.006 ± 0.011 | no |
| killerMove (resid.) | -0.002 | 0.002 | +0.004 ± 0.012 | no |
| leadChange (resid.) | 0.000 | -0.000 | -0.000 ± 0.003 | no |
| uncertaintyLate (resid.) | -0.000 | 0.000 | +0.000 ± 0.003 | no |
| drama (resid.) | 0.001 | -0.001 | -0.002 ± 0.009 | no |
| permanence (resid.) | 0.000 | -0.000 | -0.001 ± 0.001 | no |
| fairyUse (resid.) | 0.001 | 0.001 | -0.002 ± 0.003 | no |
| excessDecisiveness (resid.) | 0.020 | -0.001 | +0.011 ± 0.012 | no |
| interest (resid.) | 0.001 | 0.000 | +0.001 ± 0.003 | no |
| interestMinFairy (resid.) | -0.015 | -0.024 | -0.003 ± 0.011 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 8 (0.5%) | 12 (0.8%) |
| games where a king never moved | 430 (26.9%) | 433 (27.1%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 21.39 | 21.04 | 3.54 | 3.57 | 42.4% | 43.2% |
| A | 14.22 | 13.59 | 3.37 | 3.28 | 55.2% | 52.8% |
| O | 11.57 | 11.51 | 0.81 | 1.11 | 66.8% | 52.0% |
| K | 10.18 | 9.38 | 0.80 | 0.74 | 100.0% | 100.0% |
| M | 9.94 | 9.43 | 0.92 | 0.93 | 34.8% | 35.6% |
| N | 8.34 | 8.08 | 1.40 | 1.37 | 15.3% | 16.1% |
| S | 7.21 | 6.97 | 1.45 | 1.42 | 43.1% | 43.0% |
| R | 6.33 | 6.09 | 1.27 | 1.32 | 33.1% | 33.5% |
| B | 5.87 | 5.71 | 1.23 | 1.21 | 30.5% | 29.8% |
| Q | 4.72 | 4.59 | 0.90 | 0.90 | 70.2% | 70.9% |
| L | 2.83 | 2.79 | 0.87 | 0.85 | 6.9% | 8.7% |
| G | 2.45 | 2.21 | 0.00 | 0.00 | 97.5% | 97.0% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 3.37 | 3.28 |
| beastChainMoves | 0.91 | 0.90 |
| beastChainCaptures | 1.45 | 1.42 |
| maesterSwaps | 4.58 | 4.36 |
| maesterLongSwaps | 0.51 | 0.48 |
| paladinSacrifices | 0.48 | 0.47 |
| promotions | 0.22 | 0.23 |
| checks | 3.65 | 3.56 |
| ogreShoves | 2.84 | 2.73 |
| ogreShovesFriend | 2.67 | 2.53 |
| ogreShovesGuard | 0.02 | 0.02 |
| catapultChecks | 0.00 | 0.00 |

The pooled columns describe each whole population; the difference column is the mean over the
40 shared arrangements of (rule − base) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
