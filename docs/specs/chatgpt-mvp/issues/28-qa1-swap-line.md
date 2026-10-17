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
