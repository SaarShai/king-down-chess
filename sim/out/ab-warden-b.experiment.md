# Rule A/B — ab-warden-b

`guardStep=2 guardNoSecondRank=true` against today's defaults.
1500 games per population, depth 3, the same 60 arrangements and the same
opening seeds in both (common random numbers). Control arm: `ab-warden-wall`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.532 | 0.518 | -0.014 ± 0.027 | no |
| decisive | 0.702 | 0.676 | -0.026 ± 0.028 | no |
| draw rate | 0.283 | 0.307 | +0.024 ± 0.025 | no |
| capped | 0.015 | 0.017 | +0.002 ± 0.009 | no |
| mean plies | 121.7 | 122.7 | +1.1 ± 3.3 | no |
| branching factor | 31.8 | 31.4 | -0.4 ± 0.3 | yes |
| killer move | 0.317 | 0.321 | +0.004 ± 0.016 | no |
| lead change | 0.064 | 0.065 | +0.001 ± 0.004 | no |
| uncertainty late | 0.646 | 0.646 | -0.000 ± 0.003 | no |
| drama | 0.128 | 0.130 | +0.002 ± 0.011 | no |
| permanence | 0.962 | 0.962 | -0.001 ± 0.001 | no |
| min utilisation | 0.45 | 0.44 | +0.00 ± 0.01 | no |
| interest | 0.480 | 0.483 | +0.001 ± 0.005 | no |
| interest (min-use) | 0.472 | 0.477 | +0.003 ± 0.011 | no |
| killerMove (resid.) | -0.005 | 0.005 | +0.010 ± 0.014 | no |
| leadChange (resid.) | 0.001 | -0.001 | -0.001 ± 0.004 | no |
| uncertaintyLate (resid.) | 0.002 | -0.002 | -0.003 ± 0.003 | yes |
| drama (resid.) | -0.003 | 0.003 | +0.005 ± 0.009 | no |
| permanence (resid.) | 0.001 | -0.001 | -0.001 ± 0.001 | yes |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | -0.011 | 0.046 | +0.022 ± 0.011 | yes |
| interest (resid.) | -0.002 | 0.004 | +0.004 ± 0.004 | no |
| interestMinFairy (resid.) | 0.015 | 0.022 | +0.006 ± 0.010 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 33 (2.2%) | 52 (3.5%) |
| games where a king never moved | 263 (17.5%) | 187 (12.5%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 27.26 | 27.30 | 4.79 | 4.75 | 40.2% | 40.5% |
| K | 14.91 | 15.95 | 1.09 | 1.21 | 100.0% | 100.0% |
| M | 12.24 | 12.51 | 1.39 | 1.41 | 30.7% | 31.8% |
| R | 12.18 | 11.89 | 1.84 | 1.77 | 40.0% | 42.9% |
| A | 11.90 | 11.63 | 2.05 | 1.96 | 46.5% | 48.6% |
| S | 9.79 | 9.66 | 1.31 | 1.27 | 32.1% | 33.7% |
| G | 8.87 | 9.52 | 0.00 | 0.00 | 95.2% | 96.2% |
| N | 8.56 | 8.29 | 1.65 | 1.59 | 11.9% | 12.6% |
| B | 6.74 | 6.70 | 1.50 | 1.53 | 25.2% | 25.8% |
| Q | 6.16 | 6.18 | 1.05 | 1.03 | 76.0% | 70.3% |
| L | 3.05 | 3.11 | 0.53 | 0.54 | 11.1% | 9.0% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.05 | 1.96 |
| beastChainMoves | 1.04 | 1.02 |
| beastChainCaptures | 1.31 | 1.27 |
| maesterSwaps | 5.62 | 5.72 |
| maesterLongSwaps | 0.55 | 0.58 |
| paladinSacrifices | 0.53 | 0.54 |
| promotions | 0.34 | 0.30 |
| checks | 4.13 | 4.19 |

The pooled columns describe each whole population; the difference column is the mean over the
60 shared arrangements of (rule − base) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
