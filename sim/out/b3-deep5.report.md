# Sim report — b3-deep5

2500 games. White score **0.530** (95% 0.516–0.543),
white advantage **+21 ± 9 Elo**.
Decisive 46.1% · draws 40.1% · capped 13.8% (counted apart, never as draws).
Plies: mean 159.2 ± 83.2, median 135. Rules: all defaults.

No complete colour-swapped pairs in this run.
σ_pg 0.3381 · normalized Elo +30 · LOS 100.0% ·
SPRT LLR 2.34 against ±2.94 (nElo 0 vs 4) → **continue**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 2500 | 650 | 1348 | 502 | 0.530 | 0.516–0.543 | +21 ±9 | 46.1% | 40.1% | 13.8% | 159.2±83.2 | 0.27 | 0.026 | 0.644 | 0.08 | 0.98 | 0.30 | 1.58 | 0.000 | 0.471 | 0.454 | timeouts |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | A | R | N | K | S | G | P | M | B | L | Q |
|---|---|---|---|---|---|---|---|---|---|---|---|
| use | 1.77 | 1.94 | 0.97 | 2.43 | 1.38 | 2.25 | 0.30 | 1.57 | 0.97 | 0.91 | 1.38 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 1152 | 46.1% |
| adjudicatedDraw | 780 | 31.2% |
| plyCap | 346 | 13.8% |
| draw50 | 95 | 3.8% |
| drawRepetition | 79 | 3.2% |
| drawMaterial | 48 | 1.9% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| G | 89409 | 4612 | 772 | 8000 | 7241 | 90.5% |
| K | 60406 | 4341 | 0 | 5000 | 5000 | 100.0% |
| P | 59930 | 10930 | 27371 | 40000 | 12160 | 30.4% |
| A | 44118 | 6597 | 2939 | 5000 | 2061 | 41.2% |
| R | 38648 | 3990 | 2190 | 4000 | 1810 | 45.3% |
| N | 24032 | 4830 | 4549 | 5000 | 454 | 9.1% |
| M | 23404 | 2247 | 2143 | 3000 | 857 | 28.6% |
| S | 20555 | 2370 | 1744 | 3000 | 1256 | 41.9% |
| B | 19272 | 3862 | 3287 | 4000 | 713 | 17.8% |
| Q | 13747 | 2492 | 1733 | 2000 | 718 | 35.9% |
| L | 4548 | 689 | 232 | 1000 | 81 | 8.1% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 6597 | 2.64 |
| beastChainMoves | 1888 | 0.76 |
| beastChainCaptures | 2370 | 0.95 |
| maesterSwaps | 10048 | 4.02 |
| maesterLongSwaps | 2088 | 0.84 |
| paladinSacrifices | 689 | 0.28 |
| promotions | 469 | 0.19 |
| checks | 21469 | 8.59 |

## Degeneracy counters
| counter | value |
|---|---|
| guard captures per game | 1.845 |
| games with a guard rampage (≥ 3 captures) | 4 (0.2%) |
| dead-material endings (draw50 + drawMaterial) | 143 (5.7%) |
| games where a king never moved | 307 (12.3%) |

## Interest terms, residualised on draw rate
Each term minus what this run's `term ~ a + b·drawRate` line predicts from the arrangement's draw
rate. The mean over the arrangements is 0 by construction, so read differences between pools, never
levels. Overall row, fitted on the 5 arrangements:
| killerMove | leadChange | uncertaintyLate | drama | permanence | fairyUse | excessDecisiveness | interest | interestMinFairy |
|---|---|---|---|---|---|---|---|---|
| -0.000 | 0.000 | 0.000 | -0.000 | 0.000 | 0.000 | 0.000 | 0.000 | -0.016 |

## Balance axis — back ranks by |white score − 0.5| (ascending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ARNAKSNG | 500 | 144 | 223 | 133 | 0.511 | 0.478–0.544 | +8 ±23 | 55.4% | 35.2% | 9.4% | 146.6±75.5 | 0.27 | 0.031 | 0.648 | 0.11 | 0.97 | 0.31 | 1.79 | 0.124 | 0.483 | 0.483 | timeouts |
| GRMGKNBB | 500 | 94 | 332 | 74 | 0.520 | 0.495–0.545 | +14 ±18 | 33.6% | 47.6% | 18.8% | 171.1±86.4 | 0.25 | 0.030 | 0.653 | 0.06 | 0.98 | 0.30 | 1.89 | -0.109 | 0.459 | 0.459 | timeouts |
| SKANSGGR | 500 | 120 | 292 | 88 | 0.532 | 0.504–0.560 | +22 ±20 | 41.6% | 42.2% | 16.2% | 165.6±86.2 | 0.25 | 0.023 | 0.649 | 0.09 | 0.98 | 0.28 | 1.76 | -0.049 | 0.468 | 0.468 | balance,timeouts |
| NAGQKGBM | 500 | 125 | 283 | 92 | 0.533 | 0.504–0.562 | +23 ±20 | 43.4% | 40.8% | 15.8% | 162.4±86.2 | 0.28 | 0.027 | 0.645 | 0.07 | 0.98 | 0.30 | 1.84 | -0.032 | 0.471 | 0.471 | balance,timeouts |
| BKMLQRGA | 500 | 167 | 218 | 115 | 0.552 | 0.519–0.585 | +36 ±23 | 56.4% | 34.6% | 9.0% | 150.5±78.6 | 0.28 | 0.021 | 0.627 | 0.08 | 0.98 | 0.31 | 1.76 | 0.066 | 0.475 | 0.468 | balance,timeouts |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ARNAKSNG | 500 | 144 | 223 | 133 | 0.511 | 0.478–0.544 | +8 ±23 | 55.4% | 35.2% | 9.4% | 146.6±75.5 | 0.27 | 0.031 | 0.648 | 0.11 | 0.97 | 0.31 | 1.79 | 0.124 | 0.483 | 0.483 | timeouts |
| BKMLQRGA | 500 | 167 | 218 | 115 | 0.552 | 0.519–0.585 | +36 ±23 | 56.4% | 34.6% | 9.0% | 150.5±78.6 | 0.28 | 0.021 | 0.627 | 0.08 | 0.98 | 0.31 | 1.76 | 0.066 | 0.475 | 0.468 | balance,timeouts |
| NAGQKGBM | 500 | 125 | 283 | 92 | 0.533 | 0.504–0.562 | +23 ±20 | 43.4% | 40.8% | 15.8% | 162.4±86.2 | 0.28 | 0.027 | 0.645 | 0.07 | 0.98 | 0.30 | 1.84 | -0.032 | 0.471 | 0.471 | balance,timeouts |
| SKANSGGR | 500 | 120 | 292 | 88 | 0.532 | 0.504–0.560 | +22 ±20 | 41.6% | 42.2% | 16.2% | 165.6±86.2 | 0.25 | 0.023 | 0.649 | 0.09 | 0.98 | 0.28 | 1.76 | -0.049 | 0.468 | 0.468 | balance,timeouts |
| GRMGKNBB | 500 | 94 | 332 | 74 | 0.520 | 0.495–0.545 | +14 ±18 | 33.6% | 47.6% | 18.8% | 171.1±86.4 | 0.25 | 0.030 | 0.653 | 0.06 | 0.98 | 0.30 | 1.89 | -0.109 | 0.459 | 0.459 | timeouts |

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
