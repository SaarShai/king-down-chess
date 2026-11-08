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
- [Choose the app identity, devices and orientation](issues/05-identity.md): `dev.kingdown.app`, King Down, iPhone only, portrait, iOS 15, HTTPS-only encryption answer.
- [Check the game in WKWebView](issues/06-webview-probe.md): no service worker, the cache gate passes, local play and the computer work in the simulator.
- [Choose how the store build gets character frames](issues/09-frames.md): bundle all frames, as for TestFlight; the app never asks the site for a frame, so deploys cannot break a released app; one offline line in the runtime is open ([ticket 14](issues/14-offline-frames.md)).
- [Write the privacy manifest and the store answers](issues/11-privacy.md): `PrivacyInfo.xcprivacy` with six linked, non-tracking types; the answers are in [store-answers.md](store-answers.md) (13+, export NO); the owner enters them.

## Not yet specified

- **The core interface for the new UI.** The redesign needs a headless local match module taken out of `src/screen/play.ts` (state, play, undo, resign, new game, computer move, subscribe), with the current UI as its first adapter ([core seams](../../research/ios-app-2026-11-07/core-seams.md)). Its exact interface waits for the redesign's screen list.
- **Native touches.** Haptics, share sheets, push turn alerts (APNs and a server sender) and Game Center lower the App Review 4.2 risk. Which ones depend on the redesign.
- **Universal links.** Invite (`/j#<key>`) and game (`/g/<id>`) links can open the app. This needs the association file on kingdown.dev (the parked-plugin build deletes `.well-known` today) and the Associated Domains entitlement, and it depends on the redesign's invite flow.
- **Google, GitHub and Sign in with Apple** in the app, after the review sign-in path is chosen.
- **Touch and layout polish** (touch-action, the long-press menu, hover-only rules, 16 px selects, safe areas in landscape): the redesign may replace the screens first.
- **Web storage on iOS.** Whether iOS can clear the app's localStorage (the session and the local saves) needs a device test; native storage is the fallback.
- **An iOS build check in CI.** A macOS runner costs more minutes; decide when the app changes often.

## Out of scope

- The UI/UX redesign itself: its own effort, built on this foundation.
- Android, in-app purchases, ads and a native (SwiftUI or SpriteKit) UI.
- Parked features ([docs/PARKED.md](../../PARKED.md)).
