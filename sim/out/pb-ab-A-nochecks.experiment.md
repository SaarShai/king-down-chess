# Rule A/B — pb-ab-A-nochecks

`archerChecks=false` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-A-nochecks.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.561 | 0.560 | -0.001 ± 0.017 | no |
| decisive | 0.792 | 0.774 | -0.018 ± 0.012 | yes |
| draw rate | 0.198 | 0.216 | +0.018 ± 0.011 | yes |
| capped | 0.010 | 0.010 | +0.000 ± 0.005 | no |
| mean plies | 110.3 | 115.8 | +5.5 ± 2.3 | yes |
| branching factor | 32.7 | 32.7 | -0.1 ± 0.1 | no |
| killer move | 0.331 | 0.344 | +0.013 ± 0.010 | yes |
| lead change | 0.059 | 0.057 | -0.002 ± 0.001 | yes |
| uncertainty late | 0.631 | 0.631 | -0.000 ± 0.001 | no |
| drama | 0.145 | 0.152 | +0.007 ± 0.007 | yes |
| permanence | 0.959 | 0.959 | +0.001 ± 0.001 | yes |
| min utilisation | 0.43 | 0.42 | -0.00 ± 0.01 | no |
| interest | 0.483 | 0.487 | +0.004 ± 0.002 | yes |
| interest (min-use) | 0.483 | 0.487 | +0.005 ± 0.005 | yes |
| killerMove (resid.) | -0.009 | 0.009 | +0.017 ± 0.011 | yes |
| leadChange (resid.) | 0.001 | -0.001 | -0.002 ± 0.001 | yes |
| uncertaintyLate (resid.) | 0.001 | -0.001 | -0.002 ± 0.001 | yes |
| drama (resid.) | -0.006 | 0.006 | +0.011 ± 0.006 | yes |
| permanence (resid.) | -0.000 | 0.000 | +0.000 ± 0.001 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | -0.009 | 0.011 | +0.018 ± 0.006 | yes |
| interest (resid.) | -0.003 | 0.003 | +0.006 ± 0.002 | yes |
| interestMinFairy (resid.) | 0.009 | 0.014 | +0.006 ± 0.004 | yes |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 14 (0.9%) | 29 (1.8%) |
| games where a king never moved | 423 (26.4%) | 387 (24.2%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 23.45 | 24.29 | 3.84 | 3.90 | 41.3% | 38.6% |
| M | 14.40 | 14.86 | 1.37 | 1.41 | 35.0% | 32.8% |
| A | 13.99 | 14.84 | 3.38 | 3.48 | 51.6% | 47.4% |
| S | 11.14 | 11.55 | 1.43 | 1.47 | 43.0% | 41.8% |
| K | 10.95 | 12.58 | 0.78 | 0.99 | 100.0% | 100.0% |
| R | 9.48 | 9.86 | 1.67 | 1.72 | 37.3% | 36.0% |
| N | 8.14 | 8.24 | 1.44 | 1.45 | 13.2% | 12.2% |
| B | 5.93 | 6.23 | 1.30 | 1.33 | 30.2% | 28.6% |
| Q | 5.53 | 5.86 | 0.94 | 0.99 | 70.6% | 75.8% |
| L | 4.34 | 4.36 | 1.20 | 1.20 | 7.1% | 7.1% |
| G | 2.93 | 3.10 | 0.00 | 0.00 | 96.6% | 95.6% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 3.38 | 3.48 |
| beastChainMoves | 1.13 | 1.17 |
| beastChainCaptures | 1.43 | 1.47 |
| maesterSwaps | 6.38 | 6.52 |
| maesterLongSwaps | 0.76 | 0.79 |
| paladinSacrifices | 0.60 | 0.61 |
| promotions | 0.24 | 0.31 |
| checks | 3.89 | 3.36 |
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
