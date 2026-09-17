# Sim report — values-d5.A

120 games. White score **0.533** (95% 0.449–0.618),
white advantage **+23 ± 48 Elo**.
Decisive 90.0% · draws 10.0% · capped 0.0% (counted apart, never as draws).
Plies: mean 95.2 ± 42.5, median 86. Rules: all defaults.

Pentanomial over 60 colour-swapped pairs: [25, 8, 23, 2, 2] (LL, LD, DD/WL, WD, WW).
σ_pg 0.3898 · normalized Elo -193 · LOS 0.0% ·
SPRT LLR -0.59 against ±2.94 (nElo 0 vs 4) → **continue**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 120 | 58 | 12 | 50 | 0.533 | 0.449–0.618 | +23 ±48 | 90.0% | 10.0% | 0.0% | 95.2±42.5 | 0.30 | 0.006 | 0.588 | 0.11 | 0.97 | 0.53 | 1.46 | 0.000 | 0.478 | 0.478 | balance |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | R | A | B | Q | K | N | P |
|---|---|---|---|---|---|---|---|
| use | 1.33 | 1.46 | 1.12 | 1.48 | 2.48 | 1.44 | 0.53 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 108 | 90.0% |
| adjudicatedDraw | 8 | 6.7% |
| drawMaterial | 2 | 1.7% |
| draw50 | 2 | 1.7% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| P | 3039 | 665 | 1120 | 1920 | 772 | 40.2% |
| R | 1899 | 393 | 244 | 480 | 236 | 49.2% |
| K | 1771 | 164 | 0 | 240 | 240 | 100.0% |
| B | 1592 | 352 | 359 | 480 | 121 | 25.2% |
| N | 1544 | 310 | 293 | 360 | 68 | 18.9% |
| Q | 1055 | 271 | 183 | 240 | 83 | 34.6% |
| A | 521 | 85 | 40 | 120 | 80 | 66.7% |
| G | 0 | 0 | 1 | 0 | 0 | 0.0% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 85 | 0.71 |
| beastChainMoves | 0 | 0.00 |
| beastChainCaptures | 0 | 0.00 |
| maesterSwaps | 0 | 0.00 |
| maesterLongSwaps | 0 | 0.00 |
| paladinSacrifices | 0 | 0.00 |
| promotions | 28 | 0.23 |
| checks | 865 | 7.21 |

## Degeneracy counters
| counter | value |
|---|---|
| guard captures per game | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 4 (3.3%) |
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
| RABQKBNR vs RNBQKBNR | 120 | 58 | 12 | 50 | 0.533 | 0.449–0.618 | +23 ±48 | 90.0% | 10.0% | 0.0% | 95.2±42.5 | 0.30 | 0.006 | 0.588 | 0.11 | 0.97 | 0.53 | 1.46 | 0.000 | 0.478 | 0.478 | balance |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| RABQKBNR vs RNBQKBNR | 120 | 58 | 12 | 50 | 0.533 | 0.449–0.618 | +23 ±48 | 90.0% | 10.0% | 0.0% | 95.2±42.5 | 0.30 | 0.006 | 0.588 | 0.11 | 0.97 | 0.53 | 1.46 | 0.000 | 0.478 | 0.478 | balance |

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
