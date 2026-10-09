# Balance and rules framework

This framework reads and checks. It does not change the game or choose a rule. The source snapshot is 2026-10-09.

The declared target is far2, a Guard next to its king, the Paladin beside the Ogre in the pool, Death Touch T2, and four cards. The request sets this target. The workbook records the first four approvals. Its hand-size cell still says six. The reviewed main source now implements the piece and power choices, with an Archer price of 3.39 pawns. QUEUE records the four-card choice; card mode stays in the lab. No cited run measures the complete target together.

## Rebuild and check

Run `npm run balance:build`. The command reads local output, the available Drive backup, the workbook, the approved documents, and the cited reports. It writes this report, `measurements.json`, `coverage.md`, `workbook.json`, and `status.json`. Use repeated `--source <folder>` arguments to select a fixed source set. It performs analysis only. It starts no games and contacts no remote machine.

Run `npm run balance:check` for a strict schema and document check. Known source gaps make it fail on this snapshot. `npm run balance:check -- --report` prints the audit without a failing exit status. A source change still requires review. `npm test` tests the parsers, context boundaries, criteria, workbook reader, and drift detection.

## Typed design model

`src/balance/schema.ts` defines the allowed dimensions. A piece records movement, capture, hop, shield, limits, control, triggers, and zones. A power or card records its source, effect, use count, turn cost, captures, targets, duration, rarity, and conditions. A rule records its flag and allowed value. Shared fields retain approval, version, source, and any text that the matrix cannot express.

There are 26 dimension families and 97 code rule fields. The workbook holds 110 version records. The audit finds 100 source gaps or drift items. See the complete lists below. A typed record is not proof of approval.

The code is the source for shipped behavior. Dated owner choices and this request are the source for the target. The workbook can retain stale text inside an updated cell. Each layer stays separate. The check pins reviewed document sections, rule choices, defaults, and official power readings. It fails on added, changed, or removed source dimensions.

The dataset supplies 7242 distinct measured element/context points. The machine-readable list in status.json links to each measurement's rule values. It lists each non-fitting or unknown dimension. Historical source flags remain intact. They are never coerced to current values.

## Measurements and units

The dataset has 11991 rows from 15001 inventoried sources and 833 run IDs. The [coverage ledger](coverage.md) lists every source and every known run. It also lists unsupported files, missing metadata, partial files, duplicates, void runs, and conflicts. The M1 name does not resolve during this audit. Remote-only data cannot be certified.

A row records element, version, run, flags, commit or source hash, pool, depth, machine, value, error, sample, units, method, and source. Unknown fields are null. Empty historical flags never mean current rules. Rates use fractions. Rate differences use fraction differences. Piece and card worth use pawns. Game length uses plies or turns as named. Activity keeps its denominator.

Copies and shards do not add new games. Report views and cited summaries are alternative views of the same games. Do not sum their samples. Void, incomplete, pending, and conflicting sources cannot supply a result. A pending run needs a proved schedule and a complete set of game IDs before it changes state. Report-only and unstamped results retain their limits.

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
| card-worth | common cards | {"min":0.7,"max":3,"unit":"pawns","exceptions":["Rage: legendary, outside common deal"]} | documented operational band | [card-band](../MATRIX.md#L172), [queue-latest](../QUEUE.md#L300), [workbook](../balance/workbook.json) |
| draws-first | all candidate changes | {"direction":"avoid higher draws","noninferiorityMarginPoints":null} | adopted priority | [draw-priority](../tasks-archive/2026-09.md#L447), [queue](../QUEUE.md#L54) |
| white-parity | all candidate changes | {"target":50,"equivalenceMarginPoints":null} | adopted direction | [cards-early](../research/cards-2026-10-03.md#L86), [power-approval](../tasks-archive/2026-10.md#L458) |
| odds-price | piece prices | {"reference":"Knight or closer standard piece","maxLinearImbalancePawns":1.5,"pawnCalibration":"all eight files; same depth","iteration":"until change <= interval"} | method | [value-method](../SIM-PLAN.md#L119), [criteria-method](../research/piece-balance-criteria-2026-10-03.md#L25) |

Criterion 4 is a weighted-mean identity. It cannot reject a piece. Criterion 4b stays open. The Queen is exempt from the piece worth band. The Guard cannot capture and is flagged on capture share. Rage is legendary and stays outside the common-card band. Global White equivalence and Light–Dark equality have no approved numeric margin. The draw gate comes before other outcome gates.

## Element status

Each row links to the cited evidence in this report and to the same row ID in `measurements.json`. “Evidence check” applies the criterion in the named historical version. “Full target” needs matching rule and setup evidence. Cards marked testing are included so the whole candidate deal remains visible. The checked context list in `target-contexts.json` is empty because no complete measured context proves the full target. Register an immutable sourceHash and specKey only after source review. The next build then joins complete matching rows. Do not infer a match from a run name.

| Element | Evidence version | Criterion | Evidence check | Full target | Evidence rows |
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
| Bishop | Oct4 default rule; pv2-d3 | piece-worth | pass | no-data | [evidence:worth-B-pv2](#evidence-worth-b-pv2) |
| Bishop | Oct4 default rule; pa-r1 | piece-captures | pass | no-data | [evidence:pa-r1-B-captures](#evidence-pa-r1-b-captures) |
| Bishop | Oct4 default rule; pa-r1 | piece-moves | pass | no-data | [evidence:pa-r1-B-moves](#evidence-pa-r1-b-moves) |
| Bishop | no measurement | piece-phase | no-data | no-data | none |
| Bishop | Oct4 default rule; pa-r1 | piece-use | pass | no-data | [evidence:pa-r1-B-use](#evidence-pa-r1-b-use) |
| Bishop | Oct4 default rule; pa-r1 | piece-game | no-data | no-data | [evidence:pa-r1-B-draw-presence](#evidence-pa-r1-b-draw-presence), [evidence:pa-r1-B-white-presence](#evidence-pa-r1-b-white-presence), [evidence:pa-r1-B-length-presence](#evidence-pa-r1-b-length-presence) |
| Bishop | Oct4 default rule; pa-r1 | piece-phase-4b | fail | no-data | [evidence:pa-r1-B-best-phase-4b](#evidence-pa-r1-b-best-phase-4b) |
| Bishop | no measurement | odds-price | no-data | no-data | none |
| Rook | Oct4 default rule; pv2-d3 | piece-worth | pass | no-data | [evidence:worth-R-pv2](#evidence-worth-r-pv2) |
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
| Archer | plusDiagFwd2; pv2-A-vsR-d3 | piece-worth | pass | no-data | [evidence:worth-A-pv2d3](#evidence-worth-a-pv2d3) |
| Archer | plusDiagFwd2; pv2-A-vsR-d4 | piece-worth | pass | no-data | [evidence:worth-A-pv2d4](#evidence-worth-a-pv2d4) |
| Archer | far2; pv-A-af2na-n2 | piece-worth | pass | no-data | [evidence:far2-noadj-worth](#evidence-far2-noadj-worth) |
| Archer | far2; pv-A-af2-vsR-d4 | piece-worth | pass | no-data | [evidence:far2-d4-worth](#evidence-far2-d4-worth) |
| Archer | plusDiagFwd2; pa-r1 | piece-captures | fail | no-data | [evidence:pa-r1-A-captures](#evidence-pa-r1-a-captures) |
| Archer | far2; pa-af2-d4 | piece-captures | fail | no-data | [evidence:far2-d4-captures](#evidence-far2-d4-captures) |
| Archer | plusDiagFwd2; pa-r1 | piece-moves | pass | no-data | [evidence:pa-r1-A-moves](#evidence-pa-r1-a-moves) |
| Archer | no measurement | piece-phase | no-data | no-data | none |
| Archer | plusDiagFwd2; pa-r1 | piece-use | pass | no-data | [evidence:pa-r1-A-use](#evidence-pa-r1-a-use) |
| Archer | plusDiagFwd2; pa-r1 | piece-game | fail | no-data | [evidence:pa-r1-A-draw](#evidence-pa-r1-a-draw), [evidence:pa-r1-A-white-presence](#evidence-pa-r1-a-white-presence), [evidence:pa-r1-A-length-presence](#evidence-pa-r1-a-length-presence) |
| Archer | plusDiagFwd2; pa-r1 | piece-phase-4b | pass | no-data | [evidence:pa-r1-A-best-phase-4b](#evidence-pa-r1-a-best-phase-4b) |
| Archer | no measurement | odds-price | no-data | no-data | none |
| Guard | Oct4 default rule; pv2-d3 | piece-worth | fail | no-data | [evidence:worth-G-pv2](#evidence-worth-g-pv2) |
| Guard | king-adjacent f1 versus b1; guard-king-p | piece-worth | fail | no-data | [evidence:guard-king-p](#evidence-guard-king-p) |
| Guard | king-adjacent f1 versus b1; guard-king-p-d4m | piece-worth | fail | no-data | [evidence:guard-king-p-d4m](#evidence-guard-king-p-d4m) |
| Guard | king-adjacent f1 versus b1; guard-king-p-d4b | piece-worth | fail | no-data | [evidence:guard-king-p-d4b](#evidence-guard-king-p-d4b) |
| Guard | Oct4 default rule; pa-r1 | piece-captures | exempt | exempt | [evidence:pa-r1-G-captures](#evidence-pa-r1-g-captures) |
| Guard | Oct4 default rule; pa-r1 | piece-moves | pass | no-data | [evidence:pa-r1-G-moves](#evidence-pa-r1-g-moves) |
| Guard | no measurement | piece-phase | no-data | no-data | none |
| Guard | Oct4 default rule; pa-r1 | piece-use | fail | no-data | [evidence:pa-r1-G-use](#evidence-pa-r1-g-use) |
| Guard | Oct4 default rule; pa-r1 | piece-game | no-data | no-data | [evidence:pa-r1-G-draw-presence](#evidence-pa-r1-g-draw-presence), [evidence:pa-r1-G-white-presence](#evidence-pa-r1-g-white-presence), [evidence:pa-r1-G-length-presence](#evidence-pa-r1-g-length-presence) |
| Guard | Oct4 default rule; pa-r1 | piece-phase-4b | fail | no-data | [evidence:pa-r1-G-best-phase-4b](#evidence-pa-r1-g-best-phase-4b) |
| Guard | no measurement | odds-price | no-data | no-data | none |
| Maester | Oct4 default rule; pv2-d3 | piece-worth | pass | no-data | [evidence:worth-M-pv2](#evidence-worth-m-pv2) |
| Maester | Oct4 default rule; pa-r1 | piece-captures | pass | no-data | [evidence:pa-r1-M-captures](#evidence-pa-r1-m-captures) |
| Maester | Oct4 default rule; pa-r1 | piece-moves | pass | no-data | [evidence:pa-r1-M-moves](#evidence-pa-r1-m-moves) |
| Maester | no measurement | piece-phase | no-data | no-data | none |
| Maester | Oct4 default rule; pa-r1 | piece-use | pass | no-data | [evidence:pa-r1-M-use](#evidence-pa-r1-m-use) |
| Maester | Oct4 default rule; pa-r1 | piece-game | no-data | no-data | [evidence:pa-r1-M-draw-presence](#evidence-pa-r1-m-draw-presence), [evidence:pa-r1-M-white-presence](#evidence-pa-r1-m-white-presence), [evidence:pa-r1-M-length-presence](#evidence-pa-r1-m-length-presence) |
| Maester | Oct4 default rule; pa-r1 | piece-phase-4b | pass | no-data | [evidence:pa-r1-M-best-phase-4b](#evidence-pa-r1-m-best-phase-4b) |
| Maester | no measurement | odds-price | no-data | no-data | none |
| Beast | Oct4 default rule; pv2-d3 | piece-worth | pass | no-data | [evidence:worth-S-pv2](#evidence-worth-s-pv2) |
| Beast | Oct4 default rule; pa-r1 | piece-captures | pass | no-data | [evidence:pa-r1-S-captures](#evidence-pa-r1-s-captures) |
| Beast | Oct4 default rule; pa-r1 | piece-moves | pass | no-data | [evidence:pa-r1-S-moves](#evidence-pa-r1-s-moves) |
| Beast | no measurement | piece-phase | no-data | no-data | none |
| Beast | Oct4 default rule; pa-r1 | piece-use | pass | no-data | [evidence:pa-r1-S-use](#evidence-pa-r1-s-use) |
| Beast | Oct4 default rule; pa-r1 | piece-game | no-data | no-data | [evidence:pa-r1-S-draw-presence](#evidence-pa-r1-s-draw-presence), [evidence:pa-r1-S-white-presence](#evidence-pa-r1-s-white-presence), [evidence:pa-r1-S-length-presence](#evidence-pa-r1-s-length-presence) |
| Beast | Oct4 default rule; pa-r1 | piece-phase-4b | pass | no-data | [evidence:pa-r1-S-best-phase-4b](#evidence-pa-r1-s-best-phase-4b) |
| Beast | no measurement | odds-price | no-data | no-data | none |
| Ogre | Oct4 default rule; pv2-d3 | piece-worth | no-data | no-data | [evidence:worth-O-pv2](#evidence-worth-o-pv2) |
| Ogre | Oct4 default rule; pa-r1 | piece-captures | no-data | no-data | [evidence:pa-r1-O-captures](#evidence-pa-r1-o-captures) |
| Ogre | Oct4 default rule; pa-r1 | piece-moves | pass | no-data | [evidence:pa-r1-O-moves](#evidence-pa-r1-o-moves) |
| Ogre | no measurement | piece-phase | no-data | no-data | none |
| Ogre | Oct4 default rule; pa-r1 | piece-use | pass | no-data | [evidence:pa-r1-O-use](#evidence-pa-r1-o-use) |
| Ogre | Oct4 default rule; pa-r1 | piece-game | no-data | no-data | [evidence:pa-r1-O-draw-presence](#evidence-pa-r1-o-draw-presence), [evidence:pa-r1-O-white-presence](#evidence-pa-r1-o-white-presence), [evidence:pa-r1-O-length-presence](#evidence-pa-r1-o-length-presence) |
| Ogre | Oct4 default rule; pa-r1 | piece-phase-4b | no-data | no-data | [evidence:pa-r1-O-best-phase-4b](#evidence-pa-r1-o-best-phase-4b) |
| Ogre | no measurement | odds-price | no-data | no-data | none |
| Paladin | no measurement | piece-worth | no-data | no-data | none |
| Paladin | no measurement | piece-captures | no-data | no-data | none |
| Paladin | no measurement | piece-moves | no-data | no-data | none |
| Paladin | no measurement | piece-phase | no-data | no-data | none |
| Paladin | no measurement | piece-use | no-data | no-data | none |
| Paladin | nonPawn in historical no-Ogre pool; pal-with+pal-without | piece-game | fail | no-data | [evidence:paladin-pool-d3](#evidence-paladin-pool-d3) |
| Paladin | nonPawn in historical no-Ogre pool; pal-with-d4+pal-without-d4 | piece-game | no-data | no-data | [evidence:paladin-pool-d4](#evidence-paladin-pool-d4) |
| Paladin | no measurement | piece-phase-4b | no-data | no-data | none |
| Paladin | no measurement | odds-price | no-data | no-data | none |
| Card mode | no measurement | draws-first | no-data | no-data | none |
| Card mode | no measurement | white-parity | no-data | no-data | none |
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
| Haste | released; kp2-r18 | power-field | fail | no-data | [evidence:k18-Haste](#evidence-k18-haste) |
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
| HolyLight | no measurement | power-field | no-data | no-data | none |
| HolyLight | no measurement | light-dark | no-data | no-data | none |
| HolyLight | no measurement | draws-first | no-data | no-data | none |
| HolyLight | no measurement | white-parity | no-data | no-data | none |
| Mercy | no measurement | power-field | no-data | no-data | none |
| Mercy | no measurement | light-dark | no-data | no-data | none |
| Mercy | no measurement | draws-first | no-data | no-data | none |
| Mercy | no measurement | white-parity | no-data | no-data | none |
| DeathTouch | released; kp2-r18 | power-field | no-data | no-data | [evidence:k18-DeathTouch](#evidence-k18-deathtouch) |
| DeathTouch | released; dt-r0 | power-field | no-data | no-data | [evidence:dt-r0](#evidence-dt-r0) |
| DeathTouch | T2; dt-t2 | power-field | pass | no-data | [evidence:dt-t2](#evidence-dt-t2) |
| DeathTouch | released; dt-r0-d4 | power-field | fail | no-data | [evidence:dt-r0-d4](#evidence-dt-r0-d4) |
| DeathTouch | T2; dt-t2-d4 | power-field | pass | no-data | [evidence:dt-t2-d4](#evidence-dt-t2-d4) |
| DeathTouch | no measurement | light-dark | no-data | no-data | none |
| DeathTouch | no measurement | draws-first | no-data | no-data | none |
| DeathTouch | no measurement | white-parity | no-data | no-data | none |
| Darkness | king step; kp2-r16+kp2-r17 | power-field | no-data | no-data | [evidence:r17-Darkness](#evidence-r17-darkness) |
| Darkness | no measurement | light-dark | no-data | no-data | none |
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
| Card mode | no measurement | draws-first | no-data | no-data | none |
| Card mode | no measurement | white-parity | no-data | no-data | none |
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

The status is deliberately conditional on the version. far2 has a measured worth inside the piece band, but its capture ratio 1.55 [1.51, 1.60] fails the 1.5 limit. Old activity gives Rook and Guard use failures. Haste has a high historical field score. T2 scores near 50%, but an anchor schedule cannot certify all twelve powers together.

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

- Piece matrix, column B: The NEW column has no design properties. No worth is inferred.
- Card matrix, column B: The NEW column has no design properties. No worth is inferred.

## Pending evidence

| Run | State | Result | Dependent conclusion |
|---|---|---|---|
| deal-c4k | pending | none | Four-card deal and card interactions. |
| deal-d4k | pending | none | Six-card deal precision; does not substitute for four cards. |
| deal-nosalv2 | pending | none | Salvation removal on a second seed. |
| ab-guard-drop-any | pending | none | Guard drop anywhere against the king-adjacent start. |

## Ranked run proposals

These rows use QUEUE format. They are proposals only. The main queue is unchanged. Reconcile the pending files first. Pin an engine that implements the target before any launch. Each notebook estimate stays below nine hours. The recorded throughput is an estimate, not a guarantee. A matching completed pending run removes its proposed duplicate.

| id | machine / commit | command | games | result / decision rule |
|---|---|---|---:|---|
| 1. balance-target-activity-d3 | Kaggle: 20 shards, 5 notebooks a wave, 4 workers each; proposed source 7035b5e | `node tools/kaggle-tournament.mjs push --ref 7035b5e56c8de435d2e63dc02d47d7002bd54a6e --id balance-target-activity-d3 --shards 20 --first 19 -- --powers none --mirrorOnly --pairs 12000 --armies perPair --depth 3 --seed 8101 --rule archerShots=far2 --rule guardNextToKing=true` | 12000 | proposed; 94 min/notebook. Read all six criteria for target pool. Keep criteria 4 and 4b distinct. Mark exact full-target ordinary measurements. |
| 2. balance-target-powers-d3 | Kaggle: 5 shards, 5 notebooks, 4 workers each; proposed source 7035b5e | `node tools/kaggle-tournament.mjs push --ref 7035b5e56c8de435d2e63dc02d47d7002bd54a6e --id balance-target-powers-d3 --shards 5 --first 4 -- --powers Freeze,IceWall,Strike,Haste,Flight,Sacrifice,March,Leap,HolyLight,Mercy,DeathTouch,Darkness --pairs 40 --armies perPair --depth 3 --seed 8102 --rule archerShots=far2 --rule markFree=true --rule freezeUses=1 --rule hasteCaptures=false --rule strikePawns=false --rule strikeCaptures=false --rule mercyAura=true --rule mercyAuraPawnsTake=true --rule mercyTakesPawns=true --rule marchUses=0 --rule holyLightTakesPawns=true --rule holyLightShelter=true --rule holyLightShelterOrtho=true --rule darknessMoves=true --rule darknessKingStep2=true --rule deathTouchReach=true --rule deathTouchReachOrtho=true --rule deathTouchReachForwardBack=true --rule guardNextToKing=true` | 5280 | proposed; 165 min/notebook. Full round robin, not DeathTouch anchor. Test powers together with army intervals; report Spirit minus Shadow with interval. Haste is approved despite its known high score. |
| 3. balance-target-four-d3 | Kaggle: 10 shards, 5 notebooks per wave, 4 workers each; proposed source 7035b5e | `node tools/kaggle-tournament.mjs push --ref 7035b5e56c8de435d2e63dc02d47d7002bd54a6e --id balance-target-four-d3 --shards 10 --first 9 -- --powers cards4,none --mirrorOnly --mirror --pairs 3000 --armies perPair --depth 3 --seed 8103 --cardPool Freeze,IceWall,Strike,Haste,Flight,Sacrifice,March,Leap,Mimic,Vault,Curse,SkyLift,Salvation,Firewall,FirewallB,EarthQuake,EarthQuakeB,Burn,FireStarter,Control,Growth,GrowthB,Rally,Spawn2,SpawnK,SpawnK2,MorphP,MirrorB --rule archerShots=far2 --rule markFree=true --rule hasteCaptures=false --rule strikeCaptures=false --rule strikePawns=false --rule guardNextToKing=true` | 6000 | proposed; 240 min/notebook. Selected four-card hand vs none on same armies; no hand-size sweep. Report draw/White/turn differences and per-card association limits. |

**balance-target-activity-d3:** 600 games per shard at 6.4 games/min gives 94 min. This uses the slowest K18 shard: 1056 games in 165 min. The ordinary target can change throughput. The initial --first 19 command submits shard 19 only. Time it before later --only groups of at most five. First review pending data. Main 7035b5e implements pool QOLRRBBNNAAGMMS with Paladin and Ogre, far2 at 339 cp, and guardNextToKing=true. Pin that commit or a reviewed identical engine. Check its effective rules and pool stamp. Historical data do not certify this context. The initial command submits one representative shard. Check its time before more submissions. Keep each notebook below 9 h. Reduce the games per shard if needed. Submit later shards with the saved manifest and --only, in groups of at most five. These are proposals; no run has approval here.

**balance-target-powers-d3:** 1056 games per shard at 6.4 games/min gives 165 min. This uses the slowest K18 power shard. The target pool and Guard setup can change throughput. The initial --first 4 command submits shard 4 only. Time it before a later --only group of at most four. First review pending data. Main 7035b5e implements pool QOLRRBBNNAAGMMS with Paladin and Ogre, far2 at 339 cp, and guardNextToKing=true. Pin that commit or a reviewed identical engine. Check its effective rules and pool stamp. Historical data do not certify this context. The initial command submits one representative shard. Check its time before more submissions. Keep each notebook below 9 h. Reduce the games per shard if needed. Submit later shards with the saved manifest and --only, in groups of at most five. These are proposals; no run has approval here.

**balance-target-four-d3:** 600 games per shard at 2.5 games/min gives 240 min. This uses deal-d2 six-card depth 3 throughput. The four-card target can change throughput. The initial --first 9 command submits shard 9 only. Time it before later --only groups of at most five. First review pending data. Main 7035b5e implements pool QOLRRBBNNAAGMMS with Paladin and Ogre, far2 at 339 cp, and guardNextToKing=true. Pin that commit or a reviewed identical engine. Check its effective rules and pool stamp. Historical data do not certify this context. The initial command submits one representative shard. Check its time before more submissions. Keep each notebook below 9 h. Reduce the games per shard if needed. Submit later shards with the saved manifest and --only, in groups of at most five. These are proposals; no run has approval here. Skip this proposal if deal-c4k already supplies this exact target. The explicit 28-card pool is the tested deal (deal-d1 + MirrorB). It does not adopt Salvation. Record the final pool choice before launch.

## Open owner choices and proposed changes

1. Keep criterion 4 as the current rule, or approve 4b. The present test cannot fail. Pick: 4b for review; retain 4 until approval.
2. Confirm the common-card band and numeric equality margins. The current band is 0.7–3 pawns. Light–Dark and global White equality have no numeric margin. Pick: approve margins before a formal adoption verdict.
3. Reconcile the matrix gaps and the stale six-card workbook cell. Main now has the 9 October piece and power choices. Pick: use this audit to update the design records; do not change game behavior.
4. Resolve the final deal and Salvation after pending evidence arrives. Pick: keep all pending results unset. The four-card deal must supply its own data.
5. Keep the approved rule choices while the target checks are incomplete. far2 capture share and old Haste strength remain measured concerns. Pick: request the ranked target checks before another balance change.

## Source conflicts and stale evidence

- **target-vs-shipped:** Main 7035b5e implements far2 with ARCHER_V339, king-adjacent Guard, Paladin alongside Ogre in QOLRRBBNNAAGMMS, and official T2. QUEUE records the approved four-card hand. Card mode remains lab-only. No selected report measures the full current target combination. [rules](../RULES.md#L19), [defaults](../../src/rules/setup.ts#L9), [released-powers](../../src/rules/rules.ts#L799), [current-eval](../../src/ai/eval.ts#L69), [queue-four-card-approval](../QUEUE.md#L333), [owner-build-ticket](../specs/owner-decisions-2026-10-09/issues/01-build-the-decisions.md#L1)
- **workbook-residue:** Dated Oct 9 approval wins over earlier residue in the same workbook cells: Pieces F8/V8 (far2), J9 (Guard), F13 (Paladin); King powers G12/AI12 (T2). Current RULES decisions 20, 21, 23, 24 and code implement these choices. Workbook Rules D18 closes the hand-size question; QUEUE deal-c4k supplies the later owner quote: yes. 4 cards. [workbook](../balance/workbook.json), [rule-far2](../RULES.md#L211), [rule-guard-next](../RULES.md#L216), [rule-paladin-return](../RULES.md#L225), [rule-t2](../RULES.md#L229), [queue-four-card-approval](../QUEUE.md#L333)
- **pool-version:** Criteria/pa-r1 describe the historical 15-letter two-Beast pool QORRBBNNAAGMMSS. Current main 7035b5e uses the 15-letter one-Beast pool QOLRRBBNNAAGMMS with Paladin beside Ogre. The intermediate 14-letter pool QORRBBNNAAGMMS has no Paladin. pa-r1 has no pool stamp. Do not certify the current target with pa-r1. [criteria](../research/piece-balance-criteria-2026-10-03.md#L11), [activity](../research/piece-runs-2026-10-04-pa-r1.md#L8), [rules](../RULES.md#L19), [defaults](../../src/rules/setup.ts#L9)
- **obsolete-prices:** SIM-PLAN seeds and early 5.05 Archer worth are historical. Pass 2 uses a lower Rook anchor. Current main 7035b5e prices far2 at 339 cp from the converged 3.39-pawn match; that engine seed is not new full-target evidence. Workshop labels Fair through 5.0; pool criterion 1 allows 5.5. These are distinct thresholds. [value-method](../SIM-PLAN.md#L119), [values-d3](../research/piece-runs-2026-10-04-pv2-d3.md#L27), [values-a3](../research/piece-runs-2026-10-04-pv2-A-vsR-d3.md#L21), [workshop](../WORKSHOP.md#L61), [current-eval](../../src/ai/eval.ts#L69)
- **card-calibration:** Cards use carried 64 Elo/pawn with about 25% calibration uncertainty. Piece passes measure 70±11 d3 and 92±13 d4. Do not replace card calibration across depths silently. [cards-method](../research/cards-2026-10-03.md#L438), [values-d3](../research/piece-runs-2026-10-04-pv2-d3.md#L27), [values-a4](../research/piece-runs-2026-10-04-pv2-A-vsR-d4.md#L22)
- **no-effect-is-not-equivalence:** Use full intervals for pass/fail. No significant rise does not establish no draw drag or equality. Noninferiority margins for global draws and absolute White parity remain unknown. [criteria-method](../research/piece-balance-criteria-2026-10-03.md#L25), [powers-method](../research/kings-powers-balance-2026-10-02.md#L89), [draw-priority](../tasks-archive/2026-09.md#L447)
- **remote-gap:** M1 read-only inventory fails: macbook-pro-2.local does not resolve. Local copied reports are usable; remote-only reports and raw completeness remain unverified. No remote jobs are touched. [queue-latest](../QUEUE.md#L300)
- **pending-runs:** deal-c4k, deal-d4k, deal-nosalv2 and ab-guard-drop-any remain pending here. Their data still need review. Do not infer completion from queued row, filename or planned count. [queue-latest](../QUEUE.md#L300)

## Matrix and schema audit

| Code | Source | Approval | Finding |
|---|---|---|---|
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.archerChecks; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.beastChains; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.guardImmune; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.guardCaptures; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.guardStep; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.guardDoubleFirst; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.guardNoSecondRank; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.guardNextToKing; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.guardReserve; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.guardCaptureLimit; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.archerMove; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.archerShots; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.beastMove; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.beastCapture; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.beastCaptureForward; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.maesterLongSwap; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.maesterKingSwapAnywhere; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.maesterSwapAny; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.maesterSwapEnemy; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.maesterStep; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.paladinChecks; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.deathTouchMoves; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.paladinReturn; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.paladinJumpsFriends; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.paladinBlockedByEnemies; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.ogreHop; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.ogreStep2; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.ogreNoCapture; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.ogreShoveFriends; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.strikeMode; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.strikeCaptures; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.freezeUses; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.iceWallUses; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.hasteSecond; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.hasteCaptures; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.hasteApart; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.hasteNoThreat; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.hasteNoForward; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.hasteNoCheck; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.freezeQuiet; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.mercyCaptures; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.mercyAura; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.strikePawns; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.holyLightTakesPawns; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.holyLightAura; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.darknessKeep; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.holyLightKnights; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.holyLightShelter; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.holyLightShelterOrtho; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.mercyAuraOrtho; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.mercyAuraPawns; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.mercyAuraPawnsTake; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.mercyTakesPawns; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.mercyNoJump; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.darknessMoves; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.darknessTakeAhead; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.darknessStepDiag; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.darknessShelter; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.darknessShelterPawnsTake; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.darknessPawnArmor; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.darknessAuraPawns; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.darknessKingStep2; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.darknessKingStepSafe; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.darknessKingStepTakes; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.deathTouchReach; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.deathTouchReachOrtho; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.deathTouchReachNoBack; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.deathTouchReachForwardBack; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.deathTouchReachPieces; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.strikeUses; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.hasteUses; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.flightUses; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.sacrificeUses; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.marchUses; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.leapUses; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.reaverStep; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.piles; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.bishopsOppositeColours; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.fiftyMove; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.threefold; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ABSENT_FROM_MATRIX | src/rules/rules.ts: Rules.insufficientMaterial; docs/MATRIX.md | lab | This code rule flag has no named matrix axis or reading. |
| RULE_ALIAS_ABSENT_FROM_MATRIX | src/rules/rules.ts: parseRule(kingWhite); docs/MATRIX.md | lab | This CLI rule flag is absent from the matrix. |
| RULE_ALIAS_ABSENT_FROM_MATRIX | src/rules/rules.ts: parseRule(kingBlack); docs/MATRIX.md | lab | This CLI rule flag is absent from the matrix. |
| STALE_MATRIX_STATUS | docs/MATRIX.md: Status 2026-09-16; C.2 | approved | The introduction says six powers and every card are not built. C.2 and the source show they are built. |
| STALE_RULES_STATUS | docs/RULES.md: introduction; §4 | approved | The introduction labels powers as lab rules. Section 4 records the official shipped mode. |
| STALE_MATRIX_POOL | docs/MATRIX.md A.3; docs/RULES.md §2; src/rules/setup.ts POOL | approved | A.3 lists the old pool without the Paladin. The current pool is QOLRRBBNNAAGMMS. |
| MATRIX_MORPH_READING_GAP | docs/MATRIX.md C.2 Morph; docs/RULES.md §6 decisions 23, 25; src/rules/engine.ts MORPH_TYPES | lab | The matrix result list omits Paladin and the second-Guard limit. The current code includes both. |
| MATRIX_CONDITION_GAP | docs/MATRIX.md C.1 Has a condition; D.1 | lab | C.1 omits piece lost, material behind and own last mark. D.1 uses them. The typed condition axis retains all three. |
| MATRIX_NULL_TURN_COST_GAP | docs/MATRIX.md C.1 Turn cost; C.2 Holy Light, Mercy, Death Touch, Darkness | approved | Always-on powers have no turn cost. C.1 does not list this value. |
| MATRIX_COPY_GAP | docs/MATRIX.md C.1; C.2 Mirror, MirrorB | lab | The copy rows inherit turn cost, captures, targets and duration. The corresponding C.1 axes do not allow inherited values. |
| MATRIX_CAPTURE_STAGE_GAP | docs/MATRIX.md C.1 Captures; C.2 RageB | lab | One may/must/never value cannot express may on the first move and must on the second. |
| MATRIX_TARGET_DOMAIN_GAP | docs/MATRIX.md C.1 Targets; C.2 Growth, Rescue, Spawn | lab | The own/enemy/either axis does not state target kinds: pile, prior mark and empty square. |
| MATRIX_DURATION_GAP | docs/MATRIX.md C.1 Duration; C.2 Rescue | lab | Rescue renews an earlier mark for one more turn. Instant/next-turn/always does not express renewal. |
| FLIGHT_ABILITY_CONFLICT | docs/MATRIX.md A.1 1b; C.2 Flight; RULES.md §4 Flight | approved | A.1 calls Flight arriving. C.2 correctly says it moves an existing piece. The effect record keeps specialMove. |
| KING_MOVEMENT_RULE_CONFLICT | docs/RULES.md §4; docs/MATRIX.md C.2 March, Darkness | approved | The rule says no king power changes how other pieces move. March and Darkness change pawn movement. An owner decision must resolve the rule scope. |
| VERSION_ABSENT_FROM_MATRIX | workbook:Pieces!K8; docs/MATRIX.md A.0–1; src/rules/rules.ts ArcherShots | rejected | Over2 has no matrix reading. It is a current code lab choice. |
| VERSION_ABSENT_FROM_MATRIX | workbook:Pieces!O8; docs/MATRIX.md A.0–1; src/rules/rules.ts ArcherShots | rejected | Over23 has no matrix reading. It also has no current code rule choice; its source is claude/archer-reach:rules.ts. |
| VERSION_NOT_MAPPED | workbook:Pieces!C17 | dropped | Squire, Base: the workbook has no complete typed mapping. Reserve piece from the recovered Cursor experiment. |
| WORKBOOK_HAND_SIZE_CONFLICT | owner prompt; workbook:Rules!C18; workbook:Cards!E2 | approved | The owner selects four cards (docs/QUEUE.md deal-c4k). The workbook still states six. Code hands stays variable; card mode stays in the lab. |
| WORKBOOK_BEAST_LIMIT_CONFLICT | workbook:Rules!C5; workbook:Pieces!N9; docs/MATRIX.md C.2 Morph | approved | Rules says never two Beasts. The later owner note allows a second Beast through Morph and then Salvation or Sacrifice. |

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
| Squire | Base | Dropped | Pieces!C17 | no mapping; see audit |
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
**evidence:far2-noadj-worth** — Archer, far2. piece worth: 3.39 pawns. Interval: 3.12 to 3.66 (95%). Sample: 1000. Depth: 3. Run: pv-A-af2na-n2. Second converged pass vs Knight. Previous pass 3.35±.27. Played to end. Different anchor and seeds from one-pass Rook 2.83; not an adjudication effect. [queue-latest](../QUEUE.md#L300)

<a id="evidence-far2-d4-worth"></a>
**evidence:far2-d4-worth** — Archer, far2. piece worth: 3.22 pawns. Interval: 2.88 to 3.56 (95%). Sample: 600. Depth: 4. Run: pv-A-af2-vsR-d4. One pass vs Rook, pawn calibration 70±14 Elo from 1800 games. Separate from full NEW target. [queue-latest](../QUEUE.md#L300)

<a id="evidence-far2-d4-captures"></a>
**evidence:far2-d4-captures** — Archer, far2. capture ratio: 1.55 ratio. Interval: 1.51 to 1.6 (95%). Sample: 1600. Depth: 4. Run: pa-af2-d4. Same first 1600 armies as pa-d4. Still above criterion 2 cap 1.5. Moved in 99.4% of games is not criterion 5 per-piece use. [queue-latest](../QUEUE.md#L300)

<a id="evidence-guard-king-p"></a>
**evidence:guard-king-p** — Guard, king-adjacent f1 versus b1. placement worth gain: 0.53 pawns. Interval: 0.39 to 0.67 (95%). Sample: 4000. Depth: 3. Run: guard-king-p. RNBQKGNR against RGBQKNNR. Normal classic start, Guard f1 vs b1. It does not test all random Guard-neighbour placements. [guard](../research/guard-strategies-2026-10-06.md#L122), [queue-latest](../QUEUE.md#L300)

<a id="evidence-guard-king-p-d4m"></a>
**evidence:guard-king-p-d4m** — Guard, king-adjacent f1 versus b1. placement worth gain: 0.54 pawns. Interval: 0.35 to 0.73 (95%). Sample: 2000. Depth: 4. Run: guard-king-p-d4m. RNBQKGNR against RGBQKNNR. Normal classic start, Guard f1 vs b1. It does not test all random Guard-neighbour placements. [guard](../research/guard-strategies-2026-10-06.md#L122), [queue-latest](../QUEUE.md#L300)

<a id="evidence-guard-king-p-d4b"></a>
**evidence:guard-king-p-d4b** — Guard, king-adjacent f1 versus b1. placement worth gain: 0.58 pawns. Interval: 0.44 to 0.72 (95%). Sample: 4000. Depth: 4. Run: guard-king-p-d4b. RNBQKGNR against RGBQKNNR. Normal classic start, Guard f1 vs b1. It does not test all random Guard-neighbour placements. [guard](../research/guard-strategies-2026-10-06.md#L122), [queue-latest](../QUEUE.md#L300)

<a id="evidence-kd-rand"></a>
**evidence:kd-rand** — Guard, king-adjacent threat position. Guard defence worth gain vs no Guard: 2.82 pawns. Interval: 2.63 to 3.01 (95%). Sample: 24000. Depth: 3. Run: kd-rand. Selected threat-position context, not starting piece price. kd-real2 has 1500 positions; source-game clusters may repeat. kd-real is weak: only 38 source positions, not read. [guard](../research/guard-strategies-2026-10-06.md#L122), [queue-latest](../QUEUE.md#L300)

<a id="evidence-kd-rand-d4"></a>
**evidence:kd-rand-d4** — Guard, king-adjacent threat position. Guard defence worth gain vs no Guard: 2.86 pawns. Interval: 2.59 to 3.13 (95%). Sample: 6000. Depth: 4. Run: kd-rand-d4. Selected threat-position context, not starting piece price. kd-real2 has 1500 positions; source-game clusters may repeat. kd-real is weak: only 38 source positions, not read. [guard](../research/guard-strategies-2026-10-06.md#L122), [queue-latest](../QUEUE.md#L300)

<a id="evidence-kd-real2"></a>
**evidence:kd-real2** — Guard, king-adjacent threat position. Guard defence worth gain vs no Guard: 1.05 pawns. Interval: 0.81 to 1.29 (95%). Sample: 12000. Depth: 3. Run: kd-real2. Selected threat-position context, not starting piece price. kd-real2 has 1500 positions; source-game clusters may repeat. kd-real is weak: only 38 source positions, not read. [guard](../research/guard-strategies-2026-10-06.md#L122), [queue-latest](../QUEUE.md#L300)

<a id="evidence-paladin-pool-d3"></a>
**evidence:paladin-pool-d3** — Paladin, nonPawn in historical no-Ogre pool. White score pool difference: 6.22 points. Interval: 3.26 to 9.19 (95%). Sample: 4000. Depth: 3. Run: pal-with, pal-without. 40 ranks per arm; 0 shared ranks; old QLRRBBNNAAGMMSS vs QRRBBNNAAGMMSS, no Ogre. Rank-clustered CI. Different from NEW pool. [paladin](../research/sim-paladin-pool-2026-09-17.md#L64)

<a id="evidence-paladin-pool-d4"></a>
**evidence:paladin-pool-d4** — Paladin, nonPawn in historical no-Ogre pool. White score pool difference: 3.81 points. Interval: -0.22 to 7.84 (95%). Sample: 1600. Depth: 4. Run: pal-with-d4, pal-without-d4. Rank-clustered interval includes 0. Paladin subset +6.63[.75, 12.50]. Historical pool risk, not a current-target failure. [paladin](../research/sim-paladin-pool-2026-09-17.md#L64)

<a id="evidence-k18-haste"></a>
**evidence:k18-Haste** — Haste, released. score vs powers: 58.3 percent. Interval: 55 to 61.6 (95%). Sample: 880. Depth: 3. Run: kp2-r18. Released powers incl Mercy M2/Darkness king step; 66 matchups/5280 games/2640 armies total. Both flagged by simultaneous test. Haste stays by owner decision. [queue-k18](../QUEUE.md#L267)

<a id="evidence-k18-deathtouch"></a>
**evidence:k18-DeathTouch** — Death Touch, released. score vs powers: 55.1 percent. Interval: 52.2 to 58 (95%). Sample: 880. Depth: 3. Run: kp2-r18. Released powers incl Mercy M2/Darkness king step; 66 matchups/5280 games/2640 armies total. Both flagged by simultaneous test. Haste stays by owner decision. [queue-k18](../QUEUE.md#L267)

<a id="evidence-r17-darkness"></a>
**evidence:r17-Darkness** — Darkness, king step. score vs powers: 47.8 percent. Interval: 45.8 to 49.8 (95%). Sample: unknown. Depth: 3. Run: kp2-r16, kp2-r17. Pooled field with king step. Historical package, not NEW; report gives 1144 pairs for paired gain. [powers-r17](../research/kings-powers-balance-2026-10-02.md#L649)

<a id="evidence-r17-light-dark"></a>
**evidence:r17-light-dark** — Spirit minus Shadow, Mercy M2 and Darkness king step. Spirit minus Shadow: -0.8 points. Interval: -2.7 to 1.1 (95%). Sample: unknown. Depth: 3. Run: kp2-r16, kp2-r17. King step package. Contains 0; no pre-set equality margin. [powers-r17](../research/kings-powers-balance-2026-10-02.md#L649)

<a id="evidence-dt-r0"></a>
**evidence:dt-r0** — Death Touch, released. DeathTouch score vs powers: 55.4 percent. Interval: 53.4 to 57.4 (95%). Sample: 1760. Depth: 3. Run: dt-r0. Anchor DeathTouch against other 11; fresh army per pair, seed 1919. Other powers have only 1/11 of anchor exposure; their field rows do not certify a round robin. [queue-latest](../QUEUE.md#L300), [t2-raw](../../sim/out/m1/king-down-guard/dt-t2.report.md)

<a id="evidence-dt-t2"></a>
**evidence:dt-t2** — Death Touch, T2. DeathTouch score vs powers: 49.3 percent. Interval: 47.2 to 51.4 (95%). Sample: 1760. Depth: 3. Run: dt-t2. Anchor DeathTouch against other 11; fresh army per pair, seed 1919. Other powers have only 1/11 of anchor exposure; their field rows do not certify a round robin. [queue-latest](../QUEUE.md#L300), [t2-raw](../../sim/out/m1/king-down-guard/dt-t2.report.md)

<a id="evidence-dt-r0-d4"></a>
**evidence:dt-r0-d4** — Death Touch, released. DeathTouch score vs powers: 57.3 percent. Interval: 56 to 58.6 (95%). Sample: 4400. Depth: 4. Run: dt-r0-d4. Anchor DeathTouch against other 11; fresh army per pair, seed 1919. Other powers have only 1/11 of anchor exposure; their field rows do not certify a round robin. [queue-latest](../QUEUE.md#L300), [t2-raw](../../sim/out/m1/king-down-guard/dt-t2.report.md)

<a id="evidence-dt-t2-d4"></a>
**evidence:dt-t2-d4** — Death Touch, T2. DeathTouch score vs powers: 51.1 percent. Interval: 49.8 to 52.4 (95%). Sample: 4400. Depth: 4. Run: dt-t2-d4. Anchor DeathTouch against other 11; fresh army per pair, seed 1919. Other powers have only 1/11 of anchor exposure; their field rows do not certify a round robin. [queue-latest](../QUEUE.md#L300), [t2-raw](../../sim/out/m1/king-down-guard/dt-t2.report.md)

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
