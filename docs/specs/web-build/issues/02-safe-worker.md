# Publish the safe public worker

Type: task
Status: claimed
Blocked by: 01
Starts: after ticket 18 approval
Parent: [Web build](../README.md)

## What to build

A returning local player gets a safe worker update and keeps local offline play and saves. The worker caches only public build files. It proves successful old-cache removal before it gives a policy reply. No account page or API operation opens in this slice. Add the engine-query release stop required for this first publish.

Use the phase 1 row and common push gate in [the test gate][gate]. Keep future operations closed. The [build index](../README.md) holds the approval and source gates.

## Acceptance criteria

- [ ] [Test gate: T5; phase 1][gate]. Check the public-file allowlist, the local entry offline graph, no-store cache-write refusal and all private/request bypass rules, including direct play.html. Leave unrelated storage and local saves intact.
- [ ] [Test gate: T3/T5; phase 1 and worker rows][gate]. Extend web-online for old and dormant controllers, interrupted activation, failed cache deletion, worker restart, controller change, query variants, two tabs/accounts and blocked registration. No private call starts before successful purge and a valid controller reply.
- [ ] [Test gate: T4; phase 1][gate]. Record the full default local set and two stable baseline captures in the same environment. Use ticket 08 for the accepted merge comparison and visible picks; old local links, saves, lessons and Workshop stay usable.
- [ ] [Test gate: T5; engine gap and release stops][gate]. Make publish stop if its engines database setting is absent. Require the approved fresh report against exact runtime files; reject a skipped engines-in-use check. Preserve every used archive and alias.
- [ ] [Test gate: T5; compatible recovery proof][gate]. Check release-to-recovery worker takeover and the safe policy on both outputs, including failed purge and public local assets offline.
- [ ] [Test gate: common push gate and evidence record][gate]. Record the exact source/tree, commands, exits, counts, skips (no required skip), affected selectors and device evidence. An independent reader checks this diff; fix each confirmed fault. Obtain the owner's merge word for its exact scope.
- [ ] [Test gate: applicable phase and release stops][gate]. Name the current live source (from the last deploy record) and repeat the [source checks](../README.md#owner-and-branch-gates). Prepare and review the [release packet][route], including the compatible recovery source/output. Obtain a separate owner publish go for this exact main source and public scope. Use the one deploy path; record the post-publish probes and applicable job outcomes before closure.

## Notes

- [Adaptation answer 06](../../web-adaptation/issues/06-hosting-routes.md).
- [Adaptation answer 07](../../web-adaptation/issues/07-engine-compatibility.md).
- [Adaptation answer 08](../../web-adaptation/issues/08-release-evidence.md).
- [Adaptation answer 16](../../web-adaptation/issues/16-test-gate.md).
- [Adaptation answer 17](../../web-adaptation/issues/17-release-route.md).
- [Spec](../../web-adaptation/spec.md), [test gate][gate] and [release route][route].
- The five parked branches stay [later work](../../shared-screens-later/README.md). Use a codex/web-* branch from the current main. Keep one writer for shared files.

[gate]: ../../web-adaptation/test-gate.md
[route]: ../../web-adaptation/release-route.md

## Comments

- 2026-10-19: started on `codex/web-02` from `9c337247`. Owner, 2026-10-19: "Yes: merge PR 65 when its verify passes, then start ticket 02 on codex/web-02. No publish without my word."
- 2026-10-19: slices 1 to 3 and one review fix round are on `codex/web-02`, rebased on `772b578c`. Two independent reviews found ten faults. A verify pass refuted one (a late delete; cache operations run in order) and confirmed nine. Each fix has a test that fails before it and passes after it.
  - Local evidence: 109 focused unit tests pass. Chromium passes the whole `web-online` check (109 s). WebKit passes every worker lifecycle and two-tab case, then stops at its first offline navigation with "WebKit encountered an internal error". That is Playwright issue 42775, fixed in Playwright 1.64.0; this repository pins 1.63.0. Firefox runs in CI only.
  - Open: the WebKit offline cases (they need the Playwright upgrade, the owner's call), CI on the pushed source, the full local set and stable captures, the exact release and recovery packet, the owner's merge word, and his separate publish word.
