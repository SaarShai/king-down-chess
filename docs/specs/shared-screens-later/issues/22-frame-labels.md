# Readable labels on the dark board frame

Type: task
Status: needs-info
Blocked by: none
Starts: after the plugin session hands over src/plugin/ and the OpenAI review allows this work.
Parent: [Shared screens later work](../README.md)

## Question

How does this feature fit the current shared screens?

## Feature

Check the current shared coordinate renderer first. Show a sample of any label or frame change for both surfaces. The reference uses path glyphs, a 30-unit frame, a 40-unit small-board cap, light gold, and the existing 8 CSS px floor. Do not copy its earlier conflicting size notes.

## Owner approval record

L2 b includes frame labels. The prior visual taste choices still need owner approval.

Source: `docs/specs/owner-decisions/issues/10-look.md` at `c382f95b3e06d7ece49ccb72614be3c4fb896de3`, on `claude/od-look`. Read it with Git. The branch is local only. The parking record comes from the owner on 2026-10-18, as relayed by the plugin session: “yes, park them and send it”. Parking permits this later ticket. It gives no new visual approval.

## Reference

- Branch: `claude/od-look` — parked (owner, 2026-10-18).
- Tip: `c382f95b3e06d7ece49ccb72614be3c4fb896de3`.
- Feature commits: 5c325fd2, b689cc85.
- Shared scope record: web adaptation ticket 12, Part 2 and Answer.

## Rule

Rebuild the missing behavior on the current shared screens. Use the branch as a reference only. Do not merge, rebase, or delete it. Keep behavior that the merged product already has. Close duplicate work with source and check evidence.

## Steps

1. After handover, compare this feature with the current shared code and the owner picks.
2. Record the smallest missing scope. Get any open scope or sample choice.
3. Rebuild that scope once for both surfaces. Keep transport and host work at their own boundary.
4. Run the required checks. Record the checked commit, results, skips, and limits.

## Pass criterion

Check all labels on both board sides at small sizes. Check glyph bounds, the 8 px floor, and 4.5:1 contrast against the actual frame pixels.

The current shared screens pass their required regressions. The ticket records any open choice. 

## Comments

This ticket preserves the parked feature for later triage. Its status does not claim that the old branch is ready for the current client.
