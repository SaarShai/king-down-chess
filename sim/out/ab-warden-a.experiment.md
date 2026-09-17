# Rule A/B — ab-warden-a

`guardStep=2` against today's defaults.
1500 games per population, depth 3, the same 60 arrangements and the same
opening seeds in both (common random numbers). Control arm: `ab-warden-wall`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.532 | 0.537 | +0.005 ± 0.024 | no |
| decisive | 0.702 | 0.675 | -0.027 ± 0.023 | yes |
| draw rate | 0.283 | 0.293 | +0.010 ± 0.021 | no |
| capped | 0.015 | 0.033 | +0.017 ± 0.009 | yes |
| mean plies | 121.7 | 127.3 | +5.7 ± 3.2 | yes |
| branching factor | 31.8 | 33.3 | +1.4 ± 0.2 | yes |
| killer move | 0.317 | 0.320 | +0.003 ± 0.012 | no |
| lead change | 0.064 | 0.063 | -0.001 ± 0.003 | no |
| uncertainty late | 0.646 | 0.644 | -0.001 ± 0.002 | no |
| drama | 0.128 | 0.122 | -0.005 ± 0.010 | no |
| permanence | 0.962 | 0.962 | -0.000 ± 0.001 | no |
| min utilisation | 0.45 | 0.43 | -0.01 ± 0.01 | yes |
| interest | 0.480 | 0.481 | -0.000 ± 0.004 | no |
| interest (min-use) | 0.472 | 0.481 | +0.011 ± 0.010 | yes |
| killerMove (resid.) | -0.003 | 0.003 | +0.005 ± 0.011 | no |
| leadChange (resid.) | 0.001 | -0.001 | -0.001 ± 0.002 | no |
| uncertaintyLate (resid.) | 0.001 | -0.001 | -0.003 ± 0.002 | yes |
| drama (resid.) | 0.002 | -0.002 | -0.004 ± 0.009 | no |
| permanence (resid.) | 0.000 | -0.000 | -0.000 ± 0.001 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | -0.004 | 0.021 | +0.010 ± 0.011 | no |
| interest (resid.) | -0.000 | 0.001 | +0.001 ± 0.003 | no |
| interestMinFairy (resid.) | 0.012 | 0.021 | +0.012 ± 0.010 | yes |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 33 (2.2%) | 46 (3.1%) |
| games where a king never moved | 263 (17.5%) | 252 (16.8%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 27.26 | 27.48 | 4.79 | 4.85 | 40.2% | 39.7% |
| K | 14.91 | 15.09 | 1.09 | 1.15 | 100.0% | 100.0% |
| M | 12.24 | 12.47 | 1.39 | 1.35 | 30.7% | 31.3% |
| R | 12.18 | 12.94 | 1.84 | 1.87 | 40.0% | 41.4% |
| A | 11.90 | 11.88 | 2.05 | 1.98 | 46.5% | 47.3% |
| S | 9.79 | 9.65 | 1.31 | 1.29 | 32.1% | 31.8% |
| G | 8.87 | 12.38 | 0.00 | 0.00 | 95.2% | 96.0% |
| N | 8.56 | 8.53 | 1.65 | 1.63 | 11.9% | 11.6% |
| B | 6.74 | 6.91 | 1.50 | 1.53 | 25.2% | 25.2% |
| Q | 6.16 | 6.63 | 1.05 | 1.08 | 76.0% | 72.8% |
| L | 3.05 | 3.36 | 0.53 | 0.53 | 11.1% | 10.5% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.05 | 1.98 |
| beastChainMoves | 1.04 | 1.03 |
| beastChainCaptures | 1.31 | 1.29 |
| maesterSwaps | 5.62 | 5.88 |
| maesterLongSwaps | 0.55 | 0.57 |
| paladinSacrifices | 0.53 | 0.53 |
| promotions | 0.34 | 0.29 |
| checks | 4.13 | 4.21 |

The pooled columns describe each whole population; the difference column is the mean over the
60 shared arrangements of (rule − base) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
