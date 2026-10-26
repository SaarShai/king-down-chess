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

## Joined lane review, round 4

Plan: Test two failed writes in each order with fake timers. Permit only one retry. Keep the notice for the other data. Test Sound through the real settings handler after a failed game write. Check the stored moves and the game after reload. Keep each finding in its own commit.

Checks: Track game, lesson, settings, and account blocks by their own data. A successful write clears only its own failure. Run the eight requested source test files, then the doc checks. Run `new-game` once at the end. Keep the hooks unchanged. Make no push, rebase, or deploy.

Finding 1 does not reproduce on this branch. The first probe passes both failure orders. The game write fails, then Guard fails. Only Guard can retry; the game notice stays. In the reverse order, only the game can retry; the lesson notice stays. The final retry clears the notice only after both data sets save. Each case uses real move and lesson handlers with fake timers.

Before check: `KINGDOWN_TEST_FILE='src/{account/sync,screen/play,screen/save,ui/table,account/account,account/client,lesson-shelf,lesson-store}.test.ts' npm test`. Both type checks, 166 tests in eight files, and 67 art checks pass. There is no red result for finding 1. The joined branch already keeps a set of failure causes. The new tests keep this rule in code. No source change is necessary for this finding.

Green check: The same command passes all 166 tests, both type checks, and 67 art checks. The change adds tests and ticket records only. Each data set keeps its own failure cause; one shared notice displays the causes.

## Result

The old writer catches a storage error and returns no result. The page cannot show that moves remain unsaved. The red tests reproduce both a quota error and a storage refusal.

`writeSave()` now returns success or failure. A failed write keeps a notice apart from tap and turn notices. The existing context live region shows `Changes not saved. Keep this tab open.` first. It keeps the current instruction and controls. It uses the existing refusal style. No new CSS or layout is needed.

A successful game write saves all current moves and clears the notice. A settings write clears only a settings failure. It cannot hide unsaved game moves. New game first records the stored game it replaces, so a failed write can retry. A successful game write sets the next comparison. Only a successful write notifies account sync.

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
