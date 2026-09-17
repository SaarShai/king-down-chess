# Rule A/B — dt-full

`secondPlayerDoubleFirstTurn=true` against today's defaults.
4000 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `dt-full-base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.533 | 0.472 | -0.062 ± 0.026 | yes |
| decisive | 0.739 | 0.750 | +0.011 ± 0.019 | no |
| draw rate | 0.254 | 0.239 | -0.014 ± 0.018 | no |
| capped | 0.008 | 0.011 | +0.004 ± 0.003 | yes |
| mean plies | 114.4 | 114.5 | +0.1 ± 2.0 | no |
| branching factor | 33.0 | 33.1 | +0.0 ± 0.2 | no |
| killer move | 0.326 | 0.336 | +0.010 ± 0.010 | yes |
| lead change | 0.064 | 0.065 | +0.001 ± 0.004 | no |
| uncertainty late | 0.638 | 0.639 | +0.001 ± 0.003 | no |
| drama | 0.123 | 0.132 | +0.009 ± 0.006 | yes |
| permanence | 0.961 | 0.961 | -0.001 ± 0.001 | yes |
| min utilisation | 0.46 | 0.46 | +0.00 ± 0.01 | no |
| interest | 0.480 | 0.483 | +0.003 ± 0.003 | no |
| interest (min-use) | 0.469 | 0.471 | -0.001 ± 0.005 | no |
| killerMove (resid.) | -0.003 | 0.003 | +0.006 ± 0.009 | no |
| leadChange (resid.) | -0.001 | 0.001 | +0.002 ± 0.004 | no |
| uncertaintyLate (resid.) | -0.001 | 0.001 | +0.003 ± 0.003 | yes |
| drama (resid.) | -0.004 | 0.004 | +0.007 ± 0.006 | yes |
| permanence (resid.) | 0.000 | -0.000 | -0.000 ± 0.001 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.005 | -0.003 | -0.014 ± 0.005 | yes |
| interest (resid.) | -0.001 | 0.001 | +0.001 ± 0.002 | no |
| interestMinFairy (resid.) | 0.003 | 0.003 | -0.003 ± 0.005 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 60 (1.5%) | 57 (1.4%) |
| games where a king never moved | 636 (15.9%) | 661 (16.5%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 26.22 | 26.39 | 4.63 | 4.72 | 42.1% | 41.8% |
| K | 13.24 | 13.08 | 0.96 | 0.94 | 100.0% | 100.0% |
| M | 13.12 | 13.23 | 1.42 | 1.44 | 34.7% | 36.2% |
| A | 11.93 | 11.69 | 2.07 | 2.00 | 43.2% | 44.0% |
| R | 10.58 | 10.55 | 1.67 | 1.66 | 43.2% | 41.8% |
| S | 9.02 | 9.11 | 1.19 | 1.24 | 31.1% | 29.9% |
| Q | 8.61 | 8.64 | 1.52 | 1.49 | 63.2% | 67.2% |
| N | 8.42 | 8.34 | 1.71 | 1.72 | 11.1% | 10.9% |
| B | 6.24 | 6.39 | 1.42 | 1.47 | 25.5% | 24.4% |
| L | 4.23 | 4.19 | 0.86 | 0.83 | 9.5% | 9.9% |
| G | 2.73 | 2.87 | 0.00 | 0.00 | 96.5% | 96.3% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.07 | 2.00 |
| beastChainMoves | 0.95 | 0.96 |
| beastChainCaptures | 1.19 | 1.24 |
| maesterSwaps | 5.92 | 5.93 |
| maesterLongSwaps | 0.72 | 0.74 |
| paladinSacrifices | 0.86 | 0.83 |
| promotions | 0.30 | 0.33 |
| checks | 4.50 | 4.39 |

The pooled columns describe each whole population; the difference column is the mean over the
40 shared arrangements of (rule − base) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
