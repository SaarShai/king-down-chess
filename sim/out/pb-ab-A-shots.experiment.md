# Rule A/B — pb-ab-A-shots

`archerShots=plusDiag2` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-A-shots.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.544 | 0.550 | +0.006 ± 0.020 | no |
| decisive | 0.714 | 0.791 | +0.077 ± 0.029 | yes |
| draw rate | 0.274 | 0.205 | -0.069 ± 0.028 | yes |
| capped | 0.012 | 0.004 | -0.008 ± 0.006 | yes |
| mean plies | 118.0 | 110.6 | -7.5 ± 3.5 | yes |
| branching factor | 32.6 | 32.0 | -0.6 ± 0.3 | yes |
| killer move | 0.325 | 0.337 | +0.012 ± 0.015 | no |
| lead change | 0.064 | 0.060 | -0.003 ± 0.002 | yes |
| uncertainty late | 0.648 | 0.635 | -0.014 ± 0.004 | yes |
| drama | 0.127 | 0.148 | +0.021 ± 0.010 | yes |
| permanence | 0.962 | 0.959 | -0.003 ± 0.001 | yes |
| min utilisation | 0.45 | 0.44 | -0.01 ± 0.01 | yes |
| interest | 0.482 | 0.486 | +0.004 ± 0.005 | no |
| interest (min-use) | 0.482 | 0.486 | -0.000 ± 0.007 | no |
| killerMove (resid.) | 0.003 | -0.003 | -0.006 ± 0.013 | no |
| leadChange (resid.) | -0.001 | 0.001 | +0.003 ± 0.003 | yes |
| uncertaintyLate (resid.) | 0.001 | -0.001 | -0.003 ± 0.003 | no |
| drama (resid.) | -0.004 | 0.004 | +0.009 ± 0.007 | yes |
| permanence (resid.) | 0.000 | -0.000 | -0.001 ± 0.001 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.036 | -0.014 | -0.052 ± 0.011 | yes |
| interest (resid.) | 0.003 | -0.001 | -0.004 ± 0.003 | yes |
| interestMinFairy (resid.) | 0.014 | 0.009 | -0.009 ± 0.006 | yes |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 24 (1.5%) | 26 (1.6%) |
| games where a king never moved | 289 (18.1%) | 329 (20.6%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 26.41 | 24.22 | 4.54 | 3.90 | 41.3% | 40.0% |
| M | 16.21 | 14.83 | 1.72 | 1.60 | 36.7% | 36.6% |
| K | 13.26 | 12.46 | 0.93 | 0.91 | 100.0% | 100.0% |
| A | 12.40 | 13.54 | 2.09 | 3.47 | 44.3% | 42.2% |
| R | 11.04 | 9.81 | 1.74 | 1.69 | 40.6% | 39.6% |
| S | 9.85 | 9.50 | 1.25 | 1.19 | 32.9% | 31.0% |
| N | 8.29 | 7.83 | 1.69 | 1.60 | 9.7% | 10.4% |
| Q | 6.30 | 5.73 | 1.02 | 0.98 | 76.5% | 72.9% |
| B | 6.21 | 5.68 | 1.42 | 1.41 | 23.8% | 25.0% |
| L | 4.42 | 3.92 | 1.27 | 1.23 | 6.1% | 6.1% |
| G | 3.63 | 3.04 | 0.00 | 0.00 | 96.7% | 96.8% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.09 | 3.47 |
| beastChainMoves | 0.99 | 0.94 |
| beastChainCaptures | 1.25 | 1.19 |
| maesterSwaps | 7.26 | 6.34 |
| maesterLongSwaps | 0.81 | 0.84 |
| paladinSacrifices | 0.62 | 0.63 |
| promotions | 0.31 | 0.30 |
| checks | 4.27 | 4.43 |
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
