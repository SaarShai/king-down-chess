# 05: One shared module for the browser checks, with a self-test

**What to build:** Every browser check can import one shared module. `env(name)` gives the three settings with fixed defaults: `PLAYABLE_URL` (default `http://127.0.0.1:5189/`), `PLAYABLE_OUT` (default the check's own folder in the runner's output root) and `PLAYABLE_BROWSER` (`chromium` when `CLAUDE_CODE_REMOTE` is `true`, else `chrome`). `launch()` opens that channel. `trapErrors(page, allow)` collects page errors and console errors; each allowed pattern has a reason. `assertNoErrors` fails on any other error. The assertions are `noSidewaysScroll`, `insideViewport` (both axes), `noOverlap`, `textNotCut`, `minTarget` (takes a minimum size; default 44 px), `noRunningAnimations` and `imageIs` (compares the end of the resolved image path, so it passes under a relative and an absolute base). Each failure names the selector, the viewport and the box. `shot(page, name)` writes a screenshot into the out folder. A self-test script proves that each assertion can fail: it builds pages with `page.setContent`, needs no server, and checks each assertion on a bad page and on a good page. The Workshop finish spec restores its dropped check groups on this module.

**Blocked by:** 01

**Status:** resolved

**Owns:** `tools/lib/checks.mjs`, `tools/lib/checks.test.ts`, `tools/check-selftest.mjs`

- [x] `env` unit test: each default when the variable is not set; each value when it is set; `PLAYABLE_BROWSER` is `chromium` when `CLAUDE_CODE_REMOTE` is `true` and `chrome` when it is not set.
- [x] `env` unit test: the `PLAYABLE_OUT` default is a folder named for the check inside the output root, never inside the checkout.
- [x] Self-test, story 14: each assertion fails on its bad page and passes on its good page. Bad pages: a wide row (`noSidewaysScroll`), a box below the fold (`insideViewport`), a 30 px button (`minTarget`), two overlapping boxes (`noOverlap`), a cut label (`textNotCut`), a running animation (`noRunningAnimations`), a thrown error (`assertNoErrors`), a wrong image name (`imageIs`).
- [x] Self-test: `imageIs` passes for the right image under a relative base and under an absolute base.
- [x] Self-test: each failure message holds the selector, the viewport size and the box.
- [x] Self-test, story 13: an error that matches an allowed pattern passes `assertNoErrors`; an allowed pattern without a reason is refused.
- [x] Self-test: `shot` writes its file inside the out folder and nowhere else.
- [x] The module's header lists each export, its arguments and its default, as the reference for check authors.

**Verify:** `npm test`; `node tools/check-selftest.mjs` (exit 0; with one assertion broken by hand, exit 1 and the fault named).

## Comments

Builder, 2026-10-07, branch `build/checks-and-hooks-05`.

- Files: `tools/lib/checks.mjs` (the module; its header is the reference for check authors), `tools/lib/checks.test.ts` (8 vitest tests for `env`), `tools/check-selftest.mjs` (the browser self-test, 16 cases).
- `env` unit test: each default with the variable not set, each set value, `chromium` when `CLAUDE_CODE_REMOTE` is `true` and `chrome` when it is not set, a set `PLAYABLE_BROWSER` wins, an unknown name throws. The `PLAYABLE_OUT` default is `<outRoot>/<check>`; the test asserts that it is not inside the checkout.
- `outRoot` is `<os.tmpdir()>/kingdown-checks`, exported for the runner (ticket 06). The check name for the default is the script name without the extension and without `verify-` (`verify-workshop.mjs` gives `workshop`). The runner sets `PLAYABLE_OUT` itself, so this default applies only to a check that you start by hand.
- Self-test cases: one bad page and one or more good pages for `minTarget`, `noSidewaysScroll`, `insideViewport` (below the fold, and past the right edge), `noOverlap`, `textNotCut`, `noRunningAnimations` (a paused animation passes), `imageIs` (a wrong name fails; the right image passes under a relative and an absolute base). Each failure message must hold the selector, `390x844` and `box x=`. Error cases: a thrown error and a console error fail and are named; a quiet page passes; an allowed error passes; an allowed pattern does not hide another error; a pattern with no reason (or a blank reason) is refused. `shot` writes `selftest.png` in the out folder only, and refuses `../escape`, `/tmp/escape` and `a/../../escape`.
- Choices that the ticket did not fix: a selector that matches no element (no rendered element, for the layout assertions) fails, so that a renamed selector cannot pass in silence. `trapErrors` returns the error list of its page; `assertNoErrors()` with no argument checks the lists of all trapped pages, so a check with many pages calls it once. An allowed pattern is tested against the raw message, so `^` anchors work. `imageIs` reads an img source or a CSS background image.
- Commands run: `npx vitest run tools/lib/checks.test.ts` (8 passed); `node tools/check-selftest.mjs` (`ok 16 cases`, exit 0). Broken by hand, one at a time, then restored: `minTarget` never fails (exit 1, `FAIL minTarget: the bad page passed`); `assertNoErrors` never throws (exit 1, three error cases named); the `shot` guard off (exit 1, the three escape names and the escaped file named).
- `npm test` after the merge of the integration tip `c6bc95e`: tsc clean, vitest 40 files and 685 tests passed, node tests 42 passed. One earlier run under a load average of 20 had three 5 s timeouts (`judge.test.ts` "never lowers W", `power-fixes.test.ts` Darkness readings, `piece-activity.test.ts`); a rerun passed. The spec gives the judge case a 30 s limit (Workshop finish spec); the other two also time out under load.
- Not done here, by the spec: the runner registry entry for the self-test and the `tempRepo` re-export (ticket 06), and the Workshop check groups on this module (Workshop finish spec).
