# Rolling QA 1: swap line (T4 and T5)

Status: ready-for-human

Source: ticket 28-qa1-faults. The owner asks for T4 and T5 only.
The owner selects Q9 b: put the piece portrait before the context words.

## Plan and checks

1. Replace the blank info tile with the piece portrait. Keep All rules, its accessible name, and a 44 px control. At 320 and 393 px, check that the image loads, the control fits in the row, and the words have no more lines than before.
2. Use one shared piece title in both board views. Add a unit test for `White Maester.` and check the built page.
3. Run `npx tsc --noEmit` and `npm test`. Commit, then run `plugin-ui` with the owner's check runner. Read its result before the final report.

All three steps pass. T1 to T3 and T6 stay outside this step. No server code changes.

## Build

- T4: the existing All rules control moves before the context words. It shows the selected piece in its army colour, or the selected king portrait. The image exists only after a piece is selected, so no empty image needs to load. The control keeps its accessible name and stays available while a turn sends.
- T5: both board views use `pieceTitle` from `src/read.ts`. It uses the shared name table and keeps custom names. The source search finds no other copy of the colour-and-piece title.
- Tests: the unit test checks `White Maester.`, `Black Maester.` and a custom name. The browser check checks the loaded face, row order, bounds, words, rules sheet and return focus at 320 and 393 px. It uses Close to keep the swap selected; Escape clears the selected piece.
- The existing Menu and row-size tests cover the draw reply in landscape. A 44 px first row and a 4 px row gap keep the prior total height.

## Results

The checked code and tests are at `ce45aa3c`. The final commit records these results only.

- `npx tsc --noEmit`: pass.
- `npm test`: pass. All 178 test files pass: 2,869 tests pass, one has an expected failure, and eight stay skipped. All 50 art tests pass. Log: `tests-swap-line-4.txt` in the lane output folder.
- One prior full run hits the Resume computer-reply poll limit. The same file passes all eight tests alone, and the final full repeat passes. No code or time limit changes between these runs. File log: `tests-swap-line-resume.txt`.
- `plugin-ui`: pass on the M1 at `ce45aa3c`, in 140.3 seconds. The runner ends with `check-runner: M1 exit 0 at ce45aa3c`. Log: `checks-swap-line-3.txt`.
- Both captures pass visual review. The words use two lines at 320 px and one at 393 px. The portrait stays in the row. Captures: `swap-line-320.png` and `swap-line-393.png` in the lane output folder.

No part of T4 or T5 remains unbuilt. The taste choices are the existing 36 px round face in a 44 px control, and the 4 px gap between the two draw rows.

## Review repair

Status: in progress.

1. Check both review findings against the source and the available art.
2. Add a test for Catapult, Reaver and a designed piece in both colours. Use a letter tile when no portrait exists. Check the tile, its rules action and its row bounds at 320 and 393 px.
3. Run `npm test` with the local test database. Commit the repair. Run `plugin-ui` through the owner's check runner, then record the result.

Review A, finding 1: confirmed. The portrait lookup can return no URL. These three piece types also have no rulebook icon, so the repair needs a letter tile.

Review A, finding 2: no fault. `pieceTitle` uses the shared name and keeps the rest of a custom name. The existing test checks `Old Ward`. No title change is needed.

Review B finds no T5 fault. Its T4 result misses the unchecked portrait lookup. The solo create schema accepts a FEN or a back rank (`src/match/protocol.ts`), so a lab piece can reach the board without a pool draw. The new test also covers a game view that contains a designed piece. The current create schema has no design option.

The repair uses the piece letter when the art lookup has no URL. A designed piece uses its chosen letter. The rules action keeps its name and size. Eight new cases check both colours of Catapult, Reaver, plain Templar and Old Ward at both widths. They check the letter, absence of a broken image, row bounds, rules sheet and return focus.

`npm test` passes with the local test database: 178 files pass, with 2,877 tests passed, one expected failure and eight skipped. All 50 art tests pass. The type check passes in the same command. Log: `tests-swap-line-fix-full-1.txt` in the lane output folder. The queued file-only run stops before it gets the lock; the full run covers its cases.

The browser check follows the repair commit. No server code changes, so this step needs `plugin-ui` only.

The first two browser runs at `3aa38616` fail in the same later move-history sample. Both pass the portrait checks. The T2 sample changes the game id but keeps the prior game's history. The board cannot restore the expected knight capture from that history. It waits for 30 seconds, then fails. The page's later poll returns the real solo game; that final state first points to a read race, but the source shows that the sample lacks a matching full history before the poll.

The check repair gives that new game its own initial FEN and action list. The existing browser assertion for the knight capture checks the repair. No product code or time limit changes. Logs: `checks-swap-line-fix-2.txt` and `checks-swap-line-fix-3.txt`. The first launch has no active runner or output, so it gives no check result.
