# Finish one protected account computer game

Type: task
Status: needs-info
Blocked by: 07
Starts: after ticket 18 approval
Parent: [Web build](../README.md)

## What to build

A signed-in player starts a Beginner account computer game, stages a whole turn, uses Undo, sends, reloads after a lost reply, finishes and plays again. The shared board uses server views, drafts, receipts and polls without changing the local game. Open only the writes needed for this complete path.

Use the phase 3 row and common push gate in [the test gate][gate]. Keep future operations closed. The [build index](../README.md) holds the approval and source gates.

## Acceptance criteria

- [ ] [Test gate: T1; phase 3][gate]. Carry stable Create and turn command IDs with unchanged input. Count one stored game, whole turn and result across retries; changed input under the same ID fails. Computer games leave human ratings unchanged.
- [ ] [Test gate: T1; phase 3 shared-budget case][gate]. Enforce current-user verification and the accepted write order from the first served write. Prove one create counter across MCP and API and the shared per-instance admission limits. Test expiry/revoke/ban, pending deletion and wrong-seat refusals without private data.
- [ ] [Test gate: T2/T3; phase 3][gate]. Keep one queue, scoped notices, stamped drafts and separate receipts. Check lost/held replies, reload, copied tabs, denied storage, account change during send and a delayed reply after navigation. No duplicate effect or route jump occurs.
- [ ] [Test gate: T2/T3; phase 3][gate]. Use shared hidden/wake polling and equal-revision display rules; delete the unused old watch path when this poll takes over. Keep piece reads while locked and use whole-turn completion from the engine.
- [ ] [Test gate: T3/T4; phase 3 and input matrix][gate]. Extend web-online through a saved complete game and Play again. Run affected turn, end, game-screen and their-turn. Check native tap/drag, keyboard, symbols, threats, reduced motion and saved turn after reload.
- [ ] [Test gate: T5; compatible recovery proof][gate]. Reopen and continue post-slice computer games and receipts on the named recovery output, with account-off and safe-worker tests.
- [ ] [Test gate: common push gate and evidence record][gate]. Record the exact source/tree, commands, exits, counts, skips (no required skip), affected selectors and device evidence. An independent reader checks this diff; fix each confirmed fault. Obtain the owner's merge word for its exact scope.
- [ ] [Test gate: applicable phase and release stops][gate]. Name the current live source (from the last deploy record) and repeat the [source checks](../README.md#owner-and-branch-gates). Prepare and review the [release packet][route], including the compatible recovery source/output. Obtain a separate owner publish go for this exact main source and public scope. Use the one deploy path; record the post-publish probes and applicable job outcomes before closure.

## Notes

- [Adaptation answer 03](../../web-adaptation/issues/03-http-contract.md).
- [Adaptation answer 07](../../web-adaptation/issues/07-engine-compatibility.md).
- [Adaptation answer 10](../../web-adaptation/issues/10-account-entry.md).
- [Adaptation answer 11](../../web-adaptation/issues/11-save-ownership.md).
- [Adaptation answer 12](../../web-adaptation/issues/12-scope-picks.md).
- [Adaptation answer 16](../../web-adaptation/issues/16-test-gate.md).
- [Adaptation answer 17](../../web-adaptation/issues/17-release-route.md).
- [Spec](../../web-adaptation/spec.md), [test gate][gate] and [release route][route].
- The five parked branches stay [later work](../../shared-screens-later/README.md). Use a codex/web-* branch from the accepted main base. Keep one writer for shared files.

[gate]: ../../web-adaptation/test-gate.md
[route]: ../../web-adaptation/release-route.md
