# Freeze fixed sleeps and unbounded worker waits in the browser tools

Status: ready-for-agent
Source: the change rehearsals and guard checks of 2026-11-25 ([ticket 10](10-change-rehearsals.md), [ticket 11](11-guards-that-cannot-fail.md), [ticket 12](12-lessons-and-checks.md))

## Problem
Two lessons have no check in the browser tools:
- Never wait a fixed time for an animation; wait on its state. 33 files under tools/ call waitForTimeout today (the scout counted 51 with another pattern). tools/checks.lint.test.ts has no rule for it.
- Bound every wait on navigator.serviceWorker.ready. tools/verify-character-clips.mjs:143 waits with no bound. Only the registry limit bounds it, and only in CI.
Most of these files are protected now (tools/verify-*.mjs, tools/qa.mjs, tools/lib/checks.mjs: lane seam-ci).

## Change
1. A ratchet test in a new file, for example tools/browser-waits-ratchet.test.ts: count waitForTimeout calls and unbounded `serviceWorker.ready` waits per tool file, freeze today's counts in a table, fail when a count goes up or a new file has one, and fail when a count goes down until the table is lowered (the same form as tools/child-timeouts-ratchet.test.ts).
2. When the seam-ci lane ends: wrap tools/verify-character-clips.mjs:143 in a Promise.race with a timeout, and lower its count.

## Test that fails first
Fake: add one waitForTimeout call to an untracked tools/fake-wait.mjs. The ratchet fails and names the file. Remove it; the ratchet passes.

## Known limits
A ratchet does not remove the sleeps that exist. It reads source text, so a rename of the call breaks it. Some sleeps are not for an animation (for example a pause for a network retry); the table keeps them.

## Work record
Not started.
