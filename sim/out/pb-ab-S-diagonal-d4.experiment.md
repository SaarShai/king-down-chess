# Rule A/B — pb-ab-S-diagonal-d4

`beastCapture=diagonal` against today's defaults.
400 games per population, depth 4, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-S-diagonal-d4.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.540 | 0.516 | -0.024 ± 0.038 | no |
| decisive | 0.760 | 0.762 | +0.003 ± 0.041 | no |
| draw rate | 0.212 | 0.223 | +0.010 ± 0.043 | no |
| capped | 0.028 | 0.015 | -0.013 ± 0.017 | no |
| mean plies | 117.2 | 116.2 | -1.0 ± 6.0 | no |
| branching factor | 30.6 | 30.5 | -0.1 ± 0.4 | no |
| killer move | 0.218 | 0.226 | +0.008 ± 0.014 | no |
| lead change | 0.034 | 0.035 | +0.001 ± 0.004 | no |
| uncertainty late | 0.619 | 0.617 | -0.002 ± 0.005 | no |
| drama | 0.147 | 0.151 | +0.004 ± 0.017 | no |
| permanence | 0.966 | 0.966 | -0.000 ± 0.001 | no |
| min utilisation | 0.39 | 0.39 | -0.00 ± 0.01 | no |
| interest | 0.466 | 0.466 | +0.002 ± 0.005 | no |
| interest (min-use) | 0.466 | 0.466 | +0.005 ± 0.013 | no |
| killerMove (resid.) | -0.004 | 0.004 | +0.008 ± 0.014 | no |
| leadChange (resid.) | -0.000 | 0.000 | +0.001 ± 0.004 | no |
| uncertaintyLate (resid.) | 0.001 | -0.001 | -0.003 ± 0.004 | no |
| drama (resid.) | -0.003 | 0.003 | +0.006 ± 0.015 | no |
| permanence (resid.) | 0.000 | -0.000 | -0.000 ± 0.001 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.036 | 0.014 | +0.009 ± 0.021 | no |
| interest (resid.) | 0.001 | 0.002 | +0.002 ± 0.004 | no |
| interestMinFairy (resid.) | 0.022 | 0.023 | +0.006 ± 0.011 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 18 (4.5%) | 17 (4.3%) |
| games where a king never moved | 106 (26.5%) | 108 (27.0%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 22.82 | 22.45 | 3.67 | 3.76 | 33.7% | 34.4% |
| A | 18.93 | 18.36 | 4.43 | 4.32 | 51.1% | 46.5% |
| K | 15.41 | 16.33 | 1.26 | 1.34 | 100.0% | 100.0% |
| M | 13.58 | 13.63 | 1.48 | 1.58 | 35.1% | 36.6% |
| S | 10.40 | 9.03 | 1.26 | 0.79 | 44.6% | 44.6% |
| N | 8.74 | 8.86 | 1.58 | 1.62 | 12.6% | 12.8% |
| R | 7.77 | 7.24 | 1.60 | 1.58 | 30.1% | 30.9% |
| B | 6.99 | 6.50 | 1.51 | 1.57 | 23.8% | 21.9% |
| L | 4.29 | 4.45 | 1.30 | 1.34 | 7.2% | 6.0% |
| G | 4.16 | 4.01 | 0.00 | 0.00 | 91.3% | 89.2% |
| Q | 4.10 | 5.31 | 0.78 | 0.92 | 47.1% | 54.3% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 4.43 | 4.32 |
| beastChainMoves | 1.09 | 0.73 |
| beastChainCaptures | 1.26 | 0.79 |
| maesterSwaps | 5.17 | 5.21 |
| maesterLongSwaps | 0.77 | 0.79 |
| paladinSacrifices | 0.65 | 0.65 |
| promotions | 0.17 | 0.18 |
| checks | 6.20 | 6.89 |
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
