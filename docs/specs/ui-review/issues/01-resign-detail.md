# Name the side that resigns

Status: resolved
Type: task

## Finding

Review 1, F7: the result detail names the last mover, then uses an unclear side reference.
The detail can name the winner as the side that resigns.

## Plan and checks

1. Test the detail for White and Black. Run the test before the fix.
2. Name the side in `endReason`. Keep the last move as a separate sentence.
3. Check the result, Review, announcements, and account result paths.
4. Compare before and after images at all five sizes from the request.
5. Run the focused tests, doc checks, and the `end` browser check. Commit this fix.

## Evidence

- Red: `KINGDOWN_TEST_FILE='src/screen/moments.test.ts' npm test` fails on the unclear side reference. One test fails; 15 pass.
- Green: the same command passes all 16 tests. The test command also runs its 67 art checks; all pass.
- `npm run test:docs` passes all 180 checks.
- `npm run check:browser end` passes. It checks both sides in the result detail, Review, and announcement.
- The output folder holds 20 before and 20 after images of the result and Review at the five required sizes.
- The pixel check finds changes only on the result-detail text line. All 10 Review images match exactly.
- `endReason` has one caller: the result detail. Review, announcements, and Home use the correct `resultText` line.
- Account games use the separate helper in `src/plugin/ending.ts`. It does not use this line. No account access occurs.
- This ticket shares the fix commit. The hook runs with no change to its inputs.
