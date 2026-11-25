# The worker tests run on the worker that ships

Status: needs-triage. Waits for the owner's approval of [the spec](../spec.md).

Class: B (tests only). Size: S.

## Problem

- Each shipped form uses the launch worker, `tools/solo-launch/sw.js` (`vite.config.ts:102`).
- The test groups for the private paths and the public request boundary load only `public/sw.js` (`tools/service-worker.test.ts:11`), with their own copy of the private list.
- The private list is a copy by hand in the two workers (`public/sw.js:22`, `tools/solo-launch/sw.js:24`). The three worker commits after the fork (f396bdcba, 4bc5e7d94, 749459938) each edited both files by hand.

## Change

The two groups run on both workers. Where the launch worker differs on purpose, the case names the difference. No worker line changes.

## Test that fails first

Remove one private path from `tools/solo-launch/sw.js` only. The tests are green today; after the change they are red.

## Known limits

If [ticket 07](07-remove-off-build.md) comes first, this ticket is not necessary: one worker stays, and the tests point at it.
