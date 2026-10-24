# Keep a staged local turn on reload, and name the recovered game in the URL

Status: resolved on branch `staging/lane-routes` (from `staging/first-game` `2f70eab2`); not merged, not deployed.

## What

Two confirmed S4 findings of the four-player staging playtest. The tickets and the evidence are in the parent workspace, `playtest/reports/tickets/F-010.md` and `F-035.md`.

- **F-010.** In the public local game, Two players: stage d2-d3. The status asks for End turn; Undo and End turn are on. Reload once. Black is to move, d3 stays, and Undo and End turn are off. The reload hands the turn over without End turn.
- **F-035.** In an account solo game: submit a move. While the computer reply is pending, load `/play/` as a new page. Recovery shows the correct source board, but the address stays `/play/`. Recovery itself is intended; F-077 (the selected game stays selected during recovery) must stay fixed.

## Decisions

- **F-010: keep the staged turn.** [Web-redesign spec §4.8](../../web-redesign/spec.md) is the design: the save holds a `staged` count, and a reload keeps the staged turn (End turn shows, Undo works, the computer does not start). The fast plan cut it as item Y2 ("a reload counts as the press"). The owner's request for this fix ("a reload must not commit a staged turn") reverses Y2, so this branch builds §4.8 as written. Account games already keep a draft over a reload (`src/plugin/screens/board.ts`, the draft restore), so both kinds of game now agree. The other choice, a clean Undo of the staged turn on reload, loses the player's move with no notice.
- **F-035: replace the address at start-up.** When the durable receipt opens its own game in place of the entry address (`/play/`, `/play/settings`, `/j`), the browser host replaces the address with `/g/<game>` before the first mount. The mount then runs as a reload of that game's page does. `replaceState`, not `pushState`: the games list never showed, so Back does not return to a list that the player did not see. The Play control still opens the list at `/play/`.

## Scope

- `src/screen/save.ts`: the `staged` field of `Save`.
- `src/account/sync.ts`: `staged` joins the synced game fields (spec §4.8).
- `src/turn.ts`: `stagedPlies(game, staged)`. A count that is not one whole turn of one side reads as 0, so a bad count never makes a handed-over ply undoable.
- `src/screen/play.ts`: `save()` writes the count only when more than 0 (an old save keeps its JSON). `replay()` reads the count once, before the old-link pass, and gives it to the start-up restore and `openSaved`. It finishes a mid-way turn (the old-link fix) only when nothing is staged, so a staged Haste first move stays open.
- `src/online/runtime.ts`: the start-up address replace; the game screens list is one constant.
- Tests: `src/turn.test.ts`, `src/screen/play.test.ts`, `src/online/runtime.test.ts`, `tools/verify-turn.mjs` (`turn` check), `tools/web-game-check.mjs` (`web-game` check).
- No file of another lane changes. No assertion is removed; the F-077 unit test gets two more assertions (its URL stays, and no replace happens).

## Acceptance

- Each new test fails on the old code and passes with the fix.
- `npx tsc --noEmit -p .` passes.
- The touched unit test files pass through `npm test` with `KINGDOWN_TEST_FILE`.
- `npm run check:browser turn home lesson-return account` passes.
- `npm run check:browser web-game` passes (F-077's recovery case is in the same run).

## Result

### F-010: cause

`save()` wrote every ply of the history, staged plies too, but not the turn start. The start-up restore then set the turn start to the full history (`handOver`), so a reload handed the staged turn over. `replay()` also finished a mid-way turn with a pass, so a staged Haste first move got its pass at the reload.

### F-035: cause

`createBrowserRuntime` (`src/online/runtime.ts`) applies the entry address, then the durable receipt selects its own game and screen (by design). Nothing changed the address: `route()` skips a game screen until a view arrives, the mount keeps a pending command's screen with `route` off, and move and computer replies are not selection tools. So the source board showed under `/play/`.

### Evidence: red on the old code

- `npm run check:browser turn` (new reload case, old `play.ts`): `FAIL turn 12.8 s AssertionError [ERR_ASSERTION]: the reload does not hand the turn over`, actual `'Black to move'`, expected `'White to move'`. This is the playtest result.
- `KINGDOWN_TEST_FILE='{src/screen/play.test.ts,src/turn.test.ts}' npm test` (old `play.ts`): 3 failed, 50 passed. The save has no `staged` (`expected undefined to be 1`), and the restore gives `[0, false]` for the staged count and Undo, not `[1, true]`. The Haste case alone (`KINGDOWN_TEST_NAME='Haste first move'`): `expected [ [ 'Ra1-a4!H' ], undefined ] to deeply equal [ [ 'Ra1-a4!H' ], 1 ]`. Before the helper existed, `src/turn.test.ts` stopped at the type check (TS2305).
- `KINGDOWN_TEST_FILE=src/online/runtime.test.ts` (old `runtime.ts`): the 3 new cases fail, with the URL `'/play/'`, `'/play/settings'` and `'/j'` where `'/g/11111111-1111-4111-8111-111111111111'` is expected.
- `PLUGIN_TEST_DATABASE_URL=… npm run check:browser web-game` (new solo case, old `runtime.ts`): `FAIL web-game 34.6 s AssertionError [ERR_ASSERTION]: Recovery names the source game in the URL`, actual `'/play/'`, expected `'/g/48b75577-d7e3-8865-98a7-2a6cdd02c29f'`. The source board showed. This is the playtest result.

### Evidence: green with the fix

- `npx tsc --noEmit -p .`: exit 0.
- `KINGDOWN_TEST_FILE='{src/screen/play.test.ts,src/turn.test.ts,src/online/runtime.test.ts,src/account/sync.test.ts,src/screen/save.test.ts}' npm test`: 5 files, 124 tests pass (with the type check of `npm test`; the count includes the review regression below). This includes the F-077 unit tests, `keeps the URL game while recovering another game's kingdown_computer` and `…kingdown_move`, now with two more assertions each.
- `npm run check:browser turn home lesson-return account`: all 4 pass (18.9 s, 11.8 s, 6.9 s, 59.7 s). `turn` prints `ok reload keeps a staged turn, a computer wait and a Haste first move; End turn commits`.
- `PLUGIN_TEST_DATABASE_URL=… npm run check:browser web-game`: pass, 42.5 s. The same run keeps the F-077 case (a different game's URL stays selected while the source command recovers, and Retry sends the exact payload once) and prints `web: a fresh /play/ load recovers a pending computer reply under its source game URL`. The new case checks: the URL is `/g/<source>` when the board shows; the computer reply comes once (revision + 1, last command `computer`); the URL stays after the reply; Play opens the list at `/play/`.
- `PLUGIN_TEST_DATABASE_URL=… npm run check:browser web-online`: pass, 119.3 s (the local reload after End turn and the account entry).
- Test database: `lane_routes_test` on the local 55432 cluster.

### Independent review

A separate reviewer (`agent-roster` `sol:xhigh`, read-only) found one P2 fault and no other blocking finding. An old mid-Haste save with `moves: ['Ra1-a4!H']` and a bad `staged: 2` was read twice: `replay()` rejected the count and added the pass `--`, then the restore read the same count against the longer history, accepted it, and set the turn start to 0. Undo could then take back both handed-over plies. Fix: `replay()` reads the count once, before the pass, and returns it with the game. Regression: `src/screen/play.test.ts`, "hands over an old mid-Haste save whose count is too large, also after its pass" (restore and `openSaved`). Before the fix: `expected [ 2, true ] to deeply equal [ +0, false ]`. After the fix it passes, and `npm run check:browser turn home lesson-return account` passes again (15.9 s, 10.6 s, 5.8 s, 56.0 s).

### Limits

- No staging deploy and no saved-account repeat: the coordinating session owns deploys.
- Not run: the full `npm test` suite (the test lock is shared by all lanes), WebKit and Firefox for `web-game`, and `recovery-consumers` (it needs an external recovery output).

## Owner decisions

1. F-010 keeps the staged turn over a reload (spec §4.8) and so reverses fast-plan item Y2. On no: the restore drops the staged plies instead (a clean Undo), one line in `restore()`.
2. F-035 replaces the address (`replaceState`). On no: push it instead, and Back then shows the games list.
