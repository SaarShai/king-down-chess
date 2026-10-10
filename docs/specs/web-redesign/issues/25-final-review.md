# Final review fixes

Status: resolved
Type: task

## Plan

1. Merge main. Keep all Archer readings and the new lesson target.
2. Merge each batch 2 UX branch only when all its jobs pass.
3. Fix S1, S2, S3, P1, P2, and P3 from the final review.
4. Run all tests and browser checks. Render each changed sample.
5. Commit and push this branch.

## Checks

- The guide test checks far2 text and legal shots through the read interface.
- Browser checks reject forced page errors.
- Menu Today warns before it ends a match, including a match kept by a lesson and a staged end.
- npm test and the full npm run check:browser pass.
- Changed player views have new sample sheets.

## Progress

- Both table jobs and the Workshop job have exit 0 and ok true. Both branches qualify for merge.

- Main and both eligible UX branches merge. No branch is skipped.
- Integration: 93 test files pass; 1 skips. 1,665 tests pass; 13 skip. All 50 board tests pass.
- Integration browser checks: turn, game-screen, menu-extra, new-game, workshop, and workshop-cast pass.
- P1: the far2 guide test fails on classic text, then passes with the exhaustive table and six legal far shots. All 12 text entries match main.
- S2: First deal stays fixed. Today uses the current draw. Paladin is in the current pool. Archer lesson checks use d4 and f6.
- S1: forced page errors pass both old checks. Each check now passes its trapped error list to assertNoErrors.
- P2: Menu Today fails the new warning check. Home and Menu Today now use one open function, with the kept match and turn boundary.
- S3 and P3: level descriptions use literal words. The Beast guide names Stop here.
- The push hook requires a clean tree. Push follows the final fix commit.

- Both reading checks now reject forced page errors: read-piece rejects 1; verb-marks rejects 4. Their normal checks pass.
- Menu Today passes with an unfinished match, a lesson-kept match, a staged mate, and a lesson-kept staged mate.
- The Home opener keeps a zero-argument callback. Only openGameSetup accepts setup data. This prevents a click event from entering the setup parser.
- The remaining Archer lesson fixtures in painted-game, lesson-return, and the start-warning probe use f6.
- The cursor check expects the approved ember ring. Its king-square and visible-ring checks stay.
- Full npm run check:browser: all 25 checks pass.
- The main merge omits two assertion trailers. The final fix commit records both reasons; no history changes.

- The W4 sample exposes a shared-selector fault: All rules selects the lesson shelf entry instead of the piece rule card. A new Archer browser case fails before the fix. The lookup now uses the rule-card container. Read-piece, verb-marks, and lessons pass after the fix.
- The W4 frozen sample uses the power coin and Use action through the shared helper.

## Final checks

- All six review findings are fixed. The sample also finds and fixes the rule-card focus fault.
- The full browser suite passes after the final guide fix: 25 checks. General QA has 17 passes and no failures.
- All 150 new sample renders pass. New sheets: W1/sheet.png, W2/sheet.png, W4/sheet.png, W7/sheet.png, W8/sheet.png, W9/sheet.png, W12/sheet.png.
- The phone renders show the complete far2 text, the kept-game warning, and clear player strips at 320 by 568.
- All three merge heads are ancestors of this branch. Both UX branches qualify; none is skipped.
- The push hook runs npm test on the committed tree before it permits the push.
