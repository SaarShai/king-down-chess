# Steering cut

Status: ready-for-agent
Source: docs/specs/retro-2026-10-06/retro.md items 14, 15, 16

## Problem Statement

AGENTS.md tells each session to read TASKS.md (290 KB) and LESSONS.md (65 KB) whole. Codex reached its context limit, skipped LESSONS.md, and reworked the Workshop without the rules. Three handoffs hold the key rules, not AGENTS.md. These handoffs ask for a model-name trailer but forbid model names. The Claude memory also holds them, and Codex does not read it. Two handoffs end with stray tool markup. AGENTS.md states a false 2-hour shell limit. TASKS.md and LESSONS.md caused 12 of the 14 merge conflicts since 2026-10-02.

## Solution

AGENTS.md holds every standing rule in short sections; COMPUTE.md and HOSTING.md hold the facts. A session reads AGENTS.md and two indexes, about 4,000 words. Old tracker text moves to an archive and topic files. Live handoffs hold no rules; archived handoffs point to AGENTS.md. Tracker files merge with git's union driver. A steering lint in `npm test` stops regrowth.

## User Stories

"AGENTS.md lint": the steering lint finds the rule's phrase; no machine checks behaviour.

1. As an agent, I want all standing rules in short AGENTS.md sections and two short indexes, so that they fit my context. Check: steering lint; rule map.
2. As a Codex or Claude Code session, I want my neutral trailer and no model name or tool markup in steering files, so that I copy neither. Check: steering lint; commit-msg hook.
3. As an agent, I want the test, worktree, secret and ASD-STE100 rules, so that I work safely. Check: AGENTS.md lint.
4. As the owner, I want the run gate, with my quote recorded, and the smoke allowance, so that I control machine time. Check: AGENTS.md lint.
5. As the owner, I want one decision block, work under the agent's pick except runs and rule changes, and a sample first, so that I decide once. Check: AGENTS.md lint.
6. As an agent, I want AGENTS.md and issue-tracker.md to name the specs tracker, so that I record work in tickets. Check: steering lint.
7. As an agent, I want the true shell limit and one deploy path, so that no watcher stops early. Check: steering lint; one-off search.
8. As an agent, I want TASKS.md to open with Open items and LESSONS.md with Always and an index, so that I see work and faults. Check: steering lint.
9. As the owner, I want each old open item indexed, each old section archived, and no line-number citation, so that nothing drops or breaks. Check: one-off maps; steering lint.
10. As a builder, I want the union driver on tracker files only and the Workshop MATRIX rows kept, so that merges keep both sides. Check: steering lint.
11. As an agent, I want HANDOFF-retro.md to defer to AGENTS.md, then move to the archive, so that no handoff holds rules. Check: steering lint; follow-up ticket.
12. As an agent, I want a short Jev section and a true domain.md, so that both stay current. Check: AGENTS.md lint; owner review.

## Implementation Decisions

- **AGENTS.md sections:** Start here; Commits and branches; Tests and checks; Worktrees and servers; Runs and compute; Secrets; Hosting; Working with the owner; Game design; Jev; Helpers and machines. Rules only, no dates. New rules:
  - Start here: read this file, the Open items of TASKS.md, and the Always and Index sections of LESSONS.md; open more only when a heading matches the task. Write in ASD-STE100. Record work in a ticket in the specs folder.
  - Commits: decision 4's two trailers (the checks spec's prepare-commit-msg text), and no `Claude-Session:` line. This rule overrides a tool's attribution reminder. Never use `git commit -a` in the main checkout. Code reaches main by PR only.
  - Tests: `npm test` only; no bare vitest or `node --test`; no output piped through tail or grep.
  - Worktrees: the dev environment spec's three Guidance lines; stop a process by its PID; open no file:// page.
  - Runs: decision 6. A question is not a go. Write the quote and its date in the QUEUE.md row before the launch. Other compute uses the M1 or Kaggle.
  - Secrets: when a secret was printed or pasted, say where and offer rotation; never claim a value was never in a command line.
  - Owner: decision 11 word for word. A visual build waits for the owner's yes on a rendered sample.
  - Jev drops the version pin and moves its failed-uses list to the Jev topic file. Helpers and machines names no model.
- **COMPUTE.md:** the compute text, the HANDOFF.md run recipes and a pointer to the checks spec's runner. The shell limit is the shell's own timeout or the session end. **HOSTING.md:** the hosting facts, the secret file names only, and the deploy script as the only deploy path.
- **Tasks archive:** one folder holds month files and the archived handoffs. A 2026-10-05 cut leaves 52 KB, over 40 KB, so all sections move word for word. Undated phase plans move to September and undated Workshop sections to October.
- **TASKS.md:** the section Open items, then a link to the archive and the specs folder. An open item is an unchecked box, a heading marked open, or an open owner question in a tracker or handoff. Its line holds a bold title, a label, the next step or question, and a link. September items get needs-triage, owner questions needs-info, others ready-for-agent. The Workshop line links its spec and makes no Set A claim.
- **LESSONS.md:** the section Always (the process-environment section without its Jev bullets), then the section Index (heading, date and file per lesson). Six topic files hold the text word for word: engine and tests; runs; Jev; art and motion; browser checks and UI; agents and tools. The 42 unheaded bullets get dated headings, by git blame date for the seven undated ones. It removes the second copies of the 2026-09-22 headings "Clay facing and fixed presentation" and "Playable clay picking and layout". The 2026-09-13 rate-limit heading loses its model name.
- **Handoffs:** HANDOFF.md and HANDOFF-2026-10-06.md move to the archive; their recipes move to COMPUTE.md and their open items to the index. They lose the stray, trailer and helper-model lines and get the top line "Archived; the rules are in AGENTS.md". Until the integration merge, HANDOFF-retro.md loses its stray lines and model names, and "Follow AGENTS.md" replaces its commit, secrets and language bullets.
- **issue-tracker.md, "This repo":** the specs folder holds specs and tickets. TASKS.md is the index. QUEUE.md holds runs. The tracker files (TASKS.md, LESSONS.md, the topic files, QUEUE.md) change only on main; a branch records progress in its ticket. **domain.md:** the LESSONS.md line becomes "the Always rules and an index of lessons in topic files"; the TASKS.md line becomes "an index of open items".
- **MATRIX.md:** the Workshop rows stay; their note cites the Workshop finish spec's dated revision 3 file.
- **.gitattributes:** git's union merge driver for the tracker files, not MATRIX.md: a union merge duplicates table rows.
- **Steering lint:** one vitest module with the checks spec's doc-lint suffix, so that `npm test` and `npm run test:docs` both run it. It imports the checks spec's model-name list. Live files: the steering files outside the archive. Rules:
  - TASKS.md under 40,000 bytes, its Open items under 5,000 bytes (the compaction hook budget); LESSONS.md under 30,000 bytes;
  - AGENTS.md: no section over 120 words (heading excluded); the eleven headings; a fixed phrase per new rule, such as both trailers, `npm test` and "20 games"; issue-tracker.md names the specs folder and "only on main";
  - TASKS.md and LESSONS.md hold the sections above in order; each Open items line has a label, a link and a unique title;
  - the LESSONS.md index entries equal the topic-file headings, without repeats, and link to their files;
  - no model name in AGENTS.md, COMPUTE.md, HOSTING.md, TASKS.md, LESSONS.md or a handoff;
  - in live files, no tool-call markup and no broken relative link;
  - no tracked file outside the archive, the specs folder and the revision 3 file cites a tracker by line number;
  - no run id twice in a QUEUE.md live table;
  - the union driver applies to the tracker files, not MATRIX.md; MATRIX.md holds the D.1 row "Material behind (own side)", the D.2 row "Any piece" and the Workshop heading, one time each; the Workshop note cites the revision 3 file.

## Testing Decisions

- A good test reads the files as an agent does. A failure names the file, section and number.
- Red first: before the move, the lint shows the failing rules (sizes, the 322-word Compute section, the duplicated pair, stray lines, trailer, citations). The MATRIX.md row rule passes today, as a guard. A broken-link fixture proves the link rule.
- Seam 1: `npm test`; the checks spec's pre-push hook runs it.
- One-off checks, output in the ticket:
  - Rule map: each rule line of the old AGENTS.md and the three handoff rule blocks maps to a new section or to "dropped: <reason>".
  - Open-item map: each old open item maps to an index line or a recorded close.
  - Conservation: each old TASKS.md section is byte-identical to an archive section; each old LESSONS.md line occurs once in the new files, except the removed copies and the changed heading.
  - Search: no live file holds the 2-hour claim.
- Prior art: `src/workshop/ui.test.ts` reads MATRIX.md and asserts its rows.

## Out of Scope

- Items 9, 10 and 23, except their AGENTS.md and COMPUTE.md lines (stories 4, 5, 7). Item 23's paste-block and ETA lines have no owner decision.
- Items 11 to 13, 22, and item 14's doc-number check: they need the run pipeline.
- Items 18, 19, 21, 28 to 30: later sessions apply these small rules. A history purge: decision 5 keeps history.
- Item 15's status dashboard: a separate tool. Its worktree cleanup: the dev environment spec's `wt prune`.
- A pre-push rule that tracker files change only on main: this spec edits them on a branch.
- Item 7's ticket gate and preview check: no spec here owns a ticket-status check.

## Further Notes

- This spec also owns domain.md (two lines), the topic folder `docs/lessons/`, the archive folder `docs/tasks-archive/`, and the `tools/jev-play.ts:6` comment, which names a moved section.
- Depends on the checks, secrets and dev environment specs. The compaction hook must read main's index.
- The Workshop finish spec changes the `src/workshop/anchors.ts:32` line citation to a run id. Revision 3 moves whole, with its twelve line citations, to a dated file that the lint exempts. Until then, the lint fails.
- Order: the secrets spec's link fix merges first. If main changes a tracker file before the merge, the builder repeats the move.
- No visual change, no mockup wait. Two Claude memory files outside the repo have wrong names.
