# Rule A/B — kp-leap

`kings=[object Object],[object Object]` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `kp-leap.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.534 | 0.608 | +0.074 ± 0.037 | yes |
| decisive | 0.721 | 0.795 | +0.074 ± 0.029 | yes |
| draw rate | 0.264 | 0.192 | -0.072 ± 0.030 | yes |
| capped | 0.014 | 0.013 | -0.001 ± 0.008 | no |
| mean plies | 121.3 | 103.9 | -17.4 ± 4.6 | yes |
| branching factor | 32.1 | 34.4 | +2.3 ± 0.6 | yes |
| killer move | 0.332 | 0.283 | -0.049 ± 0.023 | yes |
| lead change | 0.068 | 0.041 | -0.027 ± 0.007 | yes |
| uncertainty late | 0.648 | 0.583 | -0.064 ± 0.015 | yes |
| drama | 0.138 | 0.113 | -0.025 ± 0.013 | yes |
| permanence | 0.961 | 0.964 | +0.003 ± 0.002 | yes |
| min utilisation | 0.44 | 0.44 | -0.01 ± 0.01 | no |
| interest | 0.484 | 0.467 | -0.017 ± 0.007 | yes |
| interest (min-use) | 0.484 | 0.467 | -0.021 ± 0.008 | yes |
| killerMove (resid.) | 0.026 | -0.026 | -0.052 ± 0.023 | yes |
| leadChange (resid.) | 0.009 | -0.009 | -0.017 ± 0.007 | yes |
| uncertaintyLate (resid.) | 0.019 | -0.019 | -0.038 ± 0.015 | yes |
| drama (resid.) | 0.013 | -0.013 | -0.026 ± 0.013 | yes |
| permanence (resid.) | -0.002 | 0.002 | +0.004 ± 0.002 | yes |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.045 | -0.025 | -0.058 ± 0.013 | yes |
| interest (resid.) | 0.010 | -0.009 | -0.019 ± 0.007 | yes |
| interestMinFairy (resid.) | 0.026 | 0.002 | -0.028 ± 0.008 | yes |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 30 (1.9%) | 26 (1.6%) |
| games where a king never moved | 259 (16.2%) | 424 (26.5%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 26.54 | 22.60 | 4.41 | 3.88 | 40.7% | 48.6% |
| M | 14.65 | 12.74 | 1.61 | 1.43 | 34.1% | 41.5% |
| A | 14.46 | 12.39 | 2.49 | 2.13 | 46.9% | 56.5% |
| K | 14.32 | 12.72 | 1.04 | 0.92 | 100.0% | 100.0% |
| R | 12.87 | 10.61 | 1.81 | 1.86 | 42.3% | 35.6% |
| S | 10.48 | 9.51 | 1.40 | 1.25 | 32.9% | 41.6% |
| B | 7.34 | 6.51 | 1.65 | 1.56 | 23.5% | 24.0% |
| N | 6.66 | 5.84 | 1.35 | 1.18 | 10.4% | 21.9% |
| Q | 5.93 | 4.32 | 0.99 | 0.86 | 76.3% | 66.1% |
| G | 4.98 | 4.05 | 0.00 | 0.00 | 96.7% | 96.1% |
| L | 3.05 | 2.56 | 0.85 | 0.78 | 6.2% | 11.8% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.49 | 2.13 |
| beastChainMoves | 1.08 | 1.00 |
| beastChainCaptures | 1.40 | 1.25 |
| maesterSwaps | 6.56 | 5.61 |
| maesterLongSwaps | 0.75 | 0.63 |
| paladinSacrifices | 0.39 | 0.37 |
| promotions | 0.32 | 0.28 |
| checks | 4.42 | 3.48 |
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
