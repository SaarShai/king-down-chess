# iOS app map

Type: map
Status: open
Labels: wayfinder:map

## Destination

An internal TestFlight build of King Down on the owner's iPhone, built from this repo with one command, on a foundation that the coming UI/UX redesign builds on: one web codebase for the site and the app, online play through the same `/api`, and every decision that the first App Store submission needs written in this map. The map ends when [Approve the iOS foundation](issues/12-approve.md) is resolved.

## Notes

- Owner request, 2026-11-07: "begin preparations for creating an iOS app for king down. i have a developer account. set up whatever you can based on what we already have, and keeping everything as lean as possible. ... note that the UI/UX will have significant changes. focus on a robust codebase and framework to work with." So this map carries execution: its first session built the foundation on branch `ios-app` and settled the decisions that the foundation needed. Later sessions resolve one ticket each.
- Skills for each session: wayfinder (this map), ponytail (the smallest complete change), codebase-design (seams and the core interface), research (research tickets), prototype (UI questions). Write in ASD-STE100.
- Build, run and release: [docs/IOS.md](../../IOS.md). Research reports: [docs/research/ios-app-2026-11-07](../../research/ios-app-2026-11-07/).
- Agents decide and report under the owner's standing rule. Deploys (staging and live), App Store Connect steps that need the owner's login, and spending still need his word.
- Ticket lines: `Type:`, `Status:` (`open`, `claimed`, `resolved`) and `Blocked by:`. The frontier is the open, unclaimed tickets whose blockers are all resolved; scan `issues/` by number.

## Decisions so far

- [Choose the iOS shell](issues/01-shell.md): Capacitor 8.6.0 with SPM and the bundled build at `capacitor://localhost`; Capacitor 9 at GA.
- [Choose how the app reaches /api](issues/02-api-origin.md): exact-origin CORS for `capacitor://localhost` and `apiOrigin` in `src/platform.ts`; the bearer token stays the control; the app origin never changes.
- [Choose the sign-in methods in the app](issues/03-sign-in.md): email code only; Google and GitHub later with `ASWebAuthenticationSession` and Sign in with Apple.
- [Choose how test builds get the game files](issues/04-assets.md): all of `dist/` (about 280 MB) for TestFlight.
- [Choose the app identity, devices and orientation](issues/05-identity.md): `dev.kingdown.app`, King Down, iPhone only, portrait, iOS 16.4, HTTPS-only encryption answer. A static scan of the TestFlight bundle finds nothing that breaks on iOS 16.4 ([iOS 16.4 check](../../research/ios-app-2026-11-08/ios-16-4-compat.md)).
- [Check the game in WKWebView](issues/06-webview-probe.md): no service worker, the cache gate passes, local play and the computer work in the simulator.
- [Deploy the app origin to staging and play online in the app](issues/07-staging-online.md): online play passes in the app against staging (invite, moves both ways, a 2-minute background return, resignation); the invite link is the site's `/j` link.
- [Choose how the store build gets character frames](issues/09-frames.md): bundle all frames, as for TestFlight; the app never asks the site for a frame, so deploys cannot break a released app; one offline line in the runtime is open ([ticket 14](issues/14-offline-frames.md)).
- [Write the privacy manifest and the store answers](issues/11-privacy.md): `PrivacyInfo.xcprivacy` with six linked, non-tracking types; the answers are in [store-answers.md](store-answers.md) (13+, export NO); the owner enters them.

## Not yet specified

- **The core interface for the new UI.** The redesign needs a headless local match module taken out of `src/screen/play.ts` (state, play, undo, resign, new game, computer move, subscribe), with the current UI as its first adapter ([core seams](../../research/ios-app-2026-11-07/core-seams.md)). Its exact interface waits for the redesign's screen list.
- **Native touches.** Haptics, share sheets, push turn alerts (APNs and a server sender) and Game Center lower the App Review 4.2 risk. Which ones depend on the redesign.
- **Universal links.** Invite (`/j#<key>`) and game (`/g/<id>`) links can open the app. This needs the association file on kingdown.dev (the parked-plugin build deletes `.well-known` today) and the Associated Domains entitlement, and it depends on the redesign's invite flow.
- **Google, GitHub and Sign in with Apple** in the app, after the review sign-in path is chosen.
- **Touch and layout polish** (touch-action, the long-press menu, hover-only rules, 16 px selects and text fields, safe areas in landscape; iOS zooms the page when a smaller field gets focus, seen on the staging test-account form): the redesign may replace the screens first.
- **Web storage on iOS.** [Research, 2026-11-08](../../research/ios-app-2026-11-08/web-storage.md): WebKit deletes it only in rare cases (ITP after 30 app-start days with no tap, quota eviction above 20 % of the disk, a backup restore in the first 24 hours). Keep web storage for now; with the redesign, mirror the save keys to `@capacitor/preferences` and keep the session in the Keychain. A device test must still show that a save and the sign-in survive a force quit, an update and an offload.
- **An iOS build check in CI.** A macOS runner costs more minutes; decide when the app changes often.

## Out of scope

- The UI/UX redesign itself: its own effort, built on this foundation.
- Android, in-app purchases, ads and a native (SwiftUI or SpriteKit) UI.
- Parked features ([docs/PARKED.md](../../PARKED.md)).
