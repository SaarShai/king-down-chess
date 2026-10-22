# Ranked stays off in production

Status: resolved on branch `staging/lane-rankedoff`; not merged, not deployed. Parent: U10 (plan D2).

## What

Hide Ranked in production for the first release. Keep Ranked fully working in staging, so that it can still be tested.

## Why

Production activation of Ranked is not authorized (`29-ranked-policy-preparation.md:3`; backlog U10; release plan D2). The lead's decision: hide Ranked for the first release.

## Scope

- Server refusal in `src/match/service.ts` and the new error code in `src/match/protocol.ts`. No change in `src/rules/` or `src/match/worker.ts`.
- The shared setup UI (website `/play/` and the ChatGPT board use the same screens in `src/plugin/screens/`), the widget refusal list, and their tests and browser checks.
- The MCP tool schema does not change: `mode` keeps `'ranked'` in its enum, and the tool descriptions do not change. The server refuses at run time.
- Stage detection is the existing one: `KINGDOWN_STAGE=staging` on the server, `VITE_KINGDOWN_STAGE=staging` in the browser build. `tools/staging-config.mjs` and `src/account/public-config.ts` do not change.

## Acceptance

- Production (stage not `staging`): the UI shows no Ranked choice and no text that offers Ranked. The server refuses a ranked create, find (join or open) and accept with the stable code `RANKED_UNAVAILABLE` (HTTP 409) and the message `Ranked is not available. Play a Casual game.` An existing ranked game still shows.
- Staging: Ranked works as before.
- Each new production test fails on the base code. Each existing Ranked test passes under the staging stage.
- `worker.mjs` keeps sha256 `677b4eeaa35113f0cf2b677f1e3650ae512de72485f0ce2c6617383c3af83f0b`; the 11 engine archives do not change.

## Result

### Rule

Ranked is available only on the staging stage. The server reads `KINGDOWN_STAGE` at each start (`process.env.KINGDOWN_STAGE === 'staging'`); the browser reads `import.meta.env.VITE_KINGDOWN_STAGE === 'staging'`. Each other value, and no value, is production.

### Entry points and how each is handled

| Entry point | Production | Staging |
|---|---|---|
| `GameService.create` with `mode: 'ranked'` (MCP `kingdown_create` kind `solo`/`friend`/`random`; HTTP `POST /api/games`) | `canonicalCreate()` refuses with `RANKED_UNAVAILABLE` before any read or write | As before |
| `GameService.find` with `mode: 'ranked'` (MCP `kingdown_create` kind `random`, MCP `kingdown_find`, HTTP `POST /api/games/find`). This covers both a new ranked table and a join of an open one, and a resend with an old command ID | Refused with `RANKED_UNAVAILABLE` | As before |
| `GameService.accept` of a `ranked-v1` game (MCP `kingdown_accept`, HTTP `POST /api/games/:id/accept`, lobby row) | Refused with `RANKED_UNAVAILABLE` | As before |
| Reads of an existing ranked game (view, lobby, inbox, history, cancel, rematch as Casual) | Not changed: the game still shows | As before |
| MCP tool schema (`mode` enum, `rating_policy` enum) and tool descriptions | Not changed, so the tool metadata stays the same. The `kingdown_create` description still names Ranked; a model that asks for Ranked gets the refusal message | As before |
| Shared setup screen (website `/play/` and the ChatGPT board): Casual/Ranked choice | `#setup-rating` is hidden. The line under it says `A game with a random player is Casual. Casual does not change ratings.` | Choice and line as before |
| Setup draft model (`withMode`, `readSetup`, `createArguments`, a saved `last_setup` with `mode: 'ranked'`, a restored pending ranked Find) | Always Casual, so the widget never sends a ranked start | As before |
| Lobby (`Open games`) | Gets a Casual setup, so it shows `Casual ·` and lists the non-ranked games | As before |
| End screen rematch line | `A rematch is Casual. It keeps the features and swaps the colours.` | Adds `Return to Ranked to find another ranked opponent.` |
| Profile rating line | `Rating · Rated game results; no reset.` | `Rating · Ranked and legacy results; no reset.` |
| Widget send queue | `RANKED_UNAVAILABLE` is a definitive refusal (`REFUSALS`), not a failed send to retry | Same |
| Help and rules pages (`public/`, `index.html`, `src/content/`) | No page names Ranked; no change | — |

Stored policy labels (`Ranked`, `Legacy rated`) and the legacy detail line in `src/account-game/rating-policy.ts` stay. They only describe an existing game.

### Error

Code `RANKED_UNAVAILABLE`, HTTP 409, message `Ranked is not available. Play a Casual game.` (`src/match/service.ts`). MCP returns it as `isError` with `_meta.code`.

### Tests

- `src/match/ranked-policy.test.ts`, "Ranked by server stage (ticket 67)": production refuses create, find, find with a command ID and accept; production keeps Casual; staging passes Ranked to the normal start checks.
- `src/match/ranked-policy.db.test.ts`: the existing cases run under `KINGDOWN_STAGE=staging`. The new case makes a ranked table in staging, then in production refuses a new find, a resend, a create and an accept, still shows the game (view and lobby), still opens Casual, writes no second ranked game, and still cancels the old table.
- `src/plugin/screens/setup-model.test.ts`: a production draft (stage unset, empty or `production`) stays Casual; staging gives Ranked.
- Existing Ranked tests now set `VITE_KINGDOWN_STAGE=staging` (or `KINGDOWN_STAGE=staging` in the DB test): `setup-model.test.ts`, `lobby.test.ts`, `app.test.ts`, `server.test.ts`, `http.test.ts`, `tools/plugin-lobby.test.ts`.
- Browser checks branch on `VITE_KINGDOWN_STAGE`. Production: no Ranked choice, no Ranked words in setup and lobby, HTTP and MCP refusal with `RANKED_UNAVAILABLE`, no ranked row in the database, profile line without Ranked. Staging: the old Ranked flows. For the local loopback server, `tools/plugin-browser-check.mjs` and `tools/web-game-check.mjs` set `KINGDOWN_STAGE=staging` in the check process after `configurePlugin`, so the staging host checks in `tools/staging-config.mjs` do not run on loopback. The website check also uses the staging account origin string for a staging build, because `publicAccountConfig` refuses a staging build with another origin. No request leaves loopback.

Red run on the base product code (`c4f3d3c3` versions of `service.ts`, `protocol.ts`, `setup-model.ts`, `setup.ts`, `end.ts`, `profile.ts`, `queue.ts`) with the new tests, `npm test`: `Tests  6 failed | 74 passed (80)`. The three new production tests fail:

- `ranked-policy.test.ts`: `AssertionError: expected MatchServiceError: Pick a handle before y… to match object { code: 'RANKED_UNAVAILABLE', …(2) }`
- `ranked-policy.db.test.ts`: `AssertionError: promise resolved "{ …(32) }" instead of rejecting`
- `setup-model.test.ts`: `AssertionError: expected { Object (mode, kind, ...) } to match object { mode: 'casual', …(2) }`

The other three failures are the pre-existing timing failures below.

### Checks

- `KINGDOWN_TEST_FILE='{src/match/ranked-policy*.test.ts,src/plugin/server.test.ts,src/api/http.test.ts,src/online/runtime.test.ts,src/plugin/app.test.ts,src/plugin/screens/lobby.test.ts,src/plugin/screens/setup-model.test.ts,tools/plugin-lobby.test.ts,src/plugin/queue.test.ts,tools/plugin-protocol-fixture.test.ts,tools/plugin-board.test.ts,src/account-game/games-list.test.ts}' npm test` (lane database): `Tests  2 failed | 516 passed (518)`. The 2 failures are in `tools/plugin-lobby.test.ts` ("updates Your games after Back and keeps rows locked during Resume": `locator.click: Timeout 5000ms exceeded` on a disabled `#page-back`; "keeps the five-second wait budget …": `expected 9 to be 8`). Both fail the same way on the base product code. `tools/plugin-profile.test.ts` "drops a held notice page after SDK teardown …" (`locator.innerHTML: Timeout 5000ms exceeded`) also fails the same way on the base.
- `npm run typecheck`: pass (no output from `tsc --noEmit`).
- `npm run plugin:build:runtime`: pass. `plugin-dist/worker.mjs` sha256 `677b4eeaa35113f0cf2b677f1e3650ae512de72485f0ce2c6617383c3af83f0b`; the 11 files in `plugin-dist/engines` are byte-equal to the tracked `engines/` files.
- `npm run check:browser web-game` (production build): `ok   web-game           34.5 s`.
- `VITE_KINGDOWN_STAGE=staging npm run check:browser web-game`: `ok   web-game           52.6 s` (writes `web-ranked-turn.png`, `ranked-policy.json`, `web-ranked-result.png`).
- `npm run check:browser plugin-ui-http` (production build): `ok   plugin-ui-http    271.9 s`.
- `VITE_KINGDOWN_STAGE=staging npm run check:browser plugin-ui-http`: `ok   plugin-ui-http    303.2 s` (writes `plugin-ranked-policy.png`). One earlier staging run failed at 37.6 s with `The reading-row sample is visible`, a step before any Ranked step; the next run passed.
- `npm run check:browser plugin-ui` (fixture), both stages: `FAIL plugin-ui          14.1 s  locator.click: Timeout 10000ms exceeded.` at `tools/lib/plugin-android-check.mjs:61` (the board sheet `Use` button), before any Ranked step. The base code fails the same way: `FAIL plugin-ui          13.8 s  locator.click: Timeout 10000ms exceeded.` The same `plugin-ui-check.mjs` Ranked steps pass in `plugin-ui-http` in both stages.
- `npm run test:docs`: `Tests  161 passed (161)`.
- Full `npm test` (lane database): `Tests  12 failed | 4671 passed | 8 skipped (4691)`. All 12 failures are browser-harness timing tests that this ticket does not touch: 2 in `tools/plugin-lobby.test.ts` and 1 in `tools/plugin-profile.test.ts` (above), 5 in `tools/plugin-screen-lifecycle.test.ts` (SDK teardown cases) and 4 in `tools/plugin-app.test.ts`. On the base product code, the two last files fail 8 of these 9 the same way (`Tests  8 failed | 142 passed (150)`). The ninth, "keeps two failed polls silent, resets the count on a good read, and locks after three failures", passes alone on this branch (`Tests  1 passed | 135 skipped (136)`).
- `new-game`: not run; this ticket does not change the local new-game screen.
- The lane test database had no schema at first; `npm run plugin:db:init-test` (loopback, `_test` name) made it ready.

### Known limits

- The `kingdown_create` tool description still offers Ranked to the model, because the tool metadata must not change. The server refuses at run time with a clear message.
- A production build that sets `VITE_KINGDOWN_STAGE=staging` would show the choice, but `publicAccountConfig` refuses that build without the staging account project, and the server still refuses.
