# Sim report — gs-g1

800 games. White score **0.535** (95% 0.505–0.565),
white advantage **+24 ± 21 Elo**.
Decisive 73.5% · draws 25.4% · capped 1.1% (counted apart, never as draws).
Plies: mean 115.9 ± 51.7, median 105. Rules: all defaults.

No complete colour-swapped pairs in this run.
σ_pg 0.4272 · normalized Elo +28 · LOS 99.0% ·
SPRT LLR 0.70 against ±2.94 (nElo 0 vs 4) → **continue**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 800 | 322 | 212 | 266 | 0.535 | 0.505–0.565 | +24 ±21 | 73.5% | 25.4% | 1.1% | 115.9±51.7 | 0.36 | 0.071 | 0.648 | 0.13 | 0.96 | 0.45 | 1.65 | 0.002 | 0.487 | 0.481 | balance |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | G | N | Q | R | M | A | B | K | P |
|---|---|---|---|---|---|---|---|---|---|
| use | 0.97 | 1.17 | 2.01 | 1.55 | 1.93 | 2.06 | 1.06 | 1.68 | 0.45 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 588 | 73.5% |
| adjudicatedDraw | 166 | 20.8% |
| drawRepetition | 17 | 2.1% |
| draw50 | 12 | 1.5% |
| plyCap | 9 | 1.1% |
| drawMaterial | 8 | 1.0% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| P | 20755 | 3574 | 7363 | 12800 | 5200 | 40.6% |
| A | 11932 | 2115 | 863 | 1600 | 738 | 46.1% |
| Q | 11667 | 2265 | 1014 | 1600 | 822 | 51.4% |
| M | 11185 | 1201 | 1090 | 1600 | 510 | 31.9% |
| K | 9720 | 713 | 0 | 1600 | 1600 | 100.0% |
| R | 8984 | 1462 | 891 | 1600 | 709 | 44.3% |
| N | 6760 | 1261 | 1438 | 1600 | 162 | 10.1% |
| B | 6128 | 1347 | 1224 | 1600 | 376 | 23.5% |
| G | 5603 | 0 | 55 | 1600 | 1545 | 96.6% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 2115 | 2.64 |
| beastChainMoves | 0 | 0.00 |
| beastChainCaptures | 0 | 0.00 |
| maesterSwaps | 5051 | 6.31 |
| maesterLongSwaps | 696 | 0.87 |
| paladinSacrifices | 0 | 0.00 |
| promotions | 237 | 0.30 |
| checks | 4015 | 5.02 |

## Degeneracy counters
| counter | value |
|---|---|
| guard captures per game | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 20 (2.5%) |
| games where a king never moved | 174 (21.8%) |

## Interest terms, residualised on draw rate
Each term minus what this run's `term ~ a + b·drawRate` line predicts from the arrangement's draw
rate. The mean over the arrangements is 0 by construction, so read differences between pools, never
levels. Overall row, fitted on the 20 arrangements:
| killerMove | leadChange | uncertaintyLate | drama | permanence | fairyUse | excessDecisiveness | interest | interestMinFairy |
|---|---|---|---|---|---|---|---|---|
| -0.000 | 0.000 | 0.000 | -0.000 | -0.000 | 0.000 | 0.002 | 0.000 | 0.016 |

## Balance axis — back ranks by |white score − 0.5| (ascending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ABRMNGQK | 40 | 13 | 14 | 13 | 0.500 | 0.375–0.625 | +0 ±87 | 65.0% | 32.5% | 2.5% | 114.7±59.4 | 0.34 | 0.093 | 0.664 | 0.11 | 0.96 | 0.43 | 1.81 | -0.079 | 0.475 | 0.475 | - |
| NMBRKGQA | 40 | 15 | 10 | 15 | 0.500 | 0.366–0.634 | +0 ±93 | 75.0% | 25.0% | 0.0% | 118.5±54.3 | 0.40 | 0.075 | 0.649 | 0.16 | 0.96 | 0.44 | 1.58 | 0.021 | 0.499 | 0.463 | - |
| RGANBMKQ | 40 | 17 | 6 | 17 | 0.500 | 0.357–0.643 | +0 ±99 | 85.0% | 15.0% | 0.0% | 99.2±42.7 | 0.41 | 0.077 | 0.645 | 0.17 | 0.96 | 0.48 | 1.70 | 0.121 | 0.508 | 0.508 | - |
| QBANGKMR | 40 | 16 | 10 | 14 | 0.525 | 0.391–0.659 | +17 ±93 | 75.0% | 22.5% | 2.5% | 149.0±70.9 | 0.32 | 0.051 | 0.642 | 0.15 | 0.97 | 0.37 | 1.71 | 0.019 | 0.486 | 0.486 | - |
| NQKMGABR | 40 | 15 | 12 | 13 | 0.525 | 0.396–0.654 | +17 ±90 | 70.0% | 27.5% | 2.5% | 117.7±54.1 | 0.32 | 0.074 | 0.648 | 0.12 | 0.96 | 0.43 | 1.66 | -0.031 | 0.476 | 0.476 | - |
| RABNKGQM | 40 | 12 | 13 | 15 | 0.463 | 0.336–0.589 | -26 ±88 | 67.5% | 32.5% | 0.0% | 107.0±34.4 | 0.30 | 0.073 | 0.653 | 0.10 | 0.96 | 0.48 | 1.65 | -0.058 | 0.469 | 0.458 | balance |
| RNKQMGAB | 40 | 15 | 13 | 12 | 0.537 | 0.411–0.664 | +26 ±88 | 67.5% | 32.5% | 0.0% | 95.8±28.3 | 0.35 | 0.085 | 0.669 | 0.14 | 0.96 | 0.52 | 1.63 | -0.058 | 0.484 | 0.388 | balance |
| QRABKMGN | 40 | 17 | 10 | 13 | 0.550 | 0.417–0.683 | +35 ±93 | 75.0% | 20.0% | 5.0% | 116.8±62.0 | 0.29 | 0.049 | 0.626 | 0.10 | 0.96 | 0.42 | 1.54 | 0.016 | 0.472 | 0.463 | balance |
| GNQRMABK | 40 | 18 | 9 | 13 | 0.563 | 0.427–0.698 | +44 ±94 | 77.5% | 22.5% | 0.0% | 117.1±46.1 | 0.37 | 0.060 | 0.644 | 0.14 | 0.96 | 0.38 | 1.66 | 0.039 | 0.495 | 0.371 | balance |
| KAMRQBGN | 40 | 16 | 13 | 11 | 0.563 | 0.437–0.688 | +44 ±87 | 67.5% | 32.5% | 0.0% | 122.0±55.1 | 0.33 | 0.071 | 0.653 | 0.13 | 0.96 | 0.45 | 1.72 | -0.061 | 0.479 | 0.479 | balance |
| MRBAQGKN | 40 | 20 | 5 | 15 | 0.563 | 0.419–0.706 | +44 ±100 | 87.5% | 12.5% | 0.0% | 120.1±45.4 | 0.45 | 0.051 | 0.619 | 0.18 | 0.96 | 0.48 | 1.63 | 0.139 | 0.519 | 0.510 | balance |
| NGMQRBKA | 40 | 13 | 9 | 18 | 0.438 | 0.302–0.573 | -44 ±94 | 77.5% | 22.5% | 0.0% | 112.2±47.2 | 0.35 | 0.088 | 0.651 | 0.13 | 0.96 | 0.46 | 1.60 | 0.039 | 0.487 | 0.459 | balance |
| KGAQNBMR | 40 | 16 | 13 | 11 | 0.563 | 0.437–0.688 | +44 ±87 | 67.5% | 30.0% | 2.5% | 126.0±50.7 | 0.35 | 0.060 | 0.657 | 0.10 | 0.96 | 0.43 | 1.84 | -0.061 | 0.482 | 0.482 | balance |
| QNBAKGRM | 40 | 18 | 9 | 13 | 0.563 | 0.427–0.698 | +44 ±94 | 77.5% | 22.5% | 0.0% | 111.9±48.2 | 0.36 | 0.076 | 0.655 | 0.13 | 0.96 | 0.44 | 1.76 | 0.039 | 0.490 | 0.487 | balance |
| MNBRQKGA | 40 | 17 | 12 | 11 | 0.575 | 0.447–0.703 | +53 ±89 | 70.0% | 30.0% | 0.0% | 118.6±48.1 | 0.37 | 0.065 | 0.646 | 0.15 | 0.96 | 0.44 | 1.57 | -0.037 | 0.491 | 0.465 | balance |
| QMBKNRGA | 40 | 16 | 14 | 10 | 0.575 | 0.452–0.698 | +53 ±85 | 65.0% | 35.0% | 0.0% | 107.7±38.4 | 0.31 | 0.078 | 0.662 | 0.14 | 0.96 | 0.47 | 1.53 | -0.087 | 0.476 | 0.425 | balance,drawRate |
| MNRAQGBK | 40 | 20 | 8 | 12 | 0.600 | 0.465–0.735 | +70 ±94 | 80.0% | 20.0% | 0.0% | 109.9±40.4 | 0.35 | 0.059 | 0.645 | 0.16 | 0.96 | 0.48 | 1.59 | 0.060 | 0.493 | 0.454 | balance |
| MBQGNKAR | 40 | 18 | 13 | 9 | 0.613 | 0.490–0.735 | +80 ±85 | 67.5% | 30.0% | 2.5% | 109.8±57.9 | 0.36 | 0.086 | 0.643 | 0.12 | 0.96 | 0.48 | 1.53 | -0.066 | 0.480 | 0.478 | balance |
| GMKQNBAR | 40 | 18 | 13 | 9 | 0.613 | 0.490–0.735 | +80 ±85 | 67.5% | 27.5% | 5.0% | 129.2±61.3 | 0.36 | 0.067 | 0.646 | 0.12 | 0.96 | 0.43 | 1.55 | -0.066 | 0.483 | 0.469 | balance |
| KBNMGRQA | 40 | 12 | 6 | 22 | 0.375 | 0.237–0.513 | -89 ±96 | 85.0% | 15.0% | 0.0% | 115.1±46.0 | 0.39 | 0.078 | 0.640 | 0.16 | 0.96 | 0.44 | 1.73 | 0.108 | 0.502 | 0.502 | balance |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| MRBAQGKN | 40 | 20 | 5 | 15 | 0.563 | 0.419–0.706 | +44 ±100 | 87.5% | 12.5% | 0.0% | 120.1±45.4 | 0.45 | 0.051 | 0.619 | 0.18 | 0.96 | 0.48 | 1.63 | 0.139 | 0.519 | 0.510 | balance |
| RGANBMKQ | 40 | 17 | 6 | 17 | 0.500 | 0.357–0.643 | +0 ±99 | 85.0% | 15.0% | 0.0% | 99.2±42.7 | 0.41 | 0.077 | 0.645 | 0.17 | 0.96 | 0.48 | 1.70 | 0.121 | 0.508 | 0.508 | - |
| KBNMGRQA | 40 | 12 | 6 | 22 | 0.375 | 0.237–0.513 | -89 ±96 | 85.0% | 15.0% | 0.0% | 115.1±46.0 | 0.39 | 0.078 | 0.640 | 0.16 | 0.96 | 0.44 | 1.73 | 0.108 | 0.502 | 0.502 | balance |
| NMBRKGQA | 40 | 15 | 10 | 15 | 0.500 | 0.366–0.634 | +0 ±93 | 75.0% | 25.0% | 0.0% | 118.5±54.3 | 0.40 | 0.075 | 0.649 | 0.16 | 0.96 | 0.44 | 1.58 | 0.021 | 0.499 | 0.463 | - |
| GNQRMABK | 40 | 18 | 9 | 13 | 0.563 | 0.427–0.698 | +44 ±94 | 77.5% | 22.5% | 0.0% | 117.1±46.1 | 0.37 | 0.060 | 0.644 | 0.14 | 0.96 | 0.38 | 1.66 | 0.039 | 0.495 | 0.371 | balance |
| MNRAQGBK | 40 | 20 | 8 | 12 | 0.600 | 0.465–0.735 | +70 ±94 | 80.0% | 20.0% | 0.0% | 109.9±40.4 | 0.35 | 0.059 | 0.645 | 0.16 | 0.96 | 0.48 | 1.59 | 0.060 | 0.493 | 0.454 | balance |
| MNBRQKGA | 40 | 17 | 12 | 11 | 0.575 | 0.447–0.703 | +53 ±89 | 70.0% | 30.0% | 0.0% | 118.6±48.1 | 0.37 | 0.065 | 0.646 | 0.15 | 0.96 | 0.44 | 1.57 | -0.037 | 0.491 | 0.465 | balance |
| QNBAKGRM | 40 | 18 | 9 | 13 | 0.563 | 0.427–0.698 | +44 ±94 | 77.5% | 22.5% | 0.0% | 111.9±48.2 | 0.36 | 0.076 | 0.655 | 0.13 | 0.96 | 0.44 | 1.76 | 0.039 | 0.490 | 0.487 | balance |
| NGMQRBKA | 40 | 13 | 9 | 18 | 0.438 | 0.302–0.573 | -44 ±94 | 77.5% | 22.5% | 0.0% | 112.2±47.2 | 0.35 | 0.088 | 0.651 | 0.13 | 0.96 | 0.46 | 1.60 | 0.039 | 0.487 | 0.459 | balance |
| QBANGKMR | 40 | 16 | 10 | 14 | 0.525 | 0.391–0.659 | +17 ±93 | 75.0% | 22.5% | 2.5% | 149.0±70.9 | 0.32 | 0.051 | 0.642 | 0.15 | 0.97 | 0.37 | 1.71 | 0.019 | 0.486 | 0.486 | - |
| RNKQMGAB | 40 | 15 | 13 | 12 | 0.537 | 0.411–0.664 | +26 ±88 | 67.5% | 32.5% | 0.0% | 95.8±28.3 | 0.35 | 0.085 | 0.669 | 0.14 | 0.96 | 0.52 | 1.63 | -0.058 | 0.484 | 0.388 | balance |
| GMKQNBAR | 40 | 18 | 13 | 9 | 0.613 | 0.490–0.735 | +80 ±85 | 67.5% | 27.5% | 5.0% | 129.2±61.3 | 0.36 | 0.067 | 0.646 | 0.12 | 0.96 | 0.43 | 1.55 | -0.066 | 0.483 | 0.469 | balance |
| KGAQNBMR | 40 | 16 | 13 | 11 | 0.563 | 0.437–0.688 | +44 ±87 | 67.5% | 30.0% | 2.5% | 126.0±50.7 | 0.35 | 0.060 | 0.657 | 0.10 | 0.96 | 0.43 | 1.84 | -0.061 | 0.482 | 0.482 | balance |
| MBQGNKAR | 40 | 18 | 13 | 9 | 0.613 | 0.490–0.735 | +80 ±85 | 67.5% | 30.0% | 2.5% | 109.8±57.9 | 0.36 | 0.086 | 0.643 | 0.12 | 0.96 | 0.48 | 1.53 | -0.066 | 0.480 | 0.478 | balance |
| KAMRQBGN | 40 | 16 | 13 | 11 | 0.563 | 0.437–0.688 | +44 ±87 | 67.5% | 32.5% | 0.0% | 122.0±55.1 | 0.33 | 0.071 | 0.653 | 0.13 | 0.96 | 0.45 | 1.72 | -0.061 | 0.479 | 0.479 | balance |
| NQKMGABR | 40 | 15 | 12 | 13 | 0.525 | 0.396–0.654 | +17 ±90 | 70.0% | 27.5% | 2.5% | 117.7±54.1 | 0.32 | 0.074 | 0.648 | 0.12 | 0.96 | 0.43 | 1.66 | -0.031 | 0.476 | 0.476 | - |
| QMBKNRGA | 40 | 16 | 14 | 10 | 0.575 | 0.452–0.698 | +53 ±85 | 65.0% | 35.0% | 0.0% | 107.7±38.4 | 0.31 | 0.078 | 0.662 | 0.14 | 0.96 | 0.47 | 1.53 | -0.087 | 0.476 | 0.425 | balance,drawRate |
| ABRMNGQK | 40 | 13 | 14 | 13 | 0.500 | 0.375–0.625 | +0 ±87 | 65.0% | 32.5% | 2.5% | 114.7±59.4 | 0.34 | 0.093 | 0.664 | 0.11 | 0.96 | 0.43 | 1.81 | -0.079 | 0.475 | 0.475 | - |
| QRABKMGN | 40 | 17 | 10 | 13 | 0.550 | 0.417–0.683 | +35 ±93 | 75.0% | 20.0% | 5.0% | 116.8±62.0 | 0.29 | 0.049 | 0.626 | 0.10 | 0.96 | 0.42 | 1.54 | 0.016 | 0.472 | 0.463 | balance |
| RABNKGQM | 40 | 12 | 13 | 15 | 0.463 | 0.336–0.589 | -26 ±88 | 67.5% | 32.5% | 0.0% | 107.0±34.4 | 0.30 | 0.073 | 0.653 | 0.10 | 0.96 | 0.48 | 1.65 | -0.058 | 0.469 | 0.458 | balance |

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
