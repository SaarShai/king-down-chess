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
