# Sim report — gs-g0

800 games. White score **0.527** (95% 0.498–0.557),
white advantage **+19 ± 20 Elo**.
Decisive 72.3% · draws 27.5% · capped 0.3% (counted apart, never as draws).
Plies: mean 112.1 ± 41.8, median 107. Rules: all defaults.

No complete colour-swapped pairs in this run.
σ_pg 0.4241 · normalized Elo +23 · LOS 96.7% ·
SPRT LLR 0.54 against ±2.94 (nElo 0 vs 4) → **continue**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 800 | 311 | 222 | 267 | 0.527 | 0.498–0.557 | +19 ±20 | 72.3% | 27.5% | 0.3% | 112.1±41.8 | 0.37 | 0.077 | 0.655 | 0.16 | 0.96 | 0.44 | 1.87 | -0.008 | 0.492 | 0.492 | - |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | A | N | K | B | M | Q | P |
|---|---|---|---|---|---|---|---|
| use | 1.92 | 1.08 | 1.69 | 0.95 | 1.81 | 2.02 | 0.44 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 578 | 72.3% |
| adjudicatedDraw | 186 | 23.3% |
| drawRepetition | 26 | 3.3% |
| draw50 | 5 | 0.6% |
| drawMaterial | 3 | 0.4% |
| plyCap | 2 | 0.3% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| A | 21563 | 3722 | 1467 | 3200 | 1733 | 54.2% |
| P | 19733 | 3573 | 7208 | 12800 | 5399 | 42.2% |
| N | 12134 | 2410 | 2902 | 3200 | 299 | 9.3% |
| Q | 11317 | 2139 | 937 | 1600 | 854 | 53.4% |
| M | 10133 | 1094 | 1074 | 1600 | 526 | 32.9% |
| K | 9499 | 603 | 0 | 1600 | 1600 | 100.0% |
| B | 5330 | 1296 | 1249 | 1600 | 351 | 21.9% |
| S | 0 | 0 | 0 | 0 | 1 | 0.0% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 3722 | 4.65 |
| beastChainMoves | 0 | 0.00 |
| beastChainCaptures | 0 | 0.00 |
| maesterSwaps | 4797 | 6.00 |
| maesterLongSwaps | 735 | 0.92 |
| paladinSacrifices | 0 | 0.00 |
| promotions | 193 | 0.24 |
| checks | 3984 | 4.98 |

## Degeneracy counters
| counter | value |
|---|---|
| guard captures per game | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 8 (1.0%) |
| games where a king never moved | 169 (21.1%) |

## Interest terms, residualised on draw rate
Each term minus what this run's `term ~ a + b·drawRate` line predicts from the arrangement's draw
rate. The mean over the arrangements is 0 by construction, so read differences between pools, never
levels. Overall row, fitted on the 20 arrangements:
| killerMove | leadChange | uncertaintyLate | drama | permanence | fairyUse | excessDecisiveness | interest | interestMinFairy |
|---|---|---|---|---|---|---|---|---|
| 0.000 | 0.000 | -0.000 | 0.000 | -0.000 | 0.000 | -0.008 | -0.000 | -0.000 |

## Balance axis — back ranks by |white score − 0.5| (ascending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| KBNQAAMN | 40 | 15 | 10 | 15 | 0.500 | 0.366–0.634 | +0 ±93 | 75.0% | 25.0% | 0.0% | 109.6±39.4 | 0.42 | 0.078 | 0.671 | 0.18 | 0.96 | 0.47 | 1.84 | 0.011 | 0.509 | 0.509 | - |
| NKQNABMA | 40 | 13 | 14 | 13 | 0.500 | 0.375–0.625 | +0 ±87 | 65.0% | 35.0% | 0.0% | 105.8±37.9 | 0.34 | 0.088 | 0.665 | 0.13 | 0.96 | 0.45 | 1.86 | -0.089 | 0.479 | 0.479 | - |
| NMQNBAKA | 40 | 14 | 12 | 14 | 0.500 | 0.370–0.630 | +0 ±90 | 70.0% | 30.0% | 0.0% | 115.4±50.1 | 0.35 | 0.086 | 0.657 | 0.13 | 0.96 | 0.48 | 1.67 | -0.039 | 0.482 | 0.482 | - |
| NQAKMBAN | 40 | 16 | 8 | 16 | 0.500 | 0.361–0.639 | +0 ±96 | 80.0% | 20.0% | 0.0% | 112.4±35.1 | 0.38 | 0.080 | 0.637 | 0.18 | 0.96 | 0.46 | 1.76 | 0.061 | 0.497 | 0.497 | - |
| NBKNAQAM | 40 | 13 | 13 | 14 | 0.487 | 0.360–0.615 | -9 ±88 | 67.5% | 32.5% | 0.0% | 115.8±42.7 | 0.31 | 0.080 | 0.665 | 0.16 | 0.96 | 0.44 | 1.90 | -0.060 | 0.479 | 0.479 | - |
| KAQNNBMA | 40 | 16 | 10 | 14 | 0.525 | 0.391–0.659 | +17 ±93 | 75.0% | 25.0% | 0.0% | 102.5±31.4 | 0.41 | 0.088 | 0.649 | 0.17 | 0.96 | 0.48 | 1.79 | 0.019 | 0.502 | 0.502 | - |
| MNAKBQNA | 40 | 14 | 10 | 16 | 0.475 | 0.341–0.609 | -17 ±93 | 75.0% | 25.0% | 0.0% | 110.5±30.2 | 0.33 | 0.047 | 0.641 | 0.14 | 0.96 | 0.45 | 2.03 | 0.019 | 0.487 | 0.487 | - |
| MNQANKAB | 40 | 14 | 10 | 16 | 0.475 | 0.341–0.609 | -17 ±93 | 75.0% | 25.0% | 0.0% | 120.2±45.1 | 0.33 | 0.054 | 0.637 | 0.18 | 0.96 | 0.45 | 1.90 | 0.019 | 0.491 | 0.491 | - |
| QABNKAMN | 40 | 13 | 12 | 15 | 0.475 | 0.346–0.604 | -17 ±90 | 70.0% | 30.0% | 0.0% | 103.8±35.1 | 0.39 | 0.082 | 0.656 | 0.16 | 0.96 | 0.45 | 1.89 | -0.031 | 0.493 | 0.493 | - |
| ANKBAMQN | 40 | 18 | 7 | 15 | 0.537 | 0.397–0.678 | +26 ±97 | 82.5% | 17.5% | 0.0% | 114.7±43.8 | 0.43 | 0.078 | 0.639 | 0.20 | 0.95 | 0.41 | 1.88 | 0.098 | 0.514 | 0.514 | balance |
| ABMNAQKN | 40 | 15 | 14 | 11 | 0.550 | 0.426–0.674 | +35 ±86 | 65.0% | 35.0% | 0.0% | 100.1±34.1 | 0.29 | 0.082 | 0.665 | 0.12 | 0.96 | 0.44 | 2.00 | -0.073 | 0.469 | 0.469 | balance |
| AAMNQKBN | 40 | 16 | 13 | 11 | 0.563 | 0.437–0.688 | +44 ±87 | 67.5% | 32.5% | 0.0% | 120.5±44.7 | 0.33 | 0.060 | 0.657 | 0.15 | 0.96 | 0.43 | 1.80 | -0.044 | 0.484 | 0.484 | balance |
| NNKBAMAQ | 40 | 18 | 9 | 13 | 0.563 | 0.427–0.698 | +44 ±94 | 77.5% | 22.5% | 0.0% | 106.3±35.8 | 0.41 | 0.082 | 0.647 | 0.19 | 0.96 | 0.40 | 2.00 | 0.056 | 0.505 | 0.505 | balance |
| BMAKNNQA | 40 | 18 | 10 | 12 | 0.575 | 0.443–0.707 | +53 ±92 | 75.0% | 25.0% | 0.0% | 114.6±41.3 | 0.41 | 0.077 | 0.658 | 0.19 | 0.96 | 0.45 | 2.00 | 0.035 | 0.508 | 0.508 | balance |
| ANNKQBAM | 40 | 12 | 10 | 18 | 0.425 | 0.293–0.557 | -53 ±92 | 75.0% | 25.0% | 0.0% | 116.0±40.6 | 0.39 | 0.088 | 0.659 | 0.15 | 0.96 | 0.42 | 1.81 | 0.035 | 0.496 | 0.496 | balance |
| NMBKAQNA | 40 | 12 | 10 | 18 | 0.425 | 0.293–0.557 | -53 ±92 | 75.0% | 25.0% | 0.0% | 128.1±39.3 | 0.39 | 0.076 | 0.663 | 0.18 | 0.96 | 0.44 | 1.92 | 0.035 | 0.502 | 0.502 | balance |
| ANBQNKAM | 40 | 18 | 11 | 11 | 0.588 | 0.458–0.717 | +61 ±90 | 72.5% | 25.0% | 2.5% | 106.6±40.9 | 0.40 | 0.072 | 0.665 | 0.15 | 0.96 | 0.48 | 1.84 | 0.014 | 0.500 | 0.500 | balance |
| KBANMQAN | 40 | 19 | 10 | 11 | 0.600 | 0.469–0.731 | +70 ±91 | 75.0% | 25.0% | 0.0% | 106.3±45.3 | 0.34 | 0.071 | 0.663 | 0.12 | 0.96 | 0.44 | 1.82 | 0.043 | 0.488 | 0.488 | balance |
| KBNQMANA | 40 | 17 | 16 | 7 | 0.625 | 0.511–0.739 | +89 ±79 | 60.0% | 37.5% | 2.5% | 115.8±54.8 | 0.34 | 0.097 | 0.673 | 0.13 | 0.96 | 0.39 | 1.81 | -0.099 | 0.477 | 0.477 | balance,drawRate |
| QNAKMBAN | 40 | 20 | 13 | 7 | 0.662 | 0.546–0.779 | +117 ±81 | 67.5% | 32.5% | 0.0% | 117.5±47.5 | 0.36 | 0.071 | 0.643 | 0.12 | 0.96 | 0.40 | 1.81 | -0.011 | 0.485 | 0.485 | balance |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ANKBAMQN | 40 | 18 | 7 | 15 | 0.537 | 0.397–0.678 | +26 ±97 | 82.5% | 17.5% | 0.0% | 114.7±43.8 | 0.43 | 0.078 | 0.639 | 0.20 | 0.95 | 0.41 | 1.88 | 0.098 | 0.514 | 0.514 | balance |
| KBNQAAMN | 40 | 15 | 10 | 15 | 0.500 | 0.366–0.634 | +0 ±93 | 75.0% | 25.0% | 0.0% | 109.6±39.4 | 0.42 | 0.078 | 0.671 | 0.18 | 0.96 | 0.47 | 1.84 | 0.011 | 0.509 | 0.509 | - |
| BMAKNNQA | 40 | 18 | 10 | 12 | 0.575 | 0.443–0.707 | +53 ±92 | 75.0% | 25.0% | 0.0% | 114.6±41.3 | 0.41 | 0.077 | 0.658 | 0.19 | 0.96 | 0.45 | 2.00 | 0.035 | 0.508 | 0.508 | balance |
| NNKBAMAQ | 40 | 18 | 9 | 13 | 0.563 | 0.427–0.698 | +44 ±94 | 77.5% | 22.5% | 0.0% | 106.3±35.8 | 0.41 | 0.082 | 0.647 | 0.19 | 0.96 | 0.40 | 2.00 | 0.056 | 0.505 | 0.505 | balance |
| NMBKAQNA | 40 | 12 | 10 | 18 | 0.425 | 0.293–0.557 | -53 ±92 | 75.0% | 25.0% | 0.0% | 128.1±39.3 | 0.39 | 0.076 | 0.663 | 0.18 | 0.96 | 0.44 | 1.92 | 0.035 | 0.502 | 0.502 | balance |
| KAQNNBMA | 40 | 16 | 10 | 14 | 0.525 | 0.391–0.659 | +17 ±93 | 75.0% | 25.0% | 0.0% | 102.5±31.4 | 0.41 | 0.088 | 0.649 | 0.17 | 0.96 | 0.48 | 1.79 | 0.019 | 0.502 | 0.502 | - |
| ANBQNKAM | 40 | 18 | 11 | 11 | 0.588 | 0.458–0.717 | +61 ±90 | 72.5% | 25.0% | 2.5% | 106.6±40.9 | 0.40 | 0.072 | 0.665 | 0.15 | 0.96 | 0.48 | 1.84 | 0.014 | 0.500 | 0.500 | balance |
| NQAKMBAN | 40 | 16 | 8 | 16 | 0.500 | 0.361–0.639 | +0 ±96 | 80.0% | 20.0% | 0.0% | 112.4±35.1 | 0.38 | 0.080 | 0.637 | 0.18 | 0.96 | 0.46 | 1.76 | 0.061 | 0.497 | 0.497 | - |
| ANNKQBAM | 40 | 12 | 10 | 18 | 0.425 | 0.293–0.557 | -53 ±92 | 75.0% | 25.0% | 0.0% | 116.0±40.6 | 0.39 | 0.088 | 0.659 | 0.15 | 0.96 | 0.42 | 1.81 | 0.035 | 0.496 | 0.496 | balance |
| QABNKAMN | 40 | 13 | 12 | 15 | 0.475 | 0.346–0.604 | -17 ±90 | 70.0% | 30.0% | 0.0% | 103.8±35.1 | 0.39 | 0.082 | 0.656 | 0.16 | 0.96 | 0.45 | 1.89 | -0.031 | 0.493 | 0.493 | - |
| MNQANKAB | 40 | 14 | 10 | 16 | 0.475 | 0.341–0.609 | -17 ±93 | 75.0% | 25.0% | 0.0% | 120.2±45.1 | 0.33 | 0.054 | 0.637 | 0.18 | 0.96 | 0.45 | 1.90 | 0.019 | 0.491 | 0.491 | - |
| KBANMQAN | 40 | 19 | 10 | 11 | 0.600 | 0.469–0.731 | +70 ±91 | 75.0% | 25.0% | 0.0% | 106.3±45.3 | 0.34 | 0.071 | 0.663 | 0.12 | 0.96 | 0.44 | 1.82 | 0.043 | 0.488 | 0.488 | balance |
| MNAKBQNA | 40 | 14 | 10 | 16 | 0.475 | 0.341–0.609 | -17 ±93 | 75.0% | 25.0% | 0.0% | 110.5±30.2 | 0.33 | 0.047 | 0.641 | 0.14 | 0.96 | 0.45 | 2.03 | 0.019 | 0.487 | 0.487 | - |
| QNAKMBAN | 40 | 20 | 13 | 7 | 0.662 | 0.546–0.779 | +117 ±81 | 67.5% | 32.5% | 0.0% | 117.5±47.5 | 0.36 | 0.071 | 0.643 | 0.12 | 0.96 | 0.40 | 1.81 | -0.011 | 0.485 | 0.485 | balance |
| AAMNQKBN | 40 | 16 | 13 | 11 | 0.563 | 0.437–0.688 | +44 ±87 | 67.5% | 32.5% | 0.0% | 120.5±44.7 | 0.33 | 0.060 | 0.657 | 0.15 | 0.96 | 0.43 | 1.80 | -0.044 | 0.484 | 0.484 | balance |
| NMQNBAKA | 40 | 14 | 12 | 14 | 0.500 | 0.370–0.630 | +0 ±90 | 70.0% | 30.0% | 0.0% | 115.4±50.1 | 0.35 | 0.086 | 0.657 | 0.13 | 0.96 | 0.48 | 1.67 | -0.039 | 0.482 | 0.482 | - |
| NBKNAQAM | 40 | 13 | 13 | 14 | 0.487 | 0.360–0.615 | -9 ±88 | 67.5% | 32.5% | 0.0% | 115.8±42.7 | 0.31 | 0.080 | 0.665 | 0.16 | 0.96 | 0.44 | 1.90 | -0.060 | 0.479 | 0.479 | - |
| NKQNABMA | 40 | 13 | 14 | 13 | 0.500 | 0.375–0.625 | +0 ±87 | 65.0% | 35.0% | 0.0% | 105.8±37.9 | 0.34 | 0.088 | 0.665 | 0.13 | 0.96 | 0.45 | 1.86 | -0.089 | 0.479 | 0.479 | - |
| KBNQMANA | 40 | 17 | 16 | 7 | 0.625 | 0.511–0.739 | +89 ±79 | 60.0% | 37.5% | 2.5% | 115.8±54.8 | 0.34 | 0.097 | 0.673 | 0.13 | 0.96 | 0.39 | 1.81 | -0.099 | 0.477 | 0.477 | balance,drawRate |
| ABMNAQKN | 40 | 15 | 14 | 11 | 0.550 | 0.426–0.674 | +35 ±86 | 65.0% | 35.0% | 0.0% | 100.1±34.1 | 0.29 | 0.082 | 0.665 | 0.12 | 0.96 | 0.44 | 2.00 | -0.073 | 0.469 | 0.469 | balance |

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
