# Result start and focus

Status: resolved

## Finding

Review 2, F8: At 320×568, Rematch takes focus. The result opens at scrollTop 172. It hides the king art and the King Down line.

## Plan and checks

1. Add a live checkmate case at the five normal sizes. Save the result before the fix. Check its focus and scroll position.
2. Show that the check fails. Move initial focus to the heading. Reset the result scroll on open.
3. Check wheel and keyboard access to the actions. Run the focused tests, docs checks, and result and end browser checks. Compare the images. Commit this fix.

The result must open at the top with focus on its heading. Scroll must reach all actions. The board outside the result must stay the same.

## Fix and proof

- Move autofocus from Rematch to the heading. Set heading focus without scroll, then reset scrollTop to zero on each open.
- Red: `npm run check:browser layout-result` fails. At 320×568, scrollTop is 172. At 852×393, it is 217. Both hide the king art.
- Green: `KINGDOWN_TEST_FILE='src/ceremony-game.test.ts' npm test` passes 15 cases. `npm run test:docs` passes 180 cases. `npm run check:browser layout-result end` passes both checks.
- The result opens at scrollTop zero with heading focus at all five normal sizes. Wheel scroll reaches all three actions at 320×568. Tab reaches Rematch.
- The 375×812, 768×1024, and 1280×800 images match exactly. The small phone and landscape images show the intended scroll change.
- The board outside the result has zero changed pixels at all five sizes. Let the browser clock run for 100 ms after the result opens before each capture. This gives the final board frame time to draw.
- Search the source tests and tools for result focus and selectors. Replace the old end focus assertion. Keep the controls and their text. Use the browser clock for the end check's time changes. Pause the clock while New game opens from the menu, so the Ceremony stays active. Wait for the dialog to be visible before focus. Resume the clock after the case.
- The staging merge checks expose an intermittent failure at New game or its focus check. The clock control fixes the check without a change to its assertions or limits. The end check passes alone and in the final group.
- Final checks: 40 cases pass in the three focused files; 180 doc cases pass; all seven selected browser checks pass.
- The visual scan reports four items in unchanged code: one easing value, two image tags whose source is set by code, and heading sizes from an HTML-only scan. These items stay outside this fix.
