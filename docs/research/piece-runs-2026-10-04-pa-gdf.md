# Piece activity: pa-gdf

Files: `sim/out/pa-gdf.jsonl`. Pool not stamped in the records (today's: QORRBBNNAAGMMSS).
9000 games counted. Left out: 0 with a king power or cards, 0 that did not replay.
Counted: ordinary piece moves and their captures only (no king power or card move). Random opening plies: not counted.
Pawns and kings are not reported and not in the averages. The capture average leaves out the guard (it captures nothing by rule). Intervals: 95%, 1000 resamples of the games.

## Moves, captures and use

| piece | games with it | pieces (start) | moves / piece | × average | captures / piece | × average | never moved | moved in the game | first move (median ply) |
|---|---|---|---|---|---|---|---|---|---|
| Q queen | 4293 | 8586 | 5.75 | 1.14 [1.11, 1.17] | 1.10 | 1.14 [1.11, 1.17] | 10.4% | 95.3% | 30.0 |
| O ogre | 4293 | 8586 | 4.90 | 0.97 [0.94, 1.00] | 0.48 | 0.50 [0.48, 0.52] | 13.4% | 94.2% | 23.0 |
| R rook | 6666 | 17078 | 4.02 | 0.80 [0.78, 0.81] | 0.83 | 0.87 [0.85, 0.88] | 18.7% | 92.8% | 39.0 |
| B bishop | 6358 | 14822 | 3.52 | 0.70 [0.68, 0.71] | 0.79 | 0.82 [0.81, 0.84] | 7.1% | 98.3% | 20.0 |
| N knight | 6663 | 17112 | 3.87 | 0.76 [0.75, 0.78] | 0.70 | 0.73 [0.72, 0.74] | 1.6% | 99.9% | 7.0 |
| A archer | 6675 | 17184 | 8.30 | 1.64 [1.62, 1.66] | 2.02 | 2.10 [2.08, 2.13] | 3.3% | 99.0% | 16.0 |
| G guard | 4305 | 8610 | 3.68 | 0.73 [0.69, 0.76] | 0.00 | cannot capture | 22.2% | 86.5% | 34.0 |
| M maester | 6698 | 17080 | 5.74 | 1.13 [1.12, 1.15] | 0.53 | 0.55 [0.54, 0.56] | 7.4% | 98.0% | 20.0 |
| S beast | 6613 | 16942 | 5.09 | 1.01 [0.99, 1.02] | 1.04 | 1.08 [1.06, 1.10] | 5.0% | 99.1% | 18.0 |

Per piece = over the pieces that started on the board. "Never moved": share of starting pieces that made no counted move. "Moved in the game": share of the games with the piece where at least one of them moved (either side). First move: the ply of each starting piece's first counted move, among those that moved.

## Activity by phase

Activity = (moves + captures) per piece on the board per turn of its side, in that phase.

| piece | opening (plies 1–30) | × average | middle (31–80) | × average | end (81+) | × average | whole game | best phase / own whole game |
|---|---|---|---|---|---|---|---|---|
| Q queen | 0.066 | 0.55 | 0.211 | 1.15 | 0.420 | 1.61 | 0.193 | 2.17 |
| O ogre | 0.077 | 0.64 | 0.135 | 0.74 | 0.267 | 1.02 | 0.143 | 1.87 |
| R rook | 0.036 | 0.30 | 0.164 | 0.90 | 0.375 | 1.43 | 0.148 | 2.52 |
| B bishop | 0.109 | 0.90 | 0.171 | 0.94 | 0.235 | 0.90 | 0.154 | 1.53 |
| N knight | 0.226 | 1.87 | 0.211 | 1.15 | 0.245 | 0.94 | 0.222 | 1.11 |
| A archer | 0.202 | 1.67 | 0.285 | 1.56 | 0.303 | 1.16 | 0.262 | 1.16 |
| G guard | 0.029 | 0.24 | 0.040 | 0.22 | 0.138 | 0.53 | 0.071 | 1.94 |
| M maester | 0.110 | 0.91 | 0.191 | 1.04 | 0.275 | 1.05 | 0.177 | 1.56 |
| S beast | 0.147 | 1.22 | 0.180 | 0.98 | 0.218 | 0.83 | 0.175 | 1.25 |
| average piece | 0.121 | 1.00 | 0.183 | 1.00 | 0.262 | 1.00 | | |

## With and without the piece in the army

Games whose army includes the piece minus games whose army does not.

| piece | games with | without | draws Δ (points) | White's score Δ (points) | length Δ |
|---|---|---|---|---|---|
| Q queen | 4293 | 4707 | -2.9 [-4.6, -1.3] | +0.8 [-1.0, +2.7] | -7.8% [-9.5%, -5.8%] |
| O ogre | 4293 | 4707 | +0.4 [-1.3, +2.0] | +0.5 [-1.4, +2.3] | -0.7% [-2.7%, 1.5%] |
| R rook | 6666 | 2334 | +0.3 [-1.5, +2.1] | -0.2 [-2.6, +2.1] | -0.9% [-3.1%, 1.4%] |
| B bishop | 6358 | 2642 | -0.9 [-2.6, +0.8] | -0.4 [-2.4, +1.8] | -0.2% [-2.3%, 1.9%] |
| N knight | 6663 | 2337 | +2.1 [+0.3, +3.8] | +0.7 [-1.5, +3.0] | 1.2% [-1.3%, 3.8%] |
| A archer | 6675 | 2325 | -6.6 [-8.5, -4.8] | -2.3 [-4.4, -0.3] | -2.2% [-4.6%, 0.1%] |
| G guard | 4305 | 4695 | +4.4 [+2.8, +6.0] | -0.7 [-2.7, +1.1] | 10.7% [8.3%, 13.0%] |
| M maester | 6698 | 2302 | +2.7 [+1.0, +4.4] | -0.7 [-2.7, +1.4] | 9.4% [6.9%, 12.3%] |
| S beast | 6613 | 2387 | -2.7 [-4.6, -1.0] | -0.9 [-3.0, +1.2] | -8.5% [-10.3%, -6.5%] |
| all games | 9000 | | draws 18.2% | White 51.6% | 102.5 plies |

## Criteria 2–6

PASS / FAIL: the whole 95% interval is on that side of the line; pass? / fail?: the point is, the interval crosses it.

| piece | 2 captures 0.5–1.5× | 3 moves ≥ 0.5× | 4 a phase ≥ own whole game | 4b a phase ≥ average piece | 5 moved ≥ 85% | 6 draws ±3, White ±2, length ±10% |
|---|---|---|---|---|---|---|
| Q queen | PASS 1.14 [1.11, 1.17] | PASS 1.14 [1.11, 1.17] | PASS 2.17 | PASS 1.61 [1.57, 1.65] | PASS 89.6% [88.8%, 90.3%] | pass? |
| O ogre | fail? 0.50 [0.48, 0.52] | PASS 0.97 [0.94, 1.00] | PASS 1.87 | pass? 1.02 [0.99, 1.06] | PASS 86.6% [85.8%, 87.3%] | pass? |
| R rook | PASS 0.87 [0.85, 0.88] | PASS 0.80 [0.78, 0.81] | PASS 2.52 | PASS 1.43 [1.41, 1.46] | FAIL 81.3% [80.5%, 82.0%] | pass? |
| B bishop | PASS 0.82 [0.81, 0.84] | PASS 0.70 [0.68, 0.71] | PASS 1.53 | FAIL 0.94 [0.92, 0.95] | PASS 92.9% [92.5%, 93.4%] | pass? |
| N knight | PASS 0.73 [0.72, 0.74] | PASS 0.76 [0.75, 0.78] | PASS 1.11 | PASS 1.87 [1.85, 1.89] | PASS 98.4% [98.2%, 98.6%] | pass? |
| A archer | FAIL 2.10 [2.08, 2.13] | PASS 1.64 [1.62, 1.66] | PASS 1.16 | PASS 1.67 [1.65, 1.69] | PASS 96.7% [96.4%, 97.1%] | FAIL (draws, White) |
| G guard | n/a (cannot capture; flagged) | PASS 0.73 [0.69, 0.76] | PASS 1.94 | FAIL 0.53 [0.50, 0.56] | FAIL 77.8% [76.7%, 78.9%] | fail? (draws, length) |
| M maester | PASS 0.55 [0.54, 0.56] | PASS 1.13 [1.12, 1.15] | PASS 1.56 | PASS 1.05 [1.04, 1.07] | PASS 92.6% [92.1%, 93.1%] | pass? |
| S beast | PASS 1.08 [1.06, 1.10] | PASS 1.01 [0.99, 1.02] | PASS 1.25 | PASS 1.22 [1.20, 1.24] | PASS 95.0% [94.6%, 95.4%] | pass? |

Criterion 4 as written cannot fail: the whole-game activity is a weighted mean of the three phases, so one phase is always at or above it. 4b reads it against the average piece in each phase.
