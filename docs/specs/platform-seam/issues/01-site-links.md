# Site links in the app

Status: done on branch seam-guards; the review repairs are in; waits for the repair check.

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
- Scan 1 finds a literal after `href =`, `href:` and an `href="…"` attribute. A literal in `setAttribute('href', …)` passes it.
- The repair reaches the app only with a new build and App Review (decision 2 of the spec).
- Before the build: confirm the fault in the simulator with the current build (a tap on Privacy in the sign-in sheet). If the link opens, this ticket keeps only its guard.

## Work record

- Change: `src/interface/people/screens/sign-in.ts` imports `apiOrigin` and sets the two links to `apiOrigin + '/privacy.html'` and `apiOrigin + '/terms.html'`. New test `tools/api-origin.test.ts` with the three scans of the non-test `.ts`, `.mjs`, `.js` and `.html` files of `src/`, and one case that fails when it reads 100 files or fewer. Each scan also fails alone when it finds nothing to scan: scan 1 needs at least one `href` line (added by the review batch), scan 2 needs the beacon line, and scan 3 needs at least one call. Scan 2 permits only the beacon line of `src/diagnostics/browser.ts` and fails when that line changes. `docs/IOS.md` names the test beside the `/api` rule, the `onlineClient` rule and the link rule.
- Red: `KINGDOWN_TEST_FILE=tools/api-origin.test.ts npm test`: 1 failed, 3 passed. Scan 1 found `src/interface/people/screens/sign-in.ts:72: /privacy.html` and `src/interface/people/screens/sign-in.ts:72: /terms.html`, and no other place. Scans 2 and 3 passed.
- Green: `KINGDOWN_TEST_FILE="{tools/api-origin.test.ts,src/interface/people/**/*.test.ts}" npm test`, with the type check: 16 files, 287 tests passed, 65 s of tests (1237 s in all with the wait for the machine lease).
- The website: no browser pass. On the website `apiOrigin` is `''` (`src/platform.ts`), so the two links have the same `href` at run time: the DOM output is equal by construction. The bundle is not byte-equal: the sheet has a new import.
- Selection: `tools/lib/test-select.mjs` selects `tools/api-origin.test.ts` for a change of `sign-in.ts`, `src/diagnostics/browser.ts` or `src/online/client.ts` (probe of 2026-11-25).
- Final run on head f68ec5c9a (all four tickets): `npm run test:changed`, with the type checks. It ran the full suite, because `docs/IOS.md` is outside `src/` and `tools/`: 430 files, 411 passed and 19 skipped; 8119 tests passed and 387 skipped; the node tests 115 passed; 610 s of tests (622 s in all). An earlier run on this head ended with 45 failed files. That run had no home folder (`uv_os_homedir` ENOENT) and could not stop Chromium (`kill EPERM`), so it is void.
- `npm run test:docs` runs after this record is committed; the lane report holds its result.
- Not verified: the links in the simulator or on a device (the fault and the repair); a browser pass of the sign-in sheet.
- Review batch: scan 1 also reads an object property (`href\s*[=:]` at `tools/api-origin.test.ts:18`) and fails alone when it finds no `href` line (`tools/api-origin.test.ts:16`). Red of the new `:` arm, from the probe of the review batch (temporary edits, not committed, files restored from HEAD; log `probe-review.log`): `href: '/privacy.html'` in `aboutLinks` (`src/interface/play/menus.ts:33`), `KINGDOWN_TEST_NO_TYPECHECK=1 KINGDOWN_TEST_FILE="tools/{api-origin,ios-app,service-worker,platform}.test.ts" npm test` (four more mutations of tickets 02 and 04 in the same run): 10 failed, 253 passed. Scan 1 found `src/interface/play/menus.ts:33: /privacy.html`; the count line passed. The count line has no red run: by a read of the code, an empty file set gives 0 hits, and the line fails. Green: `KINGDOWN_TEST_FILE=tools/api-origin.test.ts npm test`, with the type check: 1 file, 4 tests passed, 0.3 s of tests (704 s in all with the wait for the machine lease; log `review-01-green.log`).
- "With the type check" means that the command did not set `KINGDOWN_TEST_NO_TYPECHECK`. No log shows a type-check line, because `tsc --noEmit` writes nothing when it passes (`tools/test-unlocked.sh:12-13`). The runs of this ticket waited for the machine lease, so their elapsed times do not show the type check.

## Review

- Kind: a review by an agent that did not build the change. Head: `82780d5f5a15bc40e8cf4d55ef05d7b5c233f942`.
- Findings: no blocking finding. For this ticket, three notes: scan 1 found only `href = '…'` and not the property form `href: '…'`; scan 1 alone passed on an empty file set; the logs of the green runs show no type-check line.
- One batch repairs them. Scan 1 accepts `=` or `:` after `href` and has its own count line; a probe run gives the red line of the new form. The record says what "with the type check" means.
