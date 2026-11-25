# Change rehearsals: a missed place fails the type check or one fast test

Status: done on branch change-guards (PR A); waits for the review

Source: the owner's task of 2026-11-25 ("improvements to how flexible the codebase is and it being more robust when we make changes to it"). Rule 5 of [CHANGES.md](../../../CHANGES.md): hold each lesson in the cheapest form that stops the repeat. Model: [ticket 03](03-card-tables.md).

## Problem

When an agent adds a piece, a screen, an API route, a tool or a build flag, other places must change with it: tables, `switch` statements, lists, texts in the four forms, tool text and docs lists. A place that stays green when it is missed is a hole. Nothing named the holes.

## Method

One scout for each kind of change. The scout worked in a scratch copy at `origin/main` and did not commit. It added a fake instance in the first, obvious place only, ran `npm run typecheck` and the focused tests of the area, and found each other place by reading. For each place it named the guard that names the place today, or a hole.

A builder then closed the holes with the cheapest guard, in this order: a type (a key set, `satisfies`, a `switch` with a `never` check); a behaviour test that takes its cases from the real list; last, a test that reads source text. Each guard has a proof: red with the fake instance, green on the real tree. Each builder worked on its own branch; the lead took the commits into `change-guards`.

Rules of each guard: the failure text names the missed place and what to add there; the guard runs in about 2 s or less; no product behaviour changes (a product file gets only a type change, or none); a new test file goes in `tools/` or beside code that is not class C. A hole that needs behaviour, a file of another lane or class C code is a ticket with `Status: ready-for-agent`.

## Kinds of change

The sections below come from the records of the scouts and the builders. Each section gives the places, the guard today, the new guards with their red and green lines, and the holes that stay, with their tickets. The commit names are the commits on `change-guards`.

## piece-power-card

Kind: a new piece, a new king power or a new card, in all four forms (web, plugin, Muse, iOS).

Branch: guard-piece-power-card, at origin/main d781512ed. Head: 24cae5cfc. Not pushed. No PR.

### Places and the guard today

| Place | What must change | Guard today |
|---|---|---|
| src/interface/play/texts.ts:54, :250; learning.ts:97; learning-content.ts:156; powers-ui.ts:10; ai/search.ts:159; card-symbol.ts:33; power-mark.ts:3; power-motion.ts:59 | one entry for each released card or king power | npm run typecheck (TS2741 / TS1360) |
| src/content/cards.ts RELEASED_CARDS; src/plugin/assets/card-thumbs/<id>.webp | painting, fixture, plugin thumbnail | src/content/cards.test.ts, tools/card-thumbs.test.ts |
| texts.ts pieces, learning-content.ts learningNotes (piece) | web name and Guide note of a released piece | tools/forms-drift.test.ts |
| src/plugin/screens/board.ts:139, :658; setup.ts:130; collection.ts:39 | white and black painting and icon of a released piece | NEW: tools/piece-power-card-guard.test.ts (guard 1) |
| src/muse/match-words.ts:47 SAN piece class and promotion class | the letter of a new piece | NEW: tools/piece-power-card-guard.test.ts (guard 2) |
| src/plugin/card-motion/recipes/<id>.ts, src/plugin/assets/card-motion/<id>.webp | motion recipe and motion map of a released card | NEW: tools/piece-power-card-guard.test.ts (guard 3) |
| src/interface/play/learning-content.ts:156 | remove the note of a card or piece that is not released | none; ticket draft piece-power-card-01 |
| src/muse/board-words.ts explain, match-words.ts:43-44 power words | none (shared tables) | typecheck through TAG_POWER and powers-ui |
| src/muse/match-words.ts:45 Mirror / MirrorB | a spoken word for a card that acts through m.via | none; ticket draft piece-power-card-02 |
| src/rules/rules.ts:147 CARD_ONLY | a new card-only CardName | none (engine, protected); ticket draft piece-power-card-03 |
| src/plugin/screens/board.ts:550 castRelease | cards that release material | partial on purpose (ticket 86) |
| src/move-text.ts, src/previously.ts, POWER_TAG, effect tables | sentences and effects of each card | general fallback, partial on purpose (ticket 03) |
| docs/specs/chatgpt-mvp/spec.md:42-43, docs/RULES.md:139, docs/MATRIX.md card rows | card list and count | none; ticket draft piece-power-card-04 |
| ios/ | no table | not needed |

### New guards

All three guards are in one new file: tools/piece-power-card-guard.test.ts (25 tests). Each guard takes its cases from the real lists. The file changes no product file.

Fake for the red run (one run, all three fakes together, then reverted): 'C' added to POOL in src/rules/setup.ts; 'T' removed from the SAN piece class and 'A' removed from the promotion class in src/muse/match-words.ts; `{ id: 'Rage', ... }` added to RELEASED_CARDS in src/content/cards.ts. After the revert, `git status` shows only the new test file. Logs: (a scratch file, not kept), (a scratch file, not kept)

1. Plugin art for each released piece.
   - Kind: behaviour test over P + CLASSIC_CHESS + POOL, through `art` and `symbols` of src/account-game/art.ts.
   - Red: `AssertionError: plugin: add the painting or the icon of the released piece: expected [ …(3) ] to deeply equal []`, with the list "public/ui/pieces/catapult-w.webp (src/plugin/screens/board.ts and setup.ts show it)", "public/ui/pieces/catapult-b.webp (src/plugin/screens/board.ts and setup.ts show it)", "public/ui/icons/catapult.svg (src/plugin/screens/collection.ts throws without it)".
   - Green: `Tests  25 passed (25)`, Duration 395ms (whole file).
   - Commit: e5835d5f1.
2. Muse reads each piece letter and each promotion.
   - Kind: behaviour test. For each letter of LETTERS (not the pawn), it puts the piece on d4, takes a legal move, and says "<letter><square>" to matchMove. For each piece of PROMOTIONS, it says "b8=<letter>" with promotionSet 'anyNonKing'. It is a behaviour test, not a source-text test, so a rename of the regex does not break it.
   - Red: `AssertionError: src/muse/match-words.ts SAN: add the letter T to the piece class (Muse refuses "Te4"): expected 'none' not to be 'none'` and `AssertionError: src/muse/match-words.ts SAN: add the letter A to the promotion class: expected 'none' to be 'b7-b8=A'`.
   - Green: `Tests  25 passed (25)`, Duration 395ms (whole file).
   - Commit: 068cd3968.
3. Plugin card motion for each released card.
   - Kind: behaviour test over RELEASED_CARDS (file exists check).
   - Red: `AssertionError: plugin card motion: add the recipe and the map (tools/card-motion), or the card shows a still picture: expected [ …(2) ] to deeply equal []`, with "src/plugin/card-motion/recipes/rage.ts" and "src/plugin/assets/card-motion/rage.webp".
   - Green: `Tests  25 passed (25)`, Duration 395ms (whole file).
   - Commit: 24cae5cfc.

Other checks on the head: npm run typecheck EXIT 0; npm run test:docs 199 passed, 1 skipped, EXIT 0.

### Holes that stay

- learningNotes keeps stale keys (learning-content.ts:156, GUI session file): ticket draft [22](22-piece-power-card-learning-notes-stale-keys.md). Low cost of a miss; not built because of the limit of 3 guards.
- Muse spoken word for a via card (match-words.ts:45): ticket draft [23](23-piece-power-card-muse-via-cards.md). Needs a product change.
- CARD_ONLY has no key set (src/rules/rules.ts:147, engine, protected): ticket draft [24](24-piece-power-card-card-only-typed.md).
- Card list and count in docs: ticket draft [25](25-piece-power-card-docs-card-list.md). Low cost of a miss; not built because of the limit of 3 guards.

### Decisions

- Guard 2 is a behaviour test through matchMove, not the source-text test of the scout. The rules put a behaviour test before a source-text test. The promotion case covers PROMOTIONS (the real promotion list); the extra letters O, C, V, T in the promotion class have no promotion today, so no test can see them.
- The guard for the catapult icon uses the pieces of POOL and CLASSIC_CHESS only. A lab piece that enters only through `--pool` has no guard.
- Guard 3 has no list of still cards. Each released card has motion today. If the owner accepts a still card, add an exception list in the test.
- The three guards are in one file, with one commit for each guard.

### Not verified

- Commits e5835d5f1 and 068cd3968 hold part versions of the test file. They passed `tsc --noEmit -p tsconfig.tools.json` only. Only the head content ran red and green.
- The red proof is one run with all three fakes together. The time (395 ms) is for the whole file, not for each guard.
- The branch base is d781512ed (origin/main at 10:04 PST), not 80b855489 of the brief. The scout probes ran at 80b855489.
- Guard 2 does not see the promotion-class letters O, C, V and T (no promotion to them today). The red proof removed one letter from each class (T and A).
- No other test file lists test files by name (grep for card-thumbs.test and forms-drift.test in tools/ and .github/ finds nothing), so the new file needs no list entry. CI shards were not run.
- One command ran `npx vitest --version`. It ran no test.


## account-screen

Kind: a new account screen (a new `AccountEntryRoute` / `ReadRoute` screen, for example `records` at `/play/records`).

Branch `guard-account-screen` (from origin/main d781512ed, head b3ce12081), worktree `worktree guard-account-screen`. Not pushed. No PR.

### Places and their guard today

| Place | What to add | Guard today |
|---|---|---|
| `src/account-game/client.ts:9` ReadRoute (or `src/online/routes.ts:3` AccountEntryRoute) | the screen | none (first place) |
| `src/online/routes.ts:21` parseAccountRoute regex | the path segment | NEW: `tools/account-screen-guard.test.ts` (before: none, the screen read as `play`) |
| `src/online/routes.ts:34` accountPath switch | a case | type: TS2366 at routes.ts(33,56) |
| `src/account-game/types.ts:3` SCREENS | the screen | type: TS2345 at src/account-game/runtime.ts, TS2322 at src/online/runtime.ts(130,34) |
| `src/diagnostics/data.test.ts:124` samples, errorRoute | a sample and the reduced route | type TS2741, then the test "names each API route, each account path..." |
| `src/account-game/runtime.ts:75` screens renderer map | the renderer | NEW: type TS2741 (before: none, the screen showed nothing) |
| `src/account-game/runtime.ts:400` (app.onResult) and `:584` (navigate) read screens before enterRead | the screen in both lists | NEW: type TS2344 at runtime.ts:79 (before: none) |
| `src/plugin/index.html:32-66` sections | a section | none: ticket account-screen-01 |
| `src/online/runtime.ts:190` store screen to address route | the route | none: ticket account-screen-02 (class C) |
| `src/interface/play/main.ts:283` route after web sign-in | an action | none: ticket account-screen-03 (GUI file) |
| `src/account-game/runtime.ts:680`, `src/account-game/state.ts:117` back target and label | only if not `play` / "‹ Menu" | none; the default is acceptable |
| `src/plugin/server.ts:128` kingdown_open enum | only if the model must open it | none; a product decision |
| `tools/vercel-check.mjs:302`, `tools/deploy-live-check.mjs:15`, `tools/plugin-ui-check.mjs:3082` | the path or screen | none: ticket account-screen-04 (coverage only) |
| `tools/web-game-check.mjs:711-714` | optional probe | none (protected file, coverage only) |
| `public/sw.js`, host page lists, `ios/Tests/UniversalLinkChecks.swift:27` | nothing: the `/play` prefix covers it | seam tickets 02/03/04 |
| docs | nothing | none |

### New guards

1. Renderer map: each account screen has a renderer.
   - File: `src/account-game/runtime.ts:74-75`. Kind: type (type-only annotation `Record<Exclude<Screen, 'home' | 'board' | 'collection' | 'settings' | 'handle'>, () => void>`).
   - Fake: `'records'` added to SCREENS in `src/account-game/types.ts`.
   - Red: `src/account-game/runtime.ts(75,7): error TS2741: Property 'records' is missing in type '{ play: () => void; ... }' but required in type 'Record<"end" | "friend" | "join" | "lobby" | "play" | "profile" | "records" | "seat" | "wait", () => void>'.`
   - Green: `npm run typecheck` exit 0, 1.75 s.
   - Commit: ce2d2b0d8.
2. Read-screen list: each read screen reaches enterRead after a mount.
   - File: `src/account-game/runtime.ts:76-79`. Kind: type (type-only: `type Listed<T extends never> = T;` and `export type ReadScreensListed = Listed<Exclude<ReadRoute['screen'], 'game' | 'play' | 'profile' | 'settings'>>`). It must be at module level and exported (TS1184 in a function, TS6196 if unexported).
   - Fake: `'records'` added to ReadRoute in `src/account-game/client.ts`.
   - Red: `src/account-game/runtime.ts(78,40): error TS2344: Type '"records"' does not satisfy the constraint 'never'.`
   - Green: `npm run typecheck` exit 0, 1.74 s.
   - Commit: ba76417d9; comment fix b3ce12081 names the second list (navigate() at `:584`). At the head the red line is at (79,40).
   - Limit: the type is a third hand list. It makes a person open the place, but it does not prove that the conditions at `:400` and `:584` got the screen.
3. Parser round trip: each account path reads back to its own route.
   - File: `tools/account-screen-guard.test.ts` (new). Kind: behaviour test. It takes one or more samples of each AccountEntryRoute screen (a mapped type, so a new screen does not compile without a sample) and checks `parseAccountRoute(new URL(accountPath(route), 'https://kingdown.test'))` equals the route.
   - Fake: `'records'` in ReadRoute, a `records` case in accountPath, a `records` sample in the test. No parser change.
   - Red: `AssertionError: src/online/routes.ts parseAccountRoute: add a case for /play/records: expected { screen: 'play' } to deeply equal { screen: 'records' }`.
   - Green: `Test Files 1 passed (1)  Tests 1 passed (1)`, duration 127 ms.
   - Commit: be145b3e9.

Decision: the new test keeps its own copy of the `Samples` mapped type. It does not edit `src/diagnostics/data.test.ts`, so that this branch touches no file of another builder. Ticket account-screen-04 moves both copies into one module.

### Holes that stay

- `src/plugin/index.html` sections: ticket draft [26](26-account-screen-plugin-sections.md) (a test, no product change; not built because of the limit of 3 guards).
- `src/online/runtime.ts:190` address route: ticket draft [27](27-account-screen-history-route.md) (class C).
- `src/interface/play/main.ts:283` route after web sign-in: ticket draft [28](28-account-screen-web-sign-in-return.md) (GUI file, behaviour).
- Check path lists in `tools/vercel-check.mjs`, `tools/deploy-live-check.mjs`, `tools/plugin-ui-check.mjs`: ticket draft [29](29-account-screen-check-path-lists.md) (source text, low).

### Not verified

- No full `npm test`, no browser check. The typecheck, `npm run test:docs` and the focused run of the new test are green.
- `core.hooksPath` is `.githooks` (pre-commit, commit-msg). Each commit succeeded; I did not read the hook output.
- A full run can find a list of test files that must name the new test; a grep found no such list, but I did not run the full suite.


## api-route

Kind: a new API route (the website /api route table in src/api/http.ts).
Branch: guard-api-route, from origin/main d781512ed (PR #473 merged after the scout used 80b855489). Not pushed.

### Places and their guard today
| Place | What a new route needs | Guard |
|---|---|---|
| src/api/http.ts:140 `routes` (Record<string, Route>) | the key and its handler | none at type level; the source-text key scans below |
| tools/plugin-server.mjs:42 ENABLED_WEB_OPERATIONS | the key | tools/plugin-server-build.test.ts:48 (one file at a time) |
| src/api/http.test.ts:19 and src/api/http.db.test.ts:30 operation sets | the key | tools/plugin-server-build.test.ts:48 |
| tools/plugin-server-config.test.ts:76 toHaveLength(31) | the new count | itself |
| src/diagnostics/data.ts:83-88 fixedRoutes / errorRoute | the path | src/diagnostics/data.test.ts:118 (seam ticket 05) |
| src/online/client.ts:54-114 method and path of each call | the same method and path as a key | NEW: tools/api-route-client.test.ts |
| src/online/client.ts inline reply types against src/api/http.ts:90-98 | the same fields | NEW: tools/api-route-replies.test.ts (8 methods, one direction) |
| src/api/http.ts:207 `created`, :249 `engine`, :252 and :289 `route.key ===` | a correct key | NEW: tools/api-route-lists.test.ts (stale or mistyped key only) |
| src/api/http.ts:156,160,169,174,205 `toolTry` rate limits | a rate limit for a write route | none; ticket [30](30-api-route-typed-route-table.md) |
| src/api/ios-build-8-replies.test.ts:13 kept table | an entry when iOS reads the reply | none (low); ticket [30](30-api-route-typed-route-table.md) |
| src/interface/people/fake-server.ts:46-89 | a branch when a UI test uses the route | loud 404 at :89 |
| src/interface/play/scenes.ts:112-115, tools/verify-*.mjs stubs | a stub when a scene or browser check uses the route | protected files; fetch error at scenes.ts:125 |
| tools/plugin-server-build.mjs:40, tools/deploy-live-check.mjs:18, tools/vercel-check.mjs:166 | nothing | n/a |

### New guards
1. tools/api-route-client.test.ts, behaviour test, commit d3244cc2e.
   - It calls each method of onlineClient with a fetch fake (the GET and PATCH forms of `settings`), and matches each 'METHOD path' against the route keys (the same scan as tools/plugin-server-build.test.ts:50). The `samples` object is a key set over the client methods, so a new method does not compile without a sample.
   - Fake: `find` path '/api/games/find' changed to '/api/games/finds' in src/online/client.ts.
   - Red: `AssertionError: Each call needs a route key in src/api/http.ts (and the operation sets). Fix the path in src/online/client.ts or add the route: expected [ Array(1) ] to deeply equal []` with `+   "client.find: POST /api/games/finds",`.
   - Green: `Test Files  3 passed (3)` after revert. Time: 33 ms (red run); the focused run of all three files takes 176 ms.
2. tools/api-route-lists.test.ts, source-text test, commit 6c5df0602.
   - It reads src/api/http.ts and requires each string of `created`, `engine` and each `route.key ===` / `!==` literal to be a route key. It names all stale keys in one message.
   - Fake: 'POST /api/games/find' changed to 'POST /api/games/finds' in the engine list, and 'GET /api/status' changed to 'GET /api/statuz' at :252.
   - Red: `AssertionError: In src/api/http.ts each key of these lists must be a route key. Fix the key there or add the route: expected [ …(2) ] to deeply equal []` with `"engine: POST /api/games/finds"` and `"route.key ===: GET /api/statuz"`.
   - Green: `Test Files  3 passed (3)`. Time: 5 ms.
3. tools/api-route-replies.test.ts, type guard, commit c0d4333e5.
   - A `Sends<ClientType, RouteReply>` check for create, settings, handle, record, lobby, block, command and invitations. The route reply must be assignable to the type that the client declares.
   - Fake: a required field `fake_field: string` added to the `block` reply type in src/online/client.ts.
   - Red (npm run typecheck): `tools/api-route-replies.test.ts(17,78): error TS2322: Type 'true' is not assignable to type '"the route reply type in src/api/http.ts does not give a field that src/online/client.ts declares; align the two types"'.`
   - Green: npm run typecheck EXIT 0 in 1.9 s; the test file passes in the focused run.

Proof logs: scratchpad api-tc-red.log, api-route-red.log, api-route-red2.log, api-tc-green2.log, api-route-green.log. `git diff` showed no fake before the green runs and before each commit.

### Holes that stay
- Typed route table and per-route policy (engine bound, 201 status, toolTry rate limit), typed `route.key`, the iOS build 8 kept table, typed replies for the other client methods: ticket draft [30](30-api-route-typed-route-table.md). Class C code.

### Known limits
- Guard 1 checks client to route only. It does not find a route without a client method (the iOS app and the plugin use some routes).
- Guard 1 checks the method and the path, not the body or the query.
- Guard 2 reads source text, because the lists are local constants in a class C file. A changed form of the lists makes it fail with 'has no ... list; update this test', not silently pass.
- Guard 3 checks one direction (route reply to client type) for 8 methods only. The client may declare a wider type. The other methods have no exported route reply type.

### Extra proof of the key set in guard 1
- Fake: a method `fake: () => call<void>('GET', '/api/me/fake')` added to onlineClient.
- Red (npm run typecheck): `tools/api-route-client.test.ts(11,7): error TS2741: Property 'fake' is missing in type '{ create: ... }' but required in type '{ create: ... }'`.
- Green after `git checkout -- src/online/client.ts`: npm run typecheck EXIT 0. npm run test:docs: 19 files passed, EXIT 0.

### Not verified
- No full suite. No pre-push hook run (not pushed). The PATCH form of `settings` has no red proof of its own. Guard 3 has a red proof for `block` only.


## tools

Kind: a new ChatGPT plugin tool (`register` in src/plugin/server.ts) and a new Muse tool (`tool` in src/muse/tools.ts).
Branch: guard-tools, from origin/main d781512ed. Worktree: worktree guard-tools. Not pushed.

### Places and their guard today (before this branch)

| Place | What a change does there | Guard today |
|---|---|---|
| src/plugin/server.ts:66 `register(name: string)`, list :127-:237 | Add the register call and its hints | None at type level. CI only: tools/plugin-protocol-check.ts TABLE |
| tools/plugin-protocol-check.ts:11 TABLE | Add a row | CI only (plugin-checks.yml:84, full mode) |
| src/plugin/server.test.ts:223, :234 hint lists | Add the name for an open-world, destructive or non-idempotent tool | Red only for an open-world tool |
| src/plugin/server.db.test.ts:594 count 29 | Change the count | Only with PLUGIN_TEST_DATABASE_URL |
| src/plugin/server.ts:74, src/plugin/service.ts:16 TOOL_LIMITS | Counter decision | None |
| src/plugin/client.ts:53 `call(name: string)` and page callers | Call by a string name | None |
| src/online/runtime.ts:56-81 switch (class C) | Add a case for an app tool | None (run-time throw) |
| src/interface/people/receipt.ts:18 NAMES | Name of a command tool | None |
| docs/plugin-preparation.md:70 model-visible list | Add the name | None |
| Submission texts (SKILL.md, plugin.json, test-cases.md, listing.md, review-notes.md, checklist.md) | Add or rename names | tools/submission-packet.docs.test.ts compares two of them with each other only |
| Tool texts that name other tools (server.ts:152, muse/tools.ts:96) | Change the text | None |
| src/muse/tools.ts:104 `tool(name: string)` | Add the tool | src/muse/tools.test.ts:33 hints table (red) |
| src/muse/tools.ts:22 COUNTERS | Counter of a write tool | None |
| tools/muse-tool-docs.ts:17 EFFECTS, :26 RESULTS | Add lines | tools/muse-tool-docs.docs.test.ts (red) |
| docs/specs/muse-connector/tool-docs.md, public/muse-connector.html | Run npm run muse:docs | tools/muse-tool-docs.docs.test.ts (red) |
| tools/vercel-check.mjs:285 | Add the Muse name | CI only |
| docs/FORMS.md:35 | Wait for the OpenAI review | None (process) |

### New guards

1. Tool names in text (behaviour test, cases from the real listings).
   - File: tools/tool-names-in-text.docs.test.ts (runs in `npm run test:docs`, no lease).
   - It lists the plugin and the Muse tools in memory. Each `kingdown_<name>` in a tool description, in an input field description, in docs/plugin-preparation.md, in docs/submission/*.md and in docs/submission/package/*.json and SKILL.md must be a listed tool. The model-visible sentence of docs/plugin-preparation.md must equal the model-visible tools.
   - Red (real drift, before the doc fix): `docs/plugin-preparation.md, "The model sees": the names differ from the model-visible tools of src/plugin/server.ts. Add or remove the names there` (+ "kingdown_report"). The doc said that the model sees kingdown_report; the server shows it to the board only. The commit changes the doc to follow the server.
   - Red (fakes): `Tool text of kingdown_games (src/plugin/server.ts) names kingdown_show, which is not a listed tool: change the text`; `Tool text of kingdown_view (src/muse/tools.ts) names kingdown_list, which is not a listed tool: change the text` (an input field description); `docs/submission/package/skills/play-king-down/SKILL.md names kingdown_play, which is not a listed plugin tool: change the text (...)`.
   - Green: `Tests  4 passed (4)`, Duration 516 ms (1.3 s with npm).
   - Commit: 0c1aae7c5.
2. Plugin tool names as a type, and the tool table in npm test (type plus behaviour test).
   - Files: src/plugin/tool-names.ts (new, type `PluginTool`); type-only changes in src/plugin/server.ts:66 (`register(name: PluginTool)`), src/plugin/client.ts:7 (`BOARD_ID_TOOLS ... satisfies readonly PluginTool[]`), src/interface/people/receipt.ts:19 (`Partial<Record<Action['type'], PluginTool>>`); new tools/plugin-tool-table.test.ts with TABLE (visibility and four hints) and COUNTER (TOOL_LIMITS key or 'none'), both `satisfies Record<PluginTool, ...>`.
   - Red (typecheck, fake register call): `src/plugin/server.ts(174,12): error TS2345: Argument of type '"kingdown_fake"' is not assignable to parameter of type 'PluginTool'.`
   - Red (typecheck, fake name in PluginTool): `tools/plugin-tool-table.test.ts(24,3): error TS2741: Property 'kingdown_fake' is missing in type ... but required in type 'Record<PluginTool, Row>'.` and the same at (34,3) for COUNTER.
   - Red (typecheck, renamed receipt name): `src/interface/people/receipt.ts(21,55): error TS2820: Type '"kingdown_claim_win"' is not assignable to type 'PluginTool | undefined'. Did you mean '"kingdown_claim"'?`
   - Red (npm test, kingdown_cancel without destructive): `Plugin tool kingdown_cancel: its hints in src/plugin/server.ts and its TABLE row in tools/plugin-tool-table.test.ts differ (also change TABLE in tools/plugin-protocol-check.ts)`.
   - Green: `npm run typecheck` EXIT 0; focused npm test `Tests  3 passed (3)`, Duration 394 ms (1.5 s with npm, both guard files).
   - Commit: 08e7d6db0.
3. Muse tool names as a type, and a counter decision per tool (type plus behaviour test).
   - Files: src/muse/tools.ts (export type `MuseTool`; `tool(name: MuseTool)`; COUNTERS `satisfies Partial<Record<MuseTool, ...>>`), tools/muse-tool-docs.ts (EFFECTS `Record<MuseTool, string>`), new tools/muse-tool-counters.test.ts (COUNTER `satisfies Record<MuseTool, keyof TOOL_LIMITS | 'none'>`).
   - Red (typecheck, fake tool call): `src/muse/tools.ts(262,8): error TS2345: Argument of type '"kingdown_fake"' is not assignable to parameter of type 'MuseTool'.`
   - Red (typecheck, fake name in MuseTool): `tools/muse-tool-counters.test.ts(11,3): error TS2741: Property 'kingdown_fake' is missing ...` and `tools/muse-tool-docs.ts(17,7): error TS2741: Property 'kingdown_fake' is missing ...`.
   - Red (npm test, COUNTERS.kingdown_move set to kingdown_create): `Muse tool kingdown_move: COUNTER in tools/muse-tool-counters.test.ts says kingdown_computer; set COUNTERS.kingdown_move in src/muse/tools.ts to the same TOOL_LIMITS key (or remove it for 'none')`.
   - Green: same focused run as guard 2 (`Tests  3 passed (3)`, 394 ms).
   - Commit: 91b95e347.

After each revert, `git diff` showed no fake. `npm run typecheck` EXIT 0 and `npm run test:docs` 20 files passed on the final tree.

### Holes that stay

| Hole | Ticket draft |
|---|---|
| src/plugin/client.ts:53 `call(name: string)`; the typing goes through the account-game queue (4 type errors) | [31](31-tools-plugin-call-name-type.md) |
| src/online/runtime.ts:56-81 switch, run-time throw only (class C) | [32](32-tools-web-transport-switch.md) |
| The plugin COUNTER decision is not checked against the server rule at src/plugin/server.ts:74 by a call | [33](33-tools-plugin-counter-behaviour.md) |
| docs/FORMS.md:35 review rule (process) | [34](34-tools-forms-review-rule.md) |

Not holes, left as they are: src/plugin/server.db.test.ts:594 count (DB opt-in), tools/vercel-check.mjs:285 (CI), tools/plugin-protocol-check.ts TABLE (CI; now a second copy of the table in tools/plugin-tool-table.test.ts).

### Notes (what is not verified, and decisions)

- The base is origin/main d781512ed, not 80b855489 (main moved before this branch started).
- Decision: the doc fix for kingdown_report follows the server. The server (visibility ['app']) and the CI table of tools/plugin-protocol-check.ts agree that the tool is for the board only. SKILL.md does not name the tool. Its description starts with "Use this when", which is the style of a model-visible tool. The server stays the source: a change of the description or of the visibility is a product change and is out of scope here.
- The COUNTER rows of tools/plugin-tool-table.test.ts come from a read of src/plugin/server.ts:74, not from tool calls (ticket tools-03).
- tools/plugin-protocol-check.ts did not run on this branch (CI only). Its TABLE is unchanged and still agrees with the listing (the dump of the listing matched it).
- One green run used `KINGDOWN_TEST_DOCS=1 npx vitest run <file>` directly, against the machine rule. All later runs used `npm run test:docs` or `npm test` with KINGDOWN_TEST_FILE.
- Open PRs 474 and 369 change none of the files of this branch (checked with gh pr view).
- Regression run on the final tree (focused npm test): tools/forms-drift, tools/game-boundary, tools/account-game-build, src/plugin/server, src/plugin/client, src/muse/tools, src/online/runtime, tools/plugin-tool-table, tools/muse-tool-counters: `Test Files  9 passed (9)`, `Tests  171 passed (171)`, 7.8 s. `git grep` at HEAD finds no fake name. Each commit ends with the trailer line.
- Not run: the full npm test, the CI plugin checks, the DB opt-in test (src/plugin/server.db.test.ts).


## build-flag-env

Kind: a new build flag or environment variable (VITE_KINGDOWN_* or KINGDOWN_* in src, KINGDOWN_* in tools).

Branch guard-build-flag-env, worktree worktree guard-build-flag-env, base origin/main d781512ed (not 80b855489: PR #473 merged before the start). Head 632cd008d. Not pushed. No PR.

### Places and their guard today

Line numbers are at d781512ed.

| Place | What a new flag needs there | Guard today |
|---|---|---|
| import.meta.env reads: src/platform.ts:5, src/plugin/screens/profile.ts:18, src/plugin/screens/setup-model.ts:35, src/plugin/consent.ts:15, src/interface/play/scenes.ts:122, src/api/http.ts:211, src/online/jobs.ts:141 | the read | New: tools/build-flags.test.ts (name list). No type guard (ticket 01). |
| No ImportMetaEnv declaration (tsconfig.json loads vite/client only) | the key and its type | None. Ticket 01. |
| src/account/public-config.ts:7,14,31 and src/account/apple.ts:2 (whole-env readers) | rules for the value | public-config.test.ts checks VITE_KINGDOWN_STAGE values only. The new name list catches the read. |
| tools/plugin-server-build.mjs:97,103 (defines) | a define for each non-VITE_ name | New: tools/build-flags.test.ts (define text). Bundle proof: ticket 02. |
| tools/ios-sync.sh:9-10 | export or unset for the iOS build | None. Ticket 03. |
| tools/deploy.sh:75-76,85; tools/deploy-staging.mjs:13 | refuse or require | tools/deploy.test.ts:221 has a literal list. Ticket 03. |
| tools/release/release.sh:305, tools/release/live.sh:26 | unset | release.test.ts:571 checks live.sh text only. Ticket 03. |
| tools/online-local.mjs:169, vite.config.ts:156 | clear or refuse | online-local.test.ts:125 has a literal list. Ticket 03. |
| tools/lib/checks.mjs:89 CHECK_SITE_ENV | set or clear for checks | check.test.ts:141 literal object. Ticket 03. |
| tools/ci-plan.mjs:80 ('tests' mode clear list) | clear a new KINGDOWN_TEST_* name | New: tools/build-flags.test.ts (clear list or KEPT). |
| tools/ci-plan.mjs:62 ('changed' mode) | clear the test filters | None. It does not clear DOCS, SKIP, NAME. Ticket 04. |
| tools/deploy-plugin-env.mjs:6,11; tools/staging-config.mjs:46,54; tools/release/staging.py:118,175 | server key lists | New name list makes the author look. No test of the lists. Ticket 03. |
| docs/HOSTING.md:15, docs/MUSE.md:89, docs/COMPUTE.md:40 | document the flag | None. The comment of tools/build-flags.mjs now names the places. Ticket 03, step 6. |

### New guards

All three are in tools/build-flags.test.ts, with the list and scan in tools/build-flags.mjs. Kind: a source-text test. A type guard is not possible without class C files (ticket 01). The tools typecheck cannot see process.env in .mjs files.

Proof: one red run with all fakes, then the fakes reverted (git diff empty), then one green run. Fakes: in src/platform.ts the reads import.meta.env.VITE_KINGDOWN_FAKE, import.meta.env.VITE_KINGDWN_STAGE (typo) and import.meta.env.KINGDOWN_FAKE_FLAG; in tools/deploy-staging.mjs:2 the reads process.env.KINGDOWN_FAKE_TOOL and process.env.KINGDOWN_TEST_FAKE; in FLAG_NAMES the names KINGDOWN_FAKE_FLAG, KINGDOWN_TEST_FAKE and KINGDOWN_GONE.

Green line (all guards): " Test Files  1 passed (1)", "      Tests  5 passed (5)", "   Duration  265ms". Time: 0.27 s for the file (the scan runs at import, about 70-150 ms).

The proof is valid at the head only. Commits f74e0f4c5, e54a07928 and 8a7c4cf1b fail with ENOENT (a URL path with an escaped space) without 6c9eabe54. The first red run failed on this path fault and used one more lease run. Lease runs: 5 (path fault, red, green, red of the selection fix, green of the selection fix).

1. Name list. Commit f74e0f4c5 (path fix 6c9eabe54).
   - Red: "src/platform.ts:6 reads VITE_KINGDOWN_FAKE, which tools/build-flags.mjs does not list. If it is a typo, use the listed name. Else add it to FLAG_NAMES, and look at each place that the comment of tools/build-flags.mjs names". The same line came for src/platform.ts:7 VITE_KINGDWN_STAGE and tools/deploy-staging.mjs:2 KINGDOWN_FAKE_TOOL.
   - Red (reverse): "tools/build-flags.mjs lists KINGDOWN_GONE, but no file in src/ or tools/ reads it. Remove it from FLAG_NAMES".
2. Define for each non-VITE_ import.meta.env name in src. Commit e54a07928.
   - Red: "src/platform.ts:8 reads import.meta.env.KINGDOWN_FAKE_FLAG, but tools/plugin-server-build.mjs has no define of 'import.meta.env.KINGDOWN_FAKE_FLAG'. Add the define to each build of a bundle that holds the file, or the bundle reads undefined".
3. KINGDOWN_TEST_* names: cleared by the 'tests' mode of tools/ci-plan.mjs, or in KEPT with a reason. Commit 8a7c4cf1b.
   - Red: "tools/deploy-staging.mjs:2 reads KINGDOWN_TEST_FAKE. Add KINGDOWN_TEST_FAKE: '' to the run(['test'], ...) call of the 'tests' mode in tools/ci-plan.mjs, or add it to KEPT in tools/build-flags.test.ts with the reason that it can pass to the child npm test".

Test selection: commit 632cd008d makes the test pass the quoted folders 'src/' and 'tools/' to scanFlags. Before it, tools/lib/test-select.mjs did not select the test for a change of tools/ios-sync.sh or tools/release/staging.py. Red after it, with the fake read ${KINGDOWN_FAKE_SH:-} at tools/ios-sync.sh:3: "tools/ios-sync.sh:3 reads KINGDOWN_FAKE_SH, which tools/build-flags.mjs does not list. ...". Green after the revert, in one run with the nearby lints tools/{build-flags,workflow.lint,ci-shards,game-boundary,plugin-worker-boundary,lib/test-select}.test.ts: "Test Files  6 passed (6)", "Tests  33 passed (33)", "Duration  3.48s". Now tools/lib/test-select.mjs selects tools/build-flags.test.ts for a change of src/platform.ts, src/plugin/consent.ts, tools/deploy.sh, tools/ios-sync.sh, tools/release/staging.py, tools/deploy-staging.mjs, tools/ci-plan.mjs and tools/build-flags.mjs. A change of vite.config.ts, package.json or tools/plugin-server-build.mjs gives the full plan. Checked with a read-only script.

### Holes that stay

- Strict ImportMetaEnv type (class C readers): [35](35-build-flag-env-strict-import-meta-env.md).
- Bundle proof of the defines (protected tools/plugin-server-build.test.ts): [36](36-build-flag-env-define-behaviour-check.md).
- Literal stage flag lists in refusal and unset tests, ios-sync.sh, CHECK_SITE_ENV, server key lists (protected files): [37](37-build-flag-env-stage-flag-lists.md).
- check:changed passes KINGDOWN_TEST_DOCS, SKIP and NAME to npm test (behaviour change): [38](38-build-flag-env-check-changed-test-filters.md).
- Docs: no full list of flags in a doc (docs/HOSTING.md is protected). Step 6 of [37](37-build-flag-env-stage-flag-lists.md).

### Limits of the new guards

- The scan sees only names with the prefix KINGDOWN_ or VITE_. It does not see RESEND_API_KEY, SUPABASE_URL or other server names.
- It sees a read in the forms import.meta.env.X, import.meta.env['X'], process.env.X, env.X, $X, ${X}, a quoted 'X' or "X", and a shell assignment X=. It does not see a name that the code builds from parts, or a destructured read such as `const { VITE_X } = import.meta.env`.
- It does not scan test files, ios/, .github/ or docs/. KINGDOWN_TEST_OUT is in the list only because package.json:50 and tools/ios-release.sh:24 set it.
- Guard 3 checks only the 'tests' mode call. The 'changed' mode call has the hole of ticket [38](38-build-flag-env-check-changed-test-filters.md).
- Guard 2 checks define text, not the built bundle (ticket [36](36-build-flag-env-define-behaviour-check.md)).
- The scan reads the folders, not the git index. An ignored local file in src/ or tools/ with a KINGDOWN_ name can make the test red in a local checkout. CI has no such file.
- Ticket 04 rests on run() at tools/ci-plan.mjs:28-29, which merges process.env into the child env (read). The leak itself is not run.


## error-text

Kind: a new service refusal or error code. The code goes in the ErrorCode union (src/match/protocol.ts:67-69), and a fail() call gives its message (src/match/service.ts:29).

Branch guard-error-text, from origin/main d781512ed (the task names 80b855489; origin/main moved before the worktree was made). Head 94e582745. Worktree: worktree guard-error-text. Not pushed.

### Places and their guard today

| Place | What a new code needs | Guard before this branch | Guard after this branch |
|---|---|---|---|
| src/match/protocol.ts:67-69 ErrorCode | the new code (source of truth) | none needed | none needed |
| src/match/service.ts:29 fail() (class C) | the refusal call | type: code is ErrorCode | same |
| src/plugin/queue.ts:67 REFUSALS | the code, if the widget must treat it as a definitive refusal | none | tools/error-text-guard.test.ts (typecheck row, then assertion) |
| src/interface/people/server.ts:62 KINDS | a web fault kind that is not 'refused' | none | tools/error-text-guard.test.ts |
| src/muse/tools.ts:37 REFUSED | a fixed Muse sentence, or none | none; a key typo passed | tools/error-text-guard.test.ts; key type Partial<Record<ErrorCode, string>> |
| public/muse-connector.html, docs/specs/muse-connector/tool-docs.md | npm run muse:docs | tools/muse-tool-docs.docs.test.ts | same |
| tools/muse-tool-docs.ts:142 connector code sentence; src/muse/tools.ts Refusal | the new connector code in the docs | none | type: MuseLayerCode and LAYER table |
| src/plugin/server.ts:30 REFUSED | optional plugin words | none for a key typo | key type Partial<Record<ErrorCode, string>> |
| tools/lib/error-forms.mjs:20 and src/diagnostics/data.ts:14,48-56 | message must be a form in the source list | none; messages in constants give 'Unlisted message' | none: ticket draft error-text-1-error-forms-constants.md |
| src/interface/people/screens/problems.ts:25-35, landing.ts, names.ts:39, host/index.ts:255 | feature texts for given codes | none | none needed: a new code gets the general text |
| src/plugin/screens/board.ts, lobby.ts, friend.ts, join.ts, wait.ts; src/account-game/runtime.ts:286-293 | feature branches on given codes | none | none needed |
| src/online/jobs.ts:63 (class C) | feature ignore list | none | none needed |
| tools/plugin-protocol-fixture.ts:17 | a copy, if a plugin UI check needs the flow | type of code only | same |
| src/api/http.ts:289,324; src/online/client.ts:18 | nothing: transport | n/a | n/a |
| ios/, docs/*.md | nothing: no code list | n/a | n/a |

### New guards

1. Forms of each service code
   - File: tools/error-text-guard.test.ts (new). Kind: type (Record<ErrorCode, ...>), then a behaviour test that imports REFUSALS, faultOf and REFUSED and iterates the table.
   - Fake: 'GAME_PAUSED' added to ErrorCode.
   - Red (typecheck): `tools/error-text-guard.test.ts(11,7): error TS2741: Property 'GAME_PAUSED' is missing in type '{ INVALID_INPUT: ... }' but required in type 'Record<ErrorCode, { widget: "failed" | "refused"; web: FaultKind; muse: boolean; }>'.`
   - Red (test, with a row { widget: 'refused', web: 'refused', muse: false } and REFUSALS not changed): `AssertionError: GAME_PAUSED: src/plugin/queue.ts REFUSALS must list it: expected false to be true`.
   - Green: npm run typecheck passes (1.8 s). The focused run passes: 3 files, 42 tests, 1.96 s (tools/error-text-guard.test.ts, src/muse/tools.test.ts, src/plugin/server.test.ts). The guard file alone: 362 ms in the red run.
   - Commit: f473cb216.
2. Key types of the refusal tables
   - Files: src/muse/tools.ts:37 and src/plugin/server.ts:30 (type-only). Kind: type.
   - Fake: key WRONG_TRUN in Muse REFUSED, key STALE_REVISON in plugin REFUSED.
   - Red: `src/muse/tools.ts(42,3): error TS2561: Object literal may only specify known properties, but 'WRONG_TRUN' does not exist in type 'Partial<Record<ErrorCode, string>>'. Did you mean to write 'WRONG_TURN'?` and `src/plugin/server.ts(31,55): error TS2561: ... 'STALE_REVISON' does not exist in type 'Partial<Record<ErrorCode, string>>'. Did you mean to write 'STALE_REVISION'?`
   - Green: npm run typecheck passes (1.8 s).
   - Commit: c13a53df2. The lookup at src/muse/tools.ts:116 uses `REFUSED[code as ErrorCode]`; the run-time value does not change.
3. Connector codes in the Muse docs
   - Files: src/muse/tools.ts (export type MuseLayerCode; Refusal code is ErrorCode | MuseLayerCode; type-only) and tools/muse-tool-docs.ts (LAYER: Record<MuseLayerCode | 'INTERNAL_ERROR', string> builds the sentence). Kind: type.
   - Fake A: 'GAME_LOCKED' added to MuseLayerCode. Red: `tools/muse-tool-docs.ts(42,7): error TS2741: Property 'GAME_LOCKED' is missing in type '{ NO_GAME: string; PERSON_GAME: string; NOT_STARTED: string; INTERNAL_ERROR: string; }' but required in type 'Record<"INTERNAL_ERROR" | MuseLayerCode, string>'.`
   - Fake B: `throw new Refusal('GAME_LOCKED', ...)` with no type change. Red: `src/muse/tools.ts(141,134): error TS2345: Argument of type '"GAME_LOCKED"' is not assignable to parameter of type 'ErrorCode | MuseLayerCode'.`
   - Green: npm run typecheck passes (1.8 s). npm run test:docs -- tools/muse-tool-docs.docs.test.ts passes: 2 tests, 472 ms. Thus the generated text does not change.
   - Commits: e7bfecd9e on the builder branch, then 94e582745, which moved the MuseLayerCode import into the LAYER annotation. On change-guards, 94e582745 is not used: the import line at tools/muse-tool-docs.ts:11 carries `type MuseLayerCode` next to the names of the tools guard (one merged import line). After it, the fake A red line is the same (tools/muse-tool-docs.ts(42,7) TS2741), typecheck passes, and the Muse docs test passes: 2 tests, 495 ms.

### Holes that stay

- Messages in constants are not error forms (tools/lib/error-forms.mjs:20). It needs a behaviour change of the build output. Ticket draft: error-text-1-error-forms-constants.md.

### Notes

- Full npm run test:docs on head e7bfecd9e: 19 files, 199 tests passed, 1 skipped, 1.78 s. The last commit changes only one annotation; after it, only the Muse docs test ran (green).
- Class C check: docs/CHANGES.md defines class C as server, database, accounts, online play, storage, browser history or a cutover. src/plugin/server.ts (the ChatGPT plugin MCP server) and src/muse/tools.ts (the Muse connector tools) can be read as "the server". The task list of class C files does not name them, the scout marked them not protected, and the change in each is type-only (no run-time change). Decision: keep the changes. The lead can move commits c13a53df2 and e7bfecd9e to a ticket if the lead reads these files as class C.
- Overlap: branch guard-tools (commits 0c1aae7c5, 08e7d6db0, 91b95e347, not on origin/main) also changes src/muse/tools.ts, src/plugin/server.ts and tools/muse-tool-docs.ts. Before commit 94e582745, git merge-tree gave a conflict at the import line of tools/muse-tool-docs.ts. After it, git merge-tree guard-tools guard-error-text merges with no conflict. No other guard-* branch or worktree changes these three files.
- gh pr list hit the API rate limit after two open PRs (474 seam-docs, 369 owner-playtest-followups; neither changes these files). The open-PR check is not complete. The local branch check above replaces it in part.
- Only the REFUSALS assertion of guard 1 has a red proof in a test run. The KINDS message (changed from the prototype: it now names the kind to give) and the Muse REFUSED message have no red run. Their code paths are the same loop.
- Guard 1 time: 362 ms is the duration of the red run (guard file only). 1.96 s is the green run of three files. The guard file alone was not timed green.
- The base is d781512ed. The scout prototype ran on 80b855489. The 24 rows pass on d781512ed.
- src/match/invite-notices.ts exists. The INVITE_NOTICES and RANKED_UNAVAILABLE 'Unlisted message' result comes from the scout report; this branch did not run the recorder.

- The FORMS rows record the values of origin/main d781512ed. The guard does not decide if a value is correct. The lead can examine BOARD_EXPIRED (widget 'failed') and HANDLE_TAKEN (widget 'failed').
- The feature texts and branches (screens, widget, jobs) are not lists of all codes. A new code gets the general text there. No draft for them.
- Each fake was reverted. git status is clean after the three commits.


## history

Branch guard-history, worktree worktree guard-history, from origin/main 80b855489. Head 5be63371e. Not pushed. No PR.

### Kinds
1. New browser check: a new tools/verify-*.mjs and an entry in tools/lib/registry.mjs. 33 commits in 6 weeks.
2. New database migration: supabase/migrations/NNNN_*.sql and the places that list it. 14 commits in 6 weeks.
3. New top-level doc and docs/INDEX.md: 10 commits. The guard today is good (tools/docs-index.docs.test.ts). No change.

### Places and their guard today
| Place | Guard today | Guard after this branch |
|---|---|---|
| tools/lib/registry.mjs checks array | checks.lint.test.ts (non-byName only), check.test.ts, ci-shards.test.ts | same |
| tools/verify-<name>.mjs with no entry | none | tools/registry-ci.test.ts (guard 2) |
| tools/ci-shards.mjs checkShards: ci group of a byName entry | none | tools/registry-ci.test.ts (guard 1) |
| tools/checks.lint.test.ts:118 byName entries get no lint | none | ticket guard-history-02 |
| .github/workflows/plugin-checks.yml:193-195 hand-named checks | CI run time only | ticket guard-history-02 |
| tools/ci-shards.test.ts baseline list | reads the registry | same |
| supabase/migrations/NNNN_<name>.sql | release-order.docs.test.ts (one number for each file) | same |
| tools/plugin-db/bootstrap-test.mjs:32 list | release-order list test, no file in the text | migration-places.docs.test.ts names the file (guard 3) |
| tools/plugin-db/migrate.ts:8 list | release-order list test, no file in the text | migration-places.docs.test.ts names the file (guard 3) |
| bootstrap-test.mjs:34 and migrate.ts:8 log ranges | none | guard 3 |
| supabase/README.md:63 and :144 ranges, the last entry | release-order.docs.test.ts | same |
| supabase/README.md:131 init-test range | none | guard 3 |
| supabase/README.md 'Apply NNNN on staging / production' lines | hand cases for 0020, 0021, 0026 | guard 3, for each migration from 0020 on |
| release-order.docs.test.ts:54 files.slice(-2) hand list | itself | ticket guard-history-04 |
| plugin-deploy/runtime-role.sql blocks | release-order.docs.test.ts | same |
| row types in src/match/store.ts, src/online/jobs.ts, src/account/* | none | ticket guard-history-03 |
| docs/<NEW>.md and docs/INDEX.md | tools/docs-index.docs.test.ts | same |

### New guards
1. Unknown ci group (cost of a miss: high)
   - File: tools/registry-ci.test.ts, test 'puts each browser check that CI selects in a CI job'. Kind: behaviour test. It calls checkShards() and iterates the real registry with the same filter (no gpu, and a default entry or a byName entry with ci). The list of known groups in the text comes from the jobs, not from a hand list.
   - Fake: a byName entry 'fake-typo' with ci: 'jouney' in tools/lib/registry.mjs.
   - Red: `tools/lib/registry.mjs: check "fake-typo" has ci "jouney", and tools/ci-shards.mjs puts it in no CI job; use one of fixture, journey, plugin, release, standalone`
   - Green: `Tests  2 passed (2)`, Duration 175ms (focused npm test, KINGDOWN_TEST_FILE=tools/registry-ci.test.ts).
   - Commit: ad1613b01.
2. Browser check script with no registry entry (cost of a miss: medium)
   - File: tools/registry-ci.test.ts, test 'gives each tools/verify-*.mjs browser check a registry entry'. Kind: behaviour test. It reads the tools/ folder and the script values of the real registry. Exempt list with a reason for each: verify-claims.mjs (a Jev claim check), verify-next-panel.mjs (never registered; ticket guard-history-01). A second assertion fails when an exempt file is gone or registered.
   - Fake: tools/verify-fake-orphan.mjs (a copy of verify-verb-marks.mjs), no entry.
   - Red: `tools/verify-fake-orphan.mjs is a browser check with no entry in tools/lib/registry.mjs; add { name, script, limit } there, or add it to the exempt list in tools/registry-ci.test.ts with a reason`
   - Green: the same run as guard 1: `Tests  2 passed (2)`, Duration 175ms.
   - Commit: ad1613b01 (one commit for guards 1 and 2: they share one new file).
3. Migration places (cost of a miss: medium for the apply lines, low for the lists and ranges)
   - File: tools/plugin-db/migration-places.docs.test.ts. Kind: source-text test (the places are a list in code, log strings and prose). It takes the cases from the folder supabase/migrations: each list, each range string, and the apply lines of each migration from 0020 on. 0026 needs no staging line, with the reason in the file.
   - Fake: supabase/migrations/0027_fake_guard.sql.
   - Red (6 of 13 cases):
     - `tools/plugin-db/bootstrap-test.mjs: add each new migration file at the end of its migration list`
     - `tools/plugin-db/migrate.ts: add each new migration file at the end of its migration list`
     - `tools/plugin-db/bootstrap-test.mjs: change the range to end at 0027: "(migrations 0001-0027)"`
     - `tools/plugin-db/migrate.ts: change the range to end at 0027: "Server migrations 0002-0027 applied"`
     - ``supabase/README.md: change the range to end at 0027: "`npm run plugin:db:init-test` applies 0001–0027 twice"``
     - `supabase/README.md: migration 0027 has no staging step; add "Apply 0027 on staging before ..." under its section`
   - Green: `Tests  12 passed (12)`, Duration 160ms (npm run test:docs -- tools/plugin-db/migration-places). Full npm run test:docs: 20 files, 211 passed, 1 skipped, 2.09 s.
   - Commit: 5be63371e.

npm run typecheck is green after each guard.

### Holes that stay
- tools/verify-next-panel.mjs has no entry; the script is protected: ticket [40](40-history-verify-next-panel.md).
- byName ci entries get no lint, and the workflow names checks by hand (both protected, lane seam-ci): ticket [41](41-history-seam-ci-check-names.md).
- Row types for new columns (class C): ticket [42](42-history-row-types.md).
- The old list test and the hand list files.slice(-2) in release-order.docs.test.ts now repeat guard 3: ticket [43](43-history-release-order-duplicate.md).
- docs/**/verify*.mjs: 8 of 18 have no entry. The orphan guard reads only tools/. Recorded in ticket guard-history-01 (Known limits).

### Not verified
- The CI run of the new files. They match tools/**/*.test.ts, so ci-shards puts them in a shard; the full ci-shards test did not run in this lane.
- The commit hooks ran at each commit with no fault. Nothing is pushed.



## Review

Two independent reviewers (neither built a guard) read head 87975d8f7 on 2026-11-25. Each put the faults that each guard names into a scratch copy and ran the guard. Result: blocking 0, notes 16. Each guard goes red on its named fault, and each red and green line in tickets 10, 11 and 12 agrees with their runs. The product files `src/plugin/server.ts`, `src/plugin/client.ts`, `src/interface/people/receipt.ts`, `src/muse/tools.ts` and `src/account-game/runtime.ts` give the same JavaScript as on origin/main (an esbuild compile of both).

One repair batch (the commit after 87975d8f7):

| Note | Repair |
|---|---|
| child-timeouts: the text says "add { timeout }" when a shared options variable holds it; a renamed file gets two texts with no link | The texts say that the timeout goes in the options of the call, and that a renamed file moves its line |
| child-timeouts: no scan of ios/, of more than three levels of parentheses, of aliased imports; the table has 44 calls, not 42 | Limits and repair in ticket [47](47-lessons-child-timeouts-frozen-files.md); 44 in tickets 12 and 47 |
| build-flags: `import.meta.env['X']` passes the define test | The read pattern takes the bracket form as a client read. The destructured form is a limit in ticket 10 |
| build-flags: two expects with no text | Each names the place to change |
| api-route-client: only `:id` parameters | Each `:name` parameter |
| migration places: a hyphen in a file name; the apply text does not name `noStagingLine`; 13 cases, not 12 | `[\w-]+`; the text names `noStagingLine`; "6 of 13" |
| hash-width: one table with a hi half from its lo half stays green, because the large table gives rank 52 alone | A second test asks for rank 52 for each table with 128 keys or more (a smaller table cannot show the fault) |
| game-boundary: no `.tsx`/`.jsx`; a comment in tsconfig.json gives a raw SyntaxError; the fixed paths text does not name the cause | `.tsx` and `.jsx` are scanned; the parse error names the cause; the text names the two paths. `require()`, `extends` and the short alias form are limits in ticket [45](45-guards-a-boundary-scan-limits.md) |
| tool-names-in-text: no subfolders of docs/submission | A recursive read of docs/submission (.md and .json) |
| ticket 10: stale positions, a commit that is not on the branch, a false SKILL.md claim, two draft ticket numbers | Corrected |

Notes with no change: an ignored local file can make the build-flags scan red in a local checkout (CI has none; the red text names the file); two worktrees that run `npm run ios:check` at the same time share one output folder (this was so before this change); `npm run typecheck` stops after the first `tsc` when `src` has errors, so a tools type guard shows only after the `src` error is repaired.

After the batch: `npm run typecheck` passes; the five changed guard files pass (16 tests, 472 ms); `npm run test:docs` passes (215 passed, 1 skipped, 1.82 s).

Repair check: REPAIR_CHECK

## Work record

See the sections above. The final report of the run gives the totals.
