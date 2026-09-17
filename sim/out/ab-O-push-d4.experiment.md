# Rule A/B — ab-O-push-d4

`ogreMode=push` against today's defaults.
800 games per population, depth 4, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `ab-O-push-d4.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.516 | 0.564 | +0.049 ± 0.031 | yes |
| decisive | 0.601 | 0.704 | +0.102 ± 0.047 | yes |
| draw rate | 0.385 | 0.281 | -0.104 ± 0.048 | yes |
| capped | 0.014 | 0.015 | +0.001 ± 0.010 | no |
| mean plies | 123.4 | 128.0 | +4.6 ± 4.2 | yes |
| branching factor | 30.2 | 29.9 | -0.3 ± 0.4 | no |
| killer move | 0.189 | 0.201 | +0.012 ± 0.018 | no |
| lead change | 0.042 | 0.039 | -0.003 ± 0.004 | no |
| uncertainty late | 0.644 | 0.635 | -0.009 ± 0.004 | yes |
| drama | 0.109 | 0.126 | +0.017 ± 0.015 | yes |
| permanence | 0.971 | 0.970 | -0.001 ± 0.001 | no |
| min utilisation | 0.41 | 0.40 | -0.02 ± 0.01 | yes |
| interest | 0.458 | 0.460 | +0.004 ± 0.006 | no |
| interest (min-use) | 0.433 | 0.444 | +0.011 ± 0.010 | yes |
| killerMove (resid.) | -0.002 | 0.002 | +0.005 ± 0.017 | no |
| leadChange (resid.) | -0.001 | 0.001 | +0.003 ± 0.004 | no |
| uncertaintyLate (resid.) | -0.001 | 0.001 | +0.002 ± 0.004 | no |
| drama (resid.) | 0.001 | -0.001 | -0.001 ± 0.011 | no |
| permanence (resid.) | 0.000 | -0.000 | -0.000 ± 0.001 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.086 | -0.032 | -0.081 ± 0.016 | yes |
| interest (resid.) | 0.005 | -0.002 | -0.004 ± 0.004 | no |
| interestMinFairy (resid.) | 0.006 | 0.010 | +0.003 ± 0.009 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 21 (2.6%) | 33 (4.1%) |
| games where a king never moved | 112 (14.0%) | 102 (12.8%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 25.46 | 25.41 | 4.67 | 4.89 | 34.6% | 30.5% |
| K | 17.23 | 19.46 | 1.64 | 1.57 | 100.0% | 100.0% |
| O | 13.94 | 13.19 | 1.25 | 1.87 | 60.8% | 42.8% |
| A | 13.59 | 14.56 | 2.35 | 2.43 | 39.3% | 40.4% |
| M | 10.72 | 11.22 | 1.40 | 1.46 | 26.6% | 25.9% |
| N | 8.68 | 8.51 | 1.79 | 1.75 | 10.9% | 9.0% |
| R | 8.44 | 8.90 | 1.51 | 1.59 | 33.1% | 30.7% |
| S | 7.50 | 7.71 | 0.96 | 1.01 | 32.7% | 29.0% |
| B | 6.42 | 6.80 | 1.51 | 1.61 | 20.1% | 17.8% |
| Q | 5.47 | 5.85 | 1.07 | 1.05 | 40.3% | 42.7% |
| G | 3.19 | 3.50 | 0.00 | 0.00 | 88.0% | 90.1% |
| L | 2.76 | 2.87 | 0.93 | 1.01 | 7.0% | 6.8% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.35 | 2.43 |
| beastChainMoves | 0.82 | 0.85 |
| beastChainCaptures | 0.96 | 1.01 |
| maesterSwaps | 4.19 | 4.33 |
| maesterLongSwaps | 0.46 | 0.58 |
| paladinSacrifices | 0.42 | 0.40 |
| promotions | 0.16 | 0.19 |
| checks | 6.48 | 7.83 |
| ogreShoves | 2.94 | 3.66 |
| ogreShovesFriend | 2.64 | 3.61 |
| ogreShovesGuard | 0.02 | 0.04 |
| catapultChecks | 0.00 | 0.00 |

The pooled columns describe each whole population; the difference column is the mean over the
40 shared arrangements of (rule − base) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
