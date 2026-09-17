# Sim report — b3-rule-noLongSwap

2000 games. White score **0.536** (95% 0.519–0.553),
white advantage **+25 ± 12 Elo**.
Decisive 60.3% · draws 31.1% · capped 8.6% (counted apart, never as draws).
Plies: mean 139.8 ± 76.3, median 119. Rules changed from the defaults: `maesterLongSwap=false`.

No complete colour-swapped pairs in this run.
σ_pg 0.3866 · normalized Elo +32 · LOS 100.0% ·
SPRT LLR 2.00 against ±2.94 (nElo 0 vs 4) → **continue**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 2000 | 675 | 794 | 531 | 0.536 | 0.519–0.553 | +25 ±12 | 60.3% | 31.1% | 8.6% | 139.8±76.3 | 0.28 | 0.023 | 0.626 | 0.08 | 0.98 | 0.33 | 1.69 | 0.000 | 0.473 | 0.472 | balance,timeouts |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | L | Q | B | G | A | M | K | R | P |
|---|---|---|---|---|---|---|---|---|---|
| use | 1.00 | 1.55 | 1.10 | 2.46 | 1.59 | 1.73 | 2.24 | 1.67 | 0.33 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 1206 | 60.3% |
| adjudicatedDraw | 488 | 24.4% |
| plyCap | 173 | 8.6% |
| drawRepetition | 67 | 3.4% |
| draw50 | 38 | 1.9% |
| drawMaterial | 28 | 1.4% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| P | 46541 | 8200 | 19171 | 32000 | 12380 | 38.7% |
| G | 42991 | 2330 | 333 | 4000 | 3679 | 92.0% |
| K | 39139 | 2508 | 0 | 4000 | 4000 | 100.0% |
| M | 30184 | 3198 | 2546 | 4000 | 1454 | 36.4% |
| R | 29172 | 3428 | 2266 | 4000 | 1736 | 43.4% |
| A | 27853 | 4036 | 2964 | 4000 | 1037 | 25.9% |
| Q | 27082 | 4379 | 3156 | 4000 | 1274 | 31.9% |
| B | 19166 | 3982 | 3244 | 4000 | 756 | 18.9% |
| L | 17434 | 2586 | 967 | 4000 | 451 | 11.3% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 4036 | 2.02 |
| beastChainMoves | 0 | 0.00 |
| beastChainCaptures | 0 | 0.00 |
| maesterSwaps | 12212 | 6.11 |
| maesterLongSwaps | 1742 | 0.87 |
| paladinSacrifices | 2586 | 1.29 |
| promotions | 449 | 0.22 |
| checks | 15551 | 7.78 |

## Degeneracy counters
| counter | value |
|---|---|
| guard captures per game | 1.165 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 66 (3.3%) |
| games where a king never moved | 356 (17.8%) |

## Interest terms, residualised on draw rate
Each term minus what this run's `term ~ a + b·drawRate` line predicts from the arrangement's draw
rate. The mean over the arrangements is 0 by construction, so read differences between pools, never
levels. Overall row, fitted on the 20 arrangements:
| killerMove | leadChange | uncertaintyLate | drama | permanence | fairyUse | excessDecisiveness | interest | interestMinFairy |
|---|---|---|---|---|---|---|---|---|
| 0.000 | 0.000 | -0.000 | 0.000 | -0.000 | 0.000 | 0.000 | 0.000 | 0.007 |

## Balance axis — back ranks by |white score − 0.5| (ascending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| QARLMGBK | 100 | 28 | 44 | 28 | 0.500 | 0.427–0.573 | +0 ±51 | 56.0% | 39.0% | 5.0% | 125.9±66.1 | 0.25 | 0.023 | 0.639 | 0.08 | 0.98 | 0.36 | 1.69 | -0.042 | 0.464 | 0.464 | drawRate |
| GBRLQKMA | 100 | 31 | 39 | 30 | 0.505 | 0.428–0.582 | +3 ±53 | 61.0% | 34.0% | 5.0% | 128.6±63.4 | 0.24 | 0.034 | 0.636 | 0.09 | 0.98 | 0.38 | 1.64 | 0.008 | 0.464 | 0.464 | - |
| RKQBMLGA | 100 | 30 | 39 | 31 | 0.495 | 0.418–0.572 | -3 ±53 | 61.0% | 29.0% | 10.0% | 146.0±78.9 | 0.30 | 0.025 | 0.630 | 0.08 | 0.98 | 0.34 | 1.71 | 0.008 | 0.477 | 0.477 | timeouts |
| QBALRGMK | 100 | 28 | 46 | 26 | 0.510 | 0.438–0.582 | +7 ±50 | 54.0% | 38.0% | 8.0% | 132.8±73.1 | 0.28 | 0.023 | 0.637 | 0.07 | 0.98 | 0.35 | 1.62 | -0.062 | 0.469 | 0.468 | timeouts |
| GMQRLKBA | 100 | 27 | 43 | 30 | 0.485 | 0.411–0.559 | -10 ±51 | 57.0% | 35.0% | 8.0% | 135.1±77.2 | 0.29 | 0.025 | 0.630 | 0.07 | 0.98 | 0.34 | 1.73 | -0.033 | 0.470 | 0.470 | timeouts |
| BGAMLRQK | 100 | 34 | 28 | 38 | 0.480 | 0.397–0.563 | -14 ±58 | 72.0% | 22.0% | 6.0% | 126.0±72.8 | 0.32 | 0.025 | 0.616 | 0.09 | 0.97 | 0.36 | 1.71 | 0.117 | 0.485 | 0.482 | timeouts |
| RBAGQKML | 100 | 34 | 36 | 30 | 0.520 | 0.442–0.598 | +14 ±54 | 64.0% | 28.0% | 8.0% | 135.7±71.2 | 0.29 | 0.018 | 0.624 | 0.07 | 0.98 | 0.33 | 1.68 | 0.037 | 0.475 | 0.457 | timeouts |
| KGRMLBQA | 100 | 32 | 41 | 27 | 0.525 | 0.450–0.600 | +17 ±52 | 59.0% | 31.0% | 10.0% | 141.5±74.9 | 0.25 | 0.023 | 0.627 | 0.09 | 0.98 | 0.34 | 1.62 | -0.013 | 0.465 | 0.425 | timeouts |
| LGMQBAKR | 100 | 29 | 48 | 23 | 0.530 | 0.460–0.600 | +21 ±49 | 52.0% | 37.0% | 11.0% | 147.0±82.8 | 0.27 | 0.019 | 0.633 | 0.08 | 0.98 | 0.31 | 1.71 | -0.083 | 0.467 | 0.467 | balance,timeouts |
| AQRLMKBG | 100 | 32 | 30 | 38 | 0.470 | 0.388–0.552 | -21 ±57 | 70.0% | 24.0% | 6.0% | 136.8±73.9 | 0.30 | 0.022 | 0.621 | 0.10 | 0.98 | 0.35 | 1.67 | 0.097 | 0.484 | 0.484 | balance,timeouts |
| MGABKQRL | 100 | 37 | 35 | 28 | 0.545 | 0.466–0.624 | +31 ±55 | 65.0% | 20.0% | 15.0% | 150.4±81.4 | 0.33 | 0.026 | 0.620 | 0.11 | 0.98 | 0.31 | 1.65 | 0.047 | 0.487 | 0.472 | balance,timeouts |
| KQRBGAML | 100 | 35 | 40 | 25 | 0.550 | 0.475–0.625 | +35 ±52 | 60.0% | 32.0% | 8.0% | 140.7±78.3 | 0.31 | 0.022 | 0.629 | 0.07 | 0.98 | 0.32 | 1.70 | -0.003 | 0.477 | 0.477 | balance,timeouts |
| AMQRBKGL | 100 | 37 | 36 | 27 | 0.550 | 0.472–0.628 | +35 ±54 | 64.0% | 25.0% | 11.0% | 156.3±79.8 | 0.30 | 0.022 | 0.619 | 0.08 | 0.98 | 0.31 | 1.72 | 0.037 | 0.477 | 0.449 | balance,timeouts |
| KALBMQGR | 100 | 33 | 44 | 23 | 0.550 | 0.477–0.623 | +35 ±51 | 56.0% | 31.0% | 13.0% | 151.5±82.0 | 0.33 | 0.017 | 0.629 | 0.07 | 0.98 | 0.32 | 1.68 | -0.043 | 0.480 | 0.480 | balance,timeouts |
| MABLGKQR | 100 | 34 | 44 | 22 | 0.560 | 0.488–0.632 | +42 ±50 | 56.0% | 34.0% | 10.0% | 141.4±83.1 | 0.26 | 0.028 | 0.622 | 0.09 | 0.98 | 0.32 | 1.78 | -0.043 | 0.464 | 0.464 | balance,timeouts |
| AMQLGKRB | 100 | 35 | 45 | 20 | 0.575 | 0.504–0.646 | +53 ±49 | 55.0% | 32.0% | 13.0% | 149.1±82.6 | 0.27 | 0.024 | 0.614 | 0.05 | 0.98 | 0.31 | 1.75 | -0.053 | 0.462 | 0.462 | balance,timeouts |
| LQBGAMKR | 100 | 37 | 42 | 21 | 0.580 | 0.507–0.653 | +56 ±51 | 58.0% | 33.0% | 9.0% | 145.1±73.6 | 0.28 | 0.018 | 0.635 | 0.10 | 0.98 | 0.31 | 1.63 | -0.024 | 0.474 | 0.442 | balance,timeouts |
| GLRAMBQK | 100 | 37 | 43 | 20 | 0.585 | 0.513–0.657 | +60 ±50 | 57.0% | 35.0% | 8.0% | 146.2±77.4 | 0.26 | 0.021 | 0.622 | 0.06 | 0.98 | 0.32 | 1.72 | -0.034 | 0.463 | 0.454 | balance,timeouts |
| BLGRMAKQ | 100 | 42 | 33 | 25 | 0.585 | 0.507–0.663 | +60 ±55 | 67.0% | 29.0% | 4.0% | 133.3±68.2 | 0.29 | 0.025 | 0.627 | 0.12 | 0.98 | 0.36 | 1.75 | 0.066 | 0.481 | 0.481 | balance |
| AMRGQBKL | 100 | 43 | 38 | 19 | 0.620 | 0.547–0.693 | +85 ±51 | 62.0% | 33.0% | 5.0% | 126.1±70.8 | 0.28 | 0.020 | 0.620 | 0.08 | 0.98 | 0.36 | 1.73 | 0.016 | 0.471 | 0.471 | balance |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| MGABKQRL | 100 | 37 | 35 | 28 | 0.545 | 0.466–0.624 | +31 ±55 | 65.0% | 20.0% | 15.0% | 150.4±81.4 | 0.33 | 0.026 | 0.620 | 0.11 | 0.98 | 0.31 | 1.65 | 0.047 | 0.487 | 0.472 | balance,timeouts |
| BGAMLRQK | 100 | 34 | 28 | 38 | 0.480 | 0.397–0.563 | -14 ±58 | 72.0% | 22.0% | 6.0% | 126.0±72.8 | 0.32 | 0.025 | 0.616 | 0.09 | 0.97 | 0.36 | 1.71 | 0.117 | 0.485 | 0.482 | timeouts |
| AQRLMKBG | 100 | 32 | 30 | 38 | 0.470 | 0.388–0.552 | -21 ±57 | 70.0% | 24.0% | 6.0% | 136.8±73.9 | 0.30 | 0.022 | 0.621 | 0.10 | 0.98 | 0.35 | 1.67 | 0.097 | 0.484 | 0.484 | balance,timeouts |
| BLGRMAKQ | 100 | 42 | 33 | 25 | 0.585 | 0.507–0.663 | +60 ±55 | 67.0% | 29.0% | 4.0% | 133.3±68.2 | 0.29 | 0.025 | 0.627 | 0.12 | 0.98 | 0.36 | 1.75 | 0.066 | 0.481 | 0.481 | balance |
| KALBMQGR | 100 | 33 | 44 | 23 | 0.550 | 0.477–0.623 | +35 ±51 | 56.0% | 31.0% | 13.0% | 151.5±82.0 | 0.33 | 0.017 | 0.629 | 0.07 | 0.98 | 0.32 | 1.68 | -0.043 | 0.480 | 0.480 | balance,timeouts |
| KQRBGAML | 100 | 35 | 40 | 25 | 0.550 | 0.475–0.625 | +35 ±52 | 60.0% | 32.0% | 8.0% | 140.7±78.3 | 0.31 | 0.022 | 0.629 | 0.07 | 0.98 | 0.32 | 1.70 | -0.003 | 0.477 | 0.477 | balance,timeouts |
| AMQRBKGL | 100 | 37 | 36 | 27 | 0.550 | 0.472–0.628 | +35 ±54 | 64.0% | 25.0% | 11.0% | 156.3±79.8 | 0.30 | 0.022 | 0.619 | 0.08 | 0.98 | 0.31 | 1.72 | 0.037 | 0.477 | 0.449 | balance,timeouts |
| RKQBMLGA | 100 | 30 | 39 | 31 | 0.495 | 0.418–0.572 | -3 ±53 | 61.0% | 29.0% | 10.0% | 146.0±78.9 | 0.30 | 0.025 | 0.630 | 0.08 | 0.98 | 0.34 | 1.71 | 0.008 | 0.477 | 0.477 | timeouts |
| RBAGQKML | 100 | 34 | 36 | 30 | 0.520 | 0.442–0.598 | +14 ±54 | 64.0% | 28.0% | 8.0% | 135.7±71.2 | 0.29 | 0.018 | 0.624 | 0.07 | 0.98 | 0.33 | 1.68 | 0.037 | 0.475 | 0.457 | timeouts |
| LQBGAMKR | 100 | 37 | 42 | 21 | 0.580 | 0.507–0.653 | +56 ±51 | 58.0% | 33.0% | 9.0% | 145.1±73.6 | 0.28 | 0.018 | 0.635 | 0.10 | 0.98 | 0.31 | 1.63 | -0.024 | 0.474 | 0.442 | balance,timeouts |
| AMRGQBKL | 100 | 43 | 38 | 19 | 0.620 | 0.547–0.693 | +85 ±51 | 62.0% | 33.0% | 5.0% | 126.1±70.8 | 0.28 | 0.020 | 0.620 | 0.08 | 0.98 | 0.36 | 1.73 | 0.016 | 0.471 | 0.471 | balance |
| GMQRLKBA | 100 | 27 | 43 | 30 | 0.485 | 0.411–0.559 | -10 ±51 | 57.0% | 35.0% | 8.0% | 135.1±77.2 | 0.29 | 0.025 | 0.630 | 0.07 | 0.98 | 0.34 | 1.73 | -0.033 | 0.470 | 0.470 | timeouts |
| QBALRGMK | 100 | 28 | 46 | 26 | 0.510 | 0.438–0.582 | +7 ±50 | 54.0% | 38.0% | 8.0% | 132.8±73.1 | 0.28 | 0.023 | 0.637 | 0.07 | 0.98 | 0.35 | 1.62 | -0.062 | 0.469 | 0.468 | timeouts |
| LGMQBAKR | 100 | 29 | 48 | 23 | 0.530 | 0.460–0.600 | +21 ±49 | 52.0% | 37.0% | 11.0% | 147.0±82.8 | 0.27 | 0.019 | 0.633 | 0.08 | 0.98 | 0.31 | 1.71 | -0.083 | 0.467 | 0.467 | balance,timeouts |
| KGRMLBQA | 100 | 32 | 41 | 27 | 0.525 | 0.450–0.600 | +17 ±52 | 59.0% | 31.0% | 10.0% | 141.5±74.9 | 0.25 | 0.023 | 0.627 | 0.09 | 0.98 | 0.34 | 1.62 | -0.013 | 0.465 | 0.425 | timeouts |
| QARLMGBK | 100 | 28 | 44 | 28 | 0.500 | 0.427–0.573 | +0 ±51 | 56.0% | 39.0% | 5.0% | 125.9±66.1 | 0.25 | 0.023 | 0.639 | 0.08 | 0.98 | 0.36 | 1.69 | -0.042 | 0.464 | 0.464 | drawRate |
| GBRLQKMA | 100 | 31 | 39 | 30 | 0.505 | 0.428–0.582 | +3 ±53 | 61.0% | 34.0% | 5.0% | 128.6±63.4 | 0.24 | 0.034 | 0.636 | 0.09 | 0.98 | 0.38 | 1.64 | 0.008 | 0.464 | 0.464 | - |
| MABLGKQR | 100 | 34 | 44 | 22 | 0.560 | 0.488–0.632 | +42 ±50 | 56.0% | 34.0% | 10.0% | 141.4±83.1 | 0.26 | 0.028 | 0.622 | 0.09 | 0.98 | 0.32 | 1.78 | -0.043 | 0.464 | 0.464 | balance,timeouts |
| GLRAMBQK | 100 | 37 | 43 | 20 | 0.585 | 0.513–0.657 | +60 ±50 | 57.0% | 35.0% | 8.0% | 146.2±77.4 | 0.26 | 0.021 | 0.622 | 0.06 | 0.98 | 0.32 | 1.72 | -0.034 | 0.463 | 0.454 | balance,timeouts |
| AMQLGKRB | 100 | 35 | 45 | 20 | 0.575 | 0.504–0.646 | +53 ±49 | 55.0% | 32.0% | 13.0% | 149.1±82.6 | 0.27 | 0.024 | 0.614 | 0.05 | 0.98 | 0.31 | 1.75 | -0.053 | 0.462 | 0.462 | balance,timeouts |

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
