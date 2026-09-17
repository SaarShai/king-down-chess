# Rule A/B — ab-g-lim1

`guardCaptures=pawns guardStep=2 guardCaptureLimit=1` against the base `archerMove=any beastMove=any`, both arms at `--values A=280,L=310,G=170,M=330,S=215`.
4000 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `abb-base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.521 | 0.529 | +0.008 ± 0.010 | no |
| decisive | 0.714 | 0.660 | -0.053 ± 0.020 | yes |
| draw rate | 0.260 | 0.310 | +0.050 ± 0.019 | yes |
| capped | 0.026 | 0.029 | +0.003 ± 0.006 | no |
| mean plies | 127.9 | 132.1 | +4.2 ± 2.0 | yes |
| branching factor | 31.5 | 33.3 | +1.8 ± 0.5 | yes |
| killer move | 0.333 | 0.320 | -0.013 ± 0.008 | yes |
| lead change | 0.035 | 0.036 | +0.001 ± 0.001 | no |
| uncertainty late | 0.639 | 0.641 | +0.003 ± 0.002 | yes |
| drama | 0.144 | 0.135 | -0.010 ± 0.006 | yes |
| permanence | 0.966 | 0.967 | +0.001 ± 0.000 | yes |
| min utilisation | 0.44 | 0.42 | -0.02 ± 0.01 | yes |
| interest | 0.490 | 0.486 | -0.004 ± 0.003 | yes |
| interest (min-use) | 0.468 | 0.462 | -0.002 ± 0.004 | no |
| killerMove (resid.) | 0.001 | -0.001 | -0.003 ± 0.006 | no |
| leadChange (resid.) | -0.000 | 0.000 | +0.000 ± 0.001 | no |
| uncertaintyLate (resid.) | 0.001 | -0.001 | -0.003 ± 0.001 | yes |
| drama (resid.) | 0.000 | -0.000 | -0.000 ± 0.004 | no |
| permanence (resid.) | -0.000 | 0.000 | +0.000 ± 0.000 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | -0.000 | 0.029 | +0.048 ± 0.011 | yes |
| interest (resid.) | 0.000 | 0.001 | +0.002 ± 0.002 | yes |
| interestMinFairy (resid.) | -0.011 | -0.014 | +0.001 ± 0.003 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 1.079 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 192 (4.8%) | 278 (7.0%) |
| games where a king never moved | 1012 (25.3%) | 1005 (25.1%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 28.36 | 27.70 | 5.54 | 5.35 | 27.9% | 25.6% |
| A | 14.95 | 15.23 | 2.61 | 2.48 | 51.1% | 50.9% |
| M | 14.52 | 14.47 | 1.27 | 1.24 | 50.0% | 51.1% |
| K | 13.79 | 14.30 | 1.12 | 1.10 | 100.0% | 100.0% |
| R | 13.20 | 12.92 | 2.20 | 2.10 | 30.3% | 29.2% |
| S | 10.93 | 10.86 | 1.54 | 1.42 | 50.8% | 52.7% |
| G | 9.76 | 14.28 | 0.00 | 1.08 | 97.7% | 97.6% |
| B | 6.71 | 6.77 | 1.48 | 1.44 | 19.7% | 19.7% |
| N | 6.71 | 6.70 | 1.39 | 1.36 | 11.6% | 11.3% |
| Q | 6.29 | 6.11 | 1.32 | 1.29 | 38.4% | 36.2% |
| L | 2.66 | 2.72 | 0.48 | 0.47 | 7.2% | 8.2% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.61 | 2.48 |
| beastChainMoves | 1.27 | 1.22 |
| beastChainCaptures | 1.54 | 1.42 |
| maesterSwaps | 5.28 | 5.16 |
| maesterLongSwaps | 1.27 | 1.30 |
| paladinSacrifices | 0.48 | 0.47 |
| promotions | 0.40 | 0.36 |
| checks | 6.91 | 7.16 |

The pooled columns describe each whole population; the difference column is the mean over the
40 shared arrangements of (rule − base) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
