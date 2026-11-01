# 33 — Draw decline closes the Resign sheet in the immediate case

Status: ready for review
Type: task

## Plan and checks

1. Read the CI call log and the test and app code paths. Find what keeps Resign unclickable.
2. Reproduce under load. Show the failure before the fix.
3. Make the check wait for a real state, not a longer time limit.
4. Run the fixed case at least three times, also under load. Run the whole file once.

## Cause and proof

`tools/plugin-app.test.ts` case 'shows a draw offer and handles a decline before Resign (immediate: true)' failed in CI run 41329972414 (job verify, commit 134e2b2f). The click on the Resign confirm button timed out after 5 s. The call log shows the sheet visible but under the board canvas, then not visible.

The check is a race, not a product fault. After the friend declines, the check opens Menu, then Resign, then clicks the confirm button. The page polls every 3 s while a draw offer is open (`src/plugin/poll.ts`). The poll reads the decline, which has a new revision. A new revision closes each open board sheet but Moves (`src/plugin/screens/board.ts`, the view update). The closing sheet keeps its fade-out with no pointer events (`src/style.css`), so the canvas takes the click; then the sheet hides. A slow runner opens the sheet late enough that the poll lands between the Resign press and the confirm click.

The immediate case must Resign while the page still shows the offer, so that Resign reads first (`command` in board.ts). The old check did not hold that state. On a slow runner a poll could also show the decline before Menu opened, and the case then tested only what the other case tests.

Reproduction before the fix:

- A 3.5 s pause between the Resign press and the confirm click: 1 of 1 fails with the CI error.
- Eight runs of the immediate case at 8x CPU slow-down (Chromium CDP): 1 of 8 fails with the CI error at the same line.

## Fix

Test only. In the immediate case the check sets the harness hook `holdBeforeNext = 'kingdown_get'` and waits until no host call is in flight. Then the friend declines. The next board read, the poll's or Resign's own, stops before the server runs it. So no read can show the decline before the confirm click. The check asserts that the page still shows 'Draw offered. Waiting for your opponent.' After the confirm click it releases the held read. Resign then reads the decline and resigns. The time limits stay the same. No assertion is removed.

## Checks

- With the 3.5 s pause: 3 of 3 pass.
- At 8x CPU slow-down: 8 of 8 pass.
- `KINGDOWN_TEST_FILE=tools/plugin-app.test.ts KINGDOWN_TEST_NAME='draw offer and handles a decline' npm test`: 3 runs, 2 of 2 cases pass each time.
- `KINGDOWN_TEST_FILE=tools/plugin-app.test.ts npm test`: 138 pass, 1 skips.
- The pause and slow-down probes were temporary and are not in the commit.
