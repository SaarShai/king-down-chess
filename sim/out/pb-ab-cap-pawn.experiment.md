# Rule A/B — pb-ab-cap-pawn

`pawnCapitalCapture=true` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-cap-pawn.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.561 | 0.543 | -0.018 ± 0.034 | no |
| decisive | 0.792 | 0.816 | +0.024 ± 0.030 | no |
| draw rate | 0.198 | 0.179 | -0.019 ± 0.030 | no |
| capped | 0.010 | 0.006 | -0.004 ± 0.005 | no |
| mean plies | 110.3 | 112.3 | +2.0 ± 3.3 | no |
| branching factor | 32.7 | 32.6 | -0.1 ± 0.2 | no |
| killer move | 0.331 | 0.355 | +0.023 ± 0.014 | yes |
| lead change | 0.059 | 0.056 | -0.002 ± 0.004 | no |
| uncertainty late | 0.631 | 0.629 | -0.002 ± 0.004 | no |
| drama | 0.145 | 0.160 | +0.015 ± 0.009 | yes |
| permanence | 0.959 | 0.958 | -0.001 ± 0.001 | yes |
| min utilisation | 0.43 | 0.43 | +0.01 ± 0.01 | yes |
| interest | 0.483 | 0.490 | +0.007 ± 0.004 | yes |
| interest (min-use) | 0.483 | 0.486 | +0.006 ± 0.008 | no |
| killerMove (resid.) | -0.010 | 0.010 | +0.020 ± 0.015 | yes |
| leadChange (resid.) | 0.001 | -0.001 | -0.002 ± 0.003 | no |
| uncertaintyLate (resid.) | -0.000 | 0.000 | +0.001 ± 0.003 | no |
| drama (resid.) | -0.006 | 0.006 | +0.011 ± 0.010 | yes |
| permanence (resid.) | 0.000 | -0.000 | -0.000 ± 0.001 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.010 | -0.009 | -0.020 ± 0.005 | yes |
| interest (resid.) | -0.002 | 0.002 | +0.004 ± 0.004 | yes |
| interestMinFairy (resid.) | 0.010 | 0.011 | +0.005 ± 0.008 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 14 (0.9%) | 21 (1.3%) |
| games where a king never moved | 423 (26.4%) | 415 (25.9%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 23.45 | 24.26 | 3.84 | 4.25 | 41.3% | 38.5% |
| M | 14.40 | 14.32 | 1.37 | 1.34 | 35.0% | 35.1% |
| A | 13.99 | 14.26 | 3.38 | 3.30 | 51.6% | 53.3% |
| S | 11.14 | 11.65 | 1.43 | 1.43 | 43.0% | 39.3% |
| K | 10.95 | 11.38 | 0.78 | 0.81 | 100.0% | 99.3% |
| R | 9.48 | 9.25 | 1.67 | 1.73 | 37.3% | 34.9% |
| N | 8.14 | 8.25 | 1.44 | 1.50 | 13.2% | 13.0% |
| B | 5.93 | 6.11 | 1.30 | 1.37 | 30.2% | 25.9% |
| Q | 5.53 | 5.72 | 0.94 | 0.98 | 70.6% | 75.5% |
| L | 4.34 | 4.16 | 1.20 | 1.21 | 7.1% | 6.8% |
| G | 2.93 | 2.92 | 0.00 | 0.00 | 96.6% | 97.2% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 3.38 | 3.30 |
| beastChainMoves | 1.13 | 1.18 |
| beastChainCaptures | 1.43 | 1.43 |
| maesterSwaps | 6.38 | 6.26 |
| maesterLongSwaps | 0.76 | 0.80 |
| paladinSacrifices | 0.60 | 0.60 |
| promotions | 0.24 | 0.28 |
| checks | 3.89 | 4.32 |
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
