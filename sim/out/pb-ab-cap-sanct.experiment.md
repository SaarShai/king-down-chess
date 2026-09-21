# Rule A/B — pb-ab-cap-sanct

`capitalSanctuary=true` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-cap-sanct.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.561 | 0.527 | -0.034 ± 0.030 | yes |
| decisive | 0.792 | 0.823 | +0.031 ± 0.033 | no |
| draw rate | 0.198 | 0.160 | -0.038 ± 0.031 | yes |
| capped | 0.010 | 0.018 | +0.008 ± 0.009 | no |
| mean plies | 110.3 | 105.7 | -4.6 ± 4.6 | yes |
| branching factor | 32.7 | 34.3 | +1.6 ± 0.5 | yes |
| killer move | 0.331 | 0.369 | +0.038 ± 0.019 | yes |
| lead change | 0.059 | 0.072 | +0.014 ± 0.005 | yes |
| uncertainty late | 0.631 | 0.634 | +0.002 ± 0.004 | no |
| drama | 0.145 | 0.159 | +0.014 ± 0.012 | yes |
| permanence | 0.959 | 0.950 | -0.008 ± 0.003 | yes |
| min utilisation | 0.43 | 0.41 | -0.01 ± 0.01 | yes |
| interest | 0.483 | 0.490 | +0.007 ± 0.005 | yes |
| interest (min-use) | 0.483 | 0.490 | +0.011 ± 0.008 | yes |
| killerMove (resid.) | -0.012 | 0.012 | +0.025 ± 0.016 | yes |
| leadChange (resid.) | -0.005 | 0.005 | +0.011 ± 0.006 | yes |
| uncertaintyLate (resid.) | -0.002 | 0.002 | +0.004 ± 0.004 | yes |
| drama (resid.) | -0.004 | 0.004 | +0.007 ± 0.012 | no |
| permanence (resid.) | 0.003 | -0.003 | -0.006 ± 0.003 | yes |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.019 | -0.017 | -0.038 ± 0.009 | yes |
| interest (resid.) | -0.001 | 0.001 | +0.002 ± 0.004 | no |
| interestMinFairy (resid.) | 0.009 | 0.011 | +0.007 ± 0.007 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 14 (0.9%) | 14 (0.9%) |
| games where a king never moved | 423 (26.4%) | 575 (35.9%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 23.45 | 21.79 | 3.84 | 2.88 | 41.3% | 50.5% |
| M | 14.40 | 15.70 | 1.37 | 0.93 | 35.0% | 53.0% |
| A | 13.99 | 12.10 | 3.38 | 2.51 | 51.6% | 65.5% |
| S | 11.14 | 10.72 | 1.43 | 1.90 | 43.0% | 59.3% |
| K | 10.95 | 9.47 | 0.78 | 0.59 | 100.0% | 100.0% |
| R | 9.48 | 9.55 | 1.67 | 1.20 | 37.3% | 49.8% |
| N | 8.14 | 8.05 | 1.44 | 1.51 | 13.2% | 27.3% |
| B | 5.93 | 5.35 | 1.30 | 0.83 | 30.2% | 41.7% |
| Q | 5.53 | 5.03 | 0.94 | 0.69 | 70.6% | 79.3% |
| L | 4.34 | 4.62 | 1.20 | 1.09 | 7.1% | 16.0% |
| G | 2.93 | 3.28 | 0.00 | 0.00 | 96.6% | 98.8% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 3.38 | 2.51 |
| beastChainMoves | 1.13 | 1.06 |
| beastChainCaptures | 1.43 | 1.90 |
| maesterSwaps | 6.38 | 8.35 |
| maesterLongSwaps | 0.76 | 0.77 |
| paladinSacrifices | 0.60 | 0.51 |
| promotions | 0.24 | 0.22 |
| checks | 3.89 | 3.48 |
| ogreShoves | 0.00 | 0.00 |
| ogreShovesFriend | 0.00 | 0.00 |
| ogreShovesGuard | 0.00 | 0.00 |
| catapultChecks | 0.00 | 0.00 |

The pooled columns describe each whole population; the difference column is the mean over the
40 shared arrangements of (rule − base) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
