# Rule A/B — ab-g-lim1g

`` against the base `guardCaptures=none guardStep=1 guardCaptureLimit=0`, both arms at `--values A=280,L=310,G=170,M=330,S=215`.
4000 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `abb-base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.521 | 0.519 | -0.002 ± 0.012 | no |
| decisive | 0.714 | 0.659 | -0.054 ± 0.023 | yes |
| draw rate | 0.260 | 0.308 | +0.048 ± 0.021 | yes |
| capped | 0.026 | 0.033 | +0.006 ± 0.009 | no |
| mean plies | 127.9 | 133.6 | +5.7 ± 2.8 | yes |
| branching factor | 31.5 | 33.3 | +1.8 ± 0.5 | yes |
| killer move | 0.333 | 0.322 | -0.011 ± 0.007 | yes |
| lead change | 0.035 | 0.035 | +0.001 ± 0.001 | no |
| uncertainty late | 0.639 | 0.642 | +0.003 ± 0.001 | yes |
| drama | 0.144 | 0.137 | -0.008 ± 0.006 | yes |
| permanence | 0.966 | 0.968 | +0.001 ± 0.001 | yes |
| min utilisation | 0.44 | 0.41 | -0.03 ± 0.01 | yes |
| interest | 0.490 | 0.488 | -0.003 ± 0.003 | no |
| interest (min-use) | 0.468 | 0.461 | -0.002 ± 0.004 | no |
| killerMove (resid.) | -0.000 | 0.000 | +0.000 ± 0.005 | no |
| leadChange (resid.) | 0.000 | -0.000 | -0.000 ± 0.001 | no |
| uncertaintyLate (resid.) | 0.001 | -0.001 | -0.001 ± 0.001 | no |
| drama (resid.) | -0.001 | 0.001 | +0.002 ± 0.004 | no |
| permanence (resid.) | -0.000 | 0.000 | +0.000 ± 0.000 | yes |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.000 | 0.043 | +0.046 ± 0.015 | yes |
| interest (resid.) | -0.000 | 0.003 | +0.003 ± 0.002 | yes |
| interestMinFairy (resid.) | -0.012 | -0.015 | +0.002 ± 0.003 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 1.341 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 4 (0.1%) |
| dead-material endings (draw50 + drawMaterial) | 192 (4.8%) | 258 (6.5%) |
| games where a king never moved | 1012 (25.3%) | 990 (24.8%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 28.36 | 27.61 | 5.54 | 5.31 | 27.9% | 24.8% |
| A | 14.95 | 15.37 | 2.61 | 2.48 | 51.1% | 49.8% |
| M | 14.52 | 14.47 | 1.27 | 1.23 | 50.0% | 50.4% |
| K | 13.79 | 14.48 | 1.12 | 1.10 | 100.0% | 100.0% |
| R | 13.20 | 13.07 | 2.20 | 2.11 | 30.3% | 28.5% |
| S | 10.93 | 10.90 | 1.54 | 1.40 | 50.8% | 51.5% |
| G | 9.76 | 15.34 | 0.00 | 1.34 | 97.7% | 97.6% |
| B | 6.71 | 6.76 | 1.48 | 1.43 | 19.7% | 19.3% |
| N | 6.71 | 6.72 | 1.39 | 1.37 | 11.6% | 11.6% |
| Q | 6.29 | 6.14 | 1.32 | 1.28 | 38.4% | 35.6% |
| L | 2.66 | 2.71 | 0.48 | 0.48 | 7.2% | 7.9% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.61 | 2.48 |
| beastChainMoves | 1.27 | 1.20 |
| beastChainCaptures | 1.54 | 1.40 |
| maesterSwaps | 5.28 | 5.07 |
| maesterLongSwaps | 1.27 | 1.31 |
| paladinSacrifices | 0.48 | 0.48 |
| promotions | 0.40 | 0.36 |
| checks | 6.91 | 7.30 |

The pooled columns describe each whole population; the difference column is the mean over the
40 shared arrangements of (rule − base) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
