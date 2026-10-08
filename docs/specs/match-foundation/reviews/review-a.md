# King Down match foundation and private ChatGPT plugin: independent review

**Scope.** I reviewed `REVIEW_DIFF.txt`, `REVIEW_COMMITS.txt` and the target source in this snapshot. I did not run tests or git commands, and I had no live access. All behavior below comes from reading the source.

**Summary.** I found one real gameplay defect, at Medium severity: some taps and drags on the board submit a move that the player did not choose (Spec finding 1). The other findings are Low. The core server design is sound: seat and turn checks, the atomic save of a move and its receipt, safe retries, invitation races, revocation and TLS.

---

## Standards

### S1 — Low — The match guide tells readers to run bare vitest
- **Where:** `docs/match-foundation.md:67` and `docs/match-foundation.md:69`.
- **Rule:** `AGENTS.md:16`: "Run the tests with `npm test` only… Do not run bare vitest."
- **Trigger:** A reader follows the guide and runs `npx vitest run src/match/match.test.ts --reporter=verbose -t "replay"`.
- **Impact:** The command skips the type check and the standard runner. Other agents copy the forbidden pattern.
- **Correction:** Replace both commands with `npm test`. Name the test titles to look for in its output.

### S2 — Low — The new guides are not in ASD-STE100
- **Where:** `docs/plugin-beta-support.md:3`, `docs/match-foundation.md:55`, `docs/plugin-preparation.md:3`.
- **Rule:** `AGENTS.md:5`: "approved words, short sentences, active voice, present tense."
- **Evidence:** Some sentences have many clauses and passive verbs. For example: "It separates reproducible engineering checks from the actual host evidence needed before inviting players or requesting public review." `plugin-preparation.md:3` is one paragraph of about 15 claims.
- **Impact:** Owner-facing text is hard to check against the evidence.
- **Correction:** Split these paragraphs into short active sentences. The tickets already use this style.

### S3 — Low (subjective smell: feature envy / layer leak) — The service writes board SQL around the store
- **Where:** `src/match/service.ts:27`, `:32`, `:38`. These call `this.store.pool.query(...)` on `public.plugin_boards`.
- **Evidence:** `src/match/store.ts:1` says the store is the "Server-only PostgreSQL authority". All other SQL is in `PostgresMatchStore`.
- **Impact:** Table access is split across two classes. A schema or grant change must find SQL in both.
- **Correction:** Add `openBoard`, `getBoard` and `selectBoard` methods to `PostgresMatchStore`. Call them from the service.

### S4 — Low (smell: duplicated logic) — Two copies of the board grants
- **Where:** `plugin-deploy/runtime-role.sql:29-36` repeats `plugin-deploy/board-grants.sql:1-8` line for line.
- **Impact:** A later grant change can update one copy and not the other. Only `runtime-role.sql` has a test (`src/match/service.db.test.ts:117`).
- **Correction:** Keep one source. For example, keep `board-grants.sql` as the upgrade file and have the role test apply both files in order.

### S5 — Low (smell: repeated data clumps that differ) — Loopback lists and UUID patterns are copied
- **Where (loopback lists):** `src/plugin/auth.ts:5` includes `::1` and `::ffff:127.0.0.1`. These copies omit both:
  - `src/plugin/consent.ts:13`
  - `tools/plugin-db/bootstrap-test.mjs:7`
  - `tools/plugin-browser-check.mjs:21`
  - `tools/plugin-server-check.mjs:15`
  - `tools/deploy-plugin-live-check.mjs:13`
  - `src/match/service.db.test.ts:13`
- **Where (UUID pattern):** It is defined twice, at `src/match/service.ts:7` and `src/plugin/auth.ts:4`.
- **Impact:** Today, an IPv6 loopback address passes one guard and fails another. I found no security effect.
- **Correction:** Export one `isLoopback` and one `ACTOR_UUID` and import them everywhere.

### S6 — Low (subjective, least privilege) — The runtime role can delete any match
- **Where:** `plugin-deploy/runtime-role.sql:10` grants `delete` on `public.plugin_matches`. The RLS policy at `:19-20` is `using (true)`.
- **Evidence:** The only caller is `deleteAccountMatches` (`src/match/service.ts:95`). No tool in `src/plugin/server.ts` calls it. Account deletion already cascades through foreign keys (`0002_matches.sql:5-6`).
- **Impact:** If the server is compromised, it can delete all games. No product path needs this right.
- **Correction:** Remove the `delete` grant, or record why the runtime needs it. Move the delete test to the admin connection.

---

## Spec

### F1 — Medium — A second tap or a drag on the selected piece submits a move the player did not choose
- **Where:** `src/plugin/app.ts:70-73` and `src/plugin/app.ts:84` (`board.onSquareClick = select; board.onDragSelect = select;`).
- **Requirements:**
  - Ticket 11, line 15: "the named Haste button remains explicit… Other ambiguous moves still require a choice… No game rule changes."
  - Spec purpose (`spec.md:7`): use the existing engine and painted board.
  - The lesson "2026-10-02 — helpers outside the engine after a new move kind" (`docs/lessons/engine-and-tests.md:12`). It says to check every helper that reads `m.from`/`m.to`. It names Freeze, whose square is an enemy square.
- **Cause:** When a piece is already selected and the player taps that same square, `options` keeps every move with `move.to === square`. Three default moves start and end on the same square:
  - an Archer shot (`to === from`, no `power`; see `src/rules/engine.ts:61`);
  - a Haste pass (`{from: at, to: at, pass: true}`, no `power`; see `engine.ts:1749`/`:1764`);
  - a Freeze mark (`from === to ===` the enemy piece; see `engine.ts:1316`).
- **The filter does not catch them:** The `ordinary` filter at line 71 only removes moves with `move.power`. A shot and a pass have no `power`, so line 72 submits them at once. A Freeze is the only option for its square, so line 73 submits it.
- **The drag path has the same effect:** `PaintedView.onMove` calls `onDragSelect(dragFrom)` when a drag passes 6 px (`src/render/PaintedView.ts:229-231`). That calls `select()` again on the selected square.
- **Concrete triggers with the default setup** (`RAGQKMSO`, `Flame:Haste,Frost:Freeze`):
  1. **Haste:** White plays e2-e4 with Haste. The player taps e4, then taps it again to deselect, or starts to drag it toward e5. The board submits `pass`, and the turn ends without the second move.
  2. **Archer:** White's Archer has exactly one shot target. The player taps the Archer, then taps it again or starts a drag. The shot fires and captures.
  3. **Freeze:** In a friend game, Black taps a White piece once (this selects it), then taps it again. Black's Freeze use is spent.
- **Impact:** Each case commits an irreversible move or power use with no confirmation. On a phone, a repeated tap or a short drag is common.
- **The website does not do this:** `src/powers-ui.ts:113-121` (`needsArming`/`offered`) requires the player to arm a pass or a mark. `src/main.ts:349-357` (`clickPath`) uses the target square for a shot, not the Archer's own square.
- **Test gap:** `tools/plugin-ui-check.mjs:92` taps e4 and then e5. It never taps the selected square twice and never drags from it.
- **Correction:**
  - Treat a tap on the selected square as "deselect".
  - Make `onDragSelect` only select; it must never submit.
  - Match a same-square move only by its target. For a shot, use `captures[0]`, as `clickPath` does.
  - Leave `pass` and power moves with `from === to` to their named buttons. Reuse `needsArming` from `powers-ui.ts`.
- **Requested checks:** Add browser checks that tap the selected square twice and that drag from it. Run them after (1) a Haste first move, (2) setting up exactly one Archer shot, and (3) a Black Freeze in a friend game. Each must assert that the revision does not change.

### F2 — Low — Worker failures reach the board as definitive rejections, with internal text
- **Where:**
  - `src/match/service.ts:21` maps every `createMatch` failure, including a worker spawn failure or timeout, to `INVALID_INPUT` 400.
  - `src/match/service.ts:65` maps every `match.apply` failure, including "Match worker timed out" and "Match worker exited", to `INVALID_MOVE` 400. Both pass the raw `Error.message` to the client.
- **Trigger:** A worker times out (15 s, `src/match/index.ts:37`) or exits during `apply`.
- **Impact:** The board lists `INVALID_MOVE` and `INVALID_INPUT` as definitive (`src/plugin/app.ts:50-51`). It clears the pending command and shows a misleading reason. No data is lost, because the commit has not happened yet. But the player is told the move is illegal. Internal error text, such as module paths, can reach the host.
- **Requirement:** `docs/plugin-preparation.md` troubleshooting says "Definitive rejection clears its pending receipt; an uncertain lost reply retains the original ID for Retry." A worker fault is not a definitive rejection.
- **Correction:** Map only engine validation messages ("Illegal or ambiguous move", "Match terminal", "Match history limit reached") to `INVALID_MOVE`. Map worker timeout and exit to a retryable code, such as `UNAVAILABLE` 503, with a fixed message. In `create`, return a fixed message, not the internal one.

### F3 — Low (design) — A provider outage tells ChatGPT that the token is invalid
- **Where:** `src/plugin/auth.ts:38-46` (every failure becomes `AuthenticationError`) and `src/plugin/http.ts:89-91` (401 + `WWW-Authenticate`).
- **Trigger:** The Supabase `/user` endpoint times out, returns 5xx, or limits requests. Each friend board in polling state adds one provider call every 3 s (`src/plugin/app.ts:110-112`).
- **Impact:** All users get an OAuth challenge, as if their tokens were revoked. Ticket 10 (lines 29-33) shows how the host reacts to such rejections: a generic error and a connection that needed a manual Reconnect. A short provider outage can push healthy users into that path.
- **Requirement:** Ticket 10 says "Fail closed on … provider failure." A 503 also fails closed; the defect is the 401 signal, not the decision to deny access.
- **Correction:** Return 401 only when the provider answers 401 or 403, or when the user ID differs. For a network error, a timeout or a 5xx/429 answer, return 503 with `Retry-After` and no challenge. Keep the "no cache" rule.

### F4 — Low — The consent page offers Facebook sign-in, which the website hides
- **Where:** `src/plugin/consent.html:3` (`data-provider="facebook"`); `src/plugin/consent.ts:26`.
- **Requirements:**
  - `docs/plugin-preparation.md:72` (consent page "with Google and GitHub sign-in").
  - Ticket 01, line 26 ("Google and GitHub providers are enabled").
  - `src/account/account.ts:2`: the website shows Facebook only with `?facebook=1`, "until Meta verifies the business".
- **Trigger:** A tester picks "Continue with Facebook" on the consent page.
- **Impact:** Sign-in fails or uses a provider that the website does not offer yet. That breaks the authorization request for this tester.
- **Correction:** Remove the Facebook button, or hide it behind the same flag rule as the website.

### F5 — Low — Board-selection storage is missing from the setup guide, the data inventory and the startup check
- **Where:**
  - `docs/plugin-preparation.md:54` (it lists the tables of migration 0002 only).
  - `docs/plugin-preparation.md:77` (step 4 names only `0002_matches.sql`).
  - `docs/plugin-beta-support.md:49` (the stored-data list has no per-board selections).
  - `tools/plugin-server.mjs:41-46` (startup checks only `kingdown_oauth.client_resources`).
- **Requirement:** `spec.md:11`: the preparation "is recorded in the module guide and setup guide."
- **Gaps:**
  - No guide names `0003_plugin_boards.sql`, `plugin_boards` or `board-grants.sql`.
  - The data list omits a table that stores, for each account and each launched board, the selected game. Those rows are never pruned.
- **Trigger:** An operator upgrades an existing role from the guide, or applies only migration 0002.
- **Impact:** The server still starts and passes the unsigned live check (`tools/deploy-plugin-live-check.mjs`). But every `kingdown_open` fails at `src/match/service.ts:27`. The privacy description is incomplete.
- **Correction:**
  - Name 0003 and `board-grants.sql` in step 4 and in the role paragraph.
  - Add board selections to the data list.
  - At startup, add a check that fails without the table, for example `select 1 from public.plugin_boards limit 0` under the runtime role.

### F6 — Low — Bounds: unindexed actor lookups, unbounded board rows, full saves read on every poll
- **Where:**
  - `src/match/store.ts:31` (`latest`: `where white_id=$1 or black_id=$1 order by updated_at…`).
  - `supabase/migrations/0002_matches.sql:3-28` and `0003_plugin_boards.sql:3-7` (no index on `white_id`, `black_id`, `plugin_boards.actor_id`, `plugin_boards.match_id`, `plugin_match_invites.match_id` or `joined_by`).
  - `src/match/service.ts:27` (each launch inserts a board row; nothing removes one).
  - `src/match/store.ts:23` (`select *` loads the full `save`, up to 8 MB, for read-only `get` and polls).
- **Trigger:** The number of games grows. A waiting friend board polls every 3 s.
- **Impact:** Each `kingdown_open` without arguments, each `kingdown_resume` and each account-deletion cascade scans whole tables. Each poll reads the complete save. This is acceptable for two test accounts. It contradicts the guide's own instruction to "measure… before inviting testers" (`docs/plugin-preparation.md:66`).
- **Correction:** Add these indexes in a new migration: `(white_id, updated_at desc)`, `(black_id, updated_at desc)`, `plugin_boards(actor_id)`, `plugin_boards(match_id)` and `plugin_match_invites(match_id)`. Select only the columns that `get` needs. Remove old board rows, or limit them per account.

### F7 — Low — The keyboard cursor wraps across ranks
- **Where:** `src/plugin/app.ts:89`.
- **Trigger:** The cursor is on a1 and the player presses ArrowLeft, or the cursor is on a8 and the player presses ArrowUp.
- **Impact:** The cursor jumps to another rank (from a8 it goes to h8). Keyboard players select the wrong square. The beta packet P5 lists "keyboard focus" (`docs/plugin-beta-support.md:15`).
- **Correction:** Move by file and rank separately, and clamp each one to 0–7.

### F8 — Low (claim accuracy) — Step 5 of the setup guide asks for more live checks than the records show
- **Where:** `docs/plugin-preparation.md:78` says to "run the real-account cases in the beta packet". The packet (`docs/plugin-beta-support.md:11-21`) includes P3 (server restart, chat switch), P5 (mobile terminal game) and N1–N3.
- **Evidence:** Ticket 06 records live desktop solo play, two-player play, seats, consent denial, refresh, reconnect, reopening, controlled lost-result retry and revocation. N1–N3, the P3 restart and the P5 mobile game have only local or fixture evidence. The iPhone result is an owner report.
- **Impact:** The release claim in `spec.md:19` matches the narrower scope of ticket 06. But a reader of step 5 can believe the whole packet passed live.
- **Correction:** In step 5 or in ticket 06, name the packet items that are not run live.

### Areas with no findings
- **Retries and races:** The receipt, the stale-revision check and the save are committed under one row lock (`store.ts:40-49`). Identical retries, including concurrent computer retries, return current authority. Concurrent different commands give exactly one winner. Invitation and join paths lock in the same order, so they cannot deadlock.
- **Turns:** Turns use the engine's actual turn, never ply parity (`service.ts:54`). Haste follows that turn.
- **Authentication:** Actor IDs come only from verified identity. The audience hook and the exact-audience check reject website tokens. Every request checks the live session.
- **Browser roles:** Browser roles have no grants on any plugin table.
- **TLS:** Query options cannot replace the TLS settings (`tools/plugin-db-config.mjs`).
- **Deployment:** The plugin release pins the team and the project, tests fresh `origin/main`, publishes the tested artifact and sends secrets through standard input.
- **Polling:** A background read cannot overwrite a newer user action (`app.ts:48`, `:55`).
- **Temporary diagnostics:** No `VERIFY-live` control, `DEBUG-selected-game` trace, result-discard hook or lifetime log remains in the tracked source.

### Evidence classes
| Class | Items |
|---|---|
| Live, agent-observed in the ChatGPT host | Desktop play, seats, consent denial, lost-result retry, fresh-token revocation (provider 403 at 1,109 s left), immediate reopen |
| Owner report | All iPhone results ("seems to be working", "that worked") |
| Fixture or local | Every browser check, the database race tests, the OAuth mock, the worker smoke test |

The tickets label these classes correctly.

### Files and flows inspected
- **Guidance:** `AGENTS.md`, `CLAUDE.md`, `TASKS.md`, the Always and Index sections of `LESSONS.md`, `docs/lessons/engine-and-tests.md` (2026-10-02), `docs/agents/issue-tracker.md`, `docs/agents/triage-labels.md`.
- **Spec and docs:** the spec, tickets 01, 02, 05–11, `docs/match-foundation.md`, `docs/plugin-preparation.md`, `docs/plugin-beta-support.md`.
- **Source:** all of `src/match/*`; `src/plugin/{app,server,http,auth,consent,consent-config,consent.html,view}.ts`.
- **SQL:** `supabase/migrations/0002`, `0003`, all of `plugin-deploy/*.sql`.
- **Tools:** `tools/plugin-server.mjs`, `plugin-server-build.mjs`, `plugin-runtime-build.mjs`, `plugin-ui-build.mjs`, `plugin-db-config.mjs`, `plugin-db/*`, `plugin-browser-check.mjs`, `plugin-ui-check.mjs`, `plugin-ui-harness.ts`, `plugin-server-check.mjs`, `deploy-plugin-env.mjs`, `deploy-plugin-live-check.mjs`, `deploy-live-check.mjs`, the plugin parts of `deploy.sh`.
- **Other:** `vercel.json`, `.github/workflows/plugin-checks.yml`, `package.json`, `tsconfig.json`, `vite.config.ts`.
- **Engine and website parts read for F1:** `Move`, Freeze, the pass generation, `PaintedView` pointer handling, `powers-ui.ts` arming, `main.ts` click paths.

### Limitations
- No git or tests: I did not run them and I did not verify any runtime behavior.
- The diff shows final file states only, so I could not check the code before ticket 11.
- Some files I read only in part or not at all: `src/plugin/http.test.ts`, `tools/plugin-oauth-check.mjs`, `tools/plugin-protocol-check.ts`, `tools/plugin-protocol-fixture.ts`, `tools/deploy.test.ts`, `src/match/match.test.ts`.
- I did not review website deploy work outside the consent route, or workshop and balance work.
- I had no live database, provider or host access, so I cannot confirm the indexes, grants or settings in production.