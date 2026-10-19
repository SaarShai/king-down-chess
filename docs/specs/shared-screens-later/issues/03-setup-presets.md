# Three setup presets

Type: task
Status: needs-triage
Blocked by: none
Starts: after the plugin session hands over src/plugin/ and the OpenAI review allows this work.
Parent: [Shared screens later work](../README.md)

## Question

How does this feature fit the current shared screens?

## Feature

Build King Down, Classic, and All features in the shared setup. Set the five switches. Keep a valid pool. Use the default pool only when the stored pool cannot play. Mark the matching preset.

## Owner approval record

The source scope records the owner request for D3 a, dated 2026-10-15. Plan ticket 12 carries hall presets to the shared UI.

Source: `docs/specs/owner-decisions-2026-10-15/issues/03-hall.md` at `06c746b0b04ac0d5da79a35a9100699762018091`, on `claude/od-home`. Read it with Git. The branch is local only. The parking record comes from the owner on 2026-10-18, as relayed by the plugin session: “yes, park them and send it”. Parking permits this later ticket. It gives no new visual approval.

## Reference

- Branch: `claude/od-home` — parked (owner, 2026-10-18).
- Tip: `06c746b0b04ac0d5da79a35a9100699762018091`.
- Feature commits: 4e3422a0, 6e2bc72d.
- Shared scope record: web adaptation ticket 12, Part 2 and Answer.

## Rule

Rebuild the missing behavior on the current shared screens. Use the branch as a reference only. Do not merge, rebase, or delete it. Keep behavior that the merged product already has. Close duplicate work with source and check evidence.

## Steps

1. After handover, compare this feature with the current shared code and the owner picks.
2. Record the smallest missing scope. Get any open scope or sample choice.
3. Rebuild that scope once for both surfaces. Keep transport and host work at their own boundary.
4. Run the required checks. Record the checked commit, results, skips, and limits.

## Pass criterion

Check all presets, custom switches, valid pools, invalid pools, and the pressed state. Keep the service validator as the rule source.

The current shared screens pass their required regressions. The ticket records any open choice. 

## Comments

This ticket preserves the parked feature for later triage. Its status does not claim that the old branch is ready for the current client.
