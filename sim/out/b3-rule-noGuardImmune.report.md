# Sim report — b3-rule-noGuardImmune

2000 games. White score **0.541** (95% 0.524–0.559),
white advantage **+29 ± 12 Elo**.
Decisive 65.6% · draws 29.8% · capped 4.6% (counted apart, never as draws).
Plies: mean 127.8 ± 68.0, median 111. Rules changed from the defaults: `guardImmune=false`.

No complete colour-swapped pairs in this run.
σ_pg 0.4030 · normalized Elo +36 · LOS 100.0% ·
SPRT LLR 2.20 against ±2.94 (nElo 0 vs 4) → **continue**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 2000 | 739 | 687 | 574 | 0.541 | 0.524–0.559 | +29 ±12 | 65.6% | 29.8% | 4.6% | 127.8±68.0 | 0.30 | 0.025 | 0.630 | 0.09 | 0.98 | 0.37 | 1.57 | 0.006 | 0.477 | 0.477 | balance |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | G | B | R | L | Q | K | M | A | P |
|---|---|---|---|---|---|---|---|---|---|
| use | 1.58 | 1.17 | 1.69 | 1.11 | 1.70 | 2.24 | 1.88 | 1.71 | 0.37 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 1313 | 65.6% |
| adjudicatedDraw | 472 | 23.6% |
| plyCap | 92 | 4.6% |
| drawRepetition | 70 | 3.5% |
| draw50 | 31 | 1.6% |
| drawMaterial | 22 | 1.1% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| P | 46729 | 8917 | 18521 | 32000 | 13018 | 40.7% |
| K | 35717 | 2248 | 0 | 4000 | 4000 | 100.0% |
| M | 29987 | 3168 | 2501 | 4000 | 1499 | 37.5% |
| A | 27344 | 4171 | 2810 | 4000 | 1190 | 29.8% |
| Q | 27229 | 4650 | 3048 | 4000 | 1409 | 35.2% |
| R | 27057 | 3800 | 2178 | 4000 | 1822 | 45.6% |
| G | 25256 | 903 | 1369 | 4000 | 2631 | 65.8% |
| B | 18680 | 4135 | 3214 | 4000 | 786 | 19.7% |
| L | 17673 | 2594 | 943 | 4000 | 465 | 11.6% |
| N | 0 | 0 | 2 | 0 | 0 | 0.0% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 4171 | 2.09 |
| beastChainMoves | 0 | 0.00 |
| beastChainCaptures | 0 | 0.00 |
| maesterSwaps | 12789 | 6.39 |
| maesterLongSwaps | 2214 | 1.11 |
| paladinSacrifices | 2594 | 1.30 |
| promotions | 461 | 0.23 |
| checks | 14092 | 7.05 |

## Degeneracy counters
| counter | value |
|---|---|
| guard captures per game | 0.452 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 53 (2.6%) |
| games where a king never moved | 428 (21.4%) |

## Interest terms, residualised on draw rate
Each term minus what this run's `term ~ a + b·drawRate` line predicts from the arrangement's draw
rate. The mean over the arrangements is 0 by construction, so read differences between pools, never
levels. Overall row, fitted on the 20 arrangements:
| killerMove | leadChange | uncertaintyLate | drama | permanence | fairyUse | excessDecisiveness | interest | interestMinFairy |
|---|---|---|---|---|---|---|---|---|
| -0.000 | 0.000 | 0.000 | -0.000 | 0.000 | 0.000 | 0.006 | 0.000 | 0.002 |

## Balance axis — back ranks by |white score − 0.5| (ascending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| GMQRLKBA | 100 | 28 | 44 | 28 | 0.500 | 0.427–0.573 | +0 ±51 | 56.0% | 34.0% | 10.0% | 135.0±75.0 | 0.26 | 0.024 | 0.634 | 0.08 | 0.98 | 0.35 | 1.65 | -0.056 | 0.465 | 0.465 | timeouts |
| KGRMLBQA | 100 | 27 | 43 | 30 | 0.485 | 0.411–0.559 | -10 ±51 | 57.0% | 39.0% | 4.0% | 132.1±73.6 | 0.27 | 0.024 | 0.637 | 0.06 | 0.98 | 0.36 | 1.61 | -0.059 | 0.465 | 0.465 | - |
| KQRBGAML | 100 | 36 | 33 | 31 | 0.525 | 0.445–0.605 | +17 ±56 | 67.0% | 25.0% | 8.0% | 127.0±77.4 | 0.30 | 0.027 | 0.631 | 0.09 | 0.98 | 0.35 | 1.56 | 0.033 | 0.478 | 0.478 | timeouts |
| AMQLGKRB | 100 | 32 | 41 | 27 | 0.525 | 0.450–0.600 | +17 ±52 | 59.0% | 36.0% | 5.0% | 131.5±62.1 | 0.28 | 0.025 | 0.632 | 0.09 | 0.98 | 0.36 | 1.53 | -0.047 | 0.471 | 0.471 | - |
| KALBMQGR | 100 | 38 | 30 | 32 | 0.530 | 0.448–0.612 | +21 ±57 | 70.0% | 30.0% | 0.0% | 128.4±60.8 | 0.31 | 0.023 | 0.635 | 0.12 | 0.98 | 0.37 | 1.50 | 0.059 | 0.487 | 0.487 | balance |
| AQRLMKBG | 100 | 37 | 32 | 31 | 0.530 | 0.449–0.611 | +21 ±56 | 68.0% | 27.0% | 5.0% | 136.1±74.1 | 0.31 | 0.024 | 0.629 | 0.11 | 0.98 | 0.36 | 1.62 | 0.039 | 0.485 | 0.485 | balance |
| RBAGQKML | 100 | 38 | 31 | 31 | 0.535 | 0.454–0.616 | +24 ±56 | 69.0% | 29.0% | 2.0% | 123.9±63.1 | 0.29 | 0.025 | 0.625 | 0.08 | 0.98 | 0.37 | 1.50 | 0.045 | 0.476 | 0.455 | balance |
| GBRLQKMA | 100 | 42 | 26 | 32 | 0.550 | 0.466–0.634 | +35 ±58 | 74.0% | 25.0% | 1.0% | 118.3±58.5 | 0.28 | 0.034 | 0.629 | 0.09 | 0.98 | 0.40 | 1.53 | 0.082 | 0.476 | 0.476 | balance |
| BGAMLRQK | 100 | 40 | 30 | 30 | 0.550 | 0.469–0.631 | +35 ±57 | 70.0% | 27.0% | 3.0% | 121.8±63.1 | 0.32 | 0.024 | 0.629 | 0.11 | 0.97 | 0.39 | 1.56 | 0.042 | 0.485 | 0.485 | balance |
| MGABKQRL | 100 | 39 | 32 | 29 | 0.550 | 0.470–0.630 | +35 ±56 | 68.0% | 28.0% | 4.0% | 131.5±69.6 | 0.33 | 0.026 | 0.621 | 0.11 | 0.97 | 0.34 | 1.54 | 0.022 | 0.485 | 0.485 | balance |
| AMQRBKGL | 100 | 34 | 42 | 24 | 0.550 | 0.476–0.624 | +35 ±51 | 58.0% | 37.0% | 5.0% | 121.8±65.2 | 0.26 | 0.025 | 0.634 | 0.07 | 0.98 | 0.36 | 1.65 | -0.078 | 0.462 | 0.462 | balance |
| AMRGQBKL | 100 | 43 | 24 | 33 | 0.550 | 0.465–0.635 | +35 ±59 | 76.0% | 18.0% | 6.0% | 127.0±70.4 | 0.36 | 0.021 | 0.610 | 0.12 | 0.97 | 0.36 | 1.62 | 0.102 | 0.496 | 0.496 | balance,timeouts |
| QARLMGBK | 100 | 22 | 45 | 33 | 0.445 | 0.373–0.517 | -38 ±50 | 55.0% | 39.0% | 6.0% | 133.0±69.5 | 0.25 | 0.029 | 0.646 | 0.06 | 0.98 | 0.37 | 1.56 | -0.112 | 0.458 | 0.458 | balance,timeouts |
| RKQBMLGA | 100 | 39 | 34 | 27 | 0.560 | 0.481–0.639 | +42 ±55 | 66.0% | 28.0% | 6.0% | 132.1±70.2 | 0.30 | 0.019 | 0.623 | 0.10 | 0.98 | 0.36 | 1.54 | -0.006 | 0.479 | 0.479 | balance,timeouts |
| MABLGKQR | 100 | 45 | 23 | 32 | 0.565 | 0.480–0.650 | +45 ±59 | 77.0% | 17.0% | 6.0% | 135.1±66.7 | 0.36 | 0.021 | 0.616 | 0.13 | 0.97 | 0.36 | 1.61 | 0.099 | 0.498 | 0.498 | balance,timeouts |
| LQBGAMKR | 100 | 37 | 39 | 24 | 0.565 | 0.490–0.640 | +45 ±52 | 61.0% | 33.0% | 6.0% | 126.9±67.9 | 0.25 | 0.021 | 0.634 | 0.07 | 0.98 | 0.35 | 1.59 | -0.061 | 0.462 | 0.462 | balance,timeouts |
| GLRAMBQK | 100 | 37 | 39 | 24 | 0.565 | 0.490–0.640 | +45 ±52 | 61.0% | 35.0% | 4.0% | 132.8±67.8 | 0.32 | 0.032 | 0.640 | 0.08 | 0.98 | 0.35 | 1.58 | -0.061 | 0.475 | 0.475 | balance |
| BLGRMAKQ | 100 | 44 | 27 | 29 | 0.575 | 0.493–0.657 | +53 ±57 | 73.0% | 24.0% | 3.0% | 113.3±60.6 | 0.30 | 0.025 | 0.624 | 0.11 | 0.97 | 0.41 | 1.51 | 0.051 | 0.482 | 0.462 | balance |
| LGMQBAKR | 100 | 38 | 39 | 23 | 0.575 | 0.500–0.650 | +53 ±52 | 61.0% | 36.0% | 3.0% | 118.3±64.0 | 0.27 | 0.020 | 0.635 | 0.07 | 0.98 | 0.36 | 1.58 | -0.069 | 0.466 | 0.466 | balance |
| QBALRGMK | 100 | 43 | 33 | 24 | 0.595 | 0.517–0.673 | +67 ±54 | 67.0% | 28.0% | 5.0% | 130.8±71.6 | 0.34 | 0.022 | 0.635 | 0.10 | 0.97 | 0.38 | 1.52 | -0.026 | 0.485 | 0.485 | balance |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| MABLGKQR | 100 | 45 | 23 | 32 | 0.565 | 0.480–0.650 | +45 ±59 | 77.0% | 17.0% | 6.0% | 135.1±66.7 | 0.36 | 0.021 | 0.616 | 0.13 | 0.97 | 0.36 | 1.61 | 0.099 | 0.498 | 0.498 | balance,timeouts |
| AMRGQBKL | 100 | 43 | 24 | 33 | 0.550 | 0.465–0.635 | +35 ±59 | 76.0% | 18.0% | 6.0% | 127.0±70.4 | 0.36 | 0.021 | 0.610 | 0.12 | 0.97 | 0.36 | 1.62 | 0.102 | 0.496 | 0.496 | balance,timeouts |
| KALBMQGR | 100 | 38 | 30 | 32 | 0.530 | 0.448–0.612 | +21 ±57 | 70.0% | 30.0% | 0.0% | 128.4±60.8 | 0.31 | 0.023 | 0.635 | 0.12 | 0.98 | 0.37 | 1.50 | 0.059 | 0.487 | 0.487 | balance |
| BGAMLRQK | 100 | 40 | 30 | 30 | 0.550 | 0.469–0.631 | +35 ±57 | 70.0% | 27.0% | 3.0% | 121.8±63.1 | 0.32 | 0.024 | 0.629 | 0.11 | 0.97 | 0.39 | 1.56 | 0.042 | 0.485 | 0.485 | balance |
| MGABKQRL | 100 | 39 | 32 | 29 | 0.550 | 0.470–0.630 | +35 ±56 | 68.0% | 28.0% | 4.0% | 131.5±69.6 | 0.33 | 0.026 | 0.621 | 0.11 | 0.97 | 0.34 | 1.54 | 0.022 | 0.485 | 0.485 | balance |
| QBALRGMK | 100 | 43 | 33 | 24 | 0.595 | 0.517–0.673 | +67 ±54 | 67.0% | 28.0% | 5.0% | 130.8±71.6 | 0.34 | 0.022 | 0.635 | 0.10 | 0.97 | 0.38 | 1.52 | -0.026 | 0.485 | 0.485 | balance |
| AQRLMKBG | 100 | 37 | 32 | 31 | 0.530 | 0.449–0.611 | +21 ±56 | 68.0% | 27.0% | 5.0% | 136.1±74.1 | 0.31 | 0.024 | 0.629 | 0.11 | 0.98 | 0.36 | 1.62 | 0.039 | 0.485 | 0.485 | balance |
| BLGRMAKQ | 100 | 44 | 27 | 29 | 0.575 | 0.493–0.657 | +53 ±57 | 73.0% | 24.0% | 3.0% | 113.3±60.6 | 0.30 | 0.025 | 0.624 | 0.11 | 0.97 | 0.41 | 1.51 | 0.051 | 0.482 | 0.462 | balance |
| RKQBMLGA | 100 | 39 | 34 | 27 | 0.560 | 0.481–0.639 | +42 ±55 | 66.0% | 28.0% | 6.0% | 132.1±70.2 | 0.30 | 0.019 | 0.623 | 0.10 | 0.98 | 0.36 | 1.54 | -0.006 | 0.479 | 0.479 | balance,timeouts |
| KQRBGAML | 100 | 36 | 33 | 31 | 0.525 | 0.445–0.605 | +17 ±56 | 67.0% | 25.0% | 8.0% | 127.0±77.4 | 0.30 | 0.027 | 0.631 | 0.09 | 0.98 | 0.35 | 1.56 | 0.033 | 0.478 | 0.478 | timeouts |
| GBRLQKMA | 100 | 42 | 26 | 32 | 0.550 | 0.466–0.634 | +35 ±58 | 74.0% | 25.0% | 1.0% | 118.3±58.5 | 0.28 | 0.034 | 0.629 | 0.09 | 0.98 | 0.40 | 1.53 | 0.082 | 0.476 | 0.476 | balance |
| RBAGQKML | 100 | 38 | 31 | 31 | 0.535 | 0.454–0.616 | +24 ±56 | 69.0% | 29.0% | 2.0% | 123.9±63.1 | 0.29 | 0.025 | 0.625 | 0.08 | 0.98 | 0.37 | 1.50 | 0.045 | 0.476 | 0.455 | balance |
| GLRAMBQK | 100 | 37 | 39 | 24 | 0.565 | 0.490–0.640 | +45 ±52 | 61.0% | 35.0% | 4.0% | 132.8±67.8 | 0.32 | 0.032 | 0.640 | 0.08 | 0.98 | 0.35 | 1.58 | -0.061 | 0.475 | 0.475 | balance |
| AMQLGKRB | 100 | 32 | 41 | 27 | 0.525 | 0.450–0.600 | +17 ±52 | 59.0% | 36.0% | 5.0% | 131.5±62.1 | 0.28 | 0.025 | 0.632 | 0.09 | 0.98 | 0.36 | 1.53 | -0.047 | 0.471 | 0.471 | - |
| LGMQBAKR | 100 | 38 | 39 | 23 | 0.575 | 0.500–0.650 | +53 ±52 | 61.0% | 36.0% | 3.0% | 118.3±64.0 | 0.27 | 0.020 | 0.635 | 0.07 | 0.98 | 0.36 | 1.58 | -0.069 | 0.466 | 0.466 | balance |
| GMQRLKBA | 100 | 28 | 44 | 28 | 0.500 | 0.427–0.573 | +0 ±51 | 56.0% | 34.0% | 10.0% | 135.0±75.0 | 0.26 | 0.024 | 0.634 | 0.08 | 0.98 | 0.35 | 1.65 | -0.056 | 0.465 | 0.465 | timeouts |
| KGRMLBQA | 100 | 27 | 43 | 30 | 0.485 | 0.411–0.559 | -10 ±51 | 57.0% | 39.0% | 4.0% | 132.1±73.6 | 0.27 | 0.024 | 0.637 | 0.06 | 0.98 | 0.36 | 1.61 | -0.059 | 0.465 | 0.465 | - |
| AMQRBKGL | 100 | 34 | 42 | 24 | 0.550 | 0.476–0.624 | +35 ±51 | 58.0% | 37.0% | 5.0% | 121.8±65.2 | 0.26 | 0.025 | 0.634 | 0.07 | 0.98 | 0.36 | 1.65 | -0.078 | 0.462 | 0.462 | balance |
| LQBGAMKR | 100 | 37 | 39 | 24 | 0.565 | 0.490–0.640 | +45 ±52 | 61.0% | 33.0% | 6.0% | 126.9±67.9 | 0.25 | 0.021 | 0.634 | 0.07 | 0.98 | 0.35 | 1.59 | -0.061 | 0.462 | 0.462 | balance,timeouts |
| QARLMGBK | 100 | 22 | 45 | 33 | 0.445 | 0.373–0.517 | -38 ±50 | 55.0% | 39.0% | 6.0% | 133.0±69.5 | 0.25 | 0.029 | 0.646 | 0.06 | 0.98 | 0.37 | 1.56 | -0.112 | 0.458 | 0.458 | balance,timeouts |

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
