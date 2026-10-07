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

**Status:** ready-for-agent

- [ ] Red first: before the rewrite, the new rules fail and name the missing headings, the sections over 120 words and the missing phrases. The output goes in this ticket.
- [ ] Rule: AGENTS.md holds the eleven `##` headings above, in this order, and no other `##` heading.
- [ ] Rule: no AGENTS.md section is over 120 words, heading excluded (the rule of ticket 05, now on every section and the preamble).
- [ ] Rule: AGENTS.md holds one fixed phrase per new rule, from a table in the lint. The table holds at least: both trailer lines, `Claude-Session:`, `git commit -a`, `npm test`, "ASD-STE100", "20 games", "A question is not a go", the specs folder, `wt add`, "rotation", "rendered sample" and the first sentence of decision 11.
- [ ] Rule: no name from the model-name module occurs in AGENTS.md.
- [ ] Rule: issue-tracker.md names the specs folder and holds "only on main".
- [ ] The Jev section has no version pin. The Jev topic file holds the list of failed uses word for word.
- [ ] domain.md holds the two new lines, and its other lines do not change.
- [ ] Rule map (one-off, output in this ticket): each rule line of the old AGENTS.md and of the three handoff rule blocks maps to a new section or to "dropped: <reason>".

**Owns:** `AGENTS.md`, `docs/agents/issue-tracker.md`, `docs/agents/domain.md`, `docs/lessons/jev.md`, `tools/steering.docs.test.ts`

**Verify:** `npm test`; `npm run test:docs`; the one-off rule map against `git show main:AGENTS.md`, `git show main:HANDOFF.md` and the two other handoffs.
