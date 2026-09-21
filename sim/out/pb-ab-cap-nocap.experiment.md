# Rule A/B — pb-ab-cap-nocap

`capitalNoCapture=true` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-cap-nocap.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.561 | 0.543 | -0.018 ± 0.031 | no |
| decisive | 0.792 | 0.790 | -0.002 ± 0.030 | no |
| draw rate | 0.198 | 0.201 | +0.002 ± 0.028 | no |
| capped | 0.010 | 0.009 | -0.001 ± 0.006 | no |
| mean plies | 110.3 | 113.7 | +3.4 ± 4.4 | no |
| branching factor | 32.7 | 33.3 | +0.6 ± 0.3 | yes |
| killer move | 0.331 | 0.376 | +0.044 ± 0.020 | yes |
| lead change | 0.059 | 0.066 | +0.007 ± 0.005 | yes |
| uncertainty late | 0.631 | 0.633 | +0.001 ± 0.004 | no |
| drama | 0.145 | 0.164 | +0.020 ± 0.012 | yes |
| permanence | 0.959 | 0.954 | -0.005 ± 0.003 | yes |
| min utilisation | 0.43 | 0.40 | -0.02 ± 0.01 | yes |
| interest | 0.483 | 0.493 | +0.010 ± 0.006 | yes |
| interest (min-use) | 0.483 | 0.481 | +0.011 ± 0.010 | yes |
| killerMove (resid.) | -0.023 | 0.023 | +0.045 ± 0.018 | yes |
| leadChange (resid.) | -0.004 | 0.004 | +0.007 ± 0.005 | yes |
| uncertaintyLate (resid.) | -0.001 | 0.001 | +0.001 ± 0.003 | no |
| drama (resid.) | -0.010 | 0.010 | +0.020 ± 0.010 | yes |
| permanence (resid.) | 0.002 | -0.002 | -0.005 ± 0.002 | yes |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | -0.001 | 0.001 | +0.003 ± 0.006 | no |
| interest (resid.) | -0.005 | 0.005 | +0.010 ± 0.004 | yes |
| interestMinFairy (resid.) | 0.006 | 0.004 | +0.011 ± 0.009 | yes |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 14 (0.9%) | 18 (1.1%) |
| games where a king never moved | 423 (26.4%) | 473 (29.6%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 23.45 | 22.85 | 3.84 | 3.13 | 41.3% | 43.4% |
| M | 14.40 | 16.01 | 1.37 | 1.36 | 35.0% | 44.1% |
| A | 13.99 | 14.63 | 3.38 | 3.33 | 51.6% | 52.9% |
| S | 11.14 | 12.85 | 1.43 | 1.74 | 43.0% | 44.0% |
| K | 10.95 | 10.66 | 0.78 | 0.68 | 100.0% | 100.0% |
| R | 9.48 | 9.29 | 1.67 | 1.58 | 37.3% | 41.8% |
| N | 8.14 | 9.07 | 1.44 | 1.32 | 13.2% | 19.2% |
| B | 5.93 | 5.77 | 1.30 | 1.25 | 30.2% | 33.6% |
| Q | 5.53 | 5.36 | 0.94 | 0.85 | 70.6% | 76.3% |
| L | 4.34 | 4.37 | 1.20 | 1.18 | 7.1% | 10.8% |
| G | 2.93 | 2.83 | 0.00 | 0.00 | 96.6% | 98.1% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 3.38 | 3.33 |
| beastChainMoves | 1.13 | 1.12 |
| beastChainCaptures | 1.43 | 1.74 |
| maesterSwaps | 6.38 | 6.87 |
| maesterLongSwaps | 0.76 | 0.83 |
| paladinSacrifices | 0.60 | 0.59 |
| promotions | 0.24 | 0.24 |
| checks | 3.89 | 3.90 |
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
