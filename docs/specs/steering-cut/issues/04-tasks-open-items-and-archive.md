# 04: TASKS.md becomes an index of open items; old sections go to the archive

**What to build:** An agent reads a short TASKS.md: the section Open items, then a link to the tasks archive and the specs folder. Each line holds a bold title, a label, the next step or question, and a link. All 107 old sections move word for word into month files in the archive. Undated phase plans go to September; undated Workshop sections go to October. No open item drops: each one maps to an index line or to a recorded close. The steering lint keeps TASKS.md and its Open items small, so the compaction hook can give the whole section.

An open item is an unchecked box, a heading marked open, or an open owner question. September items get `needs-triage`, owner questions `needs-info`, all others `ready-for-agent`. The Workshop line links its spec and makes no claim about Set A. One line can carry some items of one section when they share a next step. The Jev player comment that names a moved section names its archive file.

**Blocked by:** 03 (shares the steering lint); secrets-and-public-gates/11 (the commit that removes the transcripts and fixes the links into them, TASKS.md included)

**Status:** ready-for-agent

- [x] Red first: before the move, the size rules fail and name TASKS.md (about 290,000 bytes) and its first section. The output goes in this ticket.
- [x] Rule: TASKS.md is under 40,000 bytes, and its Open items section is under 5,000 bytes.
- [x] Rule: TASKS.md holds the section Open items first; after it, only the links to the archive and the specs folder.
- [x] Rule: each Open items line has a bold title, one of the five labels and a link; no two lines have the same title.
- [x] Rule: no name from the model-name module occurs in TASKS.md.
- [x] Conservation (one-off script, output in this ticket): each old TASKS.md section is byte-identical to one section of one archive month file.
- [x] Open-item map (one-off, output in this ticket): each unchecked box, open heading and open owner question of the old TASKS.md maps to an index line or to a close with its reason.
- [x] The comment at the top of the Jev player tool names the archive file of the "Jev balancing review" section.
- [x] Before the merge, the builder compares main's TASKS.md with the old copy. If main changed it, the builder repeats the move and the two one-off checks.

**Owns:** `TASKS.md`, `docs/tasks-archive/2026-09.md`, `docs/tasks-archive/2026-10.md`, `tools/jev-play.ts` (the comment only), `tools/steering.docs.test.ts`. Shared file: secrets-and-public-gates/11 edits the link lines of `TASKS.md` first; this ticket blocks on it

**Verify:** `npm test`; `npm run test:docs`; the one-off conservation and open-item map scripts against `git show main:TASKS.md`.

## Comments

**2026-10-07, builder (branch `build/steering-cut-04`).** In the quotes below, `<model name>` stands for a word of the model-name module, so that this ticket holds no model name.

- `tools/steering.docs.test.ts`: a new function `tasksFaults(text, file)` and the group "TASKS.md index" with 6 tests (5 fixture tests, 1 test on the real file):
  - "names the size of the file and the first section of a TASKS.md that holds no index"
  - "names the size of an Open items section of 5,000 bytes or more"
  - "names each Open items line with no bold title, not one label or no link, and a repeated title"
  - "names a line, a section or a link after the Open items that is not a link to the archive or the specs folder"
  - "names each model name in TASKS.md"
  - "TASKS.md is small, holds Open items first, then the links, with no model name"
- The shape: a two-line preamble (`# Tasks` and one sentence that tells the line format and links the label file), then `## Open items`, then `## Archive and specs` with the two links. An Open items line is `- **<title>** · `<label>` · <next step or question> · [<month or spec>](<link>)`. The rule reads each non-blank line of the section as an item line, so the format sentence sits in the preamble. The compaction hook gives the preamble and the section together (its first section starts at the top of the file).
- Red first (commit `1be91e2`, the lint before the move; 1 failed, 25 passed). The two size and order faults, then 14 model-name faults:

  ```
  TASKS.md § (file) (size 290503 bytes): TASKS.md must be under 40000 bytes
  TASKS.md § Workshop property dashboard (line 3): the first `##` section must be Open items; found "Workshop property dashboard"
  TASKS.md § Kings' powers mode: all twelve powers, balanced head to head — 2026-10-02 (line 409): TASKS.md must not hold the model name "<model name>"
  TASKS.md § M1 supervised rules campaign — 2026-09-21 (line 789): TASKS.md must not hold the model name "<model name>"
  TASKS.md § M1 supervised rules campaign — 2026-09-21 (line 791): TASKS.md must not hold the model name "<model name>"
  TASKS.md § M1 supervised rules campaign — 2026-09-21 (line 791): TASKS.md must not hold the model name "<model name>"
  TASKS.md § Phase 0 — Research & sources (line 844): TASKS.md must not hold the model name "<model name>"
  TASKS.md § Phase 0 — Research & sources (line 845): TASKS.md must not hold the model name "<model name>"
  TASKS.md § Phase 1 — Framework (v0.1 playable) (line 858): TASKS.md must not hold the model name "<model name>"
  TASKS.md § Phase 1b — Feedback round 1 (2026-09-13) (line 865): TASKS.md must not hold the model name "<model name>"
  TASKS.md § Phase 1b — Feedback round 1 (2026-09-13) (line 870): TASKS.md must not hold the model name "<model name>"
  TASKS.md § Phase 1c — Saar picked B2 "Dungeon voxel" (2026-09-13); make it the game (line 879): TASKS.md must not hold the model name "<model name>"
  TASKS.md § Phase 1c — Saar picked B2 "Dungeon voxel" (2026-09-13); make it the game (line 880): TASKS.md must not hold the model name "<model name>"
  TASKS.md § Phase 1c — Saar picked B2 "Dungeon voxel" (2026-09-13); make it the game (line 881): TASKS.md must not hold the model name "<model name>"
  TASKS.md § v0.7.0 build + browser QA (2026-09-14, agent) — built, NOT published **→ published 2026-09-14; see the "Published v0.7.0" line below** (line 977): TASKS.md must not hold the model name "<model name>"
  TASKS.md § Takeover execution — 2026-09-16 (opencode/<model name>-flash; plan `docs/TAKEOVER-PLAN.md`) (line 981): TASKS.md must not hold the model name "<model name>"
  ```

- The move (one-off script `sc04/move.mjs` in the session scratchpad; it reads the TASKS.md of the integration tip, `git show claude/retro-2026-10-06:TASKS.md`): a section goes to the month of the first date in its heading; the three undated phase plans ("Phase 0", "Phase 1", "Phase 2 — Later") go to September; the three undated Workshop sections go to October. The section "Integration branch `claude/integration-2026-10-05`" takes its month from the branch name. Each month file has a heading and one sentence, then the sections as written, in the order of the old file. `2026-09.md`: 72 sections, 126,212 bytes; `2026-10.md`: 35 sections, 164,832 bytes. The two "Piece proportions — 2026-09-22" sections stay as two sections.
- New TASKS.md: 3,847 bytes; Open items: 3,434 bytes and 21 lines (12 October, 9 September). The section keeps about 1,500 bytes free for the handoff items of ticket 07.
- Conservation (one-off script `sc04/conserve.mjs`: it splits each file at its `## ` lines and compares bytes):

  ```
  old (integration tip): old sections: 107; archive sections: 107; byte-identical: 107; not found: 0
  old (main, dd34fa5):   old sections: 100; archive sections: 107; byte-identical: 97; not found: 3
    not found: Selective Cursor adoption — 2026-09-24
    not found: Claude local-record recovery — 2026-09-14
    not found: Takeover review and plan — 2026-09-14 (inspection only)
  ```

  The three sections of main differ only by the link fix of secrets-and-public-gates/11 (`dd34fa5:docs/…` in place of `docs/…`): with that prefix taken out of a copy of the archive, all 100 sections of main are byte-identical (100 of 100).
- Main's TASKS.md against the old copy: main has not changed TASKS.md since the merge base `f1b8e72` (`git diff f1b8e72 main -- TASKS.md` is empty; `git show main:TASKS.md` is byte-equal before and after the merge of the integration tip). So no repeat of the move was necessary. The 7 sections that only the integration branch has are the Workshop sections of `codex/workshop-card`.
- Open-item map (one-off scripts `sc04/candidates.mjs` and `sc04/map.mjs`). A candidate is an unchecked box; a heading marked "(open)", "not merged", "not scheduled" or "not published"; or a line that holds "Open", "Awaiting Saar", "waiting on Saar", "Owner: choose", "Owner: decide", "owner box", "until the owner", "after the owner picks", "owner review pending" or "questions, open". The script fails when a candidate has no entry, an entry names no index title, or an index line gets no item. Result: `candidates: 54 (boxes 25, headings 7, questions 22); to the index: 40; closed: 14; faults: 0`. Against main: `53 candidates; each has the same text as an old candidate: true` (main lacks the Workshop heading of line 42). Line numbers are those of the old file of the integration tip.

| Line | Kind | Section | Maps to |
|---:|---|---|---|
| 42 | heading | Workshop build 1a, branch `claude/workshop` — 20 | index: Workshop finish |
| 62 | question | Round 18, the Archer readings, the card tests —  | index: Archer reading |
| 66 | question | Round 18, the Archer readings, the card tests —  | index: Morph and the Guard |
| 68 | question | Round 18, the Archer readings, the card tests —  | closed: answered 2026-10-06 in the next box (line 69): MorphP goes into card mode; Morph and MorphB stay in the lab |
| 70 | box | Round 18, the Archer readings, the card tests —  | index: Card mode in the game |
| 139 | question | The six kings' own effects on the painted board  | closed: the owner approved the effects on 2026-10-05 (line 160) and they are live (line 75) |
| 159 | box | The six kings' own effects on the painted board  | index: Clay king effects |
| 241 | box | The softer Morph cards — 2026-10-06 | index: Card mode in the game |
| 242 | box | The softer Morph cards — 2026-10-06 | closed: parts 1 and 2 answered 2026-10-06; part 3 records a rule (allowed), with no question; the browser part is box 241 |
| 254 | box | The Spawn cards — 2026-10-06 | index: Card mode in the game |
| 255 | box | The Spawn cards — 2026-10-06 | closed: parts 1 to 3 decided 2026-10-06; parts 4 and 5 record facts, with no question; the browser part is box 254 |
| 261 | box | The Morph cards — 2026-10-06 | index: Card mode in the game |
| 263 | box | The Morph cards — 2026-10-06 | index: Morph and the Guard |
| 275 | heading | Card mode: all the 2014 cards — 2026-10-04 (open | index: Card deal |
| 286 | box | Card mode: all the 2014 cards — 2026-10-04 (open | index: Card deal |
| 288 | heading | Salvation card and guard reserve — 2026-10-04 (o | index: Guard drop |
| 297 | question | Salvation card and guard reserve — 2026-10-04 (o | index: Guard drop |
| 299 | heading | Archer: three middle shot sets — 2026-10-04 (ope | index: Archer reading |
| 304 | question | Archer: three middle shot sets — 2026-10-04 (ope | index: Archer reading |
| 313 | box | Piece-balance criteria — owner adopted, 2026-10- | index: Criterion 4 |
| 324 | box | The rulebook's piece icons, and a new Ogre icon  | index: Piece-letter icons |
| 339 | box | Six painted kings, the title's six kings, board  | index: King with no power |
| 363 | box | Accounts, phase 1: sign-in and cloud save — 2026 | index: Accounts database |
| 369 | heading | Card mode — owner direction, 2026-10-03 (open) | index: Card deal |
| 382 | question | Card mode — owner direction, 2026-10-03 (open) | index: Card deal |
| 397 | box | Stronger computer player for the kings' powers m | index: Powers-mode computer player |
| 411 | question | Kings' powers mode: all twelve powers, balanced  | closed: the three improvement branches reached main as PRs #2 (15b58db), #4 (eaa2aa7) and #3 (4162384) |
| 418 | question | Kings' powers mode: all twelve powers, balanced  | closed: decided 2026-10-03, as the box says (round 15) |
| 550 | question | Trailer build — engine, first pass, motion pass  | index: Trailer decisions |
| 552 | question | Trailer build — engine, first pass, motion pass  | index: Trailer decisions |
| 565 | question | Trailer v2 — cinematic intros and digital cards  | index: Trailer decisions |
| 576 | question | Review, market research and ten suggestions — 20 | index: Market suggestions |
| 579 | question | Sounds, captured pieces, move list — 2026-09-27 | closed: an instruction to the agent, not a question; the same section and "Simpler menus and UX" record the decisions |
| 606 | question | Maester goggle beam and lab-piece crash — 2026-0 | index: Maester beam |
| 623 | question | Painted 2D look in the real game — 2026-09-27 | closed: the owner made the painted look the default and the sheets were made smaller on 2026-09-27 ("Painted default, smaller art, King Down board") |
| 627 | question | Capture animations for every capturing piece — 2 | index: Maester beam |
| 643 | question | Bishop slash and Paladin hammer captures — 2026- | closed: "Painted King and Beast — 2026-09-26" delivers both figures |
| 908 | question | Phase 1e — Saar's decisions (2026-09-13, late) | closed: resolved in the line itself: paladin nonPawn shipped, maesterSwapAny not adopted |
| 909 | box | Phase 1e — Saar's decisions (2026-09-13, late) | index: Balance-lab leftovers |
| 911 | box | Phase 1e — Saar's decisions (2026-09-13, late) | index: Balance-lab leftovers |
| 915 | question | Checkpoint 2026-09-14 (pause; nothing new starte | closed: all four decisions resolved 2026-09-14 (line 935) |
| 933 | box | Checkpoint 2026-09-14 (pause; nothing new starte | index: leadMetrics parity |
| 935 | question | Checkpoint 2026-09-14 (pause; nothing new starte | closed: resolved in the line itself (2026-09-14) |
| 942 | heading | v0.7.0 build + browser QA (2026-09-14, agent) —  | closed: the heading records the publication on 2026-09-14 |
| 1001 | box | Takeover execution — 2026-09-16 (opencode/deepse | index: Takeover dataset |
| 1002 | box | Takeover execution — 2026-09-16 (opencode/deepse | index: Takeover dataset |
| 1003 | box | Takeover execution — 2026-09-16 (opencode/deepse | index: Takeover dataset |
| 1028 | heading | Phase 2 — Later (not scheduled) | index: Phase 2 |
| 1030 | box | Phase 2 — Later (not scheduled) | index: Phase 2 |
| 1032 | box | Phase 2 — Later (not scheduled) | index: Phase 2 |
| 1073 | question | Interaction improvement loop — 2026-09-17 | closed: the Ogre is in the piece pool with push as its reading (the Guide pool of the 2026-10-05 release; the Ogre push mode in qa, 2026-09-27); the open plan is box 1074 |
| 1074 | box | Interaction improvement loop — 2026-09-17 | index: Ogre and AI plan |
| 1075 | box | Interaction improvement loop — 2026-09-17 | index: Ogre and AI plan |
| 1083 | box | Jev tooling closed (2026-09-21, Claude, parallel | index: Jev design screen |

- Labels: September items get `needs-triage`, owner questions `needs-info`, others `ready-for-agent`. A September owner question gets `needs-triage` (the month rule comes first). "Accounts database" is an owner action (run the migration); its line asks the owner whether it ran, so it gets `needs-info`.
- One line carries items of more than one section where they share one next step: "Card deal" (sections "Card mode: all the 2014 cards" and "Card mode — owner direction"), "Card mode in the game" (the softer Morph, Spawn and Morph cards and Round 18), "Morph and the Guard", "Archer reading" (Round 18 and "Archer: three middle shot sets") and "Trailer decisions" (the two trailer sections). The ticket allows items of one section on a line; these merges keep the section under the budget.
- Not changed, for other tickets: a few files still name a moved section of TASKS.md by its title: `docs/KINGS-POWERS-PLAN.md` ("Phase 2 — Later"), `docs/STATUS.md` and `docs/STATUS-2026-09-13.md` ("Takeover execution — 2026-09-16"), `docs/MATRIX.md` (the Ogre plan). `docs/WORKSHOP.md` cites TASKS.md by line number (ticket 08). AGENTS.md, issue-tracker.md, domain.md and the handoffs still call TASKS.md the record of work (tickets 05 to 07).
- Union merge: TASKS.md merges with git's union driver. If main changes TASKS.md before the integration merge, a union merge appends main's lines after the index; the lint then fails, and the move and the two one-off checks must run again.
- Commands run in the worktree: `npm test` (64 files, 1,242 vitest tests and 42 node tests pass, after the merge of the integration tip `0285156`); `npm run test:docs` (2 files, 34 tests pass); `node sc04/conserve.mjs` against both old copies; `node sc04/map.mjs` against the integration and main copies.
