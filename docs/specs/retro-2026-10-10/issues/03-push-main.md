# 03 · `tools/push-main.sh`

Status: done (PR #38 merged 2026-10-10)

## Scope

- `tools/push-main.sh [--dry-run] [<commit>]`: checks that the commit (default HEAD) is on the local main branch, adds a detached worktree for it under the system's temporary folder, links the main checkout's packages, pushes `HEAD:refs/heads/main` from there (the pre-push hook runs `npm test` and the gate in that worktree), and removes the worktree.
- `.githooks/pre-push.mjs`: the refusal for a dirty tree names the script.
- `tools/push-main.test.ts`: the real script in a temporary repository with the real hooks (`tools/lib/temp-repo.mjs`): a dirty checkout, the direct push refused with the script's name, the script's push lands on the remote's main, the worktree is gone, the edit stays; a commit that is not on main is refused.

## Done when

- [x] `tools/push-main.sh --dry-run` from a worktree of main: the worktree is made and removed, and git reports main as up to date. The branch push of this ticket ran the real hook from the worktree (`npm test` and the gate) and landed. `tools/push-main.test.ts`: three cases pass in `npm test`.
- [x] A review by a reader that did not write the diff; its findings fixed and recorded here.

## Comments
- **Reviews** (2026-10-10). Review 1 (read-only, inside the worktree): no fault; the detached HEAD matches the pushed sha, the hook runs in that worktree, the EXIT trap covers a failed push. Review 2 (the shell lens of the panel): one should-fix, refuted by its second reader (a lock-file mismatch cannot reach the push, because the hook refuses a direct push to main that changes the lock file; the main checkout holds main). Taken as notes: a guard for a missing `node_modules` in the main checkout; the header says what `--dry-run` does (the hook still runs the tests); a test of the script (above). Noted, no change: `core.hooksPath` is absolute in this clone, so the worktree runs the main checkout's hook files.
