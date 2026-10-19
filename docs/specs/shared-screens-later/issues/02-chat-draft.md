# J1 chat draft before Start

Type: task
Status: needs-info
Blocked by: none
Starts: after the plugin session hands over src/plugin/ and the OpenAI review allows this work.
Parent: [Shared screens later work](../README.md)

## Question

How does this feature fit the current shared screens?

## Feature

Make the chat request fill a visible setup draft. Create no game until Start. Keep an existing game on its board after remount. Show Review your game for an inline draft and make its summary visible. Change test case P2 in both copies, the listing, and the skill. Keep the chat tool at the plugin boundary. Use the same shared draft on the web. Do not add chat to the web.

## Owner approval record

The source scope records J1 a. Its Open section records the owner hold of 2026-10-16: J1 waits for later review. The plan ticket 12 permits later work through the shared UI.

Source: `docs/specs/owner-decisions-2026-10-15/issues/03-hall.md` at `06c746b0b04ac0d5da79a35a9100699762018091`, on `claude/od-home`. Read it with Git. The branch is local only. The parking record comes from the owner on 2026-10-18, as relayed by the plugin session: “yes, park them and send it”. Parking permits this later ticket. It gives no new visual approval.

## Reference

- Branch: `claude/od-home` — parked (owner, 2026-10-18).
- Tip: `06c746b0b04ac0d5da79a35a9100699762018091`.
- Feature commits: 4e3422a0, a8e6495f, 6e2bc72d, 5f754cec.
- Shared scope record: web adaptation ticket 12, Part 2 and Answer.

## Rule

Rebuild the missing behavior on the current shared screens. Use the branch as a reference only. Do not merge, rebase, or delete it. Keep behavior that the merged product already has. Close duplicate work with source and check evidence.

## Steps

1. After handover, compare this feature with the current shared code and the owner picks.
2. Record the smallest missing scope. Get any open scope or sample choice.
3. Rebuild that scope once for both surfaces. Keep transport and host work at their own boundary.
4. Run the required checks. Record the checked commit, results, skips, and limits.

## Pass criterion

Check no game before Start, one game after Start, inline return, remount, and the visible summary. Check both P2 copies and the skill against the new contract. Get the review decision before changing the live plugin contract.

The current shared screens pass their required regressions. The ticket records any open choice. 

## Comments

This ticket preserves the parked feature for later triage. Its status does not claim that the old branch is ready for the current client.
