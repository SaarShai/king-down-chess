# 95 — Local entry first paint and login

Status: ready for review
Type: task

## Plan and checks

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
