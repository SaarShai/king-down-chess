# Rule A/B — pb-ab-S-all8-d4b

`beastCaptureForward=true` against today's defaults.
1600 games per population, depth 4, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-S-all8-d4b.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.541 | 0.524 | -0.017 ± 0.022 | no |
| decisive | 0.756 | 0.771 | +0.014 ± 0.021 | no |
| draw rate | 0.227 | 0.214 | -0.013 ± 0.022 | no |
| capped | 0.017 | 0.015 | -0.002 ± 0.009 | no |
| mean plies | 116.3 | 109.8 | -6.6 ± 4.0 | yes |
| branching factor | 30.5 | 31.1 | +0.6 ± 0.3 | yes |
| killer move | 0.223 | 0.237 | +0.014 ± 0.010 | yes |
| lead change | 0.039 | 0.040 | +0.001 ± 0.003 | no |
| uncertainty late | 0.617 | 0.615 | -0.002 ± 0.003 | no |
| drama | 0.145 | 0.145 | +0.000 ± 0.010 | no |
| permanence | 0.967 | 0.965 | -0.001 ± 0.001 | yes |
| min utilisation | 0.38 | 0.39 | +0.01 ± 0.01 | no |
| interest | 0.464 | 0.465 | +0.002 ± 0.003 | no |
| interest (min-use) | 0.464 | 0.458 | +0.002 ± 0.007 | no |
| killerMove (resid.) | -0.006 | 0.006 | +0.012 ± 0.011 | yes |
| leadChange (resid.) | -0.001 | 0.001 | +0.002 ± 0.003 | no |
| uncertaintyLate (resid.) | 0.000 | -0.000 | -0.000 ± 0.003 | no |
| drama (resid.) | 0.001 | -0.001 | -0.003 ± 0.009 | no |
| permanence (resid.) | 0.001 | -0.001 | -0.001 ± 0.001 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.013 | -0.020 | -0.012 ± 0.012 | yes |
| interest (resid.) | -0.000 | -0.000 | +0.001 ± 0.003 | no |
| interestMinFairy (resid.) | 0.018 | 0.010 | +0.000 ± 0.006 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 71 (4.4%) | 57 (3.6%) |
| games where a king never moved | 409 (25.6%) | 469 (29.3%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 22.22 | 21.32 | 3.59 | 3.36 | 34.7% | 37.4% |
| A | 18.51 | 17.59 | 4.30 | 4.09 | 51.1% | 51.2% |
| K | 15.81 | 13.96 | 1.20 | 1.06 | 100.0% | 100.0% |
| M | 13.89 | 13.37 | 1.46 | 1.29 | 36.2% | 41.9% |
| S | 10.32 | 9.81 | 1.21 | 1.56 | 46.2% | 51.2% |
| N | 8.66 | 8.30 | 1.55 | 1.49 | 14.4% | 15.6% |
| R | 8.25 | 7.43 | 1.67 | 1.51 | 29.5% | 34.1% |
| B | 6.44 | 6.11 | 1.52 | 1.40 | 24.8% | 27.6% |
| Q | 4.48 | 4.63 | 0.82 | 0.79 | 49.2% | 49.9% |
| L | 4.14 | 4.14 | 1.30 | 1.27 | 7.4% | 8.2% |
| G | 3.61 | 3.14 | 0.00 | 0.00 | 92.0% | 92.0% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 4.30 | 4.09 |
| beastChainMoves | 1.03 | 1.21 |
| beastChainCaptures | 1.21 | 1.56 |
| maesterSwaps | 5.50 | 5.50 |
| maesterLongSwaps | 0.85 | 0.88 |
| paladinSacrifices | 0.63 | 0.63 |
| promotions | 0.14 | 0.13 |
| checks | 6.66 | 6.12 |
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
