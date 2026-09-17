# Sim report — cfg-b-full

3200 games. White score **0.517** (95% 0.504–0.531),
white advantage **+12 ± 9 Elo**.
Decisive 62.2% · draws 31.9% · capped 5.9% (counted apart, never as draws).
Plies: mean 138.3 ± 72.5, median 119. Rules: all defaults.

No complete colour-swapped pairs in this run.
σ_pg 0.3939 · normalized Elo +15 · LOS 99.4% ·
SPRT LLR 1.42 against ±2.94 (nElo 0 vs 4) → **continue**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | xDec | interest | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 3200 | 1051 | 1210 | 939 | 0.517 | 0.504–0.531 | +12 ±9 | 62.2% | 31.9% | 5.9% | 138.3±72.5 | 0.31 | 0.034 | 0.639 | 0.12 | 0.97 | 0.42 | 0.025 | 0.380 | timeouts |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | S | B | A | Q | K | M | P | G | N | L | R |
|---|---|---|---|---|---|---|---|---|---|---|---|
| use | 0.48 | 1.24 | 1.72 | 1.27 | 2.28 | 2.27 | 0.42 | 2.29 | 1.18 | 0.71 | 1.68 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 1990 | 62.2% |
| adjudicatedDraw | 604 | 18.9% |
| draw50 | 279 | 8.7% |
| plyCap | 189 | 5.9% |
| drawRepetition | 109 | 3.4% |
| drawMaterial | 27 | 0.8% |
| stalemate | 2 | 0.1% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| P | 93970 | 19047 | 35634 | 51200 | 14471 | 28.3% |
| K | 63200 | 3815 | 0 | 6400 | 6400 | 100.0% |
| M | 56478 | 3558 | 2862 | 5760 | 2898 | 50.3% |
| G | 47479 | 0 | 175 | 4800 | 4705 | 98.0% |
| A | 40457 | 7161 | 1440 | 5440 | 4001 | 73.5% |
| R | 39415 | 6286 | 3715 | 5440 | 1726 | 31.7% |
| N | 35964 | 6683 | 6062 | 7040 | 988 | 14.0% |
| B | 27484 | 5307 | 4005 | 5120 | 1115 | 21.8% |
| Q | 19352 | 4088 | 3162 | 3520 | 1359 | 38.6% |
| S | 10064 | 1531 | 1470 | 4800 | 3330 | 69.4% |
| L | 8828 | 1895 | 846 | 2880 | 141 | 4.9% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 7161 | 2.24 |
| beastChainMoves | 1394 | 0.44 |
| beastChainCaptures | 1531 | 0.48 |
| maesterSwaps | 20563 | 6.43 |
| maesterLongSwaps | 5273 | 1.65 |
| paladinSacrifices | 1895 | 0.59 |
| promotions | 1095 | 0.34 |
| checks | 22528 | 7.04 |

## Degeneracy counters
| counter | value |
|---|---|
| guard captures per game | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 306 (9.6%) |
| games where a king never moved | 616 (19.3%) |

## Interest terms, residualised on draw rate
Each term minus what this run's `term ~ a + b·drawRate` line predicts from the arrangement's draw
rate. The mean over the arrangements is 0 by construction, so read differences between pools, never
levels. Overall row, fitted on the 20 arrangements:
| killerMove | leadChange | uncertaintyLate | drama | permanence | fairyUse | excessDecisiveness | interest |
|---|---|---|---|---|---|---|---|
| 0.000 | 0.000 | -0.000 | 0.000 | -0.000 | -0.101 | 0.025 | -0.019 |

## Balance axis — back ranks by |white score − 0.5| (ascending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | xDec | interest | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| GKMMNNAR | 160 | 42 | 77 | 41 | 0.503 | 0.447–0.559 | +2 ±39 | 51.9% | 42.5% | 5.6% | 138.1±70.9 | 0.27 | 0.047 | 0.670 | 0.11 | 0.97 | 0.45 | -0.052 | 0.472 | timeouts |
| NBKLRMQN | 160 | 67 | 27 | 66 | 0.503 | 0.432–0.574 | +2 ±49 | 83.1% | 16.9% | 0.0% | 105.9±44.5 | 0.38 | 0.038 | 0.633 | 0.14 | 0.96 | 0.51 | 0.260 | 0.483 | - |
| SBAAQKMS | 160 | 31 | 101 | 28 | 0.509 | 0.462–0.556 | +7 ±33 | 36.9% | 51.2% | 11.9% | 174.4±82.3 | 0.24 | 0.039 | 0.655 | 0.08 | 0.97 | 0.35 | -0.213 | 0.341 | timeouts |
| NKQRSBAG | 160 | 50 | 57 | 53 | 0.491 | 0.428–0.553 | -7 ±43 | 64.4% | 32.5% | 3.1% | 127.1±71.5 | 0.36 | 0.038 | 0.644 | 0.14 | 0.96 | 0.45 | 0.062 | 0.397 | - |
| RSGAKQSA | 160 | 17 | 122 | 21 | 0.487 | 0.450–0.525 | -9 ±26 | 23.8% | 55.6% | 20.6% | 185.3±88.8 | 0.20 | 0.041 | 0.655 | 0.05 | 0.97 | 0.33 | -0.350 | 0.314 | timeouts,drawRate |
| KMRGLABB | 160 | 55 | 46 | 59 | 0.487 | 0.422–0.553 | -9 ±45 | 71.3% | 24.4% | 4.4% | 135.7±60.2 | 0.35 | 0.033 | 0.639 | 0.13 | 0.97 | 0.46 | 0.125 | 0.425 | - |
| LNAKNMAM | 160 | 44 | 67 | 49 | 0.484 | 0.425–0.543 | -11 ±41 | 58.1% | 33.1% | 8.8% | 157.5±69.6 | 0.32 | 0.032 | 0.641 | 0.15 | 0.97 | 0.40 | -0.012 | 0.419 | timeouts |
| KRNQMABG | 160 | 54 | 57 | 49 | 0.516 | 0.454–0.578 | +11 ±43 | 64.4% | 33.8% | 1.9% | 135.8±62.0 | 0.33 | 0.031 | 0.644 | 0.13 | 0.97 | 0.44 | 0.050 | 0.491 | - |
| LRQNMSKB | 160 | 62 | 43 | 55 | 0.522 | 0.456–0.588 | +15 ±46 | 73.1% | 23.1% | 3.8% | 112.2±63.2 | 0.32 | 0.025 | 0.618 | 0.12 | 0.97 | 0.44 | 0.126 | 0.376 | - |
| ASABKNGM | 160 | 31 | 90 | 39 | 0.475 | 0.424–0.526 | -17 ±36 | 43.8% | 42.5% | 13.8% | 181.3±78.4 | 0.27 | 0.035 | 0.656 | 0.09 | 0.97 | 0.35 | -0.173 | 0.346 | timeouts |
| RKNBBQSM | 160 | 60 | 31 | 69 | 0.472 | 0.402–0.541 | -20 ±48 | 80.6% | 17.5% | 1.9% | 103.9±53.6 | 0.42 | 0.040 | 0.651 | 0.16 | 0.96 | 0.38 | 0.190 | 0.395 | - |
| RKNNSQMA | 160 | 62 | 46 | 52 | 0.531 | 0.466–0.596 | +22 ±45 | 71.3% | 26.3% | 2.5% | 128.0±59.6 | 0.34 | 0.040 | 0.649 | 0.15 | 0.97 | 0.47 | 0.091 | 0.399 | balance |
| RMSNRKGQ | 160 | 49 | 51 | 60 | 0.466 | 0.402–0.529 | -24 ±44 | 68.1% | 29.4% | 2.5% | 138.3±66.4 | 0.35 | 0.042 | 0.649 | 0.15 | 0.97 | 0.44 | 0.054 | 0.396 | balance |
| BGKMGSNN | 160 | 50 | 71 | 39 | 0.534 | 0.477–0.592 | +24 ±40 | 55.6% | 38.8% | 5.6% | 130.1±75.5 | 0.31 | 0.039 | 0.651 | 0.10 | 0.96 | 0.43 | -0.071 | 0.362 | balance,timeouts |
| MLGAKBNS | 160 | 54 | 64 | 42 | 0.537 | 0.478–0.597 | +26 ±42 | 60.0% | 33.1% | 6.9% | 153.0±71.7 | 0.30 | 0.031 | 0.621 | 0.12 | 0.97 | 0.42 | -0.033 | 0.368 | balance,timeouts |
| RSNMGKAB | 160 | 54 | 65 | 41 | 0.541 | 0.481–0.600 | +28 ±41 | 59.4% | 30.0% | 10.6% | 153.0±77.7 | 0.30 | 0.034 | 0.638 | 0.13 | 0.97 | 0.41 | -0.045 | 0.380 | balance,timeouts |
| QGBRALKN | 160 | 69 | 36 | 55 | 0.544 | 0.476–0.612 | +30 ±47 | 77.5% | 20.0% | 2.5% | 111.3±67.1 | 0.32 | 0.023 | 0.607 | 0.13 | 0.96 | 0.45 | 0.130 | 0.447 | balance |
| NKLSBGGR | 160 | 55 | 69 | 36 | 0.559 | 0.502–0.617 | +41 ±40 | 56.9% | 35.0% | 8.1% | 148.2±75.7 | 0.27 | 0.022 | 0.618 | 0.08 | 0.97 | 0.40 | -0.104 | 0.353 | balance,timeouts |
| KLSMRRGN | 160 | 59 | 64 | 37 | 0.569 | 0.510–0.628 | +48 ±41 | 60.0% | 36.3% | 3.8% | 132.0±66.1 | 0.30 | 0.024 | 0.636 | 0.10 | 0.97 | 0.44 | -0.090 | 0.371 | balance |
| QMNKRABL | 160 | 86 | 26 | 48 | 0.619 | 0.550–0.687 | +84 ±48 | 83.8% | 16.3% | 0.0% | 115.7±53.0 | 0.30 | 0.025 | 0.600 | 0.12 | 0.97 | 0.47 | 0.057 | 0.448 | balance |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | xDec | interest | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| KRNQMABG | 160 | 54 | 57 | 49 | 0.516 | 0.454–0.578 | +11 ±43 | 64.4% | 33.8% | 1.9% | 135.8±62.0 | 0.33 | 0.031 | 0.644 | 0.13 | 0.97 | 0.44 | 0.050 | 0.491 | - |
| NBKLRMQN | 160 | 67 | 27 | 66 | 0.503 | 0.432–0.574 | +2 ±49 | 83.1% | 16.9% | 0.0% | 105.9±44.5 | 0.38 | 0.038 | 0.633 | 0.14 | 0.96 | 0.51 | 0.260 | 0.483 | - |
| GKMMNNAR | 160 | 42 | 77 | 41 | 0.503 | 0.447–0.559 | +2 ±39 | 51.9% | 42.5% | 5.6% | 138.1±70.9 | 0.27 | 0.047 | 0.670 | 0.11 | 0.97 | 0.45 | -0.052 | 0.472 | timeouts |
| QMNKRABL | 160 | 86 | 26 | 48 | 0.619 | 0.550–0.687 | +84 ±48 | 83.8% | 16.3% | 0.0% | 115.7±53.0 | 0.30 | 0.025 | 0.600 | 0.12 | 0.97 | 0.47 | 0.057 | 0.448 | balance |
| QGBRALKN | 160 | 69 | 36 | 55 | 0.544 | 0.476–0.612 | +30 ±47 | 77.5% | 20.0% | 2.5% | 111.3±67.1 | 0.32 | 0.023 | 0.607 | 0.13 | 0.96 | 0.45 | 0.130 | 0.447 | balance |
| KMRGLABB | 160 | 55 | 46 | 59 | 0.487 | 0.422–0.553 | -9 ±45 | 71.3% | 24.4% | 4.4% | 135.7±60.2 | 0.35 | 0.033 | 0.639 | 0.13 | 0.97 | 0.46 | 0.125 | 0.425 | - |
| LNAKNMAM | 160 | 44 | 67 | 49 | 0.484 | 0.425–0.543 | -11 ±41 | 58.1% | 33.1% | 8.8% | 157.5±69.6 | 0.32 | 0.032 | 0.641 | 0.15 | 0.97 | 0.40 | -0.012 | 0.419 | timeouts |
| RKNNSQMA | 160 | 62 | 46 | 52 | 0.531 | 0.466–0.596 | +22 ±45 | 71.3% | 26.3% | 2.5% | 128.0±59.6 | 0.34 | 0.040 | 0.649 | 0.15 | 0.97 | 0.47 | 0.091 | 0.399 | balance |
| NKQRSBAG | 160 | 50 | 57 | 53 | 0.491 | 0.428–0.553 | -7 ±43 | 64.4% | 32.5% | 3.1% | 127.1±71.5 | 0.36 | 0.038 | 0.644 | 0.14 | 0.96 | 0.45 | 0.062 | 0.397 | - |
| RMSNRKGQ | 160 | 49 | 51 | 60 | 0.466 | 0.402–0.529 | -24 ±44 | 68.1% | 29.4% | 2.5% | 138.3±66.4 | 0.35 | 0.042 | 0.649 | 0.15 | 0.97 | 0.44 | 0.054 | 0.396 | balance |
| RKNBBQSM | 160 | 60 | 31 | 69 | 0.472 | 0.402–0.541 | -20 ±48 | 80.6% | 17.5% | 1.9% | 103.9±53.6 | 0.42 | 0.040 | 0.651 | 0.16 | 0.96 | 0.38 | 0.190 | 0.395 | - |
| RSNMGKAB | 160 | 54 | 65 | 41 | 0.541 | 0.481–0.600 | +28 ±41 | 59.4% | 30.0% | 10.6% | 153.0±77.7 | 0.30 | 0.034 | 0.638 | 0.13 | 0.97 | 0.41 | -0.045 | 0.380 | balance,timeouts |
| LRQNMSKB | 160 | 62 | 43 | 55 | 0.522 | 0.456–0.588 | +15 ±46 | 73.1% | 23.1% | 3.8% | 112.2±63.2 | 0.32 | 0.025 | 0.618 | 0.12 | 0.97 | 0.44 | 0.126 | 0.376 | - |
| KLSMRRGN | 160 | 59 | 64 | 37 | 0.569 | 0.510–0.628 | +48 ±41 | 60.0% | 36.3% | 3.8% | 132.0±66.1 | 0.30 | 0.024 | 0.636 | 0.10 | 0.97 | 0.44 | -0.090 | 0.371 | balance |
| MLGAKBNS | 160 | 54 | 64 | 42 | 0.537 | 0.478–0.597 | +26 ±42 | 60.0% | 33.1% | 6.9% | 153.0±71.7 | 0.30 | 0.031 | 0.621 | 0.12 | 0.97 | 0.42 | -0.033 | 0.368 | balance,timeouts |
| BGKMGSNN | 160 | 50 | 71 | 39 | 0.534 | 0.477–0.592 | +24 ±40 | 55.6% | 38.8% | 5.6% | 130.1±75.5 | 0.31 | 0.039 | 0.651 | 0.10 | 0.96 | 0.43 | -0.071 | 0.362 | balance,timeouts |
| NKLSBGGR | 160 | 55 | 69 | 36 | 0.559 | 0.502–0.617 | +41 ±40 | 56.9% | 35.0% | 8.1% | 148.2±75.7 | 0.27 | 0.022 | 0.618 | 0.08 | 0.97 | 0.40 | -0.104 | 0.353 | balance,timeouts |
| ASABKNGM | 160 | 31 | 90 | 39 | 0.475 | 0.424–0.526 | -17 ±36 | 43.8% | 42.5% | 13.8% | 181.3±78.4 | 0.27 | 0.035 | 0.656 | 0.09 | 0.97 | 0.35 | -0.173 | 0.346 | timeouts |
| SBAAQKMS | 160 | 31 | 101 | 28 | 0.509 | 0.462–0.556 | +7 ±33 | 36.9% | 51.2% | 11.9% | 174.4±82.3 | 0.24 | 0.039 | 0.655 | 0.08 | 0.97 | 0.35 | -0.213 | 0.341 | timeouts |
| RSGAKQSA | 160 | 17 | 122 | 21 | 0.487 | 0.450–0.525 | -9 ±26 | 23.8% | 55.6% | 20.6% | 185.3±88.8 | 0.20 | 0.041 | 0.655 | 0.05 | 0.97 | 0.33 | -0.350 | 0.314 | timeouts,drawRate |

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
