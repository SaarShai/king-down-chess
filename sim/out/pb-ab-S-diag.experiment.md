# Rule A/B — pb-ab-S-diag

`beastMove=diagFwdBack` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-S-diag.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.541 | 0.565 | +0.024 ± 0.023 | yes |
| decisive | 0.791 | 0.800 | +0.009 ± 0.018 | no |
| draw rate | 0.204 | 0.190 | -0.014 ± 0.018 | no |
| capped | 0.004 | 0.010 | +0.006 ± 0.004 | yes |
| mean plies | 110.8 | 109.2 | -1.5 ± 2.8 | no |
| branching factor | 32.3 | 31.1 | -1.1 ± 0.4 | yes |
| killer move | 0.345 | 0.334 | -0.011 ± 0.014 | no |
| lead change | 0.059 | 0.060 | +0.001 ± 0.004 | no |
| uncertainty late | 0.634 | 0.632 | -0.002 ± 0.003 | no |
| drama | 0.146 | 0.155 | +0.009 ± 0.009 | yes |
| permanence | 0.958 | 0.958 | -0.001 ± 0.001 | no |
| min utilisation | 0.43 | 0.43 | +0.00 ± 0.01 | no |
| interest | 0.487 | 0.486 | -0.002 ± 0.004 | no |
| interest (min-use) | 0.480 | 0.486 | -0.004 ± 0.007 | no |
| killerMove (resid.) | 0.007 | -0.007 | -0.013 ± 0.014 | no |
| leadChange (resid.) | -0.001 | 0.001 | +0.003 ± 0.004 | no |
| uncertaintyLate (resid.) | -0.000 | 0.000 | +0.000 ± 0.003 | no |
| drama (resid.) | -0.003 | 0.003 | +0.007 ± 0.008 | no |
| permanence (resid.) | 0.000 | -0.000 | -0.000 ± 0.001 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.009 | 0.003 | -0.013 ± 0.010 | yes |
| interest (resid.) | 0.002 | -0.001 | -0.003 ± 0.003 | no |
| interestMinFairy (resid.) | 0.008 | 0.012 | -0.006 ± 0.007 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 18 (1.1%) | 15 (0.9%) |
| games where a king never moved | 380 (23.8%) | 408 (25.5%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 23.79 | 23.71 | 3.84 | 3.83 | 40.3% | 40.8% |
| A | 15.17 | 15.03 | 3.57 | 3.73 | 55.0% | 55.5% |
| M | 15.10 | 15.13 | 1.49 | 1.50 | 37.3% | 38.6% |
| K | 11.43 | 11.46 | 0.82 | 0.80 | 100.0% | 100.0% |
| S | 9.51 | 7.56 | 1.22 | 0.98 | 31.9% | 36.7% |
| R | 9.38 | 9.75 | 1.74 | 1.73 | 36.6% | 37.2% |
| N | 7.86 | 8.03 | 1.54 | 1.53 | 11.8% | 10.8% |
| B | 5.83 | 5.70 | 1.35 | 1.27 | 26.7% | 28.8% |
| Q | 5.70 | 5.73 | 0.99 | 0.96 | 74.3% | 72.0% |
| L | 4.18 | 4.14 | 1.16 | 1.16 | 6.7% | 7.6% |
| G | 2.84 | 3.00 | 0.00 | 0.00 | 97.3% | 97.5% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 3.57 | 3.73 |
| beastChainMoves | 0.95 | 0.78 |
| beastChainCaptures | 1.22 | 0.98 |
| maesterSwaps | 6.64 | 6.63 |
| maesterLongSwaps | 0.82 | 0.79 |
| paladinSacrifices | 0.57 | 0.56 |
| promotions | 0.29 | 0.27 |
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
