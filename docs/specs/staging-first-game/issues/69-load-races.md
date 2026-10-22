# Remove two load-dependent test races

Status: resolved on branch `staging/lane-flaky` (from `staging/integrate` `950f8fb6`); not merged, not deployed.

## What

The full `npm test` on `950f8fb6` failed 2 of 4698 tests while two other lanes ran tests on the same Mac. Each test passed 3 of 3 times alone.

- `tools/plugin-board.test.ts` > "keeps a stored-engine draft through undo, remount and a late preview when the page calculator differs": `AssertionError: expected +0 to be 1`.
- `tools/plugin-races.test.ts` > "R10: a remount keeps a waiting move on A and sends nothing to the shown game (a.out 10)": `locator.evaluate: TypeError: Cannot read properties of undefined (reading 'client')` in `settled`.

## Why

A random failure hides real faults and blocks the staging release.

## Scope

- Test files only: `tools/plugin-board.test.ts`, `tools/plugin-races.test.ts`. No product change: neither race is a product defect.
- No assertion is removed or relaxed. No timeout changes.
- This ticket file.

## Acceptance

- Each red run is recorded under CPU load.
- Each test passes 20 of 20 under the same load.
- Each file passes alone and under load. `npm run typecheck` and `npm run test:docs` pass.

## Result

### Load

Each run uses 16 `yes > /dev/null` processes (this Mac has 16 cores), started by one loop script that stops them by their PIDs at the end. Each run is one `KINGDOWN_TEST_FILE=<file> KINGDOWN_TEST_NAME=<name> npm test`, with `PLUGIN_TEST_DATABASE_URL` set to `kingdown_lane_flaky_test`.

### Causes

1. **Board test: the test reads the match before the route applies the move.** The `kingdown_move` route sets `commit` first and then applies each action to the match with `await match.apply(...)`. The test waits on `commit` (`expect.poll(()=>commit)`) and then reads `(await match.snapshot()).turn`. Under load the apply is not done yet, so the turn is still 0. The real assertion is `tools/plugin-board.test.ts:2532` (`expect(...turn).toBe(1)`). The wrapped error at line 2549 hides it. One red run fails at the next line (2533) for the same cause: `committedFen` is still `undefined` when the poll starts, so the poll compares the board with `undefined`.
2. **R10: the wait counts the old frame's teardown write.** `nextWrite` waits until the host has one more widget write, then sets `harnessApp`. A remount first tears down the old frame, and the old app saves its widget state during teardown. That write ends the wait. `sourceReady` then runs on the old frame, the host replaces the frame, and `settled` reads `harnessApp` on the new frame before the new frame sets it.

### Fix

The pattern is the one of tickets 63 and 64: wait for the fact that the next read needs.

- Board test: the route keeps the apply step as a promise, `applied`, which also sets `committedFen`. The test waits for `applied` after `commit` shows, and before it reads the match turn and `committedFen`.
- R10: a new helper, `remountWrite`, records the write count when the new frame sends `booted`, clicks Remount, and waits for a write after that count. Then it runs `sourceReady` on the new frame. The other `nextWrite` users do not remount, so they stay as they are.

### Red runs (at `950f8fb6`, 20 runs each, under load)

- R10: `done: 19 passed, 1 failed of 20`. Run 16: `Error: locator.evaluate: TypeError: Cannot read properties of undefined (reading 'client')` at `settled tools/plugin-races.test.ts:38:35`, from `tools/plugin-races.test.ts:738:5` (the `settled` call after `nextWrite`).
- Board test: `done: 13 passed, 7 failed of 20`. Runs 4, 6, 7, 8, 13 and 15: `Caused by: AssertionError: expected +0 to be 1` at `tools/plugin-board.test.ts:2532:43`. Run 10: `Caused by: AssertionError: expected '7k/p7/8/8/R7/8/8/6K1 b - - 2 1 u1.0' to be undefined` at `tools/plugin-board.test.ts:2533:43`.

### Green runs (with the fix, under the same load)

- R10, 20 runs: `done: 20 passed, 0 failed of 20`. Each run: `Test Files  1 passed (1)`, `Tests  1 passed | 43 skipped (44)`.
- Board test, 20 runs: `done: 20 passed, 0 failed of 20`. Each run: `Test Files  1 passed (1)`, `Tests  1 passed | 195 skipped (196)`.
- `KINGDOWN_TEST_FILE=tools/plugin-races.test.ts npm test`, alone: `Test Files  1 passed (1)`, `Tests  44 passed (44)`.
- `KINGDOWN_TEST_FILE=tools/plugin-races.test.ts npm test`, under load: `Test Files  1 passed (1)`, `Tests  44 passed (44)`.
- `KINGDOWN_TEST_FILE=tools/plugin-board.test.ts npm test`, alone: `Test Files  1 passed (1)`, `Tests  196 passed (196)`.
- `KINGDOWN_TEST_FILE=tools/plugin-board.test.ts npm test`, under load: `Test Files  1 passed (1)`, `Tests  196 passed (196)`.
- `npm run typecheck`: `tsc --noEmit` exits 0.
- `npm run test:docs`: `Test Files  13 passed (13)`, `Tests  166 passed (166)`.

The full `npm test` is not run here, by the lead's order.
