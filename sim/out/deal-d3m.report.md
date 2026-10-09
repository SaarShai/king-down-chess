# Kings' powers tournament: deal-d3m

3500 of 3500 games, depth 3, 2 entrants. Rules: `{"markFree":true,"hasteCaptures":false,"strikeCaptures":false,"strikePawns":false}`.

## Same hand for both sides

Each entrant against itself: White's score (50% = no first-move edge), the share of drawn games, the length in turns (a free mark or a Haste is one turn with its move) and the cards played per side, with 95% intervals over pairs (one army each); Δ columns are differences from `none` on the same armies.

| entrant | White % | ±95% | draws % | ±95% | turns | ±95% | Δ White | ±95% | Δ draws | ±95% | Δ turns | ±95% | cards / side | pairs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| cards6 | 50.9 | 2.3 | 7.5 | 1.2 | 85.3 | 2.2 | +0.1 | 3.1 | -10.5 | 2.2 | -17.9 | 3.0 | 4.71 | 1750 |
| none | 50.9 | 2.1 | 18.1 | 1.8 | 103.3 | 2.2 | - | - | - | - | - | - | 0.00 | 1750 |

Endings: adjudicatedResign 86.6%, adjudicatedDraw 9.9%, drawRepetition 1.7%, checkmate 0.6%, draw50 0.5%, drawMaterial 0.4%, plyCap 0.4%.


## Each card (tools/deal-cards.ts; both sides hold the same hand, so Δ White is the card's effect on the first-move edge)

pairs 1750; check a hand: Spawn2,Mimic,Burn,EarthQuakeB,MorphP,Strike
| card | hands | White % with | Δ White (with − without) | ±95% | draws % with | Δ draws | ±95% |
|---|---|---|---|---|---|---|---|
| Mimic | 339 | 55.5 | +5.6 | 5.7 | 7.1 | -0.6 | 3.1 |
| Vault | 366 | 54.1 | +4.0 | 5.5 | 7.1 | -0.6 | 3.0 |
| SkyLift | 389 | 53.1 | +2.8 | 5.4 | 8.0 | +0.5 | 3.0 |
| Freeze | 360 | 52.9 | +2.5 | 5.6 | 6.4 | -1.5 | 2.9 |
| EarthQuakeB | 365 | 52.9 | +2.5 | 5.6 | 6.0 | -1.9 | 2.8 |
| FireStarter | 391 | 52.8 | +2.4 | 5.4 | 6.9 | -0.8 | 2.9 |
| Rally | 376 | 52.5 | +2.1 | 5.5 | 6.6 | -1.1 | 2.9 |
| Sacrifice | 390 | 52.4 | +2.0 | 5.5 | 4.4 | -4.1 | 2.5 |
| March | 392 | 52.2 | +1.6 | 5.4 | 6.9 | -0.8 | 2.9 |
| Haste | 390 | 52.1 | +1.5 | 5.4 | 8.7 | +1.5 | 3.1 |
| GrowthB | 372 | 52.0 | +1.4 | 5.5 | 8.9 | +1.7 | 3.2 |
| Firewall | 394 | 51.8 | +1.1 | 5.4 | 6.1 | -1.9 | 2.8 |
| Strike | 356 | 51.7 | +1.0 | 5.6 | 6.7 | -1.0 | 3.0 |
| SpawnK2 | 386 | 51.6 | +0.8 | 5.4 | 8.8 | +1.6 | 3.1 |
| MorphP | 368 | 51.5 | +0.7 | 5.6 | 6.3 | -1.6 | 2.9 |
| Burn | 372 | 51.5 | +0.7 | 5.5 | 8.3 | +1.0 | 3.1 |
| Growth | 371 | 51.1 | +0.2 | 5.5 | 7.8 | +0.3 | 3.1 |
| Curse | 381 | 50.9 | +0.0 | 5.5 | 5.2 | -2.9 | 2.7 |
| EarthQuake | 355 | 50.7 | -0.3 | 5.6 | 9.0 | +1.8 | 3.3 |
| MirrorB | 393 | 49.5 | -1.8 | 5.4 | 7.4 | -0.2 | 2.9 |
| Flight | 383 | 49.5 | -1.8 | 5.4 | 8.6 | +1.4 | 3.1 |
| Leap | 377 | 49.2 | -2.2 | 5.5 | 7.7 | +0.2 | 3.0 |
| SpawnK | 368 | 48.9 | -2.5 | 5.5 | 8.2 | +0.8 | 3.1 |
| IceWall | 383 | 48.3 | -3.3 | 5.4 | 9.9 | +3.0 | 3.3 |
| Control | 372 | 48.0 | -3.7 | 5.5 | 7.8 | +0.3 | 3.1 |
| FirewallB | 390 | 47.7 | -4.1 | 5.4 | 8.7 | +1.5 | 3.1 |
| Spawn2 | 366 | 47.1 | -4.8 | 5.5 | 8.5 | +1.2 | 3.2 |
| Salvation | 355 | 44.4 | -8.2 | 5.5 | 9.3 | +2.2 | 3.3 |
