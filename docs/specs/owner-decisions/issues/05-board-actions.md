# Board actions and read failures

Status: in-progress
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
   actions until a good read. With no board after a remount, show Try again.
5. Add tests for each part. Run the type check, unit tests and the browser
   checks on the M1. Get two independent reviews. Fix each confirmed fault.

## Choices

- Keep Refresh the board. This ticket has no F4 polling check result.
- Keep no board copy in widget state. A failed remount shows Try again.
- Menu has two columns. Short landscape screens use three columns.
- The short move line keeps the time left visible. A long move can show
  an ellipsis. The 24 px line is plain text. Menu opens the full Moves sheet.
- Show hours, then minutes in the last hour. Round up. Show Time is up
  when the deadline passes.
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
  and game actions stay off until a good read. This includes polls.
  A remount with no board shows the line and Try again.

## Review

Two independent readers check the diff. Both report no open fault after
the fixes. They find old bar selectors, a wrong Mirror B label, Menu
scroll on short landscape screens, and no time left on those screens.
The build fixes each fault and adds checks for the small screens.

The first full test run also finds that the move line's touch area
covers the bottom edge of an opponent's coin. The short line is now plain text
in a 24 px row. It has no touch area. The existing edge checks test the
player controls beside it.

## Verification

- Type check: pass.
- Focused unit tests on the M1: 2 files, 35 tests pass. The 50 document
  tests pass.
- First full test run: 159 files pass; 6 files fail. The failures include
  old status and size checks, the touch fault above, two 5 s timeouts and
  a database test. The changed checks and the three other files run again.
- Final UI tests and M1 browser check: pending.
