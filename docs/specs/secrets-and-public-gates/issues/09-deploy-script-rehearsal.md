# 09: Deploy script tests a fresh origin/main

**What to build:** The owner (or an agent on the owner's yes) runs one deploy command with no ref. It fetches origin, makes a detached worktree of the fresh origin/main with git, and calls `wt add <path>` for the packages. It runs `npm test`, then the browser-check runner, and stops at the first failure with that step's name. Without the publish flag, it stops after the checks and says that it published nothing. A local commit that is not on origin has no effect on what it tests. The command removes its worktree on every exit: pass, failure or interrupt. This is the only path to the live site; ticket 10 adds the publish step.

**Blocked by:** dev-environment/01 (`wt add <path>` on an existing detached worktree), checks-and-hooks/06 (the browser-check runner `npm run check:browser`)

**Status:** resolved

**Owns:** `tools/deploy.sh`, `tools/deploy.test.ts`

**Verify:** `npm test`

- [x] The test runs the script in `tempRepo()` with a bare remote, with stub `npm`, `npx` and runner on `PATH` that log their calls.
- [x] A local commit on the source branch that is not pushed does not appear in the deploy worktree; the logged `npm test` ran at origin/main's commit.
- [x] Any argument other than `--publish` gives a non-zero exit before any worktree exists.
- [x] The log shows `wt add <path>` on the deploy worktree before `npm test`, then the runner.
- [x] A failed `npm test` stops the script with a non-zero exit; the runner is not called.
- [x] With no flag, the stub log has no `vercel` call.
- [x] After a pass, a failure and a SIGINT, `git worktree list` shows no deploy worktree and its folder is gone.

## Comments

Builder, 2026-10-07, branch `build/secrets-and-public-gates-09`.

- Files: `tools/deploy.sh` (new, executable) and `tools/deploy.test.ts` (8 tests). No other file changed.
- Order of a run: arguments (zero, or exactly `--publish`; else exit 2 with the usage line, before any change on disk); `git fetch --quiet origin`; a detached worktree of `refs/remotes/origin/main` in a new `mktemp -d` folder under `$TMPDIR`; the worktree's own `tools/wt.sh add <path>`; `npm test`; `npm run check:browser` (all checks that are not "by name only"). Each step prints `deploy: step <name>`; a failure prints `deploy: FAIL at <name>` on stderr and exits 1. A pass prints `deploy: checks passed at <sha>; published nothing (no --publish flag)`.
- Choices that the ticket did not fix:
  - The script calls the `wt` of the tested commit (`<worktree>/tools/wt.sh`), not the `wt` of the checkout that starts it. Thus every tool that runs comes from origin/main, and the script works from a checkout whose branch has no `tools/wt.sh`. The test puts a stub `tools/wt.sh` on origin/main.
  - The runner is `npm run check:browser`, so the `npm` stub on `PATH` also logs the runner call.
  - `--publish` exits 2 before any worktree exists, with "the publish step is not built yet (secrets-and-public-gates/10); published nothing". Ticket 10 replaces this line with the publish step; no test holds it.
  - Cleanup (a trap on EXIT; INT, TERM and HUP exit 130, 143 and 129): go back to the starting checkout, remove the `node_modules` link first (so no removal goes through it into the main checkout), `git worktree remove --force`, `rm -rf` the folder, `git worktree prune`.
- Tests (`tools/deploy.test.ts`, `tempRepo({ hooks: false })` with its bare remote; stub `npm` and `npx` log the call, the commit and the folder): fresh origin/main (a pushed commit that the local remote-tracking ref does not know yet is tested; a local commit that is not pushed is not); order `wt.sh add <path>`, `npm test`, `npm run check:browser`; no flag: no `npx` and no `vercel` call, "published nothing"; six bad argument lists exit non-zero with no worktree and no stub call; a failed `npm test` stops with `FAIL at npm test` and no runner call; a failed runner stops with `FAIL at browser checks`; the worktree and folder are gone after a pass and a failure; after a SIGINT to the process group during `npm test`, exit 130 and the worktree and folder are gone.
- Mutation checks: with the fetch step removed, the freshness test fails; with the INT trap removed, the SIGINT test fails.
- `npm test` after the merge of `claude/retro-2026-10-06` (b2906b8): 59 files, 1063 tests passed, node tests 42 passed. One earlier run had a 5 s time-out in `tools/gate.test.ts` ("reads no file of a commit that origin already reaches ..."), not in this ticket's files; the next run passed. It is load-dependent (other builders ran at the same time).
- Not done: the spec's builder task "a deploy rehearsal with no publish flag" against the real origin. The real origin/main has no `tools/wt.sh` until the owner merges, so the rehearsal would stop at `wt add`. Run `tools/deploy.sh` once after the merge to main.
