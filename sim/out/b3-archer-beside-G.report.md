# Sim report — b3-archer-beside-G

3200 games. White score **0.516** (95% 0.505–0.528),
white advantage **+11 ± 8 Elo**.
Decisive 45.1% · draws 40.8% · capped 14.2% (counted apart, never as draws).
Plies: mean 152.2 ± 88.0, median 122. Rules: all defaults.

No complete colour-swapped pairs in this run.
σ_pg 0.3352 · normalized Elo +17 · LOS 99.7% ·
SPRT LLR 1.57 against ±2.94 (nElo 0 vs 4) → **continue**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 3200 | 773 | 1758 | 669 | 0.516 | 0.505–0.528 | +11 ±8 | 45.1% | 40.8% | 14.2% | 152.2±88.0 | 0.29 | 0.023 | 0.638 | 0.08 | 0.97 | 0.29 | 1.91 | -0.001 | 0.474 | 0.474 | timeouts |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | B | R | G | A | K | Q | P |
|---|---|---|---|---|---|---|---|
| use | 1.12 | 1.63 | 2.06 | 1.75 | 1.98 | 1.34 | 0.29 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 1441 | 45.0% |
| adjudicatedDraw | 976 | 30.5% |
| plyCap | 454 | 14.2% |
| draw50 | 162 | 5.1% |
| drawRepetition | 110 | 3.4% |
| drawMaterial | 56 | 1.8% |
| checkmate | 1 | 0.0% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| G | 125647 | 6171 | 689 | 12800 | 12120 | 94.7% |
| A | 106244 | 14448 | 6031 | 12800 | 6769 | 52.9% |
| P | 70303 | 12910 | 36425 | 51200 | 14496 | 28.3% |
| K | 60207 | 3153 | 0 | 6400 | 6400 | 100.0% |
| R | 49678 | 5235 | 3398 | 6400 | 3002 | 46.9% |
| Q | 40669 | 7684 | 4860 | 6400 | 1809 | 28.3% |
| B | 34135 | 6569 | 4767 | 6400 | 1633 | 25.5% |
| L | 0 | 0 | 0 | 0 | 1 | 0.0% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 14448 | 4.51 |
| beastChainMoves | 0 | 0.00 |
| beastChainCaptures | 0 | 0.00 |
| maesterSwaps | 0 | 0.00 |
| maesterLongSwaps | 0 | 0.00 |
| paladinSacrifices | 0 | 0.00 |
| promotions | 279 | 0.09 |
| checks | 28735 | 8.98 |

## Degeneracy counters
| counter | value |
|---|---|
| guard captures per game | 1.928 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 218 (6.8%) |
| games where a king never moved | 600 (18.8%) |

## Interest terms, residualised on draw rate
Each term minus what this run's `term ~ a + b·drawRate` line predicts from the arrangement's draw
rate. The mean over the arrangements is 0 by construction, so read differences between pools, never
levels. Overall row, fitted on the 20 arrangements:
| killerMove | leadChange | uncertaintyLate | drama | permanence | fairyUse | excessDecisiveness | interest | interestMinFairy |
|---|---|---|---|---|---|---|---|---|
| 0.000 | 0.000 | -0.000 | -0.000 | -0.000 | 0.000 | -0.001 | -0.000 | -0.000 |

## Balance axis — back ranks by |white score − 0.5| (ascending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| AGQBRAGK | 160 | 31 | 97 | 32 | 0.497 | 0.448–0.545 | -2 ±34 | 39.4% | 42.5% | 18.1% | 161.9±85.5 | 0.29 | 0.020 | 0.638 | 0.07 | 0.98 | 0.28 | 1.86 | -0.060 | 0.471 | 0.471 | timeouts |
| AGAKBRGQ | 160 | 35 | 88 | 37 | 0.494 | 0.442–0.546 | -4 ±36 | 45.0% | 43.8% | 11.3% | 145.9±86.4 | 0.29 | 0.028 | 0.636 | 0.07 | 0.97 | 0.29 | 1.79 | -0.003 | 0.472 | 0.472 | timeouts |
| GAQKBGRA | 160 | 35 | 87 | 38 | 0.491 | 0.438–0.543 | -7 ±36 | 45.6% | 39.4% | 15.0% | 149.8±91.5 | 0.30 | 0.024 | 0.635 | 0.08 | 0.97 | 0.29 | 1.86 | 0.003 | 0.477 | 0.477 | timeouts |
| GARQGKBA | 160 | 31 | 95 | 34 | 0.491 | 0.441–0.540 | -7 ±34 | 40.6% | 46.9% | 12.5% | 162.6±80.9 | 0.26 | 0.022 | 0.649 | 0.07 | 0.98 | 0.28 | 2.01 | -0.047 | 0.466 | 0.466 | timeouts |
| AGBRAKQG | 160 | 40 | 85 | 35 | 0.516 | 0.463–0.569 | +11 ±37 | 46.9% | 36.9% | 16.3% | 155.1±88.3 | 0.30 | 0.018 | 0.620 | 0.09 | 0.98 | 0.29 | 1.90 | 0.017 | 0.477 | 0.477 | timeouts |
| ARKBGAQG | 160 | 31 | 103 | 26 | 0.516 | 0.469–0.562 | +11 ±32 | 35.6% | 45.0% | 19.4% | 162.4±92.3 | 0.27 | 0.022 | 0.640 | 0.06 | 0.98 | 0.27 | 1.95 | -0.096 | 0.463 | 0.463 | timeouts |
| KQABAGRG | 160 | 41 | 70 | 49 | 0.475 | 0.417–0.533 | -17 ±40 | 56.3% | 30.0% | 13.8% | 143.2±87.9 | 0.36 | 0.021 | 0.643 | 0.11 | 0.97 | 0.30 | 1.92 | 0.111 | 0.501 | 0.501 | timeouts |
| RGAAKBQG | 160 | 51 | 66 | 43 | 0.525 | 0.466–0.584 | +17 ±41 | 58.8% | 33.1% | 8.1% | 143.2±84.8 | 0.33 | 0.024 | 0.636 | 0.10 | 0.97 | 0.29 | 1.82 | 0.136 | 0.494 | 0.494 | timeouts |
| RQAKGBAG | 160 | 38 | 76 | 46 | 0.475 | 0.419–0.531 | -17 ±39 | 52.5% | 35.6% | 11.9% | 146.1±83.7 | 0.27 | 0.021 | 0.630 | 0.07 | 0.98 | 0.30 | 1.90 | 0.074 | 0.475 | 0.475 | timeouts |
| KBRGAAGQ | 160 | 40 | 88 | 32 | 0.525 | 0.473–0.577 | +17 ±36 | 45.0% | 36.3% | 18.8% | 161.0±94.8 | 0.29 | 0.020 | 0.631 | 0.09 | 0.97 | 0.27 | 1.98 | -0.001 | 0.476 | 0.476 | timeouts |
| QGKRGAAB | 160 | 47 | 75 | 38 | 0.528 | 0.472–0.584 | +20 ±39 | 53.1% | 40.0% | 6.9% | 138.8±80.0 | 0.29 | 0.027 | 0.641 | 0.09 | 0.97 | 0.32 | 1.78 | 0.080 | 0.480 | 0.480 | timeouts |
| GRAQKBGA | 160 | 30 | 91 | 39 | 0.472 | 0.421–0.523 | -20 ±35 | 43.1% | 40.0% | 16.9% | 155.3±91.6 | 0.29 | 0.024 | 0.635 | 0.07 | 0.97 | 0.29 | 1.87 | -0.020 | 0.474 | 0.474 | timeouts |
| BAQAGGRK | 160 | 40 | 90 | 30 | 0.531 | 0.480–0.582 | +22 ±35 | 43.8% | 40.0% | 16.3% | 155.8±91.4 | 0.29 | 0.022 | 0.631 | 0.08 | 0.97 | 0.28 | 1.99 | -0.013 | 0.472 | 0.472 | balance,timeouts |
| AGRQABKG | 160 | 35 | 101 | 24 | 0.534 | 0.488–0.581 | +24 ±32 | 36.9% | 46.3% | 16.9% | 157.3±86.3 | 0.26 | 0.026 | 0.649 | 0.07 | 0.98 | 0.28 | 2.00 | -0.082 | 0.464 | 0.464 | balance,timeouts |
| KBARQGAG | 160 | 39 | 93 | 28 | 0.534 | 0.485–0.584 | +24 ±35 | 41.9% | 41.3% | 16.9% | 152.0±91.4 | 0.29 | 0.022 | 0.643 | 0.08 | 0.97 | 0.30 | 1.99 | -0.032 | 0.474 | 0.474 | balance,timeouts |
| KGRBGAQA | 160 | 26 | 95 | 39 | 0.459 | 0.410–0.508 | -28 ±34 | 40.6% | 48.8% | 10.6% | 138.2±83.7 | 0.29 | 0.025 | 0.659 | 0.07 | 0.98 | 0.31 | 1.85 | -0.043 | 0.474 | 0.474 | balance,timeouts,drawRate |
| BQARAGGK | 160 | 44 | 88 | 28 | 0.550 | 0.499–0.601 | +35 ±36 | 45.0% | 41.3% | 13.8% | 149.6±91.2 | 0.27 | 0.023 | 0.629 | 0.07 | 0.98 | 0.30 | 1.85 | 0.001 | 0.468 | 0.468 | balance,timeouts |
| BKQGAGAR | 160 | 46 | 89 | 25 | 0.566 | 0.515–0.616 | +46 ±35 | 44.4% | 45.6% | 10.0% | 158.4±82.1 | 0.27 | 0.018 | 0.628 | 0.08 | 0.98 | 0.27 | 1.94 | -0.003 | 0.470 | 0.470 | balance,timeouts |
| AAGRBGQK | 160 | 43 | 97 | 20 | 0.572 | 0.525–0.619 | +50 ±33 | 39.4% | 43.1% | 17.5% | 166.3±88.1 | 0.26 | 0.022 | 0.646 | 0.07 | 0.98 | 0.28 | 1.97 | -0.053 | 0.466 | 0.466 | balance,timeouts |
| BRGGAAKQ | 160 | 50 | 84 | 26 | 0.575 | 0.523–0.627 | +53 ±36 | 47.5% | 39.4% | 13.1% | 140.3±87.6 | 0.27 | 0.027 | 0.637 | 0.09 | 0.98 | 0.30 | 1.83 | 0.029 | 0.473 | 0.473 | balance,timeouts |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| KQABAGRG | 160 | 41 | 70 | 49 | 0.475 | 0.417–0.533 | -17 ±40 | 56.3% | 30.0% | 13.8% | 143.2±87.9 | 0.36 | 0.021 | 0.643 | 0.11 | 0.97 | 0.30 | 1.92 | 0.111 | 0.501 | 0.501 | timeouts |
| RGAAKBQG | 160 | 51 | 66 | 43 | 0.525 | 0.466–0.584 | +17 ±41 | 58.8% | 33.1% | 8.1% | 143.2±84.8 | 0.33 | 0.024 | 0.636 | 0.10 | 0.97 | 0.29 | 1.82 | 0.136 | 0.494 | 0.494 | timeouts |
| QGKRGAAB | 160 | 47 | 75 | 38 | 0.528 | 0.472–0.584 | +20 ±39 | 53.1% | 40.0% | 6.9% | 138.8±80.0 | 0.29 | 0.027 | 0.641 | 0.09 | 0.97 | 0.32 | 1.78 | 0.080 | 0.480 | 0.480 | timeouts |
| GAQKBGRA | 160 | 35 | 87 | 38 | 0.491 | 0.438–0.543 | -7 ±36 | 45.6% | 39.4% | 15.0% | 149.8±91.5 | 0.30 | 0.024 | 0.635 | 0.08 | 0.97 | 0.29 | 1.86 | 0.003 | 0.477 | 0.477 | timeouts |
| AGBRAKQG | 160 | 40 | 85 | 35 | 0.516 | 0.463–0.569 | +11 ±37 | 46.9% | 36.9% | 16.3% | 155.1±88.3 | 0.30 | 0.018 | 0.620 | 0.09 | 0.98 | 0.29 | 1.90 | 0.017 | 0.477 | 0.477 | timeouts |
| KBRGAAGQ | 160 | 40 | 88 | 32 | 0.525 | 0.473–0.577 | +17 ±36 | 45.0% | 36.3% | 18.8% | 161.0±94.8 | 0.29 | 0.020 | 0.631 | 0.09 | 0.97 | 0.27 | 1.98 | -0.001 | 0.476 | 0.476 | timeouts |
| RQAKGBAG | 160 | 38 | 76 | 46 | 0.475 | 0.419–0.531 | -17 ±39 | 52.5% | 35.6% | 11.9% | 146.1±83.7 | 0.27 | 0.021 | 0.630 | 0.07 | 0.98 | 0.30 | 1.90 | 0.074 | 0.475 | 0.475 | timeouts |
| KGRBGAQA | 160 | 26 | 95 | 39 | 0.459 | 0.410–0.508 | -28 ±34 | 40.6% | 48.8% | 10.6% | 138.2±83.7 | 0.29 | 0.025 | 0.659 | 0.07 | 0.98 | 0.31 | 1.85 | -0.043 | 0.474 | 0.474 | balance,timeouts,drawRate |
| KBARQGAG | 160 | 39 | 93 | 28 | 0.534 | 0.485–0.584 | +24 ±35 | 41.9% | 41.3% | 16.9% | 152.0±91.4 | 0.29 | 0.022 | 0.643 | 0.08 | 0.97 | 0.30 | 1.99 | -0.032 | 0.474 | 0.474 | balance,timeouts |
| GRAQKBGA | 160 | 30 | 91 | 39 | 0.472 | 0.421–0.523 | -20 ±35 | 43.1% | 40.0% | 16.9% | 155.3±91.6 | 0.29 | 0.024 | 0.635 | 0.07 | 0.97 | 0.29 | 1.87 | -0.020 | 0.474 | 0.474 | timeouts |
| BRGGAAKQ | 160 | 50 | 84 | 26 | 0.575 | 0.523–0.627 | +53 ±36 | 47.5% | 39.4% | 13.1% | 140.3±87.6 | 0.27 | 0.027 | 0.637 | 0.09 | 0.98 | 0.30 | 1.83 | 0.029 | 0.473 | 0.473 | balance,timeouts |
| BAQAGGRK | 160 | 40 | 90 | 30 | 0.531 | 0.480–0.582 | +22 ±35 | 43.8% | 40.0% | 16.3% | 155.8±91.4 | 0.29 | 0.022 | 0.631 | 0.08 | 0.97 | 0.28 | 1.99 | -0.013 | 0.472 | 0.472 | balance,timeouts |
| AGAKBRGQ | 160 | 35 | 88 | 37 | 0.494 | 0.442–0.546 | -4 ±36 | 45.0% | 43.8% | 11.3% | 145.9±86.4 | 0.29 | 0.028 | 0.636 | 0.07 | 0.97 | 0.29 | 1.79 | -0.003 | 0.472 | 0.472 | timeouts |
| AGQBRAGK | 160 | 31 | 97 | 32 | 0.497 | 0.448–0.545 | -2 ±34 | 39.4% | 42.5% | 18.1% | 161.9±85.5 | 0.29 | 0.020 | 0.638 | 0.07 | 0.98 | 0.28 | 1.86 | -0.060 | 0.471 | 0.471 | timeouts |
| BKQGAGAR | 160 | 46 | 89 | 25 | 0.566 | 0.515–0.616 | +46 ±35 | 44.4% | 45.6% | 10.0% | 158.4±82.1 | 0.27 | 0.018 | 0.628 | 0.08 | 0.98 | 0.27 | 1.94 | -0.003 | 0.470 | 0.470 | balance,timeouts |
| BQARAGGK | 160 | 44 | 88 | 28 | 0.550 | 0.499–0.601 | +35 ±36 | 45.0% | 41.3% | 13.8% | 149.6±91.2 | 0.27 | 0.023 | 0.629 | 0.07 | 0.98 | 0.30 | 1.85 | 0.001 | 0.468 | 0.468 | balance,timeouts |
| GARQGKBA | 160 | 31 | 95 | 34 | 0.491 | 0.441–0.540 | -7 ±34 | 40.6% | 46.9% | 12.5% | 162.6±80.9 | 0.26 | 0.022 | 0.649 | 0.07 | 0.98 | 0.28 | 2.01 | -0.047 | 0.466 | 0.466 | timeouts |
| AAGRBGQK | 160 | 43 | 97 | 20 | 0.572 | 0.525–0.619 | +50 ±33 | 39.4% | 43.1% | 17.5% | 166.3±88.1 | 0.26 | 0.022 | 0.646 | 0.07 | 0.98 | 0.28 | 1.97 | -0.053 | 0.466 | 0.466 | balance,timeouts |
| AGRQABKG | 160 | 35 | 101 | 24 | 0.534 | 0.488–0.581 | +24 ±32 | 36.9% | 46.3% | 16.9% | 157.3±86.3 | 0.26 | 0.026 | 0.649 | 0.07 | 0.98 | 0.28 | 2.00 | -0.082 | 0.464 | 0.464 | balance,timeouts |
| ARKBGAQG | 160 | 31 | 103 | 26 | 0.516 | 0.469–0.562 | +11 ±32 | 35.6% | 45.0% | 19.4% | 162.4±92.3 | 0.27 | 0.022 | 0.640 | 0.06 | 0.98 | 0.27 | 1.95 | -0.096 | 0.463 | 0.463 | timeouts |

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
