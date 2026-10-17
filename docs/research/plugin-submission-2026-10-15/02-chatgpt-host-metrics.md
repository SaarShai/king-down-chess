# 02 · ChatGPT host metrics for an MCP Apps widget

Research for ticket `docs/specs/plugin-submission/issues/02-research-host-metrics.md`. Written 2026-10-15. Repo state: branch `claude/plugin-ui-iphone` at `a7edf54a`. I read every source below on **2026-10-15**.

This note does not repeat `docs/specs/chatgpt-mvp/notes/f-host.md` (2026-10-11) or `docs/research/multiplayer-2026-10-10/`. It adds new facts and corrects old ones.

Labels:

- **[Docs]** an official OpenAI page on developers.openai.com. These pages show no date.
- **[OpenAI spec]** / **[OpenAI sample]** the `openai/mcp-extensions` repo (spec, patterns, Bits & Bolts sample) or the `openai/openai-apps-sdk-examples` repo. The date is the last commit to that file.
- **[MCP spec]** the MCP Apps specification in `modelcontextprotocol/ext-apps`.
- **[Report]** a community forum post or a third-party repo. Low trust. Not confirmed by OpenAI.
- **[Repo]** a fact from this repository.
- **[Inference]** my conclusion. It is not in any source.
- **(old)** the source is older than 2026.

---

## 0. Short answer

1. **No OpenAI source gives numbers** for ChatGPT's insets, header height, composer height or inline maximum height, on any platform. The app must read them at run time. [Docs], [OpenAI spec]
2. **OpenAI tells apps to use the host's safe-area insets as the only clearance.** The new patterns page (2026-10-09) says: "Respect ChatGPT's safe-area insets ... Keep content and controls clear of those edges." The official Bits & Bolts sample applies the insets as body padding and adds no composer gap. [OpenAI spec], [OpenAI sample]
3. **So the app's fixed composer gap is very probably a second reserve.** `src/plugin/app.css:7` sets the frame bottom to `96px + safe-bottom` (128 px at 900 px and wider, line 173). If ChatGPT's bottom inset already includes the composer, the app loses 96 px on a phone. [Repo], [Inference]
4. **The 102 / 118 reading fits this model, but no document confirms the numbers.** 102 − 59 = 43, about one 44-pt bar under the status bar. 118 − 34 = 84, about one composer. This is arithmetic on the owner's screenshot, not a documented value. [Inference]
5. **ChatGPT supports `inline` and `fullscreen` only.** If a resource lists both, ChatGPT now opens **fullscreen** by default unless `preferredDisplayMode` says otherwise. All entrypoints open fullscreen. The repo sets `preferredDisplayMode: 'inline'`, so a model call shows the home card first. [OpenAI spec], [Repo]
6. **OpenAI says: change the mode only in answer to a user action, and add no mode buttons.** An OpenAI example also says `requestDisplayMode()` "will fail if called programmatically". The app calls it with no user action when it remounts inline with a saved game screen (`app.ts:218`, `app.ts:220`). [OpenAI spec], [OpenAI sample], [Repo]
7. **Inline height** grows with content "up to the height of the mobile display area". No nested scroll. The MCP standard does this with `containerDimensions.maxHeight` and `ui/notifications/size-changed`. ChatGPT's real `maxHeight` value is not documented. [Docs], [MCP spec]
8. **Mobile fullscreen is not stable.** On iOS and Android, a tap in the composer can drop the widget from fullscreen to inline (report, 2026-09). The app already shows the home card on that change. [Report], [Repo]

---

## 1. Corrections to earlier research

| Earlier note | What is true now | Source |
|---|---|---|
| f-host §3: "Docs disagree: the UI guide says every app starts inline." | The OpenAI spec changed on 2026-10-09. It now says: "If `availableDisplayModes` includes both `inline` and `fullscreen`, ChatGPT defaults to `fullscreen` unless `preferredDisplayMode` specifies otherwise." The old text ("by default, all MCP Apps invoked by the model are displayed inline first") is gone. The UI guidelines page still says "Every app initially appears inline". The spec is newer; follow the spec. | [OpenAI spec](https://github.com/openai/mcp-extensions/blob/main/docs/spec.md#display-modes), commit `faf1c468` (2026-10-09); [UI guidelines](https://developers.openai.com/plugins/concepts/ui-guidelines) |
| f-host §9, §13.11: "Composer overlay can hide bottom controls ... respect `safeAreaInsets.bottom`" (as if the two are separate). | OpenAI's own guidance and sample treat the insets as the clearance for host UI. The ext-apps patterns page says the insets avoid "device notches, rounded corners, or system UI overlays". No source says to add a separate composer reserve. | [OpenAI patterns](https://github.com/openai/mcp-extensions/blob/main/docs/patterns.md#safe-areas) (2026-10-09); [ext-apps patterns](https://github.com/modelcontextprotocol/ext-apps/blob/main/docs/patterns.md) (2026-07-15) |
| QA protocol: iPhone persona "top 59, bottom 34" (`docs/qa/plugin-qa-protocol.md:46`). | These are iOS device insets. ChatGPT's fullscreen insets are probably larger, because they include the host header and composer (owner's screenshot: about 102 / 118). The harness tests the app's double reserve as if it were correct. | [Repo], [Inference] |
| f-host §2.1: "`autoResize` defaults to `true`." | Still true for ext-apps. Note: OpenAI's own Bits & Bolts sample sets `autoResize: false` and sends only the body height. The repo can keep the default (see §5). | [OpenAI sample](https://github.com/openai/mcp-extensions/blob/main/plugins/bits-and-bolts/src/app/controller.ts) |
| f-host §0.3: in-board Fullscreen button removed (owner). | OpenAI now agrees in writing: "Do not add dedicated buttons for changing display modes. ChatGPT provides these out of the box." | [OpenAI patterns](https://github.com/openai/mcp-extensions/blob/main/docs/patterns.md#display-modes) |
| f-host §2.2: `window.openai.maxHeight` ↔ MCP `containerDimensions`. | The ext-apps migration guide maps `window.openai.maxHeight` to `hostContext.viewport.maxHeight`. That field name is out of date. The spec field is `containerDimensions.maxHeight`. | [ext-apps migrate guide](https://github.com/modelcontextprotocol/ext-apps/blob/main/docs/migrate_from_openai_apps.md) (2026-07-15); [MCP spec](https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx) |

---

## 2. Display modes per platform

| Fact | Source |
|---|---|
| ChatGPT supports `inline` and `fullscreen`, not `pip`. | [OpenAI spec §Display Modes](https://github.com/openai/mcp-extensions/blob/main/docs/spec.md#display-modes) (2026-10-09) |
| The reference page still lists `pip` and says "On mobile, picture-in-picture may be presented as fullscreen." An OpenAI example type says "For mobile, PiP is always coerced to fullscreen." | [Reference](https://developers.openai.com/plugins/reference); [examples `src/types.ts`](https://github.com/openai/openai-apps-sdk-examples/blob/main/src/types.ts) |
| Set `_meta["openai/ui"].availableDisplayModes` and `preferredDisplayMode` on the resource content, because the app's own capability arrives only after it initializes. | [OpenAI spec](https://github.com/openai/mcp-extensions/blob/main/docs/spec.md#display-modes) |
| Both modes listed → fullscreen by default, unless `preferredDisplayMode` says otherwise. On Desktop, with `availableDisplayModes` omitted → inline by default. | same |
| "ChatGPT uses `fullscreen` for all entrypoints." On desktop, a global entrypoint "open[s] with a composer and thread layout, with the app as a permanent tab." | same, §Global Entrypoint |
| The support table marks display modes "Supported" on Desktop, Web, iOS and Android. The table describes "expected support at DevDay launch. Web refers to the Work browser. Classic ChatGPT is excluded." | same, §Platform Support |
| "Prefer `fullscreen` for most interactive apps, especially those that should remain open across conversation turns. Use `inline` sparingly for brief interactions." | [OpenAI patterns](https://github.com/openai/mcp-extensions/blob/main/docs/patterns.md#display-modes) (2026-10-09) |
| "Use `requestDisplayMode` to change modes in response to a user interaction." | same |
| "requestDisplayMode() must be called from a user-initiated action (e.g. button click). It will fail if called programmatically." | [OpenAI sample `request-display-mode/App.tsx`](https://github.com/openai/openai-apps-sdk-examples/blob/main/src/request-display-mode/App.tsx) (written 2026-02-18, committed 2026-04-07 in `a4843d9b`) (corrected in check). Not in the reference pages. |
| MCP rules: the view must check `availableDisplayModes` before a request, and must handle a reply mode that differs from the request. The host notifies a mode change through `ui/notifications/host-context-changed`. | [MCP spec §Display Modes](https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx) |
| iOS and Android: opening the composer from a fullscreen widget sends the widget back to inline. On iOS, the log shows the host sent `mode inline` with no request from the app; the reply does not give this log for Android. On iOS the iframe mount ID did not change, so the widget was not remounted in that test. Tested on iPhone 13 mini (iOS 26.6.1) and Galaxy S21+ (Android 15) by a second poster. No OpenAI answer. (corrected in check) | [Report](https://community.openai.com/t/mobile-plugin-exits-fullscreen-when-opening-composer-chat/1395180) (2026-09-06/07) |

**Repo status.** `server.ts:39` declares `availableDisplayModes: ['inline', 'fullscreen']` and `preferredDisplayMode: 'inline'`. `server.ts:96` declares thread and global entrypoints; those open fullscreen, and `app.ts:219` then shows Play. `app.ts:26` declares the same modes in the app capability. This matches the spec. [Repo]

---

## 3. Host context fields: what ChatGPT documents

The MCP field list is in [MCP spec §HostContext](https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx) (stable 2026-01-26; the draft, last changed 2026-07-22, is the same for these fields). ChatGPT's older names are in the [Reference](https://developers.openai.com/plugins/reference).

| MCP field | Meaning (MCP spec) | ChatGPT, documented | `window.openai` alias | Repo reads? |
|---|---|---|---|---|
| `displayMode` | Current mode | Yes, `inline` / `fullscreen` | `displayMode` | Yes (`app.ts:299`) |
| `availableDisplayModes` | Modes the host supports | Not stated that ChatGPT sends it | — | Yes; treats "absent" as "fullscreen allowed" (`app.ts:243`) |
| `containerDimensions` | `height` (fixed: fill it) or `maxHeight` (flexible: the view sets its height up to this); same for width | No values documented | `maxHeight` | Logged only (Display check) |
| `safeAreaInsets` | "Safe area boundaries in pixels" | Yes: "Respect ChatGPT's safe-area insets". No values documented. | `safeArea.insets` | Yes, as `--safe-*` (`app.ts:294`) |
| `theme` | `light` / `dark` | Yes | `theme` | Sets `data-theme`, but `src/style.css:115` forces `color-scheme: only light` |
| `styles.variables` | Host CSS variables | Yes: "ChatGPT provides color and style values through `hostContext.styles.variables`" | — | No (owner's look, spec Q18) |
| `locale` | BCP 47 | Yes. "The host mirrors the locale to `document.documentElement.lang`." Also `_meta["openai/locale"]` on initialize and tool calls. | `locale` | No |
| `timeZone` | IANA | Not documented for ChatGPT | — | No |
| `userAgent` | "Host application identifier" (string) | ChatGPT's `window.openai.userAgent` is an **object**: `{ device: { type }, capabilities: { hover, touch } }`. A report says `device.type` is `mobile` in both the native app and mobile web. | `userAgent` | No |
| `platform` | `web` / `desktop` / `mobile` | Not in the docs. OpenAI's Bits & Bolts sample branches on `platform === "mobile"` and `=== "desktop"`, so ChatGPT very probably sends it. | — | No |
| `deviceCapabilities` | `touch`, `hover` | Not in the docs (the alias is inside `userAgent.capabilities`) | `userAgent.capabilities` | `touch` only (`app.ts:293`) |

Sources for the ChatGPT column: [Reference](https://developers.openai.com/plugins/reference); [Build a ChatGPT UI §Widget localization](https://developers.openai.com/plugins/build/chatgpt-ui); [OpenAI patterns §Host styles](https://github.com/openai/mcp-extensions/blob/main/docs/patterns.md#host-styles); [examples `src/types.ts`](https://github.com/openai/openai-apps-sdk-examples/blob/main/src/types.ts); [Bits & Bolts `controller.ts`](https://github.com/openai/mcp-extensions/blob/main/plugins/bits-and-bolts/src/app/controller.ts); [Report: native vs mobile web](https://community.openai.com/t/widget-fullscreen-bottom-clearance-how-to-distinguish-native-mobile-app-vs-mobile-web-browser/1379908) (2026-04-28).

The host sends changes as **partial** objects in `ui/notifications/host-context-changed` (theme, display mode, orientation, panel resize). The view must merge them. [MCP spec] The repo is correct here: `app.ts:349` reads the merged `app.getHostContext()`, not the partial update. [Repo]

---

## 4. Fullscreen: header, composer and insets

### 4.1 What the documents say

- The fullscreen layout has three parts: "**System close**: Closes the sheet or view", the content area, and "**Composer**: ChatGPT's native composer". "The ChatGPT composer remains overlaid." [UI guidelines](https://developers.openai.com/plugins/concepts/ui-guidelines)
- After a model reply, "an ephemeral, truncated snippet displays above the composer. Tapping it opens the chat sheet." [UI guidelines] No source says whether the insets grow while the snippet shows.
- "Design the experience to work with ChatGPT's composer, which remains available in fullscreen." [Build a ChatGPT UI](https://developers.openai.com/plugins/build/chatgpt-ui)
- "Respect ChatGPT's safe-area insets ... Keep content and controls clear of those edges." The sample "applies ChatGPT's insets at startup and whenever they change, then uses them as body padding". [OpenAI patterns](https://github.com/openai/mcp-extensions/blob/main/docs/patterns.md#safe-areas) (2026-10-09)
- The sample's CSS: `padding: var(--safe-area-top, env(safe-area-inset-top, 0px)) …` on one wrapper, with `viewport-fit=cover`. It adds no composer or header constant. It clamps each inset with `Math.max(0, value)` and removes the variable when the host sends no value. [Bits & Bolts `index.html`](https://github.com/openai/mcp-extensions/blob/main/plugins/bits-and-bolts/src/app/index.html), [`controller.ts`](https://github.com/openai/mcp-extensions/blob/main/plugins/bits-and-bolts/src/app/controller.ts) (2026-10-09)
- "Check entrypoint views at a few representative sizes, such as 375 × 812, 768 × 1024, and 1440 × 900." [OpenAI patterns §Responsive layouts]
- The commit that rewrote the spec on 2026-10-09 lists "docs: Remove native header documentation". No public spec text now describes the host header. [OpenAI spec commit `faf1c468`](https://github.com/openai/mcp-extensions/commit/faf1c46830c4b43bf8f9d69b79798335adba86b5)

### 4.2 Field reports (low trust)

| Platform | Report | Source |
|---|---|---|
| Mobile web | The composer overlays the widget bottom by "~102px". A reply says to use `window.openai.safeArea`; the poster confirms that it works. This suggests the bottom inset includes the composer on mobile web. | [Report](https://community.openai.com/t/widget-fullscreen-bottom-clearance-how-to-distinguish-native-mobile-app-vs-mobile-web-browser/1379908) (2026-04-28/29) |
| Desktop web, narrow window | A footer covers buttons at the bottom left. The reported bottom inset "does not appear to include the complete footer panel or its transparent hit area". OpenAI Support (2026-10-08) gave only general steps. | [Report](https://community.openai.com/t/apps-sdk-fullscreen-footer-overlay-blocks-widget-buttons-on-narrow-desktop-windows/1387319) (2026-07-17) |
| iOS app | A third-party plugin found that ChatGPT's title bar and composer covered its panel. Its fix reserves 92 px at the bottom **only** when a phone fullscreen view reports no insets; reported insets win. It removed a 110 px top floor because it "would have doubled the gap". The 92 px value is not confirmed on a device. | [Report: useorgx/orgx-mcp PR 497](https://github.com/useorgx/orgx-mcp/pull/497) (2026-10-09/10) |
| Web (old) | Fullscreen replaces the ChatGPT header with the app title and a left X. `maxHeight` was undefined in inline and fullscreen in the author's tests. | [Report: DEV / sunpeak](https://dev.to/abewheeler/chatgpt-app-display-mode-reference-49im) (2025-12-10, **old**, third party) |

### 4.3 The owner's iPhone reading: top about 102, bottom about 118

- **No document supports or rejects these numbers.** OpenAI publishes no inset values.
- **The documents support the model behind them:** the iframe fills the screen, and the insets mark the host header and composer. The OpenAI sample uses only the insets. The mobile-web report says the inset covers the composer. [OpenAI sample], [Report]
- **The numbers fit iOS geometry.** [Inference] On an iPhone with a 59-pt status-bar area (the repo harness value for 393 × 852), 102 − 59 = 43, about one 44-pt bar (system close and title). With a 34-pt home-indicator area, 118 − 34 = 84, about one composer. In a WKWebView with `width=device-width`, 1 CSS px = 1 pt, so these are also the CSS px values the app gets.
- **What it costs today.** [Inference] At 393 × 852, the frame is 852 − 102 − (96 + 118) = **536 px** tall. With the insets only, it is 852 − 102 − 118 = **632 px**. The app loses 96 px (15 %) of play height.
- **Confirm before the fix ships:** read the Display check line in Settings on the iPhone. It prints `safe {...}` and `containerDimensions` (`app.ts:234`). Record the values in the ticket.

---

## 5. Inline: height limit and auto-resize

- "Card layout can expand its height to match its contents up to the height of the mobile display area." "No nested scrolling. Cards should auto fit their content and prevent internal scrolling." [UI guidelines](https://developers.openai.com/plugins/concepts/ui-guidelines)
- MCP: with `maxHeight` (flexible), the view sets its height up to that limit, and the host "MUST listen for `ui/notifications/size-changed` notifications from the View and update the iframe dimensions accordingly". With fixed `height`, the view fills the container. [MCP spec §Container Dimensions](https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx)
- The ext-apps SDK (2.0.3 in the repo) sends `size-changed` from a `ResizeObserver` on `<html>` and `<body>`. Each time, it sets `<html>` to `height: max-content`, measures it, and sends `{ width: innerWidth, height }` only when a value changes. [Repo: `node_modules/@modelcontextprotocol/ext-apps/dist/src/app.js`, `setupSizeChangedNotifications`]
- ChatGPT's legacy call is `window.openai.notifyIntrinsicHeight(...)`. The troubleshooting page says: for mobile layout problems, "inspect `window.openai.displayMode` and `window.openai.maxHeight` ... Avoid fixed heights or hover-only actions." [Reference](https://developers.openai.com/plugins/reference); [Troubleshooting](https://developers.openai.com/plugins/deploy/troubleshooting)
- Known traps: `height: 100vh` with auto-resize grows without end; after fullscreen exit, a host can keep the fullscreen height (~900 px). [Report: ext-apps issue 502](https://github.com/modelcontextprotocol/ext-apps/issues/502) (2026-02-24, open)
- Android: inner scroll areas in an inline widget do not get vertical swipes. A reply calls this expected for inline cards. [Report](https://community.openai.com/t/android-chatgpt-app-scrollable-containers-inside-apps-sdk-widgets-do-not-receive-vertical-scroll-gestures/1383767) (2026-06-15)
- Windows desktop app: `notifyIntrinsicHeight` and `requestClose` are undefined, and `size-changed` with height 0 does not shrink the block. [Report](https://community.openai.com/t/bug-chatgpt-desktop-windows-ignores-all-close-resize-channels-for-mcp-app-widgets-empty-iframe-block-stays-in-the-chat-works-on-web/1401533) (2026-09-28)

**Repo status.** The inline home card is a fixed-size card (a 190 px title stage, the wordmark, two buttons) with no inner scroll and no viewport unit. When a game screen shows, the card hides and the frame is `position: fixed`, so the measured content height drops. After a fullscreen exit, the app shows the card again, and auto-resize sends its height. This fits the documents. No change is necessary. [Repo], [Inference]

---

## 6. How a widget should lay out

From the sources above, a widget that uses all its space does this. [Docs], [OpenAI spec], [MCP spec], with [Inference] where marked.

1. **Inline:** content-sized, no inner scroll, no `vh`/`dvh`, at most two actions. Let auto-resize report the height.
2. **Fullscreen:** fill the iframe. Take the four host insets off its edges. Use them as the only clearance for the host header and composer.
3. **Read the insets at mount and on each host-context change.** Clamp to ≥ 0. Treat a missing value as "host sent nothing", not as 0.
4. **Use a fallback only when the host sends nothing.** A fixed reserve on top of a host inset counts the composer twice. [Inference, as in the orgx PR]
5. **Do not use `env(safe-area-inset-*)` as the main signal in the iframe.** The widget meta has no `viewport-fit=cover`, and an iframe normally gets 0 from `env()`. Use it only as a fallback, as the sample does. [Inference]
6. **Keep primary controls away from the bottom edge.** The model's reply snippet shows above the composer for a short time. On mobile, a tap in the composer can return the widget to inline. [Docs], [Report]
7. **Change the mode only when the user taps.** On a remount, show the home card and let the user tap to go back to fullscreen. [OpenAI patterns], [OpenAI sample]
8. **Check layouts at 375 × 812, 768 × 1024 and 1440 × 900.** [OpenAI patterns]

---

## 7. The repo compared with the documents

| Item | Repo today | Documents | Verdict |
|---|---|---|---|
| Frame bottom | `calc(var(--composer-gap, 96px) + var(--safe-bottom))`, 128 px gap at ≥ 900 px (`app.css:7`, `:173`) | Insets are the clearance; no added gap | **Fault (probable): double reserve on iPhone.** |
| "Found" dialog | Same `calc(... composer-gap + safe-bottom)` (`screens/lobby.css:16`); `wait.ts:129` opens it with `showModal()`, so it is placed against the viewport | Same | Must change together with the frame. |
| Frame top/left/right | `--safe-top/left/right` (`app.css:7`) | Same | Correct. |
| Inline root | `#app-root` padding with all four insets (`app.css:4`) | No document says what ChatGPT sends inline | Correct if inline insets are 0. Check on device. |
| Inset source | `safeAreaInsets ?? 0` per edge (`app.ts:294`) | Sample clamps to ≥ 0 and removes the variable when absent | Add `Math.max(0, …)`. Small. |
| Mode change at mount | `fullscreen()` with no tap when the saved screen is not home or a screen is queued (`app.ts:218`, `:220`) | "Change modes in response to a user interaction"; "will fail if called programmatically" | **Fault (probable).** When it fails, the home card shows "Open the app with the host's expand control." (`app.ts:254`). |
| Mode change on tap | Play / Your games call `fullscreen()` (`app.ts:345–346`) | Allowed: a user action that opens content | Correct. No mode button. |
| Fullscreen → inline | Home card returns, game screen kept in `resume` (`app.ts:295–297`) | Mobile can drop to inline when the composer opens | Correct. |
| `platform`, `userAgent`, `locale`, `timeZone`, `styles` | Not read | Optional | No change needed for layout. `locale` / `timeZone` can format game start times. |
| Theme | `color-scheme: only light`; body has the parchment floor | Theme is optional; host styles are optional | Check the inline card in ChatGPT dark mode (a light block in a dark chat). Taste item. |
| Display check | Shows insets, mode and `containerDimensions` for seat/board only (`app.ts:230–236`) | — | Useful. Also keep the last **inline** context so one screenshot shows both. Remove when ticket 21 closes. |
| QA harness iPhone persona | top 59 / bottom 34 (`plugin-qa-protocol.md:46`) | — | Add ChatGPT-host personas (see §8). |

---

## 8. What to change (small, in order)

1. **One bottom clearance, used in both places.** [Inference, from §4] In `src/plugin/app.css` define the reserve once and use it in `.frame` and in `screens/lobby.css:16`:

   ```css
   :root { --frame-bottom: max(var(--safe-bottom, 0px), var(--composer-gap, 96px)); }
   .frame { bottom: var(--frame-bottom); }
   ```

   `max()` takes the host inset when the host reports the composer (iPhone: 118 > 96). It keeps the old floor when the host reports little or nothing. Keep `--composer-gap: 128px` at ≥ 900 px until the web and desktop Display check values are known. Risk: if a host reports only the home-indicator area (34) and not the composer, `max()` gives 96 instead of 130. Test the iPhone value first.
2. **No mode request without a tap.** In `app.ts:218` and `:220`, when the widget mounts inline, keep the screen in `resume` and show the home card. Do not call `fullscreen()`. The Play button already resumes. When the widget mounts in fullscreen, show the screen at once (no request needed).
3. **Clamp insets** in `hostContext()` (`app.ts:294`): `Math.max(0, context.safeAreaInsets?.[edge] ?? 0)`.
4. **Harness personas** (`docs/qa/plugin-qa-protocol.md`, `tools/plugin-ios-size.test.ts`): add "ChatGPT iPhone fullscreen" `{ top: 102, bottom: 118 }` (from the owner's screenshot; replace with the recorded values), "host sends nothing" `{0,0,0,0}` (fallback floor) and "device only" `{ top: 59, bottom: 34 }`. Assert the frame height for each.
5. **Display check:** add the last inline host context to the line. Ask the owner for one screenshot each on iPhone, Android, web and desktop. Remove the line when ticket 21 closes.

Not recommended now: reading `containerDimensions` for the frame size (the iframe viewport already is the container), turning off auto-resize (it works here), or user-agent tests (a report says `device.type` cannot tell native from mobile web).

**Owner question (taste, not a fault):** OpenAI now says "Prefer `fullscreen` for most interactive apps". The app shows an inline home card first (`preferredDisplayMode: 'inline'`, spec Q25). Keep the inline home card, or open the game fullscreen at once when the model calls `kingdown_open`? Mobile still drops to inline when the composer opens, so the home card stays necessary either way.

---

## 9. Device checks to record

For each of iPhone, Android, web (wide and 390 px) and desktop app, record:

- inline: `displayMode`, `safeAreaInsets`, `containerDimensions`, the last size sent;
- fullscreen: the same, plus the frame box and board box from the Display check;
- fullscreen after a model reply (the snippet above the composer): do the insets change?
- fullscreen, then tap the composer: does the mode go to inline? Does the widget remount (the saved screen comes back)?
- iPhone keyboard open in the name field: do the insets or the viewport change?
- Android fullscreen: do the setup lists scroll? (The inline swipe report is for inline only.)

---

## 10. Open questions

1. What exact insets does ChatGPT send on Android, web and desktop in fullscreen? No source gives them.
2. Does ChatGPT send `containerDimensions` and `availableDisplayModes` in the host context? Not documented.
3. Do the insets include the reply snippet above the composer? Not documented.
4. Does the iOS composer tap remount the iframe or only change the mode? The first poster suspects a new iframe load for the chat sheet. The second poster logged an unchanged iframe mount ID on iOS, which points to a mode change only. Not confirmed by OpenAI. (corrected in check)

---

## Sources (all read 2026-10-15)

OpenAI, official:

- Reference — https://developers.openai.com/plugins/reference (undated)
- Build a ChatGPT UI — https://developers.openai.com/plugins/build/chatgpt-ui (undated; `/apps-sdk/mcp-apps-in-chatgpt/` serves the same page)
- UI guidelines — https://developers.openai.com/plugins/concepts/ui-guidelines (undated; the plugin guidelines call it "optional")
- Troubleshooting — https://developers.openai.com/plugins/deploy/troubleshooting (undated)
- Plugin guidelines ("Plugins must function reliably in ChatGPT on both desktop and mobile, including any UI components") — https://developers.openai.com/plugins/plugin-guidelines (undated)
- OpenAI MCP Extensions spec — https://github.com/openai/mcp-extensions/blob/main/docs/spec.md (commit `faf1c468`, 2026-10-09)
- OpenAI MCP Extensions patterns — https://github.com/openai/mcp-extensions/blob/main/docs/patterns.md (2026-10-09)
- OpenAI MCP Extensions changelog 0.2.0 — https://github.com/openai/mcp-extensions/blob/main/CHANGELOG.md (2026-10-10)
- Bits & Bolts sample — https://github.com/openai/mcp-extensions/tree/main/plugins/bits-and-bolts/src/app (2026-10-09)
- Apps SDK examples: `src/types.ts`, `src/request-display-mode/App.tsx` (committed 2026-04-07; corrected in check), `src/pizzaz/index.jsx` (2025-12-17, old) — https://github.com/openai/openai-apps-sdk-examples

MCP Apps standard:

- Spec, stable 2026-01-26 — https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx
- Spec, draft (last change 2026-07-22) — https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/draft/apps.mdx
- Patterns (safe areas) — https://github.com/modelcontextprotocol/ext-apps/blob/main/docs/patterns.md (2026-07-15)
- Migration from the OpenAI Apps SDK — https://github.com/modelcontextprotocol/ext-apps/blob/main/docs/migrate_from_openai_apps.md (2026-07-15)
- Issue 502 (autoResize traps) — https://github.com/modelcontextprotocol/ext-apps/issues/502 (2026-02-24, open)
- Package in the repo: `node_modules/@modelcontextprotocol/ext-apps` 2.0.3 (`dist/src/spec.types.d.ts`, `dist/src/app.js`)

Reports (low trust):

- Native vs mobile web bottom clearance — https://community.openai.com/t/widget-fullscreen-bottom-clearance-how-to-distinguish-native-mobile-app-vs-mobile-web-browser/1379908 (2026-04-28)
- Desktop footer overlay — https://community.openai.com/t/apps-sdk-fullscreen-footer-overlay-blocks-widget-buttons-on-narrow-desktop-windows/1387319 (2026-07-17; support reply 2026-10-08)
- Mobile exits fullscreen when the composer opens — https://community.openai.com/t/mobile-plugin-exits-fullscreen-when-opening-composer-chat/1395180 (2026-09-06)
- Android inline nested scroll — https://community.openai.com/t/android-chatgpt-app-scrollable-containers-inside-apps-sdk-widgets-do-not-receive-vertical-scroll-gestures/1383767 (2026-06-15)
- Windows desktop ignores resize/close — https://community.openai.com/t/bug-chatgpt-desktop-windows-ignores-all-close-resize-channels-for-mcp-app-widgets-empty-iframe-block-stays-in-the-chat-works-on-web/1401533 (2026-09-28)
- useorgx/orgx-mcp PR 497 (iOS host chrome, 92 px fallback) — https://github.com/useorgx/orgx-mcp/pull/497 (2026-10-09)
- DEV / sunpeak display-mode reference — https://dev.to/abewheeler/chatgpt-app-display-mode-reference-49im (2025-12-10, old)

Repo: `src/plugin/app.ts`, `src/plugin/app.css`, `src/plugin/screens/lobby.css`, `src/plugin/screens/wait.ts`, `src/plugin/server.ts`, `src/plugin/index.html`, `src/style.css`, `src/ui/table.css`, `docs/qa/plugin-qa-protocol.md`, `docs/specs/chatgpt-mvp/notes/f-host.md`, `docs/specs/chatgpt-mvp/issues/21-iphone-test-fixes.md`, `docs/specs/plugin-submission/map.md`.
