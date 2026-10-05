# Piece activity: pa-ano

Files: `sim/out/pa-ano.jsonl`. Pool not stamped in the records (today's: QORRBBNNAAGMMS).
9000 games counted. Left out: 0 with a king power or cards, 0 that did not replay.
Counted: ordinary piece moves and their captures only (no king power or card move). Random opening plies: not counted.
Pawns and kings are not reported and not in the averages. The capture average leaves out the guard (it captures nothing by rule). Intervals: 95%, 1000 resamples of the games.

## Moves, captures and use

| piece | games with it | pieces (start) | moves / piece | × average | captures / piece | × average | never moved | moved in the game | first move (median ply) |
|---|---|---|---|---|---|---|---|---|---|
| Q queen | 4582 | 9164 | 7.06 | 1.32 [1.29, 1.35] | 1.31 | 1.47 [1.44, 1.51] | 5.4% | 97.4% | 28.0 |
| O ogre | 4633 | 9266 | 6.02 | 1.12 [1.10, 1.15] | 0.66 | 0.75 [0.73, 0.77] | 7.1% | 97.3% | 23.0 |
| R rook | 7014 | 18348 | 4.85 | 0.91 [0.89, 0.92] | 0.93 | 1.05 [1.04, 1.07] | 13.3% | 96.0% | 38.0 |
| B bishop | 6741 | 16112 | 3.91 | 0.73 [0.72, 0.74] | 0.86 | 0.97 [0.95, 0.98] | 4.5% | 98.9% | 19.0 |
| N knight | 6983 | 18256 | 4.12 | 0.77 [0.76, 0.78] | 0.77 | 0.87 [0.86, 0.88] | 1.4% | 99.9% | 7.0 |
| A archer | 6988 | 18188 | 6.55 | 1.22 [1.21, 1.24] | 0.86 | 0.97 [0.95, 0.98] | 2.6% | 99.1% | 17.0 |
| G guard | 4714 | 9428 | 3.60 | 0.67 [0.65, 0.70] | 0.00 | cannot capture | 20.8% | 87.8% | 31.0 |
| M maester | 6926 | 18052 | 6.64 | 1.24 [1.23, 1.25] | 0.68 | 0.77 [0.75, 0.78] | 4.1% | 98.8% | 19.0 |
| S beast | 4593 | 9186 | 5.86 | 1.09 [1.08, 1.11] | 1.34 | 1.51 [1.47, 1.55] | 2.2% | 99.4% | 17.0 |

Per piece = over the pieces that started on the board. "Never moved": share of starting pieces that made no counted move. "Moved in the game": share of the games with the piece where at least one of them moved (either side). First move: the ply of each starting piece's first counted move, among those that moved.

## Activity by phase

Activity = (moves + captures) per piece on the board per turn of its side, in that phase.

| piece | opening (plies 1–30) | × average | middle (31–80) | × average | end (81+) | × average | whole game | best phase / own whole game |
|---|---|---|---|---|---|---|---|---|
| Q queen | 0.078 | 0.69 | 0.225 | 1.34 | 0.433 | 1.77 | 0.217 | 2.00 |
| O ogre | 0.085 | 0.75 | 0.156 | 0.93 | 0.284 | 1.16 | 0.164 | 1.73 |
| R rook | 0.037 | 0.33 | 0.166 | 0.99 | 0.388 | 1.59 | 0.161 | 2.41 |
| B bishop | 0.116 | 1.03 | 0.177 | 1.05 | 0.241 | 0.99 | 0.162 | 1.49 |
| N knight | 0.229 | 2.03 | 0.227 | 1.35 | 0.285 | 1.17 | 0.233 | 1.22 |
| A archer | 0.124 | 1.10 | 0.153 | 0.91 | 0.196 | 0.80 | 0.158 | 1.24 |
| G guard | 0.032 | 0.28 | 0.037 | 0.22 | 0.115 | 0.47 | 0.065 | 1.78 |
| M maester | 0.119 | 1.06 | 0.217 | 1.29 | 0.291 | 1.19 | 0.198 | 1.47 |
| S beast | 0.164 | 1.46 | 0.171 | 1.02 | 0.207 | 0.85 | 0.178 | 1.16 |
| average piece | 0.113 | 1.00 | 0.168 | 1.00 | 0.244 | 1.00 | | |

## With and without the piece in the army

Games whose army includes the piece minus games whose army does not.

| piece | games with | without | draws Δ (points) | White's score Δ (points) | length Δ |
|---|---|---|---|---|---|
| Q queen | 4582 | 4418 | -4.3 [-6.1, -2.5] | +1.8 [+0.1, +3.6] | -6.8% [-8.5%, -5.0%] |
| O ogre | 4633 | 4367 | -0.2 [-2.1, +1.3] | -0.5 [-2.5, +1.1] | 0.9% [-1.1%, 2.9%] |
| R rook | 7014 | 1986 | -2.2 [-4.3, -0.0] | +1.5 [-0.8, +3.4] | -2.0% [-4.3%, 0.2%] |
| B bishop | 6741 | 2259 | +0.8 [-1.3, +2.6] | +0.3 [-1.9, +2.2] | -2.2% [-4.4%, 0.0%] |
| N knight | 6983 | 2017 | -2.6 [-4.9, -0.2] | -0.2 [-2.2, +1.9] | -5.2% [-7.6%, -2.8%] |
| A archer | 6988 | 2012 | +1.5 [-0.6, +3.6] | +0.6 [-1.6, +2.7] | 5.7% [3.5%, 8.3%] |
| G guard | 4714 | 4286 | +3.1 [+1.3, +4.8] | +0.0 [-1.7, +1.8] | 6.6% [4.7%, 8.7%] |
| M maester | 6926 | 2074 | +4.8 [+2.9, +7.0] | -0.8 [-2.9, +1.5] | 5.9% [3.3%, 8.5%] |
| S beast | 4593 | 4407 | -7.4 [-9.2, -5.7] | -0.7 [-2.5, +1.1] | -6.2% [-7.9%, -4.4%] |
| all games | 9000 | | draws 24.6% | White 51.4% | 112.5 plies |

## Criteria 2–6

PASS / FAIL: the whole 95% interval is on that side of the line; pass? / fail?: the point is, the interval crosses it.

| piece | 2 captures 0.5–1.5× | 3 moves ≥ 0.5× | 4 a phase ≥ own whole game | 4b a phase ≥ average piece | 5 moved ≥ 85% | 6 draws ±3, White ±2, length ±10% |
|---|---|---|---|---|---|---|
| Q queen | pass? 1.47 [1.44, 1.51] | PASS 1.32 [1.29, 1.35] | PASS 2.00 | PASS 1.77 [1.74, 1.80] | PASS 94.6% [94.0%, 95.1%] | fail? (draws) |
| O ogre | PASS 0.75 [0.73, 0.77] | PASS 1.12 [1.10, 1.15] | PASS 1.73 | PASS 1.16 [1.12, 1.20] | PASS 92.9% [92.2%, 93.5%] | pass? |
| R rook | PASS 1.05 [1.04, 1.07] | PASS 0.91 [0.89, 0.92] | PASS 2.41 | PASS 1.59 [1.56, 1.61] | PASS 86.7% [86.1%, 87.3%] | pass? |
| B bishop | PASS 0.97 [0.95, 0.98] | PASS 0.73 [0.72, 0.74] | PASS 1.49 | PASS 1.05 [1.04, 1.07] | PASS 95.5% [95.2%, 95.9%] | pass? |
| N knight | PASS 0.87 [0.86, 0.88] | PASS 0.77 [0.76, 0.78] | PASS 1.22 | PASS 2.03 [2.01, 2.05] | PASS 98.6% [98.5%, 98.8%] | pass? |
| A archer | PASS 0.97 [0.95, 0.98] | PASS 1.22 [1.21, 1.24] | PASS 1.24 | PASS 1.10 [1.09, 1.12] | PASS 97.4% [97.1%, 97.7%] | pass? |
| G guard | n/a (cannot capture; flagged) | PASS 0.67 [0.65, 0.70] | PASS 1.78 | FAIL 0.47 [0.45, 0.50] | FAIL 79.2% [78.2%, 80.2%] | fail? (draws) |
| M maester | PASS 0.77 [0.75, 0.78] | PASS 1.24 [1.23, 1.25] | PASS 1.47 | PASS 1.29 [1.28, 1.31] | PASS 95.9% [95.5%, 96.3%] | fail? (draws) |
| S beast | fail? 1.51 [1.47, 1.55] | PASS 1.09 [1.08, 1.11] | PASS 1.16 | PASS 1.46 [1.43, 1.48] | PASS 97.8% [97.5%, 98.1%] | FAIL (draws) |

Criterion 4 as written cannot fail: the whole-game activity is a weighted mean of the three phases, so one phase is always at or above it. 4b reads it against the average piece in each phase.
