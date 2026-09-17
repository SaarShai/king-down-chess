# Sim report — b3-archer-corner

3200 games. White score **0.517** (95% 0.502–0.532),
white advantage **+12 ± 11 Elo**.
Decisive 77.5% · draws 21.7% · capped 0.8% (counted apart, never as draws).
Plies: mean 107.1 ± 51.9, median 96. Rules: all defaults.

No complete colour-swapped pairs in this run.
σ_pg 0.4399 · normalized Elo +13 · LOS 98.6% ·
SPRT LLR 1.21 against ±2.94 (nElo 0 vs 4) → **continue**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 3200 | 1295 | 719 | 1186 | 0.517 | 0.502–0.532 | +12 ±11 | 77.5% | 21.7% | 0.8% | 107.1±51.9 | 0.36 | 0.032 | 0.640 | 0.15 | 0.97 | 0.43 | 1.91 | 0.001 | 0.496 | 0.496 | - |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | A | B | K | Q | R | P |
|---|---|---|---|---|---|---|
| use | 1.91 | 1.07 | 2.36 | 1.56 | 1.34 | 0.43 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 2480 | 77.5% |
| adjudicatedDraw | 531 | 16.6% |
| drawRepetition | 104 | 3.3% |
| draw50 | 46 | 1.4% |
| plyCap | 26 | 0.8% |
| drawMaterial | 12 | 0.4% |
| checkmate | 1 | 0.0% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| A | 81667 | 11828 | 5862 | 12800 | 6940 | 54.2% |
| P | 73733 | 14696 | 31924 | 51200 | 18578 | 36.3% |
| R | 57245 | 11367 | 7928 | 12800 | 4874 | 38.1% |
| K | 50623 | 3322 | 0 | 6400 | 6400 | 100.0% |
| B | 45733 | 11966 | 10430 | 12800 | 2371 | 18.5% |
| Q | 33403 | 7860 | 4893 | 6400 | 2162 | 33.8% |
| G | 178 | 10 | 9 | 0 | 23 | 0.0% |
| L | 12 | 0 | 0 | 0 | 1 | 0.0% |
| N | 2 | 0 | 3 | 0 | 2 | 0.0% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 11828 | 3.70 |
| beastChainMoves | 0 | 0.00 |
| beastChainCaptures | 0 | 0.00 |
| maesterSwaps | 0 | 0.00 |
| maesterLongSwaps | 0 | 0.00 |
| paladinSacrifices | 0 | 0.00 |
| promotions | 698 | 0.22 |
| checks | 25562 | 7.99 |

## Degeneracy counters
| counter | value |
|---|---|
| guard captures per game | 0.003 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 58 (1.8%) |
| games where a king never moved | 654 (20.4%) |

## Interest terms, residualised on draw rate
Each term minus what this run's `term ~ a + b·drawRate` line predicts from the arrangement's draw
rate. The mean over the arrangements is 0 by construction, so read differences between pools, never
levels. Overall row, fitted on the 20 arrangements:
| killerMove | leadChange | uncertaintyLate | drama | permanence | fairyUse | excessDecisiveness | interest | interestMinFairy |
|---|---|---|---|---|---|---|---|---|
| -0.000 | 0.000 | 0.000 | 0.000 | -0.000 | 0.000 | 0.001 | 0.000 | 0.000 |

## Balance axis — back ranks by |white score − 0.5| (ascending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| AQKBRRBA | 160 | 64 | 32 | 64 | 0.500 | 0.431–0.569 | +0 ±48 | 80.0% | 19.4% | 0.6% | 102.9±47.8 | 0.35 | 0.032 | 0.638 | 0.14 | 0.97 | 0.44 | 1.97 | 0.027 | 0.494 | 0.494 | - |
| ABKRBQRA | 160 | 60 | 39 | 61 | 0.497 | 0.430–0.564 | -2 ±47 | 75.6% | 21.9% | 2.5% | 118.7±60.3 | 0.35 | 0.029 | 0.638 | 0.15 | 0.97 | 0.40 | 1.85 | -0.017 | 0.492 | 0.492 | - |
| ARQBBRKA | 160 | 58 | 43 | 59 | 0.497 | 0.431–0.563 | -2 ±46 | 73.1% | 26.3% | 0.6% | 108.1±51.3 | 0.35 | 0.030 | 0.648 | 0.15 | 0.97 | 0.43 | 2.01 | -0.042 | 0.491 | 0.491 | - |
| ABRKRQBA | 160 | 61 | 40 | 59 | 0.506 | 0.439–0.573 | +4 ±47 | 75.0% | 23.8% | 1.3% | 110.2±54.6 | 0.36 | 0.034 | 0.643 | 0.15 | 0.97 | 0.42 | 1.93 | -0.023 | 0.494 | 0.494 | - |
| AKQRBBRA | 160 | 60 | 36 | 64 | 0.487 | 0.419–0.556 | -9 ±47 | 77.5% | 22.5% | 0.0% | 111.2±49.3 | 0.37 | 0.030 | 0.642 | 0.17 | 0.97 | 0.42 | 1.99 | 0.001 | 0.501 | 0.501 | - |
| ARBRQBKA | 160 | 61 | 43 | 56 | 0.516 | 0.449–0.582 | +11 ±46 | 73.1% | 26.3% | 0.6% | 108.4±55.5 | 0.34 | 0.027 | 0.629 | 0.14 | 0.97 | 0.42 | 1.90 | -0.043 | 0.488 | 0.488 | - |
| ABKQBRRA | 160 | 66 | 35 | 59 | 0.522 | 0.453–0.590 | +15 ±48 | 78.1% | 21.9% | 0.0% | 110.0±50.0 | 0.35 | 0.034 | 0.641 | 0.15 | 0.97 | 0.43 | 1.76 | 0.007 | 0.494 | 0.494 | - |
| ABRRBQKA | 160 | 58 | 36 | 66 | 0.475 | 0.407–0.543 | -17 ±47 | 77.5% | 21.9% | 0.6% | 107.7±53.0 | 0.38 | 0.031 | 0.644 | 0.13 | 0.97 | 0.43 | 1.91 | 0.000 | 0.497 | 0.497 | - |
| ARKRQBBA | 160 | 72 | 25 | 63 | 0.528 | 0.457–0.599 | +20 ±49 | 84.4% | 15.6% | 0.0% | 98.3±43.3 | 0.39 | 0.034 | 0.639 | 0.16 | 0.96 | 0.45 | 1.92 | 0.069 | 0.507 | 0.507 | - |
| ARBBQRKA | 160 | 57 | 35 | 68 | 0.466 | 0.397–0.534 | -24 ±47 | 78.1% | 21.3% | 0.6% | 101.9±53.5 | 0.35 | 0.027 | 0.639 | 0.15 | 0.97 | 0.43 | 1.93 | 0.006 | 0.495 | 0.495 | balance |
| ARRQBBKA | 160 | 70 | 31 | 59 | 0.534 | 0.465–0.604 | +24 ±48 | 80.6% | 18.1% | 1.3% | 105.2±48.8 | 0.37 | 0.039 | 0.646 | 0.13 | 0.97 | 0.44 | 1.93 | 0.031 | 0.497 | 0.497 | balance |
| ABBKQRRA | 160 | 68 | 35 | 57 | 0.534 | 0.466–0.603 | +24 ±47 | 78.1% | 21.9% | 0.0% | 98.3±43.0 | 0.35 | 0.028 | 0.634 | 0.12 | 0.97 | 0.46 | 1.84 | 0.006 | 0.491 | 0.491 | balance |
| ARRKQBBA | 160 | 74 | 25 | 61 | 0.541 | 0.470–0.612 | +28 ±49 | 84.4% | 14.4% | 1.3% | 111.1±56.2 | 0.39 | 0.032 | 0.630 | 0.17 | 0.96 | 0.41 | 1.93 | 0.068 | 0.507 | 0.507 | balance |
| AQBBRRKA | 160 | 50 | 44 | 66 | 0.450 | 0.384–0.516 | -35 ±46 | 72.5% | 25.6% | 1.9% | 112.3±55.8 | 0.36 | 0.033 | 0.646 | 0.14 | 0.97 | 0.42 | 1.95 | -0.051 | 0.492 | 0.492 | balance |
| ABRQBRKA | 160 | 68 | 44 | 48 | 0.563 | 0.497–0.628 | +44 ±45 | 72.5% | 26.9% | 0.6% | 98.8±44.9 | 0.34 | 0.032 | 0.649 | 0.12 | 0.97 | 0.46 | 1.99 | -0.052 | 0.487 | 0.487 | balance,drawRate |
| AQRBBKRA | 160 | 52 | 36 | 72 | 0.438 | 0.370–0.505 | -44 ±47 | 77.5% | 20.6% | 1.9% | 111.4±51.3 | 0.38 | 0.029 | 0.644 | 0.16 | 0.97 | 0.42 | 1.82 | -0.002 | 0.502 | 0.502 | balance |
| ABBRKQRA | 160 | 75 | 30 | 55 | 0.563 | 0.493–0.632 | +44 ±48 | 81.3% | 18.8% | 0.0% | 106.9±51.4 | 0.37 | 0.031 | 0.632 | 0.15 | 0.97 | 0.43 | 1.95 | 0.035 | 0.499 | 0.499 | balance |
| AKBBRQRA | 160 | 70 | 41 | 49 | 0.566 | 0.500–0.632 | +46 ±46 | 74.4% | 25.0% | 0.6% | 111.4±52.5 | 0.37 | 0.033 | 0.648 | 0.15 | 0.97 | 0.42 | 1.89 | -0.034 | 0.496 | 0.496 | balance |
| ABBKRRQA | 160 | 75 | 32 | 53 | 0.569 | 0.500–0.637 | +48 ±48 | 80.0% | 19.4% | 0.6% | 106.8±50.6 | 0.37 | 0.034 | 0.640 | 0.16 | 0.97 | 0.44 | 1.85 | 0.022 | 0.500 | 0.500 | balance |
| ABBQRRKA | 160 | 76 | 37 | 47 | 0.591 | 0.524–0.657 | +64 ±46 | 76.9% | 21.9% | 1.3% | 101.6±55.7 | 0.37 | 0.034 | 0.635 | 0.11 | 0.96 | 0.45 | 1.83 | -0.010 | 0.492 | 0.492 | balance |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ARRKQBBA | 160 | 74 | 25 | 61 | 0.541 | 0.470–0.612 | +28 ±49 | 84.4% | 14.4% | 1.3% | 111.1±56.2 | 0.39 | 0.032 | 0.630 | 0.17 | 0.96 | 0.41 | 1.93 | 0.068 | 0.507 | 0.507 | balance |
| ARKRQBBA | 160 | 72 | 25 | 63 | 0.528 | 0.457–0.599 | +20 ±49 | 84.4% | 15.6% | 0.0% | 98.3±43.3 | 0.39 | 0.034 | 0.639 | 0.16 | 0.96 | 0.45 | 1.92 | 0.069 | 0.507 | 0.507 | - |
| AQRBBKRA | 160 | 52 | 36 | 72 | 0.438 | 0.370–0.505 | -44 ±47 | 77.5% | 20.6% | 1.9% | 111.4±51.3 | 0.38 | 0.029 | 0.644 | 0.16 | 0.97 | 0.42 | 1.82 | -0.002 | 0.502 | 0.502 | balance |
| AKQRBBRA | 160 | 60 | 36 | 64 | 0.487 | 0.419–0.556 | -9 ±47 | 77.5% | 22.5% | 0.0% | 111.2±49.3 | 0.37 | 0.030 | 0.642 | 0.17 | 0.97 | 0.42 | 1.99 | 0.001 | 0.501 | 0.501 | - |
| ABBKRRQA | 160 | 75 | 32 | 53 | 0.569 | 0.500–0.637 | +48 ±48 | 80.0% | 19.4% | 0.6% | 106.8±50.6 | 0.37 | 0.034 | 0.640 | 0.16 | 0.97 | 0.44 | 1.85 | 0.022 | 0.500 | 0.500 | balance |
| ABBRKQRA | 160 | 75 | 30 | 55 | 0.563 | 0.493–0.632 | +44 ±48 | 81.3% | 18.8% | 0.0% | 106.9±51.4 | 0.37 | 0.031 | 0.632 | 0.15 | 0.97 | 0.43 | 1.95 | 0.035 | 0.499 | 0.499 | balance |
| ARRQBBKA | 160 | 70 | 31 | 59 | 0.534 | 0.465–0.604 | +24 ±48 | 80.6% | 18.1% | 1.3% | 105.2±48.8 | 0.37 | 0.039 | 0.646 | 0.13 | 0.97 | 0.44 | 1.93 | 0.031 | 0.497 | 0.497 | balance |
| ABRRBQKA | 160 | 58 | 36 | 66 | 0.475 | 0.407–0.543 | -17 ±47 | 77.5% | 21.9% | 0.6% | 107.7±53.0 | 0.38 | 0.031 | 0.644 | 0.13 | 0.97 | 0.43 | 1.91 | 0.000 | 0.497 | 0.497 | - |
| AKBBRQRA | 160 | 70 | 41 | 49 | 0.566 | 0.500–0.632 | +46 ±46 | 74.4% | 25.0% | 0.6% | 111.4±52.5 | 0.37 | 0.033 | 0.648 | 0.15 | 0.97 | 0.42 | 1.89 | -0.034 | 0.496 | 0.496 | balance |
| ARBBQRKA | 160 | 57 | 35 | 68 | 0.466 | 0.397–0.534 | -24 ±47 | 78.1% | 21.3% | 0.6% | 101.9±53.5 | 0.35 | 0.027 | 0.639 | 0.15 | 0.97 | 0.43 | 1.93 | 0.006 | 0.495 | 0.495 | balance |
| ABRKRQBA | 160 | 61 | 40 | 59 | 0.506 | 0.439–0.573 | +4 ±47 | 75.0% | 23.8% | 1.3% | 110.2±54.6 | 0.36 | 0.034 | 0.643 | 0.15 | 0.97 | 0.42 | 1.93 | -0.023 | 0.494 | 0.494 | - |
| AQKBRRBA | 160 | 64 | 32 | 64 | 0.500 | 0.431–0.569 | +0 ±48 | 80.0% | 19.4% | 0.6% | 102.9±47.8 | 0.35 | 0.032 | 0.638 | 0.14 | 0.97 | 0.44 | 1.97 | 0.027 | 0.494 | 0.494 | - |
| ABKQBRRA | 160 | 66 | 35 | 59 | 0.522 | 0.453–0.590 | +15 ±48 | 78.1% | 21.9% | 0.0% | 110.0±50.0 | 0.35 | 0.034 | 0.641 | 0.15 | 0.97 | 0.43 | 1.76 | 0.007 | 0.494 | 0.494 | - |
| ABKRBQRA | 160 | 60 | 39 | 61 | 0.497 | 0.430–0.564 | -2 ±47 | 75.6% | 21.9% | 2.5% | 118.7±60.3 | 0.35 | 0.029 | 0.638 | 0.15 | 0.97 | 0.40 | 1.85 | -0.017 | 0.492 | 0.492 | - |
| ABBQRRKA | 160 | 76 | 37 | 47 | 0.591 | 0.524–0.657 | +64 ±46 | 76.9% | 21.9% | 1.3% | 101.6±55.7 | 0.37 | 0.034 | 0.635 | 0.11 | 0.96 | 0.45 | 1.83 | -0.010 | 0.492 | 0.492 | balance |
| AQBBRRKA | 160 | 50 | 44 | 66 | 0.450 | 0.384–0.516 | -35 ±46 | 72.5% | 25.6% | 1.9% | 112.3±55.8 | 0.36 | 0.033 | 0.646 | 0.14 | 0.97 | 0.42 | 1.95 | -0.051 | 0.492 | 0.492 | balance |
| ABBKQRRA | 160 | 68 | 35 | 57 | 0.534 | 0.466–0.603 | +24 ±47 | 78.1% | 21.9% | 0.0% | 98.3±43.0 | 0.35 | 0.028 | 0.634 | 0.12 | 0.97 | 0.46 | 1.84 | 0.006 | 0.491 | 0.491 | balance |
| ARQBBRKA | 160 | 58 | 43 | 59 | 0.497 | 0.431–0.563 | -2 ±46 | 73.1% | 26.3% | 0.6% | 108.1±51.3 | 0.35 | 0.030 | 0.648 | 0.15 | 0.97 | 0.43 | 2.01 | -0.042 | 0.491 | 0.491 | - |
| ARBRQBKA | 160 | 61 | 43 | 56 | 0.516 | 0.449–0.582 | +11 ±46 | 73.1% | 26.3% | 0.6% | 108.4±55.5 | 0.34 | 0.027 | 0.629 | 0.14 | 0.97 | 0.42 | 1.90 | -0.043 | 0.488 | 0.488 | - |
| ABRQBRKA | 160 | 68 | 44 | 48 | 0.563 | 0.497–0.628 | +44 ±45 | 72.5% | 26.9% | 0.6% | 98.8±44.9 | 0.34 | 0.032 | 0.649 | 0.12 | 0.97 | 0.46 | 1.99 | -0.052 | 0.487 | 0.487 | balance,drawRate |

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
