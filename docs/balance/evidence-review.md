# Balance evidence review

The owner target is far2 Archer, a Guard next to its king, Paladin beside Ogre in the pool,
Death Touch T2, and four cards. The workbook records the first four approvals on 2026-10-09.
The queue records the four-card approval: “yes. 4 cards.” The selected reports do not measure this full set.

## Target and source status

| Item | Owner source | Evidence limit |
|---|---|---|
| far2 | Workbook Pieces F8/V8; RULES decision 20: “merge far2” | Worth passes. Depth-4 capture ratio 1.55 [1.51,1.60] still fails the 1.5 cap. |
| Guard next to king | Workbook Pieces J9; RULES decision 21 | f1 beats b1 by 0.53–0.58 pawns. No report tests every random neighbour start. |
| Paladin in pool | Workbook Pieces F13; RULES decision 23 | Old pool test raises White score. No full target pool test is found. |
| Death Touch T2 | Workbook King powers G12/AI12; RULES decision 24 | Anchor scores are 49.3±2.1 at depth 3 and 51.1±1.3 at depth 4. Other field rows have less exposure. |
| Four-card hand | QUEUE deal-c4k: “yes. 4 cards.” | Existing four-card tests use older pools and card sets. Do not run another hand-size sweep. |

The source workbook is `docs/status/king-down-status-2026-10-09.xlsx`.
Its SHA256 is `7b7b998c7f0bb0ff15704533ea484b419eb997927f7f4ff58c1b7c3eb6d75445`.
The framework saves its cell text in `workbook.json`. Some cells keep older “not merged” or
“not decided” text beside the dated approval. Use the dated approval for the target.
Main `7035b5e` now implements far2 at 339 cp, `guardNextToKing=true`, pool `QOLRRBBNNAAGMMS`
with Paladin beside Ogre, and official Death Touch T2. [RULES](../RULES.md) decisions 20,21,23,24,
[MATRIX](../MATRIX.md), and the [build ticket](../specs/owner-decisions-2026-10-09/issues/01-build-the-decisions.md)
record these choices. The [queue](../QUEUE.md) records the approved four-card hand. Card mode
stays lab-only; it is not enabled in the playable game. No selected run measures the full target.

## Criteria

The owner adopts the [six piece criteria](../research/piece-balance-criteria-2026-10-03.md) on
2026-10-03. Worth is 2.5–5.5 pawns except the Queen. Captures are 0.5–1.5× the average except the
Guard, which cannot capture and gets a flag. Moves are at least 0.5×. At least 85% of starting
pieces move. Presence differences stay within±3 draw points,±2 White-score points, and±10%
length. Use each full 95% interval for a firm verdict. A point inside a band is not a firm pass.

Criterion 4 remains open. Its written form cannot fail: one phase is at least the piece's own
whole-game mean. 4b compares with the average piece in a phase. Keep both and mark 4b as open.

The [power method](../research/kings-powers-balance-2026-10-02.md) uses 50±4% against the other
powers, army intervals, and the simultaneous test. The owner lets Spirit and Shadow exceed the
other kings if they balance each other. No numeric equality margin is found. An interval that
contains zero does not prove equality.

The [matrix](../MATRIX.md) gives common cards a 0.7–3 pawn band. No direct owner quote that adopts
these numeric limits is found. Rage is legendary and outside the normal deal. The owner says
[draws come first](../tasks-archive/2026-09.md); the queue asks for depth 4 with no draw drag.
No global numeric noninferiority margin is found. No global absolute White equivalence margin is
found. Keep these missing decisions explicit. The piece-presence±2 line is a separate criterion.

The odds method uses a close reference, colour-reversed pairs, all eight pawn files, a calibration
at the same depth, and repeat price passes. Outside±1.5 pawns from the reference it gives a bound.
A selected threat-position price is not a starting-piece price.

## Strong findings

- Updated worth: Ogre 2.60±0.28, Rook 3.84±0.27, Bishop 3.17±0.27, Maester 3.28±0.27,
  Beast 4.27±0.29. Knight 3.16 is the anchor. Guard<1.66 fails worth. The Bishop arm has two bishops
  of one square colour, unlike the pool. Archer plusDiagFwd2 reads 4.11±0.29 at depth 3 and
  4.43±0.25 at depth 4 with the updated Rook anchor.
- `pa-r1` has 12000 ordinary games. Archer captures 2.11 [2.08,2.13]× average and presence draws
  −6.2 [−8.0,−4.7] points. Guard use 70.2 [69.2,71.3]% and Rook use 81.2 [80.5,81.9]% fail 85%.
  The report describes the old two-Beast pool and has no pool stamp. These do not certify NEW.
- far2 has worth 3.39±0.27 after two passes without adjudication and 3.22±0.34 in a one-pass
  depth 4 Rook match. These are different contexts. The older 2.83 reading is not a strict control
  for an adjudication effect.
- King-near Guard placement gains 0.53±0.14 pawns at depth 3 and 0.54±0.19 /0.58±0.14 at depth 4.
  Defence worth varies with position: random threats give 2.82±0.19, real-game threats 1.05±0.24.
  Do not replace the Guard's starting price with either threat price. `kd-real` repeats only 38
  source positions; exclude it from a broad defence claim.
- Historical Paladin pool change raises White score 6.22 [3.26,9.19] points at depth 3 after rank
  clustering. Depth 4 gives 3.81 [−0.22,7.84]. The pools share no ranks and have no Ogre. This is
  a risk for the new target, not a measured failure of it.
- K18 has 5280 games: Haste 58.3±3.3 and released Death Touch 55.1±2.9 are off centre when tested
  together. The owner keeps Haste. T2 at depth 4 is 51.1±1.3 against released 57.3±1.3. The T2 run
  is an anchor schedule; it does not certify the other 11 powers. New Darkness 47.8±2.0 and
  Spirit−Shadow−0.8±1.9 come from rounds 16–17, before the full new target.

## Model anchors: zero to four cards

| Context | Games per arm | Depth | Draws: none → four | Paired draw difference | Paired White difference |
|---|---|---|---|---|---|
| cards-b2/b3, eight-card pool |800|3|16.5%→9.9%|−6.6±3.3 points|−1.3±4.4 points|
| hand-size,27-card pool |1500|3|18.7%→10.4%|−8.3±2.6|+0.8±3.3|
| hand-size-d4, same 27 cards |600|4|28.3%→14.2%|−14.2±4.7|−3.1±4.9|
| hand-size-d4b, new seed |600|4|31.0%→11.0%|−20.0±4.4|+1.3±5.0|

The two depth 4 samples pool to 29.7%→12.6% in the queue. The exact pooled interval is not in that
row; do not invent it. Each context has its own rule/pool/evaluator/depth/seed/card list. Keep
these anchors separate. The same-hand contrasts measure the tested deal. Card presence rows
are associations. Do not sum them or extend them as causal effects to NEW.

Cards use a carried 64 Elo/pawn calibration with about 25% uncertainty. Later piece passes give
70±11 at depth 3 and 92±13 at depth 4. Do not silently switch the calibration of a card result.

## Next data, after pending runs

`deal-c4k`, `deal-d4k`, `deal-nosalv2` and `ab-guard-drop-any` remain pending for root to reconcile.
No job is launched. No remote job is changed. The M1 hostname does not resolve in the read-only
inventory check. Remote-only raw files remain a coverage gap.

The rows below are conditional proposals. Skip a row if the pending data supply the exact target.
Main `7035b5e` now supplies the intended pool and Guard placement. The commands pin that
source and set `guardNextToKing=true`. Check the effective rule and pool stamp. Historical data
do not certify this source. Keep each notebook below 9 h. Time a representative shard
before a wave, because these new contexts can change throughput.

| rank / id | machine | command flags | games | estimate and decision |
|---|---|---|---|---|
| 1 / `balance-target-activity-d3` | Kaggle:20 shards,5 notebooks a wave,4 workers each | `--powers none --mirrorOnly --pairs 12000 --armies perPair --depth 3 --seed 8101 --rule archerShots=far2 --rule guardNextToKing=true` | 12000 | 94 min per notebook; Read all six criteria for target pool. Keep criterion4/4b distinct. Mark exact full-target ordinary measurements. |
| 2 / `balance-target-powers-d3` | Kaggle:5 shards,5 notebooks,4 workers each | `--powers Freeze,IceWall,Strike,Haste,Flight,Sacrifice,March,Leap,HolyLight,Mercy,DeathTouch,Darkness --pairs 40 --armies perPair --depth 3 --seed 8102 --rule archerShots=far2 --rule markFree=true --rule freezeUses=1 --rule hasteCaptures=false --rule strikePawns=false --rule strikeCaptures=false --rule mercyAura=true --rule mercyAuraPawnsTake=true --rule mercyTakesPawns=true --rule marchUses=0 --rule holyLightTakesPawns=true --rule holyLightShelter=true --rule holyLightShelterOrtho=true --rule darknessMoves=true --rule darknessKingStep2=true --rule deathTouchReach=true --rule deathTouchReachOrtho=true --rule deathTouchReachForwardBack=true --rule guardNextToKing=true` | 5280 | 165 min per notebook; Full round robin, not DeathTouch anchor. Test powers together with army intervals; report Spirit minus Shadow with interval. Haste is approved despite its known high score. |
| 3 / `balance-target-four-d3` | Kaggle:10 shards,5 notebooks per wave,4 workers each | `--powers cards4,none --mirrorOnly --mirror --pairs 3000 --armies perPair --depth 3 --seed 8103 --cardPool Freeze,IceWall,Strike,Haste,Flight,Sacrifice,March,Leap,Mimic,Vault,Curse,SkyLift,Salvation,Firewall,FirewallB,EarthQuake,EarthQuakeB,Burn,FireStarter,Control,Growth,GrowthB,Rally,Spawn2,SpawnK,SpawnK2,MorphP,MirrorB --rule archerShots=far2 --rule markFree=true --rule hasteCaptures=false --rule strikeCaptures=false --rule strikePawns=false --rule guardNextToKing=true` | 6000 | 240 min per notebook; Selected four-card hand vs none on same armies; no hand-size sweep. Report draw/White/turn differences and per-card association limits. |

For row 1,600 games/shard at K18's slowest observed 6.4 games/min is 94 min.
For row 2,1056 at that rate is 165 min. For row 3,600 at deal-d 2's 2.5 games/min is 240 min.
The estimates are under 9 h; a changed context still needs its own timing check. Kaggle has five
active notebooks. Push later waves with the saved manifest and `--only`. The explicit card list
is the workbook's tested 28-card deal. It does not settle Salvation. Root must resolve the deal
before using row 3. Do not launch a duplicate of `deal-c4k`.

M1 has a separate depth 4 card reference: `hand-size-d4` plays 3000 games in 394.8 min with 8 workers.
That gives 7.60 games/min on that machine/context. It is not a Kaggle rate.

## Verification

`evidence.json` stores 138 selected measurements with stable IDs, source references, intervals,
counts, depths, run IDs, flags, and explicit nulls when a field is not known. It is a report audit,
not the raw-corpus manifest. JSON parsing, unique-ID checks, source-ID checks and whitespace pass. The main merge updates
the source facts; the 138 numeric measurement rows stay unchanged.
No simulation, remote action, tracker edit or game edit is part of this work.
