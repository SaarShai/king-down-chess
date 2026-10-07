# Map: retro 2026-10-06, from findings to approved specs

Label: wayfinder:map

## Destination

Five approved specs under `docs/specs/`, each `ready-for-agent`, built on the branch `claude/retro-2026-10-06` and not merged: Workshop finish, checks and hooks, secrets and public gates, steering cut, dev environment. The findings are in [retro.md](retro.md).

## Notes

- Process: docs/HANDOFF-retro.md. The owner approves each spec before implementation. A visual change needs the owner's approval of the visuals first.
- Prefer a deterministic check (test, lint, hook, browser check) to a prose rule; merge rules into the existing text, no dated notes.
- Write in ASD-STE100. No model names in commits, code or AGENTS.md. Never print or commit `.secrets/`.
- Domain: AGENTS.md, docs/RULES.md, docs/MATRIX.md, LESSONS.md.

## Decisions so far

- [Retro decisions, round 1](issues/01-retro-decisions.md): scope (b) of 15 items in five specs; Set A wired; side-by-side boards at landscape after a mockup; neutral tool trailers; transcripts deleted from the tree; every run needs a recorded go, smoke of 20 games allowed on this Mac; local logs redacted; art sources in art-src; docs/specs is the tracker and TASKS.md an index; code to main by PR only; decision blocks at the end of status messages; the Codex tree checkpointed.
- [Checkpoint and integration branch](issues/02-checkpoint-and-branch.md): commit 80b9b65 on codex/workshop-card; branch claude/retro-2026-10-06 from main, merged clean (8fa892e); the local session logs redacted (1,849 replacements, the live session file left for the session end).

- [Claude Code facts](issues/03-claude-code-facts.md): PreToolUse hooks can ask or deny with a reason and match MCP tool names; a Stop hook can block a turn; `worktree.symlinkDirectories` and `attribution.commit` exist; settings hooks run inside workflow agents.
- [Checks inventory](issues/04-checks-inventory.md): 13 pass/fail browser checks, none with a runner or an npm script, 8 writing into tracked folders; no tsc in `npm test`; no git hooks, no CI on push, no secret or size gate.
- [Workshop facts](issues/05-workshop-facts.md): `react()` is unwired and would throw on the thermometer; only 3 of its 19 selectors render; `fit()` is width-only; 33 of 34 figure sources are untracked in the Codex worktree.
- [Steering facts](issues/06-steering-facts.md): a 2026-10-05 cut of TASKS.md keeps about 52 KB; LESSONS.md has one duplicated pair; the neutral trailer and the run gate are in memory only; 77 transcripts and the rules PDF are public on main.

- [Landscape mockup](issues/07-landscape-mockup.md): approved 2026-10-07; side-by-side boards, 27 px cells, a 120 px card column, the thermometer hidden in landscape.
- [Test seams](issues/08-test-seams.md): `npm test`, one browser-check runner, and a DOM test for motion only if `Element.animate` works in happy-dom.
- [Approval](issues/10-approve-specs.md): the owner said yes to the five specs and their picks on 2026-10-07; the build starts.

## Not yet specified

- Which of the 29 review fixes need a browser check and which a vitest (facts in; the Workshop finish spec lists them).
- The exact hook set (the facts are in; the checks spec picks).
- The TASKS.md archive cut: which sections stay in the index.
- The manifest row format for approved Workshop figure sources in art-src.
- The judge test `never lowers W for an added square` failed once in a full run and passed five times alone; the checks spec decides whether it is a flake to fix.

## Out of scope

- The run pipeline items of the retro (9 to 13, 22: launch gate, watchers, run plan, archive, engine tests, proposal gate). They touch the sim tools and need runs to test; a second effort after this one.
- Items 18, 19, 21, 23, 28, 29, 30 (art brief, M1 facts, helper caps, communication format, workflow result size, zsh, card seams): rules and small scripts the next sessions apply as they go; no spec.
- A history purge of the public transcripts (needs a force-push; a separate decision).
