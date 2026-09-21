# Rule A/B — pb-ab-cap-sanct-d4b

`capitalSanctuary=true` against today's defaults.
1600 games per population, depth 4, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-cap-sanct-d4b.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.541 | 0.542 | +0.001 ± 0.028 | no |
| decisive | 0.756 | 0.769 | +0.013 ± 0.026 | no |
| draw rate | 0.227 | 0.200 | -0.027 ± 0.026 | yes |
| capped | 0.017 | 0.031 | +0.014 ± 0.011 | yes |
| mean plies | 116.3 | 112.5 | -3.9 ± 4.8 | no |
| branching factor | 30.5 | 32.1 | +1.6 ± 0.4 | yes |
| killer move | 0.223 | 0.246 | +0.023 ± 0.013 | yes |
| lead change | 0.039 | 0.045 | +0.007 ± 0.005 | yes |
| uncertainty late | 0.617 | 0.614 | -0.003 ± 0.005 | no |
| drama | 0.145 | 0.136 | -0.009 ± 0.010 | no |
| permanence | 0.967 | 0.964 | -0.003 ± 0.001 | yes |
| min utilisation | 0.38 | 0.38 | +0.00 ± 0.01 | no |
| interest | 0.464 | 0.466 | +0.002 ± 0.004 | no |
| interest (min-use) | 0.464 | 0.466 | +0.012 ± 0.014 | no |
| killerMove (resid.) | -0.009 | 0.009 | +0.019 ± 0.013 | yes |
| leadChange (resid.) | -0.004 | 0.004 | +0.008 ± 0.004 | yes |
| uncertaintyLate (resid.) | -0.000 | 0.000 | +0.001 ± 0.004 | no |
| drama (resid.) | 0.007 | -0.007 | -0.015 ± 0.011 | yes |
| permanence (resid.) | 0.001 | -0.001 | -0.002 ± 0.001 | yes |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.020 | -0.013 | -0.026 ± 0.012 | yes |
| interest (resid.) | 0.001 | -0.000 | -0.001 ± 0.004 | no |
| interestMinFairy (resid.) | 0.014 | 0.012 | +0.008 ± 0.013 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 71 (4.4%) | 47 (2.9%) |
| games where a king never moved | 409 (25.6%) | 550 (34.4%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 22.22 | 21.58 | 3.59 | 2.98 | 34.7% | 43.7% |
| A | 18.51 | 17.15 | 4.30 | 3.74 | 51.1% | 63.5% |
| K | 15.81 | 14.26 | 1.20 | 0.81 | 100.0% | 100.0% |
| M | 13.89 | 14.11 | 1.46 | 1.04 | 36.2% | 47.6% |
| S | 10.32 | 10.09 | 1.21 | 1.34 | 46.2% | 58.6% |
| N | 8.66 | 8.66 | 1.55 | 1.57 | 14.4% | 28.0% |
| R | 8.25 | 7.46 | 1.67 | 1.15 | 29.5% | 44.4% |
| B | 6.44 | 6.01 | 1.52 | 1.04 | 24.8% | 38.8% |
| Q | 4.48 | 4.75 | 0.82 | 0.69 | 49.2% | 64.5% |
| L | 4.14 | 4.46 | 1.30 | 1.20 | 7.4% | 13.9% |
| G | 3.61 | 3.95 | 0.00 | 0.00 | 92.0% | 94.2% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 4.30 | 3.74 |
| beastChainMoves | 1.03 | 0.94 |
| beastChainCaptures | 1.21 | 1.34 |
| maesterSwaps | 5.50 | 6.86 |
| maesterLongSwaps | 0.85 | 0.81 |
| paladinSacrifices | 0.63 | 0.57 |
| promotions | 0.14 | 0.14 |
| checks | 6.66 | 6.53 |
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
