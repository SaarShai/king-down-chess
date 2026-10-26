# State the Undo limit

Status: resolved
Type: task

## Finding

Review 2, F6: the Undo title does not state that Undo stops at End turn.

## Plan and checks

1. Test the title in both entry pages. Run the test before the fix.
2. State the current turn limit. Keep the rule and the visible label.
3. Search all tests and check files for the old text and the control selector.
4. Compare before and after images of the move preview and the next turn at all five sizes.
5. Run the focused tests, doc checks, and the `turn` browser check. Commit this fix.

## Evidence

- Red: `KINGDOWN_TEST_FILE='tools/ui-text.test.ts' npm test` fails both title checks.
- Green: the same command passes both checks. The test command also runs its 67 art checks; all pass.
- Both entry pages say `Undo a move in this turn (Z)`. The rule and the visible label stay the same.
- The search covers `src/**/*.test.ts` and all of `tools/`. No old title remains. The `#undo` selector stays the same.
- `npm run test:docs` passes all 180 checks.
- `npm run check:browser turn` passes. It checks the title and the Undo limit before and after End turn.
- The output folder holds 10 initial before images and 10 after images at the five required sizes.
- Three initial preview images differ in pending board paint. The settled repeat uses a paused fake clock.
- The repeat captures the old and new title on the same settled board. All 10 image pairs match exactly.
- The source tests and the browser read the native title. A page image does not show the native tooltip.
- The design scan reports warnings in the existing HTML. The title edit adds none of those patterns.
- This ticket shares the fix commit. The hook runs with no change to its inputs.
