# Test that the home start registers the service worker only after the board is drawn

Status: ready-for-agent
Source: the change rehearsals and guard checks of 2026-11-25 ([ticket 10](10-change-rehearsals.md), [ticket 11](11-guards-that-cannot-fail.md), [ticket 12](12-lessons-and-checks.md))

## Problem
src/interface/platform.ts:47 registers /sw.js after the root has children and after the 'kingdown-interface-ready' event. No test holds this order. tools/offline-build.test.ts checks only the offline page. If a change moves register() above `await import('./play/main')`, the first-visit precache races the page downloads, and load measurements read about 4 times too fast.

## Change
Add a behaviour test in a new file, for example src/interface/platform-sw-order.test.ts (src/interface/platform.ts and src/interface/platform.test.ts are not protected; a new file keeps clear of other lanes). Stub navigator.serviceWorker.register with a spy. Mock './play/main' with a module that adds a child to the root only after a timer. Run the home start path. Expect no register call while the root is empty, and one call after the 'kingdown-interface-ready' event. Failure text: 'service worker registered before the board was drawn: keep register() after kingdown-interface-ready in src/interface/platform.ts'. No product change.

## Test that fails first
Fake: in a scratch copy, move the register line above `await import('./play/main')`. The new test must fail with the failure text. Revert, and the test passes.

## Known limits
The test does not prove the order on the offline page or in the iOS shell. It does not measure the real precache race in a browser.

## Work record
Not started. Not built on 2026-11-25 because the lane had a limit of 3 guards; the pool-net, hash-width and child-timeout guards had a higher cost of a miss.
