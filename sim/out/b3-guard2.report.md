# Sim report — b3-guard2

2000 games. White score **0.515** (95% 0.502–0.528),
white advantage **+10 ± 9 Elo**.
Decisive 37.0% · draws 46.9% · capped 16.1% (counted apart, never as draws).
Plies: mean 162.5 ± 88.7, median 142. Rules: all defaults.

No complete colour-swapped pairs in this run.
σ_pg 0.3038 · normalized Elo +17 · LOS 98.6% ·
SPRT LLR 1.00 against ±2.94 (nElo 0 vs 4) → **continue**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 2000 | 400 | 1260 | 340 | 0.515 | 0.502–0.528 | +10 ±9 | 37.0% | 46.9% | 16.1% | 162.5±88.7 | 0.25 | 0.028 | 0.652 | 0.07 | 0.98 | 0.29 | 1.97 | 0.011 | 0.468 | 0.468 | timeouts |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | R | B | K | G | Q | M | P |
|---|---|---|---|---|---|---|---|
| use | 1.46 | 1.35 | 2.02 | 2.09 | 1.36 | 1.85 | 0.29 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedDraw | 769 | 38.5% |
| adjudicatedResign | 740 | 37.0% |
| plyCap | 322 | 16.1% |
| drawRepetition | 72 | 3.6% |
| draw50 | 58 | 2.9% |
| drawMaterial | 39 | 1.9% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| G | 84969 | 5181 | 592 | 8000 | 7418 | 92.7% |
| R | 59316 | 7524 | 5073 | 8000 | 2927 | 36.6% |
| P | 46915 | 8075 | 21285 | 32000 | 10403 | 32.5% |
| K | 41072 | 2569 | 0 | 4000 | 4000 | 100.0% |
| M | 37590 | 3151 | 2588 | 4000 | 1412 | 35.3% |
| Q | 27610 | 5037 | 3370 | 4000 | 928 | 23.2% |
| B | 27440 | 4265 | 2891 | 4000 | 1109 | 27.7% |
| L | 5 | 0 | 0 | 0 | 1 | 0.0% |
| N | 0 | 0 | 1 | 0 | 0 | 0.0% |
| A | 0 | 0 | 1 | 0 | 0 | 0.0% |
| S | 0 | 0 | 1 | 0 | 0 | 0.0% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 0 | 0.00 |
| beastChainMoves | 0 | 0.00 |
| beastChainCaptures | 0 | 0.00 |
| maesterSwaps | 15074 | 7.54 |
| maesterLongSwaps | 2396 | 1.20 |
| paladinSacrifices | 0 | 0.00 |
| promotions | 312 | 0.16 |
| checks | 15685 | 7.84 |

## Degeneracy counters
| counter | value |
|---|---|
| guard captures per game | 2.591 |
| games with a guard rampage (≥ 3 captures) | 2 (0.1%) |
| dead-material endings (draw50 + drawMaterial) | 97 (4.9%) |
| games where a king never moved | 402 (20.1%) |

## Interest terms, residualised on draw rate
Each term minus what this run's `term ~ a + b·drawRate` line predicts from the arrangement's draw
rate. The mean over the arrangements is 0 by construction, so read differences between pools, never
levels. Overall row, fitted on the 20 arrangements:
| killerMove | leadChange | uncertaintyLate | drama | permanence | fairyUse | excessDecisiveness | interest | interestMinFairy |
|---|---|---|---|---|---|---|---|---|
| 0.000 | 0.000 | -0.000 | -0.000 | -0.000 | 0.000 | 0.011 | 0.001 | 0.001 |

## Balance axis — back ranks by |white score − 0.5| (ascending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| QRMGGRBK | 100 | 19 | 62 | 19 | 0.500 | 0.440–0.560 | +0 ±42 | 38.0% | 42.0% | 20.0% | 174.6±88.8 | 0.26 | 0.021 | 0.638 | 0.06 | 0.98 | 0.26 | 1.95 | 0.036 | 0.470 | 0.470 | timeouts |
| GRRMBQKG | 100 | 17 | 65 | 18 | 0.495 | 0.437–0.553 | -3 ±40 | 35.0% | 47.0% | 18.0% | 180.1±83.0 | 0.27 | 0.022 | 0.646 | 0.07 | 0.98 | 0.29 | 2.05 | 0.001 | 0.471 | 0.471 | timeouts |
| BKRRGGQM | 100 | 20 | 59 | 21 | 0.495 | 0.432–0.558 | -3 ±44 | 41.0% | 46.0% | 13.0% | 151.0±86.3 | 0.25 | 0.033 | 0.654 | 0.07 | 0.98 | 0.31 | 2.06 | 0.061 | 0.470 | 0.470 | timeouts |
| RQGRGMKB | 100 | 15 | 69 | 16 | 0.495 | 0.440–0.550 | -3 ±38 | 31.0% | 52.0% | 17.0% | 157.3±90.6 | 0.24 | 0.028 | 0.665 | 0.05 | 0.98 | 0.28 | 2.00 | -0.039 | 0.462 | 0.462 | timeouts |
| KMGRBQRG | 100 | 12 | 74 | 14 | 0.490 | 0.440–0.540 | -7 ±35 | 26.0% | 54.0% | 20.0% | 178.0±89.9 | 0.23 | 0.026 | 0.666 | 0.06 | 0.98 | 0.28 | 2.00 | -0.094 | 0.459 | 0.459 | timeouts |
| GGRMRBKQ | 100 | 17 | 64 | 19 | 0.490 | 0.431–0.549 | -7 ±41 | 36.0% | 55.0% | 9.0% | 142.2±78.9 | 0.23 | 0.033 | 0.659 | 0.07 | 0.98 | 0.33 | 2.01 | 0.006 | 0.463 | 0.463 | timeouts,drawRate |
| QMRRKGBG | 100 | 19 | 65 | 16 | 0.515 | 0.457–0.573 | +10 ±40 | 35.0% | 44.0% | 21.0% | 169.9±91.0 | 0.29 | 0.030 | 0.647 | 0.07 | 0.98 | 0.28 | 2.11 | -0.009 | 0.472 | 0.472 | timeouts |
| RKQBGMGR | 100 | 18 | 61 | 21 | 0.485 | 0.424–0.546 | -10 ±42 | 39.0% | 42.0% | 19.0% | 169.5±95.7 | 0.24 | 0.030 | 0.653 | 0.07 | 0.98 | 0.27 | 1.95 | 0.031 | 0.468 | 0.468 | timeouts |
| MQGRKGRB | 100 | 21 | 61 | 18 | 0.515 | 0.454–0.576 | +10 ±42 | 39.0% | 40.0% | 21.0% | 178.4±94.9 | 0.25 | 0.033 | 0.634 | 0.07 | 0.98 | 0.27 | 1.99 | 0.031 | 0.465 | 0.465 | timeouts |
| KRRBGGMQ | 100 | 21 | 61 | 18 | 0.515 | 0.454–0.576 | +10 ±42 | 39.0% | 51.0% | 10.0% | 150.7±83.6 | 0.26 | 0.034 | 0.661 | 0.08 | 0.98 | 0.32 | 1.76 | 0.031 | 0.472 | 0.472 | timeouts |
| RGBGRMKQ | 100 | 23 | 58 | 19 | 0.520 | 0.457–0.583 | +14 ±44 | 42.0% | 47.0% | 11.0% | 150.8±84.1 | 0.25 | 0.029 | 0.655 | 0.09 | 0.98 | 0.29 | 2.02 | 0.055 | 0.472 | 0.472 | timeouts |
| QRGRGMBK | 100 | 21 | 62 | 17 | 0.520 | 0.460–0.580 | +14 ±42 | 38.0% | 40.0% | 22.0% | 170.7±94.0 | 0.27 | 0.023 | 0.641 | 0.07 | 0.98 | 0.27 | 1.95 | 0.015 | 0.470 | 0.470 | timeouts |
| RBKGGQMR | 100 | 16 | 63 | 21 | 0.475 | 0.416–0.534 | -17 ±41 | 37.0% | 49.0% | 14.0% | 163.0±84.6 | 0.25 | 0.026 | 0.667 | 0.06 | 0.98 | 0.29 | 2.01 | 0.000 | 0.468 | 0.468 | timeouts |
| KBRMGQGR | 100 | 15 | 65 | 20 | 0.475 | 0.417–0.533 | -17 ±40 | 35.0% | 54.0% | 11.0% | 156.0±83.8 | 0.23 | 0.028 | 0.659 | 0.07 | 0.98 | 0.29 | 1.99 | -0.020 | 0.463 | 0.463 | timeouts |
| RKQGRMGB | 100 | 16 | 74 | 10 | 0.530 | 0.480–0.580 | +21 ±34 | 26.0% | 52.0% | 22.0% | 167.9±90.5 | 0.20 | 0.024 | 0.652 | 0.04 | 0.98 | 0.27 | 2.01 | -0.115 | 0.447 | 0.447 | balance,timeouts |
| KRQMGGBR | 100 | 22 | 63 | 15 | 0.535 | 0.476–0.594 | +24 ±41 | 37.0% | 50.0% | 13.0% | 156.7±88.6 | 0.27 | 0.032 | 0.641 | 0.06 | 0.98 | 0.29 | 1.86 | -0.011 | 0.468 | 0.468 | balance,timeouts |
| RMGQBGKR | 100 | 22 | 67 | 11 | 0.555 | 0.500–0.610 | +38 ±38 | 33.0% | 50.0% | 17.0% | 157.3±91.1 | 0.22 | 0.031 | 0.660 | 0.05 | 0.98 | 0.30 | 1.95 | -0.072 | 0.455 | 0.455 | balance,timeouts |
| MRQGGBRK | 100 | 26 | 59 | 15 | 0.555 | 0.493–0.617 | +38 ±43 | 41.0% | 46.0% | 13.0% | 158.5±84.4 | 0.24 | 0.031 | 0.656 | 0.07 | 0.98 | 0.28 | 1.90 | 0.008 | 0.467 | 0.467 | balance,timeouts |
| RBQMRKGG | 100 | 33 | 48 | 19 | 0.570 | 0.501–0.639 | +49 ±48 | 52.0% | 32.0% | 16.0% | 157.7±84.8 | 0.29 | 0.030 | 0.636 | 0.08 | 0.98 | 0.32 | 1.85 | 0.102 | 0.479 | 0.479 | balance,timeouts |
| GKGQRRBM | 100 | 27 | 60 | 13 | 0.570 | 0.510–0.630 | +49 ±42 | 40.0% | 45.0% | 15.0% | 159.0±90.2 | 0.30 | 0.023 | 0.643 | 0.08 | 0.98 | 0.30 | 1.99 | -0.018 | 0.477 | 0.477 | balance,timeouts |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| RBQMRKGG | 100 | 33 | 48 | 19 | 0.570 | 0.501–0.639 | +49 ±48 | 52.0% | 32.0% | 16.0% | 157.7±84.8 | 0.29 | 0.030 | 0.636 | 0.08 | 0.98 | 0.32 | 1.85 | 0.102 | 0.479 | 0.479 | balance,timeouts |
| GKGQRRBM | 100 | 27 | 60 | 13 | 0.570 | 0.510–0.630 | +49 ±42 | 40.0% | 45.0% | 15.0% | 159.0±90.2 | 0.30 | 0.023 | 0.643 | 0.08 | 0.98 | 0.30 | 1.99 | -0.018 | 0.477 | 0.477 | balance,timeouts |
| RGBGRMKQ | 100 | 23 | 58 | 19 | 0.520 | 0.457–0.583 | +14 ±44 | 42.0% | 47.0% | 11.0% | 150.8±84.1 | 0.25 | 0.029 | 0.655 | 0.09 | 0.98 | 0.29 | 2.02 | 0.055 | 0.472 | 0.472 | timeouts |
| QMRRKGBG | 100 | 19 | 65 | 16 | 0.515 | 0.457–0.573 | +10 ±40 | 35.0% | 44.0% | 21.0% | 169.9±91.0 | 0.29 | 0.030 | 0.647 | 0.07 | 0.98 | 0.28 | 2.11 | -0.009 | 0.472 | 0.472 | timeouts |
| KRRBGGMQ | 100 | 21 | 61 | 18 | 0.515 | 0.454–0.576 | +10 ±42 | 39.0% | 51.0% | 10.0% | 150.7±83.6 | 0.26 | 0.034 | 0.661 | 0.08 | 0.98 | 0.32 | 1.76 | 0.031 | 0.472 | 0.472 | timeouts |
| GRRMBQKG | 100 | 17 | 65 | 18 | 0.495 | 0.437–0.553 | -3 ±40 | 35.0% | 47.0% | 18.0% | 180.1±83.0 | 0.27 | 0.022 | 0.646 | 0.07 | 0.98 | 0.29 | 2.05 | 0.001 | 0.471 | 0.471 | timeouts |
| QRGRGMBK | 100 | 21 | 62 | 17 | 0.520 | 0.460–0.580 | +14 ±42 | 38.0% | 40.0% | 22.0% | 170.7±94.0 | 0.27 | 0.023 | 0.641 | 0.07 | 0.98 | 0.27 | 1.95 | 0.015 | 0.470 | 0.470 | timeouts |
| BKRRGGQM | 100 | 20 | 59 | 21 | 0.495 | 0.432–0.558 | -3 ±44 | 41.0% | 46.0% | 13.0% | 151.0±86.3 | 0.25 | 0.033 | 0.654 | 0.07 | 0.98 | 0.31 | 2.06 | 0.061 | 0.470 | 0.470 | timeouts |
| QRMGGRBK | 100 | 19 | 62 | 19 | 0.500 | 0.440–0.560 | +0 ±42 | 38.0% | 42.0% | 20.0% | 174.6±88.8 | 0.26 | 0.021 | 0.638 | 0.06 | 0.98 | 0.26 | 1.95 | 0.036 | 0.470 | 0.470 | timeouts |
| RBKGGQMR | 100 | 16 | 63 | 21 | 0.475 | 0.416–0.534 | -17 ±41 | 37.0% | 49.0% | 14.0% | 163.0±84.6 | 0.25 | 0.026 | 0.667 | 0.06 | 0.98 | 0.29 | 2.01 | 0.000 | 0.468 | 0.468 | timeouts |
| RKQBGMGR | 100 | 18 | 61 | 21 | 0.485 | 0.424–0.546 | -10 ±42 | 39.0% | 42.0% | 19.0% | 169.5±95.7 | 0.24 | 0.030 | 0.653 | 0.07 | 0.98 | 0.27 | 1.95 | 0.031 | 0.468 | 0.468 | timeouts |
| KRQMGGBR | 100 | 22 | 63 | 15 | 0.535 | 0.476–0.594 | +24 ±41 | 37.0% | 50.0% | 13.0% | 156.7±88.6 | 0.27 | 0.032 | 0.641 | 0.06 | 0.98 | 0.29 | 1.86 | -0.011 | 0.468 | 0.468 | balance,timeouts |
| MRQGGBRK | 100 | 26 | 59 | 15 | 0.555 | 0.493–0.617 | +38 ±43 | 41.0% | 46.0% | 13.0% | 158.5±84.4 | 0.24 | 0.031 | 0.656 | 0.07 | 0.98 | 0.28 | 1.90 | 0.008 | 0.467 | 0.467 | balance,timeouts |
| MQGRKGRB | 100 | 21 | 61 | 18 | 0.515 | 0.454–0.576 | +10 ±42 | 39.0% | 40.0% | 21.0% | 178.4±94.9 | 0.25 | 0.033 | 0.634 | 0.07 | 0.98 | 0.27 | 1.99 | 0.031 | 0.465 | 0.465 | timeouts |
| GGRMRBKQ | 100 | 17 | 64 | 19 | 0.490 | 0.431–0.549 | -7 ±41 | 36.0% | 55.0% | 9.0% | 142.2±78.9 | 0.23 | 0.033 | 0.659 | 0.07 | 0.98 | 0.33 | 2.01 | 0.006 | 0.463 | 0.463 | timeouts,drawRate |
| KBRMGQGR | 100 | 15 | 65 | 20 | 0.475 | 0.417–0.533 | -17 ±40 | 35.0% | 54.0% | 11.0% | 156.0±83.8 | 0.23 | 0.028 | 0.659 | 0.07 | 0.98 | 0.29 | 1.99 | -0.020 | 0.463 | 0.463 | timeouts |
| RQGRGMKB | 100 | 15 | 69 | 16 | 0.495 | 0.440–0.550 | -3 ±38 | 31.0% | 52.0% | 17.0% | 157.3±90.6 | 0.24 | 0.028 | 0.665 | 0.05 | 0.98 | 0.28 | 2.00 | -0.039 | 0.462 | 0.462 | timeouts |
| KMGRBQRG | 100 | 12 | 74 | 14 | 0.490 | 0.440–0.540 | -7 ±35 | 26.0% | 54.0% | 20.0% | 178.0±89.9 | 0.23 | 0.026 | 0.666 | 0.06 | 0.98 | 0.28 | 2.00 | -0.094 | 0.459 | 0.459 | timeouts |
| RMGQBGKR | 100 | 22 | 67 | 11 | 0.555 | 0.500–0.610 | +38 ±38 | 33.0% | 50.0% | 17.0% | 157.3±91.1 | 0.22 | 0.031 | 0.660 | 0.05 | 0.98 | 0.30 | 1.95 | -0.072 | 0.455 | 0.455 | balance,timeouts |
| RKQGRMGB | 100 | 16 | 74 | 10 | 0.530 | 0.480–0.580 | +21 ±34 | 26.0% | 52.0% | 22.0% | 167.9±90.5 | 0.20 | 0.024 | 0.652 | 0.04 | 0.98 | 0.27 | 2.01 | -0.115 | 0.447 | 0.447 | balance,timeouts |

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
