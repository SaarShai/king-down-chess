# 03: Worktree script `prune` removes only safe worktrees, on request

**What to build:** The owner runs `wt prune` and sees each worktree with a verdict and a reason. Nothing changes until the owner adds `--apply`. Then the script removes only the safe worktrees: no worktree with changes, result files, unmerged commits, a lock or recent work goes. No branch goes. Of today's 58 worktrees, only those in use remain. This does the worktree cleanup of retro item 15. This ticket adds no dependency.

**Blocked by:** 02

**Status:** ready-for-agent

**Owns:** `tools/wt.sh` (the `prune` command), `tools/wt.test.ts`

- [ ] `wt prune` runs `git worktree prune`, then prints one line per worktree: path, verdict (`safe` or `keep`) and the reason. It removes nothing.
- [ ] Safe means all of: not the main checkout and not the current worktree; not locked; an empty `git status --porcelain`; no ignored file except `node_modules`, `dist` and `.DS_Store`; HEAD is an ancestor of `main`; the worktree's index and HEAD unchanged for 24 hours.
- [ ] `wt prune --apply` removes each safe worktree with `git worktree remove`, never with a force flag, and deletes no branch.
- [ ] A removed worktree's `node_modules` link goes, and the main checkout's package folder keeps every entry.
- [ ] Worktree script test (seam 1, `tempRepo()` hooks-off, times set back with file times): one worktree per guard (current, locked, changed file, ignored result file, unmerged commit, recent index) and one safe worktree. The dry run removes nothing and names each reason. `--apply` removes only the safe worktree, and `git branch --list` shows every branch it had before.

**Verify:** `npx vitest run tools/wt.test.ts`; `npm test`; once by hand in the main checkout: `bash tools/wt.sh prune` (dry run only; `--apply` only on the owner's yes)
