# Rule A/B — ab-g-pawns1

`guardCaptures=pawns` against the base `archerMove=any beastMove=any`, both arms at `--values A=280,L=310,G=170,M=330,S=215`.
4000 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `abb-base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.521 | 0.518 | -0.003 ± 0.012 | no |
| decisive | 0.714 | 0.647 | -0.067 ± 0.025 | yes |
| draw rate | 0.260 | 0.319 | +0.058 ± 0.024 | yes |
| capped | 0.026 | 0.035 | +0.008 ± 0.008 | yes |
| mean plies | 127.9 | 133.2 | +5.3 ± 2.8 | yes |
| branching factor | 31.5 | 31.4 | -0.1 ± 0.1 | yes |
| killer move | 0.333 | 0.314 | -0.019 ± 0.008 | yes |
| lead change | 0.035 | 0.035 | -0.000 ± 0.001 | no |
| uncertainty late | 0.639 | 0.638 | -0.000 ± 0.001 | no |
| drama | 0.144 | 0.133 | -0.011 ± 0.006 | yes |
| permanence | 0.966 | 0.967 | +0.001 ± 0.000 | yes |
| min utilisation | 0.44 | 0.41 | -0.03 ± 0.01 | yes |
| interest | 0.490 | 0.485 | -0.005 ± 0.003 | yes |
| interest (min-use) | 0.468 | 0.457 | -0.004 ± 0.004 | yes |
| killerMove (resid.) | 0.003 | -0.003 | -0.005 ± 0.007 | no |
| leadChange (resid.) | 0.000 | -0.000 | -0.001 ± 0.001 | no |
| uncertaintyLate (resid.) | 0.002 | -0.002 | -0.005 ± 0.002 | yes |
| drama (resid.) | 0.000 | -0.000 | -0.001 ± 0.004 | no |
| permanence (resid.) | -0.000 | 0.000 | +0.000 ± 0.000 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | -0.004 | 0.046 | +0.054 ± 0.015 | yes |
| interest (resid.) | 0.001 | 0.002 | +0.002 ± 0.002 | no |
| interestMinFairy (resid.) | -0.011 | -0.018 | +0.000 ± 0.003 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 1.700 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 861 (21.5%) |
| dead-material endings (draw50 + drawMaterial) | 192 (4.8%) | 299 (7.5%) |
| games where a king never moved | 1012 (25.3%) | 952 (23.8%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 28.36 | 27.17 | 5.54 | 5.29 | 27.9% | 23.5% |
| A | 14.95 | 15.65 | 2.61 | 2.50 | 51.1% | 49.0% |
| M | 14.52 | 14.45 | 1.27 | 1.18 | 50.0% | 48.8% |
| K | 13.79 | 15.64 | 1.12 | 1.14 | 100.0% | 100.0% |
| R | 13.20 | 13.32 | 2.20 | 2.12 | 30.3% | 29.1% |
| S | 10.93 | 10.93 | 1.54 | 1.39 | 50.8% | 50.0% |
| G | 9.76 | 13.79 | 0.00 | 1.70 | 97.7% | 93.4% |
| B | 6.71 | 6.61 | 1.48 | 1.42 | 19.7% | 19.5% |
| N | 6.71 | 6.78 | 1.39 | 1.38 | 11.6% | 10.8% |
| Q | 6.29 | 6.18 | 1.32 | 1.29 | 38.4% | 34.3% |
| L | 2.66 | 2.69 | 0.48 | 0.48 | 7.2% | 7.4% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.61 | 2.50 |
| beastChainMoves | 1.27 | 1.18 |
| beastChainCaptures | 1.54 | 1.39 |
| maesterSwaps | 5.28 | 5.07 |
| maesterLongSwaps | 1.27 | 1.34 |
| paladinSacrifices | 0.48 | 0.48 |
| promotions | 0.40 | 0.34 |
| checks | 6.91 | 8.04 |

The pooled columns describe each whole population; the difference column is the mean over the
40 shared arrangements of (rule − base) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
