# Balance and rules framework

This framework reads and checks. It does not change the game or choose a rule. Historical evidence is frozen on 2026-10-09. The coverage digest identifies the current collected input set.

The declared target is far2, a Guard next to its king, the Paladin beside the Ogre in the pool, Death Touch T2, and four starting cards. The workbook records these approvals. The reviewed main source implements the piece and power choices, with an Archer price of 3.39 pawns. Card mode stays in the lab. No cited run measures the complete target together.

## Rebuild and check

For campaign decisions, run `npm run balance:build -- --source <main sim/out> --queue <main docs/QUEUE.md> --campaign <saved campaign>`. All input roots are explicit. A build without --campaign can inventory historical local output and the available Drive backup. The command also reads the workbook, approved documents, and cited reports. It writes this report, `measurements.json`, `coverage.md`, `workbook.json`, and `status.json`. Use repeated `--source <folder>` arguments to select a fixed source set. It performs analysis only. It starts no games and contacts no remote machine.

Run `npm run balance:check` for a strict schema and document check. Any source conflict or drift makes it fail. `npm run balance:check -- --report` prints the audit without a failing exit status. A source change still requires review. `npm test` tests the parsers, context boundaries, criteria, workbook reader, and drift detection.

## Typed design model

`src/balance/schema.ts` defines the allowed dimensions. A piece records movement, capture, hop, shield, limits, control, triggers, and zones. A power or card records its source, effect, use count, turn cost, captures, targets, duration, rarity, and conditions. A rule records its flag and allowed value. Shared fields retain approval, version, source, and any text that the matrix cannot express.

There are 27 dimension families and 97 code rule fields. The workbook holds 110 version records. The audit finds 0 source gaps or drift items. See the complete lists below. A typed record is not proof of approval.

The code is the source for shipped behavior. Dated owner choices and this request are the source for the target. The workbook can retain stale text inside an updated cell. Each layer stays separate. The check pins reviewed document sections, rule choices, defaults, and official power readings. It fails on added, changed, or removed source dimensions.

The dataset supplies 7960 distinct measured element/context points. The machine-readable list in status.json links to each measurement's rule values. It lists each non-fitting or unknown dimension. Historical source flags remain intact. They are never coerced to current values.

## Measurements and units

The dataset has 13660 rows from 14817 inventoried sources and 881 run IDs. The [coverage ledger](coverage.md) lists every source and every known run. It also lists unsupported files, missing metadata, partial files, duplicates, void runs, and conflicts. The M1 copy manifest records 6,966 files from nine run folders. Each copied file matches the remote SHA256 at the 9 October audit. The build checks the saved copies again. See [the manifest](m1-snapshot.json) and coverage gaps for absent or changed copies.

A row records element, version, run, flags, commit or source hash, pool, depth, machine, value, error, sample, units, method, and source. Unknown fields are null. Empty historical flags never mean current rules. Rates use fractions. Rate differences use fraction differences. Piece and card worth use pawns. Game length uses plies or turns as named. Activity keeps its denominator.

Copies and shards do not add new games. Report views and cited summaries are alternative views of the same games. Do not sum their samples. Void, incomplete, pending, and conflicting sources cannot supply a result. A stopped run can supply its verified selected sample. Its original plan remains incomplete. A run needs a proved schedule and an exact set of selected game IDs before its sample changes state. Report-only and unstamped results retain their limits.

Use the calibration from the same experiment. Reports use about 64–70 Elo per pawn, and some depth-4 runs use 92 ± 13. The card reports carry 64 with about 25% scale uncertainty. Do not replace these with one global constant. Odds worth is reference price plus Elo difference divided by Elo per pawn. Beyond the local ±1.5-pawn range, retain a bound. `oddsWorth` carries scale error and refuses out-of-range point prices. A guard placement gain or defence-probe gain is not the Guard price.

A pass needs the whole reported interval inside the target band. A fail needs the whole interval outside it. A crossing interval is no-data at this precision. Raw normal intervals over games exclude army variation. Use stored paired or army intervals for a decision. Historical passes do not certify the new rule context. A non-significant difference does not prove equality.

## Criteria and approval

| Criterion | Scope | Target | Approval state | Source |
|---|---|---|---|---|
| piece-worth | pool pieces | {"min":2.5,"max":5.5,"unit":"pawns","exceptions":["Queen"]} | adopted | [criteria](../research/piece-balance-criteria-2026-10-03.md#L11), [criteria-method](../research/piece-balance-criteria-2026-10-03.md#L25) |
| piece-captures | pool pieces | {"min":0.5,"max":1.5,"unit":"ratio_to_average","exceptions":["Guard: flag, cannot capture"]} | adopted | [criteria](../research/piece-balance-criteria-2026-10-03.md#L11), [criteria-method](../research/piece-balance-criteria-2026-10-03.md#L25) |
| piece-moves | pool pieces | {"min":0.5,"max":null,"unit":"ratio_to_average"} | adopted | [criteria](../research/piece-balance-criteria-2026-10-03.md#L11), [criteria-method](../research/piece-balance-criteria-2026-10-03.md#L25) |
| piece-phase | pool pieces | {"min":1,"max":null,"unit":"best_phase_over_own_whole_game"} | adopted | [criteria](../research/piece-balance-criteria-2026-10-03.md#L11), [criteria-method](../research/piece-balance-criteria-2026-10-03.md#L25) |
| piece-use | pool pieces | {"min":85,"max":null,"unit":"percent_of_starting_pieces"} | adopted | [criteria](../research/piece-balance-criteria-2026-10-03.md#L11), [criteria-method](../research/piece-balance-criteria-2026-10-03.md#L25) |
| piece-game | pool pieces | {"drawDifferencePoints":[-3,3],"whiteScoreDifferencePoints":[-2,2],"lengthDifferencePercent":[-10,10]} | adopted | [criteria](../research/piece-balance-criteria-2026-10-03.md#L11), [criteria-method](../research/piece-balance-criteria-2026-10-03.md#L25) |
| piece-phase-4b | pool pieces | {"min":1,"max":null,"unit":"best_phase_over_average_piece"} | open | [criteria-method](../research/piece-balance-criteria-2026-10-03.md#L25) |
| power-field | king powers | {"min":46,"max":54,"unit":"percent_score_vs_other_powers"} | operational target | [powers-method](../research/kings-powers-balance-2026-10-02.md#L89) |
| light-dark | Spirit and Shadow | {"target":0,"tolerance":null,"unit":"score_difference_points"} | adopted qualitative | [power-approval](../tasks-archive/2026-10.md#L458) |
| card-worth | common cards | {"min":0.7,"max":3,"unit":"pawns","exceptions":["Rage: legendary, outside common deal"]} | documented operational band | [card-band](../MATRIX.md#L172), [queue-latest](../QUEUE.md#running-and-queued-2026-10-06), [workbook](../balance/workbook.json) |
| draws-first | all candidate changes | {"direction":"avoid higher draws","noninferiorityMarginPoints":null} | adopted priority | [draw-priority](../tasks-archive/2026-09.md#L447), [queue](../QUEUE.md#piece-balance-queue-2026-09-17-new-focus-fairy-pieces-only) |
| white-parity | all candidate changes | {"target":50,"equivalenceMarginPoints":null} | adopted direction | [cards-early](../research/cards-2026-10-03.md#L86), [power-approval](../tasks-archive/2026-10.md#L458) |
| odds-price | piece prices | {"reference":"Knight or closer standard piece","maxLinearImbalancePawns":1.5,"pawnCalibration":"all eight files; same depth","iteration":"until change <= interval"} | method | [value-method](../SIM-PLAN.md#L119), [criteria-method](../research/piece-balance-criteria-2026-10-03.md#L25) |

Criterion 4 is a weighted-mean identity. It cannot reject a piece. Criterion 4b stays open. The Queen is exempt from the piece worth band. The Guard cannot capture and is flagged on capture share. Rage is legendary and stays outside the common-card band. Global White equivalence and Light–Dark equality have no approved numeric margin. The draw gate comes before other outcome gates.

## Element status

Each row links to the cited evidence in this report and to the same row ID in `measurements.json`. “Evidence check” applies the criterion in the named historical version. “Checked context” needs matching rule and setup evidence. A classic-odds context certifies only that substitution experiment; it does not certify random-pool play. Cards marked testing are included so the whole candidate deal remains visible. The reviewed context list in `target-contexts.json` records only explicitly checked populations. Register immutable sourceHash and specKey values, full flags, pool, mode and a price-source review only after source review. Ordinary, power and card modes have distinct target contexts. A context registration is necessary but not sufficient: each input path must supply a checked measure and a decision interval. Campaign imports check source, spec, schedule and raw hashes before joining. Do not infer a match from a run name.

| Element | Evidence version | Criterion | Evidence check | Checked context | Evidence rows |
|---|---|---|---|---|---|
| Pawn | no measurement | piece-worth | exempt | exempt | none |
| Pawn | no measurement | piece-captures | exempt | exempt | none |
| Pawn | no measurement | piece-moves | exempt | exempt | none |
| Pawn | no measurement | piece-phase | exempt | exempt | none |
| Pawn | no measurement | piece-use | exempt | exempt | none |
| Pawn | no measurement | piece-game | exempt | exempt | none |
| Pawn | no measurement | piece-phase-4b | exempt | exempt | none |
| Pawn | calibration; pv2-d3 | odds-price | no-data | no-data | [evidence:pawn-pv2](#evidence-pawn-pv2) |
| Knight | no measurement | piece-worth | no-data | no-data | none |
| Knight | Oct4 default rule; pa-r1 | piece-captures | pass | no-data | [evidence:pa-r1-N-captures](#evidence-pa-r1-n-captures) |
| Knight | Oct4 default rule; pa-r1 | piece-moves | pass | no-data | [evidence:pa-r1-N-moves](#evidence-pa-r1-n-moves) |
| Knight | no measurement | piece-phase | no-data | no-data | none |
| Knight | Oct4 default rule; pa-r1 | piece-use | pass | no-data | [evidence:pa-r1-N-use](#evidence-pa-r1-n-use) |
| Knight | Oct4 default rule; pa-r1 | piece-game | no-data | no-data | [evidence:pa-r1-N-draw-presence](#evidence-pa-r1-n-draw-presence), [evidence:pa-r1-N-white-presence](#evidence-pa-r1-n-white-presence), [evidence:pa-r1-N-length-presence](#evidence-pa-r1-n-length-presence) |
| Knight | Oct4 default rule; pa-r1 | piece-phase-4b | pass | no-data | [evidence:pa-r1-N-best-phase-4b](#evidence-pa-r1-n-best-phase-4b) |
| Knight | no measurement | odds-price | no-data | no-data | none |
| Bishop | Oct4 default rule; pv2-d3 | piece-worth | pass | pass | [evidence:worth-B-pv2](#evidence-worth-b-pv2), [campaign:balance-target-worth-d3:B:piece-worth:pawnWorth](#campaign-balance-target-worth-d3-b-piece-worth-pawnworth) |
| Bishop | Oct4 default rule; pa-r1 | piece-captures | pass | no-data | [evidence:pa-r1-B-captures](#evidence-pa-r1-b-captures) |
| Bishop | Oct4 default rule; pa-r1 | piece-moves | pass | no-data | [evidence:pa-r1-B-moves](#evidence-pa-r1-b-moves) |
| Bishop | no measurement | piece-phase | no-data | no-data | none |
| Bishop | Oct4 default rule; pa-r1 | piece-use | pass | no-data | [evidence:pa-r1-B-use](#evidence-pa-r1-b-use) |
| Bishop | Oct4 default rule; pa-r1 | piece-game | no-data | no-data | [evidence:pa-r1-B-draw-presence](#evidence-pa-r1-b-draw-presence), [evidence:pa-r1-B-white-presence](#evidence-pa-r1-b-white-presence), [evidence:pa-r1-B-length-presence](#evidence-pa-r1-b-length-presence) |
| Bishop | Oct4 default rule; pa-r1 | piece-phase-4b | fail | no-data | [evidence:pa-r1-B-best-phase-4b](#evidence-pa-r1-b-best-phase-4b) |
| Bishop | no measurement | odds-price | no-data | no-data | none |
| Rook | Oct4 default rule; pv2-d3 | piece-worth | pass | pass | [evidence:worth-R-pv2](#evidence-worth-r-pv2), [campaign:balance-target-worth-d3:R:piece-worth:pawnWorth](#campaign-balance-target-worth-d3-r-piece-worth-pawnworth) |
| Rook | Oct4 default rule; pa-r1 | piece-captures | pass | no-data | [evidence:pa-r1-R-captures](#evidence-pa-r1-r-captures) |
| Rook | Oct4 default rule; pa-r1 | piece-moves | pass | no-data | [evidence:pa-r1-R-moves](#evidence-pa-r1-r-moves) |
| Rook | no measurement | piece-phase | no-data | no-data | none |
| Rook | Oct4 default rule; pa-r1 | piece-use | fail | no-data | [evidence:pa-r1-R-use](#evidence-pa-r1-r-use) |
| Rook | Oct4 default rule; pa-r1 | piece-game | no-data | no-data | [evidence:pa-r1-R-draw-presence](#evidence-pa-r1-r-draw-presence), [evidence:pa-r1-R-white-presence](#evidence-pa-r1-r-white-presence), [evidence:pa-r1-R-length-presence](#evidence-pa-r1-r-length-presence) |
| Rook | Oct4 default rule; pa-r1 | piece-phase-4b | pass | no-data | [evidence:pa-r1-R-best-phase-4b](#evidence-pa-r1-r-best-phase-4b) |
| Rook | no measurement | odds-price | no-data | no-data | none |
| Queen | no measurement | piece-worth | exempt | exempt | none |
| Queen | Oct4 default rule; pa-r1 | piece-captures | pass | no-data | [evidence:pa-r1-Q-captures](#evidence-pa-r1-q-captures) |
| Queen | Oct4 default rule; pa-r1 | piece-moves | pass | no-data | [evidence:pa-r1-Q-moves](#evidence-pa-r1-q-moves) |
| Queen | no measurement | piece-phase | no-data | no-data | none |
| Queen | Oct4 default rule; pa-r1 | piece-use | pass | no-data | [evidence:pa-r1-Q-use](#evidence-pa-r1-q-use) |
| Queen | Oct4 default rule; pa-r1 | piece-game | no-data | no-data | [evidence:pa-r1-Q-draw-presence](#evidence-pa-r1-q-draw-presence), [evidence:pa-r1-Q-white-presence](#evidence-pa-r1-q-white-presence), [evidence:pa-r1-Q-length-presence](#evidence-pa-r1-q-length-presence) |
| Queen | Oct4 default rule; pa-r1 | piece-phase-4b | pass | no-data | [evidence:pa-r1-Q-best-phase-4b](#evidence-pa-r1-q-best-phase-4b) |
| Queen | no measurement | odds-price | no-data | no-data | none |
| King | no measurement | piece-worth | exempt | exempt | none |
| King | no measurement | piece-captures | exempt | exempt | none |
| King | no measurement | piece-moves | exempt | exempt | none |
| King | no measurement | piece-phase | exempt | exempt | none |
| King | no measurement | piece-use | exempt | exempt | none |
| King | no measurement | piece-game | exempt | exempt | none |
| King | no measurement | piece-phase-4b | exempt | exempt | none |
| King | no measurement | odds-price | no-data | no-data | none |
| Archer | plusDiagFwd2; pv2-A-vsR-d3 | piece-worth | no-data | pass | [evidence:worth-A-pv2d3](#evidence-worth-a-pv2d3), [campaign:balance-target-worth-d3:A:piece-worth:pawnWorth](#campaign-balance-target-worth-d3-a-piece-worth-pawnworth) |
| Archer | plusDiagFwd2; pv2-A-vsR-d4 | piece-worth | pass | pass | [evidence:worth-A-pv2d4](#evidence-worth-a-pv2d4), [campaign:balance-target-worth-d3:A:piece-worth:pawnWorth](#campaign-balance-target-worth-d3-a-piece-worth-pawnworth) |
| Archer | far2; pv-A-af2na-n2 | piece-worth | no-data | pass | [evidence:far2-noadj-worth](#evidence-far2-noadj-worth), [campaign:balance-target-worth-d3:A:piece-worth:pawnWorth](#campaign-balance-target-worth-d3-a-piece-worth-pawnworth) |
| Archer | far2; pv-A-af2-vsR-d4 | piece-worth | no-data | pass | [evidence:far2-d4-worth](#evidence-far2-d4-worth), [campaign:balance-target-worth-d3:A:piece-worth:pawnWorth](#campaign-balance-target-worth-d3-a-piece-worth-pawnworth) |
| Archer | plusDiagFwd2; pa-r1 | piece-captures | fail | no-data | [evidence:pa-r1-A-captures](#evidence-pa-r1-a-captures) |
| Archer | far2; pa-af2-d4 | piece-captures | fail | no-data | [evidence:far2-d4-captures](#evidence-far2-d4-captures) |
| Archer | plusDiagFwd2; pa-r1 | piece-moves | pass | no-data | [evidence:pa-r1-A-moves](#evidence-pa-r1-a-moves) |
| Archer | no measurement | piece-phase | no-data | no-data | none |
| Archer | plusDiagFwd2; pa-r1 | piece-use | pass | no-data | [evidence:pa-r1-A-use](#evidence-pa-r1-a-use) |
| Archer | plusDiagFwd2; pa-r1 | piece-game | fail | no-data | [evidence:pa-r1-A-draw](#evidence-pa-r1-a-draw), [evidence:pa-r1-A-white-presence](#evidence-pa-r1-a-white-presence), [evidence:pa-r1-A-length-presence](#evidence-pa-r1-a-length-presence) |
| Archer | plusDiagFwd2; pa-r1 | piece-phase-4b | pass | no-data | [evidence:pa-r1-A-best-phase-4b](#evidence-pa-r1-a-best-phase-4b) |
| Archer | no measurement | odds-price | no-data | no-data | none |
| Guard | Oct4 default rule; pv2-d3 | piece-worth | no-data | no-data | [evidence:worth-G-pv2](#evidence-worth-g-pv2) |
| Guard | Oct4 default rule; pa-r1 | piece-captures | exempt | exempt | [evidence:pa-r1-G-captures](#evidence-pa-r1-g-captures) |
| Guard | Oct4 default rule; pa-r1 | piece-moves | pass | no-data | [evidence:pa-r1-G-moves](#evidence-pa-r1-g-moves) |
| Guard | no measurement | piece-phase | no-data | no-data | none |
| Guard | Oct4 default rule; pa-r1 | piece-use | fail | no-data | [evidence:pa-r1-G-use](#evidence-pa-r1-g-use) |
| Guard | Oct4 default rule; pa-r1 | piece-game | no-data | no-data | [evidence:pa-r1-G-draw-presence](#evidence-pa-r1-g-draw-presence), [evidence:pa-r1-G-white-presence](#evidence-pa-r1-g-white-presence), [evidence:pa-r1-G-length-presence](#evidence-pa-r1-g-length-presence) |
| Guard | Oct4 default rule; pa-r1 | piece-phase-4b | fail | no-data | [evidence:pa-r1-G-best-phase-4b](#evidence-pa-r1-g-best-phase-4b) |
| Guard | no measurement | odds-price | no-data | no-data | none |
| Maester | Oct4 default rule; pv2-d3 | piece-worth | pass | pass | [evidence:worth-M-pv2](#evidence-worth-m-pv2), [campaign:balance-target-worth-d3:M:piece-worth:pawnWorth](#campaign-balance-target-worth-d3-m-piece-worth-pawnworth) |
| Maester | Oct4 default rule; pa-r1 | piece-captures | pass | no-data | [evidence:pa-r1-M-captures](#evidence-pa-r1-m-captures) |
| Maester | Oct4 default rule; pa-r1 | piece-moves | pass | no-data | [evidence:pa-r1-M-moves](#evidence-pa-r1-m-moves) |
| Maester | no measurement | piece-phase | no-data | no-data | none |
| Maester | Oct4 default rule; pa-r1 | piece-use | pass | no-data | [evidence:pa-r1-M-use](#evidence-pa-r1-m-use) |
| Maester | Oct4 default rule; pa-r1 | piece-game | no-data | no-data | [evidence:pa-r1-M-draw-presence](#evidence-pa-r1-m-draw-presence), [evidence:pa-r1-M-white-presence](#evidence-pa-r1-m-white-presence), [evidence:pa-r1-M-length-presence](#evidence-pa-r1-m-length-presence) |
| Maester | Oct4 default rule; pa-r1 | piece-phase-4b | pass | no-data | [evidence:pa-r1-M-best-phase-4b](#evidence-pa-r1-m-best-phase-4b) |
| Maester | no measurement | odds-price | no-data | no-data | none |
| Beast | Oct4 default rule; pv2-d3 | piece-worth | pass | pass | [evidence:worth-S-pv2](#evidence-worth-s-pv2), [campaign:balance-target-worth-d3:S:piece-worth:pawnWorth](#campaign-balance-target-worth-d3-s-piece-worth-pawnworth) |
| Beast | Oct4 default rule; pa-r1 | piece-captures | pass | no-data | [evidence:pa-r1-S-captures](#evidence-pa-r1-s-captures) |
| Beast | Oct4 default rule; pa-r1 | piece-moves | pass | no-data | [evidence:pa-r1-S-moves](#evidence-pa-r1-s-moves) |
| Beast | no measurement | piece-phase | no-data | no-data | none |
| Beast | Oct4 default rule; pa-r1 | piece-use | pass | no-data | [evidence:pa-r1-S-use](#evidence-pa-r1-s-use) |
| Beast | Oct4 default rule; pa-r1 | piece-game | no-data | no-data | [evidence:pa-r1-S-draw-presence](#evidence-pa-r1-s-draw-presence), [evidence:pa-r1-S-white-presence](#evidence-pa-r1-s-white-presence), [evidence:pa-r1-S-length-presence](#evidence-pa-r1-s-length-presence) |
| Beast | Oct4 default rule; pa-r1 | piece-phase-4b | pass | no-data | [evidence:pa-r1-S-best-phase-4b](#evidence-pa-r1-s-best-phase-4b) |
| Beast | no measurement | odds-price | no-data | no-data | none |
| Ogre | Oct4 default rule; pv2-d3 | piece-worth | no-data | pass | [evidence:worth-O-pv2](#evidence-worth-o-pv2), [campaign:balance-target-worth-d3:O:piece-worth:pawnWorth](#campaign-balance-target-worth-d3-o-piece-worth-pawnworth) |
| Ogre | Oct4 default rule; pa-r1 | piece-captures | no-data | no-data | [evidence:pa-r1-O-captures](#evidence-pa-r1-o-captures) |
| Ogre | Oct4 default rule; pa-r1 | piece-moves | pass | no-data | [evidence:pa-r1-O-moves](#evidence-pa-r1-o-moves) |
| Ogre | no measurement | piece-phase | no-data | no-data | none |
| Ogre | Oct4 default rule; pa-r1 | piece-use | pass | no-data | [evidence:pa-r1-O-use](#evidence-pa-r1-o-use) |
| Ogre | Oct4 default rule; pa-r1 | piece-game | no-data | no-data | [evidence:pa-r1-O-draw-presence](#evidence-pa-r1-o-draw-presence), [evidence:pa-r1-O-white-presence](#evidence-pa-r1-o-white-presence), [evidence:pa-r1-O-length-presence](#evidence-pa-r1-o-length-presence) |
| Ogre | Oct4 default rule; pa-r1 | piece-phase-4b | no-data | no-data | [evidence:pa-r1-O-best-phase-4b](#evidence-pa-r1-o-best-phase-4b) |
| Ogre | no measurement | odds-price | no-data | no-data | none |
| Paladin | no measurement | piece-worth | no-data | pass | [campaign:balance-target-worth-d3:L:piece-worth:pawnWorth](#campaign-balance-target-worth-d3-l-piece-worth-pawnworth) |
| Paladin | no measurement | piece-captures | no-data | no-data | none |
| Paladin | no measurement | piece-moves | no-data | no-data | none |
| Paladin | no measurement | piece-phase | no-data | no-data | none |
| Paladin | no measurement | piece-use | no-data | no-data | none |
| Paladin | no measurement | piece-game | no-data | no-data | none |
| Paladin | no measurement | piece-phase-4b | no-data | no-data | none |
| Paladin | no measurement | odds-price | no-data | no-data | none |
| Card mode | eight-card pool; cards-b3 | draws-first | no-data | no-data | [evidence:cards-b3-0to4-draw](#evidence-cards-b3-0to4-draw) |
| Card mode | 27-card pool incl Salvation, no MirrorB; hand-size | draws-first | no-data | no-data | [evidence:hand-size-0to4-draw](#evidence-hand-size-0to4-draw) |
| Card mode | 27-card pool incl Salvation, no MirrorB; hand-size-d4 | draws-first | no-data | no-data | [evidence:hand-size-d4-0to4-draw](#evidence-hand-size-d4-0to4-draw) |
| Card mode | 27-card pool incl Salvation, no MirrorB; hand-size-d4b | draws-first | no-data | no-data | [evidence:hand-size-d4b-0to4-draw](#evidence-hand-size-d4b-0to4-draw) |
| Card mode | 27-card deal depth4; hand-size-d4 | draws-first | no-data | no-data | [evidence:hand-size-d4-cards4-draw-rate](#evidence-hand-size-d4-cards4-draw-rate) |
| Card mode | 27-card deal depth4; hand-size-d4b | draws-first | no-data | no-data | [evidence:hand-size-d4b-cards4-draw-rate](#evidence-hand-size-d4b-cards4-draw-rate) |
| Card mode | 28-card pool with Salvation and MirrorB; deal-c4k; deal-c4k | draws-first | no-data | no-data | [evidence:deal-c4k-cards4-draw](#evidence-deal-c4k-cards4-draw) |
| Card mode | 27-card pool incl Salvation, no MirrorB; hand-size | white-parity | no-data | no-data | [evidence:hand-size-0to4-white](#evidence-hand-size-0to4-white) |
| Card mode | 27-card pool incl Salvation, no MirrorB; hand-size-d4 | white-parity | no-data | no-data | [evidence:hand-size-d4-0to4-white](#evidence-hand-size-d4-0to4-white) |
| Card mode | 27-card pool incl Salvation, no MirrorB; hand-size-d4b | white-parity | no-data | no-data | [evidence:hand-size-d4b-0to4-white](#evidence-hand-size-d4b-0to4-white) |
| Card mode | 28-card pool with Salvation and MirrorB; deal-c4k; deal-c4k | white-parity | no-data | no-data | [evidence:deal-c4k-cards4-white](#evidence-deal-c4k-cards4-white) |
| Freeze | one-use card, cards-d1; cards-d1 | card-worth | no-data | no-data | [evidence:cards-d1-Freeze-worth](#evidence-cards-d1-freeze-worth) |
| Freeze | no measurement | draws-first | no-data | no-data | none |
| Freeze | no measurement | white-parity | no-data | no-data | none |
| IceWall | one-use card, cards-d1; cards-d1 | card-worth | no-data | no-data | [evidence:cards-d1-IceWall-worth](#evidence-cards-d1-icewall-worth) |
| IceWall | no measurement | draws-first | no-data | no-data | none |
| IceWall | no measurement | white-parity | no-data | no-data | none |
| Strike | one-use card, cards-d1; cards-d1 | card-worth | no-data | no-data | [evidence:cards-d1-Strike-worth](#evidence-cards-d1-strike-worth) |
| Strike | no measurement | draws-first | no-data | no-data | none |
| Strike | no measurement | white-parity | no-data | no-data | none |
| Haste | one-use card, cards-d1; cards-d1 | card-worth | no-data | no-data | [evidence:cards-d1-Haste-worth](#evidence-cards-d1-haste-worth) |
| Haste | no measurement | draws-first | no-data | no-data | none |
| Haste | no measurement | white-parity | no-data | no-data | none |
| Flight | one-use card, cards-d1; cards-d1 | card-worth | no-data | no-data | [evidence:cards-d1-Flight-worth](#evidence-cards-d1-flight-worth) |
| Flight | no measurement | draws-first | no-data | no-data | none |
| Flight | no measurement | white-parity | no-data | no-data | none |
| Sacrifice | one-use card, cards-d1; cards-d1 | card-worth | no-data | no-data | [evidence:cards-d1-Sacrifice-worth](#evidence-cards-d1-sacrifice-worth) |
| Sacrifice | no measurement | draws-first | no-data | no-data | none |
| Sacrifice | no measurement | white-parity | no-data | no-data | none |
| March | one-use card, cards-d1; cards-d1 | card-worth | no-data | no-data | [evidence:cards-d1-March-worth](#evidence-cards-d1-march-worth) |
| March | no measurement | draws-first | no-data | no-data | none |
| March | no measurement | white-parity | no-data | no-data | none |
| Leap | one-use card, cards-d1; cards-d1 | card-worth | no-data | no-data | [evidence:cards-d1-Leap-worth](#evidence-cards-d1-leap-worth) |
| Leap | no measurement | draws-first | no-data | no-data | none |
| Leap | no measurement | white-parity | no-data | no-data | none |
| Mimic | one-use card, cards-d1; cards-d1 | card-worth | no-data | no-data | [evidence:cards-d1-Mimic-worth](#evidence-cards-d1-mimic-worth) |
| Mimic | no measurement | draws-first | no-data | no-data | none |
| Mimic | no measurement | white-parity | no-data | no-data | none |
| Vault | one-use card, cards-d1; cards-d1 | card-worth | no-data | no-data | [evidence:cards-d1-Vault-worth](#evidence-cards-d1-vault-worth) |
| Vault | no measurement | draws-first | no-data | no-data | none |
| Vault | no measurement | white-parity | no-data | no-data | none |
| Curse | one-use card, cards-d1; cards-d1 | card-worth | no-data | no-data | [evidence:cards-d1-Curse-worth](#evidence-cards-d1-curse-worth) |
| Curse | no measurement | draws-first | no-data | no-data | none |
| Curse | no measurement | white-parity | no-data | no-data | none |
| SkyLift | one-use card, cards-d1; cards-d1 | card-worth | no-data | no-data | [evidence:cards-d1-SkyLift-worth](#evidence-cards-d1-skylift-worth) |
| SkyLift | no measurement | draws-first | no-data | no-data | none |
| SkyLift | no measurement | white-parity | no-data | no-data | none |
| Salvation | one-use card, cards-d1; cards-d1 | card-worth | no-data | no-data | [evidence:cards-d1-Salvation-worth](#evidence-cards-d1-salvation-worth) |
| Salvation | no measurement | draws-first | no-data | no-data | none |
| Salvation | no measurement | white-parity | no-data | no-data | none |
| Rage | no measurement | card-worth | no-data | no-data | none |
| Rage | no measurement | draws-first | no-data | no-data | none |
| Rage | no measurement | white-parity | no-data | no-data | none |
| MirrorB | no measurement | card-worth | no-data | no-data | none |
| MirrorB | no measurement | draws-first | no-data | no-data | none |
| MirrorB | no measurement | white-parity | no-data | no-data | none |
| Firewall | one-use card, cards-d1; cards-d1 | card-worth | no-data | no-data | [evidence:cards-d1-Firewall-worth](#evidence-cards-d1-firewall-worth) |
| Firewall | no measurement | draws-first | no-data | no-data | none |
| Firewall | no measurement | white-parity | no-data | no-data | none |
| FirewallB | one-use card, cards-d1; cards-d1 | card-worth | no-data | no-data | [evidence:cards-d1-FirewallB-worth](#evidence-cards-d1-firewallb-worth) |
| FirewallB | no measurement | draws-first | no-data | no-data | none |
| FirewallB | no measurement | white-parity | no-data | no-data | none |
| EarthQuake | one-use card, cards-d1; cards-d1 | card-worth | no-data | no-data | [evidence:cards-d1-EarthQuake-worth](#evidence-cards-d1-earthquake-worth) |
| EarthQuake | no measurement | draws-first | no-data | no-data | none |
| EarthQuake | no measurement | white-parity | no-data | no-data | none |
| EarthQuakeB | one-use card, cards-d1; cards-d1 | card-worth | no-data | no-data | [evidence:cards-d1-EarthQuakeB-worth](#evidence-cards-d1-earthquakeb-worth) |
| EarthQuakeB | no measurement | draws-first | no-data | no-data | none |
| EarthQuakeB | no measurement | white-parity | no-data | no-data | none |
| Burn | one-use card, cards-d1; cards-d1 | card-worth | no-data | no-data | [evidence:cards-d1-Burn-worth](#evidence-cards-d1-burn-worth) |
| Burn | no measurement | draws-first | no-data | no-data | none |
| Burn | no measurement | white-parity | no-data | no-data | none |
| FireStarter | one-use card, cards-d1; cards-d1 | card-worth | no-data | no-data | [evidence:cards-d1-FireStarter-worth](#evidence-cards-d1-firestarter-worth) |
| FireStarter | no measurement | draws-first | no-data | no-data | none |
| FireStarter | no measurement | white-parity | no-data | no-data | none |
| Control | one-use card, cards-d1; cards-d1 | card-worth | no-data | no-data | [evidence:cards-d1-Control-worth](#evidence-cards-d1-control-worth) |
| Control | no measurement | draws-first | no-data | no-data | none |
| Control | no measurement | white-parity | no-data | no-data | none |
| Growth | one-use card, cards-d1; cards-d1 | card-worth | no-data | no-data | [evidence:cards-d1-Growth-worth](#evidence-cards-d1-growth-worth) |
| Growth | no measurement | draws-first | no-data | no-data | none |
| Growth | no measurement | white-parity | no-data | no-data | none |
| GrowthB | one-use card, cards-d1; cards-d1 | card-worth | no-data | no-data | [evidence:cards-d1-GrowthB-worth](#evidence-cards-d1-growthb-worth) |
| GrowthB | no measurement | draws-first | no-data | no-data | none |
| GrowthB | no measurement | white-parity | no-data | no-data | none |
| Rally | one-use card, cards-d1; cards-d1 | card-worth | no-data | no-data | [evidence:cards-d1-Rally-worth](#evidence-cards-d1-rally-worth) |
| Rally | no measurement | draws-first | no-data | no-data | none |
| Rally | no measurement | white-parity | no-data | no-data | none |
| MorphP | one-use card, cards-d1; cards-d1 | card-worth | no-data | no-data | [evidence:cards-d1-MorphP-worth](#evidence-cards-d1-morphp-worth) |
| MorphP | no measurement | draws-first | no-data | no-data | none |
| MorphP | no measurement | white-parity | no-data | no-data | none |
| Spawn2 | one-use card, cards-d1; cards-d1 | card-worth | no-data | no-data | [evidence:cards-d1-Spawn2-worth](#evidence-cards-d1-spawn2-worth) |
| Spawn2 | no measurement | draws-first | no-data | no-data | none |
| Spawn2 | no measurement | white-parity | no-data | no-data | none |
| SpawnK | one-use card, cards-d1; cards-d1 | card-worth | no-data | no-data | [evidence:cards-d1-SpawnK-worth](#evidence-cards-d1-spawnk-worth) |
| SpawnK | no measurement | draws-first | no-data | no-data | none |
| SpawnK | no measurement | white-parity | no-data | no-data | none |
| SpawnK2 | one-use card, cards-d1; cards-d1 | card-worth | no-data | no-data | [evidence:cards-d1-SpawnK2-worth](#evidence-cards-d1-spawnk2-worth) |
| SpawnK2 | no measurement | draws-first | no-data | no-data | none |
| SpawnK2 | no measurement | white-parity | no-data | no-data | none |
| Freeze | no measurement | power-field | no-data | no-data | none |
| Freeze | no measurement | draws-first | no-data | no-data | none |
| Freeze | no measurement | white-parity | no-data | no-data | none |
| IceWall | no measurement | power-field | no-data | no-data | none |
| IceWall | no measurement | draws-first | no-data | no-data | none |
| IceWall | no measurement | white-parity | no-data | no-data | none |
| Strike | no measurement | power-field | no-data | no-data | none |
| Strike | no measurement | draws-first | no-data | no-data | none |
| Strike | no measurement | white-parity | no-data | no-data | none |
| Haste | released; kp2-r18 | power-field | no-data | no-data | [evidence:k18-Haste](#evidence-k18-haste) |
| Haste | no measurement | draws-first | no-data | no-data | none |
| Haste | no measurement | white-parity | no-data | no-data | none |
| Flight | no measurement | power-field | no-data | no-data | none |
| Flight | no measurement | draws-first | no-data | no-data | none |
| Flight | no measurement | white-parity | no-data | no-data | none |
| Sacrifice | no measurement | power-field | no-data | no-data | none |
| Sacrifice | no measurement | draws-first | no-data | no-data | none |
| Sacrifice | no measurement | white-parity | no-data | no-data | none |
| March | no measurement | power-field | no-data | no-data | none |
| March | no measurement | draws-first | no-data | no-data | none |
| March | no measurement | white-parity | no-data | no-data | none |
| Leap | no measurement | power-field | no-data | no-data | none |
| Leap | no measurement | draws-first | no-data | no-data | none |
| Leap | no measurement | white-parity | no-data | no-data | none |
| HolyLight | Mercy M2 and Darkness king step; kp2-r16+kp2-r17 | light-dark | no-data | no-data | [evidence:r17-light-dark](#evidence-r17-light-dark) |
| HolyLight | no measurement | draws-first | no-data | no-data | none |
| HolyLight | no measurement | white-parity | no-data | no-data | none |
| Mercy | Mercy M2 and Darkness king step; kp2-r16+kp2-r17 | light-dark | no-data | no-data | [evidence:r17-light-dark](#evidence-r17-light-dark) |
| Mercy | no measurement | draws-first | no-data | no-data | none |
| Mercy | no measurement | white-parity | no-data | no-data | none |
| DeathTouch | Mercy M2 and Darkness king step; kp2-r16+kp2-r17 | light-dark | no-data | no-data | [evidence:r17-light-dark](#evidence-r17-light-dark) |
| DeathTouch | no measurement | draws-first | no-data | no-data | none |
| DeathTouch | no measurement | white-parity | no-data | no-data | none |
| Darkness | Mercy M2 and Darkness king step; kp2-r16+kp2-r17 | light-dark | no-data | no-data | [evidence:r17-light-dark](#evidence-r17-light-dark) |
| Darkness | no measurement | draws-first | no-data | no-data | none |
| Darkness | no measurement | white-parity | no-data | no-data | none |
| Random back rank | no measurement | draws-first | no-data | no-data | none |
| Random back rank | no measurement | white-parity | no-data | no-data | none |
| Bishops on opposite colours | no measurement | draws-first | no-data | no-data | none |
| Bishops on opposite colours | no measurement | white-parity | no-data | no-data | none |
| One guard per army | no measurement | draws-first | no-data | no-data | none |
| One guard per army | no measurement | white-parity | no-data | no-data | none |
| One beast per army | no measurement | draws-first | no-data | no-data | none |
| One beast per army | no measurement | white-parity | no-data | no-data | none |
| Promotion set | no measurement | draws-first | no-data | no-data | none |
| Promotion set | no measurement | white-parity | no-data | no-data | none |
| 50-move draw | no measurement | draws-first | no-data | no-data | none |
| 50-move draw | no measurement | white-parity | no-data | no-data | none |
| Threefold repetition | no measurement | draws-first | no-data | no-data | none |
| Threefold repetition | no measurement | white-parity | no-data | no-data | none |
| Insufficient material | no measurement | draws-first | no-data | no-data | none |
| Insufficient material | no measurement | white-parity | no-data | no-data | none |
| Check / checkmate / stalemate | no measurement | draws-first | no-data | no-data | none |
| Check / checkmate / stalemate | no measurement | white-parity | no-data | no-data | none |
| First move | no measurement | draws-first | no-data | no-data | none |
| First move | no measurement | white-parity | no-data | no-data | none |
| Maester swap and king safety | no measurement | draws-first | no-data | no-data | none |
| Maester swap and king safety | no measurement | white-parity | no-data | no-data | none |
| Kings' powers mode | no measurement | draws-first | no-data | no-data | none |
| Kings' powers mode | no measurement | white-parity | no-data | no-data | none |
| Power use counts | no measurement | draws-first | no-data | no-data | none |
| Power use counts | no measurement | white-parity | no-data | no-data | none |
| Card mode | eight-card pool; cards-b3 | draws-first | no-data | no-data | [evidence:cards-b3-0to4-draw](#evidence-cards-b3-0to4-draw) |
| Card mode | 27-card pool incl Salvation, no MirrorB; hand-size | draws-first | no-data | no-data | [evidence:hand-size-0to4-draw](#evidence-hand-size-0to4-draw) |
| Card mode | 27-card pool incl Salvation, no MirrorB; hand-size-d4 | draws-first | no-data | no-data | [evidence:hand-size-d4-0to4-draw](#evidence-hand-size-d4-0to4-draw) |
| Card mode | 27-card pool incl Salvation, no MirrorB; hand-size-d4b | draws-first | no-data | no-data | [evidence:hand-size-d4b-0to4-draw](#evidence-hand-size-d4b-0to4-draw) |
| Card mode | 27-card deal depth4; hand-size-d4 | draws-first | no-data | no-data | [evidence:hand-size-d4-cards4-draw-rate](#evidence-hand-size-d4-cards4-draw-rate) |
| Card mode | 27-card deal depth4; hand-size-d4b | draws-first | no-data | no-data | [evidence:hand-size-d4b-cards4-draw-rate](#evidence-hand-size-d4b-cards4-draw-rate) |
| Card mode | 28-card pool with Salvation and MirrorB; deal-c4k; deal-c4k | draws-first | no-data | no-data | [evidence:deal-c4k-cards4-draw](#evidence-deal-c4k-cards4-draw) |
| Card mode | 27-card pool incl Salvation, no MirrorB; hand-size | white-parity | no-data | no-data | [evidence:hand-size-0to4-white](#evidence-hand-size-0to4-white) |
| Card mode | 27-card pool incl Salvation, no MirrorB; hand-size-d4 | white-parity | no-data | no-data | [evidence:hand-size-d4-0to4-white](#evidence-hand-size-d4-0to4-white) |
| Card mode | 27-card pool incl Salvation, no MirrorB; hand-size-d4b | white-parity | no-data | no-data | [evidence:hand-size-d4b-0to4-white](#evidence-hand-size-d4b-0to4-white) |
| Card mode | 28-card pool with Salvation and MirrorB; deal-c4k; deal-c4k | white-parity | no-data | no-data | [evidence:deal-c4k-cards4-white](#evidence-deal-c4k-cards4-white) |
| Hand size | no measurement | draws-first | no-data | no-data | none |
| Hand size | no measurement | white-parity | no-data | no-data | none |
| Deal pool | no measurement | draws-first | no-data | no-data | none |
| Deal pool | no measurement | white-parity | no-data | no-data | none |
| Guard start square | no measurement | draws-first | no-data | no-data | none |
| Guard start square | no measurement | white-parity | no-data | no-data | none |
| Turn countdown | no measurement | draws-first | no-data | no-data | none |
| Turn countdown | no measurement | white-parity | no-data | no-data | none |
| Arrange mode | no measurement | draws-first | no-data | no-data | none |
| Arrange mode | no measurement | white-parity | no-data | no-data | none |
| Piece balance criteria | no measurement | draws-first | no-data | no-data | none |
| Piece balance criteria | no measurement | white-parity | no-data | no-data | none |
| Presets | no measurement | draws-first | no-data | no-data | none |
| Presets | no measurement | white-parity | no-data | no-data | none |

Paralysis, conditions and interactions remain not measured unless the source explicitly supplies them. They are not inferred from value.

Status follows the named evidence version and its interval. A pointwise power screen is not a simultaneous field verdict. Anchor schedules cannot certify all twelve powers together.

## Effects supported by the data

The only numeric response curve here uses hand size within one recorded deal and rule context. `predictEffect` interpolates between measured sizes. It refuses other contexts and extrapolation. Its envelope carries source error only. Unknown curvature and cross-arm covariance prevent a new 95% prediction claim. A controlled contrast is stronger evidence than this interpolation.

Four-card draw reductions replicate within separate contexts: early eight-card pool, later 27-card pool, and two depth-4 seeds. These are not one pooled experiment. The published combined depth-4 rates are 29.7% with no cards and 12.6% with four. White-score intervals do not establish a stable unchanged edge. These results do not give the worth of a new piece or card.

| Contrast | Effect | Reported interval | Evidence |
|---|---:|---|---|
| cards-b3 | -6.6 points | -9.9 to -3.3 | [evidence:cards-b3-0to4-draw](#evidence-cards-b3-0to4-draw) |
| hand-size | -8.3 points | -10.9 to -5.7 | [evidence:hand-size-0to4-draw](#evidence-hand-size-0to4-draw) |
| hand-size-d4 | -14.2 points | -18.9 to -9.5 | [evidence:hand-size-d4-0to4-draw](#evidence-hand-size-d4-0to4-draw) |
| hand-size-d4b | -20 points | -24.4 to -15.6 | [evidence:hand-size-d4b-0to4-draw](#evidence-hand-size-d4b-0to4-draw) |

Shot geometry, Guard location, and power restrictions have direct measured contrasts. They do not identify a general feature-to-worth law. Several properties change together, the samples use different depths and prices, and many variants share armies. A regression across all rows would treat duplicate and incompatible evidence as independent.

| Source context | Model example: five cards | Source-error envelope |
|---|---:|---|
| hand-size-d4 | 11.95% draws | 9.35% to 14.55% |
| hand-size-d4b | 11.65% draws | 9.1% to 14.2% |

These examples interpolate the four- and six-card observations. They are not new run results. They do not include unknown model error. No extra hand-size run is proposed.

The completed worth campaign uses classic knight substitutions at depth 3, one price pass, and one pawn calibration. It has no Guard arm and uses same-colour bishops. Shared seeds correlate arm and calibration errors; the displayed bounds are source-error envelopes, not joint 95% intervals. An envelope can extend beyond the local 1.5-pawn calibration range. Price updates printed by the source experiment report are not approved.

- Piece matrix, column B: The NEW column has no design properties. No worth is inferred.
- Card matrix, column B: The NEW column has no design properties. No worth is inferred.

## Reviewed run results

These runs were pending in the request. A stopped sample is not completion of its original plan. A result in an old or unstamped context does not pass the current target.

| Run | Lifecycle / validity | Observed / selected / planned games | Evidence rows | Dependent conclusion |
|---|---|---|---|---|
| deal-c4k | stopped / valid | 3498 / 3498 / 14000 | [13 rows](#run-deal-c4k) | No checked target context. No verified paired rows in this dataset view. |
| deal-d4k | stopped / valid | 6998 / 6998 / 14000 | [13 rows](#run-deal-d4k) | No checked target context. No verified paired rows in this dataset view. |
| deal-nosalv2 | complete / valid | 3500 / 3500 / 3500 | [11 rows](#run-deal-nosalv2) | No checked target context. No verified paired rows in this dataset view. |
| ab-guard-drop-any | complete / valid | 4000 / 4000 / 4000 | [35 rows](#run-ab-guard-drop-any) | No checked target context. Paired rows are present; use each row sample. |
| balance-target-worth-d3 | complete / valid | 10000 / 10000 / 10000 | [38 rows](#run-balance-target-worth-d3) | Checked target context is present. No verified paired rows in this dataset view. |

## Ranked run proposals

These rows use QUEUE format. They are proposals only. The main queue is unchanged. Each notebook estimate stays below nine hours. Time one shard before a wave. A complete matching run with at least the proposed sample removes its duplicate. Historical samples do not remove a target check. The completed, checked campaign studies can remove their matching proposal. Required measures must also share the same comparison.

| id | machine / commit | command | games | result / decision rule |
|---|---|---|---:|---|
| 1. balance-target-activity-d3 | Kaggle: 20 shards, 5 notebooks a wave, 4 workers each; proposed source 7035b5e | `node tools/kaggle-tournament.mjs push --ref 7035b5e56c8de435d2e63dc02d47d7002bd54a6e --id balance-target-activity-d3 --shards 20 --first 19 -- --powers none --mirrorOnly --pairs 12000 --armies perPair --depth 3 --seed 8101 --rule archerShots=far2 --rule guardNextToKing=true` | 12000 | running / partial; 94 min/notebook. Read criteria 2–6 for the target pool. Criterion 1 needs separate odds work. Keep criteria 4 and 4b distinct. |
| 3. balance-target-powers-d3 | Kaggle: 5 shards, 5 notebooks, 4 workers each; proposed source 7035b5e | `node tools/kaggle-tournament.mjs push --ref 7035b5e56c8de435d2e63dc02d47d7002bd54a6e --id balance-target-powers-d3 --shards 5 --first 4 -- --powers Freeze,IceWall,Strike,Haste,Flight,Sacrifice,March,Leap,HolyLight,Mercy,DeathTouch,Darkness --pairs 40 --armies perPair --depth 3 --seed 8102 --rule archerShots=far2 --rule markFree=true --rule freezeUses=1 --rule hasteCaptures=false --rule strikePawns=false --rule strikeCaptures=false --rule mercyAura=true --rule mercyAuraPawnsTake=true --rule mercyTakesPawns=true --rule marchUses=0 --rule holyLightTakesPawns=true --rule holyLightShelter=true --rule holyLightShelterOrtho=true --rule darknessMoves=true --rule darknessKingStep2=true --rule deathTouchReach=true --rule deathTouchReachOrtho=true --rule deathTouchReachForwardBack=true --rule guardNextToKing=true` | 5280 | proposed; 165 min/notebook. Full round robin, not DeathTouch anchor. Test powers together with army intervals; report Spirit minus Shadow with interval. Haste is approved despite its known high score. |
| 4. balance-target-four-d3 | Kaggle: 10 shards, 5 notebooks per wave, 4 workers each; proposed source 7035b5e | `node tools/kaggle-tournament.mjs push --ref 7035b5e56c8de435d2e63dc02d47d7002bd54a6e --id balance-target-four-d3 --shards 10 --first 9 -- --powers cards4,none --mirrorOnly --mirror --pairs 3000 --armies perPair --depth 3 --seed 8103 --cardPool Freeze,IceWall,Strike,Haste,Flight,Sacrifice,March,Leap,Mimic,Vault,Curse,SkyLift,Salvation,Firewall,FirewallB,EarthQuake,EarthQuakeB,Burn,FireStarter,Control,Growth,GrowthB,Rally,Spawn2,SpawnK,SpawnK2,MorphP,MirrorB --rule archerShots=far2 --rule markFree=true --rule hasteCaptures=false --rule strikeCaptures=false --rule strikePawns=false --rule guardNextToKing=true` | 6000 | proposed; 240 min/notebook. Selected four-card hand vs none on same armies; no hand-size sweep. Report draw/White/turn differences and per-card association limits. |

**balance-target-activity-d3:** 600 games per shard at 6.4 games/min gives 94 min. This uses the slowest K18 shard: 1056 games in 165 min. The ordinary target can change throughput. The initial --first 19 command submits shard 19 only. Time it before later --only groups of at most five. The four named runs are reviewed. None supplies this exact target. Main 7035b5e implements pool QOLRRBBNNAAGMMS with Paladin and Ogre, far2 at 339 cp, and guardNextToKing=true. Pin that commit or a reviewed identical engine. Check its effective rules and pool stamp. Historical data do not certify this context. The initial command submits one representative shard. Check its time before more submissions. Keep each notebook below 9 h. Reduce the games per shard if needed. Submit later shards with the saved manifest and --only, in groups of at most five. These are proposals; no run has approval here.

**balance-target-powers-d3:** 1056 games per shard at 6.4 games/min gives 165 min. This uses the slowest K18 power shard. The target pool and Guard setup can change throughput. The initial --first 4 command submits shard 4 only. Time it before a later --only group of at most four. The four named runs are reviewed. None supplies this exact target. Main 7035b5e implements pool QOLRRBBNNAAGMMS with Paladin and Ogre, far2 at 339 cp, and guardNextToKing=true. Pin that commit or a reviewed identical engine. Check its effective rules and pool stamp. Historical data do not certify this context. The initial command submits one representative shard. Check its time before more submissions. Keep each notebook below 9 h. Reduce the games per shard if needed. Submit later shards with the saved manifest and --only, in groups of at most five. These are proposals; no run has approval here.

**balance-target-four-d3:** 600 games per shard at 2.5 games/min gives 240 min. This uses deal-d2 six-card depth 3 throughput. The four-card target can change throughput. The initial --first 9 command submits shard 9 only. Time it before later --only groups of at most five. The four named runs are reviewed. None supplies this exact target. Main 7035b5e implements pool QOLRRBBNNAAGMMS with Paladin and Ogre, far2 at 339 cp, and guardNextToKing=true. Pin that commit or a reviewed identical engine. Check its effective rules and pool stamp. Historical data do not certify this context. The initial command submits one representative shard. Check its time before more submissions. Keep each notebook below 9 h. Reduce the games per shard if needed. Submit later shards with the saved manifest and --only, in groups of at most five. These are proposals; no run has approval here. deal-c4k does not supply this exact target: it is a stopped subset, has no shared control openings, and omits Paladin. Skip only if a complete run proves the exact proposed context. The explicit 28-card pool is the tested deal (deal-d1 + MirrorB). It does not adopt Salvation. Record the final pool choice before launch.

## Open owner choices and proposed changes

1. Keep criterion 4 as the current rule, or approve 4b. The present test cannot fail. Pick: 4b for review; retain 4 until approval.
2. Confirm the common-card band and numeric equality margins. The current band is 0.7–3 pawns. Light–Dark and global White equality have no numeric margin. Pick: approve margins before a formal adoption verdict.
3. Resolve the final deal and Salvation with the reviewed samples below. Pick: retain the approved four-card starting hand and use a paired target-deal test. The stopped four-card sample uses the old pool and has no paired overlap.
4. Keep the approved rule choices while the target checks are incomplete. far2 capture share and old Haste strength remain measured concerns. Pick: request the ranked target checks before another balance change.

## Source conflicts and stale evidence

- **target-vs-shipped:** Main 7035b5e implements far2 with ARCHER_V339, king-adjacent Guard, Paladin alongside Ogre in QOLRRBBNNAAGMMS, and official T2. QUEUE records the approved four-card hand. Card mode remains lab-only. No selected report measures the full current target combination. [rules](../RULES.md#L19), [defaults](../../src/rules/setup.ts#L9), [released-powers](../../src/rules/rules.ts#L799), [current-eval](../../src/ai/eval.ts#L69), [queue-four-card-approval](../QUEUE.md#running-and-queued-2026-10-06), [owner-build-ticket](../specs/owner-decisions-2026-10-09/issues/01-build-the-decisions.md#L1)
- **workbook-residue:** Dated Oct 9 approval wins over earlier residue in the same workbook cells: Pieces F8/V8 (far2), J9 (Guard), F13 (Paladin); King powers G12/AI12 (T2). Current RULES decisions 20, 21, 23, 24 and code implement these choices. Workbook Rules D18 closes the hand-size question; QUEUE deal-c4k supplies the later owner quote: yes. 4 cards. [workbook](../balance/workbook.json), [rule-far2](../RULES.md#L211), [rule-guard-next](../RULES.md#L216), [rule-paladin-return](../RULES.md#L225), [rule-t2](../RULES.md#L229), [queue-four-card-approval](../QUEUE.md#running-and-queued-2026-10-06)
- **pool-version:** Criteria/pa-r1 describe the historical 15-letter two-Beast pool QORRBBNNAAGMMSS. Current main 7035b5e uses the 15-letter one-Beast pool QOLRRBBNNAAGMMS with Paladin beside Ogre. The intermediate 14-letter pool QORRBBNNAAGMMS has no Paladin. pa-r1 has no pool stamp. Do not certify the current target with pa-r1. [criteria](../research/piece-balance-criteria-2026-10-03.md#L11), [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8), [rules](../RULES.md#L19), [defaults](../../src/rules/setup.ts#L9)
- **obsolete-prices:** SIM-PLAN seeds and early 5.05 Archer worth are historical. Pass 2 uses a lower Rook anchor. Current main 7035b5e prices far2 at 339 cp from the converged 3.39-pawn match; that engine seed is not new full-target evidence. Workshop labels Fair through 5.0; pool criterion 1 allows 5.5. These are distinct thresholds. [value-method](../SIM-PLAN.md#L119), [values-d3](../research/piece-runs-2026-10-04-pv2-d3.md#L27), [values-a3](../research/piece-runs-2026-10-04-pv2-A-vsR-d3.md#L21), [workshop](../WORKSHOP.md#L61), [current-eval](../../src/ai/eval.ts#L69)
- **card-calibration:** Cards use carried 64 Elo/pawn with about 25% calibration uncertainty. Piece passes measure 70±11 d3 and 92±13 d4. Do not replace card calibration across depths silently. [cards-method](../research/cards-2026-10-03.md#L438), [values-d3](../research/piece-runs-2026-10-04-pv2-d3.md#L27), [values-a4](../research/piece-runs-2026-10-04-pv2-A-vsR-d4.md#L22)
- **no-effect-is-not-equivalence:** Use full intervals for pass/fail. No significant rise does not establish no draw drag or equality. Noninferiority margins for global draws and absolute White parity remain unknown. [criteria-method](../research/piece-balance-criteria-2026-10-03.md#L25), [powers-method](../research/kings-powers-balance-2026-10-02.md#L89), [draw-priority](../tasks-archive/2026-09.md#L447)
- **remote-gap:** The read-only M1 snapshot verifies 6966 files and 884068015 bytes across nine project folders. Each copied file matches a subsequent remote SHA256. Source stamps and schedule checks still govern each run; the inventory alone is not game evidence. [m1-snapshot](../balance/m1-snapshot.json)
- **pending-runs:** deal-c4k and deal-d4k are stopped subsets, not complete original schedules. deal-nosalv2 and ab-guard-drop-any have complete historical schedules. None supplies the exact current target: card pools omit Paladin, the six-card runs use the wrong hand size, and Guard uses the pre-reprice Archer. No duplicate launch is justified by a filename or a completed label. [deal-c4k-report](../../sim/out/deal-c4k.report.md), [deal-d4k-report](../../sim/out/deal-d4k.report.md), [deal-nosalv2-report](../balance/reports/deal-nosalv2.report.md), [guard-drop-price](../../src/ai/eval.ts)
- **approved-source-corrections:** Resolved by owner approval: the movement limit applies to new changes when adjusting a king power for balance. Existing approved effects remain. Each side starts with four cards. Each army starts with at most one Beast; Morph cannot create one while that side has one. Salvation or Sacrifice may return a captured Beast even if that gives the side a second Beast. Historical six-card evidence keeps its source conditions. [source-corrections](../specs/balance-framework/issues/03-resolve-source-conflicts.md#L8), [workbook](../balance/workbook.json), [rules](../RULES.md#L19)

## Matrix and schema audit

| Code | Source | Approval | Finding |
|---|---|---|---|

No source gaps or drift items remain.

## Workbook version coverage

| Element | Version | Status | Cell | Typed mapping |
|---|---|---|---|---|
| Pawn | Base | Approved | Pieces!C2 | piece |
| Knight | Base | Approved | Pieces!C3 | piece |
| Bishop | Base | Approved | Pieces!C4 | piece |
| Rook | Base | Approved | Pieces!C5 | piece |
| Queen | Base | Approved | Pieces!C6 | piece |
| King | Base | Approved | Pieces!C7 | piece |
| Archer | Far2 | Approved | Pieces!C8 | piece |
| Archer | plusDiagFwd2Clear | Testing | Pieces!G8 | piece |
| Archer | fwd2NoBack | Testing | Pieces!G8 | piece |
| Archer | fwd2NoSide | Testing | Pieces!G8 | piece |
| Archer | Over2 | Rejected | Pieces!K8 | piece |
| Archer | Over23 | Rejected | Pieces!O8 | piece |
| Archer | PlusDiagFwd2 | Dropped | Pieces!S8 | piece |
| Guard | Base | Approved | Pieces!C9 | piece |
| Guard | Starts next to the king | Approved | Pieces!G9 | rule |
| Guard | Morph questions | Approved | Pieces!K9 | globalRule |
| Guard | Drop on any empty square | Testing | Pieces!O9 | rule |
| Guard | rank1 | Rejected | Pieces!S9 | piece |
| Guard | rank12 | Rejected | Pieces!S9 | piece |
| Maester | Base | Approved | Pieces!C10 | piece |
| Beast | Base | Approved | Pieces!C11 | piece |
| Ogre | Base | Approved | Pieces!C12 | piece |
| Paladin | Base | Approved | Pieces!C13 | piece |
| Catapult | stay | Dropped | Pieces!C14 | piece |
| Catapult | land | Dropped | Pieces!C14 | piece |
| Reaver | any | Dropped | Pieces!C15 | piece |
| Reaver | ortho | Dropped | Pieces!C15 | piece |
| Templar | Base | Rejected | Pieces!C16 | piece |
| Squire | Base | Dropped | Pieces!C17 | piece |
| Card mode | Base | Testing | Cards!C2 | globalRule |
| Freeze | Base | Testing | Cards!C3 | card |
| Ice Wall | Base | Testing | Cards!C4 | card |
| Strike | Base | Testing | Cards!C5 | card |
| Haste | Base | Testing | Cards!C6 | card |
| Flight | Base | Testing | Cards!C7 | card |
| Sacrifice | Base | Testing | Cards!C8 | card |
| March | Base | Pending decision | Cards!C9 | card |
| Leap | Base | Testing | Cards!C10 | card |
| Mimic | Base | Testing | Cards!C11 | card |
| Vault | Base | Testing | Cards!C12 | card |
| Curse | Base | Testing | Cards!C13 | card |
| Sky Lift | Base | Testing | Cards!C14 | card |
| Salvation | Base | Testing | Cards!C15 | card |
| Rage | Base | Legendary | Cards!C16 | card |
| Rage | RageB | Rejected | Cards!G16 | card |
| Rage | quiet | Rejected | Cards!K16 | card |
| Rage | stopOnTake | Rejected | Cards!K16 | card |
| Mirror | MirrorB | Testing | Cards!C17 | card |
| Mirror | Base | Dropped | Cards!G17 | card |
| Rescue | Base | Dropped | Cards!C18 | card |
| Firewall | Base | Testing | Cards!C19 | card |
| Firewall | FirewallB | Testing | Cards!G19 | card |
| Earth Quake | Base | Testing | Cards!C20 | card |
| Earth Quake | EarthQuakeB | Testing | Cards!G20 | card |
| Burn | Base | Testing | Cards!C21 | card |
| Fire Starter | Base | Testing | Cards!C22 | card |
| Control | Base | Testing | Cards!C23 | card |
| Growth | Base | Testing | Cards!C24 | card |
| Growth | GrowthB | Testing | Cards!G24 | card |
| Rally | Base | Testing | Cards!C25 | card |
| Morph | MorphP | Testing | Cards!C26 | card |
| Morph | Base | Rejected | Cards!G26 | card |
| Morph | MorphB | Rejected | Cards!K26 | card |
| Morph | MorphS | Dropped | Cards!O26 | card |
| Spawn | Spawn2 | Testing | Cards!C27 | card |
| Spawn | SpawnK | Testing | Cards!G27 | card |
| Spawn | SpawnK2 | Testing | Cards!K27 | card |
| Spawn | Base | Dropped | Cards!O27 | card |
| Freeze | As released | Approved | King powers!D2 | kingPower |
| Ice Wall | As released | Approved | King powers!D3 | kingPower |
| Strike | As released | Approved | King powers!D4 | kingPower |
| Haste | As released | Approved | King powers!D5 | kingPower |
| Flight | As released | Approved | King powers!D6 | kingPower |
| Sacrifice | As released | Approved | King powers!D7 | kingPower |
| March | As released | Approved | King powers!D8 | kingPower |
| Leap | As released | Approved | King powers!D9 | kingPower |
| Holy Light | As released | Approved | King powers!D10 | kingPower |
| Mercy | As released | Approved | King powers!D11 | kingPower |
| Death Touch | T2 (no sideways reach) | Approved | King powers!D12 | kingPower |
| Death Touch | Never backward | Rejected | King powers!H12 | kingPower |
| Death Touch | Never backward + takes pieces only | Rejected | King powers!L12 | kingPower |
| Death Touch | T3 (reach takes pieces only) | Rejected | King powers!P12 | kingPower |
| Death Touch | Next to it only (T5) | Rejected | King powers!T12 | kingPower |
| Death Touch | Next to it + takes by moving (T5m) | Rejected | King powers!X12 | kingPower |
| Death Touch | Diagonal reach | Rejected | King powers!AB12 | kingPower |
| Death Touch | As released | Dropped | King powers!AF12 | kingPower |
| Darkness | As released | Approved | King powers!D13 | kingPower |
| Random back rank (Chess960-style) | Base | Approved | Rules!B2 | globalRule |
| Bishops on opposite colours | Base | Approved | Rules!B3 | rule |
| One guard per army | Base | Approved | Rules!B4 | globalRule |
| One beast per army | Base | Approved | Rules!B5 | globalRule |
| Castling | Base | Rejected | Rules!B6 | globalRule |
| En passant | Base | Rejected | Rules!B7 | globalRule |
| Promotion set | Base | Approved | Rules!B8 | rule |
| 50-move draw | Base | Approved | Rules!B9 | rule |
| Threefold repetition | Base | Approved | Rules!B10 | rule |
| Insufficient material | Base | Approved | Rules!B11 | rule |
| Check / checkmate / stalemate | Base | Approved | Rules!B12 | globalRule |
| First move | Base | Approved | Rules!B13 | rule |
| Maester swap and king safety | Base | Approved | Rules!B14 | globalRule |
| Kings' powers mode | Base | Approved | Rules!B15 | rule |
| Power use counts | Base | Approved | Rules!B16 | rule |
| Card mode | Base | Testing | Rules!B17 | rule |
| Hand size | Base | Approved | Rules!B18 | globalRule |
| Deal pool | Base | Pending decision | Rules!B19 | globalRule |
| Guard start square | Base | Approved | Rules!B20 | globalRule |
| Turn countdown | Base | Pending decision | Rules!B21 | globalRule |
| Arrange mode | Base | Pending decision | Rules!B22 | globalRule |
| Piece balance criteria | Base | Approved | Rules!B23 | globalRule |
| ?rules=2017 / ?rules=2021 presets | Base | Approved | Rules!B24 | globalRule |

## Cited measurements

The IDs below also occur in `measurements.json`. The values here retain source units for review. The dataset converts percentages to fractions. A bound is not a point price.

<a id="evidence-worth-o-pv2"></a>
**evidence:worth-O-pv2** — Ogre, Oct4 default rule. piece worth: 2.6 pawns. Interval: 2.32 to 2.88 (95%). Sample: 1000. Depth: 3. Run: pv2-d3. Classic asymmetric swap; depth-3 pass 2 prices O293 R365 B299 M321 S414 A463. Knight anchor 3.16. Four random opening plies. Defaults of Oct 4, not NEW. [values-d3](../research/piece-runs-2026-10-04-pv2-d3.md#L27)

<a id="evidence-worth-r-pv2"></a>
**evidence:worth-R-pv2** — Rook, Oct4 default rule. piece worth: 3.84 pawns. Interval: 3.57 to 4.11 (95%). Sample: 1000. Depth: 3. Run: pv2-d3. Classic asymmetric swap; depth-3 pass 2 prices O293 R365 B299 M321 S414 A463. Knight anchor 3.16. Four random opening plies. Defaults of Oct 4, not NEW. [values-d3](../research/piece-runs-2026-10-04-pv2-d3.md#L27)

<a id="evidence-worth-b-pv2"></a>
**evidence:worth-B-pv2** — Bishop, Oct4 default rule. piece worth: 3.17 pawns. Interval: 2.9 to 3.44 (95%). Sample: 1000. Depth: 3. Run: pv2-d3. Classic asymmetric swap; depth-3 pass 2 prices O293 R365 B299 M321 S414 A463. Knight anchor 3.16. Four random opening plies. Defaults of Oct 4, not NEW. Same-colour second Bishop; differs from pool bishops. [values-d3](../research/piece-runs-2026-10-04-pv2-d3.md#L27)

<a id="evidence-worth-m-pv2"></a>
**evidence:worth-M-pv2** — Maester, Oct4 default rule. piece worth: 3.28 pawns. Interval: 3.01 to 3.55 (95%). Sample: 1000. Depth: 3. Run: pv2-d3. Classic asymmetric swap; depth-3 pass 2 prices O293 R365 B299 M321 S414 A463. Knight anchor 3.16. Four random opening plies. Defaults of Oct 4, not NEW. [values-d3](../research/piece-runs-2026-10-04-pv2-d3.md#L27)

<a id="evidence-worth-s-pv2"></a>
**evidence:worth-S-pv2** — Beast, Oct4 default rule. piece worth: 4.27 pawns. Interval: 3.98 to 4.56 (95%). Sample: 1000. Depth: 3. Run: pv2-d3. Classic asymmetric swap; depth-3 pass 2 prices O293 R365 B299 M321 S414 A463. Knight anchor 3.16. Four random opening plies. Defaults of Oct 4, not NEW. [values-d3](../research/piece-runs-2026-10-04-pv2-d3.md#L27)

<a id="evidence-worth-g-pv2"></a>
**evidence:worth-G-pv2** — Guard, Oct4 default rule. piece worth: < 1.66 pawns. Interval: unknown. Sample: 1000. Depth: 3. Run: pv2-d3. Classic asymmetric swap; depth-3 pass 2 prices O293 R365 B299 M321 S414 A463. Knight anchor 3.16. Four random opening plies. Defaults of Oct 4, not NEW. [values-d3](../research/piece-runs-2026-10-04-pv2-d3.md#L27)

<a id="evidence-pawn-pv2"></a>
**evidence:pawn-pv2** — Pawn, calibration. pawn calibration: 70 Elo. Interval: 59 to 81 (95%). Sample: 3000. Depth: 3. Run: pv2-d3. Classic asymmetric swap; depth-3 pass 2 prices O293 R365 B299 M321 S414 A463. Knight anchor 3.16. Four random opening plies. Defaults of Oct 4, not NEW. [values-d3](../research/piece-runs-2026-10-04-pv2-d3.md#L27)

<a id="evidence-worth-a-pv2d3"></a>
**evidence:worth-A-pv2d3** — Archer, plusDiagFwd2. piece worth: 4.11 pawns. Interval: 3.82 to 4.4 (95%). Sample: 1000. Depth: 3. Run: pv2-A-vsR-d3. plusDiagFwd2 Archer vs Rook 3.65. Carry 70 Elo/pawn; no new pawn arm. Classic asymmetric swap; depth-3 pass 2 prices O293 R365 B299 M321 S414 A463. Knight anchor 3.16. Four random opening plies. Defaults of Oct 4, not NEW. [values-a3](../research/piece-runs-2026-10-04-pv2-A-vsR-d3.md#L21)

<a id="evidence-worth-a-pv2d4"></a>
**evidence:worth-A-pv2d4** — Archer, plusDiagFwd2. piece worth: 4.43 pawns. Interval: 4.18 to 4.68 (95%). Sample: 600. Depth: 4. Run: pv2-A-vsR-d4. plusDiagFwd2 Archer vs Rook 3.65. Own 1800-game calibration 92±13 Elo/pawn. Classic asymmetric swap; depth-3 pass 2 prices O293 R365 B299 M321 S414 A463. Knight anchor 3.16. Four random opening plies. Defaults of Oct 4, not NEW. [values-a4](../research/piece-runs-2026-10-04-pv2-A-vsR-d4.md#L22)

<a id="evidence-pa-r1-q-captures"></a>
**evidence:pa-r1-Q-captures** — Queen, Oct4 default rule. captures: 1.14 ratio. Interval: 1.11 to 1.16 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games. No power/card moves or random opening moves counted. Historical two-Beast pool described in report; pool not stamped. Exposure denominator differs by piece. See report starting counts. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-q-moves"></a>
**evidence:pa-r1-Q-moves** — Queen, Oct4 default rule. moves: 1.16 ratio. Interval: 1.14 to 1.18 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games. No power/card moves or random opening moves counted. Historical two-Beast pool described in report; pool not stamped. Exposure denominator differs by piece. See report starting counts. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-q-use"></a>
**evidence:pa-r1-Q-use** — Queen, Oct4 default rule. use: 89.5 percent. Interval: 88.8 to 90.2 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games. No power/card moves or random opening moves counted. Historical two-Beast pool described in report; pool not stamped. Exposure denominator differs by piece. See report starting counts. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-q-best-phase-4b"></a>
**evidence:pa-r1-Q-best-phase-4b** — Queen, Oct4 default rule. best-phase-4b: 1.66 ratio. Interval: 1.63 to 1.7 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games. No power/card moves or random opening moves counted. Historical two-Beast pool described in report; pool not stamped. Exposure denominator differs by piece. See report starting counts. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-o-captures"></a>
**evidence:pa-r1-O-captures** — Ogre, Oct4 default rule. captures: 0.5 ratio. Interval: 0.49 to 0.52 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games. No power/card moves or random opening moves counted. Historical two-Beast pool described in report; pool not stamped. Exposure denominator differs by piece. See report starting counts. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-o-moves"></a>
**evidence:pa-r1-O-moves** — Ogre, Oct4 default rule. moves: 0.98 ratio. Interval: 0.96 to 1.01 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games. No power/card moves or random opening moves counted. Historical two-Beast pool described in report; pool not stamped. Exposure denominator differs by piece. See report starting counts. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-o-use"></a>
**evidence:pa-r1-O-use** — Ogre, Oct4 default rule. use: 87.1 percent. Interval: 86.4 to 87.8 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games. No power/card moves or random opening moves counted. Historical two-Beast pool described in report; pool not stamped. Exposure denominator differs by piece. See report starting counts. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-o-best-phase-4b"></a>
**evidence:pa-r1-O-best-phase-4b** — Ogre, Oct4 default rule. best-phase-4b: 1.02 ratio. Interval: 0.99 to 1.06 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games. No power/card moves or random opening moves counted. Historical two-Beast pool described in report; pool not stamped. Exposure denominator differs by piece. See report starting counts. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-r-captures"></a>
**evidence:pa-r1-R-captures** — Rook, Oct4 default rule. captures: 0.86 ratio. Interval: 0.85 to 0.88 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games. No power/card moves or random opening moves counted. Historical two-Beast pool described in report; pool not stamped. Exposure denominator differs by piece. See report starting counts. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-r-moves"></a>
**evidence:pa-r1-R-moves** — Rook, Oct4 default rule. moves: 0.8 ratio. Interval: 0.78 to 0.81 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games. No power/card moves or random opening moves counted. Historical two-Beast pool described in report; pool not stamped. Exposure denominator differs by piece. See report starting counts. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-r-use"></a>
**evidence:pa-r1-R-use** — Rook, Oct4 default rule. use: 81.2 percent. Interval: 80.5 to 81.9 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games. No power/card moves or random opening moves counted. Historical two-Beast pool described in report; pool not stamped. Exposure denominator differs by piece. See report starting counts. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-r-best-phase-4b"></a>
**evidence:pa-r1-R-best-phase-4b** — Rook, Oct4 default rule. best-phase-4b: 1.45 ratio. Interval: 1.43 to 1.47 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games. No power/card moves or random opening moves counted. Historical two-Beast pool described in report; pool not stamped. Exposure denominator differs by piece. See report starting counts. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-b-captures"></a>
**evidence:pa-r1-B-captures** — Bishop, Oct4 default rule. captures: 0.83 ratio. Interval: 0.81 to 0.84 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games. No power/card moves or random opening moves counted. Historical two-Beast pool described in report; pool not stamped. Exposure denominator differs by piece. See report starting counts. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-b-moves"></a>
**evidence:pa-r1-B-moves** — Bishop, Oct4 default rule. moves: 0.7 ratio. Interval: 0.69 to 0.71 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games. No power/card moves or random opening moves counted. Historical two-Beast pool described in report; pool not stamped. Exposure denominator differs by piece. See report starting counts. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-b-use"></a>
**evidence:pa-r1-B-use** — Bishop, Oct4 default rule. use: 92.9 percent. Interval: 92.5 to 93.3 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games. No power/card moves or random opening moves counted. Historical two-Beast pool described in report; pool not stamped. Exposure denominator differs by piece. See report starting counts. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-b-best-phase-4b"></a>
**evidence:pa-r1-B-best-phase-4b** — Bishop, Oct4 default rule. best-phase-4b: 0.94 ratio. Interval: 0.93 to 0.95 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games. No power/card moves or random opening moves counted. Historical two-Beast pool described in report; pool not stamped. Exposure denominator differs by piece. See report starting counts. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-n-captures"></a>
**evidence:pa-r1-N-captures** — Knight, Oct4 default rule. captures: 0.73 ratio. Interval: 0.72 to 0.74 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games. No power/card moves or random opening moves counted. Historical two-Beast pool described in report; pool not stamped. Exposure denominator differs by piece. See report starting counts. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-n-moves"></a>
**evidence:pa-r1-N-moves** — Knight, Oct4 default rule. moves: 0.78 ratio. Interval: 0.77 to 0.78 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games. No power/card moves or random opening moves counted. Historical two-Beast pool described in report; pool not stamped. Exposure denominator differs by piece. See report starting counts. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-n-use"></a>
**evidence:pa-r1-N-use** — Knight, Oct4 default rule. use: 98.4 percent. Interval: 98.2 to 98.5 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games. No power/card moves or random opening moves counted. Historical two-Beast pool described in report; pool not stamped. Exposure denominator differs by piece. See report starting counts. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-n-best-phase-4b"></a>
**evidence:pa-r1-N-best-phase-4b** — Knight, Oct4 default rule. best-phase-4b: 1.86 ratio. Interval: 1.84 to 1.88 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games. No power/card moves or random opening moves counted. Historical two-Beast pool described in report; pool not stamped. Exposure denominator differs by piece. See report starting counts. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-a-captures"></a>
**evidence:pa-r1-A-captures** — Archer, plusDiagFwd2. captures: 2.11 ratio. Interval: 2.08 to 2.13 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games. No power/card moves or random opening moves counted. Historical two-Beast pool described in report; pool not stamped. Exposure denominator differs by piece. See report starting counts. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-a-moves"></a>
**evidence:pa-r1-A-moves** — Archer, plusDiagFwd2. moves: 1.67 ratio. Interval: 1.65 to 1.69 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games. No power/card moves or random opening moves counted. Historical two-Beast pool described in report; pool not stamped. Exposure denominator differs by piece. See report starting counts. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-a-use"></a>
**evidence:pa-r1-A-use** — Archer, plusDiagFwd2. use: 96.7 percent. Interval: 96.4 to 97 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games. No power/card moves or random opening moves counted. Historical two-Beast pool described in report; pool not stamped. Exposure denominator differs by piece. See report starting counts. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-a-best-phase-4b"></a>
**evidence:pa-r1-A-best-phase-4b** — Archer, plusDiagFwd2. best-phase-4b: 1.68 ratio. Interval: 1.66 to 1.7 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games. No power/card moves or random opening moves counted. Historical two-Beast pool described in report; pool not stamped. Exposure denominator differs by piece. See report starting counts. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-g-captures"></a>
**evidence:pa-r1-G-captures** — Guard, Oct4 default rule. captures: unknown ratio. Interval: unknown. Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games. No power/card moves or random opening moves counted. Historical two-Beast pool described in report; pool not stamped. Exposure denominator differs by piece. See report starting counts. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-g-moves"></a>
**evidence:pa-r1-G-moves** — Guard, Oct4 default rule. moves: 0.56 ratio. Interval: 0.54 to 0.59 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games. No power/card moves or random opening moves counted. Historical two-Beast pool described in report; pool not stamped. Exposure denominator differs by piece. See report starting counts. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-g-use"></a>
**evidence:pa-r1-G-use** — Guard, Oct4 default rule. use: 70.2 percent. Interval: 69.2 to 71.3 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games. No power/card moves or random opening moves counted. Historical two-Beast pool described in report; pool not stamped. Exposure denominator differs by piece. See report starting counts. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-g-best-phase-4b"></a>
**evidence:pa-r1-G-best-phase-4b** — Guard, Oct4 default rule. best-phase-4b: 0.41 ratio. Interval: 0.39 to 0.44 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games. No power/card moves or random opening moves counted. Historical two-Beast pool described in report; pool not stamped. Exposure denominator differs by piece. See report starting counts. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-m-captures"></a>
**evidence:pa-r1-M-captures** — Maester, Oct4 default rule. captures: 0.55 ratio. Interval: 0.54 to 0.56 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games. No power/card moves or random opening moves counted. Historical two-Beast pool described in report; pool not stamped. Exposure denominator differs by piece. See report starting counts. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-m-moves"></a>
**evidence:pa-r1-M-moves** — Maester, Oct4 default rule. moves: 1.15 ratio. Interval: 1.14 to 1.16 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games. No power/card moves or random opening moves counted. Historical two-Beast pool described in report; pool not stamped. Exposure denominator differs by piece. See report starting counts. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-m-use"></a>
**evidence:pa-r1-M-use** — Maester, Oct4 default rule. use: 92.6 percent. Interval: 92.1 to 93 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games. No power/card moves or random opening moves counted. Historical two-Beast pool described in report; pool not stamped. Exposure denominator differs by piece. See report starting counts. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-m-best-phase-4b"></a>
**evidence:pa-r1-M-best-phase-4b** — Maester, Oct4 default rule. best-phase-4b: 1.08 ratio. Interval: 1.06 to 1.09 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games. No power/card moves or random opening moves counted. Historical two-Beast pool described in report; pool not stamped. Exposure denominator differs by piece. See report starting counts. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-s-captures"></a>
**evidence:pa-r1-S-captures** — Beast, Oct4 default rule. captures: 1.08 ratio. Interval: 1.06 to 1.11 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games. No power/card moves or random opening moves counted. Historical two-Beast pool described in report; pool not stamped. Exposure denominator differs by piece. See report starting counts. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-s-moves"></a>
**evidence:pa-r1-S-moves** — Beast, Oct4 default rule. moves: 1.02 ratio. Interval: 1.01 to 1.03 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games. No power/card moves or random opening moves counted. Historical two-Beast pool described in report; pool not stamped. Exposure denominator differs by piece. See report starting counts. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-s-use"></a>
**evidence:pa-r1-S-use** — Beast, Oct4 default rule. use: 95.1 percent. Interval: 94.7 to 95.4 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games. No power/card moves or random opening moves counted. Historical two-Beast pool described in report; pool not stamped. Exposure denominator differs by piece. See report starting counts. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-s-best-phase-4b"></a>
**evidence:pa-r1-S-best-phase-4b** — Beast, Oct4 default rule. best-phase-4b: 1.21 ratio. Interval: 1.19 to 1.23 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games. No power/card moves or random opening moves counted. Historical two-Beast pool described in report; pool not stamped. Exposure denominator differs by piece. See report starting counts. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-a-draw"></a>
**evidence:pa-r1-A-draw** — Archer, plusDiagFwd2. draw rate presence difference: -6.2 points. Interval: -8 to -4.7 (95%). Sample: 12000. Depth: 3. Run: pa-r1. 8869 with Archer vs 3131 without. Observational composition contrast, not controlled removal. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-far2-noadj-worth"></a>
**evidence:far2-noadj-worth** — Archer, far2. piece worth: 3.39 pawns. Interval: 3.12 to 3.66 (95%). Sample: 1000. Depth: 3. Run: pv-A-af2na-n2. Second converged pass vs Knight. Previous pass 3.35±.27. Played to end. Different anchor and seeds from one-pass Rook 2.83; not an adjudication effect. [checked-report-pv-A-af2na-n2](../balance/reports/pv-A-af2na-n2.experiment.md), [queue-latest](../QUEUE.md#running-and-queued-2026-10-06)

<a id="evidence-far2-d4-worth"></a>
**evidence:far2-d4-worth** — Archer, far2. piece worth: 3.22 pawns. Interval: 2.88 to 3.56 (95%). Sample: 600. Depth: 4. Run: pv-A-af2-vsR-d4. One pass vs Rook, pawn calibration 70±14 Elo from 1800 games. Separate from full NEW target. [checked-report-pv-A-af2-vsR-d4](../balance/reports/pv-A-af2-vsR-d4.experiment.md), [queue-latest](../QUEUE.md#running-and-queued-2026-10-06)

<a id="evidence-far2-d4-captures"></a>
**evidence:far2-d4-captures** — Archer, far2. capture ratio: 1.55 ratio. Interval: 1.51 to 1.6 (95%). Sample: 1600. Depth: 4. Run: pa-af2-d4. Same first 1600 armies as pa-d4. Still above criterion 2 cap 1.5. Moved in 99.4% of games is not criterion 5 per-piece use. [queue-latest](../QUEUE.md#running-and-queued-2026-10-06)

<a id="evidence-guard-king-p"></a>
**evidence:guard-king-p** — Guard, king-adjacent f1 versus b1. placement worth gain: 0.53 pawns. Interval: 0.39 to 0.67 (95%). Sample: 4000. Depth: 3. Run: guard-king-p. RNBQKGNR against RGBQKNNR. Normal classic start, Guard f1 vs b1. It does not test all random Guard-neighbour placements. [guard](../research/guard-strategies-2026-10-06.md#L122), [queue-latest](../QUEUE.md#running-and-queued-2026-10-06)

<a id="evidence-guard-king-p-d4m"></a>
**evidence:guard-king-p-d4m** — Guard, king-adjacent f1 versus b1. placement worth gain: 0.54 pawns. Interval: 0.35 to 0.73 (95%). Sample: 2000. Depth: 4. Run: guard-king-p-d4m. RNBQKGNR against RGBQKNNR. Normal classic start, Guard f1 vs b1. It does not test all random Guard-neighbour placements. [guard](../research/guard-strategies-2026-10-06.md#L122), [queue-latest](../QUEUE.md#running-and-queued-2026-10-06)

<a id="evidence-guard-king-p-d4b"></a>
**evidence:guard-king-p-d4b** — Guard, king-adjacent f1 versus b1. placement worth gain: 0.58 pawns. Interval: 0.44 to 0.72 (95%). Sample: 4000. Depth: 4. Run: guard-king-p-d4b. RNBQKGNR against RGBQKNNR. Normal classic start, Guard f1 vs b1. It does not test all random Guard-neighbour placements. [guard](../research/guard-strategies-2026-10-06.md#L122), [queue-latest](../QUEUE.md#running-and-queued-2026-10-06)

<a id="evidence-kd-rand"></a>
**evidence:kd-rand** — Guard, king-adjacent threat position. Guard defence worth gain vs no Guard: 2.82 pawns. Interval: 2.63 to 3.01 (95%). Sample: 24000. Depth: 3. Run: kd-rand. Selected threat-position context, not starting piece price. kd-real2 has 1500 positions; source-game clusters may repeat. kd-real is weak: only 38 source positions, not read. [guard](../research/guard-strategies-2026-10-06.md#L122), [queue-latest](../QUEUE.md#running-and-queued-2026-10-06)

<a id="evidence-kd-rand-d4"></a>
**evidence:kd-rand-d4** — Guard, king-adjacent threat position. Guard defence worth gain vs no Guard: 2.86 pawns. Interval: 2.59 to 3.13 (95%). Sample: 6000. Depth: 4. Run: kd-rand-d4. Selected threat-position context, not starting piece price. kd-real2 has 1500 positions; source-game clusters may repeat. kd-real is weak: only 38 source positions, not read. [guard](../research/guard-strategies-2026-10-06.md#L122), [queue-latest](../QUEUE.md#running-and-queued-2026-10-06)

<a id="evidence-kd-real2"></a>
**evidence:kd-real2** — Guard, king-adjacent threat position. Guard defence worth gain vs no Guard: 1.05 pawns. Interval: 0.81 to 1.29 (95%). Sample: 12000. Depth: 3. Run: kd-real2. Selected threat-position context, not starting piece price. kd-real2 has 1500 positions; source-game clusters may repeat. kd-real is weak: only 38 source positions, not read. [guard](../research/guard-strategies-2026-10-06.md#L122), [queue-latest](../QUEUE.md#running-and-queued-2026-10-06)

<a id="evidence-paladin-pool-d3"></a>
**evidence:paladin-pool-d3** — Paladin, nonPawn in historical no-Ogre pool. White score pool difference: 6.22 points. Interval: 3.26 to 9.19 (95%). Sample: 4000. Depth: 3. Run: pal-with, pal-without. 40 ranks per arm; 0 shared ranks; old QLRRBBNNAAGMMSS vs QRRBBNNAAGMMSS, no Ogre. Rank-clustered CI. Different from NEW pool. [paladin](../research/sim-paladin-pool-2026-09-17.md#L64)

<a id="evidence-paladin-pool-d4"></a>
**evidence:paladin-pool-d4** — Paladin, nonPawn in historical no-Ogre pool. White score pool difference: 3.81 points. Interval: -0.22 to 7.84 (95%). Sample: 1600. Depth: 4. Run: pal-with-d4, pal-without-d4. Rank-clustered interval includes 0. Paladin subset +6.63[.75, 12.50]. Historical pool risk, not a current-target failure. [paladin](../research/sim-paladin-pool-2026-09-17.md#L64)

<a id="evidence-k18-haste"></a>
**evidence:k18-Haste** — Haste, released. score vs powers: 58.3 percent. Interval: 55 to 61.6 (95%). Sample: 880. Depth: 3. Run: kp2-r18. Released powers incl Mercy M2/Darkness king step; 66 matchups/5280 games/2640 armies total. Both flagged by simultaneous test. Haste stays by owner decision. [queue-k18](../QUEUE.md#ran-2026-10-05-k18-the-released-set-on-fresh-armies), [saved-k18-report](../balance/reports/kp2-r18.report.md#L28)

<a id="evidence-k18-deathtouch"></a>
**evidence:k18-DeathTouch** — Death Touch, released. score vs powers: 55.1 percent. Interval: 52.2 to 58 (95%). Sample: 880. Depth: 3. Run: kp2-r18. Released powers incl Mercy M2/Darkness king step; 66 matchups/5280 games/2640 armies total. Both flagged by simultaneous test. Haste stays by owner decision. [queue-k18](../QUEUE.md#ran-2026-10-05-k18-the-released-set-on-fresh-armies), [saved-k18-report](../balance/reports/kp2-r18.report.md#L28)

<a id="evidence-r17-darkness"></a>
**evidence:r17-Darkness** — Darkness, king step. score vs powers: 47.8 percent. Interval: 45.8 to 49.8 (95%). Sample: unknown. Depth: 3. Run: kp2-r16, kp2-r17. Pooled field with king step. Historical package, not NEW; report gives 1144 pairs for paired gain. [powers-r17](../research/kings-powers-balance-2026-10-02.md#L649)

<a id="evidence-r17-light-dark"></a>
**evidence:r17-light-dark** — Spirit minus Shadow, Mercy M2 and Darkness king step. Spirit minus Shadow: -0.8 points. Interval: -2.7 to 1.1 (95%). Sample: unknown. Depth: 3. Run: kp2-r16, kp2-r17. King step package. Contains 0; no pre-set equality margin. [powers-r17](../research/kings-powers-balance-2026-10-02.md#L649)

<a id="evidence-dt-r0"></a>
**evidence:dt-r0** — Death Touch, released. DeathTouch score vs powers: 55.4 percent. Interval: 53.4 to 57.4 (95%). Sample: 1760. Depth: 3. Run: dt-r0. Anchor DeathTouch against other 11; fresh army per pair, seed 1919. Other powers have only 1/11 of anchor exposure; their field rows do not certify a round robin. [queue-latest](../QUEUE.md#running-and-queued-2026-10-06), [t2-raw](../../sim/out/m1/king-down-guard/dt-t2.report.md)

<a id="evidence-dt-t2"></a>
**evidence:dt-t2** — Death Touch, T2. DeathTouch score vs powers: 49.3 percent. Interval: 47.2 to 51.4 (95%). Sample: 1760. Depth: 3. Run: dt-t2. Anchor DeathTouch against other 11; fresh army per pair, seed 1919. Other powers have only 1/11 of anchor exposure; their field rows do not certify a round robin. [queue-latest](../QUEUE.md#running-and-queued-2026-10-06), [t2-raw](../../sim/out/m1/king-down-guard/dt-t2.report.md)

<a id="evidence-dt-r0-d4"></a>
**evidence:dt-r0-d4** — Death Touch, released. DeathTouch score vs powers: 57.3 percent. Interval: 56 to 58.6 (95%). Sample: 4400. Depth: 4. Run: dt-r0-d4. Anchor DeathTouch against other 11; fresh army per pair, seed 1919. Other powers have only 1/11 of anchor exposure; their field rows do not certify a round robin. [queue-latest](../QUEUE.md#running-and-queued-2026-10-06), [t2-raw](../../sim/out/m1/king-down-guard/dt-t2.report.md)

<a id="evidence-dt-t2-d4"></a>
**evidence:dt-t2-d4** — Death Touch, T2. DeathTouch score vs powers: 51.1 percent. Interval: 49.8 to 52.4 (95%). Sample: 4400. Depth: 4. Run: dt-t2-d4. Anchor DeathTouch against other 11; fresh army per pair, seed 1919. Other powers have only 1/11 of anchor exposure; their field rows do not certify a round robin. [queue-latest](../QUEUE.md#running-and-queued-2026-10-06), [t2-raw](../../sim/out/m1/king-down-guard/dt-t2.report.md)

<a id="evidence-cards-b3-0to4-draw"></a>
**evidence:cards-b3-0to4-draw** — cards4, eight-card pool. four cards minus no cards draw rate: -6.6 points. Interval: -9.9 to -3.3 (95%). Sample: 800. Depth: 3. Run: cards-b3. MODEL ANCHOR. Paired by army. Baseline draws 16.5%. Eight one-use-power card pool; seed 5555. Independent contexts; do not pool by hand count or predict NEW as causal fact. [cards-early](../research/cards-2026-10-03.md#L86)

<a id="evidence-hand-size-0to4-draw"></a>
**evidence:hand-size-0to4-draw** — cards4, 27-card pool incl Salvation, no MirrorB. four cards minus no cards draw rate: -8.3 points. Interval: -10.9 to -5.7 (95%). Sample: 1500. Depth: 3. Run: hand-size. MODEL ANCHOR. Paired by army. Baseline draws 18.7%. 27-card deal incl Salvation, no MirrorB. Seeds 7373/7474/7475 by run. Linear evaluation, four random opening plies, adjudication. Independent contexts; do not pool by hand count or predict NEW as causal fact. [hand3](../../sim/out/m1/king-down-guard/hand-size.report.md)

<a id="evidence-hand-size-d4-0to4-draw"></a>
**evidence:hand-size-d4-0to4-draw** — cards4, 27-card pool incl Salvation, no MirrorB. four cards minus no cards draw rate: -14.2 points. Interval: -18.9 to -9.5 (95%). Sample: 600. Depth: 4. Run: hand-size-d4. MODEL ANCHOR. Paired by army. Baseline draws 28.3%. 27-card deal incl Salvation, no MirrorB. Seeds 7373/7474/7475 by run. Linear evaluation, four random opening plies, adjudication. Independent contexts; do not pool by hand count or predict NEW as causal fact. [hand4](../../sim/out/m1/king-down-guard/hand-size-d4.report.md)

<a id="evidence-hand-size-d4b-0to4-draw"></a>
**evidence:hand-size-d4b-0to4-draw** — cards4, 27-card pool incl Salvation, no MirrorB. four cards minus no cards draw rate: -20 points. Interval: -24.4 to -15.6 (95%). Sample: 600. Depth: 4. Run: hand-size-d4b. MODEL ANCHOR. Paired by army. Baseline draws 31%. 27-card deal incl Salvation, no MirrorB. Seeds 7373/7474/7475 by run. Linear evaluation, four random opening plies, adjudication. Independent contexts; do not pool by hand count or predict NEW as causal fact. [hand4b](../../sim/out/m1/king-down-guard/hand-size-d4b.report.md)

<a id="evidence-hand-size-0to4-white"></a>
**evidence:hand-size-0to4-white** — cards4, 27-card pool incl Salvation, no MirrorB. four cards minus no cards White score: 0.8 points. Interval: -2.5 to 4.1 (95%). Sample: 1500. Depth: 3. Run: hand-size. Same context as paired draw anchor. Does not prove equivalence inside an absent pre-set margin. [hand3](../../sim/out/m1/king-down-guard/hand-size.report.md)

<a id="evidence-hand-size-d4-0to4-white"></a>
**evidence:hand-size-d4-0to4-white** — cards4, 27-card pool incl Salvation, no MirrorB. four cards minus no cards White score: -3.1 points. Interval: -8 to 1.8 (95%). Sample: 600. Depth: 4. Run: hand-size-d4. Same context as paired draw anchor. Does not prove equivalence inside an absent pre-set margin. [hand4](../../sim/out/m1/king-down-guard/hand-size-d4.report.md)

<a id="evidence-hand-size-d4b-0to4-white"></a>
**evidence:hand-size-d4b-0to4-white** — cards4, 27-card pool incl Salvation, no MirrorB. four cards minus no cards White score: 1.3 points. Interval: -3.7 to 6.3 (95%). Sample: 600. Depth: 4. Run: hand-size-d4b. Same context as paired draw anchor. Does not prove equivalence inside an absent pre-set margin. [hand4b](../../sim/out/m1/king-down-guard/hand-size-d4b.report.md)

<a id="evidence-deal-d1-draw"></a>
**evidence:deal-d1-draw** — cards6, 27-card deal. six cards minus no cards draw rate: -10.6 points. Interval: -12.3 to -8.9 (95%). Sample: 3000. Depth: 3. Run: deal-d1. 27-card pool incl Salvation; six-card hand. Same 3000 armies each arm; 6000 total games. [cards-deal](../research/cards-2026-10-03.md#L453)

<a id="evidence-deal-d1-white"></a>
**evidence:deal-d1-white** — cards6, 27-card deal. six cards minus no cards White score: -0.2 points. Interval: -2.6 to 2.2 (95%). Sample: 3000. Depth: 3. Run: deal-d1. 27-card pool; six-card hand. Observed 50.2% vs 50.4%; not NEW. [cards-deal](../research/cards-2026-10-03.md#L453)

<a id="evidence-pa-r1-q-draw-presence"></a>
**evidence:pa-r1-Q-draw-presence** — Queen, Oct4 default rule. draw rate presence difference: -2.6 points. Interval: -3.9 to -1.1 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games; historical two-Beast pool, not NEW. Observational with/without composition contrast, not controlled removal. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-q-white-presence"></a>
**evidence:pa-r1-Q-white-presence** — Queen, Oct4 default rule. White score presence difference: 0.8 points. Interval: -0.8 to 2.3 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games; historical two-Beast pool, not NEW. Observational with/without composition contrast, not controlled removal. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-q-length-presence"></a>
**evidence:pa-r1-Q-length-presence** — Queen, Oct4 default rule. length presence difference: -8.8 percent. Interval: -10.4 to -7.1 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games; historical two-Beast pool, not NEW. Observational with/without composition contrast, not controlled removal. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-o-draw-presence"></a>
**evidence:pa-r1-O-draw-presence** — Ogre, Oct4 default rule. draw rate presence difference: 0.3 points. Interval: -1.1 to 1.7 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games; historical two-Beast pool, not NEW. Observational with/without composition contrast, not controlled removal. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-o-white-presence"></a>
**evidence:pa-r1-O-white-presence** — Ogre, Oct4 default rule. White score presence difference: 0.9 points. Interval: -0.6 to 2.6 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games; historical two-Beast pool, not NEW. Observational with/without composition contrast, not controlled removal. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-o-length-presence"></a>
**evidence:pa-r1-O-length-presence** — Ogre, Oct4 default rule. length presence difference: 0.1 percent. Interval: -1.8 to 1.8 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games; historical two-Beast pool, not NEW. Observational with/without composition contrast, not controlled removal. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-r-draw-presence"></a>
**evidence:pa-r1-R-draw-presence** — Rook, Oct4 default rule. draw rate presence difference: -0.6 points. Interval: -2.1 to 1 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games; historical two-Beast pool, not NEW. Observational with/without composition contrast, not controlled removal. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-r-white-presence"></a>
**evidence:pa-r1-R-white-presence** — Rook, Oct4 default rule. White score presence difference: -0.3 points. Interval: -2.3 to 1.5 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games; historical two-Beast pool, not NEW. Observational with/without composition contrast, not controlled removal. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-r-length-presence"></a>
**evidence:pa-r1-R-length-presence** — Rook, Oct4 default rule. length presence difference: -0.8 percent. Interval: -2.8 to 1.2 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games; historical two-Beast pool, not NEW. Observational with/without composition contrast, not controlled removal. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-b-draw-presence"></a>
**evidence:pa-r1-B-draw-presence** — Bishop, Oct4 default rule. draw rate presence difference: 0.8 points. Interval: -0.7 to 2.2 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games; historical two-Beast pool, not NEW. Observational with/without composition contrast, not controlled removal. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-b-white-presence"></a>
**evidence:pa-r1-B-white-presence** — Bishop, Oct4 default rule. White score presence difference: -0.9 points. Interval: -2.8 to 1 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games; historical two-Beast pool, not NEW. Observational with/without composition contrast, not controlled removal. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-b-length-presence"></a>
**evidence:pa-r1-B-length-presence** — Bishop, Oct4 default rule. length presence difference: -0.3 percent. Interval: -2.3 to 1.8 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games; historical two-Beast pool, not NEW. Observational with/without composition contrast, not controlled removal. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-n-draw-presence"></a>
**evidence:pa-r1-N-draw-presence** — Knight, Oct4 default rule. draw rate presence difference: 2.3 points. Interval: 0.6 to 3.7 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games; historical two-Beast pool, not NEW. Observational with/without composition contrast, not controlled removal. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-n-white-presence"></a>
**evidence:pa-r1-N-white-presence** — Knight, Oct4 default rule. White score presence difference: 1.4 points. Interval: -0.5 to 3.3 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games; historical two-Beast pool, not NEW. Observational with/without composition contrast, not controlled removal. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-n-length-presence"></a>
**evidence:pa-r1-N-length-presence** — Knight, Oct4 default rule. length presence difference: 2.9 percent. Interval: 0.7 to 5.2 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games; historical two-Beast pool, not NEW. Observational with/without composition contrast, not controlled removal. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-a-white-presence"></a>
**evidence:pa-r1-A-white-presence** — Archer, plusDiagFwd2. White score presence difference: -1.8 points. Interval: -3.5 to 0 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games; historical two-Beast pool, not NEW. Observational with/without composition contrast, not controlled removal. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-a-length-presence"></a>
**evidence:pa-r1-A-length-presence** — Archer, plusDiagFwd2. length presence difference: -0.6 percent. Interval: -2.8 to 1.5 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games; historical two-Beast pool, not NEW. Observational with/without composition contrast, not controlled removal. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-g-draw-presence"></a>
**evidence:pa-r1-G-draw-presence** — Guard, Oct4 default rule. draw rate presence difference: 3.2 points. Interval: 1.9 to 4.6 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games; historical two-Beast pool, not NEW. Observational with/without composition contrast, not controlled removal. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-g-white-presence"></a>
**evidence:pa-r1-G-white-presence** — Guard, Oct4 default rule. White score presence difference: -0.9 points. Interval: -2.7 to 0.7 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games; historical two-Beast pool, not NEW. Observational with/without composition contrast, not controlled removal. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-g-length-presence"></a>
**evidence:pa-r1-G-length-presence** — Guard, Oct4 default rule. length presence difference: 7 percent. Interval: 5.1 to 8.9 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games; historical two-Beast pool, not NEW. Observational with/without composition contrast, not controlled removal. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-m-draw-presence"></a>
**evidence:pa-r1-M-draw-presence** — Maester, Oct4 default rule. draw rate presence difference: 3.1 points. Interval: 1.5 to 4.6 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games; historical two-Beast pool, not NEW. Observational with/without composition contrast, not controlled removal. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-m-white-presence"></a>
**evidence:pa-r1-M-white-presence** — Maester, Oct4 default rule. White score presence difference: -0.5 points. Interval: -2.5 to 1.4 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games; historical two-Beast pool, not NEW. Observational with/without composition contrast, not controlled removal. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-m-length-presence"></a>
**evidence:pa-r1-M-length-presence** — Maester, Oct4 default rule. length presence difference: 8.3 percent. Interval: 6.1 to 10.5 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games; historical two-Beast pool, not NEW. Observational with/without composition contrast, not controlled removal. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-s-draw-presence"></a>
**evidence:pa-r1-S-draw-presence** — Beast, Oct4 default rule. draw rate presence difference: -3.1 points. Interval: -4.7 to -1.5 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games; historical two-Beast pool, not NEW. Observational with/without composition contrast, not controlled removal. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-s-white-presence"></a>
**evidence:pa-r1-S-white-presence** — Beast, Oct4 default rule. White score presence difference: -0.5 points. Interval: -2.2 to 1.5 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games; historical two-Beast pool, not NEW. Observational with/without composition contrast, not controlled removal. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-pa-r1-s-length-presence"></a>
**evidence:pa-r1-S-length-presence** — Beast, Oct4 default rule. length presence difference: -7.6 percent. Interval: -9.5 to -5.9 (95%). Sample: 12000. Depth: 3. Run: pa-r1. Ordinary games; historical two-Beast pool, not NEW. Observational with/without composition contrast, not controlled removal. [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8)

<a id="evidence-hand-size-d4-cards2-draw-rate"></a>
**evidence:hand-size-d4-cards2-draw-rate** — cards2, 27-card deal depth4. draw rate: 17.3 percent. Interval: 14.3 to 20.3 (95%). Sample: 600. Depth: 4. Run: hand-size-d4. Same-hand mirrorOnly schedule: 600 games/arm, not 1200. Five entrants yield 3000 total. One fresh army/pair with one game under mirrorOnly. 27-card deal incl Salvation, no MirrorB. Linear evaluator; random opening: 4 plies; ordinary adjudication. Different seeds 7474/7475. Interpolate inside each context only. [hand4](../../sim/out/m1/king-down-guard/hand-size-d4.report.md)

<a id="evidence-hand-size-d4-cards3-draw-rate"></a>
**evidence:hand-size-d4-cards3-draw-rate** — cards3, 27-card deal depth4. draw rate: 15.3 percent. Interval: 12.4 to 18.2 (95%). Sample: 600. Depth: 4. Run: hand-size-d4. Same-hand mirrorOnly schedule: 600 games/arm, not 1200. Five entrants yield 3000 total. One fresh army/pair with one game under mirrorOnly. 27-card deal incl Salvation, no MirrorB. Linear evaluator; random opening: 4 plies; ordinary adjudication. Different seeds 7474/7475. Interpolate inside each context only. [hand4](../../sim/out/m1/king-down-guard/hand-size-d4.report.md)

<a id="evidence-hand-size-d4-cards4-draw-rate"></a>
**evidence:hand-size-d4-cards4-draw-rate** — cards4, 27-card deal depth4. draw rate: 14.2 percent. Interval: 11.4 to 17 (95%). Sample: 600. Depth: 4. Run: hand-size-d4. Same-hand mirrorOnly schedule: 600 games/arm, not 1200. Five entrants yield 3000 total. One fresh army/pair with one game under mirrorOnly. 27-card deal incl Salvation, no MirrorB. Linear evaluator; random opening: 4 plies; ordinary adjudication. Different seeds 7474/7475. Interpolate inside each context only. [hand4](../../sim/out/m1/king-down-guard/hand-size-d4.report.md)

<a id="evidence-hand-size-d4-cards6-draw-rate"></a>
**evidence:hand-size-d4-cards6-draw-rate** — cards6, 27-card deal depth4. draw rate: 9.7 percent. Interval: 7.3 to 12.1 (95%). Sample: 600. Depth: 4. Run: hand-size-d4. Same-hand mirrorOnly schedule: 600 games/arm, not 1200. Five entrants yield 3000 total. One fresh army/pair with one game under mirrorOnly. 27-card deal incl Salvation, no MirrorB. Linear evaluator; random opening: 4 plies; ordinary adjudication. Different seeds 7474/7475. Interpolate inside each context only. [hand4](../../sim/out/m1/king-down-guard/hand-size-d4.report.md)

<a id="evidence-hand-size-d4-none-draw-rate"></a>
**evidence:hand-size-d4-none-draw-rate** — none, 27-card deal depth4. draw rate: 28.3 percent. Interval: 24.7 to 31.9 (95%). Sample: 600. Depth: 4. Run: hand-size-d4. Same-hand mirrorOnly schedule: 600 games/arm, not 1200. Five entrants yield 3000 total. One fresh army/pair with one game under mirrorOnly. 27-card deal incl Salvation, no MirrorB. Linear evaluator; random opening: 4 plies; ordinary adjudication. Different seeds 7474/7475. Interpolate inside each context only. [hand4](../../sim/out/m1/king-down-guard/hand-size-d4.report.md)

<a id="evidence-hand-size-d4b-cards2-draw-rate"></a>
**evidence:hand-size-d4b-cards2-draw-rate** — cards2, 27-card deal depth4. draw rate: 17.7 percent. Interval: 14.6 to 20.8 (95%). Sample: 600. Depth: 4. Run: hand-size-d4b. Same-hand mirrorOnly schedule: 600 games/arm, not 1200. Five entrants yield 3000 total. One fresh army/pair with one game under mirrorOnly. 27-card deal incl Salvation, no MirrorB. Linear evaluator; random opening: 4 plies; ordinary adjudication. Different seeds 7474/7475. Interpolate inside each context only. [hand4b](../../sim/out/m1/king-down-guard/hand-size-d4b.report.md)

<a id="evidence-hand-size-d4b-cards3-draw-rate"></a>
**evidence:hand-size-d4b-cards3-draw-rate** — cards3, 27-card deal depth4. draw rate: 15.7 percent. Interval: 12.8 to 18.6 (95%). Sample: 600. Depth: 4. Run: hand-size-d4b. Same-hand mirrorOnly schedule: 600 games/arm, not 1200. Five entrants yield 3000 total. One fresh army/pair with one game under mirrorOnly. 27-card deal incl Salvation, no MirrorB. Linear evaluator; random opening: 4 plies; ordinary adjudication. Different seeds 7474/7475. Interpolate inside each context only. [hand4b](../../sim/out/m1/king-down-guard/hand-size-d4b.report.md)

<a id="evidence-hand-size-d4b-cards4-draw-rate"></a>
**evidence:hand-size-d4b-cards4-draw-rate** — cards4, 27-card deal depth4. draw rate: 11 percent. Interval: 8.5 to 13.5 (95%). Sample: 600. Depth: 4. Run: hand-size-d4b. Same-hand mirrorOnly schedule: 600 games/arm, not 1200. Five entrants yield 3000 total. One fresh army/pair with one game under mirrorOnly. 27-card deal incl Salvation, no MirrorB. Linear evaluator; random opening: 4 plies; ordinary adjudication. Different seeds 7474/7475. Interpolate inside each context only. [hand4b](../../sim/out/m1/king-down-guard/hand-size-d4b.report.md)

<a id="evidence-hand-size-d4b-cards6-draw-rate"></a>
**evidence:hand-size-d4b-cards6-draw-rate** — cards6, 27-card deal depth4. draw rate: 12.3 percent. Interval: 9.7 to 14.9 (95%). Sample: 600. Depth: 4. Run: hand-size-d4b. Same-hand mirrorOnly schedule: 600 games/arm, not 1200. Five entrants yield 3000 total. One fresh army/pair with one game under mirrorOnly. 27-card deal incl Salvation, no MirrorB. Linear evaluator; random opening: 4 plies; ordinary adjudication. Different seeds 7474/7475. Interpolate inside each context only. [hand4b](../../sim/out/m1/king-down-guard/hand-size-d4b.report.md)

<a id="evidence-hand-size-d4b-none-draw-rate"></a>
**evidence:hand-size-d4b-none-draw-rate** — none, 27-card deal depth4. draw rate: 31 percent. Interval: 27.3 to 34.7 (95%). Sample: 600. Depth: 4. Run: hand-size-d4b. Same-hand mirrorOnly schedule: 600 games/arm, not 1200. Five entrants yield 3000 total. One fresh army/pair with one game under mirrorOnly. 27-card deal incl Salvation, no MirrorB. Linear evaluator; random opening: 4 plies; ordinary adjudication. Different seeds 7474/7475. Interpolate inside each context only. [hand4b](../../sim/out/m1/king-down-guard/hand-size-d4b.report.md)

<a id="evidence-cards-d1-rally-worth"></a>
**evidence:cards-d1-Rally-worth** — Rally, one-use card, cards-d1. card worth vs none: 2.9 pawns. Interval: 2.45 to 3.35 (95%). Sample: 600. Depth: 3. Run: cards-d1. Anchor none, 300 colour-swapped pairs = 600 games per candidate. 64 Elo/pawn carried calibration; its ±25% systematic uncertainty is separate from printed card interval. Fresh armies,seed 7070. 28 candidates plus mirror-none generate 17400 total games. Individual-card context differs from four-card NEW deal. [cards-d1-raw](../../sim/out/cards-d1.report.md#L41)

<a id="evidence-cards-d1-morphp-worth"></a>
**evidence:cards-d1-MorphP-worth** — MorphP, one-use card, cards-d1. card worth vs none: 2.65 pawns. Interval: 2.19 to 3.11 (95%). Sample: 600. Depth: 3. Run: cards-d1. Anchor none, 300 colour-swapped pairs = 600 games per candidate. 64 Elo/pawn carried calibration; its ±25% systematic uncertainty is separate from printed card interval. Fresh armies,seed 7070. 28 candidates plus mirror-none generate 17400 total games. Individual-card context differs from four-card NEW deal. [cards-d1-raw](../../sim/out/cards-d1.report.md#L41)

<a id="evidence-cards-d1-haste-worth"></a>
**evidence:cards-d1-Haste-worth** — Haste, one-use card, cards-d1. card worth vs none: 2.59 pawns. Interval: 2.14 to 3.04 (95%). Sample: 600. Depth: 3. Run: cards-d1. Anchor none, 300 colour-swapped pairs = 600 games per candidate. 64 Elo/pawn carried calibration; its ±25% systematic uncertainty is separate from printed card interval. Fresh armies,seed 7070. 28 candidates plus mirror-none generate 17400 total games. Individual-card context differs from four-card NEW deal. [cards-d1-raw](../../sim/out/cards-d1.report.md#L41)

<a id="evidence-cards-d1-control-worth"></a>
**evidence:cards-d1-Control-worth** — Control, one-use card, cards-d1. card worth vs none: 2.22 pawns. Interval: 1.79 to 2.65 (95%). Sample: 600. Depth: 3. Run: cards-d1. Anchor none, 300 colour-swapped pairs = 600 games per candidate. 64 Elo/pawn carried calibration; its ±25% systematic uncertainty is separate from printed card interval. Fresh armies,seed 7070. 28 candidates plus mirror-none generate 17400 total games. Individual-card context differs from four-card NEW deal. [cards-d1-raw](../../sim/out/cards-d1.report.md#L41)

<a id="evidence-cards-d1-firewall-worth"></a>
**evidence:cards-d1-Firewall-worth** — Firewall, one-use card, cards-d1. card worth vs none: 2.21 pawns. Interval: 1.79 to 2.63 (95%). Sample: 600. Depth: 3. Run: cards-d1. Anchor none, 300 colour-swapped pairs = 600 games per candidate. 64 Elo/pawn carried calibration; its ±25% systematic uncertainty is separate from printed card interval. Fresh armies,seed 7070. 28 candidates plus mirror-none generate 17400 total games. Individual-card context differs from four-card NEW deal. [cards-d1-raw](../../sim/out/cards-d1.report.md#L41)

<a id="evidence-cards-d1-burn-worth"></a>
**evidence:cards-d1-Burn-worth** — Burn, one-use card, cards-d1. card worth vs none: 1.86 pawns. Interval: 1.45 to 2.27 (95%). Sample: 600. Depth: 3. Run: cards-d1. Anchor none, 300 colour-swapped pairs = 600 games per candidate. 64 Elo/pawn carried calibration; its ±25% systematic uncertainty is separate from printed card interval. Fresh armies,seed 7070. 28 candidates plus mirror-none generate 17400 total games. Individual-card context differs from four-card NEW deal. [cards-d1-raw](../../sim/out/cards-d1.report.md#L41)

<a id="evidence-cards-d1-strike-worth"></a>
**evidence:cards-d1-Strike-worth** — Strike, one-use card, cards-d1. card worth vs none: 1.55 pawns. Interval: 1.17 to 1.93 (95%). Sample: 600. Depth: 3. Run: cards-d1. Anchor none, 300 colour-swapped pairs = 600 games per candidate. 64 Elo/pawn carried calibration; its ±25% systematic uncertainty is separate from printed card interval. Fresh armies,seed 7070. 28 candidates plus mirror-none generate 17400 total games. Individual-card context differs from four-card NEW deal. [cards-d1-raw](../../sim/out/cards-d1.report.md#L41)

<a id="evidence-cards-d1-growth-worth"></a>
**evidence:cards-d1-Growth-worth** — Growth, one-use card, cards-d1. card worth vs none: 1.53 pawns. Interval: 1.15 to 1.91 (95%). Sample: 600. Depth: 3. Run: cards-d1. Anchor none, 300 colour-swapped pairs = 600 games per candidate. 64 Elo/pawn carried calibration; its ±25% systematic uncertainty is separate from printed card interval. Fresh armies,seed 7070. 28 candidates plus mirror-none generate 17400 total games. Individual-card context differs from four-card NEW deal. [cards-d1-raw](../../sim/out/cards-d1.report.md#L41)

<a id="evidence-cards-d1-flight-worth"></a>
**evidence:cards-d1-Flight-worth** — Flight, one-use card, cards-d1. card worth vs none: 1.46 pawns. Interval: 1.06 to 1.86 (95%). Sample: 600. Depth: 3. Run: cards-d1. Anchor none, 300 colour-swapped pairs = 600 games per candidate. 64 Elo/pawn carried calibration; its ±25% systematic uncertainty is separate from printed card interval. Fresh armies,seed 7070. 28 candidates plus mirror-none generate 17400 total games. Individual-card context differs from four-card NEW deal. [cards-d1-raw](../../sim/out/cards-d1.report.md#L41)

<a id="evidence-cards-d1-skylift-worth"></a>
**evidence:cards-d1-SkyLift-worth** — SkyLift, one-use card, cards-d1. card worth vs none: 1.46 pawns. Interval: 1.04 to 1.88 (95%). Sample: 600. Depth: 3. Run: cards-d1. Anchor none, 300 colour-swapped pairs = 600 games per candidate. 64 Elo/pawn carried calibration; its ±25% systematic uncertainty is separate from printed card interval. Fresh armies,seed 7070. 28 candidates plus mirror-none generate 17400 total games. Individual-card context differs from four-card NEW deal. [cards-d1-raw](../../sim/out/cards-d1.report.md#L41)

<a id="evidence-cards-d1-morphs-worth"></a>
**evidence:cards-d1-MorphS-worth** — MorphS, one-use card, cards-d1. card worth vs none: 1.46 pawns. Interval: 1.04 to 1.88 (95%). Sample: 600. Depth: 3. Run: cards-d1. Anchor none, 300 colour-swapped pairs = 600 games per candidate. 64 Elo/pawn carried calibration; its ±25% systematic uncertainty is separate from printed card interval. Fresh armies,seed 7070. 28 candidates plus mirror-none generate 17400 total games. Individual-card context differs from four-card NEW deal. [cards-d1-raw](../../sim/out/cards-d1.report.md#L41)

<a id="evidence-cards-d1-vault-worth"></a>
**evidence:cards-d1-Vault-worth** — Vault, one-use card, cards-d1. card worth vs none: 1.45 pawns. Interval: 1.03 to 1.87 (95%). Sample: 600. Depth: 3. Run: cards-d1. Anchor none, 300 colour-swapped pairs = 600 games per candidate. 64 Elo/pawn carried calibration; its ±25% systematic uncertainty is separate from printed card interval. Fresh armies,seed 7070. 28 candidates plus mirror-none generate 17400 total games. Individual-card context differs from four-card NEW deal. [cards-d1-raw](../../sim/out/cards-d1.report.md#L41)

<a id="evidence-cards-d1-sacrifice-worth"></a>
**evidence:cards-d1-Sacrifice-worth** — Sacrifice, one-use card, cards-d1. card worth vs none: 1.37 pawns. Interval: 0.95 to 1.79 (95%). Sample: 600. Depth: 3. Run: cards-d1. Anchor none, 300 colour-swapped pairs = 600 games per candidate. 64 Elo/pawn carried calibration; its ±25% systematic uncertainty is separate from printed card interval. Fresh armies,seed 7070. 28 candidates plus mirror-none generate 17400 total games. Individual-card context differs from four-card NEW deal. [cards-d1-raw](../../sim/out/cards-d1.report.md#L41)

<a id="evidence-cards-d1-mimic-worth"></a>
**evidence:cards-d1-Mimic-worth** — Mimic, one-use card, cards-d1. card worth vs none: 1.29 pawns. Interval: 0.88 to 1.7 (95%). Sample: 600. Depth: 3. Run: cards-d1. Anchor none, 300 colour-swapped pairs = 600 games per candidate. 64 Elo/pawn carried calibration; its ±25% systematic uncertainty is separate from printed card interval. Fresh armies,seed 7070. 28 candidates plus mirror-none generate 17400 total games. Individual-card context differs from four-card NEW deal. [cards-d1-raw](../../sim/out/cards-d1.report.md#L41)

<a id="evidence-cards-d1-spawnk2-worth"></a>
**evidence:cards-d1-SpawnK2-worth** — SpawnK2, one-use card, cards-d1. card worth vs none: 1.18 pawns. Interval: 0.81 to 1.55 (95%). Sample: 600. Depth: 3. Run: cards-d1. Anchor none, 300 colour-swapped pairs = 600 games per candidate. 64 Elo/pawn carried calibration; its ±25% systematic uncertainty is separate from printed card interval. Fresh armies,seed 7070. 28 candidates plus mirror-none generate 17400 total games. Individual-card context differs from four-card NEW deal. [cards-d1-raw](../../sim/out/cards-d1.report.md#L41)

<a id="evidence-cards-d1-freeze-worth"></a>
**evidence:cards-d1-Freeze-worth** — Freeze, one-use card, cards-d1. card worth vs none: 1.15 pawns. Interval: 0.73 to 1.57 (95%). Sample: 600. Depth: 3. Run: cards-d1. Anchor none, 300 colour-swapped pairs = 600 games per candidate. 64 Elo/pawn carried calibration; its ±25% systematic uncertainty is separate from printed card interval. Fresh armies,seed 7070. 28 candidates plus mirror-none generate 17400 total games. Individual-card context differs from four-card NEW deal. [cards-d1-raw](../../sim/out/cards-d1.report.md#L41)

<a id="evidence-cards-d1-salvation-worth"></a>
**evidence:cards-d1-Salvation-worth** — Salvation, one-use card, cards-d1. card worth vs none: 1.1 pawns. Interval: 0.72 to 1.48 (95%). Sample: 600. Depth: 3. Run: cards-d1. Anchor none, 300 colour-swapped pairs = 600 games per candidate. 64 Elo/pawn carried calibration; its ±25% systematic uncertainty is separate from printed card interval. Fresh armies,seed 7070. 28 candidates plus mirror-none generate 17400 total games. Individual-card context differs from four-card NEW deal. [cards-d1-raw](../../sim/out/cards-d1.report.md#L41)

<a id="evidence-cards-d1-growthb-worth"></a>
**evidence:cards-d1-GrowthB-worth** — GrowthB, one-use card, cards-d1. card worth vs none: 1.09 pawns. Interval: 0.73 to 1.45 (95%). Sample: 600. Depth: 3. Run: cards-d1. Anchor none, 300 colour-swapped pairs = 600 games per candidate. 64 Elo/pawn carried calibration; its ±25% systematic uncertainty is separate from printed card interval. Fresh armies,seed 7070. 28 candidates plus mirror-none generate 17400 total games. Individual-card context differs from four-card NEW deal. [cards-d1-raw](../../sim/out/cards-d1.report.md#L41)

<a id="evidence-cards-d1-firestarter-worth"></a>
**evidence:cards-d1-FireStarter-worth** — FireStarter, one-use card, cards-d1. card worth vs none: 1.08 pawns. Interval: 0.67 to 1.49 (95%). Sample: 600. Depth: 3. Run: cards-d1. Anchor none, 300 colour-swapped pairs = 600 games per candidate. 64 Elo/pawn carried calibration; its ±25% systematic uncertainty is separate from printed card interval. Fresh armies,seed 7070. 28 candidates plus mirror-none generate 17400 total games. Individual-card context differs from four-card NEW deal. [cards-d1-raw](../../sim/out/cards-d1.report.md#L41)

<a id="evidence-cards-d1-firewallb-worth"></a>
**evidence:cards-d1-FirewallB-worth** — FirewallB, one-use card, cards-d1. card worth vs none: 1.07 pawns. Interval: 0.72 to 1.42 (95%). Sample: 600. Depth: 3. Run: cards-d1. Anchor none, 300 colour-swapped pairs = 600 games per candidate. 64 Elo/pawn carried calibration; its ±25% systematic uncertainty is separate from printed card interval. Fresh armies,seed 7070. 28 candidates plus mirror-none generate 17400 total games. Individual-card context differs from four-card NEW deal. [cards-d1-raw](../../sim/out/cards-d1.report.md#L41)

<a id="evidence-cards-d1-spawn2-worth"></a>
**evidence:cards-d1-Spawn2-worth** — Spawn2, one-use card, cards-d1. card worth vs none: 0.88 pawns. Interval: 0.47 to 1.29 (95%). Sample: 600. Depth: 3. Run: cards-d1. Anchor none, 300 colour-swapped pairs = 600 games per candidate. 64 Elo/pawn carried calibration; its ±25% systematic uncertainty is separate from printed card interval. Fresh armies,seed 7070. 28 candidates plus mirror-none generate 17400 total games. Individual-card context differs from four-card NEW deal. [cards-d1-raw](../../sim/out/cards-d1.report.md#L41)

<a id="evidence-cards-d1-earthquakeb-worth"></a>
**evidence:cards-d1-EarthQuakeB-worth** — EarthQuakeB, one-use card, cards-d1. card worth vs none: 0.85 pawns. Interval: 0.46 to 1.24 (95%). Sample: 600. Depth: 3. Run: cards-d1. Anchor none, 300 colour-swapped pairs = 600 games per candidate. 64 Elo/pawn carried calibration; its ±25% systematic uncertainty is separate from printed card interval. Fresh armies,seed 7070. 28 candidates plus mirror-none generate 17400 total games. Individual-card context differs from four-card NEW deal. [cards-d1-raw](../../sim/out/cards-d1.report.md#L41)

<a id="evidence-cards-d1-leap-worth"></a>
**evidence:cards-d1-Leap-worth** — Leap, one-use card, cards-d1. card worth vs none: 0.79 pawns. Interval: 0.41 to 1.17 (95%). Sample: 600. Depth: 3. Run: cards-d1. Anchor none, 300 colour-swapped pairs = 600 games per candidate. 64 Elo/pawn carried calibration; its ±25% systematic uncertainty is separate from printed card interval. Fresh armies,seed 7070. 28 candidates plus mirror-none generate 17400 total games. Individual-card context differs from four-card NEW deal. [cards-d1-raw](../../sim/out/cards-d1.report.md#L41)

<a id="evidence-cards-d1-earthquake-worth"></a>
**evidence:cards-d1-EarthQuake-worth** — EarthQuake, one-use card, cards-d1. card worth vs none: 0.77 pawns. Interval: 0.37 to 1.17 (95%). Sample: 600. Depth: 3. Run: cards-d1. Anchor none, 300 colour-swapped pairs = 600 games per candidate. 64 Elo/pawn carried calibration; its ±25% systematic uncertainty is separate from printed card interval. Fresh armies,seed 7070. 28 candidates plus mirror-none generate 17400 total games. Individual-card context differs from four-card NEW deal. [cards-d1-raw](../../sim/out/cards-d1.report.md#L41)

<a id="evidence-cards-d1-spawnk-worth"></a>
**evidence:cards-d1-SpawnK-worth** — SpawnK, one-use card, cards-d1. card worth vs none: 0.66 pawns. Interval: 0.31 to 1.01 (95%). Sample: 600. Depth: 3. Run: cards-d1. Anchor none, 300 colour-swapped pairs = 600 games per candidate. 64 Elo/pawn carried calibration; its ±25% systematic uncertainty is separate from printed card interval. Fresh armies,seed 7070. 28 candidates plus mirror-none generate 17400 total games. Individual-card context differs from four-card NEW deal. [cards-d1-raw](../../sim/out/cards-d1.report.md#L41)

<a id="evidence-cards-d1-march-worth"></a>
**evidence:cards-d1-March-worth** — March, one-use card, cards-d1. card worth vs none: 0.56 pawns. Interval: 0.21 to 0.91 (95%). Sample: 600. Depth: 3. Run: cards-d1. Anchor none, 300 colour-swapped pairs = 600 games per candidate. 64 Elo/pawn carried calibration; its ±25% systematic uncertainty is separate from printed card interval. Fresh armies,seed 7070. 28 candidates plus mirror-none generate 17400 total games. Individual-card context differs from four-card NEW deal. [cards-d1-raw](../../sim/out/cards-d1.report.md#L41)

<a id="evidence-cards-d1-icewall-worth"></a>
**evidence:cards-d1-IceWall-worth** — IceWall, one-use card, cards-d1. card worth vs none: 0.55 pawns. Interval: 0.15 to 0.95 (95%). Sample: 600. Depth: 3. Run: cards-d1. Anchor none, 300 colour-swapped pairs = 600 games per candidate. 64 Elo/pawn carried calibration; its ±25% systematic uncertainty is separate from printed card interval. Fresh armies,seed 7070. 28 candidates plus mirror-none generate 17400 total games. Individual-card context differs from four-card NEW deal. [cards-d1-raw](../../sim/out/cards-d1.report.md#L41)

<a id="evidence-cards-d1-curse-worth"></a>
**evidence:cards-d1-Curse-worth** — Curse, one-use card, cards-d1. card worth vs none: 0.31 pawns. Interval: -0.07 to 0.69 (95%). Sample: 600. Depth: 3. Run: cards-d1. Anchor none, 300 colour-swapped pairs = 600 games per candidate. 64 Elo/pawn carried calibration; its ±25% systematic uncertainty is separate from printed card interval. Fresh armies,seed 7070. 28 candidates plus mirror-none generate 17400 total games. Individual-card context differs from four-card NEW deal. [cards-d1-raw](../../sim/out/cards-d1.report.md#L41)

<a id="evidence-deal-c4k-cards4-white"></a>
**evidence:deal-c4k-cards4-white** — cards4, 28-card pool with Salvation and MirrorB; deal-c4k. White score: 50 percent. Interval: 47.8 to 52.2 (95%). Sample: 1749. Depth: 3. Run: deal-c4k. Historical QORRBBNNAAGMMS pool without Paladin; seed 7581; depth 3; four random opening plies; 300-ply cap. Stopped at 3498/14000 games, shards 9/10/11. The two arms have zero shared openings. No paired delta exists. [deal-c4k-report](../../sim/out/deal-c4k.report.md), [deal-c4k-spec](../../sim/out/deal-c4k.tournament.json), [tournament-mirror-method](../../src/sim/tournament.ts), [deal-c4k-shard9](../../sim/out/deal-c4k.shard9of12.jsonl), [deal-c4k-shard10](../../sim/out/deal-c4k.shard10of12.jsonl), [deal-c4k-shard11](../../sim/out/deal-c4k.shard11of12.jsonl)

<a id="evidence-deal-c4k-cards4-draw"></a>
**evidence:deal-c4k-cards4-draw** — cards4, 28-card pool with Salvation and MirrorB; deal-c4k. draw rate: 9.5 percent. Interval: 8.1 to 10.9 (95%). Sample: 1749. Depth: 3. Run: deal-c4k. Historical QORRBBNNAAGMMS pool without Paladin; seed 7581; depth 3; four random opening plies; 300-ply cap. Stopped at 3498/14000 games, shards 9/10/11. The two arms have zero shared openings. No paired delta exists. [deal-c4k-report](../../sim/out/deal-c4k.report.md), [deal-c4k-spec](../../sim/out/deal-c4k.tournament.json), [tournament-mirror-method](../../src/sim/tournament.ts), [deal-c4k-shard9](../../sim/out/deal-c4k.shard9of12.jsonl), [deal-c4k-shard10](../../sim/out/deal-c4k.shard10of12.jsonl), [deal-c4k-shard11](../../sim/out/deal-c4k.shard11of12.jsonl)

<a id="evidence-deal-c4k-cards4-length"></a>
**evidence:deal-c4k-cards4-length** — cards4, 28-card pool with Salvation and MirrorB; deal-c4k. length in turns: 91 turns. Interval: 88.8 to 93.2 (95%). Sample: 1749. Depth: 3. Run: deal-c4k. Historical QORRBBNNAAGMMS pool without Paladin; seed 7581; depth 3; four random opening plies; 300-ply cap. Stopped at 3498/14000 games, shards 9/10/11. The two arms have zero shared openings. No paired delta exists. [deal-c4k-report](../../sim/out/deal-c4k.report.md), [deal-c4k-spec](../../sim/out/deal-c4k.tournament.json), [tournament-mirror-method](../../src/sim/tournament.ts), [deal-c4k-shard9](../../sim/out/deal-c4k.shard9of12.jsonl), [deal-c4k-shard10](../../sim/out/deal-c4k.shard10of12.jsonl), [deal-c4k-shard11](../../sim/out/deal-c4k.shard11of12.jsonl)

<a id="evidence-deal-c4k-none-white"></a>
**evidence:deal-c4k-none-white** — none, 28-card pool with Salvation and MirrorB; deal-c4k. White score: 51 percent. Interval: 48.9 to 53.1 (95%). Sample: 1749. Depth: 3. Run: deal-c4k. Historical QORRBBNNAAGMMS pool without Paladin; seed 7581; depth 3; four random opening plies; 300-ply cap. Stopped at 3498/14000 games, shards 9/10/11. The two arms have zero shared openings. No paired delta exists. [deal-c4k-report](../../sim/out/deal-c4k.report.md), [deal-c4k-spec](../../sim/out/deal-c4k.tournament.json), [tournament-mirror-method](../../src/sim/tournament.ts), [deal-c4k-shard9](../../sim/out/deal-c4k.shard9of12.jsonl), [deal-c4k-shard10](../../sim/out/deal-c4k.shard10of12.jsonl), [deal-c4k-shard11](../../sim/out/deal-c4k.shard11of12.jsonl)

<a id="evidence-deal-c4k-none-draw"></a>
**evidence:deal-c4k-none-draw** — none, 28-card pool with Salvation and MirrorB; deal-c4k. draw rate: 20 percent. Interval: 18.1 to 21.9 (95%). Sample: 1749. Depth: 3. Run: deal-c4k. Historical QORRBBNNAAGMMS pool without Paladin; seed 7581; depth 3; four random opening plies; 300-ply cap. Stopped at 3498/14000 games, shards 9/10/11. The two arms have zero shared openings. No paired delta exists. [deal-c4k-report](../../sim/out/deal-c4k.report.md), [deal-c4k-spec](../../sim/out/deal-c4k.tournament.json), [tournament-mirror-method](../../src/sim/tournament.ts), [deal-c4k-shard9](../../sim/out/deal-c4k.shard9of12.jsonl), [deal-c4k-shard10](../../sim/out/deal-c4k.shard10of12.jsonl), [deal-c4k-shard11](../../sim/out/deal-c4k.shard11of12.jsonl)

<a id="evidence-deal-c4k-none-length"></a>
**evidence:deal-c4k-none-length** — none, 28-card pool with Salvation and MirrorB; deal-c4k. length in turns: 101.3 turns. Interval: 99.2 to 103.4 (95%). Sample: 1749. Depth: 3. Run: deal-c4k. Historical QORRBBNNAAGMMS pool without Paladin; seed 7581; depth 3; four random opening plies; 300-ply cap. Stopped at 3498/14000 games, shards 9/10/11. The two arms have zero shared openings. No paired delta exists. [deal-c4k-report](../../sim/out/deal-c4k.report.md), [deal-c4k-spec](../../sim/out/deal-c4k.tournament.json), [tournament-mirror-method](../../src/sim/tournament.ts), [deal-c4k-shard9](../../sim/out/deal-c4k.shard9of12.jsonl), [deal-c4k-shard10](../../sim/out/deal-c4k.shard10of12.jsonl), [deal-c4k-shard11](../../sim/out/deal-c4k.shard11of12.jsonl)

<a id="evidence-deal-d4k-cards6-white"></a>
**evidence:deal-d4k-cards6-white** — cards6, 28-card pool with Salvation and MirrorB; deal-d4k. White score: 51.8 percent. Interval: 50.2 to 53.4 (95%). Sample: 3498. Depth: 3. Run: deal-d4k. Historical QORRBBNNAAGMMS pool without Paladin; seed 7577; depth 3; four random opening plies; 300-ply cap. Stopped at 6998/14000 games, shards 5/7/8/9/10/11. Whole-arm summaries use 3498 and 3500 openings. Paired deltas use only 1166 shared openings. [deal-d4k-report](../../sim/out/deal-d4k.report.md), [deal-d4k-spec](../../sim/out/deal-d4k.tournament.json), [tournament-mirror-method](../../src/sim/tournament.ts), [deal-d4k-shard5](../../sim/out/deal-d4k.shard5of12.jsonl), [deal-d4k-shard7](../../sim/out/deal-d4k.shard7of12.jsonl), [deal-d4k-shard8](../../sim/out/deal-d4k.shard8of12.jsonl), [deal-d4k-shard9](../../sim/out/deal-d4k.shard9of12.jsonl), [deal-d4k-shard10](../../sim/out/deal-d4k.shard10of12.jsonl), [deal-d4k-shard11](../../sim/out/deal-d4k.shard11of12.jsonl)

<a id="evidence-deal-d4k-cards6-draw"></a>
**evidence:deal-d4k-cards6-draw** — cards6, 28-card pool with Salvation and MirrorB; deal-d4k. draw rate: 8.8 percent. Interval: 7.9 to 9.7 (95%). Sample: 3498. Depth: 3. Run: deal-d4k. Historical QORRBBNNAAGMMS pool without Paladin; seed 7577; depth 3; four random opening plies; 300-ply cap. Stopped at 6998/14000 games, shards 5/7/8/9/10/11. Whole-arm summaries use 3498 and 3500 openings. Paired deltas use only 1166 shared openings. [deal-d4k-report](../../sim/out/deal-d4k.report.md), [deal-d4k-spec](../../sim/out/deal-d4k.tournament.json), [tournament-mirror-method](../../src/sim/tournament.ts), [deal-d4k-shard5](../../sim/out/deal-d4k.shard5of12.jsonl), [deal-d4k-shard7](../../sim/out/deal-d4k.shard7of12.jsonl), [deal-d4k-shard8](../../sim/out/deal-d4k.shard8of12.jsonl), [deal-d4k-shard9](../../sim/out/deal-d4k.shard9of12.jsonl), [deal-d4k-shard10](../../sim/out/deal-d4k.shard10of12.jsonl), [deal-d4k-shard11](../../sim/out/deal-d4k.shard11of12.jsonl)

<a id="evidence-deal-d4k-cards6-length"></a>
**evidence:deal-d4k-cards6-length** — cards6, 28-card pool with Salvation and MirrorB; deal-d4k. length in turns: 86.2 turns. Interval: 84.6 to 87.8 (95%). Sample: 3498. Depth: 3. Run: deal-d4k. Historical QORRBBNNAAGMMS pool without Paladin; seed 7577; depth 3; four random opening plies; 300-ply cap. Stopped at 6998/14000 games, shards 5/7/8/9/10/11. Whole-arm summaries use 3498 and 3500 openings. Paired deltas use only 1166 shared openings. [deal-d4k-report](../../sim/out/deal-d4k.report.md), [deal-d4k-spec](../../sim/out/deal-d4k.tournament.json), [tournament-mirror-method](../../src/sim/tournament.ts), [deal-d4k-shard5](../../sim/out/deal-d4k.shard5of12.jsonl), [deal-d4k-shard7](../../sim/out/deal-d4k.shard7of12.jsonl), [deal-d4k-shard8](../../sim/out/deal-d4k.shard8of12.jsonl), [deal-d4k-shard9](../../sim/out/deal-d4k.shard9of12.jsonl), [deal-d4k-shard10](../../sim/out/deal-d4k.shard10of12.jsonl), [deal-d4k-shard11](../../sim/out/deal-d4k.shard11of12.jsonl)

<a id="evidence-deal-d4k-none-white"></a>
**evidence:deal-d4k-none-white** — none, 28-card pool with Salvation and MirrorB; deal-d4k. White score: 51.8 percent. Interval: 50.3 to 53.3 (95%). Sample: 3500. Depth: 3. Run: deal-d4k. Historical QORRBBNNAAGMMS pool without Paladin; seed 7577; depth 3; four random opening plies; 300-ply cap. Stopped at 6998/14000 games, shards 5/7/8/9/10/11. Whole-arm summaries use 3498 and 3500 openings. Paired deltas use only 1166 shared openings. [deal-d4k-report](../../sim/out/deal-d4k.report.md), [deal-d4k-spec](../../sim/out/deal-d4k.tournament.json), [tournament-mirror-method](../../src/sim/tournament.ts), [deal-d4k-shard5](../../sim/out/deal-d4k.shard5of12.jsonl), [deal-d4k-shard7](../../sim/out/deal-d4k.shard7of12.jsonl), [deal-d4k-shard8](../../sim/out/deal-d4k.shard8of12.jsonl), [deal-d4k-shard9](../../sim/out/deal-d4k.shard9of12.jsonl), [deal-d4k-shard10](../../sim/out/deal-d4k.shard10of12.jsonl), [deal-d4k-shard11](../../sim/out/deal-d4k.shard11of12.jsonl)

<a id="evidence-deal-d4k-none-draw"></a>
**evidence:deal-d4k-none-draw** — none, 28-card pool with Salvation and MirrorB; deal-d4k. draw rate: 19.5 percent. Interval: 18.2 to 20.8 (95%). Sample: 3500. Depth: 3. Run: deal-d4k. Historical QORRBBNNAAGMMS pool without Paladin; seed 7577; depth 3; four random opening plies; 300-ply cap. Stopped at 6998/14000 games, shards 5/7/8/9/10/11. Whole-arm summaries use 3498 and 3500 openings. Paired deltas use only 1166 shared openings. [deal-d4k-report](../../sim/out/deal-d4k.report.md), [deal-d4k-spec](../../sim/out/deal-d4k.tournament.json), [tournament-mirror-method](../../src/sim/tournament.ts), [deal-d4k-shard5](../../sim/out/deal-d4k.shard5of12.jsonl), [deal-d4k-shard7](../../sim/out/deal-d4k.shard7of12.jsonl), [deal-d4k-shard8](../../sim/out/deal-d4k.shard8of12.jsonl), [deal-d4k-shard9](../../sim/out/deal-d4k.shard9of12.jsonl), [deal-d4k-shard10](../../sim/out/deal-d4k.shard10of12.jsonl), [deal-d4k-shard11](../../sim/out/deal-d4k.shard11of12.jsonl)

<a id="evidence-deal-d4k-none-length"></a>
**evidence:deal-d4k-none-length** — none, 28-card pool with Salvation and MirrorB; deal-d4k. length in turns: 102.6 turns. Interval: 101 to 104.2 (95%). Sample: 3500. Depth: 3. Run: deal-d4k. Historical QORRBBNNAAGMMS pool without Paladin; seed 7577; depth 3; four random opening plies; 300-ply cap. Stopped at 6998/14000 games, shards 5/7/8/9/10/11. Whole-arm summaries use 3498 and 3500 openings. Paired deltas use only 1166 shared openings. [deal-d4k-report](../../sim/out/deal-d4k.report.md), [deal-d4k-spec](../../sim/out/deal-d4k.tournament.json), [tournament-mirror-method](../../src/sim/tournament.ts), [deal-d4k-shard5](../../sim/out/deal-d4k.shard5of12.jsonl), [deal-d4k-shard7](../../sim/out/deal-d4k.shard7of12.jsonl), [deal-d4k-shard8](../../sim/out/deal-d4k.shard8of12.jsonl), [deal-d4k-shard9](../../sim/out/deal-d4k.shard9of12.jsonl), [deal-d4k-shard10](../../sim/out/deal-d4k.shard10of12.jsonl), [deal-d4k-shard11](../../sim/out/deal-d4k.shard11of12.jsonl)

<a id="evidence-deal-d4k-paired-white"></a>
**evidence:deal-d4k-paired-white** — cards6, 28-card pool with Salvation and MirrorB; deal-d4k. six cards minus no cards White score: 2.8 points. Interval: -1 to 6.6 (95%). Sample: 1166. Depth: 3. Run: deal-d4k. Historical QORRBBNNAAGMMS pool without Paladin; seed 7577; depth 3; four random opening plies; 300-ply cap. Stopped at 6998/14000 games, shards 5/7/8/9/10/11. Whole-arm summaries use 3498 and 3500 openings. Paired deltas use only 1166 shared openings. Paired mean over shared backRank|seed keys; this is not a difference between the whole-arm columns. [deal-d4k-report](../../sim/out/deal-d4k.report.md), [deal-d4k-spec](../../sim/out/deal-d4k.tournament.json), [tournament-mirror-method](../../src/sim/tournament.ts), [deal-d4k-shard5](../../sim/out/deal-d4k.shard5of12.jsonl), [deal-d4k-shard7](../../sim/out/deal-d4k.shard7of12.jsonl), [deal-d4k-shard8](../../sim/out/deal-d4k.shard8of12.jsonl), [deal-d4k-shard9](../../sim/out/deal-d4k.shard9of12.jsonl), [deal-d4k-shard10](../../sim/out/deal-d4k.shard10of12.jsonl), [deal-d4k-shard11](../../sim/out/deal-d4k.shard11of12.jsonl)

<a id="evidence-deal-d4k-paired-draw"></a>
**evidence:deal-d4k-paired-draw** — cards6, 28-card pool with Salvation and MirrorB; deal-d4k. six cards minus no cards draw rate: -11.7 points. Interval: -14.6 to -8.8 (95%). Sample: 1166. Depth: 3. Run: deal-d4k. Historical QORRBBNNAAGMMS pool without Paladin; seed 7577; depth 3; four random opening plies; 300-ply cap. Stopped at 6998/14000 games, shards 5/7/8/9/10/11. Whole-arm summaries use 3498 and 3500 openings. Paired deltas use only 1166 shared openings. Paired mean over shared backRank|seed keys; this is not a difference between the whole-arm columns. [deal-d4k-report](../../sim/out/deal-d4k.report.md), [deal-d4k-spec](../../sim/out/deal-d4k.tournament.json), [tournament-mirror-method](../../src/sim/tournament.ts), [deal-d4k-shard5](../../sim/out/deal-d4k.shard5of12.jsonl), [deal-d4k-shard7](../../sim/out/deal-d4k.shard7of12.jsonl), [deal-d4k-shard8](../../sim/out/deal-d4k.shard8of12.jsonl), [deal-d4k-shard9](../../sim/out/deal-d4k.shard9of12.jsonl), [deal-d4k-shard10](../../sim/out/deal-d4k.shard10of12.jsonl), [deal-d4k-shard11](../../sim/out/deal-d4k.shard11of12.jsonl)

<a id="evidence-deal-d4k-paired-turns"></a>
**evidence:deal-d4k-paired-turns** — cards6, 28-card pool with Salvation and MirrorB; deal-d4k. six cards minus no cards length in turns: -14.4 turns. Interval: -18.3 to -10.5 (95%). Sample: 1166. Depth: 3. Run: deal-d4k. Historical QORRBBNNAAGMMS pool without Paladin; seed 7577; depth 3; four random opening plies; 300-ply cap. Stopped at 6998/14000 games, shards 5/7/8/9/10/11. Whole-arm summaries use 3498 and 3500 openings. Paired deltas use only 1166 shared openings. Paired mean over shared backRank|seed keys; this is not a difference between the whole-arm columns. [deal-d4k-report](../../sim/out/deal-d4k.report.md), [deal-d4k-spec](../../sim/out/deal-d4k.tournament.json), [tournament-mirror-method](../../src/sim/tournament.ts), [deal-d4k-shard5](../../sim/out/deal-d4k.shard5of12.jsonl), [deal-d4k-shard7](../../sim/out/deal-d4k.shard7of12.jsonl), [deal-d4k-shard8](../../sim/out/deal-d4k.shard8of12.jsonl), [deal-d4k-shard9](../../sim/out/deal-d4k.shard9of12.jsonl), [deal-d4k-shard10](../../sim/out/deal-d4k.shard10of12.jsonl), [deal-d4k-shard11](../../sim/out/deal-d4k.shard11of12.jsonl)

<a id="evidence-deal-nosalv2-cards6-white"></a>
**evidence:deal-nosalv2-cards6-white** — cards6, 27-card pool without Salvation, with MirrorB; deal-nosalv2. White score: 51 percent. Interval: 48.7 to 53.3 (95%). Sample: 1750. Depth: 3. Run: deal-nosalv2. Historical QORRBBNNAAGMMS pool without Paladin; seed 7579; depth 3; four random opening plies; 300-ply cap. Complete 3500-game schedule, unstamped compressed rows; launch commit is attributed by QUEUE. This compares six cards without Salvation with none, not with the deck that contains Salvation. [deal-nosalv2-report](../balance/reports/deal-nosalv2.report.md), [deal-nosalv2-spec](../../sim/out/m1/network-2026-10-09/kd-deal/deal-nosalv2.tournament.json), [tournament-mirror-method](../../src/sim/tournament.ts), [deal-nosalv2-raw](../../sim/out/m1/network-2026-10-09/kd-deal/deal-nosalv2.jsonl), [deal-nosalv2-log](../../sim/out/m1/network-2026-10-09/kd-deal/deal-nosalv2.log)

<a id="evidence-deal-nosalv2-cards6-draw"></a>
**evidence:deal-nosalv2-cards6-draw** — cards6, 27-card pool without Salvation, with MirrorB; deal-nosalv2. draw rate: 7.6 percent. Interval: 6.4 to 8.8 (95%). Sample: 1750. Depth: 3. Run: deal-nosalv2. Historical QORRBBNNAAGMMS pool without Paladin; seed 7579; depth 3; four random opening plies; 300-ply cap. Complete 3500-game schedule, unstamped compressed rows; launch commit is attributed by QUEUE. This compares six cards without Salvation with none, not with the deck that contains Salvation. [deal-nosalv2-report](../balance/reports/deal-nosalv2.report.md), [deal-nosalv2-spec](../../sim/out/m1/network-2026-10-09/kd-deal/deal-nosalv2.tournament.json), [tournament-mirror-method](../../src/sim/tournament.ts), [deal-nosalv2-raw](../../sim/out/m1/network-2026-10-09/kd-deal/deal-nosalv2.jsonl), [deal-nosalv2-log](../../sim/out/m1/network-2026-10-09/kd-deal/deal-nosalv2.log)

<a id="evidence-deal-nosalv2-cards6-length"></a>
**evidence:deal-nosalv2-cards6-length** — cards6, 27-card pool without Salvation, with MirrorB; deal-nosalv2. length in turns: 84.1 turns. Interval: 81.9 to 86.3 (95%). Sample: 1750. Depth: 3. Run: deal-nosalv2. Historical QORRBBNNAAGMMS pool without Paladin; seed 7579; depth 3; four random opening plies; 300-ply cap. Complete 3500-game schedule, unstamped compressed rows; launch commit is attributed by QUEUE. This compares six cards without Salvation with none, not with the deck that contains Salvation. [deal-nosalv2-report](../balance/reports/deal-nosalv2.report.md), [deal-nosalv2-spec](../../sim/out/m1/network-2026-10-09/kd-deal/deal-nosalv2.tournament.json), [tournament-mirror-method](../../src/sim/tournament.ts), [deal-nosalv2-raw](../../sim/out/m1/network-2026-10-09/kd-deal/deal-nosalv2.jsonl), [deal-nosalv2-log](../../sim/out/m1/network-2026-10-09/kd-deal/deal-nosalv2.log)

<a id="evidence-deal-nosalv2-none-white"></a>
**evidence:deal-nosalv2-none-white** — none, 27-card pool without Salvation, with MirrorB; deal-nosalv2. White score: 51.3 percent. Interval: 49.2 to 53.4 (95%). Sample: 1750. Depth: 3. Run: deal-nosalv2. Historical QORRBBNNAAGMMS pool without Paladin; seed 7579; depth 3; four random opening plies; 300-ply cap. Complete 3500-game schedule, unstamped compressed rows; launch commit is attributed by QUEUE. This compares six cards without Salvation with none, not with the deck that contains Salvation. [deal-nosalv2-report](../balance/reports/deal-nosalv2.report.md), [deal-nosalv2-spec](../../sim/out/m1/network-2026-10-09/kd-deal/deal-nosalv2.tournament.json), [tournament-mirror-method](../../src/sim/tournament.ts), [deal-nosalv2-raw](../../sim/out/m1/network-2026-10-09/kd-deal/deal-nosalv2.jsonl), [deal-nosalv2-log](../../sim/out/m1/network-2026-10-09/kd-deal/deal-nosalv2.log)

<a id="evidence-deal-nosalv2-none-draw"></a>
**evidence:deal-nosalv2-none-draw** — none, 27-card pool without Salvation, with MirrorB; deal-nosalv2. draw rate: 18.1 percent. Interval: 16.3 to 19.9 (95%). Sample: 1750. Depth: 3. Run: deal-nosalv2. Historical QORRBBNNAAGMMS pool without Paladin; seed 7579; depth 3; four random opening plies; 300-ply cap. Complete 3500-game schedule, unstamped compressed rows; launch commit is attributed by QUEUE. This compares six cards without Salvation with none, not with the deck that contains Salvation. [deal-nosalv2-report](../balance/reports/deal-nosalv2.report.md), [deal-nosalv2-spec](../../sim/out/m1/network-2026-10-09/kd-deal/deal-nosalv2.tournament.json), [tournament-mirror-method](../../src/sim/tournament.ts), [deal-nosalv2-raw](../../sim/out/m1/network-2026-10-09/kd-deal/deal-nosalv2.jsonl), [deal-nosalv2-log](../../sim/out/m1/network-2026-10-09/kd-deal/deal-nosalv2.log)

<a id="evidence-deal-nosalv2-none-length"></a>
**evidence:deal-nosalv2-none-length** — none, 27-card pool without Salvation, with MirrorB; deal-nosalv2. length in turns: 104.4 turns. Interval: 102.1 to 106.7 (95%). Sample: 1750. Depth: 3. Run: deal-nosalv2. Historical QORRBBNNAAGMMS pool without Paladin; seed 7579; depth 3; four random opening plies; 300-ply cap. Complete 3500-game schedule, unstamped compressed rows; launch commit is attributed by QUEUE. This compares six cards without Salvation with none, not with the deck that contains Salvation. [deal-nosalv2-report](../balance/reports/deal-nosalv2.report.md), [deal-nosalv2-spec](../../sim/out/m1/network-2026-10-09/kd-deal/deal-nosalv2.tournament.json), [tournament-mirror-method](../../src/sim/tournament.ts), [deal-nosalv2-raw](../../sim/out/m1/network-2026-10-09/kd-deal/deal-nosalv2.jsonl), [deal-nosalv2-log](../../sim/out/m1/network-2026-10-09/kd-deal/deal-nosalv2.log)

<a id="evidence-deal-nosalv2-paired-white"></a>
**evidence:deal-nosalv2-paired-white** — cards6, 27-card pool without Salvation, with MirrorB; deal-nosalv2. six cards minus no cards White score: -0.3 points. Interval: -3.4 to 2.8 (95%). Sample: 1750. Depth: 3. Run: deal-nosalv2. Historical QORRBBNNAAGMMS pool without Paladin; seed 7579; depth 3; four random opening plies; 300-ply cap. Complete 3500-game schedule, unstamped compressed rows; launch commit is attributed by QUEUE. This compares six cards without Salvation with none, not with the deck that contains Salvation. Paired mean over shared backRank|seed keys; this is not a difference between the whole-arm columns. [deal-nosalv2-report](../balance/reports/deal-nosalv2.report.md), [deal-nosalv2-spec](../../sim/out/m1/network-2026-10-09/kd-deal/deal-nosalv2.tournament.json), [tournament-mirror-method](../../src/sim/tournament.ts), [deal-nosalv2-raw](../../sim/out/m1/network-2026-10-09/kd-deal/deal-nosalv2.jsonl), [deal-nosalv2-log](../../sim/out/m1/network-2026-10-09/kd-deal/deal-nosalv2.log)

<a id="evidence-deal-nosalv2-paired-draw"></a>
**evidence:deal-nosalv2-paired-draw** — cards6, 27-card pool without Salvation, with MirrorB; deal-nosalv2. six cards minus no cards draw rate: -10.5 points. Interval: -12.7 to -8.3 (95%). Sample: 1750. Depth: 3. Run: deal-nosalv2. Historical QORRBBNNAAGMMS pool without Paladin; seed 7579; depth 3; four random opening plies; 300-ply cap. Complete 3500-game schedule, unstamped compressed rows; launch commit is attributed by QUEUE. This compares six cards without Salvation with none, not with the deck that contains Salvation. Paired mean over shared backRank|seed keys; this is not a difference between the whole-arm columns. [deal-nosalv2-report](../balance/reports/deal-nosalv2.report.md), [deal-nosalv2-spec](../../sim/out/m1/network-2026-10-09/kd-deal/deal-nosalv2.tournament.json), [tournament-mirror-method](../../src/sim/tournament.ts), [deal-nosalv2-raw](../../sim/out/m1/network-2026-10-09/kd-deal/deal-nosalv2.jsonl), [deal-nosalv2-log](../../sim/out/m1/network-2026-10-09/kd-deal/deal-nosalv2.log)

<a id="evidence-deal-nosalv2-paired-turns"></a>
**evidence:deal-nosalv2-paired-turns** — cards6, 27-card pool without Salvation, with MirrorB; deal-nosalv2. six cards minus no cards length in turns: -20.3 turns. Interval: -23.4 to -17.2 (95%). Sample: 1750. Depth: 3. Run: deal-nosalv2. Historical QORRBBNNAAGMMS pool without Paladin; seed 7579; depth 3; four random opening plies; 300-ply cap. Complete 3500-game schedule, unstamped compressed rows; launch commit is attributed by QUEUE. This compares six cards without Salvation with none, not with the deck that contains Salvation. Paired mean over shared backRank|seed keys; this is not a difference between the whole-arm columns. [deal-nosalv2-report](../balance/reports/deal-nosalv2.report.md), [deal-nosalv2-spec](../../sim/out/m1/network-2026-10-09/kd-deal/deal-nosalv2.tournament.json), [tournament-mirror-method](../../src/sim/tournament.ts), [deal-nosalv2-raw](../../sim/out/m1/network-2026-10-09/kd-deal/deal-nosalv2.jsonl), [deal-nosalv2-log](../../sim/out/m1/network-2026-10-09/kd-deal/deal-nosalv2.log)

<a id="evidence-guard-drop-any-white"></a>
**evidence:guard-drop-any-white** — Guard, guardReserve any vs off; Archer 505 cp. White score rule difference: -0.1 points. Interval: -2 to 1.8 (95%). Sample: 100. Depth: 3. Run: ab-guard-drop-any. 2000 games per arm, 100 shared arrangements x 20 games per arm; depth 3; seed 109; four random opening plies. Raw src bd592c219166. QUEUE launch commit cd4da6f has Archer 505 cp, before the 339 cp reprice. Pool QOLRRBBNNAAGMMS; far2; Guard next to king; Paladin nonPawn; Ogre push. Interval is the normal approximation over 100 paired arrangement means. Capped games are separate from report draws. Non-significance does not prove equivalence. [guard-drop-report](../../sim/out/m1/ab-guard-drop-any.experiment.md), [guard-drop-base](../../sim/out/m1/ab-guard-drop-any.base.jsonl), [guard-drop-var](../../sim/out/m1/ab-guard-drop-any.var.jsonl), [guard-drop-price](../../src/ai/eval.ts)

<a id="evidence-guard-drop-any-draw"></a>
**evidence:guard-drop-any-draw** — Guard, guardReserve any vs off; Archer 505 cp. draw rate rule difference: 0.1 points. Interval: -1.9 to 2.1 (95%). Sample: 100. Depth: 3. Run: ab-guard-drop-any. 2000 games per arm, 100 shared arrangements x 20 games per arm; depth 3; seed 109; four random opening plies. Raw src bd592c219166. QUEUE launch commit cd4da6f has Archer 505 cp, before the 339 cp reprice. Pool QOLRRBBNNAAGMMS; far2; Guard next to king; Paladin nonPawn; Ogre push. Interval is the normal approximation over 100 paired arrangement means. Capped games are separate from report draws. Non-significance does not prove equivalence. [guard-drop-report](../../sim/out/m1/ab-guard-drop-any.experiment.md), [guard-drop-base](../../sim/out/m1/ab-guard-drop-any.base.jsonl), [guard-drop-var](../../sim/out/m1/ab-guard-drop-any.var.jsonl), [guard-drop-price](../../src/ai/eval.ts)

<a id="evidence-guard-drop-any-decisive"></a>
**evidence:guard-drop-any-decisive** — Guard, guardReserve any vs off; Archer 505 cp. decisive share rule difference: -0.3 points. Interval: -2.4 to 1.8 (95%). Sample: 100. Depth: 3. Run: ab-guard-drop-any. 2000 games per arm, 100 shared arrangements x 20 games per arm; depth 3; seed 109; four random opening plies. Raw src bd592c219166. QUEUE launch commit cd4da6f has Archer 505 cp, before the 339 cp reprice. Pool QOLRRBBNNAAGMMS; far2; Guard next to king; Paladin nonPawn; Ogre push. Interval is the normal approximation over 100 paired arrangement means. Capped games are separate from report draws. Non-significance does not prove equivalence. [guard-drop-report](../../sim/out/m1/ab-guard-drop-any.experiment.md), [guard-drop-base](../../sim/out/m1/ab-guard-drop-any.base.jsonl), [guard-drop-var](../../sim/out/m1/ab-guard-drop-any.var.jsonl), [guard-drop-price](../../src/ai/eval.ts)

<a id="evidence-guard-drop-any-plies"></a>
**evidence:guard-drop-any-plies** — Guard, guardReserve any vs off; Archer 505 cp. mean plies rule difference: 2.8 plies. Interval: 0.9 to 4.7 (95%). Sample: 100. Depth: 3. Run: ab-guard-drop-any. 2000 games per arm, 100 shared arrangements x 20 games per arm; depth 3; seed 109; four random opening plies. Raw src bd592c219166. QUEUE launch commit cd4da6f has Archer 505 cp, before the 339 cp reprice. Pool QOLRRBBNNAAGMMS; far2; Guard next to king; Paladin nonPawn; Ogre push. Interval is the normal approximation over 100 paired arrangement means. Capped games are separate from report draws. Non-significance does not prove equivalence. [guard-drop-report](../../sim/out/m1/ab-guard-drop-any.experiment.md), [guard-drop-base](../../sim/out/m1/ab-guard-drop-any.base.jsonl), [guard-drop-var](../../sim/out/m1/ab-guard-drop-any.var.jsonl), [guard-drop-price](../../src/ai/eval.ts)

<a id="evidence-guard-drop-any-branching"></a>
**evidence:guard-drop-any-branching** — Guard, guardReserve any vs off; Archer 505 cp. branching factor rule difference: 2 legal moves. Interval: 1.6 to 2.4 (95%). Sample: 100. Depth: 3. Run: ab-guard-drop-any. 2000 games per arm, 100 shared arrangements x 20 games per arm; depth 3; seed 109; four random opening plies. Raw src bd592c219166. QUEUE launch commit cd4da6f has Archer 505 cp, before the 339 cp reprice. Pool QOLRRBBNNAAGMMS; far2; Guard next to king; Paladin nonPawn; Ogre push. Interval is the normal approximation over 100 paired arrangement means. Capped games are separate from report draws. Non-significance does not prove equivalence. [guard-drop-report](../../sim/out/m1/ab-guard-drop-any.experiment.md), [guard-drop-base](../../sim/out/m1/ab-guard-drop-any.base.jsonl), [guard-drop-var](../../sim/out/m1/ab-guard-drop-any.var.jsonl), [guard-drop-price](../../src/ai/eval.ts)

## Checked context evidence

<a id="campaign-balance-target-worth-d3-a-piece-worth-pawnworth"></a>
**campaign:balance-target-worth-d3:A:piece-worth:pawnWorth** — A; pawnWorth: 3.5912 pawns; interval 3.2704 to 4.0409 (source-error envelope, not a joint confidence interval). Sample: 1000 games. checked immutable campaign; no price or rule adoption

<a id="campaign-balance-target-worth-d3-b-piece-worth-pawnworth"></a>
**campaign:balance-target-worth-d3:B:piece-worth:pawnWorth** — B; pawnWorth: 3.0099 pawns; interval 2.6325 to 3.327 (source-error envelope, not a joint confidence interval). Sample: 1000 games. checked immutable campaign; no price or rule adoption

<a id="campaign-balance-target-worth-d3-l-piece-worth-pawnworth"></a>
**campaign:balance-target-worth-d3:L:piece-worth:pawnWorth** — L; pawnWorth: 4.1219 pawns; interval 3.7384 to 4.6596 (source-error envelope, not a joint confidence interval). Sample: 1000 games. checked immutable campaign; no price or rule adoption

<a id="campaign-balance-target-worth-d3-m-piece-worth-pawnworth"></a>
**campaign:balance-target-worth-d3:M:piece-worth:pawnWorth** — M; pawnWorth: 3.21 pawns; interval 2.8733 to 3.5669 (source-error envelope, not a joint confidence interval). Sample: 1000 games. checked immutable campaign; no price or rule adoption

<a id="campaign-balance-target-worth-d3-o-piece-worth-pawnworth"></a>
**campaign:balance-target-worth-d3:O:piece-worth:pawnWorth** — O; pawnWorth: 2.9248 pawns; interval 2.5211 to 3.2339 (source-error envelope, not a joint confidence interval). Sample: 1000 games. checked immutable campaign; no price or rule adoption

<a id="campaign-balance-target-worth-d3-r-piece-worth-pawnworth"></a>
**campaign:balance-target-worth-d3:R:piece-worth:pawnWorth** — R; pawnWorth: 3.7935 pawns; interval 3.4455 to 4.2814 (source-error envelope, not a joint confidence interval). Sample: 1000 games. checked immutable campaign; no price or rule adoption

<a id="campaign-balance-target-worth-d3-s-piece-worth-pawnworth"></a>
**campaign:balance-target-worth-d3:S:piece-worth:pawnWorth** — S; pawnWorth: 4.247 pawns; interval 3.8362 to 4.823 (source-error envelope, not a joint confidence interval). Sample: 1000 games. checked immutable campaign; no price or rule adoption

## Rebuilt rows for reviewed runs

These are direct dataset rows. Curated report rows above retain any additional comparison limits. Rows from the same games are alternative views, not additional samples.

<a id="run-deal-c4k"></a>
### deal-c4k

| Row ID | Element / measure | Value ± error | Sample / unit | Method / context limit |
|---|---|---|---|---|
| deal-c4k:184704ee2b4b35028b7f:mirror:cards4:activity | cards4 / activity | 3.2739 ± 0.0447 uses per side | 1749 games | streamed completed records; identical game IDs and contents counted once within context; valid; The owner pauses the run after the three returned shards. Selected sample: 3498 of 14000 planned games. |
| deal-c4k:184704ee2b4b35028b7f:mirror:cards4:drawRate | cards4 / drawRate | 0.0949 ± 0.0137 fraction | 1749 games | streamed completed records; identical game IDs and contents counted once within context; valid; The owner pauses the run after the three returned shards. Selected sample: 3498 of 14000 planned games. |
| deal-c4k:184704ee2b4b35028b7f:mirror:cards4:meanPlies | cards4 / meanPlies | 92.4654 ± 2.2119 plies | 1749 games | streamed completed records; identical game IDs and contents counted once within context; valid; The owner pauses the run after the three returned shards. Selected sample: 3498 of 14000 planned games. |
| deal-c4k:184704ee2b4b35028b7f:mirror:cards4:whiteScore | cards4 / whiteScore | 0.4997 ± 0.0223 fraction | 1749 games | streamed completed records; identical game IDs and contents counted once within context; valid; The owner pauses the run after the three returned shards. Selected sample: 3498 of 14000 planned games. |
| deal-c4k:184704ee2b4b35028b7f:mirror:none:activity | none / activity | 0 ± 0 uses per side | 1749 games | streamed completed records; identical game IDs and contents counted once within context; valid; The owner pauses the run after the three returned shards. Selected sample: 3498 of 14000 planned games. |
| deal-c4k:184704ee2b4b35028b7f:mirror:none:drawRate | none / drawRate | 0.2001 ± 0.0188 fraction | 1749 games | streamed completed records; identical game IDs and contents counted once within context; valid; The owner pauses the run after the three returned shards. Selected sample: 3498 of 14000 planned games. |
| deal-c4k:184704ee2b4b35028b7f:mirror:none:meanPlies | none / meanPlies | 101.2962 ± 2.1422 plies | 1749 games | streamed completed records; identical game IDs and contents counted once within context; valid; The owner pauses the run after the three returned shards. Selected sample: 3498 of 14000 planned games. |
| deal-c4k:184704ee2b4b35028b7f:mirror:none:whiteScore | none / whiteScore | 0.51 ± 0.021 fraction | 1749 games | streamed completed records; identical game IDs and contents counted once within context; valid; The owner pauses the run after the three returned shards. Selected sample: 3498 of 14000 planned games. |
| deal-c4k:184704ee2b4b35028b7f:run:drawRate | run / drawRate | 0.1475 ± 0.0118 fraction | 3498 games | streamed completed records; identical game IDs and contents counted once within context; valid; The owner pauses the run after the three returned shards. Selected sample: 3498 of 14000 planned games. |
| deal-c4k:184704ee2b4b35028b7f:run:meanPlies | run / meanPlies | 96.8808 ± 1.5463 plies | 3498 games | streamed completed records; identical game IDs and contents counted once within context; valid; The owner pauses the run after the three returned shards. Selected sample: 3498 of 14000 planned games. |
| deal-c4k:184704ee2b4b35028b7f:run:whiteScore | run / whiteScore | 0.5049 ± 0.0153 fraction | 3498 games | streamed completed records; identical game IDs and contents counted once within context; valid; The owner pauses the run after the three returned shards. Selected sample: 3498 of 14000 planned games. |
| report:2cacf4914ef23151634e03bb | cards4 / meanTurns | 91 ± 2.2 turns | 1749 games | stored report; not an independent sample from raw games of this run; valid;  |
| report:551c6c0b8014a1415ae112ac | none / meanTurns | 101.3 ± 2.1 turns | 1749 games | stored report; not an independent sample from raw games of this run; valid;  |

<a id="run-deal-d4k"></a>
### deal-d4k

| Row ID | Element / measure | Value ± error | Sample / unit | Method / context limit |
|---|---|---|---|---|
| deal-d4k:1845769c03aa97b60660:mirror:cards6:activity | cards6 / activity | 4.77 ± 0.0433 uses per side | 3498 games | streamed completed records; identical game IDs and contents counted once within context; valid; The owner pauses the run after the six returned shards; shard 6 is cancelled. Selected sample: 6998 of 14000 planned games. |
| deal-d4k:1845769c03aa97b60660:mirror:cards6:drawRate | cards6 / drawRate | 0.0878 ± 0.0094 fraction | 3498 games | streamed completed records; identical game IDs and contents counted once within context; valid; The owner pauses the run after the six returned shards; shard 6 is cancelled. Selected sample: 6998 of 14000 planned games. |
| deal-d4k:1845769c03aa97b60660:mirror:cards6:meanPlies | cards6 / meanPlies | 88.4788 ± 1.5664 plies | 3498 games | streamed completed records; identical game IDs and contents counted once within context; valid; The owner pauses the run after the six returned shards; shard 6 is cancelled. Selected sample: 6998 of 14000 planned games. |
| deal-d4k:1845769c03aa97b60660:mirror:cards6:whiteScore | cards6 / whiteScore | 0.5176 ± 0.0158 fraction | 3498 games | streamed completed records; identical game IDs and contents counted once within context; valid; The owner pauses the run after the six returned shards; shard 6 is cancelled. Selected sample: 6998 of 14000 planned games. |
| deal-d4k:1845769c03aa97b60660:mirror:none:activity | none / activity | 0 ± 0 uses per side | 3500 games | streamed completed records; identical game IDs and contents counted once within context; valid; The owner pauses the run after the six returned shards; shard 6 is cancelled. Selected sample: 6998 of 14000 planned games. |
| deal-d4k:1845769c03aa97b60660:mirror:none:drawRate | none / drawRate | 0.1946 ± 0.0131 fraction | 3500 games | streamed completed records; identical game IDs and contents counted once within context; valid; The owner pauses the run after the six returned shards; shard 6 is cancelled. Selected sample: 6998 of 14000 planned games. |
| deal-d4k:1845769c03aa97b60660:mirror:none:meanPlies | none / meanPlies | 102.64 ± 1.6035 plies | 3500 games | streamed completed records; identical game IDs and contents counted once within context; valid; The owner pauses the run after the six returned shards; shard 6 is cancelled. Selected sample: 6998 of 14000 planned games. |
| deal-d4k:1845769c03aa97b60660:mirror:none:whiteScore | none / whiteScore | 0.5181 ± 0.0149 fraction | 3500 games | streamed completed records; identical game IDs and contents counted once within context; valid; The owner pauses the run after the six returned shards; shard 6 is cancelled. Selected sample: 6998 of 14000 planned games. |
| deal-d4k:1845769c03aa97b60660:run:drawRate | run / drawRate | 0.1412 ± 0.0082 fraction | 6998 games | streamed completed records; identical game IDs and contents counted once within context; valid; The owner pauses the run after the six returned shards; shard 6 is cancelled. Selected sample: 6998 of 14000 planned games. |
| deal-d4k:1845769c03aa97b60660:run:meanPlies | run / meanPlies | 95.5614 ± 1.133 plies | 6998 games | streamed completed records; identical game IDs and contents counted once within context; valid; The owner pauses the run after the six returned shards; shard 6 is cancelled. Selected sample: 6998 of 14000 planned games. |
| deal-d4k:1845769c03aa97b60660:run:whiteScore | run / whiteScore | 0.5179 ± 0.0108 fraction | 6998 games | streamed completed records; identical game IDs and contents counted once within context; valid; The owner pauses the run after the six returned shards; shard 6 is cancelled. Selected sample: 6998 of 14000 planned games. |
| report:339ced46e80a01a886fdd08d | cards6 / meanTurns | 86.2 ± 1.6 turns | 3498 games | stored report; not an independent sample from raw games of this run; valid;  |
| report:99c65684aa58a9f040368510 | none / meanTurns | 102.6 ± 1.6 turns | 3500 games | stored report; not an independent sample from raw games of this run; valid;  |

<a id="run-deal-nosalv2"></a>
### deal-nosalv2

| Row ID | Element / measure | Value ± error | Sample / unit | Method / context limit |
|---|---|---|---|---|
| deal-nosalv2:2944b25f2ac09aa8bb5d:mirror:cards6:activity | cards6 / activity | 4.6597 ± 0.0633 uses per side | 1750 games | streamed completed records; identical game IDs and contents counted once within context; valid;  |
| deal-nosalv2:2944b25f2ac09aa8bb5d:mirror:cards6:drawRate | cards6 / drawRate | 0.076 ± 0.0124 fraction | 1750 games | streamed completed records; identical game IDs and contents counted once within context; valid;  |
| deal-nosalv2:2944b25f2ac09aa8bb5d:mirror:cards6:meanPlies | cards6 / meanPlies | 86.3051 ± 2.1602 plies | 1750 games | streamed completed records; identical game IDs and contents counted once within context; valid;  |
| deal-nosalv2:2944b25f2ac09aa8bb5d:mirror:cards6:whiteScore | cards6 / whiteScore | 0.51 ± 0.0225 fraction | 1750 games | streamed completed records; identical game IDs and contents counted once within context; valid;  |
| deal-nosalv2:2944b25f2ac09aa8bb5d:mirror:none:activity | none / activity | 0 ± 0 uses per side | 1750 games | streamed completed records; identical game IDs and contents counted once within context; valid;  |
| deal-nosalv2:2944b25f2ac09aa8bb5d:mirror:none:drawRate | none / drawRate | 0.1811 ± 0.018 fraction | 1750 games | streamed completed records; identical game IDs and contents counted once within context; valid;  |
| deal-nosalv2:2944b25f2ac09aa8bb5d:mirror:none:meanPlies | none / meanPlies | 104.4234 ± 2.2637 plies | 1750 games | streamed completed records; identical game IDs and contents counted once within context; valid;  |
| deal-nosalv2:2944b25f2ac09aa8bb5d:mirror:none:whiteScore | none / whiteScore | 0.5134 ± 0.0212 fraction | 1750 games | streamed completed records; identical game IDs and contents counted once within context; valid;  |
| deal-nosalv2:2944b25f2ac09aa8bb5d:run:drawRate | run / drawRate | 0.1286 ± 0.0111 fraction | 3500 games | streamed completed records; identical game IDs and contents counted once within context; valid;  |
| deal-nosalv2:2944b25f2ac09aa8bb5d:run:meanPlies | run / meanPlies | 95.3643 ± 1.5928 plies | 3500 games | streamed completed records; identical game IDs and contents counted once within context; valid;  |
| deal-nosalv2:2944b25f2ac09aa8bb5d:run:whiteScore | run / whiteScore | 0.5117 ± 0.0155 fraction | 3500 games | streamed completed records; identical game IDs and contents counted once within context; valid;  |

<a id="run-ab-guard-drop-any"></a>
### ab-guard-drop-any

| Row ID | Element / measure | Value ± error | Sample / unit | Method / context limit |
|---|---|---|---|---|
| ab-guard-drop-any.base:e61c36e8866e85656ea8:run:drawRate | run / drawRate | 0.2095 ± 0.0178 fraction | 2000 games | streamed completed records; identical game IDs and contents counted once within context; valid;  |
| ab-guard-drop-any.base:e61c36e8866e85656ea8:run:meanPlies | run / meanPlies | 102.923 ± 1.9619 plies | 2000 games | streamed completed records; identical game IDs and contents counted once within context; valid;  |
| ab-guard-drop-any.base:e61c36e8866e85656ea8:run:whiteScore | run / whiteScore | 0.5413 ± 0.0194 fraction | 2000 games | streamed completed records; identical game IDs and contents counted once within context; valid;  |
| ab-guard-drop-any.var:cf79bb24de28d285198d:run:drawRate | run / drawRate | 0.2125 ± 0.0179 fraction | 2000 games | streamed completed records; identical game IDs and contents counted once within context; valid;  |
| ab-guard-drop-any.var:cf79bb24de28d285198d:run:meanPlies | run / meanPlies | 105.75 ± 1.9634 plies | 2000 games | streamed completed records; identical game IDs and contents counted once within context; valid;  |
| ab-guard-drop-any.var:cf79bb24de28d285198d:run:whiteScore | run / whiteScore | 0.5397 ± 0.0194 fraction | 2000 games | streamed completed records; identical game IDs and contents counted once within context; valid;  |
| paired:0eb716e82b56661170b27b25 | run / whiteScore | -0.001 ± 0.019 fraction difference | 100 arrangements | stored paired report; variant minus base over shared arrangements; not an independent game sample; valid; Both raw arms pass the scheduled ID and common-opening checks. The stored interval uses shared arrangements. |
| paired:9b117d566f0e4fb5717a35e9 | run / meanPlies | 2.8 ± 1.9 plies | 100 arrangements | stored paired report; variant minus base over shared arrangements; not an independent game sample; valid; Both raw arms pass the scheduled ID and common-opening checks. The stored interval uses shared arrangements. |
| paired:e5564138012222ac606c4390 | run / drawRate | 0.001 ± 0.02 fraction difference | 100 arrangements | stored paired report; variant minus base over shared arrangements; not an independent game sample; valid; Both raw arms pass the scheduled ID and common-opening checks. The stored interval uses shared arrangements. |
| report:0a961d255be8c9f0aa8139d9 | G / activity | 1.3811 ± unknown report utilisation | 2000 games | stored report; not an independent sample from raw games of this run; valid;  |
| report:161726c84db52a245c461a3a | R / activity | 1.4878 ± unknown report utilisation | 2000 games | stored report; not an independent sample from raw games of this run; valid;  |
| report:183d17858ced1e5d540c31fd | M / activity | 1.8022 ± unknown report utilisation | 2000 games | stored report; not an independent sample from raw games of this run; valid;  |
| report:1da9d118297b9f030f26b206 | K / activity | 1.5516 ± unknown report utilisation | 2000 games | stored report; not an independent sample from raw games of this run; valid;  |
| report:213635cb36abd21f13388163 | R / activity | 1.5108 ± unknown report utilisation | 2000 games | stored report; not an independent sample from raw games of this run; valid;  |
| report:2294dbbf1ce612a943bdcd84 | N / activity | 1.3392 ± unknown report utilisation | 2000 games | stored report; not an independent sample from raw games of this run; valid;  |
| report:29f3921b9d19037a8b0670cd | L / activity | 1.2266 ± unknown report utilisation | 2000 games | stored report; not an independent sample from raw games of this run; valid;  |
| report:2b83734a0fed37d2328a1a98 | L / activity | 1.2187 ± unknown report utilisation | 2000 games | stored report; not an independent sample from raw games of this run; valid;  |
| report:4295885352d5055f18bc860b | run / drawRate | 0.2055 ± unknown fraction | 2000 games | stored report; not an independent sample from raw games of this run; valid;  |
| report:4e94f6b8ef2b25ed4c17f599 | Q / activity | 1.9825 ± unknown report utilisation | 2000 games | stored report; not an independent sample from raw games of this run; valid;  |
| report:5760fffd756bf8b88ef0a07e | O / activity | 1.5255 ± unknown report utilisation | 2000 games | stored report; not an independent sample from raw games of this run; valid;  |
| report:720403e990841e732f1d4dcc | A / activity | 2.2287 ± unknown report utilisation | 2000 games | stored report; not an independent sample from raw games of this run; valid;  |
| report:73ee836c696c0e2f0aac7d34 | S / activity | 1.5568 ± unknown report utilisation | 2000 games | stored report; not an independent sample from raw games of this run; valid;  |
| report:781e3bf18af2bd169dca19bb | run / drawRate | 0.207 ± unknown fraction | 2000 games | stored report; not an independent sample from raw games of this run; valid;  |
| report:784cddfe05944fbe8063b3f6 | P / activity | 0.4483 ± unknown report utilisation | 2000 games | stored report; not an independent sample from raw games of this run; valid;  |
| report:7b556e1ffa9b2ba87eabb7e9 | A / activity | 2.2472 ± unknown report utilisation | 2000 games | stored report; not an independent sample from raw games of this run; valid;  |
| report:90c66546070e4bf342b92695 | Q / activity | 2.0028 ± unknown report utilisation | 2000 games | stored report; not an independent sample from raw games of this run; valid;  |
| report:a1ded25a1cc40423bbe6ca7e | M / activity | 1.8156 ± unknown report utilisation | 2000 games | stored report; not an independent sample from raw games of this run; valid;  |
| report:a80b2a2e26f74146b2913f01 | N / activity | 1.3038 ± unknown report utilisation | 2000 games | stored report; not an independent sample from raw games of this run; valid;  |
| report:ae6ce2a33b3f67bea5e037f1 | B / activity | 1.1208 ± unknown report utilisation | 2000 games | stored report; not an independent sample from raw games of this run; valid;  |
| report:b3476f4a0ce48228e8f2e86f | G / activity | 0.9546 ± unknown report utilisation | 2000 games | stored report; not an independent sample from raw games of this run; valid;  |
| report:cb9c9ff062df755f2f5ee6e4 | B / activity | 1.1681 ± unknown report utilisation | 2000 games | stored report; not an independent sample from raw games of this run; valid;  |
| report:cc8fae62447a8ee15c192125 | P / activity | 0.4344 ± unknown report utilisation | 2000 games | stored report; not an independent sample from raw games of this run; valid;  |
| report:d9dbcc375b17602af91ee957 | K / activity | 1.5693 ± unknown report utilisation | 2000 games | stored report; not an independent sample from raw games of this run; valid;  |
| report:e03ba5cf4a05ba5fb3373cfe | O / activity | 1.5173 ± unknown report utilisation | 2000 games | stored report; not an independent sample from raw games of this run; valid;  |
| report:f52b1dee1c2b70e3d3444602 | S / activity | 1.5497 ± unknown report utilisation | 2000 games | stored report; not an independent sample from raw games of this run; valid;  |

<a id="run-balance-target-worth-d3"></a>
### balance-target-worth-d3

| Row ID | Element / measure | Value ± error | Sample / unit | Method / context limit |
|---|---|---|---|---|
| balance-target-worth-d3.A:ece58808bec007512301:run:drawRate | run / drawRate | 0.076 ± 0.0164 fraction | 1000 games | streamed completed records; identical game IDs and contents counted once within context; valid;  |
| balance-target-worth-d3.A:ece58808bec007512301:run:meanPlies | run / meanPlies | 112.585 ± 2.7592 plies | 1000 games | streamed completed records; identical game IDs and contents counted once within context; valid;  |
| balance-target-worth-d3.A:ece58808bec007512301:run:whiteScore | run / whiteScore | 0.551 ± 0.0296 fraction | 1000 games | streamed completed records; identical game IDs and contents counted once within context; valid;  |
| balance-target-worth-d3.B:d7e8d17be6672b1aca71:run:drawRate | run / drawRate | 0.092 ± 0.0179 fraction | 1000 games | streamed completed records; identical game IDs and contents counted once within context; valid;  |
| balance-target-worth-d3.B:d7e8d17be6672b1aca71:run:meanPlies | run / meanPlies | 112.975 ± 2.9254 plies | 1000 games | streamed completed records; identical game IDs and contents counted once within context; valid;  |
| balance-target-worth-d3.B:d7e8d17be6672b1aca71:run:whiteScore | run / whiteScore | 0.497 ± 0.0295 fraction | 1000 games | streamed completed records; identical game IDs and contents counted once within context; valid;  |
| balance-target-worth-d3.L:5b3678ff8faee689c29a:run:drawRate | run / drawRate | 0.076 ± 0.0164 fraction | 1000 games | streamed completed records; identical game IDs and contents counted once within context; valid;  |
| balance-target-worth-d3.L:5b3678ff8faee689c29a:run:meanPlies | run / meanPlies | 114.343 ± 2.7782 plies | 1000 games | streamed completed records; identical game IDs and contents counted once within context; valid;  |
| balance-target-worth-d3.L:5b3678ff8faee689c29a:run:whiteScore | run / whiteScore | 0.552 ± 0.0296 fraction | 1000 games | streamed completed records; identical game IDs and contents counted once within context; valid;  |
| balance-target-worth-d3.M:e0a1a57f1d54d122312d:run:drawRate | run / drawRate | 0.09 ± 0.0177 fraction | 1000 games | streamed completed records; identical game IDs and contents counted once within context; valid;  |
| balance-target-worth-d3.M:e0a1a57f1d54d122312d:run:meanPlies | run / meanPlies | 120.622 ± 2.8946 plies | 1000 games | streamed completed records; identical game IDs and contents counted once within context; valid;  |
| balance-target-worth-d3.M:e0a1a57f1d54d122312d:run:whiteScore | run / whiteScore | 0.49 ± 0.0296 fraction | 1000 games | streamed completed records; identical game IDs and contents counted once within context; valid;  |
| balance-target-worth-d3.O:74886165ad8b67f4d47f:run:drawRate | run / drawRate | 0.069 ± 0.0157 fraction | 1000 games | streamed completed records; identical game IDs and contents counted once within context; valid;  |
| balance-target-worth-d3.O:74886165ad8b67f4d47f:run:meanPlies | run / meanPlies | 114.301 ± 2.7699 plies | 1000 games | streamed completed records; identical game IDs and contents counted once within context; valid;  |
| balance-target-worth-d3.O:74886165ad8b67f4d47f:run:whiteScore | run / whiteScore | 0.5155 ± 0.0299 fraction | 1000 games | streamed completed records; identical game IDs and contents counted once within context; valid;  |
| balance-target-worth-d3.pawn:c737f44d42ce5c0c32f4:run:drawRate | run / drawRate | 0.0787 ± 0.0096 fraction | 3000 games | streamed completed records; identical game IDs and contents counted once within context; valid;  |
| balance-target-worth-d3.pawn:c737f44d42ce5c0c32f4:run:meanPlies | run / meanPlies | 109.1367 ± 1.5861 plies | 3000 games | streamed completed records; identical game IDs and contents counted once within context; valid;  |
| balance-target-worth-d3.pawn:c737f44d42ce5c0c32f4:run:whiteScore | run / whiteScore | 0.5473 ± 0.0171 fraction | 3000 games | streamed completed records; identical game IDs and contents counted once within context; valid;  |
| balance-target-worth-d3.R:6d6815f178aa3ac73c4c:run:drawRate | run / drawRate | 0.1 ± 0.0186 fraction | 1000 games | streamed completed records; identical game IDs and contents counted once within context; valid;  |
| balance-target-worth-d3.R:6d6815f178aa3ac73c4c:run:meanPlies | run / meanPlies | 115.347 ± 3.0208 plies | 1000 games | streamed completed records; identical game IDs and contents counted once within context; valid;  |
| balance-target-worth-d3.R:6d6815f178aa3ac73c4c:run:whiteScore | run / whiteScore | 0.53 ± 0.0294 fraction | 1000 games | streamed completed records; identical game IDs and contents counted once within context; valid;  |
| balance-target-worth-d3.S:e4dfcc00078a91742085:run:drawRate | run / drawRate | 0.06 ± 0.0147 fraction | 1000 games | streamed completed records; identical game IDs and contents counted once within context; valid;  |
| balance-target-worth-d3.S:e4dfcc00078a91742085:run:meanPlies | run / meanPlies | 108.244 ± 2.9031 plies | 1000 games | streamed completed records; identical game IDs and contents counted once within context; valid;  |
| balance-target-worth-d3.S:e4dfcc00078a91742085:run:whiteScore | run / whiteScore | 0.532 ± 0.03 fraction | 1000 games | streamed completed records; identical game IDs and contents counted once within context; valid;  |
| campaign:balance-target-worth-d3:A:piece-worth:pawnWorth | A / pawnWorth | 3.5912 ± 0.4497 pawns | 1000 games | checked immutable campaign; no price or rule adoption; valid;  |
| campaign:balance-target-worth-d3:B:piece-worth:pawnWorth | B / pawnWorth | 3.0099 ± 0.3774 pawns | 1000 games | checked immutable campaign; no price or rule adoption; valid;  |
| campaign:balance-target-worth-d3:L:piece-worth:pawnWorth | L / pawnWorth | 4.1219 ± 0.5377 pawns | 1000 games | checked immutable campaign; no price or rule adoption; valid;  |
| campaign:balance-target-worth-d3:M:piece-worth:pawnWorth | M / pawnWorth | 3.21 ± 0.3568 pawns | 1000 games | checked immutable campaign; no price or rule adoption; valid;  |
| campaign:balance-target-worth-d3:O:piece-worth:pawnWorth | O / pawnWorth | 2.9248 ± 0.4037 pawns | 1000 games | checked immutable campaign; no price or rule adoption; valid;  |
| campaign:balance-target-worth-d3:R:piece-worth:pawnWorth | R / pawnWorth | 3.7935 ± 0.4879 pawns | 1000 games | checked immutable campaign; no price or rule adoption; valid;  |
| campaign:balance-target-worth-d3:S:piece-worth:pawnWorth | S / pawnWorth | 4.247 ± 0.576 pawns | 1000 games | checked immutable campaign; no price or rule adoption; valid;  |
| report:1466368396e974bc4d68a41c | A / pawnWorth | 3.59 ± 0.3 pawns | 1000 games | stored report; not an independent sample from raw games of this run; unverified; Report has no proved completion target. |
| report:15153063efe59f04182748cb | L / pawnWorth | 4.12 ± 0.29 pawns | 1000 games | stored report; not an independent sample from raw games of this run; unverified; Report has no proved completion target. |
| report:56140439398988973c53de48 | M / pawnWorth | 3.21 ± 0.29 pawns | 1000 games | stored report; not an independent sample from raw games of this run; unverified; Report has no proved completion target. |
| report:5837f9defddd1c3a8276a713 | R / pawnWorth | 3.79 ± 0.3 pawns | 1000 games | stored report; not an independent sample from raw games of this run; unverified; Report has no proved completion target. |
| report:94d7c4ebb379c3cea81d6b1b | B / pawnWorth | 3.01 ± 0.29 pawns | 1000 games | stored report; not an independent sample from raw games of this run; unverified; Report has no proved completion target. |
| report:963f0c8b73dcfb6e257a3ae5 | O / pawnWorth | 2.92 ± 0.3 pawns | 1000 games | stored report; not an independent sample from raw games of this run; unverified; Report has no proved completion target. |
| report:dd2917041ad675dee58eb8ce | S / pawnWorth | 4.25 ± 0.3 pawns | 1000 games | stored report; not an independent sample from raw games of this run; unverified; Report has no proved completion target. |
