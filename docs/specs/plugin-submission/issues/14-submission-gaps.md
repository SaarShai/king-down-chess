# 14 · Submission gaps: accessible game rows

Type: task
Status: in-progress

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

Checks are pending.
