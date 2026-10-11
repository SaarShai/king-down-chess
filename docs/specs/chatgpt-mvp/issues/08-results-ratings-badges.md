# 08 · Results: history, ratings and badges

Status: claimed
Type: AFK
Size: M
Blocked by: 06

## Scope

- At the end of a game (any end: mate, draw, resign, timeout, claim), in the same transaction:
  - games between people: update both Glicko-2 ratings with the branch's `src/online/glicko2.ts`; new tables for ratings and rating history; aborted and `no_start` games change nothing;
  - badges: a pure function (the finished game + the player's earlier record → the badges earned); the 10 badges of spec Q12; each badge is written once.
- `history(actor, before?, limit 20)`: finished games newest first: date, kind, opponent (handle and picture, or "Computer · <level>"), colour, result and reason, the features (fairy, arrangement, classic, cards, powers, the player's king and power).
- `record(actor)`: totals (played, won, drawn, lost), rating with `provisional`, badges with the date earned.

## Acceptance

- Unit tests for the badge function (each badge, and "Royal Collection" over six games).
- Database tests: a rating update after a game between people, none after a computer game or an abort; badges once; history order and paging; totals.
- `npm test` with the test database passes.

## Notes

- Explorer note B §3.8, §4 (the score, history), §11.

## Plan

1. Test two human games that commit in reverse date order. Keep the latest rated game date.
2. Extend the long-break test with another human game. Check both saved ratings, RD and volatility. Show that the test fails when the update ignores idle days.
3. Finish a random game. Check both ratings, saved Stranger Match badges, history and totals. Show that the test fails when random games are not rated.
4. Run `npm test`, commit, merge the current integration tip, run `npm test` again and push this branch.

Use the ticket's game-service database seam. Checks pass when the reverse-date test fails before the SQL fix, both missing checks detect their fault, and all tests pass with the fixes. Use the local `kingdown_mvp08_test` database and its separate results copy. Ticket 07 is not in the integration branch at the start. The random-game test uses ticket 06's service: create a game of kind `random`, then join its second seat.

## Result

- The end transaction writes both human ratings, rating history and new badges. Computer games do not change ratings. Abort and no start do not change the record.
- The pure badge function covers all 10 badges. Each stored badge keeps its first date. Player row locks keep updates safe when two games end at once.
- `GameService` and `PluginService` provide `history(actor, before?, limit = 20)` and `record(actor)`. History returns `games` and `next_before`. Pass that cursor back without a change. Each entry has the opponent's handle and icon preset, or the computer level, and the player's game features. The record has totals, rating with `provisional`, and badges with dates.
- Migration 0012 adds the three result tables. The runtime grants and start check cover them. Test role changes use the shared role lock.
- Checks before and after merge of integration tip `b02de05f`: `npm test` passes 141 files, 2,224 tests and 50 art tests; 8 tests skip. Badge unit checks: 11 pass. Result database checks: 16 pass. Start checks: 3 pass. `git diff --check` passes. The test database is `kingdown_mvp08_test`, with a separate results copy.
- No page changes. Page size and browser checks do not apply. Ticket 10 connects the result methods to the profile tool; ticket 16 builds the profile page.
- Open items: none.
