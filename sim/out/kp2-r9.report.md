# Kings' powers tournament: kp2-r9

3296 games, depth 3, 15 entrants. Rules: `{"markFree":true,"freezeUses":1,"hasteCaptures":false,"strikeCaptures":false,"strikePawns":false,"mercyAura":true,"marchUses":0,"holyLightTakesPawns":true,"holyLightShelter":true,"holyLightShelterOrtho":true,"darknessMoves":true}`.

Variants: `~vs8` = `{"holyLightShelterOrtho":false}`, `~vahead` = `{"darknessTakeAhead":true}`, `~vdiag` = `{"darknessStepDiag":true}`, `~vreach` = `{"deathTouchReach":true}`. A variant does not meet an entrant whose power its rules would change.

First move: White -4 ± 12 Elo.

| power | Elo (BT) | ±95% | score vs field | ±95% | vs powers | ±95% | games | used / game | games used | first use (ply, median) | decisive | draws | plies |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| DeathTouch~vreach | +80 | 31 | 61.9% | 4.0 | 60.9% | 4.2 | 448 | 0.00 | 0.0% | - | 85.0% | 15.0% | 98 |
| HolyLight~vs8 | +54 | 32 | 58.1% | 4.1 | 57.4% | 4.2 | 416 | 0.00 | 0.0% | - | 82.0% | 18.0% | 106 |
| Haste | +37 | 30 | 55.6% | 4.6 | 54.1% | 4.8 | 448 | 0.86 | 85.7% | 52 | 89.7% | 10.3% | 93 |
| Darkness~vdiag | +36 | 32 | 55.8% | 4.8 | 54.3% | 5.0 | 416 | 0.00 | 0.0% | - | 90.4% | 9.6% | 94 |
| Darkness~vahead | +32 | 32 | 55.3% | 4.4 | 53.6% | 4.6 | 416 | 0.00 | 0.0% | - | 81.3% | 18.8% | 108 |
| Mercy | +27 | 30 | 54.0% | 4.5 | 52.8% | 4.7 | 448 | 0.00 | 0.0% | - | 84.8% | 15.2% | 98 |
| IceWall | +2 | 30 | 50.3% | 4.4 | 48.4% | 4.5 | 448 | 1.69 | 91.1% | 25 | 89.1% | 10.9% | 98 |
| Strike | -1 | 30 | 49.8% | 4.3 | 49.4% | 4.5 | 448 | 0.70 | 70.3% | 49 | 86.6% | 13.4% | 98 |
| Sacrifice | -9 | 30 | 48.7% | 4.5 | 47.6% | 4.7 | 448 | 0.98 | 97.5% | 21 | 86.6% | 13.4% | 99 |
| HolyLight | -11 | 32 | 48.9% | 4.2 | 47.5% | 4.4 | 416 | 0.00 | 0.0% | - | 84.9% | 15.1% | 100 |
| Leap | -28 | 30 | 45.8% | 4.2 | 45.1% | 4.5 | 448 | 0.88 | 55.4% | 29 | 88.4% | 11.6% | 99 |
| March | -28 | 30 | 45.8% | 4.4 | 44.6% | 4.5 | 448 | 0.00 | 0.0% | - | 90.2% | 9.8% | 97 |
| Flight | -38 | 30 | 44.2% | 4.3 | 42.7% | 4.5 | 448 | 0.96 | 96.2% | 17 | 88.4% | 11.6% | 95 |
| Freeze | -43 | 31 | 43.5% | 4.4 | 42.5% | 4.5 | 448 | 0.97 | 97.1% | 21 | 86.6% | 13.4% | 97 |
| none | -111 | 32 | 33.7% | 3.7 | 33.7% | 3.7 | 448 | 0.00 | 0.0% | - | 86.2% | 13.8% | 92 |

Against the other powers: 6 of 14 inside 50 ± 4 points; spread 18.4 points. Outside: DeathTouch~vreach 60.9%, HolyLight~vs8 57.4%, Haste 54.1%, Darkness~vdiag 54.3%, Leap 45.1%, March 44.6%, Flight 42.7%, Freeze 42.5%.

## Matchups (row power's score against the column power)

| | DeathTouch~vreach | HolyLight~vs8 | Haste | Darkness~vdiag | Darkness~vahead | Mercy | IceWall | Strike | Sacrifice | HolyLight | Leap | March | Flight | Freeze | none |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **DeathTouch~vreach** | — | 48 | 52 | 50 | 67 | 50 | 59 | 61 | 58 | 66 | 72 | 72 | 70 | 67 | 75 |
| **HolyLight~vs8** | 52 | — | 47 | 70 | 50 | 56 | 44 | 50 | 61 |  | 63 | 59 | 69 | 69 | 66 |
| **Haste** | 48 | 53 | — | 39 | 50 | 56 | 69 | 58 | 41 | 55 | 69 | 58 | 56 | 52 | 75 |
| **Darkness~vdiag** | 50 | 30 | 61 | — |  | 56 | 52 | 58 | 66 | 55 | 61 | 45 | 66 | 53 | 73 |
| **Darkness~vahead** | 33 | 50 | 50 |  | — | 50 | 53 | 47 | 58 | 50 | 59 | 77 | 70 | 47 | 75 |
| **Mercy** | 50 | 44 | 44 | 44 | 50 | — | 66 | 45 | 67 | 56 | 50 | 48 | 56 | 66 | 70 |
| **IceWall** | 41 | 56 | 31 | 48 | 47 | 34 | — | 56 | 52 | 63 | 56 | 53 | 47 | 45 | 75 |
| **Strike** | 39 | 50 | 42 | 42 | 53 | 55 | 44 | — | 63 | 50 | 45 | 58 | 52 | 50 | 55 |
| **Sacrifice** | 42 | 39 | 59 | 34 | 42 | 33 | 48 | 38 | — | 42 | 55 | 47 | 63 | 77 | 63 |
| **HolyLight** | 34 |  | 45 | 45 | 50 | 44 | 38 | 50 | 58 | — | 45 | 58 | 44 | 59 | 66 |
| **Leap** | 28 | 38 | 31 | 39 | 41 | 50 | 44 | 55 | 45 | 55 | — | 47 | 56 | 58 | 55 |
| **March** | 28 | 41 | 42 | 55 | 23 | 52 | 47 | 42 | 53 | 42 | 53 | — | 42 | 59 | 61 |
| **Flight** | 30 | 31 | 44 | 34 | 30 | 44 | 53 | 48 | 38 | 56 | 44 | 58 | — | 45 | 64 |
| **Freeze** | 33 | 31 | 48 | 47 | 53 | 34 | 55 | 50 | 23 | 41 | 42 | 41 | 55 | — | 56 |
| **none** | 25 | 34 | 25 | 27 | 25 | 30 | 25 | 45 | 38 | 34 | 45 | 39 | 36 | 44 | — |

Endings: adjudicatedResign 86.7%, adjudicatedDraw 9.1%, drawRepetition 2.9%, draw50 0.5%, plyCap 0.5%, drawMaterial 0.3%, checkmate 0.0%, stalemate 0.0%.
