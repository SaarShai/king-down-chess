# Sim report — b3-val-f0

2000 games. White score **0.545** (95% 0.525–0.565),
white advantage **+31 ± 14 Elo**.
Decisive 83.8% · draws 15.7% · capped 0.5% (counted apart, never as draws).
Plies: mean 90.4 ± 46.9, median 81. Rules: all defaults.

No complete colour-swapped pairs in this run.
σ_pg 0.4555 · normalized Elo +34 · LOS 100.0% ·
SPRT LLR 2.12 against ±2.94 (nElo 0 vs 4) → **continue**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 2000 | 928 | 324 | 748 | 0.545 | 0.525–0.565 | +31 ±14 | 83.8% | 15.7% | 0.5% | 90.4±46.9 | 0.39 | 0.040 | 0.635 | 0.15 | 0.96 | 0.49 | 1.00 | -0.001 | 0.499 | 0.499 | balance |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | N | B | R | Q | K | P |
|---|---|---|---|---|---|---|
| use | 1.27 | 1.11 | 1.58 | 1.80 | 2.35 | 0.49 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 1674 | 83.7% |
| adjudicatedDraw | 206 | 10.3% |
| drawRepetition | 69 | 3.5% |
| drawMaterial | 23 | 1.1% |
| draw50 | 13 | 0.7% |
| plyCap | 10 | 0.5% |
| stalemate | 3 | 0.1% |
| checkmate | 2 | 0.1% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| P | 44186 | 9473 | 16600 | 32000 | 14867 | 46.5% |
| R | 35762 | 7118 | 4238 | 8000 | 3764 | 47.0% |
| N | 28707 | 5947 | 6627 | 8000 | 1376 | 17.2% |
| K | 26525 | 2098 | 0 | 4000 | 4000 | 100.0% |
| B | 25170 | 6038 | 5556 | 8000 | 2445 | 30.6% |
| Q | 20400 | 5053 | 2711 | 4000 | 1794 | 44.9% |
| G | 95 | 6 | 4 | 0 | 12 | 0.0% |
| L | 28 | 4 | 0 | 0 | 0 | 0.0% |
| A | 0 | 0 | 1 | 0 | 0 | 0.0% |
| S | 0 | 0 | 0 | 0 | 1 | 0.0% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 0 | 0.00 |
| beastChainMoves | 0 | 0.00 |
| beastChainCaptures | 0 | 0.00 |
| maesterSwaps | 0 | 0.00 |
| maesterLongSwaps | 0 | 0.00 |
| paladinSacrifices | 4 | 0.00 |
| promotions | 533 | 0.27 |
| checks | 13154 | 6.58 |

## Degeneracy counters
| counter | value |
|---|---|
| guard captures per game | 0.003 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 36 (1.8%) |
| games where a king never moved | 565 (28.2%) |

## Interest terms, residualised on draw rate
Each term minus what this run's `term ~ a + b·drawRate` line predicts from the arrangement's draw
rate. The mean over the arrangements is 0 by construction, so read differences between pools, never
levels. Overall row, fitted on the 20 arrangements:
| killerMove | leadChange | uncertaintyLate | drama | permanence | fairyUse | excessDecisiveness | interest | interestMinFairy |
|---|---|---|---|---|---|---|---|---|
| -0.000 | 0.000 | 0.000 | -0.000 | 0.000 | 0.000 | -0.001 | -0.000 | -0.000 |

## Balance axis — back ranks by |white score − 0.5| (ascending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| KRNRQNBB | 100 | 42 | 16 | 42 | 0.500 | 0.410–0.590 | +0 ±62 | 84.0% | 15.0% | 1.0% | 85.7±50.9 | 0.40 | 0.041 | 0.626 | 0.16 | 0.95 | 0.49 | 1.00 | -0.006 | 0.500 | 0.500 | - |
| NBRQBNKR | 100 | 39 | 23 | 38 | 0.505 | 0.419–0.591 | +3 ±60 | 77.0% | 23.0% | 0.0% | 88.8±44.0 | 0.34 | 0.053 | 0.637 | 0.13 | 0.96 | 0.49 | 1.00 | -0.075 | 0.480 | 0.480 | - |
| BBNRNQRK | 100 | 45 | 9 | 46 | 0.495 | 0.402–0.588 | -3 ±65 | 91.0% | 9.0% | 0.0% | 81.7±47.0 | 0.45 | 0.034 | 0.616 | 0.16 | 0.94 | 0.52 | 1.00 | 0.065 | 0.513 | 0.513 | - |
| NRKNRBBQ | 100 | 44 | 15 | 41 | 0.515 | 0.425–0.605 | +10 ±63 | 85.0% | 13.0% | 2.0% | 99.1±51.8 | 0.38 | 0.039 | 0.630 | 0.17 | 0.96 | 0.47 | 1.00 | 0.007 | 0.499 | 0.499 | - |
| RNBBQRNK | 100 | 39 | 19 | 42 | 0.485 | 0.397–0.573 | -10 ±61 | 81.0% | 18.0% | 1.0% | 93.2±47.5 | 0.40 | 0.043 | 0.646 | 0.16 | 0.96 | 0.48 | 1.00 | -0.033 | 0.502 | 0.502 | - |
| KBQNNRBR | 100 | 45 | 14 | 41 | 0.520 | 0.429–0.611 | +14 ±63 | 86.0% | 14.0% | 0.0% | 96.4±50.1 | 0.39 | 0.039 | 0.639 | 0.16 | 0.96 | 0.46 | 1.00 | 0.017 | 0.503 | 0.503 | - |
| BRNKRBQN | 100 | 46 | 14 | 40 | 0.530 | 0.439–0.621 | +21 ±63 | 86.0% | 13.0% | 1.0% | 100.2±53.9 | 0.41 | 0.048 | 0.633 | 0.17 | 0.96 | 0.46 | 1.00 | 0.019 | 0.505 | 0.505 | balance |
| BQKRRNNB | 100 | 44 | 18 | 38 | 0.530 | 0.441–0.619 | +21 ±62 | 82.0% | 18.0% | 0.0% | 91.2±46.2 | 0.37 | 0.044 | 0.637 | 0.14 | 0.96 | 0.50 | 1.00 | -0.021 | 0.492 | 0.492 | balance |
| KRNQBBRN | 100 | 41 | 11 | 48 | 0.465 | 0.373–0.557 | -24 ±64 | 89.0% | 11.0% | 0.0% | 95.2±47.5 | 0.45 | 0.041 | 0.643 | 0.18 | 0.95 | 0.47 | 1.00 | 0.050 | 0.518 | 0.518 | balance |
| RNBBNQRK | 100 | 47 | 13 | 40 | 0.535 | 0.444–0.626 | +24 ±63 | 87.0% | 11.0% | 2.0% | 88.9±50.0 | 0.42 | 0.033 | 0.637 | 0.14 | 0.95 | 0.49 | 1.00 | 0.030 | 0.508 | 0.508 | balance |
| BNRNKBRQ | 100 | 50 | 8 | 42 | 0.540 | 0.446–0.634 | +28 ±65 | 92.0% | 8.0% | 0.0% | 87.7±49.3 | 0.39 | 0.036 | 0.629 | 0.15 | 0.96 | 0.50 | 1.00 | 0.080 | 0.505 | 0.505 | balance |
| KRBBNQNR | 100 | 43 | 26 | 31 | 0.560 | 0.477–0.643 | +42 ±58 | 74.0% | 25.0% | 1.0% | 94.8±41.7 | 0.35 | 0.032 | 0.643 | 0.11 | 0.97 | 0.47 | 1.00 | -0.097 | 0.484 | 0.484 | balance,drawRate |
| NBBNQRRK | 100 | 48 | 17 | 35 | 0.565 | 0.477–0.653 | +45 ±61 | 83.0% | 17.0% | 0.0% | 93.6±45.2 | 0.40 | 0.033 | 0.642 | 0.13 | 0.96 | 0.49 | 1.00 | -0.006 | 0.501 | 0.501 | balance |
| BQRKNBRN | 100 | 48 | 18 | 34 | 0.570 | 0.482–0.658 | +49 ±61 | 82.0% | 18.0% | 0.0% | 81.0±45.9 | 0.36 | 0.033 | 0.613 | 0.13 | 0.96 | 0.47 | 1.00 | -0.015 | 0.487 | 0.487 | balance |
| BNRQRNKB | 100 | 48 | 18 | 34 | 0.570 | 0.482–0.658 | +49 ±61 | 82.0% | 17.0% | 1.0% | 88.5±48.0 | 0.37 | 0.033 | 0.636 | 0.13 | 0.96 | 0.51 | 1.00 | -0.015 | 0.493 | 0.493 | balance |
| NBQNRRBK | 100 | 46 | 24 | 30 | 0.580 | 0.496–0.664 | +56 ±58 | 76.0% | 24.0% | 0.0% | 89.6±46.6 | 0.40 | 0.052 | 0.649 | 0.12 | 0.96 | 0.50 | 1.00 | -0.074 | 0.493 | 0.493 | balance |
| NBRNKRBQ | 100 | 51 | 16 | 33 | 0.590 | 0.502–0.678 | +63 ±61 | 84.0% | 16.0% | 0.0% | 91.6±44.1 | 0.38 | 0.040 | 0.631 | 0.18 | 0.96 | 0.48 | 1.00 | 0.008 | 0.501 | 0.501 | balance |
| NNBRKBQR | 100 | 53 | 16 | 31 | 0.610 | 0.523–0.697 | +78 ±61 | 84.0% | 16.0% | 0.0% | 81.2±30.6 | 0.35 | 0.039 | 0.633 | 0.15 | 0.96 | 0.53 | 1.00 | 0.011 | 0.491 | 0.491 | balance |
| BKNNRBRQ | 100 | 54 | 15 | 31 | 0.615 | 0.528–0.702 | +81 ±61 | 85.0% | 14.0% | 1.0% | 84.7±44.4 | 0.37 | 0.046 | 0.637 | 0.14 | 0.96 | 0.52 | 1.00 | 0.022 | 0.495 | 0.495 | balance |
| BNQNKBRR | 100 | 55 | 14 | 31 | 0.620 | 0.532–0.708 | +85 ±61 | 86.0% | 14.0% | 0.0% | 95.8±42.1 | 0.40 | 0.044 | 0.638 | 0.17 | 0.96 | 0.49 | 1.00 | 0.033 | 0.506 | 0.506 | balance |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| KRNQBBRN | 100 | 41 | 11 | 48 | 0.465 | 0.373–0.557 | -24 ±64 | 89.0% | 11.0% | 0.0% | 95.2±47.5 | 0.45 | 0.041 | 0.643 | 0.18 | 0.95 | 0.47 | 1.00 | 0.050 | 0.518 | 0.518 | balance |
| BBNRNQRK | 100 | 45 | 9 | 46 | 0.495 | 0.402–0.588 | -3 ±65 | 91.0% | 9.0% | 0.0% | 81.7±47.0 | 0.45 | 0.034 | 0.616 | 0.16 | 0.94 | 0.52 | 1.00 | 0.065 | 0.513 | 0.513 | - |
| RNBBNQRK | 100 | 47 | 13 | 40 | 0.535 | 0.444–0.626 | +24 ±63 | 87.0% | 11.0% | 2.0% | 88.9±50.0 | 0.42 | 0.033 | 0.637 | 0.14 | 0.95 | 0.49 | 1.00 | 0.030 | 0.508 | 0.508 | balance |
| BNQNKBRR | 100 | 55 | 14 | 31 | 0.620 | 0.532–0.708 | +85 ±61 | 86.0% | 14.0% | 0.0% | 95.8±42.1 | 0.40 | 0.044 | 0.638 | 0.17 | 0.96 | 0.49 | 1.00 | 0.033 | 0.506 | 0.506 | balance |
| BRNKRBQN | 100 | 46 | 14 | 40 | 0.530 | 0.439–0.621 | +21 ±63 | 86.0% | 13.0% | 1.0% | 100.2±53.9 | 0.41 | 0.048 | 0.633 | 0.17 | 0.96 | 0.46 | 1.00 | 0.019 | 0.505 | 0.505 | balance |
| BNRNKBRQ | 100 | 50 | 8 | 42 | 0.540 | 0.446–0.634 | +28 ±65 | 92.0% | 8.0% | 0.0% | 87.7±49.3 | 0.39 | 0.036 | 0.629 | 0.15 | 0.96 | 0.50 | 1.00 | 0.080 | 0.505 | 0.505 | balance |
| KBQNNRBR | 100 | 45 | 14 | 41 | 0.520 | 0.429–0.611 | +14 ±63 | 86.0% | 14.0% | 0.0% | 96.4±50.1 | 0.39 | 0.039 | 0.639 | 0.16 | 0.96 | 0.46 | 1.00 | 0.017 | 0.503 | 0.503 | - |
| RNBBQRNK | 100 | 39 | 19 | 42 | 0.485 | 0.397–0.573 | -10 ±61 | 81.0% | 18.0% | 1.0% | 93.2±47.5 | 0.40 | 0.043 | 0.646 | 0.16 | 0.96 | 0.48 | 1.00 | -0.033 | 0.502 | 0.502 | - |
| NBBNQRRK | 100 | 48 | 17 | 35 | 0.565 | 0.477–0.653 | +45 ±61 | 83.0% | 17.0% | 0.0% | 93.6±45.2 | 0.40 | 0.033 | 0.642 | 0.13 | 0.96 | 0.49 | 1.00 | -0.006 | 0.501 | 0.501 | balance |
| NBRNKRBQ | 100 | 51 | 16 | 33 | 0.590 | 0.502–0.678 | +63 ±61 | 84.0% | 16.0% | 0.0% | 91.6±44.1 | 0.38 | 0.040 | 0.631 | 0.18 | 0.96 | 0.48 | 1.00 | 0.008 | 0.501 | 0.501 | balance |
| KRNRQNBB | 100 | 42 | 16 | 42 | 0.500 | 0.410–0.590 | +0 ±62 | 84.0% | 15.0% | 1.0% | 85.7±50.9 | 0.40 | 0.041 | 0.626 | 0.16 | 0.95 | 0.49 | 1.00 | -0.006 | 0.500 | 0.500 | - |
| NRKNRBBQ | 100 | 44 | 15 | 41 | 0.515 | 0.425–0.605 | +10 ±63 | 85.0% | 13.0% | 2.0% | 99.1±51.8 | 0.38 | 0.039 | 0.630 | 0.17 | 0.96 | 0.47 | 1.00 | 0.007 | 0.499 | 0.499 | - |
| BKNNRBRQ | 100 | 54 | 15 | 31 | 0.615 | 0.528–0.702 | +81 ±61 | 85.0% | 14.0% | 1.0% | 84.7±44.4 | 0.37 | 0.046 | 0.637 | 0.14 | 0.96 | 0.52 | 1.00 | 0.022 | 0.495 | 0.495 | balance |
| BNRQRNKB | 100 | 48 | 18 | 34 | 0.570 | 0.482–0.658 | +49 ±61 | 82.0% | 17.0% | 1.0% | 88.5±48.0 | 0.37 | 0.033 | 0.636 | 0.13 | 0.96 | 0.51 | 1.00 | -0.015 | 0.493 | 0.493 | balance |
| NBQNRRBK | 100 | 46 | 24 | 30 | 0.580 | 0.496–0.664 | +56 ±58 | 76.0% | 24.0% | 0.0% | 89.6±46.6 | 0.40 | 0.052 | 0.649 | 0.12 | 0.96 | 0.50 | 1.00 | -0.074 | 0.493 | 0.493 | balance |
| BQKRRNNB | 100 | 44 | 18 | 38 | 0.530 | 0.441–0.619 | +21 ±62 | 82.0% | 18.0% | 0.0% | 91.2±46.2 | 0.37 | 0.044 | 0.637 | 0.14 | 0.96 | 0.50 | 1.00 | -0.021 | 0.492 | 0.492 | balance |
| NNBRKBQR | 100 | 53 | 16 | 31 | 0.610 | 0.523–0.697 | +78 ±61 | 84.0% | 16.0% | 0.0% | 81.2±30.6 | 0.35 | 0.039 | 0.633 | 0.15 | 0.96 | 0.53 | 1.00 | 0.011 | 0.491 | 0.491 | balance |
| BQRKNBRN | 100 | 48 | 18 | 34 | 0.570 | 0.482–0.658 | +49 ±61 | 82.0% | 18.0% | 0.0% | 81.0±45.9 | 0.36 | 0.033 | 0.613 | 0.13 | 0.96 | 0.47 | 1.00 | -0.015 | 0.487 | 0.487 | balance |
| KRBBNQNR | 100 | 43 | 26 | 31 | 0.560 | 0.477–0.643 | +42 ±58 | 74.0% | 25.0% | 1.0% | 94.8±41.7 | 0.35 | 0.032 | 0.643 | 0.11 | 0.97 | 0.47 | 1.00 | -0.097 | 0.484 | 0.484 | balance,drawRate |
| NBRQBNKR | 100 | 39 | 23 | 38 | 0.505 | 0.419–0.591 | +3 ±60 | 77.0% | 23.0% | 0.0% | 88.8±44.0 | 0.34 | 0.053 | 0.637 | 0.13 | 0.96 | 0.49 | 1.00 | -0.075 | 0.480 | 0.480 | - |

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
