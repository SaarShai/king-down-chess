# Sim report — b3-rule-base

2000 games. White score **0.533** (95% 0.516–0.550),
white advantage **+23 ± 12 Elo**.
Decisive 60.5% · draws 31.7% · capped 7.8% (counted apart, never as draws).
Plies: mean 141.5 ± 75.5, median 123. Rules: all defaults.

No complete colour-swapped pairs in this run.
σ_pg 0.3875 · normalized Elo +30 · LOS 100.0% ·
SPRT LLR 1.82 against ±2.94 (nElo 0 vs 4) → **continue**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 2000 | 671 | 790 | 539 | 0.533 | 0.516–0.550 | +23 ±12 | 60.5% | 31.7% | 7.8% | 141.5±75.5 | 0.29 | 0.023 | 0.628 | 0.08 | 0.98 | 0.33 | 1.69 | 0.002 | 0.474 | 0.474 | balance,timeouts |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | B | L | G | R | M | A | K | Q | P |
|---|---|---|---|---|---|---|---|---|---|
| use | 1.12 | 1.01 | 2.41 | 1.69 | 1.78 | 1.58 | 2.26 | 1.52 | 0.33 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 1210 | 60.5% |
| adjudicatedDraw | 506 | 25.3% |
| plyCap | 156 | 7.8% |
| drawRepetition | 70 | 3.5% |
| draw50 | 35 | 1.8% |
| drawMaterial | 23 | 1.1% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| P | 46693 | 8321 | 19521 | 32000 | 12000 | 37.5% |
| G | 42579 | 2369 | 329 | 4000 | 3680 | 92.0% |
| K | 39913 | 2569 | 0 | 4000 | 4000 | 100.0% |
| M | 31402 | 3193 | 2569 | 4000 | 1431 | 35.8% |
| R | 29979 | 3501 | 2272 | 4000 | 1729 | 43.2% |
| A | 27906 | 4022 | 2941 | 4000 | 1059 | 26.5% |
| Q | 26910 | 4453 | 3184 | 4000 | 1280 | 32.0% |
| B | 19782 | 3983 | 3232 | 4000 | 768 | 19.2% |
| L | 17825 | 2600 | 962 | 4000 | 439 | 11.0% |
| N | 5 | 0 | 1 | 0 | 3 | 0.0% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 4022 | 2.01 |
| beastChainMoves | 0 | 0.00 |
| beastChainCaptures | 0 | 0.00 |
| maesterSwaps | 12965 | 6.48 |
| maesterLongSwaps | 2353 | 1.18 |
| paladinSacrifices | 2600 | 1.30 |
| promotions | 479 | 0.24 |
| checks | 15693 | 7.85 |

## Degeneracy counters
| counter | value |
|---|---|
| guard captures per game | 1.185 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 58 (2.9%) |
| games where a king never moved | 392 (19.6%) |

## Interest terms, residualised on draw rate
Each term minus what this run's `term ~ a + b·drawRate` line predicts from the arrangement's draw
rate. The mean over the arrangements is 0 by construction, so read differences between pools, never
levels. Overall row, fitted on the 20 arrangements:
| killerMove | leadChange | uncertaintyLate | drama | permanence | fairyUse | excessDecisiveness | interest | interestMinFairy |
|---|---|---|---|---|---|---|---|---|
| 0.000 | 0.000 | -0.000 | -0.000 | -0.000 | 0.000 | 0.002 | 0.000 | 0.007 |

## Balance axis — back ranks by |white score − 0.5| (ascending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| GLRAMBQK | 100 | 29 | 43 | 28 | 0.505 | 0.431–0.579 | +3 ±51 | 57.0% | 35.0% | 8.0% | 145.0±74.1 | 0.27 | 0.024 | 0.633 | 0.08 | 0.98 | 0.32 | 1.59 | -0.022 | 0.470 | 0.457 | timeouts |
| GBRLQKMA | 100 | 31 | 39 | 30 | 0.505 | 0.428–0.582 | +3 ±53 | 61.0% | 34.0% | 5.0% | 127.4±64.0 | 0.25 | 0.034 | 0.638 | 0.09 | 0.98 | 0.37 | 1.64 | 0.018 | 0.467 | 0.464 | - |
| AMQLGKRB | 100 | 29 | 44 | 27 | 0.510 | 0.437–0.583 | +7 ±51 | 56.0% | 36.0% | 8.0% | 141.1±71.7 | 0.27 | 0.024 | 0.633 | 0.09 | 0.98 | 0.33 | 1.76 | -0.034 | 0.470 | 0.470 | timeouts |
| KGRMLBQA | 100 | 27 | 44 | 29 | 0.490 | 0.417–0.563 | -7 ±51 | 56.0% | 32.0% | 12.0% | 136.8±76.6 | 0.26 | 0.025 | 0.632 | 0.07 | 0.98 | 0.35 | 1.65 | -0.034 | 0.464 | 0.452 | timeouts |
| GMQRLKBA | 100 | 29 | 44 | 27 | 0.510 | 0.437–0.583 | +7 ±51 | 56.0% | 34.0% | 10.0% | 151.7±82.2 | 0.30 | 0.025 | 0.627 | 0.07 | 0.98 | 0.31 | 1.75 | -0.034 | 0.472 | 0.463 | timeouts |
| RKQBMLGA | 100 | 33 | 37 | 30 | 0.515 | 0.437–0.593 | +10 ±54 | 63.0% | 27.0% | 10.0% | 147.5±76.4 | 0.28 | 0.021 | 0.620 | 0.10 | 0.98 | 0.32 | 1.75 | 0.034 | 0.476 | 0.473 | timeouts |
| RBAGQKML | 100 | 34 | 35 | 31 | 0.515 | 0.436–0.594 | +10 ±55 | 65.0% | 27.0% | 8.0% | 138.8±70.7 | 0.29 | 0.017 | 0.622 | 0.07 | 0.98 | 0.33 | 1.67 | 0.054 | 0.476 | 0.451 | timeouts |
| AMQRBKGL | 100 | 34 | 36 | 30 | 0.520 | 0.442–0.598 | +14 ±54 | 64.0% | 30.0% | 6.0% | 143.8±73.7 | 0.30 | 0.024 | 0.630 | 0.10 | 0.98 | 0.33 | 1.77 | 0.042 | 0.480 | 0.480 | timeouts |
| QBALRGMK | 100 | 29 | 47 | 24 | 0.525 | 0.454–0.596 | +17 ±49 | 53.0% | 39.0% | 8.0% | 132.2±71.3 | 0.28 | 0.023 | 0.638 | 0.07 | 0.98 | 0.35 | 1.63 | -0.070 | 0.468 | 0.468 | timeouts |
| KQRBGAML | 100 | 37 | 32 | 31 | 0.530 | 0.449–0.611 | +21 ±56 | 68.0% | 27.0% | 5.0% | 147.9±78.2 | 0.32 | 0.020 | 0.618 | 0.10 | 0.97 | 0.32 | 1.71 | 0.078 | 0.486 | 0.476 | balance |
| AQRLMKBG | 100 | 30 | 31 | 39 | 0.455 | 0.374–0.536 | -31 ±56 | 69.0% | 25.0% | 6.0% | 138.9±74.1 | 0.31 | 0.023 | 0.622 | 0.11 | 0.98 | 0.35 | 1.66 | 0.082 | 0.486 | 0.486 | balance,timeouts |
| BLGRMAKQ | 100 | 35 | 39 | 26 | 0.545 | 0.469–0.621 | +31 ±53 | 61.0% | 33.0% | 6.0% | 138.8±77.3 | 0.27 | 0.026 | 0.627 | 0.09 | 0.98 | 0.35 | 1.72 | 0.002 | 0.470 | 0.462 | balance,timeouts |
| MGABKQRL | 100 | 36 | 38 | 26 | 0.550 | 0.473–0.627 | +35 ±53 | 62.0% | 29.0% | 9.0% | 147.2±77.9 | 0.31 | 0.025 | 0.621 | 0.09 | 0.98 | 0.31 | 1.73 | 0.010 | 0.479 | 0.479 | balance,timeouts |
| QARLMGBK | 100 | 34 | 43 | 23 | 0.555 | 0.482–0.628 | +38 ±51 | 57.0% | 39.0% | 4.0% | 125.5±69.6 | 0.27 | 0.029 | 0.652 | 0.07 | 0.98 | 0.37 | 1.72 | -0.042 | 0.469 | 0.469 | balance |
| MABLGKQR | 100 | 34 | 43 | 23 | 0.555 | 0.482–0.628 | +38 ±51 | 57.0% | 33.0% | 10.0% | 155.8±77.6 | 0.29 | 0.024 | 0.622 | 0.08 | 0.98 | 0.31 | 1.73 | -0.042 | 0.471 | 0.454 | balance,timeouts |
| BGAMLRQK | 100 | 39 | 34 | 27 | 0.560 | 0.481–0.639 | +42 ±55 | 66.0% | 29.0% | 5.0% | 127.8±68.9 | 0.32 | 0.023 | 0.624 | 0.08 | 0.98 | 0.35 | 1.69 | 0.047 | 0.482 | 0.482 | balance |
| KALBMQGR | 100 | 33 | 47 | 20 | 0.565 | 0.495–0.635 | +45 ±49 | 53.0% | 35.0% | 12.0% | 161.0±86.5 | 0.28 | 0.020 | 0.621 | 0.08 | 0.98 | 0.30 | 1.69 | -0.085 | 0.465 | 0.465 | balance,timeouts |
| LGMQBAKR | 100 | 37 | 40 | 23 | 0.570 | 0.495–0.645 | +49 ±52 | 60.0% | 32.0% | 8.0% | 140.3±76.4 | 0.29 | 0.020 | 0.630 | 0.08 | 0.98 | 0.32 | 1.63 | -0.017 | 0.473 | 0.473 | balance,timeouts |
| LQBGAMKR | 100 | 36 | 43 | 21 | 0.575 | 0.502–0.648 | +53 ±50 | 57.0% | 34.0% | 9.0% | 145.5±73.5 | 0.28 | 0.019 | 0.635 | 0.10 | 0.98 | 0.31 | 1.64 | -0.049 | 0.472 | 0.443 | balance,timeouts |
| AMRGQBKL | 100 | 45 | 31 | 24 | 0.605 | 0.526–0.684 | +74 ±55 | 69.0% | 24.0% | 7.0% | 137.1±75.9 | 0.30 | 0.019 | 0.606 | 0.08 | 0.98 | 0.34 | 1.69 | 0.059 | 0.477 | 0.477 | balance,timeouts |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| KQRBGAML | 100 | 37 | 32 | 31 | 0.530 | 0.449–0.611 | +21 ±56 | 68.0% | 27.0% | 5.0% | 147.9±78.2 | 0.32 | 0.020 | 0.618 | 0.10 | 0.97 | 0.32 | 1.71 | 0.078 | 0.486 | 0.476 | balance |
| AQRLMKBG | 100 | 30 | 31 | 39 | 0.455 | 0.374–0.536 | -31 ±56 | 69.0% | 25.0% | 6.0% | 138.9±74.1 | 0.31 | 0.023 | 0.622 | 0.11 | 0.98 | 0.35 | 1.66 | 0.082 | 0.486 | 0.486 | balance,timeouts |
| BGAMLRQK | 100 | 39 | 34 | 27 | 0.560 | 0.481–0.639 | +42 ±55 | 66.0% | 29.0% | 5.0% | 127.8±68.9 | 0.32 | 0.023 | 0.624 | 0.08 | 0.98 | 0.35 | 1.69 | 0.047 | 0.482 | 0.482 | balance |
| AMQRBKGL | 100 | 34 | 36 | 30 | 0.520 | 0.442–0.598 | +14 ±54 | 64.0% | 30.0% | 6.0% | 143.8±73.7 | 0.30 | 0.024 | 0.630 | 0.10 | 0.98 | 0.33 | 1.77 | 0.042 | 0.480 | 0.480 | timeouts |
| MGABKQRL | 100 | 36 | 38 | 26 | 0.550 | 0.473–0.627 | +35 ±53 | 62.0% | 29.0% | 9.0% | 147.2±77.9 | 0.31 | 0.025 | 0.621 | 0.09 | 0.98 | 0.31 | 1.73 | 0.010 | 0.479 | 0.479 | balance,timeouts |
| AMRGQBKL | 100 | 45 | 31 | 24 | 0.605 | 0.526–0.684 | +74 ±55 | 69.0% | 24.0% | 7.0% | 137.1±75.9 | 0.30 | 0.019 | 0.606 | 0.08 | 0.98 | 0.34 | 1.69 | 0.059 | 0.477 | 0.477 | balance,timeouts |
| RBAGQKML | 100 | 34 | 35 | 31 | 0.515 | 0.436–0.594 | +10 ±55 | 65.0% | 27.0% | 8.0% | 138.8±70.7 | 0.29 | 0.017 | 0.622 | 0.07 | 0.98 | 0.33 | 1.67 | 0.054 | 0.476 | 0.451 | timeouts |
| RKQBMLGA | 100 | 33 | 37 | 30 | 0.515 | 0.437–0.593 | +10 ±54 | 63.0% | 27.0% | 10.0% | 147.5±76.4 | 0.28 | 0.021 | 0.620 | 0.10 | 0.98 | 0.32 | 1.75 | 0.034 | 0.476 | 0.473 | timeouts |
| LGMQBAKR | 100 | 37 | 40 | 23 | 0.570 | 0.495–0.645 | +49 ±52 | 60.0% | 32.0% | 8.0% | 140.3±76.4 | 0.29 | 0.020 | 0.630 | 0.08 | 0.98 | 0.32 | 1.63 | -0.017 | 0.473 | 0.473 | balance,timeouts |
| LQBGAMKR | 100 | 36 | 43 | 21 | 0.575 | 0.502–0.648 | +53 ±50 | 57.0% | 34.0% | 9.0% | 145.5±73.5 | 0.28 | 0.019 | 0.635 | 0.10 | 0.98 | 0.31 | 1.64 | -0.049 | 0.472 | 0.443 | balance,timeouts |
| GMQRLKBA | 100 | 29 | 44 | 27 | 0.510 | 0.437–0.583 | +7 ±51 | 56.0% | 34.0% | 10.0% | 151.7±82.2 | 0.30 | 0.025 | 0.627 | 0.07 | 0.98 | 0.31 | 1.75 | -0.034 | 0.472 | 0.463 | timeouts |
| MABLGKQR | 100 | 34 | 43 | 23 | 0.555 | 0.482–0.628 | +38 ±51 | 57.0% | 33.0% | 10.0% | 155.8±77.6 | 0.29 | 0.024 | 0.622 | 0.08 | 0.98 | 0.31 | 1.73 | -0.042 | 0.471 | 0.454 | balance,timeouts |
| BLGRMAKQ | 100 | 35 | 39 | 26 | 0.545 | 0.469–0.621 | +31 ±53 | 61.0% | 33.0% | 6.0% | 138.8±77.3 | 0.27 | 0.026 | 0.627 | 0.09 | 0.98 | 0.35 | 1.72 | 0.002 | 0.470 | 0.462 | balance,timeouts |
| GLRAMBQK | 100 | 29 | 43 | 28 | 0.505 | 0.431–0.579 | +3 ±51 | 57.0% | 35.0% | 8.0% | 145.0±74.1 | 0.27 | 0.024 | 0.633 | 0.08 | 0.98 | 0.32 | 1.59 | -0.022 | 0.470 | 0.457 | timeouts |
| AMQLGKRB | 100 | 29 | 44 | 27 | 0.510 | 0.437–0.583 | +7 ±51 | 56.0% | 36.0% | 8.0% | 141.1±71.7 | 0.27 | 0.024 | 0.633 | 0.09 | 0.98 | 0.33 | 1.76 | -0.034 | 0.470 | 0.470 | timeouts |
| QARLMGBK | 100 | 34 | 43 | 23 | 0.555 | 0.482–0.628 | +38 ±51 | 57.0% | 39.0% | 4.0% | 125.5±69.6 | 0.27 | 0.029 | 0.652 | 0.07 | 0.98 | 0.37 | 1.72 | -0.042 | 0.469 | 0.469 | balance |
| QBALRGMK | 100 | 29 | 47 | 24 | 0.525 | 0.454–0.596 | +17 ±49 | 53.0% | 39.0% | 8.0% | 132.2±71.3 | 0.28 | 0.023 | 0.638 | 0.07 | 0.98 | 0.35 | 1.63 | -0.070 | 0.468 | 0.468 | timeouts |
| GBRLQKMA | 100 | 31 | 39 | 30 | 0.505 | 0.428–0.582 | +3 ±53 | 61.0% | 34.0% | 5.0% | 127.4±64.0 | 0.25 | 0.034 | 0.638 | 0.09 | 0.98 | 0.37 | 1.64 | 0.018 | 0.467 | 0.464 | - |
| KALBMQGR | 100 | 33 | 47 | 20 | 0.565 | 0.495–0.635 | +45 ±49 | 53.0% | 35.0% | 12.0% | 161.0±86.5 | 0.28 | 0.020 | 0.621 | 0.08 | 0.98 | 0.30 | 1.69 | -0.085 | 0.465 | 0.465 | balance,timeouts |
| KGRMLBQA | 100 | 27 | 44 | 29 | 0.490 | 0.417–0.563 | -7 ±51 | 56.0% | 32.0% | 12.0% | 136.8±76.6 | 0.26 | 0.025 | 0.632 | 0.07 | 0.98 | 0.35 | 1.65 | -0.034 | 0.464 | 0.452 | timeouts |

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
