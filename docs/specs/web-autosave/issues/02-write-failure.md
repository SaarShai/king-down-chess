# F3: Show a failed local save

Status: resolved
Type: task

## Scope

The owner requests this fix for audit finding F3. Work stays on `staging/web-autosave`.

## Plan

1. Reproduce a storage refusal with a focused test.
2. Return the write result. Keep a short notice while writes fail.
3. Clear the notice after a successful write. Retry the complete current game.
4. Run the focused tests and type checks. Commit this finding alone.

## Checks

- Quota and storage refusal keep the previous save and show a persistent notice.
- Ordinary refresh and selection do not clear the notice.
- A failed write does not notify account sync of a saved change.
- A later successful game write saves all moves and clears the notice.
- Record the failing and passing test runs here. Do not run browser checks or the full suite under the quiet lock.

## Result

The old writer catches a storage error and returns no result. The page cannot show that moves remain unsaved. The red tests reproduce both a quota error and a storage refusal.

`writeSave()` now returns success or failure. A failed write keeps a notice apart from tap and turn notices. The existing context live region shows `Changes not saved. Keep this tab open.` first. It keeps the current instruction and controls. It uses the existing refusal style. No new CSS or layout is needed.

A write clears only the failures for the data it saves. Each failed lesson keeps its own name in the failure set. Only a successful write for that lesson clears its name. A settings change also retries a failed game write when the stored game still matches this page. During a lesson, that retry saves the kept game. It never saves the lesson board over the game. A settings change cannot clear a failed lesson record. A newer stored game stays safe. New game first records the stored game it replaces, so a failed write can retry. A successful game write sets the next comparison. Only a successful write notifies account sync.

## Evidence

- Red: `KINGDOWN_TEST_FILE='src/screen/{play,save}.test.ts' KINGDOWN_TEST_NAME='failed local autosaves|the autosave' npm test`. Type checks pass. Five tests fail, three pass, and 37 skip. The writer returns `undefined`. The page has no save notice.
- Green: `KINGDOWN_TEST_FILE='src/screen/{play,save}.test.ts' npm test`. Type checks pass. Both files and all 45 tests pass.
- UI: `KINGDOWN_TEST_FILE=src/ui/table.test.ts npm test`. Type checks pass. All three cases pass. The notice stays first during a power choice, review, and a result. Cancel and Back to game stay available.
- Final focused check: `KINGDOWN_TEST_FILE='src/{screen/{play,save},ui/table,account/sync}.test.ts' npm test`. Type checks pass. All four files and 71 tests pass.
- Docs: `KINGDOWN_TEST_FILE='tools/{docs-index,model-names}.docs.test.ts' npm test`. Type checks pass. Both files and all nine tests pass. `git diff --check` passes.
- Review: The three failure states distinguish unsaved moves from unsaved settings. A single flag could clear the warning while moves remain unsaved. The change keeps the save format and the existing notice style.
- Limits: No browser check, full suite, or production request runs. Storage and DOM tests use substitutes. CI must check browser layout and real tab behavior.

## Review finding 3

Plan: Test a stale-save conflict, New game, one quota failure, and a move after storage recovers. Run the test before the fix. Keep the comparison for the stored game that New game replaces. Run the test after the fix, then run the doc checks. Commit this finding alone.

Checks: The failed write keeps the stored data and the save warning. The next write saves the new game's move and clears the warning. Only that successful write notifies account sync. The storage write fails once. Tests use fake timers.

Result: New game records the stored game before its replacement write. A quota failure keeps this comparison. The next move saves the new game after storage recovers.

- Red: `KINGDOWN_TEST_FILE=src/screen/play.test.ts npm test`. Type checks pass. One test fails and 28 pass. Storage keeps the old moves after the retry.
- Green: `KINGDOWN_TEST_FILE=src/screen/play.test.ts npm test`. Type checks and all 29 tests pass. The 57 art checks also pass.
- Docs: `npm run test:docs`. All 15 files and 178 tests pass.
- Review: The fix uses the existing comparison and adds no retry state. A later change to the stored game still fails the ordinary comparison.

## Review finding 4

Plan: Test the table renderer with the Guard lesson's two-sentence task. Run the test before the fix. Keep both context parts below the save warning. Run the test after the fix, then run the doc checks. Commit this finding alone.

Checks: The warning stays first. Both sentences stay below it. Both sentences stay after the warning clears. The power detail and existing controls stay available. Tests use fake timers.

Result: The save warning keeps both `line.line` and `line.note` in its detail row. The Guard lesson keeps its full task. The renderer keeps its existing two-row structure and action list.

- Red: `KINGDOWN_TEST_FILE=src/ui/table.test.ts npm test`. Type checks pass. Two tests fail and two pass. The Guard goal and power detail are absent.
- Green: `KINGDOWN_TEST_FILE=src/ui/table.test.ts npm test`. Type checks and all four tests pass. The 57 art checks also pass.
- Docs: `npm run test:docs`. All 15 files and 178 tests pass.
- Review: One assignment joins the existing context parts. It adds no style rule, layout state, or new control. The test uses the real lesson task and renderer.

## Joined lane review, round 4

Plan: Test two failed writes in each order with fake timers. Permit only one retry. Keep the notice for the other data. Test Sound through the real settings handler after a failed game write. Check the stored moves and the game after reload. Keep each finding in its own commit.

Checks: Track game, lesson, settings, and account blocks by their own data. A successful write clears only its own failure. Run the eight requested source test files, then the doc checks. Run `new-game` once at the end. Keep the hooks unchanged. Make no push, rebase, or deploy.

Finding 1 does not reproduce on this branch. The first probe passes both failure orders. The game write fails, then Guard fails. Only Guard can retry; the game notice stays. In the reverse order, only the game can retry; the lesson notice stays. The final retry clears the notice only after both data sets save. Each case uses real move and lesson handlers with fake timers.

Before check: `KINGDOWN_TEST_FILE='src/{account/sync,screen/play,screen/save,ui/table,account/account,account/client,lesson-shelf,lesson-store}.test.ts' npm test`. Both type checks, 166 tests in eight files, and 67 art checks pass. There is no red result for finding 1. The joined branch already keeps a set of failure causes. The new tests keep this rule in code. No source change is necessary for this finding.

Green check: The same command passes all 166 tests, both type checks, and 67 art checks. The change adds tests and ticket records only. Each data set keeps its own failure cause; one shared notice displays the causes.

Finding 2: The notice fault does not reproduce. Sound keeps each unsaved-data notice on the joined branch. The reload fault does reproduce. A game move fails to save. Sound then saves the old stored game. Reload loses e2-e4. The first red check passes both type checks and 167 tests; one reload test fails.

Fix: A settings change retries the pending game only when the stored game still matches this page. It uses the kept game during a lesson. A successful write clears the game cause only when it saves that game. It keeps any lesson cause. A newer tab or account game prevents this retry; a settings-only write keeps the newer game and the warning. The owner check still runs before each write. No new stored field or timer is needed.

Red check with the final cases: The same requested source command passes both type checks and 167 tests. Four tests fail on the prior source: the two Sound cases with unsaved moves and the quota and storage-refusal retries. Each failure shows the old stored moves. All cases use fake timers.

Green check: `KINGDOWN_TEST_FILE='src/{account/sync,screen/play,screen/save,ui/table,account/account,account/client,lesson-shelf,lesson-store}.test.ts' npm test`. Both type checks, all 171 tests in eight files, and 67 art checks pass. Sound keeps each cause while its write fails. After storage recovers, the game saves and reload keeps e2-e4. A lesson failure stays. The next game move saves against the updated comparison. The newer-tab and account controls pass.

Review: The retry uses the existing game data, comparison, owner check, writer, and failure set. It adds no storage key, dependency, or retry timer. A settings-only write clears only the settings cause. A write that also saves the pending game can clear the game cause. No full suite or live account check runs. The storage comparison and write remain separate operations across browser processes.

Final checks: `npm run test:docs` passes 178 tests in 15 files. The one `npm run check:browser new-game` run passes in 34.9 seconds. Its log shows no page or console errors. The diff check passes. Finding 1 is in commit `1e5525d4`. The commit uses the unchanged hooks. No push, rebase, or deploy runs.

## Joined lane final review, finding 1

Plan: Reproduce a failed Guard record, then a successful Maester record. Keep each failed lesson name in the existing failure set. Clear a name only after its own record saves. Commit this finding alone.

Checks: Maester saves after storage recovers. The Guard warning stays. A Guard retry saves Guard and clears the warning. Use the real lesson handlers and fake timers. Run the eight requested source test files before and after the fix. Then run the doc checks and one final `new-game` browser check.

Result: The fault reproduces. The existing failure set now keeps `lesson:<name>` for each failed lesson. Maester saves without clearing Guard. A Guard retry saves Guard and clears its warning. An account switch still clears the prior account's failure set.

Source command: `KINGDOWN_TEST_FILE='src/{account/sync,screen/play,screen/save,ui/table,account/account,account/client,lesson-shelf,lesson-store}.test.ts' npm test`.

- Red: Both type checks pass. Two tests fail and 172 pass. This case loses the Guard warning after Maester saves. The other failure is finding 2.
- Green: Both type checks, all 174 tests in eight files, and all 67 art checks pass. The Guard warning stays until Guard saves.
- Review: The fix keeps one failure set and one notice. It adds no timer, stored field, or dependency. The test checks the failed record, the other saved record, the warning, and the final retry.

Final checks: `npm run test:docs` passes all 178 tests in 15 files. The one `npm run check:browser new-game` run passes in 31.0 seconds. The diff check passes. No full suite or live account check runs. No push, rebase, or deploy runs.
