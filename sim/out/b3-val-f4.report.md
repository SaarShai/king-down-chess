# Sim report — b3-val-f4

2000 games. White score **0.512** (95% 0.493–0.531),
white advantage **+9 ± 13 Elo**.
Decisive 74.8% · draws 22.3% · capped 3.0% (counted apart, never as draws).
Plies: mean 121.8 ± 64.0, median 106. Rules: all defaults.

No complete colour-swapped pairs in this run.
σ_pg 0.4321 · normalized Elo +10 · LOS 89.8% ·
SPRT LLR 0.52 against ±2.94 (nElo 0 vs 4) → **continue**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 2000 | 772 | 505 | 723 | 0.512 | 0.493–0.531 | +9 ±13 | 74.8% | 22.3% | 3.0% | 121.8±64.0 | 0.34 | 0.025 | 0.646 | 0.15 | 0.97 | 0.34 | 1.75 | -0.001 | 0.493 | 0.493 | - |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | R | S | Q | A | K | P |
|---|---|---|---|---|---|---|
| use | 1.44 | 1.46 | 1.46 | 2.04 | 1.93 | 0.34 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 1495 | 74.8% |
| adjudicatedDraw | 349 | 17.4% |
| drawRepetition | 69 | 3.5% |
| plyCap | 60 | 3.0% |
| draw50 | 21 | 1.1% |
| drawMaterial | 4 | 0.2% |
| stalemate | 2 | 0.1% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| A | 61980 | 10584 | 2607 | 8000 | 5393 | 67.4% |
| S | 44500 | 4688 | 3710 | 8000 | 4290 | 53.6% |
| R | 43858 | 5617 | 4401 | 8000 | 3599 | 45.0% |
| P | 41500 | 7435 | 19643 | 32000 | 12162 | 38.0% |
| K | 29448 | 1213 | 0 | 4000 | 4000 | 100.0% |
| Q | 22219 | 3761 | 2940 | 4000 | 1246 | 31.1% |
| G | 43 | 4 | 1 | 0 | 7 | 0.0% |
| N | 2 | 1 | 1 | 0 | 0 | 0.0% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 10584 | 5.29 |
| beastChainMoves | 3721 | 1.86 |
| beastChainCaptures | 4688 | 2.34 |
| maesterSwaps | 0 | 0.00 |
| maesterLongSwaps | 0 | 0.00 |
| paladinSacrifices | 0 | 0.00 |
| promotions | 195 | 0.10 |
| checks | 11464 | 5.73 |

## Degeneracy counters
| counter | value |
|---|---|
| guard captures per game | 0.002 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 25 (1.3%) |
| games where a king never moved | 530 (26.5%) |

## Interest terms, residualised on draw rate
Each term minus what this run's `term ~ a + b·drawRate` line predicts from the arrangement's draw
rate. The mean over the arrangements is 0 by construction, so read differences between pools, never
levels. Overall row, fitted on the 20 arrangements:
| killerMove | leadChange | uncertaintyLate | drama | permanence | fairyUse | excessDecisiveness | interest | interestMinFairy |
|---|---|---|---|---|---|---|---|---|
| 0.000 | 0.000 | 0.000 | 0.000 | -0.000 | 0.000 | -0.001 | -0.000 | -0.000 |

## Balance axis — back ranks by |white score − 0.5| (ascending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| AARRQSSK | 100 | 39 | 23 | 38 | 0.505 | 0.419–0.591 | +3 ±60 | 77.0% | 22.0% | 1.0% | 133.4±59.7 | 0.33 | 0.022 | 0.647 | 0.16 | 0.97 | 0.33 | 1.77 | 0.022 | 0.494 | 0.494 | - |
| SKQSRRAA | 100 | 32 | 33 | 35 | 0.485 | 0.405–0.565 | -10 ±56 | 67.0% | 30.0% | 3.0% | 138.2±65.0 | 0.29 | 0.030 | 0.649 | 0.14 | 0.97 | 0.33 | 1.75 | -0.078 | 0.478 | 0.478 | - |
| RRSQAAKS | 100 | 36 | 25 | 39 | 0.485 | 0.400–0.570 | -10 ±59 | 75.0% | 23.0% | 2.0% | 133.0±63.4 | 0.34 | 0.022 | 0.649 | 0.17 | 0.97 | 0.33 | 1.72 | 0.002 | 0.496 | 0.496 | - |
| RRSQSAKA | 100 | 36 | 32 | 32 | 0.520 | 0.439–0.601 | +14 ±56 | 68.0% | 29.0% | 3.0% | 129.0±64.5 | 0.30 | 0.020 | 0.648 | 0.14 | 0.97 | 0.35 | 1.71 | -0.068 | 0.482 | 0.482 | - |
| KARASRQS | 100 | 38 | 28 | 34 | 0.520 | 0.437–0.603 | +14 ±58 | 72.0% | 26.0% | 2.0% | 111.7±56.0 | 0.33 | 0.024 | 0.647 | 0.15 | 0.97 | 0.37 | 1.78 | -0.028 | 0.492 | 0.492 | - |
| ASASRQKR | 100 | 39 | 26 | 35 | 0.520 | 0.436–0.604 | +14 ±59 | 74.0% | 22.0% | 4.0% | 117.6±66.6 | 0.38 | 0.022 | 0.650 | 0.17 | 0.97 | 0.35 | 1.80 | -0.008 | 0.504 | 0.504 | - |
| QASRSARK | 100 | 44 | 17 | 39 | 0.525 | 0.436–0.614 | +17 ±62 | 83.0% | 15.0% | 2.0% | 125.3±63.9 | 0.35 | 0.027 | 0.639 | 0.17 | 0.97 | 0.34 | 1.71 | 0.082 | 0.502 | 0.502 | - |
| QSRSKRAA | 100 | 36 | 22 | 42 | 0.470 | 0.384–0.556 | -21 ±60 | 78.0% | 18.0% | 4.0% | 124.3±65.6 | 0.34 | 0.021 | 0.634 | 0.13 | 0.97 | 0.33 | 1.68 | 0.032 | 0.494 | 0.494 | balance |
| KSRRSAQA | 100 | 43 | 20 | 37 | 0.530 | 0.443–0.617 | +21 ±61 | 80.0% | 19.0% | 1.0% | 114.1±56.6 | 0.35 | 0.021 | 0.641 | 0.18 | 0.97 | 0.37 | 1.83 | 0.052 | 0.503 | 0.503 | balance |
| SASRAKQR | 100 | 36 | 21 | 43 | 0.465 | 0.378–0.552 | -24 ±60 | 79.0% | 19.0% | 2.0% | 117.9±61.1 | 0.34 | 0.028 | 0.646 | 0.18 | 0.97 | 0.34 | 1.79 | 0.042 | 0.499 | 0.499 | balance |
| SAQRASRK | 100 | 38 | 31 | 31 | 0.535 | 0.454–0.616 | +24 ±56 | 69.0% | 28.0% | 3.0% | 113.5±65.6 | 0.34 | 0.029 | 0.639 | 0.13 | 0.96 | 0.34 | 1.87 | -0.058 | 0.487 | 0.487 | balance |
| SRASAKRQ | 100 | 36 | 20 | 44 | 0.460 | 0.373–0.547 | -28 ±61 | 80.0% | 17.0% | 3.0% | 106.8±63.3 | 0.32 | 0.029 | 0.644 | 0.15 | 0.97 | 0.35 | 1.72 | 0.052 | 0.492 | 0.492 | balance |
| SRSARAQK | 100 | 30 | 31 | 39 | 0.455 | 0.374–0.536 | -31 ±56 | 69.0% | 30.0% | 1.0% | 116.5±54.6 | 0.34 | 0.025 | 0.653 | 0.16 | 0.97 | 0.36 | 1.82 | -0.057 | 0.492 | 0.492 | balance |
| RAKQRSAS | 100 | 35 | 20 | 45 | 0.450 | 0.363–0.537 | -35 ±61 | 80.0% | 18.0% | 2.0% | 114.9±63.2 | 0.33 | 0.028 | 0.652 | 0.17 | 0.97 | 0.35 | 1.74 | 0.053 | 0.497 | 0.497 | balance |
| AKQRARSS | 100 | 43 | 26 | 31 | 0.560 | 0.477–0.643 | +42 ±58 | 74.0% | 22.0% | 4.0% | 125.0±61.8 | 0.34 | 0.025 | 0.642 | 0.14 | 0.97 | 0.34 | 1.78 | -0.007 | 0.493 | 0.493 | balance |
| SRSKAAQR | 100 | 33 | 21 | 46 | 0.435 | 0.349–0.521 | -45 ±60 | 79.0% | 14.0% | 7.0% | 130.1±73.4 | 0.36 | 0.030 | 0.646 | 0.17 | 0.97 | 0.31 | 1.58 | 0.043 | 0.502 | 0.502 | balance,timeouts |
| RAKSSQAR | 100 | 41 | 32 | 27 | 0.570 | 0.490–0.650 | +49 ±55 | 68.0% | 29.0% | 3.0% | 116.2±65.7 | 0.29 | 0.029 | 0.646 | 0.11 | 0.97 | 0.32 | 1.84 | -0.067 | 0.474 | 0.474 | balance |
| ARASRKSQ | 100 | 45 | 25 | 30 | 0.575 | 0.491–0.659 | +53 ±58 | 75.0% | 20.0% | 5.0% | 117.4±64.9 | 0.36 | 0.025 | 0.650 | 0.15 | 0.97 | 0.34 | 1.76 | 0.003 | 0.499 | 0.499 | balance |
| SRASRQAK | 100 | 45 | 27 | 28 | 0.585 | 0.503–0.667 | +60 ±57 | 73.0% | 23.0% | 4.0% | 123.7±64.2 | 0.32 | 0.025 | 0.650 | 0.13 | 0.97 | 0.34 | 1.71 | -0.016 | 0.488 | 0.488 | balance |
| RQRSSAAK | 100 | 47 | 25 | 28 | 0.595 | 0.512–0.678 | +67 ±58 | 75.0% | 21.0% | 4.0% | 126.8±67.9 | 0.35 | 0.022 | 0.648 | 0.15 | 0.97 | 0.33 | 1.67 | 0.004 | 0.496 | 0.496 | balance |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ASASRQKR | 100 | 39 | 26 | 35 | 0.520 | 0.436–0.604 | +14 ±59 | 74.0% | 22.0% | 4.0% | 117.6±66.6 | 0.38 | 0.022 | 0.650 | 0.17 | 0.97 | 0.35 | 1.80 | -0.008 | 0.504 | 0.504 | - |
| KSRRSAQA | 100 | 43 | 20 | 37 | 0.530 | 0.443–0.617 | +21 ±61 | 80.0% | 19.0% | 1.0% | 114.1±56.6 | 0.35 | 0.021 | 0.641 | 0.18 | 0.97 | 0.37 | 1.83 | 0.052 | 0.503 | 0.503 | balance |
| QASRSARK | 100 | 44 | 17 | 39 | 0.525 | 0.436–0.614 | +17 ±62 | 83.0% | 15.0% | 2.0% | 125.3±63.9 | 0.35 | 0.027 | 0.639 | 0.17 | 0.97 | 0.34 | 1.71 | 0.082 | 0.502 | 0.502 | - |
| SRSKAAQR | 100 | 33 | 21 | 46 | 0.435 | 0.349–0.521 | -45 ±60 | 79.0% | 14.0% | 7.0% | 130.1±73.4 | 0.36 | 0.030 | 0.646 | 0.17 | 0.97 | 0.31 | 1.58 | 0.043 | 0.502 | 0.502 | balance,timeouts |
| SASRAKQR | 100 | 36 | 21 | 43 | 0.465 | 0.378–0.552 | -24 ±60 | 79.0% | 19.0% | 2.0% | 117.9±61.1 | 0.34 | 0.028 | 0.646 | 0.18 | 0.97 | 0.34 | 1.79 | 0.042 | 0.499 | 0.499 | balance |
| ARASRKSQ | 100 | 45 | 25 | 30 | 0.575 | 0.491–0.659 | +53 ±58 | 75.0% | 20.0% | 5.0% | 117.4±64.9 | 0.36 | 0.025 | 0.650 | 0.15 | 0.97 | 0.34 | 1.76 | 0.003 | 0.499 | 0.499 | balance |
| RAKQRSAS | 100 | 35 | 20 | 45 | 0.450 | 0.363–0.537 | -35 ±61 | 80.0% | 18.0% | 2.0% | 114.9±63.2 | 0.33 | 0.028 | 0.652 | 0.17 | 0.97 | 0.35 | 1.74 | 0.053 | 0.497 | 0.497 | balance |
| RRSQAAKS | 100 | 36 | 25 | 39 | 0.485 | 0.400–0.570 | -10 ±59 | 75.0% | 23.0% | 2.0% | 133.0±63.4 | 0.34 | 0.022 | 0.649 | 0.17 | 0.97 | 0.33 | 1.72 | 0.002 | 0.496 | 0.496 | - |
| RQRSSAAK | 100 | 47 | 25 | 28 | 0.595 | 0.512–0.678 | +67 ±58 | 75.0% | 21.0% | 4.0% | 126.8±67.9 | 0.35 | 0.022 | 0.648 | 0.15 | 0.97 | 0.33 | 1.67 | 0.004 | 0.496 | 0.496 | balance |
| AARRQSSK | 100 | 39 | 23 | 38 | 0.505 | 0.419–0.591 | +3 ±60 | 77.0% | 22.0% | 1.0% | 133.4±59.7 | 0.33 | 0.022 | 0.647 | 0.16 | 0.97 | 0.33 | 1.77 | 0.022 | 0.494 | 0.494 | - |
| QSRSKRAA | 100 | 36 | 22 | 42 | 0.470 | 0.384–0.556 | -21 ±60 | 78.0% | 18.0% | 4.0% | 124.3±65.6 | 0.34 | 0.021 | 0.634 | 0.13 | 0.97 | 0.33 | 1.68 | 0.032 | 0.494 | 0.494 | balance |
| AKQRARSS | 100 | 43 | 26 | 31 | 0.560 | 0.477–0.643 | +42 ±58 | 74.0% | 22.0% | 4.0% | 125.0±61.8 | 0.34 | 0.025 | 0.642 | 0.14 | 0.97 | 0.34 | 1.78 | -0.007 | 0.493 | 0.493 | balance |
| SRASAKRQ | 100 | 36 | 20 | 44 | 0.460 | 0.373–0.547 | -28 ±61 | 80.0% | 17.0% | 3.0% | 106.8±63.3 | 0.32 | 0.029 | 0.644 | 0.15 | 0.97 | 0.35 | 1.72 | 0.052 | 0.492 | 0.492 | balance |
| SRSARAQK | 100 | 30 | 31 | 39 | 0.455 | 0.374–0.536 | -31 ±56 | 69.0% | 30.0% | 1.0% | 116.5±54.6 | 0.34 | 0.025 | 0.653 | 0.16 | 0.97 | 0.36 | 1.82 | -0.057 | 0.492 | 0.492 | balance |
| KARASRQS | 100 | 38 | 28 | 34 | 0.520 | 0.437–0.603 | +14 ±58 | 72.0% | 26.0% | 2.0% | 111.7±56.0 | 0.33 | 0.024 | 0.647 | 0.15 | 0.97 | 0.37 | 1.78 | -0.028 | 0.492 | 0.492 | - |
| SRASRQAK | 100 | 45 | 27 | 28 | 0.585 | 0.503–0.667 | +60 ±57 | 73.0% | 23.0% | 4.0% | 123.7±64.2 | 0.32 | 0.025 | 0.650 | 0.13 | 0.97 | 0.34 | 1.71 | -0.016 | 0.488 | 0.488 | balance |
| SAQRASRK | 100 | 38 | 31 | 31 | 0.535 | 0.454–0.616 | +24 ±56 | 69.0% | 28.0% | 3.0% | 113.5±65.6 | 0.34 | 0.029 | 0.639 | 0.13 | 0.96 | 0.34 | 1.87 | -0.058 | 0.487 | 0.487 | balance |
| RRSQSAKA | 100 | 36 | 32 | 32 | 0.520 | 0.439–0.601 | +14 ±56 | 68.0% | 29.0% | 3.0% | 129.0±64.5 | 0.30 | 0.020 | 0.648 | 0.14 | 0.97 | 0.35 | 1.71 | -0.068 | 0.482 | 0.482 | - |
| SKQSRRAA | 100 | 32 | 33 | 35 | 0.485 | 0.405–0.565 | -10 ±56 | 67.0% | 30.0% | 3.0% | 138.2±65.0 | 0.29 | 0.030 | 0.649 | 0.14 | 0.97 | 0.33 | 1.75 | -0.078 | 0.478 | 0.478 | - |
| RAKSSQAR | 100 | 41 | 32 | 27 | 0.570 | 0.490–0.650 | +49 ±55 | 68.0% | 29.0% | 3.0% | 116.2±65.7 | 0.29 | 0.029 | 0.646 | 0.11 | 0.97 | 0.32 | 1.84 | -0.067 | 0.474 | 0.474 | balance |

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
