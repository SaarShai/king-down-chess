# Rule A/B — pb-ab-L-checks

`paladinChecks=true` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-L-checks.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.561 | 0.562 | +0.001 ± 0.015 | no |
| decisive | 0.792 | 0.797 | +0.006 ± 0.012 | no |
| draw rate | 0.198 | 0.193 | -0.006 ± 0.012 | no |
| capped | 0.010 | 0.010 | +0.000 ± 0.003 | no |
| mean plies | 110.3 | 107.5 | -2.8 ± 1.8 | yes |
| branching factor | 32.7 | 32.6 | -0.1 ± 0.2 | no |
| killer move | 0.331 | 0.330 | -0.002 ± 0.007 | no |
| lead change | 0.059 | 0.059 | +0.000 ± 0.002 | no |
| uncertainty late | 0.631 | 0.629 | -0.002 ± 0.002 | no |
| drama | 0.145 | 0.143 | -0.002 ± 0.006 | no |
| permanence | 0.959 | 0.958 | -0.000 ± 0.000 | no |
| min utilisation | 0.43 | 0.43 | +0.00 ± 0.00 | no |
| interest | 0.483 | 0.483 | -0.001 ± 0.002 | no |
| interest (min-use) | 0.483 | 0.475 | -0.001 ± 0.006 | no |
| killerMove (resid.) | 0.002 | -0.002 | -0.004 ± 0.008 | no |
| leadChange (resid.) | -0.000 | 0.000 | +0.000 ± 0.002 | no |
| uncertaintyLate (resid.) | 0.001 | -0.001 | -0.001 ± 0.001 | no |
| drama (resid.) | 0.001 | -0.001 | -0.003 ± 0.005 | no |
| permanence (resid.) | 0.000 | -0.000 | -0.000 ± 0.001 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.003 | 0.000 | -0.006 ± 0.004 | yes |
| interest (resid.) | 0.001 | -0.001 | -0.002 ± 0.002 | no |
| interestMinFairy (resid.) | 0.013 | 0.004 | -0.002 ± 0.006 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 14 (0.9%) | 10 (0.6%) |
| games where a king never moved | 423 (26.4%) | 455 (28.4%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 23.45 | 23.00 | 3.84 | 3.77 | 41.3% | 42.3% |
| M | 14.40 | 14.16 | 1.37 | 1.33 | 35.0% | 36.2% |
| A | 13.99 | 13.67 | 3.38 | 3.33 | 51.6% | 53.7% |
| S | 11.14 | 10.94 | 1.43 | 1.44 | 43.0% | 44.2% |
| K | 10.95 | 10.70 | 0.78 | 0.76 | 100.0% | 100.0% |
| R | 9.48 | 8.88 | 1.67 | 1.62 | 37.3% | 39.1% |
| N | 8.14 | 8.10 | 1.44 | 1.42 | 13.2% | 13.9% |
| B | 5.93 | 5.77 | 1.30 | 1.30 | 30.2% | 30.9% |
| Q | 5.53 | 5.38 | 0.94 | 0.92 | 70.6% | 73.2% |
| L | 4.34 | 4.14 | 1.20 | 1.14 | 7.1% | 9.6% |
| G | 2.93 | 2.75 | 0.00 | 0.00 | 96.6% | 97.2% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 3.38 | 3.33 |
| beastChainMoves | 1.13 | 1.15 |
| beastChainCaptures | 1.43 | 1.44 |
| maesterSwaps | 6.38 | 6.39 |
| maesterLongSwaps | 0.76 | 0.80 |
| paladinSacrifices | 0.60 | 0.57 |
| promotions | 0.24 | 0.24 |
| checks | 3.89 | 3.99 |
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
