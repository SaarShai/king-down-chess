# Rule A/B — ab-r4-promo

`promotionSet=standard` against the base `archerMove=any beastMove=any`, both arms at `--values A=280,L=310,G=170,M=330,S=215`.
4000 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `abb-base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.521 | 0.519 | -0.002 ± 0.004 | no |
| decisive | 0.714 | 0.714 | +0.000 ± 0.004 | no |
| draw rate | 0.260 | 0.262 | +0.001 ± 0.004 | no |
| capped | 0.026 | 0.025 | -0.002 ± 0.002 | no |
| mean plies | 127.9 | 127.7 | -0.2 ± 0.4 | no |
| branching factor | 31.5 | 31.4 | -0.1 ± 0.0 | yes |
| killer move | 0.333 | 0.334 | +0.001 ± 0.002 | no |
| lead change | 0.035 | 0.035 | +0.000 ± 0.000 | no |
| uncertainty late | 0.639 | 0.639 | +0.000 ± 0.000 | no |
| drama | 0.144 | 0.145 | +0.001 ± 0.002 | no |
| permanence | 0.966 | 0.966 | -0.000 ± 0.000 | yes |
| min utilisation | 0.44 | 0.44 | +0.00 ± 0.00 | no |
| interest | 0.490 | 0.490 | +0.000 ± 0.001 | no |
| interest (min-use) | 0.468 | 0.468 | +0.000 ± 0.001 | no |
| killerMove (resid.) | -0.001 | 0.001 | +0.001 ± 0.002 | no |
| leadChange (resid.) | -0.000 | 0.000 | +0.000 ± 0.000 | no |
| uncertaintyLate (resid.) | -0.000 | 0.000 | +0.000 ± 0.000 | no |
| drama (resid.) | -0.001 | 0.001 | +0.001 ± 0.001 | no |
| permanence (resid.) | 0.000 | -0.000 | -0.000 ± 0.000 | yes |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.023 | 0.016 | +0.001 ± 0.006 | no |
| interest (resid.) | 0.001 | 0.001 | +0.000 ± 0.001 | no |
| interestMinFairy (resid.) | -0.011 | -0.011 | +0.001 ± 0.001 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 192 (4.8%) | 196 (4.9%) |
| games where a king never moved | 1012 (25.3%) | 1008 (25.2%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 28.36 | 28.35 | 5.54 | 5.54 | 27.9% | 27.9% |
| A | 14.95 | 14.91 | 2.61 | 2.61 | 51.1% | 51.1% |
| M | 14.52 | 14.51 | 1.27 | 1.28 | 50.0% | 49.9% |
| K | 13.79 | 13.81 | 1.12 | 1.12 | 100.0% | 100.0% |
| R | 13.20 | 13.20 | 2.20 | 2.21 | 30.3% | 30.2% |
| S | 10.93 | 10.95 | 1.54 | 1.55 | 50.8% | 50.6% |
| G | 9.76 | 9.58 | 0.00 | 0.00 | 97.7% | 96.4% |
| B | 6.71 | 6.71 | 1.48 | 1.49 | 19.7% | 19.8% |
| N | 6.71 | 6.71 | 1.39 | 1.39 | 11.6% | 11.6% |
| Q | 6.29 | 6.30 | 1.32 | 1.32 | 38.4% | 38.6% |
| L | 2.66 | 2.66 | 0.48 | 0.48 | 7.2% | 7.1% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.61 | 2.61 |
| beastChainMoves | 1.27 | 1.29 |
| beastChainCaptures | 1.54 | 1.55 |
| maesterSwaps | 5.28 | 5.25 |
| maesterLongSwaps | 1.27 | 1.27 |
| paladinSacrifices | 0.48 | 0.48 |
| promotions | 0.40 | 0.38 |
| checks | 6.91 | 6.95 |

The pooled columns describe each whole population; the difference column is the mean over the
40 shared arrangements of (rule − base) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
