# Rule A/B — kp-deathtouch2

`kings=[object Object],[object Object] deathTouchMoves=true` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `kp-deathtouch2.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.534 | 0.517 | -0.016 ± 0.020 | no |
| decisive | 0.721 | 0.661 | -0.060 ± 0.027 | yes |
| draw rate | 0.264 | 0.307 | +0.042 ± 0.027 | yes |
| capped | 0.014 | 0.032 | +0.018 ± 0.009 | yes |
| mean plies | 121.3 | 129.3 | +8.0 ± 2.5 | yes |
| branching factor | 32.1 | 32.0 | -0.2 ± 0.2 | no |
| killer move | 0.332 | 0.316 | -0.016 ± 0.012 | yes |
| lead change | 0.068 | 0.066 | -0.002 ± 0.002 | no |
| uncertainty late | 0.648 | 0.646 | -0.001 ± 0.002 | no |
| drama | 0.138 | 0.132 | -0.005 ± 0.008 | no |
| permanence | 0.961 | 0.962 | +0.001 ± 0.001 | yes |
| min utilisation | 0.44 | 0.42 | -0.02 ± 0.01 | yes |
| interest | 0.484 | 0.480 | -0.004 ± 0.004 | no |
| interest (min-use) | 0.484 | 0.480 | +0.003 ± 0.010 | no |
| killerMove (resid.) | 0.003 | -0.003 | -0.005 ± 0.008 | no |
| leadChange (resid.) | 0.002 | -0.002 | -0.004 ± 0.002 | yes |
| uncertaintyLate (resid.) | 0.004 | -0.004 | -0.008 ± 0.004 | yes |
| drama (resid.) | 0.000 | -0.000 | -0.000 ± 0.008 | no |
| permanence (resid.) | -0.000 | 0.000 | +0.000 ± 0.001 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | -0.004 | 0.027 | +0.039 ± 0.009 | yes |
| interest (resid.) | 0.000 | 0.001 | +0.001 ± 0.002 | no |
| interestMinFairy (resid.) | 0.008 | 0.009 | +0.007 ± 0.010 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 30 (1.9%) | 53 (3.3%) |
| games where a king never moved | 259 (16.2%) | 220 (13.8%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 26.54 | 26.91 | 4.41 | 4.52 | 40.7% | 37.5% |
| M | 14.65 | 15.54 | 1.61 | 1.57 | 34.1% | 32.0% |
| A | 14.46 | 15.02 | 2.49 | 2.41 | 46.9% | 44.0% |
| K | 14.32 | 16.85 | 1.04 | 1.81 | 100.0% | 100.0% |
| R | 12.87 | 13.95 | 1.81 | 1.86 | 42.3% | 40.0% |
| S | 10.48 | 11.06 | 1.40 | 1.34 | 32.9% | 32.2% |
| B | 7.34 | 7.75 | 1.65 | 1.64 | 23.5% | 22.1% |
| N | 6.66 | 6.79 | 1.35 | 1.37 | 10.4% | 10.3% |
| Q | 5.93 | 6.57 | 0.99 | 1.04 | 76.3% | 72.2% |
| G | 4.98 | 5.69 | 0.00 | 0.00 | 96.7% | 92.7% |
| L | 3.05 | 3.19 | 0.85 | 0.84 | 6.2% | 6.7% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.49 | 2.41 |
| beastChainMoves | 1.08 | 1.06 |
| beastChainCaptures | 1.40 | 1.34 |
| maesterSwaps | 6.56 | 6.99 |
| maesterLongSwaps | 0.75 | 0.93 |
| paladinSacrifices | 0.39 | 0.39 |
| promotions | 0.32 | 0.32 |
| checks | 4.42 | 3.87 |
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
