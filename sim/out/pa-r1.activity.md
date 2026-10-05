# Piece activity: pa-r1

Files: `sim/out/pa-r1.jsonl`. Pool not stamped in the records (today's: QORRBBNNAAGMMSS).
12000 games counted. Left out: 0 with a king power or cards, 0 that did not replay.
Counted: ordinary piece moves and their captures only (no king power or card move). Random opening plies: not counted.
Pawns and kings are not reported and not in the averages. The capture average leaves out the guard (it captures nothing by rule). Intervals: 95%, 1000 resamples of the games.

## Moves, captures and use

| piece | games with it | pieces (start) | moves / piece | × average | captures / piece | × average | never moved | moved in the game | first move (median ply) |
|---|---|---|---|---|---|---|---|---|---|
| Q queen | 5737 | 11474 | 5.76 | 1.16 [1.14, 1.18] | 1.10 | 1.14 [1.11, 1.16] | 10.5% | 95.3% | 31.0 |
| O ogre | 5708 | 11416 | 4.86 | 0.98 [0.96, 1.01] | 0.49 | 0.50 [0.49, 0.52] | 12.9% | 94.4% | 22.0 |
| R rook | 8888 | 22706 | 3.96 | 0.80 [0.78, 0.81] | 0.83 | 0.86 [0.85, 0.88] | 18.8% | 92.7% | 38.0 |
| B bishop | 8479 | 19826 | 3.48 | 0.70 [0.69, 0.71] | 0.79 | 0.83 [0.81, 0.84] | 7.1% | 98.2% | 19.0 |
| N knight | 8904 | 22820 | 3.85 | 0.78 [0.77, 0.78] | 0.70 | 0.73 [0.72, 0.74] | 1.6% | 99.9% | 7.0 |
| A archer | 8869 | 22736 | 8.30 | 1.67 [1.65, 1.69] | 2.03 | 2.11 [2.08, 2.13] | 3.3% | 99.1% | 15.0 |
| G guard | 5741 | 11482 | 2.79 | 0.56 [0.54, 0.59] | 0.00 | cannot capture | 29.8% | 80.3% | 33.0 |
| M maester | 8926 | 22806 | 5.71 | 1.15 [1.14, 1.16] | 0.53 | 0.55 [0.54, 0.56] | 7.4% | 98.0% | 20.0 |
| S beast | 8882 | 22734 | 5.06 | 1.02 [1.01, 1.03] | 1.05 | 1.08 [1.06, 1.11] | 4.9% | 99.1% | 18.0 |

Per piece = over the pieces that started on the board. "Never moved": share of starting pieces that made no counted move. "Moved in the game": share of the games with the piece where at least one of them moved (either side). First move: the ply of each starting piece's first counted move, among those that moved.

## Activity by phase

Activity = (moves + captures) per piece on the board per turn of its side, in that phase.

| piece | opening (plies 1–30) | × average | middle (31–80) | × average | end (81+) | × average | whole game | best phase / own whole game |
|---|---|---|---|---|---|---|---|---|
| Q queen | 0.065 | 0.54 | 0.212 | 1.15 | 0.434 | 1.66 | 0.195 | 2.23 |
| O ogre | 0.078 | 0.64 | 0.136 | 0.74 | 0.266 | 1.02 | 0.143 | 1.86 |
| R rook | 0.037 | 0.30 | 0.165 | 0.90 | 0.378 | 1.45 | 0.148 | 2.56 |
| B bishop | 0.110 | 0.90 | 0.173 | 0.94 | 0.240 | 0.92 | 0.154 | 1.55 |
| N knight | 0.225 | 1.86 | 0.210 | 1.15 | 0.246 | 0.94 | 0.221 | 1.11 |
| A archer | 0.204 | 1.68 | 0.286 | 1.56 | 0.308 | 1.18 | 0.264 | 1.17 |
| G guard | 0.027 | 0.22 | 0.033 | 0.18 | 0.108 | 0.41 | 0.056 | 1.93 |
| M maester | 0.110 | 0.91 | 0.192 | 1.05 | 0.281 | 1.08 | 0.178 | 1.58 |
| S beast | 0.147 | 1.21 | 0.181 | 0.99 | 0.221 | 0.85 | 0.176 | 1.25 |
| average piece | 0.121 | 1.00 | 0.183 | 1.00 | 0.261 | 1.00 | | |

## With and without the piece in the army

Games whose army includes the piece minus games whose army does not.

| piece | games with | without | draws Δ (points) | White's score Δ (points) | length Δ |
|---|---|---|---|---|---|
| Q queen | 5737 | 6263 | -2.6 [-3.9, -1.1] | +0.8 [-0.8, +2.3] | -8.8% [-10.4%, -7.1%] |
| O ogre | 5708 | 6292 | +0.3 [-1.1, +1.7] | +0.9 [-0.6, +2.6] | 0.1% [-1.8%, 1.8%] |
| R rook | 8888 | 3112 | -0.6 [-2.1, +1.0] | -0.3 [-2.3, +1.5] | -0.8% [-2.8%, 1.2%] |
| B bishop | 8479 | 3521 | +0.8 [-0.7, +2.2] | -0.9 [-2.8, +1.0] | -0.3% [-2.3%, 1.8%] |
| N knight | 8904 | 3096 | +2.3 [+0.6, +3.7] | +1.4 [-0.5, +3.3] | 2.9% [0.7%, 5.2%] |
| A archer | 8869 | 3131 | -6.2 [-8.0, -4.7] | -1.8 [-3.5, +0.0] | -0.6% [-2.8%, 1.5%] |
| G guard | 5741 | 6259 | +3.2 [+1.9, +4.6] | -0.9 [-2.7, +0.7] | 7.0% [5.1%, 8.9%] |
| M maester | 8926 | 3074 | +3.1 [+1.5, +4.6] | -0.5 [-2.5, +1.4] | 8.3% [6.1%, 10.5%] |
| S beast | 8882 | 3118 | -3.1 [-4.7, -1.5] | -0.5 [-2.2, +1.5] | -7.6% [-9.5%, -5.9%] |
| all games | 12000 | | draws 17.4% | White 51.7% | 101.1 plies |

## Criteria 2–6

PASS / FAIL: the whole 95% interval is on that side of the line; pass? / fail?: the point is, the interval crosses it.

| piece | 2 captures 0.5–1.5× | 3 moves ≥ 0.5× | 4 a phase ≥ own whole game | 4b a phase ≥ average piece | 5 moved ≥ 85% | 6 draws ±3, White ±2, length ±10% |
|---|---|---|---|---|---|---|
| Q queen | PASS 1.14 [1.11, 1.16] | PASS 1.16 [1.14, 1.18] | PASS 2.23 | PASS 1.66 [1.63, 1.70] | PASS 89.5% [88.8%, 90.2%] | pass? |
| O ogre | pass? 0.50 [0.49, 0.52] | PASS 0.98 [0.96, 1.01] | PASS 1.86 | pass? 1.02 [0.99, 1.06] | PASS 87.1% [86.4%, 87.8%] | pass? |
| R rook | PASS 0.86 [0.85, 0.88] | PASS 0.80 [0.78, 0.81] | PASS 2.56 | PASS 1.45 [1.43, 1.47] | FAIL 81.2% [80.5%, 81.9%] | pass? |
| B bishop | PASS 0.83 [0.81, 0.84] | PASS 0.70 [0.69, 0.71] | PASS 1.55 | FAIL 0.94 [0.93, 0.95] | PASS 92.9% [92.5%, 93.3%] | pass? |
| N knight | PASS 0.73 [0.72, 0.74] | PASS 0.78 [0.77, 0.78] | PASS 1.11 | PASS 1.86 [1.84, 1.88] | PASS 98.4% [98.2%, 98.5%] | pass? |
| A archer | FAIL 2.11 [2.08, 2.13] | PASS 1.67 [1.65, 1.69] | PASS 1.17 | PASS 1.68 [1.66, 1.70] | PASS 96.7% [96.4%, 97.0%] | FAIL (draws) |
| G guard | n/a (cannot capture; flagged) | PASS 0.56 [0.54, 0.59] | PASS 1.93 | FAIL 0.41 [0.39, 0.44] | FAIL 70.2% [69.2%, 71.3%] | fail? (draws) |
| M maester | PASS 0.55 [0.54, 0.56] | PASS 1.15 [1.14, 1.16] | PASS 1.58 | PASS 1.08 [1.06, 1.09] | PASS 92.6% [92.1%, 93.0%] | fail? (draws) |
| S beast | PASS 1.08 [1.06, 1.11] | PASS 1.02 [1.01, 1.03] | PASS 1.25 | PASS 1.21 [1.19, 1.23] | PASS 95.1% [94.7%, 95.4%] | fail? (draws) |

Criterion 4 as written cannot fail: the whole-game activity is a weighted mean of the three phases, so one phase is always at or above it. 4b reads it against the average piece in each phase.
