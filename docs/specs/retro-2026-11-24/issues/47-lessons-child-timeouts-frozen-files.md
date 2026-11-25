# Add a timeout to each synchronous child call in the 22 frozen test files

Status: ready-for-agent
Source: the change rehearsals and guard checks of 2026-11-25 ([ticket 10](10-change-rehearsals.md), [ticket 11](11-guards-that-cannot-fail.md), [ticket 12](12-lessons-and-checks.md))

## Problem
The guard tools/child-timeouts-ratchet.test.ts (commit 6c3c709d7, branch guard-lessons) freezes 44 calls to execFileSync, spawnSync or execSync with no timeout, in 22 test files. Examples: tools/engines.test.ts (4 calls), tools/anim/recolor.test.ts (6 calls), tools/test-lock.test.ts (4 calls), tools/character-runtime-package.test.ts (5 calls). The full list is the UNBOUNDED table in the guard. A hung child in one of these calls holds the test worker past the vitest limit. Then npm test does not end and the shared machine lease stays taken.

## Change
For each file in UNBOUNDED, add `timeout: <ms>` to the options of each call. Use a value below the limit of the test that makes the call (below 5000 ms for the default limit, below the value of vi.setConfig or of the test option when the file sets one). Then lower the count of the file in UNBOUNDED, or remove the line at 0. Some files are protected for now and need their own lane: tools/plugin-server-build.test.ts and tools/offline-build.test.ts (seam lanes), .claude/hooks/session-facts.test.ts and .claude/hooks/tool-gate.test.ts (tracker files, .claude/**). The line for tools/child-timeouts.test.ts is a parser artifact: make the parser skip it, or keep the count at 1.

## Test that fails first
The guard itself. After a timeout goes into a file, the guard fails with '<file>: <n> unbounded call(s) now; lower its UNBOUNDED count in tools/child-timeouts-ratchet.test.ts to <n>' until the count goes down. Run: KINGDOWN_TEST_FILE='{tools/child-timeouts-ratchet.test.ts,<changed test file>}' KINGDOWN_TEST_NO_TYPECHECK=1 npm test.

## Known limits
The parser counts a call as unbounded when the timeout is in a shared options variable (for example `spawnSync(cmd, args, opts)`). Such a call needs the timeout written in the call, or a count that stays. The parser does not read *.test.mjs files or helper files (for example tools/lib/python-modules.ts; tools/child-timeouts.test.ts checks that one by hand). It does not read ios/ (ios/store.test.ts has calls with no timeout), a call with more than three levels of nested parentheses, or a call through an imported alias of execFileSync, spawnSync or execSync. Repair: add ios/ to the scanned folders and freeze its count, and parse the calls with the oxc parser that tools/game-boundary.test.ts uses.

## Work record
Not started.
