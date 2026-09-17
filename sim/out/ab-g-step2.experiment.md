# Rule A/B — ab-g-step2

`guardStep=2` against the base `archerMove=any beastMove=any`, both arms at `--values A=280,L=310,G=170,M=330,S=215`.
4000 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `abb-base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.521 | 0.521 | +0.000 ± 0.010 | no |
| decisive | 0.714 | 0.690 | -0.024 ± 0.016 | yes |
| draw rate | 0.260 | 0.281 | +0.021 ± 0.014 | yes |
| capped | 0.026 | 0.029 | +0.003 ± 0.007 | no |
| mean plies | 127.9 | 130.8 | +2.9 ± 1.8 | yes |
| branching factor | 31.5 | 32.9 | +1.4 ± 0.4 | yes |
| killer move | 0.333 | 0.328 | -0.005 ± 0.007 | no |
| lead change | 0.035 | 0.035 | -0.000 ± 0.001 | no |
| uncertainty late | 0.639 | 0.639 | +0.000 ± 0.001 | no |
| drama | 0.144 | 0.143 | -0.001 ± 0.005 | no |
| permanence | 0.966 | 0.967 | +0.000 ± 0.000 | yes |
| min utilisation | 0.44 | 0.43 | -0.01 ± 0.01 | yes |
| interest | 0.490 | 0.489 | -0.001 ± 0.003 | no |
| interest (min-use) | 0.468 | 0.464 | +0.001 ± 0.003 | no |
| killerMove (resid.) | 0.000 | -0.000 | -0.000 ± 0.006 | no |
| leadChange (resid.) | 0.000 | -0.000 | -0.001 ± 0.001 | yes |
| uncertaintyLate (resid.) | 0.001 | -0.001 | -0.002 ± 0.001 | yes |
| drama (resid.) | -0.001 | 0.001 | +0.003 ± 0.004 | no |
| permanence (resid.) | -0.000 | 0.000 | +0.000 ± 0.000 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.013 | 0.019 | +0.021 ± 0.013 | yes |
| interest (resid.) | 0.001 | 0.001 | +0.001 ± 0.002 | no |
| interestMinFairy (resid.) | -0.012 | -0.015 | +0.002 ± 0.002 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 192 (4.8%) | 240 (6.0%) |
| games where a king never moved | 1012 (25.3%) | 1005 (25.1%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 28.36 | 28.45 | 5.54 | 5.56 | 27.9% | 27.9% |
| A | 14.95 | 15.04 | 2.61 | 2.63 | 51.1% | 51.1% |
| M | 14.52 | 14.72 | 1.27 | 1.31 | 50.0% | 49.4% |
| K | 13.79 | 14.13 | 1.12 | 1.12 | 100.0% | 100.0% |
| R | 13.20 | 12.98 | 2.20 | 2.16 | 30.3% | 29.8% |
| S | 10.93 | 11.09 | 1.54 | 1.55 | 50.8% | 51.2% |
| G | 9.76 | 11.85 | 0.00 | 0.00 | 97.7% | 98.5% |
| B | 6.71 | 6.81 | 1.48 | 1.48 | 19.7% | 19.6% |
| N | 6.71 | 6.72 | 1.39 | 1.37 | 11.6% | 11.6% |
| Q | 6.29 | 6.35 | 1.32 | 1.32 | 38.4% | 37.7% |
| L | 2.66 | 2.69 | 0.48 | 0.48 | 7.2% | 7.5% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.61 | 2.63 |
| beastChainMoves | 1.27 | 1.29 |
| beastChainCaptures | 1.54 | 1.55 |
| maesterSwaps | 5.28 | 5.32 |
| maesterLongSwaps | 1.27 | 1.30 |
| paladinSacrifices | 0.48 | 0.48 |
| promotions | 0.40 | 0.40 |
| checks | 6.91 | 7.06 |

The pooled columns describe each whole population; the difference column is the mean over the
40 shared arrangements of (rule − base) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
