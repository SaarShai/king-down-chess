# Play Classic and a chosen piece pool

Type: task
Status: needs-info
Blocked by: 08
Starts: after ticket 18 approval
Parent: [Web build](../README.md)

## What to build

A player chooses Classic or a valid Fairy piece pool, starts the account computer game and completes a turn. The shared setup remembers the last valid options. Play now stays Beginner and does not overwrite them. Old local saves and the old Chess army keep their recorded rules.

Use the phase 4 row and common push gate in [the test gate][gate]. Keep future operations closed. The [build index](../README.md) holds the approval and source gates.

## Acceptance criteria

- [ ] [Test gate: T1/T2; phase 4][gate]. Use the common builder and validator for Classic, Fairy pieces and pool weights. Keep the existing 16 feature-mix service cases and explicit Classic flag; reject invalid combinations.
- [ ] [Test gate: T3; phase 4][gate]. Take each option through a saved turn in web-online, including the relevant Classic rights and special moves. Check both side choices and the existing computer levels.
- [ ] [Test gate: T3/T4; phase 4][gate]. Run affected new-game, special-moves, read-piece and verb-marks, plus phone/zoom/input rows for moved controls. Preserve local rule flags and the named used-engine continuations.
- [ ] [Test gate: T5; compatible recovery proof][gate]. Continue representative post-slice Classic and Fairy games on the named recovery build without data conversion.
- [ ] [Test gate: common push gate and evidence record][gate]. Record the exact source/tree, commands, exits, counts, skips (no required skip), affected selectors and device evidence. An independent reader checks this diff; fix each confirmed fault. Obtain the owner's merge word for its exact scope.
- [ ] [Test gate: applicable phase and release stops][gate]. Name the current live source (from the last deploy record) and repeat the [source checks](../README.md#owner-and-branch-gates). Prepare and review the [release packet][route], including the compatible recovery source/output. Obtain a separate owner publish go for this exact main source and public scope. Use the one deploy path; record the post-publish probes and applicable job outcomes before closure.

## Notes

- [Adaptation answer 07](../../web-adaptation/issues/07-engine-compatibility.md).
- [Adaptation answer 09](../../web-adaptation/issues/09-web-play.md).
- [Adaptation answer 12](../../web-adaptation/issues/12-scope-picks.md).
- [Adaptation answer 16](../../web-adaptation/issues/16-test-gate.md).
- [Adaptation answer 17](../../web-adaptation/issues/17-release-route.md).
- [Spec](../../web-adaptation/spec.md), [test gate][gate] and [release route][route].
- The five parked branches stay [later work](../../shared-screens-later/README.md). Use a codex/web-* branch from the accepted main base. Keep one writer for shared files.

[gate]: ../../web-adaptation/test-gate.md
[route]: ../../web-adaptation/release-route.md
