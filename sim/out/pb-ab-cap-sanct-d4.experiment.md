# Rule A/B — pb-ab-cap-sanct-d4

`capitalSanctuary=true` against today's defaults.
400 games per population, depth 4, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-cap-sanct-d4.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.540 | 0.545 | +0.005 ± 0.058 | no |
| decisive | 0.760 | 0.805 | +0.045 ± 0.067 | no |
| draw rate | 0.212 | 0.155 | -0.058 ± 0.064 | no |
| capped | 0.028 | 0.040 | +0.013 ± 0.024 | no |
| mean plies | 117.2 | 107.4 | -9.8 ± 8.7 | yes |
| branching factor | 30.6 | 32.4 | +1.8 ± 0.7 | yes |
| killer move | 0.218 | 0.257 | +0.039 ± 0.023 | yes |
| lead change | 0.034 | 0.046 | +0.012 ± 0.007 | yes |
| uncertainty late | 0.619 | 0.608 | -0.011 ± 0.009 | yes |
| drama | 0.147 | 0.143 | -0.004 ± 0.021 | no |
| permanence | 0.966 | 0.962 | -0.004 ± 0.001 | yes |
| min utilisation | 0.39 | 0.40 | +0.00 ± 0.02 | no |
| interest | 0.466 | 0.468 | +0.004 ± 0.007 | no |
| interest (min-use) | 0.466 | 0.468 | +0.007 ± 0.016 | no |
| killerMove (resid.) | -0.017 | 0.017 | +0.035 ± 0.024 | yes |
| leadChange (resid.) | -0.007 | 0.007 | +0.014 ± 0.007 | yes |
| uncertaintyLate (resid.) | 0.002 | -0.002 | -0.004 ± 0.006 | no |
| drama (resid.) | 0.008 | -0.008 | -0.015 ± 0.017 | no |
| permanence (resid.) | 0.002 | -0.002 | -0.003 ± 0.002 | yes |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.066 | -0.021 | -0.050 ± 0.029 | yes |
| interest (resid.) | 0.003 | -0.000 | -0.001 ± 0.006 | no |
| interestMinFairy (resid.) | 0.024 | 0.020 | +0.002 ± 0.016 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 18 (4.5%) | 6 (1.5%) |
| games where a king never moved | 106 (26.5%) | 150 (37.5%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 22.82 | 21.31 | 3.67 | 2.94 | 33.7% | 45.2% |
| A | 18.93 | 16.80 | 4.43 | 3.75 | 51.1% | 65.4% |
| K | 15.41 | 12.23 | 1.26 | 0.72 | 100.0% | 100.0% |
| M | 13.58 | 13.26 | 1.48 | 1.03 | 35.1% | 51.3% |
| S | 10.40 | 9.32 | 1.26 | 1.17 | 44.6% | 59.1% |
| N | 8.74 | 8.54 | 1.58 | 1.57 | 12.6% | 27.4% |
| R | 7.77 | 7.25 | 1.60 | 1.09 | 30.1% | 47.1% |
| B | 6.99 | 5.52 | 1.51 | 1.00 | 23.8% | 40.0% |
| L | 4.29 | 4.52 | 1.30 | 1.15 | 7.2% | 13.3% |
| G | 4.16 | 3.85 | 0.00 | 0.00 | 91.3% | 97.1% |
| Q | 4.10 | 4.81 | 0.78 | 0.67 | 47.1% | 73.2% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 4.43 | 3.75 |
| beastChainMoves | 1.09 | 0.84 |
| beastChainCaptures | 1.26 | 1.17 |
| maesterSwaps | 5.17 | 6.32 |
| maesterLongSwaps | 0.77 | 0.73 |
| paladinSacrifices | 0.65 | 0.56 |
| promotions | 0.17 | 0.15 |
| checks | 6.20 | 6.23 |
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
