# Rule A/B — pb-ab-G-capstep

`guardCapitalStep=true` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-G-capstep.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.561 | 0.562 | +0.001 ± 0.001 | no |
| decisive | 0.792 | 0.794 | +0.002 ± 0.004 | no |
| draw rate | 0.198 | 0.196 | -0.002 ± 0.003 | no |
| capped | 0.010 | 0.010 | +0.000 ± 0.002 | no |
| mean plies | 110.3 | 110.2 | -0.1 ± 0.2 | no |
| branching factor | 32.7 | 32.7 | -0.0 ± 0.0 | no |
| killer move | 0.331 | 0.332 | +0.001 ± 0.002 | no |
| lead change | 0.059 | 0.059 | +0.000 ± 0.000 | no |
| uncertainty late | 0.631 | 0.631 | +0.000 ± 0.000 | no |
| drama | 0.145 | 0.145 | +0.001 ± 0.001 | no |
| permanence | 0.959 | 0.959 | -0.000 ± 0.000 | no |
| min utilisation | 0.43 | 0.43 | +0.00 ± 0.00 | no |
| interest | 0.483 | 0.484 | +0.000 ± 0.001 | no |
| interest (min-use) | 0.483 | 0.479 | -0.000 ± 0.001 | no |
| killerMove (resid.) | -0.000 | 0.000 | +0.000 ± 0.001 | no |
| leadChange (resid.) | -0.000 | 0.000 | +0.000 ± 0.000 | no |
| uncertaintyLate (resid.) | -0.000 | 0.000 | +0.000 ± 0.000 | yes |
| drama (resid.) | -0.000 | 0.000 | +0.000 ± 0.000 | no |
| permanence (resid.) | -0.000 | 0.000 | +0.000 ± 0.000 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.002 | -0.001 | -0.003 ± 0.002 | yes |
| interest (resid.) | 0.000 | -0.000 | -0.000 ± 0.000 | no |
| interestMinFairy (resid.) | 0.012 | 0.008 | -0.001 ± 0.001 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 14 (0.9%) | 13 (0.8%) |
| games where a king never moved | 423 (26.4%) | 423 (26.4%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 23.45 | 23.46 | 3.84 | 3.85 | 41.3% | 41.2% |
| M | 14.40 | 14.39 | 1.37 | 1.37 | 35.0% | 34.9% |
| A | 13.99 | 13.99 | 3.38 | 3.38 | 51.6% | 51.6% |
| S | 11.14 | 11.16 | 1.43 | 1.43 | 43.0% | 43.0% |
| K | 10.95 | 10.96 | 0.78 | 0.79 | 100.0% | 100.0% |
| R | 9.48 | 9.46 | 1.67 | 1.67 | 37.3% | 37.0% |
| N | 8.14 | 8.14 | 1.44 | 1.44 | 13.2% | 13.2% |
| B | 5.93 | 5.92 | 1.30 | 1.30 | 30.2% | 30.2% |
| Q | 5.53 | 5.51 | 0.94 | 0.94 | 70.6% | 70.5% |
| L | 4.34 | 4.33 | 1.20 | 1.20 | 7.1% | 7.2% |
| G | 2.93 | 2.87 | 0.00 | 0.00 | 96.6% | 96.6% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 3.38 | 3.38 |
| beastChainMoves | 1.13 | 1.13 |
| beastChainCaptures | 1.43 | 1.43 |
| maesterSwaps | 6.38 | 6.38 |
| maesterLongSwaps | 0.76 | 0.77 |
| paladinSacrifices | 0.60 | 0.60 |
| promotions | 0.24 | 0.24 |
| checks | 3.89 | 3.91 |
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
