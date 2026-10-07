# 09: Each review fix names its check

**What to build:** The owner opens the review's fix table and sees, for each of the 29 fixes, where its check runs, or why none runs. A new "Checked by" column holds the browser check `workshop` and its group (fixes 4, 5, 6, 9, 13, 20, 27, 29, the line edge of 28, and the others that the check covers), the judge test (the Why? band of 28), the motion seam (fix 26, whose gradients and seams are "superseded"), a vitest by title where one covers the fix, "superseded" for the fixes the redesign removed, and "not checked: preview page outside the build" for fix 25. A fix-table lint fails when a row has no value, or names a check group or test title that does not exist.

**Blocked by:** 05, 07, 08; checks-and-hooks/01 (the `test:docs` script that runs the doc-lint suffix)

**Status:** ready-for-agent

- [ ] The fix table has a "Checked by" column, and each of the 29 rows has a value.
- [ ] Each value is a check group name that occurs in the `workshop` check, a test title that occurs in a Workshop test file, "superseded", or "not checked: <reason>".
- [ ] Fix 25 reads "not checked: preview page outside the build"; fix 26 names the motion seam's test and reads "superseded" for its gradients and seams.
- [ ] The fix-table lint is a vitest with the doc-lint suffix of checks-and-hooks; it fails on an empty cell and on a name that occurs in no check or test (each case checked once by hand).
- [ ] `npm test` passes, and `npm run test:docs` runs the lint.

**Verify:** `npm test`; `npm run test:docs`

**Owns:** docs/visual-design/workshop/REVIEW-2026-10-06.md, src/workshop/review.docs.test.ts (new)
