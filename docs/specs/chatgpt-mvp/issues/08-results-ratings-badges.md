# 08 · Results: history, ratings and badges

Status: resolved
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

1. Test each badge through the pure badge function. Check six king wins and repeat awards.
2. Test the game service with a local test database. Add migration 0012 and runtime grants. Write ratings and badges in the game end transaction.
3. Add finished history with a page cursor and the player record. Check order, totals, computer games, aborts, retries and reads with a read-only connection.
4. Run `npm test`, commit, merge the integration tip, run `npm test` again and push this branch.

Checks pass when every badge has a unit test and database tests prove one result update per game, both human ratings, no rating for computer or aborted games, and complete history pages.

## Result

- The end transaction writes both human ratings, rating history and new badges. Computer games do not change ratings. Abort and no start do not change the record.
- The pure badge function covers all 10 badges. Each stored badge keeps its first date. Player row locks keep updates safe when two games end at once.
- `GameService` and `PluginService` provide `history(actor, before?, limit = 20)` and `record(actor)`. History returns `games` and `next_before`. Pass that cursor back without a change. Each entry has the opponent's handle and icon preset, or the computer level, and the player's game features. The record has totals, rating with `provisional`, and badges with dates.
- Migration 0012 adds the three result tables. The runtime grants and start check cover them. Test role changes use the shared role lock.
- Checks before the integration merge: `npm test` passes 141 files, 2,224 tests and 50 art tests; 8 tests skip. Badge unit checks: 11 pass. Result database checks: 16 pass. Start checks: 3 pass. The test database is `kingdown_mvp08_test`, with a separate results copy.
- No page changes. Page size and browser checks do not apply. Ticket 10 connects the result methods to the profile tool; ticket 16 builds the profile page.
- Open items: none.
