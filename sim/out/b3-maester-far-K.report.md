# Sim report — b3-maester-far-K

3200 games. White score **0.492** (95% 0.478–0.506),
white advantage **-5 ± 10 Elo**.
Decisive 63.2% · draws 35.2% · capped 1.6% (counted apart, never as draws).
Plies: mean 120.0 ± 57.9, median 109. Rules: all defaults.

No complete colour-swapped pairs in this run.
σ_pg 0.3974 · normalized Elo -7 · LOS 13.3% ·
SPRT LLR -0.94 against ±2.94 (nElo 0 vs 4) → **continue**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 3200 | 986 | 1178 | 1036 | 0.492 | 0.478–0.506 | -5 ±10 | 63.2% | 35.2% | 1.6% | 120.0±57.9 | 0.32 | 0.036 | 0.661 | 0.12 | 0.97 | 0.40 | 2.05 | 0.028 | 0.487 | 0.487 | - |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | Q | K | B | R | M | P |
|---|---|---|---|---|---|---|
| use | 1.65 | 2.15 | 1.05 | 1.39 | 2.05 | 0.40 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 2022 | 63.2% |
| adjudicatedDraw | 979 | 30.6% |
| drawRepetition | 113 | 3.5% |
| plyCap | 52 | 1.6% |
| drawMaterial | 19 | 0.6% |
| draw50 | 14 | 0.4% |
| stalemate | 1 | 0.0% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| M | 98546 | 9592 | 7859 | 12800 | 4941 | 38.6% |
| P | 76886 | 13303 | 26663 | 51200 | 23522 | 45.9% |
| R | 66493 | 12119 | 7978 | 12800 | 4823 | 37.7% |
| K | 51714 | 3975 | 0 | 6400 | 6400 | 100.0% |
| B | 50491 | 11355 | 10634 | 12800 | 2166 | 16.9% |
| Q | 39552 | 7761 | 4983 | 6400 | 2381 | 37.2% |
| G | 272 | 18 | 6 | 0 | 33 | 0.0% |
| L | 11 | 3 | 1 | 0 | 2 | 0.0% |
| N | 3 | 2 | 4 | 0 | 1 | 0.0% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 0 | 0.00 |
| beastChainMoves | 0 | 0.00 |
| beastChainCaptures | 0 | 0.00 |
| maesterSwaps | 43119 | 13.47 |
| maesterLongSwaps | 7364 | 2.30 |
| paladinSacrifices | 3 | 0.00 |
| promotions | 1015 | 0.32 |
| checks | 23164 | 7.24 |

## Degeneracy counters
| counter | value |
|---|---|
| guard captures per game | 0.006 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 33 (1.0%) |
| games where a king never moved | 697 (21.8%) |

## Interest terms, residualised on draw rate
Each term minus what this run's `term ~ a + b·drawRate` line predicts from the arrangement's draw
rate. The mean over the arrangements is 0 by construction, so read differences between pools, never
levels. Overall row, fitted on the 20 arrangements:
| killerMove | leadChange | uncertaintyLate | drama | permanence | fairyUse | excessDecisiveness | interest | interestMinFairy |
|---|---|---|---|---|---|---|---|---|
| -0.000 | 0.000 | -0.000 | 0.000 | -0.000 | 0.000 | 0.028 | 0.002 | 0.002 |

## Balance axis — back ranks by |white score − 0.5| (ascending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| KBRMRMBQ | 160 | 49 | 62 | 49 | 0.500 | 0.439–0.561 | +0 ±42 | 61.3% | 37.5% | 1.3% | 116.5±53.9 | 0.31 | 0.036 | 0.658 | 0.12 | 0.97 | 0.40 | 2.06 | 0.017 | 0.486 | 0.486 | - |
| KRBBMMRQ | 160 | 47 | 69 | 44 | 0.509 | 0.451–0.568 | +7 ±41 | 56.9% | 41.9% | 1.3% | 121.2±61.8 | 0.31 | 0.035 | 0.667 | 0.10 | 0.97 | 0.38 | 2.07 | -0.037 | 0.481 | 0.481 | - |
| QMRMBBRK | 160 | 46 | 71 | 43 | 0.509 | 0.452–0.567 | +7 ±40 | 55.6% | 41.9% | 2.5% | 118.2±56.3 | 0.29 | 0.036 | 0.670 | 0.11 | 0.98 | 0.41 | 2.09 | -0.049 | 0.477 | 0.477 | - |
| QKBRMRMB | 160 | 50 | 64 | 46 | 0.512 | 0.453–0.572 | +9 ±42 | 60.0% | 38.8% | 1.3% | 116.8±60.2 | 0.31 | 0.038 | 0.670 | 0.10 | 0.98 | 0.41 | 2.08 | -0.009 | 0.482 | 0.482 | - |
| KRQRBBMM | 160 | 49 | 67 | 44 | 0.516 | 0.457–0.575 | +11 ±41 | 58.1% | 41.3% | 0.6% | 115.5±54.2 | 0.31 | 0.037 | 0.672 | 0.10 | 0.97 | 0.41 | 2.01 | -0.031 | 0.481 | 0.481 | - |
| MRQBKRBM | 160 | 49 | 57 | 54 | 0.484 | 0.422–0.546 | -11 ±43 | 64.4% | 33.8% | 1.9% | 120.9±59.0 | 0.30 | 0.037 | 0.650 | 0.11 | 0.97 | 0.40 | 2.05 | 0.031 | 0.483 | 0.483 | - |
| RMQRMBBK | 160 | 49 | 57 | 54 | 0.484 | 0.422–0.546 | -11 ±43 | 64.4% | 34.4% | 1.3% | 121.9±55.6 | 0.30 | 0.035 | 0.665 | 0.12 | 0.97 | 0.40 | 2.06 | 0.031 | 0.485 | 0.485 | - |
| BRMRMBQK | 160 | 48 | 57 | 55 | 0.478 | 0.416–0.540 | -15 ±43 | 64.4% | 34.4% | 1.3% | 122.5±58.0 | 0.34 | 0.039 | 0.656 | 0.12 | 0.97 | 0.40 | 1.99 | 0.024 | 0.491 | 0.491 | - |
| MRBQKBRM | 160 | 59 | 52 | 49 | 0.531 | 0.468–0.595 | +22 ±44 | 67.5% | 31.3% | 1.3% | 124.1±58.1 | 0.34 | 0.038 | 0.658 | 0.13 | 0.97 | 0.38 | 2.12 | 0.045 | 0.494 | 0.494 | balance |
| RRMMBBKQ | 160 | 42 | 66 | 52 | 0.469 | 0.410–0.528 | -22 ±41 | 58.8% | 39.4% | 1.9% | 125.5±59.1 | 0.30 | 0.041 | 0.671 | 0.10 | 0.98 | 0.39 | 2.14 | -0.043 | 0.478 | 0.478 | balance |
| MRMBQKBR | 160 | 47 | 55 | 58 | 0.466 | 0.403–0.528 | -24 ±43 | 65.6% | 32.5% | 1.9% | 129.7±60.8 | 0.30 | 0.038 | 0.660 | 0.12 | 0.97 | 0.37 | 2.10 | 0.023 | 0.483 | 0.483 | balance |
| QMBRMBRK | 160 | 46 | 55 | 59 | 0.459 | 0.397–0.522 | -28 ±43 | 65.6% | 31.9% | 2.5% | 126.4±63.1 | 0.31 | 0.037 | 0.659 | 0.11 | 0.97 | 0.39 | 2.05 | 0.016 | 0.485 | 0.485 | balance |
| MMRBBQKR | 160 | 40 | 66 | 54 | 0.456 | 0.397–0.515 | -30 ±41 | 58.8% | 40.0% | 1.3% | 111.7±53.1 | 0.28 | 0.037 | 0.671 | 0.10 | 0.98 | 0.43 | 2.02 | -0.057 | 0.475 | 0.475 | balance |
| BBMQMRRK | 160 | 54 | 38 | 68 | 0.456 | 0.389–0.524 | -30 ±47 | 76.3% | 22.5% | 1.3% | 121.4±61.2 | 0.38 | 0.030 | 0.647 | 0.15 | 0.97 | 0.40 | 1.97 | 0.118 | 0.509 | 0.509 | balance |
| KBRRBMMQ | 160 | 43 | 59 | 58 | 0.453 | 0.392–0.514 | -33 ±42 | 63.1% | 36.3% | 0.6% | 113.5±51.4 | 0.32 | 0.040 | 0.670 | 0.12 | 0.97 | 0.42 | 2.07 | -0.016 | 0.486 | 0.486 | balance |
| QBRMMRBK | 160 | 62 | 52 | 46 | 0.550 | 0.487–0.613 | +35 ±44 | 67.5% | 30.6% | 1.9% | 123.1±52.9 | 0.31 | 0.033 | 0.658 | 0.12 | 0.97 | 0.42 | 1.97 | 0.024 | 0.487 | 0.487 | balance |
| QMMBRRBK | 160 | 39 | 65 | 56 | 0.447 | 0.388–0.506 | -37 ±41 | 59.4% | 38.1% | 2.5% | 117.3±59.4 | 0.30 | 0.030 | 0.660 | 0.11 | 0.97 | 0.40 | 2.02 | -0.061 | 0.478 | 0.478 | balance |
| BBKRQRMM | 160 | 62 | 55 | 43 | 0.559 | 0.497–0.621 | +41 ±43 | 65.6% | 33.1% | 1.3% | 121.0±51.0 | 0.32 | 0.035 | 0.659 | 0.12 | 0.97 | 0.41 | 2.12 | -0.005 | 0.486 | 0.486 | balance |
| RMMBRQBK | 160 | 40 | 61 | 59 | 0.441 | 0.380–0.501 | -41 ±42 | 61.9% | 35.0% | 3.1% | 117.5±62.3 | 0.33 | 0.035 | 0.667 | 0.12 | 0.97 | 0.40 | 2.02 | -0.043 | 0.487 | 0.487 | balance |
| BBRMMQRK | 160 | 65 | 50 | 45 | 0.563 | 0.499–0.626 | +44 ±44 | 68.8% | 29.4% | 1.9% | 115.3±61.6 | 0.35 | 0.036 | 0.639 | 0.13 | 0.97 | 0.41 | 2.04 | 0.022 | 0.492 | 0.492 | balance |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BBMQMRRK | 160 | 54 | 38 | 68 | 0.456 | 0.389–0.524 | -30 ±47 | 76.3% | 22.5% | 1.3% | 121.4±61.2 | 0.38 | 0.030 | 0.647 | 0.15 | 0.97 | 0.40 | 1.97 | 0.118 | 0.509 | 0.509 | balance |
| MRBQKBRM | 160 | 59 | 52 | 49 | 0.531 | 0.468–0.595 | +22 ±44 | 67.5% | 31.3% | 1.3% | 124.1±58.1 | 0.34 | 0.038 | 0.658 | 0.13 | 0.97 | 0.38 | 2.12 | 0.045 | 0.494 | 0.494 | balance |
| BBRMMQRK | 160 | 65 | 50 | 45 | 0.563 | 0.499–0.626 | +44 ±44 | 68.8% | 29.4% | 1.9% | 115.3±61.6 | 0.35 | 0.036 | 0.639 | 0.13 | 0.97 | 0.41 | 2.04 | 0.022 | 0.492 | 0.492 | balance |
| BRMRMBQK | 160 | 48 | 57 | 55 | 0.478 | 0.416–0.540 | -15 ±43 | 64.4% | 34.4% | 1.3% | 122.5±58.0 | 0.34 | 0.039 | 0.656 | 0.12 | 0.97 | 0.40 | 1.99 | 0.024 | 0.491 | 0.491 | - |
| RMMBRQBK | 160 | 40 | 61 | 59 | 0.441 | 0.380–0.501 | -41 ±42 | 61.9% | 35.0% | 3.1% | 117.5±62.3 | 0.33 | 0.035 | 0.667 | 0.12 | 0.97 | 0.40 | 2.02 | -0.043 | 0.487 | 0.487 | balance |
| QBRMMRBK | 160 | 62 | 52 | 46 | 0.550 | 0.487–0.613 | +35 ±44 | 67.5% | 30.6% | 1.9% | 123.1±52.9 | 0.31 | 0.033 | 0.658 | 0.12 | 0.97 | 0.42 | 1.97 | 0.024 | 0.487 | 0.487 | balance |
| KBRRBMMQ | 160 | 43 | 59 | 58 | 0.453 | 0.392–0.514 | -33 ±42 | 63.1% | 36.3% | 0.6% | 113.5±51.4 | 0.32 | 0.040 | 0.670 | 0.12 | 0.97 | 0.42 | 2.07 | -0.016 | 0.486 | 0.486 | balance |
| KBRMRMBQ | 160 | 49 | 62 | 49 | 0.500 | 0.439–0.561 | +0 ±42 | 61.3% | 37.5% | 1.3% | 116.5±53.9 | 0.31 | 0.036 | 0.658 | 0.12 | 0.97 | 0.40 | 2.06 | 0.017 | 0.486 | 0.486 | - |
| BBKRQRMM | 160 | 62 | 55 | 43 | 0.559 | 0.497–0.621 | +41 ±43 | 65.6% | 33.1% | 1.3% | 121.0±51.0 | 0.32 | 0.035 | 0.659 | 0.12 | 0.97 | 0.41 | 2.12 | -0.005 | 0.486 | 0.486 | balance |
| RMQRMBBK | 160 | 49 | 57 | 54 | 0.484 | 0.422–0.546 | -11 ±43 | 64.4% | 34.4% | 1.3% | 121.9±55.6 | 0.30 | 0.035 | 0.665 | 0.12 | 0.97 | 0.40 | 2.06 | 0.031 | 0.485 | 0.485 | - |
| QMBRMBRK | 160 | 46 | 55 | 59 | 0.459 | 0.397–0.522 | -28 ±43 | 65.6% | 31.9% | 2.5% | 126.4±63.1 | 0.31 | 0.037 | 0.659 | 0.11 | 0.97 | 0.39 | 2.05 | 0.016 | 0.485 | 0.485 | balance |
| MRQBKRBM | 160 | 49 | 57 | 54 | 0.484 | 0.422–0.546 | -11 ±43 | 64.4% | 33.8% | 1.9% | 120.9±59.0 | 0.30 | 0.037 | 0.650 | 0.11 | 0.97 | 0.40 | 2.05 | 0.031 | 0.483 | 0.483 | - |
| MRMBQKBR | 160 | 47 | 55 | 58 | 0.466 | 0.403–0.528 | -24 ±43 | 65.6% | 32.5% | 1.9% | 129.7±60.8 | 0.30 | 0.038 | 0.660 | 0.12 | 0.97 | 0.37 | 2.10 | 0.023 | 0.483 | 0.483 | balance |
| QKBRMRMB | 160 | 50 | 64 | 46 | 0.512 | 0.453–0.572 | +9 ±42 | 60.0% | 38.8% | 1.3% | 116.8±60.2 | 0.31 | 0.038 | 0.670 | 0.10 | 0.98 | 0.41 | 2.08 | -0.009 | 0.482 | 0.482 | - |
| KRQRBBMM | 160 | 49 | 67 | 44 | 0.516 | 0.457–0.575 | +11 ±41 | 58.1% | 41.3% | 0.6% | 115.5±54.2 | 0.31 | 0.037 | 0.672 | 0.10 | 0.97 | 0.41 | 2.01 | -0.031 | 0.481 | 0.481 | - |
| KRBBMMRQ | 160 | 47 | 69 | 44 | 0.509 | 0.451–0.568 | +7 ±41 | 56.9% | 41.9% | 1.3% | 121.2±61.8 | 0.31 | 0.035 | 0.667 | 0.10 | 0.97 | 0.38 | 2.07 | -0.037 | 0.481 | 0.481 | - |
| QMMBRRBK | 160 | 39 | 65 | 56 | 0.447 | 0.388–0.506 | -37 ±41 | 59.4% | 38.1% | 2.5% | 117.3±59.4 | 0.30 | 0.030 | 0.660 | 0.11 | 0.97 | 0.40 | 2.02 | -0.061 | 0.478 | 0.478 | balance |
| RRMMBBKQ | 160 | 42 | 66 | 52 | 0.469 | 0.410–0.528 | -22 ±41 | 58.8% | 39.4% | 1.9% | 125.5±59.1 | 0.30 | 0.041 | 0.671 | 0.10 | 0.98 | 0.39 | 2.14 | -0.043 | 0.478 | 0.478 | balance |
| QMRMBBRK | 160 | 46 | 71 | 43 | 0.509 | 0.452–0.567 | +7 ±40 | 55.6% | 41.9% | 2.5% | 118.2±56.3 | 0.29 | 0.036 | 0.670 | 0.11 | 0.98 | 0.41 | 2.09 | -0.049 | 0.477 | 0.477 | - |
| MMRBBQKR | 160 | 40 | 66 | 54 | 0.456 | 0.397–0.515 | -30 ±41 | 58.8% | 40.0% | 1.3% | 111.7±53.1 | 0.28 | 0.037 | 0.671 | 0.10 | 0.98 | 0.43 | 2.02 | -0.057 | 0.475 | 0.475 | balance |

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
