# Rule A/B — ab-buff-big

`archerMove=any guardCaptures=pawns guardStep=2 beastMove=any` against today's defaults.
15000 games per population, depth 3, the same 150 arrangements and the same
opening seeds in both (common random numbers).

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the mean paired
difference over arrangements; with few arrangements, and with one interval per metric, read
"significant" as "worth a second run", not as a test.

| metric | defaults (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.524 | 0.521 | -0.002 ± 0.009 | no |
| decisive | 0.604 | 0.596 | -0.009 ± 0.022 | no |
| draw rate | 0.330 | 0.367 | +0.037 ± 0.019 | yes |
| capped | 0.066 | 0.037 | -0.029 ± 0.007 | yes |
| mean plies | 139.4 | 134.7 | -4.7 ± 2.6 | yes |
| branching factor | 27.7 | 32.9 | +5.2 ± 0.4 | yes |
| killer move | 0.306 | 0.301 | -0.005 ± 0.007 | no |
| lead change | 0.035 | 0.033 | -0.002 ± 0.001 | yes |
| uncertainty late | 0.639 | 0.636 | -0.003 ± 0.001 | yes |
| drama | 0.112 | 0.118 | +0.005 ± 0.005 | yes |
| permanence | 0.967 | 0.968 | +0.001 ± 0.000 | yes |
| min utilisation | 0.42 | 0.37 | -0.03 ± 0.01 | yes |
| interest | 0.481 | 0.481 | +0.000 ± 0.003 | no |
| interest (min-use) | 0.374 | 0.433 | +0.060 ± 0.010 | yes |
| killerMove (resid.) | -0.002 | 0.002 | +0.005 ± 0.005 | no |
| leadChange (resid.) | 0.001 | -0.001 | -0.003 ± 0.001 | yes |
| uncertaintyLate (resid.) | 0.003 | -0.003 | -0.006 ± 0.002 | yes |
| drama (resid.) | -0.006 | 0.006 | +0.013 ± 0.003 | yes |
| permanence (resid.) | -0.000 | 0.000 | +0.001 ± 0.000 | yes |
| fairyUse (resid.) | 0.002 | 0.001 | +0.002 ± 0.004 | no |
| excessDecisiveness (resid.) | -0.001 | 0.044 | +0.041 ± 0.011 | yes |
| interest (resid.) | -0.001 | 0.004 | +0.005 ± 0.002 | yes |
| interestMinFairy (resid.) | -0.058 | 0.007 | +0.066 ± 0.009 | yes |

## Degeneracy counters
| counter | defaults | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 3.407 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 6550 (43.7%) |
| dead-material endings (draw50 + drawMaterial) | 1489 (9.9%) | 1592 (10.6%) |
| games where a king never moved | 3038 (20.3%) | 3294 (22.0%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 29.33 | 25.22 | 5.84 | 4.75 | 28.9% | 20.9% |
| M | 21.14 | 13.61 | 1.26 | 1.05 | 53.7% | 50.8% |
| K | 18.70 | 16.08 | 1.16 | 1.14 | 100.0% | 100.0% |
| G | 16.22 | 18.99 | 0.00 | 3.41 | 97.9% | 94.1% |
| R | 13.04 | 12.54 | 2.11 | 1.87 | 29.4% | 30.9% |
| A | 11.42 | 13.81 | 2.08 | 2.02 | 73.0% | 50.3% |
| N | 10.00 | 9.01 | 1.89 | 1.75 | 15.2% | 11.6% |
| B | 7.60 | 6.86 | 1.53 | 1.43 | 19.5% | 17.0% |
| Q | 4.99 | 4.75 | 1.04 | 0.99 | 43.1% | 37.5% |
| S | 3.63 | 10.80 | 0.57 | 1.28 | 69.7% | 50.6% |
| L | 3.31 | 3.03 | 0.62 | 0.62 | 6.3% | 6.6% |

## Fairy events per game
| event | defaults | with the rule |
|---|---|---|
| archerShots | 2.08 | 2.02 |
| beastChainMoves | 0.50 | 1.10 |
| beastChainCaptures | 0.57 | 1.28 |
| maesterSwaps | 8.24 | 4.92 |
| maesterLongSwaps | 1.61 | 1.31 |
| paladinSacrifices | 0.62 | 0.62 |
| promotions | 0.36 | 0.29 |
| checks | 6.48 | 8.24 |

The pooled columns describe each whole population; the difference column is the mean over the
150 arrangements of (rule − default) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
