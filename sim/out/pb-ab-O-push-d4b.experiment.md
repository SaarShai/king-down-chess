# Rule A/B — pb-ab-O-push-d4b

`ogreMode=push` against today's defaults.
1600 games per population, depth 4, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-O-push-d4b.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.509 | 0.552 | +0.043 ± 0.029 | yes |
| decisive | 0.676 | 0.770 | +0.094 ± 0.034 | yes |
| draw rate | 0.306 | 0.217 | -0.089 ± 0.034 | yes |
| capped | 0.018 | 0.013 | -0.005 ± 0.008 | no |
| mean plies | 111.9 | 112.6 | +0.6 ± 3.2 | no |
| branching factor | 30.9 | 30.6 | -0.3 ± 0.7 | no |
| killer move | 0.221 | 0.234 | +0.013 ± 0.010 | yes |
| lead change | 0.042 | 0.044 | +0.001 ± 0.002 | no |
| uncertainty late | 0.625 | 0.623 | -0.002 ± 0.003 | no |
| drama | 0.131 | 0.157 | +0.026 ± 0.012 | yes |
| permanence | 0.966 | 0.965 | -0.001 ± 0.001 | yes |
| min utilisation | 0.38 | 0.38 | +0.00 ± 0.01 | no |
| interest | 0.463 | 0.467 | +0.004 ± 0.004 | yes |
| interest (min-use) | 0.449 | 0.465 | +0.005 ± 0.008 | no |
| killerMove (resid.) | 0.004 | -0.004 | -0.009 ± 0.011 | no |
| leadChange (resid.) | -0.002 | 0.002 | +0.005 ± 0.003 | yes |
| uncertaintyLate (resid.) | -0.004 | 0.004 | +0.009 ± 0.003 | yes |
| drama (resid.) | -0.001 | 0.001 | +0.002 ± 0.009 | no |
| permanence (resid.) | -0.000 | 0.000 | +0.001 ± 0.001 | yes |
| fairyUse (resid.) | 0.002 | 0.002 | -0.005 ± 0.008 | no |
| excessDecisiveness (resid.) | 0.054 | -0.032 | -0.070 ± 0.012 | yes |
| interest (resid.) | 0.004 | -0.002 | -0.006 ± 0.003 | yes |
| interestMinFairy (resid.) | 0.006 | 0.015 | -0.003 ± 0.008 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 36 (2.3%) | 51 (3.2%) |
| games where a king never moved | 456 (28.5%) | 424 (26.5%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 21.17 | 21.31 | 3.57 | 3.79 | 38.0% | 36.2% |
| A | 15.96 | 15.33 | 3.73 | 3.51 | 53.9% | 50.1% |
| K | 14.35 | 14.80 | 1.16 | 1.20 | 100.0% | 100.0% |
| O | 11.35 | 10.99 | 0.97 | 1.43 | 65.3% | 48.9% |
| M | 9.76 | 9.60 | 0.97 | 0.98 | 36.4% | 34.2% |
| N | 8.31 | 8.03 | 1.50 | 1.47 | 14.6% | 13.4% |
| S | 7.60 | 7.77 | 1.18 | 1.21 | 49.2% | 50.3% |
| B | 6.43 | 6.21 | 1.32 | 1.40 | 28.5% | 25.9% |
| R | 6.40 | 7.26 | 1.35 | 1.47 | 30.4% | 30.8% |
| Q | 4.84 | 5.24 | 0.83 | 0.94 | 46.6% | 48.9% |
| G | 3.08 | 3.30 | 0.00 | 0.00 | 92.2% | 90.1% |
| L | 2.67 | 2.70 | 0.93 | 0.90 | 6.2% | 6.0% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 3.73 | 3.51 |
| beastChainMoves | 0.93 | 0.93 |
| beastChainCaptures | 1.18 | 1.21 |
| maesterSwaps | 4.05 | 4.04 |
| maesterLongSwaps | 0.52 | 0.51 |
| paladinSacrifices | 0.49 | 0.47 |
| promotions | 0.11 | 0.15 |
| checks | 5.86 | 6.40 |
| ogreShoves | 2.58 | 3.34 |
| ogreShovesFriend | 2.36 | 3.31 |
| ogreShovesGuard | 0.02 | 0.04 |
| catapultChecks | 0.00 | 0.00 |

The pooled columns describe each whole population; the difference column is the mean over the
40 shared arrangements of (rule − base) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
