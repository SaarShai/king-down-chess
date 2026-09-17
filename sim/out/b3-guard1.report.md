# Sim report — b3-guard1

2000 games. White score **0.496** (95% 0.479–0.513),
white advantage **-3 ± 12 Elo**.
Decisive 59.4% · draws 33.5% · capped 7.1% (counted apart, never as draws).
Plies: mean 143.2 ± 74.0, median 123. Rules: all defaults.

No complete colour-swapped pairs in this run.
σ_pg 0.3853 · normalized Elo -4 · LOS 32.1% ·
SPRT LLR -0.37 against ±2.94 (nElo 0 vs 4) → **continue**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 2000 | 586 | 812 | 602 | 0.496 | 0.479–0.513 | -3 ±12 | 59.4% | 33.5% | 7.1% | 143.2±74.0 | 0.32 | 0.030 | 0.648 | 0.11 | 0.97 | 0.33 | 1.95 | 0.006 | 0.484 | 0.484 | timeouts |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | G | M | K | Q | N | B | A | R | P |
|---|---|---|---|---|---|---|---|---|---|
| use | 2.41 | 1.66 | 2.35 | 1.46 | 0.94 | 0.97 | 1.78 | 1.78 | 0.33 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 1188 | 59.4% |
| adjudicatedDraw | 540 | 27.0% |
| plyCap | 143 | 7.1% |
| drawRepetition | 59 | 2.9% |
| draw50 | 42 | 2.1% |
| drawMaterial | 28 | 1.4% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| P | 47377 | 8547 | 20375 | 32000 | 11132 | 34.8% |
| G | 43091 | 2407 | 331 | 4000 | 3684 | 92.1% |
| K | 42089 | 2797 | 0 | 4000 | 4000 | 100.0% |
| R | 31962 | 4188 | 2252 | 4000 | 1748 | 43.7% |
| A | 31886 | 4857 | 2687 | 4000 | 1315 | 32.9% |
| M | 29753 | 3209 | 2789 | 4000 | 1211 | 30.3% |
| Q | 26164 | 5459 | 3252 | 4000 | 1222 | 30.6% |
| B | 17286 | 3920 | 3310 | 4000 | 690 | 17.3% |
| N | 16890 | 3336 | 3724 | 4000 | 278 | 7.0% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 4857 | 2.43 |
| beastChainMoves | 0 | 0.00 |
| beastChainCaptures | 0 | 0.00 |
| maesterSwaps | 12906 | 6.45 |
| maesterLongSwaps | 2314 | 1.16 |
| paladinSacrifices | 0 | 0.00 |
| promotions | 493 | 0.25 |
| checks | 18017 | 9.01 |

## Degeneracy counters
| counter | value |
|---|---|
| guard captures per game | 1.204 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 70 (3.5%) |
| games where a king never moved | 332 (16.6%) |

## Interest terms, residualised on draw rate
Each term minus what this run's `term ~ a + b·drawRate` line predicts from the arrangement's draw
rate. The mean over the arrangements is 0 by construction, so read differences between pools, never
levels. Overall row, fitted on the 20 arrangements:
| killerMove | leadChange | uncertaintyLate | drama | permanence | fairyUse | excessDecisiveness | interest | interestMinFairy |
|---|---|---|---|---|---|---|---|---|
| 0.000 | 0.000 | 0.000 | -0.000 | -0.000 | 0.000 | 0.006 | 0.000 | 0.000 |

## Balance axis — back ranks by |white score − 0.5| (ascending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| MRBAQGKN | 100 | 34 | 32 | 34 | 0.500 | 0.419–0.581 | +0 ±56 | 68.0% | 20.0% | 12.0% | 153.8±78.2 | 0.36 | 0.027 | 0.631 | 0.12 | 0.97 | 0.31 | 1.89 | 0.093 | 0.497 | 0.497 | timeouts |
| GMKQNBAR | 100 | 29 | 40 | 31 | 0.490 | 0.414–0.566 | -7 ±53 | 60.0% | 36.0% | 4.0% | 140.4±67.7 | 0.33 | 0.030 | 0.652 | 0.11 | 0.97 | 0.34 | 1.84 | 0.011 | 0.487 | 0.487 | - |
| QBANGKMR | 100 | 24 | 54 | 22 | 0.510 | 0.444–0.576 | +7 ±46 | 46.0% | 45.0% | 9.0% | 145.7±75.6 | 0.29 | 0.031 | 0.653 | 0.10 | 0.98 | 0.32 | 1.97 | -0.129 | 0.471 | 0.471 | timeouts,drawRate |
| KAMRQBGN | 100 | 30 | 38 | 32 | 0.490 | 0.413–0.567 | -7 ±54 | 62.0% | 30.0% | 8.0% | 150.6±81.2 | 0.32 | 0.028 | 0.652 | 0.10 | 0.98 | 0.31 | 1.96 | 0.031 | 0.487 | 0.487 | timeouts |
| MNRAQGBK | 100 | 28 | 41 | 31 | 0.485 | 0.410–0.560 | -10 ±52 | 59.0% | 36.0% | 5.0% | 136.6±67.9 | 0.33 | 0.031 | 0.661 | 0.12 | 0.97 | 0.35 | 1.98 | 0.000 | 0.489 | 0.489 | - |
| QNBAKGRM | 100 | 26 | 44 | 30 | 0.480 | 0.407–0.553 | -14 ±51 | 56.0% | 36.0% | 8.0% | 147.3±75.0 | 0.32 | 0.029 | 0.651 | 0.12 | 0.97 | 0.33 | 1.85 | -0.031 | 0.485 | 0.485 | timeouts |
| RABNKGQM | 100 | 24 | 48 | 28 | 0.480 | 0.409–0.551 | -14 ±49 | 52.0% | 38.0% | 10.0% | 152.7±75.4 | 0.31 | 0.030 | 0.655 | 0.11 | 0.98 | 0.32 | 1.94 | -0.071 | 0.479 | 0.479 | timeouts |
| MBQGNKAR | 100 | 30 | 45 | 25 | 0.525 | 0.452–0.598 | +17 ±50 | 55.0% | 39.0% | 6.0% | 144.2±77.2 | 0.28 | 0.031 | 0.647 | 0.09 | 0.98 | 0.31 | 2.05 | -0.042 | 0.471 | 0.471 | timeouts |
| GNQRMABK | 100 | 37 | 31 | 32 | 0.525 | 0.444–0.606 | +17 ±56 | 69.0% | 24.0% | 7.0% | 144.6±72.0 | 0.35 | 0.024 | 0.647 | 0.14 | 0.97 | 0.34 | 1.93 | 0.098 | 0.501 | 0.501 | timeouts |
| NMBRKGQA | 100 | 25 | 44 | 31 | 0.470 | 0.397–0.543 | -21 ±51 | 56.0% | 35.0% | 9.0% | 149.2±70.5 | 0.33 | 0.035 | 0.655 | 0.11 | 0.97 | 0.33 | 2.02 | -0.033 | 0.485 | 0.485 | balance,timeouts |
| MNBRQKGA | 100 | 37 | 33 | 30 | 0.535 | 0.455–0.615 | +24 ±56 | 67.0% | 30.0% | 3.0% | 130.2±71.3 | 0.33 | 0.037 | 0.641 | 0.11 | 0.97 | 0.35 | 1.96 | 0.076 | 0.489 | 0.489 | balance |
| KGAQNBMR | 100 | 24 | 44 | 32 | 0.460 | 0.387–0.533 | -28 ±51 | 56.0% | 37.0% | 7.0% | 139.6±72.5 | 0.29 | 0.030 | 0.657 | 0.10 | 0.97 | 0.34 | 1.83 | -0.035 | 0.477 | 0.477 | balance,timeouts |
| ABRMNGQK | 100 | 26 | 39 | 35 | 0.455 | 0.379–0.531 | -31 ±53 | 61.0% | 30.0% | 9.0% | 140.4±77.6 | 0.29 | 0.026 | 0.637 | 0.08 | 0.97 | 0.34 | 1.92 | 0.014 | 0.475 | 0.475 | balance,timeouts |
| NGMQRBKA | 100 | 35 | 40 | 25 | 0.550 | 0.475–0.625 | +35 ±52 | 60.0% | 32.0% | 8.0% | 146.0±75.6 | 0.31 | 0.032 | 0.650 | 0.12 | 0.97 | 0.32 | 2.08 | 0.003 | 0.485 | 0.485 | balance,timeouts |
| QRABKMGN | 100 | 37 | 36 | 27 | 0.550 | 0.472–0.628 | +35 ±54 | 64.0% | 29.0% | 7.0% | 144.9±75.0 | 0.33 | 0.028 | 0.636 | 0.12 | 0.97 | 0.33 | 1.95 | 0.043 | 0.490 | 0.490 | balance,timeouts |
| RNKQMGAB | 100 | 36 | 38 | 26 | 0.550 | 0.473–0.627 | +35 ±53 | 62.0% | 33.0% | 5.0% | 128.0±64.7 | 0.32 | 0.031 | 0.648 | 0.12 | 0.97 | 0.36 | 1.96 | 0.023 | 0.486 | 0.486 | balance |
| NQKMGABR | 100 | 23 | 43 | 34 | 0.445 | 0.372–0.518 | -38 ±51 | 57.0% | 37.0% | 6.0% | 143.7±69.4 | 0.31 | 0.031 | 0.655 | 0.11 | 0.98 | 0.33 | 1.95 | -0.028 | 0.482 | 0.482 | balance,timeouts |
| RGANBMKQ | 100 | 33 | 47 | 20 | 0.565 | 0.495–0.635 | +45 ±49 | 53.0% | 40.0% | 7.0% | 132.6±74.7 | 0.30 | 0.030 | 0.652 | 0.10 | 0.97 | 0.34 | 1.99 | -0.070 | 0.476 | 0.476 | balance,timeouts |
| QMBKNRGA | 100 | 25 | 36 | 39 | 0.430 | 0.353–0.507 | -49 ±54 | 64.0% | 30.0% | 6.0% | 152.7±74.6 | 0.30 | 0.025 | 0.641 | 0.11 | 0.98 | 0.33 | 1.90 | 0.039 | 0.485 | 0.485 | balance,timeouts |
| KBNMGRQA | 100 | 23 | 39 | 38 | 0.425 | 0.350–0.500 | -53 ±52 | 61.0% | 32.0% | 7.0% | 141.7±74.7 | 0.32 | 0.028 | 0.643 | 0.10 | 0.98 | 0.33 | 2.03 | 0.008 | 0.482 | 0.482 | balance,timeouts |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| GNQRMABK | 100 | 37 | 31 | 32 | 0.525 | 0.444–0.606 | +17 ±56 | 69.0% | 24.0% | 7.0% | 144.6±72.0 | 0.35 | 0.024 | 0.647 | 0.14 | 0.97 | 0.34 | 1.93 | 0.098 | 0.501 | 0.501 | timeouts |
| MRBAQGKN | 100 | 34 | 32 | 34 | 0.500 | 0.419–0.581 | +0 ±56 | 68.0% | 20.0% | 12.0% | 153.8±78.2 | 0.36 | 0.027 | 0.631 | 0.12 | 0.97 | 0.31 | 1.89 | 0.093 | 0.497 | 0.497 | timeouts |
| QRABKMGN | 100 | 37 | 36 | 27 | 0.550 | 0.472–0.628 | +35 ±54 | 64.0% | 29.0% | 7.0% | 144.9±75.0 | 0.33 | 0.028 | 0.636 | 0.12 | 0.97 | 0.33 | 1.95 | 0.043 | 0.490 | 0.490 | balance,timeouts |
| MNRAQGBK | 100 | 28 | 41 | 31 | 0.485 | 0.410–0.560 | -10 ±52 | 59.0% | 36.0% | 5.0% | 136.6±67.9 | 0.33 | 0.031 | 0.661 | 0.12 | 0.97 | 0.35 | 1.98 | 0.000 | 0.489 | 0.489 | - |
| MNBRQKGA | 100 | 37 | 33 | 30 | 0.535 | 0.455–0.615 | +24 ±56 | 67.0% | 30.0% | 3.0% | 130.2±71.3 | 0.33 | 0.037 | 0.641 | 0.11 | 0.97 | 0.35 | 1.96 | 0.076 | 0.489 | 0.489 | balance |
| GMKQNBAR | 100 | 29 | 40 | 31 | 0.490 | 0.414–0.566 | -7 ±53 | 60.0% | 36.0% | 4.0% | 140.4±67.7 | 0.33 | 0.030 | 0.652 | 0.11 | 0.97 | 0.34 | 1.84 | 0.011 | 0.487 | 0.487 | - |
| KAMRQBGN | 100 | 30 | 38 | 32 | 0.490 | 0.413–0.567 | -7 ±54 | 62.0% | 30.0% | 8.0% | 150.6±81.2 | 0.32 | 0.028 | 0.652 | 0.10 | 0.98 | 0.31 | 1.96 | 0.031 | 0.487 | 0.487 | timeouts |
| RNKQMGAB | 100 | 36 | 38 | 26 | 0.550 | 0.473–0.627 | +35 ±53 | 62.0% | 33.0% | 5.0% | 128.0±64.7 | 0.32 | 0.031 | 0.648 | 0.12 | 0.97 | 0.36 | 1.96 | 0.023 | 0.486 | 0.486 | balance |
| NGMQRBKA | 100 | 35 | 40 | 25 | 0.550 | 0.475–0.625 | +35 ±52 | 60.0% | 32.0% | 8.0% | 146.0±75.6 | 0.31 | 0.032 | 0.650 | 0.12 | 0.97 | 0.32 | 2.08 | 0.003 | 0.485 | 0.485 | balance,timeouts |
| NMBRKGQA | 100 | 25 | 44 | 31 | 0.470 | 0.397–0.543 | -21 ±51 | 56.0% | 35.0% | 9.0% | 149.2±70.5 | 0.33 | 0.035 | 0.655 | 0.11 | 0.97 | 0.33 | 2.02 | -0.033 | 0.485 | 0.485 | balance,timeouts |
| QNBAKGRM | 100 | 26 | 44 | 30 | 0.480 | 0.407–0.553 | -14 ±51 | 56.0% | 36.0% | 8.0% | 147.3±75.0 | 0.32 | 0.029 | 0.651 | 0.12 | 0.97 | 0.33 | 1.85 | -0.031 | 0.485 | 0.485 | timeouts |
| QMBKNRGA | 100 | 25 | 36 | 39 | 0.430 | 0.353–0.507 | -49 ±54 | 64.0% | 30.0% | 6.0% | 152.7±74.6 | 0.30 | 0.025 | 0.641 | 0.11 | 0.98 | 0.33 | 1.90 | 0.039 | 0.485 | 0.485 | balance,timeouts |
| KBNMGRQA | 100 | 23 | 39 | 38 | 0.425 | 0.350–0.500 | -53 ±52 | 61.0% | 32.0% | 7.0% | 141.7±74.7 | 0.32 | 0.028 | 0.643 | 0.10 | 0.98 | 0.33 | 2.03 | 0.008 | 0.482 | 0.482 | balance,timeouts |
| NQKMGABR | 100 | 23 | 43 | 34 | 0.445 | 0.372–0.518 | -38 ±51 | 57.0% | 37.0% | 6.0% | 143.7±69.4 | 0.31 | 0.031 | 0.655 | 0.11 | 0.98 | 0.33 | 1.95 | -0.028 | 0.482 | 0.482 | balance,timeouts |
| RABNKGQM | 100 | 24 | 48 | 28 | 0.480 | 0.409–0.551 | -14 ±49 | 52.0% | 38.0% | 10.0% | 152.7±75.4 | 0.31 | 0.030 | 0.655 | 0.11 | 0.98 | 0.32 | 1.94 | -0.071 | 0.479 | 0.479 | timeouts |
| KGAQNBMR | 100 | 24 | 44 | 32 | 0.460 | 0.387–0.533 | -28 ±51 | 56.0% | 37.0% | 7.0% | 139.6±72.5 | 0.29 | 0.030 | 0.657 | 0.10 | 0.97 | 0.34 | 1.83 | -0.035 | 0.477 | 0.477 | balance,timeouts |
| RGANBMKQ | 100 | 33 | 47 | 20 | 0.565 | 0.495–0.635 | +45 ±49 | 53.0% | 40.0% | 7.0% | 132.6±74.7 | 0.30 | 0.030 | 0.652 | 0.10 | 0.97 | 0.34 | 1.99 | -0.070 | 0.476 | 0.476 | balance,timeouts |
| ABRMNGQK | 100 | 26 | 39 | 35 | 0.455 | 0.379–0.531 | -31 ±53 | 61.0% | 30.0% | 9.0% | 140.4±77.6 | 0.29 | 0.026 | 0.637 | 0.08 | 0.97 | 0.34 | 1.92 | 0.014 | 0.475 | 0.475 | balance,timeouts |
| MBQGNKAR | 100 | 30 | 45 | 25 | 0.525 | 0.452–0.598 | +17 ±50 | 55.0% | 39.0% | 6.0% | 144.2±77.2 | 0.28 | 0.031 | 0.647 | 0.09 | 0.98 | 0.31 | 2.05 | -0.042 | 0.471 | 0.471 | timeouts |
| QBANGKMR | 100 | 24 | 54 | 22 | 0.510 | 0.444–0.576 | +7 ±46 | 46.0% | 45.0% | 9.0% | 145.7±75.6 | 0.29 | 0.031 | 0.653 | 0.10 | 0.98 | 0.32 | 1.97 | -0.129 | 0.471 | 0.471 | timeouts,drawRate |

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
