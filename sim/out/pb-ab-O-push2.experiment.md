# Rule A/B — pb-ab-O-push2

`ogreMode=push` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-O-push2.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.542 | 0.543 | +0.001 ± 0.029 | no |
| decisive | 0.773 | 0.794 | +0.021 ± 0.029 | no |
| draw rate | 0.219 | 0.198 | -0.021 ± 0.029 | no |
| capped | 0.008 | 0.007 | -0.001 ± 0.007 | no |
| mean plies | 113.1 | 111.7 | -1.4 ± 3.2 | no |
| branching factor | 31.8 | 32.2 | +0.4 ± 0.2 | yes |
| killer move | 0.334 | 0.342 | +0.007 ± 0.017 | no |
| lead change | 0.066 | 0.065 | -0.001 ± 0.004 | no |
| uncertainty late | 0.636 | 0.638 | +0.002 ± 0.003 | no |
| drama | 0.157 | 0.161 | +0.004 ± 0.011 | no |
| permanence | 0.959 | 0.959 | -0.000 ± 0.001 | no |
| min utilisation | 0.40 | 0.40 | +0.00 ± 0.01 | no |
| interest | 0.486 | 0.487 | +0.002 ± 0.006 | no |
| interest (min-use) | 0.447 | 0.474 | +0.007 ± 0.010 | no |
| killerMove (resid.) | -0.001 | 0.001 | +0.002 ± 0.014 | no |
| leadChange (resid.) | -0.000 | 0.000 | +0.000 ± 0.004 | no |
| uncertaintyLate (resid.) | -0.002 | 0.002 | +0.005 ± 0.004 | yes |
| drama (resid.) | 0.001 | -0.001 | -0.001 ± 0.009 | no |
| permanence (resid.) | -0.000 | 0.000 | +0.000 ± 0.001 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.021 | -0.009 | -0.020 ± 0.011 | yes |
| interest (resid.) | 0.001 | -0.000 | -0.000 ± 0.004 | no |
| interestMinFairy (resid.) | -0.016 | 0.006 | +0.003 ± 0.007 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 13 (0.8%) | 24 (1.5%) |
| games where a king never moved | 331 (20.7%) | 351 (21.9%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 22.61 | 22.36 | 3.79 | 3.88 | 40.6% | 40.2% |
| A | 14.87 | 14.86 | 3.62 | 3.53 | 50.4% | 49.3% |
| O | 13.69 | 11.46 | 0.90 | 1.25 | 65.4% | 49.4% |
| K | 11.48 | 11.60 | 0.89 | 0.85 | 100.0% | 100.0% |
| M | 10.47 | 10.04 | 1.06 | 1.02 | 30.8% | 31.8% |
| N | 8.48 | 7.97 | 1.51 | 1.43 | 12.8% | 12.8% |
| S | 7.97 | 7.97 | 0.99 | 0.94 | 43.0% | 43.7% |
| R | 6.38 | 7.32 | 1.29 | 1.39 | 30.1% | 32.0% |
| B | 6.10 | 6.52 | 1.29 | 1.39 | 26.6% | 27.7% |
| Q | 5.37 | 5.35 | 1.02 | 0.95 | 72.7% | 74.8% |
| L | 3.04 | 3.17 | 0.82 | 0.87 | 6.1% | 7.9% |
| G | 2.70 | 3.09 | 0.00 | 0.00 | 96.6% | 97.4% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 3.62 | 3.53 |
| beastChainMoves | 0.80 | 0.77 |
| beastChainCaptures | 0.99 | 0.94 |
| maesterSwaps | 4.72 | 4.47 |
| maesterLongSwaps | 0.46 | 0.49 |
| paladinSacrifices | 0.44 | 0.44 |
| promotions | 0.26 | 0.29 |
| checks | 3.92 | 4.05 |
| ogreShoves | 3.01 | 3.62 |
| ogreShovesFriend | 2.83 | 3.59 |
| ogreShovesGuard | 0.02 | 0.04 |
| catapultChecks | 0.00 | 0.00 |

The pooled columns describe each whole population; the difference column is the mean over the
40 shared arrangements of (rule − base) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
