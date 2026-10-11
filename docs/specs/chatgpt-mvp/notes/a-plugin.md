# Area A: the existing ChatGPT plugin on main

Read-only map of the private King Down ChatGPT plugin as it is on `main` (HEAD `e73f8061`, 2026-10-11). All paths are relative to the repository root. Line numbers refer to `main`.

## 1. Summary

- The plugin is live and private. Origin: `https://kingdown-plugin.vercel.app`. Vercel project: `kingdown-plugin`. All 16 match-foundation tickets have `Status: resolved`.
- It is an MCP Apps server (`@modelcontextprotocol/ext-apps` ^2.0.3, `@modelcontextprotocol/sdk` ^1.32.1). It has 8 tools and 1 UI resource (the board).
- The board is a small vanilla-TS page (`src/plugin/app.ts`, 117 lines) around the website's `PaintedView` canvas. Controls are plain HTML buttons with system type.
- The server owns every match in PostgreSQL (Supabase). A Node worker thread per operation runs the real engine (`src/match/worker.ts`).
- Auth: Supabase OAuth 2.1 server, resource-bound JWT, plus a live `/auth/v1/user` check on every request.
- Game setup is fixed in the server: `DEFAULT_SETUP = { backRank: 'RAGQKMSO', kings: 'Flame:Haste,Frost:Freeze' }` (`src/plugin/server.ts:8`). No tool input can change the setup. There are no cards, no piece pool, no arrangement, no per-player army, no matchmaking, no profile.
- The board resource is 4,293,039 JSON bytes against a 4,400,000 byte ceiling (ticket 16). Only about 107 KB of headroom is left. This is the largest technical risk for any new UI.

## 2. File inventory

| File | Lines | Role |
|---|---|---|
| `src/plugin/server.ts` | 43 | `createPluginServer()`: registers the board resource and the 8 tools. |
| `src/plugin/http.ts` | 121 | `createPluginHandler()`: stateless Streamable HTTP, auth, CORS, consent routes, admission limit. |
| `src/plugin/auth.ts` | 52 | `createTokenVerifier()`, `pluginOrigin()`, `ACTOR_UUID`, `isLoopback()`. |
| `src/plugin/consent.ts` / `consent.html` / `consent-config.ts` | 65 / 3 / 20 | OAuth consent page at `/authorize` (Google, GitHub sign-in via Supabase SDK). |
| `src/plugin/diagnostics.ts` | 7 | `diagnostic()`: fixed error name/code categories for logs. |
| `src/plugin/index.html` | 1 | Board page markup (buttons, status, choices, Games `<details>`). |
| `src/plugin/app.css` | 1 | Board page CSS. Uses host CSS variables with fallbacks. |
| `src/plugin/app.ts` | 117 | Board client: MCP App bridge, rendering, move input, polling, widget state. |
| `src/plugin/*.test.ts` | — | `auth.test.ts`, `consent-config.test.ts`, `http.test.ts`, `server.test.ts` (Vitest). |
| `src/match/index.ts` | 57 | `LocalMatch`, `createMatch()`, `loadMatch()`, types `MatchSetup`, `MatchSnapshot`, `MatchSave`, `MoveCommand`. |
| `src/match/worker.ts` | 128 | Engine worker: `create`, `load`, `snapshot`, `apply`, `chooseMove`, `save`. Engine fingerprint. |
| `src/match/service.ts` | 97 | `MatchService`: `create/get/openBoard/getBoard/selectBoard/resume/move/computer/invite/join/deleteAccountMatches`. |
| `src/match/store.ts` | 51 | `PostgresMatchStore`, `MatchServiceError`, `seat()`, `MatchMode = 'solo' \| 'friend'`. |
| `src/match/*.test.ts` | — | `match.test.ts` (worker), `service.test.ts`, `service.db.test.ts` (real PostgreSQL, races). |
| `supabase/migrations/0002–0004` | — | Match tables, board selection table, deleted-match recovery. |
| `plugin-deploy/*.sql` | — | `runtime-role.sql`, `board-grants.sql`, `oauth-audience-hook.sql` (manual install, not migrations). |
| `tools/plugin-*.mjs/.ts` | — | Build, server entry, checks, harness (section 9). |
| `.github/workflows/plugin-checks.yml` | 49 | CI on PR and push to `main` / `codex/**`. Publishes nothing. |

## 3. MCP tools

All tools are registered by `register()` in `src/plugin/server.ts:20-25` with `registerAppTool`.

Common properties of every tool:
- `inputSchema`: `z.object(shape).strict()`. Unknown keys fail. `actorId` is never an input; it comes from the verified token (`server.ts:9`).
- `annotations`: `readOnlyHint` (true only for `kingdown_get`), `destructiveHint: false`, `idempotentHint` (see table), `openWorldHint: false`.
- `_meta.ui.resourceUri`: the one board URI (all tools point to it).
- `_meta.ui.visibility`: `['model','app']` only for `kingdown_open`; `['app']` for the other 7. So the model can only call `kingdown_open`. The board calls all tools through `app.callServerTool`.
- Success result: `content: [{type:'text', text:'King Down updated.'}]`, `structuredContent: <MatchView>` (or the invite object).
- Error result: `isError: true`, `content` text = the `MatchServiceError` message (or the fixed text "Could not update the game. Retry or reload."), `_meta.code` = the error code or `INTERNAL_ERROR`. 5xx and unknown errors are logged with `diagnostic()` only.

| Tool | Visibility | Input | What it does | readOnly / idempotent |
|---|---|---|---|---|
| `kingdown_open` | model + app | `matchId?` (1–200 chars), `mode?: 'solo'\|'friend'` | `matchId` → open that game; else `mode` → create a new game with `DEFAULT_SETUP`; else resume latest, or create the first solo game. Then `openBoard()` inserts a new `plugin_boards` row and returns `MatchView` with `boardId`. | false / false |
| `kingdown_create` | app | `mode: 'solo'\|'friend'`, `boardId?` (uuid) | New game with `DEFAULT_SETUP`. With `boardId`, rebinds that board to the new game (`selectBoard`). | false / false |
| `kingdown_resume` | app | `boardId?` | Latest updated game of the actor, or a new solo game. | false / false |
| `kingdown_get` | app | `matchId`, `boardId?` | With `boardId`: the board's selected game (`getBoard`). Else the game by id. | true / true |
| `kingdown_move` | app | `matchId`, `id` (command id, 1–200), `expectedRevision` (int ≥ 0), `lan` (1–120) | One legal move by LAN. Same `id` + same input → returns current state, no second effect. | false / true |
| `kingdown_computer` | app | `matchId`, `id`, `expectedRevision` | Server AI plays Black's turn in a solo game (250 ms, depth 6). | false / true |
| `kingdown_invite` | app | `matchId` | Friend game creator only, while waiting. Returns `{ token, expiresAt }` (32 random bytes base64url, 24 h). Replaces any earlier invite of that match. | false / false |
| `kingdown_join` | app | `token` (1–300), `boardId?` | Takes the Black seat of the invited friend game. | false / true |

`select()` (`server.ts:26-30`) first checks the board (`getBoard`), tolerates `MATCH_REMOVED`, runs the action, then `selectBoard()`.

Error codes the board treats as definitive (they clear the pending retry, `app.ts:51`): `STALE_REVISION, INVALID_MOVE, WRONG_TURN, INVALID_INPUT, FORBIDDEN, WAITING, MATCH_TERMINAL, MATCH_LIMIT, MATCH_INCOMPATIBLE, MATCH_REMOVED, COMMAND_CONFLICT, NOT_FOUND, INVITE_UNAVAILABLE`. `UNAVAILABLE` (503) and `INTERNAL_ERROR` stay retryable.

### Output type `MatchView` (`src/match/service.ts:6`)

```ts
{ boardId?: string; matchId: string; playerColor: 0 | 1; mode: 'solo' | 'friend'; waiting: boolean; snapshot: MatchSnapshot }
```

`MatchSnapshot` (`src/match/index.ts:12`):

```ts
{ rules: PublicMatchRules /* Rules minus hands, piles, cardPool */; moves: { lan: string; move: Move }[];
  revision: number; fen: string; ply: number; turn: 0 | 1; moveNumber: number; status: Status;
  inCheck: boolean; legal: string[]; history: string[] }
```

Note: `structuredContent` goes to the model too. The full `rules` object and every legal `Move` go in each result. No `_meta`-only (widget-only) data is used.

## 4. Board UI (`src/plugin/app.ts`, `index.html`, `app.css`)

### Rendering
- `new PaintedView($('board'))` (`app.ts:17`), the website's painted 2D canvas view (`src/render/PaintedView.ts`, 316 lines). `board.setPace('off')`: no move animation pace.
- Art: `docs/2d-first-pieces/board/scene.mjs` loads `ART_FILES` (11 piece sheets: beast, queen, paladin, maester, pawn, archer, ogre, knight, bishop, rook, guard), `KING_FILES` (6 king sheets: frost, flame, stratus, mud, spirit, shadow, plus effect masks such as `king-flame/lava-mask.webp`, `king-shadow/smoke-mask.webp`) and `board-art/stone-board.webp`. The UI build inlines all of them as data URLs (`assetsInlineLimit: Number.MAX_SAFE_INTEGER`).
- No art exists in the scene for Catapult (C), Reaver (V) or Templar (T). The worker FEN check accepts those letters (`worker.ts:42`), but the board cannot draw them.
- King art per side: `kingDesign(c) = RULES.kings[c]?.king ?? PLAIN_KINGS[c]` (`PaintedView.ts:42`). `sync()` calls `scene.setKings()` on every update, so the art follows the match rules. With no power, White = Spirit and Black = Shadow (`PLAIN_KINGS`, `src/rules/rules.ts`). This matches the MVP "king powers off" default.
- The look is the painted look only (clay is parked, memory 2026-10-11). The plugin floor is `#e6e1cf` (checked in `plugin-ui-check.mjs:20-23`).
- `show(view)` (`app.ts:24-40`): `setRules(view.snapshot.rules)`, `pos = fromFen(fen)`, `board.sync(pos)`, `board.flip(playerColor === 1)`, clears highlight, writes the status line, shows/hides `#computer` and `#invite`, clears choices, saves widget state.
- Status texts: "Waiting for your friend. Share an invitation.", "White wins · Checkmate", "Draw · Stalemate", "Draw · Fifty-move rule", "Draw · Repetition", "Draw · Insufficient material", or "`White|Black` to move[ · Check] · Move N · You play `White|Black`".
- No captured-piece tray, no move list, no king/power panel, no power use counter, no animation of opponent moves, no sound, no symbol-only mode.

### Move input
- `select(square, submit)` (`app.ts:69-82`). Only on own turn, status `playing`, not waiting, not busy, no pending command.
- First tap selects. Highlights: `moves` = destinations of clickable moves where `from !== to`; `captures` = their capture squares. "Clickable" = `!needsArming(move)`. `needsArming(m) = m.pass === true || (m.power && ARMED.has(m.power))` (`src/powers-ui.ts:120`).
- Second tap on a target: options = moves from the selected square that are not armed and whose `to` (when `to !== from`), `captures`, or `shove.from` matches the tapped square. If exactly one ordinary (`!move.power`) option → submit it. Else if exactly one option → submit it. Else show buttons.
- Second tap on the same square deselects (no submit). Drag start (`onDragSelect`) calls `select(sq, false)`: it selects but never submits.
- `#choices`: one button per move of the selected piece, text from `describeMove(pos, move)` (`src/move-text.ts`), `title` = LAN. Armed moves (Haste pass, Freeze, Ice Wall and other `ARMED` powers) are only reachable through these named buttons. Hint texts: "Tap a marked square to move, or choose a move below." / "Choose a move below." / "Choose one of the moves below."
- Haste: the first Haste action is a named button (for example "e2 to e4, with Haste"). After it, the same side stays to move (revision +1, turn unchanged). The second move is a board tap; the pass is a named button. A second tap or drag never passes.
- Archer shot: the shot is a move with `from === to` and `captures` = target. Tapping the target square submits it. Tapping the archer's own square again deselects.
- Keyboard: `#board` has `tabIndex 0`. Arrow keys move a cursor (clamped at edges, flipped for Black) and call `board.setPreview(cursor)`; Enter or Space calls `select(cursor)`. `aria-label` reports the square.

### Commands and retry
- `call(name, args, retain, background)` (`app.ts:41-64`). User calls set `busy`, disable all buttons, clear the error. A `retain` call stores `pending = {name,args}` in widget state before the call.
- `choose(lan)` sends `kingdown_move` with `id: crypto.randomUUID()` and the current `expectedRevision`, `retain = true`. `#computer` sends `kingdown_computer` the same way.
- On a lost reply the board shows `#retry`; Retry sends the same name and args (same command id). Reload keeps the pending command.
- `boardId` is added to `kingdown_get/create/join/resume` args when known.

### Polling (friend games only)
- `setInterval` every 3,000 ms (`app.ts:113-115`). Runs only if connected, `!document.hidden`, not busy, no pending, `mode === 'friend'`, status `playing`, and (waiting for a joiner or not own turn). Calls `kingdown_get` as a background call: it does not disable buttons, skips unchanged results (same match, revision, waiting) and drops results if the user acted meanwhile.
- No push, no Realtime, no WebSocket. Solo games do not poll; the player presses "Computer move" for each AI reply.

### Host integration
- `new App({ name:'King Down board', version:'1.0.0' }, {})`, `app.connect()`.
- `app.ontoolresult`: the first result is a replay of the launch result. The board then calls `kingdown_get` for `saved.matchId ?? value.matchId` and keeps `boardId`.
- Widget state: `window.openai.widgetState` / `setWidgetState({ matchId, revision, pending })` (ChatGPT extension). If `setWidgetState` is missing, it calls `app.updateModelContext({ structuredContent: { matchId, revision } })` instead. Only one of the two writers runs, because the ChatGPT context write replaces the widget-state snapshot (`app.ts:38-39`, harness `plugin-ui-host.ts:25`).
- `app.onclose` stops polling.
- No display-mode request. The Fullscreen button was removed on owner request (ticket 11). The browser check asserts there is no "Fullscreen" button (`plugin-ui-check.mjs:76`).
- Games menu (`<details>`): "New solo game", "New friend game", "Resume game", invitation token text field + "Join". The invitation shows as raw text "Share this invitation: <token>". There is no link and no copy button.
- Layout: `#board` height `min(76vw,650px)`, `105vw` under 450 px width. `main` max width 900 px. Safe-area padding at the bottom.

## 5. Match service and game setup

### `MatchSetup` (`src/match/index.ts:6`)

```ts
interface MatchSetup { backRank?: string; fen?: string; preset?: 'current' | '2017' | '2021'; kings?: string }
```

Validation in `worker.ts:49-61` (`create`):
- Only these four keys (`object()` rejects others).
- `backRank`: `/^[PNBRQKALGMSOCVT]{8}$/`. One string. `Game(backRank)` → `startPosition(backRank)` mirrors it for both sides. There is no way to give White and Black different back ranks except through `fen`.
- `fen` and `backRank` are exclusive. `fen` must be canonical King Down FEN (`toFen(fromFen(fen)) === fen`), ≤ 4,096 chars, exactly one `K` and one `k`, castling and en passant fields `-`, optional 7th field of power-state tokens (`u`, `m`, `f`, `h`, `l`, `g`). A FEN can describe any asymmetric arrangement, so a per-player arrangement is possible through `fen` today.
- `preset`: `current` (default), `2017`, `2021`.
- `kings`: `"White,Black"`, each `King:Power` or `none` (`parseKings`, `src/rules/rules.ts:205`). Kings: Frost (Freeze, IceWall), Flame (Strike, Haste), Stratus (Flight, Sacrifice), Mud (March, Leap), Spirit (HolyLight, Mercy), Shadow (DeathTouch, Darkness). If any king has a power, `POWERS_BALANCED` applies.
- Rules are `setRules({ ...POWERS_BALANCED?, ...preset, kings })`. No other rule override is possible.
- Cards: if `RULES.hands` or `RULES.piles` is not empty → `Error('Private card data unsupported')`. Snapshots strip `hands`, `piles`, `cardPool`. **Card mode is not supported by the match service.**
- Without `backRank` or `fen`: `RNBQKBNR` (not random). The plugin always passes `DEFAULT_SETUP`, so every plugin game today is `RAGQKMSO` with Flame:Haste (White) vs Frost:Freeze (Black).

Piece letters (`src/rules/engine.ts:22`): `P` pawn, `N` knight, `B` bishop, `R` rook, `Q` queen, `K` king, `A` archer, `L` paladin, `G` guard, `M` maester, `S` beast, `O` ogre, `C` catapult, `V` reaver, `T` templar. Current random pool `POOL = 'QOLRRBBNNAAGMMS'` (`src/rules/setup.ts:9`, Paladin back since 2026-10-09). `randomBackRank(rng, pool)` exists in `setup.ts:29` (guard next to king, opposite-colour bishops) but the service does not call it. `CLASSIC_CHESS = 'RNBQKBNR'`.

Card facts relevant to the MVP (`src/rules/rules.ts`): `ALL_CARDS` = the 8 spendable powers (Freeze, IceWall, Strike, Haste, Flight, Sacrifice, March, Leap) + `CARD_ONLY` (Mimic, Vault, Curse, SkyLift, Salvation, Rage, RageB, Mirror, MirrorB, Firewall, FirewallB, EarthQuake, EarthQuakeB, Burn, FireStarter, Control, Rescue, Growth, GrowthB, Rally, Morph, MorphB, Spawn, SpawnK, Spawn2, SpawnK2, MorphP, MorphS). `setRules()` throws if a side has a hand and a spendable king power (`rules.ts:~824`): "card mode plays kings without spendable powers". March/Leap at 0 uses and the four stateless powers (HolyLight, Mercy, DeathTouch, Darkness) can coexist with a hand. **The MVP "cards + king powers" combination conflicts with this engine rule for Frost, Flame, Stratus kings.**

### Service operations (`src/match/service.ts`)
- `create(actor, setup, mode)`: spawns a worker, takes the snapshot and save, inserts the row with White = actor, Black = null.
- Seats: the creator is always White (`white_id`). The joiner is always Black. In solo, the computer is Black (`computer` requires `color === 0` and `turn === 1`). There is no option for the creator to play Black or for the computer to play White.
- `apply()`: dedupe by `(match, actor, command id, payload)`, checks revision, status, 1,000 limit, waiting, turn; loads the save into a new worker (full replay of all commands), applies, exports, then `store.commit()` in a transaction with row lock and a second dedupe. Compute runs outside the lock.
- `invite()`/`join()`: hashed tokens in `plugin_match_invites`, 24 h expiry, single use, idempotent re-join by the same actor.
- `resume()`: latest by `updated_at`.
- `deleteAccountMatches()`: exists in the service but no tool calls it.
- No list of games, no history query, no result/score fields, no ratings, no matchmaking queue, no setup negotiation step.

### Worker (`src/match/worker.ts`)
- Engine fingerprint = SHA-256 of the compiled `worker.mjs` (production) or of `src/game.ts`, `worker.ts`, `src/rules/**`, `src/ai/**` (dev). `load()` rejects a save with another fingerprint → `MATCH_INCOMPATIBLE`: "This saved game uses a different game version. Start a new game to continue playing."
- **Risk:** every engine or AI change in a deploy makes all open plugin games unplayable. There is no multi-version hosting.
- Each `apply` replays the full history in a new worker: cost grows with game length (bounded by 1,000 commands, 8 MB save).
- AI: `search()` with `maxTimeMs: 250, maxDepth: 6` from the service (worker default 250 ms / depth 4). One fixed level. No difficulty option. The AI does not use cards (cards are not supported anyway).
- 15 s watchdog per worker call (`index.ts:40`).

## 6. Database (Supabase PostgreSQL)

| Migration | Content |
|---|---|
| `0001_accounts.sql` (website, not plugin) | `profiles` (`display_name`, `avatar_url`, `rating int default 1200`) and `user_data` (`settings`, `lessons`, `saved_game`, `unlocks` jsonb). Browser-writable personal data. Not match authority. Possible reuse for profile/unlocks. |
| `0002_matches.sql` | `plugin_matches(id, white_id, black_id, mode in ('solo','friend'), revision 0..1000, save text ≤ 8 MB, snapshot jsonb ≤ 8 MB, created_at, updated_at)`, check `mode = 'friend' or black_id is null`; `plugin_match_commands(match_id, actor_id, command_id, payload ≤ 4 KB)` PK on all three; `plugin_match_invites(token_hash PK, match_id, expires_at, joined_by)`. RLS on, all grants revoked from `public, anon, authenticated`. |
| `0003_plugin_boards.sql` | `plugin_boards(id, actor_id, match_id)`: one row per launched board. |
| `0004_plugin_board_recovery.sql` | `plugin_boards.match_id` nullable, FK `on delete set null`. |

Runtime login `kingdown_plugin_runtime` (`plugin-deploy/runtime-role.sql`, `board-grants.sql`): column-level grants, policies `using (true)`. The service checks seats in code. No result, setup, card or matchmaking columns exist. `mode` check allows only `solo` and `friend`: a new mode (for example `random`) needs a migration. New columns need new runtime grants too.

Migrations run with `npm run plugin:db:migrate` (`tools/plugin-db/migrate.ts`) through the admin connection. Startup (`tools/plugin-db-check.mjs`) checks board access, the recovery constraint and the audience allowlist.

## 7. Auth path

1. ChatGPT calls `POST /mcp` without a token → 401 with `WWW-Authenticate: Bearer resource_metadata=".../.well-known/oauth-protected-resource/mcp", scope="openid"` (`http.ts:91`).
2. Metadata (`/.well-known/oauth-protected-resource[/mcp]`): `resource = <origin>/mcp`, `authorization_servers = ['https://utqzovjmclfyojedmwok.supabase.co/auth/v1']`, `scopes_supported = ['openid']`.
3. Supabase OAuth server (Authorization Path `/authorize`; website `kingdown.dev/authorize` redirects to the plugin origin, `vercel.json`) → consent page `/authorize` + `/consent.mjs` on the plugin origin. Consent: sign in with Google or GitHub (Supabase PKCE), choose the account, approve or deny. Only allowlisted client ids can be approved.
4. The custom access-token hook (`plugin-deploy/oauth-audience-hook.sql`) sets `aud` to the exact `<origin>/mcp` for allowlisted `client_id`s (`kingdown_oauth.client_resources`).
5. Each MCP request: `jwtVerify` (issuer, audience = resource, ES256/RS256, required `iss aud sub exp role client_id`, role `authenticated`, client id allowlisted, scope contains `openid` when present), then `GET <issuer>/user` with the bearer (5 s timeout) and `id === sub`. 401/403 from Supabase → 401; other failures → 503 `Retry-After: 5`.
6. `actorId = sub` (the Supabase user UUID). The same user id as the website account.
- Registered ChatGPT OAuth client UUID: `a6478e14-9e9a-43a7-a4b7-b888aed30791` (`tools/deploy-plugin-env.mjs`). Dynamic registration is off.
- Local dev: `--local-dev` with header `X-Kingdown-Dev-Actor: <uuid>`, loopback only, never in production (`http.ts:39-41, 79-82`).

HTTP limits: body ≤ 128 KB, no JSON-RPC batches, ≤ 4 active MCP requests per instance (else 503 `Retry-After: 1`), allowed `Origin`: plugin origin, `https://chatgpt.com`, `https://chat.openai.com`. Stateless: one `McpServer` and transport per request, no session id.

## 8. Build pipeline and resource URI

- `npm run plugin:build:ui` → `tools/plugin-ui-build.mjs`: Vite builds `src/plugin/index.html` with all assets inlined and one JS chunk, then inlines the JS (`<script type="module">`) and CSS into one `board.html`. It computes `ui://kingdown/board-<sha256(html)>.html` and fails if `JSON.stringify({contents:[{uri, mimeType:'text/html;profile=mcp-app', text: html}]})` is over **4,400,000 bytes**.
- `npm run plugin:build` → `tools/plugin-server-build.mjs`: board build, copies `consent.html`, `tools/supabase-ca.crt`, builds `consent.mjs`, builds the match runtime (`tools/plugin-runtime-build.mjs`: `index.mjs` + `worker.mjs` with `__KINGDOWN_COMPILED__`), bundles `tools/plugin-server.mjs` to `server.mjs` (match imports redirected to `./runtime/index.mjs`). Output `plugin-server-dist/`.
- `npm run plugin:build:vercel` → same with `--vercel`: Build Output API tree at `plugin-deploy/.vercel/output/`, function `functions/mcp.func` (`nodejs24.x`, `maxDuration: 30`), symlinked functions for `/authorize`, `/consent.mjs`, `/.well-known/oauth-protected-resource[/mcp]`.
- Resource registration (`server.ts:15-16`): the server re-hashes the HTML at runtime for the URI. `_meta.ui.domain = <origin>`, `csp: { resourceDomains: [], connectDomains: [] }`. The board can load nothing external: all art must be inline, and the board cannot open its own network connections (no Realtime, no fetch).
- Hosts cache by URI. A UI change gives a new URI. After a release: ChatGPT connection → Refresh, then open a fresh board in a new chat (old chats can keep the cached HTML) (ticket 16).
- Size budget today: 4,293,039 of 4,400,000 bytes (≈ 97.6%). Most of it is base64 art: 6 king sheets (112–244 KB each on disk), 11 piece sheets (104–204 KB), board 112 KB, effect masks. Adding a card art set, piece icons, a second board, or profile graphics will exceed the ceiling unless art moves out of the HTML (for example to `resourceDomains` on a CDN, which needs a CSP change and a host test) or is cut/compressed.

## 9. Deployment

- `tools/deploy.sh --setup-plugin`: link the empty project only.
- `tools/deploy.sh --configure-plugin <private-env-file>`: `tools/deploy-plugin-env.mjs` validates a mode-600 file with exactly six keys: `KINGDOWN_PLUGIN_ORIGIN` (must be `https://kingdown-plugin.vercel.app`), `SUPABASE_URL` (must be `https://utqzovjmclfyojedmwok.supabase.co`), `SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_…`), `KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS` (the one approved UUID), `KINGDOWN_PLUGIN_DATABASE_URL` (runtime role on `aws-0-us-east-2.pooler.supabase.com:6543`, `?sslmode=require`), `KINGDOWN_PLUGIN_OAUTH_READY` (`0`/`1`). Values go to Vercel as sensitive env vars.
- `tools/deploy.sh --target plugin [--publish]`: on fresh `origin/main` with a disposable `_test` database: init test DB, type check, tests, `plugin:build:vercel`, `plugin:server:check` on the Vercel function folder, `plugin:smoke`, `plugin:check:protocol`, `check:browser plugin-oauth plugin-ui plugin-ui-http`. With `--publish`: copy the output, link `kingdown-plugin` (scope `saars-projects-2c777ec5`, project `prj_2H4LcrzOXCQbFuKbq0z0G7lCFFC6`, team `team_mIlANWWDRbX1NT4jgJn9jAna`), `vercel deploy --prebuilt --prod`, then `tools/deploy-plugin-live-check.mjs` (unsigned: discovery, 401 challenge, consent page and exact consent script).
- The website deploy is separate (`--target website`). Feature branches need the owner before merge (memory).

## 10. Tests and checks that guard the plugin

| Command | What it proves |
|---|---|
| `npm test` (Vitest) | `src/plugin/*.test.ts` (HTTP limits, auth, consent config, server), `src/match/match.test.ts` (worker: illegal/stale/retry, replay, Archer, Beast, Ogre, Maester, promotion, Haste, shutdown), `service.test.ts`, `service.db.test.ts` (needs `PLUGIN_TEST_DATABASE_URL`; two-process races, seats, invites). |
| `npm run plugin:db:init-test` | Disposable loopback `_test` DB with a stand-in `auth.users`; applies migrations twice. |
| `npm run plugin:server:check` (`tools/plugin-server-check.mjs`) | Compiled artifact outside the tree against real PostgreSQL: open, move, AI, same-id retry, foreign seat rejected, restart + resume, invite/join, deleted-match recovery, resource URI pattern and size < 4.4 MB, production auth gate. |
| `npm run plugin:smoke` (`tools/plugin-runtime-smoke.mjs`) | Source-free runtime: only `index.mjs`, `worker.mjs`, `package.json`; Haste FEN game, no hands/piles in snapshot, AI move legal. |
| `npm run plugin:check:protocol` (`tools/plugin-protocol-check.ts`) | In-memory MCP: exactly 8 tools; all share the resource URI; `kingdown_move` visibility `['app']`; MIME `text/html;profile=mcp-app`; default army only uses `POOL` letters; open/resume/friend/solo/board select; duplicate command; stale; `actorId` injection rejected; secrets not leaked. **Asserts `tools.length === 8`: adding tools needs this test updated.** |
| `npm run check:browser plugin-ui` (fixture) / `plugin-ui-http` (compiled server + PostgreSQL) | `tools/plugin-browser-check.mjs` → `tools/plugin-ui-harness.ts` (Vite host + `AppBridge`, `tools/plugin-ui-host.ts`) → `tools/plugin-ui-check.mjs` (Playwright): floor pixel `#e6e1cf`, Haste ambiguity, definitive errors release pending, lost reply + same-id retry commits once, remount restores game and pending, computer turns, failed read shows no stale moves, no Fullscreen button, 390 px no horizontal scroll, touch moves, second tap deselects, drag never submits, Archer shot and Freeze fixtures, keyboard edges, deleted-game recovery, friend polling during a game switch, invite/join/reply, widget-state-less host uses `updateModelContext`, terminal checkmate. Square math assumes a 960-px-wide scene with `PAD 32`, `TILE 112`, `HEADROOM 64` (`plugin-ui-check.mjs:26`): **any board layout change breaks these clicks.** |
| `npm run check:browser plugin-oauth` | Consent page with the real Supabase SDK against a mock: PKCE, approve, deny, unapproved client, escaping; audience hook in a rolled-back transaction. |
| CI `.github/workflows/plugin-checks.yml` | Ubuntu, Postgres 17 service, Node 24: `npm ci`, init test DB, `npm test`, `plugin:build`, `plugin:server:check`, `plugin:smoke`, `plugin:check:protocol`, Playwright Chromium, `check:browser plugin-oauth plugin-ui plugin-ui-http`. On every PR and push to `main` / `codex/**`. 15 min timeout. |

The harness can run by hand: `npm run plugin:build && npx tsx tools/plugin-ui-harness.ts plugin-server-dist/board.html`. It is an SDK host, not ChatGPT.

## 11. Known limits and open issues

Confirmed limits in code:
1. Fixed setup `RAGQKMSO`, Flame:Haste vs Frost:Freeze for every game (`server.ts:8`). No random draw, no pool, no arrangement, no king choice.
2. One `backRank` for both sides. Different armies per side need `fen`.
3. No cards (`worker.ts:57`, snapshot strips hands/piles). Hidden-hand projection per player does not exist. The AI sees everything.
4. Creator is always White; joiner always Black; computer always Black.
5. Friend invite = raw 43-char token text; the friend must paste it in the Games menu of their own board. No link, no ChatGPT-native share. Model cannot call `join` (visibility `['app']`), so "join with this code" in chat needs the user to open a board first.
6. No random matchmaking, no lobby, no game list, no results history, no profile, no achievements.
7. Polling every 3 s, friend games only. No Realtime (CSP `connectDomains: []`).
8. Engine fingerprint: any engine/AI change invalidates every saved plugin game.
9. Full replay per move; 1,000-command cap; 4 active requests per instance; Vercel `maxDuration` 30 s.
10. Resource at 97.6% of the 4.4 MB ceiling.
11. No art for Catapult, Reaver, Templar.
12. No move animation (`setPace('off')`), no sound, no move list, no captured pieces, no power-use display.
13. `deleteAccountMatches` is not exposed; plugin match data deletion follows `auth.users` cascade only.

Open or unverified items (from tickets 12, 15, 16 and `docs/plugin-preparation.md`):
- Not live-tested: a mobile terminal game, server restart inside the host, the full beta packet N1–N3 matrix (`docs/plugin-beta-support.md`). The iPhone check covers layout, destination taps, Computer move and reopen only.
- Capacity not measured: missing indexes, full-save reads, row retention, account-level limits, cold starts.
- Real-host delivery of error `_meta.code` is not verified (fixture only).
- Tapping a friendly swap/shove target follows the direct-action policy; Reviewer B's alternative is not decided.
- Old chats can keep cached board HTML after a release.
- `TASKS.md:13` (needs-triage): no frozen-piece mark; "keep the plugin default".
- Public submission is out of scope so far (needs stable domain, five positive and three negative test cases, video, reviewer account, privacy/terms URLs).

## 12. ChatGPT host facts recorded in the research docs

From `docs/research/chatgpt-plugin-environment.md`, `chatgpt-plugin-feasibility-2026-10-07.md`, `chatgpt-plugin-preparation.md`, `docs/plugin-preparation.md` and the tickets.

Display modes and launch:
- The UI reference documents inline, fullscreen and PiP, and allows a fullscreen-only initial display. The general UI guide still describes an inline start (the docs disagree; not resolved with OpenAI support).
- Conversation-panel entrypoint (`{type:"thread"}`), global sidebar entrypoints, deep links, settings, composer mentions (desktop only) are documented. Web extensions for Free/Go are "coming soon".
- In the earlier "project GPT" test: menu launch failed three times; model-invoked tool launch and "Open app in tab" worked; PiP was not available in that session.
- At 390 px, a side viewer leaves zero chat width; the host's "Enter full screen" gives a floating composer that can cover lower app controls.
- King Down today: launch is model-invoked `kingdown_open` only; the board runs inline; the plugin's own Fullscreen button was removed at the owner's request.

Widget state and context:
- The iframe is replaceable. Widget state is presentation state; the server is the authority. Do not use `localStorage` or iframe lifetime as the save.
- `window.openai.widgetState` / `setWidgetState` survive remounts. `app.updateModelContext` replaces the widget-state snapshot in ChatGPT, so use one writer.
- The first `ontoolresult` after a remount is a replay of the original launch result; the board must re-read authority.
- `content` and `structuredContent` reach the model; result `_meta` is component-only.
- `updateModelContext` and `sendMessage` carried explicit context to chat in the project GPT test.

Calls from the widget:
- `app.callServerTool` from the board calls tools directly, with no model turn and no approval prompt observed in the live checks (moves update directly; ticket 06/16). Tools with `visibility: ['app']` are hidden from the model.
- Tool annotations (`readOnlyHint`, `destructiveHint`, `openWorldHint`) affect host confirmation behavior; all King Down tools are non-destructive and closed-world.

Resources and limits:
- Hosts cache UI resources by URI; change the URI when HTML/JS/CSS changes (OpenAI UI guide). Refresh the connection and open a fresh chat after release.
- The build ceiling 4.4 MB is a project budget for the `resources/read` JSON payload, not a documented OpenAI number.
- CSP: resources and connections must be declared (`resourceDomains`, `connectDomains`); subframes are restricted. Embedded pages are allowed only under the MCP server's own registrable domain, with review.
- Not documented: module/Blob workers, OffscreenCanvas, autoplay, background execution, storage partitioning, iframe lifetime, CPU/memory limits. Test what is used.
- Use system fonts in UI (UI guidelines), including fullscreen.

Mobile:
- Plugins exist on web, desktop and mobile, with account-dependent exceptions. A narrow browser viewport is not a native-mobile test.
- iPhone ChatGPT app (owner, 2026-10-08): layout fits, destination taps work after ticket 11, Computer move works, reopen keeps the selected game. The initial fresh response can reuse an old cached resource; full app close/reopen helps.

Polling and multiplayer:
- MCP Events are webhook notifications for Work surfaces; no passive chat feed, no native matchmaking, no low-latency clock.
- Cloudflare's tutorial proves two ChatGPT conversations can share one chess game through a direct WebSocket; King Down instead polls `kingdown_get` every 3 s (CSP blocks direct connections today).
- Timed games need server clocks; the host can suspend or close the board.

Accounts, release and business:
- Sign in with ChatGPT is a limited partner trial; not a dependency.
- ChatGPT prefers CIMD client registration; dynamic registration also documented. King Down uses one pre-registered public PKCE client.
- Public submission: one MCP server per plugin, stable HTTPS origin, domain verification, tool scan, 5 positive + 3 negative test cases, video, reviewer account without MFA/magic links, privacy/terms/support URLs. Public trial/demo plugins are not accepted. Desktop and mobile must work.
- Commerce: no sale of digital goods, subscriptions, credits or upgrades in plugins. No card shop.
- Competitors (`chatgpt-chess-market.md`): Chessy (Altmatter, solo vs ChatGPT), Smart Chess (Spheric, coaching), Chess by Max Health (human lobby, "105 players" developer claim), Chess Position Analyzer. None is a fantasy variant. Max Health shows a multiplayer lobby exists in the category.

## 13. What the MVP can reuse as is

- The whole server spine: stateless MCP HTTP handler, OAuth verification, consent page, Supabase OAuth setup, runtime role, Vercel project, deploy script, live check, CI workflow.
- `MatchService` command path: seats, revision checks, command-id dedupe, atomic commit, invite tokens, join, resume, board selection and deleted-match recovery.
- The worker engine boundary (`createMatch`, `apply`, `chooseMove`, save/replay) and the bounded computer opponent.
- `MatchSetup.fen` already allows any asymmetric army arrangement and any king pair; `kings` already allows any king + power per side (`'Spirit:Mercy,Mud:March'`).
- King art switches per side from `RULES.kings` (`PaintedView.sync`), with Spirit/Shadow when no power: this is the MVP "king powers off" look.
- Board input logic: tap/second-tap/drag rules, named buttons for armed powers and Haste, Archer target shots, keyboard navigation, retry/pending recovery, background polling, remount restore.
- Resource-URI hashing and the 4.4 MB build gate.
- The browser harness and Playwright checks as the base for new UI tests.
- `profiles.rating` and `user_data.unlocks` in migration 0001 as a possible start for score and unlocks (they are website, user-writable data; not authoritative for match results).

## 14. What must change for the MVP features

Setup and game options:
1. Replace `DEFAULT_SETUP` with a setup chosen by the initiator. Add a typed `options` input to `kingdown_create` (and `kingdown_open` with mode): fairy on/off + included pieces, arrangement on/off, classic on/off, cards on/off + included cards, king powers on/off + chosen king/power. Validate on the server; never trust a raw FEN from the client for the initial army without legality checks.
2. Server-side random draw from the approved pool (`randomBackRank(rng, pool)` exists; it needs a filtered pool from the sub-menu and must keep its guard/bishop constraints valid for any subset; the draw must be the same pieces for both sides, or decide per side).
3. Arrangement phase: a new pre-game state ("setup") where each player places their drawn pieces. Needs a new match status or table columns, tools such as `kingdown_arrange` / `kingdown_choose_king`, and a final `fen` build when both are ready. The worker today starts playing at creation; it has no setup phase.
4. Joiner choices: the joiner picks own king/power and own arrangement. Today `join` only sets `black_id`. The match must stay unstarted (no worker save) until the joiner commits, or the setup must be rebuilt.
5. Classic chess: `backRank: 'RNBQKBNR'` already works. Note: King Down "classic" has no castling or en passant (feasibility doc) — say so in UI.
6. Cards: the largest gap. The worker rejects hands/piles; snapshots strip them; there is no per-player hidden projection, no card UI in the board, no card art in the resource, and `setRules` forbids a hand together with a spendable king power. Needed: allow `hands`/`piles`/`cardPool` in `MatchSetup` and the save, per-seat projection of the snapshot (own hand visible, opponent hand hidden, also from the model), a card UI, an AI policy for cards, and an owner decision on cards + spendable king powers.
7. King choice: a coin/sub-menu UI for 6 kings × 2 powers; the server passes `kings`. Today the king pair is fixed.

Play modes:
8. Random opponent (matchmaking): new mode value (migration on the `mode` check), a queue table, a pairing tool, and a waiting state with polling. Nothing exists today.
9. Friend invite UX: today a raw token pasted in the Games menu. Consider a share link or a model-visible join tool (`kingdown_join` visibility is `['app']`).
10. Seat colour: "initiator is White by default" matches today; if the initiator may choose Black, `create`/`seat`/`computer` need changes (computer is hard-wired to Black).

Profile and settings:
11. Games registry ("scroll"), results, score, achievements: no table stores results or ratings for plugin games. Needs a results table or columns (winner, reason, finished_at), a list tool, and a profile view. Unlocks: all unlocked in this build, so only a display.
12. Symbol-only graphic mode: `PaintedView` draws only painted sheets. Needs an icon renderer or icon sprites (see `tools/extract-piece-icons.py`, not mapped here) and a settings toggle stored in widget state or `user_data.settings`.

UI, size and tests:
13. New menus (toggles, "all" sub-menus, king coin, arrangement board, profile scroll, settings) all go into the one inline HTML. The 4.4 MB budget has ~107 KB free. Plan for art outside the HTML (declared `resourceDomains`, host test needed) or strict compression before adding cards, icons or scroll graphics.
14. Tool count, input schemas and board layout changes break `plugin-protocol-check.ts` (8 tools), and `plugin-ui-check.mjs` square-coordinate math. Update both with the change.
15. Any engine change invalidates open games (fingerprint). Plan a "start a new game" message or a release window for MVP rule changes.
16. Model-facing results carry the full snapshot including every legal move. With cards, hidden data must not go to `structuredContent` for the opponent or the model; `_meta` hides only from the model, not from the receiving user.
