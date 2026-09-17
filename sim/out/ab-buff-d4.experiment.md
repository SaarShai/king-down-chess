# Rule A/B — ab-buff-d4

`archerMove=any guardCaptures=pawns guardStep=2 beastMove=any` against today's defaults.
1200 games per population, depth 4, the same 60 arrangements and the same
opening seeds in both (common random numbers).

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the mean paired
difference over arrangements; with few arrangements, and with one interval per metric, read
"significant" as "worth a second run", not as a test.

| metric | defaults (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.529 | 0.508 | -0.020 ± 0.029 | no |
| decisive | 0.541 | 0.457 | -0.084 ± 0.053 | yes |
| draw rate | 0.357 | 0.472 | +0.116 ± 0.050 | yes |
| capped | 0.102 | 0.071 | -0.032 ± 0.023 | yes |
| mean plies | 156.8 | 154.6 | -2.3 ± 6.6 | no |
| branching factor | 28.6 | 33.7 | +5.1 ± 0.6 | yes |
| killer move | 0.187 | 0.194 | +0.006 ± 0.010 | no |
| lead change | 0.031 | 0.028 | -0.003 ± 0.004 | no |
| uncertainty late | 0.621 | 0.620 | -0.002 ± 0.005 | no |
| drama | 0.093 | 0.084 | -0.008 ± 0.014 | no |
| permanence | 0.966 | 0.967 | +0.001 ± 0.001 | yes |
| min utilisation | 0.37 | 0.29 | -0.07 ± 0.02 | yes |
| interest | 0.455 | 0.457 | +0.001 ± 0.005 | no |
| interest (min-use) | 0.348 | 0.395 | +0.049 ± 0.015 | yes |
| killerMove (resid.) | -0.003 | 0.003 | +0.006 ± 0.010 | no |
| leadChange (resid.) | 0.002 | -0.002 | -0.004 ± 0.003 | yes |
| uncertaintyLate (resid.) | 0.003 | -0.003 | -0.006 ± 0.005 | yes |
| drama (resid.) | -0.007 | 0.007 | +0.013 ± 0.010 | yes |
| permanence (resid.) | -0.001 | 0.001 | +0.001 ± 0.001 | yes |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | -0.006 | 0.125 | +0.097 ± 0.033 | yes |
| interest (resid.) | -0.002 | 0.009 | +0.009 ± 0.004 | yes |
| interestMinFairy (resid.) | -0.057 | -0.003 | +0.055 ± 0.014 | yes |

## Degeneracy counters
| counter | defaults | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 5.151 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 713 (59.4%) |
| dead-material endings (draw50 + drawMaterial) | 141 (11.8%) | 219 (18.3%) |
| games where a king never moved | 196 (16.3%) | 228 (19.0%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 29.29 | 22.62 | 5.59 | 3.81 | 24.4% | 17.7% |
| M | 24.01 | 18.01 | 1.51 | 1.10 | 50.6% | 51.4% |
| K | 21.97 | 18.29 | 1.26 | 1.11 | 100.0% | 100.0% |
| G | 19.68 | 28.56 | 0.00 | 5.15 | 95.4% | 89.4% |
| R | 14.66 | 13.33 | 2.18 | 1.74 | 33.2% | 34.6% |
| A | 14.30 | 15.44 | 2.72 | 2.10 | 71.3% | 46.8% |
| N | 11.14 | 10.05 | 2.03 | 1.87 | 17.0% | 13.2% |
| B | 9.36 | 8.39 | 1.80 | 1.56 | 20.0% | 19.7% |
| Q | 5.19 | 4.86 | 0.99 | 0.89 | 24.0% | 23.0% |
| S | 3.65 | 11.68 | 0.46 | 0.99 | 60.7% | 50.8% |
| L | 3.59 | 3.34 | 0.69 | 0.69 | 5.4% | 5.8% |

## Fairy events per game
| event | defaults | with the rule |
|---|---|---|
| archerShots | 2.72 | 2.10 |
| beastChainMoves | 0.41 | 0.88 |
| beastChainCaptures | 0.46 | 0.99 |
| maesterSwaps | 8.52 | 6.50 |
| maesterLongSwaps | 1.76 | 1.82 |
| paladinSacrifices | 0.69 | 0.69 |
| promotions | 0.16 | 0.12 |
| checks | 3.24 | 4.03 |

The pooled columns describe each whole population; the difference column is the mean over the
60 arrangements of (rule − default) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
