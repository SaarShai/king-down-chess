# Rule A/B — kp-holylight-p

`kings=[object Object],[object Object]` against today's defaults.
200 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `kp-holylight-p.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.537 | 0.507 | -0.030 ± 0.046 | no |
| decisive | 0.745 | 0.725 | -0.020 ± 0.058 | no |
| draw rate | 0.245 | 0.265 | +0.020 ± 0.058 | no |
| capped | 0.010 | 0.010 | +0.000 ± 0.014 | no |
| mean plies | 117.5 | 118.1 | +0.6 ± 5.5 | no |
| branching factor | 31.7 | 31.7 | -0.0 ± 0.5 | no |
| killer move | 0.302 | 0.319 | +0.016 ± 0.029 | no |
| lead change | 0.067 | 0.068 | +0.001 ± 0.003 | no |
| uncertainty late | 0.648 | 0.649 | +0.001 ± 0.004 | no |
| drama | 0.121 | 0.124 | +0.003 ± 0.025 | no |
| permanence | 0.961 | 0.961 | +0.000 ± 0.001 | no |
| min utilisation | 0.45 | 0.44 | -0.00 ± 0.02 | no |
| interest | 0.477 | 0.479 | +0.004 ± 0.010 | no |
| interest (min-use) | 0.477 | 0.475 | +0.006 ± 0.017 | no |
| killerMove (resid.) | -0.010 | 0.010 | +0.021 ± 0.023 | no |
| leadChange (resid.) | -0.000 | 0.000 | +0.000 ± 0.003 | no |
| uncertaintyLate (resid.) | 0.000 | -0.000 | -0.000 ± 0.005 | no |
| drama (resid.) | -0.003 | 0.003 | +0.006 ± 0.021 | no |
| permanence (resid.) | -0.000 | 0.000 | +0.000 ± 0.001 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.020 | 0.012 | +0.018 ± 0.016 | yes |
| interest (resid.) | -0.001 | 0.003 | +0.006 ± 0.006 | no |
| interestMinFairy (resid.) | 0.023 | 0.024 | +0.008 ± 0.014 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 4 (2.0%) | 0 (0.0%) |
| games where a king never moved | 30 (15.0%) | 29 (14.5%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 26.25 | 25.93 | 4.61 | 4.59 | 39.8% | 41.5% |
| M | 14.43 | 14.45 | 1.71 | 1.68 | 28.3% | 30.0% |
| A | 13.39 | 13.47 | 2.21 | 2.31 | 42.7% | 43.2% |
| K | 13.23 | 14.16 | 1.04 | 0.77 | 100.0% | 100.0% |
| R | 12.71 | 13.44 | 1.87 | 2.00 | 42.1% | 42.3% |
| S | 9.79 | 9.89 | 1.42 | 1.46 | 28.2% | 26.6% |
| N | 9.02 | 8.86 | 1.74 | 1.68 | 9.8% | 7.8% |
| B | 6.96 | 6.24 | 1.73 | 1.68 | 18.3% | 18.9% |
| Q | 4.30 | 4.42 | 0.88 | 0.81 | 83.1% | 83.8% |
| L | 4.27 | 4.17 | 1.16 | 1.15 | 6.3% | 4.2% |
| G | 3.13 | 3.08 | 0.00 | 0.00 | 97.6% | 95.3% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.21 | 2.31 |
| beastChainMoves | 1.11 | 1.13 |
| beastChainCaptures | 1.42 | 1.46 |
| maesterSwaps | 6.74 | 6.58 |
| maesterLongSwaps | 0.73 | 0.72 |
| paladinSacrifices | 0.59 | 0.61 |
| promotions | 0.32 | 0.28 |
| checks | 4.34 | 4.15 |
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
