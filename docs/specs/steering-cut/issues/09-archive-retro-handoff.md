# 09: The retro handoff goes to the archive after the integration merge

**What to build:** After the integration branch merges into main, no live handoff remains. The retro handoff moves to the tasks archive, and its first line becomes "Archived; the rules are in AGENTS.md". Its open items map to the TASKS.md index or to a close. The change is a docs and tracker change on main.

**Blocked by:** 08; the owner's merge of the integration branch into main

**Status:** ready-for-agent

- [ ] The retro handoff is in the tasks archive, and its old path holds no file.
- [ ] The archived-handoff rule of ticket 07 passes on it: the first line, no model name, no `Co-Authored-By:` line.
- [ ] The broken-link rule of ticket 01 passes: no live file links to the old path.
- [ ] Open-item map (one-off, output in this ticket): each open item of the retro handoff maps to a TASKS.md index line or to a close with its reason.

**Owns:** `docs/HANDOFF-retro.md` (moved), `docs/tasks-archive/HANDOFF-retro.md`, `TASKS.md` (the Open items lines)

**Verify:** `npm test`; `npm run test:docs`; `git ls-files docs/HANDOFF-retro.md` gives nothing.
