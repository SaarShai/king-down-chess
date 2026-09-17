# Sim report — gs-g2

800 games. White score **0.500** (95% 0.472–0.528),
white advantage **+0 ± 19 Elo**.
Decisive 63.5% · draws 33.4% · capped 3.1% (counted apart, never as draws).
Plies: mean 123.1 ± 64.5, median 107. Rules: all defaults.

No complete colour-swapped pairs in this run.
σ_pg 0.3984 · normalized Elo +0 · LOS 50.0% ·
SPRT LLR -0.05 against ±2.94 (nElo 0 vs 4) → **continue**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 800 | 254 | 292 | 254 | 0.500 | 0.472–0.528 | +0 ±19 | 63.5% | 33.4% | 3.1% | 123.1±64.5 | 0.34 | 0.077 | 0.658 | 0.12 | 0.96 | 0.45 | 1.59 | 0.024 | 0.484 | 0.484 | - |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | G | R | M | B | Q | K | P |
|---|---|---|---|---|---|---|---|
| use | 1.05 | 1.55 | 2.13 | 1.38 | 2.07 | 1.57 | 0.45 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 508 | 63.5% |
| adjudicatedDraw | 220 | 27.5% |
| plyCap | 25 | 3.1% |
| draw50 | 23 | 2.9% |
| drawRepetition | 15 | 1.9% |
| drawMaterial | 9 | 1.1% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| P | 22302 | 3595 | 7213 | 12800 | 5343 | 41.7% |
| R | 19134 | 3054 | 1912 | 3200 | 1288 | 40.3% |
| M | 13142 | 1313 | 1118 | 1600 | 482 | 30.1% |
| G | 12937 | 0 | 112 | 3200 | 3088 | 96.5% |
| Q | 12764 | 2297 | 1015 | 1600 | 826 | 51.6% |
| K | 9692 | 754 | 0 | 1600 | 1600 | 100.0% |
| B | 8522 | 1441 | 1083 | 1600 | 517 | 32.3% |
| N | 3 | 0 | 0 | 0 | 1 | 0.0% |
| L | 0 | 0 | 0 | 0 | 1 | 0.0% |
| A | 0 | 0 | 1 | 0 | 0 | 0.0% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 0 | 0.00 |
| beastChainMoves | 0 | 0.00 |
| beastChainCaptures | 0 | 0.00 |
| maesterSwaps | 5808 | 7.26 |
| maesterLongSwaps | 523 | 0.65 |
| paladinSacrifices | 0 | 0.00 |
| promotions | 244 | 0.30 |
| checks | 3456 | 4.32 |

## Degeneracy counters
| counter | value |
|---|---|
| guard captures per game | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 32 (4.0%) |
| games where a king never moved | 230 (28.7%) |

## Interest terms, residualised on draw rate
Each term minus what this run's `term ~ a + b·drawRate` line predicts from the arrangement's draw
rate. The mean over the arrangements is 0 by construction, so read differences between pools, never
levels. Overall row, fitted on the 20 arrangements:
| killerMove | leadChange | uncertaintyLate | drama | permanence | fairyUse | excessDecisiveness | interest | interestMinFairy |
|---|---|---|---|---|---|---|---|---|
| 0.000 | 0.000 | 0.000 | -0.000 | -0.000 | 0.000 | 0.024 | 0.001 | 0.008 |

## Balance axis — back ranks by |white score − 0.5| (ascending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| RQGRGMKB | 40 | 13 | 13 | 14 | 0.487 | 0.360–0.615 | -9 ±88 | 67.5% | 30.0% | 2.5% | 150.2±69.2 | 0.33 | 0.052 | 0.646 | 0.11 | 0.97 | 0.42 | 1.63 | 0.059 | 0.487 | 0.487 | - |
| GRRMBQKG | 40 | 10 | 18 | 12 | 0.475 | 0.360–0.590 | -17 ±80 | 55.0% | 37.5% | 7.5% | 124.5±70.5 | 0.34 | 0.097 | 0.676 | 0.11 | 0.96 | 0.43 | 1.68 | -0.071 | 0.478 | 0.470 | timeouts |
| BKRRGGQM | 40 | 12 | 14 | 14 | 0.475 | 0.350–0.600 | -17 ±87 | 65.0% | 30.0% | 5.0% | 109.0±62.5 | 0.36 | 0.100 | 0.672 | 0.11 | 0.96 | 0.49 | 1.74 | 0.029 | 0.484 | 0.484 | - |
| QRGRGMBK | 40 | 14 | 14 | 12 | 0.525 | 0.400–0.650 | +17 ±87 | 65.0% | 30.0% | 5.0% | 153.2±74.0 | 0.39 | 0.067 | 0.645 | 0.12 | 0.97 | 0.39 | 1.52 | 0.029 | 0.494 | 0.494 | - |
| QRMGGRBK | 40 | 11 | 16 | 13 | 0.475 | 0.355–0.595 | -17 ±83 | 60.0% | 37.5% | 2.5% | 109.7±59.5 | 0.29 | 0.087 | 0.668 | 0.08 | 0.96 | 0.48 | 1.55 | -0.021 | 0.466 | 0.466 | - |
| GKGQRRBM | 40 | 10 | 17 | 13 | 0.463 | 0.346–0.579 | -26 ±81 | 57.5% | 35.0% | 7.5% | 120.5±69.7 | 0.27 | 0.084 | 0.654 | 0.08 | 0.96 | 0.48 | 1.51 | -0.051 | 0.460 | 0.460 | balance,timeouts |
| GGRMRBKQ | 40 | 15 | 13 | 12 | 0.537 | 0.411–0.664 | +26 ±88 | 67.5% | 27.5% | 5.0% | 107.5±63.0 | 0.36 | 0.055 | 0.642 | 0.12 | 0.96 | 0.44 | 1.62 | 0.049 | 0.492 | 0.461 | balance |
| MQGRKGRB | 40 | 12 | 13 | 15 | 0.463 | 0.336–0.589 | -26 ±88 | 67.5% | 32.5% | 0.0% | 131.8±57.9 | 0.40 | 0.053 | 0.641 | 0.14 | 0.96 | 0.43 | 1.45 | 0.049 | 0.503 | 0.503 | balance |
| RMGQBGKR | 40 | 9 | 19 | 12 | 0.463 | 0.351–0.574 | -26 ±78 | 52.5% | 45.0% | 2.5% | 115.7±55.4 | 0.29 | 0.109 | 0.682 | 0.10 | 0.97 | 0.50 | 1.47 | -0.101 | 0.462 | 0.455 | balance,drawRate |
| RBQMRKGG | 40 | 15 | 13 | 12 | 0.537 | 0.411–0.664 | +26 ±88 | 67.5% | 30.0% | 2.5% | 117.5±64.9 | 0.33 | 0.081 | 0.652 | 0.14 | 0.96 | 0.44 | 1.50 | 0.049 | 0.485 | 0.485 | balance |
| RKQBGMGR | 40 | 16 | 12 | 12 | 0.550 | 0.421–0.679 | +35 ±89 | 70.0% | 27.5% | 2.5% | 121.9±64.1 | 0.37 | 0.082 | 0.657 | 0.12 | 0.96 | 0.45 | 1.73 | 0.069 | 0.493 | 0.479 | balance |
| RBKGGQMR | 40 | 14 | 17 | 9 | 0.563 | 0.447–0.678 | +44 ±81 | 57.5% | 37.5% | 5.0% | 129.7±62.2 | 0.34 | 0.068 | 0.661 | 0.11 | 0.96 | 0.47 | 1.71 | -0.060 | 0.480 | 0.480 | balance |
| KRQMGGBR | 40 | 17 | 12 | 11 | 0.575 | 0.447–0.703 | +53 ±89 | 70.0% | 27.5% | 2.5% | 114.4±60.4 | 0.37 | 0.099 | 0.663 | 0.13 | 0.96 | 0.46 | 1.54 | 0.060 | 0.491 | 0.479 | balance |
| KMGRBQRG | 40 | 7 | 19 | 14 | 0.412 | 0.304–0.521 | -61 ±76 | 52.5% | 42.5% | 5.0% | 132.8±73.1 | 0.34 | 0.063 | 0.672 | 0.11 | 0.96 | 0.43 | 1.45 | -0.120 | 0.479 | 0.479 | balance |
| KBRMGQGR | 40 | 15 | 17 | 8 | 0.588 | 0.473–0.702 | +61 ±79 | 57.5% | 40.0% | 2.5% | 131.0±70.9 | 0.30 | 0.069 | 0.670 | 0.11 | 0.97 | 0.40 | 1.81 | -0.070 | 0.472 | 0.472 | balance |
| MRQGGBRK | 40 | 8 | 17 | 15 | 0.412 | 0.298–0.527 | -61 ±79 | 57.5% | 42.5% | 0.0% | 135.1±52.4 | 0.32 | 0.070 | 0.657 | 0.07 | 0.97 | 0.44 | 1.52 | -0.070 | 0.470 | 0.470 | balance |
| QMRRKGBG | 40 | 12 | 7 | 21 | 0.388 | 0.251–0.524 | -80 ±95 | 82.5% | 17.5% | 0.0% | 112.3±51.9 | 0.41 | 0.060 | 0.643 | 0.18 | 0.96 | 0.53 | 1.55 | 0.170 | 0.516 | 0.465 | balance |
| RGBGRMKQ | 40 | 18 | 13 | 9 | 0.613 | 0.490–0.735 | +80 ±85 | 67.5% | 32.5% | 0.0% | 108.9±48.3 | 0.29 | 0.056 | 0.628 | 0.12 | 0.97 | 0.47 | 1.88 | 0.020 | 0.474 | 0.474 | balance |
| KRRBGGMQ | 40 | 9 | 12 | 19 | 0.375 | 0.251–0.499 | -89 ±86 | 70.0% | 30.0% | 0.0% | 99.7±55.2 | 0.37 | 0.102 | 0.674 | 0.13 | 0.96 | 0.55 | 1.53 | 0.040 | 0.490 | 0.474 | balance |
| RKQGRMGB | 40 | 17 | 16 | 7 | 0.625 | 0.511–0.739 | +89 ±79 | 60.0% | 35.0% | 5.0% | 137.2±64.9 | 0.32 | 0.074 | 0.653 | 0.11 | 0.96 | 0.42 | 1.52 | -0.060 | 0.474 | 0.474 | balance |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| QMRRKGBG | 40 | 12 | 7 | 21 | 0.388 | 0.251–0.524 | -80 ±95 | 82.5% | 17.5% | 0.0% | 112.3±51.9 | 0.41 | 0.060 | 0.643 | 0.18 | 0.96 | 0.53 | 1.55 | 0.170 | 0.516 | 0.465 | balance |
| MQGRKGRB | 40 | 12 | 13 | 15 | 0.463 | 0.336–0.589 | -26 ±88 | 67.5% | 32.5% | 0.0% | 131.8±57.9 | 0.40 | 0.053 | 0.641 | 0.14 | 0.96 | 0.43 | 1.45 | 0.049 | 0.503 | 0.503 | balance |
| QRGRGMBK | 40 | 14 | 14 | 12 | 0.525 | 0.400–0.650 | +17 ±87 | 65.0% | 30.0% | 5.0% | 153.2±74.0 | 0.39 | 0.067 | 0.645 | 0.12 | 0.97 | 0.39 | 1.52 | 0.029 | 0.494 | 0.494 | - |
| RKQBGMGR | 40 | 16 | 12 | 12 | 0.550 | 0.421–0.679 | +35 ±89 | 70.0% | 27.5% | 2.5% | 121.9±64.1 | 0.37 | 0.082 | 0.657 | 0.12 | 0.96 | 0.45 | 1.73 | 0.069 | 0.493 | 0.479 | balance |
| GGRMRBKQ | 40 | 15 | 13 | 12 | 0.537 | 0.411–0.664 | +26 ±88 | 67.5% | 27.5% | 5.0% | 107.5±63.0 | 0.36 | 0.055 | 0.642 | 0.12 | 0.96 | 0.44 | 1.62 | 0.049 | 0.492 | 0.461 | balance |
| KRQMGGBR | 40 | 17 | 12 | 11 | 0.575 | 0.447–0.703 | +53 ±89 | 70.0% | 27.5% | 2.5% | 114.4±60.4 | 0.37 | 0.099 | 0.663 | 0.13 | 0.96 | 0.46 | 1.54 | 0.060 | 0.491 | 0.479 | balance |
| KRRBGGMQ | 40 | 9 | 12 | 19 | 0.375 | 0.251–0.499 | -89 ±86 | 70.0% | 30.0% | 0.0% | 99.7±55.2 | 0.37 | 0.102 | 0.674 | 0.13 | 0.96 | 0.55 | 1.53 | 0.040 | 0.490 | 0.474 | balance |
| RQGRGMKB | 40 | 13 | 13 | 14 | 0.487 | 0.360–0.615 | -9 ±88 | 67.5% | 30.0% | 2.5% | 150.2±69.2 | 0.33 | 0.052 | 0.646 | 0.11 | 0.97 | 0.42 | 1.63 | 0.059 | 0.487 | 0.487 | - |
| RBQMRKGG | 40 | 15 | 13 | 12 | 0.537 | 0.411–0.664 | +26 ±88 | 67.5% | 30.0% | 2.5% | 117.5±64.9 | 0.33 | 0.081 | 0.652 | 0.14 | 0.96 | 0.44 | 1.50 | 0.049 | 0.485 | 0.485 | balance |
| BKRRGGQM | 40 | 12 | 14 | 14 | 0.475 | 0.350–0.600 | -17 ±87 | 65.0% | 30.0% | 5.0% | 109.0±62.5 | 0.36 | 0.100 | 0.672 | 0.11 | 0.96 | 0.49 | 1.74 | 0.029 | 0.484 | 0.484 | - |
| RBKGGQMR | 40 | 14 | 17 | 9 | 0.563 | 0.447–0.678 | +44 ±81 | 57.5% | 37.5% | 5.0% | 129.7±62.2 | 0.34 | 0.068 | 0.661 | 0.11 | 0.96 | 0.47 | 1.71 | -0.060 | 0.480 | 0.480 | balance |
| KMGRBQRG | 40 | 7 | 19 | 14 | 0.412 | 0.304–0.521 | -61 ±76 | 52.5% | 42.5% | 5.0% | 132.8±73.1 | 0.34 | 0.063 | 0.672 | 0.11 | 0.96 | 0.43 | 1.45 | -0.120 | 0.479 | 0.479 | balance |
| GRRMBQKG | 40 | 10 | 18 | 12 | 0.475 | 0.360–0.590 | -17 ±80 | 55.0% | 37.5% | 7.5% | 124.5±70.5 | 0.34 | 0.097 | 0.676 | 0.11 | 0.96 | 0.43 | 1.68 | -0.071 | 0.478 | 0.470 | timeouts |
| RGBGRMKQ | 40 | 18 | 13 | 9 | 0.613 | 0.490–0.735 | +80 ±85 | 67.5% | 32.5% | 0.0% | 108.9±48.3 | 0.29 | 0.056 | 0.628 | 0.12 | 0.97 | 0.47 | 1.88 | 0.020 | 0.474 | 0.474 | balance |
| RKQGRMGB | 40 | 17 | 16 | 7 | 0.625 | 0.511–0.739 | +89 ±79 | 60.0% | 35.0% | 5.0% | 137.2±64.9 | 0.32 | 0.074 | 0.653 | 0.11 | 0.96 | 0.42 | 1.52 | -0.060 | 0.474 | 0.474 | balance |
| KBRMGQGR | 40 | 15 | 17 | 8 | 0.588 | 0.473–0.702 | +61 ±79 | 57.5% | 40.0% | 2.5% | 131.0±70.9 | 0.30 | 0.069 | 0.670 | 0.11 | 0.97 | 0.40 | 1.81 | -0.070 | 0.472 | 0.472 | balance |
| MRQGGBRK | 40 | 8 | 17 | 15 | 0.412 | 0.298–0.527 | -61 ±79 | 57.5% | 42.5% | 0.0% | 135.1±52.4 | 0.32 | 0.070 | 0.657 | 0.07 | 0.97 | 0.44 | 1.52 | -0.070 | 0.470 | 0.470 | balance |
| QRMGGRBK | 40 | 11 | 16 | 13 | 0.475 | 0.355–0.595 | -17 ±83 | 60.0% | 37.5% | 2.5% | 109.7±59.5 | 0.29 | 0.087 | 0.668 | 0.08 | 0.96 | 0.48 | 1.55 | -0.021 | 0.466 | 0.466 | - |
| RMGQBGKR | 40 | 9 | 19 | 12 | 0.463 | 0.351–0.574 | -26 ±78 | 52.5% | 45.0% | 2.5% | 115.7±55.4 | 0.29 | 0.109 | 0.682 | 0.10 | 0.97 | 0.50 | 1.47 | -0.101 | 0.462 | 0.455 | balance,drawRate |
| GKGQRRBM | 40 | 10 | 17 | 13 | 0.463 | 0.346–0.579 | -26 ±81 | 57.5% | 35.0% | 7.5% | 120.5±69.7 | 0.27 | 0.084 | 0.654 | 0.08 | 0.96 | 0.48 | 1.51 | -0.051 | 0.460 | 0.460 | balance,timeouts |

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
