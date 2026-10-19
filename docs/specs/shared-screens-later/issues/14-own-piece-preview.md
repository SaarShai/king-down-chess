# Keep the own-piece shove and swap preview

Type: task
Status: needs-triage
Blocked by: none
Starts: after the plugin session hands over src/plugin/ and the OpenAI review allows this work.
Parent: [Shared screens later work](../README.md)

## Question

How does this feature fit the current shared screens?

## Feature

Keep the merged preview in the shared board. Rebuild only a missing case. The first select or drag release holds a shove or swap onto an own piece. The second select or Enter stages it. Other input clears it. Use Select words from the current source.

## Owner approval record

J9 records owner pick a. The comment of 2026-10-16 says: Yes, the cut. The first update follows approval. The merge already carries this behavior.

Source: `docs/specs/owner-decisions/issues/08-shove-swap.md` at `b3b52a47d0c7a5f5ed780f4a639c3b39c6e9812b`, on `claude/od-board`. Read it with Git. The branch is local only. The parking record comes from the owner on 2026-10-18, as relayed by the plugin session: “yes, park them and send it”. Parking permits this later ticket. It gives no new visual approval.

## Reference

- Branch: `claude/od-board` — parked (owner, 2026-10-18).
- Tip: `b3b52a47d0c7a5f5ed780f4a639c3b39c6e9812b`.
- Feature commits: 95635c37, 7a077e77.
- Shared scope record: web adaptation ticket 12, Part 2 and Answer.

## Rule

Rebuild the missing behavior on the current shared screens. Use the branch as a reference only. Do not merge, rebase, or delete it. Keep behavior that the merged product already has. Close duplicate work with source and check evidence.

## Steps

1. After handover, compare this feature with the current shared code and the owner picks.
2. Record the smallest missing scope. Get any open scope or sample choice.
3. Rebuild that scope once for both surfaces. Keep transport and host work at their own boundary.
4. Run the required checks. Record the checked commit, results, skips, and limits.

## Pass criterion

Check Ogre, Maester, armed swaps, empty and enemy squares, Escape, Undo, and two-step Haste. Keep draft-only play before send. Close with evidence if the shared board already passes.

The current shared screens pass their required regressions. The ticket records any open choice. 

## Comments

This ticket preserves the parked feature for later triage. Its status does not claim that the old branch is ready for the current client.
