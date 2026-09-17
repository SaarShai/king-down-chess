# Rule A/B — pb-lp-nojump

`paladinJumpsFriends=false` against the base `promotionSet=anyNonKing`.
800 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-lp-base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.554 | 0.551 | -0.004 ± 0.039 | no |
| decisive | 0.846 | 0.816 | -0.030 ± 0.037 | no |
| draw rate | 0.149 | 0.179 | +0.030 ± 0.038 | no |
| capped | 0.005 | 0.005 | +0.000 ± 0.008 | no |
| mean plies | 90.8 | 99.2 | +8.4 ± 3.6 | yes |
| branching factor | 31.4 | 29.4 | -2.0 ± 0.5 | yes |
| killer move | 0.366 | 0.373 | +0.007 ± 0.017 | no |
| lead change | 0.053 | 0.071 | +0.018 ± 0.008 | yes |
| uncertainty late | 0.620 | 0.643 | +0.023 ± 0.006 | yes |
| drama | 0.138 | 0.150 | +0.013 ± 0.013 | no |
| permanence | 0.952 | 0.953 | +0.001 ± 0.002 | no |
| min utilisation | 0.53 | 0.53 | -0.00 ± 0.01 | no |
| interest | 0.488 | 0.492 | -0.007 ± 0.007 | no |
| interest (min-use) | 0.488 | 0.492 | -0.007 ± 0.007 | no |
| killerMove (resid.) | -0.007 | 0.007 | +0.014 ± 0.017 | no |
| leadChange (resid.) | -0.008 | 0.008 | +0.016 ± 0.008 | yes |
| uncertaintyLate (resid.) | -0.010 | 0.010 | +0.020 ± 0.006 | yes |
| drama (resid.) | -0.010 | 0.010 | +0.019 ± 0.013 | yes |
| permanence (resid.) | 0.000 | -0.000 | -0.000 ± 0.002 | no |
| fairyUse (resid.) | 0.030 | 0.033 | -0.046 ± 0.027 | yes |
| excessDecisiveness (resid.) | -0.020 | 0.024 | +0.029 ± 0.010 | yes |
| interest (resid.) | 0.002 | 0.011 | -0.002 ± 0.006 | no |
| interestMinFairy (resid.) | 0.002 | 0.011 | -0.002 ± 0.006 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 10 (1.3%) | 19 (2.4%) |
| games where a king never moved | 175 (21.9%) | 145 (18.1%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 24.08 | 26.08 | 4.72 | 5.00 | 49.4% | 45.3% |
| R | 14.23 | 16.86 | 2.60 | 3.03 | 46.5% | 40.9% |
| N | 13.86 | 14.42 | 2.53 | 2.58 | 17.3% | 15.4% |
| K | 10.99 | 12.34 | 0.90 | 1.02 | 100.0% | 100.0% |
| Q | 10.97 | 11.46 | 2.28 | 2.35 | 60.1% | 56.1% |
| B | 10.82 | 12.03 | 2.48 | 2.60 | 33.6% | 29.7% |
| L | 5.83 | 6.00 | 0.95 | 0.86 | 11.6% | 25.4% |
| G | 0.04 | 0.01 | 0.00 | 0.00 | 0.0% | 0.0% |
| A | 0.00 | 0.00 | 0.00 | 0.00 | 0.0% | 0.0% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 0.00 | 0.00 |
| beastChainMoves | 0.00 | 0.00 |
| beastChainCaptures | 0.00 | 0.00 |
| maesterSwaps | 0.00 | 0.00 |
| maesterLongSwaps | 0.00 | 0.00 |
| paladinSacrifices | 0.95 | 0.86 |
| promotions | 0.26 | 0.33 |
| checks | 4.88 | 5.14 |

The pooled columns describe each whole population; the difference column is the mean over the
40 shared arrangements of (rule − base) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
