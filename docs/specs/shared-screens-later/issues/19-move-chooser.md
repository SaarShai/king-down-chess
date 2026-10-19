# A complete move chooser

Type: task
Status: needs-triage
Blocked by: none
Starts: after the plugin session hands over src/plugin/ and the OpenAI review allows this work.
Parent: [Shared screens later work](../README.md)

## Question

How does this feature fit the current shared screens?

## Feature

Use the full current legal action list in Menu → Choose a move. Fall back to it when a selected piece has no action. Limit it to an armed card or power when needed. Show a clear no-move state. Build on the current shared board model.

## Owner approval record

The L2 b section records the owner pick on 2026-10-15 and the later-update hold on 2026-10-16. Plan ticket 12 carries the move chooser.

Source: `docs/specs/owner-decisions/issues/10-look.md` at `c382f95b3e06d7ece49ccb72614be3c4fb896de3`, on `claude/od-look`. Read it with Git. The branch is local only. The parking record comes from the owner on 2026-10-18, as relayed by the plugin session: “yes, park them and send it”. Parking permits this later ticket. It gives no new visual approval.

## Reference

- Branch: `claude/od-look` — parked (owner, 2026-10-18).
- Tip: `c382f95b3e06d7ece49ccb72614be3c4fb896de3`.
- Feature commits: d67a8112, b689cc85, 694bbc18.
- Shared scope record: web adaptation ticket 12, Part 2 and Answer.

## Rule

Rebuild the missing behavior on the current shared screens. Use the branch as a reference only. Do not merge, rebase, or delete it. Keep behavior that the merged product already has. Close duplicate work with source and check evidence.

## Steps

1. After handover, compare this feature with the current shared code and the owner picks.
2. Record the smallest missing scope. Get any open scope or sample choice.
3. Rebuild that scope once for both surfaces. Keep transport and host work at their own boundary.
4. Run the required checks. Record the checked commit, results, skips, and limits.

## Pass criterion

Compare the chooser with legal action codes for ordinary moves, powers, cards, and pass. Check no selection, a locked piece, and the waiting state.

The current shared screens pass their required regressions. The ticket records any open choice. 

## Comments

This ticket preserves the parked feature for later triage. Its status does not claim that the old branch is ready for the current client.
