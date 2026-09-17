# Rule A/B — ab-guard-dbl-slide

`guardDoubleFirst=slide` against today's defaults.
1500 games per population, depth 3, the same 60 arrangements and the same
opening seeds in both (common random numbers). Control arm: `ab-warden-wall`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.532 | 0.514 | -0.018 ± 0.022 | no |
| decisive | 0.702 | 0.683 | -0.019 ± 0.023 | no |
| draw rate | 0.283 | 0.296 | +0.013 ± 0.022 | no |
| capped | 0.015 | 0.021 | +0.005 ± 0.009 | no |
| mean plies | 121.7 | 124.4 | +2.7 ± 2.8 | no |
| branching factor | 31.8 | 32.5 | +0.7 ± 0.2 | yes |
| killer move | 0.317 | 0.319 | +0.002 ± 0.012 | no |
| lead change | 0.064 | 0.064 | -0.000 ± 0.002 | no |
| uncertainty late | 0.646 | 0.645 | -0.001 ± 0.002 | no |
| drama | 0.128 | 0.126 | -0.001 ± 0.010 | no |
| permanence | 0.962 | 0.962 | -0.000 ± 0.001 | no |
| min utilisation | 0.45 | 0.44 | -0.00 ± 0.01 | no |
| interest | 0.480 | 0.481 | +0.000 ± 0.004 | no |
| interest (min-use) | 0.472 | 0.481 | +0.009 ± 0.008 | yes |
| killerMove (resid.) | -0.003 | 0.003 | +0.005 ± 0.011 | no |
| leadChange (resid.) | 0.001 | -0.001 | -0.001 ± 0.002 | no |
| uncertaintyLate (resid.) | 0.001 | -0.001 | -0.003 ± 0.002 | yes |
| drama (resid.) | -0.000 | 0.000 | +0.000 ± 0.009 | no |
| permanence (resid.) | 0.000 | -0.000 | -0.000 ± 0.001 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | -0.006 | 0.026 | +0.013 ± 0.010 | yes |
| interest (resid.) | -0.001 | 0.002 | +0.002 ± 0.003 | no |
| interestMinFairy (resid.) | 0.012 | 0.022 | +0.010 ± 0.008 | yes |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 33 (2.2%) | 39 (2.6%) |
| games where a king never moved | 263 (17.5%) | 252 (16.8%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 27.26 | 27.40 | 4.79 | 4.85 | 40.2% | 39.8% |
| K | 14.91 | 14.65 | 1.09 | 1.14 | 100.0% | 100.0% |
| M | 12.24 | 12.49 | 1.39 | 1.35 | 30.7% | 31.8% |
| R | 12.18 | 12.58 | 1.84 | 1.87 | 40.0% | 40.9% |
| A | 11.90 | 12.02 | 2.05 | 2.01 | 46.5% | 48.3% |
| S | 9.79 | 9.67 | 1.31 | 1.29 | 32.1% | 32.0% |
| G | 8.87 | 10.97 | 0.00 | 0.00 | 95.2% | 95.6% |
| N | 8.56 | 8.47 | 1.65 | 1.64 | 11.9% | 11.5% |
| B | 6.74 | 6.60 | 1.50 | 1.51 | 25.2% | 25.1% |
| Q | 6.16 | 6.29 | 1.05 | 1.08 | 76.0% | 69.5% |
| L | 3.05 | 3.25 | 0.53 | 0.53 | 11.1% | 10.5% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.05 | 2.01 |
| beastChainMoves | 1.04 | 1.02 |
| beastChainCaptures | 1.31 | 1.29 |
| maesterSwaps | 5.62 | 5.85 |
| maesterLongSwaps | 0.55 | 0.55 |
| paladinSacrifices | 0.53 | 0.53 |
| promotions | 0.34 | 0.29 |
| checks | 4.13 | 4.00 |

The pooled columns describe each whole population; the difference column is the mean over the
60 shared arrangements of (rule − base) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
