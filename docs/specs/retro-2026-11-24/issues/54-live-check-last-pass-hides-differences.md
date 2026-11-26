# Keep the named differences when the time limit cuts the last pass of the live check

Status: in-review
Source: the review of the ticket [13](13-ci-live-check-short-limit.md) repair, 2026-11-25

## Problem

With a positive time limit, `tools/deploy-live-check.mjs` starts a new pass while time remains (`if (!found || Date.now() < deadline) found = await differences();`, about line 173). The check-wide abort (`checkSignal`, about line 168) can stop that pass in the middle. Then its timeout lines (`GET /: fetch failed (The operation was aborted due to timeout)`) replace the real differences of the pass before, and the FAIL text names only timeouts.

This is the same failure that the CI tests of ticket 13 showed. It can also occur in production: when a publish fails and the last pass starts close to the deadline (default 180000 ms), the owner sees timeouts and not the difference.

## Change

When `checkSignal.aborted` is true after a pass, keep the `found` of the pass before (if it has lines) and add one line that says that the last pass stopped at the limit. Do not change the limit-0 path.

## Test that fails first

A local site that answers the first pass at once with a different bundle, and holds each reply of the second pass for longer than the time that is left. `site()` has no delay that starts only after the first pass: the test needs a new `site()` option (for example a delay from the second request of `/` on) or its own server. Use a limit of about 7000 ms. The pause between passes is `Math.min(5000, left)` (tools/deploy-live-check.mjs, about line 184), so a limit shorter than the first pass plus 5 s starts no second pass. With 7000 ms, the second pass starts with about 1.7 s left, and a reply delay of more than that cuts it. Before the change, the FAIL text has only `fetch failed` lines. After the change, it names `index-Old999.js` and `index-Abc123_x.js`.

## Known limits

- This is a change of a release tool (class B), not a test change.
- Found by reading and by a fault test in the review; no production run showed it yet.

## Work record

2026-11-25, branch `live-check-last-pass` (from the ticket 13 head 954b909b7).
- `tools/deploy-live-check.mjs`: when a pass has lines, the check-wide abort fired, and the pass before has lines, the check keeps the lines of the pass before and adds `the last pass stopped at the time limit; the lines above come from the pass before`. A clean pass still passes, also when the abort fires after it. The first pass and limit 0 do not change.
- `tools/lib/deploy-site-kit.ts`: a new `site()` option `delayAfterRoots`. The delay starts only after this many requests of `/`, so only the later passes are late.
- `tools/deploy-live-check.test.ts`: the new test 'keeps the differences of the pass before when the time limit stops the last pass' (limit 7000 ms, delay 4000 ms from the second pass). It also asserts that the check made a second pass, so that it cannot pass on one pass only.
- Red first: with the old `deploy-live-check.mjs`, the test fails after 7 s, and the FAIL text has only `fetch failed (The operation was aborted due to timeout)` lines.
- Green: `tools/deploy-live-check.test.ts` 79 of 79.
