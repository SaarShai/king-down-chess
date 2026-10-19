# More board room on a short phone

Type: task
Status: needs-info
Blocked by: none
Starts: after the plugin session hands over src/plugin/ and the OpenAI review allows this work.
Parent: [Shared screens later work](../README.md)

## Question

How does this feature fit the current shared screens?

## Feature

Review the current shared phone layout. Show a sample before changing the player row. The old sample uses one own row at 300–350 px and hides the name only visually. Keep the picture, king, power, coins, and accessible name. Keep the seat board in place on updates.

## Owner approval record

L2 b includes the short-board layout. Its Taste choices keep name hiding open for owner approval.

Source: `docs/specs/owner-decisions/issues/10-look.md` at `c382f95b3e06d7ece49ccb72614be3c4fb896de3`, on `claude/od-look`. Read it with Git. The branch is local only. The parking record comes from the owner on 2026-10-18, as relayed by the plugin session: “yes, park them and send it”. Parking permits this later ticket. It gives no new visual approval.

## Reference

- Branch: `claude/od-look` — parked (owner, 2026-10-18).
- Tip: `c382f95b3e06d7ece49ccb72614be3c4fb896de3`.
- Feature commits: d67a8112, b689cc85, c46ecb9a.
- Shared scope record: web adaptation ticket 12, Part 2 and Answer.

## Rule

Rebuild the missing behavior on the current shared screens. Use the branch as a reference only. Do not merge, rebase, or delete it. Keep behavior that the merged product already has. Close duplicate work with source and check evidence.

## Steps

1. After handover, compare this feature with the current shared code and the owner picks.
2. Record the smallest missing scope. Get any open scope or sample choice.
3. Rebuild that scope once for both surfaces. Keep transport and host work at their own boundary.
4. Run the required checks. Record the checked commit, results, skips, and limits.

## Pass criterion

Check 262, 280, 299, 300, and 320 px with all coins. Check no overlap, no missing name in the accessibility tree, and no board move after a new setup view.

The current shared screens pass their required regressions. The ticket records any open choice. 

## Comments

This ticket preserves the parked feature for later triage. Its status does not claim that the old branch is ready for the current client.
