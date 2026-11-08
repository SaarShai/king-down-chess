# Character frames in the store build

Date: 2026-11-08. Worktree `ios-app`, detached at origin/main `d49875e8a`. Read only: no build, no deploy. The sizes come from the `dist/` and `ios/App/App/public` of a build made on 2026-11-08 01:02 (byte sums, decimal units). All web pages were read on 2026-11-08. **Fact** is what a source or a measurement says. **Inference** is this note's reading of it. Test an inference before you rely on it.

## Question

Before App Store submission, how does the app get the character frames (`/character-runtime/assets/<sha256>.webp`)? The options are: bundle them, stream them from kingdown.dev through a native scheme handler with a disk cache, or use Apple-hosted Background Assets. And how does a released app keep the frame hashes that it names after later site deploys?

## Answer first

- **Bundle all frames in the store build (option A), as the TestFlight build does now.** A needs no new native code, no server rule and no change to the animation pipeline.
- **A released app keeps its hashes because it carries them.** It never asks kingdown.dev for a frame, so the site keeps nothing for the app.
- **The smallest change is one line in the runtime.** It lets the app show the bundled frames offline (section 1, last row). The line is in animation code: coordinate it with the animation work.
- **Streaming (B) and Apple-hosted packs (C) cost more than the earlier report expected.** Capacitor 8 has no open hook that replaces its scheme handler, so B needs a second scheme or a rebuilt configuration. Each site deploy deletes the frames that it no longer uses. C needs iOS 26, a downloader extension and an App Review for each pack version.

## 1. Facts from the code and the live site

| Fact | Source |
| --- | --- |
| The frames are 10,720 WebP files, 229.9 MB in total (mean 21.4 kB, largest 45.9 kB). `dist/` is 257.3 MB in 11,120 files. Without the frames, it is 27.4 MB in 400 files. `ios/App/App/public` holds the same 10,720 frames. | `find` and `stat` on this worktree |
| A zip of `dist/` is about 255 MB. A zip of the frames alone is about 231 MB; the rest is about 24 MB. WebP does not compress again, so the store download is near the full size (estimate). | `zip -r` in the scratchpad |
| Each frame name is the SHA-256 of its bytes. The manifest gives each frame a URL relative to `manifest.json`. | `tools/convert-character-runtime-webp.mjs:59`; `src/render/painted/character-runtime.mjs:83,182` |
| `tools/convert-character-runtime-webp.mjs` writes `public/character-runtime/` (the WebP frames and the manifest) from the PNG package of `tools/build-character-runtime.mjs`. It refuses a folder that exists, so each package is a new tree, and a frame that the new manifest does not name is gone. The frames are plain Git files (no LFS). | `tools/convert-character-runtime-webp.mjs:23,59`; `.gitattributes` |
| Frame change rate, 2026-11-01 to 2026-11-07: 14,200 different frames (310.9 MB) went into Git. Later commits removed about 3,480 of them. The manifest changed in 15 commits. | `git log --raw -- public/character-runtime/assets` |
| The deploy publishes one full prebuilt tree with `vercel deploy --prebuilt --prod`. `deploy-keep-assets.mjs` keeps only the files under `/assets/`, one build back. It keeps no frame. | `tools/deploy.sh:335-337`; `tools/deploy-keep-assets.mjs:1-6` |
| **A new deploy removes old frames from kingdown.dev.** A frame that commit `10dc57004` (2026-11-05) removed answers HTTP 404. A current frame answers 200 `image/webp`. The 404 also has `Cache-Control: public, max-age=31536000, immutable`, because the frame route sets that header on every path that matches. | `curl` on 2026-11-08; `tools/plugin-server-build.mjs:22` |
| The runtime asks for no manifest, frame or effect while `navigator.onLine` is false. So the app shows plain figures in airplane mode, also with all frames in the bundle. The earlier report says that played frames stay available offline. This gate stops that too. | `character-runtime.mjs:79,125,129,161,187,267,290` |

## 2. Facts from Capacitor 8.6.0 and Apple

- **Capacitor.** `loadView()` is `public final`. It makes a `WebViewAssetHandler` and registers it for `capacitor` after it calls the open `webViewConfiguration(for:)` (`CAPBridgeViewController.swift:30-45,119,297`). The open `router()` (`:106`) maps a path to a file path, synchronously. The handler then reads that file with `Data(contentsOf:)` and sends `Cache-Control: no-cache` (`WebViewAssetHandler.swift:32-111`). The app uses `CAPBridgeViewController()` directly (`ios/App/App/SceneDelegate.swift:11`).
- **WebKit.** A second `setURLSchemeHandler` call for the same scheme is a programmer error. `urlSchemeHandler(forURLScheme:)` returns the handler that is registered (https://developer.apple.com/documentation/webkit/wkwebviewconfiguration/seturlschemehandler(_:forurlscheme:)).
- **Inference.** A handler that gets a missing frame from the network cannot go in through `router()`, because `router()` maps a path to a file synchronously. B has two seams: (1) the open `webViewConfiguration(for:)` runs before Capacitor registers its own handler (`CAPBridgeViewController.swift:296-297`), so a handler for a different scheme can go there, with a frame base option in the runtime and CORS headers in the handler; (2) a subclass that overrides `webView(with:configuration:)` and registers a wrapper for `capacitor`. Both work against the template, and the Capacitor 9 move can break them. C needs neither: its frames are on disk before the page uses them, so an overridden `router()` can map `/character-runtime/assets/<hash>.webp` into the pack folder (get the folder one time, off the main thread). Test this in the simulator.
- **Size.** The maximum uncompressed app size is 4 GB. Apple points to Background Assets for larger content (https://developer.apple.com/help/app-store-connect/reference/app-uploads/maximum-build-file-sizes/). App Store Connect shows a warning when a device variant is larger than the 200 MB over-the-air download limit (https://developer.apple.com/help/app-store-connect/manage-builds/view-builds-and-metadata/). On the iPhone, the user chooses to get a question for downloads over 200 MB, or for all apps (iPhone User Guide, iOS 17: https://support.apple.com/guide/iphone/manage-purchases-settings-and-restrictions-iph3dfd91de/17.0/ios/17.0).
- **Updates.** The App Store sends an update package that holds only the content that changed between versions (https://developer.apple.com/documentation/xcode/doing-advanced-optimization-to-further-reduce-your-app-s-size). Inference: a frame with the same hash keeps its name and bytes, so an update carries only the new frames and the manifest. Measured: of the 10,720 frames at `d49875e8a`, 5,860 (126.5 MB) are not in the tree of 2026-11-05 00:17. At this week's rate, an update three days after a build carries about 127 MB.
- **Background Assets.** The framework is available on iOS 16 and later. Managed Background Assets, which Apple hosting needs, is available on iOS 26 and later (https://developer.apple.com/documentation/backgroundassets; https://developer.apple.com/help/app-store-connect/manage-asset-packs/overview-of-apple-hosted-asset-packs). Apple hosts up to 200 GB and 200 packs for each app, for TestFlight and App Store apps only (https://developer.apple.com/help/app-store-connect/reference/apple-hosted-asset-pack-size-limits). The app needs a downloader extension, an App Group for both targets and three `Info.plist` keys. `xcrun ba-package` makes each pack. Each pack version goes to App Review before App Store release (https://developer.apple.com/documentation/backgroundassets/downloading-apple-hosted-asset-packs; https://developer.apple.com/documentation/backgroundassets/creating-managed-asset-packs). The download policies are `essential` (part of the install), `prefetch` (starts with the install, then continues) and `onDemand`.
- **One live pack version.** Only one version of a pack is live for each context, and all installed app versions change to it. Apple tells developers to make sure that a new pack works with older app versions (WWDC25 session 325, https://developer.apple.com/videos/play/wwdc2025/325/). `AssetPackManager.url(for:)` must not block the main thread, and WebKit calls the scheme handler on the main thread (https://developer.apple.com/documentation/backgroundassets/assetpackmanager/url(for:)).
- **iOS 26 reach.** On 2026-06-07, 79 % of all iPhones that used the App Store had iOS 26 (https://developer.apple.com/support/app-store/). The app floor is iOS 15 (ticket 05). Correction, 2026-11-08: the floor is now iOS 16.4, the web build's target (ticket 05).
- **App Review.** Rule 2.5.2 says that an app "may not download, install, or execute code which introduces or changes features". Frames are images, not code. Rule 4.2 asks for more than a repackaged website. Rule 4.2.3(ii) tells an app to give the size and ask first if it must download resources to work at first launch (https://developer.apple.com/app-store/review/guidelines/).
- **Vercel.** The limits page (updated 2026-09-16) gives 15,000 files for a CLI upload, and gives `vercel deploy --archive=tgz` as the way past it. A changelog of 2026-06-17 says that Vercel removed the CLI deployment limits (https://vercel.com/docs/limits; https://vercel.com/changelog/cli-deployment-limits-removed). The two pages do not agree.

## 3. Options

| | A. Bundle all frames (pick) | B. Stream from kingdown.dev, disk cache | C. Apple-hosted Background Assets |
| --- | --- | --- | --- |
| Download | about 255 MB (zip estimate). Above 200 MB, so a user on cellular can get a question. | about 24 MB | about 24 MB, then a 231 MB `prefetch` pack after the install |
| Native work | none | a second-scheme handler or a configuration subclass, disk cache (SHA-256 check, 200 only) | a `router()` override in a `CAPBridgeViewController` subclass (inference, test it), a downloader extension, an App Group, three `Info.plist` keys, a pack build and upload |
| Server work | none | a retention step in the deploy (section 5), and the frame traffic | none on kingdown.dev. The same retention rule applies inside each pack. |
| Web game and animation pipeline | unchanged, plus the one offline line | unchanged, plus the one offline line | unchanged, plus the one offline line and a pack step for each art change |
| Offline | all frames, after the offline line | the plain figure for each frame that is not in the cache | all frames, after the pack download |
| New art reaches app users | with each app release (review) | with each app release (the manifest is in the bundle) | with each app release, or with a reviewed pack that keeps all old hashes |
| Main risk | The download grows with the art: 6,885 frames on 2026-11-01, 10,720 on 2026-11-07. | a deploy that drops a released hash; a slow first game; a seam that Capacitor 9 can break | the iOS 26 floor (or two paths); one review for each pack |

## 4. Recommendation

Choose A for the first App Store submission. A gives a complete animated game that also plays offline (good for 4.2), with no version skew and no new code. An update carries only the new frames and the manifest, because a frame that does not change keeps its name and bytes. At this week's rate, that is about 127 MB three days after a build. The cost is a first download of about 255 MB, above the 200 MB line. On cellular, that is a question to the user, not a refusal. This change removes the `shortcut:` comment at `tools/ios-sync.sh:15`: all of `dist/` is now the decision.

Examine the choice again when one of these conditions is true: the store download is more than 500 MB (a proposed budget), store data shows lost installs, or the owner wants new art to reach players between app releases. Then choose C if the floor can go to iOS 26. If not, choose B. Make a test build of the chosen seam at that time.

## 5. Hash-retention rule

- **With A.** An app build copies `dist/` of one commit (`tools/ios-sync.sh`). Its manifest and its frames come from the same build. The app asks kingdown.dev for no frame and no manifest, so the site keeps nothing for the app. Do not let the app read the live manifest: the manifest names effect modules (`.mjs`), and these are code (2.5.2).
- **If a later version streams (B or C).** Each hash that the bundled manifest of a supported app version names must stay available with the same bytes until that version is retired. For B, it stays at `/character-runtime/assets/<hash>.webp`. For C, it stays in the live pack. To do this, tag the commit of each App Store build (`ios-<version>`). Add a deploy step beside `deploy-keep-assets.mjs` that copies from Git each frame of each tagged tree that the new build does not have. Remove a tag when no supported version needs it. At the change rate of 2026-11-01 to 2026-11-07, one tag adds about 3,500 files (about 81 MB) after one week. The static tree then has about 14,600 files, near the 15,000 figure above.
- **Cache rule for B.** Keep only a 200 `image/webp` response whose SHA-256 is equal to its name. A 404 also has the immutable header, so never keep a 404.

## 6. Open items

Items 1 and 3 are in [Show bundled frames offline and check effects on old iOS](../../specs/ios-app/issues/14-offline-frames.md).


1. **The offline line (the smallest change).** At `character-runtime.mjs:79`, write `const connected=()=>globalThis.navigator?.onLine!==false||globalThis.location?.protocol==='capacitor:';` (plain Node imports this file, so do not import `src/platform.ts`, and guard `location`). Update the comment at `:118`. Add a unit test that stubs `navigator.onLine` false and a `capacitor:` location and expects frames to load. This is animation runtime code: coordinate it with the animation work. Test on an iPhone in Airplane Mode with Wi-Fi off; the simulator has no Airplane Mode (it uses the Mac's network).
2. After the first upload, read the real download size in App Store Connect (App File Sizes). The 255 MB is a zip estimate.
3. **Effect modules on older iOS.** The effects are `.mjs` files that the runtime loads with `import()`. Capacitor takes the MIME type from `UTType`, and its fallback map has no `mjs` key (`WebViewAssetHandler.swift:118-131,201`). iOS 27 gives `text/javascript`; iOS 15 to 26 are not checked. Before submission, check the Maester, Queen and Archer effects and the Archer smoke on the oldest supported simulator runtime. Correction, 2026-11-08: the scene draws the Queen effect itself and never loads its module, and the floor is iOS 16.4 ([ticket 14](../../specs/ios-app/issues/14-offline-frames.md)).
4. The parked Workshop art (`ui/workshop/`, 2.34 MB) is still in the bundle. Remove it when that file list changes next.
5. Web only: the frame route puts the immutable header on a 404. If a removed frame comes back (for example, in a revert), a browser can keep the old 404 for a year. The risk is low.
6. If B or C comes later: prove the chosen seam in the simulator, examine it again at the Capacitor 9 move, and test the leap timing (Resource Timing can be empty for scheme responses). For more than 15,000 files, use `vercel deploy --archive=tgz`.
