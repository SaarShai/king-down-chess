# Adopt completed repairs and locomotion

Status: in-progress

## Plan

1. Independently audit Batch1 (17 Rook/Beast repairs) and Batch2 (18 Guard/Frost/Flame turns) in parallel. Record exact current catalog hashes, replacement manifests, preservation and playback evidence. Complete the five Rook continuous-playback gaps and explicitly check the uncropped Beast rest authority and adjoining clips.
2. Import only verified replacements into a temporary immutable store. Under the shared catalog lock, replace only exact expected old selections, preserving all unrelated entries, prior decisions and source files. Retain prior catalogs. Never promote failed or draft candidates by assertion.
3. Repin accepted runtime banks, rebuild and verify the package, preserve its MAIN copy, and independently check joins, both armies, four-background alpha, effects, cancellation and Undo. Merge code through reviewed PRs; no deployment.
4. Monitor Batch3 without restarting or duplicating its active lanes. After its final handoff, verify accepted locomotion, authorized endpoints and matching exports, then adopt using the same immutable process and add runtime movement support as required. Drafts remain excluded.

## Verification

Expected-old-hash replacement gates; no lost catalog entries or prior evidence; source hashes unchanged; exact endpoints/timing/pivots; native and board-size playback on light/dark/checker/board; transparent exports; meaningful focused npm tests and registered game checks; independent review and CI before merge.

## Checkpoint

The 433-bank integration is merged and verified at 1bfa33ea. Batch3 is active and has no final adoption handoff yet. Two read-only repair audits are active; scratch results belong in .codex-runs/batch-adoption/. No repair bank has been published or claimed accepted in this phase. Ten newly failed Queen/Beast clips remain excluded and are outside these 35 repair packages. King attack concept choices remain with the owner.

## Replacement tool plan

1. Freeze only the input report entries in a temporary store with the existing consolidator. Require ready source and audit status, no known defects, and local evidence records with exact SHA-256 hashes.
2. Under the common catalog lock, require one selection with the old ID and its exact expected bank hash. IDs can repeat across characters; the pair must select one row. Compare all seven identity fields. Preserve the old catalog ID, the candidate bank ID and source hash, all unrelated rows, reports and prior review files.
3. Freeze the candidate assets, source records, evidence and old/new catalog snapshots. Replace the catalog selector atomically. On replay, verify the selected bank, PNGs and provenance before returning unchanged.
4. Add one fixture test through `npm test`. Check successful replacement and review preservation, stale and duplicate targets, identity/status/defect/evidence gates, unchanged source pixels and replay corruption. No production report import, package build or deployment belongs to this code change.

The command contract is `python3 -B tools/replace_animation_selections.py --catalog /path/to/manifest.json --inputs verified-report.json ...`. Each normal audit row adds `expectedOldId`, `expectedOldBankSha256` and `evidence: [{"path": "/path/to/proof", "sha256": "..."}]`. Relative evidence paths use the report folder. The report supplies verified identity fields when the source bank omits them; it does not alter the source bank.

## Replacement tool checks

`KINGDOWN_TEST_FILE=tools/animation-replacement.test.ts npm test` passes type checks, one focused fixture test and the 67 existing node checks. This is not a full-suite pass. The fixture checks repeated catalog IDs with distinct bank hashes, concurrent replacements, all seven identity gates, stale and duplicate targets, source and audit ready status, known defects, evidence hashes, PNG hashes and alpha. It also checks exact source bytes, prior review files, retained unrelated rows and report records, old/new catalog snapshots, and replay rejection after frozen bank, PNG, source, report or evidence corruption or loss.

The tool changes only the exact selected rows. It keeps candidate bank IDs in their immutable banks and in each selection's `replacement.candidateId`; the catalog keeps its prior IDs. A replay requires the same candidate row and verifies its frozen file closure before it returns unchanged. Explicit source identity fields must agree with the normalized audit row before report fallback; missing fields remain allowed. Guard turn banks may use the exact verified `from-to` edge label as their legacy action. The fixture rejects a conflicting source character, army or other identity even when the report supplies the expected old identity, and retains the Guard edge label without changing the source bank. This fixes the identity masking found in independent review.

No real repair report has run through this command. Final independent code recheck remains with the parent task. The generated runtime package remains present, with manifest SHA-256 `24e7af85463b87c84b50334a07d513d0bc2942fd04ad90d6fd16860dd13e8064`.

## Batch2 runtime plan

The parent accepts the identity fix after independent review and publishes the 18 ready Batch2 rows. Catalog SHA-256 is `e9f83cb19760917dda923d5e1b9064a521b923dc859d9fa1bea9be693770872f`: 451 ready, 29 repairs, 262 drafts and 6 missing studies. All 730 unrelated rows remain unchanged. The source audit and import records remain in the parent's `.codex-runs/batch-adoption/` folder; the import adds explicit verified asset roots without changing the audit.

1. Pin all 451 ready selections from that exact catalog. Preserve every prior ready selection and exclude all remaining repair, draft and missing rows.
2. Build the worktree package with the existing exporter. Preserve the MAIN 433-bank package until the parent verifies the new bundle. Record the new package inventory and manifest hash.
3. Run focused replacement, runtime, package and scene tests, then the registered `character-runtime` and `effects-states` browser checks. Check the repaired turn edges and joins for both armies in the actual runtime.
4. Record evidence and limits, commit and push this branch, and open a pull request to `staging/first-game`. CI remains pending until it reports. The parent owns final bundle review, MAIN package copy and merge. No deployment belongs to this phase.
