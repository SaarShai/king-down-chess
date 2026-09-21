# Rule A/B — pb-ab-M-king

`maesterKingSwapAnywhere=true` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-M-king.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.561 | 0.573 | +0.012 ± 0.011 | yes |
| decisive | 0.792 | 0.792 | +0.001 ± 0.014 | no |
| draw rate | 0.198 | 0.199 | +0.001 ± 0.015 | no |
| capped | 0.010 | 0.008 | -0.002 ± 0.003 | no |
| mean plies | 110.3 | 110.9 | +0.7 ± 1.4 | no |
| branching factor | 32.7 | 32.9 | +0.2 ± 0.1 | yes |
| killer move | 0.331 | 0.331 | -0.001 ± 0.008 | no |
| lead change | 0.059 | 0.058 | -0.000 ± 0.001 | no |
| uncertainty late | 0.631 | 0.632 | +0.000 ± 0.001 | no |
| drama | 0.145 | 0.143 | -0.001 ± 0.005 | no |
| permanence | 0.959 | 0.959 | +0.000 ± 0.000 | no |
| min utilisation | 0.43 | 0.43 | +0.00 ± 0.00 | no |
| interest | 0.483 | 0.483 | -0.000 ± 0.002 | no |
| interest (min-use) | 0.483 | 0.477 | -0.001 ± 0.004 | no |
| killerMove (resid.) | 0.000 | -0.000 | -0.000 ± 0.007 | no |
| leadChange (resid.) | 0.000 | -0.000 | -0.000 ± 0.001 | no |
| uncertaintyLate (resid.) | -0.000 | 0.000 | +0.000 ± 0.001 | no |
| drama (resid.) | 0.001 | -0.001 | -0.001 ± 0.004 | no |
| permanence (resid.) | -0.000 | 0.000 | +0.000 ± 0.000 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | -0.000 | -0.001 | +0.001 ± 0.004 | no |
| interest (resid.) | 0.000 | -0.000 | +0.000 ± 0.002 | no |
| interestMinFairy (resid.) | 0.012 | 0.006 | -0.001 ± 0.004 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 14 (0.9%) | 17 (1.1%) |
| games where a king never moved | 423 (26.4%) | 411 (25.7%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 23.45 | 23.60 | 3.84 | 3.83 | 41.3% | 40.8% |
| M | 14.40 | 14.51 | 1.37 | 1.38 | 35.0% | 32.9% |
| A | 13.99 | 14.09 | 3.38 | 3.44 | 51.6% | 51.2% |
| S | 11.14 | 11.20 | 1.43 | 1.44 | 43.0% | 42.8% |
| K | 10.95 | 11.11 | 0.78 | 0.80 | 100.0% | 100.0% |
| R | 9.48 | 9.53 | 1.67 | 1.71 | 37.3% | 36.3% |
| N | 8.14 | 8.10 | 1.44 | 1.43 | 13.2% | 13.0% |
| B | 5.93 | 6.04 | 1.30 | 1.30 | 30.2% | 29.6% |
| Q | 5.53 | 5.58 | 0.94 | 0.96 | 70.6% | 72.6% |
| L | 4.34 | 4.31 | 1.20 | 1.20 | 7.1% | 7.4% |
| G | 2.93 | 2.85 | 0.00 | 0.00 | 96.6% | 97.4% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 3.38 | 3.44 |
| beastChainMoves | 1.13 | 1.14 |
| beastChainCaptures | 1.43 | 1.44 |
| maesterSwaps | 6.38 | 6.57 |
| maesterLongSwaps | 0.76 | 0.97 |
| paladinSacrifices | 0.60 | 0.60 |
| promotions | 0.24 | 0.26 |
| checks | 3.89 | 3.92 |
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
