# Rule A/B — ab-warden-ctrl

`guardNoSecondRank=true` against today's defaults.
1500 games per population, depth 3, the same 60 arrangements and the same
opening seeds in both (common random numbers). Control arm: `ab-warden-wall`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.532 | 0.545 | +0.013 ± 0.027 | no |
| decisive | 0.702 | 0.743 | +0.041 ± 0.028 | yes |
| draw rate | 0.283 | 0.247 | -0.035 ± 0.027 | yes |
| capped | 0.015 | 0.010 | -0.005 ± 0.007 | no |
| mean plies | 121.7 | 114.3 | -7.4 ± 2.7 | yes |
| branching factor | 31.8 | 29.7 | -2.1 ± 0.2 | yes |
| killer move | 0.317 | 0.334 | +0.017 ± 0.016 | yes |
| lead change | 0.064 | 0.065 | +0.001 ± 0.003 | no |
| uncertainty late | 0.646 | 0.645 | -0.001 ± 0.003 | no |
| drama | 0.128 | 0.138 | +0.010 ± 0.010 | no |
| permanence | 0.962 | 0.961 | -0.002 ± 0.001 | yes |
| min utilisation | 0.45 | 0.46 | -0.08 ± 0.03 | yes |
| interest | 0.480 | 0.485 | +0.004 ± 0.005 | no |
| interest (min-use) | 0.472 | 0.378 | -0.082 ± 0.013 | yes |
| killerMove (resid.) | -0.005 | 0.005 | +0.010 ± 0.014 | no |
| leadChange (resid.) | -0.002 | 0.002 | +0.004 ± 0.004 | yes |
| uncertaintyLate (resid.) | -0.002 | 0.002 | +0.004 ± 0.003 | yes |
| drama (resid.) | -0.003 | 0.003 | +0.006 ± 0.010 | no |
| permanence (resid.) | 0.001 | -0.001 | -0.001 ± 0.001 | yes |
| fairyUse (resid.) | 0.001 | 0.002 | -0.003 ± 0.004 | no |
| excessDecisiveness (resid.) | 0.017 | -0.002 | -0.033 ± 0.008 | yes |
| interest (resid.) | 0.000 | 0.001 | -0.000 ± 0.004 | no |
| interestMinFairy (resid.) | 0.060 | -0.038 | -0.085 ± 0.012 | yes |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 33 (2.2%) | 22 (1.5%) |
| games where a king never moved | 263 (17.5%) | 205 (13.7%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 27.26 | 27.23 | 4.79 | 4.73 | 40.2% | 40.1% |
| K | 14.91 | 15.41 | 1.09 | 1.21 | 100.0% | 100.0% |
| M | 12.24 | 12.33 | 1.39 | 1.41 | 30.7% | 30.2% |
| R | 12.18 | 10.78 | 1.84 | 1.76 | 40.0% | 39.9% |
| A | 11.90 | 11.41 | 2.05 | 1.93 | 46.5% | 48.1% |
| S | 9.79 | 9.73 | 1.31 | 1.37 | 32.1% | 33.1% |
| G | 8.87 | 3.31 | 0.00 | 0.00 | 95.2% | 96.1% |
| N | 8.56 | 8.32 | 1.65 | 1.60 | 11.9% | 12.3% |
| B | 6.74 | 6.55 | 1.50 | 1.58 | 25.2% | 24.7% |
| Q | 6.16 | 6.26 | 1.05 | 1.07 | 76.0% | 74.3% |
| L | 3.05 | 2.97 | 0.53 | 0.54 | 11.1% | 8.6% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.05 | 1.93 |
| beastChainMoves | 1.04 | 1.07 |
| beastChainCaptures | 1.31 | 1.37 |
| maesterSwaps | 5.62 | 5.61 |
| maesterLongSwaps | 0.55 | 0.60 |
| paladinSacrifices | 0.53 | 0.54 |
| promotions | 0.34 | 0.34 |
| checks | 4.13 | 4.50 |

The pooled columns describe each whole population; the difference column is the mean over the
60 shared arrangements of (rule − base) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
