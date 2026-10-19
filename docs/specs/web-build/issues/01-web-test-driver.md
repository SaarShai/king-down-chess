# Add the web journey driver and push gate

Type: task
Status: resolved
Blocked by: none
Starts: after ticket 18 approval
Parent: [Web build](../README.md)

## What to build

Add one top-level web journey driver before the product slices use it. It opens the built local page through the real HTTP/test-database fixture, checks a local turn after reload, and leaves account routes closed. Keep the plugin driver and reuse its assertions. Add the required database and browser jobs to the existing push gate.

Use the phase 1 row and common push gate in [the test gate][gate]. Keep future operations closed. The [build index](../README.md) holds the approval and source gates.

## Acceptance criteria

- [x] [Test gate: T3/T4/T5; phase 1][gate]. Register web-online. Its first current-product journey uses the built output and a disposable database, makes a local move, reloads and checks the saved state. Account routes stay absent; API calls stay closed.
- [x] [Test gate: T1; required CI database gate][gate]. Fail before launch if the disposable database setting is absent. Initialize it and record full, unfiltered source-test counts and required database cases with no required skips.
- [x] [Test gate: T3; Where the checks run][gate]. Extend plugin-checks.yml only. Keep its existing jobs; add database-backed web-online on Chromium, Firefox and WebKit, the Firefox launcher path and CI timing factor. Keep test.yml unchanged.
- [x] [Test gate: T2/T3; Reuse from the plugin gate][gate]. Keep host assertions on the plugin driver. Check that the new driver uses the website HTTP path and does not use CDP or copy the widget suite.
- [x] [Test gate: common push gate and evidence record][gate]. Record the exact source/tree, commands, exits, counts, skips (no required skip), affected selectors and device evidence. An independent reader checks this diff; fix each confirmed fault. Obtain the owner's merge word for its exact scope.
- [x] [Test gate: scoped phase and release stops][gate]. This preparation has no publish of its own. Its later carrier publish needs the [source checks](../README.md#owner-and-branch-gates) and a reviewed [release packet][route], the owner's separate publish go and the applicable live probes. The merge word alone gives no publish or database-write go.

## Notes

- [Adaptation answer 04](../../web-adaptation/issues/04-test-reuse.md).
- [Adaptation answer 16](../../web-adaptation/issues/16-test-gate.md).
- [Adaptation answer 17](../../web-adaptation/issues/17-release-route.md).
- [Spec](../../web-adaptation/spec.md), [test gate][gate] and [release route][route].
- The five parked branches stay [later work](../../shared-screens-later/README.md). Use a codex/web-* branch from the current main. Keep one writer for shared files.

[gate]: ../../web-adaptation/test-gate.md
[route]: ../../web-adaptation/release-route.md

## Comments

- 2026-10-19: started on `codex/web-01` from `2837bcc6`. Owner, 2026-10-19: "Yes: close ticket 18 now at the current main, and start ticket 01's code on codex/web-01 now. No tests, commits or pushes on this Mac until the deploy record. No merge or publish without my word." Owner, 2026-10-19: "Yes: start build ticket 01 on codex/web-01 when ticket 18 closes. No merge or publish without my word."
- 2026-10-19: merged as [PR 65](https://github.com/SaarShai/king-down-chess/pull/65) (`9c337247`). Owner, 2026-10-19: "Yes: merge PR 65 when its verify passes, then start ticket 02 on codex/web-02. No publish without my word."

## Answer

`web-online` is registered and in CI. It serves the built site and the compiled server with the disposable test database. It opens the site root as a top-level page, plays e2-e4, ends the turn, reloads and checks the saved game. It requires 404 on the account routes and the `/api` paths. Firefox launches through `PLAYABLE_BROWSER=firefox`. Both browser drivers use one database guard, `testDatabase()` in `tools/plugin-db-config.mjs`.

Evidence (source `a1dfc78d` on main `6effccf5`; merge `9c337247`):

| Check | Result |
| --- | --- |
| `verify` (full unfiltered `npm test`, test database) | 3216 passed, 9 skipped (192 files). The skips are 8 opt-in balance-drift tests and 1 full-history check that a shallow clone skips; no database case skips. The first PR run failed once on a deadlock in `src/online/jobs.db.test.ts`; a separate fix is proposed; the re-run and the push run passed. |
| `browser` (Chromium: `plugin-oauth`, `plugin-ui`, `plugin-ui-http`, `web-online`) | pass, push and PR runs |
| `browser-webkit` (focused tests, `plugin-ui`, `web-online`) | pass, push and PR runs |
| `browser-firefox` (`web-online`) | pass, push and PR runs |
| Local, this Mac: `web-online` on Chromium and WebKit | pass; with no database setting it fails in 0.3 s, before the browser starts |

Two independent reviews (correctness; ticket and reuse) found two faults, both fixed before the merge: `NODE_ENV` after the build, and a copied database guard. No product selector changes, so no device record applies. This ticket has no publish; its carrier publish (ticket 02 or later) needs its own packet and owner go.

