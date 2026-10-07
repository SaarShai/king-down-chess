# 03: LESSONS.md becomes Always and an index; six topic files hold the lessons

**What to build:** An agent reads a short LESSONS.md: the section Always, then the section Index. Always holds the rule on printed process environments and secrets, without its Jev bullets. Index gives each lesson's heading, date and topic file, with a link. Six topic files hold the lesson text word for word: engine and tests; runs; Jev; art and motion; browser checks and UI; agents and tools. The steering lint keeps LESSONS.md small and keeps the index equal to the topic-file headings.

**Blocked by:** 02

**Status:** resolved

- [x] Red first: before the move, the size rule fails on LESSONS.md (about 64,000 bytes) and names the size. The output goes in this ticket.
- [x] Rule: LESSONS.md is under 30,000 bytes.
- [x] Rule: LESSONS.md holds the section Always, then the section Index, in this order, and no other `##` section.
- [x] Rule: the Index entries equal the `##` headings of the six topic files, with no repeat, and each entry links to the file that holds it.
- [x] Rule: no name from the model-name module occurs in LESSONS.md.
- [x] The Jev bullets of the process-environment section move to the Jev topic file. Always keeps "never print a process environment" and the rotation rule.
- [x] Conservation (one-off script, output in this ticket): each line of LESSONS.md after ticket 02 occurs one time in the new LESSONS.md or a topic file.
- [x] The union driver of ticket 01 applies to each topic file (`git check-attr merge`).

**Owns:** `LESSONS.md`, `docs/lessons/**` (six files: `engine-and-tests.md`, `runs.md`, `jev.md`, `art-and-motion.md`, `browser-checks-and-ui.md`, `agents-and-tools.md`), `tools/steering.docs.test.ts`

**Verify:** `npm test`; `npm run test:docs`; `git check-attr merge -- docs/lessons/*.md`; the one-off conservation script.

## Comments

**2026-10-07, builder (branch `build/steering-cut-03`).** In the quotes below, `<model name>` stands for a word of the model-name module, so that this ticket holds no model name.

- `tools/steering.docs.test.ts`: a new function `lessonsIndexFaults(text, topics, file)`, a constant `TOPIC_FILES` (the six files) and the group "LESSONS.md index" with 6 tests (4 fixture tests, 2 tests on the real files). `TRACKERS` now names the six real topic files in place of the probe path of ticket 01. The test of ticket 02 on the real LESSONS.md now applies `lessonFaults` to each topic file (dated headings, no repeat, no model name in a heading).
  - "names the size of a LESSONS.md of 30,000 bytes or more"
  - "names the sections when Always and Index are out of order or another `##` section exists"
  - "names each model name in LESSONS.md, in the text and in a heading"
  - "names a repeated entry, a wrong link, an entry with no heading, a missing heading and a heading in two files"
  - "the lessons folder holds the six topic files"
  - "LESSONS.md is small, holds Always then Index, no model name, and indexes each topic-file heading"
- An Index entry is a list item that is one link, `- [<heading>](docs/lessons/<file>.md)`, in the section Index. The link text is the `##` heading of the topic file word for word, so it holds the date (the rule of ticket 02 makes each topic-file heading hold one). `###` groups, one per topic, keep the entries in topic order; inside a topic the order is the old file order.
- Red first (commit `350b0e4`, the lint before the move; 2 failed, 18 passed):

  ```
  LESSONS.md § (file) (size 65764 bytes): LESSONS.md must be under 30000 bytes
  LESSONS.md § (top) (count 0 of 2): the first `##` sections must be Always, then Index; found "2026-10-04 — check a vector from a PDF against the PDF's own render", "2026-10-04 — measure an effect anchor through the figure's transform"
  LESSONS.md § 2026-10-04 — check a vector from a PDF against the PDF's own render (count 83, first line 5): LESSONS.md must hold no `##` section but Always and Index
  LESSONS.md § 2026-09-13 — session rate limit killed 8 parallel agents (line 137): LESSONS.md must not hold the model name "<model name>"
  LESSONS.md § M1 local-agent supervision (2026-09-21) (line 464): LESSONS.md must not hold the model name "<model name>"
  LESSONS.md § M1 local-agent supervision (2026-09-21) (line 466): LESSONS.md must not hold the model name "<model name>"
  ```

  and "the lessons folder holds the six topic files" failed with an empty folder.
- The move (one-off script `sc03-move.py` in the session scratchpad; it reads the LESSONS.md of the integration tip and gives each of the 83 sections one topic code): LESSONS.md is 8,719 bytes. Topic files: engine and tests 9 lessons, runs 11, Jev 5 (+1, see below), art and motion 31, browser checks and UI 13, agents and tools 14. A section that touches two topics goes to the topic of its main rule (for example, "balance-lab traps" goes to runs and "Selective adoption" to engine and tests).
- Process-environment section: Always holds its Mistake and Rule bullets ("never `ps aux`/`pgrep -fl`", "rotate any secret that was printed") under `### 2026-09-16 — never print a process environment`; the heading changes from `##` to `###`, because LESSONS.md holds no `##` section but Always and Index. Its Jev bullet ("Keep the *decision* out of the state") moves word for word to `jev.md` under a new heading `## 2026-09-16 — keep the decision out of the state`, at the old place in the order.
- Conservation (one-off script `sc03-conservation.py` in the session scratchpad: it counts each non-blank line of the old file in the new LESSONS.md and the six topic files; the old file is `git show claude/retro-2026-10-06:LESSONS.md`, byte-equal to the base of this ticket):

  ```
  old non-blank lines 410, distinct 410; new non-blank lines 515 in 7 files
  old lines whose count differs in the new files: 1
    old x1, new x0: ## 2026-09-16 — never print a process environment
  new lines not in old: 106 ({'other': 7, 'heading': 16, 'index entry': 83})
  ```

  The one changed line is the heading that is now `###` in Always. The 106 new lines are 83 Index entries, the headings Always and Index, six `###` topic groups, the `###` Always heading, the new Jev heading, six topic-file titles, six topic-file intro lines and one intro line in LESSONS.md.
- `git check-attr merge -- docs/lessons/*.md`: `union` for each of the six files (and for LESSONS.md).
- Left for other tickets: AGENTS.md line 3 and `docs/agents/domain.md` still say "read LESSONS.md" whole (ticket 06); `docs/WORKSHOP.md` cites `LESSONS.md:27`, a line that the move changes (ticket 08).
- Commands:
  - Before the merge of the integration tip (the move commit `cbbf0b5`): `npm test` exit 0; tsc clean; vitest 62 files, 1216 tests passed; node tests 42 passed, 0 failed. `npm run test:docs`: 2 files, 28 tests passed.
  - After the merge of the integration tip `e76a305` (merge commit `e36da49`; the merge touches no file of this ticket): `npm run test:docs` 2 files, 28 tests passed. `npm test` ran four times with load averages of 29 to 45 (other jobs on this Mac). Each run failed 1 to 3 tests, each with "Test timed out in 5000ms", and each run named other tests: `src/workshop/judge.test.ts` (random designs), `tools/gate.test.ts` (push mode, 2 tests), `tools/git-hooks/pre-push.test.ts` (story 4). This ticket changes none of these files or the code they test. `npx vitest run src/workshop/judge.test.ts tools/gate.test.ts` alone: 2 files, 44 tests passed. The merger must rerun `npm test` when the load is low.

- Merger (merge commit `56f2908`, integration tip before the merge `2d7847c`; no conflicts; `package-lock.json` did not change): `npm run test:docs` 2 files, 28 tests passed. `npm test` ran two times with load averages of 27 to 59. Typecheck clean both times. Run 1: 1219 of 1222 passed; 3 tests in `tools/gate.test.ts` failed with "Test timed out in 5000ms". Run 2: 1221 of 1222 passed; 1 test in `src/sim/piece-activity.test.ts` failed with "Test timed out in 5000ms". The merge changes neither file. Alone, `tools/gate.test.ts` 31 passed and `src/sim/piece-activity.test.ts` 10 passed. Node tests 42 passed, 0 failed. Status: resolved.
