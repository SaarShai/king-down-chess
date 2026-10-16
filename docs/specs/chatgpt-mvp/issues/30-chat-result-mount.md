# Chat result mount: wait for a page command

Status: in-progress

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
- The full `npm test` run and the M1 plugin-ui check are pending.
- No server code changes from `ec044593`. The house rule does not require
  plugin-ui-http for this change.
