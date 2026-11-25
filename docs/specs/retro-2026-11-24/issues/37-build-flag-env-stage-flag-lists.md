# Take the stage flag names from one list in the refusal and unset tests, and document the flags

Status: ready-for-agent
Source: the change rehearsals and guard checks of 2026-11-25 ([ticket 10](10-change-rehearsals.md), [ticket 11](11-guards-that-cannot-fail.md), [ticket 12](12-lessons-and-checks.md))

## Problem

A new stage or site flag must be refused, required, cleared or unset at many places. Each test that checks this has its own literal list, so a new name stays green:
- tools/deploy.test.ts:221 iterates `['KINGDOWN_STAGE', 'VITE_KINGDOWN_STAGE']` (refusal at tools/deploy.sh:75-76).
- tools/online-local.test.ts:125 iterates `['NODE_ENV', 'KINGDOWN_STAGE', 'VITE_KINGDOWN_STAGE']` (refusal at vite.config.ts:156, clear at tools/online-local.mjs:169).
- tools/release/release.test.ts:571 matches the exact text of tools/release/live.sh:26. tools/release/release.sh:305 has no check.
- tools/check.test.ts:141 compares CHECK_SITE_ENV (tools/lib/checks.mjs:89) with a literal object.
- tools/ios-sync.sh:9-10 exports and unsets the flags. No test found.
- Server key lists: tools/deploy-plugin-env.mjs:6,11, tools/staging-config.mjs:46,54, tools/release/staging.py:118,175. No test for a new name.

## Change

1. Export `STAGE_FLAGS = ['KINGDOWN_STAGE', 'VITE_KINGDOWN_STAGE']` from tools/build-flags.mjs (branch guard-build-flag-env).
2. Use `it.each(STAGE_FLAGS)` in tools/deploy.test.ts:221 and tools/online-local.test.ts:125 in place of the literal arrays.
3. In tools/release/release.test.ts, assert that each STAGE_FLAGS name is in the unset lines of tools/release/release.sh:305 and tools/release/live.sh:26, and that tools/ios-sync.sh unsets it for production.
4. In tools/check.test.ts:141, assert that CHECK_SITE_ENV holds each STAGE_FLAGS name that starts with VITE_, in place of the literal object.
5. Out of scope here: the server key lists (tools/deploy-plugin-env.mjs, tools/staging-config.mjs, tools/release/staging.py). They hold names without the KINGDOWN_ prefix too (RESEND_API_KEY, SUPABASE_URL), so they need their own list.
6. Docs: no doc has a full list of flags (docs/HOSTING.md:15 is protected; docs/MUSE.md:89 and docs/COMPUTE.md:40 hold test variables only). Add one short section to docs/HOSTING.md that points to tools/build-flags.mjs and its comment, in the lane that owns that file.
7. Failure text: `<NAME> is a stage flag; <file> must refuse (or unset) it`.

tools/online-local.test.ts, tools/release/**, tools/ios-sync.sh, tools/check.test.ts and docs/HOSTING.md are protected (Next seam tickets, lane seam-guards). Do this in those lanes, or after they merge.

## Test that fails first

Add 'KINGDOWN_FAKE_STAGE' to STAGE_FLAGS. Expect red in tools/deploy.test.ts (deploy.sh does not refuse it), tools/online-local.test.ts and tools/release/release.test.ts. Remove it. Expect green.

## Known limits

- Somebody must still add a new stage-like name to STAGE_FLAGS. The comment of tools/build-flags.mjs names this list, and tools/build-flags.test.ts makes the author open that file.
- tools/deploy.test.ts is slow (235 s). Run it only once.

## Work record

Not started.
