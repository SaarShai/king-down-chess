# Rule A/B — pb-ab-M-king-d4

`maesterKingSwapAnywhere=true` against today's defaults.
400 games per population, depth 4, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-M-king-d4.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.540 | 0.516 | -0.024 ± 0.041 | no |
| decisive | 0.760 | 0.757 | -0.003 ± 0.046 | no |
| draw rate | 0.212 | 0.215 | +0.003 ± 0.044 | no |
| capped | 0.028 | 0.028 | +0.000 ± 0.016 | no |
| mean plies | 117.2 | 121.7 | +4.6 ± 4.6 | no |
| branching factor | 30.6 | 30.5 | -0.1 ± 0.3 | no |
| killer move | 0.218 | 0.223 | +0.005 ± 0.015 | no |
| lead change | 0.034 | 0.033 | -0.001 ± 0.002 | no |
| uncertainty late | 0.619 | 0.614 | -0.005 ± 0.003 | yes |
| drama | 0.147 | 0.153 | +0.006 ± 0.014 | no |
| permanence | 0.966 | 0.967 | +0.000 ± 0.001 | no |
| min utilisation | 0.39 | 0.38 | -0.01 ± 0.01 | no |
| interest | 0.466 | 0.467 | +0.001 ± 0.006 | no |
| interest (min-use) | 0.466 | 0.453 | -0.005 ± 0.013 | no |
| killerMove (resid.) | -0.003 | 0.003 | +0.005 ± 0.015 | no |
| leadChange (resid.) | 0.001 | -0.001 | -0.001 ± 0.002 | no |
| uncertaintyLate (resid.) | 0.002 | -0.002 | -0.005 ± 0.004 | yes |
| drama (resid.) | -0.003 | 0.003 | +0.006 ± 0.011 | no |
| permanence (resid.) | -0.000 | 0.000 | +0.000 ± 0.001 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.040 | 0.035 | +0.002 ± 0.020 | no |
| interest (resid.) | 0.002 | 0.003 | +0.002 ± 0.004 | no |
| interestMinFairy (resid.) | 0.027 | 0.014 | -0.004 ± 0.013 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 18 (4.5%) | 18 (4.5%) |
| games where a king never moved | 106 (26.5%) | 101 (25.3%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 22.82 | 23.32 | 3.67 | 3.87 | 33.7% | 32.8% |
| A | 18.93 | 18.98 | 4.43 | 4.28 | 51.1% | 50.0% |
| K | 15.41 | 17.82 | 1.26 | 1.34 | 100.0% | 100.0% |
| M | 13.58 | 13.95 | 1.48 | 1.53 | 35.1% | 31.3% |
| S | 10.40 | 10.73 | 1.26 | 1.28 | 44.6% | 43.9% |
| N | 8.74 | 8.82 | 1.58 | 1.56 | 12.6% | 12.4% |
| R | 7.77 | 8.40 | 1.60 | 1.63 | 30.1% | 27.9% |
| B | 6.99 | 6.89 | 1.51 | 1.54 | 23.8% | 24.2% |
| L | 4.29 | 4.66 | 1.30 | 1.35 | 7.2% | 8.5% |
| G | 4.16 | 3.35 | 0.00 | 0.00 | 91.3% | 90.0% |
| Q | 4.10 | 4.81 | 0.78 | 0.80 | 47.1% | 49.3% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 4.43 | 4.28 |
| beastChainMoves | 1.09 | 1.09 |
| beastChainCaptures | 1.26 | 1.28 |
| maesterSwaps | 5.17 | 5.61 |
| maesterLongSwaps | 0.77 | 1.07 |
| paladinSacrifices | 0.65 | 0.64 |
| promotions | 0.17 | 0.21 |
| checks | 6.20 | 7.17 |
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
