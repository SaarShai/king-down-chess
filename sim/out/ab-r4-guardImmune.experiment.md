# Rule A/B — ab-r4-guardImmune

`guardImmune=false` against the base `archerMove=any beastMove=any`, both arms at `--values A=280,L=310,G=170,M=330,S=215`.
4000 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `abb-base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.521 | 0.524 | +0.003 ± 0.013 | no |
| decisive | 0.714 | 0.756 | +0.042 ± 0.018 | yes |
| draw rate | 0.260 | 0.233 | -0.028 ± 0.016 | yes |
| capped | 0.026 | 0.011 | -0.015 ± 0.007 | yes |
| mean plies | 127.9 | 120.3 | -7.6 ± 2.6 | yes |
| branching factor | 31.5 | 31.3 | -0.2 ± 0.1 | yes |
| killer move | 0.333 | 0.337 | +0.004 ± 0.009 | no |
| lead change | 0.035 | 0.036 | +0.001 ± 0.001 | yes |
| uncertainty late | 0.639 | 0.639 | +0.000 ± 0.001 | no |
| drama | 0.144 | 0.155 | +0.011 ± 0.008 | yes |
| permanence | 0.966 | 0.965 | -0.001 ± 0.000 | yes |
| min utilisation | 0.44 | 0.46 | +0.02 ± 0.01 | yes |
| interest | 0.490 | 0.491 | +0.002 ± 0.003 | no |
| interest (min-use) | 0.468 | 0.479 | -0.002 ± 0.006 | no |
| killerMove (resid.) | 0.001 | -0.001 | -0.003 ± 0.008 | no |
| leadChange (resid.) | -0.001 | 0.001 | +0.002 ± 0.001 | yes |
| uncertaintyLate (resid.) | -0.002 | 0.002 | +0.004 ± 0.002 | yes |
| drama (resid.) | -0.003 | 0.003 | +0.005 ± 0.006 | no |
| permanence (resid.) | 0.000 | -0.000 | -0.001 ± 0.000 | yes |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.036 | -0.016 | -0.025 ± 0.014 | yes |
| interest (resid.) | 0.002 | -0.001 | -0.001 ± 0.002 | no |
| interestMinFairy (resid.) | -0.008 | -0.000 | -0.005 ± 0.006 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 192 (4.8%) | 146 (3.6%) |
| games where a king never moved | 1012 (25.3%) | 1012 (25.3%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 28.36 | 27.78 | 5.54 | 5.57 | 27.9% | 29.4% |
| A | 14.95 | 14.48 | 2.61 | 2.70 | 51.1% | 51.3% |
| M | 14.52 | 13.65 | 1.27 | 1.28 | 50.0% | 49.4% |
| K | 13.79 | 12.94 | 1.12 | 1.08 | 100.0% | 100.0% |
| R | 13.20 | 12.03 | 2.20 | 2.27 | 30.3% | 31.1% |
| S | 10.93 | 10.20 | 1.54 | 1.54 | 50.8% | 52.8% |
| G | 9.76 | 7.16 | 0.00 | 0.00 | 97.7% | 72.2% |
| B | 6.71 | 6.53 | 1.48 | 1.49 | 19.7% | 19.8% |
| N | 6.71 | 6.69 | 1.39 | 1.39 | 11.6% | 12.1% |
| Q | 6.29 | 6.17 | 1.32 | 1.32 | 38.4% | 39.1% |
| L | 2.66 | 2.65 | 0.48 | 0.47 | 7.2% | 7.7% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.61 | 2.70 |
| beastChainMoves | 1.27 | 1.28 |
| beastChainCaptures | 1.54 | 1.54 |
| maesterSwaps | 5.28 | 4.87 |
| maesterLongSwaps | 1.27 | 1.27 |
| paladinSacrifices | 0.48 | 0.47 |
| promotions | 0.40 | 0.37 |
| checks | 6.91 | 6.62 |

The pooled columns describe each whole population; the difference column is the mean over the
40 shared arrangements of (rule − base) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
