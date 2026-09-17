# Sim report — b3-paladin2

2000 games. White score **0.581** (95% 0.562–0.600),
white advantage **+57 ± 13 Elo**.
Decisive 80.4% · draws 18.4% · capped 1.1% (counted apart, never as draws).
Plies: mean 95.3 ± 50.0, median 82. Rules: all defaults.

No complete colour-swapped pairs in this run.
σ_pg 0.4410 · normalized Elo +64 · LOS 100.0% ·
SPRT LLR 3.97 against ±2.94 (nElo 0 vs 4) → **H1**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 2000 | 966 | 392 | 642 | 0.581 | 0.562–0.600 | +57 ±13 | 80.4% | 18.4% | 1.1% | 95.3±50.0 | 0.33 | 0.023 | 0.613 | 0.10 | 0.97 | 0.46 | 1.14 | 0.000 | 0.481 | 0.481 | balance |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | B | Q | R | L | K | P |
|---|---|---|---|---|---|---|
| use | 1.23 | 2.04 | 1.55 | 1.14 | 2.40 | 0.46 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 1608 | 80.4% |
| adjudicatedDraw | 270 | 13.5% |
| drawRepetition | 76 | 3.8% |
| plyCap | 23 | 1.1% |
| drawMaterial | 14 | 0.7% |
| draw50 | 8 | 0.4% |
| stalemate | 1 | 0.1% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| P | 44217 | 8837 | 16006 | 32000 | 15448 | 48.3% |
| R | 36910 | 6047 | 4642 | 8000 | 3358 | 42.0% |
| B | 29282 | 5979 | 5995 | 8000 | 2005 | 25.1% |
| K | 28622 | 1977 | 0 | 4000 | 4000 | 100.0% |
| L | 27231 | 4855 | 2450 | 8000 | 698 | 8.7% |
| Q | 24297 | 4065 | 2660 | 4000 | 1854 | 46.4% |
| G | 128 | 7 | 5 | 0 | 15 | 0.0% |
| N | 2 | 0 | 8 | 0 | 0 | 0.0% |
| A | 0 | 0 | 1 | 0 | 0 | 0.0% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 0 | 0.00 |
| beastChainMoves | 0 | 0.00 |
| beastChainCaptures | 0 | 0.00 |
| maesterSwaps | 0 | 0.00 |
| maesterLongSwaps | 0 | 0.00 |
| paladinSacrifices | 4855 | 2.43 |
| promotions | 546 | 0.27 |
| checks | 11251 | 5.63 |

## Degeneracy counters
| counter | value |
|---|---|
| guard captures per game | 0.004 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 22 (1.1%) |
| games where a king never moved | 476 (23.8%) |

## Interest terms, residualised on draw rate
Each term minus what this run's `term ~ a + b·drawRate` line predicts from the arrangement's draw
rate. The mean over the arrangements is 0 by construction, so read differences between pools, never
levels. Overall row, fitted on the 20 arrangements:
| killerMove | leadChange | uncertaintyLate | drama | permanence | fairyUse | excessDecisiveness | interest | interestMinFairy |
|---|---|---|---|---|---|---|---|---|
| 0.000 | 0.000 | -0.000 | -0.000 | -0.000 | 0.000 | -0.000 | 0.000 | 0.000 |

## Balance axis — back ranks by |white score − 0.5| (ascending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| LRQBBLRK | 100 | 45 | 12 | 43 | 0.510 | 0.418–0.602 | +7 ±64 | 88.0% | 10.0% | 2.0% | 100.0±54.0 | 0.36 | 0.018 | 0.606 | 0.11 | 0.97 | 0.45 | 1.21 | 0.077 | 0.493 | 0.493 | - |
| BRLLKQRB | 100 | 39 | 25 | 36 | 0.515 | 0.430–0.600 | +10 ±59 | 75.0% | 24.0% | 1.0% | 98.7±47.6 | 0.29 | 0.025 | 0.614 | 0.10 | 0.97 | 0.48 | 1.27 | -0.053 | 0.472 | 0.472 | - |
| RBKLLRBQ | 100 | 43 | 23 | 34 | 0.545 | 0.459–0.631 | +31 ±59 | 77.0% | 22.0% | 1.0% | 94.1±48.3 | 0.29 | 0.024 | 0.629 | 0.09 | 0.97 | 0.45 | 1.16 | -0.034 | 0.474 | 0.474 | balance |
| BLRRLBQK | 100 | 48 | 14 | 38 | 0.550 | 0.460–0.640 | +35 ±63 | 86.0% | 14.0% | 0.0% | 91.0±44.9 | 0.36 | 0.017 | 0.606 | 0.13 | 0.97 | 0.47 | 1.04 | 0.056 | 0.494 | 0.494 | balance |
| KBBRLQRL | 100 | 44 | 23 | 33 | 0.555 | 0.470–0.640 | +38 ±59 | 77.0% | 20.0% | 3.0% | 96.9±58.2 | 0.33 | 0.034 | 0.613 | 0.11 | 0.97 | 0.44 | 1.03 | -0.034 | 0.480 | 0.480 | balance |
| RKBLRBQL | 100 | 43 | 25 | 32 | 0.555 | 0.471–0.639 | +38 ±58 | 75.0% | 23.0% | 2.0% | 93.9±52.3 | 0.32 | 0.018 | 0.618 | 0.12 | 0.97 | 0.48 | 1.18 | -0.054 | 0.481 | 0.481 | balance |
| QBLRLRBK | 100 | 51 | 13 | 36 | 0.575 | 0.485–0.665 | +53 ±63 | 87.0% | 12.0% | 1.0% | 93.0±47.7 | 0.33 | 0.022 | 0.613 | 0.12 | 0.97 | 0.49 | 1.09 | 0.066 | 0.488 | 0.488 | balance |
| RQBBKLRL | 100 | 51 | 13 | 36 | 0.575 | 0.485–0.665 | +53 ±63 | 87.0% | 12.0% | 1.0% | 92.9±47.5 | 0.32 | 0.025 | 0.607 | 0.11 | 0.97 | 0.46 | 1.10 | 0.066 | 0.485 | 0.485 | balance |
| LQBBRLKR | 100 | 45 | 26 | 29 | 0.580 | 0.497–0.663 | +56 ±58 | 74.0% | 26.0% | 0.0% | 93.0±42.3 | 0.29 | 0.021 | 0.622 | 0.09 | 0.97 | 0.47 | 1.18 | -0.064 | 0.471 | 0.471 | balance |
| RRBBLKLQ | 100 | 47 | 22 | 31 | 0.580 | 0.495–0.665 | +56 ±59 | 78.0% | 20.0% | 2.0% | 98.8±51.1 | 0.30 | 0.027 | 0.617 | 0.08 | 0.97 | 0.44 | 1.29 | -0.024 | 0.472 | 0.472 | balance |
| BBKQLRRL | 100 | 48 | 21 | 31 | 0.585 | 0.500–0.670 | +60 ±59 | 79.0% | 20.0% | 1.0% | 96.4±53.4 | 0.31 | 0.021 | 0.616 | 0.09 | 0.97 | 0.48 | 1.07 | -0.014 | 0.477 | 0.477 | balance |
| KQLLBBRR | 100 | 47 | 23 | 30 | 0.585 | 0.501–0.669 | +60 ±59 | 77.0% | 21.0% | 2.0% | 100.5±49.3 | 0.35 | 0.026 | 0.620 | 0.09 | 0.97 | 0.45 | 1.06 | -0.034 | 0.484 | 0.484 | balance |
| KLLBRQBR | 100 | 50 | 19 | 31 | 0.595 | 0.509–0.681 | +67 ±60 | 81.0% | 18.0% | 1.0% | 91.9±50.7 | 0.34 | 0.020 | 0.611 | 0.10 | 0.97 | 0.46 | 1.05 | 0.006 | 0.483 | 0.483 | balance |
| KBBRRLLQ | 100 | 52 | 16 | 32 | 0.600 | 0.512–0.688 | +70 ±61 | 84.0% | 15.0% | 1.0% | 91.0±47.6 | 0.33 | 0.027 | 0.609 | 0.11 | 0.97 | 0.47 | 1.15 | 0.036 | 0.484 | 0.484 | balance |
| BQRLKBLR | 100 | 53 | 15 | 32 | 0.605 | 0.517–0.693 | +74 ±61 | 85.0% | 14.0% | 1.0% | 107.0±61.7 | 0.34 | 0.026 | 0.610 | 0.11 | 0.97 | 0.42 | 1.15 | 0.046 | 0.487 | 0.487 | balance |
| RKRBLQBL | 100 | 46 | 29 | 25 | 0.605 | 0.525–0.685 | +74 ±56 | 71.0% | 27.0% | 2.0% | 95.8±52.8 | 0.33 | 0.022 | 0.622 | 0.07 | 0.97 | 0.45 | 1.16 | -0.094 | 0.474 | 0.474 | balance,drawRate |
| KBRRLLBQ | 100 | 56 | 12 | 32 | 0.620 | 0.531–0.709 | +85 ±62 | 88.0% | 11.0% | 1.0% | 90.7±49.4 | 0.39 | 0.024 | 0.611 | 0.13 | 0.97 | 0.48 | 1.21 | 0.076 | 0.501 | 0.501 | balance |
| BLKLRBRQ | 100 | 53 | 18 | 29 | 0.620 | 0.534–0.706 | +85 ±59 | 82.0% | 18.0% | 0.0% | 94.0±47.1 | 0.33 | 0.020 | 0.604 | 0.09 | 0.97 | 0.49 | 1.05 | 0.016 | 0.481 | 0.481 | balance |
| QLLBKRBR | 100 | 52 | 21 | 27 | 0.625 | 0.541–0.709 | +89 ±58 | 79.0% | 20.0% | 1.0% | 92.5±41.9 | 0.33 | 0.019 | 0.605 | 0.09 | 0.97 | 0.47 | 1.29 | -0.014 | 0.479 | 0.479 | balance |
| QLLRBKRB | 100 | 53 | 22 | 25 | 0.640 | 0.558–0.722 | +100 ±57 | 78.0% | 22.0% | 0.0% | 94.9±45.0 | 0.25 | 0.019 | 0.597 | 0.07 | 0.97 | 0.49 | 1.09 | -0.025 | 0.460 | 0.460 | balance |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| KBRRLLBQ | 100 | 56 | 12 | 32 | 0.620 | 0.531–0.709 | +85 ±62 | 88.0% | 11.0% | 1.0% | 90.7±49.4 | 0.39 | 0.024 | 0.611 | 0.13 | 0.97 | 0.48 | 1.21 | 0.076 | 0.501 | 0.501 | balance |
| BLRRLBQK | 100 | 48 | 14 | 38 | 0.550 | 0.460–0.640 | +35 ±63 | 86.0% | 14.0% | 0.0% | 91.0±44.9 | 0.36 | 0.017 | 0.606 | 0.13 | 0.97 | 0.47 | 1.04 | 0.056 | 0.494 | 0.494 | balance |
| LRQBBLRK | 100 | 45 | 12 | 43 | 0.510 | 0.418–0.602 | +7 ±64 | 88.0% | 10.0% | 2.0% | 100.0±54.0 | 0.36 | 0.018 | 0.606 | 0.11 | 0.97 | 0.45 | 1.21 | 0.077 | 0.493 | 0.493 | - |
| QBLRLRBK | 100 | 51 | 13 | 36 | 0.575 | 0.485–0.665 | +53 ±63 | 87.0% | 12.0% | 1.0% | 93.0±47.7 | 0.33 | 0.022 | 0.613 | 0.12 | 0.97 | 0.49 | 1.09 | 0.066 | 0.488 | 0.488 | balance |
| BQRLKBLR | 100 | 53 | 15 | 32 | 0.605 | 0.517–0.693 | +74 ±61 | 85.0% | 14.0% | 1.0% | 107.0±61.7 | 0.34 | 0.026 | 0.610 | 0.11 | 0.97 | 0.42 | 1.15 | 0.046 | 0.487 | 0.487 | balance |
| RQBBKLRL | 100 | 51 | 13 | 36 | 0.575 | 0.485–0.665 | +53 ±63 | 87.0% | 12.0% | 1.0% | 92.9±47.5 | 0.32 | 0.025 | 0.607 | 0.11 | 0.97 | 0.46 | 1.10 | 0.066 | 0.485 | 0.485 | balance |
| KQLLBBRR | 100 | 47 | 23 | 30 | 0.585 | 0.501–0.669 | +60 ±59 | 77.0% | 21.0% | 2.0% | 100.5±49.3 | 0.35 | 0.026 | 0.620 | 0.09 | 0.97 | 0.45 | 1.06 | -0.034 | 0.484 | 0.484 | balance |
| KBBRRLLQ | 100 | 52 | 16 | 32 | 0.600 | 0.512–0.688 | +70 ±61 | 84.0% | 15.0% | 1.0% | 91.0±47.6 | 0.33 | 0.027 | 0.609 | 0.11 | 0.97 | 0.47 | 1.15 | 0.036 | 0.484 | 0.484 | balance |
| KLLBRQBR | 100 | 50 | 19 | 31 | 0.595 | 0.509–0.681 | +67 ±60 | 81.0% | 18.0% | 1.0% | 91.9±50.7 | 0.34 | 0.020 | 0.611 | 0.10 | 0.97 | 0.46 | 1.05 | 0.006 | 0.483 | 0.483 | balance |
| BLKLRBRQ | 100 | 53 | 18 | 29 | 0.620 | 0.534–0.706 | +85 ±59 | 82.0% | 18.0% | 0.0% | 94.0±47.1 | 0.33 | 0.020 | 0.604 | 0.09 | 0.97 | 0.49 | 1.05 | 0.016 | 0.481 | 0.481 | balance |
| RKBLRBQL | 100 | 43 | 25 | 32 | 0.555 | 0.471–0.639 | +38 ±58 | 75.0% | 23.0% | 2.0% | 93.9±52.3 | 0.32 | 0.018 | 0.618 | 0.12 | 0.97 | 0.48 | 1.18 | -0.054 | 0.481 | 0.481 | balance |
| KBBRLQRL | 100 | 44 | 23 | 33 | 0.555 | 0.470–0.640 | +38 ±59 | 77.0% | 20.0% | 3.0% | 96.9±58.2 | 0.33 | 0.034 | 0.613 | 0.11 | 0.97 | 0.44 | 1.03 | -0.034 | 0.480 | 0.480 | balance |
| QLLBKRBR | 100 | 52 | 21 | 27 | 0.625 | 0.541–0.709 | +89 ±58 | 79.0% | 20.0% | 1.0% | 92.5±41.9 | 0.33 | 0.019 | 0.605 | 0.09 | 0.97 | 0.47 | 1.29 | -0.014 | 0.479 | 0.479 | balance |
| BBKQLRRL | 100 | 48 | 21 | 31 | 0.585 | 0.500–0.670 | +60 ±59 | 79.0% | 20.0% | 1.0% | 96.4±53.4 | 0.31 | 0.021 | 0.616 | 0.09 | 0.97 | 0.48 | 1.07 | -0.014 | 0.477 | 0.477 | balance |
| RBKLLRBQ | 100 | 43 | 23 | 34 | 0.545 | 0.459–0.631 | +31 ±59 | 77.0% | 22.0% | 1.0% | 94.1±48.3 | 0.29 | 0.024 | 0.629 | 0.09 | 0.97 | 0.45 | 1.16 | -0.034 | 0.474 | 0.474 | balance |
| RKRBLQBL | 100 | 46 | 29 | 25 | 0.605 | 0.525–0.685 | +74 ±56 | 71.0% | 27.0% | 2.0% | 95.8±52.8 | 0.33 | 0.022 | 0.622 | 0.07 | 0.97 | 0.45 | 1.16 | -0.094 | 0.474 | 0.474 | balance,drawRate |
| RRBBLKLQ | 100 | 47 | 22 | 31 | 0.580 | 0.495–0.665 | +56 ±59 | 78.0% | 20.0% | 2.0% | 98.8±51.1 | 0.30 | 0.027 | 0.617 | 0.08 | 0.97 | 0.44 | 1.29 | -0.024 | 0.472 | 0.472 | balance |
| BRLLKQRB | 100 | 39 | 25 | 36 | 0.515 | 0.430–0.600 | +10 ±59 | 75.0% | 24.0% | 1.0% | 98.7±47.6 | 0.29 | 0.025 | 0.614 | 0.10 | 0.97 | 0.48 | 1.27 | -0.053 | 0.472 | 0.472 | - |
| LQBBRLKR | 100 | 45 | 26 | 29 | 0.580 | 0.497–0.663 | +56 ±58 | 74.0% | 26.0% | 0.0% | 93.0±42.3 | 0.29 | 0.021 | 0.622 | 0.09 | 0.97 | 0.47 | 1.18 | -0.064 | 0.471 | 0.471 | balance |
| QLLRBKRB | 100 | 53 | 22 | 25 | 0.640 | 0.558–0.722 | +100 ±57 | 78.0% | 22.0% | 0.0% | 94.9±45.0 | 0.25 | 0.019 | 0.597 | 0.07 | 0.97 | 0.49 | 1.09 | -0.025 | 0.460 | 0.460 | balance |

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
