# Rule A/B — kp-strike-p

`kings=[object Object],[object Object]` against today's defaults.
200 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `kp-strike-p.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.537 | 0.512 | -0.025 ± 0.081 | no |
| decisive | 0.745 | 0.575 | -0.170 ± 0.095 | yes |
| draw rate | 0.245 | 0.425 | +0.180 ± 0.097 | yes |
| capped | 0.010 | 0.000 | -0.010 ± 0.020 | no |
| mean plies | 117.5 | 92.6 | -24.9 ± 7.9 | yes |
| branching factor | 31.7 | 38.4 | +6.7 ± 1.6 | yes |
| killer move | 0.302 | 0.229 | -0.073 ± 0.032 | yes |
| lead change | 0.067 | 0.034 | -0.033 ± 0.013 | yes |
| uncertainty late | 0.648 | 0.603 | -0.044 ± 0.019 | yes |
| drama | 0.121 | 0.069 | -0.052 ± 0.024 | yes |
| permanence | 0.961 | 0.964 | +0.003 ± 0.002 | yes |
| min utilisation | 0.45 | 0.50 | +0.04 ± 0.03 | yes |
| interest | 0.477 | 0.458 | -0.021 ± 0.011 | yes |
| interest (min-use) | 0.477 | 0.447 | -0.027 ± 0.019 | yes |
| killerMove (resid.) | 0.026 | -0.026 | -0.051 ± 0.031 | yes |
| leadChange (resid.) | 0.017 | -0.017 | -0.034 ± 0.013 | yes |
| uncertaintyLate (resid.) | 0.029 | -0.029 | -0.059 ± 0.014 | yes |
| drama (resid.) | 0.018 | -0.018 | -0.035 ± 0.023 | yes |
| permanence (resid.) | -0.001 | 0.001 | +0.002 ± 0.002 | yes |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | -0.042 | 0.133 | +0.141 ± 0.031 | yes |
| interest (resid.) | 0.006 | -0.000 | -0.008 ± 0.009 | no |
| interestMinFairy (resid.) | 0.034 | 0.018 | -0.013 ± 0.017 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 4 (2.0%) | 1 (0.5%) |
| games where a king never moved | 30 (15.0%) | 53 (26.5%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 26.25 | 22.96 | 4.61 | 4.43 | 39.8% | 48.3% |
| M | 14.43 | 11.46 | 1.71 | 1.43 | 28.3% | 39.5% |
| A | 13.39 | 10.08 | 2.21 | 1.64 | 42.7% | 58.1% |
| K | 13.23 | 9.64 | 1.04 | 0.91 | 100.0% | 100.0% |
| R | 12.71 | 8.19 | 1.87 | 1.42 | 42.1% | 50.3% |
| S | 9.79 | 8.07 | 1.42 | 1.11 | 28.2% | 42.1% |
| N | 9.02 | 7.25 | 1.74 | 1.39 | 9.8% | 23.3% |
| B | 6.96 | 6.04 | 1.73 | 1.44 | 18.3% | 33.9% |
| Q | 4.30 | 3.61 | 0.88 | 0.74 | 83.1% | 78.5% |
| L | 4.27 | 2.92 | 1.16 | 1.01 | 6.3% | 18.4% |
| G | 3.13 | 2.33 | 0.00 | 0.00 | 97.6% | 99.4% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.21 | 1.64 |
| beastChainMoves | 1.11 | 0.91 |
| beastChainCaptures | 1.42 | 1.11 |
| maesterSwaps | 6.74 | 4.79 |
| maesterLongSwaps | 0.73 | 0.53 |
| paladinSacrifices | 0.59 | 0.47 |
| promotions | 0.32 | 0.39 |
| checks | 4.34 | 3.08 |
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
