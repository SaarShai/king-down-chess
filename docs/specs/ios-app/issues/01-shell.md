# Choose the iOS shell

Type: research
Status: resolved
Blocked by: none
Parent: [iOS app map](../map.md)
Labels: wayfinder:research

## Question

Which shell carries the web game to iOS so that the coming UI/UX redesign is built once, for the site and the app?

## Answer

Capacitor 8.6.0 (2026-10-28), created with Swift Package Manager, serving the bundled build (`dist/`) from `capacitor://localhost`. Decided 2026-11-07 under the owner's standing rule (agents decide and report).

- It ships the existing page with no rewrite; the redesign happens once, in web code.
- It adds three npm packages (`@capacitor/core`, `@capacitor/ios`, `@capacitor/cli`) and one Swift package; no CocoaPods, no Rust.
- A bundled build meets App Review 4.2 (not a repackaged website) and 2.5.2 (no downloaded code), and it plays offline against the computer.
- Rejected: Tauri 2 (Rust and CocoaPods, fewer iOS plugins), a hand-written WKWebView shell (we own the scheme handler and every native feature), a native SwiftUI or SpriteKit UI (every UI change twice).
- Capacitor 9 (beta) comes in through `npx cap migrate` at GA. Keep the generated native project close to the template so that the move stays cheap.

Evidence: [shell choice](../../../research/ios-app-2026-11-07/shell-choice.md); a clean simulator build with Xcode 27.2.
