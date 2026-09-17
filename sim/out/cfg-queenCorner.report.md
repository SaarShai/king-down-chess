# Sim report — cfg-queenCorner

3200 games. White score **0.532** (95% 0.518–0.546),
white advantage **+22 ± 10 Elo**.
Decisive 64.4% · draws 29.8% · capped 5.8% (counted apart, never as draws).
Plies: mean 130.1 ± 74.7, median 110. Rules: all defaults.

No complete colour-swapped pairs in this run.
σ_pg 0.4001 · normalized Elo +28 · LOS 100.0% ·
SPRT LLR 2.74 against ±2.94 (nElo 0 vs 4) → **continue**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 3200 | 1134 | 1138 | 928 | 0.532 | 0.518–0.546 | +22 ±10 | 64.4% | 29.8% | 5.8% | 130.1±74.7 | 0.32 | 0.034 | 0.627 | 0.12 | 0.97 | 0.43 | 1.53 | -0.000 | 0.482 | 0.378 | balance,timeouts |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | B | L | G | S | K | R | Q | P | N | A | M |
|---|---|---|---|---|---|---|---|---|---|---|---|
| use | 1.50 | 0.89 | 2.07 | 0.48 | 2.08 | 1.66 | 1.31 | 0.43 | 1.20 | 1.56 | 2.67 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 2062 | 64.4% |
| adjudicatedDraw | 563 | 17.6% |
| draw50 | 227 | 7.1% |
| plyCap | 184 | 5.8% |
| drawRepetition | 141 | 4.4% |
| drawMaterial | 23 | 0.7% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| P | 90272 | 17982 | 33695 | 51200 | 16431 | 32.1% |
| K | 54213 | 3334 | 0 | 6400 | 6400 | 100.0% |
| M | 52017 | 3075 | 1940 | 4800 | 2860 | 59.6% |
| G | 48369 | 0 | 191 | 5760 | 5648 | 98.1% |
| Q | 34087 | 6964 | 5609 | 6400 | 1782 | 27.8% |
| A | 32460 | 6153 | 1300 | 5120 | 3821 | 74.6% |
| R | 32378 | 5112 | 3048 | 4800 | 1752 | 36.5% |
| B | 25452 | 4071 | 2822 | 4160 | 1338 | 32.2% |
| N | 24997 | 4873 | 4229 | 5120 | 893 | 17.4% |
| L | 11515 | 2028 | 936 | 3200 | 237 | 7.4% |
| S | 10577 | 1784 | 1606 | 5440 | 3834 | 70.5% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 6153 | 1.92 |
| beastChainMoves | 1563 | 0.49 |
| beastChainCaptures | 1784 | 0.56 |
| maesterSwaps | 21582 | 6.74 |
| maesterLongSwaps | 3546 | 1.11 |
| paladinSacrifices | 2028 | 0.63 |
| promotions | 1074 | 0.34 |
| checks | 19810 | 6.19 |

## Degeneracy counters
| counter | value |
|---|---|
| guard captures per game | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 250 (7.8%) |
| games where a king never moved | 880 (27.5%) |

## Interest terms, residualised on draw rate
Each term minus what this run's `term ~ a + b·drawRate` line predicts from the arrangement's draw
rate. The mean over the arrangements is 0 by construction, so read differences between pools, never
levels. Overall row, fitted on the 20 arrangements:
| killerMove | leadChange | uncertaintyLate | drama | permanence | fairyUse | excessDecisiveness | interest | interestMinFairy |
|---|---|---|---|---|---|---|---|---|
| 0.000 | 0.000 | 0.000 | -0.000 | -0.000 | 0.001 | -0.000 | 0.000 | -0.033 |

## Balance axis — back ranks by |white score − 0.5| (ascending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| RSGNKSNQ | 160 | 53 | 54 | 53 | 0.500 | 0.437–0.563 | +0 ±44 | 66.3% | 29.4% | 4.4% | 123.7±76.1 | 0.35 | 0.033 | 0.632 | 0.12 | 0.96 | 0.40 | 1.77 | 0.017 | 0.488 | 0.368 | - |
| QSGRAKBB | 160 | 56 | 48 | 56 | 0.500 | 0.435–0.565 | +0 ±45 | 70.0% | 25.0% | 5.0% | 120.9±75.2 | 0.32 | 0.030 | 0.618 | 0.12 | 0.97 | 0.42 | 1.49 | 0.055 | 0.485 | 0.368 | - |
| KRNBSNAQ | 160 | 61 | 39 | 60 | 0.503 | 0.436–0.570 | +2 ±47 | 75.6% | 23.8% | 0.6% | 106.9±52.9 | 0.37 | 0.047 | 0.643 | 0.16 | 0.96 | 0.51 | 0.98 | 0.111 | 0.497 | 0.409 | - |
| AKGMGMLQ | 160 | 49 | 65 | 46 | 0.509 | 0.450–0.569 | +7 ±41 | 59.4% | 30.6% | 10.0% | 147.7±84.4 | 0.37 | 0.038 | 0.638 | 0.13 | 0.96 | 0.42 | 1.67 | -0.051 | 0.490 | 0.474 | timeouts |
| QAMGMKNS | 160 | 39 | 86 | 35 | 0.512 | 0.460–0.565 | +9 ±37 | 46.3% | 45.0% | 8.8% | 150.1±78.7 | 0.31 | 0.043 | 0.656 | 0.11 | 0.97 | 0.41 | 1.64 | -0.182 | 0.470 | 0.363 | timeouts,drawRate |
| QGNNMKRA | 160 | 48 | 58 | 54 | 0.481 | 0.419–0.543 | -13 ±43 | 63.7% | 30.6% | 5.6% | 129.0±68.2 | 0.31 | 0.044 | 0.643 | 0.12 | 0.97 | 0.44 | 1.67 | -0.007 | 0.480 | 0.480 | timeouts |
| QGBRALKN | 160 | 59 | 48 | 53 | 0.519 | 0.454–0.584 | +13 ±45 | 70.0% | 27.5% | 2.5% | 111.6±61.3 | 0.32 | 0.031 | 0.624 | 0.13 | 0.97 | 0.47 | 1.40 | 0.055 | 0.485 | 0.440 | - |
| MNKBSMSQ | 160 | 48 | 71 | 41 | 0.522 | 0.464–0.580 | +15 ±40 | 55.6% | 36.9% | 7.5% | 148.3±70.5 | 0.35 | 0.046 | 0.656 | 0.13 | 0.97 | 0.43 | 1.59 | -0.088 | 0.485 | 0.385 | timeouts |
| QSNKSAGB | 160 | 49 | 71 | 40 | 0.528 | 0.471–0.586 | +20 ±40 | 55.6% | 35.6% | 8.8% | 149.6±83.8 | 0.26 | 0.031 | 0.621 | 0.09 | 0.97 | 0.39 | 1.63 | -0.088 | 0.461 | 0.350 | timeouts |
| QMNKRABL | 160 | 68 | 33 | 59 | 0.528 | 0.459–0.597 | +20 ±48 | 79.4% | 20.0% | 0.6% | 107.6±53.6 | 0.32 | 0.024 | 0.602 | 0.12 | 0.97 | 0.49 | 1.49 | 0.149 | 0.489 | 0.472 | - |
| MKAALRBQ | 160 | 66 | 39 | 55 | 0.534 | 0.467–0.602 | +24 ±47 | 75.6% | 17.5% | 6.9% | 127.9±71.1 | 0.32 | 0.024 | 0.613 | 0.12 | 0.97 | 0.42 | 1.43 | 0.112 | 0.489 | 0.474 | balance,timeouts |
| MANLNGKQ | 160 | 66 | 40 | 54 | 0.537 | 0.471–0.604 | +26 ±46 | 75.0% | 24.4% | 0.6% | 129.3±58.4 | 0.38 | 0.034 | 0.625 | 0.16 | 0.97 | 0.46 | 1.54 | 0.106 | 0.504 | 0.482 | balance |
| QSSRAGKB | 160 | 45 | 82 | 33 | 0.537 | 0.484–0.591 | +26 ±37 | 48.8% | 37.5% | 13.8% | 159.4±91.1 | 0.28 | 0.035 | 0.627 | 0.09 | 0.97 | 0.36 | 1.65 | -0.157 | 0.460 | 0.353 | balance,timeouts |
| LMGRAMKQ | 160 | 55 | 64 | 41 | 0.544 | 0.484–0.603 | +30 ±41 | 60.0% | 32.5% | 7.5% | 146.4±75.3 | 0.30 | 0.027 | 0.612 | 0.09 | 0.97 | 0.39 | 1.60 | -0.044 | 0.471 | 0.447 | balance,timeouts |
| RMSNRKGQ | 160 | 60 | 55 | 45 | 0.547 | 0.485–0.609 | +33 ±43 | 65.6% | 29.4% | 5.0% | 129.1±68.6 | 0.33 | 0.039 | 0.647 | 0.13 | 0.97 | 0.44 | 1.65 | 0.012 | 0.489 | 0.394 | balance |
| AKGNSLBQ | 160 | 61 | 53 | 46 | 0.547 | 0.484–0.610 | +33 ±44 | 66.9% | 28.7% | 4.4% | 119.7±75.3 | 0.32 | 0.026 | 0.617 | 0.15 | 0.96 | 0.44 | 1.42 | 0.025 | 0.487 | 0.376 | balance |
| KGMASRLQ | 160 | 58 | 63 | 39 | 0.559 | 0.500–0.619 | +41 ±41 | 60.6% | 33.8% | 5.6% | 134.5±77.7 | 0.30 | 0.029 | 0.616 | 0.10 | 0.97 | 0.41 | 1.61 | -0.038 | 0.472 | 0.372 | balance,timeouts |
| QSGRKGMB | 160 | 50 | 83 | 27 | 0.572 | 0.519–0.624 | +50 ±37 | 48.1% | 43.8% | 8.1% | 143.8±76.4 | 0.28 | 0.037 | 0.646 | 0.10 | 0.97 | 0.42 | 1.57 | -0.162 | 0.464 | 0.363 | balance,timeouts |
| QNGBLRKA | 160 | 73 | 38 | 49 | 0.575 | 0.508–0.642 | +53 ±46 | 76.3% | 19.4% | 4.4% | 103.0±67.6 | 0.35 | 0.027 | 0.611 | 0.12 | 0.96 | 0.47 | 1.17 | 0.119 | 0.494 | 0.488 | balance |
| BLGSKSRQ | 160 | 70 | 48 | 42 | 0.588 | 0.524–0.651 | +61 ±44 | 70.0% | 25.0% | 5.0% | 113.4±78.0 | 0.32 | 0.028 | 0.600 | 0.11 | 0.96 | 0.41 | 1.53 | 0.057 | 0.481 | 0.363 | balance |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| MANLNGKQ | 160 | 66 | 40 | 54 | 0.537 | 0.471–0.604 | +26 ±46 | 75.0% | 24.4% | 0.6% | 129.3±58.4 | 0.38 | 0.034 | 0.625 | 0.16 | 0.97 | 0.46 | 1.54 | 0.106 | 0.504 | 0.482 | balance |
| KRNBSNAQ | 160 | 61 | 39 | 60 | 0.503 | 0.436–0.570 | +2 ±47 | 75.6% | 23.8% | 0.6% | 106.9±52.9 | 0.37 | 0.047 | 0.643 | 0.16 | 0.96 | 0.51 | 0.98 | 0.111 | 0.497 | 0.409 | - |
| QNGBLRKA | 160 | 73 | 38 | 49 | 0.575 | 0.508–0.642 | +53 ±46 | 76.3% | 19.4% | 4.4% | 103.0±67.6 | 0.35 | 0.027 | 0.611 | 0.12 | 0.96 | 0.47 | 1.17 | 0.119 | 0.494 | 0.488 | balance |
| AKGMGMLQ | 160 | 49 | 65 | 46 | 0.509 | 0.450–0.569 | +7 ±41 | 59.4% | 30.6% | 10.0% | 147.7±84.4 | 0.37 | 0.038 | 0.638 | 0.13 | 0.96 | 0.42 | 1.67 | -0.051 | 0.490 | 0.474 | timeouts |
| QMNKRABL | 160 | 68 | 33 | 59 | 0.528 | 0.459–0.597 | +20 ±48 | 79.4% | 20.0% | 0.6% | 107.6±53.6 | 0.32 | 0.024 | 0.602 | 0.12 | 0.97 | 0.49 | 1.49 | 0.149 | 0.489 | 0.472 | - |
| MKAALRBQ | 160 | 66 | 39 | 55 | 0.534 | 0.467–0.602 | +24 ±47 | 75.6% | 17.5% | 6.9% | 127.9±71.1 | 0.32 | 0.024 | 0.613 | 0.12 | 0.97 | 0.42 | 1.43 | 0.112 | 0.489 | 0.474 | balance,timeouts |
| RMSNRKGQ | 160 | 60 | 55 | 45 | 0.547 | 0.485–0.609 | +33 ±43 | 65.6% | 29.4% | 5.0% | 129.1±68.6 | 0.33 | 0.039 | 0.647 | 0.13 | 0.97 | 0.44 | 1.65 | 0.012 | 0.489 | 0.394 | balance |
| RSGNKSNQ | 160 | 53 | 54 | 53 | 0.500 | 0.437–0.563 | +0 ±44 | 66.3% | 29.4% | 4.4% | 123.7±76.1 | 0.35 | 0.033 | 0.632 | 0.12 | 0.96 | 0.40 | 1.77 | 0.017 | 0.488 | 0.368 | - |
| AKGNSLBQ | 160 | 61 | 53 | 46 | 0.547 | 0.484–0.610 | +33 ±44 | 66.9% | 28.7% | 4.4% | 119.7±75.3 | 0.32 | 0.026 | 0.617 | 0.15 | 0.96 | 0.44 | 1.42 | 0.025 | 0.487 | 0.376 | balance |
| QSGRAKBB | 160 | 56 | 48 | 56 | 0.500 | 0.435–0.565 | +0 ±45 | 70.0% | 25.0% | 5.0% | 120.9±75.2 | 0.32 | 0.030 | 0.618 | 0.12 | 0.97 | 0.42 | 1.49 | 0.055 | 0.485 | 0.368 | - |
| MNKBSMSQ | 160 | 48 | 71 | 41 | 0.522 | 0.464–0.580 | +15 ±40 | 55.6% | 36.9% | 7.5% | 148.3±70.5 | 0.35 | 0.046 | 0.656 | 0.13 | 0.97 | 0.43 | 1.59 | -0.088 | 0.485 | 0.385 | timeouts |
| QGBRALKN | 160 | 59 | 48 | 53 | 0.519 | 0.454–0.584 | +13 ±45 | 70.0% | 27.5% | 2.5% | 111.6±61.3 | 0.32 | 0.031 | 0.624 | 0.13 | 0.97 | 0.47 | 1.40 | 0.055 | 0.485 | 0.440 | - |
| BLGSKSRQ | 160 | 70 | 48 | 42 | 0.588 | 0.524–0.651 | +61 ±44 | 70.0% | 25.0% | 5.0% | 113.4±78.0 | 0.32 | 0.028 | 0.600 | 0.11 | 0.96 | 0.41 | 1.53 | 0.057 | 0.481 | 0.363 | balance |
| QGNNMKRA | 160 | 48 | 58 | 54 | 0.481 | 0.419–0.543 | -13 ±43 | 63.7% | 30.6% | 5.6% | 129.0±68.2 | 0.31 | 0.044 | 0.643 | 0.12 | 0.97 | 0.44 | 1.67 | -0.007 | 0.480 | 0.480 | timeouts |
| KGMASRLQ | 160 | 58 | 63 | 39 | 0.559 | 0.500–0.619 | +41 ±41 | 60.6% | 33.8% | 5.6% | 134.5±77.7 | 0.30 | 0.029 | 0.616 | 0.10 | 0.97 | 0.41 | 1.61 | -0.038 | 0.472 | 0.372 | balance,timeouts |
| LMGRAMKQ | 160 | 55 | 64 | 41 | 0.544 | 0.484–0.603 | +30 ±41 | 60.0% | 32.5% | 7.5% | 146.4±75.3 | 0.30 | 0.027 | 0.612 | 0.09 | 0.97 | 0.39 | 1.60 | -0.044 | 0.471 | 0.447 | balance,timeouts |
| QAMGMKNS | 160 | 39 | 86 | 35 | 0.512 | 0.460–0.565 | +9 ±37 | 46.3% | 45.0% | 8.8% | 150.1±78.7 | 0.31 | 0.043 | 0.656 | 0.11 | 0.97 | 0.41 | 1.64 | -0.182 | 0.470 | 0.363 | timeouts,drawRate |
| QSGRKGMB | 160 | 50 | 83 | 27 | 0.572 | 0.519–0.624 | +50 ±37 | 48.1% | 43.8% | 8.1% | 143.8±76.4 | 0.28 | 0.037 | 0.646 | 0.10 | 0.97 | 0.42 | 1.57 | -0.162 | 0.464 | 0.363 | balance,timeouts |
| QSNKSAGB | 160 | 49 | 71 | 40 | 0.528 | 0.471–0.586 | +20 ±40 | 55.6% | 35.6% | 8.8% | 149.6±83.8 | 0.26 | 0.031 | 0.621 | 0.09 | 0.97 | 0.39 | 1.63 | -0.088 | 0.461 | 0.350 | timeouts |
| QSSRAGKB | 160 | 45 | 82 | 33 | 0.537 | 0.484–0.591 | +26 ±37 | 48.8% | 37.5% | 13.8% | 159.4±91.1 | 0.28 | 0.035 | 0.627 | 0.09 | 0.97 | 0.36 | 1.65 | -0.157 | 0.460 | 0.353 | balance,timeouts |

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
