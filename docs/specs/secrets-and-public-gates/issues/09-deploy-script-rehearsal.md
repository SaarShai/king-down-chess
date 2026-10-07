# 09: Deploy script tests a fresh origin/main

**What to build:** The owner (or an agent on the owner's yes) runs one deploy command with no ref. It fetches origin, makes a detached worktree of the fresh origin/main with git, and calls `wt add <path>` for the packages. It runs `npm test`, then the browser-check runner, and stops at the first failure with that step's name. Without the publish flag, it stops after the checks and says that it published nothing. A local commit that is not on origin has no effect on what it tests. The command removes its worktree on every exit: pass, failure or interrupt. This is the only path to the live site; ticket 10 adds the publish step.

**Blocked by:** dev-environment/01 (`wt add <path>` on an existing detached worktree), checks-and-hooks/06 (the browser-check runner `npm run check:browser`)

**Status:** ready-for-agent

**Owns:** `tools/deploy.sh`, `tools/deploy.test.ts`

**Verify:** `npm test`

- [ ] The test runs the script in `tempRepo()` with a bare remote, with stub `npm`, `npx` and runner on `PATH` that log their calls.
- [ ] A local commit on the source branch that is not pushed does not appear in the deploy worktree; the logged `npm test` ran at origin/main's commit.
- [ ] Any argument other than `--publish` gives a non-zero exit before any worktree exists.
- [ ] The log shows `wt add <path>` on the deploy worktree before `npm test`, then the runner.
- [ ] A failed `npm test` stops the script with a non-zero exit; the runner is not called.
- [ ] With no flag, the stub log has no `vercel` call.
- [ ] After a pass, a failure and a SIGINT, `git worktree list` shows no deploy worktree and its folder is gone.
