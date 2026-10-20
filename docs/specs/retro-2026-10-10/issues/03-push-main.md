# 03 · Clean-worktree push tool (removed)

Status: done

The [CI update](../../retro-2026-10-20/issues/01-retro-ci.md) removes `tools/push-main.sh` and its tests. The tool exists only to satisfy the old pre-push suite's HEAD and clean-tree checks. Those checks are removed too.

The pre-push hook stays. It runs the repo gate and refuses protected-path changes on a direct push to main. CI and the deploy run the suite. Follow the branch and PR rules in AGENTS.md.
