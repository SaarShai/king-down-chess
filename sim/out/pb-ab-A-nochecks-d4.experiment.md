# Rule A/B — pb-ab-A-nochecks-d4

`archerChecks=false` against today's defaults.
400 games per population, depth 4, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-A-nochecks-d4.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.540 | 0.534 | -0.006 ± 0.030 | no |
| decisive | 0.760 | 0.738 | -0.023 ± 0.038 | no |
| draw rate | 0.212 | 0.240 | +0.028 ± 0.041 | no |
| capped | 0.028 | 0.022 | -0.005 ± 0.016 | no |
| mean plies | 117.2 | 121.3 | +4.1 ± 4.4 | no |
| branching factor | 30.6 | 30.6 | -0.1 ± 0.3 | no |
| killer move | 0.218 | 0.220 | +0.002 ± 0.010 | no |
| lead change | 0.034 | 0.034 | -0.001 ± 0.001 | no |
| uncertainty late | 0.619 | 0.616 | -0.003 ± 0.004 | no |
| drama | 0.147 | 0.138 | -0.009 ± 0.013 | no |
| permanence | 0.966 | 0.966 | +0.000 ± 0.001 | no |
| min utilisation | 0.39 | 0.38 | -0.01 ± 0.01 | no |
| interest | 0.466 | 0.462 | -0.001 ± 0.004 | no |
| interest (min-use) | 0.466 | 0.462 | -0.003 ± 0.012 | no |
| killerMove (resid.) | -0.001 | 0.001 | +0.003 ± 0.010 | no |
| leadChange (resid.) | 0.000 | -0.000 | -0.001 ± 0.001 | no |
| uncertaintyLate (resid.) | 0.003 | -0.003 | -0.005 ± 0.004 | yes |
| drama (resid.) | 0.002 | -0.002 | -0.003 ± 0.010 | no |
| permanence (resid.) | 0.000 | -0.000 | -0.000 ± 0.001 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.029 | -0.004 | +0.024 ± 0.020 | yes |
| interest (resid.) | 0.002 | -0.000 | +0.001 ± 0.003 | no |
| interestMinFairy (resid.) | 0.025 | 0.023 | +0.001 ± 0.012 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 18 (4.5%) | 17 (4.3%) |
| games where a king never moved | 106 (26.5%) | 95 (23.8%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 22.82 | 23.34 | 3.67 | 3.71 | 33.7% | 32.6% |
| A | 18.93 | 19.84 | 4.43 | 4.49 | 51.1% | 47.1% |
| K | 15.41 | 17.02 | 1.26 | 1.52 | 100.0% | 100.0% |
| M | 13.58 | 13.64 | 1.48 | 1.41 | 35.1% | 33.8% |
| S | 10.40 | 10.90 | 1.26 | 1.29 | 44.6% | 43.3% |
| N | 8.74 | 8.73 | 1.58 | 1.57 | 12.6% | 11.4% |
| R | 7.77 | 8.23 | 1.60 | 1.64 | 30.1% | 31.5% |
| B | 6.99 | 6.42 | 1.51 | 1.49 | 23.8% | 22.0% |
| L | 4.29 | 4.27 | 1.30 | 1.30 | 7.2% | 7.5% |
| G | 4.16 | 4.16 | 0.00 | 0.00 | 91.3% | 89.7% |
| Q | 4.10 | 4.77 | 0.78 | 0.80 | 47.1% | 48.6% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 4.43 | 4.49 |
| beastChainMoves | 1.09 | 1.10 |
| beastChainCaptures | 1.26 | 1.29 |
| maesterSwaps | 5.17 | 5.25 |
| maesterLongSwaps | 0.77 | 0.82 |
| paladinSacrifices | 0.65 | 0.65 |
| promotions | 0.17 | 0.17 |
| checks | 6.20 | 5.47 |
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
