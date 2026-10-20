# 01 · One CI suite per update

Status: done
Type: task

## Plan and checks

1. Remove the pre-push suite and its HEAD and clean-tree checks. Remove the clean-worktree push tool. Keep the gate and protected-path checks. Test a push with a failing test script, a secret refusal, a non-HEAD push, dirty files and deletions.
2. Remove the duplicate test workflow and branch push trigger. Keep the Node 24 database job and all browser jobs. Move the Kaggle runner to Node 24 with its published checksum check. Test the workflow and runner settings.
3. Measure the shared widget builder and each other child path on the M1. Add limits below the test or hook limit. Keep all existing limits. Test the options at each call and probe a child that does not end.
4. Skip the site build and preview for plugin-only browser checks. Test plugin-only, mixed, web and default selections. Keep the lobby poll assertions.
5. Commit, then run the type check and full unit suite with the M1 script. Run plugin-ui with the required check runner. Record the results here.

## Build

1. The pre-push hook runs the repo gate and protected-path checks. It runs no suite. The HEAD and dirty-tree refusals, `tools/push-main.sh` and its tests are removed. The hook tests cover non-HEAD, staged and unstaged pushes. The affected specs and scripts describe the new gate.
2. The duplicate `test.yml` workflow and its lint block are removed. The `codex/**` push trigger is removed from `plugin-checks.yml`. The Node 24 PostgreSQL job and all three browser jobs stay. Kaggle downloads Node 24 and checks its published SHA-256 digest from the same download base.
3. All ten listed child calls have limits. The Python import probe has a limit too. The timeout lint checks every call and its parent limit. A real child that does not end stops at its configured limit.
4. Plugin-only browser checks skip the site build and preview. Web, mixed and default selections still build and serve the site. The runner tests cover all four selections and a build failure. The lobby poll assertions stay.

## Required status checks

Before removal, `.github/workflows/test.yml` has workflow name `Test` and job ID `test`. It supplies the `test` job status. The old hook ticket calls the required check “Test”.

Read-only GitHub checks on 2026-10-20 return `Branch not protected` (HTTP 404) for the main branch required-status endpoint. The branch rules endpoint returns an empty list. No required status check names apply to main. No GitHub setting changes.

## Scope notes

- `KINGDOWN_TEST_FILE` stays. The WebKit CI job and the test filter in `vite.config.ts` still use it.
- The ten listed calls get limits. The same change also bounds the Python import probe in `stone-control.test.ts`.
- No lobby poll assertion changes. No deploy test changes. The test lock and M1 runner stay.
- `docs/lessons/agents-and-tools.md` and `docs/lessons/engine-and-tests.md` are main-only tracker files. This branch cannot edit them. Its old clean-worktree push lesson needs this rule on main: “The pre-push hook runs the repo gate. CI and the deploy run the suite. A push does not require HEAD or a clean work tree. Use a branch and PR for protected paths.” The old test-lock lesson also needs to stop listing the pre-push suite as a current lock user. The property-test lesson must say “test run” in its current rule, instead of “pre-push run”; its historical evidence stays.

## Results

- `npx tsc --noEmit`: pass on this Mac. The commit hook also passes the type check.
- `plugin-ui`: pass on Chromium through the required runner, at `9e6d406b`, in 204.0 s. No outer site build or preview starts. Log: `checks-plugin-ui-1.txt` in the lane output folder.
- The timing-only command stops before any test starts. The full suite replaces it.
- The first full M1 suite at `cc1ac0df` passes the type check but exits 1. The disk fills (`ENOSPC`, 117 MiB free). It reports 64 failed files, 126 passed files and 8 skipped files. It does not reach the art tests. Logs: `unit-full-1.txt`, `m1-lock-start.txt`.
- One new test also uses a parser API that this TypeScript runtime does not export. The timeout lint now uses the same text-check approach as the other repository lints. No production code changes for this fault.
- This lane removes only its own eight temporary directories (24 MiB) and ignored build output (16 MiB). The M1 still has 1.5 GiB free. More disk space is requested before another full run.
- The M1 migration probe passes through a temporary loopback tunnel to the given test database. It uses a separate disposable database and the shared role lock. Normal migration duration: 384 ms. Log: `measure-migration.txt`.
- More space is available later: the M1 reports 21 GiB free. The full suite starts at `489310e5` with the same limits. The focused command and the prior queued full command stop before any test starts. Log: `unit-full-3.txt`.
- The new timeout lint passes all 11 tests. Its real child probe stops with `ETIMEDOUT` and `SIGTERM` at the configured 4000 ms limit, after 4014 ms.
- The gate passes 31 tests, including real secret refusals. The pre-push hook passes all 26 tests. The runner passes all five tests: plugin-only, web, mixed, default and build failure.
- The full M1 suite passes at `489310e5`: type check; 186 test files pass and 12 skip; 3,133 tests pass and 164 skip; all 51 art tests pass. The unit phase takes 383.60 s. The runner exits 0. Log: `unit-full-3.txt`.
- The 9 workflow tests and the Kaggle runtime test pass in that full run. All six built-widget test files pass with the new child limits.
- Database suites skip on the M1 because its runner supplies no database URL. The Node 24 PostgreSQL CI job stays. The separate migration probe uses the given local test database through a temporary tunnel.
- No server or product code changes. No database browser check is required.
- The last commit adds measured-duration comments and this record only. Executable code matches the passing M1 head. The browser runner code matches the passing browser-check head.
- Final diff check: pass. The secret gate, attribution checks, removal counter, deploy suite, test lock and lobby poll assertions stay. No push, merge, deploy or GitHub setting change.

The main-only lesson edits above remain for the main tracker lane. All four code parts are built and checked.

## Child limits

All measurements use the M1. The table gives whole-test upper bounds when the test also checks output. The six widget calls use the same builder. Each call has a comment with its measured normal duration. No existing limit or STEP value increases.

| Child | Normal measurement | New limit |
| --- | --- | --- |
| Six widget builds | At most 601 ms in the whole style test | 30 s each |
| Migration | 384 ms through the test database tunnel | 60 s |
| Backup and merge Python calls | At most 228 ms for the whole results-store test file | 4 s each |
| Stone export | At most 506 ms for the whole stone test file | 4 s |
| Extra Python import probe | 120 ms | 4 s |

## Choices

- Use the existing registry script path to select plugin-only runs. Add no new registry flag.
- Use fixed limits of 30 s, 60 s and 4 s. Each stays below its parent test or hook limit.
- Bound the Python import probe in the same file too. It must not hold test collection forever.
- Keep the Kaggle download's checksum check tied to the Node 24 download base. Add no new download path.
