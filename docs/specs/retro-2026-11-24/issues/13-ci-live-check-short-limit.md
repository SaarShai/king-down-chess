# Give the live-check fault tests a limit that a loaded runner can meet

Status: ready-for-agent
Source: the change rehearsals and guard checks of 2026-11-25 ([ticket 10](10-change-rehearsals.md), [ticket 11](11-guards-that-cannot-fail.md), [ticket 12](12-lessons-and-checks.md))

## Problem

`tools/deploy.test.ts` starts the live check against a local HTTP server in the test worker. Some fault tests give the whole check a short limit: 1500 ms in `check()` (tools/deploy.test.ts:813, used at :896) and in the `setup()` env (tools/deploy.test.ts:108, used by the test at :1559). The check aborts all requests at the limit (tools/deploy-live-check.mjs:168, :99). On a loaded CI shard (deploy.test.ts takes about 190 s), the local server does not answer in time. The check then names only timeouts, and the test cannot see the named difference.

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

Test change only. In each live-check fault test that asserts a named difference, set `DEPLOY_LIVE_TIMEOUT_MS: '0'` (one pass, 60 s request limit, tools/deploy-live-check.mjs:165-167). Keep one separate test with a short limit that asserts only status 1 and the time bound. In tools/deploy.test.ts:896 use `check(..., 0)` for the bundle names. In the test at :1559 pass `DEPLOY_LIVE_TIMEOUT_MS: '0'`.

## Test that fails first

Forced order with the existing `site()` option `delayMs` (tools/deploy.test.ts:782): `site(() => files, { delayMs: 1600 })` holds every reply for longer than the 1500 ms limit.
- Without the change: red with `live-check:   GET /: fetch failed (The operation was aborted due to timeout)` and no `bundle:` line, the same text as run 45209506437.
- With the change (limit 0): green, the output names `index-Old999.js` and `index-Abc123_x.js`.

## Known limits

- The cause (the in-worker server answers late on a loaded shard) is likely, not proven. The forced delay proves that the test fails in exactly this way when the reply is late.
- The other plugin fault cases at tools/deploy.test.ts:1426 still use 250 ms. They assert only `plugin-live-check: FAIL`, so a late reply does not turn them red.

## Work record

Partly built. The plugin CORS case: PR #446 (merge 55196fb27, commit 31c993190, 2026-11-23) gives it 2000 ms and a 500 ms reply delay. The "both connectors" test now uses `passingEnv` with 10000 ms (tools/deploy.test.ts:1321). No failure of these two after the repair in the runs since 2026-11-05. The `deploy-live-check.mjs` cases: not started; run 45209506437 failed after #446.
