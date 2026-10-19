# Plain dim layers

Type: task
Status: needs-triage
Blocked by: none
Starts: after the plugin session hands over src/plugin/ and the OpenAI review allows this work.
Parent: [Shared screens later work](../README.md)

## Question

How does this feature fit the current shared screens?

## Feature

Use plain dim layers for shared sheets and the seat cover. Keep their current dim colours. Check each web dialog that shares the CSS. Remove blur only within the approved shared scope.

## Owner approval record

The source records owner approval of L4 a on 2026-10-15.

Source: `docs/specs/owner-decisions/issues/10-look.md` at `c382f95b3e06d7ece49ccb72614be3c4fb896de3`, on `claude/od-look`. Read it with Git. The branch is local only. The parking record comes from the owner on 2026-10-18, as relayed by the plugin session: “yes, park them and send it”. Parking permits this later ticket. It gives no new visual approval.

## Reference

- Branch: `claude/od-look` — parked (owner, 2026-10-18).
- Tip: `c382f95b3e06d7ece49ccb72614be3c4fb896de3`.
- Feature commits: 60516586, fcd55bcd.
- Shared scope record: web adaptation ticket 12, Part 2 and Answer.

## Rule

Rebuild the missing behavior on the current shared screens. Use the branch as a reference only. Do not merge, rebase, or delete it. Keep behavior that the merged product already has. Close duplicate work with source and check evidence.

## Steps

1. After handover, compare this feature with the current shared code and the owner picks.
2. Record the smallest missing scope. Get any open scope or sample choice.
3. Rebuild that scope once for both surfaces. Keep transport and host work at their own boundary.
4. Run the required checks. Record the checked commit, results, skips, and limits.

## Pass criterion

Check live sheet, cover, and dialog layers, readable text, and no blur. Review a rendered sample at browser sizes.

The current shared screens pass their required regressions. The ticket records any open choice. 

## Comments

This ticket preserves the parked feature for later triage. Its status does not claim that the old branch is ready for the current client.
