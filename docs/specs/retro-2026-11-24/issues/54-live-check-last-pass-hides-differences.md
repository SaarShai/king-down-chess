# Keep the named differences when the time limit cuts the last pass of the live check

Status: ready-for-agent
Source: the review of the ticket [13](13-ci-live-check-short-limit.md) repair, 2026-11-25

## Problem

With a positive time limit, `tools/deploy-live-check.mjs` starts a new pass while time remains (`if (!found || Date.now() < deadline) found = await differences();`, about line 173). The check-wide abort (`checkSignal`, about line 168) can stop that pass in the middle. Then its timeout lines (`GET /: fetch failed (The operation was aborted due to timeout)`) replace the real differences of the pass before, and the FAIL text names only timeouts.

This is the same failure that the CI tests of ticket 13 showed. It can also occur in production: when a publish fails and the last pass starts close to the deadline (default 180000 ms), the owner sees timeouts and not the difference.

## Change

When `checkSignal.aborted` is true after a pass, keep the `found` of the pass before (if it has lines) and add one line that says that the last pass stopped at the limit. Do not change the limit-0 path.

## Test that fails first

A local site that answers the first pass at once with a different bundle and holds each later reply for longer than the time that is left (site() with a reply delay that starts after the first pass). With a limit of about 3000 ms: before the change, the FAIL text has only `fetch failed` lines; after the change, it names `index-Old999.js` and `index-Abc123_x.js`.

## Known limits

- This is a change of a release tool (class B), not a test change.
- Found by reading and by a fault test in the review; no production run showed it yet.

## Work record

Not started.
