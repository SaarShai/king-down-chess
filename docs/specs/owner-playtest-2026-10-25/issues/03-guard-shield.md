# 03 — Remove the Guard shield

Status: resolved
Type: task
Source: F-106, owner playtest

## Decision and scope

The owner asks to remove the permanent Guard shield. This change has approval.
Only a king can take a Guard. A Guard cannot take a piece.
Keep these rules and their text. Keep all temporary protection effects.

## Plan

1. Find the Guard state, its drawing code, and each caller.
2. Add a test for a Guard with no shield state. Check temporary protection on the same square.
3. Remove the permanent state and its unused code. Change the effects spec.
4. Run the type check, focused tests, full tests, and three browser checks.
5. Capture the local build at 1280 and 390 px. Inspect both images. Commit the change.

## Checks

- The new Guard test fails before the fix and passes after the fix.
- Temporary effects still show on the Guard square.
- Guard capture rules and rule text stay the same.
- `npx tsc --noEmit -p .` passes.
- Focused effects tests and each changed test file pass through `npm test`.
- The full `npm test` passes once.
- `npm run check:browser effects-states effects-game game-screen` passes under the shared test lock.
- Both local images show a Guard with no permanent shield and no temporary mark.

## Result

The state list no longer adds a permanent Guard state. The renderer has no Guard shield,
ring or crown badge. The workshop sample shows the Guard rule without the effect.
The effects spec and coverage table record the owner's decision.

The Guard rules and their text stay the same. Ward, freeze, Firewall, Holy Light and
Mercy keep their effects. Mercy still shows no pawn exception on an immune Guard.
The drawing code for these effects has no change. No rules file changes.

Logs are in `/private/tmp/claude-501/ci87/run38/guard-shield-files/`.

| Command or check | Result | Log |
| --- | --- | --- |
| `KINGDOWN_TEST_FILE=src/render/effects/states.test.ts KINGDOWN_TEST_NAME='gives an immune Guard\|keeps temporary' npm test` on the source before the fix | Expected failure: all four selected cases show the extra Guard state | `red-test.log` |
| `npx tsc --noEmit -p .` | Pass | `typecheck.log` |
| `KINGDOWN_TEST_FILE='{src/render/effects/*.test.ts}' npm test` | No test files match the single pattern in braces | `focused.log` |
| `KINGDOWN_TEST_FILE='src/render/effects/*.test.ts' npm test` | Pass: 124 effects tests and 57 scene tests | `focused-corrected.log` |
| `KINGDOWN_TEST_FILE=docs/specs/effects-animation/preview/signals/state-flare.test.ts npm test` | Pass: 4 workshop tests and 57 scene tests | `workshop-test.log` |
| `npm test` | Pass: 4,896 tests; 268 skipped; 57 scene tests pass | `full-test.log` |
| `npm run test:docs` | Pass: 176 tests | `docs-test.log` |
| `npm run check:browser effects-states effects-game game-screen` under `bash tools/test-lock.sh` | Pass: all three checks | `browser.log` |
| `node tools/plugin-ui-build.mjs /private/tmp/claude-501/ci87/run38/guard-shield-files/build` | Pass | `capture-build.log` |
| `node /private/tmp/claude-501/ci87/run38/guard-shield-files/capture.mjs` under the same lock | Pass: both images; no page error | `capture.log` |

The publish checks use `pgrep -f '[t]ools/deploy[.]sh'` and inspect each matching PID
with `ps -o pid=,command= -p <PID>`. No matching command runs the deploy script.
See `full-test-publish.log`, `browser-publish.log` and `capture-publish.log`.

The local test host uses the built board page. The position is
`7k/8/8/8/3G4/8/P7/K7 w - - 0 1`. Guard immunity is on. No temporary mark is present.
Both images show the full Guard with no shield, ring or crown badge. The check includes
visual inspection of each image against its before image.

- `/private/tmp/claude-501/ci87/run38/shots/F-106-guard-after-1280.png`
- `/private/tmp/claude-501/ci87/run38/shots/F-106-guard-after-390.png`

The change removes the state at its source and deletes its unused drawing code.
It adds no replacement path or setting. The risk is low and stays in the effects layer.
All requested checks run. The full suite keeps its 268 skipped tests.
No push, pull request, merge or deploy occurs.
