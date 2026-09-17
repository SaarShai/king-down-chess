# Rule A/B — pb-lp-never

`paladinKamikaze=never` against the base `promotionSet=anyNonKing`.
800 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-lp-base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.554 | 0.586 | +0.032 ± 0.035 | no |
| decisive | 0.846 | 0.907 | +0.061 ± 0.030 | yes |
| draw rate | 0.149 | 0.092 | -0.056 ± 0.029 | yes |
| capped | 0.005 | 0.000 | -0.005 ± 0.006 | no |
| mean plies | 90.8 | 82.8 | -8.0 ± 2.4 | yes |
| branching factor | 31.4 | 30.7 | -0.7 ± 0.3 | yes |
| killer move | 0.366 | 0.328 | -0.039 ± 0.022 | yes |
| lead change | 0.053 | 0.044 | -0.008 ± 0.005 | yes |
| uncertainty late | 0.620 | 0.589 | -0.031 ± 0.007 | yes |
| drama | 0.138 | 0.141 | +0.004 ± 0.014 | no |
| permanence | 0.952 | 0.953 | +0.000 ± 0.002 | no |
| min utilisation | 0.53 | 0.53 | +0.00 ± 0.01 | no |
| interest | 0.488 | 0.479 | -0.008 ± 0.006 | yes |
| interest (min-use) | 0.488 | 0.479 | -0.008 ± 0.006 | yes |
| killerMove (resid.) | 0.024 | -0.024 | -0.048 ± 0.021 | yes |
| leadChange (resid.) | 0.003 | -0.003 | -0.007 ± 0.005 | yes |
| uncertaintyLate (resid.) | 0.012 | -0.012 | -0.025 ± 0.007 | yes |
| drama (resid.) | 0.006 | -0.006 | -0.012 ± 0.012 | no |
| permanence (resid.) | -0.001 | 0.001 | +0.002 ± 0.002 | no |
| fairyUse (resid.) | 0.003 | 0.004 | +0.008 ± 0.007 | yes |
| excessDecisiveness (resid.) | 0.019 | -0.027 | -0.049 ± 0.009 | yes |
| interest (resid.) | 0.008 | -0.007 | -0.014 ± 0.005 | yes |
| interestMinFairy (resid.) | 0.008 | -0.007 | -0.014 ± 0.005 | yes |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 10 (1.3%) | 7 (0.9%) |
| games where a king never moved | 175 (21.9%) | 240 (30.0%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 24.08 | 22.07 | 4.72 | 4.32 | 49.4% | 53.1% |
| R | 14.23 | 12.58 | 2.60 | 2.38 | 46.5% | 50.0% |
| N | 13.86 | 12.74 | 2.53 | 2.28 | 17.3% | 23.6% |
| K | 10.99 | 9.71 | 0.90 | 0.81 | 100.0% | 100.0% |
| Q | 10.97 | 9.51 | 2.28 | 2.06 | 60.1% | 61.4% |
| B | 10.82 | 9.36 | 2.48 | 2.20 | 33.6% | 37.3% |
| L | 5.83 | 6.82 | 0.95 | 2.25 | 11.6% | 12.1% |
| G | 0.04 | 0.03 | 0.00 | 0.00 | 0.0% | 0.0% |
| A | 0.00 | 0.00 | 0.00 | 0.00 | 0.0% | 0.0% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 0.00 | 0.00 |
| beastChainMoves | 0.00 | 0.00 |
| beastChainCaptures | 0.00 | 0.00 |
| maesterSwaps | 0.00 | 0.00 |
| maesterLongSwaps | 0.00 | 0.00 |
| paladinSacrifices | 0.95 | 0.00 |
| promotions | 0.26 | 0.22 |
| checks | 4.88 | 4.19 |

The pooled columns describe each whole population; the difference column is the mean over the
40 shared arrangements of (rule − base) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
