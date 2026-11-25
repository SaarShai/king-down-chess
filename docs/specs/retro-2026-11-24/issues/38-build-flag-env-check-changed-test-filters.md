# Clear the test filters in the npm test call of check:changed

Status: ready-for-agent
Source: the change rehearsals and guard checks of 2026-11-25 ([ticket 10](10-change-rehearsals.md), [ticket 11](11-guards-that-cannot-fail.md), [ticket 12](12-lessons-and-checks.md))

## Problem

- tools/ci-plan.mjs:62 (mode 'changed', `npm run check:changed`) runs `run(['test'], { ...env, KINGDOWN_TEST_FILE: filePattern(tests), KINGDOWN_TEST_NO_TYPECHECK: '1' })`. It does not clear KINGDOWN_TEST_DOCS, KINGDOWN_TEST_SKIP or KINGDOWN_TEST_NAME.
- The 'tests' mode at tools/ci-plan.mjs:80 clears all five filters, with the comment "'' drops each filter that the caller's shell holds".
- Result: when the caller's shell holds KINGDOWN_TEST_NAME, KINGDOWN_TEST_SKIP or KINGDOWN_TEST_DOCS, check:changed runs a subset (vite.config.ts:222-224). With KINGDOWN_TEST_DOCS it runs the doc lints only, and tools/test-lock-guard.ts:5 lets it pass. The run is green, but it does not run the selected tests. Found by reading only; not run.
- tools/build-flags.test.ts (branch guard-build-flag-env) checks only the 'tests' mode call. It cannot check the 'changed' call before this repair, because it would be red on the real tree.

## Change

At tools/ci-plan.mjs:62, add `KINGDOWN_TEST_DOCS: '', KINGDOWN_TEST_SKIP: '', KINGDOWN_TEST_NAME: ''` to the object. This changes behaviour, so it needs its own review. Then change tools/build-flags.test.ts to check each `run(['test'], ...)` call in tools/ci-plan.mjs, not only the call of the 'tests' mode.

Also decide on the names in KEPT of tools/build-flags.test.ts: KINGDOWN_TEST_PAGES (src/interface/people/screens/build.test.ts stubs its own value) and KINGDOWN_TEST_OUT (output folder of ios/store.test.ts). The current pick is to keep them.

## Test that fails first

After the change in tools/build-flags.test.ts and before the repair of line 62: expect "tools/ci-plan.mjs reads ... Add KINGDOWN_TEST_DOCS: '' ..." for the 'changed' call. After the repair: green.

## Known limits

- The test reads source text. A new form of the call (for example a helper) breaks the parse. The test 'finds the clear list of the child npm test' then fails, which is a safe failure.

## Work record

Not started.
