# 05 · Match worker: the open card deal, Classic and the computer levels

Status: claimed
Type: AFK
Size: M
Blocked by: 03

## Scope

- Accept a public mirror deal in the match setup (the same hand for both sides; no piles). The snapshot keeps the hands and the played-card state. Keep the refusal for any other hand or pile.
- Accept the classic flag of ticket 03; the FEN input check accepts castling and en-passant fields when it is on.
- `chooseMove` takes a level (`beginner`, `casual`, `club`, `strong`) and applies the website's skill settings (`src/ai/skill.ts`: time cap, temperature, random-move chance), with all searches under the 30-second function limit.
- The computer plays cards in card games (the search supports it).
- Saves and replay keep working; a new engine bundle goes into `engines/`.

## Acceptance

- Worker tests: a card game plays a card and replays from its save; the hand shows in the snapshot; a private hand is still refused; a classic game castles and replays; each level returns a legal move within its cap.
- With the classic flag on, the worker accepts a canonical FEN with castling rights and an en-passant square (`… w KQkq -`, `… b - e3`); with it off, it still refuses them (that test exists in `src/match/match.test.ts`). With a Mercy king, a classic game plays `O-O` through the worker and through `chooseMove`, and a reload replays it (review of ticket 03, findings 1 and 4).
- Ticket 04's toggle-mix test (`src/match/setup.test.ts`, "builds a game the match module starts for each toggle mix") passes the cards mix and the classic mix to `createMatch` with `buildSetup`'s `hand` and `classic` in the match setup, and asserts that the snapshot shows the hand and that the classic game can castle (review of ticket 04, finding 2).
- `npm test`, `npm run plugin:build`, `npm run plugin:smoke` pass.

## Notes

- Explorer note C §6.5, §7, §8; note A §5. The refusal: `src/match/worker.ts` ("Private card data unsupported").

## Plan and checks

1. Check the prior changes through the public match and setup APIs. Keep the valid changes.
2. Add one failing test for each gap. Fix it, then check the next gap. Pass the hand and Classic flag from the setup module to the worker.
3. Build and archive the new engine. Keep all old bundles. Check saves, all four levels, the server and both plugin browser checks.
4. Commit the result. Merge the current integration branch, run `npm test` again and push this branch.

The checks use the ticket's match tests, setup tests and source-free runtime. Database checks use `kingdown_mvp05_test` on `127.0.0.1:55432`.

## Search time

Node 24.21.0 runs the compiled worker on this Mac. Each cell gives the largest time in ms from three calls after `e2-e4`, `e7-e5`. Each call returns a legal move. All 36 calls leave the position unchanged.

| Level | Budget, ms | Classic | Fairy and powers | Fairy, cards and powers |
|---|---:|---:|---:|---:|
| Beginner | 700 | 704 | 703 | 707 |
| Casual | 800 | 804 | 806 | 806 |
| Club | 800 | 806 | 805 | 807 |
| Strong | 2,500 | 2,503 | 2,508 | 2,504 |

The worker checks the clock during the search. The largest excess is 8 ms. All calls stay below the 15-second worker watchdog and the 30-second function limit. Match creation takes 35, 23 and 26 ms for these three setups. Fairy uses `RAGKLMSO`, Spirit with Mercy and Shadow with Darkness. The card case adds Freeze, Strike, Burn and Rally.

The Strong limit test fails at 5,004 ms before the fix. A caller can now shorten a level's time budget but cannot raise it.

## Result

The worker accepts a public mirror hand and Classic. The computer plays a card. The hand, played-card state and Mercy castling (`O-O`) survive save and reload. Private hands, piles and hands with a king power that has uses are refused. All four levels use the shared website settings.

`buildSetup` now returns `MatchSetup` directly, with `classic` and `hand` in it. The service can call `createMatch(buildSetup(...))`. No caller needs to merge separate fields.

Checks use Node 24.21.0 and the ticket's disposable database:

- `npm test`: 136 files pass; 2,131 tests pass, 8 skip; all 50 document checks pass.
- Test-first checks: the empty-hand test fails before its fix; the Strong cap test fails before its fix. The match file then passes all 37 tests. The old smoke hand assertion fails and its public-hand check then passes.
- `npm run plugin:build`: passes. It adds engine `a5750f9695e8f3cc341a69fb02bd709eed142ce7a36b2c69eaedd612fe1f5d16` and its save fixture. Both old bundles stay.
- `npm run plugin:smoke`: passes; all 3 archived engines load and accept a move.
- `npm run plugin:server:check`: passes against real PostgreSQL.
- `npm run check:browser plugin-ui plugin-ui-http`: both checks pass (16.4 s and 15.4 s).
- Page: 436,267 bytes; HTTP resource: 437,582 JSON bytes. All 20 art files pass the server check.

Integration check: merge `claude/chatgpt-mvp` at `b0e16067`. The merge has no conflict and adds two ticket updates. `npm test` passes again: 136 files, 2,131 tests and 50 document checks; 8 tests skip.

Open items: none in this ticket. Ticket 06 selects the worker level in the game service.

## Review

Plan: confirm each finding, then add its failing test before its fix. Check the old saves through the match API. Check all FEN power forms and every hand slot. Use a controlled clock and random source to check each worker level. Keep each saved engine bundle. Build the new bundle, run all required checks with `kingdown_mvp05_test`, then commit and push this branch.

Pass criteria: both old bundles accept a level request at their built-in strength and return empty public hands. Each power form written by `toFen` can start, save and reload a match. Sparse and null hands reject. Each level uses its website time cap, score band and random-move chance. The full tests, plugin build, smoke, server check and both browser checks pass.

All five findings are confirmed in the code. Findings 1 and 2 affect the two bundles before the public-hand worker. Finding 3 also affects Rage, RageB, last-played cards and drawn-card counts. Finding 4 comes from `Array.some`, which skips holes. Finding 5 needs controlled worker tests; a legal move alone does not prove a level setting.

1. **Old-save levels:** the API removes a valid level option for the two old engines. They keep their built-in strength and their time/depth controls. The API comment and match contract state the limit. The two archive tests fail with `Malformed input` before the fix. They then pass for all four level names, keep the save and position unchanged, and refuse an invalid level.
2. **Old-save hands:** the API adds `[[], []]` to each old snapshot. It covers reads, moves and command retries. The two archive tests fail on `hands[0]` before the fix. They then pass, including detached arrays and save/reload. `npm test` with `KINGDOWN_TEST_FILE=tools/engines.test.ts` passes all 11 tests after both fixes.
3. **FEN power state:** the input check accepts the writer's Ice Wall and Firewall flags, Rage/RageB/Rally suffixes, last-played cards and drawn-card counts. It checks card names, count bounds, lifetimes and canonical form. Nine new cases fail before the fix. All 62 match tests then pass. Round trips cover both marking sides, three mark kinds, lifetimes 0/1/2, two marks together, and all other power fields. Ten cases refuse invalid forms.
4. **Hand slots:** validation iterates a dense copy of the hand, so it checks empty slots as `undefined`. Two sparse-hand tests fail before the fix. All 66 match tests then pass, including sparse and null slots. A valid public hand still saves and reloads.
