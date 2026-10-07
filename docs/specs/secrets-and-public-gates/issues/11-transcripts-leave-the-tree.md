# 11: The 77 transcripts leave the tree with no broken link

**What to build:** One commit on the integration branch removes the 77 session transcript files from the two recovery folders. In the same commit, each link or path into those folders in a tracked file becomes the path plus the short id of the last main commit that held the file, or the builder drops the link. The kept records keep the path as data: the takeover hash baseline, the old task copy in the research results, the retro and spec records, and the `/tmp` log paths in the painted-game continuation checks. The commit adds ignore lines for both recovery folders and for the Workshop figure batch, final run, swarm and figures folders (not the tracked figure samples folder), and stops tracking the policy data file that the ignore rules already list. After the commit, git tracks no rules PDF; the copy in the main checkout's art source rules folder has the same SHA-256. History stays as it is (decision 5). Two doc lints keep this true.

In TASKS.md, LESSONS.md and MATRIX.md this ticket changes only links, and it lands before the steering cut.

**Blocked by:** checks-and-hooks/07 (the cursor adoption check's output default moves out of the transcript folder), checks-and-hooks/01 (the `.docs.test.ts` doc-lint suffix and `npm run test:docs`), dev-environment/02 (the last dev-environment edit of `.gitignore`, which this ticket also edits)

**Status:** ready-for-human

**Owns:** `docs/claude-recovery/**` and `docs/cursor-recovery/**` (removal); the link lines in `TASKS.md`, `LESSONS.md`, `docs/MATRIX.md`, `docs/PIECES-PROPOSED.md`, `docs/PLAYABLE-CLAY.md`, `docs/RULES.md`, `docs/TAKEOVER-PLAN.md`, `docs/TAKEOVER-REVIEW-2026-09-14.md`, `docs/takeover/BASELINE.md`, `docs/research/*-2026-09-1*.md`, `docs/research/*-2026-09-2*.md`, `sim/specs/README.md`; `.gitignore` (the recovery, figure-folder and policy lines only); `sim/nnue/policy.bin` (untrack only); `tools/public-tree.docs.test.ts`. Shared files: dev-environment/01 and 02 edit other `.gitignore` lines first (this ticket blocks on 02); steering-cut/01 to 09 edit `TASKS.md`, `LESSONS.md`, `docs/MATRIX.md` and `docs/research/opencode-takeover-review-2026-09-21.md` after this ticket (steering-cut/01, 02 and 04 block on it)

**Verify:** `npm run test:docs`; `npm test`; `git ls-files docs/claude-recovery docs/cursor-recovery | wc -l` gives 0; `git ls-files -ci --exclude-standard` gives nothing

- [x] Red first: before the removal, the link lint fails and names the relative link in `docs/RULES.md`.
- [x] The link lint finds a path into either transcript folder, with or without the `docs/` prefix, in every tracked file except the kept records (`docs/takeover/baseline.json`, `original-TASKS.md.txt`, `docs/specs/**`, and the `/tmp` paths in `docs/painted-game/continuation-checks-2026-09-29.json`). A fixture file with such a path fails it.
- [x] The ignore lint fails when a tracked file matches the ignore rules, and asserts that `.gitignore` holds `figure-batch-*`, `figure-final-run`, `figure-swarms`, `figures-*` and both recovery folders.
- [x] One commit holds the 77 removals, the link edits, the ignore lines and the untrack of `sim/nnue/policy.bin`; `git show --stat` of it lists nothing else.
- [x] Each changed link names a commit id that `git cat-file -e <id>:<path>` accepts.
- [x] The ticket records the SHA-256 of the removed rules PDF and of the art source rules copy; they are equal.
- [x] The research files under names ending in `-context-recovery` stay tracked.

## Comments

Build 2026-10-07, branch `build/secrets-and-public-gates-11`.

- Removal commit `ec988f3`. `git show --stat` lists the 77 transcript removals, `sim/nnue/policy.bin` (untracked, `Bin 6881280 -> 0`), `.gitignore` (+9) and the 32 link files of the Owns line: 111 files, nothing else. The lint test is a separate commit, `9cd99f5`.
- Commit id: each changed link is now `` `dd34fa5:<path>` `` (git's `<id>:<path>` form; `git show dd34fa5:<path>` reads it). `dd34fa5` is the tip of `main` and `origin/main` on 2026-10-07: the last main commit that holds the files. A markdown link becomes its text, then the pinned path in parentheses. The `…` in `docs/research/ai-q6-audit-2026-09-16.md` is now the full `queue3.sh` path, and the `:6` line suffix in `docs/TAKEOVER-REVIEW-2026-09-14.md` is gone, so `git cat-file -e` accepts each one. `docs/takeover/BASELINE.md` row 47 also says that the folder left the tree.
- Lint: `tools/public-tree.docs.test.ts`, 8 tests. Link lint: a bare path into either folder, with or without `docs/` (also `../` and absolute links), fails; a pinned `<id>:<path>` passes only when `git cat-file --batch-check` finds it (68 pinned references, 0 missing). Ignore lint: `git ls-files -ci --exclude-standard` is empty; a fixture repository with a tracked ignored file fails it; `.gitignore` holds the six names, and `git check-ignore --no-index` ignores a path in each folder and not one in `figure-samples-2026-10-06/`.
- Red first (before the removal, lint uncommitted): 5 of 8 tests failed. The link lint named `docs/RULES.md:199: cursor-recovery/2026-09-24-0213b442/EXECUTED.md` and the other links (plus the transcripts' own files); the ignore lint named `sim/nnue/policy.bin` and the missing `.gitignore` lines.
- Kept records, besides the ticket's list: `.gitignore` (it names the two folders) and the gate rule and its test (`tools/gate/**`, `tools/gate.test.ts`: the private-folder rule and its fixture paths in temporary repositories). The `/tmp/king-down-claude-recovery-…` paths in `docs/painted-game/continuation-checks-2026-09-29.json` and `TASKS.md:482` pass with no exception, because the lint reads a `-` before the folder name as part of another name.
- Rules PDF: SHA-256 of the removed `docs/claude-recovery/scratchpad-recovered/af00383a-be3c-43af-8c39-b2e17188dc55/docs/king-down-classic-rules.pdf` is `be57cf18a20a85f0912c9632c3dbac910dcea0c0fc49f48c3132658945e22b38`. SHA-256 of the main checkout's `art-src/rules/King Down Classic (rules) .pdf` is the same. After the commit `git ls-files | grep -ci '\.pdf$'` gives 0.
- `git ls-files docs/research/m1-results | grep -c context-recovery`: 26, still tracked.
- `.gitignore` lines: `/docs/claude-recovery/`, `/docs/cursor-recovery/`, `/docs/visual-design/workshop/figure-batch-*/`, `…/figure-final-run/`, `…/figure-swarms/`, `…/figures-*/`.
- `policy.bin`: SHA-256 `e99256c894661798f1f521e4e07789798fe9ac398e4c937ebe751c5be8bcd390`, the same in the main checkout. Owner action at the merge into main: the checkout that takes `ec988f3` deletes `sim/nnue/policy.bin` from its disk. Copy it aside first and back after (it is then ignored). The builder did not touch the main checkout.
- Verify: `npm run test:docs`: 1 file, 8 tests pass. `git ls-files docs/claude-recovery docs/cursor-recovery | wc -l`: 0. `git ls-files -ci --exclude-standard`: nothing.
- `npm test` (load average 44 to 55 from parallel builds): two plain runs failed only on time-outs (5 then 39 tests, each "Test timed out in 5000ms" or "30000ms", none in the new file). The same steps with a long time-out (`npm run typecheck`, `npx vitest run --testTimeout=300000`, the node tests): typecheck exit 0; 60 vitest files, 1078 tests pass; 42 node tests pass. The merger reruns plain `npm test` when the load is lower.

Merger, 2026-10-07: merge commit f1052b6 into claude/retro-2026-10-06, no conflict. A plain `npm test` after the merge is green: typecheck, 1100 vitest tests in 61 files, 42 node tests. `npm run test:docs` gives 8 of 8. `git ls-files -ci --exclude-standard` gives nothing. The status stays ready-for-human: the owner must copy `sim/nnue/policy.bin` aside before main takes this merge and put it back after.
