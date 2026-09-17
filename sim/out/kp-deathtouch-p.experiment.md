# Rule A/B — kp-deathtouch-p

`kings=[object Object],[object Object]` against today's defaults.
200 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `kp-deathtouch-p.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.537 | 0.535 | -0.003 ± 0.057 | no |
| decisive | 0.745 | 0.660 | -0.085 ± 0.090 | no |
| draw rate | 0.245 | 0.315 | +0.070 ± 0.085 | no |
| capped | 0.010 | 0.025 | +0.015 ± 0.022 | no |
| mean plies | 117.5 | 128.6 | +11.1 ± 7.7 | yes |
| branching factor | 31.7 | 31.5 | -0.2 ± 0.7 | no |
| killer move | 0.302 | 0.322 | +0.019 ± 0.041 | no |
| lead change | 0.067 | 0.065 | -0.002 ± 0.007 | no |
| uncertainty late | 0.648 | 0.651 | +0.004 ± 0.006 | no |
| drama | 0.121 | 0.136 | +0.015 ± 0.026 | no |
| permanence | 0.961 | 0.962 | +0.001 ± 0.001 | no |
| min utilisation | 0.45 | 0.42 | -0.01 ± 0.02 | no |
| interest | 0.477 | 0.485 | +0.006 ± 0.015 | no |
| interest (min-use) | 0.477 | 0.485 | +0.011 ± 0.018 | no |
| killerMove (resid.) | -0.017 | 0.017 | +0.034 ± 0.032 | yes |
| leadChange (resid.) | 0.002 | -0.002 | -0.005 ± 0.007 | no |
| uncertaintyLate (resid.) | 0.001 | -0.001 | -0.001 ± 0.006 | no |
| drama (resid.) | -0.013 | 0.013 | +0.025 ± 0.022 | yes |
| permanence (resid.) | -0.000 | 0.000 | +0.000 ± 0.001 | no |
| fairyUse (resid.) | 0.001 | 0.001 | -0.002 ± 0.003 | no |
| excessDecisiveness (resid.) | -0.003 | 0.072 | +0.063 ± 0.026 | yes |
| interest (resid.) | -0.005 | 0.010 | +0.014 ± 0.009 | yes |
| interestMinFairy (resid.) | 0.017 | 0.034 | +0.022 ± 0.012 | yes |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 4 (2.0%) | 10 (5.0%) |
| games where a king never moved | 30 (15.0%) | 25 (12.5%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 26.25 | 27.01 | 4.61 | 4.75 | 39.8% | 34.8% |
| M | 14.43 | 15.32 | 1.71 | 1.64 | 28.3% | 31.7% |
| A | 13.39 | 13.79 | 2.21 | 2.29 | 42.7% | 44.9% |
| K | 13.23 | 17.75 | 1.04 | 1.80 | 100.0% | 100.0% |
| R | 12.71 | 14.38 | 1.87 | 1.97 | 42.1% | 39.7% |
| S | 9.79 | 10.50 | 1.42 | 1.33 | 28.2% | 26.3% |
| N | 9.02 | 8.89 | 1.74 | 1.65 | 9.8% | 11.0% |
| B | 6.96 | 7.04 | 1.73 | 1.76 | 18.3% | 17.8% |
| Q | 4.30 | 4.86 | 0.88 | 0.82 | 83.1% | 78.5% |
| L | 4.27 | 4.68 | 1.16 | 1.17 | 6.3% | 7.4% |
| G | 3.13 | 4.36 | 0.00 | 0.00 | 97.6% | 93.5% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.21 | 2.29 |
| beastChainMoves | 1.11 | 1.03 |
| beastChainCaptures | 1.42 | 1.33 |
| maesterSwaps | 6.74 | 7.09 |
| maesterLongSwaps | 0.73 | 0.96 |
| paladinSacrifices | 0.59 | 0.56 |
| promotions | 0.32 | 0.39 |
| checks | 4.34 | 4.09 |
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
