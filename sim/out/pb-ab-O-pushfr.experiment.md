# Rule A/B — pb-ab-O-pushfr

`ogreMode=push ogreShoveFriends=friends` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-O-shovefr.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.532 | 0.538 | +0.006 ± 0.033 | no |
| decisive | 0.795 | 0.824 | +0.029 ± 0.030 | no |
| draw rate | 0.198 | 0.169 | -0.029 ± 0.029 | yes |
| capped | 0.007 | 0.007 | +0.000 ± 0.005 | no |
| mean plies | 105.0 | 103.8 | -1.3 ± 3.1 | no |
| branching factor | 32.2 | 32.6 | +0.4 ± 0.3 | yes |
| killer move | 0.363 | 0.390 | +0.027 ± 0.019 | yes |
| lead change | 0.066 | 0.068 | +0.001 ± 0.004 | no |
| uncertainty late | 0.636 | 0.637 | +0.001 ± 0.003 | no |
| drama | 0.161 | 0.167 | +0.006 ± 0.012 | no |
| permanence | 0.955 | 0.953 | -0.002 ± 0.001 | yes |
| min utilisation | 0.41 | 0.41 | +0.01 ± 0.01 | no |
| interest | 0.492 | 0.497 | +0.006 ± 0.006 | yes |
| interest (min-use) | 0.449 | 0.493 | +0.015 ± 0.014 | yes |
| killerMove (resid.) | -0.008 | 0.008 | +0.016 ± 0.014 | yes |
| leadChange (resid.) | -0.001 | 0.001 | +0.003 ± 0.003 | no |
| uncertaintyLate (resid.) | -0.002 | 0.002 | +0.004 ± 0.003 | yes |
| drama (resid.) | 0.000 | -0.000 | -0.001 ± 0.011 | no |
| permanence (resid.) | 0.000 | -0.000 | -0.000 ± 0.001 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.039 | -0.002 | -0.027 ± 0.009 | yes |
| interest (resid.) | 0.001 | 0.001 | +0.002 ± 0.004 | no |
| interestMinFairy (resid.) | -0.020 | 0.016 | +0.008 ± 0.011 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 8 (0.5%) | 17 (1.1%) |
| games where a king never moved | 430 (26.9%) | 429 (26.8%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 21.39 | 21.09 | 3.54 | 3.55 | 42.4% | 42.0% |
| A | 14.22 | 13.99 | 3.37 | 3.36 | 55.2% | 52.4% |
| O | 11.57 | 10.44 | 0.81 | 1.12 | 66.8% | 54.0% |
| K | 10.18 | 10.29 | 0.80 | 0.82 | 100.0% | 100.0% |
| M | 9.94 | 9.61 | 0.92 | 0.90 | 34.8% | 34.6% |
| N | 8.34 | 8.05 | 1.40 | 1.39 | 15.3% | 15.5% |
| S | 7.21 | 7.29 | 1.45 | 1.45 | 43.1% | 46.7% |
| R | 6.33 | 6.54 | 1.27 | 1.33 | 33.1% | 33.4% |
| B | 5.87 | 5.82 | 1.23 | 1.24 | 30.5% | 29.7% |
| Q | 4.72 | 5.05 | 0.90 | 0.86 | 70.2% | 75.5% |
| L | 2.83 | 2.63 | 0.87 | 0.82 | 6.9% | 9.3% |
| G | 2.45 | 3.01 | 0.00 | 0.00 | 97.5% | 96.4% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 3.37 | 3.36 |
| beastChainMoves | 0.91 | 0.88 |
| beastChainCaptures | 1.45 | 1.45 |
| maesterSwaps | 4.58 | 4.33 |
| maesterLongSwaps | 0.51 | 0.48 |
| paladinSacrifices | 0.48 | 0.45 |
| promotions | 0.22 | 0.27 |
| checks | 3.65 | 3.77 |
| ogreShoves | 2.84 | 3.42 |
| ogreShovesFriend | 2.67 | 3.42 |
| ogreShovesGuard | 0.02 | 0.02 |
| catapultChecks | 0.00 | 0.00 |

The pooled columns describe each whole population; the difference column is the mean over the
40 shared arrangements of (rule − base) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
