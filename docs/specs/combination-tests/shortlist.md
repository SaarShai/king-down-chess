# Fixed combination shortlist

The discovery inputs are the checked campaign from 9 October. Hashes and cell counts are in
main sim/out/combination-tests-20261010/discovery.json. It reads 12,000 ordinary games, 6,000
card/control games and 5,280 powers games. The 10,000 worth games supply context, not pooled
random-army observations. None of the discovery associations is a confirmed causal effect.
The scan examines 15 fairy-piece pairs, 168 piece/card pairs, and 377 card pairs with at least
30 examples in every discovery cell. These selected patterns need independent tests.

| Candidate | Reason for selection | Controlled factors |
|---|---|---|
| Archer + Ogre | Mechanism: a shove may open a shot. Selected before seeing the ranking. | Archer versus Knight; Ogre versus Bishop |
| Guard + Maester | Participation concern and possible defensive cooperation. | Guard versus Knight; Maester versus Bishop |
| Archer + Beast | Strongest piece-pair draw interaction in discovery; may be redundant rather than beneficial. | Archer versus Knight; Beast versus Bishop |
| Beast + Flight | Mechanism: relocation may give a slow piece a useful role. | Beast versus Knight; Flight present/absent |
| Guard + EarthQuakeB | Largest piece/card draw interaction signal; 204 joint examples. | Guard versus Knight; EarthQuakeB present/absent |
| Beast + Rally | Piece/card signal and a different way to aid mobility; 175 joint examples. | Beast versus Knight; Rally present/absent |
| Mimic + SkyLift | Strongest card-pair draw warning; only 42 joint examples. | Each card present/absent |
| GrowthB + MorphP | Strong card-pair draw reduction signal; only 54 joint examples. | Each card present/absent; fixed draw order |

The controlled opponent keeps the reference army and no cards. Swap the focal side. The
four-cell contrast removes additive effects on the score scale; it does not turn the reference
pieces into equal material or establish universal synergy. The no-card control is shared when
strategy settings cannot affect it. Keep the card draw order fixed across the Growth cells.

Screen 64 fresh army/seed blocks per candidate at depth 3. Card candidates compare standard
saving values with a spend preset (zero value for unspent cards and zero sacrifice reserve share).
Piece-only candidates use the standard preset. This is 5,632 games, 88 per block. Each game has
at most 300 plies; the four random opening plies use the same RNG stream, not necessarily the
same moves when the piece changes. There are 54 planned outcome contrasts. Use paired-block
intervals and a conservative 3.5-normal-quantile family adjustment (Student correction).

M1 and Kaggle each get one whole pilot block, then disjoint saved block lists. A pilot tests time
and correctness, not significance. Confirm at depth 4 on new blocks only after the screen:
select at most three candidates with the largest absolute draw interaction relative to its
standard error, breaking ties by candidate ID. Keep both favorable and adverse directions.
Use 32 new blocks each, both strategy settings where applicable, with a new timing pilot.
These confirmation samples may remain inconclusive; do not extend them without a reviewed plan.
No game rules, piece prices or shipped AI settings change. No merge.
