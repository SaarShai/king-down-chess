# Test the live tool rate limit and remove its dead copy

Status: done on branch `staging/lane-budget`; not merged. Starts at `73387e66`.

## What

Move the strong tool-limit DB test from the dead copy in `src/match/budget.ts` to the live method `PluginService.toolTry` in `src/plugin/service.ts`. Delete the dead copy.

## Why

`src/match/budget.ts` copies `TOOL_LIMITS` and `toolTry` from `src/plugin/service.ts`. No product file imports it. Only `src/match/budget.db.test.ts` imports it. That test is the only one that checks the window reset, saturation, two-connection locking and actor and tool isolation. The live code has only the narrower test in `src/plugin/server.db.test.ts`. So the strong test protects dead code.

Each claim is verified at `73387e66`:

- `git grep budget` finds `src/match/budget` only in `budget.db.test.ts`. The live callers (`src/api/http.ts:130,136,147` and the plugin server) use `PluginService.toolTry`.
- The copy and the live code are equal. The four limits (count, seconds, message) are identical. The SQL upsert and the `tries > count` refusal are identical. The only differences: the copy takes a `Pool` argument, the live method uses `this.store.pool`; and the comment and indent differ. So the moved cases test the same behaviour.

## Scope

- Delete `src/match/budget.ts`.
- Move `src/match/budget.db.test.ts` to `src/plugin/tool-tries.db.test.ts`. Each call now goes through `new PluginService(new PostgresMatchStore(pool)).toolTry`, one service on each of two one-connection pools. The service-refusal case uses `PluginService.command`. The test database suffix changes from `budget` to `tooltries`.
- Add one case: the test table equals the live `TOOL_LIMITS`, so a changed or added limit fails the test.
- No change to `src/plugin/service.ts` or `src/plugin/server.db.test.ts`. No doc or test list names `match/budget`, so no other file changes.

## Acceptance

- All four tool limits pass the moved cases (window reset, saturation, two-connection locking, actor and tool isolation) against the live method.
- `git grep "match/budget"` returns nothing in `src/` and `tools/`.
- The server bundle hash is unchanged.

## Result

All acceptance criteria pass. `PLUGIN_TEST_DATABASE_URL` points to the disposable loopback database `kingdown_lane_budget_test` for each test run.

1. `npm run plugin:build` before the change: `plugin-server-dist/server.mjs` sha256 `8602a35ef3b7032342f5b3724f6600117e943ed649115d7fa7d01903c2f7b238`.
2. `KINGDOWN_TEST_FILE='{src/plugin/tool-tries.db,src/plugin/server.db}.test.ts' npm test`: `Test Files  2 passed (2)`, `Tests  49 passed (49)`. Vitest reports no skipped case. `KINGDOWN_TEST_FILE=src/plugin/tool-tries.db.test.ts npm test` alone: `Test Files  1 passed (1)`, `Tests  8 passed (8)`, so the DB cases run.
3. Failure proof: a local edit (not committed) changes the live refusal in `src/plugin/service.ts` from `tries > count` to `tries > count + 1`. The new test then gives `Tests  5 failed | 3 passed (8)`: the four per-limit cases and the two-pool race case fail. `git checkout -- src/plugin/service.ts` restores the file; `git diff` is then empty.
4. `npm run typecheck`: `tsc --noEmit` exits 0.
5. `npm run plugin:build` after the change: sha256 `8602a35ef3b7032342f5b3724f6600117e943ed649115d7fa7d01903c2f7b238`, equal to step 1.
6. `git grep -n "match/budget"`: no output (exit 1).
7. Full `npm test`: `Test Files  6 failed | 248 passed (254)`, `Tests  13 failed | 4629 passed | 8 skipped (4650)`.
   - The 8 skipped cases are the `KINGDOWN_BALANCE_DRIFT` suite (`src/balance/schema.test.ts:73-120`). No DB case skips.
   - The 13 failures are browser UI tests in `tools/plugin-{app,lobby,motion,profile,real-host,screen-lifecycle}.test.ts`: Playwright timeouts and timing asserts. None of them reaches `toolTry`.
   - Those six files alone at this branch: `Tests  11 failed | 227 passed (238)`. The same six files alone at `73387e66` (worktree detached, then returned to the branch): `Tests  11 failed | 227 passed (238)`, with the same 11 cases (3 in plugin-app, 2 in plugin-lobby, 1 in plugin-profile, 5 in plugin-screen-lifecycle). The two other full-run failures (plugin-motion "opens end actions during a live win (reduced motion true)" and plugin-real-host "says it cannot connect after three failed polls offline…") pass when the files run alone. They time out only under full-suite load. This change does not cause any of the failures.
8. `npm run test:docs` with this ticket: `Test Files  13 passed (13)`, `Tests  161 passed (161)`.
