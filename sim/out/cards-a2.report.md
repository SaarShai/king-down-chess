# Kings' powers tournament: cards-a2

3000 of 3000 games, depth 3, 5 entrants. Rules: `{"markFree":true,"hasteCaptures":false,"strikeCaptures":false,"strikePawns":false}`.

First move: White +3 ± 13 Elo.

300 armies (cards-a2: a fresh army for every pair). The "armies" intervals resample the armies with their games; a power's strength depends on the army, so they are the ones to read (LESSONS.md 2026-10-03). The other ± are per game.

| power | Elo (BT) | ±95% | score vs field | ±95% | ±95% armies | vs powers | ±95% | ±95% armies | games | used / game | games used | first use (ply, median) | decisive | draws | plies |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| card:Vault | +45 | 25 | 63.4% | 3.6 | 3.6 | - | - | - | 600 | 0.72 | 72.2% | 26 | 85.5% | 14.5% | 94 |
| card:SkyLift | +24 | 25 | 60.6% | 3.5 | 3.6 | - | - | - | 600 | 0.74 | 73.8% | 36 | 81.8% | 18.2% | 98 |
| card:Mimic | +17 | 25 | 59.6% | 3.6 | 3.7 | - | - | - | 600 | 0.79 | 79.3% | 28 | 86.8% | 13.2% | 97 |
| card:Curse | -34 | 24 | 52.4% | 3.7 | 3.6 | - | - | - | 600 | 0.90 | 90.2% | 27 | 83.8% | 16.2% | 97 |
| none | -51 | 11 | 41.0% | 1.8 | 1.9 | - | - | - | 2400 | 0.00 | 0.0% | - | 83.9% | 16.1% | 99 |

## Against none

Each entrant's score against none (±95%, armies resampled), in Elo and in pawns at 64 Elo per pawn (depth 3; that calibration is itself ±25%), and its games' draw share against none's mirror games (18.7% ± 4.4, 300 pairs).

| entrant | score | ±95% | Elo | pawns | ±95% | draws | Δ draws | ±95% | pairs |
|---|---|---|---|---|---|---|---|---|---|
| card:Vault | 63.4% | 3.6 | +96 | +1.49 | 0.42 | 14.5% | -4.2 | 5.3 | 300 |
| card:SkyLift | 60.6% | 3.6 | +75 | +1.17 | 0.41 | 18.2% | -0.5 | 5.4 | 300 |
| card:Mimic | 59.6% | 3.7 | +67 | +1.05 | 0.41 | 13.2% | -5.5 | 5.1 | 300 |
| card:Curse | 52.4% | 3.6 | +17 | +0.26 | 0.40 | 16.2% | -2.5 | 5.3 | 300 |

## Matchups (row power's score against the column power)

| | card:Vault | card:SkyLift | card:Mimic | card:Curse | none |
|---|---|---|---|---|---|
| **card:Vault** | — |  |  |  | 63 |
| **card:SkyLift** |  | — |  |  | 61 |
| **card:Mimic** |  |  | — |  | 60 |
| **card:Curse** |  |  |  | — | 52 |
| **none** | 37 | 39 | 40 | 48 | — |

Endings: adjudicatedResign 83.9%, adjudicatedDraw 11.1%, drawRepetition 3.4%, plyCap 0.7%, draw50 0.5%, drawMaterial 0.5%.
