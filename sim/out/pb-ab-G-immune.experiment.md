# Rule A/B — pb-ab-G-immune

`guardImmune=false` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-G-immune.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.541 | 0.543 | +0.002 ± 0.018 | no |
| decisive | 0.791 | 0.800 | +0.009 ± 0.011 | no |
| draw rate | 0.204 | 0.197 | -0.007 ± 0.010 | no |
| capped | 0.004 | 0.003 | -0.001 ± 0.003 | no |
| mean plies | 110.8 | 108.9 | -1.8 ± 2.0 | no |
| branching factor | 32.3 | 32.2 | -0.0 ± 0.1 | no |
| killer move | 0.345 | 0.343 | -0.001 ± 0.009 | no |
| lead change | 0.059 | 0.060 | +0.001 ± 0.002 | no |
| uncertainty late | 0.634 | 0.634 | -0.000 ± 0.002 | no |
| drama | 0.146 | 0.151 | +0.006 ± 0.008 | no |
| permanence | 0.958 | 0.958 | -0.000 ± 0.000 | no |
| min utilisation | 0.43 | 0.43 | -0.00 ± 0.01 | no |
| interest | 0.487 | 0.487 | -0.000 ± 0.003 | no |
| interest (min-use) | 0.480 | 0.432 | -0.015 ± 0.009 | yes |
| killerMove (resid.) | 0.002 | -0.002 | -0.003 ± 0.009 | no |
| leadChange (resid.) | -0.001 | 0.001 | +0.002 ± 0.002 | yes |
| uncertaintyLate (resid.) | -0.000 | 0.000 | +0.001 ± 0.002 | no |
| drama (resid.) | -0.002 | 0.002 | +0.005 ± 0.008 | no |
| permanence (resid.) | -0.000 | 0.000 | +0.000 ± 0.001 | no |
| fairyUse (resid.) | 0.001 | 0.001 | -0.002 ± 0.004 | no |
| excessDecisiveness (resid.) | 0.006 | 0.001 | -0.007 ± 0.005 | yes |
| interest (resid.) | 0.001 | 0.000 | -0.001 ± 0.002 | no |
| interestMinFairy (resid.) | 0.013 | -0.036 | -0.016 ± 0.009 | yes |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 18 (1.1%) | 16 (1.0%) |
| games where a king never moved | 380 (23.8%) | 393 (24.6%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 23.79 | 23.41 | 3.84 | 3.78 | 40.3% | 41.5% |
| A | 15.17 | 14.97 | 3.57 | 3.56 | 55.0% | 55.4% |
| M | 15.10 | 14.99 | 1.49 | 1.49 | 37.3% | 38.0% |
| K | 11.43 | 11.12 | 0.82 | 0.79 | 100.0% | 100.0% |
| S | 9.51 | 9.46 | 1.22 | 1.23 | 31.9% | 31.1% |
| R | 9.38 | 9.39 | 1.74 | 1.76 | 36.6% | 38.6% |
| N | 7.86 | 7.87 | 1.54 | 1.55 | 11.8% | 12.3% |
| B | 5.83 | 5.87 | 1.35 | 1.36 | 26.7% | 27.5% |
| Q | 5.70 | 5.65 | 0.99 | 0.97 | 74.3% | 75.0% |
| L | 4.18 | 4.13 | 1.16 | 1.16 | 6.7% | 6.7% |
| G | 2.84 | 2.10 | 0.00 | 0.00 | 97.3% | 72.6% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 3.57 | 3.56 |
| beastChainMoves | 0.95 | 0.95 |
| beastChainCaptures | 1.22 | 1.23 |
| maesterSwaps | 6.64 | 6.56 |
| maesterLongSwaps | 0.82 | 0.83 |
| paladinSacrifices | 0.57 | 0.57 |
| promotions | 0.29 | 0.28 |
| checks | 4.25 | 4.29 |
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
