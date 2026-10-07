# 01: Worktree script `add` links or installs the packages

**What to build:** An agent in any tool runs `wt add` and gets a worktree that is ready to test in seconds. When the worktree's lock file is byte-equal to the main checkout's, the worktree links the main checkout's packages and uses no disk. When the lock file differs, the worktree gets its own installation, and the main checkout's packages stay intact. Git ignores the link, so no clone commits it. In a linked worktree with a different lock file, `npm test` fails and tells the agent to run `wt add <path>`. This ticket adds no dependency.

**Blocked by:** checks-and-hooks/02 (`tempRepo()` with the hooks-off option), checks-and-hooks/01 (vitest that collects tests from the tools folder)

**Status:** resolved

**Owns:** `tools/wt.sh` (new), `tools/wt.test.ts` (new), `tools/install-guard.test.ts` (new), `.gitignore` (the `node_modules/` line only)

- [x] The script runs under `/bin/bash` 3.2 with BSD tools. It finds the main checkout through git's common folder, also when it runs from a worktree.
- [x] `wt add <branch> [<start>]` makes a worktree in the main checkout's worktrees folder, named after the last part of the branch. It uses the branch when it exists, else makes a new branch from `<start>` (default `main`).
- [x] `wt add <path>` on an existing worktree, detached or not, does only the package step.
- [x] Package step: a byte-equal lock file gives a `node_modules` link to the main checkout's folder. A different lock file removes any link first, then runs `npm ci`. The step prints one line: path, branch, and `linked` or `installed`.
- [x] `.gitignore` holds `/node_modules` in place of `node_modules/`, so it matches a folder and a link.
- [x] Worktree script test (seam 1, `tempRepo()` hooks-off, the real `.gitignore` copied in, a fake package folder, a stub `npm` on `PATH` that deletes each entry of `node_modules` as `npm ci` does):
  - [x] `add <branch>` links, and `git status --porcelain` in the new worktree is empty.
  - [x] A changed lock file calls the stub with `ci`, the output says `installed`, and the main checkout's package folder keeps every entry.
  - [x] `add <path>` sets up an existing worktree and a detached worktree.
- [x] Installation guard (seam 1): `tools/install-guard.test.ts` fails when `node_modules` is a link and the lock file differs from the main checkout's, and its message names `wt add <path>`. It passes in the main checkout and in a linked worktree with an equal lock file. The worktree script test runs the same guard against a temporary linked worktree with a changed lock file and sees the failure.

**Verify:** `npx vitest run tools/wt.test.ts tools/install-guard.test.ts`; `npm test`

## Comments

**Build (build/dev-environment-01).** Files: `tools/wt.sh`, `tools/wt.test.ts`, `tools/install-guard.test.ts`, `.gitignore` (`node_modules/` became `/node_modules`). No dependency change.

Evidence:
- `npx vitest run tools/wt.test.ts tools/install-guard.test.ts`: 2 files, 8 tests pass.
- `npm test` after the merge of the integration tip: tsc clean; vitest 48 files, 848 tests pass; node test 42 pass.
- Worktree script test (`tempRepo({ hooks: false })`, real `.gitignore`, fake package folder, stub `npm` that deletes each entry of `node_modules`):
  - `wt add <branch>`: makes a worktree on a new branch from main, links the packages, and git status stays empty.
  - `wt add with a changed lock file`: installs with npm ci on a branch whose lock file differs, and the main package folder keeps every entry; removes the link before npm ci when the lock file of a linked worktree changes.
  - `wt add <path>`: sets up the packages of an existing worktree and of a detached worktree; uses an existing branch, starts a new one from `<start>`, and finds the main checkout from a worktree.
  - `installation guard`: runs `tools/install-guard.test.ts` in a separate vitest with `INSTALL_GUARD_CHECKOUT`. It fails in a linked worktree with a changed lock file and names `wt add <path>`; it passes in the main checkout and in a linked worktree with an equal lock file.
- Mutation check: with the link removal taken out of `wt.sh`, the test "removes the link before npm ci" fails (the stub empties the main package folder).

Decisions to note:
- Guard reference lock file. The spec compares with the main checkout's lock file. The guard compares with the lock file beside the folder that the link points to. For each link that `wt add` makes, that is the main checkout, so every acceptance case is the same. The difference: the build worktrees of this retro link the integration worktree's own installation (its lock file differs from main's). A literal guard fails `npm test` in each of them; this guard passes, because their lock file is equal to the integration worktree's.
- Equal lock file and an own installation (a real `node_modules` folder): the package step keeps the folder and prints `installed`. It does not delete an installation.
- `wt add <main checkout path>` stops with a reason: the main checkout keeps its own installation.
- Output line: path, branch (`(detached)` for a detached HEAD) and `linked` or `installed`, with a tab between them, because paths in this repository hold spaces. `git worktree add` and `npm ci` output goes to stderr.
- The script is `tools/wt.sh`; no `wt` command on PATH and no npm script. The guard message names `wt add <path>` and the script path.
