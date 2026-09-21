# Rule A/B — pb-ab-S-diagfwd-d4b

`beastCapture=diagForward` against today's defaults.
1600 games per population, depth 4, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-S-diagfwd-d4b.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.541 | 0.546 | +0.005 ± 0.020 | no |
| decisive | 0.756 | 0.769 | +0.013 ± 0.023 | no |
| draw rate | 0.227 | 0.218 | -0.009 ± 0.021 | no |
| capped | 0.017 | 0.013 | -0.004 ± 0.011 | no |
| mean plies | 116.3 | 111.5 | -4.8 ± 4.0 | yes |
| branching factor | 30.5 | 30.6 | +0.1 ± 0.2 | no |
| killer move | 0.223 | 0.212 | -0.010 ± 0.010 | yes |
| lead change | 0.039 | 0.038 | -0.000 ± 0.002 | no |
| uncertainty late | 0.617 | 0.616 | -0.000 ± 0.003 | no |
| drama | 0.145 | 0.144 | -0.001 ± 0.008 | no |
| permanence | 0.967 | 0.966 | -0.000 ± 0.001 | no |
| min utilisation | 0.38 | 0.39 | +0.01 ± 0.01 | yes |
| interest | 0.464 | 0.462 | -0.002 ± 0.003 | no |
| interest (min-use) | 0.464 | 0.458 | +0.001 ± 0.009 | no |
| killerMove (resid.) | 0.006 | -0.006 | -0.012 ± 0.011 | yes |
| leadChange (resid.) | -0.000 | 0.000 | +0.000 ± 0.002 | no |
| uncertaintyLate (resid.) | -0.000 | 0.000 | +0.001 ± 0.003 | no |
| drama (resid.) | 0.001 | -0.001 | -0.003 ± 0.007 | no |
| permanence (resid.) | 0.000 | -0.000 | -0.000 ± 0.001 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.011 | 0.001 | -0.008 ± 0.012 | no |
| interest (resid.) | 0.002 | -0.001 | -0.003 ± 0.003 | yes |
| interestMinFairy (resid.) | 0.019 | 0.011 | -0.000 ± 0.009 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 71 (4.4%) | 63 (3.9%) |
| games where a king never moved | 409 (25.6%) | 435 (27.2%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 22.22 | 21.72 | 3.59 | 3.63 | 34.7% | 36.2% |
| A | 18.51 | 18.01 | 4.30 | 4.26 | 51.1% | 51.5% |
| K | 15.81 | 14.69 | 1.20 | 1.24 | 100.0% | 100.0% |
| M | 13.89 | 13.10 | 1.46 | 1.50 | 36.2% | 37.1% |
| S | 10.32 | 8.81 | 1.21 | 0.53 | 46.2% | 51.1% |
| N | 8.66 | 8.78 | 1.55 | 1.61 | 14.4% | 15.1% |
| R | 8.25 | 8.22 | 1.67 | 1.78 | 29.5% | 32.5% |
| B | 6.44 | 6.38 | 1.52 | 1.51 | 24.8% | 26.1% |
| Q | 4.48 | 4.29 | 0.82 | 0.80 | 49.2% | 50.5% |
| L | 4.14 | 4.27 | 1.30 | 1.32 | 7.4% | 7.4% |
| G | 3.61 | 3.24 | 0.00 | 0.00 | 92.0% | 92.4% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 4.30 | 4.26 |
| beastChainMoves | 1.03 | 0.49 |
| beastChainCaptures | 1.21 | 0.53 |
| maesterSwaps | 5.50 | 5.22 |
| maesterLongSwaps | 0.85 | 0.76 |
| paladinSacrifices | 0.63 | 0.63 |
| promotions | 0.14 | 0.13 |
| checks | 6.66 | 6.09 |
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
