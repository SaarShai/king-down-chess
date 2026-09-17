# Rule A/B — kp-darkness

`kings=[object Object],[object Object]` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `kp-darkness.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.534 | 0.542 | +0.008 ± 0.039 | no |
| decisive | 0.721 | 0.876 | +0.154 ± 0.039 | yes |
| draw rate | 0.264 | 0.122 | -0.142 ± 0.038 | yes |
| capped | 0.014 | 0.002 | -0.013 ± 0.007 | yes |
| mean plies | 121.3 | 94.1 | -27.2 ± 3.7 | yes |
| branching factor | 32.1 | 33.0 | +0.8 ± 0.3 | yes |
| killer move | 0.332 | 0.415 | +0.083 ± 0.019 | yes |
| lead change | 0.068 | 0.082 | +0.014 ± 0.006 | yes |
| uncertainty late | 0.648 | 0.638 | -0.010 ± 0.006 | yes |
| drama | 0.138 | 0.173 | +0.035 ± 0.012 | yes |
| permanence | 0.961 | 0.946 | -0.015 ± 0.002 | yes |
| min utilisation | 0.44 | 0.49 | +0.00 ± 0.03 | no |
| interest | 0.484 | 0.500 | +0.016 ± 0.006 | yes |
| interest (min-use) | 0.484 | 0.397 | -0.033 ± 0.016 | yes |
| killerMove (resid.) | -0.009 | 0.009 | +0.018 ± 0.015 | yes |
| leadChange (resid.) | -0.006 | 0.006 | +0.012 ± 0.006 | yes |
| uncertaintyLate (resid.) | -0.002 | 0.002 | +0.005 ± 0.004 | yes |
| drama (resid.) | -0.004 | 0.004 | +0.009 ± 0.011 | no |
| permanence (resid.) | 0.002 | -0.002 | -0.005 ± 0.002 | yes |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.053 | -0.034 | -0.075 ± 0.019 | yes |
| interest (resid.) | 0.002 | -0.001 | -0.002 ± 0.004 | no |
| interestMinFairy (resid.) | 0.024 | -0.054 | -0.024 ± 0.017 | yes |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 30 (1.9%) | 16 (1.0%) |
| games where a king never moved | 259 (16.2%) | 427 (26.7%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 26.54 | 24.13 | 4.41 | 2.50 | 40.7% | 49.2% |
| M | 14.65 | 9.97 | 1.61 | 1.44 | 34.1% | 42.9% |
| A | 14.46 | 12.18 | 2.49 | 2.48 | 46.9% | 47.6% |
| K | 14.32 | 8.97 | 1.04 | 1.01 | 100.0% | 100.0% |
| R | 12.87 | 7.39 | 1.81 | 1.83 | 42.3% | 30.9% |
| S | 10.48 | 10.31 | 1.40 | 1.90 | 32.9% | 33.2% |
| B | 7.34 | 6.36 | 1.65 | 1.66 | 23.5% | 28.9% |
| N | 6.66 | 6.38 | 1.35 | 1.25 | 10.4% | 16.9% |
| Q | 5.93 | 4.53 | 0.99 | 1.18 | 76.3% | 85.7% |
| G | 4.98 | 1.64 | 0.00 | 0.00 | 96.7% | 97.4% |
| L | 3.05 | 2.26 | 0.85 | 0.78 | 6.2% | 6.8% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.49 | 2.48 |
| beastChainMoves | 1.08 | 1.30 |
| beastChainCaptures | 1.40 | 1.90 |
| maesterSwaps | 6.56 | 3.49 |
| maesterLongSwaps | 0.75 | 0.49 |
| paladinSacrifices | 0.39 | 0.39 |
| promotions | 0.32 | 0.45 |
| checks | 4.42 | 4.18 |
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
