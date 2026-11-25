# Site links in the app

Status: done on branch seam-guards; waits for the review.

Class: B. Size: S. The sign-in sheet is part of the account flow, and the merge tool takes no lead read for these paths.

## Problem

- `src/interface/people/screens/sign-in.ts:72` sets `privacy.href = '/privacy.html'` and `terms.href = '/terms.html'`, with `target = '_blank'`.
- The app opens the new page, and its page origin is `capacitor://localhost`. [IOS.md](../../../IOS.md) says that a relative `target="_blank"` link opens nothing there.
- Commit ead375fa8 repaired the same fault on the old page and added no guard. The fault came back in 5db7875b7, which is in build 1.0 (8) and in version 1.1 (build 9).
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
- Before the build: confirm the fault in the simulator with the current build (a tap on Privacy in the sign-in sheet). If the link opens, this ticket keeps only its guard.

## Work record

- Change: `src/interface/people/screens/sign-in.ts` imports `apiOrigin` and sets the two links to `apiOrigin + '/privacy.html'` and `apiOrigin + '/terms.html'`. New test `tools/api-origin.test.ts` with the three scans of the non-test `.ts`, `.mjs`, `.js` and `.html` files of `src/`, and one case that fails when it reads 100 files or fewer. Scan 2 permits only the beacon line of `src/diagnostics/browser.ts` and fails when that line changes. `docs/IOS.md` names the test beside the `/api` rule, the `onlineClient` rule and the link rule.
- Red: `KINGDOWN_TEST_FILE=tools/api-origin.test.ts npm test`: 1 failed, 3 passed. Scan 1 found `src/interface/people/screens/sign-in.ts:72: /privacy.html` and `src/interface/people/screens/sign-in.ts:72: /terms.html`, and no other place. Scans 2 and 3 passed.
- Green: `KINGDOWN_TEST_FILE="{tools/api-origin.test.ts,src/interface/people/**/*.test.ts}" npm test`, with the type check: 16 files, 287 tests passed, 65 s of tests (1237 s in all with the wait for the machine lease).
- The website: no browser pass. On the website `apiOrigin` is `''`, so the two links have the same `href` at run time. The bundle is not byte-equal: the sheet has a new import.
- Not verified: the links in the simulator or on a device (the fault and the repair); a browser pass of the sign-in sheet.
