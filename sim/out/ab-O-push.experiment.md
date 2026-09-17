# Rule A/B — ab-O-push

`ogreMode=push` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `ab-O-push.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.536 | 0.525 | -0.011 ± 0.024 | no |
| decisive | 0.681 | 0.734 | +0.053 ± 0.029 | yes |
| draw rate | 0.311 | 0.252 | -0.059 ± 0.030 | yes |
| capped | 0.008 | 0.014 | +0.006 ± 0.008 | no |
| mean plies | 120.3 | 119.3 | -1.0 ± 3.5 | no |
| branching factor | 31.8 | 31.9 | +0.1 ± 0.3 | no |
| killer move | 0.322 | 0.339 | +0.017 ± 0.016 | yes |
| lead change | 0.065 | 0.067 | +0.001 ± 0.005 | no |
| uncertainty late | 0.653 | 0.652 | -0.001 ± 0.003 | no |
| drama | 0.128 | 0.139 | +0.011 ± 0.011 | yes |
| permanence | 0.963 | 0.962 | -0.001 ± 0.001 | yes |
| min utilisation | 0.42 | 0.42 | +0.01 ± 0.01 | no |
| interest | 0.483 | 0.486 | +0.004 ± 0.006 | no |
| interest (min-use) | 0.453 | 0.486 | +0.016 ± 0.014 | yes |
| killerMove (resid.) | -0.000 | 0.000 | +0.000 ± 0.013 | no |
| leadChange (resid.) | -0.003 | 0.003 | +0.006 ± 0.004 | yes |
| uncertaintyLate (resid.) | -0.003 | 0.003 | +0.007 ± 0.003 | yes |
| drama (resid.) | -0.001 | 0.001 | +0.002 ± 0.009 | no |
| permanence (resid.) | 0.000 | -0.000 | -0.000 ± 0.001 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.055 | -0.013 | -0.046 ± 0.015 | yes |
| interest (resid.) | 0.003 | -0.001 | -0.003 ± 0.004 | no |
| interestMinFairy (resid.) | -0.004 | 0.017 | +0.005 ± 0.013 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 29 (1.8%) | 18 (1.1%) |
| games where a king never moved | 232 (14.5%) | 239 (14.9%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 25.16 | 25.08 | 4.54 | 4.59 | 41.6% | 40.2% |
| O | 15.62 | 13.87 | 1.06 | 1.52 | 62.6% | 47.0% |
| K | 13.78 | 14.03 | 1.04 | 1.08 | 100.0% | 100.0% |
| A | 12.29 | 12.11 | 2.05 | 2.01 | 43.9% | 42.5% |
| M | 11.09 | 10.82 | 1.30 | 1.27 | 29.2% | 28.5% |
| R | 8.51 | 9.06 | 1.41 | 1.45 | 36.0% | 37.5% |
| N | 8.37 | 8.11 | 1.64 | 1.63 | 11.0% | 10.0% |
| S | 7.13 | 7.11 | 0.96 | 0.95 | 32.3% | 32.6% |
| B | 6.32 | 6.58 | 1.45 | 1.44 | 21.8% | 23.2% |
| Q | 6.19 | 5.99 | 1.07 | 1.08 | 70.1% | 78.0% |
| G | 3.03 | 3.66 | 0.00 | 0.00 | 96.6% | 94.2% |
| L | 2.84 | 2.92 | 0.87 | 0.87 | 7.3% | 6.1% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.05 | 2.01 |
| beastChainMoves | 0.75 | 0.75 |
| beastChainCaptures | 0.96 | 0.95 |
| maesterSwaps | 5.00 | 4.86 |
| maesterLongSwaps | 0.47 | 0.50 |
| paladinSacrifices | 0.44 | 0.45 |
| promotions | 0.30 | 0.35 |
| checks | 4.15 | 4.28 |
| ogreShoves | 3.31 | 3.97 |
| ogreShovesFriend | 3.08 | 3.94 |
| ogreShovesGuard | 0.02 | 0.04 |
| catapultChecks | 0.00 | 0.00 |

The pooled columns describe each whole population; the difference column is the mean over the
40 shared arrangements of (rule − base) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
