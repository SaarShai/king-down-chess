# Rule A/B — ab-r4-longSwap

`maesterLongSwap=false` against the base `archerMove=any beastMove=any`, both arms at `--values A=280,L=310,G=170,M=330,S=215`.
4000 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `abb-base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.521 | 0.529 | +0.009 ± 0.015 | no |
| decisive | 0.714 | 0.715 | +0.001 ± 0.013 | no |
| draw rate | 0.260 | 0.258 | -0.003 ± 0.013 | no |
| capped | 0.026 | 0.028 | +0.001 ± 0.007 | no |
| mean plies | 127.9 | 127.0 | -0.9 ± 2.3 | no |
| branching factor | 31.5 | 31.4 | -0.1 ± 0.2 | no |
| killer move | 0.333 | 0.335 | +0.002 ± 0.007 | no |
| lead change | 0.035 | 0.035 | +0.000 ± 0.001 | no |
| uncertainty late | 0.639 | 0.637 | -0.002 ± 0.002 | no |
| drama | 0.144 | 0.144 | +0.000 ± 0.006 | no |
| permanence | 0.966 | 0.966 | -0.000 ± 0.000 | no |
| min utilisation | 0.44 | 0.44 | +0.00 ± 0.01 | no |
| interest | 0.490 | 0.489 | +0.000 ± 0.002 | no |
| interest (min-use) | 0.468 | 0.472 | +0.005 ± 0.004 | yes |
| killerMove (resid.) | -0.001 | 0.001 | +0.002 ± 0.006 | no |
| leadChange (resid.) | -0.000 | 0.000 | +0.000 ± 0.001 | no |
| uncertaintyLate (resid.) | 0.001 | -0.001 | -0.001 ± 0.002 | no |
| drama (resid.) | 0.000 | -0.000 | -0.000 ± 0.005 | no |
| permanence (resid.) | 0.000 | -0.000 | -0.000 ± 0.000 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.025 | 0.000 | -0.002 ± 0.012 | no |
| interest (resid.) | 0.001 | 0.000 | -0.000 ± 0.002 | no |
| interestMinFairy (resid.) | -0.013 | -0.010 | +0.005 ± 0.004 | yes |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 192 (4.8%) | 174 (4.3%) |
| games where a king never moved | 1012 (25.3%) | 983 (24.6%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 28.36 | 28.11 | 5.54 | 5.50 | 27.9% | 28.4% |
| A | 14.95 | 14.91 | 2.61 | 2.61 | 51.1% | 50.2% |
| M | 14.52 | 14.31 | 1.27 | 1.30 | 50.0% | 50.5% |
| K | 13.79 | 13.94 | 1.12 | 1.11 | 100.0% | 100.0% |
| R | 13.20 | 12.63 | 2.20 | 2.19 | 30.3% | 30.2% |
| S | 10.93 | 10.87 | 1.54 | 1.51 | 50.8% | 52.9% |
| G | 9.76 | 10.02 | 0.00 | 0.00 | 97.7% | 97.4% |
| B | 6.71 | 6.56 | 1.48 | 1.47 | 19.7% | 18.7% |
| N | 6.71 | 6.62 | 1.39 | 1.37 | 11.6% | 12.6% |
| Q | 6.29 | 6.29 | 1.32 | 1.30 | 38.4% | 39.0% |
| L | 2.66 | 2.71 | 0.48 | 0.47 | 7.2% | 7.8% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.61 | 2.61 |
| beastChainMoves | 1.27 | 1.25 |
| beastChainCaptures | 1.54 | 1.51 |
| maesterSwaps | 5.28 | 5.12 |
| maesterLongSwaps | 1.27 | 0.91 |
| paladinSacrifices | 0.48 | 0.47 |
| promotions | 0.40 | 0.40 |
| checks | 6.91 | 6.88 |

The pooled columns describe each whole population; the difference column is the mean over the
40 shared arrangements of (rule − base) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
