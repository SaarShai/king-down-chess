# Sim report — values-d5.G

120 games. White score **0.517** (95% 0.432–0.601),
white advantage **+12 ± 42 Elo**.
Decisive 90.0% · draws 10.0% · capped 0.0% (counted apart, never as draws).
Plies: mean 94.7 ± 41.7, median 90. Rules: all defaults.

Pentanomial over 60 colour-swapped pairs: [34, 11, 13, 1, 1] (LL, LD, DD/WL, WD, WW).
σ_pg 0.3408 · normalized Elo -323 · LOS 0.0% ·
SPRT LLR -0.69 against ±2.94 (nElo 0 vs 4) → **continue**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 120 | 56 | 12 | 52 | 0.517 | 0.432–0.601 | +12 ±42 | 90.0% | 10.0% | 0.0% | 94.7±41.7 | 0.28 | 0.006 | 0.587 | 0.08 | 0.97 | 0.55 | 1.24 | 0.000 | 0.468 | 0.468 | - |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | R | G | B | Q | K | N | P |
|---|---|---|---|---|---|---|---|
| use | 1.58 | 1.24 | 1.07 | 1.45 | 2.15 | 1.40 | 0.55 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 108 | 90.0% |
| adjudicatedDraw | 6 | 5.0% |
| drawRepetition | 3 | 2.5% |
| drawMaterial | 2 | 1.7% |
| draw50 | 1 | 0.8% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| P | 3102 | 664 | 1162 | 1920 | 735 | 38.3% |
| R | 2240 | 426 | 226 | 480 | 254 | 52.9% |
| K | 1530 | 134 | 0 | 240 | 240 | 100.0% |
| B | 1525 | 376 | 345 | 480 | 135 | 28.1% |
| N | 1491 | 300 | 266 | 360 | 94 | 26.1% |
| Q | 1033 | 305 | 197 | 240 | 62 | 25.8% |
| G | 440 | 0 | 9 | 120 | 115 | 95.8% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 0 | 0.00 |
| beastChainMoves | 0 | 0.00 |
| beastChainCaptures | 0 | 0.00 |
| maesterSwaps | 0 | 0.00 |
| maesterLongSwaps | 0 | 0.00 |
| paladinSacrifices | 0 | 0.00 |
| promotions | 23 | 0.19 |
| checks | 839 | 6.99 |

## Degeneracy counters
| counter | value |
|---|---|
| guard captures per game | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 3 (2.5%) |
| games where a king never moved | 21 (17.5%) |

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
| RGBQKBNR vs RNBQKBNR | 120 | 56 | 12 | 52 | 0.517 | 0.432–0.601 | +12 ±42 | 90.0% | 10.0% | 0.0% | 94.7±41.7 | 0.28 | 0.006 | 0.587 | 0.08 | 0.97 | 0.55 | 1.24 | 0.000 | 0.468 | 0.468 | - |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| RGBQKBNR vs RNBQKBNR | 120 | 56 | 12 | 52 | 0.517 | 0.432–0.601 | +12 ±42 | 90.0% | 10.0% | 0.0% | 94.7±41.7 | 0.28 | 0.006 | 0.587 | 0.08 | 0.97 | 0.55 | 1.24 | 0.000 | 0.468 | 0.468 | - |

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
