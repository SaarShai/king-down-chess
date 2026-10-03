# Kings' powers tournament: cards-a1

5400 of 5400 games, depth 3, 9 entrants. Rules: `{"markFree":true,"freezeUses":1,"iceWallUses":1,"marchUses":1,"leapUses":1,"hasteCaptures":false,"strikeCaptures":false,"strikePawns":false}`.

First move: White +19 ± 10 Elo.

2400 armies (cards-a1: a fresh army for every pair). The "armies" intervals resample the armies with their games; a power's strength depends on the army, so they are the ones to read (LESSONS.md 2026-10-03). The other ± are per game.

| power | Elo (BT) | ±95% | score vs field | ±95% | ±95% armies | vs powers | ±95% | ±95% armies | games | used / game | games used | first use (ply, median) | decisive | draws | plies |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Haste | +70 | 28 | 70.0% | 3.5 | 3.5 | - | - | - | 600 | 0.75 | 75.2% | 47 | 90.3% | 9.7% | 92 |
| Strike | +45 | 28 | 66.8% | 3.4 | 3.4 | - | - | - | 600 | 0.68 | 68.2% | 51 | 86.0% | 14.0% | 93 |
| Freeze | +29 | 27 | 64.8% | 3.4 | 3.4 | - | - | - | 600 | 0.99 | 99.2% | 19 | 87.0% | 13.0% | 94 |
| Flight | +19 | 27 | 63.4% | 3.5 | 3.5 | - | - | - | 600 | 0.98 | 98.2% | 14 | 85.2% | 14.8% | 95 |
| Sacrifice | +2 | 27 | 61.2% | 3.7 | 3.8 | - | - | - | 600 | 0.96 | 95.7% | 20 | 85.7% | 14.3% | 99 |
| Leap | -7 | 27 | 59.9% | 3.3 | 3.3 | - | - | - | 600 | 0.63 | 63.2% | 25 | 84.5% | 15.5% | 98 |
| IceWall | -39 | 26 | 55.5% | 3.6 | 3.6 | - | - | - | 600 | 0.92 | 91.7% | 29 | 84.0% | 16.0% | 103 |
| March | -42 | 26 | 55.0% | 3.5 | 3.5 | - | - | - | 600 | 0.61 | 60.7% | 48 | 85.7% | 14.3% | 99 |
| none | -77 | 9 | 37.9% | 1.2 | 1.3 | 37.9% | 1.2 | 1.3 | 4800 | 0.00 | 0.0% | - | 85.4% | 14.6% | 96 |

## Against none

Each entrant's score against none (±95%, armies resampled), in Elo and in pawns at 64 Elo per pawn (depth 3; that calibration is itself ±25%), and its games' draw share against none's mirror games (19.7% ± 4.5, 300 pairs).

| entrant | score | ±95% | Elo | pawns | ±95% | draws | Δ draws | ±95% | pairs |
|---|---|---|---|---|---|---|---|---|---|
| Haste | 70.0% | 3.5 | +147 | +2.30 | 0.45 | 9.7% | -10.0 | 5.1 | 300 |
| Strike | 66.8% | 3.4 | +122 | +1.90 | 0.42 | 14.0% | -5.7 | 5.3 | 300 |
| Freeze | 64.8% | 3.4 | +106 | +1.66 | 0.41 | 13.0% | -6.7 | 5.3 | 300 |
| Flight | 63.4% | 3.5 | +96 | +1.49 | 0.41 | 14.8% | -4.8 | 5.4 | 300 |
| Sacrifice | 61.2% | 3.8 | +79 | +1.23 | 0.43 | 14.3% | -5.3 | 5.3 | 300 |
| Leap | 59.9% | 3.3 | +70 | +1.09 | 0.38 | 15.5% | -4.2 | 5.4 | 300 |
| IceWall | 55.5% | 3.6 | +38 | +0.60 | 0.40 | 16.0% | -3.7 | 5.5 | 300 |
| March | 55.0% | 3.5 | +35 | +0.54 | 0.38 | 14.3% | -5.3 | 5.3 | 300 |

## Matchups (row power's score against the column power)

| | Haste | Strike | Freeze | Flight | Sacrifice | Leap | IceWall | March | none |
|---|---|---|---|---|---|---|---|---|---|
| **Haste** | — |  |  |  |  |  |  |  | 70 |
| **Strike** |  | — |  |  |  |  |  |  | 67 |
| **Freeze** |  |  | — |  |  |  |  |  | 65 |
| **Flight** |  |  |  | — |  |  |  |  | 63 |
| **Sacrifice** |  |  |  |  | — |  |  |  | 61 |
| **Leap** |  |  |  |  |  | — |  |  | 60 |
| **IceWall** |  |  |  |  |  |  | — |  | 56 |
| **March** |  |  |  |  |  |  |  | — | 55 |
| **none** | 30 | 33 | 35 | 37 | 39 | 40 | 44 | 45 | — |

Endings: adjudicatedResign 85.3%, adjudicatedDraw 10.5%, drawRepetition 2.5%, plyCap 0.7%, draw50 0.5%, drawMaterial 0.4%, checkmate 0.1%.
