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
