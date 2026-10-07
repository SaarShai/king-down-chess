# 02: One launch entry serves the worktree that the target file names

**What to build:** An agent in any session previews any worktree through one launch entry, `worktree`. The entry holds no absolute path, so a commit of the launch file cannot put a local path into git again (4830dee). The entry runs `wt serve`, which reads one target file beside the main checkout's launch file. The target file holds one worktree name or absolute path. `wt serve` runs that worktree's own Vite on 127.0.0.1, so the preview always shows the worktree under test. When it cannot serve, it stops with a one-line reason. Git ignores the target file and the previews folder. This ticket adds no dependency.

**Blocked by:** 01

**Status:** resolved

**Owns:** `tools/wt.sh` (the `serve` command), `tools/wt.test.ts`, `.claude/launch.json`, `.gitignore` (the target file and previews folder lines only). Shared file: secrets-and-public-gates/11 edits other `.gitignore` lines and blocks on this ticket

- [x] The target file is `.claude/preview-target` in the main checkout. It holds one worktree name (the folder name under the worktrees folder) or one absolute path.
- [x] `wt serve` stops with a non-zero exit and a one-line reason when the target file is missing, when it names no worktree of this repository, or when the named worktree has no `node_modules`.
- [x] Else `wt serve` runs the named worktree's own Vite with that worktree as root, host 127.0.0.1, port `PORT` (default 5177) and a strict port, so it stops when the port is in use.
- [x] `.claude/launch.json` has no `workshop` entry. It has a `worktree` entry that runs the worktree script's `serve` by a relative path on port 5177. The `dev`, `playable`, `painted-2d` and `previews` entries stay unchanged.
- [x] No launch entry has an argument that starts with `/`.
- [x] `.gitignore` lists the target file and `/sim/out/previews/`. In the worktree script test, a target file in the temporary main checkout does not show in `git status --porcelain`.
- [x] Worktree script test (seam 1, `tempRepo()` hooks-off): `serve` with no target exits non-zero with its reason; with a target that names a worktree with no `node_modules`, it exits non-zero with its reason; with a valid target, by name and by absolute path, it calls that worktree's stub Vite with the root, `--host 127.0.0.1` and the port from `PORT`.

**Verify:** `npx vitest run tools/wt.test.ts`; `npm test`

## Comments

**Build (build/dev-environment-02).** Files: `tools/wt.sh` (`serve`, and a shared `worktree` check that `add <path>` also uses), `tools/wt.test.ts`, `.claude/launch.json`, `.gitignore` (two lines). No dependency change.

Evidence:
- `npx vitest run tools/wt.test.ts`: 1 file, 12 tests pass (5 new in `wt serve`).
- `npm test` after the merge of the integration tip 4cd8e14: tsc clean; vitest 58 files, 1060 tests pass; node test 42 pass.
- Worktree script test, `describe('wt serve')` (`tempRepo({ hooks: false })`, a stub Vite in the main package folder that logs its folder and arguments):
  - `stops with a reason when the target file is missing`: `wt: no target file: <main>/.claude/preview-target`.
  - `runs the named worktree's own Vite on 127.0.0.1, by name and by absolute path, on PORT`: by name with `PORT` empty gives port 5177; by an absolute path that holds a space, with space at the two ends of the line, and `PORT=5199`. The stub runs in the worktree folder and gets `<root> --host 127.0.0.1 --port <port> --strictPort`.
  - `stops with a reason when the target names no worktree of this repository`: an unknown name, a folder that is not the top of a worktree, a worktree of another repository.
  - `stops with a reason when the named worktree has no node_modules`: the reason names `wt add <path>`.
  - `git ignores the target file and the previews folder`: red before the two `.gitignore` lines, green after.
- Mutation check: with each of the three stop checks taken out of `wt.sh` in turn, its test fails.
- Launch file, by hand (`node -e` on `.claude/launch.json`): entries `dev`, `playable`, `painted-2d`, `previews`, `worktree`; 0 arguments that start with `/`; the diff touches only the old `workshop` entry and the final newline. The settings test of ticket 05 asserts this in `npm test`.
- Real Vite smoke run (in a scratch clone of this branch, so the main checkout got no target file): `wt serve` with a target by name served the named worktree (its `package.json`, not the clone's) on 127.0.0.1 only; with a target by absolute path to a folder whose `node_modules` is a link, `/`, `/src/main.ts` and `/node_modules/.vite/deps/three.js` gave 200. The server stopped by PID.

Notes:
- The target file can also name the main checkout by its absolute path; the spec does not forbid it, and `wt serve` accepts it.
- Vite keeps its dependency cache in `node_modules/.vite`. In a linked worktree, that is the main checkout's folder, so two worktrees served in turn rebuild the shared cache ("Re-optimizing dependencies because vite config has changed"). It works, but it is slow when two serve at once. A per-worktree `cacheDir` would fix it; the Vite config belongs to the checks spec and ticket 05.
- Ticket 01 code, seen in the smoke run: in a clone with no local `main` (only `origin/main`), `wt add smoke/view` made the worktree on a new local `main`, not on `smoke/view`. A second call made the right branch. The real main checkout has a local `main`, so this does not occur there.
- Review fix F6: the header of `tools/wt.test.ts` names tickets 01, 02 and 03 (it also holds the `wt serve` tests of this ticket).
