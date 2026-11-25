# The iOS rules as tests

Status: done on branch seam-guards; the review repairs are in; waits for the repair check.

Class: B. Size: S. Needs decision 3 of the spec for the Apple switch.

## Problem

[IOS.md](../../../IOS.md) gives rules that no test in CI holds.

- **The app origin.** "Do not set `server.hostname`, `iosScheme` or a committed `server.url`": a new origin loses the local saves and the session. `tools/ios-app.test.ts` reads `capacitor.config.json` but checks only the colour and the link preview.
- **The lowest iOS.** `IPHONEOS_DEPLOYMENT_TARGET` (16.4) must equal the `build.target` of `vite.config.ts`. Commit 2093e22ec repaired a difference: the app stopped at the board load.
- **The host side of universal links.** `ios/store.test.ts` pins the AASA file and checks that its header route comes before the `filesystem` rule and that `join.html` sends to `/next.html#join=`. These checks need no Swift, but the file runs only with `npm run ios:check` on a Mac. A website change that breaks them breaks invite links for the installed build.
- **The two link lists.** No test compares the pattern of `ios/App/App/UniversalLink.swift:8` with the components of `public/.well-known/apple-app-site-association`.
- **The build shell.** `tools/ios-sync.sh` does not clear `KINGDOWN_TEST_PAGES` or `VITE_KINGDOWN_APPLE_SIGN_IN`. `tools/ios-release.sh` runs it in the caller's shell. A value there puts the test pages or the Apple sign-in into a store archive.

## Change

All tests go into `tools/ios-app.test.ts`, except the check that builds the server: CI runs that file for a change under `ios/`.

- `capacitor.config.json` has no `server.hostname`, `server.iosScheme` or `server.url`, and no `capacitor.config.ts` or `.js` exists.
- `vite.config.ts` exports its build target. Each `IPHONEOS_DEPLOYMENT_TARGET` of `project.pbxproj` equals its `ios` and `safari` version.
- The two host-side checks move from `ios/store.test.ts`, which keeps the checks that compile Swift. The AASA pin is now in a test that also calls `plutil` (`store.test.ts:26`), so that test splits. The check of the route order and of `join.html` (`store.test.ts:61`) builds the plugin server, with a limit of 120 s. Put it where a server build already runs (`tools/plugin-server-build.test.ts`), so that `ios-app.test.ts` stays fast.
- A new test reads the pattern of `UniversalLink.swift` and the AASA file as JSON. On a named list of paths: each path that the pattern accepts matches a component, each component matches a path that the pattern accepts, and the host sends each accepted path to a page, not to the 404.
- `tools/ios-sync.sh` sets `KINGDOWN_TEST_PAGES` off for each stage, and `VITE_KINGDOWN_APPLE_SIGN_IN` off for the production stage (decision 3). The new lines go before `export KINGDOWN_SOLO_LAUNCH=1`: the existing test wants that export as the last line before the build (`ios-app.test.ts:34`). That test also checks the new lines.

## Test that fails first

The test of the build shell: `ios-sync.sh` has no such line today. The origin test and the target test pass today and fail on the change that they guard.

## Known limits

- The AASA test converts the components of today to patterns. Apple has more match rules.
- The checks that compile Swift stay on the Mac.
- With the Apple switch pinned for production, the Apple release changes the pin on purpose. The test names the line. A staging build still takes the switch from the shell.
- For the lead: record where and when the owner approved the spec and decision 3, then change the Status line of `spec.md` and the TASKS.md row. A branch does not edit TASKS.md.

## Work record

- Decision 3: yes. The spec holds only the author's pick ("My pick: yes", `spec.md`, decision 3). The lane brief says that the owner approved the spec with the four picks. No file on this branch records that approval: the Status line of `spec.md` says "needs-triage", and the TASKS.md row of the four decisions says needs-info.
- `tools/ios-sync.sh`: the production arm exports `VITE_KINGDOWN_APPLE_SIGN_IN=0`; after `esac`, `unset KINGDOWN_TEST_PAGES`. The Apple switch takes the value 0, not `unset`, because a Vite `.env` file can set a `VITE_` value and a shell value overrides it. The build reads only `KINGDOWN_TEST_PAGES === '1'` from the shell, so `unset` is enough there (as `tools/release/live.sh` does).
- `vite.config.ts` exports `buildTarget`, and `build.target` uses it.
- `tools/ios-app.test.ts`: the build-shell test checks the two new lines, and that the staging arm has no Apple line. New tests: the Capacitor origin, the lowest iOS (each `IPHONEOS_DEPLOYMENT_TARGET` equals the `ios` and the `safari` version of `buildTarget`), the AASA pin, and the link test (Swift pattern, AASA components, host routes of a launch tree).
- `ios/store.test.ts`: the AASA pin and the server-build check move out. The `plutil` test keeps the entitlement check. `tools/plugin-server-build.test.ts` gets the server-build check, with `mkdtempSync` folders.
- `docs/IOS.md` names the tests beside the rules.
- Red: `KINGDOWN_TEST_FILE="tools/{ios-app,plugin-server-build}.test.ts" npm test`: 1 failed, 19 passed. The failure: "builds the app with the new page whatever the website cutover is", the Apple line of the production arm is missing (received `[]`). The origin, target, AASA and link tests passed.
- Green: `KINGDOWN_TEST_FILE="tools/{ios-app,plugin-server-build,offline-build,dev-settings}.test.ts" npm test`, with the type check: 4 files, 91 tests passed, 4.6 s of tests (126 s in all). `offline-build` and `dev-settings` load `vite.config.ts`.
- Probe (temporary edits, not committed, all files restored from HEAD): `server.hostname` in `capacitor.config.json`, `ios17.0` in `buildTarget`, no `unset KINGDOWN_TEST_PAGES` line in `tools/ios-sync.sh`, and a fifth component `/x/*` in the AASA file. `KINGDOWN_TEST_NO_TYPECHECK=1 KINGDOWN_TEST_FILE="tools/{plugin-server-build,ios-app}.test.ts" npm test`: each guard is red. The build-shell test: `expected [ '', 'esac', …(6) ] to include 'unset KINGDOWN_TEST_PAGES'`. The origin test: `hostname: expected 'app.test' to be undefined`. The target test: `ios: … IPHONEOS_DEPLOYMENT_TARGET = 17.0` expected, `16.4` received. The AASA pin: the extra component. The link test: `^\/x\/.*$: expected false to be true`.
- `bash -n tools/ios-sync.sh`: no syntax fault. `src/account/apple.ts` turns the Apple sign-in on only for the value `'1'`, so the value `0` keeps it off.
- Final run on head f68ec5c9a (all four tickets): `npm run test:changed`, with the type checks. It ran the full suite: 430 files, 411 passed and 19 skipped; 8119 tests passed and 387 skipped; the node tests 115 passed; 610 s of tests (622 s in all). An earlier run on this head had no home folder and could not stop Chromium, so it is void.
- The link test does not test the converse (each path that a component matches is accepted by the Swift pattern): `/g/*` is wider than the UUID pattern of the app.
- Not verified: `ios/store.test.ts` after the edit (it runs only with `npm run ios:check`, which this lane does not run); `npm run ios:sync` with the new lines.
- "With the type check" means that the command did not set `KINGDOWN_TEST_NO_TYPECHECK`. No log shows a type-check line, because `tsc --noEmit` writes nothing when it passes (`tools/test-unlocked.sh:12-13`). The elapsed times agree with a type check.

## Review

- Kind: a review by an agent that did not build the change. Head: `82780d5f5a15bc40e8cf4d55ef05d7b5c233f942`.
- Findings: no blocking finding. For this ticket, two notes: the work record gave "the owner's pick in the spec" as the source of decision 3, but the spec holds only the author's pick and says that the owner has not approved; the logs of the green runs show no type-check line.
- One batch repairs them. The record now names the lane brief as the source, and says that no file records the approval. "Known limits" gives the lead the open step: record the approval, then change the Status line of `spec.md` and the TASKS.md row. The record says what "with the type check" means. No code of this ticket changes.
