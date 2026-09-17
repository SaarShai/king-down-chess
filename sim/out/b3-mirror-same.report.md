# Sim report — b3-mirror-same

2000 games. White score **0.508** (95% 0.492–0.524),
white advantage **+6 ± 11 Elo**.
Decisive 56.0% · draws 36.7% · capped 7.3% (counted apart, never as draws).
Plies: mean 140.3 ± 75.7, median 121. Rules: all defaults.

No complete colour-swapped pairs in this run.
σ_pg 0.3741 · normalized Elo +7 · LOS 83.1% ·
SPRT LLR 0.36 against ±2.94 (nElo 0 vs 4) → **continue**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 2000 | 576 | 880 | 544 | 0.508 | 0.492–0.524 | +6 ±11 | 56.0% | 36.7% | 7.3% | 140.3±75.7 | 0.30 | 0.028 | 0.646 | 0.11 | 0.98 | 0.33 | 1.91 | 0.010 | 0.481 | 0.481 | timeouts |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | B | A | M | R | K | G | Q | P |
|---|---|---|---|---|---|---|---|---|
| use | 1.17 | 1.76 | 1.74 | 1.43 | 2.21 | 2.23 | 1.38 | 0.33 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 1119 | 56.0% |
| adjudicatedDraw | 629 | 31.4% |
| plyCap | 146 | 7.3% |
| drawRepetition | 46 | 2.3% |
| draw50 | 36 | 1.8% |
| drawMaterial | 23 | 1.1% |
| checkmate | 1 | 0.1% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| R | 50220 | 7581 | 4928 | 8000 | 3073 | 38.4% |
| P | 46514 | 8407 | 20419 | 32000 | 11156 | 34.9% |
| G | 39038 | 2425 | 301 | 4000 | 3716 | 92.9% |
| K | 38689 | 2556 | 0 | 4000 | 4000 | 100.0% |
| A | 30843 | 4599 | 2824 | 4000 | 1176 | 29.4% |
| M | 30574 | 3090 | 2609 | 4000 | 1391 | 34.8% |
| Q | 24154 | 4734 | 3340 | 4000 | 1062 | 26.6% |
| B | 20594 | 4285 | 3255 | 4000 | 745 | 18.6% |
| S | 3 | 0 | 0 | 0 | 1 | 0.0% |
| N | 3 | 0 | 1 | 0 | 2 | 0.0% |
| L | 1 | 0 | 0 | 0 | 1 | 0.0% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 4599 | 2.30 |
| beastChainMoves | 0 | 0.00 |
| beastChainCaptures | 0 | 0.00 |
| maesterSwaps | 12924 | 6.46 |
| maesterLongSwaps | 2404 | 1.20 |
| paladinSacrifices | 0 | 0.00 |
| promotions | 425 | 0.21 |
| checks | 17822 | 8.91 |

## Degeneracy counters
| counter | value |
|---|---|
| guard captures per game | 1.212 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 59 (2.9%) |
| games where a king never moved | 414 (20.7%) |

## Interest terms, residualised on draw rate
Each term minus what this run's `term ~ a + b·drawRate` line predicts from the arrangement's draw
rate. The mean over the arrangements is 0 by construction, so read differences between pools, never
levels. Overall row, fitted on the 20 arrangements:
| killerMove | leadChange | uncertaintyLate | drama | permanence | fairyUse | excessDecisiveness | interest | interestMinFairy |
|---|---|---|---|---|---|---|---|---|
| 0.000 | 0.000 | 0.000 | -0.000 | -0.000 | 0.000 | 0.010 | 0.001 | 0.001 |

## Balance axis — back ranks by |white score − 0.5| (ascending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| MRKQBRAG | 100 | 24 | 51 | 25 | 0.495 | 0.426–0.564 | -3 ±48 | 49.0% | 42.0% | 9.0% | 138.2±75.0 | 0.28 | 0.030 | 0.645 | 0.08 | 0.98 | 0.33 | 1.93 | -0.059 | 0.470 | 0.470 | timeouts |
| QMRBGARK | 100 | 28 | 42 | 30 | 0.490 | 0.415–0.565 | -7 ±52 | 58.0% | 38.0% | 4.0% | 124.3±69.0 | 0.29 | 0.025 | 0.646 | 0.11 | 0.97 | 0.34 | 1.87 | 0.029 | 0.482 | 0.482 | - |
| QBARMGKR | 100 | 30 | 38 | 32 | 0.490 | 0.413–0.567 | -7 ±54 | 62.0% | 31.0% | 7.0% | 143.4±79.8 | 0.28 | 0.026 | 0.639 | 0.11 | 0.98 | 0.34 | 1.81 | 0.069 | 0.482 | 0.482 | timeouts |
| RMKQBAGR | 100 | 23 | 52 | 25 | 0.490 | 0.422–0.558 | -7 ±47 | 48.0% | 41.0% | 11.0% | 149.8±80.8 | 0.30 | 0.027 | 0.656 | 0.09 | 0.98 | 0.31 | 1.95 | -0.071 | 0.475 | 0.475 | timeouts |
| RAGBMRQK | 100 | 28 | 46 | 26 | 0.510 | 0.438–0.582 | +7 ±50 | 54.0% | 42.0% | 4.0% | 140.7±71.0 | 0.28 | 0.031 | 0.645 | 0.09 | 0.98 | 0.32 | 2.00 | -0.011 | 0.473 | 0.473 | - |
| BKQMARRG | 100 | 30 | 37 | 33 | 0.485 | 0.407–0.563 | -10 ±54 | 63.0% | 33.0% | 4.0% | 145.4±71.4 | 0.33 | 0.026 | 0.643 | 0.11 | 0.98 | 0.35 | 1.88 | 0.077 | 0.492 | 0.492 | - |
| RKGMAQRB | 100 | 28 | 47 | 25 | 0.515 | 0.444–0.586 | +10 ±50 | 53.0% | 37.0% | 10.0% | 149.1±82.5 | 0.31 | 0.029 | 0.643 | 0.10 | 0.97 | 0.32 | 1.84 | -0.023 | 0.479 | 0.479 | timeouts |
| GQRRMBAK | 100 | 30 | 44 | 26 | 0.520 | 0.447–0.593 | +14 ±51 | 56.0% | 39.0% | 5.0% | 137.3±67.7 | 0.30 | 0.030 | 0.653 | 0.10 | 0.98 | 0.35 | 1.94 | 0.004 | 0.481 | 0.481 | - |
| RBGAQMKR | 100 | 30 | 44 | 26 | 0.520 | 0.447–0.593 | +14 ±51 | 56.0% | 36.0% | 8.0% | 143.9±79.7 | 0.29 | 0.032 | 0.650 | 0.09 | 0.97 | 0.31 | 1.92 | 0.004 | 0.477 | 0.477 | timeouts |
| KMGBQRRA | 100 | 30 | 45 | 25 | 0.525 | 0.452–0.598 | +17 ±50 | 55.0% | 38.0% | 7.0% | 135.9±74.2 | 0.28 | 0.029 | 0.654 | 0.11 | 0.98 | 0.35 | 1.90 | -0.008 | 0.477 | 0.477 | timeouts |
| BRGMRAQK | 100 | 35 | 35 | 30 | 0.525 | 0.446–0.604 | +17 ±55 | 65.0% | 32.0% | 3.0% | 125.5±68.0 | 0.35 | 0.027 | 0.623 | 0.15 | 0.97 | 0.36 | 1.83 | 0.092 | 0.497 | 0.497 | - |
| MRGAQRKB | 100 | 26 | 43 | 31 | 0.475 | 0.401–0.549 | -17 ±51 | 57.0% | 34.0% | 9.0% | 137.5±73.5 | 0.33 | 0.028 | 0.652 | 0.12 | 0.97 | 0.34 | 2.02 | 0.012 | 0.490 | 0.490 | timeouts |
| RQRGKABM | 100 | 25 | 55 | 20 | 0.525 | 0.459–0.591 | +17 ±46 | 45.0% | 46.0% | 9.0% | 150.7±82.3 | 0.26 | 0.033 | 0.647 | 0.10 | 0.98 | 0.30 | 1.87 | -0.108 | 0.464 | 0.464 | timeouts,drawRate |
| AMQKBGRR | 100 | 23 | 47 | 30 | 0.465 | 0.394–0.536 | -24 ±49 | 53.0% | 38.0% | 9.0% | 147.8±74.0 | 0.28 | 0.027 | 0.657 | 0.11 | 0.98 | 0.33 | 1.93 | -0.033 | 0.476 | 0.476 | balance,timeouts |
| KAGRRQMB | 100 | 31 | 45 | 24 | 0.535 | 0.463–0.607 | +24 ±50 | 55.0% | 39.0% | 6.0% | 133.5±72.0 | 0.29 | 0.029 | 0.654 | 0.12 | 0.98 | 0.36 | 2.02 | -0.013 | 0.479 | 0.479 | balance,timeouts |
| KQGRARBM | 100 | 25 | 40 | 35 | 0.450 | 0.375–0.525 | -35 ±52 | 60.0% | 36.0% | 4.0% | 128.3±70.2 | 0.33 | 0.025 | 0.646 | 0.12 | 0.97 | 0.36 | 1.96 | 0.030 | 0.491 | 0.491 | balance |
| BRMGRAQK | 100 | 24 | 42 | 34 | 0.450 | 0.376–0.524 | -35 ±51 | 58.0% | 29.0% | 13.0% | 146.0±82.2 | 0.31 | 0.025 | 0.641 | 0.09 | 0.97 | 0.32 | 1.90 | 0.010 | 0.482 | 0.482 | balance,timeouts |
| AGBKMRRQ | 100 | 37 | 37 | 26 | 0.555 | 0.478–0.632 | +38 ±54 | 63.0% | 29.0% | 8.0% | 139.3±76.8 | 0.32 | 0.031 | 0.644 | 0.11 | 0.97 | 0.33 | 1.92 | 0.058 | 0.488 | 0.488 | balance,timeouts |
| BAMRKRGQ | 100 | 35 | 44 | 21 | 0.570 | 0.498–0.642 | +49 ±50 | 56.0% | 35.0% | 9.0% | 148.6±78.9 | 0.30 | 0.028 | 0.632 | 0.10 | 0.98 | 0.30 | 1.96 | -0.019 | 0.477 | 0.477 | balance,timeouts |
| GRMKBAQR | 100 | 34 | 46 | 20 | 0.570 | 0.499–0.641 | +49 ±49 | 54.0% | 39.0% | 7.0% | 141.0±73.7 | 0.31 | 0.029 | 0.650 | 0.10 | 0.98 | 0.33 | 1.74 | -0.039 | 0.480 | 0.480 | balance,timeouts |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BRGMRAQK | 100 | 35 | 35 | 30 | 0.525 | 0.446–0.604 | +17 ±55 | 65.0% | 32.0% | 3.0% | 125.5±68.0 | 0.35 | 0.027 | 0.623 | 0.15 | 0.97 | 0.36 | 1.83 | 0.092 | 0.497 | 0.497 | - |
| BKQMARRG | 100 | 30 | 37 | 33 | 0.485 | 0.407–0.563 | -10 ±54 | 63.0% | 33.0% | 4.0% | 145.4±71.4 | 0.33 | 0.026 | 0.643 | 0.11 | 0.98 | 0.35 | 1.88 | 0.077 | 0.492 | 0.492 | - |
| KQGRARBM | 100 | 25 | 40 | 35 | 0.450 | 0.375–0.525 | -35 ±52 | 60.0% | 36.0% | 4.0% | 128.3±70.2 | 0.33 | 0.025 | 0.646 | 0.12 | 0.97 | 0.36 | 1.96 | 0.030 | 0.491 | 0.491 | balance |
| MRGAQRKB | 100 | 26 | 43 | 31 | 0.475 | 0.401–0.549 | -17 ±51 | 57.0% | 34.0% | 9.0% | 137.5±73.5 | 0.33 | 0.028 | 0.652 | 0.12 | 0.97 | 0.34 | 2.02 | 0.012 | 0.490 | 0.490 | timeouts |
| AGBKMRRQ | 100 | 37 | 37 | 26 | 0.555 | 0.478–0.632 | +38 ±54 | 63.0% | 29.0% | 8.0% | 139.3±76.8 | 0.32 | 0.031 | 0.644 | 0.11 | 0.97 | 0.33 | 1.92 | 0.058 | 0.488 | 0.488 | balance,timeouts |
| BRMGRAQK | 100 | 24 | 42 | 34 | 0.450 | 0.376–0.524 | -35 ±51 | 58.0% | 29.0% | 13.0% | 146.0±82.2 | 0.31 | 0.025 | 0.641 | 0.09 | 0.97 | 0.32 | 1.90 | 0.010 | 0.482 | 0.482 | balance,timeouts |
| QMRBGARK | 100 | 28 | 42 | 30 | 0.490 | 0.415–0.565 | -7 ±52 | 58.0% | 38.0% | 4.0% | 124.3±69.0 | 0.29 | 0.025 | 0.646 | 0.11 | 0.97 | 0.34 | 1.87 | 0.029 | 0.482 | 0.482 | - |
| QBARMGKR | 100 | 30 | 38 | 32 | 0.490 | 0.413–0.567 | -7 ±54 | 62.0% | 31.0% | 7.0% | 143.4±79.8 | 0.28 | 0.026 | 0.639 | 0.11 | 0.98 | 0.34 | 1.81 | 0.069 | 0.482 | 0.482 | timeouts |
| GQRRMBAK | 100 | 30 | 44 | 26 | 0.520 | 0.447–0.593 | +14 ±51 | 56.0% | 39.0% | 5.0% | 137.3±67.7 | 0.30 | 0.030 | 0.653 | 0.10 | 0.98 | 0.35 | 1.94 | 0.004 | 0.481 | 0.481 | - |
| GRMKBAQR | 100 | 34 | 46 | 20 | 0.570 | 0.499–0.641 | +49 ±49 | 54.0% | 39.0% | 7.0% | 141.0±73.7 | 0.31 | 0.029 | 0.650 | 0.10 | 0.98 | 0.33 | 1.74 | -0.039 | 0.480 | 0.480 | balance,timeouts |
| KAGRRQMB | 100 | 31 | 45 | 24 | 0.535 | 0.463–0.607 | +24 ±50 | 55.0% | 39.0% | 6.0% | 133.5±72.0 | 0.29 | 0.029 | 0.654 | 0.12 | 0.98 | 0.36 | 2.02 | -0.013 | 0.479 | 0.479 | balance,timeouts |
| RKGMAQRB | 100 | 28 | 47 | 25 | 0.515 | 0.444–0.586 | +10 ±50 | 53.0% | 37.0% | 10.0% | 149.1±82.5 | 0.31 | 0.029 | 0.643 | 0.10 | 0.97 | 0.32 | 1.84 | -0.023 | 0.479 | 0.479 | timeouts |
| BAMRKRGQ | 100 | 35 | 44 | 21 | 0.570 | 0.498–0.642 | +49 ±50 | 56.0% | 35.0% | 9.0% | 148.6±78.9 | 0.30 | 0.028 | 0.632 | 0.10 | 0.98 | 0.30 | 1.96 | -0.019 | 0.477 | 0.477 | balance,timeouts |
| KMGBQRRA | 100 | 30 | 45 | 25 | 0.525 | 0.452–0.598 | +17 ±50 | 55.0% | 38.0% | 7.0% | 135.9±74.2 | 0.28 | 0.029 | 0.654 | 0.11 | 0.98 | 0.35 | 1.90 | -0.008 | 0.477 | 0.477 | timeouts |
| RBGAQMKR | 100 | 30 | 44 | 26 | 0.520 | 0.447–0.593 | +14 ±51 | 56.0% | 36.0% | 8.0% | 143.9±79.7 | 0.29 | 0.032 | 0.650 | 0.09 | 0.97 | 0.31 | 1.92 | 0.004 | 0.477 | 0.477 | timeouts |
| AMQKBGRR | 100 | 23 | 47 | 30 | 0.465 | 0.394–0.536 | -24 ±49 | 53.0% | 38.0% | 9.0% | 147.8±74.0 | 0.28 | 0.027 | 0.657 | 0.11 | 0.98 | 0.33 | 1.93 | -0.033 | 0.476 | 0.476 | balance,timeouts |
| RMKQBAGR | 100 | 23 | 52 | 25 | 0.490 | 0.422–0.558 | -7 ±47 | 48.0% | 41.0% | 11.0% | 149.8±80.8 | 0.30 | 0.027 | 0.656 | 0.09 | 0.98 | 0.31 | 1.95 | -0.071 | 0.475 | 0.475 | timeouts |
| RAGBMRQK | 100 | 28 | 46 | 26 | 0.510 | 0.438–0.582 | +7 ±50 | 54.0% | 42.0% | 4.0% | 140.7±71.0 | 0.28 | 0.031 | 0.645 | 0.09 | 0.98 | 0.32 | 2.00 | -0.011 | 0.473 | 0.473 | - |
| MRKQBRAG | 100 | 24 | 51 | 25 | 0.495 | 0.426–0.564 | -3 ±48 | 49.0% | 42.0% | 9.0% | 138.2±75.0 | 0.28 | 0.030 | 0.645 | 0.08 | 0.98 | 0.33 | 1.93 | -0.059 | 0.470 | 0.470 | timeouts |
| RQRGKABM | 100 | 25 | 55 | 20 | 0.525 | 0.459–0.591 | +17 ±46 | 45.0% | 46.0% | 9.0% | 150.7±82.3 | 0.26 | 0.033 | 0.647 | 0.10 | 0.98 | 0.30 | 1.87 | -0.108 | 0.464 | 0.464 | timeouts,drawRate |

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
