# Rule A/B — pb-ab-S-fwd-d4

`beastCaptureForward=true` against today's defaults.
400 games per population, depth 4, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-S-fwd-d4.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.535 | 0.546 | +0.011 ± 0.058 | no |
| decisive | 0.750 | 0.762 | +0.012 ± 0.039 | no |
| draw rate | 0.233 | 0.212 | -0.020 ± 0.038 | no |
| capped | 0.018 | 0.025 | +0.008 ± 0.022 | no |
| mean plies | 113.9 | 112.2 | -1.7 ± 7.2 | no |
| branching factor | 30.5 | 30.6 | +0.1 ± 0.4 | no |
| killer move | 0.214 | 0.233 | +0.019 ± 0.022 | no |
| lead change | 0.037 | 0.039 | +0.002 ± 0.006 | no |
| uncertainty late | 0.618 | 0.619 | +0.001 ± 0.005 | no |
| drama | 0.138 | 0.130 | -0.008 ± 0.017 | no |
| permanence | 0.966 | 0.965 | -0.002 ± 0.002 | no |
| min utilisation | 0.39 | 0.38 | -0.00 ± 0.02 | no |
| interest | 0.462 | 0.465 | +0.003 ± 0.005 | no |
| interest (min-use) | 0.460 | 0.465 | +0.009 ± 0.014 | no |
| killerMove (resid.) | -0.010 | 0.010 | +0.019 ± 0.022 | no |
| leadChange (resid.) | -0.001 | 0.001 | +0.003 ± 0.006 | no |
| uncertaintyLate (resid.) | -0.002 | 0.002 | +0.004 ± 0.005 | no |
| drama (resid.) | 0.006 | -0.006 | -0.011 ± 0.015 | no |
| permanence (resid.) | 0.001 | -0.001 | -0.001 ± 0.002 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.021 | 0.018 | -0.019 ± 0.021 | no |
| interest (resid.) | 0.000 | 0.002 | +0.001 ± 0.005 | no |
| interestMinFairy (resid.) | 0.024 | 0.027 | +0.006 ± 0.014 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 15 (3.8%) | 12 (3.0%) |
| games where a king never moved | 114 (28.5%) | 125 (31.3%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 22.08 | 21.26 | 3.60 | 3.31 | 36.6% | 37.9% |
| A | 19.97 | 19.44 | 4.54 | 4.44 | 55.1% | 53.3% |
| K | 15.82 | 15.07 | 1.19 | 1.14 | 100.0% | 100.0% |
| M | 13.20 | 12.98 | 1.40 | 1.34 | 36.6% | 38.4% |
| R | 8.61 | 8.21 | 1.72 | 1.63 | 34.3% | 36.9% |
| S | 8.48 | 8.66 | 0.96 | 1.25 | 40.3% | 43.3% |
| N | 8.27 | 7.93 | 1.51 | 1.47 | 13.7% | 14.3% |
| B | 6.17 | 6.57 | 1.50 | 1.50 | 24.5% | 27.8% |
| L | 4.10 | 3.72 | 1.21 | 1.16 | 7.5% | 8.0% |
| Q | 3.86 | 4.03 | 0.76 | 0.82 | 46.1% | 43.2% |
| G | 3.35 | 4.31 | 0.00 | 0.00 | 90.0% | 89.2% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 4.54 | 4.44 |
| beastChainMoves | 0.81 | 0.97 |
| beastChainCaptures | 0.96 | 1.25 |
| maesterSwaps | 5.07 | 5.58 |
| maesterLongSwaps | 0.78 | 0.86 |
| paladinSacrifices | 0.55 | 0.55 |
| promotions | 0.11 | 0.13 |
| checks | 6.43 | 6.41 |
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
