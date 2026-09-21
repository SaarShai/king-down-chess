# Rule A/B — pb-ab-S-diagonal-d4b

`beastCapture=diagonal` against today's defaults.
1600 games per population, depth 4, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-S-diagonal-d4b.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.541 | 0.536 | -0.005 ± 0.020 | no |
| decisive | 0.756 | 0.757 | +0.001 ± 0.022 | no |
| draw rate | 0.227 | 0.229 | +0.002 ± 0.024 | no |
| capped | 0.017 | 0.014 | -0.002 ± 0.010 | no |
| mean plies | 116.3 | 114.8 | -1.6 ± 3.5 | no |
| branching factor | 30.5 | 30.5 | +0.0 ± 0.2 | no |
| killer move | 0.223 | 0.219 | -0.004 ± 0.007 | no |
| lead change | 0.039 | 0.039 | -0.000 ± 0.002 | no |
| uncertainty late | 0.617 | 0.616 | -0.000 ± 0.002 | no |
| drama | 0.145 | 0.146 | +0.001 ± 0.009 | no |
| permanence | 0.967 | 0.967 | -0.000 ± 0.001 | no |
| min utilisation | 0.38 | 0.39 | +0.01 ± 0.01 | no |
| interest | 0.464 | 0.463 | -0.001 ± 0.003 | no |
| interest (min-use) | 0.464 | 0.456 | +0.003 ± 0.008 | no |
| killerMove (resid.) | 0.002 | -0.002 | -0.004 ± 0.008 | no |
| leadChange (resid.) | 0.000 | -0.000 | -0.000 ± 0.002 | no |
| uncertaintyLate (resid.) | 0.000 | -0.000 | -0.000 ± 0.003 | no |
| drama (resid.) | -0.001 | 0.001 | +0.002 ± 0.008 | no |
| permanence (resid.) | 0.000 | -0.000 | -0.000 ± 0.001 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.006 | 0.006 | +0.002 ± 0.011 | no |
| interest (resid.) | 0.001 | 0.000 | -0.000 ± 0.002 | no |
| interestMinFairy (resid.) | 0.017 | 0.009 | +0.003 ± 0.007 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 71 (4.4%) | 60 (3.8%) |
| games where a king never moved | 409 (25.6%) | 415 (25.9%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 22.22 | 22.12 | 3.59 | 3.65 | 34.7% | 34.9% |
| A | 18.51 | 18.69 | 4.30 | 4.34 | 51.1% | 51.1% |
| K | 15.81 | 15.65 | 1.20 | 1.29 | 100.0% | 100.0% |
| M | 13.89 | 13.44 | 1.46 | 1.50 | 36.2% | 35.6% |
| S | 10.32 | 9.47 | 1.21 | 0.74 | 46.2% | 47.9% |
| N | 8.66 | 8.66 | 1.55 | 1.58 | 14.4% | 14.1% |
| R | 8.25 | 8.17 | 1.67 | 1.70 | 29.5% | 31.7% |
| B | 6.44 | 6.28 | 1.52 | 1.53 | 24.8% | 25.7% |
| Q | 4.48 | 4.77 | 0.82 | 0.85 | 49.2% | 52.1% |
| L | 4.14 | 4.25 | 1.30 | 1.33 | 7.4% | 6.8% |
| G | 3.61 | 3.29 | 0.00 | 0.00 | 92.0% | 90.5% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 4.30 | 4.34 |
| beastChainMoves | 1.03 | 0.68 |
| beastChainCaptures | 1.21 | 0.74 |
| maesterSwaps | 5.50 | 5.28 |
| maesterLongSwaps | 0.85 | 0.78 |
| paladinSacrifices | 0.63 | 0.64 |
| promotions | 0.14 | 0.15 |
| checks | 6.66 | 6.73 |
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
