# Rule A/B — pb-ab-S-cap

`beastCapture=diagForward` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-S-cap.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.544 | 0.557 | +0.014 ± 0.023 | no |
| decisive | 0.714 | 0.711 | -0.002 ± 0.022 | no |
| draw rate | 0.274 | 0.279 | +0.005 ± 0.022 | no |
| capped | 0.012 | 0.009 | -0.003 ± 0.006 | no |
| mean plies | 118.0 | 116.7 | -1.4 ± 2.6 | no |
| branching factor | 32.6 | 32.4 | -0.2 ± 0.2 | no |
| killer move | 0.325 | 0.312 | -0.013 ± 0.013 | no |
| lead change | 0.064 | 0.064 | +0.000 ± 0.002 | no |
| uncertainty late | 0.648 | 0.648 | +0.000 ± 0.002 | no |
| drama | 0.127 | 0.128 | +0.001 ± 0.007 | no |
| permanence | 0.962 | 0.962 | +0.000 ± 0.001 | no |
| min utilisation | 0.45 | 0.45 | +0.00 ± 0.01 | no |
| interest | 0.482 | 0.479 | -0.002 ± 0.004 | no |
| interest (min-use) | 0.482 | 0.479 | -0.004 ± 0.006 | no |
| killerMove (resid.) | 0.006 | -0.006 | -0.012 ± 0.011 | yes |
| leadChange (resid.) | 0.000 | -0.000 | -0.000 ± 0.003 | no |
| uncertaintyLate (resid.) | 0.000 | -0.000 | -0.001 ± 0.003 | no |
| drama (resid.) | -0.001 | 0.001 | +0.002 ± 0.006 | no |
| permanence (resid.) | -0.000 | 0.000 | +0.000 ± 0.001 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.007 | 0.006 | +0.005 ± 0.008 | no |
| interest (resid.) | 0.002 | -0.001 | -0.002 ± 0.003 | no |
| interestMinFairy (resid.) | 0.011 | 0.009 | -0.003 ± 0.006 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 24 (1.5%) | 28 (1.8%) |
| games where a king never moved | 289 (18.1%) | 276 (17.3%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 26.41 | 26.35 | 4.54 | 4.57 | 41.3% | 42.0% |
| M | 16.21 | 15.89 | 1.72 | 1.87 | 36.7% | 35.5% |
| K | 13.26 | 12.90 | 0.93 | 1.00 | 100.0% | 100.0% |
| A | 12.40 | 12.26 | 2.09 | 2.08 | 44.3% | 45.6% |
| R | 11.04 | 11.03 | 1.74 | 1.87 | 40.6% | 41.3% |
| S | 9.85 | 9.68 | 1.25 | 0.77 | 32.9% | 31.7% |
| N | 8.29 | 8.27 | 1.69 | 1.69 | 9.7% | 9.9% |
| Q | 6.30 | 6.10 | 1.02 | 1.07 | 76.5% | 72.9% |
| B | 6.21 | 6.31 | 1.42 | 1.41 | 23.8% | 25.0% |
| L | 4.42 | 4.34 | 1.27 | 1.29 | 6.1% | 5.9% |
| G | 3.63 | 3.53 | 0.00 | 0.00 | 96.7% | 95.9% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.09 | 2.08 |
| beastChainMoves | 0.99 | 0.68 |
| beastChainCaptures | 1.25 | 0.77 |
| maesterSwaps | 7.26 | 6.97 |
| maesterLongSwaps | 0.81 | 0.79 |
| paladinSacrifices | 0.62 | 0.61 |
| promotions | 0.31 | 0.32 |
| checks | 4.27 | 3.99 |
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
