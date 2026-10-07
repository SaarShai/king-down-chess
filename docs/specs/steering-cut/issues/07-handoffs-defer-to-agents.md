# 07: Handoffs hold no rules; the two old handoffs go to the archive

**What to build:** No handoff tells an agent a rule that AGENTS.md does not hold, and no steering file holds tool-call markup or a model name for an agent to copy. The two old handoffs (the 2026-10-03 handoff with its release notes, and the 2026-10-06 Workshop handoff) move to the tasks archive. Their run recipes move to COMPUTE.md and their open items to the TASKS.md index. They lose the stray markup lines, the trailer lines and the helper-model lines, and their first line becomes "Archived; the rules are in AGENTS.md". The retro handoff stays live until the integration merge: it loses its stray lines and model names, and "Follow AGENTS.md" replaces its commit, secrets and language bullets.

**Blocked by:** 06

**Status:** resolved

- [x] Red first: before the edit, the new rules fail and name the stray `</content>` and `</invoke>` lines, the trailer lines and the model names in each handoff. The output goes in this ticket.
- [x] Rule: no live file holds tool-call markup (a line that is only a closing or opening tool tag).
- [x] Rule: no name from the model-name module occurs in a handoff, live or archived.
- [x] Rule: the first line of each archived handoff is "Archived; the rules are in AGENTS.md".
- [x] Rule: no handoff holds a `Co-Authored-By:` line.
- [x] The retro handoff holds "Follow AGENTS.md" in place of its commit, secrets and language bullets, and names the archived Workshop handoff by its new path.
- [x] COMPUTE.md holds the run recipes of the 2026-10-03 handoff. The 2-hour shell claim does not move with them.
- [x] Search (one-off, output in this ticket): no live file holds the 2-hour shell claim.
- [x] Open-item map (one-off, output in this ticket): each open item of the two old handoffs maps to a TASKS.md index line or to a close with its reason. The Open items section stays under 5,000 bytes.

**Owns:** `HANDOFF.md` (moved), `docs/HANDOFF-2026-10-06.md` (moved), `docs/HANDOFF-retro.md`, `docs/tasks-archive/HANDOFF*.md`, `docs/COMPUTE.md` (the recipes section), `TASKS.md` (the Open items lines), `tools/steering.docs.test.ts`

**Verify:** `npm test`; `npm run test:docs`; `git grep -n -E "2 hours|2-hour" -- AGENTS.md TASKS.md LESSONS.md docs/HANDOFF-*.md docs/COMPUTE.md docs/HOSTING.md docs/lessons docs/agents docs/QUEUE.md`.

## Comments

**Builder, 2026-10-07.** Branch `build/steering-cut-07`. The spec and the code agree; no conflict to record.

**What changed.**
- `HANDOFF.md` → `docs/tasks-archive/HANDOFF-2026-10-03.md` and `docs/HANDOFF-2026-10-06.md` → `docs/tasks-archive/HANDOFF-2026-10-06.md`: first a pure rename (commit d0633ed), then the edits. Each opens with "Archived; the rules are in AGENTS.md". The 2026-10-03 handoff loses "ignore" the other tool and its model, and the trailer and `Claude-Session:` lines; its "How to run things" section is now one pointer to the Recipes section of COMPUTE.md. The Workshop handoff loses the model name of the last review, the trailer line, the helper-model line and the two stray tool lines. The other text stays as the record; the index lines link to it.
- `docs/HANDOFF-retro.md`: the stray lines and the five model names go. "Commits, secrets and language: Follow AGENTS.md." replaces the three bullets. Line 3 links the Workshop handoff by its new path. The line "a PR is opened only when the owner asks" (a rule that AGENTS.md does not hold) now says "follow AGENTS.md (Commits and branches)".
- `docs/COMPUTE.md`: a new section "Recipes" with the tournament, card-round, report, Kaggle, M1, engine, raw-games and stop-a-process recipes. Not moved: the 2-hour claim; the `npx tsc`/`npx vitest` and hand-started browser-check recipes (AGENTS.md says `npm test` and `npm run check:browser`). Changed: the raw-game branches that the handoff named are not on origin today (`git ls-remote --heads origin 'claude/kp2-results*'` gives only `claude/kp2-results`), and that branch holds rounds 2–18, `fi-r11..13` and the card rounds, so the recipe names it.
- `TASKS.md`: three new index lines (Death Touch at 55.1%, Turn countdown, Browser checks in the cloud) and March added to the Card deal line.
- `tools/steering.docs.test.ts`: `markupFaults` (a line that is only an opening or closing tool tag, fenced code included, on every live file), `handoffFaults` (model names, `Co-Authored-By:` lines and the archive first line, on live and archived handoffs), the archived paths, the retro phrases, and eight recipe phrases in the COMPUTE.md entry of `FACT_FILES`. The fixtures build the tags from parts, so the test file holds no markup line. The retro check reads the handoff at its live path or, after ticket 09, at its archive path.

**Red first.** The new rules before the edit (`npm run test:docs`): 5 failed, 48 passed (53). The handoff faults (each model name shown as `<model name>`):

    "docs/HANDOFF-2026-10-06.md § Standing rules (also in AGENTS.md and memory) (line 59): the line is tool-call markup: "</content>""
    "docs/HANDOFF-2026-10-06.md § Standing rules (also in AGENTS.md and memory) (line 60): the line is tool-call markup: "</invoke>""
    "docs/HANDOFF-retro.md § Rules for the specs and the implementation (line 75): the line is tool-call markup: "</content>""
    "docs/HANDOFF-retro.md § Rules for the specs and the implementation (line 76): the line is tool-call markup: "</invoke>""
    "HANDOFF.md: the old path must hold no file"
    "docs/tasks-archive/HANDOFF-2026-10-03.md: the archived handoff must exist"
    "docs/HANDOFF-2026-10-06.md: the old path must hold no file"
    "docs/tasks-archive/HANDOFF-2026-10-06.md: the archived handoff must exist"
    "HANDOFF.md § Owner decisions and standing rules (also in TASKS.md) (line 94): a handoff must not hold the model name "<model name>""
    "HANDOFF.md § Owner decisions and standing rules (also in TASKS.md) (line 96): a handoff must not hold the model name "<model name>""
    "HANDOFF.md § Owner decisions and standing rules (also in TASKS.md) (line 96): a handoff must not hold a `Co-Authored-By:` line"
    "docs/HANDOFF-2026-10-06.md § Your first task: rework the Workshop (line 30): a handoff must not hold the model name "<model name>""
    "docs/HANDOFF-2026-10-06.md § Standing rules (also in AGENTS.md and memory) (line 54): a handoff must not hold the model name "<model name>""
    "docs/HANDOFF-2026-10-06.md § Standing rules (also in AGENTS.md and memory) (line 58): a handoff must not hold the model name "<model name>""
    "docs/HANDOFF-2026-10-06.md § Standing rules (also in AGENTS.md and memory) (line 54): a handoff must not hold a `Co-Authored-By:` line"
    "docs/HANDOFF-retro.md § Handoff: a retro of the recent sessions, then specs and their implementation (line 3): a handoff must not hold the model name "<model name>""
    "docs/HANDOFF-retro.md § Preparation (before the owner runs the skills) (line 39): a handoff must not hold the model name "<model name>""
    "docs/HANDOFF-retro.md § Preparation (before the owner runs the skills) (line 40): a handoff must not hold the model name "<model name>""
    "docs/HANDOFF-retro.md § What `/retro` must cover (line 45): a handoff must not hold the model name "<model name>""
    "docs/HANDOFF-retro.md § Rules for the specs and the implementation (line 72): a handoff must not hold the model name "<model name>""
    "docs/HANDOFF-retro.md § Rules for the specs and the implementation (line 72): a handoff must not hold a `Co-Authored-By:` line"
    "docs/HANDOFF-retro.md: the file must hold "Follow AGENTS.md""
    "docs/HANDOFF-retro.md: the file must hold "docs/tasks-archive/HANDOFF-2026-10-06.md""

The COMPUTE.md entry failed on the eight recipe phrases ("## Recipes", "npx tsx src/sim/tournament.ts run --id", "--mirrorOnly", "report --id <id>", "push --id <id> --shards <n>", "the linear evaluation", "claude/kp2-results", "zsh does not split"). The fixture tests passed from the start.

**Search (2-hour claim).** Before: `git grep -n -E "2 hours|2-hour" -- AGENTS.md TASKS.md LESSONS.md 'docs/HANDOFF-*.md' docs/COMPUTE.md docs/HOSTING.md docs/lessons docs/agents docs/QUEUE.md HANDOFF.md` gave `HANDOFF.md:116`. After: the ticket's command gives no line (exit 1); the same search on `docs/tasks-archive/HANDOFF*` also gives no line, because the recipes left the archived handoff.

**Open-item map.** Open items section: 4,080 bytes (limit 5,000); TASKS.md 4,493 bytes.

| Handoff item | Index line or close |
|---|---|
| 10-03, next 1: kings' powers fixes need the owner's choice (rounds 11–13 options) | close: decided 2026-10-03 (Mercy M2; Haste and Death Touch unchanged; Darkness king step after rounds 16–17), archive 2026-10, kings' powers section; the round-18 rest → **Death Touch at 55.1%** |
| 10-03, next 2: card hand size and movement-changing cards | close: six cards (owner 2026-10-03); Mimic, Vault, Curse, Sky Lift built; the deal → **Card deal** |
| 10-03, next 2: the playable game needs a hand display | **Card mode in the game** |
| 10-03, next 3: raw games of round 13, `fi-r11..13`, the card rounds | close: done; they are on `claude/kp2-results` (COMPUTE.md, Recipes) |
| 10-03, release: next Archer step, a wider over-a-piece Archer on the M1 | close: done as `over23` (owner: too cumbersome); the choice → **Archer reading** |
| 10-03, card mode: eleven proposed movement-changing cards, none built | close: four built; which cards join the deal → **Card deal** |
| 10-03, Kaggle smoke notebook `kd-smoke-s0of1` in the owner's account | close: harmless; the handoff says delete only if the owner asks |
| 10-03, other: computer player, move ordering and a bigger corpus | **Powers-mode computer player** |
| 10-03, other: four browser checks time out in cloud containers | **Browser checks in the cloud** (new) |
| 10-06, first task: rework the Workshop (steps 1–4) | **Workshop finish**; the retro reviewed the rework |
| 10-06: `claude/morph-soft` holds the Spawn and Morph cards | close: merged (8fbea2a is in main) |
| 10-06: MorphP goes into card mode, add it to the deal | **Card mode in the game** |
| 10-06: keep MorphS and Sky Lift; MorphP resets the clock; Spawn2 | close: decided by the owner, recorded |
| 10-06: Rage as a legendary card, rarity property | **Card mode in the game** |
| 10-06: `claude/rage-trim` conflicts with power-schema | close: the owner kept Rage as built, so the trim stays unmerged in the lab (archive 2026-10, Round 18 section) |
| 10-06: `claude/turn-countdown` waits for the owner's yes on its screenshots | **Turn countdown** (new; 83f442f is not in main) |
| 10-06, open owner decisions: Archer far2 | **Archer reading** |
| 10-06: Mirror or MirrorB; Rescue and March | **Card deal** (March added: below the floor in `cards-d1`) |
| 10-06: Death Touch at 55.1% | **Death Touch at 55.1%** (new) |
| 10-06: the second-Beast gap | **Morph and the Guard** |
| 10-06: merge main into `claude/workshop`; the site was not deployed after the merge | close: the Workshop finish spec builds on the integration branch; a deploy waits for the owner (AGENTS.md, Hosting) |

**Checks.** `npm run test:docs`: 2 files, 53 tests passed. `npm test` after the merge of `claude/retro-2026-10-06` (d63c763): 64 files, 1,263 tests passed; `node --test` 42 passed, 0 failed. The last run after the ticket commit passed the same counts. Two runs before it failed only in `tools/gate.test.ts` (temporary-repo git tests, the 5 s limit) while the machine load average was about 25; this ticket changes no code that those tests run.

**Left.** Ticket 09 moves the retro handoff after the integration merge; the retro check of this ticket reads it at either path. The March reading of "Rescue and March" is the builder's: the owner can correct the Card deal line.

**Merge.** Merged into claude/retro-2026-10-06 as 8d8d442. In the integration worktree, three runs of `npm test` each failed one or two tests by the 5 s limit only (judge.test.ts, gate.test.ts, piece-activity.test.ts; a different test each run) while the load average was 20 to 33. Each of those files passes alone. `npx tsc --noEmit` and `npx vitest run --testTimeout=30000`: 1263 tests in 64 files passed. `node --test`: 42 of 42. `npm run test:docs`: 53 of 53.
