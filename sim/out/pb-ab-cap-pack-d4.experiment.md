# Rule A/B — pb-ab-cap-pack-d4

`guardNoCapital=true capitalSanctuary=true guardCapitalStep=true pawnCapitalCapture=true` against today's defaults.
400 games per population, depth 4, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-cap-pack-d4.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.540 | 0.537 | -0.003 ± 0.054 | no |
| decisive | 0.760 | 0.800 | +0.040 ± 0.065 | no |
| draw rate | 0.212 | 0.175 | -0.037 ± 0.066 | no |
| capped | 0.028 | 0.025 | -0.002 ± 0.025 | no |
| mean plies | 117.2 | 107.8 | -9.4 ± 8.8 | yes |
| branching factor | 30.6 | 32.7 | +2.1 ± 0.7 | yes |
| killer move | 0.218 | 0.249 | +0.030 ± 0.024 | yes |
| lead change | 0.034 | 0.047 | +0.012 ± 0.007 | yes |
| uncertainty late | 0.619 | 0.608 | -0.011 ± 0.007 | yes |
| drama | 0.147 | 0.141 | -0.006 ± 0.022 | no |
| permanence | 0.966 | 0.964 | -0.003 ± 0.002 | yes |
| min utilisation | 0.39 | 0.40 | +0.01 ± 0.02 | no |
| interest | 0.466 | 0.466 | +0.002 ± 0.008 | no |
| interest (min-use) | 0.466 | 0.466 | +0.006 ± 0.015 | no |
| killerMove (resid.) | -0.015 | 0.015 | +0.030 ± 0.024 | yes |
| leadChange (resid.) | -0.006 | 0.006 | +0.012 ± 0.007 | yes |
| uncertaintyLate (resid.) | 0.004 | -0.004 | -0.007 ± 0.006 | yes |
| drama (resid.) | 0.007 | -0.007 | -0.014 ± 0.017 | no |
| permanence (resid.) | 0.001 | -0.001 | -0.002 ± 0.002 | yes |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.058 | -0.013 | -0.034 ± 0.029 | yes |
| interest (resid.) | 0.003 | -0.000 | -0.001 ± 0.006 | no |
| interestMinFairy (resid.) | 0.023 | 0.020 | +0.003 ± 0.015 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 18 (4.5%) | 6 (1.5%) |
| games where a king never moved | 106 (26.5%) | 135 (33.8%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 22.82 | 21.46 | 3.67 | 3.13 | 33.7% | 44.8% |
| A | 18.93 | 16.55 | 4.43 | 3.68 | 51.1% | 63.3% |
| K | 15.41 | 11.79 | 1.26 | 0.77 | 100.0% | 99.5% |
| M | 13.58 | 13.52 | 1.48 | 1.07 | 35.1% | 50.6% |
| S | 10.40 | 8.63 | 1.26 | 0.95 | 44.6% | 59.2% |
| N | 8.74 | 8.72 | 1.58 | 1.56 | 12.6% | 28.0% |
| R | 7.77 | 8.04 | 1.60 | 1.19 | 30.1% | 45.9% |
| B | 6.99 | 6.08 | 1.51 | 1.11 | 23.8% | 39.1% |
| L | 4.29 | 4.36 | 1.30 | 1.15 | 7.2% | 13.8% |
| G | 4.16 | 4.25 | 0.00 | 0.00 | 91.3% | 96.8% |
| Q | 4.10 | 4.43 | 0.78 | 0.69 | 47.1% | 64.6% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 4.43 | 3.68 |
| beastChainMoves | 1.09 | 0.71 |
| beastChainCaptures | 1.26 | 0.95 |
| maesterSwaps | 5.17 | 6.46 |
| maesterLongSwaps | 0.77 | 0.74 |
| paladinSacrifices | 0.65 | 0.55 |
| promotions | 0.17 | 0.15 |
| checks | 6.20 | 5.51 |
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
