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

## Verification

Pending.
