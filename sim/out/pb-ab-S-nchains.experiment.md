# Rule A/B — pb-ab-S-nchains

`beastChains=false` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-S-nchains.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.561 | 0.526 | -0.035 ± 0.026 | yes |
| decisive | 0.792 | 0.799 | +0.007 ± 0.027 | no |
| draw rate | 0.198 | 0.194 | -0.004 ± 0.026 | no |
| capped | 0.010 | 0.007 | -0.002 ± 0.005 | no |
| mean plies | 110.3 | 112.1 | +1.9 ± 3.4 | no |
| branching factor | 32.7 | 32.0 | -0.7 ± 0.3 | yes |
| killer move | 0.331 | 0.338 | +0.006 ± 0.014 | no |
| lead change | 0.059 | 0.059 | +0.000 ± 0.002 | no |
| uncertainty late | 0.631 | 0.633 | +0.002 ± 0.003 | no |
| drama | 0.145 | 0.155 | +0.011 ± 0.010 | yes |
| permanence | 0.959 | 0.959 | +0.000 ± 0.001 | no |
| min utilisation | 0.43 | 0.43 | +0.01 ± 0.01 | yes |
| interest | 0.483 | 0.484 | +0.003 ± 0.005 | no |
| interest (min-use) | 0.483 | 0.484 | +0.008 ± 0.009 | no |
| killerMove (resid.) | -0.003 | 0.003 | +0.005 ± 0.012 | no |
| leadChange (resid.) | -0.000 | 0.000 | +0.001 ± 0.002 | no |
| uncertaintyLate (resid.) | -0.001 | 0.001 | +0.002 ± 0.003 | no |
| drama (resid.) | -0.005 | 0.005 | +0.010 ± 0.008 | yes |
| permanence (resid.) | -0.000 | 0.000 | +0.000 ± 0.001 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.002 | -0.039 | -0.004 ± 0.011 | no |
| interest (resid.) | -0.001 | -0.001 | +0.002 ± 0.003 | no |
| interestMinFairy (resid.) | 0.008 | 0.008 | +0.007 ± 0.008 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 14 (0.9%) | 14 (0.9%) |
| games where a king never moved | 423 (26.4%) | 389 (24.3%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 23.45 | 24.31 | 3.84 | 4.04 | 41.3% | 39.9% |
| M | 14.40 | 13.89 | 1.37 | 1.43 | 35.0% | 32.5% |
| A | 13.99 | 14.58 | 3.38 | 3.55 | 51.6% | 50.5% |
| S | 11.14 | 10.69 | 1.43 | 1.34 | 43.0% | 29.3% |
| K | 10.95 | 11.51 | 0.78 | 0.88 | 100.0% | 100.0% |
| R | 9.48 | 9.54 | 1.67 | 1.78 | 37.3% | 36.1% |
| N | 8.14 | 7.99 | 1.44 | 1.41 | 13.2% | 11.4% |
| B | 5.93 | 6.31 | 1.30 | 1.34 | 30.2% | 30.4% |
| Q | 5.53 | 5.60 | 0.94 | 0.99 | 70.6% | 72.3% |
| L | 4.34 | 4.37 | 1.20 | 1.23 | 7.1% | 7.1% |
| G | 2.93 | 3.33 | 0.00 | 0.00 | 96.6% | 95.4% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 3.38 | 3.55 |
| beastChainMoves | 1.13 | 1.34 |
| beastChainCaptures | 1.43 | 1.34 |
| maesterSwaps | 6.38 | 5.96 |
| maesterLongSwaps | 0.76 | 0.80 |
| paladinSacrifices | 0.60 | 0.59 |
| promotions | 0.24 | 0.28 |
| checks | 3.89 | 4.11 |
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
