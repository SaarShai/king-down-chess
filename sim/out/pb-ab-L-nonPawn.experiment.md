# Rule A/B — pb-ab-L-nonPawn

`paladinKamikaze=nonPawn` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-base24`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.546 | 0.543 | -0.003 ± 0.018 | no |
| decisive | 0.721 | 0.713 | -0.008 ± 0.022 | no |
| draw rate | 0.269 | 0.278 | +0.009 ± 0.022 | no |
| capped | 0.010 | 0.009 | -0.001 ± 0.003 | no |
| mean plies | 117.3 | 117.1 | -0.3 ± 1.3 | no |
| branching factor | 33.1 | 32.9 | -0.2 ± 0.2 | no |
| killer move | 0.337 | 0.335 | -0.002 ± 0.012 | no |
| lead change | 0.071 | 0.068 | -0.002 ± 0.003 | no |
| uncertainty late | 0.651 | 0.652 | +0.001 ± 0.003 | no |
| drama | 0.133 | 0.134 | +0.001 ± 0.006 | no |
| permanence | 0.962 | 0.961 | -0.001 ± 0.001 | no |
| min utilisation | 0.46 | 0.44 | -0.01 ± 0.01 | yes |
| interest | 0.484 | 0.484 | +0.000 ± 0.004 | no |
| interest (min-use) | 0.470 | 0.484 | +0.008 ± 0.006 | yes |
| killerMove (resid.) | -0.000 | 0.000 | +0.001 ± 0.010 | no |
| leadChange (resid.) | 0.001 | -0.001 | -0.003 ± 0.003 | yes |
| uncertaintyLate (resid.) | -0.000 | 0.000 | +0.001 ± 0.002 | no |
| drama (resid.) | -0.001 | 0.001 | +0.002 ± 0.006 | no |
| permanence (resid.) | 0.000 | -0.000 | -0.001 ± 0.001 | yes |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.003 | 0.003 | +0.009 ± 0.006 | yes |
| interest (resid.) | -0.000 | 0.001 | +0.001 ± 0.003 | no |
| interestMinFairy (resid.) | 0.001 | 0.018 | +0.010 ± 0.007 | yes |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 17 (1.1%) | 20 (1.3%) |
| games where a king never moved | 265 (16.6%) | 281 (17.6%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 26.75 | 25.94 | 4.63 | 4.37 | 41.9% | 42.2% |
| M | 15.75 | 15.81 | 1.78 | 1.77 | 33.0% | 33.0% |
| A | 13.60 | 13.94 | 2.26 | 2.29 | 42.1% | 45.5% |
| K | 13.21 | 13.30 | 0.98 | 0.93 | 100.0% | 100.0% |
| Q | 10.24 | 10.06 | 1.73 | 1.68 | 61.4% | 61.0% |
| S | 8.54 | 8.40 | 1.07 | 1.05 | 29.9% | 30.6% |
| R | 8.20 | 7.91 | 1.24 | 1.18 | 42.2% | 42.2% |
| N | 7.33 | 7.25 | 1.54 | 1.51 | 9.9% | 10.7% |
| B | 7.06 | 7.11 | 1.67 | 1.61 | 25.2% | 25.1% |
| G | 3.43 | 3.46 | 0.00 | 0.00 | 96.3% | 97.2% |
| L | 3.23 | 3.89 | 0.68 | 1.12 | 8.7% | 6.6% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.26 | 2.29 |
| beastChainMoves | 0.88 | 0.84 |
| beastChainCaptures | 1.07 | 1.05 |
| maesterSwaps | 7.07 | 7.13 |
| maesterLongSwaps | 0.64 | 0.62 |
| paladinSacrifices | 0.68 | 0.59 |
| promotions | 0.34 | 0.32 |
| checks | 4.59 | 4.52 |

The pooled columns describe each whole population; the difference column is the mean over the
40 shared arrangements of (rule − base) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
