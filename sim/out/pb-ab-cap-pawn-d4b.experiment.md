# Rule A/B — pb-ab-cap-pawn-d4b

`pawnCapitalCapture=true` against today's defaults.
1600 games per population, depth 4, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-cap-pawn-d4b.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.541 | 0.539 | -0.002 ± 0.022 | no |
| decisive | 0.756 | 0.739 | -0.018 ± 0.031 | no |
| draw rate | 0.227 | 0.246 | +0.019 ± 0.032 | no |
| capped | 0.017 | 0.015 | -0.002 ± 0.013 | no |
| mean plies | 116.3 | 113.8 | -2.6 ± 3.7 | no |
| branching factor | 30.5 | 30.8 | +0.3 ± 0.3 | no |
| killer move | 0.223 | 0.218 | -0.005 ± 0.012 | no |
| lead change | 0.039 | 0.037 | -0.001 ± 0.003 | no |
| uncertainty late | 0.617 | 0.618 | +0.001 ± 0.004 | no |
| drama | 0.145 | 0.134 | -0.011 ± 0.011 | yes |
| permanence | 0.967 | 0.967 | +0.000 ± 0.001 | no |
| min utilisation | 0.38 | 0.40 | +0.02 ± 0.01 | yes |
| interest | 0.464 | 0.462 | -0.002 ± 0.004 | no |
| interest (min-use) | 0.464 | 0.451 | -0.001 ± 0.013 | no |
| killerMove (resid.) | 0.002 | -0.002 | -0.003 ± 0.012 | no |
| leadChange (resid.) | 0.001 | -0.001 | -0.002 ± 0.003 | no |
| uncertaintyLate (resid.) | 0.000 | -0.000 | -0.001 ± 0.003 | no |
| drama (resid.) | 0.003 | -0.003 | -0.006 ± 0.009 | no |
| permanence (resid.) | -0.000 | 0.000 | +0.000 ± 0.001 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | -0.002 | 0.013 | +0.019 ± 0.013 | yes |
| interest (resid.) | 0.000 | 0.000 | +0.000 ± 0.003 | no |
| interestMinFairy (resid.) | 0.018 | 0.006 | +0.000 ± 0.013 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 71 (4.4%) | 63 (3.9%) |
| games where a king never moved | 409 (25.6%) | 430 (26.9%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 22.22 | 22.75 | 3.59 | 3.97 | 34.7% | 34.8% |
| A | 18.51 | 17.86 | 4.30 | 4.09 | 51.1% | 52.1% |
| K | 15.81 | 15.14 | 1.20 | 1.19 | 100.0% | 98.9% |
| M | 13.89 | 12.93 | 1.46 | 1.33 | 36.2% | 39.3% |
| S | 10.32 | 10.40 | 1.21 | 1.18 | 46.2% | 47.6% |
| N | 8.66 | 8.66 | 1.55 | 1.59 | 14.4% | 15.4% |
| R | 8.25 | 7.70 | 1.67 | 1.55 | 29.5% | 30.4% |
| B | 6.44 | 6.53 | 1.52 | 1.54 | 24.8% | 25.2% |
| Q | 4.48 | 4.53 | 0.82 | 0.80 | 49.2% | 45.7% |
| L | 4.14 | 4.08 | 1.30 | 1.32 | 7.4% | 7.1% |
| G | 3.61 | 3.19 | 0.00 | 0.00 | 92.0% | 89.9% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 4.30 | 4.09 |
| beastChainMoves | 1.03 | 1.03 |
| beastChainCaptures | 1.21 | 1.18 |
| maesterSwaps | 5.50 | 5.21 |
| maesterLongSwaps | 0.85 | 0.82 |
| paladinSacrifices | 0.63 | 0.60 |
| promotions | 0.14 | 0.12 |
| checks | 6.66 | 6.42 |
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
