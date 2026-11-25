# Prove that each define flag is replaced in the built plugin bundles

Status: ready-for-agent
Source: the change rehearsals and guard checks of 2026-11-25 ([ticket 10](10-change-rehearsals.md), [ticket 11](11-guards-that-cannot-fail.md), [ticket 12](12-lessons-and-checks.md))

## Problem

- src reads three non-VITE_ names from import.meta.env: KINGDOWN_CHATGPT and KINGDOWN_MUSE (src/plugin/consent.ts:15), and KINGDOWN_ERROR_RECORDER (src/api/http.ts:211,212,224,290, src/online/jobs.ts:141).
- Only the defines at tools/plugin-server-build.mjs:97 and :103 set them. Without a define, the bundle reads undefined and gives no error. vite.config.ts sets no define for them. Not verified: which web files hold these reads, and if undefined is the intended value there.
- tools/build-flags.test.ts (branch guard-build-flag-env) checks only that the text `'import.meta.env.<NAME>'` occurs in tools/plugin-server-build.mjs. It does not prove that each bundle that holds the file gets the define.
- tools/plugin-server-build.test.ts names none of these flags. That file is protected (lane seam-guards).

## Change

In tools/plugin-server-build.test.ts, build the plugin server bundle and the consent bundle, and assert. The case at tools/plugin-server-build.test.ts:76-85 already builds and reads consent.mjs. Not verified: which case builds the function bundle that holds src/api/http.ts. Assert that the output holds no text `import.meta.env.KINGDOWN_`. Take the names from the scan of tools/build-flags.mjs (reads with client true, place in src/, name without VITE_), so that a new name is in the test with no edit.

## Test that fails first

Remove `'import.meta.env.KINGDOWN_MUSE': JSON.stringify(muse)` from the define at tools/plugin-server-build.mjs:103. Expect the new assertion to name KINGDOWN_MUSE and the bundle file. Put the define back. Expect green.

## Known limits

- A build test is slow. Add it to an existing build case. Do not add a new build.
- The test must not demand a define in the web bundle before somebody decides the value there.

## Work record

Not started.
