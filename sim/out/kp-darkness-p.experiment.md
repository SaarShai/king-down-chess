# Rule A/B — kp-darkness-p

`kings=[object Object],[object Object]` against today's defaults.
200 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `kp-darkness-p.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.537 | 0.585 | +0.047 ± 0.081 | no |
| decisive | 0.745 | 0.860 | +0.115 ± 0.075 | yes |
| draw rate | 0.245 | 0.140 | -0.105 ± 0.082 | yes |
| capped | 0.010 | 0.000 | -0.010 ± 0.020 | no |
| mean plies | 117.5 | 96.3 | -21.1 ± 8.1 | yes |
| branching factor | 31.7 | 32.7 | +1.0 ± 0.8 | yes |
| killer move | 0.302 | 0.413 | +0.111 ± 0.039 | yes |
| lead change | 0.067 | 0.079 | +0.012 ± 0.017 | no |
| uncertainty late | 0.648 | 0.640 | -0.007 ± 0.011 | no |
| drama | 0.121 | 0.178 | +0.057 ± 0.036 | yes |
| permanence | 0.961 | 0.945 | -0.016 ± 0.003 | yes |
| min utilisation | 0.45 | 0.39 | -0.03 ± 0.04 | no |
| interest | 0.477 | 0.502 | +0.025 ± 0.013 | yes |
| interest (min-use) | 0.477 | 0.379 | -0.009 ± 0.018 | no |
| killerMove (resid.) | -0.043 | 0.043 | +0.086 ± 0.039 | yes |
| leadChange (resid.) | -0.008 | 0.008 | +0.015 ± 0.017 | no |
| uncertaintyLate (resid.) | -0.000 | 0.000 | +0.001 ± 0.010 | no |
| drama (resid.) | -0.018 | 0.018 | +0.037 ± 0.033 | yes |
| permanence (resid.) | 0.006 | -0.006 | -0.013 ± 0.004 | yes |
| fairyUse (resid.) | 0.001 | 0.001 | -0.001 ± 0.003 | no |
| excessDecisiveness (resid.) | 0.074 | -0.022 | -0.090 ± 0.025 | yes |
| interest (resid.) | -0.005 | 0.008 | +0.013 ± 0.011 | yes |
| interestMinFairy (resid.) | 0.038 | -0.072 | -0.021 ± 0.017 | yes |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 4 (2.0%) | 3 (1.5%) |
| games where a king never moved | 30 (15.0%) | 48 (24.0%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 26.25 | 24.68 | 4.61 | 2.83 | 39.8% | 46.7% |
| M | 14.43 | 10.26 | 1.71 | 1.41 | 28.3% | 41.7% |
| A | 13.39 | 11.27 | 2.21 | 2.27 | 42.7% | 47.3% |
| K | 13.23 | 9.74 | 1.04 | 1.13 | 100.0% | 100.0% |
| R | 12.71 | 7.42 | 1.87 | 1.65 | 42.1% | 33.3% |
| S | 9.79 | 9.37 | 1.42 | 1.85 | 28.2% | 32.6% |
| N | 9.02 | 8.37 | 1.74 | 1.62 | 9.8% | 14.5% |
| B | 6.96 | 6.35 | 1.73 | 1.69 | 18.3% | 23.9% |
| Q | 4.30 | 4.47 | 0.88 | 1.13 | 83.1% | 104.6% |
| L | 4.27 | 3.44 | 1.16 | 1.13 | 6.3% | 3.2% |
| G | 3.13 | 0.99 | 0.00 | 0.00 | 97.6% | 97.6% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.21 | 2.27 |
| beastChainMoves | 1.11 | 1.19 |
| beastChainCaptures | 1.42 | 1.85 |
| maesterSwaps | 6.74 | 3.46 |
| maesterLongSwaps | 0.73 | 0.47 |
| paladinSacrifices | 0.59 | 0.56 |
| promotions | 0.32 | 0.47 |
| checks | 4.34 | 4.59 |
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
