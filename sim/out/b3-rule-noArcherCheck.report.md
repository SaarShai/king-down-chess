# Sim report — b3-rule-noArcherCheck

2000 games. White score **0.531** (95% 0.515–0.548),
white advantage **+22 ± 12 Elo**.
Decisive 58.1% · draws 34.3% · capped 7.6% (counted apart, never as draws).
Plies: mean 144.9 ± 76.4, median 128. Rules changed from the defaults: `archerChecks=false`.

No complete colour-swapped pairs in this run.
σ_pg 0.3798 · normalized Elo +29 · LOS 100.0% ·
SPRT LLR 1.77 against ±2.94 (nElo 0 vs 4) → **continue**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 2000 | 644 | 838 | 518 | 0.531 | 0.515–0.548 | +22 ±12 | 58.1% | 34.3% | 7.6% | 144.9±76.4 | 0.28 | 0.023 | 0.629 | 0.09 | 0.98 | 0.33 | 1.68 | 0.009 | 0.474 | 0.473 | balance,timeouts |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | B | L | G | R | M | A | K | Q | P |
|---|---|---|---|---|---|---|---|---|---|
| use | 1.09 | 0.99 | 2.45 | 1.74 | 1.76 | 1.51 | 2.33 | 1.51 | 0.33 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 1162 | 58.1% |
| adjudicatedDraw | 541 | 27.1% |
| plyCap | 152 | 7.6% |
| drawRepetition | 75 | 3.8% |
| draw50 | 41 | 2.1% |
| drawMaterial | 29 | 1.5% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| P | 47309 | 8378 | 19870 | 32000 | 11594 | 36.2% |
| G | 44374 | 2416 | 373 | 4000 | 3646 | 91.1% |
| K | 42273 | 2901 | 0 | 4000 | 4000 | 100.0% |
| M | 31859 | 3220 | 2609 | 4000 | 1391 | 34.8% |
| R | 31565 | 3568 | 2289 | 4000 | 1713 | 42.8% |
| Q | 27406 | 4465 | 3213 | 4000 | 1298 | 32.5% |
| A | 27365 | 4002 | 2934 | 4000 | 1066 | 26.7% |
| B | 19660 | 4002 | 3265 | 4000 | 735 | 18.4% |
| L | 17971 | 2586 | 983 | 4000 | 432 | 10.8% |
| N | 0 | 0 | 2 | 0 | 1 | 0.0% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 4002 | 2.00 |
| beastChainMoves | 0 | 0.00 |
| beastChainCaptures | 0 | 0.00 |
| maesterSwaps | 13292 | 6.65 |
| maesterLongSwaps | 2492 | 1.25 |
| paladinSacrifices | 2586 | 1.29 |
| promotions | 536 | 0.27 |
| checks | 13827 | 6.91 |

## Degeneracy counters
| counter | value |
|---|---|
| guard captures per game | 1.208 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 70 (3.5%) |
| games where a king never moved | 365 (18.3%) |

## Interest terms, residualised on draw rate
Each term minus what this run's `term ~ a + b·drawRate` line predicts from the arrangement's draw
rate. The mean over the arrangements is 0 by construction, so read differences between pools, never
levels. Overall row, fitted on the 20 arrangements:
| killerMove | leadChange | uncertaintyLate | drama | permanence | fairyUse | excessDecisiveness | interest | interestMinFairy |
|---|---|---|---|---|---|---|---|---|
| 0.000 | 0.000 | -0.000 | -0.000 | -0.000 | 0.000 | 0.009 | 0.001 | 0.008 |

## Balance axis — back ranks by |white score − 0.5| (ascending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| GMQRLKBA | 100 | 26 | 46 | 28 | 0.490 | 0.418–0.562 | -7 ±50 | 54.0% | 35.0% | 11.0% | 148.1±83.3 | 0.28 | 0.024 | 0.631 | 0.09 | 0.98 | 0.31 | 1.71 | -0.011 | 0.474 | 0.465 | timeouts |
| GLRAMBQK | 100 | 29 | 44 | 27 | 0.510 | 0.437–0.583 | +7 ±51 | 56.0% | 32.0% | 12.0% | 158.0±77.5 | 0.27 | 0.021 | 0.632 | 0.08 | 0.98 | 0.31 | 1.62 | 0.009 | 0.472 | 0.452 | timeouts |
| RKQBMLGA | 100 | 30 | 43 | 27 | 0.515 | 0.441–0.589 | +10 ±51 | 57.0% | 33.0% | 10.0% | 158.8±78.9 | 0.28 | 0.020 | 0.621 | 0.09 | 0.98 | 0.30 | 1.72 | 0.014 | 0.473 | 0.464 | timeouts |
| KALBMQGR | 100 | 24 | 56 | 20 | 0.520 | 0.455–0.585 | +14 ±45 | 44.0% | 44.0% | 12.0% | 158.8±85.1 | 0.25 | 0.020 | 0.634 | 0.06 | 0.98 | 0.30 | 1.61 | -0.121 | 0.457 | 0.455 | timeouts |
| RBAGQKML | 100 | 31 | 42 | 27 | 0.520 | 0.445–0.595 | +14 ±52 | 58.0% | 36.0% | 6.0% | 140.6±72.9 | 0.26 | 0.017 | 0.622 | 0.05 | 0.98 | 0.33 | 1.65 | 0.019 | 0.466 | 0.443 | timeouts |
| AMQLGKRB | 100 | 25 | 45 | 30 | 0.475 | 0.402–0.548 | -17 ±50 | 55.0% | 35.0% | 10.0% | 146.6±71.9 | 0.29 | 0.023 | 0.633 | 0.10 | 0.98 | 0.32 | 1.72 | -0.015 | 0.477 | 0.466 | timeouts |
| QBALRGMK | 100 | 29 | 47 | 24 | 0.525 | 0.454–0.596 | +17 ±49 | 53.0% | 41.0% | 6.0% | 136.4±70.7 | 0.28 | 0.023 | 0.642 | 0.08 | 0.98 | 0.35 | 1.60 | -0.035 | 0.471 | 0.455 | timeouts |
| BLGRMAKQ | 100 | 30 | 46 | 24 | 0.530 | 0.458–0.602 | +21 ±50 | 54.0% | 39.0% | 7.0% | 141.3±77.0 | 0.27 | 0.026 | 0.630 | 0.08 | 0.98 | 0.34 | 1.69 | -0.030 | 0.468 | 0.448 | balance,timeouts |
| AQRLMKBG | 100 | 34 | 26 | 40 | 0.470 | 0.386–0.554 | -21 ±58 | 74.0% | 22.0% | 4.0% | 133.9±71.1 | 0.29 | 0.022 | 0.621 | 0.12 | 0.98 | 0.36 | 1.67 | 0.170 | 0.489 | 0.489 | balance |
| KGRMLBQA | 100 | 26 | 41 | 33 | 0.465 | 0.390–0.540 | -24 ±52 | 59.0% | 28.0% | 13.0% | 143.7±81.7 | 0.29 | 0.024 | 0.631 | 0.08 | 0.98 | 0.34 | 1.64 | 0.015 | 0.475 | 0.465 | balance,timeouts |
| QARLMGBK | 100 | 29 | 49 | 22 | 0.535 | 0.465–0.605 | +24 ±48 | 51.0% | 47.0% | 2.0% | 129.8±71.2 | 0.26 | 0.027 | 0.652 | 0.07 | 0.98 | 0.36 | 1.72 | -0.065 | 0.465 | 0.465 | balance,drawRate |
| KQRBGAML | 100 | 38 | 31 | 31 | 0.535 | 0.454–0.616 | +24 ±56 | 69.0% | 28.0% | 3.0% | 146.3±76.9 | 0.33 | 0.020 | 0.621 | 0.11 | 0.97 | 0.32 | 1.71 | 0.115 | 0.493 | 0.481 | balance |
| GBRLQKMA | 100 | 32 | 44 | 24 | 0.540 | 0.467–0.613 | +28 ±51 | 56.0% | 35.0% | 9.0% | 144.5±78.0 | 0.26 | 0.035 | 0.631 | 0.08 | 0.98 | 0.35 | 1.65 | -0.020 | 0.466 | 0.435 | balance,timeouts |
| LGMQBAKR | 100 | 33 | 43 | 24 | 0.545 | 0.472–0.618 | +31 ±51 | 57.0% | 36.0% | 7.0% | 142.9±74.8 | 0.25 | 0.020 | 0.631 | 0.08 | 0.98 | 0.31 | 1.61 | -0.014 | 0.466 | 0.466 | balance,timeouts |
| AMQRBKGL | 100 | 37 | 36 | 27 | 0.550 | 0.472–0.628 | +35 ±54 | 64.0% | 32.0% | 4.0% | 134.2±65.6 | 0.32 | 0.026 | 0.633 | 0.14 | 0.98 | 0.35 | 1.72 | 0.051 | 0.490 | 0.490 | balance |
| MGABKQRL | 100 | 33 | 47 | 20 | 0.565 | 0.495–0.635 | +45 ±49 | 53.0% | 39.0% | 8.0% | 145.2±78.5 | 0.27 | 0.026 | 0.623 | 0.07 | 0.98 | 0.31 | 1.73 | -0.073 | 0.464 | 0.464 | balance,timeouts |
| LQBGAMKR | 100 | 33 | 48 | 19 | 0.570 | 0.501–0.639 | +49 ±48 | 52.0% | 38.0% | 10.0% | 150.7±77.7 | 0.29 | 0.019 | 0.634 | 0.09 | 0.98 | 0.30 | 1.70 | -0.088 | 0.471 | 0.458 | balance,timeouts |
| BGAMLRQK | 100 | 39 | 36 | 25 | 0.570 | 0.493–0.647 | +49 ±54 | 64.0% | 29.0% | 7.0% | 144.8±75.9 | 0.35 | 0.021 | 0.624 | 0.08 | 0.97 | 0.32 | 1.71 | 0.032 | 0.489 | 0.489 | balance,timeouts |
| AMRGQBKL | 100 | 43 | 32 | 25 | 0.590 | 0.511–0.669 | +63 ±55 | 68.0% | 26.0% | 6.0% | 142.9±78.0 | 0.31 | 0.019 | 0.604 | 0.10 | 0.98 | 0.33 | 1.67 | 0.053 | 0.481 | 0.481 | balance,timeouts |
| MABLGKQR | 100 | 43 | 36 | 21 | 0.610 | 0.535–0.685 | +78 ±52 | 64.0% | 31.0% | 5.0% | 150.3±70.2 | 0.27 | 0.023 | 0.623 | 0.10 | 0.98 | 0.32 | 1.71 | -0.006 | 0.472 | 0.466 | balance |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| KQRBGAML | 100 | 38 | 31 | 31 | 0.535 | 0.454–0.616 | +24 ±56 | 69.0% | 28.0% | 3.0% | 146.3±76.9 | 0.33 | 0.020 | 0.621 | 0.11 | 0.97 | 0.32 | 1.71 | 0.115 | 0.493 | 0.481 | balance |
| AMQRBKGL | 100 | 37 | 36 | 27 | 0.550 | 0.472–0.628 | +35 ±54 | 64.0% | 32.0% | 4.0% | 134.2±65.6 | 0.32 | 0.026 | 0.633 | 0.14 | 0.98 | 0.35 | 1.72 | 0.051 | 0.490 | 0.490 | balance |
| AQRLMKBG | 100 | 34 | 26 | 40 | 0.470 | 0.386–0.554 | -21 ±58 | 74.0% | 22.0% | 4.0% | 133.9±71.1 | 0.29 | 0.022 | 0.621 | 0.12 | 0.98 | 0.36 | 1.67 | 0.170 | 0.489 | 0.489 | balance |
| BGAMLRQK | 100 | 39 | 36 | 25 | 0.570 | 0.493–0.647 | +49 ±54 | 64.0% | 29.0% | 7.0% | 144.8±75.9 | 0.35 | 0.021 | 0.624 | 0.08 | 0.97 | 0.32 | 1.71 | 0.032 | 0.489 | 0.489 | balance,timeouts |
| AMRGQBKL | 100 | 43 | 32 | 25 | 0.590 | 0.511–0.669 | +63 ±55 | 68.0% | 26.0% | 6.0% | 142.9±78.0 | 0.31 | 0.019 | 0.604 | 0.10 | 0.98 | 0.33 | 1.67 | 0.053 | 0.481 | 0.481 | balance,timeouts |
| AMQLGKRB | 100 | 25 | 45 | 30 | 0.475 | 0.402–0.548 | -17 ±50 | 55.0% | 35.0% | 10.0% | 146.6±71.9 | 0.29 | 0.023 | 0.633 | 0.10 | 0.98 | 0.32 | 1.72 | -0.015 | 0.477 | 0.466 | timeouts |
| KGRMLBQA | 100 | 26 | 41 | 33 | 0.465 | 0.390–0.540 | -24 ±52 | 59.0% | 28.0% | 13.0% | 143.7±81.7 | 0.29 | 0.024 | 0.631 | 0.08 | 0.98 | 0.34 | 1.64 | 0.015 | 0.475 | 0.465 | balance,timeouts |
| GMQRLKBA | 100 | 26 | 46 | 28 | 0.490 | 0.418–0.562 | -7 ±50 | 54.0% | 35.0% | 11.0% | 148.1±83.3 | 0.28 | 0.024 | 0.631 | 0.09 | 0.98 | 0.31 | 1.71 | -0.011 | 0.474 | 0.465 | timeouts |
| RKQBMLGA | 100 | 30 | 43 | 27 | 0.515 | 0.441–0.589 | +10 ±51 | 57.0% | 33.0% | 10.0% | 158.8±78.9 | 0.28 | 0.020 | 0.621 | 0.09 | 0.98 | 0.30 | 1.72 | 0.014 | 0.473 | 0.464 | timeouts |
| MABLGKQR | 100 | 43 | 36 | 21 | 0.610 | 0.535–0.685 | +78 ±52 | 64.0% | 31.0% | 5.0% | 150.3±70.2 | 0.27 | 0.023 | 0.623 | 0.10 | 0.98 | 0.32 | 1.71 | -0.006 | 0.472 | 0.466 | balance |
| GLRAMBQK | 100 | 29 | 44 | 27 | 0.510 | 0.437–0.583 | +7 ±51 | 56.0% | 32.0% | 12.0% | 158.0±77.5 | 0.27 | 0.021 | 0.632 | 0.08 | 0.98 | 0.31 | 1.62 | 0.009 | 0.472 | 0.452 | timeouts |
| QBALRGMK | 100 | 29 | 47 | 24 | 0.525 | 0.454–0.596 | +17 ±49 | 53.0% | 41.0% | 6.0% | 136.4±70.7 | 0.28 | 0.023 | 0.642 | 0.08 | 0.98 | 0.35 | 1.60 | -0.035 | 0.471 | 0.455 | timeouts |
| LQBGAMKR | 100 | 33 | 48 | 19 | 0.570 | 0.501–0.639 | +49 ±48 | 52.0% | 38.0% | 10.0% | 150.7±77.7 | 0.29 | 0.019 | 0.634 | 0.09 | 0.98 | 0.30 | 1.70 | -0.088 | 0.471 | 0.458 | balance,timeouts |
| BLGRMAKQ | 100 | 30 | 46 | 24 | 0.530 | 0.458–0.602 | +21 ±50 | 54.0% | 39.0% | 7.0% | 141.3±77.0 | 0.27 | 0.026 | 0.630 | 0.08 | 0.98 | 0.34 | 1.69 | -0.030 | 0.468 | 0.448 | balance,timeouts |
| GBRLQKMA | 100 | 32 | 44 | 24 | 0.540 | 0.467–0.613 | +28 ±51 | 56.0% | 35.0% | 9.0% | 144.5±78.0 | 0.26 | 0.035 | 0.631 | 0.08 | 0.98 | 0.35 | 1.65 | -0.020 | 0.466 | 0.435 | balance,timeouts |
| LGMQBAKR | 100 | 33 | 43 | 24 | 0.545 | 0.472–0.618 | +31 ±51 | 57.0% | 36.0% | 7.0% | 142.9±74.8 | 0.25 | 0.020 | 0.631 | 0.08 | 0.98 | 0.31 | 1.61 | -0.014 | 0.466 | 0.466 | balance,timeouts |
| RBAGQKML | 100 | 31 | 42 | 27 | 0.520 | 0.445–0.595 | +14 ±52 | 58.0% | 36.0% | 6.0% | 140.6±72.9 | 0.26 | 0.017 | 0.622 | 0.05 | 0.98 | 0.33 | 1.65 | 0.019 | 0.466 | 0.443 | timeouts |
| QARLMGBK | 100 | 29 | 49 | 22 | 0.535 | 0.465–0.605 | +24 ±48 | 51.0% | 47.0% | 2.0% | 129.8±71.2 | 0.26 | 0.027 | 0.652 | 0.07 | 0.98 | 0.36 | 1.72 | -0.065 | 0.465 | 0.465 | balance,drawRate |
| MGABKQRL | 100 | 33 | 47 | 20 | 0.565 | 0.495–0.635 | +45 ±49 | 53.0% | 39.0% | 8.0% | 145.2±78.5 | 0.27 | 0.026 | 0.623 | 0.07 | 0.98 | 0.31 | 1.73 | -0.073 | 0.464 | 0.464 | balance,timeouts |
| KALBMQGR | 100 | 24 | 56 | 20 | 0.520 | 0.455–0.585 | +14 ±45 | 44.0% | 44.0% | 12.0% | 158.8±85.1 | 0.25 | 0.020 | 0.634 | 0.06 | 0.98 | 0.30 | 1.61 | -0.121 | 0.457 | 0.455 | timeouts |

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
