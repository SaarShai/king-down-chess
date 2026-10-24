# One turn time for games against people (F-031)

Status: resolved on branch `staging/lane-speed` (from `staging/first-game` `2f70eab2`); not merged, not deployed.

## What

Playtest finding F-031 (round 01): the friend setup has no live, Daily or clock choice, so the brief's "live friend game" could not be made.

The owner's answer (2026-10-24): "remove the daily feature altogether. the player doesn't need a choice of days per move. there should be a default and that's it."

So there is no speed choice and no days choice. Each game against a person (friend, random, ranked) has one fixed time for each move: 3 days, the old default. There are no live friend games and no clock. F-031 is closed by this owner decision.

## Scope

- `src/match/service.ts`: one constant, `TURN_DAYS = 3`, next to `FRIEND_CODE_DAYS`. `startKey` takes the speed and the days from the kind. The key keeps both fields, so the start receipts of older starts still match. A rematch gets the fixed time. A friend code lasts `FRIEND_CODE_DAYS`; the old one-day branch for a live friend game goes, because no such game can be made.
- `src/match/protocol.ts`: the create input has no `speed` and no `days_per_move`. The strict schema refuses both with `INVALID_INPUT`. The `refine` rules for them go. `View.speed` and `View.days_per_move` stay, because stored games keep them.
- Stored data: no migration. The `games.speed` and `games.days_per_move` columns and the stored rows stay. A game with 1 or 7 days keeps its time: the deadline code reads the stored value.
- `src/plugin/server.ts`: the `kingdown_create` description says that a game against a person gives three days for each move and that there is no speed or time choice. The `kingdown_claim` description says "ran out of time to move". The model summary (`structuredContent`) of the board and of `kingdown_games` has no `speed`; it keeps `days_per_move`. The board reads `speed` from `_meta.view`.
- `public/privacy.html` (and its test): "alerts about your games against other players". Last updated 24 October 2026.
- `tools/plugin-protocol-fixture.ts`: the same defaults as the service.
- Docs: `docs/specs/accounts-multiplayer/spec.md` (purpose and owner direction), `docs/safety/terms-draft.md` section 10, `docs/safety/uk-record-of-measures.md` M21, and the submission listing copies (`docs/submission/listing.md`, `package/plugin.json`, `release-notes.md`) lose the word "Daily". Dated research files and closed tickets stay as they are.
- Not changed: `src/online/deadline.ts`, `src/online/jobs.ts` (deadline, reminder, claim and first-turn cancel), the screens (no "Daily" word or days choice was there), `src/plugin/screens/board.ts` (its claim text "has not moved for N days" reads the stored days), and Today's army (`army: 'daily'`), a different feature.

## Acceptance

- The create input refuses `speed` and `days_per_move` for each kind: unit test in `src/match/service.test.ts`, HTTP test in `src/api/http.db.test.ts`.
- A new friend game gets `days_per_move` 3, and its move deadline is 3 days after the turn starts. A stored 7-day game gets a 7-day deadline: `src/match/service.db.test.ts`. A stored 1-day game ends on time after 1 day in the sweep: `src/online/jobs.db.test.ts`.
- `npx tsc --noEmit -p .` passes. The touched test files and the plugin server tests pass on a private test database.

## Result

Verification on this branch:

- `npx tsc --noEmit -p .`: no errors.
- Unit and docs tests: `src/match/service.test.ts`, `src/match/ranked-policy.test.ts`, `src/plugin/server.test.ts`, `src/plugin/poll.test.ts`, `src/plugin/http.test.ts`, `src/plugin/screens/board-model.test.ts`, `src/plugin/screens/seat-model.test.ts`, `src/online/deadline.test.ts`, `tools/privacy-policy.docs.test.ts`, `tools/submission-packet.docs.test.ts`: 10 files, 169 tests pass.
- Database tests on `lanespeed_test`: `src/match/service.db.test.ts`, `src/online/jobs.db.test.ts`, `src/api/http.db.test.ts`, `src/plugin/server.db.test.ts`, `src/match/ranked-policy.db.test.ts`, `src/match/results.db.test.ts`, `src/match/setup.db.test.ts`: 7 files, 130 tests pass. The first run failed one test ("runs a Daily friend game with the reviewed runtime role"): `RATE_LIMITED`, because the new test joined one more game by code as the shared guest `b`, and the hourly limit is 10. The new test now uses its own two players.
- `tools/plugin-protocol-fixture.test.ts` and all of `src/plugin/` on `lanespeed_test`: 22 files, 436 tests pass.
- `npm run test:docs` (as `npx vitest run --passWithNoTests .docs.test.ts`): 13 files, 166 tests pass.

## Owner decisions

- A rematch of an older 1-day or 7-day game now gets 3 days. The alternative is to copy the old game's days.
- The submission listing text changes ("Daily games" goes). If OpenAI already has the old text, the next upload must send the new text.
- The terms draft section 10 now says "three days". A lawyer checks the draft before it is published, as before.
