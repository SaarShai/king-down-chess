# 01: Steering lint frame and union merges for the trackers

**What to build:** A merge of two branches that both add lines to a tracker file keeps both sides and gives no conflict. The ability matrix does not use this merge, because a union merge copies table rows two times. A new steering lint in `npm test` reads the steering files as an agent reads them. When a rule fails, the message names the file, the section and the number. This ticket adds the lint frame and the first rules, which pass today: the union driver applies to the tracker files and not to the matrix; the matrix holds each Workshop row and the Workshop heading one time; no run id occurs two times in a live run table; no live steering file holds a broken relative link.

**Blocked by:** checks-and-hooks/01 (the doc-lint suffix, the `test:docs` script, and vitest that collects tests from the tools folder); secrets-and-public-gates/11 (the transcript removal and its link fix, so the broken-link rule passes on the real files)

**Status:** resolved

- [x] The attributes file gives git's union merge driver to TASKS.md, LESSONS.md, the topic files in the lessons folder and QUEUE.md. It gives no merge driver to MATRIX.md.
- [x] The steering lint is one vitest module with the doc-lint suffix. `npm test` and `npm run test:docs` both run it.
- [x] The lint defines the live files: the steering files that exist outside the tasks archive (AGENTS.md, COMPUTE.md, HOSTING.md, TASKS.md, LESSONS.md, the topic files, the handoffs, QUEUE.md, issue-tracker.md, domain.md).
- [x] Rule: `git check-attr merge` gives `union` for each tracker file and `unspecified` for MATRIX.md.
- [x] Rule: MATRIX.md holds the D.1 row "Material behind (own side)", the D.2 row "Any piece" and the Workshop heading, one time each. It passes today, as a guard.
- [x] Rule: in each table under a QUEUE.md heading that starts with "Running", no run id occurs two times. A cell with ids split by commas counts each id.
- [x] Rule: no live file holds a relative link to a file that does not exist. A fixture with one broken link makes the rule fail and name the file and the link; the real files pass.
- [x] Each failure message names the file, the section and the number (size, count or line).
- [x] A one-off script in a temporary repository merges two branches that each add a line at the end of TASKS.md. The merge gives no conflict and keeps both lines. The output goes in this ticket.

**Owns:** `.gitattributes`, `tools/steering.docs.test.ts`

**Verify:** `npm test`; `npm run test:docs`; `git check-attr merge -- TASKS.md LESSONS.md docs/QUEUE.md docs/MATRIX.md`; the one-off union-merge script in a temporary repository.

## Comments

**2026-10-07, builder (branch `build/steering-cut-01`).**

- `.gitattributes`: `/TASKS.md`, `/LESSONS.md`, `/docs/lessons/*.md` and `/docs/QUEUE.md` get `merge=union`. MATRIX.md gets no line.
- `tools/steering.docs.test.ts`: 9 tests in 5 groups. Each fault prints as `<file> § <section> (<size, count or line>): <rule>`.
  - merge drivers: `git check-attr merge` on the four trackers and MATRIX.md. The folder `docs/lessons/` does not exist yet, so the probe path `docs/lessons/topic.md` stands for the topic files.
  - MATRIX.md guard: a fixture with a copied D.1 row fails with the section and both lines; a fixture with no Workshop heading fails with count 0; the real file passes.
  - QUEUE.md run tables: a fixture fails on `deal-d2` (lines 11, 14) and on `pa-d4` in a comma cell (lines 12, 13); a copy in another table or under another heading does not count; the real file passes.
  - live files: the list in the module (AGENTS.md, docs/COMPUTE.md, docs/HOSTING.md, TASKS.md, LESSONS.md, docs/lessons/*.md, HANDOFF.md, docs/HANDOFF-*.md, docs/QUEUE.md, docs/agents/issue-tracker.md, docs/agents/domain.md); a file joins when it exists; no file of `docs/tasks-archive/` joins.
  - relative links: a fixture with `docs/no-such-file.md` fails with `AGENTS.md § Notes (line 4)`; links with a scheme, an anchor only, in fenced code or in a code span are left out; a link resolves from the folder of its file; the real live files pass.
- Red first: the merge rule failed on the tree before `.gitattributes` (4 of 5 files "unspecified"); the QUEUE and link fixtures failed before their functions existed.
- Commands, after the merge of the integration tip `ad5de9d`:
  - `npm test`: exit 0; tsc clean; vitest 62 files, 1117 tests passed; node tests 42 passed, 0 failed.
  - `npm run test:docs`: exit 0; 2 files, 17 tests passed (`public-tree.docs.test.ts`, `steering.docs.test.ts`).
  - `git check-attr merge -- TASKS.md LESSONS.md docs/QUEUE.md docs/MATRIX.md`:

    ```
    TASKS.md: merge: union
    LESSONS.md: merge: union
    docs/QUEUE.md: merge: union
    docs/MATRIX.md: merge: unspecified
    ```

- One-off union merge (a shell script in the session scratchpad; a temporary repository with an empty global config, this branch's `.gitattributes` and TASKS.md; branches `a` and `b` each add a line at the end; then a control with no `.gitattributes`):

  ```
  check-attr: TASKS.md: merge: union
  Auto-merging TASKS.md
  merge a into b: exit 0
  conflict markers: 0
  tail of TASKS.md after the merge:
  - line from branch b
  - line from branch a
  base lines 1084, merged lines 1086
  --- control: the same merge with no .gitattributes
  control merge: conflict (TASKS.md)
  ```
