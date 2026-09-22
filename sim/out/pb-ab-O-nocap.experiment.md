# Rule A/B — pb-ab-O-nocap

`ogreNoCapture=true` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-O-nocap.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.532 | 0.539 | +0.006 ± 0.034 | no |
| decisive | 0.795 | 0.782 | -0.013 ± 0.034 | no |
| draw rate | 0.198 | 0.213 | +0.015 ± 0.032 | no |
| capped | 0.007 | 0.004 | -0.003 ± 0.004 | no |
| mean plies | 105.0 | 99.4 | -5.6 ± 3.4 | yes |
| branching factor | 32.2 | 32.5 | +0.3 ± 0.3 | yes |
| killer move | 0.363 | 0.370 | +0.007 ± 0.014 | no |
| lead change | 0.066 | 0.068 | +0.001 ± 0.003 | no |
| uncertainty late | 0.636 | 0.635 | -0.001 ± 0.003 | no |
| drama | 0.161 | 0.154 | -0.007 ± 0.012 | no |
| permanence | 0.955 | 0.952 | -0.003 ± 0.001 | yes |
| min utilisation | 0.41 | 0.41 | +0.01 ± 0.01 | no |
| interest | 0.492 | 0.491 | +0.000 ± 0.005 | no |
| interest (min-use) | 0.449 | 0.433 | -0.007 ± 0.012 | no |
| killerMove (resid.) | -0.006 | 0.006 | +0.013 ± 0.014 | no |
| leadChange (resid.) | -0.000 | 0.000 | +0.001 ± 0.003 | no |
| uncertaintyLate (resid.) | 0.001 | -0.001 | -0.002 ± 0.003 | no |
| drama (resid.) | 0.002 | -0.002 | -0.003 ± 0.010 | no |
| permanence (resid.) | 0.002 | -0.002 | -0.003 ± 0.002 | yes |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.019 | 0.014 | +0.014 ± 0.011 | yes |
| interest (resid.) | 0.000 | 0.002 | +0.002 ± 0.004 | no |
| interestMinFairy (resid.) | -0.016 | -0.027 | -0.002 ± 0.011 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 8 (0.5%) | 14 (0.9%) |
| games where a king never moved | 430 (26.9%) | 511 (31.9%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 21.39 | 20.42 | 3.54 | 3.35 | 42.4% | 44.1% |
| A | 14.22 | 13.67 | 3.37 | 3.30 | 55.2% | 56.6% |
| O | 11.57 | 9.71 | 0.81 | 0.00 | 66.8% | 76.4% |
| K | 10.18 | 8.70 | 0.80 | 0.77 | 100.0% | 100.0% |
| M | 9.94 | 9.65 | 0.92 | 0.91 | 34.8% | 39.5% |
| N | 8.34 | 8.53 | 1.40 | 1.54 | 15.3% | 18.1% |
| S | 7.21 | 7.03 | 1.45 | 1.40 | 43.1% | 48.6% |
| R | 6.33 | 6.58 | 1.27 | 1.38 | 33.1% | 37.7% |
| B | 5.87 | 5.93 | 1.23 | 1.29 | 30.5% | 33.2% |
| Q | 4.72 | 4.43 | 0.90 | 0.92 | 70.2% | 75.2% |
| L | 2.83 | 2.69 | 0.87 | 0.87 | 6.9% | 8.3% |
| G | 2.45 | 2.09 | 0.00 | 0.00 | 97.5% | 97.3% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 3.37 | 3.30 |
| beastChainMoves | 0.91 | 0.88 |
| beastChainCaptures | 1.45 | 1.40 |
| maesterSwaps | 4.58 | 4.41 |
| maesterLongSwaps | 0.51 | 0.46 |
| paladinSacrifices | 0.48 | 0.45 |
| promotions | 0.22 | 0.23 |
| checks | 3.65 | 3.37 |
| ogreShoves | 2.84 | 3.01 |
| ogreShovesFriend | 2.67 | 2.51 |
| ogreShovesGuard | 0.02 | 0.02 |
| catapultChecks | 0.00 | 0.00 |

The pooled columns describe each whole population; the difference column is the mean over the
40 shared arrangements of (rule − base) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
