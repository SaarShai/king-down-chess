# Dev environment
Status: ready-for-agent
Source: docs/specs/retro-2026-10-06/retro.md items 15 (worktree cleanup only), 17, 20

## Problem Statement

Each new worktree gets a full installation (28 so far, 4.8 GB) or a hand-made package link. Only a local rule ignores the link. Without a prompt, `npx` installs a missing package from the registry.

`vite preview` listened on `localhost` while a check called 127.0.0.1: a nine-minute wait. A `git commit -a` (4830dee) put an absolute worktree path into the tracked launch file. A dev server served the main checkout, not the worktree under test.

Claude Code's default trailer names a model: 244 of the last 300 commits on main carry it. After a compaction, the agent once reported a run's stage from memory.

## Solution

Claude Code, a startup hook and a worktree script link the main checkout's packages; a guard stops installations through a link. `npx` stops on a missing package, and Vite listens on 127.0.0.1. One launch entry serves the worktree that a target file names. Claude Code writes the neutral trailer. A compaction hook gives the main checkout's open items and live runs. `npm test` checks each part except the probes; the checks spec's commit-msg hook also checks the trailer.

## User Stories

1. As an agent, I want each worktree that Claude Code or the desktop app makes to link the main checkout's packages, so that it costs seconds and no disk. Check: settings test; session hook test.
2. As an agent, I want one worktree script, for every other tool, that links when the lock files match and else installs a separate copy, so that a dependency change never alters other worktrees. Check: worktree script test.
3. As the owner, I want `npm test` to fail in a linked worktree with a different lock file, and an installation through a link refused, so that the main checkout's packages stay intact. Check: settings test; the secrets spec's hook test.
4. As the owner, I want git to ignore the link, the target file and the previews folder, so that no clone commits them. Check: settings test.
5. As the owner, I want prune to remove worktrees only on request, and never one with changes, results, unmerged commits, a lock or recent work, so that, of 58 worktrees, only those in use remain. Check: worktree script test.
6. As an agent, I want `npx` to stop on a missing package and both Vite servers on 127.0.0.1 unless I pass `--host`, so that I never run a wrong package and every check reaches Vite. Check: settings test.
7. As an agent in any session, I want one launch entry, with no absolute path, that serves the worktree that the main checkout's target file names, so that I preview the right worktree and 4830dee cannot repeat. Check: settings test; worktree script test.
8. As the owner, I want Claude Code to end commits with `Co-Authored-By: Claude Code <noreply@anthropic.com>`, with no PR text or session link, so that no commit names a model. Check: settings test; the checks spec's commit-msg hook.
9. As an agent after a compaction, I want the main checkout's open items and live runs as facts, so that I never report a run's state from memory. Check: session hook test.
10. As an agent, I want the compaction hook text under 9,500 characters, and one fact line when a file is missing, so that I never get silence or cut text. Check: session hook test.

## Implementation Decisions

- **Project settings.** `worktree.symlinkDirectories` holds `node_modules`. `attribution` uses the object form: `commit` is the neutral trailer, `pr` is empty, `sessionUrl` is false. Never set attribution to the value false: versions before 2.1.281, such as 2.1.276 in the terminal, then skip the whole file. No worktree-include file: it would copy 180 MB into each worktree.
- **Session hook.** One Node script serves two new SessionStart entries. It writes facts, never commands, and always exits 0. The existing `startup` entry stays.
  - `startup`: in a linked worktree with no `node_modules`, it runs the worktree script's package step.
  - `compact`: it finds the main checkout through git's common folder, or uses `CLAUDE_PROJECT_DIR` outside git. It prints the first section of the task index; the steering lint keeps that section under 5,000 bytes, inside the 9,500-character total. It reads each run-queue section whose heading starts with "Running". It prints the table header and each row whose state does not start with "done". It cuts at a row boundary under 9,500 characters, then names the file to read. A missing file gives one fact line that names it.
- **Vite config.** `server.host` and `preview.host` are 127.0.0.1; a `--host` flag overrides them.
- **Launch file.** Remove `workshop`. Add `worktree`: the worktree script's `serve` on port 5177. Keep `dev`, `playable`, `painted-2d` and `previews`. The target file sits beside the main checkout's launch file and holds one worktree name or absolute path.
- **Worktree script (`wt`).** Bash 3.2 and BSD tools. It finds the main checkout through git's common folder.
  - `add <branch> [<start>]` makes a worktree in the worktrees folder, on that branch or a new one from `<start>` (default `main`). It names the worktree after the last part of the branch. `add <path>` on an existing worktree, detached or not, does only the package step.
  - Package step: when the lock file is byte-equal to the main checkout's, the script links its `node_modules`. Else it removes any link, then runs `npm ci`; `npm ci` empties a linked folder through the link. It prints one line: path, branch, `linked` or `installed`.
  - `prune` runs `git worktree prune` and lists each worktree with a verdict and reason. `--apply` removes the safe worktrees with `git worktree remove`, never with force, and deletes no branch. Safe means all of: not the main checkout or the current worktree; not locked; a clean `git status`; no ignored file except `node_modules`, `dist` and `.DS_Store`; HEAD on main; index and HEAD unchanged for 24 hours.
  - `serve` reads the main checkout's target file. It stops with a one-line reason when the file is missing, names no worktree of this repository, or names one with no `node_modules`. Else it runs that worktree's own Vite on it at 127.0.0.1, on `PORT` (default 5177), and stops if the port is in use.
- **npm config.** The tracked npm config file holds `yes=false`, so `npx` stops on a missing package when no person can answer a prompt. A `--yes` flag still wins.
- **Versioned ignore file.** `node_modules/` becomes `/node_modules`, which matches a folder and a link. It also lists the target file and the previews folder.
- **Installation guard.** A check in `npm test` fails when `node_modules` is a link and the lock file differs from the main checkout's. Its message names `wt add <path>`. The secrets spec adds a PreToolUse rule that refuses `npm ci` and `npm install` through a link.
- **Guidance.** The steering spec merges three lines into the agent rules: set up a worktree with `wt add`; preview any worktree but the main checkout with the `worktree` entry and the target file; change dependencies only in a worktree with its own installation.

## Testing Decisions

- A good test runs the real script or loads the real config. It asserts what an agent sees: exit code, output, `git status` and links. All tests run in `npm test` (seam 1).
- **Settings test.** It reads the settings, launch, npm and Vite config. It asserts each key, entry, host and ignore line that this spec names, with `sessionUrl` false and `yes=false`. It also asserts an executable hook script, no absolute launch argument, no worktree-include file and the installation guard.
- **Worktree script test.** A temporary repository holds the ignore file, a lock file and a fake package folder. A stub `npm` on `PATH` deletes each entry of `node_modules`, as real `npm ci` does.
  - `add` links, and `git status` stays empty.
  - A changed lock file calls the stub with `ci`; the main package folder stays intact.
  - `add <path>` sets up an existing worktree and a detached one.
  - One worktree per prune guard and one safe worktree: the dry run removes nothing. `--apply` removes only the safe one and keeps every branch and the main package folder.
  - `serve` with no target exits non-zero with its reason. With a target, it calls that worktree's stub Vite with root, host and port.
- **Session hook test.** Hook JSON goes on stdin from a temporary worktree whose tracker copies differ from the main checkout's. With source `compact`: the main checkout's index lines and newer queue row; no done rows; under 9,500 characters for a long fixture; exit 0; one fact line for a missing file. With source `startup` and no packages: a link. The real docs/QUEUE.md has one heading that starts with "Running", with a `state` column.
- Prior art: `src/sim/sim.test.ts` runs a command-line tool in a `mkdtemp` folder; `src/account/account.test.ts` reads repository files. The tests use `tempRepo()` with a hooks-off option that the checks spec adds; its pre-commit hook refuses with no packages.
- **Probes** (once, by the builder, before the merge; not in `npm test`; results go into the ticket).
  - Preview: in a desktop worktree session on the integration branch, with no target file, call `preview_start` with `worktree`. A serve reason means the session read the worktree's launch file; then a worktree session may use `dev` for itself. "No such entry" means the main checkout's file; the guidance stays.
  - Packages: in that session, `node_modules` is a link.
  - Trailer: make one desktop commit. If a `Claude-Session:` line remains, the checks spec's prepare-commit-msg hook removes it.

## Out of Scope

- The `typecheck` script and the git hooks: checks spec. The deploy script and the installation rule: secrets spec. The rules "never `git commit -a` in the main checkout" and "kill by PID, no file://": steering spec.
- Item 17's preview writer: no tool writes preview pages, and the retro names none. Item 7's preview check: decision 1.
- Branch cleanup (96 refs) and item 15's `npm run status`: a later effort.
- Item 20's `cd <scratchpad>` calls: harness behaviour.
- For every spec: items 9 to 13, 18, 19, 21 to 23 and 28 to 30 (decision 1), and a history purge (decision 5).

## Further Notes

- Shared files: project settings, hooks folder and ignore file (secrets spec), Vite config (checks spec), AGENTS.md (steering spec). Each spec edits and tests only its own lines.
- The secrets spec's deploy script calls `wt add <path>` on a detached worktree; the checks spec's pre-commit hook names `wt`.
- Before the checks spec adds dependencies, the integration worktree replaces its link with its own installation (`wt add <path>`).
- `wt prune` does item 15's worktree cleanup: it keeps worktrees that hold ignored result files.
