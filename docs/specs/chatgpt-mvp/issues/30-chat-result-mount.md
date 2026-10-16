# Chat result mount: wait for a page command

Status: ready-for-human

Lane: mount-r3. Branch: `claude/fault-round-2`.

The owner asks for the mount fix from comment 3 on PR 57. The other
parts of ticket 09 are outside this step.

## Plan and checks

1. Add a journey test for a chat result that opens Board while Choose
   for the same game waits. Check a late request and a late reply.
   The test must fail before the fix.
2. Fix the skipped read. Read `mountResult()`, both `call()` functions,
   and their callers. Remove code only when the tests keep the same results.
3. Run `npx tsc --noEmit`, `npm test`, and the plugin-ui check on the M1.
   Keep all app and journey tests green. Check the diff from `ec044593`.
4. Record the checks and the need for each mount guard. Commit the work.

## Done when

- The chat result reads after Choose ends and opens Seat for a setup game.
- A move in flight gets no false error or Retry.
- A newer result keeps its board, screen and list when an older call ends.
- The required checks pass, or this ticket states the cause of a failed check.

## Design check

- **Board guard:** the client keeps the board that a newer result selects.
  The app also drops the old selection's view and clears its pending command.
  A board guard alone cannot stop the old reply from opening its screen.
- **New board for a result with no board:** `kingdown_open` makes a new board.
  A request that reaches the server late cannot change the newer board's game.
  Only the current mount takes the new board from the reply.
- **AbortController:** a newer result stops the old mount's SDK calls.
  This frees the read lock at once. A mount chain or a stale check alone
  must wait for the old request to end. The signal also stops an old list
  from replacing the newer list.
- **Command wait:** `call()` skips calls while a page command holds `busy`.
  The mount must wait, then read the game and route by its status.
  The old `busyGame` exception assumes that a reply for the same game routes
  the page. Choose can return a setup view with routing off. Wait for every
  page command and remove `busyGame`.
- **`late()`:** a poll gives way to a command or a newer view. A mount call
  gives way to its abort signal. Checks after each read and the list prevent
  a late reply or error from changing the newer screen. The mount's catch
  and finally checks also keep its error and control lock out of the new mount.

The rest stays. The client sets the board; the app sets the view and screen.
Their guards protect different state. A new queue or a shared request layer
adds code and does not remove the need for those guards.

## Check results

- Before the fix: `KINGDOWN_TEST_FILE=tools/plugin-journeys.test.ts npm test`
  fails in both new cases. Each expects Seat and gets Board. The other
  23 journey tests pass. Log: `/tmp/kd-mount-r3-red.log`.
- After the fix: `npx tsc --noEmit` passes.
- `npm test` passes on `3d876e79`: 163 files pass; 2,543 tests pass and
  8 opt-in balance drift tests skip. All app and journey tests pass.
  The 50 document tests also pass. The run uses the owner's local test
  database. Log: `/tmp/kd-mount-r3-tests.log`.
- `npm run -s check:browser plugin-ui` passes on the M1 at `3d876e79`
  in `~/projects/kd-mount` (224.5 s). The run takes the shared browser
  lock and releases it on exit. Log: `/tmp/kd-mount-r3-m1.log` on this
  Mac. The M1 run folder is
  `/var/folders/yt/lcvhzjhj76ldb_pzwltq48_c0000gn/T/kingdown-check-runs/kd-mount-Ih0Haf`.
- No server code changes from `ec044593`. The house rule does not require
  plugin-ui-http for this change.

## Scope and taste

This step fixes the skipped read and uses the simpler wait rule.
The other guards stay for the reasons above. This step needs no
new words, layout or taste choice. The other parts of ticket 09 stay
outside this step, as the owner asks.

## Review repair plan

1. Check each report against the full call path. Add tests that fail
   before each fix: command errors during a mount wait, late Join and
   Accept replies from their buttons, and a late first settings reply.
2. Keep a command error for the game now shown through the mount read.
   Drop old Join and Accept replies before they change the screen.
   Abort old settings reads and check freshness before use. The current
   mount must obtain the settings and player data that it needs.
3. Run the new tests before and after the fixes. Run `npm test` with the
   local test database. Run plugin-ui on the M1 in `~/projects/kd-mount`
   under the shared lock. Run plugin-ui-http if server code changes.
4. Check the diff for simpler code and faults. Record each finding and
   its evidence here. Commit with both required tool trailers.

The checks must keep old errors off a different game, keep a newer read
error or Retry, and keep the current board and screen in agreement.
No server or game rule change is in scope.

## Review findings

- **A1, confirmed:** `call()` clears the page error at the start of a read.
  Its success path also clears errors with no pending Retry. The mount
  now waits for a command, then reads, so that read can erase a command
  refusal. Count each command error with no Retry and keep its game and
  text. After the read, restore a new error only for the game now shown,
  with no newer read error or pending error.
- **A2 and B1, confirmed:** Join and Accept call the client directly.
  The client drops an old board selection, but each button still opens
  the old game. Both callers now check the selected board before they
  use the reply. For an error with no board, they check the board that
  the call starts on. An old name request cannot open the name screen.
- **B2, confirmed:** the first settings read has no abort signal and
  calls `remember()` before the stale check. It can replace a setting
  that the player saves after a newer mount unlocks the controls. Pass
  the mount signal and check freshness before use. A current mount also
  reads settings if settings or player data are missing.

The tests use the real Join and Accept buttons. They cover Profile,
another game, and a name request with no board in its reply. The error
tests cover the same game, a different game, and a failed mount read.
The settings tests cover newer results with and without settings.

The existing board guard, abort signal, command wait and `late()` still
have the separate uses in the Design check above. Each fix stays at the
point that owns the affected state. No shared request layer is needed.

## Review check results

- The fixes pass the type check. Local commit: `2ede4e8e`.
- On the old source, 7 journey cases fail at the expected assertions;
  the other 27 pass. Both new settings cases fail; the other 60 app
  tests pass. Logs: `/tmp/kd-mount-r3-review-red-journeys-final.log`
  and `/tmp/kd-mount-r3-review-red-app.log`.
- On the fixed source, all 34 journey tests and all 62 app tests pass.
  Logs: `/tmp/kd-mount-r3-review-green-journeys-final.log` and
  `/tmp/kd-mount-r3-review-green-app.log`.
- Both full runs with the default worker count pass all app and journey
  tests. Each has one failure: the 5-second limit in
  `src/rules/power-fixes.test.ts:470`. The other 2,553 tests pass; 8 skip.
  All 35 tests in that file pass alone. Logs:
  `/tmp/kd-mount-r3-review-full.log`,
  `/tmp/kd-mount-r3-review-full-retry.log`, and
  `/tmp/kd-mount-r3-review-power.log`.
- `VITEST_MAX_WORKERS=2 npm test` passes with the owner's local test
  database: 163 files pass; 2,554 tests pass and 8 skip. The 50 document
  tests also pass. The run takes 408.94 s. Log:
  `/tmp/kd-mount-r3-review-full-two-workers.log`; exit status: 0.
  The installed test runner supports this worker setting. It reduces
  CPU load; no test or check time limit changes.
- The M1 plugin-ui check passes in 213.4 s at `2ede4e8e` in
  `~/projects/kd-mount`. It takes the shared browser lock and releases
  it on exit. Log: `/tmp/kd-mount-r3-review-m1.log`; exit status: 0.
  Run folder:
  `/var/folders/yt/lcvhzjhj76ldb_pzwltq48_c0000gn/T/kingdown-check-runs/kd-mount-dwgl8U`.
- The source code has no change after the M1 check. The later edits
  correct the journey test setup and record these results in this ticket.
- No server code changes. The house rule does not require plugin-ui-http.
