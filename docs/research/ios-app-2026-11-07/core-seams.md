# Core seams for an iOS shell

Date: 2026-11-07. Worktree `ios-app`, base `origin/main` c77a67484. Vocabulary: the `codebase-design` skill (module, interface, depth, seam, adapter, leverage, locality).

## Summary

The game core is already UI-free and deep. The rules (`GameRules`, `Game`), the computer (`Engine`), the turn rule (`turn.ts`) and the read models (`read.ts`, `move-text.ts`, `marks-model.ts`) touch no DOM and have many tests. The online client (`onlineClient`) takes `fetch` and `origin` as parameters. The sign-in flow, the online page host and the online transport already take their browser objects as parameters. So the seams for storage, fetch and navigation exist where iOS can need them.

The tangled part is one module: `src/screen/play.ts` (1070 lines). It holds the local match state (sides, level, turn start, resign, the computer turn, the save snapshot) together with DOM writes, sound and animation. Its test must mock 9 modules and stub 8 browser globals. A new UI cannot reuse this state without that module. This is the one deepening that the redesign needs. Do it as the first step of the redesign, not now.

For the iOS shell, the smallest seam is one file, `src/platform.ts`, with one fact (the shell is `web` or `ios`) and one rule (the sign-in options that the shell can finish). Everything else works as web code in WKWebView when the shell loads the live `https://kingdown.dev` origin. The native shell must still set App-Bound Domains (service worker for the online cache check) and a navigation policy (external links open in Safari).

## Method

- I built the import graph of the shipped page with esbuild (`metafile`) from `src/entry.ts` and from `src/ai/worker.ts` (the worker is a `new Worker(new URL(...))` that esbuild does not follow). Result: 191 source files. The census in part 3 counts only these files. It does not count tests, `tools/`, `sim/`, server code or parked code that the page does not import.
- `public/sw.js` and the inline registration script in `vite.config.ts:57-61` also ship. I list them by name.
- Counts are matching code lines, not calls at run time. I removed comment lines by hand where I name a count.

## 1. The UI-free core

| Module | Interface (what a caller must know) | Tests (files / cases) | DOM or browser globals |
| --- | --- | --- | --- |
| Rules: `src/rules/*`, `src/game-rules.ts` | `GameRules` (`game-rules.ts:16-52`): an immutable game definition with `startPosition`, `fromFen`, `legalMoves`, `makeMove`, `status`, `inCheck`, `toLan`, names. Invariant: the engine keeps one mutable global, `RULES` (`rules/rules.ts:776`, set by `setRules` at `rules/rules.ts:846`). `GameRules.#scoped` (`game-rules.ts:27-31`) puts its rules in that global for one synchronous call, then puts the old rules back. A caller must use `GameRules`, never the bare engine functions. No shipped UI file breaks this rule (grep of the 191 files: only `game-rules.ts` imports `setRules`/`RULES`; the online board makes its own `GameRules` at `plugin/screens/board.ts:756`). | rules 15 / 404; `game-rules.test.ts` 1; `presentation-ownership.test.ts` checks two rule owners side by side | None. 0 matches in all `src/rules/*.ts` and `game-rules.ts`. |
| Game: `src/game.ts` | `Game` (`game.ts:19-114`): `pos`, `history`, `status`, `legal`, `inCheck`, `play`, `undo`, `playLan`, `newGame`, `load`, `positionAfter`. Threefold repetition is inside (`game.ts:66-75`). | `game.test.ts` 26 | None in `Game`. |
| Computer: `src/ai/*`, `Engine` in `src/game.ts` | `Engine.think(game, opts)` and `Engine.cancel()` (`game.ts:135-195`). Error modes: a cancelled or replaced search never resolves (`game.ts:152`, `game.ts:191-195`). It takes no callbacks (`game.ts:136`). Level: `skillPlan(skill, ply)` (`ai/skill.ts:20-26`); the blunder draw is done by the caller (`screen/play.ts:429-433`). | ai 9 / 49; nnue 1 / 15 | Yes, a Web Worker: `new Worker(new URL('./ai/worker.ts', import.meta.url), { type: 'module' })` (`game.ts:125`). The worker sets the rules on each request (`ai/worker.ts:16-20`). When a worker cannot start, the search runs on the main thread after 30 ms (`game.ts:161-164`). When a worker gives no reply in `timeMs + 2500` ms, `Engine` ends it and searches inline (`game.ts:177-184`). The search code (`ai/search.ts`, `ai/eval.ts`) has no browser globals. |
| Turn rule: `src/turn.ts` | Pure functions on a `TurnGame` (`turn.ts:16-22`): `turnOf`, `turnEnded`, `turnLine`, `turnButton`, `pressPass`, `stagedPlies`, `dropTurn` (`turn.ts:41-146`). The caller keeps one number, the turn start. | `turn.test.ts` 36 | None. |
| Read models | `marksModel`, `landingMoves`, `clickPath` (`marks-model.ts:5-41`); `reachOf`, `readText`, `whyNot`, `readTap` (`read.ts:24-287`); `describeMove`, `threatsIn`, `checkersOf` (`move-text.ts:43-139`); `homeState` (`ui/home.ts:21`). They return data or English lines. | yes (`read.test.ts`, `move-text.test.ts`, `marks-model.test.ts`, `ui/home.test.ts`) | None in these files. |
| Save format: `src/screen/save.ts` | `Save` (`screen/save.ts:12`), `gameJSON`, `savedGame` (pure), and `readSave`, `writeSave` (`screen/save.ts:42-89`). | `save.test.ts` | Mixed: the format is pure, but `readSave` and `writeSave` read the `localStorage` global (`screen/save.ts:45-86`). |
| Match (server): `src/match/*` | `match/protocol.ts` is the one game protocol for the website and the ChatGPT tools (`match/protocol.ts:1-2`): `View`, `Action`, `Reply`, `InboxEntry`. The rest of `src/match` is server code (Postgres, for example `match/store.ts`). The page imports types only, plus `match/setup.ts`. | match 17 / 243 | None (server). |
| Online client: `src/online/client.ts` | `onlineClient({ token, origin = '', fetch, tries, wait })` (`online/client.ts:33`). Typed calls to `/api`; `command` retries with the same `command_id` (`online/client.ts:70-75`). Every call goes through `withPrivateCachePolicy` (`online/client.ts:39`). | online 12 / 196 | `fetch` and the origin are parameters (a real seam). `crypto.randomUUID`. The cache check uses `navigator.serviceWorker` and `caches` (`online/cache-policy.ts:22-25`, `online/cache-policy.ts:166-168`). |
| Online game screens: `src/account-game/*`, `src/plugin/screens/*` | `AccountGameHost` (`account-game/host.ts:11-26`) and `PageHost` (`account-game/client.ts:17-25`). `AccountGameHost` has two adapters today: the ChatGPT plugin and the web page (`online/runtime.ts`). So it is a real seam. UI-free models: `plugin/screens/board-model.ts`, `end-model.ts`, `seat-model.ts`, `setup-model.ts`; the poll `runPoll` takes its page as a parameter (`plugin/poll.ts:34`). | account-game 5 / 49; plugin/screens 6 / 76 | Yes. `account-game/runtime.ts` has 47 DOM lookups; it is UI, not core. |
| Account: `src/account/*` | `connect(storageKey)` (`account/client.ts:20-110`): session, sign-in (OAuth, email code), sign-out, delete, cloud rows. `Sync` takes its store as a parameter (`account/account.ts:98`). `account/local.ts` takes a `LocalStore` (`account/local.ts:4`). | account 7 / 86 | Mixed. `account/account.ts` is the Settings → Account UI (18 browser-global matches). `account/client.ts` reads `location.origin` for the OAuth return (`account/client.ts:49`, `account/client.ts:82`). `account/providers.ts:7` fetches the Supabase auth settings. |
| Sign-in flow: `src/online/sign-in.ts` | `SignInHost` (`online/sign-in.ts:10-16`): `location`, `history`, `storage`, `now`, `client` are parameters. | `sign-in.test.ts` | Only through `SignInHost`. |

Depth verdict: `GameRules`, `Game`, `Engine`, `turn.ts` and `onlineClient` are deep. Each has a small interface over a large body, and their tests cross the same interface that callers use.

## 2. The UI side

There are two UI stacks. Both share the painted board (`render/PaintedView.ts`).

- Local play: `index.html` → `src/entry.ts` → `src/main.ts`. `entry.ts` picks the stack by route (`entry.ts:4-5`).
- Online play: `/play/`, `/g/<id>`, `/j` → `src/online/entry.ts`, which injects `src/plugin/index.html` (`online/entry.ts:10`, `online/entry.ts:90-91`) and loads `account-game/runtime.ts` (`online/entry.ts:113`). The board is `plugin/board-view.ts:8`.

### main.ts

`main.ts` (190 lines) is a composition root, not a tangle. It reads the URL (`main.ts:23-67`), makes the `Engine` and the `PaintedView` (`main.ts:71-74`), connects the parts (`main.ts:83-114`), restores the save (`main.ts:117-157`) and starts the title or the computer (`main.ts:176-190`). It talks to the core through `connectPlay` and holds no game rule of its own. It does keep three platform uses: the New game setup in `localStorage` (`main.ts:100-104`), the title flag in `sessionStorage` (`main.ts:136`), and three `history.replaceState` calls for parked links (`main.ts:33`, `main.ts:152`, `main.ts:174`). It also puts `view`, `home` and `fen` on `window` for the browser checks (`main.ts:76`, `main.ts:92`, `main.ts:159`).

### screen/play.ts: the tangled module

`screen/play.ts` calls itself "the turn core" (`screen/play.ts:7-11`). It holds the local match state in closures: `sides`, `skill`, `resigned`, `turnStart`, `linkSide`, `lesson`, `viewing` (`screen/play.ts:85-119`). The same functions also write the DOM, play sounds and run animations:

- `commit(move)` plays the move on `Game`, sets the turn start, writes `#announce`, plays sounds, waits for `view.animateMove`, animates the king portrait and the power coin, saves, then starts the computer (`screen/play.ts:300-351`).
- `maybeAi()` reads `skillPlan`, calls `engine.think`, draws the blunder, and calls `commit` (`screen/play.ts:420-438`).
- It makes a DOM layer at start (`screen/play.ts:86-89`) and listens to `pagehide` (`screen/play.ts:76`). It has 64 `$()` or `document.` uses.
- Its interface is wide: 30+ members (`screen/play.ts:1049-1069`), and `connectPlay` takes 15 dependencies, some as late getters (`screen/play.ts:49-73`).

Test evidence: `screen/play.test.ts` mocks 9 modules (`screen/play.test.ts:18-26`) and stubs `localStorage`, `document`, `window`, `location`, `history`, `matchMedia`, `MutationObserver` and `ResizeObserver` (`screen/play.test.ts:34-42`). The tests reach past the interface. By the codebase-design rule, the module has the wrong shape for reuse.

Deletion test: delete `screen/play.ts` and the match rules (who moves, when the computer plays, what Resign drops, what the save holds) come back in every new UI. So the behaviour earns a module. The DOM writes in it do not belong to that module.

### Where UI code reaches into core internals

- Rules globals: no shipped UI file calls `setRules` or reads `RULES` (part 1). The UI uses `GameRules` methods and `rules/engine` constants and types (27 imports in `render/` and `ui/`). Constants such as piece codes are part of the interface; this is acceptable.
- `new-game.ts` mixes the pure setup (`Setup`, `parseSetup`, `defaultSetup`, `new-game.ts:28-47`) with the DOM dialog (`newGameDialog`, `new-game.ts:133`).
- `screen/save.ts` mixes the save format with the `localStorage` global (part 1).
- `PaintedView` receives `GameRules` through `setRules` (`render/PaintedView.ts:63`) and reads positions. It does not change game state. The board is an adapter of `BoardView`; a new UI can keep it or replace it.

## 3. Platform API census (shipped code)

| Group and purpose | API | Lines | Where |
| --- | --- | --- | --- |
| A. Local game save and settings | `localStorage` | 13 | `screen/save.ts:45-86` (7), `screen/play.ts:133` (1), `main.ts:100-104` (2), `ui/title.ts:10-17` (3) |
| B. Account session and cloud save | `localStorage` | 5 | `account/account.ts:62`, `:98`, `:125`, `:142`; `account/client.ts:31`. Supabase also keeps its session in `localStorage` (`persistSession: true`, `account/client.ts:24`). |
| C. Online command receipt and page state | `localStorage` | 3 | `online/runtime.ts:124`, `:126`, `:149` |
| D. Online sound choice | `localStorage` | 2 | `account-game/runtime.ts:682`, `:686` |
| E. Parked lessons | `localStorage` | 3 | `lesson-store.ts:22-30` |
| F. Tab-only flags | `sessionStorage` | 9 | title seen: `main.ts:136`, `ui/home-view.ts:40`, `ui/title.ts:34`; email code step: `account/email-code.ts:7-12` (3); OAuth flow record: `online/entry.ts:72`; online route: `online/page-host.ts:29`, `:32` |
| G. Share an invite or link | `navigator.share` | 2 sites | live: friend invite `plugin/invite.ts:31-32`; parked: game link `turn-controls.ts:37-38` |
| H. Copy | `navigator.clipboard` | 1 | `clipboard.ts:5` (fallback `execCommand`); callers `plugin/invite.ts:35`, `turn-controls.ts:41`, `screen/links.ts:45` |
| I. Offline cache and online cache check | `navigator.serviceWorker`, `caches` | 1 + script | `online/cache-policy.ts:25`, `:166-168`; registration script `vite.config.ts:57-61`; worker `public/sw.js` |
| J. Online state | `navigator.onLine`, `online` event | 1 + 3 | `ui/home-view.ts:18`, `:22`; `account/account.ts:164`; `render/painted/character-runtime.mjs:121` |
| K. Cross-tab lock | `navigator.locks` | 2 | `online/runtime.ts:30`, `:42` |
| L. Device facts | `navigator.language`, `userAgent`, `maxTouchPoints`, `sendBeacon` | 4 | `account-game/games-list.ts:9`; `diagnostics/browser.ts:27`, `:32`; `online/page-host.ts:91` |
| M. Page navigation | `location.assign/replace/reload` | 7 | `online/entry.ts:34`, `:37`, `:56`, `:109`; `online/runtime.ts:176` (`openLink`); `online/sign-in.ts:36` (OAuth); `account-game/runtime.ts:356` |
| N. Address bar | `history.replaceState/pushState` | 11 | `main.ts:33`, `:152`, `:174`; `screen/play.ts:948`; `account/account.ts:122`; `online/page-host.ts:61`, `:81`; `online/runtime.ts:144`, `:187`; `online/sign-in.ts:50`, `:66` |
| O. App lifecycle | `visibilitychange`/`document.hidden` | 16 lines, 9 files | sync flush `account/account.ts:165-167`; poll `plugin/poll.ts:62`; motion and board `render/PaintedView.ts`, `ui/motion.ts`, `ceremony.ts`, `plugin/screens/board.ts:260-308` |
| O. App lifecycle | `pagehide`/`pageshow` | 14 lines | `screen/play.ts:76`, `game-end.ts:25`, `online/page-host.ts:68-75`, `online/runtime.ts:173`, `plugin/screens/friend.ts:98`, `plugin/poll.ts:62`, `render/painted/scene.mjs:1034` |
| P. Background thread | `new Worker` | 1 | `game.ts:125` |
| Q. Network base URLs | `fetch` | 4 | relative `/api/status` `online/account-access.ts:22`; relative `/api/client-errors` `diagnostics/browser.ts:32-34`; `origin = ''` default `online/client.ts:33` (caller `online/entry.ts:92` passes none); absolute Supabase URL `account/providers.ts:7`. OAuth return `location.origin + '/play/'` `account/client.ts:49`. Assets use `import.meta.env.BASE_URL` (`/`, `vite.config.ts:126`). |
| R. Sound | `AudioContext` | 1 | `render/sfx.ts:76` |
| Not used | `indexedDB`, `navigator.vibrate`, `window.open`, Notification, Push | 0 | — |
| External links | `target="_blank"` | 3 | `account/account.ts:39-40`; `plugin/screens/profile.ts:78` |

Totals: 26 `localStorage` code lines in 9 files, 9 `sessionStorage` lines, 13 `navigator.*` lines, 7 `location` writes, 11 `history` writes, 30 lifecycle lines, 1 `Worker`, 4 `fetch` lines.

## 4. The smallest platform seam for an iOS shell

### The choice that decides the seam

The seam depends on where the page comes from.

1. Remote origin (the shell's WKWebView loads `https://kingdown.dev`, or staging for tests). The origin stays the same. Relative `/api` calls, the Supabase session, the OAuth return URL, the invite links and the engine fingerprint check (`account-game/engine-identity.ts:3-4`) work with no change.
2. Bundled origin (the app carries `dist/` and serves it through a custom scheme). Then every relative `/api` call (group Q) needs a base URL. The API refuses other hosts (`api/http.ts:57`) and sends no CORS headers (no `Access-Control-Allow-Origin` in `src/api/http.ts` or `vercel.json`). The OAuth return breaks. The bundled engine can differ from the live engine, so the online board falls back to the server preview (`account-game/engine-identity.ts:4`).

Pick 1 for day one. It needs one small seam. Pick 2 needs a base-URL seam, server CORS and an origin rule change. It can wait until offline-first launch or App Review need it.

### Day one: `src/platform.ts`

One module with one fact and one rule:

```ts
/** Where the page runs. The iOS shell sets `kingdownShell` before the page scripts run. */
export type Shell = 'web' | 'ios';
export const shell: Shell = (globalThis as { kingdownShell?: unknown }).kingdownShell === 'ios' ? 'ios' : 'web';

/** The sign-in options that this shell can finish. Google refuses sign-in in an embedded web view. */
export const shellSignIn = <T extends string>(options: readonly T[]): T[] =>
  shell === 'ios' ? options.filter(o => o === 'email') : [...options];
```

- The native shell sets the flag with one `WKUserScript` at document start.
- Apply `shellSignIn` once, in `availableProviders` (`account/providers.ts:5-14`). Both sign-in screens read that function: Settings → Account (`account/account.ts:106`) and the online entry (`online/entry.ts:76`). So one call covers both.
- Why this seam earns its place: Google's policy says a developer "must not direct a Google OAuth 2.0 authorization request to an embedded user-agent" (Google OAuth 2.0 Policies, last modified 2026-08-05). The email code sign-in (live since release 14) needs no redirect, so it works in WKWebView. With email code only, the app uses only its own account system, which is an exception in App Review Guideline 4.8 (no Sign in with Apple needed).

### Day one, native side only (no web code)

These are iOS differences, but the web code needs no seam, because the shell handles them:

- App-Bound Domains: add `WKAppBoundDomains` (`kingdown.dev`, `kingdown-staging.vercel.app`) and set `limitsNavigationsToAppBoundDomains`. WKWebView gives service workers only to App-Bound Domains on iOS 14 and later (inappwebview.dev service worker docs; WebKit blog "App-Bound Domains", 2020-06-26: up to 10 domains). This matters: every online call waits for the cache check (`online/client.ts:39`), and that check needs `navigator.serviceWorker` or `caches` (`online/cache-policy.ts:25`, `:166-168`). If both are missing, online play is refused with `CachePolicyUnavailable`.
- Navigation policy: open hosts that are not app-bound in Safari or `SFSafariViewController`. This covers `openLink` (`online/runtime.ts:176`), the support link (`plugin/screens/profile.ts:78`) and the Privacy and Terms links (`account/account.ts:39-40`). WKWebView ignores `target="_blank"` unless the shell handles it.
- Safe area: the page already uses `viewport-fit=cover` (`index.html:5`) and `env(safe-area-inset-*)` (10 CSS uses; read at `online/page-host.ts:87`). No change.

### Day one: check on the simulator, change code only on a fault

| Purpose | Expected | If it fails |
| --- | --- | --- |
| A, B, C storage | `localStorage` persists in the default WKWebView data store | Then add a storage adapter. `Sync`, `createWebTransport` and `SignInHost` already take a store as a parameter. |
| I cache check | passes with App-Bound Domains | Fix App-Bound Domains first. Do not weaken `cache-policy.ts`. |
| K `navigator.locks` | present in current WebKit | `online/runtime.ts:30`, `:42` throw; add a single-page fallback |
| G share, H copy | share sheet or copy | `clipboard.ts` already falls back; `plugin/invite.ts:35-41` falls back to copy, then to a selection |
| P module Worker | starts | `Engine` already falls back to the main thread (`game.ts:161-164`) |
| O lifecycle | `visibilitychange` fires on background and foreground | `account/account.ts:167` flushes the cloud save on `hidden`; confirm a save survives an app kill |
| R sound | plays after the first tap | iOS needs a user gesture; check the silent switch |
| L diagnostics | `browserFamily` (`diagnostics/data.ts:100-108`) expects `Version/… Safari/`; WKWebView sends no `Safari/` token, so reports say unknown | Can wait; a native `applicationNameForUserAgent` suffix fixes it with no web change |

### Can wait

- Haptics (no `navigator.vibrate` use today, and iOS WebKit has none): add a `haptic()` member to `platform.ts` only when the new UI asks for haptics.
- Push notifications (APNs): the API already has a `push` field (`online/client.ts:86-87`).
- Universal links for `/j#…` and `/g/<id>` (invite links, `plugin/invite.ts:22-23`).
- Google or Apple sign-in through `ASWebAuthenticationSession` (needs a custom-scheme or universal-link return instead of `location.origin + '/play/'`, `account/client.ts:49`; then Guideline 4.8 applies).
- Bundled offline origin (pick 2 above), Game Center, in-app purchase, native share bridge.

## 5. The core interface for a new UI

### The layer a new UI builds on

Use the modules that are deep today, as they are:

1. Rules: `GameRules` and `Game` (`game-rules.ts`, `game.ts:19-114`). Types and constants from `rules/engine`.
2. Computer: `Engine.think` and `Engine.cancel` (`game.ts:116-196`), `skillPlan` (`ai/skill.ts`).
3. Turn rule: `turn.ts`.
4. Read models: `read.ts`, `move-text.ts`, `marks-model.ts`, `ui/home.ts` `homeState`.
5. Save format: `Save`, `gameJSON`, `savedGame` (`screen/save.ts`).
6. Online: `onlineClient` (`online/client.ts`), `match/protocol.ts` types, `runPoll` (`plugin/poll.ts:34`), the `plugin/screens/*-model.ts` models, and the `AccountGameHost` and `PageHost` seams.
7. Account: `connect` (`account/client.ts:20`) and `Sync`.

### The one module to add (first step of the redesign)

A headless local match module, taken out of `screen/play.ts`. It owns the state that every UI needs and no DOM. A sketch of its interface:

```ts
createLocalMatch({ engine, rules, store }): {
  state(): MatchState;              // game, sides, level, turn (turnOf), resigned, ended, thinking
  play(move: Move): void;           // records the ply; no animation
  press(): void;                    // End turn: pressPass + handOver
  undo(): boolean;                  // canUndoTurn + Game.undo
  resign(): void;                   // dropTurn + resigned side
  newGame(setup: Setup): void;
  computerMove(): Promise<Move | null>; // skillPlan + Engine.think + blunder; null when cancelled
  snapshot(): Save;
  subscribe(listener: () => void): () => void;
}
```

The UI animates and plays sounds after `play` or `computerMove`. Today's web UI becomes the first adapter; the new UI is the second, so the seam becomes real. Tests then cross this interface with a fake `Engine` and an in-memory store, with no DOM stubs. The extraction can also drop the parked branches (lessons, game link, pass-and-play, daily army) from the new interface, because `docs/PARKED.md` keeps their source in git.

Why not now: today the module has one caller. The redesign decides what the session must expose (for example, whether a review state belongs to it). An extraction before that design is a hypothetical seam, and it risks a second move later.

### Leave as it is

- `rules/`, `ai/`, `Engine`, `turn.ts`, the read models, `onlineClient`, `match/protocol.ts`, `SignInHost`, `AccountGameHost`, `PageHost`.
- `main.ts` and `online/entry.ts` stay composition roots; a new UI writes its own.
- The global `RULES` with `GameRules` scoping. It is safe while callers use `GameRules`. Do not remove it now (10190 lines in `rules/` depend on it).
- `PaintedView`. It is one adapter of `BoardView`; the redesign decides if it stays.

### Do not do now

- Do not port rules or the computer to Swift, and do not run them in JavaScriptCore. The web worker already runs them in WKWebView.
- Do not add wrappers for `localStorage`, `fetch`, `Worker`, lifecycle events or clipboard. The web APIs work in WKWebView, and the modules that need injection already take parameters.
- Do not add a Capacitor-style plugin bridge, a barrel `index.ts` or an `origin` setting before a bundled origin is chosen.
- Do not weaken the online cache check for the shell.
- Do not move `plugin/screens/*` or `account-game/*`; the online UI redesign decides their shape.

## Open questions

1. Day-one origin: remote `https://kingdown.dev` (this report's pick) or a bundled app origin. Guideline 4.2 says an app must be more than a repackaged website; the owner must accept that review risk for a remote shell.
2. Is email code the only sign-in in the iOS app on day one? If Google stays, the app needs `ASWebAuthenticationSession`, a native return URL and Sign in with Apple (Guideline 4.8).
3. Does the cache check pass in WKWebView with App-Bound Domains? It is the one fault that can stop online play with no web change; test it first on the simulator.
4. When does the redesign start? The local match extraction is its first step; its exact interface waits for the new screen list.

## Sources

- Google OAuth 2.0 Policies, last modified 2026-08-05: https://developers.google.com/identity/protocols/oauth2/policies
- WebKit blog, "App-Bound Domains", 2020-06-26: https://webkit.org/blog/10882/app-bound-domains/
- InAppWebView docs, "Service Worker" (iOS 14+ needs App-Bound Domains), read 2026-11-07: https://www.inappwebview.dev/docs/service-worker
- WebKit blog, "Full Third-Party Cookie Blocking and More", 2020-03-24 (7-day storage cap counts days of use; it does not name WKWebView apps): https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/
- Apple App Review Guidelines 4.2 and 4.8, read 2026-11-07: https://developer.apple.com/app-store/review/guidelines/
