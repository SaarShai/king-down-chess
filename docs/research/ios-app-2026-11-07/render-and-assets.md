# Render, assets and input in a WKWebView on an iPhone

Date: 2026-11-07. Worktree `ios-app`, commit `c77a67484` (origin/main). Measured on this Mac with `npm run build` and a local `vite preview`. No deploy, no push, no live call.

## Answer first

- **Bundle the start set. Stream the character frames from kingdown.dev.** The start set is 20.5 MB (18.1 MB without the parked Workshop art). The character frames are 229.9 MB in 10,720 files. One board in one game uses only a small part of them.
- **The render stack has no three.js and no WebGL on the game board.** The game draws on 2D canvas with DOM and CSS around it. The task brief says "three.js WebGL": that is out of date. Commit `1c992ae25` (2026-11-04) removed three.js because no code imported it.
- **Stream through the app's own URL scheme, not through a cross-origin fetch.** The native shell serves the bundled files. For a frame that is not in the bundle, it gets the frame from kingdown.dev and keeps it in an on-device cache. Then the page stays same-origin, its relative URLs work unchanged, the server needs no CORS change, and played frames stay available offline. Service workers do not run on a custom scheme, so this cache replaces `sw.js` in the app.

## 1. Render stack

| Layer | What it is | Where |
| --- | --- | --- |
| Board scene | One 2D canvas, painted sprites. Backing resolution is at most 2x, also on a 3x iPhone. | `src/render/PaintedView.ts:146`, `src/render/painted/scene.mjs` |
| Character bodies | Pre-rendered WebP frames, one file for each frame, chosen by a manifest | `src/render/painted/character-runtime.mjs:83` |
| King and board effects | 2D canvas work (layers, `getImageData`, `ctx.filter` with a fallback) | `src/render/painted/king-effects.mjs:84-138` |
| Title kings | 2D canvas | `src/render/painted/title-kings.mjs:20,78` |
| UI | DOM and CSS (grid layout, CSS animation for power motion) | `src/ui/table.css`, `src/power-motion.css` |
| Card motion (online `/play/` only) | WebGL2, one shared canvas | `src/plugin/card-motion/runtime.ts:25` |

`src/entry.ts:4-5` picks the online app (`src/online/entry`) for account routes and the local game (`src/main.ts`) for all other routes. Both come from the one `index.html`.

### Sprite banks (`public/character-runtime`)

The manifest holds 846 banks for 17 characters and 34 character/army pairs. It has 16 canvas sizes, from 384x384 to 900x644. Figures from `dist/character-runtime/manifest.json`:

| Kind | MB | | Character (top) | MB |
| --- | --- | --- | --- | --- |
| attack | 108.8 | | paladin | 28.0 |
| turn | 38.0 | | knight | 20.4 |
| move | 35.1 | | king-shadow | 16.7 |
| idle | 27.6 | | king-mud | 14.7 |
| movement | 20.4 | | maester | 13.9 |

### What loads at start and what streams

- **At start (the "startup" set).** The manifest, `footprints.json` and the effect modules (`tools/lib/character-runtime-public.mjs:2`). The service worker caches them with the JS, CSS, `ui/`, fonts, icons and the web manifest (`vite.config.ts:43`).
- **When the page has loaded.** The scene starts the body runtime after the first frame and the `load` event (`scene.mjs:1033-1035`). It "warms" each piece on the board: the first frame of its rest bank only (`character-runtime.mjs:294-298`, `scene.mjs:70`).
- **On selection.** A full warm loads the first 6 frames of each idle bank of that piece. `prefetchMoves` loads the move and capture frames toward each legal target (`scene.mjs:1241-1242`, `character-runtime.mjs:316-351`).
- **During a move.** Knight and Paladin leaps stream frame by frame. `leapPlan` and `leapWait` pace them to the link that the runtime measures (commits `2bdbd6ca9`, `438f0cec7`, `e47840f33`; `character-runtime.mjs:44-48,87-109`). The runtime uses 2 to 6 parallel loads, from the round trip and the time for one frame (`character-runtime.mjs:101-109`).
- **Limits.** The decoded budget is 64 MiB (`character-runtime.mjs:76`). An optional load waits at most 1 s, an image at most 5 s (`character-runtime.mjs:78`). When `navigator.onLine` is false, the runtime asks for no frame and shows the plain figure (`character-runtime.mjs:79,116-118`).
- **Large effect art from `src/` and `docs/`.** Some effect art is imported from `docs/2d-first-pieces/` and goes into `assets/`. Examples: the Shadow hand bank (2.45 MB, `king-effects.mjs:27`), the Stratus cloud bank (1.35 MB, `king-effects.mjs:26`), the Flame ground (0.93 MB, `king-effects.mjs:24`), and the Rook slam and Knight tap clips (1.24 and 0.56 MB, `src/render/painted/clips.mjs:7`).

## 2. Sizes

`npm run build` passed in 7 s (`VITE_KINGDOWN_STAGE=staging`, `VITE_SUPABASE_URL` is the staging constant from `src/account/public-config.ts:1`). The build does not need the publishable key: only `src/account/client.ts:22` reads it, at run time. `dist/` is ignored (`.gitignore:29`). After the build, `git status` shows only the research folder.

| Folder in `dist/` | MB | Files |
| --- | --- | --- |
| **Total** | **260.82** | **11,119** |
| `character-runtime/` | 236.76 | 10,735 |
| of it, `assets/` (frames) | 229.94 | 10,720 |
| of it, `effects/` | 3.22 | 13 |
| of it, `manifest.json` | 3.34 | 1 |
| of it, `footprints.json` | 0.26 | 1 |
| `assets/` (JS, CSS, imported art) | 17.06 | 211 |
| `ui/` | 5.88 | 156 |
| of it, `ui/workshop/` (parked) | 2.42 | 68 |
| `icons/` | 0.95 | 4 |
| `fonts/` | 0.09 | 6 |

**The start set (the `sw.js` precache):** 230 files, 20.47 MB. Split: `assets/` 9.94, `ui/` 5.88, `character-runtime/` 3.62, `icons/` 0.95, `fonts/` 0.08. It holds 68 files of `ui/workshop/` (2.4 MB), but the Workshop is parked (`docs/PARKED.md`). The cause is the `ui/` pattern in `vite.config.ts:43`.

**A first board (measured).** Phone 390x844 at 3x, touch on, service worker blocked, local server, no network limit. These are raw bytes from 107 responses, counted until 4 s after `view.ready()`:

| Part | WebKit kB | Chromium kB |
| --- | --- | --- |
| `assets/` (JS, CSS, effect art) | 5,827 | 5,827 |
| `character-runtime/manifest.json` | 3,342 | 3,342 |
| `character-runtime/effects/` | 570 | 570 |
| `ui/` | 503 | 499 |
| `character-runtime/assets/` (18 frames) | 375 | 374 |
| `footprints.json` | 265 | 265 |
| fonts, `index.html`, web manifest | 129 | 85 |
| **Board total** | **11,010** | **10,962** |
| Tap a pawn (38 frames) | +730 | +730 |
| Then tap a knight (26 frames) | +524 | +524 |

- The largest single files are `manifest.json` (3.34 MB raw; 0.99 MB gzip, 0.79 MB brotli), `film-poses.webp` (2.45 MB, the Shadow hand bank) and `motion-*.js` (0.39 MB).
- The board needs only 18 frames (375 kB). The body runtime costs the manifest, the footprint table and the effect art.
- Over the network, gzip makes the JSON, JS and CSS about 3 MB smaller. This is an estimate: the local preview does not compress.
- The October baseline (`docs/perf/after.json`, 2026-10-02: 2.06 MB until the first move) is from before the character runtime, so it is no longer valid.

## 3. Audio, fonts and the web manifest

- **Audio.** There are no sound files. Web Audio makes all sounds from noise and tones (`src/render/sfx.ts:1,57-72`). One `AudioContext` starts on the first sound and calls `resume()` each time (`sfx.ts:76-77`). On iOS the context opens only after a user gesture. The first sound is a tap on the player's own move, so that works. The ringer (silent) switch mutes Web Audio by default in Safari. The `navigator.audioSession.type` API (Safari 16.4, 2023-03-27; MDN, read 2026-11-07: https://developer.mozilla.org/en-US/docs/Web/API/AudioSession/type) or a native `AVAudioSession` category controls this. Reports differ on whether `playback` gets past the switch on current iOS (https://bugs.webkit.org/show_bug.cgi?id=264473, read 2026-11-07). Test this on a device.
- **Fonts.** 4 WOFF2 files, Cinzel and Alegreya Sans, Latin subset, 82 kB total, with their OFL licenses in `public/fonts/`. `index.html:19-20` preloads two of them. Bundle them all.
- **Web manifest.** `public/manifest.webmanifest`: standalone, `orientation: any` (line 9), colors `#f3ead7`, icons 192 and 512 plus a maskable 512. There is also `apple-touch-icon.png` (62 kB). The app does not use the web manifest. The native shell needs its own app icon set (1024 px source) and launch screen in the same colors.

## 4. Input on a touch screen

The board uses Pointer Events on the canvas (`src/render/PaintedView.ts:169-175`).

| Gesture | Now | On an iPhone |
| --- | --- | --- |
| Tap | Tap to select, tap to move. A press is a tap up to 12 px for a finger, 6 px for a mouse (`src/render/tap.ts:4-5`). | Works. |
| Drag | Pointer capture on the player's own piece (`PaintedView.ts:479-481`). `touch-action: none` on the board canvas (`src/style.css:712`). `touchstart` calls `preventDefault` only while a drag is armed (`PaintedView.ts:171`). | Works. A drag that starts off the board scrolls the page. |
| Tap to skip an animation | A capture-phase `pointerdown` on the document skips a running animation and eats the click (`PaintedView.ts:151-168`). | Works. |
| Hover | `onSquareHover` shows the square name and a preview of the move (`src/screen/play.ts:605-610`). `pointerleave` clears it (`PaintedView.ts:175`). | A finger hovers only while it is down. The move preview shows only during a drag. That is acceptable, but a touch user never sees it on a plain tap. |
| Hover styles | Most are inside `@media (hover: hover)` (`style.css:177-193,253,340,368,780`). | Two are not: `.title-lineup li:hover` (`style.css:612-613`) and `.power-choice button:hover` (`src/power-motion.css:22,43`). On iOS a tap keeps `:hover`, so a figure stays lifted and a power animation keeps running after the tap. |
| Second finger | A second `pointerdown` clears the press (`PaintedView.ts:475`). | Good: a pinch does not move a piece. |
| Long press | No handler. No `-webkit-touch-callout` and no `user-select: none` in the game CSS. | A long press on a DOM image (title figures, king portraits, cards) opens the iOS image menu. A long press on text selects it. Set `-webkit-touch-callout: none` and `user-select: none` on the chrome of the game, and keep them only off the fields. |
| Double tap | No `dblclick` handler. No `touch-action: manipulation` outside the board. | Two fast taps on buttons or text can zoom the page. Set `touch-action: manipulation` on `body`. |
| Keyboard | Esc, z (undo), ← → (review), arrows, Enter, Space and i on the board (`src/screen/keys.ts:44-96`, `src/ui/read.ts:3`). The text "← → step through the moves" shows only with hover (`src/ui/table.ts:114`). | Not needed on a phone. It works with a hardware keyboard on an iPad. |
| Share | `navigator.share` on a coarse pointer (`src/turn-controls.ts:37`). | WKWebView supports Web Share. Test it. |

## 5. Layout

- **Viewport meta** (`index.html:5`): `width=device-width, initial-scale=1.0, viewport-fit=cover`. Good: `viewport-fit=cover` turns on the `env(safe-area-inset-*)` values.
- **Safe areas.** The game table uses only the top and bottom insets (`src/ui/table.css:9,37,64,98,114`, `src/ui/home.css:16`, `src/style.css:309`). No rule in the local game uses `safe-area-inset-left` or `-right`. In landscape on an iPhone with a notch or Dynamic Island, the strips and the board can go under the sensor area. The online page uses all four insets (`src/online/page-host.css:5`).
- **Height.** Every `100vh` has a `100dvh` after it (`table.css:5`, `style.css:522`). One `86vh` is in a `min()` with `100dvh` (`style.css:267`). `dvh` works in WKWebView (iOS 15.4 and later).
- **Orientation.** There are landscape rules for short screens (`table.css:58-93`, `style.css:437,677-692`, `home.css:26`). The web manifest says `any`. Decide this in the shell: portrait only for the first build is the lean choice, because the UI will change.
- **Fixed sizes.** Strip 56 px, context 77 px, bar 60 px plus the bottom inset (`table.css:2-7`). The board canvas follows its container through a `ResizeObserver` (`PaintedView.ts:139-147`), so the board itself has no fixed pixel size.
- **Text that iOS zooms.** iOS zooms on a focused field below 16 px (https://weblog.west-wind.com/posts/2023/Apr/17/Preventing-iOS-Textbox-Auto-Zooming-and-ViewPort-Sizing, 2023-04-17). The body text is 15.5 px (`style.css:74,118`), and fields inherit it (`style.css:164`). The email code field sets 16 px (`style.css:406`). The online name field uses `--fs-lg` (`src/plugin/app.css:48-50`). The `select` controls (Motion in New game, `index.html:188`) stay at 15.5 px, so iOS zooms when one opens. Set `select` to 16 px. Do not use `maximum-scale=1`: it also stops pinch zoom.

## 6. Performance, frame time and context loss

### Checks that measure frame time

- `king-effects` (`tools/lib/registry.mjs:52`, `gpu: true`) measures the main-thread time of each frame. It measures the start position with each pair of kings, on desktop and on a 390x844 3x phone (`tools/verify-king-effects.mjs:262-290`). It reports the mean, p95 and max, and asserts an idle redraw rate of 12 to 40 fps (`verify-king-effects.mjs:56-57`).
- `painted-game` (`registry.mjs:56`, `gpu: true`) and `desktop-performance` (`registry.mjs:90`, by name).
- `tools/measure-load.mjs` measures a cold load on a slow phone (390x844 3x, 1.6 Mbps, 4x CPU). It is not in the registry. Run it by hand.

### Browser checks that cover a phone size

These run in the default set: `game-screen`, `their-turn`, `end`, `menu-extra`, `home`, `account`, `new-game` (also 844x390 landscape), `powers`, `special-moves`, `verb-marks` and `king-effects` (`registry.mjs:39-58`). By name: `layout-title`, `layout-zoom`, `layout-result` (with touch) and `character-runtime` (390x844). `qa` sets 390x844 (`tools/qa.mjs:332`). The default browser is Chrome or Chromium. WebKit runs only with `PLAYABLE_BROWSER=webkit` (`tools/check.mjs:32`). For the app, run the phone checks in WebKit.

### Context loss and the background

- **The game board has no WebGL context to lose.** It is 2D canvas only.
- **WebGL2 card motion** (online `/play/`) handles `webglcontextlost` by clearing the cards to their still art. It never restores them (`src/plugin/card-motion/runtime.ts:26-27`, marked `shortcut:`). On iOS this happens after time in the background. Add `webglcontextrestored`, or accept the still art.
- **Background and foreground.** The motion layers cancel when the page is hidden (`src/ui/motion.ts:11,19`, `src/ceremony.ts:116,129`, `src/game-end.ts:25`). The scene restarts the body runtime on `pageshow` when the page comes back from the back-forward cache (`scene.mjs:65,1034`).
- **The real iOS risk is a killed web content process, not context loss.** The decoded frame budget is 64 MiB (`character-runtime.mjs:76`), plus the effect canvases. When iOS stops the WebContent process, the shell must reload the page in `webViewWebContentProcessDidTerminate(_:)` (https://developer.apple.com/documentation/webkit/wknavigationdelegate/webviewwebcontentprocessdidterminate(_:), read 2026-11-07). The game keeps its save in `localStorage` (`kingdown.save`), so a reload goes back to the same position.

## Recommendation, with the numbers

| Option | App size | First board | Offline | Cost |
| --- | --- | --- | --- | --- |
| A. Bundle all of `dist/` | about 261 MB, 11,119 files | 0 network | All animation | Each art change needs an app release and review. The download is large. The runtime's slow-link logic does nothing. |
| **B. Bundle the start set, stream the frames (pick)** | about 18 MB without `ui/workshop/` (20.5 MB with it) | 18 frames, 375 kB. A pawn adds 730 kB and a knight 524 kB. | The plain figure, and every frame already played | One native seam: the scheme handler and its disk cache. The server must keep old frames (see below). |

Apple's maximum uncompressed app size is 4 GB, so A is allowed (https://developer.apple.com/help/app-store-connect/reference/app-uploads/maximum-build-file-sizes/, read 2026-11-07). B is still the lean choice. The runtime already streams, measures the link and falls back to the plain figure. The frame names are SHA-256 hashes, so a cached frame never goes out of date. Apple's Background Assets service is a later alternative to streaming from kingdown.dev (same page).

### What B needs

1. **One frame base URL in the shell, not in the page.** The page asks for `/character-runtime/assets/<sha256>.webp` on its own scheme. The shell serves a bundled file, else a cached file, else it gets the file from `https://kingdown.dev` and caches it. The JS does not change.
2. **Do not stream code.** Bundle `manifest.json`, `footprints.json` and the effect modules (`effects/*/effect.mjs`, `smoke.mjs`). The runtime loads these with `import()` (`character-runtime.mjs:291`). App Review rule 2.5.2 limits downloaded code. Check the live text of the rule before you rely on any exception.
3. **Version skew.** The app's bundled manifest names frame hashes from its own build. A later kingdown.dev deploy can remove those files. The server must keep every frame that a released app names, for example in a store of hashed frames that only grows. Or the app must fetch the current manifest, but then the effect modules must match it.
4. **No service worker in the app.** WKWebView runs service workers only for App-Bound Domains, at most 10 domains (https://webkit.org/blog/10882/app-bound-domains/, 2020-06-26). A custom scheme does not get them. The shell must not register `sw.js` (`src/online/cache-policy.ts:88`). The scheme handler's cache does the offline work.
5. **Link pacing.** The runtime estimates the link from Resource Timing entries with `transferSize > 0` (`character-runtime.mjs:103-108`). Responses from a scheme handler can have no such values. Then the runtime uses 6 parallel loads and its decode-time estimate. Test the leap on a slow link (`leap-start`, `registry.mjs:16`) inside the shell.
6. **CORS only if the page asks kingdown.dev directly.** Today the frame route sets only `Cache-Control` (`tools/plugin-server-build.mjs:22`), and images load with `crossOrigin: 'anonymous'` (`character-runtime.mjs:83`). A direct cross-origin load fails without `Access-Control-Allow-Origin`. The scheme-handler design avoids this.

### Small fixes for the web build that also help the app (they can wait for the UI change)

- Keep `ui/workshop/` out of the build and the precache (2.4 MB; `vite.config.ts:43`).
- Make the manifest smaller or split it (3.34 MB raw for each start), or load it only after the board is drawn. It already loads after `load`.
- Add `touch-action: manipulation`, `-webkit-touch-callout: none`, `user-select: none` on the game chrome, and 16 px on `select`.
- Put the two hover rules inside `@media (hover: hover)`.
- Add left and right safe-area padding for landscape, or lock the app to portrait.

### What can wait

Landscape, an iPad layout, keyboard play, the restore of WebGL card motion, Background Assets, and a frame CDN in front of Vercel.
