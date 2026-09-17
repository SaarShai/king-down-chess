# Sim report — cfg-i-nomin

3200 games. White score **0.515** (95% 0.504–0.527),
white advantage **+11 ± 8 Elo**.
Decisive 47.3% · draws 42.6% · capped 10.0% (counted apart, never as draws).
Plies: mean 154.7 ± 80.8, median 132. Rules: all defaults.

No complete colour-swapped pairs in this run.
σ_pg 0.3437 · normalized Elo +16 · LOS 99.5% ·
SPRT LLR 1.44 against ±2.94 (nElo 0 vs 4) → **continue**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 3200 | 807 | 1685 | 708 | 0.515 | 0.504–0.527 | +11 ±8 | 47.3% | 42.6% | 10.0% | 154.7±80.8 | 0.27 | 0.037 | 0.647 | 0.08 | 0.97 | 0.38 | 1.58 | 0.028 | 0.472 | 0.360 | timeouts |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | A | R | M | S | G | K | P | Q | L |
|---|---|---|---|---|---|---|---|---|---|
| use | 1.65 | 1.60 | 3.12 | 0.44 | 1.79 | 1.71 | 0.38 | 1.01 | 0.88 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 1515 | 47.3% |
| adjudicatedDraw | 721 | 22.5% |
| draw50 | 482 | 15.1% |
| plyCap | 321 | 10.0% |
| drawRepetition | 148 | 4.6% |
| drawMaterial | 13 | 0.4% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| M | 111156 | 4961 | 2236 | 7360 | 5124 | 69.6% |
| P | 95135 | 18377 | 37656 | 51200 | 12701 | 24.8% |
| G | 69246 | 0 | 184 | 8000 | 7872 | 98.4% |
| A | 63633 | 12080 | 1788 | 8000 | 6212 | 77.6% |
| K | 52997 | 2239 | 0 | 6400 | 6400 | 100.0% |
| R | 51912 | 7783 | 5076 | 6720 | 1644 | 24.5% |
| Q | 21794 | 4476 | 4266 | 4480 | 998 | 22.3% |
| L | 15007 | 2405 | 897 | 3520 | 219 | 6.2% |
| S | 14245 | 1873 | 2090 | 6720 | 4630 | 68.9% |
| N | 2 | 1 | 2 | 0 | 0 | 0.0% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 12080 | 3.77 |
| beastChainMoves | 1660 | 0.52 |
| beastChainCaptures | 1873 | 0.59 |
| maesterSwaps | 51566 | 16.11 |
| maesterLongSwaps | 6091 | 1.90 |
| paladinSacrifices | 2405 | 0.75 |
| promotions | 843 | 0.26 |
| checks | 16512 | 5.16 |

## Degeneracy counters
| counter | value |
|---|---|
| guard captures per game | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 495 (15.5%) |
| games where a king never moved | 612 (19.1%) |

## Interest terms, residualised on draw rate
Each term minus what this run's `term ~ a + b·drawRate` line predicts from the arrangement's draw
rate. The mean over the arrangements is 0 by construction, so read differences between pools, never
levels. Overall row, fitted on the 20 arrangements:
| killerMove | leadChange | uncertaintyLate | drama | permanence | fairyUse | excessDecisiveness | interest | interestMinFairy |
|---|---|---|---|---|---|---|---|---|
| 0.000 | -0.000 | 0.000 | -0.000 | 0.000 | 0.000 | 0.028 | 0.002 | -0.011 |

## Balance axis — back ranks by |white score − 0.5| (ascending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| GAGMSKQR | 160 | 35 | 90 | 35 | 0.500 | 0.449–0.551 | +0 ±36 | 43.8% | 46.9% | 9.4% | 153.5±78.6 | 0.27 | 0.039 | 0.661 | 0.08 | 0.97 | 0.39 | 1.80 | 0.062 | 0.476 | 0.358 | timeouts |
| KQALMSMG | 160 | 36 | 88 | 36 | 0.500 | 0.448–0.552 | +0 ±36 | 45.0% | 45.6% | 9.4% | 145.7±78.0 | 0.28 | 0.037 | 0.651 | 0.09 | 0.97 | 0.41 | 1.48 | 0.075 | 0.478 | 0.371 | timeouts |
| KSMGGRSL | 160 | 30 | 99 | 31 | 0.497 | 0.449–0.545 | -2 ±33 | 38.1% | 45.0% | 16.9% | 175.9±89.1 | 0.23 | 0.039 | 0.640 | 0.06 | 0.97 | 0.34 | 1.82 | -0.008 | 0.458 | 0.337 | timeouts |
| GRGALQSK | 160 | 38 | 82 | 40 | 0.494 | 0.440–0.548 | -4 ±38 | 48.8% | 41.3% | 10.0% | 151.1±85.2 | 0.27 | 0.027 | 0.626 | 0.07 | 0.97 | 0.38 | 1.35 | 0.084 | 0.472 | 0.354 | timeouts |
| ASAGQMMK | 160 | 21 | 120 | 19 | 0.506 | 0.468–0.545 | +4 ±27 | 25.0% | 63.1% | 11.9% | 181.0±80.9 | 0.21 | 0.045 | 0.669 | 0.06 | 0.97 | 0.34 | 1.65 | -0.154 | 0.447 | 0.334 | timeouts,drawRate |
| QMSMAGGK | 160 | 35 | 92 | 33 | 0.506 | 0.456–0.557 | +4 ±35 | 42.5% | 48.8% | 8.8% | 154.0±81.0 | 0.29 | 0.047 | 0.675 | 0.08 | 0.97 | 0.40 | 1.70 | 0.021 | 0.476 | 0.371 | timeouts |
| ARAMSSGK | 160 | 22 | 119 | 19 | 0.509 | 0.470–0.549 | +7 ±27 | 25.6% | 50.6% | 23.8% | 193.5±85.1 | 0.23 | 0.048 | 0.663 | 0.07 | 0.97 | 0.31 | 2.07 | -0.161 | 0.451 | 0.317 | timeouts |
| GKSMAQRG | 160 | 27 | 102 | 31 | 0.487 | 0.441–0.534 | -9 ±32 | 36.3% | 50.6% | 13.1% | 163.3±81.9 | 0.26 | 0.043 | 0.667 | 0.09 | 0.97 | 0.37 | 1.90 | -0.069 | 0.466 | 0.353 | timeouts |
| SARGASGK | 160 | 23 | 109 | 28 | 0.484 | 0.441–0.528 | -11 ±30 | 31.9% | 58.1% | 10.0% | 179.9±76.8 | 0.19 | 0.042 | 0.656 | 0.06 | 0.97 | 0.34 | 1.63 | -0.127 | 0.444 | 0.333 | timeouts |
| MLQGRMKA | 160 | 54 | 58 | 48 | 0.519 | 0.457–0.581 | +13 ±43 | 63.7% | 29.4% | 6.9% | 137.9±72.0 | 0.32 | 0.028 | 0.625 | 0.12 | 0.97 | 0.42 | 1.49 | 0.177 | 0.493 | 0.489 | timeouts |
| GAMRQSAK | 160 | 27 | 98 | 35 | 0.475 | 0.427–0.523 | -17 ±33 | 38.8% | 47.5% | 13.8% | 180.6±80.6 | 0.23 | 0.035 | 0.657 | 0.08 | 0.97 | 0.34 | 2.00 | -0.101 | 0.458 | 0.348 | timeouts |
| RMGSAAGK | 160 | 34 | 100 | 26 | 0.525 | 0.478–0.572 | +17 ±33 | 37.5% | 48.1% | 14.4% | 165.8±84.9 | 0.29 | 0.053 | 0.670 | 0.07 | 0.96 | 0.35 | 1.98 | -0.113 | 0.465 | 0.345 | timeouts |
| QRALSKRA | 160 | 49 | 70 | 41 | 0.525 | 0.467–0.583 | +17 ±40 | 56.3% | 35.0% | 8.8% | 132.3±75.2 | 0.27 | 0.027 | 0.632 | 0.09 | 0.97 | 0.43 | 1.06 | 0.074 | 0.475 | 0.369 | timeouts |
| KGRMAMQL | 160 | 51 | 66 | 43 | 0.525 | 0.466–0.584 | +17 ±41 | 58.8% | 35.0% | 6.3% | 141.9±73.6 | 0.33 | 0.029 | 0.630 | 0.10 | 0.97 | 0.42 | 1.59 | 0.099 | 0.488 | 0.467 | timeouts |
| SAQLMRRK | 160 | 60 | 50 | 50 | 0.531 | 0.467–0.595 | +22 ±45 | 68.8% | 30.0% | 1.3% | 121.0±55.4 | 0.32 | 0.027 | 0.629 | 0.11 | 0.97 | 0.40 | 1.37 | 0.171 | 0.494 | 0.374 | balance |
| AGRSQMLK | 160 | 55 | 61 | 44 | 0.534 | 0.474–0.595 | +24 ±42 | 61.9% | 33.8% | 4.4% | 135.0±70.9 | 0.29 | 0.035 | 0.624 | 0.10 | 0.97 | 0.43 | 1.47 | 0.088 | 0.479 | 0.393 | balance |
| AMSSKLMR | 160 | 51 | 71 | 38 | 0.541 | 0.483–0.598 | +28 ±40 | 55.6% | 34.4% | 10.0% | 157.3±79.1 | 0.27 | 0.032 | 0.641 | 0.10 | 0.97 | 0.39 | 1.41 | -0.003 | 0.473 | 0.357 | balance,timeouts |
| QKGMRARS | 160 | 48 | 79 | 33 | 0.547 | 0.492–0.602 | +33 ±38 | 50.6% | 41.3% | 8.1% | 154.8±76.8 | 0.30 | 0.032 | 0.659 | 0.09 | 0.97 | 0.38 | 1.82 | -0.081 | 0.474 | 0.359 | balance,timeouts |
| LRRKGAMS | 160 | 62 | 52 | 46 | 0.550 | 0.487–0.613 | +35 ±44 | 67.5% | 26.9% | 5.6% | 130.1±79.4 | 0.30 | 0.028 | 0.621 | 0.08 | 0.97 | 0.39 | 1.43 | 0.074 | 0.479 | 0.356 | balance,timeouts |
| GLQMGRAK | 160 | 49 | 79 | 32 | 0.553 | 0.499–0.608 | +37 ±38 | 50.6% | 41.3% | 8.1% | 140.2±77.9 | 0.27 | 0.043 | 0.639 | 0.09 | 0.97 | 0.41 | 1.59 | -0.109 | 0.463 | 0.439 | balance,timeouts |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| SAQLMRRK | 160 | 60 | 50 | 50 | 0.531 | 0.467–0.595 | +22 ±45 | 68.8% | 30.0% | 1.3% | 121.0±55.4 | 0.32 | 0.027 | 0.629 | 0.11 | 0.97 | 0.40 | 1.37 | 0.171 | 0.494 | 0.374 | balance |
| MLQGRMKA | 160 | 54 | 58 | 48 | 0.519 | 0.457–0.581 | +13 ±43 | 63.7% | 29.4% | 6.9% | 137.9±72.0 | 0.32 | 0.028 | 0.625 | 0.12 | 0.97 | 0.42 | 1.49 | 0.177 | 0.493 | 0.489 | timeouts |
| KGRMAMQL | 160 | 51 | 66 | 43 | 0.525 | 0.466–0.584 | +17 ±41 | 58.8% | 35.0% | 6.3% | 141.9±73.6 | 0.33 | 0.029 | 0.630 | 0.10 | 0.97 | 0.42 | 1.59 | 0.099 | 0.488 | 0.467 | timeouts |
| LRRKGAMS | 160 | 62 | 52 | 46 | 0.550 | 0.487–0.613 | +35 ±44 | 67.5% | 26.9% | 5.6% | 130.1±79.4 | 0.30 | 0.028 | 0.621 | 0.08 | 0.97 | 0.39 | 1.43 | 0.074 | 0.479 | 0.356 | balance,timeouts |
| AGRSQMLK | 160 | 55 | 61 | 44 | 0.534 | 0.474–0.595 | +24 ±42 | 61.9% | 33.8% | 4.4% | 135.0±70.9 | 0.29 | 0.035 | 0.624 | 0.10 | 0.97 | 0.43 | 1.47 | 0.088 | 0.479 | 0.393 | balance |
| KQALMSMG | 160 | 36 | 88 | 36 | 0.500 | 0.448–0.552 | +0 ±36 | 45.0% | 45.6% | 9.4% | 145.7±78.0 | 0.28 | 0.037 | 0.651 | 0.09 | 0.97 | 0.41 | 1.48 | 0.075 | 0.478 | 0.371 | timeouts |
| QMSMAGGK | 160 | 35 | 92 | 33 | 0.506 | 0.456–0.557 | +4 ±35 | 42.5% | 48.8% | 8.8% | 154.0±81.0 | 0.29 | 0.047 | 0.675 | 0.08 | 0.97 | 0.40 | 1.70 | 0.021 | 0.476 | 0.371 | timeouts |
| GAGMSKQR | 160 | 35 | 90 | 35 | 0.500 | 0.449–0.551 | +0 ±36 | 43.8% | 46.9% | 9.4% | 153.5±78.6 | 0.27 | 0.039 | 0.661 | 0.08 | 0.97 | 0.39 | 1.80 | 0.062 | 0.476 | 0.358 | timeouts |
| QRALSKRA | 160 | 49 | 70 | 41 | 0.525 | 0.467–0.583 | +17 ±40 | 56.3% | 35.0% | 8.8% | 132.3±75.2 | 0.27 | 0.027 | 0.632 | 0.09 | 0.97 | 0.43 | 1.06 | 0.074 | 0.475 | 0.369 | timeouts |
| QKGMRARS | 160 | 48 | 79 | 33 | 0.547 | 0.492–0.602 | +33 ±38 | 50.6% | 41.3% | 8.1% | 154.8±76.8 | 0.30 | 0.032 | 0.659 | 0.09 | 0.97 | 0.38 | 1.82 | -0.081 | 0.474 | 0.359 | balance,timeouts |
| AMSSKLMR | 160 | 51 | 71 | 38 | 0.541 | 0.483–0.598 | +28 ±40 | 55.6% | 34.4% | 10.0% | 157.3±79.1 | 0.27 | 0.032 | 0.641 | 0.10 | 0.97 | 0.39 | 1.41 | -0.003 | 0.473 | 0.357 | balance,timeouts |
| GRGALQSK | 160 | 38 | 82 | 40 | 0.494 | 0.440–0.548 | -4 ±38 | 48.8% | 41.3% | 10.0% | 151.1±85.2 | 0.27 | 0.027 | 0.626 | 0.07 | 0.97 | 0.38 | 1.35 | 0.084 | 0.472 | 0.354 | timeouts |
| GKSMAQRG | 160 | 27 | 102 | 31 | 0.487 | 0.441–0.534 | -9 ±32 | 36.3% | 50.6% | 13.1% | 163.3±81.9 | 0.26 | 0.043 | 0.667 | 0.09 | 0.97 | 0.37 | 1.90 | -0.069 | 0.466 | 0.353 | timeouts |
| RMGSAAGK | 160 | 34 | 100 | 26 | 0.525 | 0.478–0.572 | +17 ±33 | 37.5% | 48.1% | 14.4% | 165.8±84.9 | 0.29 | 0.053 | 0.670 | 0.07 | 0.96 | 0.35 | 1.98 | -0.113 | 0.465 | 0.345 | timeouts |
| GLQMGRAK | 160 | 49 | 79 | 32 | 0.553 | 0.499–0.608 | +37 ±38 | 50.6% | 41.3% | 8.1% | 140.2±77.9 | 0.27 | 0.043 | 0.639 | 0.09 | 0.97 | 0.41 | 1.59 | -0.109 | 0.463 | 0.439 | balance,timeouts |
| GAMRQSAK | 160 | 27 | 98 | 35 | 0.475 | 0.427–0.523 | -17 ±33 | 38.8% | 47.5% | 13.8% | 180.6±80.6 | 0.23 | 0.035 | 0.657 | 0.08 | 0.97 | 0.34 | 2.00 | -0.101 | 0.458 | 0.348 | timeouts |
| KSMGGRSL | 160 | 30 | 99 | 31 | 0.497 | 0.449–0.545 | -2 ±33 | 38.1% | 45.0% | 16.9% | 175.9±89.1 | 0.23 | 0.039 | 0.640 | 0.06 | 0.97 | 0.34 | 1.82 | -0.008 | 0.458 | 0.337 | timeouts |
| ARAMSSGK | 160 | 22 | 119 | 19 | 0.509 | 0.470–0.549 | +7 ±27 | 25.6% | 50.6% | 23.8% | 193.5±85.1 | 0.23 | 0.048 | 0.663 | 0.07 | 0.97 | 0.31 | 2.07 | -0.161 | 0.451 | 0.317 | timeouts |
| ASAGQMMK | 160 | 21 | 120 | 19 | 0.506 | 0.468–0.545 | +4 ±27 | 25.0% | 63.1% | 11.9% | 181.0±80.9 | 0.21 | 0.045 | 0.669 | 0.06 | 0.97 | 0.34 | 1.65 | -0.154 | 0.447 | 0.334 | timeouts,drawRate |
| SARGASGK | 160 | 23 | 109 | 28 | 0.484 | 0.441–0.528 | -11 ±30 | 31.9% | 58.1% | 10.0% | 179.9±76.8 | 0.19 | 0.042 | 0.656 | 0.06 | 0.97 | 0.34 | 1.63 | -0.127 | 0.444 | 0.333 | timeouts |

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
