# Result start and focus

Status: resolved

## Finding

Review 2, F8: At 320×568, Rematch takes focus. The result opens at scrollTop 172. It hides the king art and the King Down line.

PR #157, review round 2: A Menu press during the final blow opens the result. The document capture handler in `PaintedView` treats every primary pointer press as a board press. It skips the animation and stops the Menu event. The clock pause in the end check hides this path.

## Plan and checks

1. Add a live checkmate case at the five normal sizes. Save the result before the fix. Check its focus and scroll position.
2. Show that the check fails. Move initial focus to the heading. Reset the result scroll on open.
3. Check wheel and keyboard access to the actions. Run the focused tests, docs checks, and result and end browser checks. Compare the images. Commit this fix.

The result must open at the top with focus on its heading. Scroll must reach all actions. The board outside the result must stay the same.

4. Add a real-clock Menu check during the active final blow. Add pointer tests for controls outside the board and for board skips. Show both checks fail before the product fix.
5. Limit the skip handler to a press on its canvas. Keep the board skip and its event consumption. Run the eight requested browser checks, docs checks, and the render and board input tests.
6. Fetch and merge `origin/staging/first-game`. Check the merged code, record the results, and commit without a push.

Menu must receive the press while the final-blow animation is active. New game must keep focus. Mouse and touch board presses must still skip moves and king falls.

## Fix and proof

- Move autofocus from Rematch to the heading. Set heading focus without scroll, then reset scrollTop to zero on each open.
- Red: `npm run check:browser layout-result` fails. At 320×568, scrollTop is 172. At 852×393, it is 217. Both hide the king art.
- Green: `KINGDOWN_TEST_FILE='src/ceremony-game.test.ts' npm test` passes 15 cases. `npm run test:docs` passes 180 cases. `npm run check:browser layout-result end` passes both checks.
- The result opens at scrollTop zero with heading focus at all five normal sizes. Wheel scroll reaches all three actions at 320×568. Tab reaches Rematch.
- The 375×812, 768×1024, and 1280×800 images match exactly. The small phone and landscape images show the intended scroll change.
- The board outside the result has zero changed pixels at all five sizes. Let the browser clock run for 100 ms after the result opens before each capture. This gives the final board frame time to draw.
- Search the source tests and tools for result focus and selectors. Replace the old end focus assertion. Keep the controls and their text. Test Menu input with the real clock and confirm the animation is active at the pointer press. Use the test clock only for separate time checks. Wait for the dialog to be visible before focus.
- The earlier staging merge checks pass with a clock pause before the final blow. Review round 2 shows that this pause hides a product fault. Those passes do not prove Menu input during the active animation.
- Final checks: 40 cases pass in the three focused files; 180 doc cases pass; all seven selected browser checks pass.
- The visual scan reports four items in unchanged code: one easing value, two image tags whose source is set by code, and heading sizes from an HTML-only scan. These items stay outside this fix.

## Pointer input

- Cause: the skip listener runs on `document` in capture mode. It receives a Menu press before Menu does. It checks animation state but not the event target, then calls the Ceremony skip and consumes the press, release, and click.
- Fix: require `e.target === this.canvas` before a pointer press can skip. Keep document capture for the release and click, because a board skip can open the result before the gesture ends. No style, dependency, or game rule changes.
- Test rule: run the Menu cases before the browser test clock is installed. At window capture, record that the final blow is active when Menu receives the press. Check that Menu opens, then that New game keeps its keys and focus. Use the test clock only for the later, separate checks.
- Red on `e100e4c4`: the new `end` check fails at `the real-clock press opens Menu`. The active-animation assertion passes. The new unit check fails in four cases: mouse and touch outside the board during a move and a king fall.
- The unit tests also check that a board press still skips both animation types. The release and click stay consumed when their target is outside the canvas.
- Fetch and merge: `origin/staging/first-game` is at `f306d452`. Git reports `Already up to date.`
- Green: `KINGDOWN_TEST_FILE='{src/render/*.test.ts,src/screen/keys.test.ts,src/ceremony-game.test.ts,tools/lib/tap-board.test.ts}' npm test` passes 87 cases in 11 files, plus 67 scene tests. The type checks pass.
- Browser: `npm run check:browser end layout-title layout-zoom layout-result home new-game game-screen king-effects` passes the first seven checks. Both real-clock Menu presses have `animating: true` and `falling: false`. All prior end-check assertions stay.
- The first `king-effects` run reaches its 240-second limit during frame measurement, after its interaction checks pass. `npm run check:browser king-effects` passes alone in 123.4 seconds with the same limit and no code change.
- Docs: `npm run test:docs` passes 180 cases in 15 files. `git diff --check` passes. The title fix stays unchanged.
- The output folder holds `layout3-evidence`: the red unit log, red browser run, green unit log, eight-check browser run, separate king-effects pass, and docs log. No full suite, sign-in, push, or deploy.
