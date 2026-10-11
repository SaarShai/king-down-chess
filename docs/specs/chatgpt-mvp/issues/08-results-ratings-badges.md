# 08 · Results: history, ratings and badges

Status: ready-for-agent
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
