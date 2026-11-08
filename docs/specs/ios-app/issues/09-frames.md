# Choose how the store build gets character frames

Type: research
Status: resolved
Blocked by: 04
Parent: [iOS app map](../map.md)
Labels: wayfinder:research

## Question

Before App Store submission, how does the app get the 230 MB of character frames: bundle them, stream them from kingdown.dev through a native scheme handler with a disk cache, or use Apple Background Assets? How does a released app keep the frame hashes it names after later site deploys?

## Context

[Render and assets](../../../research/ios-app-2026-11-07/render-and-assets.md) measures the start set (about 18 MB without the parked Workshop art) and the first board (about 11 MB). Frames are content-addressed (`/character-runtime/assets/<sha256>.webp`). Code must stay in the bundle (App Review 2.5.2).

## Result

Answer (2026-11-08): bundle all character frames in the store build, as in the TestFlight build. Research: [Character frames in the store build](../../../research/ios-app-2026-11-07/frames.md).

- **Hash retention.** The app carries the frames that its own manifest names, so later site deploys cannot break it. The app asks kingdown.dev for no frame and no manifest. While the app bundles its frames, this is the whole rule.
- **Why not streaming or Apple-hosted packs now.** Each deploy deletes old frames from kingdown.dev: a frame that a 2026-11-05 commit removed answers 404. Streaming needs a retention step in the deploy, and a second scheme or a rebuilt web view configuration, because Capacitor 8 has no open hook that replaces its handler. Apple-hosted packs need iOS 26, a downloader extension, an App Group and an App Review for each pack version. All installed app versions also get the one live pack.
- **Cost.** The first download is about 255 MB (zip estimate), above the 200 MB over-the-air line. On cellular, the user can get a question. It is not a refusal. An update carries only the new frames and the manifest: at this week's rate, about 127 MB three days after a build.
- **Smallest change.** The web game and the animation pipeline stay as they are. The runtime asks for no frame while `navigator.onLine` is false, so the app shows plain figures offline. Make `connected()` at `src/render/painted/character-runtime.mjs:79` also return true in the app (exact line in the note, open item 1). This is animation code: coordinate it with the animation work, and test on an iPhone in Airplane Mode.
- **Clean-up.** Remove the `shortcut:` comment at `tools/ios-sync.sh:15`: bundling all of `dist/` is now the decision.
- **Examine again** when the download is more than about 500 MB, or when new art must reach players between app releases. Then use Apple-hosted packs if the floor can go to iOS 26. If not, use streaming. For that case, the note gives the retention rule: tag each App Store build, and let the deploy copy every frame that a tagged build names.
