# Rule A/B — ab-r4-bishops

`bishopsOppositeColours=false` against the base `archerMove=any beastMove=any`, both arms at `--values A=280,L=310,G=170,M=330,S=215`.
4000 games per population, depth 3, the same 38 arrangements and the same
opening seeds in both (common random numbers). Control arm: `abb-base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.521 | 0.522 | +0.000 ± 0.000 | no |
| decisive | 0.714 | 0.720 | +0.000 ± 0.000 | no |
| draw rate | 0.260 | 0.253 | +0.000 ± 0.000 | no |
| capped | 0.026 | 0.027 | +0.000 ± 0.000 | no |
| mean plies | 127.9 | 127.6 | +0.0 ± 0.0 | no |
| branching factor | 31.5 | 31.5 | +0.0 ± 0.0 | no |
| killer move | 0.333 | 0.335 | -0.000 ± 0.000 | no |
| lead change | 0.035 | 0.035 | +0.000 ± 0.000 | no |
| uncertainty late | 0.639 | 0.639 | +0.000 ± 0.000 | no |
| drama | 0.144 | 0.146 | +0.000 ± 0.000 | no |
| permanence | 0.966 | 0.966 | +0.000 ± 0.000 | no |
| min utilisation | 0.44 | 0.44 | +0.00 ± 0.00 | no |
| interest | 0.490 | 0.491 | -0.000 ± 0.000 | yes |
| interest (min-use) | 0.468 | 0.469 | -0.000 ± 0.000 | yes |
| killerMove (resid.) | -0.000 | 0.000 | -0.000 ± 0.000 | no |
| leadChange (resid.) | -0.000 | 0.000 | +0.000 ± 0.000 | no |
| uncertaintyLate (resid.) | -0.000 | 0.000 | +0.000 ± 0.000 | no |
| drama (resid.) | -0.000 | 0.000 | +0.000 ± 0.000 | no |
| permanence (resid.) | 0.000 | -0.000 | +0.000 ± 0.000 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.027 | 0.019 | -0.005 ± 0.000 | yes |
| interest (resid.) | 0.002 | 0.001 | -0.000 ± 0.000 | yes |
| interestMinFairy (resid.) | -0.011 | -0.010 | -0.000 ± 0.000 | yes |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 192 (4.8%) | 184 (4.6%) |
| games where a king never moved | 1012 (25.3%) | 997 (24.9%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 28.36 | 28.38 | 5.54 | 5.56 | 27.9% | 27.8% |
| A | 14.95 | 15.18 | 2.61 | 2.66 | 51.1% | 50.3% |
| M | 14.52 | 14.00 | 1.27 | 1.23 | 50.0% | 50.1% |
| K | 13.79 | 13.76 | 1.12 | 1.12 | 100.0% | 100.0% |
| R | 13.20 | 13.14 | 2.20 | 2.20 | 30.3% | 30.3% |
| S | 10.93 | 10.95 | 1.54 | 1.54 | 50.8% | 50.5% |
| G | 9.76 | 9.53 | 0.00 | 0.00 | 97.7% | 97.8% |
| B | 6.71 | 7.27 | 1.48 | 1.60 | 19.7% | 20.0% |
| N | 6.71 | 6.87 | 1.39 | 1.43 | 11.6% | 11.7% |
| Q | 6.29 | 5.83 | 1.32 | 1.20 | 38.4% | 41.3% |
| L | 2.66 | 2.66 | 0.48 | 0.48 | 7.2% | 7.2% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.61 | 2.66 |
| beastChainMoves | 1.27 | 1.28 |
| beastChainCaptures | 1.54 | 1.54 |
| maesterSwaps | 5.28 | 5.14 |
| maesterLongSwaps | 1.27 | 1.23 |
| paladinSacrifices | 0.48 | 0.48 |
| promotions | 0.40 | 0.41 |
| checks | 6.91 | 6.89 |

The pooled columns describe each whole population; the difference column is the mean over the
38 shared arrangements of (rule − base) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
