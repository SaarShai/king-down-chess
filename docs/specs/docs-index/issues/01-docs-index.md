# 01: One index page for the docs folder, and a check that keeps it whole

Status: claimed
Branch: staging/docs-index

**What to build:** An agent finds the right doc in one read. `docs/INDEX.md` gives one line for each top-level entry of `docs/`: its path and the question that it answers, grouped by topic. Where two docs hold the same facts, the line names the source of truth. The dated snapshots go to the tasks archive. A docs lint fails when the index and the folder do not agree. The tracker stays as it is: the index is a map, not a second tracker.

**Owns:** `docs/INDEX.md`; `tools/docs-index.docs.test.ts`; the three moved files and the lines that name them; one line in `AGENTS.md`.

## Plan

1. Find what names each dated snapshot (`git grep`). Move `STATUS-2026-09-13.md`, `TAKEOVER-REVIEW-2026-09-14.md` and `RELEASE-REVIEW-2026-09-16.md` to `docs/tasks-archive/` with `git mv`. Change each live line that names the old path.
2. Write `docs/INDEX.md`: one line for each top-level entry, in five topic groups. Mark the source of truth where two docs overlap.
3. Add `tools/docs-index.docs.test.ts`. It fails when a top-level entry has no index line, or when an index link names no file.
4. Add one pointer line to the Start here section of `AGENTS.md`.

## Checks

- [ ] `git ls-files` gives nothing for the three old paths; the three files are in `docs/tasks-archive/`.
- [ ] No live doc names an old path. A closed ticket and a recovered copy keep their words (they record what was true then).
- [ ] The new lint fails on a fixture with a missing entry and with a dead link, and on the real index with one line removed.
- [ ] `npm test` and `npm run test:docs` pass.

## Comments
