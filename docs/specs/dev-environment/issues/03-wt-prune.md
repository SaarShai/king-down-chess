# 03: Worktree script `prune` removes only safe worktrees, on request

**What to build:** The owner runs `wt prune` and sees each worktree with a verdict and a reason. Nothing changes until the owner adds `--apply`. Then the script removes only the safe worktrees: no worktree with changes, result files, unmerged commits, a lock or recent work goes. No branch goes. Of today's 58 worktrees, only those in use remain. This does the worktree cleanup of retro item 15. This ticket adds no dependency.

**Blocked by:** 02

**Status:** resolved

**Owns:** `tools/wt.sh` (the `prune` command), `tools/wt.test.ts`

- [x] `wt prune` runs `git worktree prune`, then prints one line per worktree: path, verdict (`safe` or `keep`) and the reason. It removes nothing.
- [x] Safe means all of: not the main checkout and not the current worktree; not locked; an empty `git status --porcelain`; no ignored file except `node_modules`, `dist` and `.DS_Store`; HEAD is an ancestor of `main`; the worktree's index and HEAD unchanged for 24 hours.
- [x] `wt prune --apply` removes each safe worktree with `git worktree remove`, never with a force flag, and deletes no branch.
- [x] A removed worktree's `node_modules` link goes, and the main checkout's package folder keeps every entry.
- [x] Worktree script test (seam 1, `tempRepo()` hooks-off, times set back with file times): one worktree per guard (current, locked, changed file, ignored result file, unmerged commit, recent index) and one safe worktree. The dry run removes nothing and names each reason. `--apply` removes only the safe worktree, and `git branch --list` shows every branch it had before.

**Verify:** `npx vitest run tools/wt.test.ts`; `npm test`; once by hand in the main checkout: `bash tools/wt.sh prune` (dry run only; `--apply` only on the owner's yes)

## Comments

Built on branch `build/dev-environment-05` (the orchestrator named the branch 05; this is ticket 03). Built from the integration tip before ticket 02 merged: the merger can get a small conflict in `tools/wt.sh` (header comment, usage line, `case` list) and `tools/wt.test.ts` (one more `describe`). Keep both sides.

- `tools/wt.sh prune [--apply]`: runs `git worktree prune`, then prints `path<TAB>verdict<TAB>reason` per worktree. Verdicts: `safe`, `keep`, and `removed` with `--apply`. Reasons: `main checkout`, `current worktree`, `locked`, `index or HEAD changed in the last 24 hours`, `changes: <path>` (a changed or untracked file), `ignored file: <path>`, `commits not on main`. The time check reads the files of the worktree's git folder with `find -mmin -1440`; `git --no-optional-locks status` keeps a dry run from writing an index (else the next run sees recent work; a test catches this).
- `--apply` uses `git worktree remove` with no force flag and deletes no branch. Git removes the `node_modules` link, not the folder it points to.
- Tests in `tools/wt.test.ts`, `describe('wt prune')`: one worktree per guard (current, locked, changed file, ignored `sim/out/run.jsonl`, unmerged commit, recent index), one safe worktree with `dist/` and `.DS_Store`, and one with a deleted folder. Index and HEAD times are set back two days with `utimesSync`. The dry run names each reason, forgets the deleted worktree, removes nothing, and a second dry run gives the same verdicts. `--apply` removes only the safe worktree; `git branch --list` and the main package folder are unchanged.
- `npx vitest run tools/wt.test.ts`: 9 passed (2 new). `npm test` after the merge of the integration tip: vitest 59 files, 1065 tests passed; node tests 42 passed.
- Hand check in the main checkout, dry run only: `bash tools/wt.sh prune` (3.8 s) listed 61 worktrees: 29 `safe`, 32 `keep` (17 changes, mostly `sim/out/` results; 8 recent; 5 commits not on main; 1 ignored file; the main checkout). Nothing was removed; 61 worktrees before and after. `--apply` waits for the owner's yes.
