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

## PR 173 repair plan

The independent Standards and Spec review finds three faults at `f5227b3e`.

1. Add refusal tests for a failed commit status, a base change during the CI
   request, and slow requests that use the four-hour budget. Show each failure
   before the code change.
2. Check commit statuses as well as check-runs. Read the current PR and review
   record before merge. Use elapsed time for requests, pauses, and merge.
3. Run the affected tests and doc checks with the shared locks. Inspect the
   diff. Commit with the existing hooks and push to the same PR branch.

Pass criteria: each new case refuses merge. Pending statuses wait. Complete
reviews and passing CI still permit merge within four hours. Each request and
pause fits the remaining time. No hook or gate input changes.

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

The independent Standards and Spec review at `f5227b3e` finds three faults.
The repair addresses each fault:

1. Spec: check-runs alone miss failed commit statuses. The helper now checks
   the combined status on the full head SHA. A failure blocks merge. A pending
   status waits. A head with no commit statuses can pass the check-run guard.
2. Standards and Spec: the old PR response can have an old base. The helper now
   reads the PR after CI, then reads the review record. It compares the record
   with the current base. A changed head, state, or PR number also blocks merge.
3. Standards: 240 attempts can take more than four hours. One elapsed-time
   deadline now covers every request, pause, and the final merge. Each request
   uses the smaller of 60 seconds and the remaining time. The last pause also
   fits the remaining time.

The helper keeps the original CI floor and merge mode. It adds no reviewer
count or command-line override. An independent review is required before merge.
Direct merge commands do not use this guard.

## PR 173 repair evidence

- Before: `KINGDOWN_TEST_FILE=tools/merge-on-green.test.ts` and
  `KINGDOWN_TEST_NAME='refuses commit status|reads the current PR .* again after CI|counts slow requests'`
  with `npm test` exits 1. All six selected cases return `merged` instead of
  refusing merge. The cases cover a failed commit status, four PR changes
  during CI, and slow requests. Both type checks pass. The run skips 65 cases.
  Log: `/private/tmp/kd-pr173b-evidence/red.log`.
- After: `KINGDOWN_TEST_FILE=tools/merge-on-green.test.ts npm test` exits 0.
  All 71 helper tests and 67 drawing tests pass. Both type checks pass.
  Log: `/private/tmp/kd-pr173b-evidence/affected.log`.
- The added cases also check pending and absent statuses, invalid status
  responses, a review that starts during the final PR request, each read at
  the deadline, a 25 ms last pause, and a 25 ms final merge request limit.
- `npm run test:docs` exits 0: 183 tests in 16 files pass.
  Log: `/private/tmp/kd-pr173b-evidence/docs.log`.
- Each test run holds the shared Git test lock. The affected tests and doc
  checks run in that order under one lock. All commands end before commit.
- The diff changes four files. The hooks, gate inputs, packages, game, and
  browser files stay unchanged. This repair uses local stand-ins for GitHub.
  It does not repeat the full suite or run a browser check. No deploy occurs.
- The final change uses one request path and the existing injected test
  functions. It adds no package, timer service, or second merge path.
