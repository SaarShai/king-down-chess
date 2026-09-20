# Rule A/B — pb-ab-A-shots-d4b

`archerShots=plusDiag2` against today's defaults.
1600 games per population, depth 4, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-A-shots-d4b.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.543 | 0.569 | +0.026 ± 0.026 | yes |
| decisive | 0.683 | 0.771 | +0.088 ± 0.038 | yes |
| draw rate | 0.299 | 0.217 | -0.082 ± 0.037 | yes |
| capped | 0.018 | 0.012 | -0.006 ± 0.009 | no |
| mean plies | 128.1 | 113.9 | -14.2 ± 4.8 | yes |
| branching factor | 30.1 | 30.2 | +0.1 ± 0.3 | no |
| killer move | 0.199 | 0.204 | +0.005 ± 0.009 | no |
| lead change | 0.040 | 0.037 | -0.003 ± 0.003 | no |
| uncertainty late | 0.633 | 0.615 | -0.018 ± 0.005 | yes |
| drama | 0.112 | 0.140 | +0.028 ± 0.012 | yes |
| permanence | 0.970 | 0.967 | -0.003 ± 0.001 | yes |
| min utilisation | 0.41 | 0.39 | -0.01 ± 0.01 | yes |
| interest | 0.457 | 0.459 | +0.002 ± 0.004 | no |
| interest (min-use) | 0.456 | 0.459 | -0.003 ± 0.009 | no |
| killerMove (resid.) | 0.002 | -0.002 | -0.005 ± 0.007 | no |
| leadChange (resid.) | -0.001 | 0.001 | +0.002 ± 0.003 | no |
| uncertaintyLate (resid.) | 0.005 | -0.005 | -0.009 ± 0.004 | yes |
| drama (resid.) | -0.004 | 0.004 | +0.008 ± 0.008 | no |
| permanence (resid.) | 0.001 | -0.001 | -0.002 ± 0.001 | yes |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.030 | -0.036 | -0.069 ± 0.011 | yes |
| interest (resid.) | 0.003 | -0.003 | -0.006 ± 0.002 | yes |
| interestMinFairy (resid.) | 0.020 | 0.013 | -0.013 ± 0.008 | yes |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 68 (4.3%) | 64 (4.0%) |
| games where a king never moved | 219 (13.7%) | 378 (23.6%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 26.14 | 22.46 | 4.54 | 3.58 | 32.4% | 34.2% |
| K | 19.65 | 16.17 | 1.62 | 1.37 | 100.0% | 100.0% |
| A | 17.96 | 17.87 | 3.03 | 4.56 | 41.9% | 44.0% |
| M | 15.06 | 13.54 | 1.85 | 1.57 | 30.6% | 37.5% |
| S | 10.64 | 9.35 | 1.38 | 1.13 | 32.6% | 39.3% |
| R | 10.03 | 8.71 | 1.64 | 1.54 | 33.7% | 36.2% |
| N | 8.98 | 8.28 | 1.89 | 1.73 | 8.5% | 11.9% |
| B | 6.46 | 6.09 | 1.68 | 1.53 | 16.8% | 22.2% |
| Q | 5.34 | 4.20 | 0.91 | 0.81 | 49.9% | 43.9% |
| L | 3.99 | 3.60 | 1.32 | 1.24 | 5.3% | 6.6% |
| G | 3.83 | 3.66 | 0.00 | 0.00 | 88.2% | 90.4% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 3.03 | 4.56 |
| beastChainMoves | 1.16 | 0.95 |
| beastChainCaptures | 1.38 | 1.13 |
| maesterSwaps | 5.97 | 5.28 |
| maesterLongSwaps | 0.90 | 0.91 |
| paladinSacrifices | 0.56 | 0.56 |
| promotions | 0.18 | 0.12 |
| checks | 8.12 | 6.74 |
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
