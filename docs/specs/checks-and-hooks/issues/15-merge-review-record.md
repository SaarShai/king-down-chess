# Require a review record before merge

Status: done
Type: task

The owner requests retro item 2. Base: `f8fcec0a4d282822fbde913813eff386f2f9c0f2`.

## Fault

The supplied merge waiter checks CI and the head commit. It does not check
review state. It can merge while a requested review runs.

## Plan

1. Add a test with passing CI and a running review. Run it against the supplied
   waiter. Keep the failure as evidence.
2. Add one helper in `tools/`. Require the PR, head, base, review IDs, results,
   and open findings. Require a recorded check for an older review. Keep the
   full-head merge check. Document the command in `docs/DELEGATION.md`.
3. Run the affected tests, full `npm test`, and `npm run test:docs` with the
   shared test lock. Inspect the diff. Commit, push, and open a PR into main.

## Acceptance

- A missing or invalid record refuses the merge.
- A requested review that runs, lacks a result, or has an open finding refuses
  the merge. A failed or cancelled review also refuses the merge.
- The record identifies the current PR, head, and base. An older review needs
  a recorded check against the current head and base.
- Complete reviews with no open findings and passing CI permit the merge.
- All check-runs use the full head commit. The helper keeps the existing floor
  of 11 checks, the 60-second interval, and the four-hour limit.
- Tests use local stand-ins. They make no GitHub calls.

## Evidence

- Before: `KINGDOWN_TEST_FILE=tools/merge-on-green.test.ts npm test` exits 1.
  The test uses the supplied `merge-on-green2.sh` and a local `gh` stand-in.
  With 11 passing CI checks and `review-1` still running, the waiter sends
  `gh pr merge 158 --match-head-commit aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`.
  The assertion expects no merge command. Log: `/private/tmp/merge-review-before.log`.
  The final test uses the same refusal case against the new helper.
- After: the same command exits 0. All 52 helper tests and all 67 drawing tests
  pass. The type checks pass. Log: `/private/tmp/merge-review-after.log`.
- Local database setup passes with the documented disposable database on port
  55432. Log: `/private/tmp/merge-review-db-init.log`.
- Full `npm test` exits 1: 5,749 pass, 5 fail, and 8 skip across 288 files.
  Four failures are browser locator timeouts. One is an assertion failure in
  the draft motion fallback case. The failed files are `tools/plugin-board.test.ts`,
  `tools/plugin-board-input.test.ts`, and `tools/plugin-board-drafts.test.ts`.
  All three files match the base commit. The helper tests pass in this run too.
  Log: `/private/tmp/merge-review-full.log`.
- Failed cases: draft restore after remount (D9), reduced-motion capture sound
  (F10), Undo during a Haste shove (G3), motion failure fallback (W7), and
  ceremony cancellation at 320 by 568. This patch does not repair these cases.
- `npm run test:docs` exits 0: all 183 tests in 16 files pass.
  Log: `/private/tmp/merge-review-docs.log`.
- The affected tests, local database setup, full suite, and doc checks use one
  shared `tools/test-lock.sh` lock in that order. All commands end before commit.
- `git diff --cached --check` passes. The patch changes four files. It adds no
  package, browser, database, or animation-bank change.

## Review

The guard checks the record again after the CI request. The tests also check
that a second running review blocks merge. The helper keeps the original CI
floor and merge mode. It adds no reviewer count or command-line override.
An independent review is required before merge. Direct merge commands do not
use this guard.
