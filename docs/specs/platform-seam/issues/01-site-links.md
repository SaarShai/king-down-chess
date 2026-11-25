# Site links in the app

Status: needs-triage. Waits for the owner's approval of [the spec](../spec.md).

Class: B. Size: S. The sign-in sheet is part of the account flow, and the merge tool takes no lead read for these paths.

## Problem

- `src/interface/people/screens/sign-in.ts:72` sets `privacy.href = '/privacy.html'` and `terms.href = '/terms.html'`, with `target = '_blank'`.
- The app opens the new page, and its page origin is `capacitor://localhost`. [IOS.md](../../../IOS.md) says that a relative `target="_blank"` link opens nothing there.
- Commit ead375fa8 repaired the same fault on the old page and added no guard. The fault came back in 5db7875b7, which is in build 1.0 (8).
- Two more rules of IOS.md have no guard: an `/api` call uses `apiOrigin`, and each `onlineClient` gets `origin: apiOrigin` (5 call sites pass it by hand).

## Change

- `sign-in.ts:72`: `privacy.href = apiOrigin + '/privacy.html'; terms.href = apiOrigin + '/terms.html';`. On the website `apiOrigin` is `''`, so the web output does not change.
- A new test file in `tools/` with three narrow scans of the non-test files of `src/`. Each scan names the rule that it guards and fails when it finds nothing to scan.
  1. No `href` gets a literal that starts with `/` and ends in `.html`, except `next.html` and `index.html` (pages in the bundle).
  2. No `fetch(` or `sendBeacon(` call has a literal first argument that starts with `/api`. The scan also matches the optional call `sendBeacon?.(`. One line is permitted: the beacon behind `if (!apiOrigin)` in `src/diagnostics/browser.ts:34`.
  3. Each `onlineClient({` call has `origin: apiOrigin`, and there is at least one call. The definition at `src/online/client.ts:33` is not a call.
- IOS.md names the test beside each of the three rules.

## Test that fails first

Scan 1 is red at `sign-in.ts:72` and at no other place.

## Checks

- The new test, then `npm run test:changed`.
- A browser pass of the sign-in sheet on the website: the two links open as before.
- At the next iOS build: a tap on Privacy and on Terms in the simulator.

## Known limits

- A link that the code builds from parts passes the scan.
- The repair reaches the app only with a new build and App Review (decision 2 of the spec).
