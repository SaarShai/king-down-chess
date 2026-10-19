# Finish identity, settings and paged blocks

Type: task
Status: needs-info
Blocked by: 17
Starts: after ticket 18 approval; this slice may precede public matching
Parent: [Web build](../README.md)

## What to build

A player edits their handle and preset picture, changes account board and visibility settings, pages through blocked accounts and selects Unblock. Settings have one owner per play context. Local settings and sound keep their existing device/save ownership.

Use the phase 7 row and common push gate in [the test gate][gate]. Keep future operations closed. The [build index](../README.md) holds the approval and source gates.

## Acceptance criteria

- [ ] [Test gate: T1; phase 7][gate]. Check account settings, visibility, paged blocks and identity saves through shared account modules. Use the existing picture update and only the missing handle check; preserve partial-failure recovery and cursor bounds.
- [ ] [Test gate: T2/T3; phase 7][gate]. Keep only the latest handle availability request and retain game intent on errors. Test long/empty block pages, Unblock, account switch, storage failure and delayed replies. Another user sees no private data.
- [ ] [Test gate: T1/T3/T4; phase 7 and local-save rows][gate]. Prove one account-setting writer and separate local values, with sound on the device. Check no cross-account sync write and preserve the local save across sign-in and sign-out.
- [ ] [Test gate: T3/T4; phase 7][gate]. Run affected account and menu-extra, the keyboard/screen-reader script, zoom, 48 px control hit points and focus return. Keep matching-dependent cases in the final integrated gate.
- [ ] [Test gate: T5; compatible recovery proof][gate]. Read and update representative post-slice settings and block states through the compatible recovery output without schema reversal.
- [ ] [Test gate: common push gate and evidence record][gate]. Record the exact source/tree, commands, exits, counts, skips (no required skip), affected selectors and device evidence. An independent reader checks this diff; fix each confirmed fault. Obtain the owner's merge word for its exact scope.
- [ ] [Test gate: applicable phase and release stops][gate]. Name the current live source (from the last deploy record) and repeat the [source checks](../README.md#owner-and-branch-gates). Prepare and review the [release packet][route], including the compatible recovery source/output. Obtain a separate owner publish go for this exact main source and public scope. Use the one deploy path; record the post-publish probes and applicable job outcomes before closure.

## Notes

- [Adaptation answer 03](../../web-adaptation/issues/03-http-contract.md).
- [Adaptation answer 10](../../web-adaptation/issues/10-account-entry.md).
- [Adaptation answer 11](../../web-adaptation/issues/11-save-ownership.md).
- [Adaptation answer 15](../../web-adaptation/issues/15-public-safety.md).
- [Adaptation answer 16](../../web-adaptation/issues/16-test-gate.md).
- [Adaptation answer 17](../../web-adaptation/issues/17-release-route.md).
- [Spec](../../web-adaptation/spec.md), [test gate][gate] and [release route][route].
- The five parked branches stay [later work](../../shared-screens-later/README.md). Use a codex/web-* branch from the accepted main base. Keep one writer for shared files.

[gate]: ../../web-adaptation/test-gate.md
[route]: ../../web-adaptation/release-route.md
