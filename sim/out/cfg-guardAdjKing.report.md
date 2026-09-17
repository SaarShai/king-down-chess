# Sim report — cfg-guardAdjKing

3200 games. White score **0.532** (95% 0.520–0.545),
white advantage **+23 ± 9 Elo**.
Decisive 54.3% · draws 38.4% · capped 7.2% (counted apart, never as draws).
Plies: mean 146.1 ± 76.5, median 122. Rules: all defaults.

No complete colour-swapped pairs in this run.
σ_pg 0.3670 · normalized Elo +31 · LOS 100.0% ·
SPRT LLR 3.03 against ±2.94 (nElo 0 vs 4) → **H1**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 3200 | 973 | 1462 | 765 | 0.532 | 0.520–0.545 | +23 ±9 | 54.3% | 38.4% | 7.2% | 146.1±76.5 | 0.30 | 0.037 | 0.649 | 0.10 | 0.97 | 0.41 | 1.44 | 0.009 | 0.479 | 0.374 | balance,timeouts |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | R | S | N | M | G | K | A | B | P | L | Q |
|---|---|---|---|---|---|---|---|---|---|---|---|
| use | 1.79 | 0.47 | 1.19 | 2.56 | 1.70 | 1.77 | 1.71 | 1.40 | 0.41 | 0.76 | 1.37 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 1738 | 54.3% |
| adjudicatedDraw | 685 | 21.4% |
| draw50 | 377 | 11.8% |
| plyCap | 232 | 7.2% |
| drawRepetition | 135 | 4.2% |
| drawMaterial | 33 | 1.0% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| P | 96660 | 19274 | 35828 | 51200 | 14262 | 27.9% |
| G | 79664 | 0 | 337 | 10240 | 10000 | 97.7% |
| M | 71186 | 4554 | 2622 | 6080 | 3458 | 56.9% |
| K | 51744 | 3390 | 0 | 6400 | 6400 | 100.0% |
| N | 40079 | 7408 | 6393 | 7360 | 970 | 13.2% |
| R | 36656 | 5589 | 3087 | 4480 | 1394 | 31.1% |
| A | 34929 | 6238 | 1309 | 4480 | 3171 | 70.8% |
| B | 34726 | 6489 | 4052 | 5440 | 1388 | 25.5% |
| Q | 10014 | 2056 | 1550 | 1600 | 1059 | 66.2% |
| S | 9644 | 1341 | 1404 | 4480 | 3076 | 68.7% |
| L | 2214 | 420 | 177 | 640 | 43 | 6.7% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 6238 | 1.95 |
| beastChainMoves | 1232 | 0.39 |
| beastChainCaptures | 1341 | 0.42 |
| maesterSwaps | 30962 | 9.68 |
| maesterLongSwaps | 3316 | 1.04 |
| paladinSacrifices | 420 | 0.13 |
| promotions | 1110 | 0.35 |
| checks | 18450 | 5.77 |

## Degeneracy counters
| counter | value |
|---|---|
| guard captures per game | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 410 (12.8%) |
| games where a king never moved | 772 (24.1%) |

## Interest terms, residualised on draw rate
Each term minus what this run's `term ~ a + b·drawRate` line predicts from the arrangement's draw
rate. The mean over the arrangements is 0 by construction, so read differences between pools, never
levels. Overall row, fitted on the 20 arrangements:
| killerMove | leadChange | uncertaintyLate | drama | permanence | fairyUse | excessDecisiveness | interest | interestMinFairy |
|---|---|---|---|---|---|---|---|---|
| -0.000 | -0.000 | 0.000 | 0.000 | -0.000 | 0.000 | 0.009 | 0.001 | -0.039 |

## Balance axis — back ranks by |white score − 0.5| (ascending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| MSQNGKBG | 160 | 38 | 85 | 37 | 0.503 | 0.450–0.556 | +2 ±37 | 46.9% | 45.6% | 7.5% | 146.5±74.9 | 0.30 | 0.036 | 0.656 | 0.09 | 0.97 | 0.42 | 1.61 | -0.006 | 0.477 | 0.364 | timeouts |
| RBSANKGN | 160 | 45 | 72 | 43 | 0.506 | 0.449–0.564 | +4 ±40 | 55.0% | 41.9% | 3.1% | 140.5±70.2 | 0.33 | 0.033 | 0.644 | 0.12 | 0.97 | 0.42 | 1.58 | 0.069 | 0.492 | 0.402 | - |
| RMSNRKGQ | 160 | 50 | 57 | 53 | 0.491 | 0.428–0.553 | -7 ±43 | 64.4% | 33.8% | 1.9% | 132.7±62.4 | 0.34 | 0.044 | 0.655 | 0.14 | 0.97 | 0.46 | 1.47 | 0.157 | 0.500 | 0.404 | - |
| MGKBNGAR | 160 | 35 | 85 | 40 | 0.484 | 0.431–0.537 | -11 ±37 | 46.9% | 42.5% | 10.6% | 158.6±78.4 | 0.25 | 0.038 | 0.656 | 0.10 | 0.97 | 0.39 | 1.75 | -0.031 | 0.468 | 0.468 | timeouts |
| SGKNQRMM | 160 | 44 | 66 | 50 | 0.481 | 0.422–0.541 | -13 ±41 | 58.8% | 37.5% | 3.8% | 130.0±61.9 | 0.35 | 0.044 | 0.663 | 0.12 | 0.97 | 0.37 | 1.44 | 0.081 | 0.496 | 0.370 | - |
| SMARNMGK | 160 | 35 | 97 | 28 | 0.522 | 0.473–0.570 | +15 ±34 | 39.4% | 47.5% | 13.1% | 168.2±83.3 | 0.24 | 0.044 | 0.662 | 0.08 | 0.97 | 0.37 | 1.58 | -0.119 | 0.458 | 0.346 | timeouts |
| NBBGMMKG | 160 | 54 | 60 | 46 | 0.525 | 0.464–0.586 | +17 ±42 | 62.5% | 33.1% | 4.4% | 118.5±67.7 | 0.38 | 0.037 | 0.670 | 0.13 | 0.97 | 0.52 | 1.72 | 0.106 | 0.507 | 0.507 | - |
| GSMBLKGA | 160 | 35 | 98 | 27 | 0.525 | 0.477–0.573 | +17 ±33 | 38.8% | 48.8% | 12.5% | 175.7±81.3 | 0.24 | 0.035 | 0.635 | 0.06 | 0.97 | 0.37 | 1.63 | -0.131 | 0.453 | 0.332 | timeouts,drawRate |
| NGMSAGKS | 160 | 36 | 98 | 26 | 0.531 | 0.483–0.579 | +22 ±33 | 38.8% | 46.9% | 14.4% | 183.9±77.7 | 0.27 | 0.036 | 0.662 | 0.08 | 0.96 | 0.34 | 2.23 | -0.144 | 0.462 | 0.351 | balance,timeouts |
| GKMMGNBR | 160 | 45 | 80 | 35 | 0.531 | 0.477–0.586 | +22 ±38 | 50.0% | 46.9% | 3.1% | 130.7±70.5 | 0.28 | 0.041 | 0.662 | 0.09 | 0.97 | 0.44 | 1.55 | -0.032 | 0.472 | 0.472 | balance |
| RSNMGKAB | 160 | 54 | 63 | 43 | 0.534 | 0.474–0.594 | +24 ±42 | 60.6% | 32.5% | 6.9% | 144.2±70.0 | 0.29 | 0.037 | 0.638 | 0.11 | 0.97 | 0.42 | 1.54 | 0.068 | 0.479 | 0.381 | balance,timeouts |
| BARMGKGS | 160 | 46 | 79 | 35 | 0.534 | 0.480–0.589 | +24 ±38 | 50.6% | 40.0% | 9.4% | 159.1±81.4 | 0.31 | 0.042 | 0.652 | 0.10 | 0.97 | 0.40 | 1.57 | -0.032 | 0.478 | 0.362 | balance,timeouts |
| GKANBSNS | 160 | 48 | 75 | 37 | 0.534 | 0.478–0.591 | +24 ±39 | 53.1% | 37.5% | 9.4% | 153.1±78.5 | 0.25 | 0.030 | 0.638 | 0.10 | 0.97 | 0.40 | 1.79 | -0.007 | 0.468 | 0.350 | balance,timeouts |
| GAAQKGBN | 160 | 51 | 69 | 40 | 0.534 | 0.476–0.593 | +24 ±40 | 56.9% | 35.0% | 8.1% | 141.7±83.9 | 0.32 | 0.027 | 0.645 | 0.09 | 0.96 | 0.40 | 1.63 | 0.031 | 0.485 | 0.485 | balance,timeouts |
| GKMMNNAR | 160 | 50 | 75 | 35 | 0.547 | 0.491–0.603 | +33 ±39 | 53.1% | 43.8% | 3.1% | 142.5±70.2 | 0.30 | 0.048 | 0.667 | 0.10 | 0.97 | 0.43 | 1.81 | -0.032 | 0.476 | 0.476 | balance |
| BGKMGSNN | 160 | 57 | 64 | 39 | 0.556 | 0.497–0.616 | +39 ±41 | 60.0% | 36.3% | 3.8% | 121.7±68.6 | 0.33 | 0.040 | 0.659 | 0.11 | 0.97 | 0.46 | 1.53 | 0.017 | 0.487 | 0.378 | balance |
| AGSBNRKG | 160 | 47 | 84 | 29 | 0.556 | 0.504–0.609 | +39 ±37 | 47.5% | 38.1% | 14.4% | 170.8±83.3 | 0.27 | 0.030 | 0.627 | 0.09 | 0.97 | 0.36 | 1.33 | -0.108 | 0.462 | 0.354 | balance,timeouts |
| RNGKBBMG | 160 | 58 | 68 | 34 | 0.575 | 0.517–0.633 | +53 ±40 | 57.5% | 35.0% | 7.5% | 147.7±75.9 | 0.31 | 0.037 | 0.659 | 0.12 | 0.97 | 0.41 | 1.96 | -0.046 | 0.481 | 0.481 | balance,timeouts |
| NGKLAQRB | 160 | 79 | 30 | 51 | 0.588 | 0.519–0.656 | +61 ±48 | 81.3% | 15.6% | 3.1% | 115.6±66.6 | 0.34 | 0.024 | 0.593 | 0.13 | 0.96 | 0.45 | 1.51 | 0.166 | 0.494 | 0.483 | balance |
| NRAGKGNB | 160 | 66 | 57 | 37 | 0.591 | 0.530–0.651 | +64 ±42 | 64.4% | 30.6% | 5.0% | 140.1±70.9 | 0.32 | 0.036 | 0.636 | 0.12 | 0.97 | 0.44 | 1.51 | -0.009 | 0.481 | 0.481 | balance |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| NBBGMMKG | 160 | 54 | 60 | 46 | 0.525 | 0.464–0.586 | +17 ±42 | 62.5% | 33.1% | 4.4% | 118.5±67.7 | 0.38 | 0.037 | 0.670 | 0.13 | 0.97 | 0.52 | 1.72 | 0.106 | 0.507 | 0.507 | - |
| RMSNRKGQ | 160 | 50 | 57 | 53 | 0.491 | 0.428–0.553 | -7 ±43 | 64.4% | 33.8% | 1.9% | 132.7±62.4 | 0.34 | 0.044 | 0.655 | 0.14 | 0.97 | 0.46 | 1.47 | 0.157 | 0.500 | 0.404 | - |
| SGKNQRMM | 160 | 44 | 66 | 50 | 0.481 | 0.422–0.541 | -13 ±41 | 58.8% | 37.5% | 3.8% | 130.0±61.9 | 0.35 | 0.044 | 0.663 | 0.12 | 0.97 | 0.37 | 1.44 | 0.081 | 0.496 | 0.370 | - |
| NGKLAQRB | 160 | 79 | 30 | 51 | 0.588 | 0.519–0.656 | +61 ±48 | 81.3% | 15.6% | 3.1% | 115.6±66.6 | 0.34 | 0.024 | 0.593 | 0.13 | 0.96 | 0.45 | 1.51 | 0.166 | 0.494 | 0.483 | balance |
| RBSANKGN | 160 | 45 | 72 | 43 | 0.506 | 0.449–0.564 | +4 ±40 | 55.0% | 41.9% | 3.1% | 140.5±70.2 | 0.33 | 0.033 | 0.644 | 0.12 | 0.97 | 0.42 | 1.58 | 0.069 | 0.492 | 0.402 | - |
| BGKMGSNN | 160 | 57 | 64 | 39 | 0.556 | 0.497–0.616 | +39 ±41 | 60.0% | 36.3% | 3.8% | 121.7±68.6 | 0.33 | 0.040 | 0.659 | 0.11 | 0.97 | 0.46 | 1.53 | 0.017 | 0.487 | 0.378 | balance |
| GAAQKGBN | 160 | 51 | 69 | 40 | 0.534 | 0.476–0.593 | +24 ±40 | 56.9% | 35.0% | 8.1% | 141.7±83.9 | 0.32 | 0.027 | 0.645 | 0.09 | 0.96 | 0.40 | 1.63 | 0.031 | 0.485 | 0.485 | balance,timeouts |
| NRAGKGNB | 160 | 66 | 57 | 37 | 0.591 | 0.530–0.651 | +64 ±42 | 64.4% | 30.6% | 5.0% | 140.1±70.9 | 0.32 | 0.036 | 0.636 | 0.12 | 0.97 | 0.44 | 1.51 | -0.009 | 0.481 | 0.481 | balance |
| RNGKBBMG | 160 | 58 | 68 | 34 | 0.575 | 0.517–0.633 | +53 ±40 | 57.5% | 35.0% | 7.5% | 147.7±75.9 | 0.31 | 0.037 | 0.659 | 0.12 | 0.97 | 0.41 | 1.96 | -0.046 | 0.481 | 0.481 | balance,timeouts |
| RSNMGKAB | 160 | 54 | 63 | 43 | 0.534 | 0.474–0.594 | +24 ±42 | 60.6% | 32.5% | 6.9% | 144.2±70.0 | 0.29 | 0.037 | 0.638 | 0.11 | 0.97 | 0.42 | 1.54 | 0.068 | 0.479 | 0.381 | balance,timeouts |
| BARMGKGS | 160 | 46 | 79 | 35 | 0.534 | 0.480–0.589 | +24 ±38 | 50.6% | 40.0% | 9.4% | 159.1±81.4 | 0.31 | 0.042 | 0.652 | 0.10 | 0.97 | 0.40 | 1.57 | -0.032 | 0.478 | 0.362 | balance,timeouts |
| MSQNGKBG | 160 | 38 | 85 | 37 | 0.503 | 0.450–0.556 | +2 ±37 | 46.9% | 45.6% | 7.5% | 146.5±74.9 | 0.30 | 0.036 | 0.656 | 0.09 | 0.97 | 0.42 | 1.61 | -0.006 | 0.477 | 0.364 | timeouts |
| GKMMNNAR | 160 | 50 | 75 | 35 | 0.547 | 0.491–0.603 | +33 ±39 | 53.1% | 43.8% | 3.1% | 142.5±70.2 | 0.30 | 0.048 | 0.667 | 0.10 | 0.97 | 0.43 | 1.81 | -0.032 | 0.476 | 0.476 | balance |
| GKMMGNBR | 160 | 45 | 80 | 35 | 0.531 | 0.477–0.586 | +22 ±38 | 50.0% | 46.9% | 3.1% | 130.7±70.5 | 0.28 | 0.041 | 0.662 | 0.09 | 0.97 | 0.44 | 1.55 | -0.032 | 0.472 | 0.472 | balance |
| MGKBNGAR | 160 | 35 | 85 | 40 | 0.484 | 0.431–0.537 | -11 ±37 | 46.9% | 42.5% | 10.6% | 158.6±78.4 | 0.25 | 0.038 | 0.656 | 0.10 | 0.97 | 0.39 | 1.75 | -0.031 | 0.468 | 0.468 | timeouts |
| GKANBSNS | 160 | 48 | 75 | 37 | 0.534 | 0.478–0.591 | +24 ±39 | 53.1% | 37.5% | 9.4% | 153.1±78.5 | 0.25 | 0.030 | 0.638 | 0.10 | 0.97 | 0.40 | 1.79 | -0.007 | 0.468 | 0.350 | balance,timeouts |
| NGMSAGKS | 160 | 36 | 98 | 26 | 0.531 | 0.483–0.579 | +22 ±33 | 38.8% | 46.9% | 14.4% | 183.9±77.7 | 0.27 | 0.036 | 0.662 | 0.08 | 0.96 | 0.34 | 2.23 | -0.144 | 0.462 | 0.351 | balance,timeouts |
| AGSBNRKG | 160 | 47 | 84 | 29 | 0.556 | 0.504–0.609 | +39 ±37 | 47.5% | 38.1% | 14.4% | 170.8±83.3 | 0.27 | 0.030 | 0.627 | 0.09 | 0.97 | 0.36 | 1.33 | -0.108 | 0.462 | 0.354 | balance,timeouts |
| SMARNMGK | 160 | 35 | 97 | 28 | 0.522 | 0.473–0.570 | +15 ±34 | 39.4% | 47.5% | 13.1% | 168.2±83.3 | 0.24 | 0.044 | 0.662 | 0.08 | 0.97 | 0.37 | 1.58 | -0.119 | 0.458 | 0.346 | timeouts |
| GSMBLKGA | 160 | 35 | 98 | 27 | 0.525 | 0.477–0.573 | +17 ±33 | 38.8% | 48.8% | 12.5% | 175.7±81.3 | 0.24 | 0.035 | 0.635 | 0.06 | 0.97 | 0.37 | 1.63 | -0.131 | 0.453 | 0.332 | timeouts,drawRate |

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
