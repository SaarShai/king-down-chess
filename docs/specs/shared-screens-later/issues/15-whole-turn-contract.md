# Keep the complete-turn service contract

Type: task
Status: needs-triage
Blocked by: none
Starts: after the plugin session hands over src/plugin/ and the OpenAI review allows this work.
Parent: [Shared screens later work](../README.md)

## Question

How does this feature fit the current shared screens?

## Feature

Keep the current service and shared draft contract. Rebuild only a missing shared-screen case. Refuse an unfinished player turn without a partial write. Keep one action per computer call. Keep the current retry receipt. Do not create a second service path.

## Owner approval record

The source names owner ticket 12-submit-turn, part w7-06. The merge already carries whole-turn checks.

Source: `docs/specs/send-turn/issues/06-server-unfinished-turn.md` at `b3b52a47d0c7a5f5ed780f4a639c3b39c6e9812b`, on `claude/od-board`. Read it with Git. The branch is local only. The parking record comes from the owner on 2026-10-18, as relayed by the plugin session: “yes, park them and send it”. Parking permits this later ticket. It gives no new visual approval.

## Reference

- Branch: `claude/od-board` — parked (owner, 2026-10-18).
- Tip: `b3b52a47d0c7a5f5ed780f4a639c3b39c6e9812b`.
- Feature commits: 08f11be8, f0795e4a.
- Shared scope record: web adaptation ticket 12, Part 2 and Answer.

## Rule

Rebuild the missing behavior on the current shared screens. Use the branch as a reference only. Do not merge, rebase, or delete it. Keep behavior that the merged product already has. Close duplicate work with source and check evidence.

## Steps

1. After handover, compare this feature with the current shared code and the owner picks.
2. Record the smallest missing scope. Get any open scope or sample choice.
3. Rebuild that scope once for both surfaces. Keep transport and host work at their own boundary.
4. Run the required checks. Record the checked commit, results, skips, and limits.

## Pass criterion

Check Haste plus pass, Haste plus move, refusal rollback, retry receipt, and the computer path through both surfaces. Close with evidence if all cases already pass.

The current shared screens pass their required regressions. The ticket records any open choice. 

## Comments

This ticket preserves the parked feature for later triage. Its status does not claim that the old branch is ready for the current client.
