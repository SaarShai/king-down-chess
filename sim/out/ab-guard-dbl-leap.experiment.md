# Rule A/B — ab-guard-dbl-leap

`guardDoubleFirst=leap` against today's defaults.
1500 games per population, depth 3, the same 60 arrangements and the same
opening seeds in both (common random numbers). Control arm: `ab-warden-wall`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.532 | 0.495 | -0.036 ± 0.025 | yes |
| decisive | 0.702 | 0.679 | -0.023 ± 0.033 | no |
| draw rate | 0.283 | 0.289 | +0.006 ± 0.033 | no |
| capped | 0.015 | 0.033 | +0.017 ± 0.010 | yes |
| mean plies | 121.7 | 126.8 | +5.2 ± 3.9 | yes |
| branching factor | 31.8 | 33.3 | +1.5 ± 0.3 | yes |
| killer move | 0.317 | 0.310 | -0.007 ± 0.016 | no |
| lead change | 0.064 | 0.064 | +0.000 ± 0.006 | no |
| uncertainty late | 0.646 | 0.647 | +0.001 ± 0.005 | no |
| drama | 0.128 | 0.121 | -0.007 ± 0.012 | no |
| permanence | 0.962 | 0.963 | +0.001 ± 0.001 | no |
| min utilisation | 0.45 | 0.43 | -0.02 ± 0.01 | yes |
| interest | 0.480 | 0.478 | -0.002 ± 0.006 | no |
| interest (min-use) | 0.472 | 0.472 | +0.014 ± 0.011 | yes |
| killerMove (resid.) | 0.003 | -0.003 | -0.006 ± 0.013 | no |
| leadChange (resid.) | 0.000 | -0.000 | -0.000 ± 0.006 | no |
| uncertaintyLate (resid.) | -0.000 | 0.000 | +0.000 ± 0.004 | no |
| drama (resid.) | 0.003 | -0.003 | -0.006 ± 0.011 | no |
| permanence (resid.) | -0.000 | 0.000 | +0.001 ± 0.001 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | -0.002 | 0.014 | +0.006 ± 0.011 | no |
| interest (resid.) | 0.001 | -0.000 | -0.001 ± 0.004 | no |
| interestMinFairy (resid.) | 0.011 | 0.011 | +0.014 ± 0.010 | yes |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 33 (2.2%) | 37 (2.5%) |
| games where a king never moved | 263 (17.5%) | 256 (17.1%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 27.26 | 27.11 | 4.79 | 4.70 | 40.2% | 40.8% |
| K | 14.91 | 14.88 | 1.09 | 1.10 | 100.0% | 100.0% |
| M | 12.24 | 12.75 | 1.39 | 1.38 | 30.7% | 32.0% |
| R | 12.18 | 12.73 | 1.84 | 1.76 | 40.0% | 43.5% |
| A | 11.90 | 12.34 | 2.05 | 2.05 | 46.5% | 49.3% |
| S | 9.79 | 9.70 | 1.31 | 1.29 | 32.1% | 32.0% |
| G | 8.87 | 12.35 | 0.00 | 0.00 | 95.2% | 96.2% |
| N | 8.56 | 8.45 | 1.65 | 1.60 | 11.9% | 11.9% |
| B | 6.74 | 6.72 | 1.50 | 1.42 | 25.2% | 25.6% |
| Q | 6.16 | 6.60 | 1.05 | 1.12 | 76.0% | 71.9% |
| L | 3.05 | 3.20 | 0.53 | 0.56 | 11.1% | 11.3% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.05 | 2.05 |
| beastChainMoves | 1.04 | 1.03 |
| beastChainCaptures | 1.31 | 1.29 |
| maesterSwaps | 5.62 | 5.85 |
| maesterLongSwaps | 0.55 | 0.52 |
| paladinSacrifices | 0.53 | 0.56 |
| promotions | 0.34 | 0.30 |
| checks | 4.13 | 3.97 |

The pooled columns describe each whole population; the difference column is the mean over the
60 shared arrangements of (rule − base) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
