# F-host: ChatGPT host facts that shape the King Down MVP UI

Explorer note, 2026-10-11. Read only. Sources: repo research (listed per section), the live plugin code on `main`, `node_modules/@modelcontextprotocol/ext-apps` 2.0.3, and official OpenAI pages fetched today (URLs cited). "Repo" = a fact from this repository. "Docs" = a fact from an official page, read on 2026-10-11. "Inference" = my conclusion.

---

## 0. Ten facts the planner must not miss

1. **One board resource exists today, and it is near its size limit.** The built HTML is one self-contained file (all JS, CSS and art inlined). The last release measured **4,293,039 JSON bytes**. The build fails above **4,400,000 bytes** (`tools/plugin-ui-build.mjs:16`, `tools/plugin-server-check.mjs:68`). The ceiling is a "response budget" (Vercel function response limit, about 4.5 MB). Headroom is about **100 KB**. New art for king coins, card faces, a profile scroll and badges does not fit if it is inlined. This is the largest technical risk for the MVP UI.
2. **ChatGPT supports `inline` and `fullscreen` only. PiP is not supported.** Quote: "ChatGPT supports `inline` and `fullscreen`, but not `pip`." ([openai/mcp-extensions spec](https://raw.githubusercontent.com/openai/mcp-extensions/main/docs/spec.md)). Other OpenAI pages still list PiP. Do not design for PiP.
3. **The owner removed the in-board Fullscreen button** after the iPhone test on 2026-10-08 (`docs/specs/match-foundation/issues/11-phone-controls.md`, "The owner asks to remove Fullscreen"). The board now works inline on iPhone. The rejection is of the *in-board Fullscreen control*, not proof that a host-chosen fullscreen launch is bad. Do not add the button back without the owner's yes.
4. **Inline card rules are strict:** at most 2 actions, "No deep navigation or multiple views within a card", "No nested scrolling" ([UI guidelines](https://developers.openai.com/plugins/concepts/ui-guidelines)). A multi-screen app (home, setup, board, profile, settings) in an *inline* card breaks the letter of this rule. Fullscreen is the documented place for "rich tasks" and multi-step work.
5. **No custom fonts, even in fullscreen.** Quote: "Don't use custom fonts, even in full screen modes." UI text uses the system font stack. Art (pieces, coins, cards, scroll) in images or canvas is allowed.
6. **The model sees `content` and `structuredContent`. Only the board sees result `_meta`.** ([UI reference](https://developers.openai.com/plugins/reference)). Today `src/plugin/server.ts:22` puts the whole `MatchView` (position, legal moves) in `structuredContent`. Research says to move it to `_meta` for games between people.
7. **Widget state is presentation state for one board instance.** It is not durable storage. Use `window.openai.setWidgetState` (ChatGPT extension; not in the MCP Apps standard). Profile, game registry, settings and setup choices must live on the server.
8. **App-only tools exist:** `_meta.ui.visibility: ["app"]` hides a tool from the model. Today 7 of 8 tools are app-only; only `kingdown_open` is `["model","app"]` (`src/plugin/server.ts:21`).
9. **ChatGPT cannot push.** No consumer notification for plugins. MCP Events works only in Work chats and "dots", and it starts a task; it does not update the board. Turn alerts must come from email or web push from King Down.
10. **Review bans ads, upsell and selling digital goods,** and bans "trial or demo plugins". Unlocks must be free (the MVP has "all unlocked": good). Content must suit ages 13–17. Reviewers need a demo account without MFA.

---

## 1. What exists in the repo today

### 1.1 Plugin code (main, `src/plugin/`)

| File | Lines | What it does |
|---|---|---|
| `server.ts` | 43 | `createPluginServer()`. One resource `ui://kingdown/board-<sha256 of HTML>.html` (line 15). Resource `_meta.ui`: `domain: origin`, `csp: { resourceDomains: [], connectDomains: [] }` (line 16). Eight tools, all carry the board `resourceUri`. |
| `app.ts` | 117 | The board UI. Uses `App` from `@modelcontextprotocol/ext-apps` and `window.openai.widgetState / setWidgetState`. Polls `kingdown_get` every 3 s in friend games while visible (lines 108–110). |
| `index.html` | 1 | Single page: status line, board, move hint, move choices, error, nav (Reload, Retry move, Computer move, Invite friend), a `<details>` "Games" menu (New solo game, New friend game, Resume game, Join with token). |
| `auth.ts`, `consent*.ts`, `http.ts` | — | Supabase OAuth 2.1, consent page, HTTP `/mcp` transport. |

Tools registered (`server.ts:29–42`):

| Tool | Visibility | `readOnlyHint` | Purpose |
|---|---|---|---|
| `kingdown_open` | model + app | false | Opens or resumes a board; the launch tool. |
| `kingdown_create` | app | false | New `solo` or `friend` game. |
| `kingdown_resume` | app | false | Latest game. |
| `kingdown_get` | app | **true** | Reload the authoritative board (poll). |
| `kingdown_move` | app | false | One legal move (`lan`), command ID + expected revision. |
| `kingdown_computer` | app | false | Computer plays its turn. |
| `kingdown_invite` | app | false | Friend invite token. |
| `kingdown_join` | app | false | Join with a token. |

All tools set `destructiveHint: false`, `openWorldHint: false`.

Fixed setup today: `DEFAULT_SETUP = { backRank: 'RAGQKMSO', kings: 'Flame:Haste,Frost:Freeze' }` (`server.ts:8`). No setup choice reaches the server. No toggles, no king choice, no arrangement, no cards.

### 1.2 Host test history (repo)

| Date | Result | Source |
|---|---|---|
| 2026-10-08 | iPhone ChatGPT app: board taps, Computer move and reopen pass after repairs. Owner notes "a slight delay" after a tap (server save round trip). Fullscreen control removed at owner request. | `docs/specs/match-foundation/issues/11-phone-controls.md` |
| 2026-10-08 | Desktop: solo and two-player play, seats, consent denial, refresh, reconnect, reopen pass. | `issues/06-live-acceptance.md` |
| — | Inline reopening works with no fullscreen change. | `issues/09-reopen-selected-game.md:45` |
| 2026-10-10 | ChatGPT caches the resource by URI. A fixed URI kept old controls. Fix: hash of the HTML in the URI; "Refresh tools" on the connection and a **new conversation** load the new build. Old conversations can keep the old resource. | `issues/16-board-resource-cache.md` |
| — | Android ChatGPT app: **no test on record.** | `docs/research/multiplayer-2026-10-10/03-technical.md` §7 |

### 1.3 Repo research documents read

- `docs/research/chatgpt-plugin-feasibility-2026-10-07.md` — product direction: "the game itself is the main feature"; PiP optional; chat interaction not required.
- `docs/research/chatgpt-plugin-environment.md` — host experiment matrix; system fonts; iframe is replaceable; docs disagree on inline start vs fullscreen-only launch.
- `docs/research/chatgpt-plugin-preparation.md` — one engine, shared match module, server owns the game.
- `docs/research/chatgpt-chess-market.md` — competitors (Chessy, Smart Chess, Max Health with a multiplayer lobby); King Down's difference is its own game and art.
- `docs/research/multiplayer-2026-10-10/03-technical.md` §4.5–4.7, 6.4, 7, 7.1, 8.3, 8.7 and `01-user-journey.md` §6 — the most current and detailed ChatGPT findings.

---

## 2. The MCP Apps bridge (ext-apps 2.0.3) — what the board can do

Package: `node_modules/@modelcontextprotocol/ext-apps`, version 2.0.3, protocol `LATEST_PROTOCOL_VERSION = "2026-01-26"` (`dist/src/spec.types.d.ts`). The repo server still uses `@modelcontextprotocol/sdk` ^1.32.1 (`package.json:40`); ext-apps 2.x says the wire protocol is unchanged from 1.x.

### 2.1 `App` methods (`dist/src/app.d.ts`)

| Method | Use for King Down | ChatGPT notes |
|---|---|---|
| `connect()` | Handshake (`ui/initialize`); returns host capabilities and context. Auto-resize starts here. | Supported. |
| `callServerTool({name, arguments})` | Every board action: setup, move, poll, profile read. No model turn. | Supported (`tools/call`). |
| `readServerResource`, `listServerResources` | Read server resources through the host. | Host capability `serverResources`; not confirmed for ChatGPT. |
| `sendMessage({role:"user", content})` (`ui/message`) | "Ask ChatGPT about this position." Starts a model turn. | Supported. On mobile it goes to the active chat only (repo 03 §7). |
| `updateModelContext({content, structuredContent})` | Quiet context for the next user turn. Each call replaces the last one. | Supported. Note: `app.ts:36` calls it only when `setWidgetState` is missing, because widget state also feeds the model. |
| `openLink({url})` (`ui/open-link`) | "Open on kingdown.dev", privacy, terms. | ChatGPT also has `window.openai.openExternal({href, redirectUrl})`; the legacy CSP `redirect_domains` is "still required for `openExternal` targets" ([reference](https://developers.openai.com/plugins/reference)). |
| `downloadFile` | Export a game (PGN-like). | Host capability `downloadFile`; not confirmed for ChatGPT. |
| `requestDisplayMode({mode})` | `inline` / `fullscreen` / `pip`. Host returns the mode it actually set. | ChatGPT: inline and fullscreen only. |
| `sendSizeChanged`, `setupSizeChangedNotifications` | Height reporting. `autoResize` defaults to `true` (ResizeObserver on `html` and `body`). | ChatGPT also has `window.openai.notifyIntrinsicHeight`. |
| `requestTeardown()` | Ask the host to close the view. | `window.openai.requestClose()` is the ChatGPT form. |
| `createSamplingMessage` | LLM call from the view. | Host capability `sampling`; do not plan on it. |
| `getHostContext()`, `onhostcontextchanged` | See 2.2. | — |
| `ontoolinput`, `ontoolinputpartial`, `ontoolresult`, `ontoolcancelled` | Initial tool data. | ChatGPT can replay an old first result on reload; iOS sometimes sends none (repo 03 §4.5). Always fetch at mount. |
| `onteardown` | Stop polling, flush. | `ui/resource-teardown`. Host can tear down at any time. |

### 2.2 Host context fields (`McpUiHostContext`)

`toolInfo`, `theme` (`light`/`dark`), `styles` (CSS variables such as `--color-background-primary`, `--font-sans`; `css.fonts`), `displayMode`, `availableDisplayModes`, `containerDimensions` (`height` or `maxHeight`, `width` or `maxWidth`), `locale`, `timeZone`, `userAgent`, `platform` (`web` | `desktop` | `mobile`), `deviceCapabilities` (`touch`, `hover`), `safeAreaInsets` (`top`, `right`, `bottom`, `left`).

ChatGPT also has `window.openai` globals: `theme`, `displayMode`, `maxHeight`, `safeArea`, `view`, `userAgent`, `locale` ([reference](https://developers.openai.com/plugins/reference)). ChatGPT-specific host key: `hostContext["openai/deepLink"]` (`url`) for global entrypoints ([spec](https://raw.githubusercontent.com/openai/mcp-extensions/main/docs/spec.md)).

Style helpers (`dist/src/styles.d.ts`): `applyDocumentTheme(theme)`, `applyHostStyleVariables(styles)`, `applyHostFonts(fontCss)`, `getDocumentTheme()`.

### 2.3 Resource metadata (`McpUiResourceMeta`) and CSP

| Key | Meaning |
|---|---|
| `csp.connectDomains` | `connect-src` (fetch, XHR, WebSocket). Empty = no network. Today: `[]`. |
| `csp.resourceDomains` | `img-src`, `script-src`, `style-src`, `font-src`, `media-src`. Wildcard subdomains allowed. Empty = no external assets. Today: `[]`. |
| `csp.frameDomains` | Nested iframes. Empty = `frame-src 'none'`. |
| `csp.baseUriDomains` | `base-uri`. |
| `permissions` | `camera`, `microphone`, `geolocation`, `clipboardWrite`. Hosts MAY honour. Use feature detection. `clipboardWrite` matters for "Copy invite link". |
| `domain` | Dedicated sandbox origin. **Required for plugins with UI and unique per plugin** in ChatGPT ([reference](https://developers.openai.com/plugins/reference)). Today: `origin` of the public server. |
| `prefersBorder` | Bordered card hint. ChatGPT alias `openai/widgetPrefersBorder`. |

ChatGPT-only resource keys ([reference](https://developers.openai.com/plugins/reference)): `_meta["openai/ui"].availableDisplayModes` (and `preferredDisplayMode` per the spec) — a fullscreen-only board uses `["fullscreen"]`; `_meta["openai/widgetDescription"]` (summary for the model when the view loads); `_meta["openai/widgetCSP"]` legacy snake_case (`connect_domains`, `resource_domains`, `frame_domains`, `redirect_domains`). Repo 03 §4.5 advises declaring CSP in **both** `_meta.ui.csp` and `openai/widgetCSP` because of a June 2026 CSP report, and notes that an `https://` entry does not allow `wss://`.

### 2.4 Tool metadata (`McpUiToolMeta`)

- `resourceUri`: the view to render. Docs: "Associate the resource URI with only the tools that should render the component." The decoupled pattern puts it only on render tools ([chatgpt-ui](https://developers.openai.com/plugins/build/chatgpt-ui)). **Today all 8 tools carry it** (`server.ts:21`). Repo research (01 §6.2) says a template on every tool makes ChatGPT re-render too often. Fix: only `kingdown_open` (and any other launch tool) carries it.
- `visibility`: `["model"]`, `["app"]` or both. Default both.
- ChatGPT extras: `openai/toolInvocation/invoking` and `/invoked` (status text, max 64 characters), `openai/profile: true` (profile tool), `securitySchemes`.
- Annotations `readOnlyHint`, `destructiveHint`, `openWorldHint` are required booleans for review; `idempotentHint` optional.

---

## 3. Display modes — what is allowed, what is rejected

| Mode | ChatGPT status | Owner / repo position |
|---|---|---|
| Inline card | Default. "Every app initially appears inline." Max 2 actions. No deep navigation, no tabs, no nested scrolling. Height grows to content, up to the mobile display height. | Board runs inline today; passes on iPhone and desktop. |
| Inline carousel | 3–8 items, each with an image and at most one action. | Proposed in research for "Your games" (01 §6.2). |
| Fullscreen | Supported. For "rich tasks" and multi-step work. The system composer stays overlaid: "Design your UX to work with the system composer." All entrypoints (sidebar, thread panel) open fullscreen. Fullscreen has an "open in app" target, set by `window.openai.setOpenInAppUrl({href})`. | **The in-board Fullscreen button was removed** at the owner's request after the iPhone test (ticket 11). The research (01 §6.2, 03 §4.5) still recommends a fullscreen board; that recommendation predates or ignores the owner's removal. **Open question for the owner.** |
| PiP | **Not supported by ChatGPT** (mcp-extensions spec). Other OpenAI pages still list it. On mobile PiP shows as fullscreen. | Optional in all research; local test in a ChatGPT project also found PiP unavailable. Do not build. |

Known fullscreen problems (repo, community reports): Android blank fullscreen (July–Sept 2026, [thread](https://community.openai.com/t/bug-android-fullscreen-is-blank-even-with-an-sdk-free-minimal-widget-web-works/1396512)); at 390 px the side chat had zero width and the floating composer could hide low controls (feasibility report). These support the owner's choice.

Docs disagree: the UI guide says every app starts inline; the reference allows a fullscreen-only component (`availableDisplayModes: ["fullscreen"]`). Repo environment research lists this as unresolved; no support inquiry is sent.

**Inference.** The MVP has many screens. Two compliant shapes exist:
- (A) Inline-first: the inline view shows only *one* screen at a time, each screen fits without inner scroll, and each "screen change" is a full swap, not a tab or drill-in. This bends "no multiple views within a card".
- (B) The board and menus run in one view that the user can expand with the **host's own** fullscreen control (no King Down button). This keeps the owner's removal.
The rule risk is review, not runtime: runtime accepts any HTML.

---

## 4. One resource with client routing vs several tools/resources

### 4.1 Facts

- Resources are cached by URI; each change needs a new URI (docs; repo ticket 16). Several resources = several caches, several hashes, several payloads near the size limit.
- Every resource needs the same unique `domain`; CSP is per resource.
- A render tool mounts a **new iframe instance** each time the model calls it. Each instance has its own widget state. Moving between screens by model tool calls creates a new card in the chat for each screen.
- App-only tools (`callServerTool`) update the **same** iframe with no model turn and no new card.
- Global entrypoints support deep links into "a particular page" of one app (`openai/deepLink`). This assumes one app with internal pages, i.e. client routing.
- Workspace-imported plugins with MCP servers are desktop only; Free/Go web extensions are "coming soon" (entrypoints are not universal) ([extensions](https://developers.openai.com/plugins/build/extensions)).

### 4.2 Recommendation (inference)

**One resource, one app, client-side routing.** Screens: `home`, `setup` (with sub-menus: piece pool, cards, king picker), `board`, `profile` (scroll, badges), `settings`. Navigation calls app-only tools for data; it never asks the model to change screens. Reasons:
- one cache key, one CSP, one payload budget;
- no new chat card per screen, no model latency;
- the deep-link format (`openai/deepLink`) and entrypoints already assume internal pages;
- the current `kingdown_open` launch path and all live tests stay valid.

Give `kingdown_open` an optional `screen` argument (`home` | `board` | `profile`) and an optional `matchId`. The model calls it for "play King Down", "show my profile", "open my game". This is the only model-visible render tool. Keep the router state (current screen, open sub-menu) in widget state so a remount returns to the same screen.

Use model-visible **data-only** tools (no `resourceUri`) for questions the model answers in text: "is it my turn?", "my stats". Research names `kingdown_games`, `kingdown_stats` (03 §4.5).

Avoid: one resource per screen; a separate tool per screen with its own template; inline carousels as the main navigation (they cap at 8 items and add chat clutter).

---

## 5. State: where each kind lives

| Data | Where | Why |
|---|---|---|
| Match (position, history, revision, setup: pool, arrangement, cards, kings, powers) | Server (`plugin_matches`, Supabase) | Server owns legality; host can tear down the iframe any time. |
| Profile: games registry, results, score, achievements, unlocks | Server, keyed by Supabase user UUID | Must match the website; widget state is per instance. |
| Settings (graphic mode "symbols only") | Server (user settings row; `user_data` already holds settings, repo 03 §"What King Down has today") | Must survive new conversations and devices. Mirror in widget state for instant paint. |
| Game-setup draft (toggles before "Start") | Widget state; optional server draft | Presentation state for one instance. |
| Current screen, open sub-menu, selected square, board ID, pending command | Widget state (`setWidgetState`) | Today `app.ts:23` saves `{matchId, revision, pending}`. Research: keep only board ID + pending. |
| Anything in `localStorage` | Nowhere | Docs: avoid `localStorage` for core state; storage partitioning is not documented. |

Facts on widget state: read `window.openai.widgetState`, write `window.openai.setWidgetState(state)` (synchronous). It is ChatGPT-only (feature-detect). Structured form: `modelContent` (model sees), `privateContent` (UI only), `imageIds`. **Widget state reaches the model** unless put under `privateContent` — so do not put the opponent handle, the full position or hidden cards in plain widget state. No size limit is documented. The MCP Apps standard has no widget-state method; other hosts get nothing.

The server has a structured-settings extension (`openai/settings` with `readTool` and `updateTool`; "MCP Servers are responsible for persisting settings"; the app renders in a modal on top of settings) ([spec](https://raw.githubusercontent.com/openai/mcp-extensions/main/docs/spec.md)). Client support is not documented on the extensions page. Not needed for the MVP; an in-app settings screen is simpler and works everywhere.

Mount rules (repo 03 §4.5, verified in tickets 05/09): treat every mount as a cold start; call `kingdown_get` at mount; ignore the replayed first tool result; draw only the highest revision.

---

## 6. What the model sees and must not see

Visibility (docs): `content` and `structuredContent` → model and view, and they enter the transcript. Result `_meta` → view only. Widget state `modelContent` → model; `privateContent` → view only. `updateModelContext` → model on the next user turn.

| Data | Model? | Today | MVP rule |
|---|---|---|---|
| Full position, legal moves | No (games vs people); OK vs computer | In `structuredContent` (`server.ts:22`) | Move to `_meta`; `structuredContent` = short summary ("Your move, move 14"). Stops the model acting as a free engine helper in human games. |
| Opponent handle, preset messages | No | — | `_meta` only (prompt-injection path through handles). |
| Hidden cards (opponent hand, draw pile) | No — and not to the opponent's view either | Not built | Per-seat view on the server. `_meta` hides from the model, **not** from the user's browser. MVP cards are "the same 4 for both players" — if they are public, no hidden data. Confirm with the cards area. |
| Setup choices (kings, powers, pool) | Yes, harmless | — | May go in the summary so "what king am I playing?" works. |
| Profile score, achievements | Yes | — | Fine; useful for "how am I doing?". |
| Email, real name, Supabase tokens | Never | — | Profile tool returns `id` (UUID) and `name` (handle) only. |

Server rule (docs, [plugin guidelines](https://developers.openai.com/plugins/plugin-guidelines)): "Your MCP server must not pull, reconstruct, or infer the full chat log." Collect minimum data.

`ui/message` ("Ask ChatGPT") only on user request, only vs the computer or in casual games (repo 03 §8.7, 01 §6.6). Never announce moves.

---

## 7. Tool visibility and approval prompts

- App-only tools: `_meta.ui.visibility: ["app"]` (ChatGPT compat: `openai/visibility: "private"`, `openai/widgetAccessible`).
- Hints decide prompts in part: a write tool (`readOnlyHint: false`) can show an approval dialog. User settings also matter: "Always ask", "Allow read actions", "Allow low-risk actions" (default), "Allow all actions" (repo 03 §4.5, Help Center snippets). With "Always ask" even reads prompt.
- `readOnlyHint: true` only if the tool changes nothing (a log write counts). OpenAI's own Cards Against AI sample breaks this; do not copy it.
- `destructiveHint: true` on resign, abort, accept draw, claim → ChatGPT asks.
- Live record: `kingdown_move` (write) showed no prompt problem on 2026-10-08.
- OpenAI safety checks sometimes block a call before it reaches the server; plain tool names and descriptions reduce this. Retry once, then offer "Open on kingdown.dev".

MVP tool shape (inference, built on repo 03 §4.5):

| Tool | Visibility | Hints | Note |
|---|---|---|---|
| `kingdown_open` | model + app | write | Only tool with `resourceUri`. Args: `screen?`, `matchId?`. |
| `kingdown_create` | app (+ model optional) | write | Takes the setup object: `opponent` (computer/friend/random), `fairy`, `pool[]`, `arrangement`, `classic`, `cards`, `cardPool[]`, `kingPowers`. |
| `kingdown_setup_seat` (new) | app | write | Joiner's king, power and arrangement. |
| `kingdown_get` | app | read-only (strict) | Poll; `since_revision`. |
| `kingdown_move`, `kingdown_computer` | app | write | As today. |
| `kingdown_invite`, `kingdown_join` | join: model + app | write | Join accepts link, token or short code. |
| `kingdown_seek` (new, matchmaking) | app | write | Random opponent. |
| `kingdown_profile` | model + app | read-only | `openai/profile: true`. |
| `kingdown_games` | model | read-only | "Is it my turn?" |
| `kingdown_settings_get/set` (new) | app | read / write | Symbols-only mode. |
| `kingdown_resign` | model + app | destructive | — |

Keep tool names unique, plain verbs, honest descriptions; no steering about other plugins (plugin guidelines).

---

## 8. Limits

| Limit | Value | Source | Effect on MVP |
|---|---|---|---|
| Resource payload | Build fails > 4,400,000 bytes; current 4,293,039 | Repo build scripts; ticket 16 | **New art cannot be inlined.** Serve images from the plugin's own origin and list it in `resourceDomains` (and `openai/widgetCSP.resource_domains`). Test on all clients; repo notes `connect_domains` failures in published apps. |
| Resource caching | URI = cache key | Docs; ticket 16 | Hash in URI (done). Old chats keep old builds. Asset URLs should also be content-hashed. |
| CSP | Everything external must be declared; nested frames blocked | Docs | Today nothing external is declared. Adding Supabase Realtime needs `wss://` and `https://` entries. |
| Fonts | No custom fonts, even fullscreen | [UI guidelines](https://developers.openai.com/plugins/concepts/ui-guidelines) | Menus, toggles, labels in system fonts. Decorative lettering only inside images. |
| Colors | Brand color on primary buttons, accents, badges; not on text, text backgrounds or core components; no custom gradients/patterns | UI guidelines | Painted look stays in art, not in the UI chrome. Review risk if the whole UI is themed. |
| Icons | System icons or monochrome outlined custom icons; no own logo in the response (ChatGPT adds it) | UI guidelines | The "symbols only" piece mode fits this style. |
| Accessibility | WCAG AA contrast, alt text, text resizing | UI guidelines | — |
| Status text | `openai/toolInvocation/*` ≤ 64 chars | Reference | — |
| Tool call rate | No documented limit; one forum report of "Resource not found" after 10–20 calls (fix said deployed 2026-07-19) | Repo 03 §4.5 | Soak test before relying on 2 s polls. |
| Per-call overhead | ChatGPT can send a new `initialize` before each `tools/call`; ~1–3 s host overhead (low confidence) | Repo 03 §4.5 | Owner already felt "a slight delay" per move. Draw the move optimistically, then confirm. |
| Server function | `maxDuration: 30` s on Vercel (`tools/plugin-server-build.mjs:40`) | Repo | Computer search must stay bounded. |
| Workers, OffscreenCanvas, autoplay, background life | Not documented | Repo environment research | Today no browser worker is used; server validates and searches. |
| Unknown | Numeric limits for `structuredContent`, `_meta`, widget state | Docs give none | Keep views compact. |

---

## 9. Mobile behaviour

- Owner's main test client is the **iPhone ChatGPT app**; inline board passes there (2026-10-08).
- `platform`, `deviceCapabilities.touch`, `safeAreaInsets`, `containerDimensions.maxHeight` come from host context — use them for layout, not user-agent sniffing.
- Inline cards grow to the content height, up to the mobile display height. Keep each screen within one viewport height; no inner scrolling.
- Composer overlay can hide bottom controls in fullscreen. Keep primary actions high, respect `safeAreaInsets.bottom`.
- iOS: sometimes no tool input/result after `initialize` (fetch at mount covers it); does not echo `Mcp-Session-Id`.
- Android: no test on record; reports of blank board (skipped `resources/read`, since April 2026, open) and blank fullscreen. Required test before claiming support. Deep links do not work on Android.
- `ui/message` on mobile goes only to the active chat.
- Background: the board pauses or is torn down; no documented lifetime. Stop polls on `visibilitychange` hidden and on teardown; fetch on return.
- Plugins that a workspace imports from a marketplace with MCP servers are "Desktop only". A custom MCP server added on the web does reach the phone apps (owner's iPhone works).
- Voice mode: unclear whether plugins run. Group chats: unverifiable. Do not plan on either.

---

## 10. Multiplayer: host constraints

- Each player plays in their **own private chat**. No shared thread, no share sheet, no contact picker. Invites travel as `https://kingdown.dev/j/<token>` links (plus a 6-character short code) through any messenger.
- **Before a public listing**, a friend can use the plugin only by adding a custom MCP server by hand on ChatGPT web (Developer mode on some accounts, "Elevated risk" warning). So normal invitees must play on **kingdown.dev** (crossplay). Matchmaking against a random user inside ChatGPT needs a public listing and enough concurrent players.
- **No push.** The board learns of the opponent's move only by polling `kingdown_get` (today every 3 s while visible and waiting). Alerts when the board is closed: email or web push from King Down, linking to `kingdown.dev/g/<id>`; the board says "We email you when it is your turn".
- Direct `fetch`/WebSocket from the iframe to Supabase is possible in the standard but unreliable in published ChatGPT builds; keep tool polling as the base (repo decision T9).
- Live clocks in ChatGPT: only slow settings; ChatGPT seats get longer disconnect grace (60 s). Daily (async) is the natural ChatGPT mode.
- `setOpenInAppUrl` → `kingdown.dev/g/<id>`: the way out when a client breaks (macOS app and Work broke private-tool calls 2026-09-27 to 10-06).
- **Joiner choices** (king, power, arrangement) happen in the joiner's own board after `kingdown_join`, through app-only tools. The model need not take part.
- Users can connect several accounts; the model picks one per call. Server must key everything to the OAuth subject.
- Preset messages only (no free text) for online-safety reasons (repo 03 §8.3).

---

## 11. Review and submission rules that affect features

From [plugin guidelines](https://developers.openai.com/plugins/plugin-guidelines) and repo 03 §4.5/§4.7:

| Rule | Effect on MVP |
|---|---|
| No selling digital goods, subscriptions, credits; no upsell ("must not display subscription plans … or promote upgrades"); no ads | "Unlocks: all unlocked" is compliant. No locked items with a "buy" path, no "Pro" badges, no shop link in ChatGPT. |
| "Trial or demo plugins will not be accepted." | The listed build must be a complete game, not a preview. |
| Feature parity: "must not provide a worse version through your plugin" than the website | Toggles, profile and settings in ChatGPT should match kingdown.dev. |
| Suitable for 13–17; not targeting under 13 | Art and badge names must stay general-audience. No age gate needed; do not collect age. |
| Auth: transparent; no extra sign-up steps that block approval; reviewer login + password for a fully featured demo account with sample data, no MFA, no email codes, no magic links | The demo account needs games in its registry, a score and badges, so the profile screen is non-empty. Consider computer play without linking later (`noauth` + `oauth2` mixed), research phase 5. |
| Work reliably on desktop and mobile, UI included | iOS **and Android** tests before submission. |
| Minimum data; no chat log | Profile stores games and results only. |
| Iframes: only own registrable domain; justification at submission | Do not embed kingdown.dev pages; render natively. |
| Tool annotations required; honest names and descriptions | See §7. |
| Fixed MCP origin; unique UI `domain`; old resource URIs must keep working until new tool definitions pass review | Choose the production origin before submission. |
| Name: no bare generic word ("Chess") | "King Down" is fine. |
| No real-money gambling | Card draws are free and random: fine. Avoid loot-box language. |
| Submission: five positive and three negative test cases, a demo video, privacy, terms, support URLs; one MCP server per plugin | Plan the demo account and video around the MVP screens. |
| Review time: 1–4 months (community reports) | Friends use kingdown.dev until listing. |

Regions: EU/EEA, UK, Switzerland availability **unconfirmed** (repo 03 §7.1).

---

## 12. Risks

1. **Payload budget (high).** 100 KB headroom. Any inlined art for coins, cards, scroll, badges, or a second render style breaks the build. Mitigation: external, hashed assets on the plugin origin + CSP; or a different host with a larger response limit; or lazy-load via an app-only tool returning images (heavy, not advised).
2. **Inline multi-screen vs UI guideline (medium).** "No deep navigation or multiple views within a card." Review may reject a menu-heavy inline card. The owner rejected the in-board Fullscreen button. Needs an owner decision or a design that reads as one surface.
3. **System-font rule vs the painted look (medium).** Menus must use system fonts; decorative text only inside images.
4. **Model sees the board today (medium).** `structuredContent` carries the full `MatchView`. Fix before multiplayer and before random matchmaking.
5. **Every tool carries the template (low/medium).** May cause extra re-renders; fix by moving `resourceUri` to `kingdown_open` only.
6. **Android untested (high for review).**
7. **Polling latency and approval prompts (medium).** "Always ask" users can see a dialog per poll.
8. **Old conversations keep old builds** (cache by URI). Tell testers to use a new chat after releases.
9. **Random matchmaking inside ChatGPT** is weak before a public listing (tiny pool, manual setup). Pair with kingdown.dev players (crossplay) and a computer fallback after a wait.

---

## 13. Recommendations for the MVP UI structure

1. **One resource, one app, client-side router.** Screens: Home → Setup (+ sub-menus) → Board; Profile; Settings. One `ui://kingdown/app-<hash>.html`. Rename optional; keep the hash-in-URI rule.
2. **One model-visible render tool:** `kingdown_open({screen?, matchId?})`. All other UI actions are app-only tools without `resourceUri`. Add model-visible read-only data tools (`kingdown_games`, `kingdown_profile` with `openai/profile: true`) for text answers.
3. **Inline-first, no King Down Fullscreen button** (owner decision stands). Make every screen fit one viewport height with no inner scroll; the host's own expand control (where it exists) is the only fullscreen path. Declare `availableDisplayModes: ["inline", "fullscreen"]`; never `pip`. Ask the owner whether a fullscreen-*only* launch should be tested once more on iPhone and Android (separate question from the removed button).
4. **Sub-menus as in-app sheets/overlays** within the same view (piece pool "all", card "all", king-coin picker). One level deep; a sheet replaces the screen content rather than scrolling inside a card. Primary action + at most one secondary action visible at a time on each screen, to stay close to the card rule.
5. **Server owns all durable data:** match setup (toggles, pool, cards, kings, powers, arrangement), profile registry, score, badges, settings. Widget state holds only `{screen, subMenu, boardId, pending, setupDraft}` under `privateContent` where possible.
6. **Model sees summaries only.** Full position, legal moves, opponent handle, setup details of the opponent → `_meta`. `structuredContent` → one short line. Use `updateModelContext` only for the player's own board vs the computer, or on "Ask ChatGPT".
7. **Art off the inline payload.** Serve piece, coin, card, scroll and badge images as hashed files from the plugin origin; declare it in `_meta.ui.csp.resourceDomains` and legacy `openai/widgetCSP.resource_domains`. Keep the board renderer's critical art inline only if it fits. Test CSP on web, macOS, iOS, Android.
8. **System fonts for all UI text;** host CSS variables (`applyHostStyleVariables`, `theme`) for chrome; brand color only on primary buttons and badges. The "symbols only" setting uses monochrome outlined icons — matches ChatGPT's icon rule and is a good default fallback.
9. **Multiplayer screens:** invite shows "Copy invite link" (needs `permissions.clipboardWrite`; fallback: selectable text) and the short code; a waiting state that says where alerts go; polling per repo 03 §4.5 schedule; "Open on kingdown.dev" via `openLink`/`setOpenInAppUrl`. Random matchmaking: a wait screen with a computer fallback.
10. **Profile screen:** registry (scroll art as an image, list in system font), score, badges; no locks, no prices, no "upgrade". Reviewer demo account seeded with games and badges.
11. **Use host context** (`platform`, `safeAreaInsets`, `containerDimensions`, `theme`, `deviceCapabilities.touch`) for layout; keep tap targets large and actions away from the bottom edge (composer).
12. **Before submission:** fix tool annotations, move `resourceUri` to render tools only, test Android, pick the final origin, prepare the demo account and the 5+3 test cases.

---

## 14. Open questions for the owner (batched)

1. Inline-only multi-screen app (risk: UI-guideline review), or test a fullscreen-only launch once on iPhone and Android? The in-board Fullscreen button stays removed either way.
2. Are the 4 shared cards public to both players? If not, per-seat hidden views are needed.
3. Accept external (non-inlined) art for the plugin, with the CSP and client tests it needs?
4. Random matchmaking in the MVP: ChatGPT + website pool together (crossplay), with a computer fallback after a wait?

## 15. Sources

- Repo: `src/plugin/server.ts`, `src/plugin/app.ts`, `src/plugin/index.html`, `tools/plugin-ui-build.mjs`, `tools/plugin-server-check.mjs`, `tools/plugin-server-build.mjs`, `docs/plugin-preparation.md:64`, `docs/specs/match-foundation/issues/{06,09,11,16}-*.md`, `docs/research/chatgpt-plugin-*.md`, `docs/research/chatgpt-chess-market.md`, `docs/research/multiplayer-2026-10-10/03-technical.md` (§4.5–4.7, 6.4, 7, 7.1, 8.3, 8.7), `docs/research/multiplayer-2026-10-10/01-user-journey.md` (§6).
- Package: `node_modules/@modelcontextprotocol/ext-apps` 2.0.3 — `README.md`, `dist/src/app.d.ts`, `dist/src/spec.types.d.ts`, `dist/src/styles.d.ts`, `dist/src/server/index.d.ts`.
- OpenAI (fetched 2026-10-11): [UI construction](https://developers.openai.com/plugins/build/chatgpt-ui), [UI reference](https://developers.openai.com/plugins/reference), [UI guidelines](https://developers.openai.com/plugins/concepts/ui-guidelines), [Plugin guidelines](https://developers.openai.com/plugins/plugin-guidelines), [MCP Apps in ChatGPT](https://developers.openai.com/apps-sdk/mcp-apps-in-chatgpt/), [Extensions](https://developers.openai.com/plugins/build/extensions), [mcp-extensions spec](https://raw.githubusercontent.com/openai/mcp-extensions/main/docs/spec.md).
