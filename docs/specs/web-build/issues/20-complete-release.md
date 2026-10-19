# Check and publish the complete web adaptation

Type: task
Status: needs-info
Blocked by: 16, 18, 19
Starts: after ticket 18 approval; all required device, speed and recovery records exist before publish
Parent: [Web build](../README.md)

## What to build

A player can use the complete account product on the website and plugin while local play stays complete. Check the integrated flows and public help on one exact source. Prepare the release packet, then publish only after the owner gives the separate go for that scope. This ticket adds no new feature.

Use the phase 8 row and common push gate in [the test gate][gate]. Keep future operations closed. The [build index](../README.md) holds the approval and source gates.

## Acceptance criteria

- [ ] [Test gate: T1–T5; phase 8][gate]. Record full unfiltered source tests with all required database cases, all current web-online cases on three engines, the full default local set, plugin-oauth, plugin-ui, plugin-ui-http, compiled server/protocol and built-output checks. Fix every confirmed release fault and rerun its affected checks.
- [ ] [Test gate: T3/T4; whole-release device gate][gate]. Complete every person/device/browser/input row for the exact candidate, including native iOS, real iPhone, the Android emulator row, real Android, keyboard/screen readers, zoom/text, focus/contrast, reduced motion and long content. The owner names the real Android tester/device; simulations do not close native rows.
- [ ] [Test gate: T3/T5; speed and worker rows][gate]. Record stable main render pairs, accepted main/plugin cold-load baselines, median-of-three results under the stated CPU/network conditions, active and blocked workers and the final numerical budget fixed by the main session. Keep warm loads separate.
- [ ] [Test gate: T1/T5; engine gap and compatible recovery proof][gate]. Attach fresh approved engine reports for exact release/recovery folders, save/column agreement, required legacy coverage, each used stamp/alias continuation and post-slice recovery games under the exact production migration list. Test account-off and worker downgrade; use no down migration or deleted game.
- [ ] [Test gate: T1/T3/T5; phase 8 public-help and release stops][gate]. Check Support and appeals, test-account continuity, notices, limits, authorized migration/grant/startup records and expected schedules. Keep mail/push/chat off. Do not invoke live jobs to fill evidence without the owner's word.
- [ ] [Test gate: T5; phase 8 post-publish evidence][gate]. After an authorized publish, record served source/deploy ID, root/account/asset routes, headers, worker bytes/policy, enabled known-path unsigned 401 and closed-operation/unknown-path refusals, existing plugin probes and approved test-account continuation. Record tick/daily HTTP outcomes and cron-history SQL result separately; scheduler success alone fails.
- [ ] [Test gate: common push gate and evidence record][gate]. Record the exact source/tree, commands, exits, counts, skips (no required skip), affected selectors and device evidence. An independent reader checks this diff; fix each confirmed fault. Obtain the owner's merge word for its exact scope.
- [ ] [Test gate: applicable phase and release stops][gate]. Name the current live source (from the last deploy record) and repeat the [source checks](../README.md#owner-and-branch-gates). Prepare and review the [release packet][route], including the compatible recovery source/output. Obtain a separate owner publish go for this exact main source and public scope. Use the one deploy path; record the post-publish probes and applicable job outcomes before closure.

## Notes

- [Adaptation answer 07](../../web-adaptation/issues/07-engine-compatibility.md).
- [Adaptation answer 08](../../web-adaptation/issues/08-release-evidence.md).
- [Adaptation answer 14](../../web-adaptation/issues/14-visual-sample.md).
- [Adaptation answer 15](../../web-adaptation/issues/15-public-safety.md).
- [Adaptation answer 16](../../web-adaptation/issues/16-test-gate.md).
- [Adaptation answer 17](../../web-adaptation/issues/17-release-route.md).
- [Spec](../../web-adaptation/spec.md), [test gate][gate] and [release route][route].
- The five parked branches stay [later work](../../shared-screens-later/README.md). Use a codex/web-* branch from the accepted main base. Keep one writer for shared files.

[gate]: ../../web-adaptation/test-gate.md
[route]: ../../web-adaptation/release-route.md
