# 01 · Detached commands, and the reviewer in the worktree

Status: ready-for-agent (docs on main; after the merge of tickets 02 and 03)

## Scope

- AGENTS.md: the sentence "Start a run of more than a few minutes detached, and watch it with a separate check" leaves Runs and compute and joins Tests and checks, for any command of more than two minutes, with the mechanism (a background shell call, which reports when it ends). Each section stays at 120 words or less (`npm run test:docs`).
- `docs/lessons/agents-and-tools.md`, the lesson "one independent review a PR found a real item every time": the last sentence says to run the reviewer in the worktree with the read-only sandbox (`codex exec -C <worktree> -s read-only …`), so it reads the neighbours itself.
- The lesson "a push from the main checkout fails while another session edits there": the rule becomes `tools/push-main.sh [<commit>]` (ticket 03).

## Done when

- [ ] `npm run test:docs` passes.
- [ ] The three edits are on main.
