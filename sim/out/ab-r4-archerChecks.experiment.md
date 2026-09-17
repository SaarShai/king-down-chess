# Rule A/B — ab-r4-archerChecks

`archerChecks=false` against the base `archerMove=any beastMove=any`, both arms at `--values A=280,L=310,G=170,M=330,S=215`.
4000 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `abb-base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.521 | 0.527 | +0.007 ± 0.011 | no |
| decisive | 0.714 | 0.687 | -0.027 ± 0.018 | yes |
| draw rate | 0.260 | 0.272 | +0.012 ± 0.013 | no |
| capped | 0.026 | 0.041 | +0.015 ± 0.009 | yes |
| mean plies | 127.9 | 133.4 | +5.5 ± 2.6 | yes |
| branching factor | 31.5 | 31.6 | +0.1 ± 0.1 | yes |
| killer move | 0.333 | 0.341 | +0.008 ± 0.007 | yes |
| lead change | 0.035 | 0.034 | -0.000 ± 0.001 | no |
| uncertainty late | 0.639 | 0.639 | -0.000 ± 0.001 | no |
| drama | 0.144 | 0.143 | -0.001 ± 0.005 | no |
| permanence | 0.966 | 0.966 | -0.000 ± 0.000 | yes |
| min utilisation | 0.44 | 0.43 | -0.01 ± 0.01 | yes |
| interest | 0.490 | 0.491 | +0.001 ± 0.003 | no |
| interest (min-use) | 0.468 | 0.469 | +0.003 ± 0.003 | no |
| killerMove (resid.) | -0.005 | 0.005 | +0.010 ± 0.006 | yes |
| leadChange (resid.) | 0.000 | -0.000 | -0.001 ± 0.001 | yes |
| uncertaintyLate (resid.) | 0.001 | -0.001 | -0.001 ± 0.002 | no |
| drama (resid.) | -0.001 | 0.001 | +0.001 ± 0.004 | no |
| permanence (resid.) | 0.000 | -0.000 | -0.001 ± 0.000 | yes |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.017 | 0.011 | +0.013 ± 0.015 | no |
| interest (resid.) | -0.000 | 0.002 | +0.003 ± 0.002 | yes |
| interestMinFairy (resid.) | -0.013 | -0.011 | +0.004 ± 0.003 | yes |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 192 (4.8%) | 260 (6.5%) |
| games where a king never moved | 1012 (25.3%) | 968 (24.2%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 28.36 | 28.62 | 5.54 | 5.54 | 27.9% | 26.8% |
| A | 14.95 | 14.69 | 2.61 | 2.58 | 51.1% | 52.4% |
| M | 14.52 | 15.42 | 1.27 | 1.26 | 50.0% | 51.2% |
| K | 13.79 | 14.97 | 1.12 | 1.34 | 100.0% | 100.0% |
| R | 13.20 | 13.68 | 2.20 | 2.22 | 30.3% | 29.2% |
| S | 10.93 | 11.31 | 1.54 | 1.54 | 50.8% | 48.9% |
| G | 9.76 | 11.95 | 0.00 | 0.00 | 97.7% | 97.1% |
| B | 6.71 | 6.77 | 1.48 | 1.47 | 19.7% | 18.9% |
| N | 6.71 | 6.78 | 1.39 | 1.40 | 11.6% | 11.0% |
| Q | 6.29 | 6.47 | 1.32 | 1.33 | 38.4% | 40.0% |
| L | 2.66 | 2.79 | 0.48 | 0.48 | 7.2% | 7.7% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.61 | 2.58 |
| beastChainMoves | 1.27 | 1.28 |
| beastChainCaptures | 1.54 | 1.54 |
| maesterSwaps | 5.28 | 5.60 |
| maesterLongSwaps | 1.27 | 1.42 |
| paladinSacrifices | 0.48 | 0.48 |
| promotions | 0.40 | 0.43 |
| checks | 6.91 | 5.97 |

The pooled columns describe each whole population; the difference column is the mean over the
40 shared arrangements of (rule − base) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
