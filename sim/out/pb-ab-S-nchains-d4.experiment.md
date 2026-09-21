# Rule A/B — pb-ab-S-nchains-d4

`beastChains=false` against today's defaults.
400 games per population, depth 4, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-S-nchains-d4.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.540 | 0.545 | +0.005 ± 0.040 | no |
| decisive | 0.760 | 0.755 | -0.005 ± 0.045 | no |
| draw rate | 0.212 | 0.228 | +0.015 ± 0.047 | no |
| capped | 0.028 | 0.018 | -0.010 ± 0.021 | no |
| mean plies | 117.2 | 116.1 | -1.1 ± 6.9 | no |
| branching factor | 30.6 | 30.5 | -0.1 ± 0.3 | no |
| killer move | 0.218 | 0.215 | -0.003 ± 0.011 | no |
| lead change | 0.034 | 0.036 | +0.002 ± 0.005 | no |
| uncertainty late | 0.619 | 0.617 | -0.002 ± 0.005 | no |
| drama | 0.147 | 0.148 | +0.000 ± 0.014 | no |
| permanence | 0.966 | 0.968 | +0.001 ± 0.001 | yes |
| min utilisation | 0.39 | 0.40 | +0.01 ± 0.02 | no |
| interest | 0.466 | 0.463 | -0.001 ± 0.005 | no |
| interest (min-use) | 0.466 | 0.442 | -0.009 ± 0.012 | no |
| killerMove (resid.) | 0.001 | -0.001 | -0.002 ± 0.011 | no |
| leadChange (resid.) | -0.001 | 0.001 | +0.002 ± 0.005 | no |
| uncertaintyLate (resid.) | 0.002 | -0.002 | -0.003 ± 0.005 | no |
| drama (resid.) | -0.002 | 0.002 | +0.004 ± 0.011 | no |
| permanence (resid.) | -0.001 | 0.001 | +0.001 ± 0.001 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.034 | 0.016 | +0.014 ± 0.023 | no |
| interest (resid.) | 0.002 | 0.001 | +0.000 ± 0.004 | no |
| interestMinFairy (resid.) | 0.028 | 0.006 | -0.007 ± 0.009 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 18 (4.5%) | 14 (3.5%) |
| games where a king never moved | 106 (26.5%) | 102 (25.5%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 22.82 | 22.96 | 3.67 | 3.73 | 33.7% | 34.2% |
| A | 18.93 | 20.23 | 4.43 | 4.70 | 51.1% | 47.9% |
| K | 15.41 | 16.07 | 1.26 | 1.21 | 100.0% | 100.0% |
| M | 13.58 | 13.00 | 1.48 | 1.49 | 35.1% | 37.2% |
| S | 10.40 | 9.49 | 1.26 | 1.13 | 44.6% | 39.6% |
| N | 8.74 | 8.71 | 1.58 | 1.52 | 12.6% | 12.8% |
| R | 7.77 | 7.16 | 1.60 | 1.64 | 30.1% | 31.3% |
| B | 6.99 | 6.57 | 1.51 | 1.50 | 23.8% | 21.9% |
| L | 4.29 | 4.18 | 1.30 | 1.26 | 7.2% | 7.0% |
| G | 4.16 | 3.08 | 0.00 | 0.00 | 91.3% | 88.9% |
| Q | 4.10 | 4.66 | 0.78 | 0.81 | 47.1% | 45.4% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 4.43 | 4.70 |
| beastChainMoves | 1.09 | 1.13 |
| beastChainCaptures | 1.26 | 1.13 |
| maesterSwaps | 5.17 | 4.85 |
| maesterLongSwaps | 0.77 | 0.65 |
| paladinSacrifices | 0.65 | 0.63 |
| promotions | 0.17 | 0.15 |
| checks | 6.20 | 6.64 |
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
