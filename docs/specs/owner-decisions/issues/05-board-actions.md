# Board actions and read failures

Status: claimed
Type: task

## Scope

Build the owner's picks J7 a, W8 a, B1 b and B3 b. Keep Menu at the
right of the bar. Leave the other two cells for Undo and the turn button.
The owner asks for this build on 2026-10-15.

## Plan and checks

1. Put Resign, Offer draw and Abort in Menu. Put the Abort note beside
   Abort. Keep draw replies on the board. Show all Menu items without scroll.
2. Show New player for a provisional rating on the board and end card.
3. Keep a short last-move line above the board at short heights. Include
   the card or power name and time left.
4. Keep the last board after a failed read. Show Not current and lock game
   actions until a good view. Quiet polls try twice in silence. With no
   board after a remount, show Try again.
5. Add tests for each part. Run the type check and unit tests. Run the
   browser check on the M1. Get two independent reviews. Fix each fault.

## Choices

- Keep Refresh the board. This ticket has no F4 polling check result.
- Keep no board copy in widget state. A failed remount shows Try again.
- Menu has two columns. Short landscape screens use three columns.
- The short move line keeps the time left visible. A long move can show
  an ellipsis. The 24 px line is plain text. Menu opens the full Moves sheet.
- Show hours, then minutes in the last hour. Round up. Show Time is up
  when the deadline passes. Each minute tick changes only the time text.
  Refresh the full board when the deadline passes.
- The end card shows New player with no rating change while the rating
  is provisional.

## Build

- J7 a: Menu holds Resign, Offer draw, Abort and the Abort note. The
  board holds Accept draw and Decline draw. Menu stays at the right of
  the bar. The other two cells stay free.
- W8 a: the status has no Abort note. Both player strips and the end
  card show New player for a provisional rating.
- B1 b: the short last-move line stays above the board. It names a card
  or power and keeps the time left. Menu opens the full Moves sheet.
- B3 b: a failed read keeps the last board and shows Not current. Moves
  and game actions stay off until a good reply supplies a view. Quiet
  polls try twice in silence; the third failure shows the read error.
  A remount with no board shows the line and Try again.

## Review

### Follow-up review plan

Check both reports against `5458ddbb`. Test each confirmed fault.
Restore the quiet poll guard. Clear a read error on a good view.
Keep draw replies inside the frame when piece actions show. Keep keyboard
focus during the minute tick. Disable the end card's game actions after
a failed read. Test the move lock with a legal pawn move and recovery.

Pass criteria: each test checks the reported state and the recovery.
Run `npm test` here with the local test database and one worker.
Run `check:browser plugin-ui` in the lane folder on the M1. Keep each
time limit. Record the results and commit the fix.

### Initial review

Two independent readers check the first diff. Both report no open fault after
the fixes. They find old bar selectors, a wrong Mirror B label, Menu
scroll on short landscape screens, and no time left on those screens.
The build fixes each fault and adds checks for the small screens.

The first full test run also finds that the move line's touch area
covers the bottom edge of an opponent's coin. The short line is now plain text
in a 24 px row. It has no touch area. The existing edge checks test the
player controls beside it.

## Initial verification

- Type check: pass.
- Focused unit tests on the M1: 2 files, 35 tests pass. The 50 document
  tests pass.
- First full test run: 159 files pass; 6 files fail. The failures include
  old status and size checks, the touch fault above, two 5 s timeouts and
  a database test. The database file passes alone. The final full run
  covers all three other files.
- Final `npm test`: pass. Use `VITEST_MAX_WORKERS=1` and the local test
  database. All 165 files pass: 2,569 tests pass, 8 skip. The 50 document
  tests also pass. The test phase takes 852.88 s. No time limit changes.
- M1 `npm run -s check:browser plugin-ui`: pass at `abd93a28`, 278.7 s.
  The check keeps its 420 s limit. No server code changes, so this ticket
  needs no `plugin-ui-http` check.
- All four parts are built. No part is left open.

## Follow-up findings

- A1: fixed. Two failed quiet polls stay silent. The third failure sets
  the read error. A good read resets the count.
- A2 and B1: fixed. A good reply with a view clears the read error,
  including a resume for another solo game.
- A3 and B2: fixed in the worktree; layout approval stays open. Draw
  replies use a row below the text. All rules hides while replies show.
  A pass adds no redundant Choose a move button: Stop here handles it.
  An armed card or power keeps Cancel in that slot. Menu keeps its move
  list. The checks include selection after the card is armed.
- A4: fixed. Rematch, Accept and Decline use the game-action class and
  the board's lock, including when the end card builds new buttons.
- A5 and B4: fixed. The test selects e2, attempts e4 and checks for no
  move call or position change. The same input works after a good read.
- B3: fixed. Each minute tick updates only the time text. The board
  refreshes when the deadline passes. Both coin types keep keyboard focus.

## Follow-up verification

- Type check: pass.
- Browser check script syntax: pass.
- Final full `npm test`: pass with all fixes. All 165 files pass: 2,575
  tests pass and 8 skip. The 50 document tests also pass. The test phase
  takes 847.92 s. Use `VITEST_MAX_WORKERS=1` and the local test database.
  No time limit changes.
- Final M1 `npm run -s check:browser plugin-ui`: pass, 224.2 s. The
  420 s limit stays the same. Phone sizes are 320 by 568 and 360 by 640,
  with insets 63/84. The landscape size is 852 by 393. The check tests
  the king, the pawn, an armed card with its pawn selected, and Stop here
  after Haste. Each state keeps the board and
  row size. Each action fits or scrolls into view. No horizontal overflow.
  The landscape pane uses its existing scroll. The six source and test
  files match the local files.
- No server code changes. The plugin-ui-http check does not apply.

## Open layout choice

The 320 by 568 card sample keeps the reply row fixed and all controls in
view, but the board is very small. The owner checks the rendered sample
before the commit.

1. Render the existing 210 px board floor with page scroll. Agent's pick.
   A yes prepares that sample for the owner's check.
2. Keep the shown row, with all controls in view. A yes approves that
   sample and permits the commit after the browser check passes.
