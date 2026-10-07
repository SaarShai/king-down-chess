# 02: One launch entry serves the worktree that the target file names

**What to build:** An agent in any session previews any worktree through one launch entry, `worktree`. The entry holds no absolute path, so a commit of the launch file cannot put a local path into git again (4830dee). The entry runs `wt serve`, which reads one target file beside the main checkout's launch file. The target file holds one worktree name or absolute path. `wt serve` runs that worktree's own Vite on 127.0.0.1, so the preview always shows the worktree under test. When it cannot serve, it stops with a one-line reason. Git ignores the target file and the previews folder. This ticket adds no dependency.

**Blocked by:** 01

**Status:** ready-for-agent

**Owns:** `tools/wt.sh` (the `serve` command), `tools/wt.test.ts`, `.claude/launch.json`, `.gitignore` (the target file and previews folder lines only). Shared file: secrets-and-public-gates/11 edits other `.gitignore` lines and blocks on this ticket

- [ ] The target file is `.claude/preview-target` in the main checkout. It holds one worktree name (the folder name under the worktrees folder) or one absolute path.
- [ ] `wt serve` stops with a non-zero exit and a one-line reason when the target file is missing, when it names no worktree of this repository, or when the named worktree has no `node_modules`.
- [ ] Else `wt serve` runs the named worktree's own Vite with that worktree as root, host 127.0.0.1, port `PORT` (default 5177) and a strict port, so it stops when the port is in use.
- [ ] `.claude/launch.json` has no `workshop` entry. It has a `worktree` entry that runs the worktree script's `serve` by a relative path on port 5177. The `dev`, `playable`, `painted-2d` and `previews` entries stay unchanged.
- [ ] No launch entry has an argument that starts with `/`.
- [ ] `.gitignore` lists the target file and `/sim/out/previews/`. In the worktree script test, a target file in the temporary main checkout does not show in `git status --porcelain`.
- [ ] Worktree script test (seam 1, `tempRepo()` hooks-off): `serve` with no target exits non-zero with its reason; with a target that names a worktree with no `node_modules`, it exits non-zero with its reason; with a valid target, by name and by absolute path, it calls that worktree's stub Vite with the root, `--host 127.0.0.1` and the port from `PORT`.

**Verify:** `npx vitest run tools/wt.test.ts`; `npm test`
