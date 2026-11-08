# Choose how test builds get the game files

Type: grilling
Status: resolved
Blocked by: 01
Parent: [iOS app map](../map.md)
Labels: wayfinder:grilling

## Question

The build is about 260 MB, and 230 MB of it is character frames that load on demand. What goes into the test builds?

## Answer

All of `dist/` for TestFlight builds. Decided 2026-11-07.

- It needs no streaming code and has no version skew: each app build carries the frames its code names.
- The app is about 280 MB. This is acceptable for internal tests. It is too large for a good first download from the App Store, so [Choose how the store build gets character frames](09-frames.md) decides streaming before submission.
- `tools/ios-sync.sh` marks the limit with a `shortcut:` comment.
