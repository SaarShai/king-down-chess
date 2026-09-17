# Sim report — cfg-beastsFlanks

3200 games. White score **0.519** (95% 0.506–0.532),
white advantage **+13 ± 9 Elo**.
Decisive 54.5% · draws 39.1% · capped 6.4% (counted apart, never as draws).
Plies: mean 141.5 ± 75.0, median 120. Rules: all defaults.

No complete colour-swapped pairs in this run.
σ_pg 0.3685 · normalized Elo +18 · LOS 99.8% ·
SPRT LLR 1.71 against ±2.94 (nElo 0 vs 4) → **continue**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 3200 | 933 | 1457 | 810 | 0.519 | 0.506–0.532 | +13 ±9 | 54.5% | 39.1% | 6.4% | 141.5±75.0 | 0.27 | 0.035 | 0.642 | 0.10 | 0.97 | 0.42 | 1.72 | 0.000 | 0.471 | 0.354 | timeouts |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | S | B | A | G | K | P | M | R | N | Q | L |
|---|---|---|---|---|---|---|---|---|---|---|---|
| use | 0.42 | 1.54 | 1.97 | 2.76 | 2.70 | 0.42 | 2.52 | 1.66 | 1.30 | 1.24 | 0.92 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 1743 | 54.5% |
| adjudicatedDraw | 735 | 23.0% |
| draw50 | 360 | 11.3% |
| plyCap | 205 | 6.4% |
| drawRepetition | 148 | 4.6% |
| drawMaterial | 8 | 0.3% |
| stalemate | 1 | 0.0% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| P | 94412 | 19083 | 35397 | 51200 | 14902 | 29.1% |
| K | 76512 | 4091 | 0 | 6400 | 6400 | 100.0% |
| G | 62530 | 0 | 233 | 5120 | 4954 | 96.8% |
| M | 46297 | 3223 | 2231 | 4160 | 1929 | 46.4% |
| A | 36322 | 6449 | 1174 | 4160 | 2988 | 71.8% |
| N | 31385 | 5950 | 4584 | 5440 | 863 | 15.9% |
| B | 30479 | 5477 | 3354 | 4480 | 1127 | 25.2% |
| R | 28213 | 5424 | 2809 | 3840 | 1033 | 26.9% |
| S | 23598 | 2116 | 3471 | 12800 | 9329 | 72.9% |
| Q | 14074 | 3124 | 2266 | 2560 | 1114 | 43.5% |
| L | 9088 | 1318 | 736 | 2240 | 188 | 8.4% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 6449 | 2.02 |
| beastChainMoves | 1925 | 0.60 |
| beastChainCaptures | 2116 | 0.66 |
| maesterSwaps | 14674 | 4.59 |
| maesterLongSwaps | 4064 | 1.27 |
| paladinSacrifices | 1318 | 0.41 |
| promotions | 901 | 0.28 |
| checks | 21546 | 6.73 |

## Degeneracy counters
| counter | value |
|---|---|
| guard captures per game | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 368 (11.5%) |
| games where a king never moved | 540 (16.9%) |

## Interest terms, residualised on draw rate
Each term minus what this run's `term ~ a + b·drawRate` line predicts from the arrangement's draw
rate. The mean over the arrangements is 0 by construction, so read differences between pools, never
levels. Overall row, fitted on the 20 arrangements:
| killerMove | leadChange | uncertaintyLate | drama | permanence | fairyUse | excessDecisiveness | interest | interestMinFairy |
|---|---|---|---|---|---|---|---|---|
| 0.000 | 0.000 | -0.000 | 0.000 | 0.000 | 0.010 | 0.000 | 0.002 | 0.001 |

## Balance axis — back ranks by |white score − 0.5| (ascending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| SBMNMNKS | 160 | 46 | 68 | 46 | 0.500 | 0.441–0.559 | +0 ±41 | 57.5% | 41.9% | 0.6% | 125.4±54.8 | 0.29 | 0.055 | 0.665 | 0.12 | 0.97 | 0.49 | 1.40 | 0.031 | 0.479 | 0.376 | - |
| SNMKGRQS | 160 | 47 | 67 | 46 | 0.503 | 0.444–0.562 | +2 ±41 | 58.1% | 39.4% | 2.5% | 130.4±72.8 | 0.29 | 0.037 | 0.646 | 0.12 | 0.97 | 0.41 | 1.73 | 0.037 | 0.481 | 0.363 | - |
| SGMRNKNS | 160 | 45 | 71 | 44 | 0.503 | 0.445–0.561 | +2 ±40 | 55.6% | 40.0% | 4.4% | 140.9±70.6 | 0.31 | 0.043 | 0.658 | 0.12 | 0.97 | 0.38 | 1.79 | 0.012 | 0.485 | 0.361 | - |
| SBAGKGBS | 160 | 27 | 104 | 29 | 0.494 | 0.448–0.540 | -4 ±32 | 35.0% | 51.9% | 13.1% | 166.5±82.2 | 0.19 | 0.034 | 0.650 | 0.06 | 0.97 | 0.37 | 1.67 | -0.194 | 0.439 | 0.332 | timeouts |
| SRNLRAKS | 160 | 56 | 50 | 54 | 0.506 | 0.442–0.570 | +4 ±45 | 68.8% | 28.7% | 2.5% | 119.1±61.9 | 0.28 | 0.036 | 0.630 | 0.11 | 0.97 | 0.40 | 1.15 | 0.143 | 0.482 | 0.363 | - |
| SGRGALKS | 160 | 31 | 102 | 27 | 0.512 | 0.466–0.559 | +9 ±32 | 36.3% | 50.6% | 13.1% | 171.2±82.5 | 0.22 | 0.027 | 0.631 | 0.06 | 0.97 | 0.35 | 1.49 | -0.182 | 0.445 | 0.322 | timeouts |
| SNBMRKGS | 160 | 41 | 82 | 37 | 0.512 | 0.458–0.567 | +9 ±38 | 48.8% | 45.0% | 6.3% | 140.1±69.0 | 0.29 | 0.041 | 0.657 | 0.11 | 0.97 | 0.42 | 1.70 | -0.057 | 0.476 | 0.360 | timeouts |
| SMQMBKAS | 160 | 40 | 75 | 45 | 0.484 | 0.428–0.541 | -11 ±39 | 53.1% | 43.1% | 3.8% | 140.9±68.4 | 0.27 | 0.046 | 0.667 | 0.10 | 0.97 | 0.45 | 1.53 | -0.013 | 0.472 | 0.369 | - |
| SRRKMAGS | 160 | 35 | 84 | 41 | 0.481 | 0.428–0.535 | -13 ±37 | 47.5% | 38.1% | 14.4% | 166.3±82.5 | 0.24 | 0.035 | 0.650 | 0.09 | 0.97 | 0.38 | 1.87 | -0.070 | 0.460 | 0.341 | timeouts |
| SGKANBGS | 160 | 32 | 102 | 26 | 0.519 | 0.472–0.565 | +13 ±32 | 36.3% | 54.4% | 9.4% | 165.6±82.2 | 0.24 | 0.036 | 0.656 | 0.07 | 0.97 | 0.37 | 1.48 | -0.182 | 0.452 | 0.337 | timeouts,drawRate |
| SBLKNQAS | 160 | 59 | 48 | 53 | 0.519 | 0.454–0.584 | +13 ±45 | 70.0% | 29.4% | 0.6% | 109.4±56.6 | 0.29 | 0.026 | 0.615 | 0.10 | 0.97 | 0.40 | 1.06 | 0.155 | 0.482 | 0.363 | - |
| SMRKNARS | 160 | 53 | 62 | 45 | 0.525 | 0.464–0.586 | +17 ±42 | 61.3% | 33.8% | 5.0% | 147.8±65.9 | 0.26 | 0.042 | 0.649 | 0.12 | 0.97 | 0.41 | 1.79 | 0.068 | 0.477 | 0.365 | - |
| SGALNKQS | 160 | 50 | 68 | 42 | 0.525 | 0.466–0.584 | +17 ±41 | 57.5% | 32.5% | 10.0% | 141.8±83.3 | 0.27 | 0.028 | 0.619 | 0.09 | 0.97 | 0.37 | 1.64 | 0.030 | 0.469 | 0.344 | timeouts |
| SAMKBNQS | 160 | 61 | 47 | 52 | 0.528 | 0.463–0.593 | +20 ±45 | 70.6% | 26.9% | 2.5% | 125.3±63.0 | 0.32 | 0.035 | 0.644 | 0.13 | 0.96 | 0.42 | 1.49 | 0.162 | 0.495 | 0.378 | - |
| SQBRNKLS | 160 | 71 | 33 | 56 | 0.547 | 0.478–0.616 | +33 ±48 | 79.4% | 20.0% | 0.6% | 86.4±49.1 | 0.31 | 0.028 | 0.603 | 0.09 | 0.96 | 0.34 | 0.80 | 0.249 | 0.450 | 0.358 | balance |
| SNNBGKRS | 160 | 44 | 56 | 60 | 0.450 | 0.388–0.512 | -35 ±43 | 65.0% | 30.6% | 4.4% | 126.9±65.0 | 0.31 | 0.030 | 0.640 | 0.14 | 0.97 | 0.35 | 1.26 | 0.105 | 0.491 | 0.361 | balance |
| SBAAQKMS | 160 | 41 | 98 | 21 | 0.563 | 0.515–0.610 | +44 ±33 | 38.8% | 51.2% | 10.0% | 174.5±80.5 | 0.23 | 0.034 | 0.650 | 0.07 | 0.97 | 0.34 | 1.70 | -0.158 | 0.452 | 0.341 | balance,timeouts |
| SBLKMNGS | 160 | 52 | 76 | 32 | 0.563 | 0.507–0.618 | +44 ±38 | 52.5% | 41.9% | 5.6% | 146.3±70.3 | 0.26 | 0.035 | 0.647 | 0.08 | 0.97 | 0.42 | 1.85 | -0.020 | 0.467 | 0.352 | balance,timeouts |
| SBGKAGNS | 160 | 45 | 91 | 24 | 0.566 | 0.516–0.615 | +46 ±35 | 43.1% | 43.8% | 13.1% | 172.4±81.6 | 0.24 | 0.034 | 0.640 | 0.08 | 0.97 | 0.37 | 1.43 | -0.114 | 0.456 | 0.344 | balance,timeouts |
| SQGKBLMS | 160 | 57 | 73 | 30 | 0.584 | 0.529–0.640 | +59 ±39 | 54.4% | 39.4% | 6.3% | 133.4±74.0 | 0.28 | 0.027 | 0.632 | 0.08 | 0.97 | 0.40 | 1.75 | -0.002 | 0.471 | 0.352 | balance,timeouts |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| SAMKBNQS | 160 | 61 | 47 | 52 | 0.528 | 0.463–0.593 | +20 ±45 | 70.6% | 26.9% | 2.5% | 125.3±63.0 | 0.32 | 0.035 | 0.644 | 0.13 | 0.96 | 0.42 | 1.49 | 0.162 | 0.495 | 0.378 | - |
| SNNBGKRS | 160 | 44 | 56 | 60 | 0.450 | 0.388–0.512 | -35 ±43 | 65.0% | 30.6% | 4.4% | 126.9±65.0 | 0.31 | 0.030 | 0.640 | 0.14 | 0.97 | 0.35 | 1.26 | 0.105 | 0.491 | 0.361 | balance |
| SGMRNKNS | 160 | 45 | 71 | 44 | 0.503 | 0.445–0.561 | +2 ±40 | 55.6% | 40.0% | 4.4% | 140.9±70.6 | 0.31 | 0.043 | 0.658 | 0.12 | 0.97 | 0.38 | 1.79 | 0.012 | 0.485 | 0.361 | - |
| SRNLRAKS | 160 | 56 | 50 | 54 | 0.506 | 0.442–0.570 | +4 ±45 | 68.8% | 28.7% | 2.5% | 119.1±61.9 | 0.28 | 0.036 | 0.630 | 0.11 | 0.97 | 0.40 | 1.15 | 0.143 | 0.482 | 0.363 | - |
| SBLKNQAS | 160 | 59 | 48 | 53 | 0.519 | 0.454–0.584 | +13 ±45 | 70.0% | 29.4% | 0.6% | 109.4±56.6 | 0.29 | 0.026 | 0.615 | 0.10 | 0.97 | 0.40 | 1.06 | 0.155 | 0.482 | 0.363 | - |
| SNMKGRQS | 160 | 47 | 67 | 46 | 0.503 | 0.444–0.562 | +2 ±41 | 58.1% | 39.4% | 2.5% | 130.4±72.8 | 0.29 | 0.037 | 0.646 | 0.12 | 0.97 | 0.41 | 1.73 | 0.037 | 0.481 | 0.363 | - |
| SBMNMNKS | 160 | 46 | 68 | 46 | 0.500 | 0.441–0.559 | +0 ±41 | 57.5% | 41.9% | 0.6% | 125.4±54.8 | 0.29 | 0.055 | 0.665 | 0.12 | 0.97 | 0.49 | 1.40 | 0.031 | 0.479 | 0.376 | - |
| SMRKNARS | 160 | 53 | 62 | 45 | 0.525 | 0.464–0.586 | +17 ±42 | 61.3% | 33.8% | 5.0% | 147.8±65.9 | 0.26 | 0.042 | 0.649 | 0.12 | 0.97 | 0.41 | 1.79 | 0.068 | 0.477 | 0.365 | - |
| SNBMRKGS | 160 | 41 | 82 | 37 | 0.512 | 0.458–0.567 | +9 ±38 | 48.8% | 45.0% | 6.3% | 140.1±69.0 | 0.29 | 0.041 | 0.657 | 0.11 | 0.97 | 0.42 | 1.70 | -0.057 | 0.476 | 0.360 | timeouts |
| SMQMBKAS | 160 | 40 | 75 | 45 | 0.484 | 0.428–0.541 | -11 ±39 | 53.1% | 43.1% | 3.8% | 140.9±68.4 | 0.27 | 0.046 | 0.667 | 0.10 | 0.97 | 0.45 | 1.53 | -0.013 | 0.472 | 0.369 | - |
| SQGKBLMS | 160 | 57 | 73 | 30 | 0.584 | 0.529–0.640 | +59 ±39 | 54.4% | 39.4% | 6.3% | 133.4±74.0 | 0.28 | 0.027 | 0.632 | 0.08 | 0.97 | 0.40 | 1.75 | -0.002 | 0.471 | 0.352 | balance,timeouts |
| SGALNKQS | 160 | 50 | 68 | 42 | 0.525 | 0.466–0.584 | +17 ±41 | 57.5% | 32.5% | 10.0% | 141.8±83.3 | 0.27 | 0.028 | 0.619 | 0.09 | 0.97 | 0.37 | 1.64 | 0.030 | 0.469 | 0.344 | timeouts |
| SBLKMNGS | 160 | 52 | 76 | 32 | 0.563 | 0.507–0.618 | +44 ±38 | 52.5% | 41.9% | 5.6% | 146.3±70.3 | 0.26 | 0.035 | 0.647 | 0.08 | 0.97 | 0.42 | 1.85 | -0.020 | 0.467 | 0.352 | balance,timeouts |
| SRRKMAGS | 160 | 35 | 84 | 41 | 0.481 | 0.428–0.535 | -13 ±37 | 47.5% | 38.1% | 14.4% | 166.3±82.5 | 0.24 | 0.035 | 0.650 | 0.09 | 0.97 | 0.38 | 1.87 | -0.070 | 0.460 | 0.341 | timeouts |
| SBGKAGNS | 160 | 45 | 91 | 24 | 0.566 | 0.516–0.615 | +46 ±35 | 43.1% | 43.8% | 13.1% | 172.4±81.6 | 0.24 | 0.034 | 0.640 | 0.08 | 0.97 | 0.37 | 1.43 | -0.114 | 0.456 | 0.344 | balance,timeouts |
| SGKANBGS | 160 | 32 | 102 | 26 | 0.519 | 0.472–0.565 | +13 ±32 | 36.3% | 54.4% | 9.4% | 165.6±82.2 | 0.24 | 0.036 | 0.656 | 0.07 | 0.97 | 0.37 | 1.48 | -0.182 | 0.452 | 0.337 | timeouts,drawRate |
| SBAAQKMS | 160 | 41 | 98 | 21 | 0.563 | 0.515–0.610 | +44 ±33 | 38.8% | 51.2% | 10.0% | 174.5±80.5 | 0.23 | 0.034 | 0.650 | 0.07 | 0.97 | 0.34 | 1.70 | -0.158 | 0.452 | 0.341 | balance,timeouts |
| SQBRNKLS | 160 | 71 | 33 | 56 | 0.547 | 0.478–0.616 | +33 ±48 | 79.4% | 20.0% | 0.6% | 86.4±49.1 | 0.31 | 0.028 | 0.603 | 0.09 | 0.96 | 0.34 | 0.80 | 0.249 | 0.450 | 0.358 | balance |
| SGRGALKS | 160 | 31 | 102 | 27 | 0.512 | 0.466–0.559 | +9 ±32 | 36.3% | 50.6% | 13.1% | 171.2±82.5 | 0.22 | 0.027 | 0.631 | 0.06 | 0.97 | 0.35 | 1.49 | -0.182 | 0.445 | 0.322 | timeouts |
| SBAGKGBS | 160 | 27 | 104 | 29 | 0.494 | 0.448–0.540 | -4 ±32 | 35.0% | 51.9% | 13.1% | 166.5±82.2 | 0.19 | 0.034 | 0.650 | 0.06 | 0.97 | 0.37 | 1.67 | -0.194 | 0.439 | 0.332 | timeouts |

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
