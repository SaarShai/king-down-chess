# A board preview in Your games

Type: task
Status: needs-info
Blocked by: none
Starts: after the plugin session hands over src/plugin/ and the OpenAI review allows this work.
Parent: [Shared screens later work](../README.md)

## Question

How does this feature fit the current shared screens?

## Feature

Build a new sample on the shared game rows. Compare still board, close-up replay, and current picture. Keep waiting and setup rows distinct. If replay is chosen, use a separate 44 px control and keep row text as game open. Use private position data through the shared service contract.

## Owner approval record

The source says the owner asks for sample review repairs. It also says the owner still chooses the sample. Plan ticket 12 includes B2 only after sample approval.

Source: `docs/specs/plugin-submission/issues/13-b2-row-preview.md` at `3bf795e71e6de4a2d621bc06f3418088a916991d`, on `taste/b2-row-preview`. Read it with Git. The branch is local only. The parking record comes from the owner on 2026-10-18, as relayed by the plugin session: “yes, park them and send it”. Parking permits this later ticket. It gives no new visual approval.

## Reference

- Branch: `taste/b2-row-preview` — parked (owner, 2026-10-18).
- Tip: `3bf795e71e6de4a2d621bc06f3418088a916991d`.
- Feature commits: 71b08c32, e89c7c25, 3bf795e7.
- Shared scope record: web adaptation ticket 12, Part 2 and Answer.

## Rule

Rebuild the missing behavior on the current shared screens. Use the branch as a reference only. Do not merge, rebase, or delete it. Keep behavior that the merged product already has. Close duplicate work with source and check evidence.

## Steps

1. After handover, compare this feature with the current shared code and the owner picks.
2. Record the smallest missing scope. Get any open scope or sample choice.
3. Rebuild that scope once for both surfaces. Keep transport and host work at their own boundary.
4. Run the required checks. Record the checked commit, results, skips, and limits.

## Pass criterion

Check Ogre pushes, every Beast capture, and Earth Quake against saved positions. Check keyboard, touch scroll, full replay, reduced motion, and real game open. Get the option and control choice before build.

The current shared screens pass their required regressions. The ticket records any open choice. 

## Comments

This ticket preserves the parked feature for later triage. Its status does not claim that the old branch is ready for the current client.
