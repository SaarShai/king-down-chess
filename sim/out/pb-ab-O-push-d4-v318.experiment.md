# Rule A/B — pb-ab-O-push-d4-v318

`ogreMode=push` against today's defaults, both arms at `--values O=318`.
1600 games per population, depth 4, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-O-push-d4-v318.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.522 | 0.526 | +0.004 ± 0.024 | no |
| decisive | 0.690 | 0.761 | +0.071 ± 0.025 | yes |
| draw rate | 0.300 | 0.229 | -0.071 ± 0.024 | yes |
| capped | 0.010 | 0.010 | +0.000 ± 0.008 | no |
| mean plies | 110.5 | 113.1 | +2.7 ± 3.3 | no |
| branching factor | 30.6 | 30.5 | -0.1 ± 0.3 | no |
| killer move | 0.221 | 0.226 | +0.005 ± 0.011 | no |
| lead change | 0.043 | 0.044 | +0.000 ± 0.003 | no |
| uncertainty late | 0.625 | 0.624 | -0.000 ± 0.003 | no |
| drama | 0.135 | 0.155 | +0.020 ± 0.010 | yes |
| permanence | 0.966 | 0.965 | -0.001 ± 0.001 | yes |
| min utilisation | 0.38 | 0.38 | +0.00 ± 0.01 | no |
| interest | 0.463 | 0.467 | +0.003 ± 0.004 | no |
| interest (min-use) | 0.443 | 0.460 | +0.008 ± 0.008 | no |
| killerMove (resid.) | 0.005 | -0.005 | -0.010 ± 0.012 | no |
| leadChange (resid.) | -0.002 | 0.002 | +0.004 ± 0.003 | yes |
| uncertaintyLate (resid.) | -0.005 | 0.005 | +0.010 ± 0.004 | yes |
| drama (resid.) | -0.002 | 0.002 | +0.004 ± 0.009 | no |
| permanence (resid.) | -0.000 | 0.000 | +0.001 ± 0.001 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.036 | -0.010 | -0.058 ± 0.012 | yes |
| interest (resid.) | 0.003 | -0.001 | -0.004 ± 0.003 | yes |
| interestMinFairy (resid.) | 0.004 | 0.011 | -0.002 ± 0.008 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 44 (2.8%) | 38 (2.4%) |
| games where a king never moved | 440 (27.5%) | 402 (25.1%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 21.15 | 21.60 | 3.61 | 3.82 | 37.8% | 34.9% |
| A | 15.95 | 15.73 | 3.71 | 3.60 | 53.5% | 49.5% |
| K | 13.81 | 15.03 | 1.12 | 1.29 | 100.0% | 100.0% |
| O | 10.77 | 10.57 | 0.93 | 1.33 | 63.7% | 45.9% |
| M | 9.78 | 9.43 | 0.97 | 0.95 | 34.7% | 35.6% |
| N | 8.24 | 8.27 | 1.51 | 1.55 | 14.3% | 12.5% |
| S | 7.63 | 8.08 | 1.22 | 1.26 | 47.2% | 48.5% |
| R | 6.38 | 6.88 | 1.39 | 1.46 | 30.2% | 30.8% |
| B | 6.00 | 6.08 | 1.39 | 1.44 | 26.6% | 23.1% |
| Q | 5.14 | 5.43 | 0.90 | 0.94 | 48.9% | 53.1% |
| G | 2.95 | 3.24 | 0.00 | 0.00 | 93.3% | 90.4% |
| L | 2.68 | 2.79 | 0.91 | 0.94 | 6.0% | 5.6% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 3.71 | 3.60 |
| beastChainMoves | 0.96 | 0.98 |
| beastChainCaptures | 1.22 | 1.26 |
| maesterSwaps | 4.08 | 3.95 |
| maesterLongSwaps | 0.51 | 0.51 |
| paladinSacrifices | 0.48 | 0.47 |
| promotions | 0.11 | 0.17 |
| checks | 5.88 | 6.42 |
| ogreShoves | 2.54 | 3.24 |
| ogreShovesFriend | 2.34 | 3.22 |
| ogreShovesGuard | 0.03 | 0.03 |
| catapultChecks | 0.00 | 0.00 |

The pooled columns describe each whole population; the difference column is the mean over the
40 shared arrangements of (rule − base) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
