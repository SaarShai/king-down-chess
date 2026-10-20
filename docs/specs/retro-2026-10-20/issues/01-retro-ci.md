# 01 · One CI suite per update

Status: in-progress
Type: task

## Plan and checks

1. Remove the pre-push suite and its HEAD and clean-tree checks. Remove the clean-worktree push tool. Keep the gate and protected-path checks. Test a push with a failing test script, a secret refusal, a non-HEAD push, dirty files and deletions.
2. Remove the duplicate test workflow and branch push trigger. Keep the Node 24 database job and all browser jobs. Move the Kaggle runner to Node 24 with its published checksum check. Test the workflow and runner settings.
3. Measure the ten child calls on the M1. Add limits below the test or hook limit. Keep all existing limits. Test the options at each call and probe a child that does not end.
4. Skip the site build and preview for plugin-only browser checks. Test plugin-only, mixed, web and default selections. Keep the lobby poll assertions.
5. Commit, then run the type check and full unit suite with the M1 script. Run plugin-ui with the required check runner. Record the results here.

## Required status checks

Before removal, `.github/workflows/test.yml` has workflow name `Test` and job ID `test`. It supplies the `test` job status. The old hook ticket calls the required check “Test”.

Read-only GitHub checks on 2026-10-20 return `Branch not protected` (HTTP 404) for the main branch required-status endpoint. The branch rules endpoint returns an empty list. No required status check names apply to main. No GitHub setting changes.

## Scope notes

- `KINGDOWN_TEST_FILE` stays. The WebKit CI job and the test filter in `vite.config.ts` still use it.
- The ten listed calls get limits. The same change also bounds the Python import probe in `stone-control.test.ts`.
- No lobby poll assertion changes. No deploy test changes. The test lock and M1 runner stay.
- `docs/lessons/agents-and-tools.md` is a main-only tracker file. This branch cannot edit it. Its old clean-worktree push lesson needs this rule on main: “The pre-push hook runs the repo gate. CI and the deploy run the suite. A push does not require HEAD or a clean work tree. Use a branch and PR for protected paths.” The old test-lock lesson also needs to stop listing the pre-push suite as a current lock user.

## Results

- `npx tsc --noEmit`: pass on this Mac. The commit hook also passes the type check.
- `plugin-ui`: pass on Chromium through the required runner, at `9e6d406b`, in 204.0 s. No outer site build or preview starts. Log: `checks-plugin-ui-1.txt` in the lane output folder.
- The timing-only command stops before any test starts. The full suite replaces it.
- The first full M1 suite at `cc1ac0df` passes the type check but exits 1. The disk fills (`ENOSPC`, 117 MiB free). It reports 64 failed files, 126 passed files and 8 skipped files. It does not reach the art tests. Logs: `unit-full-1.txt`, `m1-lock-start.txt`.
- One new test also uses a parser API that this TypeScript runtime does not export. The timeout lint now uses the same text-check approach as the other repository lints. No production code changes for this fault.
- This lane removes only its own eight temporary directories (24 MiB) and ignored build output (16 MiB). The M1 still has 1.5 GiB free. More disk space is requested before another full run.
- The M1 migration probe passes through a temporary loopback tunnel to the given test database. It uses a separate disposable database and the shared role lock. Normal migration duration: 384 ms. Log: `measure-migration.txt`.
- No server or product code changes. No database browser check is required.
