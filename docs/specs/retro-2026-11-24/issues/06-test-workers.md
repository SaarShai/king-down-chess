# Test workers: the seat tap repair, and 4 workers stay

Status: done in PR 467 for the repair of the seat tap. Ticket [07](07-plugin-app-workers.md) finds and repairs the causes of the two `plugin-app` reds. Open: its pass bar with 8 workers failed on two other files with no proven cause, so `maxWorkers` stays 4.

Source: [retro](../retro.md), item 11

## Problem

The full `npm test` takes about 525 s with `maxWorkers: 4`. This Mac has 16 cores. The retro ran the suite two times with 8 workers: 327 s and 312 s. One of the two runs failed `tools/plugin-ios-size.test.ts`, the test "keeps the seat and board large at 393 × 852 with host insets 102/118". The retro kept 4 workers until the cause is known.

## Cause

### The seat tap (found and repaired)

The test reads the box of the seat board before the board has its size.

- The failure line in the retro log: `A setup piece keeps its touch drag guard: expected false to be true`, at line 86 of the test file at that time (line 87 on main before this change). The value is `false`, not `undefined`. Thus the tap hits the canvas and its `touchstart` listener runs, but `PaintedView` starts no drag (`dragFrom` is null): the tap is not on an own piece.
- `PaintedView` sizes the canvas in a ResizeObserver callback (`src/render/PaintedView.ts`). The seat moves `#board` into its slot, so the canvas is 0 × 0 until a frame delivers that callback.
- A sampler in the frame (each frame and each resize, 393 × 852, 8 runs): the seat shows at about 65 ms with the canvas at `197,351` and 0 × 0. The canvas gets `5,147` and 384 px at about 155 ms. `#board` has `aria-busy="false"` before the seat shows (`src/plugin/board-view.ts` sets it once, at boot), so that wait gives nothing here.
- If the box read comes in that window, the test taps at (197, 351). After the resize, that point is in the middle of the board, on an empty square. The guard is then `false`, as in the retro log.
- Forced order (a probe copy of the test steps; ResizeObserver callbacks in the frame held 150 ms or 400 ms, and a wait between the box read and the tap): each run without the repair is red with the same line, the box `197,351,0` and the canvas `5,147,384` at `pointerdown` (6 of 6: 2 read the box in the task that shows the seat, 4 hold the ResizeObserver 150 ms or 400 ms). Each run with the repair is green (4 of 4, with the hold). The probe is a copy of the test steps; the committed test did not run with this trigger.
- Not measured: that 8 workers delay the frame into that window. This is an inference. A CPU throttle of the page (1× to 30×, 16 runs) gives no red, because it slows the frames and the test commands together.
- Rejected: a seat animation that takes the `pointerdown` (the probe shows that `pointerdown` reaches the canvas, and no animation runs), and a position that is not set (`seat.ts` calls `board.sync` in the same task that shows the seat).

This is a test fault, not a product fault. The canvas is 0 × 0 only until the first ResizeObserver callback after the seat shows (about 90 ms in the sampler). The output of the sampler and of the CPU throttle runs is not in the log folder.

### A second red with 8 workers (cause not found)

The first full run of the pass bar failed a different test: `tools/plugin-app.test.ts`, "keeps two failed polls silent, resets the count on a good read, and locks after three failures". Line 2018: `expected true to be false`. Try again shows after the second failed poll of the second offline window. The test took 950 ms; the run took 274 s.

Try again shows through a read notice. The app sets it after a third failed poll with no good read between, or after one failed read. So the read after `setOffline(false)` did not reset the count, or one more read failed.

- Rejected: the timed poll. The test takes less than 1 s, and the shortest poll delay is 3 s.
- Rejected: a late network change. 300 offline and online changes, each followed at once by a fetch from the host page, give 0 late changes, also with 20 busy threads.
- No repro: an instrumented copy of the test (each store action, each call with its error text, each read outcome) is green 16 of 16 times with or without busy threads. It is green 150 of 150 times in each of two runs with the other plugin files as load.
- The retro data has no earlier failure of this test.

### A third red, outside the pass bar

The second run of the plugin files and the poll probe (259 s) failed one more test in the same file: "recovers a held move at 10 seconds and ignores its late reply", at line 1379. `locator.click: Timeout 5000ms exceeded`, while it waits for `#end-turn[aria-disabled="false"]`. `tools/plugin-app.test.ts` has fixed 5 s limits with no `STEP`. The cause is not found. This run is weaker evidence: it is not a pass-bar run, and it also held the probe copy of `plugin-app` (a second harness and browser, 150 page opens). Its worker count is not recorded: the run started at 23:47:04 and `vite.config.ts` went back to 4 at 23:47:10, so it most likely used 8.

The decision comes from the pass-bar full run 1: 8 workers, the repair in place, no probe in the tree, and a red with no proven cause. Thus the stop rule applies: `maxWorkers` stays 4.

## Change

- `tools/plugin-ios-size.test.ts`: before the box read, the test calls `waitForBoardPaint` (a helper in the same file). It waits until the canvas is visible with a non-zero box, its animations end, and one frame passes.
- `vite.config.ts`: no change. The 8-worker setting (`process.env.CI ? 4 : 8`) went back to 4 after the red in the pass bar.

## Checks

Times are the vitest `Duration`. "Loaded run": `KINGDOWN_TEST_FILE='tools/plugin-{ios-size,board}*.test.ts'` (4 files) with `KINGDOWN_TEST_NO_TYPECHECK=1`.

| Run | Workers | Repair | Time | Result |
| --- | --- | --- | --- | --- |
| Loaded run 1 to 6 | 8 | no | 116, 115, 117, 118, 119, 116 s | green (6 of 6) |
| Full run 1 | 8 | no | 324 s | green |
| Full run 2 | 8 | no | 339 s | void: the only red is a probe file that moved out during the run; the other 410 files pass |
| Full run 3 (probe in the test) | 8 | no | 297 s | green |
| Forced order, no repair | 1 file | no | 1 s each | red (6 of 6), the retro line |
| Forced order, repair | 1 file | yes | 1 s each | green (4 of 4) |
| Loaded run 1 to 10 (pass bar) | 8 | yes | 116, 117, 116, 111, 111, 111, 112, 112, 111, 111 s | green (10 of 10) |
| Full run 1 (pass bar) | 8 | yes | 274 s | red: `tools/plugin-app.test.ts:2018` |
| Plugin files and poll probe, run 1 | 8 | yes | 307 s | green (40 files; 150 of 150 probe repeats) |
| Plugin files and poll probe, run 2 | 8 (most likely) | yes | 259 s | red: `tools/plugin-app.test.ts:1379` (150 of 150 probe repeats green) |

The pass bar fails. Full runs 2 and 3 of the pass bar did not run.

The 10 slowest files, from the red full run (pass-bar full run 1, 8 workers, 274 s):

| File | Time |
| --- | --- |
| `tools/deploy.test.ts` | 273.6 s |
| `tools/plugin-app.test.ts` | 214.6 s |
| `tools/plugin-board.test.ts` | 133.5 s |
| `tools/plugin-board-drafts.test.ts` | 103.4 s |
| `tools/plugin-board-input.test.ts` | 89.9 s |
| `tools/plugin-motion.test.ts` | 89.6 s |
| `src/ai/search.test.ts` | 80.1 s |
| `tools/plugin-races.test.ts` | 77.6 s |
| `src/interface/people/screens/pages.test.ts` | 65.7 s |
| `tools/plugin-ios-size.test.ts` | 62.1 s |

`tools/deploy.test.ts` takes almost all of the run. With 8 workers, that one file sets the shortest full run.

## Known limits

- The natural red of the seat tap did not come back on this Mac: 0 of 6 loaded runs and 0 of 2 valid full runs before the repair (the retro: 1 of 2). The proof of the cause is the forced order, not a natural red.
- The lead ran the committed state: `KINGDOWN_TEST_FILE=tools/plugin-ios-size.test.ts npm test` with 4 workers passes (33 tests, 55 s). The builder ran the repaired file with 8 workers only: 10 loaded runs, 1 full run and 2 runs of the plugin files.
- No run shows if the two plugin-app reds also occur with 4 workers.
- Full run 3 before the repair had a probe in the test, which adds steps before the tap.
- The loaded run (4 files) keeps only 4 of the 8 workers busy. Its greens show less than the full runs.
- The two plugin-app reds have no cause. To find them, run full suites with 8 workers and instrumented copies of those tests until one is red, then read its log.
- Other sessions of the owner share the machine. The times change with their load.

## Review

- Review: an agent that did not build the change read head `2408560e2`. It found no blocking fault. It confirmed the cause in the code: the ResizeObserver of `src/render/PaintedView.ts` gives the canvas 0 px while the board is in a hidden screen, and `waitForBoardPaint` needs a canvas with a box. One batch repairs its six notes, all in the docs: the limit of the line 1379 red, the true gain of a split of `tools/deploy.test.ts`, the two `--publish` sections, the words on the 0 × 0 window, this status line, and the line number.
- Repair check: the same reviewer read `edf60938d`. Each repair holds in substance. The lead then corrected three small notes of that check in the docs: the heading of item 11, the numbers of the split gain (each from one run), and this status line.
- Open findings: none that block.
