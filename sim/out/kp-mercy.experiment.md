# Rule A/B — kp-mercy

`kings=[object Object],[object Object]` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `kp-mercy.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.534 | 0.532 | -0.001 ± 0.030 | no |
| decisive | 0.721 | 0.775 | +0.054 ± 0.032 | yes |
| draw rate | 0.264 | 0.211 | -0.053 ± 0.033 | yes |
| capped | 0.014 | 0.014 | -0.001 ± 0.009 | no |
| mean plies | 121.3 | 108.9 | -12.4 ± 4.3 | yes |
| branching factor | 32.1 | 34.1 | +2.0 ± 0.3 | yes |
| killer move | 0.332 | 0.336 | +0.004 ± 0.017 | no |
| lead change | 0.068 | 0.071 | +0.003 ± 0.006 | no |
| uncertainty late | 0.648 | 0.646 | -0.002 ± 0.006 | no |
| drama | 0.138 | 0.142 | +0.004 ± 0.012 | no |
| permanence | 0.961 | 0.957 | -0.004 ± 0.001 | yes |
| min utilisation | 0.44 | 0.43 | -0.01 ± 0.01 | yes |
| interest | 0.484 | 0.484 | +0.000 ± 0.005 | no |
| interest (min-use) | 0.484 | 0.427 | -0.024 ± 0.014 | yes |
| killerMove (resid.) | 0.005 | -0.005 | -0.010 ± 0.015 | no |
| leadChange (resid.) | -0.003 | 0.003 | +0.005 ± 0.006 | no |
| uncertaintyLate (resid.) | -0.003 | 0.003 | +0.006 ± 0.004 | yes |
| drama (resid.) | 0.002 | -0.002 | -0.004 ± 0.010 | no |
| permanence (resid.) | 0.001 | -0.001 | -0.002 ± 0.002 | yes |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.039 | -0.022 | -0.047 ± 0.011 | yes |
| interest (resid.) | 0.004 | -0.003 | -0.006 ± 0.004 | yes |
| interestMinFairy (resid.) | 0.027 | -0.036 | -0.030 ± 0.013 | yes |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 30 (1.9%) | 16 (1.0%) |
| games where a king never moved | 259 (16.2%) | 264 (16.5%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 26.54 | 23.32 | 4.41 | 3.95 | 40.7% | 44.4% |
| M | 14.65 | 13.69 | 1.61 | 1.55 | 34.1% | 40.2% |
| A | 14.46 | 12.43 | 2.49 | 2.25 | 46.9% | 52.4% |
| K | 14.32 | 13.49 | 1.04 | 0.15 | 100.0% | 100.0% |
| R | 12.87 | 11.99 | 1.81 | 2.12 | 42.3% | 50.5% |
| S | 10.48 | 10.19 | 1.40 | 1.42 | 32.9% | 41.5% |
| B | 7.34 | 6.86 | 1.65 | 1.60 | 23.5% | 28.2% |
| N | 6.66 | 6.57 | 1.35 | 1.41 | 10.4% | 14.9% |
| Q | 5.93 | 4.65 | 0.99 | 0.94 | 76.3% | 82.0% |
| G | 4.98 | 2.80 | 0.00 | 0.00 | 96.7% | 87.2% |
| L | 3.05 | 2.94 | 0.85 | 0.94 | 6.2% | 5.8% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 2.49 | 2.25 |
| beastChainMoves | 1.08 | 1.10 |
| beastChainCaptures | 1.40 | 1.42 |
| maesterSwaps | 6.56 | 6.10 |
| maesterLongSwaps | 0.75 | 0.69 |
| paladinSacrifices | 0.39 | 0.39 |
| promotions | 0.32 | 0.21 |
| checks | 4.42 | 5.40 |
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
