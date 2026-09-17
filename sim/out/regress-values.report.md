# Sim report — regress-values

20 games. White score **0.525** (95% 0.363–0.687),
white advantage **+17 ± 113 Elo**.
Decisive 55.0% · draws 35.0% · capped 10.0% (counted apart, never as draws).
Plies: mean 123.5 ± 80.6, median 96. Rules: all defaults.

No complete colour-swapped pairs in this run.
σ_pg 0.3700 · normalized Elo +23 · LOS 61.9% ·
SPRT LLR 0.01 against ±2.94 (nElo 0 vs 4) → **continue**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 20 | 6 | 9 | 5 | 0.525 | 0.363–0.687 | +17 ±113 | 55.0% | 35.0% | 10.0% | 123.5±80.6 | 0.30 | 0.032 | 0.644 | 0.14 | 0.96 | 0.38 | 1.46 | 0.171 | 0.493 | 0.369 | timeouts |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | B | L | R | A | K | S | M | P | G | N | Q |
|---|---|---|---|---|---|---|---|---|---|---|---|
| use | 1.23 | 0.60 | 1.57 | 1.54 | 1.75 | 0.38 | 2.75 | 0.44 | 2.00 | 1.65 | 1.30 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 11 | 55.0% |
| adjudicatedDraw | 3 | 15.0% |
| draw50 | 2 | 10.0% |
| plyCap | 2 | 10.0% |
| drawMaterial | 1 | 5.0% |
| drawRepetition | 1 | 5.0% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| P | 540 | 110 | 198 | 320 | 118 | 36.9% |
| G | 432 | 0 | 3 | 56 | 53 | 94.6% |
| M | 425 | 24 | 16 | 40 | 24 | 60.0% |
| K | 270 | 23 | 0 | 40 | 40 | 100.0% |
| B | 266 | 61 | 46 | 56 | 10 | 17.9% |
| N | 153 | 30 | 20 | 24 | 4 | 16.7% |
| A | 143 | 18 | 7 | 24 | 17 | 70.8% |
| R | 97 | 20 | 9 | 16 | 7 | 43.8% |
| L | 56 | 13 | 11 | 24 | 0 | 0.0% |
| S | 47 | 8 | 5 | 32 | 27 | 84.4% |
| Q | 40 | 13 | 5 | 8 | 7 | 87.5% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 18 | 0.90 |
| beastChainMoves | 8 | 0.40 |
| beastChainCaptures | 8 | 0.40 |
| maesterSwaps | 174 | 8.70 |
| maesterLongSwaps | 24 | 1.20 |
| paladinSacrifices | 13 | 0.65 |
| promotions | 4 | 0.20 |
| checks | 92 | 4.60 |

## Degeneracy counters
| counter | value |
|---|---|
| guard captures per game | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 3 (15.0%) |
| games where a king never moved | 5 (25.0%) |

## Interest terms, residualised on draw rate
Each term minus what this run's `term ~ a + b·drawRate` line predicts from the arrangement's draw
rate. The mean over the arrangements is 0 by construction, so read differences between pools, never
levels. Overall row, fitted on the 5 arrangements:
| killerMove | leadChange | uncertaintyLate | drama | permanence | fairyUse | excessDecisiveness | interest | interestMinFairy |
|---|---|---|---|---|---|---|---|---|
| 0.000 | -0.000 | 0.000 | 0.000 | -0.000 | 0.034 | 0.171 | 0.017 | -0.002 |

## Balance axis — back ranks by |white score − 0.5| (ascending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BLRAKBSM | 4 | 1 | 1 | 2 | 0.375 | 0.000–0.781 | -89 ±282 | 75.0% | 25.0% | 0.0% | 98.0±17.8 | 0.28 | 0.056 | 0.622 | 0.18 | 0.97 | 0.62 | 1.29 | 0.286 | 0.494 | 0.433 | balance |
| GBNMMGSK | 4 | 1 | 3 | 0 | 0.625 | 0.413–0.837 | +89 ±148 | 25.0% | 50.0% | 25.0% | 148.3±94.9 | 0.24 | 0.026 | 0.704 | 0.08 | 0.97 | 0.30 | 1.66 | -0.214 | 0.461 | 0.320 | balance,timeouts |
| MMGNBKSL | 4 | 2 | 2 | 0 | 0.750 | 0.505–0.995 | +191 ±170 | 50.0% | 50.0% | 0.0% | 145.8±70.2 | 0.21 | 0.031 | 0.655 | 0.06 | 0.97 | 0.36 | 1.67 | -0.071 | 0.452 | 0.324 | balance |
| LNBBGGKA | 4 | 2 | 2 | 0 | 0.750 | 0.505–0.995 | +191 ±170 | 50.0% | 25.0% | 25.0% | 139.5±102.9 | 0.25 | 0.018 | 0.612 | 0.14 | 0.96 | 0.37 | 1.35 | -0.071 | 0.466 | 0.381 | balance,timeouts |
| SGGRQKBA | 4 | 0 | 1 | 3 | 0.125 | 0.000–0.337 | -338 ±148 | 75.0% | 25.0% | 0.0% | 85.8±64.8 | 0.53 | 0.028 | 0.625 | 0.23 | 0.93 | 0.28 | 0.83 | 0.071 | 0.505 | 0.395 | balance |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| SGGRQKBA | 4 | 0 | 1 | 3 | 0.125 | 0.000–0.337 | -338 ±148 | 75.0% | 25.0% | 0.0% | 85.8±64.8 | 0.53 | 0.028 | 0.625 | 0.23 | 0.93 | 0.28 | 0.83 | 0.071 | 0.505 | 0.395 | balance |
| BLRAKBSM | 4 | 1 | 1 | 2 | 0.375 | 0.000–0.781 | -89 ±282 | 75.0% | 25.0% | 0.0% | 98.0±17.8 | 0.28 | 0.056 | 0.622 | 0.18 | 0.97 | 0.62 | 1.29 | 0.286 | 0.494 | 0.433 | balance |
| LNBBGGKA | 4 | 2 | 2 | 0 | 0.750 | 0.505–0.995 | +191 ±170 | 50.0% | 25.0% | 25.0% | 139.5±102.9 | 0.25 | 0.018 | 0.612 | 0.14 | 0.96 | 0.37 | 1.35 | -0.071 | 0.466 | 0.381 | balance,timeouts |
| GBNMMGSK | 4 | 1 | 3 | 0 | 0.625 | 0.413–0.837 | +89 ±148 | 25.0% | 50.0% | 25.0% | 148.3±94.9 | 0.24 | 0.026 | 0.704 | 0.08 | 0.97 | 0.30 | 1.66 | -0.214 | 0.461 | 0.320 | balance,timeouts |
| MMGNBKSL | 4 | 2 | 2 | 0 | 0.750 | 0.505–0.995 | +191 ±170 | 50.0% | 50.0% | 0.0% | 145.8±70.2 | 0.21 | 0.031 | 0.655 | 0.06 | 0.97 | 0.36 | 1.67 | -0.071 | 0.452 | 0.324 | balance |

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
