# 01: One index page for the docs folder, and a check that keeps it whole

Status: ready-for-human
Branch: staging/docs-index

**What to build:** An agent finds the right doc in one read. `docs/INDEX.md` gives one line for each top-level entry of `docs/`: its path and the question that it answers, grouped by topic. Where two docs hold the same facts, the line names the source of truth. The dated snapshots go to the tasks archive. A docs lint fails when the index and the folder do not agree. The tracker stays as it is: the index is a map, not a second tracker.

**Owns:** `docs/INDEX.md`; `tools/docs-index.docs.test.ts`; the three moved files and the lines that name them; one line in `AGENTS.md`.

## Plan

1. Find what names each dated snapshot (`git grep`). Move `STATUS-2026-09-13.md`, `TAKEOVER-REVIEW-2026-09-14.md` and `RELEASE-REVIEW-2026-09-16.md` to `docs/tasks-archive/` with `git mv`. Change each live line that names the old path.
2. Write `docs/INDEX.md`: one line for each top-level entry, in six topic groups. Mark the source of truth where two docs overlap.
3. Add `tools/docs-index.docs.test.ts`. It fails when a top-level entry has no index line, or when an index link names no file.
4. Add one pointer line to the Start here section of `AGENTS.md`.

## Checks

- [x] `git ls-files` gives nothing for the three old paths; the three files are in `docs/tasks-archive/`.
- [x] No live doc names an old path. A closed ticket and a recovered copy keep their words (they record what was true then).
- [x] The new lint fails on a fixture with a missing entry and with a dead link, and on the real index with one line removed.
- [x] `npm test` and `npm run test:docs` pass.

## Comments

**Base.** The branch starts at `origin/main` (`bdd886c7`). The local `main` of the main checkout is far behind it.

**Moves.** Only the three dated snapshots move. `SIM-PLAN.md`, `KINGS-POWERS-PLAN.md`, `TAKEOVER-PLAN.md`, `RUNS.md` and `STATUS.md` stay: code comments, live docs or the steering lint name them. The index marks them as history and names the doc that wins. Changed lines: `.gitignore`, `docs/STATUS.md`, `docs/TAKEOVER-PLAN.md` (an absolute link to an old folder is now relative), `docs/research/licensing-2026-09-14.md`, `docs/status/index.html`, `docs/tasks-archive/2026-09.md`, `docs/tasks-archive/STATUS-2026-09-13.md`. Not changed: the closed tickets `secrets-and-public-gates/11` and `steering-cut/04`, and the recovered copies in `docs/research/m1-results/`.

**Index.** 44 top-level entries in six groups. Each path is a link, so the lint checks it. The lint reads the entries from `git ls-files --cached --others --exclude-standard`: a new file counts before `git add`; an ignored folder (`docs/claude-recovery/`) and `.DS_Store` do not count.

**Red.** With the `safety/` line removed and the `balance/FRAMEWORK.md` link changed to a missing file, `KINGDOWN_TEST_FILE=tools/docs-index.docs.test.ts npm run test:docs`: 1 failed, 4 passed. The faults:

    docs/INDEX.md § (entries) (1 of 44 entries): the entry "safety" has no line; add "- [safety](safety): <the question it answers>" under its topic
    docs/INDEX.md § Research and runs (line 62): the link "balance/FRAMEWORK-OLD.md" names no file

An untracked `docs/NEW-NOTE.md` also gives one fault (1 of 45 entries).

**Green.** `npm run test:docs`: 14 files, 171 tests passed. The new test also type-checks under the `tsconfig.tools.json` of the open checks branch (`staging/ci-guards`), and its name matches that branch's docs-test pattern.

**Full suite.** `npm test` at `095a503d`: vitest 242 files passed, 15 skipped; 4560 tests passed, 221 skipped; node --test 50 of 50 passed; exit 0.

**Review.** The PR waits for an independent review and the owner's merge. Hence `ready-for-human`.
