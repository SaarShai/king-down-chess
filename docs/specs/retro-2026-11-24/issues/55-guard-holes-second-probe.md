# Change guards: 17 places that a second probe could forget with no red

Status: done on branch guard-holes (15 of 17 places; items 4 and 7 stay, see below); waits for the review
Source: three independent probes of the guards of PR 477 on `origin/main` 672c2a6aa, 2026-11-25 ([ticket 10](10-change-rehearsals.md)). The lead started them; no prober built a guard.

## Problem

Ticket 10 says: when an agent adds a new instance of a kind and forgets one place, the type check or one fast test names that place. Each prober made half-done changes that the builders and the reviewers of PR 477 did not use. Result: 28 faults, 11 caught, 17 not caught by `npm run typecheck`, the guard test files or `npm run test:docs`. The claim holds for the rehearsed places and for the error codes. It does not hold for the places below.

## Places with no red

A new piece or account screen:

1. `ICON_PIECES` in `src/piece-icons.ts`: a piece in the pool with no entry gets no round icon on the web.
2. The two `enterRead` conditions in `src/account-game/runtime.ts` (lines 401 and 585) for a new read screen. The type guard `ReadScreensListed` goes quiet when the builder adds the screen to the list of the guard itself.
3. The `publish()` branch in `src/online/runtime.ts:164`, `src/interface/play/main.ts:284` and `src/online/sign-in.ts:40` for a new entry-only screen. `publish()` sends `route.screen` with no type check against `Screen`.

A new API route or tool:

4. A reply field that the client declares and the route does not send, for a method that `tools/api-route-replies.test.ts` does not list (ticket [30](30-api-route-typed-route-table.md) holds this).
5. A route key in `src/api/http.ts` in double quotes, or with other indentation: each scan needs two spaces and single quotes, so no list asks for the route.
6. `READ_TOOLS` in `src/account-game/types.ts` (an untyped string list): a new read tool with no entry is queued as a write.
7. The row in `tools/plugin-protocol-check.ts`: only CI finds it (by design).
8. A stale tool name in a tool reply text: `tools/tool-names-in-text.docs.test.ts` reads descriptions and input schemas only.
9. A Muse tool with a `COUNTERS` entry whose body does not call `games.toolTry`: the docs give a limit, and the tool counts no call (ticket [33](33-tools-plugin-counter-behaviour.md) covers the plugin only).

A new build flag, check or migration:

10. A define in one plugin build only: the test reads the whole of `tools/plugin-server-build.mjs`, so one define hides a missing one in the consent build.
11. A flag read in a `.js` or `.mts` file: the scan of `tools/build-flags.mjs` opens `.ts`, `.mjs`, `.sh` and `.py` only.
12. A non-VITE flag that the web bundle reads: no test reads the define block of `vite.config.ts`.
13. A registry entry with `byName: true` and no `ci` group: nothing asks the builder to choose "local only".
14. A check script in a subfolder of `tools/` with no registry entry: the orphan test reads the top level only.
15. A registry entry whose script file does not exist: the only red is the hand-written baseline list in `tools/ci-shards.test.ts:39`; it names no place and goes green when the builder adds the name.
16. A migration with a new table and no grant block in `plugin-deploy/runtime-role.sql`.
17. A migration file with a hyphen after the number (`0027-name.sql`): both docs tests filter on `NNNN_`, so no guard sees the file.

## Failure texts that do not name the place

- A missing card fixture in `SHARED_MECHANICS` gives only `TypeError` lines.
- `src/diagnostics/data.test.ts` names the path, not `src/diagnostics/data.ts`.
- `tools/api-route-client.test.ts` says "add the route" when the route exists in double quotes.
- `tools/plugin-db/release-order.docs.test.ts` fails with no message for a stale README range.

## Record

The full probe results (each fault and its evidence) are in the lead's run folder: `runs/guard-probes-2026-11-25.json`.

## Triage (the lead, 2026-11-26)

- Items 1 to 3, 5, 6 and 8 to 17, and the four failure texts: built in one change, by four builders with separate files. The records below hold each guard with its red line (with the seed) and its green line.
- Item 4 stays in ticket [30](30-api-route-typed-route-table.md). Item 7 stays: only CI finds it, by design.
- Limits that the builders found and did not build: `src/interface/play/main.ts:284` (a new entry-only screen does nothing there, with no red); `route()` in `src/online/runtime.ts` has a third hand list (a new read screen gets the `play` address); the item 13 list of local-only checks is in the test file, not a registry field; the build-flag guard does not cover the `__KINGDOWN_*__` global defines.

## Record: Build flags (items 10 to 12)


Worktree: guard-holes. Files changed: tools/build-flags.mjs, tools/build-flags.test.ts. No product file changes. No commit.

Method: the seeds went into a scratch copy of src/, tools/, vite.config.ts and the html pages (scratchpad/seedcopy, with its own empty git repo for `git rev-parse`). The worktree got no seed. Each run: `KINGDOWN_TEST_NO_TYPECHECK=1 KINGDOWN_TEST_FILE=tools/build-flags.test.ts npm test`.

#### The new guard (items 10 and 12)

Kind: behaviour test over the real import graph. A source-text read stays only for the define block of each build() call.

- tools/build-flags.mjs: new `BUNDLES` (web, consent, plugin server, plugin board, match worker, search worker, match runtime, staging operator: the build file, a text that only its build() call holds, the entry files), `importGraph(root, entries)` (follows relative imports, not type imports) and `defineBlock(text, call)` (the define block of that one build() call).
- tools/build-flags.test.ts: the old test "each non-VITE_ name has a define in the plugin server build" (it read the whole file) is replaced by three tests:
  1. finds the entries and the define block of each bundle (a stale BUNDLES entry is red and names it);
  2. each non-VITE_ name has a define in each bundle that reads it;
  3. each file that reads a non-VITE_ name is in a listed bundle (a new bundle must go in BUNDLES).

##### Item 10: a define in one plugin build only

- Seed: remove `'import.meta.env.KINGDOWN_MUSE'` from the consent build() call only. The plugin server call keeps it, so the old test stayed green.
- Red: `src/plugin/consent.ts:15 reads import.meta.env.KINGDOWN_MUSE, and the consent bundle holds the file, but the build() call with 'src/plugin/consent.ts' in tools/plugin-server-build.mjs has no define of 'import.meta.env.KINGDOWN_MUSE'. Add 'import.meta.env.KINGDOWN_MUSE': JSON.stringify(...) to its define block, or the bundle reads undefined` (Tests 1 failed | 6 passed).
- Green (real tree): `Tests 7 passed (7)`, Duration 252ms.

##### Item 12: a non-VITE flag that the web bundle reads

- Seed: add `export const seedRecorder = import.meta.env.KINGDOWN_ERROR_RECORDER;` to src/interface/entry.ts. The name has a define in tools/plugin-server-build.mjs, so the old test stayed green; vite.config.ts has no define.
- Red: `src/interface/entry.ts:16 reads import.meta.env.KINGDOWN_ERROR_RECORDER, and the web bundle holds the file, but the define block of vite.config.ts has no define of 'import.meta.env.KINGDOWN_ERROR_RECORDER'. Add 'import.meta.env.KINGDOWN_ERROR_RECORDER': JSON.stringify(...) to its define block, or the bundle reads undefined` (Tests 1 failed | 6 passed).
- Green (real tree): `Tests 7 passed (7)`. The web graph (353 files) reads only VITE_ names today.

#### Item 11: a flag read in a .js or .mts file

Kind: scan limit, one-line repair. In tools/build-flags.mjs, `SOURCE` is now `/\.(?:[cm]?[jt]sx?|sh|py)$/` (adds .js, .mts, .cjs, .cts, .jsx, .tsx) and `TEST` is `/\.test\.[cm]?[jt]sx?$/`.

- Seed: new tools/seed-flag.mts (`process.env.KINGDOWN_SEED_WAIT`) and src/interface/ui/seed-flag.js (`process.env.KINGDOWN_SEED_JS`).
- Red: `src/interface/ui/seed-flag.js:1 reads KINGDOWN_SEED_JS, which tools/build-flags.mjs does not list. ... Else add it to FLAG_NAMES, ...` and `tools/seed-flag.mts:1 reads KINGDOWN_SEED_WAIT, which tools/build-flags.mjs does not list. ...` (Tests 1 failed | 6 passed).
- Green (real tree): `Tests 7 passed (7)`; the new .js and .d.mts files read no unlisted name.

#### Support tests 1 and 3: red proofs

- Seed: the consent `call` text in BUNDLES changed to `'src/plugin/consent-page.ts'`. Red: `BUNDLES in tools/build-flags.mjs: tools/plugin-server-build.mjs has not one build() call with 'src/plugin/consent-page.ts' and a closed define block. Give a text that only the build() call of the consent bundle holds` (and test 2 is red too).
- Seed: the consent entry removed from BUNDLES. Red: `src/plugin/consent.ts:15 reads import.meta.env.KINGDOWN_CHATGPT, but no bundle in BUNDLES of tools/build-flags.mjs imports the file. Add the bundle that holds it to BUNDLES ...`.
- Green after each revert: `Tests 7 passed (7)`.

#### Check of the type-import skip

The first graph (no type skip) put src/api/http.ts and src/online/jobs.ts in the web bundle. Both read KINGDOWN_ERROR_RECORDER. A compare of the loose graph and the guard graph gives 20 dropped files. Each one comes into the web graph only through `import type` (for example `src/online/client.ts: import type { InviteLink } from '../api/http'`), or only through other dropped files. Thus the web bundle does not hold these files, and the green on the real tree is true.

The graph also follows `import.meta.glob` of code files (the 23 recipes of src/plugin/card-motion/runtime.ts). Globs of images are not code; the graph does not follow them.

#### Other checks

- `npm run typecheck`: green (last run after all changes).
- `git status`: only my two files of this lane changed; no seed file in the worktree.
- Limits: the graph follows relative imports and code globs only (no bare package names, no `/src/` absolute paths; none in src today). An import with an apostrophe or a semicolon (in a comment) between `import` and `from` is not followed. The web entries in BUNDLES are copied by hand from the script tags of the five html pages. `__KINGDOWN_*__` global defines are not in this guard (the ticket names only import.meta.env flags).

## Record: Checks and migrations (items 13 to 17, failure text 4)


Worktree: game/.claude/worktrees/guard-holes, branch guard-holes. No commit, no push.

Changed files (only these, from this builder):
- tools/registry-ci.test.ts (items 13, 14, 15)
- tools/plugin-db/migration-places.docs.test.ts (items 16, 17)
- tools/plugin-db/release-order.docs.test.ts (failure text 4)

Not changed: tools/lib/checks.mjs, tools/ci-shards.test.ts, tools/lib/registry.mjs, supabase/, plugin-deploy/.

Brief mismatch: the brief names tools/lib/checks.mjs for "registry fields". That file has no registry. The registry is tools/lib/registry.mjs, which is not in my file list. So item 13 uses a list in the test file, not a field. The lead can move the list to a `local` field in registry.mjs later.

Seed method: each seed went into my own test file for one run (a fake element in the list that the guard reads), then the file was restored from a copy. No seed file went into tools/ or supabase/migrations/, because three other builders run tests in the same worktree. After the restore, `grep SEED` finds nothing.

#### Item 13: byName with no ci group must be "local only" by choice

- Guard: behaviour test over the real `checks` list. A named entry with no `ci` and no `ciStep` must be in `localOnly` (name and reason) in tools/registry-ci.test.ts. A stale check is red for a listed name that is gone, not byName, or in CI. The 49 local entries of today are in the list with reasons. The three `ciStep` entries (next-menus, next-skylift, next-rule-text) run in CI, so they are not in it.
- File: tools/registry-ci.test.ts, test "makes each named check without a CI group local only by choice".
- Seed: `{ name: 'seed-local', script: 'tools/verify-turn.mjs', limit: 60, byName: true }` pushed into `checks`.
- Red: `tools/lib/registry.mjs: check "seed-local" has byName and no ci group; give it a ci group (CI runs it), or add "seed-local" to localOnly in tools/registry-ci.test.ts with the reason (local only)`
- Green: `Test Files  2 passed (2)  Tests  15 passed (15)` (registry-ci + ci-shards).

#### Item 14: check script in a subfolder of tools/ with no registry entry

- Guard: the orphan scan now reads all folders of tools/ (`readdirSync('tools', { recursive: true })`) for `verify.mjs` and `verify-*.mjs`. tools/card-motion/verify.mjs is registered, so it stays green. Limit: the scan does not take `*-check.mjs`; tools/lib/*-check.mjs are parts of other checks, and that would need a long exempt list.
- File: tools/registry-ci.test.ts, test "gives each tools/verify-*.mjs browser check a registry entry".
- Seed: the listing got one more name, `seed-folder/verify-seed.mjs`.
- Red: `tools/seed-folder/verify-seed.mjs is a browser check with no entry in tools/lib/registry.mjs; add { name, script, limit } there, or add it to the exempt list in tools/registry-ci.test.ts with a reason`
- Green: `Tests  15 passed (15)`.

#### Item 15: registry entry whose script file does not exist

- Guard: behaviour test, `existsSync(check.script)` for each entry of the real list. The baseline list in tools/ci-shards.test.ts stays as it is.
- File: tools/registry-ci.test.ts, test "finds the script of each registry entry".
- Seed: `{ name: 'seed-missing', script: 'tools/verify-seed-missing.mjs', byName: true, ci: 'journey' }` pushed into `checks`.
- Red: `tools/lib/registry.mjs: check "seed-missing" has script "tools/verify-seed-missing.mjs", and that file does not exist; correct the path, add the script, or remove the entry`
- Green: `Tests  15 passed (15)`.

#### Item 16: new table with no grant block in plugin-deploy/runtime-role.sql

- Guard: for each `create table public.<name>` in the migrations (comments removed), runtime-role.sql (comments removed, whole text) must name `public.<name>` with no word character after it (so `reports_id_seq` does not count for `reports`). Exempt list `noRuntimeGrant` with reasons from the source: `user_data` (0001: browser with the publishable key, grants and Row Level Security), `mod_actions` (runtime-role.sql line 99: the owner's moderation uses the admin connection). A stale exempt entry is red. No migration drops a table today.
- File: tools/plugin-db/migration-places.docs.test.ts, test "gives each new table a grant in plugin-deploy/runtime-role.sql".
- Seed: `tables.push({ file: '0027_seed.sql', table: 'seed_table' })`.
- Red: `supabase/migrations/0027_seed.sql makes table public.seed_table, and plugin-deploy/runtime-role.sql grants nothing on it; add a grant block (begin; grant ... on public.seed_table to kingdown_plugin_runtime; commit;), or add it to noRuntimeGrant in tools/plugin-db/migration-places.docs.test.ts with the reason`
- Green: `npm run test:docs -- tools/plugin-db/migration-places.docs.test.ts tools/plugin-db/release-order.docs.test.ts`: `Tests  22 passed (22)`.

#### Item 17: migration file with a hyphen after the number

- Guard: each entry of supabase/migrations must match `^\d{4}_\w+\.sql$`.
- File: tools/plugin-db/migration-places.docs.test.ts, test "names each migration file NNNN_<name>.sql".
- Seed: the folder listing got one more name, `0027-seed.sql`.
- Red: `supabase/migrations/0027-seed.sql: rename it to NNNN_<name>.sql (four digits, an underscore, letters, digits and _)`
- Green: `Tests  22 passed (22)`.

#### Failure text 4: release-order.docs.test.ts and a stale README range

- Guard: each of the three `toContain` calls of the first test has a message that names supabase/README.md, the reason, and the exact text to write.
- File: tools/plugin-db/release-order.docs.test.ts, test "names the last server migration and the last role block in the release steps".
- Seed: the block count + 1 (as if a new role block came with no README change).
- Red: `AssertionError: supabase/README.md: the last server migration is 0026 and plugin-deploy/runtime-role.sql has 16 blocks; change the release steps to say "apply 0005–0026, then blocks 3–16 of `plugin-deploy/runtime-role.sql`"`
- Green: `Tests  22 passed (22)`.

#### Gates on the real tree

- `npm run typecheck`: exit 0. The first run was red at tools/piece-power-card-guard.test.ts(69,52), a file of another builder; after 60 s it was green.
- `KINGDOWN_TEST_NO_TYPECHECK=1 KINGDOWN_TEST_FILE='{tools/registry-ci.test.ts,tools/ci-shards.test.ts}' npm test`: `Test Files 2 passed (2)`, `Tests 15 passed (15)`. A plain comma list (with no braces) finds no file.
- `npm run test:docs`: `Test Files 21 passed (21)`, `Tests 217 passed | 1 skipped (218)`.

#### Not done

- No `local` field in tools/lib/registry.mjs (that file is not in my list; the list in the test is the smaller form).
- tools/ci-shards.test.ts not changed: its baseline list is still hand-written. Item 15 now has its own red that names the place, so a change there is not necessary.

## Record: Routes and tools (items 5, 6, 8, 9, failure texts 2 and 3)


Worktree: guard-holes. No commit. No push. Items 4 and 7 are skipped (ticket 30; CI only by design).
Seeds go in my own files or in a temporary untracked copy. I removed each seed after its run.

#### Item 5: route key in another quote form or indentation

- Guard: a new scan, `tools/api-route-keys.ts` (a helper, not a test). It reads the `routes` object of `src/api/http.ts` in any indentation, in single, double or back quotes, and with more than one key on a line. It throws when it cannot find the block. A new test in `tools/api-route-lists.test.ts` requires that each key is also in the strict form (two spaces, single quotes, a colon). The strict scan of `tools/plugin-server-build.test.ts` is not my file, so this test protects it and the operation sets. The `created`, `engine` and `route.key ===` lists now read all quote forms. `tools/api-route-client.test.ts` and `src/diagnostics/data.test.ts` now use the shared scan.
- Note: the helper is outside the letter of my file list (it is not a test file). One scan in one file replaces three copies of the regex.
- Seed (in `httpSource` of the helper): `"GET /api/lobby":` in double quotes; `'GET /api/friends':` with four spaces; `'POST /api/relations':` on the same line as the key before it; a new key `'POST /api/seeded'`.
- Red: `src/api/http.ts: write the route key GET /api/lobby on its own line as two spaces, single quotes and a colon (  'GET /api/lobby': ...); tools/plugin-server-build.test.ts and the operation sets read that form only`. The same line comes for GET /api/friends and POST /api/relations.
- Green: `Test Files 3 passed (3)`, `Tests 39 passed (39)` (api-route-lists, api-route-client, data).

#### Failure text 3: api-route-client says "add the route"

- Guard: the client test matches on the shared scan. With the double-quoted seed, the client test stays green and only the form test above is red. That test names the form to write.
- Seed and red: the same as item 5 (the client test was green, and the form test was red).

#### Failure text 2: data.test.ts names the path only

- Guard: the last expect of `src/diagnostics/data.test.ts` has a message.
- Seed: the new key `POST /api/seeded` (item 5 seed).
- Red: `src/diagnostics/data.ts, errorRoute: add each path below (a fixed path to fixedRoutes, a path with an ID to its pattern), so a fault report names the route with no ID: expected [ '/api/seeded', '/api/seeded' ] to deeply equal []`.
- Green: in the item 5 run.

#### Item 6: READ_TOOLS is an untyped string list

- Guard 1 (type): `src/account-game/types.ts`: `export const READ_TOOLS: string[] = [...] satisfies PluginTool[];` with `import type { PluginTool }`. The declared type stays `string[]`, so `.includes(name)` in the two runtime files does not change. The JavaScript is the same.
- Seed 1: `'kingdown_gett'` in READ_TOOLS. Red: `src/account-game/types.ts(10,90): error TS2820: Type '"kingdown_gett"' is not assignable to type 'PluginTool'. Did you mean '"kingdown_get"'?`
- Guard 2 (behaviour test, no database): a new test in `tools/plugin-tool-table.test.ts`. Each `readOnly` row of TABLE (TABLE is equal to the hints of the real server listing) must be in READ_TOOLS or in `NOT_READ_TOOLS` with a reason. Each READ_TOOLS name must be readOnly. Each NOT_READ_TOOLS name must still be readOnly and not in READ_TOOLS.
- Finding: `kingdown_preview` is readOnly on the server and is not in READ_TOOLS. Only the plugin board sends it (`src/plugin/screens/board.ts`, through the plugin client with `background: true`). The account-game `send()` never gets it. It is in NOT_READ_TOOLS with that reason. No behaviour change.
- Seed 2: `'kingdown_profile'` removed from READ_TOOLS. Red: `Plugin tool kingdown_profile is readOnly: add it to READ_TOOLS in src/account-game/types.ts (else the account game queues it as a write), or add it to NOT_READ_TOOLS in tools/plugin-tool-table.test.ts with a reason`.
- Green: `Tests 3 passed (3)` (plugin-tool-table). `npm run typecheck` exit 0.

#### Item 8: tool-names text test reads descriptions and input schemas only

- Guard: `tools/tool-names-in-text.docs.test.ts`.
  - The listing check also reads the tool title and the output schema descriptions.
  - A new source check reads each non-test `.ts` file of `src/plugin/**` and `src/muse/**`. It covers the reply and content texts of every branch, and the calls. The allowed names are the tools of that server's listing. In `src/muse/tools.ts` the test removes only the `export const COUNTERS = ...` line, because its values are plugin counter keys. It fails with "update this test" if that line is missing.
- Seed (in the test, after the read): a plugin reply `content: text('Call kingdown_list_games next.')` added to the text of `src/plugin/server.ts`; `lead: 'Read it with kingdown_show.'` added to `src/muse/tools.ts`; an output field description `Open it with kingdown_board.` added on `kingdown_view` in the Muse listing.
- Red:
  - `src/plugin/server.ts names kingdown_list_games, which is not a listed plugin tool: change the text (a reply text, a description or a call); ...`
  - `src/muse/tools.ts names kingdown_show, which is not a listed Muse tool: ...`
  - `Tool text of kingdown_view (src/muse/tools.ts) names kingdown_board, which is not a listed tool: change the text`
- Green: `npm run test:docs -- tools/tool-names-in-text.docs.test.ts`: `Tests 6 passed (6)`.
- Limit: a reply text built in a shared file outside `src/plugin` and `src/muse` (for example `src/move-text.ts`) is not read. Today no such file has a tool name.

#### Item 9: a Muse tool with a COUNTERS entry whose body does not call games.toolTry

- Guard: a behaviour test in `tools/muse-tool-counters.test.ts`. It calls each counted tool through a real MCP client. The `games` stub records `toolTry` and then stops; every other method records its name and throws. The test requires `toolTry` with `COUNTERS[name]` before any other work. SAMPLES is a `Record<keyof typeof COUNTERS, ...>`, so a new COUNTERS entry does not compile until it has a sample. The `kingdown_move` sample sends `said`, because without `said` the tool refuses before `toolTry`.
- Seed: a temporary untracked copy `src/muse/zz-seed-tools.ts` with the `toolTry` line of `kingdown_move` removed, and the test import pointed at it. I deleted it after the run.
- Red: `Muse tool kingdown_move has COUNTERS.kingdown_move = kingdown_computer but its body in src/muse/tools.ts does not call games.toolTry(actorId, COUNTERS.kingdown_move) before games.view: add that call first in the body (or fix its sample in SAMPLES of tools/muse-tool-counters.test.ts)`.
- Green: `Tests 3 passed (3)`.
- Not seeded: a new COUNTERS entry with no sample. The type gives that red, and the seed needs a change in `src/muse/tools.ts` (not my file).

#### Final runs on the real tree

- `npm run typecheck`: exit 0.
- `npm test` with KINGDOWN_TEST_FILE set to api-route-lists, api-route-client, api-route-replies, plugin-tool-table, muse-tool-counters and data: `Test Files 6 passed (6)`, `Tests 46 passed (46)`.
- `npm run test:docs -- tools/tool-names-in-text.docs.test.ts`: `Tests 6 passed (6)`.
- Note: KINGDOWN_TEST_FILE takes one glob, for example `{tools/a,tools/b}.test.ts`. A plain comma list finds no file.

#### My files

- tools/api-route-keys.ts (new helper)
- tools/api-route-lists.test.ts
- tools/api-route-client.test.ts
- tools/plugin-tool-table.test.ts
- tools/muse-tool-counters.test.ts
- tools/tool-names-in-text.docs.test.ts
- src/diagnostics/data.test.ts
- src/account-game/types.ts (type-only lines)

## Record: Pieces and screens (items 1 to 3, failure text 1)


Worktree: game/.claude/worktrees/guard-holes (branch guard-holes). No commit, no push.
Each seed was put in my own files only, then removed. After each restore, `git status --short` showed only my changes (and the other builders' files).

#### Item 1: ICON_PIECES (src/piece-icons.ts)

- Guard: behaviour test over the released pool (`P` + CLASSIC_CHESS + POOL), through `pieceIcon`. It does not use a type: no released-piece type exists, and POOL is an engine string.
- File: tools/piece-power-card-guard.test.ts, "web: round icon for each released piece". src/piece-icons.ts has no change.
- Seed: remove 'ogre' from ICON_PIECES. (The seed is a removal because POOL is in an engine file.)
- Red: `AssertionError: src/piece-icons.ts ICON_PIECES: add the name of the released piece (and public/ui/icons/<name>.svg): expected [ 'ogre' ] to deeply equal []`
- Green: `Tests 29 passed (29)` (both guard files).

#### Item 2: the two enterRead conditions (src/account-game/runtime.ts)

- Guard: type. There is now one list, `READ_SCREENS = ['play', 'profile', 'settings']`, and one predicate, `isReadScreen`. The two conditions (app.onResult, about line 403, and navigate(), about line 587) call `isReadScreen`. `ReadScreensListed` excludes `typeof READ_SCREENS[number]`, so the guard list and the real conditions are the same list. When a builder adds a screen to the list, both conditions get it. JavaScript behaviour is the same (`includes` against the same three strings).
- File: src/account-game/runtime.ts (lines 77-81, 403, 587).
- Seed: remove 'settings' from READ_SCREENS (the same as a new ReadRoute screen that is not in the list).
- Red: `src/account-game/runtime.ts(80,40): error TS2344: Type '"settings"' does not satisfy the constraint 'never'.`
- Green: `npm run typecheck` exit 0, no error.

#### Item 3: publish() and signInPath

publish() (src/online/runtime.ts:167):
- Guard: type-only. `{ screen: route.screen satisfies Screen }` in the last branch, with a comment that a new entry-only screen needs its own branch above.
- Seed: make the `new-friend` branch not match, so 'new-friend' (an entry-only screen) reaches the last branch.
- Red: `src/online/runtime.ts(167,62): error TS1360: Type '"new-friend" | "play" | "profile" | "settings"' does not satisfy the expected type '"board" | ... | "wait"'.`
- Green: `npm run typecheck` exit 0.

signInPath (src/online/sign-in.ts:40): sign-in.ts is not in my file list, so I did not edit it.
- Guard: type plus behaviour test in tools/account-screen-guard.test.ts. `NextPaths` is a mapped type over `AccountEntryRoute['screen']`: each screen needs a row with its /next.html address. The test runs `signInPath(route, '/next.html')` for each sample.
- Seed A (type): remove the `profile` row. Red: `tools/account-screen-guard.test.ts(26,7): error TS2741: Property 'profile' is missing in type ... but required in type 'NextPaths'.`
- Seed B (behaviour): expect '#settings' for settings. Red: `AssertionError: src/online/sign-in.ts signInPath: give settings its own address: expected '/next.html#play' to be '/next.html#settings'`
- Green: typecheck exit 0; `Tests 29 passed (29)`.

Limit: src/interface/play/main.ts:284 (the signed-in route switch) has no guard. The ticket does not let me edit main.ts. A new entry-only screen there does nothing and gives no red.

#### Failure text 1: missing card fixture in SHARED_MECHANICS

- Guard: fast behaviour test over RELEASED_CARDS. For each card, it looks for the `fixtureId` row in SHARED_MECHANICS. (tools/fixtures/shared-mechanics.test.ts is slow, so the named check is in the fast guard file.) The old TypeErrors in src/render/effects/card.test.ts and motion-concepts.test.ts stay, but this test now names the place.
- File: tools/piece-power-card-guard.test.ts, "shared mechanics: fixture for each released card".
- Seed: add `{ id: 'Rescue', fixtureId: 'card-rescue' }` to the list in the test only.
- Red: `AssertionError: tools/fixtures/shared-mechanics.ts SHARED_MECHANICS: add the signature fixture of the released card: expected [ 'card-rescue (card Rescue)' ] to deeply equal []`
- Green: `Tests 29 passed (29)`.

#### Final green

- `npm run typecheck`: 0 errors.
- `KINGDOWN_TEST_NO_TYPECHECK=1 KINGDOWN_TEST_FILE='{tools/piece-power-card-guard,tools/account-screen-guard,src/piece-icons,src/account-game/hall}.test.ts' npm test`: `Tests 69 passed (69)`, about 0.4 s.
- Note: KINGDOWN_TEST_FILE is a glob. A plain comma list finds no files; use the `{a,b}` form.

#### Holes found, not built (for the lead)

- `route()` in src/online/runtime.ts (about line 191) has a third hand list: `profile` / `settings`, else 'play'. A new read screen gets the 'play' address there and no red.
- docs/specs/retro-2026-11-24/issues/10-change-rehearsals.md line 132 quotes the old definition of `ReadScreensListed`. The doc is not my file.

#### Changed files

- src/account-game/runtime.ts (one list and one predicate, same behaviour)
- src/online/runtime.ts (type-only)
- tools/piece-power-card-guard.test.ts (2 new tests)
- tools/account-screen-guard.test.ts (1 new test and the NextPaths type)
