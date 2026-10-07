# 06: AGENTS.md holds every standing rule in eleven short sections

**What to build:** A Codex or Claude Code session reads AGENTS.md and finds every standing rule there, not in a handoff or in a tool's private memory. AGENTS.md has eleven sections, in this order: Start here; Commits and branches; Tests and checks; Worktrees and servers; Runs and compute; Secrets; Hosting; Working with the owner; Game design; Jev; Helpers and machines. Each section holds rules only, no dates, and 120 words or less. The new rules are:

- Start here: read this file, the Open items of TASKS.md, and the Always and Index sections of LESSONS.md; open more only when a heading matches the task. Write in ASD-STE100. Record work in a ticket in the specs folder.
- Commits: each tool's neutral trailer (the checks spec's prepare-commit-msg text) and no `Claude-Session:` line; this rule overrides a tool's attribution reminder. Never `git commit -a` in the main checkout. Code reaches main by pull request only.
- Tests: `npm test` only; no bare vitest or `node --test`; no output piped through tail or grep.
- Worktrees: the dev environment spec's three guidance lines; stop a process by its PID; open no file:// page.
- Runs: decision 6. A question is not a go. Write the quote and its date in the QUEUE.md row before the launch. Other compute uses the M1 or Kaggle.
- Secrets: when a secret was printed or pasted, say where and offer rotation; never claim a value was never in a command line.
- Owner: decision 11 word for word. A visual build waits for the owner's yes on a rendered sample.
- Jev drops its version pin; its list of failed uses moves to the Jev topic file. Helpers and machines names no model.

issue-tracker.md "This repo" says: the specs folder holds specs and tickets; TASKS.md is the index; QUEUE.md holds runs; the tracker files change only on main, and a branch records progress in its ticket. domain.md calls LESSONS.md "the Always rules and an index of lessons in topic files" and TASKS.md "an index of open items".

**Blocked by:** 05 (shares the steering lint and AGENTS.md); checks-and-hooks/03 (the prepare-commit-msg trailer text and the model-name module); dev-environment/01 (the `wt` script), dev-environment/02 (the `worktree` launch entry), dev-environment/06 (the preview probe result that decides one of the three guidance lines)

**Status:** ready-for-human

- [x] Red first: before the rewrite, the new rules fail and name the missing headings, the sections over 120 words and the missing phrases. The output goes in this ticket.
- [x] Rule: AGENTS.md holds the eleven `##` headings above, in this order, and no other `##` heading.
- [x] Rule: no AGENTS.md section is over 120 words, heading excluded (the rule of ticket 05, now on every section and the preamble).
- [x] Rule: AGENTS.md holds one fixed phrase per new rule, from a table in the lint. The table holds at least: both trailer lines, `Claude-Session:`, `git commit -a`, `npm test`, "ASD-STE100", "20 games", "A question is not a go", the specs folder, `wt add`, "rotation", "rendered sample" and the first sentence of decision 11.
- [x] Rule: no name from the model-name module occurs in AGENTS.md.
- [x] Rule: issue-tracker.md names the specs folder and holds "only on main".
- [x] The Jev section has no version pin. The Jev topic file holds the list of failed uses word for word.
- [x] domain.md holds the two new lines, and its other lines do not change.
- [x] Rule map (one-off, output in this ticket): each rule line of the old AGENTS.md and of the three handoff rule blocks maps to a new section or to "dropped: <reason>".

**Owns:** `AGENTS.md`, `docs/agents/issue-tracker.md`, `docs/agents/domain.md`, `docs/lessons/jev.md`, `tools/steering.docs.test.ts`

**Verify:** `npm test`; `npm run test:docs`; the one-off rule map against `git show main:AGENTS.md`, `git show main:HANDOFF.md` and the two other handoffs.

## Comments

**Builder, 2026-10-07.** Branch `build/steering-cut-06`. The spec and the code agree; no conflict to record.

**What changed.**
- `AGENTS.md`: a title line, then the eleven `##` sections in the ticket's order. Words per section, heading excluded: Start here 89, Commits and branches 95, Tests and checks 77, Worktrees and servers 62, Runs and compute 114, Secrets 75, Hosting 58, Working with the owner 76, Game design 120, Jev 117, Helpers and machines 106; above the first heading 0. No date, no model name (the helper line lost its model name), no Jev version pin.
- `tools/steering.docs.test.ts`: `agentsFaults` (headings, size of each section and of the text above the first heading, the phrase table, the Jev pin, model names, dates outside link targets) and a check of the new lines in issue-tracker.md, domain.md and the Jev topic file. The phrase table reads the two trailer lines from `.githooks/prepare-commit-msg.mjs`, so a change of the hook text makes the lint fail until AGENTS.md follows. The 120-word rule of ticket 05 moved from the pointer check to every section; the pointer check now checks the link only. A `#` title line is the heading of the text above the first `##` heading, so it is not counted.
- `docs/agents/issue-tracker.md` "This repo": the specs folder holds the specs and tickets; TASKS.md is the index; QUEUE.md holds the runs; the tracker files change only on main, and a branch records its progress in its ticket. The run and visual-change line stays.
- `docs/agents/domain.md`: the LESSONS.md and TASKS.md lines only (`git diff 0c06e96 -- docs/agents/domain.md`: 2 insertions, 2 deletions).
- `docs/lessons/jev.md`: the list of failed uses, word for word, as a bullet under "2026-09-16 — TypeSafe judgments (standing rule)". Its pointer "(LESSONS.md 2026-09-16/17)" became "(the 2026-09-16 and 2026-09-17 lessons in this file)", because the lessons are now in that file. No new heading, so the LESSONS.md index does not change.

**Red first.** The final lint against the old files (`git checkout 0c06e96 -- AGENTS.md docs/agents/domain.md docs/agents/issue-tracker.md docs/lessons/jev.md`, then `npm run test:docs`, then the files restored): 2 tests failed, 45 passed. The faults:

    "AGENTS.md § Start here (count 0): the `##` heading is missing"
    "AGENTS.md § Commits and branches (count 0): the `##` heading is missing"
    "AGENTS.md § Tests and checks (count 0): the `##` heading is missing"
    "AGENTS.md § Worktrees and servers (count 0): the `##` heading is missing"
    "AGENTS.md § Runs and compute (count 0): the `##` heading is missing"
    "AGENTS.md § Secrets (count 0): the `##` heading is missing"
    "AGENTS.md § Hosting (count 0): the `##` heading is missing"
    "AGENTS.md § Working with the owner (count 0): the `##` heading is missing"
    "AGENTS.md § Game design (count 0): the `##` heading is missing"
    "AGENTS.md § Jev (count 0): the `##` heading is missing"
    "AGENTS.md § Helpers and machines (count 0): the `##` heading is missing"
    "AGENTS.md § Delegation — owner decision, 2026-10-06 (line 9): AGENTS.md must hold no `##` heading but the 11 rule sections"
    "AGENTS.md § Compute — owner decision, 2026-10-03 (line 12): AGENTS.md must hold no `##` heading but the 11 rule sections"
    "AGENTS.md § Hosting — owner decision, 2026-10-03 (line 15): AGENTS.md must hold no `##` heading but the 11 rule sections"
    "AGENTS.md § Jev / TypeSafe (optional, explicit) (line 18): AGENTS.md must hold no `##` heading but the 11 rule sections"
    "AGENTS.md § Owner guidelines (2026-09-21) (line 25): AGENTS.md must hold no `##` heading but the 11 rule sections"
    "AGENTS.md § Jev / TypeSafe (optional, explicit) (130 words, line 18): the section must hold 120 words or less, heading excluded"
    "AGENTS.md § Owner guidelines (2026-09-21) (121 words, line 25): the section must hold 120 words or less, heading excluded"
    "AGENTS.md § Start here (count 0): the section must hold \"the Open items of TASKS.md\""
    "AGENTS.md § Start here (count 0): the section must hold \"the Always and Index sections of LESSONS.md\""
    "AGENTS.md § Start here (count 0): the section must hold \"ASD-STE100\""
    "AGENTS.md § Start here (count 0): the section must hold \"docs/specs/\""
    "AGENTS.md § Commits and branches (count 0): the section must hold \"Co-Authored-By: Codex <noreply@openai.com>\""
    "AGENTS.md § Commits and branches (count 0): the section must hold \"Co-Authored-By: Claude Code <noreply@anthropic.com>\""
    "AGENTS.md § Commits and branches (count 0): the section must hold \"`Claude-Session:`\""
    "AGENTS.md § Commits and branches (count 0): the section must hold \"This rule overrides a tool's attribution reminder.\""
    "AGENTS.md § Commits and branches (count 0): the section must hold \"`git commit -a`\""
    "AGENTS.md § Commits and branches (count 0): the section must hold \"pull request\""
    "AGENTS.md § Tests and checks (count 0): the section must hold \"`npm test`\""
    "AGENTS.md § Tests and checks (count 0): the section must hold \"`node --test`\""
    "AGENTS.md § Tests and checks (count 0): the section must hold \"tail or grep\""
    "AGENTS.md § Worktrees and servers (count 0): the section must hold \"`wt add`\""
    "AGENTS.md § Worktrees and servers (count 0): the section must hold \"the `worktree` entry and the target file\""
    "AGENTS.md § Worktrees and servers (count 0): the section must hold \"its own installation\""
    "AGENTS.md § Worktrees and servers (count 0): the section must hold \"PID\""
    "AGENTS.md § Worktrees and servers (count 0): the section must hold \"file://\""
    "AGENTS.md § Runs and compute (count 0): the section must hold \"20 games\""
    "AGENTS.md § Runs and compute (count 0): the section must hold \"A question is not a go.\""
    "AGENTS.md § Runs and compute (count 0): the section must hold \"QUEUE.md\""
    "AGENTS.md § Runs and compute (count 0): the section must hold \"the M1 or Kaggle\""
    "AGENTS.md § Secrets (count 0): the section must hold \"rotation\""
    "AGENTS.md § Secrets (count 0): the section must hold \"Never claim a value was never in a command line.\""
    "AGENTS.md § Hosting (count 0): the section must hold \"tools/deploy.sh\""
    "AGENTS.md § Working with the owner (count 0): the section must hold \"Open decisions go in one block at the end of a status message: a one-sentence rule, two or three numbers, the agent's pick, what happens on yes.\""
    "AGENTS.md § Working with the owner (count 0): the section must hold \"rendered sample\""
    "AGENTS.md § Game design (count 0): the section must hold \"docs/MATRIX.md\""
    "AGENTS.md § Delegation — owner decision, 2026-10-06 (line 10): AGENTS.md must not hold the model name \"<name>\""
    "AGENTS.md § Delegation — owner decision, 2026-10-06 (line 9): AGENTS.md holds rules only, with no date: \"2026-10-06\""
    "AGENTS.md § Delegation — owner decision, 2026-10-06 (line 10): AGENTS.md holds rules only, with no date: \"2026-09-22\""
    "AGENTS.md § Compute — owner decision, 2026-10-03 (line 12): AGENTS.md holds rules only, with no date: \"2026-10-03\""
    "AGENTS.md § Hosting — owner decision, 2026-10-03 (line 15): AGENTS.md holds rules only, with no date: \"2026-10-03\""
    "AGENTS.md § Jev / TypeSafe (optional, explicit) (line 22): AGENTS.md holds rules only, with no date: \"2026-09-16\""
    "AGENTS.md § Owner guidelines (2026-09-21) (line 25): AGENTS.md holds rules only, with no date: \"2026-09-21\""
    "AGENTS.md § Owner guidelines (2026-09-21) (line 27): AGENTS.md holds rules only, with no date: \"2026-10-03\""
    "AGENTS.md § Owner guidelines (2026-09-21) (line 27): AGENTS.md holds rules only, with no date: \"2026-10-03\""
    "AGENTS.md § Owner guidelines (2026-09-21) (line 28): AGENTS.md holds rules only, with no date: \"2026-10-06\""
    "docs/agents/issue-tracker.md: the file must hold \"only on main\""
    "docs/agents/domain.md: the file must hold \"- `LESSONS.md`: the Always rules and an index of lessons in topic files.\""
    "docs/agents/domain.md: the file must hold \"- `TASKS.md`: an index of open items.\""
    "docs/lessons/jev.md: the file must hold \"What failed and must not be retried without a new design: narrative labels, fairness or game-breaking judgments, guide-text and doc triage\""

The text above the first heading of the old file holds 114 words without its title, so it passes. The first red run, before the title rule, also named it at 129 words.

**Green.** `npm run test:docs`: 2 files, 47 tests passed. `npm test`: exit 0; tsc clean; vitest 64 files, 1257 tests passed; node tests 42 passed, 0 failed. `git merge claude/retro-2026-10-06`: already up to date (tip `0c06e96`).

**Rule map.** Sources: `git show main:AGENTS.md`, `git show main:HANDOFF.md` lines 87-99, `git show main:docs/HANDOFF-retro.md` lines 65-74, `docs/HANDOFF-2026-10-06.md` lines 49-58 (not on main; read on the integration branch).

| Old rule line | New home |
|---|---|
| AGENTS 3: read TASKS.md and LESSONS.md each session | Start here (now the Open items and the Always and Index sections) |
| AGENTS 3: verify before you mark anything done | Start here |
| AGENTS 3: no run the owner has not asked for; QUEUE.md runs start by name | Runs and compute |
| AGENTS 5: cloud sessions | Helpers and machines |
| AGENTS 7: M1 and local models, device identity | Helpers and machines |
| AGENTS 9-10 Delegation: helpers may be used; DELEGATION.md | Helpers and machines (no model name) |
| AGENTS 10: "the 2026-09-22 stop is lifted" | dropped: history, not a rule |
| AGENTS 10: runs still need the owner's go | Runs and compute |
| AGENTS 13 Compute: think of Kaggle and the M1 | Runs and compute ("the M1 or Kaggle"); facts in COMPUTE.md (ticket 05) |
| AGENTS 13: token, never print or commit | Secrets |
| AGENTS 13: start long runs detached, watch with a separate check | Runs and compute; the shell limit in COMPUTE.md |
| AGENTS 16 Hosting: public site, deploy script only, deploy only what the owner asked, DNS needs a go | Hosting; facts in HOSTING.md |
| AGENTS 16: never print or commit a file of `.secrets/` | Secrets |
| AGENTS 19 Jev client and key | Jev; the version pin dropped (this ticket) |
| AGENTS 20-21, 23 Jev controls, INSTRUMENT INVALID, measurements | Jev |
| AGENTS 22 what passes | Jev |
| AGENTS 22 what failed | `docs/lessons/jev.md`; Jev links to it |
| AGENTS 26-29 value axis, piece balance, MATRIX.md, rule adoption | Game design (the owner quote and its date dropped: no dates) |
| AGENTS 30 explain plainly, answer first | Working with the owner |
| HANDOFF.md 89: kings' powers a separate mode, "No power" default | dropped: a game rule; `docs/RULES.md` line 55 holds it |
| HANDOFF.md 90-91: Light and Dark kings balance each other | Game design |
| HANDOFF.md 92: no king power changes how other pieces move; cards may | Game design (also `docs/RULES.md` line 96) |
| HANDOFF.md 93: Kaggle where it helps | Runs and compute |
| HANDOFF.md 93-94: tournaments in one session, no cloud worker sessions | Runs and compute ("no cloud agent session as a run worker") |
| HANDOFF.md 94: "ignore" the other tool and its model | dropped: it names a model, and Codex is now a peer tool with its own trailer |
| HANDOFF.md 94: runs need the owner's go | Runs and compute |
| HANDOFF.md 95: explain plainly, answer first | Working with the owner |
| HANDOFF.md 96-97: model trailer and `Claude-Session:` line | replaced: Commits and branches (decision 4 neutral trailers, no `Claude-Session:`) |
| HANDOFF.md 97: no model names in commits, PRs or code | Commits and branches |
| HANDOFF.md 98-99: secrets, Kaggle token only in `.secrets/` or the environment | Secrets; COMPUTE.md and HOSTING.md hold the file names |
| retro 67: the owner approves each spec before the build | Working with the owner |
| retro 67: a rule, piece or card spec starts from MATRIX.md | Game design |
| retro 67: visuals need the owner's approval first | Working with the owner ("rendered sample") |
| retro 68: prefer a deterministic check; merge rules, no dated note | Tests and checks |
| retro 69: never merge into main unless the owner asks | Commits and branches |
| retro 69: never deploy unless the owner asks | Hosting |
| retro 69: runs need a go; compute to the M1 or Kaggle | Runs and compute |
| retro 70-72: no model names; model trailer | Commits and branches (neutral trailer) |
| retro 73: secrets | Secrets |
| retro 74: ASD-STE100; answer first | Start here; Working with the owner |
| 2026-10-06 51: ASD-STE100; answer first | Start here; Working with the owner |
| 2026-10-06 52-54: no model names; model trailer | Commits and branches (neutral trailer) |
| 2026-10-06 55: secrets | Secrets |
| 2026-10-06 56: no new compute on this Mac; M1 or Kaggle; runs need a go | Runs and compute |
| 2026-10-06 56: `ssh M1` and the PATH line; at most 5 notebooks | `docs/LOCAL-AI-MACBOOK.md` (Helpers and machines links it); COMPUTE.md (5 notebooks) |
| 2026-10-06 57: deploy only what the owner asks; DNS needs a go | Hosting |
| 2026-10-06 57: do not test while signed in to the owner's account | Hosting |
| 2026-10-06 58: helpers are allowed | Helpers and machines |
| 2026-10-06 58: a named model for admin helpers | dropped: it names a model (decision 4); the session picks the helper model |

New rules with no old line: the neutral trailers, `git commit -a`, pull request only, `npm test` only, the three worktree lines (dev-environment/06 kept the guidance: no desktop probe has run), stop by PID, no file:// page, the 20-game smoke allowance, "A question is not a go", the quote in the QUEUE.md row, the process-environment printers, rotation, decision 11 word for word, the rendered sample, the specs folder.

**For the owner (story 12).** Please read the Jev section and the Game design line on the Light and Dark kings; both are short forms of the old text. `docs/DELEGATION.md` line 3 still links to an old AGENTS.md heading (`#delegation-policy--owner-decision-2026-09-22`) and says delegation is stopped; this ticket does not own that file, and the live-file link lint does not check anchors.

**Merge.** Merged into claude/retro-2026-10-06 as fd04e3f. npm test in the integration worktree: exit 0, vitest 1257 tests in 64 files, node tests 42 of 42. The Status stays ready-for-human for the owner review in story 12.
- Review fix F23: `docs/DELEGATION.md` line 3 links to `#helpers-and-machines` and `#runs-and-compute` and states the current rule: helpers and workflows are allowed again (owner, 2026-10-06); every simulation run needs the owner's recorded go.
- Review fix F11: the steering-lint phrase for the pull-request rule is now "Code reaches main by pull request only". Probe: with that AGENTS.md line reworded, the lint fails and names the phrase (1 failed, 49 passed); with the line restored, 50 passed.
- Review fix F19: `retro-2026-10-06/retro.md` (items 21 and 5 of the facts) and `retro-2026-10-06/issues/06-steering-facts.md` now say "a model-name trailer" and "a cheaper helper model"; a scan of `docs/specs` and AGENTS.md with the model-name module finds 0 names. AGENTS.md adds one clause to the no-model-name rule: the tasks archive keeps old text word for word and is exempt. The steering lint has one rule per file and no file list, so its scope stays as it is.
