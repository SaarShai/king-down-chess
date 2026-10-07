# 05: Repo gate checks pushes and refuses files in private folders

**What to build:** When a push sends commits, the gate reads each blob that the pushed commits reach and no origin ref reaches, and applies its rules there. So a large file or a private file in any pushed commit stops the push, also when a later commit deletes it. A new rule refuses an added or changed path in the two transcript folders, the secrets folder and the art source folder, also a file forced past the ignore rules. The art manifest passes, and so do the research folders whose names end in `-context-recovery`. Both `staged` and `push` mode apply the size and path rules. A deleted path passes.

**Blocked by:** 04; checks-and-hooks/04 (the pre-push hook that calls `gate -- push <remote> <url>`)

**Status:** ready-for-agent

**Owns:** `tools/gate.mjs`, `tools/gate/`, `tools/gate.test.ts`

**Verify:** `npm test`

- [x] In `tempRepo()` with a bare remote, the real pre-push hook calls `gate -- push <remote> <url>` with git's stdin. A push of a 3 MB file fails without an allowlist line and passes with one.
- [x] A push of a commit that adds a transcript file, then a commit that deletes it, fails; the fault line names the first commit and the path.
- [x] A commit that adds a file in the secrets folder or a forced (`git add -f`) art source file fails in `staged` and `push` mode.
- [x] A commit that edits the art manifest passes; a commit that adds a file under `docs/research/m1-results/x-context-recovery/` passes.
- [x] A commit that deletes transcript files passes.
- [x] A push of commits that origin already reaches reads no blob again (a test counts the paths the gate reads), and a branch deletion in the push passes.

## Comments

Build 2026-10-07, branch `build/secrets-and-public-gates-05`.

- Files: `tools/gate.mjs` (push mode, the header), `tools/gate/private.mjs` (new: private rule), `tools/gate/size.mjs` (each file carries its own `where`), `tools/gate.test.ts`. One edit outside the Owns line: `tools/git-hooks/pre-commit.test.ts` (checks-and-hooks/02). Its `stub gate` block sent the fake object name `1` in push mode; the real gate now reads that object and gives exit 2, which is correct. The case now sends a deletion line, and the block is named `gate interface` (ticket 04 asked for the rename).
- Push mode: `git rev-list --reverse --topo-order <pushed object> --not --remotes=<remote> <remote object names that git has> <objects of earlier lines>`, then one `git diff-tree --stdin -r -z --no-renames --root -c` for all of these commits. The combined diff (`-c`) lists a file of a merge only when it differs from each parent, so a merge does not read again the files that it takes from a branch that origin holds. A deleted file and a submodule entry pass. Each blob is read once. A deletion line passes.
- The size allowlist in push mode comes from the pushed commit (`<pushed object>:tools/gate/size-allowlist.txt`), not from the work tree. So the allowlist line must be in the pushed commits.
- Private rule: the exact folders `docs/claude-recovery/`, `docs/cursor-recovery/`, `.secrets/`, `art-src/`; `art-src/MANIFEST.md` passes. Because the rule names exact folders, `docs/research/m1-results/*-context-recovery/` is not private. Fault lines: `gate: private: index: <path>: <folder> is a private folder; unstage it: git rm --cached "<path>"` and `gate: private: <12-character commit>: <path>: <folder> is a private folder; take the file out of that commit (for example with git rebase), then push again`. Size lines in push mode: `gate: size: <12-character commit>: <path>: ...`.
- Test seam: when `GATE_TRACE` names a file, the gate adds the path of each blob that it reads. The header states it.
- Tests (`npx vitest run tools/gate.test.ts`, 20 pass; 10 new, all through the real pre-push or pre-commit hook in `tempRepo()` with a bare remote, except the fault case): a 3 MB file refuses the push with one `gate: size: <commit>: media/big.bin` line, and passes when the pushed commit holds the allowlist line; a transcript added in one commit and deleted in the next refuses with one line that names the first commit, not the second; a secrets-folder file and a forced (`git add -f`, the folder is in `.gitignore`) art source file each refuse the commit through pre-commit, and both refuse the push (two lines, in commit order); a manifest edit and `docs/research/m1-results/x-context-recovery/notes.md` pass at commit and at push; a commit and a push that delete transcript files pass; a push of a commit that origin already reaches reads no path, the next push reads only the new file, and a branch deletion in the same push passes; a merge of a branch that origin holds reads only the new file of this branch; a pushed object that git does not have gives exit 2 and one `gate: fault:` line.
- Red first: before the change, 7 of the 10 new tests failed (push mode applied no rule; staged mode had no private rule). The pass cases passed at once.
- `npm test` after the merge of the integration tip `2b504ff`: type check clean; vitest 55 files, 914 tests pass; node tests 42 pass. The first run after this merge had two time-outs at 5 s in `src/rules/power-fixes.test.ts` and `src/sim/piece-activity.test.ts` (load average 15 from parallel builds); both files pass alone (45 tests in 6.7 s), and the full rerun passed.
- Dry run, no push: `gate push origin url` with this branch tip as a new branch gave exit 0 and no output in 0.34 s. The 96 commits that `origin/main` (`f1b8e72` in this checkout's refs) does not reach hold no private file and no file over the limit. Ticket 12 makes the real rehearsal after a fetch.
- This branch's own commits went through the real pre-commit hook with the new staged rules.

