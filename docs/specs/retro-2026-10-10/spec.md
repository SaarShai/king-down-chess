# Retro, 2026-10-10: the after-redesign run

Status: in-review (items 2, 3 and 5 on branch `claude/retro-tools`; items 1 and 4 land on main after its merge; item 6 is the owner's; item 7 keeps what works)

Method. The transcript of the session of 2026-10-10 (3,083 entries, 04:57 to 13:41, 397 shell calls, 220 minutes inside tool calls) was read for the categories of the retro skill: navigation, automated checks, coding standards, steering files, tool economy, no-ops, information access. The candidates, most severe first, and what came of each.

1. **Tool economy: long waits held the turn.** About 90 of the 220 tool minutes were shell loops that slept until a log said "done": four full browser runs, three render compares, one review workflow. AGENTS.md said "start a run of more than a few minutes detached" under Runs and compute, so it did not fire for browser checks. → The sentence goes to Tests and checks, for any command over two minutes; on main after the merge ([ticket 01](issues/01-detached-commands-and-review-access.md)).
2. **Automated check: the render compare was hand-built every time.** Three tickets each needed about eight ad hoc commands and a classify script that lived in one session's scratchpad. → `render-compare.mjs --against <revision>` ([ticket 02](issues/02-render-compare-against.md)).
3. **A dead check: sample 00 exited 1 on every build.** Its `controls` selector was stale since the redesign, and sample 01 had the same selector. → Both selectors name today's table bar, and the new compare mode prints every sample fault and exits 1 on one ([ticket 02](issues/02-render-compare-against.md)).
4. **Review access: the reviewer read a bundle, not the repo.** Each brief copied the before-and-after files into a scratch folder; one review could not see the neighbours and downgraded a finding to "missing evidence". → The lesson gets the rule: run the reviewer in the worktree with the read-only sandbox; on main after the merge ([ticket 01](issues/01-detached-commands-and-review-access.md)).
5. **A mechanical rule as prose: the push from a dirty main checkout.** The lesson described a seven-step dance. → `tools/push-main.sh [<commit>]`, and the pre-push hook names it when it refuses a dirty tree ([ticket 03](issues/03-push-main.md)).
6. **The global agent file: likely no-ops.** Its Verification and quality section restates the model's defaults. The owner decides; nothing changed here.
7. **Worked, keep:** the 120-word limit a section in AGENTS.md and the 5,000-byte limit on the Open items of TASKS.md both forced cuts; the settings field list of `sync.ts` is held equal by a test; the two comments in `main.ts` (the CSS import order, the `keys` read order) are the only prose left for two hidden orderings.

Navigation was not a problem once `main.ts` was split; the part table of the after-redesign spec is the map of the game screen.
