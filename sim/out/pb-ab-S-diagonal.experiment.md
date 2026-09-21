# Rule A/B — pb-ab-S-diagonal

`beastCapture=diagonal` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-S-diagonal.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.561 | 0.533 | -0.028 ± 0.023 | yes |
| decisive | 0.792 | 0.814 | +0.022 ± 0.020 | yes |
| draw rate | 0.198 | 0.176 | -0.022 ± 0.019 | yes |
| capped | 0.010 | 0.010 | -0.000 ± 0.005 | no |
| mean plies | 110.3 | 112.6 | +2.3 ± 2.5 | no |
| branching factor | 32.7 | 32.4 | -0.3 ± 0.2 | yes |
| killer move | 0.331 | 0.337 | +0.005 ± 0.011 | no |
| lead change | 0.059 | 0.059 | +0.001 ± 0.003 | no |
| uncertainty late | 0.631 | 0.631 | -0.000 ± 0.002 | no |
| drama | 0.145 | 0.157 | +0.013 ± 0.009 | yes |
| permanence | 0.959 | 0.959 | -0.000 ± 0.001 | no |
| min utilisation | 0.43 | 0.42 | -0.01 ± 0.01 | no |
| interest | 0.483 | 0.485 | +0.002 ± 0.004 | no |
| interest (min-use) | 0.483 | 0.485 | +0.003 ± 0.006 | no |
| killerMove (resid.) | 0.001 | -0.001 | -0.001 ± 0.010 | no |
| leadChange (resid.) | -0.001 | 0.001 | +0.001 ± 0.003 | no |
| uncertaintyLate (resid.) | -0.001 | 0.001 | +0.002 ± 0.003 | no |
| drama (resid.) | -0.004 | 0.004 | +0.007 ± 0.008 | no |
| permanence (resid.) | -0.000 | 0.000 | +0.001 ± 0.001 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.011 | -0.019 | -0.022 ± 0.006 | yes |
| interest (resid.) | 0.000 | -0.001 | -0.001 ± 0.003 | no |
| interestMinFairy (resid.) | 0.012 | 0.011 | +0.000 ± 0.005 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 14 (0.9%) | 16 (1.0%) |
| games where a king never moved | 423 (26.4%) | 402 (25.1%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 23.45 | 23.74 | 3.84 | 3.94 | 41.3% | 40.4% |
| M | 14.40 | 14.34 | 1.37 | 1.48 | 35.0% | 33.8% |
| A | 13.99 | 14.64 | 3.38 | 3.55 | 51.6% | 52.6% |
| S | 11.14 | 11.06 | 1.43 | 0.91 | 43.0% | 40.1% |
| K | 10.95 | 11.59 | 0.78 | 0.89 | 100.0% | 100.0% |
| R | 9.48 | 9.66 | 1.67 | 1.80 | 37.3% | 35.8% |
| N | 8.14 | 8.15 | 1.44 | 1.45 | 13.2% | 12.5% |
| B | 5.93 | 6.18 | 1.30 | 1.34 | 30.2% | 29.3% |
| Q | 5.53 | 5.50 | 0.94 | 0.97 | 70.6% | 75.4% |
| L | 4.34 | 4.61 | 1.20 | 1.24 | 7.1% | 7.0% |
| G | 2.93 | 3.10 | 0.00 | 0.00 | 96.6% | 96.5% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 3.38 | 3.55 |
| beastChainMoves | 1.13 | 0.80 |
| beastChainCaptures | 1.43 | 0.91 |
| maesterSwaps | 6.38 | 6.24 |
| maesterLongSwaps | 0.76 | 0.74 |
| paladinSacrifices | 0.60 | 0.60 |
| promotions | 0.24 | 0.27 |
| checks | 3.89 | 4.06 |
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
