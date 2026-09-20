# Rule A/B — kp-strike

`kings=[object Object],[object Object]` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `kp-strike.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.534 | 0.557 | +0.023 ± 0.026 | no |
| decisive | 0.721 | 0.566 | -0.155 ± 0.032 | yes |
| draw rate | 0.264 | 0.434 | +0.169 ± 0.032 | yes |
| capped | 0.014 | 0.000 | -0.014 ± 0.007 | yes |
| mean plies | 121.3 | 93.7 | -27.6 ± 3.6 | yes |
| branching factor | 32.1 | 37.5 | +5.4 ± 0.8 | yes |
| killer move | 0.332 | 0.245 | -0.087 ± 0.014 | yes |
| lead change | 0.068 | 0.044 | -0.024 ± 0.005 | yes |
| uncertainty late | 0.648 | 0.614 | -0.034 ± 0.006 | yes |
| drama | 0.138 | 0.082 | -0.056 ± 0.011 | yes |
| permanence | 0.961 | 0.964 | +0.003 ± 0.001 | yes |
| min utilisation | 0.44 | 0.48 | +0.03 ± 0.01 | yes |
| interest | 0.484 | 0.460 | -0.024 ± 0.005 | yes |
| interest (min-use) | 0.484 | 0.408 | -0.043 ± 0.011 | yes |
| killerMove (resid.) | 0.011 | -0.011 | -0.022 ± 0.013 | yes |
| leadChange (resid.) | 0.008 | -0.008 | -0.017 ± 0.006 | yes |
| uncertaintyLate (resid.) | 0.016 | -0.016 | -0.031 ± 0.006 | yes |
| drama (resid.) | 0.011 | -0.011 | -0.021 ± 0.011 | yes |
| permanence (resid.) | 0.000 | -0.000 | -0.000 ± 0.001 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | -0.029 | 0.054 | +0.089 ± 0.017 | yes |
| interest (resid.) | 0.002 | -0.001 | -0.003 ± 0.004 | no |
| interestMinFairy (resid.) | 0.017 | -0.025 | -0.009 ± 0.011 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 30 (1.9%) | 4 (0.3%) |
| games where a king never moved | 259 (16.2%) | 422 (26.4%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 26.54 | 22.30 | 4.41 | 4.23 | 40.7% | 48.4% |
| M | 14.65 | 12.04 | 1.61 | 1.38 | 34.1% | 44.2% |
| A | 14.46 | 10.95 | 2.49 | 1.79 | 46.9% | 57.0% |
| K | 14.32 | 8.83 | 1.04 | 0.75 | 100.0% | 100.0% |
| R | 12.87 | 9.20 | 1.81 | 1.53 | 42.3% | 50.7% |
| S | 10.48 | 8.84 | 1.40 | 1.22 | 32.9% | 46.3% |
| B | 7.34 | 5.85 | 1.65 | 1.42 | 23.5% | 31.0% |
| N | 6.66 | 6.13 | 1.35 | 1.28 | 10.4% | 20.0% |
| Q | 5.93 | 4.55 | 0.99 | 0.85 | 76.3% | 72.8% |
| G | 4.98 | 2.50 | 0.00 | 0.00 | 96.7% | 99.1% |
| L | 3.05 | 2.50 | 0.85 | 0.76 | 6.2% | 14.6% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.49 | 1.79 |
| beastChainMoves | 1.08 | 0.94 |
| beastChainCaptures | 1.40 | 1.22 |
| maesterSwaps | 6.56 | 5.23 |
| maesterLongSwaps | 0.75 | 0.62 |
| paladinSacrifices | 0.39 | 0.37 |
| promotions | 0.32 | 0.32 |
| checks | 4.42 | 2.98 |
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
