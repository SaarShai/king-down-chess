# Rule A/B — ab-C-land

`catapultCapture=land` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `ab-C-land.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.529 | 0.545 | +0.016 ± 0.028 | no |
| decisive | 0.770 | 0.761 | -0.009 ± 0.028 | no |
| draw rate | 0.218 | 0.225 | +0.007 ± 0.026 | no |
| capped | 0.012 | 0.014 | +0.002 ± 0.008 | no |
| mean plies | 111.7 | 114.8 | +3.1 ± 3.7 | no |
| branching factor | 30.7 | 30.7 | -0.0 ± 0.3 | no |
| killer move | 0.350 | 0.345 | -0.006 ± 0.014 | no |
| lead change | 0.059 | 0.063 | +0.003 ± 0.003 | no |
| uncertainty late | 0.636 | 0.644 | +0.008 ± 0.004 | yes |
| drama | 0.162 | 0.152 | -0.010 ± 0.010 | no |
| permanence | 0.958 | 0.959 | +0.002 ± 0.001 | yes |
| min utilisation | 0.44 | 0.45 | +0.01 ± 0.01 | no |
| interest | 0.490 | 0.488 | -0.001 ± 0.005 | no |
| interest (min-use) | 0.484 | 0.488 | +0.006 ± 0.008 | no |
| killerMove (resid.) | 0.002 | -0.002 | -0.004 ± 0.013 | no |
| leadChange (resid.) | -0.002 | 0.002 | +0.003 ± 0.003 | no |
| uncertaintyLate (resid.) | -0.004 | 0.004 | +0.008 ± 0.003 | yes |
| drama (resid.) | 0.004 | -0.004 | -0.009 ± 0.010 | no |
| permanence (resid.) | -0.001 | 0.001 | +0.001 ± 0.001 | yes |
| fairyUse (resid.) | 0.001 | 0.001 | +0.001 ± 0.002 | no |
| excessDecisiveness (resid.) | 0.006 | 0.001 | +0.007 ± 0.010 | no |
| interest (resid.) | 0.001 | -0.000 | -0.001 ± 0.004 | no |
| interestMinFairy (resid.) | 0.009 | 0.014 | +0.007 ± 0.008 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 33 (2.1%) | 23 (1.4%) |
| games where a king never moved | 328 (20.5%) | 311 (19.4%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 24.43 | 25.77 | 4.13 | 4.42 | 41.6% | 41.5% |
| K | 13.23 | 13.73 | 1.08 | 1.20 | 100.0% | 100.0% |
| A | 11.53 | 12.08 | 1.94 | 2.08 | 48.0% | 47.3% |
| C | 11.45 | 9.11 | 1.15 | 0.57 | 59.9% | 51.2% |
| M | 10.63 | 11.18 | 1.24 | 1.31 | 32.5% | 30.8% |
| N | 8.35 | 8.52 | 1.69 | 1.64 | 13.0% | 12.9% |
| R | 8.25 | 8.91 | 1.52 | 1.58 | 43.3% | 42.3% |
| S | 7.01 | 7.26 | 0.99 | 1.03 | 37.1% | 36.3% |
| B | 6.15 | 6.38 | 1.36 | 1.42 | 26.8% | 26.8% |
| Q | 4.92 | 5.59 | 0.97 | 1.06 | 77.5% | 82.2% |
| G | 3.21 | 3.62 | 0.00 | 0.00 | 96.6% | 95.5% |
| L | 2.56 | 2.66 | 0.91 | 0.90 | 5.6% | 5.4% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 1.94 | 2.08 |
| beastChainMoves | 0.77 | 0.79 |
| beastChainCaptures | 0.99 | 1.03 |
| maesterSwaps | 4.72 | 4.88 |
| maesterLongSwaps | 0.52 | 0.53 |
| paladinSacrifices | 0.46 | 0.45 |
| promotions | 0.28 | 0.29 |
| checks | 4.54 | 4.37 |
| ogreShoves | 0.00 | 0.00 |
| ogreShovesFriend | 0.00 | 0.00 |
| ogreShovesGuard | 0.00 | 0.00 |
| catapultChecks | 0.56 | 0.35 |

The pooled columns describe each whole population; the difference column is the mean over the
40 shared arrangements of (rule − base) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
