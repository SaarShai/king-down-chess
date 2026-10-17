# Rolling QA 1: tall board (T6)

Status: claimed

Source: ticket 28-qa1-faults. This step covers T6 only. The owner selects Q8 a.

## Plan and checks

1. Open `board-their-turn-393x852.png`. Measure the board, the rows and the empty band. Check the width limit in the source.
2. If the board fills its available width, keep the layout. Add a browser assertion for the measured boxes at 393 x 852. Keep the 320 x 568 and 197 x 426 checks and the 210 px board floor.
3. Run `npx tsc --noEmit` and `npm test` with the local test database. Commit, then run `plugin-ui` through the owner's runner. Record the results.

## Findings

The image shows about 120 px between the move list and the bar. The table gives the board the frame width less 8 px for its side margins. At 393 px, this gives a 385 px board box. The renderer fills that width when height permits it. Keep the layout under the owner's width-limit clause.
