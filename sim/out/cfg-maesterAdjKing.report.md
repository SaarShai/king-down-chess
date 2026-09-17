# Sim report — cfg-maesterAdjKing

3200 games. White score **0.510** (95% 0.497–0.524),
white advantage **+7 ± 9 Elo**.
Decisive 59.6% · draws 34.0% · capped 6.4% (counted apart, never as draws).
Plies: mean 141.2 ± 72.5, median 121. Rules: all defaults.

No complete colour-swapped pairs in this run.
σ_pg 0.3858 · normalized Elo +9 · LOS 93.8% ·
SPRT LLR 0.79 against ±2.94 (nElo 0 vs 4) → **continue**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 3200 | 987 | 1293 | 920 | 0.510 | 0.497–0.524 | +7 ±9 | 59.6% | 34.0% | 6.4% | 141.2±72.5 | 0.32 | 0.037 | 0.647 | 0.12 | 0.97 | 0.43 | 1.41 | 0.003 | 0.484 | 0.384 | timeouts |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | A | S | G | R | K | M | P | N | B | L | Q |
|---|---|---|---|---|---|---|---|---|---|---|---|
| use | 1.76 | 0.50 | 1.72 | 1.78 | 1.92 | 2.24 | 0.43 | 1.15 | 1.23 | 0.82 | 1.38 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 1907 | 59.6% |
| adjudicatedDraw | 669 | 20.9% |
| draw50 | 259 | 8.1% |
| plyCap | 205 | 6.4% |
| drawRepetition | 133 | 4.2% |
| drawMaterial | 26 | 0.8% |
| stalemate | 1 | 0.0% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| P | 96131 | 19165 | 35793 | 51200 | 14166 | 27.7% |
| M | 91607 | 5844 | 4124 | 9280 | 5156 | 55.6% |
| K | 54232 | 3192 | 0 | 6400 | 6400 | 100.0% |
| G | 41316 | 0 | 146 | 5440 | 5395 | 99.2% |
| A | 39709 | 7688 | 1545 | 5120 | 3577 | 69.9% |
| R | 37656 | 5800 | 3408 | 4800 | 1394 | 29.0% |
| N | 35701 | 6841 | 6260 | 7040 | 785 | 11.2% |
| B | 22541 | 4698 | 3423 | 4160 | 739 | 17.8% |
| Q | 15628 | 3126 | 2510 | 2560 | 1178 | 46.0% |
| S | 9220 | 1218 | 1323 | 4160 | 2837 | 68.2% |
| L | 8142 | 1540 | 580 | 2240 | 121 | 5.4% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 7688 | 2.40 |
| beastChainMoves | 1100 | 0.34 |
| beastChainCaptures | 1218 | 0.38 |
| maesterSwaps | 35865 | 11.21 |
| maesterLongSwaps | 6906 | 2.16 |
| paladinSacrifices | 1540 | 0.48 |
| promotions | 1241 | 0.39 |
| checks | 20424 | 6.38 |

## Degeneracy counters
| counter | value |
|---|---|
| guard captures per game | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 285 (8.9%) |
| games where a king never moved | 922 (28.8%) |

## Interest terms, residualised on draw rate
Each term minus what this run's `term ~ a + b·drawRate` line predicts from the arrangement's draw
rate. The mean over the arrangements is 0 by construction, so read differences between pools, never
levels. Overall row, fitted on the 20 arrangements:
| killerMove | leadChange | uncertaintyLate | drama | permanence | fairyUse | excessDecisiveness | interest | interestMinFairy |
|---|---|---|---|---|---|---|---|---|
| 0.000 | 0.000 | -0.000 | -0.000 | 0.000 | 0.000 | 0.003 | 0.000 | -0.046 |

## Balance axis — back ranks by |white score − 0.5| (ascending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| MKMBNASL | 160 | 57 | 46 | 57 | 0.500 | 0.435–0.565 | +0 ±45 | 71.3% | 26.9% | 1.9% | 144.6±59.0 | 0.33 | 0.030 | 0.633 | 0.17 | 0.97 | 0.44 | 1.33 | 0.122 | 0.498 | 0.410 | - |
| RKMNAQNR | 160 | 60 | 40 | 60 | 0.500 | 0.433–0.567 | +0 ±47 | 75.0% | 23.1% | 1.9% | 120.0±54.3 | 0.35 | 0.036 | 0.646 | 0.14 | 0.97 | 0.49 | 1.74 | 0.159 | 0.502 | 0.502 | - |
| RNQKMMGN | 160 | 44 | 72 | 44 | 0.500 | 0.443–0.557 | +0 ±40 | 55.0% | 40.6% | 4.4% | 134.1±66.8 | 0.32 | 0.045 | 0.657 | 0.12 | 0.97 | 0.44 | 1.61 | -0.041 | 0.482 | 0.482 | - |
| SBAAQKMS | 160 | 35 | 91 | 34 | 0.503 | 0.452–0.554 | +2 ±35 | 43.1% | 46.9% | 10.0% | 164.6±78.6 | 0.25 | 0.036 | 0.659 | 0.09 | 0.97 | 0.36 | 1.52 | -0.160 | 0.459 | 0.347 | timeouts |
| QAMGMKNS | 160 | 36 | 86 | 38 | 0.494 | 0.441–0.546 | -4 ±37 | 46.3% | 41.9% | 11.9% | 153.1±80.7 | 0.33 | 0.051 | 0.660 | 0.10 | 0.97 | 0.41 | 1.65 | -0.130 | 0.476 | 0.367 | timeouts |
| SNGQKMSB | 160 | 52 | 53 | 55 | 0.491 | 0.427–0.554 | -7 ±44 | 66.9% | 26.3% | 6.9% | 139.5±72.2 | 0.36 | 0.030 | 0.634 | 0.16 | 0.96 | 0.41 | 1.98 | 0.076 | 0.501 | 0.382 | timeouts |
| RRBNMAMK | 160 | 60 | 43 | 57 | 0.509 | 0.443–0.576 | +7 ±46 | 73.1% | 23.1% | 3.8% | 128.3±62.9 | 0.35 | 0.037 | 0.651 | 0.14 | 0.97 | 0.45 | 1.61 | 0.138 | 0.500 | 0.500 | - |
| ASGRKMGS | 160 | 18 | 119 | 23 | 0.484 | 0.445–0.524 | -11 ±27 | 25.6% | 58.1% | 16.3% | 174.7±88.8 | 0.21 | 0.058 | 0.666 | 0.06 | 0.97 | 0.36 | 2.12 | -0.338 | 0.433 | 0.329 | timeouts,drawRate |
| GKMMGNBR | 160 | 39 | 77 | 44 | 0.484 | 0.429–0.540 | -11 ±39 | 51.9% | 40.0% | 8.1% | 132.3±77.2 | 0.32 | 0.051 | 0.661 | 0.10 | 0.97 | 0.44 | 1.58 | -0.075 | 0.476 | 0.476 | timeouts |
| NBBGMMKG | 160 | 45 | 64 | 51 | 0.481 | 0.421–0.541 | -13 ±42 | 60.0% | 34.4% | 5.6% | 129.5±70.0 | 0.34 | 0.042 | 0.666 | 0.12 | 0.97 | 0.48 | 1.85 | 0.005 | 0.491 | 0.491 | timeouts |
| MKNABSRN | 160 | 52 | 50 | 58 | 0.481 | 0.417–0.545 | -13 ±45 | 68.8% | 28.1% | 3.1% | 140.2±61.7 | 0.35 | 0.031 | 0.651 | 0.16 | 0.97 | 0.43 | 1.50 | 0.093 | 0.503 | 0.408 | - |
| MSKMNRLN | 160 | 50 | 53 | 57 | 0.478 | 0.415–0.541 | -15 ±44 | 66.9% | 32.5% | 0.6% | 123.6±60.3 | 0.31 | 0.045 | 0.644 | 0.12 | 0.97 | 0.45 | 1.08 | 0.073 | 0.485 | 0.376 | - |
| KMRGLABB | 160 | 57 | 57 | 46 | 0.534 | 0.472–0.596 | +24 ±43 | 64.4% | 32.5% | 3.1% | 133.8±64.1 | 0.33 | 0.025 | 0.639 | 0.13 | 0.97 | 0.47 | 1.60 | 0.046 | 0.492 | 0.426 | balance |
| QGNNMKRA | 160 | 54 | 64 | 42 | 0.537 | 0.478–0.597 | +26 ±42 | 60.0% | 33.1% | 6.9% | 148.6±76.0 | 0.30 | 0.035 | 0.644 | 0.13 | 0.97 | 0.40 | 1.79 | 0.002 | 0.483 | 0.483 | balance,timeouts |
| LMGRAMKQ | 160 | 43 | 61 | 56 | 0.459 | 0.399–0.520 | -28 ±42 | 61.9% | 30.0% | 8.1% | 146.5±77.1 | 0.30 | 0.027 | 0.616 | 0.11 | 0.97 | 0.40 | 1.59 | 0.020 | 0.478 | 0.474 | balance,timeouts |
| GKMMNNAR | 160 | 53 | 68 | 39 | 0.544 | 0.485–0.602 | +30 ±41 | 57.5% | 31.9% | 10.6% | 154.5±77.4 | 0.30 | 0.039 | 0.654 | 0.12 | 0.97 | 0.41 | 1.82 | -0.025 | 0.480 | 0.480 | balance,timeouts |
| RGNLABMK | 160 | 57 | 62 | 41 | 0.550 | 0.490–0.610 | +35 ±42 | 61.3% | 34.4% | 4.4% | 143.0±66.2 | 0.31 | 0.027 | 0.638 | 0.12 | 0.97 | 0.42 | 1.54 | 0.012 | 0.483 | 0.440 | balance |
| MKAALRBQ | 160 | 63 | 51 | 46 | 0.553 | 0.490–0.617 | +37 ±44 | 68.1% | 25.0% | 6.9% | 131.8±73.0 | 0.32 | 0.030 | 0.621 | 0.13 | 0.97 | 0.41 | 1.54 | 0.080 | 0.488 | 0.469 | balance,timeouts |
| BGKMGSNN | 160 | 57 | 64 | 39 | 0.556 | 0.497–0.616 | +39 ±41 | 60.0% | 36.3% | 3.8% | 121.7±68.6 | 0.33 | 0.040 | 0.659 | 0.11 | 0.97 | 0.46 | 1.53 | -0.002 | 0.485 | 0.377 | balance |
| MKLSANSG | 160 | 55 | 72 | 33 | 0.569 | 0.512–0.625 | +48 ±39 | 55.0% | 35.0% | 10.0% | 159.9±76.8 | 0.29 | 0.034 | 0.633 | 0.11 | 0.97 | 0.38 | 1.70 | -0.055 | 0.472 | 0.373 | balance,timeouts |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| MKNABSRN | 160 | 52 | 50 | 58 | 0.481 | 0.417–0.545 | -13 ±45 | 68.8% | 28.1% | 3.1% | 140.2±61.7 | 0.35 | 0.031 | 0.651 | 0.16 | 0.97 | 0.43 | 1.50 | 0.093 | 0.503 | 0.408 | - |
| RKMNAQNR | 160 | 60 | 40 | 60 | 0.500 | 0.433–0.567 | +0 ±47 | 75.0% | 23.1% | 1.9% | 120.0±54.3 | 0.35 | 0.036 | 0.646 | 0.14 | 0.97 | 0.49 | 1.74 | 0.159 | 0.502 | 0.502 | - |
| SNGQKMSB | 160 | 52 | 53 | 55 | 0.491 | 0.427–0.554 | -7 ±44 | 66.9% | 26.3% | 6.9% | 139.5±72.2 | 0.36 | 0.030 | 0.634 | 0.16 | 0.96 | 0.41 | 1.98 | 0.076 | 0.501 | 0.382 | timeouts |
| RRBNMAMK | 160 | 60 | 43 | 57 | 0.509 | 0.443–0.576 | +7 ±46 | 73.1% | 23.1% | 3.8% | 128.3±62.9 | 0.35 | 0.037 | 0.651 | 0.14 | 0.97 | 0.45 | 1.61 | 0.138 | 0.500 | 0.500 | - |
| MKMBNASL | 160 | 57 | 46 | 57 | 0.500 | 0.435–0.565 | +0 ±45 | 71.3% | 26.9% | 1.9% | 144.6±59.0 | 0.33 | 0.030 | 0.633 | 0.17 | 0.97 | 0.44 | 1.33 | 0.122 | 0.498 | 0.410 | - |
| KMRGLABB | 160 | 57 | 57 | 46 | 0.534 | 0.472–0.596 | +24 ±43 | 64.4% | 32.5% | 3.1% | 133.8±64.1 | 0.33 | 0.025 | 0.639 | 0.13 | 0.97 | 0.47 | 1.60 | 0.046 | 0.492 | 0.426 | balance |
| NBBGMMKG | 160 | 45 | 64 | 51 | 0.481 | 0.421–0.541 | -13 ±42 | 60.0% | 34.4% | 5.6% | 129.5±70.0 | 0.34 | 0.042 | 0.666 | 0.12 | 0.97 | 0.48 | 1.85 | 0.005 | 0.491 | 0.491 | timeouts |
| MKAALRBQ | 160 | 63 | 51 | 46 | 0.553 | 0.490–0.617 | +37 ±44 | 68.1% | 25.0% | 6.9% | 131.8±73.0 | 0.32 | 0.030 | 0.621 | 0.13 | 0.97 | 0.41 | 1.54 | 0.080 | 0.488 | 0.469 | balance,timeouts |
| BGKMGSNN | 160 | 57 | 64 | 39 | 0.556 | 0.497–0.616 | +39 ±41 | 60.0% | 36.3% | 3.8% | 121.7±68.6 | 0.33 | 0.040 | 0.659 | 0.11 | 0.97 | 0.46 | 1.53 | -0.002 | 0.485 | 0.377 | balance |
| MSKMNRLN | 160 | 50 | 53 | 57 | 0.478 | 0.415–0.541 | -15 ±44 | 66.9% | 32.5% | 0.6% | 123.6±60.3 | 0.31 | 0.045 | 0.644 | 0.12 | 0.97 | 0.45 | 1.08 | 0.073 | 0.485 | 0.376 | - |
| QGNNMKRA | 160 | 54 | 64 | 42 | 0.537 | 0.478–0.597 | +26 ±42 | 60.0% | 33.1% | 6.9% | 148.6±76.0 | 0.30 | 0.035 | 0.644 | 0.13 | 0.97 | 0.40 | 1.79 | 0.002 | 0.483 | 0.483 | balance,timeouts |
| RGNLABMK | 160 | 57 | 62 | 41 | 0.550 | 0.490–0.610 | +35 ±42 | 61.3% | 34.4% | 4.4% | 143.0±66.2 | 0.31 | 0.027 | 0.638 | 0.12 | 0.97 | 0.42 | 1.54 | 0.012 | 0.483 | 0.440 | balance |
| RNQKMMGN | 160 | 44 | 72 | 44 | 0.500 | 0.443–0.557 | +0 ±40 | 55.0% | 40.6% | 4.4% | 134.1±66.8 | 0.32 | 0.045 | 0.657 | 0.12 | 0.97 | 0.44 | 1.61 | -0.041 | 0.482 | 0.482 | - |
| GKMMNNAR | 160 | 53 | 68 | 39 | 0.544 | 0.485–0.602 | +30 ±41 | 57.5% | 31.9% | 10.6% | 154.5±77.4 | 0.30 | 0.039 | 0.654 | 0.12 | 0.97 | 0.41 | 1.82 | -0.025 | 0.480 | 0.480 | balance,timeouts |
| LMGRAMKQ | 160 | 43 | 61 | 56 | 0.459 | 0.399–0.520 | -28 ±42 | 61.9% | 30.0% | 8.1% | 146.5±77.1 | 0.30 | 0.027 | 0.616 | 0.11 | 0.97 | 0.40 | 1.59 | 0.020 | 0.478 | 0.474 | balance,timeouts |
| GKMMGNBR | 160 | 39 | 77 | 44 | 0.484 | 0.429–0.540 | -11 ±39 | 51.9% | 40.0% | 8.1% | 132.3±77.2 | 0.32 | 0.051 | 0.661 | 0.10 | 0.97 | 0.44 | 1.58 | -0.075 | 0.476 | 0.476 | timeouts |
| QAMGMKNS | 160 | 36 | 86 | 38 | 0.494 | 0.441–0.546 | -4 ±37 | 46.3% | 41.9% | 11.9% | 153.1±80.7 | 0.33 | 0.051 | 0.660 | 0.10 | 0.97 | 0.41 | 1.65 | -0.130 | 0.476 | 0.367 | timeouts |
| MKLSANSG | 160 | 55 | 72 | 33 | 0.569 | 0.512–0.625 | +48 ±39 | 55.0% | 35.0% | 10.0% | 159.9±76.8 | 0.29 | 0.034 | 0.633 | 0.11 | 0.97 | 0.38 | 1.70 | -0.055 | 0.472 | 0.373 | balance,timeouts |
| SBAAQKMS | 160 | 35 | 91 | 34 | 0.503 | 0.452–0.554 | +2 ±35 | 43.1% | 46.9% | 10.0% | 164.6±78.6 | 0.25 | 0.036 | 0.659 | 0.09 | 0.97 | 0.36 | 1.52 | -0.160 | 0.459 | 0.347 | timeouts |
| ASGRKMGS | 160 | 18 | 119 | 23 | 0.484 | 0.445–0.524 | -11 ±27 | 25.6% | 58.1% | 16.3% | 174.7±88.8 | 0.21 | 0.058 | 0.666 | 0.06 | 0.97 | 0.36 | 2.12 | -0.338 | 0.433 | 0.329 | timeouts,drawRate |

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
