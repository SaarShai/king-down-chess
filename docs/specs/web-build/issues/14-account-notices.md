# Read account notices through one shared view

Type: task
Status: needs-info
Blocked by: 13
Starts: after ticket 18 approval and sole shared-file ownership
Parent: [Web build](../README.md)

## What to build

A signed-in player reads a bounded, dated page of their moderation and appeal notices through the same view in the account page and the plugin. Each notice links to the public appeal steps. The preparation ships with public matching; it adds no mail delivery and opens no matching route.

Use the phase 6 row and common push gate in [the test gate][gate]. Keep future operations closed. The [build index](../README.md) holds the approval and source gates.

## Acceptance criteria

- [ ] [Test gate: T1; phase 6 public-safety case and phase 7 notice access][gate]. Add the shared actor-scoped notice read on HTTP and plugin transports. A different actor cannot read the notices. Check bounds, dates, empty states and the required server-role column grants/startup probe on the test database.
- [ ] [Test gate: T3; phase 6 support-to-appeal path][gate]. Complete intake, action, notice read and appeal through both clients. Check that notices link to public Support and the signed-out/suspended case has the documented manual path.
- [ ] [Test gate: T3/T4; phase 7 access rows][gate]. Check long content, keyboard, screen reader, zoom and account change with the common notice view; no late reply exposes the old user's notices. Run affected account and shared plugin checks.
- [ ] [Test gate: T5; compatible recovery proof][gate]. Use add-only objects/grants and prove recovery reads the recorded notice states with the exact production migration list. Matching stays closed pending its own ticket.
- [ ] [Test gate: common push gate and evidence record][gate]. Record the exact source/tree, commands, exits, counts, skips (no required skip), affected selectors and device evidence. An independent reader checks this diff; fix each confirmed fault. Obtain the owner's merge word for its exact scope.
- [ ] [Test gate: scoped phase and release stops][gate]. This preparation has no publish of its own. Its later carrier publish needs the [source checks](../README.md#owner-and-branch-gates) and a reviewed [release packet][route], the owner's separate publish go and the applicable live probes. The merge word alone gives no publish or database-write go.

## Notes

- [Adaptation answer 03](../../web-adaptation/issues/03-http-contract.md).
- [Adaptation answer 11](../../web-adaptation/issues/11-save-ownership.md).
- [Adaptation answer 15](../../web-adaptation/issues/15-public-safety.md).
- [Adaptation answer 16](../../web-adaptation/issues/16-test-gate.md).
- [Adaptation answer 17](../../web-adaptation/issues/17-release-route.md).
- [Spec](../../web-adaptation/spec.md), [test gate][gate] and [release route][route].
- The five parked branches stay [later work](../../shared-screens-later/README.md). Use a codex/web-* branch from the accepted main base. Keep one writer for shared files.

[gate]: ../../web-adaptation/test-gate.md
[route]: ../../web-adaptation/release-route.md
