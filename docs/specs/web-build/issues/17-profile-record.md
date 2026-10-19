# Read the game record, history and badges

Type: task
Status: needs-info
Blocked by: 12
Starts: after ticket 18 approval; this slice may precede public matching
Parent: [Web build](../README.md)

## What to build

A player opens the shared Profile, sees server-game totals and provisional rating, pages through active/finished games and reads earned badge goals and dates. The page uses the same records as the plugin; local wins stay local.

Use the phase 7 row and common push gate in [the test gate][gate]. Keep future operations closed. The [build index](../README.md) holds the approval and source gates.

## Acceptance criteria

- [ ] [Test gate: T1; phase 7][gate]. Extend record/history paging and result-once tests, with bounded cursors, correct actor scope and server-only totals/badges. Keep the built rating rule.
- [ ] [Test gate: T3; phase 7][gate]. Use web-online for empty and long history, More, badge details, a selected game and Back/reload. An account switch cannot expose the prior account's record.
- [ ] [Test gate: T3/T4; phase 7][gate]. Run affected account and menu-extra and the Profile keyboard, zoom and screen-reader script. Check shared art, columns, focus return and long handles.
- [ ] [Test gate: T5; compatible recovery proof][gate]. Read post-slice results/history/badges through the recovery output. Add matching-game cases to the final integrated check after phase 6 lands.
- [ ] [Test gate: common push gate and evidence record][gate]. Record the exact source/tree, commands, exits, counts, skips (no required skip), affected selectors and device evidence. An independent reader checks this diff; fix each confirmed fault. Obtain the owner's merge word for its exact scope.
- [ ] [Test gate: applicable phase and release stops][gate]. Name the current live source (from the last deploy record) and repeat the [source checks](../README.md#owner-and-branch-gates). Prepare and review the [release packet][route], including the compatible recovery source/output. Obtain a separate owner publish go for this exact main source and public scope. Use the one deploy path; record the post-publish probes and applicable job outcomes before closure.

## Notes

- [Adaptation answer 03](../../web-adaptation/issues/03-http-contract.md).
- [Adaptation answer 11](../../web-adaptation/issues/11-save-ownership.md).
- [Adaptation answer 12](../../web-adaptation/issues/12-scope-picks.md).
- [Adaptation answer 14](../../web-adaptation/issues/14-visual-sample.md).
- [Adaptation answer 16](../../web-adaptation/issues/16-test-gate.md).
- [Adaptation answer 17](../../web-adaptation/issues/17-release-route.md).
- [Spec](../../web-adaptation/spec.md), [test gate][gate] and [release route][route].
- The five parked branches stay [later work](../../shared-screens-later/README.md). Use a codex/web-* branch from the accepted main base. Keep one writer for shared files.

[gate]: ../../web-adaptation/test-gate.md
[route]: ../../web-adaptation/release-route.md
