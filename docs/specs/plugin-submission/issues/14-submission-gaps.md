# 14 · Submission gaps: accessible game rows

Type: task
Status: closed

## Scope

Build F8 only on `claude/sub-gaps`. Use the approved ticket 14 and the owner's F8 pick.
Give Your games and Profile history feature marks accessible names. Give each history result mark a role.
Keep the same look. Do not change `features()`, E5 or B4.

## Plan

1. Add a test that reads the accessible names of both lists and all three results.
2. Use `features()` in both lists. Map the history power flag to `kingPowers`. Add a role to W/D/L.
3. Run the test, `npx tsc --noEmit` and `npm test`. Run `plugin-ui` on the M1 with the shared check lock.
4. Check the diff and commit with both required trailers. Do not push, merge or deploy.

## Verification criteria

- The test fails on the old code and passes with the fix.
- Only enabled features have names. History names include King powers when `powers` is true.
- The result marks expose won, drawn and lost. Their visible letters stay W, D and L.
- The feature icons and row look stay the same. No test or check time limit changes.
- Typecheck, tests and the M1 browser check pass. Server code does not change, so `plugin-ui-http` is not required.

## Results

- Your games and Profile history use `features()`. History maps `powers` to `kingPowers`.
- W/D/L keep their visible letters and expose won, drawn and lost as named images.
- One CSS rule keeps the Profile feature icons at their old positions. The test compares each row with its old icon markup.
- The new test fails on the old code: Your games exposes no feature names. The other 21 Profile tests pass.
- With the fix, all 22 Profile tests and 50 artwork tests pass on the M1. The test reads both lists, each feature flag and all three results.
- `npx tsc --noEmit` and the commit hooks pass. The M1 `plugin-ui` browser check passes in 226.9 seconds on code commit `b04e8058`.
- The full local `npm test` run ends with 2,570 passes, 8 skips and one timeout across 165 files. The random-board test at `src/rules/power-fixes.test.ts:470` exceeds its 5-second limit. That test and its engine files have no change from the base.
- All 35 tests in that rule file pass when run alone on the M1. The full-suite timeout remains a check limit; no test or check limit changes.
- E5 and B4 stay out of scope at the owner's request. No taste choice is needed.
