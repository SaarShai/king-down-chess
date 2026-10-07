# 02: Each lesson under one dated heading

**What to build:** An agent who opens LESSONS.md finds each lesson under its own dated heading, one time only. The 42 bullets at the top get dated headings. The seven bullets with no date get the date of their git blame. The second copies of "Clay facing and fixed presentation" and "Playable clay picking and layout" (2026-09-22) go. The 2026-09-13 rate-limit heading loses its model name. All other text stays word for word. The steering lint stops a repeated heading and a heading with a model name.

**Blocked by:** 01; checks-and-hooks/03 (the model-name module that the commit-msg hook uses); secrets-and-public-gates/11 (its link edits in `LESSONS.md` land first)

**Status:** ready-for-agent

- [x] Red first: before the edit, the new rules fail and name the duplicated pair, the bullets with no heading and the rate-limit heading. The output goes in this ticket.
- [x] Rule: no `##` heading occurs two times in LESSONS.md.
- [x] Rule: no lesson bullet sits above the first `##` heading.
- [x] Rule: each `##` heading holds a date in the form YYYY-MM-DD.
- [x] Rule: no LESSONS.md heading holds a name from the checks spec's model-name module.
- [x] Conservation (one-off script, output in this ticket): each old LESSONS.md line occurs one time in the new file, except the two removed copies and the changed heading.
- [x] The seven dates from git blame are listed in this ticket with their commits.

**Owns:** `LESSONS.md`, `tools/steering.docs.test.ts`. Shared file: secrets-and-public-gates/11 edits the link lines of `LESSONS.md` first; this ticket blocks on it

**Verify:** `npm test`; `npm run test:docs`; the one-off conservation script against `git show main:LESSONS.md`.

## Comments

**2026-10-07, builder (branch `build/steering-cut-02`).** In the quotes below, `<model name>` stands for the word that the rate-limit heading held, so that this ticket holds no model name.

- `tools/steering.docs.test.ts`: a new function `lessonFaults(text, file)` and 6 tests in the group "lesson headings" (5 fixture tests, 1 test on the real LESSONS.md). The function takes any lessons text, so ticket 03 can apply it to the topic files. The model-name rule imports `findModelNames` from `tools/lib/model-names.mjs` (checks-and-hooks/03).
  - "names each heading that occurs two times, with its lines"
  - "names the lesson bullets above the first `##` heading, with their lines"
  - "names each `##` heading with no date in the form YYYY-MM-DD" (also `2026-9-14` and `14.09.2026` fail)
  - "names each heading that holds a model name, and not a model name in the lesson text" (the rule reads headings of each level, not lesson text: ticket 03 owns the rule for the whole file)
  - "LESSONS.md holds each lesson under one dated heading with no model name"
- Note for ticket 03: the date rule reads each `##` heading. The sections Always and Index of ticket 03 hold no date, so ticket 03 applies `lessonFaults` to the topic files and gives LESSONS.md its own section rule.
- Red first (the real-file test on the integration tip `226bf2c`, before the LESSONS.md edit; 1 failed, 13 passed):

  ```
  LESSONS.md § Playable clay picking and layout — 2026-09-22 (count 2, lines 300, 404): a `##` heading must not occur two times
  LESSONS.md § Clay facing and fixed presentation — 2026-09-22 (count 2, lines 304, 408): a `##` heading must not occur two times
  LESSONS.md § Lessons (count 42, lines 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 25, 27, 29, 31, 32, 33, 35, 36, 37, 38, 39, 40, 42, 44, 46, 48, 50, 51, 52, 53, 54, 55, 56): a lesson bullet must not sit above the first `##` heading
  LESSONS.md § 2026-09-13 — session rate limit killed 8 parallel <model name> agents (line 62): a heading must not hold the model name "<model name>"
  ```

- LESSONS.md edit: each of the 42 bullets gets its own heading `## <date> — <short title>`, in the old order, and a blank line after it. The date is the last date in parentheses in the bullet (bullet 8 names 2026-09-25 in its text and ends with 2026-10-02: the heading takes 2026-10-02). The two lines 404 to 411 go (they were byte-identical to lines 300 to 307). The heading at line 62 is now `## 2026-09-13 — session rate limit killed 8 parallel agents`. The lesson text keeps its model names; ticket 03's rule removes them from LESSONS.md.
- The seven dates from git blame (`git blame --date=short -L 50,56 LESSONS.md`; `-M -C -C` gives the same):

  | old line | bullet starts with | date | commit |
  |---|---|---|---|
  | 50 | Google Drive MCP `read_file_content` | 2026-09-16 | `d602167` |
  | 51 | macOS `base64` has no positional file arg | 2026-09-16 | `d602167` |
  | 52 | `gdown --folder` in the current release | 2026-09-16 | `d602167` |
  | 53 | Image-only PDFs come back as garbage text | 2026-09-16 | `d602167` |
  | 54 | Voxelized sculpts at 14–20 voxels | 2026-09-16 | `d602167` |
  | 55 | Artifact `files` list form | 2026-09-16 | `d602167` |
  | 56 | In `browser_batch`, `navigate` without `tabId` | 2026-09-16 | `d602167` |

  `d602167` ("Baseline: freeze the King Down v0.7 working tree for takeover") is the root commit of the history. The seven lessons can be older than 2026-09-16; git holds no earlier date.
- Conservation (one-off script `sc02-conservation.py` in the session scratchpad: it counts each non-blank line of the old file in the new file).
  - Against the integration tip (`git show claude/retro-2026-10-06:LESSONS.md`, the base of this ticket; unchanged since `226bf2c`):

    ```
    old non-blank lines 374, distinct 368; new non-blank lines 410, distinct 410
    old line x1 occurs 0 times in new: ## 2026-09-13 — session rate limit killed 8 parallel <model name> agents
    old lines not one time in new: 1
    new lines not in old: 43 (43 are ## headings)
    ```

    The six old lines that occurred two times are the removed copies; each occurs one time now. The 43 new lines are the 42 new headings and the changed heading.
  - Against `git show main:LESSONS.md` (the Verify line): 4 old lines do not occur. The changed heading, and 3 lines that the integration branch changed before this ticket: the "Prefer a semantic regression" bullet (a link edit of secrets-and-public-gates/11, commit `ec988f3`), the "Board feedback" bullet (Workshop commits `061c727` and `c014343`) and the "Owner wants army colour dominant" bullet (Workshop commit `80b9b65`, which also adds 3 bullets under "2D artwork direction"). This ticket changes none of these lines.
- Commands, after the merge of the integration tip `1f8375c`:
  - `npm test`: exit 0; tsc clean; vitest 62 files, 1130 tests passed; node tests 42 passed, 0 failed.
  - `npm run test:docs`: 2 files, 22 tests passed.

