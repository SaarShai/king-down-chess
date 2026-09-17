# Sim report — b3-nobeast

3200 games. White score **0.537** (95% 0.524–0.551),
white advantage **+26 ± 9 Elo**.
Decisive 60.3% · draws 31.5% · capped 8.2% (counted apart, never as draws).
Plies: mean 144.4 ± 76.4, median 127. Rules: all defaults.

No complete colour-swapped pairs in this run.
σ_pg 0.3865 · normalized Elo +34 · LOS 100.0% ·
SPRT LLR 3.33 against ±2.94 (nElo 0 vs 4) → **H1**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 3200 | 1085 | 1270 | 845 | 0.537 | 0.524–0.551 | +26 ±9 | 60.3% | 31.5% | 8.2% | 144.4±76.4 | 0.28 | 0.021 | 0.622 | 0.09 | 0.98 | 0.32 | 1.69 | 0.001 | 0.473 | 0.466 | balance,timeouts |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | B | K | Q | L | A | G | M | R | P |
|---|---|---|---|---|---|---|---|---|---|
| use | 1.08 | 2.28 | 1.55 | 0.96 | 1.58 | 2.42 | 1.78 | 1.79 | 0.32 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 1930 | 60.3% |
| adjudicatedDraw | 812 | 25.4% |
| plyCap | 262 | 8.2% |
| drawRepetition | 88 | 2.8% |
| draw50 | 66 | 2.1% |
| drawMaterial | 42 | 1.3% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| P | 73764 | 13151 | 31542 | 51200 | 18932 | 37.0% |
| G | 69916 | 3961 | 556 | 6400 | 5866 | 91.7% |
| K | 65756 | 4106 | 0 | 6400 | 6400 | 100.0% |
| R | 51768 | 5639 | 3500 | 6400 | 2901 | 45.3% |
| M | 51374 | 5054 | 4132 | 6400 | 2268 | 35.4% |
| A | 45527 | 6452 | 4724 | 6400 | 1676 | 26.2% |
| Q | 44852 | 7241 | 5050 | 6400 | 2049 | 32.0% |
| B | 31152 | 6503 | 5329 | 6400 | 1071 | 16.7% |
| L | 27807 | 4227 | 1500 | 6400 | 674 | 10.5% |
| N | 5 | 2 | 3 | 0 | 0 | 0.0% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 6452 | 2.02 |
| beastChainMoves | 0 | 0.00 |
| beastChainCaptures | 0 | 0.00 |
| maesterSwaps | 21496 | 6.72 |
| maesterLongSwaps | 4082 | 1.28 |
| paladinSacrifices | 4227 | 1.32 |
| promotions | 726 | 0.23 |
| checks | 27605 | 8.63 |

## Degeneracy counters
| counter | value |
|---|---|
| guard captures per game | 1.238 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 108 (3.4%) |
| games where a king never moved | 516 (16.1%) |

## Interest terms, residualised on draw rate
Each term minus what this run's `term ~ a + b·drawRate` line predicts from the arrangement's draw
rate. The mean over the arrangements is 0 by construction, so read differences between pools, never
levels. Overall row, fitted on the 20 arrangements:
| killerMove | leadChange | uncertaintyLate | drama | permanence | fairyUse | excessDecisiveness | interest | interestMinFairy |
|---|---|---|---|---|---|---|---|---|
| 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.001 | 0.000 | 0.004 |

## Balance axis — back ranks by |white score − 0.5| (ascending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BRGMALQK | 160 | 50 | 60 | 50 | 0.500 | 0.439–0.561 | +0 ±43 | 62.5% | 30.6% | 6.9% | 147.5±77.6 | 0.33 | 0.022 | 0.626 | 0.11 | 0.97 | 0.33 | 1.72 | 0.040 | 0.487 | 0.487 | timeouts |
| RGAKMQBL | 160 | 48 | 69 | 43 | 0.516 | 0.457–0.574 | +11 ±41 | 56.9% | 35.0% | 8.1% | 149.9±75.4 | 0.28 | 0.020 | 0.621 | 0.07 | 0.98 | 0.33 | 1.59 | -0.023 | 0.470 | 0.420 | timeouts |
| LBGKRMQA | 160 | 45 | 75 | 40 | 0.516 | 0.459–0.572 | +11 ±39 | 53.1% | 38.1% | 8.8% | 151.8±81.1 | 0.29 | 0.026 | 0.620 | 0.07 | 0.98 | 0.30 | 1.74 | -0.061 | 0.469 | 0.452 | timeouts |
| BMKQLGAR | 160 | 50 | 67 | 43 | 0.522 | 0.463–0.581 | +15 ±41 | 58.1% | 31.9% | 10.0% | 148.2±80.3 | 0.28 | 0.021 | 0.612 | 0.10 | 0.98 | 0.32 | 1.73 | -0.014 | 0.471 | 0.471 | timeouts |
| BAGQRKML | 160 | 51 | 65 | 44 | 0.522 | 0.462–0.581 | +15 ±41 | 59.4% | 28.7% | 11.9% | 145.6±81.1 | 0.30 | 0.018 | 0.619 | 0.08 | 0.98 | 0.31 | 1.79 | -0.001 | 0.475 | 0.452 | timeouts |
| MGQBLAKR | 160 | 47 | 74 | 39 | 0.525 | 0.468–0.582 | +17 ±39 | 53.8% | 39.4% | 6.9% | 135.3±75.2 | 0.27 | 0.021 | 0.636 | 0.08 | 0.98 | 0.33 | 1.78 | -0.059 | 0.467 | 0.458 | timeouts |
| QRKGBMLA | 160 | 44 | 64 | 52 | 0.475 | 0.415–0.535 | -17 ±42 | 60.0% | 33.8% | 6.3% | 143.4±70.3 | 0.26 | 0.027 | 0.633 | 0.08 | 0.98 | 0.31 | 1.70 | 0.004 | 0.468 | 0.468 | timeouts |
| LMKAQBRG | 160 | 54 | 61 | 45 | 0.528 | 0.467–0.589 | +20 ±42 | 61.9% | 30.0% | 8.1% | 137.7±74.3 | 0.31 | 0.022 | 0.625 | 0.09 | 0.98 | 0.32 | 1.66 | 0.021 | 0.479 | 0.475 | timeouts |
| QKGBLMAR | 160 | 43 | 84 | 33 | 0.531 | 0.478–0.584 | +22 ±37 | 47.5% | 42.5% | 10.0% | 147.6±81.5 | 0.27 | 0.021 | 0.649 | 0.06 | 0.98 | 0.30 | 1.62 | -0.124 | 0.463 | 0.446 | balance,timeouts,drawRate |
| QLRBMKGA | 160 | 59 | 52 | 49 | 0.531 | 0.468–0.595 | +22 ±44 | 67.5% | 22.5% | 10.0% | 155.2±77.1 | 0.29 | 0.019 | 0.608 | 0.09 | 0.98 | 0.31 | 1.66 | 0.076 | 0.479 | 0.471 | balance,timeouts |
| BAKQMRGL | 160 | 57 | 57 | 46 | 0.534 | 0.472–0.596 | +24 ±43 | 64.4% | 26.3% | 9.4% | 154.6±75.3 | 0.31 | 0.021 | 0.616 | 0.09 | 0.98 | 0.31 | 1.67 | 0.043 | 0.480 | 0.450 | balance,timeouts |
| ABLKRGQM | 160 | 55 | 61 | 44 | 0.534 | 0.474–0.595 | +24 ±42 | 61.9% | 29.4% | 8.8% | 153.8±75.3 | 0.31 | 0.023 | 0.629 | 0.11 | 0.98 | 0.32 | 1.74 | 0.018 | 0.482 | 0.482 | balance,timeouts |
| LBMQAKGR | 160 | 56 | 64 | 40 | 0.550 | 0.490–0.610 | +35 ±41 | 60.0% | 29.4% | 10.6% | 146.7±77.9 | 0.26 | 0.021 | 0.627 | 0.08 | 0.98 | 0.31 | 1.69 | -0.008 | 0.469 | 0.460 | balance,timeouts |
| QGMKARBL | 160 | 66 | 44 | 50 | 0.550 | 0.484–0.616 | +35 ±46 | 72.5% | 23.1% | 4.4% | 123.9±69.8 | 0.27 | 0.019 | 0.591 | 0.08 | 0.98 | 0.34 | 1.65 | 0.117 | 0.473 | 0.440 | balance |
| BKQLAGMR | 160 | 58 | 64 | 38 | 0.563 | 0.503–0.622 | +44 ±41 | 60.0% | 32.5% | 7.5% | 143.5±77.9 | 0.29 | 0.023 | 0.631 | 0.10 | 0.98 | 0.32 | 1.72 | -0.013 | 0.476 | 0.476 | balance,timeouts |
| KBGMQLRA | 160 | 65 | 50 | 45 | 0.563 | 0.499–0.626 | +44 ±44 | 68.8% | 26.3% | 5.0% | 145.5±66.1 | 0.30 | 0.019 | 0.613 | 0.12 | 0.98 | 0.34 | 1.64 | 0.074 | 0.484 | 0.484 | balance |
| MABGLKRQ | 160 | 56 | 68 | 36 | 0.563 | 0.505–0.620 | +44 ±40 | 57.5% | 34.4% | 8.1% | 144.7±73.8 | 0.26 | 0.021 | 0.627 | 0.07 | 0.98 | 0.30 | 1.73 | -0.038 | 0.465 | 0.456 | balance,timeouts |
| RQLKBAMG | 160 | 59 | 62 | 39 | 0.563 | 0.503–0.622 | +44 ±42 | 61.3% | 31.9% | 6.9% | 131.8±75.7 | 0.30 | 0.021 | 0.631 | 0.08 | 0.98 | 0.34 | 1.59 | -0.001 | 0.477 | 0.477 | balance,timeouts |
| QGRBMKAL | 160 | 63 | 58 | 39 | 0.575 | 0.514–0.636 | +53 ±42 | 63.7% | 28.1% | 8.1% | 135.2±79.6 | 0.27 | 0.019 | 0.599 | 0.06 | 0.98 | 0.33 | 1.67 | 0.018 | 0.466 | 0.454 | balance,timeouts |
| KLMBRQAG | 160 | 59 | 71 | 30 | 0.591 | 0.535–0.647 | +64 ±39 | 55.6% | 36.3% | 8.1% | 145.3±72.3 | 0.26 | 0.023 | 0.635 | 0.08 | 0.98 | 0.32 | 1.61 | -0.070 | 0.466 | 0.466 | balance,timeouts |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BRGMALQK | 160 | 50 | 60 | 50 | 0.500 | 0.439–0.561 | +0 ±43 | 62.5% | 30.6% | 6.9% | 147.5±77.6 | 0.33 | 0.022 | 0.626 | 0.11 | 0.97 | 0.33 | 1.72 | 0.040 | 0.487 | 0.487 | timeouts |
| KBGMQLRA | 160 | 65 | 50 | 45 | 0.563 | 0.499–0.626 | +44 ±44 | 68.8% | 26.3% | 5.0% | 145.5±66.1 | 0.30 | 0.019 | 0.613 | 0.12 | 0.98 | 0.34 | 1.64 | 0.074 | 0.484 | 0.484 | balance |
| ABLKRGQM | 160 | 55 | 61 | 44 | 0.534 | 0.474–0.595 | +24 ±42 | 61.9% | 29.4% | 8.8% | 153.8±75.3 | 0.31 | 0.023 | 0.629 | 0.11 | 0.98 | 0.32 | 1.74 | 0.018 | 0.482 | 0.482 | balance,timeouts |
| BAKQMRGL | 160 | 57 | 57 | 46 | 0.534 | 0.472–0.596 | +24 ±43 | 64.4% | 26.3% | 9.4% | 154.6±75.3 | 0.31 | 0.021 | 0.616 | 0.09 | 0.98 | 0.31 | 1.67 | 0.043 | 0.480 | 0.450 | balance,timeouts |
| LMKAQBRG | 160 | 54 | 61 | 45 | 0.528 | 0.467–0.589 | +20 ±42 | 61.9% | 30.0% | 8.1% | 137.7±74.3 | 0.31 | 0.022 | 0.625 | 0.09 | 0.98 | 0.32 | 1.66 | 0.021 | 0.479 | 0.475 | timeouts |
| QLRBMKGA | 160 | 59 | 52 | 49 | 0.531 | 0.468–0.595 | +22 ±44 | 67.5% | 22.5% | 10.0% | 155.2±77.1 | 0.29 | 0.019 | 0.608 | 0.09 | 0.98 | 0.31 | 1.66 | 0.076 | 0.479 | 0.471 | balance,timeouts |
| RQLKBAMG | 160 | 59 | 62 | 39 | 0.563 | 0.503–0.622 | +44 ±42 | 61.3% | 31.9% | 6.9% | 131.8±75.7 | 0.30 | 0.021 | 0.631 | 0.08 | 0.98 | 0.34 | 1.59 | -0.001 | 0.477 | 0.477 | balance,timeouts |
| BKQLAGMR | 160 | 58 | 64 | 38 | 0.563 | 0.503–0.622 | +44 ±41 | 60.0% | 32.5% | 7.5% | 143.5±77.9 | 0.29 | 0.023 | 0.631 | 0.10 | 0.98 | 0.32 | 1.72 | -0.013 | 0.476 | 0.476 | balance,timeouts |
| BAGQRKML | 160 | 51 | 65 | 44 | 0.522 | 0.462–0.581 | +15 ±41 | 59.4% | 28.7% | 11.9% | 145.6±81.1 | 0.30 | 0.018 | 0.619 | 0.08 | 0.98 | 0.31 | 1.79 | -0.001 | 0.475 | 0.452 | timeouts |
| QGMKARBL | 160 | 66 | 44 | 50 | 0.550 | 0.484–0.616 | +35 ±46 | 72.5% | 23.1% | 4.4% | 123.9±69.8 | 0.27 | 0.019 | 0.591 | 0.08 | 0.98 | 0.34 | 1.65 | 0.117 | 0.473 | 0.440 | balance |
| BMKQLGAR | 160 | 50 | 67 | 43 | 0.522 | 0.463–0.581 | +15 ±41 | 58.1% | 31.9% | 10.0% | 148.2±80.3 | 0.28 | 0.021 | 0.612 | 0.10 | 0.98 | 0.32 | 1.73 | -0.014 | 0.471 | 0.471 | timeouts |
| RGAKMQBL | 160 | 48 | 69 | 43 | 0.516 | 0.457–0.574 | +11 ±41 | 56.9% | 35.0% | 8.1% | 149.9±75.4 | 0.28 | 0.020 | 0.621 | 0.07 | 0.98 | 0.33 | 1.59 | -0.023 | 0.470 | 0.420 | timeouts |
| LBGKRMQA | 160 | 45 | 75 | 40 | 0.516 | 0.459–0.572 | +11 ±39 | 53.1% | 38.1% | 8.8% | 151.8±81.1 | 0.29 | 0.026 | 0.620 | 0.07 | 0.98 | 0.30 | 1.74 | -0.061 | 0.469 | 0.452 | timeouts |
| LBMQAKGR | 160 | 56 | 64 | 40 | 0.550 | 0.490–0.610 | +35 ±41 | 60.0% | 29.4% | 10.6% | 146.7±77.9 | 0.26 | 0.021 | 0.627 | 0.08 | 0.98 | 0.31 | 1.69 | -0.008 | 0.469 | 0.460 | balance,timeouts |
| QRKGBMLA | 160 | 44 | 64 | 52 | 0.475 | 0.415–0.535 | -17 ±42 | 60.0% | 33.8% | 6.3% | 143.4±70.3 | 0.26 | 0.027 | 0.633 | 0.08 | 0.98 | 0.31 | 1.70 | 0.004 | 0.468 | 0.468 | timeouts |
| MGQBLAKR | 160 | 47 | 74 | 39 | 0.525 | 0.468–0.582 | +17 ±39 | 53.8% | 39.4% | 6.9% | 135.3±75.2 | 0.27 | 0.021 | 0.636 | 0.08 | 0.98 | 0.33 | 1.78 | -0.059 | 0.467 | 0.458 | timeouts |
| QGRBMKAL | 160 | 63 | 58 | 39 | 0.575 | 0.514–0.636 | +53 ±42 | 63.7% | 28.1% | 8.1% | 135.2±79.6 | 0.27 | 0.019 | 0.599 | 0.06 | 0.98 | 0.33 | 1.67 | 0.018 | 0.466 | 0.454 | balance,timeouts |
| KLMBRQAG | 160 | 59 | 71 | 30 | 0.591 | 0.535–0.647 | +64 ±39 | 55.6% | 36.3% | 8.1% | 145.3±72.3 | 0.26 | 0.023 | 0.635 | 0.08 | 0.98 | 0.32 | 1.61 | -0.070 | 0.466 | 0.466 | balance,timeouts |
| MABGLKRQ | 160 | 56 | 68 | 36 | 0.563 | 0.505–0.620 | +44 ±40 | 57.5% | 34.4% | 8.1% | 144.7±73.8 | 0.26 | 0.021 | 0.627 | 0.07 | 0.98 | 0.30 | 1.73 | -0.038 | 0.465 | 0.456 | balance,timeouts |
| QKGBLMAR | 160 | 43 | 84 | 33 | 0.531 | 0.478–0.584 | +22 ±37 | 47.5% | 42.5% | 10.0% | 147.6±81.5 | 0.27 | 0.021 | 0.649 | 0.06 | 0.98 | 0.30 | 1.62 | -0.124 | 0.463 | 0.446 | balance,timeouts,drawRate |

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
