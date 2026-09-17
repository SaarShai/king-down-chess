# Rule A/B — ab-archer-val

`` against today's defaults, both arms at `--values A=337`.
800 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `ab-archer-val.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.532 | 0.529 | -0.003 ± 0.040 | no |
| decisive | 0.710 | 0.729 | +0.019 ± 0.034 | no |
| draw rate | 0.276 | 0.264 | -0.013 ± 0.030 | no |
| capped | 0.014 | 0.007 | -0.006 ± 0.010 | no |
| mean plies | 117.8 | 119.1 | +1.3 ± 3.2 | no |
| branching factor | 32.4 | 32.9 | +0.4 ± 0.3 | yes |
| killer move | 0.326 | 0.334 | +0.008 ± 0.016 | no |
| lead change | 0.062 | 0.062 | +0.000 ± 0.004 | no |
| uncertainty late | 0.648 | 0.648 | -0.000 ± 0.003 | no |
| drama | 0.129 | 0.142 | +0.013 ± 0.012 | yes |
| permanence | 0.962 | 0.961 | -0.001 ± 0.001 | no |
| min utilisation | 0.45 | 0.44 | -0.01 ± 0.01 | no |
| interest | 0.482 | 0.487 | +0.003 ± 0.006 | no |
| interest (min-use) | 0.482 | 0.487 | +0.006 ± 0.007 | no |
| killerMove (resid.) | -0.002 | 0.002 | +0.004 ± 0.011 | no |
| leadChange (resid.) | -0.000 | 0.000 | +0.001 ± 0.004 | no |
| uncertaintyLate (resid.) | -0.001 | 0.001 | +0.001 ± 0.003 | no |
| drama (resid.) | -0.005 | 0.005 | +0.011 ± 0.009 | yes |
| permanence (resid.) | 0.000 | -0.000 | -0.000 ± 0.001 | no |
| fairyUse (resid.) | 0.002 | 0.003 | +0.000 ± 0.001 | no |
| excessDecisiveness (resid.) | 0.007 | 0.016 | -0.012 ± 0.013 | no |
| interest (resid.) | -0.000 | 0.003 | +0.001 ± 0.003 | no |
| interestMinFairy (resid.) | 0.013 | 0.015 | +0.004 ± 0.007 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 15 (1.9%) | 13 (1.6%) |
| games where a king never moved | 151 (18.9%) | 148 (18.5%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 26.35 | 26.22 | 4.60 | 4.49 | 41.0% | 40.8% |
| M | 16.01 | 16.89 | 1.75 | 1.77 | 34.7% | 35.7% |
| K | 13.42 | 13.15 | 0.95 | 1.00 | 100.0% | 100.0% |
| A | 12.73 | 12.63 | 2.14 | 2.16 | 44.9% | 42.6% |
| R | 11.04 | 11.80 | 1.76 | 1.80 | 41.7% | 41.7% |
| S | 10.00 | 9.88 | 1.23 | 1.35 | 32.1% | 29.9% |
| N | 8.01 | 7.94 | 1.67 | 1.69 | 9.1% | 9.5% |
| B | 6.34 | 5.69 | 1.46 | 1.42 | 23.4% | 21.9% |
| Q | 6.08 | 6.39 | 0.99 | 1.06 | 77.2% | 77.5% |
| L | 4.29 | 5.00 | 1.23 | 1.20 | 6.1% | 11.1% |
| G | 3.57 | 3.51 | 0.00 | 0.00 | 97.1% | 96.6% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.14 | 2.16 |
| beastChainMoves | 0.98 | 1.04 |
| beastChainCaptures | 1.23 | 1.35 |
| maesterSwaps | 7.10 | 7.49 |
| maesterLongSwaps | 0.74 | 0.82 |
| paladinSacrifices | 0.60 | 0.50 |
| promotions | 0.31 | 0.34 |
| checks | 4.24 | 4.27 |
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
