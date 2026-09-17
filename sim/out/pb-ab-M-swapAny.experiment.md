# Rule A/B — pb-ab-M-swapAny

`maesterSwapAny=true` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-base24`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.546 | 0.536 | -0.010 ± 0.030 | no |
| decisive | 0.721 | 0.726 | +0.005 ± 0.031 | no |
| draw rate | 0.269 | 0.265 | -0.004 ± 0.030 | no |
| capped | 0.010 | 0.009 | -0.001 ± 0.006 | no |
| mean plies | 117.3 | 113.1 | -4.3 ± 3.4 | yes |
| branching factor | 33.1 | 39.1 | +6.1 ± 1.3 | yes |
| killer move | 0.337 | 0.349 | +0.012 ± 0.016 | no |
| lead change | 0.071 | 0.080 | +0.009 ± 0.006 | yes |
| uncertainty late | 0.651 | 0.654 | +0.003 ± 0.003 | yes |
| drama | 0.133 | 0.133 | -0.000 ± 0.011 | no |
| permanence | 0.962 | 0.958 | -0.003 ± 0.001 | yes |
| min utilisation | 0.46 | 0.45 | -0.01 ± 0.01 | no |
| interest | 0.484 | 0.486 | +0.001 ± 0.006 | no |
| interest (min-use) | 0.470 | 0.457 | -0.009 ± 0.011 | no |
| killerMove (resid.) | -0.005 | 0.005 | +0.011 ± 0.012 | no |
| leadChange (resid.) | -0.005 | 0.005 | +0.010 ± 0.006 | yes |
| uncertaintyLate (resid.) | -0.002 | 0.002 | +0.004 ± 0.003 | yes |
| drama (resid.) | 0.000 | -0.000 | -0.001 ± 0.009 | no |
| permanence (resid.) | 0.002 | -0.002 | -0.003 ± 0.001 | yes |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.009 | 0.012 | -0.003 ± 0.010 | no |
| interest (resid.) | 0.000 | 0.001 | +0.001 ± 0.003 | no |
| interestMinFairy (resid.) | 0.011 | -0.002 | -0.010 ± 0.009 | yes |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 17 (1.1%) | 16 (1.0%) |
| games where a king never moved | 265 (16.6%) | 406 (25.4%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 26.75 | 25.39 | 4.63 | 3.80 | 41.9% | 49.0% |
| M | 15.75 | 20.14 | 1.78 | 1.89 | 33.0% | 25.7% |
| A | 13.60 | 12.63 | 2.26 | 2.13 | 42.1% | 40.3% |
| K | 13.21 | 11.75 | 0.98 | 0.97 | 100.0% | 100.0% |
| Q | 10.24 | 9.29 | 1.73 | 1.76 | 61.4% | 63.1% |
| S | 8.54 | 7.25 | 1.07 | 1.01 | 29.9% | 24.9% |
| R | 8.20 | 6.99 | 1.24 | 1.25 | 42.2% | 38.9% |
| N | 7.33 | 7.07 | 1.54 | 1.54 | 9.9% | 11.0% |
| B | 7.06 | 6.63 | 1.67 | 1.66 | 25.2% | 25.8% |
| G | 3.43 | 3.05 | 0.00 | 0.00 | 96.3% | 96.4% |
| L | 3.23 | 2.87 | 0.68 | 0.69 | 8.7% | 9.6% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.26 | 2.13 |
| beastChainMoves | 0.88 | 0.81 |
| beastChainCaptures | 1.07 | 1.01 |
| maesterSwaps | 7.07 | 13.05 |
| maesterLongSwaps | 0.64 | 0.65 |
| paladinSacrifices | 0.68 | 0.69 |
| promotions | 0.34 | 0.36 |
| checks | 4.59 | 4.16 |

The pooled columns describe each whole population; the difference column is the mean over the
40 shared arrangements of (rule − base) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
