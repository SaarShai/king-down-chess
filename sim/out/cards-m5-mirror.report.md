# Kings' powers tournament: cards-m5-mirror

1800 of 1800 games, depth 3, 3 entrants. Rules: `{"markFree":true,"hasteCaptures":false,"strikeCaptures":false,"strikePawns":false}`.

First move: White +7 ± 16 Elo.

300 armies (cards-m5-mirror: a fresh army for every pair). The "armies" intervals resample the armies with their games; a power's strength depends on the army, so they are the ones to read (LESSONS.md 2026-10-03). The other ± are per game.

| power | Elo (BT) | ±95% | score vs field | ±95% | ±95% armies | vs powers | ±95% | ±95% armies | games | used / game | games used | first use (ply, median) | decisive | draws | plies |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| card:Freeze+Mirror | +48 | 21 | 53.0% | 3.8 | 3.9 | - | - | - | 600 | 1.65 | 99.2% | 23 | 92.0% | 8.0% | 91 |
| card:Freeze | +27 | 13 | 55.6% | 2.8 | 2.7 | - | - | - | 1200 | 0.85 | 85.0% | 25 | 90.1% | 9.9% | 92 |
| card:Mirror | -75 | 21 | 35.8% | 3.8 | 3.8 | - | - | - | 600 | 0.57 | 57.2% | 47 | 92.8% | 7.2% | 92 |

## Against card:Freeze

Each entrant's score against card:Freeze (±95%, armies resampled), in Elo and in pawns at 64 Elo per pawn (depth 3; that calibration is itself ±25%), and its games' draw share against card:Freeze's mirror games (14.7% ± 4.0, 300 pairs).

| entrant | score | ±95% | Elo | pawns | ±95% | draws | Δ draws | ±95% | pairs |
|---|---|---|---|---|---|---|---|---|---|
| card:Freeze+Mirror | 53.0% | 3.9 | +21 | +0.33 | 0.42 | 8.0% | -6.7 | 4.6 | 300 |
| card:Mirror | 35.8% | 3.8 | -102 | -1.59 | 0.45 | 7.2% | -7.5 | 4.5 | 300 |

## Matchups (row power's score against the column power)

| | card:Freeze+Mirror | card:Freeze | card:Mirror |
|---|---|---|---|
| **card:Freeze+Mirror** | — | 53 |  |
| **card:Freeze** | 47 | — | 64 |
| **card:Mirror** |  | 36 | — |

Endings: adjudicatedResign 90.1%, adjudicatedDraw 7.1%, drawRepetition 1.8%, drawMaterial 0.4%, draw50 0.3%, plyCap 0.3%.
