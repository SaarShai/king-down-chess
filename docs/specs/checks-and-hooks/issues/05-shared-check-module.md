# 05: One shared module for the browser checks, with a self-test

**What to build:** Every browser check can import one shared module. `env(name)` gives the three settings with fixed defaults: `PLAYABLE_URL` (default `http://127.0.0.1:5189/`), `PLAYABLE_OUT` (default the check's own folder in the runner's output root) and `PLAYABLE_BROWSER` (`chromium` when `CLAUDE_CODE_REMOTE` is `true`, else `chrome`). `launch()` opens that channel. `trapErrors(page, allow)` collects page errors and console errors; each allowed pattern has a reason. `assertNoErrors` fails on any other error. The assertions are `noSidewaysScroll`, `insideViewport` (both axes), `noOverlap`, `textNotCut`, `minTarget` (takes a minimum size; default 44 px), `noRunningAnimations` and `imageIs` (compares the end of the resolved image path, so it passes under a relative and an absolute base). Each failure names the selector, the viewport and the box. `shot(page, name)` writes a screenshot into the out folder. A self-test script proves that each assertion can fail: it builds pages with `page.setContent`, needs no server, and checks each assertion on a bad page and on a good page. The Workshop finish spec restores its dropped check groups on this module.

**Blocked by:** 01

**Status:** ready-for-agent

**Owns:** `tools/lib/checks.mjs`, `tools/lib/checks.test.ts`, `tools/check-selftest.mjs`

- [ ] `env` unit test: each default when the variable is not set; each value when it is set; `PLAYABLE_BROWSER` is `chromium` when `CLAUDE_CODE_REMOTE` is `true` and `chrome` when it is not set.
- [ ] `env` unit test: the `PLAYABLE_OUT` default is a folder named for the check inside the output root, never inside the checkout.
- [ ] Self-test, story 14: each assertion fails on its bad page and passes on its good page. Bad pages: a wide row (`noSidewaysScroll`), a box below the fold (`insideViewport`), a 30 px button (`minTarget`), two overlapping boxes (`noOverlap`), a cut label (`textNotCut`), a running animation (`noRunningAnimations`), a thrown error (`assertNoErrors`), a wrong image name (`imageIs`).
- [ ] Self-test: `imageIs` passes for the right image under a relative base and under an absolute base.
- [ ] Self-test: each failure message holds the selector, the viewport size and the box.
- [ ] Self-test, story 13: an error that matches an allowed pattern passes `assertNoErrors`; an allowed pattern without a reason is refused.
- [ ] Self-test: `shot` writes its file inside the out folder and nowhere else.
- [ ] The module's header lists each export, its arguments and its default, as the reference for check authors.

**Verify:** `npm test`; `node tools/check-selftest.mjs` (exit 0; with one assertion broken by hand, exit 1 and the fault named).
