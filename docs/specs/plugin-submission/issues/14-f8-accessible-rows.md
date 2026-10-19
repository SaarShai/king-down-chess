# 14-f8 · Submission gaps: accessible game rows

Type: task
Status: closed

## Scope

Build F8 only on `claude/sub-gaps`. Use the approved ticket 14 and the owner's F8 pick.
Give Your games, Profile open games and Profile history feature marks accessible names. Give each history result mark a role.
Keep the same look. Do not change `features()`, E5 or B4.
This file records F8 only. It does not close ticket 14 or its E5 and B4 parts.

## Plan

1. Check both review findings against the code and the E5 branch.
2. Add checks for the Profile open rows to the F8 test. Confirm that they fail on the old loop. Use `features()` in `openRow()`.
3. Give F8 its own ticket file. Check that it has no file conflict with E5 and does not close the other parts.
4. Run `npm test` here. Run the Profile test on the old and fixed code, then `plugin-ui`, on the M1 with the shared check lock. Keep all test and check time limits.
5. Check the diff and commit with both required trailers. Do not push, merge or deploy.

## Verification criteria

- The test fails on the old code and passes with the fix.
- Only enabled features have names. History names include King powers when `powers` is true.
- Profile open rows name all enabled features and use the shared name Classic chess.
- The result marks expose won, drawn and lost. Their visible letters stay W, D and L.
- The feature icons and row look stay the same. No test or check time limit changes.
- Typecheck, tests and the M1 browser check pass. Server code does not change, so `plugin-ui-http` is not required.

## Prior results

- Your games and Profile history use `features()`. History maps `powers` to `kingPowers`.
- W/D/L keep their visible letters and expose won, drawn and lost as named images.
- One CSS rule keeps the Profile feature icons at their old positions. The test compares each row with its old icon markup.
- The new test fails on the old code: Your games exposes no feature names. The other 21 Profile tests pass.
- With the fix, all 22 Profile tests and 50 artwork tests pass on the M1. The test reads both lists, each feature flag and all three results.
- `npx tsc --noEmit` and the commit hooks pass. The M1 `plugin-ui` browser check passes in 226.9 seconds on code commit `b04e8058`.
- The full local `npm test` run ends with 2,570 passes, 8 skips and one timeout across 165 files. The random-board test at `src/rules/power-fixes.test.ts:470` exceeds its 5-second limit. That test and its engine files have no change from the base.
- All 35 tests in that rule file pass when run alone on the M1. The full-suite timeout remains a check limit; no test or check limit changes.
- E5 and B4 stay out of scope at the owner's request. No taste choice is needed.

## Review findings and checks

- Review A, finding 1: confirmed. The old `openRow()` has its own icon loop. Each SVG has `aria-hidden`, and each span has only a title. The loop also uses Classic instead of Classic chess.
- Review A, finding 2: confirmed. On `5a198544`, F8 and E5 add `14-submission-gaps.md`. `git merge-tree` reports an add/add conflict. The old title and closed status also cover more than F8. This file now records F8 alone.
- Review B has no findings.
- `openRow()` now uses `features()`. The F8 test reads both Profile open rows, with the full feature set and Classic chess.
- The ticket path and scope checks pass. The F8 file has its own name and states that it does not close E5 or B4. `git merge-tree` against `claude/sub-e5` at `1dbe05dc` has no conflict on either ticket path. Four other conflicts remain outside F8.
- The full local `npm test` run passes on `758dacad`: 165 files, 2,571 tests, 8 skips, and 50 artwork tests. Typecheck passes. The prior random-board timeout does not recur. No test or check time limit changes.
- On the M1, the new open-row check fails on the old loop at `tools/plugin-profile.test.ts:71`. The row exposes no feature names. The other 21 Profile tests pass.
- With the fix, all 22 Profile tests and 50 artwork tests pass on the M1. `plugin-ui` passes on `758dacad` in 230.3 seconds. The job ends with exit 0 and releases the shared browser lock.
- The final diff changes the check record only after `758dacad`. Server code has no change, so `plugin-ui-http` is not required. F8 alone is closed.
- Check logs: `/tmp/kd-sub-gaps-tests.log` holds the passing local suite. `/tmp/kd-sub-gaps-m1.log` records the detached M1 job. The M1 script is `/tmp/kd-sub-gaps-checks.sh`. It releases the lock on exit.
