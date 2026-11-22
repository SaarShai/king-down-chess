# iOS app

The iOS app is a Capacitor shell around the same web build as kingdown.dev. Decisions and open work: [the iOS app map](specs/ios-app/map.md).

## Build and run

1. `npm run ios:sync` builds the web game with the staging account settings and copies it into `ios/App/App/public` (ignored by Git). `npm run ios:sync production` uses the production settings and kingdown.dev. The script always sets `KINGDOWN_SOLO_LAUNCH=1` (the launch switch of [the launch platform](specs/interface-platform/spec.md)), so the app opens the new page whatever the website's cutover state is.
2. Run it in the simulator: `npx cap run ios --target <simulator id>` (list ids with `xcrun simctl list devices available`), or open Xcode with `npx cap open ios`.
3. Inspect the page: debug builds are inspectable in Safari > Develop > Simulator. The native log with the page's console: `xcrun simctl launch --console-pty booted dev.kingdown.app`.

`npm run ios:check` runs the store and link checks (`ios/store.test.ts`, macOS only; CI does not run it) before an upload.

A check build with no signing: `xcodebuild -project ios/App/App.xcodeproj -scheme App -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build`. A debug build opens one start address from a launch argument: `xcrun simctl launch booted dev.kingdown.app -KingDownStart /support.html`.

The new page has one Apple sign-in switch: `VITE_KINGDOWN_APPLE_SIGN_IN=1`. It is off by default.
The local `AppleSignInPlugin` uses AuthenticationServices and the installed Capacitor bridge. It adds no package.
The app uses the native sheet; the website uses the existing PKCE flow. Other social providers stay hidden in the app.
Keep this switch off until the owner sets up Apple and Supabase, adds the Sign in with Apple capability, and verifies server token revocation on account deletion.
The current deletion job has no Apple token exchange or revocation record. The guarded sign-in path does not close that release gate.

## TestFlight upload

The owner's Xcode account signs (team `6M9C2YSWT4`, automatic signing). An upload to the internal group "Owner" is an agent step of [ticket 08](specs/ios-app/issues/08-testflight.md), which the owner started; external testing and App Review submission need the owner's word (AGENTS.md). Each upload needs a build number higher than the last one in App Store Connect: raise `CURRENT_PROJECT_VERSION` in `ios/App/App.xcodeproj/project.pbxproj` (both configurations) in the change that ships. Build 1.0 (1) is the first.

```bash
npm run ios:sync production
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release -destination 'generic/platform=iOS' -archivePath "$TMPDIR/App.xcarchive" -allowProvisioningUpdates archive
xcodebuild -exportArchive -archivePath "$TMPDIR/App.xcarchive" -exportOptionsPlist ios/ExportOptions.plist -exportPath "$TMPDIR/upload" -allowProvisioningUpdates
```

`ios/ExportOptions.plist` uploads to App Store Connect and keeps the build number from the project. App Store Connect then processes the build for TestFlight (minutes to an hour) and sends an email if it finds a fault.

## Rules the code depends on

- The app routes a page path as the site does (`AppRouter` in `ios/App/App/SceneDelegate.swift`): with the launch marker `solo-launch.json` in the bundle, `/` and an unknown path load `next.html`, and `/play`, `/g/<id>` and `/j` load `index.html`; without it, every page path loads `index.html` (the Capacitor template). A change to the host routes in `tools/plugin-server-build.mjs` changes the router too; `tools/ios-app.test.ts` compares them. The start address `capacitor://localhost` has an empty path, so page code reads `''` as `/`.
- With the launch marker, a native invite opens `/next.html#join=<token>` before the web view loads it. The token stays in the fragment. Without the marker, it opens `/j#<token>`. Both old app deletion controls open You on the new page; the web control stays the same.
- The web view has the swipe from the edge as the browser Back, as Safari has: the new page and the old online pages use history for Back.
- The page origin is `capacitor://localhost`, and it never changes: a new scheme or host gives the app a new web storage area, so the local saves and the session are lost. Do not set `server.hostname`, `iosScheme` or a committed `server.url` in `capacitor.config.json`.
- `src/platform.ts` is the one seam between the website and the app: `inApp` for app-only behavior, `apiOrigin` for `/api` calls. A new `/api` call uses `apiOrigin`.
- The server allows exactly one other origin, `APP_ORIGIN` in `src/api/http.ts`. A server change that touches the origin checks keeps the app tests in `src/api/http.test.ts` green.
- A released app keeps calling the live `/api` while it waits in review and on old phones, so `/api` changes stay backward compatible.
- Keep the generated native project close to the Capacitor template: the Capacitor 9 move uses `npx cap migrate`. The settings changed by hand are the team, the device family (iPhone and iPad), the orientation (iPhone upright and on the side, iPad all four), the light style (`UIUserInterfaceStyle`), `ITSAppUsesNonExemptEncryption` and `UIRequiredDeviceCapabilities` (arm64) in `Info.plist`, `PrivacyInfo.xcprivacy` in the app target's resources, the deployment target, and `AppViewController` in `SceneDelegate.swift`. The launch image and `backgroundColor` in `capacitor.config.json` have the page colour of the new page (`--paper-50`); `ios.allowsLinkPreview` is off.
- The app's lowest iOS (`IPHONEOS_DEPLOYMENT_TARGET`, 16.4) is the web build's `build.target` in `vite.config.ts`. Change both together, then run `npm run ios:sync`: it writes `CapApp-SPM/Package.swift` again from the project.
- A change to what the app or `/api` collects updates `ios/App/App/PrivacyInfo.xcprivacy` and [the store answers](specs/ios-app/store-answers.md) in the same change.
- A link from the app to a site page uses `apiOrigin` + the path. In the app (page `capacitor://localhost`), a relative `target="_blank"` link opens nothing, and a relative same-tab link opens the bundled copy in the game's web view with no way back.
- The app icon comes from `PLAYABLE_BROWSER=chromium node docs/perf/make-icons.mjs` (opaque PNG; App Store Connect refuses alpha).
