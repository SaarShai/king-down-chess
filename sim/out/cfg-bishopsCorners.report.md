# Sim report — cfg-bishopsCorners

3200 games. White score **0.525** (95% 0.511–0.538),
white advantage **+17 ± 10 Elo**.
Decisive 65.2% · draws 29.9% · capped 5.0% (counted apart, never as draws).
Plies: mean 131.3 ± 69.5, median 109. Rules: all defaults.

No complete colour-swapped pairs in this run.
σ_pg 0.4029 · normalized Elo +21 · LOS 100.0% ·
SPRT LLR 2.03 against ±2.94 (nElo 0 vs 4) → **continue**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 3200 | 1121 | 1115 | 964 | 0.525 | 0.511–0.538 | +17 ±10 | 65.2% | 29.9% | 5.0% | 131.3±69.5 | 0.34 | 0.034 | 0.638 | 0.13 | 0.97 | 0.45 | 1.58 | 0.008 | 0.489 | 0.388 | - |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | B | A | G | N | K | R | P | S | Q | L | M |
|---|---|---|---|---|---|---|---|---|---|---|---|
| use | 0.88 | 1.67 | 2.52 | 1.16 | 2.34 | 1.81 | 0.45 | 0.50 | 1.57 | 0.82 | 2.37 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 2083 | 65.1% |
| adjudicatedDraw | 552 | 17.3% |
| draw50 | 269 | 8.4% |
| plyCap | 159 | 5.0% |
| drawRepetition | 100 | 3.1% |
| drawMaterial | 35 | 1.1% |
| checkmate | 2 | 0.1% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| P | 95073 | 19159 | 34190 | 51200 | 15723 | 30.7% |
| K | 61515 | 5009 | 0 | 6400 | 6400 | 100.0% |
| G | 56193 | 0 | 264 | 5440 | 5276 | 97.0% |
| M | 46630 | 3793 | 2377 | 4800 | 2424 | 50.5% |
| B | 46005 | 10688 | 10959 | 12800 | 1841 | 14.4% |
| A | 30707 | 5535 | 1234 | 4480 | 3247 | 72.5% |
| N | 25921 | 5009 | 4762 | 5440 | 680 | 12.5% |
| R | 23750 | 4070 | 2178 | 3200 | 1023 | 32.0% |
| Q | 20557 | 4449 | 2960 | 3200 | 1419 | 44.3% |
| S | 7169 | 1512 | 1103 | 3520 | 2417 | 68.7% |
| L | 6488 | 1298 | 495 | 1920 | 130 | 6.8% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 5535 | 1.73 |
| beastChainMoves | 1314 | 0.41 |
| beastChainCaptures | 1512 | 0.47 |
| maesterSwaps | 17194 | 5.37 |
| maesterLongSwaps | 3908 | 1.22 |
| paladinSacrifices | 1298 | 0.41 |
| promotions | 1287 | 0.40 |
| checks | 21175 | 6.62 |

## Degeneracy counters
| counter | value |
|---|---|
| guard captures per game | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 304 (9.5%) |
| games where a king never moved | 520 (16.3%) |

## Interest terms, residualised on draw rate
Each term minus what this run's `term ~ a + b·drawRate` line predicts from the arrangement's draw
rate. The mean over the arrangements is 0 by construction, so read differences between pools, never
levels. Overall row, fitted on the 20 arrangements:
| killerMove | leadChange | uncertaintyLate | drama | permanence | fairyUse | excessDecisiveness | interest | interestMinFairy |
|---|---|---|---|---|---|---|---|---|
| 0.000 | 0.000 | -0.000 | 0.000 | 0.000 | 0.000 | 0.008 | 0.001 | -0.045 |

## Balance axis — back ranks by |white score − 0.5| (ascending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BSGQNAKB | 160 | 46 | 67 | 47 | 0.497 | 0.438–0.556 | -2 ±41 | 58.1% | 37.5% | 4.4% | 136.8±70.7 | 0.33 | 0.037 | 0.650 | 0.13 | 0.96 | 0.44 | 1.83 | -0.038 | 0.484 | 0.374 | - |
| BAGKQSAB | 160 | 44 | 73 | 43 | 0.503 | 0.446–0.560 | +2 ±40 | 54.4% | 32.5% | 13.1% | 148.0±83.0 | 0.29 | 0.028 | 0.622 | 0.09 | 0.97 | 0.40 | 1.76 | -0.076 | 0.468 | 0.362 | timeouts |
| BAGKQRAB | 160 | 50 | 62 | 48 | 0.506 | 0.446–0.567 | +4 ±42 | 61.3% | 30.6% | 8.1% | 133.1±79.6 | 0.34 | 0.030 | 0.624 | 0.11 | 0.97 | 0.44 | 1.85 | -0.010 | 0.485 | 0.485 | timeouts |
| BNKRSGMB | 160 | 56 | 51 | 53 | 0.509 | 0.445–0.573 | +7 ±44 | 68.1% | 30.0% | 1.9% | 135.8±63.7 | 0.36 | 0.033 | 0.643 | 0.15 | 0.97 | 0.45 | 1.71 | 0.055 | 0.499 | 0.410 | - |
| BGKGRMMB | 160 | 44 | 75 | 41 | 0.509 | 0.453–0.566 | +7 ±39 | 53.1% | 38.1% | 8.8% | 142.7±77.1 | 0.33 | 0.039 | 0.661 | 0.10 | 0.97 | 0.43 | 1.94 | -0.095 | 0.479 | 0.479 | timeouts,drawRate |
| BMNGSKQB | 160 | 55 | 54 | 51 | 0.512 | 0.449–0.576 | +9 ±44 | 66.3% | 28.7% | 5.0% | 126.6±73.7 | 0.40 | 0.043 | 0.650 | 0.15 | 0.96 | 0.36 | 2.06 | 0.033 | 0.505 | 0.377 | - |
| BLNKNMRB | 160 | 70 | 26 | 64 | 0.519 | 0.448–0.590 | +13 ±49 | 83.8% | 16.3% | 0.0% | 110.5±42.5 | 0.34 | 0.026 | 0.615 | 0.15 | 0.97 | 0.53 | 1.39 | 0.201 | 0.500 | 0.458 | - |
| BQGMLSKB | 160 | 60 | 47 | 53 | 0.522 | 0.457–0.587 | +15 ±45 | 70.6% | 26.9% | 2.5% | 123.5±70.2 | 0.34 | 0.032 | 0.631 | 0.12 | 0.97 | 0.46 | 1.76 | 0.066 | 0.492 | 0.383 | - |
| BAGANKRB | 160 | 39 | 71 | 50 | 0.466 | 0.408–0.523 | -24 ±40 | 55.6% | 32.5% | 11.9% | 158.1±80.1 | 0.30 | 0.026 | 0.629 | 0.11 | 0.97 | 0.38 | 2.11 | -0.098 | 0.473 | 0.473 | balance,timeouts |
| BNAQKMNB | 160 | 67 | 37 | 56 | 0.534 | 0.467–0.602 | +24 ±47 | 76.9% | 22.5% | 0.6% | 114.0±51.1 | 0.37 | 0.042 | 0.649 | 0.16 | 0.96 | 0.52 | 2.07 | 0.115 | 0.504 | 0.504 | balance |
| BRGQKMRB | 160 | 59 | 53 | 48 | 0.534 | 0.471–0.598 | +24 ±44 | 66.9% | 31.3% | 1.9% | 116.6±61.7 | 0.35 | 0.035 | 0.645 | 0.12 | 0.97 | 0.47 | 1.86 | 0.015 | 0.490 | 0.490 | balance |
| BKARSSMB | 160 | 45 | 58 | 57 | 0.463 | 0.401–0.524 | -26 ±43 | 63.7% | 33.8% | 2.5% | 138.9±63.7 | 0.35 | 0.040 | 0.660 | 0.15 | 0.97 | 0.45 | 1.92 | -0.020 | 0.493 | 0.397 | balance |
| BKGLMQMB | 160 | 55 | 62 | 43 | 0.537 | 0.477–0.598 | +26 ±42 | 61.3% | 37.5% | 1.3% | 119.1±61.4 | 0.34 | 0.044 | 0.646 | 0.11 | 0.97 | 0.48 | 1.70 | -0.045 | 0.483 | 0.483 | balance |
| BAANSKNB | 160 | 58 | 57 | 45 | 0.541 | 0.479–0.602 | +28 ±43 | 64.4% | 31.9% | 3.8% | 134.9±67.8 | 0.33 | 0.036 | 0.647 | 0.13 | 0.96 | 0.46 | 1.15 | -0.017 | 0.487 | 0.389 | balance |
| BAGMSNKB | 160 | 57 | 59 | 44 | 0.541 | 0.479–0.602 | +28 ±43 | 63.1% | 28.1% | 8.8% | 145.6±75.3 | 0.40 | 0.029 | 0.644 | 0.16 | 0.96 | 0.44 | 1.83 | -0.030 | 0.504 | 0.396 | balance,timeouts |
| BGGNKANB | 160 | 52 | 69 | 39 | 0.541 | 0.483–0.599 | +28 ±40 | 56.9% | 33.1% | 10.0% | 146.0±76.6 | 0.32 | 0.036 | 0.646 | 0.11 | 0.97 | 0.43 | 1.95 | -0.092 | 0.479 | 0.479 | balance,timeouts |
| BKMNRGQB | 160 | 65 | 47 | 48 | 0.553 | 0.489–0.618 | +37 ±45 | 70.6% | 27.5% | 1.9% | 115.0±55.0 | 0.34 | 0.036 | 0.637 | 0.14 | 0.97 | 0.49 | 1.73 | 0.031 | 0.492 | 0.492 | balance |
| BMLGKSNB | 160 | 58 | 63 | 39 | 0.559 | 0.500–0.619 | +41 ±41 | 60.6% | 32.5% | 6.9% | 139.6±71.6 | 0.32 | 0.032 | 0.638 | 0.11 | 0.97 | 0.44 | 1.83 | -0.076 | 0.478 | 0.368 | balance,timeouts |
| BALNKQMB | 160 | 72 | 36 | 52 | 0.563 | 0.495–0.630 | +44 ±47 | 77.5% | 21.9% | 0.6% | 113.0±50.5 | 0.33 | 0.031 | 0.621 | 0.14 | 0.97 | 0.51 | 1.52 | 0.089 | 0.491 | 0.474 | balance |
| BLNSRKGB | 160 | 69 | 48 | 43 | 0.581 | 0.518–0.645 | +57 ±44 | 70.0% | 24.4% | 5.6% | 127.0±72.4 | 0.33 | 0.026 | 0.606 | 0.12 | 0.97 | 0.44 | 1.39 | -0.006 | 0.483 | 0.387 | balance,timeouts |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BMNGSKQB | 160 | 55 | 54 | 51 | 0.512 | 0.449–0.576 | +9 ±44 | 66.3% | 28.7% | 5.0% | 126.6±73.7 | 0.40 | 0.043 | 0.650 | 0.15 | 0.96 | 0.36 | 2.06 | 0.033 | 0.505 | 0.377 | - |
| BNAQKMNB | 160 | 67 | 37 | 56 | 0.534 | 0.467–0.602 | +24 ±47 | 76.9% | 22.5% | 0.6% | 114.0±51.1 | 0.37 | 0.042 | 0.649 | 0.16 | 0.96 | 0.52 | 2.07 | 0.115 | 0.504 | 0.504 | balance |
| BAGMSNKB | 160 | 57 | 59 | 44 | 0.541 | 0.479–0.602 | +28 ±43 | 63.1% | 28.1% | 8.8% | 145.6±75.3 | 0.40 | 0.029 | 0.644 | 0.16 | 0.96 | 0.44 | 1.83 | -0.030 | 0.504 | 0.396 | balance,timeouts |
| BLNKNMRB | 160 | 70 | 26 | 64 | 0.519 | 0.448–0.590 | +13 ±49 | 83.8% | 16.3% | 0.0% | 110.5±42.5 | 0.34 | 0.026 | 0.615 | 0.15 | 0.97 | 0.53 | 1.39 | 0.201 | 0.500 | 0.458 | - |
| BNKRSGMB | 160 | 56 | 51 | 53 | 0.509 | 0.445–0.573 | +7 ±44 | 68.1% | 30.0% | 1.9% | 135.8±63.7 | 0.36 | 0.033 | 0.643 | 0.15 | 0.97 | 0.45 | 1.71 | 0.055 | 0.499 | 0.410 | - |
| BKARSSMB | 160 | 45 | 58 | 57 | 0.463 | 0.401–0.524 | -26 ±43 | 63.7% | 33.8% | 2.5% | 138.9±63.7 | 0.35 | 0.040 | 0.660 | 0.15 | 0.97 | 0.45 | 1.92 | -0.020 | 0.493 | 0.397 | balance |
| BQGMLSKB | 160 | 60 | 47 | 53 | 0.522 | 0.457–0.587 | +15 ±45 | 70.6% | 26.9% | 2.5% | 123.5±70.2 | 0.34 | 0.032 | 0.631 | 0.12 | 0.97 | 0.46 | 1.76 | 0.066 | 0.492 | 0.383 | - |
| BKMNRGQB | 160 | 65 | 47 | 48 | 0.553 | 0.489–0.618 | +37 ±45 | 70.6% | 27.5% | 1.9% | 115.0±55.0 | 0.34 | 0.036 | 0.637 | 0.14 | 0.97 | 0.49 | 1.73 | 0.031 | 0.492 | 0.492 | balance |
| BALNKQMB | 160 | 72 | 36 | 52 | 0.563 | 0.495–0.630 | +44 ±47 | 77.5% | 21.9% | 0.6% | 113.0±50.5 | 0.33 | 0.031 | 0.621 | 0.14 | 0.97 | 0.51 | 1.52 | 0.089 | 0.491 | 0.474 | balance |
| BRGQKMRB | 160 | 59 | 53 | 48 | 0.534 | 0.471–0.598 | +24 ±44 | 66.9% | 31.3% | 1.9% | 116.6±61.7 | 0.35 | 0.035 | 0.645 | 0.12 | 0.97 | 0.47 | 1.86 | 0.015 | 0.490 | 0.490 | balance |
| BAANSKNB | 160 | 58 | 57 | 45 | 0.541 | 0.479–0.602 | +28 ±43 | 64.4% | 31.9% | 3.8% | 134.9±67.8 | 0.33 | 0.036 | 0.647 | 0.13 | 0.96 | 0.46 | 1.15 | -0.017 | 0.487 | 0.389 | balance |
| BAGKQRAB | 160 | 50 | 62 | 48 | 0.506 | 0.446–0.567 | +4 ±42 | 61.3% | 30.6% | 8.1% | 133.1±79.6 | 0.34 | 0.030 | 0.624 | 0.11 | 0.97 | 0.44 | 1.85 | -0.010 | 0.485 | 0.485 | timeouts |
| BSGQNAKB | 160 | 46 | 67 | 47 | 0.497 | 0.438–0.556 | -2 ±41 | 58.1% | 37.5% | 4.4% | 136.8±70.7 | 0.33 | 0.037 | 0.650 | 0.13 | 0.96 | 0.44 | 1.83 | -0.038 | 0.484 | 0.374 | - |
| BKGLMQMB | 160 | 55 | 62 | 43 | 0.537 | 0.477–0.598 | +26 ±42 | 61.3% | 37.5% | 1.3% | 119.1±61.4 | 0.34 | 0.044 | 0.646 | 0.11 | 0.97 | 0.48 | 1.70 | -0.045 | 0.483 | 0.483 | balance |
| BLNSRKGB | 160 | 69 | 48 | 43 | 0.581 | 0.518–0.645 | +57 ±44 | 70.0% | 24.4% | 5.6% | 127.0±72.4 | 0.33 | 0.026 | 0.606 | 0.12 | 0.97 | 0.44 | 1.39 | -0.006 | 0.483 | 0.387 | balance,timeouts |
| BGGNKANB | 160 | 52 | 69 | 39 | 0.541 | 0.483–0.599 | +28 ±40 | 56.9% | 33.1% | 10.0% | 146.0±76.6 | 0.32 | 0.036 | 0.646 | 0.11 | 0.97 | 0.43 | 1.95 | -0.092 | 0.479 | 0.479 | balance,timeouts |
| BGKGRMMB | 160 | 44 | 75 | 41 | 0.509 | 0.453–0.566 | +7 ±39 | 53.1% | 38.1% | 8.8% | 142.7±77.1 | 0.33 | 0.039 | 0.661 | 0.10 | 0.97 | 0.43 | 1.94 | -0.095 | 0.479 | 0.479 | timeouts,drawRate |
| BMLGKSNB | 160 | 58 | 63 | 39 | 0.559 | 0.500–0.619 | +41 ±41 | 60.6% | 32.5% | 6.9% | 139.6±71.6 | 0.32 | 0.032 | 0.638 | 0.11 | 0.97 | 0.44 | 1.83 | -0.076 | 0.478 | 0.368 | balance,timeouts |
| BAGANKRB | 160 | 39 | 71 | 50 | 0.466 | 0.408–0.523 | -24 ±40 | 55.6% | 32.5% | 11.9% | 158.1±80.1 | 0.30 | 0.026 | 0.629 | 0.11 | 0.97 | 0.38 | 2.11 | -0.098 | 0.473 | 0.473 | balance,timeouts |
| BAGKQSAB | 160 | 44 | 73 | 43 | 0.503 | 0.446–0.560 | +2 ±40 | 54.4% | 32.5% | 13.1% | 148.0±83.0 | 0.29 | 0.028 | 0.622 | 0.09 | 0.97 | 0.40 | 1.76 | -0.076 | 0.468 | 0.362 | timeouts |

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
