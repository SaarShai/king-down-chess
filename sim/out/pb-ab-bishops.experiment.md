# Rule A/B — pb-ab-bishops

`bishopsOppositeColours=false` against today's defaults.
1600 games per population, depth 3, the same 34 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-bishops.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.561 | 0.564 | +0.000 ± 0.000 | no |
| decisive | 0.792 | 0.784 | +0.000 ± 0.000 | no |
| draw rate | 0.198 | 0.206 | +0.000 ± 0.000 | no |
| capped | 0.010 | 0.011 | +0.000 ± 0.000 | no |
| mean plies | 110.3 | 110.8 | +0.0 ± 0.0 | no |
| branching factor | 32.7 | 32.6 | +0.0 ± 0.0 | no |
| killer move | 0.331 | 0.332 | +0.000 ± 0.000 | no |
| lead change | 0.059 | 0.057 | +0.000 ± 0.000 | no |
| uncertainty late | 0.631 | 0.630 | +0.000 ± 0.000 | no |
| drama | 0.145 | 0.145 | +0.000 ± 0.000 | no |
| permanence | 0.959 | 0.959 | +0.000 ± 0.000 | no |
| min utilisation | 0.43 | 0.43 | +0.00 ± 0.00 | no |
| interest | 0.483 | 0.484 | +0.000 ± 0.000 | yes |
| interest (min-use) | 0.483 | 0.484 | +0.000 ± 0.000 | yes |
| killerMove (resid.) | -0.002 | 0.002 | +0.000 ± 0.000 | no |
| leadChange (resid.) | 0.001 | -0.001 | +0.000 ± 0.000 | no |
| uncertaintyLate (resid.) | 0.001 | -0.001 | +0.000 ± 0.000 | no |
| drama (resid.) | -0.001 | 0.001 | +0.000 ± 0.000 | no |
| permanence (resid.) | 0.000 | -0.000 | +0.000 ± 0.000 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | -0.004 | 0.005 | +0.008 ± 0.001 | yes |
| interest (resid.) | -0.001 | 0.001 | +0.000 ± 0.000 | yes |
| interestMinFairy (resid.) | 0.011 | 0.012 | +0.000 ± 0.000 | yes |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 14 (0.9%) | 18 (1.1%) |
| games where a king never moved | 423 (26.4%) | 432 (27.0%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 23.45 | 23.64 | 3.84 | 3.89 | 41.3% | 40.9% |
| M | 14.40 | 13.85 | 1.37 | 1.33 | 35.0% | 34.2% |
| A | 13.99 | 13.80 | 3.38 | 3.24 | 51.6% | 52.2% |
| S | 11.14 | 9.81 | 1.43 | 1.26 | 43.0% | 42.3% |
| K | 10.95 | 11.22 | 0.78 | 0.82 | 100.0% | 100.0% |
| R | 9.48 | 9.71 | 1.67 | 1.67 | 37.3% | 37.0% |
| N | 8.14 | 7.92 | 1.44 | 1.39 | 13.2% | 13.5% |
| B | 5.93 | 7.24 | 1.30 | 1.50 | 30.2% | 33.9% |
| Q | 5.53 | 5.85 | 0.94 | 0.99 | 70.6% | 67.2% |
| L | 4.34 | 4.54 | 1.20 | 1.28 | 7.1% | 6.7% |
| G | 2.93 | 3.16 | 0.00 | 0.00 | 96.6% | 96.3% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 3.38 | 3.24 |
| beastChainMoves | 1.13 | 0.99 |
| beastChainCaptures | 1.43 | 1.26 |
| maesterSwaps | 6.38 | 6.16 |
| maesterLongSwaps | 0.76 | 0.73 |
| paladinSacrifices | 0.60 | 0.62 |
| promotions | 0.24 | 0.24 |
| checks | 3.89 | 3.95 |
| ogreShoves | 0.00 | 0.00 |
| ogreShovesFriend | 0.00 | 0.00 |
| ogreShovesGuard | 0.00 | 0.00 |
| catapultChecks | 0.00 | 0.00 |

The pooled columns describe each whole population; the difference column is the mean over the
34 shared arrangements of (rule − base) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
