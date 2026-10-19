# Complete hidden arrangement and Ready

Type: task
Status: needs-info
Blocked by: 10
Starts: after ticket 18 approval
Parent: [Web build](../README.md)

## What to build

A player arranges the drawn army, uses Shuffle and selects Ready. The other seat sees no hidden choice until both seats are ready. The same account board then plays a complete turn. The existing setup deadline and no-result expiry stay in force.

Use the phase 4 row and common push gate in [the test gate][gate]. Keep future operations closed. The [build index](../README.md) holds the approval and source gates.

## Acceptance criteria

- [ ] [Test gate: T1/T2; phase 4][gate]. Check common rank validation, bishop colours, guard position and king/power seat ownership. Read the other actor's actual setup view and prove hidden choices remain hidden.
- [ ] [Test gate: T1/T3; phase 4][gate]. Cover all 16 feature mixes with the shared cases. Complete Ready and a saved turn in web-online; check reload, a waiting other seat and setup expiry without a result.
- [ ] [Test gate: T3/T4; phase 4 and device matrix][gate]. Check seat drag, taps, keyboard, Shuffle, phone fit, zoom and required hit areas through actual effects. Run affected new-game and shared plugin checks.
- [ ] [Test gate: T5; compatible recovery proof][gate]. Reopen waiting, hidden setup and initialized post-slice states with the named recovery output and the recorded migration order.
- [ ] [Test gate: common push gate and evidence record][gate]. Record the exact source/tree, commands, exits, counts, skips (no required skip), affected selectors and device evidence. An independent reader checks this diff; fix each confirmed fault. Obtain the owner's merge word for its exact scope.
- [ ] [Test gate: applicable phase and release stops][gate]. Name the current live source (from the last deploy record) and repeat the [source checks](../README.md#owner-and-branch-gates). Prepare and review the [release packet][route], including the compatible recovery source/output. Obtain a separate owner publish go for this exact main source and public scope. Use the one deploy path; record the post-publish probes and applicable job outcomes before closure.

## Notes

- [Adaptation answer 03](../../web-adaptation/issues/03-http-contract.md).
- [Adaptation answer 07](../../web-adaptation/issues/07-engine-compatibility.md).
- [Adaptation answer 12](../../web-adaptation/issues/12-scope-picks.md).
- [Adaptation answer 14](../../web-adaptation/issues/14-visual-sample.md).
- [Adaptation answer 16](../../web-adaptation/issues/16-test-gate.md).
- [Adaptation answer 17](../../web-adaptation/issues/17-release-route.md).
- [Spec](../../web-adaptation/spec.md), [test gate][gate] and [release route][route].
- The five parked branches stay [later work](../../shared-screens-later/README.md). Use a codex/web-* branch from the accepted main base. Keep one writer for shared files.

[gate]: ../../web-adaptation/test-gate.md
[route]: ../../web-adaptation/release-route.md
