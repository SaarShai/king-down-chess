# Rule A/B — ab-g-pair

`guardCaptures=pawns guardStep=2` against the base `archerMove=any beastMove=any`, both arms at `--values A=280,L=310,G=170,M=330,S=215`.
4000 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `abb-base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.521 | 0.515 | -0.006 ± 0.012 | no |
| decisive | 0.714 | 0.587 | -0.126 ± 0.037 | yes |
| draw rate | 0.260 | 0.377 | +0.116 ± 0.035 | yes |
| capped | 0.026 | 0.036 | +0.010 ± 0.010 | no |
| mean plies | 127.9 | 137.5 | +9.7 ± 3.4 | yes |
| branching factor | 31.5 | 33.2 | +1.7 ± 0.5 | yes |
| killer move | 0.333 | 0.302 | -0.031 ± 0.010 | yes |
| lead change | 0.035 | 0.034 | -0.001 ± 0.002 | no |
| uncertainty late | 0.639 | 0.639 | -0.000 ± 0.002 | no |
| drama | 0.144 | 0.121 | -0.023 ± 0.009 | yes |
| permanence | 0.966 | 0.968 | +0.002 ± 0.001 | yes |
| min utilisation | 0.44 | 0.36 | -0.07 ± 0.02 | yes |
| interest | 0.490 | 0.482 | -0.009 ± 0.005 | yes |
| interest (min-use) | 0.468 | 0.450 | -0.008 ± 0.005 | yes |
| killerMove (resid.) | 0.002 | -0.002 | -0.004 ± 0.006 | no |
| leadChange (resid.) | 0.000 | -0.000 | -0.001 ± 0.002 | no |
| uncertaintyLate (resid.) | 0.003 | -0.003 | -0.006 ± 0.002 | yes |
| drama (resid.) | -0.000 | 0.000 | +0.000 ± 0.004 | no |
| permanence (resid.) | -0.000 | 0.000 | +0.000 ± 0.000 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | -0.023 | 0.081 | +0.093 ± 0.017 | yes |
| interest (resid.) | -0.001 | 0.004 | +0.004 ± 0.002 | yes |
| interestMinFairy (resid.) | -0.011 | -0.019 | +0.001 ± 0.003 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 3.548 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 1774 (44.4%) |
| dead-material endings (draw50 + drawMaterial) | 192 (4.8%) | 424 (10.6%) |
| games where a king never moved | 1012 (25.3%) | 946 (23.6%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 28.36 | 25.06 | 5.54 | 4.69 | 27.9% | 20.5% |
| A | 14.95 | 15.75 | 2.61 | 2.23 | 51.1% | 49.6% |
| M | 14.52 | 14.27 | 1.27 | 1.13 | 50.0% | 50.1% |
| K | 13.79 | 16.22 | 1.12 | 1.09 | 100.0% | 100.0% |
| R | 13.20 | 13.23 | 2.20 | 1.97 | 30.3% | 29.1% |
| S | 10.93 | 10.91 | 1.54 | 1.23 | 50.8% | 50.7% |
| G | 9.76 | 19.77 | 0.00 | 3.55 | 97.7% | 94.3% |
| B | 6.71 | 6.78 | 1.48 | 1.38 | 19.7% | 19.5% |
| N | 6.71 | 6.69 | 1.39 | 1.33 | 11.6% | 11.1% |
| Q | 6.29 | 6.15 | 1.32 | 1.27 | 38.4% | 31.5% |
| L | 2.66 | 2.71 | 0.48 | 0.47 | 7.2% | 8.4% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.61 | 2.23 |
| beastChainMoves | 1.27 | 1.06 |
| beastChainCaptures | 1.54 | 1.23 |
| maesterSwaps | 5.28 | 4.89 |
| maesterLongSwaps | 1.27 | 1.40 |
| paladinSacrifices | 0.48 | 0.47 |
| promotions | 0.40 | 0.29 |
| checks | 6.91 | 8.55 |

The pooled columns describe each whole population; the difference column is the mean over the
40 shared arrangements of (rule − base) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
