# Rule A/B — pb-ab-O-push2-d4

`ogreMode=push` against today's defaults.
1600 games per population, depth 4, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-O-push2-d4.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.535 | 0.535 | +0.000 ± 0.000 | no |
| decisive | 0.761 | 0.761 | +0.000 ± 0.000 | no |
| draw rate | 0.226 | 0.226 | +0.000 ± 0.000 | no |
| capped | 0.014 | 0.014 | +0.000 ± 0.000 | no |
| mean plies | 110.5 | 110.5 | +0.0 ± 0.0 | no |
| branching factor | 30.9 | 30.9 | +0.0 ± 0.0 | no |
| killer move | 0.242 | 0.242 | +0.000 ± 0.000 | no |
| lead change | 0.040 | 0.040 | +0.000 ± 0.000 | no |
| uncertainty late | 0.616 | 0.616 | +0.000 ± 0.000 | no |
| drama | 0.154 | 0.154 | +0.000 ± 0.000 | no |
| permanence | 0.965 | 0.965 | +0.000 ± 0.000 | no |
| min utilisation | 0.39 | 0.39 | +0.00 ± 0.00 | no |
| interest | 0.468 | 0.468 | +0.000 ± 0.000 | no |
| interest (min-use) | 0.468 | 0.468 | +0.000 ± 0.000 | no |
| killerMove (resid.) | -0.000 | -0.000 | +0.000 ± 0.000 | no |
| leadChange (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| uncertaintyLate (resid.) | -0.000 | -0.000 | +0.000 ± 0.000 | no |
| drama (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| permanence (resid.) | -0.000 | -0.000 | +0.000 ± 0.000 | no |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | -0.006 | -0.006 | +0.000 ± 0.000 | no |
| interest (resid.) | -0.000 | -0.000 | +0.000 ± 0.000 | no |
| interestMinFairy (resid.) | 0.020 | 0.020 | +0.000 ± 0.000 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 61 (3.8%) | 61 (3.8%) |
| games where a king never moved | 455 (28.4%) | 455 (28.4%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 21.46 | 21.46 | 3.41 | 3.41 | 36.6% | 36.6% |
| A | 17.69 | 17.69 | 4.07 | 4.07 | 50.9% | 50.9% |
| K | 14.13 | 14.13 | 1.10 | 1.10 | 100.0% | 100.0% |
| M | 13.25 | 13.25 | 1.27 | 1.27 | 40.3% | 40.3% |
| S | 9.92 | 9.92 | 1.57 | 1.57 | 49.1% | 49.1% |
| N | 8.65 | 8.65 | 1.50 | 1.50 | 16.9% | 16.9% |
| R | 7.36 | 7.36 | 1.54 | 1.54 | 33.8% | 33.8% |
| B | 6.37 | 6.37 | 1.45 | 1.45 | 27.5% | 27.5% |
| Q | 4.41 | 4.41 | 0.80 | 0.80 | 49.4% | 49.4% |
| L | 3.95 | 3.95 | 1.27 | 1.27 | 6.4% | 6.4% |
| G | 3.32 | 3.32 | 0.00 | 0.00 | 93.4% | 93.4% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 4.07 | 4.07 |
| beastChainMoves | 1.21 | 1.21 |
| beastChainCaptures | 1.57 | 1.57 |
| maesterSwaps | 5.50 | 5.50 |
| maesterLongSwaps | 0.88 | 0.88 |
| paladinSacrifices | 0.65 | 0.65 |
| promotions | 0.12 | 0.12 |
| checks | 6.13 | 6.13 |
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
