# 01: Worktree script `add` links or installs the packages

**What to build:** An agent in any tool runs `wt add` and gets a worktree that is ready to test in seconds. When the worktree's lock file is byte-equal to the main checkout's, the worktree links the main checkout's packages and uses no disk. When the lock file differs, the worktree gets its own installation, and the main checkout's packages stay intact. Git ignores the link, so no clone commits it. In a linked worktree with a different lock file, `npm test` fails and tells the agent to run `wt add <path>`. This ticket adds no dependency.

**Blocked by:** checks-and-hooks/02 (`tempRepo()` with the hooks-off option), checks-and-hooks/01 (vitest that collects tests from the tools folder)

**Status:** ready-for-agent

**Owns:** `tools/wt.sh` (new), `tools/wt.test.ts` (new), `tools/install-guard.test.ts` (new), `.gitignore` (the `node_modules/` line only)

- [ ] The script runs under `/bin/bash` 3.2 with BSD tools. It finds the main checkout through git's common folder, also when it runs from a worktree.
- [ ] `wt add <branch> [<start>]` makes a worktree in the main checkout's worktrees folder, named after the last part of the branch. It uses the branch when it exists, else makes a new branch from `<start>` (default `main`).
- [ ] `wt add <path>` on an existing worktree, detached or not, does only the package step.
- [ ] Package step: a byte-equal lock file gives a `node_modules` link to the main checkout's folder. A different lock file removes any link first, then runs `npm ci`. The step prints one line: path, branch, and `linked` or `installed`.
- [ ] `.gitignore` holds `/node_modules` in place of `node_modules/`, so it matches a folder and a link.
- [ ] Worktree script test (seam 1, `tempRepo()` hooks-off, the real `.gitignore` copied in, a fake package folder, a stub `npm` on `PATH` that deletes each entry of `node_modules` as `npm ci` does):
  - [ ] `add <branch>` links, and `git status --porcelain` in the new worktree is empty.
  - [ ] A changed lock file calls the stub with `ci`, the output says `installed`, and the main checkout's package folder keeps every entry.
  - [ ] `add <path>` sets up an existing worktree and a detached worktree.
- [ ] Installation guard (seam 1): `tools/install-guard.test.ts` fails when `node_modules` is a link and the lock file differs from the main checkout's, and its message names `wt add <path>`. It passes in the main checkout and in a linked worktree with an equal lock file. The worktree script test runs the same guard against a temporary linked worktree with a changed lock file and sees the failure.

**Verify:** `npx vitest run tools/wt.test.ts tools/install-guard.test.ts`; `npm test`
