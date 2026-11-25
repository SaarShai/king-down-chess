# The iOS rules as tests

Status: needs-triage. Waits for the owner's approval of [the spec](../spec.md).

Class: B. Size: S. Needs decision 3 of the spec for the Apple switch.

## Problem

[IOS.md](../../../IOS.md) gives rules that no test in CI holds.

- **The app origin.** "Do not set `server.hostname`, `iosScheme` or a committed `server.url`": a new origin loses the local saves and the session. `tools/ios-app.test.ts` reads `capacitor.config.json` but checks only the colour and the link preview.
- **The lowest iOS.** `IPHONEOS_DEPLOYMENT_TARGET` (16.4) must equal the `build.target` of `vite.config.ts`. Commit 2093e22ec repaired a difference: the app stopped at the board load.
- **The host side of universal links.** `ios/store.test.ts` pins the AASA file and checks that its header route comes before the `filesystem` rule and that `join.html` sends to `/next.html#join=`. These checks need no Swift, but the file runs only with `npm run ios:check` on a Mac. A website change that breaks them breaks invite links for the installed build.
- **The two link lists.** No test compares the pattern of `ios/App/App/UniversalLink.swift:8` with the components of `public/.well-known/apple-app-site-association`.
- **The build shell.** `tools/ios-sync.sh` does not clear `KINGDOWN_TEST_PAGES` or `VITE_KINGDOWN_APPLE_SIGN_IN`. `tools/ios-release.sh` runs it in the caller's shell. A value there puts the test pages or the Apple sign-in into a store archive.

## Change

All tests go into `tools/ios-app.test.ts`: CI runs that file for a change under `ios/`.

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
