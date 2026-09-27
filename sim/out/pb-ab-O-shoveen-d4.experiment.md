# Rule A/B — pb-ab-O-shoveen-d4

`ogreShoveFriends=enemies` against today's defaults.
1600 games per population, depth 4, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-O-push-d4b.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.509 | 0.544 | +0.036 ± 0.027 | yes |
| decisive | 0.676 | 0.691 | +0.015 ± 0.032 | no |
| draw rate | 0.306 | 0.290 | -0.016 ± 0.031 | no |
| capped | 0.018 | 0.019 | +0.001 ± 0.011 | no |
| mean plies | 111.9 | 112.4 | +0.5 ± 3.8 | no |
| branching factor | 30.9 | 29.8 | -1.1 ± 0.7 | yes |
| killer move | 0.221 | 0.221 | +0.000 ± 0.010 | no |
| lead change | 0.042 | 0.042 | -0.001 ± 0.003 | no |
| uncertainty late | 0.625 | 0.625 | +0.000 ± 0.005 | no |
| drama | 0.131 | 0.133 | +0.002 ± 0.011 | no |
| permanence | 0.966 | 0.967 | +0.000 ± 0.001 | no |
| min utilisation | 0.38 | 0.41 | +0.03 ± 0.01 | yes |
| interest | 0.463 | 0.463 | +0.000 ± 0.004 | no |
| interest (min-use) | 0.449 | 0.441 | +0.002 ± 0.011 | no |
| killerMove (resid.) | 0.002 | -0.002 | -0.004 ± 0.010 | no |
| leadChange (resid.) | 0.000 | -0.000 | -0.000 ± 0.003 | no |
| uncertaintyLate (resid.) | -0.001 | 0.001 | +0.003 ± 0.004 | no |
| drama (resid.) | 0.001 | -0.001 | -0.002 ± 0.010 | no |
| permanence (resid.) | -0.000 | 0.000 | +0.001 ± 0.001 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.027 | -0.005 | -0.016 ± 0.012 | yes |
| interest (resid.) | 0.002 | -0.001 | -0.001 ± 0.003 | no |
| interestMinFairy (resid.) | 0.006 | -0.005 | -0.001 ± 0.010 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 36 (2.3%) | 32 (2.0%) |
| games where a king never moved | 456 (28.5%) | 447 (27.9%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 21.17 | 23.19 | 3.57 | 3.82 | 38.0% | 37.9% |
| A | 15.96 | 15.28 | 3.73 | 3.56 | 53.9% | 52.7% |
| K | 14.35 | 14.11 | 1.16 | 1.08 | 100.0% | 100.0% |
| O | 11.35 | 9.72 | 0.97 | 0.92 | 65.3% | 68.1% |
| M | 9.76 | 9.93 | 0.97 | 0.95 | 36.4% | 34.7% |
| N | 8.31 | 8.31 | 1.50 | 1.50 | 14.6% | 15.5% |
| S | 7.60 | 7.60 | 1.18 | 1.11 | 49.2% | 47.6% |
| B | 6.43 | 6.36 | 1.32 | 1.32 | 28.5% | 28.9% |
| R | 6.40 | 6.92 | 1.35 | 1.39 | 30.4% | 32.4% |
| Q | 4.84 | 5.29 | 0.83 | 0.91 | 46.6% | 50.0% |
| G | 3.08 | 2.98 | 0.00 | 0.00 | 92.2% | 91.9% |
| L | 2.67 | 2.70 | 0.93 | 0.89 | 6.2% | 5.3% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 3.73 | 3.56 |
| beastChainMoves | 0.93 | 0.86 |
| beastChainCaptures | 1.18 | 1.11 |
| maesterSwaps | 4.05 | 4.18 |
| maesterLongSwaps | 0.52 | 0.52 |
| paladinSacrifices | 0.49 | 0.49 |
| promotions | 0.11 | 0.11 |
| checks | 5.86 | 5.65 |
| ogreShoves | 2.58 | 0.24 |
| ogreShovesFriend | 2.36 | 0.00 |
| ogreShovesGuard | 0.02 | 0.02 |
| catapultChecks | 0.00 | 0.00 |

The pooled columns describe each whole population; the difference column is the mean over the
40 shared arrangements of (rule − base) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
