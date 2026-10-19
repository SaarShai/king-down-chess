# Safe Collection tab targets

Type: task
Status: needs-triage
Blocked by: none
Starts: after the plugin session hands over src/plugin/ and the OpenAI review allows this work.
Parent: [Shared screens later work](../README.md)

## Question

How does this feature fit the current shared screens?

## Feature

Keep each shared Collection tab hit layer inside its own label. Let the complete word fit or wrap. Preserve keyboard focus and touch access. Do not enlarge a hit area over another tab.

## Owner approval record

The source records owner approval of OPEN-collectiontabs on 2026-10-15.

Source: `docs/specs/owner-decisions/issues/10-look.md` at `c382f95b3e06d7ece49ccb72614be3c4fb896de3`, on `claude/od-look`. Read it with Git. The branch is local only. The parking record comes from the owner on 2026-10-18, as relayed by the plugin session: “yes, park them and send it”. Parking permits this later ticket. It gives no new visual approval.

## Reference

- Branch: `claude/od-look` — parked (owner, 2026-10-18).
- Tip: `c382f95b3e06d7ece49ccb72614be3c4fb896de3`.
- Feature commits: 60516586, 51e33ecc, fcd55bcd.
- Shared scope record: web adaptation ticket 12, Part 2 and Answer.

## Rule

Rebuild the missing behavior on the current shared screens. Use the branch as a reference only. Do not merge, rebase, or delete it. Keep behavior that the merged product already has. Close duplicate work with source and check evidence.

## Steps

1. After handover, compare this feature with the current shared code and the owner picks.
2. Record the smallest missing scope. Get any open scope or sample choice.
3. Rebuild that scope once for both surfaces. Keep transport and host work at their own boundary.
4. Run the required checks. Record the checked commit, results, skips, and limits.

## Pass criterion

Check all four tabs at 197 px. Scan within each border, test edges and centre, and check text bounds with touch and coarse pointer input.

The current shared screens pass their required regressions. The ticket records any open choice. 

## Comments

This ticket preserves the parked feature for later triage. Its status does not claim that the old branch is ready for the current client.
