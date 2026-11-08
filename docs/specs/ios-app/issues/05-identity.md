# Choose the app identity, devices and orientation

Type: grilling
Status: resolved
Blocked by: none
Parent: [iOS app map](../map.md)
Labels: wayfinder:grilling

## Question

What are the bundle ID, the name, the devices, the orientation and the minimum iOS version?

## Answer

Decided 2026-11-07:

- Bundle ID `dev.kingdown.app` (the reverse of kingdown.dev). It is permanent once the App Store record exists.
- Name "King Down". Team `6M9C2YSWT4`.
- iPhone only, portrait only. iPad support can come later; App Store Connect does not let an app drop iPad support after a release, so we start without it. Landscape needs left and right safe-area padding that the current layout lacks.
- Minimum iOS 16.4, the target of the web build (Vite 8's default, pinned in `vite.config.ts`). The game code uses a RegExp lookbehind (`src/read.ts:216`), which WebKit has from iOS 16.4: on an older iOS the game cannot start. The first choice, 15.0 (the Capacitor 8 default), changed on 2026-11-08 after the readiness check of the first archive.
- `ITSAppUsesNonExemptEncryption` is NO: the app uses only HTTPS.
- The app icon is the painted-king icon at 1024 px with no alpha (`docs/perf/make-icons.mjs`); the launch screen is plain parchment. Both are placeholders for the redesign.
