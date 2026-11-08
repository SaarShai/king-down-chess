# iOS 16.4 compatibility of the app bundle

Date: 2026-11-08. Worktree `ios-app`, sources at main `8bc0f5057`. The bundle is the TestFlight build (production build of commit `32677e5d9`) in `ios/App/App/public`. Read only: no build, no deploy, no device. The version data is MDN browser-compat-data (BCD) 6.1.5, field `safari_ios.version_added`. **Fact** is what a source, the bundle or BCD says. **Inference** is this note's reading of it. Test an inference before you rely on it.

## Question

The app floor is now iOS 16.4 (`IPHONEOS_DEPLOYMENT_TARGET = 16.4`, `ios/App/App.xcodeproj/project.pbxproj:241,292,310`). Vite lowers the syntax to `['chrome111','edge111','firefox114','safari16.4','ios16.4']` (`vite.config.ts:116`), but it adds no polyfill for built-ins or Web APIs. Nobody has run the game on iOS 16.4: Xcode 27.2 on this Mac has no iOS 16.4 simulator, and CI tests only the current WebKit. Does the shipped bundle use a JavaScript built-in, a Web API, a CSS feature or an HTML feature that iOS 16.4 does not have? If yes, what breaks, and what is the fix?

## Answer first

- **iOS 16.4 is a safe floor for the current bundle.** The scans found no use that throws, stops the start, or stops a game on 16.4.
- **Three uses degrade on 16.4, all cosmetic.** The New game and Rules dialogs open and close with no fade or slide. The focus ring on the game-over heading and on the board can show after a tap or not show after a key press. A third use, the Beast bite throat shadow, is wrong on every iOS version, not only on 16.4.
- **No fix is necessary to ship.** Two small CSS fixes and one canvas fix are optional (section 4). Do not raise the floor: the floor that removes all three degrades is 18.4, and the fixes cost less.

## 1. Method

Three scans ran in parallel, one for each area: JavaScript built-ins and syntax, Web APIs, and CSS and HTML. A second agent then checked each finding of each scan against the bundle and the sources. This note uses only the findings that the check confirmed.

1. **BCD list.** A script walked each `__compat` node in BCD 6.1.5 for its area (`javascript.*`; `api.*` and `javascript.builtins.Intl.*`; `css.*` and `html.*`). It kept each feature whose first `safari_ios` entry without a flag, a prefix or an alternative name is later than 16.4, is `false`, or is partial. That gave 358 JavaScript rows (243 of them Temporal), 3,603 Web API rows and 1,035 CSS and HTML rows.
2. **Token.** For each feature, the scan derived the text that a use shows in minified code: a member name, a global, an option key, a CSS property, value, at-rule or selector, or an HTML tag or attribute.
3. **Bundle search.** Each scan searched all `.js` and `.mjs` files under `ios/App/App/public` (`assets/*.js`, the workers, `character-runtime/effects/*/*.mjs`), the inline scripts and styles of `index.html` and of the static `.html` pages, the four `assets/*.css` files and the style text in the SVGs. `sw.js` does not run in the app; the Web API and CSS scans left it out. The bundle has no `.wasm`.
4. **Extra checks.**
   - esbuild 0.28.2 transformed each script with target `esnext` and with target `safari16.4,ios16.4`. All outputs were byte-identical. So the bundle has no syntax or regular-expression feature that esbuild knows as later than Safari 16.4.
   - A regular-expression scan looked for the `v` flag, `(?i:` modifiers, duplicate named groups and `\p{...}`.
   - A CSS parser listed each property, value, at-rule, pseudo-class, pseudo-element, function and unit in the bundle CSS and looked each one up in BCD.
   - The structured-clone sinks (`postMessage`, `structuredClone`, `BroadcastChannel`, history state) were read. No `Error` object goes through them.
5. **Each hit.** The scan read each hit in context and mapped it to a source line. Most hits were false: strings, fields of our own objects, library code that the app does not call, or a `-webkit-` twin next to the unprefixed form.

### Limits

- This is a static scan. Nothing ran on iOS 16.4. The "Effect" column in section 2 comes from the CSS and Web IDL error rules (an unknown declaration or dictionary member is ignored), not from a test.
- A use through a computed property name (for example `obj[name]()`) has no token, so the scan cannot find it.
- Iterator helpers on a variable that holds an iterator look like array calls. Each `.flatMap` and `.take` receiver was read by hand; all are arrays or our own methods.
- `Function.prototype.toString` revision (iOS 17) has no text sign. No code parses function source.
- BCD can be wrong. Two BCD values in this area are data errors (section 3).
- `tsconfig` sets `lib` to ES2022 and DOM, so typed app code cannot call an ES2024 built-in without a cast. Library code has only the bundle scan.

## 2. Confirmed features

All rows are real uses in code that runs in the app. "Severity" is from the check: **none** means a player sees no difference; **degrades** means a visible cosmetic change and no loss of function. No row breaks the app.

| Feature | iOS added (BCD) | Where (bundle, source) | Guard | Effect on 16.4 | Severity | Fix |
| --- | --- | --- | --- | --- | --- | --- |
| `transition-behavior: allow-discrete` (transitions of `display` and `overlay`) in the dialog `transition` shorthand | `transition-behavior` 17.4; `display` transitionable 18; `overlay` no support | `runtime-`, `entry-`, `main-*.css`; `src/style.css:819,823`. The class is set in `src/new-game.ts:220` and `src/ui/guide.ts:85`. | None. The `[open]` end-state rules are normal rules, so the dialog shows. No code waits for `transitionend`. | 16.4 does not know `allow-discrete`, so it drops the full shorthand, also the opacity, translate and scale parts. The New game and Rules dialogs and their backdrops open and close at once. | degrades | Optional: put a declaration that 16.4 can parse before the current one: `transition: opacity 350ms ease-out, translate 350ms ease-out, scale 350ms ease-out;` (on `::backdrop`, `transition: opacity 350ms ease-out;`). Then the close fade works on 16.4. |
| `@starting-style` | 17.5 | Same three CSS files; `src/style.css:827-830` | Unknown at-rule is dropped. The end-state rules are outside the block, so nothing stays hidden. | No start state, so the dialog open animation does not run. Same result as the row above. | degrades | Optional: for an open animation on 16.4, use `@keyframes` on `dialog.ui-dialog-motion[open]` (from opacity 0, translate 0 22px). |
| `HTMLElement.focus({ focusVisible })` | 18.4 (`preventScroll` is 15.5) | `main-*.js` → `src/game-end.ts:69` (game-over heading); `runtime-*.js` → `src/plugin/screens/board.ts:385` (board after Send) | None. `game-end.ts` calls `blur()` first when `:focus-visible` does not match, a partial help. | The unknown member is ignored. Focus moves; WebKit decides the ring by its own rule. The ring can show after a tap, or not show after a key press, on 16.4 to 18.3. | degrades | Optional: `#over-title:focus:not(:focus-visible), #board:focus:not(:focus-visible) { outline: none; }` |
| `CanvasRenderingContext2D.filter` without a check (Beast bite throat shadow) | Not supported on any Safari (`false`, webkit.org/b/198416) | `king-sheets-*.js`; `src/render/painted/court-motion.mjs:105` (`drawBeastBite`), called from `src/render/painted/scene.mjs:201` on each Beast bite frame | None. No check, no `try`. | The write only adds an expando; no exception. The jaw copy that must be a dark throat draws at full colour, so a second bright jaw shows in the gap while the jaw opens. **The same on every iOS version and in desktop Safari, not a 16.4 gap.** | degrades | In `court-motion.mjs:105`, do not use `ctx.filter`. After the `drawImage` in the jaw clip: `ctx.globalCompositeOperation='source-atop'; ctx.fillStyle='rgba(0,0,0,.72)'; ctx.fillRect(0,0,768,1024);` The clip limits it and `restore()` resets the mode. The `saturate(.6)` step is lost, a small difference. This is animation code: coordinate with the animation work. |
| `CanvasRenderingContext2D.filter` with a check (spirit glow blur) | Not supported (`false`) | `king-sheets-*.js`; `src/render/painted/king-effects.mjs:135-137` | Yes: `typeof ...getContext('2d')?.filter === 'string'` on a new canvas, with a three-pass box-blur fallback | The fallback runs. It looks almost the same and costs some script time when the glow layers are built. | none | None. |
| `getContext('2d', { willReadFrequently: true })` | 18 | `title-kings-*.js` → `src/render/painted/title-kings.mjs:20`; `motion-*.js` → `src/render/painted/scene.mjs:368,579,609` | Not needed: the option is a hint | 16.4 to 17.x ignore the hint. Each canvas is small (96 or 144 px, or one title image) and is read once, so the read can be a little slower. A player cannot see it. | none | None. |
| `requestIdleCallback` | Not supported (`false`, webkit.org/b/285049) | `motion-*.js`; `src/render/painted/scene.mjs:319` | Yes: `globalThis.requestIdleCallback ? ... : setTimeout(buildQueued, 0)` | The `setTimeout` path runs, as on current iOS. | none | None. |
| `::backdrop` gets custom properties from its element | 17.4 (`::backdrop` itself 15.4) | `runtime-*.css`; `src/style.css:532` (`#title-screen::backdrop`) | Yes: `var(--floor-base, #f2e9d6)` and `var(--floor, none)` | The fallbacks apply. `#title-screen` is full width and full height with its own floor (`src/style.css:521-525`), so it covers its backdrop. A player sees no difference. | none | None. |
| `scrollbar-width` | 18.2 | `runtime-*.css`; `src/plugin/app.css:9,252`; `src/plugin/screens/setup.css:67` | None. The unknown property is dropped (also on 17.x). | iOS uses overlay scroll indicators. At most, a thin indicator shows on the coin row while it scrolls. Layout does not change. | none | None. To hide that indicator: `.coin-row::-webkit-scrollbar { display: none; }` |
| Top-level `await` | 15, partial (WebKit bug 242740: one module with top-level await that two modules import at the same time). BCD gives no full-support version. | `index-*.js` → `src/entry.ts:4-5`; `main-*.js` → `src/main.ts:160,176,177`; `entry-*.js` → `src/online/entry.ts:83-122` | Not needed. Each module with top-level await has one importer: `index.html` loads `index`, and `index` loads `main` or `entry` (never both) through one `import()`. No chunk imports `index`. So bug 242740 cannot occur. | Works on 16.4. | none | None now. Rule for later: keep `src/main.ts` and `src/online/entry.ts` as leaf modules that only `src/entry.ts` imports, through one `import()` each, and add no top-level await to a shared chunk. Optional: put the `src/main.ts` awaits in `try`/`catch` with a message, as `src/online/entry.ts` does, so a failed start does not leave the first-load screen with no message. |

Note: the CSS scan and the Web API scan both found the unguarded `ctx.filter` row. It is one finding.

## 3. Refuted findings

- `PublicKeyCredential.parseCreationOptionsFromJSON` / `parseRequestOptionsFromJSON` (18.4): Supabase auth-js code in `client-*.js`, with a `typeof`/`in` check and a decode fallback. `src` has no WebAuthn, passkey or MFA use, so the app does not call it.
- `Request`/`fetch` option `duplex` (not supported): Supabase storage-js code, set only for a stream body. `src` has no Supabase storage use.
- Other late Web APIs (extra check): each candidate (`Response.json`, `URL.parse`/`canParse`, `bytes()`, popover, `scrollend`, `OffscreenCanvas`, `createImageBitmap`, `Intl.Segmenter`, and others) is absent, or is at 16.4 or earlier (`AbortSignal.timeout` 16, `roundRect` 16, `structuredClone` 15.4, Web Locks 15.4, `showModal` 15.4, `inert` 15.5, `import.meta.resolve` 16.4).
- `::-webkit-slider-thumb` and `::-webkit-slider-runnable-track` (BCD 18): BCD gives 18 also for desktop Safari, a data error. WebKit has had them since its first range input.
- `::-moz-range-track` and `::-moz-range-thumb`: Firefox only, each in its own rule, so WebKit drops only those rules on every version. Intended.
- Unprefixed `backdrop-filter` (18), `user-select` (prefix only), `hyphens` (17): each rule in the bundle has its `-webkit-` twin, which Lightning CSS adds for the safari16.4 target.
- `-webkit-line-clamp: none` (BCD 18.2 is for unprefixed `line-clamp`): WebKit has long parsed `none`, and the same rule sets `display: block`, which stops the clamp.
- `-webkit-text-size-adjust: 100%` (BCD `percentages: false`): a data error for the prefixed form; it is the usual iOS form.
- `<link rel="modulepreload">` (17): the Vite polyfill in `index-*.js` fetches the links when `relList.supports('modulepreload')` is false.
- CSS nesting (17.2): only in the source (`src/style.css:741-786`, `src/plugin/app.css:314-315`). The bundle has no `&` and no nested rule; Lightning CSS flattens it for the safari16.4 target.
- JavaScript false hits: `.isError` (MCP result field), `.detached` (our queue job field), `.toBase64` (storage-js own method), `.displayName` (Supabase field), `.escape()` (our dialog method), `AggregateError`/`InternalError` (strings in an error-name list), `this.take` (our method), the 13 `RegExp(` calls (no flags, no modifiers), `\p{L}\p{N}` with the `u` flag (11.3).

## 4. Conclusion

**iOS 16.4 is a safe floor for the current bundle. No fix is necessary before submission.**

The bundle has no feature later than 16.4 that throws or stops a function. The syntax is lowered by the build, CSS nesting and prefixes are lowered by Lightning CSS, and each late API in the code has a check or is a hint that an old engine ignores.

Optional fixes, in order of value:

1. **Beast bite throat shadow** (`src/render/painted/court-motion.mjs:105`). This is a real defect on every iOS version and in desktop Safari, not only on 16.4. Use the `source-atop` dark fill of section 2. Coordinate with the animation work.
2. **Dialog close fade on 16.4 to 17.3** (`src/style.css:819,823`). Add the plain `transition` declaration before the current one. One line for each rule.
3. **Focus ring on 16.4 to 18.3** (`src/game-end.ts:69`, `src/plugin/screens/board.ts:385`). One CSS rule. Do it only if the ring after a tap is a problem in the play test.

Do not raise the floor for these items. iOS 17.5 brings back the dialog open animation only, and iOS 18.4 is the first version that fixes all three degrades. Both remove more devices than the fixes cost. The throat shadow stays wrong at any floor.

Rules for later changes, so the floor stays safe:

- Keep `build.target` at `safari16.4`/`ios16.4` in `vite.config.ts:116`. It lowers syntax, nesting and prefixes.
- Before you use a built-in or Web API that is new in ES2024 or later, read its `safari_ios` value in BCD. Add a check and a fallback if it is later than 16.4.
- Keep `src/main.ts` and `src/online/entry.ts` as leaf modules with one importer each (top-level await row).

## 5. Open items

1. **Device check.** This note is a static scan. When an iOS 16.x or 17.x device or simulator runtime is available, open the New game and Rules dialogs, end a local game, and play a Beast bite. The expected results are in section 2.
2. **Outside this question, not version-gated.** `src/online/cache-policy.ts` wraps each online call. Its branch for "no service worker" calls `caches.keys()` with no `typeof caches` check. In WKWebView `navigator.serviceWorker` is normally undefined. If `caches` is also undefined under `capacitor://`, each online call fails as UNAVAILABLE (inference). Fact: online play passed in the iOS 27 simulator (ticket 07), so iOS 27 has `caches` there. Check online play once on an older iOS when one is available. If it fails, make `withPrivateCachePolicy` call `send()` at once when `typeof caches === 'undefined'` and no service worker is present.
3. **The `.mjs` effect modules** are a MIME type question, not a BCD feature, so this scan does not cover them. Capacitor 8.6.0 takes the type from the system type lookup and then from its own map, which has no `mjs` key (`WebViewAssetHandler.swift:118-131`). iOS 27 maps `mjs` to `text/javascript`. No source shows the same for iOS 16.4 to 26; the lookup failed for many extensions on iOS 16 simulators under Rosetta (https://github.com/ionic-team/capacitor/pull/5853, https://github.com/ionic-team/capacitor/pull/8154). If it fails on a device, the Maester and Archer effects and the Archer smoke turn off (the runtime catches the error). Renaming the three modules to `.js` removes the question: ticket 14, step 4.
4. The scan scripts and the BCD lists are in `/private/tmp/claude-501/bcdjs/`, `/private/tmp/claude-501/bcd16/` and `/private/tmp/claude-501/bcd-css/`. They are scratch files and can be lost. Run the scan again on a new bundle if a large library is added.
