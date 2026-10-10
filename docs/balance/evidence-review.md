# Balance evidence review

The owner target is far2 Archer, a Guard next to its king, Paladin beside Ogre in the pool,
Death Touch T2, and four starting cards. The workbook records these approvals.
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
Its SHA256 is `f567dd9f08320915cbe00b5547a9cfa9b2bc1a5c03642202b041584f933eb56c`.
The [source correction ticket](../specs/balance-framework/issues/03-resolve-source-conflicts.md)
records the approved changes and the original workbook in Git. The current workbook uses four
starting cards and the starting-army Beast limit. Historical test readings stay unchanged.
The king-power limit applies to new changes made for balance. Existing approved effects remain.
The framework saves its cell text in `workbook.json`. Some cells keep older “not merged” or
“not decided” text beside the dated approval. Use the dated approval for the target.
Main `7035b5e` now implements far2 at 339 cp, `guardNextToKing=true`, pool `QOLRRBBNNAAGMMS`
with Paladin beside Ogre, and official Death Touch T2. [RULES](../RULES.md) decisions 20, 21, 23, 24,
[MATRIX](../MATRIX.md), and the [build ticket](../specs/owner-decisions-2026-10-09/issues/01-build-the-decisions.md)
record these choices. The [queue](../QUEUE.md) records the approved four-card hand. Card mode
stays lab-only; it is not enabled in the playable game. No selected run measures the full target.

## Criteria

The owner adopts the [six piece criteria](../research/piece-balance-criteria-2026-10-03.md) on
2026-10-03. Worth is 2.5–5.5 pawns except the Queen. Captures are 0.5–1.5× the average except the
Guard, which cannot capture and gets a flag. Moves are at least 0.5×. At least 85% of starting
pieces move. Presence differences stay within ±3 draw points, ±2 White-score points, and ±10%
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
found. Keep these missing decisions explicit. The piece-presence ±2 line is a separate criterion.

The odds method uses a close reference, colour-reversed pairs, all eight pawn files, a calibration
at the same depth, and repeat price passes. Outside ±1.5 pawns from the reference it gives a bound.
A selected threat-position price is not a starting-piece price.

## Strong findings

- Updated worth: Ogre 2.60±0.28, Rook 3.84±0.27, Bishop 3.17±0.27, Maester 3.28±0.27,
  Beast 4.27±0.29. Knight 3.16 is the anchor. The historical report bounds Guard below 1.66; its full calibration uncertainty is not established. The Bishop arm has two bishops
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
- K18 has 5280 games. Its joint intervals are Haste 58.3±4.8 and released Death Touch 55.1±4.3.
  They exclude 50, but Haste crosses the 54% band limit: no firm band failure follows.
  Spirit and Shadow powers are exempt from that ordinary field band. The owner keeps Haste. T2 at depth 4 is 51.1±1.3 against released 57.3±1.3. The T2 run
  is an anchor schedule; it does not certify the other 11 powers. New Darkness 47.8±2.0 and
  Spirit−Shadow−0.8±1.9 come from rounds 16–17, before the full new target.

## Approved campaign: checked worth pass

The frozen 7035b5e source completes 10,000 games: seven piece arms and 3,000 pawn
calibration games. All schedules and stamps match; 80 sampled legal replays pass.
The importer recomputes these values from raw records and uses the same-run pawn scale.

| Piece | Worth | Envelope with scale uncertainty |
|---|---:|---:|
| Ogre | 2.925 | 2.521–3.234 |
| Rook | 3.794 | 3.446–4.281 |
| Bishop | 3.010 | 2.632–3.327 |
| Maester | 3.210 | 2.873–3.567 |
| Beast | 4.247 | 3.836–4.823 |
| Paladin | 4.122 | 3.738–4.660 |
| Archer | 3.591 | 3.270–4.041 |

All seven envelopes lie inside the worth band for this experiment. They are source-error
envelopes, not joint 95% confidence intervals. Shared seeds correlate the arm errors.
The Beast upper corner exceeds the local 1.5-pawn calibration range. The run uses classic
knight substitutions, no Guard, and same-colour bishops. It does not certify random-pool
play, update prices, or approve another price pass. There are 42 ply caps, counted as draws.

Activity has 7,200 checked games as of 08:45 UTC; it remains incomplete. The powers pilot
still runs at that check. The approved 28-card study remains queued. Their contexts are
registered from the frozen specs, including effective per-game rules, but incomplete studies
cannot produce target verdicts. See the campaign ticket and queue for later progress.

## Model anchors: zero to four cards

| Context | Games per arm | Depth | Draws: none → four | Paired draw difference | Paired White difference |
|---|---|---|---|---|---|
| cards-b2/b3, eight-card pool |800|3|16.5%→9.9%|−6.6±3.3 points|−1.3±4.4 points|
| hand-size, 27-card pool |1500|3|18.7%→10.4%|−8.3±2.6|+0.8±3.3|
| hand-size-d4, same 27 cards |600|4|28.3%→14.2%|−14.2±4.7|−3.1±4.9|
| hand-size-d4b, new seed |600|4|31.0%→11.0%|−20.0±4.4|+1.3±5.0|

The two depth 4 samples pool to 29.7%→12.6% in the queue. The exact pooled interval is not in that
row; do not invent it. Each context has its own rule/pool/evaluator/depth/seed/card list. Keep
these anchors separate. The same-hand contrasts measure the tested deal. Card presence rows
are associations. Do not sum them or extend them as causal effects to NEW.

Cards use a carried 64 Elo/pawn calibration with about 25% uncertainty. Later piece passes give
70±11 at depth 3 and 92±13 at depth 4. Do not silently switch the calibration of a card result.

## Reviewed stopped and complete runs

`deal-c4k` stops at 3,498 of 14,000 planned games. Shards 9, 10 and 11 supply 1,749 games
per arm. Four cards give White 50.0±2.2%, draws 9.5±1.4%, and 91.0±2.2 turns. No cards give
51.0±2.1%, 20.0±1.9%, and 101.3±2.1 turns. The arms share no `backRank|seed` keys.
These are separate arm summaries. No paired difference exists. Do not read “same armies” in the
report header as proof that the observed arms overlap.

`deal-d4k` stops at 6,998 of 14,000 planned games. Shards 5, 7, 8, 9, 10 and 11 supply 3,498
six-card games and 3,500 no-card games. Both whole-arm White scores round to 51.8%.
Only 1,166 openings overlap. On that subset, six cards minus none gives White +2.8±3.8 points,
draws −11.7±2.9 points, and length −14.4±3.9 turns. These paired differences use a different
population from the whole-arm columns. They do not contradict the equal rounded scores.
The name `deal-d4k` does not mean depth 4: its spec sets depth 3.

Both stopped card runs use the historical `QORRBBNNAAGMMS` pool without Paladin. The explicit
28-card deck includes Salvation and MirrorB. The seeds are 7581 and 7577. Both specs set
`markFree=true`, `hasteCaptures=false`, `strikeCaptures=false`, and `strikePawns=false`.
The named launch commit is `bc1bb04`; the compressed raw rows do not stamp a source or spec key.
The files prove the observed subsets. They do not complete the planned schedules or the current target.

`deal-nosalv2` has all 3,500 scheduled game IDs, from 0 through 3,499. Its log ends with
3,500 games in 225.8 min. It uses six cards, the same historical pool without Paladin, a 27-card
deck without Salvation, and seed 7579 at depth 3. Its 1,750 shared openings give six cards minus
none: White −0.3±3.1 points, draws −10.5±2.2 points, and length −20.3±3.1 turns.
White is 51.0±2.3% against 51.3±2.1%; draws are 7.6±1.2% against 18.1±1.8%.
This is a deck-without-Salvation contrast against none. It is not a paired test of Salvation removal.
A comparison with another seed or deck does not isolate that card's effect. The interval that
contains zero does not prove White equivalence.

The durable [deal-nosalv2 report](reports/deal-nosalv2.report.md) uses `reportText` and
`mirrorSection` in `src/sim/tournament.ts`. This analysis reads the copied raw and spec; it plays no games.
The raw source is `sim/out/m1/network-2026-10-09/kd-deal/deal-nosalv2.jsonl`, SHA256
`2e897a4340dc25ce84e7c4bb9bcb1d2c41b4fc6a85946910c44ceaa52dade721`.
The adjacent `.tournament.json` has SHA256
`9d2afc11924cfa754642a957a76134ce32cc8911efdeef98f71d7e50b4600425`.
The queue names `bc1bb04`; the compressed rows do not stamp it. Keep that limit explicit.

`ab-guard-drop-any` completes 4,000 games: 100 arrangements × 20 games per arm. Its interval
uses the 100 paired arrangement means. It does not use 4,000 independent games.
The report gives `guardReserve=any` minus `off`: White −0.1±1.9 points, draws +0.1±2.0 points,
decisive share −0.3±2.1 points, length +2.8±1.9 plies, and branching factor +2.0±0.4.
The first three intervals contain zero. This does not establish equality or a no-draw-drag pass.
There is no adopted global equality margin. The extra length and legal moves are measured costs.

Guard raw rows stamp `src=bd592c219166` and pool `QOLRRBBNNAAGMMS`. Their spec keys are
`4d8d77ce013f` and `735a3bb2805a`. They record far2, a Guard next to its king, Paladin `nonPawn`,
and Ogre `push`. The queue names launch commit `cd4da6f`. That commit prices Archer at 505 cp;
`7e7530f` later changes the price to 339 cp. The source stamp is a hash, not a Git commit.
This is historical evidence with a different engine price. It does not certify the current target.
Report draws exclude capped games: 20.5% and 20.7%. Raw summaries include the cap and count
419/2,000 and 425/2,000 draws. Keep these definitions separate.

The [M1 snapshot](m1-snapshot.json) covers 6,966 files and 884,068,015 bytes in nine project folders.
Each copied file matches a subsequent remote SHA256. No file changes during that hash check.
This resolves the earlier remote inventory gap. A file inventory does not replace the source,
schedule, or context checks of each run. No job is launched or changed by this review.

## Next data

The rows below are conditional proposals. Skip a row only when a complete reviewed run proves
its exact target context. None of the four reviewed runs does so.
Main `7035b5e` now supplies the intended pool and Guard placement. The commands pin that
source and set `guardNextToKing=true`. The runner makes `--mirrorOnly` imply `--mirror`.
Row 1 therefore has one game for each of its 12000 pairs. Check the effective rule and pool stamp. Historical data
do not certify this source. Keep each notebook below 9 h. Time a representative shard
before a wave, because these new contexts can change throughput.

The ranked list is in [FRAMEWORK.md](FRAMEWORK.md), built from `evidence.json`:

1. Kaggle ordinary games: criteria 2–6 for the current pool.
2. M1 odds work: a 10,000-game first pass for seven pieces and fresh pawn calibration.
3. Kaggle powers: all twelve powers in the same field.
4. Kaggle four-card deal: a paired current-context test after the final deck choice.

The ordinary games do not measure odds worth. The M1 value test uses fixed classic-rank swaps.
It excludes Guard because that swap puts Guard on b1. `guardNextToKing` changes random setup,
not that fixed swap. Keep the selected Guard-worth question open. The Bishop swap also has two
bishops on the same colour. These limits stay beside the price results.

The M1 first pass keeps shipped prices fixed. It uses seven 1000-game arms and 3000 fresh
pawn-calibration games across all eight files. The copied Archer passes take about 190 seconds
per 1000 games. Allow 45–60 minutes and check the first arm. A second pass needs a separate
review of the measured seed prices; it is not included in this proposal.

For Kaggle, each initial command submits one shard. Check its time before later groups of at
most five. Keep each notebook below nine hours. The card list is a candidate deal, not approval
of Salvation. No proposed run starts in this task.

## Verification

`evidence.json` stores 167 selected measurements with stable IDs, source references, intervals,
counts, depths, run IDs, flags, and explicit nulls when a field is not known. It is a report audit,
not the raw-corpus manifest. The 29 added rows keep the stopped subsets, complete historical runs,
sample units, and source limits distinct. JSON parsing, unique-ID checks, source-ID checks and
whitespace pass. The report builder accepts all 167 rows. The doc checks pass: 74 tests in
four files. Raw checks confirm zero, 1,166 and 1,750 shared openings in `deal-c4k`, `deal-d4k`,
and `deal-nosalv2`. The existing 138 numeric rows stay unchanged.
No simulation, remote job change, tracker edit or game behavior change is part of this work.
