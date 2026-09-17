# Rule A/B — kp-holylight

`kings=[object Object],[object Object]` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `kp-holylight.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.534 | 0.529 | -0.005 ± 0.022 | no |
| decisive | 0.721 | 0.722 | +0.001 ± 0.018 | no |
| draw rate | 0.264 | 0.259 | -0.005 ± 0.017 | no |
| capped | 0.014 | 0.019 | +0.004 ± 0.009 | no |
| mean plies | 121.3 | 120.5 | -0.8 ± 2.2 | no |
| branching factor | 32.1 | 32.3 | +0.2 ± 0.1 | yes |
| killer move | 0.332 | 0.326 | -0.006 ± 0.010 | no |
| lead change | 0.068 | 0.068 | -0.000 ± 0.001 | no |
| uncertainty late | 0.648 | 0.648 | +0.001 ± 0.001 | no |
| drama | 0.138 | 0.134 | -0.004 ± 0.006 | no |
| permanence | 0.961 | 0.961 | +0.000 ± 0.000 | no |
| min utilisation | 0.44 | 0.44 | +0.00 ± 0.01 | no |
| interest | 0.484 | 0.482 | -0.002 ± 0.003 | no |
| interest (min-use) | 0.484 | 0.482 | -0.004 ± 0.006 | no |
| killerMove (resid.) | 0.004 | -0.004 | -0.007 ± 0.009 | no |
| leadChange (resid.) | -0.000 | 0.000 | +0.000 ± 0.002 | no |
| uncertaintyLate (resid.) | -0.001 | 0.001 | +0.001 ± 0.003 | no |
| drama (resid.) | 0.002 | -0.002 | -0.004 ± 0.006 | no |
| permanence (resid.) | -0.000 | 0.000 | +0.000 ± 0.000 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.018 | -0.003 | -0.005 ± 0.012 | no |
| interest (resid.) | 0.002 | -0.001 | -0.002 ± 0.002 | no |
| interestMinFairy (resid.) | 0.015 | 0.011 | -0.005 ± 0.005 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 30 (1.9%) | 14 (0.9%) |
| games where a king never moved | 259 (16.2%) | 259 (16.2%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 26.54 | 26.48 | 4.41 | 4.36 | 40.7% | 42.8% |
| M | 14.65 | 14.83 | 1.61 | 1.66 | 34.1% | 33.5% |
| A | 14.46 | 14.28 | 2.49 | 2.51 | 46.9% | 47.3% |
| K | 14.32 | 14.24 | 1.04 | 0.70 | 100.0% | 100.0% |
| R | 12.87 | 12.81 | 1.81 | 1.91 | 42.3% | 41.7% |
| S | 10.48 | 10.50 | 1.40 | 1.41 | 32.9% | 32.7% |
| B | 7.34 | 7.15 | 1.65 | 1.65 | 23.5% | 23.3% |
| N | 6.66 | 6.66 | 1.35 | 1.34 | 10.4% | 10.0% |
| Q | 5.93 | 5.86 | 0.99 | 0.98 | 76.3% | 74.7% |
| G | 4.98 | 4.60 | 0.00 | 0.00 | 96.7% | 94.4% |
| L | 3.05 | 3.10 | 0.85 | 0.83 | 6.2% | 6.4% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.49 | 2.51 |
| beastChainMoves | 1.08 | 1.09 |
| beastChainCaptures | 1.40 | 1.41 |
| maesterSwaps | 6.56 | 6.69 |
| maesterLongSwaps | 0.75 | 0.77 |
| paladinSacrifices | 0.39 | 0.39 |
| promotions | 0.32 | 0.33 |
| checks | 4.42 | 3.94 |
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
