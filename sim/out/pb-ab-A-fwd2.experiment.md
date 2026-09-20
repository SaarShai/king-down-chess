# Rule A/B — pb-ab-A-fwd2

`archerShots=plusDiagFwd2` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-A-fwd2.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.544 | 0.541 | -0.002 ± 0.019 | no |
| decisive | 0.714 | 0.796 | +0.082 ± 0.027 | yes |
| draw rate | 0.274 | 0.201 | -0.073 ± 0.026 | yes |
| capped | 0.012 | 0.003 | -0.009 ± 0.006 | yes |
| mean plies | 118.0 | 110.2 | -7.8 ± 3.5 | yes |
| branching factor | 32.6 | 32.0 | -0.5 ± 0.3 | yes |
| killer move | 0.325 | 0.337 | +0.012 ± 0.014 | no |
| lead change | 0.064 | 0.060 | -0.003 ± 0.002 | yes |
| uncertainty late | 0.648 | 0.635 | -0.013 ± 0.004 | yes |
| drama | 0.127 | 0.149 | +0.022 ± 0.009 | yes |
| permanence | 0.962 | 0.959 | -0.003 ± 0.001 | yes |
| min utilisation | 0.45 | 0.44 | -0.01 ± 0.01 | yes |
| interest | 0.482 | 0.486 | +0.004 ± 0.004 | no |
| interest (min-use) | 0.482 | 0.475 | +0.000 ± 0.008 | no |
| killerMove (resid.) | 0.002 | -0.002 | -0.005 ± 0.013 | no |
| leadChange (resid.) | -0.002 | 0.002 | +0.004 ± 0.003 | yes |
| uncertaintyLate (resid.) | 0.001 | -0.001 | -0.002 ± 0.003 | no |
| drama (resid.) | -0.005 | 0.005 | +0.009 ± 0.007 | yes |
| permanence (resid.) | 0.000 | -0.000 | -0.001 ± 0.001 | yes |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.038 | -0.021 | -0.057 ± 0.009 | yes |
| interest (resid.) | 0.003 | -0.002 | -0.004 ± 0.003 | yes |
| interestMinFairy (resid.) | 0.014 | -0.002 | -0.009 ± 0.007 | yes |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 24 (1.5%) | 22 (1.4%) |
| games where a king never moved | 289 (18.1%) | 332 (20.8%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 26.41 | 24.14 | 4.54 | 3.90 | 41.3% | 39.3% |
| M | 16.21 | 14.77 | 1.72 | 1.60 | 36.7% | 36.6% |
| K | 13.26 | 12.43 | 0.93 | 0.93 | 100.0% | 100.0% |
| A | 12.40 | 13.42 | 2.09 | 3.46 | 44.3% | 42.2% |
| R | 11.04 | 9.72 | 1.74 | 1.69 | 40.6% | 38.8% |
| S | 9.85 | 9.53 | 1.25 | 1.23 | 32.9% | 31.8% |
| N | 8.29 | 7.86 | 1.69 | 1.60 | 9.7% | 10.3% |
| Q | 6.30 | 5.95 | 1.02 | 1.02 | 76.5% | 75.4% |
| B | 6.21 | 5.63 | 1.42 | 1.42 | 23.8% | 24.5% |
| L | 4.42 | 3.95 | 1.27 | 1.23 | 6.1% | 6.2% |
| G | 3.63 | 2.77 | 0.00 | 0.00 | 96.7% | 96.0% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.09 | 3.46 |
| beastChainMoves | 0.99 | 0.97 |
| beastChainCaptures | 1.25 | 1.23 |
| maesterSwaps | 7.26 | 6.30 |
| maesterLongSwaps | 0.81 | 0.82 |
| paladinSacrifices | 0.62 | 0.62 |
| promotions | 0.31 | 0.30 |
| checks | 4.27 | 4.53 |
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
