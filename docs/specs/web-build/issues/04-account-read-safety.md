# Make game reads safe and add account-off control

Type: task
Status: needs-info
Blocked by: 03
Starts: after ticket 18 approval
Parent: [Web build](../README.md)

## What to build

Prepare safe account reads before the page opens. Reading a game returns its seat view without changing stored state. Seat activity has a separate protected write. The operator can close web account operations without a code change; local play stays usable. Keep the production account path closed until the entry slice.

Use the phase 2 row and common push gate in [the test gate][gate]. Keep future operations closed. The [build index](../README.md) holds the approval and source gates.

## Acceptance criteria

- [ ] [Test gate: T1; phase 2 identity/reads][gate]. Prove that game GET, including since reads, makes no write. The separate seat-activity write requires the current user, seat authority and the accepted write order.
- [ ] [Test gate: T1/T5; compatible recovery and route gaps][gate]. Test the server account-off setting with the preferred database/short-cache path. Closed operations stop before service work. Document the approved operator procedure, who sets it and its measured effect time.
- [ ] [Test gate: T1/T5; phase 2 and recovery proof][gate]. Give the page host a checked status contract for the same switch. The entry ticket proves that it closes page private calls as well as direct API calls. Do not accept a hidden button or a host key that needs another deploy as this proof.
- [ ] [Test gate: T4/T5; local and recovery rows][gate]. With account access off, local entry, saves, lessons, Workshop and public offline assets still work. Test any additive setting/grant change on the isolated production-order migration list; apply nothing live.
- [ ] [Test gate: common push gate and evidence record][gate]. Record the exact source/tree, commands, exits, counts, skips (no required skip), affected selectors and device evidence. An independent reader checks this diff; fix each confirmed fault. Obtain the owner's merge word for its exact scope.
- [ ] [Test gate: scoped phase and release stops][gate]. This preparation has no publish of its own. Its later carrier publish needs the [source checks](../README.md#owner-and-branch-gates) and a reviewed [release packet][route], the owner's separate publish go and the applicable live probes. The merge word alone gives no publish or database-write go.

## Notes

- [Adaptation answer 03](../../web-adaptation/issues/03-http-contract.md).
- [Adaptation answer 10](../../web-adaptation/issues/10-account-entry.md).
- [Adaptation answer 17](../../web-adaptation/issues/17-release-route.md).
- [Spec](../../web-adaptation/spec.md), [test gate][gate] and [release route][route].
- The five parked branches stay [later work](../../shared-screens-later/README.md). Use a codex/web-* branch from the accepted main base. Keep one writer for shared files.

[gate]: ../../web-adaptation/test-gate.md
[route]: ../../web-adaptation/release-route.md
