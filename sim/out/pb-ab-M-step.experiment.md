# Rule A/B — pb-ab-M-step

`maesterStep=2` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-M-step.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.544 | 0.550 | +0.006 ± 0.019 | no |
| decisive | 0.714 | 0.734 | +0.021 ± 0.027 | no |
| draw rate | 0.274 | 0.256 | -0.018 ± 0.025 | no |
| capped | 0.012 | 0.009 | -0.003 ± 0.005 | no |
| mean plies | 118.0 | 115.2 | -2.8 ± 2.9 | no |
| branching factor | 32.6 | 33.6 | +1.0 ± 0.3 | yes |
| killer move | 0.325 | 0.335 | +0.010 ± 0.013 | no |
| lead change | 0.064 | 0.065 | +0.002 ± 0.003 | no |
| uncertainty late | 0.648 | 0.647 | -0.001 ± 0.003 | no |
| drama | 0.127 | 0.132 | +0.005 ± 0.007 | no |
| permanence | 0.962 | 0.961 | -0.001 ± 0.001 | yes |
| min utilisation | 0.45 | 0.45 | +0.00 ± 0.01 | no |
| interest | 0.482 | 0.484 | +0.002 ± 0.004 | no |
| interest (min-use) | 0.482 | 0.484 | -0.000 ± 0.008 | no |
| killerMove (resid.) | -0.002 | 0.002 | +0.005 ± 0.012 | no |
| leadChange (resid.) | -0.002 | 0.002 | +0.004 ± 0.004 | yes |
| uncertaintyLate (resid.) | -0.001 | 0.001 | +0.002 ± 0.004 | no |
| drama (resid.) | -0.001 | 0.001 | +0.003 ± 0.006 | no |
| permanence (resid.) | 0.000 | -0.000 | -0.001 ± 0.001 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.018 | -0.003 | -0.017 ± 0.007 | yes |
| interest (resid.) | 0.001 | 0.000 | -0.000 ± 0.003 | no |
| interestMinFairy (resid.) | 0.011 | 0.010 | -0.004 ± 0.007 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 24 (1.5%) | 15 (0.9%) |
| games where a king never moved | 289 (18.1%) | 280 (17.5%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 26.41 | 26.04 | 4.54 | 4.63 | 41.3% | 40.9% |
| M | 16.21 | 15.89 | 1.72 | 1.97 | 36.7% | 28.4% |
| K | 13.26 | 12.78 | 0.93 | 0.95 | 100.0% | 100.0% |
| A | 12.40 | 11.92 | 2.09 | 2.03 | 44.3% | 45.0% |
| R | 11.04 | 10.86 | 1.74 | 1.78 | 40.6% | 42.6% |
| S | 9.85 | 9.81 | 1.25 | 1.29 | 32.9% | 32.1% |
| N | 8.29 | 8.12 | 1.69 | 1.68 | 9.7% | 9.7% |
| Q | 6.30 | 6.21 | 1.02 | 0.98 | 76.5% | 76.0% |
| B | 6.21 | 5.78 | 1.42 | 1.38 | 23.8% | 24.5% |
| L | 4.42 | 4.24 | 1.27 | 1.22 | 6.1% | 7.2% |
| G | 3.63 | 3.53 | 0.00 | 0.00 | 96.7% | 96.3% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.09 | 2.03 |
| beastChainMoves | 0.99 | 1.02 |
| beastChainCaptures | 1.25 | 1.29 |
| maesterSwaps | 7.26 | 6.25 |
| maesterLongSwaps | 0.81 | 0.67 |
| paladinSacrifices | 0.62 | 0.60 |
| promotions | 0.31 | 0.32 |
| checks | 4.27 | 4.31 |
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
