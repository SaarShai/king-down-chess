# 07: Handoffs hold no rules; the two old handoffs go to the archive

**What to build:** No handoff tells an agent a rule that AGENTS.md does not hold, and no steering file holds tool-call markup or a model name for an agent to copy. The two old handoffs (the 2026-10-03 handoff with its release notes, and the 2026-10-06 Workshop handoff) move to the tasks archive. Their run recipes move to COMPUTE.md and their open items to the TASKS.md index. They lose the stray markup lines, the trailer lines and the helper-model lines, and their first line becomes "Archived; the rules are in AGENTS.md". The retro handoff stays live until the integration merge: it loses its stray lines and model names, and "Follow AGENTS.md" replaces its commit, secrets and language bullets.

**Blocked by:** 06

**Status:** ready-for-agent

- [ ] Red first: before the edit, the new rules fail and name the stray `</content>` and `</invoke>` lines, the trailer lines and the model names in each handoff. The output goes in this ticket.
- [ ] Rule: no live file holds tool-call markup (a line that is only a closing or opening tool tag).
- [ ] Rule: no name from the model-name module occurs in a handoff, live or archived.
- [ ] Rule: the first line of each archived handoff is "Archived; the rules are in AGENTS.md".
- [ ] Rule: no handoff holds a `Co-Authored-By:` line.
- [ ] The retro handoff holds "Follow AGENTS.md" in place of its commit, secrets and language bullets, and names the archived Workshop handoff by its new path.
- [ ] COMPUTE.md holds the run recipes of the 2026-10-03 handoff. The 2-hour shell claim does not move with them.
- [ ] Search (one-off, output in this ticket): no live file holds the 2-hour shell claim.
- [ ] Open-item map (one-off, output in this ticket): each open item of the two old handoffs maps to a TASKS.md index line or to a close with its reason. The Open items section stays under 5,000 bytes.

**Owns:** `HANDOFF.md` (moved), `docs/HANDOFF-2026-10-06.md` (moved), `docs/HANDOFF-retro.md`, `docs/tasks-archive/HANDOFF*.md`, `docs/COMPUTE.md` (the recipes section), `TASKS.md` (the Open items lines), `tools/steering.docs.test.ts`

**Verify:** `npm test`; `npm run test:docs`; `git grep -n -E "2 hours|2-hour" -- AGENTS.md TASKS.md LESSONS.md docs/HANDOFF-*.md docs/COMPUTE.md docs/HOSTING.md docs/lessons docs/agents docs/QUEUE.md`.
