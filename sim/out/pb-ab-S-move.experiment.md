# Rule A/B — pb-ab-S-move

`beastMove=forward` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-S-move.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.544 | 0.557 | +0.014 ± 0.019 | no |
| decisive | 0.714 | 0.736 | +0.022 ± 0.025 | no |
| draw rate | 0.274 | 0.252 | -0.022 ± 0.025 | no |
| capped | 0.012 | 0.012 | +0.000 ± 0.006 | no |
| mean plies | 118.0 | 118.9 | +0.9 ± 3.5 | no |
| branching factor | 32.6 | 29.8 | -2.8 ± 0.6 | yes |
| killer move | 0.325 | 0.326 | +0.001 ± 0.013 | no |
| lead change | 0.064 | 0.059 | -0.005 ± 0.004 | yes |
| uncertainty late | 0.648 | 0.644 | -0.004 ± 0.003 | yes |
| drama | 0.127 | 0.132 | +0.005 ± 0.008 | no |
| permanence | 0.962 | 0.962 | +0.001 ± 0.001 | no |
| min utilisation | 0.45 | 0.46 | +0.01 ± 0.01 | yes |
| interest | 0.482 | 0.483 | -0.001 ± 0.006 | no |
| interest (min-use) | 0.482 | 0.399 | -0.060 ± 0.012 | yes |
| killerMove (resid.) | 0.002 | -0.002 | -0.005 ± 0.011 | no |
| leadChange (resid.) | 0.001 | -0.001 | -0.002 ± 0.005 | no |
| uncertaintyLate (resid.) | 0.000 | -0.000 | -0.000 ± 0.003 | no |
| drama (resid.) | -0.002 | 0.002 | +0.004 ± 0.007 | no |
| permanence (resid.) | -0.001 | 0.001 | +0.001 ± 0.001 | yes |
| fairyUse (resid.) | 0.004 | 0.004 | -0.008 ± 0.016 | no |
| excessDecisiveness (resid.) | 0.020 | -0.003 | -0.020 ± 0.010 | yes |
| interest (resid.) | 0.002 | 0.001 | -0.003 ± 0.005 | no |
| interestMinFairy (resid.) | 0.041 | -0.045 | -0.062 ± 0.012 | yes |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 24 (1.5%) | 36 (2.3%) |
| games where a king never moved | 289 (18.1%) | 266 (16.6%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 26.41 | 27.36 | 4.54 | 4.65 | 41.3% | 40.3% |
| M | 16.21 | 17.27 | 1.72 | 1.77 | 36.7% | 34.2% |
| K | 13.26 | 15.25 | 0.93 | 1.02 | 100.0% | 100.0% |
| A | 12.40 | 12.68 | 2.09 | 2.17 | 44.3% | 43.6% |
| R | 11.04 | 11.68 | 1.74 | 1.91 | 40.6% | 37.6% |
| S | 9.85 | 4.32 | 1.25 | 0.72 | 32.9% | 55.9% |
| N | 8.29 | 8.39 | 1.69 | 1.65 | 9.7% | 8.7% |
| Q | 6.30 | 6.50 | 1.02 | 1.03 | 76.5% | 73.5% |
| B | 6.21 | 6.66 | 1.42 | 1.41 | 23.8% | 24.4% |
| L | 4.42 | 4.31 | 1.27 | 1.25 | 6.1% | 5.5% |
| G | 3.63 | 4.50 | 0.00 | 0.00 | 96.7% | 96.4% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.09 | 2.17 |
| beastChainMoves | 0.99 | 0.62 |
| beastChainCaptures | 1.25 | 0.72 |
| maesterSwaps | 7.26 | 7.79 |
| maesterLongSwaps | 0.81 | 0.89 |
| paladinSacrifices | 0.62 | 0.59 |
| promotions | 0.31 | 0.33 |
| checks | 4.27 | 4.07 |
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
