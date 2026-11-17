# Build the iOS shell for the launch build

Status: ready-for-human
Type: task

## Scope

Build decision 39 in the separate iOS copy. Change only the shell: `ios/`, `capacitor.config.json`
and files outside `src/interface/play/` and `src/interface/ui/`. Do not sign, archive or upload.

## Implementation

- `ios/App/App/SceneDelegate.swift`: `AppViewController` (router, swipe Back, debug start address) and `AppRouter`.
- `ios/App/App/Info.plist`: the orientations for iPhone and iPad, `UIUserInterfaceStyle` Light.
- `ios/App/App.xcodeproj/project.pbxproj`: device family iPhone and iPad.
- The three launch images: one colour, `#f7f5ed`.
- `capacitor.config.json`: `backgroundColor` `#f7f5ed`, `ios.allowsLinkPreview` false.
- `src/interface/platform.ts`: the empty app path is home. `src/interface/platform.css`: no ring on the message heading.
- Tests: `tools/ios-app.test.ts` and one case in `src/interface/platform.test.ts`. Ten mutation proofs fail.

## Verification

The report in the project folder (`parallel/ios/run/report.md`) records the builds, the simulator
screenshots, the browser run, the needs and the App Store list.
