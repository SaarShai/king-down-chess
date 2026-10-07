# 11: The 77 transcripts leave the tree with no broken link

**What to build:** One commit on the integration branch removes the 77 session transcript files from the two recovery folders. In the same commit, each link or path into those folders in a tracked file becomes the path plus the short id of the last main commit that held the file, or the builder drops the link. The kept records keep the path as data: the takeover hash baseline, the old task copy in the research results, the retro and spec records, and the `/tmp` log paths in the painted-game continuation checks. The commit adds ignore lines for both recovery folders and for the Workshop figure batch, final run, swarm and figures folders (not the tracked figure samples folder), and stops tracking the policy data file that the ignore rules already list. After the commit, git tracks no rules PDF; the copy in the main checkout's art source rules folder has the same SHA-256. History stays as it is (decision 5). Two doc lints keep this true.

In TASKS.md, LESSONS.md and MATRIX.md this ticket changes only links, and it lands before the steering cut.

**Blocked by:** checks-and-hooks/07 (the cursor adoption check's output default moves out of the transcript folder), checks-and-hooks/01 (the `.docs.test.ts` doc-lint suffix and `npm run test:docs`), dev-environment/02 (the last dev-environment edit of `.gitignore`, which this ticket also edits)

**Status:** ready-for-agent

**Owns:** `docs/claude-recovery/**` and `docs/cursor-recovery/**` (removal); the link lines in `TASKS.md`, `LESSONS.md`, `docs/MATRIX.md`, `docs/PIECES-PROPOSED.md`, `docs/PLAYABLE-CLAY.md`, `docs/RULES.md`, `docs/TAKEOVER-PLAN.md`, `docs/TAKEOVER-REVIEW-2026-09-14.md`, `docs/takeover/BASELINE.md`, `docs/research/*-2026-09-1*.md`, `docs/research/*-2026-09-2*.md`, `sim/specs/README.md`; `.gitignore` (the recovery, figure-folder and policy lines only); `sim/nnue/policy.bin` (untrack only); `tools/public-tree.docs.test.ts`. Shared files: dev-environment/01 and 02 edit other `.gitignore` lines first (this ticket blocks on 02); steering-cut/01 to 09 edit `TASKS.md`, `LESSONS.md`, `docs/MATRIX.md` and `docs/research/opencode-takeover-review-2026-09-21.md` after this ticket (steering-cut/01, 02 and 04 block on it)

**Verify:** `npm run test:docs`; `npm test`; `git ls-files docs/claude-recovery docs/cursor-recovery | wc -l` gives 0; `git ls-files -ci --exclude-standard` gives nothing

- [ ] Red first: before the removal, the link lint fails and names the relative link in `docs/RULES.md`.
- [ ] The link lint finds a path into either transcript folder, with or without the `docs/` prefix, in every tracked file except the kept records (`docs/takeover/baseline.json`, `original-TASKS.md.txt`, `docs/specs/**`, and the `/tmp` paths in `docs/painted-game/continuation-checks-2026-09-29.json`). A fixture file with such a path fails it.
- [ ] The ignore lint fails when a tracked file matches the ignore rules, and asserts that `.gitignore` holds `figure-batch-*`, `figure-final-run`, `figure-swarms`, `figures-*` and both recovery folders.
- [ ] One commit holds the 77 removals, the link edits, the ignore lines and the untrack of `sim/nnue/policy.bin`; `git show --stat` of it lists nothing else.
- [ ] Each changed link names a commit id that `git cat-file -e <id>:<path>` accepts.
- [ ] The ticket records the SHA-256 of the removed rules PDF and of the art source rules copy; they are equal.
- [ ] The research files under names ending in `-context-recovery` stay tracked.
