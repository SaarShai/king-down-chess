# Rule A/B — pb-ab-S-fwd

`beastCaptureForward=true` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-S-fwd.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.541 | 0.549 | +0.008 ± 0.025 | no |
| decisive | 0.791 | 0.809 | +0.018 ± 0.021 | no |
| draw rate | 0.204 | 0.186 | -0.019 ± 0.021 | no |
| capped | 0.004 | 0.005 | +0.001 ± 0.003 | no |
| mean plies | 110.8 | 100.1 | -10.7 ± 3.5 | yes |
| branching factor | 32.3 | 33.2 | +0.9 ± 0.4 | yes |
| killer move | 0.345 | 0.376 | +0.032 ± 0.018 | yes |
| lead change | 0.059 | 0.065 | +0.006 ± 0.004 | yes |
| uncertainty late | 0.634 | 0.632 | -0.003 ± 0.004 | no |
| drama | 0.146 | 0.147 | +0.001 ± 0.010 | no |
| permanence | 0.958 | 0.951 | -0.008 ± 0.003 | yes |
| min utilisation | 0.43 | 0.43 | -0.00 ± 0.01 | no |
| interest | 0.487 | 0.491 | +0.005 ± 0.005 | no |
| interest (min-use) | 0.480 | 0.483 | +0.002 ± 0.007 | no |
| killerMove (resid.) | -0.014 | 0.014 | +0.027 ± 0.016 | yes |
| leadChange (resid.) | -0.004 | 0.004 | +0.007 ± 0.004 | yes |
| uncertaintyLate (resid.) | -0.000 | 0.000 | +0.000 ± 0.003 | no |
| drama (resid.) | 0.000 | -0.000 | -0.000 ± 0.009 | no |
| permanence (resid.) | 0.003 | -0.003 | -0.007 ± 0.002 | yes |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.011 | -0.005 | -0.018 ± 0.004 | yes |
| interest (resid.) | -0.001 | 0.002 | +0.003 ± 0.004 | no |
| interestMinFairy (resid.) | 0.006 | 0.006 | -0.001 ± 0.006 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 18 (1.1%) | 22 (1.4%) |
| games where a king never moved | 380 (23.8%) | 528 (33.0%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 23.79 | 21.70 | 3.84 | 3.43 | 40.3% | 44.1% |
| A | 15.17 | 13.56 | 3.57 | 3.17 | 55.0% | 57.3% |
| M | 15.10 | 13.27 | 1.49 | 1.16 | 37.3% | 44.5% |
| K | 11.43 | 9.56 | 0.82 | 0.74 | 100.0% | 100.0% |
| S | 9.51 | 8.87 | 1.22 | 1.84 | 31.9% | 37.1% |
| R | 9.38 | 8.53 | 1.74 | 1.58 | 36.6% | 40.3% |
| N | 7.86 | 7.80 | 1.54 | 1.49 | 11.8% | 14.8% |
| B | 5.83 | 5.38 | 1.35 | 1.21 | 26.7% | 31.3% |
| Q | 5.70 | 5.14 | 0.99 | 0.89 | 74.3% | 71.8% |
| L | 4.18 | 3.77 | 1.16 | 1.08 | 6.7% | 10.7% |
| G | 2.84 | 2.55 | 0.00 | 0.00 | 97.3% | 97.4% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 3.57 | 3.17 |
| beastChainMoves | 0.95 | 1.07 |
| beastChainCaptures | 1.22 | 1.84 |
| maesterSwaps | 6.64 | 6.20 |
| maesterLongSwaps | 0.82 | 0.76 |
| paladinSacrifices | 0.57 | 0.53 |
| promotions | 0.29 | 0.23 |
| checks | 4.25 | 3.75 |
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
