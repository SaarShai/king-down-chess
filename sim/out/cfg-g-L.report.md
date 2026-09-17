# Sim report — cfg-g-L

3200 games. White score **0.548** (95% 0.532–0.564),
white advantage **+33 ± 11 Elo**.
Decisive 87.3% · draws 12.6% · capped 0.1% (counted apart, never as draws).
Plies: mean 84.6 ± 38.4, median 78. Rules: all defaults.

No complete colour-swapped pairs in this run.
σ_pg 0.4648 · normalized Elo +36 · LOS 100.0% ·
SPRT LLR 3.56 against ±2.94 (nElo 0 vs 4) → **H1**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 3200 | 1551 | 405 | 1244 | 0.548 | 0.532–0.564 | +33 ±11 | 87.3% | 12.6% | 0.1% | 84.6±38.4 | 0.38 | 0.033 | 0.613 | 0.16 | 0.96 | 0.52 | 1.02 | 0.000 | 0.496 | 0.496 | balance |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | K | N | B | Q | R | L | P |
|---|---|---|---|---|---|---|---|
| use | 2.07 | 1.39 | 1.11 | 1.85 | 1.60 | 1.02 | 0.52 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 2793 | 87.3% |
| adjudicatedDraw | 251 | 7.8% |
| drawRepetition | 101 | 3.2% |
| draw50 | 24 | 0.8% |
| drawMaterial | 23 | 0.7% |
| plyCap | 3 | 0.1% |
| stalemate | 3 | 0.1% |
| checkmate | 2 | 0.1% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| P | 70968 | 15216 | 26925 | 51200 | 23265 | 45.4% |
| N | 44625 | 9671 | 9702 | 12160 | 2471 | 20.3% |
| R | 43298 | 9437 | 5554 | 10240 | 4690 | 45.8% |
| K | 34994 | 3134 | 0 | 6400 | 6400 | 100.0% |
| B | 33004 | 8482 | 8217 | 11200 | 2984 | 26.6% |
| Q | 29656 | 7294 | 4213 | 6080 | 2786 | 45.8% |
| L | 13857 | 3042 | 1646 | 5120 | 436 | 8.5% |
| G | 287 | 0 | 18 | 0 | 50 | 0.0% |
| S | 0 | 0 | 1 | 0 | 0 | 0.0% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 0 | 0.00 |
| beastChainMoves | 0 | 0.00 |
| beastChainCaptures | 0 | 0.00 |
| maesterSwaps | 0 | 0.00 |
| maesterLongSwaps | 0 | 0.00 |
| paladinSacrifices | 3042 | 0.95 |
| promotions | 1010 | 0.32 |
| checks | 20323 | 6.35 |

## Degeneracy counters
| counter | value |
|---|---|
| guard captures per game | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 47 (1.5%) |
| games where a king never moved | 1029 (32.2%) |

## Interest terms, residualised on draw rate
Each term minus what this run's `term ~ a + b·drawRate` line predicts from the arrangement's draw
rate. The mean over the arrangements is 0 by construction, so read differences between pools, never
levels. Overall row, fitted on the 20 arrangements:
| killerMove | leadChange | uncertaintyLate | drama | permanence | fairyUse | excessDecisiveness | interest | interestMinFairy |
|---|---|---|---|---|---|---|---|---|
| 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.015 | 0.000 | 0.003 | 0.003 |

## Balance axis — back ranks by |white score − 0.5| (ascending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| QRNKNRLB | 160 | 71 | 18 | 71 | 0.500 | 0.427–0.573 | +0 ±51 | 88.8% | 10.6% | 0.6% | 81.8±43.2 | 0.35 | 0.031 | 0.595 | 0.15 | 0.96 | 0.51 | 1.13 | 0.018 | 0.489 | 0.489 | - |
| RNNBQRBK | 160 | 67 | 25 | 68 | 0.497 | 0.426–0.568 | -2 ±49 | 84.4% | 15.6% | 0.0% | 86.1±35.5 | 0.39 | 0.041 | 0.636 | 0.17 | 0.95 | 0.53 | 1.00 | -0.026 | 0.500 | 0.500 | - |
| LBBNQKNR | 160 | 66 | 29 | 65 | 0.503 | 0.433–0.573 | +2 ±49 | 81.9% | 18.1% | 0.0% | 85.3±36.3 | 0.37 | 0.032 | 0.622 | 0.15 | 0.96 | 0.54 | 1.06 | -0.051 | 0.492 | 0.492 | - |
| LBBQNRNK | 160 | 66 | 24 | 70 | 0.487 | 0.416–0.559 | -9 ±50 | 85.0% | 14.4% | 0.6% | 85.1±38.0 | 0.38 | 0.025 | 0.604 | 0.14 | 0.96 | 0.55 | 1.07 | -0.021 | 0.492 | 0.492 | - |
| RRKNBNLQ | 160 | 77 | 11 | 72 | 0.516 | 0.441–0.590 | +11 ±52 | 93.1% | 6.9% | 0.0% | 88.8±40.9 | 0.40 | 0.029 | 0.608 | 0.17 | 0.96 | 0.51 | 0.94 | 0.060 | 0.494 | 0.494 | - |
| LQBKRNNB | 160 | 75 | 18 | 67 | 0.525 | 0.452–0.598 | +17 ±51 | 88.8% | 11.3% | 0.0% | 82.3±33.6 | 0.39 | 0.031 | 0.609 | 0.17 | 0.95 | 0.52 | 1.00 | 0.016 | 0.501 | 0.501 | - |
| RQKBBRLN | 160 | 75 | 20 | 65 | 0.531 | 0.459–0.604 | +22 ±50 | 87.5% | 12.5% | 0.0% | 80.4±40.9 | 0.37 | 0.028 | 0.604 | 0.14 | 0.96 | 0.53 | 1.13 | 0.003 | 0.493 | 0.493 | balance |
| KBBRNRNQ | 160 | 76 | 20 | 64 | 0.537 | 0.465–0.610 | +26 ±50 | 87.5% | 12.5% | 0.0% | 83.5±41.0 | 0.39 | 0.041 | 0.630 | 0.18 | 0.96 | 0.54 | 1.00 | 0.002 | 0.502 | 0.502 | balance |
| NRBRQKNL | 160 | 77 | 20 | 63 | 0.544 | 0.472–0.616 | +30 ±50 | 87.5% | 12.5% | 0.0% | 84.0±34.8 | 0.37 | 0.030 | 0.596 | 0.15 | 0.96 | 0.48 | 1.08 | 0.002 | 0.491 | 0.491 | balance |
| LRNBBQNK | 160 | 77 | 21 | 62 | 0.547 | 0.475–0.619 | +33 ±50 | 86.9% | 13.1% | 0.0% | 80.1±31.5 | 0.37 | 0.035 | 0.619 | 0.14 | 0.96 | 0.54 | 1.03 | -0.004 | 0.493 | 0.493 | balance |
| KNBBQRLN | 160 | 80 | 16 | 64 | 0.550 | 0.477–0.623 | +35 ±51 | 90.0% | 10.0% | 0.0% | 86.2±36.4 | 0.39 | 0.028 | 0.605 | 0.15 | 0.96 | 0.52 | 0.96 | 0.027 | 0.491 | 0.491 | balance |
| NBQNLRBK | 160 | 79 | 18 | 63 | 0.550 | 0.477–0.623 | +35 ±50 | 88.8% | 11.3% | 0.0% | 83.7±38.1 | 0.42 | 0.030 | 0.613 | 0.17 | 0.96 | 0.54 | 1.09 | 0.014 | 0.507 | 0.507 | balance |
| RBLKBNRN | 160 | 76 | 24 | 60 | 0.550 | 0.479–0.621 | +35 ±49 | 85.0% | 15.0% | 0.0% | 99.9±41.1 | 0.34 | 0.030 | 0.623 | 0.16 | 0.96 | 0.51 | 0.80 | -0.023 | 0.450 | 0.450 | balance |
| NKRQBBRN | 160 | 78 | 22 | 60 | 0.556 | 0.485–0.628 | +39 ±50 | 86.3% | 13.8% | 0.0% | 90.5±43.7 | 0.37 | 0.046 | 0.634 | 0.17 | 0.96 | 0.50 | 1.00 | -0.011 | 0.496 | 0.496 | balance |
| QRNRBKLB | 160 | 82 | 14 | 64 | 0.556 | 0.483–0.630 | +39 ±51 | 91.3% | 8.8% | 0.0% | 78.6±34.2 | 0.36 | 0.028 | 0.587 | 0.16 | 0.96 | 0.55 | 0.99 | 0.039 | 0.490 | 0.490 | balance |
| KBBNQRNR | 160 | 77 | 33 | 50 | 0.584 | 0.517–0.652 | +59 ±47 | 79.4% | 20.6% | 0.0% | 88.4±40.4 | 0.38 | 0.042 | 0.641 | 0.16 | 0.96 | 0.52 | 1.00 | -0.082 | 0.493 | 0.493 | balance,drawRate |
| BRRNLNKQ | 160 | 88 | 14 | 58 | 0.594 | 0.521–0.666 | +66 ±50 | 91.3% | 8.8% | 0.0% | 77.9±36.3 | 0.40 | 0.033 | 0.607 | 0.17 | 0.95 | 0.52 | 1.02 | 0.036 | 0.503 | 0.503 | balance |
| BBQNKLNR | 160 | 89 | 16 | 55 | 0.606 | 0.535–0.678 | +75 ±50 | 90.0% | 10.0% | 0.0% | 79.3±34.0 | 0.37 | 0.033 | 0.611 | 0.16 | 0.96 | 0.55 | 1.13 | 0.022 | 0.496 | 0.496 | balance |
| RNRLBKNQ | 160 | 87 | 22 | 51 | 0.613 | 0.543–0.682 | +80 ±49 | 86.3% | 13.8% | 0.0% | 84.0±38.3 | 0.37 | 0.037 | 0.609 | 0.13 | 0.96 | 0.51 | 1.07 | -0.016 | 0.490 | 0.490 | balance |
| RBQLBNKN | 160 | 88 | 20 | 52 | 0.613 | 0.542–0.683 | +80 ±49 | 87.5% | 11.9% | 0.6% | 85.8±40.0 | 0.38 | 0.030 | 0.614 | 0.14 | 0.96 | 0.53 | 1.02 | -0.003 | 0.495 | 0.495 | balance |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| NBQNLRBK | 160 | 79 | 18 | 63 | 0.550 | 0.477–0.623 | +35 ±50 | 88.8% | 11.3% | 0.0% | 83.7±38.1 | 0.42 | 0.030 | 0.613 | 0.17 | 0.96 | 0.54 | 1.09 | 0.014 | 0.507 | 0.507 | balance |
| BRRNLNKQ | 160 | 88 | 14 | 58 | 0.594 | 0.521–0.666 | +66 ±50 | 91.3% | 8.8% | 0.0% | 77.9±36.3 | 0.40 | 0.033 | 0.607 | 0.17 | 0.95 | 0.52 | 1.02 | 0.036 | 0.503 | 0.503 | balance |
| KBBRNRNQ | 160 | 76 | 20 | 64 | 0.537 | 0.465–0.610 | +26 ±50 | 87.5% | 12.5% | 0.0% | 83.5±41.0 | 0.39 | 0.041 | 0.630 | 0.18 | 0.96 | 0.54 | 1.00 | 0.002 | 0.502 | 0.502 | balance |
| LQBKRNNB | 160 | 75 | 18 | 67 | 0.525 | 0.452–0.598 | +17 ±51 | 88.8% | 11.3% | 0.0% | 82.3±33.6 | 0.39 | 0.031 | 0.609 | 0.17 | 0.95 | 0.52 | 1.00 | 0.016 | 0.501 | 0.501 | - |
| RNNBQRBK | 160 | 67 | 25 | 68 | 0.497 | 0.426–0.568 | -2 ±49 | 84.4% | 15.6% | 0.0% | 86.1±35.5 | 0.39 | 0.041 | 0.636 | 0.17 | 0.95 | 0.53 | 1.00 | -0.026 | 0.500 | 0.500 | - |
| BBQNKLNR | 160 | 89 | 16 | 55 | 0.606 | 0.535–0.678 | +75 ±50 | 90.0% | 10.0% | 0.0% | 79.3±34.0 | 0.37 | 0.033 | 0.611 | 0.16 | 0.96 | 0.55 | 1.13 | 0.022 | 0.496 | 0.496 | balance |
| NKRQBBRN | 160 | 78 | 22 | 60 | 0.556 | 0.485–0.628 | +39 ±50 | 86.3% | 13.8% | 0.0% | 90.5±43.7 | 0.37 | 0.046 | 0.634 | 0.17 | 0.96 | 0.50 | 1.00 | -0.011 | 0.496 | 0.496 | balance |
| RBQLBNKN | 160 | 88 | 20 | 52 | 0.613 | 0.542–0.683 | +80 ±49 | 87.5% | 11.9% | 0.6% | 85.8±40.0 | 0.38 | 0.030 | 0.614 | 0.14 | 0.96 | 0.53 | 1.02 | -0.003 | 0.495 | 0.495 | balance |
| RRKNBNLQ | 160 | 77 | 11 | 72 | 0.516 | 0.441–0.590 | +11 ±52 | 93.1% | 6.9% | 0.0% | 88.8±40.9 | 0.40 | 0.029 | 0.608 | 0.17 | 0.96 | 0.51 | 0.94 | 0.060 | 0.494 | 0.494 | - |
| RQKBBRLN | 160 | 75 | 20 | 65 | 0.531 | 0.459–0.604 | +22 ±50 | 87.5% | 12.5% | 0.0% | 80.4±40.9 | 0.37 | 0.028 | 0.604 | 0.14 | 0.96 | 0.53 | 1.13 | 0.003 | 0.493 | 0.493 | balance |
| LRNBBQNK | 160 | 77 | 21 | 62 | 0.547 | 0.475–0.619 | +33 ±50 | 86.9% | 13.1% | 0.0% | 80.1±31.5 | 0.37 | 0.035 | 0.619 | 0.14 | 0.96 | 0.54 | 1.03 | -0.004 | 0.493 | 0.493 | balance |
| KBBNQRNR | 160 | 77 | 33 | 50 | 0.584 | 0.517–0.652 | +59 ±47 | 79.4% | 20.6% | 0.0% | 88.4±40.4 | 0.38 | 0.042 | 0.641 | 0.16 | 0.96 | 0.52 | 1.00 | -0.082 | 0.493 | 0.493 | balance,drawRate |
| LBBQNRNK | 160 | 66 | 24 | 70 | 0.487 | 0.416–0.559 | -9 ±50 | 85.0% | 14.4% | 0.6% | 85.1±38.0 | 0.38 | 0.025 | 0.604 | 0.14 | 0.96 | 0.55 | 1.07 | -0.021 | 0.492 | 0.492 | - |
| LBBNQKNR | 160 | 66 | 29 | 65 | 0.503 | 0.433–0.573 | +2 ±49 | 81.9% | 18.1% | 0.0% | 85.3±36.3 | 0.37 | 0.032 | 0.622 | 0.15 | 0.96 | 0.54 | 1.06 | -0.051 | 0.492 | 0.492 | - |
| NRBRQKNL | 160 | 77 | 20 | 63 | 0.544 | 0.472–0.616 | +30 ±50 | 87.5% | 12.5% | 0.0% | 84.0±34.8 | 0.37 | 0.030 | 0.596 | 0.15 | 0.96 | 0.48 | 1.08 | 0.002 | 0.491 | 0.491 | balance |
| KNBBQRLN | 160 | 80 | 16 | 64 | 0.550 | 0.477–0.623 | +35 ±51 | 90.0% | 10.0% | 0.0% | 86.2±36.4 | 0.39 | 0.028 | 0.605 | 0.15 | 0.96 | 0.52 | 0.96 | 0.027 | 0.491 | 0.491 | balance |
| QRNRBKLB | 160 | 82 | 14 | 64 | 0.556 | 0.483–0.630 | +39 ±51 | 91.3% | 8.8% | 0.0% | 78.6±34.2 | 0.36 | 0.028 | 0.587 | 0.16 | 0.96 | 0.55 | 0.99 | 0.039 | 0.490 | 0.490 | balance |
| RNRLBKNQ | 160 | 87 | 22 | 51 | 0.613 | 0.543–0.682 | +80 ±49 | 86.3% | 13.8% | 0.0% | 84.0±38.3 | 0.37 | 0.037 | 0.609 | 0.13 | 0.96 | 0.51 | 1.07 | -0.016 | 0.490 | 0.490 | balance |
| QRNKNRLB | 160 | 71 | 18 | 71 | 0.500 | 0.427–0.573 | +0 ±51 | 88.8% | 10.6% | 0.6% | 81.8±43.2 | 0.35 | 0.031 | 0.595 | 0.15 | 0.96 | 0.51 | 1.13 | 0.018 | 0.489 | 0.489 | - |
| RBLKBNRN | 160 | 76 | 24 | 60 | 0.550 | 0.479–0.621 | +35 ±49 | 85.0% | 15.0% | 0.0% | 99.9±41.1 | 0.34 | 0.030 | 0.623 | 0.16 | 0.96 | 0.51 | 0.80 | -0.023 | 0.450 | 0.450 | balance |

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
