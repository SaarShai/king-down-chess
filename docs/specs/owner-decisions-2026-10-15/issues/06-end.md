# End of game (J4 c, W9 a, C4 c, OPEN-endcard197)

Status: claimed

Lane: od-end. Branch: `claude/od-end`.

## Scope and approval

The owner asks to build ticket 06-end on 2026-10-16.
The approved picks are J4 c, W9 a, C4 c and OPEN-endcard197.
Keep the short web ceremony that Lively uses. Let all end actions work
at once. Keep a draw and a loss calm. Give an abort no ceremony.

## Plan and checks

1. Return a computer abort to the hall draft. Read its options, side,
   king and level from the game. Keep the Abort confirmation.
2. Use plain end reasons without the last move. Use New game and
   Play again. Keep the player's side in a computer rematch.
3. Open the end actions during the ceremony. Add Skip and See the
   board. Stop the motion on an explicit action. Use no tap delay.
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
  Use explicit buttons with no tap delay. Only a checkmate win uses
  the fall and card rise. Use Game result to return from the board.
- `npx tsc --noEmit`: pass. The full local test run waits for the
  shared test lock. M1 checks are next.

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
