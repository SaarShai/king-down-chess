# Rule A/B — pb-ab-O-shovefr

`ogreShoveFriends=friends` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-O-shovefr.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.532 | 0.535 | +0.002 ± 0.011 | no |
| decisive | 0.795 | 0.818 | +0.023 ± 0.012 | yes |
| draw rate | 0.198 | 0.175 | -0.023 ± 0.011 | yes |
| capped | 0.007 | 0.007 | +0.000 ± 0.003 | no |
| mean plies | 105.0 | 106.4 | +1.3 ± 1.0 | yes |
| branching factor | 32.2 | 32.0 | -0.1 ± 0.1 | yes |
| killer move | 0.363 | 0.369 | +0.007 ± 0.006 | yes |
| lead change | 0.066 | 0.066 | -0.000 ± 0.001 | no |
| uncertainty late | 0.636 | 0.636 | -0.000 ± 0.001 | no |
| drama | 0.161 | 0.168 | +0.007 ± 0.004 | yes |
| permanence | 0.955 | 0.955 | +0.000 ± 0.000 | no |
| min utilisation | 0.41 | 0.40 | +0.00 ± 0.01 | no |
| interest | 0.492 | 0.494 | +0.002 ± 0.002 | yes |
| interest (min-use) | 0.449 | 0.464 | +0.006 ± 0.004 | yes |
| killerMove (resid.) | 0.001 | -0.001 | -0.002 ± 0.006 | no |
| leadChange (resid.) | -0.000 | 0.000 | +0.001 ± 0.001 | no |
| uncertaintyLate (resid.) | -0.001 | 0.001 | +0.002 ± 0.001 | yes |
| drama (resid.) | -0.001 | 0.001 | +0.002 ± 0.004 | no |
| permanence (resid.) | -0.000 | 0.000 | +0.001 ± 0.000 | yes |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.036 | 0.000 | -0.022 ± 0.007 | yes |
| interest (resid.) | 0.002 | 0.000 | -0.001 ± 0.002 | no |
| interestMinFairy (resid.) | -0.016 | -0.009 | -0.001 ± 0.005 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 8 (0.5%) | 14 (0.9%) |
| games where a king never moved | 430 (26.9%) | 417 (26.1%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 21.39 | 21.48 | 3.54 | 3.54 | 42.4% | 42.2% |
| A | 14.22 | 14.38 | 3.37 | 3.37 | 55.2% | 54.2% |
| O | 11.57 | 11.75 | 0.81 | 0.84 | 66.8% | 64.7% |
| K | 10.18 | 10.57 | 0.80 | 0.85 | 100.0% | 100.0% |
| M | 9.94 | 9.83 | 0.92 | 0.90 | 34.8% | 34.0% |
| N | 8.34 | 8.40 | 1.40 | 1.40 | 15.3% | 14.9% |
| S | 7.21 | 7.26 | 1.45 | 1.48 | 43.1% | 42.5% |
| R | 6.33 | 6.53 | 1.27 | 1.28 | 33.1% | 32.6% |
| B | 5.87 | 5.97 | 1.23 | 1.23 | 30.5% | 29.8% |
| Q | 4.72 | 4.69 | 0.90 | 0.90 | 70.2% | 71.3% |
| L | 2.83 | 2.83 | 0.87 | 0.87 | 6.9% | 6.8% |
| G | 2.45 | 2.69 | 0.00 | 0.00 | 97.5% | 97.2% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 3.37 | 3.37 |
| beastChainMoves | 0.91 | 0.93 |
| beastChainCaptures | 1.45 | 1.48 |
| maesterSwaps | 4.58 | 4.54 |
| maesterLongSwaps | 0.51 | 0.48 |
| paladinSacrifices | 0.48 | 0.48 |
| promotions | 0.22 | 0.24 |
| checks | 3.65 | 3.75 |
| ogreShoves | 2.84 | 2.68 |
| ogreShovesFriend | 2.67 | 2.68 |
| ogreShovesGuard | 0.02 | 0.02 |
| catapultChecks | 0.00 | 0.00 |

The pooled columns describe each whole population; the difference column is the mean over the
40 shared arrangements of (rule − base) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
