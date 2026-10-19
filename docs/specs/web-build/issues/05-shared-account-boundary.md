# Share the account client and page host

Type: task
Status: needs-info
Blocked by: 03
Starts: after ticket 18 approval and the plugin session handover of src/plugin/
Parent: [Web build](../README.md)

## What to build

Put the account hall and read flow behind the game-client and page-host boundaries while the plugin remains complete. Move only the common state and screens that ticket 07 needs. Each later consumer moves its own screen and removes the old definition. Keep one implementation. This ticket changes no public web exposure.

Use the phase 2 row and common push gate in [the test gate][gate]. Keep future operations closed. The [build index](../README.md) holds the approval and source gates.

## Acceptance criteria

- [ ] [Test gate: T2; phase 2 and pure seam][gate]. Move the common state, hall and read flow needed by ticket 07 with their tests. Remove their old definitions. Keep later screens on their current path until their consumer ticket moves them. Keep raw MCP envelopes, widget persistence, board pointers, fullscreen and host messages in the plugin adapter.
- [ ] [Test gate: T3; phase 2 and shared plugin checks][gate]. Prove complete plugin startup and navigation through plugin-ui and plugin-ui-http; retain seat, board and result regressions. The page-host/game-client interfaces have only their two concrete callers, with no provider framework.
- [ ] [Test gate: T3/T4; sample focus/contrast rows][gate]. Put the accepted spent-coin and focus fixes in one shared CSS definition. Check the rendered contrast, focus and affected selectors on both surfaces. Keep web hit-area sizing in its page host.
- [ ] [Test gate: T4/T5; local and built-output seams][gate]. Keep the local controller and save path separate. Reuse the asset/symbol transform and check that browser-facing modules contain no server modules or service credential.
- [ ] [Test gate: common push gate and evidence record][gate]. Record the exact source/tree, commands, exits, counts, skips (no required skip), affected selectors and device evidence. An independent reader checks this diff; fix each confirmed fault. Obtain the owner's merge word for its exact scope.
- [ ] [Test gate: scoped phase and release stops][gate]. This preparation has no publish of its own. Its later carrier publish needs the [source checks](../README.md#owner-and-branch-gates) and a reviewed [release packet][route], the owner's separate publish go and the applicable live probes. The merge word alone gives no publish or database-write go.

## Notes

- [Adaptation answer 02](../../web-adaptation/issues/02-shared-client.md).
- [Adaptation answer 08](../../web-adaptation/issues/08-release-evidence.md).
- [Adaptation answer 12](../../web-adaptation/issues/12-scope-picks.md).
- [Adaptation answer 14](../../web-adaptation/issues/14-visual-sample.md).
- [Adaptation answer 17](../../web-adaptation/issues/17-release-route.md).
- [Spec](../../web-adaptation/spec.md), [test gate][gate] and [release route][route].
- The five parked branches stay [later work](../../shared-screens-later/README.md). Use a codex/web-* branch from the accepted main base. Keep one writer for shared files.

[gate]: ../../web-adaptation/test-gate.md
[route]: ../../web-adaptation/release-route.md
