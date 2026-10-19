# Read every Collection tab

Type: task
Status: needs-info
Blocked by: 17
Starts: after ticket 18 approval; this slice may precede public matching
Parent: [Web build](../README.md)

## What to build

A player opens Pieces, Kings, Powers and Cards in the same Collection UI on both surfaces. All content stays unlocked. Rule text and existing art come from their current shared sources, including the accepted fallback for missing card paintings.

Use the phase 7 row and common push gate in [the test gate][gate]. Keep future operations closed. The [build index](../README.md) holds the approval and source gates.

## Acceptance criteria

- [ ] [Test gate: T2/T3; phase 7][gate]. Reuse the common catalogs and rule text. In web-online, read every tab, sheet and return path with all content unlocked. Add no second rule catalog or new artwork.
- [ ] [Test gate: T3/T4; phase 7 and sample rows][gate]. Check actual tab hit points, whole words, 48 px DOM controls, focus/return, keyboard, zoom and screen-reader output. Run affected account and menu-extra plus shared plugin checks.
- [ ] [Test gate: T3/T5; phase 7 and built-output gap][gate]. Check direct-page asset paths and no private worker cache. Keep the parked Collection-cost and taste features outside this slice.
- [ ] [Test gate: T5; compatible recovery proof][gate]. Confirm that the recovery output retains Collection assets and navigation with current account data.
- [ ] [Test gate: common push gate and evidence record][gate]. Record the exact source/tree, commands, exits, counts, skips (no required skip), affected selectors and device evidence. An independent reader checks this diff; fix each confirmed fault. Obtain the owner's merge word for its exact scope.
- [ ] [Test gate: applicable phase and release stops][gate]. Name the current live source (from the last deploy record) and repeat the [source checks](../README.md#owner-and-branch-gates). Prepare and review the [release packet][route], including the compatible recovery source/output. Obtain a separate owner publish go for this exact main source and public scope. Use the one deploy path; record the post-publish probes and applicable job outcomes before closure.

## Notes

- [Adaptation answer 02](../../web-adaptation/issues/02-shared-client.md).
- [Adaptation answer 12](../../web-adaptation/issues/12-scope-picks.md).
- [Adaptation answer 14](../../web-adaptation/issues/14-visual-sample.md).
- [Adaptation answer 16](../../web-adaptation/issues/16-test-gate.md).
- [Adaptation answer 17](../../web-adaptation/issues/17-release-route.md).
- [Spec](../../web-adaptation/spec.md), [test gate][gate] and [release route][route].
- The five parked branches stay [later work](../../shared-screens-later/README.md). Use a codex/web-* branch from the accepted main base. Keep one writer for shared files.

[gate]: ../../web-adaptation/test-gate.md
[route]: ../../web-adaptation/release-route.md
