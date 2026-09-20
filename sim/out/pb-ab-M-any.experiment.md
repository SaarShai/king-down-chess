# Rule A/B — pb-ab-M-any

`maesterSwapAny=true` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-M-any.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.541 | 0.548 | +0.007 ± 0.027 | no |
| decisive | 0.791 | 0.787 | -0.004 ± 0.031 | no |
| draw rate | 0.204 | 0.207 | +0.003 ± 0.031 | no |
| capped | 0.004 | 0.005 | +0.001 ± 0.005 | no |
| mean plies | 110.8 | 105.1 | -5.7 ± 3.6 | yes |
| branching factor | 32.3 | 38.6 | +6.4 ± 1.3 | yes |
| killer move | 0.345 | 0.350 | +0.005 ± 0.014 | no |
| lead change | 0.059 | 0.069 | +0.010 ± 0.006 | yes |
| uncertainty late | 0.634 | 0.638 | +0.004 ± 0.005 | no |
| drama | 0.146 | 0.144 | -0.002 ± 0.010 | no |
| permanence | 0.958 | 0.955 | -0.003 ± 0.001 | yes |
| min utilisation | 0.43 | 0.42 | -0.01 ± 0.01 | yes |
| interest | 0.487 | 0.486 | -0.001 ± 0.005 | no |
| interest (min-use) | 0.480 | 0.467 | -0.012 ± 0.012 | no |
| killerMove (resid.) | -0.003 | 0.003 | +0.006 ± 0.013 | no |
| leadChange (resid.) | -0.005 | 0.005 | +0.010 ± 0.006 | yes |
| uncertaintyLate (resid.) | -0.002 | 0.002 | +0.003 ± 0.004 | no |
| drama (resid.) | 0.001 | -0.001 | -0.001 ± 0.008 | no |
| permanence (resid.) | 0.002 | -0.002 | -0.003 ± 0.001 | yes |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.001 | 0.000 | +0.003 ± 0.005 | no |
| interest (resid.) | 0.000 | -0.000 | -0.000 ± 0.003 | no |
| interestMinFairy (resid.) | 0.011 | -0.001 | -0.012 ± 0.012 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 18 (1.1%) | 18 (1.1%) |
| games where a king never moved | 380 (23.8%) | 523 (32.7%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 23.79 | 22.18 | 3.84 | 3.07 | 40.3% | 48.5% |
| A | 15.17 | 14.16 | 3.57 | 3.32 | 55.0% | 54.7% |
| M | 15.10 | 18.91 | 1.49 | 1.59 | 37.3% | 28.9% |
| K | 11.43 | 9.94 | 0.82 | 0.80 | 100.0% | 100.0% |
| S | 9.51 | 7.73 | 1.22 | 1.13 | 31.9% | 26.0% |
| R | 9.38 | 8.00 | 1.74 | 1.74 | 36.6% | 34.7% |
| N | 7.86 | 7.72 | 1.54 | 1.54 | 11.8% | 13.6% |
| B | 5.83 | 5.16 | 1.35 | 1.36 | 26.7% | 28.2% |
| Q | 5.70 | 4.92 | 0.99 | 0.95 | 74.3% | 78.8% |
| L | 4.18 | 3.85 | 1.16 | 1.12 | 6.7% | 8.8% |
| G | 2.84 | 2.53 | 0.00 | 0.00 | 97.3% | 97.5% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 3.57 | 3.32 |
| beastChainMoves | 0.95 | 0.92 |
| beastChainCaptures | 1.22 | 1.13 |
| maesterSwaps | 6.64 | 12.49 |
| maesterLongSwaps | 0.82 | 0.67 |
| paladinSacrifices | 0.57 | 0.57 |
| promotions | 0.29 | 0.30 |
| checks | 4.25 | 3.96 |
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
