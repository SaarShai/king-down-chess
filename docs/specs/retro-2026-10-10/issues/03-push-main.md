# 03 · `tools/push-main.sh`

Status: in-review (branch `claude/retro-tools`)

## Scope

- `tools/push-main.sh [--dry-run] [<commit>]`: checks that the commit (default HEAD) is on the local main branch, adds a detached worktree for it under the system's temporary folder, links the main checkout's packages, pushes `HEAD:refs/heads/main` from there (the pre-push hook runs `npm test` and the gate in that worktree), and removes the worktree.
- `.githooks/pre-push.mjs`: the refusal for a dirty tree names the script.

## Done when

- [ ] `tools/push-main.sh --dry-run` from the main checkout with another session's edits in it: the worktree is made and removed, and git reports the push as up to date or lists the commit.
- [ ] A review by a reader that did not write the diff; its findings fixed and recorded here.

## Comments
