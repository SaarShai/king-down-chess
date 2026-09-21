# Rule A/B — pb-ab-C-land2

`catapultCapture=land` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-C-land2.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.550 | 0.549 | -0.002 ± 0.023 | no |
| decisive | 0.801 | 0.816 | +0.016 ± 0.031 | no |
| draw rate | 0.189 | 0.174 | -0.015 ± 0.031 | no |
| capped | 0.010 | 0.009 | -0.001 ± 0.008 | no |
| mean plies | 104.2 | 107.1 | +2.8 ± 3.6 | no |
| branching factor | 31.1 | 31.0 | -0.2 ± 0.3 | no |
| killer move | 0.344 | 0.349 | +0.004 ± 0.019 | no |
| lead change | 0.060 | 0.061 | +0.001 ± 0.004 | no |
| uncertainty late | 0.628 | 0.632 | +0.005 ± 0.005 | no |
| drama | 0.166 | 0.166 | +0.000 ± 0.013 | no |
| permanence | 0.955 | 0.957 | +0.002 ± 0.001 | yes |
| min utilisation | 0.42 | 0.43 | +0.01 ± 0.01 | no |
| interest | 0.488 | 0.489 | +0.002 ± 0.006 | no |
| interest (min-use) | 0.448 | 0.471 | +0.007 ± 0.010 | no |
| killerMove (resid.) | 0.000 | -0.000 | -0.000 ± 0.017 | no |
| leadChange (resid.) | -0.001 | 0.001 | +0.001 ± 0.003 | no |
| uncertaintyLate (resid.) | -0.003 | 0.003 | +0.007 ± 0.003 | yes |
| drama (resid.) | 0.002 | -0.002 | -0.003 ± 0.011 | no |
| permanence (resid.) | -0.001 | 0.001 | +0.002 ± 0.001 | yes |
| fairyUse (resid.) | 0.001 | 0.001 | +0.001 ± 0.002 | no |
| excessDecisiveness (resid.) | 0.012 | -0.007 | -0.014 ± 0.008 | yes |
| interest (resid.) | 0.001 | -0.000 | -0.000 ± 0.004 | no |
| interestMinFairy (resid.) | -0.018 | 0.003 | +0.004 ± 0.010 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 28 (1.8%) | 19 (1.2%) |
| games where a king never moved | 436 (27.3%) | 347 (21.7%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 21.80 | 23.13 | 3.52 | 3.74 | 41.6% | 41.6% |
| A | 13.47 | 14.18 | 3.14 | 3.33 | 56.7% | 53.2% |
| K | 11.10 | 11.73 | 0.88 | 1.03 | 100.0% | 100.0% |
| C | 10.01 | 7.11 | 1.16 | 0.59 | 61.2% | 49.7% |
| M | 9.68 | 10.23 | 0.91 | 1.03 | 35.0% | 32.1% |
| N | 8.21 | 8.47 | 1.48 | 1.53 | 15.4% | 15.1% |
| S | 7.38 | 7.83 | 0.98 | 1.03 | 46.9% | 46.1% |
| R | 6.72 | 7.27 | 1.42 | 1.54 | 42.4% | 37.1% |
| B | 6.11 | 6.24 | 1.34 | 1.37 | 29.0% | 29.1% |
| Q | 4.49 | 4.99 | 0.89 | 0.98 | 74.5% | 76.3% |
| L | 2.81 | 2.98 | 0.86 | 0.86 | 9.6% | 9.5% |
| G | 2.48 | 2.90 | 0.00 | 0.00 | 96.9% | 95.9% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 3.14 | 3.33 |
| beastChainMoves | 0.77 | 0.82 |
| beastChainCaptures | 0.98 | 1.03 |
| maesterSwaps | 4.51 | 4.67 |
| maesterLongSwaps | 0.52 | 0.52 |
| paladinSacrifices | 0.43 | 0.41 |
| promotions | 0.21 | 0.24 |
| checks | 4.45 | 4.33 |
| ogreShoves | 0.00 | 0.00 |
| ogreShovesFriend | 0.00 | 0.00 |
| ogreShovesGuard | 0.00 | 0.00 |
| catapultChecks | 0.59 | 0.38 |

The pooled columns describe each whole population; the difference column is the mean over the
40 shared arrangements of (rule − base) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
