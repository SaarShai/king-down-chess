# iOS app

The iOS app is a Capacitor shell around the same web build as kingdown.dev. Decisions and open work: [the iOS app map](specs/ios-app/map.md).

## Build and run

1. `npm run ios:sync` builds the web game with the staging account settings and copies it into `ios/App/App/public` (ignored by Git). `npm run ios:sync production` uses the production settings and kingdown.dev.
2. Run it in the simulator: `npx cap run ios --target <simulator id>` (list ids with `xcrun simctl list devices available`), or open Xcode with `npx cap open ios`.
3. Inspect the page: debug builds are inspectable in Safari > Develop > Simulator. The native log with the page's console: `xcrun simctl launch --console-pty booted dev.kingdown.app`.

A check build with no signing: `xcodebuild -project ios/App/App.xcodeproj -scheme App -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build`.

## TestFlight upload

The owner's Xcode account signs (team `6M9C2YSWT4`, automatic signing). Each upload needs a build number higher than the last one in App Store Connect: raise `CURRENT_PROJECT_VERSION` in `ios/App/App.xcodeproj/project.pbxproj` (both configurations) in the change that ships. Build 1.0 (1) is the first.

```bash
npm run ios:sync production
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release -destination 'generic/platform=iOS' -archivePath "$TMPDIR/App.xcarchive" -allowProvisioningUpdates archive
xcodebuild -exportArchive -archivePath "$TMPDIR/App.xcarchive" -exportOptionsPlist ios/ExportOptions.plist -exportPath "$TMPDIR/upload" -allowProvisioningUpdates
```

`ios/ExportOptions.plist` uploads to App Store Connect and keeps the build number from the project. App Store Connect then processes the build for TestFlight (minutes to an hour) and sends an email if it finds a fault.

## Rules the code depends on

- The page origin is `capacitor://localhost`, and it never changes: a new scheme or host gives the app a new web storage area, so the local saves and the session are lost. Do not set `server.hostname`, `iosScheme` or a committed `server.url` in `capacitor.config.json`.
- `src/platform.ts` is the one seam between the website and the app: `inApp` for app-only behavior, `apiOrigin` for `/api` calls. A new `/api` call uses `apiOrigin`.
- The server allows exactly one other origin, `APP_ORIGIN` in `src/api/http.ts`. A server change that touches the origin checks keeps the app tests in `src/api/http.test.ts` green.
- A released app keeps calling the live `/api` while it waits in review and on old phones, so `/api` changes stay backward compatible.
- Keep the generated native project close to the Capacitor template: the Capacitor 9 move uses `npx cap migrate`. The settings changed by hand are the team, the device family (iPhone), the orientation (portrait), `ITSAppUsesNonExemptEncryption` in `Info.plist`, `PrivacyInfo.xcprivacy` in the app target's resources and the deployment target.
- The app's lowest iOS (`IPHONEOS_DEPLOYMENT_TARGET`, 16.4) is the web build's `build.target` in `vite.config.ts`. Change both together, then run `npm run ios:sync`: it writes `CapApp-SPM/Package.swift` again from the project.
- A change to what the app or `/api` collects updates `ios/App/App/PrivacyInfo.xcprivacy` and [the store answers](specs/ios-app/store-answers.md) in the same change.
- A link from the app to a site page uses `apiOrigin` + the path. In the app (page `capacitor://localhost`), a relative `target="_blank"` link opens nothing, and a relative same-tab link opens the bundled copy in the game's web view with no way back.
- The app icon comes from `PLAYABLE_BROWSER=chromium node docs/perf/make-icons.mjs` (opaque PNG; App Store Connect refuses alpha).
