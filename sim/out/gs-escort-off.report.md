# Sim report — gs-escort-off

2400 games. White score **0.623** (95% 0.608–0.638),
white advantage **+87 ± 9 Elo**.
Decisive 60.9% · draws 35.6% · capped 3.5% (counted apart, never as draws).
Plies: mean 65.7 ± 50.2, median 56. Rules: all defaults.

Pentanomial over 1200 colour-swapped pairs: [23, 146, 551, 335, 145] (LL, LD, DD/WL, WD, WW).
σ_pg 0.3222 · normalized Elo +97 · LOS 100.0% ·
SPRT LLR 7.05 against ±2.94 (nElo 0 vs 4) → **H1**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 2400 | 1026 | 939 | 435 | 0.623 | 0.608–0.638 | +87 ±9 | 60.9% | 35.6% | 3.5% | 65.7±50.2 | 0.26 | 0.027 | 0.605 | 0.04 | 0.97 | 0.22 | 1.46 | 0.009 | 0.459 | 0.459 | balance,duration,utilisation |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | K | R | G | P |
|---|---|---|---|---|
| use | 2.32 | 1.93 | 1.46 | 0.22 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 1452 | 60.5% |
| adjudicatedDraw | 388 | 16.2% |
| drawRepetition | 351 | 14.6% |
| plyCap | 84 | 3.5% |
| drawMaterial | 67 | 2.8% |
| draw50 | 49 | 2.0% |
| checkmate | 9 | 0.4% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| K | 56173 | 4123 | 0 | 4800 | 4800 | 100.0% |
| R | 46726 | 6133 | 2828 | 4800 | 1974 | 41.1% |
| G | 35475 | 0 | 504 | 4800 | 4323 | 90.1% |
| P | 18724 | 754 | 7579 | 16800 | 8349 | 49.7% |
| Q | 565 | 36 | 134 | 0 | 704 | 0.0% |
| L | 48 | 1 | 0 | 0 | 2 | 0.0% |
| N | 0 | 0 | 2 | 0 | 0 | 0.0% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 0 | 0.00 |
| beastChainMoves | 0 | 0.00 |
| beastChainCaptures | 0 | 0.00 |
| maesterSwaps | 0 | 0.00 |
| maesterLongSwaps | 0 | 0.00 |
| paladinSacrifices | 1 | 0.00 |
| promotions | 872 | 0.36 |
| checks | 15469 | 6.45 |

## Degeneracy counters
| counter | value |
|---|---|
| guard captures per game | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 116 (4.8%) |
| games where a king never moved | 280 (11.7%) |

## Interest terms, residualised on draw rate
Each term minus what this run's `term ~ a + b·drawRate` line predicts from the arrangement's draw
rate. The mean over the arrangements is 0 by construction, so read differences between pools, never
levels. Overall row, fitted on the 40 arrangements:
| killerMove | leadChange | uncertaintyLate | drama | permanence | fairyUse | excessDecisiveness | interest | interestMinFairy |
|---|---|---|---|---|---|---|---|---|
| 0.000 | 0.000 | -0.000 | -0.000 | 0.000 | 0.032 | 0.009 | 0.007 | 0.007 |

## Balance axis — back ranks by |white score − 0.5| (ascending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| QNRMGAKB | 60 | 17 | 27 | 16 | 0.508 | 0.415–0.602 | +6 ±54 | 55.0% | 43.3% | 1.7% | 74.1±39.6 | 0.32 | 0.039 | 0.664 | 0.05 | 0.97 | 0.23 | 1.14 | 0.086 | 0.482 | 0.482 | duration,utilisation |
| RGKBANQM | 60 | 18 | 25 | 17 | 0.508 | 0.412–0.605 | +6 ±62 | 58.3% | 35.0% | 6.7% | 80.1±55.3 | 0.31 | 0.030 | 0.633 | 0.03 | 0.95 | 0.20 | 2.28 | 0.120 | 0.476 | 0.476 | timeouts,utilisation |
| MABNKGQR | 60 | 22 | 15 | 23 | 0.492 | 0.382–0.601 | -6 ±81 | 75.0% | 20.0% | 5.0% | 74.3±50.6 | 0.42 | 0.012 | 0.637 | 0.09 | 0.95 | 0.27 | 1.26 | 0.286 | 0.520 | 0.520 | duration |
| KAQNGMRB | 60 | 11 | 37 | 12 | 0.492 | 0.413–0.570 | -6 ±60 | 38.3% | 56.7% | 5.0% | 83.7±46.0 | 0.24 | 0.072 | 0.680 | 0.04 | 0.97 | 0.20 | 1.86 | -0.080 | 0.454 | 0.454 | utilisation |
| RQBMGNKA | 60 | 11 | 37 | 12 | 0.492 | 0.413–0.570 | -6 ±46 | 38.3% | 58.3% | 3.3% | 65.9±42.8 | 0.29 | 0.064 | 0.700 | 0.06 | 0.97 | 0.17 | 1.84 | -0.080 | 0.469 | 0.469 | duration,utilisation,drawRate |
| BKQRGMNA | 60 | 15 | 28 | 17 | 0.483 | 0.391–0.576 | -12 ±64 | 53.3% | 43.3% | 3.3% | 76.3±44.0 | 0.39 | 0.049 | 0.689 | 0.07 | 0.97 | 0.22 | 1.56 | 0.060 | 0.499 | 0.499 | utilisation |
| MNRGKQBA | 60 | 13 | 36 | 11 | 0.517 | 0.437–0.597 | +12 ±56 | 40.0% | 56.7% | 3.3% | 76.6±48.9 | 0.30 | 0.086 | 0.689 | 0.07 | 0.97 | 0.20 | 1.31 | -0.074 | 0.468 | 0.468 | utilisation |
| NKMQRABG | 60 | 20 | 22 | 18 | 0.517 | 0.416–0.617 | +12 ±47 | 63.3% | 35.0% | 1.7% | 71.8±41.7 | 0.30 | 0.004 | 0.616 | 0.01 | 0.96 | 0.24 | 1.41 | 0.160 | 0.477 | 0.477 | duration,utilisation |
| KBMQNGRA | 60 | 10 | 36 | 14 | 0.467 | 0.387–0.546 | -23 ±53 | 40.0% | 60.0% | 0.0% | 73.8±39.5 | 0.29 | 0.066 | 0.696 | 0.07 | 0.97 | 0.20 | 1.05 | -0.093 | 0.469 | 0.469 | balance,duration,utilisation,drawRate |
| NQKGMARB | 60 | 19 | 26 | 15 | 0.533 | 0.438–0.628 | +23 ±53 | 56.7% | 35.0% | 8.3% | 87.0±46.4 | 0.36 | 0.015 | 0.651 | 0.03 | 0.97 | 0.21 | 1.69 | 0.073 | 0.490 | 0.490 | balance,timeouts,utilisation |
| RGBKMAQN | 60 | 12 | 40 | 8 | 0.533 | 0.461–0.606 | +23 ±48 | 33.3% | 51.7% | 15.0% | 89.1±57.7 | 0.22 | 0.036 | 0.677 | 0.03 | 0.98 | 0.18 | 1.54 | -0.160 | 0.448 | 0.448 | balance,timeouts,utilisation |
| KABMNQGR | 60 | 15 | 26 | 19 | 0.467 | 0.372–0.562 | -23 ±61 | 56.7% | 41.7% | 1.7% | 73.4±38.8 | 0.34 | 0.018 | 0.638 | 0.07 | 0.95 | 0.22 | 0.95 | 0.073 | 0.478 | 0.478 | balance,duration,utilisation |
| QRNMAGKB | 60 | 14 | 37 | 9 | 0.542 | 0.464–0.619 | +29 ±58 | 38.3% | 56.7% | 5.0% | 66.5±49.4 | 0.23 | 0.057 | 0.668 | 0.04 | 0.96 | 0.19 | 1.17 | -0.120 | 0.448 | 0.448 | balance,duration,utilisation |
| NABMQKRG | 60 | 13 | 29 | 18 | 0.458 | 0.368–0.549 | -29 ±59 | 51.7% | 40.0% | 8.3% | 83.1±58.6 | 0.31 | 0.032 | 0.642 | 0.06 | 0.96 | 0.22 | 1.84 | 0.013 | 0.475 | 0.475 | balance,timeouts,utilisation |
| KGMAQNRB | 60 | 17 | 32 | 11 | 0.550 | 0.465–0.635 | +35 ±58 | 46.7% | 45.0% | 8.3% | 101.1±50.6 | 0.32 | 0.024 | 0.677 | 0.06 | 0.97 | 0.18 | 1.61 | -0.046 | 0.480 | 0.480 | balance,timeouts,utilisation |
| RMGQAKNB | 60 | 15 | 36 | 9 | 0.550 | 0.471–0.629 | +35 ±47 | 40.0% | 58.3% | 1.7% | 66.4±40.7 | 0.29 | 0.065 | 0.693 | 0.07 | 0.97 | 0.22 | 1.00 | -0.113 | 0.466 | 0.466 | balance,duration,utilisation,drawRate |
| NQGBKRMA | 60 | 20 | 26 | 14 | 0.550 | 0.456–0.644 | +35 ±53 | 56.7% | 36.7% | 6.7% | 80.8±50.7 | 0.29 | 0.010 | 0.606 | 0.01 | 0.96 | 0.23 | 2.11 | 0.054 | 0.466 | 0.466 | balance,timeouts,utilisation |
| GKRQNBMA | 60 | 19 | 29 | 12 | 0.558 | 0.469–0.648 | +41 ±61 | 51.7% | 45.0% | 3.3% | 81.0±42.4 | 0.40 | 0.034 | 0.674 | 0.11 | 0.97 | 0.21 | 1.42 | -0.006 | 0.502 | 0.502 | balance,utilisation |
| ARGMBKNQ | 60 | 18 | 32 | 10 | 0.567 | 0.482–0.651 | +47 ±49 | 46.7% | 51.7% | 1.7% | 74.6±39.0 | 0.30 | 0.028 | 0.679 | 0.05 | 0.97 | 0.23 | 1.18 | -0.066 | 0.473 | 0.473 | balance,duration,utilisation |
| KARGNBMQ | 60 | 25 | 18 | 17 | 0.567 | 0.462–0.671 | +47 ±54 | 70.0% | 26.7% | 3.3% | 82.4±48.3 | 0.33 | 0.014 | 0.614 | 0.02 | 0.96 | 0.23 | 2.42 | 0.167 | 0.483 | 0.483 | balance,utilisation |
| BQKMARGN | 60 | 18 | 32 | 10 | 0.567 | 0.482–0.651 | +47 ±42 | 46.7% | 48.3% | 5.0% | 85.7±54.4 | 0.27 | 0.026 | 0.618 | 0.02 | 0.97 | 0.23 | 2.26 | -0.066 | 0.457 | 0.457 | balance,utilisation |
| RKMQNBGA | 60 | 21 | 27 | 12 | 0.575 | 0.483–0.667 | +53 ±43 | 55.0% | 45.0% | 0.0% | 61.8±47.6 | 0.34 | 0.036 | 0.622 | 0.02 | 0.92 | 0.24 | 1.39 | 0.007 | 0.470 | 0.470 | balance,duration,utilisation |
| BGMQNARK | 60 | 18 | 33 | 9 | 0.575 | 0.492–0.658 | +53 ±55 | 45.0% | 50.0% | 5.0% | 84.5±47.4 | 0.32 | 0.030 | 0.687 | 0.06 | 0.97 | 0.19 | 1.58 | -0.093 | 0.478 | 0.478 | balance,utilisation |
| RBMAGNQK | 60 | 22 | 25 | 13 | 0.575 | 0.480–0.670 | +53 ±59 | 58.3% | 36.7% | 5.0% | 90.4±46.8 | 0.36 | 0.027 | 0.657 | 0.07 | 0.97 | 0.20 | 1.57 | 0.041 | 0.491 | 0.491 | balance,utilisation |
| ANBKGRQM | 60 | 17 | 36 | 7 | 0.583 | 0.506–0.661 | +58 ±57 | 40.0% | 56.7% | 3.3% | 77.4±45.9 | 0.30 | 0.030 | 0.683 | 0.06 | 0.97 | 0.15 | 1.51 | -0.153 | 0.470 | 0.470 | balance,utilisation |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| MABNKGQR | 60 | 22 | 15 | 23 | 0.492 | 0.382–0.601 | -6 ±81 | 75.0% | 20.0% | 5.0% | 74.3±50.6 | 0.42 | 0.012 | 0.637 | 0.09 | 0.95 | 0.27 | 1.26 | 0.286 | 0.520 | 0.520 | duration |
| GKRQNBMA | 60 | 19 | 29 | 12 | 0.558 | 0.469–0.648 | +41 ±61 | 51.7% | 45.0% | 3.3% | 81.0±42.4 | 0.40 | 0.034 | 0.674 | 0.11 | 0.97 | 0.21 | 1.42 | -0.006 | 0.502 | 0.502 | balance,utilisation |
| BKQRGMNA | 60 | 15 | 28 | 17 | 0.483 | 0.391–0.576 | -12 ±64 | 53.3% | 43.3% | 3.3% | 76.3±44.0 | 0.39 | 0.049 | 0.689 | 0.07 | 0.97 | 0.22 | 1.56 | 0.060 | 0.499 | 0.499 | utilisation |
| RBMAGNQK | 60 | 22 | 25 | 13 | 0.575 | 0.480–0.670 | +53 ±59 | 58.3% | 36.7% | 5.0% | 90.4±46.8 | 0.36 | 0.027 | 0.657 | 0.07 | 0.97 | 0.20 | 1.57 | 0.041 | 0.491 | 0.491 | balance,utilisation |
| NQKGMARB | 60 | 19 | 26 | 15 | 0.533 | 0.438–0.628 | +23 ±53 | 56.7% | 35.0% | 8.3% | 87.0±46.4 | 0.36 | 0.015 | 0.651 | 0.03 | 0.97 | 0.21 | 1.69 | 0.073 | 0.490 | 0.490 | balance,timeouts,utilisation |
| KARGNBMQ | 60 | 25 | 18 | 17 | 0.567 | 0.462–0.671 | +47 ±54 | 70.0% | 26.7% | 3.3% | 82.4±48.3 | 0.33 | 0.014 | 0.614 | 0.02 | 0.96 | 0.23 | 2.42 | 0.167 | 0.483 | 0.483 | balance,utilisation |
| QNRMGAKB | 60 | 17 | 27 | 16 | 0.508 | 0.415–0.602 | +6 ±54 | 55.0% | 43.3% | 1.7% | 74.1±39.6 | 0.32 | 0.039 | 0.664 | 0.05 | 0.97 | 0.23 | 1.14 | 0.086 | 0.482 | 0.482 | duration,utilisation |
| NGMQABKR | 60 | 21 | 30 | 9 | 0.600 | 0.514–0.686 | +70 ±62 | 50.0% | 48.3% | 1.7% | 80.1±40.5 | 0.34 | 0.054 | 0.686 | 0.08 | 0.97 | 0.20 | 1.28 | -0.072 | 0.482 | 0.482 | balance,utilisation |
| KGMAQNRB | 60 | 17 | 32 | 11 | 0.550 | 0.465–0.635 | +35 ±58 | 46.7% | 45.0% | 8.3% | 101.1±50.6 | 0.32 | 0.024 | 0.677 | 0.06 | 0.97 | 0.18 | 1.61 | -0.046 | 0.480 | 0.480 | balance,timeouts,utilisation |
| KABMNQGR | 60 | 15 | 26 | 19 | 0.467 | 0.372–0.562 | -23 ±61 | 56.7% | 41.7% | 1.7% | 73.4±38.8 | 0.34 | 0.018 | 0.638 | 0.07 | 0.95 | 0.22 | 0.95 | 0.073 | 0.478 | 0.478 | balance,duration,utilisation |
| BGMQNARK | 60 | 18 | 33 | 9 | 0.575 | 0.492–0.658 | +53 ±55 | 45.0% | 50.0% | 5.0% | 84.5±47.4 | 0.32 | 0.030 | 0.687 | 0.06 | 0.97 | 0.19 | 1.58 | -0.093 | 0.478 | 0.478 | balance,utilisation |
| NKMQRABG | 60 | 20 | 22 | 18 | 0.517 | 0.416–0.617 | +12 ±47 | 63.3% | 35.0% | 1.7% | 71.8±41.7 | 0.30 | 0.004 | 0.616 | 0.01 | 0.96 | 0.24 | 1.41 | 0.160 | 0.477 | 0.477 | duration,utilisation |
| ABGMKQRN | 60 | 23 | 25 | 12 | 0.592 | 0.498–0.685 | +64 ±56 | 58.3% | 35.0% | 6.7% | 74.2±52.7 | 0.33 | 0.013 | 0.608 | 0.03 | 0.97 | 0.22 | 1.24 | 0.021 | 0.476 | 0.476 | balance,timeouts,duration,utilisation |
| RGKBANQM | 60 | 18 | 25 | 17 | 0.508 | 0.412–0.605 | +6 ±62 | 58.3% | 35.0% | 6.7% | 80.1±55.3 | 0.31 | 0.030 | 0.633 | 0.03 | 0.95 | 0.20 | 2.28 | 0.120 | 0.476 | 0.476 | timeouts,utilisation |
| NABMQKRG | 60 | 13 | 29 | 18 | 0.458 | 0.368–0.549 | -29 ±59 | 51.7% | 40.0% | 8.3% | 83.1±58.6 | 0.31 | 0.032 | 0.642 | 0.06 | 0.96 | 0.22 | 1.84 | 0.013 | 0.475 | 0.475 | balance,timeouts,utilisation |
| ARGMBKNQ | 60 | 18 | 32 | 10 | 0.567 | 0.482–0.651 | +47 ±49 | 46.7% | 51.7% | 1.7% | 74.6±39.0 | 0.30 | 0.028 | 0.679 | 0.05 | 0.97 | 0.23 | 1.18 | -0.066 | 0.473 | 0.473 | balance,duration,utilisation |
| RQMBAKGN | 60 | 21 | 30 | 9 | 0.600 | 0.514–0.686 | +70 ±60 | 50.0% | 48.3% | 1.7% | 81.5±44.5 | 0.30 | 0.012 | 0.628 | 0.08 | 0.97 | 0.22 | 1.14 | -0.072 | 0.473 | 0.473 | balance,utilisation |
| RKMQNBGA | 60 | 21 | 27 | 12 | 0.575 | 0.483–0.667 | +53 ±43 | 55.0% | 45.0% | 0.0% | 61.8±47.6 | 0.34 | 0.036 | 0.622 | 0.02 | 0.92 | 0.24 | 1.39 | 0.007 | 0.470 | 0.470 | balance,duration,utilisation |
| ANBKGRQM | 60 | 17 | 36 | 7 | 0.583 | 0.506–0.661 | +58 ±57 | 40.0% | 56.7% | 3.3% | 77.4±45.9 | 0.30 | 0.030 | 0.683 | 0.06 | 0.97 | 0.15 | 1.51 | -0.153 | 0.470 | 0.470 | balance,utilisation |
| RQBMGNKA | 60 | 11 | 37 | 12 | 0.492 | 0.413–0.570 | -6 ±46 | 38.3% | 58.3% | 3.3% | 65.9±42.8 | 0.29 | 0.064 | 0.700 | 0.06 | 0.97 | 0.17 | 1.84 | -0.080 | 0.469 | 0.469 | duration,utilisation,drawRate |
| KBMQNGRA | 60 | 10 | 36 | 14 | 0.467 | 0.387–0.546 | -23 ±53 | 40.0% | 60.0% | 0.0% | 73.8±39.5 | 0.29 | 0.066 | 0.696 | 0.07 | 0.97 | 0.20 | 1.05 | -0.093 | 0.469 | 0.469 | balance,duration,utilisation,drawRate |
| MNRGKQBA | 60 | 13 | 36 | 11 | 0.517 | 0.437–0.597 | +12 ±56 | 40.0% | 56.7% | 3.3% | 76.6±48.9 | 0.30 | 0.086 | 0.689 | 0.07 | 0.97 | 0.20 | 1.31 | -0.074 | 0.468 | 0.468 | utilisation |
| RMGQAKNB | 60 | 15 | 36 | 9 | 0.550 | 0.471–0.629 | +35 ±47 | 40.0% | 58.3% | 1.7% | 66.4±40.7 | 0.29 | 0.065 | 0.693 | 0.07 | 0.97 | 0.22 | 1.00 | -0.113 | 0.466 | 0.466 | balance,duration,utilisation,drawRate |
| NQGBKRMA | 60 | 20 | 26 | 14 | 0.550 | 0.456–0.644 | +35 ±53 | 56.7% | 36.7% | 6.7% | 80.8±50.7 | 0.29 | 0.010 | 0.606 | 0.01 | 0.96 | 0.23 | 2.11 | 0.054 | 0.466 | 0.466 | balance,timeouts,utilisation |
| BQKMARGN | 60 | 18 | 32 | 10 | 0.567 | 0.482–0.651 | +47 ±42 | 46.7% | 48.3% | 5.0% | 85.7±54.4 | 0.27 | 0.026 | 0.618 | 0.02 | 0.97 | 0.23 | 2.26 | -0.066 | 0.457 | 0.457 | balance,utilisation |

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
