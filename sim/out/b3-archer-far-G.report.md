# Sim report — b3-archer-far-G

3200 games. White score **0.510** (95% 0.499–0.522),
white advantage **+7 ± 8 Elo**.
Decisive 43.8% · draws 41.7% · capped 14.5% (counted apart, never as draws).
Plies: mean 153.3 ± 87.0, median 123. Rules: all defaults.

No complete colour-swapped pairs in this run.
σ_pg 0.3309 · normalized Elo +11 · LOS 95.9% ·
SPRT LLR 0.92 against ±2.94 (nElo 0 vs 4) → **continue**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 3200 | 734 | 1797 | 669 | 0.510 | 0.499–0.522 | +7 ±8 | 43.8% | 41.7% | 14.5% | 153.3±87.0 | 0.29 | 0.025 | 0.642 | 0.08 | 0.98 | 0.29 | 1.90 | -0.004 | 0.475 | 0.475 | timeouts |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | B | G | R | Q | K | A | P |
|---|---|---|---|---|---|---|---|
| use | 1.13 | 2.05 | 1.64 | 1.36 | 1.98 | 1.76 | 0.29 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 1403 | 43.8% |
| adjudicatedDraw | 1007 | 31.5% |
| plyCap | 463 | 14.5% |
| draw50 | 160 | 5.0% |
| drawRepetition | 122 | 3.8% |
| drawMaterial | 45 | 1.4% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| G | 125433 | 6192 | 708 | 12800 | 12098 | 94.5% |
| A | 107839 | 14585 | 6027 | 12800 | 6773 | 52.9% |
| P | 69974 | 12912 | 36622 | 51200 | 14312 | 28.0% |
| K | 60621 | 3216 | 0 | 6400 | 6400 | 100.0% |
| R | 50394 | 5245 | 3542 | 6400 | 2858 | 44.7% |
| Q | 41791 | 7969 | 5039 | 6400 | 1619 | 25.3% |
| B | 34527 | 6603 | 4783 | 6400 | 1617 | 25.3% |
| N | 0 | 0 | 1 | 0 | 1 | 0.0% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 14585 | 4.56 |
| beastChainMoves | 0 | 0.00 |
| beastChainCaptures | 0 | 0.00 |
| maesterSwaps | 0 | 0.00 |
| maesterLongSwaps | 0 | 0.00 |
| paladinSacrifices | 0 | 0.00 |
| promotions | 266 | 0.08 |
| checks | 28853 | 9.02 |

## Degeneracy counters
| counter | value |
|---|---|
| guard captures per game | 1.935 |
| games with a guard rampage (≥ 3 captures) | 1 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 205 (6.4%) |
| games where a king never moved | 515 (16.1%) |

## Interest terms, residualised on draw rate
Each term minus what this run's `term ~ a + b·drawRate` line predicts from the arrangement's draw
rate. The mean over the arrangements is 0 by construction, so read differences between pools, never
levels. Overall row, fitted on the 20 arrangements:
| killerMove | leadChange | uncertaintyLate | drama | permanence | fairyUse | excessDecisiveness | interest | interestMinFairy |
|---|---|---|---|---|---|---|---|---|
| 0.000 | 0.000 | 0.000 | -0.000 | -0.000 | 0.000 | -0.004 | -0.000 | -0.000 |

## Balance axis — back ranks by |white score − 0.5| (ascending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| GBRAQGKA | 160 | 33 | 93 | 34 | 0.497 | 0.447–0.547 | -2 ±35 | 41.9% | 43.1% | 15.0% | 158.7±87.4 | 0.31 | 0.023 | 0.633 | 0.08 | 0.98 | 0.28 | 1.96 | -0.027 | 0.476 | 0.476 | timeouts |
| RGGQABAK | 160 | 43 | 73 | 44 | 0.497 | 0.440–0.554 | -2 ±40 | 54.4% | 35.0% | 10.6% | 132.5±87.2 | 0.33 | 0.028 | 0.638 | 0.10 | 0.97 | 0.31 | 1.89 | 0.098 | 0.491 | 0.491 | timeouts |
| KQGGRAAB | 160 | 33 | 96 | 31 | 0.506 | 0.457–0.555 | +4 ±34 | 40.0% | 45.0% | 15.0% | 156.1±87.6 | 0.27 | 0.022 | 0.640 | 0.07 | 0.98 | 0.28 | 1.96 | -0.044 | 0.469 | 0.469 | timeouts |
| GQKGRABA | 160 | 44 | 74 | 42 | 0.506 | 0.449–0.563 | +4 ±39 | 53.8% | 32.5% | 13.8% | 157.2±87.3 | 0.32 | 0.025 | 0.634 | 0.11 | 0.97 | 0.28 | 1.88 | 0.093 | 0.489 | 0.489 | timeouts |
| BGRGQKAA | 160 | 34 | 95 | 31 | 0.509 | 0.460–0.559 | +7 ±34 | 40.6% | 43.1% | 16.3% | 158.4±87.5 | 0.27 | 0.026 | 0.639 | 0.08 | 0.98 | 0.28 | 1.93 | -0.036 | 0.469 | 0.469 | timeouts |
| QGGBKRAA | 160 | 39 | 85 | 36 | 0.509 | 0.456–0.562 | +7 ±37 | 46.9% | 44.4% | 8.8% | 148.8±79.9 | 0.30 | 0.023 | 0.641 | 0.08 | 0.97 | 0.30 | 1.76 | 0.026 | 0.479 | 0.479 | timeouts |
| RAABKQGG | 160 | 31 | 95 | 34 | 0.491 | 0.441–0.540 | -7 ±34 | 40.6% | 42.5% | 16.9% | 156.3±88.1 | 0.31 | 0.023 | 0.645 | 0.08 | 0.97 | 0.27 | 1.81 | -0.036 | 0.478 | 0.478 | timeouts |
| GKQBGRAA | 160 | 30 | 104 | 26 | 0.512 | 0.467–0.558 | +9 ±32 | 35.0% | 49.4% | 15.6% | 153.5±84.9 | 0.23 | 0.021 | 0.654 | 0.06 | 0.98 | 0.29 | 1.93 | -0.091 | 0.458 | 0.458 | timeouts,drawRate |
| AKBGQGRA | 160 | 31 | 94 | 35 | 0.487 | 0.438–0.537 | -9 ±35 | 41.3% | 41.9% | 16.9% | 167.2±86.0 | 0.29 | 0.023 | 0.647 | 0.09 | 0.98 | 0.27 | 1.98 | -0.028 | 0.476 | 0.476 | timeouts |
| KGBQAARG | 160 | 32 | 101 | 27 | 0.516 | 0.469–0.563 | +11 ±33 | 36.9% | 45.6% | 17.5% | 156.3±89.6 | 0.28 | 0.025 | 0.659 | 0.06 | 0.98 | 0.28 | 2.00 | -0.070 | 0.469 | 0.469 | timeouts |
| ARKBAQGG | 160 | 41 | 83 | 36 | 0.516 | 0.462–0.569 | +11 ±37 | 48.1% | 41.9% | 10.0% | 144.4±82.3 | 0.30 | 0.027 | 0.647 | 0.08 | 0.97 | 0.31 | 1.80 | 0.042 | 0.481 | 0.481 | timeouts |
| KGBAAQRG | 160 | 34 | 97 | 29 | 0.516 | 0.467–0.564 | +11 ±34 | 39.4% | 43.1% | 17.5% | 154.8±88.3 | 0.25 | 0.024 | 0.643 | 0.07 | 0.98 | 0.28 | 1.91 | -0.045 | 0.463 | 0.463 | timeouts |
| GQAKGRAB | 160 | 36 | 83 | 41 | 0.484 | 0.431–0.538 | -11 ±37 | 48.1% | 38.8% | 13.1% | 152.0±84.4 | 0.28 | 0.028 | 0.637 | 0.09 | 0.98 | 0.29 | 1.89 | 0.042 | 0.476 | 0.476 | timeouts |
| GRAKGBAQ | 160 | 41 | 85 | 34 | 0.522 | 0.469–0.575 | +15 ±37 | 46.9% | 40.6% | 12.5% | 159.1±83.8 | 0.29 | 0.018 | 0.633 | 0.09 | 0.98 | 0.27 | 1.86 | 0.033 | 0.478 | 0.478 | timeouts |
| BAKQGGRA | 160 | 29 | 94 | 37 | 0.475 | 0.425–0.525 | -17 ±34 | 41.3% | 43.1% | 15.6% | 152.3±91.0 | 0.27 | 0.028 | 0.635 | 0.07 | 0.97 | 0.29 | 1.92 | -0.022 | 0.468 | 0.468 | timeouts |
| QGRGKABA | 160 | 37 | 94 | 29 | 0.525 | 0.475–0.575 | +17 ±34 | 41.3% | 45.0% | 13.8% | 157.4±87.0 | 0.28 | 0.026 | 0.639 | 0.08 | 0.98 | 0.28 | 1.96 | -0.022 | 0.472 | 0.472 | timeouts |
| GGBRAQAK | 160 | 42 | 85 | 33 | 0.528 | 0.475–0.581 | +20 ±37 | 46.9% | 41.3% | 11.9% | 135.4±86.1 | 0.30 | 0.029 | 0.655 | 0.09 | 0.97 | 0.31 | 1.86 | 0.036 | 0.482 | 0.482 | timeouts |
| RAAQGKGB | 160 | 42 | 85 | 33 | 0.528 | 0.475–0.581 | +20 ±37 | 46.9% | 37.5% | 15.6% | 162.1±85.7 | 0.30 | 0.023 | 0.640 | 0.08 | 0.98 | 0.26 | 1.98 | 0.036 | 0.480 | 0.480 | timeouts |
| KGRAABQG | 160 | 42 | 86 | 32 | 0.531 | 0.479–0.584 | +22 ±36 | 46.3% | 36.9% | 16.9% | 146.6±86.3 | 0.32 | 0.024 | 0.651 | 0.09 | 0.97 | 0.29 | 1.87 | 0.032 | 0.485 | 0.485 | balance,timeouts |
| GQGBAKRA | 160 | 40 | 95 | 25 | 0.547 | 0.498–0.596 | +33 ±34 | 40.6% | 43.1% | 16.3% | 157.0±90.9 | 0.29 | 0.024 | 0.641 | 0.07 | 0.97 | 0.28 | 1.87 | -0.016 | 0.473 | 0.473 | balance,timeouts |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| RGGQABAK | 160 | 43 | 73 | 44 | 0.497 | 0.440–0.554 | -2 ±40 | 54.4% | 35.0% | 10.6% | 132.5±87.2 | 0.33 | 0.028 | 0.638 | 0.10 | 0.97 | 0.31 | 1.89 | 0.098 | 0.491 | 0.491 | timeouts |
| GQKGRABA | 160 | 44 | 74 | 42 | 0.506 | 0.449–0.563 | +4 ±39 | 53.8% | 32.5% | 13.8% | 157.2±87.3 | 0.32 | 0.025 | 0.634 | 0.11 | 0.97 | 0.28 | 1.88 | 0.093 | 0.489 | 0.489 | timeouts |
| KGRAABQG | 160 | 42 | 86 | 32 | 0.531 | 0.479–0.584 | +22 ±36 | 46.3% | 36.9% | 16.9% | 146.6±86.3 | 0.32 | 0.024 | 0.651 | 0.09 | 0.97 | 0.29 | 1.87 | 0.032 | 0.485 | 0.485 | balance,timeouts |
| GGBRAQAK | 160 | 42 | 85 | 33 | 0.528 | 0.475–0.581 | +20 ±37 | 46.9% | 41.3% | 11.9% | 135.4±86.1 | 0.30 | 0.029 | 0.655 | 0.09 | 0.97 | 0.31 | 1.86 | 0.036 | 0.482 | 0.482 | timeouts |
| ARKBAQGG | 160 | 41 | 83 | 36 | 0.516 | 0.462–0.569 | +11 ±37 | 48.1% | 41.9% | 10.0% | 144.4±82.3 | 0.30 | 0.027 | 0.647 | 0.08 | 0.97 | 0.31 | 1.80 | 0.042 | 0.481 | 0.481 | timeouts |
| RAAQGKGB | 160 | 42 | 85 | 33 | 0.528 | 0.475–0.581 | +20 ±37 | 46.9% | 37.5% | 15.6% | 162.1±85.7 | 0.30 | 0.023 | 0.640 | 0.08 | 0.98 | 0.26 | 1.98 | 0.036 | 0.480 | 0.480 | timeouts |
| QGGBKRAA | 160 | 39 | 85 | 36 | 0.509 | 0.456–0.562 | +7 ±37 | 46.9% | 44.4% | 8.8% | 148.8±79.9 | 0.30 | 0.023 | 0.641 | 0.08 | 0.97 | 0.30 | 1.76 | 0.026 | 0.479 | 0.479 | timeouts |
| RAABKQGG | 160 | 31 | 95 | 34 | 0.491 | 0.441–0.540 | -7 ±34 | 40.6% | 42.5% | 16.9% | 156.3±88.1 | 0.31 | 0.023 | 0.645 | 0.08 | 0.97 | 0.27 | 1.81 | -0.036 | 0.478 | 0.478 | timeouts |
| GRAKGBAQ | 160 | 41 | 85 | 34 | 0.522 | 0.469–0.575 | +15 ±37 | 46.9% | 40.6% | 12.5% | 159.1±83.8 | 0.29 | 0.018 | 0.633 | 0.09 | 0.98 | 0.27 | 1.86 | 0.033 | 0.478 | 0.478 | timeouts |
| GQAKGRAB | 160 | 36 | 83 | 41 | 0.484 | 0.431–0.538 | -11 ±37 | 48.1% | 38.8% | 13.1% | 152.0±84.4 | 0.28 | 0.028 | 0.637 | 0.09 | 0.98 | 0.29 | 1.89 | 0.042 | 0.476 | 0.476 | timeouts |
| AKBGQGRA | 160 | 31 | 94 | 35 | 0.487 | 0.438–0.537 | -9 ±35 | 41.3% | 41.9% | 16.9% | 167.2±86.0 | 0.29 | 0.023 | 0.647 | 0.09 | 0.98 | 0.27 | 1.98 | -0.028 | 0.476 | 0.476 | timeouts |
| GBRAQGKA | 160 | 33 | 93 | 34 | 0.497 | 0.447–0.547 | -2 ±35 | 41.9% | 43.1% | 15.0% | 158.7±87.4 | 0.31 | 0.023 | 0.633 | 0.08 | 0.98 | 0.28 | 1.96 | -0.027 | 0.476 | 0.476 | timeouts |
| GQGBAKRA | 160 | 40 | 95 | 25 | 0.547 | 0.498–0.596 | +33 ±34 | 40.6% | 43.1% | 16.3% | 157.0±90.9 | 0.29 | 0.024 | 0.641 | 0.07 | 0.97 | 0.28 | 1.87 | -0.016 | 0.473 | 0.473 | balance,timeouts |
| QGRGKABA | 160 | 37 | 94 | 29 | 0.525 | 0.475–0.575 | +17 ±34 | 41.3% | 45.0% | 13.8% | 157.4±87.0 | 0.28 | 0.026 | 0.639 | 0.08 | 0.98 | 0.28 | 1.96 | -0.022 | 0.472 | 0.472 | timeouts |
| KGBQAARG | 160 | 32 | 101 | 27 | 0.516 | 0.469–0.563 | +11 ±33 | 36.9% | 45.6% | 17.5% | 156.3±89.6 | 0.28 | 0.025 | 0.659 | 0.06 | 0.98 | 0.28 | 2.00 | -0.070 | 0.469 | 0.469 | timeouts |
| BGRGQKAA | 160 | 34 | 95 | 31 | 0.509 | 0.460–0.559 | +7 ±34 | 40.6% | 43.1% | 16.3% | 158.4±87.5 | 0.27 | 0.026 | 0.639 | 0.08 | 0.98 | 0.28 | 1.93 | -0.036 | 0.469 | 0.469 | timeouts |
| KQGGRAAB | 160 | 33 | 96 | 31 | 0.506 | 0.457–0.555 | +4 ±34 | 40.0% | 45.0% | 15.0% | 156.1±87.6 | 0.27 | 0.022 | 0.640 | 0.07 | 0.98 | 0.28 | 1.96 | -0.044 | 0.469 | 0.469 | timeouts |
| BAKQGGRA | 160 | 29 | 94 | 37 | 0.475 | 0.425–0.525 | -17 ±34 | 41.3% | 43.1% | 15.6% | 152.3±91.0 | 0.27 | 0.028 | 0.635 | 0.07 | 0.97 | 0.29 | 1.92 | -0.022 | 0.468 | 0.468 | timeouts |
| KGBAAQRG | 160 | 34 | 97 | 29 | 0.516 | 0.467–0.564 | +11 ±34 | 39.4% | 43.1% | 17.5% | 154.8±88.3 | 0.25 | 0.024 | 0.643 | 0.07 | 0.98 | 0.28 | 1.91 | -0.045 | 0.463 | 0.463 | timeouts |
| GKQBGRAA | 160 | 30 | 104 | 26 | 0.512 | 0.467–0.558 | +9 ±32 | 35.0% | 49.4% | 15.6% | 153.5±84.9 | 0.23 | 0.021 | 0.654 | 0.06 | 0.98 | 0.29 | 1.93 | -0.091 | 0.458 | 0.458 | timeouts,drawRate |

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
