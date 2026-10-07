# 02: Each lesson under one dated heading

**What to build:** An agent who opens LESSONS.md finds each lesson under its own dated heading, one time only. The 42 bullets at the top get dated headings. The seven bullets with no date get the date of their git blame. The second copies of "Clay facing and fixed presentation" and "Playable clay picking and layout" (2026-09-22) go. The 2026-09-13 rate-limit heading loses its model name. All other text stays word for word. The steering lint stops a repeated heading and a heading with a model name.

**Blocked by:** 01; checks-and-hooks/03 (the model-name module that the commit-msg hook uses); secrets-and-public-gates/11 (its link edits in `LESSONS.md` land first)

**Status:** ready-for-agent

- [ ] Red first: before the edit, the new rules fail and name the duplicated pair, the bullets with no heading and the rate-limit heading. The output goes in this ticket.
- [ ] Rule: no `##` heading occurs two times in LESSONS.md.
- [ ] Rule: no lesson bullet sits above the first `##` heading.
- [ ] Rule: each `##` heading holds a date in the form YYYY-MM-DD.
- [ ] Rule: no LESSONS.md heading holds a name from the checks spec's model-name module.
- [ ] Conservation (one-off script, output in this ticket): each old LESSONS.md line occurs one time in the new file, except the two removed copies and the changed heading.
- [ ] The seven dates from git blame are listed in this ticket with their commits.

**Owns:** `LESSONS.md`, `tools/steering.docs.test.ts`. Shared file: secrets-and-public-gates/11 edits the link lines of `LESSONS.md` first; this ticket blocks on it

**Verify:** `npm test`; `npm run test:docs`; the one-off conservation script against `git show main:LESSONS.md`.
