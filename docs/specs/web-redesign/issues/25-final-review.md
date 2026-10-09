# Final review fixes

Status: claimed
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
