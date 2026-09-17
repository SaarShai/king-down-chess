# Rule A/B — ab-buffed40

`archerMove=any beastMove=any` against today's defaults.
4000 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `ab17-base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.523 | 0.521 | -0.002 ± 0.016 | no |
| decisive | 0.573 | 0.696 | +0.123 ± 0.035 | yes |
| draw rate | 0.355 | 0.277 | -0.078 ± 0.025 | yes |
| capped | 0.071 | 0.027 | -0.045 ± 0.015 | yes |
| mean plies | 145.2 | 128.1 | -17.0 ± 4.5 | yes |
| branching factor | 27.6 | 31.5 | +3.9 ± 0.7 | yes |
| killer move | 0.304 | 0.323 | +0.018 ± 0.012 | yes |
| lead change | 0.036 | 0.036 | -0.001 ± 0.002 | no |
| uncertainty late | 0.644 | 0.641 | -0.003 ± 0.002 | yes |
| drama | 0.113 | 0.142 | +0.029 ± 0.009 | yes |
| permanence | 0.968 | 0.967 | -0.001 ± 0.001 | yes |
| min utilisation | 0.41 | 0.44 | +0.03 ± 0.01 | yes |
| interest | 0.481 | 0.487 | +0.007 ± 0.005 | yes |
| interest (min-use) | 0.376 | 0.439 | +0.070 ± 0.019 | yes |
| killerMove (resid.) | 0.004 | -0.004 | -0.008 ± 0.009 | no |
| leadChange (resid.) | -0.001 | 0.001 | +0.002 ± 0.002 | yes |
| uncertaintyLate (resid.) | -0.002 | 0.002 | +0.004 ± 0.002 | yes |
| drama (resid.) | -0.003 | 0.003 | +0.007 ± 0.006 | yes |
| permanence (resid.) | -0.000 | 0.000 | +0.000 ± 0.001 | no |
| fairyUse (resid.) | 0.001 | 0.001 | +0.003 ± 0.003 | no |
| excessDecisiveness (resid.) | 0.052 | -0.033 | -0.082 ± 0.017 | yes |
| interest (resid.) | 0.004 | -0.002 | -0.005 ± 0.003 | yes |
| interestMinFairy (resid.) | -0.040 | -0.005 | +0.042 ± 0.016 | yes |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 419 (10.5%) | 197 (4.9%) |
| games where a king never moved | 728 (18.2%) | 874 (21.9%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 29.76 | 28.22 | 5.94 | 5.58 | 26.8% | 28.0% |
| M | 24.12 | 15.83 | 1.36 | 1.36 | 53.0% | 50.2% |
| K | 20.33 | 13.98 | 1.10 | 1.14 | 100.0% | 100.0% |
| G | 14.41 | 8.86 | 0.00 | 0.00 | 98.5% | 97.7% |
| A | 14.40 | 15.95 | 2.67 | 2.88 | 72.9% | 50.4% |
| R | 13.25 | 11.89 | 2.03 | 1.94 | 29.0% | 31.7% |
| N | 9.13 | 8.14 | 1.67 | 1.62 | 12.5% | 10.4% |
| B | 8.56 | 7.50 | 1.66 | 1.58 | 19.1% | 16.6% |
| S | 4.10 | 11.42 | 0.60 | 1.57 | 68.9% | 51.6% |
| Q | 3.77 | 3.61 | 0.77 | 0.74 | 54.4% | 60.0% |
| L | 3.33 | 2.74 | 0.59 | 0.62 | 6.2% | 4.9% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.67 | 2.88 |
| beastChainMoves | 0.54 | 1.31 |
| beastChainCaptures | 0.60 | 1.57 |
| maesterSwaps | 9.52 | 5.95 |
| maesterLongSwaps | 1.88 | 1.30 |
| paladinSacrifices | 0.59 | 0.62 |
| promotions | 0.33 | 0.37 |
| checks | 6.92 | 6.73 |

The pooled columns describe each whole population; the difference column is the mean over the
40 shared arrangements of (rule − base) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
