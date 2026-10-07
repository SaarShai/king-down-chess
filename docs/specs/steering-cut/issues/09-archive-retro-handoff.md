# 09: The retro handoff goes to the archive after the integration merge

**What to build:** After the integration branch merges into main, no live handoff remains. The retro handoff moves to the tasks archive, and its first line becomes "Archived; the rules are in AGENTS.md". Its open items map to the TASKS.md index or to a close. The change is a docs and tracker change on main.

**Blocked by:** 08; the owner's merge of the integration branch into main

**Status:** ready-for-human

- [x] The retro handoff is in the tasks archive, and its old path holds no file.
- [x] The archived-handoff rule of ticket 07 passes on it: the first line, no model name, no `Co-Authored-By:` line.
- [x] The broken-link rule of ticket 01 passes: no live file links to the old path.
- [x] Open-item map (one-off, output in this ticket): each open item of the retro handoff maps to a TASKS.md index line or to a close with its reason.

**Owns:** `docs/HANDOFF-retro.md` (moved), `docs/tasks-archive/HANDOFF-retro.md`, `TASKS.md` (the Open items lines)

**Verify:** `npm test`; `npm run test:docs`; `git ls-files docs/HANDOFF-retro.md` gives nothing.

## Comments

**Order.** The spec and this ticket put the move after the owner's merge of `claude/retro-2026-10-06` into main. That merge has not occurred (`git merge-base --is-ancestor claude/retro-2026-10-06 main` is false). The builder made the change on `build/steering-cut-09` from the integration tip. If the merger merges this branch into the integration branch, the owner's merge brings the move to main in the same step, and the end state on main is the same. Until then, an agent that opens `docs/HANDOFF-retro.md` finds no file. The owner chooses: merge this branch now, or keep it until after the integration merge. Hence `ready-for-human`.

**Change.**

- `tools/steering.docs.test.ts`: the retro handoff joins the list of old handoffs (`ARCHIVED_HANDOFFS`). So the rules of ticket 07 check it: its old path holds no file, the archived file exists, its first line is the archive line, it holds no model name and no `Co-Authored-By:` line. The live-files test no longer asks for the old path. The retro check reads the archived path only.
- `docs/HANDOFF-retro.md` moves to `docs/tasks-archive/HANDOFF-retro.md` (one commit, no change), then gets the first line "Archived; the rules are in AGENTS.md". Its one relative link (to the archived Workshop handoff) now starts from the archive folder. All other text stays word for word.
- `TASKS.md`: no change. Each open item of the handoff closes (map below).

**Red.** `npm run test:docs` before the move: 3 failed, 71 passed (4 files). The failures:

    "docs/HANDOFF-retro.md: the old path must hold no file"
    "docs/tasks-archive/HANDOFF-retro.md: the archived handoff must exist"
    the archived handoff list lacks "docs/tasks-archive/HANDOFF-retro.md"
    the retro check: no file at docs/tasks-archive/HANDOFF-retro.md

**Links.** No live file (the steering files outside the archive) names `docs/HANDOFF-retro.md`. The broken-link rule of ticket 01 passes, so no live file links to the old path. Files in the specs folder name the old path in prose as a record; none is a markdown link.

**Open-item map.** The handoff has no check boxes. Its items are the seven owner steps and the three retro subjects. Its "Rules for the specs and the implementation" are rules, not items: AGENTS.md holds them (rule map of ticket 06).

| Handoff item | Index line or close |
|---|---|
| Step 1: install the skills | close: done 2026-10-06 (the handoff says so) |
| Step 2: paste the agent prompt; the Preparation section | close: done; the retro ran from it |
| Step 3: set up the skills' settings | close: done 2026-10-06; `docs/agents/*.md` |
| Step 4: `/retro` | close: done; `docs/specs/retro-2026-10-06/retro.md` |
| Step 5: `/grill-me` | close: done; the decisions are in retro ticket 01 (resolved) |
| Step 6: specs, read by the owner before step 7 | close: done; five specs, the owner's approval in retro ticket 10 (resolved) |
| Step 7: `/implement-spec` on one integration branch; the owner chooses when to merge | close: the tickets are built on `claude/retro-2026-10-06`; the owner's merge into main closes the step. Each ticket that waits for the owner holds its question in the specs folder. |
| Retro subject 1: the Workshop rework (result and process) | close: retro items 1 to 3 and 25 to 27; the Workshop finish spec; index line **Workshop finish** |
| Retro subject 2: the recent sessions | close: retro items 5 to 13, 18 and 21 to 23 |
| Retro subject 3: the environment | close: retro items 4, 14 to 17, 19, 20, 24 and 28 to 30 |

**Checks.** `npm run test:docs`: 4 files, 74 tests passed. `npm test` after the merge of the integration tip (5b84617, no new commits since the branch start): tsc clean; vitest 66 files, 1,284 tests passed; `node --test` 42 passed, 0 failed. One run before it failed only `src/workshop/judge.test.ts` (a random-design test, the 5 s limit, 5.5 s); this ticket changes no code that it runs, and the next run passed. `git ls-files docs/HANDOFF-retro.md` gives nothing.

