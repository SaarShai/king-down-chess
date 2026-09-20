# Rule A/B — pb-ab-G-cap-pawns

`guardCaptures=pawns guardCaptureLimit=1` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-G-cap-pawns.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.541 | 0.545 | +0.004 ± 0.012 | no |
| decisive | 0.791 | 0.778 | -0.013 ± 0.014 | no |
| draw rate | 0.204 | 0.214 | +0.010 ± 0.014 | no |
| capped | 0.004 | 0.007 | +0.003 ± 0.004 | no |
| mean plies | 110.8 | 113.7 | +2.9 ± 2.1 | yes |
| branching factor | 32.3 | 32.2 | -0.1 ± 0.1 | yes |
| killer move | 0.345 | 0.339 | -0.006 ± 0.007 | no |
| lead change | 0.059 | 0.059 | +0.000 ± 0.001 | no |
| uncertainty late | 0.634 | 0.634 | -0.001 ± 0.001 | no |
| drama | 0.146 | 0.140 | -0.006 ± 0.006 | no |
| permanence | 0.958 | 0.959 | +0.001 ± 0.000 | yes |
| min utilisation | 0.43 | 0.42 | -0.01 ± 0.01 | yes |
| interest | 0.487 | 0.484 | -0.002 ± 0.002 | no |
| interest (min-use) | 0.480 | 0.484 | +0.003 ± 0.006 | no |
| killerMove (resid.) | 0.002 | -0.002 | -0.004 ± 0.007 | no |
| leadChange (resid.) | 0.000 | -0.000 | -0.001 ± 0.001 | no |
| uncertaintyLate (resid.) | 0.001 | -0.001 | -0.002 ± 0.002 | yes |
| drama (resid.) | 0.002 | -0.002 | -0.004 ± 0.005 | no |
| permanence (resid.) | -0.000 | 0.000 | +0.001 ± 0.000 | yes |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | -0.003 | -0.002 | +0.010 ± 0.006 | yes |
| interest (resid.) | 0.001 | -0.001 | -0.001 ± 0.002 | no |
| interestMinFairy (resid.) | 0.003 | 0.009 | +0.004 ± 0.007 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.257 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 18 (1.1%) | 30 (1.9%) |
| games where a king never moved | 380 (23.8%) | 374 (23.4%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 23.79 | 23.69 | 3.84 | 3.83 | 40.3% | 38.9% |
| A | 15.17 | 15.48 | 3.57 | 3.56 | 55.0% | 54.9% |
| M | 15.10 | 15.11 | 1.49 | 1.52 | 37.3% | 36.7% |
| K | 11.43 | 12.37 | 0.82 | 0.89 | 100.0% | 100.0% |
| S | 9.51 | 9.63 | 1.22 | 1.22 | 31.9% | 30.6% |
| R | 9.38 | 9.59 | 1.74 | 1.74 | 36.6% | 36.3% |
| N | 7.86 | 7.93 | 1.54 | 1.54 | 11.8% | 12.0% |
| B | 5.83 | 5.99 | 1.35 | 1.34 | 26.7% | 27.7% |
| Q | 5.70 | 5.74 | 0.99 | 0.97 | 74.3% | 74.1% |
| L | 4.18 | 4.17 | 1.16 | 1.16 | 6.7% | 6.7% |
| G | 2.84 | 3.97 | 0.00 | 0.26 | 97.3% | 92.2% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 3.57 | 3.56 |
| beastChainMoves | 0.95 | 0.97 |
| beastChainCaptures | 1.22 | 1.22 |
| maesterSwaps | 6.64 | 6.60 |
| maesterLongSwaps | 0.82 | 0.85 |
| paladinSacrifices | 0.57 | 0.56 |
| promotions | 0.29 | 0.28 |
| checks | 4.25 | 4.43 |
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
