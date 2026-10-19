# Rolling QA 1: Moves band (T7)

Status: ready-for-human

Source: ticket 28-qa1-faults. The owner selects Q10 a. This step covers T7 only.

## Plan and checks

1. Use the free band under Moves when it holds a 108 px list. Keep the board and bar in place. Show the latest moves. Keep the sheet on short screens and in landscape.
2. Keep the Moves name and set `aria-expanded`. A tap closes or opens the list. A player's close holds for that board view. Check resize, a board update and a new board view.
3. Update the T6 sample with real move history. Assert the open list, latest moves, no page scroll and the low bar at 393 x 852. Assert closed at 320 x 568 and 197 x 426. Keep the zoom and landscape checks.
4. Run `npx tsc --noEmit` and `npm test` with the local test database. Commit. Run `plugin-ui` through the owner's check runner. Record each result.

Taste choice: the list uses 108 px for about three rows. It scrolls within that box when the history grows.


## Build

The list uses the existing free grid row. Its content sits within that row, so it cannot change the board size or move the bar. A resize observer checks the actual free height. It opens the list only in the phone portrait layout, with a visible Moves control and at least 108 px of free height.

The list keeps the full history and scrolls to the latest move. A tap closes or opens it. A close holds through a board update and resize. A new game or a return to the board can open it again. The Moves control keeps its words and has `aria-expanded` for both the list and the existing sheet. The sheet stays available on short screens and in landscape.

The browser sample uses eight legal moves. The new assertions check the last move, no page scroll, the bar at the bottom, taps, the close state after an update and resize, and a new board view. The list stays closed at 320 x 568, 197 x 426 and 393 x 740. The last size checks free height at the same width as the tall sample.

## Test repair

The first full unit run fails in the prior missing-portrait test. A file-only run also fails, on another piece. All eight portrait cases pass alone. The whole file with temporary bound readings reproduces the fault: the tap helper reads a 0 x 0 canvas at `[160,235.5]`. After the tap, the canvas measures 195 x 208 at `[62.5,131.5]`. The position stays correct and the board has no selected or read square. The tap misses the piece before the first resize completes.

The shared `squarePoint` helper now waits for a visible canvas before it reads the point. This fixes the cause for all its callers. The portrait assertions stay unchanged. All temporary bound readings and test selection changes are removed. No time limit changes.

## Browser results

The product and browser assertions are at `22a5eb3b`.

| Log | Runner | Result |
| --- | --- | --- |
| `checks-moves-band-1.txt` | None | The launch ends with no output and no active runner. No check result. |
| `checks-moves-band-2.txt` | Mac | Fails at the prior `end fits at 360px` assertion, also recorded by T6. |
| `checks-moves-band-3.txt` | M1 | Fails at the known sideways-overflow reading: 274 px in a 197 px screen. |
| `checks-moves-band-4.txt` | Mac | Passes all checks in 117.3 seconds. Ends with `check-runner: mac exit 0 at 22a5eb3b`. |

The repeat uses the same code and limits. The passing run covers the T7 assertions, the existing zoom checks, the 210 px board floor, the 320 px checks and landscape. No server code changes; `plugin-ui-http` is not required.

The capture passes visual review. It shows three move rows, with the latest move at the bottom. The list box is `[12,587,369,108]`. The board keeps its prior `[4,44,385,411]` box. The bar keeps `[0,712,393,44]` at the frame bottom. Capture: `moves-band-393.png` in the lane output folder.


## Final verification

- `npx tsc --noEmit`: passes after the build and after the test helper repair.
- Final `npm test`, with the local test database: all 178 files pass. There are 2,877 passed tests, one expected failure and eight skipped tests. All 50 art tests pass. Log: `tests-moves-band-2.txt` in the lane output folder.
- The first full run and the two whole-board-file runs fail in the prior portrait test, as described above. The eight-case probe passes. The final full run includes all 80 board tests and passes with the repaired helper.
- `plugin-ui`: passes at `22a5eb3b`, as recorded above. The later change adds only the unit-test helper wait and this ticket. Product code and browser assertions stay unchanged.
- `node --check tools/plugin-ui-check.mjs` and `git diff --check`: pass.

T7 is complete. No part remains unbuilt. T1 to T6 stay as built. The only taste choices are the 108 px list, roughly 36 px rows, and the existing alternating row shade. No new owner decision is required. The short-screen and landscape sheet keeps the full history.
