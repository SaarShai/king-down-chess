# Play the computer while a human game waits

Type: task
Status: needs-info
Blocked by: 15
Starts: after ticket 18 approval
Parent: [Web build](../README.md)

## What to build

A waiting player can accept the existing computer offer without losing the open human game. When an opponent arrives, Switch now or Not now controls the next page. Switch now ends only the temporary computer game with no result. The human game remains available after a return.

Use the phase 6 row and common push gate in [the test gate][gate]. Keep future operations closed. The [build index](../README.md) holds the approval and source gates.

## Acceptance criteria

- [ ] [Test gate: T1/T3; phase 6][gate]. Use the shared wait flow and two game identities. Check the existing offer time, a delayed opponent and both handoff choices; only the explicit action changes the shown game.
- [ ] [Test gate: T2/T3; phase 6][gate]. Hold and reverse game, poll, command and result replies in web-online. Check reload, close/return, account switch and a computer write in flight. Keep receipts with their game and commit no second effect.
- [ ] [Test gate: T1/T3; phase 6][gate]. Confirm temporary computer abort has no result and does not cancel the human offer or alter human rating. Finish a saved human turn after Switch now.
- [ ] [Test gate: T3/T4/T5; phase 6 and recovery proof][gate]. Run affected home/account and control checks, native input and keyboard. Reopen the two post-slice game states on the compatible recovery output.
- [ ] [Test gate: common push gate and evidence record][gate]. Record the exact source/tree, commands, exits, counts, skips (no required skip), affected selectors and device evidence. An independent reader checks this diff; fix each confirmed fault. Obtain the owner's merge word for its exact scope.
- [ ] [Test gate: applicable phase and release stops][gate]. Name the current live source (from the last deploy record) and repeat the [source checks](../README.md#owner-and-branch-gates). Prepare and review the [release packet][route], including the compatible recovery source/output. Obtain a separate owner publish go for this exact main source and public scope. Use the one deploy path; record the post-publish probes and applicable job outcomes before closure.

## Notes

- [Adaptation answer 11](../../web-adaptation/issues/11-save-ownership.md).
- [Adaptation answer 12](../../web-adaptation/issues/12-scope-picks.md).
- [Adaptation answer 16](../../web-adaptation/issues/16-test-gate.md).
- [Adaptation answer 17](../../web-adaptation/issues/17-release-route.md).
- [Spec](../../web-adaptation/spec.md), [test gate][gate] and [release route][route].
- The five parked branches stay [later work](../../shared-screens-later/README.md). Use a codex/web-* branch from the accepted main base. Keep one writer for shared files.

[gate]: ../../web-adaptation/test-gate.md
[route]: ../../web-adaptation/release-route.md
