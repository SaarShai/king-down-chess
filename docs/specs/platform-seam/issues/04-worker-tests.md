# The worker tests run on the worker that ships

Status: done on branch seam-guards; waits for the review.

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

## Work record

- `tools/service-worker.test.ts`: the groups "private safety during installation" and "public request boundary" run on `public/sw.js` and on `tools/solo-launch/sw.js` (`describe.each`). No worker line changes.
- Not as the ticket says: the parametrization alone does not give the red line. A path that is not on the allowlist gets no cache key, also when the private list does not match it, so the two groups did not read the private list. The bypass case and the forbidden-key case now put their private paths on the allowlist (`listed`). Only the private list of the worker keeps them out.
- Two differences of the launch worker on purpose, each named in its case: a navigation to an online page (`/play…`, `/g/<id>`, `/j`) goes to the network with the offline page as the fallback; `index.html` is the old page with a key of its own, so the install-shell case runs on `/` only for that worker.
- Green: `KINGDOWN_TEST_FILE=tools/service-worker.test.ts npm test`, with the type check: 228 tests passed, 0.5 s of tests (86 s in all).
- Red: `mcp` removed from `PRIVATE` in `tools/solo-launch/sw.js` only, `KINGDOWN_TEST_NO_TYPECHECK=1 KINGDOWN_TEST_FILE=tools/service-worker.test.ts npm test`: 2 failed, 226 passed: "public request boundary (tools/solo-launch/sw.js) > bypasses /mcp" and "… /mcp/child".
- Probe: the same removal with no private path on the allowlist: 228 passed. This shows that the allowlist step is necessary.
- The worker file is back to its committed text (`git diff` shows only the test file).
