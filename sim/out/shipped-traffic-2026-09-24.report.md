# Sim report — shipped-traffic-2026-09-24

24 games. White score **0.563** (95% 0.368–0.757),
white advantage **+44 ± 135 Elo**.
Decisive 95.8% · draws 4.2% · capped 0.0% (counted apart, never as draws).
Plies: mean 102.4 ± 60.7, median 102. Rules: all defaults.

No complete colour-swapped pairs in this run.
σ_pg 0.4855 · normalized Elo +45 · LOS 73.6% ·
SPRT LLR 0.03 against ±2.94 (nElo 0 vs 4) → **continue**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 24 | 13 | 1 | 10 | 0.563 | 0.368–0.757 | +44 ±135 | 95.8% | 4.2% | 0.0% | 102.4±60.7 | 0.34 | 0.092 | 0.632 | 0.23 | 0.95 | 0.40 | 1.82 | 0.833 | 0.539 | 0.539 | balance |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | A | G | N | K | Q | S | P | B | M | R | O |
|---|---|---|---|---|---|---|---|---|---|---|---|
| use | 2.33 | 1.16 | 1.24 | 1.82 | 1.91 | 1.80 | 0.40 | 0.79 | 2.01 | 1.52 | 1.16 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 23 | 95.8% |
| adjudicatedDraw | 1 | 4.2% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| P | 490 | 83 | 228 | 384 | 151 | 39.3% |
| A | 328 | 82 | 23 | 44 | 21 | 47.7% |
| S | 288 | 61 | 26 | 50 | 24 | 48.0% |
| M | 283 | 22 | 23 | 44 | 21 | 47.7% |
| K | 280 | 18 | 0 | 48 | 48 | 100.0% |
| R | 233 | 49 | 32 | 48 | 16 | 33.3% |
| N | 174 | 30 | 38 | 44 | 6 | 13.6% |
| B | 116 | 39 | 33 | 46 | 13 | 28.3% |
| Q | 110 | 27 | 12 | 18 | 11 | 61.1% |
| O | 82 | 15 | 11 | 22 | 11 | 50.0% |
| G | 74 | 0 | 0 | 20 | 20 | 100.0% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 82 | 3.42 |
| beastChainMoves | 37 | 1.54 |
| beastChainCaptures | 61 | 2.54 |
| maesterSwaps | 164 | 6.83 |
| maesterLongSwaps | 21 | 0.88 |
| paladinSacrifices | 0 | 0.00 |
| promotions | 5 | 0.21 |
| checks | 117 | 4.88 |
| ogreShoves | 36 | 1.50 |
| ogreShovesFriend | 35 | 1.46 |
| ogreShovesGuard | 0 | 0.00 |
| catapultChecks | 0 | 0.00 |

## Degeneracy counters
| counter | value |
|---|---|
| guard captures per game | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 0 (0.0%) |
| games where a king never moved | 9 (37.5%) |

## Interest terms, residualised on draw rate
Each term minus what this run's `term ~ a + b·drawRate` line predicts from the arrangement's draw
rate. The mean over the arrangements is 0 by construction, so read differences between pools, never
levels. Overall row, fitted on the 24 arrangements:
| killerMove | leadChange | uncertaintyLate | drama | permanence | fairyUse | excessDecisiveness | interest | interestMinFairy |
|---|---|---|---|---|---|---|---|---|
| 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.010 | 0.833 | 0.052 | 0.102 |

## Balance axis — back ranks by |white score − 0.5| (ascending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BMNRSKRM | 1 | 0 | 1 | 0 | 0.500 | 0.500–0.500 | +0 ±30 | 0.0% | 100.0% | 0.0% | 268.0±0.0 | 0.20 | 0.004 | 0.689 | 0.00 | 0.98 | 0.22 | 2.46 | 0.000 | 0.458 | 0.458 | duration,utilisation |
| AAGNNKQS | 1 | 0 | 0 | 1 | 0.000 | 0.000–0.000 | -2400 ±48 | 100.0% | 0.0% | 0.0% | 60.0±0.0 | 0.23 | 0.109 | 0.626 | 0.23 | 0.95 | 0.00 | 1.11 | 0.000 | 0.463 | 0.263 | balance,duration,utilisation |
| NBNKMMBS | 1 | 1 | 0 | 0 | 1.000 | 1.000–1.000 | +2400 ±48 | 100.0% | 0.0% | 0.0% | 37.0±0.0 | 0.94 | 0.313 | 0.691 | 0.18 | 0.91 | 0.22 | 2.27 | 0.000 | 0.573 | 0.573 | balance,duration,utilisation |
| RSKQANBR | 1 | 0 | 0 | 1 | 0.000 | 0.000–0.000 | -2400 ±48 | 100.0% | 0.0% | 0.0% | 102.0±0.0 | 0.39 | 0.052 | 0.541 | 0.17 | 0.96 | 0.45 | 1.96 | 0.000 | 0.487 | 0.487 | balance |
| KSBNMORB | 1 | 0 | 0 | 1 | 0.000 | 0.000–0.000 | -2400 ±48 | 100.0% | 0.0% | 0.0% | 157.0±0.0 | 0.25 | 0.020 | 0.676 | 0.33 | 0.96 | 0.31 | 2.50 | 0.000 | 0.502 | 0.502 | balance |
| SAMQMRBK | 1 | 1 | 0 | 0 | 1.000 | 1.000–1.000 | +2400 ±48 | 100.0% | 0.0% | 0.0% | 154.0±0.0 | 0.21 | 0.047 | 0.691 | 0.32 | 0.96 | 0.21 | 2.49 | 0.000 | 0.490 | 0.490 | balance,utilisation |
| KRMGBRSS | 1 | 0 | 0 | 1 | 0.000 | 0.000–0.000 | -2400 ±48 | 100.0% | 0.0% | 0.0% | 40.0±0.0 | 0.86 | 0.286 | 0.701 | 0.19 | 0.93 | 0.20 | 1.87 | 0.000 | 0.565 | 0.565 | balance,duration,utilisation |
| NBKSNOSQ | 1 | 0 | 0 | 1 | 0.000 | 0.000–0.000 | -2400 ±48 | 100.0% | 0.0% | 0.0% | 93.0±0.0 | 0.14 | 0.011 | 0.640 | 0.47 | 0.95 | 0.39 | 1.89 | 0.000 | 0.492 | 0.492 | balance |
| RNSSMAMK | 1 | 0 | 0 | 1 | 0.000 | 0.000–0.000 | -2400 ±48 | 100.0% | 0.0% | 0.0% | 133.0±0.0 | 0.43 | 0.023 | 0.571 | 0.55 | 0.93 | 0.32 | 1.96 | 0.000 | 0.547 | 0.515 | balance |
| SRMNSGBK | 1 | 1 | 0 | 0 | 1.000 | 1.000–1.000 | +2400 ±48 | 100.0% | 0.0% | 0.0% | 59.0±0.0 | 0.22 | 0.167 | 0.675 | 0.27 | 0.94 | 0.27 | 0.77 | 0.000 | 0.416 | 0.316 | balance,duration |
| GBMORSSK | 1 | 1 | 0 | 0 | 1.000 | 1.000–1.000 | +2400 ±48 | 100.0% | 0.0% | 0.0% | 226.0±0.0 | 0.34 | 0.005 | 0.603 | 0.15 | 0.97 | 0.07 | 2.96 | 0.000 | 0.492 | 0.492 | balance,duration,utilisation |
| QOKSAABR | 1 | 1 | 0 | 0 | 1.000 | 1.000–1.000 | +2400 ±48 | 100.0% | 0.0% | 0.0% | 111.0±0.0 | 0.50 | 0.038 | 0.662 | 0.36 | 0.95 | 0.34 | 1.91 | 0.000 | 0.549 | 0.549 | balance |
| GAKBSNSO | 1 | 0 | 0 | 1 | 0.000 | 0.000–0.000 | -2400 ±48 | 100.0% | 0.0% | 0.0% | 40.0±0.0 | 0.20 | 0.171 | 0.647 | 0.17 | 0.94 | 0.00 | 1.40 | 0.000 | 0.442 | 0.242 | balance,duration,utilisation |
| MKNBNORA | 1 | 1 | 0 | 0 | 1.000 | 1.000–1.000 | +2400 ±48 | 100.0% | 0.0% | 0.0% | 61.0±0.0 | 0.23 | 0.018 | 0.565 | 0.15 | 0.96 | 0.52 | 1.18 | 0.000 | 0.461 | 0.366 | balance,duration |
| OAGSSKBM | 1 | 0 | 0 | 1 | 0.000 | 0.000–0.000 | -2400 ±48 | 100.0% | 0.0% | 0.0% | 28.0±0.0 | 0.29 | 0.435 | 0.662 | 0.10 | 0.91 | 0.00 | 1.50 | 0.000 | 0.410 | 0.210 | balance,duration,utilisation |
| RBAKMRMA | 1 | 1 | 0 | 0 | 1.000 | 1.000–1.000 | +2400 ±48 | 100.0% | 0.0% | 0.0% | 106.0±0.0 | 0.31 | 0.040 | 0.629 | 0.52 | 0.95 | 0.42 | 2.23 | 0.000 | 0.526 | 0.526 | balance |
| KMABROBN | 1 | 0 | 0 | 1 | 0.000 | 0.000–0.000 | -2400 ±48 | 100.0% | 0.0% | 0.0% | 126.0±0.0 | 0.27 | 0.008 | 0.602 | 0.42 | 0.97 | 0.41 | 1.71 | 0.000 | 0.509 | 0.509 | balance |
| ABNGRKRA | 1 | 1 | 0 | 0 | 1.000 | 1.000–1.000 | +2400 ±48 | 100.0% | 0.0% | 0.0% | 112.0±0.0 | 0.15 | 0.037 | 0.651 | 0.30 | 0.96 | 0.36 | 2.86 | 0.000 | 0.473 | 0.473 | balance |
| RKNASQBM | 1 | 1 | 0 | 0 | 1.000 | 1.000–1.000 | +2400 ±48 | 100.0% | 0.0% | 0.0% | 81.0±0.0 | 0.27 | 0.026 | 0.539 | 0.18 | 0.97 | 0.40 | 2.04 | 0.000 | 0.471 | 0.471 | balance |
| RGQANKAO | 1 | 1 | 0 | 0 | 1.000 | 1.000–1.000 | +2400 ±48 | 100.0% | 0.0% | 0.0% | 80.0±0.0 | 0.14 | 0.000 | 0.645 | 0.00 | 0.96 | 0.20 | 1.70 | 0.000 | 0.440 | 0.440 | balance,utilisation |
| BNROKSAR | 1 | 1 | 0 | 0 | 1.000 | 1.000–1.000 | +2400 ±48 | 100.0% | 0.0% | 0.0% | 137.0±0.0 | 0.23 | 0.008 | 0.538 | 0.10 | 0.96 | 0.36 | 2.28 | 0.000 | 0.454 | 0.371 | balance |
| QSKARONN | 1 | 0 | 0 | 1 | 0.000 | 0.000–0.000 | -2400 ±48 | 100.0% | 0.0% | 0.0% | 171.0±0.0 | 0.24 | 0.048 | 0.656 | 0.10 | 0.96 | 0.39 | 1.92 | 0.000 | 0.464 | 0.464 | balance |
| NKAMMBBG | 1 | 1 | 0 | 0 | 1.000 | 1.000–1.000 | +2400 ±48 | 100.0% | 0.0% | 0.0% | 45.0±0.0 | 0.25 | 0.000 | 0.583 | 0.00 | 0.94 | 0.00 | 1.90 | 0.000 | 0.452 | 0.252 | balance,duration,utilisation |
| QSKAGMMR | 1 | 1 | 0 | 0 | 1.000 | 1.000–1.000 | +2400 ±48 | 100.0% | 0.0% | 0.0% | 31.0±0.0 | 0.88 | 0.346 | 0.681 | 0.25 | 0.90 | 0.52 | 1.87 | 0.000 | 0.562 | 0.465 | balance,duration |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| NBNKMMBS | 1 | 1 | 0 | 0 | 1.000 | 1.000–1.000 | +2400 ±48 | 100.0% | 0.0% | 0.0% | 37.0±0.0 | 0.94 | 0.313 | 0.691 | 0.18 | 0.91 | 0.22 | 2.27 | 0.000 | 0.573 | 0.573 | balance,duration,utilisation |
| KRMGBRSS | 1 | 0 | 0 | 1 | 0.000 | 0.000–0.000 | -2400 ±48 | 100.0% | 0.0% | 0.0% | 40.0±0.0 | 0.86 | 0.286 | 0.701 | 0.19 | 0.93 | 0.20 | 1.87 | 0.000 | 0.565 | 0.565 | balance,duration,utilisation |
| QSKAGMMR | 1 | 1 | 0 | 0 | 1.000 | 1.000–1.000 | +2400 ±48 | 100.0% | 0.0% | 0.0% | 31.0±0.0 | 0.88 | 0.346 | 0.681 | 0.25 | 0.90 | 0.52 | 1.87 | 0.000 | 0.562 | 0.465 | balance,duration |
| QOKSAABR | 1 | 1 | 0 | 0 | 1.000 | 1.000–1.000 | +2400 ±48 | 100.0% | 0.0% | 0.0% | 111.0±0.0 | 0.50 | 0.038 | 0.662 | 0.36 | 0.95 | 0.34 | 1.91 | 0.000 | 0.549 | 0.549 | balance |
| RNSSMAMK | 1 | 0 | 0 | 1 | 0.000 | 0.000–0.000 | -2400 ±48 | 100.0% | 0.0% | 0.0% | 133.0±0.0 | 0.43 | 0.023 | 0.571 | 0.55 | 0.93 | 0.32 | 1.96 | 0.000 | 0.547 | 0.515 | balance |
| RBAKMRMA | 1 | 1 | 0 | 0 | 1.000 | 1.000–1.000 | +2400 ±48 | 100.0% | 0.0% | 0.0% | 106.0±0.0 | 0.31 | 0.040 | 0.629 | 0.52 | 0.95 | 0.42 | 2.23 | 0.000 | 0.526 | 0.526 | balance |
| KMABROBN | 1 | 0 | 0 | 1 | 0.000 | 0.000–0.000 | -2400 ±48 | 100.0% | 0.0% | 0.0% | 126.0±0.0 | 0.27 | 0.008 | 0.602 | 0.42 | 0.97 | 0.41 | 1.71 | 0.000 | 0.509 | 0.509 | balance |
| KSBNMORB | 1 | 0 | 0 | 1 | 0.000 | 0.000–0.000 | -2400 ±48 | 100.0% | 0.0% | 0.0% | 157.0±0.0 | 0.25 | 0.020 | 0.676 | 0.33 | 0.96 | 0.31 | 2.50 | 0.000 | 0.502 | 0.502 | balance |
| NBKSNOSQ | 1 | 0 | 0 | 1 | 0.000 | 0.000–0.000 | -2400 ±48 | 100.0% | 0.0% | 0.0% | 93.0±0.0 | 0.14 | 0.011 | 0.640 | 0.47 | 0.95 | 0.39 | 1.89 | 0.000 | 0.492 | 0.492 | balance |
| GBMORSSK | 1 | 1 | 0 | 0 | 1.000 | 1.000–1.000 | +2400 ±48 | 100.0% | 0.0% | 0.0% | 226.0±0.0 | 0.34 | 0.005 | 0.603 | 0.15 | 0.97 | 0.07 | 2.96 | 0.000 | 0.492 | 0.492 | balance,duration,utilisation |
| SAMQMRBK | 1 | 1 | 0 | 0 | 1.000 | 1.000–1.000 | +2400 ±48 | 100.0% | 0.0% | 0.0% | 154.0±0.0 | 0.21 | 0.047 | 0.691 | 0.32 | 0.96 | 0.21 | 2.49 | 0.000 | 0.490 | 0.490 | balance,utilisation |
| RSKQANBR | 1 | 0 | 0 | 1 | 0.000 | 0.000–0.000 | -2400 ±48 | 100.0% | 0.0% | 0.0% | 102.0±0.0 | 0.39 | 0.052 | 0.541 | 0.17 | 0.96 | 0.45 | 1.96 | 0.000 | 0.487 | 0.487 | balance |
| ABNGRKRA | 1 | 1 | 0 | 0 | 1.000 | 1.000–1.000 | +2400 ±48 | 100.0% | 0.0% | 0.0% | 112.0±0.0 | 0.15 | 0.037 | 0.651 | 0.30 | 0.96 | 0.36 | 2.86 | 0.000 | 0.473 | 0.473 | balance |
| RKNASQBM | 1 | 1 | 0 | 0 | 1.000 | 1.000–1.000 | +2400 ±48 | 100.0% | 0.0% | 0.0% | 81.0±0.0 | 0.27 | 0.026 | 0.539 | 0.18 | 0.97 | 0.40 | 2.04 | 0.000 | 0.471 | 0.471 | balance |
| QSKARONN | 1 | 0 | 0 | 1 | 0.000 | 0.000–0.000 | -2400 ±48 | 100.0% | 0.0% | 0.0% | 171.0±0.0 | 0.24 | 0.048 | 0.656 | 0.10 | 0.96 | 0.39 | 1.92 | 0.000 | 0.464 | 0.464 | balance |
| AAGNNKQS | 1 | 0 | 0 | 1 | 0.000 | 0.000–0.000 | -2400 ±48 | 100.0% | 0.0% | 0.0% | 60.0±0.0 | 0.23 | 0.109 | 0.626 | 0.23 | 0.95 | 0.00 | 1.11 | 0.000 | 0.463 | 0.263 | balance,duration,utilisation |
| MKNBNORA | 1 | 1 | 0 | 0 | 1.000 | 1.000–1.000 | +2400 ±48 | 100.0% | 0.0% | 0.0% | 61.0±0.0 | 0.23 | 0.018 | 0.565 | 0.15 | 0.96 | 0.52 | 1.18 | 0.000 | 0.461 | 0.366 | balance,duration |
| BMNRSKRM | 1 | 0 | 1 | 0 | 0.500 | 0.500–0.500 | +0 ±30 | 0.0% | 100.0% | 0.0% | 268.0±0.0 | 0.20 | 0.004 | 0.689 | 0.00 | 0.98 | 0.22 | 2.46 | 0.000 | 0.458 | 0.458 | duration,utilisation |
| BNROKSAR | 1 | 1 | 0 | 0 | 1.000 | 1.000–1.000 | +2400 ±48 | 100.0% | 0.0% | 0.0% | 137.0±0.0 | 0.23 | 0.008 | 0.538 | 0.10 | 0.96 | 0.36 | 2.28 | 0.000 | 0.454 | 0.371 | balance |
| NKAMMBBG | 1 | 1 | 0 | 0 | 1.000 | 1.000–1.000 | +2400 ±48 | 100.0% | 0.0% | 0.0% | 45.0±0.0 | 0.25 | 0.000 | 0.583 | 0.00 | 0.94 | 0.00 | 1.90 | 0.000 | 0.452 | 0.252 | balance,duration,utilisation |
| GAKBSNSO | 1 | 0 | 0 | 1 | 0.000 | 0.000–0.000 | -2400 ±48 | 100.0% | 0.0% | 0.0% | 40.0±0.0 | 0.20 | 0.171 | 0.647 | 0.17 | 0.94 | 0.00 | 1.40 | 0.000 | 0.442 | 0.242 | balance,duration,utilisation |
| RGQANKAO | 1 | 1 | 0 | 0 | 1.000 | 1.000–1.000 | +2400 ±48 | 100.0% | 0.0% | 0.0% | 80.0±0.0 | 0.14 | 0.000 | 0.645 | 0.00 | 0.96 | 0.20 | 1.70 | 0.000 | 0.440 | 0.440 | balance,utilisation |
| SRMNSGBK | 1 | 1 | 0 | 0 | 1.000 | 1.000–1.000 | +2400 ±48 | 100.0% | 0.0% | 0.0% | 59.0±0.0 | 0.22 | 0.167 | 0.675 | 0.27 | 0.94 | 0.27 | 0.77 | 0.000 | 0.416 | 0.316 | balance,duration |
| OAGSSKBM | 1 | 0 | 0 | 1 | 0.000 | 0.000–0.000 | -2400 ±48 | 100.0% | 0.0% | 0.0% | 28.0±0.0 | 0.29 | 0.435 | 0.662 | 0.10 | 0.91 | 0.00 | 1.50 | 0.000 | 0.410 | 0.210 | balance,duration,utilisation |

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
