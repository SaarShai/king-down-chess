# 01: Steering lint frame and union merges for the trackers

**What to build:** A merge of two branches that both add lines to a tracker file keeps both sides and gives no conflict. The ability matrix does not use this merge, because a union merge copies table rows two times. A new steering lint in `npm test` reads the steering files as an agent reads them. When a rule fails, the message names the file, the section and the number. This ticket adds the lint frame and the first rules, which pass today: the union driver applies to the tracker files and not to the matrix; the matrix holds each Workshop row and the Workshop heading one time; no run id occurs two times in a live run table; no live steering file holds a broken relative link.

**Blocked by:** checks-and-hooks/01 (the doc-lint suffix, the `test:docs` script, and vitest that collects tests from the tools folder); secrets-and-public-gates/11 (the transcript removal and its link fix, so the broken-link rule passes on the real files)

**Status:** ready-for-agent

- [ ] The attributes file gives git's union merge driver to TASKS.md, LESSONS.md, the topic files in the lessons folder and QUEUE.md. It gives no merge driver to MATRIX.md.
- [ ] The steering lint is one vitest module with the doc-lint suffix. `npm test` and `npm run test:docs` both run it.
- [ ] The lint defines the live files: the steering files that exist outside the tasks archive (AGENTS.md, COMPUTE.md, HOSTING.md, TASKS.md, LESSONS.md, the topic files, the handoffs, QUEUE.md, issue-tracker.md, domain.md).
- [ ] Rule: `git check-attr merge` gives `union` for each tracker file and `unspecified` for MATRIX.md.
- [ ] Rule: MATRIX.md holds the D.1 row "Material behind (own side)", the D.2 row "Any piece" and the Workshop heading, one time each. It passes today, as a guard.
- [ ] Rule: in each table under a QUEUE.md heading that starts with "Running", no run id occurs two times. A cell with ids split by commas counts each id.
- [ ] Rule: no live file holds a relative link to a file that does not exist. A fixture with one broken link makes the rule fail and name the file and the link; the real files pass.
- [ ] Each failure message names the file, the section and the number (size, count or line).
- [ ] A one-off script in a temporary repository merges two branches that each add a line at the end of TASKS.md. The merge gives no conflict and keeps both lines. The output goes in this ticket.

**Owns:** `.gitattributes`, `tools/steering.docs.test.ts`

**Verify:** `npm test`; `npm run test:docs`; `git check-attr merge -- TASKS.md LESSONS.md docs/QUEUE.md docs/MATRIX.md`; the one-off union-merge script in a temporary repository.
