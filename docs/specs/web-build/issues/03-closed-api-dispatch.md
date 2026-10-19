# Add the closed API dispatch

Type: task
Status: needs-info
Blocked by: 02
Starts: after ticket 18 approval
Parent: [Web build](../README.md)

## What to build

Prepare the one server function for the account page. API paths dispatch to the existing handler but stay closed before service work. The local site, plugin, consent, art and internal routes keep their behavior. This preparation has no publish of its own; it ships with the account-entry slice or the next exact approved scope.

Use the phase 2 row and common push gate in [the test gate][gate]. Keep future operations closed. The [build index](../README.md) holds the approval and source gates.

## Acceptance criteria

- [ ] [Test gate: T1/T5; built-output gap and phase 2][gate]. Mount the handler from the same store and services, with website verification distinct from MCP. Dispatch exact API paths and children before MCP. Check the closed state as absent or JSON 404, with no service work; a missing-verifier 503 does not pass.
- [ ] [Test gate: T1/T5; identity and route cases][gate]. In enabled isolated test configuration, prove known unsigned 401 with Bearer/no-store, foreign-origin/Host 403, wrong method 405 and unknown API JSON 404. Preserve path/query and bounded input.
- [ ] [Test gate: T5; built-output probes][gate]. Extend check:vercel in place for closed/enabled dispatch. Keep one server function, with no separate API function or HTML catch-all. Keep MCP, consent, discovery, art, engine and internal authorization probes.
- [ ] [Test gate: T1/T3; common push gate][gate]. Keep compiled server, protocol, plugin-oauth, plugin-ui and plugin-ui-http evidence for the shared-server change. Do not open account routes or game writes.
- [ ] [Test gate: common push gate and evidence record][gate]. Record the exact source/tree, commands, exits, counts, skips (no required skip), affected selectors and device evidence. An independent reader checks this diff; fix each confirmed fault. Obtain the owner's merge word for its exact scope.
- [ ] [Test gate: scoped phase and release stops][gate]. This preparation has no publish of its own. Its later carrier publish needs the [source checks](../README.md#owner-and-branch-gates) and a reviewed [release packet][route], the owner's separate publish go and the applicable live probes. The merge word alone gives no publish or database-write go.

## Notes

- [Adaptation answer 03](../../web-adaptation/issues/03-http-contract.md).
- [Adaptation answer 06](../../web-adaptation/issues/06-hosting-routes.md).
- [Adaptation answer 17](../../web-adaptation/issues/17-release-route.md).
- [Spec](../../web-adaptation/spec.md), [test gate][gate] and [release route][route].
- The five parked branches stay [later work](../../shared-screens-later/README.md). Use a codex/web-* branch from the accepted main base. Keep one writer for shared files.

[gate]: ../../web-adaptation/test-gate.md
[route]: ../../web-adaptation/release-route.md
