# Complete support intake and the appeal path

Type: task
Status: needs-info
Blocked by: 12
Starts: after ticket 18 approval
Parent: [Web build](../README.md)

## What to build

Prepare the email-support report path before public matching. The owner records a support case through the existing moderation tool, takes an action and handles an appeal. Public Support gives the real appeal steps, including help for a player who cannot sign in. This preparation ships with matching; it opens no random game route.

Use the phase 6 row and common push gate in [the test gate][gate]. Keep future operations closed. The [build index](../README.md) holds the approval and source gates.

## Acceptance criteria

- [ ] [Test gate: T1; phase 6 public-safety case][gate]. On the test database, turn a support case into the normal report row with target, handle, category, evidence reference and note, then check action and appeal records. Keep the report ID and actor scope.
- [ ] [Test gate: T1/T5; public-safety and engine gaps][gate]. Provide a checked compiled operator path or the approved SQL procedure for later authorized work. Guard against live tsx writes. Test only on isolated services; this ticket performs no live action.
- [ ] [Test gate: T3/T4; phase 6 and public-help checks][gate]. Check the public Support appeal steps and the notice destination. Name the owner as handler and the 7-day first-response target. Record the owner's handling check, including manual delivery when a player cannot sign in. This is evidence for ticket 15, not a new owner go.
- [ ] [Test gate: T1/T5; phase 6 release stops][gate]. Keep matching closed, in-app Report absent and email/push/chat delivery off. Preserve only the accepted schedules; no support test invokes a live job.
- [ ] [Test gate: common push gate and evidence record][gate]. Record the exact source/tree, commands, exits, counts, skips (no required skip), affected selectors and device evidence. An independent reader checks this diff; fix each confirmed fault. Obtain the owner's merge word for its exact scope.
- [ ] [Test gate: scoped phase and release stops][gate]. This preparation has no publish of its own. Its later carrier publish needs the [source checks](../README.md#owner-and-branch-gates) and a reviewed [release packet][route], the owner's separate publish go and the applicable live probes. The merge word alone gives no publish or database-write go.

## Notes

- [Adaptation answer 10](../../web-adaptation/issues/10-account-entry.md).
- [Adaptation answer 15](../../web-adaptation/issues/15-public-safety.md).
- [Adaptation answer 16](../../web-adaptation/issues/16-test-gate.md).
- [Adaptation answer 17](../../web-adaptation/issues/17-release-route.md).
- [Spec](../../web-adaptation/spec.md), [test gate][gate] and [release route][route].
- The five parked branches stay [later work](../../shared-screens-later/README.md). Use a codex/web-* branch from the accepted main base. Keep one writer for shared files.

[gate]: ../../web-adaptation/test-gate.md
[route]: ../../web-adaptation/release-route.md
