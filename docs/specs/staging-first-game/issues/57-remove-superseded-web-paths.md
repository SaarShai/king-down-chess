# Remove the superseded website poll, the web game client and never-called exports

Status: complete on branch; independent review and merge open. Parent: U09. Branch `staging/lane-deadcode` from `73387e66`.

## What

Remove four product items that no production entry reaches:

1. `webGameClient` (`src/online/game-client.ts`) and its test.
2. `merge` and `watch` (`src/online/client.ts`): the old website poll. `onlineClient` stays.
3. `boardLastMove` (`src/plugin/screens/board.ts`).
4. `usesLeft` (`src/powers-ui.ts`).

## Why

Backlog U09 acceptance: "Superseded controller/screen paths are removed after replacements pass". A reachability walk from every production entry (`index.html`, `src/entry.ts`, `src/plugin/index.html`, `src/plugin/consent.ts`, `src/match/{worker,search-worker,index}.ts`, `tools/plugin-server.mjs`, `tools/mod.ts`) does not reach these items.

## Scope

Changed: `src/online/client.ts`, `src/online/client.test.ts`, `tools/account-game-build.test.ts`, `src/plugin/screens/board.ts`, `src/powers-ui.ts`. Deleted: `src/online/game-client.ts`, `src/online/game-client.test.ts`. `src/powers-ui.test.ts` does not test `usesLeft`, so it does not change. No change to `src/rules/`, `src/match/`, `src/plugin/poll.ts`, `src/main.ts`, `src/game.ts`, `src/new-game.ts` or `src/ai/`.

## Acceptance

- `git grep -n -E "webGameClient|export function watch|export function merge\(local: View|boardLastMove|usesLeft" -- src tools` returns nothing. The `merge` term is narrowed to its signature, because `src/account/sync.ts:91` has a different live `merge`.
- Built JS bytes are equal or smaller. Plugin UI hashes are equal.
- All focused tests and the full suite pass, or each full-suite failure fails the same way at `73387e66`.
- Each removed item has its proof of no use and its replacement (below).

## Result

### Removed items (U09 evidence)

The search covers `src/`, `tools/`, `docs/` and `index.html`, with word-match and fixed-string forms, `import * as` and `import(...)` forms, and string-built import paths (for example `tools/plugin-ui-check.mjs`, `tools/plugin-board.test.ts:584`).

| Item | Proof of no use before removal | Replacement |
| --- | --- | --- |
| `webGameClient`, `src/online/game-client.ts:4` | Importers: only `src/online/game-client.test.ts` and the build fixture `tools/account-game-build.test.ts:30,33`. No other `game-client` path in `src/` or `tools/`. | `pluginGameClient`: the website (`src/account-game/runtime.ts:10,88`) and the app (`src/plugin/client.ts:75`). |
| `merge`, `src/online/client.ts:100` | Only `src/online/client.test.ts:4` and `watch` import it. `src/online/client.ts` has two other importers (`src/api/http.db.test.ts:22`, `tools/fixtures/web-worker/page.ts:1`); both take only `onlineClient`. | The shared poll `runPoll` (`src/plugin/poll.ts:29`) and its targets. `docs/specs/web-adaptation/comparison.md:61` already says: "The shared poll replaces it; delete it then." |
| `watch`, `src/online/client.ts:113` | Only `src/online/client.test.ts:4,78,102`. Other `watch` names in `src/` and `tools/` are unrelated local names. | `runPoll`, as above. |
| `boardLastMove`, `src/plugin/screens/board.ts:41` | No reference outside its definition. The module-local `lastMove` stays; `board.ts` reads it in many places. | None needed: no caller. |
| `usesLeft`, `src/powers-ui.ts:208` | No reference in `src/` or `tools/`. Doc mentions are old plans (`docs/specs/web-redesign/issues/24-card-coins.md:15`, `workshop-proving-ground/issues/13`, `chatgpt-mvp/notes/c-setup.md`), not tests that read source. | `coinState` and `coinWords` (`src/powers-ui.ts`) give the uses left on screen. |

Kept: `onlineClient` (used by `src/online/runtime.ts`), `GameReadError` (used by `src/account-game/hall.ts`), `usesAllowed` (used by `powerTitle` and others).

Test changes: `client.test.ts` loses the `merge` and `watch` cases. Its "only GET" case keeps the full and `since` read checks and drops the poll part. The build fixture drops the `webGameClient` import; it still builds the hall, art and web page host.

### Build measures

Before (`73387e66`) and after (`9bfc8311`) are byte-identical. `npm run build`: 24 files in `dist/assets/*.js`, total 1,305,837 bytes raw, 549,770 bytes at gzip -9. `diff` of the two lists (name, raw bytes, gzip -9 bytes) is empty. The bundler already dropped the dead code, so the build does not change.

| File | Raw | gzip -9 |
| --- | ---: | ---: |
| account-CnS6lb1N.js | 10908 | 4763 |
| card-diagram-D9jlr-kp.js | 5277 | 2204 |
| ceremony-Br0_udsV.js | 126055 | 46438 |
| client-DwUebl9q.js | 217039 | 55395 |
| clipboard-wV9tj58B.js | 656 | 433 |
| coin-O0tuM0NT.js | 1692 | 860 |
| entry-DJFcgp3K.js | 40989 | 13437 |
| eval-CAZzJ0nx.js | 140868 | 102529 |
| ground-BecCU_Ma.js | 107890 | 39221 |
| host-CYuUktHt.js | 2533 | 1254 |
| index-kuLS0ejH.js | 1601 | 862 |
| king-sheets-UbDgVIxP.js | 25654 | 9667 |
| main-CRmGVoMc.js | 73815 | 27129 |
| painted-mesh-BsYSDrXY.js | 739 | 470 |
| power-motion-BlBFXwFb.js | 58587 | 19572 |
| preload-helper-BZ1Pz5am.js | 1218 | 718 |
| public-config-BmFN5Odf.js | 1048 | 566 |
| routes-DgLgtRAq.js | 1081 | 588 |
| runtime-CN9OgYyM.js | 159335 | 51893 |
| search-hb6EQo0e.js | 14436 | 6247 |
| session-Bo4ejbcg.js | 37 | 77 |
| text-IkZfDFGd.js | 95312 | 33707 |
| title-kings-D8WY8Zgm.js | 6430 | 2893 |
| worker-Dht7dZdC.js | 212637 | 128847 |

`npm run plugin:build:ui`: sha256 of all 118 files in `dist-plugin-ui/` is equal before and after (`diff` empty).

### Checks

- `npm run typecheck`: passes (no output after `tsc --noEmit`), after each commit.
- `KINGDOWN_TEST_FILE='src/online/**/*.test.ts' npm test` (with the test database): `Test Files  12 passed (12)`, `Tests  338 passed (338)`.
- `KINGDOWN_TEST_FILE=tools/account-game-build.test.ts npm test`: `Test Files  1 passed (1)`, `Tests  4 passed (4)`.
- `KINGDOWN_TEST_FILE=src/powers-ui.test.ts npm test`: `Test Files  1 passed (1)`, `Tests  29 passed (29)`.
- `KINGDOWN_TEST_FILE='src/plugin/screens/**/*.test.ts' npm test`: `Test Files  6 passed (6)`, `Tests  95 passed (95)`.
- `npm run check:browser web-online web-game`: the first run without `PLUGIN_TEST_DATABASE_URL` fails both checks at once ("Set PLUGIN_TEST_DATABASE_URL to a disposable loopback database"). With it set: `ok   web-online        106.6 s`, `ok   web-game           50.4 s`, `check: all 2 passed`.
- Acceptance `git grep` above: no match (exit 1).
- Full `npm test` with `PLUGIN_TEST_DATABASE_URL` at `9bfc8311`: fails. `Test Files  4 failed | 249 passed (253)`, `Tests  11 failed | 4624 passed | 8 skipped (4643)`, `Duration  361.06s`. All 11 failures are in plugin browser tests: `tools/plugin-app.test.ts` (3), `tools/plugin-lobby.test.ts` (2), `tools/plugin-profile.test.ts` (1), `tools/plugin-screen-lifecycle.test.ts` (5). Errors: six Playwright timeouts (4 or 5 s), `expected '' to be '2 min left'`, `expected 9 to be 8`, and one `Matcher did not succeed in time`.
- The same failures exist at `73387e66`. The four files alone at `9bfc8311`: `Tests  11 failed | 199 passed (210)`. The same four files with `src/` and `tools/` restored to `73387e66` in this worktree (`git checkout 73387e66 -- src tools`, then back to HEAD): `Tests  11 failed | 199 passed (210)`. The two runs fail the same 11 test names with the same error lines (`diff` of the sorted error lines is empty). The machine load average during these runs is 10 to 13, because other agents run at the same time. The plugin UI build is byte-identical before and after this change, so this change cannot cause these failures. They need a separate ticket, or a run on a quiet machine.
- `npm run test:docs`: `Test Files  13 passed (13)`, `Tests  161 passed (161)`.
