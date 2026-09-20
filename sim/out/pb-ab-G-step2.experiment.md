# Rule A/B — pb-ab-G-step2

`guardStep=2` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-G-step2.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.541 | 0.540 | -0.001 ± 0.012 | no |
| decisive | 0.791 | 0.786 | -0.005 ± 0.016 | no |
| draw rate | 0.204 | 0.209 | +0.004 ± 0.015 | no |
| capped | 0.004 | 0.005 | +0.001 ± 0.004 | no |
| mean plies | 110.8 | 113.7 | +2.9 ± 2.3 | yes |
| branching factor | 32.3 | 32.8 | +0.5 ± 0.2 | yes |
| killer move | 0.345 | 0.347 | +0.002 ± 0.010 | no |
| lead change | 0.059 | 0.058 | -0.001 ± 0.002 | no |
| uncertainty late | 0.634 | 0.634 | -0.000 ± 0.001 | no |
| drama | 0.146 | 0.146 | +0.000 ± 0.007 | no |
| permanence | 0.958 | 0.958 | +0.000 ± 0.000 | no |
| min utilisation | 0.43 | 0.42 | -0.01 ± 0.01 | yes |
| interest | 0.487 | 0.487 | +0.001 ± 0.003 | no |
| interest (min-use) | 0.480 | 0.487 | +0.007 ± 0.006 | yes |
| killerMove (resid.) | -0.002 | 0.002 | +0.003 ± 0.007 | no |
| leadChange (resid.) | 0.000 | -0.000 | -0.001 ± 0.001 | no |
| uncertaintyLate (resid.) | 0.000 | -0.000 | -0.001 ± 0.002 | no |
| drama (resid.) | -0.001 | 0.001 | +0.001 ± 0.005 | no |
| permanence (resid.) | -0.000 | 0.000 | +0.000 ± 0.000 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.000 | -0.003 | +0.004 ± 0.006 | no |
| interest (resid.) | -0.000 | 0.000 | +0.001 ± 0.002 | no |
| interestMinFairy (resid.) | 0.001 | 0.009 | +0.008 ± 0.006 | yes |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 18 (1.1%) | 29 (1.8%) |
| games where a king never moved | 380 (23.8%) | 377 (23.6%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 23.79 | 23.95 | 3.84 | 3.86 | 40.3% | 39.8% |
| A | 15.17 | 15.56 | 3.57 | 3.63 | 55.0% | 54.3% |
| M | 15.10 | 14.98 | 1.49 | 1.51 | 37.3% | 36.8% |
| K | 11.43 | 11.96 | 0.82 | 0.85 | 100.0% | 100.0% |
| S | 9.51 | 9.67 | 1.22 | 1.22 | 31.9% | 29.7% |
| R | 9.38 | 9.83 | 1.74 | 1.76 | 36.6% | 37.3% |
| N | 7.86 | 7.93 | 1.54 | 1.53 | 11.8% | 11.4% |
| B | 5.83 | 5.88 | 1.35 | 1.36 | 26.7% | 26.7% |
| Q | 5.70 | 5.69 | 0.99 | 0.97 | 74.3% | 73.4% |
| L | 4.18 | 4.14 | 1.16 | 1.16 | 6.7% | 6.8% |
| G | 2.84 | 4.09 | 0.00 | 0.00 | 97.3% | 96.6% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 3.57 | 3.63 |
| beastChainMoves | 0.95 | 0.97 |
| beastChainCaptures | 1.22 | 1.22 |
| maesterSwaps | 6.64 | 6.53 |
| maesterLongSwaps | 0.82 | 0.80 |
| paladinSacrifices | 0.57 | 0.57 |
| promotions | 0.29 | 0.29 |
| checks | 4.25 | 4.33 |
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
