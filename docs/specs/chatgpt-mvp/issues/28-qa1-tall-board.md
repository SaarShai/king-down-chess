# Rolling QA 1: tall board (T6)

Status: ready-for-human

Source: ticket 28-qa1-faults. This step covers T6 only. The owner selects Q8 a.

## Plan and checks

1. Open `board-their-turn-393x852.png`. Measure the board, the rows and the empty band. Check the width limit in the source.
2. If the board fills its available width, keep the layout. Add a browser assertion for the measured boxes at 393 x 852. Keep the 320 x 568 and 197 x 426 checks and the 210 px board floor.
3. Run `npx tsc --noEmit` and `npm test` with the local test database. Commit, then run `plugin-ui` through the owner's runner. Record the results.

All three steps pass. No product code changes. T1 to T5 stay as built.

## T6 result

The source image shows about 120 px of empty space. The browser measures 125 px between the move-list box and the bar. The board already fills its available width: a 385 px box inside the 393 px frame, with 4 px on each side. Canvas rounding gives a 384 px canvas. Height does not limit it. Keep the layout under the owner's width-limit clause.

The browser assertion holds these boxes at 393 x 852. Values are rounded pixels in the app frame, in `[left, top, width, height]` order. The assertion allows 1 px for CSS and canvas rounding.

| Box | Measured bounds |
| --- | --- |
| Frame | 0, 0, 393, 756 |
| Board | 4, 44, 385, 411 |
| Canvas | 5, 45, 384, 410 |
| Opponent strip | 0, 0, 393, 44 |
| Your strip | 0, 455, 393, 44 |
| Context | 12, 499, 369, 44 |
| Move list | 12, 543, 369, 44 |
| Bar | 0, 712, 393, 44 |

Both runners measure the same boxes on the final check code. The capture passes visual review. Copy: `tall-board-393.png` in the lane output folder.

## Check repairs

The sample game exists only in the check. A live poll can replace it with the real solo game. Move the existing draw-sample guard before the board samples and drain reads in flight.

The old history sample also lacks its spent-power counts. Its first position has counts `[3,1]`, but its history starts from the plain FEN. Save `toFen(position)` before the moves and use it for the history start. A new assertion checks that this exact history restores the last move. This fixes the cause without a time-limit change.

The T6 sample uses a fresh position and empty history under its own rules, with no cards or powers. It shows the other player's turn.

## Verification

- `npx tsc --noEmit`: pass, including a final run after the check repair.
- `npm test`: pass. All 178 files pass: 2,877 tests passed, one expected failure and eight skipped. All 50 art tests pass. The local test database is set. Log: `tests-tall-board-1.txt`.
- The full unit run precedes the browser-only repairs. Unit and product code do not change after that run. Each repair passes the commit type check and staged gate.
- `node --check tools/plugin-ui-check.mjs` and `git diff --check`: pass.
- Final `plugin-ui`: pass on the M1 at `fb3492d9` in 150.8 seconds. The runner ends with `check-runner: M1 exit 0 at fb3492d9`. It passes the new assertions, `zoomBoardFits`, `zoomEndFits`, `zoomHallFits`, and the existing 320 x 568 checks. The 210 px board floor stays unchanged.
- No server code changes. This step does not need `plugin-ui-http`.

All browser logs are in the lane output folder as `checks-tall-board-<run>.txt`.

| Run | Commit | Runner | Result |
| --- | --- | --- | --- |
| 1 | 8d852a1b | Mac | Fails in the old move-history sample; a live read replaces the sample. |
| 2 | 8d852a1b | Mac | Fails at the known sideways-overflow assert: 274 px in a 197 px screen. |
| 3 | 8d852a1b | M1 | Passes that assert; fails while T6 waits for move history. A live read replaces the sample. |
| 4 | 66bd4825 | M1 | The poll guard holds the sample. T6 still depends on history that does not restore. |
| 5 | 17e5911a | M1 | Fails in the old history sample with the poll stopped. This confirms a second cause. |
| 6 | fb3492d9 | Mac | T6 and the repaired history pass. The old `end fits` assert fails at 360 px. |
| 7 | fb3492d9 | M1 | All checks pass. |

Run 6 first stalls while it copies to the M1. Stop only that copy process by PID. The owner's script then uses its built-in Mac fallback. Run 7 copies to the M1 without a fault. No check time limit changes.

No part of T6 remains. No new taste choice is needed. Keep the existing side margins and low bar. This final commit records results only; the passing browser code stays at `fb3492d9`.
