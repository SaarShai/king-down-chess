# Rule A/B — kp-strike2

`kings=[object Object],[object Object] strikeMode=capture` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `kp-strike2.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.534 | 0.494 | -0.040 ± 0.033 | yes |
| decisive | 0.721 | 0.621 | -0.101 ± 0.034 | yes |
| draw rate | 0.264 | 0.379 | +0.115 ± 0.035 | yes |
| capped | 0.014 | 0.000 | -0.014 ± 0.007 | yes |
| mean plies | 121.3 | 85.5 | -35.8 ± 3.5 | yes |
| branching factor | 32.1 | 34.1 | +2.0 ± 0.4 | yes |
| killer move | 0.332 | 0.305 | -0.027 ± 0.017 | yes |
| lead change | 0.068 | 0.048 | -0.020 ± 0.006 | yes |
| uncertainty late | 0.648 | 0.596 | -0.051 ± 0.008 | yes |
| drama | 0.138 | 0.105 | -0.033 ± 0.014 | yes |
| permanence | 0.961 | 0.943 | -0.018 ± 0.003 | yes |
| min utilisation | 0.44 | 0.51 | +0.07 ± 0.01 | yes |
| interest | 0.484 | 0.471 | -0.014 ± 0.005 | yes |
| interest (min-use) | 0.484 | 0.421 | -0.033 ± 0.013 | yes |
| killerMove (resid.) | -0.002 | 0.002 | +0.005 ± 0.016 | no |
| leadChange (resid.) | 0.009 | -0.009 | -0.018 ± 0.006 | yes |
| uncertaintyLate (resid.) | 0.025 | -0.025 | -0.050 ± 0.008 | yes |
| drama (resid.) | 0.005 | -0.005 | -0.011 ± 0.013 | no |
| permanence (resid.) | 0.009 | -0.009 | -0.018 ± 0.003 | yes |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | -0.027 | 0.067 | +0.084 ± 0.012 | yes |
| interest (resid.) | 0.001 | 0.001 | -0.000 ± 0.005 | no |
| interestMinFairy (resid.) | 0.018 | -0.024 | -0.012 ± 0.013 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 30 (1.9%) | 3 (0.2%) |
| games where a king never moved | 259 (16.2%) | 532 (33.3%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 26.54 | 21.84 | 4.41 | 4.83 | 40.7% | 49.6% |
| M | 14.65 | 10.69 | 1.61 | 1.15 | 34.1% | 48.6% |
| A | 14.46 | 10.22 | 2.49 | 1.79 | 46.9% | 62.3% |
| K | 14.32 | 7.51 | 1.04 | 0.56 | 100.0% | 100.0% |
| R | 12.87 | 8.24 | 1.81 | 1.39 | 42.3% | 56.0% |
| S | 10.48 | 7.87 | 1.40 | 0.97 | 32.9% | 51.0% |
| B | 7.34 | 5.44 | 1.65 | 1.33 | 23.5% | 37.6% |
| N | 6.66 | 5.45 | 1.35 | 1.11 | 10.4% | 27.3% |
| Q | 5.93 | 3.87 | 0.99 | 0.71 | 76.3% | 73.5% |
| G | 4.98 | 2.30 | 0.00 | 0.00 | 96.7% | 98.8% |
| L | 3.05 | 2.09 | 0.85 | 0.70 | 6.2% | 13.7% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.49 | 1.79 |
| beastChainMoves | 1.08 | 0.78 |
| beastChainCaptures | 1.40 | 0.97 |
| maesterSwaps | 6.56 | 4.85 |
| maesterLongSwaps | 0.75 | 0.58 |
| paladinSacrifices | 0.39 | 0.23 |
| promotions | 0.32 | 0.16 |
| checks | 4.42 | 2.62 |
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
