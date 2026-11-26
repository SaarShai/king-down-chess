# Give the live-check fault tests a limit that a loaded runner can meet

Status: done (PR 478, merged 2026-11-25; not proven on a loaded CI shard)
Source: the change rehearsals and guard checks of 2026-11-25 ([ticket 10](10-change-rehearsals.md), [ticket 11](11-guards-that-cannot-fail.md), [ticket 12](12-lessons-and-checks.md))

## Problem

The live-check tests start the live check against a local HTTP server in the test worker. Since PR #476 split `tools/deploy.test.ts`, these tests are in `tools/deploy-live-check.test.ts` and `tools/deploy-publish.test.ts`. Some fault tests gave the whole check a short limit: 1500 ms in `check()` (tools/lib/deploy-site-kit.ts:142, then used by the bundle, terms and support tests of tools/deploy-live-check.test.ts) and in the `setup()` env (tools/lib/deploy-test-kit.ts:100, used by the test at tools/deploy-publish.test.ts:131). The check aborts all requests at the limit (tools/deploy-live-check.mjs:168, :99). On a loaded CI shard (the old deploy.test.ts took about 190 s), the local server does not answer in time. The check then names only timeouts, and the test cannot see the named difference.

Runs (attempt 1 red, a later attempt of the same head green):
- 45209506437 (2026-11-23, checks / test (1)): test "fails within the time limit when the live site loads a different bundle, and names both bundles".
- 44515855321 (2026-11-19, verify): test "fails when the live site does not serve the build, names the difference, and removes its worktree".

Failing lines (exact):

```
AssertionError: expected 'live-check: FAIL after 2 s: http://12…' to match /bundle: .*index-Old999\.js.*index-Abc123_x\.js/
live-check: FAIL after 2 s: http://127.0.0.1:41263 does not serve the build
live-check:   GET /: fetch failed (The operation was aborted due to timeout)
```

```
AssertionError: expected 'live-check: FAIL after 2 s: http://12…' to match /terms\.html: the live page differs/
live-check:   GET /terms.html: fetch failed (The operation was aborted due to timeout)
```

The same cause hit the plugin live check (tools/deploy-plugin-live-check.mjs:109, reason stays `request failed` when no try completes). Those cases have a repair now (see Work record):
- 45139473033 (attempt 2 cancelled, not proven), 45136724993, 44631321603, 44509905947, 44505739251 attempt 1: `AssertionError: expected 'plugin-live-check: FAIL: request fail…' to contain '/plugin-art/test-art.webp Access-Cont…'` (Expected `/plugin-art/test-art.webp Access-Control-Allow-Origin`, Received `plugin-live-check: FAIL: request failed`).
- 44829257590, 44505739251 attempt 2, 44153905662: `AssertionError: plugin-live-check: FAIL: request failed` `: expected 1 to be +0 // Object.is equality` (test "checks a build with both connectors when Muse is served or parked by the live server", then with a 1500 ms limit).

## Change

Test change only. Each live-check fault test that asserts a named difference uses limit 0 (one pass, 60 s request limit, tools/deploy-live-check.mjs:166-168). One separate test keeps a short limit and asserts only status 1 and the time bound.
- tools/deploy-live-check.test.ts:28 (bundle), :74 (terms), :83 (support, missing and stale): `check(..., 0)`.
- tools/deploy-publish.test.ts:131: `DEPLOY_LIVE_TIMEOUT_MS: '0'` in the `deployAsync` env.
- tools/deploy-live-check.test.ts:38: the new short-limit test, with the bundle fault and fast replies.

## Test that fails first

Forced order with the existing `site()` option `delayMs` (tools/lib/deploy-site-kit.ts:100): `site(() => files, { delayMs: 1600 })` holds every reply for longer than the 1500 ms limit.
- Without the change: red with `live-check:   GET /: fetch failed (The operation was aborted due to timeout)` and no `bundle:` line, the same text as run 45209506437.
- With the change (limit 0): green, the output names `index-Old999.js` and `index-Abc123_x.js`.

## Known limits

- The cause (the in-worker server answers late on a loaded shard) is likely, not proven. The forced delay proves that the test fails in exactly this way when the reply is late.
- The plugin fault loop at tools/deploy-plugin-live-check.test.ts:115 still uses 250 ms. It asserts only `plugin-live-check: FAIL`, so a late reply does not turn it red. Its cors case (2000 ms, a 500 ms reply delay, the Access-Control text and `seconds < 5`) tests the limit itself and stays as PR #446 made it.
- tools/deploy-plugin-live-check.test.ts:67 asserts the named reasons `Muse metadata must be served on staging` and `/muse/mcp discovery issuer` with a 250 ms limit. A late reply can turn it red. Limit 0 does not help there: tools/deploy-plugin-live-check.mjs:10 reads 0 as a deadline now, and a longer limit costs the full limit for each fault, because the loop tries again until the deadline. No CI failure of this test is known. Its last case (`Muse must be built on staging`, :78) fails before any request (tools/deploy-plugin-live-check.mjs:73).
- Some pass tests still run with a short limit: `check()` with its 1500 ms default (tools/deploy-live-check.test.ts:16, :123, :172, :304), the 7000 ms retry test (:96), and the publish tests that keep the `setup()` default of 1500 ms (tools/deploy-publish.test.ts:14, :101, :141). A late reply can turn them red too. They assert no named difference, so they are not in the scope of this ticket.

## Review

One independent review (an agent that did not build the change) read b5928fcb4. It ran three focused runs in a scratch copy: a late reply (1600 ms) on the new and the old tests, a fault that hides the difference lines when the limit is above 0, and a fault that adds 10 s to the deadline. Result: blocking 1, notes 5.

- Blocking: after the change, no test proved that a check with a positive limit names the difference (production uses 180000 ms). The fault "hide the difference lines when the limit is above 0" stayed green. Repair: the short-limit test also asserts `/bundle: .*index-Old999\.js|fetch failed/` (a late reply still matches the timeout line; the fault goes red on a fast runner).
- Note 1: `docs/specs/secrets-and-public-gates/issues/10-deploy-publish-and-live-check.md:16` said that one test gives the bound and the names. Repair: the criterion now says how the two are proven.
- Note 2: with limit 0, a hung local server gives only `Test timed out in 60000ms`. No change: more than 30 tests in this file already use limit 0.
- Note 3: with a positive limit, the abort can cut the last pass and hide the differences of the pass before. This is a release tool change, outside this test-only ticket: ticket [54](54-live-check-last-pass-hides-differences.md).
- Note 4: the plugin test at `tools/deploy-plugin-live-check.test.ts:67` stays at 250 ms; the reviewer agrees with the reasons in Known limits.
- Note 5: the reviewer confirmed the red text, the test counts, the green runs with the delay and the line numbers. The reviewer did not run the old publish test with the delay (11 tests, 1 failed); only the code supports that red result (`setup()` gives 1500 ms, and `tools/deploy.sh` does not set or clear the limit).

Repair check (the same reviewer, at 6c1127964): blocking 0. The fault "hide the difference lines when the limit is above 0" makes the short-limit test red (1 of 78 fails); with a 1600 ms late reply the file passes 78 of 78. The spec criterion is true. Two notes on ticket text, corrected after the check with no other review round: the test plan of ticket 54 (a 7000 ms limit, a new `site()` option) and the scope of note 5.

## Work record

Partly built. The plugin CORS case: PR #446 (merge 55196fb27, commit 31c993190, 2026-11-23) gives it 2000 ms and a 500 ms reply delay. The "both connectors" test now uses `passingEnv` with 10000 ms (tools/deploy-plugin-live-check.test.ts:14, :40). No failure of these two after the repair in the runs since 2026-11-05. The `deploy-live-check.mjs` cases: run 45209506437 failed after #446.

2026-11-25, branch live-check-limit (test change only; merged with PR 478):
- The bundle, terms and support tests in tools/deploy-live-check.test.ts and the publish test at tools/deploy-publish.test.ts:131 use limit 0. Their titles lose "within the time limit", and the three tests lose their `seconds` bound.
- The support tests now require the fault itself: `/support.html: HTTP 404` (missing) or `support.html: the live page differs` (stale). The old text `support.html` is also in the timeout line, so the old test stayed green with late replies.
- New test "fails within the time limit when the live site keeps a different bundle" (1500 ms, bundle fault): it asserts only status 1 and `seconds < 6.5`. "keeps the whole-check limit when requests and queued probes are slow" stays as it is.
- Red (old tests, `delayMs: 1600` as a scratch edit): the bundle test, the terms test and the publish test fail. The output has `live-check:   GET /: fetch failed (The operation was aborted due to timeout)` and no `bundle:` line. The two support cases stay green (see above). Files: deploy-live-check 23.1 s (77 tests, 2 failed), deploy-publish 37.5 s (11 tests, 1 failed).
- Green with the change and the delay: 89 of 89 tests. Alone: deploy-live-check 51.2 s (78 tests), deploy-publish 44.7 s (11 tests). The new short-limit test also passes with the delay.
- Green on the real tree, no delay: deploy-live-check 19.0 s (78 tests), deploy-publish 30.5 s (11 tests). `npm run typecheck` and `npm run test:docs` pass.
- Decision: the `setup()` default stays 1500 ms. The publish tests that reach the plugin live check (tools/deploy-publish.test.ts:14, :101, :141) need a positive limit, because tools/deploy-plugin-live-check.mjs:10 reads `'0'` as a deadline now. Only the one fault test sets `'0'`; it stops at the site live check, before the plugin check.
- Decision: tools/deploy-plugin-live-check.test.ts:67 stays (see Known limits).
- Not verified: the fix on a loaded CI shard. The cause there stays likely, not proven.
