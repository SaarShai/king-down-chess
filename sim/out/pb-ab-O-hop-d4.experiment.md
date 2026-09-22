# Rule A/B — pb-ab-O-hop-d4

`ogreHop=true` against today's defaults.
1600 games per population, depth 4, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-O-push-d4b.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.509 | 0.525 | +0.017 ± 0.024 | no |
| decisive | 0.676 | 0.692 | +0.016 ± 0.036 | no |
| draw rate | 0.306 | 0.299 | -0.008 ± 0.034 | no |
| capped | 0.018 | 0.009 | -0.008 ± 0.010 | no |
| mean plies | 111.9 | 108.6 | -3.4 ± 3.8 | no |
| branching factor | 30.9 | 31.7 | +0.8 ± 0.6 | yes |
| killer move | 0.221 | 0.219 | -0.002 ± 0.010 | no |
| lead change | 0.042 | 0.045 | +0.002 ± 0.003 | no |
| uncertainty late | 0.625 | 0.626 | +0.001 ± 0.004 | no |
| drama | 0.131 | 0.136 | +0.005 ± 0.009 | no |
| permanence | 0.966 | 0.966 | -0.000 ± 0.001 | no |
| min utilisation | 0.38 | 0.38 | -0.01 ± 0.02 | no |
| interest | 0.463 | 0.462 | -0.001 ± 0.005 | no |
| interest (min-use) | 0.449 | 0.430 | -0.007 ± 0.011 | no |
| killerMove (resid.) | 0.002 | -0.002 | -0.003 ± 0.010 | no |
| leadChange (resid.) | -0.001 | 0.001 | +0.003 ± 0.003 | no |
| uncertaintyLate (resid.) | -0.001 | 0.001 | +0.002 ± 0.004 | no |
| drama (resid.) | -0.002 | 0.002 | +0.003 ± 0.008 | no |
| permanence (resid.) | 0.000 | -0.000 | -0.000 ± 0.001 | no |
| fairyUse (resid.) | 0.003 | 0.003 | -0.006 ± 0.010 | no |
| excessDecisiveness (resid.) | 0.023 | -0.003 | -0.007 ± 0.012 | no |
| interest (resid.) | 0.002 | 0.000 | -0.002 ± 0.004 | no |
| interestMinFairy (resid.) | 0.009 | -0.010 | -0.008 ± 0.011 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 36 (2.3%) | 52 (3.3%) |
| games where a king never moved | 456 (28.5%) | 474 (29.6%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 21.17 | 20.77 | 3.57 | 3.44 | 38.0% | 39.2% |
| A | 15.96 | 15.40 | 3.73 | 3.60 | 53.9% | 52.6% |
| K | 14.35 | 13.50 | 1.16 | 1.09 | 100.0% | 100.0% |
| O | 11.35 | 11.11 | 0.97 | 1.28 | 65.3% | 52.1% |
| M | 9.76 | 9.30 | 0.97 | 0.92 | 36.4% | 41.1% |
| N | 8.31 | 7.96 | 1.50 | 1.43 | 14.6% | 15.8% |
| S | 7.60 | 7.55 | 1.18 | 1.20 | 49.2% | 48.9% |
| B | 6.43 | 6.37 | 1.32 | 1.38 | 28.5% | 29.2% |
| R | 6.40 | 6.64 | 1.35 | 1.41 | 30.4% | 31.9% |
| Q | 4.84 | 4.63 | 0.83 | 0.83 | 46.6% | 50.6% |
| G | 3.08 | 2.71 | 0.00 | 0.00 | 92.2% | 91.8% |
| L | 2.67 | 2.60 | 0.93 | 0.90 | 6.2% | 6.5% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 3.73 | 3.60 |
| beastChainMoves | 0.93 | 0.96 |
| beastChainCaptures | 1.18 | 1.20 |
| maesterSwaps | 4.05 | 3.94 |
| maesterLongSwaps | 0.52 | 0.49 |
| paladinSacrifices | 0.49 | 0.48 |
| promotions | 0.11 | 0.13 |
| checks | 5.86 | 5.72 |
| ogreShoves | 2.58 | 2.26 |
| ogreShovesFriend | 2.36 | 2.00 |
| ogreShovesGuard | 0.02 | 0.01 |
| catapultChecks | 0.00 | 0.00 |

The pooled columns describe each whole population; the difference column is the mean over the
40 shared arrangements of (rule − base) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
