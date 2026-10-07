# 09: Each review fix names its check

**What to build:** The owner opens the review's fix table and sees, for each of the 29 fixes, where its check runs, or why none runs. A new "Checked by" column holds the browser check `workshop` and its group (fixes 4, 5, 6, 9, 13, 20, 27, 29, the line edge of 28, and the others that the check covers), the judge test (the Why? band of 28), the motion seam (fix 26, whose gradients and seams are "superseded"), a vitest by title where one covers the fix, "superseded" for the fixes the redesign removed, and "not checked: preview page outside the build" for fix 25. A fix-table lint fails when a row has no value, or names a check group or test title that does not exist.

**Blocked by:** 05, 07, 08; checks-and-hooks/01 (the `test:docs` script that runs the doc-lint suffix)

**Status:** resolved

- [x] The fix table has a "Checked by" column, and each of the 29 rows has a value.
- [x] Each value is a check group name that occurs in the `workshop` check, a test title that occurs in a Workshop test file, "superseded", or "not checked: <reason>".
- [x] Fix 25 reads "not checked: preview page outside the build"; fix 26 names the motion seam's test and reads "superseded" for its gradients and seams.
- [x] The fix-table lint is a vitest with the doc-lint suffix of checks-and-hooks; it fails on an empty cell and on a name that occurs in no check or test (each case checked once by hand).
- [x] `npm test` passes, and `npm run test:docs` runs the lint.

**Verify:** `npm test`; `npm run test:docs`

**Owns:** docs/visual-design/workshop/REVIEW-2026-10-06.md, src/workshop/review.docs.test.ts (new)

## Comments

Build 2026-10-07, branch `build/workshop-finish-09`. The spec and the code agree; no change to the spec.

- **The column.** `docs/visual-design/workshop/REVIEW-2026-10-06.md` has the column "Checked by" on all 29 rows. A cell holds entries separated by "; ": `` `workshop` `<group>` ``, `` `<file>.test.ts` `<full test title>` ``, `superseded` or `not checked: <reason>`, each with an optional note in parentheses. A short legend above the table tells this; it replaces the stale sentence "§8b and the unit tests pin the fixes".
- **Values.** Browser groups: fixes 2, 4, 5, 6, 9, 11, 13, 20, 23, 27, 28 (the line edge) and 29 by their own `fixN…` group; 1 (`keyboardAndRefusedSave`), 3 (`sharedLink`), 7 and 14 (`tryIt`), 10 (`separateChannels`), 11 (`boardsInView`), 17 (`shareTryReload`), 26 (`motionSetA`), 27 (`tapOutside`). Unit tests by title: 1, 2, 19 (`ui.test.ts`); 3, 8, 16, 18, 22 (`model.test.ts`); 7 (`moves.test.ts`); 12, 14, 15, 28 the Why? band (`judge.test.ts`). Superseded: 10, 16, 17 (the Auto body and the Black mirrors note), 21, 22, 24, 26 (gradients and seams). Fix 25: "not checked: preview page outside the build".
- **Part coverage, not a fault of this ticket.** Fix 1: Copy link and Delete under a refused save have no check. Fix 8: the disabled reason of "Always". Fix 12: the overlap note. Fix 19: the HOME note. The notes name the part that each entry checks.
- **Lint.** `src/workshop/review.docs.test.ts` (6 tests). On the real file: no fault, and fixes 25 and 26 hold their fixed values. On fixtures: a valid cell of each kind passes; an empty cell, free text, a group that the check defines but does not call, a missing group, a missing test file, a missing title, a missing column and a wrong row count each fail with a line that names the fix. A group exists when `tools/verify-workshop.mjs` defines it as a function and calls it with `await`; a title exists when an `it` or `test` call in that file has it, escapes removed.
- **By hand, each case one time** (file restored after each): fix 29 cell emptied → `fix 29 (Toasts across screens): "Checked by" is empty`; `fix13SafeRule` → `fix13SafeRules` → `the check workshop has no group fix13SafeRules`; fix 7 title cut → `moves.test.ts has no test "a rook that takes again"`. Each run: 1 failed, 5 passed.
- **Commands.** `npm test`: tsc clean, vitest 65 files and 1269 tests passed, node tests 42 passed. `npm run test:docs`: 3 files, 59 tests passed, `review.docs.test.ts` among them. `git merge claude/retro-2026-10-06`: already up to date at `e01bbae`.
- **Seen, not changed (not owned here).** `tools/verify-workshop.mjs` line 566 cites `docs/visual-design/workshop/rework-2026-10-06/REVIEW.md`, a path that does not exist; the file is `REVIEW-2026-10-06.md`. Ticket 12 (the Workshop doc) or the next edit of the check can fix it.
