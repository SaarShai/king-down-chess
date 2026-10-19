# Play the four-card deal and legal powers

Type: task
Status: needs-info
Blocked by: 09
Starts: after ticket 18 approval
Parent: [Web build](../README.md)

## What to build

A player chooses Pick four or a valid card pool, chooses a legal king/power combination, starts and completes a card or power turn. The board keeps both public hands, spent-coin reading, the read sheet and Use, target-first full words and the accepted art fallback.

Use the phase 4 row and common push gate in [the test gate][gate]. Keep future operations closed. The [build index](../README.md) holds the approval and source gates.

## Acceptance criteria

- [ ] [Test gate: T1/T2; phase 4][gate]. Use the common four-card deal and setup constraints. Cards allow only always-on powers. Invalid pools or combinations fail without a game write. Keep the 16 feature-mix cases.
- [ ] [Test gate: T3; phase 4][gate]. Use web-online to complete and reload saved card/power turns, including whole-turn chains and terminal actions. Piece inspection, own-piece shove/swap preview and Undo stay available under their accepted locks.
- [ ] [Test gate: T3/T4; phase 4 and sample rows][gate]. Run affected powers, read-piece, verb-marks and special-moves. Check full target words with page scroll, all four cards, readable spent coins, focus, 48 px DOM targets, zoom and native input.
- [ ] [Test gate: T5; compatible recovery proof][gate]. Continue card/power post-slice saves with their stamped engine and safe worker. Do not add the parked direct-use, painted-strip or Collection-cost features.
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
