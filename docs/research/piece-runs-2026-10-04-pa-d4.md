# Piece activity: pa-d4

Files: `sim/out/pa-d4.shard0of2.jsonl`, `sim/out/pa-d4.shard1of2.jsonl`. Pool not stamped in the records (today's: QORRBBNNAAGMMSS).
1600 games counted. Left out: 0 with a king power or cards, 0 that did not replay.
Counted: ordinary piece moves and their captures only (no king power or card move). Random opening plies: not counted.
Pawns and kings are not reported and not in the averages. The capture average leaves out the guard (it captures nothing by rule). Intervals: 95%, 1000 resamples of the games.

## Moves, captures and use

| piece | games with it | pieces (start) | moves / piece | × average | captures / piece | × average | never moved | moved in the game | first move (median ply) |
|---|---|---|---|---|---|---|---|---|---|
| Q queen | 751 | 1502 | 5.81 | 1.09 [1.02, 1.16] | 1.16 | 1.11 [1.05, 1.17] | 9.5% | 97.3% | 30.0 |
| O ogre | 759 | 1518 | 5.06 | 0.95 [0.90, 1.00] | 0.64 | 0.62 [0.57, 0.66] | 11.5% | 95.1% | 27.0 |
| R rook | 1182 | 3050 | 4.47 | 0.84 [0.80, 0.88] | 1.00 | 0.96 [0.92, 0.99] | 17.7% | 93.8% | 38.0 |
| B bishop | 1136 | 2628 | 3.73 | 0.70 [0.67, 0.74] | 0.91 | 0.87 [0.84, 0.91] | 7.1% | 98.3% | 21.0 |
| N knight | 1171 | 3024 | 4.07 | 0.77 [0.74, 0.79] | 0.77 | 0.74 [0.71, 0.77] | 1.9% | 99.9% | 7.0 |
| A archer | 1187 | 3024 | 9.23 | 1.73 [1.68, 1.78] | 2.24 | 2.15 [2.09, 2.21] | 3.9% | 99.3% | 14.0 |
| G guard | 750 | 1500 | 3.52 | 0.66 [0.56, 0.77] | 0.00 | cannot capture | 31.5% | 80.5% | 40.0 |
| M maester | 1189 | 3050 | 5.65 | 1.06 [1.03, 1.10] | 0.59 | 0.57 [0.54, 0.60] | 7.2% | 98.1% | 22.0 |
| S beast | 1212 | 3104 | 5.36 | 1.01 [0.98, 1.04] | 0.88 | 0.84 [0.80, 0.88] | 6.9% | 98.3% | 23.0 |

Per piece = over the pieces that started on the board. "Never moved": share of starting pieces that made no counted move. "Moved in the game": share of the games with the piece where at least one of them moved (either side). First move: the ply of each starting piece's first counted move, among those that moved.

## Activity by phase

Activity = (moves + captures) per piece on the board per turn of its side, in that phase.

| piece | opening (plies 1–30) | × average | middle (31–80) | × average | end (81+) | × average | whole game | best phase / own whole game |
|---|---|---|---|---|---|---|---|---|
| Q queen | 0.079 | 0.64 | 0.241 | 1.25 | 0.506 | 1.77 | 0.213 | 2.37 |
| O ogre | 0.073 | 0.59 | 0.145 | 0.75 | 0.261 | 0.91 | 0.147 | 1.77 |
| R rook | 0.045 | 0.37 | 0.188 | 0.97 | 0.431 | 1.51 | 0.171 | 2.52 |
| B bishop | 0.113 | 0.91 | 0.189 | 0.98 | 0.285 | 1.00 | 0.169 | 1.68 |
| N knight | 0.233 | 1.89 | 0.231 | 1.19 | 0.290 | 1.01 | 0.237 | 1.22 |
| A archer | 0.256 | 2.08 | 0.326 | 1.69 | 0.346 | 1.21 | 0.306 | 1.13 |
| G guard | 0.021 | 0.17 | 0.029 | 0.15 | 0.137 | 0.48 | 0.066 | 2.09 |
| M maester | 0.097 | 0.79 | 0.174 | 0.90 | 0.295 | 1.03 | 0.170 | 1.74 |
| S beast | 0.104 | 0.84 | 0.178 | 0.92 | 0.255 | 0.89 | 0.168 | 1.52 |
| average piece | 0.123 | 1.00 | 0.193 | 1.00 | 0.286 | 1.00 | | |

## With and without the piece in the army

Games whose army includes the piece minus games whose army does not.

| piece | games with | without | draws Δ (points) | White's score Δ (points) | length Δ |
|---|---|---|---|---|---|
| Q queen | 751 | 849 | -3.0 [-7.2, +1.2] | -1.3 [-5.6, +2.8] | -8.6% [-12.9%, -4.2%] |
| O ogre | 759 | 841 | -1.5 [-5.9, +3.0] | -0.6 [-4.6, +4.0] | 3.9% [-1.4%, 9.3%] |
| R rook | 1182 | 418 | +0.6 [-4.3, +5.2] | -1.0 [-5.5, +3.5] | 5.1% [-0.5%, 11.2%] |
| B bishop | 1136 | 464 | -2.3 [-7.1, +2.1] | +3.1 [-1.7, +7.4] | 1.4% [-3.8%, 7.0%] |
| N knight | 1171 | 429 | +2.8 [-1.8, +7.3] | +2.7 [-2.1, +7.5] | -1.0% [-6.2%, 4.7%] |
| A archer | 1187 | 413 | -7.0 [-11.9, -1.9] | -0.6 [-5.6, +4.1] | -10.3% [-15.0%, -5.3%] |
| G guard | 750 | 850 | +5.9 [+1.5, +9.8] | -6.1 [-10.4, -1.7] | 6.2% [1.0%, 11.5%] |
| M maester | 1189 | 411 | +1.1 [-3.9, +6.1] | +2.8 [-2.1, +7.6] | 7.7% [1.4%, 14.5%] |
| S beast | 1212 | 388 | -1.2 [-6.1, +4.1] | -5.0 [-10.3, -0.1] | -5.4% [-10.2%, -0.2%] |
| all games | 1600 | | draws 24.6% | White 51.7% | 110.3 plies |

## Criteria 2–6

PASS / FAIL: the whole 95% interval is on that side of the line; pass? / fail?: the point is, the interval crosses it.

| piece | 2 captures 0.5–1.5× | 3 moves ≥ 0.5× | 4 a phase ≥ own whole game | 4b a phase ≥ average piece | 5 moved ≥ 85% | 6 draws ±3, White ±2, length ±10% |
|---|---|---|---|---|---|---|
| Q queen | PASS 1.11 [1.05, 1.17] | PASS 1.09 [1.02, 1.16] | PASS 2.37 | PASS 1.77 [1.66, 1.88] | PASS 90.5% [88.8%, 92.0%] | pass? |
| O ogre | PASS 0.62 [0.57, 0.66] | PASS 0.95 [0.90, 1.00] | PASS 1.77 | FAIL 0.91 [0.86, 0.96] | PASS 88.5% [86.6%, 90.3%] | pass? |
| R rook | PASS 0.96 [0.92, 0.99] | PASS 0.84 [0.80, 0.88] | PASS 2.52 | PASS 1.51 [1.45, 1.57] | FAIL 82.3% [80.7%, 84.0%] | pass? |
| B bishop | PASS 0.87 [0.84, 0.91] | PASS 0.70 [0.67, 0.74] | PASS 1.68 | fail? 1.00 [0.96, 1.05] | PASS 92.9% [91.8%, 94.0%] | fail? (White) |
| N knight | PASS 0.74 [0.71, 0.77] | PASS 0.77 [0.74, 0.79] | PASS 1.22 | PASS 1.89 [1.85, 1.94] | PASS 98.1% [97.5%, 98.6%] | fail? (White) |
| A archer | FAIL 2.15 [2.09, 2.21] | PASS 1.73 [1.68, 1.78] | PASS 1.13 | PASS 2.08 [2.02, 2.14] | PASS 96.1% [95.2%, 97.0%] | fail? (draws, length) |
| G guard | n/a (cannot capture; flagged) | PASS 0.66 [0.56, 0.77] | PASS 2.09 | FAIL 0.48 [0.41, 0.56] | FAIL 68.5% [65.8%, 71.3%] | fail? (draws, White) |
| M maester | PASS 0.57 [0.54, 0.60] | PASS 1.06 [1.03, 1.10] | PASS 1.74 | pass? 1.03 [0.99, 1.07] | PASS 92.8% [91.8%, 93.8%] | fail? (White) |
| S beast | PASS 0.84 [0.80, 0.88] | PASS 1.01 [0.98, 1.04] | PASS 1.52 | FAIL 0.92 [0.90, 0.95] | PASS 93.1% [92.0%, 94.2%] | fail? (White) |

Criterion 4 as written cannot fail: the whole-game activity is a weighted mean of the three phases, so one phase is always at or above it. 4b reads it against the average piece in each phase.
