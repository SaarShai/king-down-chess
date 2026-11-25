# The deploy test file is split by section, so the workers run its parts at the same time

Status: done on branch `deploy-split`, waits for review.

Source: [retro](../retro.md), the section "Decisions after the merge", the item on `tools/deploy.test.ts`.

## Problem

`tools/deploy.test.ts` holds 207 tests in 1,623 lines. Vitest runs one file in one worker, so this file ran in series: 235 s to 274 s in the retro runs, 267 s in the run before this change. Each selection that holds the file waits for it. The retro measured the sections: `deploy.sh` 139 s, the two slow-link sections 57 s, the two `--publish` sections 33 s, `deploy-live-check.mjs` 26 s.

## Change

This is a move. No test name, assertion or test body changes.

- Seven test files take the sections of the old file:
  - `tools/deploy-sh.test.ts`: the first part of `describe('deploy.sh')` (setup mode, settings, remotes, configure, the plugin gates). The old file went to this name with `git mv`, but git records a delete and an add (see "Known limits").
  - `tools/deploy-sh-release.test.ts`: the second part of `describe('deploy.sh')` (the site gates, the release commit, CI reuse, frame-time records, cleanup).
  - `tools/deploy-slow-link.test.ts`: `describe.each(...)('%s over a slow link')`.
  - `tools/deploy-live-check.test.ts`: `describe('deploy-live-check.mjs')` and the top-level test "checks the launch root against the new page and keeps the old online page byte check".
  - `tools/deploy-keep-assets.test.ts`: `describe('deploy-keep-assets.mjs')`.
  - `tools/deploy-plugin-live-check.test.ts`: `describe('deploy-plugin-live-check.mjs')`.
  - `tools/deploy-publish.test.ts`: `describe('deploy.sh --target plugin --publish')` and `describe('deploy.sh --publish')`.
- Both new `deploy.sh` files open `describe('deploy.sh', ...)`, so the full names do not change. The split line is the case "stops the failed site gate %s before publication" (old line 455). It gives each part about the same count of `deploy.sh` runs that make a worktree.
- Two helper modules hold the shared code. Their names do not end in `.test.ts`:
  - `tools/lib/deploy-test-kit.ts`: the temporary repository with stub `npm`, `npx`, `node`, `git`, `wt.sh` and `test-lock.sh` (`setup()`), and `worktreeOf`, `head`, `expectGone` and the project constants.
  - `tools/lib/deploy-site-kit.ts`: the local live sites (`site()`, `pluginSite()`), the build folders, `runAsync`, `check`, `keep` and the paths of the three live tools.
- A script copied the test bodies from the old file by line range, with a guard on each range. Only the kit declarations got an `export`. Paths in the kit go up one folder (`../deploy.sh`, `../../vercel.json`).
- `tools/ci-shards.mjs`: the seven files get their times from the run after the split, in place of the weight 180 of the old file.
- `tools/lib/test-select.mjs`:
  - `extraImports`: the row is on `tools/lib/deploy-test-kit.ts`, the module that runs `deploy.sh`. The three test files that run `deploy.sh` import it, so the walk reaches each of them. The row adds `tools/release/frame-checks.sh`: `deploy.sh` sources it from the real `tools/` folder. The old file selected it only through a folder edge (see "Selection" below).
  - `dataLists`: the seven test files and the two kits, as the old file was one data list.
  - `slowTests`: the five new files over 15 s, with the times of the run after the split. The old row goes.
- No other file names `tools/deploy.test.ts`, except old tickets under `docs/specs/` and `docs/tasks-archive/`, which are history. No protected file names it.

## Shared state

Each item, and the decision:

| Item | Where | Decision |
| --- | --- | --- |
| Module-level lists `repos`, `folders`, `servers` and two file-level `afterEach` hooks | old lines 32-33 and 687-692 | The lists go to the kits. Each test file calls `afterEach(cleanRepos)` or `afterEach(closeSites)` for each kit that it uses. Vitest gives each file its own module copy (the default isolation), so the files share no list. `deploy-publish.test.ts` registers both hooks in the old order. |
| `vi.setConfig({ testTimeout: 60_000 })` | old line 16 | It acts on one file. Each new file has the same line. |
| Network ports | `site()`, `pluginSite()` | Each server listens on port 0 of 127.0.0.1, so the system gives a free port. No fixed port. |
| The default `DEPLOY_LIVE_URL` `http://127.0.0.1:9` | `setup()` | A fixed address, but no test listens on it. A script that uses it only gets a refused connection. No change. |
| Temporary folders | `tempRepo()`, `buildFolder()`, `deploy.sh` | Each has a unique name from `mkdtemp` or `mktemp -d` (`temp-repo-*`, `deploy-build-*`, `deploy.*`). The deploy worktree is in the folder of its own repository. No fixed folder name. |
| `HOME` and git config | `tempRepo()` | Each repository has its own `HOME` and its own empty global and system git config. The `insteadOf` and `remote.origin.fetch` cases write to the config of their own repository. No shared file. |
| Machine lease and test lock (`$HOME/.cache/kingdown/machine.lock`, `kingdown-test.lock` in the git common dir) | `deploy.sh` line 33, `tools/test-lock.sh` | `deploy.sh` takes the machine lease only when `KINGDOWN_MACHINE_LEASED` is empty. The outer `npm test` sets it and the children get it, and the `test-lock.sh` of the temporary repository is a stub. Thus no test takes a lock file. This is the same as before: the old file already ran beside three other workers. No change. |
| Frame-check records | `deploy.sh` lines 301-302, `tools/release/frame-checks.sh` | The cases set `KINGDOWN_FRAME_CHECKS_RECORD` and `KINGDOWN_FRAME_CHECKS_HISTORY` to files in their own temporary root, or to empty. The write goes to `<record>.tmp` beside the record. No global file. |
| The string `/tmp/other.git` | a case of "stops before the fetch when origin is %s" | An origin URL only. No test makes or reads that folder. No change. |
| Environment changes, `process.chdir`, global stubs, `vi.mock` | the whole old file | None. The tests give their settings to child processes only. |
| A fixture that many tests share | the whole old file | None. Each case calls `setup()` or makes its own site and folder. |
| Order between tests | the whole old file | None found. The two `deploy.sh` parts run in other groups and in another order, and all 207 tests pass. |
| The SIGINT case | "removes its worktree and folder after a SIGINT during npm test" | It kills only the process group of its own detached child. No change. |

## Checks

- Full test names, before and after, equal. A collect-only run (`KINGDOWN_TEST_NAME` that matches no test, with the vitest JSON reporter) read a copy of the old file from `80b855489` beside the seven new files; the copy was then removed. Each side has 207 names, 207 distinct. `diff` of the two sorted lists: empty. The JSON of the timed run after the split gives the same 207 names (`diff`: empty).
- Source-level names: a parser read each `describe`, `it` and `test` call (name text and `.each` table text) of the old file and of the seven new files. 98 calls on each side; `diff`: empty.
- The name lists are not kept: they were in the scratch folder of the build session, which is temporary. To make them again, put a copy of `git show 80b855489:tools/deploy.test.ts` beside the seven files, run them with `KINGDOWN_TEST_NAME` set to a regex that matches no test and `-- --reporter=json --outputFile=<file>`, and sort the full names of each side. An independent review compared the 98 `describe`, `it` and `test` calls of the old file and the new files (describe path, body and `.each` table): all 98 are equal.
- Timed run before the split (clean tree at `80b855489`): `KINGDOWN_TEST_FILE=tools/deploy.test.ts KINGDOWN_TEST_NO_TYPECHECK=1 npm test`: 1 file, 207 passed, `Duration 266.69s (tests 100%)`.
- Timed run after the split: `KINGDOWN_TEST_FILE='{tools/deploy-sh.test.ts,tools/deploy-sh-release.test.ts,tools/deploy-slow-link.test.ts,tools/deploy-live-check.test.ts,tools/deploy-keep-assets.test.ts,tools/deploy-plugin-live-check.test.ts,tools/deploy-publish.test.ts}' KINGDOWN_TEST_NO_TYPECHECK=1 npm test -- --reporter=default --reporter=json --outputFile=<scratch>`: 7 files, 207 passed, `Duration 92.03s (tests 100%)`. The files:

| File | Tests | Time |
| --- | --- | --- |
| `tools/deploy-sh.test.ts` | 43 | 62.4 s |
| `tools/deploy-slow-link.test.ts` | 26 | 55.5 s |
| `tools/deploy-sh-release.test.ts` | 27 | 49.4 s |
| `tools/deploy-publish.test.ts` | 11 | 36.2 s |
| `tools/deploy-live-check.test.ts` | 77 | 23.8 s |
| `tools/deploy-plugin-live-check.test.ts` | 10 | 9.6 s |
| `tools/deploy-keep-assets.test.ts` | 13 | 8.5 s |

- `npm run typecheck`: exit 0.
- `npm run test:docs`: 199 tests pass, 1 skipped.
- `KINGDOWN_TEST_FILE='{tools/lib/test-select.test.ts,tools/ci-shards.test.ts}' KINGDOWN_TEST_NO_TYPECHECK=1 npm test`: 16 of 16 tests pass.
- `checkShards()` after the change: `test (1)` holds `deploy-sh`, `deploy-sh-release`, `deploy-publish` and `deploy-keep-assets`; `test (2)` holds `deploy-slow-link`, `deploy-live-check` and `deploy-plugin-live-check`.

### Selection

A probe script called `selectTests` for one changed file at a time, on the tree of `80b855489` and on the tree after the change (the folders `tools`, `src`, `.claude/hooks`, `docs/2d-first-pieces`, and `package.json`, `vite.config.ts`).

- Before, each probe in `tools/` selected `tools/deploy.test.ts`: some through an import or a name, the others through a folder edge. The string `'tools'` (the stub folder of the temporary repository, in `setup()`) made the test "hold" the `tools/` folder. Thus a change to any file under `tools/` selected the 235 s file, also `tools/piece-activity.ts` and `tools/plugin-ui-build.mjs`, which the deploy tests do not use.
- After, that string is in the kit, which is not a test, so no deploy test holds `tools/`. Each probe that the deploy tests use still selects them:
  - `tools/deploy.sh`, `tools/check.mjs`, `tools/lib/registry.mjs`, `tools/deploy-plugin-env.mjs`, `tools/lib/temp-repo.mjs`, `tools/engines-check.mjs`, `tools/ci-green.mjs`, `tools/release/frame-checks.sh`: `deploy-sh`, `deploy-sh-release`, `deploy-publish`.
  - `tools/staging-config.mjs`, `tools/chatgpt-plugin.mjs`, `tools/muse-connector.mjs`: the full suite, because they are in the import graph of `vite.config.ts`.
  - `tools/wt.sh`: `deploy-sh` and `deploy-sh-release` (their strings name it; the real file is never run, because the temporary repository holds a stub).
  - `tools/deploy-live-check.mjs`, `tools/deploy-keep-assets.mjs`, `tools/deploy-plugin-live-check.mjs`: all seven files.
  - `tools/piece-activity.ts` and `tools/plugin-ui-build.mjs`: no deploy test of the split (`tools/deploy-plugin-env.test.ts` still holds `tools/`).
- A grep of `tools/deploy.sh` for `$0`, `dirname`, `BASH_SOURCE`, `source`, `. "` and `--input-type` finds four files that it uses from the real `tools/` folder: `test-lock.sh` (a wide file: its change runs the full suite), `staging-config.mjs`, `deploy-plugin-env.mjs` and `release/frame-checks.sh`. Its inline node scripts import only node modules.
- Without the new `frame-checks.sh` import, a change to `tools/release/frame-checks.sh` selected no file of the split. `deploy.sh` names it as `"$script_dir/release/frame-checks.sh"`, which the scanner cannot read. The row in `extraImports` closes this gap.

## Known limits

- More of the deploy work now runs at the same time. Some tests compare wall-clock time with a limit (`seconds < 1.5 + 5`, `< 3`, `< 5`, `< 15`, `peak` 8, limits of 250 ms). One green run does not prove that they hold when four workers run heavy files. In the full suite the old file also ran beside three other workers, so the load is not new, but its form is.
- The times come from one run on this Mac, with the seven files alone. The weights in `tools/ci-shards.mjs` add to 246 s, against 180 s for the old file; the CI shards can move a little.
- The run after the split took 92 s. The sum of the file times is 245 s, so 4 workers can give about 62 s at best; the order in which vitest gives files to workers sets the rest.
- `deploy-slow-link.test.ts` takes 55 s: it holds two waits of 16 s for each tool.
- Git does not see the move of the old file as a rename: `tools/deploy-sh.test.ts` keeps about a fifth of the old lines. `git log --follow` does not reach the old history; `git log -- tools/deploy.test.ts` does.
- The selection probes read a part of the tree, not the full clone.

## Work record

- `date` at start: 09:38 PST. Run 1 (before) started at 09:39 from the clean tree; run 2 (after) at 09:59. No third run. A collect-only run (no test body runs, 0.4 s) and two focused runs of `test-select` and `ci-shards` also took the lease for some seconds each.
- Read `AGENTS.md`, the old file, `tools/lib/temp-repo.mjs`, `tools/deploy.sh` (fixed paths, the lease), `tools/test-lock.sh`, `tools/release/frame-checks.sh`, `tools/lib/test-select.mjs`, `tools/ci-shards.mjs`, `vite.config.ts` (4 workers, default isolation).
- Commits on `deploy-split`: the split; the list changes; this ticket.
- Not verified: a full `npm test`; a CI run; `npm run test:changed` (it selects the deploy files, so it is a run of these tests again). Not pushed; no pull request.

## Review

- Review: an agent that did not build the change read head `fb90b0279` (the split, merged with `origin/main` at `d781512ed`). Blocking: 0. It compared the 98 test calls of the old file and the new files (describe path, body, `.each` table): all equal. It found no shared state between the files. It ran `selectTests` for each file under `src/` and `tools/`: of the 80 files that selected `tools/deploy.test.ts` for a real reason, 0 lost a deploy test. Notes: (1) three probe results in "Selection" were wrong (`tools/staging-config.mjs`, `tools/chatgpt-plugin.mjs` and `tools/muse-connector.mjs` give the full suite); (2) the name lists are not kept; (3) the wall-clock limits of `deploy-live-check`, `deploy-plugin-live-check` and `deploy-slow-link`: in CI they run in another shard than the `deploy.sh` files, no change; (4) the comment of `testSeconds` in `tools/ci-shards.mjs`.
- One repair batch: notes 1, 2 and 4 (this ticket and one comment). Note 3 stays in "Known limits".
