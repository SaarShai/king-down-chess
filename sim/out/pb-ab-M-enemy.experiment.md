# Rule A/B — pb-ab-M-enemy

`maesterSwapEnemy=true` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-M-enemy.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.541 | 0.536 | -0.005 ± 0.007 | no |
| decisive | 0.791 | 0.794 | +0.003 ± 0.007 | no |
| draw rate | 0.204 | 0.200 | -0.004 ± 0.007 | no |
| capped | 0.004 | 0.006 | +0.001 ± 0.002 | no |
| mean plies | 110.8 | 110.6 | -0.2 ± 0.7 | no |
| branching factor | 32.3 | 32.3 | +0.1 ± 0.1 | yes |
| killer move | 0.345 | 0.347 | +0.003 ± 0.005 | no |
| lead change | 0.059 | 0.059 | +0.000 ± 0.000 | no |
| uncertainty late | 0.634 | 0.634 | -0.000 ± 0.001 | no |
| drama | 0.146 | 0.148 | +0.003 ± 0.003 | no |
| permanence | 0.958 | 0.958 | -0.000 ± 0.000 | no |
| min utilisation | 0.43 | 0.43 | +0.00 ± 0.00 | no |
| interest | 0.487 | 0.488 | +0.001 ± 0.002 | no |
| interest (min-use) | 0.480 | 0.476 | -0.001 ± 0.004 | no |
| killerMove (resid.) | -0.001 | 0.001 | +0.001 ± 0.004 | no |
| leadChange (resid.) | -0.000 | 0.000 | +0.001 ± 0.001 | no |
| uncertaintyLate (resid.) | -0.000 | 0.000 | +0.001 ± 0.001 | no |
| drama (resid.) | -0.001 | 0.001 | +0.002 ± 0.002 | no |
| permanence (resid.) | 0.000 | -0.000 | -0.000 ± 0.000 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.004 | 0.006 | -0.004 ± 0.004 | no |
| interest (resid.) | -0.000 | 0.001 | +0.000 ± 0.001 | no |
| interestMinFairy (resid.) | 0.006 | 0.002 | -0.002 ± 0.004 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 18 (1.1%) | 16 (1.0%) |
| games where a king never moved | 380 (23.8%) | 383 (23.9%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 23.79 | 23.82 | 3.84 | 3.83 | 40.3% | 40.3% |
| A | 15.17 | 15.12 | 3.57 | 3.58 | 55.0% | 54.7% |
| M | 15.10 | 15.07 | 1.49 | 1.48 | 37.3% | 37.5% |
| K | 11.43 | 11.47 | 0.82 | 0.83 | 100.0% | 100.0% |
| S | 9.51 | 9.49 | 1.22 | 1.24 | 31.9% | 32.2% |
| R | 9.38 | 9.48 | 1.74 | 1.75 | 36.6% | 37.0% |
| N | 7.86 | 7.85 | 1.54 | 1.53 | 11.8% | 11.5% |
| B | 5.83 | 5.81 | 1.35 | 1.35 | 26.7% | 26.7% |
| Q | 5.70 | 5.55 | 0.99 | 0.96 | 74.3% | 75.7% |
| L | 4.18 | 4.18 | 1.16 | 1.16 | 6.7% | 6.9% |
| G | 2.84 | 2.77 | 0.00 | 0.00 | 97.3% | 97.1% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 3.57 | 3.58 |
| beastChainMoves | 0.95 | 0.96 |
| beastChainCaptures | 1.22 | 1.24 |
| maesterSwaps | 6.64 | 6.67 |
| maesterLongSwaps | 0.82 | 0.81 |
| paladinSacrifices | 0.57 | 0.57 |
| promotions | 0.29 | 0.29 |
| checks | 4.25 | 4.17 |
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
