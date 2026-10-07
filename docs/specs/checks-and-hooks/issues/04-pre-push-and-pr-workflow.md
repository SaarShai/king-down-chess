# 04: Each push and each pull request into main runs `npm test`

**What to build:** The pre-push hook makes each push run the full `npm test` on the commit that goes out. It skips deletions. It refuses when a pushed commit is not HEAD or when tracked files differ from HEAD, because then the test result would not describe the pushed commit. For a push to main, it lists the files changed from the remote head and refuses when one is under a protected path: `src/`, `public/`, `index.html`, the package files, `supabase/` (decision 10), the hook folder, the Claude settings folder and `tools/`. Docs and trackers may still go to main directly. With an unknown remote head, it refuses and says "fetch first". Then it runs `npm test` (without git's `GIT_` variables) and the repo gate in `push` mode (`npm run gate -- push <remote> <url>`, with git's stdin and the `GIT_` variables). Each refusal names the fix. A merge on GitHub runs no local hook, so one test workflow runs `npm test` on each pull request into main: Node 22, `npm ci` without browser downloads, then `npm test`. It has no push trigger.

**Blocked by:** 02

**Status:** ready-for-agent

**Owns:** `.githooks/pre-push` and its Node script, `tools/lib/changed-files.mjs`, `tools/lib/changed-files.test.ts`, `tools/git-hooks/pre-push.test.ts`, `.github/workflows/test.yml`, `tools/workflow.lint.test.ts`

- [x] Changed-file unit test: the list of files changed between the remote head and the pushed commit holds additions, edits, deletions and both sides of a rename.
- [x] Git-hook test, story 4: a direct push to main that changes a file under each protected path is refused, and the output names the path and the fix (a branch and a pull request). A push to main that changes only a doc passes.
- [x] Git-hook test, story 5: a push to main with no known remote head is refused with "fetch first".
- [x] Git-hook test, story 3: the fixture package's `test` script runs on each push; when it fails, the push is refused.
- [x] Git-hook test: a push of a commit that is not HEAD is refused; a push with a tracked file changed but not committed is refused; each refusal names the fix.
- [x] Git-hook test: a branch deletion pushes without a test run.
- [x] Git-hook test, story 9: the fixture gate gets `push`, the remote name and the URL as arguments, and git's stdin lines; its exit 1 refuses the push and its stderr shows.
- [x] Workflow lint, story 16: the workflow runs on `pull_request` into main only, with no `push` trigger; it uses Node 22; it sets the variable that skips the browser download; its last step runs `npm test`.

**Verify:** `npm test`; in a scratch clone with a bare remote after `npm ci`: a push to main that changes `src/` (refused), a push to a branch (tests run).

## Comments

**Builder, 2026-10-07 (branch `build/checks-and-hooks-04`).**

Files: `.githooks/pre-push` (launcher), `.githooks/pre-push.mjs`, `tools/lib/changed-files.mjs`, `tools/lib/changed-files.test.ts`, `tools/git-hooks/pre-push.test.ts`, `.github/workflows/test.yml`, `tools/workflow.lint.test.ts`. One edit outside the Owns line: `tools/lib/temp-repo.mjs` copies the modules that the hooks import (a `hookModules` list, now only `tools/lib/changed-files.mjs`) into the temporary work tree and excludes them. Without it, the copied `pre-push.mjs` cannot import `../tools/lib/changed-files.mjs`. The spec gives `tools/lib/**` to this spec.

Order in the hook: deletions only, then exit 0 (no test, no gate); each pushed commit must be HEAD (tags are peeled); `git diff --name-only HEAD` must be empty (untracked files do not count); for `refs/heads/main`, the remote head must be a local commit, else "fetch first"; protected files from `changedFiles(remote head, pushed commit)` refuse; then `npm run --silent test` without the `GIT_` variables; then `npm run --silent gate -- push <remote> <url>` with git's stdin and the `GIT_` variables. A missing `gate` script refuses, as in pre-commit.

Choices for the owner to see:
- "The Claude settings folder" is all of `.claude/` (settings, hooks, launch.json). Ticket 10 asks about the last three protected paths.
- A remote with no main also gives "fetch first", with one more line: push the first commit with `--no-verify`.
- A deletion of main on the remote is a deletion, so the hook lets it go (the ticket says "skips deletions"). Only a GitHub branch rule can stop it.
- The workflow runs on pull requests, but GitHub stops a red merge only when the owner makes "Test" a required status check on main. That is a setting on GitHub, not in this repository.

Tests (all green):
- `tools/lib/changed-files.test.ts`: 1 test (addition, edit, deletion, both sides of a real rename; the test first asserts that git sees the rename).
- `tools/git-hooks/pre-push.test.ts`: 22 tests. Story 3: the test script runs, a failed test refuses and its output shows. Story 9: the gate gets `push origin <url>` and both stdin lines, the test sees no `GIT_` variable, a gate exit 1 refuses with its stderr, a missing gate refuses. Deletion: no test run. Not HEAD: refused, names `git switch other`. Tracked change: refused, names the file and "Commit or stash them". Untracked file: passes. Story 4: one case for each of the 9 protected paths (output names the path, not the doc file, and the fix `git switch -c <branch>` and "pull request into main"; no test run; remote main unchanged); a rename out of `src/` is refused; docs and TASKS.md pass to main after the test and the gate; `src/` to a branch passes. Story 5: a remote main that another clone moved, and a remote with no main, both refuse with "fetch first".
- `tools/workflow.lint.test.ts`: 4 tests (triggers are exactly `pull_request` with `branches: [main]`; Node 22; `npm ci` with `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1'`; last step `npm test`). Each test fails on a changed copy of the file: a push trigger, Node 20, no skip variable, a step after `npm test`, a second branch.

Commands run:
- `npm test` in the worktree after the merge of `claude/retro-2026-10-06`: type check clean, vitest 46 files and 828 tests passed, node tests 42 passed.
- Verify in a scratch clone (bare remote with this branch as main, `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci`, `core.hooksPath` was `.githooks` after it): a commit that changes `src/main.ts`, then `git push origin main`, was refused and named `src/main.ts` (exit 1, remote main unchanged). `git push -u origin verify-branch` ran the full `npm test` (828 + 42 passed) and the branch reached the remote. The scratch folder is deleted.
