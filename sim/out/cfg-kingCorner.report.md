# Sim report — cfg-kingCorner

3200 games. White score **0.527** (95% 0.514–0.541),
white advantage **+19 ± 9 Elo**.
Decisive 61.8% · draws 32.2% · capped 6.0% (counted apart, never as draws).
Plies: mean 139.3 ± 72.7, median 119. Rules: all defaults.

No complete colour-swapped pairs in this run.
σ_pg 0.3921 · normalized Elo +24 · LOS 100.0% ·
SPRT LLR 2.35 against ±2.94 (nElo 0 vs 4) → **continue**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 3200 | 1076 | 1223 | 901 | 0.527 | 0.514–0.541 | +19 ±9 | 61.8% | 32.2% | 6.0% | 139.3±72.7 | 0.31 | 0.034 | 0.641 | 0.12 | 0.97 | 0.43 | 1.55 | 0.003 | 0.482 | 0.377 | timeouts |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | K | R | N | B | S | A | Q | P | L | M | G |
|---|---|---|---|---|---|---|---|---|---|---|---|
| use | 2.33 | 1.58 | 1.23 | 1.08 | 0.48 | 1.65 | 1.24 | 0.43 | 0.77 | 2.35 | 2.48 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 1976 | 61.8% |
| adjudicatedDraw | 639 | 20.0% |
| draw50 | 248 | 7.8% |
| plyCap | 193 | 6.0% |
| drawRepetition | 118 | 3.7% |
| drawMaterial | 25 | 0.8% |
| checkmate | 1 | 0.0% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| P | 95092 | 19008 | 36137 | 51200 | 13953 | 27.3% |
| M | 65427 | 4216 | 3114 | 6400 | 3286 | 51.3% |
| K | 64785 | 3807 | 0 | 6400 | 6400 | 100.0% |
| R | 46323 | 7472 | 4876 | 6720 | 1845 | 27.5% |
| G | 44956 | 0 | 201 | 4160 | 4044 | 97.2% |
| A | 41396 | 8078 | 1641 | 5760 | 4119 | 71.5% |
| B | 27028 | 5800 | 4784 | 5760 | 976 | 16.9% |
| N | 24074 | 4487 | 3886 | 4480 | 601 | 13.4% |
| Q | 13778 | 2838 | 2401 | 2560 | 1174 | 45.9% |
| S | 11962 | 2008 | 1880 | 5760 | 3880 | 67.4% |
| L | 10780 | 2123 | 917 | 3200 | 162 | 5.1% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 8078 | 2.52 |
| beastChainMoves | 1762 | 0.55 |
| beastChainCaptures | 2008 | 0.63 |
| maesterSwaps | 22969 | 7.18 |
| maesterLongSwaps | 5708 | 1.78 |
| paladinSacrifices | 2123 | 0.66 |
| promotions | 1110 | 0.35 |
| checks | 21268 | 6.65 |

## Degeneracy counters
| counter | value |
|---|---|
| guard captures per game | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 273 (8.5%) |
| games where a king never moved | 458 (14.3%) |

## Interest terms, residualised on draw rate
Each term minus what this run's `term ~ a + b·drawRate` line predicts from the arrangement's draw
rate. The mean over the arrangements is 0 by construction, so read differences between pools, never
levels. Overall row, fitted on the 20 arrangements:
| killerMove | leadChange | uncertaintyLate | drama | permanence | fairyUse | excessDecisiveness | interest | interestMinFairy |
|---|---|---|---|---|---|---|---|---|
| 0.000 | 0.000 | 0.000 | -0.000 | 0.000 | 0.002 | 0.003 | 0.001 | -0.019 |

## Balance axis — back ranks by |white score − 0.5| (ascending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| NMSSMLRK | 160 | 45 | 68 | 47 | 0.494 | 0.435–0.552 | -4 ±41 | 57.5% | 40.0% | 2.5% | 139.5±64.1 | 0.32 | 0.032 | 0.647 | 0.11 | 0.97 | 0.45 | 1.28 | -0.000 | 0.484 | 0.383 | - |
| KBARLMAM | 160 | 47 | 69 | 44 | 0.509 | 0.451–0.568 | +7 ±41 | 56.9% | 33.1% | 10.0% | 153.6±77.5 | 0.27 | 0.037 | 0.644 | 0.11 | 0.97 | 0.40 | 1.48 | -0.012 | 0.471 | 0.407 | timeouts |
| MNSABRQK | 160 | 59 | 45 | 56 | 0.509 | 0.444–0.575 | +7 ±46 | 71.9% | 23.8% | 4.4% | 123.4±62.8 | 0.35 | 0.039 | 0.650 | 0.16 | 0.96 | 0.46 | 1.48 | 0.138 | 0.504 | 0.401 | - |
| KBASQMRA | 160 | 46 | 71 | 43 | 0.509 | 0.452–0.567 | +7 ±40 | 55.6% | 35.0% | 9.4% | 139.6±74.3 | 0.30 | 0.037 | 0.643 | 0.11 | 0.97 | 0.42 | 1.51 | -0.025 | 0.478 | 0.368 | timeouts |
| SMARNMGK | 160 | 31 | 101 | 28 | 0.509 | 0.462–0.556 | +7 ±33 | 36.9% | 48.1% | 15.0% | 169.0±82.7 | 0.25 | 0.052 | 0.668 | 0.07 | 0.97 | 0.37 | 1.65 | -0.212 | 0.453 | 0.342 | timeouts |
| KRNSQRGM | 160 | 57 | 49 | 54 | 0.509 | 0.445–0.574 | +7 ±45 | 69.4% | 28.7% | 1.9% | 132.9±66.6 | 0.36 | 0.033 | 0.646 | 0.15 | 0.97 | 0.44 | 1.57 | 0.113 | 0.503 | 0.410 | - |
| GGBAABRK | 160 | 30 | 103 | 27 | 0.509 | 0.463–0.556 | +7 ±32 | 35.6% | 52.5% | 11.9% | 181.2±82.2 | 0.22 | 0.026 | 0.654 | 0.07 | 0.97 | 0.33 | 2.00 | -0.225 | 0.448 | 0.448 | timeouts |
| KGMASRLQ | 160 | 49 | 58 | 53 | 0.487 | 0.426–0.549 | -9 ±43 | 63.7% | 26.9% | 9.4% | 132.3±82.2 | 0.32 | 0.033 | 0.624 | 0.11 | 0.97 | 0.43 | 1.53 | 0.051 | 0.484 | 0.384 | timeouts |
| BBRNLMAK | 160 | 67 | 33 | 60 | 0.522 | 0.453–0.591 | +15 ±48 | 79.4% | 18.8% | 1.9% | 113.1±49.5 | 0.33 | 0.030 | 0.633 | 0.16 | 0.97 | 0.52 | 1.32 | 0.190 | 0.502 | 0.443 | - |
| KRNBSNAQ | 160 | 68 | 32 | 60 | 0.525 | 0.456–0.594 | +17 ±48 | 80.0% | 19.4% | 0.6% | 108.3±59.1 | 0.38 | 0.037 | 0.631 | 0.16 | 0.96 | 0.48 | 0.97 | 0.190 | 0.503 | 0.406 | - |
| KBMSNSAG | 160 | 48 | 72 | 40 | 0.525 | 0.468–0.582 | +17 ±40 | 55.0% | 33.1% | 11.9% | 162.6±74.2 | 0.29 | 0.035 | 0.649 | 0.11 | 0.97 | 0.40 | 1.86 | -0.060 | 0.474 | 0.373 | timeouts |
| NGMBASSK | 160 | 34 | 102 | 24 | 0.531 | 0.485–0.578 | +22 ±32 | 36.3% | 53.1% | 10.6% | 177.6±79.7 | 0.22 | 0.035 | 0.659 | 0.07 | 0.97 | 0.34 | 1.97 | -0.259 | 0.445 | 0.330 | balance,timeouts,drawRate |
| BASRQBSK | 160 | 62 | 47 | 51 | 0.534 | 0.469–0.599 | +24 ±45 | 70.6% | 25.6% | 3.8% | 115.3±66.4 | 0.33 | 0.036 | 0.640 | 0.13 | 0.96 | 0.50 | 1.31 | 0.079 | 0.491 | 0.394 | balance |
| KLRRMSBA | 160 | 65 | 41 | 54 | 0.534 | 0.468–0.601 | +24 ±46 | 74.4% | 25.0% | 0.6% | 126.6±52.9 | 0.32 | 0.034 | 0.632 | 0.13 | 0.97 | 0.48 | 1.26 | 0.116 | 0.490 | 0.396 | balance |
| SGLRNMRK | 160 | 58 | 58 | 44 | 0.544 | 0.482–0.605 | +30 ±43 | 63.7% | 30.6% | 5.6% | 133.2±67.7 | 0.33 | 0.041 | 0.645 | 0.11 | 0.97 | 0.31 | 1.31 | -0.007 | 0.485 | 0.346 | balance,timeouts |
| KRNQMABG | 160 | 62 | 52 | 46 | 0.550 | 0.487–0.613 | +35 ±44 | 67.5% | 26.3% | 6.3% | 134.2±73.3 | 0.34 | 0.037 | 0.642 | 0.15 | 0.97 | 0.43 | 1.74 | 0.019 | 0.492 | 0.492 | balance,timeouts |
| KMRGLABB | 160 | 59 | 59 | 42 | 0.553 | 0.492–0.614 | +37 ±42 | 63.1% | 32.5% | 4.4% | 135.2±64.3 | 0.31 | 0.033 | 0.639 | 0.11 | 0.97 | 0.46 | 1.59 | -0.031 | 0.480 | 0.408 | balance |
| RGNLABMK | 160 | 58 | 62 | 40 | 0.556 | 0.496–0.616 | +39 ±42 | 61.3% | 35.0% | 3.8% | 142.5±68.3 | 0.29 | 0.027 | 0.630 | 0.10 | 0.97 | 0.42 | 1.53 | -0.055 | 0.472 | 0.425 | balance |
| KBQNMSLG | 160 | 63 | 55 | 42 | 0.566 | 0.504–0.628 | +46 ±43 | 65.6% | 28.7% | 5.6% | 131.0±70.9 | 0.35 | 0.025 | 0.620 | 0.12 | 0.97 | 0.44 | 1.68 | -0.029 | 0.487 | 0.390 | balance,timeouts |
| KLSMRRGN | 160 | 68 | 46 | 46 | 0.569 | 0.504–0.633 | +48 ±45 | 71.3% | 27.5% | 1.3% | 133.7±68.1 | 0.30 | 0.027 | 0.622 | 0.13 | 0.97 | 0.44 | 1.36 | 0.022 | 0.481 | 0.378 | balance |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| MNSABRQK | 160 | 59 | 45 | 56 | 0.509 | 0.444–0.575 | +7 ±46 | 71.9% | 23.8% | 4.4% | 123.4±62.8 | 0.35 | 0.039 | 0.650 | 0.16 | 0.96 | 0.46 | 1.48 | 0.138 | 0.504 | 0.401 | - |
| KRNBSNAQ | 160 | 68 | 32 | 60 | 0.525 | 0.456–0.594 | +17 ±48 | 80.0% | 19.4% | 0.6% | 108.3±59.1 | 0.38 | 0.037 | 0.631 | 0.16 | 0.96 | 0.48 | 0.97 | 0.190 | 0.503 | 0.406 | - |
| KRNSQRGM | 160 | 57 | 49 | 54 | 0.509 | 0.445–0.574 | +7 ±45 | 69.4% | 28.7% | 1.9% | 132.9±66.6 | 0.36 | 0.033 | 0.646 | 0.15 | 0.97 | 0.44 | 1.57 | 0.113 | 0.503 | 0.410 | - |
| BBRNLMAK | 160 | 67 | 33 | 60 | 0.522 | 0.453–0.591 | +15 ±48 | 79.4% | 18.8% | 1.9% | 113.1±49.5 | 0.33 | 0.030 | 0.633 | 0.16 | 0.97 | 0.52 | 1.32 | 0.190 | 0.502 | 0.443 | - |
| KRNQMABG | 160 | 62 | 52 | 46 | 0.550 | 0.487–0.613 | +35 ±44 | 67.5% | 26.3% | 6.3% | 134.2±73.3 | 0.34 | 0.037 | 0.642 | 0.15 | 0.97 | 0.43 | 1.74 | 0.019 | 0.492 | 0.492 | balance,timeouts |
| BASRQBSK | 160 | 62 | 47 | 51 | 0.534 | 0.469–0.599 | +24 ±45 | 70.6% | 25.6% | 3.8% | 115.3±66.4 | 0.33 | 0.036 | 0.640 | 0.13 | 0.96 | 0.50 | 1.31 | 0.079 | 0.491 | 0.394 | balance |
| KLRRMSBA | 160 | 65 | 41 | 54 | 0.534 | 0.468–0.601 | +24 ±46 | 74.4% | 25.0% | 0.6% | 126.6±52.9 | 0.32 | 0.034 | 0.632 | 0.13 | 0.97 | 0.48 | 1.26 | 0.116 | 0.490 | 0.396 | balance |
| KBQNMSLG | 160 | 63 | 55 | 42 | 0.566 | 0.504–0.628 | +46 ±43 | 65.6% | 28.7% | 5.6% | 131.0±70.9 | 0.35 | 0.025 | 0.620 | 0.12 | 0.97 | 0.44 | 1.68 | -0.029 | 0.487 | 0.390 | balance,timeouts |
| SGLRNMRK | 160 | 58 | 58 | 44 | 0.544 | 0.482–0.605 | +30 ±43 | 63.7% | 30.6% | 5.6% | 133.2±67.7 | 0.33 | 0.041 | 0.645 | 0.11 | 0.97 | 0.31 | 1.31 | -0.007 | 0.485 | 0.346 | balance,timeouts |
| KGMASRLQ | 160 | 49 | 58 | 53 | 0.487 | 0.426–0.549 | -9 ±43 | 63.7% | 26.9% | 9.4% | 132.3±82.2 | 0.32 | 0.033 | 0.624 | 0.11 | 0.97 | 0.43 | 1.53 | 0.051 | 0.484 | 0.384 | timeouts |
| NMSSMLRK | 160 | 45 | 68 | 47 | 0.494 | 0.435–0.552 | -4 ±41 | 57.5% | 40.0% | 2.5% | 139.5±64.1 | 0.32 | 0.032 | 0.647 | 0.11 | 0.97 | 0.45 | 1.28 | -0.000 | 0.484 | 0.383 | - |
| KLSMRRGN | 160 | 68 | 46 | 46 | 0.569 | 0.504–0.633 | +48 ±45 | 71.3% | 27.5% | 1.3% | 133.7±68.1 | 0.30 | 0.027 | 0.622 | 0.13 | 0.97 | 0.44 | 1.36 | 0.022 | 0.481 | 0.378 | balance |
| KMRGLABB | 160 | 59 | 59 | 42 | 0.553 | 0.492–0.614 | +37 ±42 | 63.1% | 32.5% | 4.4% | 135.2±64.3 | 0.31 | 0.033 | 0.639 | 0.11 | 0.97 | 0.46 | 1.59 | -0.031 | 0.480 | 0.408 | balance |
| KBASQMRA | 160 | 46 | 71 | 43 | 0.509 | 0.452–0.567 | +7 ±40 | 55.6% | 35.0% | 9.4% | 139.6±74.3 | 0.30 | 0.037 | 0.643 | 0.11 | 0.97 | 0.42 | 1.51 | -0.025 | 0.478 | 0.368 | timeouts |
| KBMSNSAG | 160 | 48 | 72 | 40 | 0.525 | 0.468–0.582 | +17 ±40 | 55.0% | 33.1% | 11.9% | 162.6±74.2 | 0.29 | 0.035 | 0.649 | 0.11 | 0.97 | 0.40 | 1.86 | -0.060 | 0.474 | 0.373 | timeouts |
| RGNLABMK | 160 | 58 | 62 | 40 | 0.556 | 0.496–0.616 | +39 ±42 | 61.3% | 35.0% | 3.8% | 142.5±68.3 | 0.29 | 0.027 | 0.630 | 0.10 | 0.97 | 0.42 | 1.53 | -0.055 | 0.472 | 0.425 | balance |
| KBARLMAM | 160 | 47 | 69 | 44 | 0.509 | 0.451–0.568 | +7 ±41 | 56.9% | 33.1% | 10.0% | 153.6±77.5 | 0.27 | 0.037 | 0.644 | 0.11 | 0.97 | 0.40 | 1.48 | -0.012 | 0.471 | 0.407 | timeouts |
| SMARNMGK | 160 | 31 | 101 | 28 | 0.509 | 0.462–0.556 | +7 ±33 | 36.9% | 48.1% | 15.0% | 169.0±82.7 | 0.25 | 0.052 | 0.668 | 0.07 | 0.97 | 0.37 | 1.65 | -0.212 | 0.453 | 0.342 | timeouts |
| GGBAABRK | 160 | 30 | 103 | 27 | 0.509 | 0.463–0.556 | +7 ±32 | 35.6% | 52.5% | 11.9% | 181.2±82.2 | 0.22 | 0.026 | 0.654 | 0.07 | 0.97 | 0.33 | 2.00 | -0.225 | 0.448 | 0.448 | timeouts |
| NGMBASSK | 160 | 34 | 102 | 24 | 0.531 | 0.485–0.578 | +22 ±32 | 36.3% | 53.1% | 10.6% | 177.6±79.7 | 0.22 | 0.035 | 0.659 | 0.07 | 0.97 | 0.34 | 1.97 | -0.259 | 0.445 | 0.330 | balance,timeouts,drawRate |

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
