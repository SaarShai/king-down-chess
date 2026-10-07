# 05: Repo gate checks pushes and refuses files in private folders

**What to build:** When a push sends commits, the gate reads each blob that the pushed commits reach and no origin ref reaches, and applies its rules there. So a large file or a private file in any pushed commit stops the push, also when a later commit deletes it. A new rule refuses an added or changed path in the two transcript folders, the secrets folder and the art source folder, also a file forced past the ignore rules. The art manifest passes, and so do the research folders whose names end in `-context-recovery`. Both `staged` and `push` mode apply the size and path rules. A deleted path passes.

**Blocked by:** 04; checks-and-hooks/04 (the pre-push hook that calls `gate -- push <remote> <url>`)

**Status:** ready-for-agent

**Owns:** `tools/gate.mjs`, `tools/gate/`, `tools/gate.test.ts`

**Verify:** `npm test`

- [ ] In `tempRepo()` with a bare remote, the real pre-push hook calls `gate -- push <remote> <url>` with git's stdin. A push of a 3 MB file fails without an allowlist line and passes with one.
- [ ] A push of a commit that adds a transcript file, then a commit that deletes it, fails; the fault line names the first commit and the path.
- [ ] A commit that adds a file in the secrets folder or a forced (`git add -f`) art source file fails in `staged` and `push` mode.
- [ ] A commit that edits the art manifest passes; a commit that adds a file under `docs/research/m1-results/x-context-recovery/` passes.
- [ ] A commit that deletes transcript files passes.
- [ ] A push of commits that origin already reaches reads no blob again (a test counts the paths the gate reads), and a branch deletion in the push passes.
