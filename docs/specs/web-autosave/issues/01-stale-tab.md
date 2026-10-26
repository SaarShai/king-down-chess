# F2: Keep a newer local save

Status: resolved
Type: task

## Scope

The owner requests this fix for audit finding F2. Work stays on `staging/web-autosave`.

## Plan

1. Reproduce the stale-tab write with a focused test.
2. Keep stored game fields in a settings write. Check the stored game before a game write.
3. Show a clear notice on a conflict. Keep the newer stored game.
4. Run the focused tests and type checks. Commit this finding alone.

## Checks

- A settings change in a stale tab keeps all stored game fields.
- A stale game write cannot replace a changed stored game, including staged turns.
- Settings changes alone do not cause a game conflict.
- A new game and an accepted account save still work.
- Record the failing and passing test runs here. Do not run browser checks or the full suite under the quiet lock.

## Result

The old code replaces a changed stored game. Four new cases fail: more moves, a resignation, a staged turn, and a save added after boot. The own-write control passes.

Settings now call `saveSettings()`. That write keeps the stored game fields. Game writes compare the stored game with the copy last read or written by this page. The comparison excludes settings and sorts JSON keys. A conflict keeps the stored data and blocks play. The notice gives two choices: reload, or start a New game. A New game can replace the kept data. An accepted account game resets the comparison.

## Evidence

- Red: `KINGDOWN_TEST_FILE=src/screen/play.test.ts KINGDOWN_TEST_NAME='local saves from two tabs' npm test`. Type checks pass. Four tests fail, one passes, and 17 skip.
- Green: `KINGDOWN_TEST_FILE='src/screen/{play,save}.test.ts' npm test`. Type checks pass. Both files and all 42 tests pass.
- Review: The change uses the existing save, recovery block, notice, and live region. It adds no dependency or save format. The tests cover the game fields that can change without a new move.
- Limits: No browser check or full suite runs under the quiet lock. The tests use shared in-memory storage. They do not test two browser processes that write at the same instant. This synchronous storage check does not supply an atomic compare-and-write operation.

## Review finding 2

Plan: Test an accepted account restore through `fromAccount()` on a FEN page. Run the test before the fix. Update the stored-save comparison and keep the FEN board. Run the test after the fix, then run the doc checks. Commit this finding alone.

Checks: The callback keeps the current game and FEN position. The next move saves from that position. The page stays open for play and notifies account sync once. Tests use fake timers.

Result: The FEN path now sets the comparison from the accepted account save. It keeps the board. The test calls `fromAccount()` and saves a move from the FEN position.

- Red: `KINGDOWN_TEST_FILE=src/screen/play.test.ts npm test`. Type checks pass. One test fails and 27 pass. Storage keeps the account moves instead of the FEN move.
- Green: `KINGDOWN_TEST_FILE=src/screen/play.test.ts npm test`. Type checks and all 28 tests pass. The 57 art checks also pass.
- Docs: `npm run test:docs`. All 15 files and 178 tests pass.
- Review: The fix uses the existing comparison. It adds no save field or account code. Finding 1 stays with the account-sync lane.

## Re-review finding 1

Plan: Add tests for unreadable stored data, New game, and one quota failure. Run the tests before the fix. Keep permission to replace the same raw data until a game write succeeds. Run the tests after the fix, then run the doc checks. Make one commit.

Checks: The next move saves when writes recover. A change to the raw data blocks writes. The save check and the account sync check use the same permission. Tests use fake timers. Work stays out of `src/account/`.

Result: An unreadable-save read now includes its raw text. New game keeps permission for that text after a failed write. Both checks compare the raw text. A successful game write or an accepted account game clears the permission. A later return of the old raw text blocks writes again.

- Red: `KINGDOWN_TEST_FILE='src/{screen/play,screen/save,ui/table}.test.ts' npm test`. Both type checks pass. Two tests fail and 53 pass. The move does not save. The account sync check blocks the same raw data. Both changed-data cases pass.
- Green: `KINGDOWN_TEST_FILE='src/{screen/play,screen/save,ui/table}.test.ts' npm test`. Both type checks, all 55 selected tests, and all 57 art checks pass.
- Docs: `npm run test:docs`. All 15 files and 178 tests pass.
- Review: The fix uses one raw-text comparison for both checks. It adds no stored field or dependency. The tests check the retry, changed raw data, and the end of replacement permission. No full suite or browser check runs.

## Lane merge and account finding 1

Plan: Merge `staging/web-sync` into this branch. Keep the account owner check and the saved game comparison. Use one persistent save notice for storage failures and account blocks. Add a two-tab test with equal game fields and different settings. Check the current staging tip with `git merge-tree`; do not merge that tip.

Checks: A stale A tab cannot write its move or settings to B's local copy or cloud row. An accepted account load updates the comparison, including a FEN page. An owner block returns `false` from `writeSave()`. A successful write clears the notice for the data it saves. Run the selected source tests, doc checks, and one `new-game` browser check. Keep the commit hooks unchanged.

Merge result: The merge has four text conflicts. `play.ts` keeps both guards and the switched callback. Each accepted account game sets the comparison before the board path runs. `play.test.ts` keeps the FEN input, real settings, fake timers, and both sets of view methods. `save.ts` keeps the boolean result and returns `false` on an owner block. `save.test.ts` keeps the false-result check; it needs no second write to check for a thrown error.

Notice design: All persistent save warnings use `saveNotice`. An account block shows Reload and stops writes. A storage failure shows “Changes not saved. Keep this tab open.” and permits local play. The page shows one warning, even with both causes. It tracks game, settings, and lesson failures. A successful write clears only the failures for the data it saves. A settings write cannot hide unsaved moves or lesson progress. An account switch clears the prior account's failure state.

Merge check: `KINGDOWN_TEST_FILE='src/{account/sync,screen/play,screen/save,ui/table,account/account,account/client,lesson-shelf,lesson-store}.test.ts' npm test` passes. Both type checks, 147 tests in eight files, and 57 art checks pass. `src/account/local.test.ts` does not exist, so the command omits it. The merge adds no dependency or save field.

Finding 1 result: The two-tab test starts with equal game fields and different sound settings. It checks each first write: A's move, then A's settings; and A's settings, then A's move. Both writes return `false`. B's save, lessons, stamps, and cloud row stay equal to their prior data after each flush. B can then save and send its own move. The test also checks one persistent account notice with Reload. It uses separate Storage objects, shared keys, and the real `Sync` class.

Red check: The new cases pass on the merged owner checks on their first run. No new source repair or failing run is necessary for finding 1. The owner check closes the fault. Keep this check before every local write, including settings writes and New game; equal game fields cannot prove equal account ownership.

Green: The same selected source command passes 150 tests in eight files, both type checks, and 57 art checks. This includes both account write orders and a lesson retry. The lesson test proves that a settings write keeps a lesson failure notice, and a successful lesson retry clears it. All new timed cases use fake timers.

Final checks: `npm run test:docs` passes 178 tests in 15 files. The one `npm run check:browser new-game` run passes. The browser log reports no page or console errors. `git diff --check 6e0c9cfb` passes.

Staging check: After a fetch, `origin/staging/first-game` points to `e862c75a`. `git merge-tree --write-tree origin/staging/first-game HEAD` at merge commit `3b04606e` exits 1. It finds a content conflict in `src/screen/play.test.ts` and an add/add conflict in `src/ui/table.test.ts`. It merges the play and table source files without a text conflict. No staging merge runs. The final report also checks the test commit.

Limits: The new account test uses shared in-memory keys and a cloud substitute. It does not check separate browser processes or a live account. The save comparison and write remain separate operations. No full suite, push, rebase, or deploy runs. The merge commit uses the unchanged hooks and both required trailers.

Update: Both lanes merge. All tests stay. One save notice clears each failure after a successful write.

## Joined lane review, round 4

Plan: Test both failure orders and the real Sound handler on this branch. Keep the stored-game comparison and the account owner check. Record results in [ticket 02](02-write-failure.md). Make one commit per finding.

Finding 1 does not reproduce. Two new tests fail game and lesson writes in each order. Only one write can retry. The other failure keeps the notice. A final retry clears the notice after both data sets save. The first requested source check passes all 166 tests, both type checks, and 67 art checks. No source change is necessary. The game, lesson, and settings causes stay separate from the account block.

Finding 2: Sound keeps the warning, but reload loses the unsaved move. The red test shows no stored move after Sound. A settings change now retries the pending game when the stored game still matches this page. It saves the kept game during a lesson. Only that game save can clear the game failure. A lesson failure keeps the notice. Tests also check a newer tab game and an accepted account game. Both keep their data and the pending-game warning. The comparison and owner checks stay in place.

Final checks: All 171 tests in the eight requested source files, both type checks, and 67 art checks pass. The doc check passes 178 tests in 15 files. The one `npm run check:browser new-game` run passes in 34.9 seconds. Its log shows no page or console errors. The diff check passes. Finding 1 is in commit `1e5525d4`. No push, rebase, or deploy runs.

## Joined lane final review, finding 2

Plan: Reproduce an account switch from A to B with no saved game. Apply the reset settings to sound and the board through the normal settings path before New game starts. Commit this finding alone.

Checks: A sets Sound and Coordinates to Off and Animations to Normal. Sync selects B. B's controls, saved settings, sound, and board agree. Check B with and without a saved game. Use real settings handlers, Sync, and fake timers. Run the eight requested source test files before and after the fix. Then run the doc checks and one final `new-game` browser check.

Result: The fault reproduces. The account callback applies settings to sound and the board before the empty-account return. Reset values and saved values use the same path. New game then saves the values that the controls and board use.

Source command: `KINGDOWN_TEST_FILE='src/{account/sync,screen/play,screen/save,ui/table,account/account,account/client,lesson-shelf,lesson-store}.test.ts' npm test`.

- Red: Both type checks pass. Two tests fail and 172 pass. Empty B saves On, On, and Off. Sound and the board still use Off, Off, and Normal. The other failure is finding 1. The control with B's saved game passes.
- Green: Both type checks, all 174 tests in eight files, and all 67 art checks pass. Both account cases pass. Controls, saved values, sound, board coordinates, board pace, and page pace agree.
- Review: The fix moves the early return below the existing settings path. It adds no helper, state, stored field, or dependency. No live account check or full suite runs.

Final checks: `npm run test:docs` passes all 178 tests in 15 files. The one `npm run check:browser new-game` run passes in 31.0 seconds. The diff check passes. No push, rebase, or deploy runs.
