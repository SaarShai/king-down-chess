# Rolling QA 1: Moves band (T7)

Status: in-progress

Source: ticket 28-qa1-faults. The owner selects Q10 a. This step covers T7 only.

## Plan and checks

1. Use the free band under Moves when it holds a 108 px list. Keep the board and bar in place. Show the latest moves. Keep the sheet on short screens and in landscape.
2. Keep the Moves name and set `aria-expanded`. A tap closes or opens the list. A player's close holds for that board view. Check resize, a board update and a new board view.
3. Update the T6 sample with real move history. Assert the open list, latest moves, no page scroll and the low bar at 393 x 852. Assert closed at 320 x 568 and 197 x 426. Keep the zoom and landscape checks.
4. Run `npx tsc --noEmit` and `npm test` with the local test database. Commit. Run `plugin-ui` through the owner's check runner. Record each result.

Taste choice: the list uses 108 px for about three rows. It scrolls within that box when the history grows.
