# Sim report — arr-final-d4

2000 games. White score **0.544** (95% 0.526–0.563),
white advantage **+31 ± 13 Elo**.
Decisive 73.2% · draws 25.0% · capped 1.8% (counted apart, never as draws).
Plies: mean 113.7 ± 58.1, median 107. Rules: all defaults.

No complete colour-swapped pairs in this run.
σ_pg 0.4253 · normalized Elo +36 · LOS 100.0% ·
SPRT LLR 2.24 against ±2.94 (nElo 0 vs 4) → **continue**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 2000 | 820 | 537 | 643 | 0.544 | 0.526–0.563 | +31 ±13 | 73.2% | 25.0% | 1.8% | 113.7±58.1 | 0.24 | 0.054 | 0.635 | 0.13 | 0.96 | 0.43 | 1.40 | -0.000 | 0.465 | 0.452 | balance |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | M | S | N | B | K | P | G | Q | R | L |
|---|---|---|---|---|---|---|---|---|---|---|
| use | 1.89 | 1.66 | 1.18 | 1.12 | 2.18 | 0.43 | 1.10 | 2.01 | 1.15 | 0.93 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 1463 | 73.2% |
| adjudicatedDraw | 362 | 18.1% |
| drawRepetition | 72 | 3.6% |
| drawMaterial | 39 | 1.9% |
| plyCap | 37 | 1.8% |
| draw50 | 27 | 1.4% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| P | 49384 | 8408 | 18523 | 32000 | 13206 | 41.3% |
| S | 37812 | 7136 | 3345 | 6400 | 3055 | 47.7% |
| M | 37568 | 3538 | 3423 | 5600 | 2177 | 38.9% |
| K | 30948 | 2918 | 0 | 4000 | 4000 | 100.0% |
| B | 19074 | 4486 | 3571 | 4800 | 1233 | 25.7% |
| Q | 17135 | 3153 | 1566 | 2400 | 1096 | 45.7% |
| N | 16835 | 3453 | 3486 | 4000 | 518 | 13.0% |
| G | 9408 | 0 | 192 | 2400 | 2208 | 92.0% |
| R | 6520 | 1373 | 1023 | 1600 | 578 | 36.1% |
| L | 2649 | 880 | 216 | 800 | 57 | 7.1% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 0 | 0.00 |
| beastChainMoves | 5440 | 2.72 |
| beastChainCaptures | 7136 | 3.57 |
| maesterSwaps | 17258 | 8.63 |
| maesterLongSwaps | 2613 | 1.31 |
| paladinSacrifices | 527 | 0.26 |
| promotions | 271 | 0.14 |
| checks | 12200 | 6.10 |
| ogreShoves | 0 | 0.00 |
| ogreShovesFriend | 0 | 0.00 |
| ogreShovesGuard | 0 | 0.00 |
| catapultChecks | 0 | 0.00 |

## Degeneracy counters
| counter | value |
|---|---|
| guard captures per game | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 66 (3.3%) |
| games where a king never moved | 465 (23.3%) |

## Interest terms, residualised on draw rate
Each term minus what this run's `term ~ a + b·drawRate` line predicts from the arrangement's draw
rate. The mean over the arrangements is 0 by construction, so read differences between pools, never
levels. Overall row, fitted on the 5 arrangements:
| killerMove | leadChange | uncertaintyLate | drama | permanence | fairyUse | excessDecisiveness | interest | interestMinFairy |
|---|---|---|---|---|---|---|---|---|
| -0.000 | 0.000 | -0.000 | 0.000 | -0.000 | 0.000 | -0.000 | -0.000 | -0.009 |

## Balance axis — back ranks by |white score − 0.5| (ascending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| KGBMSSMB | 400 | 143 | 135 | 122 | 0.526 | 0.486–0.566 | +18 ±28 | 66.3% | 30.0% | 3.8% | 121.3±68.4 | 0.25 | 0.070 | 0.644 | 0.12 | 0.96 | 0.41 | 1.61 | 0.008 | 0.464 | 0.464 | - |
| NKBBMGQS | 400 | 154 | 119 | 127 | 0.534 | 0.493–0.575 | +23 ±28 | 70.3% | 28.2% | 1.5% | 115.1±55.2 | 0.23 | 0.048 | 0.643 | 0.12 | 0.97 | 0.45 | 1.57 | 0.016 | 0.464 | 0.442 | balance |
| QNKMNRSG | 400 | 151 | 132 | 117 | 0.542 | 0.503–0.582 | +30 ±28 | 67.0% | 30.8% | 2.3% | 116.1±60.0 | 0.23 | 0.055 | 0.646 | 0.12 | 0.97 | 0.43 | 1.50 | -0.054 | 0.460 | 0.460 | balance |
| MMSSNBNK | 400 | 183 | 77 | 140 | 0.554 | 0.510–0.597 | +37 ±30 | 80.8% | 18.5% | 0.8% | 112.5±51.0 | 0.26 | 0.055 | 0.634 | 0.14 | 0.96 | 0.46 | 1.70 | 0.035 | 0.473 | 0.473 | balance |
| SQBKRSML | 400 | 189 | 74 | 137 | 0.565 | 0.521–0.609 | +45 ±30 | 81.5% | 17.5% | 1.0% | 103.4±53.0 | 0.25 | 0.044 | 0.610 | 0.12 | 0.96 | 0.43 | 1.62 | -0.005 | 0.465 | 0.465 | balance |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| MMSSNBNK | 400 | 183 | 77 | 140 | 0.554 | 0.510–0.597 | +37 ±30 | 80.8% | 18.5% | 0.8% | 112.5±51.0 | 0.26 | 0.055 | 0.634 | 0.14 | 0.96 | 0.46 | 1.70 | 0.035 | 0.473 | 0.473 | balance |
| SQBKRSML | 400 | 189 | 74 | 137 | 0.565 | 0.521–0.609 | +45 ±30 | 81.5% | 17.5% | 1.0% | 103.4±53.0 | 0.25 | 0.044 | 0.610 | 0.12 | 0.96 | 0.43 | 1.62 | -0.005 | 0.465 | 0.465 | balance |
| KGBMSSMB | 400 | 143 | 135 | 122 | 0.526 | 0.486–0.566 | +18 ±28 | 66.3% | 30.0% | 3.8% | 121.3±68.4 | 0.25 | 0.070 | 0.644 | 0.12 | 0.96 | 0.41 | 1.61 | 0.008 | 0.464 | 0.464 | - |
| NKBBMGQS | 400 | 154 | 119 | 127 | 0.534 | 0.493–0.575 | +23 ±28 | 70.3% | 28.2% | 1.5% | 115.1±55.2 | 0.23 | 0.048 | 0.643 | 0.12 | 0.97 | 0.45 | 1.57 | 0.016 | 0.464 | 0.442 | balance |
| QNKMNRSG | 400 | 151 | 132 | 117 | 0.542 | 0.503–0.582 | +30 ±28 | 67.0% | 30.8% | 2.3% | 116.1±60.0 | 0.23 | 0.055 | 0.646 | 0.12 | 0.97 | 0.43 | 1.50 | -0.054 | 0.460 | 0.460 | balance |

---
**Two axes, reported apart.** Balance = |white score − 0.5|; interest = the Browne-fitted sum below.
Never merge them: the research shows the two objectives fight (variant-balance.md §7).

interest = +0.2·killerMove −0.16·leadChange +0.13·uncertaintyLate +0.12·drama +0.07·permanence +0.2·fairyUse +0.12·excessDecisiveness
— Browne's fitted signs (docs/research/variant-balance.md §7). **Lead change is negative**: churn
reads as chaos, not tension. "xDec" = decisiveness minus what |white score − 0.5| predicts for it,
fitted over the configurations of this run; raw decisiveness is never a reward term, because
corr(draw rate, white points) = −0.92 in Chess960.
"gates" lists failed viability gates (balance 0.03, timeouts 0.05, duration 0.5, utilisation 0.25, draw-rate worst decile); a gated
arrangement is rejected, not scored down.
"killer", "unc", "drama", "perm" use the squashed lead L = 2·σ(cp/350) − 1 (variant-balance.md §3.0).
"capped" games hit the ply cap: their own class, never counted as draws (cutechess counts them as draws).
Survival counts pieces on the board at the end, so a promotion target can exceed 100%.
Statistics follow docs/research/sim-methodology.md §2.
