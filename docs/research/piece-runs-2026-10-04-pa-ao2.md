# Piece activity: pa-ao2

Files: `sim/out/pa-ao2.jsonl`. Pool not stamped in the records (today's: QORRBBNNAAGMMS).
9000 games counted. Left out: 0 with a king power or cards, 0 that did not replay.
Counted: ordinary piece moves and their captures only (no king power or card move). Random opening plies: not counted.
Pawns and kings are not reported and not in the averages. The capture average leaves out the guard (it captures nothing by rule). Intervals: 95%, 1000 resamples of the games.

## Moves, captures and use

| piece | games with it | pieces (start) | moves / piece | × average | captures / piece | × average | never moved | moved in the game | first move (median ply) |
|---|---|---|---|---|---|---|---|---|---|
| Q queen | 4582 | 9164 | 6.48 | 1.33 [1.31, 1.36] | 1.41 | 1.61 [1.58, 1.65] | 6.5% | 97.1% | 27.0 |
| O ogre | 4633 | 9266 | 5.03 | 1.03 [1.01, 1.06] | 0.68 | 0.78 [0.75, 0.80] | 9.7% | 96.4% | 22.0 |
| R rook | 7014 | 18348 | 4.68 | 0.96 [0.94, 0.98] | 1.02 | 1.17 [1.15, 1.19] | 15.1% | 95.2% | 38.0 |
| B bishop | 6741 | 16112 | 3.80 | 0.78 [0.77, 0.79] | 0.90 | 1.03 [1.02, 1.05] | 5.7% | 98.5% | 19.0 |
| N knight | 6983 | 18256 | 4.15 | 0.85 [0.84, 0.86] | 0.83 | 0.95 [0.93, 0.96] | 1.3% | 99.9% | 7.0 |
| A archer | 6988 | 18188 | 5.37 | 1.10 [1.09, 1.12] | 0.44 | 0.50 [0.49, 0.51] | 4.3% | 98.8% | 17.0 |
| G guard | 4714 | 9428 | 2.82 | 0.58 [0.56, 0.60] | 0.00 | cannot capture | 25.8% | 84.5% | 31.0 |
| M maester | 6926 | 18052 | 6.00 | 1.23 [1.22, 1.25] | 0.74 | 0.84 [0.83, 0.86] | 5.3% | 98.6% | 19.0 |
| S beast | 4593 | 9186 | 5.58 | 1.15 [1.13, 1.17] | 1.42 | 1.62 [1.58, 1.67] | 3.3% | 99.1% | 17.0 |

Per piece = over the pieces that started on the board. "Never moved": share of starting pieces that made no counted move. "Moved in the game": share of the games with the piece where at least one of them moved (either side). First move: the ply of each starting piece's first counted move, among those that moved.

## Activity by phase

Activity = (moves + captures) per piece on the board per turn of its side, in that phase.

| piece | opening (plies 1–30) | × average | middle (31–80) | × average | end (81+) | × average | whole game | best phase / own whole game |
|---|---|---|---|---|---|---|---|---|
| Q queen | 0.086 | 0.75 | 0.243 | 1.40 | 0.460 | 1.76 | 0.222 | 2.08 |
| O ogre | 0.085 | 0.75 | 0.153 | 0.88 | 0.270 | 1.03 | 0.153 | 1.77 |
| R rook | 0.039 | 0.34 | 0.174 | 1.00 | 0.406 | 1.55 | 0.164 | 2.48 |
| B bishop | 0.121 | 1.06 | 0.192 | 1.11 | 0.257 | 0.98 | 0.170 | 1.51 |
| N knight | 0.238 | 2.09 | 0.244 | 1.40 | 0.311 | 1.19 | 0.245 | 1.27 |
| A archer | 0.114 | 1.00 | 0.155 | 0.90 | 0.220 | 0.84 | 0.153 | 1.44 |
| G guard | 0.030 | 0.27 | 0.034 | 0.19 | 0.102 | 0.39 | 0.055 | 1.85 |
| M maester | 0.119 | 1.05 | 0.208 | 1.20 | 0.301 | 1.15 | 0.192 | 1.57 |
| S beast | 0.164 | 1.45 | 0.189 | 1.09 | 0.246 | 0.94 | 0.192 | 1.28 |
| average piece | 0.114 | 1.00 | 0.173 | 1.00 | 0.262 | 1.00 | | |

## With and without the piece in the army

Games whose army includes the piece minus games whose army does not.

| piece | games with | without | draws Δ (points) | White's score Δ (points) | length Δ |
|---|---|---|---|---|---|
| Q queen | 4582 | 4418 | -1.5 [-3.0, +0.1] | -0.7 [-2.5, +1.3] | -6.5% [-8.2%, -4.6%] |
| O ogre | 4633 | 4367 | -0.1 [-1.8, +1.3] | +2.2 [+0.2, +4.1] | 1.5% [-0.4%, 3.4%] |
| R rook | 7014 | 1986 | -0.8 [-2.7, +1.3] | +2.0 [-0.3, +4.1] | 0.2% [-2.0%, 2.4%] |
| B bishop | 6741 | 2259 | +3.0 [+1.2, +4.7] | +1.3 [-0.8, +3.6] | 1.1% [-1.2%, 3.3%] |
| N knight | 6983 | 2017 | -0.6 [-2.5, +1.3] | +1.0 [-1.4, +3.2] | -1.5% [-3.8%, 0.7%] |
| A archer | 6988 | 2012 | -7.1 [-9.2, -5.2] | +1.2 [-0.8, +3.4] | -4.8% [-6.9%, -2.5%] |
| G guard | 4714 | 4286 | +3.8 [+2.3, +5.3] | -1.4 [-3.3, +0.4] | 7.2% [5.3%, 9.2%] |
| M maester | 6926 | 2074 | +5.0 [+3.2, +6.7] | -2.6 [-4.9, -0.4] | 12.4% [9.7%, 15.1%] |
| S beast | 4593 | 4407 | -4.0 [-5.5, -2.4] | -0.5 [-2.4, +1.1] | -9.5% [-11.3%, -7.7%] |
| all games | 9000 | | draws 17.9% | White 52.0% | 103.8 plies |

## Criteria 2–6

PASS / FAIL: the whole 95% interval is on that side of the line; pass? / fail?: the point is, the interval crosses it.

| piece | 2 captures 0.5–1.5× | 3 moves ≥ 0.5× | 4 a phase ≥ own whole game | 4b a phase ≥ average piece | 5 moved ≥ 85% | 6 draws ±3, White ±2, length ±10% |
|---|---|---|---|---|---|---|
| Q queen | FAIL 1.61 [1.58, 1.65] | PASS 1.33 [1.31, 1.36] | PASS 2.08 | PASS 1.76 [1.73, 1.79] | PASS 93.5% [92.8%, 94.1%] | pass? |
| O ogre | PASS 0.78 [0.75, 0.80] | PASS 1.03 [1.01, 1.06] | PASS 1.77 | PASS 1.03 [1.00, 1.06] | PASS 90.3% [89.6%, 91.0%] | fail? (White) |
| R rook | PASS 1.17 [1.15, 1.19] | PASS 0.96 [0.94, 0.98] | PASS 2.48 | PASS 1.55 [1.53, 1.58] | fail? 84.9% [84.3%, 85.6%] | pass? |
| B bishop | PASS 1.03 [1.02, 1.05] | PASS 0.78 [0.77, 0.79] | PASS 1.51 | PASS 1.11 [1.09, 1.12] | PASS 94.3% [93.9%, 94.8%] | fail? (draws) |
| N knight | PASS 0.95 [0.93, 0.96] | PASS 0.85 [0.84, 0.86] | PASS 1.27 | PASS 2.09 [2.07, 2.11] | PASS 98.7% [98.5%, 98.9%] | pass? |
| A archer | fail? 0.50 [0.49, 0.51] | PASS 1.10 [1.09, 1.12] | PASS 1.44 | pass? 1.00 [0.99, 1.01] | PASS 95.7% [95.3%, 96.1%] | FAIL (draws) |
| G guard | n/a (cannot capture; flagged) | PASS 0.58 [0.56, 0.60] | PASS 1.85 | FAIL 0.39 [0.37, 0.41] | FAIL 74.2% [73.2%, 75.2%] | fail? (draws) |
| M maester | PASS 0.84 [0.83, 0.86] | PASS 1.23 [1.22, 1.25] | PASS 1.57 | PASS 1.20 [1.19, 1.22] | PASS 94.7% [94.3%, 95.1%] | FAIL (draws, White, length) |
| S beast | FAIL 1.62 [1.58, 1.67] | PASS 1.15 [1.13, 1.17] | PASS 1.28 | PASS 1.45 [1.42, 1.48] | PASS 96.7% [96.3%, 97.1%] | fail? (draws) |

Criterion 4 as written cannot fail: the whole-game activity is a weighted mean of the three phases, so one phase is always at or above it. 4b reads it against the average piece in each phase.
