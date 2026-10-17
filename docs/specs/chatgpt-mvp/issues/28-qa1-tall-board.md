# Rolling QA 1: tall board (T6)

Status: claimed

Source: ticket 28-qa1-faults. This step covers T6 only. The owner selects Q8 a.

## Plan and checks

1. Open `board-their-turn-393x852.png`. Measure the board, the rows and the empty band. Check the width limit in the source.
2. If the board fills its available width, keep the layout. Add a browser assertion for the measured boxes at 393 x 852. Keep the 320 x 568 and 197 x 426 checks and the 210 px board floor.
3. Run `npx tsc --noEmit` and `npm test` with the local test database. Commit, then run `plugin-ui` through the owner's runner. Record the results.

## Findings

The image shows about 120 px between the move list and the bar. The table gives the board the frame width less 8 px for its side margins. At 393 px, this gives a 385 px board box. The renderer fills that width when height permits it. Keep the layout under the owner's width-limit clause.

## Check repair

At `8d852a1b`, browser run 1 fails at the existing move-history sample. Run 2 fails at the known sideways-overflow assertion (274 px in a 197 px screen). Run 3 passes both of those steps, then fails while the new T6 sample loads. Runs 1 and 3 show that a background read replaces the sample with the real solo game. The draw samples already stop this poll with the document's hidden flag. Move that guard before all board samples and drain the reads in flight. No product code or time limit changes.

The type check passes. The full unit run passes: 178 files, 2,877 tests passed, one expected failure and eight skipped. All 50 art tests pass. Log: `tests-tall-board-1.txt` in the lane output folder.
