# Sim report — ab-chains.var

200 games. White score **0.547** (95% 0.490–0.605),
white advantage **+33 ± 40 Elo**.
Decisive 69.5% · draws 23.0% · capped 7.5% (counted apart, never as draws).
Plies: mean 140.1 ± 77.5, median 119. Rules changed from the defaults: `beastChains=false`.

No complete colour-swapped pairs in this run.
σ_pg 0.4141 · normalized Elo +40 · LOS 94.8% ·
SPRT LLR 0.25 against ±2.94 (nElo 0 vs 4) → **continue**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | xDec | interest | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 200 | 79 | 61 | 60 | 0.547 | 0.490–0.605 | +33 ±40 | 69.5% | 23.0% | 7.5% | 140.1±77.5 | 0.34 | 0.033 | 0.625 | 0.12 | 0.97 | 0.42 | -0.008 | 0.394 | balance,timeouts |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | Q | A | R | S | B | L | G | K | P | N | M |
|---|---|---|---|---|---|---|---|---|---|---|---|
| use | 1.45 | 1.66 | 1.34 | 0.54 | 1.38 | 1.33 | 2.09 | 2.14 | 0.42 | 1.16 | 2.28 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 138 | 69.0% |
| adjudicatedDraw | 27 | 13.5% |
| plyCap | 15 | 7.5% |
| draw50 | 10 | 5.0% |
| drawRepetition | 6 | 3.0% |
| drawMaterial | 3 | 1.5% |
| checkmate | 1 | 0.5% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| P | 5865 | 1162 | 2189 | 3200 | 926 | 28.9% |
| M | 3797 | 300 | 192 | 380 | 188 | 49.5% |
| K | 3755 | 224 | 0 | 400 | 400 | 100.0% |
| G | 3290 | 0 | 19 | 360 | 349 | 96.9% |
| A | 2910 | 474 | 150 | 400 | 250 | 62.5% |
| N | 2333 | 500 | 403 | 460 | 57 | 12.4% |
| R | 2224 | 404 | 282 | 380 | 98 | 25.8% |
| B | 1330 | 264 | 176 | 220 | 44 | 20.0% |
| L | 1046 | 109 | 47 | 180 | 24 | 13.3% |
| Q | 762 | 140 | 109 | 120 | 88 | 73.3% |
| S | 709 | 142 | 152 | 300 | 148 | 49.3% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 474 | 2.37 |
| beastChainMoves | 142 | 0.71 |
| beastChainCaptures | 142 | 0.71 |
| maesterSwaps | 1320 | 6.60 |
| maesterLongSwaps | 265 | 1.32 |
| paladinSacrifices | 109 | 0.55 |
| promotions | 85 | 0.42 |
| checks | 1072 | 5.36 |

## Balance axis — back ranks by |white score − 0.5| (ascending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | xDec | interest | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| QARSBLGK | 10 | 5 | 0 | 5 | 0.500 | 0.190–0.810 | +0 ±215 | 100.0% | 0.0% | 0.0% | 139.7±81.8 | 0.40 | 0.020 | 0.617 | 0.17 | 0.96 | 0.44 | 0.288 | 0.430 | - |
| RNKSLGAS | 10 | 4 | 2 | 4 | 0.500 | 0.223–0.777 | +0 ±193 | 80.0% | 10.0% | 10.0% | 136.7±82.4 | 0.19 | 0.017 | 0.600 | 0.10 | 0.96 | 0.41 | 0.088 | 0.350 | timeouts |
| RNMSAKGR | 10 | 4 | 2 | 4 | 0.500 | 0.223–0.777 | +0 ±193 | 80.0% | 20.0% | 0.0% | 137.5±51.3 | 0.36 | 0.038 | 0.644 | 0.15 | 0.97 | 0.44 | 0.088 | 0.410 | - |
| GKLAMNMS | 10 | 2 | 6 | 2 | 0.500 | 0.304–0.696 | +0 ±136 | 40.0% | 50.0% | 10.0% | 165.2±73.2 | 0.39 | 0.049 | 0.638 | 0.15 | 0.96 | 0.38 | -0.312 | 0.395 | timeouts,drawRate |
| AMNKRRQL | 10 | 3 | 3 | 4 | 0.450 | 0.193–0.707 | -35 ±179 | 70.0% | 30.0% | 0.0% | 127.2±72.7 | 0.38 | 0.050 | 0.606 | 0.10 | 0.97 | 0.42 | -0.002 | 0.487 | balance |
| GKRNMMRG | 10 | 2 | 5 | 3 | 0.450 | 0.233–0.667 | -35 ±151 | 50.0% | 40.0% | 10.0% | 151.6±85.9 | 0.29 | 0.072 | 0.677 | 0.15 | 0.97 | 0.37 | -0.202 | 0.467 | balance,timeouts |
| RRSAQNMK | 10 | 4 | 3 | 3 | 0.550 | 0.293–0.807 | +35 ±179 | 70.0% | 20.0% | 10.0% | 124.8±68.1 | 0.27 | 0.028 | 0.642 | 0.13 | 0.97 | 0.45 | -0.002 | 0.393 | balance,timeouts |
| NSGGMAKL | 10 | 3 | 5 | 2 | 0.550 | 0.333–0.767 | +35 ±151 | 50.0% | 40.0% | 10.0% | 192.3±67.7 | 0.26 | 0.028 | 0.585 | 0.07 | 0.97 | 0.34 | -0.202 | 0.335 | balance,timeouts |
| BGKNMQLN | 10 | 5 | 1 | 4 | 0.550 | 0.258–0.842 | +35 ±203 | 90.0% | 10.0% | 0.0% | 91.7±36.8 | 0.25 | 0.029 | 0.597 | 0.09 | 0.97 | 0.52 | 0.198 | 0.473 | balance |
| RSNSKNAB | 10 | 3 | 2 | 5 | 0.400 | 0.130–0.670 | -70 ±188 | 80.0% | 20.0% | 0.0% | 134.2±57.4 | 0.34 | 0.018 | 0.591 | 0.20 | 0.97 | 0.46 | 0.107 | 0.393 | balance |
| BRNMSKMA | 10 | 5 | 2 | 3 | 0.600 | 0.330–0.870 | +70 ±188 | 80.0% | 20.0% | 0.0% | 114.3±71.1 | 0.43 | 0.026 | 0.643 | 0.09 | 0.96 | 0.49 | 0.107 | 0.407 | balance |
| NRRKBAGM | 10 | 5 | 2 | 3 | 0.600 | 0.330–0.870 | +70 ±188 | 80.0% | 20.0% | 0.0% | 131.6±50.4 | 0.48 | 0.040 | 0.676 | 0.16 | 0.97 | 0.46 | 0.107 | 0.456 | balance |
| KBGNGMMA | 10 | 2 | 4 | 4 | 0.400 | 0.168–0.632 | -70 ±161 | 60.0% | 30.0% | 10.0% | 125.5±66.6 | 0.41 | 0.049 | 0.663 | 0.12 | 0.96 | 0.51 | -0.093 | 0.497 | balance,timeouts |
| MGQMBSNK | 10 | 5 | 2 | 3 | 0.600 | 0.330–0.870 | +70 ±188 | 80.0% | 20.0% | 0.0% | 164.3±62.0 | 0.51 | 0.033 | 0.643 | 0.20 | 0.96 | 0.43 | 0.107 | 0.424 | balance |
| KSGNANLQ | 10 | 5 | 3 | 2 | 0.650 | 0.408–0.892 | +108 ±168 | 70.0% | 20.0% | 10.0% | 131.3±80.3 | 0.38 | 0.015 | 0.582 | 0.11 | 0.96 | 0.30 | 0.016 | 0.352 | balance,timeouts |
| KNGNBRAB | 10 | 5 | 3 | 2 | 0.650 | 0.408–0.892 | +108 ±168 | 70.0% | 20.0% | 10.0% | 129.0±87.7 | 0.35 | 0.032 | 0.653 | 0.19 | 0.96 | 0.44 | 0.016 | 0.500 | balance,timeouts |
| SSARANKM | 10 | 4 | 5 | 1 | 0.650 | 0.452–0.848 | +108 ±138 | 50.0% | 20.0% | 30.0% | 198.2±88.1 | 0.31 | 0.022 | 0.637 | 0.11 | 0.97 | 0.31 | -0.184 | 0.383 | balance,timeouts |
| ASGLABKM | 10 | 1 | 5 | 4 | 0.350 | 0.152–0.548 | -108 ±138 | 50.0% | 20.0% | 30.0% | 204.8±81.0 | 0.26 | 0.052 | 0.616 | 0.12 | 0.96 | 0.33 | -0.184 | 0.346 | balance,timeouts |
| GALMRRKN | 10 | 5 | 4 | 1 | 0.700 | 0.494–0.906 | +147 ±143 | 60.0% | 30.0% | 10.0% | 124.3±74.6 | 0.17 | 0.026 | 0.607 | 0.04 | 0.97 | 0.41 | -0.075 | 0.412 | balance,timeouts |
| GRBNANKA | 10 | 7 | 2 | 1 | 0.800 | 0.594–1.000 | +241 ±143 | 80.0% | 20.0% | 0.0% | 77.9±50.1 | 0.36 | 0.005 | 0.591 | 0.00 | 0.96 | 0.58 | 0.143 | 0.484 | balance |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | xDec | interest | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| KNGNBRAB | 10 | 5 | 3 | 2 | 0.650 | 0.408–0.892 | +108 ±168 | 70.0% | 20.0% | 10.0% | 129.0±87.7 | 0.35 | 0.032 | 0.653 | 0.19 | 0.96 | 0.44 | 0.016 | 0.500 | balance,timeouts |
| KBGNGMMA | 10 | 2 | 4 | 4 | 0.400 | 0.168–0.632 | -70 ±161 | 60.0% | 30.0% | 10.0% | 125.5±66.6 | 0.41 | 0.049 | 0.663 | 0.12 | 0.96 | 0.51 | -0.093 | 0.497 | balance,timeouts |
| AMNKRRQL | 10 | 3 | 3 | 4 | 0.450 | 0.193–0.707 | -35 ±179 | 70.0% | 30.0% | 0.0% | 127.2±72.7 | 0.38 | 0.050 | 0.606 | 0.10 | 0.97 | 0.42 | -0.002 | 0.487 | balance |
| GRBNANKA | 10 | 7 | 2 | 1 | 0.800 | 0.594–1.000 | +241 ±143 | 80.0% | 20.0% | 0.0% | 77.9±50.1 | 0.36 | 0.005 | 0.591 | 0.00 | 0.96 | 0.58 | 0.143 | 0.484 | balance |
| BGKNMQLN | 10 | 5 | 1 | 4 | 0.550 | 0.258–0.842 | +35 ±203 | 90.0% | 10.0% | 0.0% | 91.7±36.8 | 0.25 | 0.029 | 0.597 | 0.09 | 0.97 | 0.52 | 0.198 | 0.473 | balance |
| GKRNMMRG | 10 | 2 | 5 | 3 | 0.450 | 0.233–0.667 | -35 ±151 | 50.0% | 40.0% | 10.0% | 151.6±85.9 | 0.29 | 0.072 | 0.677 | 0.15 | 0.97 | 0.37 | -0.202 | 0.467 | balance,timeouts |
| NRRKBAGM | 10 | 5 | 2 | 3 | 0.600 | 0.330–0.870 | +70 ±188 | 80.0% | 20.0% | 0.0% | 131.6±50.4 | 0.48 | 0.040 | 0.676 | 0.16 | 0.97 | 0.46 | 0.107 | 0.456 | balance |
| QARSBLGK | 10 | 5 | 0 | 5 | 0.500 | 0.190–0.810 | +0 ±215 | 100.0% | 0.0% | 0.0% | 139.7±81.8 | 0.40 | 0.020 | 0.617 | 0.17 | 0.96 | 0.44 | 0.288 | 0.430 | - |
| MGQMBSNK | 10 | 5 | 2 | 3 | 0.600 | 0.330–0.870 | +70 ±188 | 80.0% | 20.0% | 0.0% | 164.3±62.0 | 0.51 | 0.033 | 0.643 | 0.20 | 0.96 | 0.43 | 0.107 | 0.424 | balance |
| GALMRRKN | 10 | 5 | 4 | 1 | 0.700 | 0.494–0.906 | +147 ±143 | 60.0% | 30.0% | 10.0% | 124.3±74.6 | 0.17 | 0.026 | 0.607 | 0.04 | 0.97 | 0.41 | -0.075 | 0.412 | balance,timeouts |
| RNMSAKGR | 10 | 4 | 2 | 4 | 0.500 | 0.223–0.777 | +0 ±193 | 80.0% | 20.0% | 0.0% | 137.5±51.3 | 0.36 | 0.038 | 0.644 | 0.15 | 0.97 | 0.44 | 0.088 | 0.410 | - |
| BRNMSKMA | 10 | 5 | 2 | 3 | 0.600 | 0.330–0.870 | +70 ±188 | 80.0% | 20.0% | 0.0% | 114.3±71.1 | 0.43 | 0.026 | 0.643 | 0.09 | 0.96 | 0.49 | 0.107 | 0.407 | balance |
| GKLAMNMS | 10 | 2 | 6 | 2 | 0.500 | 0.304–0.696 | +0 ±136 | 40.0% | 50.0% | 10.0% | 165.2±73.2 | 0.39 | 0.049 | 0.638 | 0.15 | 0.96 | 0.38 | -0.312 | 0.395 | timeouts,drawRate |
| RSNSKNAB | 10 | 3 | 2 | 5 | 0.400 | 0.130–0.670 | -70 ±188 | 80.0% | 20.0% | 0.0% | 134.2±57.4 | 0.34 | 0.018 | 0.591 | 0.20 | 0.97 | 0.46 | 0.107 | 0.393 | balance |
| RRSAQNMK | 10 | 4 | 3 | 3 | 0.550 | 0.293–0.807 | +35 ±179 | 70.0% | 20.0% | 10.0% | 124.8±68.1 | 0.27 | 0.028 | 0.642 | 0.13 | 0.97 | 0.45 | -0.002 | 0.393 | balance,timeouts |
| SSARANKM | 10 | 4 | 5 | 1 | 0.650 | 0.452–0.848 | +108 ±138 | 50.0% | 20.0% | 30.0% | 198.2±88.1 | 0.31 | 0.022 | 0.637 | 0.11 | 0.97 | 0.31 | -0.184 | 0.383 | balance,timeouts |
| KSGNANLQ | 10 | 5 | 3 | 2 | 0.650 | 0.408–0.892 | +108 ±168 | 70.0% | 20.0% | 10.0% | 131.3±80.3 | 0.38 | 0.015 | 0.582 | 0.11 | 0.96 | 0.30 | 0.016 | 0.352 | balance,timeouts |
| RNKSLGAS | 10 | 4 | 2 | 4 | 0.500 | 0.223–0.777 | +0 ±193 | 80.0% | 10.0% | 10.0% | 136.7±82.4 | 0.19 | 0.017 | 0.600 | 0.10 | 0.96 | 0.41 | 0.088 | 0.350 | timeouts |
| ASGLABKM | 10 | 1 | 5 | 4 | 0.350 | 0.152–0.548 | -108 ±138 | 50.0% | 20.0% | 30.0% | 204.8±81.0 | 0.26 | 0.052 | 0.616 | 0.12 | 0.96 | 0.33 | -0.184 | 0.346 | balance,timeouts |
| NSGGMAKL | 10 | 3 | 5 | 2 | 0.550 | 0.333–0.767 | +35 ±151 | 50.0% | 40.0% | 10.0% | 192.3±67.7 | 0.26 | 0.028 | 0.585 | 0.07 | 0.97 | 0.34 | -0.202 | 0.335 | balance,timeouts |

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
