# 01 · Detached commands, and the reviewer in the worktree

Status: done (on main, 2026-10-10)

## Scope

- AGENTS.md: the sentence "Start a run of more than a few minutes detached, and watch it with a separate check" leaves Runs and compute and joins Tests and checks, for any command of more than two minutes, with the mechanism (a background shell call, which reports when it ends). Each section stays at 120 words or less (`npm run test:docs`).
- `docs/lessons/agents-and-tools.md`, the lesson "one independent review a PR found a real item every time": the last sentence says to run the reviewer in the worktree with the read-only sandbox (`codex exec -C <worktree> -s read-only …`), so it reads the neighbours itself.
- The old clean-worktree push rule is retired by the [CI update](../../retro-2026-10-20/issues/01-retro-ci.md) (ticket 03).

## Done when

- [x] `npm run test:docs` passes (74).
- [x] The three edits are on main, pushed with the old clean-worktree tool as its first use.
