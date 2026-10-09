# Kings' powers tournament: deal-nosalv

3500 of 3500 games, depth 3, 2 entrants. Rules: `{"markFree":true,"hasteCaptures":false,"strikeCaptures":false,"strikePawns":false}`.

## Same hand for both sides

Each entrant against itself: White's score (50% = no first-move edge), the share of drawn games, the length in turns (a free mark or a Haste is one turn with its move) and the cards played per side, with 95% intervals over pairs (one army each); Δ columns are differences from `none` on the same armies.

| entrant | White % | ±95% | draws % | ±95% | turns | ±95% | Δ White | ±95% | Δ draws | ±95% | Δ turns | ±95% | cards / side | pairs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| cards6 | 50.2 | 2.2 | 7.9 | 1.3 | 86.3 | 2.2 | -1.2 | 3.1 | -11.4 | 2.3 | -14.2 | 3.1 | 4.69 | 1750 |
| none | 51.4 | 2.1 | 19.4 | 1.9 | 100.5 | 2.3 | - | - | - | - | - | - | 0.00 | 1750 |

Endings: adjudicatedResign 85.7%, adjudicatedDraw 10.5%, drawRepetition 2.1%, checkmate 0.6%, plyCap 0.4%, draw50 0.4%, drawMaterial 0.2%.

## Each card

Pairs whose six-card hand holds the card against pairs whose hand does not (`npx tsx tools/deal-cards.ts`).

pairs 1750; check a hand: EarthQuake,SpawnK2,SpawnK,IceWall,Control,March
| card | hands | White % with | Δ White (with − without) | ±95% | draws % with | Δ draws | ±95% |
|---|---|---|---|---|---|---|---|
| Spawn2 | 393 | 54.3 | +5.3 | 5.3 | 10.4 | +3.2 | 3.3 |
| Freeze | 407 | 53.6 | +4.4 | 5.3 | 8.8 | +1.2 | 3.1 |
| Control | 410 | 53.3 | +4.0 | 5.3 | 6.6 | -1.8 | 2.8 |
| Firewall | 354 | 52.8 | +3.3 | 5.6 | 6.2 | -2.2 | 2.9 |
| Curse | 369 | 52.3 | +2.7 | 5.5 | 7.6 | -0.4 | 3.1 |
| Mimic | 392 | 52.2 | +2.5 | 5.4 | 6.4 | -2.0 | 2.8 |
| March | 358 | 52.1 | +2.4 | 5.6 | 7.5 | -0.5 | 3.1 |
| IceWall | 396 | 52.0 | +2.4 | 5.3 | 9.1 | +1.5 | 3.2 |
| MirrorB | 389 | 51.9 | +2.2 | 5.4 | 10.3 | +3.0 | 3.3 |
| Flight | 361 | 51.9 | +2.2 | 5.5 | 10.8 | +3.6 | 3.5 |
| Sacrifice | 407 | 51.4 | +1.5 | 5.3 | 6.9 | -1.4 | 2.9 |
| Strike | 411 | 51.0 | +1.0 | 5.3 | 7.1 | -1.2 | 2.9 |
| SkyLift | 373 | 50.7 | +0.6 | 5.5 | 7.5 | -0.6 | 3.0 |
| SpawnK | 394 | 50.6 | +0.6 | 5.4 | 8.4 | +0.6 | 3.1 |
| FirewallB | 393 | 49.5 | -0.9 | 5.4 | 6.4 | -2.0 | 2.8 |
| Leap | 415 | 49.4 | -1.1 | 5.3 | 9.6 | +2.2 | 3.2 |
| Growth | 391 | 48.7 | -1.9 | 5.4 | 7.4 | -0.7 | 3.0 |
| Vault | 355 | 48.5 | -2.2 | 5.6 | 7.9 | -0.1 | 3.1 |
| Burn | 399 | 48.5 | -2.2 | 5.4 | 7.3 | -0.9 | 2.9 |
| FireStarter | 420 | 48.3 | -2.5 | 5.3 | 6.2 | -2.3 | 2.8 |
| EarthQuakeB | 401 | 48.3 | -2.5 | 5.3 | 8.2 | +0.4 | 3.1 |
| Haste | 389 | 48.1 | -2.7 | 5.4 | 7.2 | -1.0 | 3.0 |
| SpawnK2 | 378 | 47.9 | -3.0 | 5.5 | 6.9 | -1.4 | 2.9 |
| MorphP | 397 | 47.7 | -3.2 | 5.3 | 10.3 | +3.1 | 3.3 |
| Rally | 408 | 47.4 | -3.6 | 5.3 | 7.1 | -1.1 | 2.9 |
| EarthQuake | 354 | 47.2 | -3.8 | 5.6 | 9.0 | +1.4 | 3.3 |
| GrowthB | 386 | 46.0 | -5.4 | 5.4 | 7.5 | -0.6 | 3.0 |
