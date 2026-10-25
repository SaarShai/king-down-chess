# End of game (J4 c, W9 a, C4 c, OPEN-endcard197)

Status: resolved

Lane: od-end. Branch: `claude/od-end`.

## Scope and approval

The owner asks to build ticket 06-end on 2026-10-16.
The approved picks are J4 c, W9 a, C4 c and OPEN-endcard197.
Keep the short web ceremony that Lively uses. Show all end actions
at once. Guard game actions for 1 s. Keep a draw and a loss calm.
Give an abort no ceremony.

## Plan and checks

1. Return a computer abort to the hall draft. Read its options, side,
   king and level from the game. Keep the Abort confirmation.
2. Use plain end reasons without the last move. Use New game and
   Play again. Keep the player's side in a computer rematch.
3. Open the end actions during the ceremony. Add Skip and See the
   board. Stop the motion on an explicit action. Guard game actions
   for 1 s after a live result opens. Keep Skip and See the board active.
4. Keep Back clear at 197 by 426. Limit the end card and let it scroll.
5. Add tests for each path. Run `npx tsc --noEmit` and `npm test` here.
   Run plugin-ui and plugin-ui-http on the M1 with the shared lock.
   Keep all time limits. Get two independent reviews and fix each
   confirmed fault. Record the results and commit on this branch.

## Comments

Work starts from a clean worktree.

## Build and review

- J4: the router sends an explicit computer abort to Play. The draft
  reads the game view. Board and seat keep their Abort confirmation.
- W9: the card gives one plain reason for the player's seat. The last
  move stays on the board. New game keeps the game rules. Play again
  keeps the player's colour in the service and the test fixture.
- C4: keep the short Lively ceremony. Show end actions at once. Skip
  stops the ceremony. See the board hides the card; Game result opens
  it again. A draw and a loss have no result motion. An abort has none.
- OPEN-endcard197: leave 80 px above the card's height limit. The card
  scrolls. The 197 by 426 tests check Back and each end action.
- Two independent readers find three faults. All three have fixes and
  regression tests: keep a live king fall on card open; cancel a
  pending ceremony during the final move; keep Moves open across an
  end poll after See the board.
- The follow-up review finds the same Moves fault when an opponent's
  rematch offer changes the revision. The board update now keeps that
  sheet too. The test covers both an unchanged poll and a new offer.
- Taste: keep the short ceremony, with no extra replay or move tiles.
  Use explicit buttons with a 1 s guard on live game actions. Only a checkmate win uses
  the fall and card rise. Use Game result to return from the board.
- `npx tsc --noEmit`: pass. The full local `npm test` run passes:
  167 files, 2,592 tests and 50 checks for piece scenes. Eight tests
  are skipped.
  Log: `/tmp/kd-06-end-final2-local-tests.log`.
  Both M1 browser checks pass. The final results follow below.
- The 197 by 426 image check passes. Back stays above the card.
  The card scrolls, and each end action fits. The image is
  `/tmp/kd-06-end-197-fixture.png`.
- Both final readers report no confirmed open fault in the code.
  The follow-up reads also accept the browser check fixes.

## Check fixes

- The first full M1 run has 164 passing files and 3 failing files.
  The new tests cause all 14 failures. No time limit changes.
- Route the friend abort result in the test. A direct call from the
  waiting friend page does not use the board's end route.
- Put the new narrow end test after the size matrix. The fixture
  shares saved options. The new test's chess-only setup hid Arrangement
  from later tests. Set Fairy pieces before clearing Arrangement.
- Read the loss through the host result in the motion test. The poll
  can reach the end before a test opens Menu, so Menu can already hide.
- The browser check finds a code fault: the end route passes the
  board's cached rules back into page memory. The end screen treats
  them as a fresh read, so it can skip rating and badge data and Retry.
  Keep the direct end navigation for finished games. Route only a
  computer abort through the draft router. A test fails the fresh end
  read and checks Retry, then checks the successful read.
- The HTTP check finds a navigation-test race. A computer abort opens
  Play while the test's Back click waits for a call. The check now waits
  for Play or an active Back button, then checks and acts in one frame.
- Review finds that a rematch tap can arrive during the fresh read.
  Keep one request until that read ends. Send it only on the same end
  screen for the same game, and only while that choice stays valid.
  Leaving the end screen clears it. Tests hold the read, press twice,
  and check one request after release or none after New game.
- The fast-action test catches a short disabled state during the read.
  End buttons now use the app's existing `data-free` flag. The queue
  still sends one rematch. The test also checks that each action is on.
- The next browser run finds two test faults. Give each toggle case
  its own base draft. Abort now keeps the prior king, so a later case
  cannot assume that the prior draft still has a default king. Check
  See the board with the real end poll. A new chat result takes the
  user to a new screen; it does not act as a background poll.
- The 197 px check passes, then its host height causes a later phone
  check to fail. Clear the inline height after that case, so the host
  keeps room for its Remount row. A separate HTTP cleanup abort races
  the computer's first move. Wait for that move to end before the
  setup checks send a cleanup abort. Keep the existing time limits.
- The full fixture check passes at `ff6545b4` in 223 seconds. The
  HTTP check then finds a remount test race in the friend-code step.
  A short test holds the first read and fails in 3.35 seconds: the
  page clears text entered before that read ends. The check helper
  now waits for the new mount's settings read and its ready state
  before it returns. The short tests and full checks verify this fix.
- The remount probe fails twice, in 3.35 and 3.29 seconds. It passes
  in 3.65 seconds with the ready-state wait. Remove the test probes.
- The next fixture check passes in 221.2 seconds. The HTTP check
  passes the friend-code step and all end checks, then fails a later
  Play layout check. That remount path also measures before its read
  ends. The layout probe now waits for the app and the Play games list
  before it measures a control. Keep each bounds assertion.
- A short layout test confirms the race. It fails in 3.63 seconds
  when a mount read ends between the scroll and the bounds read.
  The full fixture and HTTP checks pass with the ready-state waits.
  We remove the temporary probes. We stop the second layout probe
  while it still waits for the local test lock.

## Answer

All four parts are complete. No part is omitted.

- J4 c: a computer abort returns to Menu with the same draft. The
  board and seat keep the Abort confirmation. Router, draft and app
  tests cover the return and the saved choices.
- W9 a: the card shows a plain reason for the player's seat. It keeps
  the last move on the board. New game uses the game setup. Play again
  keeps the player's colour. Reason tests cover both seats. Database
  tests cover computer rematches from White and Black.
- C4 c: actions show at once. Live game actions have a 1 s tap guard. Skip stops a live or pending ceremony.
  See the board hides the card; Game result returns to it. Draws and
  losses stay calm. Aborts have no ceremony. App, board and motion
  tests cover these paths, a held end read and later end polls.
- OPEN-endcard197: the card scrolls at 197 by 426. Back and each end
  action stay in reach. The size test and both M1 checks pass. The
  image check also passes at `/tmp/kd-06-end-197-http.png`.

The M1 checks use code at `2ebf58ca`. This final ticket change adds no
code. `npx tsc --noEmit` passes. The full local `npm test` run passes
after the last product change: 167 files, 2,592 tests, eight skipped
tests and 50 checks for piece scenes. Later changes touch only the
browser check and this ticket. The local test log is
`/tmp/kd-06-end-final2-local-tests.log`. The final `npm run test:docs`
also passes: eight files and 118 tests.

On the M1, `npm run -s check:browser plugin-ui` passes in 223.6 seconds.
Its log is `/tmp/kd-06-end-v7-ui.log`. The HTTP check,
`npm run -s check:browser plugin-ui-http`, passes in 300.8 seconds.
Its log is `/tmp/kd-06-end-v7-http.log`. Both checks use the shared
lock. No check time limit changes. Two independent readers report
no confirmed open fault. Their follow-up reads cover the final fixes.

Taste choices: keep the short Lively ceremony. Add no extra replay
or move tiles. Use explicit buttons with a 1 s guard on live game
actions. Animate only a checkmate win. Use Game result as the board's return label. Keep
the current game setup for New game. Reserve 80 px in the card height
limit so Back stays clear; let the card scroll.

## Review fixes

Plan and checks:

1. Check each finding against the code and approved picks. Treat the
   two draft scroll reports as one fault.
2. Guard game actions for 1 s after a live end opens. Keep Skip and
   See the board active. Test taps at 200 ms and after 1 s.
3. Keep the error and Retry visible after See the board, also after
   a poll and after Game result. Test a failed held read.
4. Keep a late rematch resume reply from leaving Play. Test both
   a held result read and a held resume reply.
5. Open the New game heading after Abort and New game. Test a phone
   with enough games to fill its screen and a held games read.
6. Correct the three release documents. Add a check for their words.
7. Run the local tests and both M1 browser checks. Keep all time limits.
   Record the results and commit. Do not push, merge or deploy.

Findings and fixes:

- A1, confirmed: the live end has no tap guard. The board now marks
  a live result. The card records its first open time. Play again,
  Rematch, Accept, Decline and New game ignore taps for 1 s. Skip and
  See the board stay active. The motion tests cover both times.
- A2, confirmed: all three release files use the old end actions.
  The guide, live checks and runbook now use the current words. A
  document test checks each file and rejects the old profile route.
- A3, confirmed: See the board closes the dialog that holds Retry.
  The error row now stays on the page while the card is closed, also
  across an end update. Game result moves it into the card again.
  A test holds and fails the read, then uses Retry from the board.
- A4 and B2, confirmed: both draft routes open at the game list.
  Both now scroll to the New game heading after the rows load. Phone
  tests cover six open games, a held list read and cached rows.
- B1, confirmed: the resume call routes its reply after New game.
  That call now has no automatic route. Its result opens only while
  the same game's end screen stays active. Tests hold that reply
  and cover both a stay and a return to Play.

Check results:

- The type check and 77 app tests pass. The app log is
  `/tmp/kd-06-review-app.log`.
- The first full run has 2,598 passed tests, eight skipped tests and
  two failures. Both failures are in tests: an old New game assertion
  acts during the new guard, and the motion clock can pause in the
  past. The tests now wait for the guard or freeze the clock first.
  No product change follows this run.
- The focused motion run passes all guard and clock checks. It has
  17 passed tests and one failed loss test. That test sends the last
  move before the first board read is ready. It now waits for that
  read. The final full run verifies this fix.
- Both M1 checks pass at `02e06e6d`. `plugin-ui` takes 224.1 seconds.
  `plugin-ui-http` takes 303.9 seconds. Both use the shared browser
  lock and keep their time limits. These logs are also on this Mac:
  `/tmp/kd-06-review-m1-ui.log` and `/tmp/kd-06-review-m1-http.log`.
  Later changes touch only tests and this ticket.

The final local `npm test` passes: 167 files, 2,600 passed tests, eight
skipped tests and 50 piece scene checks. The run includes the type
check. It takes 172.76 seconds, after it gets the shared test lock.
Log: `/tmp/kd-06-review-full2.log`. All five faults have fixes and
tests. No finding is refuted. A4 and B2 describe the same fault.
No test or check time limit changes.
