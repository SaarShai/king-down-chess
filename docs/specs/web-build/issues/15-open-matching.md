# Find and finish an open human game

Type: task
Status: needs-info
Blocked by: 12, 13, 14
Starts: after ticket 18 approval; support handling and shared-service readiness pass before public matching
Parent: [Web build](../README.md)

## What to build

A player lists open games, selects exact switches or Any rules, uses Find or Accept, and finishes a human game. A waiting offer survives close and return; Cancel alone removes it. Public matching opens only with the tested support, notice and shared-limit paths. The temporary-computer handoff follows in ticket 16.

Use the phase 6 row and common push gate in [the test gate][gate]. Keep future operations closed. The [build index](../README.md) holds the approval and source gates.

## Acceptance criteria

- [ ] [Test gate: T1; phase 6][gate]. Check oldest eligible/exact-switch and Any rules matching, concurrent Accept, expiry, both-way blocks, cancellation and one shared budget, including rematch charges. The loser of a seat race gets a stable refusal.
- [ ] [Test gate: T1/T3; phase 6][gate]. Extend web-online for lost Find, close/return, held replies and a delayed match. Count one stored effect and prove no late reply selects a different route or game.
- [ ] [Test gate: T1/T3; phase 6 public-safety gate][gate]. Attach the passing support intake → action → actor-scoped notice → appeal evidence and the owner's handling record. Verify notices on both transports and the manual appeal path for a player who cannot sign in.
- [ ] [Test gate: T3/T4; phase 6][gate]. Run affected home and account with keyboard, phone fit, zoom and native input for the new controls. Keep Block and the shared services ready before opening direct matching calls.
- [ ] [Test gate: T5; compatible recovery proof][gate]. Continue post-slice open, matched and completed games on the named recovery output; prove account-off closes the affected server and page operations.
- [ ] [Test gate: common push gate and evidence record][gate]. Record the exact source/tree, commands, exits, counts, skips (no required skip), affected selectors and device evidence. An independent reader checks this diff; fix each confirmed fault. Obtain the owner's merge word for its exact scope.
- [ ] [Test gate: applicable phase and release stops][gate]. Name the current live source (from the last deploy record) and repeat the [source checks](../README.md#owner-and-branch-gates). Prepare and review the [release packet][route], including the compatible recovery source/output. Obtain a separate owner publish go for this exact main source and public scope. Use the one deploy path; record the post-publish probes and applicable job outcomes before closure.

## Notes

- [Adaptation answer 03](../../web-adaptation/issues/03-http-contract.md).
- [Adaptation answer 10](../../web-adaptation/issues/10-account-entry.md).
- [Adaptation answer 12](../../web-adaptation/issues/12-scope-picks.md).
- [Adaptation answer 15](../../web-adaptation/issues/15-public-safety.md).
- [Adaptation answer 16](../../web-adaptation/issues/16-test-gate.md).
- [Adaptation answer 17](../../web-adaptation/issues/17-release-route.md).
- [Spec](../../web-adaptation/spec.md), [test gate][gate] and [release route][route].
- The five parked branches stay [later work](../../shared-screens-later/README.md). Use a codex/web-* branch from the accepted main base. Keep one writer for shared files.

[gate]: ../../web-adaptation/test-gate.md
[route]: ../../web-adaptation/release-route.md
