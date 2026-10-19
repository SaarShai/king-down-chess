# Any rules in the hall and open games

Type: task
Status: needs-triage
Blocked by: none
Starts: after the plugin session hands over src/plugin/ and the OpenAI review allows this work.
Parent: [Shared screens later work](../README.md)

## Question

How does this feature fit the current shared screens?

## Feature

Offer Any rules only for Anyone and under Find in Open games. Use the shared draft and the existing matching service. Reset on remount and a new chat draft. Keep an own open game only when its switches match or Any rules is on. Keep the reset-after-start choice open.

## Owner approval record

The source scope records the owner request for D1 a. Its owner items keep the reset-after-start choice open.

Source: `docs/specs/owner-decisions-2026-10-15/issues/09-start-and-match.md` at `06c746b0b04ac0d5da79a35a9100699762018091`, on `claude/od-home`. Read it with Git. The branch is local only. The parking record comes from the owner on 2026-10-18, as relayed by the plugin session: “yes, park them and send it”. Parking permits this later ticket. It gives no new visual approval.

## Reference

- Branch: `claude/od-home` — parked (owner, 2026-10-18).
- Tip: `06c746b0b04ac0d5da79a35a9100699762018091`.
- Feature commits: 5d98d933, 4e3422a0, 5f754cec, 23a774ab.
- Shared scope record: web adaptation ticket 12, Part 2 and Answer.

## Rule

Rebuild the missing behavior on the current shared screens. Use the branch as a reference only. Do not merge, rebase, or delete it. Keep behavior that the merged product already has. Close duplicate work with source and check evidence.

## Steps

1. After handover, compare this feature with the current shared code and the owner picks.
2. Record the smallest missing scope. Get any open scope or sample choice.
3. Rebuild that scope once for both surfaces. Keep transport and host work at their own boundary.
4. Run the required checks. Record the checked commit, results, skips, and limits.

## Pass criterion

Check both Find entry points, an own game with other switches, chat-draft reset, and the accessible description. Add no second matching rule.

The current shared screens pass their required regressions. The ticket records any open choice. 

## Comments

This ticket preserves the parked feature for later triage. Its status does not claim that the old branch is ready for the current client.
