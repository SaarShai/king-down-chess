# 04: Each push and each pull request into main runs `npm test`

**What to build:** The pre-push hook makes each push run the full `npm test` on the commit that goes out. It skips deletions. It refuses when a pushed commit is not HEAD or when tracked files differ from HEAD, because then the test result would not describe the pushed commit. For a push to main, it lists the files changed from the remote head and refuses when one is under a protected path: `src/`, `public/`, `index.html`, the package files, `supabase/` (decision 10), the hook folder, the Claude settings folder and `tools/`. Docs and trackers may still go to main directly. With an unknown remote head, it refuses and says "fetch first". Then it runs `npm test` (without git's `GIT_` variables) and the repo gate in `push` mode (`npm run gate -- push <remote> <url>`, with git's stdin and the `GIT_` variables). Each refusal names the fix. A merge on GitHub runs no local hook, so one test workflow runs `npm test` on each pull request into main: Node 22, `npm ci` without browser downloads, then `npm test`. It has no push trigger.

**Blocked by:** 02

**Status:** ready-for-agent

**Owns:** `.githooks/pre-push` and its Node script, `tools/lib/changed-files.mjs`, `tools/lib/changed-files.test.ts`, `tools/git-hooks/pre-push.test.ts`, `.github/workflows/test.yml`, `tools/workflow.lint.test.ts`

- [ ] Changed-file unit test: the list of files changed between the remote head and the pushed commit holds additions, edits, deletions and both sides of a rename.
- [ ] Git-hook test, story 4: a direct push to main that changes a file under each protected path is refused, and the output names the path and the fix (a branch and a pull request). A push to main that changes only a doc passes.
- [ ] Git-hook test, story 5: a push to main with no known remote head is refused with "fetch first".
- [ ] Git-hook test, story 3: the fixture package's `test` script runs on each push; when it fails, the push is refused.
- [ ] Git-hook test: a push of a commit that is not HEAD is refused; a push with a tracked file changed but not committed is refused; each refusal names the fix.
- [ ] Git-hook test: a branch deletion pushes without a test run.
- [ ] Git-hook test, story 9: the fixture gate gets `push`, the remote name and the URL as arguments, and git's stdin lines; its exit 1 refuses the push and its stderr shows.
- [ ] Workflow lint, story 16: the workflow runs on `pull_request` into main only, with no `push` trigger; it uses Node 22; it sets the variable that skips the browser download; its last step runs `npm test`.

**Verify:** `npm test`; in a scratch clone with a bare remote after `npm ci`: a push to main that changes `src/` (refused), a push to a branch (tests run).
