# Rule A/B — pb-ab-O-shovefr-d4

`ogreShoveFriends=friends` against today's defaults.
1600 games per population, depth 4, the same 40 arrangements and the same
opening seeds in both (common random numbers). Control arm: `pb-ab-O-push-d4b.base`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the
mean paired difference over arrangements; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.509 | 0.508 | -0.001 ± 0.013 | no |
| decisive | 0.676 | 0.738 | +0.062 ± 0.021 | yes |
| draw rate | 0.306 | 0.247 | -0.059 ± 0.019 | yes |
| capped | 0.018 | 0.014 | -0.003 ± 0.006 | no |
| mean plies | 111.9 | 115.6 | +3.6 ± 1.6 | yes |
| branching factor | 30.9 | 30.6 | -0.3 ± 0.1 | yes |
| killer move | 0.221 | 0.229 | +0.008 ± 0.005 | yes |
| lead change | 0.042 | 0.042 | -0.001 ± 0.001 | no |
| uncertainty late | 0.625 | 0.623 | -0.002 ± 0.001 | yes |
| drama | 0.131 | 0.146 | +0.016 ± 0.007 | yes |
| permanence | 0.966 | 0.966 | -0.000 ± 0.000 | yes |
| min utilisation | 0.38 | 0.38 | -0.00 ± 0.00 | no |
| interest | 0.463 | 0.467 | +0.003 ± 0.002 | yes |
| interest (min-use) | 0.449 | 0.456 | +0.005 ± 0.005 | no |
| killerMove (resid.) | 0.003 | -0.003 | -0.006 ± 0.005 | yes |
| leadChange (resid.) | -0.001 | 0.001 | +0.003 ± 0.001 | yes |
| uncertaintyLate (resid.) | -0.003 | 0.003 | +0.007 ± 0.002 | yes |
| drama (resid.) | -0.001 | 0.001 | +0.002 ± 0.005 | no |
| permanence (resid.) | -0.001 | 0.001 | +0.001 ± 0.001 | yes |
| fairyUse (resid.) | 0.000 | 0.000 | +0.000 ± 0.000 | no |
| excessDecisiveness (resid.) | 0.045 | 0.002 | -0.052 ± 0.008 | yes |
| interest (resid.) | 0.003 | -0.000 | -0.004 ± 0.001 | yes |
| interestMinFairy (resid.) | 0.005 | 0.009 | +0.001 ± 0.005 | no |

## Degeneracy counters
| counter | base | with the rule |
|---|---|---|
| guard captures per game | 0.000 | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 36 (2.3%) | 50 (3.1%) |
| games where a king never moved | 456 (28.5%) | 428 (26.8%) |

## Per piece (both sides, whole population; moves and captures per game)
| piece | moves A | moves B | captures A | captures B | survival A | survival B |
|---|---|---|---|---|---|---|
| P | 21.17 | 21.68 | 3.57 | 3.64 | 38.0% | 36.3% |
| A | 15.96 | 16.26 | 3.73 | 3.77 | 53.9% | 52.3% |
| K | 14.35 | 15.55 | 1.16 | 1.28 | 100.0% | 100.0% |
| O | 11.35 | 11.56 | 0.97 | 1.05 | 65.3% | 60.8% |
| M | 9.76 | 9.93 | 0.97 | 1.00 | 36.4% | 34.6% |
| N | 8.31 | 8.43 | 1.50 | 1.52 | 14.6% | 13.9% |
| S | 7.60 | 7.81 | 1.18 | 1.21 | 49.2% | 48.0% |
| B | 6.43 | 6.50 | 1.32 | 1.34 | 28.5% | 26.9% |
| R | 6.40 | 6.75 | 1.35 | 1.40 | 30.4% | 28.9% |
| Q | 4.84 | 5.18 | 0.83 | 0.86 | 46.6% | 45.9% |
| G | 3.08 | 3.25 | 0.00 | 0.00 | 92.2% | 90.7% |
| L | 2.67 | 2.67 | 0.93 | 0.93 | 6.2% | 5.9% |

## Fairy events per game
| event | base | with the rule |
|---|---|---|
| archerShots | 3.73 | 3.77 |
| beastChainMoves | 0.93 | 0.95 |
| beastChainCaptures | 1.18 | 1.21 |
| maesterSwaps | 4.05 | 4.11 |
| maesterLongSwaps | 0.52 | 0.55 |
| paladinSacrifices | 0.49 | 0.49 |
| promotions | 0.11 | 0.13 |
| checks | 5.86 | 6.32 |
| ogreShoves | 2.58 | 2.37 |
| ogreShovesFriend | 2.36 | 2.37 |
| ogreShovesGuard | 0.02 | 0.02 |
| catapultChecks | 0.00 | 0.00 |

The pooled columns describe each whole population; the difference column is the mean over the
40 shared arrangements of (rule − base) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
