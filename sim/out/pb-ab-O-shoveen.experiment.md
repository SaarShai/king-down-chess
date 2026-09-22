# Rule A/B — pb-ab-O-shoveen

`ogreShoveFriends=enemies` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-O-shoveen.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.532 | 0.552 | +0.019 ± 0.028 | no |
| decisive | 0.795 | 0.764 | -0.031 ± 0.029 | yes |
| draw rate | 0.198 | 0.221 | +0.023 ± 0.027 | no |
| capped | 0.007 | 0.016 | +0.009 ± 0.008 | yes |
| mean plies | 105.0 | 108.5 | +3.5 ± 4.1 | no |
| branching factor | 32.2 | 31.3 | -0.8 ± 0.4 | yes |
| killer move | 0.363 | 0.355 | -0.008 ± 0.018 | no |
| lead change | 0.066 | 0.066 | -0.001 ± 0.004 | no |
| uncertainty late | 0.636 | 0.636 | -0.000 ± 0.003 | no |
| drama | 0.161 | 0.151 | -0.010 ± 0.010 | no |
| permanence | 0.955 | 0.955 | +0.000 ± 0.002 | no |
| min utilisation | 0.41 | 0.42 | +0.02 ± 0.01 | yes |
| interest | 0.492 | 0.488 | -0.003 ± 0.005 | no |
| interest (min-use) | 0.449 | 0.473 | +0.005 ± 0.011 | no |
| killerMove (resid.) | -0.000 | 0.000 | +0.001 ± 0.015 | no |
| leadChange (resid.) | 0.001 | -0.001 | -0.002 ± 0.004 | no |
| uncertaintyLate (resid.) | 0.001 | -0.001 | -0.003 ± 0.004 | no |
| drama (resid.) | 0.002 | -0.002 | -0.004 ± 0.009 | no |
| permanence (resid.) | 0.000 | -0.000 | -0.001 ± 0.002 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.015 | 0.012 | +0.022 ± 0.010 | yes |
| interest (resid.) | 0.001 | 0.000 | +0.001 ± 0.004 | no |
| interestMinFairy (resid.) | -0.022 | 0.007 | +0.010 ± 0.011 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 8 (0.5%) | 17 (1.1%) |
| games where a king never moved | 430 (26.9%) | 427 (26.7%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 21.39 | 22.96 | 3.54 | 3.60 | 42.4% | 42.2% |
| A | 14.22 | 14.39 | 3.37 | 3.40 | 55.2% | 53.3% |
| O | 11.57 | 10.76 | 0.81 | 0.72 | 66.8% | 70.7% |
| K | 10.18 | 11.10 | 0.80 | 0.77 | 100.0% | 100.0% |
| M | 9.94 | 9.64 | 0.92 | 0.86 | 34.8% | 35.9% |
| N | 8.34 | 8.14 | 1.40 | 1.35 | 15.3% | 16.0% |
| S | 7.21 | 7.23 | 1.45 | 1.48 | 43.1% | 43.3% |
| R | 6.33 | 6.86 | 1.27 | 1.30 | 33.1% | 34.9% |
| B | 5.87 | 6.04 | 1.23 | 1.21 | 30.5% | 30.4% |
| Q | 4.72 | 5.54 | 0.90 | 0.90 | 70.2% | 74.0% |
| L | 2.83 | 2.88 | 0.87 | 0.84 | 6.9% | 8.9% |
| G | 2.45 | 2.98 | 0.00 | 0.00 | 97.5% | 96.9% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 3.37 | 3.40 |
| beastChainMoves | 0.91 | 0.91 |
| beastChainCaptures | 1.45 | 1.48 |
| maesterSwaps | 4.58 | 4.47 |
| maesterLongSwaps | 0.51 | 0.49 |
| paladinSacrifices | 0.48 | 0.47 |
| promotions | 0.22 | 0.23 |
| checks | 3.65 | 3.72 |
| ogreShoves | 2.84 | 0.17 |
| ogreShovesFriend | 2.67 | 0.00 |
| ogreShovesGuard | 0.02 | 0.01 |
| catapultChecks | 0.00 | 0.00 |

The pooled columns describe each whole population; the difference column is the mean over the
40 shared arrangements of (rule − base) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
