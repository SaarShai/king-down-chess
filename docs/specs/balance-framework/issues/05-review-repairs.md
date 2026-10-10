# Verify and repair the independent review

Type: task
Status: complete

Owner: verify the remaining findings and fix confirmed issues; keep runs going; no commit or merge.

## Plan and acceptance

1. Check A1–A14 and B1–B7 against source and data. Record each disposition here.
2. Repair incorrect historical verdicts and source checks. Keep open design choices open.
3. Add an explicit, checked campaign import and real input-to-report tests. Keep classic odds,
   pool activity, power field and dealt cards as separate populations. Refuse altered or
   incomplete provenance. Never upgrade raw game-level intervals into decision intervals.
4. Rebuild artifacts. Run npm test and the strict balance check. Keep the approved campaign
   running on its frozen source. Do not change prices, game rules, or simulation inputs.

The independent report is in main sim/out/balance-target-20261009/independent-review/review.md.

## Findings checked

| Finding | Result and repair |
|---|---|
| A1 | Confirmed. The explicit campaign importer checks archive, source files, local analysis dependencies, specs, regenerated schedules, stamps, raw hashes and complete counts. It imports the worth calibration and supplies criterion-tagged activity, outcome and joint power rows. Partial tournaments stay pending. |
| A2 | Confirmed. Placement and defence gains are `worthDifference`; they cannot enter total piece worth. |
| A3 | Confirmed. Worth checks require scale uncertainty. Historical piece reports can supply a source-error envelope. Missing calibration remains no-data for pieces and cards. |
| A4 | Confirmed. Spirit and Shadow powers are exempt from the ordinary field band. Field decisions require simultaneous army intervals. K18 Haste is 58.3 ± 4.8: it crosses 54, so it is not a band failure. The report from commit 101130c is saved. |
| A5 | Confirmed. Every status records paralysis, conditions and interactions. Missing measures stay empty and explicit. The campaign activity path measures the fraction of piece instances that never move; value alone supplies none of these measures. |
| A6 | Confirmed. The typed pool follows POOL; the audit pins the approved pool and prices. Workbook Rules C2 now names the pool with Paladin, and D2 no longer says it is being built. |
| A7 | Confirmed. Context records commitSource and stampSource. A queue-derived commit cannot certify a target. |
| A8 | Confirmed but latent in the old mirror-only sample. Stopped non-mirror shards select by pair ID. An uneven three-shard fixture checks both colours and the selected count. |
| A9 | Confirmed. Campaign builds require explicit source roots and read the main queue. The dataset and status store an input digest for sources, queue, status records, campaign provenance, workbook, evidence and target registry. |
| A10 | Confirmed. Spirit-minus-Shadow and cards4 evidence link to their status rows. An open equality margin still prevents an adoption verdict. |
| A11 | Confirmed. Game-level report errors cannot enter a decision. Named army, pair and calibrated envelope errors can. |
| A12 | Confirmed. Guard capture is exempt when checking proposal coverage. The completed worth parent is recorded and joins across its checked calibration arms; it does not request a second pass. Four-card length uses the actual paired plies measure. |
| A13 | Confirmed. Strict check compares both the xlsx hash and extracted cells with workbook.json. |
| A14 | Confirmed. Current claims use derived statuses. Historical examples retain their named context. Coverage and status record the input digest. |
| B1 | Confirmed. The old Paladin pool contrast is not criterion 6. It remains descriptive evidence and does not fail that criterion. |
| B2 | Confirmed from the saved K18 joint interval, not the review's approximate width. |
| B3 | Confirmed. Stored A/B draw rates exclude ply caps. The importer now records that denominator for every such report, not only one Guard run. |
| B4 | Confirmed. Worth arms are classic knight substitutions; the pool stamp cannot make them random-pool tests. |
| B5 | Confirmed. Card targets name depth, explicit cardPool and the hash of all effective per-game rules. Regenerated gameSpec hands come from the checked frozen code. |
| B6 | Confirmed. Target provenance includes the source archive hash, including src/game.ts. The analysis refuses changed engine dependencies. |
| B7 | Confirmed. Coverage groups source errors by reason and retains each affected path in the ledger. The selected main-root snapshot has 88 metadata files without a run spec; these cannot supply results. |

The review's suggested field renames and new rule checks are design choices. They are not
needed for these repairs. The approved Beast and movement rules stay unchanged. The local
calibration envelope is not a joint confidence interval. No fixed-point price update is approved.
The compressed raw ledger hash is labelled as a decoded-stream hash; the copy manifest uses file bytes.

## Verification

The final npm test run passes: 1,526 tests, 13 skipped, plus 42 artwork checks.
The strict audit passes: 97 rule axes, 110 workbook versions, no errors or warnings.
The final rebuild reads 14,817 sources and 881 run IDs, producing 13,660 measurements.
The saved M1 copy check verifies 6,966 files with no gaps. The campaign importer adds
seven calibrated worth rows; the completed worth proposal is removed. All ten approved
study contexts are registered. Partial studies remain pending.

Input digest: `6ce460183cf453a333bc0c6a10819f66563fa513998c0f38fdb6cc21fc116e89`.

Workbook ZIP comparison proves only Rules C2/D2 change; all other entries match byte
for byte. The rendered sample has been checked. git diff --check passes. Test/build logs,
report artifacts and their hashes are copied to the main campaign framework-review folder.
The queue input is saved before its report-integration status changes.

Campaign ticket 04 remains open. No price, rule or simulation input changes. No commit,
merge or deployment. The next monitor check remains 01:58 Pacific.
