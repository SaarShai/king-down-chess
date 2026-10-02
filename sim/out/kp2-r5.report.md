# Kings' powers tournament: kp2-r5

4944 games, depth 3, 15 entrants. Rules: `{"markFree":true,"freezeUses":1,"hasteCaptures":false,"strikeCaptures":false,"strikePawns":false,"flightUses":2,"mercyAura":true,"marchUses":0,"holyLightTakesPawns":true,"darknessMoves":true}`.

Variants: `~vonce` = `{"flightUses":1}`, `~vshelter` = `{"holyLightShelter":true}`. A variant does not meet an entrant whose power its rules would change.

First move: White -1 ± 10 Elo.

| power | Elo (BT) | ±95% | score vs field | ±95% | vs powers | ±95% | games | used / game | games used | first use (ply, median) | decisive | draws | plies |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Mercy | +85 | 26 | 62.6% | 3.5 | 61.9% | 3.6 | 672 | 0.00 | 0.0% | - | 83.6% | 16.4% | 101 |
| HolyLight~vshelter | +71 | 26 | 60.1% | 3.4 | 59.7% | 3.5 | 624 | 0.00 | 0.0% | - | 81.4% | 18.6% | 106 |
| Flight | +64 | 26 | 59.6% | 3.6 | 58.3% | 3.8 | 624 | 1.78 | 95.0% | 16 | 90.4% | 9.6% | 94 |
| Haste | +47 | 25 | 57.1% | 3.6 | 55.9% | 3.7 | 672 | 0.79 | 79.3% | 48 | 87.6% | 12.4% | 94 |
| Freeze | +23 | 25 | 53.4% | 3.6 | 52.2% | 3.7 | 672 | 0.97 | 96.7% | 19 | 89.6% | 10.4% | 91 |
| Strike | +2 | 25 | 50.3% | 3.5 | 49.4% | 3.7 | 672 | 0.70 | 69.8% | 41 | 87.2% | 12.8% | 91 |
| Flight~vonce | -2 | 26 | 50.4% | 3.5 | 49.0% | 3.7 | 624 | 0.96 | 96.2% | 17 | 84.8% | 15.2% | 95 |
| Leap | -8 | 25 | 48.7% | 3.6 | 48.2% | 3.8 | 672 | 1.01 | 59.4% | 24 | 86.2% | 13.8% | 98 |
| March | -18 | 25 | 47.3% | 3.6 | 46.7% | 3.7 | 672 | 0.00 | 0.0% | - | 88.1% | 11.9% | 92 |
| Sacrifice | -20 | 25 | 47.0% | 3.6 | 46.6% | 3.7 | 672 | 0.93 | 93.0% | 20 | 87.8% | 12.2% | 98 |
| IceWall | -29 | 25 | 45.6% | 3.4 | 44.6% | 3.5 | 672 | 1.67 | 89.3% | 30 | 86.5% | 13.5% | 105 |
| DeathTouch | -37 | 25 | 44.4% | 3.3 | 43.6% | 3.5 | 672 | 0.00 | 0.0% | - | 82.3% | 17.7% | 103 |
| Darkness | -47 | 25 | 43.0% | 3.6 | 42.2% | 3.7 | 672 | 0.00 | 0.0% | - | 93.8% | 6.3% | 86 |
| HolyLight | -53 | 26 | 42.7% | 3.3 | 42.3% | 3.5 | 624 | 0.00 | 0.0% | - | 84.5% | 15.5% | 98 |
| none | -77 | 25 | 38.5% | 3.2 | 38.5% | 3.2 | 672 | 0.00 | 0.0% | - | 84.8% | 15.2% | 98 |

Against the other powers: 6 of 14 inside 50 ± 4 points; spread 19.6 points. Outside: Mercy 61.9%, HolyLight~vshelter 59.7%, Flight 58.3%, Haste 55.9%, IceWall 44.6%, DeathTouch 43.6%, Darkness 42.2%, HolyLight 42.3%.

## Matchups (row power's score against the column power)

| | Mercy | HolyLight~vshelter | Flight | Haste | Freeze | Strike | Flight~vonce | Leap | March | Sacrifice | IceWall | DeathTouch | Darkness | HolyLight | none |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Mercy** | — | 50 | 49 | 51 | 63 | 76 | 61 | 66 | 52 | 64 | 71 | 72 | 64 | 67 | 73 |
| **HolyLight~vshelter** | 50 | — | 54 | 60 | 50 | 61 | 69 | 67 | 63 | 51 | 59 | 69 | 64 |  | 65 |
| **Flight** | 51 | 46 | — | 52 | 52 | 53 |  | 50 | 71 | 65 | 63 | 66 | 68 | 65 | 75 |
| **Haste** | 49 | 40 | 48 | — | 52 | 54 | 57 | 63 | 61 | 54 | 63 | 58 | 59 | 69 | 72 |
| **Freeze** | 38 | 50 | 48 | 48 | — | 41 | 61 | 58 | 55 | 48 | 63 | 54 | 52 | 64 | 69 |
| **Strike** | 24 | 39 | 47 | 46 | 59 | — | 49 | 52 | 55 | 42 | 61 | 55 | 56 | 57 | 61 |
| **Flight~vonce** | 39 | 31 |  | 43 | 39 | 51 | — | 43 | 61 | 57 | 55 | 61 | 50 | 58 | 67 |
| **Leap** | 34 | 33 | 50 | 38 | 42 | 48 | 57 | — | 51 | 47 | 63 | 47 | 66 | 52 | 55 |
| **March** | 48 | 38 | 29 | 39 | 45 | 45 | 39 | 49 | — | 53 | 53 | 46 | 66 | 59 | 55 |
| **Sacrifice** | 36 | 49 | 35 | 46 | 52 | 58 | 43 | 53 | 47 | — | 45 | 48 | 47 | 46 | 53 |
| **IceWall** | 29 | 41 | 38 | 38 | 38 | 39 | 45 | 38 | 47 | 55 | — | 57 | 61 | 55 | 59 |
| **DeathTouch** | 28 | 31 | 34 | 42 | 46 | 45 | 39 | 53 | 54 | 52 | 43 | — | 47 | 53 | 55 |
| **Darkness** | 36 | 36 | 32 | 41 | 48 | 44 | 50 | 34 | 34 | 53 | 39 | 53 | — | 48 | 53 |
| **HolyLight** | 33 |  | 35 | 31 | 36 | 43 | 42 | 48 | 41 | 54 | 45 | 47 | 52 | — | 48 |
| **none** | 27 | 35 | 25 | 28 | 31 | 39 | 33 | 45 | 45 | 47 | 41 | 45 | 47 | 52 | — |

Endings: adjudicatedResign 86.6%, adjudicatedDraw 8.9%, drawRepetition 2.7%, draw50 0.8%, plyCap 0.7%, drawMaterial 0.3%, checkmate 0.0%, stalemate 0.0%.
