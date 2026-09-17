# Rule A/B — ab-O-push-d4-reprice

`ogreMode=push` against today's defaults, both arms at `--values O=195`.
800 games per population, depth 4, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `ab-O-push-d4-reprice.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.507 | 0.512 | +0.005 ± 0.028 | no |
| decisive | 0.621 | 0.711 | +0.090 ± 0.049 | yes |
| draw rate | 0.350 | 0.281 | -0.069 ± 0.048 | yes |
| capped | 0.029 | 0.007 | -0.021 ± 0.011 | yes |
| mean plies | 129.0 | 126.2 | -2.8 ± 4.9 | no |
| branching factor | 29.9 | 30.0 | +0.0 ± 0.3 | no |
| killer move | 0.193 | 0.204 | +0.011 ± 0.014 | no |
| lead change | 0.044 | 0.041 | -0.004 ± 0.005 | no |
| uncertainty late | 0.640 | 0.636 | -0.004 ± 0.006 | no |
| drama | 0.114 | 0.137 | +0.023 ± 0.014 | yes |
| permanence | 0.971 | 0.969 | -0.002 ± 0.001 | yes |
| min utilisation | 0.40 | 0.40 | +0.01 ± 0.01 | no |
| interest | 0.461 | 0.461 | +0.005 ± 0.005 | no |
| interest (min-use) | 0.461 | 0.461 | +0.008 ± 0.009 | no |
| killerMove (resid.) | -0.001 | 0.001 | +0.001 ± 0.013 | no |
| leadChange (resid.) | 0.000 | -0.000 | -0.001 ± 0.004 | no |
| uncertaintyLate (resid.) | -0.001 | 0.001 | +0.003 ± 0.005 | no |
| drama (resid.) | -0.005 | 0.005 | +0.009 ± 0.012 | no |
| permanence (resid.) | 0.001 | -0.001 | -0.001 ± 0.001 | yes |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.098 | -0.029 | -0.056 ± 0.019 | yes |
| interest (resid.) | 0.005 | -0.001 | -0.002 ± 0.003 | no |
| interestMinFairy (resid.) | 0.026 | 0.017 | -0.001 ± 0.009 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 21 (2.6%) | 38 (4.8%) |
| games where a king never moved | 108 (13.5%) | 99 (12.4%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 25.49 | 25.03 | 4.69 | 4.80 | 33.1% | 30.0% |
| K | 19.24 | 18.43 | 1.69 | 1.66 | 100.0% | 100.0% |
| O | 15.38 | 13.64 | 1.35 | 1.99 | 60.1% | 40.6% |
| A | 14.10 | 13.63 | 2.41 | 2.23 | 43.1% | 38.8% |
| M | 10.98 | 11.29 | 1.32 | 1.45 | 27.6% | 28.4% |
| N | 8.50 | 8.56 | 1.72 | 1.76 | 9.8% | 9.5% |
| R | 7.76 | 8.47 | 1.46 | 1.64 | 28.7% | 29.8% |
| S | 7.73 | 7.87 | 0.99 | 1.01 | 35.2% | 31.2% |
| B | 6.81 | 6.58 | 1.64 | 1.63 | 17.9% | 20.4% |
| Q | 6.00 | 6.01 | 1.07 | 1.11 | 44.1% | 43.6% |
| G | 4.14 | 3.87 | 0.00 | 0.00 | 87.0% | 88.6% |
| L | 2.86 | 2.85 | 0.99 | 0.99 | 6.1% | 5.4% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.41 | 2.23 |
| beastChainMoves | 0.84 | 0.85 |
| beastChainCaptures | 0.99 | 1.01 |
| maesterSwaps | 4.48 | 4.34 |
| maesterLongSwaps | 0.58 | 0.62 |
| paladinSacrifices | 0.42 | 0.42 |
| promotions | 0.18 | 0.19 |
| checks | 7.37 | 7.62 |
| ogreShoves | 2.95 | 3.79 |
| ogreShovesFriend | 2.68 | 3.76 |
| ogreShovesGuard | 0.04 | 0.04 |
| catapultChecks | 0.00 | 0.00 |

The pooled columns describe each whole population; the difference column is the mean over the
40 shared arrangements of (rule − base) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
