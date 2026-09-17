# Sim report — gs-escort-on

2400 games. White score **0.598** (95% 0.583–0.613),
white advantage **+69 ± 9 Elo**.
Decisive 59.5% · draws 37.0% · capped 3.6% (counted apart, never as draws).
Plies: mean 69.0 ± 51.0, median 58. Rules: all defaults.

Pentanomial over 1200 colour-swapped pairs: [37, 208, 506, 321, 128] (LL, LD, DD/WL, WD, WW).
σ_pg 0.3410 · normalized Elo +63 · LOS 100.0% ·
SPRT LLR 4.68 against ±2.94 (nElo 0 vs 4) → **H1**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 2400 | 948 | 973 | 479 | 0.598 | 0.583–0.613 | +69 ±9 | 59.5% | 37.0% | 3.6% | 69.0±51.0 | 0.26 | 0.026 | 0.612 | 0.06 | 0.97 | 0.21 | 1.37 | 0.027 | 0.463 | 0.463 | balance,duration,utilisation |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | K | R | G | P |
|---|---|---|---|---|
| use | 2.35 | 2.01 | 1.37 | 0.21 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 1421 | 59.2% |
| drawRepetition | 349 | 14.5% |
| adjudicatedDraw | 342 | 14.2% |
| drawMaterial | 102 | 4.3% |
| draw50 | 94 | 3.9% |
| plyCap | 86 | 3.6% |
| checkmate | 6 | 0.3% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| K | 59755 | 4980 | 0 | 4800 | 4800 | 100.0% |
| R | 51143 | 6354 | 2773 | 4800 | 2028 | 42.3% |
| G | 34987 | 0 | 1067 | 4800 | 3766 | 78.5% |
| P | 19138 | 793 | 8155 | 16800 | 7727 | 46.0% |
| Q | 466 | 28 | 153 | 0 | 720 | 0.0% |
| L | 98 | 0 | 0 | 0 | 4 | 0.0% |
| B | 0 | 0 | 2 | 0 | 0 | 0.0% |
| N | 0 | 0 | 5 | 0 | 0 | 0.0% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 0 | 0.00 |
| beastChainMoves | 0 | 0.00 |
| beastChainCaptures | 0 | 0.00 |
| maesterSwaps | 0 | 0.00 |
| maesterLongSwaps | 0 | 0.00 |
| paladinSacrifices | 0 | 0.00 |
| promotions | 918 | 0.38 |
| checks | 16964 | 7.07 |

## Degeneracy counters
| counter | value |
|---|---|
| guard captures per game | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 196 (8.2%) |
| games where a king never moved | 202 (8.4%) |

## Interest terms, residualised on draw rate
Each term minus what this run's `term ~ a + b·drawRate` line predicts from the arrangement's draw
rate. The mean over the arrangements is 0 by construction, so read differences between pools, never
levels. Overall row, fitted on the 40 arrangements:
| killerMove | leadChange | uncertaintyLate | drama | permanence | fairyUse | excessDecisiveness | interest | interestMinFairy |
|---|---|---|---|---|---|---|---|---|
| -0.000 | 0.000 | -0.000 | 0.000 | 0.000 | 0.010 | 0.027 | 0.004 | 0.004 |

## Balance axis — back ranks by |white score − 0.5| (ascending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| QNRMGAKB | 60 | 13 | 34 | 13 | 0.500 | 0.417–0.583 | +0 ±53 | 43.3% | 53.3% | 3.3% | 79.8±50.6 | 0.27 | 0.049 | 0.683 | 0.07 | 0.97 | 0.23 | 1.63 | -0.019 | 0.470 | 0.470 | utilisation |
| NQGBKRMA | 60 | 13 | 35 | 12 | 0.508 | 0.427–0.590 | +6 ±52 | 41.7% | 51.7% | 6.7% | 94.4±53.6 | 0.21 | 0.021 | 0.627 | 0.02 | 0.97 | 0.20 | 2.65 | -0.045 | 0.448 | 0.448 | timeouts,utilisation |
| KGMAQNRB | 60 | 11 | 36 | 13 | 0.483 | 0.403–0.563 | -12 ±53 | 40.0% | 56.7% | 3.3% | 81.2±45.0 | 0.30 | 0.034 | 0.685 | 0.06 | 0.97 | 0.20 | 1.22 | -0.072 | 0.474 | 0.474 | utilisation |
| BGMQNARK | 60 | 13 | 32 | 15 | 0.483 | 0.397–0.570 | -12 ±51 | 46.7% | 48.3% | 5.0% | 92.7±45.5 | 0.31 | 0.032 | 0.675 | 0.07 | 0.97 | 0.19 | 1.50 | -0.005 | 0.480 | 0.480 | utilisation |
| RQMBAKGN | 60 | 14 | 30 | 16 | 0.483 | 0.394–0.573 | -12 ±53 | 50.0% | 43.3% | 6.7% | 82.9±49.0 | 0.32 | 0.027 | 0.663 | 0.06 | 0.97 | 0.23 | 1.44 | 0.028 | 0.483 | 0.483 | timeouts,utilisation |
| QRNMAGKB | 60 | 15 | 32 | 13 | 0.517 | 0.430–0.603 | +12 ±58 | 46.7% | 48.3% | 5.0% | 70.0±46.6 | 0.28 | 0.034 | 0.661 | 0.07 | 0.96 | 0.19 | 1.38 | -0.005 | 0.474 | 0.474 | duration,utilisation |
| KABMNQGR | 60 | 16 | 30 | 14 | 0.517 | 0.427–0.606 | +12 ±54 | 50.0% | 40.0% | 10.0% | 86.3±53.0 | 0.36 | 0.019 | 0.653 | 0.07 | 0.96 | 0.21 | 1.30 | 0.028 | 0.491 | 0.491 | timeouts,utilisation |
| MABNKGQR | 60 | 18 | 27 | 15 | 0.525 | 0.431–0.619 | +17 ±69 | 55.0% | 38.3% | 6.7% | 76.1±50.3 | 0.35 | 0.038 | 0.658 | 0.08 | 0.95 | 0.23 | 1.29 | 0.069 | 0.490 | 0.490 | timeouts,utilisation |
| MNRGKQBA | 60 | 11 | 35 | 14 | 0.475 | 0.394–0.556 | -17 ±49 | 41.7% | 56.7% | 1.7% | 82.5±47.1 | 0.30 | 0.054 | 0.695 | 0.07 | 0.97 | 0.18 | 1.43 | -0.065 | 0.474 | 0.474 | utilisation |
| BQKMARGN | 60 | 11 | 35 | 14 | 0.475 | 0.394–0.556 | -17 ±57 | 41.7% | 53.3% | 5.0% | 74.6±51.1 | 0.26 | 0.050 | 0.656 | 0.05 | 0.96 | 0.26 | 1.97 | -0.065 | 0.459 | 0.459 | duration |
| KAQNGMRB | 60 | 14 | 35 | 11 | 0.525 | 0.444–0.606 | +17 ±47 | 41.7% | 53.3% | 5.0% | 81.6±48.2 | 0.27 | 0.043 | 0.679 | 0.06 | 0.97 | 0.19 | 1.36 | -0.065 | 0.467 | 0.467 | utilisation |
| NABMQKRG | 60 | 18 | 21 | 21 | 0.475 | 0.373–0.577 | -17 ±62 | 65.0% | 35.0% | 0.0% | 77.8±50.2 | 0.34 | 0.026 | 0.640 | 0.10 | 0.95 | 0.21 | 1.29 | 0.169 | 0.496 | 0.496 | utilisation |
| RQBMGNKA | 60 | 16 | 32 | 12 | 0.533 | 0.447–0.619 | +23 ±68 | 46.7% | 48.3% | 5.0% | 85.1±49.5 | 0.31 | 0.046 | 0.677 | 0.08 | 0.97 | 0.16 | 0.99 | -0.025 | 0.477 | 0.477 | balance,utilisation |
| NGMQABKR | 60 | 16 | 32 | 12 | 0.533 | 0.447–0.619 | +23 ±61 | 46.7% | 48.3% | 5.0% | 101.8±46.4 | 0.39 | 0.028 | 0.663 | 0.11 | 0.97 | 0.18 | 1.08 | -0.025 | 0.498 | 0.498 | balance,utilisation |
| NKMQRABG | 60 | 20 | 25 | 15 | 0.542 | 0.446–0.638 | +29 ±60 | 58.3% | 41.7% | 0.0% | 89.9±50.6 | 0.35 | 0.009 | 0.631 | 0.04 | 0.96 | 0.20 | 1.44 | 0.082 | 0.488 | 0.488 | balance,utilisation |
| RGKBANQM | 60 | 19 | 17 | 24 | 0.458 | 0.352–0.565 | -29 ±56 | 71.7% | 23.3% | 5.0% | 73.8±45.5 | 0.37 | 0.018 | 0.632 | 0.07 | 0.95 | 0.24 | 1.42 | 0.215 | 0.501 | 0.501 | balance,duration,utilisation |
| ARGMBKNQ | 60 | 8 | 38 | 14 | 0.450 | 0.374–0.526 | -35 ±48 | 36.7% | 56.7% | 6.7% | 94.0±53.4 | 0.28 | 0.026 | 0.675 | 0.07 | 0.97 | 0.19 | 1.43 | -0.144 | 0.467 | 0.467 | balance,timeouts,utilisation |
| KARGNBMQ | 60 | 21 | 24 | 15 | 0.550 | 0.453–0.647 | +35 ±61 | 60.0% | 38.3% | 1.7% | 86.6±56.3 | 0.27 | 0.009 | 0.618 | 0.03 | 0.97 | 0.21 | 1.86 | 0.089 | 0.470 | 0.470 | balance,utilisation |
| RBMAGNQK | 60 | 15 | 36 | 9 | 0.550 | 0.471–0.629 | +35 ±55 | 40.0% | 56.7% | 3.3% | 80.5±41.5 | 0.27 | 0.039 | 0.665 | 0.04 | 0.96 | 0.21 | 1.32 | -0.111 | 0.459 | 0.459 | balance,utilisation |
| RMGQAKNB | 60 | 20 | 27 | 13 | 0.558 | 0.466–0.651 | +41 ±61 | 55.0% | 41.7% | 3.3% | 73.5±41.4 | 0.35 | 0.040 | 0.669 | 0.11 | 0.96 | 0.24 | 0.95 | 0.029 | 0.483 | 0.483 | balance,duration,utilisation |
| RKMQNBGA | 60 | 18 | 32 | 10 | 0.567 | 0.482–0.651 | +47 ±59 | 46.7% | 43.3% | 10.0% | 71.4±56.3 | 0.32 | 0.024 | 0.631 | 0.06 | 0.91 | 0.19 | 1.24 | -0.064 | 0.470 | 0.470 | balance,timeouts,duration,utilisation |
| BKQRGMNA | 60 | 12 | 28 | 20 | 0.433 | 0.342–0.524 | -47 ±57 | 53.3% | 46.7% | 0.0% | 75.2±40.4 | 0.33 | 0.042 | 0.683 | 0.10 | 0.97 | 0.22 | 1.16 | 0.003 | 0.489 | 0.489 | balance,utilisation |
| GKRQNBMA | 60 | 9 | 32 | 19 | 0.417 | 0.333–0.500 | -58 ±62 | 46.7% | 48.3% | 5.0% | 81.6±53.3 | 0.33 | 0.049 | 0.680 | 0.11 | 0.96 | 0.21 | 1.19 | -0.084 | 0.482 | 0.482 | balance,utilisation |
| ANBKGRQM | 60 | 23 | 24 | 13 | 0.583 | 0.488–0.679 | +58 ±71 | 60.0% | 36.7% | 3.3% | 72.3±43.3 | 0.38 | 0.031 | 0.659 | 0.12 | 0.96 | 0.20 | 1.08 | 0.050 | 0.501 | 0.501 | balance,duration,utilisation |
| NQKGMARB | 60 | 8 | 33 | 19 | 0.408 | 0.327–0.490 | -64 ±57 | 45.0% | 48.3% | 6.7% | 81.4±46.4 | 0.30 | 0.037 | 0.679 | 0.10 | 0.97 | 0.21 | 1.49 | -0.110 | 0.475 | 0.475 | balance,timeouts,utilisation |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ABGMKQRN | 60 | 27 | 17 | 16 | 0.592 | 0.487–0.696 | +64 ±49 | 71.7% | 25.0% | 3.3% | 79.8±50.2 | 0.39 | 0.028 | 0.629 | 0.13 | 0.96 | 0.25 | 1.15 | 0.156 | 0.508 | 0.508 | balance,utilisation |
| RGKBANQM | 60 | 19 | 17 | 24 | 0.458 | 0.352–0.565 | -29 ±56 | 71.7% | 23.3% | 5.0% | 73.8±45.5 | 0.37 | 0.018 | 0.632 | 0.07 | 0.95 | 0.24 | 1.42 | 0.215 | 0.501 | 0.501 | balance,duration,utilisation |
| ANBKGRQM | 60 | 23 | 24 | 13 | 0.583 | 0.488–0.679 | +58 ±71 | 60.0% | 36.7% | 3.3% | 72.3±43.3 | 0.38 | 0.031 | 0.659 | 0.12 | 0.96 | 0.20 | 1.08 | 0.050 | 0.501 | 0.501 | balance,duration,utilisation |
| NGMQABKR | 60 | 16 | 32 | 12 | 0.533 | 0.447–0.619 | +23 ±61 | 46.7% | 48.3% | 5.0% | 101.8±46.4 | 0.39 | 0.028 | 0.663 | 0.11 | 0.97 | 0.18 | 1.08 | -0.025 | 0.498 | 0.498 | balance,utilisation |
| NABMQKRG | 60 | 18 | 21 | 21 | 0.475 | 0.373–0.577 | -17 ±62 | 65.0% | 35.0% | 0.0% | 77.8±50.2 | 0.34 | 0.026 | 0.640 | 0.10 | 0.95 | 0.21 | 1.29 | 0.169 | 0.496 | 0.496 | utilisation |
| KABMNQGR | 60 | 16 | 30 | 14 | 0.517 | 0.427–0.606 | +12 ±54 | 50.0% | 40.0% | 10.0% | 86.3±53.0 | 0.36 | 0.019 | 0.653 | 0.07 | 0.96 | 0.21 | 1.30 | 0.028 | 0.491 | 0.491 | timeouts,utilisation |
| MABNKGQR | 60 | 18 | 27 | 15 | 0.525 | 0.431–0.619 | +17 ±69 | 55.0% | 38.3% | 6.7% | 76.1±50.3 | 0.35 | 0.038 | 0.658 | 0.08 | 0.95 | 0.23 | 1.29 | 0.069 | 0.490 | 0.490 | timeouts,utilisation |
| BKQRGMNA | 60 | 12 | 28 | 20 | 0.433 | 0.342–0.524 | -47 ±57 | 53.3% | 46.7% | 0.0% | 75.2±40.4 | 0.33 | 0.042 | 0.683 | 0.10 | 0.97 | 0.22 | 1.16 | 0.003 | 0.489 | 0.489 | balance,utilisation |
| NKMQRABG | 60 | 20 | 25 | 15 | 0.542 | 0.446–0.638 | +29 ±60 | 58.3% | 41.7% | 0.0% | 89.9±50.6 | 0.35 | 0.009 | 0.631 | 0.04 | 0.96 | 0.20 | 1.44 | 0.082 | 0.488 | 0.488 | balance,utilisation |
| RQMBAKGN | 60 | 14 | 30 | 16 | 0.483 | 0.394–0.573 | -12 ±53 | 50.0% | 43.3% | 6.7% | 82.9±49.0 | 0.32 | 0.027 | 0.663 | 0.06 | 0.97 | 0.23 | 1.44 | 0.028 | 0.483 | 0.483 | timeouts,utilisation |
| RMGQAKNB | 60 | 20 | 27 | 13 | 0.558 | 0.466–0.651 | +41 ±61 | 55.0% | 41.7% | 3.3% | 73.5±41.4 | 0.35 | 0.040 | 0.669 | 0.11 | 0.96 | 0.24 | 0.95 | 0.029 | 0.483 | 0.483 | balance,duration,utilisation |
| GKRQNBMA | 60 | 9 | 32 | 19 | 0.417 | 0.333–0.500 | -58 ±62 | 46.7% | 48.3% | 5.0% | 81.6±53.3 | 0.33 | 0.049 | 0.680 | 0.11 | 0.96 | 0.21 | 1.19 | -0.084 | 0.482 | 0.482 | balance,utilisation |
| BGMQNARK | 60 | 13 | 32 | 15 | 0.483 | 0.397–0.570 | -12 ±51 | 46.7% | 48.3% | 5.0% | 92.7±45.5 | 0.31 | 0.032 | 0.675 | 0.07 | 0.97 | 0.19 | 1.50 | -0.005 | 0.480 | 0.480 | utilisation |
| RQBMGNKA | 60 | 16 | 32 | 12 | 0.533 | 0.447–0.619 | +23 ±68 | 46.7% | 48.3% | 5.0% | 85.1±49.5 | 0.31 | 0.046 | 0.677 | 0.08 | 0.97 | 0.16 | 0.99 | -0.025 | 0.477 | 0.477 | balance,utilisation |
| KBMQNGRA | 60 | 20 | 33 | 7 | 0.608 | 0.528–0.689 | +76 ±56 | 45.0% | 45.0% | 10.0% | 83.0±48.1 | 0.34 | 0.046 | 0.676 | 0.06 | 0.97 | 0.19 | 1.05 | -0.130 | 0.476 | 0.476 | balance,timeouts,utilisation |
| NQKGMARB | 60 | 8 | 33 | 19 | 0.408 | 0.327–0.490 | -64 ±57 | 45.0% | 48.3% | 6.7% | 81.4±46.4 | 0.30 | 0.037 | 0.679 | 0.10 | 0.97 | 0.21 | 1.49 | -0.110 | 0.475 | 0.475 | balance,timeouts,utilisation |
| KGMAQNRB | 60 | 11 | 36 | 13 | 0.483 | 0.403–0.563 | -12 ±53 | 40.0% | 56.7% | 3.3% | 81.2±45.0 | 0.30 | 0.034 | 0.685 | 0.06 | 0.97 | 0.20 | 1.22 | -0.072 | 0.474 | 0.474 | utilisation |
| MNRGKQBA | 60 | 11 | 35 | 14 | 0.475 | 0.394–0.556 | -17 ±49 | 41.7% | 56.7% | 1.7% | 82.5±47.1 | 0.30 | 0.054 | 0.695 | 0.07 | 0.97 | 0.18 | 1.43 | -0.065 | 0.474 | 0.474 | utilisation |
| QRNMAGKB | 60 | 15 | 32 | 13 | 0.517 | 0.430–0.603 | +12 ±58 | 46.7% | 48.3% | 5.0% | 70.0±46.6 | 0.28 | 0.034 | 0.661 | 0.07 | 0.96 | 0.19 | 1.38 | -0.005 | 0.474 | 0.474 | duration,utilisation |
| RKMQNBGA | 60 | 18 | 32 | 10 | 0.567 | 0.482–0.651 | +47 ±59 | 46.7% | 43.3% | 10.0% | 71.4±56.3 | 0.32 | 0.024 | 0.631 | 0.06 | 0.91 | 0.19 | 1.24 | -0.064 | 0.470 | 0.470 | balance,timeouts,duration,utilisation |
| QNRMGAKB | 60 | 13 | 34 | 13 | 0.500 | 0.417–0.583 | +0 ±53 | 43.3% | 53.3% | 3.3% | 79.8±50.6 | 0.27 | 0.049 | 0.683 | 0.07 | 0.97 | 0.23 | 1.63 | -0.019 | 0.470 | 0.470 | utilisation |
| RGBKMAQN | 60 | 24 | 25 | 11 | 0.608 | 0.516–0.701 | +76 ±55 | 58.3% | 40.0% | 1.7% | 74.4±44.4 | 0.29 | 0.024 | 0.637 | 0.05 | 0.97 | 0.23 | 1.07 | 0.003 | 0.470 | 0.470 | balance,duration,utilisation |
| KARGNBMQ | 60 | 21 | 24 | 15 | 0.550 | 0.453–0.647 | +35 ±61 | 60.0% | 38.3% | 1.7% | 86.6±56.3 | 0.27 | 0.009 | 0.618 | 0.03 | 0.97 | 0.21 | 1.86 | 0.089 | 0.470 | 0.470 | balance,utilisation |
| ARGMBKNQ | 60 | 8 | 38 | 14 | 0.450 | 0.374–0.526 | -35 ±48 | 36.7% | 56.7% | 6.7% | 94.0±53.4 | 0.28 | 0.026 | 0.675 | 0.07 | 0.97 | 0.19 | 1.43 | -0.144 | 0.467 | 0.467 | balance,timeouts,utilisation |
| KAQNGMRB | 60 | 14 | 35 | 11 | 0.525 | 0.444–0.606 | +17 ±47 | 41.7% | 53.3% | 5.0% | 81.6±48.2 | 0.27 | 0.043 | 0.679 | 0.06 | 0.97 | 0.19 | 1.36 | -0.065 | 0.467 | 0.467 | utilisation |

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
