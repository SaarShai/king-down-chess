# Offer the legal part of a saved game

Type: task
Status: resolved

## Owner decision

The owner selects option 3 for local saves on 2026-10-26. Offer the legal part after a rules change. Keep the full source until the player accepts the recovered game or starts a New game.

## Cause

The engine stops at the first illegal action. The save reader requires all actions to play. The page then blocks play and saves. Cloud restore uses the same check.

## Plan and checks

1. Add tests for partial replay, the recovery offer, save gates, and cloud order. Run the focused tests on the old code. Record the failures.
2. Keep the legal part on the board. Use the page notice, live region, and a button. Clear the old result and staged turn. Keep the full source until acceptance.
3. Check the source again on acceptance. Apply the same path to cloud saves. Keep newer local and cloud games.
4. Run the three focused test files in one command. Run the doc checks. Review the diff and commit on this branch.

The checks must cover zero legal actions, a partial multi-action turn, failed storage writes, a changed local source, and a newer cloud copy. No full suite, server change, rule change, dependency, push, merge, or deploy is in scope.

## Evidence

- Red: `KINGDOWN_TEST_FILE='src/{screen/play,screen/save,account/sync}.test.ts' npm test`. The old code has 12 failures and 136 passes. Eleven failures show missing recovery. One test compares an array with a test-only method; that assertion is corrected. An earlier fixture type fault is also corrected before this run.
- Red, upload race: `KINGDOWN_TEST_FILE=src/screen/play.test.ts KINGDOWN_TEST_NAME='cloud change during recovery upload' npm test`. Both cases fail before the sync-time repair.
- Red, local order and reload: `KINGDOWN_TEST_FILE=src/screen/play.test.ts KINGDOWN_TEST_NAME='arrives during the recovery cloud read|same time after a reload' npm test`. Both cases fail before recovery state moves into the sync record.
- Green: `KINGDOWN_TEST_FILE='src/{screen/play,screen/save,account/sync}.test.ts' npm test`. All 154 tests in three files pass. Both type checks and all 67 art checks pass.

## Change

The save reader returns the legal part and keeps the full source. The page shows the action count in its notice and live region. Two buttons offer Use recovered game and New game. Acceptance checks the source again. It clears the old resignation and staged count. A partial Haste turn uses the existing legal pass. Failed writes keep the offer and the source.

Cloud downloads can offer a partial copy. Cloud uploads still require a complete replay. Acceptance gives the recovered copy a time one step above its source. The server keeps a newer copy, including one with that same time. The existing sync record keeps the recovery source time through a reload. A later local change clears it. No save format version, migration, server change, or game rule changes.

## Review

The repair uses the existing replay, save gates, notices, and account merge. Tests cover zero legal actions, the Freeze and Ice Wall examples, Haste, storage failure, local replacement, cloud order, a concurrent cloud write, and reload. `npm run test:docs` passes: 180 tests in 15 files. `npm run check:browser new-game` passes in 59.4 seconds. Its build passes. The new browser cases check keyboard choices, focus on the board after acceptance, the live notice, full source retention, and reload. They check 1280 × 900, 390 × 844, and 844 × 390. The phone and landscape images also pass visual review.

Browser evidence: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/save-recovery-CwRmVn/`. Focused logs stay in the local `dist/save-recovery-evidence/` folder.

The final review finds no rule, dependency, server, or migration change. The recovery source time belongs to the existing sync record, not to the game format. The source check and the cloud time rule protect newer games. The focused tests provide the repeatable check for this rule.

## Limits

The full suite does not run, as the owner directs. No live account, database, or screen reader test runs. The cloud tests use the existing fake server and its timestamp rule. Browser checks test live-region attributes and keyboard access. No push, merge, or deploy runs.
