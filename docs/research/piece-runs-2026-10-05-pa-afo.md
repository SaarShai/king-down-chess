# Piece activity: pa-afo

Files: `sim/out/pa-afo.jsonl`. Pool not stamped in the records (today's: QORRBBNNAAGMMS).
9000 games counted. Left out: 0 with a king power or cards, 0 that did not replay.
Counted: ordinary piece moves and their captures only (no king power or card move). Random opening plies: not counted.
Pawns and kings are not reported and not in the averages. The capture average leaves out the guard (it captures nothing by rule). Intervals: 95%, 1000 resamples of the games.

## Moves, captures and use

| piece | games with it | pieces (start) | moves / piece | × average | captures / piece | × average | never moved | moved in the game | first move (median ply) |
|---|---|---|---|---|---|---|---|---|---|
| Q queen | 4582 | 9164 | 6.85 | 1.32 [1.29, 1.35] | 1.32 | 1.52 [1.49, 1.55] | 5.3% | 97.4% | 28.0 |
| O ogre | 4633 | 9266 | 5.85 | 1.13 [1.09, 1.16] | 0.65 | 0.74 [0.72, 0.76] | 7.8% | 97.2% | 23.0 |
| R rook | 7014 | 18348 | 4.88 | 0.94 [0.92, 0.96] | 0.96 | 1.11 [1.09, 1.13] | 13.0% | 96.0% | 38.0 |
| B bishop | 6741 | 16112 | 3.85 | 0.74 [0.73, 0.75] | 0.86 | 0.99 [0.98, 1.01] | 4.5% | 98.9% | 19.0 |
| N knight | 6983 | 18256 | 4.11 | 0.79 [0.78, 0.80] | 0.78 | 0.89 [0.88, 0.91] | 1.4% | 99.9% | 7.0 |
| A archer | 6988 | 18188 | 6.01 | 1.16 [1.15, 1.17] | 0.72 | 0.83 [0.81, 0.84] | 2.7% | 99.1% | 17.0 |
| G guard | 4714 | 9428 | 3.22 | 0.62 [0.60, 0.64] | 0.00 | cannot capture | 21.3% | 87.8% | 31.0 |
| M maester | 6926 | 18052 | 6.51 | 1.25 [1.24, 1.27] | 0.68 | 0.78 [0.77, 0.80] | 4.3% | 98.7% | 19.0 |
| S beast | 4593 | 9186 | 5.75 | 1.11 [1.09, 1.13] | 1.32 | 1.52 [1.48, 1.56] | 2.2% | 99.3% | 17.0 |

Per piece = over the pieces that started on the board. "Never moved": share of starting pieces that made no counted move. "Moved in the game": share of the games with the piece where at least one of them moved (either side). First move: the ply of each starting piece's first counted move, among those that moved.

## Activity by phase

Activity = (moves + captures) per piece on the board per turn of its side, in that phase.

| piece | opening (plies 1–30) | × average | middle (31–80) | × average | end (81+) | × average | whole game | best phase / own whole game |
|---|---|---|---|---|---|---|---|---|
| Q queen | 0.079 | 0.70 | 0.229 | 1.36 | 0.439 | 1.80 | 0.216 | 2.03 |
| O ogre | 0.085 | 0.75 | 0.155 | 0.92 | 0.282 | 1.15 | 0.162 | 1.74 |
| R rook | 0.037 | 0.33 | 0.170 | 1.01 | 0.395 | 1.62 | 0.163 | 2.43 |
| B bishop | 0.116 | 1.03 | 0.178 | 1.06 | 0.249 | 1.02 | 0.163 | 1.53 |
| N knight | 0.231 | 2.04 | 0.228 | 1.36 | 0.292 | 1.20 | 0.234 | 1.25 |
| A archer | 0.123 | 1.09 | 0.148 | 0.88 | 0.184 | 0.75 | 0.150 | 1.23 |
| G guard | 0.032 | 0.28 | 0.037 | 0.22 | 0.105 | 0.43 | 0.060 | 1.76 |
| M maester | 0.119 | 1.06 | 0.217 | 1.29 | 0.292 | 1.20 | 0.197 | 1.49 |
| S beast | 0.164 | 1.46 | 0.170 | 1.01 | 0.211 | 0.86 | 0.178 | 1.18 |
| average piece | 0.113 | 1.00 | 0.168 | 1.00 | 0.244 | 1.00 | | |

## With and without the piece in the army

Games whose army includes the piece minus games whose army does not.

| piece | games with | without | draws Δ (points) | White's score Δ (points) | length Δ |
|---|---|---|---|---|---|
| Q queen | 4582 | 4418 | -4.7 [-6.5, -3.0] | +1.0 [-0.9, +2.6] | -6.7% [-8.3%, -4.9%] |
| O ogre | 4633 | 4367 | +0.7 [-1.1, +2.4] | +0.8 [-1.1, +2.6] | 0.9% [-1.2%, 2.7%] |
| R rook | 7014 | 1986 | -2.9 [-5.0, -0.7] | +2.0 [-0.3, +4.0] | -1.9% [-4.1%, 0.5%] |
| B bishop | 6741 | 2259 | +2.4 [+0.5, +4.3] | +0.2 [-1.9, +2.3] | -2.8% [-4.9%, -0.7%] |
| N knight | 6983 | 2017 | -3.2 [-5.2, -1.1] | -0.2 [-2.2, +2.0] | -2.1% [-4.3%, 0.5%] |
| A archer | 6988 | 2012 | -0.0 [-2.3, +1.9] | -0.5 [-2.6, +1.7] | 1.6% [-0.6%, 4.0%] |
| G guard | 4714 | 4286 | +2.2 [+0.6, +4.0] | -0.5 [-2.4, +1.5] | 6.8% [4.9%, 8.9%] |
| M maester | 6926 | 2074 | +5.6 [+3.6, +7.5] | +0.9 [-1.3, +3.1] | 6.7% [4.3%, 9.2%] |
| S beast | 4593 | 4407 | -6.0 [-7.9, -4.4] | -1.6 [-3.5, +0.2] | -6.2% [-7.9%, -4.6%] |
| all games | 9000 | | draws 23.4% | White 50.6% | 109.1 plies |

## Criteria 2–6

PASS / FAIL: the whole 95% interval is on that side of the line; pass? / fail?: the point is, the interval crosses it.

| piece | 2 captures 0.5–1.5× | 3 moves ≥ 0.5× | 4 a phase ≥ own whole game | 4b a phase ≥ average piece | 5 moved ≥ 85% | 6 draws ±3, White ±2, length ±10% |
|---|---|---|---|---|---|---|
| Q queen | fail? 1.52 [1.49, 1.55] | PASS 1.32 [1.29, 1.35] | PASS 2.03 | PASS 1.80 [1.76, 1.83] | PASS 94.7% [94.1%, 95.2%] | fail? (draws) |
| O ogre | PASS 0.74 [0.72, 0.76] | PASS 1.13 [1.09, 1.16] | PASS 1.74 | PASS 1.15 [1.11, 1.20] | PASS 92.2% [91.6%, 92.9%] | pass? |
| R rook | PASS 1.11 [1.09, 1.13] | PASS 0.94 [0.92, 0.96] | PASS 2.43 | PASS 1.62 [1.59, 1.64] | PASS 87.0% [86.4%, 87.6%] | fail? (White) |
| B bishop | PASS 0.99 [0.98, 1.01] | PASS 0.74 [0.73, 0.75] | PASS 1.53 | PASS 1.06 [1.05, 1.08] | PASS 95.5% [95.1%, 95.9%] | pass? |
| N knight | PASS 0.89 [0.88, 0.91] | PASS 0.79 [0.78, 0.80] | PASS 1.25 | PASS 2.04 [2.02, 2.06] | PASS 98.6% [98.4%, 98.8%] | fail? (draws) |
| A archer | PASS 0.83 [0.81, 0.84] | PASS 1.16 [1.15, 1.17] | PASS 1.23 | PASS 1.09 [1.08, 1.11] | PASS 97.3% [97.0%, 97.6%] | pass? |
| G guard | n/a (cannot capture; flagged) | PASS 0.62 [0.60, 0.64] | PASS 1.76 | FAIL 0.43 [0.41, 0.45] | FAIL 78.7% [77.6%, 79.7%] | pass? |
| M maester | PASS 0.78 [0.77, 0.80] | PASS 1.25 [1.24, 1.27] | PASS 1.49 | PASS 1.29 [1.28, 1.30] | PASS 95.7% [95.3%, 96.1%] | FAIL (draws) |
| S beast | fail? 1.52 [1.48, 1.56] | PASS 1.11 [1.09, 1.13] | PASS 1.18 | PASS 1.46 [1.43, 1.49] | PASS 97.8% [97.5%, 98.2%] | FAIL (draws) |

Criterion 4 as written cannot fail: the whole-game activity is a weighted mean of the three phases, so one phase is always at or above it. 4b reads it against the average piece in each phase.
