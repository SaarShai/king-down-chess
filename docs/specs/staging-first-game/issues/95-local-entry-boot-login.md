# 95 — Local entry first paint and login

Status: ready for review
Type: task

## Plan and checks

PR 207 review round 3: scope the first-paint rule to the local table; restore board-screen tap-to-skip while allowing modal and leaving-link presses; keep empty live regions in the accessibility tree. Check account board and result visibility in CI, the held-animation login in both engines, the end flow, the requested browser checks, tests, docs and build.

Before the fix, `end` fails because a Menu press opens the sheet during the final blow. `web-game` cannot show the account setup canvas: the local startup selector hides its table. The local table now has its own selector. A board-screen press skips motion; a press in a modal or on a link to another page can act. The empty status stays rendered. The CI web-game check asserts the account table is visible on the board and result screens.

Checks: Chromium `end`, `account-discovery`, `new-game`, `game-screen`, `home`, `menu-extra`, `ui-review-samples`, `layout-title`, `painted-game`, `web-online` and `web-game` pass. WebKit `account-discovery` and `end` pass. `npm test` passes 303 files, 5,962 tests and 67 art checks; 11 tests skip. Docs checks pass 17 files and 187 tests. The build passes. The first full test run fails the offline Join message case; that case passes alone and in the full rerun. The first layout check fails when an empty status takes space; the absolute position removes that space and the rerun passes.

1. Trace the first paint and the Menu link on the local entry. Measure the before and after states.
2. Use the existing parchment floor during startup. Label the three account links “Log in” and keep the offline notice accessible.
3. Check mouse and keyboard login in Chromium and WebKit. Run the affected browser checks, full tests, docs checks and build. Keep the account-game loading path unchanged.

## Cause and fix

The local table is in the HTML before the app opens the title. With the main bundle held for 1,500 ms, the live site and the branch base show the unfinished table at 500 ms. The base title opens at 1,999 ms. The owner reports a grey screen and fast dots; this test does not reproduce the dots. The first paint now hides the table and uses the existing parchment floor. In the same held-bundle test, at 500 ms the table is hidden and there are no active animations. The title opens at 1,897 ms. These are single local samples, not a speed claim.

The board animation handler listens on the document. During a move or fall, it consumes a pointer gesture even when that gesture starts on the Menu link. The new unit case fails on the base: it consumes all three events. The local entry now skips only a press on the board. The embedded game keeps its prior skip behavior. The links on the title, Home and Menu say “Log in”. An offline message stays separate from the link name.

## Checks

- Full `npm test`, UTC and disposable local database: 303 files pass; 5,960 tests pass, 11 skip; 67 art tests pass. The first run finds two embedded skip regressions; the local-only setting fixes both.
- `KINGDOWN_TEST_FILE='{src/render/PaintedView.test.ts,tools/plugin-board-drafts.test.ts}' KINGDOWN_TEST_NAME='A8:|leaves a control click alone' npm test`: 13 pass, 75 filtered.
- `npm run check:browser account-discovery new-game game-screen ui-review-samples visual-design layout-title painted-game`: all seven pass. After the local-only setting, `account-discovery` passes again in Chromium and WebKit. It holds the animation state and clicks Menu with a real pointer. Chromium also checks offline play and the service worker; WebKit does not.
- `npm run test:docs`: 17 files, 187 tests pass.
- `npm run build`: passes.
- Review: the author inspected the changed paths and phone screenshots. Independent review remains open for the PR.

## PR 207 post-merge browser failure

Plan: compare the merge and its prior head with the same disposable database; inspect the failing setup state; correct the cause; repeat the requested Chromium checks, including a loaded run, and the full test suite. Record the results before push.

The CI log stops at the lobby setup wait after 113.8 seconds. It does not record the screen or button state at that point. The CI run reports synthetic merge `0cb1809`; the local tests use the PR head. On the same Mac and disposable database, `web-game` passes at `e4b97163` (69.2 s) and `5cb8be81` (68.5 s). The merge does not change the setup screen code or styles. These results do not establish a cause.

At the PR head with failure-only diagnostics, Chromium `web-online web-game` passes three times: 94.6 / 68.0 s with four CPU load processes, 93.7 / 70.0 s, and 94.0 / 68.8 s. `end account-discovery game-screen` pass in 28.8 / 9.4 / 7.4 s. `npm test` passes 305 files and 5,995 tests; one file and 13 tests skip. All 67 artwork checks pass. The diagnostic records only the visible screen names, Start state, and error counts if this wait fails. It changes no wait or app behavior. The cause and fix remain open; inspect that state on a repeat before choosing a change.
