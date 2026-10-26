# Result start and focus

Status: resolved

## Finding

Review 2, F8: At 320×568, Rematch takes focus. The result opens at scrollTop 172. It hides the king art and the King Down line.

PR #157, round 3 uses the wrong Menu rule. Owner picks A8 and A9 require a press during board motion to end that motion and do no second action. During the local topple, the same press also opens the result. Menu stays closed. The canvas-only guard in `eb4cca0c` breaks this rule.

## Plan and checks

1. Add a live checkmate case at the five normal sizes. Save the result before the fix. Check its focus and scroll position.
2. Show that the check fails. Move initial focus to the heading. Reset the result scroll on open.
3. Check wheel and keyboard access to the actions. Run the focused tests, docs checks, and result and end browser checks. Compare the images. Commit this fix.

The result must open at the top with focus on its heading. Scroll must reach all actions. The board outside the result must stay the same.

4. Change the real-clock end check to prove A8/A9. Show that it fails on the product code at `eb4cca0c`.
5. Remove the canvas-only guard and its unit cases. Keep the unit case for a board press whose release leaves the canvas. Keep the title, zoom, and result layout fixes.
6. Fetch and merge `origin/staging/first-game` at `b07d7f74`. Run each requested check alone. Run the WebKit board drafts test from CI. Record the results and commit without a push.

The first Menu press must occur while the final blow is active. It must end motion and open the result with heading focus. Menu must stay closed. After motion ends, Menu and New game must work. The quiet lock must be absent before browser checks.

## Fix and proof

- Move autofocus from Rematch to the heading. Set heading focus without scroll, then reset scrollTop to zero on each open.
- Red: `npm run check:browser layout-result` fails. At 320×568, scrollTop is 172. At 852×393, it is 217. Both hide the king art.
- Green: `KINGDOWN_TEST_FILE='src/ceremony-game.test.ts' npm test` passes 15 cases. `npm run test:docs` passes 180 cases. `npm run check:browser layout-result end` passes both checks.
- The result opens at scrollTop zero with heading focus at all five normal sizes. Wheel scroll reaches all three actions at 320×568. Tab reaches Rematch.
- The 375×812, 768×1024, and 1280×800 images match exactly. The small phone and landscape images show the intended scroll change.
- The board outside the result has zero changed pixels at all five sizes. Let the browser clock run for 100 ms after the result opens before each capture. This gives the final board frame time to draw.
- Search the source tests and tools for result focus and selectors. Replace the old end focus assertion. Keep the controls and their text. Test Menu input with the real clock and confirm the animation is active at the pointer press. Use the test clock only for separate time checks. Wait for the dialog to be visible before focus.
- A paused clock does not prove input during active motion. Check the owner rule first: a Menu press during motion must skip it and keep Menu closed.
- Final checks: 40 cases pass in the three focused files; 180 doc cases pass; all seven selected browser checks pass.
- The visual scan reports four items in unchanged code: one easing value, two image tags whose source is set by code, and heading sizes from an HTML-only scan. These items stay outside this fix.

## Pointer input

- Rule: [owner picks A8/A9](../../../research/web-adaptation-2026-10-18/baseline-post-merge.md) require one press to end motion, with no second action. The same press also ends the local result wait. [The board ticket](../../gui-previews-2026-10-19/issues/gui-prev-board.md) and [the replay check ticket](../../check-flakes/issues/27-openplay-replay-timer.md) use this rule.
- The round 3 brief is wrong. Its margin-press review finding describes the approved rule. Do not change the Ceremony margin listener.
- Test rule: run the Menu cases before the browser test clock is installed. Record the animation state at window capture. Check that the press ends motion, opens the result, and keeps Menu closed. Then close the result and check Menu and New game. Keep the result heading focus check.
- Revert: remove the canvas-only guard from `PaintedView`. Its source now matches the version before `eb4cca0c`. Remove the four unit cases that keep outside controls active during motion. Keep the four board press cases for mouse and touch, including release outside the canvas. The title, zoom, result layout, and Ceremony listener stay unchanged.
- Red: the new real-clock `end` check fails on the product code at `eb4cca0c`: `A8: the skip press keeps Menu closed`. The active-motion assertion passes first.
- Green: `end` passes after the revert and merge. Both Menu presses record `animating: true` and `falling: false`. Each press ends motion and opens the result with heading focus. Menu stays closed. A later Menu press opens the sheet. New game keeps its focus, Enter, and Escape checks.
- Merge: fetch `origin`, then merge `origin/staging/first-game` at `b07d7f74`. There is no conflict. This adds the spent-press fix from #150.
- Browser checks: `end`, `layout-title`, `layout-zoom`, `layout-result`, `home`, `new-game`, `game-screen`, and `king-effects` all pass. The requested command with `board-drafts` stops at name validation, since that name is not in the browser registry. Run its CI test file through `npm test` instead.
- Chromium board drafts: `PLAYABLE_BROWSER=chromium KINGDOWN_TEST_FILE=tools/plugin-board-drafts.test.ts npm test` passes all 65 cases, including the mouse and touch A8 cases.
- WebKit board drafts: use `PLAYABLE_BROWSER=webkit PLAYABLE_CPU_CANVAS=1` with the same test file, as in `.github/workflows/plugin-checks.yml`. The run passes 63 cases, including both A8 cases. The two F-107 Main menu cases fail at line 30: Tab does not give the expected focus state. Both fail at the same line on a separate source copy of `eb4cca0c` with `KINGDOWN_TEST_NAME='F-107'`. This existing local WebKit limit is outside the A8 restore.
- Render: `KINGDOWN_TEST_FILE='src/render/*.test.ts' npm test` passes 61 cases in eight files.
- Motion: `KINGDOWN_TEST_FILE=tools/plugin-motion.test.ts npm test` passes all 27 cases, including `presses a spent card into grey once`.
- All passing `npm test` runs also pass both type checks and 67 scene tests. These are focused runs, not a full-suite pass.
- Docs: `npm run test:docs` passes 180 cases in 15 files. `git diff --check` passes for both staged and unstaged changes.
- The output folder holds the logs in `layout4-evidence`. Each test command runs alone. The quiet lock is absent at each browser start. No push or deploy.
