# Read the dealt cards before Ready

Type: task
Status: needs-info
Blocked by: none
Starts: after the plugin session hands over src/plugin/ and the OpenAI review allows this work.
Parent: [Shared screens later work](../README.md)

## Question

How does this feature fit the current shared screens?

## Feature

Show the four dealt cards on the shared seat screen. Open the same rule read as the board under the game rules. Offer no Use action before play. Keep the king and power line visible and preserve an open read across the other Ready.

## Owner approval record

The source records C5 a sample approval on 2026-10-15. Plan ticket 12 carries dealt cards after the sample choice.

Source: `docs/specs/seat-reveal/issues/01-c5-sample.md` at `97e0dca199cd0935a0d1a1508488fd656e713696`, on `taste/c5-seat-reveal`. Read it with Git. The branch is local only. The parking record comes from the owner on 2026-10-18, as relayed by the plugin session: “yes, park them and send it”. Parking permits this later ticket. It gives no new visual approval.

## Reference

- Branch: `taste/c5-seat-reveal` — parked (owner, 2026-10-18).
- Tip: `97e0dca199cd0935a0d1a1508488fd656e713696`.
- Feature commits: aa8686b4, eb365bd8, 3d5c6269, c1a996ad.
- Shared scope record: web adaptation ticket 12, Part 2 and Answer.

## Rule

Rebuild the missing behavior on the current shared screens. Use the branch as a reference only. Do not merge, rebase, or delete it. Keep behavior that the merged product already has. Close duplicate work with source and check evidence.

## Steps

1. After handover, compare this feature with the current shared code and the owner picks.
2. Record the smallest missing scope. Get any open scope or sample choice.
3. Rebuild that scope once for both surfaces. Keep transport and host work at their own boundary.
4. Run the required checks. Record the checked commit, results, skips, and limits.

## Pass criterion

Check both powers states at 320 and 393 px, the four rule reads, the second row, reload, and an opponent setup update. Get sample approval before build.

The current shared screens pass their required regressions. The ticket records any open choice. 

## Comments

This ticket preserves the parked feature for later triage. Its status does not claim that the old branch is ready for the current client.
