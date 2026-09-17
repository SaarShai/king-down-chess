# Sim report — restricted-d2v4

200 games. White score **0.497** (95% 0.437–0.558),
white advantage **-2 ± 27 Elo**.
Decisive 76.5% · draws 17.5% · capped 6.0% (counted apart, never as draws).
Plies: mean 128.1 ± 72.3, median 105. Rules: all defaults.

Pentanomial over 100 colour-swapped pairs: [0, 2, 15, 33, 50] (LL, LD, DD/WL, WD, WW).
σ_pg 0.2815 · normalized Elo +404 · LOS 100.0% ·
SPRT LLR 1.14 against ±2.94 (nElo 0 vs 4) → **continue**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | xDec | interest | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 200 | 76 | 47 | 77 | 0.497 | 0.437–0.558 | -2 ±27 | 76.5% | 17.5% | 6.0% | 128.1±72.3 | 0.28 | 0.018 | 0.602 | 0.11 | 0.97 | 0.43 | -0.011 | 0.359 | timeouts |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | M | S | N | G | A | K | P | R | L | Q | B |
|---|---|---|---|---|---|---|---|---|---|---|---|
| use | 2.73 | 0.43 | 1.31 | 1.88 | 1.69 | 1.68 | 0.46 | 1.88 | 0.87 | 1.38 | 1.11 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 153 | 76.5% |
| adjudicatedDraw | 20 | 10.0% |
| plyCap | 12 | 6.0% |
| draw50 | 9 | 4.5% |
| drawMaterial | 3 | 1.5% |
| drawRepetition | 3 | 1.5% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| P | 5873 | 1174 | 2228 | 3200 | 917 | 28.7% |
| M | 4370 | 239 | 138 | 400 | 262 | 65.5% |
| G | 2709 | 0 | 11 | 360 | 358 | 99.4% |
| A | 2703 | 533 | 98 | 400 | 302 | 75.5% |
| K | 2690 | 164 | 0 | 400 | 400 | 100.0% |
| N | 2099 | 400 | 332 | 400 | 68 | 17.0% |
| R | 1808 | 275 | 156 | 240 | 84 | 35.0% |
| B | 1249 | 265 | 208 | 280 | 72 | 25.7% |
| L | 833 | 150 | 62 | 240 | 28 | 11.7% |
| Q | 663 | 123 | 78 | 120 | 88 | 73.3% |
| S | 622 | 103 | 115 | 360 | 245 | 68.1% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 533 | 2.67 |
| beastChainMoves | 96 | 0.48 |
| beastChainCaptures | 103 | 0.52 |
| maesterSwaps | 1989 | 9.95 |
| maesterLongSwaps | 303 | 1.51 |
| paladinSacrifices | 150 | 0.75 |
| promotions | 55 | 0.28 |
| checks | 640 | 3.20 |

## Degeneracy counters
| counter | value |
|---|---|
| guard captures per game | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 12 (6.0%) |
| games where a king never moved | 63 (31.5%) |

## Interest terms, residualised on draw rate
Each term minus what this run's `term ~ a + b·drawRate` line predicts from the arrangement's draw
rate. The mean over the arrangements is 0 by construction, so read differences between pools, never
levels. Overall row, fitted on the 10 arrangements:
| killerMove | leadChange | uncertaintyLate | drama | permanence | fairyUse | excessDecisiveness | interest |
|---|---|---|---|---|---|---|---|
| 0.000 | -0.000 | 0.000 | 0.000 | -0.000 | -0.072 | -0.011 | -0.015 |

## Balance axis — back ranks by |white score − 0.5| (ascending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | xDec | interest | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| MNABAKSM | 20 | 8 | 4 | 8 | 0.500 | 0.304–0.696 | +0 ±53 | 80.0% | 10.0% | 10.0% | 129.3±65.8 | 0.29 | 0.015 | 0.596 | 0.14 | 0.97 | 0.40 | 0.024 | 0.357 | timeouts |
| ARKAGNML | 20 | 7 | 7 | 6 | 0.525 | 0.349–0.701 | +17 ±75 | 65.0% | 25.0% | 10.0% | 154.4±84.8 | 0.23 | 0.015 | 0.573 | 0.08 | 0.98 | 0.38 | -0.119 | 0.449 | timeouts |
| QKNALSRM | 20 | 10 | 1 | 9 | 0.525 | 0.312–0.738 | +17 ±69 | 95.0% | 5.0% | 0.0% | 100.1±44.2 | 0.32 | 0.019 | 0.608 | 0.15 | 0.96 | 0.52 | 0.181 | 0.400 | - |
| NSBBQNKG | 20 | 8 | 3 | 9 | 0.475 | 0.273–0.677 | -17 ±99 | 85.0% | 15.0% | 0.0% | 79.6±35.1 | 0.33 | 0.024 | 0.640 | 0.12 | 0.96 | 0.32 | 0.081 | 0.355 | - |
| BNMKGMLA | 20 | 8 | 5 | 7 | 0.525 | 0.336–0.714 | +17 ±90 | 75.0% | 25.0% | 0.0% | 127.9±58.6 | 0.25 | 0.020 | 0.610 | 0.13 | 0.97 | 0.51 | -0.019 | 0.390 | - |
| LABKRSQN | 20 | 9 | 3 | 8 | 0.525 | 0.323–0.727 | +17 ±72 | 85.0% | 15.0% | 0.0% | 107.5±56.9 | 0.35 | 0.008 | 0.584 | 0.14 | 0.96 | 0.48 | 0.081 | 0.389 | - |
| AGSMRSMK | 20 | 6 | 9 | 5 | 0.525 | 0.363–0.687 | +17 ±75 | 55.0% | 25.0% | 20.0% | 173.8±93.4 | 0.27 | 0.026 | 0.612 | 0.08 | 0.97 | 0.38 | -0.219 | 0.334 | timeouts |
| BSALNRKG | 20 | 7 | 4 | 9 | 0.450 | 0.255–0.645 | -35 ±81 | 80.0% | 10.0% | 10.0% | 134.4±79.4 | 0.23 | 0.015 | 0.594 | 0.09 | 0.97 | 0.43 | 0.039 | 0.354 | balance,timeouts |
| MSNGGAKN | 20 | 8 | 6 | 6 | 0.550 | 0.368–0.732 | +35 ±118 | 70.0% | 25.0% | 5.0% | 137.3±63.5 | 0.23 | 0.017 | 0.611 | 0.13 | 0.97 | 0.43 | -0.061 | 0.347 | balance |
| LGKBSMGR | 20 | 5 | 5 | 10 | 0.375 | 0.193–0.557 | -89 ±69 | 75.0% | 20.0% | 5.0% | 136.7±72.5 | 0.32 | 0.019 | 0.589 | 0.08 | 0.97 | 0.44 | 0.012 | 0.365 | balance |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | xDec | interest | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ARKAGNML | 20 | 7 | 7 | 6 | 0.525 | 0.349–0.701 | +17 ±75 | 65.0% | 25.0% | 10.0% | 154.4±84.8 | 0.23 | 0.015 | 0.573 | 0.08 | 0.98 | 0.38 | -0.119 | 0.449 | timeouts |
| QKNALSRM | 20 | 10 | 1 | 9 | 0.525 | 0.312–0.738 | +17 ±69 | 95.0% | 5.0% | 0.0% | 100.1±44.2 | 0.32 | 0.019 | 0.608 | 0.15 | 0.96 | 0.52 | 0.181 | 0.400 | - |
| BNMKGMLA | 20 | 8 | 5 | 7 | 0.525 | 0.336–0.714 | +17 ±90 | 75.0% | 25.0% | 0.0% | 127.9±58.6 | 0.25 | 0.020 | 0.610 | 0.13 | 0.97 | 0.51 | -0.019 | 0.390 | - |
| LABKRSQN | 20 | 9 | 3 | 8 | 0.525 | 0.323–0.727 | +17 ±72 | 85.0% | 15.0% | 0.0% | 107.5±56.9 | 0.35 | 0.008 | 0.584 | 0.14 | 0.96 | 0.48 | 0.081 | 0.389 | - |
| LGKBSMGR | 20 | 5 | 5 | 10 | 0.375 | 0.193–0.557 | -89 ±69 | 75.0% | 20.0% | 5.0% | 136.7±72.5 | 0.32 | 0.019 | 0.589 | 0.08 | 0.97 | 0.44 | 0.012 | 0.365 | balance |
| MNABAKSM | 20 | 8 | 4 | 8 | 0.500 | 0.304–0.696 | +0 ±53 | 80.0% | 10.0% | 10.0% | 129.3±65.8 | 0.29 | 0.015 | 0.596 | 0.14 | 0.97 | 0.40 | 0.024 | 0.357 | timeouts |
| NSBBQNKG | 20 | 8 | 3 | 9 | 0.475 | 0.273–0.677 | -17 ±99 | 85.0% | 15.0% | 0.0% | 79.6±35.1 | 0.33 | 0.024 | 0.640 | 0.12 | 0.96 | 0.32 | 0.081 | 0.355 | - |
| BSALNRKG | 20 | 7 | 4 | 9 | 0.450 | 0.255–0.645 | -35 ±81 | 80.0% | 10.0% | 10.0% | 134.4±79.4 | 0.23 | 0.015 | 0.594 | 0.09 | 0.97 | 0.43 | 0.039 | 0.354 | balance,timeouts |
| MSNGGAKN | 20 | 8 | 6 | 6 | 0.550 | 0.368–0.732 | +35 ±118 | 70.0% | 25.0% | 5.0% | 137.3±63.5 | 0.23 | 0.017 | 0.611 | 0.13 | 0.97 | 0.43 | -0.061 | 0.347 | balance |
| AGSMRSMK | 20 | 6 | 9 | 5 | 0.525 | 0.363–0.687 | +17 ±75 | 55.0% | 25.0% | 20.0% | 173.8±93.4 | 0.27 | 0.026 | 0.612 | 0.08 | 0.97 | 0.38 | -0.219 | 0.334 | timeouts |

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
