# Rule A/B — pb-ab-cap-sanct-noadj

`capitalSanctuary=true` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-cap-sanct-noadj.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.566 | 0.541 | -0.025 ± 0.032 | no |
| decisive | 0.879 | 0.871 | -0.007 ± 0.022 | no |
| draw rate | 0.094 | 0.081 | -0.013 ± 0.020 | no |
| capped | 0.028 | 0.048 | +0.020 ± 0.014 | yes |
| mean plies | 149.7 | 153.4 | +3.7 ± 4.8 | no |
| branching factor | 30.1 | 31.5 | +1.4 ± 0.4 | yes |
| killer move | 0.398 | 0.440 | +0.042 ± 0.017 | yes |
| lead change | 0.044 | 0.047 | +0.003 ± 0.004 | no |
| uncertainty late | 0.573 | 0.556 | -0.017 ± 0.009 | yes |
| drama | 0.170 | 0.184 | +0.014 ± 0.014 | no |
| permanence | 0.964 | 0.963 | -0.001 ± 0.001 | yes |
| min utilisation | 0.38 | 0.36 | -0.02 ± 0.01 | yes |
| interest | 0.495 | 0.503 | +0.007 ± 0.004 | yes |
| interest (min-use) | 0.490 | 0.503 | +0.013 ± 0.006 | yes |
| killerMove (resid.) | -0.019 | 0.019 | +0.037 ± 0.017 | yes |
| leadChange (resid.) | -0.001 | 0.001 | +0.003 ± 0.004 | no |
| uncertaintyLate (resid.) | 0.008 | -0.008 | -0.015 ± 0.009 | yes |
| drama (resid.) | -0.006 | 0.006 | +0.012 ± 0.014 | no |
| permanence (resid.) | 0.001 | -0.001 | -0.001 ± 0.001 | yes |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.007 | 0.008 | -0.011 ± 0.014 | no |
| interest (resid.) | -0.003 | 0.004 | +0.006 ± 0.004 | yes |
| interestMinFairy (resid.) | -0.001 | 0.010 | +0.011 ± 0.006 | yes |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 42 (2.6%) | 31 (1.9%) |
| games where a king never moved | 164 (10.3%) | 222 (13.9%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 28.47 | 27.82 | 4.32 | 3.50 | 22.3% | 28.8% |
| K | 23.10 | 21.10 | 1.37 | 1.13 | 100.0% | 100.0% |
| A | 17.87 | 17.29 | 4.17 | 3.56 | 33.7% | 44.2% |
| M | 17.21 | 20.75 | 1.68 | 1.37 | 17.5% | 29.0% |
| S | 13.82 | 14.45 | 1.85 | 2.78 | 23.3% | 34.3% |
| R | 12.70 | 13.55 | 2.19 | 1.75 | 21.7% | 27.7% |
| Q | 10.82 | 10.46 | 1.83 | 1.50 | 114.6% | 117.4% |
| N | 8.88 | 9.32 | 1.58 | 1.79 | 6.2% | 14.2% |
| B | 7.10 | 6.97 | 1.51 | 1.11 | 17.4% | 23.2% |
| G | 5.16 | 6.49 | 0.00 | 0.00 | 91.5% | 94.7% |
| L | 4.56 | 5.23 | 1.27 | 1.23 | 1.9% | 4.1% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 4.17 | 3.56 |
| beastChainMoves | 1.45 | 1.56 |
| beastChainCaptures | 1.85 | 2.78 |
| maesterSwaps | 7.06 | 9.97 |
| maesterLongSwaps | 0.96 | 0.97 |
| paladinSacrifices | 0.65 | 0.59 |
| promotions | 0.87 | 0.86 |
| checks | 9.19 | 9.01 |
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
