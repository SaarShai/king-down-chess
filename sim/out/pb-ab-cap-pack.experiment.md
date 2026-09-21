# Rule A/B — pb-ab-cap-pack

`guardNoCapital=true capitalSanctuary=true guardCapitalStep=true pawnCapitalCapture=true` against today's defaults.
1600 games per population, depth 3, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-cap-pack.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.561 | 0.536 | -0.025 ± 0.027 | no |
| decisive | 0.792 | 0.815 | +0.023 ± 0.027 | no |
| draw rate | 0.198 | 0.169 | -0.029 ± 0.025 | yes |
| capped | 0.010 | 0.016 | +0.006 ± 0.007 | no |
| mean plies | 110.3 | 105.7 | -4.6 ± 5.3 | no |
| branching factor | 32.7 | 34.3 | +1.5 ± 0.5 | yes |
| killer move | 0.331 | 0.365 | +0.033 ± 0.018 | yes |
| lead change | 0.059 | 0.071 | +0.012 ± 0.006 | yes |
| uncertainty late | 0.631 | 0.633 | +0.002 ± 0.003 | no |
| drama | 0.145 | 0.153 | +0.008 ± 0.012 | no |
| permanence | 0.959 | 0.951 | -0.008 ± 0.002 | yes |
| min utilisation | 0.43 | 0.41 | -0.01 ± 0.01 | yes |
| interest | 0.483 | 0.489 | +0.005 ± 0.005 | yes |
| interest (min-use) | 0.483 | 0.489 | +0.007 ± 0.007 | no |
| killerMove (resid.) | -0.011 | 0.011 | +0.022 ± 0.014 | yes |
| leadChange (resid.) | -0.006 | 0.006 | +0.011 ± 0.006 | yes |
| uncertaintyLate (resid.) | -0.002 | 0.002 | +0.003 ± 0.003 | yes |
| drama (resid.) | -0.002 | 0.002 | +0.003 ± 0.012 | no |
| permanence (resid.) | 0.003 | -0.003 | -0.006 ± 0.002 | yes |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.015 | -0.005 | -0.030 ± 0.008 | yes |
| interest (resid.) | -0.001 | 0.001 | +0.001 ± 0.003 | no |
| interestMinFairy (resid.) | 0.010 | 0.013 | +0.004 ± 0.007 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 14 (0.9%) | 18 (1.1%) |
| games where a king never moved | 423 (26.4%) | 580 (36.3%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 23.45 | 21.90 | 3.84 | 3.01 | 41.3% | 50.1% |
| M | 14.40 | 15.89 | 1.37 | 0.97 | 35.0% | 53.7% |
| A | 13.99 | 12.15 | 3.38 | 2.49 | 51.6% | 64.9% |
| S | 11.14 | 10.55 | 1.43 | 1.84 | 43.0% | 59.8% |
| K | 10.95 | 9.79 | 0.78 | 0.57 | 100.0% | 100.0% |
| R | 9.48 | 9.59 | 1.67 | 1.22 | 37.3% | 49.6% |
| N | 8.14 | 8.17 | 1.44 | 1.49 | 13.2% | 27.4% |
| B | 5.93 | 5.25 | 1.30 | 0.83 | 30.2% | 42.1% |
| Q | 5.53 | 4.94 | 0.94 | 0.69 | 70.6% | 77.9% |
| L | 4.34 | 4.49 | 1.20 | 1.07 | 7.1% | 17.3% |
| G | 2.93 | 2.97 | 0.00 | 0.00 | 96.6% | 98.3% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 3.38 | 2.49 |
| beastChainMoves | 1.13 | 1.03 |
| beastChainCaptures | 1.43 | 1.84 |
| maesterSwaps | 6.38 | 8.37 |
| maesterLongSwaps | 0.76 | 0.77 |
| paladinSacrifices | 0.60 | 0.50 |
| promotions | 0.24 | 0.21 |
| checks | 3.89 | 3.58 |
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
