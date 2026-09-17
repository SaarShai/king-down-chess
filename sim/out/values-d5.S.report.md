# Sim report — values-d5.S

120 games. White score **0.550** (95% 0.466–0.634),
white advantage **+35 ± 43 Elo**.
Decisive 90.0% · draws 8.3% · capped 1.7% (counted apart, never as draws).
Plies: mean 94.9 ± 50.2, median 81. Rules: all defaults.

Pentanomial over 60 colour-swapped pairs: [35, 9, 14, 1, 1] (LL, LD, DD/WL, WD, WW).
σ_pg 0.3468 · normalized Elo -317 · LOS 0.0% ·
SPRT LLR -0.69 against ±2.94 (nElo 0 vs 4) → **continue**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 120 | 60 | 12 | 48 | 0.550 | 0.466–0.634 | +35 ±43 | 90.0% | 8.3% | 1.7% | 94.9±50.2 | 0.27 | 0.005 | 0.594 | 0.07 | 0.97 | 0.40 | 0.40 | 0.000 | 0.346 | 0.346 | balance |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | R | S | B | Q | K | N | P |
|---|---|---|---|---|---|---|---|
| use | 1.53 | 0.40 | 1.09 | 1.65 | 2.55 | 1.48 | 0.52 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 108 | 90.0% |
| adjudicatedDraw | 4 | 3.3% |
| drawRepetition | 3 | 2.5% |
| drawMaterial | 2 | 1.7% |
| plyCap | 2 | 1.7% |
| draw50 | 1 | 0.8% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| P | 2946 | 602 | 1056 | 1920 | 843 | 43.9% |
| R | 2172 | 426 | 234 | 480 | 246 | 51.2% |
| K | 1815 | 135 | 0 | 240 | 240 | 100.0% |
| N | 1581 | 293 | 269 | 360 | 92 | 25.6% |
| B | 1555 | 362 | 353 | 480 | 127 | 26.5% |
| Q | 1174 | 288 | 181 | 240 | 77 | 32.1% |
| S | 142 | 28 | 40 | 120 | 80 | 66.7% |
| G | 8 | 0 | 1 | 0 | 1 | 0.0% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 0 | 0.00 |
| beastChainMoves | 24 | 0.20 |
| beastChainCaptures | 28 | 0.23 |
| maesterSwaps | 0 | 0.00 |
| maesterLongSwaps | 0 | 0.00 |
| paladinSacrifices | 0 | 0.00 |
| promotions | 21 | 0.17 |
| checks | 901 | 7.51 |

## Degeneracy counters
| counter | value |
|---|---|
| guard captures per game | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 3 (2.5%) |
| games where a king never moved | 19 (15.8%) |

## Interest terms, residualised on draw rate
Each term minus what this run's `term ~ a + b·drawRate` line predicts from the arrangement's draw
rate. The mean over the arrangements is 0 by construction, so read differences between pools, never
levels. Overall row, fitted on the 1 arrangements:
| killerMove | leadChange | uncertaintyLate | drama | permanence | fairyUse | excessDecisiveness | interest | interestMinFairy |
|---|---|---|---|---|---|---|---|---|
| 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

## Balance axis — back ranks by |white score − 0.5| (ascending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| RSBQKBNR vs RNBQKBNR | 120 | 60 | 12 | 48 | 0.550 | 0.466–0.634 | +35 ±43 | 90.0% | 8.3% | 1.7% | 94.9±50.2 | 0.27 | 0.005 | 0.594 | 0.07 | 0.97 | 0.40 | 0.40 | 0.000 | 0.346 | 0.346 | balance |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| RSBQKBNR vs RNBQKBNR | 120 | 60 | 12 | 48 | 0.550 | 0.466–0.634 | +35 ±43 | 90.0% | 8.3% | 1.7% | 94.9±50.2 | 0.27 | 0.005 | 0.594 | 0.07 | 0.97 | 0.40 | 0.40 | 0.000 | 0.346 | 0.346 | balance |

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
