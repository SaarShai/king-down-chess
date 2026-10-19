# Open the safe account page and reads

Type: task
Status: needs-info
Blocked by: 04, 06
Starts: after ticket 18 approval and the recorded src/plugin/ handover
Parent: [Web build](../README.md)

## What to build

A visitor selects Play online, signs in with the existing website flow, sees Your games and opens a game or invite shell with a complete exit. Browser Back, Forward and reload work. The player can return to local play with its save intact. Open only protected identity and read operations; Create, Find, Join and turn writes stay closed on the server.

Use the phase 2 row and common push gate in [the test gate][gate]. Keep future operations closed. The [build index](../README.md) holds the approval and source gates.

## Acceptance criteria

- [ ] [Test gate: T1/T3; phase 2][gate]. Use one service user ID and the existing auth key. Check success, cancel, expiry, refresh, sign-out, account switch, two concurrent sign-ins, crossed/stale/missing flows and records older than 10 minutes. The callback is only /play/; it consumes its flow once and takes no game action on failure.
- [ ] [Test gate: T3/T5; phase 2][gate]. Serve the account shell and direct play/profile/settings/game/invite routes with root asset paths, no-store/no-referrer and no catch-all. URLs only read. A path-token invite gives 404. Check all sign-in, wrong-seat, wrong-account, missing-game and invite exits.
- [ ] [Test gate: T3/T4; phase 2 and local-entry row][gate]. Render Play online under Today's army with the accepted words; render Play on this device and the signed-out exit. Sign-in, account switch and sign-out leave local save/sync ownership intact. Run home and account and affected link checks.
- [ ] [Test gate: T3; phase 2 and sample matrix][gate]. Use the actual shared screens, sheets/columns, safe areas and page scroll. Check 48 px DOM controls, accepted board-square limits, full target words, narrow strips, contrast and visible/unobscured focus. Record the local-home render that the sample lacks.
- [ ] [Test gate: T3/T5; phase 2 and worker rows][gate]. Apply the worker policy gate at the private-call boundary and repeat it on controller change. Test old/restarted/failed/blocked worker cases and two-account isolation. Prove the account-off switch closes both page private calls and direct API operations; local play remains usable.
- [ ] [Test gate: T1/T3; phase 2 redaction and device rows][gate]. Check analytics/error logs and outgoing Referer for sign-in codes and fragments. Record real provider return with approved test accounts, same-project/user continuity, keyboard/focus and the native rows that this slice opens. Keep shared plugin and OAuth checks.
- [ ] [Test gate: common push gate and evidence record][gate]. Record the exact source/tree, commands, exits, counts, skips (no required skip), affected selectors and device evidence. An independent reader checks this diff; fix each confirmed fault. Obtain the owner's merge word for its exact scope.
- [ ] [Test gate: applicable phase and release stops][gate]. Name the current live source (from the last deploy record) and repeat the [source checks](../README.md#owner-and-branch-gates). Prepare and review the [release packet][route], including the compatible recovery source/output. Obtain a separate owner publish go for this exact main source and public scope. Use the one deploy path; record the post-publish probes and applicable job outcomes before closure.

## Notes

- [Adaptation answer 05](../../web-adaptation/issues/05-one-account.md).
- [Adaptation answer 06](../../web-adaptation/issues/06-hosting-routes.md).
- [Adaptation answer 09](../../web-adaptation/issues/09-web-play.md).
- [Adaptation answer 10](../../web-adaptation/issues/10-account-entry.md).
- [Adaptation answer 11](../../web-adaptation/issues/11-save-ownership.md).
- [Adaptation answer 13](../../web-adaptation/issues/13-routes.md).
- [Adaptation answer 14](../../web-adaptation/issues/14-visual-sample.md).
- [Adaptation answer 16](../../web-adaptation/issues/16-test-gate.md).
- [Adaptation answer 17](../../web-adaptation/issues/17-release-route.md).
- [Spec](../../web-adaptation/spec.md), [test gate][gate] and [release route][route].
- The five parked branches stay [later work](../../shared-screens-later/README.md). Use a codex/web-* branch from the accepted main base. Keep one writer for shared files.

[gate]: ../../web-adaptation/test-gate.md
[route]: ../../web-adaptation/release-route.md
