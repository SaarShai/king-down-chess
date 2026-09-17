# Sim report — b3-val-f2

2000 games. White score **0.531** (95% 0.511–0.550),
white advantage **+21 ± 14 Elo**.
Decisive 80.5% · draws 18.6% · capped 1.0% (counted apart, never as draws).
Plies: mean 105.5 ± 50.8, median 95. Rules: all defaults.

No complete colour-swapped pairs in this run.
σ_pg 0.4474 · normalized Elo +24 · LOS 99.9% ·
SPRT LLR 1.44 against ±2.94 (nElo 0 vs 4) → **continue**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 2000 | 866 | 391 | 743 | 0.531 | 0.511–0.550 | +21 ±14 | 80.5% | 18.6% | 1.0% | 105.5±50.8 | 0.37 | 0.033 | 0.641 | 0.15 | 0.97 | 0.43 | 1.75 | 0.003 | 0.498 | 0.498 | balance |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | K | N | R | A | S | B | Q | P |
|---|---|---|---|---|---|---|---|---|
| use | 2.14 | 1.28 | 1.37 | 1.96 | 1.54 | 1.21 | 1.67 | 0.43 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 1609 | 80.5% |
| adjudicatedDraw | 294 | 14.7% |
| drawRepetition | 48 | 2.4% |
| plyCap | 20 | 1.0% |
| drawMaterial | 15 | 0.8% |
| draw50 | 13 | 0.7% |
| stalemate | 1 | 0.1% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| P | 45633 | 9238 | 18829 | 32000 | 12726 | 39.8% |
| R | 36017 | 6815 | 4534 | 8000 | 3467 | 43.3% |
| K | 28284 | 1886 | 0 | 4000 | 4000 | 100.0% |
| A | 25792 | 4347 | 2100 | 4000 | 1900 | 47.5% |
| Q | 21991 | 4599 | 2917 | 4000 | 1497 | 37.4% |
| S | 20348 | 2921 | 2026 | 4000 | 1974 | 49.4% |
| N | 16840 | 3327 | 3434 | 4000 | 571 | 14.3% |
| B | 15924 | 3704 | 3005 | 4000 | 995 | 24.9% |
| G | 182 | 11 | 4 | 0 | 20 | 0.0% |
| L | 3 | 1 | 0 | 0 | 0 | 0.0% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 4347 | 2.17 |
| beastChainMoves | 2306 | 1.15 |
| beastChainCaptures | 2921 | 1.46 |
| maesterSwaps | 0 | 0.00 |
| maesterLongSwaps | 0 | 0.00 |
| paladinSacrifices | 1 | 0.00 |
| promotions | 445 | 0.22 |
| checks | 14321 | 7.16 |

## Degeneracy counters
| counter | value |
|---|---|
| guard captures per game | 0.005 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 28 (1.4%) |
| games where a king never moved | 433 (21.6%) |

## Interest terms, residualised on draw rate
Each term minus what this run's `term ~ a + b·drawRate` line predicts from the arrangement's draw
rate. The mean over the arrangements is 0 by construction, so read differences between pools, never
levels. Overall row, fitted on the 20 arrangements:
| killerMove | leadChange | uncertaintyLate | drama | permanence | fairyUse | excessDecisiveness | interest | interestMinFairy |
|---|---|---|---|---|---|---|---|---|
| 0.000 | 0.000 | -0.000 | 0.000 | 0.000 | 0.000 | 0.003 | 0.000 | 0.000 |

## Balance axis — back ranks by |white score − 0.5| (ascending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| NQBSAKRR | 100 | 40 | 21 | 39 | 0.505 | 0.418–0.592 | +3 ±61 | 79.0% | 20.0% | 1.0% | 102.7±47.2 | 0.39 | 0.037 | 0.656 | 0.17 | 0.96 | 0.44 | 1.76 | -0.006 | 0.504 | 0.504 | - |
| QNRRBKSA | 100 | 38 | 22 | 40 | 0.490 | 0.403–0.577 | -7 ±60 | 78.0% | 22.0% | 0.0% | 106.9±50.6 | 0.34 | 0.042 | 0.642 | 0.14 | 0.97 | 0.44 | 1.68 | -0.017 | 0.489 | 0.489 | - |
| RARQBKNS | 100 | 40 | 17 | 43 | 0.485 | 0.396–0.574 | -10 ±62 | 83.0% | 17.0% | 0.0% | 102.4±45.4 | 0.35 | 0.036 | 0.647 | 0.15 | 0.96 | 0.43 | 1.79 | 0.032 | 0.494 | 0.494 | - |
| QABNRSKR | 100 | 37 | 23 | 40 | 0.485 | 0.399–0.571 | -10 ±60 | 77.0% | 22.0% | 1.0% | 96.6±47.2 | 0.37 | 0.035 | 0.639 | 0.16 | 0.97 | 0.45 | 1.84 | -0.028 | 0.497 | 0.497 | - |
| KNRASRBQ | 100 | 46 | 13 | 41 | 0.525 | 0.434–0.616 | +17 ±63 | 87.0% | 13.0% | 0.0% | 99.2±52.1 | 0.40 | 0.037 | 0.638 | 0.15 | 0.96 | 0.45 | 1.71 | 0.070 | 0.506 | 0.506 | - |
| QARBSKRN | 100 | 45 | 16 | 39 | 0.530 | 0.440–0.620 | +21 ±62 | 84.0% | 13.0% | 3.0% | 109.0±61.5 | 0.40 | 0.031 | 0.627 | 0.17 | 0.96 | 0.40 | 1.69 | 0.039 | 0.508 | 0.508 | balance |
| NQBRSRAK | 100 | 41 | 24 | 35 | 0.530 | 0.445–0.615 | +21 ±59 | 76.0% | 22.0% | 2.0% | 100.8±46.9 | 0.40 | 0.029 | 0.653 | 0.15 | 0.96 | 0.45 | 1.75 | -0.041 | 0.503 | 0.503 | balance |
| RAQNKSRB | 100 | 35 | 23 | 42 | 0.465 | 0.379–0.551 | -24 ±60 | 77.0% | 22.0% | 1.0% | 103.9±47.8 | 0.38 | 0.036 | 0.644 | 0.16 | 0.97 | 0.42 | 1.83 | -0.032 | 0.500 | 0.500 | balance |
| NQSKABRR | 100 | 38 | 17 | 45 | 0.465 | 0.376–0.554 | -24 ±62 | 83.0% | 16.0% | 1.0% | 114.9±50.4 | 0.36 | 0.032 | 0.642 | 0.14 | 0.97 | 0.42 | 1.72 | 0.028 | 0.497 | 0.497 | balance |
| QKABRNSR | 100 | 44 | 19 | 37 | 0.535 | 0.447–0.623 | +24 ±61 | 81.0% | 19.0% | 0.0% | 99.3±41.8 | 0.36 | 0.029 | 0.654 | 0.18 | 0.97 | 0.45 | 1.81 | 0.008 | 0.501 | 0.501 | balance |
| SAQKNRRB | 100 | 44 | 20 | 36 | 0.540 | 0.453–0.627 | +28 ±61 | 80.0% | 19.0% | 1.0% | 100.3±46.4 | 0.34 | 0.034 | 0.642 | 0.15 | 0.97 | 0.45 | 1.44 | -0.003 | 0.491 | 0.491 | balance |
| BKRNRSAQ | 100 | 43 | 24 | 33 | 0.550 | 0.465–0.635 | +35 ±59 | 76.0% | 24.0% | 0.0% | 109.3±50.3 | 0.37 | 0.035 | 0.633 | 0.15 | 0.97 | 0.44 | 1.82 | -0.045 | 0.494 | 0.494 | balance |
| SQRNRKBA | 100 | 47 | 16 | 37 | 0.550 | 0.461–0.639 | +35 ±62 | 84.0% | 14.0% | 2.0% | 106.4±59.8 | 0.35 | 0.035 | 0.638 | 0.15 | 0.96 | 0.44 | 1.72 | 0.035 | 0.495 | 0.495 | balance |
| SRNRABKQ | 100 | 32 | 25 | 43 | 0.445 | 0.361–0.529 | -38 ±58 | 75.0% | 25.0% | 0.0% | 102.3±40.6 | 0.38 | 0.034 | 0.645 | 0.14 | 0.97 | 0.45 | 1.81 | -0.056 | 0.495 | 0.495 | balance,drawRate |
| RANRKBSQ | 100 | 49 | 16 | 35 | 0.570 | 0.481–0.659 | +49 ±62 | 84.0% | 13.0% | 3.0% | 121.8±56.8 | 0.38 | 0.024 | 0.627 | 0.17 | 0.97 | 0.40 | 1.73 | 0.031 | 0.504 | 0.504 | balance |
| NRBQRAKS | 100 | 47 | 20 | 33 | 0.570 | 0.483–0.657 | +49 ±60 | 80.0% | 20.0% | 0.0% | 99.0±45.7 | 0.35 | 0.042 | 0.645 | 0.16 | 0.96 | 0.46 | 1.70 | -0.009 | 0.494 | 0.494 | balance |
| BAKNRQSR | 100 | 46 | 23 | 31 | 0.575 | 0.490–0.660 | +53 ±59 | 77.0% | 21.0% | 2.0% | 103.3±51.2 | 0.33 | 0.031 | 0.627 | 0.13 | 0.97 | 0.43 | 1.81 | -0.040 | 0.482 | 0.482 | balance |
| BRRQSANK | 100 | 49 | 18 | 33 | 0.580 | 0.493–0.667 | +56 ±61 | 82.0% | 16.0% | 2.0% | 112.1±51.8 | 0.36 | 0.028 | 0.640 | 0.15 | 0.97 | 0.42 | 1.81 | 0.009 | 0.497 | 0.497 | balance |
| RAKRQBSN | 100 | 53 | 15 | 32 | 0.605 | 0.517–0.693 | +74 ±61 | 85.0% | 15.0% | 0.0% | 108.2±55.5 | 0.38 | 0.032 | 0.643 | 0.16 | 0.96 | 0.42 | 1.81 | 0.034 | 0.503 | 0.503 | balance |
| RSRKNQBA | 100 | 52 | 19 | 29 | 0.615 | 0.530–0.700 | +81 ±59 | 81.0% | 18.0% | 1.0% | 111.8±53.1 | 0.34 | 0.028 | 0.637 | 0.15 | 0.97 | 0.43 | 1.76 | -0.007 | 0.492 | 0.492 | balance |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| QARBSKRN | 100 | 45 | 16 | 39 | 0.530 | 0.440–0.620 | +21 ±62 | 84.0% | 13.0% | 3.0% | 109.0±61.5 | 0.40 | 0.031 | 0.627 | 0.17 | 0.96 | 0.40 | 1.69 | 0.039 | 0.508 | 0.508 | balance |
| KNRASRBQ | 100 | 46 | 13 | 41 | 0.525 | 0.434–0.616 | +17 ±63 | 87.0% | 13.0% | 0.0% | 99.2±52.1 | 0.40 | 0.037 | 0.638 | 0.15 | 0.96 | 0.45 | 1.71 | 0.070 | 0.506 | 0.506 | - |
| RANRKBSQ | 100 | 49 | 16 | 35 | 0.570 | 0.481–0.659 | +49 ±62 | 84.0% | 13.0% | 3.0% | 121.8±56.8 | 0.38 | 0.024 | 0.627 | 0.17 | 0.97 | 0.40 | 1.73 | 0.031 | 0.504 | 0.504 | balance |
| NQBSAKRR | 100 | 40 | 21 | 39 | 0.505 | 0.418–0.592 | +3 ±61 | 79.0% | 20.0% | 1.0% | 102.7±47.2 | 0.39 | 0.037 | 0.656 | 0.17 | 0.96 | 0.44 | 1.76 | -0.006 | 0.504 | 0.504 | - |
| RAKRQBSN | 100 | 53 | 15 | 32 | 0.605 | 0.517–0.693 | +74 ±61 | 85.0% | 15.0% | 0.0% | 108.2±55.5 | 0.38 | 0.032 | 0.643 | 0.16 | 0.96 | 0.42 | 1.81 | 0.034 | 0.503 | 0.503 | balance |
| NQBRSRAK | 100 | 41 | 24 | 35 | 0.530 | 0.445–0.615 | +21 ±59 | 76.0% | 22.0% | 2.0% | 100.8±46.9 | 0.40 | 0.029 | 0.653 | 0.15 | 0.96 | 0.45 | 1.75 | -0.041 | 0.503 | 0.503 | balance |
| QKABRNSR | 100 | 44 | 19 | 37 | 0.535 | 0.447–0.623 | +24 ±61 | 81.0% | 19.0% | 0.0% | 99.3±41.8 | 0.36 | 0.029 | 0.654 | 0.18 | 0.97 | 0.45 | 1.81 | 0.008 | 0.501 | 0.501 | balance |
| RAQNKSRB | 100 | 35 | 23 | 42 | 0.465 | 0.379–0.551 | -24 ±60 | 77.0% | 22.0% | 1.0% | 103.9±47.8 | 0.38 | 0.036 | 0.644 | 0.16 | 0.97 | 0.42 | 1.83 | -0.032 | 0.500 | 0.500 | balance |
| BRRQSANK | 100 | 49 | 18 | 33 | 0.580 | 0.493–0.667 | +56 ±61 | 82.0% | 16.0% | 2.0% | 112.1±51.8 | 0.36 | 0.028 | 0.640 | 0.15 | 0.97 | 0.42 | 1.81 | 0.009 | 0.497 | 0.497 | balance |
| NQSKABRR | 100 | 38 | 17 | 45 | 0.465 | 0.376–0.554 | -24 ±62 | 83.0% | 16.0% | 1.0% | 114.9±50.4 | 0.36 | 0.032 | 0.642 | 0.14 | 0.97 | 0.42 | 1.72 | 0.028 | 0.497 | 0.497 | balance |
| QABNRSKR | 100 | 37 | 23 | 40 | 0.485 | 0.399–0.571 | -10 ±60 | 77.0% | 22.0% | 1.0% | 96.6±47.2 | 0.37 | 0.035 | 0.639 | 0.16 | 0.97 | 0.45 | 1.84 | -0.028 | 0.497 | 0.497 | - |
| SRNRABKQ | 100 | 32 | 25 | 43 | 0.445 | 0.361–0.529 | -38 ±58 | 75.0% | 25.0% | 0.0% | 102.3±40.6 | 0.38 | 0.034 | 0.645 | 0.14 | 0.97 | 0.45 | 1.81 | -0.056 | 0.495 | 0.495 | balance,drawRate |
| SQRNRKBA | 100 | 47 | 16 | 37 | 0.550 | 0.461–0.639 | +35 ±62 | 84.0% | 14.0% | 2.0% | 106.4±59.8 | 0.35 | 0.035 | 0.638 | 0.15 | 0.96 | 0.44 | 1.72 | 0.035 | 0.495 | 0.495 | balance |
| RARQBKNS | 100 | 40 | 17 | 43 | 0.485 | 0.396–0.574 | -10 ±62 | 83.0% | 17.0% | 0.0% | 102.4±45.4 | 0.35 | 0.036 | 0.647 | 0.15 | 0.96 | 0.43 | 1.79 | 0.032 | 0.494 | 0.494 | - |
| NRBQRAKS | 100 | 47 | 20 | 33 | 0.570 | 0.483–0.657 | +49 ±60 | 80.0% | 20.0% | 0.0% | 99.0±45.7 | 0.35 | 0.042 | 0.645 | 0.16 | 0.96 | 0.46 | 1.70 | -0.009 | 0.494 | 0.494 | balance |
| BKRNRSAQ | 100 | 43 | 24 | 33 | 0.550 | 0.465–0.635 | +35 ±59 | 76.0% | 24.0% | 0.0% | 109.3±50.3 | 0.37 | 0.035 | 0.633 | 0.15 | 0.97 | 0.44 | 1.82 | -0.045 | 0.494 | 0.494 | balance |
| RSRKNQBA | 100 | 52 | 19 | 29 | 0.615 | 0.530–0.700 | +81 ±59 | 81.0% | 18.0% | 1.0% | 111.8±53.1 | 0.34 | 0.028 | 0.637 | 0.15 | 0.97 | 0.43 | 1.76 | -0.007 | 0.492 | 0.492 | balance |
| SAQKNRRB | 100 | 44 | 20 | 36 | 0.540 | 0.453–0.627 | +28 ±61 | 80.0% | 19.0% | 1.0% | 100.3±46.4 | 0.34 | 0.034 | 0.642 | 0.15 | 0.97 | 0.45 | 1.44 | -0.003 | 0.491 | 0.491 | balance |
| QNRRBKSA | 100 | 38 | 22 | 40 | 0.490 | 0.403–0.577 | -7 ±60 | 78.0% | 22.0% | 0.0% | 106.9±50.6 | 0.34 | 0.042 | 0.642 | 0.14 | 0.97 | 0.44 | 1.68 | -0.017 | 0.489 | 0.489 | - |
| BAKNRQSR | 100 | 46 | 23 | 31 | 0.575 | 0.490–0.660 | +53 ±59 | 77.0% | 21.0% | 2.0% | 103.3±51.2 | 0.33 | 0.031 | 0.627 | 0.13 | 0.97 | 0.43 | 1.81 | -0.040 | 0.482 | 0.482 | balance |

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
