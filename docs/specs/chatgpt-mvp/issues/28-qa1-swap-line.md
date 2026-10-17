# Rolling QA 1: swap line (T4 and T5)

Status: in-progress

Source: ticket 28-qa1-faults. The owner asks for T4 and T5 only.
The owner selects Q9 b: put the piece portrait before the context words.

## Plan and checks

1. Replace the blank info tile with the piece portrait. Keep All rules, its accessible name, and a 44 px control. At 320 and 393 px, check that the image loads, the control fits in the row, and the words have no more lines than before.
2. Use one shared piece title in both board views. Add a unit test for `White Maester.` and check the built page.
3. Run `npx tsc --noEmit` and `npm test`. Commit, then run `plugin-ui` with the owner's check runner. Read its result before the final report.

## Scope

T1 to T3 and T6 belong to other steps. This step changes no server code.

## Build

- T4: the existing All rules control moves before the context words. It shows the selected piece in its army colour, or the selected king portrait. The 36 px face sits in a 44 px control. The existing touch layer stays in place. The control stays available while a turn sends.
- T5: both board views use `pieceTitle` from `src/read.ts`. It uses the shared name table and keeps custom names. The source search finds no other copy of the colour-and-piece title.
- Tests: the unit test checks White Maester, Black Maester and a custom name. The browser check checks the loaded face, row order, bounds, two text lines, rules sheet and return focus at 320 and 393 px.
- The first full test run finds one old lower-case expectation and two draw-row overlaps in landscape. The draw row keeps its prior total height with a 44 px first row and a 4 px row gap. The existing Menu and row-size tests cover this case.
- The second full test run passes. The first browser run finds an image with no source in the hidden info control. The control now creates its image only after a piece is selected. The existing page image check covers the state before selection.
- The second browser run passes the image, row and words checks. Its focus test uses Escape, which also clears the selected piece. The test now uses the sheet Close button to keep the swap selected. The focus check stays in place.
