# Board model: the pure draft

Status: resolved
Type: task

## Scope

Build W7 design section 8, ticket 02. Add `draftTurn`, `sendActions`,
`draftChoices` and `restoreDraft` to `src/plugin/screens/board-model.ts`.
Use `src/turn.ts`. Keep the UI and server files unchanged.

## Plan

1. Add the four functions. Keep the server view and input positions unchanged.
2. Test each case in design section 7. Test the saved half turn and rules reset.
3. Run the type check, unit tests and M1 `plugin-ui` check. Get two independent
   reviews. Fix each confirmed fault. Record the results and commit the change.

## Review fix plan

1. Check both review findings against the code and design.
2. Pass the player's seat to `draftTurn` and `sendActions`. Allow a pass with
   no draft steps only on that player's half turn. Test both seats and modes.
3. Test restore with a changed FEN where the saved move is still legal.
   Add the missing test for the check line.
4. Run `npm test` with the local test database. Run `plugin-ui` on the M1 in
   `kd-w7-model`, with the shared browser lock. Record the results and commit.

The fix passes when the opponent's half turn cannot send a pass, the player's
half turn can still send it, and restore drops a draft from the other FEN.

## Verification

- [x] The type check in `npm test` passes.
- [x] `npm test` passes with the local test database.
- [x] `npm run -s check:browser plugin-ui` passes on the M1 in `kd-w7-model`.
- [x] Check both supplied reviews. Fix each confirmed finding and add a test.
- [x] The diff changes only the two board model files and this ticket.

## Results before this review

- The four functions are built. The UI and server files stay unchanged.
  The full-suite check stays open.
- `npx tsc --noEmit` passes.
- The final board test check passes: 39 tests, plus 50 figure tests.
- A reader finds one test gap. The added test checks a Haste move at the
  50-move draw limit. The reader confirms that it closes the gap.
- Two independent reviews find no open code fault.
- The full `npm test` check reports 2,586 passes, 8 skips and 3 failures in
  165 files. Search and Workshop judge reach their time limits. The Retry
  case at `tools/plugin-app.test.ts:1013` counts two calls instead of one.
  These three test files stay unchanged. No time limit changes.
- Each failed file passes alone with the same time limits: Workshop judge
  (12 tests), Search (18 tests) and the plugin app (67 tests).
- The M1 `plugin-ui` check passes on source commit `af27f6dd` in
  `~/projects/kd-w7-model`. The log is `/tmp/kd-w7-model-browser.log`.
  Its output folder is `kd-w7-model-htdJzx`. The checkout stays clean.
- The extra full-suite repeat does not start. It waits for the shared test
  lock. I stop this queued repeat by its process IDs. The first full-suite
  result above stays recorded in `/tmp/kd-w7-model-all-tests.log`.
- The three full-suite failures are outside this ticket's scope. No requested
  function is missing. No source fault remains from either review.
- Taste choices: none. The turn words come from `src/turn.ts`.

## Review findings

- Review A, finding 1: confirmed. The zero-step half-turn rule does not read
  the player's seat. `draftTurn` and `sendActions` now require that seat.
  Callers pass `view.seat` as the last input to both functions.
  Only the player whose turn continues can send the zero-step pass. Tests
  cover both seats in computer and link games. The other side gets
  `ready: false` and an empty action list.
- Review A, finding 2: confirmed. The START case rejects the saved move even
  without the FEN guard. The added changed-FEN case keeps that move legal.
  It checks the FEN guard itself.
- Review A, check-line gap: confirmed. A new staged-check test checks the
  words in both game modes.
- Review B: no findings. This report calls for no change.

## Review check results

- The source fix is commit `90a8538e`. The source and test files stay unchanged
  through all checks below.
- The final full `npm test` passes: 165 files, 2,596 tests and 8 skips.
  The 50 figure tests also pass. The check uses the owner's local test database.
- The first full check reports 163 passing files, 2 failing files, 2,575 passing
  tests and 29 skips. PostgreSQL reports deadlocks (`40P01`) in accounts cleanup
  (`src/online/accounts.db.test.ts:64`) and plugin server setup
  (`tools/plugin-db/bootstrap-test.mjs:29`). Both files pass alone: 10 and
  21 tests. The full retry then passes. No database code or time limit changes.
- The board file passes alone: 45 tests. Each single-file check uses
  `KINGDOWN_TEST_FILE` with `npm test` and also passes the 50 figure tests.
- The M1 `plugin-ui` check passes on `90a8538e` in `~/projects/kd-w7-model`.
  It takes 220.7 seconds. Its output folder is `kd-w7-model-C87q4t`.
  The job releases the shared browser lock. The M1 checkout stays clean.
- The server files do not change. This fix needs no `plugin-ui-http` check.
- Logs are in `/tmp/kd-w7-model-review.6hUS3h/`: `tests.log` for the first full
  check, `retry.log` for the final full check, `board.log`, `accounts.log`,
  `server.log` and the M1 log copy, `browser.log`.
