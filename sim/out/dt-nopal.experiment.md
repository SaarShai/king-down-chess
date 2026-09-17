# Rule A/B — dt-nopal

`secondPlayerDoubleFirstTurn=true` against today's defaults.
4000 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `dt-nopal-base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.526 | 0.490 | -0.036 ± 0.022 | yes |
| decisive | 0.705 | 0.718 | +0.013 ± 0.025 | no |
| draw rate | 0.282 | 0.271 | -0.011 ± 0.025 | no |
| capped | 0.013 | 0.011 | -0.003 ± 0.004 | no |
| mean plies | 119.6 | 118.1 | -1.5 ± 1.6 | no |
| branching factor | 30.9 | 31.0 | +0.1 ± 0.1 | no |
| killer move | 0.335 | 0.342 | +0.007 ± 0.009 | no |
| lead change | 0.076 | 0.078 | +0.002 ± 0.004 | no |
| uncertainty late | 0.656 | 0.656 | -0.001 ± 0.003 | no |
| drama | 0.135 | 0.141 | +0.006 ± 0.005 | yes |
| permanence | 0.960 | 0.960 | -0.001 ± 0.001 | yes |
| min utilisation | 0.45 | 0.45 | +0.00 ± 0.00 | yes |
| interest | 0.484 | 0.486 | +0.002 ± 0.003 | no |
| interest (min-use) | 0.484 | 0.486 | -0.003 ± 0.006 | no |
| killerMove (resid.) | -0.001 | 0.001 | +0.002 ± 0.010 | no |
| leadChange (resid.) | -0.001 | 0.001 | +0.003 ± 0.004 | no |
| uncertaintyLate (resid.) | -0.000 | 0.000 | +0.001 ± 0.003 | no |
| drama (resid.) | -0.002 | 0.002 | +0.004 ± 0.006 | no |
| permanence (resid.) | 0.000 | -0.000 | -0.000 ± 0.001 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.017 | 0.002 | -0.011 ± 0.010 | yes |
| interest (resid.) | 0.001 | 0.000 | -0.000 ± 0.002 | no |
| interestMinFairy (resid.) | 0.010 | 0.010 | -0.004 ± 0.006 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 69 (1.7%) | 56 (1.4%) |
| games where a king never moved | 730 (18.3%) | 786 (19.7%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 26.89 | 26.82 | 4.69 | 4.66 | 40.0% | 40.4% |
| A | 14.82 | 14.86 | 2.60 | 2.62 | 49.0% | 50.4% |
| M | 14.77 | 14.53 | 1.69 | 1.62 | 31.3% | 31.7% |
| K | 13.83 | 13.40 | 1.07 | 1.04 | 100.0% | 100.0% |
| R | 12.31 | 12.04 | 1.98 | 2.00 | 42.1% | 42.3% |
| N | 8.94 | 9.06 | 1.82 | 1.82 | 10.6% | 11.0% |
| S | 8.11 | 8.15 | 1.15 | 1.17 | 29.0% | 32.2% |
| B | 7.52 | 7.31 | 1.76 | 1.72 | 22.7% | 23.5% |
| Q | 6.70 | 6.29 | 1.22 | 1.15 | 72.5% | 73.1% |
| G | 5.71 | 5.60 | 0.00 | 0.00 | 95.7% | 96.0% |
| L | 0.00 | 0.00 | 0.00 | 0.00 | 0.0% | 0.0% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.60 | 2.62 |
| beastChainMoves | 0.92 | 0.93 |
| beastChainCaptures | 1.15 | 1.17 |
| maesterSwaps | 6.46 | 6.38 |
| maesterLongSwaps | 0.70 | 0.72 |
| paladinSacrifices | 0.00 | 0.00 |
| promotions | 0.31 | 0.29 |
| checks | 4.58 | 4.30 |

The pooled columns describe each whole population; the difference column is the mean over the
40 shared arrangements of (rule − base) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
